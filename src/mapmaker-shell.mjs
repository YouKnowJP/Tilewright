import { drawTile } from './render.mjs';
export function createMapmakerShell({ onWorkshop, onUseTerrain, onGuide }) {
  const $=id=>document.getElementById(id),palette=document.querySelector('.palette-panel'),settings=document.querySelector('.inspector'),host=document.querySelector('.workspace'),compact=matchMedia('(max-width:1100px)');
  const paletteDialog=$('maker-palette-dialog'),settingsDialog=$('maker-settings-dialog');
  let pickedTile=false;
  function close(){for(const dialog of [paletteDialog,settingsDialog])if(dialog.open)dialog.close();}
  function place(){close();if(compact.matches){paletteDialog.append(palette);settingsDialog.append(settings);}else{host.prepend(palette);host.append(settings);}}
  $('maker-palette-button').onclick=()=>paletteDialog.showModal();$('maker-settings-button').onclick=()=>settingsDialog.showModal();
  $('maker-palette-close').onclick=() => paletteDialog.close();$('maker-settings-close').onclick=()=>settingsDialog.close();
  palette.addEventListener('click',event=>{if(event.target.closest('.tile-button')&&paletteDialog.open){pickedTile=true;paletteDialog.close();}});
  for(const [dialog,button]of [[paletteDialog,'maker-palette-button'],[settingsDialog,'maker-settings-button']])dialog.addEventListener('close',()=>{if(dialog===paletteDialog&&pickedTile){pickedTile=false;$('map').focus({preventScroll:true});return;}if(!$('editor').hidden&&$(button).getClientRects().length)$(button).focus({preventScroll:true});});
  $('maker-workshop').onclick=()=>{close();onWorkshop();};$('maker-use-terrain').onclick=()=>{close();onUseTerrain();};
  for(const id of ['maker-guide','maker-guide-wide'])$(id).onclick=()=>onGuide($(id));
  compact.addEventListener('change',place);place();
  const ctx=$('maker-map-emblem').getContext('2d');ctx.imageSmoothingEnabled=false;drawTile(ctx,1,0,0,40);drawTile(ctx,8,0,0,40);
  return { close };
}
