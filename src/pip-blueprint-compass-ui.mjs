// New owned material. See LICENSE; prior MIT permissions remain effective.
import {CLOCKWORK_COMMANDS,CLOCKWORK_LABELS} from './clockwork.mjs';
import {VANE_LABELS} from './pip-vanes.mjs';
import {blueprintCompassStations,rewriteBlueprintCompass,flipBlueprintCorners,swapBlueprintMirrors,alternateBlueprintCorners,compassProgramPreview} from './pip-blueprint-compass.mjs';

export function createBlueprintCompass({dialog,getMode,stop,onChange}){
 const panel=document.createElement('details');panel.id='ps-bp-compass';
 panel.innerHTML='<summary>Shape turns &amp; mirrors</summary><p>Set how a prism or Wind Vane changes cards. Coordinates refer to the original piece. Facing, reflection and repeated copies apply afterward.</p><label>Compass station<select id="ps-bp-compass-station"></select></label><label>Card change<select id="ps-bp-compass-operation"></select></label><div class="ps-actions"><button id="ps-bp-compass-copy">Match this kind</button><button id="ps-bp-compass-flip">Swap left and right turns</button><button id="ps-bp-compass-mirror">Swap mirror axes</button><button id="ps-bp-compass-alternate">Alternate right and left</button><button id="ps-bp-compass-restore">Restore this station</button><button id="ps-bp-compass-reset">Restore all compass edits</button></div><details id="ps-bp-compass-example"><summary>Try three example cards</summary><p>Try the selected station in isolation. Rehearse the garden to check a whole route.</p><fieldset id="ps-bp-compass-cards"><legend>Example cards</legend></fieldset><label>Card at the station<select id="ps-bp-compass-entry"></select></label><p id="ps-bp-compass-result" role="status"></p></details>';
 dialog.querySelector('#ps-bp-cards').after(panel);
 const $=id=>panel.querySelector('#ps-bp-compass-'+id),cards=[];
 let signature='',source,configured,stations=[],selected=0,edits=new Map();
 const current=()=>configured?.parts[selected];
 $('operation').replaceChildren(...Object.entries(VANE_LABELS).map(([v,label])=>new Option(label,v)));
 $('entry').replaceChildren(...[1,2,3].map((n,i)=>new Option('Card '+n,String(i))));
 for(let i=0;i<3;i++){
  const label=document.createElement('label'),select=document.createElement('select');label.textContent='Card '+(i+1);select.id='ps-bp-compass-card-'+i;
  select.replaceChildren(...CLOCKWORK_COMMANDS.map(c=>new Option(CLOCKWORK_LABELS[c],c)));select.onchange=example;cards.push(select);label.append(select);$('cards').append(label);
 }
 function example(){if(!current())return;const result=compassProgramPreview(configured,selected,cards.map(s=>s.value),{enteredAt:Number($('entry').value)});const label=a=>a.map(c=>CLOCKWORK_LABELS[c]).join(' / ');$('result').textContent=result.triggers?`${label(result.before)} → ${label(result.after)}. Next: card ${result.next+1}. ${result.note}`:result.note;}
 function render(){const s=current();if(!s)return;$('operation').value=s.operation;const peers=configured.parts.filter(p=>p.kind===s.kind),build=getMode()==='build';$('copy').disabled=!build||peers.length<2;$('alternate').disabled=!build||peers.length<2;$('flip').disabled=!build||!peers.some(p=>p.operation==='rotate'||p.operation==='rotate-left');$('mirror').disabled=!build||!peers.some(p=>p.operation==='mirror'||p.operation==='mirror-y');$('restore').disabled=!build||!edits.has(selected);$('reset').disabled=!build||!edits.size;example();}
 function defaults(){cards.forEach((s,i)=>{s.value=i===2?'use':'right';});$('entry').value='0';}
 function reset(){signature='';edits=new Map();defaults();}
 function apply(piece){source=piece;stations=blueprintCompassStations(piece);panel.hidden=!stations.length;const key=JSON.stringify(stations);if(key!==signature){signature=key;edits=new Map();selected=stations[0]?.index??0;$('station').replaceChildren(...stations.map(s=>new Option(`${s.kind==='vane'?'Vane F':'Prism X'} · ${s.x+1}, ${s.y+1}`,String(s.index))));$('station').value=String(selected);}configured=piece;for(const[i,operation]of edits)configured=rewriteBlueprintCompass(configured,i,{operation});if(stations.length)render();return configured;}
 function edit(action){if(getMode()!=='build'||!current())return;stop();action();onChange();}
 function adopt(next){edits=new Map(stations.flatMap(({index})=>next.parts[index].operation===source.parts[index].operation?[]:[[index,next.parts[index].operation]]));}
 $('station').onchange=()=>{if(getMode()!=='build')return;stop();selected=Number($('station').value);render();};$('entry').onchange=example;
 $('operation').onchange=()=>edit(()=>adopt(rewriteBlueprintCompass(configured,selected,{operation:$('operation').value})));
 $('copy').onclick=()=>edit(()=>adopt(rewriteBlueprintCompass(configured,selected,{operation:current().operation},{all:true})));
 for(const [id,fn]of[['flip',flipBlueprintCorners],['mirror',swapBlueprintMirrors],['alternate',alternateBlueprintCorners]])$(id).onclick=()=>edit(()=>adopt(fn(configured,{kind:current().kind})));
 $('restore').onclick=()=>edit(()=>edits.delete(selected));$('reset').onclick=()=>edit(()=>edits.clear());defaults();
 return {apply,reset};
}
