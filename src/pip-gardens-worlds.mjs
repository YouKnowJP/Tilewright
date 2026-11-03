// New owned material. See LICENSE; earlier MIT permissions remain effective.
import {blankAdventure,editAdventure} from './workshop-model.mjs';
import {normalizeBook} from './storybook-model.mjs';
export const GARDEN_LEVELS=Object.freeze(['two-ways-home','pendulum-post','amber-pendulum','garden-ferry','fourfold-braid','clockwork-gardens']);
const walk=(d,n)=>Array(n).fill(d),loop=n=>['clockwork-toggle',...walk('wait',n),'clockwork-toggle'];
const specs=[
 {title:'Two Ways Home',width:15,height:13,row:9,cards:12,program:['right','right','use'],theme:'woodland',par:70,
 passage:'Tavi plants a little brass sign beside the garden path. Its two faces point to different roads. “This one remembers,” she says. Pip turns the sign over, then follows its first arrow.',
 intro:'Z is a flip stamp. Use loads Route A, then Route B on the next visit, alternating after that. Each stamp remembers its own next route. It keeps cargo and spends no rewrite. Visit the return glass, come back for Route B and ring the garden bell.',
 hint:'Apply East / East / Use. Start, wait twelve turns, then pause. Z first sends Pip north to a mirror. On returning, Z sends it east to the bell. Both routes must be loaded. Fetch the light and return home.',
 ending:'The sign remembers the path Pip has already taken. Its second arrow points toward home.'},
 {title:'Pendulum Post',width:17,height:15,row:11,cards:18,program:['up','up','use'],theme:'clockwork',par:95,
 passage:'Rook has turned the sign before you arrive. Pip will take Route B first. The garden does not ask which arrow comes first; it asks whether you can read the arrow waiting now.',
 intro:'A builder can start a flip stamp on Route B. Read Route hardware to see its next route. Follow the eastern return road, then take Route A west to Pip’s bell. Answer with the Home bell before crossing the garden gate.',
 hint:'Apply North / North / Use. Start, wait eighteen turns, then pause. Route B goes east to a mirror, then Route A goes west to Pip’s bell. Step east once and Interact with Home. Fetch the light and return to the beacon.',
 ending:'A different first arrow makes a different beginning. The two bells still find the same melody.'},
 {title:'The Amber Pendulum',width:19,height:15,row:11,cards:63,program:['right','right','use'],theme:'aurora',par:140,
 passage:'One road gathers amber. Another delivers jade. Between them, the kiln changes the parcel and the sign changes the road. Tavi draws a second line beneath the waiting window.',
 intro:'The flip stamp alternates collection and delivery roads without reading cargo. Convert amber to jade twice, power the two-parcel receiver and leave Pip paused back at the sign. Wrong-colour presses keep the parcel; a full source cannot replace it.',
 hint:'Apply East / East / Use. Start, wait sixty-three turns, then pause at Z. Route A goes south through the source, recipe and return glass. Route B goes east through the receiver and another return glass. Two full laps power the crossing.',
 ending:'The window shines twice. The garden has learned a rhythm, and Pip has kept the light safe through every turn.'},
 {title:'Hands of the Garden',width:19,height:15,row:11,cards:24,program:['right','right','use'],theme:'coast',par:130,
 passage:'The sign remembers its next road, but a bridge still needs a hand. Tavi holds out two painted stones. “The garden can remember,” she says. “You can choose when it is safe to move.”',
 intro:'Hold jade for the northbound source road. Pause after the return and move to violet for the ferry road. Route B sends amber through a jade recipe and a tube to its receiver. A flip stamp chooses a route, not a safe crossing: your timing matters.',
 hint:'Step east onto jade. Apply East / East / Use. Start, wait fifteen turns, then pause at Z with Route B loaded. Step east twice onto violet. Start, wait nine turns, then pause at N. Fetch the light through the powered parcel crossing and return home.',
 ending:'One hand makes room for the next. The ferry brings a jade parcel to a garden that remembered to wait.'},
 {title:'The Fourfold Braid',width:19,height:17,row:13,cards:39,program:['down','down','use'],theme:'woodland',par:125,
 passage:'Rook ties four ribbons to three signs. The middle sign alternates two gardens; each garden alternates two return roads. Pip sets its three cards beside the ribbons and studies the braid.',
 intro:'Three independent flip stamps make four different courier loops. Follow every flag and load both routes at all three signs. Tubes keep the current program. Short side programs use one direction, Wait and Use so their return landings can sit between the main roads.',
 hint:'Apply South / South / Use. Start, wait thirty-nine turns, then pause at the middle Z. The first side road goes west, the second east, the third south and the fourth north. All three signs must remember both routes. Fetch the light and return home.',
 ending:'The four ribbons form one braid. Each sign remembers only its own turn, and together they make a longer story.'},
 {title:'The Clockwork Gardens',width:23,height:17,row:13,cards:207,program:['down','down','use'],theme:'aurora',par:430,
 passage:'The garden opens its whole ledger: four return roads, two recipes, one amber well and a two-parcel jade window. Tavi rolls a crate toward a pressure stone. Rook waits beside the answering bell. “Let the roads remember. Keep your own part of the promise.”',
 intro:'The finale combines three route memories and a parcel that takes two braids to finish. Amber becomes blue on one road and blue becomes jade on another. Wrong recipes keep it safe until the right visit. Deliver jade twice, ring the bell duet, and use a crate to hold your garden bridge.',
 hint:'Apply South / South / Use. Start. Go north, east four, south, west twice to push the crate onto its plate; then east four to Home. Wait forty-two turns (54 helper cards including those twelve moves), then pause and ring Home. Start, wait 153 turns and pause. Fetch the far light; return to column 5, north, west twice and south twice around the crate.',
 ending:'Every window shines, but the ledger still has blank pages. Pip leaves a little two-faced sign beside your map. A garden is a place to return to—and a place to make something new.'},
];
export const GARDEN_CLEARS=Object.fromEntries(GARDEN_LEVELS.map((id,i)=>{
 const s=specs[i],program='clockwork-program:'+s.program.join(','),tail=[...walk('right',s.width-6),...walk('left',s.width-6),'down'];
 if(i===1)return[id,[program,...loop(18),'right','interact:home-note',...walk('right',10),...walk('left',11),'down']];
 if(i===3)return[id,['right',program,...loop(15),'right','right',...loop(9),...walk('right',10),...walk('left',13),'down']];
 if(i===5)return[id,[program,'clockwork-toggle','up',...walk('right',4),'down','left','left',...walk('right',4),...walk('wait',42),'clockwork-toggle','interact:home-note',...loop(153),...walk('right',11),...walk('left',15),'up','left','left','down','down']];
 return[id,[program,...loop(s.cards),...tail]];
}));
export function gardenWorld(id,{proof=true}={}){
 const index=GARDEN_LEVELS.indexOf(id);if(index<0)throw Error('Choose a Clockwork Gardens chapter.');
 const s=specs[index],{width,height,row}=s,base=blankAdventure(width,height),map=structuredClone(base.map),markers=[];map.name=s.title;map.layers.forEach((l,i)=>l.tiles.fill(i===0?3:0));
 const floor=(x,y,t=5)=>map.layers[0].tiles[y*width+x]=t,line=(a,b,y)=>{for(let x=a;x<=b;x++)floor(x,y);},vertical=(x,a,b)=>{for(let y=a;y<=b;y++)floor(x,y);},add=(kind,id,x,y,extra={})=>markers.push({kind,id,x,y,...extra});
 for(let y=row-1;y<height-1;y++)line(1,width-2,y);
 add('start','start',2,row);add('beacon','home',2,row+1);add('lantern','light',width-4,row);add('coin','coin-one',width-2,row-1);add('coin','coin-two',width-2,height-2);
 const dock=index===1?[4,6]:index>=4?[8,2]:[2,4];add('clockwork','pip',...dock,{name:'Pip',program:['wait','wait','wait'],rewrites:1,dockLocked:true});
 const flip=(n,x,y,program,alternate,initial=false)=>add('pip-flip','flip-'+n,x,y,{name:'Garden sign '+n,program,alternate,initial,both:true});
 const mirror=(n,x,y,operation='mirror-y',visits=1)=>add('pip-prism','glass-'+n,x,y,{name:'Return glass '+n,operation,visits,required:true});
 const flag=(n,x,y,required=false)=>add('pip-stop','flag-'+n,x,y,{name:'Garden '+n,order:n,required});
 const tube=(channel,a,b)=>{add('pip-tube',channel+'-out',...a,{channel,name:channel+' road'});add('pip-tube',channel+'-in',...b,{channel,name:channel+' return'});};
 const source=(x,y)=>add('pip-parcel','well',x,y,{channel:'amber',name:'Amber well'}),press=(n,x,y,channel,output,visits=1)=>add('pip-press','recipe-'+n,x,y,{channel,output,visits,required:true,name:'Garden recipe '+n});
 const receiver=(x,y,parcels=1)=>add('pip-socket','window',x,y,{channel:'jade',parcels,required:true,name:'Jade window'});
 const crossing=(x,kind='pip-lock',channel='jade')=>{for(let y=row-1;y<height-1;y++)floor(x,y,3);add(kind,'crossing-'+x,x,row,{channel});};
 if(index===0){line(2,6,4);vertical(4,2,4);flip(1,4,4,['up','up','use'],['right','right','use']);mirror(1,4,2);add('bell','pip-note',6,4,{name:'Pip',order:1});[[4,2],[4,4],[6,4]].forEach(([x,y],i)=>flag(i+1,x,y,i===2));crossing(7,'signal');}
 if(index===1){line(2,8,4);vertical(4,4,6);flip(1,4,4,['left','left','use'],['right','right','use'],true);mirror(1,8,4,'mirror');add('bell','pip-note',2,4,{name:'Pip',order:1});add('bell','home-note',3,row,{name:'Home',order:2});[[6,4],[8,4],[4,4],[2,4]].forEach(([x,y],i)=>flag(i+1,x,y,i===3));crossing(7,'signal');}
 if(index===2){line(2,8,4);vertical(4,4,10);flip(1,4,4,['down','down','use'],['right','right','use']);source(4,6);press(1,4,8,'amber','jade',2);receiver(6,4,2);mirror(1,4,10,'mirror-y',2);mirror(2,8,4,'mirror',2);[[4,6],[4,8],[8,4],[4,4]].forEach(([x,y],i)=>flag(i+1,x,y,i===3));crossing(9);}
 if(index===3){line(2,8,4);vertical(4,0,4);line(12,14,4);flip(1,4,4,['up','up','use'],['right','right','use']);source(4,2);mirror(1,4,0);press(1,6,4,'amber','jade');tube('amber',[8,4],[12,4]);receiver(14,4);floor(4,3,3);add('bridge','jade-bridge',4,3,{channel:'jade'});floor(5,4,3);add('bridge','violet-bridge',5,4,{channel:'violet'});add('plate','jade',3,row,{channel:'jade'});add('plate','violet',5,row,{channel:'violet'});[[4,2],[4,0],[4,4],[8,4],[14,4]].forEach(([x,y],i)=>flag(i+1,x,y,i===4));crossing(9);}
 if(index>=4){
  vertical(8,2,index===5?8:7);line(7,11,4);line(index===5?6:7,8,6);vertical(10,index===5?1:3,4);if(index===5)line(10,12,4);
  flip(1,8,4,['down','down','use'],['right','right','use']);flip(2,8,6,['left','wait','use'],['down','wait','use']);flip(3,10,4,['right','wait','use'],['up','wait','use']);
  tube('amber',[index===5?6:7,6],[9,4]);tube('jade',[8,index===5?8:7],[8,3]);tube('violet',[index===5?12:11,4],[7,4]);tube('blue',[10,index===5?1:3],[8,5]);
  if(index===4)[[8,6],[10,4],[8,7],[10,3],[8,4]].forEach(([x,y],i)=>flag(i+1,x,y,i===4));
  else{source(7,6);press(1,8,7,'amber','blue',2);press(2,11,4,'blue','jade',2);receiver(10,3,2);add('bell','pip-note',10,2,{name:'Pip',order:1});add('bell','home-note',8,row,{name:'Home',order:2});add('plate','garden-plate',3,row,{channel:'amber'});add('crate','garden-crate',5,row);crossing(7,'bridge','amber');crossing(13);[[7,6],[11,4],[8,7],[10,3],[10,2],[8,4]].forEach(([x,y],i)=>flag(i+1,x,y,i===5));}
 }
 for(const c of markers.filter(m=>m.kind==='coin'))map.layers[1].tiles[c.y*width+c.x]=10;
 let world=editAdventure(base,{title:s.title,author:'Lantern Trails',source:'Clockwork Gardens original',description:'Remembered routes, returning parcels and fourfold courier braids. Build a garden that changes its answer on the next visit.',intro:s.intro,hint:s.hint,ending:s.ending,theme:s.theme,par:s.par,map,markers});
 if(proof)world=editAdventure(world,{proof:{difficulty:'trail',actions:GARDEN_CLEARS[id]}});return world;
}
export function gardensBook(){return normalizeBook({title:'Pip and the Clockwork Gardens',author:'Lantern Trails',synopsis:'Six adventures in remembered routes: turn a two-faced sign, tend a ferry, weave four courier roads and grow a two-recipe garden from one well.',ending:specs.at(-1).ending,chapters:GARDEN_LEVELS.map((id,i)=>({world:gardenWorld(id),passage:specs[i].passage}))});}
