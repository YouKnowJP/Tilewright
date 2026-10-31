import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {PARCELWORKS_LEVELS,PARCELWORKS_CLEARS,parcelworksWorld,parcelworksBook} from '../src/pip-parcelworks-worlds.mjs';
import {createRun,stepRun,resultFor,canEnter} from '../src/adventure.mjs';
import {adventureStage,checkAdventure,editAdventure,placeObject,verifyAdventureProof,blankAdventure} from '../src/workshop-model.mjs';
import {serializeAdventure,parseAdventure,adventurePlayLink,parseAdventureCode} from '../src/workshop-sharing.mjs';
import {serializeBook,parseBook} from '../src/storybook-model.mjs';
import {beginRewind,advanceRewind,undoRewind,serializeTrail,restoreTrail,runFingerprint} from '../src/adventure-rewind.mjs';
import {trailReview,inspectReview,reviewFrame} from '../src/adventure-reviews.mjs';
import {clockworkRehearsal,transformProgram} from '../src/clockwork.mjs';
import {captureAssembly,pasteAssembly,rotateAssembly} from '../src/workshop-assemblies.mjs';
import {transformAdventure} from '../src/workshop-lab.mjs';import {rotateRoom} from '../src/adventure-wonders.mjs';
import {walkableCells} from '../src/adventure.mjs';import {mapMarkers,surroundings} from '../src/adventure-accessibility.mjs';

for(const id of PARCELWORKS_LEVELS)for(const difficulty of ['trail','nemesis'])test(`Parcelworks ${id} wins cleanly on ${difficulty} and round-trips its proof`,async()=>{
 const world=parcelworksWorld(id),copy=structuredClone(world),report=checkAdventure(world);assert.deepEqual(report.errors,[]);assert.equal(world.version,6);
 let run=createRun(report.stage,{difficulty});for(const action of PARCELWORKS_CLEARS[id])run=stepRun(run,action);
 assert.equal(run.status,'won');assert.equal(resultFor(run).stars,3);assert.equal(run.damage,0);assert.equal(run.clockwork.delivered.length,world.markers.filter(m=>m.kind==='pip-stop').length);assert.equal(run.clockwork.running,false);
 assert.equal((await verifyAdventureProof(world)).status,'won');assert.deepEqual(parseAdventure(serializeAdventure(world)),world);assert.deepEqual(parseAdventureCode(adventurePlayLink(world,'https://example.com/play/')),world);assert.deepEqual(world,copy);
});
const start=()=>createRun(adventureStage(parcelworksWorld('across-the-air')));
for(const id of PARCELWORKS_LEVELS)for(const difficulty of ['trail','nemesis'])test(`Parcelworks ${id} also supports the all-treasure challenge on ${difficulty}`,()=>{
 const source=parcelworksWorld(id,{proof:false}),world=editAdventure(source,{rules:{allCoins:true}}),actions=PARCELWORKS_CLEARS[id];let run=createRun(adventureStage(world),{difficulty});
 for(const action of actions.slice(0,actions.indexOf('left')))run=stepRun(run,action);
 const row=run.player.y,far=world.map.width-2,bottom=world.map.height-2,detour=[...Array(far-run.player.x).fill('right'),'up',...Array(bottom-row+1).fill('down'),...Array(bottom-row).fill('up'),...Array(far-2).fill('left'),'down'];
 for(const action of detour)run=stepRun(run,action);assert.equal(run.status,'won');assert.equal(run.collectedCoins.length,2);assert.equal(resultFor(run).stars,3);
});
test('only Use travels through a tube, one endpoint per card, and an exit delivery counts immediately',()=>{
 let run=stepRun(start(),'clockwork-program:right,use,right');run=stepRun(run,'clockwork-step');assert.deepEqual([run.clockwork.x,run.clockwork.y],[3,2]);assert.equal(run.clockwork.delivered.length,1);
 run=stepRun(run,'clockwork-step');assert.deepEqual([run.clockwork.x,run.clockwork.y],[9,2]);assert.equal(run.clockwork.delivered.length,2);assert.match(run.message,/delivered stop 2/);
 const atExit={...run,clockwork:{...run.clockwork,program:['wait','wait','wait'],index:0}};assert.equal(stepRun(atExit,'clockwork-step').clockwork.x,9);
 const back={...run,clockwork:{...run.clockwork,program:['use','wait','wait'],index:0}};assert.equal(stepRun(back,'clockwork-step').clockwork.x,3);
 const keeper=stepRun({...atExit,player:{x:3,y:2}},'wait');assert.equal(keeper.player.x,3);assert.equal(keeper.clockwork.x,9);
});
test('a crate-blocked or otherwise unsafe tube exit consumes its card without teleporting',()=>{
 let run=stepRun(stepRun(start(),'clockwork-program:right,use,right'),'clockwork-step');const exit=run.stage.clockworkTubes[1];
 for(const patch of [{crates:[{id:'obstruction',x:exit.x,y:exit.y}]},{stage:{...run.stage,clockworkTubes:run.stage.clockworkTubes.map(t=>t.id===exit.id?{...t,x:0,y:0}:t)}}]){
  const before={...run,...patch},after=stepRun(before,'clockwork-step');assert.equal(after.clockwork.x,3);assert.equal(after.clockwork.index,2);assert.equal(after.turns,before.turns+1);assert.match(after.clockwork.last,/exit blocked/);assert.deepEqual(after.clockwork.delivered,['flag-1']);
 }
});
test('Pip travels on an ordinary running turn and tube rehearsal is free and immutable',()=>{
 let run=stepRun(start(),'clockwork-program:right,use,right');run=stepRun(run,'clockwork-toggle');run=stepRun(run,'wait');const copy=structuredClone(run),preview=clockworkRehearsal(run,canEnter,['use','right','right']);assert.deepEqual([preview[0].x,preview[0].y],[9,2]);assert.deepEqual(run,copy);run=stepRun(run,'wait');assert.equal(run.clockwork.x,9);assert.equal(run.player.x,2);
});
test('creator diagnostics reject incomplete pairs, missing Pip, extra endpoints and landless tubes',()=>{
 const source=parcelworksWorld('across-the-air',{proof:false}),markers=source.markers;
 for(const changed of [markers.filter(m=>m.id!=='amber-out'),markers.filter(m=>m.kind!=='clockwork'),[...markers,{kind:'pip-tube',id:'third-end',x:10,y:2,channel:'amber'}],markers.map(m=>m.id==='amber-out'?{...m,channel:'jade'}:m),markers.map(m=>m.id==='amber-out'?{...m,x:8,y:2}:m)])assert.equal(checkAdventure(editAdventure(source,{markers:changed})).ready,false);
 const stage=adventureStage(source);assert.throws(()=>createRun({...stage,clockworkTubes:stage.clockworkTubes.map(t=>({...t,partner:'missing'}))}),/paired/);
});
test('painting eight tube endpoints auto-pairs four channels; repaint preserves names and links',()=>{
 let world=blankAdventure();for(let n=0;n<8;n++)world=placeObject(world,'pip-tube',3+n,5);assert.deepEqual(world.markers.filter(m=>m.kind==='pip-tube').map(m=>m.channel),['amber','amber','jade','jade','violet','violet','blue','blue']);
 world=placeObject(world,'pip-tube',7,5,{name:'Quiet post'});world=placeObject(world,'pip-tube',7,5);const tube=world.markers.find(m=>m.x===7&&m.y===5);assert.equal(tube.name,'Quiet post');assert.equal(tube.channel,'violet');assert.equal(world.markers.filter(m=>m.kind==='pip-tube').length,8);
});
test('tube connectivity reaches isolated Pip-only instruments without inventing a keeper route',()=>{
 const world=parcelworksWorld('midnight-reply',{proof:false});assert.equal(checkAdventure(world).ready,true);const removed=editAdventure(world,{markers:world.markers.filter(m=>m.kind!=='pip-tube')});assert.match(checkAdventure(removed).errors.join(' '),/disconnected/);
 const keeperGoal=editAdventure(world,{markers:[...world.markers,{id:'remote-light',kind:'lantern',x:11,y:4}]});assert.match(checkAdventure(keeperGoal).errors.join(' '),/disconnected/);
});
test('tube travel, deliveries, rewrites, Continue, Undo and completed review agree exactly',async()=>{
 const world=parcelworksWorld('night-mail'),actions=PARCELWORKS_CLEARS['night-mail'];let trail=beginRewind(createRun(adventureStage(world)),{kind:'world',world,origin:'shelf'});
 for(const action of actions.slice(0,12))trail=advanceRewind(trail,action);const before=runFingerprint(trail.run);assert.equal(trail.run.clockwork.delivered.length,6);
 trail=(await restoreTrail(JSON.parse(serializeTrail(trail)))).trail;assert.equal(runFingerprint(trail.run),before);const edited=advanceRewind(trail,actions[12]);assert.equal(edited.run.clockwork.rewritesUsed,2);assert.equal(runFingerprint(undoRewind(edited).run),before);
 for(const action of actions.slice(12))trail=advanceRewind(trail,action);assert.equal(trail.run.status,'won');const review=await inspectReview(trailReview(trail));assert.deepEqual(await reviewFrame(review.seed,review.seed.actions.length),trail.run);
});
test('tube assemblies require both ends, safely remap channels, and rotate with their programs',()=>{
 const world=parcelworksWorld('across-the-air',{proof:false});assert.throws(()=>captureAssembly(world,{x:3,y:2,width:1,height:1},'Half a tube'),/whole/);
 const assembly=captureAssembly(world,{x:2,y:2,width:10,height:1},'Air route');let rotated=assembly;for(let n=0;n<4;n++)rotated=rotateAssembly(rotated,1);assert.deepEqual(rotated,assembly);
 const target=placeObject(blankAdventure(),'plate',1,2,{channel:'amber'}),pasted=pasteAssembly(target,assembly,{x:3,y:3});assert.deepEqual(pasted.markers.filter(m=>m.kind==='pip-tube').map(m=>m.channel),['amber','amber']);assert.equal(checkAdventure(pasted).ready,true);
 const occupied=placeObject(placeObject(target,'pip-tube',1,4),'pip-tube',1,5),appended=pasteAssembly(occupied,assembly,{x:3,y:3});assert.deepEqual(appended.markers.filter(m=>m.kind==='pip-tube').map(m=>m.channel),['amber','amber','jade','jade']);
 const independent=editAdventure(world,{markers:[...world.markers,{kind:'lever',id:'independent-wheel',x:3,y:9,channel:'amber'}]});assert.equal(captureAssembly(independent,{x:2,y:2,width:10,height:1},'Tube pair without unrelated wheel').markers.filter(m=>m.kind==='pip-tube').length,2);
});
test('whole-map transformations preserve tube pairs and rotating rooms carry endpoint positions',()=>{
 const world=parcelworksWorld('across-the-air',{proof:false});let rotated=world;for(let n=0;n<4;n++)rotated=transformAdventure(rotated,'rotate');assert.deepEqual(rotated,world);assert.deepEqual(transformAdventure(transformAdventure(world,'mirror-x'),'mirror-x'),world);
 const dial={id:'test-dial',x:3,y:3,radius:1},run=createRun({...adventureStage(world),turntables:[dial]}),turned=rotateRoom(run,dial,walkableCells);assert.deepEqual([turned.stage.clockworkTubes[0].x,turned.stage.clockworkTubes[0].y],[4,3]);assert.equal(turned.stage.clockworkTubes[0].partner,'amber-out');assert.equal(run.stage.clockworkTubes[1].x,9);
});
test('tube labels expose numeric links and destinations to non-color and text navigation',()=>{
 const run=start();run.seen.fill(1);assert.equal(mapMarkers(run).filter(m=>m.label==='U').length,2);assert.ok(mapMarkers(run).filter(m=>m.label==='U').every(m=>m.number==='1'));assert.match(JSON.stringify(surroundings(run)),/amber arrival at column 10, row 3/);
});
test('draft program transforms preserve Use and Wait, do not mutate input and have valid inverses',()=>{
 for(const cards of [['right','use','down'],['left','wait','up'],['use','wait','use']]){const original=[...cards];let rotated=cards;for(let n=0;n<4;n++)rotated=transformProgram(rotated,'rotate');assert.deepEqual(rotated,cards);for(const op of ['mirror','reverse'])assert.deepEqual(transformProgram(transformProgram(cards,op),op),cards);assert.deepEqual(cards,original);}
 assert.deepEqual(transformProgram(['right','right','use'],'mirror'),['left','left','use']);assert.throws(()=>transformProgram(['right','use','wait'],'unknown'));assert.throws(()=>transformProgram(['right'],'rotate'));
});
test('the five-chapter storybook is portable and the v0.33 checkpoint keeps its original win',async()=>{
 assert.deepEqual(parseBook(serializeBook(parcelworksBook())),parcelworksBook());const fixture=JSON.parse(await readFile(new URL('fixtures/pip-v033-trail.json',import.meta.url),'utf8'));let trail=(await restoreTrail(fixture.checkpoint)).trail;for(const action of fixture.remaining)trail=advanceRewind(trail,action);assert.equal(trail.run.status,'won');assert.equal(runFingerprint(trail.run),fixture.finalFingerprint);
});
