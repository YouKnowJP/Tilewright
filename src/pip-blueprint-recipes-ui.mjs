// New owned material. See LICENSE; prior MIT permissions remain effective.
import {DUO_CHANNELS} from './pip-duo.mjs';
import {blueprintParcelColours,recolourBlueprintParcels} from './pip-blueprint-recipes.mjs';
export function createBlueprintRecipes({dialog,getMode,stop,notice,onChange}){
 const panel=document.createElement('details');panel.id='ps-bp-recipes';panel.innerHTML='<summary>Remix parcel colours</summary><p>Swap ingredients, windows and cargo checks in the preview. Power circuits, tube pairs and locker links keep their numbers. Route cards and the garden stay as they are until placement.</p><div class="ps-pickers"><label>Swap parcel<select id="ps-bp-parcel-from"></select></label><label>With parcel<select id="ps-bp-parcel-to"></select></label></div><div class="ps-actions"><button id="ps-bp-parcel-swap">Swap these colours</button><button id="ps-bp-parcel-reset">Restore original parcels</button></div><p id="ps-bp-parcel-note" role="status"></p>';dialog.querySelector('#ps-bp-cards').after(panel);
 const $=id=>panel.querySelector('#ps-bp-parcel-'+id),identity=()=>Object.fromEntries(DUO_CHANNELS.map(c=>[c,c]));let signature='',palette=identity(),colours=[];
 for(const id of ['from','to'])$(id).replaceChildren(...DUO_CHANNELS.map((c,i)=>new Option(`${i+1} · ${c}`,c)));$('to').value='jade';
 function reset(){signature='';palette=identity();}
 function render(){const changed=DUO_CHANNELS.filter(c=>palette[c]!==c);$('note').textContent=changed.length?'Parcel preview · '+colours.map(c=>`${c} → ${palette[c]}`).join(' · ')+'. Keep or download to reuse.':'Original parcel colours. Swaps affect the blueprint preview only.';$('swap').disabled=getMode()!=='build'||$('from').value===$('to').value;$('reset').disabled=getMode()!=='build'||!changed.length;}
 function apply(piece,source=piece){colours=blueprintParcelColours(piece);panel.hidden=!colours.length;const key=JSON.stringify(source.parts);if(key!==signature){signature=key;palette=identity();}render();return recolourBlueprintParcels(piece,palette);}
 for(const id of ['from','to'])$(id).onchange=render;
 $('swap').onclick=()=>{if(getMode()!=='build'||$('from').value===$('to').value)return;stop();const a=$('from').value,b=$('to').value;palette=Object.fromEntries(DUO_CHANNELS.map(c=>[c,palette[c]===a?b:palette[c]===b?a:palette[c]]));onChange();};
 $('reset').onclick=()=>{if(getMode()!=='build')return;stop();palette=identity();onChange();notice('Original blueprint parcels restored. The garden is unchanged.');};
 return {apply,reset};
}
