// New owned material. See LICENSE; prior MIT permissions remain effective.
import {readyRendezvous} from './pip-rendezvous.mjs';
import {RAIL_DIRECTIONS} from './pip-rails.mjs';
import {counterArrival} from './pip-counters.mjs';
import {restRemaining} from './pip-rests.mjs';
import {advanceDrum,drumOutput} from './pip-drums.mjs';
import {weaveOutputs} from './pip-weaves.mjs';
import {fireKiln} from './pip-kilns.mjs';
import {useMixer} from './pip-mixers.mjs';
import {echoProgram,ECHO_OPERATIONS} from './pip-echoes.mjs';
import {scalePower} from './pip-scales.mjs';
import {tideOpen,tidePhase} from './pip-tides.mjs';
import {DUO_STORIES,DUO_CUSTOM,duoMission,duoDefinition,normalizeDuoProject,newDuoProject,duoReadiness,duoRequiredVersion,sealAllows,sealDescription} from './pip-duo.mjs';
import {normalizeProgram,transformProgram,PRISM_OPERATIONS,CLOCKWORK_LABELS} from './clockwork.mjs';
import {duoHintStages} from './pip-staged-hints.mjs';
import {blankAdventure,editAdventure} from './workshop-model.mjs';
const at=(a,b)=>a.x===b.x&&a.y===b.y;
const point=(x,y)=>({x,y}),row=(y,a=1,b=7)=>Array.from({length:b-a+1},(_,i)=>point(a+i,y));
const part=(kind,x,y,extra={})=>({kind,x,y,...extra});
const ordinary=[['right','right','use']],floor=Array.from({length:5},(_,i)=>row(i+1)).flat();
const source=()=>part('source',3,3,{channel:'amber'}),receiver=(x,y,channel='amber')=>part('receiver',x,y,{channel});
const specs=[
 ['first-use','A parcel for Tavi','learn','Use works where Pip is standing. Change the third card to Use, then follow a parcel from the well to the window.',row(3),[source(),receiver(5,3)],0,{},[['right','right','wait']]],
 ['corner-turn','A corner of sky','learn','The path turns north. A compass prism changes every direction in the three cards. Place a left-turn prism at the bend.',[...row(3,1,5),point(5,2),point(5,1)],[source(),receiver(5,1)],1,{prism:1}],
 ['paint-parcel','The jade invitation','learn','Tavi needs jade, but the well supplies amber. A recipe press changes the parcel when Pip uses it.',row(3),[source(),receiver(7,3,'jade')],1,{press:1}],
 ['remember-road','A sign that remembers','learn','One sign can remember two roads. Route A goes north to collect jade; Route B goes east to deliver it.',[...row(3,1,4),point(3,2),point(3,1)],[part('source',3,2,{channel:'jade'}),part('prism',3,1,{operation:'mirror-y'}),receiver(4,3,'jade')],1,{flip:1}],
 ['corner-post','Post above the clouds','trial','Find two different ways to reach the northern window. A short route and a small invention are both worth keeping.',floor,[source(),receiver(7,1)],2,{prism:2,tube:2}],
 ['jade-express','The jade express','trial','Make jade and deliver it across the garden. Three parts. Many possible roads.',floor,[source(),receiver(7,1,'jade')],3,{press:1,tube:2,prism:2}],
 ['repair-relay','Rook’s wrong turn','trial','Rook left a mirror facing the wrong road. Replace the broken idea, then invent a better return.',floor,[source(),receiver(7,1)],2,{prism:2,tube:2}],
 ['quiet-garden','The quiet garden','trial','A window waits to the south. Can you solve the whole route with a single part?',floor,[source(),receiver(5,5)],2,{prism:1,tube:2}],
 ['parcel-partners','Pip meets Sprout','relay','Pip acts first, then Sprout, on every tick. Use the handoff beside Sprout to pass one parcel. Sprout must Use its window to deliver.',[...row(3),point(7,2)],[source(),part('press',5,3,{channel:'amber',output:'jade'}),part('handoff',7,3),receiver(7,2,'jade')],0,{},[['right','right','wait'],['wait','wait','wait']]],
 ['bridge-duet','Two hands, one bridge','relay','Pip holds the northern plate while Sprout carries a parcel below. A blocked move advances the card too. An occupied bridge stays safe until its traveler leaves.',[...row(3,1,3),...row(5,1,5)],[part('plate',2,3),part('bridge',4,5),part('source',3,5,{channel:'amber'}),receiver(5,5)],0,{},[['wait','wait','wait'],['right','wait','right']]]
];
export const TINKER_TRIALS=Object.freeze(specs.map(([id,title,collection,story,road,fixed,budget,inventory,programs=ordinary])=>Object.freeze({id,title,collection,story,road,fixed,budget,inventory,programs,starts:collection==='relay'?[point(1,3),id==='bridge-duet'?point(1,5):point(7,2)]:[point(1,3)],difficulty:collection==='learn'?'Gentle':collection==='relay'?'Expert':id==='jade-express'?'Hard':'Tricky',minutes:collection==='learn'?'2–5 min':'5–15 min'})));
export const TINKER_KEY='tilewright.pip-studio.v1',TINKER_LIMIT=240;
const fail=message=>{throw Error(message);};
export function tinkerTrial(id){return TINKER_TRIALS.find(t=>t.id===id)||fail('Choose a known Pip workshop challenge.');}
function text(value,fallback,max=48){if(value===undefined)return fallback;if(typeof value!=='string'||value.length>max||/[\u0000-\u001f\u007f]/.test(value))fail('Use a short, printable name.');return value.trim()||fallback;}
export function newTinkerProject(id='first-use'){if(id===DUO_CUSTOM.id||duoMission(id))return newDuoProject(id);const trial=tinkerTrial(id);return {format:'pip-tinker-project',version:1,trialId:id,name:trial.title,author:'A trail keeper',programs:trial.programs.map(p=>[...p]),parts:id==='repair-relay'?[part('prism',5,3,{operation:'mirror'})]:[]};}
export function normalizeTinkerProject(input,{verify=true}={}){
 if(input?.format==='pip-tinker-project'&&[2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18].includes(input.version)){const project=normalizeDuoProject(input);if(project.proof&&verify){const check=duoReadiness(project);if(!check.ready)throw Error(check.errors[0]);if(!verifyTinkerProof(project))throw Error('The attached duo solution does not finish this adventure.');}return project;}
 if(!input||input.format!=='pip-tinker-project'||input.version!==1)fail('Choose a Pip workshop project, version 1 through 18.');
 const trial=tinkerTrial(input.trialId);
 if(!Array.isArray(input.programs)||input.programs.length!==trial.starts.length)fail('Each companion needs one three-card program.');
 const project={format:'pip-tinker-project',version:1,trialId:trial.id,name:text(input.name,trial.title),author:text(input.author,'A trail keeper'),programs:input.programs.map(normalizeProgram),parts:[]};
 if(!Array.isArray(input.parts)||input.parts.length>trial.budget)fail('This invention exceeds the challenge’s parts budget.');
 const counts={};
 for(const raw of input.parts){
  if(!raw||!Number.isInteger(raw.x)||!Number.isInteger(raw.y)||!trial.road.some(p=>at(p,raw))||trial.fixed.some(p=>at(p,raw))||trial.starts.some(p=>at(p,raw))||project.parts.some(p=>at(p,raw)))fail('Place each part on a free garden tile.');
  if(!Object.hasOwn(trial.inventory,raw.kind)||(counts[raw.kind]=(counts[raw.kind]||0)+1)>trial.inventory[raw.kind])fail('There are no more of that part in this challenge.');
  const p=part(raw.kind,raw.x,raw.y);
  if(raw.kind==='prism'){if(!Object.hasOwn(PRISM_OPERATIONS,raw.operation))fail('Choose a known prism operation.');p.operation=raw.operation;}
  if(raw.kind==='press'){if(!['amber','jade','blue','violet'].includes(raw.channel)||!['amber','jade','blue','violet'].includes(raw.output)||raw.channel===raw.output)fail('A recipe needs two different parcel colours.');p.channel=raw.channel;p.output=raw.output;}
  if(raw.kind==='flip'){p.program=normalizeProgram(raw.program);p.alternate=normalizeProgram(raw.alternate);if(raw.initial!==undefined&&typeof raw.initial!=='boolean')fail('Choose Route A or B as the first route.');p.initial=raw.initial===true;}
  project.parts.push(p);
 }
 if(input.proof!==undefined){if(project.parts.filter(p=>p.kind==='tube').length===1)fail('A working solution needs both tube ends.');if(!Number.isInteger(input.proof?.ticks)||input.proof.ticks<1||input.proof.ticks>TINKER_LIMIT)fail('The solution exceeds the workshop’s tick limit.');project.proof={ticks:input.proof.ticks};if(verify&&!verifyTinkerProof(project))fail('The attached solution does not finish this invention.');}
 return project;
}
export function editTinkerProject(input,patch){const {proof,...base}=input;const next={...base,...patch};if(next.trialId==='duo-creator')next.version=Math.max(next.version,duoRequiredVersion(next.parts||[]),patch.quietDrums!==undefined?13:patch.quietBells!==undefined?5:patch.quietSwitches!==undefined?4:patch.relays!==undefined||patch.emptyLockers!==undefined?3:2);return normalizeTinkerProject(next);}
export function placeTinkerPart(input,kind,x,y,extra={}){return editTinkerProject(input,{parts:[...input.parts.filter(p=>p.x!==x||p.y!==y),...(kind==='erase'?[]:[part(kind,x,y,extra)])]});}
export function tinkerDefinition(project){return project.version>=2?duoDefinition(project):tinkerTrial(project.trialId);}
export function tinkerCatalogue(){return [...TINKER_TRIALS,...DUO_STORIES,DUO_CUSTOM];}
export function startTinker(input){const project=normalizeTinkerProject(input,{verify:false}),trial=tinkerDefinition(project);return {project,bots:trial.starts.map((p,i)=>({...p,id:i?'Sprout':'Pip',program:[...project.programs[i]],index:0,parcel:null,last:'Ready',...(project.version>=14?{resting:0}:{}),...(project.version>=17?{rolling:false}:{}),...(project.version>=18?{syncing:false}:{})})),received:{},flips:{},ticks:0,transfers:0,status:'playing',last:'Ready to test. No keeper turns or rewrites are spent here.',events:[],...(project.version>=3?{lockers:{},lockerTransfers:0}:{}),...(project.version>=4?{switches:{}}:{}),...(project.version>=5?{pulses:{}}:{}),...(project.version>=10?{mixers:{}}:{}),...(project.version>=13?{drums:{}}:{}),...(project.version>=16?{counters:Object.fromEntries(tinkerParts(project).filter(p=>p.kind==='counter').map(p=>[p.id,[p.phase,0]]))}:{})};}
export function tinkerParts(project){return [...tinkerDefinition(project).fixed,...project.parts].map((p,i)=>({...p,id:String(i)}));}
function counterChannels(state,parts){return state.counters?parts.filter(p=>p.kind==='counter'&&state.counters[p.id][1]>0).map(p=>p.channel):[];}
function physicalPowerChannels(state,parts,turn){return new Set([...scalePower(parts,state.bots),...parts.filter(p=>p.kind==='tide'&&tideOpen(p,turn)).map(p=>p.channel),...Object.keys(state.switches||{}),...Object.keys(state.pulses||{}),...counterChannels(state,parts),...parts.filter(p=>['plate','bridge'].includes(p.kind)&&state.bots.some(b=>at(b,p))).map(p=>p.channel)]);}
function completedWindowPower(state,parts,power){for(const channel of ['amber','jade','violet','blue']){const windows=parts.filter(p=>p.kind==='receiver'&&p.channel===channel);if(windows.length&&windows.every(p=>(state.received[p.id]||0)>=(p.parcels||1)))power.add(channel);}return power;}
export function weavePowerChannels(state,parts=tinkerParts(state.project),turn=state.ticks+1){if(!parts.some(p=>p.kind==='weave'))return new Set();return weaveOutputs(parts,completedWindowPower(state,parts,physicalPowerChannels(state,parts,turn)));}
export function drumPowerChannels(state,parts=tinkerParts(state.project)){return new Set(parts.filter(p=>p.kind==='drum'&&drumOutput(p,state.drums?.[p.id])).map(p=>p.channel));}
export function drumSourceChannels(state,parts=tinkerParts(state.project),turn=state.ticks+1){const power=completedWindowPower(state,parts,physicalPowerChannels(state,parts,turn));for(const c of weavePowerChannels(state,parts,turn))power.add(c);return power;}
export function tinkerPoweredChannels(state,parts=tinkerParts(state.project),turn=state.ticks+1){const power=physicalPowerChannels(state,parts,turn);if(parts.some(p=>p.kind==='weave'))for(const c of weavePowerChannels(state,parts,turn))power.add(c);for(const c of drumPowerChannels(state,parts))power.add(c);return power;}
export function kilnPowerChannels(state,parts=tinkerParts(state.project),turn=state.ticks+1){return completedWindowPower(state,parts,tinkerPoweredChannels(state,parts,turn));}
export function tinkerStateKey(state){return JSON.stringify([state.bots,state.received,state.flips,state.transfers,...(state.lockers?[state.lockers,state.lockerTransfers]:[]),...(state.switches?[state.switches]:[]),...(state.pulses?[state.pulses]:[]),...(state.project.version>=7?[tinkerParts(state.project).filter(p=>p.kind==='tide').map(p=>tidePhase(p,state.ticks+1))]:[]),...(state.project.version>=10?[state.mixers]:[]),...(state.project.version>=13?[state.drums]:[]),...(state.project.version>=16?[state.counters]:[])]);}
export function tinkerStep(input){
 if(input.status!=='playing')return input;
 const state=structuredClone(input),trial=tinkerDefinition(state.project),parts=tinkerParts(state.project),tubes=parts.filter(p=>p.kind==='tube');state.events=[];state.ticks++;
 const machinePower=parts.some(p=>p.kind==='kiln'||p.kind==='rail')?kilnPowerChannels(input,parts,input.ticks+1):new Set();
 const echoCards=state.bots.map(bot=>[...bot.program]);
 const occupied=p=>state.bots.some(b=>at(b,p));
 // A held or occupied crossing remains safe throughout this tick, including Pip leaving its plate.
 const held=parts.some(p=>p.kind==='plate'&&occupied(p))||parts.some(p=>p.kind==='bridge'&&occupied(p));
 const switchChannels=new Set([...drumPowerChannels(input,parts),...weavePowerChannels(input,parts,state.ticks),...scalePower(parts,state.bots),...Object.keys(state.switches||{}),...Object.keys(state.pulses||{}),...counterChannels(state,parts),...parts.filter(p=>p.kind==='tide'&&tideOpen(p,state.ticks)).map(p=>p.channel)]);
 const heldChannels=tinkerPoweredChannels(state,parts,state.ticks);
 // Every drum records the same pre-action source snapshot. New beats are for later turns.
 if(state.drums){const sources=drumSourceChannels(input,parts,state.ticks);for(const p of parts.filter(p=>p.kind==='drum')){const memory=advanceDrum(p,input.drums?.[p.id],sources);if(memory.some(Boolean))state.drums[p.id]=memory;else delete state.drums[p.id];}}
 // Count down old rings once. New rings supply the following ticks, never this one.
 if(state.pulses)for(const c of Object.keys(state.pulses)){if(--state.pulses[c]===0)delete state.pulses[c];}
 if(state.counters)for(const record of Object.values(state.counters))if(record[1]>0)record[1]--;
 // Snapshot the meeting before either courier moves or leaves a post.
 const meetingReady=state.project.version>=18&&readyRendezvous(input,parts);
 for(const bot of state.bots){
  if(bot.syncing){
   if(!meetingReady){
    bot.last='Rendezvous · waiting for partner';
    state.events.push(`${bot.id}: ${bot.last}`);
    continue;
   }
   bot.syncing=false;
   state.events.push(`${bot.id}: Rendezvous · resumed together`);
  }
  if(state.project.version>=14&&restRemaining(bot.resting)>0){bot.resting--;bot.last=bot.resting?`Resting · ${bot.resting} turn${bot.resting===1?'':'s'} left; cards and parcel held`:'Rest complete · next card ready';state.events.push(`${bot.id}: ${bot.last}`);continue;}
  const before={x:bot.x,y:bot.y};
  const rail=bot.rolling&&parts.find(part=>part.kind==='rail'&&at(part,bot));
  let command;
  if(rail){
   const powered=machinePower.has(rail.channel);
   command=powered?rail.poweredExit:rail.quietExit;
   bot.rolling=false;
   bot.last=`Switch Rail · ${powered?'Powered':'Quiet'} ${CLOCKWORK_LABELS[command]} · card held`;
  }else{
   command=bot.program[bot.index];
   bot.index=(bot.index+1)%3;
   bot.last=command;
  }
  const direction=Object.hasOwn(RAIL_DIRECTIONS,command)?RAIL_DIRECTIONS[command]:null;
  if(direction){
   const target=point(bot.x+direction[0],bot.y+direction[1]),bridge=parts.find(p=>p.kind==='bridge'&&at(p,target));
   const closed=bridge&&!(state.project.version>=2?heldChannels.has(bridge.channel):held);
   if(!trial.road.some(p=>at(p,target))||state.bots.some(b=>b!==bot&&at(b,target))||closed)bot.last=closed&&parts.some(p=>p.kind==='tide'&&p.channel===bridge.channel)?'Blocked by tide · tick '+state.ticks+' closed':'Blocked';
   else{const seal=parts.find(p=>p.kind==='seal'&&at(p,target));if(seal&&!sealAllows(seal,bot,command))bot.last='Blocked by parcel seal · '+sealDescription(seal);else Object.assign(bot,target);}
  }
  if(rail){
   if(at(before,bot))bot.last=`${bot.last} · Switch Rail blocked; card held`;
   state.events.push(`${bot.id}: ${bot.last}`);
  }
  if(command==='use'){
   const tile=parts.find(p=>at(p,bot));let restart=false;bot.last='Nothing to use here';
   if(tile?.kind==='source'){if(bot.parcel)bot.last=`Holding ${bot.parcel}; the well keeps its parcel`;else {bot.parcel=tile.channel;bot.last=`Collected ${tile.channel}`;}}
   if(tile?.kind==='receiver'){if((state.received[tile.id]||0)>=(tile.parcels||1))bot.last='Window already filled; parcel kept';else if(bot.parcel===tile.channel){bot.parcel=null;state.received[tile.id]=(state.received[tile.id]||0)+1;bot.last=`Delivered ${tile.channel}`;}else bot.last=`Window needs ${tile.channel}; ${bot.parcel||'empty hands'} kept`;}
   if(tile?.kind==='press'){if(bot.parcel===tile.channel){bot.parcel=tile.output;bot.last=`Pressed ${tile.channel} into ${tile.output}`;}else bot.last=`Recipe needs ${tile.channel}; ${bot.parcel||'empty hands'} kept`;}
   if(tile?.kind==='kiln'){const fired=fireKiln(tile,bot.parcel,machinePower.has(tile.channel));bot.parcel=fired.parcel;bot.last=fired.message;}
   if(tile?.kind==='mixer'){const mixed=useMixer(tile,state.mixers[tile.id],bot.parcel);bot.parcel=mixed.parcel;if(mixed.stored)state.mixers[tile.id]=mixed.stored;else delete state.mixers[tile.id];bot.last=mixed.message;}
   if(tile?.kind==='echo'){const other=state.bots.findIndex(b=>b!==bot);bot.program=echoProgram(echoCards[other],tile.operation);restart=true;bot.last=`Echo learned ${state.bots[other].id} · ${ECHO_OPERATIONS[tile.operation]}`;}
   if(tile?.kind==='prism'){bot.program=transformProgram(bot.program,tile.operation);restart=true;bot.last='Prism changed the cards';}
   if(tile?.kind==='signal'){const windows=parts.filter(p=>p.kind==='receiver'&&p.channel===tile.channel),plates=parts.filter(p=>p.kind==='plate'&&p.channel===tile.channel);const powered=switchChannels.has(tile.channel)||Boolean(windows.length&&windows.every(p=>(state.received[p.id]||0)>=(p.parcels||1)))||Boolean(plates.length&&plates.every(occupied));bot.program=[...(powered?tile.alternate:tile.program)];restart=true;bot.last=`Signal loaded ${powered?'Powered':'Quiet'}`;}
   if(tile?.kind==='sync')bot.last='Rendezvous Post waits on entry; Use does not queue it';
   if(tile?.kind==='rail')bot.last='Switch Rail rides after entry; Use keeps it still';
   if(tile?.kind==='counter')bot.last='Footfall Counter counts arrivals; Use adds no mark';
   if(tile?.kind==='vane')bot.last='Wind Vanes turn cards on arrival; Use keeps cargo and does not turn again';
   if(tile?.kind==='rest')bot.last='Rest Stone pauses on arrival; Use keeps cargo and does not restart the pause';
   if(tile?.kind==='drum')bot.last='Memory Drum repeats earlier power automatically; no Use is needed';
   if(tile?.kind==='weave')bot.last='Weave relay reads its two sources at turn start; no Use is needed';
   if(tile?.kind==='scale')bot.last='Scale reads cargo at turn start; no Use is needed';
   if(tile?.kind==='tide')bot.last='Tide runs automatically; its next beat needs no Use';
   if(tile?.kind==='pulse'){state.pulses[tile.channel]=Math.max(state.pulses[tile.channel]||0,tile.duration);bot.last=`Bell ${tile.channel} rings · ${state.pulses[tile.channel]} powered tick${state.pulses[tile.channel]===1?'':'s'} ahead`;}
   if(tile?.kind==='latch'){if(state.switches[tile.channel])delete state.switches[tile.channel];else state.switches[tile.channel]=true;bot.last=`Lantern ${tile.channel} ${state.switches[tile.channel]?'lit':'off'} · power changes next tick`;}
   if(tile?.kind==='locker'){const held=state.lockers[tile.channel];if(bot.parcel){if(tile.mode==='take')bot.last='Collect-only locker; cargo kept';else if(held)bot.last='Locker full; cargo kept';else{state.lockers[tile.channel]={parcel:bot.parcel,by:bot.id};bot.parcel=null;bot.last='Stored parcel in locker';}}else if(tile.mode==='send')bot.last='Send-only locker; awaiting a parcel';else if(!held)bot.last='Locker empty';else{bot.parcel=held.parcel;if(held.by!==bot.id)state.lockerTransfers=Math.min(240,state.lockerTransfers+1);delete state.lockers[tile.channel];bot.last='Collected '+bot.parcel+' from locker';}}
   if(tile?.kind==='cargo'){const matches=tile.channel==='any'?Boolean(bot.parcel):bot.parcel===tile.channel;bot.program=[...(matches?tile.alternate:tile.program)];restart=true;bot.last='Cargo compass loaded '+(matches?'Matching':'Otherwise');}
   if(tile?.kind==='flip'){const bank=state.flips[tile.id]??tile.initial;bot.program=[...(bank?tile.alternate:tile.program)];state.flips[tile.id]=!bank;restart=true;bot.last=`Loaded Route ${bank?'B':'A'}`;}
   if(tile?.kind==='tube'){const pair=state.project.version>=2?tubes.filter(p=>p.channel===tile.channel):tubes,other=pair.find(p=>p.id!==tile.id);if(pair.length!==2)bot.last='Place both tube ends before testing';else if(state.bots.some(b=>b!==bot&&at(b,other)))bot.last='Tube exit blocked';else {bot.x=other.x;bot.y=other.y;bot.last='Traveled through the tube';}}
   if(tile?.kind==='handoff'){const other=state.bots.find(b=>b!==bot&&Math.abs(b.x-bot.x)+Math.abs(b.y-bot.y)===1);if(!bot.parcel)bot.last='Handoff needs a parcel';else if(!other||other.parcel)bot.last='Partner must be beside the handoff with empty hands';else {other.parcel=bot.parcel;bot.parcel=null;state.transfers=state.project.version>=2?Math.min(240,state.transfers+1):state.transfers+1;bot.last=`Passed parcel to ${other.id}`;}}
   if(restart)bot.index=0;
  }
  const entered=parts.find(p=>p.kind==='rest'&&at(p,bot));if(entered&&!at(before,bot)){bot.resting=entered.duration;bot.last=`Reached Rest Stone · pause ${entered.duration} following turn${entered.duration===1?'':'s'}; next card held`;state.events.push(`${bot.id}: ${bot.last}`);}
  const vane=state.project.version>=15&&direction&&!at(before,bot)&&parts.find(p=>p.kind==='vane'&&at(p,bot));if(vane){bot.program=transformProgram(bot.program,vane.operation);bot.last=`Wind Vane turned cards · ${PRISM_OPERATIONS[vane.operation]} · next card ${bot.index+1}`;state.events.push(`${bot.id}: ${bot.last}`);}
  const counter=state.counters&&direction&&!at(before,bot)&&parts.find(p=>p.kind==='counter'&&at(p,bot));
  if(counter){const hit=counterArrival(counter,state.counters[counter.id],bot.id.toLowerCase());if(hit){state.counters[counter.id]=hit.record;bot.last=hit.triggered?`Footfall Counter rang · ${counter.channel} for ${counter.duration} ahead`:`Footfall Counter · ${hit.record[0]}/${counter.threshold} marks`;state.events.push(`${bot.id}: ${bot.last}`);}else{bot.last='Footfall Counter · other badge';state.events.push(`${bot.id}: ${bot.last}`);}}
  if(state.project.version>=17&&direction&&!at(before,bot)&&parts.some(part=>part.kind==='rail'&&at(part,bot))){
   bot.rolling=true;
   bot.last=rail?'Switch Rail linked · another ride next turn':'Switch Rail reached · ride next turn';
   state.events.push(`${bot.id}: ${bot.last}`);
  }
  if(state.project.version>=18&&direction&&!at(before,bot)){
   const post=parts.find(part=>part.kind==='sync'&&at(part,bot));
   if(post){
    bot.syncing=true;
    bot.last=`Rendezvous · reached ${post.channel} post`;
    state.events.push(`${bot.id}: ${bot.last}`);
   }
  }
  if(!rail&&(command==='use'||bot.last.startsWith('Blocked')))state.events.push(`${bot.id}: ${bot.last}`);
 }
 const receivers=parts.filter(p=>p.kind==='receiver');const parked=parts.filter(p=>['pip-dock','sprout-dock'].includes(p.kind)).every(p=>at(p,state.bots[p.kind==='pip-dock'?0:1]));if(receivers.length&&receivers.every(p=>(state.received[p.id]||0)>=(p.parcels||1))&&(state.project.version>=2?state.transfers>=(trial.handoffs||0)&&parked&&(state.project.version<3||state.lockerTransfers>=(trial.relays||0)&&(!trial.emptyLockers||!Object.keys(state.lockers).length))&&(state.project.version<4||!trial.quietSwitches||!Object.keys(state.switches).length)&&(state.project.version<5||!trial.quietBells||!Object.keys(state.pulses).length)&&(state.project.version<13||!trial.quietDrums||!Object.keys(state.drums).length):trial.id!=='parcel-partners'||state.transfers>0))state.status='won';else if(state.ticks>=TINKER_LIMIT)state.status='limit';
 state.last=state.status==='won'?(state.project.version>=2?'Adventure complete! '+trial.ending:'Invention complete! Keep this answer, or try a smaller or faster one.'):state.status==='limit'?'Tick limit reached. Return to the bench and try a different idea.':state.events.join(' · ')||state.bots.map(b=>`${b.id}: ${b.last}`).join(' · ');return state;
}
export function verifyTinkerProof(project){let state=startTinker(project);for(let i=0;i<project.proof.ticks;i++)state=tinkerStep(state);return state.status==='won'&&state.ticks===project.proof.ticks;}
export function clearTinkerProject(state){if(state.status!=='won')fail('Finish a test before attaching its solution.');return normalizeTinkerProject({...state.project,proof:{ticks:state.ticks}});}
export function tinkerMetrics(project){const p=project.parts;return {parts:p.length,ticks:project.proof?.ticks||null,footprint:p.length?(Math.max(...p.map(p=>p.x))-Math.min(...p.map(p=>p.x))+1)*(Math.max(...p.map(p=>p.y))-Math.min(...p.map(p=>p.y))+1):0};}
export function tinkerHint(project,level=0){if(project.version>=2)return duoHintStages(tinkerDefinition(project))[Math.max(0,Math.min(2,level))];const t=tinkerTrial(project.trialId),h=TINKER_SOLUTIONS[t.id];return [t.story,`Try ${h.tip}. You can inspect every tick for free.`,h.explain][Math.max(0,Math.min(2,level))];}
export const TINKER_SOLUTIONS=Object.freeze({
 'first-use':{programs:ordinary,parts:[],tip:'East / East / Use',explain:'Set East / East / Use. Collect on tick 3, deliver on tick 6.'},
 'corner-turn':{programs:ordinary,parts:[part('prism',5,3,{operation:'rotate-left'})],tip:'turning north at column 6, row 4',explain:'Place a Turn left prism at (6, 4). East / East / Use collects, refracts and delivers in 9 ticks.'},
 'paint-parcel':{programs:ordinary,parts:[part('press',5,3,{channel:'amber',output:'jade'})],tip:'a recipe between the well and window',explain:'Place an amber → jade press at (6, 4). East / East / Use finishes in 9 ticks.'},
 'remember-road':{programs:ordinary,parts:[part('flip',3,3,{program:['up','wait','use'],alternate:['right','wait','use'],initial:false})],tip:'North / Wait / Use in Route A and East / Wait / Use in Route B',explain:'Place a flip sign at (4, 4). A: North / Wait / Use. B: East / Wait / Use. Start A with East / East / Use. The mirror brings Pip back before Route B delivers in 18 ticks.'},
 'corner-post':{programs:ordinary,parts:[part('tube',5,3),part('tube',5,1)],tip:'a tube pair or two turning prisms',explain:'Place tube ends at (6, 4) and (6, 2). East / East / Use finishes in 9 ticks. Two prisms are another answer.'},
 'jade-express':{programs:ordinary,parts:[part('press',5,3,{channel:'amber',output:'jade'}),part('tube',7,3),part('tube',5,1)],tip:'converting before the tube ride',explain:'Press amber → jade at (6, 4), then tubes at (8, 4) and (6, 2). East / East / Use delivers in 12 ticks.'},
 'repair-relay':{programs:ordinary,parts:[part('prism',5,3,{operation:'rotate-left'}),part('prism',5,1,{operation:'rotate'})],tip:'replacing the mirror with a left turn',explain:'Turn left at (6, 4), turn right at (6, 2). East / East / Use finishes in 12 ticks.'},
 'quiet-garden':{programs:ordinary,parts:[part('prism',5,3,{operation:'rotate'})],tip:'a single right turn',explain:'Turn right at (6, 4). East / East / Use delivers in 9 ticks with one part.'},
 'parcel-partners':{programs:[...ordinary,['wait','wait','use']],parts:[],tip:'Pip: East / East / Use; Sprout: Wait / Wait / Use',explain:'Pip collects, presses, then hands off on tick 9. Sprout uses its receiver later in that same tick.'},
 'bridge-duet':{programs:[['right','wait','left'],['right','use','right']],parts:[],tip:'Pip: East / Wait / West; Sprout: East / Use / East',explain:'Pip holds the plate. Sprout’s blocked fourth move shifts its Use to the source. The occupied bridge stays safe, and delivery finishes on tick 8.'}
});
export function solvedTinkerProject(id){if(duoMission(id)){const d=duoMission(id);let state=startTinker(editTinkerProject(newDuoProject(id),{programs:d.solution,parts:d.solutionParts||[]}));while(state.status==='playing')state=tinkerStep(state);return clearTinkerProject(state);}const solution=TINKER_SOLUTIONS[id];let state=startTinker(editTinkerProject(newTinkerProject(id),solution));while(state.status==='playing')state=tinkerStep(state);return clearTinkerProject(state);}
export function compileTinkerAdventure(input){
 const project=normalizeTinkerProject(input),trial=tinkerDefinition(project);if(trial.starts.length!==1)fail('Two-companion prototypes share as Pip projects. Ordinary adventures have one companion.');
 if(!project.proof)fail('Finish the invention before exporting a playable adventure.');
 const base=blankAdventure(11,11),map=structuredClone(base.map);map.layers.forEach((l,i)=>l.tiles.fill(i===0?3:0));for(const p of [...trial.road,point(1,9),point(2,9),point(1,10)])map.layers[0].tiles[p.y*11+p.x]=5;
 const markers=[{kind:'start',id:'keeper',x:1,y:9},{kind:'beacon',id:'home',x:1,y:10},{kind:'lantern',id:'light',x:2,y:9},{kind:'clockwork',id:'pip',...trial.starts[0],program:project.programs[0],dockLocked:true,name:'Pip'}];
 for(const p of tinkerParts(project)){const kinds={source:'pip-parcel',receiver:'pip-socket',press:'pip-press',tube:'pip-tube',prism:'pip-prism',flip:'pip-flip'};const {id,kind,...fields}=p;markers.push({...fields,id:'part-'+id,kind:kinds[kind],channel:kind==='tube'?'blue':p.channel,required:kind==='receiver',parcels:1});}
 return editAdventure(base,{title:project.name,author:project.author,source:'Pip Tinkerer’s Trials',description:trial.story,intro:'Pip’s invention is ready. Advance its cards to fill every window. Collect the nearby light and return to the beacon. Read Pip’s workshop for a free rehearsal.',hint:TINKER_SOLUTIONS[trial.id].explain,ending:'One small invention. A whole new road.',theme:'clockwork',map,markers,proof:{difficulty:'trail',actions:[...Array(project.proof.ticks).fill('clockwork-step'),'right','left','down']}});
}
export function serializeTinkerProject(project){return JSON.stringify(normalizeTinkerProject(project))+'\n';}
export function parseTinkerProject(raw){if(typeof raw!=='string'||new TextEncoder().encode(raw).length>40_000)fail('Choose a Pip project smaller than 40 KB.');let data;try{data=JSON.parse(raw);}catch{fail('This Pip project is not valid JSON.');}return normalizeTinkerProject(data);}
function checksum(bytes){let hash=2166136261;for(const byte of bytes)hash=Math.imul(hash^byte,16777619)>>>0;return hash.toString(16).padStart(8,'0');}
export function tinkerCode(project){const bytes=new TextEncoder().encode(serializeTinkerProject(project));let binary='';for(const b of bytes)binary+=String.fromCharCode(b);return `PT1.${checksum(bytes)}.${btoa(binary).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'')}`;}
export function parseTinkerCode(raw){if(typeof raw!=='string'||raw.length>60_000)fail('This Pip code is too long.');const code=raw.trim().includes('#pip=')?raw.trim().split('#pip=')[1]:raw.trim(),m=/^PT1\.([0-9a-f]{8})\.([A-Za-z0-9_-]+)$/.exec(code);if(!m)fail('Paste a complete PT1 code or Pip project link.');let bytes;try{bytes=Uint8Array.from(atob(m[2].replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));}catch{fail('The Pip code is incomplete.');}if(checksum(bytes)!==m[1])fail('This Pip code changed in transit. Copy the complete code again.');return parseTinkerProject(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
export function tinkerPlayLink(project,location){try{const url=new URL(location);if(!['https:','http:'].includes(url.protocol)||url.username||url.password||/^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|\[?::1\]?)/.test(url.hostname))return '';url.search='';url.hash='pip='+tinkerCode(project);return url.href.length<=12_000?url.href:'';}catch{return '';}}
export function emptyTinkerJournal(){return {version:1,drafts:{},bests:{},showcase:[null,null,null]};}
export function loadTinkerJournal(storage){try{const raw=storage.getItem(TINKER_KEY);if(!raw)return {journal:emptyTinkerJournal(),failed:false};if(raw.length>120_000)throw Error();const data=JSON.parse(raw);if(data.version!==1||!Array.isArray(data.showcase)||data.showcase.length!==3||!data.drafts||!data.bests)throw Error();const journal=emptyTinkerJournal();for(const [id,p]of Object.entries(data.drafts)){tinkerTrial(id);const n=normalizeTinkerProject(p);if(n.trialId!==id)throw Error();journal.drafts[id]=n;}for(const [id,ps]of Object.entries(data.bests)){tinkerTrial(id);if(!Array.isArray(ps)||ps.length>3)throw Error();journal.bests[id]=ps.map(p=>{const n=normalizeTinkerProject(p);if(n.trialId!==id||!n.proof)throw Error();return n;});}journal.showcase=data.showcase.map(p=>{if(!p)return null;const n=normalizeTinkerProject(p);if(!n.proof)throw Error();return n;});return {journal,failed:false};}catch{return {journal:emptyTinkerJournal(),failed:true};}}
export function saveTinkerJournal(storage,journal){try{const raw=JSON.stringify(journal);if(raw.length>120_000)return false;storage.setItem(TINKER_KEY,raw);return true;}catch{return false;}}
export function keepTinkerResult(journal,project){const p=normalizeTinkerProject(project);if(!p.proof)fail('Only working inventions have personal bests.');const next=structuredClone(journal),all=[...(next.bests[p.trialId]||[]),p];const unique=[...new Map(all.map(p=>[serializeTinkerProject(p),p])).values()];const fastest=[...unique].sort((a,b)=>a.proof.ticks-b.proof.ticks||a.parts.length-b.parts.length)[0],smallest=[...unique].sort((a,b)=>a.parts.length-b.parts.length||a.proof.ticks-b.proof.ticks)[0];next.bests[p.trialId]=[...new Set([fastest,smallest,p])];next.drafts[p.trialId]=p;return next;}
export function builderPicks(){return ['corner-post','jade-express','repair-relay','quiet-garden'].map(id=>({world:compileTinkerAdventure({...solvedTinkerProject(id),author:'Lantern Trails'}),trial:tinkerTrial(id)}));}
