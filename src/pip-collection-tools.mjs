// New owned material. See LICENSE; prior MIT permissions remain effective.
import {normalizeChapterChallenge} from './pip-collection-challenges.mjs';
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
 return normalizePipCollection({...pack,chapters:pack.chapters.map((c,i)=>i===index?{...c,project,...(pack.version===2?{challenge:{ticks:null,parts:null}}:{})}:c)});
}
export function replaceCollectionChapter(input,index,raw){
 const pack=normalizePipCollection(input);chapterAt(pack,index);const project=normalizeTinkerProject(raw);if(project.version<2)throw Error('Choose a two-companion adventure.');
 return normalizePipCollection({...pack,chapters:pack.chapters.map((c,i)=>i===index?{...c,project,...(pack.version===2?{challenge:{ticks:null,parts:null}}:{})}:c)});
}
export function copyCollectionChapter(input,source,index){
 const other=normalizePipCollection(source),chapter=chapterAt(other,index);if(Array.isArray(input?.chapters)&&!input.chapters.length)return normalizePipCollection({...input,version:Math.max(input.version||1,other.version),chapters:[structuredClone(chapter)]});const pack=normalizePipCollection(input);if(pack.chapters.length>=MAX_COLLECTION_CHAPTERS)throw Error('Keep at most six collection chapters.');
 return normalizePipCollection({...pack,version:Math.max(pack.version,other.version),chapters:[...pack.chapters,structuredClone(chapter)]});
}
export const COLLECTION_VARIANTS=Object.freeze([
 Object.freeze({id:'mirrors',name:'A pair of looking glasses',labels:['Left-right mirror','Up-down mirror'],operations:[['horizontal'],['vertical']]}),
 Object.freeze({id:'palettes',name:'Three colour roads',labels:['Palette 1','Palette 2','Palette 3'],operations:[['palette'],['palette','palette'],['palette','palette','palette']]}),
 Object.freeze({id:'partners',name:'A courier role study',labels:['Couriers traded'],operations:[['partners']]})
]);
const clipped=(value,max)=>{let s=value.slice(0,max);const last=s.charCodeAt(s.length-1);if(last>=0xd800&&last<=0xdbff)s=s.slice(0,-1);return s;};
export function appendCollectionVariants(input,index,preset){
 const pack=normalizePipCollection(input),source=chapterAt(pack,index),spec=COLLECTION_VARIANTS.find(v=>v.id===preset);if(!spec)throw Error('Choose a collection variant set.');
 if(pack.chapters.length+spec.operations.length>MAX_COLLECTION_CHAPTERS)throw Error(`This variant set needs ${spec.operations.length} free chapter slots.`);
 const chapters=spec.operations.map((operations,i)=>{let one={...pack,chapters:[structuredClone(source)]};for(const op of operations)one=remixCollectionChapter(one,0,op);const suffix=' · '+spec.labels[i],title=clipped(source.title,48-suffix.length)+suffix,note=clipped(source.note,180-suffix.length)+suffix,base=one.chapters[0].project,goals=[base.handoffs?`make ${base.handoffs} handoffs`:'',base.relays?`complete ${base.relays} locker relays`:'',base.emptyLockers?'empty every locker':'',base.quietSwitches?'switch every lantern off':'',base.quietBells?'let every timed bell fall silent':'',base.quietDrums?'let every drum memory fall quiet':'',base.parts.some(p=>p.kind.endsWith('-dock'))?'return to each marked home flag':''].filter(Boolean),intro=`Pip: “A different road, the same promise.” ${spec.labels[i]}. Follow this garden’s numbered stations; its colours and directions may differ from the original. Fill every window.${goals.length?' Finish rules: '+goals.join('; ')+'.':''}`,project=normalizeTinkerProject({...base,name:title,intro,ending:'Pip and Sprout close this chapter together. Another road in the collection is ready when you are.'});return {title,note,project};});
 return normalizePipCollection({...pack,chapters:[...pack.chapters,...chapters]});
}
export function singleChapterCollection(input,index){const pack=normalizePipCollection(input),chapter=chapterAt(pack,index);return normalizePipCollection({...pack,name:chapter.title,intro:chapter.note,chapters:[structuredClone(chapter)]});}
export function selectCollectionChapters(input,indices){
 const pack=normalizePipCollection(input);if(!Array.isArray(indices)||!indices.length||indices.length>MAX_COLLECTION_CHAPTERS||new Set(indices).size!==indices.length||indices.some(i=>!Number.isInteger(i)||!pack.chapters[i]))throw Error('Choose one to six different source chapters.');
 return normalizePipCollection({...pack,name:clipped(pack.name,36)+' · selection',intro:`Selected chapters from “${pack.name}”. Choose a road and make it your own.`,chapters:indices.map(i=>structuredClone(pack.chapters[i]))});
}
export function appendCollectionSelection(input,source,indices){
 const selected=selectCollectionChapters(source,indices);if(!Array.isArray(input?.chapters)||input.chapters.length+selected.chapters.length>MAX_COLLECTION_CHAPTERS)throw Error('The selected chapters do not fit. Keep at most six assembly chapters.');
 return normalizePipCollection({...input,version:Math.max(input.version||1,selected.version),chapters:[...input.chapters,...selected.chapters]});
}

export function setCollectionChallenge(input,index,raw){const pack=normalizePipCollection(input);chapterAt(pack,index);const challenge=normalizeChapterChallenge(raw);return normalizePipCollection({...pack,version:2,chapters:pack.chapters.map((c,i)=>i===index?{...c,challenge}:c)});}
export function setCollectionCreatorPar(input,index){const pack=normalizePipCollection(input),chapter=chapterAt(pack,index);if(!chapter.project.proof)throw Error('Verify a creator route before setting its par.');return setCollectionChallenge(pack,index,{ticks:chapter.project.proof.ticks,parts:chapter.project.parts.length});}
