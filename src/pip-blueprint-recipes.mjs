// New owned material. See LICENSE; prior MIT permissions remain effective.
import {DUO_CHANNELS} from './pip-duo.mjs';
import {normalizeDuoBlueprint} from './pip-duo-blueprints.mjs';
const parcelKinds=['source','receiver','press','mixer','cargo','seal'];
export function blueprintParcelColours(input){const p=normalizeDuoBlueprint(input);return DUO_CHANNELS.filter(c=>p.parts.some(s=>parcelKinds.includes(s.kind)&&[s.channel,s.second,s.output].includes(c)||s.kind==='scale'&&s.match===c));}
export function recolourBlueprintParcels(input,palette){
 const p=normalizeDuoBlueprint(input);
 if(!palette||Object.keys(palette).length!==4||!DUO_CHANNELS.every(c=>Object.hasOwn(palette,c)&&DUO_CHANNELS.includes(palette[c]))||new Set(Object.values(palette)).size!==4)throw Error('Choose a one-to-one parcel palette. Every colour needs a different destination.');
 const colour=c=>Object.hasOwn(palette,c)?palette[c]:c;
 return normalizeDuoBlueprint({...p,parts:p.parts.map(s=>({...s,...(parcelKinds.includes(s.kind)?{channel:colour(s.channel)}:{}),...(s.kind==='press'||s.kind==='mixer'?{output:colour(s.output)}:{}),...(s.kind==='mixer'?{second:colour(s.second)}:{}),...(s.kind==='scale'?{match:colour(s.match)}:{})}))});
}
