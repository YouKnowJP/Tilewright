export const CONTROL_STYLES=Object.freeze({auto:'Pad + swipe',pad:'Direction pad',swipe:'Swipe the map',tap:'Tap to step',keyboard:'Keyboard focus'});
export function movementKey(key,layout='wasd') {
  const arrows={ArrowUp:'up',ArrowRight:'right',ArrowDown:'down',ArrowLeft:'left'};
  return arrows[key]||({wasd:{w:'up',d:'right',s:'down',a:'left'},ijkl:{i:'up',l:'right',k:'down',j:'left'}}[layout]||{})[key.toLowerCase()]||null;
}
export function controlHelp(preferences) {
  const keys=preferences.keyboardLayout==='arrows'?'Arrow keys':`Arrow keys / ${preferences.keyboardLayout.toUpperCase()}`;
  return {auto:`${keys}, direction pad, or swipe. One gesture moves one step.`,pad:`${keys} or direction pad. Tap a direction once per step.`,swipe:`Swipe anywhere on the map for one step. ${keys} also work.`,tap:`Tap above, below, left, or right of your keeper for one step. ${keys} also work.`,keyboard:`${keys} to move. Shift + direction dashes. On-screen actions remain available.`}[preferences.controls]||'';
}
export function gestureDirection(style,start,end,origin) {
  if(!['auto','swipe','tap'].includes(style)||![start?.x,start?.y,end?.x,end?.y].every(Number.isFinite))return null;
  let dx=end.x-start.x,dy=end.y-start.y;
  if(style==='tap') { if(Math.max(Math.abs(dx),Math.abs(dy))>18||!Number.isFinite(origin?.x)||!Number.isFinite(origin?.y))return null;dx=end.x-origin.x;dy=end.y-origin.y; }
  if(Math.max(Math.abs(dx),Math.abs(dy))<18)return null;
  // A deliberate cardinal direction avoids accidental diagonal steps.
  if(Math.min(Math.abs(dx),Math.abs(dy))>Math.max(Math.abs(dx),Math.abs(dy))*.82)return null;
  return Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';
}
export function gamepadSnapshot(pad) {
  if(!pad?.connected||pad.mapping!=='standard')return null;
  const pressed=index=>Boolean(pad.buttons?.[index]?.pressed||pad.buttons?.[index]?.value>.5),x=pad.axes?.[0]||0,y=pad.axes?.[1]||0;
  const directions=[pressed(12)?'up':null,pressed(15)?'right':null,pressed(13)?'down':null,pressed(14)?'left':null].filter(Boolean);
  if(!directions.length&&Math.max(Math.abs(x),Math.abs(y))>=.65)directions.push(Math.abs(x)>Math.abs(y)?x>0?'right':'left':y>0?'down':'up');
  return {id:`${pad.index}:${pad.id}`,held:[...directions,...[[0,'interact'],[1,'back'],[2,'power'],[3,'dash'],[4,'decoy'],[5,'shield'],[8,'plan'],[9,'pause'],[10,'cargo']].filter(([index])=>pressed(index)).map(([,action])=>action)]};
}
export function gamepadPress(snapshot,previous) {
  if(!snapshot||!previous||snapshot.id!==previous.id)return null;
  const fresh=snapshot.held.filter(action=>!previous.held.includes(action));
  // One deliberate input per frame. A held stick/button never repeats turns.
  return ['pause','back','plan','up','right','down','left','interact','dash','power','decoy','shield','cargo'].find(action=>fresh.includes(action))||null;
}
