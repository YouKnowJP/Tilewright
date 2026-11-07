// New owned material. See LICENSE; prior MIT permissions remain effective.
import {DUO_CHANNELS,duoEditable,normalizeDuoProject} from './pip-duo.mjs';
import {normalizeDuoBlueprint,placeDuoBlueprint} from './pip-duo-blueprints.mjs';
const families=['tube','locker','sync'];
export function duoBlueprintLinks(input){
 const piece=normalizeDuoBlueprint(input);
 return families.flatMap(kind=>DUO_CHANNELS.filter(channel=>piece.parts.some(p=>p.kind===kind&&p.channel===channel)).map(channel=>({kind,channel,ends:piece.parts.filter(p=>p.kind===kind&&p.channel===channel).length})));
}
export function rewireDuoBlueprint(input,mapping={}){
 const piece=normalizeDuoBlueprint(input),links=duoBlueprintLinks(piece);
 if(!mapping||typeof mapping!=='object'||Array.isArray(mapping)||Object.keys(mapping).some(k=>!families.includes(k)))throw Error('Choose maps for tubes, lockers or Rendezvous Posts.');
 for(const kind of families){const map=mapping[kind]===undefined?{}:mapping[kind],used=links.filter(p=>p.kind===kind).map(p=>p.channel);if(!map||typeof map!=='object'||Array.isArray(map)||Object.entries(map).some(([from,to])=>!used.includes(from)||!DUO_CHANNELS.includes(to)))throw Error('Map only connections present in this blueprint to known numbered colours.');if(new Set(used.map(c=>map[c]??c)).size!==used.length)throw Error('Give separate '+kind+' connections different numbers. Swap both destinations together, or use unused connections.');}
 return normalizeDuoBlueprint({...piece,parts:piece.parts.map(p=>families.includes(p.kind)?{...p,channel:mapping[p.kind]?.[p.channel]??p.channel}:{...p})});
}
export function unusedDuoBlueprintLinks(input,blueprint){
 if(!duoEditable(input))throw Error('Remix a story before choosing unused garden connections.');const project=normalizeDuoProject(input),links=duoBlueprintLinks(blueprint),mapping={tube:{},locker:{},...(links.some(link=>link.kind==='sync')?{sync:{}}:{})};
 for(const kind of families){const sources=links.filter(p=>p.kind===kind).map(p=>p.channel),free=DUO_CHANNELS.filter(c=>!project.parts.some(p=>p.kind===kind&&p.channel===c));if(sources.length>free.length)throw Error(`This piece needs ${sources.length} ${kind} connections, but the garden has ${free.length} unused. Choose destinations manually to join existing links, or remove a garden connection.`);const kept=sources.filter(c=>free.includes(c)),remaining=free.filter(c=>!kept.includes(c));for(const c of sources)mapping[kind][c]=kept.includes(c)?c:remaining.shift();}
 return mapping;
}
export function duoBlueprintPlacements(input,blueprint){
 if(!duoEditable(input))throw Error('Remix a story before finding blueprint space.');const project=normalizeDuoProject(input),piece=normalizeDuoBlueprint(blueprint),places=[];
 for(let y=0;y<=project.board.height-piece.height;y++)for(let x=0;x<=project.board.width-piece.width;x++){try{placeDuoBlueprint(project,piece,x,y);places.push({x,y});}catch{}}
 return places;
}
