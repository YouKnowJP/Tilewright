import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createCampaign } from '../src/adventure-levels.mjs';
import { createRun, stepRun, resultFor, missionComplete, canEnter, gateIsOpen } from '../src/adventure.mjs';
const fixtures = JSON.parse(readFileSync(new URL('fixtures/horizon-routes.json', import.meta.url), 'utf8'));
const previous = JSON.parse(readFileSync(new URL('fixtures/pre-horizon-campaign.json', import.meta.url), 'utf8'));

for (const fixture of fixtures) test(`horizon clean public-action win: ${fixture.id}/${fixture.difficulty}/choice ${fixture.branch}`, () => {
  const stage = createCampaign().find(stage => stage.id === fixture.id), original = structuredClone(stage);
  const initial = createRun(stage, { difficulty: fixture.difficulty }); let upperCrossing = false;
  const final = fixture.actions.reduce((run, action) => { const next = stepRun(run, action); if (stage.id === 'trail-24' && next.player.x === 16 && next.player.y === 6) upperCrossing = true; return next; }, initial);
  assert.equal(final.status, 'won'); assert.equal(missionComplete(final), true); assert.equal(final.damage, 0);
  assert.deepEqual(resultFor(final), fixture.result); assert.equal(fixture.result.stars, 3);
  assert.deepEqual(final.choices, fixture.choices); assert.deepEqual(final.switches, fixture.switches);
  assert.deepEqual(stage, original); assert.equal(initial.turns, 0); assert.deepEqual(initial.player, stage.start);
  for (const id of stage.requiredRescues || []) assert.ok(final.rescued.includes(id));
  for (const id of stage.requiredSwitches || []) assert.equal(final.switches[id], true);
  assert.equal(final.relayProgress, final.stage.sequence.length);
  if (stage.requireCoins) assert.equal(final.collectedCoins.length, stage.coins.length);
  if (stage.relic) assert.equal(final.cargoDelivered, true);
  if (stage.restrictions?.noDash) assert.equal(fixture.actions.some(action => action.startsWith('dash-')), false);
  if (stage.plates.length && !stage.optionalPlates) assert.ok(final.stage.gates.filter(gate => gate.type === 'bridge').every(gate => gateIsOpen(final, gate)));
  if (fixture.id === 'trail-24') {
    assert.equal(gateIsOpen(final, final.stage.gates.find(gate => gate.id === 'cart-shortcut')), Boolean(fixture.branch));
    assert.equal(upperCrossing, Boolean(fixture.branch), 'The cart-route witness must actually cross the optional door.');
  }
});

test('horizon fixtures cover every new dialogue choice on both rules and both finale routes', () => {
  assert.equal(fixtures.length, 22);
  for (const stage of createCampaign().slice(18)) for (const difficulty of ['trail', 'nemesis']) {
    const runs = fixtures.filter(fixture => fixture.id === stage.id && fixture.difficulty === difficulty);
    assert.ok(runs.length > 0);
    for (const npc of stage.npcs) for (const choice of npc.choices) assert.ok(runs.some(run => run.choices[npc.id] === choice.id));
    const initial = createRun(stage, { difficulty }); assert.equal(missionComplete(initial), false);
    for (const marker of [stage.exit, ...stage.lanterns, ...stage.keys, ...stage.coins, ...stage.hearts, ...stage.supplies, ...stage.switches, ...stage.relays, ...stage.relic ? [stage.relic] : []]) {
      assert.equal(initial.walkable[marker.y * stage.map.width + marker.x], true, `${stage.id}: ${marker.id || 'beacon'} needs a floor.`);
    }
  }
});

test('all eighteen pre-expansion campaign definitions retain their committed v0.8.1 fingerprints', () => {
  assert.equal(previous.sourceCommit, '5e931233827092975f66575883ead3d08fc8824d'); assert.equal(previous.stages.length, 18);
  for (const old of previous.stages) {
    const stage = createCampaign().find(stage => stage.id === old.id);
    assert.equal(createHash('sha256').update(JSON.stringify(stage)).digest('hex'), old.sha256, old.id);
  }
});

test('24,000 horizon inputs preserve prior state, valid player floors, resources, and puzzle switches', () => {
  let seed = 92419;
  const pick = size => { seed = Math.imul(seed, 1664525) + 1013904223 >>> 0; return seed % size; };
  for (const stage of createCampaign().slice(18)) for (const difficulty of ['trail', 'nemesis']) {
    let run = createRun(stage, { difficulty });
    for (let i = 0; i < 2000; i++) {
      if (run.status !== 'playing') run = createRun(stage, { difficulty, memory: run.memory });
      const actions = run.dialogue ? ['close-dialogue', ...run.stage.npcs.find(npc => npc.id === run.dialogue).choices.map(choice => `choose:${choice.id}`)]
        : ['up', 'right', 'down', 'left', 'dash-up', 'dash-right', 'dash-down', 'dash-left', 'wait', 'shield', 'decoy', 'drop-cargo',
          ...[...stage.npcs, ...stage.relays, ...stage.switches, ...stage.supplies, ...stage.relic ? [stage.relic] : []].map(item => `interact:${item.id}`)];
      const old = run, switches = { ...run.switches }, crates = structuredClone(run.crates); run = stepRun(run, actions[pick(actions.length)]);
      assert.deepEqual(old.switches, switches); assert.deepEqual(old.crates, crates); assert.equal(canEnter(run, run.player), true);
      for (const value of [run.health, run.energy, run.decoys, run.shields]) assert.ok(value >= 0 && value <= 3);
      assert.ok(run.spentCoins <= run.collectedCoins.length);
    }
  }
});
