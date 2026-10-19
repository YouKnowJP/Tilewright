import { expeditionConfig, hashSeed, BIOMES } from './adventure-generator.mjs';
import { journeyScore } from './adventure-journey.mjs';
export const LOGBOOK_KEY = 'tilewright.logbook.v1';
export const BADGES = Object.freeze([
  { id: 'first-light', name: 'First return', description: 'Complete any expedition leg.' },
  { id: 'wayfarer', name: 'Wayfarer', description: 'Finish a journey of at least three legs.' },
  { id: 'long-haul', name: 'Long haul', description: 'Finish a nine-leg journey.' },
  { id: 'clean-trail', name: 'Unbroken light', description: 'Finish a journey without damage or retries.' },
  { id: 'nemesis', name: 'Against the odds', description: 'Finish a Nemesis expedition.' },
  { id: 'daily', name: 'Today’s trail', description: 'Finish a daily trail.' },
  { id: 'courier', name: 'Borrowed song', description: 'Deliver a singing relic.' },
  { id: 'rescue', name: 'Nobody left behind', description: 'Rescue a keeper in an expedition.' },
  { id: 'bells', name: 'Signal breaker', description: 'Complete an expedition relay sequence.' },
  { id: 'treasure', name: 'Every little thing', description: 'Recover every coin on an expedition leg.' },
  { id: 'biomes', name: 'Four horizons', description: 'Visit every expedition biome.' },
  { id: 'oath', name: 'Oath keeper', description: 'Finish an expedition with an oath.' },
]);
export const emptyLogbook = () => ({ badges: [], credited: [], records: [], stats: { legs: 0, finishes: 0, turns: 0, score: 0, biomes: [] } });
const counter = value => Number.isInteger(value) && value >= 0 && value <= 1_000_000_000 ? value : 0;
export function loadLogbook(storage) {
  try {
    const text = storage.getItem(LOGBOOK_KEY); if (!text || text.length > 96_000) return emptyLogbook();
    const data = JSON.parse(text); if (data?.version !== 1 || !data.book || typeof data.book !== 'object') return emptyLogbook();
    const value = data.book, book = emptyLogbook();
    book.badges = [...new Set((Array.isArray(value.badges) ? value.badges : []).filter(id => BADGES.some(badge => badge.id === id)))];
    book.credited = [...new Set((Array.isArray(value.credited) ? value.credited : []).filter(id => typeof id === 'string' && /^[a-z0-9-]{1,64}$/.test(id)))].slice(-512);
    for (const key of ['legs', 'finishes', 'turns', 'score']) book.stats[key] = counter(value.stats?.[key]);
    book.stats.biomes = [...new Set((Array.isArray(value.stats?.biomes) ? value.stats.biomes : []).filter(id => BIOMES.some(biome => biome.id === id)))];
    for (const item of (Array.isArray(value.records) ? value.records : []).slice(-32)) {
      try {
        const config = expeditionConfig(item.config);
        if (![item.score, item.turns, item.retries].every(value => Number.isInteger(value) && value >= 0 && value <= 1_000_000_000)) continue;
        book.records.push({ key: `best-${hashSeed(JSON.stringify(config)).toString(16)}`, config, score: item.score, turns: item.turns, retries: item.retries });
      } catch { /* Skip a damaged record without losing the rest of the book. */ }
    }
    return book;
  } catch { return emptyLogbook(); }
}
export function creditJourney(book, session) {
  if (!['camp', 'won'].includes(session.phase)) return { book, earned: [] };
  // A finish token also covers earlier leg receipts that have left the LRU window.
  if (book.credited.includes(`${session.id}-finish`)) return { book, earned: [] };
  const next = structuredClone(book), earned = [];
  const award = id => { if (!next.badges.includes(id)) { next.badges.push(id); earned.push(id); } };
  for (const receipt of session.receipts) {
    const legToken = `${session.id}-leg-${receipt.leg}`;
    if (next.credited.includes(legToken)) continue;
    next.credited.push(legToken);
    next.stats.legs = Math.min(1_000_000_000, next.stats.legs + 1); next.stats.turns = Math.min(1_000_000_000, next.stats.turns + receipt.turns);
    next.stats.score = Math.min(1_000_000_000, next.stats.score + receipt.score);
    next.stats.biomes = [...new Set([...next.stats.biomes, receipt.biome])]; award('first-light');
    if (receipt.delivered) award('courier'); if (receipt.rescues) award('rescue'); if (receipt.relays) award('bells');
    if (receipt.totalCoins > 0 && receipt.coins === receipt.totalCoins) award('treasure'); if (next.stats.biomes.length === BIOMES.length) award('biomes');
  }
  const finishToken = `${session.id}-finish`;
  if (session.phase === 'won' && !next.credited.includes(finishToken)) {
    next.credited.push(finishToken); next.stats.finishes = Math.min(1_000_000_000, next.stats.finishes + 1);
    if (session.config.length >= 3) award('wayfarer'); if (session.config.length === 9) award('long-haul');
    if (!session.retries && session.receipts.every(item => !item.damage)) award('clean-trail');
    if (session.config.difficulty === 'nemesis') award('nemesis'); if (session.config.mode === 'daily') award('daily');
    if (session.config.vow !== 'none') award('oath');
    next.stats.score = Math.min(1_000_000_000, next.stats.score + Math.max(0, 300 + session.config.length * 100 - session.retries * 100));
    const key = `best-${hashSeed(JSON.stringify(session.config)).toString(16)}`, score = journeyScore(session), turns = session.receipts.reduce((n, item) => n + item.turns, 0);
    const old = next.records.find(item => item.key === key);
    if (!old || score > old.score || (score === old.score && turns < old.turns)) {
      next.records = [...next.records.filter(item => item.key !== key), { key, config: { ...session.config }, score, turns, retries: session.retries }].slice(-32);
    }
  }
  next.credited = next.credited.slice(-512); return { book: next, earned };
}
export function saveLogbook(storage, book) { try { storage.setItem(LOGBOOK_KEY, JSON.stringify({ version: 1, book })); return true; } catch { return false; } }
