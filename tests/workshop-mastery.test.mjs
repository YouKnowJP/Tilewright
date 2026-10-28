import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { LAB_ROOMS, puzzleLabWorld, cursorPractice } from '../src/workshop-lab.mjs';
import { LAB_CLEARS } from '../src/workshop-lab-clears.mjs';
import { adventureStage, adventureKey, editAdventure } from '../src/workshop-model.mjs';
import { createRun, stepRun } from '../src/adventure.mjs';
import { MASTERY_KEY, MASTERY_REWARDS, MAX_MASTERY_BYTES, freshMastery, normalizeMastery, masteryCount, masteryGoals, recordMastery, serializeMastery, parseMastery, loadMastery, saveMastery } from '../src/workshop-mastery.mjs';

const foundryAlternate=JSON.parse(await readFile(new URL('fixtures/foundry-alternate.json',import.meta.url),'utf8'));
function play(id,difficulty='trail',actions=LAB_CLEARS[id]){const stage=adventureStage(puzzleLabWorld(id));stage.workshop.lab=id;return actions.reduce(stepRun,createRun(stage,{difficulty}));}
const crateFootstep=['up','up','up','right','right','down','down','right','down','right','right','right','down','down'];
const suppliedFerry=LAB_CLEARS.tidekeeper.map(action=>action==='choose:route'?'choose:shield':action);suppliedFerry.splice(suppliedFerry.indexOf('close-dialogue')+1,0,'interact:ferry');

test('new rooms preserve the original six world identities and their saved bests',()=>{
  const keys=['player-b87e26e723a7248b','player-ef5b66a284ceef32','player-e8e2022a82794316','player-4c3e98d8518da070','player-7e34b4dc1af4f39c','player-bd48b63d45f37c3d'];
  assert.deepEqual(LAB_ROOMS.slice(0,6).map(room=>adventureKey(puzzleLabWorld(room.id))),keys);
});
test('every one of the 72 seals is attainable through actual ordinary-action wins',()=>{
  let state=freshMastery();const rewards=[];
  for(const difficulty of ['trail','nemesis'])for(const room of LAB_ROOMS){
    const run=play(room.id,difficulty);assert.equal(run.status,'won');assert.equal(run.damage,0);
    const outcome=recordMastery(state,run);state=outcome.state;rewards.push(...outcome.rewards.map(item=>item.name));
  }
  for(const difficulty of ['trail','nemesis'])for(const [id,actions]of [['footstep',crateFootstep],['tidekeeper',suppliedFerry],['foundry',foundryAlternate]]){
    const run=play(id,difficulty,actions);assert.equal(run.status,'won');assert.ok(masteryGoals(id,run).every(goal=>goal.done));
    const outcome=recordMastery(state,run);state=outcome.state;rewards.push(...outcome.rewards.map(item=>item.name));
  }
  assert.equal(masteryCount(state),72);assert.equal(Object.keys(state.records).length,24);assert.deepEqual(rewards,MASTERY_REWARDS.map(item=>item.name));
  const repeat=recordMastery(state,play('foundry'));assert.deepEqual(repeat.earned,[]);assert.deepEqual(repeat.rewards,[]);assert.deepEqual(repeat.state,state);
});
test('different solutions add seals without removing a previous answer or changing the input',()=>{
  const start=freshMastery(),first=recordMastery(start,play('foundry'));
  assert.deepEqual(first.earned,['light','clean']);assert.deepEqual(start,freshMastery());
  const next=recordMastery(first.state,play('foundry','trail',foundryAlternate));assert.deepEqual(next.earned,['signature']);assert.deepEqual(first.state.records['foundry-trail'],['light','clean']);
  assert.deepEqual(next.state.records['foundry-trail'],['light','clean','signature']);assert.equal(next.state.records['foundry-nemesis'],undefined);
});
test('unfinished runs, practice, remixes, other modes, and mismatched originals cannot grant seals',()=>{
  const pack=puzzleLabWorld('counterweight'),stage=adventureStage(pack);stage.workshop.lab='counterweight';
  assert.throws(()=>recordMastery(freshMastery(),createRun(stage)),/Finish an original/);
  for(const extra of [{practice:true},{storybook:{}},{trailhouse:{}},{lab:'foundry'},{lab:'unknown'}]){
    const run=play('counterweight');run.stage={...run.stage,workshop:{...run.stage.workshop,...extra}};assert.throws(()=>recordMastery(freshMastery(),run),/Finish an original/);
  }
  const remix=adventureStage(editAdventure(pack,{title:'My remix'}));remix.workshop.lab='counterweight';assert.throws(()=>recordMastery(freshMastery(),LAB_CLEARS.counterweight.reduce(stepRun,createRun(remix))),/Finish an original/);
  const practice=cursorPractice(pack,{x:2,y:5});practice.workshop.lab='counterweight';assert.throws(()=>recordMastery(freshMastery(),LAB_CLEARS.counterweight.reduce(stepRun,createRun(practice))),/Finish an original/);
});
test('live goals distinguish a missed signature from exit requirements',()=>{
  const run=play('foundry');assert.equal(run.status,'won');assert.equal(masteryGoals('foundry',run).find(goal=>goal.id==='signature').done,false);assert.equal(masteryGoals('foundry',run).find(goal=>goal.id==='signature').missed,true);
  const opening=createRun(adventureStage(puzzleLabWorld('caravan')));assert.ok(masteryGoals('caravan',opening).every(goal=>!goal.done));
  assert.throws(()=>masteryGoals('unknown'),/known/);
});
test('a bounded portable seal journal round-trips without retaining caller references',()=>{
  const state=recordMastery(freshMastery(),play('locksmith')).state,text=serializeMastery(state),parsed=parseMastery(text);
  assert.deepEqual(parsed,state);assert.ok(new TextEncoder().encode(text).length<MAX_MASTERY_BYTES);parsed.records['locksmith-trail'].pop();assert.equal(state.records['locksmith-trail'].length,3);
  for(const bad of ['no json',JSON.stringify({...state,format:'another-game'}),' '.repeat(MAX_MASTERY_BYTES+1)])assert.throws(()=>parseMastery(bad));
  for(const records of [{'unknown-trail':['light']},{'foundry-easy':['light']},{'foundry-trail':['signature']},{'foundry-trail':['light','light']},{'foundry-trail':['light','cheat']},{'foundry-trail':[]}])assert.throws(()=>normalizeMastery({version:1,records}));
  assert.throws(()=>normalizeMastery({version:2,records:{}}));assert.throws(()=>normalizeMastery({version:1,records:[]}));
});
test('corrupt or unavailable saving retains session progress and leaves unrelated saves untouched',()=>{
  const data=new Map([['tilewright.workshop.v1','shelf'],['tilewright.adventure.v1','campaign']]),storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};
  assert.deepEqual(loadMastery(storage),{state:freshMastery(),failed:false});const state=recordMastery(freshMastery(),play('glassferry')).state;assert.equal(saveMastery(storage,state),true);assert.deepEqual(loadMastery(storage).state,state);
  assert.equal(data.get('tilewright.workshop.v1'),'shelf');assert.equal(data.get('tilewright.adventure.v1'),'campaign');
  data.set(MASTERY_KEY,'damaged');assert.deepEqual(loadMastery(storage),{state:freshMastery(),failed:true});assert.equal(data.get(MASTERY_KEY),'damaged');
  const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('full');}};assert.equal(loadMastery(blocked).failed,true);assert.equal(saveMastery(blocked,state),false);assert.equal(masteryCount(state),3);
});
