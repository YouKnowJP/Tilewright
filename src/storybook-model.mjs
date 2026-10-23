import { normalizeAdventure, adventureKey, adventureStage, checkAdventure } from './workshop-model.mjs';
import { serializeAdventure, parseAdventure } from './workshop-sharing.mjs';
import { resultFor, turnTarget } from './adventure.mjs';

export const BOOK_FORMAT = 'lantern-storybook', BOOK_KEY = 'tilewright.storybooks.v1';
export const MAX_BOOK_BYTES = 1_600_000, MAX_CHAPTERS = 6;
const bytes = text => new TextEncoder().encode(text).length;
function text(value, limit, fallback = '') {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || value.length > limit) throw Error(`Story text must be at most ${limit} characters.`);
  return value.trim();
}
export function normalizeBookDraft(input) {
  if (!input || typeof input !== 'object' || !Array.isArray(input.chapters) || input.chapters.length > MAX_CHAPTERS) throw Error('A storybook holds up to six chapters.');
  return { format: BOOK_FORMAT, version: input.chapters.some(page=>page?.routes||page?.next!==undefined||page?.ending!==undefined)?2:1, title: text(input.title, 64, 'An unwritten journey'), author: text(input.author, 48, 'A trail keeper'),
    synopsis: text(input.synopsis, 400), ending: text(input.ending, 800), chapters: input.chapters.map((chapter, index) => {
      if (!chapter || typeof chapter !== 'object') throw Error('Each chapter needs a world.');
      const world = normalizeAdventure(chapter.world);
      // Apply the existing per-world size and structural checks before bundling.
      serializeAdventure(world);
      const report = checkAdventure(world); if (!report.ready) throw Error(`${world.title}: ${report.errors[0]}`);
      const target = value => { if (value !== 'end' && (!Number.isInteger(value) || value <= index || value >= MAX_CHAPTERS)) throw Error('Routes must lead to a later chapter or an ending.'); return value; };
      const page = { passage: text(chapter.passage, 800), world };
      if (chapter.next !== undefined) page.next = target(chapter.next);
      if (chapter.ending !== undefined) page.ending = text(chapter.ending, 800);
      if (chapter.routes !== undefined) {
        if (!Array.isArray(chapter.routes) || chapter.routes.length < 2 || chapter.routes.length > 3) throw Error('Offer two or three story routes.');
        const ids = new Set();
        page.routes = chapter.routes.map(route => {
          if (!route || !/^[a-z][a-z0-9-]{0,39}$/.test(route.id) || ids.has(route.id)) throw Error('Story choices need unique route names.');
          ids.add(route.id); const label = text(route.label, 80); if (!label) throw Error('Give every story choice a label.');
          return { id: route.id, label, description: text(route.description, 240), target: target(route.target), ...(route.ending !== undefined ? { ending: text(route.ending, 800) } : {}) };
        });
        delete page.next;
      }
      return page;
    }) };
}
export function normalizeBook(input) {
  const book = normalizeBookDraft(input);
  if (!book.title || !book.author) throw Error('Give your storybook a title and creator name.');
  if (book.chapters.length < 2) throw Error('Add at least two worlds to make a storybook.');
  for (const [index, chapter] of book.chapters.entries()) for (const target of chapter.routes?.map(route => route.target) || [chapter.next ?? (index + 1 === book.chapters.length ? 'end' : index + 1)]) {
    if (target !== 'end' && target >= book.chapters.length) throw Error('A story route points to a missing chapter.');
    if (index === 0 && target === 'end') throw Error('A story route must visit at least two chapters.');
  }
  return book;
}
export function bookKey(input) {
  const book = normalizeBook(input), content = JSON.stringify({ ...book, chapters: book.chapters.map(chapter => ({ ...chapter, world: adventureKey(chapter.world) })) });
  let hash = 2166136261; for (const character of content) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0;
  return `book-${hash.toString(16).padStart(8, '0')}`;
}
function portable(book) { return { ...book, chapters: book.chapters.map(chapter => ({ ...chapter, world: JSON.parse(serializeAdventure(chapter.world)) })) }; }
export function serializeBook(input) {
  const json = JSON.stringify(portable(normalizeBook(input))) + '\n';
  if (bytes(json) > MAX_BOOK_BYTES) throw Error('This storybook exceeds 1.6 MB. Use fewer chapters or simplify its worlds.');
  return json;
}
function decode(input, draft = false) {
  if (input?.format !== BOOK_FORMAT || ![1,2].includes(input.version) || !Array.isArray(input.chapters) || input.chapters.length > MAX_CHAPTERS) throw Error('Choose a Lantern Trails storybook file.');
  const decoded = { ...input, chapters: input.chapters.map(chapter => ({ ...chapter, world: parseAdventure(JSON.stringify(chapter?.world)) })) };
  return draft ? normalizeBookDraft(decoded) : normalizeBook(decoded);
}
export function parseBook(value) {
  if (typeof value !== 'string' || bytes(value) > MAX_BOOK_BYTES) throw Error('Choose a storybook smaller than 1.6 MB.');
  let input; try { input = JSON.parse(value); } catch { throw Error('The storybook file is not valid JSON.'); }
  return decode(input);
}
export function chapterChallenges(stage, difficulty = 'trail') {
  const target = turnTarget({ stage, difficulty });
  return [
    { id: 'wander', name: 'Follow the story', description: 'Enjoy the journey. No extra challenge.', bonus: 0 },
    { id: 'clean', name: 'Untouched light', description: 'Finish without taking any damage.', bonus: 150 },
    { id: 'swift', name: 'A timely arrival', description: `Finish in ${target} turns or fewer.`, bonus: 150 },
    ...(stage.coins.length && !stage.requireCoins ? [{ id: 'treasure', name: 'Leave no glimmer', description: `Find all ${stage.coins.length} treasures before finishing.`, bonus: 150 }] : []),
    ...(stage.npcs.some(npc => !stage.requiredRescues.includes(npc.id)) ? [{ id: 'voices', name: 'Every voice matters', description: 'Speak to every guide before finishing.', bonus: 150 }] : []),
    ...(stage.guild?.kit ? [{ id: 'resourceful', name: 'An ordinary kind of magic', description: 'Finish without using your specialist power.', bonus: 150 }] : []),
  ];
}
export function challengeProgress(run, id) {
  const offer = chapterChallenges(run.stage, run.difficulty).find(item => item.id === id);
  if (!offer) throw Error('Choose a challenge offered by this chapter.');
  const guides = run.stage.npcs.filter(npc => !run.stage.requiredRescues.includes(npc.id));
  const condition = id === 'wander' || (id === 'clean' ? run.damage === 0 : id === 'swift' ? run.turns <= turnTarget(run) : id === 'treasure' ? run.collectedCoins.length === run.stage.coins.length : id === 'voices' ? guides.every(npc => run.talkedTo.includes(npc.id)) : (run.guild?.uses || 0) === 0);
  const detail = id === 'clean' ? `${run.damage} damage` : id === 'swift' ? `${run.turns}/${turnTarget(run)} turns` : id === 'treasure' ? `${run.collectedCoins.length}/${run.stage.coins.length} treasures` : id === 'voices' ? `${guides.filter(npc => run.talkedTo.includes(npc.id)).length}/${guides.length} guides` : id === 'resourceful' ? `${run.guild?.uses || 0} powers used` : 'The journey is the reward';
  return { ...offer, condition, earned: run.status === 'won' && condition && offer.bonus > 0, detail };
}
export function beginBook(input, difficulty = 'trail') {
  if (!['trail', 'nemesis'].includes(difficulty)) throw Error('Choose Trail or Nemesis rules.');
  const book = normalizeBook(input); serializeBook(book);
  return { book, difficulty, chapter: 0, phase: 'interlude', challenge: null, receipts: [] };
}
export function bookStage(session) {
  if (!session || session.phase === 'won' || session.chapter >= session.book.chapters.length) throw Error('This storybook is already complete.');
  const stage = adventureStage(session.book.chapters[session.chapter].world);
  return { ...stage, workshop: { ...stage.workshop, storybook: { key: bookKey(session.book), title: session.book.title, chapter: session.chapter, length: session.book.chapters.length, challenge: session.challenge, ...(session.book.chapters.some(page=>page.routes)?{page:session.receipts.length+1}:{}) } } };
}
export function chooseChapter(session, id) {
  if (session.phase !== 'interlude' || !chapterChallenges(bookStage(session), session.difficulty).some(offer => offer.id === id)) throw Error('Choose your challenge at the chapter camp.');
  return { ...session, challenge: id, phase: 'playing' };
}
export function finishChapter(session, run) {
  const meta = run.stage.workshop?.storybook;
  if (session?.phase !== 'playing' || run.status !== 'won' || !meta || run.stage.workshop.practice || meta.key !== bookKey(session.book) || meta.chapter !== session.chapter || meta.challenge !== session.challenge || run.difficulty !== session.difficulty || run.stage.workshop.key !== adventureKey(session.book.chapters[session.chapter].world)) throw Error('Finish the current storybook chapter before continuing.');
  const result = resultFor(run), challenge = challengeProgress(run, session.challenge), page = session.book.chapters[session.chapter];
  const next = { ...session, challenge: null, receipts: [...session.receipts, { chapter: session.chapter, challenge: session.challenge, earned: challenge.earned, ...result, score: result.score + (challenge.earned ? challenge.bonus : 0) }] };
  return page.routes ? { ...next, phase: 'choice' } : turnPage(next, page.next ?? (session.chapter + 1 < session.book.chapters.length ? session.chapter + 1 : 'end'), page.ending);
}
function turnPage(session, target, ending) {
  return { ...session, chapter: target === 'end' ? session.book.chapters.length : target, phase: target === 'end' ? 'won' : 'interlude', ...(target === 'end' && ending ? { ending } : {}) };
}
export function chooseBookRoute(session, id) {
  const page = session?.book.chapters[session.chapter], route = page?.routes?.find(item => item.id === id);
  if (session?.phase !== 'choice' || !route) throw Error('Choose a story route at the crossroads.');
  const receipts = session.receipts.map((receipt, index) => index === session.receipts.length - 1 ? { ...receipt, route: id } : receipt);
  return turnPage({ ...session, receipts }, route.target, route.ending || page.ending);
}
export const bookScore = session => session.receipts.reduce((sum, receipt) => sum + receipt.score, 0);
export const bookHonors = session => session.receipts.filter(receipt => receipt.earned).length;
function validReceipt(receipt) {
  return receipt && Number.isInteger(receipt.chapter) && typeof receipt.earned === 'boolean' && ['wander','clean','swift','treasure','voices','resourceful'].includes(receipt.challenge)
    && Number.isInteger(receipt.stars) && receipt.stars >= 1 && receipt.stars <= 3 && Number.isInteger(receipt.turns) && receipt.turns >= 1 && receipt.turns <= 1_000_000 && Number.isInteger(receipt.score) && receipt.score >= 0 && receipt.score <= 1_000_000_000 && !(receipt.challenge === 'wander' && receipt.earned);
}
function restoreSession(input) {
  const book = decode(input?.book), length = book.chapters.length; serializeBook(book);
  if (!['trail','nemesis'].includes(input.difficulty) || !Number.isInteger(input.chapter) || input.chapter < 0 || input.chapter > length || !['interlude','playing','won','choice'].includes(input.phase) || !Array.isArray(input.receipts) || input.receipts.length > length || !input.receipts.every(validReceipt) || (input.phase === 'won') !== (input.chapter === length)) throw Error('This storybook checkpoint is damaged.');
  const session = { book, difficulty: input.difficulty, chapter: input.chapter, phase: input.phase, receipts: input.receipts.map(receipt => ({ chapter: receipt.chapter, challenge: receipt.challenge, earned: receipt.earned, stars: receipt.stars, score: receipt.score, turns: receipt.turns, ...(receipt.route !== undefined ? {route:receipt.route} : {}) })), challenge: input.challenge };
  let expected = 0, ending;
  for (const [index, receipt] of session.receipts.entries()) {
    if (receipt.chapter !== expected || expected === 'end') throw Error('This checkpoint has an invalid story route.');
    const page = book.chapters[expected], route = page.routes?.find(item => item.id === receipt.route);
    if (page.routes && !route) {
      if (index !== session.receipts.length - 1 || session.phase !== 'choice' || receipt.route !== undefined) throw Error('This checkpoint has an invalid crossroads.');
      break;
    }
    if (!page.routes && receipt.route !== undefined) throw Error('This checkpoint has an invalid choice.');
    const target = route ? route.target : page.next ?? (expected + 1 < length ? expected + 1 : 'end');
    ending = route?.ending || page.ending; expected = target;
  }
  const pending = session.phase === 'choice';
  if ((expected === 'end' ? length : expected) !== session.chapter || pending && (!session.receipts.length || session.receipts.at(-1).route !== undefined || !book.chapters[expected]?.routes) || !pending && session.receipts.some(receipt => book.chapters[receipt.chapter].routes && !receipt.route)) throw Error('This checkpoint has an invalid story path.');
  if (session.phase === 'won' && ending) session.ending = ending;
  for (const receipt of session.receipts) if (!chapterChallenges(adventureStage(book.chapters[receipt.chapter].world), session.difficulty).some(offer => offer.id === receipt.challenge)) throw Error('This checkpoint has an invalid chapter challenge.');
  if (session.phase === 'playing') {
    if (!chapterChallenges(bookStage(session), session.difficulty).some(offer => offer.id === session.challenge)) throw Error('This checkpoint has an invalid challenge.');
  } else if (session.challenge !== null) throw Error('This checkpoint has an invalid camp.');
  return session;
}
export function recordBook(records, session) {
  if (session.phase !== 'won') return records;
  const id = `${bookKey(session.book)}-${session.difficulty}`, next = { ...records }, result = { honors: bookHonors(session), score: bookScore(session), turns: session.receipts.reduce((sum, receipt) => sum + receipt.turns, 0) }, old = next[id];
  delete next[id]; next[id] = !old || result.honors > old.honors || result.honors === old.honors && (result.score > old.score || result.score === old.score && result.turns < old.turns) ? result : old;
  while (Object.keys(next).length > 32) delete next[Object.keys(next)[0]];
  return next;
}
export function loadBooks(storage) {
  const state = { draft: normalizeBookDraft({ chapters: [] }), session: null, records: {}, damaged: false, unavailable: false };
  try {
    const raw = storage.getItem(BOOK_KEY); if (!raw) return state;
    if (raw.length > MAX_BOOK_BYTES * 2 + 50_000) throw Error('Oversized save');
    const input = JSON.parse(raw); if (input?.version !== 1) throw Error('Unsupported save');
    try { state.draft = decode(input.draft, true); } catch { state.damaged = true; }
    if (input.session) try { state.session = restoreSession(input.session); } catch { state.damaged = true; }
    if (input.records && typeof input.records === 'object' && !Array.isArray(input.records)) state.records = Object.fromEntries(Object.entries(input.records).filter(([id, value]) => /^book-[0-9a-f]{8}-(trail|nemesis)$/.test(id) && value && Number.isInteger(value.honors) && value.honors >= 0 && value.honors <= 6 && Number.isInteger(value.score) && value.score >= 0 && value.score <= 6_000_000_000 && Number.isInteger(value.turns) && value.turns >= 2 && value.turns <= 6_000_000).slice(-32).map(([id, value]) => [id, { honors: value.honors, score: value.score, turns: value.turns }]));
  } catch { state.unavailable = true; }
  return state;
}
export function saveBooks(storage, state) {
  try {
    const json = JSON.stringify({ version: 1, draft: portable(normalizeBookDraft(state.draft)), session: state.session ? { ...state.session, book: JSON.parse(serializeBook(state.session.book)) } : null, records: state.records });
    if (json.length > MAX_BOOK_BYTES * 2 + 50_000) return false;
    storage.setItem(BOOK_KEY, json); return true;
  } catch { return false; }
}
