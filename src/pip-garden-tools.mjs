// New owned material. See LICENSE; prior MIT permissions remain effective.
import {transformEchoOperation} from './pip-echoes.mjs';
import {DUO_CHANNELS,duoEditable,normalizeDuoProject} from './pip-duo.mjs';
import {transformProgram,transformPrismOperation} from './clockwork.mjs';
const at=(a,b)=>a.x===b.x&&a.y===b.y;
function editable(input){if(!duoEditable(input))throw Error('Remix a story before reshaping its garden.');return normalizeDuoProject(input);}
function finish(input,patch){const {proof,...base}=input;return normalizeDuoProject({...base,...patch});}
export function transformDuoGarden(input,operation){
 let p=editable(input);if(!['right','left','horizontal','vertical','palette','partners'].includes(operation))throw Error('Choose a garden transformation.');
 if(operation==='partners')return finish(p,{starts:[p.starts[1],p.starts[0]],programs:[p.programs[1],p.programs[0]],parts:p.parts.map(part=>({...part,...(['seal','scale','counter'].includes(part.kind)&&part.courier!=='either'?{courier:part.courier==='pip'?'sprout':'pip'}:{}),...(part.kind==='pip-dock'?{kind:'sprout-dock'}:part.kind==='sprout-dock'?{kind:'pip-dock'}:{})}))});
 if(operation==='palette'){const colour=c=>DUO_CHANNELS.includes(c)?DUO_CHANNELS[(DUO_CHANNELS.indexOf(c)+1)%4]:c;return finish(p,{parts:p.parts.map(part=>({...part,...(part.channel?{channel:colour(part.channel)}:{}),...(part.output?{output:colour(part.output)}:{}),...(part.kind==='mixer'?{second:colour(part.second)}:{}),...(part.kind==='drum'?{input:colour(part.input)}:{}),...(part.kind==='weave'?{first:colour(part.first),second:colour(part.second)}:{}),...(part.kind==='kiln'?{input:colour(part.input),quiet:colour(part.quiet),powered:colour(part.powered)}:{}),...(part.kind==='scale'?{match:colour(part.match)}:{})}))});}
 const turns=operation==='left'?3:1;for(let i=0;i<turns;i++){
  const rotate=['right','left'].includes(operation),horizontal=operation==='horizontal',width=rotate?p.board.height:p.board.width,height=rotate?p.board.width:p.board.height;if(width<7||width>13||height<5||height>9)throw Error('This garden cannot turn inside the 7–13 column and 5–9 row limits. Mirror it, or resize it first.');
  const point=part=>rotate?{x:p.board.height-1-part.y,y:part.x}:horizontal?{x:p.board.width-1-part.x,y:part.y}:{x:part.x,y:p.board.height-1-part.y},cards=rotate?'rotate':horizontal?'mirror':'mirror-y',prism=rotate?'rotate':horizontal?'mirror-x':'mirror-y';
  p=finish(p,{board:{width,height,road:p.board.road.map(point)},starts:p.starts.map(point),programs:p.programs.map(program=>transformProgram(program,cards)),parts:p.parts.map(part=>({...part,...point(part),...(part.program?{program:transformProgram(part.program,cards)}:{}),...(part.alternate?{alternate:transformProgram(part.alternate,cards)}:{}),...(part.operation?{operation:part.kind==='echo'?transformEchoOperation(part.operation,prism):transformPrismOperation(part.operation,prism)}:{}),...(part.kind==='seal'&&part.heading!=='all'?{heading:transformProgram([part.heading,'wait','wait'],cards)[0]}:{})}))});
 }return p;
}
export function resizeDuoGarden(input,width,height,{anchor='corner'}={}){
 const p=editable(input);if(!Number.isInteger(width)||!Number.isInteger(height)||width<7||width>13||height<5||height>9||!['corner','centre'].includes(anchor))throw Error('Choose 7–13 columns, 5–9 rows and a garden anchor.');
 if(width===p.board.width&&height===p.board.height)return p;const dx=anchor==='centre'?Math.floor((width-p.board.width)/2):0,dy=anchor==='centre'?Math.floor((height-p.board.height)/2):0,point=part=>({...part,x:part.x+dx,y:part.y+dy}),inside=part=>part.x>=0&&part.y>=0&&part.x<width&&part.y<height,parts=p.parts.map(point),starts=p.starts.map(point);if([...parts,...starts].some(part=>!inside(part)))throw Error('Resize would cut off a companion or station. Move them first; nothing has changed.');return finish(p,{board:{width,height,road:p.board.road.map(point).filter(inside)},parts,starts});
}
export function editDuoArea(input,{x,y,width,height},brush){
 const p=editable(input);if(![x,y,width,height].every(Number.isInteger)||x<0||y<0||width<1||height<1||x+width>p.board.width||y+height>p.board.height||!['road','water','erase'].includes(brush))throw Error('Choose a rectangle inside your garden and an area brush.');
 const inside=part=>part.x>=x&&part.y>=y&&part.x<x+width&&part.y<y+height;if(brush==='water'&&[...p.parts,...p.starts].some(inside))throw Error('Move companions and remove stations before painting water. The whole area stays unchanged.');
 if(brush==='erase'){const parts=p.parts.filter(part=>!inside(part));return parts.length===p.parts.length?p:finish(p,{parts});}const road=p.board.road.filter(part=>!inside(part));if(brush==='road')for(let row=y;row<y+height;row++)for(let column=x;column<x+width;column++)road.push({x:column,y:row});
 if(road.length===p.board.road.length&&road.every(cell=>p.board.road.some(old=>at(old,cell))))return p;
 return finish(p,{board:{...p.board,road}});
}
