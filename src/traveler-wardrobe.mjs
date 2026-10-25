import { TRAVELER_CHOICES,normalizeTraveler } from './traveler-art.mjs';
import { playerName } from './player-text.mjs';

export const WARDROBE_KEY='tilewright.wardrobe.v1',WARDROBE_SIZE=3;
export const LOOK_FIELDS=Object.freeze(['coat','scarf','skin','hair','hairStyle','headwear','lantern']);
export const emptyWardrobe=()=>Array(WARDROBE_SIZE).fill(null);
function checkedSlots(value) {
  if(!Array.isArray(value)||value.length!==WARDROBE_SIZE)throw Error('Choose a valid saved-look collection.');
  return Array.from(value,(slot,index)=>{
    if(slot===null)return null;
    if(!slot||typeof slot.label!=='string'||!slot.look||LOOK_FIELDS.some(key=>!TRAVELER_CHOICES[key].some(option=>option.id===slot.look[key])))throw Error('A saved look could not be read.');
    return {label:playerName(slot.label,`Trail look ${index+1}`,{units:96}),look:Object.fromEntries(LOOK_FIELDS.map(key=>[key,slot.look[key]]))};
  });
}
function slotNumber(index){if(!Number.isInteger(index)||index<0||index>=WARDROBE_SIZE)throw Error('Choose one of your three saved looks.');}
export function rememberLook(slots,index,label,preferences) {
  slotNumber(index);const next=checkedSlots(slots),look=normalizeTraveler(preferences);
  next[index]={label:playerName(label,`Trail look ${index+1}`,{units:96}),look:Object.fromEntries(LOOK_FIELDS.map(key=>[key,look[key]]))};return next;
}
export function wearLook(slots,index) {
  slotNumber(index);const slot=checkedSlots(slots)[index];if(!slot)throw Error('Save a look here first.');return {...slot.look};
}
export function loadWardrobe(storage) {
  let text;try{text=storage.getItem(WARDROBE_KEY);}catch{return {slots:emptyWardrobe(),unavailable:true,damaged:false};}
  if(!text)return {slots:emptyWardrobe(),unavailable:false,damaged:false};
  try{if(text.length>6000)throw Error('Saved looks are too large.');const data=JSON.parse(text);if(data?.version!==1)throw Error('Unsupported saved looks.');return {slots:checkedSlots(data.slots),unavailable:false,damaged:false};}
  catch{return {slots:emptyWardrobe(),unavailable:false,damaged:true};}
}
export function saveWardrobe(storage,slots) {
  try{const text=JSON.stringify({version:1,slots:checkedSlots(slots)});storage.setItem(WARDROBE_KEY,text);return storage.getItem(WARDROBE_KEY)===text;}catch{return false;}
}
