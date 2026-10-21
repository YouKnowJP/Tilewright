import { blankAdventure, normalizeAdventure, editAdventure } from './workshop-model.mjs';
import { STORY_CLEARS } from './story-adventure-clears.mjs';

export const STORY_LEVELS = Object.freeze([
  { id:'undelivered', title:'The Undelivered Letter', book:'rainmaker', theme:'woodland', lesson:'Two crossings, one important delivery' },
  { id:'sluices', title:'The Two Sluices', book:'rainmaker', theme:'marsh', lesson:'Open the return route from the far bank' },
  { id:'orchard', title:'The Bell Orchard', book:'rainmaker', theme:'clockwork', lesson:'A four-note song and scattered rain seeds' },
  { id:'rainhome', title:'Where the Rain Comes Home', book:'rainmaker', theme:'coast', lesson:'Two keepers, a rainseed, and the way home' },
  { id:'remembering', title:'The Door That Remembers', book:'observatory', theme:'archive', lesson:'An echo crossing with a permanent alternative' },
  { id:'seconds', title:'The Island Between Seconds', book:'observatory', theme:'aurora', lesson:'Waystone journeys through yesterday, tomorrow, and now' },
  { id:'constellation', title:'The Quiet Constellation', book:'observatory', theme:'forge', lesson:'Cover, patient footsteps, and an adaptive sentinel' },
  { id:'everyone', title:'A Star for Everyone', book:'observatory', theme:'clockwork', lesson:'Two counterweights, three bells, and one shared sky' },
]);

export function storyAdventure(id) {
  const level=STORY_LEVELS.find(item=>item.id===id); if(!level)throw Error('Choose a known story chapter.');
  const width=id==='everyone'?22:['rainhome','seconds','constellation'].includes(id)?20:id==='undelivered'?16:18, height=id==='everyone'?16:id==='undelivered'?12:14;
  const base=blankAdventure(width,height),map=base.map, ground=map.layers[0].tiles,details=map.layers[1].tiles;
  const floor=['archive','aurora','forge'].includes(level.theme)?6:level.theme==='coast'?4:1;
  ground.fill(floor); details.fill(0); map.name=level.title;
  const cell=(x,y,tile,layer=0)=>{map.layers[layer].tiles[y*width+x]=tile;};
  const rect=(x1,y1,x2,y2,tile,layer=0)=>{for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++)cell(x,y,tile,layer);};
  const line=(x1,y1,x2,y2,tile,layer=0)=>rect(x1,y1,x2,y2,tile,layer);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
    if(!x||!y||x===width-1||y===height-1)cell(x,y,floor===6?9:7,1);
    else if((x*11+y*7)%19===0)cell(x,y,floor===6?5:2);
    else if(floor!==6&&(x*3+y*13)%37===0)cell(x,y,10,1);
  }
  let markers=[],kit='none',rules={},intro='',hint='',ending='';
  const add=(kind,id,x,y,extra={})=>markers.push({kind,id,x,y,...extra});
  const person=(id,name,x,y,text,extra={})=>add('guide',id,x,y,{name,text,...extra});
  const light=(id,x,y)=>add('lantern',id,x,y);
  const coin=(id,x,y)=>add('coin',id,x,y);
  const gate=(kind,id,x,y,channel='amber')=>add(kind,id,x,y,{channel});
  const lever=(id,name,x,y,channel='amber')=>add('lever',id,x,y,{name,channel,required:true});
  const bell=(id,name,x,y,order)=>add('bell',id,x,y,{name,order});
  const banks=(x,crossings)=>{line(x,1,x,height-2,3);for(const y of crossings)cell(x,y,12);};
  const home=(sx,sy,bx,by)=>{add('start','start',sx,sy);add('beacon','home',bx,by);};
  if(id==='undelivered') {
    home(2,8,3,9);banks(8,[3,8]);gate('door','post-bridge',8,8);gate('gate','old-lock',8,3);add('key','post-key',3,2);
    lever('post-wheel','Post office wheel',6,7);light('roof-light',12,2);add('relic','letter',12,5,{name:'The undelivered letter'});coin('button',11,9);coin('stamp',5,2);
    person('nessa','Postkeeper Nessa',3,7,'This letter is addressed to “the first rainy day.” Nobody here has seen one in months. I can open the south bridge, or pack a shield. The northern lock still has a key in the old post garden.',{reward:'route'});
    rect(10,7,12,7,11,1);cell(11,7,0,1);line(2,8,7,8,5);line(9,8,13,8,5);
    intro='Nessa has kept one impossible letter for an entire summer. Restore the roof lantern, collect the letter from the eastern postbox, and deliver it to the home beacon. Ask Nessa for a crossing, or find your own.';
    hint='Speak to Nessa from the south and ask for the route, or turn the post office wheel yourself. The old northern gate is another crossing. Take the letter beside its postbox, then bring it home with the lantern lit.';
    ending='The envelope opens in the beacon’s warmth. Inside is a map of two sluices, drawn in ink that smells like wet leaves. On its back: “Rain begins with a way through.”';
  } else if(id==='sluices') {
    home(2,3,3,10);rect(1,5,16,6,3);line(9,1,9,4,3);
    for(const y of [5,6])for(const [x,channel] of [[5,'amber'],[12,'jade']]){cell(x,y,12);gate('door',`${channel}-sluice-${y}`,x,y,channel);}
    lever('west-wheel','West-bank wheel',3,3);lever('east-wheel','East-bank wheel',14,9,'jade');
    light('rain-light',14,3);light('moss-light',7,10);add('ember','dry-west',5,4);add('ember','dry-east',12,7,{channel:'jade'});coin('reed',5,10);coin('raindrop',15,10);
    person('moss','Sluice keeper Moss',6,9,'The west wheel gives you the lower bank. The east wheel gives you the far upper garden. Leave both running; the rain needs a complete circuit. Their channels cool the dry crossings too.');
    rect(2,8,4,8,8,1);line(6,8,15,8,5);
    intro='The canals divide a thirsty garden into three banks. Wake both wheels, cool the crossings, and restore both lights. One wheel is reachable only after you commit to the other bank.';
    hint='Turn the west wheel from its western neighbor. Cross south at column 6, then walk along the lower bank to the east wheel. Its crossing reaches the isolated northeast lantern. Collect the southern lantern and leave both wheels on.';
    ending='Water makes a quiet circuit through the reeds. Moss cups a handful and laughs: “It remembers how to move. Now we must remind the orchard how to listen.”';
  } else if(id==='orchard') {
    home(2,10,3,11);rules={allCoins:true,noDash:true};
    rect(7,4,10,9,8,1);rect(8,5,9,8,0,1);cell(7,7,0,1);gate('signal','orchard-song',7,7);
    bell('rain','Rain',3,3,1);bell('root','Root',14,4,2);bell('river','River',6,10,3);bell('return','Home',12,10,4);
    light('heart-light',9,6);light('branch-light',14,2);
    for(const [i,x,y]of [[1,3,5],[2,15,6],[3,13,11],[4,5,9]])coin(`seed-${i}`,x,y);
    person('ori','Orchard keeper Ori',4,8,'The old song goes Rain, Root, River, Home. Ring it in that order. Four brass seeds have fallen outside the hedge; gather them all. Walk softly. A garden hears more when you are listening.');
    rect(12,7,15,8,3);rect(2,6,3,7,10,1);line(5,2,11,2,5);
    intro='A patient orchard keeps the last rain seeds behind a four-note song. Ring Rain, Root, River, then Home. Restore both lanterns and collect all four brass seeds. This garden asks for walking feet.';
    hint='The bells stand around the garden: northwest Rain, northeast Root, southwest River, southeast Home. Their complete song opens the western hedge gate. Gather the four outside seeds before returning to the southwest beacon.';
    ending='The seeds turn silver in your hand. Beyond the hedge, Ori finds a child’s drawing: the town under a cloud, with room beneath it for everyone. The missing piece is waiting at the coast.';
  } else if(id==='rainhome') {
    home(2,10,3,11);banks(10,[4,10]);gate('door','rain-crossing',10,10);gate('gate','high-lock',10,4);add('key','coast-key',4,3);lever('rain-wheel','Rain wheel',6,9);
    person('ori','Ori at the shore',4,8,'Nessa and Moss crossed before the bridge dried. Restore both coastal lamps before you call them home. The rainseed is noisy; take the wide shore after picking it up. I can open the low crossing, or give you supplies.',{reward:'route'});
    light('north-light',17,2);light('south-light',17,11);add('relic','rainseed',14,7,{name:'The last rainseed'});
    add('rescue','nessa',15,3,{name:'Nessa',text:'The letter was not lost. It was waiting for someone who would finish its journey. When both lamps shine, take me home.'});
    add('rescue','moss',16,10,{name:'Moss',text:'Look at the sea: a thousand little beginnings. Let us bring one back to the town. I will follow when the lamps are restored.'});
    add('patrol','shore-warden',6,2,{route:[{x:6,y:2},{x:7,y:2},{x:8,y:2},{x:8,y:3},{x:7,y:3},{x:6,y:3}]});
    coin('shell',7,3);coin('glass',18,8);add('ember','dry-jetty',9,10);rect(12,5,17,5,3);cell(17,5,12);cell(12,5,12);
    intro='The coast holds two keepers and one last rainseed. Restore the north and south lamps, collect the singing seed, then speak to Nessa and Moss to bring them home. The old warden still patrols the abandoned upper road.';
    hint='Ori or the rain wheel opens the low bridge and cools its approach. The eastern inlet has crossings at both ends. Light both lamps before rescuing the keepers, then carry the rainseed back over the low bridge.';
    ending='The seed opens above the beacon. Rain finds the rooftops, the dry canals, and Nessa’s empty postbox. Nobody runs indoors. For a little while, the whole town stands together in the weather.';
  } else if(id==='remembering') {
    home(2,7,14,10);kit='echoist';rect(8,1,10,12,3);for(const x of [8,9,10]){cell(x,7,12);gate('bridge',`echo-span-${x}`,x,7);}
    add('plate','memory-plate',6,7);add('crate','memory-crate',6,4);lever('archive-wheel','Archive wheel',13,6,'jade');
    rect(12,2,16,5,9,1);rect(13,3,15,4,0,1);cell(14,5,0,1);gate('door','archive-door',14,5,'jade');
    light('old-star',14,3);light('new-star',15,10);coin('margin',13,9);coin('ink',15,7);
    person('eid','Eid, a keeper’s echo',11,10,'I am the memory of a keeper who promised to return the borrowed stars. Leave your double on the plate, then cross in six steps. Or push the old crate south onto it: some memories deserve to stay.');
    intro='The observatory has borrowed more stars than its keeper can return. Cross the three-part memory bridge, wake the archive wheel, and restore both stars. A double can hold the bridge briefly; a crate can hold it for good.';
    hint='The plate is at column 7, row 8. Cast a double there and walk east without stopping, or push the crate south onto it from the north. The jade wheel opens the small northern vault. The exit is on the eastern island.';
    ending='Behind the archive door you find a ledger, every star named after someone in the town. One name has been erased. Eid folds the page carefully: “Let us find the person who is missing.”';
  } else if(id==='seconds') {
    kit='echoist';ground.fill(3);rect(1,2,5,11,6);rect(8,2,11,11,6);rect(14,2,18,11,6);rect(8,10,11,10,3);cell(10,10,12);gate('signal','present-gate',10,10);
    home(2,8,2,10);add('waystone','west-stone',4,8,{name:'Yesterday’s shore'});add('waystone','middle-stone',9,8,{name:'The waiting island'});add('waystone','future-stone',10,3,{name:'Tomorrow’s step',channel:'jade'});add('waystone','east-stone',15,3,{name:'The far tomorrow',channel:'jade'});
    bell('yesterday','Yesterday',9,5,1);bell('tomorrow','Tomorrow',17,6,2);bell('now','Now',3,3,3);light('present-light',10,11);light('future-light',17,9);add('relic','clock-heart',16,10,{name:'The stopped clock heart'});coin('hour',4,10);coin('minute',18,4);
    person('sable','Astronomer Sable',2,5,'Eid’s missing name belongs to Ilex, our apprentice. This clock split the road into Yesterday, Tomorrow, and Now. Ring those bells in that order. Waystones carry you and the clock heart; walk between jumps to recover energy.');
    intro='Three islands wait in a clock that forgot the present. Use paired waystones, ring Yesterday, Tomorrow, then Now, and recover the stopped clock heart. Restore both stars and bring the heart to the western beacon.';
    hint='The amber pair links west and middle; jade links middle and east. Ring the middle bell, then the eastern bell, then the western bell. Return to the middle island to reach its southern star through the signal gate. Waystone travel can carry the clock heart home.';
    ending='The heart ticks once. A note appears between the ledger’s pages: “I did not steal the stars. I hid them where the sentinel would not look. — Ilex.” Across the next ridge, a searchlight turns.';
  } else if(id==='constellation') {
    home(2,10,3,11);kit='mistweaver';rules={noDash:true};rect(7,4,12,9,3);cell(9,4,12);cell(9,9,12);
    light('north-star',16,2);light('south-star',17,11);add('rescue','ilex',17,3,{name:'Ilex',text:'The sentinel counted the stars, but it never learned their names. I hid them so it could not take them away. Restore the two lights; then I will show you how to give them back.'});
    person('sable','Sable’s field note',4,9,'Walk the outside garden and read the sentinel’s next-step outline. Ferns hide quiet feet at a distance. Mist hides new sightings for a few turns, but the sentinel still follows its last lead. There is no reward for rushing.',{reward:'supplies'});
    add('hunter','sentinel',14,6,{vision:3,route:[{x:14,y:6},{x:15,y:6},{x:15,y:8},{x:14,y:8}]});
    for(const [i,x,y]of [[1,14,3],[2,16,3],[3,18,5],[4,18,8],[5,16,10],[6,14,10]])add('fern',`fern-${i}`,x,y);
    for(let y=2;y<=11;y++)add('fern',`outer-fern-${y}`,18,y);
    for(const x of [13,14,15,16])add('fern',`north-fern-${x}`,x,2);
    add('fern','south-star-fern',17,11);for(let x=13;x<=18;x++)add('fern',`south-fern-${x}`,x,12);
    coin('small-star',15,7);coin('paper-star',13,8);add('supplies','field-pack',13,2);add('heart','mercy',5,2);line(2,2,14,2,5);
    intro='Ilex is hiding in the quiet constellation garden. Restore both stars before asking the apprentice to follow. Walk, use cover or mist, and watch the adaptive sentinel’s committed moves. Optional star fragments lie closer to its patrol.';
    hint='The northern and southern edges, joined by the far-right fern line, are safer than the inner patrol lane. Read Sable’s note for supplies. Keep quiet on fern cells; veil or shield before a close crossing. Light both stars before speaking to Ilex, then take the long way back to the western beacon.';
    ending='Ilex steps out of hiding with a pocket full of paper stars. “I thought returning them meant the sky would be empty.” Sable kneels beside the apprentice. “Only if we return them alone.”';
  } else {
    home(2,12,3,13);kit='echoist';banks(8,[6]);banks(15,[10]);gate('bridge','west-span',8,6);gate('bridge','east-span',15,10,'jade');
    add('plate','west-weight',6,6);add('crate','west-crate',5,6);add('plate','east-weight',13,10,{channel:'jade'});add('crate','east-crate',12,10);
    bell('keeper','Keeper',4,3,1);bell('neighbor','Neighbor',11,4,2);bell('stranger','Stranger',18,9,3);lever('sky-wheel','Sky wheel',10,12,'violet');add('ember','last-ember',14,10,{channel:'violet'});
    light('first-star',12,3);light('last-star',19,3);add('relic','shared-star',18,6,{name:'The star with room for everyone'});add('rescue','eid',19,11,{name:'Eid',text:'A keeper, a neighbor, a stranger: three bells, one sky. When both lights are home, I can leave this old promise behind. Please take me with you.'});
    person('sable','Sable and Ilex',3,10,'We will keep the home beacon lit. Leave both crates on their plates so the whole road stays open. Ring Keeper, Neighbor, Stranger. The violet wheel cools the far crossing. Bring Eid and the shared star home together.');
    coin('thanks',6,12);coin('name',12,5);coin('promise',20,13);rect(17,7,19,7,9,1);cell(17,7,0,1);
    intro='One last crossing for a whole town’s sky. Hold both pressure bridges, ring Keeper, Neighbor, then Stranger, and turn the violet sky wheel. Restore both stars, collect the shared star, and rescue Eid before returning home.';
    hint='Push the western crate east onto amber and walk around it from the north. On the middle island, light its star, ring Neighbor, turn the violet wheel, then push the second crate east onto jade. Ring Stranger and light the eastern star before rescuing Eid. Permanent counterweights keep both return bridges open.';
    ending='Eid reaches the beacon as the shared star opens into a thousand small lights. Ilex writes the missing name back into the ledger. Nobody owns the sky now. Every window in the town has borrowed a little of it.';
  }
  // Gate cells remain visibly bridged; decorative flowers never hide puzzle objects.
  for(const marker of markers)if(details[marker.y*width+marker.x]===10)cell(marker.x,marker.y,0,1);
  const pack=editAdventure(base,{title:level.title,author:'Lantern Trails',description:level.lesson,theme:level.theme,kit,rules,map,markers,intro,hint,ending,source:'Storybook original',par:300});
  const clear=STORY_CLEARS[id];return normalizeAdventure({...pack,...(clear?{par:clear.par,proof:{difficulty:'trail',actions:clear.actions}}:{})});
}
