import { blankAdventure, editAdventure, normalizeAdventure } from './workshop-model.mjs';

export const AFTERHOURS_ROOMS = Object.freeze([
  { id:'locksmith', title:'The Locksmith’s Last Delivery', theme:'archive', lesson:'Spare keys & a different way home', idea:'Make the second key open an optional return route, rather than another compulsory lock.' },
  { id:'foundry', title:'The Doublelight Foundry', theme:'forge', lesson:'Temporary doubles or permanent counterweights', idea:'Try the brief double crossing, then leave a permanent crate crossing for the next traveler.' },
  { id:'glassferry', title:'The Glass Ferry', theme:'coast', lesson:'Island travel, cargo & a stranded keeper', idea:'Waystones carry a parcel too. Design a delivery with a useful stop between jumps.' },
  { id:'floodsong', title:'A Song for the Floodgates', theme:'marsh', lesson:'A four-note circuit across changing banks', idea:'Let the far-bank wheel open a shorter return route through your bell circuit.' },
  { id:'nightshift', title:'The Keeper’s Night Shift', theme:'aurora', lesson:'Mist, cover & a tempting treasure detour', idea:'Keep a safe outside route, then offer a guarded treasure to players who want more risk.' },
  { id:'caravan', title:'The Last Caravan Home', theme:'clockwork', lesson:'A linked-puzzle rescue & delivery finale', idea:'Build a road that stays open for everyone who follows you home.' },
].map(room=>Object.freeze({...room,afterhours:true})));

export function afterHoursWorld(room,actions) {
  const id=room.id,width=id==='caravan'?22:id==='glassferry'?20:['nightshift','floodsong'].includes(id)?18:16,height=id==='caravan'?14:12;
  const base=blankAdventure(width,height),map=base.map,stone=['archive','forge','aurora','clockwork'].includes(room.theme);
  map.name=room.title;map.layers[0].tiles.fill(stone?6:1);map.layers[1].tiles.fill(0);
  const cell=(x,y,tile,layer=0)=>{map.layers[layer].tiles[y*width+x]=tile;};
  const rect=(x1,y1,x2,y2,tile,layer=0)=>{for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++)cell(x,y,tile,layer);};
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(!x||!y||x===width-1||y===height-1)cell(x,y,stone?9:7,1);else if((x*7+y*11)%23===0)cell(x,y,stone?5:2);
  const markers=[],add=(kind,id,x,y,extra={})=>markers.push({kind,id,x,y,...extra}),home=(x,y,bx,by)=>{add('start','start',x,y);add('beacon','home',bx,by);};
  const light=(id,x,y)=>add('lantern',id,x,y),coin=(id,x,y)=>add('coin',id,x,y),gate=(kind,id,x,y,channel='amber')=>add(kind,id,x,y,{channel});
  const lever=(id,name,x,y,channel='amber')=>add('lever',id,x,y,{name,channel,required:true}),bell=(id,name,x,y,order)=>add('bell',id,x,y,{name,order});
  let kit='none',intro='',hint='',ending='',par=100,rules={};
  if(id==='locksmith') {
    home(2,8,2,9);rect(7,1,7,10,9,1);for(const y of [3,8])cell(7,y,0,1);
    gate('gate','delivery-lock',7,8);gate('gate','return-lock',7,3);add('key','delivery-key',3,8);add('key','spare-key',12,9);light('roof-lamp',12,2);
    coin('old-stamp',3,2);coin('brass-button',10,9);coin('blue-envelope',13,5);
    add('guide','rue',4,5,{name:'Locksmith Rue',text:'The first key gets the delivery through the south door. The spare key is in the eastern yard. Spend it on the north door for a different way home, or revisit the door you already opened. A key is a choice, not just a toll.'});
    rect(10,5,11,6,9,1);intro='Rue has one roof lamp left to deliver before closing. Find the first key, restore the eastern lamp, and bring its light home. A spare key and three forgotten treasures reward a longer delivery round.';
    hint='The first key is just east of your start. The spare waits in the southeast. The north door is optional; both opened doors stay open. Treasures never block your exit.';
    ending='Rue turns the sign to CLOSED, then hangs up one extra key. “For whoever needs a different way home.”';par=75;
  } else if(id==='foundry') {
    home(3,8,12,9);kit='echoist';rect(7,1,8,10,3);for(const x of [7,8]){cell(x,6,12);gate('bridge',`foundry-span-${x}`,x,6);}
    add('plate','foundry-weight',5,6);add('crate','foundry-crate',5,3);light('furnace-light',12,3);coin('old-mold',3,2);coin('new-mold',13,9);
    add('guide','kiln',3,5,{name:'Kiln, the night founder',text:'A double can hold this plate long enough to cross. The crate above it can hold it forever. Push from the north if you want to leave a road for the morning shift.'});
    rect(11,5,13,6,9,1);intro='The foundry is dark on both sides of its cooling channel. Cast a double on the western plate and cross without stopping, or move the old crate into place. Restore the furnace lamp and reach the eastern beacon.';
    hint='Cast at column 6, row 7; four eastward steps reach dry land. For the permanent answer, stand above the crate and push it south three times. Walk around the weight to reach the bridge.';
    ending='The furnace gives a warm, ordinary sigh. Across the channel, the morning shift will find either your memory or the road you left behind.';par=55;
  } else if(id==='glassferry') {
    map.layers[0].tiles.fill(3);rect(1,1,5,10,4);rect(8,1,11,10,6);rect(14,1,18,10,4);home(2,8,2,9);kit='echoist';
    for(const [id,x,y,channel,name]of [['west-stone',4,8,'amber','West pier'],['middle-stone',9,8,'amber','Glass quay'],['upper-stone',10,3,'jade','Upper quay'],['east-stone',15,3,'jade','Far shore']])add('waystone',id,x,y,{channel,name});
    light('quay-light',10,6);light('shore-light',17,8);add('relic','glass-parcel',16,6,{name:'The singing glass parcel'});
    add('rescue','ferrier',17,3,{name:'Ferrier Fen',text:'I used to know every crossing by the sound of its water. Restore both lamps, then call me. I will follow the waystones home with you.'});
    add('guide','tess',2,5,{name:'Tess at the pier',text:'Amber reaches the glass quay; jade reaches the far shore. Travel costs energy. Walking between the stones gives it back. The parcel and a following keeper can travel with you.'});
    coin('glass-pearl',9,2);coin('sea-pearl',18,9);intro='The ferry has become a road made of moments. Restore two island lamps, collect the singing glass parcel, and bring Fen home through both waystone pairs. Two lost pearls are optional stops.';
    hint='Use the west stone, walk north on the middle quay, then use its upper jade stone. Light both lamps before speaking to Fen. Take the parcel beside its pedestal and reverse the two jumps to the west beacon.';
    ending='Fen sets the parcel beside the beacon. Inside are six tiny windows, each holding the reflection of someone waiting at home.';par=115;
  } else if(id==='floodsong') {
    home(2,3,3,3);rect(1,5,16,5,3);for(const [x,channel]of [[4,'amber'],[13,'jade']]){cell(x,5,12);gate('door',`${channel}-floodgate`,x,5,channel);}
    lever('near-wheel','Near-bank wheel',3,2);lever('far-wheel','Far-bank wheel',14,8,'jade');
    bell('root','Root',5,3,1);bell('road','Road',12,8,2);bell('rain','Rain',14,2,3);bell('rest','Rest',5,8,4);
    rect(8,1,10,3,7,1);rect(9,2,9,2,0,1);cell(9,3,0,1);gate('signal','song-vault',9,3);light('song-light',9,2);light('garden-light',14,9);
    coin('reed-token',3,9);coin('rain-token',15,3);coin('road-token',11,9);
    add('guide','wren',2,7,{name:'Bellkeeper Wren',text:'Our road song is Root, Road, Rain, Rest. Begin on this bank, cross for the second note, come back for the third, and cross once more for the last. Leave both wheels running so everyone can follow.'});
    intro='Four notes belong to two banks. Wake the near wheel, cross to the far wheel, then ring Root, Road, Rain, Rest in order. The complete song opens the little northern lantern vault. Both wheels must stay on.';
    hint='Root is northwest, Road southeast, Rain northeast, Rest southwest. The far wheel opens the eastern crossing for a shorter circuit. Bells work from an adjacent tile; a wrong note restarts the sequence.';
    ending='The gates settle into a gentle rhythm. Wren rings the song once more, this time with no road left between its notes.';par=125;
  } else if(id==='nightshift') {
    home(2,9,3,9);kit='mistweaver';rules={noDash:true};rect(7,4,10,7,3);light('roof-light',15,2);light('yard-light',15,9);
    add('hunter','night-sentinel',12,5,{vision:3,route:[{x:12,y:5},{x:14,y:5},{x:14,y:7},{x:12,y:7}]});
    for(let y=1;y<=10;y++)for(const x of [16])add('fern',`edge-${y}`,x,y);for(let x=11;x<=15;x++)for(const y of [2,10])add('fern',`shelter-${x}-${y}`,x,y);
    coin('silver-hour',13,6);coin('last-minute',16,8);add('supplies','night-pack',13,2);
    add('guide','ada',4,8,{name:'Keeper Ada',reward:'supplies',text:'The sentinel watches the inner yard. The outside ferns are a quiet way around. Read its next-step outline before entering the yard for the silver hour. Mist hides a new sighting; it does not erase a chase already begun.'});
    intro='Ada needs two lamps for the morning watch. Walk the fern-lined outside route, or brave the sentinel’s inner yard for a lost silver hour. Mist, cover, and the supply cache give you different ways to finish a clean shift.';
    hint='The northern rim and the far eastern fern line connect both lamps. Speak to Ada for supplies; the cache near the roof gives more. For the guarded coin, use Plan, mist, a decoy, or a shield before approaching.';
    ending='Ada opens the morning ledger. For once, the last line reads “Everyone home.” The sentinel keeps walking; you no longer have to.';par=110;
  } else if(id==='caravan') {
    home(2,10,3,11);kit='echoist';for(const [x,y,channel]of [[8,5,'amber'],[15,9,'jade']]){rect(x,1,x,12,3);cell(x,y,12);gate('bridge',`${channel}-span`,x,y,channel);}
    add('plate','west-weight',6,5);add('crate','west-crate',5,5);add('plate','east-weight',13,9,{channel:'jade'});add('crate','east-crate',12,9);
    lever('caravan-wheel','Caravan wheel',11,11,'violet');add('ember','last-crossing',14,9,{channel:'violet'});
    bell('departure','Departure',4,3,1);bell('distance','Distance',11,3,2);bell('arrival','Arrival',18,10,3);
    rect(17,1,20,4,9,1);rect(18,2,19,3,0,1);cell(18,4,0,1);gate('signal','caravan-vault',18,4);
    light('road-light',11,2);light('vault-light',18,2);light('camp-light',19,11);
    add('relic','caravan-parcel',18,6,{name:'The caravan’s last parcel'});for(const [id,name,x,y]of [['pip','Pip',17,10],['rue','Rue',19,6]])add('rescue',id,x,y,{name,text:'We waited for the last wagon. Restore all three lamps, then bring us and the parcel home. Please leave both crossings open.'});
    add('guide','morrow',3,9,{name:'Caravan keeper Morrow',text:'Three bells mark the road: Departure, Distance, Arrival. Crates hold the crossings for a whole caravan. The violet wheel cools the last approach. Our last two travelers and their parcel are beyond it.'});
    coin('ticket',5,10);coin('wheel-pin',12,11);coin('ribbon',20,10);
    intro='One last caravan needs a lasting road. Hold both bridges with crates, ring Departure, Distance, Arrival, and cool the final crossing. Restore three lamps, rescue Pip and Rue, and bring their singing parcel to Morrow’s beacon.';
    hint='Push the west crate east once and walk around it. Do the same on the middle bank for the jade plate. Turn the violet wheel before the eastern crossing. Ring the third bell before entering the northern vault. Restore every lamp before asking either traveler to follow.';
    ending='The last parcel contains a blank road atlas. Pip draws the first crossing. Rue adds a key. Morrow writes your name beneath a small light: “A road is finished when someone else can use it.”';par=190;
  } else throw Error('Choose a known after-hours room.');
  const pack=editAdventure(base,{title:room.title,author:'Lantern Trails',description:room.lesson,theme:room.theme,map,markers,kit,rules,intro,hint,ending,source:'Puzzle Lab after-hours original',par});
  return normalizeAdventure({...pack,...(actions?{proof:{difficulty:'trail',actions}}:{})});
}
