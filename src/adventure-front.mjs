import { CHAPTERS, drawAtlasArt, drawTitleArt } from './adventure-art.mjs';
import { loadPreferences, savePreferences } from './adventure-preferences.mjs';

export function createFrontMenu({ storage, sound, onMode, onContinue, onResumeExpedition, onMapmaker, onCustomMap, onPreferences }) {
  const $ = selector => document.querySelector(selector);
  let preferences = loadPreferences(storage), guidePage = 0, soundBusy = false;
  const guide = $('#game-guide-dialog'), settings = $('#game-settings-dialog');
  drawTitleArt($('#title-scenery'));
  document.querySelectorAll('[data-mode-art]').forEach(canvas => drawAtlasArt(canvas, CHAPTERS.find(theme => theme.id === canvas.dataset.modeArt), 0));
  function applyPreferences() {
    sound.setVolume(preferences.volume / 100);
    document.body.dataset.gameMotion = preferences.motion;
    document.body.style.setProperty('--adventure-text-size', preferences.text === 'large' ? '18px' : '16px');
    $('#settings-volume').value = preferences.volume; $('#settings-volume-value').textContent = `${preferences.volume}%`;
    for (const button of document.querySelectorAll('[data-motion]')) button.setAttribute('aria-pressed', String(button.dataset.motion === preferences.motion));
    for (const button of document.querySelectorAll('[data-text-size]')) button.setAttribute('aria-pressed', String(button.dataset.textSize === preferences.text));
    onPreferences?.();
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
    $('#front-home').hidden = false; $('#front-modes').hidden = true;
    $('#title-continue').hidden ? $('#title-play').focus({ preventScroll: true }) : $('#title-continue').focus({ preventScroll: true });
  }
  function modes() {
    $('#front-home').hidden = true; $('#front-modes').hidden = false;
    $('#front-mode-notice').hidden = true;
    $('#front-modes-title').focus({ preventScroll: true });
  }
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
  $('#title-guide').addEventListener('click', () => { guidePage = 0; renderGuide(); guide.showModal(); });
  $('#guide-back').addEventListener('click', () => { guidePage--; renderGuide(); });
  $('#guide-next').addEventListener('click', () => { guidePage++; renderGuide(); });
  $('#guide-choose').addEventListener('click', () => { guide.close(); modes(); });
  $('#guide-close').addEventListener('click', () => guide.close());
  $('#title-settings').addEventListener('click', () => settings.showModal());
  $('#settings-close').addEventListener('click', () => settings.close());
  document.querySelectorAll('[data-sound]').forEach(button => button.addEventListener('click', () => toggleSound(button.dataset.sound === 'on')));
  document.querySelectorAll('[data-motion]').forEach(button => button.addEventListener('click', () => remember({ motion: button.dataset.motion })));
  document.querySelectorAll('[data-text-size]').forEach(button => button.addEventListener('click', () => remember({ text: button.dataset.textSize })));
  $('#settings-volume').addEventListener('input', event => remember({ volume: Number(event.target.value) }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !$('#game-title-screen').hidden && !$('#front-modes').hidden && !guide.open && !settings.open) { event.preventDefault(); home(); }
  });
  applyPreferences(); renderSound(); renderGuide();
  return {
    get preferences() { return preferences; },
    get dialogOpen() { return guide.open || settings.open; },
    notice(text) { $('#front-mode-notice').textContent = text; $('#front-mode-notice').hidden = false; },
    toggleSound,
    settings() { renderSound(); settings.showModal(); },
    show({ run, checkpoint }) {
      $('#game-title-screen').hidden = false;
      $('#title-continue').hidden = !run;
      $('#title-continue').textContent = run ? `${run.status === 'playing' ? 'Continue' : 'Return to'} ${run.stage.name}` : 'Continue trail';
      $('#title-expedition').hidden = !checkpoint;
      $('#title-expedition').textContent = checkpoint ? `${checkpoint.phase === 'won' ? 'View expedition finish' : checkpoint.phase === 'camp' ? 'Return to camp' : 'Resume expedition'} · leg ${checkpoint.leg + 1} of ${checkpoint.config.length}` : 'Resume expedition';
      home();
    },
    hide() { $('#game-title-screen').hidden = true; },
    close() { if (guide.open) guide.close(); if (settings.open) settings.close(); },
  };
}
