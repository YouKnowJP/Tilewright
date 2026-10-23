import { serializeSaveArchive,parseSaveArchive,MAX_SAVE_ARCHIVE_BYTES } from './save-data.mjs';
import { MAX_PROFILES,profileName } from './save-profiles.mjs';
export function createSaveDataUI({session,onComplete}){
  const $=id=>document.getElementById(`save-${id}`),dialog=$('dialog');let token=0,pending=null,recovery=null,blocked=false,opener=null;
  function notice(text,error=false){$('status').textContent=text;$('status').dataset.error=String(error);}
  function download(text,name){const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function backup(id){try{download(serializeSaveArchive(id?session.snapshot(id):session.snapshot()),'lantern-trails-save.json');notice('Journey backup downloaded. It contains saved progress, worlds, and options for that journey. Session-only changes cannot be included.');}catch(error){notice(error.message,true);}}
  function close(){token++;pending=null;if(dialog.open&&!blocked)dialog.close();}
  function renderProfiles(){
    const list=$('profiles');list.replaceChildren();
    try{
      const catalog=session.profiles();
      for(const profile of [...catalog.profiles].sort((a,b)=>Number(b.id===catalog.activeId)-Number(a.id===catalog.activeId))){
        const index=catalog.profiles.findIndex(item=>item.id===profile.id);
        const active=profile.id===catalog.activeId,card=document.createElement('article'),heading=document.createElement('h5'),number=document.createElement('span'),state=document.createElement('p'),actions=document.createElement('div');
        card.className=`journey-card${active?' journey-current':''}`;card.dataset.journey=profile.id;heading.textContent=profile.name;number.className='journey-sigil';number.textContent=['I','II','III'][index];number.setAttribute('aria-hidden','true');state.textContent=active?'Current journey':'Resting at camp';state.className='journey-state';actions.className='save-data-actions';
        const button=(text,kind,parent=actions)=>{const node=document.createElement('button');node.textContent=text;node.dataset.journeyAction=kind;node.setAttribute('aria-label',`${text}: ${profile.name}`);node.onclick=()=>kind==='backup'?backup(profile.id):review(kind,{id:profile.id});parent.append(node);return node;};
        card.append(number,heading,state,actions);
        if(active)button('Rename','rename');else{
          button('Open journey','switch');const details=document.createElement('details'),summary=document.createElement('summary'),more=document.createElement('div');summary.textContent='Manage';more.className='save-data-actions';button('Download backup','backup',more);button('Remove journey…','delete',more);details.append(summary,more);card.append(details);
        }
        list.append(card);
      }
      $('create').disabled=catalog.profiles.length>=MAX_PROFILES;$('slots').textContent=`${catalog.profiles.length} / ${MAX_PROFILES} journeys · Each has its own progress, worlds, options, and unfinished trail.`;
    }catch(error){$('create').disabled=true;$('slots').textContent=error.message;notice(error.message,true);}
  }
  function review(kind,detail=null){
    let catalog;try{catalog=session.profiles();}catch(error){notice(error.message,true);return;}
    token++;pending={kind,...(['reset','restore'].includes(kind)?{archive:detail}:detail)};recovery=null;blocked=false;opener=document.activeElement;
    const active=catalog.profiles.find(item=>item.id===catalog.activeId),target=catalog.profiles.find(item=>item.id===detail?.id),name=active.name;
    const copy={
      reset:['Start a fresh game?',`Erase all progress, worlds, drafts, learned hunter habits, and options in “${name}”. You will return to the main menu with a new game. Your other journeys stay as they are. This cannot be undone without a backup.`,'Erase saves & start fresh'],
      restore:['Restore this journey backup?',`Replace the progress, worlds, drafts, and options in “${name}” with the backup${kind==='restore'?` from ${new Date(detail.createdAt).toLocaleString()}`:''}. Your other journeys stay as they are.`,'Replace data & restore'],
      create:['Begin another journey','Start with a fresh lantern and an empty journal. Your current journey stays saved, ready to return to. Give this new adventure a name.','Create & begin'],
      switch:['Open another journey?',`Return to “${target?.name}”. Saved progress in “${name}” stays here, including your latest trail checkpoint. The game will return to the main menu. Other open game tabs follow this journey. Session-only changes cannot be carried over.`,'Open journey'],
      rename:['Name your journey','Give this journey a name you will recognise at camp. Its saved progress and worlds stay the same.','Save name'],
      delete:['Remove this journey?',`Permanently erase “${target?.name}”, including its progress, worlds, drafts, and options. Download its backup from Manage first if you might return. Your current journey and other journeys stay as they are.`,'Erase this journey'],
    }[kind];
    $('heading').textContent=copy[0];$('explanation').textContent=copy[1];$('confirm').textContent=copy[2];$('confirm').classList.toggle('save-danger-button',['reset','restore','delete'].includes(kind));
    $('name-field').hidden=!['create','rename'].includes(kind);$('name').value=kind==='rename'?target.name:'';
    $('confirm').disabled=false;$('recovery').hidden=true;$('reload').hidden=true;$('error').hidden=true;$('cancel').hidden=false;
    dialog.showModal();$('cancel').focus({preventScroll:true});
    const reviewed=pending;requestAnimationFrame(()=>{if(dialog.open&&pending===reviewed&&!blocked&&!document.body.inert&&[dialog,document.body].includes(document.activeElement))$('cancel').focus({preventScroll:true});});
  }
  $('download').onclick=()=>backup();$('create').onclick=()=>review('create');
  $('start').onclick=()=>review('reset');$('restore').onclick=()=>{$('file').value='';$('file').click();};
  $('file').onchange=async()=>{const file=$('file').files[0];if(!file)return;const request=++token;try{if(file.size>MAX_SAVE_ARCHIVE_BYTES)throw Error('Choose a backup smaller than 12 MB.');const archive=parseSaveArchive(await file.text());if(request!==token||document.getElementById('settings-data').hidden||!document.getElementById('game-settings-dialog').open)return;review('restore',archive);}catch(error){if(request===token)notice(error.message,true);}};
  $('cancel').onclick=()=>{close();opener?.focus({preventScroll:true});};dialog.addEventListener('cancel',event=>{event.preventDefault();if(!blocked){close();opener?.focus({preventScroll:true});}});
  $('confirm').onclick=async()=>{
    if(!pending||$('confirm').disabled)return;const confirmed=pending;$('confirm').disabled=true;
    try{
      const reviewed=pending,request=token,action={...reviewed,...(['create','rename'].includes(reviewed.kind)?{name:profileName($('name').value)}:{})};
      const apply=()=>{if(pending!==reviewed||request!==token)return {cancelled:true};try{return ['reset','restore'].includes(action.kind)?session.replace(action.kind==='reset'?[]:action.archive.entries):session.manageProfile(action);}catch(error){return {exception:error.message};}};
      const result=await (navigator.locks?.request?navigator.locks.request('lantern-trails-save-management',apply):apply());
      if(result.cancelled)return;if(result.exception)throw Error(result.exception);
      if(result.ok){document.body.inert=true;onComplete();return;}
      recovery=result.recovery||null;blocked=!result.restored;$('error').hidden=false;$('error').textContent=result.restored?`The change could not finish. Your saved data was kept or restored. You can cancel safely. ${result.error}`:`The change could not finish, and the browser could not restore everything. ${recovery?'Download the recovery backup before reloading.':'Reload to inspect the saved journey list.'} ${pending.kind==='delete'&&recovery?'This file belongs to the journey you tried to remove. Open that journey or a new empty slot before restoring it. ':''}${result.error}`;
      $('recovery').hidden=!recovery;$('reload').hidden=!blocked;$('cancel').hidden=blocked;$('confirm').disabled=blocked;
    }catch(error){if(pending!==confirmed)return;$('error').hidden=false;$('error').textContent=`Your saved data was not changed. ${error.message}`;$('confirm').disabled=false;}
  };
  $('name').addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.isComposing){event.preventDefault();$('confirm').click();}});
  $('recovery').onclick=()=>{if(recovery)download(recovery,'lantern-trails-recovery.json');};$('reload').onclick=onComplete;
  return {open(){token++;notice('Backups contain one journey’s saved data. Download each journey separately to keep them all. Files stay on your device.');renderProfiles();},close};
}
