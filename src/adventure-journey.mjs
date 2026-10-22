import { createRun, stepRun, resultFor } from './adventure.mjs';
import { freshMemory, normalizeMemory } from './adventure-brain.mjs';
import { PERKS, VOWS, validPerks } from './adventure-perks.mjs';
import { expeditionConfig, generateStage, routeChoices, randomFor, hashSeed } from './adventure-generator.mjs';
export const JOURNEY_KEY = 'tilewright.expedition.v1';
export const JOURNEY_RULES = '0.6.0';
export const MAX_JOURNAL = 8192;
const MAX_BYTES = 220_000;
const phases = ['playing', 'camp', 'won', 'lost'];
const initialLoadout = config => ({ health: config.difficulty === 'nemesis' ? 2 : 3, decoys: config.difficulty === 'nemesis' ? 1 : 2, shields: config.difficulty === 'nemesis' ? 1 : 2 });
const makeRun = session => createRun(generateStage(session.config, session.leg, session.path), { memory: session.legMemory,
  difficulty: session.config.difficulty, perks: session.perks, loadout: session.loadout });
export function createJourney(input, id = `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`) {
  const config = expeditionConfig(input);
  if (!/^[a-z0-9-]{1,48}$/.test(id)) throw new Error('Invalid expedition identity.');
  const session = { id, config, leg: 0, path: 's', phase: 'playing', perks: [], legMemory: freshMemory(),
    loadout: initialLoadout(config), journal: [], receipts: [], retries: 0, run: null };
  session.run = makeRun(session); return session;
}
export function journeyScore(session) {
  return session.receipts.reduce((score, receipt) => score + receipt.score, 0)
    + (session.phase === 'won' ? Math.max(0, 300 + session.config.length * 100 - session.retries * 100) : 0);
}
export function advanceJourney(session, action) {
  if (session.phase !== 'playing' && action !== 'forget') return session;
  const before = session.run;
  const run = action === 'forget' ? { ...before, memory: freshMemory(), events: [], message: 'The expedition’s learned movement habits were cleared.' } : stepRun(before, action);
  if (run === before) return session;
  const meaningful = run.turns !== before.turns || run.facing !== before.facing || run.dialogue !== before.dialogue
    || run.rescued.length !== before.rescued.length || run.choices !== before.choices || action === 'forget';
  const journal = meaningful ? [...session.journal, action] : session.journal;
  let next = { ...session, run, journal };
  if (session.phase !== 'playing') return next;
  if (run.status === 'lost') next.phase = 'lost';
  if (run.status === 'won') {
    const result = resultFor(run), info = run.stage.expedition;
    const receipt = { leg: session.leg, family: info.family, biome: info.biome, score: result.score + info.bounty + VOWS.find(vow => vow.id === session.config.vow).bonus,
      turns: run.turns, stars: result.stars, damage: run.damage, coins: run.collectedCoins.length, totalCoins: run.stage.coins.length,
      delivered: run.cargoDelivered, rescues: run.rescued.length, relays: run.relayProgress };
    next = { ...next, phase: session.leg + 1 < session.config.length ? 'camp' : 'won', receipts: [...session.receipts, receipt] };
  }
  return next;
}
export function campOffers(session) {
  if (session.phase !== 'camp') return { perks: [], routes: [] };
  const random = randomFor(`${session.config.seed}|${session.path}|${session.leg}|camp`);
  const available = PERKS.filter(perk => !session.perks.includes(perk.id));
  for (let i = available.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [available[i], available[j]] = [available[j], available[i]]; }
  return { perks: [...available.slice(0, 2), { id: 'restock', name: 'Rest and restock', description: 'Recover an extra heart, decoy, and shield now.' }],
    routes: routeChoices(session.config, session.leg + 1, session.path) };
}
export function leaveCamp(session, perkId, routeCode) {
  const offers = campOffers(session), route = offers.routes.find(item => item.code === routeCode);
  if (!offers.perks.some(perk => perk.id === perkId) || !route) throw new Error('Choose one available camp upgrade and a route.');
  const restock = Number(perkId === 'restock');
  const next = { ...session, leg: session.leg + 1, path: route.path, phase: 'playing',
    perks: perkId === 'restock' ? [...session.perks] : [...session.perks, perkId],
    legMemory: normalizeMemory(session.run.memory), journal: [],
    loadout: { health: Math.min(3, session.run.health + 1 + restock), decoys: Math.min(3, session.run.decoys + restock),
      shields: Math.min(3, session.run.shields + restock + Number(routeCode === 's')) } };
  next.run = makeRun(next); return next;
}
export function retryLeg(session) {
  if (!['playing', 'lost'].includes(session.phase)) return session;
  const next = { ...session, phase: 'playing', retries: session.retries + Number(session.run.turns > 0), journal: [],
    legMemory: normalizeMemory(session.run.memory) };
  next.run = makeRun(next); return next;
}
export function journeyUndoFrames(session,limit=60){
  let run=makeRun(session);const frames=[];
  for(let i=0;i<session.journal.length;i++){
    if(i>=session.journal.length-limit)frames.push({run,length:i,action:session.journal[i]});
    run=session.journal[i]==='forget'?{...run,memory:freshMemory(),events:[],message:'The expedition’s learned movement habits were cleared.'}:stepRun(run,session.journal[i]);
  }
  return frames;
}
function fingerprint(run, rules = JOURNEY_RULES) {
  const { stage, walkable, events, message, ...state } = run;
  if (rules === '0.5.0') { delete state.switches; delete state.spentCoins; delete state.talkedTo; }
  return hashSeed(JSON.stringify(state)).toString(16);
}
export function serializeJourney(session) {
  if (session.journal.length > MAX_JOURNAL) throw new Error('This leg is too long to checkpoint. Finish it to start a fresh checkpoint.');
  const { run, ...state } = session;
  return JSON.stringify({ version: 1, rules: JOURNEY_RULES, state, fingerprint: fingerprint(run) });
}
function readEnvelope(text) {
  if (typeof text !== 'string' || text.length > MAX_BYTES) throw new Error('The expedition checkpoint is too large.');
  let data; try { data = JSON.parse(text); } catch { throw new Error('The expedition checkpoint is not valid JSON.'); }
  if (data?.version !== 1 || !['0.5.0', JOURNEY_RULES].includes(data.rules) || !data.state || typeof data.state !== 'object') throw new Error('This expedition checkpoint uses unsupported rules.');
  const state = data.state;
  if (!state.config || typeof state.config !== 'object') throw new Error('The expedition checkpoint has no rules.');
  const config = expeditionConfig(state.config);
  if (!/^[a-z0-9-]{1,48}$/.test(state.id) || !Number.isInteger(state.leg) || state.leg < 0 || state.leg >= config.length
    || typeof state.path !== 'string' || !/^[sb]+$/.test(state.path) || state.path.length !== state.leg + 1
    || !phases.includes(state.phase) || !validPerks(state.perks) || state.perks.length > state.leg
    || !Number.isInteger(state.retries) || state.retries < 0 || state.retries > 100_000
    || !Array.isArray(state.journal) || state.journal.length > MAX_JOURNAL
    || state.journal.some(action => typeof action !== 'string' || !/^(?:up|down|left|right|wait|dash-(?:up|down|left|right)|decoy|shield|drop-cargo|close-dialogue|forget|(?:interact|choose):[a-z0-9-]{1,40})$/.test(action))
    || !Array.isArray(state.receipts) || state.receipts.length !== state.leg + Number(['camp', 'won'].includes(state.phase))
    || !state.loadout || ['health', 'decoys', 'shields'].some(key => !Number.isInteger(state.loadout[key]) || state.loadout[key] < (key === 'health' ? 1 : 0) || state.loadout[key] > 3)) {
    throw new Error('The expedition checkpoint has invalid progress.');
  }
  if ((state.phase === 'camp' && state.leg + 1 >= config.length) || (state.phase === 'won' && state.leg + 1 !== config.length)) throw new Error('The expedition checkpoint has an invalid ending.');
  const receipts = state.receipts.map((receipt, index) => {
    if (!receipt || receipt.leg !== index || !['lantern', 'relay', 'rescue', 'courier', 'treasure', 'watcher'].includes(receipt.family)
      || !['woodland', 'marsh', 'ruins', 'dunes'].includes(receipt.biome) || typeof receipt.delivered !== 'boolean'
      || ['score', 'turns', 'stars', 'damage', 'coins', 'totalCoins', 'rescues', 'relays'].some(key => !Number.isInteger(receipt[key]) || receipt[key] < 0 || receipt[key] > 1_000_000)
      || receipt.turns < 1 || receipt.stars < 1 || receipt.stars > 3 || receipt.coins > receipt.totalCoins) throw new Error('The expedition log is invalid.');
    return { leg: index, family: receipt.family, biome: receipt.biome, score: receipt.score, turns: receipt.turns, stars: receipt.stars,
      damage: receipt.damage, coins: receipt.coins, totalCoins: receipt.totalCoins, delivered: receipt.delivered, rescues: receipt.rescues, relays: receipt.relays };
  });
  return { state: { id: state.id, config, leg: state.leg, path: state.path, phase: state.phase, perks: [...state.perks],
    legMemory: normalizeMemory(state.legMemory), loadout: { health: state.loadout.health, decoys: state.loadout.decoys, shields: state.loadout.shields },
    journal: [...state.journal], receipts, retries: state.retries }, fingerprint: data.fingerprint, rules: data.rules };
}
export function restoreJourney(text) {
  const { state, fingerprint: expected, rules } = readEnvelope(text);
  let run = makeRun(state);
  for (const action of state.journal) run = action === 'forget' ? { ...run, memory: freshMemory(), events: [], message: 'The expedition’s learned movement habits were cleared.' } : stepRun(run, action);
  const expectedStatus = ['camp', 'won'].includes(state.phase) ? 'won' : state.phase === 'lost' ? 'lost' : 'playing';
  if (run.status !== expectedStatus || fingerprint(run, rules) !== expected) throw new Error('The expedition checkpoint could not be verified.');
  return { ...state, run };
}
export function peekJourney(storage) {
  let text;
  try { text = storage.getItem(JOURNEY_KEY); }
  catch (error) { return { header: null, error: error.message, unavailable: true }; }
  try { if (!text) return { header: null, error: null }; const { state } = readEnvelope(text); return { header: { config: state.config, leg: state.leg, phase: state.phase }, error: null }; }
  catch (error) { return { header: null, error: error.message }; }
}
export function loadJourney(storage) {
  try { const text = storage.getItem(JOURNEY_KEY); return { session: text ? restoreJourney(text) : null, error: null }; }
  catch (error) { return { session: null, error: error.message }; }
}
export function saveJourney(storage, session) {
  try { storage.setItem(JOURNEY_KEY, serializeJourney(session)); return { saved: true, error: null }; }
  catch (error) { return { saved: false, error: error.message }; }
}
