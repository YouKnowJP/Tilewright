// New owned material. See LICENSE; prior MIT permissions remain effective.
import {normalizeDuoBlueprint} from './pip-duo-blueprints.mjs';
import {tideOpen} from './pip-tides.mjs';
import {weaveOutputs} from './pip-weaves.mjs';
import {advanceDrum,drumOutput} from './pip-drums.mjs';
export const TIMING_KINDS=Object.freeze(['tide','pulse','drum']);
export function blueprintTimingStations(input){return normalizeDuoBlueprint(input).parts.flatMap((p,index)=>TIMING_KINDS.includes(p.kind)?[{...p,index}]:[]);}
export function rewriteBlueprintTiming(input,index,patch={},{all=false}={}){
 const p=normalizeDuoBlueprint(input),part=p.parts[index],allowed={tide:['period','beats','offset'],pulse:['duration'],drum:['delay']}[part?.kind];
 if(!Number.isInteger(index)||!allowed||!patch||typeof patch!=='object'||Array.isArray(patch)||Object.keys(patch).some(k=>!allowed.includes(k))||typeof all!=='boolean'||Object.values(patch).some(v=>!Number.isInteger(v)))throw Error('Choose a clock, bell or drum and edit only its timing.');
 const timing=Object.fromEntries(allowed.map(k=>[k,Object.hasOwn(patch,k)?patch[k]:part[k]]));
 // Validate all edited stations together before returning a replacement.
 return normalizeDuoBlueprint({...p,parts:p.parts.map((s,i)=>i===index||all&&s.kind===part.kind?{...s,...timing}:s)});
}
export function shiftBlueprintClocks(input,{stagger=false}={}){const p=normalizeDuoBlueprint(input);if(typeof stagger!=='boolean'||!p.parts.some(p=>p.kind==='tide'))throw Error('Choose a piece with a tide clock.');let i=0;return normalizeDuoBlueprint({...p,parts:p.parts.map(s=>s.kind==='tide'?{...s,offset:(s.offset+(stagger?i++:1))%s.period}:s)});}
// A conditional preview, not a courier solution: clocks run; all other original
// sources are quiet. Drums begin empty and do not feed other drums or Weaves.
export function blueprintBeatForecast(input,count=16){const p=normalizeDuoBlueprint(input);if(!Number.isInteger(count)||count<1||count>24)throw Error('Preview one to twenty-four turns.');const memory={},frames=[];for(let turn=1;turn<=count;turn++){const raw=new Set(p.parts.filter(s=>s.kind==='tide'&&tideOpen(s,turn)).map(s=>s.channel)),sources=new Set([...raw,...weaveOutputs(p.parts,raw)]),drums={};p.parts.forEach((s,i)=>{if(s.kind==='drum'){drums[i]={input:sources.has(s.input),output:drumOutput(s,memory[i])};}});frames.push({turn,sources:[...sources],drums});p.parts.forEach((s,i)=>{if(s.kind==='drum')memory[i]=advanceDrum(s,memory[i],sources);});}return frames;}
