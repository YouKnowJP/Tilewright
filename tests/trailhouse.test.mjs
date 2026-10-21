import test from 'node:test';
import assert from 'node:assert/strict';
import { COMMISSIONS, PROJECTS, festivalWorld, FESTIVAL_CLEAR } from '../src/trailhouse-content.mjs';
import { freshTrailhouse, normalizeTrailhouse, earnedGlow, spentGlow, availableGlow, festivalReady, buildProject, commissionGoals, trailhouseStage, finishCommission, serializePassport, parsePassport, loadTrailhouse, saveTrailhouse, TRAILHOUSE_KEY, MAX_PASSPORT_BYTES } from '../src/trailhouse-model.mjs';
import { STORY_CLEARS } from '../src/story-adventure-clears.mjs';
import { STORY_ALTERNATIVES } from './fixtures/story-alternatives.mjs';
import { createRun, stepRun, missionGoals, resultFor } from '../src/adventure.mjs';
import { checkAdventure, verifyAdventureProof, adventureKey } from '../src/workshop-model.mjs';
const alternate=new Set(['own-crossing','shore-shells','lasting-memory','paper-stars']);
const actionsFor=job=>alternate.has(job.id)?STORY_ALTERNATIVES[job.world]:STORY_CLEARS[job.world].actions;
const play=(job,difficulty='trail',actions=actionsFor(job),state=freshTrailhouse())=>actions.reduce(stepRun,createRun(trailhouseStage(state,job.id),{difficulty}));
const cleared=()=>COMMISSIONS.reduce((state,job)=>finishCommission(state,play(job)).state,freshTrailhouse());
const restored=()=>PROJECTS.reduce((state,project)=>buildProject(state,project.id),cleared());
for(const job of COMMISSIONS)for(const difficulty of ['trail','nemesis'])test(`Trailhouse: ${job.title} / ${difficulty}, actual complete route fulfills every goal`,()=>{
  const state=freshTrailhouse(),run=play(job,difficulty),before=structuredClone(run),outcome=finishCommission(state,run);
  assert.equal(run.status,'won');assert.ok(missionGoals(run).every(goal=>goal.done));assert.ok(commissionGoals(job.id,run).every(goal=>goal.done),JSON.stringify(commissionGoals(job.id,run)));assert.equal(run.damage,0);assert.equal(outcome.met,true);assert.equal(outcome.reward,3);assert.equal(availableGlow(outcome.state),3);assert.deepEqual(state,freshTrailhouse());assert.deepEqual(run,before);assert.deepEqual(normalizeTrailhouse(outcome.state),outcome.state);
});
for(const id of alternate)test(`Trailhouse: clearing a world without the ${id} favor earns no village light`,()=>{
  const job=COMMISSIONS.find(job=>job.id===id),run=play(job,'trail',STORY_CLEARS[job.world].actions),outcome=finishCommission(freshTrailhouse(),run);
  assert.equal(run.status,'won');assert.equal(outcome.met,false);assert.equal(outcome.reward,0);assert.deepEqual(outcome.state,freshTrailhouse());assert.ok(outcome.goals.some(goal=>!goal.done));
});
test('first fulfillment earns once across both rules; each rule has its own best and replay cannot farm light',()=>{
  const job=COMMISSIONS[0],run=play(job);let state=finishCommission(freshTrailhouse(),run).state;const old=structuredClone(state);
  for(let i=0;i<4;i++){const outcome=finishCommission(state,run);assert.equal(outcome.reward,0);state=outcome.state;}
  const harder=finishCommission(state,play(job,'nemesis'));assert.equal(harder.reward,0);assert.equal(earnedGlow(harder.state),3);assert.equal(Object.keys(harder.state.bests).length,2);assert.deepEqual(state,old);
  const slower={...run,turns:run.turns+100};assert.deepEqual(finishCommission(state,slower).state.bests,state.bests);
});
test('all commissions fund exactly six projects, in any order, without losing or inventing light',()=>{
  const start=cleared();assert.equal(earnedGlow(start),36);assert.equal(spentGlow(start),0);assert.equal(festivalReady(start),false);
  let state=start;for(const project of [...PROJECTS].reverse()){const before=structuredClone(state);state=buildProject(state,project.id);assert.ok(availableGlow(state)>=0);assert.deepEqual(before.built,state.built.slice(0,-1));}
  assert.equal(availableGlow(state),0);assert.equal(spentGlow(state),36);assert.equal(festivalReady(state),true);assert.throws(()=>buildProject(state,PROJECTS[0].id),/already/);assert.throws(()=>buildProject(freshTrailhouse(),PROJECTS[0].id),/needs/);assert.throws(()=>buildProject(start,'unknown'),/Choose/);assert.deepEqual(start.built,[]);
});
for(const difficulty of ['trail','nemesis'])test(`festival: a new original adventure, clean ${difficulty} completion, unlock and ribbon`,async()=>{
  assert.throws(()=>trailhouseStage(freshTrailhouse(),'festival'),/six/);const state=restored(),pack=festivalWorld();assert.deepEqual(checkAdventure(pack).errors,[]);assert.equal((await verifyAdventureProof(pack)).status,'won');
  const stage=trailhouseStage(state,'festival'),run=FESTIVAL_CLEAR.reduce(stepRun,createRun(stage,{difficulty}));assert.equal(run.status,'won');assert.equal(run.damage,0);assert.equal(resultFor(run).stars,3);assert.equal(run.relayProgress,3);assert.equal(run.collectedCoins.length,4);assert.equal(run.rescued.length,3);assert.ok(missionGoals(run).every(goal=>goal.done));
  const outcome=finishCommission(state,run);assert.equal(outcome.met,true);assert.equal(outcome.reward,0);assert.ok(outcome.state.bests[`festival-${difficulty}`]);assert.equal(availableGlow(outcome.state),0);assert.deepEqual(parsePassport(serializePassport(outcome.state)),outcome.state);
  pack.markers[0].x=0;assert.notEqual(adventureKey(pack),adventureKey(festivalWorld()));
});
test('unwon, practice, storybook, unknown, altered-world, and inconsistent festival results cannot award progress',()=>{
  const job=COMMISSIONS[0],won=play(job),state=freshTrailhouse();
  const variants=[{...won,status:'playing'},{...won,difficulty:'invented'},...[
    {practice:true},{storybook:{}},{key:'0000000000000000'},{trailhouse:{id:'unknown',festival:false}},{trailhouse:{id:job.id,festival:true}}
  ].map(meta=>({...won,stage:{...won.stage,workshop:{...won.stage.workshop,...meta}}}))];
  for(const run of variants)assert.throws(()=>finishCommission(state,run),/original/);assert.deepEqual(state,freshTrailhouse());
});
test('passport roundtrip is independent, bounded, strict, and changes only the Trailhouse storage key',()=>{
  const state=restored(),text=serializePassport(state),clone=parsePassport(text);assert.deepEqual(clone,state);clone.built.pop();assert.equal(state.built.length,6);
  const values=new Map([['campaign','untouched'],['draft','untouched']]),storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
  assert.equal(saveTrailhouse(storage,state),true);assert.deepEqual(loadTrailhouse(storage),{state,failed:false});assert.deepEqual([...values.keys()],['campaign','draft',TRAILHOUSE_KEY]);assert.equal(values.get('draft'),'untouched');
  assert.deepEqual(loadTrailhouse({getItem:()=>null}),{state:freshTrailhouse(),failed:false});assert.deepEqual(loadTrailhouse({getItem:()=>'{'}),{state:freshTrailhouse(),failed:true});assert.equal(loadTrailhouse({getItem(){throw Error('blocked');}}).failed,true);assert.equal(saveTrailhouse({setItem(){throw Error('quota');}},state),false);
  for(const bad of ['',null,'{','{}',JSON.stringify({...state,format:'world'}),' '.repeat(MAX_PASSPORT_BYTES+1)])assert.throws(()=>parsePassport(bad));
});
test('passport rejects unknown IDs, duplicate rewards, unearned buildings, impossible results, and mismatched progress',()=>{
  const state=cleared();const invalid=[null,{}, {...state,version:2},{...state,completed:[...state.completed,state.completed[0]]},{...state,built:['post','post']},{...state,completed:['unknown']},{...state,built:['unknown']},{...freshTrailhouse(),built:['post']},{...state,bests:{}},{...freshTrailhouse(),bests:state.bests},{...state,bests:[]},{...state,bests:{'festival-trail':{stars:3,turns:10,score:10}}},...[
    {stars:0,turns:10,score:10},{stars:3,turns:-1,score:10},{stars:3,turns:10,score:Infinity},{stars:3,turns:1.5,score:10}
  ].map(best=>({...state,bests:{...state.bests,'own-crossing-trail':best}})),{...state,bests:{...state.bests,'invented-trail':{stars:3,turns:10,score:10}}}];
  for(const value of invalid)assert.throws(()=>normalizeTrailhouse(value));
});
