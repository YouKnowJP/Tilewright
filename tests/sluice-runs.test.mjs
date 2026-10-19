import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRun, stepRun, resultFor, missionComplete } from '../src/adventure.mjs';
import { createCampaign, CAMPAIGN_IDS } from '../src/adventure-levels.mjs';
const fixtures = JSON.parse(readFileSync(new URL('fixtures/sluice-routes.json', import.meta.url), 'utf8'));
for (const fixture of fixtures) test(`sluice saga ordinary-action win: ${fixture.id} / ${fixture.difficulty} / branch ${fixture.branch}`, () => {
  const stage = createCampaign().find(stage => stage.id === fixture.id), before = structuredClone(stage), initial = createRun(stage, { difficulty: fixture.difficulty });
  const final = fixture.actions.reduce(stepRun, initial);
  assert.equal(final.status, 'won'); assert.equal(missionComplete(final), true); assert.equal(final.damage, 0);
  assert.deepEqual(resultFor(final), fixture.result); assert.equal(fixture.result.stars, 3);
  assert.deepEqual(final.switches, fixture.switches); assert.equal(final.spentCoins, fixture.spentCoins);
  assert.ok(final.memory.observations > 40); assert.deepEqual(initial.player, stage.start); assert.equal(initial.turns, 0);
  assert.deepEqual(stage, before);
  if (fixture.id === 'trail-7') assert.equal(final.choices.luma, fixture.branch ? 'supplies' : 'ferry');
  if (fixture.id === 'trail-8') { assert.equal(final.choices.rook, fixture.branch === 2 ? undefined : fixture.branch ? 'shield' : 'decoys'); assert.equal(final.spentCoins, fixture.branch === 2 ? 0 : fixture.branch ? 1 : 2); }
  if (fixture.id === 'trail-9') { assert.deepEqual([...final.rescued].sort(), ['jun', 'sola']); assert.equal(final.cargoDelivered, true); assert.equal(final.switches.moor, true); assert.equal(final.choices.iona, fixture.branch ? 'prepare' : 'shelter'); }
});
test('nine campaign identities are stable and each act can be started without fabricated progress', () => {
  const campaign = createCampaign(); assert.deepEqual(campaign.map(stage => stage.id), CAMPAIGN_IDS);
  assert.equal(campaign[3].contractStart, true); assert.equal(campaign[6].contractStart, true);
  assert.equal(campaign[5].nemesisStart, 3); assert.equal(campaign[8].nemesisStart, 6);
  assert.equal(campaign[5].actFinal, true); assert.equal(campaign[8].actFinal, true);
});
