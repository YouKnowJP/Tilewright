// New owned material. See LICENSE; prior MIT permissions remain effective.
import {duoEditable,normalizeDuoProject} from './pip-duo.mjs';
import {normalizeDuoBlueprint} from './pip-duo-blueprints.mjs';
const same=(a,b)=>a.x===b.x&&a.y===b.y;
export const ROAD_STYLES=Object.freeze([['across-first','Across, then down'],['down-first','Down, then across'],['staircase','A little staircase']].map(([id,name])=>Object.freeze({id,name})));
export function duoRoadCells(board,from,to,style='across-first'){
 const valid=p=>p&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.y>=0&&p.x<board?.width&&p.y<board?.height;
 if(!board||!Number.isInteger(board.width)||!Number.isInteger(board.height)||board.width<7||board.width>13||board.height<5||board.height>9||!valid(from)||!valid(to)||!ROAD_STYLES.some(s=>s.id===style))throw Error('Choose two tiles inside the garden and a road shape.');
 let x=from.x,y=from.y,across=style!=='down-first';const cells=[{x,y}],dx=Math.sign(to.x-x),dy=Math.sign(to.y-y);
 while(x!==to.x||y!==to.y){if(x!==to.x&&(across||y===to.y))x+=dx;else y+=dy;cells.push({x,y});if(style==='staircase')across=!across;else if(x===to.x||y===to.y)across=x!==to.x;}
 return cells;
}
function editable(input){if(!duoEditable(input))throw Error('Remix a story before planning garden roads.');return normalizeDuoProject(input);}
export function planDuoRoad(input,{from,to,style='across-first',brush='road'}={}){
 const p=editable(input),cells=duoRoadCells(p.board,from,to,style);if(!['road','water'].includes(brush))throw Error('Choose garden road or water.');
 if(brush==='water'&&[...p.starts,...p.parts].some(part=>cells.some(c=>same(c,part))))throw Error('Water would cover a companion or station. The whole path stays unchanged.');
 const changed=cells.filter(c=>p.board.road.some(old=>same(c,old))===(brush==='water')).length;
 if(!changed)return {cells,changed,project:p};
 const road=brush==='road'?[...p.board.road,...cells.filter(c=>!p.board.road.some(old=>same(c,old)))]:p.board.road.filter(old=>!cells.some(c=>same(c,old))),{proof,...base}=p;
 return {cells,changed,project:normalizeDuoProject({...base,board:{...p.board,road}})};
}
export function duoRoadStencil(input,options,name='My rain road'){
 const p=editable(input);if(options?.brush&&options.brush!=='road')throw Error('Choose garden road to keep a road stencil.');const cells=duoRoadCells(p.board,options?.from,options?.to,options?.style),x=Math.min(...cells.map(c=>c.x)),y=Math.min(...cells.map(c=>c.y)),width=Math.max(...cells.map(c=>c.x))-x+1,height=Math.max(...cells.map(c=>c.y))-y+1;
 return normalizeDuoBlueprint({format:'pip-duo-blueprint',version:5,name,author:p.author,note:'A road stencil from '+p.name+'. Place it, then add your own stations and story.',width,height,road:cells.map(c=>({x:c.x-x,y:c.y-y})),parts:[]});
}
