// New owned material. See LICENSE; prior MIT permissions remain effective.
const p=(x,y)=>({x,y}),row=(y,a,b)=>Array.from({length:b-a+1},(_,i)=>p(a+i,y));
const loop=(a,b)=>[...row(1,a,b),...row(7,a,b),...Array.from({length:5},(_,i)=>[p(a,i+2),p(b,i+2)]).flat()];
const part=(kind,x,y,extra={})=>({kind,x,y,...extra});
const R=['right','right','use'],L=['left','left','use'],U=['up','up','use'],W=['wait','wait','use'];
const glass=(x,y,operation='rotate')=>part('prism',x,y,{operation});
const well=(x,y,channel)=>part('source',x,y,{channel});
const window=(x,y,channel)=>part('receiver',x,y,{channel,parcels:2});
const press=(x,y,channel,output)=>part('press',x,y,{channel,output});
const locker=(x,y,channel,mode)=>part('locker',x,y,{channel,mode});
const cargo=(x,y,program,alternate)=>part('cargo',x,y,{channel:'any',program,alternate});
function mission(id,title,road,starts,fixed,solution,solutionParts,story,hint,ending,goals={}){
 const inventory={};for(const item of solutionParts)inventory[item.kind]=(inventory[item.kind]||0)+1;
 return {id,title,version:3,width:13,height:9,collection:'canopy-fair',difficulty:'Master',minutes:'15–30 min',road,starts,fixed,programs:[W,W],solution,solutionParts,budget:solutionParts.length,inventory,handoffs:0,relays:0,emptyLockers:false,story,hint,ending,...goals};
}
export const CANOPY_FAIR_MISSIONS=Object.freeze([
 mission('duo-bellflower-lift','The Bellflower Lift',[...loop(1,5),...row(1,7,11),...Array.from({length:6},(_,i)=>p(7,i+2))],[p(1,1),p(7,7)],
  [well(3,1,'amber'),glass(5,1),glass(5,7),locker(3,7,'violet','send'),glass(1,7),glass(1,1),locker(7,5,'violet','take'),glass(7,7,'mirror-y'),cargo(7,3,['down','down','use'],U),window(9,1,'jade'),glass(11,1,'mirror')],
  [R,U],[press(5,3,'amber','jade'),cargo(7,1,['down','down','use'],R)],
  'Tavi: “The fair opens above the trees. Our lift must wait for real letters, not empty pockets.” Repair a recipe and a cargo compass. Pip tours the western tower; Sprout waits below the eastern balcony. Carry two jade invitations through violet lockers.',
  'Pip starts East / East / Use; Sprout starts North / North / Use. Put an amber → jade press at (6,4). At (8,2), match Any parcel: Otherwise South / South / Use; Matching East / East / Use. The western corners turn clockwise; the lower compass waits for real cargo.',
  'Two jade invitations reach the balcony. Tavi hangs a tiny bell on the locker: the lift now rings only when it has something to carry.',{relays:2}),
 mission('duo-patient-bell','The Bell That Waits',[...row(5,1,9),p(7,4),p(7,3),p(7,2),p(7,1),p(7,0)],[p(1,5),p(7,4)],
  [glass(1,5,'mirror'),well(3,5,'amber'),part('handoff',7,5),glass(9,5,'mirror'),window(7,2,'jade'),cargo(7,4,W,U)],
  [R,W],[press(5,5,'amber','jade'),glass(7,0,'mirror-y')],
  'Moss: “Sprout keeps leaving before Pip arrives. Can a bell wait until its pocket is full?” Restore the recipe and northern return mirror. Pip must hand over two jade parcels; Sprout must collect each before climbing to the window.',
  'Pip: East / East / Use. Sprout: Wait / Wait / Use. Put an amber → jade press at (6,6) and a North/South mirror at (8,1). The compass under Sprout waits with empty hands and chooses North / North / Use with a parcel. Pip acts first, so a handoff can wake Sprout on the same tick.',
  'The bell rings twice, exactly when it should. Moss folds the timetable into a paper bird. “Waiting can be part of the road.”',{handoffs:2}),
 mission('duo-rain-bridge','The Rain-Bridge Orchestra',[...row(1,1,3),...row(1,7,11),...row(5,1,7)],[p(1,1),p(1,5)],
  [part('plate',3,1,{channel:'blue'}),part('bridge',5,5,{channel:'blue'}),well(3,5,'blue'),glass(1,5,'mirror'),window(9,1,'blue')],
  [R,R],[glass(11,1,'mirror'),part('tube',7,5,{channel:'jade'}),part('tube',7,1,{channel:'jade'})],
  'Rook: “One courier holds the rain bridge; the other carries the music.” Repair a return mirror and a complete tube pair. Keep Pip on the blue plate while Sprout delivers twice through the jade shortcut. A blocked move still advances its card.',
  'Both companions start East / East / Use. Pip reaches the blue plate at (4,2) and stays because its road ends. Place an East/West mirror at (12,2) and jade tube ends at (8,6) and (8,2). The tube connection is jade; the letters remain blue.',
  'The bridge hums while Pip holds the beat. Sprout delivers the second score, and the whole canopy answers in the rain.'),
 mission('duo-canopy-homecoming','When Every Lantern Comes Home',[...loop(1,5),...loop(7,11),p(1,0),p(11,0)],[p(1,1),p(11,1)],
  [part('signal',1,1,{channel:'violet',program:R,alternate:['up','wait','use']}),well(3,1,'amber'),glass(5,1),press(5,3,'amber','jade'),locker(5,5,'amber','send'),glass(5,7),glass(1,7),window(1,3,'blue'),part('pip-dock',1,0),
   part('signal',11,1,{channel:'blue',program:L,alternate:['up','wait','use']}),well(9,1,'violet'),glass(7,1,'rotate-left'),press(7,3,'violet','amber'),locker(7,5,'blue','send'),glass(7,7,'rotate-left'),glass(11,7,'rotate-left'),window(11,3,'violet'),part('sprout-dock',11,0)],
  [R,L],[locker(3,7,'blue','take'),press(1,5,'amber','blue'),locker(9,7,'amber','take'),press(11,5,'jade','violet')],
  'Eid: “The fair closes when every lantern has a letter, and every paper hat is home.” Repair four pieces across two towers. Exchange four parcels through amber and blue lockers, complete both return recipes, empty the lockers, then follow the signals home.',
  'Pip starts East / East / Use; Sprout starts West / West / Use. Collect-only lockers: Blue at (4,8), Amber at (10,8). Return recipes: amber → blue at (2,6), jade → violet at (12,6). Both windows need two parcels. Signals watch the other tower before sending each courier north.',
  'Every lantern is lit. Both lockers are empty. Eid leaves one last invitation on the bench: “For the adventure you build next.”',{relays:4,emptyLockers:true})
].map((m,i)=>Object.freeze({...m,chapter:i+17})));
