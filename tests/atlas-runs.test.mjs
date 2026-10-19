import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createCampaign, CAMPAIGN_IDS } from '../src/adventure-levels.mjs';
import { createRun, stepRun, resultFor, missionComplete, canEnter, gateIsOpen } from '../src/adventure.mjs';
import { CHAPTERS } from '../src/adventure-art.mjs';
const fixtures = JSON.parse(readFileSync(new URL('fixtures/atlas-routes.json', import.meta.url), 'utf8'));

for (const fixture of fixtures) test(`atlas ordinary-action clean win: ${fixture.id}/${fixture.difficulty}/branch ${fixture.branch}`, () => {
  const definition = createCampaign().find(stage => stage.id === fixture.id), before = structuredClone(definition);
  const initial = createRun(definition, { difficulty: fixture.difficulty });
  const final = fixture.actions.reduce(stepRun, initial);
  assert.equal(final.status, 'won'); assert.equal(missionComplete(final), true);
  assert.equal(final.damage, 0); assert.deepEqual(resultFor(final), fixture.result); assert.equal(fixture.result.stars, 3);
  assert.deepEqual(final.choices, fixture.choices); assert.deepEqual(definition, before); assert.equal(initial.turns, 0);
  if (definition.requireCoins) assert.equal(final.collectedCoins.length, definition.coins.length);
  if (definition.relic) assert.equal(final.cargoDelivered, true);
  for (const id of definition.requiredRescues || []) assert.ok(final.rescued.includes(id));
  for (const id of definition.requiredSwitches || []) assert.equal(final.switches[id], true);
  if (definition.restrictions?.noDash) assert.equal(fixture.actions.some(action => action.startsWith('dash-')), false);
  if (definition.restrictions?.noShield) assert.equal(fixture.actions.includes('shield'), false);
  if (fixture.id === 'trail-18' && fixture.branch === 1) assert.equal(final.stage.gates.filter(gate => gate.type === 'bridge').every(gate => gateIsOpen(final, gate)), true);
});

test('six atlas chapters have stable identities, open entry missions, and distinct map geometry', () => {
  const campaign = createCampaign(); assert.equal(campaign.length, 18); assert.deepEqual(campaign.map(stage => stage.id), CAMPAIGN_IDS);
  assert.equal(new Set(campaign.map(stage => JSON.stringify(stage.map.layers))).size, 18);
  for (const [index, chapter] of CHAPTERS.entries()) {
    const stages = campaign.slice(index * 3, index * 3 + 3);
    assert.equal(stages.length, 3); assert.equal(index === 0 || stages[0].contractStart, true);
    assert.ok(stages.every(stage => stage.theme === chapter.id && stage.chapter === index));
    if (index) { assert.equal(stages[2].actFinal, true); assert.equal(stages[2].nemesisStart, index * 3); }
  }
  assert.equal(fixtures.length, 28);
  for (let i = 10; i <= 18; i++) for (const difficulty of ['trail', 'nemesis']) assert.ok(fixtures.some(f => f.id === `trail-${i}` && f.difficulty === difficulty));
});

test('mission restrictions reject disabled actions without consuming resources or turns', () => {
  for (const id of ['trail-11', 'trail-14', 'trail-16']) {
    const run = createRun(createCampaign().find(stage => stage.id === id));
    const action = run.stage.restrictions.noDash ? 'dash-right' : 'shield';
    const next = stepRun(run, action); assert.equal(next.turns, 0); assert.equal(next.energy, run.energy); assert.equal(next.shields, run.shields);
    assert.deepEqual(next.player, run.player); assert.equal(missionComplete(next), false);
  }
});

test('36,000 exploratory atlas inputs keep actors on valid floors and retain bounded resources', () => {
  let seed = 7026;
  const pick = size => { seed = Math.imul(seed, 1664525) + 1013904223 >>> 0; return seed % size; };
  for (const stage of createCampaign().slice(9)) for (const difficulty of ['trail', 'nemesis']) {
    let run = createRun(stage, { difficulty });
    for (let index = 0; index < 2000; index++) {
      if (run.status !== 'playing') run = createRun(stage, { difficulty, memory: run.memory });
      const actions = run.dialogue ? ['close-dialogue', ...run.stage.npcs.find(npc => npc.id === run.dialogue).choices.map(choice => `choose:${choice.id}`)]
        : ['up', 'right', 'down', 'left', 'dash-up', 'dash-right', 'dash-down', 'dash-left', 'wait', 'shield', 'decoy', 'drop-cargo',
          ...[...stage.npcs, ...stage.relays || [], ...stage.switches, ...stage.supplies, ...stage.relic ? [stage.relic] : []].map(item => `interact:${item.id}`)];
      const before = run, switches = { ...run.switches }; run = stepRun(run, actions[pick(actions.length)]);
      assert.deepEqual(before.switches, switches); assert.equal(canEnter(run, run.player), true);
      assert.ok(run.health >= 0 && run.health <= 3 && run.energy >= 0 && run.energy <= 3);
      assert.ok(run.decoys >= 0 && run.decoys <= 3 && run.shields >= 0 && run.shields <= 3);
      assert.ok(run.spentCoins <= run.collectedCoins.length);
    }
  }
});
