import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ORCHESTRA_LEVELS,ORCHESTRA_CLEARS,orchestraWorld,orchestraBook} from '../src/pip-orchestra-worlds.mjs';
import {CLOCKWORK_COMMANDS,clockworkStep,clockworkRehearsal,clockworkForecast,clockworkActionLabel} from '../src/clockwork.mjs';
import {createRun,stepRun,canEnter,resultFor} from '../src/adventure.mjs';
import {adventureStage,checkAdventure,verifyAdventureProof,editAdventure,normalizeAdventure} from '../src/workshop-model.mjs';
import {serializeAdventure,parseAdventure,adventureCode,parseAdventureCode} from '../src/workshop-sharing.mjs';
import {beginRewind,advanceRewind,undoRewind,serializeTrail,restoreTrail,runFingerprint} from '../src/adventure-rewind.mjs';
import {trailReview,inspectReview,reviewFrame} from '../src/adventure-reviews.mjs';
import {serializeBook,parseBook,normalizeBook} from '../src/storybook-model.mjs';
import {transformAdventure} from '../src/workshop-lab.mjs';
import {captureAssembly,rotateAssembly} from '../src/workshop-assemblies.mjs';
import {switchChange} from '../src/adventure-mechanisms.mjs';

for(const id of ORCHESTRA_LEVELS)for(const difficulty of ['trail','nemesis'])test(`Pocket Orchestra: ${id} has a clean three-star ${difficulty} route`,async()=>{
 const world=orchestraWorld(id),before=structuredClone(world);assert.equal(checkAdventure(world).ready,true);let run=createRun(adventureStage(world),{difficulty});
 for(const action of ORCHESTRA_CLEARS[id])run=stepRun(run,action);
 assert.equal(run.status,'won');assert.equal(run.damage,0);assert.equal(resultFor(run).stars,3);assert.deepEqual(world,before);assert.equal((await verifyAdventureProof(world)).status,'won');
 assert.deepEqual(parseAdventure(serializeAdventure(world)),world);assert.deepEqual(parseAdventureCode(adventureCode(world)),world);
});
test('single-card stepping advances one instruction and one world turn while preserving the paused state',()=>{
 let run=createRun(adventureStage(orchestraWorld('little-switch')));const before=structuredClone(run);
 run=stepRun(run,'clockwork-step');assert.equal(run.turns,1);assert.equal(run.clockwork.x,3);assert.equal(run.clockwork.index,1);assert.equal(run.clockwork.running,false);assert.deepEqual(run.player,before.player);
 run=stepRun(run,'clockwork-step');run=stepRun(run,'clockwork-step');assert.equal(run.switches['first-switch'],true);assert.equal(run.clockwork.index,0);assert.equal(run.turns,3);assert.ok(run.events.some(event=>event.type==='switch'));assert.match(run.message,/Sun switch switched on/);assert.deepEqual(before.clockwork.program,['right','right','use']);
 const running=stepRun(run,'clockwork-toggle'),blocked=stepRun(running,'clockwork-step');assert.equal(blocked.turns,running.turns);assert.equal(runFingerprint(blocked),runFingerprint(running));assert.match(blocked.message,/Pause/);
});
test('Use on an empty tile consumes a card, skips inoperable controls, and never reaches an adjacent lever',()=>{
 let run=createRun(adventureStage(orchestraWorld('little-switch')));run=stepRun(run,'clockwork-program:use,wait,wait');run=stepRun(run,'clockwork-step');assert.match(run.message,/No lever or bell/);assert.equal(run.clockwork.index,1);assert.equal(run.switches['first-switch'],false);
 const adjacent={...run,clockwork:{...run.clockwork,x:3,y:2,index:0}};assert.match(stepRun(adjacent,'clockwork-step').message,/No lever or bell/);
 const positioned={...run,clockwork:{...run.clockwork,x:4,y:2,index:0,running:true},stage:{...run.stage,switches:run.stage.switches.map(s=>({...s,operable:false}))}};assert.equal(clockworkStep(positioned,canEnter).switches['first-switch'],false);
});
test('a remote Use card refuses to close an occupied crossing and advances safely without mutation',()=>{
 let run=createRun(adventureStage(orchestraWorld('little-switch')));for(const action of ORCHESTRA_CLEARS['little-switch'].slice(0,4))run=stepRun(run,action);
 run={...run,player:{x:7,y:7},clockwork:{...run.clockwork,program:['use','wait','wait'],index:0}};const before=structuredClone(run),next=stepRun(run,'clockwork-step');assert.equal(next.switches['first-switch'],true);assert.match(next.message,/occupied/);assert.equal(next.clockwork.index,1);assert.deepEqual(run,before);
 const gate=run.stage.gates.find(g=>g.id==='first-gate'),botOnGate={...run,player:{x:2,y:7},clockwork:{...run.clockwork,x:gate.x,y:gate.y}};assert.match(switchChange(botOnGate,{'first-switch':false}).error,/occupied/);
 const legacy={...botOnGate,stage:{...botOnGate.stage,clockworkSharedSight:undefined}};assert.equal(switchChange(legacy,{'first-switch':false}).error,undefined);assert.match(switchChange(legacy,{'first-switch':false},{includeClockwork:true}).error,/occupied/);
});
test('Pip and player bell notes share one ordered melody, including wrong-note recovery and completed-loop safety',()=>{
 let run=createRun(adventureStage(orchestraWorld('countermelody')));for(const action of ['clockwork-step','clockwork-program:use,wait,wait','clockwork-step'])run=stepRun(run,action);assert.equal(run.relayProgress,0);assert.match(run.message,/Wrong bell/);
 run=stepRun(run,'interact:opening');run=stepRun(run,'clockwork-program:use,wait,wait');run=stepRun(run,'clockwork-step');assert.equal(run.relayProgress,2);assert.ok(run.events.some(e=>e.type==='relay'));
 const completed={...run,relayProgress:4,clockwork:{...run.clockwork,index:0}};const after=stepRun(completed,'clockwork-step');assert.equal(after.relayProgress,4);assert.match(after.message,/already complete/);
});
test('rehearsal predicts six companion cards from the current position without changing world or save state',()=>{
 const run=createRun(adventureStage(orchestraWorld('little-switch'))),before=structuredClone(run),program=['right','right','use'],preview=clockworkRehearsal(run,canEnter,program);let actual=stepRun(stepRun(run,'clockwork-program:'+program.join(',')),'clockwork-toggle');
 for(const [index,item]of preview.entries()){actual=stepRun(actual,'wait');assert.deepEqual([item.x,item.y,item.result],[actual.clockwork.x,actual.clockwork.y,actual.clockwork.last]);assert.equal(item.step,index+1);}assert.deepEqual(run,before);assert.match(preview[2].result,/switched on/);assert.equal(run.turns,0);assert.match(clockworkForecast(actual,canEnter),/Use operates/);
});
test('new card histories preserve exact Continue, Undo and completed route review',async()=>{
 const world=orchestraWorld('automaton-fair'),actions=ORCHESTRA_CLEARS['automaton-fair'];let trail=beginRewind(createRun(adventureStage(world)),{kind:'world',world,origin:'shelf'});for(const action of actions.slice(0,14))trail=advanceRewind(trail,action);
 const restored=(await restoreTrail(JSON.parse(serializeTrail(trail)))).trail;assert.equal(runFingerprint(restored.run),runFingerprint(trail.run));assert.deepEqual(undoRewind(restored).run,trail.past.at(-1).run);
 for(const action of actions.slice(14))trail=advanceRewind(trail,action);const analysis=await inspectReview(trailReview(trail));assert.equal(runFingerprint(analysis.run),runFingerprint(trail.run));assert.deepEqual(await reviewFrame(analysis.seed,analysis.seed.actions.length),trail.run);assert.equal(clockworkActionLabel('clockwork-step'),'Advance one companion card');
});
test('v0.31 Pip saves resume with the same original winning fingerprint',async()=>{
 const fixture=JSON.parse(await readFile(new URL('fixtures/clockwork-v031-trail.json',import.meta.url),'utf8'));let trail=(await restoreTrail(fixture.checkpoint)).trail;for(const action of fixture.remaining)trail=advanceRewind(trail,action);assert.equal(trail.run.status,'won');assert.equal(runFingerprint(trail.run),fixture.finalFingerprint);
});
test('Use and single-step creator proofs use version 4 while old companion maps retain version 3',async()=>{
 const {clockworkWorld}=await import('../src/clockwork-worlds.mjs');assert.equal(clockworkWorld('first-loop').version,3);const world=orchestraWorld('little-switch');assert.equal(world.version,4);assert.throws(()=>normalizeAdventure({...world,version:6}),/version/);const old=clockworkWorld('first-loop',{proof:false});assert.equal(editAdventure(old,{proof:{difficulty:'trail',actions:['clockwork-step']}}).version,4);
});
test('Use survives world/assembly transforms, and the complete six-chapter book is portable',()=>{
 const world=orchestraWorld('little-switch',{proof:false});let next=world;for(let i=0;i<4;i++)next=transformAdventure(next,'rotate');assert.deepEqual(next,world);assert.deepEqual(transformAdventure(transformAdventure(world,'mirror-y'),'mirror-y'),world);
 const assembly=captureAssembly(world,{x:1,y:1,width:3,height:3},'Pip’s cards');assert.deepEqual(rotateAssembly(assembly).markers.find(m=>m.kind==='clockwork').program,['right','right','use']);assert.deepEqual(rotateAssembly(assembly,1).markers.find(m=>m.kind==='clockwork').program,['down','down','use']);assert.deepEqual(parseBook(serializeBook(orchestraBook())),normalizeBook(orchestraBook()));
});

test('all 216 programs rehearse within map bounds without changing the live run',()=>{
 const run=createRun(adventureStage(orchestraWorld('little-switch'))),before=structuredClone(run);let count=0;
 for(const a of CLOCKWORK_COMMANDS)for(const b of CLOCKWORK_COMMANDS)for(const c of CLOCKWORK_COMMANDS){const preview=clockworkRehearsal(run,canEnter,[a,b,c]);assert.equal(preview.length,6);for(const p of preview){assert.ok(Number.isInteger(p.x)&&p.x>=0&&p.x<run.stage.map.width);assert.ok(Number.isInteger(p.y)&&p.y>=0&&p.y<run.stage.map.height);assert.equal(typeof p.result,'string');}count++;}
 assert.equal(count,216);assert.deepEqual(run,before);
});

test('new-format companion maps reveal Pip and its surroundings from the first frame',()=>{
 const run=createRun(adventureStage(orchestraWorld('automaton-fair')));assert.equal(run.stage.clockworkSharedSight,true);assert.equal(run.seen[run.clockwork.y*run.stage.map.width+run.clockwork.x],true);assert.equal(run.seen[run.clockwork.y*run.stage.map.width+run.clockwork.x+1],true);assert.equal(run.turns,0);
});
test('a newly recorded single-step clear upgrades an older companion map into a portable verified world',async()=>{
 const {clockworkWorld}=await import('../src/clockwork-worlds.mjs'),old=clockworkWorld('first-loop',{proof:false}),actions=[...Array(4).fill('clockwork-step'),...Array(7).fill('right'),...Array(7).fill('left'),'down'];
 let run=createRun(adventureStage(old));for(const action of actions)run=stepRun(run,action);assert.equal(run.status,'won');const updated=editAdventure(old,{proof:{difficulty:'trail',actions}});assert.equal(old.version,3);assert.equal(updated.version,4);assert.equal((await verifyAdventureProof(parseAdventure(serializeAdventure(updated)))).status,'won');
});
