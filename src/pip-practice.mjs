// New owned material. See LICENSE; prior MIT permissions remain effective.
import {newDuoProject} from './pip-duo.mjs';
import {normalizeTinkerProject,startTinker,tinkerStep} from './pip-tinker.mjs';
const tile=(x,y)=>({x,y}),part=(kind,x,y,extra={})=>({kind,x,y,...extra});
export const PIP_PRACTICES=Object.freeze([
 {id:'handoff',name:'A letter between friends',goal:'Collect amber, pass it beside H, then let Sprout deliver it.',note:'Pip needs Use at the well and at H. Sprout needs Use at its window.',version:2,handoffs:1,starts:[tile(1,2),tile(3,2)],parts:[part('source',1,2,{channel:'amber'}),part('handoff',2,2),part('receiver',4,2,{channel:'amber',parcels:1})],road:[1,2,3,4].map(x=>tile(x,2)),steps:[['use','wait'],['right','wait'],['use','wait'],['wait','right'],['wait','use']]},
 {id:'bell',name:'A crossing after the ring',goal:'Ring amber, cross the bridge on a powered tick, and deliver Pip’s letter.',note:'A bell starts powering its numbered bridge on the following tick. A blocked move still uses a card.',version:5,starts:[tile(1,2),tile(1,4)],parts:[part('source',1,2,{channel:'amber'}),part('bridge',2,2,{channel:'amber'}),part('receiver',4,2,{channel:'amber',parcels:1}),part('pulse',1,4,{channel:'amber',duration:2})],road:[...[1,2,3,4].map(x=>tile(x,2)),tile(1,4)],steps:[['use','use'],['right','wait'],['right','wait'],['right','wait'],['use','wait']]},
 {id:'passport',name:'The parcel a passport expects',goal:'Make jade before entering Pip’s east-facing arch, then deliver it.',note:'G inspects entry automatically and keeps the parcel. Use the recipe press before the inspection.',version:6,starts:[tile(1,2),tile(1,4)],parts:[part('source',1,2,{channel:'amber'}),part('press',2,2,{channel:'amber',output:'jade'}),part('seal',3,2,{channel:'jade',courier:'pip',heading:'right'}),part('receiver',4,2,{channel:'jade',parcels:1})],road:[...[1,2,3,4].map(x=>tile(x,2)),tile(1,4)],steps:[['use','wait'],['right','wait'],['use','wait'],['right','wait'],['right','wait'],['use','wait']]}
].map(room=>Object.freeze(room)));
export const PRACTICE_CARDS=Object.freeze(['up','right','down','left','wait','use']);
export function practiceDefinition(id){const room=PIP_PRACTICES.find(p=>p.id===id);if(!room)throw Error('Choose a tiny practice garden.');return room;}
export function startPipPractice(id){const room=practiceDefinition(id),base=newDuoProject();return startTinker(normalizeTinkerProject({...base,version:room.version,name:room.name,board:{width:7,height:5,road:room.road},starts:room.starts,parts:room.parts,programs:[['wait','wait','wait'],['wait','wait','wait']],handoffs:room.handoffs||0,...(room.version>=4?{quietSwitches:false}:{}),...(room.version>=5?{quietBells:false}:{})}));}
export function stepPipPractice(state,cards){
 if(!Array.isArray(cards)||cards.length!==2||cards.some(c=>!PRACTICE_CARDS.includes(c)))throw Error('Choose one next card for each friend.');
 if(state.status!=='playing')return state;
 return tinkerStep({...state,bots:state.bots.map((b,i)=>({...b,program:[cards[i],cards[i],cards[i]],index:0}))});
}
