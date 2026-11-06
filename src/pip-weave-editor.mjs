// New owned material. See LICENSE; prior MIT permissions remain effective.
import {DUO_CHANNELS} from './pip-duo.mjs';
import {WEAVE_RULES,weaveTruthTable} from './pip-weaves.mjs';
export function createWeaveEditor({prefix,anchor,onChange=()=>{}}){
 const element=document.createElement('fieldset');element.id=prefix+'fields';element.innerHTML='<legend>Weave two sources</legend><p>W runs automatically. It reads both source numbers at turn start. Physical power and filled window groups count; other relay or drum outputs do not. Choose a separate output number for bridges, signs or kilns.</p>';const controls={};
 for(const [key,label,value]of [['first','Power source A','amber'],['second','Power source B','jade'],['channel','Relay output','violet'],['rule','Relay rule','both']]){
  const row=document.createElement('label'),select=document.createElement('select');row.textContent=label;select.id=prefix+key;select.replaceChildren(...(key==='rule'?Object.entries(WEAVE_RULES).map(([v,t])=>new Option(t,v)):DUO_CHANNELS.map((c,i)=>new Option(`${i+1} · ${c}`,c))));select.value=value;select.onchange=()=>{onChange();render();};row.append(select);element.append(row);controls[key]=select;
 }
 const table=document.createElement('table');table.id=prefix+'truth';table.className='ps-weave-truth';table.innerHTML='<caption>When will the output be powered?</caption><thead><tr><th scope="col">A</th><th scope="col">B</th><th scope="col">Power</th></tr></thead><tbody></tbody>';element.append(table);anchor.after(element);element.hidden=true;
 const value=()=>Object.fromEntries(Object.entries(controls).map(([k,s])=>[k,s.value]));
 function render(){const body=table.tBodies[0];try{body.replaceChildren(...weaveTruthTable(value()).map(r=>{const row=document.createElement('tr');for(const [i,text]of [r.first?'On':'Off',r.second?'On':'Off',r.output?'On':'Off'].entries()){const cell=document.createElement('td');cell.textContent=text;if(i===2)cell.setAttribute('aria-label',r.output?'Powered':'Quiet');row.append(cell);}return row;}));}catch{body.replaceChildren();}table.hidden=!body.children.length;}
 render();return {element,value,set:part=>{for(const [key,select]of Object.entries(controls))select.value=part[key];render();}};
}
