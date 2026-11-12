import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {enterFirstTrail,chooseOption,waitForGameReady,clickControl} from './ui-driver.mjs';
import {playGuild} from './guild-browser-checks.mjs';
import {playTraining} from './training-browser-checks.mjs';
const n=(action,count)=>Array(count).fill(action);
const training=JSON.parse(await readFile(new URL('../../tests/fixtures/training-routes.json',import.meta.url),'utf8')).play;
const candleBeforePatrol=[...n('up',4),'right',...n('down',8),'left','right',...n('up',5),...n('right',6),...n('up',3),...n('down',3),'right'];
const candleAfterPatrol=['wait','down','right','right',...n('up',4),...n('right',5),'right',...n('down',7)];
const copperFinish=[...n('up',5),'left',...n('down',8),...n('right',4),'down','right',...n('up',4),...n('right',11),...n('up',4),...n('down',4),'wait',...n('down',4)];
const vaultRoute=['up','right','right','down','down','right','right','shield','right','right',...n('down',2),...n('left',5),...n('up',10),...n('right',4),'up','left',...n('down',12),...n('right',4),...n('up',4),...n('right',6),...n('up',6),...n('right',4),...n('left',4),...n('down',9),...n('right',4)];
const chapters=[
 ['A Letter for Two',[['right','right','use'],['wait','wait','use']],9],
 ['The Dyehouse Promise',[['use','right','right'],['wait','wait','use']],11],
 ['A Bridge for the Rain',[['use','right','right'],['left','left','use']],13],
 ['The Long Way Round',[['right','right','use'],['wait','wait','use']],19],
 ['The Signmaker’s Errand',[['right','right','use'],['up','wait','use']],27],
 ['The Festival of Two Lights',[['right','right','use'],['up','wait','use']],55],
];
async function setCards(page,programs,press){
 await press('[data-ps-jump=programs]');
 for(const [actor,cards]of programs.entries()){
  const id=actor?'sprout':'pip';await press('#ps-actor-'+id);
  for(const [i,card]of cards.entries())await chooseOption(page,`#ps-card-${id}-${i}`,card);
 }
}
const cardValues=(page,actor)=>page.locator(`#ps-programs select[id^="ps-card-${actor}-"]`).evaluateAll(ns=>ns.map(n=>n.value));
export async function openingPlayerScenarios(scenario){
 for(const width of [390,1440])await scenario(`opening-training-and-three-trails-${width}`,width,async page=>{
  const touch=width<500,press=s=>page.locator(s)[touch?'tap':'click'](),walk=actions=>playGuild(page,actions,touch);
  await press('#title-training');await press('[data-training-lesson=play]');
  await press('#training-wait');assert.equal(await page.locator('#training-step-count').textContent(),'STEP 1 / 6');
  if(touch){assert.equal(await page.locator('#training-step-cue').isVisible(),true);assert.match(await page.locator('#training-step-cue').textContent(),/Walk north/);}
  await playTraining(page,training,touch);
  assert.equal(await page.locator('#training-step-count').textContent(),'LESSON COMPLETE');
  assert.equal(await page.locator('#training-finish .front-primary').getAttribute('id'),'training-story-adventure');
  assert.equal(await page.locator('#training-story-adventure').evaluate(n=>n===document.activeElement),true);
  await press('#training-story-adventure');await enterFirstTrail(page);
  assert.match(await page.locator('#game-status').textContent(),/brass key north/);
  await walk(candleBeforePatrol);const before=await page.locator('#adventure-canvas').getAttribute('aria-label');
  await walk(['down']);assert.match(await page.locator('#game-status').textContent(),/Undo restores this turn and your heart/);
  await press('#game-undo');assert.equal(await page.locator('#adventure-canvas').getAttribute('aria-label'),before);
  await walk(candleAfterPatrol.slice(0,-8));assert.match(await page.locator('#game-status').textContent(),/Reach the turquoise beacon/);
  await walk(candleAfterPatrol.slice(-8));
  for(const [index,turns]of [54,50,86].entries()){
   assert.equal(await page.locator('#adventure').getAttribute('data-status'),'won');
   assert.equal(await page.locator('#game-stars').textContent(),'★★★');assert.equal(await page.locator('#game-turns').textContent(),String(turns));
   if(index===2)break;
   await press('#game-primary');
   if(index===0){
    assert.match(await page.locator('#game-status').textContent(),/crate right/);await walk(['right','right']);
    assert.match(await page.locator('#game-status').textContent(),/Crate parked/);await walk(['right']);
    assert.match(await page.locator('#game-status').textContent(),/stepping away will release it/);await press('#game-undo');
    await walk(copperFinish);
   }else{
    assert.match(await page.locator('#game-status').textContent(),/one crate on each/);await walk(vaultRoute.slice(0,4));
    assert.match(await page.locator('#game-status').textContent(),/One of two plates/);await walk(vaultRoute.slice(4));
   }
  }
  await press('#game-home');await page.reload();await waitForGameReady(page);await enterFirstTrail(page);await clickControl(page,'#game-choose',touch);
  for(const id of ['trail-1','trail-2','trail-3'])assert.match(await page.locator(`[data-stage="${id}"] .trail-progress`).textContent(),/★★★/);
  assert.equal(await page.locator('[data-stage="trail-4"]').isDisabled(),false);
 });
 for(const width of [390,1440])await scenario(`opening-six-pip-chapters-and-recovery-${width}`,width,async page=>{
  const press=s=>page.locator(s)[width<500?'tap':'click'](),steps=async count=>{for(let i=0;i<count;i++)await press('#ps-step');};
  await press('#title-pip');await press('#ph-next');
  assert.match(await page.locator('#ps-status').textContent(),/Plan cards/);
  await press('#ps-test');await press('#ps-run');
  await page.locator('#ps-playback-state').filter({hasText:'Both friends are only waiting'}).waitFor();
  assert.equal(await page.locator('#ps-run').textContent(),'Run');
  assert.ok(await page.locator('#ps-playback-state').evaluate(n=>{const r=n.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}));
  await press('#ps-test');
  for(const [chapter,[title,programs,ticks]]of chapters.entries()){
   assert.equal(await page.locator('#ps-title').textContent(),title);
   await setCards(page,programs,press);
   if(chapter===0||chapter===5){
    await press('[data-ps-jump=canvas]');const canvas=page.locator('#ps-canvas');await canvas.scrollIntoViewIfNeeded();const r=await canvas.boundingBox();
    const x=chapter===0?5:1,y=chapter===0?3:4,columns=chapter===0?9:13;
    if(width<500)await page.touchscreen.tap(r.x+r.width*(x+.5)/columns,r.y+r.height*(y+.5)/7);else await canvas.click({position:{x:r.width*(x+.5)/columns,y:r.height*(y+.5)/7}});
    const description=await page.locator('#ps-inspect').textContent();assert.match(description,chapter===0?/Route A.*Route B/:/Quiet.*Powered/);assert.match(description,/first card plays on the next tick/);
   }
   await press('#ps-test-route');
   if(chapter===0){
    await steps(6);await press('[data-ps-jump=programs]');await press('#ps-actor-sprout');
    assert.deepEqual(await cardValues(page,'sprout'),['right','right','use']);
    for(const card of await page.locator('#ps-programs .game-select-trigger:visible').all())assert.equal(await card.evaluate(n=>getComputedStyle(n).opacity),'1');
    assert.match(await page.locator('#ps-card-context').textContent(),/Sprout next: card 1, East/);
    assert.equal(await page.locator('#ps-programs [data-next-card] select').first().inputValue(),'right');
    await press('#ps-undo');assert.deepEqual(await cardValues(page,'sprout'),['wait','wait','use']);
    await press('#ps-step');assert.deepEqual(await cardValues(page,'sprout'),['right','right','use']);
    await press('#ps-test');await press('[data-ps-jump=programs]');assert.deepEqual(await cardValues(page,'sprout'),programs[1]);
    await press('#ps-test-route');await steps(ticks);
   }else{
    await steps(ticks-1);assert.equal(await page.locator('#ps-next-story').isVisible(),false);
    const status=await page.locator('#ps-status').textContent(),labels={up:'North ↑',right:'East →',down:'South ↓',left:'West ←',wait:'Wait',use:'Use'};
    for(const actor of ['pip','sprout']){const next=status.match(new RegExp(actor+' next: card ([123]), ([^·]+)','i'));assert.ok(next);const cards=await cardValues(page,actor);assert.equal(labels[cards[Number(next[1])-1]],next[2].trim());}
    await steps(1);
   }
   assert.match(await page.locator('#ps-status').textContent(),new RegExp(`^Tick ${ticks}/240 · Adventure complete!`));
   if(chapter<chapters.length-1){assert.match(await page.locator('#ps-next-story').textContent(),new RegExp(chapters[chapter+1][0]));await press('#ps-next-story');}
  }
  assert.match(await page.locator('#ps-next-story').textContent(),/The Midnight Post/);
  await press('#ps-close');assert.match(await page.locator('#ph-progress').textContent(),/^6\//);
  await press('#ph-close');await page.reload();await waitForGameReady(page);await press('#title-pip');assert.match(await page.locator('#ph-progress').textContent(),/^6\//);
 });
}
