// New owned material. See LICENSE; prior MIT material retains its permissions.
import {blankAdventure,editAdventure} from './workshop-model.mjs';
import {normalizeBook} from './storybook-model.mjs';
export const ATLAS_LEVELS=Object.freeze(['staircase-courier','folded-river','return-address','brassbound-exchange']);
const steps=n=>Array(n).fill('clockwork-step'),walk=(d,n)=>Array(n).fill(d),program=(...cards)=>'clockwork-program:'+cards.join(',');
export const ATLAS_CLEARS={
 'staircase-courier':[program('right','down','right'),...steps(9),...walk('right',9),...walk('left',9),'down'],
 'folded-river':['interact:sluice',program('right','right','right'),...steps(7),program('down','down','down'),...walk('right',6),...steps(5),...walk('right',5),...walk('left',11),'down'],
 'return-address':[program('right','down','use'),...steps(9),program('left','up','use'),...steps(9),...walk('right',9),...walk('left',9),'down'],
 'brassbound-exchange':['up',program('right','right','use'),...steps(12),program('right','down','wait'),...steps(2),'down',...walk('right',9),'interact:home-note',...walk('right',5),...walk('left',14),'down'],
};
const chapters=[
 {title:'The Staircase Courier',theme:'woodland',par:42,rewrites:1,
  passage:'The atlas is bound with a brass clasp. Inside, every route has been rubbed away except four tiny addresses. “The maps in here ask for a little more trust,” Tavi says. Pip adjusts its satchel. You open the first page together.',
  intro:'Deliver to flags 1–4 in order and leave Pip paused at flag 4. You have one program rewrite; Return to dock is sealed. The staircase travels east twice and south once per loop. Choose the order carefully. Rehearsal and the program satchel are free; Undo can recover an edit.',
  hint:'A loop can step East, South, East. Test it against the narrow staircase. Advance nine cards, then leave Pip paused at the fourth flag. The keeper still needs the lantern and home beacon.',
  ending:'Pip leaves four envelopes where four people will find them. The atlas draws its first route in fresh ink.'},
 {title:'The Folded River',theme:'coast',par:61,rewrites:2,
  passage:'The second map folds a river over itself. One crossing answers a wheel; the other waits beneath your feet. Pip will need two straight programs. You will need to be in the right place between them.',
  intro:'Two rewrites, four deliveries, a sealed dock. Your near wheel opens Pip’s upper crossing. The jade plate opens its southern crossing. Send Pip east, then south; finish paused at flag 4. You can move freely while Pip is paused without spending a rewrite.',
  hint:'Turn the near wheel, then advance an East/East/East loop seven times. Write South/South/South. Stand on the jade plate before advancing five cards. Keep Pip at the last flag while you fetch the far lantern.',
  ending:'The map folds flat. Two journeys have become one crossing, and neither of you had to hurry.'},
 {title:'The Return Address',theme:'clockwork',par:59,rewrites:2,
  passage:'A parcel arrives addressed to the person who sent it. Tavi reads the note twice. “Some promises are only finished when they come home.” Pip looks at its own little dock, then at the far bell.',
  intro:'Deliver to flags 1, 2, then 3 at Pip’s dock. Two rewrites are allowed. Pip must play Far before Home and finish paused at flag 3. Repeating Use on a silent tile is safe; passing the Home bell early does not finish the melody. The keeper has a separate lantern to restore.',
  hint:'East/South/Use repeated three times reaches Far. West/North/Use repeated three times rings Home on the way back and returns Pip to flag 3. The dock button is sealed; this return trip must be walked.',
  ending:'The parcel contains a sketch of two friends beside a finished route. Nobody asks which one drew it.'},
 {title:'The Brassbound Exchange',theme:'coast',par:80,rewrites:2,
  passage:'The last page is blank until Pip places its satchel on it. Four addresses appear: a crossing, a switch, a bell, a place to wait. Tavi sets down the clasp. “You know the tools now. Make a route worth sharing.”',
  intro:'Four deliveries, two program rewrites, no dock return. Hold the near plate while Pip crosses. One repeating loop can operate the far switch and the next bell. Then park Pip at flag 4 to hold your final bridge. Ring Home, restore the far light and return. Read the manifest before spending a rewrite.',
  hint:'Stand on the near jade plate. East/East/Use runs twelve cards to deliver the first three flags, turn the switch and ring Pip’s bell. East/South/Wait advanced twice reaches the final violet plate. Leave Pip paused there while you ring Home and bring the light back.',
  ending:'The clasp opens. Behind the last page are eight little pockets for programs that have not been written yet. Tavi gives the atlas to you. “Keep the routes that helped. Share the ones that might help someone else.”'},
];
export function atlasWorld(id,{proof=true}={}){
 const index=ATLAS_LEVELS.indexOf(id);if(index<0)throw Error('Choose a Brassbound Atlas trial.');const spec=chapters[index],width=index===3?19:index===1?17:15,height=index===3?14:13,base=blankAdventure(width,height),map=structuredClone(base.map);map.name=spec.title;
 for(const [i,layer]of map.layers.entries())layer.tiles.fill(i===0?3:0);
 const floor=(x,y,tile=5)=>map.layers[0].tiles[y*width+x]=tile,rect=(x1,y1,x2,y2,tile=1)=>{for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++)floor(x,y,tile);};
 const row=index===1?9:index===3?10:9;rect(1,row-1,width-2,height-2);for(let x=1;x<width-1;x++)floor(x,row,5);
 const markers=[],add=(kind,id,x,y,extra={})=>markers.push({kind,id,x,y,...extra}),stop=(n,x,y,name,park=false)=>add('pip-stop','stop-'+n,x,y,{order:n,name,required:park});
 add('start','start',2,row);add('beacon','home',2,row+1);add('lantern','light',index===1?13:index===3?16:11,row);add('coin','treasure-one',width-2,row-1);add('coin','treasure-two',width-2,height-2);
 add('clockwork','pip',index===3?3:2,2,{name:'Pip',program:['wait','wait','wait'],rewrites:spec.rewrites,dockLocked:true});
 if(index===0){let p={x:2,y:2};floor(p.x,p.y);for(let i=0;i<3;i++)for(const [dx,dy]of [[1,0],[0,1],[1,0]]){p={x:p.x+dx,y:p.y+dy};floor(p.x,p.y);}stop(1,3,2,'First stair');stop(2,4,3,'Copper landing');stop(3,6,4,'High window');stop(4,8,5,'Last doorstep',true);}
 if(index===1){for(let x=2;x<=9;x++)floor(x,2);for(let y=2;y<=7;y++)floor(9,y);floor(7,2,3);floor(9,4,3);add('lever','sluice',3,9,{channel:'amber',name:'Near wheel',required:true});add('door','upper-crossing',7,2,{channel:'amber'});add('plate','holding-plate',8,9,{channel:'jade'});add('bridge','southern-crossing',9,4,{channel:'jade'});stop(1,5,2,'River post');stop(2,9,2,'Fold in the map');stop(3,9,5,'South-bank post');stop(4,9,7,'Stillwater',true);}
 if(index===2){let p={x:2,y:2};floor(2,2);for(let i=0;i<3;i++)for(const [dx,dy]of [[1,0],[0,1]]){p={x:p.x+dx,y:p.y+dy};floor(p.x,p.y);}for(let i=0;i<3;i++)for(const [dx,dy]of [[-1,0],[0,-1]]){p={x:p.x+dx,y:p.y+dy};floor(p.x,p.y);}add('bell','far-note',5,5,{order:1,name:'Far'});add('bell','home-note',3,3,{order:2,name:'Home'});stop(1,4,4,'Outward parcel');stop(2,5,5,'Far address');stop(3,2,2,'Pip’s own doorstep',true);}
 if(index===3){for(let x=3;x<=12;x++)floor(x,2);floor(12,3);for(let y=row-1;y<height-1;y++)for(const x of [7,13,14])floor(x,y,3);floor(7,2,3);add('plate','near-plate',2,9,{channel:'jade'});add('bridge','pip-crossing',7,2,{channel:'jade'});add('lever','exchange-switch',9,2,{channel:'amber',name:'Exchange wheel',required:true});add('door','keeper-crossing',7,10,{channel:'amber'});add('bell','pip-note',11,2,{order:1,name:'Pip'});add('bell','home-note',12,10,{order:2,name:'Home'});add('plate','far-plate',12,3,{channel:'violet'});add('signal','song-crossing',13,10);add('bridge','last-crossing',14,10,{channel:'violet'});stop(1,5,2,'Crossing parcel');stop(2,9,2,'Wheel parcel');stop(3,11,2,'Bell parcel');stop(4,12,3,'A place to wait',true);}
 for(const [x,y]of [[1,row-1],[width-2,height-2]])map.layers[1].tiles[y*width+x]=10;
 let world=editAdventure(base,{title:spec.title,author:'Lantern Trails',source:'Brassbound Atlas original',description:'A harder Pip route: ordered deliveries, a limited number of rewrites, a sealed dock and optional treasure detours.',intro:spec.intro,hint:spec.hint,ending:spec.ending,theme:spec.theme,par:spec.par,map,markers});
 if(proof)world=editAdventure(world,{proof:{difficulty:'trail',actions:ATLAS_CLEARS[id]}});return world;
}
export function atlasBook(){return normalizeBook({title:'Pip and the Brassbound Atlas',author:'Lantern Trails',synopsis:'Four advanced courier trials. Plan an ordered delivery route, work within a rewrite budget, coordinate river crossings, and bring a parcel home. Keep your favorite programs in a shareable satchel.',ending:chapters[3].ending,chapters:ATLAS_LEVELS.map((id,i)=>({world:atlasWorld(id),passage:chapters[i].passage}))});}
