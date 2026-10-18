import { createRun, createCustomStage, stepRun, resultFor, activePlates, scoutHint, MAX_HEARTS, MAX_ENERGY } from './adventure.mjs';
import { createCampaign } from './adventure-levels.mjs';
import { createAdventureRenderer } from './adventure-render.mjs';
import { createAdventureSound } from './adventure-sound.mjs';
import { loadRecords, saveResult } from './adventure-records.mjs';
import { createIcon } from './icons.mjs';

export function createAdventureUI({ storage, getMap, backToEditor }) {
  const $ = selector => document.querySelector(selector);
  const canvas = $('#adventure-canvas'), viewport = $('#game-viewport'), campaign = createCampaign();
  const sound = createAdventureSound(), motion = matchMedia('(prefers-reduced-motion: reduce)');
  let records = loadRecords(storage), run = null, renderer = null;
  let active = false, paused = false, dashArmed = false, frame = null, lastDraw = 0, lastAction = 0, pointer = null;
  let saveFailed = false, hintVisible = false;

  function stageUnlocked(index) { return index === 0 || Boolean(records[campaign[index - 1].id]); }

  function renderPicker() {
    $('#trail-picker').replaceChildren(...campaign.map((stage, index) => {
      const button = document.createElement('button'); button.className = 'trail-card'; button.dataset.stage = stage.id;
      button.disabled = !stageUnlocked(index); button.classList.toggle('selected', run?.stage.id === stage.id);
      button.setAttribute('aria-pressed', String(run?.stage.id === stage.id));
      const number = Object.assign(document.createElement('span'), { className: 'trail-number', textContent: `0${index + 1}` });
      const title = Object.assign(document.createElement('strong'), { textContent: stage.name });
      const subtitle = Object.assign(document.createElement('span'), { className: 'trail-subtitle', textContent: stage.subtitle });
      const record = records[stage.id];
      const progress = Object.assign(document.createElement('span'), { className: 'trail-progress',
        textContent: !stageUnlocked(index) ? `Finish ${campaign[index - 1].name} to unlock` : record ? `${'★'.repeat(record.stars)} · ${record.turns} turns · ${record.score} points` : 'Unexplored · collect three lanterns' });
      button.append(number, title, subtitle, progress);
      button.addEventListener('click', () => start(stage)); return button;
    }));
  }

  function resize() {
    if (!renderer || !active || viewport.clientWidth < 1) return;
    renderer.resize(Math.max(80, viewport.clientWidth - 32), Math.max(80, viewport.clientHeight - 32));
    renderer.draw(); renderer.drawMinimap($('#game-minimap'));
  }

  function animate(time) {
    frame = null;
    if (!active || !renderer) return;
    if (time - lastDraw > 30) { renderer.draw(time); lastDraw = time; }
    if (!paused && !document.hidden && !motion.matches && (run.status === 'playing' || time - lastAction < 900)) frame = requestAnimationFrame(animate);
  }
  function paint() {
    renderer?.draw();
    if (active && frame === null) frame = requestAnimationFrame(animate);
  }

  function resource(container, value, max, heart = false) {
    const nodes = [];
    for (let i = 0; i < max; i++) {
      const node = document.createElement('span'); node.className = `resource-pip ${heart ? 'heart-pip' : 'energy-pip'} ${i < value ? 'filled' : ''}`;
      node.setAttribute('aria-hidden', 'true'); if (heart) node.append(createIcon('heart')); nodes.push(node);
    }
    container.replaceChildren(...nodes); container.setAttribute('aria-label', `${heart ? 'Health' : 'Energy'}: ${value} of ${max}`);
  }

  function update() {
    if (!run) return;
    const stage = run.stage, result = resultFor(run), index = campaign.findIndex(item => item.id === stage.id);
    $('#game-title').textContent = stage.name;
    $('#game-subtitle').textContent = `${index < 0 ? 'Expedition on your map' : `Trail ${index + 1} of ${campaign.length} · ${stage.subtitle}`} · 3★ target: ${stage.par} turns`;
    $('#game-story').textContent = stage.intro;
    $('#game-lanterns').textContent = `${run.collectedLanterns.length}/${stage.lanterns.length}`;
    $('#game-turns').textContent = run.turns;
    $('#game-keys').textContent = run.keyCount;
    $('#game-coins').textContent = `${run.collectedCoins.length}/${stage.coins.length}`;
    resource($('#game-health'), run.health, MAX_HEARTS, true); resource($('#game-energy'), run.energy, MAX_ENERGY);
    $('#quest-lanterns').textContent = `${run.collectedLanterns.length === stage.lanterns.length ? '✓' : '○'} Restore all ${stage.lanterns.length} lanterns`;
    $('#quest-plates').hidden = !stage.plates.length;
    $('#quest-plates').textContent = `${activePlates(run).length === stage.plates.length ? '✓' : '○'} Hold ${stage.plates.length} copper ${stage.plates.length === 1 ? 'plate' : 'plates'} with crates`;
    $('#quest-beacon').textContent = `${run.status === 'won' ? '✓' : '○'} Reach the turquoise beacon`;
    $('#game-hint').hidden = !hintVisible;
    $('#game-hint-text').textContent = scoutHint(run);
    $('#game-hint-button').setAttribute('aria-expanded', String(hintVisible));
    $('#game-status').textContent = paused ? 'Paused. Resume when you are ready; the world only moves when you do.' : run.message;
    $('#dash-button').classList.toggle('armed', dashArmed); $('#dash-button').setAttribute('aria-pressed', String(dashArmed));
    $('#dash-button').disabled = paused || run.status !== 'playing' || run.energy < 2;
    document.querySelectorAll('[data-move], #game-wait').forEach(button => { button.disabled = paused || run.status !== 'playing'; });
    $('#game-pause').textContent = paused ? 'Resume' : 'Pause'; $('#game-pause').setAttribute('aria-pressed', String(paused));
    $('#game-pause').disabled = run.status !== 'playing';
    const best = records[stage.id];
    $('#game-best').textContent = best ? `${'★'.repeat(best.stars)} · ${best.score} points · ${best.turns} turns` : 'No finish yet. Your first adventure starts here.';
    $('#game-save-note').textContent = saveFailed ? 'Browser saving is unavailable. Unlocks and bests remain available for this session. Your editor map is untouched.'
      : 'Adventure bests are kept in this browser. Playing never changes your editor map or its undo history.';
    $('#adventure').dataset.status = run.status;
    canvas.setAttribute('aria-label', `${stage.name}. Column ${run.player.x + 1}, row ${run.player.y + 1}. Health ${run.health} of 3. ${run.collectedLanterns.length} of ${stage.lanterns.length} lanterns. ${run.message}`);
    $('#game-overlay').hidden = !paused && run.status === 'playing';
    if (paused) {
      $('#game-result-eyebrow').textContent = 'A MOMENT ON THE TRAIL'; $('#game-result-title').textContent = 'Take a breather.';
      $('#game-result-text').textContent = 'No ticking clock. Plan your next move, then head back out.'; $('#game-primary').textContent = 'Resume adventure';
      $('#game-stars').textContent = '';
    } else if (result) {
      $('#game-result-eyebrow').textContent = 'TRAIL RESTORED'; $('#game-result-title').textContent = 'You brought back the light.';
      $('#game-result-text').textContent = `${result.score} points · ${result.turns} turns · ${run.collectedCoins.length} treasures. ${result.stars === 3 ? 'A perfect three-star trail!' : `Try a clean run in ${stage.par} turns for three stars.`}`;
      $('#game-stars').textContent = '★'.repeat(result.stars) + '☆'.repeat(3 - result.stars);
      $('#game-stars').setAttribute('aria-label', `${result.stars} of 3 stars`);
      $('#game-primary').textContent = index >= 0 && index < campaign.length - 1 ? 'Next adventure →' : 'Play this trail again';
    } else if (run.status === 'lost') {
      $('#game-result-eyebrow').textContent = 'EVERY EXPLORER GETS ANOTHER GO'; $('#game-result-title').textContent = 'A new route awaits.';
      $('#game-result-text').textContent = 'The red outlined cell shows each warden’s next move. Wait for an opening, or dash two tiles before they move.';
      $('#game-primary').textContent = 'Retry adventure'; $('#game-stars').textContent = '';
    }
    renderer.setState(run); renderer.drawMinimap($('#game-minimap')); paint();
  }

  function revealBoard() { requestAnimationFrame(() => { if (active) $('.game-main').scrollIntoView({ block: 'start' }); }); }

  function start(stage) {
    run = createRun(stage); paused = false; dashArmed = false; lastAction = performance.now();
    renderer = createAdventureRenderer(canvas, run.stage); renderPicker(); resize(); update();
    revealBoard();
  }

  function action(direction, dash = false) {
    if (!active || !run || paused || run.status !== 'playing') return;
    const before = run;
    run = stepRun(run, `${direction !== 'wait' && (dash || dashArmed) ? 'dash-' : ''}${direction}`);
    dashArmed = false; lastAction = performance.now(); sound.play(run.events);
    if (run.status === 'won' && before.status !== 'won') {
      const saved = saveResult(storage, records, run.stage.id, resultFor(run)); records = saved.records; saveFailed = !saved.saved;
      renderPicker();
    }
    update();
    if (run.status !== 'playing') $('#game-primary').focus({ preventScroll: true });
  }

  function pause() { if (!run || run.status !== 'playing') return; paused = !paused; update(); }
  function hint() { hintVisible = !hintVisible; update(); }
  $('#game-pause').addEventListener('click', pause);
  $('#game-restart').addEventListener('click', () => { if (run) start(run.stage); });
  $('#game-hint-button').addEventListener('click', hint);
  $('#game-choose').addEventListener('click', () => {
    $('#trail-picker').scrollIntoView({ block: 'start' });
    $('#trail-picker button:not(:disabled)').focus({ preventScroll: true });
  });
  $('#game-sound').addEventListener('click', async () => {
    const enabled = await sound.toggle(); $('#game-sound').textContent = enabled ? 'Sound on' : 'Sound off';
    $('#game-sound').setAttribute('aria-pressed', String(enabled));
  });
  $('#dash-button').addEventListener('click', () => { dashArmed = !dashArmed; update(); });
  $('#game-wait').addEventListener('click', () => action('wait'));
  document.querySelectorAll('[data-move]').forEach(button => button.addEventListener('click', () => action(button.dataset.move)));
  $('#game-primary').addEventListener('click', () => {
    if (paused) { pause(); return; }
    const index = campaign.findIndex(stage => stage.id === run.stage.id);
    start(run.status === 'won' && index >= 0 && index < campaign.length - 1 ? campaign[index + 1] : run.stage);
  });
  $('#game-back-editor').addEventListener('click', backToEditor);
  $('#play-custom').addEventListener('click', () => {
    try { start(createCustomStage(getMap())); }
    catch (error) { $('#game-status').textContent = error.message; }
  });
  document.addEventListener('keydown', event => {
    if (!active || !run || event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input, select, textarea, dialog')) return;
    const directions = { ArrowUp: 'up', ArrowRight: 'right', ArrowDown: 'down', ArrowLeft: 'left', w: 'up', d: 'right', s: 'down', a: 'left' };
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (directions[key]) {
      event.preventDefault();
      if (!event.repeat || performance.now() - lastAction > 130) action(directions[key], event.shiftKey);
    } else if (key === ' ' && !event.target.closest('button')) { event.preventDefault(); if (!event.repeat) action('wait'); }
    else if (!event.repeat && ['p', 'Escape', 'r', 'h'].includes(key)) {
      event.preventDefault();
      if (key === 'r') start(run.stage); else if (key === 'h') hint(); else pause();
    } else if (key === 'Enter' && run.status !== 'playing' && !event.target.closest('button')) { event.preventDefault(); $('#game-primary').click(); }
  });
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0 || pointer) return;
    pointer = { x: event.clientX, y: event.clientY, id: event.pointerId };
    canvas.focus({ preventScroll: true }); canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointerup', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y; pointer = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 12) return;
    action(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up');
  });
  canvas.addEventListener('pointercancel', () => { pointer = null; });
  document.addEventListener('visibilitychange', () => { if (document.hidden && active && run?.status === 'playing' && !paused) { paused = true; update(); } });
  new ResizeObserver(resize).observe(viewport);
  renderPicker();
  return {
    enter() { active = true; if (!run) start(campaign[0]); else { paused = false; resize(); update(); revealBoard(); } },
    leave() { active = false; pointer = null; if (frame !== null) cancelAnimationFrame(frame); frame = null; },
  };
}
