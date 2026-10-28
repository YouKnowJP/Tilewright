import { createRun, stepRun, nearbyInteractions, scoutHint } from './adventure.mjs';
import { createAdventureRenderer } from './adventure-render.mjs';
import { adventureStage } from './workshop-model.mjs';
import { hintPractice } from './cartographer-worlds.mjs';
import { hintFocus } from './adventure-wonders.mjs';
import { createMapInput } from './adventure-input.mjs';
import { movementKey } from './adventure-controls.mjs';
export function createClueUI({preferences,onFocus=()=>{}}) {
  const host=document.getElementById('game-hint'),text=document.getElementById('game-hint-text');
  const actions=document.createElement('div');actions.className='clue-actions';
  const clearer=document.createElement('button'),practice=document.createElement('button');clearer.id='clue-clearer';clearer.textContent='Show a clearer clue';practice.id='clue-practice';practice.textContent='Try a tiny puzzle';actions.append(clearer,practice);host.append(actions);
  const dialog=document.createElement('dialog');dialog.id='clue-dialog';dialog.className='front-dialog clue-dialog';dialog.setAttribute('aria-labelledby','clue-title');
  dialog.innerHTML='<div class="front-dialog-heading"><p class="title-kicker">A LITTLE IDEA · PRACTICE</p><button id="clue-close">Return to adventure</button></div><h2 id="clue-title">Discover the idea</h2><p id="clue-story"></p><div class="clue-board"><canvas id="clue-canvas" tabindex="0" role="img" aria-label="Practice puzzle. Arrow keys move, E interacts, T switches travelers, Z undoes."></canvas></div><p id="clue-status" role="status"></p><div class="clue-console"><div class="clue-pad" aria-label="Practice movement"><button data-clue-move="up" aria-label="Practice: move up">↑</button><button data-clue-move="left" aria-label="Practice: move left">←</button><button data-clue-move="down" aria-label="Practice: move down">↓</button><button data-clue-move="right" aria-label="Practice: move right">→</button></div><div class="clue-commands"><label>Nearby action<select id="clue-target"></select></label><button id="clue-interact">Interact · E</button><button id="clue-switch" hidden>Switch traveler · T</button></div></div><div class="clue-utility"><button id="clue-wait">Wait</button><button id="clue-undo">Undo · Z</button><button id="clue-restart">Start practice again</button></div><p class="clue-footnote">Practice changes no adventure turns, hearts, scores, or saved position.</p>';
  document.body.append(dialog);const $=id=>dialog.querySelector('#clue-'+id),canvas=$('canvas');
  let visible=false,main=null,level=0,kind=null,run=null,renderer=null,past=[];
  function draw(){if(!dialog.open||!renderer)return;renderer.resize(Math.max(80,Math.min(430,dialog.clientWidth-40)),Math.min(260,Math.max(160,innerHeight*.28)));renderer.setState(run);renderer.draw();}
  function updatePractice(){
    const nearby=nearbyInteractions(run),old=$('target').value;$('target').replaceChildren(...(nearby.length?nearby.map(i=>new Option(i.label,i.id)):[new Option('Move closer','')]));if(nearby.some(i=>i.id===old))$('target').value=old;
    $('interact').disabled=run.status!=='playing'||!nearby.length;$('target').disabled=!nearby.length||run.status!=='playing';$('switch').hidden=!run.twin;$('switch').disabled=run.status!=='playing';$('switch').textContent=run.twin?`Switch to ${run.twin.active===0?'Pathfinder':'Lantern keeper'} · T`:'Switch traveler · T';
    $('status').textContent=run.status==='won'?'You found the idea! Return to your adventure, or try another answer.':`${run.twin?`${run.twin.active===0?'Lantern keeper':'Pathfinder'} · `:''}${run.turns===0?'Take your time. Undo and restart are always available.':run.message}`;
    canvas.setAttribute('aria-label',`Practice puzzle. Turn ${run.turns}. Column ${run.player.x+1}, row ${run.player.y+1}. ${run.twin?run.twin.active===0?'Lantern keeper.':'Pathfinder.':''} Arrow keys move; E interacts; T switches travelers; Z undoes.`);
    $('undo').disabled=!past.length;dialog.querySelectorAll('[data-clue-move]').forEach(b=>b.disabled=run.status!=='playing');$('wait').disabled=run.status!=='playing';draw();
  }
  function start(){run=createRun(adventureStage(hintPractice(kind)));past=[];renderer=createAdventureRenderer(canvas,run.stage,{preferences});$('story').textContent=run.stage.intro;updatePractice();canvas.focus({preventScroll:true});}
  function action(value){if(!run||!dialog.open)return;const next=stepRun(run,value);if(next!==run){past.push(run);if(past.length>60)past.shift();run=next;}updatePractice();}
  function undo(){if(past.length){run=past.pop();updatePractice();}}
  clearer.onclick=()=>{level=1;render();};
  practice.onclick=()=>{if(!kind)return;dialog.showModal();start();};
  $('close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{run=null;renderer=null;past=[];practice.focus({preventScroll:true});});
  $('interact').onclick=()=>{if($('target').value)action('interact:'+$('target').value);};$('switch').onclick=()=>action('switch-traveler');$('wait').onclick=()=>action('wait');$('undo').onclick=undo;$('restart').onclick=start;
  dialog.querySelectorAll('[data-clue-move]').forEach(b=>b.onclick=()=>action(b.dataset.clueMove));
  dialog.addEventListener('keydown',event=>{
    if(event.target.closest('input,select,[data-game-select]')||event.ctrlKey||event.metaKey||event.altKey||event.key==='Escape')return;
    const move=movementKey(event.key,preferences().keyboardLayout),key=event.key.toLowerCase();
    if(move||['e','t','z'].includes(key)||event.key===' '&&event.target===canvas){event.preventDefault();event.stopPropagation();if(event.repeat)return;if(move)action(move);else if(key==='e')$('interact').click();else if(key==='t')action('switch-traveler');else if(key==='z')undo();else action('wait');}
  });
  const mapInput=createMapInput(canvas,{preferences,enabled:()=>dialog.open&&run?.status==='playing'&&!document.querySelector('.game-select-menu'),origin:()=>renderer?.playerAnchor()||{x:.5,y:.5},onMove:action});
  dialog.addEventListener('close',()=>mapInput.cancel());
  new ResizeObserver(draw).observe(dialog);
  function render(){if(!main)return;text.textContent=level?(main.stage.hints?.focus||scoutHint(main)):(main.stage.hints?.nudge||scoutHint(main));clearer.hidden=level>0;practice.hidden=!kind;onFocus(visible&&level?hintFocus(main):null);}
  return {control(command){if(!dialog.open)return false;if(command==='undo'){undo();return true;}if(document.activeElement===canvas){if(['up','right','down','left'].includes(command)){action(command);return true;}if(command==='interact'){$('interact').click();return true;}if(command==='power'&&run.twin){action('switch-traveler');return true;}if(command==='back'){dialog.close();return true;}}return false;},reset(){level=0;},update(next,shown){visible=shown;main=next;kind=next.stage.hints?.practice||(next.twin?'twin':next.stage.turntables?.length?'rotate':next.stage.crates.length?'crate':next.stage.relays.length?'bells':null);render();return visible&&level?hintFocus(next):null;}};
}
