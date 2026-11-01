// New owned material. See LICENSE; prior MIT material retains its permissions.
import {liveEcho} from './adventure-tools.mjs';
export const FREIGHT_CHANNELS=Object.freeze(['amber','jade','violet','blue']);
export const freightLink=channel=>String(FREIGHT_CHANNELS.indexOf(channel)+1);
const same=(a,b)=>a.x===b.x&&a.y===b.y;
export function receivedParcels(run,receiver){const counts=run.clockwork?.received;return counts&&Object.hasOwn(counts,receiver.id)?counts[receiver.id]:0;}
export const receiverPowered=(run,receiver)=>receivedParcels(run,receiver)>=receiver.parcels;
export function parcelGateOpen(run,gate){return gate.receivers.every(id=>{const receiver=run.stage.clockworkReceivers.find(r=>r.id===id);return receiver&&receiverPowered(run,receiver);});}
export function freightGoals(run){return (run.stage.clockworkReceivers||[]).filter(r=>r.required).map(r=>({label:`Deliver to ${r.name}: ${receivedParcels(run,r)}/${r.parcels}`,done:receiverPowered(run,r)}));}
export function validateFreight(run,canEnter){
 if(run.stage.clockworkParcels===undefined&&run.stage.clockworkReceivers===undefined)return;
 const sources=run.stage.clockworkParcels,receivers=run.stage.clockworkReceivers;if(!Array.isArray(sources)||!Array.isArray(receivers))throw Error('Parcel stations need source and receiver lists.');
 const stations=[...sources,...receivers],ids=new Set(stations.map(s=>s.id));
 if(!run.clockwork||!Array.isArray(run.stage.clockworkParcels)||!Array.isArray(run.stage.clockworkReceivers)||!sources.length||!receivers.length||sources.length>8||receivers.length>8||ids.size!==stations.length||stations.some(s=>!(/^[a-z][a-z0-9-]{0,39}$/).test(s.id)||typeof s.name!=='string'||!Number.isInteger(s.x)||!Number.isInteger(s.y)||!canEnter(run,s)||!FREIGHT_CHANNELS.includes(s.channel))||receivers.some(r=>!Number.isInteger(r.parcels)||r.parcels<1||r.parcels>3)||sources.some(s=>!receivers.some(r=>r.channel===s.channel))||receivers.some(r=>!sources.some(s=>s.channel===r.channel)))throw Error('Parcel routes need Pip, up to eight sources and receivers on matching channels, and one to three parcels per receiver.');
 run.clockwork.parcel=null;run.clockwork.received={};
}
export function useFreight(run){
 const bot=run.clockwork,source=run.stage.clockworkParcels?.find(s=>same(s,bot)),receiver=run.stage.clockworkReceivers?.find(r=>same(r,bot));if(!source&&!receiver)return null;
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
