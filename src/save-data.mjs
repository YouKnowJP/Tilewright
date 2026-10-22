export const SAVE_PREFIX='tilewright.',SAVE_GENERATION_KEY='tilewright.save-generation.v1',MAX_SAVE_ARCHIVE_BYTES=12_000_000;
const owns=key=>typeof key==='string'&&key.startsWith(SAVE_PREFIX)&&key!==SAVE_GENERATION_KEY;
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
export const snapshotSaves=storage=>entriesFrom(storage);
function equal(a,b){return JSON.stringify([...a].sort())===JSON.stringify([...b].sort());}
export function replaceSavedData(storage,incoming){
  let previous,recovery,changed=false,generation=null;
  const finish=()=>{const value=`ready:${generation}`;storage.setItem(SAVE_GENERATION_KEY,value);if(storage.getItem(SAVE_GENERATION_KEY)!==value)throw Error('The browser could not finish updating this save.');};
  try{
    const target=validateEntries(incoming);serializeSaveArchive(target);previous=entriesFrom(storage);recovery=serializeSaveArchive(previous);
    generation=globalThis.crypto.randomUUID();storage.setItem(SAVE_GENERATION_KEY,`changing:${generation}`);
    if(storage.getItem(SAVE_GENERATION_KEY)!==`changing:${generation}`)throw Error('Browser saving is unavailable. Nothing was erased.');
    changed=true;
    for(const [key]of entriesFrom(storage))storage.removeItem(key);
    for(const [key,value]of target)storage.setItem(key,value);
    if(!equal(entriesFrom(storage),target))throw Error('The browser did not save all of the requested changes.');
    finish();return {ok:true};
  }catch(error){
    if(!changed){if(generation)try{finish();}catch{ /* No player data was erased. */ }return {ok:false,restored:true,error:error.message};}
    let restored=false;
    try{for(const [key]of entriesFrom(storage))storage.removeItem(key);for(const [key,value]of previous)storage.setItem(key,value);restored=equal(entriesFrom(storage),previous);}catch{restored=false;}
    try{finish();}catch{restored=false;}return {ok:false,restored,error:error.message,recovery};
  }
}
// An old open tab may not write its stale in-memory progress after a reset or
// restore. The generation is coordination metadata, never player save content.
export function createSaveSession(nativeStorage,onInvalidate=()=>{}){
  let generation=null,locked=false,notified=null;try{generation=nativeStorage.getItem(SAVE_GENERATION_KEY);}catch{ /* Existing storage fallbacks still apply. */ }
  function invalidate(pending){locked=true;if(notified!==pending){notified=pending;onInvalidate(pending);}}
  function check(){const current=nativeStorage.getItem(SAVE_GENERATION_KEY),pending=Boolean(current?.startsWith('changing:'));if(locked||pending||current!==generation){invalidate(pending);throw Error('This game save changed. Reload before continuing.');}}
  return {
    storage:{getItem(key){check();return nativeStorage.getItem(key);},setItem(key,value){check();nativeStorage.setItem(key,value);},removeItem(key){check();nativeStorage.removeItem(key);}},
    snapshot(){check();return snapshotSaves(nativeStorage);},
    recoverInterrupted(){const current=nativeStorage.getItem(SAVE_GENERATION_KEY);if(current?.startsWith('changing:')){const ready=`ready:${globalThis.crypto.randomUUID()}`;nativeStorage.setItem(SAVE_GENERATION_KEY,ready);if(nativeStorage.getItem(SAVE_GENERATION_KEY)!==ready)throw Error('Browser saving is unavailable. Try again when it is available.');}locked=true;},
    replace(entries){check();const result=replaceSavedData(nativeStorage,entries);try{generation=nativeStorage.getItem(SAVE_GENERATION_KEY);}catch{ /* Preserve the caller's failure details. */ }if(result.ok||!result.restored)locked=true;return result;},
    storageChanged(event){if(event.key!==SAVE_GENERATION_KEY)return;try{check();}catch{ /* check already invalidated a stale session. */ }},
  };
}
