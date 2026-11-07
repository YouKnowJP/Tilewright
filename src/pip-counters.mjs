// New owned material. See LICENSE; prior MIT permissions remain effective.
const channels=['amber','jade','violet','blue'];
export function normalizeCounter(raw){
 const {channel,threshold=2,phase=0,duration=1,courier='either'}=raw||{};
 if(!channels.includes(channel)||!['either','pip','sprout'].includes(courier)||!Number.isInteger(threshold)||threshold<1||threshold>6||!Number.isInteger(phase)||phase<0||phase>=threshold||!Number.isInteger(duration)||duration<1||duration>6)throw Error('A Footfall Counter needs a power number, one to six arrivals, fewer starting marks, one to six powered turns, and a courier badge.');
 return {channel,threshold,phase,duration,courier};
}
export function counterArrival(part,record,courier){
 if(part.courier!=='either'&&part.courier!==courier)return null;
 const count=record[0]+1,triggered=count===part.threshold;
 return {record:triggered?[0,Math.max(record[1],part.duration)]:[count,record[1]],triggered};
}
export function counterDescription(part,record){
 const p=normalizeCounter(part),who=p.courier==='either'?'Either courier':p.courier==='pip'?'Pip':'Sprout';
 return `${who} adds a mark by entering. Every ${p.threshold} arrival${p.threshold===1?'':'s'} resets the marks and powers ${channels.indexOf(p.channel)+1} · ${p.channel} for ${p.duration} following turn${p.duration===1?'':'s'}. Starts with ${p.phase} mark${p.phase===1?'':'s'}. Use, Wait and blocked moves do not count.${record?` Now ${record[0]}/${p.threshold}; next turn ${record[1]?'powered':'quiet'}.`:''}`;
}
