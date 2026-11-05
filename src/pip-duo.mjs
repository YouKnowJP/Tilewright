// New owned material. See LICENSE; prior MIT permissions remain effective.
import {normalizeProgram,PRISM_OPERATIONS} from './clockwork.mjs';
import {NIGHT_MAIL_MISSIONS} from './pip-night-mail.mjs';
import {DAWN_WORKSHOP_MISSIONS} from './pip-dawn-workshop.mjs';
import {CANOPY_FAIR_MISSIONS} from './pip-canopy-fair.mjs';
import {AFTER_HOURS_MISSIONS} from './pip-after-hours.mjs';
import {CLOCKTOWER_MISSIONS} from './pip-clocktower.mjs';
export const DUO_KEY='tilewright.pip-duo.v1';
export const DUO_CHANNELS=Object.freeze(['amber','jade','violet','blue']);
export const DUO_KINDS=Object.freeze(['source','receiver','press','tube','prism','flip','signal','handoff','plate','bridge','pip-dock','sprout-dock','locker','cargo']);
export const DUO_ADVANCED_KINDS=Object.freeze(['locker','cargo']);
const p=(x,y)=>({x,y}),row=(y,a,b)=>Array.from({length:b-a+1},(_,i)=>p(a+i,y)),part=(kind,x,y,extra={})=>({kind,x,y,...extra});
const q=(x,y,channel='amber')=>part('source',x,y,{channel}),n=(x,y,channel='amber',parcels=1)=>part('receiver',x,y,{channel,parcels});
const flip=(x,y,program,alternate,initial=false)=>part('flip',x,y,{program,alternate,initial});
const prism=(x,y,operation='mirror')=>part('prism',x,y,{operation});
const signal=(x,y,program,alternate)=>part('signal',x,y,{channel:'jade',program,alternate});
const RR=['right','right','use'],WW=['wait','wait','use'],UW=['up','wait','use'],RW=['right','wait','use'];
const waiting=[['wait','wait','wait'],['wait','wait','wait']];
const story=(id,title,width,road,starts,fixed,programs,handoffs,intro,hint,ending)=>({id,title,width,height:7,collection:'adventures',road,fixed,starts,programs:waiting,budget:0,inventory:{},handoffs,solution:programs,story:intro,hint,ending,difficulty:'Story',minutes:'5–15 min'});
export const DUO_MISSIONS=Object.freeze([
 story('duo-first-letter','A Letter for Two',9,[...row(4,1,5),...row(3,5,7)],[p(1,4),p(5,3)],[q(3,4),part('handoff',5,4),n(7,3),flip(5,3,WW,RR)],[RR,WW],1,
  'Tavi: “One letter, two roads. Pip can reach the handoff; Sprout can reach the upstairs window. Let the little sign give Sprout time to wait for its friend.” Fill the window after one handoff. Pip acts first on each tick.',
  'Pip: East / East / Use. Sprout: Wait / Wait / Use. The sign waits on its first visit, then opens the delivery road. Pip hands over the parcel on tick 6; Sprout delivers on tick 9.',
  'Tavi folds a second paper hat. “A post office,” she says, “is a place where somebody else can carry the next part.” Sprout keeps the hat.'),
 story('duo-dyehouse','The Dyehouse Promise',9,[...row(4,1,5),...row(3,5,7)],[p(1,4),p(5,3)],[q(1,4),part('press',3,4,{channel:'amber',output:'jade'}),part('handoff',5,4),flip(5,3,WW,['right','use','wait']),part('press',6,3,{channel:'jade',output:'blue'}),n(7,3,'blue')],[['use','right','right'],WW],1,
  'Rook: “Amber from the well, jade from my press, blue for the night invitation.” Pip works the first recipe. Sprout takes the second. Leave room for a handoff before Sprout starts moving.',
  'Pip: Use / East / East. Sprout: Wait / Wait / Use. Pip collects on tick 1, presses on 4 and passes on 7, before Sprout moves. Sprout makes blue on 8 and delivers on 11.',
  'Rook hangs the blue invitation beside two paint-stained hats. The recipe is written in two different hands.'),
 story('duo-rain-bridges','A Bridge for the Rain',9,[...row(2,1,7),...row(5,1,7)],[p(1,2),p(7,5)],[q(1,2),part('plate',3,2,{channel:'amber'}),part('bridge',4,2,{channel:'jade'}),n(7,2),q(5,5,'blue'),part('bridge',4,5,{channel:'amber'}),part('plate',3,5,{channel:'jade'}),n(1,5,'blue')],[['use','right','right'],['left','left','use']],0,
  'Moss: “I can mend both banks if you bring both parcels.” Each partner opens the other’s crossing. A held or occupied bridge stays safe for the whole tick. A blocked move still advances its card.',
  'Pip: Use / East / East. Sprout: West / West / Use. Pip holds amber while Sprout crosses. Sprout reaches jade before Pip’s second crossing attempt. Both windows are filled by tick 13.',
  'Two banks answer with two lamps. Moss leaves the stepping stones where the partners put them.'),
 story('duo-long-road','The Long Way Round',9,[...row(4,1,5),...row(3,5,6),...row(1,1,5)],[p(1,4),p(5,3)],[q(3,4),part('handoff',5,4),flip(5,3,WW,['right','use','wait']),part('tube',6,3,{channel:'blue'}),part('tube',1,1,{channel:'blue'}),n(3,1),part('sprout-dock',5,1)],[RR,WW],1,
  'Nessa: “The far window is across the water. The blue tube knows the way.” Hand over the letter, travel by tube, fill the far window and leave Sprout at the S home flag.',
  'Pip: East / East / Use. Sprout: Wait / Wait / Use. Sprout takes the tube on tick 8, delivers on 14 and reaches its home flag on 19. Walking onto a tube never activates it.',
  'Nessa finds the letter at the far window and Sprout waiting beside it. Some long roads fit inside a little brass pipe.'),
 story('duo-signmaker','The Signmaker’s Errand',9,[...row(4,1,7),...row(3,5,7),p(5,2)],[p(1,4),p(5,3)],[prism(1,4),q(3,4,'jade'),part('handoff',5,4),prism(7,4),flip(5,3,UW,RW,true),prism(5,2,'mirror-y'),n(6,3,'jade',2),prism(7,3)],[RR,UW],2,
  'Tavi: “The greenhouse needs two jade letters. This sign begins on Route B.” Pip must refill and return; Sprout must return in time to receive the second parcel. The two loops need the same meeting place, not the same cards.',
  'Pip: East / East / Use. Sprout: North / Wait / Use. Handoffs happen on ticks 6 and 24. Sprout’s northern mirror makes a waiting detour. The second delivery completes tick 27.',
  'Tavi turns the sign over one last time. Its two arrows point to the same promise: come back for the next letter.'),
 story('duo-lantern-festival','The Festival of Two Lights',13,[...row(4,1,7),...row(3,5,11),p(5,2),p(11,2),p(11,1),p(1,5)],[p(1,4),p(5,3)],[signal(1,4,RR,['down','wait','use']),q(3,4,'jade'),part('handoff',5,4),prism(7,4),flip(5,3,UW,RR,true),prism(5,2,'mirror-y'),n(7,3,'jade'),n(9,3,'jade'),signal(11,3,['left','left','use'],['up','up','use']),part('pip-dock',1,5),part('sprout-dock',11,1)],[RR,UW],2,
  'Eid: “Light both windows, then bring both partners home.” Quiet signal stamps keep the post running; once every jade window is full, Powered sends the partners to their P and S flags. Signals read the world when Use happens. Pip acts before Sprout.',
  'Pip: East / East / Use. Sprout: North / Wait / Use. Handoffs occur on 6 and 24; windows fill on 9 and 36. Sprout reaches home on 41. Pip samples Quiet before the second window fills, so it makes one final loop and arrives home on 55.',
  'Both windows shine. Both paper hats are home. The keepers leave a clear space beside the post office: a place for the next adventure you will build.')
].map((m,i)=>Object.freeze({...m,chapter:i+1,difficulty:i<2?'Gentle':i<4?'Tricky':'Expert'})));
export const DUO_STORIES=Object.freeze([...DUO_MISSIONS,...NIGHT_MAIL_MISSIONS,...DAWN_WORKSHOP_MISSIONS,...CANOPY_FAIR_MISSIONS,...AFTER_HOURS_MISSIONS,...CLOCKTOWER_MISSIONS]);
export const DUO_CUSTOM=Object.freeze({id:'duo-creator',title:'Your duo adventure',collection:'create',difficulty:'Creator',minutes:'Your pace'});
export function duoMission(id){return DUO_STORIES.find(m=>m.id===id);}
export function duoText(value,fallback,max=48){if(value===undefined)return fallback;if(typeof value!=='string'||value.length>max||/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/.test(value))throw Error('Use short, printable story text.');return value.trim()||fallback;}
const same=(a,b)=>a.x===b.x&&a.y===b.y;
export function normalizeDuoPart(raw,{version=2}={}){
 if(DUO_ADVANCED_KINDS.includes(raw?.kind)&&version!==3)throw Error('This part needs a version-3 night-post adventure.');
 if(!raw||!DUO_KINDS.includes(raw.kind)||!Number.isInteger(raw.x)||!Number.isInteger(raw.y))throw Error('Choose a known duo part and a garden tile.');
 const out=part(raw.kind,raw.x,raw.y);
 if(['source','receiver','press','tube','plate','bridge','signal','locker'].includes(raw.kind)){if(!DUO_CHANNELS.includes(raw.channel))throw Error('Choose a numbered parcel or signal colour.');out.channel=raw.channel;}
 if(raw.kind==='receiver'){out.parcels=raw.parcels??1;if(!Number.isInteger(out.parcels)||out.parcels<1||out.parcels>3)throw Error('A window needs one to three parcels.');}
 if(raw.kind==='press'){if(!DUO_CHANNELS.includes(raw.output)||raw.output===raw.channel)throw Error('A recipe needs two different parcel colours.');out.output=raw.output;}
 if(raw.kind==='prism'){if(!Object.hasOwn(PRISM_OPERATIONS,raw.operation))throw Error('Choose a known prism operation.');out.operation=raw.operation;}
 if(raw.kind==='locker'){if(!['both','send','take'].includes(raw.mode??'both'))throw Error('Choose a locker that sends, collects or does both.');out.mode=raw.mode??'both';}
 if(raw.kind==='cargo'){if(![...DUO_CHANNELS,'any'].includes(raw.channel))throw Error('Choose a cargo match.');out.channel=raw.channel;}
 if(['flip','signal','cargo'].includes(raw.kind)){out.program=normalizeProgram(raw.program);out.alternate=normalizeProgram(raw.alternate);if(raw.kind==='flip'){if(raw.initial!==undefined&&typeof raw.initial!=='boolean')throw Error('Choose Route A or B first.');out.initial=raw.initial===true;}}
 return out;
}
export function duoDefinition(project){
 const mission=duoMission(project.trialId);if(mission)return mission;
 if(project.trialId!=='duo-creator')throw Error('Choose a known duo adventure.');
 return {...DUO_CUSTOM,width:project.board.width,height:project.board.height,road:project.board.road,starts:project.starts,fixed:[],budget:32,inventory:Object.fromEntries(DUO_KINDS.map(k=>[k,32])),story:project.intro,ending:project.ending,handoffs:project.handoffs,relays:project.relays||0,emptyLockers:project.emptyLockers===true};
}
export function normalizeDuoProject(input){
 if(!input||input.format!=='pip-tinker-project'||![2,3].includes(input.version))throw Error('Choose a version-2 or version-3 duo adventure.');
 const mission=duoMission(input.trialId),custom=input.trialId==='duo-creator';if(!mission&&!custom||mission&&input.version!==(mission.version||2))throw Error('Choose a known duo adventure and its matching version.');
 if(!Array.isArray(input.programs)||input.programs.length!==2)throw Error('Pip and Sprout each need three cards.');
 const out={format:'pip-tinker-project',version:input.version,trialId:input.trialId,name:duoText(input.name,mission?.title||'A new duo adventure'),author:duoText(input.author,mission?'Lantern Trails':'A trail keeper'),programs:input.programs.map(normalizeProgram),parts:[]};
 if(!Array.isArray(input.parts))throw Error('Include a duo parts list.');
 if(!custom){if((!mission.budget&&input.parts.length)||input.board!==undefined||input.starts!==undefined||input.handoffs!==undefined||input.intro!==undefined||input.ending!==undefined||input.relays!==undefined||input.emptyLockers!==undefined)throw Error('Remix the story mission to change its garden.');}
 else{
  const b=input.board;if(!b||!Number.isInteger(b.width)||!Number.isInteger(b.height)||b.width<7||b.width>13||b.height<5||b.height>9||!Array.isArray(b.road)||b.road.length>b.width*b.height)throw Error('Duo gardens need 7–13 columns and 5–9 rows.');
  const valid=p=>p&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.y>=0&&p.x<b.width&&p.y<b.height;
  const road=[];for(const cell of b.road){if(!valid(cell)||road.some(p=>same(p,cell)))throw Error('Garden tiles must be unique and inside the board.');road.push(p(cell.x,cell.y));}
  if(!Array.isArray(input.starts)||input.starts.length!==2||input.starts.some(s=>!valid(s)||!road.some(p=>same(p,s)))||same(...input.starts))throw Error('Place both companions on different garden tiles.');
  out.board={width:b.width,height:b.height,road};out.starts=input.starts.map(s=>p(s.x,s.y));out.intro=duoText(input.intro,'Bring a little light to both partners’ road.',400);out.ending=duoText(input.ending,'Another adventure, made by you.',400);out.source=duoText(input.source,'Player-made duo adventure',96);
  out.handoffs=input.handoffs??0;if(!Number.isInteger(out.handoffs)||out.handoffs<0||out.handoffs>4)throw Error('Require zero to four handoffs.');
  if(input.version===2&&(input.relays!==undefined||input.emptyLockers!==undefined))throw Error('New locker goals need a version-3 adventure.');
  if(input.version===3){out.relays=input.relays??0;out.emptyLockers=input.emptyLockers??false;if(!Number.isInteger(out.relays)||out.relays<0||out.relays>4||typeof out.emptyLockers!=='boolean')throw Error('Require zero to four locker relays and choose whether lockers must empty.');}
  if(input.parts.length>32)throw Error('Keep at most 32 duo parts.');
  for(const raw of input.parts){const item=normalizeDuoPart(raw,{version:input.version});if(!valid(item)||!road.some(p=>same(p,item))||out.parts.some(p=>same(p,item)))throw Error('Place one part on each garden tile.');out.parts.push(item);}
  for(const kind of ['pip-dock','sprout-dock'])if(out.parts.filter(p=>p.kind===kind).length>1)throw Error('Each companion needs at most one home flag.');
  for(const c of DUO_CHANNELS)if(out.parts.filter(p=>p.kind==='tube'&&p.channel===c).length>2)throw Error('Each tube colour has at most two ends.');
  if(out.parts.filter(p=>['flip','signal','cargo'].includes(p.kind)).length>8)throw Error('Keep at most eight route memories, signals and cargo compasses.');
 }
 if(mission?.budget){if(input.parts.length>mission.budget)throw Error('Stay within this repair’s parts budget.');const counts={};for(const raw of input.parts){const item=normalizeDuoPart(raw,{version:input.version});if(!mission.inventory[item.kind]||(counts[item.kind]=(counts[item.kind]||0)+1)>mission.inventory[item.kind]||!mission.road.some(p=>same(p,item))||[...mission.fixed,...mission.starts,...out.parts].some(p=>same(p,item)))throw Error('Place an available repair part on a free garden tile.');out.parts.push(item);}}
 for(const c of DUO_CHANNELS)if(out.parts.filter(p=>p.kind==='locker'&&p.channel===c).length>2)throw Error('Each locker channel has at most two ends.');
 if(input.proof!==undefined){if(!Number.isInteger(input.proof?.ticks)||input.proof.ticks<1||input.proof.ticks>240)throw Error('A duo clear needs one to 240 ticks.');out.proof={ticks:input.proof.ticks};}
 return out;
}
export function newDuoProject(id='duo-creator',{width=9,height=7}={}){
 if(id!=='duo-creator'&&!duoMission(id))throw Error('Choose a known duo adventure.');const m=duoMission(id);if(m)return normalizeDuoProject({format:'pip-tinker-project',version:m.version||2,trialId:id,name:m.title,author:'Lantern Trails',programs:m.programs,parts:[]});
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<7||width>13||height<5||height>9)throw Error('Duo gardens need 7–13 columns and 5–9 rows.');const road=[];for(let y=1;y<height-1;y++)road.push(...row(y,1,width-2));
 return normalizeDuoProject({format:'pip-tinker-project',version:2,trialId:'duo-creator',name:'A new duo adventure',author:'A trail keeper',programs:waiting,parts:[],board:{width,height,road},starts:[p(1,Math.floor(height/2)),p(width-2,Math.floor(height/2))],handoffs:0});
}
export function remixDuoProject(input){const def=input.version>=2?duoDefinition(input):null;if(!def)throw Error('Choose a duo story to remix.');return normalizeDuoProject({format:'pip-tinker-project',version:input.version,trialId:'duo-creator',...(input.version===3?{relays:def.relays,emptyLockers:def.emptyLockers}:{}),name:input.name,author:'A trail keeper',programs:input.programs,parts:[...def.fixed,...input.parts],board:{width:def.width,height:def.height,road:def.road},starts:def.starts,handoffs:def.handoffs,intro:def.story,ending:def.ending,source:`Remix of ${input.name} by ${input.author}`.slice(0,96)});}
export function duoEditable(input){return [2,3].includes(input.version)&&input.trialId==='duo-creator';}
export function paintDuoTerrain(input,x,y,road=true){if(!duoEditable(input))throw Error('Remix a story before painting it.');if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=input.board.width||y>=input.board.height)throw Error('Paint inside the garden.');const {proof,...base}=input;if(!road&&(input.parts.some(p=>p.x===x&&p.y===y)||input.starts.some(p=>p.x===x&&p.y===y)))throw Error('Move companions and remove the part before painting water.');return normalizeDuoProject({...base,board:{...base.board,road:[...base.board.road.filter(p=>p.x!==x||p.y!==y),...(road?[p(x,y)]:[])]}});}
export function moveDuoCompanion(input,index,x,y){if(!duoEditable(input)||![0,1].includes(index))throw Error('Move a companion in your own duo adventure.');const {proof,...base}=input;return normalizeDuoProject({...base,starts:base.starts.map((p,i)=>i===index?{x,y}:p)});}
export function duoReadiness(project){const d=duoDefinition(project),parts=[...d.fixed,...project.parts],errors=[];const receivers=parts.filter(p=>p.kind==='receiver'),sources=parts.filter(p=>p.kind==='source');if(!receivers.length)errors.push('Add at least one delivery window.');if(!sources.length)errors.push('Add a parcel well.');for(const c of DUO_CHANNELS){const count=parts.filter(p=>p.kind==='tube'&&p.channel===c).length;if(count===1)errors.push(`Add the second ${c} tube end.`);}const reachable=new Set(sources.map(p=>p.channel));for(let i=0;i<4;i++)for(const press of parts.filter(p=>p.kind==='press'))if(reachable.has(press.channel))reachable.add(press.output);for(const receiver of receivers)if(!reachable.has(receiver.channel))errors.push(`A ${receiver.channel} window needs a matching well or recipe.`);if(d.handoffs&&!parts.some(p=>p.kind==='handoff'))errors.push('Add a handoff station for this adventure’s goal.');if(d.relays&&!parts.some(p=>p.kind==='locker'))errors.push('Add a locker for the relay goal.');return {ready:!errors.length,errors};}
