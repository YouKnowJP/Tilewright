import { captureAssembly, pasteAssembly, loadAssemblies, saveAssemblies, MAX_ASSEMBLIES } from './workshop-assemblies.mjs';
import { History, TILES, paintCells, floodCells, rectangleCells, lineCells } from './model.mjs';
import { OBJECTS, CHANNELS, normalizeAdventure, editAdventure, placeObject, checkAdventure, applyStamp } from './workshop-model.mjs';
import { CHAPTERS } from './adventure-art.mjs';
import { createIcon } from './icons.mjs';
import { drawTile } from './render.mjs';
import { drawWorkshopWorld, drawWorkshopObject } from './workshop-art.mjs';
import { transformAdventure } from './workshop-lab.mjs';

export function createWorkshopDesigner({ storage, initial, onChange, notice }) {
  const $ = id => document.getElementById(`ws-${id}`), canvas = $('canvas'), viewport = $('viewport');
  let history = new History(initial, 30), selected = null, cursor = { x: 0, y: 0 }, brush = { type: 'inspect', name: 'Inspect' };
  const loadedAssemblies=loadAssemblies(storage);let assemblies=loadedAssemblies.items,area=null;
  let stroke = null, route = false, group = 'Goals', formDirty = false, objectDirty = false, keyboardCorner = null;
  for(const [id,icon,label]of [['brush','brush','Brushes'],['inspect-tool','pick','Inspect object'],['erase-tool','erase','Erase object'],['pan-tool','pan','Pan world'],['undo','undo','Undo'],['redo','redo','Redo']]){const b=$(id);b.replaceChildren(createIcon(icon));if(['brush','inspect-tool','erase-tool','pan-tool'].includes(id)){const span=document.createElement('span');span.textContent={brush:'Brushes','inspect-tool':'Inspect','erase-tool':'Erase','pan-tool':'Pan'}[id];b.append(span);}b.setAttribute('aria-label',label);b.title=label;}
  const compact = matchMedia('(max-width:1000px)'), inspector = $('inspector'), host = inspector.parentElement;
  const pack = () => history.document;
  function guard(fn) { try { return fn(); } catch (error) { notice(error.message, true); return false; } }
  function panel(id, open = false) {
    for (const name of ['adventure', 'object', 'checks']) {
      $('panel-' + name).setAttribute('aria-selected', String(id === name)); $('panel-' + name).tabIndex = id === name ? 0 : -1;
      $('props-' + name).hidden = id !== name;
    }
    if (open && compact.matches && !$('inspector-dialog').open) $('inspector-dialog').showModal();
  }
  function placeInspector() {
    if ($('inspector-dialog').open) $('inspector-dialog').close();
    (compact.matches ? $('inspector-dialog') : host).append(inspector); resize();
  }
  compact.addEventListener('change', placeInspector); placeInspector();
  for (const id of ['adventure', 'object', 'checks']) {
    $('panel-' + id).onclick = () => panel(id);
    $('panel-' + id).onkeydown = event => { const names=['adventure','object','checks'],i=names.indexOf(id),n=event.key==='Home'?0:event.key==='End'?2:event.key==='ArrowRight'?(i+1)%3:event.key==='ArrowLeft'?(i+2)%3:-1; if(n>=0){event.preventDefault();panel(names[n]);$('panel-'+names[n]).focus();} };
    document.querySelector(`[data-ws-panel="${id}"]`).onclick = () => panel(id, true);
  }
  $('inspector-close').onclick = () => $('inspector-dialog').close();
  $('inspector-dialog').addEventListener('close', () => { if (!$('build').hidden) canvas.focus({ preventScroll: true }); });
  $('theme').replaceChildren(...CHAPTERS.map(t => new Option(t.name, t.id)));
  const details = ['title', 'author', 'description', 'theme', 'kit', 'par', 'intro', 'ending', 'hint'];
  function populate() {
    for (const id of details) $(id).value = pack()[id];
    for (const [id, key] of [['all-coins', 'allCoins'], ['no-dash', 'noDash'], ['no-shield', 'noShield']]) $(id).checked = pack().rules[key];
    $('source').textContent = pack().source ? `Origin: ${pack().source}` : 'An original world. Remix credits travel with exported adventures.';
    formDirty = false; populateObject();
  }
  function populateObject() {
    const item = pack().markers.find(m => m.id === selected); selected = item?.id || null;
    $('object-empty').hidden = Boolean(item); $('object-fields').hidden = !item; objectDirty = false;
    if (!item) return;
    $('object-rival').value = item.rival || 'none';
    $('object-kind').textContent = OBJECTS.find(o => o.id === item.kind).name + ` · ${item.x + 1}, ${item.y + 1}`;
    for (const id of ['name', 'text', 'channel', 'order', 'reward', 'vision', 'offset']) $('object-' + id).value = item[id];
    for (const [id, key] of [['initial', 'initial'], ['required', 'required'], ['nemesis', 'nemesisOnly']]) $('object-' + id).checked = item[key];
    inspector.querySelectorAll('[data-ws-for]').forEach(el => { el.hidden = !el.dataset.wsFor.split(' ').includes(item.kind); });
    $('route-note').textContent = `${item.route?.length || 0}/24 waypoints. Routes start here. Patrol paths retrace their steps; each cell must touch the next. Hunters can path between waypoints.`;
    $('route-finish').hidden = !route;
  }
  const chapterForm=$('props-adventure');
  chapterForm.addEventListener('invalid',event=>{ const details=event.target.closest('details');if(details)details.open=true;panel('adventure',true); },true);
  function checks() {
    const report = checkAdventure(pack()); $('check-title').textContent = report.ready ? 'Ready for a real playtest' : 'A few things to mend';
    const readiness=[['World structure',report.ready?'Ready to explore':`${report.errors.length} repairs needed`],['Creator clear',pack().proof?`Attached · ${pack().proof.difficulty} rules`:'Finish a playtest to record one']];
    $('readiness').replaceChildren(...readiness.map(([heading,text])=>{const item=document.createElement('div'),h=document.createElement('strong'),p=document.createElement('p');h.textContent=heading;p.textContent=text;item.append(h,p);return item;}));
    const actions=document.createElement('div');actions.className='ws-readiness-actions';for(const [name,id]of [['Playtest this world','test'],['Prepare to share','share']]){const button=document.createElement('button');button.textContent=name;button.type='button';button.disabled=!report.ready;button.onclick=()=>{if($('inspector-dialog').open)$('inspector-dialog').close();$(id).click();};actions.append(button);}$('readiness').append(actions);
    const goalKinds=['start','lantern','beacon','rescue','relic','bell']; $('quest-strip').replaceChildren(...goalKinds.filter(kind=>['start','lantern','beacon'].includes(kind)||pack().markers.some(m=>m.kind===kind)).map(kind=>{const count=pack().markers.filter(m=>m.kind===kind).length,button=document.createElement('button'),art=document.createElement('canvas');art.width=art.height=24;drawWorkshopObject(art.getContext('2d'),{kind,x:0,y:0});button.append(art,document.createTextNode(`${{start:'Start',lantern:'Lights',beacon:'Beacon',rescue:'Rescue',relic:'Relic',bell:'Bells'}[kind]} · ${count}`));button.title='Paint '+OBJECTS.find(o=>o.id===kind).name;button.onclick=()=>{setBrush({...OBJECTS.find(o=>o.id===kind),type:'object'});canvas.focus({preventScroll:true});};return button;}));
    $('checks').replaceChildren(...[...report.errors.map(text => ({ text, error: true })), ...report.warnings.map(text => ({ text }))].map(item => {
      const p = document.createElement('p'); p.className = 'ws-check-message'; p.dataset.error = String(!!item.error); p.textContent = item.text; return p;
    }));
  }
  function draw() {
    if ($('build').hidden) return;
    drawWorkshopWorld(canvas, stroke?.next || pack(), { selected, cursor, grid: true });
    if(area&&brush.type==='capture'){const ctx=canvas.getContext('2d');ctx.fillStyle='#e9c67b33';ctx.strokeStyle='#ffe2a0';ctx.lineWidth=2;ctx.fillRect(area.x*24,area.y*24,area.width*24,area.height*24);ctx.strokeRect(area.x*24+1,area.y*24+1,area.width*24-2,area.height*24-2);}
    const preview=$('active-brush').getContext('2d');preview.clearRect(0,0,24,24);if(brush.type==='terrain')drawTile(preview,brush.id,0,0);else if(brush.type==='object')drawWorkshopObject(preview,{x:0,y:0,kind:brush.id});else{preview.strokeStyle='#e7d29c';preview.lineWidth=2;preview.strokeRect(5,5,14,14);}
    document.querySelectorAll('[data-ws-quick]').forEach(button=>button.setAttribute('aria-pressed',String(`${brush.type}:${brush.id}`===button.dataset.wsQuick)));
    $('position').textContent = `${cursor.x + 1}, ${cursor.y + 1}`;
    canvas.setAttribute('aria-label', `Adventure designer: ${pack().title}. Column ${cursor.x + 1}, row ${cursor.y + 1}. ${brush.name}. Space paints; arrows move the cursor.`);
    $('brush-label').textContent = route ? 'Draw route · choose land cells, then Finish route' : `${brush.name}${brush.type === 'terrain' ? ` · ${$('paint-mode').selectedOptions[0].textContent} · ${$('layer').selectedOptions[0]?.textContent || ''}` : ''}`;
    for (const [id,type] of [['brush','paint'],['inspect-tool','inspect'],['erase-tool','erase'],['pan-tool','pan']]) $(id).setAttribute('aria-pressed',String(type==='paint'?['terrain','object','stamp'].includes(brush.type):brush.type===type));
    $('undo').disabled = !history.past.length; $('redo').disabled = !history.future.length;
  }
  function revealCursor() { const r=canvas.getBoundingClientRect(),v=viewport.getBoundingClientRect(),x=r.left+(cursor.x+.5)*r.width/pack().map.width,y=r.top+(cursor.y+.5)*r.height/pack().map.height; if(x<v.left+20)viewport.scrollLeft-=v.left+20-x; if(x>v.right-20)viewport.scrollLeft+=x-v.right+20; if(y<v.top+20)viewport.scrollTop-=v.top+20-y; if(y>v.bottom-20)viewport.scrollTop+=y-v.bottom+20; }
  function resize() {
    if ($('build').hidden || viewport.clientWidth < 1) return;
    const scale = $('zoom').value === 'fit' ? Math.min((viewport.clientWidth - 32) / (pack().map.width * 24), (viewport.clientHeight - 32) / (pack().map.height * 24)) : Number($('zoom').value);
    canvas.style.width = `${Math.max(1, pack().map.width * 24 * scale)}px`; canvas.style.height = `${Math.max(1, pack().map.height * 24 * scale)}px`; draw();
  }
  function layers() {
    const old = $('layer').value; $('layer').replaceChildren(...pack().map.layers.map(l => new Option(l.name + (l.visible ? '' : ' (hidden)'), l.id)));
    if (pack().map.layers.some(l => l.id === old)) $('layer').value = old; $('layer-visible').checked = pack().map.layers.find(l => l.id === $('layer').value).visible;
  }
  function refresh() { cursor = { x: Math.max(0, Math.min(pack().map.width - 1, cursor.x)), y: Math.max(0, Math.min(pack().map.height - 1, cursor.y)) }; layers(); populate(); checks(); resize(); $('draft-title').textContent = pack().title; }
  function commit(next) {
    if (history.commit(next)) { onChange(pack()); refresh(); }
    else draw();
  }
  function applyForms() {
    if (formDirty) {
      if (!$('props-adventure').reportValidity()) throw Error('Complete the adventure details before continuing.');
      const patch = Object.fromEntries(details.map(id => [id, id === 'par' ? Number($(id).value) : $(id).value]));
      patch.rules = { allCoins: $('all-coins').checked, noDash: $('no-dash').checked, noShield: $('no-shield').checked };
      // Collect both forms before a commit refreshes their fields.
      const objectPatch = objectDirty ? readObject() : null;
      let next = editAdventure(pack(), patch); if (objectPatch) next = editAdventure(next, { markers: next.markers.map(m => m.id === selected ? { ...m, ...objectPatch } : m) });
      commit(next);
    } else if (objectDirty) { const patch = readObject(); commit(editAdventure(pack(), { markers: pack().markers.map(m => m.id === selected ? { ...m, ...patch } : m) })); }
    return pack();
  }
  function readObject() {
    if (!$('props-object').reportValidity()) throw Error('Complete the selected object’s details.');
    return { rival: $('object-rival').value, name: $('object-name').value, text: $('object-text').value, channel: $('object-channel').value, reward: $('object-reward').value,
      order: Number($('object-order').value), vision: Number($('object-vision').value), offset: Number($('object-offset').value),
      initial: $('object-initial').checked, required: $('object-required').checked, nemesisOnly: $('object-nemesis').checked };
  }
  $('props-adventure').addEventListener('input', event => { if (event.target.id !== 'ws-test-rules') formDirty = true; });
  $('props-object').addEventListener('input', () => { objectDirty = true; });
  for (const id of ['adventure', 'object']) $('props-' + id).onsubmit = event => { event.preventDefault(); guard(() => { applyForms(); notice('World notes applied. Changes clear the old creator clear; playtest your new route.'); }); };
  $('delete-object').onclick = () => guard(() => { applyForms(); commit(editAdventure(pack(), { markers: pack().markers.filter(m => m.id !== selected) })); });
  const help = { start:'Start here. Moving this brush moves your one starting point.', beacon:'Restore all required goals, then reach this beacon. Relics are delivered here too.', lantern:'Every lantern must be restored before the beacon opens.', coin:'Treasure adds points. Adventure details can require every coin.', key:'A brass key opens one key gate.', gate:'A locked gate consumes one brass key when crossed.', crate:'Push crates onto plates. Leave enough room to push from the correct side.', plate:'A player, crate, or Echoist double can hold a pressure plate.', bridge:'A pressure bridge opens while every plate on its linked channel is held.', lever:'One lever per channel. It opens linked doors and disables linked embers.', door:'This door opens when its channel’s lever is on.', bell:'Ring bells in their numbered order. All bells are required.', signal:'A signal gate opens after the full bell sequence.', waystone:'Place exactly two stones on a channel and choose a specialist toolkit.', guide:'Give a keeper a story, supplies, or a choice that opens a linked route.', rescue:'Return to rescue this keeper after restoring every lantern.', relic:'Carry this singing relic to the beacon. Hunters can hear it.', supplies:'A cache refills tactical supplies once per run.', heart:'A healing heart restores health when collected.', fern:'Walk quietly through cover to hide from distant hunters.', ember:'Embers pulse on a four-turn cycle. A linked lever can cool them.', patrol:'Select this warden with Inspect to draw its adjacent-cell patrol route.', hunter:'Adaptive hunters learn your movement during each run. Inspect to edit sight and waypoints.', watcher:'A Watcher projects movement and charges dangerous sweep attacks.' };
  function setBrush(next) { guard(() => { applyForms(); route = false; keyboardCorner = null; brush = next; if(next.type !== 'inspect'){selected=null;populateObject();} draw(); if (help[next.id]) notice(help[next.id]); if(next.type==='stamp') notice('Stamps replace a small area, including its objects. Undo restores it. Leave three tiles around a crossing, two around a camp or grove.'); }); }
  $('inspect-tool').onclick = () => setBrush({ type: 'inspect', name: 'Inspect' });
  $('erase-tool').onclick = () => setBrush({ type: 'erase', name: 'Erase object' });
  $('pan-tool').onclick = () => setBrush({ type: 'pan', name: 'Pan · drag the world' });
  $('undo').onclick = () => guard(() => { applyForms(); if (history.undo()) { onChange(pack()); refresh(); } });
  $('redo').onclick = () => guard(() => { applyForms(); if (history.redo()) { onChange(pack()); refresh(); } });
  $('zoom').onchange = resize; $('layer').onchange = () => { $('layer-visible').checked = pack().map.layers.find(l => l.id === $('layer').value).visible; draw(); };
  $('layer-visible').onchange = () => guard(() => { const visible=$('layer-visible').checked; applyForms(); commit(editAdventure(pack(), { map:{...pack().map, layers:pack().map.layers.map(l=>l.id===$('layer').value?{...l,visible}:l)} })); }); $('paint-mode').onchange = () => { keyboardCorner = null; draw(); };
  function palette() {
    const groups = ['Terrain', 'Goals', 'Puzzles', 'Story', 'Threats', 'Stamps'];
    $('brush-groups').replaceChildren(...groups.map(name => { const button = document.createElement('button'); button.textContent = name; button.setAttribute('aria-pressed', String(group === name)); button.onclick = () => { group = name; palette(); }; return button; }));
    const options = group === 'Terrain' ? TILES.map(t => ({ type: 'terrain', id: t.id, name: t.name })) : group === 'Stamps' ? [['grove','Lantern grove'],['camp','Supply camp'],['crossing','Pressure crossing']].map(([id,name]) => ({ type: 'stamp', id, name })) : OBJECTS.filter(o => o.group === group).map(o => ({ ...o, type: 'object' }));
    $('brushes').replaceChildren(...options.map(option => {
      const button = document.createElement('button'), art = document.createElement('canvas'); art.width = art.height = 24; const ctx = art.getContext('2d');
      if (option.type === 'terrain') drawTile(ctx, option.id, 0, 0); else drawWorkshopObject(ctx, { x: 0, y: 0, kind: option.type === 'stamp' ? { grove:'lantern',camp:'supplies',crossing:'bridge' }[option.id] : option.id });
      button.title = help[option.id] || ''; button.append(art, document.createTextNode(option.name)); button.onclick = () => { if (option.type === 'terrain') $('layer').selectedIndex = option.id <= 6 ? 0 : Math.min(1, pack().map.layers.length - 1); $('layer-visible').checked = pack().map.layers.find(l=>l.id===$('layer').value).visible; setBrush(option); $('palette-dialog').close(); canvas.focus({ preventScroll: true }); }; return button;
    }));
  }
  $('brush').onclick = () => guard(() => { applyForms(); palette(); $('palette-dialog').showModal(); });
  $('palette-close').onclick = () => $('palette-dialog').close();
  $('route').onclick = () => guard(() => {
    applyForms(); const item = pack().markers.find(m => m.id === selected); if (!item?.route) return;
    route = true; commit(editAdventure(pack(), { markers: pack().markers.map(m => m.id === selected ? { ...m, route: [{ x:m.x, y:m.y }] } : m) }));
    if ($('inspector-dialog').open) $('inspector-dialog').close(); notice('Choose the next land cells. A route needs 2–24 waypoints. Choose Selected object → Finish route when done.');
  });
  $('route-finish').onclick = () => { route = false; populateObject(); draw(); };
  function at(event) { const r = canvas.getBoundingClientRect(); return { x: Math.max(0, Math.min(pack().map.width - 1, Math.floor((event.clientX - r.left) / r.width * pack().map.width))), y: Math.max(0, Math.min(pack().map.height - 1, Math.floor((event.clientY - r.top) / r.height * pack().map.height))) }; }
  function operation(base, p, start = p) {
    if(brush.type==='capture'){area={x:Math.min(start.x,p.x),y:Math.min(start.y,p.y),width:Math.abs(start.x-p.x)+1,height:Math.abs(start.y-p.y)+1};return base;}
    if (brush.type === 'erase') return editAdventure(base, { markers: base.markers.filter(m => m.x !== p.x || m.y !== p.y) });
    if (brush.type === 'object') return placeObject(base, brush.id, p.x, p.y);
    if (brush.type === 'stamp') return applyStamp(base, brush.id, p.x, p.y);
    if (brush.type === 'terrain') {
      const cells = $('paint-mode').value === 'rectangle' ? rectangleCells(start, p) : $('paint-mode').value === 'fill' ? floodCells(base.map, $('layer').value, p.x, p.y) : [p];
      const map = paintCells(base.map, $('layer').value, cells, brush.id); return map === base.map ? base : editAdventure(base, { map });
    }
    return base;
  }
  function select(p) {
    const items = pack().markers.filter(m => m.x === p.x && m.y === p.y).sort((a,b) => Number(['fern','ember'].includes(a.kind)) - Number(['fern','ember'].includes(b.kind))); const i = items.findIndex(m => m.id === selected);
    selected = items.length ? items[(i + 1) % items.length].id : null; populateObject(); panel('object', !!selected); draw();
  }
  function addRoute(p) {
    const item = pack().markers.find(m => m.id === selected); if (!item?.route) return;
    const last = item.route.at(-1); if (last.x === p.x && last.y === p.y) return;
    if (item.route.length >= 24) throw Error('This route already has 24 waypoints. Finish it or begin a new route.');
    if (item.kind === 'patrol' && Math.abs(last.x - p.x) + Math.abs(last.y - p.y) !== 1) throw Error('Patrol cells must touch edge to edge. Choose the next adjacent cell.');
    commit(editAdventure(pack(), { markers: pack().markers.map(m => m.id === selected ? { ...m, route: [...m.route, p] } : m) }));
  }
  canvas.addEventListener('pointerdown', event => guard(() => {
    if (event.button !== 0 || stroke) return; applyForms(); cursor = at(event); canvas.focus({ preventScroll: true });
    if (route) { addRoute(cursor); return; } if (brush.type === 'inspect') { select(cursor); return; }
    stroke = { id:event.pointerId, start:cursor, last:cursor, base:pack(), next:pack(), clientX:event.clientX, clientY:event.clientY, left:viewport.scrollLeft, top:viewport.scrollTop };
    canvas.setPointerCapture(event.pointerId); if (brush.type !== 'pan') stroke.next = operation(pack(), cursor); draw();
  }));
  canvas.addEventListener('pointermove', event => guard(() => {
    cursor = at(event); if (!stroke) { draw(); return; }
    if (brush.type === 'pan') { viewport.scrollLeft = stroke.left - event.clientX + stroke.clientX; viewport.scrollTop = stroke.top - event.clientY + stroke.clientY; return; }
    if (cursor.x === stroke.last.x && cursor.y === stroke.last.y) return;
    const previous = stroke.last; stroke.last = cursor;
    if (brush.type === 'stamp' || $('paint-mode').value === 'fill' && brush.type === 'terrain') return;
    if (brush.type === 'terrain' && $('paint-mode').value === 'brush') { stroke.next = editAdventure(stroke.next, { map:paintCells(stroke.next.map, $('layer').value, lineCells(previous,cursor), brush.id) }); draw(); return; }
    stroke.next = operation(brush.type === 'terrain' && $('paint-mode').value === 'rectangle' ? stroke.base : stroke.next, cursor, stroke.start); draw();
  }));
  function finish(cancel = false) { if (!stroke) return; const old = stroke; stroke = null; if (canvas.hasPointerCapture(old.id)) canvas.releasePointerCapture(old.id); if (!cancel) { if(brush.type==='capture'){openAssemblies(true);return;} commit(old.next); } else {if(brush.type==='capture')area=null;draw();} }
  canvas.addEventListener('pointerup', () => finish()); canvas.addEventListener('pointercancel', () => finish(true)); canvas.addEventListener('lostpointercapture', () => finish(true));
  canvas.addEventListener('keydown', event => guard(() => {
    const directions = { ArrowUp:[0,-1],ArrowRight:[1,0],ArrowDown:[0,1],ArrowLeft:[-1,0] };
    if (directions[event.key]) { event.preventDefault(); const [dx,dy] = directions[event.key]; cursor = { x:Math.max(0,Math.min(pack().map.width-1,cursor.x+dx)),y:Math.max(0,Math.min(pack().map.height-1,cursor.y+dy)) }; draw(); revealCursor(); }
    else if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); applyForms(); if (route) addRoute(cursor); else if (brush.type === 'inspect') select(cursor); else if (brush.type !== 'pan') {
      if ((brush.type === 'capture' || brush.type === 'terrain' && $('paint-mode').value === 'rectangle') && !keyboardCorner) { keyboardCorner = { ...cursor }; notice('First corner set. Move to the opposite corner and press Space.'); }
      else { commit(operation(pack(), cursor, keyboardCorner || cursor)); keyboardCorner = null; if(brush.type==='capture')openAssemblies(true); }
    } } else if (event.key === 'Escape') { finish(true); keyboardCorner = null; route = false; if(brush.type==='capture'){area=null;brush={type:'inspect',name:'Inspect'};} populateObject(); draw(); }
    else if (event.key === 'Delete' && selected) { event.preventDefault(); $('delete-object').click(); }
  }));
  function assemblyNote(text,error=false){$('assembly-notice').textContent=text;$('assembly-notice').dataset.error=String(error);}
  function assemblyGuard(fn){try{return fn();}catch(error){assemblyNote(error.message,true);return false;}}
  function openAssemblies(captured=false){
    applyForms();const b=area||{...cursor,width:Math.min(3,pack().map.width-cursor.x),height:Math.min(3,pack().map.height-cursor.y)};
    for(const [id,value] of [['x',b.x+1],['y',b.y+1],['width',b.width],['height',b.height]])$('assembly-'+id).value=value;
    $('assembly-x').max=pack().map.width;$('assembly-y').max=pack().map.height;
    $('assembly-position').textContent=`Place at column ${cursor.x+1}, row ${cursor.y+1}. Move the map cursor before opening assemblies to change this position.`;
    $('assembly-items').replaceChildren(...assemblies.map((assembly,index)=>{
      const card=document.createElement('article'),title=document.createElement('h3'),detail=document.createElement('p'),place=document.createElement('button'),remove=document.createElement('button'),art=document.createElement('canvas');
      title.textContent=assembly.name;detail.textContent=`${assembly.map.width} × ${assembly.map.height} · ${assembly.markers.length} objects`;
      const ctx=art.getContext('2d');art.width=assembly.map.width*12;art.height=assembly.map.height*12;ctx.scale(.5,.5);for(const layer of assembly.map.layers)if(layer.visible)layer.tiles.forEach((tile,i)=>drawTile(ctx,tile,i%assembly.map.width*24,Math.floor(i/assembly.map.width)*24));for(const item of assembly.markers)drawWorkshopObject(ctx,item);art.setAttribute('aria-hidden','true');
      place.textContent='Place at cursor';place.onclick=()=>assemblyGuard(()=>{commit(pasteAssembly(pack(),assembly,cursor,Number($('assembly-rotation').value)));$('assemblies-dialog').close();setBrush({type:'inspect',name:'Inspect'});notice('Assembly placed with fresh object IDs and independent puzzle channels. Undo restores the whole placement.');canvas.focus({preventScroll:true});});
      remove.textContent='Remove';remove.onclick=()=>{if(!confirm(`Remove the saved assembly “${assembly.name}”? Placed copies stay in their worlds.`))return;assemblies=assemblies.filter((_,i)=>i!==index);const ok=saveAssemblies(storage,assemblies);openAssemblies();assemblyNote(ok?'Assembly removed.':'Removed for this visit; saving is unavailable.',!ok);};card.append(art,title,detail,place,remove);return card;
    }));
    if(!assemblies.length)$('assembly-items').textContent='Your reusable puzzles will appear here. Capture a small area to begin.';
    assemblyNote(loadedAssemblies.failed?'Saved assemblies could not be read. Your world draft is safe.':`${assemblies.length}/${MAX_ASSEMBLIES} personal assemblies · included in journey backups`,loadedAssemblies.failed);
    if(!$('assemblies-dialog').open)$('assemblies-dialog').showModal();
    if(captured)$('assemblies-dialog').querySelector('details').open=true;
  }
  $('assemblies').onclick=()=>guard(openAssemblies);
  $('assemblies-close').onclick=()=>{$('assemblies-dialog').close();setBrush({type:'inspect',name:'Inspect'});canvas.focus({preventScroll:true});};
  $('assembly-select').onclick=()=>{$('assemblies-dialog').close();area=null;setBrush({type:'capture',name:'Select assembly · drag an area, or choose two corners with Space'});canvas.focus({preventScroll:true});notice('Drag across the puzzle to capture it. Keyboard: Space sets the first corner; move and press Space again. Include all linked objects and patrol waypoints.');};
  $('assembly-form').onsubmit=event=>{event.preventDefault();assemblyGuard(()=>{if(assemblies.length>=MAX_ASSEMBLIES)throw Error('All twelve assembly slots are in use. Remove an assembly to make room.');const bounds={x:Number($('assembly-x').value)-1,y:Number($('assembly-y').value)-1,width:Number($('assembly-width').value),height:Number($('assembly-height').value)},assembly=captureAssembly(pack(),bounds,$('assembly-name').value);assemblies=[...assemblies,assembly];const ok=saveAssemblies(storage,assemblies);openAssemblies();$('assemblies-dialog').querySelector('details').open=false;assemblyNote(ok?'Assembly saved. Its linked puzzles receive fresh channels when placed.':'Assembly kept for this visit. Browser saving is unavailable.',!ok);});};
  const quick=[['terrain',1,'Meadow'],['terrain',3,'Water'],['terrain',7,'Trees'],['object','lantern','Light'],['object','guide','Keeper'],['object','crate','Crate'],['object','plate','Plate'],['object','bridge','Bridge']];
  $('quick-brushes').replaceChildren(...quick.map(([type,id,name])=>{const button=document.createElement('button'),art=document.createElement('canvas');art.width=art.height=24;button.dataset.wsQuick=`${type}:${id}`;button.title=name;button.setAttribute('aria-label',`${name} quick brush`);if(type==='terrain')drawTile(art.getContext('2d'),id,0,0);else drawWorkshopObject(art.getContext('2d'),{x:0,y:0,kind:id});button.append(art,document.createTextNode(name));button.onclick=()=>{if(type==='terrain'){$('layer').selectedIndex=id<=6?0:Math.min(1,pack().map.layers.length-1);$('layer-visible').checked=pack().map.layers.find(l=>l.id===$('layer').value).visible;}setBrush({type,id,name});canvas.focus({preventScroll:true});};return button;}));
  new ResizeObserver(resize).observe(viewport);
  refresh();
  return { get: () => applyForms(), refresh, draw, panel,
    get cursor() { return { ...cursor }; },
    transform(operation) { applyForms(); finish(true); const next = transformAdventure(pack(), operation), point = next.markers.find(marker => marker.id === selected) || next.markers.find(marker => marker.kind === 'start') || { x: 0, y: 0 }; route = false; keyboardCorner = null; cursor = { x: point.x, y: point.y }; commit(next); },
    replace(next) { finish(true); history = new History(normalizeAdventure(next),30); selected=null; route=false; keyboardCorner=null; cursor={x:0,y:0}; refresh(); panel('adventure'); onChange(pack()); },
    attachProof(proof) { history.document = normalizeAdventure({ ...pack(), proof }); onChange(pack()); refresh(); },
    hide() { finish(true); for (const id of ['inspector-dialog','palette-dialog','assemblies-dialog']) if ($(id).open) $(id).close(); },
  };
}
