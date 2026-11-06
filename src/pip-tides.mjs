// New owned material. See LICENSE; prior MIT permissions remain effective.
export function normalizeTide(raw={}){
 const {period=4,beats=2,offset=0}=raw;
 if(!Number.isInteger(period)||period<2||period>8||!Number.isInteger(beats)||beats<1||beats>=period||!Number.isInteger(offset)||offset<0||offset>=period)throw Error('A tide needs 2–8 beats, at least one open and one closed beat, and a phase inside its cycle.');
 return {period,beats,offset};
}
export function tidePhase(part,turn=1){const p=normalizeTide(part);if(!Number.isSafeInteger(turn)||turn<1)throw Error('Choose a positive tide turn.');return ((turn-1)%p.period+p.offset)%p.period;}
export function tideOpen(part,turn=1){return tidePhase(part,turn)<normalizeTide(part).beats;}
export function tideStrip(part,turn=1,count=8){if(!Number.isInteger(count)||count<1||count>24)throw Error('Preview one to twenty-four tide beats.');return Array.from({length:count},(_,i)=>({turn:turn+i,open:tideOpen(part,turn+i),phase:tidePhase(part,turn+i)+1}));}
export function tideDescription(part,turn=1){const p=normalizeTide(part);return `${p.beats} open of ${p.period} beats · phase ${tidePhase(p,turn)+1}/${p.period} · tick ${turn} ${tideOpen(p,turn)?'open':'closed'}`;}
