// New owned material. See LICENSE; prior MIT permissions remain effective.
import {CLOCKTOWER_MISSIONS} from './pip-clocktower.mjs';
const p=(x,y)=>({x,y}),row=(y,a,b)=>Array.from({length:b-a+1},(_,i)=>p(a+i,y)),part=(kind,x,y,extra={})=>({kind,x,y,...extra});
const RR=['right','right','use'],LL=['left','left','use'],RW=['right','wait','use'],LW=['left','wait','use'];
function mission(id,title,width,height,road,starts,parts,missing,solution,story,hint,ending,{quietSwitches=false,relays=0,emptyLockers=false,difficulty='Expert'}={}){
 const solutionParts=parts.filter(missing),inventory={};for(const part of solutionParts)inventory[part.kind]=(inventory[part.kind]||0)+1;
 return {id,title,version:4,width,height,collection:'lantern-workshop',difficulty,minutes:difficulty==='Tricky'?'10–20 min':'25–40 min',road,starts,fixed:parts.filter(p=>!missing(p)),solutionParts,budget:solutionParts.length,inventory,programs:[['wait','wait','wait'],['wait','wait','wait']],solution,handoffs:0,relays,emptyLockers,quietSwitches,story,hint,ending};
}
const clock=CLOCKTOWER_MISSIONS[0],clockParts=[...clock.fixed,...clock.solutionParts,part('latch',3,1,{channel:'amber'}),part('bridge',7,4,{channel:'amber'})];
export const LANTERN_WORKSHOP_MISSIONS=Object.freeze([
 mission('duo-lantern-first','A Light Left Behind',9,7,[...row(2,1,3),...row(5,1,7)],[p(1,2),p(1,5)],
  [part('latch',1,2,{channel:'amber'}),part('pip-dock',3,2),part('source',1,5,{channel:'amber'}),part('press',3,5,{channel:'amber',output:'jade'}),part('bridge',4,5,{channel:'amber'}),part('receiver',7,5,{channel:'jade',parcels:1})],p=>p.kind==='press',[['use','right','right'],['use','right','right']],
  'Tavi: “Use L to light the lantern, then leave it behind.” Its remembered amber power opens the matching bridge on the next tick. Repair the jade recipe. Pip can rest at home while Sprout crosses; nobody needs to hold a pressure plate.',
  'Both companions: Use / East / East. Place an amber → jade recipe at (4,6). Pip lights L on tick 1 and reaches home on 3. Sprout crosses the amber bridge on 5 and delivers on 10. A lit lantern stays lit after its courier leaves.',
  'Tavi leaves a paper shade on the lamp. “A useful light,” she says, “does not ask you to stand beside it forever.”',{difficulty:'Tricky'}),
 mission('duo-lantern-borrowed','Borrowed Light, Returned',9,7,[...row(2,1,5),...row(5,1,8)],[p(1,2),p(1,5)],
  [part('pip-dock',1,2),part('latch',3,2,{channel:'amber'}),part('prism',5,2,{operation:'mirror'}),part('source',3,5,{channel:'amber'}),part('bridge',4,5,{channel:'amber'}),part('press',5,5,{channel:'amber',output:'jade'}),part('receiver',7,5,{channel:'jade',parcels:1}),part('sprout-dock',8,5)],p=>['latch','prism','press'].includes(p.kind),[RR,RR],
  'Moss: “Borrow the bridge light, then return the quiet.” Restore three pieces. Pip must switch amber on, turn around and switch it off again. Sprout crosses during that window, makes jade and delivers. Both paper hats must be home with every lantern switch off.',
  'Both companions: East / East / Use. Amber lantern switch at (4,3); East/West mirror at (6,3); amber → jade recipe at (6,6). The lamp turns on at tick 3 and off at 9. Sprout crosses on 4; both couriers are home by 11.',
  'Moss finds the bridge quiet and both hats dry. The borrowed light has been returned, ready for somebody else’s road.',{quietSwitches:true}),
 mission('duo-lantern-post','The Remembering Night Post',13,9,clock.road,clock.starts,clockParts,
  p=>p.kind==='latch'||p.kind==='press'||p.kind==='locker'||p.kind==='cargo'&&p.y===1||p.kind==='prism'&&p.y===7&&p.x<=5,clock.solution,
  'Rook: “The bridge remembers the lamp, and the post remembers every letter.” Repair seven parts in this new Clocktower crossing. Pip’s amber switch opens Sprout’s bridge, then closes it on another lap. Three jade letters travel through violet lockers. Inspect the waiting ticks before changing the pace.',
  'Pip: East / Wait / Use. Sprout: North / North / Use. Amber switch (4,2); amber → jade recipe (5,2); violet lockers send (6,5), collect (8,6). Clockwise prisms at (6,8) and (2,8). Any-cargo compass (8,2): Otherwise South / South / Use; Matching East / East / Use. The fixed amber bridge opens one tick after L changes.',
  'Rook marks each waiting tick with a small star. The post is slower in places, but it has learned to remember the right light.',{relays:3,emptyLockers:true,difficulty:'Master'}),
 mission('duo-lantern-home','The Council of Two Lanterns',11,7,[...row(2,0,7),...row(5,1,10)],[p(1,2),p(1,5)],
  [part('signal',1,2,{channel:'blue',program:RR,alternate:LW}),part('pip-dock',0,2),part('latch',3,2,{channel:'amber'}),part('latch',5,2,{channel:'jade'}),part('prism',7,2,{operation:'mirror'}),part('prism',1,5,{operation:'mirror'}),part('source',3,5,{channel:'amber'}),part('bridge',4,5,{channel:'amber'}),part('press',5,5,{channel:'amber',output:'blue'}),part('bridge',6,5,{channel:'jade'}),part('receiver',7,5,{channel:'blue',parcels:2}),part('signal',9,5,{channel:'blue',program:LL,alternate:RW}),part('sprout-dock',10,5)],p=>['latch','source','press','receiver'].includes(p.kind)||p.kind==='prism'&&p.x===7||p.kind==='signal'&&p.x===9,[RR,RR],
  'Eid: “Two remembered lights. Two blue letters. A quiet homecoming.” Restore seven pieces. Amber and jade control separate bridges; blue windows control the return signals. Sprout may need to wait for another lighting cycle while returning for the second parcel. Finish with both hats home and every switch off.',
  'Both companions: East / East / Use. Amber L (4,3), jade L (6,3), East/West mirror (8,3). Amber well (4,6), amber → blue recipe (6,6), blue window with 2 letters (8,6). Blue signal (10,6): Quiet West / West / Use; Powered East / Wait / Use. Pip’s fixed blue signal sends it west when both letters arrive. Waiting at a dark bridge still advances a card.',
  'Eid closes the council ledger after the second blue letter. Both lanterns are off, both couriers are home, and a clean page waits for the collection you will make next.',{quietSwitches:true,difficulty:'Master'})
].map((m,i)=>Object.freeze({...m,chapter:33+i})));
