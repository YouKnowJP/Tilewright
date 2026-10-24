import { activePlates, canEnter, gateIsOpen, hazardActive, enemyIntent } from './adventure.mjs';

export const CHANNEL_NUMBERS = Object.freeze({ amber:'1', jade:'2', violet:'3', blue:'4' });
export const MAP_KEY = 'Y = your keeper; H = home beacon; L = lantern; K = key; C = crate; P = pressure plate; W = wheel; B = bell; G = closed gate; O = open crossing; T = travel stone; R = relic; ? = keeper; ! = danger. Matching small numbers link mechanisms. Plates and wheels have solid white outlines when held or on, dashed outlines when empty or off. Outlined arrows show an enemy’s next step; crossed cells mark a sweep.';
export function boardWindow(map, width, height, zoom = 'standard') {
  const cell = {standard:28,large:42,largest:56}[zoom] || 28;
  return {columns:Math.min(map.width, Math.max(4, Math.min(24, Math.floor(width/cell)))), rows:Math.min(map.height, Math.max(4, Math.min(16, Math.floor(height/cell))))};
}
// Campaign mechanisms have links rather than color channels; number each linked group.
export function mechanismNumbers(stage) {
  if(stage.cueChannels)return stage.cueChannels;
  const groups=[];
  const join=ids=>{if(!ids.length)return;const touching=groups.filter(group=>ids.some(id=>group.has(id)));const group=new Set([...ids,...touching.flatMap(set=>[...set])]);for(const old of touching)groups.splice(groups.indexOf(old),1);groups.push(group);};
  for(const gate of stage.gates){const linked=[...(gate.plates||[]),...(gate.controls||[]).map(control=>control.id)];if(linked.length)join([gate.id,...linked]);}
  for(const stone of stage.waystones||[])join([stone.id,stone.partner].filter(Boolean));
  return Object.fromEntries(groups.flatMap((group,i)=>[...group].map(id=>[id,String(i+1)])));
}
export function mapMarkers(run) {
  const stage=run.stage,numbers=mechanismNumbers(stage),items=[];
  const add=(points,label,filter=()=>true)=>{for(const point of points||[])if(filter(point))items.push({...point,label,number:numbers[point.id]||(label==='B'?String(stage.sequence.indexOf(point.id)+1):'')});};
  add([stage.exit],'H');add(stage.lanterns,'L',p=>!run.collectedLanterns.includes(p.id));add(stage.keys,'K',p=>!run.collectedKeys.includes(p.id));
  add(run.crates,'C');add(stage.plates,'P');add(stage.switches,'W');for(const gate of stage.gates)add([gate],gateIsOpen(run,gate)?'O':'G');add(stage.relays,'B');add(stage.waystones,'T');
  add(stage.npcs,'?',p=>!run.rescued.includes(p.id));add(stage.supplies,'+',p=>!run.usedSupplies.includes(p.id));add(stage.hearts,'+',p=>!run.collectedHearts.includes(p.id));
  if(run.cargoPoint&&!run.carrying&&!run.cargoDelivered)add([run.cargoPoint],'R');
  return items.filter(p=>run.seen[p.y*stage.map.width+p.x]);
}
export function drawCueBadge(ctx, point, label, number='', size=24) {
  const w=number?22:14;
  ctx.save();ctx.translate(point.x*size,point.y*size);ctx.scale(size/24,size/24);const x=0,y=0;ctx.fillStyle='#071619';ctx.fillRect(x+1,y+1,w,11);ctx.strokeStyle='#ffffff';ctx.lineWidth=1;ctx.strokeRect(x+1.5,y+1.5,w-1,10);
  ctx.fillStyle='#ffffff';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(`${label}${number}`,x+1+w/2,y+6.5);ctx.restore();
}
export function drawMapCues(ctx,run) {
  const active=activePlates(run);
  for(const item of mapMarkers(run)){
    if(['P','W'].includes(item.label)){ctx.save();ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.setLineDash((item.label==='P'?active.includes(item.id):run.switches[item.id])?[]:[3,3]);ctx.strokeRect(item.x*24+1,item.y*24+1,22,22);ctx.restore();}
    drawCueBadge(ctx,item,item.label,item.number);
  }
  const near=p=>(p.x-run.player.x)**2+(p.y-run.player.y)**2<=run.effects.sightSquared;
  for(const hazard of run.stage.hazards)if(near(hazard)&&(hazardActive(run,hazard)||hazardActive(run,hazard,run.turns+1)))drawCueBadge(ctx,hazard,'!');
  const arrow=(from,to)=>to.x>from.x?'>':to.x<from.x?'<':to.y>from.y?'v':to.y<from.y?'^':'·';
  for(const enemy of run.enemies){const point=enemy.route[enemy.index],next=enemyIntent(run,enemy).point;if(near(point)){drawCueBadge(ctx,next,arrow(point,next));drawCueBadge(ctx,point,'!');}}
  for(const hunter of run.hunters)if(near(hunter)){drawCueBadge(ctx,hunter.intent,arrow(hunter,hunter.intent));drawCueBadge(ctx,hunter,'!');}
}
const at=p=>`column ${p.x+1}, row ${p.y+1}`;
export function surroundings(run) {
  const stage=run.stage, seen=p=>Boolean(run.seen[p.y*stage.map.width+p.x]), distance=p=>Math.abs(p.x-run.player.x)+Math.abs(p.y-run.player.y), numbers=mechanismNumbers(stage);
  const descriptions=[];
  const add=(points,name,filter=()=>true)=>{for(const point of points||[])if(seen(point)&&filter(point))descriptions.push({point,text:`${typeof name==='function'?name(point):name}${numbers[point.id]?` · link ${numbers[point.id]}`:''} — ${at(point)}; ${distance(point)} tiles away on the grid.`});};
  const occupied=(p,q)=>p.x===q.x&&p.y===q.y;
  const directions=[['North',0,-1],['East',1,0],['South',0,1],['West',-1,0]].map(([name,dx,dy])=>{
    const point={x:run.player.x+dx,y:run.player.y+dy},crate=run.crates.find(c=>occupied(c,point));
    let status=canEnter(run,point,true)?'open':'blocked';
    const gate=stage.gates.find(g=>occupied(g,point));
    if(gate)status=gateIsOpen(run,gate)?'open crossing':gate.type==='key'&&run.keyCount?'locked gate; stepping uses a key':'closed crossing';
    if(crate){const beyond={x:point.x+dx,y:point.y+dy};status=canEnter(run,beyond)&&!run.crates.some(c=>occupied(c,beyond))?'crate; step to push':'crate; cannot push from here';}
    if(stage.npcs.some(npc=>occupied(npc,point)&&!run.rescued.includes(npc.id)))status='keeper; use Interact to talk';
    const hazard=stage.hazards.find(h=>occupied(h,point));if(hazard&&hazardActive(run,hazard,run.turns+1))status+='; ember burns after your action';
    if(run.hunters.some(h=>occupied(h.intent,point)||(h.attack||[]).some(c=>occupied(c,point)))||run.enemies.some(e=>occupied(enemyIntent(run,e).point,point)))status+='; enemy is heading here';
    return `${name}: ${status}.`;
  });
  add([stage.exit],'Home beacon');add(stage.lanterns,'Unlit lantern',p=>!run.collectedLanterns.includes(p.id));add(stage.keys,'Key',p=>!run.collectedKeys.includes(p.id));
  add(stage.switches,p=>`${p.name||'Wheel'}: ${run.switches[p.id]?'on':'off'}`);add(stage.plates,p=>`Pressure plate: ${activePlates(run).includes(p.id)?'held':'empty'}`);
  add(stage.gates,p=>`Gate: ${gateIsOpen(run,p)?'open':'closed'}`);add(stage.relays,p=>`${p.name||'Bell'}: note ${stage.sequence.indexOf(p.id)+1}`);add(stage.waystones,p=>p.name||'Travel stone');
  add(stage.npcs,p=>p.name||'Keeper',p=>!run.rescued.includes(p.id));if(run.cargoPoint&&!run.carrying&&!run.cargoDelivered)add([run.cargoPoint],stage.relic?.name||'Relic');
  const landmarks=descriptions.sort((a,b)=>distance(a.point)-distance(b.point)).slice(0,10).map(item=>item.text);
  return {position:`You are at ${at(run.player)}. ${run.collectedLanterns.length} of ${stage.lanterns.length} lanterns lit.`,directions,landmarks};
}
