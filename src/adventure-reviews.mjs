import { createRun, resultFor, turnTarget } from './adventure.mjs';
import { resumeDefinition } from './adventure-resume.mjs';
import { replayAction, runFingerprint, MAX_TRAIL_ACTIONS } from './adventure-rewind.mjs';
import { serializeJourney, restoreJourney, journeyStartRun } from './adventure-journey.mjs';
export const REVIEWS_KEY='tilewright.route.reviews.v1',MAX_REVIEWS_BYTES=2000000;
const bytes=text=>new TextEncoder().encode(text).length;
const actions=/^(?:(?:dash-)?(?:up|right|down|left)|wait|decoy|shield|power|drop-cargo|close-dialogue|forget|(?:interact|choose):[a-z][a-z0-9-]{0,39})$/;
function entry(run,payload){
  if(!['won','lost'].includes(run.status)||run.stage.workshop?.practice)throw Error('Finish an adventure before reviewing its route.');
  return {key:`${run.stage.id}-${run.difficulty}-${run.guild?.kit||'wayfarer'}`,name:run.stage.name,difficulty:run.difficulty,status:run.status,turns:run.turns,fingerprint:runFingerprint(run),payload};
}
export function trailReview(trail){if(trail.actions.length>MAX_TRAIL_ACTIONS)throw Error('This route is too long to review.');return entry(trail.run,{kind:'trail',source:trail.source,memory:trail.memory,actions:[...trail.actions]});}
export function journeyReview(session){return entry(session.run,{kind:'expedition',checkpoint:serializeJourney(session)});}
function validEntry(item){return item&&typeof item.key==='string'&&item.key.length<180&&typeof item.name==='string'&&item.name.length<=64&&['trail','nemesis'].includes(item.difficulty)&&['won','lost'].includes(item.status)&&Number.isInteger(item.turns)&&item.turns>0&&item.turns<=1000000&&/^[a-f0-9]{1,8}$/.test(item.fingerprint)&&item.payload&&['trail','expedition'].includes(item.payload.kind);}
export function loadReviews(storage){try{const raw=storage.getItem(REVIEWS_KEY);if(!raw)return [];if(bytes(raw)>MAX_REVIEWS_BYTES)throw Error('Oversized route journal');const data=JSON.parse(raw);if(data.version!==1||!Array.isArray(data.items)||data.items.length>4||data.items.some(item=>!validEntry(item.last)||item.best&&!validEntry(item.best)||item.best&&item.best.key!==item.last.key))throw Error('Invalid route journal');return data.items;}catch{return [];}}
export function recordReview(items,review){
  if(!validEntry(review))throw Error('Choose a finished route.');
  const old=items.find(item=>item.last.key===review.key),best=review.status==='won'&&(!old?.best||review.turns<old.best.turns)?review:old?.best||null;
  const next=[...items.filter(item=>item.last.key!==review.key),{last:review,best}].slice(-4);
  while(next.length>1&&bytes(JSON.stringify({version:1,items:next}))>MAX_REVIEWS_BYTES)next.shift();
  return next;
}
export function saveReviews(storage,items){try{const raw=JSON.stringify({version:1,items});if(bytes(raw)>MAX_REVIEWS_BYTES)return false;storage.setItem(REVIEWS_KEY,raw);return true;}catch{return false;}}
export function reviewStart(review){
  if(!validEntry(review))throw Error('This recorded route could not be read.');
  if(review.payload.kind==='expedition'){const session=restoreJourney(review.payload.checkpoint);if(runFingerprint(session.run)!==review.fingerprint)throw Error('This expedition review does not match its route.');return {run:journeyStartRun(session),actions:session.journal};}
  const data=review.payload;
  if(!Array.isArray(data.actions)||data.actions.length>MAX_TRAIL_ACTIONS||data.actions.some(action=>typeof action!=='string'||!actions.test(action)))throw Error('This review has invalid recorded actions.');
  const {stage}=resumeDefinition(data.source,review.difficulty);return {run:createRun(stage,{memory:data.memory,difficulty:review.difficulty}),actions:data.actions};
}
export async function inspectReview(review,yieldFrame=()=>Promise.resolve()){
  const seed=reviewStart(review),moments=[];let run=seed.run;
  for(const [index,action] of seed.actions.entries()){
    if(run.status!=='playing')throw Error('This review continues past its ending.');const before=run;run=replayAction(run,action);
    const important=run.events.find(event=>event.type==='win')||run.events.find(event=>event.type==='hurt')||run.events.find(event=>['hurt','lantern','delivery','relay-complete','win','power','pulse','veil','echo','echo-return'].includes(event.type));
    if(moments.length<60&&(important||action.startsWith('choose:')))moments.push({index:index+1,turn:run.turns,label:action.startsWith('choose:')?'Keeper choice':important.type==='hurt'?'Damage taken':important.type==='win'?'Beacon restored':run.message});
    if(run===before)throw Error('This review contains an action that cannot be replayed.');
    if(index%32===31)await yieldFrame();
  }
  if(run.status!==review.status||run.turns!==review.turns||runFingerprint(run)!==review.fingerprint)throw Error('This recorded route no longer matches the current adventure.');
  const result=resultFor(run),firstHurt=moments.find(moment=>moment.label==='Damage taken');
  const tip=firstHurt?`At turn ${firstHurt.turn}, a hit interrupted this route. Try opening Plan before that turn, then test cover, a shield, or a different crossing.`:run.status==='lost'?'Watch the final marked enemy step. Try changing direction or offering a decoy before entering that cell.':run.turns>turnTarget(run)?`A clean route is already within reach. Compare your detours with the ${turnTarget(run)}-turn three-star target.`:run.collectedCoins.length<run.stage.coins.length?'The main route is complete. Try a treasure detour on your next visit; you can keep this route as a reference.':'A clean route worth remembering. Try another specialist, chapter promise, or rule set for a different solution.';
  return {seed,moments,run,result,tip};
}
export async function reviewFrame(seed,index,yieldFrame=()=>Promise.resolve()){
  if(!Number.isInteger(index)||index<0||index>seed.actions.length)throw Error('Choose a position inside the recorded route.');
  let run=seed.run;for(let i=0;i<index;i++){run=replayAction(run,seed.actions[i]);if(i%32===31)await yieldFrame();}return run;
}
