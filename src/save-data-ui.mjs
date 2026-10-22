import { serializeSaveArchive,parseSaveArchive,MAX_SAVE_ARCHIVE_BYTES } from './save-data.mjs';
export function createSaveDataUI({session,onComplete}){
  const $=id=>document.getElementById(`save-${id}`),dialog=$('dialog');let token=0,pending=null,recovery=null,blocked=false,opener=null;
  function notice(text,error=false){$('status').textContent=text;$('status').dataset.error=String(error);}
  function download(text,name){const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function close(){token++;pending=null;if(dialog.open&&!blocked)dialog.close();}
  function review(kind,archive=null){
    token++;pending={kind,archive};recovery=null;blocked=false;opener=document.activeElement;
    $('heading').textContent=kind==='reset'?'Start a fresh game?':'Restore this game backup?';
    $('explanation').textContent=kind==='reset'?'Erase all Lantern Trails progress, worlds, drafts, learned hunter habits, and options saved in this browser. You will return to the main menu with a new game. This cannot be undone without a backup.':`Replace this browser’s Lantern Trails progress, worlds, drafts, and options with the backup from ${new Date(archive.createdAt).toLocaleString()}. Your current game data will be replaced.`;
    $('confirm').textContent=kind==='reset'?'Erase saves & start fresh':'Replace data & restore';$('confirm').disabled=false;$('recovery').hidden=true;$('reload').hidden=true;$('error').hidden=true;$('cancel').hidden=false;
    dialog.showModal();$('cancel').focus({preventScroll:true});
    const reviewed=pending;requestAnimationFrame(()=>{if(dialog.open&&pending===reviewed&&!blocked&&!document.body.inert&&[dialog,document.body].includes(document.activeElement))$('cancel').focus({preventScroll:true});});
  }
  $('download').onclick=()=>{try{download(serializeSaveArchive(session.snapshot()),'lantern-trails-save.json');notice('Backup downloaded. It contains data saved in this browser; session-only changes cannot be included.');}catch(error){notice(error.message,true);}};
  $('start').onclick=()=>review('reset');$('restore').onclick=()=>{$('file').value='';$('file').click();};
  $('file').onchange=async()=>{const file=$('file').files[0];if(!file)return;const request=++token;try{if(file.size>MAX_SAVE_ARCHIVE_BYTES)throw Error('Choose a backup smaller than 12 MB.');const archive=parseSaveArchive(await file.text());if(request!==token||document.getElementById('settings-data').hidden||!document.getElementById('game-settings-dialog').open)return;review('restore',archive);}catch(error){if(request===token)notice(error.message,true);}};
  $('cancel').onclick=()=>{close();opener?.focus({preventScroll:true});};dialog.addEventListener('cancel',event=>{event.preventDefault();if(!blocked){close();opener?.focus({preventScroll:true});}});
  $('confirm').onclick=()=>{
    if(!pending||$('confirm').disabled)return;$('confirm').disabled=true;
    try{
      const result=session.replace(pending.kind==='reset'?[]:pending.archive.entries);
      if(result.ok){document.body.inert=true;onComplete();return;}
      recovery=result.recovery||null;blocked=!result.restored;$('error').hidden=false;$('error').textContent=result.restored?`The change could not finish. Your saved data was kept or restored. You can cancel safely. ${result.error}`:`The change could not finish, and the browser could not restore everything. Download the recovery backup before reloading. ${result.error}`;
      $('recovery').hidden=!recovery;$('reload').hidden=!blocked;$('cancel').hidden=blocked;
    }catch(error){$('error').hidden=false;$('error').textContent=`Your saved data was not changed. ${error.message}`;}
  };
  $('recovery').onclick=()=>{if(recovery)download(recovery,'lantern-trails-recovery.json');};$('reload').onclick=onComplete;
  return {open(){token++;notice('Backups contain saved data. Session-only changes are not included. Downloaded files stay on your device.');},close};
}
