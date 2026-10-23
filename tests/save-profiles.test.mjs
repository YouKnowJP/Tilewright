import test from 'node:test';
import assert from 'node:assert/strict';
import { createSaveSession,serializeSaveArchive,parseSaveArchive,snapshotSaves,SAVE_GENERATION_KEY } from '../src/save-data.mjs';
import { readProfiles,PROFILE_KEY,PROFILE_PREFIX,DEFAULT_PROFILE_ID } from '../src/save-profiles.mjs';
function memory(entries=[]){const data=new Map(entries);return {data,get length(){return data.size;},key:index=>[...data.keys()][index]??null,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,String(value)),removeItem:key=>data.delete(key)};}
const legacy=[['tilewright.adventures.v1','old scores'],['tilewright.trail.checkpoint.v1','exact old trail'],['tilewright.workshop.draft.v1','A little 雨 island'],['other.game','keep me']];
function change(storage,action){const session=createSaveSession(storage),result=session.manageProfile(action);assert.equal(result.ok,true,JSON.stringify(result));return createSaveSession(storage);}
const active=session=>session.profiles().activeId;
test('existing saves become the first journey without writes, migration, or reinterpretation',()=>{
 const storage=memory(legacy),before=[...storage.data],session=createSaveSession(storage);assert.equal(active(session),'original');assert.equal(session.profiles().profiles[0].name,'First journey');assert.deepEqual(session.snapshot(),snapshotSaves(storage));assert.deepEqual([...storage.data],before);
});
test('new journeys isolate all logical save keys and switching resumes exact existing data',()=>{
 const storage=memory(legacy),second=change(storage,{kind:'create',name:'Creative camp'}),id=active(second);assert.notEqual(id,'original');assert.deepEqual(second.snapshot(),[]);
 for(const [key,value]of legacy.slice(0,3))second.storage.setItem(key,`second: ${value}`);
 assert.deepEqual(snapshotSaves(storage),legacy.slice(0,3));const secondFiles=second.snapshot(),first=change(storage,{kind:'switch',id:'original'});assert.deepEqual(first.snapshot(),legacy.slice(0,3));assert.equal(storage.getItem('other.game'),'keep me');assert.deepEqual(change(storage,{kind:'switch',id}).snapshot(),secondFiles);
});
test('every journey supports portable backups using original logical keys without other journeys or metadata',()=>{
 const storage=memory(legacy),second=change(storage,{kind:'create',name:'New run'});second.storage.setItem('tilewright.trail.checkpoint.v1','new checkpoint');const archive=serializeSaveArchive(second.snapshot());assert.deepEqual(parseSaveArchive(archive).entries,[['tilewright.trail.checkpoint.v1','new checkpoint']]);assert.deepEqual(second.snapshot('original'),legacy.slice(0,3));for(const key of [PROFILE_KEY,`${PROFILE_PREFIX}${active(second)}.preferences.v1`])assert.throws(()=>serializeSaveArchive([[key,'inject']]));
});
test('fresh start and legacy backup restoration affect only the current namespaced journey',()=>{
 const storage=memory(legacy),second=change(storage,{kind:'create',name:'Fresh canvas'}),id=active(second);second.storage.setItem('tilewright.workshop.draft.v1','new world');assert.equal(second.replace([]).ok,true);let fresh=createSaveSession(storage);assert.deepEqual(fresh.snapshot(),[]);assert.equal(active(fresh),id);assert.deepEqual(fresh.snapshot('original'),legacy.slice(0,3));assert.equal(fresh.replace(legacy.slice(0,3)).ok,true);fresh=createSaveSession(storage);assert.deepEqual(fresh.snapshot(),legacy.slice(0,3));assert.deepEqual(fresh.snapshot('original'),legacy.slice(0,3));
});
test('fresh starting the original journey preserves namespaced saves and the whole journey list',()=>{
 const storage=memory(legacy),second=change(storage,{kind:'create',name:'Island builder'}),id=active(second);second.storage.setItem('tilewright.document.v1','map');const first=change(storage,{kind:'switch',id:'original'}),catalog=first.profiles();assert.equal(first.replace([]).ok,true);const fresh=createSaveSession(storage);assert.deepEqual(fresh.snapshot(),[]);assert.deepEqual(fresh.profiles(),catalog);assert.deepEqual(fresh.snapshot(id),[['tilewright.document.v1','map']]);
});
test('renaming is a metadata change and does not touch a single world or score',()=>{
 const storage=memory(legacy),next=change(storage,{kind:'rename',id:'original',name:'  Rainy day 雨  '});assert.equal(next.profiles().profiles[0].name,'Rainy day 雨');assert.deepEqual(next.snapshot(),legacy.slice(0,3));
});
test('invalid, duplicate, and over-limit names leave files and metadata untouched',()=>{
 const storage=memory(legacy);change(storage,{kind:'create',name:'Café'});for(const name of ['', '   ','x'.repeat(33),'two\nlines','CAFE\u0301']){const before=[...storage.data],session=createSaveSession(storage);assert.equal(session.manageProfile({kind:'create',name}).ok,false);assert.deepEqual([...storage.data],before);}
});
test('the three-slot cap and invalid switch or active deletion fail before mutation',()=>{
 const storage=memory(legacy);change(storage,{kind:'create',name:'Second'});const third=change(storage,{kind:'create',name:'Third'});for(const action of [{kind:'create',name:'Fourth'},{kind:'delete',id:active(third)},{kind:'switch',id:'missing'},{kind:'switch',id:active(third)},{kind:'delete',id:'missing'},{kind:'rename',id:'missing',name:'Name'},{kind:'invented'}]){const before=[...storage.data];assert.equal(createSaveSession(storage).manageProfile(action).ok,false);assert.deepEqual([...storage.data],before);}
});
test('removing an inactive journey erases its whole namespace and never the active files',()=>{
 const storage=memory(legacy),second=change(storage,{kind:'create',name:'Second'}),id=active(second);second.storage.setItem('tilewright.legacy.v0','unknown old file');const first=change(storage,{kind:'switch',id:'original'});assert.deepEqual(first.snapshot(id),[['tilewright.legacy.v0','unknown old file']]);const result=first.manageProfile({kind:'delete',id});assert.equal(result.ok,true);assert.equal([...storage.data.keys()].some(key=>key.startsWith(`${PROFILE_PREFIX}${id}.`)),false);const after=createSaveSession(storage);assert.deepEqual(after.snapshot(),legacy.slice(0,3));assert.equal(after.profiles().profiles.length,1);assert.throws(()=>after.snapshot(id));
});
test('the original journey can be removed from another journey without reappearing after reload',()=>{
 const storage=memory(legacy),second=change(storage,{kind:'create',name:'Only island'}),id=active(second);second.storage.setItem('tilewright.document.v1','map');const after=change(storage,{kind:'delete',id:DEFAULT_PROFILE_ID});assert.equal(active(after),id);assert.deepEqual(after.profiles().profiles.map(item=>item.id),[id]);assert.deepEqual(snapshotSaves(storage),[]);assert.deepEqual(after.snapshot(),[['tilewright.document.v1','map']]);assert.equal(storage.getItem('other.game'),'keep me');
});
test('a failed journey list write rolls back exactly and the existing session can keep playing',()=>{
 const storage=memory(legacy),session=createSaveSession(storage),write=storage.setItem;let failed=false;storage.setItem=(key,value)=>{if(key===PROFILE_KEY&&!failed){failed=true;throw Error('full');}write(key,value);};const result=session.manageProfile({kind:'create',name:'New'});assert.equal(result.ok,false);assert.equal(result.restored,true);assert.equal(storage.getItem(PROFILE_KEY),null);session.storage.setItem('tilewright.new.v1','still playing');assert.equal(storage.getItem('tilewright.new.v1'),'still playing');assert.deepEqual(snapshotSaves(storage).slice(0,1),legacy.slice(0,1));
});
test('a failed deletion restores both the original journey list and exact inactive files',()=>{
 const storage=memory(legacy),second=change(storage,{kind:'create',name:'Camp'}),before=second.profiles(),remove=storage.removeItem;let failed=false;storage.removeItem=key=>{if(key==='tilewright.trail.checkpoint.v1'&&!failed){failed=true;throw Error('blocked');}remove(key);};const result=second.manageProfile({kind:'delete',id:'original'});assert.equal(result.ok,false);assert.equal(result.restored,true);assert.deepEqual(readProfiles(storage),before);assert.deepEqual(snapshotSaves(storage),legacy.slice(0,3));assert.deepEqual(parseSaveArchive(result.recovery).entries,legacy.slice(0,3));second.storage.setItem('tilewright.new.v1','okay');
});
test('a deletion that also fails rollback keeps an exact recovery backup',()=>{
 const storage=memory(legacy),second=change(storage,{kind:'create',name:'Camp'}),write=storage.setItem,remove=storage.removeItem;let failed=false;storage.removeItem=key=>{if(key==='tilewright.workshop.draft.v1'&&!failed){failed=true;throw Error('blocked');}remove(key);};storage.setItem=(key,value)=>{if(key!==SAVE_GENERATION_KEY&&key!==PROFILE_KEY)throw Error('quota');write(key,value);};const result=second.manageProfile({kind:'delete',id:'original'});assert.equal(result.ok,false);assert.equal(result.restored,false);assert.deepEqual(parseSaveArchive(result.recovery).entries,legacy.slice(0,3));assert.throws(()=>second.storage.setItem('tilewright.stale.v1','stale'));
});
test('silently rejected metadata is detected without erasing legacy progress',()=>{
 const storage=memory(legacy),write=storage.setItem;storage.setItem=(key,value)=>{if(key!==PROFILE_KEY)write(key,value);};const result=createSaveSession(storage).manageProfile({kind:'create',name:'Camp'});assert.equal(result.ok,false);assert.equal(result.restored,true);assert.deepEqual(snapshotSaves(storage),legacy.slice(0,3));assert.equal(storage.getItem(PROFILE_KEY),null);
});
test('read-only storage never changes a profile or erases progress',()=>{
 const storage=memory(legacy),before=[...storage.data];storage.setItem=()=>{throw Error('blocked');};assert.equal(createSaveSession(storage).manageProfile({kind:'create',name:'Camp'}).ok,false);assert.deepEqual([...storage.data],before);
});
test('stale tabs cannot read or write after switching journeys and new tabs use the target namespace',()=>{
 const storage=memory(legacy),notifications=[],old=createSaveSession(storage,pending=>notifications.push(pending));const fresh=change(storage,{kind:'create',name:'Second'});assert.throws(()=>old.storage.setItem('tilewright.trail.checkpoint.v1','stale'));assert.throws(()=>old.storage.getItem('tilewright.adventures.v1'));assert.deepEqual(notifications,[false]);fresh.storage.setItem('tilewright.trail.checkpoint.v1','new');assert.equal(storage.getItem('tilewright.trail.checkpoint.v1'),'exact old trail');assert.equal(createSaveSession(storage).storage.getItem('tilewright.trail.checkpoint.v1'),'new');
});
test('a direct journey-list storage event also locks an older session',()=>{
 const storage=memory(legacy),notifications=[],session=createSaveSession(storage,pending=>notifications.push(pending));storage.setItem(PROFILE_KEY,JSON.stringify({version:1,activeId:'original',profiles:[{id:'original',name:'Changed elsewhere'}]}));session.storageChanged({key:PROFILE_KEY});assert.deepEqual(notifications,[false]);assert.throws(()=>session.snapshot());assert.deepEqual(snapshotSaves(storage),legacy.slice(0,3));
});
test('corrupt, future, duplicate, unsafe, and missing-active catalogues fail closed and preserve every byte',()=>{
 const base={version:1,activeId:'original',profiles:[{id:'original',name:'First'}]};for(const text of ['{',JSON.stringify({...base,version:2}),JSON.stringify({...base,activeId:'missing'}),JSON.stringify({...base,profiles:[]}),JSON.stringify({...base,profiles:[...base.profiles,...base.profiles]}),JSON.stringify({...base,profiles:[{id:'../path',name:'No'}]})]){const storage=memory([...legacy,[PROFILE_KEY,text]]),before=[...storage.data],session=createSaveSession(storage);assert.throws(()=>session.profiles());assert.throws(()=>session.storage.setItem('tilewright.trail.checkpoint.v1','overwrite'));assert.throws(()=>session.replace([]));assert.deepEqual([...storage.data],before);}
});
test('a caller cannot use the save facade or an archive to overwrite journey coordination',()=>{
 const storage=memory(legacy),session=createSaveSession(storage);for(const key of [PROFILE_KEY,SAVE_GENERATION_KEY,`${PROFILE_PREFIX}original.document.v1`,'other.game']){assert.throws(()=>session.storage.setItem(key,'bad'));assert.throws(()=>session.storage.removeItem(key));assert.throws(()=>session.storage.getItem(key));}assert.deepEqual([...storage.data],legacy);
});
