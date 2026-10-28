import test from 'node:test';
import assert from 'node:assert/strict';
import { snapshotSaves,serializeSaveArchive,parseSaveArchive,replaceSavedData,createSaveSession,SAVE_GENERATION_KEY,MAX_SAVE_ARCHIVE_BYTES } from '../src/save-data.mjs';
function memory(entries=[]){const data=new Map(entries);return {data,get length(){return data.size;},key:index=>[...data.keys()][index]??null,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,String(value)),removeItem:key=>data.delete(key)};}
const original=[['tilewright.adventures.v1','{"version":1,"records":{}}'],['tilewright.workshop.draft.v1','A little 雨 island'],['tilewright.legacy.v0','{corrupt'],['other.game','untouched']];
const owned=storage=>snapshotSaves(storage);
test('snapshot includes all game versions and corrupt saves but excludes unrelated data and coordination metadata',()=>{
 const storage=memory([...original,[SAVE_GENERATION_KEY,'ready:old']]);assert.equal(owned(storage).length,3);assert.ok(owned(storage).every(([key])=>key!=='other.game'&&key!==SAVE_GENERATION_KEY));
});
test('portable full backup roundtrips exact UTF-8 values and corrupt data without interpreting it',()=>{
 const entries=owned(memory(original)),archive=serializeSaveArchive(entries,'2026-10-22T12:00:00.000Z');assert.deepEqual(parseSaveArchive(archive).entries,[...entries].sort(([a],[b])=>a.localeCompare(b)));assert.equal(parseSaveArchive(serializeSaveArchive([])).entries.length,0);
});
test('backup rejects malformed, oversized, future, foreign, duplicate, and metadata entries',()=>{
 const base={format:'lantern-trails-save',version:1,createdAt:'2026-10-22T12:00:00Z',entries:[]};for(const data of [{...base,version:2},{...base,format:'other'},{...base,createdAt:'invalid'},{...base,entries:[['other.game','x']]},{...base,entries:[[SAVE_GENERATION_KEY,'x']]},{...base,entries:[['tilewright.a','x'],['tilewright.a','y']]},{...base,entries:[['tilewright.a',42]]},{...base,entries:[{key:'tilewright.a',value:'x'}]}])assert.throws(()=>parseSaveArchive(JSON.stringify(data)));assert.throws(()=>parseSaveArchive('{'));assert.throws(()=>parseSaveArchive('x'.repeat(MAX_SAVE_ARCHIVE_BYTES+1)));
});
test('full fresh start removes every owned save, keeps other games, and completes the new generation',()=>{
 const storage=memory(original),result=replaceSavedData(storage,[]);assert.equal(result.ok,true);assert.deepEqual(owned(storage),[]);assert.equal(storage.getItem('other.game'),'untouched');assert.match(storage.getItem(SAVE_GENERATION_KEY),/^ready:/);
});
test('full restoration replaces all owned data exactly without touching another game',()=>{
 const storage=memory(original),incoming=[['tilewright.preferences.v1','{"volume":30}'],['tilewright.trail.checkpoint.v1','recorded-route']];assert.equal(replaceSavedData(storage,incoming).ok,true);assert.deepEqual(owned(storage),incoming);assert.equal(storage.getItem('other.game'),'untouched');
});
test('invalid incoming data and unreadable current saves fail before erasure',()=>{
 const storage=memory(original);assert.equal(replaceSavedData(storage,[['not-owned','x']]).ok,false);assert.deepEqual([...storage.data],original);storage.getItem=()=>{throw Error('blocked');};assert.equal(replaceSavedData(storage,[]).restored,true);assert.deepEqual([...storage.data],original);
});
test('generation write failure never deletes player data',()=>{
 const storage=memory(original);storage.setItem=()=>{throw Error('blocked');};assert.equal(replaceSavedData(storage,[]).ok,false);assert.deepEqual([...storage.data],original);
});
test('silent failed deletion is detected and the original exact data is retained',()=>{
 const storage=memory(original),remove=storage.removeItem;storage.removeItem=key=>{if(key!=='tilewright.legacy.v0')remove(key);};const result=replaceSavedData(storage,[]);assert.equal(result.ok,false);assert.equal(result.restored,true);assert.deepEqual(owned(storage),owned(memory(original)));assert.match(storage.getItem(SAVE_GENERATION_KEY),/^ready:/);
});
test('a transient restore write failure rolls back to the exact original snapshot',()=>{
 const storage=memory(original),write=storage.setItem;let failed=false;storage.setItem=(key,value)=>{if(key==='tilewright.new.v1'&&!failed){failed=true;throw Error('full');}write(key,value);};const result=replaceSavedData(storage,[['tilewright.new.v1','new']]);assert.equal(result.ok,false);assert.equal(result.restored,true);assert.deepEqual(owned(storage),owned(memory(original)));assert.deepEqual(parseSaveArchive(result.recovery).entries,owned(memory(original)));
});
test('failed rollback preserves an exportable recovery copy instead of reporting success',()=>{
 const storage=memory(original),write=storage.setItem;storage.setItem=(key,value)=>{if(key!==SAVE_GENERATION_KEY)throw Error('full');write(key,value);};const result=replaceSavedData(storage,[['tilewright.new.v1','new']]);assert.equal(result.ok,false);assert.equal(result.restored,false);assert.deepEqual(parseSaveArchive(result.recovery).entries,owned(memory(original)));assert.match(storage.getItem(SAVE_GENERATION_KEY),/^ready:/);
});
test('old tabs cannot read or write stale in-memory state after a completed reset',()=>{
 const storage=memory(original),notifications=[],old=createSaveSession(storage,pending=>notifications.push(pending)),fresh=createSaveSession(storage);assert.equal(fresh.replace([]).ok,true);assert.throws(()=>old.storage.setItem('tilewright.adventures.v1','resurrected'));assert.throws(()=>old.storage.removeItem('tilewright.preferences.v1'));assert.throws(()=>old.storage.getItem('tilewright.adventures.v1'));assert.deepEqual(owned(storage),[]);assert.deepEqual(notifications,[false]);
});
test('a tab opened during replacement cannot write and waits until the generation is ready',()=>{
 const storage=memory([[SAVE_GENERATION_KEY,'changing:busy']]),notifications=[],session=createSaveSession(storage,pending=>notifications.push(pending));assert.throws(()=>session.storage.setItem('tilewright.a','stale'));assert.deepEqual(notifications,[true]);storage.setItem(SAVE_GENERATION_KEY,'ready:busy');session.storageChanged({key:SAVE_GENERATION_KEY});assert.deepEqual(notifications,[true,false]);assert.deepEqual(owned(storage),[]);
});
test('storage notifications ignore unrelated games and invalidate only once per phase',()=>{
 const storage=memory(),notifications=[],session=createSaveSession(storage,pending=>notifications.push(pending));session.storageChanged({key:'other.game'});assert.deepEqual(notifications,[]);storage.setItem(SAVE_GENERATION_KEY,'changing:new');session.storageChanged({key:SAVE_GENERATION_KEY});session.storageChanged({key:SAVE_GENERATION_KEY});storage.setItem(SAVE_GENERATION_KEY,'ready:new');session.storageChanged({key:SAVE_GENERATION_KEY});assert.deepEqual(notifications,[true,false]);
});
test('a restored rollback rebases the owning session without losing its ability to save',()=>{
 const storage=memory(original),session=createSaveSession(storage),remove=storage.removeItem;let failed=false;storage.removeItem=key=>{if(!failed){failed=true;throw Error('blocked once');}remove(key);};assert.equal(session.replace([]).restored,true);session.storage.setItem('tilewright.new.v1','play continues');assert.equal(storage.getItem('tilewright.new.v1'),'play continues');
});
test('a failed initial readback can finish coordination without erasing any player data',()=>{
 const storage=memory(original),get=storage.getItem;let failed=false;storage.getItem=key=>{if(key===SAVE_GENERATION_KEY&&get(key)?.startsWith('changing:')&&!failed){failed=true;throw Error('read temporarily blocked');}return get(key);};const result=replaceSavedData(storage,[]);assert.equal(result.ok,false);assert.deepEqual(owned(storage),owned(memory(original)));assert.match(storage.getItem(SAVE_GENERATION_KEY),/^ready:/);
});
test('an interrupted update can be recovered explicitly without deleting player data',()=>{
 const storage=memory([...original,[SAVE_GENERATION_KEY,'changing:abandoned']]),session=createSaveSession(storage);session.recoverInterrupted();assert.match(storage.getItem(SAVE_GENERATION_KEY),/^ready:/);assert.deepEqual(owned(storage),owned(memory(original)));assert.throws(()=>session.storage.setItem('tilewright.stale.v1','old'));const fresh=createSaveSession(storage);fresh.storage.setItem('tilewright.recovered.v1','new');assert.equal(storage.getItem('tilewright.recovered.v1'),'new');
});
test('a recovery reload does not change a healthy generation or any player file',()=>{
 const storage=memory([...original,[SAVE_GENERATION_KEY,'ready:healthy']]),session=createSaveSession(storage);session.recoverInterrupted();assert.equal(storage.getItem(SAVE_GENERATION_KEY),'ready:healthy');assert.deepEqual(owned(storage),owned(memory(original)));
});
