import test from 'node:test';
import assert from 'node:assert/strict';
import { createCampaign } from '../src/adventure-levels.mjs';
import { createRun,nearbyInteractions } from '../src/adventure.mjs';
import { adventureStage } from '../src/workshop-model.mjs';
import { lanternfairWorld,LANTERNFAIR_LEVELS } from '../src/storybook-lanternfair.mjs';
import { beginRewind,advanceRewind,canRewind,undoRewind,serializeTrail,readTrail,restoreTrail,runFingerprint,REWIND_LIMIT } from '../src/adventure-rewind.mjs';
const campaign=createCampaign();
const cases=[...campaign.filter((_,i)=>i%3===0).map(stage=>({stage,source:{kind:'story',id:stage.id}})),...LANTERNFAIR_LEVELS.map(id=>{const world=lanternfairWorld(id);return {stage:adventureStage(world),source:{kind:'world',origin:'shelf',world}};})];
for(const {stage,source}of cases)for(const difficulty of ['trail','nemesis'])test(`${stage.name}: seeded action/Undo/save interleavings replay exactly on ${difficulty}`,async()=>{
  for(const seed of [1,17,91]){let value=seed,trail=beginRewind(createRun(stage,{difficulty}),source);const random=()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value;};
    for(let step=0;step<64&&trail.run.status==='playing';step++){
      const previousRun=trail.run,before=structuredClone(previousRun),interactions=nearbyInteractions(trail.run),actions=['up','right','down','left','wait','dash-up','dash-right','dash-down','dash-left','decoy','shield','power',...interactions.map(item=>`interact:${item.id}`)],action=trail.run.dialogue?'close-dialogue':actions[random()%actions.length];
      trail=advanceRewind(trail,action);assert.deepEqual(previousRun,before);assert.ok(trail.past.length<=REWIND_LIMIT);assert.ok(trail.run.health>=0&&trail.run.health<=3);assert.ok(trail.run.energy>=0&&trail.run.energy<=3);
      if(step%11===0&&canRewind(trail)){const prior=trail;trail=undoRewind(trail);assert.equal(trail.past.length<prior.past.length,true);}
      if(step%13===0&&trail.run.status!=='won'){const restored=(await restoreTrail(readTrail(serializeTrail(trail)))).trail;assert.equal(runFingerprint(restored.run),runFingerprint(trail.run));assert.deepEqual(restored.actions,trail.actions);trail=restored;}
    }
    if(trail.run.status!=='won')assert.equal(runFingerprint((await restoreTrail(readTrail(serializeTrail(trail)))).trail.run),runFingerprint(trail.run));
  }
});
