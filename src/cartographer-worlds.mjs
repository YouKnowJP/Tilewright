import { blankAdventure, editAdventure, normalizeAdventure } from './workshop-model.mjs';
import { normalizeBook } from './storybook-model.mjs';
import { CARTOGRAPHER_CLEARS } from './cartographer-clears.mjs';
export const CARTOGRAPHER_LEVELS = ['first-turn','counterweight','ink-and-memory','brass-bargain','two-lanterns','atlas-home'];
const titles=['The Room That Remembered North','A Weight on the Horizon','The Ink Remembers','The Brass Bargain','Two Lanterns, One Road','An Atlas for Everyone'];
const passages=[
  'An unfinished atlas arrives at your door. Its author, the cartographer Orin, has drawn every road except the one home. “The island turns,” reads the margin. “Stand beside the brass dial. Let the map show you another way.”',
  'The second page is heavier. A little wooden crate has been drawn so carefully that it leaves a dent in the paper. Orin writes: “Some roads need a change. Others need somebody to leave a helpful thing where it belongs.”',
  'On the next page, ink runs uphill. A small rune remembers footsteps. Somewhere across the water, a keeper has forgotten why she locked the return road. The atlas asks you to help the place remember.',
  'Three brass chests wait in the garden. Orin has written the price on every lid: the treasure is yours, but the garden will wake around it. There is no debt for walking past. The road home belongs to everyone.',
  'Two names appear in the margin: Lantern keeper and Pathfinder. One can wake the lights; the other understands the island’s dial. “I thought being lost meant being alone,” Orin writes. “Perhaps I was only waiting for someone to ask where I wanted to go.”',
  'The last page has room for two sets of footprints. A bell song crosses the river. Orin is waiting beside an unlit lamp, still carrying an empty book. Bring both lights back, invite the cartographer home, and leave the atlas open for the next traveler.',
];
export function cartographerWorld(id,{proof=true}={}) {
  const index=CARTOGRAPHER_LEVELS.indexOf(id);if(index<0)throw Error('Choose a Lost Cartographer chapter.');
  const base=blankAdventure(15,13),map=structuredClone(base.map);map.name=titles[index];
  for(const layer of map.layers)layer.tiles.fill(layer===map.layers[0]?3:0);
  const tile=(x,y,t=1,layer=0)=>map.layers[layer].tiles[y*15+x]=t;
  const land=(x1,y1,x2,y2)=>{for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++)tile(x,y,(x+y)%7===0?2:1);};
  land(1,3,4,10);land(10,3,13,11);
  // A west/north elbow becomes north/east after one clockwise turn.
  for(const [x,y]of [[5,5],[6,5],[7,5],[7,4],[7,3]])tile(x,y,5);
  const markers=[],add=(kind,id,x,y,extra={})=>markers.push({kind,id,x,y,...extra});
  add('start','start',2,5);add('beacon','home',2,6);add('turntable','atlas-dial',7,5,{name:'Atlas room',span:5});
  add('lantern','far-light',12,4);add('coin','ink-drop',3,9);add('coin','paper-star',13,7);
  let storyCards=[],hints={nudge:'The brass dial turns a whole square of the world. A quarter-turn can connect a new shore.',focus:'Stand beside the dial and rotate clockwise. Walk east for the lantern. Turn again from the room when you need a westward road home.',target:'atlas-dial',practice:'rotate'};
  if(index===1||index===5){
    for(let x=10;x<=13;x++)tile(x,8,3);
    add('crate','paper-crate',11,5);add('plate','paper-weight',11,6);add('bridge','paper-span',12,8);
    markers.find(m=>m.id==='far-light').y=10;
    hints={nudge:'A rotating road can get you there. A lasting weight will keep the next crossing open.',focus:'Stand above the crate at column 12, row 5 and push down once onto its plate. Leave it there. The bridge is at column 13, row 9.',target:'paper-crate',practice:'crate'};
  }
  if(index===2||index===5){
    for(let x=4;x<=10;x++)tile(x,9,12);
    add('lever','memory-lever',2,8,{name:'Memory wheel'});add('door','memory-door',7,9,{name:'The way home'});
    if(index===2){
      add('rune','ink-rune',12,7,{name:'The remembered promise'});add('guide','mira',3,7,{name:'Mira',text:'I closed the old road when Orin left. Perhaps his ink can tell us whether he meant to return.'});
      storyCards=[{id:'card-1',when:'visit',source:'ink-rune',effect:'open',target:'memory-lever',text:'The ink remembers your footsteps. Across the water, the return road opens.'},{id:'card-2',when:'switch',source:'memory-lever',effect:'dialogue',target:'mira',text:'Mira smiles. “A promise can be a road, too. You brought his ink home.”'}];
      hints={nudge:'The rune is more than a drawing. Let it remember your footsteps.',focus:'Walk onto the rune at column 13, row 8. It opens the memory wheel’s return door on row 10.',target:'ink-rune',practice:'rotate'};
    }
  }
  if(index===3){
    for(const [n,x,y]of [[1,11,3],[2,12,7],[3,11,10]])add('vault',`vault-${n}`,x,y,{name:`Orin’s vault ${n}`});
    add('supplies','garden-pack',13,10);add('guide','vault-keeper',3,7,{name:'Brass gardener',text:'Every vault is optional. Read its price before opening it. The four marked squares around an opened chest pulse with embers; Plan shows the next pulse. Each chest raises security everywhere. Undo can return a treasure you would rather leave.'});
    hints={...hints,nudge:'The lantern is the mission. The three vaults are a choice you can make on the way.',focus:'You can finish without opening a chest. If you choose treasure, read the nearby-action warning and watch its numbered ember ring in Plan.',target:'vault-1'};
  }
  if(index>=4){
    add('partner','pathfinder',3,7,{name:'Pathfinder'});
    hints={nudge:'Two travelers can wait in different places. Only Pathfinder can turn the dial; only Lantern keeper restores lights.',focus:'Bring Lantern keeper into the room first. Switch to Pathfinder, enter the room, and turn the dial to open the eastern road. Bring both travelers back near the beacon to finish.',target:'atlas-dial',practice:'twin'};
  }
  if(index===5){
    add('lantern','north-light',13,3);add('bell','map-song',11,3,{order:1,name:'Map · note 1'});add('bell','home-song',13,10,{order:2,name:'Home · note 2'});add('rescue','orin',12,6,{name:'Orin',text:'I drew so many possible roads that I forgot a road could belong to someone else. Wake both lights, then come back for me. I would like to draw the way home beside you.'});
    storyCards=[{id:'card-1',when:'bells',source:'',effect:'open',target:'memory-lever',text:'Map, then Home. The last page unfolds into a return crossing for both travelers.'},{id:'card-2',when:'rescue',source:'orin',effect:'message',target:'',text:'Orin closes the empty book. “An atlas is a promise to leave room for another person’s road.”'}];
  }
  for(const marker of markers){if(!['bridge','door'].includes(marker.kind))tile(marker.x,marker.y,marker.kind==='rune'?5:1);}
  for(const [x,y]of [[1,3],[4,10],[10,11],[13,11]])tile(x,y,10,1);
  const intro=[
    'Turn the atlas room clockwise to connect the eastern shore. Restore its lantern, then find the room’s western exit and return to the beacon. The dashed square marks everything that turns. Undo is always available.',
    'Cross the rotating room. Push the far-bank crate down once onto its plate, then cross the pressure bridge to restore the lantern. Leave the crate where it helps the return journey.',
    'Cross the turning room, restore the lantern, and step onto the ink rune. It remembers your visit, opens a return road, and changes Mira’s story. Return by either road.',
    'Restore the far-bank lantern and return. Three optional vaults offer increasing treasure and visible security. Every opened vault adds a four-cell ember ring. Read its warning first; Plan costs no turn.',
    'Play alone by switching travelers, or share the controls with a friend. Lantern keeper restores lights; Pathfinder turns rooms. Both can walk, push, and hold plates. Switch freely without spending a turn. Bring both to the beacon.',
    'Bring both travelers through the atlas room, weight the bridge, ring Map then Home, and restore both lights. Return for Orin, then lead everyone home by the remembered crossing. Both travelers must reach the beacon’s neighborhood.',
  ][index];
  const pack=editAdventure(base,{title:titles[index],author:'Lantern Trails',description:['A living-map lesson','A rotating road and a lasting weight','A reactive world with a remembered promise','An optional three-vault heist','Peaceful shared-device cooperation','A cooperative rescue and a road you create'][index],source:'Lost Cartographer original',theme:['archive','coast','woodland','forge','aurora','clockwork'][index],map,markers,intro,hint:hints.focus,hints,storyCards,par:[32,44,40,32,44,88][index],ending:index===5?'Orin opens the atlas on a clean page. He draws two lanterns beside the beacon, and leaves the road unfinished. “For whoever comes next,” he says. The map has finally found its way home.':'Another page finds its place in the atlas. The road you changed stays bright behind you.'});
  return normalizeAdventure({...pack,...(proof&&CARTOGRAPHER_CLEARS[id]?{proof:{difficulty:'trail',actions:CARTOGRAPHER_CLEARS[id]}}:{})});
}
export function cartographerBook(){return normalizeBook({title:'The Lost Cartographer',author:'Lantern Trails',synopsis:'Six original chapters of living-map puzzles, playable clues, reactive stories, optional vault heists, and peaceful Two-Lantern cooperation. Play alone or share one device.',ending:'The atlas belongs to the roads people make together. Try another treasure route, return with a friend, or remix a chapter into a world of your own.',chapters:CARTOGRAPHER_LEVELS.map((id,i)=>({world:cartographerWorld(id),passage:passages[i]}))});}
export function hintPractice(kind) {
  const base=blankAdventure(9,9),map=structuredClone(base.map);map.name='A little idea';const markers=[],add=(kind,id,x,y,extra={})=>markers.push({kind,id,x,y,...extra});
  const tile=(x,y,t=1)=>{map.layers[0].tiles[y*9+x]=t;map.layers[1].tiles[y*9+x]=0;};
  let intro;
  add('start','start',2,4);add('beacon','home',2,3);add('lantern','light',6,4);
  if(kind==='rotate'){
    for(const layer of map.layers)layer.tiles.fill(layer===map.layers[0]?3:0);
    for(const [x,y]of [[1,3],[1,4],[2,3],[2,4],[3,4],[4,4],[4,3],[6,3],[6,4],[6,5],[5,4]])tile(x,y);
    tile(5,4,3);add('turntable','little-dial',4,4,{span:3,name:'Practice dial'});
    intro='Walk right beside the dial. Turn it clockwise, take the eastern light, and turn again to find the western way home. Everything inside the dashed square turns together.';
  }else{
    for(let y=1;y<8;y++)tile(4,y,3);
    if(kind==='bells'){
      add('signal','song-door',4,4);add('bell','one',2,2,{order:1,name:'First note'});add('bell','two',2,6,{order:2,name:'Second note'});
      intro='Ring First note, then Second note from a neighboring square. Cross the opened song door, take the light, and return.';
    }else{
      add('plate','weight',3,5);add('bridge','span',4,4);
      if(kind==='twin'){add('partner','partner',2,5);intro='Switch to Pathfinder and leave them on the plate at column 4, row 6. Switch back to Lantern keeper, cross the bridge, and restore the light. Bring both travelers beside the beacon.';}
      else{add('crate','crate',2,5);intro='Stand at column 2, row 6 and push the crate right onto the plate at column 4, row 6. Leave it there. Cross, collect the light, and return.';}
    }
  }
  return editAdventure(base,{title:'Try a little idea',map,markers,intro,ending:'You found the idea. Return to your adventure whenever you are ready.',par:100,theme:'archive'});
}
