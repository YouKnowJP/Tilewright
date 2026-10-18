export const RECORD_KEY = 'tilewright.adventures.v1';

export function loadRecords(storage) {
  try {
    const text = storage.getItem(RECORD_KEY);
    if (text === null) return {};
    if (text.length > 30_000) return {};
    const data = JSON.parse(text);
    if (data.version !== 1 || !data.records || typeof data.records !== 'object' || Array.isArray(data.records)) return {};
    const records = {};
    for (const [id, value] of Object.entries(data.records).slice(0, 64)) {
      if (!/^[a-z0-9-]{1,64}$/.test(id) || !value || !Number.isInteger(value.stars) || value.stars < 1 || value.stars > 3
        || !Number.isInteger(value.turns) || value.turns < 1 || value.turns > 1_000_000
        || !Number.isInteger(value.score) || value.score < 0 || value.score > 1_000_000_000) continue;
      records[id] = { stars: value.stars, turns: value.turns, score: value.score };
    }
    return records;
  } catch { return {}; }
}

export function saveResult(storage, records, id, result) {
  if (!/^[a-z0-9-]{1,64}$/.test(id)) throw new Error('Invalid adventure identifier.');
  const old = Object.hasOwn(records, id) ? records[id] : undefined;
  const improved = !old || result.stars > old.stars || (result.stars === old.stars
    && (result.score > old.score || (result.score === old.score && result.turns < old.turns)));
  const next = { ...records, [id]: improved ? { ...result } : old };
  const optional = Object.keys(next).filter(key => !/^trail-[1-6](?:-nemesis)?$/.test(key));
  while (Object.keys(next).length > 64) delete next[optional.shift()];
  try { storage.setItem(RECORD_KEY, JSON.stringify({ version: 1, records: next })); return { records: next, saved: true, improved }; }
  catch { return { records: next, saved: false, improved }; }
}
