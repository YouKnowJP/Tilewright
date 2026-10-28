import { blankAdventure,editAdventure,normalizeAdventure } from './workshop-model.mjs';
import { normalizeBook } from './storybook-model.mjs';

export const LANTERNFAIR_LEVELS=Object.freeze(['pattern','ribbons','fitting-song','parade']);
const titles=['The Buttonmaker’s Shortcut','A River of Ribbon','The Bellmaker’s Fitting Room','The Lanternfair Parade'];
const passages=[
  'A letter arrives stitched shut with a golden thread. “Come as yourself,” writes Jun, the Lanternfair’s buttonmaker. “Bring whatever colors feel like home.” There is no uniform for this festival. But its old pattern book is beyond a locked crossing, and the first lamps are waiting. Jun has left a spare key in the northern garden. Visit the Traveler’s Tent whenever you want a different look; no road will hurry you.',
  'The pattern book contains a map of the dyehouse river. Ribbons once traveled over its bridge, bright enough to guide the boats home. Today the bridge waits for a counterweight. Tavi has found a crate and a wheelbarrow full of patient ideas. “A useful thing can be beautiful,” she says. Leave the crate where the bridge needs it. Bring the far-bank lights into the parade.',
  'At the fitting room, three bells keep the old fairground doors shut. Jun remembers their words: Road, Rain, Home. Tavi remembers the order. You have the walking to do. Nobody must judge a color by its name; the song is written in your Quest notes. Ring the numbered bells, find the two lamps, and leave room in the melody for the traveler you chose to become.',
  'Every coat in the square looks different. Some travelers carry gold lamps; others bring rose, mint, or a pocketful of borrowed starlight. Iris has stayed across the last river with the parade’s singing heart. The bridge needs a weight, the two lanterns need a keeper, and Iris needs someone to ask her home. The fair begins when the last person arrives.',
];
export function lanternfairWorld(id) {
  const index=LANTERNFAIR_LEVELS.indexOf(id);if(index<0)throw Error('Choose a known Lanternfair chapter.');
  const width=18,height=12,base=blankAdventure(width,height),map=base.map,markers=[];
  map.name=titles[index];map.layers[0].tiles.fill(1);map.layers[1].tiles.fill(0);
  const tile=(x,y,value,layer=0)=>{map.layers[layer].tiles[y*width+x]=value;};
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(!x||!y||x===width-1||y===height-1)tile(x,y,7,1);
  const add=(kind,id,x,y,extra={})=>markers.push({kind,id,x,y,...extra});
  const crossing=(x,y)=>{for(let row=1;row<height-1;row++)tile(x,row,3);tile(x,y,12);};
  add('start','start',2,9);add('beacon','fair-home',2,10);
  let intro,hint,ending;
  if(index===0){
    crossing(9,6);add('gate','pattern-lock',9,6);add('key','pattern-key',4,3);add('lantern','pattern-north',13,3);add('lantern','pattern-south',15,8);
    add('coin','gold-button',5,2);add('coin','shell-button',13,9);add('coin','star-button',15,4);
    add('guide','jun',3,8,{name:'Jun the buttonmaker',text:'Come as yourself. Your traveler’s tent is in Options: choose a coat, scarf, hairstyle, headwear, and lantern. Looks are free and never change a puzzle. Find the spare key north of us. The gate stays open after you use it.'});
    intro='Find the key in the north garden, unlock the crossing, and restore both pattern-house lanterns. Return to the beacon. Three scattered buttons are optional treasure. Your traveler’s tent is always in Options.';
    hint='Key: column 5, row 4. Crossing: column 10, row 7. Lamps: column 14, row 4 and column 16, row 9. Beacon: column 3, row 11.';
    ending='Jun unfolds the pattern book. Every page has a different traveler sketched in its margin. The last is blank. “That one is yours,” she says. “You can change it as often as you like.”';
  }else if(index===1){
    crossing(9,5);add('bridge','ribbon-span',9,5);add('plate','ribbon-weight',6,5);add('crate','ribbon-crate',5,5);add('lantern','dyehouse-north',13,3);add('lantern','dyehouse-south',14,8);
    add('coin','spool-one',4,2);add('coin','spool-two',15,4);add('coin','spool-three',13,9);
    add('guide','tavi',3,7,{name:'Tavi the ribbon keeper',text:'Stand to the left of the crate and push it right onto the plate. Go around it using the row above. Leave it there; you need the bridge on the way home too. Undo is a good friend when a push goes somewhere unexpected.'});
    intro='Push the ribbon crate onto its pressure plate. Walk around it, restore both dyehouse lamps, and return over the bridge. Three ribbon spools are optional. The bridge is numbered to match its plate.';
    hint='Stand at column 5, row 6 and push right once. The plate is at column 7, row 6. Walk around above the crate to the crossing at column 10, row 6. Leave the weight in place.';
    ending='Tavi ties the first ribbon to the bridge. It is not a gate or a prize. It is simply a bright thing that says somebody made a way here. The river carries its reflection toward the fair.';
  }else if(index===2){
    crossing(9,6);add('signal','fitting-door',9,6);add('bell','road',4,3,{name:'Road · note 1',order:1});add('bell','rain',7,8,{name:'Rain · note 2',order:2});add('bell','home',5,5,{name:'Home · note 3',order:3});add('lantern','fitting-north',13,3);add('lantern','fitting-south',14,8);
    add('coin','silver-thread',3,2);add('coin','violet-thread',15,3);add('coin','green-thread',15,9);
    add('guide','jun-song',3,7,{name:'Jun',text:'Road, Rain, Home. Ring the bells in that order from a neighboring square. A wrong note starts the song again, without hurting you. The words and numbers matter; you never need to tell colors apart.'});
    intro='Ring Road (1), Rain (2), then Home (3) to open the fitting-room crossing. Restore both lamps and return. Quest keeps the song written down. No enemy or timed hazard is waiting.';
    hint='Road: column 5, row 4. Rain: column 8, row 9. Home: column 6, row 6. Ring from a neighboring square. Cross at column 10, row 7 after the third correct note.';
    ending='The fitting-room door opens on an ordinary garden. Jun laughs. “All this time, I thought the room would tell us who to be.” Tavi lifts a lantern. “Perhaps it only needed to let us through.”';
  }else{
    crossing(8,6);add('bridge','parade-span',8,6);add('plate','parade-weight',5,6);add('crate','parade-crate',4,6);add('lantern','parade-north',12,3);add('lantern','parade-south',15,8);add('relic','parade-heart',12,8,{name:'The parade’s singing heart'});
    add('rescue','iris',13,5,{name:'Iris',text:'I wanted to bring a light that looked like mine. I thought the fair might not have room for it. You have come all this way in your own colors. Let me walk home beside you.'});
    add('guide','tavi-finale',3,4,{name:'Tavi',text:'The crate needs one push to the right. Leave it on its plate, restore both far-bank lights, and invite Iris home. Take the singing heart from a neighboring square. The bridge will wait for everyone.'});
    add('coin','parade-flower',5,2);add('coin','parade-shell',15,3);add('coin','parade-star',15,9);
    intro='Leave the crate on the plate, restore both far-bank lights, and speak to Iris to invite her home. Take the singing heart from a neighboring square and bring it to the beacon. Every traveler belongs in this parade.';
    hint='Push right from column 4, row 7; go around above the crate. Crossing: column 9, row 7. Iris: column 14, row 6. Heart: column 13, row 9. Restore both lamps before inviting Iris.';
    ending='The parade has no leader and no matching coats. Iris walks beside you. Jun rings the first bell; Tavi answers with a ribbon. The singing heart finds a place among all the different lanterns. Nobody asks you to change. Tomorrow you might try another look, another road, or a fair of your own. Tonight, the road has room for everyone.';
  }
  // Paths, flower beds, and distinct garden shapes give each stop its own silhouette.
  for(let x=1;x<width-1;x++)if(map.layers[0].tiles[6*width+x]!==3)tile(x,6,5);
  for(let y=1;y<height-1;y++)for(const x of [2,14])if(map.layers[0].tiles[y*width+x]!==3)tile(x,y,5);
  for(let x=2;x<width-2;x+=3)for(const y of [1,10])tile(x,y,10,1);
  if(index===0)for(const y of [2,3,4,7,8])tile(6,y,8,1);
  if(index===1)for(let y=5;y<=6;y++)for(let x=12;x<=14;x++)tile(x,y,3);
  if(index===2){for(let x=11;x<=15;x++)for(const y of [2,5])if(x!==12)tile(x,y,8,1);for(const x of [11,15])for(const y of [3,4])tile(x,y,8,1);}
  if(index===3)for(const [x,y] of [[4,3],[6,3],[11,9],[14,2]]){tile(x,y,11,1);if(x+1<width-1)tile(x+1,y,10,1);}
  for(const marker of markers)tile(marker.x,marker.y,0,1);
  return normalizeAdventure({...editAdventure(base,{title:titles[index],author:'Lantern Trails',description:'A peaceful Lanternfair adventure: inventive crossings, written clues, and a place for every traveler.',source:'Storybook original',theme:['woodland','coast','archive','clockwork'][index],map,markers,par:140,intro,hint,ending}),...(LANTERNFAIR_CLEARS[id]?{proof:{difficulty:'trail',actions:LANTERNFAIR_CLEARS[id]}}:{})});
}
export function lanternfairBook(){return normalizeBook({title:'The Lanternfair Letters',author:'Lantern Trails',synopsis:'Come as yourself. Four peaceful original chapters about a missing pattern, a ribbon river, a written bell song, and a parade with room for everyone. Optional buttons, spools, and threads invite another route.',ending:'The fair’s lights belong to everyone who arrived. Keep your favorite look, try a new one in the Traveler’s Tent, or bind four worlds into a festival of your own.',chapters:LANTERNFAIR_LEVELS.map((id,index)=>({world:lanternfairWorld(id),passage:passages[index]}))});}
export const LANTERNFAIR_CLEARS={"pattern":["right","interact:jun","close-dialogue","right","up","up","up","up","up","up","up","right","down","down","down","right","right","right","down","right","right","right","right","right","down","down","down","up","up","up","up","up","right","right","up","left","left","right","right","down","down","down","down","down","up","up","left","left","left","left","left","left","left","down","down","down","down","left","left","left","left","left","left"],"ribbons":["up","right","interact:tavi","close-dialogue","right","up","up","up","right","up","right","up","up","left","left","right","right","right","right","down","down","down","right","right","up","right","right","right","right","right","down","down","down","down","down","left","left","up","up","right","right","up","up","up","up","left","left","right","right","down","down","down","down","down","left","up","left","left","left","up","up","left","left","left","down","down","down","down","down","left","left","left","left","left","left"],"fitting-song":["up","right","interact:jun-song","close-dialogue","right","up","up","up","up","up","interact:road","right","right","right","down","down","down","down","down","interact:rain","up","up","up","left","left","interact:home","up","up","up","left","left","right","right","right","right","right","down","down","down","down","right","right","right","right","up","up","up","right","right","right","right","down","down","down","down","down","down","left","up","up","up","right","up","up","up","left","left","left","down","left","down","down","right","right","down","down","up","up","left","left","left","left","left","left","down","down","down","down","left","left","left","left","left","left"],"parade":["up","up","up","up","right","interact:tavi-finale","close-dialogue","down","right","up","right","up","up","up","right","right","down","down","down","down","right","right","up","up","up","right","right","right","right","right","right","down","down","down","down","down","down","up","up","up","up","up","up","left","left","left","right","right","right","down","down","down","down","down","up","up","up","left","interact:iris","close-dialogue","down","down","down","left","left","interact:parade-heart","up","up","left","left","left","left","left","down","down","down","down","left","left","left","left","left"]};
