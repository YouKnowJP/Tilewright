import { COMMISSIONS, PROJECTS, commissionWorld, festivalWorld } from './trailhouse-content.mjs';
import { loadTrailhouse, saveTrailhouse, availableGlow, festivalReady, buildProject, trailhouseStage, commissionGoals, finishCommission, serializePassport, parsePassport, MAX_PASSPORT_BYTES } from './trailhouse-model.mjs';
import { drawVillage, drawProject, drawKeepsake } from './trailhouse-art.mjs';
import { drawWorkshopWorld } from './workshop-art.mjs';

export function createTrailhouseUI({storage,onPlay,onRemix}){
  const $=id=>document.getElementById(`house-${id}`),loaded=loadTrailhouse(storage);let state=loaded.state,failed=loaded.failed,selected=COMMISSIONS.find(job=>!state.completed.includes(job.id))?.id||COMMISSIONS[0].id,section='commissions',visitor=null,imported=null,lastResult='';
  const notice=(text,error=false)=>{$('notice').textContent=text;$('notice').dataset.error=String(error);};
  const guard=fn=>{try{return fn();}catch(error){notice(error.message,true);return null;}};
  function save(){failed=!saveTrailhouse(storage,state);saveNote();return !failed;}
  function saveNote(){$('save-note').textContent=failed?'Your Trailhouse is available for this visit. A saved passport could not be read or browser saving is unavailable. Download a passport to keep a backup.':'Village progress stays in this browser, separately from every other game mode. Download a passport before moving devices or clearing browser data. An unfinished commission restarts after reload.';}
  function node(tag,text,cls=''){const element=document.createElement(tag);element.textContent=text;if(cls)element.className=cls;return element;}
  function button(text,fn,cls=''){const element=node('button',text,cls);element.onclick=()=>guard(fn);return element;}
  function tab(id){section=id;document.getElementById('ws-house').dataset.activity=id;for(const name of ['commissions','village','keepsakes']){$(name).hidden=name!==id;$('tab-'+name).setAttribute('aria-pressed',String(name===id));}}
  function renderBoard(){
    const job=COMMISSIONS.find(item=>item.id===selected),world=commissionWorld(selected),done=state.completed.includes(selected),best=state.bests[`${selected}-${$('rules').value}`];
    $('job').value=selected;$('job-kicker').textContent=`${job.keeper.toUpperCase()} / ${COMMISSIONS.indexOf(job)+1} OF 12 COMMISSIONS`;$('job-title').textContent=job.title;$('job-story').textContent=job.story;$('job-world').textContent=world.title;$('job-goal').textContent=job.goal;$('job-hint').textContent=job.hint;drawWorkshopWorld($('job-art'),world,{thumbnail:true});
    $('job-reward').textContent=done?'First-clear light collected. Replay for a better Trail or Nemesis best.':'First successful commission: +3 village light. A world clear alone does not earn the reward; meet the commission too.';
    $('job-best').textContent=best?`${$('rules').value} best · ${best.stars} stars · ${best.score} points · ${best.turns} turns`:done?'Commission fulfilled. Try the other rules or another route.':'A new favor for the road.';$('play').textContent=done?'Revisit this commission':'Accept commission';
    for(const option of $('job').options){const item=COMMISSIONS.find(job=>job.id===option.value);option.textContent=`${item.keeper} · ${item.title}${state.completed.includes(item.id)?' · Restored':''}`;}
  }
  function render(){
    drawVillage($('village-art'),state);$('balance').textContent=`${availableGlow(state)} light to spend`;$('totals').textContent=`${state.completed.length}/12 commissions · ${state.built.length}/6 places restored`;$('village-progress').value=state.built.length;
    $('projects').replaceChildren(...PROJECTS.map((project,index)=>{
      const built=state.built.includes(project.id),card=node('article','','house-project'),art=document.createElement('canvas');card.dataset.project=project.id;art.setAttribute('aria-hidden','true');drawProject(art,index,built);
      card.append(art,node('p',project.keeper,'title-kicker'),node('h4',project.name),node('p',project.description));const actions=node('div','','house-actions');
      if(built){actions.append(button(`Visit ${project.keeper}`,()=>visit(project)),button('Remix their world',()=>onRemix(commissionWorld(COMMISSIONS.find(job=>job.world===project.world).id))));}
      else{const build=button(`Restore · ${project.cost} light`,()=>{state=buildProject(state,project.id);save();render();notice(`${project.name} is restored. ${project.keeper} has a story and a keepsake for you.`);},'front-primary');build.disabled=availableGlow(state)<project.cost;actions.append(build,node('small',availableGlow(state)<project.cost?`${project.cost-availableGlow(state)} more light needed`:'Your next place to bring home.'));}
      card.append(actions);return card;
    }));
    const festival=Boolean(state.bests['festival-trail']||state.bests['festival-nemesis']);
    $('keepsake-grid').replaceChildren(...[...PROJECTS.map(project=>({title:project.keepsake,lore:project.lore,unlocked:state.built.includes(project.id),from:project.name})),{title:'The sky’s last ribbon',lore:'A ribbon from the first lantern festival. It is tied in a bow, so the story can be opened again.',unlocked:festival,from:'Complete the lantern festival'}].map((item,index)=>{const card=node('article','','house-keepsake'),art=document.createElement('canvas');card.dataset.unlocked=String(item.unlocked);art.setAttribute('aria-hidden','true');drawKeepsake(art,index,item.unlocked);card.append(art,node('h4',item.title),node('p',item.unlocked?item.lore:`Waiting at ${item.from}.`),node('small',item.unlocked?'A little piece of home':'Still a story to discover'));return card;}));
    $('collection-count').textContent=`${state.built.length+(festival?1:0)}/7 keepsakes collected`;
    $('festival-play').disabled=!festivalReady(state);$('festival-remix').hidden=!festival;$('festival-note').textContent=festivalReady(state)?festival?'The festival’s ribbon is yours. Revisit the celebration or make your own.':'The whole village is ready. Ring the festival song and bring the keepers together in a new adventure.':`Restore ${6-state.built.length} more ${6-state.built.length===1?'place':'places'} to open a new festival adventure.`;
    renderBoard();tab(section);saveNote();if(lastResult)notice(lastResult);
  }
  function visit(project){visitor=project;$('keeper-title').textContent=project.keeper;$('keeper-place').textContent=project.name;$('keeper-speech').textContent=project.town;$('keeper-dialog').showModal();}
  function hide(){for(const id of ['keeper-dialog','restore-dialog'])if($(id).open)$(id).close();}
  $('job').replaceChildren(...COMMISSIONS.map(job=>new Option(`${job.keeper} · ${job.title}`,job.id)));$('job').onchange=()=>{selected=$('job').value;renderBoard();};$('rules').onchange=()=>{$('festival-rules').value=$('rules').value;renderBoard();};$('festival-rules').onchange=()=>{$('rules').value=$('festival-rules').value;renderBoard();};
  for(const [id,delta]of [['previous',-1],['next',1]])$(id).onclick=()=>{const index=COMMISSIONS.findIndex(job=>job.id===selected);selected=COMMISSIONS[(index+delta+COMMISSIONS.length)%COMMISSIONS.length].id;renderBoard();};
  $('next-open').onclick=()=>{selected=COMMISSIONS.find(job=>!state.completed.includes(job.id))?.id||COMMISSIONS[0].id;renderBoard();};
  for(const id of ['commissions','village','keepsakes'])$('tab-'+id).onclick=()=>tab(id);
  $('play').onclick=()=>guard(()=>{lastResult='';onPlay(trailhouseStage(state,selected),$('rules').value);});
  $('festival-play').onclick=()=>guard(()=>{lastResult='';onPlay(trailhouseStage(state,'festival'),$('festival-rules').value);});
  $('festival-remix').onclick=()=>guard(()=>onRemix(festivalWorld()));
  $('keeper-town').onclick=()=>{$('keeper-speech').textContent=visitor.town;};$('keeper-road').onclick=()=>{$('keeper-speech').textContent=visitor.road;};$('keeper-close').onclick=()=>$('keeper-dialog').close();
  $('export').onclick=()=>guard(()=>{const url=URL.createObjectURL(new Blob([serializePassport(state)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='my-trailhouse.passport.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('Passport prepared for download. Restore it in the Trailhouse on another browser.');});
  $('import').onclick=()=>{$('file').value='';$('file').click();};$('file').onchange=async()=>{const file=$('file').files[0];if(!file)return;try{if(file.size>MAX_PASSPORT_BYTES)throw Error('Choose a passport smaller than 30 KB.');imported=parsePassport(await file.text());$('restore-summary').textContent=`This passport has ${imported.completed.length}/12 commissions, ${imported.built.length}/6 restored places, and ${availableGlow(imported)} unspent light. Restoring replaces only your Trailhouse progress. Your current Trailhouse has ${state.completed.length} commissions and ${state.built.length} restored places. Other worlds and game modes stay separate.`;$('restore-dialog').showModal();}catch(error){notice(error.message,true);}};
  $('restore-cancel').onclick=()=>$('restore-dialog').close();$('restore-confirm').onclick=()=>guard(()=>{if(!imported)throw Error('Choose a passport first.');state=imported;imported=null;lastResult='';selected=COMMISSIONS.find(job=>!state.completed.includes(job.id))?.id||COMMISSIONS[0].id;save();$('restore-dialog').close();render();notice('Trailhouse passport restored.');});
  return {show(){render();},hide,
    status(run){const meta=run.stage.workshop?.trailhouse;if(!meta)return null;const job=COMMISSIONS.find(item=>item.id===meta.id),goals=meta.id==='festival'?[]:commissionGoals(meta.id,run);return {name:job?.title||'The lantern festival',detail:goals.length?`${goals.filter(goal=>goal.done).length}/${goals.length} commission goals`:'Bring the village together',goals,saved:!failed,condition:!goals.some(goal=>!goal.done&&(/no damage|no specialist|within/.test(goal.label))),keeper:job?.keeper||'Everyone'};},
    recordWin(run){const outcome=finishCommission(state,run);state=outcome.state;if(outcome.met)save();lastResult=outcome.met?outcome.reward?`Commission fulfilled. +${outcome.reward} light for your village.`:run.stage.workshop.trailhouse.id==='festival'?'The lantern festival is complete. The sky’s last ribbon is yours.':'Commission fulfilled again. Your best is recorded; first-clear light was already collected.':`World restored. This commission still needs: ${outcome.goals.filter(goal=>!goal.done).map(goal=>goal.label.toLowerCase()).join('; ')}. Try another route whenever you are ready.`;return lastResult;},
  };
}
