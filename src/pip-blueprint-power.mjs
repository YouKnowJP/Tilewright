// New owned material. See LICENSE; prior MIT permissions remain effective.
import {DUO_CHANNELS,duoEditable,normalizeDuoProject} from './pip-duo.mjs';
import {normalizeDuoBlueprint} from './pip-duo-blueprints.mjs';
export const POWER_PARTS=Object.freeze(['plate','bridge','signal','latch','pulse','tide','scale','kiln','weave','drum','counter','rail']);
const ports=p=>p.kind==='drum'?[p.input,p.channel]:p.kind==='weave'?[p.first,p.second,p.channel]:POWER_PARTS.includes(p.kind)?[p.channel]:[];
export function blueprintPowerChannels(input){const piece=normalizeDuoBlueprint(input);return DUO_CHANNELS.filter(c=>piece.parts.some(p=>ports(p).includes(c))).map(channel=>({channel,parts:piece.parts.filter(p=>ports(p).includes(channel)).length}));}
export function rewireBlueprintPower(input,mapping={}){
 const piece=normalizeDuoBlueprint(input),used=blueprintPowerChannels(piece).map(p=>p.channel);
 if(!mapping||typeof mapping!=='object'||Array.isArray(mapping)||Object.entries(mapping).some(([a,b])=>!used.includes(a)||!DUO_CHANNELS.includes(b)))throw Error('Map only this piece’s power circuits to known numbered channels.');
 if(new Set(used.map(c=>mapping[c]??c)).size!==used.length)throw Error('Keep separate power circuits on different numbers. Swap both destinations together.');
 return normalizeDuoBlueprint({...piece,parts:piece.parts.map(p=>POWER_PARTS.includes(p.kind)?{...p,channel:mapping[p.channel]??p.channel,...(p.kind==='drum'?{input:mapping[p.input]??p.input}:{}),...(p.kind==='weave'?{first:mapping[p.first]??p.first,second:mapping[p.second]??p.second}:{})}:p)});
}
export function unusedBlueprintPower(input,piece){
 if(!duoEditable(input))throw Error('Remix a story before choosing unused power channels.');const project=normalizeDuoProject(input),used=blueprintPowerChannels(piece).map(p=>p.channel),free=DUO_CHANNELS.filter(c=>!project.parts.some(p=>ports(p).includes(c)||p.kind==='receiver'&&p.channel===c));
 if(used.length>free.length)throw Error('There are not enough unused power channels. Choose numbers manually to join a garden circuit.');
 const kept=used.filter(c=>free.includes(c)),remaining=free.filter(c=>!kept.includes(c));return Object.fromEntries(used.map(c=>[c,kept.includes(c)?c:remaining.shift()]));
}
