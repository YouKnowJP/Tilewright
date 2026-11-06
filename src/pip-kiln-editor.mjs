// New owned material. See LICENSE; prior MIT permissions remain effective.
import {DUO_CHANNELS} from './pip-duo.mjs';
export function createKilnEditor({prefix,anchor,onChange=()=>{}}){
 const element=document.createElement('fieldset');element.id=prefix+'fields';element.innerHTML='<legend>Two recipes, one kiln</legend><p>Use I reads power from the start of the turn. It keeps the card order; the same input becomes the Quiet or Powered output. Windows, held plates/bridges, lanterns, bells, tides and cargo scales supply the matching power number.</p>';const controls={};
 for(const [key,label,value]of [['channel','Power channel','violet'],['input','Kiln input','amber'],['quiet','Quiet output','jade'],['powered','Powered output','blue']]){
  const row=document.createElement('label'),select=document.createElement('select');row.textContent=label;select.id=prefix+key;select.replaceChildren(...DUO_CHANNELS.map((c,i)=>new Option(`${i+1} · ${c}`,c)));select.value=value;select.onchange=onChange;row.append(select);element.append(row);controls[key]=select;
 }
 anchor.after(element);element.hidden=true;
 return {element,value:()=>Object.fromEntries(Object.entries(controls).map(([k,s])=>[k,s.value])),set:part=>{for(const [key,select]of Object.entries(controls))select.value=part[key];}};
}
