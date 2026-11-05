// New owned material. See LICENSE; prior MIT permissions remain effective.
import {duoEditable,remixDuoProject} from './pip-duo.mjs';
import {transformDuoGarden} from './pip-garden-tools.mjs';
import {normalizeTinkerProject,startTinker,tinkerStep,clearTinkerProject} from './pip-tinker.mjs';
import {normalizePipCollection,MAX_COLLECTION_CHAPTERS} from './pip-collections.mjs';
export const COLLECTION_REMIXES=Object.freeze([['horizontal','Mirror left / right'],['vertical','Mirror up / down'],['right','Turn clockwise'],['left','Turn counterclockwise'],['palette','Shift parcel colours'],['partners','Trade Pip & Sprout']].map(Object.freeze));
function chapterAt(collection,index){if(!Number.isInteger(index)||!collection.chapters[index])throw Error('Choose a collection chapter.');return collection.chapters[index];}
export function remixCollectionChapter(input,index,operation){
 const pack=normalizePipCollection(input),chapter=chapterAt(pack,index),old=chapter.project;
 let project=transformDuoGarden(duoEditable(old)?old:remixDuoProject(old),operation);
 project=normalizeTinkerProject({...project,author:old.author});
 // Courier order can change a traded route. Re-run the engine rather than reuse
 // its old proof. An unfinished transformed route remains an honest draft.
 if(old.proof){let state=startTinker(project);while(state.status==='playing')state=tinkerStep(state);if(state.status==='won')project=clearTinkerProject(state);}
 return normalizePipCollection({...pack,chapters:pack.chapters.map((c,i)=>i===index?{...c,project}:c)});
}
export function replaceCollectionChapter(input,index,raw){
 const pack=normalizePipCollection(input);chapterAt(pack,index);const project=normalizeTinkerProject(raw);if(project.version<2)throw Error('Choose a two-companion adventure.');
 return normalizePipCollection({...pack,chapters:pack.chapters.map((c,i)=>i===index?{...c,project}:c)});
}
export function copyCollectionChapter(input,source,index){
 const other=normalizePipCollection(source),chapter=chapterAt(other,index);if(Array.isArray(input?.chapters)&&!input.chapters.length)return normalizePipCollection({...input,chapters:[structuredClone(chapter)]});const pack=normalizePipCollection(input);if(pack.chapters.length>=MAX_COLLECTION_CHAPTERS)throw Error('Keep at most six collection chapters.');
 return normalizePipCollection({...pack,chapters:[...pack.chapters,structuredClone(chapter)]});
}
