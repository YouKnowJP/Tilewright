import test from 'node:test';
import assert from 'node:assert/strict';
import { STORY_LEVELS, storyAdventure } from '../src/storybook-adventures.mjs';
import { STORY_CLEARS } from '../src/story-adventure-clears.mjs';
import { STORY_ALTERNATIVES } from './fixtures/story-alternatives.mjs';
import { adventureKey, adventureStage, checkAdventure, verifyAdventureProof } from '../src/workshop-model.mjs';
import { serializeAdventure, parseAdventure } from '../src/workshop-sharing.mjs';
import { createRun, stepRun, resultFor, missionGoals, gateIsOpen, turnTarget } from '../src/adventure.mjs';
import { featuredBooks } from '../src/storybook-worlds.mjs';
import { serializeBook, parseBook, bookKey, beginBook, chooseChapter, bookStage, finishChapter, bookHonors } from '../src/storybook-model.mjs';

const play=(id,actions=STORY_CLEARS[id].actions,difficulty='trail')=>actions.reduce(stepRun,createRun(adventureStage(storyAdventure(id)),{difficulty}));
for(const level of STORY_LEVELS)for(const difficulty of ['trail','nemesis'])test(`Original chapter: ${level.title}, clean ${difficulty} completion`,()=>{
  const pack=storyAdventure(level.id),before=structuredClone(pack),report=checkAdventure(pack);assert.deepEqual(report.errors,[]);
  const run=play(level.id,pack.proof.actions,difficulty);assert.equal(run.status,'won');assert.equal(run.dialogue,null);assert.equal(run.damage,0);assert.equal(resultFor(run).stars,3);assert.ok(run.turns<=turnTarget(run));assert.ok(missionGoals(run).every(goal=>goal.done));assert.deepEqual(pack,before);
});
test('all eight new creator journals verify after portable world and whole-book exports',async()=>{
  assert.equal(STORY_LEVELS.length,8);const keys=new Set();
  for(const level of STORY_LEVELS){const world=parseAdventure(serializeAdventure(storyAdventure(level.id)));assert.equal((await verifyAdventureProof(world)).status,'won');keys.add(adventureKey(world));}
  assert.equal(keys.size,8);const books=featuredBooks().filter(book=>book.chapters.every(chapter=>chapter.world.source==='Storybook original')&&!book.chapters.some(chapter=>chapter.routes));assert.equal(books.length,3);
  for(const book of books){const restored=parseBook(serializeBook(book));assert.equal(restored.chapters.length,book.chapters.length);assert.equal(bookKey(restored),bookKey(book));for(const difficulty of ['trail','nemesis']){let session=beginBook(restored,difficulty);for(const chapter of restored.chapters){session=chooseChapter(session,'swift');session=finishChapter(session,chapter.world.proof.actions.reduce(stepRun,createRun(bookStage(session),{difficulty})));}assert.equal(session.phase,'won');assert.equal(bookHonors(session),book.chapters.length);}}
});
for(const [id,actions]of Object.entries(STORY_ALTERNATIVES))for(const difficulty of ['trail','nemesis'])test(`Alternate chapter solution: ${id} / ${difficulty}`,()=>{
  const run=play(id,actions,difficulty);assert.equal(run.status,'won');assert.equal(run.damage,0);
  if(id==='remembering'){assert.equal(run.guild.uses,0);assert.ok(run.crates.some(crate=>crate.x===6&&crate.y===7));}
  if(id==='undelivered'){assert.equal(run.choices.nessa,'shield');assert.equal(run.switches['post-wheel'],true);}
  if(id==='rainhome'||id==='constellation')assert.equal(run.collectedCoins.length,run.stage.coins.length);
  if(id==='constellation'){assert.ok(run.guild.uses>=2);assert.ok(run.shields<3);}
});
test('the memory crossing supports both a temporary double and a persistent counterweight',()=>{
  const ordinary=play('remembering');assert.equal(ordinary.guild.uses,1);assert.ok(ordinary.crates.some(crate=>crate.y===4));
  const crate=play('remembering',STORY_ALTERNATIVES.remembering);assert.equal(crate.guild.uses,0);assert.ok(crate.stage.gates.filter(gate=>gate.type==='bridge').every(gate=>gateIsOpen(crate,gate)));
});
test('time-island route makes six real jumps, completes the ordered bells, and delivers cargo',()=>{
  const run=play('seconds');assert.equal(run.guild.warps,6);assert.equal(run.cargoDelivered,true);assert.equal(run.relayProgress,3);assert.equal(run.collectedCoins.length,2);assert.equal(run.carrying,false);
});
test('both finales require all keeper rescues and the parcel; touching home early cannot skip them',()=>{
  for(const id of ['rainhome','everyone']){const stage=adventureStage(storyAdventure(id)),early=['right','down'].reduce(stepRun,createRun(stage));assert.equal(early.status,'playing');assert.ok(missionGoals(early).some(goal=>!goal.done));
    const run=play(id);assert.equal(run.cargoDelivered,true);assert.deepEqual(new Set(run.rescued),new Set(stage.requiredRescues));assert.equal(run.companions.length,stage.requiredRescues.length);}
  assert.equal(play('rainhome').rescued.length,2);assert.equal(play('everyone').relayProgress,3);
});
test('sluice routes stay locked until their own wheel turns and both wheels remain mission goals',()=>{
  const run=createRun(adventureStage(storyAdventure('sluices')));assert.ok(run.stage.gates.every(gate=>!gateIsOpen(run,gate)));
  const changed=stepRun(run,'interact:west-wheel');assert.ok(changed.stage.gates.filter(gate=>gate.id.startsWith('amber')).every(gate=>gateIsOpen(changed,gate)));assert.ok(changed.stage.gates.filter(gate=>gate.id.startsWith('jade')).every(gate=>!gateIsOpen(changed,gate)));
  assert.deepEqual(run.switches,{'west-wheel':false,'east-wheel':false});assert.ok(play('sluices').switches['east-wheel']);
});
test('a wrong orchard note resets the song without softlocking the map',()=>{
  const prefix=['right','right','right','interact:river','left','left','left'],before=play('orchard',prefix);assert.equal(before.relayProgress,0);assert.ok(before.alarm>0);
  const run=STORY_CLEARS.orchard.actions.reduce(stepRun,before);assert.equal(run.status,'won');assert.equal(run.relayProgress,4);assert.equal(run.collectedCoins.length,4);assert.equal(run.damage,0);
});
test('the constellation sentinel pursues exposed movement while the outer-fern route remains quiet',()=>{
  for(const difficulty of ['trail','nemesis']){const actions=STORY_CLEARS.constellation.actions,index=actions.indexOf('interact:field-pack');let run=play('constellation',actions.slice(0,index+1),difficulty),alert=false;
    for(const action of ['down','down','down','down','down']){run=stepRun(run,action);alert||=run.hunters.some(hunter=>['pursuing','intercepting','searching'].includes(hunter.mode));}assert.ok(alert);
    const quiet=play('constellation',undefined,difficulty);assert.equal(quiet.damage,0);assert.equal(quiet.guild.uses,0);assert.equal(quiet.shields,difficulty==='nemesis'?2:3);assert.equal(quiet.collectedCoins.length,0);}
});
test('new story worlds are independent snapshots with eight distinct layouts and bounded narrative text',()=>{
  const layouts=new Set();for(const level of STORY_LEVELS){const first=storyAdventure(level.id),second=storyAdventure(level.id);first.map.layers[0].tiles.fill(3);first.markers[0].x=0;assert.notDeepEqual(first,second);assert.notEqual(second.markers[0].x,0);assert.ok(second.markers.some(marker=>marker.id==='start'));layouts.add(JSON.stringify({width:second.map.width,height:second.map.height,layers:second.map.layers.map(layer=>layer.tiles)}));assert.ok(second.intro.length>100);assert.ok(second.ending.length>100);assert.ok(second.markers.some(marker=>marker.kind==='guide'));}
  assert.equal(layouts.size,8);assert.throws(()=>storyAdventure('unknown'),/known story/);
});
