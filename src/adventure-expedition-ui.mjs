import { createJourney, advanceJourney, campOffers, leaveCamp, retryLeg, journeyScore, peekJourney, loadJourney, saveJourney, serializeJourney, restoreJourney } from './adventure-journey.mjs';
import { dailySeed, expeditionConfig } from './adventure-generator.mjs';
import { VOWS } from './adventure-perks.mjs';
import { BADGES, loadLogbook, creditJourney, saveLogbook } from './adventure-logbook.mjs';

export function createExpeditionUI({ storage, onRun, onNotice, onShow }) {
  const $ = selector => document.querySelector(selector);
  let current = null, book = loadLogbook(storage), saved = peekJourney(storage), saveFailed = false, busy = false;
  let previousMode = 'journey', customSeed = $('#expedition-seed').value, customRules = { length: '6', difficulty: 'trail', vow: 'none' };
  let latestEarned = [];
  function show(tab = 'expeditions') {
    $('#guild-hub').hidden = true; $('#library-guild').setAttribute('aria-pressed', 'false');
    $('#trail-picker').hidden = tab !== 'story'; $('#expedition-hub').hidden = tab !== 'expeditions';
    $('#library-story').setAttribute('aria-pressed', String(tab === 'story'));
    $('#library-expeditions').setAttribute('aria-pressed', String(tab === 'expeditions'));
    onShow?.(tab);
    if (tab === 'expeditions') renderHub();
  }
  function renderHub() {
    saved = peekJourney(storage);
    $('#expedition-resume').disabled = busy || (!current && !saved.header);
    $('#expedition-start').disabled = busy; $('#expedition-import').disabled = busy;
    $('#expedition-export').disabled = busy || (!current && !saved.header);
    const header = current ? { config: current.config, leg: current.leg, phase: current.phase } : saved.header;
    $('#expedition-resume').textContent = header ? `${header.phase === 'won' ? 'View finish' : header.phase === 'camp' ? 'Return to camp' : 'Resume expedition'} · leg ${header.leg + 1}/${header.config.length}` : 'No suspended expedition';
    $('#expedition-checkpoint').textContent = saveFailed ? 'Checkpoint unavailable. Export this expedition to keep a backup.'
      : saved.error ? 'A saved expedition is unavailable. Start a new run or import a backup; your maps and campaign bests are retained.'
        : header ? `Checkpoint: ${header.config.seed} · ${header.config.difficulty} · ${header.config.vow === 'none' ? 'open trail' : VOWS.find(vow => vow.id === header.config.vow).name}. A new run replaces this checkpoint after confirmation.`
          : 'Your expedition checkpoints after each turn. Maps, campaign bests, and learned campaign habits are kept separately.';
    $('#expedition-totals').textContent = `${book.stats.finishes} ${book.stats.finishes === 1 ? 'expedition' : 'expeditions'} finished · ${book.stats.legs} ${book.stats.legs === 1 ? 'leg' : 'legs'} explored · ${book.stats.biomes.length}/4 regions visited`;
    $('#expedition-badges').replaceChildren(...BADGES.map(badge => {
      const item = document.createElement('div'); item.className = `expedition-badge ${book.badges.includes(badge.id) ? 'earned' : ''}`;
      item.append(Object.assign(document.createElement('strong'), { textContent: `${book.badges.includes(badge.id) ? '✦' : '○'} ${badge.name}` }), Object.assign(document.createElement('span'), { textContent: badge.description })); return item;
    }));
    const records = [...book.records].sort((a, b) => b.score - a.score).slice(0, 6);
    $('#expedition-bests').replaceChildren(...(records.length ? records.map(record => `${record.config.seed} · ${record.config.length} legs · ${record.config.difficulty} · ${VOWS.find(vow => vow.id === record.config.vow).name}: ${record.score} points, ${record.turns} turns, ${record.retries} retries`)
      : ['Finish an expedition to record a personal best.']).map(text => Object.assign(document.createElement('p'), { textContent: text })));
  }
  function persist(session) {
    const result = saveJourney(storage, session); saveFailed = !result.saved;
    if (['camp', 'won'].includes(session.phase)) {
      const credit = creditJourney(book, session); book = credit.book; latestEarned = credit.earned;
      if (!saveLogbook(storage, book)) saveFailed = true;
    }
    renderHub();
  }
  function commit(session, newStage = false) {
    current = session; persist(session); onRun(session, newStage);
  }
  function configFromForm() {
    return expeditionConfig({ mode: $('#expedition-mode').value, seed: $('#expedition-seed').value,
      length: Number($('#expedition-length').value), difficulty: $('#expedition-difficulty').value, vow: $('#expedition-vow').value });
  }
  function replacementAllowed() {
    return !(current && current.phase !== 'won') && !(saved.header && saved.header.phase !== 'won') && !(saved.error && !saved.unavailable)
      || window.confirm('Starting or importing an expedition replaces the suspended expedition. Export it first if you want to keep it. Continue?');
  }
  function modeChanged() {
    const mode = $('#expedition-mode').value;
    if (previousMode === 'journey' || previousMode === 'contract') {
      customSeed = $('#expedition-seed').value;
      customRules = { length: previousMode === 'journey' ? $('#expedition-length').value : customRules.length,
        difficulty: $('#expedition-difficulty').value, vow: $('#expedition-vow').value };
    }
    $('#expedition-seed').readOnly = mode === 'daily'; $('#expedition-surprise').disabled = mode === 'daily';
    $('#expedition-length').disabled = mode !== 'journey'; $('#expedition-difficulty').disabled = mode === 'daily'; $('#expedition-vow').disabled = mode === 'daily';
    $('#expedition-seed').value = mode === 'daily' ? dailySeed() : customSeed;
    $('#expedition-length').value = mode === 'daily' ? '5' : mode === 'contract' ? '1' : customRules.length;
    $('#expedition-difficulty').value = mode === 'daily' ? 'trail' : customRules.difficulty;
    $('#expedition-vow').value = mode === 'daily' ? 'none' : customRules.vow;
    $('#expedition-mode-note').textContent = mode === 'daily' ? 'One UTC date seed, five legs, Trail rules, and no oath. Route and camp choices are yours.'
      : mode === 'contract' ? 'A single complete contract on a seeded map. Change the seed for another world.'
        : 'A longer journey with a checkpoint, route choices, camp upgrades, and a final Watcher crossing.';
    previousMode = mode;
  }
  $('#expedition-mode').addEventListener('change', modeChanged);
  $('#expedition-seed').addEventListener('input', () => { if (previousMode !== 'daily') customSeed = $('#expedition-seed').value; });
  $('#expedition-surprise').addEventListener('click', () => {
    const values = new Uint32Array(1); window.crypto.getRandomValues(values); customSeed = `trail-${values[0].toString(36)}`; $('#expedition-seed').value = customSeed;
  });
  $('#expedition-form').addEventListener('submit', event => {
    event.preventDefault(); if (busy) return; $('#expedition-form-error').hidden = true;
    try { const session = createJourney(configFromForm()); if (!replacementAllowed()) return; latestEarned = []; commit(session, true); }
    catch (error) { $('#expedition-form-error').textContent = error.message; $('#expedition-form-error').hidden = false; }
  });
  $('#expedition-resume').addEventListener('click', async () => {
    if (busy) return; busy = true; renderHub(); onNotice('Resuming the expedition…');
    await new Promise(resolve => requestAnimationFrame(resolve));
    try {
      const result = current ? { session: current } : loadJourney(storage);
      if (!result.session) { onNotice('The checkpoint could not be restored. Import a backup or start a new expedition.'); return; }
      commit(result.session, true);
    } finally { busy = false; renderHub(); }
  });
  $('#expedition-export').addEventListener('click', () => {
    try {
      const session = current || loadJourney(storage).session; if (!session) throw new Error('No expedition is available to export.');
      const url = URL.createObjectURL(new Blob([serializeJourney(session)], { type: 'application/json' })), link = document.createElement('a');
      link.href = url; link.download = `tilewright-expedition-${session.config.seed}.json`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      onNotice('Expedition backup exported. Import it in the expedition hub to continue elsewhere.');
    } catch (error) { onNotice(error.message); }
  });
  $('#expedition-import').addEventListener('click', () => { $('#expedition-file').value = ''; $('#expedition-file').click(); });
  $('#expedition-file').addEventListener('change', async event => {
    const file = event.target.files?.[0]; if (!file || busy) return;
    busy = true; renderHub();
    try {
      if (file.size > 220_000) throw new Error('Choose an expedition backup smaller than 220 KB.');
      const session = restoreJourney(await file.text()); if (!replacementAllowed()) return;
      $('#expedition-form-error').hidden = true; latestEarned = []; commit(session, true); onNotice('Expedition backup restored.');
    } catch (error) { $('#expedition-form-error').textContent = error.message; $('#expedition-form-error').hidden = false; }
    finally { busy = false; renderHub(); }
  });
  function openCamp() {
    if (!current || current.phase !== 'camp') return;
    const offers = campOffers(current);
    const choices = (items, name) => items.map((item, index) => {
      const label = document.createElement('label'); label.className = 'camp-choice';
      const radio = document.createElement('input'); radio.type = 'radio'; radio.name = name; radio.value = item.id || item.code; radio.required = true; radio.checked = index === 0;
      label.append(radio, Object.assign(document.createElement('strong'), { textContent: item.name }), Object.assign(document.createElement('span'), { textContent: item.description }));
      if (item.family) label.append(Object.assign(document.createElement('small'), { textContent: `${item.biome.name} · ${item.family.name} · ${item.hunters} ${item.hunters === 1 ? 'hunter' : 'hunters'}` }));
      return label;
    });
    $('#camp-title').textContent = `A fire before leg ${current.leg + 2} of ${current.config.length}`;
    $('#camp-summary').textContent = `One heart restored before departure. Your supplies carry forward. ${journeyScore(current)} points earned so far.`;
    $('#camp-perks').replaceChildren(...choices(offers.perks, 'camp-perk')); $('#camp-routes').replaceChildren(...choices(offers.routes, 'camp-route'));
    $('#camp-error').hidden = true; $('#camp-dialog').showModal();
  }
  $('#camp-form').addEventListener('submit', event => {
    event.preventDefault();
    try {
      const next = leaveCamp(current, $('#camp-form input[name="camp-perk"]:checked')?.value, $('#camp-form input[name="camp-route"]:checked')?.value);
      $('#camp-dialog').close(); latestEarned = []; commit(next, true);
    } catch (error) { $('#camp-error').textContent = error.message; $('#camp-error').hidden = false; }
  });
  $('#camp-cancel').addEventListener('click', () => $('#camp-dialog').close());
  $('#library-story').addEventListener('click', () => show('story'));
  $('#library-expeditions').addEventListener('click', () => show());
  $('#begin-expedition').addEventListener('click', () => show());
  $('#game-expeditions').addEventListener('click', () => show());
  modeChanged(); renderHub();
  return {
    get session() { return current; },
    get checkpointFailed() { return saveFailed; },
    get earned() { return latestEarned; },
    show, openCamp,
    suspend() { if (current) persist(current); current = null; },
    act(action) { if (!current) return; const next = advanceJourney(current, action); if (next !== current) commit(next); },
    retry() { if (!current) return; const next = retryLeg(current); if (next !== current) { latestEarned = []; commit(next, true); } },
  };
}
