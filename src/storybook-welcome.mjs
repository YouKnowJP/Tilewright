import { blankAdventure, editAdventure, normalizeAdventure } from './workshop-model.mjs';
import { normalizeBook } from './storybook-model.mjs';

export const WELCOME_LEVELS=Object.freeze(['window','key','bridge','song','islands','home']);
export const WELCOME_CLEARS={"window":["up","up","up","up","right","right","right","right","right","right","right","right","down","down","down","down","down","left","left","left","left","left","left","left","left"],"key":["up","up","up","up","right","right","right","right","down","down","right","right","up","up","right","right","right","down","down","down","down","up","up","left","left","left","left","left","down","down","down","left","left","left","left"],"bridge":["up","up","right","right","up","right","right","down","right","right","up","up","right","right","right","down","down","left","left","left","left","left","up","left","left","left","down","down","down","left","down"],"song":["up","up","up","right","interact:here","right","right","right","right","right","down","down","right","right","right","down","interact:together","left","left","left","left","left","left","left","interact:home-note","up","right","right","right","right","right","right","up","up","up","right","down","left","down","down","down","down","down","down","left","left","left","left","left","left","left","left"],"islands":["up","right","interact:near-one","up","up","right","interact:middle-two","right","right","down","down","down","up","up","up","left","interact:far-two","down","down","left","interact:middle-one","down","left","left","down"],"home":["up","up","up","right","right","right","interact:welcome","right","right","down","down","down","right","right","up","up","up","up","right","right","right","right","down","down","down","down","down","up","up","left","interact:ori","close-dialogue","down","left","interact:house-heart","left","left","left","left","down","down","down","left","left","left","left","left"]};
const titles=['A Light in the Window','The Spare Key','A Bridge That Waits','The Garden’s Three Notes','Islands Belong Together','A Home with Room for Everyone'];
const passages=[
  'Ori has opened the old welcome house. Its windows face six roads, but every lamp has gone out. “We do not need to fix everything today,” she says. “Let us begin with two lights and a walk.” Nothing here is chasing you. The house will wait while you find your feet.',
  'A note is tucked beneath the welcome house door: “I have a spare key, if anyone needs a way through.” Moss has left it in the little northern garden. Across the water, two neighbors are waiting for their windows to shine. Some adventures begin with somebody remembering to leave a key.',
  'The next road ends at a counterweight bridge. Ori tries holding the plate herself. “This works,” she says, “but I would like to come too.” A wooden crate waits nearby. Give it a useful place to stay, and the bridge will be ready for every person who follows.',
  'The welcome garden has forgotten its song. Three bells remember one word each: Here, Together, Home. Nobody must remember the melody alone; it is written in your Quest notes. Walk from bell to bell, give each word its turn, and let the small orchard hear itself again.',
  'Moss draws three islands on the welcome house wall. “A map can make a place look farther away than it feels,” he says. The travel stones still work. Their matching numbers show which shores belong together. Step beside a stone and choose Travel. There is no need to hurry between journeys.',
  'Five roads shine through the welcome house windows. The last leads to Ori, who has stayed behind with the house’s little singing heart. Light both windows, ring the welcome bell, and ask Ori to come home. Carry the heart with you. A house becomes a home when nobody has to arrive alone.',
];
export function welcomeWorld(id){
  const index=WELCOME_LEVELS.indexOf(id);if(index<0)throw Error('Choose a known welcome chapter.');
  const width=index===4?20:index===5?16:14,height=index>=3&&index!==4?12:10,base=blankAdventure(width,height),map=base.map,markers=[];
  const tile=(x,y,value,layer=0)=>{map.layers[layer].tiles[y*width+x]=value;};
  map.layers[0].tiles.fill(index===4?3:1);map.layers[1].tiles.fill(0);map.name=titles[index];
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(!x||!y||x===width-1||y===height-1)tile(x,y,7,1);
  const add=(kind,id,x,y,extra={})=>markers.push({kind,id,x,y,...extra});
  const bank=(x,row)=>{for(let y=1;y<height-1;y++)tile(x,y,3);tile(x,row,12);};
  add('start','start',2,7);add('beacon','welcome-home',2,height-2);
  let kit='none',hint='',intro='',ending='';
  if(index===0){
    add('lantern','window-one',5,3);add('lantern','window-two',10,3);add('coin','button',11,7);add('coin','petal',3,2);
    add('guide','ori',3,6,{name:'Ori',text:'Welcome. Step onto each lantern to light it. Then step onto the home beacon near where you started. You can read, think, or open Options for as long as you like. The world waits for your next action.'});
    for(let x=6;x<=8;x++)tile(x,6,3);
    intro='Walk onto both lanterns, then return to the home beacon. Nothing moves until you act. There are no enemies or burning tiles in any chapter of this book. Coins are optional.';
    hint='One lantern is at column 6, row 4; the other is at column 11, row 4. Walk north, then east across the garden. Return to column 3, row 9. You do not need to dash.';
    ending='Two windows glow. Ori puts a chair beside each one. “For whoever wants to stop and look,” she says. The first road is ready.';
  }else if(index===1){
    bank(7,5);add('key','spare',4,3);add('gate','garden-lock',7,5);add('lantern','north-window',11,3);add('lantern','south-window',11,7);add('coin','small-shell',10,8);
    add('guide','moss',3,6,{name:'Moss',text:'The key is north of us. Walk onto it to collect it. Step into the locked crossing to use it. Once unlocked, the gate stays open, so you can return whenever you are ready.'});
    intro='Collect the spare key in the northern garden. Walk into the locked crossing to open it, restore both far-bank lanterns, and return home. Unlocking is automatic when you have a key.';
    hint='The key is at column 5, row 4. The crossing is at column 8, row 6. Both lamps stand on column 12. The gate stays open for the return trip.';
    ending='Moss hangs the used key beside the welcome house door. It is no longer needed for the crossing. It is a reminder that a closed road can change.';
  }else if(index===2){
    bank(7,5);add('plate','weight',5,5);add('crate','counterweight',4,5);add('bridge','waiting-span',7,5);add('lantern','bridge-window',11,3);add('coin','round-stone',11,7);
    add('guide','ori',3,8,{name:'Ori',text:'Stand to the left of the crate and walk right once. It slides onto the pressure plate. Then go around it using the row above. Leave the crate on its plate so the bridge will stay open. Undo brings back a misplaced push.'});
    intro='Push the crate one step right onto the plate. Walk around it, cross the bridge, and light the far-bank lantern. Leave the crate in place for your return. Undo is always there if you want another try.';
    hint='Stand at column 4, row 6 and step right once. Go up one row, then right three steps and down to the crossing. The far lantern is at column 12, row 4. Return by the same bridge.';
    ending='The bridge waits without anybody having to hold it. Ori walks across, turns, and waves to an empty road. “For the next person,” she says.';
  }else if(index===3){
    for(let y=2;y<=5;y++)for(let x=9;x<=12;x++)tile(x,y,8,1);
    for(let y=3;y<=4;y++)for(let x=10;x<=11;x++)tile(x,y,0,1);
    tile(10,5,0,1);add('signal','song-gate',10,5);add('lantern','orchard-window',11,3);add('lantern','garden-window',6,6);
    add('bell','here',3,3,{name:'Here · note 1',order:1});add('bell','together',11,8,{name:'Together · note 2',order:2});add('bell','home-note',4,8,{name:'Home · note 3',order:3});add('coin','seed',7,3);
    add('guide','ori',3,6,{name:'Ori',text:'Here, Together, Home. Stand beside each bell and choose Ring. Quest keeps the order written down. A wrong note only starts the melody again; it never hurts you.'});
    intro='Ring Here (1), Together (2), then Home (3). Stand beside a bell and use Interact. The completed song opens the orchard gate. Restore both lights and return home. Quest keeps the order visible.';
    hint='Here is at column 4, row 4. Together is at column 12, row 9. Home is at column 5, row 9. The orchard opens from the south at column 11, row 6. Bells can be rung from a neighboring tile.';
    ending='The orchard answers with the sound of leaves. Ori writes the song above the door, where nobody will have to remember it alone.';
  }else if(index===4){
    for(const [left,right]of [[1,5],[8,11],[14,18]])for(let y=2;y<=7;y++)for(let x=left;x<=right;x++)tile(x,y,6);
    tile(2,8,6);kit='echoist';add('waystone','near-one',4,6,{name:'Near shore · link 1'});add('waystone','middle-one',9,6,{name:'Middle shore · link 1'});
    add('waystone','middle-two',10,3,{name:'Middle shore · link 2',channel:'jade'});add('waystone','far-two',15,3,{name:'Far shore · link 2',channel:'jade'});
    add('lantern','middle-window',9,4);add('lantern','far-window',17,6);add('coin','sea-glass',17,3);
    add('guide','moss',2,5,{name:'Moss',text:'Stand beside a travel stone and choose Travel. Stones with the same number are partners. Walk or wait to recover energy between trips. Your specialist double is optional; you can finish using only travel stones and walking.'});
    intro='Use travel stones with matching numbers to visit all three islands. Stand beside a stone and choose Travel. Restore the middle and far lanterns, then use the same pairs to return home. Walking and waiting recover travel energy.';
    hint='The first pair joins columns 5 and 10 on row 7. The second joins columns 11 and 16 on row 4. Light the middle island before traveling east; return through both pairs after restoring the far lantern.';
    ending='Moss draws two small arches between his islands. “There,” he says. “The distances were real. So were the ways across.” A light shines in the fifth window.';
  }else{
    bank(8,7);add('lantern','north-window',13,3);add('lantern','south-window',13,8);add('bell','welcome',5,3,{name:'Welcome',order:1});
    add('rescue','ori',12,5,{name:'Ori',text:'Both windows are shining. Thank you for taking the long way when you needed it, and for coming back. Take the singing heart beside the southern window. I will follow you home.'});
    add('relic','house-heart',11,8,{name:'The welcome house heart'});add('coin','paper-flower',5,9);add('coin','shell',14,7);
    intro='Ring the Welcome bell, restore both far-bank lights, then speak to Ori to invite her home. Take the singing heart from a neighboring tile and return to the beacon together. No enemy will hear the heart here.';
    hint='Ring the bell at column 6, row 4. Cross at row 8, light both windows on column 14, then speak to Ori at column 13, row 6. Take the heart at column 12, row 9 and bring it home with Ori.';
    ending='The welcome house heart settles into its lantern. Six windows shine on six different roads. Ori leaves the door open. Some travelers will stop for a story; others will build a road of their own. There is a place here for every pace.';
  }
  for(const marker of markers)tile(marker.x,marker.y,0,1);
  return normalizeAdventure({...editAdventure(base,{title:titles[index],author:'Lantern Trails',description:'A peaceful chapter: no enemies, no timed hazards, and room to find your own pace.',source:'Storybook original',theme:index===4?'coast':index===3?'clockwork':'woodland',kit,map,markers,par:150,intro,hint,ending}),...(WELCOME_CLEARS[id]?{proof:{difficulty:'trail',actions:WELCOME_CLEARS[id]}}:{})});
}
export function welcomeBook(){return normalizeBook({title:'The Welcome Lanterns',author:'Lantern Trails',synopsis:'Six peaceful original chapters. Restore a welcome house one window at a time: walking, a spare key, a patient bridge, a written bell song, island travel, and a homecoming. No enemies or burning tiles; optional challenges can wait.',ending:'Six roads shine through the windows. The welcome house is open. Take another walk, explore a harder trail, or create a world at your own pace. Whatever you choose, this road will be here when you return.',chapters:WELCOME_LEVELS.map((id,i)=>({world:welcomeWorld(id),passage:passages[i]}))});}
