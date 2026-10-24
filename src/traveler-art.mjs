// Cosmetic choices stay outside adventure rules and replay fingerprints.
const colors = entries => Object.freeze(entries.map(([id,label,color,light]) => Object.freeze({id,label,color,light:light||color})));
export const TRAVELER_CHOICES = Object.freeze({
  coat:colors([['ember','Ember','#a75c49','#d48b63'],['fern','Fern','#366851','#79a66b'],['tide','Tide','#38667c','#7bb8c0'],['plum','Plum','#715072','#bd8cb1'],['sunflower','Sunflower','#9b743b','#e6bf66'],['midnight','Midnight','#363f63','#7e8bb0']]),
  scarf:colors([['honey','Honey','#f1d18a'],['rose','Rose','#eea6a6'],['mint','Mint','#a6dfc3'],['sky','Sky','#a6d9ed'],['lilac','Lilac','#d6bcf1'],['cream','Cream','#fff0d3']]),
  skin:colors([['porcelain','Porcelain','#f3d9c4'],['sand','Sand','#eac39b'],['golden','Golden','#d7a475'],['copper','Copper','#b9805b'],['umber','Umber','#8c5b44'],['ebony','Ebony','#5c3f36']]),
  hair:colors([['chestnut','Chestnut','#754a37'],['black','Black','#292e35'],['gold','Golden','#d5ad61'],['silver','Silver','#d3d8d8'],['copper','Copper','#a65c38'],['violet','Violet','#786199']]),
  hairStyle:Object.freeze([{id:'crop',label:'Short crop'},{id:'waves',label:'Waves'},{id:'braid',label:'Side braid'}]),
  headwear:Object.freeze([{id:'cap',label:'Trail cap'},{id:'hood',label:'Traveler hood'},{id:'flower',label:'Flower crown'},{id:'none',label:'No headwear'}]),
  lantern:colors([['gold','Golden light','#ffe19a'],['mint','Mint light','#bdf5d5'],['rose','Rose light','#ffd0db'],['sky','Starlight','#c7e7ff']]),
  campSky:Object.freeze([{id:'forest',label:'Forest dusk'},{id:'sunrise',label:'Rose dawn'},{id:'starfall',label:'Starfall camp'}]),
  lanternAura:Object.freeze([{id:'soft',label:'Soft lantern halo'},{id:'off',label:'Lantern only · no halo'}]),
});
export const DEFAULT_TRAVELER = Object.freeze({travelerName:'Rowan',coat:'ember',scarf:'honey',skin:'sand',hair:'chestnut',hairStyle:'crop',headwear:'cap',lantern:'gold',campSky:'forest',lanternAura:'soft'});
export const OUTFITS = Object.freeze([
  {id:'wanderer',name:'Woodland wanderer',place:'A familiar road',coat:'ember',scarf:'honey',headwear:'cap',lantern:'gold'},
  {id:'gardener',name:'Garden keeper',place:'Petals after rain',coat:'fern',scarf:'cream',headwear:'flower',lantern:'mint'},
  {id:'sailor',name:'Tideglass voyager',place:'Salt on the breeze',coat:'tide',scarf:'rose',headwear:'cap',lantern:'sky'},
  {id:'stargazer',name:'Borrowed starlight',place:'A sky full of stories',coat:'plum',scarf:'lilac',headwear:'hood',lantern:'sky'},
  {id:'courier',name:'Sunset courier',place:'One more letter home',coat:'sunflower',scarf:'rose',headwear:'none',lantern:'rose'},
  {id:'mechanist',name:'Midnight mechanist',place:'The garden wakes',coat:'midnight',scarf:'mint',headwear:'hood',lantern:'gold'},
].map(Object.freeze));
export function normalizeTraveler(value) {
  const raw=typeof value?.travelerName==='string'?value.travelerName:'';
  const travelerName=[...raw.replace(/[\u0000-\u001f\u007f-\u009f<>]/g,'').replace(/\s+/g,' ').trim()].slice(0,24).join('')||DEFAULT_TRAVELER.travelerName;
  return {travelerName,...Object.fromEntries(Object.entries(TRAVELER_CHOICES).map(([key,options])=>[key,options.some(option=>option.id===value?.[key])?value[key]:DEFAULT_TRAVELER[key]]))};
}
export function travelerDescription(value) {
  const look=normalizeTraveler(value),label=key=>TRAVELER_CHOICES[key].find(item=>item.id===look[key]).label;
  return `${look.travelerName} · ${label('coat')} coat · ${label('scarf')} scarf · ${label('headwear')} · ${label('lantern')}`;
}
export function drawTraveler(ctx,x,y,value,{facing='down',carrying=false}={}) {
  const look=normalizeTraveler(value),color=key=>TRAVELER_CHOICES[key].find(item=>item.id===look[key]),coat=color('coat'),scarf=color('scarf').color,skin=color('skin').color,hair=color('hair').color,lamp=color('lantern').color;
  const rect=(fill,a,b,w,h)=>{ctx.fillStyle=fill;ctx.fillRect(x+a,y+b,w,h);};
  ctx.save();
  if(look.lanternAura==='soft'&&value?.contrast!=='high'){ctx.fillStyle=lamp+'22';ctx.beginPath();ctx.arc(x+19,y+17,11,0,Math.PI*2);ctx.fill();}
  rect('#344138',7,18,4,5);rect('#344138',14,18,4,5);
  rect(coat.color,5,11,14,10);rect(coat.light,7,12,10,7);
  rect(hair,6,4,13,10);rect(skin,8,7,9,7);rect(hair,7,3,11,5);
  if(look.hairStyle==='waves'){rect(hair,5,6,3,8);rect(hair,17,7,3,7);rect(hair,7,2,4,3);}
  if(look.hairStyle==='braid'){rect(hair,6,10,3,9);rect(scarf,6,17,3,2);}
  if(facing==='up')rect(hair,8,7,9,7);
  else {rect('#192f32',facing==='left'?8:10,10,2,2);rect('#192f32',facing==='right'?16:14,10,2,2);}
  rect(scarf,7,13,11,2);rect(scarf,15,15,3,5);
  if(look.headwear==='cap'){rect(coat.color,6,2,12,4);rect(coat.light,4,6,17,2);rect(scarf,9,4,7,1);}
  if(look.headwear==='hood'){rect(coat.color,5,3,3,11);rect(coat.color,17,3,3,11);rect(coat.light,7,1,11,4);}
  if(look.headwear==='flower'){rect('#487657',5,5,15,2);for(const a of [6,11,16]){rect(scarf,a,3,3,3);rect('#fff0b2',a+1,4,1,1);}}
  if(carrying){rect('#8eb6c6',0,10,5,10);rect('#fff0ca',1,12,3,4);}
  rect('#69503b',18,14,4,7);rect(lamp,19,15,2,4);
  ctx.restore();
}
export function drawTravelerPortrait(canvas,value,{facing='down'}={}) {
  const look=normalizeTraveler(value),ctx=canvas.getContext('2d'),sky={forest:['#102e30','#63825a'],sunrise:['#65485d','#bb8564'],starfall:['#1e264c','#616692']}[look.campSky];
  canvas.width=160;canvas.height=160;ctx.imageSmoothingEnabled=false;
  ctx.fillStyle=sky[0];ctx.fillRect(0,0,160,160);
  ctx.fillStyle='#f5dca1';for(let i=0;i<16;i++)ctx.fillRect((i*47+9)%160,(i*29+7)%95,2,2);
  ctx.fillStyle=sky[1];ctx.fillRect(0,115,160,45);ctx.fillStyle='#152f2c';ctx.fillRect(24,133,112,8);
  ctx.save();ctx.translate(32,37);ctx.scale(4,4);drawTraveler(ctx,0,0,value,{facing});ctx.restore();
}
