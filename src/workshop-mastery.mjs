import { LAB_ROOMS, puzzleLabWorld } from './workshop-lab.mjs';
import { adventureKey } from './workshop-model.mjs';

export const MASTERY_KEY='tilewright.lab.mastery.v1',MAX_MASTERY_BYTES=12000;
export const MASTERY_REWARDS=Object.freeze([
  {at:6,name:'Copper spark',story:'Six little experiments. One new way to see a road.'},
  {at:18,name:'Glass compass',story:'You can find a different answer on familiar ground.'},
  {at:36,name:'Doublelight prism',story:'Every solution casts another possibility.'},
  {at:72,name:'The tinkerer’s sky',story:'Twelve rooms, two roads through each, and a sky full of your ideas.'},
]);
const ids=new Set(LAB_ROOMS.map(room=>room.id)),seals=['light','clean','signature'];
export const freshMastery=()=>({version:1,records:{}});
export function normalizeMastery(input){
  if(input?.version!==1||!input.records||typeof input.records!=='object'||Array.isArray(input.records)||Object.keys(input.records).length>LAB_ROOMS.length*2)throw Error('Choose a supported Puzzle Lab seal journal.');
  const records={};
  for(const [key,value]of Object.entries(input.records)){
    const match=/^([a-z]+)-(trail|nemesis)$/.exec(key);
    if(!match||!ids.has(match[1])||!Array.isArray(value)||!value.length||value.length>3||new Set(value).size!==value.length||value.some(id=>!seals.includes(id))||!value.includes('light'))throw Error('The seal journal contains an unknown room or invalid seals.');
    records[key]=seals.filter(id=>value.includes(id));
  }
  return {version:1,records};
}
export function masteryCount(state){return Object.values(state.records).reduce((sum,items)=>sum+items.length,0);}
const signatures={
  counterweight: ['A swift crossing','Finish within 26 turns.',run=>run.turns<=26],
  brassloop: ['The quick detour','Finish within 34 turns.',run=>run.turns<=34],
  bellgarden: ['An evening song','Finish within 52 turns.',run=>run.turns<=52],
  footstep: ['A lasting answer','Leave the crate on its plate.',run=>run.stage.plates.every(p=>run.crates.some(c=>c.x===p.x&&c.y===p.y))],
  tidekeeper: ['My own crossing','Choose Vale’s supplies and turn the ferry lever yourself.',run=>run.choices.postkeeper==='shield'&&run.switches.ferry===true],
  emberclock: ['Clockwork feet','Finish within 44 turns.',run=>run.turns<=44],
  locksmith: ['Nothing left behind','Bring home all three optional treasures.',run=>run.collectedCoins.length===3],
  foundry: ['A road for tomorrow','Finish without casting a double; leave the crate on its plate.',run=>run.guild.uses===0&&run.stage.plates.every(p=>run.crates.some(c=>c.x===p.x&&c.y===p.y))],
  glassferry: ['Two lost pearls','Bring home both optional pearls.',run=>run.collectedCoins.length===2],
  floodsong: ['The whole circuit','Recover all three optional tokens.',run=>run.collectedCoins.length===3],
  nightshift: ['The silver hour','Recover both optional treasures.',run=>run.collectedCoins.length===2],
  caravan: ['Every last passenger','Bring home the parcel, both travelers, and all three treasures.',run=>run.cargoDelivered&&run.rescued.length===2&&run.collectedCoins.length===3],
};
export function masteryGoals(id,run=null){
  if(!ids.has(id))throw Error('Choose a known Puzzle Lab room.');
  const [name,detail,condition]=signatures[id],won=run?.status==='won';
  return [
    {id:'light',name:'First light',detail:'Restore this room and reach its beacon.',done:Boolean(won)},
    {id:'clean',name:'Unbroken light',detail:'Finish without taking damage.',done:Boolean(won&&run.damage===0),missed:Boolean(run&&run.damage>0)},
    {id:'signature',name,detail,done:Boolean(won&&condition(run)),missed:Boolean(run&&(['counterweight','brassloop','bellgarden','emberclock'].includes(id)&&run.turns>({counterweight:26,brassloop:34,bellgarden:52,emberclock:44}[id])||id==='foundry'&&run.guild.uses>0||id==='tidekeeper'&&run.choices.postkeeper==='route'))},
  ];
}
// Only a run launched from an untouched Lab original receives seal metadata.
// Portable worlds and remixes retain their own bests, without granting Lab seals.
export function recordMastery(input,run){
  const state=normalizeMastery(input),id=run.stage.workshop?.lab;
  if(!ids.has(id)||run.status!=='won'||!['trail','nemesis'].includes(run.difficulty)||run.stage.workshop.practice||run.stage.workshop.storybook||run.stage.workshop.trailhouse||run.stage.workshop.key!==adventureKey(puzzleLabWorld(id)))throw Error('Finish an original Puzzle Lab room to earn seals.');
  const key=`${id}-${run.difficulty}`,old=state.records[key]||[],earned=masteryGoals(id,run).filter(goal=>goal.done&&!old.includes(goal.id)).map(goal=>goal.id);
  const next={version:1,records:{...state.records,[key]:seals.filter(id=>old.includes(id)||earned.includes(id))}};
  return {state:next,earned,rewards:MASTERY_REWARDS.filter(item=>masteryCount(state)<item.at&&masteryCount(next)>=item.at)};
}
export function serializeMastery(state){return JSON.stringify({format:'lantern-lab-seals',...normalizeMastery(state)})+'\n';}
export function parseMastery(text){
  if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_MASTERY_BYTES)throw Error('Choose a seal journal smaller than 12 KB.');
  let data;try{data=JSON.parse(text);}catch{throw Error('This seal journal is not valid JSON.');}
  if(data?.format!=='lantern-lab-seals')throw Error('Choose a Puzzle Lab seal journal file.');
  return normalizeMastery(data);
}
export function loadMastery(storage){try{const text=storage.getItem(MASTERY_KEY);return {state:text?parseMastery(text):freshMastery(),failed:false};}catch{return {state:freshMastery(),failed:true};}}
export function saveMastery(storage,state){try{storage.setItem(MASTERY_KEY,serializeMastery(state));return true;}catch{return false;}}
