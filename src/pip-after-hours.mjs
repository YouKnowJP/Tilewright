// New owned material. See LICENSE; prior MIT permissions remain effective.
import {CANOPY_FAIR_MISSIONS} from './pip-canopy-fair.mjs';
import {transformProgram,transformPrismOperation} from './clockwork.mjs';
const colours=['amber','jade','violet','blue'];
function repair(index,{id,title,mirror,palette,remove,story,hint,ending}){
 const base=CANOPY_FAIR_MISSIONS[index],point=p=>({x:mirror==='horizontal'?12-p.x:p.x,y:mirror==='vertical'?8-p.y:p.y}),operation=mirror==='horizontal'?'mirror':'mirror-y',colour=c=>c==='any'?c:colours[(colours.indexOf(c)+palette)%4];
 const change=p=>({...p,...point(p),...(p.channel?{channel:colour(p.channel)}:{}),...(p.output?{output:colour(p.output)}:{}),...(p.program?{program:transformProgram(p.program,operation)}:{}),...(p.alternate?{alternate:transformProgram(p.alternate,operation)}:{}),...(p.operation?{operation:transformPrismOperation(p.operation,mirror==='horizontal'?'mirror-x':'mirror-y')}:{}),...(p.kind==='receiver'?{parcels:3}:{})});
 const solutionParts=[...base.solutionParts,...base.fixed.filter(remove)].map(change),inventory={};for(const p of solutionParts)inventory[p.kind]=(inventory[p.kind]||0)+1;
 return {...base,id,title,collection:'after-hours',chapter:21+index,difficulty:'Master',minutes:'20–35 min',road:base.road.map(point),starts:base.starts.map(point),fixed:base.fixed.filter(p=>!remove(p)).map(change),programs:base.programs.map(p=>transformProgram(p,operation)),solution:base.solution.map(p=>transformProgram(p,operation)),solutionParts,budget:solutionParts.length,inventory,relays:index===0?3:base.relays,handoffs:index===1?3:base.handoffs,story,hint,ending};
}
export const AFTER_HOURS_MISSIONS=Object.freeze([
 repair(0,{id:'duo-after-lift',title:'The Lift Beneath the Stars',mirror:'vertical',palette:2,remove:p=>p.kind==='prism'&&p.x===11,
  story:'Tavi: “The fair has turned upside down, and three blue letters are still waiting below.” This after-hours variation needs a recipe, a cargo compass and the balcony return mirror. Violet wells feed blue recipes; amber lockers carry the letters.',
  hint:'Pip starts East / East / Use; Sprout South / South / Use. Press violet → blue at (6,6). Cargo at (8,8): Any; Otherwise North / North / Use; Matching East / East / Use. East/West mirror at (12,8). Three deliveries are required.',
  ending:'The last blue letter reaches the lower balcony. Tavi turns off the work lamp and lets the stars do the rest.'}),
 repair(1,{id:'duo-after-bell',title:'Three Rings for the Moon',mirror:'horizontal',palette:1,remove:p=>p.kind==='prism'&&p.x===9,
  story:'Moss: “A westbound road, three violet parcels, and a bell that must wait for every one.” Restore a jade-to-violet recipe and both returning mirrors in this mirrored handoff challenge. The waiting compass wakes only when Pip passes a letter.',
  hint:'Pip: West / West / Use. Sprout: Wait / Wait / Use. Press jade → violet at (8,6). East/West mirror at (4,6); North/South mirror at (6,1). Keep Sprout waiting at (6,5) until each of three handoffs arrives.',
  ending:'The moon hears three quiet rings. Moss puts the timetable away; the two couriers have learned to listen.'}),
 repair(2,{id:'duo-after-rain',title:'The Last Rain Rehearsal',mirror:'vertical',palette:1,remove:p=>p.kind==='plate',
  story:'Rook: “Three amber scores. Four missing pieces. One bridge that must stay held.” Repair the pressure plate, the return mirror and both violet tube ends in this inverted rain-bridge variation. Tubes keep their connection colour; letters stay amber.',
  hint:'Both companions: East / East / Use. Amber plate at (4,8). East/West mirror at (12,8). Violet tube ends at (8,4) and (8,8). Pip must hold the plate until Sprout has delivered all three scores.',
  ending:'The final score is dry. The bridge has kept its promise through every return, and Rook finally takes a bow.'}),
 repair(3,{id:'duo-after-lanterns',title:'Six Letters Before Sunrise',mirror:'vertical',palette:3,remove:p=>p.kind==='press',
  story:'Eid: “Six letters, six repairs, and two hats still far from home.” This inverted tower finale needs every recipe and both collecting lockers restored. Fill both windows three times, empty the lockers, then let the signals send both couriers home.',
  hint:'Pip East / East / Use; Sprout West / West / Use. Collect violet at (4,2), blue at (10,2). Recipes: blue → violet (2,4), amber → jade (12,4), blue → amber (6,6), jade → blue (8,6). Both home flags are now below the towers.',
  ending:'Six letters and two paper hats arrive before sunrise. Eid closes the fair’s ledger, leaving six blank lines for the collection you will write next.'})
].map(Object.freeze));
