import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ORCHESTRA_LEVELS,ORCHESTRA_CLEARS,orchestraWorld} from '../../src/pip-orchestra-worlds.mjs';
import {serializeAdventure,parseAdventure} from '../../src/workshop-sharing.mjs';
import {verifyAdventureProof} from '../../src/workshop-model.mjs';
import {TRAIL_SAVE_KEY} from '../../src/adventure-rewind.mjs';
import {clickControl,chooseOption} from './ui-driver.mjs';
import {playGuild} from './guild-browser-checks.mjs';
const checkpoint=page=>page.evaluate(key=>localStorage.getItem(key),TRAIL_SAVE_KEY);
async function openBook(page){await page.locator('#title-play').click();await page.locator('#front-books').click();await page.locator('#book-search').fill('Pip and the Pocket Orchestra');await page.locator('#book-covers .front-primary').click();assert.equal(await page.evaluate(()=>scrollY),0);}
async function importWorld(page,world){await page.locator('#title-workshop').click();await page.locator('#ws-tab-import').click();await page.locator('#ws-file').setInputFiles({name:'pip-orchestra.trail.json',mimeType:'application/json',buffer:Buffer.from(serializeAdventure(world))});await page.locator('#ws-preview-dialog').waitFor();}
async function downloadWorld(page){const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#ws-download').click()]),chunks=[];for await(const chunk of await download.createReadStream())chunks.push(chunk);return parseAdventure(Buffer.concat(chunks).toString());}
export async function pipOrchestraScenarios(scenario){
 for(const width of [390,1440])await scenario(`pip-orchestra-six-chapters-${width}`,width,async page=>{
  await openBook(page);
  for(const [index,id]of ORCHESTRA_LEVELS.entries()){
   await page.locator('[data-book-challenge=clean]').click();await page.locator('#book-continue').click();const actions=ORCHESTRA_CLEARS[id];
   if(index===2){await playGuild(page,actions.slice(0,6),true);const saved=await checkpoint(page),turns=await page.locator('#game-turns').textContent();await page.locator('#game-home').click();await page.reload();await page.locator('#title-continue').click();assert.equal(await checkpoint(page),saved);assert.equal(await page.locator('#game-turns').textContent(),turns);await clickControl(page,'#game-undo',true);await playGuild(page,[actions[5],...actions.slice(6)],true);}
   else await playGuild(page,actions,true);
   await page.locator('#adventure[data-status=won]').waitFor();assert.equal(await page.locator('#game-stars').textContent(),'★★★');assert.equal(await page.locator('#game-health').getAttribute('aria-label'),'Health: 3 of 3');await page.locator('#game-primary').click();
  }
  assert.match(await page.locator('#book-camp-kicker').textContent(),/LAST PAGE/);assert.match(await page.locator('#book-tally').textContent(),/6 chapters restored/);assert.match(await page.locator('#book-tally').textContent(),/6 honors/);
 });
 await scenario('pip-recipes-rehearsal-keys-and-large-text',390,async page=>{
  await openBook(page);await page.locator('#book-continue').click();await clickControl(page,'#game-shell-options');await page.locator('[data-text-size=largest]').click();await page.locator('#settings-tab-access').click();await chooseOption(page,'#settings-contrast','high');await page.locator('#settings-close').click();
  for(const [width,height]of [[320,568],[844,390],[768,900],[1440,1000]]){
   await page.setViewportSize({width,height});await clickControl(page,'#game-clockwork');await page.locator('#clockwork-state').click();const before=await checkpoint(page);for(const key of ['ArrowUp','Space','z','r','e'])await page.keyboard.press(key);
   if(!await page.locator('#clockwork-recipes').evaluate(n=>n.open))await page.locator('#clockwork-recipes>summary').click();await page.locator('[data-clockwork-recipe=melody]').click();assert.equal(await page.locator('#clockwork-card-1').inputValue(),'use');assert.match(await page.locator('[data-game-select=clockwork-card-1]').textContent(),/Use/);assert.equal(await page.locator('#clockwork-step').isDisabled(),true);
   if(!await page.locator('#clockwork-rehearsal').evaluate(n=>n.open))await page.locator('#clockwork-rehearsal>summary').click();assert.equal(await page.locator('#clockwork-preview>li').count(),6);assert.match(await page.locator('#clockwork-preview').textContent(),/No lever or bell/);assert.equal(await checkpoint(page),before);assert.equal(await page.locator('#game-turns').textContent(),'0');assert.ok(await page.locator('#clockwork-dialog').evaluate(n=>n.scrollWidth<=n.clientWidth+1));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement.id==='adventure-canvas');await clickControl(page,'#game-clockwork');assert.equal(await page.locator('#clockwork-dialog').evaluate(n=>n.scrollTop),0);assert.equal(await page.locator('#clockwork-card-1').inputValue(),'right');await page.locator('#clockwork-close').click();
  }
  await clickControl(page,'#game-clockwork');await page.locator('#clockwork-step').click();assert.equal(await page.locator('#game-turns').textContent(),'1');await clickControl(page,'#game-undo',true);assert.equal(await page.locator('#game-turns').textContent(),'0');
 });
 await scenario('pip-creator-use-cards-export-reload-and-proof',390,async page=>{
  await importWorld(page,orchestraWorld('little-switch'));await page.locator('#ws-preview-remix').click();await page.locator('#ws-inspect-tool').click();const canvas=page.locator('#ws-canvas');await canvas.scrollIntoViewIfNeeded();const box=await canvas.boundingBox();await page.mouse.click(box.x+2.5/15*box.width,box.y+2.5/11*box.height);await page.locator('#ws-object-name').fill('Arpeggio');await chooseOption(page,'#ws-clockwork-card-1','use');await chooseOption(page,'#ws-clockwork-card-2','right');await page.locator('#ws-props-object button[type=submit]').click();await page.locator('#ws-inspector-close').click();await page.locator('#ws-share').click();const world=await downloadWorld(page);assert.equal(world.version,4);assert.deepEqual(world.markers.find(m=>m.kind==='clockwork').program,['right','use','right']);await page.locator('#ws-share-close').click();await page.reload();await page.locator('#title-workshop').click();await page.locator('#ws-tab-build').click();await page.locator('#ws-test').click();await clickControl(page,'#game-clockwork');assert.equal(await page.locator('#clockwork-heading').textContent(),'Arpeggio’s program');await page.locator('#clockwork-close').click();await playGuild(page,ORCHESTRA_CLEARS['little-switch'],true);await page.locator('#adventure[data-status=won]').waitFor();await page.locator('#game-primary').click();assert.match(await page.locator('#ws-draft-state').textContent(),/Clear attached/);await page.locator('#ws-share').click();const proven=await downloadWorld(page);assert.ok(proven.proof.actions.includes('clockwork-step'));assert.equal((await verifyAdventureProof(proven)).status,'won');await page.locator('#ws-share-close').click();
 });
 await scenario('pip-v031-checkpoint-continues-to-original-win',390,async page=>{
  const fixture=JSON.parse(await readFile(new URL('../../tests/fixtures/clockwork-v031-trail.json',import.meta.url),'utf8'));await page.evaluate(({key,data})=>localStorage.setItem(key,JSON.stringify(data)),{key:TRAIL_SAVE_KEY,data:fixture.checkpoint});await page.reload();await page.locator('#title-continue').click();assert.equal(await page.locator('#game-turns').textContent(),String(fixture.checkpoint.header.turns));await playGuild(page,fixture.remaining,true);await page.locator('#adventure[data-status=won]').waitFor();assert.equal(await page.locator('#game-stars').textContent(),'★★★');
 });
}
