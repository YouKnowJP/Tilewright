// New owned material. See LICENSE; prior MIT permissions remain effective.
import {DUO_CHANNELS} from './pip-duo.mjs';
export function createDrumEditor({prefix,anchor,onChange=()=>{}}){
 const element=document.createElement('fieldset');element.id=prefix+'fields';element.innerHTML='<legend>Memory Drum D</legend><p>Record a power beat now and repeat it later on another number. The drum starts quiet. It reads sources at turn start, including Weave outputs; other drums do not feed it. No Use is needed.</p>';const controls={};
 for(const[key,label,value]of[['input','Recorded power source','amber'],['channel','Drum output','jade'],['delay','Repeat after','2']]){const row=document.createElement('label'),select=document.createElement('select');row.textContent=label;select.id=prefix+key;select.replaceChildren(...(key==='delay'?Array.from({length:6},(_,i)=>new Option(`${i+1} turn${i?'s':''}`,String(i+1))):DUO_CHANNELS.map((c,i)=>new Option(`${i+1} · ${c}`,c))));select.value=value;select.onchange=onChange;row.append(select);element.append(row);controls[key]=select;}
 anchor.after(element);element.hidden=true;return {element,value:()=>({input:controls.input.value,channel:controls.channel.value,delay:Number(controls.delay.value)}),set:part=>{for(const[key,s]of Object.entries(controls))s.value=String(part[key]);}};
}
