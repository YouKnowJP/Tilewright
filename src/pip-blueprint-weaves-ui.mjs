// New owned material. See LICENSE; prior MIT permissions remain effective.
import {createWeaveEditor} from './pip-weave-editor.mjs';
import {weaveDescription} from './pip-weaves.mjs';
import {blueprintWeaveStations,rewriteBlueprintWeave,cycleBlueprintWeave} from './pip-blueprint-weaves.mjs';
export function createBlueprintWeaves({dialog,getMode,stop,notice,onChange}){
 const panel=document.createElement('details');panel.id='ps-bp-weaves';panel.innerHTML='<summary>Compose relay circuits</summary><p>Experiment with each relay before placing the piece. These edits keep recipes, route cards and saved blueprints intact. Whole-piece power wiring applies afterward.</p><label>Relay in this piece<select id="ps-bp-weave-station"></select></label><div id="ps-bp-weave-anchor"></div><div class="ps-actions"><button id="ps-bp-weave-copy">Use this rule for all relays</button><button id="ps-bp-weave-cycle">Cycle this relay’s numbers</button><button id="ps-bp-weave-restore">Restore this relay</button><button id="ps-bp-weave-reset">Restore all relay edits</button></div><p id="ps-bp-weave-note" role="status"></p>';dialog.querySelector('#ps-bp-power').before(panel);
 const $=id=>panel.querySelector('#ps-bp-weave-'+id);let signature='',stations=[],edits={},selected=0,source;
 const editor=createWeaveEditor({prefix:'ps-bp-weave-edit-',anchor:$('anchor'),onChange:()=>change(()=>{const patch=editor.value();rewriteBlueprintWeave(source,selected,patch);edits[selected]=patch;})});editor.element.hidden=false;
 const current=()=>({...stations.find(s=>s.index===selected),...edits[selected]});
 function render(){if(!stations.length)return;const s=current();editor.set(s);$('copy').disabled=getMode()!=='build'||stations.length<2;$('note').textContent=weaveDescription(s)+' '+Object.keys(edits).length+' relay edits in this preview. Keep or place when ready.';}
 function change(action){if(getMode()!=='build'||!stations.length)return;stop();try{action();onChange();}catch(error){notice(error.message);render();}}
 function reset(){signature='';edits={};}
 function apply(piece){source=piece;stations=blueprintWeaveStations(piece);panel.hidden=!stations.length;const key=JSON.stringify(stations);if(key!==signature){signature=key;edits={};selected=stations[0]?.index??0;$('station').replaceChildren(...stations.map(s=>new Option(`W · column ${s.x+1}, row ${s.y+1}`,String(s.index))));$('station').value=String(selected);}render();let result=piece;for(const [index,patch]of Object.entries(edits))result=rewriteBlueprintWeave(result,Number(index),patch);return result;}
 $('station').onchange=()=>{if(getMode()!=='build')return;stop();selected=Number($('station').value);render();};
 $('copy').onclick=()=>change(()=>{const rule=current().rule;for(const s of stations)edits[s.index]={...edits[s.index],rule};});
 $('cycle').onclick=()=>change(()=>{const p=rewriteBlueprintWeave(source,selected,edits[selected]||{});const s=cycleBlueprintWeave(p,selected).parts[selected];edits[selected]={first:s.first,second:s.second,channel:s.channel,rule:s.rule};});
 $('restore').onclick=()=>change(()=>{delete edits[selected];});$('reset').onclick=()=>change(()=>{edits={};notice('Relay edits restored. Other blueprint tools stay as set.');});return {apply,reset};
}
