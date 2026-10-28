import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRun, stepRun } from '../src/adventure.mjs';
import { createCampaign } from '../src/adventure-levels.mjs';
import { freshMemory, learnMove } from '../src/adventure-brain.mjs';
import { resumeDefinition, ordinarySource } from '../src/adventure-resume.mjs';
import { beginRewind, advanceRewind, undoRewind, canRewind, serializeTrail, serializeExpeditionTrail, readTrail, restoreTrail, loadTrail, storeTrail, clearTrail, TRAIL_SAVE_KEY, MAX_TRAIL_BYTES, MAX_TRAIL_ACTIONS, REWIND_LIMIT } from '../src/adventure-rewind.mjs';
import { LAB_ROOMS } from '../src/workshop-lab.mjs';
import { LAB_CLEARS } from '../src/workshop-lab-clears.mjs';
import { blankAdventure, editAdventure, adventureStage } from '../src/workshop-model.mjs';
import { beginBook, chooseChapter, bookStage } from '../src/storybook-model.mjs';
import { featuredBooks } from '../src/storybook-worlds.mjs';
import { createJourney, advanceJourney, journeyUndoFrames } from '../src/adventure-journey.mjs';
import { gamepadSnapshot, gamepadPress } from '../src/adventure-controls.mjs';
const start=(source,difficulty='trail',memory=freshMemory())=>beginRewind(createRun(resumeDefinition(source,difficulty).stage,{difficulty,memory}),source);
const replay=(trail,actions)=>actions.reduce(advanceRewind,trail);

for(const room of LAB_ROOMS)for(const difficulty of ['trail','nemesis'])test(`exact mid-room save and real resumed win: ${room.id}/${difficulty}`,async()=>{
  const actions=LAB_CLEARS[room.id],split=Math.floor(actions.length*.7),trail=replay(start({kind:'lab',id:room.id},difficulty),actions.slice(0,split)),text=serializeTrail(trail),restored=(await restoreTrail(readTrail(text))).trail;
  assert.deepEqual(restored.run,trail.run);assert.deepEqual(restored.actions,trail.actions);assert.ok(restored.past.length<=REWIND_LIMIT);
  const rewound=undoRewind(restored);assert.equal(rewound.actions.length<restored.actions.length,true);
  assert.equal(replay(restored,actions.slice(split)).run.status,'won');
});
test('undo restores exact crates, fog, supplies, tools, and learned habits and removes the abandoned future',()=>{
  let trail=start({kind:'lab',id:'foundry'}),before=trail;trail=advanceRewind(trail,'right');assert.notDeepEqual(trail.run.memory,before.run.memory);assert.deepEqual(undoRewind(trail).run,before.run);
  before=replay(trail,['wait','wait']);const next=replay(before,['shield','decoy','power']);let undone=undoRewind(undoRewind(undoRewind(next)));assert.deepEqual(undone.run,before.run);assert.deepEqual(undone.actions,before.actions);
  undone=advanceRewind(undone,'left');assert.equal(undone.actions.at(-1),'left');assert.ok(!undone.actions.includes('power'));
});
test('dialogue undo skips a free close and restores an unchosen, unrewarded conversation',async()=>{
  const actions=LAB_CLEARS.tidekeeper,index=actions.indexOf('choose:route'),before=replay(start({kind:'lab',id:'tidekeeper'}),actions.slice(0,index)),next=replay(before,['choose:route','close-dialogue']),undone=undoRewind(next);
  assert.deepEqual(undone.run,before.run);assert.equal(undone.run.choices.postkeeper,undefined);assert.equal(undone.run.switches.ferry,false);assert.deepEqual((await restoreTrail(readTrail(serializeTrail(undone)))).trail.run,undone.run);
});
test('a completed reward cannot be rewound, while a real losing move can',()=>{
  const win=replay(start({kind:'lab',id:'footstep'}),LAB_CLEARS.footstep);assert.equal(win.run.status,'won');assert.equal(canRewind(win),false);assert.equal(undoRewind(win),win);assert.throws(()=>serializeTrail(win),/completed/);
  const world=editAdventure(blankAdventure(8,8),{markers:[{kind:'start',id:'start',x:2,y:4},{kind:'beacon',id:'home',x:6,y:6},{kind:'lantern',id:'light',x:6,y:1},{kind:'hunter',id:'hunter',x:3,y:4,vision:6,route:[{x:3,y:4},{x:3,y:5}]}]});
  let trail=start({kind:'world',origin:'shelf',world}),before;
  for(let i=0;i<30&&trail.run.status==='playing';i++){before=trail;trail=advanceRewind(trail,'wait');}
  assert.equal(trail.run.status,'lost');assert.deepEqual(undoRewind(trail).run,before.run);
});
test('the latest 60 input states survive reload without limiting the full adventure route',async()=>{
  const trail=replay(start({kind:'lab',id:'foundry'}),Array(90).fill('wait'));assert.equal(trail.past.length,60);assert.equal(trail.actions.length,90);
  const restored=(await restoreTrail(readTrail(serializeTrail(trail)))).trail;assert.equal(restored.past.length,60);let undone=restored;for(let i=0;i<65;i++)undone=undoRewind(undone);assert.equal(undone.run.turns,30);
});
test('story, all specialist kits, custom maps, commissions, books, and practice resolve independently',async()=>{
  const book=chooseChapter(beginBook(featuredBooks()[0],'trail'),'wander'),stage=bookStage(book);
  const sources=[{kind:'story',id:'trail-1'},...['bellrunner','mistweaver','echoist'].map(kit=>({kind:'guild',id:'guild-1',kit})),{kind:'map',map:blankAdventure().map},{kind:'house',id:'own-crossing'},{kind:'house',id:'festival'},{kind:'book',world:book.book.chapters[0].world,meta:stage.workshop.storybook},{kind:'world',world:blankAdventure(),origin:'build'},{kind:'world',world:blankAdventure(),origin:'build',practice:{x:4,y:4}}];
  for(const source of sources){const trail=replay(start(source,'trail',learnMove(freshMemory(),'left')),['wait','right','wait']),restored=(await restoreTrail(readTrail(serializeTrail(trail)))).trail;assert.deepEqual(restored.run,trail.run,source.kind);}
  assert.deepEqual(ordinarySource(createRun(createCampaign()[0])),{kind:'story',id:'trail-1'});
  assert.throws(()=>resumeDefinition({kind:'guild',id:'guild-1',kit:'unknown'}));assert.throws(()=>resumeDefinition({kind:'story',id:'missing'}));assert.throws(()=>resumeDefinition({kind:'world',world:blankAdventure(),origin:'external'}));
});
test('damaged, oversized, changed-rule, and inconsistent checkpoints fail without awarding progress',async()=>{
  const trail=replay(start({kind:'lab',id:'caravan'}),['wait','right']),text=serializeTrail(trail),data=readTrail(text);
  for(const bad of ['{',' '.repeat(MAX_TRAIL_BYTES+1),JSON.stringify({...data,rules:'future'}),JSON.stringify({...data,actions:['win']}),JSON.stringify({...data,actions:Array(MAX_TRAIL_ACTIONS+1).fill('wait')})])assert.throws(()=>readTrail(bad));
  await assert.rejects(()=>restoreTrail({...data,fingerprint:'bad'}));await assert.rejects(()=>restoreTrail({...data,source:{kind:'lab',id:'foundry'}}));
  assert.throws(()=>serializeTrail({...trail,actions:Array(MAX_TRAIL_ACTIONS+1).fill('wait')}),/checkpoint limit/);
});
test('storage errors preserve usable session play and leave other save slots untouched',()=>{
  const data=new Map([['other','retained']]),storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};
  const text=serializeTrail(start({kind:'story',id:'trail-1'}));assert.equal(storeTrail(storage,text),true);assert.equal(loadTrail(storage).data.header.turns,0);assert.equal(clearTrail(storage),true);assert.equal(loadTrail(storage).data,null);assert.equal(data.get('other'),'retained');
  data.set(TRAIL_SAVE_KEY,'broken');assert.ok(loadTrail(storage).error);assert.equal(data.get(TRAIL_SAVE_KEY),'broken');
  const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('full');},removeItem(){throw Error('blocked');}};assert.ok(loadTrail(blocked).error);assert.equal(storeTrail(blocked,text),false);assert.equal(clearTrail(blocked),false);
});
test('expedition resume and undo frames preserve the leg, supplies, memory, and earlier receipts',async()=>{
  const fixtures=JSON.parse(await readFile(new URL('fixtures/expedition-routes.json',import.meta.url),'utf8')),fixture=fixtures[0];let session=createJourney(fixture.config,'rewind-expedition');
  const actions=fixture.actions||fixture.legs?.[0]?.actions;assert.ok(actions);
  for(const action of actions.slice(0,8))session=advanceJourney(session,action);
  const restored=(await restoreTrail(readTrail(serializeExpeditionTrail(session)))).session;assert.deepEqual(restored,session);
  const frames=journeyUndoFrames(restored),frame=frames.at(-1);assert.ok(frame);assert.ok(frame.run.turns<=session.run.turns);assert.equal(frame.length,session.journal.length-1);
});
test('right stick click maps to one deliberate controller undo',()=>{
  const pad={connected:true,mapping:'standard',index:0,id:'pad',axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false}))},before=gamepadSnapshot(pad);pad.buttons[11].pressed=true;const next=gamepadSnapshot(pad);assert.equal(gamepadPress(next,before),'undo');assert.equal(gamepadPress(next,next),null);
});
