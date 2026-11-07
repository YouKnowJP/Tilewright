// New owned material. See LICENSE; prior MIT permissions remain effective.
const p=(x,y)=>({x,y}),row=(y,a,b)=>Array.from({length:b-a+1},(_,i)=>p(a+i,y)),col=(x,a,b)=>Array.from({length:b-a+1},(_,i)=>p(x,a+i)),road=(...parts)=>[...new Map(parts.flat().map(p=>[`${p.x},${p.y}`,p])).values()];
const part=(kind,point,fields={})=>({kind,...point,...fields}),q=(point,channel)=>part('source',point,{channel}),n=(point,channel,parcels=1)=>part('receiver',point,{channel,parcels}),v=point=>part('vane',point,{operation:'rotate'}),bridge=(point,channel)=>part('bridge',point,{channel}),drum=(point,input,channel,delay)=>part('drum',point,{input,channel,delay}),kiln=(point,channel,input,quiet,powered)=>part('kiln',point,{channel,input,quiet,powered}),bowl=(point,channel,second,output)=>part('mixer',point,{channel,second,output});
const counter=(point,channel,threshold,duration,courier,phase=0)=>part('counter',point,{channel,threshold,phase,duration,courier});
const E=['right','right','use'],W=['left','left','use'],hold=['wait','wait','use'];
// Indexed clockwise road positions make every other square a possible Use stop.
function circuit(x,y,w,reverse=false){const route=[...row(y,x,x+w),p(x+w,y+1),...row(y+2,x,x+w).reverse(),p(x,y+1)];const cells=reverse?route.map(c=>p(2*x+w-c.x,2*y+2-c.y)):route;return {cells,at:d=>cells[d],corners:[0,w,w+2,2*w+2].map(d=>v(cells[d]))};}
const open=circuit(1,1,10),upper=circuit(0,0,10),lower=circuit(2,5,10,true),loft=circuit(1,1,8),cellar=circuit(3,5,8,true);
const startCorner=c=>c.corners[0],otherCorners=c=>c.corners.slice(1);
const scenes=[
 {
  id:'duo-counter-crossing',title:'The Second Footfall',width:7,height:5,difficulty:'Expert',minutes:'10–20 min',
  story:'Moss: “Let the first footfall pass. The second is the one that opens the river.” Restore the counter and press. Sprout can pace between two stones while Pip carries a letter across the timed bridge. Use never adds a mark.',
  hint:'Pip East / East / Use; Sprout East / West / Wait. Counter (2,5): amber, every 2 arrivals, start 0 marks, 3 powered turns, Sprout. Press (5,2): amber → jade. Sprout enters on turns 1 and 4; the second powers turns 5–7. Pip crosses on 7 and delivers on 9.',
  ending:'Moss counts two quiet taps against the wood, then hears the letter land. The river knows their rhythm now.',
  road:road(row(1,0,6),row(4,0,1)),starts:[p(0,1),p(0,4)],solution:[E,['right','left','wait']],
  fixed:[q(p(2,1),'amber'),bridge(p(5,1),'amber'),n(p(6,1),'jade')],solutionParts:[counter(p(1,4),'amber',2,3,'sprout'),part('press',p(4,1),{channel:'amber',output:'jade'})]
 },{
  id:'duo-counter-relay',title:'The Borrowed Beat',difficulty:'Master',minutes:'20–40 min',
  story:'Tavi: “Each of you carries a beat the other needs.” Sprout’s marked counter heats Pip’s kiln. Pip’s counter sends a beat into the drum and across Sprout’s lower bridge. Deliver the blue letter with one handoff.',
  hint:'Pip East / East / Use; Sprout West / West / Use. Clockwise F at (12,2),(12,4),(2,7),(2,5). Sprout O (6,7): blue, every 2, start 1, 1 powered turn, Sprout. Pip O (9,2): amber, every 2, start 1, 1 powered turn, Pip. D (13,1): amber → violet, delay 2. I (6,2): blue power, amber → quiet jade / powered blue. Cargo compass (6,5): any; Otherwise Wait / Wait / Use, Matching East / East / Use. Kiln 6, bridge 13, handoff 27, delivery 30.',
  ending:'Tavi folds the blue letter into an envelope with two seals. “One beat from each of you,” she says. “That was enough.”',
  road:road(open.cells,row(6,1,9),col(1,4,6),row(4,1,7),p(12,0)),starts:[open.at(0),p(9,6)],solution:[E,W],handoffs:1,
  fixed:[startCorner(open),open.corners[3],q(open.at(2),'amber'),part('handoff',p(5,3)),bridge(p(1,5),'violet'),n(p(7,4),'blue')],
  solutionParts:[...open.corners.slice(1,3),v(p(1,6)),v(p(1,4)),counter(p(5,6),'blue',2,1,'sprout',1),counter(open.at(7),'amber',2,1,'pip',1),drum(p(12,0),'amber','violet',2),kiln(open.at(4),'blue','amber','jade','blue'),part('cargo',p(5,4),{channel:'any',program:hold,alternate:E})]
 },{
  id:'duo-counter-terraces',title:'The Alternating Terraces',difficulty:'Master',minutes:'25–55 min',
  story:'Nessa: “Eight windows, and the sky changes each time you come around.” One counter starts blank; the other starts with one mark. A single drum carries their beats to four kilns. Fill every window twice.',
  hint:'Pip East / East / Use; Sprout West / West / Use. Set all six loose F clockwise. Pip O (4,1): amber, every 2, start 0, 1 powered turn, Pip. Sprout O (6,6): amber, every 2, start 1, 1 powered turn, Sprout. D (13,1): amber → violet, delay 1. All four kilns: violet power, amber → quiet jade / powered blue. The first kiln pair uses on 6 each lap; the second on 24. Four laps fill sixteen orders by 138.',
  ending:'Nessa opens the last pair of shutters. Each terrace has seen both kinds of light, and every windowsill has two letters.',
  road:road(upper.cells,lower.cells,p(12,0)),starts:[upper.at(0),lower.at(0)],solution:[E,W],
  fixed:[...([upper,lower].flatMap(c=>[startCorner(c),q(c.at(2),'amber'),q(c.at(14),'amber'),n(c.at(6),'blue',2),n(c.at(8),'jade',2),n(c.at(18),'blue',2),n(c.at(20),'jade',2)]))],
  solutionParts:[...otherCorners(upper),...otherCorners(lower),counter(upper.at(3),'amber',2,1,'pip'),counter(lower.at(15),'amber',2,1,'sprout',1),drum(p(12,0),'amber','violet',1),...([upper,lower].flatMap(c=>[kiln(c.at(4),'violet','amber','jade','blue'),kiln(c.at(16),'violet','amber','jade','blue')]))]
 },{
  id:'duo-counter-home',title:'The Last Four Letters',difficulty:'Master',minutes:'30–60 min',
  story:'Eid: “Every second lap, send a little heat to your friend.” Mix two blends on each terrace, then reach both flags after the drum memories go quiet. The shorter bridge beats must outlast Use at the windows.',
  hint:'Pip East / East / Use; Sprout West / West / Use. All loose F clockwise. Pip O (5,2): amber, every 2, start 0, 1 powered turn, Pip. Sprout O (9,8): jade, every 2, start 0, 1 powered turn, Sprout. Return O (9,4),(5,6): every 1, start 0, 3 powered turns, Pip amber and Sprout jade. Drums delay 1: jade → violet (13,1), amber → blue (13,2). Pip kiln amber → blue/jade (6,2), bowl blue + jade → violet (8,2). Sprout kiln jade → amber/violet (8,8), bowl amber + violet → blue (6,8). Deliver on 48 and 108, cross on 109 and finish on 111.',
  ending:'Eid ties the four letters in a bundle. The counters rest with the drums, and each courier finds its flag in the quiet.',
  road:road(loft.cells,cellar.cells,p(12,0),p(12,1)),starts:[loft.at(0),cellar.at(0)],solution:[E,W],quietDrums:true,
  fixed:[startCorner(loft),startCorner(cellar),q(loft.at(2),'amber'),q(cellar.at(2),'jade'),n(loft.at(12),'violet',2),n(cellar.at(12),'blue',2),bridge(loft.at(13),'amber'),bridge(cellar.at(13),'jade'),part('pip-dock',loft.at(14)),part('sprout-dock',cellar.at(14))],
  solutionParts:[...otherCorners(loft),...otherCorners(cellar),counter(loft.at(3),'amber',2,1,'pip'),counter(cellar.at(3),'jade',2,1,'sprout'),counter(loft.at(11),'amber',1,3,'pip'),counter(cellar.at(11),'jade',1,3,'sprout'),drum(p(12,0),'jade','violet',1),drum(p(12,1),'amber','blue',1),kiln(loft.at(4),'violet','amber','blue','jade'),kiln(cellar.at(4),'blue','jade','amber','violet'),bowl(loft.at(6),'blue','jade','violet'),bowl(cellar.at(6),'amber','violet','blue')]
 }
];
export const COUNTER_HOUSE_MISSIONS=Object.freeze(scenes.map((m,i)=>Object.freeze({version:16,chapter:85+i,collection:'counter-house',width:13,height:9,handoffs:0,relays:0,emptyLockers:false,quietSwitches:false,quietBells:false,quietDrums:false,programs:[['wait','wait','wait'],['wait','wait','wait']],...m,budget:m.solutionParts.length,inventory:m.solutionParts.reduce((out,part)=>({...out,[part.kind]:(out[part.kind]||0)+1}),{})})));
