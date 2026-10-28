import { CHAPTERS } from './adventure-art.mjs';
import { GUILD_KITS } from './adventure-tools.mjs';
import { BADGES, emptyLogbook } from './adventure-logbook.mjs';

// Read existing bests only. Opening the journal never awards or saves progress.
export function adventureJournal({ campaign, jobs, records = {}, guildRecords = {}, book = emptyLogbook(), difficulty = 'trail', kit = 'echoist' }) {
  const best = (stage, rule = difficulty) => records[`${stage.id}${rule === 'nemesis' ? '-nemesis' : ''}`];
  const unlocked = (stage, i) => i === 0 || stage.contractStart || best(campaign[i - 1], 'trail') || best(campaign[i - 1], 'nemesis');
  const available = campaign.filter(unlocked);
  const next = available.find(stage => !best(stage)) || available.find(stage => best(stage).stars < 3) || available[0];
  const guildBest = (job, specialist, rule) => guildRecords[`${job.id}-${specialist}-${rule}`];
  const orderedKits = [...GUILD_KITS].sort((a, b) => Number(b.id === kit) - Number(a.id === kit));
  const guildNext = orderedKits.flatMap(specialist => jobs.map(job => ({ job, specialist, record: guildBest(job, specialist.id, difficulty) })))
    .find(entry => !entry.record || entry.record.merits < 3) || { job: jobs[0], specialist: orderedKits[0], record: guildBest(jobs[0], orderedKits[0].id, difficulty) };
  const chapters = CHAPTERS.map((chapter, index) => {
    const stages = campaign.slice(index * 3, index * 3 + 3);
    return { ...chapter, index, finished: stages.filter(stage => best(stage, 'trail') || best(stage, 'nemesis')).length,
      trailStars: stages.reduce((sum, stage) => sum + (best(stage, 'trail')?.stars || 0), 0),
      nemesisStars: stages.reduce((sum, stage) => sum + (best(stage, 'nemesis')?.stars || 0), 0) };
  });
  const kits = GUILD_KITS.map(specialist => {
    const matches = jobs.flatMap(job => ['trail', 'nemesis'].map(rule => guildBest(job, specialist.id, rule))).filter(Boolean);
    return { ...specialist, finished: matches.length, honors: matches.reduce((sum, result) => sum + result.merits, 0), total: jobs.length * 2 };
  });
  return {
    difficulty, chapters, kits,
    counts: { story: chapters.reduce((sum, chapter) => sum + chapter.finished, 0), storyTotal: campaign.length,
      trailStars: chapters.reduce((sum, chapter) => sum + chapter.trailStars, 0), nemesisStars: chapters.reduce((sum, chapter) => sum + chapter.nemesisStars, 0),
      starTotal: campaign.length * 3, honors: kits.reduce((sum, specialist) => sum + specialist.honors, 0), honorTotal: jobs.length * GUILD_KITS.length * 2 * 3,
      badges: book.badges.length, badgeTotal: BADGES.length, legs: book.stats.legs, finishes: book.stats.finishes },
    badges: BADGES.map(badge => ({ ...badge, earned: book.badges.includes(badge.id) })),
    recommendations: [
      { id: 'story', mode: 'story', chapter: Math.floor(campaign.indexOf(next) / 3), stage: next.id, theme: next.theme || 'woodland',
        label: best(next) ? 'Refine your route' : 'A story to discover', title: next.name,
        text: best(next) ? `Your best: ${best(next).stars}/3 stars. Try a clean route and bring home every light.` : next.subtitle, action: 'View story trail' },
      { id: 'guild', mode: 'guild', kit: guildNext.specialist.id, job: guildNext.job.id, theme: guildNext.job.theme,
        label: 'A different way to play', title: `${guildNext.specialist.name} dispatch`,
        text: `${guildNext.job.name}. ${guildNext.record ? `${guildNext.record.merits}/3 honors earned; try a new approach.` : `Try ${guildNext.specialist.power.toLowerCase()} and earn three honors.`}`, action: 'View Guild job' },
      { id: 'daily', mode: 'daily', theme: 'aurora', label: 'A new trail each day', title: 'Today’s expedition',
        text: 'Five connected trails, camp upgrades, and your choice of roads. Preview today’s UTC seed before setting out.', action: 'View daily trail' },
    ],
  };
}
