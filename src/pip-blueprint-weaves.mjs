// New owned material. See LICENSE; prior MIT permissions remain effective.
import {DUO_CHANNELS} from './pip-duo.mjs';
import {normalizeWeave} from './pip-weaves.mjs';
import {normalizeDuoBlueprint} from './pip-duo-blueprints.mjs';
export function blueprintWeaveStations(input){return normalizeDuoBlueprint(input).parts.flatMap((p,index)=>p.kind==='weave'?[{...p,index}]:[]);}
export function rewriteBlueprintWeave(input,index,patch={},{allRules=false}={}){
 const p=normalizeDuoBlueprint(input),station=p.parts[index];
 if(!Number.isInteger(index)||station?.kind!=='weave'||!patch||typeof patch!=='object'||Array.isArray(patch)||Object.keys(patch).some(k=>!['first','second','channel','rule'].includes(k))||typeof allRules!=='boolean')throw Error('Choose a relay and edit only its source numbers, output or rule.');
 const relay=normalizeWeave({...station,...patch});return normalizeDuoBlueprint({...p,parts:p.parts.map((s,i)=>i===index?{...s,...relay}:allRules&&s.kind==='weave'?{...s,rule:relay.rule}:s)});
}
export function cycleBlueprintWeave(input,index){const p=normalizeDuoBlueprint(input),s=p.parts[index];if(!Number.isInteger(index)||s?.kind!=='weave')throw Error('Choose a relay before cycling its power numbers.');const next=c=>DUO_CHANNELS[(DUO_CHANNELS.indexOf(c)+1)%4];return rewriteBlueprintWeave(p,index,{first:next(s.first),second:next(s.second),channel:next(s.channel)});}
