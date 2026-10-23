import { normalizeAdventure, editAdventure, nextMarkerId, CHANNELS, MAX_MARKERS } from './workshop-model.mjs';
import { validateDocument } from './model.mjs';
import { GUILD_KITS } from './adventure-tools.mjs';
export const ASSEMBLIES_KEY='tilewright.workshop.assemblies.v1', MAX_ASSEMBLIES=12;
const linked=m=>['plate','bridge','lever','door','ember','waystone'].includes(m.kind)||m.kind==='guide'&&m.reward==='route';
const inside=(p,b)=>p.x>=b.x&&p.y>=b.y&&p.x<b.x+b.width&&p.y<b.y+b.height;
export function normalizeAssembly(input){
  if(!input||typeof input.name!=='string'||!input.name.trim()||input.name.length>48||!input.map||input.map.width<1||input.map.height<1||input.map.width>12||input.map.height>12)throw Error('Name a puzzle assembly of at most 12 × 12 cells.');
  const map=validateDocument(input.map),pack=normalizeAdventure({format:'tilewright-adventure',version:1,title:input.name,map,markers:input.markers,kit:'none'});
  if(pack.markers.some(m=>['start','beacon'].includes(m.kind)))throw Error('Keep the starting point and beacon outside an assembly.');
  return {name:input.name.trim(),map,markers:pack.markers,...(pack.markers.some(m=>m.kind==='waystone')?{kit:GUILD_KITS.some(kit=>kit.id===input.kit)?input.kit:'none'}:{})};
}
export function captureAssembly(input,bounds,name){
  const pack=normalizeAdventure(input),b=bounds;
  if(!b||['x','y','width','height'].some(key=>!Number.isInteger(b[key]))||b.x<0||b.y<0||b.width<1||b.height<1||b.width>12||b.height>12||b.x+b.width>pack.map.width||b.y+b.height>pack.map.height)throw Error('Select an area inside the map, up to 12 × 12 cells.');
  const markers=pack.markers.filter(m=>inside(m,b));
  for(const marker of markers){
    if(marker.route?.some(p=>!inside(p,b)))throw Error('Include every patrol waypoint in the selected area.');
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
    assembly={...assembly,map,markers:assembly.markers.map(m=>({...m,...rotate(m),...(m.route?{route:m.route.map(rotate)}:{})}))};
  }
  return assembly;
}
export function pasteAssembly(input,source,point,turns=0){
  const pack=normalizeAdventure(input),assembly=rotateAssembly(source,turns),b={...point,width:assembly.map.width,height:assembly.map.height};
  if(!point||!Number.isInteger(point.x)||!Number.isInteger(point.y)||point.x<0||point.y<0||point.x+b.width>pack.map.width||point.y+b.height>pack.map.height)throw Error('Move the cursor so the entire assembly fits inside the map.');
  if(pack.markers.some(m=>inside(m,b)))throw Error('Place assemblies on an empty object area. Terrain will be replaced; existing puzzle objects stay safe.');
  if(pack.markers.length+assembly.markers.length>MAX_MARKERS)throw Error('This assembly would exceed the 128-object limit.');
  if(pack.markers.some(m=>m.kind==='relic')&&assembly.markers.some(m=>m.kind==='relic'))throw Error('A world can hold only one singing relic.');
  const used=new Set(pack.markers.filter(linked).map(m=>m.channel)),needed=[...new Set(assembly.markers.filter(linked).map(m=>m.channel))],free=CHANNELS.filter(id=>!used.has(id));
  if(needed.length>free.length)throw Error('There are not enough unused puzzle channels. Clear a complete channel before placing this linked assembly.');
  const channels=Object.fromEntries(needed.map((id,i)=>[id,free[i]])),markers=[...pack.markers],bells=assembly.markers.filter(m=>m.kind==='bell').sort((a,b)=>a.order-b.order),bellOffset=pack.markers.filter(m=>m.kind==='bell').length;
  if(bells.length+bellOffset>8)throw Error('A world can hold at most eight sequence bells.');
  for(const m of assembly.markers){const shift=p=>({x:p.x+point.x,y:p.y+point.y});markers.push({...m,id:nextMarkerId(markers),...shift(m),...(linked(m)?{channel:channels[m.channel]}:{}),...(m.kind==='bell'?{order:bellOffset+bells.indexOf(m)+1}:{}),...(m.route?{route:m.route.map(shift)}:{})});}
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
