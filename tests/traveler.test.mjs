import test from 'node:test';
import assert from 'node:assert/strict';
import { TRAVELER_CHOICES,DEFAULT_TRAVELER,OUTFITS,normalizeTraveler,travelerDescription } from '../src/traveler-art.mjs';
import { DEFAULT_PREFERENCES,loadPreferences,savePreferences } from '../src/adventure-preferences.mjs';
import { lanternfairWorld,lanternfairBook,LANTERNFAIR_LEVELS } from '../src/storybook-lanternfair.mjs';
import { checkAdventure,adventureStage,verifyAdventureProof } from '../src/workshop-model.mjs';
import { createRun,stepRun,resultFor } from '../src/adventure.mjs';
import { serializeAdventure,parseAdventure } from '../src/workshop-sharing.mjs';
import { serializeBook,parseBook,bookKey } from '../src/storybook-model.mjs';

test('old preferences gain a complete traveler and every cosmetic choice round-trips within the existing save limit',()=>{
  assert.deepEqual(normalizeTraveler(null),DEFAULT_TRAVELER);
  assert.deepEqual(loadPreferences({getItem:()=>JSON.stringify({version:1,preferences:{volume:35}})}),{...DEFAULT_PREFERENCES,volume:35});
  for(const [field,options] of Object.entries(TRAVELER_CHOICES))for(const choice of options){let saved;const next={...DEFAULT_PREFERENCES,[field]:choice.id,travelerName:'灯り 🌙'};assert.ok(savePreferences({setItem:(_,text)=>saved=text},next));assert.ok(saved.length<1000);assert.deepEqual(loadPreferences({getItem:()=>saved}),next);assert.equal(normalizeTraveler({[field]:'unknown'})[field],DEFAULT_TRAVELER[field]);}
});
test('traveler names are bounded printable text; outfit presets preserve independent skin, hair, and name choices',()=>{
  assert.equal(normalizeTraveler({travelerName:' <灯り>\n  🌙 '}).travelerName,'灯り 🌙');assert.equal([...normalizeTraveler({travelerName:'🌙'.repeat(50)}).travelerName].length,24);assert.equal(normalizeTraveler({travelerName:' \n '}).travelerName,'Rowan');
  for(const outfit of OUTFITS){const look=normalizeTraveler({...DEFAULT_TRAVELER,skin:'ebony',hair:'silver',travelerName:'Iris',...outfit});assert.equal(look.skin,'ebony');assert.equal(look.hair,'silver');assert.equal(look.travelerName,'Iris');assert.match(travelerDescription(look),/Iris/);assert.ok(Object.isFrozen(outfit));}
});
for(const id of LANTERNFAIR_LEVELS)for(const difficulty of ['trail','nemesis'])test(`Lanternfair ${id}: real ${difficulty} clear with every treasure, keeper, and peaceful return`,async()=>{
  const world=lanternfairWorld(id),before=structuredClone(world);assert.deepEqual(checkAdventure(world).errors,[]);const portable=parseAdventure(serializeAdventure(world)),stage=adventureStage(portable);assert.equal(stage.hunters.length+stage.enemies.length+stage.hazards.length,0);
  assert.ok(!world.proof.actions.some(action=>action.startsWith('dash')||action==='power'));
  const run=[...Array(12).fill('wait'),...world.proof.actions].reduce(stepRun,createRun(stage,{difficulty}));assert.equal(run.status,'won');assert.equal(run.damage,0);assert.equal(run.collectedCoins.length,3);assert.equal(run.dialogue,null);assert.equal(resultFor(run).stars,3);for(const npc of stage.requiredRescues)assert.ok(run.rescued.includes(npc));if(stage.relic)assert.ok(run.cargoDelivered);assert.equal((await verifyAdventureProof(portable)).status,'won');assert.deepEqual(world,before);
});
test('the four Lanternfair worlds are independent portable chapters and keep a stable shared book identity',()=>{
  const book=lanternfairBook(),copy=parseBook(serializeBook(book));assert.equal(copy.chapters.length,4);assert.equal(bookKey(copy),bookKey(book));const first=lanternfairWorld('pattern');first.title='My fair';first.markers[0].x=3;assert.notEqual(lanternfairWorld('pattern').title,first.title);assert.equal(lanternfairWorld('pattern').markers[0].x,2);
});
