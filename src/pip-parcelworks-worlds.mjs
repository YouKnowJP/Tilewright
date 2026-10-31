// New owned material. See LICENSE; prior MIT material retains its permissions.
import {blankAdventure,editAdventure} from './workshop-model.mjs';
import {normalizeBook} from './storybook-model.mjs';

export const PARCELWORKS_LEVELS=Object.freeze(['across-the-air','three-rooftops','midnight-reply','freight-lock','night-mail']);
const steps=n=>Array(n).fill('clockwork-step'),walk=(d,n)=>Array(n).fill(d),program=(...cards)=>'clockwork-program:'+cards.join(',');
export const PARCELWORKS_CLEARS={
 'across-the-air':[program('right','use','right'),...steps(4),...walk('right',9),...walk('left',9),'down'],
 'three-rooftops':['interact:near-wheel',program('right','right','use'),...steps(8),...walk('right',14),...walk('left',14),'down'],
 'midnight-reply':[program('right','right','use'),...steps(6),program('left','left','use'),...steps(3),program('left','use','left'),...steps(2),...walk('right',11),...walk('left',11),'down'],
 'freight-lock':['up',program('right','use','right'),...steps(9),'down',...walk('right',8),'interact:keeper-note',...walk('right',6),...walk('left',14),'down'],
 'night-mail':['interact:near-wheel','up',program('right','right','use'),...steps(9),program('right','use','right'),...steps(3),'down',...walk('right',16),...walk('left',16),'down'],
};
const chapters=[
 {title:'Across the Air',theme:'coast',width:15,height:13,row:9,par:42,rewrites:1,
  passage:'Tavi brings you a parcel that hums when you hold it near a wall. “The old Parcelworks sent letters through the air,” she says. Pip taps the brass opening with one careful hand. Somewhere beyond the water, another tube answers.',
  intro:'New tool: courier tubes. Walk Pip onto U1, then run Use to travel to the other U1. Walking and Wait never send Pip. Deliver flags 1–3 and finish paused at flag 3. One rewrite; dock sealed. The keeper still needs the lantern and beacon. Open Pip’s tube directory for endpoint coordinates.',
  hint:'East / Use / East advances four cards from the dock to the final flag. Use sends Pip only while standing on a tube, so the next East continues from the far endpoint. Advance one card keeps Pip paused between steps.',
  ending:'The first parcel crosses without getting a single corner wet. Pip waits by the far mailbox, looking quietly pleased.'},
 {title:'Three Rooftops',theme:'woodland',width:19,height:14,row:10,par:58,rewrites:1,
  passage:'The rooftops are separated by gardens nobody wants to trample. Two pairs of tubes still connect them. Tavi leaves a little wheel in your care. “Open the shutter first. The shortest route is sometimes the kindest one.”',
  intro:'Five ordered flags, two tube pairs and one rewrite. Turn your near wheel before Pip crosses the middle rooftop. Find one repeating loop that walks two tiles, uses a tube and continues on a different roof. Finish paused at flag 5. Matching U numbers identify pairs without relying on color.',
  hint:'Turn the near wheel. East / East / Use repeats through U1 and U2. Advance eight cards to reach flag 5, then leave Pip there. The final Use is not needed. Gather your light and return home.',
  ending:'Three rooftop gardens hear a familiar knock. The routes are old, but the letters are new.'},
 {title:'The Midnight Reply',theme:'clockwork',width:17,height:14,row:10,par:58,rewrites:3,
  passage:'At midnight the Parcelworks receives a reply: “I heard your bell. Can you hear mine?” Pip reads the return address. A good delivery is not always a one-way journey.',
  intro:'Three rewrites, four deliveries and a two-note melody. Send Pip through U1 to ring Far. Bring it back through the same pair, then ring Reply at the last flag. Leave Pip paused there. Mirror directions is a free way to draft the return loop; Apply still spends one rewrite.',
  hint:'East / East / Use advanced six times reaches and rings Far. Mirror to West / West / Use; Apply and advance three cards to return through U1. Apply West / Use / West and advance twice to ring Reply at flag 4.',
  ending:'The reply is only two notes long. Even so, the whole workshop stops to listen.'},
 {title:'The Freight Lock',theme:'coast',width:19,height:15,row:11,par:66,rewrites:1,
  passage:'A freight shutter has settled across the canal. Your plate controls one bridge; a remote wheel controls another. Pip gives its satchel a reassuring pat. This delivery needs both of you to keep a promise.',
  intro:'Six deliveries and only one rewrite. Hold the near jade plate while Pip crosses. Its loop must use U1, operate the far wheel, find U2 and park on the violet plate. A blocked direction still advances the card. Ring the keeper’s bell before bringing the light home.',
  hint:'Stand north on the near plate. East / Use / East advanced nine cards reaches the final violet plate, using the remote wheel on the way. Card 7 is deliberately blocked beside U2; card 8 then uses the tube. Leave Pip paused, cross the lower route and ring your bell.',
  ending:'The freight shutter lifts. Beneath it, someone has scratched two names into the brass: yours and Pip’s.'},
 {title:'The Night Mail',theme:'clockwork',width:21,height:16,row:12,par:75,rewrites:2,
  passage:'The last delivery sheet has seven addresses and no spare ink. Beyond the windows, the whole town is asleep. Tavi places a blank envelope beside the route. “When this is finished, write a route of your own. Someone else will be glad to find it.”',
  intro:'Seven ordered deliveries, three tube pairs, two rewrites and two keeper-controlled crossings. Open the near wheel, then hold the jade plate for Pip’s middle crossing. Send it through all three tube pairs before rewriting for the final wheel and parking plate. Both travelers must finish their jobs.',
  hint:'Turn the near wheel and step north onto the jade plate. East / East / Use advanced nine cards visits all three tube pairs and delivers flags 1–6. Apply East / Use / East and advance three cards to operate the last wheel and park at flag 7. Keep Pip paused while you fetch the far light.',
  ending:'Seven windows glow as the mail arrives. Back at the Parcelworks, Pip slides the blank envelope toward you. There is room for a new world inside. Build it, test the return journey, and send someone an adventure.'},
];
export function parcelworksWorld(id,{proof=true}={}){
 const index=PARCELWORKS_LEVELS.indexOf(id);if(index<0)throw Error('Choose a Parcelworks adventure.');
 const spec=chapters[index],{width,height,row}=spec,base=blankAdventure(width,height),map=structuredClone(base.map);map.name=spec.title;
 for(const [i,layer]of map.layers.entries())layer.tiles.fill(i===0?3:0);
 const floor=(x,y,tile=5)=>map.layers[0].tiles[y*width+x]=tile,line=(x1,x2,y)=>{for(let x=x1;x<=x2;x++)floor(x,y);};
 for(let y=row-1;y<height-1;y++)for(let x=1;x<width-1;x++)floor(x,y,y===row?5:1);
 const markers=[],add=(kind,id,x,y,extra={})=>markers.push({kind,id,x,y,...extra}),flag=(n,x,y,name,required=false)=>add('pip-stop','flag-'+n,x,y,{order:n,name,required}),pair=(channel,a,b)=>{add('pip-tube',channel+'-in',...a,{channel,name:channel+' dispatch'});add('pip-tube',channel+'-out',...b,{channel,name:channel+' arrival'});};
 add('start','start',2,row);add('beacon','home',2,row+1);add('lantern','light',width-4,row);add('coin','coin-one',width-2,row-1);add('coin','coin-two',width-2,height-2);
 add('clockwork','pip',index===3?3:2,2,{name:'Pip',program:['wait','wait','wait'],rewrites:spec.rewrites,dockLocked:true});
 if(index===0){line(2,3,2);line(9,11,2);pair('amber',[3,2],[9,2]);flag(1,3,2,'Dispatch window');flag(2,9,2,'Across the air');flag(3,11,2,'Seaside mailbox',true);}
 if(index===1){line(2,4,2);line(8,10,4);line(14,16,2);pair('amber',[4,2],[8,4]);pair('jade',[10,4],[14,2]);floor(9,4,3);add('door','roof-shutter',9,4,{channel:'amber'});add('lever','near-wheel',3,row,{channel:'amber',name:'Garden shutter',required:true});flag(1,4,2,'First roof');flag(2,8,4,'Garden arrival');flag(3,10,4,'Second dispatch');flag(4,14,2,'High arrival');flag(5,16,2,'Sky mailbox',true);}
 if(index===2){line(2,4,2);line(10,12,4);pair('amber',[4,2],[10,4]);add('bell','far-note',12,4,{name:'Far',order:1});add('bell','reply-note',3,2,{name:'Reply',order:2});flag(1,4,2,'Outward letter');flag(2,10,4,'Night arrival');flag(3,12,4,'Far bell');flag(4,3,2,'The reply',true);}
 if(index===3){line(3,12,2);line(15,16,4);pair('amber',[4,2],[9,2]);pair('jade',[12,2],[15,4]);floor(10,2,3);add('bridge','freight-crossing',10,2,{channel:'jade'});add('plate','near-plate',2,row-1,{channel:'jade'});add('lever','far-wheel',11,2,{channel:'amber',name:'Freight wheel',required:true});add('plate','parking-plate',16,4,{channel:'violet'});add('bell','keeper-note',11,row,{name:'Keeper',order:1});
  for(let y=row-1;y<height-1;y++){floor(7,y,3);floor(13,y,3);}add('door','lower-shutter',7,row,{channel:'amber'});add('bridge','home-crossing',13,row,{channel:'violet'});
  [[4,2,'Dispatch'],[9,2,'Freight arrival'],[11,2,'Wheel parcel'],[12,2,'Canal dispatch'],[15,4,'Canal arrival'],[16,4,'Final lock']].forEach(([x,y,name],i)=>flag(i+1,x,y,name,i===5));}
 if(index===4){line(2,4,2);line(8,10,4);line(14,16,2);line(14,16,6);pair('amber',[4,2],[8,4]);pair('jade',[10,4],[14,2]);pair('violet',[16,2],[14,6]);floor(9,4,3);floor(15,2,3);add('bridge','midnight-crossing',9,4,{channel:'jade'});add('door','night-shutter',15,2,{channel:'blue'});add('lever','near-wheel',3,row,{channel:'blue',name:'Night shutter',required:true});add('plate','near-plate',2,row-1,{channel:'jade'});add('lever','far-wheel',15,6,{channel:'amber',name:'Last dispatch',required:true});add('plate','parking-plate',16,6,{channel:'violet'});
  for(let y=row-1;y<height-1;y++){floor(7,y,3);floor(14,y,3);}add('door','lower-shutter',7,row,{channel:'amber'});add('bridge','home-crossing',14,row,{channel:'violet'});
  [[4,2,'Canal dispatch'],[8,4,'Garden arrival'],[10,4,'Garden dispatch'],[14,2,'Roof arrival'],[16,2,'Roof dispatch'],[14,6,'Workshop arrival'],[16,6,'Last doorstep']].forEach(([x,y,name],i)=>flag(i+1,x,y,name,i===6));}
 map.layers[1].tiles[(row-1)*width+1]=10;map.layers[1].tiles[(height-2)*width+width-2]=10;
 let world=editAdventure(base,{title:spec.title,author:'Lantern Trails',source:'Parcelworks original',description:'A Pip courier-tube trial: separated rooms, ordered parcels, scarce rewrites and crossings to coordinate.',intro:spec.intro,hint:spec.hint,ending:spec.ending,theme:spec.theme,par:spec.par,map,markers});
 if(proof)world=editAdventure(world,{proof:{difficulty:'trail',actions:PARCELWORKS_CLEARS[id]}});return world;
}
export function parcelworksBook(){return normalizeBook({title:'Pip and the Midnight Parcelworks',author:'Lantern Trails',synopsis:'Five courier-tube adventures, from a first airborne letter to a seven-stop night-mail route. Connect distant rooms, mirror a return program and coordinate crossings with Pip. Every chapter is available to remix and share.',ending:chapters.at(-1).ending,chapters:PARCELWORKS_LEVELS.map((id,i)=>({world:parcelworksWorld(id),passage:chapters[i].passage}))});}
