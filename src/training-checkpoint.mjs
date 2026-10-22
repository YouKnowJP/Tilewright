import { normalizeAdventure, adventureKey, adventureStage, checkAdventure } from './workshop-model.mjs';
import { practiceWorld } from './training-model.mjs';
import { createRun } from './adventure.mjs';
import { beginRewind, advanceRewind, runFingerprint } from './adventure-rewind.mjs';
export const PRACTICE_KEYS=Object.freeze({play:'tilewright.training.play.v1',create:'tilewright.training.create.v1'}),MAX_PRACTICE_BYTES=300000;
function draft(input,kind){
  const pack=normalizeAdventure(input);
  if(pack.map.width!==10||pack.map.height!==8||!pack.markers.some(item=>item.kind==='start')||!pack.markers.some(item=>item.kind==='beacon')||kind==='play'&&adventureKey(pack)!==adventureKey(practiceWorld('play')))throw Error('This practice table does not match its lesson.');
  return pack;
}
export function serializePractice(state){
  const data={version:1,kind:state.kind,pack:state.pack,mode:state.mode,brush:state.brush,cursor:state.cursor,history:state.history,index:state.index,checked:state.checked,won:state.won,shared:state.shared,actions:state.actions,fingerprint:state.run?runFingerprint(state.run):null,form:state.uiForm||null};
  const text=JSON.stringify(data);if(new TextEncoder().encode(text).length>MAX_PRACTICE_BYTES)throw Error('This practice backup is too large. Download your world before leaving.');return text;
}
export async function restorePractice(text,kind,yieldFrame=()=>Promise.resolve()){
  if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_PRACTICE_BYTES)throw Error('This practice backup is too large.');
  let data;try{data=JSON.parse(text);}catch{throw Error('This practice backup could not be read.');}
  if(data?.version!==1||data.kind!==kind||!PRACTICE_KEYS[kind]||!['play','build'].includes(data.mode)||kind==='play'&&data.mode!=='play'||!['bridge','lantern','guide'].includes(data.brush)||!data.cursor||!Number.isInteger(data.cursor.x)||!Number.isInteger(data.cursor.y)||data.cursor.x<0||data.cursor.x>9||data.cursor.y<0||data.cursor.y>7||!Array.isArray(data.history)||!data.history.length||data.history.length>30||!Number.isInteger(data.index)||data.index<0||data.index>=data.history.length||['checked','won','shared'].some(key=>typeof data[key]!=='boolean')||!Array.isArray(data.actions)||data.actions.length>2000)throw Error('This practice backup has invalid lesson progress.');
  const pack=draft(data.pack,kind),history=data.history.map(item=>draft(item,kind));
  if(adventureKey(pack)!==adventureKey(history[data.index]))throw Error('The practice history does not match its current world.');
  if(data.form&&(['title','opening','dialogue'].some(key=>typeof data.form[key]!=='string')||data.form.title.length>64||data.form.opening.length>800||data.form.dialogue.length>600))throw Error('The unfinished practice story is invalid.');
  if(data.checked&&!checkAdventure(pack).ready)throw Error('This practice world no longer passes its checks.');
  let rewind=null,run=null;
  if(data.fingerprint!==null){
    if(typeof data.fingerprint!=='string'||!/^[a-f0-9]{1,8}$/.test(data.fingerprint))throw Error('The practice route is invalid.');
    if(data.actions.length)normalizeAdventure({...pack,proof:{difficulty:'trail',actions:data.actions}});
    rewind=beginRewind(createRun(adventureStage(pack)),{kind:'world',world:pack,origin:kind==='create'?'build':'shelf'});
    for(let i=0;i<data.actions.length;i++){if(rewind.run.status!=='playing')throw Error('This practice route continues after its ending.');rewind=advanceRewind(rewind,data.actions[i]);if(i%32===31)await yieldFrame();}
    run=rewind.run;if(runFingerprint(run)!==data.fingerprint||kind==='create'&&data.won!==(run.status==='won'))throw Error('This practice route could not be verified.');
  }else if(data.actions.length||data.mode==='play'||data.won||data.shared)throw Error('This practice backup has no playable route.');
  return {kind,pack,mode:data.mode,brush:data.brush,cursor:{...data.cursor},history,index:data.index,checked:data.checked,won:data.won,shared:data.shared,actions:[...data.actions],run,rewind,uiForm:data.form,storyDirty:Boolean(data.form),plan:false};
}
export function readPractice(storage,kind){try{return storage.getItem(PRACTICE_KEYS[kind]);}catch{return null;}}
export function savePractice(storage,state){try{const text=serializePractice(state);storage.setItem(PRACTICE_KEYS[state.kind],text);return storage.getItem(PRACTICE_KEYS[state.kind])===text;}catch{return false;}}
