import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, stepRun } from '../src/adventure.mjs';
import { createDocument } from '../src/model.mjs';
import { blankAdventure, normalizeAdventure, adventureKey, editAdventure, placeObject, checkAdventure, adventureStage, verifyAdventureProof, applyStamp } from '../src/workshop-model.mjs';
import { adventureCode, parseAdventureCode, serializeAdventure, parseAdventure, encodeRuns, decodeRuns, adventurePlayLink } from '../src/workshop-sharing.mjs';
import { workshopShowcases, seededAdventure, adventureFromMap } from '../src/workshop-worlds.mjs';
import { loadWorkshop, storeWorkshop, addWorkshopAdventure, loadWorkshopDraft, saveWorkshopDraft, loadWorkshopBests, saveWorkshopBest, WORKSHOP_KEY, MAX_ADVENTURES } from '../src/workshop-library.mjs';
const storageFor = () => { const values = new Map([['tilewright.document.v1', 'original terrain'], ['tilewright.adventures.v1', 'story records'], ['tilewright.expedition.v1', 'checkpoint']]); return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }; };

test('adventure normalization bounds objects, routes, text and dimensions and removes unknown metadata', () => {
  const pack = blankAdventure(), copy = structuredClone(pack), clean = normalizeAdventure({ ...pack, script: 'discard', markers: pack.markers.map(marker => ({ ...marker, execute: 'discard' })) });
  assert.equal(clean.script, undefined); assert.equal(clean.markers[0].execute, undefined); assert.deepEqual(pack, copy);
  for (const patch of [{ version: 9 }, { title: '' }, { title: 'two\nlines' }, { author: 'two\tcolumns' }, { intro: 'x'.repeat(801) }, { map: { ...pack.map, width: 65 } }, { markers: Array(129).fill(pack.markers[0]) }, { markers: [{ ...pack.markers[0], x: -1 }] }, { markers: [pack.markers[0], pack.markers[0]] }]) assert.throws(() => normalizeAdventure({ ...pack, ...patch }));
  assert.equal(checkAdventure(pack).ready, true);
});
test('content identities separate edited worlds and rule sets without including clear journals', () => {
  const pack = blankAdventure(), key = adventureKey(pack);
  assert.equal(adventureKey({ ...pack, proof: { difficulty: 'trail', actions: ['wait'] } }), key);
  assert.notEqual(adventureKey(editAdventure(pack, { rules: { allCoins: true } })), key);
  assert.notEqual(adventureKey(editAdventure(pack, { title: 'Another path' })), key);
  assert.equal(editAdventure({ ...pack, proof: { difficulty: 'trail', actions: ['wait'] } }, { par: 200 }).proof, undefined);
});
test('object painting moves unique objectives, replaces a cell, and preserves overlay cover', () => {
  const original = blankAdventure(); let pack = placeObject(original, 'start', 3, 3);
  assert.equal(pack.markers.filter(m => m.kind === 'start').length, 1);
  pack = placeObject(pack, 'fern', 4, 4); pack = placeObject(pack, 'coin', 4, 4); pack = placeObject(pack, 'key', 4, 4);
  assert.deepEqual(pack.markers.filter(m => m.x === 4 && m.y === 4).map(m => m.kind), ['fern', 'key']);
  assert.equal(original.markers.find(m => m.kind === 'start').x, 2);
});
test('linked puzzles, routes and disconnected objectives receive actionable diagnostics', () => {
  let pack = placeObject(blankAdventure(), 'door', 4, 4, { channel: 'jade' }); assert.match(checkAdventure(pack).errors.join(' '), /jade.*lever/);
  pack = placeObject(pack, 'lever', 3, 4, { channel: 'jade' }); assert.equal(checkAdventure(pack).ready, true);
  pack = placeObject(pack, 'waystone', 5, 4); assert.match(checkAdventure(pack).errors.join(' '), /two endpoints|specialist/);
  let broken = placeObject(blankAdventure(), 'patrol', 6, 6, { route: [{ x: 6, y: 6 }, { x: 8, y: 6 }] }); assert.match(checkAdventure(broken).errors.join(' '), /adjacent/);
  const map = createDocument('Islands', 8, 8); map.layers[0].tiles.fill(3); for (const [x, y] of [[1, 1], [1, 2], [6, 6]]) map.layers[0].tiles[y * 8 + x] = 1;
  broken = normalizeAdventure({ ...blankAdventure(8, 8), map, markers: [{ id: 's', kind: 'start', x: 1, y: 1 }, { id: 'e', kind: 'beacon', x: 1, y: 2 }, { id: 'l', kind: 'lantern', x: 6, y: 6 }] });
  assert.match(checkAdventure(broken).errors.join(' '), /disconnected/);
});
test('all new showcase maps compile with their intended goals and specialist tools on both rules', () => {
  const showcases = workshopShowcases(); assert.equal(showcases.length, 3);
  for (const pack of showcases) { assert.deepEqual(checkAdventure(pack).errors, [], pack.title); for (const difficulty of ['trail', 'nemesis']) assert.equal(createRun(adventureStage(pack), { difficulty }).status, 'playing'); }
  assert.ok(showcases[0].markers.some(m => m.kind === 'rescue')); assert.ok(showcases[1].rules.allCoins); assert.ok(showcases[2].markers.some(m => m.kind === 'hunter'));
});
test('all twenty seeded region/mission recipes produce deterministic editable adventures', () => {
  for (const region of ['woodland', 'marsh', 'ruins', 'dunes']) for (const family of ['lantern', 'relay', 'rescue', 'courier', 'treasure']) {
    const pack = seededAdventure('world-maker', region, family); assert.deepEqual(checkAdventure(pack).errors, [], `${region}/${family}`);
    assert.equal(adventureKey(seededAdventure('world-maker', region, family)), adventureKey(pack));
    const run = createRun(adventureStage(pack)); assert.equal(run.status, 'playing');
  }
  assert.throws(() => seededAdventure('x', 'unknown', 'lantern')); assert.throws(() => seededAdventure('bad<script>'));
});
test('terrain conversion and puzzle stamps retain the source map and support undoable plain values', () => {
  const map = createDocument('Painted world', 24, 18), before = structuredClone(map), pack = adventureFromMap(map);
  assert.equal(checkAdventure(pack).ready, true); assert.deepEqual(map, before);
  const crossing = applyStamp(pack, 'crossing', 10, 8, 'violet'); assert.equal(crossing.markers.filter(m => m.kind === 'bridge')[0].channel, 'violet');
  assert.deepEqual(map, before); assert.throws(() => applyStamp(pack, 'grove', 0, 0), /tiles around/);
});
test('adventure files and codes round-trip Unicode stories, all layers and proof metadata', () => {
  const pack = editAdventure(blankAdventure(64, 64), { title: '月の道 — Lanterns', intro: 'A keeper says: “Come home.”\nA second line.' });
  pack.map.layers.push({ id: 'hidden', name: 'Hidden', visible: false, tiles: Array(4096).fill(10) });
  assert.deepEqual(parseAdventure(serializeAdventure(pack)), pack); assert.deepEqual(parseAdventureCode(adventureCode(pack)), pack);
  assert.deepEqual(parseAdventureCode(`https://example.org/game/#adventure=${adventureCode(pack)}`), pack);
  assert.equal(parseAdventure(JSON.stringify(pack)).map.layers.length, 3);
});
test('share decoding rejects corrupt checksums, malformed run data and decompression bombs before expansion', () => {
  assert.deepEqual(decodeRuns(encodeRuns([1, 1, 2, 2, 2]), 5), [1, 1, 2, 2, 2]);
  for (const runs of [[1, 4097], [1, -1], [13, 4], [1, 1], [1], 'oops', [1, 1.5]]) assert.throws(() => decodeRuns(runs, 4));
  const code = adventureCode(blankAdventure()); assert.throws(() => parseAdventureCode(code.replace(/LT1\.[0-9a-f]{8}/, 'LT1.00000000')), /changed|incomplete/);
  assert.throws(() => parseAdventureCode('x'.repeat(300201))); assert.throws(() => parseAdventure('{')); assert.throws(() => parseAdventure('x'.repeat(400001)));
});
test('play links use hosted HTTP origins and preserve no unrelated query parameters', () => {
  const pack = blankAdventure(), url = adventurePlayLink(pack, 'https://example.org/game/?private=discard#play');
  assert.match(url, /^https:\/\/example\.org\/game\/#adventure=LT1\./);
  for (const origin of ['http://127.0.0.1:4174', 'http://localhost:4174', 'http://192.168.1.2', 'file:///game/index.html']) assert.throws(() => adventurePlayLink(pack, origin), /local copy|hosted/);
});
test('shelf, draft and content-specific bests remain isolated and survive failed writes in memory', () => {
  const storage = storageFor(), pack = blankAdventure(); let entries = addWorkshopAdventure([], pack);
  assert.equal(storeWorkshop(storage, entries), true); assert.deepEqual(loadWorkshop(storage).entries, entries);
  assert.equal(saveWorkshopDraft(storage, pack), true); assert.deepEqual(loadWorkshopDraft(storage), pack);
  assert.equal(addWorkshopAdventure(entries, pack).length, 1);
  const result = { stars: 3, score: 900, turns: 50 }, saved = saveWorkshopBest(storage, {}, adventureKey(pack), 'trail', result);
  assert.deepEqual(loadWorkshopBests(storage), saved.records); assert.equal(storage.values.get('tilewright.document.v1'), 'original terrain'); assert.equal(storage.values.get('tilewright.expedition.v1'), 'checkpoint');
  const failed = { getItem() { throw Error('blocked'); }, setItem() { throw Error('quota'); } };
  assert.equal(loadWorkshop(failed).unavailable, true); assert.equal(storeWorkshop(failed, entries), false); assert.equal(saveWorkshopDraft(failed, pack), false);
  assert.equal(saveWorkshopBest(failed, saved.records, adventureKey(pack), 'nemesis', result).saved, false);
});
test('damaged shelf entries are isolated and the library never silently evicts a player world', () => {
  const storage = storageFor(), pack = blankAdventure(); storage.setItem(WORKSHOP_KEY, JSON.stringify({ version: 1, entries: [pack, { bad: true }] }));
  assert.equal(loadWorkshop(storage).entries.length, 1); assert.equal(loadWorkshop(storage).damaged, 1);
  let entries = []; for (let i = 0; i < MAX_ADVENTURES; i++) entries = addWorkshopAdventure(entries, editAdventure(pack, { title: `World ${i}` }));
  assert.throws(() => addWorkshopAdventure(entries, pack), /32 adventures/); assert.equal(entries.length, 32);
});
test('creator clears must replay to a real finish and cannot contain actions after the win', async () => {
  let pack = blankAdventure(8, 8);
  pack = editAdventure(pack, { markers: [{ id: 'start', kind: 'start', x: 2, y: 4 }, { id: 'light', kind: 'lantern', x: 3, y: 4 }, { id: 'home', kind: 'beacon', x: 4, y: 4 }] });
  const cleared = normalizeAdventure({ ...pack, proof: { difficulty: 'trail', actions: ['right', 'right'] } });
  assert.equal((await verifyAdventureProof(cleared)).status, 'won'); assert.equal(await verifyAdventureProof(pack), null);
  await assert.rejects(() => verifyAdventureProof({ ...pack, proof: { difficulty: 'trail', actions: ['wait'] } }), /does not finish/);
  await assert.rejects(() => verifyAdventureProof({ ...pack, proof: { difficulty: 'trail', actions: ['right', 'right', 'wait'] } }), /after its finish/);
  let run = createRun(adventureStage(cleared)); run = stepRun(stepRun(run, 'right'), 'right'); assert.equal(run.status, 'won');
});

import { WORKSHOP_CLEARS } from '../src/workshop-clears.mjs';
for (const [index, pack] of workshopShowcases().entries()) for (const difficulty of ['trail','nemesis']) {
  test(`authored workshop adventure has an ordinary-action clear: ${pack.title} / ${difficulty}`, async () => {
    const run = await verifyAdventureProof({ ...pack, proof: { ...WORKSHOP_CLEARS[index], difficulty } });
    assert.equal(run.status, 'won'); assert.ok(run.health > 0);
    assert.equal(run.collectedLanterns.length, run.stage.lanterns.length);
    assert.equal(run.rescued.length, run.stage.requiredRescues.length);
    if (run.stage.relic) assert.equal(run.cargoDelivered, true);
  });
}

import { readFile } from 'node:fs/promises';
const alternates = JSON.parse(await readFile(new URL('./fixtures/workshop-alternates.json',import.meta.url),'utf8'));
for (const [index,proof] of alternates.entries()) for (const difficulty of ['trail','nemesis']) {
 test(`workshop alternate solution ${['supplies and lever','waystone crossing','double bridge'][index]} / ${difficulty}`,async()=>{
  const run = await verifyAdventureProof({...workshopShowcases()[index===0?0:1],proof:{...proof,difficulty}});
  assert.equal(run.status,'won');
  if(index===0)assert.equal(run.choices.luma,'shield');
  if(index===1)assert.ok(run.guild.warps>0);
  if(index===2)assert.ok(run.guild.uses>0);
 });
}

test('export limits account for UTF-8 bytes so a downloaded world can be imported',()=>{
 const pack=blankAdventure(64,64);for(let n=0;n<4;n++)pack.map.layers.push({...pack.map.layers[0],id:`extra-${n}`,name:`Layer ${n}`,tiles:Array.from({length:4096},(_,i)=>i%12+1)});
 pack.markers=Array.from({length:128},(_,i)=>({id:`mark-${i}`,kind:'guide',x:i%64,y:Math.floor(i/64),text:'漢'.repeat(600)}));
 pack.proof={difficulty:'trail',actions:Array(2000).fill('interact:'+('a'.repeat(39)))};
 assert.throws(()=>serializeAdventure(pack),/400 KB/);
});
