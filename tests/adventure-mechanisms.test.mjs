import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createDocument } from '../src/model.mjs';
import { createRun, stepRun, canEnter, gateIsOpen, hazardActive, missionComplete, scoutHint } from '../src/adventure.mjs';
import { switchChange, mechanismPreview, choiceAvailable, wallet } from '../src/adventure-mechanisms.mjs';
import { threatForecast } from '../src/adventure-intel.mjs';
import { createCampaign } from '../src/adventure-levels.mjs';
import { restoreJourney, serializeJourney, advanceJourney, JOURNEY_RULES } from '../src/adventure-journey.mjs';
const p = (x, y, id = 'item') => ({ x, y, id });
const base = overrides => ({ id: 'controls', name: 'Controls', map: createDocument('Controls', 12, 8), start: p(2, 2), exit: p(10, 6), lanterns: [p(10, 1, 'light')],
  switches: [{ ...p(2, 1, 'pump'), name: 'Pump', initial: false }],
  gates: [{ ...p(4, 2, 'bridge'), type: 'switch', controls: [{ id: 'pump', on: true }] }],
  hazards: [{ ...p(2, 2), disabledBy: 'pump', period: 4, phases: [0, 1, 2, 3] }], ...overrides });
const steps = (run, actions) => actions.reduce(stepRun, run);

test('valves change crossings and suppress hazards on their activation turn without mutating earlier state', () => {
  const initial = createRun(base()), before = structuredClone(initial);
  assert.equal(canEnter(initial, p(4, 2)), false); assert.match(mechanismPreview(initial, initial.stage.switches[0]), /1 crossing cells open/);
  const on = stepRun(initial, 'interact:pump');
  assert.equal(on.turns, 1); assert.equal(on.switches.pump, true); assert.equal(on.health, 3);
  assert.equal(canEnter(on, p(4, 2)), true); assert.equal(hazardActive(on, on.stage.hazards[0]), false);
  const off = stepRun(on, 'interact:pump'); assert.equal(off.switches.pump, false); assert.equal(off.health, 2);
  assert.deepEqual(initial, before); assert.equal(on.switches.pump, true);
});

test('all four shutter combinations open exactly their advertised glasshouse arch', () => {
  const initial = createRun(createCampaign()[7]);
  for (const glass of [false, true]) for (const moss of [false, true]) {
    const run = { ...initial, switches: { ...initial.switches, glass, moss } };
    const open = run.stage.gates.filter(gate => gate.type === 'switch' && gateIsOpen(run, gate)).map(gate => gate.id);
    assert.deepEqual(open, glass && moss ? ['middle-arch'] : glass ? ['north-arch'] : moss ? ['south-arch'] : []);
  }
});

test('an occupied crossing cannot close under a player, crate, companion, hunter, or patrol', () => {
  const initial = createRun(base({ hazards: [], switches: [{ ...p(2, 1, 'pump'), name: 'Pump', initial: true }] }));
  const occupied = p(4, 2);
  for (const occupants of [{ player: occupied }, { crates: [occupied] }, { companions: [occupied] }, { hunters: [occupied] }, { enemies: [{ route: [occupied], index: 0 }] }]) {
    const run = { ...initial, ...occupants }, result = switchChange(run, { pump: false });
    assert.match(result.error, /occupied/); assert.equal(run.switches.pump, true);
  }
  const run = { ...initial, crates: [occupied] }, blocked = stepRun(run, 'interact:pump');
  assert.equal(blocked.turns, 0); assert.equal(blocked.switches.pump, true); assert.match(blocked.message, /occupied/);
  assert.equal(switchChange(initial, { pump: false }).switches.pump, false);
});

test('multiple nearby interactions remain individually usable at the rule layer', () => {
  const run = createRun(base({ hazards: [], npcs: [{ ...p(1, 2, 'keeper'), name: 'Keeper', lines: ['Hello'], choices: [] }], supplies: [p(2, 3, 'pack')] }));
  assert.equal(stepRun(run, 'interact:keeper').dialogue, 'keeper');
  assert.equal(stepRun(run, 'interact:pump').switches.pump, true);
  assert.deepEqual(stepRun(run, 'interact:pack').usedSupplies, ['pack']);
});

test('coin trades reject unaffordable choices, spend once, and preserve collected treasure requirements', () => {
  const npc = { ...p(1, 2, 'trader'), name: 'Rook', lines: ['Trade'], choices: [{ id: 'parcel', label: 'Two coins', response: 'Here', cost: 2, effect: { decoys: 2 } }] };
  const initial = createRun(base({ hazards: [], coins: [p(3, 2, 'a'), p(4, 2, 'b')], gates: [], npcs: [npc], requireCoins: true }));
  const talk = stepRun(initial, 'interact:trader'), refused = stepRun(talk, 'choose:parcel');
  assert.equal(choiceAvailable(talk, npc.choices[0]), false); assert.equal(refused.spentCoins, 0); assert.deepEqual(refused.choices, {}); assert.match(refused.message, /2 unspent/);
  const collected = steps(initial, ['right', 'right', 'left', 'left', 'interact:trader']);
  assert.equal(wallet(collected), 2); assert.equal(choiceAvailable(collected, npc.choices[0]), true);
  const paid = stepRun(collected, 'choose:parcel');
  assert.equal(paid.spentCoins, 2); assert.equal(wallet(paid), 0); assert.equal(paid.decoys, 3);
  assert.equal(paid.collectedCoins.length, 2); assert.equal(paid.turns, collected.turns);
  assert.equal(stepRun(paid, 'choose:parcel'), paid); assert.equal(initial.spentCoins, 0);
});

test('a dialogue route choice opens a real crossing and blocked changes cannot charge coins or consume the choice', () => {
  const npc = { ...p(1, 2, 'keeper'), name: 'Luma', lines: ['Choose'], choices: [{ id: 'route', label: 'Open route', response: 'Open', effect: { switches: { pump: true }, health: 1 } }] };
  const run = createRun(base({ hazards: [], npcs: [npc] }), { difficulty: 'nemesis' });
  const chosen = steps(run, ['interact:keeper', 'choose:route']);
  assert.equal(chosen.switches.pump, true); assert.equal(chosen.health, 3); assert.equal(chosen.turns, 0);
  const closingNpc = { ...npc, choices: [{ ...npc.choices[0], effect: { switches: { pump: false } } }] };
  const crowded = createRun(base({ hazards: [], npcs: [closingNpc], switches: [{ ...p(2, 1, 'pump'), name: 'Pump', initial: true }], crates: [p(4, 2, 'crate')] }));
  const blocked = steps(crowded, ['interact:keeper', 'choose:route']); assert.deepEqual(blocked.choices, {}); assert.equal(blocked.switches.pump, true); assert.match(blocked.message, /occupied/);
});

test('required valve settings are real exit goals and can be restored after reversing them', () => {
  const initial = createRun(base({ hazards: [], gates: [], exit: p(2, 2), lanterns: [p(2, 2, 'light')], requiredSwitches: ['pump'] }));
  const waiting = stepRun(initial, 'wait'); assert.equal(waiting.status, 'playing'); assert.equal(missionComplete(waiting), false); assert.match(waiting.message, /activate pump/);
  assert.equal(stepRun(waiting, 'interact:pump').status, 'won');
});

test('malformed switch definitions, dangling references, and impossible trade prices are rejected', () => {
  for (const overrides of [
    { switches: [{ ...p(2, 1, 'pump'), name: 'Pump', initial: 'yes' }] },
    { requiredSwitches: ['missing'] }, { gates: [{ ...p(4, 2), type: 'switch', controls: [{ id: 'missing', on: true }] }] },
    { gates: [{ ...p(4, 2), type: 'switch', controls: [] }] },
    { hazards: [{ ...p(2, 2), period: 4, phases: [0], disabledBy: 'missing' }] },
    { npcs: [{ ...p(1, 2), name: 'Seller', lines: [], choices: [{ id: 'bad', cost: 99 }] }] },
  ]) assert.throws(() => createRun(base(overrides)));
});

test('the next-turn forecast is read-only, describes committed warnings, and does not reveal distant enemies', () => {
  const run = createRun(base({ hazards: [{ ...p(2, 3), period: 4, phases: [1] }], hunters: [
    { id: 'near', route: [p(4, 2), p(5, 2)], vision: 7 }, { id: 'far', route: [p(11, 7), p(10, 7)], vision: 7 }], restrictions: { noDash: true } }));
  const before = structuredClone(run), lines = threatForecast(run).join('\n');
  assert.match(lines, /next step column/); assert.match(lines, /Embers burn next turn: column 3, row 4/); assert.match(lines, /dashes are disabled/);
  assert.equal(lines.includes('column 12, row 8'), false); assert.deepEqual(run, before);
});

test('scout advice finds a reachable control before an unreachable objective and follows required pump settings', () => {
  const glass = createRun(createCampaign()[7]);
  const afterDew = { ...glass, relayProgress: 1 };
  assert.match(scoutHint(afterDew), /Glass shutter lies/);
  assert.match(scoutHint(createRun(createCampaign()[6])), /North intake lies/);
});

const legacy = JSON.parse(readFileSync(new URL('fixtures/legacy-checkpoints.json', import.meta.url), 'utf8'));
for (const fixture of legacy) test(`0.5 save migration preserves ${fixture.id}`, () => {
  const restored = restoreJourney(JSON.stringify(fixture.checkpoint));
  assert.equal(restored.phase, fixture.phase); assert.equal(restored.run.turns, fixture.turns); assert.deepEqual(restored.run.player, fixture.player);
  assert.deepEqual(restored.journal, fixture.checkpoint.state.journal);
  const serialized = serializeJourney(restored); assert.equal(JSON.parse(serialized).rules, JOURNEY_RULES);
  assert.deepEqual(restoreJourney(serialized).run, restored.run);
  const continued = advanceJourney(restored, restored.run.dialogue ? 'close-dialogue' : 'wait');
  assert.deepEqual(restoreJourney(serializeJourney(continued)).run, continued.run);
});

test('12,000 exploratory inputs on the new missions preserve wallet, resources, reversible floors, and prior state', () => {
  let randomState = 793;
  const random = length => { randomState = Math.imul(randomState, 1664525) + 1013904223 >>> 0; return randomState % length; };
  for (const stage of createCampaign().slice(6, 9)) for (const difficulty of ['trail', 'nemesis']) {
    let run = createRun(stage, { difficulty });
    for (let i = 0; i < 2000; i++) {
      if (run.status !== 'playing') run = createRun(stage, { difficulty, memory: run.memory });
      const choices = run.dialogue ? ['close-dialogue', ...(run.stage.npcs.find(npc => npc.id === run.dialogue).choices || []).map(choice => `choose:${choice.id}`)]
        : ['up', 'right', 'down', 'left', 'dash-up', 'dash-right', 'dash-down', 'dash-left', 'shield', 'decoy', 'wait', 'drop-cargo',
          ...[...stage.npcs, ...stage.switches, ...(stage.relays || []), ...stage.supplies].map(item => `interact:${item.id}`)];
      const prior = run, priorSwitches = { ...run.switches }; run = stepRun(run, choices[random(choices.length)]);
      assert.deepEqual(prior.switches, priorSwitches); assert.ok(wallet(run) >= 0 && wallet(run) <= stage.coins.length);
      assert.ok(run.health >= 0 && run.health <= 3); assert.ok(run.energy >= 0 && run.energy <= 3);
      assert.ok(run.decoys >= 0 && run.decoys <= 3 && run.shields >= 0 && run.shields <= 3);
      assert.equal(canEnter(run, run.player), true, 'World changes cannot close the floor beneath the player.');
      assert.ok(Object.values(run.switches).every(value => typeof value === 'boolean'));
    }
  }
});

test('a paid parcel cannot waste coins when its supplies are already full, while free story choices remain available', () => {
  const npc = { ...p(1, 2, 'trader'), name: 'Rook', lines: ['Trade'], choices: [{ id: 'parcel', label: 'Two coins', response: 'Here', cost: 2, effect: { decoys: 2 } }] };
  const initial = createRun(base({ hazards: [], gates: [], coins: [p(3, 2, 'a'), p(4, 2, 'b')], npcs: [npc] }), { loadout: { health: 3, decoys: 3, shields: 3 } });
  const talk = steps(initial, ['right', 'right', 'left', 'left', 'interact:trader']);
  assert.equal(choiceAvailable(talk, npc.choices[0]), false);
  const refused = stepRun(talk, 'choose:parcel'); assert.equal(refused.spentCoins, 0); assert.deepEqual(refused.choices, {}); assert.match(refused.message, /fully stocked/);
  assert.equal(choiceAvailable(talk, { ...npc.choices[0], cost: 0 }), true);
});

test('speaking without making a choice records the keeper once and does not train or advance the world', () => {
  const npc = { ...p(1, 2, 'sen'), name: 'Sen', lines: ['Remember the shutters.'], choices: [] };
  const initial = createRun(base({ hazards: [], npcs: [npc] }));
  const talk = stepRun(initial, 'interact:sen'); assert.deepEqual(talk.talkedTo, ['sen']); assert.deepEqual(initial.talkedTo, []);
  const again = steps(talk, ['close-dialogue', 'interact:sen']);
  assert.deepEqual(again.talkedTo, ['sen']); assert.equal(again.turns, 0); assert.equal(again.memory.observations, 0);
});

test('Luma’s ferry choice cannot be bypassed by turning its keeper-operated control after taking supplies', () => {
  const stage = createCampaign()[6], initial = createRun(stage);
  const supplies = steps(initial, ['interact:luma', 'choose:supplies', 'close-dialogue', 'dash-right', 'right', 'dash-right']);
  assert.deepEqual(supplies.player, { x: 8, y: 10 }); assert.equal(supplies.switches.reed, false);
  assert.equal(stepRun(supplies, 'interact:reed'), supplies);
  const ferry = steps(initial, ['interact:luma', 'choose:ferry']); assert.equal(ferry.switches.reed, true); assert.equal(ferry.turns, 0);
});
