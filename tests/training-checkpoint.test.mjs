import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { practiceWorld, paintPractice, tellPracticeStory, PRACTICE_SPOTS, practiceClear } from '../src/training-model.mjs';
import { adventureStage } from '../src/workshop-model.mjs';
import { createRun } from '../src/adventure.mjs';
import { beginRewind, advanceRewind, undoRewind } from '../src/adventure-rewind.mjs';
import { serializePractice, restorePractice, savePractice, readPractice, MAX_PRACTICE_BYTES } from '../src/training-checkpoint.mjs';
const routes=JSON.parse(await readFile(new URL('fixtures/training-routes.json',import.meta.url),'utf8'));
function stateFor(kind){const pack=practiceWorld(kind),run=kind==='play'?createRun(adventureStage(pack)):null;return {kind,pack,run,rewind:run?beginRewind(run,{kind:'world',world:pack,origin:'shelf'}):null,mode:kind==='play'?'play':'build',brush:'bridge',cursor:{x:5,y:4},history:[pack],index:0,checked:false,won:false,shared:false,actions:[],storyDirty:false,plan:false};}
test('a saved tutorial restores its actual position, dialogue, and Undo states',async()=>{
  const state=stateFor('play');state.rewind=routes.play.slice(0,12).reduce(advanceRewind,state.rewind);state.run=state.rewind.run;state.actions=state.rewind.actions;
  const restored=await restorePractice(serializePractice(state),'play');assert.deepEqual(restored.run,state.run);assert.ok(undoRewind(restored.rewind).actions.length<state.actions.length);assert.equal(routes.play.slice(12).reduce(advanceRewind,restored.rewind).run.status,'won');
});
test('creator practice retains painting history and unfinished form text',async()=>{
  const state=stateFor('create');for(const brush of ['bridge','lantern','guide']){state.pack=paintPractice(state.pack,brush,PRACTICE_SPOTS[brush]);state.history.push(state.pack);state.index++;}
  state.uiForm={title:'An unfinished island',opening:'Still writing my own welcome.',dialogue:'The bridge is waiting.'};const restored=await restorePractice(serializePractice(state),'create');assert.deepEqual(restored.history,state.history);assert.equal(restored.index,3);assert.deepEqual(restored.uiForm,state.uiForm);assert.equal(restored.storyDirty,true);
});
test('a creator can resume a partial playtest and retain a real completed clear',async()=>{
  const state=stateFor('create');for(const brush of ['bridge','lantern','guide'])state.pack=paintPractice(state.pack,brush,PRACTICE_SPOTS[brush]);state.pack=tellPracticeStory(state.pack,{title:'The returning island',intro:'Follow the little road home.',dialogue:'The crossing is east.'});state.history=[state.pack];state.index=0;state.mode='play';state.checked=true;state.rewind=beginRewind(createRun(adventureStage(state.pack)),{kind:'world',world:state.pack,origin:'build'});state.rewind=routes.create.slice(0,8).reduce(advanceRewind,state.rewind);state.run=state.rewind.run;state.actions=state.rewind.actions;
  const restored=await restorePractice(serializePractice(state),'create');assert.deepEqual(restored.run,state.run);restored.rewind=routes.create.slice(8).reduce(advanceRewind,restored.rewind);restored.run=restored.rewind.run;restored.actions=restored.rewind.actions;restored.won=true;restored.pack=practiceClear(restored.pack,restored.actions);assert.equal((await restorePractice(serializePractice(restored),'create')).run.status,'won');
});
test('invalid, mismatched, oversized, and unavailable practice saves are rejected safely',async()=>{
  const state=stateFor('play'),data=JSON.parse(serializePractice(state));for(const value of ['{',' '.repeat(MAX_PRACTICE_BYTES+1),JSON.stringify({...data,kind:'create'}),JSON.stringify({...data,actions:['win']}),JSON.stringify({...data,cursor:{x:100,y:1}}),JSON.stringify({...data,fingerprint:'bad'})])await assert.rejects(()=>restorePractice(value,'play'));
  const storage={getItem(){throw Error('blocked');},setItem(){throw Error('full');}};assert.equal(readPractice(storage,'play'),null);assert.equal(savePractice(storage,state),false);
});
