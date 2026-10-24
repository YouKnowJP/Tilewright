import test from 'node:test';import assert from 'node:assert/strict';
import { DEFAULT_PREFERENCES,normalizePreferences,loadPreferences,savePreferences } from '../src/adventure-preferences.mjs';
import { boardWindow,mechanismNumbers,surroundings,mapMarkers } from '../src/adventure-accessibility.mjs';
import { welcomeWorld,WELCOME_LEVELS } from '../src/storybook-welcome.mjs';
import { adventureStage,verifyAdventureProof,checkAdventure } from '../src/workshop-model.mjs';
import { createRun,stepRun } from '../src/adventure.mjs';
import { beginRewind,advanceRewind,serializeTrail,restoreTrail,runFingerprint } from '../src/adventure-rewind.mjs';

test('old journeys inherit safe display defaults; all accessibility choices survive a backup-compatible roundtrip',()=>{
  const old={volume:50,motion:'system',text:'large'};assert.deepEqual(loadPreferences({getItem:()=>JSON.stringify({version:1,preferences:old})}),{...DEFAULT_PREFERENCES,...old});
  const next={...DEFAULT_PREFERENCES,text:'largest',contrast:'high',mapCues:'on',mapZoom:'largest',readingView:'on'};let saved;assert.ok(savePreferences({setItem:(_,value)=>saved=value},next));assert.deepEqual(loadPreferences({getItem:()=>saved}),next);
  for(const key of ['text','contrast','mapCues','mapZoom','readingView'])assert.equal(normalizePreferences({...next,[key]:'bad'})[key],DEFAULT_PREFERENCES[key]);
});
test('closer map sizes enlarge tiles while retaining a usable camera at narrow and very short viewports',()=>{
  const map={width:64,height:48};for(const [w,h]of [[80,80],[288,170],[760,400],[1440,900]]){let previous=Infinity;for(const zoom of ['standard','large','largest']){const view=boardWindow(map,w,h,zoom);assert.ok(view.columns<=previous);assert.ok(view.columns>=4&&view.rows>=4);assert.ok(view.columns<=map.width&&view.rows<=map.height);previous=view.columns;}}
  assert.deepEqual(boardWindow({width:3,height:2},500,500,'largest'),{columns:3,rows:2});
});
test('mechanism labels match both workshop channels and many-to-many campaign connections',()=>{
  const stage=adventureStage(welcomeWorld('bridge')),labels=mechanismNumbers(stage);assert.equal(labels.weight,labels['waiting-span']);
  const campaign={gates:[{id:'a',plates:['p','q']},{id:'b',plates:['q','r']},{id:'c',controls:[{id:'wheel',on:true}]},{id:'key'}],waystones:[{id:'west',partner:'east'},{id:'east',partner:'west'}]};
  const groups=mechanismNumbers(campaign);for(const id of ['a','b','p','q','r'])assert.equal(groups[id],groups.a);assert.notEqual(groups.a,groups.c);assert.equal(groups.c,groups.wheel);assert.equal(groups.west,groups.east);assert.equal(groups.key,undefined);
});
test('reading the map and toggling visual aids cannot spend turns, reveal unseen landmarks, or change a checkpoint',async()=>{
  const world=welcomeWorld('key');let trail=beginRewind(createRun(adventureStage(world)),{kind:'world',world,origin:'shelf'});trail=advanceRewind(trail,'up');const before=serializeTrail(trail),fingerprint=runFingerprint(trail.run),seen=[...trail.run.seen];
  for(let i=0;i<10;i++){const view=surroundings(trail.run);assert.equal(view.directions.length,4);assert.ok(view.position.includes('column'));assert.ok(!view.landmarks.some(line=>line.includes('column 12')));assert.ok(mapMarkers(trail.run).every(p=>seen[p.y*world.map.width+p.x]));}
  assert.equal(serializeTrail(trail),before);assert.equal(runFingerprint(trail.run),fingerprint);assert.deepEqual(trail.run.seen,seen);assert.equal(runFingerprint((await restoreTrail(JSON.parse(before))).trail.run),fingerprint);
});
for(const id of WELCOME_LEVELS)for(const difficulty of ['trail','nemesis'])test(`Welcome ${id}: actual ${difficulty} creator clear, peaceful hazards, no dash or timed power requirement`,async()=>{
  const world=welcomeWorld(id),before=structuredClone(world);assert.deepEqual(checkAdventure(world).errors,[]);const stage=adventureStage(world);assert.equal(stage.enemies.length+stage.hunters.length+stage.hazards.length,0);assert.ok(!world.proof.actions.some(action=>action.startsWith('dash')||action==='power'));
  const run=[...Array(20).fill('wait'),...world.proof.actions].reduce(stepRun,createRun(stage,{difficulty}));assert.equal(run.status,'won');assert.equal(run.damage,0);assert.equal(run.dialogue,null);assert.equal((await verifyAdventureProof(world)).status,'won');assert.deepEqual(world,before);
});
test('reading neighbors distinguishes an actionable key gate, blocked crate, and a usable bridge without color',()=>{
  let run=createRun(adventureStage(welcomeWorld('bridge')));for(const action of ['up','up','right'])run=stepRun(run,action);
  assert.match(surroundings(run).directions.join(' '),/East: crate; step to push/);run=stepRun(run,'right');assert.ok(surroundings(run).landmarks.some(line=>line.includes('Pressure plate: held · link 1')));
});
