import test from 'node:test';
import assert from 'node:assert/strict';
import { BOOK_KEY, MAX_BOOK_BYTES, normalizeBookDraft, normalizeBook, bookKey, serializeBook, parseBook, beginBook, chooseChapter, bookStage, finishChapter, chapterChallenges, challengeProgress, bookScore, bookHonors, loadBooks, saveBooks, recordBook } from '../src/storybook-model.mjs';
import { featuredBooks } from '../src/storybook-worlds.mjs';
import { LAB_CLEARS } from '../src/workshop-lab-clears.mjs';
import { puzzleLabWorld } from '../src/workshop-lab.mjs';
import { createRun, stepRun } from '../src/adventure.mjs';
import { adventureStage, editAdventure, placeObject } from '../src/workshop-model.mjs';
import { DRAFT_KEY, WORKSHOP_BESTS_KEY } from '../src/workshop-library.mjs';

const book = () => normalizeBook({ title: 'Letters across the creek', author: 'A keeper', chapters: [{ world: puzzleLabWorld('counterweight'), passage: 'A letter waits.' }, { world: puzzleLabWorld('footstep'), passage: 'A shadow answers.' }] });
const memoryStorage = () => { const values = new Map(); return { getItem: key => values.get(key) || null, setItem: (key,value) => values.set(key,value), values }; };
function winChapter(session, actions) { return actions.reduce(stepRun, createRun(bookStage(session), { difficulty: session.difficulty })); }

for (const featured of featuredBooks()) for (const difficulty of ['trail','nemesis']) test(`${featured.title}: full ${difficulty} book, camps, optional honors, portable checkpoint`, () => {
  const storage = memoryStorage(); let session = beginBook(parseBook(serializeBook(featured)),difficulty);
  for (const chapter of featured.chapters) {
    session = chooseChapter(session,'clean'); const before = structuredClone(session), run = winChapter(session,chapter.world.proof.actions);
    assert.equal(run.status,'won'); session = finishChapter(session,run); assert.deepEqual(before.book,session.book); assert.equal(session.receipts.at(-1).earned,true);
    assert.ok(saveBooks(storage,{draft:normalizeBookDraft({chapters:[]}),session,records:{}}));
    const restored = loadBooks(storage); assert.equal(restored.damaged,false); assert.equal(restored.unavailable,false); assert.deepEqual(restored.session,session); session = restored.session;
  }
  assert.equal(session.phase,'won'); assert.equal(bookHonors(session),featured.chapters.length); assert.ok(bookScore(session)>0);
  assert.equal(Object.keys(recordBook({},session)).length,1); assert.throws(()=>bookStage(session),/complete/);
});
test('book imports round-trip Unicode and all chapter snapshots without changing original worlds', () => {
  const input = book(), before = structuredClone(input); input.title = '灯り 🌙'; input.chapters[0].passage = '<img src=x onerror=alert(1)> — only story text';
  assert.deepEqual(parseBook(serializeBook(input)),input); assert.notEqual(bookKey(input),bookKey(before));
  const proofless = structuredClone(input); delete proofless.chapters[0].world.proof; assert.equal(bookKey(proofless),bookKey(input));
  const session = beginBook(input); session.book.chapters[0].world.title = 'An independent copy'; assert.equal(input.chapters[0].world.title,before.chapters[0].world.title);
});
test('featured speed challenges are attainable on both rule sets and reward a purposeful route', () => {
  for (const difficulty of ['trail','nemesis']) {
    let session=beginBook(featuredBooks()[2],difficulty);
    for(const chapter of session.book.chapters){session=chooseChapter(session,'swift');const run=winChapter(session,chapter.world.proof.actions),progress=challengeProgress(run,'swift');assert.equal(progress.earned,true);assert.ok(run.turns >= run.stage.par*.7);session=finishChapter(session,run);}
    assert.equal(bookHonors(session),6);
  }
});
test('book files enforce chapter count, format, text, terrain, total bytes, and per-world bounds', () => {
  const good = book();
  for (const chapters of [[],good.chapters.slice(0,1),Array(7).fill(good.chapters[0])]) assert.throws(()=>normalizeBook({...good,chapters}),/two|six/);
  for (const field of ['title','author','synopsis','ending']) assert.throws(()=>normalizeBook({...good,[field]:'x'.repeat(900)}),/characters/);
  assert.throws(()=>parseBook('broken'),/JSON/); assert.throws(()=>parseBook(' '.repeat(MAX_BOOK_BYTES+1)),/1.6 MB/); assert.throws(()=>parseBook(JSON.stringify({...good,version:2})),/storybook/);
  const encoded = JSON.parse(serializeBook(good)); encoded.chapters[0].world.map.layers[0].runs=[1,1_000_000]; assert.throws(()=>parseBook(JSON.stringify(encoded)),/bounds/);
  assert.throws(()=>normalizeBook({...good,chapters:[{world:{...good.chapters[0].world,markers:[]}},good.chapters[1]]}),/starting point|lantern/);
  assert.throws(()=>beginBook(good,'impossible'),/Trail/);
});
test('all six chapters fit and a draft with zero or one chapter stays editable and persistent', () => {
  const storage = memoryStorage(), draft = normalizeBookDraft({chapters:[]}); assert.equal(draft.chapters.length,0);
  assert.ok(saveBooks(storage,{draft,session:null,records:{}})); assert.deepEqual(loadBooks(storage).draft,draft);
  draft.chapters.push(book().chapters[0]); assert.ok(saveBooks(storage,{draft,session:null,records:{}})); assert.equal(loadBooks(storage).draft.chapters.length,1);
  assert.equal(normalizeBook({...book(),chapters:Array(6).fill(book().chapters[0])}).chapters.length,6);
});
test('chapter camp choices are explicit, difficulty-aware, immutable, and only offered when relevant', () => {
  const session = beginBook(book(),'nemesis'), before = structuredClone(session), stage = bookStage(session);
  assert.deepEqual(chapterChallenges(stage).map(offer=>offer.id),['wander','clean','swift']);
  assert.match(chapterChallenges(stage,'nemesis').find(offer=>offer.id==='swift').description,/119/);
  const selected = chooseChapter(session,'swift'); assert.equal(selected.phase,'playing'); assert.deepEqual(session,before);
  assert.throws(()=>chooseChapter(session,'treasure'),/challenge/); assert.throws(()=>chooseChapter(selected,'clean'),/camp/);
  assert.ok(chapterChallenges(adventureStage(puzzleLabWorld('footstep'))).some(offer=>offer.id==='resourceful'));
  assert.ok(chapterChallenges(adventureStage(puzzleLabWorld('tidekeeper'))).some(offer=>offer.id==='voices'));
  assert.ok(!chapterChallenges(adventureStage(puzzleLabWorld('bellgarden'))).some(offer=>offer.id==='treasure'));
});
test('using a double misses the optional no-power honor; a real crate route earns it', () => {
  const input = book(); input.chapters.reverse(); const session = chooseChapter(beginBook(input),'resourceful');
  const withDouble = winChapter(session,LAB_CLEARS.footstep), crateRoute=['up','up','up','right','right','down','down','right','down','right','right','right','down','down'];
  assert.equal(withDouble.status,'won'); assert.equal(challengeProgress(withDouble,'resourceful').earned,false);
  const without = winChapter(session,crateRoute); assert.equal(without.status,'won'); assert.equal(challengeProgress(without,'resourceful').earned,true);
  assert.equal(finishChapter(session,withDouble).phase,'interlude'); assert.equal(bookHonors(finishChapter(session,withDouble)),0);
});
test('optional treasure can be missed without blocking a completed chapter', () => {
  const input = book(); input.chapters[0].world=placeObject(input.chapters[0].world,'coin',10,8);
  const session = chooseChapter(beginBook(input),'treasure'), run=winChapter(session,LAB_CLEARS.counterweight);
  assert.equal(run.status,'won'); assert.equal(challengeProgress(run,'treasure').earned,false); assert.equal(finishChapter(session,run).chapter,1);
});
test('a late arrival loses only the optional honor and keeps all ordinary chapter points', () => {
  const session = chooseChapter(beginBook(book()),'swift'), run=winChapter(session,[...Array(141).fill('wait'),...LAB_CLEARS.counterweight]);
  assert.equal(run.status,'won'); const next=finishChapter(session,run); assert.equal(next.chapter,1); assert.equal(next.receipts[0].earned,false); assert.ok(next.receipts[0].score>0);
  const quick=winChapter(session,LAB_CLEARS.counterweight); assert.equal(challengeProgress(quick,'swift').earned,true); assert.equal(challengeProgress(createRun(bookStage(session)),'swift').earned,false);
});
test('talking to the guide earns a voice honor without counting required rescue dialogue twice', () => {
  const input=book(); input.chapters[0].world=puzzleLabWorld('tidekeeper'); const session=chooseChapter(beginBook(input),'voices'),run=winChapter(session,LAB_CLEARS.tidekeeper);
  assert.equal(run.status,'won'); assert.equal(challengeProgress(run,'voices').earned,true); assert.match(challengeProgress(run,'voices').detail,/1\/1 guides/);
});
test('damage tracked by the actual engine misses a clean honor and survives a successful finish', () => {
  const input=book();input.chapters[0].world=placeObject(input.chapters[0].world,'ember',2,4);
  const session=chooseChapter(beginBook(input),'clean'),run=winChapter(session,['up','wait','down',...LAB_CLEARS.counterweight]);
  assert.equal(run.status,'won');assert.ok(run.damage>0);assert.equal(challengeProgress(run,'clean').earned,false);assert.equal(finishChapter(session,run).chapter,1);
});
test('duplicate completion, another book, another chapter, another challenge, practice, and changed rules cannot advance the checkpoint', () => {
  const session=chooseChapter(beginBook(book()),'clean'), run=winChapter(session,LAB_CLEARS.counterweight),next=finishChapter(session,run);
  assert.throws(()=>finishChapter(next,run),/current storybook/); assert.throws(()=>finishChapter(session,createRun(bookStage(session))),/current storybook/);
  for (const meta of [{key:'book-00000000'},{chapter:1},{challenge:'swift'}]) assert.throws(()=>finishChapter(session,{...run,stage:{...run.stage,workshop:{...run.stage.workshop,storybook:{...run.stage.workshop.storybook,...meta}}}}),/current storybook/);
  assert.throws(()=>finishChapter(session,{...run,difficulty:'nemesis'}),/current storybook/);
  assert.throws(()=>finishChapter(session,{...run,stage:{...run.stage,workshop:{...run.stage.workshop,key:'a different world'}}}),/current storybook/);
  assert.throws(()=>finishChapter(session,{...run,stage:{...run.stage,workshop:{...run.stage.workshop,practice:true}}}),/current storybook/);
});
test('a playing checkpoint restarts only its open chapter and preserves the chosen challenge', () => {
  let session=chooseChapter(beginBook(book()),'clean');session=finishChapter(session,winChapter(session,LAB_CLEARS.counterweight));session=chooseChapter(session,'resourceful');
  const storage=memoryStorage();assert.ok(saveBooks(storage,{draft:normalizeBookDraft({chapters:[]}),session,records:{}}));
  const restored=loadBooks(storage).session;assert.equal(restored.chapter,1);assert.equal(restored.challenge,'resourceful');assert.deepEqual(restored.receipts,session.receipts);assert.equal(createRun(bookStage(restored)).turns,0);
});
test('storybook saves and full storage failures never write another mode’s keys', () => {
  const storage=memoryStorage();storage.setItem(DRAFT_KEY,'precious draft');storage.setItem(WORKSHOP_BESTS_KEY,'precious bests');
  const state={draft:normalizeBookDraft({chapters:[]}),session:beginBook(book()),records:{}};assert.ok(saveBooks(storage,state));assert.equal(storage.getItem(DRAFT_KEY),'precious draft');assert.equal(storage.getItem(WORKSHOP_BESTS_KEY),'precious bests');assert.equal(storage.values.size,3);
  const denied={getItem(){throw Error('blocked');},setItem(){throw Error('full');}};assert.equal(loadBooks(denied).unavailable,true);assert.equal(saveBooks(denied,state),false);assert.ok(state.session);
});
test('corrupt sections are isolated and bounded checkpoint metadata is validated', () => {
  const storage=memoryStorage(), state={draft:normalizeBookDraft({chapters:[]}),session:beginBook(book()),records:{}};saveBooks(storage,state); const good=JSON.parse(storage.getItem(BOOK_KEY));
  for (const mutation of [value=>value.session.chapter=6,value=>value.session.phase='won',value=>value.session.challenge='clean',value=>value.session.receipts=[{}],value=>value.session.difficulty='fake']) {
    const input=structuredClone(good);mutation(input);storage.setItem(BOOK_KEY,JSON.stringify(input));const result=loadBooks(storage);assert.equal(result.damaged,true);assert.equal(result.session,null);assert.equal(result.draft.chapters.length,0);
  }
  const input=structuredClone(good);input.draft={};storage.setItem(BOOK_KEY,JSON.stringify(input));assert.ok(loadBooks(storage).session);assert.equal(loadBooks(storage).damaged,true);
  storage.setItem(BOOK_KEY,'x'.repeat(MAX_BOOK_BYTES*2+50_001));assert.equal(loadBooks(storage).unavailable,true);
});
test('whole-book records prefer honors, then points, then fewer turns, bounded to 32 versions and separate rules', () => {
  let session=beginBook(book());assert.deepEqual(recordBook({},session),{});
  for(const actions of [LAB_CLEARS.counterweight,LAB_CLEARS.footstep]){session=chooseChapter(session,'clean');session=finishChapter(session,winChapter(session,actions));}
  const records=recordBook({},session),key=`${bookKey(session.book)}-trail`;assert.equal(records[key].honors,2);
  assert.deepEqual(recordBook(records,{...session,receipts:session.receipts.map(receipt=>({...receipt,earned:false,score:receipt.score+1000}))}),records);
  const other=recordBook(records,{...session,difficulty:'nemesis'});assert.equal(Object.keys(other).length,2);
  let many={};for(let index=0;index<35;index++)many=recordBook(many,{...session,book:{...session.book,title:`Edition ${index}`}});assert.equal(Object.keys(many).length,32);
  const storage=memoryStorage();saveBooks(storage,{draft:normalizeBookDraft({chapters:[]}),session,records:other});assert.deepEqual(loadBooks(storage).records,other);
});
