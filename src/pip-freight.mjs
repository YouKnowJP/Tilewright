// New owned material. See LICENSE; prior MIT material retains its permissions.
import {liveEcho} from './adventure-tools.mjs';
export const FREIGHT_CHANNELS=Object.freeze(['amber','jade','violet','blue']);
export const freightLink=channel=>String(FREIGHT_CHANNELS.indexOf(channel)+1);
const same=(a,b)=>a.x===b.x&&a.y===b.y;
export function receivedParcels(run,receiver){const counts=run.clockwork?.received;return counts&&Object.hasOwn(counts,receiver.id)?counts[receiver.id]:0;}
export const receiverPowered=(run,receiver)=>receivedParcels(run,receiver)>=receiver.parcels;
export function parcelGateOpen(run,gate){return gate.receivers.every(id=>{const receiver=run.stage.clockworkReceivers.find(r=>r.id===id);return receiver&&receiverPowered(run,receiver);});}
export function freightGoals(run){return [...(run.stage.clockworkReceivers||[]).filter(r=>r.required).map(r=>({label:`Deliver to ${r.name}: ${receivedParcels(run,r)}/${r.parcels}`,done:receiverPowered(run,r)})),...(run.stage.clockworkPresses||[]).filter(p=>p.required).map(p=>({label:`Press parcels at ${p.name}: ${pressVisits(run,p)}/${p.visits}`,done:pressVisits(run,p)>=p.visits}))];}
// Conversion links are directed. Tubes retain their independent channel namespace.
export function reachableParcels(channels,presses=[]){
 const reached=new Set(channels);let changed=true;while(changed){changed=false;for(const p of presses)if(reached.has(p.channel)&&!reached.has(p.output)){reached.add(p.output);changed=true;}}return reached;
}
export function freightNetworkProblem(sources,receivers,presses=[]){
 const supplied=reachableParcels(sources.map(s=>s.channel),presses),hasReceiver=channel=>receivers.some(r=>reachableParcels([channel],presses).has(r.channel));
 if(receivers.some(r=>!supplied.has(r.channel)))return 'Every receiver needs a parcel supplied by a source or reachable press recipe.';
 if(presses.some(p=>!supplied.has(p.channel)))return 'Every parcel press needs a reachable input parcel. Add a source; a recipe cycle alone cannot supply parcels.';
 if(sources.some(s=>!hasReceiver(s.channel))||presses.some(p=>!hasReceiver(p.output)))return 'Every source and press output needs a reachable matching receiver.';
 return null;
}
export function pressVisits(run,press){const counts=run.clockwork?.presses;return counts&&Object.hasOwn(counts,press.id)?counts[press.id]:0;}
export function validateFreight(run,canEnter){
 if(run.stage.clockworkParcels===undefined&&run.stage.clockworkReceivers===undefined&&run.stage.clockworkPresses===undefined)return;
 const sources=run.stage.clockworkParcels,receivers=run.stage.clockworkReceivers,presses=run.stage.clockworkPresses||[];
 if(!Array.isArray(sources)||!Array.isArray(receivers)||!Array.isArray(presses))throw Error('Parcel stations need source, receiver and recipe lists.');
 const stations=[...sources,...receivers,...presses],ids=new Set(stations.map(s=>s.id));
 if(!run.clockwork||!sources.length||!receivers.length||sources.length>8||receivers.length>8||presses.length>8||ids.size!==stations.length||stations.some(s=>!(/^[a-z][a-z0-9-]{0,39}$/).test(s.id)||typeof s.name!=='string'||!Number.isInteger(s.x)||!Number.isInteger(s.y)||!canEnter(run,s)||!FREIGHT_CHANNELS.includes(s.channel))||receivers.some(r=>!Number.isInteger(r.parcels)||r.parcels<1||r.parcels>3)||presses.some(p=>!FREIGHT_CHANNELS.includes(p.output)||p.output===p.channel||!Number.isInteger(p.visits)||p.visits<1||p.visits>4))throw Error('Parcel routes need Pip, up to eight sources, receivers and presses; receivers need one to three parcels and presses need different input/output parcels and one to four activations.');
 const problem=freightNetworkProblem(sources,receivers,presses);if(problem)throw Error(problem);
 run.clockwork.parcel=null;run.clockwork.received={};if(presses.length)run.clockwork.presses={};
}
export function useFreight(run){
 const bot=run.clockwork,source=run.stage.clockworkParcels?.find(s=>same(s,bot)),receiver=run.stage.clockworkReceivers?.find(r=>same(r,bot)),press=run.stage.clockworkPresses?.find(p=>same(p,bot));if(!source&&!receiver&&!press)return null;
 if(press){const success=bot.parcel===press.channel,text=success?`Pressed parcel ${freightLink(press.channel)} (${press.channel}) into ${freightLink(press.output)} (${press.output}) at ${press.name}.`:`${press.name} needs parcel ${freightLink(press.channel)} (${press.channel}). ${bot.parcel?`Parcel ${freightLink(bot.parcel)} (${bot.parcel}) kept.`:'Pip is empty-handed.'}`;return {...run,clockwork:{...bot,parcel:success?press.output:bot.parcel,presses:success?{...bot.presses,[press.id]:Math.min(press.visits,pressVisits(run,press)+1)}:bot.presses,last:text},events:[...run.events,{type:'clockwork-press',text:`${bot.name}: ${text}`}]};}
 let parcel=bot.parcel,received=bot.received,text;
 if(source){if(parcel)text=`Already carrying parcel ${freightLink(parcel)} (${parcel}). Deliver it before collecting another.`;else{parcel=source.channel;text=`Collected parcel ${source.number} (${source.channel}) from ${source.name}.`;}}
 else if(receiverPowered(run,receiver))text=`${receiver.name} is fully powered. No parcel used.`;
 else if(parcel!==receiver.channel)text=`${receiver.name} needs parcel ${receiver.number} (${receiver.channel}). ${parcel?`Still carrying parcel ${freightLink(parcel)} (${parcel}).`:'Pip is empty-handed.'}`;
 else{parcel=null;received={...received,[receiver.id]:receivedParcels(run,receiver)+1};const powered=received[receiver.id]>=receiver.parcels;text=`Delivered to ${receiver.name}: ${received[receiver.id]}/${receiver.parcels}. ${powered?'Receiver powered.':'Bring another parcel.'}`;}
 return {...run,clockwork:{...bot,parcel,received,last:text},events:[...run.events,{type:'clockwork-parcel',text:`${bot.name}: ${text}`}]};
}
export function freightResetProblem(run){
 if(!run.clockwork?.received)return null;const echo=liveEcho(run),occupied=[run.player,run.stage.clockwork,...run.crates,...run.companions,...(echo?[echo]:[])];
 return run.stage.gates.some(g=>g.type==='parcel'&&parcelGateOpen(run,g)&&occupied.some(p=>same(p,g)))?'Clear the parcel crossing before returning Pip to dock.':null;
}
export function freightSummary(run){const bot=run.clockwork;return bot&&Object.hasOwn(bot,'parcel')?`Parcel: ${bot.parcel?`${freightLink(bot.parcel)} (${bot.parcel})`:'empty-handed'}.`:'';}
