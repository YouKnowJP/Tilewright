import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,stepRun,gateIsOpen} from '../src/adventure.mjs';
import {createCampaign} from '../src/adventure-levels.mjs';
import {openingTrailGoal,trailFeedback,openingTrailSubtitle,openingKeeperText} from '../src/adventure-opening.mjs';
const start=id=>createRun(createCampaign().find(stage=>stage.id===id));
const walk=(run,actions)=>actions.reduce(stepRun,run);

test('opening goals follow the key, gate, and final beacon without mutating a run',()=>{
 let run=start('trail-1');assert.match(trailFeedback(run),/brass key north/);
 assert.match(openingKeeperText(run.stage,run.stage.npcs[0].lines[1]),/current tile/);
 assert.match(openingKeeperText(run.stage,run.stage.npcs[0].choices[1].response),/Open Tools/);
 assert.match(openingTrailSubtitle(start('trail-3').stage),/Two crates/);
 run=walk(run,['up','up','up','up','right']);assert.equal(run.keyCount,1);assert.match(openingTrailGoal(run),/key to the gate/);
 const opened={...run,openGates:['brass-gate']};assert.match(openingTrailGoal(opened),/remaining lanterns/);
 const all={...opened,collectedLanterns:run.stage.lanterns.map(l=>l.id),events:[{type:'lantern'}]};
 const before=JSON.stringify(all);assert.match(trailFeedback(all),/Reach the turquoise beacon/);assert.equal(JSON.stringify(all),before);
 assert.equal(openingTrailGoal({...all,status:'won'}),'');assert.equal(openingTrailGoal(start('trail-4')),'');
});
test('push guidance distinguishes a parked crate from a player temporarily holding its plate',()=>{
 const parked=walk(start('trail-2'),['right','right']);assert.match(trailFeedback(parked),/Crate parked/);
 const off=stepRun(parked,'right');assert.match(trailFeedback(off),/stepping away will release it/);
 const away=stepRun(off,'up');assert.equal(gateIsOpen(away,away.stage.gates[0]),false);assert.match(openingTrailGoal(away),/Undo the push/);
 assert.match(openingTrailGoal(parked),/Walk around/);
});
test('the two-plate opening goal never claims the crossing is ready after only one crate',()=>{
 const run=walk(start('trail-3'),['up','right','right']);assert.match(openingTrailGoal(run),/One of two/);
 assert.equal(gateIsOpen(run,run.stage.gates[0]),false);
 const both={...run,crates:run.stage.plates.map((p,i)=>({...p,id:run.crates[i].id}))};
 assert.match(openingTrailGoal(both),/Find the west-bank brass key/);assert.match(openingTrailGoal({...both,keyCount:1}),/Carry the key/);
});
test('urgent collision, blocked, and win messages take priority over routine crate feedback',()=>{
 const run=walk(start('trail-2'),['right','right']);
 const hurt={...run,events:[...run.events,{type:'hurt'}],message:'A warden catches you. Watch enemy steps and ember cycles.'};
 assert.match(trailFeedback(hurt),/Undo restores this turn and your heart/);
 const lost={...hurt,status:'lost',message:'The trail grows dark. Try again.'};assert.equal(trailFeedback(lost),lost.message);
 const won={...run,status:'won',message:'Trail complete!'};assert.equal(trailFeedback(won),won.message);
 const blocked=stepRun(start('trail-1'),'left');assert.equal(trailFeedback(blocked),blocked.message);
});
