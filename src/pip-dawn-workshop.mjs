// New owned material. See LICENSE; prior MIT permissions remain effective.
import {NIGHT_MAIL_MISSIONS} from './pip-night-mail.mjs';
import {transformProgram,transformPrismOperation} from './clockwork.mjs';
const colours=['amber','jade','violet','blue'];
function commission(baseId,{id,title,mirror='horizontal',palette=0,remove,parcels=2,relays,story,hint,ending}){
 const base=NIGHT_MAIL_MISSIONS.find(m=>m.id===baseId),point=p=>({x:mirror==='horizontal'?base.width-1-p.x:p.x,y:mirror==='vertical'?base.height-1-p.y:p.y}),operation=mirror==='horizontal'?'mirror':'mirror-y',prism=mirror==='horizontal'?'mirror-x':'mirror-y',colour=c=>c==='any'?c:colours[(colours.indexOf(c)+palette)%4];
 const change=p=>({...p,...point(p),...(p.channel?{channel:colour(p.channel)}:{}),...(p.output?{output:colour(p.output)}:{}),...(p.program?{program:transformProgram(p.program,operation)}:{}),...(p.alternate?{alternate:transformProgram(p.alternate,operation)}:{}),...(p.operation?{operation:transformPrismOperation(p.operation,prism)}:{}),...(p.kind==='receiver'?{parcels}:{})});
 const missing=[...(base.solutionParts||[]),...base.fixed.filter(remove)].map(change),inventory={};for(const part of missing)inventory[part.kind]=(inventory[part.kind]||0)+1;
 return {...base,id,title,collection:'dawn-workshop',difficulty:'Master',minutes:'15–30 min',road:base.road.map(point),starts:base.starts.map(point),fixed:base.fixed.filter(p=>!remove(p)).map(change),programs:base.programs.map(p=>transformProgram(p,operation)),solution:base.solution.map(p=>transformProgram(p,operation)),solutionParts:missing,budget:missing.length,inventory,relays:relays??base.relays,story,hint,ending};
}
export const DAWN_WORKSHOP_MISSIONS=Object.freeze([
 commission('duo-cargo-crossroads',{id:'duo-dawn-library',title:'The Reversed Route Library',remove:p=>p.kind==='cargo'||p.kind==='prism'&&p.x===9&&p.y===1,
  story:'Tavi: “I mirrored the night sorting room for the morning queue. Now two pieces are missing.” Restore a cargo compass and a returning mirror. The letters travel west this time. Fill the window twice through two locker relays.',
  hint:'Place a cargo compass at column 6, row 2: Any parcel; Otherwise East / East / Use; Matching West / West / Use. Place an East/West mirror at column 2, row 2. Both companions start West / West / Use. The second letter arrives on tick 45.',
  ending:'Tavi shelves the repaired compass beside its old drawing. “A road can face the other way,” she says, “and still keep its promise.”'}),
 commission('duo-twin-depots',{id:'duo-dawn-relay',title:'The Quiet Relay',mirror:'vertical',remove:p=>p.kind==='locker'&&p.channel==='blue',
  story:'Moss: “The greenhouse roads have traded banks. Both blue locker ends are missing.” Restore the right connection and give each end the right job. Four letters must cross between partners; leave the lockers empty and bring both couriers home.',
  hint:'Use blue connection 4 for both missing lockers. At column 8, row 2, make a Send-only locker. At column 8, row 5, make a Collect-only locker. Pip starts East / East / Use; Sprout starts West / West / Use. Both flags are reached on tick 61.',
  ending:'Moss closes the quiet lockers. The two greenhouse keys are warm from different pockets.'}),
 commission('duo-blue-promise',{id:'duo-dawn-dyehouse',title:'Three Invitations at Daybreak',mirror:'vertical',palette:1,parcels:3,relays:3,remove:p=>p.kind==='press',
  story:'Rook: “A fresh palette, three amber invitations, and two empty recipe bays.” This morning version of the dyehouse sends violet parcels through blue lockers. Repair both recipes, then coordinate three locker relays to fill the far window.',
  hint:'At column 6, row 2, press jade into violet. At column 8, row 6, press violet into amber. Both companions start East / East / Use. Deliveries arrive on ticks 24, 54 and 84; the blue locker connection carries violet parcels.',
  ending:'Rook lays three amber invitations on a clean cloth. For once, the cloth stays clean. The two couriers do not.'}),
 commission('duo-tube-repair',{id:'duo-dawn-express',title:'The Last Lantern Express',parcels:3,relays:3,remove:p=>p.kind==='press',
  story:'Eid: “Four pieces to repair, three blue letters, two paper hats to bring home.” The brass road now faces west. Restore both recipes, its cargo compass and the missing tube end. Inspect the route before sending the last collection.',
  hint:'Cargo compass at (8,2): Jade; Otherwise East / East / Use; Matching West / Use / Wait. Violet tube at (12,4). Press amber → jade at (8,6); jade → blue at (11,4). Both start West / West / Use. Deliver on 26, 60 and 94; both return on 98.',
  ending:'The last blue lamp answers the morning sun. Eid leaves the workshop door open: “Your road next.”'})
].map((m,i)=>Object.freeze({...m,chapter:i+13})));
