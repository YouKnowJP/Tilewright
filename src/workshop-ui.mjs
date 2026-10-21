import { blankAdventure, normalizeAdventure, editAdventure, adventureKey, adventureStage, checkAdventure, verifyAdventureProof, MAX_PROOF_ACTIONS, MAX_ADVENTURE_BYTES } from './workshop-model.mjs';
import { loadWorkshop, storeWorkshop, addWorkshopAdventure, loadWorkshopDraft, saveWorkshopDraft, loadWorkshopBests, saveWorkshopBest } from './workshop-library.mjs';
import { WORLD_REGIONS, WORLD_MISSIONS, seededAdventure, adventureFromMap, workshopShowcases } from './workshop-worlds.mjs';
import { serializeAdventure, parseAdventure, adventureCode, parseAdventureCode, adventurePlayLink } from './workshop-sharing.mjs';
import { drawWorkshopWorld } from './workshop-art.mjs';
import { GUILD_KITS } from './adventure-tools.mjs';
import { CHAPTERS, drawAtlasArt } from './adventure-art.mjs';
import { createWorkshopDesigner } from './workshop-designer.mjs';
import { createRun, stepRun, resultFor } from './adventure.mjs';
import { freshMemory } from './adventure-brain.mjs';
import { createAdventureRenderer } from './adventure-render.mjs';
import { WORKSHOP_CLEARS } from './workshop-clears.mjs';
import { STORY_LEVELS, storyAdventure } from './storybook-adventures.mjs';
import { createStorybookUI } from './storybook-ui.mjs';
import { LAB_ROOMS, puzzleLabWorld, designSpark, cursorPractice } from './workshop-lab.mjs';

export function createWorkshopUI({ storage, getMap, onExit, onPlay, onTerrain, onGuide }) {
  const $ = id => document.getElementById(`ws-${id}`), root = document.getElementById('adventure-workshop');
  const kitLabel=id=>GUILD_KITS.find(kit=>kit.id===id)?.name||'Wayfarer';
  const restored = loadWorkshop(storage), featured = workshopShowcases().map((pack,i) => normalizeAdventure({ ...pack, ...(WORKSHOP_CLEARS[i] ? { proof:WORKSHOP_CLEARS[i] } : {}) }));
  const restoredDraft=loadWorkshopDraft(storage); let draftTouched=Boolean(restoredDraft);
  let entries = restored.entries, bests = loadWorkshopBests(storage), saved = true, preview = null, share = null, activePlay = null, section = 'shelf';
  let token = 0, replay = null, timer = null, shelfFailed = restored.unavailable, labRoom = LAB_ROOMS[0].id, previewOrigin = 'shelf';
  const verified = new Map();
  const notice = (text,error=false) => { $('status').textContent=text; $('status').dataset.error=String(error); };
  const designer = createWorkshopDesigner({ initial:restoredDraft || blankAdventure(), onChange(pack) { draftTouched=true; saved=saveWorkshopDraft(storage,pack); draftState(pack); }, notice });
  const books = createStorybookUI({ storage, getWorlds: () => [...featured, ...LAB_ROOMS.map(room => puzzleLabWorld(room.id)), ...STORY_LEVELS.map(level => storyAdventure(level.id)), ...entries], getDraft: () => designer.get(), onPlay(stage,rules) { activePlay={book:true,origin:'books'}; hide(); onPlay(stage,rules); } });
  function draftState(pack = designer.get()) { $('draft-state').textContent = `${pack.map.width} × ${pack.map.height} · ${pack.markers.length}/128 objects · ${draftTouched ? saved ? 'Draft saved' : 'Saving unavailable — export a backup' : 'A new canvas'}${pack.proof ? ` · Clear attached (${pack.proof.difficulty})` : ' · Playtest to record a clear'}`; }
  const guard = fn => { try { return fn(); } catch(error) { notice(error.message,true); return null; } };
  function close(id) { if ($(id).open) $(id).close(); }
  function stopReplay() { if (timer) clearTimeout(timer); timer=null; if(replay) replay.playing=false; }
  function hide() { token++; stopReplay(); designer.hide(); for(const id of ['new-dialog','preview-dialog','share-dialog','replay-dialog','remix-dialog']) close(id); root.hidden=true; document.body.classList.remove('workshop-designing'); }
  function tab(id) {
    guard(() => { if (section==='build') designer.get(); section=id; $('heading').textContent=id==='build'?'World studio':id==='lab'?'Puzzle Lab':id==='books'?'Storybooks':'Adventure Workshop'; if(id==='build')notice('Choose a quick brush, or open the full palette.'); if(id==='lab')notice('Play a room, try another answer, then remix its puzzles into your own adventure.'); root.dataset.section=id; document.body.classList.toggle('workshop-designing',id==='build'&&!root.hidden);
      for(const name of ['shelf','build','import','lab','books']) { $(name).hidden=name!==id; $('tab-'+name).setAttribute('aria-pressed',String(name===id)); }
      if(id==='build') { designer.refresh(); draftState(); } if(id==='shelf') renderShelf(); if(id==='lab')renderLab(); if(id==='books')books.show();
    });
  }
  function show(id='shelf') { root.hidden=false; tab(id); $('heading').focus({preventScroll:true}); if(restored.unavailable) notice('Your saved shelf could not be loaded. Import an exported backup to recover your worlds. Nothing is overwritten until you save or add an adventure.',true); else if(restored.damaged) notice(`${restored.damaged} damaged shelf entries could not be opened. Other worlds remain available.`,true); }
  function persist() { shelfFailed=!storeWorkshop(storage,entries); renderShelf(); return !shelfFailed; }
  function add(pack) { entries=addWorkshopAdventure(entries,pack); const ok=persist(); notice(ok ? 'Adventure added to your shelf.' : 'Adventure kept in this session. Browser saving is unavailable; download a file to keep it.',!ok); }
  function renderShelf() {
    const query=$('search').value.trim().toLowerCase(), filter=$('filter').value, keys=new Set(featured.map(adventureKey));
    const all=[...(filter==='mine'?[]:featured.map(pack=>({pack,featured:true}))),...(filter==='featured'?[]:entries.filter(p=>filter==='mine'||!keys.has(adventureKey(p))).map(pack=>({pack,featured:false})))];
    const matches=all.filter(({pack})=>`${pack.title} ${pack.author} ${pack.description}`.toLowerCase().includes(query));
    $('shelf-count').textContent=`${matches.length} worlds · ${entries.length}/32 on your shelf`;
    $('adventures').replaceChildren(...matches.map(item=> {
      const {pack}=item, key=adventureKey(pack), card=document.createElement('article'), button=document.createElement('button'), art=document.createElement('canvas'), copy=document.createElement('div');
      card.className='ws-adventure-card'; card.dataset.adventureKey=key; copy.className='ws-card-copy'; art.setAttribute('aria-hidden','true'); drawWorkshopWorld(art,pack,{thumbnail:true});
      for(const [tag,text,cls] of [['span',item.featured?'FEATURED ADVENTURE':'FROM YOUR SHELF','ws-card-label'],['h4',pack.title,''],['p',pack.description||'A player-made adventure.',''],['small',`By ${pack.author} · ${kitLabel(pack.kit)} · ${pack.markers.filter(m=>m.kind==='lantern').length} lanterns${pack.proof?' · Clear attached':''}`,'']]) { const el=document.createElement(tag); el.textContent=text; if(cls)el.className=cls; copy.append(el); }
      button.append(art,copy); button.onclick=()=>openPreview(pack); card.append(button);
      const actions=document.createElement('div'); actions.className='ws-card-actions';
      const remix=document.createElement('button'); remix.textContent='Remix'; remix.onclick=()=>remixWorld(pack); actions.append(remix);
      if(!item.featured) { const remove=document.createElement('button'); remove.textContent='Remove'; remove.onclick=()=>{ if(confirm(`Remove “${pack.title}” from this browser’s shelf? Download a backup first if you need it.`)){ entries=entries.filter(p=>adventureKey(p)!==key); const ok=persist(); notice(ok?'Adventure removed from your shelf.':'Removed for this session. Browser saving is unavailable.',!ok); } }; actions.append(remove); }
      card.append(actions); return card;
    }));
    if(!matches.length) { const p=document.createElement('p'); p.className='ws-footnote'; p.textContent='No worlds here yet. Create an adventure or import one from a friend.'; $('adventures').append(p); }
  }
  function playLink(pack) { try { return { url:adventurePlayLink(pack,location.href) }; } catch(error) { return { reason:error.message }; } }
  const proofId = pack => `${adventureKey(pack)}:${JSON.stringify(pack.proof)}`;
  async function validateProof(pack) {
    if(!pack.proof)return null; const id=proofId(pack); if(verified.has(id))return verified.get(id);
    const result=await verifyAdventureProof(pack,()=>new Promise(resolve=>requestAnimationFrame(resolve))); verified.set(id,result); while(verified.size>16)verified.delete(verified.keys().next().value); return result;
  }
  async function openPreview(input, origin = 'shelf') {
    const n=++token;
    try {
      const pack=normalizeAdventure(input), report=checkAdventure(pack);
      notice(pack.proof?'Checking the creator’s route…':'Previewing an unverified adventure. Finish it yourself or remix its world.');
      const proof=await validateProof(pack); if(n!==token||root.hidden)return;
      preview=pack; previewOrigin=origin; $('preview-close').textContent=origin==='lab'?'Back to Puzzle Lab':'Back to shelf'; $('preview-title').textContent=pack.title; $('preview-author').textContent=`By ${pack.author} · ${pack.map.width} × ${pack.map.height}${pack.source?` · ${pack.source}`:''}`;
      $('preview-description').textContent=pack.description||pack.intro; drawWorkshopWorld($('preview-map'),pack,{thumbnail:true});
      const kinds=kind=>pack.markers.filter(m=>m.kind===kind).length;
      const goals=[`${kinds('lantern')} lanterns to restore`,`${kitLabel(pack.kit)} toolkit`,...(['rescue','relic','bell','hunter','watcher'].filter(kinds).map(kind=>`${kinds(kind)} ${ {rescue:'keeper rescues',relic:'relic delivery',bell:'sequence bells',hunter:'adaptive hunters',watcher:'Watcher boss'}[kind]}`)),...(pack.rules.allCoins?['Recover every treasure']:[]),...(pack.rules.noDash?['Walking only']:[]),...(pack.rules.noShield?['No shields']:[])];
      $('preview-goals').replaceChildren(...goals.map(text=>Object.assign(document.createElement('span'),{textContent:text})));
      $('preview-clear').textContent=proof?`Creator clear verified · ${pack.proof.difficulty} rules · ${proof.turns} turns. Watch the route if you want a hint. Other choices and Nemesis may play differently.`:report.ready ? 'No creator clear attached. Map checks passed, but linked puzzles still need a completed playtest.' : `This unfinished world needs repairs: ${report.errors.join(' ')} Remix it to open the designer and its Checks panel.`;
      $('preview-play').disabled=!report.ready; $('preview-share').disabled=!report.ready; $('preview-watch').hidden=!proof; $('preview-add').disabled=entries.some(p=>adventureKey(p)===adventureKey(pack));
      $('preview-difficulty').value='trail'; $('preview-dialog').showModal(); notice('Choose your rules, set out, or remix this world.');
    } catch(error) { if(n===token)notice(error.message,true); }
  }
  function replaceDraft(pack) {
    if(draftTouched&&!confirm('Replace the current workshop draft? Save it to your shelf or download it first if you want to keep it.'))return false;
    close('preview-dialog'); designer.replace(pack); tab('build'); notice('Your new draft is ready. Choose a brush, then shape the next adventure.'); return true;
  }
  function remixWorld(pack) { guard(()=>{ designer.get(); replaceDraft(editAdventure(pack,{source:`Remix of ${pack.title} by ${pack.author}`.slice(0,128),author:'A trail keeper'})); }); }
  async function openShare(pack) {
    const n=++token;
    try {
      const report=checkAdventure(pack); if(!report.ready)throw Error(report.errors[0]);
      serializeAdventure(pack);
      const proof=await validateProof(pack); if(n!==token||root.hidden)return;
      share=pack; drawWorkshopWorld($('share-map'),pack,{thumbnail:true}); let code='',codeProblem=''; try { code=adventureCode(pack); } catch(error) { codeProblem=error.message; } const link=playLink(pack);
      $('share-summary').textContent=`“${pack.title}” by ${pack.author}. Terrain, story, puzzle objects, and the attached clear travel together.`;
      $('share-clear').textContent=proof?`Verified creator clear included · ${pack.proof.difficulty} · ${proof.turns} turns.`:'No creator clear included. Finish a playtest to show friends a proven route.';
      $('copy-code').disabled=!code; $('manual-copy').hidden=!code; $('export-code').value=code; $('copy-link').disabled=!link.url; $('link-note').textContent=link.url?'This play link opens a preview on this hosted copy of the game.':link.reason;
      $('share-status').textContent=codeProblem; $('manual-copy').open=false; $('share-dialog').showModal();
    } catch(error) { if(n===token)notice(error.message,true); }
  }
  async function copy(text) { try { await navigator.clipboard.writeText(text); $('share-status').textContent='Copied. Send it to a friend using your usual messaging app.'; }
    catch { $('manual-copy').open=true; $('export-code').value=text; $('export-code').focus(); $('export-code').select(); $('share-status').textContent='Clipboard access is unavailable. Copy the selected text manually.'; } }
  $('download').onclick=()=>guard(()=>{ const blob=new Blob([serializeAdventure(share)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a'); a.href=url; a.download=(share.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,50)||'adventure')+'.trail.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); $('share-status').textContent='Adventure file prepared for download.'; });
  $('copy-code').onclick=()=>guard(()=>copy(adventureCode(share)));
  $('copy-link').onclick=()=>guard(()=>{const link=playLink(share);if(link.url)copy(link.url);});
  $('preview-play').onclick=()=>guard(()=>{ activePlay={pack:preview,test:false,origin:previewOrigin}; const selected=$('preview-difficulty').value; hide(); onPlay(adventureStage(preview),selected); });
  $('preview-add').onclick=()=>guard(()=>{add(preview);$('preview-add').disabled=true;});
  $('preview-remix').onclick=()=>remixWorld(preview); $('preview-share').onclick=()=>openShare(preview);
  $('save').onclick=()=>guard(()=>add(designer.get()));
  $('share').onclick=()=>guard(()=>openShare(designer.get()));
  $('test').onclick=()=>guard(()=>{
    const pack=designer.get(),report=checkAdventure(pack); if(!report.ready){designer.panel('checks',true);throw Error(report.errors[0]);}
    activePlay={pack,test:true}; hide(); onPlay(report.stage,$('test-rules').value);
  });
  function renderLab() {
    const room=LAB_ROOMS.find(item=>item.id===labRoom),pack=puzzleLabWorld(labRoom);
    $('lab-title').textContent=room.title; $('lab-skills').textContent=room.lesson; $('lab-story').textContent=pack.intro; $('lab-idea').textContent=room.idea;
    drawWorkshopWorld($('lab-art'),pack,{thumbnail:true});
    for(const button of $('lab-rooms').querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.labRoom===labRoom));
    const done=['trail','nemesis'].filter(rule=>bests[`${adventureKey(pack)}-${rule}`]); $('lab-progress').textContent=done.length?`Restored on ${done.join(' and ')} · try another answer or make your own.`:'A complete playable puzzle · Trail or Nemesis · creator clear included';
  }
  $('lab-rooms').replaceChildren(...LAB_ROOMS.map((room,index)=>{const button=document.createElement('button');button.dataset.labRoom=room.id;button.textContent=`${String(index+1).padStart(2,'0')} · ${room.title}`;button.onclick=()=>{labRoom=room.id;renderLab();};return button;}));
  $('lab-play').onclick=()=>openPreview(puzzleLabWorld(labRoom),'lab'); $('lab-remix').onclick=()=>remixWorld(puzzleLabWorld(labRoom));
  function spark(){guard(()=>{const idea=designSpark($('spark-seed').value);$('spark-title').textContent=idea.title;$('spark-twist').textContent=idea.twist;$('spark-goal').textContent=idea.goal;});}
  $('spark-form').onsubmit=event=>{event.preventDefault();spark();};$('spark-next').onclick=()=>{$('spark-seed').value=Math.random().toString(36).slice(2,10);spark();};spark();
  $('remix-tools').onclick=()=>guard(()=>{const pack=designer.get(),point=designer.cursor;drawWorkshopWorld($('remix-art'),pack,{thumbnail:true});$('remix-position').textContent=`Practice cursor: column ${point.x+1}, row ${point.y+1}. Move the cursor on your world before opening these tools.`;$('remix-note').textContent='';$('remix-dialog').showModal();});
  $('remix-close').onclick=()=>close('remix-dialog');
  for(const button of document.querySelectorAll('[data-ws-transform]'))button.onclick=()=>guard(()=>{designer.transform(button.dataset.wsTransform);close('remix-dialog');notice('World transformed. Undo restores its previous layout and clear. Review any directional hints, then playtest your new version.');});
  $('practice').onclick=()=>{try{const pack=designer.get(),report=checkAdventure(pack);if(!report.ready)throw Error(report.errors[0]);const stage=cursorPractice(pack,designer.cursor);activePlay={pack,test:true,practice:true};const rules=$('test-rules').value;hide();onPlay(stage,rules);}catch(error){$('remix-note').textContent=error.message;notice(error.message,true);}};
  for(const id of ['preview','share','new','replay']) $(''+id+'-close')?.addEventListener('click',()=>{close(id+'-dialog');});
  $('new-cancel').onclick=()=>close('new-dialog');
  function newWorld(){guard(()=>{designer.get();$('new-dialog').showModal();});}
  $('new').onclick=newWorld; $('new-draft').onclick=newWorld;
  for(const [id,items] of [['new-region',WORLD_REGIONS],['new-mission',WORLD_MISSIONS]]) $(id).replaceChildren(...items.map(item=>new Option(item.name,item.id)));
  function newArt(){ const theme=$('new-mode').value==='seed'?{woodland:'woodland',marsh:'marsh',ruins:'archive',dunes:'dunes'}[$('new-region').value]||'woodland':$('new-mode').value==='current'?'coast':'woodland';drawAtlasArt($('new-art'),CHAPTERS.find(t=>t.id===theme)); }
  $('new-region').addEventListener('change',newArt); newArt();
  $('new-mode').onchange=()=>{newArt(); const mode=$('new-mode').value; $('new-dimensions').hidden=mode!=='blank';$('new-seeded').hidden=mode!=='seed';$('new-note').textContent=mode==='current'?'Copy terrain into an independent adventure. The original map and its undo history stay saved.':mode==='seed'?'Choose one of 20 region-and-mission recipes. The same seed and recipe produce the same world.':'Place puzzles, keepers, patrols, and goals. Add a story, then playtest it.'; };
  $('new-form').onsubmit=event=>{event.preventDefault();guard(()=>{
    const mode=$('new-mode').value,pack=mode==='seed'?seededAdventure($('new-seed').value,$('new-region').value,$('new-mission').value,$('new-risk').value==='perilous'):mode==='current'?adventureFromMap(getMap()):blankAdventure(Number($('new-width').value),Number($('new-height').value));
    close('new-dialog');replaceDraft(pack);
  });};
  drawAtlasArt($('scenery'),CHAPTERS.find(theme=>theme.id==='clockwork'));
  $('guide').onclick=()=>onGuide?.($('guide')); $('terrain').onclick=()=>guard(()=>{designer.get();onTerrain();});
  $('banner-create').onclick=newWorld; $('step-design').onclick=()=>designer.panel('adventure',true); $('step-test').onclick=()=>$('test').click(); $('step-share').onclick=()=>$('share').click();
  $('home').onclick=()=>guard(()=>{designer.get();onExit();}); for(const name of ['shelf','build','import','lab','books'])$('tab-'+name).onclick=()=>tab(name);
  $('search').oninput=renderShelf;$('filter').onchange=renderShelf;
  $('import-file').onclick=()=>{$('file').value='';$('file').click();};
  async function importFile(file){if(!file)return;try{if(file.size>MAX_ADVENTURE_BYTES)throw Error('Adventure files must be smaller than 400 KB.');const pack=parseAdventure(await file.text());await openPreview(pack);}catch(error){notice(error.message,true);}}
  $('file').onchange=()=>importFile($('file').files[0]);
  for(const name of ['dragover','dragleave','drop'])$('drop').addEventListener(name,event=>{event.preventDefault();$('drop').dataset.drag=String(name==='dragover');if(name==='drop') {if(event.dataTransfer.files.length!==1)notice('Choose one adventure file at a time.',true);else importFile(event.dataTransfer.files[0]);}});
  $('code-form').onsubmit=event=>{event.preventDefault();guard(()=>openPreview(parseAdventureCode($('import-code').value)));};
  function replayDraw(){
    if(!replay)return;const view=$('replay-viewport');replay.renderer.resize(Math.max(80,view.clientWidth-20),Math.max(80,view.clientHeight-20));replay.renderer.setState(replay.run);replay.renderer.draw();
    const npc=replay.run.stage.npcs.find(p=>p.id===replay.run.dialogue),choice=npc?.choices.find(c=>c.id===replay.run.choices[npc.id]);
    $('replay-caption').textContent=npc?`${npc.name}: ${choice?.response||npc.lines.join(' ')}`:replay.run.message;
    $('replay-position').textContent=`${replay.index}/${replay.pack.proof.actions.length} actions · turn ${replay.run.turns}`;
    const done=replay.index===replay.pack.proof.actions.length;$('replay-step').disabled=done;$('replay-skip').disabled=done;$('replay-toggle').disabled=done;$('replay-toggle').textContent=replay.playing?'Pause replay':done?'Clear complete':'Play replay';
  }
  function replayStep(count=1){if(!replay)return;for(let i=0;i<count&&replay.index<replay.pack.proof.actions.length;i++)replay.run=stepRun(replay.run,replay.pack.proof.actions[replay.index++]);if(replay.index===replay.pack.proof.actions.length)stopReplay();replayDraw();}
  function tick(){if(!replay?.playing)return;replayStep();if(replay.playing)timer=setTimeout(tick,500/Number($('replay-speed').value));}
  function replayReset(){stopReplay();if(!replay)return;replay.run=createRun(adventureStage(replay.pack),{difficulty:replay.pack.proof.difficulty,memory:freshMemory()});replay.index=0;replayDraw();}
  $('preview-watch').onclick=()=>{replay={pack:preview};$('replay-title').textContent=preview.title;$('replay-dialog').showModal();replay.renderer=createAdventureRenderer($('replay-canvas'),adventureStage(preview),{reducedMotion:{matches:true}});replayReset();};
  $('replay-toggle').onclick=()=>{if(replay.playing){stopReplay();replayDraw();}else{replay.playing=true;tick();}};
  $('replay-step').onclick=()=>{stopReplay();replayStep();};$('replay-skip').onclick=()=>{stopReplay();replayStep(20);};$('replay-reset').onclick=replayReset;
  $('replay-dialog').addEventListener('close',stopReplay);new ResizeObserver(replayDraw).observe($('replay-viewport'));
  document.addEventListener('keydown',event=>{if(root.hidden||section!=='build'||event.target.closest('input,select,textarea,dialog')||document.querySelector('dialog[open]'))return;if((event.ctrlKey||event.metaKey)&&!event.altKey){const key=event.key.toLowerCase();if(['z','y','s'].includes(key)){event.preventDefault();$(key==='s'?'save':key==='y'||event.shiftKey?'redo':'undo').click();}}});
  renderShelf();draftState();
  return { show,hide,
    acceptDraft: replaceDraft,
    fromTerrain() { $('new-mode').value='current';$('new-mode').dispatchEvent(new Event('change'));newWorld(); },
    async openShared(code){show('import');$('import-code').value=code;try{await openPreview(parseAdventureCode(code));}catch(error){notice(error.message,true);}},
    best:(key,difficulty)=>bests[`${key}-${difficulty}`],
    get saveFailed(){return !saved||shelfFailed;},
    bookStatus: run => books.status(run),
    get returnSection(){return activePlay?.book?'books':activePlay?.test?'build':activePlay?.origin==='lab'?'lab':'shelf';},
    recordWin(run,actions){
      if(run.stage.workshop.storybook)return books.recordWin(run);
      if(run.stage.workshop.practice || activePlay?.practice)return 'Practice complete. Bests and creator clears are unchanged. Start a full Playtest from the original starting point to verify this world.';
      const result=saveWorkshopBest(storage,bests,run.stage.workshop.key,run.difficulty,resultFor(run));bests=result.records;shelfFailed=!result.saved;
      if(activePlay?.test&&adventureKey(activePlay.pack)===run.stage.workshop.key&&actions.length<=MAX_PROOF_ACTIONS){
        const proof={difficulty:run.difficulty,actions:[...actions]},pack=normalizeAdventure({...activePlay.pack,proof});
        // The journal was just played by the engine from fresh memory to this win.
        verified.set(proofId(pack),run);const matchesDraft=adventureKey(designer.get())===adventureKey(pack);if(matchesDraft)designer.attachProof(proof);
        if(entries.some(entry=>adventureKey(entry)===adventureKey(pack))){entries=entries.map(entry=>adventureKey(entry)===adventureKey(pack)?pack:entry);persist();}activePlay.pack=pack;
        return matchesDraft ? 'Creator clear recorded. Your adventure is ready to share.' : 'Your earlier draft is complete. The current draft has changed; playtest its new route before sharing.';
      }
      return activePlay?.test ? 'This route exceeds 2,000 actions; use a shorter playtest to attach a creator clear.' : '';
    },
  };
}
