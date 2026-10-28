export const PROFILE_KEY='tilewright.profiles.v1',PROFILE_PREFIX='tilewright.profile.',DEFAULT_PROFILE_ID='original',MAX_PROFILES=3;
export const SAVE_PREFIX='tilewright.',SAVE_GENERATION_KEY='tilewright.save-generation.v1';
export const ownsPlayerKey=key=>typeof key==='string'&&key.startsWith(SAVE_PREFIX)&&key!==SAVE_GENERATION_KEY&&key!==PROFILE_KEY&&!key.startsWith(PROFILE_PREFIX);
const validId=id=>id===DEFAULT_PROFILE_ID||typeof id==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id);
export function profileName(value){
  if(typeof value!=='string')throw Error('Give this journey a name.');const name=value.normalize('NFC').trim();
  if(!name||name.length>32||/[\u0000-\u001f\u007f]/u.test(name))throw Error('Use a journey name of 1–32 characters, on one line.');return name;
}
export function readProfiles(storage){
  const raw=storage.getItem(PROFILE_KEY);if(raw===null)return {version:1,activeId:DEFAULT_PROFILE_ID,profiles:[{id:DEFAULT_PROFILE_ID,name:'First journey'}]};
  let data;try{if(raw.length>2048)throw Error('Oversized journey list');data=JSON.parse(raw);}catch{throw Error('The journey list could not be read. Existing saves have been kept.');}
  if(data?.version!==1||!Array.isArray(data.profiles)||data.profiles.length<1||data.profiles.length>MAX_PROFILES)throw Error('This journey list is not supported. Existing saves have been kept.');
  const ids=new Set(),names=new Set(),profiles=data.profiles.map(item=>{
    if(!validId(item?.id)||ids.has(item.id))throw Error('The journey list has invalid or repeated entries.');const name=profileName(item.name),folded=name.toLocaleLowerCase();
    if(names.has(folded))throw Error('The journey list has repeated names.');ids.add(item.id);names.add(folded);return {id:item.id,name};
  });
  if(!ids.has(data.activeId))throw Error('The selected journey is missing. Existing saves have been kept.');return {version:1,activeId:data.activeId,profiles};
}
export function planProfileChange(current,action){
  const next=structuredClone(current),profile=next.profiles.find(item=>item.id===action.id);let removeId=null;
  if(action.kind==='create'){
    if(next.profiles.length>=MAX_PROFILES)throw Error('All three journey slots are in use. Download a backup before removing a journey.');
    next.activeId=globalThis.crypto.randomUUID();next.profiles.push({id:next.activeId,name:profileName(action.name)});
  }else if(action.kind==='switch'){
    if(!profile)throw Error('Choose an existing journey.');if(profile.id===current.activeId)throw Error('This journey is already open.');next.activeId=profile.id;
  }else if(action.kind==='rename'){
    if(!profile)throw Error('Choose an existing journey.');profile.name=profileName(action.name);
  }else if(action.kind==='delete'){
    if(!profile)throw Error('Choose an existing journey.');if(profile.id===current.activeId)throw Error('Open a different journey before removing this one.');removeId=profile.id;next.profiles=next.profiles.filter(item=>item.id!==profile.id);
  }else throw Error('Choose a supported journey action.');
  const names=next.profiles.map(item=>item.name.toLocaleLowerCase());if(new Set(names).size!==names.length)throw Error('Another journey already has this name. Choose a different name.');
  return {next,removeId};
}
export function profileStorage(storage,id=DEFAULT_PROFILE_ID){
  if(!validId(id))throw Error('Choose a valid journey.');
  const prefix=`${PROFILE_PREFIX}${id}.`,physical=key=>{if(!ownsPlayerKey(key))throw Error('This is not a player save.');return id===DEFAULT_PROFILE_ID?key:prefix+key.slice(SAVE_PREFIX.length);};
  function keys(){const result=[];for(let i=0;i<storage.length;i++){const key=storage.key(i);if(id===DEFAULT_PROFILE_ID?ownsPlayerKey(key):typeof key==='string'&&key.startsWith(prefix)){const logical=id===DEFAULT_PROFILE_ID?key:SAVE_PREFIX+key.slice(prefix.length);if(ownsPlayerKey(logical))result.push(logical);}}return result;}
  return {getItem:key=>storage.getItem(physical(key)),setItem:(key,value)=>storage.setItem(physical(key),value),removeItem:key=>storage.removeItem(physical(key)),key:index=>keys()[index]??null,get length(){return keys().length;}};
}
