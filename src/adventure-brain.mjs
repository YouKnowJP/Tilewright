// A small, inspectable movement predictor. No network, model service, or inferred
// personal traits: it counts only successful in-game actions in this browser.
export const MEMORY_KEY = 'tilewright.tactics.v1';
export const ACTIONS = Object.freeze(['up', 'right', 'down', 'left', 'wait', 'dash-up', 'dash-right', 'dash-down', 'dash-left']);
const row = () => Object.fromEntries(ACTIONS.map(action => [action, 0]));
export function freshMemory() { return { observations: 0, last: null, counts: row(), transitions: Object.fromEntries(ACTIONS.map(action => [action, row()])) }; }
export function normalizeMemory(value) {
  const memory = freshMemory();
  if (!value || typeof value !== 'object') return memory;
  memory.observations = Number.isInteger(value.observations) ? Math.max(0, Math.min(99_999, value.observations)) : 0;
  memory.last = ACTIONS.includes(value.last) ? value.last : null;
  const bounded = n => Number.isInteger(n) && n >= 0 && n <= 256 ? n : 0;
  for (const action of ACTIONS) {
    memory.counts[action] = bounded(value.counts?.[action]);
    for (const next of ACTIONS) memory.transitions[action][next] = bounded(value.transitions?.[action]?.[next]);
  }
  return memory;
}
export function learnMove(memory, action) {
  if (!ACTIONS.includes(action)) return memory;
  const next = normalizeMemory(memory);
  if (Object.values(next.counts).reduce((a, b) => a + b, 0) >= 128) {
    for (const key of ACTIONS) {
      next.counts[key] = Math.floor(next.counts[key] / 2);
      for (const after of ACTIONS) next.transitions[key][after] = Math.floor(next.transitions[key][after] / 2);
    }
  }
  next.counts[action]++;
  if (next.last) next.transitions[next.last][action]++;
  next.last = action; next.observations = Math.min(99_999, next.observations + 1); return next;
}
export function predictMove(memory) {
  const transition = memory.last ? memory.transitions[memory.last] : null;
  const total = values => Object.values(values).reduce((a, b) => a + b, 0);
  const conditional = transition && total(transition) >= 3;
  const values = conditional ? transition : memory.counts, samples = total(values);
  const action = [...ACTIONS].sort((a, b) => values[b] - values[a] || ACTIONS.indexOf(a) - ACTIONS.indexOf(b))[0];
  return { action, confidence: samples ? values[action] / samples : 0, ready: samples >= (conditional ? 3 : 8), conditional, samples };
}
export function memorySummary(memory) {
  const prediction = predictMove(memory), total = Object.values(memory.counts).reduce((a, b) => a + b, 0);
  const dashes = ACTIONS.filter(action => action.startsWith('dash-')).reduce((n, key) => n + memory.counts[key], 0);
  if (!prediction.ready) return `Observing · ${memory.observations} moves learned. Vary your route before the hunters find a pattern.`;
  if (prediction.confidence < .42) return `Mixed routes · ${memory.observations} moves learned. No reliable next move yet. Keep varying direction; hunters still follow sight and sound.`;
  return `Anticipating ${prediction.action.replace('dash-', 'a dash ')}${prediction.conditional ? ` after ${memory.last.replace('dash-', 'a dash ')}` : ''} · ${Math.round(prediction.confidence * 100)}% of matching moves. ${total && dashes / total > .35 ? 'Frequent dashes make you easier to hear.' : 'Break the pattern, use cover, or lure a hunter away.'}`;
}
export function loadMemory(storage) {
  try {
    const text = storage.getItem(MEMORY_KEY);
    if (!text || text.length > 12_000) return freshMemory();
    const data = JSON.parse(text); return data.version === 1 ? normalizeMemory(data.memory) : freshMemory();
  } catch { return freshMemory(); }
}
export function saveMemory(storage, memory) {
  try { storage.setItem(MEMORY_KEY, JSON.stringify({ version: 1, memory: normalizeMemory(memory) })); return true; }
  catch { return false; }
}
