// New owned material. See LICENSE; prior MIT permissions remain effective.
import {CLOCKTOWER_MISSIONS} from './pip-clocktower.mjs';
import {transformProgram,transformPrismOperation,PRISM_OPERATIONS,CLOCKWORK_LABELS} from './clockwork.mjs';
const colours=['amber','jade','violet','blue'];
function atlas(index,{id,title,mirrors,palette,remove,story,ending}){
 const base=CLOCKTOWER_MISSIONS[index],colour=c=>c==='any'?c:colours[(colours.indexOf(c)+palette)%4];
 const point=p=>({x:mirrors.includes('horizontal')?12-p.x:p.x,y:mirrors.includes('vertical')?8-p.y:p.y});
 const cards=p=>mirrors.reduce((p,m)=>transformProgram(p,m==='horizontal'?'mirror':'mirror-y'),p);
 const change=p=>({...p,...point(p),...(p.channel?{channel:colour(p.channel)}:{}),...(p.output?{output:colour(p.output)}:{}),...(p.program?{program:cards(p.program),alternate:cards(p.alternate)}:{}),...(p.operation?{operation:mirrors.reduce((op,m)=>transformPrismOperation(op,m==='horizontal'?'mirror-x':'mirror-y'),p.operation)}:{})});
 const solutionParts=[...base.solutionParts,...base.fixed.filter(remove)].map(change),inventory={};for(const p of solutionParts)inventory[p.kind]=(inventory[p.kind]||0)+1;
 const describe=p=>`${p.kind} (${p.x+1},${p.y+1})${p.operation?': '+PRISM_OPERATIONS[p.operation]:''}${p.channel?': '+p.channel:''}${p.output?' → '+p.output:''}${p.mode?' · '+p.mode:''}${p.program?'; Otherwise '+p.program.map(c=>CLOCKWORK_LABELS[c]).join(' / ')+'; Matching '+p.alternate.map(c=>CLOCKWORK_LABELS[c]).join(' / '):''}`;
 return {...base,id,title,collection:'star-atlas',chapter:29+index,minutes:'35–55 min',road:base.road.map(point),starts:base.starts.map(point),fixed:base.fixed.filter(p=>!remove(p)).map(change),programs:base.programs.map(cards),solution:base.solution.map(cards),solutionParts,budget:solutionParts.length,inventory,story,hint:`Pip: ${cards(base.solution[0]).map(c=>CLOCKWORK_LABELS[c]).join(' / ')}. Sprout: ${cards(base.solution[1]).map(c=>CLOCKWORK_LABELS[c]).join(' / ')}. Repair ${solutionParts.map(describe).join('; ')}. Coordinates are column, row.`,ending};
}
export const STAR_ATLAS_MISSIONS=Object.freeze([
 atlas(0,{id:'duo-atlas-west',title:'The Westward Constellation',mirrors:['horizontal'],palette:1,remove:p=>p.kind==='prism',
  story:'Tavi: “Read the clocktower in a looking glass. Its turning pieces are missing too.” This mirrored Clocktower variation needs eight repairs: a recipe, two lockers, a cargo compass and four prisms. Different courier speeds still matter. Deliver three violet letters and bring both hats home.',
  ending:'Tavi draws the western constellation from eight repaired corners. The map is different; the promise to return is the same.'}),
 atlas(1,{id:'duo-atlas-tide',title:'A Timetable Beneath the Tide',mirrors:['vertical'],palette:2,remove:p=>p.kind==='press'||p.kind==='locker'||p.kind==='prism'&&p.x===11&&p.y===7,
  story:'Moss: “Turn the timetable upside down, then rebuild every exchange.” This inverted spare-letter variation needs nine pieces: every recipe and locker, plus the eastern return prism. Two unequal loops must fill both windows three times. A spare parcel may remain in a full locker; both couriers still need their home flags.',
  ending:'Moss seals the underwater timetable in a glass jar. There is room for a spare letter and for a slower way home.'}),
 atlas(2,{id:'duo-atlas-comet',title:'The Comet’s Missing Crossing',mirrors:['horizontal','vertical'],palette:3,remove:p=>p.kind==='prism'||p.kind==='locker',
  story:'Rook: “The brass-minute map has turned halfway round. Ten pieces are missing.” Restore both tube ends, the recipe, both lockers, four turning prisms and the final cargo compass. The tube must cross the broken road. Three amber letters and two home flags finish this Clocktower variation.',
  ending:'The comet crosses the gap without losing a letter. Rook leaves ten bright repair marks on the atlas for the next cartographer.'}),
 atlas(3,{id:'duo-atlas-home',title:'Twelve Stars to Guide Us Home',mirrors:['horizontal'],palette:0,remove:p=>p.kind==='prism'&&(p.x===7||p.y===7&&p.x!==5),
  story:'Eid: “Twelve repairs. Two interlocking constellations. Read the reflected home flags carefully.” This mirrored ledger finale removes all four recipes, all four lockers and four turning prisms. Deliver six letters, empty both locker channels and return both couriers home. There is no real-time deadline.',
  ending:'Eid joins the twelfth star to the first. Two paper hats are home, and the atlas has a blank page waiting for a collection made by you.'})
].map(Object.freeze));
