import test from 'node:test';
import assert from 'node:assert/strict';
import { playerName } from '../src/player-text.mjs';
import { normalizeTraveler,TRAVELER_CHOICES,DEFAULT_TRAVELER } from '../src/traveler-art.mjs';
import { normalizePreferences,loadPreferences,savePreferences,DEFAULT_PREFERENCES } from '../src/adventure-preferences.mjs';
import { WARDROBE_KEY,LOOK_FIELDS,emptyWardrobe,rememberLook,wearLook,loadWardrobe,saveWardrobe } from '../src/traveler-wardrobe.mjs';
import { profileStorage } from '../src/save-profiles.mjs';
import { serializeSaveArchive,parseSaveArchive,snapshotSaves,replaceSavedData } from '../src/save-data.mjs';
function disk(){const values=new Map();return {values,get length(){return values.size;},key:i=>[...values.keys()][i]??null,getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};}

test('name length boundaries remain canonical through repeated UI/save/reload normalization',()=>{
  const names=['abcdefghijklmnopqrstuvw xyz','a'.repeat(23)+'  z','👩🏽‍🚀'.repeat(24),'👨‍👩‍👧‍👦'.repeat(24),'e\u0301'.repeat(25),'\ud800Iris\udfff',' <Iris>\n Nova ',null,42];
  for(const raw of names){const look=normalizeTraveler({travelerName:raw});assert.equal(normalizeTraveler(look).travelerName,look.travelerName);assert.equal(look.travelerName,look.travelerName.trim());assert.ok(look.travelerName.length<=192);const storage=disk();assert.ok(savePreferences(storage,{...DEFAULT_PREFERENCES,...look}));assert.deepEqual(loadPreferences(storage),normalizePreferences({...DEFAULT_PREFERENCES,...look}));assert.ok([...storage.values.values()][0].length<1000);}
  assert.equal(playerName('e\u0301'),'é');assert.equal(playerName('👩🏽‍🚀'.repeat(24)),'👩🏽‍🚀'.repeat(24));assert.equal(playerName('abcdefghijklmnopqrstuvw xyz'),'abcdefghijklmnopqrstuvw');
});
test('all legal cosmetic combinations used by saved looks retain canonical data within the preference bound',()=>{
  for(let seed=0;seed<200;seed++){const look={...DEFAULT_PREFERENCES,travelerName:'👩🏽‍🚀'.repeat(24)};for(const [key,options]of Object.entries(TRAVELER_CHOICES))look[key]=options[(seed*7+key.length)%options.length].id;assert.deepEqual(normalizePreferences(look),look);const storage=disk();assert.ok(savePreferences(storage,look));assert.deepEqual(loadPreferences(storage),look);assert.ok([...storage.values.values()][0].length<1000);}
});
test('three independent look snapshots round-trip without changing identity, atmosphere, or source objects',()=>{
  let slots=emptyWardrobe();const original=structuredClone(slots),input={...DEFAULT_PREFERENCES,travelerName:'Nova',coat:'plum',hair:'silver',skin:'ebony',campSky:'starfall'};
  for(let i=0;i<3;i++)slots=rememberLook(slots,i,` Favorite ${i+1} `,{...input,scarf:TRAVELER_CHOICES.scarf[i].id});assert.deepEqual(original,emptyWardrobe());
  const storage=disk();assert.ok(saveWardrobe(storage,slots));assert.deepEqual(loadWardrobe(storage).slots,slots);assert.equal(loadWardrobe(storage).damaged,false);
  input.coat='fern';const patch=wearLook(slots,1),current={...DEFAULT_PREFERENCES,travelerName:'Iris',campSky:'sunrise',volume:35};assert.equal(patch.coat,'plum');assert.deepEqual(Object.keys(patch),LOOK_FIELDS);assert.deepEqual({...current,...patch},{...current,...slots[1].look});patch.coat='tide';assert.equal(slots[1].look.coat,'plum');
});
test('replacement and Undo can restore an independent previous collection without touching the current game',()=>{
  const before=rememberLook(emptyWardrobe(),0,'First',{...DEFAULT_TRAVELER,coat:'fern'}),snapshot=structuredClone(before),next=rememberLook(before,0,'Second',{...DEFAULT_TRAVELER,coat:'plum'});assert.deepEqual(before,snapshot);assert.notDeepEqual(next,before);const storage=disk();storage.setItem('tilewright.trail.checkpoint.v1','keep');assert.ok(saveWardrobe(storage,next));assert.ok(saveWardrobe(storage,before));assert.deepEqual(loadWardrobe(storage).slots,snapshot);assert.equal(storage.getItem('tilewright.trail.checkpoint.v1'),'keep');
});
test('blocked, silent, quota-limited, oversized, foreign-version, or corrupt saves fail without affecting other data',()=>{
  const slots=rememberLook(emptyWardrobe(),0,'Favorite',DEFAULT_TRAVELER);
  for(const text of ['{','null',JSON.stringify({version:2,slots}),JSON.stringify({version:1,slots:[slots[0]]}),'x'.repeat(6001),JSON.stringify({version:1,slots:[{label:'Bad',look:{...slots[0].look,coat:'foreign'}},null,null]})])assert.equal(loadWardrobe({getItem:()=>text}).damaged,true);
  assert.equal(loadWardrobe({getItem(){throw Error('blocked');}}).unavailable,true);
  for(const storage of [{setItem(){throw Error('quota');}},{setItem(){},getItem:()=>null}])assert.equal(saveWardrobe(storage,slots),false);
  for(const index of [-1,3,1.5,NaN]){assert.throws(()=>rememberLook(slots,index,'Bad',DEFAULT_TRAVELER));assert.throws(()=>wearLook(slots,index));}assert.throws(()=>wearLook(emptyWardrobe(),0));
});
test('wardrobes are journey-scoped and included in complete backup, restore, and fresh-start behavior',()=>{
  const native=disk(),first=profileStorage(native,'original'),second=profileStorage(native,'11111111-1111-4111-8111-111111111111'),a=rememberLook(emptyWardrobe(),0,'Forest',{...DEFAULT_TRAVELER,coat:'fern'}),b=rememberLook(emptyWardrobe(),1,'Night',{...DEFAULT_TRAVELER,coat:'midnight'});
  assert.ok(saveWardrobe(first,a));assert.ok(saveWardrobe(second,b));const backup=parseSaveArchive(serializeSaveArchive(snapshotSaves(native)));assert.ok(backup.entries.some(([key])=>key===WARDROBE_KEY));assert.equal(replaceSavedData(native,[]).ok,true);assert.deepEqual(loadWardrobe(first).slots,emptyWardrobe());assert.deepEqual(loadWardrobe(second).slots,b);assert.equal(replaceSavedData(native,backup.entries).ok,true);assert.deepEqual(loadWardrobe(first).slots,a);assert.deepEqual(loadWardrobe(second).slots,b);
});
