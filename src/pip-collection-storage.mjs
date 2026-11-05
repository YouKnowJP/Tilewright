// New owned material. See LICENSE; prior MIT permissions remain effective.
import {duoText} from './pip-duo.mjs';
import {normalizeTinkerProject,startTinker,tinkerStep} from './pip-tinker.mjs';
import {normalizePipCollection,serializePipCollection,collectionChapterShape} from './pip-collections.mjs';
export const COLLECTION_SAVE_KEY='tilewright.pip-collections.v1',MAX_SAVED_COLLECTIONS=8,MAX_COLLECTION_STORAGE_BYTES=2_000_000;
const size=text=>new TextEncoder().encode(text).length;
const emptyState=()=>({project:null,testing:false,ticks:0,clear:null});
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function normalizeCollectionAssembly(raw={}){
 const value={format:'pip-adventure-collection',version:1,name:duoText(raw.name,'Our little adventure collection'),author:duoText(raw.author,'A trail keeper'),intro:duoText(raw.intro,'Choose a chapter and make a road together.',240),chapters:raw.chapters??[]};
 if(!Array.isArray(value.chapters))throw Error('Include a collection chapter list.');return value.chapters.length?normalizePipCollection(value):value;
}
export function emptyCollectionJournal(){return {version:1,assembly:normalizeCollectionAssembly(),records:[],current:null,editing:null};}
function stateFor(raw,chapter,{verify=true}={}){
 if(!raw||typeof raw.testing!=='boolean'||!Number.isInteger(raw.ticks)||raw.ticks<0||raw.ticks>240||!raw.testing&&raw.ticks!==0)throw Error('Choose a valid saved chapter position.');
 const project=raw.project===null?null:normalizeTinkerProject(raw.project,{verify}),clear=raw.clear===null?null:normalizeTinkerProject(raw.clear,{verify});
 if(project&&(project.version<2||project.trialId!==chapter.project.trialId)||!project&&(raw.testing||raw.ticks))throw Error('A saved setup must belong to its collection chapter.');
 if(clear&&(!clear.proof||collectionChapterShape(clear)!==collectionChapterShape(chapter.project)))throw Error('A saved clear must finish the original collection chapter.');
 return {project,testing:raw.testing,ticks:raw.ticks,clear};
}
export function normalizeCollectionJournal(raw){
 if(!raw||raw.version!==1||!Array.isArray(raw.records)||raw.records.length>MAX_SAVED_COLLECTIONS)throw Error('This collection shelf is not supported.');const used=new Set();
 const records=raw.records.map(record=>{if(!/^collection-[1-8]$/.test(record?.id)||used.has(record.id))throw Error('Collection shelf slots must be unique.');used.add(record.id);const collection=normalizePipCollection(record.collection);if(!Array.isArray(record.states)||record.states.length!==collection.chapters.length||record.lastChapter!==null&&(!Number.isInteger(record.lastChapter)||record.lastChapter<0||record.lastChapter>=collection.chapters.length))throw Error('Saved chapter progress does not match its collection.');return {id:record.id,collection,states:record.states.map((s,i)=>stateFor(s,collection.chapters[i])),lastChapter:record.lastChapter};});
 if(raw.current!==null&&!used.has(raw.current)||raw.editing!=null&&!used.has(raw.editing))throw Error('The current collection is missing.');const result={version:1,assembly:normalizeCollectionAssembly(raw.assembly),records,current:raw.current,editing:raw.editing??null};if(size(JSON.stringify(result))>MAX_COLLECTION_STORAGE_BYTES)throw Error('The collection shelf exceeds 2 MB.');return result;
}
export function loadCollectionJournal(storage){let raw=null;try{raw=storage.getItem(COLLECTION_SAVE_KEY);if(raw===null)return {journal:emptyCollectionJournal(),raw,failed:false};if(typeof raw!=='string'||size(raw)>MAX_COLLECTION_STORAGE_BYTES)throw Error('Collection saves exceed 2 MB.');return {journal:normalizeCollectionJournal(JSON.parse(raw)),raw,failed:false};}catch(error){return {journal:emptyCollectionJournal(),raw,failed:true,error:error.message};}}
// UI changes enter through the validated domain operations below. Saving avoids
// replaying every already-verified clear on each playback tick; loading verifies all.
export function saveCollectionJournal(storage,journal,expectedRaw){
 try{const raw=JSON.stringify(journal);if(size(raw)>MAX_COLLECTION_STORAGE_BYTES)throw Error('The collection shelf exceeds 2 MB.');if(storage.getItem(COLLECTION_SAVE_KEY)!==expectedRaw)throw Error('Collection saves changed in another tab. Reload before saving here.');storage.setItem(COLLECTION_SAVE_KEY,raw);if(storage.getItem(COLLECTION_SAVE_KEY)!==raw)throw Error('The browser did not keep the collection save.');return {ok:true,raw};}catch(error){return {ok:false,error:error.message};}
}
export function keepCollection(journal,input,id=null,{copy=false}={}){
 const collection=normalizePipCollection(input);let old=id?journal.records.find(r=>r.id===id):null;if(id&&!old)throw Error('Choose an existing collection slot.');if(!id&&!copy){const matching=journal.records.filter(r=>serializePipCollection(r.collection)===serializePipCollection(collection));old=matching.find(r=>r.id===journal.current)||matching[0];if(old)return {journal:{...journal,current:old.id},id:old.id};}
 if(!id){id=Array.from({length:MAX_SAVED_COLLECTIONS},(_,i)=>'collection-'+(i+1)).find(id=>!journal.records.some(r=>r.id===id));if(!id)throw Error('All eight collection slots are full. Export or remove one before saving another.');}
 const available=old?old.collection.chapters.map((c,i)=>({key:collectionChapterShape(c.project),state:old.states[i],index:i})):[],mapping=[];
 const states=collection.chapters.map(chapter=>{const index=available.findIndex(c=>c.key===collectionChapterShape(chapter.project));if(index<0){mapping.push(null);return emptyState();}const [match]=available.splice(index,1);mapping.push(match.index);return match.state;});
 const previous=old?.lastChapter,lastChapter=previous===null||previous===undefined?null:(mapping.indexOf(previous)<0?null:mapping.indexOf(previous));const record={id,collection,states,lastChapter};return {journal:{...journal,current:id,records:[...journal.records.filter(r=>r.id!==id),record]},id};
}
export function setCollectionAssembly(journal,raw,editing=journal.editing){if(editing!==null&&!journal.records.some(r=>r.id===editing))throw Error('Choose a saved collection to edit.');const assembly=normalizeCollectionAssembly(raw);return same(assembly,journal.assembly)&&editing===journal.editing?journal:{...journal,assembly,editing};}
export function captureCollectionChapter(journal,id,index,{project,testing,ticks,clear=null}){
 const record=journal.records.find(r=>r.id===id);if(!record||!Number.isInteger(index)||!record.states[index])throw Error('Choose a saved collection chapter.');const previous=record.states[index],draft=same(previous.project,project)?previous.project:normalizeTinkerProject(project),verified=clear?(same(previous.clear,clear)?previous.clear:normalizeTinkerProject(clear)):previous.clear;
 const state=stateFor({...previous,project:draft,testing,ticks:testing?ticks:0,clear:verified},record.collection.chapters[index],{verify:false});if(same(state,previous)&&record.lastChapter===index&&journal.current===id)return journal;
 return {...journal,current:id,records:journal.records.map(r=>r.id===id?{...r,lastChapter:index,states:r.states.map((s,i)=>i===index?state:s)}:r)};
}
export function resetCollectionProgress(journal,id){const old=journal.records.find(r=>r.id===id);if(!old)throw Error('Choose a saved collection.');return {...journal,records:journal.records.map(r=>r.id===id?{...r,lastChapter:null,states:r.states.map(emptyState)}:r)};}
export function removeCollection(journal,id){if(!journal.records.some(r=>r.id===id))throw Error('Choose a saved collection.');return {...journal,current:journal.current===id?null:journal.current,editing:journal.editing===id?null:journal.editing,records:journal.records.filter(r=>r.id!==id)};}
export function replayCollectionSnapshot(snapshot){
 if(!snapshot?.project)throw Error('This chapter has no saved setup.');let state=startTinker(snapshot.project);const frames=[state];if(snapshot.testing)while(state.status==='playing'&&state.ticks<snapshot.ticks){state=tinkerStep(state);frames.push(state);}return {state,history:frames.slice(0,-1),testing:snapshot.testing};
}
