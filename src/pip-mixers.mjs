// New owned material. See LICENSE; prior MIT permissions remain effective.
const colours=['amber','jade','violet','blue'];
export function normalizeMixer(raw={}){
 const {channel,second,output}=raw;
 if(![channel,second,output].every(c=>colours.includes(c))||new Set([channel,second,output]).size!==3)throw Error('A mixing bowl needs two different ingredients and a third output colour.');
 return {channel,second,output};
}
export function mixerDescription(part,stored=null){
 const p=normalizeMixer(part),recipe=`${p.channel} + ${p.second} → ${p.output}`;
 return `Use mixes ${recipe}. Either ingredient can go first. The bowl keeps the first parcel; the courier adding the other carries the result. ${stored?`Holding ${stored}; add ${stored===p.channel?p.second:p.channel}.`:'Bowl empty.'} Empty hands and wrong ingredients leave everything safe. Cards keep their place.`;
}
export function useMixer(part,stored,parcel){
 const p=normalizeMixer(part),ingredients=[p.channel,p.second],held=stored??null;
 if(held!==null&&!ingredients.includes(held))throw Error('A bowl can hold only one of its recipe ingredients.');
 const missing=held===p.channel?p.second:p.channel;
 if(!parcel)return {stored:held,parcel:null,message:held?`Bowl holds ${held}; bring ${missing}`:`Bowl needs ${p.channel} + ${p.second}`};
 if(!ingredients.includes(parcel))return {stored:held,parcel,message:`Wrong ingredient; ${parcel} kept · needs ${held?missing:p.channel+' or '+p.second}`};
 if(!held)return {stored:parcel,parcel:null,message:`Left ${parcel} in bowl · add ${parcel===p.channel?p.second:p.channel}`};
 if(parcel===held)return {stored:held,parcel,message:`Bowl already holds ${held}; ${parcel} kept · add ${missing}`};
 return {stored:null,parcel:p.output,message:`Mixed ${p.channel} + ${p.second} into ${p.output}`};
}
