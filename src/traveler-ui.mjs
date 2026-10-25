import { TRAVELER_CHOICES,DEFAULT_TRAVELER,OUTFITS,drawTravelerPortrait,travelerDescription } from './traveler-art.mjs';
import { loadWardrobe,saveWardrobe,rememberLook,wearLook } from './traveler-wardrobe.mjs';

export function createTravelerUI({storage,getPreferences,onChange,onFestival}) {
  const $=id=>document.getElementById(`traveler-${id}`),fields=new Map(),presets=[];let facing='down';
  const loaded=loadWardrobe(storage),favorites=[];let slots=loaded.slots,previous=null;
  $('favorites-note').textContent=loaded.unavailable?'Saving is unavailable. You can keep looks for this visit.':loaded.damaged?'The earlier saved looks could not be read. Your current traveler and adventures are safe. Save a new look when you are ready.':'Keep three favorite looks with this journey.';
  function favoriteStatus(text){const saved=saveWardrobe(storage,slots);$('favorites-note').textContent=text+(saved?'':' Saving is unavailable; this change lasts for this visit.');renderFavorites();}
  for(let index=0;index<slots.length;index++){
    const row=document.createElement('article'),art=document.createElement('canvas'),body=document.createElement('div'),label=document.createElement('label'),input=document.createElement('input'),summary=document.createElement('p'),actions=document.createElement('div'),save=document.createElement('button'),wear=document.createElement('button');
    row.className='traveler-favorite';row.dataset.favoriteSlot=index;art.setAttribute('aria-hidden','true');label.textContent=`Look ${index+1} name`;input.id=`traveler-favorite-name-${index}`;input.maxLength=512;input.value=slots[index]?.label||`Trail look ${index+1}`;label.htmlFor=input.id;label.append(input);summary.className='controls-help';actions.className='traveler-actions';
    save.type=wear.type='button';save.dataset.favoriteSave=index;wear.dataset.favoriteWear=index;
    save.onclick=()=>{previous=slots;slots=rememberLook(slots,index,input.value,getPreferences());input.value=slots[index].label;favoriteStatus(`Saved “${slots[index].label}”.`);};
    wear.onclick=()=>{onChange(wearLook(slots,index));$('favorites-note').textContent=`Wearing “${slots[index].label}”.`;};
    actions.append(save,wear);body.append(label,summary,actions);row.append(art,body);$('favorites-list').append(row);favorites.push({art,input,summary,save,wear});
  }
  $('favorites-undo').onclick=()=>{if(!previous)return;slots=previous;previous=null;for(const [index,row]of favorites.entries())row.input.value=slots[index]?.label||`Trail look ${index+1}`;favoriteStatus('Last saved-look change undone.');};
  function renderFavorites(){for(const [index,row]of favorites.entries()){const slot=slots[index];drawTravelerPortrait(row.art,{...getPreferences(),...(slot?.look||{})});row.art.classList.toggle('is-empty',!slot);row.summary.textContent=slot?`Saved: ${slot.label} · ${travelerDescription({...getPreferences(),...slot.look}).split(' · ').slice(1).join(' · ')}`:'This place is waiting for a look.';row.save.textContent=slot?'Replace saved look':'Save current look';row.save.setAttribute('aria-label',`${row.save.textContent} in slot ${index+1}`);row.wear.textContent='Wear this look';row.wear.disabled=!slot;row.wear.setAttribute('aria-label',`Wear saved look ${index+1}${slot?`: ${slot.label}`:''}`);} $('favorites-undo').disabled=!previous;}
  const captions={coat:'Coat',scarf:'Scarf',skin:'Skin tone',hair:'Hair color',hairStyle:'Hairstyle',headwear:'Headwear',lantern:'Lantern color',campSky:'Camp backdrop',lanternAura:'Lantern glow'};
  for(const [key,options] of Object.entries(TRAVELER_CHOICES)) {
    const label=document.createElement('label'),select=document.createElement('select');label.className='control-field';label.textContent=captions[key];select.id=`traveler-${key}`;label.htmlFor=select.id;
    for(const {id,label:caption} of options){const option=document.createElement('option');option.value=id;option.textContent=caption;select.append(option);}
    select.addEventListener('change',()=>onChange({[key]:select.value}));label.append(select);$(key.startsWith('camp')||key==='lanternAura'?'atmosphere':'fields').append(label);fields.set(key,select);
  }
  for(const outfit of OUTFITS) {
    const button=document.createElement('button'),art=document.createElement('canvas'),copy=document.createElement('span'),title=document.createElement('strong'),detail=document.createElement('small');
    button.type='button';button.dataset.outfit=outfit.id;button.className='traveler-outfit';art.setAttribute('aria-hidden','true');title.textContent=outfit.name;detail.textContent=outfit.place;copy.append(title,detail);button.append(art,copy);
    button.addEventListener('click',()=>{const {id,name,place,...patch}=outfit;onChange(patch);});$('outfits').append(button);presets.push({button,art,outfit});
  }
  $('name').addEventListener('change',()=>onChange({travelerName:$('name').value}));
  $('turn').addEventListener('click',()=>{const directions=['down','left','up','right'];facing=directions[(directions.indexOf(facing)+1)%4];render();});
  $('shuffle').addEventListener('click',()=>onChange(Object.fromEntries(Object.entries(TRAVELER_CHOICES).filter(([key])=>!['campSky','lanternAura','skin'].includes(key)).map(([key,options])=>[key,options[Math.floor(Math.random()*options.length)].id]))));
  $('reset').addEventListener('click',()=>onChange({...DEFAULT_TRAVELER,travelerName:getPreferences().travelerName}));
  $('festival').addEventListener('click',onFestival);
  function render() {
    const look=getPreferences();for(const [key,select] of fields)select.value=look[key];$('name').value=look.travelerName;$('heading').textContent=`${look.travelerName}’s trail kit`;
    const description=travelerDescription(look);$('description').textContent=description;$('preview').setAttribute('aria-label',`${description}. Facing ${facing==='up'?'away':facing==='down'?'forward':facing}.`);drawTravelerPortrait($('preview'),look,{facing});
    for(const {button,art,outfit} of presets){button.setAttribute('aria-pressed',String(['coat','scarf','headwear','lantern'].every(key=>outfit[key]===look[key])));drawTravelerPortrait(art,{...look,...outfit});}
    $('turn').textContent='Turn preview';
    renderFavorites();
  }
  return {render};
}
