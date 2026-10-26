import {createScreenMode} from './screen-mode.mjs';
import {mechanismPreview} from './adventure-mechanisms.mjs';
import {nearbyInteractions} from './adventure.mjs';
import {wonderPreview} from './adventure-wonders.mjs';
export function createPlayLayout() {
  const $=id=>document.getElementById(id),root=$('adventure'),controls=document.querySelector('.game-controls');
  // Retain the original IDs and actions; arrange them by how often players use them.
  $('game-shell-bar').hidden=true;
  const header=document.querySelector('.game-toolbar-actions');
  $('game-home').textContent='⌂';$('game-home').setAttribute('aria-label','Main menu');$('game-home').title='Main menu';header.prepend($('game-home'));
  const screenButton=document.createElement('button');screenButton.id='game-fullscreen';screenButton.type='button';screenButton.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3 8V3h5m8 0h5v5M3 16v5h5m8 0h5v-5" fill="none" stroke="currentColor" stroke-width="2"/></svg>';screenButton.title='Full screen · F';screenButton.setAttribute('aria-label','Enter full screen');header.insertBefore(screenButton,$('game-menu'));
  const actions=document.createElement('div');actions.className='play-actions';actions.append($('game-interact'),$('game-wait'),$('dash-button'),$('game-power'),$('game-twin'));controls.append(actions);
  $('game-menu').querySelector('div').prepend($('game-choose'));
  const tools=document.createElement('details');tools.id='game-tools';tools.className='play-tools';tools.innerHTML='<summary>Tools</summary><section aria-label="Tools and inventory"><div class="play-tools-heading"><strong>Your field pack</strong><button id="game-tools-close" type="button" aria-label="Close tools">Close</button></div><div id="game-inventory" class="play-inventory"></div><div id="game-tool-actions" class="play-tool-actions"></div><div id="game-tool-notes"></div></section>';
  controls.append(tools);
  for(const id of ['game-keys','game-coins'])$('game-inventory').append($(id).parentElement);
  $('game-tool-actions').append($('game-decoy'),$('game-shield'),$('game-cargo'),$('game-controls-settings'),$('game-shell-options'));
  $('game-tool-notes').append($('game-target-wrap'),$('game-interaction-note'),document.querySelector('.game-input-state'));
  const utility=document.createElement('div');utility.className='play-utilities';utility.append($('game-notes-button'),$('game-inspect'),$('game-undo'),tools);controls.append(utility);
  $('game-notes-button').textContent='Quest';$('game-inspect').textContent='Plan';$('game-undo').textContent='Undo';
  document.querySelector('.tactical-actions').remove();document.querySelector('.game-input-strip').remove();
  for(const id of ['game-region','game-rule-note','game-book-banner','game-expedition-banner','game-wonder-summary']){const node=$(id);if(node)$('notes-quest').prepend(node);}
  const context=document.createElement('button');context.id='game-context';context.type='button';context.hidden=true;context.setAttribute('aria-controls','game-tools');controls.append(context);
  const messageButton=document.createElement('button');messageButton.id='game-message-more';messageButton.textContent='Read more';messageButton.hidden=true;messageButton.setAttribute('aria-controls','game-message-dialog');$('game-status').append(messageButton);
  const messageDialog=document.createElement('dialog');messageDialog.id='game-message-dialog';messageDialog.className='front-dialog';messageDialog.setAttribute('aria-labelledby','game-message-heading');messageDialog.innerHTML='<div class="front-dialog-heading"><h2 id="game-message-heading">On the trail</h2><button id="game-message-close">Back</button></div><p id="game-message-copy"></p>';document.body.append(messageDialog);messageButton.onclick=()=>{$('game-message-copy').textContent=$('game-status-text').textContent;messageDialog.showModal();};$('game-message-close').onclick=()=>messageDialog.close();messageDialog.addEventListener('close',()=>messageButton.getClientRects().length?messageButton.focus({preventScroll:true}):$('adventure-canvas').focus({preventScroll:true}));
  function closeTools(focus=false){tools.open=false;if(focus)tools.querySelector('summary').focus({preventScroll:true});}
  const confirmTarget=()=>{closeTools();requestAnimationFrame(()=>$('adventure-canvas').focus({preventScroll:true}));};
  $('game-target').addEventListener('change',confirmTarget);$('game-target').addEventListener('game-choice',confirmTarget);
  context.onclick=()=>{tools.open=true;$('game-tools-close').focus({preventScroll:true});};$('game-tools-close').onclick=()=>closeTools(true);
  document.addEventListener('pointerdown',event=>{if(!tools.contains(event.target)&&!event.target.closest('.game-select-menu')&&event.target!==context)closeTools();});
  tools.addEventListener('focusout',event=>{if(event.relatedTarget&&!tools.contains(event.relatedTarget)&&!event.relatedTarget.closest('.game-select-menu'))closeTools();});
  for(const id of ['game-decoy','game-shield','game-cargo'])$(id).addEventListener('click',()=>{closeTools();$('adventure-canvas').focus({preventScroll:true});});
  $('game-controls-settings').addEventListener('click',()=>closeTools());$('game-shell-options').addEventListener('click',()=>closeTools());
  const outsideButton=document.createElement('button');outsideButton.id='screen-exit';outsideButton.className='screen-exit';outsideButton.hidden=true;outsideButton.textContent='Leave screen view';document.body.append(outsideButton);
  const titleButton=document.createElement('button');titleButton.id='title-fullscreen';titleButton.textContent='Full screen';$('title-settings').insertAdjacentElement('afterend',titleButton);
  const section=document.createElement('section');section.className='screen-options';section.innerHTML='<h3>Make room for the adventure</h3><button id="settings-fullscreen" type="button">Enter full screen</button><p id="screen-state" role="status">Full screen uses your browser’s screen mode when available. Expanded view works when that mode is unavailable.</p><details><summary>Play from your Home Screen</summary><p>Open this game’s link in your usual browser. Choose Add to Home Screen or Install app from its menu (on an iPhone or iPad, look in Share). Launch the saved icon for a separate game window. Your progress stays in that browser or app; download a backup before changing between them.</p></details>';$('settings-display').append(section);
  const screen=createScreenMode({doc:document,onChange(state){document.body.classList.toggle('screen-expanded',state.mode==='expanded');document.body.dataset.screenMode=state.mode;for(const button of [screenButton,titleButton,$('settings-fullscreen')]){button.disabled=state.busy;button.setAttribute('aria-pressed',String(state.mode!=='page'));button.setAttribute('aria-label',state.mode==='page'?'Enter full screen':state.mode==='native'?'Leave full screen':'Leave expanded view');}screenButton.dataset.active=String(state.mode!=='page');screenButton.title=(state.mode==='page'?'Full screen':'Leave screen view')+' · F';titleButton.textContent=state.mode==='page'?'Full screen':state.mode==='native'?'Leave full screen':'Leave expanded view';$('settings-fullscreen').textContent=titleButton.textContent;$('screen-state').textContent=state.note||'Full screen uses your browser’s screen mode when available. Expanded view works when it is unavailable.';sync();}});
  document.body.dataset.screenMode='page';for(const b of [screenButton,titleButton,$('settings-fullscreen')])b.setAttribute('aria-pressed','false');
  for(const button of [screenButton,titleButton,$('settings-fullscreen')])button.onclick=()=>screen.toggle();outsideButton.onclick=()=>screen.leave();
  const playing=()=>root.dataset.view==='play'&&!root.hidden&&document.body.classList.contains('playing');
  let measureFrame=0,lastHeight;
  function fitMenu(){const menu=$('game-menu');if(!menu.open)return;const summary=menu.querySelector('summary').getBoundingClientRect(),panel=menu.querySelector('div'),height=lastHeight||innerHeight,top=Math.max(8,Math.min(height-64,summary.bottom+6));panel.style.top=`${top}px`;panel.style.right=`${Math.max(10,innerWidth-summary.right)}px`;panel.style.maxHeight=`${Math.max(44,height-top-10)}px`;}
  $('game-menu').addEventListener('toggle',fitMenu);$('game-menu').querySelector('summary').addEventListener('click',()=>requestAnimationFrame(fitMenu));window.addEventListener('scroll',fitMenu,{passive:true});
  function sync(){const hideExit=screen.state.mode==='page'||playing();if(outsideButton.hidden!==hideExit)outsideButton.hidden=hideExit;const visual=window.visualViewport,height=Math.round(visual&&visual.scale===1?visual.height:innerHeight);if(height!==lastHeight){lastHeight=height;document.documentElement.style.setProperty('--play-height',`${height}px`);}if(!measureFrame)measureFrame=requestAnimationFrame(()=>{measureFrame=0;fitMenu();const text=$('game-status-text'),hidden=text.scrollHeight<=text.clientHeight+1;if(messageButton.hidden!==hidden)messageButton.hidden=hidden;});}
  window.addEventListener('resize',sync);window.visualViewport?.addEventListener('resize',sync);window.addEventListener('orientationchange',sync);
  document.addEventListener('keydown',event=>{
    if(document.querySelector('.game-select-menu'))return;
    const overlay=$('game-overlay');if(event.key==='Tab'&&playing()&&!overlay.hidden&&!document.querySelector('dialog[open]')&&!$('game-menu').open){const buttons=[...overlay.querySelectorAll('button')].filter(n=>!n.disabled&&!n.hidden&&n.getClientRects().length),index=buttons.indexOf(document.activeElement);if(buttons.length){event.preventDefault();const next=index<0?(event.shiftKey?buttons.length-1:0):(index+(event.shiftKey?-1:1)+buttons.length)%buttons.length;buttons[next].focus();return;}}
    if(event.key==='Escape'&&tools.open){event.preventDefault();event.stopImmediatePropagation();closeTools(true);return;}
    if(event.key==='Escape'&&screen.state.mode!=='page'&&!document.querySelector('dialog[open]')&&!$('game-menu').open){event.stopImmediatePropagation();if(screen.state.mode==='expanded'){event.preventDefault();screen.leave();}return;}
    if(event.key.toLowerCase()==='f'&&!event.repeat&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.target.closest('input,textarea,select,[data-game-select],dialog')&&playing()){event.preventDefault();event.stopImmediatePropagation();screen.toggle();}
  },true);
  sync();
  return {sync,closeTools,update(run,interaction){
    $('game-title').title=run.stage.name;const count=nearbyInteractions(run).length;tools.querySelector('summary').textContent=count>1?`Tools (${count})`:'Tools';
    const kind=interaction?.kind,important=['vault','turntable','waystone'].includes(kind);
    context.hidden=!important||run.status!=='playing';
    context.textContent=kind==='vault'?`Optional vault · +${(run.wonders.security+1)*75} · Security ${run.wonders.security+1}/3 · Details`:kind==='turntable'?`${interaction.radius*2+1} × ${interaction.radius*2+1} room · 1 turn · Details`:kind==='waystone'?'Waystone · 1 energy · Details':'';
    context.setAttribute('aria-label',important?`${context.textContent}. ${kind==='vault'||kind==='turntable'?wonderPreview(run,interaction):'Read Plan before choosing your landing.'}`:'Action details');
    if(kind==='switch')context.title=mechanismPreview(run,interaction);
    sync();
  }};
}
