import test from 'node:test';
import assert from 'node:assert/strict';
import { createDocument } from '../src/model.mjs';
import { createRun, stepRun, nearbyInteractions, gateIsOpen, hazardActive, missionComplete, resultFor, turnTarget, recordId, scoutHint } from '../src/adventure.mjs';
import { freshMemory, learnMove, predictMove, memorySummary, loadMemory, saveMemory, normalizeMemory, MEMORY_KEY } from '../src/adventure-brain.mjs';
import { planHunters, nextPathStep } from '../src/adventure-tactics.mjs';
import { canEnter } from '../src/adventure.mjs';
import { createCampaign } from '../src/adventure-levels.mjs';
const p = (x, y, id = 'item') => ({ x, y, id });
const stage = (overrides = {}) => ({ id: 'test', name: 'Tactics', map: createDocument('Tactics', 10, 8),
  start: p(1, 2), exit: p(8, 6), lanterns: [p(8, 1, 'light')], par: 40, ...overrides });
const steps = (run, actions) => actions.reduce(stepRun, run);
const trained = actions => actions.reduce(learnMove, freshMemory());
const watcher = (route = [p(6, 2), p(6, 3)]) => ({ id: 'hunter', route, vision: 8 });

test('the movement learner recognizes repeated transitions, adapts to new habits, and keeps old snapshots unchanged', () => {
  const initial = freshMemory(), pattern = Array.from({ length: 12 }, () => ['up', 'right']).flat();
  const memory = trained(pattern);
  assert.equal(initial.observations, 0); assert.equal(memory.observations, 24);
  assert.equal(predictMove(memory).action, 'up'); assert.equal(predictMove(memory).conditional, true);
  assert.equal(predictMove(memory).confidence, 1); assert.match(memorySummary(memory), /after right/);
  const changed = Array(500).fill('left').reduce(learnMove, memory);
  assert.equal(predictMove(changed).action, 'left'); assert.equal(memory.last, 'right');
  assert.ok(Object.values(changed.counts).reduce((a, b) => a + b, 0) <= 128);
  assert.equal(learnMove(memory, 'interact:person'), memory, 'Conversations are not movement training samples.');
});

test('learning storage is normalized, bounded, isolated, and safe when storage is corrupt or unavailable', () => {
  const values = new Map([['tilewright.document.v1', 'map'], ['tilewright.adventures.v1', 'bests']]);
  const store = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const memory = trained(Array(20).fill('dash-right')); assert.equal(saveMemory(store, memory), true);
  assert.deepEqual(loadMemory(store), memory); assert.equal(values.get('tilewright.document.v1'), 'map');
  assert.equal(values.get('tilewright.adventures.v1'), 'bests');
  saveMemory(store, freshMemory()); assert.equal(loadMemory(store).observations, 0);
  for (const value of ['{', 'x'.repeat(12_001), 'null', '{"version":9}', '{"version":1,"memory":{"counts":{"up":-1},"observations":-1}}']) {
    store.setItem(MEMORY_KEY, value); assert.deepEqual(loadMemory(store), freshMemory());
  }
  const denied = { getItem() { throw Error('denied'); }, setItem() { throw Error('quota'); } };
  assert.deepEqual(loadMemory(denied), freshMemory()); assert.equal(saveMemory(denied, memory), false);
  const clean = normalizeMemory({ observations: 1e10, last: '<script>', counts: { up: Infinity }, secret: 'discard' });
  assert.equal(clean.observations, 99_999); assert.equal(clean.last, null); assert.equal('secret' in clean, false);
});

test('hunters actually change their intercept route based on learned movement', () => {
  const definition = stage({ start: p(4, 4), hunters: [watcher([p(6, 2), p(7, 2)])] });
  const west = createRun(definition, { memory: trained(Array(16).fill('dash-left')) });
  const north = createRun(definition, { memory: trained(Array(16).fill('dash-up')) });
  assert.equal(west.hunters[0].mode, 'intercepting'); assert.equal(north.hunters[0].mode, 'intercepting');
  assert.notDeepEqual(west.hunters[0].intent, north.hunters[0].intent);
  assert.equal(west.hunters[0].intent.y, 3, 'The westbound interception cuts down across the player’s lane.');
  assert.equal(north.hunters[0].intent.x, 5, 'The northbound interception guards the upper lane.');
});

test('hunters execute the previously displayed step, not a counter chosen after the input', () => {
  const initial = createRun(stage({ hunters: [watcher()] }));
  const committed = initial.hunters[0].intent;
  const up = stepRun(initial, 'up'), down = stepRun(initial, 'down');
  assert.deepEqual({ x: up.hunters[0].x, y: up.hunters[0].y }, committed);
  assert.deepEqual({ x: down.hunters[0].x, y: down.hunters[0].y }, committed);
  assert.equal(initial.memory.observations, 0); assert.equal(up.memory.observations, 1);
  assert.equal(stepRun(initial, 'left').memory.observations, 1);
  const edge = createRun(stage({ start: p(0, 2) }));
  assert.equal(stepRun(edge, 'left').memory.observations, 0, 'Blocked inputs do not train the predictor.');
});

test('walls and quiet fern cover hide the player; recent sounds attract hunters without permanent omniscience', () => {
  const covered = createRun(stage({ hunters: [watcher()], cover: [p(1, 2)] }));
  assert.equal(covered.hunters[0].mode, 'patrolling');
  const audible = { ...covered, noise: 2 };
  assert.equal(planHunters(audible, canEnter)[0].mode, 'pursuing');
  const wall = stage({ hunters: [watcher()] });
  for (let y = 0; y < 8; y++) wall.map.layers[1].tiles[y * 10 + 4] = 7;
  assert.equal(createRun(wall).hunters[0].mode, 'patrolling');
  let hidden = { ...covered, hunters: planHunters(audible, canEnter), turns: 1 };
  for (let i = 0; i < 6; i++) hidden = { ...hidden, hunters: planHunters(hidden, canEnter), turns: hidden.turns + 1 };
  assert.equal(hidden.hunters[0].memory, 0);
  assert.equal(hidden.hunters[0].mode, 'patrolling');
});

test('decoys redirect hunters and patrols, expire, and consume a bounded resource and turn', () => {
  const initial = createRun(stage({ hunters: [watcher()], enemies: [{ id: 'patrol', route: [p(6, 4), p(7, 4)] }] }));
  const lure = stepRun(initial, 'decoy');
  assert.equal(lure.decoys, 1); assert.equal(lure.turns, 1); assert.equal(lure.memory.observations, 0);
  assert.equal(lure.hunters[0].mode, 'distracted');
  let expired = lure; for (let i = 0; i < 7; i++) expired = stepRun(expired, 'wait');
  assert.ok(expired.hunters.every(hunter => hunter.mode !== 'distracted'));
  const empty = stepRun({ ...initial, decoys: 0 }, 'decoy'); assert.equal(empty.turns, 0);
});

test('shields protect the activation turn and two following turns, then expire against timed hazards', () => {
  const definition = stage({ start: p(2, 2), hazards: [{ ...p(2, 2), period: 4, phases: [0, 1, 2, 3] }] });
  let run = createRun(definition); run = stepRun(run, 'shield');
  assert.equal(run.health, 3); assert.equal(run.ward, 3); assert.equal(run.shields, 1);
  run = steps(run, ['wait', 'wait']); assert.equal(run.health, 3); assert.equal(run.ward, 1);
  run = stepRun(run, 'wait'); assert.equal(run.health, 2); assert.equal(run.ward, 0);
  const cycle = { ...p(1, 2), period: 4, phases: [2, 3] };
  assert.equal(hazardActive(run, cycle, 1), false); assert.equal(hazardActive(run, cycle, 2), true);
  const crossing = createRun(stage({ hazards: [{ ...p(2, 2), period: 4, phases: [1] }] }));
  assert.equal(stepRun(crossing, 'dash-right').health, 2, 'Dashing through an active ember still burns.');
});

test('dialogue pauses turn rules, choices grant a real loadout once, and advice can be revisited', () => {
  const npc = { ...p(1, 1, 'nia'), name: 'Nia', lines: ['Hello'], choices: [{ id: 'gift', label: 'A decoy', response: 'Here.', effect: { decoys: 1 } }] };
  const initial = createRun(stage({ npcs: [npc], hunters: [watcher()] }));
  assert.equal(nearbyInteractions(initial)[0].id, 'nia');
  const talk = stepRun(initial, 'interact:nia'); assert.equal(talk.dialogue, 'nia'); assert.equal(talk.turns, 0);
  assert.equal(stepRun(talk, 'right'), talk); assert.deepEqual(talk.hunters, initial.hunters);
  const choice = stepRun(talk, 'choose:gift'); assert.equal(choice.decoys, 3); assert.equal(choice.choices.nia, 'gift');
  assert.equal(stepRun(choice, 'choose:gift'), choice);
  const back = stepRun(choice, 'close-dialogue'); assert.equal(back.dialogue, null);
  assert.equal(stepRun(stepRun(back, 'interact:nia'), 'choose:gift').decoys, 3);
  assert.equal(canEnter(initial, npc), false, 'Keepers occupy their cells.');
  assert.equal(stepRun(initial, 'interact:absent'), initial);
});

test('ordered relays open signal gates; a wrong order resets and raises an alarm; completion stuns hunters', () => {
  const definition = stage({ start: p(2, 2), relays: [p(2, 1, 'moon'), p(3, 2, 'sun')], sequence: ['moon', 'sun'],
    gates: [{ ...p(4, 2, 'signal'), type: 'signal' }], hunters: [watcher()] });
  let run = createRun(definition); assert.equal(gateIsOpen(run, run.stage.gates[0]), false);
  run = stepRun(run, 'interact:sun'); assert.equal(run.relayProgress, 0); assert.equal(run.alarm, 6);
  run = stepRun(run, 'interact:moon'); assert.equal(run.relayProgress, 1);
  const before = run.hunters.map(h => [h.x, h.y]); run = stepRun(run, 'interact:sun');
  assert.equal(run.relayProgress, 2); assert.equal(run.alarm, 0); assert.equal(run.stun, 4);
  assert.equal(gateIsOpen(run, run.stage.gates[0]), true); assert.deepEqual(run.hunters.map(h => [h.x, h.y]), before);
  assert.equal(stepRun(run, 'interact:moon').turns, run.turns, 'Completed relays cannot trigger a new alarm.');
});

test('supplies cannot be farmed, and rescue/relay objectives are required at the exit', () => {
  const definition = stage({ lanterns: [p(2, 2, 'light')], start: p(1, 2), exit: p(3, 2), supplies: [p(1, 1, 'pack')],
    npcs: [{ ...p(3, 3, 'orin'), name: 'Orin', lines: ['Help'], choices: [] }], requiredRescues: ['orin'] });
  const initial = createRun(definition), supplied = stepRun({ ...initial, health: 2, decoys: 1, shields: 1 }, 'interact:pack');
  assert.equal(supplied.health, 3); assert.equal(supplied.decoys, 2); assert.equal(supplied.shields, 2);
  assert.equal(stepRun(supplied, 'interact:pack'), supplied);
  let run = steps(initial, ['right', 'right']); assert.equal(run.status, 'playing'); assert.equal(missionComplete(run), false);
  assert.match(run.message, /rescue orin/);
  run = steps(run, ['interact:orin', 'close-dialogue']);
  assert.equal(canEnter(run, { x: 3, y: 3 }), true, 'A rescued keeper leaves their original cell.');
  const followed = stepRun(run, 'left');
  assert.deepEqual(followed.companions, [{ id: 'orin', x: 3, y: 2 }]);
  assert.deepEqual(run.companions, [{ id: 'orin', x: 3, y: 3 }], 'Following keeps previous states immutable.');
  run = stepRun(followed, 'right'); assert.equal(run.status, 'won'); assert.equal(resultFor(run).stars, 3);
});

test('Nemesis rules have separate records, fewer starting resources, and convert introductory patrols to hunters', () => {
  const definition = createCampaign()[0], normal = createRun(definition), hard = createRun(definition, { difficulty: 'nemesis' });
  assert.equal(normal.health, 3); assert.equal(hard.health, 2); assert.equal(hard.shields, 1);
  assert.equal(hard.enemies.length, 0); assert.equal(hard.hunters.length, definition.enemies.length);
  assert.equal(recordId(normal), 'trail-1'); assert.equal(recordId(hard), 'trail-1-nemesis');
  assert.ok(turnTarget(hard) < turnTarget(normal)); assert.equal(definition.enemies.length, 1);
});

test('the final Watcher advances through three visible phases, and paths cannot cross blocked terrain', () => {
  const run = createRun(createCampaign()[5]), boss = run.hunters.find(hunter => hunter.boss);
  assert.equal(boss.phase, 1);
  assert.equal(planHunters({ ...run, collectedLanterns: ['a'] }, canEnter).find(h => h.boss).phase, 2);
  assert.equal(planHunters({ ...run, collectedLanterns: ['a', 'b'] }, canEnter).find(h => h.boss).phase, 3);
  const path = nextPathStep({ x: 0, y: 0 }, { x: 2, y: 0 }, 3, 3, p => !(p.x === 1 && p.y === 0));
  assert.deepEqual(path, { x: 0, y: 1 });
});

test('Watcher sweeps are committed before input, stop at walls, and can be escaped or shielded', () => {
  const base = createRun(stage({ start: p(3, 2), hunters: [{ ...watcher(), boss: true }] }));
  const charged = { ...base, turns: 4, collectedLanterns: ['first'] };
  charged.hunters = planHunters(charged, canEnter);
  assert.equal(charged.hunters[0].mode, 'charging sweep');
  assert.ok(charged.hunters[0].attack.some(point => point.x === 3 && point.y === 2));
  assert.equal(stepRun(charged, 'right').health, 2, 'Walking along a marked sweep is dangerous.');
  assert.equal(stepRun(charged, 'down').health, 3, 'Moving out of the marked lane avoids the sweep.');
  assert.equal(stepRun(charged, 'shield').health, 3);
  const blocked = { ...charged, walkable: [...charged.walkable] }; blocked.walkable[2 * 10 + 4] = false;
  blocked.hunters = planHunters(blocked, canEnter);
  assert.deepEqual(blocked.hunters[0].attack, [{ x: 5, y: 2 }]);
});

test('Nemesis contracts add a reinforcement and longer ember danger windows without changing the authored maps', () => {
  const definition = createCampaign()[4], before = JSON.stringify(definition);
  const normal = createRun(definition), hard = createRun(definition, { difficulty: 'nemesis' });
  assert.equal(normal.hunters.length, 2); assert.equal(hard.hunters.length, 3);
  assert.equal(hazardActive(normal, normal.stage.hazards[0], 1), false);
  assert.equal(hazardActive(hard, hard.stage.hazards[0], 1), true);
  assert.equal(JSON.stringify(definition), before);
});

test('every hard contract is winnable through normal input, dialogue, relays, rescue, and the final signal gate', async () => {
  const { readFile } = await import('node:fs/promises');
  const routes = JSON.parse(await readFile(new URL('fixtures/contract-routes.json', import.meta.url), 'utf8'));
  const expected = [78, 77, 97];
  for (const [index, definition] of createCampaign().slice(3, 6).entries()) {
    const before = JSON.stringify(definition), initial = createRun(definition);
    const won = steps(initial, routes[definition.id]);
    assert.equal(won.status, 'won', definition.name); assert.equal(missionComplete(won), true);
    assert.equal(won.turns, expected[index]); assert.equal(won.damage, 0); assert.equal(resultFor(won).stars, 3);
    assert.equal(won.relayProgress, won.stage.sequence.length);
    assert.deepEqual(won.rescued, won.stage.requiredRescues);
    assert.ok(won.memory.observations > 30, 'Adaptive enemies learn throughout the real playthrough.');
    assert.equal(initial.memory.observations, 0); assert.equal(JSON.stringify(definition), before);
  }
});

test('all three contracts remain beatable under Nemesis rules with reinforcements, learned movement, and longer hazards', async () => {
  const { readFile } = await import('node:fs/promises');
  const routes = JSON.parse(await readFile(new URL('fixtures/nemesis-routes.json', import.meta.url), 'utf8'));
  const turns = [];
  for (const definition of createCampaign().slice(3, 6)) {
    const won = steps(createRun(definition, { difficulty: 'nemesis' }), routes[definition.id]);
    assert.equal(won.status, 'won', definition.name); assert.equal(resultFor(won).stars, 3); assert.equal(won.damage, 0);
    assert.equal(won.hunters.length, 3); assert.equal(missionComplete(won), true); turns.push(won.turns);
  }
  assert.deepEqual(turns, [78, 78, 104]);
});

test('scout advice follows relay and rescue objectives instead of sending an unfinished mission to the exit', () => {
  const rescue = createRun(createCampaign()[3]);
  const ready = { ...rescue, collectedLanterns: rescue.stage.lanterns.map(item => item.id),
    collectedKeys: rescue.stage.keys.map(item => item.id), openGates: rescue.stage.gates.filter(gate => gate.type === 'key').map(gate => gate.id) };
  assert.match(scoutHint(ready), /Orin lies/);
  const heist = createRun(createCampaign()[4]); assert.match(scoutHint(heist), /Copper bell/);
});
