// New owned material. See LICENSE; prior MIT permissions remain effective.
const colours=['amber','jade','violet','blue'];
export function normalizeKiln(raw={}){
 const {channel,input,quiet,powered}=raw;
 if(!colours.includes(channel))throw Error('Choose a numbered power channel for the kiln.');
 if(![input,quiet,powered].every(c=>colours.includes(c))||new Set([input,quiet,powered]).size!==3)throw Error('A kiln needs an input and two different output colours.');
 return {channel,input,quiet,powered};
}
export function fireKiln(part,parcel,active){
 const p=normalizeKiln(part);if(typeof active!=='boolean')throw Error('Choose the kiln’s turn-start power state.');
 const bank=active?'Powered':'Quiet',output=active?p.powered:p.quiet;
 return parcel===p.input?{parcel:output,message:`Kiln ${bank} · fired ${p.input} into ${output}`}:{parcel,message:`Kiln ${bank} needs ${p.input}; ${parcel||'empty hands'} kept`};
}
export function kilnDescription(part,active){
 const p=normalizeKiln(part);
 return `Power ${colours.indexOf(p.channel)+1} · ${p.channel}. Use fires ${p.input}: Quiet → ${p.quiet}; Powered → ${p.powered}. Read heat at turn start, before either courier acts. Wrong cargo stays held; Use advances to the next card.${typeof active==='boolean'?` Next turn: ${active?'Powered':'Quiet'}.`:''}`;
}
