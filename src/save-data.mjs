import { SAVE_PREFIX,SAVE_GENERATION_KEY,PROFILE_KEY,DEFAULT_PROFILE_ID,ownsPlayerKey as owns,profileStorage,readProfiles,planProfileChange } from './save-profiles.mjs';
export { SAVE_PREFIX,SAVE_GENERATION_KEY };
export const MAX_SAVE_ARCHIVE_BYTES=12_000_000;
const bytes=text=>new TextEncoder().encode(text).length;
function entriesFrom(storage){
  const keys=[];for(let i=0;i<storage.length;i++){const key=storage.key(i);if(owns(key))keys.push(key);}
  if(keys.length>256)throw Error('Too many saved files. Export individual worlds before changing this save.');
  return keys.sort().map(key=>{const value=storage.getItem(key);if(typeof value!=='string')throw Error('Saved data changed while it was being read. Try again.');return [key,value];});
}
function validateEntries(entries){
  if(!Array.isArray(entries)||entries.length>256)throw Error('This backup has invalid saved data.');const seen=new Set();
  for(const item of entries){if(!Array.isArray(item)||item.length!==2||typeof item[0]!=='string'||!owns(item[0])||item[0].length>160||typeof item[1]!=='string'||seen.has(item[0]))throw Error('This backup contains invalid or repeated save names.');seen.add(item[0]);}
  return entries.map(item=>[...item]).sort(([a],[b])=>a.localeCompare(b));
}
export function serializeSaveArchive(entries,createdAt=new Date().toISOString()){
  const text=JSON.stringify({format:'lantern-trails-save',version:1,createdAt,entries:validateEntries(entries)});
  if(bytes(text)>MAX_SAVE_ARCHIVE_BYTES)throw Error('This backup exceeds 12 MB. Export individual worlds before starting fresh.');return text;
}
export function parseSaveArchive(text){
  if(typeof text!=='string'||bytes(text)>MAX_SAVE_ARCHIVE_BYTES)throw Error('Choose a Lantern Trails save backup smaller than 12 MB.');let data;try{data=JSON.parse(text);}catch{throw Error('This save backup could not be read.');}
  if(data?.format!=='lantern-trails-save'||data.version!==1||typeof data.createdAt!=='string'||data.createdAt.length>40||!Number.isFinite(Date.parse(data.createdAt)))throw Error('Choose a supported Lantern Trails save backup.');
  return {createdAt:data.createdAt,entries:validateEntries(data.entries)};
}
export const snapshotSaves=(storage,id=DEFAULT_PROFILE_ID)=>entriesFrom(profileStorage(storage,id));
function equal(a,b){return JSON.stringify([...a].sort())===JSON.stringify([...b].sort());}
export function replaceSavedData(storage,incoming,id=DEFAULT_PROFILE_ID){
  const saves=profileStorage(storage,id);
  let previous,recovery,changed=false,generation=null;
  const finish=()=>{const value=`ready:${generation}`;storage.setItem(SAVE_GENERATION_KEY,value);if(storage.getItem(SAVE_GENERATION_KEY)!==value)throw Error('The browser could not finish updating this save.');};
  try{
    const target=validateEntries(incoming);serializeSaveArchive(target);previous=entriesFrom(saves);recovery=serializeSaveArchive(previous);
    generation=globalThis.crypto.randomUUID();storage.setItem(SAVE_GENERATION_KEY,`changing:${generation}`);
    if(storage.getItem(SAVE_GENERATION_KEY)!==`changing:${generation}`)throw Error('Browser saving is unavailable. Nothing was erased.');
    changed=true;
    for(const [key]of entriesFrom(saves))saves.removeItem(key);
    for(const [key,value]of target)saves.setItem(key,value);
    if(!equal(entriesFrom(saves),target))throw Error('The browser did not save all of the requested changes.');
    finish();return {ok:true};
  }catch(error){
    if(!changed){if(generation)try{finish();}catch{ /* No player data was erased. */ }return {ok:false,restored:true,error:error.message};}
    let restored=false;
    try{for(const [key]of entriesFrom(saves))saves.removeItem(key);for(const [key,value]of previous)saves.setItem(key,value);restored=equal(entriesFrom(saves),previous);}catch{restored=false;}
    try{finish();}catch{restored=false;}return {ok:false,restored,error:error.message,recovery};
  }
}
// Profile metadata changes are coordinated with the same generation as resets.
// Saved files stay in their own namespaces; switching never copies or rewrites them.
function changeProfile(storage,current,action){
  let previousRaw,deleted=[],saves,recovery,changed=false,generation=null;
  const finish=()=>{const value=`ready:${generation}`;storage.setItem(SAVE_GENERATION_KEY,value);if(storage.getItem(SAVE_GENERATION_KEY)!==value)throw Error('The browser could not finish updating this journey.');};
  try{
    const {next,removeId}=planProfileChange(current,action),text=JSON.stringify(next);previousRaw=storage.getItem(PROFILE_KEY);
    if(removeId){saves=profileStorage(storage,removeId);deleted=entriesFrom(saves);recovery=serializeSaveArchive(deleted);}
    generation=globalThis.crypto.randomUUID();storage.setItem(SAVE_GENERATION_KEY,`changing:${generation}`);
    if(storage.getItem(SAVE_GENERATION_KEY)!==`changing:${generation}`)throw Error('Browser saving is unavailable. Nothing was changed.');
    changed=true;storage.setItem(PROFILE_KEY,text);if(storage.getItem(PROFILE_KEY)!==text)throw Error('The browser could not save the journey list.');
    if(saves){for(const [key]of deleted)saves.removeItem(key);if(entriesFrom(saves).length)throw Error('The browser could not remove every saved file.');}
    finish();return {ok:true};
  }catch(error){
    if(!changed){if(generation)try{finish();}catch{ /* No player data changed. */ }return {ok:false,restored:true,error:error.message};}
    let restored=false;
    try{
      if(previousRaw===null)storage.removeItem(PROFILE_KEY);else storage.setItem(PROFILE_KEY,previousRaw);
      if(saves){for(const [key,value]of deleted)saves.setItem(key,value);}
      restored=storage.getItem(PROFILE_KEY)===previousRaw&&(!saves||equal(entriesFrom(saves),deleted));
    }catch{restored=false;}try{finish();}catch{restored=false;}
    return {ok:false,restored,error:error.message,recovery};
  }
}
// Old tabs cannot write stale in-memory progress into a different journey.
export function createSaveSession(nativeStorage,onInvalidate=()=>{}){
  let generation=null,locked=false,notified=null,catalog=null,catalogRaw=null,initialError=null;
  try{generation=nativeStorage.getItem(SAVE_GENERATION_KEY);catalog=readProfiles(nativeStorage);catalogRaw=nativeStorage.getItem(PROFILE_KEY);}catch(error){initialError=error;}
  const saves=profileStorage(nativeStorage,catalog?.activeId||DEFAULT_PROFILE_ID);
  function invalidate(pending){locked=true;if(notified!==pending){notified=pending;onInvalidate(pending);}}
  function check(){
    const current=nativeStorage.getItem(SAVE_GENERATION_KEY),pending=Boolean(current?.startsWith('changing:'));
    if(locked||pending||current!==generation){invalidate(pending);throw Error('This game save changed. Reload before continuing.');}
    if(initialError)throw initialError;
    if(nativeStorage.getItem(PROFILE_KEY)!==catalogRaw){invalidate(false);throw Error('This journey changed. Reload before continuing.');}
  }
  function complete(operation){check();const result=operation();try{generation=nativeStorage.getItem(SAVE_GENERATION_KEY);}catch{ /* Keep the operation's error. */ }if(result.ok||!result.restored)locked=true;return result;}
  return {
    storage:{getItem(key){check();return saves.getItem(key);},setItem(key,value){check();saves.setItem(key,value);},removeItem(key){check();saves.removeItem(key);}},
    profiles(){check();return structuredClone(catalog);},
    snapshot(id=catalog?.activeId){check();if(!catalog.profiles.some(item=>item.id===id))throw Error('Choose an existing journey.');return snapshotSaves(nativeStorage,id);},
    manageProfile(action){return complete(()=>changeProfile(nativeStorage,catalog,action));},
    recoverInterrupted(){const current=nativeStorage.getItem(SAVE_GENERATION_KEY);if(current?.startsWith('changing:')){const ready=`ready:${globalThis.crypto.randomUUID()}`;nativeStorage.setItem(SAVE_GENERATION_KEY,ready);if(nativeStorage.getItem(SAVE_GENERATION_KEY)!==ready)throw Error('Browser saving is unavailable. Try again when it is available.');}locked=true;},
    replace(entries){return complete(()=>replaceSavedData(nativeStorage,entries,catalog.activeId));},
    storageChanged(event){if(event.key!==SAVE_GENERATION_KEY&&event.key!==PROFILE_KEY&&event.key!==null)return;try{check();}catch{ /* check already invalidated a stale session. */ }},
  };
}
