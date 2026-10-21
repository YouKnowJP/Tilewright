import { COMMISSIONS, PROJECTS, commissionWorld, festivalWorld } from './trailhouse-content.mjs';
import { adventureKey, adventureStage } from './workshop-model.mjs';
import { resultFor, turnTarget } from './adventure.mjs';

export const TRAILHOUSE_KEY='tilewright.trailhouse.v1',MAX_PASSPORT_BYTES=30_000;
export const freshTrailhouse=()=>({version:1,completed:[],built:[],bests:{}});
const jobIds=new Set(COMMISSIONS.map(job=>job.id)),projectIds=new Set(PROJECTS.map(project=>project.id));
const validBest=value=>value&&Number.isInteger(value.stars)&&value.stars>=1&&value.stars<=3&&Number.isInteger(value.turns)&&value.turns>=1&&value.turns<=1_000_000&&Number.isInteger(value.score)&&value.score>=0&&value.score<=1_000_000_000;
export const earnedGlow=state=>state.completed.length*3;
export const spentGlow=state=>PROJECTS.filter(project=>state.built.includes(project.id)).reduce((sum,project)=>sum+project.cost,0);
export const availableGlow=state=>earnedGlow(state)-spentGlow(state);
export const festivalReady=state=>PROJECTS.every(project=>state.built.includes(project.id));
export function normalizeTrailhouse(input) {
  if(input?.version!==1||!Array.isArray(input.completed)||input.completed.length>12||!Array.isArray(input.built)||input.built.length>6||!input.bests||typeof input.bests!=='object'||Array.isArray(input.bests))throw Error('This Trailhouse passport is damaged or uses another version.');
  if(new Set(input.completed).size!==input.completed.length||input.completed.some(id=>!jobIds.has(id))||new Set(input.built).size!==input.built.length||input.built.some(id=>!projectIds.has(id)))throw Error('The passport contains unknown or repeated commissions or buildings.');
  const bests={};for(const [key,value]of Object.entries(input.bests)){
    const difficulty=key.endsWith('-nemesis')?'nemesis':key.endsWith('-trail')?'trail':null,id=difficulty?key.slice(0,-difficulty.length-1):'';
    if(!difficulty||!jobIds.has(id)&&id!=='festival'||!validBest(value))throw Error('The passport contains an invalid result.');
    bests[key]={stars:value.stars,turns:value.turns,score:value.score};
  }
  const state={version:1,completed:[...input.completed],built:[...input.built],bests};
  if(state.completed.some(id=>!bests[`${id}-trail`]&&!bests[`${id}-nemesis`])||Object.keys(bests).some(key=>key.startsWith('festival-')?!festivalReady(state):!state.completed.includes(key.replace(/-(trail|nemesis)$/,'')))||availableGlow(state)<0)throw Error('The passport’s earned light does not match its commissions and buildings.');
  return state;
}
export function buildProject(input,id) {
  const state=normalizeTrailhouse(input),project=PROJECTS.find(item=>item.id===id);if(!project)throw Error('Choose a village project.');if(state.built.includes(id))throw Error('This place is already restored.');
  if(availableGlow(state)<project.cost)throw Error(`This project needs ${project.cost} light. Complete another commission to earn more.`);
  return {...state,built:[...state.built,id]};
}
export function commissionGoals(id,run) {
  const allCoins=run.collectedCoins.length===run.stage.coins.length,clean=run.damage===0,power=run.guild?.uses||0;
  const crateOnPlate=channel=>run.stage.plates.filter(plate=>!channel||plate.channel===channel).every(plate=>run.crates.some(crate=>crate.x===plate.x&&crate.y===plate.y));
  const goals={
    'own-crossing':[['Take Nessa’s shield',run.choices.nessa==='shield'],['Turn the post wheel',run.switches['post-wheel']===true]],
    'every-stamp':[['Recover both treasures',allCoins],['Take no damage',clean]],
    'water-circuit':[['Speak to Moss',run.talkedTo.includes('moss')],['Recover both treasures',allCoins],['Take no damage',clean]],
    'silver-seeds':[['Recover all four seeds',allCoins],['Take no damage',clean],[`Finish within ${turnTarget(run)} turns`,run.turns<=turnTarget(run)]],
    'rain-reunion':[['Speak to Ori',run.talkedTo.includes('ori')],['Rescue Nessa and Moss',run.rescued.length===2],['Deliver the rainseed',run.cargoDelivered],['Take no damage',clean]],
    'shore-shells':[['Recover both coastal treasures',allCoins],['Take no damage',clean]],
    'lasting-memory':[['Use no specialist powers',power===0],['Leave the crate on the memory plate',crateOnPlate()]],
    'borrowed-step':[['Cast a double',power>0],['Recover both treasures',allCoins],['Take no damage',clean]],
    'present-tense':[['Make six waystone journeys',(run.guild?.warps||0)>=6],['Recover both treasures',allCoins],['Deliver the clock heart',run.cargoDelivered],['Take no damage',clean]],
    'quiet-company':[['Rescue Ilex',run.rescued.includes('ilex')],['Use no specialist powers',power===0],['Take no damage',clean]],
    'paper-stars':[['Recover both guarded treasures',allCoins],['Take no damage',clean]],
    'shared-sky':[['Leave crates on both plates',crateOnPlate()],['Recover all three treasures',allCoins],['Rescue Eid',run.rescued.includes('eid')],['Use no specialist powers',power===0],['Take no damage',clean]],
  }[id];if(!goals)throw Error('Choose a keeper commission.');return goals.map(([label,done])=>({label,done}));
}
export function trailhouseStage(state,id) {
  const festival=id==='festival';if(festival&&!festivalReady(state))throw Error('Restore all six village places to open the lantern festival.');
  const world=festival?festivalWorld():commissionWorld(id),stage=adventureStage(world);
  return {...stage,workshop:{...stage.workshop,trailhouse:{id,festival}}};
}
export function finishCommission(input,run) {
  const state=normalizeTrailhouse(input),meta=run.stage.workshop?.trailhouse,id=meta?.id,festival=id==='festival';
  if(run.status!=='won'||!['trail','nemesis'].includes(run.difficulty)||!meta||meta.festival!==festival||run.stage.workshop.practice||run.stage.workshop.storybook||festival&&!festivalReady(state)||!festival&&!jobIds.has(id)||run.stage.workshop.key!==adventureKey(festival?festivalWorld():commissionWorld(id)))throw Error('Finish an original Trailhouse commission before recording its result.');
  const goals=festival?[]:commissionGoals(id,run),met=goals.every(goal=>goal.done);if(!met)return {state,reward:0,met:false,goals};
  const result=resultFor(run),key=`${id}-${run.difficulty}`,old=state.bests[key],improved=!old||result.stars>old.stars||result.stars===old.stars&&(result.score>old.score||result.score===old.score&&result.turns<old.turns);
  const reward=!festival&&!state.completed.includes(id)?3:0,next={...state,completed:reward?[...state.completed,id]:state.completed,bests:{...state.bests,[key]:improved?result:old}};
  return {state:next,reward,met:true,goals};
}
export function serializePassport(state) {const text=JSON.stringify({format:'lantern-trailhouse',...normalizeTrailhouse(state)})+'\n';if(new TextEncoder().encode(text).length>MAX_PASSPORT_BYTES)throw Error('This passport exceeds 30 KB.');return text;}
export function parsePassport(text) {if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_PASSPORT_BYTES)throw Error('Choose a Trailhouse passport smaller than 30 KB.');let data;try{data=JSON.parse(text);}catch{throw Error('The passport file is not valid JSON.');}if(data?.format!=='lantern-trailhouse')throw Error('Choose a Trailhouse passport file.');return normalizeTrailhouse(data);}
export function loadTrailhouse(storage) {try{const text=storage.getItem(TRAILHOUSE_KEY);return {state:text?parsePassport(text):freshTrailhouse(),failed:false};}catch{return {state:freshTrailhouse(),failed:true};}}
export function saveTrailhouse(storage,state) {try{storage.setItem(TRAILHOUSE_KEY,serializePassport(state));return true;}catch{return false;}}
