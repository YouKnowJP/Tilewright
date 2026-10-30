// New owned material. See LICENSE; prior MIT material retains its permissions.
import {blankAdventure,editAdventure} from './workshop-model.mjs';
import {normalizeBook} from './storybook-model.mjs';

export const ORCHESTRA_LEVELS=Object.freeze(['little-switch','walking-song','glass-switchyard','borrowed-bridge','countermelody','automaton-fair']);
const steps=n=>Array(n).fill('clockwork-step'),walk=(direction,n)=>Array(n).fill(direction);
const program=(...cards)=>'clockwork-program:'+cards.join(',');
export const ORCHESTRA_CLEARS={
 'little-switch':[program('right','right','use'),...steps(3),...walk('right',8),...walk('left',8),'down'],
 'walking-song':[program('right','use','right'),'clockwork-toggle',...walk('right',3),...walk('wait',5),'clockwork-toggle',...walk('right',5),...walk('left',8),'down'],
 'glass-switchyard':[program('right','right','use'),...steps(3),program('right','right','right'),...steps(5),program('down','down','use'),...steps(3),...walk('right',10),...walk('left',10),'down'],
 'borrowed-bridge':['right',program('right','right','right'),...steps(4),program('use','wait','wait'),'clockwork-step',...walk('right',8),...walk('left',9),'down'],
 'countermelody':['interact:opening',program('right','use','right'),...steps(2),'right','right','interact:answer',...steps(3),...walk('right',7),...walk('left',9),'down'],
 'automaton-fair':['up',program('right','right','right'),...steps(6),program('use','wait','wait'),'clockwork-step',program('right','use','left'),...steps(2),program('right','wait','wait'),'clockwork-step','down',...walk('right',7),'interact:home-note',...walk('right',5),...walk('left',12),'down'],
};
const chapters=[
 {title:'One Little Switch',theme:'clockwork',par:32,
  passage:'Tavi arrives with a box of brass bells. “The village has asked for an orchestra,” she says. Pip has three cards and absolutely no musical training. You give the little postkeeper a useful first instrument: a switch that listens.',
  intro:'Pip’s new Use card operates a lever or bell on the tile under its feet. Choose East, East, Use. While paused, Advance one card three times. The upper switch opens both crossings. Restore the far light and return to the beacon.',
  ending:'The switch clicks. It is a very small sound. Tavi writes FIRST INSTRUMENT on the box anyway.'},
 {title:'A Bell for Every Footstep',theme:'woodland',par:42,
  passage:'Three bells have been hung along the garden path. Pip reads the same three cards again and again. The melody will be longer than the program. Tavi calls this a tune. Pip calls it Tuesday.',
  intro:'Set East, Use, East and Start loop. After eight of your turns Pip will have played the three bells in order. Pause the loop, cross for the light, and come home. Quest lists the melody; Plan shows the next card.',
  ending:'Dew, Dusk, Moon. Three cards become eight footsteps and a song. A gardener opens a window to listen.'},
 {title:'The Glass Switchyard',theme:'coast',par:65,
  passage:'The glassworks has two silent windows. Its old diagrams describe everything except the helpful little machine now standing inside them. Tavi leaves a fresh page. “Write the route you wish had been here.”',
  intro:'Use East, East, Use and advance three cards for the first switch. Set three East cards and advance five times. Set South, South, Use and advance three times for the second switch. Both gates must stay open. Recover the far light, then return. Rehearse each loop for free before applying.',
  ending:'Two windows brighten. Tavi keeps your pencilled route beside the old diagrams. Tomorrow’s keepers will have a kinder map.'},
 {title:'The Borrowed Bridge',theme:'woodland',par:52,
  passage:'Pip waits at a crossing too heavy for one small foot. You can hold the near plate; Pip can reach the far switch. Neither of you has to be the one who does everything.',
  intro:'Step east onto the jade plate and stay there. Set three East cards and advance four times to carry Pip over the upper bridge. Set Use, Wait, Wait and advance once. The far switch opens your lower crossing. Leave Pip paused; take the light and return home.',
  ending:'The plate grows quiet when you step away. Across the water, a different bridge stays open. Helping can mean making room for someone else to move.'},
 {title:'The Countermelody',theme:'clockwork',par:48,
  passage:'The conductor has written a duet. Your bells answer Pip’s, and Pip’s answer yours. Tavi insists this is the most complicated arrangement in the village. Pip waits politely for its first note.',
  intro:'Ring Opening beside your starting point. Set East, Use, East, then advance two cards so Pip rings Echo. Walk east twice and ring Answer. Advance Pip three more cards for its final bell. The completed duet opens the signal gate. Quest keeps the order; Undo can recover a missed note.',
  ending:'Opening, Echo, Answer, Together. The conductor raises both hands, then lowers them. You and Pip already know when to listen.'},
 {title:'The Lantern Automaton Fair',theme:'coast',par:82,
  passage:'At dusk the village gathers by the water. A switch, a duet, two bridges, and a patient friend are all the orchestra needs. Tavi puts away her notebook. Tonight, the last page belongs to you.',
  intro:'Stand on the jade plate north of home. Advance Pip east six times; use its switch. Step it east and Use the first bell. Advance east once more to park on the violet plate. Leave Pip paused there. Cross your lower bridge, ring Home, restore the far light, and return. Rehearsal holds you still; use it to check each new loop.',
  ending:'The far lantern answers the bells. Windows fill with warm light, and someone begins a dance that has no written steps. Tavi gives you the blank notebook. Pip gives you a brass bow. What will you build together next?'},
];

export function orchestraWorld(id,{proof=true}={}){
 const index=ORCHESTRA_LEVELS.indexOf(id);if(index<0)throw Error('Choose a Pocket Orchestra chapter.');
 const spec=chapters[index],width=index===5?17:15,height=index===5?13:11,base=blankAdventure(width,height),map=structuredClone(base.map);
 map.name=spec.title;for(const [i,layer]of map.layers.entries())layer.tiles.fill(i===0?3:0);
 const ground=(x,y,tile=1)=>map.layers[0].tiles[y*width+x]=tile;
 for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++)ground(x,y);
 for(let y=1;y<height-1;y++)ground(7,y,3);
 for(let x=1;x<=6;x++)ground(x,4,3);
 for(let x=1;x<width-1;x++){if(x!==7)ground(x,2,5);if(x!==7)ground(x,index===5?9:7,5);}
 for(let y=1;y<height-1;y++){if(y!==4)ground(1,y,2);ground(width-2,y,4);}
 for(const [x,y]of [[1,1],[width-2,1],[width-2,height-2]])map.layers[1].tiles[y*width+x]=10;
 const markers=[],add=(kind,id,x,y,extra={})=>markers.push({kind,id,x,y,...extra});
 const row=index===2?8:index===5?9:7,light=index===2?12:index===5?14:index===3||index===4?11:10;
 add('start','start',2,row);add('beacon','home',2,row+1);
 add('clockwork','pip',index===3?5:index===5?3:2,index===3?3:2,{name:'Pip',program:['right','right','use']});
 add('lantern','light',light,row);add('coin','glimmer-a',light, row-1);add('coin','glimmer-b',width-2,height-2);
 if(index===0||index===2){add('lever','first-switch',4,2,{name:'Sun switch',channel:'amber',required:true});add('door','studio-door',3,4,{channel:'amber'});add('door','first-gate',7,row,{channel:'amber'});}
 if(index===1){for(const [i,x]of [3,5,7].entries()){if(x===7)ground(x,2,5);add('bell','note-'+i,x,2,{order:i+1,name:['Dew','Dusk','Moon'][i]});}add('signal','song-door',3,4);add('signal','song-gate',7,row);}
 if(index===2){add('door','glass-overpass',7,2,{channel:'amber'});add('lever','second-switch',9,4,{name:'Glass switch',channel:'jade',required:true});add('door','second-gate',9,row,{channel:'jade'});}
 if(index===3){add('plate','holding-plate',3,7,{channel:'jade'});add('bridge','shared-crossing',7,3,{channel:'jade'});add('lever','far-switch',9,3,{name:'Far-bank switch',channel:'amber',required:true});add('door','home-crossing',7,row,{channel:'amber'});add('door','garden-door',3,4,{channel:'amber'});}
 if(index===4){add('bell','opening',3,7,{name:'Opening',order:1});add('bell','echo',3,2,{name:'Echo',order:2});add('bell','answer',5,7,{name:'Answer',order:3});add('bell','together',5,2,{name:'Together',order:4});add('signal','duet-door',3,4);add('signal','duet-gate',7,row);}
 if(index===5){
  for(let y=1;y<height-1;y++){ground(12,y,3);ground(13,y,3);}
  add('plate','near-plate',2,8,{channel:'jade'});add('bridge','pip-crossing',7,2,{channel:'jade'});
  add('lever','fair-switch',9,2,{name:'Fairground switch',channel:'amber',required:true});add('door','fair-door',7,9,{channel:'amber'});add('door','left-door',3,4,{channel:'amber'});
  add('bell','pip-note',10,2,{name:'Pip',order:1});add('bell','home-note',10,9,{name:'Home',order:2});
  add('plate','far-plate',11,2,{channel:'violet'});add('signal','melody-gate',12,9);add('bridge','last-crossing',13,9,{channel:'violet'});
 }
 let world=editAdventure(base,{title:spec.title,author:'Lantern Trails',source:'Pocket Orchestra original',description:'Build a duet with Pip: remote switches, three-card melodies, free rehearsal, and shared crossings.',intro:spec.intro,hint:spec.intro,ending:spec.ending,theme:spec.theme,par:spec.par,map,markers});
 if(proof)world=editAdventure(world,{proof:{difficulty:'trail',actions:ORCHESTRA_CLEARS[id]}});return world;
}
export function orchestraBook(){return normalizeBook({title:'Pip and the Pocket Orchestra',author:'Lantern Trails',synopsis:'Six original peaceful chapters about making something together. Teach Pip to use switches and bells, write a repeating melody, build shared crossings, and bring a lantern fair to life.',ending:chapters[5].ending,chapters:ORCHESTRA_LEVELS.map((id,index)=>({world:orchestraWorld(id),passage:chapters[index].passage}))});}
