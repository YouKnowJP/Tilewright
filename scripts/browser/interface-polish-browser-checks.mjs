import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chooseOption,waitForGameReady,withGameConfirmation} from './ui-driver.mjs';
import {playGuild} from './guild-browser-checks.mjs';
import {buildTrainingWorld} from './training-browser-checks.mjs';
import {welcomeWorld} from '../../src/storybook-welcome.mjs';
import {serializeAdventure} from '../../src/workshop-sharing.mjs';
import {blankAdventure} from '../../src/workshop-model.mjs';

const sizes=[[320,568],[390,844],[768,900],[844,390],[1440,1000]];
async function fits(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'The interface stays within the viewport.');}
async function touchTargets(controls){
 for(const control of await controls.all()){
  const b=await control.boundingBox();
  assert.ok(b&&b.width>=43.5&&b.height>=43.5,`A usable control needs a full touch area: ${await control.getAttribute('aria-label')||await control.textContent()} ${JSON.stringify(b)}`);
 }
}
async function labelFits(control,expected){
 const result=await control.evaluate(n=>{
  const label=n.querySelector('span')||n,range=document.createRange();range.selectNodeContents(label);
  const text=range.getBoundingClientRect(),box=n.getBoundingClientRect();
  return {text:n.textContent.trim(),visible:label.checkVisibility(),left:text.left,right:text.right,boxLeft:box.left,boxRight:box.right,overflow:n.scrollWidth>n.clientWidth+1};
 });
 if(expected)assert.equal(result.text,expected);
 assert.ok(result.visible&&result.right>result.left&&!result.overflow&&result.left>=result.boxLeft&&result.right<=result.boxRight,`The full control label is visible: ${JSON.stringify(result)}`);
}

export async function interfacePolishScenarios(scenario){
 for(const width of [390,1440])await scenario(`training-transfer-cancel-and-accept-${width}`,width,async page=>{
  const draft=blankAdventure();draft.title='Keep my original draft';
  await page.evaluate(pack=>localStorage.setItem('tilewright.workshop.draft.v1',JSON.stringify(pack)),draft);
  await page.reload();await waitForGameReady(page);
  const before=await page.evaluate(()=>localStorage.getItem('tilewright.workshop.draft.v1'));
  const routes=JSON.parse(await readFile(new URL('../../tests/fixtures/training-routes.json',import.meta.url),'utf8'));
  await page.locator('#title-training').click();await buildTrainingWorld(page,routes.create,width<500);
  const completed=await page.locator('#training-map').getAttribute('aria-label');
  await withGameConfirmation(page,false,()=>page.locator('#training-workshop').click());
  assert.equal(await page.locator('#training-camp').isVisible(),true,'Cancel keeps the completed lesson open.');
  assert.equal(await page.locator('#training-map').getAttribute('aria-label'),completed);
  assert.equal(await page.evaluate(()=>localStorage.getItem('tilewright.workshop.draft.v1')),before,'Cancel preserves the original draft bytes.');
  await withGameConfirmation(page,true,()=>page.locator('#training-workshop').click());
  await page.locator('#ws-build').waitFor();
  const transferred=JSON.parse(await page.evaluate(()=>localStorage.getItem('tilewright.workshop.draft.v1')));
  assert.equal(transferred.title,'Moonbeam Island');assert.ok(transferred.proof);await fits(page);
 });
 await scenario('creator-toolbars-and-tablet-heading-fit',390,async page=>{
  await page.locator('#title-workshop').click();await page.locator('#ws-tab-build').click();
  for(const [width,height]of sizes){
   await page.setViewportSize({width,height});
   await labelFits(page.locator('#ws-zoom-control'),'Fit');
   await touchTargets(page.locator('.ws-map-toolbar button'));
   await touchTargets(page.locator('.ws-quick-brushes button'));
   assert.ok(await page.locator('#ws-draft-title').evaluate(n=>n.clientWidth>=200&&n.scrollWidth<=n.clientWidth+1&&n.clientHeight<=parseFloat(getComputedStyle(n).lineHeight)*2),'The world title keeps a readable column beside the actions.');
   await chooseOption(page,'#ws-zoom','1.5');await labelFits(page.locator('#ws-zoom-control'),'150%');
   await chooseOption(page,'#ws-zoom','fit');await fits(page);
  }
  await page.locator('#ws-home').click();await page.locator('#title-mapmaker').click();
  for(const [width,height]of sizes){
   await page.setViewportSize({width,height});
   await touchTargets(page.locator('.toolbar button'));
   await labelFits(page.locator('#zoom-control'),'Fit map');
   await chooseOption(page,'#zoom','1.5');await labelFits(page.locator('#zoom-control'),'150%');
   await chooseOption(page,'#zoom','fit');await fits(page);
  }
 });
 await scenario('player-navigation-and-reading-tabs-fit',390,async page=>{
  for(const [width,height]of sizes.slice(0,2)){
   await page.setViewportSize({width,height});
   await labelFits(page.locator('#title-accessibility'),'Accessibility');
   const lines=await page.locator('#title-accessibility').evaluate(n=>{const r=document.createRange();r.selectNodeContents(n);return r.getClientRects().length;});
   assert.equal(lines,1,'Accessibility remains a whole readable word.');
   await page.locator('#title-play').click();await page.locator('#front-story').click();
   for(const tab of await page.locator('.adventure-library-tabs button').all())await labelFits(tab);
   await page.locator('#library-title').click();
  }
  for(const reading of ['standard','largest']){
   if(reading==='largest'){
    await page.locator('#title-settings').click();await page.locator('#settings-tab-access').click();
    await chooseOption(page,'#settings-reading-size','largest');await page.locator('#settings-close').click();
   }
   await page.locator('#title-pip').click();
   if(!await page.locator('#ph-filters').evaluate(n=>n.open))await page.locator('#ph-filters>summary').click();
   await page.locator('#ph-search').fill('Dyehouse');assert.equal(await page.locator('[data-ph-mission]').count(),1);
   await page.locator('#ph-search').fill('');await page.locator('[data-ph-mission="duo-first-letter"]').click();
   for(const [width,height]of sizes.slice(0,3)){
    await page.setViewportSize({width,height});
    for(const tab of await page.locator('#pip-studio>.ps-tabs>button').all())await labelFits(tab);
    await touchTargets(page.locator('#pip-studio>.ps-tabs>button'));await fits(page);
   }
   const expanded=await page.locator('#ps-story-details').evaluate(n=>n.open);
   await page.locator('#ps-story-details>summary').click();assert.notEqual(await page.locator('#ps-story-details').evaluate(n=>n.open),expanded);
   await page.locator('#ps-close').click();await page.locator('#ph-close').click();
  }
 });
 await scenario('ending-actions-fit-with-large-reading',320,async page=>{
  await page.locator('#title-settings').click();await page.locator('#settings-tab-access').click();
  await chooseOption(page,'#settings-reading-size','largest');await page.locator('#settings-close').click();
  await page.locator('#title-workshop').click();await page.locator('#ws-tab-import').click();
  const world=welcomeWorld('window');
  await page.locator('#ws-file').setInputFiles({name:'peaceful-ending.trail.json',mimeType:'application/json',buffer:Buffer.from(serializeAdventure(world))});
  await page.locator('#ws-preview-play').click();await playGuild(page,world.proof.actions,true);
  await page.locator('#adventure[data-status=won]').waitFor();
  for(const [width,height]of sizes){
   await page.setViewportSize({width,height});
   for(const button of await page.locator('#game-overlay button:visible').all()){
    await button.scrollIntoViewIfNeeded();
    assert.ok(await button.evaluate(n=>{const b=n.getBoundingClientRect(),p=n.closest('#game-overlay').getBoundingClientRect();return b.top>=p.top&&b.bottom<=p.bottom&&b.left>=p.left&&b.right<=p.right&&b.top>=0&&b.bottom<=innerHeight;}),'Every ending action is reachable at the selected reading size.');
   }
   await touchTargets(page.locator('#game-overlay button:visible'));await fits(page);
   assert.equal(await page.locator('#game-primary').evaluate(n=>getComputedStyle(n).fontSize),'20px','The ending retains the chosen reading size.');
  }
 });
}
