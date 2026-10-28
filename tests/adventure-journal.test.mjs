import test from 'node:test';
import assert from 'node:assert/strict';
import { adventureJournal } from '../src/adventure-journal.mjs';
import { createCampaign } from '../src/adventure-levels.mjs';
import { createGuildJobs } from '../src/adventure-guild.mjs';
import { emptyLogbook } from '../src/adventure-logbook.mjs';

const campaign = createCampaign(), jobs = createGuildJobs('echoist');
const result = { stars: 3, turns: 40, score: 1000 };
test('the journal starts with attainable suggestions and counts only authored records', () => {
  const journal = adventureJournal({ campaign, jobs, records: { 'custom-123': result }, guildRecords: { 'unknown-echoist-trail': { merits: 3 } } });
  assert.equal(journal.counts.story, 0); assert.equal(journal.counts.honors, 0);
  assert.equal(journal.counts.honorTotal, 144); assert.equal(journal.counts.starTotal, 72);
  assert.equal(journal.recommendations[0].stage, 'trail-1'); assert.equal(journal.recommendations[1].kit, 'echoist');
  assert.equal(journal.recommendations[2].mode, 'daily'); assert.equal(journal.badges.filter(badge => badge.earned).length, 0);
});
test('story mastery counts both rules separately and suggestions respect unlocks', () => {
  const records = { 'trail-1': result, 'trail-1-nemesis': { ...result, stars: 2 } };
  const trail = adventureJournal({ campaign, jobs, records });
  assert.equal(trail.counts.story, 1); assert.equal(trail.counts.trailStars, 3); assert.equal(trail.counts.nemesisStars, 2);
  assert.equal(trail.chapters[0].finished, 1); assert.equal(trail.recommendations[0].stage, 'trail-2');
  const nemesis = adventureJournal({ campaign, jobs, records, difficulty: 'nemesis' });
  assert.equal(nemesis.recommendations[0].stage, 'trail-2');
  const fresh = adventureJournal({ campaign, jobs, records: { 'trail-4': result } });
  assert.equal(fresh.recommendations[0].stage, 'trail-1');
});
test('Guild suggestions move to other kits after mastery and preserve separate honors', () => {
  const guildRecords = Object.fromEntries(jobs.map(job => [`${job.id}-echoist-trail`, { merits: 3, turns: 50, score: 1000 }]));
  guildRecords['guild-1-echoist-nemesis'] = { merits: 2, turns: 50, score: 1000 };
  const journal = adventureJournal({ campaign, jobs, guildRecords });
  assert.equal(journal.counts.honors, 26); assert.equal(journal.kits.find(kit => kit.id === 'echoist').finished, 9);
  assert.equal(journal.recommendations[1].kit, 'bellrunner');
  assert.equal(adventureJournal({ campaign, jobs, guildRecords, difficulty: 'nemesis' }).recommendations[1].job, 'guild-1');
});
test('reading a complete journal never mutates or credits saves, and mastered trails remain replayable', () => {
  const records = Object.fromEntries(campaign.map(stage => [stage.id, result]));
  const book = emptyLogbook(); book.badges = ['first-light', 'wayfarer']; book.stats.legs = 3; book.stats.finishes = 1;
  const input = { campaign, jobs, records, book }, before = structuredClone(input);
  const journal = adventureJournal(input);
  assert.equal(journal.counts.story, 24); assert.equal(journal.counts.badges, 2); assert.equal(journal.counts.legs, 3);
  assert.equal(journal.recommendations[0].stage, 'trail-1'); assert.deepEqual(input, before);
});
