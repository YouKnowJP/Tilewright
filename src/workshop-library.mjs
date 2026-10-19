import { normalizeAdventure, adventureKey, MAX_ADVENTURE_BYTES } from './workshop-model.mjs';
export const WORKSHOP_KEY = 'tilewright.workshop.v1', DRAFT_KEY = 'tilewright.workshop.draft.v1', WORKSHOP_BESTS_KEY = 'tilewright.workshop.bests.v1';
export const MAX_ADVENTURES = 32;
export function loadWorkshop(storage) {
  const result = { entries: [], unavailable: false, damaged: 0 };
  try {
    const text = storage.getItem(WORKSHOP_KEY); if (!text) return result;
    if (text.length > 4_000_000) throw Error('oversized'); const data = JSON.parse(text);
    if (data?.version !== 1 || !Array.isArray(data.entries) || data.entries.length > MAX_ADVENTURES) throw Error('unsupported');
    for (const entry of data.entries) {
      try { const pack = normalizeAdventure(entry); if (JSON.stringify(pack).length > MAX_ADVENTURE_BYTES) throw Error('oversized'); const key = adventureKey(pack); if (!result.entries.some(item => adventureKey(item) === key)) result.entries.push(pack); }
      catch { result.damaged++; }
    }
  } catch { result.unavailable = true; }
  return result;
}
export function storeWorkshop(storage, entries) {
  if (entries.length > MAX_ADVENTURES) throw Error('Your shelf holds 32 adventures. Export a world before removing it to make room.');
  const text = JSON.stringify({ version: 1, entries: entries.map(normalizeAdventure) });
  if (text.length > 4_000_000) return false;
  try { storage.setItem(WORKSHOP_KEY, text); return true; } catch { return false; }
}
export function addWorkshopAdventure(entries, input) {
  const pack = normalizeAdventure(input), key = adventureKey(pack), index = entries.findIndex(entry => adventureKey(entry) === key);
  if (index >= 0) return entries.map((entry, i) => i === index ? { ...pack, ...(pack.proof ? {} : entry.proof ? { proof: entry.proof } : {}) } : entry);
  if (entries.length >= MAX_ADVENTURES) throw Error('Your shelf holds 32 adventures. Export a world, then remove it to make room.');
  return [...entries, pack];
}
export function loadWorkshopDraft(storage) {
  try { const text = storage.getItem(DRAFT_KEY); if (!text || text.length > MAX_ADVENTURE_BYTES) return null; return normalizeAdventure(JSON.parse(text)); } catch { return null; }
}
export function saveWorkshopDraft(storage, pack) {
  try { const text = JSON.stringify(normalizeAdventure(pack)); if (text.length > MAX_ADVENTURE_BYTES) return false; storage.setItem(DRAFT_KEY, text); return true; } catch { return false; }
}
const validBest = value => value && Number.isInteger(value.stars) && value.stars >= 1 && value.stars <= 3 && Number.isInteger(value.turns) && value.turns >= 1 && value.turns <= 1_000_000 && Number.isInteger(value.score) && value.score >= 0 && value.score <= 1_000_000_000;
export function loadWorkshopBests(storage) {
  try {
    const text = storage.getItem(WORKSHOP_BESTS_KEY); if (!text || text.length > 20_000) return {}; const data = JSON.parse(text);
    if (data?.version !== 1 || !data.records || typeof data.records !== 'object' || Array.isArray(data.records)) return {};
    return Object.fromEntries(Object.entries(data.records).filter(([key, value]) => /^player-[0-9a-f]{16}-(trail|nemesis)$/.test(key) && validBest(value)).slice(-64)
      .map(([key, value]) => [key, { stars: value.stars, score: value.score, turns: value.turns }]));
  } catch { return {}; }
}
export function saveWorkshopBest(storage, records, key, difficulty, result) {
  const id = `${key}-${difficulty}`;
  if (!/^player-[0-9a-f]{16}-(trail|nemesis)$/.test(id) || !validBest(result)) throw Error('Finish a player adventure before recording a best.');
  const old = records[id], improved = !old || result.stars > old.stars || result.stars === old.stars && (result.score > old.score || result.score === old.score && result.turns < old.turns);
  const next = { ...records }; delete next[id]; next[id] = improved ? { stars: result.stars, score: result.score, turns: result.turns } : old;
  while (Object.keys(next).length > 64) delete next[Object.keys(next)[0]];
  try { storage.setItem(WORKSHOP_BESTS_KEY, JSON.stringify({ version: 1, records: next })); return { records: next, saved: true }; }
  catch { return { records: next, saved: false }; }
}
