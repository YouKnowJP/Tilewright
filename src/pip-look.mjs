// New owned material. See LICENSE; prior MIT permissions remain effective.
export const PIP_LOOK_KEY='tilewright.pip-look.v1';
export const PIP_PAINTS=Object.freeze({brass:{name:'Warm brass',body:'#e7c886'},tide:{name:'Tide blue',body:'#80bccc'},fern:{name:'Fern green',body:'#a2c98c'},plum:{name:'Plum enamel',body:'#b9a1d6'}});
export const PIP_ANTENNAE=Object.freeze({spark:'Spark',leaf:'Leaf',star:'Star'});
export const PIP_SCARVES=Object.freeze({none:'No scarf',cream:'Cream ribbon',coral:'Coral ribbon'});
export function normalizePipLook(value){return {paint:Object.hasOwn(PIP_PAINTS,value?.paint)?value.paint:'brass',antenna:Object.hasOwn(PIP_ANTENNAE,value?.antenna)?value.antenna:'spark',scarf:Object.hasOwn(PIP_SCARVES,value?.scarf)?value.scarf:'none'};}
export function loadPipLook(storage){try{const raw=storage.getItem(PIP_LOOK_KEY);if(!raw)return {look:normalizePipLook(),failed:false};if(raw.length>500)throw Error();const data=JSON.parse(raw);if(data.version!==1||!data.look||typeof data.look!=='object'||Array.isArray(data.look))throw Error();return {look:normalizePipLook(data.look),failed:false};}catch{return {look:normalizePipLook(),failed:true};}}
export function savePipLook(storage,look){try{storage.setItem(PIP_LOOK_KEY,JSON.stringify({version:1,look:normalizePipLook(look)}));return true;}catch{return false;}}
export function pipMood(run){const text=run?.clockwork?.last||'';return /Blocked|needs parcel|blocked|empty-handed/.test(text)?'puzzled':/Delivered|Pressed|Collected|Melody complete/.test(text)?'pleased':run?.clockwork?.running?'focused':'curious';}
