// New owned material. See LICENSE; prior MIT permissions remain effective.
import {DUO_CHANNELS} from './pip-duo.mjs';
import {duoBlueprintLinks,rewireDuoBlueprint,unusedDuoBlueprintLinks} from './pip-blueprint-links.mjs';
const label=c=>`${DUO_CHANNELS.indexOf(c)+1} · ${c[0].toUpperCase()+c.slice(1)}`;
export function createBlueprintLinks({dialog,getProject,getMode,stop,notice,onChange}){
 const panel=document.createElement('details');panel.id='ps-bp-links';panel.innerHTML='<summary>Reconnect tubes &amp; lockers</summary><p>Change connection numbers without changing parcels, recipes or signals. Both ends move together. Different connections inside a piece keep separate numbers. Manual choices can join links already in the garden.</p><div id="ps-bp-link-rows"></div><div class="ps-actions"><button id="ps-bp-unused-links">Use unused connections</button><button id="ps-bp-reset-links">Restore piece connections</button></div><p id="ps-bp-link-note" role="status"></p>';
 dialog.querySelector('#ps-bp-arrange').after(panel);const rows=panel.querySelector('#ps-bp-link-rows'),note=panel.querySelector('#ps-bp-link-note');let signature='',mapping={tube:{},locker:{}},base=null,links=[];
 function sync(){for(const select of rows.querySelectorAll('select'))select.value=mapping[select.dataset.kind][select.dataset.channel];}
 function reset(){signature='';mapping={tube:{},locker:{}};base=null;}
 function apply(piece){
  base=piece;links=duoBlueprintLinks(piece);panel.hidden=!links.length;const key=JSON.stringify(links);
  if(key!==signature){signature=key;mapping={tube:{},locker:{}};rows.replaceChildren();for(const link of links){mapping[link.kind][link.channel]=link.channel;const line=document.createElement('label'),select=document.createElement('select');line.textContent=`${link.kind==='tube'?'Tube U':'Locker K'}${label(link.channel)} · ${link.ends} ${link.ends===1?'end':'ends'} →`;select.id=`ps-bp-link-${link.kind}-${link.channel}`;select.dataset.kind=link.kind;select.dataset.channel=link.channel;select.replaceChildren(...DUO_CHANNELS.map(c=>new Option(label(c),c)));select.value=link.channel;select.onchange=()=>{if(getMode()!=='build')return;stop();mapping[link.kind][link.channel]=select.value;onChange();};line.append(select);rows.append(line);}}
  note.textContent=links.map(l=>`${l.kind==='tube'?'U':'K'}${DUO_CHANNELS.indexOf(l.channel)+1} → ${label(mapping[l.kind][l.channel])}`).join(' · ')+'. Parcel colours stay as designed.';return rewireDuoBlueprint(piece,mapping);
 }
 panel.querySelector('#ps-bp-unused-links').onclick=()=>{if(getMode()!=='build'||!base)return;stop();try{mapping=unusedDuoBlueprintLinks(getProject(),base);sync();onChange();notice('Unused connection numbers chosen for this piece. Place at cursor when ready.');}catch(error){notice(error.message);}};
 panel.querySelector('#ps-bp-reset-links').onclick=()=>{if(getMode()!=='build'||!base)return;stop();for(const l of links)mapping[l.kind][l.channel]=l.channel;sync();onChange();notice('Piece connections restored.');};
 return {apply,reset};
}
