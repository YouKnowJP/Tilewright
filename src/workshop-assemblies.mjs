import {transformPrismOperation,transformProgram} from './clockwork.mjs';
import { normalizeAdventure, editAdventure, nextMarkerId, CHANNELS, MAX_MARKERS } from './workshop-model.mjs';
import { validateDocument } from './model.mjs';
import { GUILD_KITS } from './adventure-tools.mjs';
export const ASSEMBLIES_KEY='tilewright.workshop.assemblies.v1', MAX_ASSEMBLIES=12;
const linked=m=>['plate','bridge','lever','door','ember','waystone','pip-router','pip-parcel','pip-socket','pip-lock'].includes(m.kind)||m.kind==='guide'&&m.reward==='route';
const inside=(p,b)=>p.x>=b.x&&p.y>=b.y&&p.x<b.x+b.width&&p.y<b.y+b.height;
export function normalizeAssembly(input){
  if(!input||typeof input.name!=='string'||!input.name.trim()||input.name.length>48||!input.map||input.map.width<1||input.map.height<1||input.map.width>12||input.map.height>12)throw Error('Name a puzzle assembly of at most 12 × 12 cells.');
  const map=validateDocument(input.map),pack=normalizeAdventure({format:'tilewright-adventure',version:1,title:input.name,map,markers:input.markers,kit:'none'});
  if(pack.markers.some(m=>['start','beacon'].includes(m.kind)))throw Error('Keep the starting point and beacon outside an assembly.');
  for(const channel of CHANNELS){const count=pack.markers.filter(m=>m.kind==='pip-tube'&&m.channel===channel).length;if(count&&count!==2)throw Error(`Include both ${channel} courier tube endpoints in the assembly.`);}
  return {name:input.name.trim(),map,markers:pack.markers,...(pack.markers.some(m=>m.kind==='waystone')?{kit:GUILD_KITS.some(kit=>kit.id===input.kit)?input.kit:'none'}:{})};
}
export function captureAssembly(input,bounds,name){
  const pack=normalizeAdventure(input),b=bounds;
  if(!b||['x','y','width','height'].some(key=>!Number.isInteger(b[key]))||b.x<0||b.y<0||b.width<1||b.height<1||b.width>12||b.height>12||b.x+b.width>pack.map.width||b.y+b.height>pack.map.height)throw Error('Select an area inside the map, up to 12 × 12 cells.');
  const markers=pack.markers.filter(m=>inside(m,b));
  for(const marker of markers){
    if(marker.kind==='turntable'&& (marker.x-(marker.span-1)/2<b.x||marker.y-(marker.span-1)/2<b.y||marker.x+(marker.span-1)/2>=b.x+b.width||marker.y+(marker.span-1)/2>=b.y+b.height))throw Error('Include the entire rotating room in the assembly.');
    if((pack.storyCards||[]).some(c=>c.source===marker.id||c.target===marker.id))throw Error('Story moments belong to this world. Remove their cards before capturing these objects as an assembly.');
    if(marker.route?.some(p=>!inside(p,b)))throw Error('Include every patrol waypoint in the selected area.');
    if(marker.kind==='pip-tube'&&pack.markers.some(other=>other.kind==='pip-tube'&&other.channel===marker.channel&&!inside(other,b)))throw Error(`Include the whole ${marker.channel} courier tube pair so its links stay together.`);
    if(linked(marker)&&pack.markers.some(other=>linked(other)&&other.channel===marker.channel&&!inside(other,b)))throw Error(`Include the whole ${marker.channel} puzzle so its links stay together.`);
  }
  const map={...pack.map,width:b.width,height:b.height,layers:pack.map.layers.map(layer=>({...layer,tiles:Array.from({length:b.width*b.height},(_,i)=>layer.tiles[(b.y+Math.floor(i/b.width))*pack.map.width+b.x+i%b.width])}))};
  const move=p=>({x:p.x-b.x,y:p.y-b.y});
  return normalizeAssembly({name,map,kit:pack.kit,markers:markers.map(m=>({...m,...move(m),...(m.route?{route:m.route.map(move)}:{})}))});
}
export function rotateAssembly(input,turns=0){
  let assembly=normalizeAssembly(input);
  if(!Number.isInteger(turns)||turns<0||turns>3)throw Error('Choose a quarter-turn rotation.');
  for(let t=0;t<turns;t++){
    const {width:w,height:h}=assembly.map,rotate=p=>({x:h-1-p.y,y:p.x});
    const map={...assembly.map,width:h,height:w,layers:assembly.map.layers.map(layer=>{const tiles=Array(w*h);layer.tiles.forEach((tile,i)=>{const p=rotate({x:i%w,y:Math.floor(i/w)});tiles[p.y*h+p.x]=tile;});return {...layer,tiles};})};
    assembly={...assembly,map,markers:assembly.markers.map(m=>({...m,...rotate(m),...(m.program?{program:m.program.map(command=>({up:'right',right:'down',down:'left',left:'up',wait:'wait',use:'use'}[command]))}:{}),...(m.kind==='pip-prism'?{operation:transformPrismOperation(m.operation,'rotate')}:{}),...(m.alternate?{alternate:m.alternate.map(command=>({up:'right',right:'down',down:'left',left:'up',wait:'wait',use:'use'}[command]))}:{}),...(m.route?{route:m.route.map(rotate)}:{})}))};
  }
  return assembly;
}
// Reflection happens before a selected quarter turn; originals stay immutable.
export function mirrorAssembly(input,axis='x'){
 const a=normalizeAssembly(input);if(!['x','y'].includes(axis))throw Error('Choose an east/west or north/south puzzle reflection.');const {width,height}=a.map,point=p=>axis==='x'?{x:width-1-p.x,y:p.y}:{x:p.x,y:height-1-p.y},operation=axis==='x'?'mirror':'mirror-y';
 const map={...a.map,layers:a.map.layers.map(l=>{const tiles=Array(width*height);l.tiles.forEach((t,i)=>{const p=point({x:i%width,y:Math.floor(i/width)});tiles[p.y*width+p.x]=t;});return {...l,tiles};})};
 return {...a,map,markers:a.markers.map(m=>({...m,...point(m),...(m.program?{program:transformProgram(m.program,operation)}:{}),...(m.alternate?{alternate:transformProgram(m.alternate,operation)}:{}),...(m.kind==='pip-prism'?{operation:transformPrismOperation(m.operation,axis==='x'?'mirror-x':'mirror-y')}:{}),...(m.route?{route:m.route.map(point)}:{})}))};
}
export function assemblyPreview(input,turns=0,reflection='none'){if(!['none','x','y'].includes(reflection))throw Error('Choose a known puzzle reflection.');return rotateAssembly(reflection==='none'?input:mirrorAssembly(input,reflection),turns);}
export function pasteAssembly(input,source,point,turns=0,reflection='none'){
  const pack=normalizeAdventure(input),assembly=assemblyPreview(source,turns,reflection),b={...point,width:assembly.map.width,height:assembly.map.height};
  if(!point||!Number.isInteger(point.x)||!Number.isInteger(point.y)||point.x<0||point.y<0||point.x+b.width>pack.map.width||point.y+b.height>pack.map.height)throw Error('Move the cursor so the entire assembly fits inside the map.');
  if(pack.markers.some(m=>inside(m,b)))throw Error('Place assemblies on an empty object area. Terrain will be replaced; existing puzzle objects stay safe.');
  if(pack.markers.length+assembly.markers.length>MAX_MARKERS)throw Error('This assembly would exceed the 128-object limit.');
  if(pack.markers.filter(m=>['pip-stamp','pip-router'].includes(m.kind)).length+assembly.markers.filter(m=>['pip-stamp','pip-router'].includes(m.kind)).length>8)throw Error('A world can hold at most eight program stamps.');
  if(['pip-parcel','pip-socket'].some(kind=>pack.markers.filter(m=>m.kind===kind).length+assembly.markers.filter(m=>m.kind===kind).length>8))throw Error('Keep at most eight parcel sources and eight receivers.');
  if(pack.markers.filter(m=>m.kind==='pip-prism').length+assembly.markers.filter(m=>m.kind==='pip-prism').length>8)throw Error('A world can hold at most eight compass prisms.');
  if(pack.markers.some(m=>m.kind==='clockwork')&&assembly.markers.some(m=>m.kind==='clockwork'))throw Error('A world can hold only one Clockwork companion.');
  if(pack.markers.some(m=>m.kind==='partner')&&assembly.markers.some(m=>m.kind==='partner'))throw Error('A world can hold only one Two-Lantern partner.');
  if(pack.markers.some(m=>m.kind==='relic')&&assembly.markers.some(m=>m.kind==='relic'))throw Error('A world can hold only one singing relic.');
  const used=new Set(pack.markers.filter(linked).map(m=>m.channel)),needed=[...new Set(assembly.markers.filter(linked).map(m=>m.channel))],free=CHANNELS.filter(id=>!used.has(id));
  if(needed.length>free.length)throw Error('There are not enough unused puzzle channels. Clear a complete channel before placing this linked assembly.');
  const tubeUsed=new Set(pack.markers.filter(m=>m.kind==='pip-tube').map(m=>m.channel)),tubeNeeded=[...new Set(assembly.markers.filter(m=>m.kind==='pip-tube').map(m=>m.channel))],tubeFree=CHANNELS.filter(id=>!tubeUsed.has(id));if(tubeNeeded.length>tubeFree.length)throw Error('There are not enough unused courier tube channels. Keep at most four complete pairs.');const tubeChannels=Object.fromEntries(tubeNeeded.map((id,i)=>[id,tubeFree[i]]));
  const channels=Object.fromEntries(needed.map((id,i)=>[id,free[i]])),markers=[...pack.markers],bells=assembly.markers.filter(m=>m.kind==='bell').sort((a,b)=>a.order-b.order),bellOffset=pack.markers.filter(m=>m.kind==='bell').length;
  const stops=assembly.markers.filter(m=>m.kind==='pip-stop').sort((a,b)=>a.order-b.order),stopOffset=pack.markers.filter(m=>m.kind==='pip-stop').length;if(stops.length+stopOffset>8)throw Error('A world can hold at most eight Pip delivery stops.');if(stops.length&&pack.markers.some(m=>m.kind==='pip-stop'&&m.required))throw Error('Clear the earlier final parking requirement before extending its delivery route.');
  if(bells.length+bellOffset>8)throw Error('A world can hold at most eight sequence bells.');
  for(const m of assembly.markers){const shift=p=>({x:p.x+point.x,y:p.y+point.y});markers.push({...m,id:nextMarkerId(markers),...shift(m),...(m.kind==='pip-tube'?{channel:tubeChannels[m.channel]}:linked(m)?{channel:channels[m.channel]}:{}),...(m.kind==='bell'?{order:bellOffset+bells.indexOf(m)+1}:{}),...(m.kind==='pip-stop'?{order:stopOffset+stops.indexOf(m)+1}:{}),...(m.route?{route:m.route.map(shift)}:{})});}
  const layers=pack.map.layers.map(layer=>({...layer,tiles:[...layer.tiles]}));
  for(const [i,layer] of assembly.map.layers.entries()){
    if(!layers[i]){let serial=i,id=`assembly-layer-${serial}`;while(layers.some(item=>item.id===id))id=`assembly-layer-${++serial}`;layers.push({...layer,id,tiles:Array(pack.map.width*pack.map.height).fill(0)});}
    for(let y=0;y<b.height;y++)for(let x=0;x<b.width;x++)layers[i].tiles[(point.y+y)*pack.map.width+point.x+x]=layer.tiles[y*b.width+x];
  }
  if(assembly.markers.some(m=>m.kind==='waystone')&&pack.kit==='none'&&assembly.kit==='none')throw Error('Choose a specialist before placing this waystone assembly.');
  return editAdventure(pack,{map:{...pack.map,layers},markers,...(assembly.markers.some(m=>m.kind==='waystone')&&pack.kit==='none'?{kit:assembly.kit}:{})});
}
export function loadAssemblies(storage){try{const raw=storage.getItem(ASSEMBLIES_KEY);if(!raw)return {items:[],failed:false};if(raw.length>600000)throw Error('Oversized assemblies');const data=JSON.parse(raw);if(data.version!==1||!Array.isArray(data.items)||data.items.length>MAX_ASSEMBLIES)throw Error('Invalid assemblies');return {items:data.items.map(normalizeAssembly),failed:false};}catch{return {items:[],failed:true};}}
export function saveAssemblies(storage,items){try{if(items.length>MAX_ASSEMBLIES)return false;const raw=JSON.stringify({version:1,items:items.map(normalizeAssembly)});if(raw.length>600000)return false;storage.setItem(ASSEMBLIES_KEY,raw);return true;}catch{return false;}}

// New owned portable puzzle format. Existing assembly storage stays version 1.
export const MAX_ASSEMBLY_BYTES=150000;
function portableAssembly(input){const a=normalizeAssembly(input);for(const kind of ['clockwork','partner','relic'])if(a.markers.filter(m=>m.kind===kind).length>1)throw Error('Keep at most one companion, partner and relic in a puzzle assembly.');if(a.markers.filter(m=>m.kind==='pip-prism').length>8||a.markers.filter(m=>['pip-stamp','pip-router'].includes(m.kind)).length>8)throw Error('Keep at most eight prisms and eight program stamps in a puzzle assembly.');for(const m of a.markers){if(['pip-parcel','pip-socket','pip-lock'].includes(m.kind)){if(a.markers.filter(p=>p.kind==='pip-parcel').length>8||a.markers.filter(p=>p.kind==='pip-socket').length>8)throw Error('Keep at most eight parcel sources and receivers.');if(!a.markers.some(p=>p.kind==='pip-parcel'&&p.channel===m.channel)||!a.markers.some(p=>p.kind==='pip-socket'&&p.channel===m.channel))throw Error('Include matching parcel sources and receivers in the puzzle file.');}if(m.kind==='pip-router'&&!a.markers.some(p=>['plate','lever','pip-socket'].includes(p.kind)&&p.channel===m.channel))throw Error('Include a signal stamp’s linked plates, lever or parcel receivers in its puzzle file.');if(m.kind==='turntable'){const r=(m.span-1)/2;if(m.x-r<0||m.y-r<0||m.x+r>=a.map.width||m.y+r>=a.map.height)throw Error('Include the entire rotating room in its puzzle file.');}}return a;}
export function serializeAssembly(input){const raw=JSON.stringify({format:'tilewright-assembly',version:1,assembly:portableAssembly(input)});if(new TextEncoder().encode(raw).length>MAX_ASSEMBLY_BYTES)throw Error('This puzzle is too large to share as an assembly. Share the whole adventure instead.');return raw;}
export function parseAssembly(raw){if(typeof raw!=='string'||new TextEncoder().encode(raw).length>MAX_ASSEMBLY_BYTES)throw Error('Choose a puzzle assembly file of at most 150 KB.');let data;try{data=JSON.parse(raw);}catch{throw Error('This puzzle assembly is not valid JSON.');}if(data?.format!=='tilewright-assembly'||data.version!==1)throw Error('Choose a Tilewright puzzle assembly file, version 1.');return portableAssembly(data.assembly);}
export function importAssembly(items,raw){if(!Array.isArray(items)||items.length>=MAX_ASSEMBLIES)throw Error('All twelve assembly slots are in use. Remove an assembly to make room.');const assembly=parseAssembly(raw);return [...items.map(normalizeAssembly),assembly];}
