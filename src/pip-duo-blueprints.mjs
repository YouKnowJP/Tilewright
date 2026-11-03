// New owned material. See LICENSE; prior MIT permissions remain effective.
import {DUO_CHANNELS,normalizeDuoPart,normalizeDuoProject,duoEditable,duoText} from './pip-duo.mjs';
import {transformProgram,transformPrismOperation} from './clockwork.mjs';
const p=(x,y)=>({x,y}),part=(kind,x,y,extra={})=>({kind,x,y,...extra});
export const DUO_BLUEPRINTS=Object.freeze([
 {id:'recipe',name:'Parcel atelier',note:'Put a courier two tiles before Q. East / East / Use collects, converts and delivers. Choose different input and output parcels.'},
 {id:'return-sign',name:'A sign with two roads',note:'Use on Z chooses its next route. The northern glass returns the courier; the other bank opens the road to the right. Add your own wells and windows.'},
 {id:'tube-pair',name:'A little brass shortcut',note:'Use on either U travels to the other end of its colour. Keep one complete pair per tube colour.'},
 {id:'crossing',name:'A bridge for a friend',note:'One partner holds P while the other crosses B. The plate and bridge share a numbered colour.'}
]);
export function normalizeDuoBlueprint(raw){
 if(!raw||raw.format!=='pip-duo-blueprint'||raw.version!==1||!Number.isInteger(raw.width)||!Number.isInteger(raw.height)||raw.width<1||raw.width>13||raw.height<1||raw.height>9||!Array.isArray(raw.road)||raw.road.length>raw.width*raw.height||!Array.isArray(raw.parts)||!raw.parts.length||raw.parts.length>32)throw Error('Choose a duo blueprint with parts inside a garden-sized area.');
 const valid=p=>p&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.y>=0&&p.x<raw.width&&p.y<raw.height,road=[],parts=[];
 for(const cell of raw.road){if(!valid(cell)||road.some(p=>p.x===cell.x&&p.y===cell.y))throw Error('Blueprint roads must be unique and inside the piece.');road.push(p(cell.x,cell.y));}
 for(const rawPart of raw.parts){const item=normalizeDuoPart(rawPart);if(!valid(item)||!road.some(p=>p.x===item.x&&p.y===item.y)||parts.some(p=>p.x===item.x&&p.y===item.y))throw Error('Each blueprint part needs its own garden tile.');parts.push(item);}
 for(const c of DUO_CHANNELS){const count=parts.filter(p=>p.kind==='tube'&&p.channel===c).length;if(count!==0&&count!==2)throw Error('Capture or share both ends of each tube colour.');}
 return {format:'pip-duo-blueprint',version:1,name:duoText(raw.name,'A little invention'),author:duoText(raw.author,'A trail keeper'),note:duoText(raw.note,'A piece for your next adventure.',180),width:raw.width,height:raw.height,road,parts};
}
export function duoBlueprint(id,{input='amber',output='jade',channel='amber',initial=false,turns=0,parcels=1}={}){
 const spec=DUO_BLUEPRINTS.find(b=>b.id===id);if(!spec)throw Error('Choose a duo blueprint.');if(![input,output,channel].every(c=>DUO_CHANNELS.includes(c))||typeof initial!=='boolean'||!Number.isInteger(parcels)||parcels<1||parcels>3)throw Error('Choose known blueprint colours, routes and delivery targets.');
 let width,height,road,parts;
 if(id==='recipe'){if(input===output)throw Error('The atelier needs different input and output parcels.');width=5;height=1;road=Array.from({length:5},(_,x)=>p(x,0));parts=[part('source',0,0,{channel:input}),part('press',2,0,{channel:input,output}),part('receiver',4,0,{channel:output,parcels})];}
 if(id==='return-sign'){width=2;height=3;road=[p(0,0),p(0,1),p(0,2),p(1,2)];parts=[part('prism',0,0,{operation:'mirror-y'}),part('flip',0,2,{program:['up','wait','use'],alternate:['right','wait','use'],initial})];}
 if(id==='tube-pair'){width=3;height=1;road=[p(0,0),p(1,0),p(2,0)];parts=[part('tube',0,0,{channel}),part('tube',2,0,{channel})];}
 if(id==='crossing'){width=3;height=1;road=[p(0,0),p(1,0),p(2,0)];parts=[part('plate',0,0,{channel}),part('bridge',2,0,{channel})];}
 return configureDuoBlueprint({format:'pip-duo-blueprint',version:1,name:spec.name,author:'Lantern Trails',note:spec.note,width,height,road,parts},{turns});
}
export function configureDuoBlueprint(input,{turns=0,palette=0,first='keep'}={}){
 let piece=normalizeDuoBlueprint(input);if(!Number.isInteger(turns)||turns<0||turns>3||!Number.isInteger(palette)||palette<0||palette>3||!['keep','a','b'].includes(first))throw Error('Choose a blueprint direction, palette and first route.');
 const colour=c=>DUO_CHANNELS[(DUO_CHANNELS.indexOf(c)+palette)%4];piece={...piece,parts:piece.parts.map(p=>({...p,...(p.channel?{channel:colour(p.channel)}:{}),...(p.output?{output:colour(p.output)}:{}),...(p.kind==='flip'&&first!=='keep'?{initial:first==='b'}:{})}))};
 for(let i=0;i<turns;i++){
  const rotate=p=>({x:piece.height-1-p.y,y:p.x});
  piece={...piece,width:piece.height,height:piece.width,road:piece.road.map(rotate),parts:piece.parts.map(p=>({...p,...rotate(p),...(p.program?{program:transformProgram(p.program,'rotate')}:{}),...(p.alternate?{alternate:transformProgram(p.alternate,'rotate')}:{}),...(p.operation?{operation:transformPrismOperation(p.operation,'rotate')}:{})}))};
 }
 return normalizeDuoBlueprint(piece);
}
export function placeDuoBlueprint(input,piece,x,y){
 if(!duoEditable(input))throw Error('Remix a story before placing blueprints.');const a=normalizeDuoBlueprint(piece);if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x+a.width>input.board.width||y+a.height>input.board.height)throw Error('Move the cursor so the whole blueprint fits.');
 const shifted=a.parts.map(p=>({...p,x:p.x+x,y:p.y+y}));if(shifted.some(p=>input.parts.some(q=>p.x===q.x&&p.y===q.y)))throw Error('Place blueprint parts on free tiles. Existing parts stay safe.');
 const road=[...input.board.road];for(const p of a.road){const cell={x:p.x+x,y:p.y+y};if(!road.some(p=>p.x===cell.x&&p.y===cell.y))road.push(cell);}
 const {proof,...base}=input;return normalizeDuoProject({...base,parts:[...base.parts,...shifted],board:{...base.board,road}});
}
export function captureDuoBlueprint(input,{x,y,width,height},name='My little invention'){
 if(!duoEditable(input)||![x,y,width,height].every(Number.isInteger)||x<0||y<0||width<1||height<1||x+width>input.board.width||y+height>input.board.height)throw Error('Capture an area inside your duo garden.');
 const inside=p=>p.x>=x&&p.y>=y&&p.x<x+width&&p.y<y+height,shift=p=>({...p,x:p.x-x,y:p.y-y});
 return normalizeDuoBlueprint({format:'pip-duo-blueprint',version:1,name,author:input.author,note:'Captured from '+input.name,width,height,road:input.board.road.filter(inside).map(shift),parts:input.parts.filter(inside).map(shift)});
}
export function serializeDuoBlueprint(piece){return JSON.stringify(normalizeDuoBlueprint(piece))+'\n';}
export function parseDuoBlueprint(raw){if(typeof raw!=='string'||new TextEncoder().encode(raw).length>40_000)throw Error('Choose a duo blueprint smaller than 40 KB.');let p;try{p=JSON.parse(raw);}catch{throw Error('This blueprint is not valid JSON.');}return normalizeDuoBlueprint(p);}
