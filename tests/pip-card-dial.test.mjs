import test from 'node:test';
import assert from 'node:assert/strict';
import {newDuoProject,normalizeDuoProject} from '../src/pip-duo.mjs';
import {CARD_DIAL_FINALE} from '../src/pip-dial-finale.mjs';
import {solvedTinkerProject,startTinker,tinkerStep,editTinkerProject,serializeTinkerProject,parseTinkerProject,keepTinkerResult} from '../src/pip-tinker.mjs';
import {loadPipStudio,savePipStudio} from '../src/pip-duo-storage.mjs';

function finish(project){let state=startTinker(project);while(state.status==='playing')state=tinkerStep(state);return state;}

test('a Card Dial finale clear and personal best survive a fresh journal load',()=>{
 const data=new Map(),storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};
 const project=solvedTinkerProject('duo-dial-finale'),journal=keepTinkerResult(loadPipStudio(storage).journal,project);
 assert.equal(savePipStudio(storage,journal,20),true);
 const restored=loadPipStudio(storage);assert.equal(restored.failed,false);
 assert.deepEqual(restored.journal.drafts[project.trialId],project);
 assert.deepEqual(restored.journal.bests[project.trialId],[project]);
});

test('Card Dial finale delivers all six letters, finishes silent, and needs every repair',()=>{
 const project=solvedTinkerProject('duo-dial-finale'),snapshot=structuredClone(project),end=finish(project);
 assert.equal(end.status,'won');assert.equal(end.ticks,90);
 assert.deepEqual(Object.values(end.received),[3,3]);assert.deepEqual(end.pulses,{});
 assert.deepEqual(end.bots.map(({x,y})=>({x,y})),CARD_DIAL_FINALE.starts);
 assert.deepEqual(parseTinkerProject(serializeTinkerProject(project)),project);
 assert.throws(()=>parseTinkerProject(JSON.stringify({...project,proof:{ticks:89}})),/does not finish/);
 for(const part of project.parts)assert.equal(finish(editTinkerProject(project,{parts:project.parts.filter(p=>p!==part)})).status,'limit');
 assert.deepEqual(project,snapshot);
});

test('a Card Dial never shifts again on Use, Wait, or a blocked move while cargo stays held',()=>{
 for(const shift of ['skip','rewind']){
  const seed=newDuoProject(),project=normalizeDuoProject({...seed,version:20,board:{...seed.board,road:seed.board.road.filter(p=>p.x!==1||p.y!==1)},starts:[{x:1,y:2},{x:7,y:3}],programs:[['use','wait','up'],['wait','wait','wait']],parts:[{kind:'dial',x:1,y:2,shift}]});
  let state=startTinker(project);state.bots[0].parcel='amber';
  for(const nextIndex of [1,2,0]){
   const previous=structuredClone(state),next=tinkerStep(state);
   assert.deepEqual(state,previous);state=next;
   assert.equal(state.bots[0].index,nextIndex);assert.equal(state.bots[0].parcel,'amber');
   assert.deepEqual([state.bots[0].x,state.bots[0].y],[1,2]);
   assert.deepEqual(state.bots[0].program,['use','wait','up']);
  }
  assert.equal(state.bots[0].last,'Blocked');
 }
});
