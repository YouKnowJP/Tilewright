// New owned material. See LICENSE; prior MIT permissions remain effective.
import {normalizeDuoBlueprint} from './pip-duo-blueprints.mjs';
import {counterArrival,normalizeCounter} from './pip-counters.mjs';
const fields=['courier','threshold','phase','duration'];
export function blueprintCounterStations(input){return normalizeDuoBlueprint(input).parts.flatMap((p,index)=>p.kind==='counter'?[{...p,index}]:[]);}
export function tuneBlueprintCounter(input,index,patch,{all=false}={}){
 const p=normalizeDuoBlueprint(input),s=p.parts[index];if(!Number.isInteger(index)||s?.kind!=='counter'||!patch||typeof patch!=='object'||Array.isArray(patch)||Object.keys(patch).some(k=>!fields.includes(k))||typeof all!=='boolean')throw Error('Choose a Footfall Counter and change only its badge, marks or timing.');
 if(Object.values(patch).some(v=>v===undefined))throw Error('Every edited counter field needs a value.');
 const checked=normalizeCounter({...s,...patch}),settings=Object.fromEntries(fields.map(k=>[k,checked[k]]));return normalizeDuoBlueprint({...p,parts:p.parts.map((s,i)=>i===index||all&&s.kind==='counter'?{...s,...settings}:s)});
}
export function spaceBlueprintCounters(input,{clear=false}={}){
 const p=normalizeDuoBlueprint(input);if(typeof clear!=='boolean'||!p.parts.some(p=>p.kind==='counter'))throw Error('Choose a piece with a Footfall Counter.');let index=0;return normalizeDuoBlueprint({...p,parts:p.parts.map(s=>s.kind==='counter'?{...s,phase:clear?0:index++%s.threshold}:s)});
}
// A sample of one counter, with one qualifying arrival every `spacing` turns.
// The first arrival is on turn 1, and power is sampled before any arrival.
export function counterBeatPreview(input,{spacing=1,turns=12}={}){
 const p=normalizeCounter(input);if(!Number.isInteger(spacing)||spacing<1||spacing>3||!Number.isInteger(turns)||turns<1||turns>24)throw Error('Preview up to 24 turns, with arrivals spaced one to three turns apart.');
 const frames=[];let record=[p.phase,0];for(let turn=1;turn<=turns;turn++){
  const powered=record[1]>0,arrival=(turn-1)%spacing===0;let ring=false;record=[record[0],Math.max(0,record[1]-1)];
  if(arrival){const hit=counterArrival(p,record,p.courier==='either'?'pip':p.courier);record=hit.record;ring=hit.triggered;}
  frames.push({turn,powered,arrival,ring,marks:record[0]});
 }return frames;
}
