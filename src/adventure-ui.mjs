import { CONTROL_STYLES, movementKey, controlHelp } from './adventure-controls.mjs';
import { createMapInput, createGamepadInput } from './adventure-input.mjs';
import { createRun, createCustomStage, stepRun, resultFor, activePlates, scoutHint, MAX_HEARTS, MAX_ENERGY, nearbyInteractions, missionGoals, turnTarget, recordId, canEnter, hazardActive } from './adventure.mjs';
import { createCampaign } from './adventure-levels.mjs';
import { createAdventureRenderer } from './adventure-render.mjs';
import { createAdventureSound } from './adventure-sound.mjs';
import { loadRecords, saveResult } from './adventure-records.mjs';
import { freshMemory, loadMemory, saveMemory, memorySummary } from './adventure-brain.mjs';
import { createExpeditionUI } from './adventure-expedition-ui.mjs';
import { journeyScore, peekJourney } from './adventure-journey.mjs';
import { createFrontMenu } from './adventure-front.mjs';
import { adventureJournal } from './adventure-journal.mjs';
import { PERKS, VOWS } from './adventure-perks.mjs';
import { createIcon } from './icons.mjs';
import { choiceProblem, wallet, mechanismPreview } from './adventure-mechanisms.mjs';
import { threatForecast } from './adventure-intel.mjs';
import { CHAPTERS, drawAtlasArt, themeFor, drawKeeperPortrait } from './adventure-art.mjs';
import { createGuildJobs, guildMerits, guildRecordId, loadGuild, saveGuild, GUILD_IDS, MERITS } from './adventure-guild.mjs';
import { createWorkshopUI } from './workshop-ui.mjs';
import { createTrainingUI } from './training-ui.mjs';
import { GUILD_KITS, kitFor, powerProblem, powerPreview, liveEcho, waystonePreview } from './adventure-tools.mjs';

export function createAdventureUI({ storage, getMap, backToEditor, onCreatorGuide }) {
  const $ = selector => document.querySelector(selector);
  const canvas = $('#adventure-canvas'), viewport = $('#game-viewport'), campaign = createCampaign();
  const allJournalJobs = createGuildJobs('echoist'), journalJobs = [...allJournalJobs.slice(6), ...allJournalJobs.slice(0, 6)];
  const sound = createAdventureSound(), systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let front;
  const motion = { get matches() { return front?.preferences.motion === 'reduced' || systemMotion.matches; } };
  let records = loadRecords(storage), memory = loadMemory(storage), run = null, renderer = null;
  let difficulty = 'trail', memorySaveFailed = false;
  let expeditions, workshop, training, workshopActions = [], workshopClearNote = '';
  let active = false, paused = false, dashArmed = false, frame = null, lastDraw = 0, lastAction = 0;
  let mapInput,gamepadInput;
  let saveFailed = false, hintVisible = false;
  let interactionId = null;
  let guildRecords = loadGuild(storage), selectedKit = 'echoist', guildSaveFailed = false;
  let selectedChapter = 0, libraryTab = 'story';
  const notes = $('#game-aside'), notesDialog = $('#game-notes-dialog'), compactNotes = matchMedia('(max-width: 1000px)');
  const libraryOpen = () => !$('#adventure-library').hidden;
  const outsideBoard = () => libraryOpen() || !$('#game-title-screen').hidden || !$('#adventure-workshop').hidden || !$('#training-camp').hidden;

  function frontStyle(view) {
    $('#adventure').dataset.view = view;
    $('#game-shell-bar').hidden = view !== 'play';
    document.body.classList.toggle('game-front', view !== 'play');
    document.body.classList.toggle('game-title-open', view === 'title');
    document.body.classList.toggle('game-library-open', view === 'library');
  }
  function showTitle() {
    training?.hide();
    workshop?.hide();
    for (const selector of ['#conversation-dialog', '#camp-dialog', '#forecast-dialog', '#game-notes-dialog']) if ($(selector).open) $(selector).close();
    $('#game-menu').open = false; $('#adventure-library').hidden = true; $('#game-layout').hidden = true;
    frontStyle('title');
    front.show({ run, checkpoint: expeditions?.session ? null : peekJourney(storage).header });
    if (!run) $('#adventure').dataset.status = 'idle';
    window.scrollTo(0, 0);
  }
  function showJournal() { showTitle(); front.journal(); }
  function openWorkshop(section = 'shelf') { showTitle(); front.hide(); frontStyle('workshop'); workshop.show(section); }
  function openTraining() { showTitle(); front.hide(); frontStyle('training'); training.show(); }
  function journalDestination(target) {
    if (target.mode === 'story') {
      selectedChapter = target.chapter ?? selectedChapter; renderPicker(); expeditions.show('story');
      const destination = target.stage ? $(`[data-stage="${target.stage}"]`) : $(`#atlas-${CHAPTERS[selectedChapter].id} [data-chapter-start]`);
      destination.focus({ preventScroll: true }); destination.scrollIntoView({ block: 'nearest' });
    } else if (target.mode === 'guild') {
      if (target.kit) selectedKit = target.kit;
      showGuild(); const destination = target.job ? $(`[data-guild-job="${target.job}"]`) : $('#guild-kit');
      destination.focus({ preventScroll: true }); destination.scrollIntoView({ block: 'nearest' });
    } else {
      expeditions.show();
      if (target.mode === 'daily') { $('#expedition-mode').value = 'daily'; $('#expedition-mode').dispatchEvent(new Event('change')); }
      $('#expedition-mode').focus({ preventScroll: true }); $('#expedition-hub').scrollIntoView({ block: 'start' });
    }
  }

  function selectNotes(id, focus = false) {
    for (const tab of document.querySelectorAll('.notes-tabs [role="tab"]')) {
      const selected = tab.id === `notes-tab-${id}`;
      tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;
      $(`#${tab.getAttribute('aria-controls')}`).hidden = !selected;
      if (selected && focus) tab.focus({ preventScroll: true });
    }
  }
  function openNotes(id) {
    if (id) selectNotes(id);
    if (compactNotes.matches && !notesDialog.open) notesDialog.showModal();
    $('.notes-tabs [aria-selected="true"]').focus({ preventScroll: true });
  }
  function placeNotes() {
    if (notesDialog.open) notesDialog.close();
    (compactNotes.matches ? notesDialog : $('#game-layout')).append(notes);
    resize();
  }
  function showLibrary(tab) {
    training?.hide();
    workshop?.hide();
    libraryTab = tab;
    front?.hide(); frontStyle('library');
    if (notesDialog.open) notesDialog.close();
    $('#game-menu').open = false;
    $('#adventure-library').hidden = false; $('#game-layout').hidden = true;
    $('#library-notice').hidden = true;
    $('#library-resume').textContent = `← Back to ${run?.stage.name || 'your trail'}`;
    $('#library-resume').hidden = !run; $('#library-run-note').hidden = !run;
    $('#library-rules-note').textContent = run ? 'changes restart this mission' : 'choose rules before starting';
    if (run?.stage.workshop?.storybook || run?.stage.workshop?.trailhouse) {
      $('#game-difficulty').disabled = false;
      $('#library-rules-note').textContent = 'rules for your next adventure; your current adventure keeps its rules';
    }
    window.scrollTo(0, 0);
  }
  function showBoard() {
    training?.hide();
    workshop?.hide();
    if (!run) { showTitle(); return; }
    if (run.stage.workshop?.storybook || run.stage.workshop?.trailhouse) { difficulty = run.difficulty; $('#game-difficulty').value = difficulty; }
    front?.hide(); frontStyle('play');
    if (notesDialog.open) notesDialog.close();
    $('#game-menu').open = false;
    $('#adventure-library').hidden = true; $('#game-layout').hidden = false;
    window.scrollTo(0, 0); resize(); paint();
  }
  document.querySelectorAll('.notes-tabs [role="tab"]').forEach(tab => {
    tab.addEventListener('click', () => selectNotes(tab.id.slice('notes-tab-'.length)));
    tab.addEventListener('keydown', event => {
      const tabs = [...document.querySelectorAll('.notes-tabs [role="tab"]')], index = tabs.indexOf(tab);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
        : event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : -1;
      if (next >= 0) { event.preventDefault(); selectNotes(tabs[next].id.slice('notes-tab-'.length), true); }
    });
  });
  $('#game-notes-button').addEventListener('click', () => openNotes());
  $('#game-notes-close').addEventListener('click', () => notesDialog.close());
  notesDialog.addEventListener('close', () => { if (active && !outsideBoard()) $('#game-notes-button').focus({ preventScroll: true }); });
  compactNotes.addEventListener('change', placeNotes); placeNotes();
  $('#library-resume').addEventListener('click', () => { showBoard(); update(); canvas.focus({ preventScroll: true }); });
  $('#library-title').addEventListener('click', showTitle);
  $('#library-options').addEventListener('click', () => front.settings('display',$('#library-options')));
  $('#library-guide').addEventListener('click', () => front.guide($('#library-guide')));
  $('#library-journal').addEventListener('click', showJournal);
  $('#game-home').addEventListener('click', showTitle);
  $('#game-result-menu').addEventListener('click', showTitle);
  $('#game-title-menu').addEventListener('click', showTitle);
  $('#game-journal-menu').addEventListener('click', showJournal);
  $('#title-trailhouse').addEventListener('click', () => openWorkshop('house'));
  for (const id of ['title-workshop','front-workshop','game-workshop-menu']) $(`#${id}`).addEventListener('click', () => openWorkshop());
  $('#title-training').addEventListener('click', openTraining);
  $('#game-guide-menu').addEventListener('click', () => { $('#game-menu').open = false; front.guide($('#game-menu summary')); });
  let optionsReturn = null;
  $('#game-settings-button').addEventListener('click', () => { optionsReturn = $('#game-menu summary'); $('#game-menu').open = false; front.settings('display',optionsReturn); });
  $('#game-shell-options').addEventListener('click', () => { optionsReturn = $('#game-shell-options'); front.settings('display',optionsReturn); });
  function restoreBoardFocus(dialog,target){const current=document.activeElement;if(active&&!outsideBoard()&&(current===document.body||current===target||dialog.contains(current)))target.focus({preventScroll:true});}
  $('#game-settings-dialog').addEventListener('close', () => restoreBoardFocus($('#game-settings-dialog'),optionsReturn || $('#game-menu summary')));
  $('#game-guide-dialog').addEventListener('close', () => restoreBoardFocus($('#game-guide-dialog'),$('#game-menu summary')));
  document.addEventListener('click', event => { if (!event.target.closest('#game-menu')) $('#game-menu').open = false; });
  $('#game-menu').addEventListener('focusout', event => {
    if (event.relatedTarget && !$('#game-menu').contains(event.relatedTarget)) $('#game-menu').open = false;
  });

  function renderGuild() {
    const kit = GUILD_KITS.find(kit => kit.id === selectedKit), allJobs = createGuildJobs(selectedKit), jobs = [...allJobs.slice(6), ...allJobs.slice(0, 6)];
    $('#guild-kit').value = selectedKit;
    $('#guild-kit-note').textContent = `${kit.power}: ${kit.description} Casting costs two energy and one turn, with a six-turn recharge.${kit.id === 'echoist' ? ' Returning costs one energy and consumes the double.' : ''}`;
    $('#guild-jobs').replaceChildren(...jobs.map((stage, index) => {
      const button = document.createElement('button'); button.className = 'guild-job'; button.dataset.guildJob = stage.id;
      const art = document.createElement('canvas'); art.setAttribute('aria-hidden', 'true'); drawAtlasArt(art, themeFor(stage), index % 3);
      const record = guildRecords[`${stage.id}-${selectedKit}-${difficulty}`];
      button.append(art, Object.assign(document.createElement('strong'), { textContent: stage.name }),
        Object.assign(document.createElement('span'), { textContent: stage.subtitle }),
        Object.assign(document.createElement('small'), { className: 'guild-merit-preview', textContent: stage.guild.merits.map(id => MERITS[id]).join(' / ') }),
        Object.assign(document.createElement('small'), { textContent: record ? `${record.merits}/3 commendations · ${record.turns} turns · ${record.score} points` : 'Open job · three optional commendations' }));
      button.addEventListener('click', () => start(stage)); return button;
    }));
    const matches = Object.entries(guildRecords).filter(([id]) => id.endsWith(`-${selectedKit}-${difficulty}`));
    $('#guild-progress').textContent = `${matches.length}/${jobs.length} jobs finished · ${matches.reduce((sum, [, record]) => sum + record.merits, 0)}/${jobs.length * 3} commendations · ${kit.name} / ${difficulty}. ${guildSaveFailed ? 'Saving unavailable; results remain in this session.' : 'Bests save on completion. An unfinished job restarts from the beginning.'}`;
  }
  function showGuild() {
    expeditions.show('guild'); $('#guild-hub').hidden = false; $('#library-guild').setAttribute('aria-pressed', 'true'); renderGuild();
  }

  function stageUnlocked(index) { return index === 0 || campaign[index].contractStart || Boolean(records[campaign[index - 1].id] || records[`${campaign[index - 1].id}-nemesis`]); }
  const stageRecord = stage => records[`${stage.id}${difficulty === 'nemesis' ? '-nemesis' : ''}`];

  function renderPicker() {
    const picker = $('#trail-picker'), heading = document.createElement('div'), nav = document.createElement('nav');
    heading.className = 'atlas-heading'; nav.className = 'atlas-nav'; nav.setAttribute('aria-label', 'Choose a story chapter');
    const earned = campaign.reduce((sum, stage) => sum + (stageRecord(stage)?.stars || 0), 0);
    heading.append(Object.assign(document.createElement('div'), { innerHTML: '<p class="eyebrow">YOUR FIELD ATLAS</p><h2>Story chapters</h2>' }),
      Object.assign(document.createElement('p'), { className: 'atlas-total', textContent: `${earned} / ${campaign.length * 3} stars · ${difficulty === 'nemesis' ? 'Nemesis' : 'Trail'} rules` }));
    const chapters = CHAPTERS.map((chapter, chapterIndex) => {
      const section = document.createElement('section'); section.className = 'atlas-chapter'; section.id = `atlas-${chapter.id}`;
      section.style.setProperty('--chapter-dark', chapter.dark); section.style.setProperty('--chapter-light', chapter.sky);
      const label = document.createElement('div'); label.className = 'atlas-chapter-heading';
      const scenery = document.createElement('canvas'); scenery.className = 'chapter-scenery'; scenery.setAttribute('aria-hidden', 'true'); drawAtlasArt(scenery, chapter, 0); label.append(scenery);
      const text = document.createElement('div'), title = document.createElement('h3'); title.textContent = chapter.name; title.tabIndex = -1;
      text.append(Object.assign(document.createElement('p'), { className: 'eyebrow', textContent: `CHAPTER ${String(chapterIndex + 1).padStart(2, '0')} / ${chapter.place.toUpperCase()}` }), title,
        Object.assign(document.createElement('p'), { textContent: chapter.summary }));
      const startButton = document.createElement('button'); startButton.textContent = chapterIndex ? 'Begin chapter →' : 'Begin the story →'; startButton.dataset.chapterStart = chapter.id;
      startButton.addEventListener('click', () => start(campaign[chapterIndex * 3])); label.append(text, startButton);
      const jump = document.createElement('button'); jump.textContent = `${String(chapterIndex + 1).padStart(2, '0')} ${chapter.name}`;
      section.hidden = chapterIndex !== selectedChapter;
      jump.setAttribute('aria-pressed', String(chapterIndex === selectedChapter));
      jump.addEventListener('click', () => {
        selectedChapter = chapterIndex;
        picker.querySelectorAll('.atlas-chapter').forEach((panel, i) => { panel.hidden = i !== selectedChapter; });
        nav.querySelectorAll('button').forEach((button, i) => button.setAttribute('aria-pressed', String(i === selectedChapter)));
        title.focus({ preventScroll: true });
      }); nav.append(jump);
      const cards = document.createElement('div'); cards.className = 'atlas-cards';
      cards.append(...campaign.slice(chapterIndex * 3, chapterIndex * 3 + 3).map(stage => {
        const index = campaign.indexOf(stage);
        const button = document.createElement('button'); button.className = 'trail-card'; button.dataset.stage = stage.id;
        button.disabled = !stageUnlocked(index); button.classList.toggle('selected', run?.stage.id === stage.id);
        button.setAttribute('aria-pressed', String(run?.stage.id === stage.id));
        const number = Object.assign(document.createElement('span'), { className: 'trail-number', textContent: String(index + 1).padStart(2, '0') });
        const art = document.createElement('canvas'); art.className = 'trail-art'; art.setAttribute('aria-hidden', 'true'); drawAtlasArt(art, chapter, index % 3);
        const title = Object.assign(document.createElement('strong'), { textContent: stage.name });
        const subtitle = Object.assign(document.createElement('span'), { className: 'trail-subtitle', textContent: stage.subtitle });
        const record = stageRecord(stage);
        const progress = Object.assign(document.createElement('span'), { className: 'trail-progress',
          textContent: !stageUnlocked(index) ? `Finish ${campaign[index - 1].name} to unlock` : record ? `${'★'.repeat(record.stars)} · ${record.turns} turns · ${record.score} points` : 'Unexplored · your next story awaits' });
        const tags = Object.assign(document.createElement('span'), { className: 'trail-tags', textContent: (stage.tags || [stage.actFinal ? 'Chapter finale' : stage.sequence?.length ? 'Relay puzzle' : 'Lantern quest', stage.hunters?.length ? 'Adaptive hunters' : 'Patrol timing']).join(' / ') });
        button.append(art, number, title, subtitle, tags, progress);
        button.addEventListener('click', () => start(stage)); return button;
      }));
      const stars = campaign.slice(chapterIndex * 3, chapterIndex * 3 + 3).reduce((sum, stage) => sum + (stageRecord(stage)?.stars || 0), 0);
      const footer = Object.assign(document.createElement('p'), { className: 'atlas-chapter-progress', textContent: `${stars} / 9 chapter stars · Start any chapter, then unlock its next missions in order.` });
      section.append(label, cards, footer); return section;
    });
    picker.replaceChildren(heading, nav, ...chapters);
  }

  function resize() {
    if (!renderer || !active || viewport.clientWidth < 1) return;
    fitBoard();
    renderer.resize(Math.max(80, viewport.clientWidth - 32), Math.max(80, viewport.clientHeight - 32));
    renderer.draw(); renderer.drawMinimap($('#game-minimap'));
  }

  function fitBoard() {
    const layout=$('#game-layout');
    if(!run || layout.hidden) { layout.style.minHeight=''; return; }
    const main=$('.game-main'), style=getComputedStyle(main);
    const fixed=[...main.children].filter(element=>element!==viewport).reduce((height,element)=>{
      const css=getComputedStyle(element);return height+(css.display==='none'?0:element.getBoundingClientRect().height+(parseFloat(css.marginTop)||0)+(parseFloat(css.marginBottom)||0));
    },0);
    const minimum=Math.max(620,Math.ceil(fixed+(parseFloat(getComputedStyle(viewport).minHeight)||170)+(parseFloat(style.borderTopWidth)||0)+(parseFloat(style.borderBottomWidth)||0)));
    const value=`${minimum}px`;if(layout.style.minHeight!==value)layout.style.minHeight=value;
  }

  function animate(time) {
    frame = null;
    if (!active || !renderer || outsideBoard()) return;
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

  function showStatus(text, tone = 'info') {
    const status = $('#game-status'); status.dataset.tone = tone;
    $('#game-status-text').textContent = text;
  }

  function questEntry(goal) {
    const entry = document.createElement('p'); entry.dataset.complete = String(goal.done);
    entry.textContent = `${goal.text || goal.label}${goal.done ? ' — complete' : ''}`;
    return entry;
  }

  function update() {
    if (!run) return;
    const stage = run.stage, result = resultFor(run), index = campaign.findIndex(item => item.id === stage.id);
    const theme = themeFor(stage), book = workshop.bookStatus(run), house = workshop.trailhouseStatus(run);
    $('#game-map-legend').textContent = run.guild ? 'Gold is you; turquoise is the beacon. Purple squares are waystones; white outlines are wheels and bells. A pale blue double marks your return point.' : 'Gold is you. Turquoise is the beacon. Outlined squares are discovered wheels and bells.';
    $('.game-main').style.setProperty('--region-color', theme.dark);
    $('#game-region').textContent = house ? `The Trailhouse / ${house.keeper}` : book ? stage.workshop.storybook.title : stage.workshop ? `${theme.place} / ${stage.workshop.practice ? 'Practice run' : 'Player adventure'} / ${stage.workshop.author}` : run.guild ? `${theme.place} / Guild job ${GUILD_IDS.indexOf(stage.id) + 1} / ${kitFor(run).name}` : stage.theme ? `${theme.place} / Chapter ${stage.chapter + 1}` : journeyLabel();
    document.body.classList.toggle('guild-active', Boolean(run.guild));
    $('#game-power').hidden = !run.guild; $('#game-guild-kit').hidden = !run.guild;
    if (run.guild) {
      const kit = kitFor(run), problem = powerProblem(run, canEnter), remaining = Math.max(0, run.guild.readyAt - run.turns), echo = liveEcho(run);
      const preview = powerPreview(run, canEnter, hazardActive);
      $('#game-power').textContent = echo ? `Return · ${echo.until - run.turns}` : `${kit.id === 'bellrunner' ? 'Pulse' : kit.id === 'mistweaver' ? 'Veil' : 'Double'}${remaining ? ` · ${remaining}` : ' · B'}`;
      $('#game-power').disabled = Boolean(problem) || paused || run.status !== 'playing';
      $('#game-power').setAttribute('aria-label', `${kit.power}. ${preview}`);
      $('#game-guild-description').textContent = `${kit.name}: ${kit.description}`;
      $('#game-guild-state').textContent = `${preview} Cast ${run.guild.uses} times. ${run.guild.warps} waystone jumps.${kit.id === 'echoist' ? ` ${run.guild.swaps} double returns.` : ''}${run.guild.veilUntil > run.turns ? ` Veil: ${run.guild.veilUntil - run.turns} turns; ${run.carrying || run.alarm ? 'revealed by cargo/alarm' : 'recent leads still persist'}.` : ''}`;
      $('#game-guild-merits').replaceChildren(...guildMerits(run).map(merit => {
        const failed = merit.id === 'clean' && run.damage > 0 || merit.id === 'swift' && run.turns > turnTarget(run);
        const entry = Object.assign(document.createElement('p'), { className: failed ? 'merit-missed' : '', textContent: `${merit.label}${merit.done ? ' — earned' : failed ? ' — missed' : ''}` });
        entry.dataset.earned = String(merit.done); return entry;
      }));
    }
    $('#game-guild-kit > p:last-child').textContent = stage.workshop?.practice ? 'Practise with this toolkit freely. This attempt cannot record honors, bests, or a creator clear.' : stage.workshop ? 'Optional specialist goals apply to this attempt. Stars and bests save for this world version and rule set.' : 'Finish the job to record commendations. They never block the exit. Bests are separate for each specialist and rule set.';
    $('#game-rule-note').hidden = !stage.restrictions.noDash && !stage.restrictions.noShield && !stage.requireCoins;
    $('#game-rule-note').textContent = [stage.restrictions.noDash ? 'Walking only: dash is disabled.' : '', stage.restrictions.noShield ? 'Unwarded: shields are disabled.' : '', stage.requireCoins ? 'Recover every coin before leaving.' : ''].filter(Boolean).join(' ');
    $('#game-title').textContent = stage.name;
    $('#game-choose').textContent = house ? 'Trailhouse' : book ? 'Storybooks' : stage.workshop ? workshop.returnSection === 'build' ? 'Designer' : workshop.returnSection === 'lab' ? 'Puzzle Lab' : 'Player worlds' : 'Trails';
    $('#game-sound').textContent = sound.enabled ? 'Sound on' : 'Sound off'; $('#game-sound').setAttribute('aria-pressed', String(sound.enabled));
    const journey = expeditions?.session;
    $('#game-difficulty').disabled = Boolean(journey || (book || house) && !libraryOpen());
    $('#game-book-banner').hidden = !(book || house);
    if(book || house) { const activity=house||book; $('#game-book-banner').textContent = `${activity.name} · ${activity.detail}`; $('#game-book-banner').dataset.missed = String(!activity.condition); }
    $('#game-expedition-banner').hidden = !journey; $('#game-expedition-kit').hidden = !journey;
    document.body.classList.toggle('expedition-active', Boolean(journey));
    if (journey) {
      const oath = VOWS.find(item => item.id === journey.config.vow);
      $('#game-expedition-banner').textContent = `Leg ${journey.leg + 1}/${journey.config.length} · ${journey.config.seed} · ${oath.name} · ${journeyScore(journey)} points · ${journey.retries} retries`;
      $('#game-perks').replaceChildren(...(journey.perks.length ? journey.perks.map(id => PERKS.find(perk => perk.id === id).name) : ['Your first camp upgrade awaits.']).map(text => Object.assign(document.createElement('p'), { textContent: text })));
      $('#game-expedition-earned').textContent = expeditions.earned.length ? `New logbook badges: ${expeditions.earned.length}. View them in the expedition hub.` : expeditions.checkpointFailed ? 'Checkpoint unavailable. Export a backup from the hub to keep this run.' : 'Checkpoint saved after each turn. Export a backup from the expedition hub.';
    }
    $('#game-cargo').hidden = !stage.relic; $('#game-cargo').disabled = !run.carrying || paused || run.status !== 'playing';
    $('#game-cargo').textContent = run.cargoDelivered ? 'Relic delivered' : run.carrying ? 'Set relic down (X)' : 'Relic on trail';
    $('#game-restart').disabled = Boolean(journey && ['camp', 'won'].includes(journey.phase) || (book || house) && run.status === 'won');
    $('#game-subtitle').textContent = `${journey ? `Expedition leg ${journey.leg + 1} of ${journey.config.length}` : house ? (stage.workshop.trailhouse.festival ? 'Lantern festival' : 'Keeper commission') : book ? `Chapter ${stage.workshop.storybook.chapter+1}/${stage.workshop.storybook.length}` : stage.workshop ? 'Adventure Workshop' : run.guild ? stage.subtitle : index < 0 ? 'Expedition on your map' : `Trail ${index + 1} of ${campaign.length} · ${stage.subtitle}`} · 3★ target: ${turnTarget(run)} turns${difficulty === 'nemesis' ? ' · NEMESIS' : ''}`;
    $('#game-story').textContent = stage.intro;
    $('#game-lanterns').textContent = `${run.collectedLanterns.length}/${stage.lanterns.length}`;
    $('#game-turns').textContent = run.turns;
    $('#game-keys').textContent = run.keyCount;
    $('#game-coins').textContent = `${run.collectedCoins.length}/${stage.coins.length}`;
    resource($('#game-health'), run.health, MAX_HEARTS, true); resource($('#game-energy'), run.energy, MAX_ENERGY);
    $('#quest-lanterns').textContent = run.collectedLanterns.length === stage.lanterns.length ? 'Every lantern burns bright.' : `Lanterns alight: ${run.collectedLanterns.length} of ${stage.lanterns.length}.`;
    $('#quest-plates').hidden = !stage.plates.length || Boolean(stage.optionalPlates);
    $('#quest-plates').textContent = activePlates(run).length === stage.plates.length ? 'The copper plates hold the crossing open.' : `Hold ${stage.plates.length} copper ${stage.plates.length === 1 ? 'plate' : 'plates'} with crates.`;
    const extraGoals = missionGoals(run).slice(1);
    $('#quest-mission').hidden = !extraGoals.length;
    $('#quest-mission').replaceChildren(...extraGoals.map(questEntry));
    const nearby = nearbyInteractions(run);
    const interact = nearby.find(item => item.id === interactionId) || nearby[0]; interactionId = interact?.id || null;
    $('#game-target-wrap').hidden = nearby.length < 2;
    $('#game-target').replaceChildren(...nearby.map(item => { const option = document.createElement('option'); option.value = item.id; option.textContent = item.label; return option; }));
    $('#game-target').value = interactionId || ''; $('#game-target').disabled = paused || run.status !== 'playing';
    $('#game-interaction-note').hidden = !['switch', 'waystone'].includes(interact?.kind);
    $('#game-interaction-note').textContent = interact?.kind === 'switch' ? mechanismPreview(run, interact) : interact?.kind === 'waystone' ? waystonePreview(run, interact, canEnter, hazardActive) : '';
    $('#game-interact').textContent = interact ? `${interact.kind === 'npc' ? 'Talk:' : interact.kind === 'relay' ? 'Ring:' : interact.kind === 'relic' ? 'Take:' : interact.kind === 'switch' ? 'Turn:' : interact.kind === 'waystone' ? 'Travel:' : 'Open:'} ${interact.name || 'supplies'} (E)` : 'Interact (E)';
    $('#game-interact').setAttribute('aria-label', interact?.label || 'Interact with a nearby keeper, relay, or supplies');
    $('#game-interact').disabled = !interact || paused || run.status !== 'playing';
    $('#game-decoys').textContent = run.decoys; $('#game-shields').textContent = run.shields;
    $('#game-decoy').disabled = !run.decoys || paused || run.status !== 'playing';
    $('#game-shield').disabled = !run.shields || run.stage.restrictions.noShield || paused || run.status !== 'playing';
    $('#game-shield').classList.toggle('armed', run.ward > 0);
    $('#game-shield').setAttribute('aria-label', `Shield: ${run.shields} charges, ${run.ward} protected turns remaining`);
    $('#game-learning').textContent = memorySummary(run.memory);
    const boss = run.hunters.find(hunter => hunter.boss);
    const cover = stage.cover.some(p => p.x === run.player.x && p.y === run.player.y);
    $('#game-threat').textContent = `${boss ? `Watcher phase ${boss.phase}/3 · ${boss.mode}. ` : run.hunters.length ? `${run.hunters.length} adaptive ${run.hunters.length === 1 ? 'hunter' : 'hunters'} on this trail. ` : 'Patrols follow fixed routes on Trail rules. '}${run.alarm ? `Alarm: ${run.alarm} turns. ` : ''}${run.ward ? `Shield: ${run.ward} turns. ` : ''}${cover ? run.noise ? 'In cover, but still audible.' : 'In fern cover: distant hunters cannot see you.' : run.carrying ? 'Your relic is singing: hunters can hear you.' : run.noise ? 'Your dash can still be heard.' : 'Walk quietly; hunters need sight, sound, or a recent lead.'}`;
    $('#forget-habits').disabled = Boolean(stage.workshop);
    $('#game-learning-save').textContent = stage.workshop ? 'Hunters learn during this adventure. Every restart begins with fresh habits, so shared routes can be replayed fairly.' : journey ? 'This expedition keeps its own learned movement history. Campaign memory is retained separately.' : memorySaveFailed ? 'Learning is available for this session; browser saving is unavailable.' : 'Movement habits stay in this browser. Forget them at any time.';
    const entries = stage.npcs.filter(npc => run.talkedTo.includes(npc.id)).map(npc => `${npc.name}: ${run.rescued.includes(npc.id) && npc.after ? npc.after : Object.hasOwn(run.choices, npc.id) ? npc.choices.find(choice => choice.id === run.choices[npc.id]).response : npc.lines.join(' ')}`);
    $('#game-journal').replaceChildren(...(entries.length ? entries : ['Speak to a keeper to record their advice.']).map(text => Object.assign(document.createElement('p'), { textContent: text })));
    const sidequests = [
      ...(stage.optionalPlates && stage.plates.length ? [{ text: 'Build the optional weight bridge', done: activePlates(run).length === stage.plates.length }] : []),
      ...(stage.coins.length && !stage.requireCoins ? [{ text: `Find every treasure (${run.collectedCoins.length}/${stage.coins.length})`, done: run.collectedCoins.length === stage.coins.length }] : []),
      ...(stage.npcs.length ? [{ text: `Hear every keeper’s story (${run.talkedTo.length}/${stage.npcs.length})`, done: run.talkedTo.length === stage.npcs.length }] : []),
      { text: `Finish without taking damage${run.status === 'playing' && run.damage === 0 ? ' (clean so far)' : ''}`, done: run.status === 'won' && run.damage === 0 },
    ];
    $('#game-commission').hidden = !house || !house.goals.length;
    if(house) { $('#game-commission-title').textContent=house.name; $('#game-commission-goals').replaceChildren(...house.goals.map(goal=>questEntry({text:goal.label,done:goal.done}))); }
    $('#game-sidequests').replaceChildren(...sidequests.map(questEntry));
    if (!outsideBoard()) updateConversation();
    $('#quest-beacon').textContent = run.status === 'won' ? 'The beacon shines again.' : 'Return to the turquoise beacon.';
    $('#game-hint').hidden = !hintVisible;
    $('#game-hint-text').textContent = scoutHint(run);
    $('#game-hint-button').setAttribute('aria-expanded', String(hintVisible));
    const incoming = boss?.mode === 'charging sweep' && Math.abs(boss.x - run.player.x) + Math.abs(boss.y - run.player.y) <= 7;
    const intro = run.turns === 0 && run.message === stage.intro;
    const progress = run.events.find(event => ['lantern', 'key', 'unlock', 'delivery', 'relay-complete', 'win'].includes(event.type));
    const warning = !intro && !progress && /block(?:ed|s)?|closed|locked|cannot|needs? |no .+ left|occupied|occupies|recharges|oath:/.test(run.message.toLowerCase());
    const danger = run.events.some(event => ['hurt', 'alarm'].includes(event.type)) || incoming || run.status === 'lost';
    const quietStep = run.message === 'Watch the hunters. Use cover, change direction, or create an opening.';
    const travelText = run.carrying ? 'The relic sings. Hunters can hear it.' : run.noise ? 'Your footsteps echo along the trail.' : 'The trail leads onward.';
    showStatus(paused ? 'Take a breath. The trail will wait.' : intro ? 'Find the lost lanterns. The beacon is waiting.' : `${quietStep ? travelText : run.message}${incoming ? ' A Watcher sweep is coming. Leave the marked ground!' : ''}`,
      paused ? 'info' : danger ? 'danger' : warning ? 'warning' : progress ? 'success' : 'info');
    $('#dash-button').classList.toggle('armed', dashArmed); $('#dash-button').setAttribute('aria-pressed', String(dashArmed));
    $('#dash-button').disabled = paused || run.status !== 'playing' || run.energy < 2 || run.stage.restrictions.noDash;
    document.querySelectorAll('[data-move], #game-wait').forEach(button => { button.disabled = paused || run.status !== 'playing'; });
    $('#game-pause').textContent = paused ? 'Resume' : 'Pause'; $('#game-pause').setAttribute('aria-pressed', String(paused));
    $('#game-pause').disabled = run.status !== 'playing';
    const best = stage.workshop ? workshop.best(stage.workshop.key, run.difficulty) : journey ? null : run.guild ? guildRecords[guildRecordId(run)] : records[recordId(run)];
    $('#game-best').textContent = journey ? 'View expedition bests and badges in the logbook.' : best ? `${run.guild && !stage.workshop ? `${best.merits}/3 commendations` : '★'.repeat(best.stars)} · ${best.score} points · ${best.turns} turns` : 'No finish yet. Your first adventure starts here.';
    $('#game-save-note').textContent = journey ? expeditions.checkpointFailed ? 'Checkpoint unavailable. Keep this tab open or export an expedition backup.' : 'Expedition checkpoint saved. Campaign maps, bests, and learned habits are kept separately.' : saveFailed ? 'Browser saving is unavailable. Unlocks and bests remain available for this session. Your editor map is untouched.'
      : 'Adventure bests are kept in this browser. Playing never changes your editor map or its undo history.';
    if (run.guild) $('#game-save-note').textContent = guildSaveFailed ? 'Guild saving unavailable. Results remain available for this session.' : 'Guild bests save on completion, separately for each specialist and rule set. An unfinished job restarts from the beginning.';
    if (stage.workshop) $('#game-save-note').textContent = workshop.saveFailed ? 'Workshop saving unavailable. Download your adventure to keep a backup.' : 'Player adventure bests and drafts save separately from the story, Guild, and expeditions.';
    if (stage.workshop?.practice) { $('#game-best').textContent = 'Practice attempt · bests and creator clear stay unchanged.'; $('#game-save-note').textContent = 'Practise freely. Only a full Playtest from the original starting point can verify this world.'; }
    if(house) { $('#game-best').textContent='Your commission bests and keepsakes live at the Trailhouse.'; $('#game-save-note').textContent=house.saved?'Completed commissions save to your Trailhouse passport. Reloading restarts an unfinished attempt.':'Trailhouse saving unavailable. Keep this tab open and download a passport from the hub.'; }
    if(book) { $('#game-best').textContent = 'Your chapter scores and optional honors are collected in Storybooks.'; $('#game-save-note').textContent = book.saved ? 'Completed chapters save at camp. Reloading restarts this chapter with fresh supplies and hunter habits.' : 'Storybook saving unavailable. Keep this tab open and download the book to retain its worlds.'; }
    $('#game-stars').hidden = Boolean(stage.workshop?.practice);
    $('#adventure').dataset.status = run.status;
    canvas.setAttribute('aria-label', `${stage.name}. ${run.difficulty} rules. Column ${run.player.x + 1}, row ${run.player.y + 1}. Health ${run.health} of 3. ${run.collectedLanterns.length} of ${stage.lanterns.length} lanterns. ${run.message}`);
    $('#game-overlay').hidden = !paused && run.status === 'playing';
    if (paused) {
      $('#game-result-eyebrow').textContent = 'A MOMENT ON THE TRAIL'; $('#game-result-title').textContent = 'Take a breather.';
      $('#game-result-text').textContent = 'No ticking clock. Plan your next move, then head back out.'; $('#game-primary').textContent = 'Resume adventure';
      $('#game-stars').textContent = '';
    } else if (result) {
      $('#game-result-eyebrow').textContent = index === 5 ? 'THE SIGNAL IS SILENT' : 'TRAIL RESTORED'; $('#game-result-title').textContent = stage.resultTitle || (index === 5 ? 'The Watcher falls silent.' : index === 3 ? 'Orin has a way home.' : index === 4 ? 'The bells sing for the trail.' : 'You brought back the light.');
      $('#game-result-text').textContent = `${run.rescued.length ? `${run.rescued.map(id => stage.npcs.find(npc => npc.id === id).name).join(' and ')} rescued. ` : ''}${result.score} points · ${result.turns} turns · ${run.collectedCoins.length} treasures. ${result.stars === 3 ? 'A perfect three-star trail!' : `Try a clean run in ${turnTarget(run)} turns for three stars.`}`;
      const epilogue = stage.epilogues?.[run.choices[stage.endingChoice]] || stage.ending;
      if (epilogue) $('#game-result-text').textContent += ` ${epilogue}`;
      $('#game-stars').textContent = '★'.repeat(result.stars) + '☆'.repeat(3 - result.stars);
      $('#game-stars').setAttribute('aria-label', `${result.stars} of 3 stars`);
      $('#game-primary').textContent = index === campaign.length - 1 ? 'Return to the trail library' : index >= 0 && index < campaign.length - 1 ? 'Next adventure →' : 'Play this trail again';
    } else if (run.status === 'lost') {
      $('#game-result-eyebrow').textContent = 'EVERY EXPLORER GETS ANOTHER GO'; $('#game-result-title').textContent = 'A new route awaits.';
      $('#game-result-text').textContent = 'The red outlined cell shows each warden’s next move. Wait for an opening, or dash two tiles before they move.';
      $('#game-primary').textContent = 'Retry adventure'; $('#game-stars').textContent = '';
    }
    if (journey && !paused && run.status !== 'playing') {
      $('#game-result-eyebrow').textContent = journey.phase === 'camp' ? 'A LIGHT ALONG THE ROAD' : journey.phase === 'won' ? 'THE LONG WAY HOME' : 'ANOTHER ROUTE IS POSSIBLE';
      $('#game-result-title').textContent = journey.phase === 'camp' ? 'A fire and a fresh trail.' : journey.phase === 'won' ? 'Your expedition is complete.' : 'Take another run at this leg.';
      $('#game-result-text').textContent = `${journeyScore(journey)} points · ${journey.receipts.length}/${journey.config.length} legs finished · ${journey.retries} retries. ${journey.phase === 'camp' ? 'Supplies carry forward. Choose a camp upgrade and your next route.' : journey.phase === 'won' ? 'Your route and achievements are recorded in the logbook. Try a new seed, oath, or rule set.' : 'Retry from this leg’s checkpoint. Earlier legs and upgrades are retained; hunters remember the attempt.'}`;
      $('#game-primary').textContent = journey.phase === 'camp' ? 'Make camp →' : journey.phase === 'won' ? 'Choose another expedition' : 'Retry this leg';
    }
    if (run.guild && !paused && result) {
      const merits = guildMerits(run).filter(merit => merit.done).length;
      $('#game-result-eyebrow').textContent = 'GUILD DISPATCH COMPLETE'; $('#game-result-title').textContent = `${merits === 3 ? 'An exemplary dispatch.' : 'A job worth telling.'}`;
      $('#game-result-text').textContent = `${kitFor(run).name} · ${merits}/3 commendations · ${result.score + merits * 150} points · ${result.turns} turns. ${merits < 3 ? 'Try a different route or specialist to earn the remaining commendations.' : 'All optional goals met. Try another specialist or Nemesis for a different run.'}`;
      $('#game-primary').textContent = 'Choose another Guild job';
    }
    if (stage.workshop && result && !paused) {
      $('#game-result-eyebrow').textContent = stage.workshop.practice ? 'AN EXPERIMENT, COMPLETE' : 'ANOTHER KEEPER’S WORLD, RESTORED';
      $('#game-result-title').textContent = 'A story worth bringing home.';
      $('#game-result-text').textContent = `${result.score} points · ${result.turns} turns · ${result.stars} stars. ${stage.ending || ''}${workshop.returnSection === 'build' ? ` ${workshopClearNote}` : ''}`;
      if (stage.workshop.practice) $('#game-result-text').textContent = `Practice complete in ${result.turns} turns. ${workshopClearNote}`;
      $('#game-primary').textContent = workshop.returnSection === 'build' ? 'Return to your designer' : workshop.returnSection === 'lab' ? 'Back to Puzzle Lab' : 'Back to player adventures';
    }
    if(book && result && !paused) { $('#game-result-eyebrow').textContent = 'A PAGE OF YOUR JOURNEY, RESTORED'; $('#game-result-text').textContent = `${stage.workshop.source==='Storybook original' ? stage.ending+' ' : ''}${result.score} chapter points · ${result.turns} turns. ${workshopClearNote}`; $('#game-primary').textContent = 'Turn the page →'; }
    if(house && result && !paused) { const fulfilled=house.goals.every(goal=>goal.done); $('#game-result-eyebrow').textContent=stage.workshop.trailhouse.festival?'A HOME FOR EVERY LIGHT':fulfilled?'A PROMISE KEPT':'ANOTHER ROAD TO TRY'; $('#game-result-title').textContent=stage.workshop.trailhouse.festival?'The village shines together.':fulfilled?'Commission fulfilled.':'The world shines. A favor remains.'; $('#game-result-text').textContent=`${stage.workshop.trailhouse.festival?stage.ending+' ':''}${workshopClearNote}`; $('#game-primary').textContent='Return to the Trailhouse'; }
    if (result && !paused && (house ? !house.saved : book ? !book.saved : stage.workshop ? workshop.saveFailed : journey ? expeditions.checkpointFailed : run.guild ? guildSaveFailed : saveFailed)) {
      $('#game-result-text').textContent += ' Saving unavailable. Keep this tab open to retain this result.';
    }
    $('#game-nemesis').hidden = Boolean(journey) || paused || run.status !== 'won' || !stage.actFinal || difficulty !== 'trail';
    fitBoard();renderer.setState(run); renderer.drawMinimap($('#game-minimap')); paint();
  }

  function journeyLabel() { return expeditions?.session ? 'Beyond the atlas / Seeded expedition' : 'Your own world / Custom adventure'; }

  function revealBoard() { showBoard(); requestAnimationFrame(() => { if (active) { resize(); canvas.focus({ preventScroll: true }); } }); }

  function start(stage) {
    expeditions?.suspend(); $('#game-difficulty').disabled = false;
    workshopActions = []; workshopClearNote = '';
    run = createRun(stage, { memory: stage.workshop ? freshMemory() : memory, difficulty }); paused = false; dashArmed = false; interactionId = null; lastAction = performance.now();
    const chapterIndex = campaign.findIndex(item => item.id === stage.id);
    if (chapterIndex >= 0) selectedChapter = Math.floor(chapterIndex / 3);
    hintVisible = false; selectNotes('quest');
    renderer = createAdventureRenderer(canvas, run.stage, { reducedMotion: motion }); renderPicker(); renderGuild(); resize(); update();
    revealBoard();
  }

  function action(direction, dash = false) {
    const conversationAction = direction === 'close-dialogue' || direction.startsWith('choose:');
    if (!active || outsideBoard() || front.dialogOpen || notesDialog.open || !run || (paused && !conversationAction) || run.status !== 'playing') return;
    const input = `${['up', 'right', 'down', 'left'].includes(direction) && (dash || dashArmed) ? 'dash-' : ''}${direction}`;
    if (expeditions?.session) { dashArmed = false; lastAction = performance.now(); expeditions.act(input); return; }
    const before = run;
    run = stepRun(run, `${['up', 'right', 'down', 'left'].includes(direction) && (dash || dashArmed) ? 'dash-' : ''}${direction}`);
    dashArmed = false; lastAction = performance.now(); if (run !== before) sound.play(run.events);
    if (run.stage.workshop && workshopActions.length <= 2000) workshopActions.push(input);
    if (!run.stage.workshop && run.memory !== memory) { memory = run.memory; memorySaveFailed = !saveMemory(storage, memory); }
    if (run.status === 'won' && before.status !== 'won') {
      if (run.stage.workshop) workshopClearNote = workshop.recordWin(run, workshopActions);
      else if (run.guild) { const saved = saveGuild(storage, guildRecords, run, resultFor(run).score); guildRecords = saved.records; guildSaveFailed = !saved.saved; renderGuild(); }
      else { const saved = saveResult(storage, records, recordId(run), resultFor(run)); records = saved.records; saveFailed = !saved.saved; }
      renderPicker();
    }
    update();
    if (run.status !== 'playing') $('#game-primary').focus({ preventScroll: true });
  }

  function updateConversation() {
    const dialog = $('#conversation-dialog');
    if (!active) { if (dialog.open) dialog.close(); return; }
    if (!run.dialogue) { if (dialog.open) { dialog.close(); canvas.focus({ preventScroll: true }); } return; }
    const npc = run.stage.npcs.find(item => item.id === run.dialogue), selected = run.choices[npc.id];
    drawKeeperPortrait($('#conversation-portrait'), npc, themeFor(run.stage), run.rescued.includes(npc.id));
    $('#conversation-wallet').hidden = !(npc.choices || []).some(choice => choice.cost);
    $('#conversation-wallet').textContent = `Unspent coins: ${wallet(run)}. Trades are optional and each keeper offers one parcel. Supplies are capped at three.`;
    $('#conversation-name').textContent = npc.name;
    const lines = run.rescued.includes(npc.id) && npc.after ? [npc.after] : selected ? [npc.choices.find(choice => choice.id === selected).response] : npc.lines;
    $('#conversation-lines').replaceChildren(...lines.map(text => Object.assign(document.createElement('p'), { textContent: text })));
    $('#conversation-options').replaceChildren(...(selected || run.rescued.includes(npc.id) ? [] : npc.choices || []).map(choice => {
      const button = document.createElement('button'), problem = choiceProblem(run, choice);
      button.textContent = `${choice.label}${problem ? ` · ${problem}` : ''}`; button.dataset.choice = choice.id;
      button.disabled = Boolean(problem);
      button.addEventListener('click', () => action(`choose:${choice.id}`)); return button;
    }));
    if (!dialog.open) dialog.showModal();
    if (selected) $('#conversation-close').focus({ preventScroll: true });
  }
  function interact() { const nearby = run && nearbyInteractions(run); const target = nearby && (nearby.find(item => item.id === interactionId) || nearby[0]); if (target) action(`interact:${target.id}`); }
  $('#game-target').addEventListener('change', event => { interactionId = event.target.value; update(); });
  $('#game-interact').addEventListener('click', interact);
  $('#game-cargo').addEventListener('click', () => action('drop-cargo'));
  $('#game-decoy').addEventListener('click', () => action('decoy'));
  $('#game-shield').addEventListener('click', () => action('shield'));
  $('#game-power').addEventListener('click', () => action('power'));
  $('#library-guild').addEventListener('click', showGuild);
  $('#guild-kit').addEventListener('change', event => { selectedKit = event.target.value; renderGuild(); });
  $('#begin-contracts').addEventListener('click', () => start(campaign[3]));
  $('#begin-sluices').addEventListener('click', () => start(campaign[6]));
  $('#game-nemesis').addEventListener('click', () => { if (run?.status === 'won' && run.stage.actFinal) { difficulty = 'nemesis'; $('#game-difficulty').value = difficulty; start(campaign[run.stage.nemesisStart]); } });
  $('#game-difficulty').addEventListener('change', event => {
    if (expeditions?.session) { event.target.value = difficulty; return; }
    if (run?.stage.workshop?.storybook || run?.stage.workshop?.trailhouse) {
      if (!libraryOpen()) { event.target.value = run.difficulty; return; }
      difficulty = event.target.value; renderPicker(); renderGuild(); return;
    }
    difficulty = event.target.value;
    if (run) {
      const browsing = libraryOpen(), chapter = selectedChapter; start(run.stage);
      if (browsing) { selectedChapter = chapter; renderPicker(); if (libraryTab === 'guild') showGuild(); else expeditions.show(libraryTab); }
    }
    else { renderPicker(); renderGuild(); }
  });
  $('#forget-habits').addEventListener('click', () => {
    if (run?.stage.workshop) return;
    if (expeditions?.session) { expeditions.act('forget'); return; }
    memory = freshMemory(); memorySaveFailed = !saveMemory(storage, memory); if (run) run = { ...run, memory }; update();
  });
  $('#conversation-close').addEventListener('click', () => action('close-dialogue'));
  $('#conversation-dialog').addEventListener('cancel', event => { event.preventDefault(); action('close-dialogue'); });
  $('#conversation-dialog').addEventListener('close', () => { if (active && run?.dialogue && !$('#conversation-dialog').open) action('close-dialogue'); });

  function pause() { if (!run || run.status !== 'playing') return; $('#game-menu').open = false; paused = !paused; update(); }
  function hint() { hintVisible = !hintVisible; $('#game-menu').open = false; update(); if (hintVisible) openNotes('help'); }
  $('#game-pause').addEventListener('click', pause);
  function restart() { if (expeditions?.session) expeditions.retry(); else if ((run?.stage.workshop?.storybook || run?.stage.workshop?.trailhouse) && run.status === 'won') openWorkshop(run.stage.workshop.trailhouse?'house':'books'); else if (run) start(run.stage); }
  $('#game-restart').addEventListener('click', restart);
  $('#game-hint-button').addEventListener('click', hint);
  function inspect() {
    if (!active || !run) return;
    $('#forecast-lines').replaceChildren(...threatForecast(run).map(text => Object.assign(document.createElement('p'), { textContent: text })));
    $('#forecast-dialog').showModal();
  }
  $('#game-inspect').addEventListener('click', inspect);
  $('#forecast-close').addEventListener('click', () => $('#forecast-dialog').close());
  $('#game-choose').addEventListener('click', () => {
    if (run?.stage.workshop) { openWorkshop(run.stage.workshop.trailhouse ? 'house' : run.stage.workshop.storybook ? 'books' : workshop.returnSection); return; }
    if (run?.guild) { showGuild(); $('#guild-jobs button').focus({ preventScroll: true }); return; }
    expeditions.show(expeditions.session ? 'expeditions' : 'story');
    $(expeditions.session ? '#expedition-resume' : '#trail-picker button:not(:disabled)').focus({ preventScroll: true });
  });
  $('#game-sound').addEventListener('click', async () => {
    await front.toggleSound();
    $('#game-menu').open = false;
  });
  function armDash() { if($('#dash-button').disabled)return; dashArmed = !dashArmed; update(); }
  $('#dash-button').addEventListener('click', armDash);
  $('#game-controls-settings').addEventListener('click',()=>{ optionsReturn=$('#game-controls-settings'); mapInput?.cancel(); front.settings('controls',$('#game-controls-settings')); });
  $('#game-wait').addEventListener('click', () => action('wait'));
  document.querySelectorAll('[data-move]').forEach(button => button.addEventListener('click', () => action(button.dataset.move)));
  $('#game-primary').addEventListener('click', () => {
    if (paused) { pause(); return; }
    if (expeditions?.session) { const phase = expeditions.session.phase; if (phase === 'camp') expeditions.openCamp(); else if (phase === 'won') expeditions.show(); else expeditions.retry(); return; }
    if (run.stage.workshop && run.status === 'won') { openWorkshop(run.stage.workshop.trailhouse ? 'house' : run.stage.workshop.storybook ? 'books' : workshop.returnSection); return; }
    if (run.guild && run.status === 'won') { showGuild(); $('#guild-jobs button').focus({ preventScroll: true }); return; }
    const index = campaign.findIndex(stage => stage.id === run.stage.id);
    if (run.status === 'won' && index === campaign.length - 1) { expeditions.show('story'); $('.atlas-nav button[aria-pressed="true"]').focus({ preventScroll: true }); return; }
    start(run.status === 'won' && index >= 0 && index < campaign.length - 1 ? campaign[index + 1] : run.stage);
  });
  $('#game-back-editor').addEventListener('click', backToEditor);
  $('#play-custom').addEventListener('click', () => {
    try { start(createCustomStage(getMap())); }
    catch (error) { showStatus(error.message, 'warning'); $('#library-notice').textContent = error.message; $('#library-notice').hidden = false; }
  });
  document.addEventListener('keydown', event => {
    if (active && libraryOpen() && event.key === 'Escape' && !front.dialogOpen && !event.target.closest('input, select, dialog')) { event.preventDefault(); showTitle(); return; }
    if (active && run && !outsideBoard() && !front.dialogOpen && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey && event.target.id === 'game-target' && event.key.toLowerCase() === 'e') {
      event.preventDefault(); canvas.focus({ preventScroll: true }); interact(); return;
    }
    if (!active || !run || outsideBoard() || front.dialogOpen || notesDialog.open || event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input, select, textarea, dialog, .game-aside')) return;
    if ($('#game-menu').open) { if (event.key === 'Escape') { event.preventDefault(); $('#game-menu').open = false; $('#game-menu summary').focus(); } return; }
    const direction=movementKey(event.key,front.preferences.keyboardLayout);
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (direction) {
      event.preventDefault();
      if (!event.repeat || front.preferences.keyRepeat==='on' && performance.now() - lastAction > 160) action(direction, event.shiftKey);
    } else if (key === ' ' && !event.target.closest('button')) { event.preventDefault(); if (!event.repeat) action('wait'); }
    else if (!event.repeat && ['p', 'Escape', 'r', 'h', 'e', 'q', 'c', 'x', 'v', 'b'].includes(key)) {
      event.preventDefault();
      if (key === 'r') restart(); else if (key === 'h') hint(); else if (key === 'e') interact(); else if (key === 'v') inspect();
      else if (key === 'b') action('power'); else if (key === 'x') action('drop-cargo'); else if (key === 'q') action('decoy'); else if (key === 'c') action('shield'); else pause();
    } else if (key === 'Enter' && run.status !== 'playing' && !event.target.closest('button')) { event.preventDefault(); $('#game-primary').click(); }
  });
  mapInput=createMapInput(canvas,{
    preferences:()=>front.preferences,
    enabled:()=>active&&!outsideBoard()&&!front.dialogOpen&&!notesDialog.open&&!document.querySelector('dialog[open]')&&!$('#game-menu').open&&!paused&&run?.status==='playing',
    origin:()=>{const rect=canvas.getBoundingClientRect(),point=renderer?.playerAnchor()||{x:.5,y:.5};return {x:rect.left+rect.width*point.x,y:rect.top+rect.height*point.y};},
    onMove:direction=>action(direction),
  });
  function controllerPress(command) {
    const dialog=document.querySelector('dialog[open]'),menu=$('#game-menu');
    if(!dialog&&training?.control(command))return;
    if(command==='pause'&&!dialog&&!outsideBoard()&&run?.status==='playing'){pause();return;}
    const overlay=!outsideBoard()&&!$('#game-overlay').hidden?$('#game-overlay'):null;
    if(dialog||outsideBoard()||menu.open||overlay){
      const container=dialog||overlay||(menu.open?menu:$('#adventure'));
      const controls=[...container.querySelectorAll('button:not(:disabled),select:not(:disabled),input:not(:disabled),summary,[tabindex="0"]')].filter(node=>node.getClientRects().length&&!node.closest('[hidden]'));
      if(!controls.length)return;
      const current=document.activeElement,index=controls.indexOf(current);
      if(['up','left','down','right'].includes(command)){
        if(current?.tagName==='SELECT'&&['left','right'].includes(command)){current.selectedIndex=Math.max(0,Math.min(current.options.length-1,current.selectedIndex+(command==='left'?-1:1)));current.dispatchEvent(new Event('change',{bubbles:true}));}
        else if(current?.type==='range'&&['left','right'].includes(command)){const step=Number(current.step)||1;current.value=String(Math.max(Number(current.min)||0,Math.min(Number(current.max)||100,Number(current.value)+(command==='left'?-step:step))));current.dispatchEvent(new Event('input',{bubbles:true}));}
        else{const next=controls[(index+(command==='up'||command==='left'?-1:1)+controls.length)%controls.length];next.focus({preventScroll:true});next.scrollIntoView({block:'nearest'});}
      }else if(command==='interact') (controls.includes(current)?current:controls[0]).click();
      else if(command==='back'){
        if(dialog){const back=dialog.querySelector('[data-controller-back],button[id$="-close"],button[id$="-cancel"]');if(back&&!back.disabled)back.click();}
        else if(overlay)$(paused?'#game-primary':'#game-result-menu').click();
        else if(menu.open){menu.open=false;$('#game-menu summary').focus({preventScroll:true});}
        else{const back=['#journal-back','#front-back','#ws-home','#training-home','#library-title'].map(selector=>$(selector)).find(node=>node.getClientRects().length&&!node.closest('[hidden]'));back?.click();}
      }
      return;
    }
    if(!run)return;
    if(command==='pause'){pause();return;}
    if(run.status!=='playing'){if(command==='interact')$('#game-primary').click();return;}
    if(paused){if(command==='interact'||command==='back')pause();return;}
    if(['up','right','down','left'].includes(command))action(command);
    else if(command==='interact')interact();else if(command==='dash')armDash();else if(command==='back')action('wait');else if(command==='plan')inspect();else action(command==='cargo'?'drop-cargo':command);
  }
  function applyControls(preferences){
    document.body.dataset.controls=preferences.controls;document.body.dataset.padSide=preferences.padSide;document.body.dataset.controlSize=preferences.controlSize;
    $('#game-input-label').textContent=CONTROL_STYLES[preferences.controls];$('#game-controls-help').textContent=controlHelp(preferences);canvas.title=controlHelp(preferences);
    mapInput?.cancel();dashArmed=false;training?.refresh();
    if(preferences.gamepad==='on')gamepadInput?.start();else gamepadInput?.stop();
    if(run)resize();
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden && active && run?.status === 'playing' && !run.dialogue && !paused) { paused = true; update(); } });
  new ResizeObserver(resize).observe(viewport);
  window.visualViewport?.addEventListener('resize',resize);
  window.addEventListener('resize',resize);
  expeditions = createExpeditionUI({ storage, onShow: showLibrary, onNotice: text => {
    showStatus(text);
    if (libraryOpen()) { $('#library-notice').textContent = text; $('#library-notice').hidden = false; }
  }, onRun(session, newStage) {
    run = session.run; difficulty = session.config.difficulty; $('#game-difficulty').value = difficulty;
    if (newStage || !renderer || run.stage.id !== $('#adventure').dataset.stage) {
      renderer = createAdventureRenderer(canvas, run.stage, { reducedMotion: motion }); paused = false; dashArmed = false; interactionId = null; renderPicker(); resize(); revealBoard();
    }
    $('#adventure').dataset.stage = run.stage.id; lastAction = performance.now(); if (!newStage) sound.play(run.events); update();
    if (run.status !== 'playing') $('#game-primary').focus({ preventScroll: true });
  } });
  workshop = createWorkshopUI({ storage, getMap, onExit: showTitle, onTerrain: backToEditor, onGuide: onCreatorGuide, onPlay(stage, rules) { difficulty = rules; $('#game-difficulty').value = rules; start(stage); } });
  training = createTrainingUI({ storage, getPreferences:()=>front.preferences, onControls:()=>front.settings('controls',$('#training-controls-settings')), onHome: showTitle, onStory() { training.hide(); expeditions.show('story'); },
    onWorkshop(pack) { if (!workshop.acceptDraft(pack)) return false; openWorkshop('build'); return true; } });
  front = createFrontMenu({ storage, sound,
    onMode(mode) { if (mode === 'guild') showGuild(); else expeditions.show(mode); },
    onContinue() { paused = false; showBoard(); update(); revealBoard(); },
    onResumeExpedition() { expeditions.show(); $('#expedition-resume').click(); },
    onMapmaker: backToEditor,
    onCustomMap() { try { start(createCustomStage(getMap())); } catch (error) { front.notice(error.message); } },
    onPreferences(preferences) { applyControls(preferences); if (run) { update(); paint(); } },
    getJournal() { return { ...adventureJournal({ campaign, jobs: journalJobs, records, guildRecords, book: expeditions.logbook, difficulty, kit: selectedKit }), saveUnavailable: saveFailed || guildSaveFailed || expeditions.checkpointFailed || peekJourney(storage).unavailable }; },
    onDestination: journalDestination, onChoose: showTitle,
  });
  gamepadInput=createGamepadInput({onPress:controllerPress,onStatus:text=>$('#settings-gamepad-status').textContent=text,enabled:()=>active&&!document.hidden});
  applyControls(front.preferences);
  systemMotion.addEventListener('change', () => { if (run) paint(); });
  renderPicker(); renderGuild();
  return {
    enter() { active = true; applyControls(front.preferences); showTitle(); },
    openWorkshop,
    openTraining,
    useTerrain() { openWorkshop('build'); workshop.fromTerrain(); },
    openShared(code) { openWorkshop('import'); workshop.openShared(code); },
    leave() {
      training.hide();
      workshop.hide();
      active = false; mapInput.cancel(); gamepadInput.stop(); dashArmed = false;
      front.close(); front.hide(); frontStyle('play');
      for (const selector of ['#conversation-dialog', '#camp-dialog', '#forecast-dialog', '#game-notes-dialog']) if ($(selector).open) $(selector).close();
      $('#game-menu').open = false;
      if (frame !== null) cancelAnimationFrame(frame); frame = null;
    },
  };
}
