import test from 'node:test';import assert from 'node:assert/strict';
import {promiseBook,promiseWorld,PROMISE_LEVELS}from'../src/storybook-promise.mjs';
import {normalizeBook,normalizeBookDraft,serializeBook,parseBook,bookKey,beginBook,chooseChapter,chooseBookRoute,finishChapter,bookStage,saveBooks,loadBooks,recordBook}from'../src/storybook-model.mjs';
import{adventureStage,verifyAdventureProof}from'../src/workshop-model.mjs';import{createRun,stepRun}from'../src/adventure.mjs';
const storage=()=>{const values=new Map();return{values,getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)}};
for(const id of PROMISE_LEVELS)for(const difficulty of ['trail','nemesis'])test(`Promise world has a real clean ${difficulty} clear: ${id}`,async()=>{const world=promiseWorld(id),before=structuredClone(world),run=world.proof.actions.reduce(stepRun,createRun(adventureStage(world),{difficulty}));assert.equal(run.status,'won');assert.equal(run.damage,0);assert.deepEqual(world,before);assert.equal((await verifyAdventureProof(world)).status,'won');if(id==='ferry')assert.ok(run.crates.some(c=>c.x===6&&c.y===5));});
for(const route of ['ferry','workshop'])for(const difficulty of ['trail','nemesis'])test(`Branching book follows only ${route} worlds, persists at every camp, and earns its ending / ${difficulty}`,()=>{
 const disk=storage(),book=parseBook(serializeBook(promiseBook()));let session=beginBook(book,difficulty);const visited=[];
 const roundtrip=()=>{assert.ok(saveBooks(disk,{draft:normalizeBookDraft({chapters:[]}),session,records:{}}));const loaded=loadBooks(disk);assert.equal(loaded.damaged,false);assert.deepEqual(loaded.session,session);session=loaded.session;};
 while(session.phase!=='won'){
  if(session.phase==='choice'){assert.throws(()=>chooseChapter(session,'clean'));roundtrip();session=chooseBookRoute(session,route);roundtrip();continue;}
  roundtrip();visited.push(session.chapter);session=chooseChapter(session,'clean');roundtrip();const page=book.chapters[session.chapter],run=page.world.proof.actions.reduce(stepRun,createRun(bookStage(session),{difficulty}));session=finishChapter(session,run);roundtrip();
 }
 assert.deepEqual(visited,route==='ferry'?[0,1,3]:[0,2,4]);assert.match(session.ending,new RegExp(route.toUpperCase()));assert.equal(session.receipts.length,3);assert.equal(Object.keys(recordBook({},session)).length,1);assert.equal(bookKey(book),bookKey(promiseBook()));
});
test('chapter links reject loops, missing targets, early endings, empty labels and forged path receipts',()=>{
 const book=promiseBook();for(const target of [0,-1,6,99,'bad']){const copy=structuredClone(book);copy.chapters[0].routes[0].target=target;assert.throws(()=>normalizeBook(copy));}
 const missing=structuredClone(book);missing.chapters[0].routes[0].target=5;assert.throws(()=>normalizeBook(missing),/missing/);
 const early=structuredClone(book);early.chapters[0].routes[0].target='end';assert.throws(()=>normalizeBook(early),/two/);
 const empty=structuredClone(book);empty.chapters[0].routes[0].label='';assert.throws(()=>normalizeBook(empty),/label/);
 let session=chooseChapter(beginBook(book),'wander');session=finishChapter(session,book.chapters[0].world.proof.actions.reduce(stepRun,createRun(bookStage(session))));session=chooseBookRoute(session,'ferry');
 const disk=storage();session.receipts[0].route='workshop';saveBooks(disk,{draft:normalizeBookDraft({chapters:[]}),session,records:{}});assert.equal(loadBooks(disk).damaged,true);
});
test('terminal choices have separate endings and a portable verified completed checkpoint',()=>{
 const book=promiseBook();book.chapters=book.chapters.slice(0,2);delete book.chapters[0].routes;delete book.chapters[1].next;book.chapters[1].routes=[{id:'stay',label:'Stay by the river',target:'end',ending:'A home by the water.'},{id:'go',label:'Travel onward',target:'end',ending:'A new road opens.'}];let session=beginBook(book);for(let i=0;i<2;i++){session=chooseChapter(session,'wander');session=finishChapter(session,book.chapters[i].world.proof.actions.reduce(stepRun,createRun(bookStage(session))));}const finished=chooseBookRoute(session,'go');assert.equal(finished.phase,'won');assert.equal(finished.ending,'A new road opens.');const disk=storage();assert.ok(saveBooks(disk,{draft:normalizeBookDraft({chapters:[]}),session:finished,records:{}}));assert.deepEqual(loadBooks(disk).session,finished);
});
