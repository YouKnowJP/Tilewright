import { createSaveDataUI } from './save-data-ui.mjs';
import { CHAPTERS, drawAtlasArt, drawTitleArt } from './adventure-art.mjs';
import { controlHelp } from './adventure-controls.mjs';
import { loadPreferences, savePreferences } from './adventure-preferences.mjs';

export function createFrontMenu({ storage, sound, saveSession, onSaveReload, onMode, onContinue, onResumeExpedition, onMapmaker, onCustomMap, onPreferences, getJournal, onDestination, onChoose }) {
  const $ = selector => document.querySelector(selector);
  let preferences = loadPreferences(storage), guidePage = 0, soundBusy = false, guideReturn = null, settingsReturn = null;
  const guide = $('#game-guide-dialog'), settings = $('#game-settings-dialog');
  const saveData=createSaveDataUI({session:saveSession,onComplete:onSaveReload});
  settings.addEventListener('close',()=>saveData.close());
  drawTitleArt($('#title-scenery'));
  document.querySelectorAll('[data-mode-art]').forEach(canvas => drawAtlasArt(canvas, CHAPTERS.find(theme => theme.id === canvas.dataset.modeArt), 0));
  function applyPreferences() {
    sound.setVolume(preferences.volume / 100);
    document.body.dataset.gameMotion = preferences.motion;
    document.body.style.setProperty('--adventure-text-size', preferences.text === 'large' ? '18px' : '16px');
    $('#settings-volume').value = preferences.volume; $('#settings-volume-value').textContent = `${preferences.volume}%`;
    for (const button of document.querySelectorAll('[data-motion]')) button.setAttribute('aria-pressed', String(button.dataset.motion === preferences.motion));
    for (const button of document.querySelectorAll('[data-text-size]')) button.setAttribute('aria-pressed', String(button.dataset.textSize === preferences.text));
    for(const [id,field] of [['controls-style','controls'],['keyboard-layout','keyboardLayout'],['pad-side','padSide'],['control-size','controlSize'],['key-repeat','keyRepeat'],['gamepad','gamepad']]) $(`#settings-${id}`).value=preferences[field];
    $('#settings-controls-help').textContent=controlHelp(preferences);
    onPreferences?.(preferences);
  }
  function remember(patch) {
    preferences = { ...preferences, ...patch }; applyPreferences();
    $('#settings-save-note').textContent = savePreferences(storage, preferences) ? 'Your options are saved for your next visit.' : 'Your options work for this visit. Saving is unavailable.';
  }
  function renderSound() {
    for (const button of document.querySelectorAll('[data-sound]')) {
      button.setAttribute('aria-pressed', String((button.dataset.sound === 'on') === sound.enabled)); button.disabled = soundBusy;
    }
    $('#game-sound').textContent = sound.enabled ? 'Sound on' : 'Sound off'; $('#game-sound').setAttribute('aria-pressed', String(sound.enabled));
  }
  async function toggleSound(target = !sound.enabled) {
    if (soundBusy || target === sound.enabled) return;
    soundBusy = true; renderSound();
    try {
      const enabled = await sound.toggle();
      $('#settings-audio-note').textContent = enabled ? 'The lanterns have a voice. Sound effects are on.' : target ? 'Sound could not start. You can still play silently.' : 'A quiet trail. Sound effects are off.';
      if (enabled) sound.play([{ type: 'lantern' }]);
    } finally { soundBusy = false; renderSound(); }
  }
  function home() {
    $('#front-home').hidden = false; $('#front-modes').hidden = true; $('#front-journal').hidden = true;
    document.body.classList.remove('game-journal-open');
    window.scrollTo(0, 0);
    $('#title-continue').hidden ? $('#title-play').focus({ preventScroll: true }) : $('#title-continue').focus({ preventScroll: true });
  }
  function modes() {
    $('#front-home').hidden = true; $('#front-modes').hidden = false; $('#front-journal').hidden = true;
    document.body.classList.remove('game-journal-open');
    window.scrollTo(0, 0);
    $('#front-mode-notice').hidden = true;
    $('#front-modes-title').focus({ preventScroll: true });
  }
  const node = (tag, text, className) => Object.assign(document.createElement(tag), { textContent: text, ...(className ? { className } : {}) });
  function artwork(themeId) {
    const canvas = document.createElement('canvas'); canvas.setAttribute('aria-hidden', 'true');
    drawAtlasArt(canvas, CHAPTERS.find(chapter => chapter.id === themeId) || CHAPTERS[0], 0); return canvas;
  }
  function progress(value, max, label) {
    const meter = document.createElement('progress'); meter.value = value; meter.max = max; meter.setAttribute('aria-label', label); return meter;
  }
  function journalTab(id, focus = false) {
    document.querySelectorAll('.journal-tabs button').forEach(button => {
      const selected = button.id === `journal-tab-${id}`;
      button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1;
      $(`#${button.getAttribute('aria-controls')}`).hidden = !selected;
      if (selected && focus) button.focus({ preventScroll: true });
    });
    window.scrollTo(0, 0);
  }
  function journal() {
    const data = getJournal(), c = data.counts;
    $('#front-home').hidden = true; $('#front-modes').hidden = true; $('#front-journal').hidden = false;
    document.body.classList.add('game-journal-open');
    $('#journal-stats').replaceChildren(...[
      [`${c.story} / ${c.storyTotal}`, 'Stories restored'], [`${c.trailStars} / ${c.starTotal}`, 'Trail stars'],
      [`${c.honors} / ${c.honorTotal}`, 'Guild honors'], [`${c.badges} / ${c.badgeTotal}`, 'Expedition badges'],
    ].map(([value, label]) => { const item = node('div', '', 'journal-stat'); item.append(node('strong', value), node('span', label)); return item; }));
    $('#journal-rules').textContent = `${data.difficulty === 'nemesis' ? 'Nemesis' : 'Trail'} suggestions · preview before you play`;
    $('#journal-invitations').replaceChildren(...data.recommendations.map(item => {
      const card = node('article', '', 'journal-invitation'), copy = node('div', '', 'journal-card-copy'), button = node('button', item.action);
      button.dataset.journalInvite = item.id; button.addEventListener('click', () => onDestination(item));
      copy.append(node('p', item.label, 'title-kicker'), node('h4', item.title), node('p', item.text), button); card.append(artwork(item.theme), copy); return card;
    }));
    $('#journal-chapters').replaceChildren(...data.chapters.map(chapter => {
      const button = node('button', '', 'journal-chapter-card'), copy = node('div', '', 'journal-card-copy'); button.dataset.journalChapter = chapter.index;
      copy.append(node('small', `CHAPTER ${String(chapter.index + 1).padStart(2, '0')} · ${chapter.finished}/3 restored`), node('h3', chapter.name),
        node('p', `Trail ${chapter.trailStars}/9 stars · Nemesis ${chapter.nemesisStars}/9`), progress(chapter.trailStars + chapter.nemesisStars, 18, `${chapter.name}: ${chapter.trailStars + chapter.nemesisStars} of 18 stars`));
      button.append(artwork(chapter.id), copy); button.addEventListener('click', () => onDestination({ mode: 'story', chapter: chapter.index })); return button;
    }));
    $('#journal-specialists').replaceChildren(...data.kits.map(kit => {
      const card = node('article', '', 'journal-specialist'), button = node('button', `Browse ${kit.name} jobs`); button.dataset.journalKit = kit.id;
      button.addEventListener('click', () => onDestination({ mode: 'guild', kit: kit.id }));
      card.append(node('p', kit.power, 'title-kicker'), node('h3', kit.name), node('p', kit.description),
        node('strong', `${kit.honors}/${kit.total * 3} honors · ${kit.finished}/${kit.total} dispatches`), progress(kit.honors, kit.total * 3, `${kit.name} honors`), button); return card;
    }));
    $('#journal-expedition-totals').textContent = `${c.finishes} ${c.finishes === 1 ? 'expedition' : 'expeditions'} finished · ${c.legs} ${c.legs === 1 ? 'trail' : 'trails'} explored · ${c.badges}/${c.badgeTotal} badges earned. Every seed is another road.`;
    $('#journal-badges').replaceChildren(...data.badges.map(badge => {
      const item = node('article', '', 'journal-badge'); item.dataset.earned = String(badge.earned);
      item.append(node('small', badge.earned ? 'EARNED' : 'AHEAD OF YOU'), node('h4', badge.name), node('p', badge.description)); return item;
    }));
    $('#journal-save-note').textContent = data.saveUnavailable ? 'Your accomplishments are available for this visit. Browser saving is unavailable; keep this tab open.' : 'Your accomplishments stay in this browser. Replay a trail, try another specialist, or follow a new seed.';
    journalTab('overview'); window.scrollTo(0, 0); $('#journal-title').focus({ preventScroll: true });
  }
  function restoreFocus(target,dialog) { const current=document.activeElement;if(current!==document.body&&current!==target&&!dialog.contains(current))return;if(target?.getClientRects().length&&!target.closest('[hidden]'))target.focus({preventScroll:true}); }
  guide.addEventListener('close',()=>restoreFocus(guideReturn,guide));settings.addEventListener('close',()=>restoreFocus(settingsReturn,settings));
  function openGuide(trigger) { guideReturn=trigger||document.activeElement;guidePage = 0; renderGuide(); guide.showModal(); }
  function renderGuide() {
    document.querySelectorAll('.guide-page').forEach((page, i) => { page.hidden = i !== guidePage; });
    $('#guide-page-count').textContent = `${guidePage + 1} / 3`;
    $('#guide-back').disabled = guidePage === 0; $('#guide-next').hidden = guidePage === 2; $('#guide-choose').hidden = guidePage !== 2;
    $('#guide-page-title').textContent = ['Bring back the light', 'Make every turn count', 'Find your own adventure'][guidePage];
  }
  $('#title-play').addEventListener('click', modes);
  $('#front-back').addEventListener('click', home);
  $('#title-continue').addEventListener('click', onContinue);
  $('#title-expedition').addEventListener('click', onResumeExpedition);
  $('#title-mapmaker').addEventListener('click', onMapmaker);
  $('#front-custom').addEventListener('click', onCustomMap);
  document.querySelectorAll('[data-front-mode]').forEach(button => button.addEventListener('click', () => button.dataset.frontMode === 'mapmaker' ? onMapmaker() : onMode(button.dataset.frontMode)));
  $('#title-guide').addEventListener('click',()=>openGuide($('#title-guide')));
  $('#title-journal').addEventListener('click', journal); $('#journal-back').addEventListener('click', home);
  $('#journal-new-expedition').addEventListener('click', () => onDestination({ mode: 'expeditions' }));
  document.querySelectorAll('.journal-tabs button').forEach(tab => {
    tab.addEventListener('click', () => journalTab(tab.id.slice(12)));
    tab.addEventListener('keydown', event => {
      const tabs = [...document.querySelectorAll('.journal-tabs button')], index = tabs.indexOf(tab);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : -1;
      if (next >= 0) { event.preventDefault(); journalTab(tabs[next].id.slice(12), true); }
    });
  });
  $('#guide-back').addEventListener('click', () => { guidePage--; renderGuide(); });
  $('#guide-next').addEventListener('click', () => { guidePage++; renderGuide(); });
  $('#guide-choose').addEventListener('click', () => { guide.close(); onChoose(); modes(); });
  $('#guide-close').addEventListener('click', () => guide.close());
  $('#title-profile').addEventListener('click',()=>openSettings('data',$('#title-profile')));
  try { const catalog=saveSession.profiles(),name=catalog.profiles.find(item=>item.id===catalog.activeId).name;$('#title-profile').textContent=`${name} · Change journey`;$('#title-profile').setAttribute('aria-label',`Manage journeys. Current journey: ${name}`); } catch { $('#title-profile').textContent='Journeys · Saving unavailable'; }
  $('#title-settings').addEventListener('click', () => openSettings('display',$('#title-settings')));
  function settingsTab(page) { $('#settings-save-note').hidden=page==='data';saveData.close();if(page==='data')saveData.open(); for(const id of ['display','controls','data']) { $(`#settings-${id}`).hidden=id!==page; $(`#settings-tab-${id}`).setAttribute('aria-pressed',String(id===page)); } }
  function openSettings(page='display',trigger) { settingsReturn=trigger||document.activeElement;renderSound(); settingsTab(page); settings.showModal(); settings.scrollTop=0; }
  for(const id of ['display','controls','data']) $(`#settings-tab-${id}`).addEventListener('click',()=>settingsTab(id));
  for(const [id,field] of [['controls-style','controls'],['keyboard-layout','keyboardLayout'],['pad-side','padSide'],['control-size','controlSize'],['key-repeat','keyRepeat'],['gamepad','gamepad']]) $(`#settings-${id}`).addEventListener('change',event=>remember({[field]:event.target.value}));
  $('#settings-close').addEventListener('click', () => settings.close());
  document.querySelectorAll('[data-sound]').forEach(button => button.addEventListener('click', () => toggleSound(button.dataset.sound === 'on')));
  document.querySelectorAll('[data-motion]').forEach(button => button.addEventListener('click', () => remember({ motion: button.dataset.motion })));
  document.querySelectorAll('[data-text-size]').forEach(button => button.addEventListener('click', () => remember({ text: button.dataset.textSize })));
  $('#settings-volume').addEventListener('input', event => remember({ volume: Number(event.target.value) }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !$('#game-title-screen').hidden && (!$('#front-modes').hidden || !$('#front-journal').hidden) && !guide.open && !settings.open) { event.preventDefault(); home(); }
  });
  applyPreferences(); renderSound(); renderGuide();
  return {
    get preferences() { return preferences; },
    get dialogOpen() { return guide.open || settings.open || $('#save-dialog').open; },
    notice(text) { $('#front-mode-notice').textContent = text; $('#front-mode-notice').hidden = false;$('#title-save-note').textContent=text;$('#title-save-note').hidden=false; },
    toggleSound,
    journal, guide: openGuide, modes,
    settings: openSettings,
    show({ run, checkpoint, resume }) {
      $('#title-save-note').hidden=true;
      $('#game-title-screen').hidden = false;
      const c = getJournal().counts;
      $('#title-progress').textContent = c.story || c.honors || c.badges ? `${c.story}/${c.storyTotal} stories restored · ${c.honors} Guild honors · ${c.badges} expedition badges` : '24 stories · 3 specialists · a new expedition each day';
      $('#title-continue').hidden = !run&&!resume;
      $('#title-continue').textContent = run ? `${run.status === 'playing' ? 'Continue' : 'Return to'} ${run.stage.name}` : resume?`${resume.status==='playing'?'Continue':'Return to'} ${resume.name}`:'Continue trail';
      $('#title-continue').title=resume?`Saved turn ${resume.turns} · ${resume.difficulty} rules`:'Return to your open trail';
      $('#title-expedition').hidden = !checkpoint||resume?.kind==='expedition';
      $('#title-expedition').textContent = checkpoint ? `${checkpoint.phase === 'won' ? 'View expedition finish' : checkpoint.phase === 'camp' ? 'Return to camp' : 'Resume expedition'} · leg ${checkpoint.leg + 1} of ${checkpoint.config.length}` : 'Resume expedition';
      home();
    },
    hide() { $('#game-title-screen').hidden = true; document.body.classList.remove('game-journal-open'); },
    close() { if (guide.open) guide.close(); if (settings.open) settings.close(); },
  };
}
