import { createRun, stepRun } from './adventure.mjs';
import { freshMemory, normalizeMemory } from './adventure-brain.mjs';
import { hashSeed } from './adventure-generator.mjs';
import { resumeDefinition } from './adventure-resume.mjs';
import { serializeJourney, restoreJourney } from './adventure-journey.mjs';

export const TRAIL_SAVE_KEY='tilewright.trail.checkpoint.v1',REWIND_LIMIT=60,MAX_TRAIL_ACTIONS=8192,MAX_TRAIL_BYTES=650000;
const RULES='0.22.0',actionPattern=/^(?:(?:dash-)?(?:up|right|down|left)|wait|decoy|shield|power|drop-cargo|close-dialogue|forget|(?:interact|choose):[a-z][a-z0-9-]{0,39})$/;
export const replayAction=(run,action)=>action==='forget'?{...run,memory:freshMemory(),events:[],message:'The learned movement habits were cleared.'}:stepRun(run,action);
export function runFingerprint(run){const {stage,walkable,events,message,...state}=run;return hashSeed(JSON.stringify(state)).toString(16);}
export function beginRewind(run,input){
  const {source,stage}=resumeDefinition(input,run.difficulty);
  if(run.turns!==0||run.status!=='playing'||stage.id!==run.stage.id)throw Error('Begin a checkpoint at the start of an adventure.');
  return {source,memory:normalizeMemory(run.memory),difficulty:run.difficulty,actions:[],past:[],run};
}
export function advanceRewind(trail,action){
  const before=trail.run,next=replayAction(before,action);
  const changed=next.turns!==before.turns||next.facing!==before.facing||next.dialogue!==before.dialogue||next.choices!==before.choices||next.rescued.length!==before.rescued.length||next.talkedTo.length!==before.talkedTo.length||action==='forget';
  if(!changed)return {...trail,run:next};
  return {...trail,run:next,actions:[...trail.actions,action],past:[...trail.past,{run:before,length:trail.actions.length,action}].slice(-REWIND_LIMIT)};
}
export const canRewind=trail=>Boolean(trail&&trail.run.status!=='won'&&trail.past.length);
export function undoRewind(trail){
  if(!canRewind(trail))return trail;
  const past=[...trail.past];let frame=past.pop();while(frame.action==='close-dialogue'&&past.length)frame=past.pop();
  return {...trail,run:frame.run,actions:trail.actions.slice(0,frame.length),past};
}
const header=run=>({name:run.stage.name,status:run.status,turns:run.turns,difficulty:run.difficulty});
function encode(data){const text=JSON.stringify(data);if(new TextEncoder().encode(text).length>MAX_TRAIL_BYTES)throw Error('This adventure is too large to autosave. Keep this tab open.');return text;}
export function serializeTrail(trail){
  if(trail.run.status==='won')throw Error('A completed adventure cannot be rewound or resumed for another reward.');
  if(trail.actions.length>MAX_TRAIL_ACTIONS)throw Error('This attempt exceeds the 8,192-action checkpoint limit. Keep this tab open.');
  return encode({version:1,rules:RULES,kind:'trail',source:trail.source,memory:trail.memory,actions:trail.actions,header:header(trail.run),fingerprint:runFingerprint(trail.run)});
}
export function serializeExpeditionTrail(session){return encode({version:1,rules:RULES,kind:'expedition',checkpoint:serializeJourney(session),header:header(session.run)});}
export function readTrail(text){
  if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_TRAIL_BYTES)throw Error('This adventure checkpoint is too large.');
  let data;try{data=JSON.parse(text);}catch{throw Error('This adventure checkpoint could not be read.');}
  if(data?.version!==1||data.rules!==RULES||!['trail','expedition'].includes(data.kind)||!data.header||typeof data.header.name!=='string'||data.header.name.length<1||data.header.name.length>64||!['playing','lost','won'].includes(data.header.status)||!Number.isInteger(data.header.turns)||data.header.turns<0||data.header.turns>1000000||!['trail','nemesis'].includes(data.header.difficulty))throw Error('This adventure checkpoint uses unsupported or damaged rules.');
  if(data.kind==='trail'&&(!data.source||data.header.status==='won'||!Array.isArray(data.actions)||data.actions.length>MAX_TRAIL_ACTIONS||data.actions.some(action=>typeof action!=='string'||!actionPattern.test(action))||typeof data.fingerprint!=='string'||!/^[0-9a-f]{1,8}$/.test(data.fingerprint)))throw Error('This adventure checkpoint has invalid actions.');
  if(data.kind==='expedition'&&(typeof data.checkpoint!=='string'||data.checkpoint.length>220000))throw Error('This expedition checkpoint is invalid.');
  return data;
}
export async function restoreTrail(data,yieldFrame=()=>Promise.resolve()){
  if(data.kind==='expedition'){const session=restoreJourney(data.checkpoint);if(JSON.stringify(header(session.run))!==JSON.stringify(data.header))throw Error('This expedition does not match its saved heading.');return {session};}
  const {source,stage}=resumeDefinition(data.source,data.header.difficulty);let trail=beginRewind(createRun(stage,{memory:normalizeMemory(data.memory),difficulty:data.header.difficulty}),source);
  for(let i=0;i<data.actions.length;i++){if(trail.run.status!=='playing')throw Error('This checkpoint continues beyond its ending.');trail=advanceRewind(trail,data.actions[i]);if(i%32===31)await yieldFrame();}
  if(runFingerprint(trail.run)!==data.fingerprint||JSON.stringify(header(trail.run))!==JSON.stringify(data.header))throw Error('The saved adventure no longer matches its recorded route.');
  return {trail};
}
export function loadTrail(storage){let text;try{text=storage.getItem(TRAIL_SAVE_KEY);}catch(error){return {data:null,error:error.message,unavailable:true};}try{return {data:text?readTrail(text):null,error:null};}catch(error){return {data:null,error:error.message};}}
export function storeTrail(storage,text){try{storage.setItem(TRAIL_SAVE_KEY,text);return storage.getItem(TRAIL_SAVE_KEY)===text;}catch{return false;}}
export function clearTrail(storage){try{storage.removeItem(TRAIL_SAVE_KEY);return storage.getItem(TRAIL_SAVE_KEY)==null;}catch{return false;}}
