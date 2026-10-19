import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createJourney, advanceJourney, campOffers, leaveCamp, retryLeg, journeyScore, serializeJourney, restoreJourney } from '../src/adventure-journey.mjs';
import { emptyLogbook, creditJourney, BADGES } from '../src/adventure-logbook.mjs';
import { PERKS } from '../src/adventure-perks.mjs';
import { createRun, stepRun } from '../src/adventure.mjs';
const fixtures = JSON.parse(readFileSync(new URL('fixtures/expedition-routes.json', import.meta.url), 'utf8'));
const finish = (session, actions) => actions.reduce(advanceJourney, session);
for (const fixture of fixtures) test(`complete ordinary-action expedition: ${fixture.id}`, () => {
  let session = createJourney(fixture.config, `proof-${fixture.id}`);
  let book = emptyLogbook();
  const families = new Set();
  for (const [index, leg] of fixture.legs.entries()) {
    const before = serializeJourney(session);
    session = finish(session, leg.actions);
    assert.ok(['camp', 'won'].includes(session.phase), `Leg ${index + 1} must finish.`);
    assert.equal(session.run.turns, leg.turns); assert.equal(session.run.damage, leg.damage);
    assert.equal(session.receipts.length, index + 1); assert.equal(session.receipts.at(-1).stars, leg.stars);
    assert.equal(session.run.stage.expedition.family, leg.family); families.add(leg.family);
    assert.deepEqual(restoreJourney(serializeJourney(session)).run, session.run);
    assert.equal(restoreJourney(before).phase, 'playing', 'Playing earlier snapshots must not mutate them.');
    const credited = creditJourney(book, session); book = credited.book;
    assert.deepEqual(creditJourney(book, session).book, book, 'Repeated win/resume must not duplicate credit.');
    assert.equal(retryLeg(session), session, 'A credited leg cannot be restarted.');
    const forgotten = advanceJourney(session, 'forget');
    assert.equal(forgotten.receipts.length, session.receipts.length, 'Resetting habits after a win must not add a second receipt.');
    assert.deepEqual(restoreJourney(serializeJourney(forgotten)).receipts, session.receipts);
    if (session.phase === 'camp') {
      const offers = campOffers(session);
      for (const perk of offers.perks) for (const route of offers.routes) {
        const next = leaveCamp(session, perk.id, route.code);
        assert.equal(next.leg, index + 1); assert.equal(next.receipts.length, index + 1); assert.equal(next.run.turns, 0);
        assert.ok(next.run.health >= session.run.health && next.run.health <= 3);
        assert.equal(next.perks.length, session.perks.length + Number(perk.id !== 'restock'));
        assert.equal(next.run.stage.expedition.family, route.family.id);
        assert.deepEqual(restoreJourney(serializeJourney(next)).run, next.run);
      }
      assert.throws(() => leaveCamp(session, 'unknown', 's')); assert.throws(() => leaveCamp(session, offers.perks[0].id, 'invalid'));
      session = leaveCamp(session, leg.perk, leg.route);
    }
  }
  assert.equal(session.phase, 'won'); assert.equal(journeyScore(session), fixture.score);
  if (fixture.id === 'long-voyage') { assert.equal(session.perks.length, 8); assert.ok(families.size >= 5); }
});

test('all logbook badges are attainable through the completed fixtures', () => {
  let book = emptyLogbook();
  for (const fixture of fixtures) {
    let session = createJourney(fixture.config, `badges-${fixture.id}`);
    for (const leg of fixture.legs) {
      session = finish(session, leg.actions);
      book = creditJourney(book, session).book;
      if (session.phase === 'camp') session = leaveCamp(session, leg.perk, leg.route);
    }
  }
  assert.deepEqual([...book.badges].sort(), BADGES.map(badge => badge.id).sort());
  assert.equal(book.stats.finishes, fixtures.length);
  assert.equal(book.stats.legs, fixtures.reduce((n, fixture) => n + fixture.legs.length, 0));
});

test('all 256 upgrade combinations keep bounded resources, immutable turns, and the oath restrictions', () => {
  for (let mask = 0; mask < 256; mask++) {
    const session = createJourney({ seed: 'perk-combinations', length: 3, vow: mask % 2 ? 'quiet' : 'unwarded' });
    const perks = PERKS.filter((_, index) => mask & 1 << index).map(perk => perk.id);
    let run = createRun(session.run.stage, { perks }); const original = run, snapshot = structuredClone(run);
    for (const action of ['shield', 'decoy', 'dash-right', 'wait', 'right', 'left', 'up', 'down']) {
      const next = stepRun(run, action);
      assert.ok(next.health >= 0 && next.health <= 3); assert.ok(next.energy >= 0 && next.energy <= 3);
      assert.ok(next.decoys >= 0 && next.decoys <= 3 && next.shields >= 0 && next.shields <= 3);
      if ((session.config.vow === 'quiet' && action.startsWith('dash')) || (session.config.vow === 'unwarded' && action === 'shield')) assert.equal(next.turns, run.turns);
      run = next;
    }
    assert.deepEqual(original, snapshot); assert.equal(original.turns, 0);
  }
});

test('a lost later leg retries with its own starting kit and learned habits while retaining prior wins', () => {
  const fixture = fixtures.find(item => item.id === 'nemesis-journey');
  let session = finish(createJourney(fixture.config, 'retry-proof'), fixture.legs[0].actions);
  session = leaveCamp(session, fixture.legs[0].perk, fixture.legs[0].route);
  const original = session;
  session = finish(session, fixture.legs[1].actions.slice(0, 13));
  for (let i = 0; i < 100 && session.phase === 'playing'; i++) session = advanceJourney(session, 'wait');
  assert.equal(session.phase, 'lost'); assert.equal(session.run.health, 0);
  assert.deepEqual(restoreJourney(serializeJourney(session)).run, session.run);
  const next = retryLeg(session);
  assert.equal(next.phase, 'playing'); assert.equal(next.run.turns, 0); assert.equal(next.retries, 1);
  assert.deepEqual(next.loadout, original.loadout); assert.deepEqual(next.receipts, original.receipts); assert.deepEqual(next.perks, original.perks);
  assert.equal(next.run.memory.observations, session.run.memory.observations);
  assert.deepEqual(restoreJourney(serializeJourney(next)).run, next.run);
});
