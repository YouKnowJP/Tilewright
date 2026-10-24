import { movementKey, controlHelp } from './adventure-controls.mjs';
import { createMapInput } from './adventure-input.mjs';
import { practiceWorld, paintPractice, tellPracticeStory, playLessonSteps, creatorLessonSteps, readTraining, saveTraining, practiceClear, PRACTICE_SPOTS } from './training-model.mjs';
import { adventureStage, checkAdventure, editAdventure } from './workshop-model.mjs';
import { createRun, nearbyInteractions } from './adventure.mjs';
import { createAdventureRenderer } from './adventure-render.mjs';
import { freshMemory } from './adventure-brain.mjs';
import { drawWorkshopWorld } from './workshop-art.mjs';
import { drawAtlasArt, CHAPTERS } from './adventure-art.mjs';
import { serializeAdventure, adventurePlayLink } from './workshop-sharing.mjs';
import { beginRewind, advanceRewind, undoRewind, canRewind } from './adventure-rewind.mjs';
import { readPractice, savePractice, restorePractice } from './training-checkpoint.mjs';

export function createTrainingUI({ storage, getPreferences, onControls, onHome, onStory, onWorkshop }) {
  const $ = id => document.getElementById(`training-${id}`), root = $('camp'), canvas = $('map');
  const sessions = new Map(), progress = readTraining(storage);
  let state = null, renderer = null, saveFailed = false, pointer = null, lastStep = '', lastKeyboardMove = 0,loadToken=0,practiceFailed=false;
  drawAtlasArt($('play-art'), CHAPTERS[0]); drawAtlasArt($('create-art'), CHAPTERS.find(chapter => chapter.id === 'coast'));

  const editing = () => state?.kind === 'create' && state.mode === 'build';
  const steps = () => state.kind === 'play' ? playLessonSteps(state.run) : creatorLessonSteps(state.pack, state);
  const message = text => { $('message').textContent = text; };
  function persistPractice(){if(!state)return;state.uiForm=editing()&&state.storyDirty?{title:$('world-title').value,opening:$('opening').value,dialogue:$('keeper-lines').value}:null;practiceFailed=!savePractice(storage,state);}
  function record(kind) {
    if (progress[kind]) return;
    progress[kind] = true; saveFailed = !saveTraining(storage, progress); renderRecords();
  }
  function renderRecords() {
    for (const kind of ['play', 'create']) $(kind + '-record').textContent = readPractice(storage,kind)?`Continue saved practice${progress[kind]?' · lesson complete':''}`:progress[kind] ? 'Lesson complete · revisit any time' : `${kind === 'play' ? 'About 5' : 'About 8'} minutes · ${kind === 'play' ? 'no enemies or timer' : 'guided practice table'}`;
    $('save-note').textContent = saveFailed||practiceFailed ? 'This visit keeps your lesson progress. Browser saving is unavailable; download any world you want to keep.' : 'Each lesson keeps its own saved practice. Choose it again to return after reload. Download a world to move it to another browser. Your main adventure and original worlds stay separate.';
  }
  function library() {
    loadToken++;
    $('library').hidden = false; $('lesson').hidden = true; $('lessons').hidden = true;
    renderRecords(); $('heading').focus({ preventScroll: true }); window.scrollTo(0, 0);
  }
  function formValues() {
    $('world-title').value = state.pack.title; $('opening').value = state.pack.intro;
    $('keeper-lines').value = state.pack.markers.find(marker => marker.kind === 'guide')?.text || '';
    state.storyDirty = false;
  }
  async function start(kind, reset = false) {
    const token=++loadToken;let recovery='';
    if(!reset&&!sessions.has(kind)){const saved=readPractice(storage,kind);if(saved)try{const restored=await restorePractice(saved,kind,()=>new Promise(resolve=>requestAnimationFrame(resolve)));if(token!==loadToken||root.hidden)return;sessions.set(kind,restored);recovery='Your saved practice is ready.';}catch{recovery='The earlier practice could not be restored. A fresh lesson is ready; your other adventures are retained.';}}
    if(token!==loadToken||root.hidden)return;
    if (reset || !sessions.has(kind)) {
      const pack = practiceWorld(kind);
      sessions.set(kind, { kind, pack, mode: kind === 'play' ? 'play' : 'build', run: kind === 'play' ? createRun(adventureStage(pack), { memory: freshMemory() }) : null,
        brush: 'bridge', cursor: { ...PRACTICE_SPOTS.bridge }, history: [pack], index: 0, checked: false, won: false, shared: false, actions: [], storyDirty: false, plan: false });
    }
    state = sessions.get(kind); state.plan = false; lastStep = ''; renderer = null;
    if(state.run&&!state.rewind)state.rewind=beginRewind(state.run,{kind:'world',world:state.pack,origin:kind==='create'?'build':'shelf'});
    $('library').hidden = true; $('lesson').hidden = false; $('lessons').hidden = false;
    $('title').textContent = kind === 'play' ? 'First Light Crossing' : 'A little island, made by you';
    $('hint-copy').hidden = true; $('share-note').textContent = ''; $('link-fallback').hidden = true;
    $('check-report').textContent = ''; $('story').open = false;
    if (kind === 'create') {const unfinished=state.uiForm;formValues();if(unfinished){$('world-title').value=unfinished.title;$('opening').value=unfinished.opening;$('keeper-lines').value=unfinished.dialogue;state.storyDirty=true;}}
    render(); message(recovery||(editing() ? 'Your starting point and beacon are ready. Make a crossing to the island.' : state.run.message));
    window.scrollTo(0, 0); canvas.focus({ preventScroll: true });
  }
  function draw() {
    if (root.hidden || $('lesson').hidden || !state) return;
    if (editing()) drawWorkshopWorld(canvas, state.pack, { grid: true, cursor: state.cursor });
    else {
      renderer ??= createAdventureRenderer(canvas, state.run.stage, { reducedMotion: { matches: true }, preferences:getPreferences });
      renderer.setState(state.run);const width=Math.max(200,canvas.parentElement.clientWidth||600);renderer.resize(width,Math.max(240,width*.8));renderer.draw();
      canvas.style.width = '100%'; canvas.style.height = 'auto';
    }
    const target = steps().find(step => !step.done)?.target;
    if (target) {
      const ctx = canvas.getContext('2d'); ctx.strokeStyle = '#fff0ac'; ctx.lineWidth = 2;
      ctx.setLineDash([4, 2]); ctx.strokeRect((editing()?target.x*24:renderer.projectPoint(target).x)+2,(editing()?target.y*24:renderer.projectPoint(target).y)+2,20,20); ctx.setLineDash([]);
    }
    canvas.setAttribute('aria-label', editing() ? `Practice world, 10 columns and 8 rows. ${state.brush} brush. Cursor column ${state.cursor.x + 1}, row ${state.cursor.y + 1}. Arrows move the cursor; Space paints.` : `${state.run.stage.name}. Player column ${state.run.player.x + 1}, row ${state.run.player.y + 1}. Turn ${state.run.turns}. ${state.run.status}.`);
  }
  function render() {
    const data = steps(), current = data.findIndex(step => !step.done), finished = current === -1, step = data[current];
    const identity = `${state.kind}:${current}`;
    if (identity !== lastStep) {
      $('hint-copy').hidden = true; lastStep = identity;
      if (editing() && current === 3) $('story').open = true;
    }
    $('step-count').textContent = finished ? 'LESSON COMPLETE' : `STEP ${current + 1} / ${data.length}`;
    $('progress').max = data.length; $('progress').value = data.filter(item => item.done).length;
    $('goal').textContent = finished ? (state.kind === 'play' ? 'Welcome to the trails.' : 'You made a real adventure.') : step.title;
    $('instruction').textContent = finished ? 'Take another road, replay this lesson, or keep creating. Your main game and original worlds are waiting where you left them.' : step.text;
    $('hint').hidden = finished; $('hint-copy').textContent = step?.hint || '';
    $('mode-note').textContent = editing() ? 'Practice table · marks show where to paint' : `Turn ${state.run.turns} · ${state.run.status === 'won' ? 'Trail restored' : 'No enemies or timer'}`;
    $('brushes').hidden = !editing(); $('build-actions').hidden = !editing();
    $('edit').hidden = state.kind !== 'create' || editing();
    $('map-help').textContent = editing() ? 'Choose a brush, then tap the marked square. Your movement keys move the cursor; Space paints.' : controlHelp(getPreferences())+' E interacts; Space waits; Z undoes the last action.';
    const blocked = !editing() && (state.run.status !== 'playing' || Boolean(state.run.dialogue) || state.plan);
    $('undo-action').hidden=editing();$('undo-action').disabled=editing()||!canRewind(state.rewind);
    $('play-controls').hidden = editing();
    for (const button of root.querySelectorAll('[data-training-move],#training-wait,#training-plan')) button.disabled = blocked;
    const nearby = !editing() ? nearbyInteractions(state.run) : [];
    const selected = $('target').value;
    $('target').replaceChildren(...nearby.map(item => new Option(item.label || item.name || item.id, item.id)));
    if (nearby.some(item => item.id === selected)) $('target').value = selected;
    $('target').hidden = nearby.length < 2; $('target').disabled = blocked;
    $('interact').disabled = blocked || !nearby.length;
    const npc = !editing() && state.run.stage.npcs.find(item => item.id === state.run.dialogue);
    if (npc) { $('speaker').textContent = npc.name; $('dialogue').textContent = state.run.rescued.includes(npc.id) ? npc.after : npc.lines.join(' '); if (!$('talk').open) $('talk').showModal(); }
    else if ($('talk').open) $('talk').close();
    if (state.plan && !$('plan-copy').open) $('plan-copy').showModal();
    else if (!state.plan && $('plan-copy').open) $('plan-copy').close();
    $('undo').disabled = state.index === 0; $('redo').disabled = state.index === state.history.length - 1;
    for (const button of root.querySelectorAll('[data-training-brush]')) button.setAttribute('aria-pressed', String(button.dataset.trainingBrush === state.brush));
    $('test').disabled = !data.slice(0, 5).every(item => item.done) || state.storyDirty;
    $('keep').hidden = state.kind !== 'create' || !state.won;
    $('finish').hidden = !finished;
    $('next').hidden = state.kind !== 'play';
    if (state.kind === 'create' && state.won) {
      try { adventurePlayLink(state.pack, location.href); $('copy-link').disabled = false; }
      catch (error) { $('copy-link').disabled = true; $('share-note').textContent = error.message; }
    }
    if (finished) record(state.kind);
    persistPractice();
    $('mode-note').textContent=`${editing()?'Practice table':state.run.status==='won'?'Trail restored':`Turn ${state.run.turns}`} · ${practiceFailed?'Session only':'Saved here'}`;
    draw();
  }
  function change(pack, { restoreForm = false } = {}) {
    state.pack = editAdventure(pack, {}); state.checked = false; state.won = false; state.shared = false;
    state.run=null;state.rewind=null;state.actions=[];
    state.history = state.history.slice(0, state.index + 1); state.history.push(state.pack);
    if (state.history.length > 30) state.history.shift(); state.index = state.history.length - 1;
    if (restoreForm) formValues(); $('check-report').textContent = ''; render();
  }
  function paint(point) {
    if (!editing()) return;
    try { state.cursor = point; change(paintPractice(state.pack, state.brush, point)); message(`${state.brush === 'guide' ? 'Keeper' : state.brush === 'lantern' ? 'Lantern' : 'Crossing'} placed. Undo is available if you want to try again.`); }
    catch (error) { message(error.message); draw(); }
  }
  function act(action) {
    if (!state || editing() || state.plan || $('lesson').hidden) return;
    const before = state.run;state.rewind=advanceRewind(state.rewind,action);state.run=state.rewind.run;state.actions=state.rewind.actions;
    if (state.run.status === 'won' && before.status !== 'won' && state.kind === 'create') { state.won = true; state.pack = practiceClear(state.pack, state.actions); }
    render(); message(state.run.message);
    if (state.run.status === 'won') (state.kind === 'play' ? $('next') : $('download')).focus({ preventScroll: true });
  }
  function interact() { const target = $('target').value; if (target) act(`interact:${target}`); }
  function undoAction(){const dialog=document.querySelector('dialog[open]');if(root.hidden||$('lesson').hidden||dialog&&dialog.id!=='training-talk'||!state||editing()||!canRewind(state.rewind))return;state.rewind=undoRewind(state.rewind);state.run=state.rewind.run;state.actions=state.rewind.actions;state.plan=false;renderer=null;render();message(`Last action undone. Back to turn ${state.run.turns}.`);if(!state.run.dialogue)canvas.focus({preventScroll:true});}
  $('undo-action').onclick=undoAction;
  function keep(session = state) { session.shared = true; record('create'); if (session === state && !root.hidden) render(); }
  $('home').onclick = onHome; $('lessons').onclick = library;
  for (const button of root.querySelectorAll('[data-training-lesson]')) button.onclick = () => start(button.dataset.trainingLesson);
  $('next').onclick = () => start('create'); $('story-adventure').onclick = onStory;
  $('restart').onclick = () => start(state.kind, true);
  $('hint').onclick = () => { $('hint-copy').hidden = !$('hint-copy').hidden; };
  for (const button of root.querySelectorAll('[data-training-brush]')) button.onclick = () => { state.brush = button.dataset.trainingBrush; state.cursor = { ...PRACTICE_SPOTS[state.brush] }; render(); canvas.focus({ preventScroll: true }); };
  for (const [id, delta] of [['undo', -1], ['redo', 1]]) $(id).onclick = () => {
    const index = state.index + delta; if (index < 0 || index >= state.history.length) return;
    state.index = index; state.pack = state.history[index]; state.checked = state.won = state.shared = false;
    state.run=null;state.rewind=null;state.actions=[];
    formValues(); $('check-report').textContent = ''; render(); message('Practice edit restored.'); canvas.focus({ preventScroll: true });
  };
  $('story-form').oninput = () => { state.storyDirty = true; state.checked = false; render(); };
  $('story-form').onsubmit = event => {
    event.preventDefault();
    try {
      const title = $('world-title').value.trim(), intro = $('opening').value.trim(), dialogue = $('keeper-lines').value.trim();
      if (!title || !intro || !dialogue) throw Error('Add a title, an opening, and the keeper’s hint before saving your story.');
      if (!state.pack.markers.some(marker => marker.kind === 'guide')) throw Error('Place your keeper first so they can tell your story.');
      const next = tellPracticeStory(state.pack, { title, intro, dialogue });
      if (!creatorLessonSteps(next)[3].done) throw Error('Make it yours: change the practice title, write your own opening, and replace the keeper’s placeholder hint.');
      change(next, { restoreForm: true });
      $('story').open = false; message('Your story is saved on the practice table. Check the world before setting out.');
    } catch (error) { message(error.message); }
  };
  $('check').onclick = () => {
    const report = checkAdventure(state.pack); state.checked = report.ready && !state.storyDirty;
    const text = state.storyDirty ? 'Save your latest story changes first.' : report.ready ? 'World checks passed. Your bridge connects both banks and the lantern has a return route. Playtest to prove the journey.' : report.errors.join(' ');
    $('check-report').textContent = text; render(); message(text);
  };
  $('test').onclick = () => {
    if ($('test').disabled) return;
    state.run = createRun(adventureStage(state.pack), { memory: freshMemory() }); state.actions = []; state.mode = 'play'; state.plan = false; renderer = null;
    state.rewind=beginRewind(state.run,{kind:'world',world:state.pack,origin:'build'});
    render(); message(state.run.message); canvas.focus({ preventScroll: true });
  };
  $('edit').onclick = () => { state.mode = 'build'; state.plan = false; renderer = null; render(); message('Back at your practice table. Editing your world removes its previous creator clear.'); canvas.focus({ preventScroll: true }); };
  for (const button of root.querySelectorAll('[data-training-move]')) button.onclick = () => { act(button.dataset.trainingMove); canvas.focus({ preventScroll: true }); };
  $('wait').onclick = () => { act('wait'); canvas.focus({ preventScroll: true }); };
  $('interact').onclick = () => { interact(); if (!$('talk').open) canvas.focus({ preventScroll: true }); };
  $('talk-close').onclick = () => { act('close-dialogue'); canvas.focus({ preventScroll: true }); };
  $('plan').onclick = () => { state.plan = true; render(); $('plan-close').focus({ preventScroll: true }); };
  $('plan-close').onclick = () => { state.plan = false; render(); canvas.focus({ preventScroll: true }); };
  $('download').onclick = () => {
    if (!state.won) return;
    const url = URL.createObjectURL(new Blob([serializeAdventure(state.pack)], { type: 'application/json' })), a = document.createElement('a');
    a.href = url; a.download = 'my-first-adventure.trail.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    keep(); $('share-note').textContent = 'Your adventure file is ready. A friend opens Workshop → Import & play, then chooses this file.';
  };
  $('copy-link').onclick = async () => {
    if (!state.won) return;
    const session = state; let link;
    try { link = adventurePlayLink(session.pack, location.href); await navigator.clipboard.writeText(link); keep(session); if (state === session && !root.hidden) $('share-note').textContent = 'Play link copied. It opens your world’s preview on this website.'; }
    catch (error) {
      if (state !== session || root.hidden) return;
      if (!link) { $('share-note').textContent = error.message; return; }
      $('link-fallback').hidden = false; $('link-text').value = link; $('link-text').focus(); $('link-text').select(); $('share-note').textContent = 'Copy the selected play link, or download your world instead.';
    }
  };
  $('link-text').addEventListener('copy', () => keep());
  $('workshop').onclick = () => { if (state.won && onWorkshop(state.pack)) keep(); };
  canvas.addEventListener('keydown', event => {
    if (root.hidden || $('lesson').hidden || event.ctrlKey || event.metaKey || event.altKey) return;
    const direction=movementKey(event.key,getPreferences().keyboardLayout);
    const handled=direction||event.code==='Space'||event.key==='Enter'||['e','z'].includes(event.key.toLowerCase());
    if(handled)event.preventDefault();
    if(event.repeat&&(!direction||getPreferences().keyRepeat!=='on'||performance.now()-lastKeyboardMove<160))return;
    if (direction) {
      lastKeyboardMove=performance.now();
      if (editing()) { const [dx, dy] = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] }[direction]; state.cursor = { x: Math.max(0, Math.min(9, state.cursor.x + dx)), y: Math.max(0, Math.min(7, state.cursor.y + dy)) }; persistPractice();draw(); }
      else act(direction);
    } else if (event.code === 'Space' || event.key === 'Enter') { event.preventDefault(); if (editing()) paint(state.cursor); else act('wait'); }
    else if (event.key.toLowerCase() === 'e' && !editing()) { event.preventDefault(); interact(); }
    else if(event.key.toLowerCase()==='z'&&!editing())undoAction();
  });
  $('talk').addEventListener('cancel', event => { event.preventDefault(); $('talk-close').click(); });
  $('plan-copy').addEventListener('cancel', event => { event.preventDefault(); $('plan-close').click(); });
  canvas.addEventListener('pointerdown', event => { if (!state||!editing()||event.button!==0||event.isPrimary===false) { pointer=null;return; } pointer = { x: event.clientX, y: event.clientY, id: event.pointerId }; canvas.setPointerCapture(event.pointerId); canvas.focus({ preventScroll: true }); });
  for(const type of ['pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>{pointer=null;});
  window.addEventListener('blur',()=>{pointer=null;});window.addEventListener('resize',()=>{pointer=null;});
  canvas.addEventListener('pointerup', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    pointer = null;if(!canvas.hasPointerCapture(event.pointerId))return;
    if (editing()) {
      const rect = canvas.getBoundingClientRect(), point = { x: Math.floor((event.clientX - rect.x) * 10 / rect.width), y: Math.floor((event.clientY - rect.y) * 8 / rect.height) };
      paint(point);
    }
    if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
  });
  const mapInput=createMapInput(canvas,{preferences:getPreferences,enabled:()=>!root.hidden&&!$('lesson').hidden&&state&&!editing()&&state.run.status==='playing'&&!state.run.dialogue&&!state.plan&&!document.querySelector('dialog[open]'),origin:()=>{const rect=canvas.getBoundingClientRect(),point=renderer?.playerAnchor()||{x:.5,y:.5};return {x:rect.left+rect.width*point.x,y:rect.top+rect.height*point.y};},onMove:act});
  $('controls-settings').onclick=()=>{mapInput.cancel();onControls();};
  return {
    refreshPreferences(){draw();},
    refresh(){mapInput.cancel();if(state&&!root.hidden)render();},
    control(command){
      if(root.hidden||$('lesson').hidden||!state)return false;
      if(command==='undo'){undoAction();return true;}
      if(command==='pause'){library();return true;}
      if(!editing()&&state.run.status!=='playing')return false;
      if(['up','right','down','left'].includes(command))canvas.dispatchEvent(new KeyboardEvent('keydown',{key:{up:'ArrowUp',right:'ArrowRight',down:'ArrowDown',left:'ArrowLeft'}[command],bubbles:true}));
      else if(command==='interact'){if(editing())paint(state.cursor);else interact();}else if(command==='back'&&!editing())act('wait');else if(command==='plan'&&!editing())$('plan').click();
      return true;
    },
    show() { root.hidden = false; library(); },
    hide() { loadToken++;root.hidden = true; pointer = null; mapInput.cancel(); for (const id of ['talk', 'plan-copy']) if ($(id).open) $(id).close(); },
  };
}
