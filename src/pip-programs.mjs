// New owned material. See LICENSE; prior MIT material retains its permissions.
import {normalizeProgram} from './clockwork.mjs';
export const PIP_PROGRAMS_KEY='tilewright.pip.programs.v1',PROGRAM_SLOTS=8,MAX_PROGRAM_BYTES=16000;
export const emptyPrograms=()=>Array(PROGRAM_SLOTS).fill(null);
export function normalizePrograms(slots){
 if(!Array.isArray(slots)||slots.length!==PROGRAM_SLOTS)throw Error('A program satchel needs eight slots.');
 return Array.from(slots,item=>{if(item===null)return null;if(!item||typeof item.name!=='string'||!item.name.trim()||item.name.length>32||/[\u0000-\u001f\u007f]/.test(item.name))throw Error('Name each saved program with 1–32 readable characters.');return {name:item.name.trim(),cards:normalizeProgram(item.cards)};});
}
export function setProgramSlot(slots,index,value){if(!Number.isInteger(index)||index<0||index>=PROGRAM_SLOTS)throw Error('Choose a program slot from 1 to 8.');return normalizePrograms(slots.map((item,i)=>i===index?value:item));}
export function serializePrograms(slots){return JSON.stringify({format:'tilewright-pip-programs',version:1,slots:normalizePrograms(slots)},null,2)+'\n';}
export function parsePrograms(text){if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_PROGRAM_BYTES)throw Error('Choose a Pip program satchel smaller than 16 KB.');let data;try{data=JSON.parse(text);}catch{throw Error('The program satchel is not valid JSON.');}if(data?.format!=='tilewright-pip-programs'||data.version!==1)throw Error('Choose a version-1 Pip program satchel.');return normalizePrograms(data.slots);}
export function loadPrograms(storage){try{const raw=storage.getItem(PIP_PROGRAMS_KEY);return {slots:raw?parsePrograms(raw):emptyPrograms(),failed:false};}catch{return {slots:emptyPrograms(),failed:true};}}
export function savePrograms(storage,slots){try{const raw=serializePrograms(slots);storage.setItem(PIP_PROGRAMS_KEY,raw);return storage.getItem(PIP_PROGRAMS_KEY)===raw;}catch{return false;}}
