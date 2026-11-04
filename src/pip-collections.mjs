// New owned material. See LICENSE; prior MIT permissions remain effective.
import {duoText,duoEditable} from './pip-duo.mjs';
import {normalizeTinkerProject,newTinkerProject,tinkerPlayLink} from './pip-tinker.mjs';
export const MAX_COLLECTION_CHAPTERS=6,MAX_COLLECTION_BYTES=96_000,MAX_COLLECTION_CODE=140_000;
const bytes=s=>new TextEncoder().encode(s);
export function normalizePipCollection(raw){
 if(!raw||raw.format!=='pip-adventure-collection'||raw.version!==1||!Array.isArray(raw.chapters)||raw.chapters.length<1||raw.chapters.length>MAX_COLLECTION_CHAPTERS)throw Error('Choose a Pip-and-Sprout collection with one to six chapters.');
 const chapters=raw.chapters.map(chapter=>{const project=normalizeTinkerProject(chapter?.project);if(project.version<2)throw Error('Collections need two-companion adventures.');return {title:duoText(chapter.title,project.name),note:duoText(chapter.note,'A new road for two friends.',180),project};});
 const result={format:'pip-adventure-collection',version:1,name:duoText(raw.name,'Our little adventure collection'),author:duoText(raw.author,'A trail keeper'),intro:duoText(raw.intro,'Choose a chapter and make a road together.',240),chapters};if(bytes(JSON.stringify(result)+'\n').length>MAX_COLLECTION_BYTES)throw Error('Keep this collection smaller than 96 KB.');return result;
}
export function serializePipCollection(input){return JSON.stringify(normalizePipCollection(input))+'\n';}
export function parsePipCollection(text){if(typeof text!=='string'||bytes(text).length>MAX_COLLECTION_BYTES)throw Error('Choose a collection file smaller than 96 KB.');let raw;try{raw=JSON.parse(text);}catch{throw Error('This collection is not valid JSON.');}return normalizePipCollection(raw);}
function checksum(data){let h=2166136261;for(const b of data)h=Math.imul(h^b,16777619)>>>0;return h.toString(16).padStart(8,'0');}
export function pipCollectionCode(input){const data=bytes(serializePipCollection(input));let binary='';for(const b of data)binary+=String.fromCharCode(b);return `PC1.${checksum(data)}.${btoa(binary).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'')}`;}
export function parsePipCollectionCode(raw){
 if(typeof raw!=='string'||raw.length>MAX_COLLECTION_CODE)throw Error('This collection code is too long.');const value=raw.trim(),code=value.includes('#pip-pack=')?value.split('#pip-pack=')[1]:value,match=/^PC1\.([0-9a-f]{8})\.([A-Za-z0-9_-]+)$/.exec(code);if(!match)throw Error('Paste a complete PC1 collection code or collection play link.');let data;try{data=Uint8Array.from(atob(match[2].replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));}catch{throw Error('The collection code is incomplete.');}if(checksum(data)!==match[1])throw Error('This collection changed in transit. Copy the complete code again.');try{return parsePipCollection(new TextDecoder('utf-8',{fatal:true}).decode(data));}catch(error){if(error instanceof TypeError)throw Error('The collection text is not valid UTF-8.');throw error;}
}
export function pipCollectionPlayLink(input,location){try{const pack=normalizePipCollection(input);if(!tinkerPlayLink(pack.chapters[0].project,location))return '';const url=new URL(location);url.search='';url.hash='pip-pack='+pipCollectionCode(pack);return url.href.length<=12_000?url.href:'';}catch{return '';}}
export function collectionChapterProject(input,index,{replay=false}={}){
 const pack=normalizePipCollection(input),chapter=pack.chapters[index];if(!Number.isInteger(index)||!chapter)throw Error('Choose a chapter in this collection.');if(replay){if(!chapter.project.proof)throw Error('This chapter has no verified creator route.');return structuredClone(chapter.project);}
 const base=duoEditable(chapter.project)?chapter.project:newTinkerProject(chapter.project.trialId),{proof,...project}=base;return normalizeTinkerProject({...project,name:chapter.project.name,author:chapter.project.author,programs:base.programs.map(()=>['wait','wait','wait'])});
}
export function collectionChapterShape(input){
 const p=normalizeTinkerProject(input,{verify:false});if(p.version<2)return '';if(!duoEditable(p))return JSON.stringify([p.version,p.trialId]);const order=(a,b)=>a.y-b.y||a.x-b.x;
 return JSON.stringify([p.version,p.trialId,{...p.board,road:[...p.board.road].sort(order)},p.starts,[...p.parts].sort(order),p.handoffs,p.relays,p.emptyLockers]);
}
export function editCollectionChapters(chapters,index,action){
 if(!Array.isArray(chapters)||!Number.isInteger(index)||index<0||index>=chapters.length||!['earlier','later','remove'].includes(action))throw Error('Choose a collection chapter and edit.');const result=[...chapters];if(action==='remove')result.splice(index,1);else{const other=index+(action==='earlier'?-1:1);if(other<0||other>=result.length)return result;[result[index],result[other]]=[result[other],result[index]];}return result;
}
