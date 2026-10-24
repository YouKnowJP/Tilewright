import { TRAVELER_CHOICES,DEFAULT_TRAVELER,OUTFITS,drawTravelerPortrait,travelerDescription } from './traveler-art.mjs';

export function createTravelerUI({getPreferences,onChange,onFestival}) {
  const $=id=>document.getElementById(`traveler-${id}`),fields=new Map(),presets=[];let facing='down';
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
  }
  return {render};
}
