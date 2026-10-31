import {libraryClockworkScenarios} from './library-clockwork-browser-checks.mjs';
import {pipOrchestraScenarios} from './pip-orchestra-browser-checks.mjs';
import {pipAtlasScenarios} from './pip-atlas-browser-checks.mjs';
import { presentationScenarios } from './presentation-browser-checks.mjs';
import { cartographerScenarios } from './cartographer-browser-checks.mjs';
import assert from 'node:assert/strict';
import { mkdir,readFile,writeFile,rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chooseOption,enterFirstTrail , clickControl} from './ui-driver.mjs';
import { playGuild } from './guild-browser-checks.mjs';
import { playTraining,buildTrainingWorld } from './training-browser-checks.mjs';
import { lanternfairBook } from '../../src/storybook-lanternfair.mjs';
import { PREFERENCES_KEY } from '../../src/adventure-preferences.mjs';
import { TRAIL_SAVE_KEY } from '../../src/adventure-rewind.mjs';
import { WARDROBE_KEY } from '../../src/traveler-wardrobe.mjs';
import { build } from '../build.mjs';
import { createDevServer } from '../../serve.mjs';

const outputRoot=fileURLToPath(new URL('../../playwright-report/release-smoke/',import.meta.url));
const story=JSON.parse(await readFile(new URL('../../tests/fixtures/adventure-routes.json',import.meta.url),'utf8'))['trail-1'];
const training=JSON.parse(await readFile(new URL('../../tests/fixtures/training-routes.json',import.meta.url),'utf8'));
const saved=(page,key)=>page.evaluate(key=>{const id=JSON.parse(localStorage.getItem('tilewright.profiles.v1')||'{"activeId":"original"}').activeId;return localStorage.getItem(id==='original'?key:`tilewright.profile.${id}.${key.slice('tilewright.'.length)}`);},key);
const preferences=async page=>JSON.parse(await saved(page,PREFERENCES_KEY)).preferences;
async function openFavorites(page){if(await page.locator('#traveler-favorites').getAttribute('open')===null)await page.locator('#traveler-favorites>summary').click();}
async function fit(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal page overflow.');for(const dialog of await page.locator('dialog[open]').all()){assert.ok(await dialog.evaluate(n=>n.scrollWidth<=n.clientWidth+1),'Dialog content stays within its frame.');}}

export async function runReleaseSmoke(browserType,{baseURL,channel,widths=[390,1440],only=[],onProgress=console.log}={}) {
  const output=path.join(outputRoot,browserType.name?.()||'browser');await mkdir(output,{recursive:true});const browser=await browserType.launch({headless:true,...(channel?{channel}:{})}),results=[];
  async function scenario(name,width,exercise){
    if(only.length&&!only.includes(name))return;
    const context=await browser.newContext({viewport:{width,height:width<500?844:1000},hasTouch:true,reducedMotion:'reduce',acceptDownloads:true});context.setDefaultTimeout(15000);
    const page=await context.newPage(),errors=[],logs=[];await context.tracing.start({screenshots:true,snapshots:true,sources:true});
    page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());logs.push({type:message.type(),text:message.text()});});page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(baseURL))errors.push(`${r.status()} ${r.url()}`);});
    try{await page.goto(baseURL);await page.locator('#loading-note[hidden]').waitFor({state:'attached'});await exercise(page);await fit(page);assert.deepEqual(errors,[]);await context.tracing.stop();for(const extension of ['png','zip','json'])await rm(path.join(output,name+'.'+extension),{force:true});results.push({name,pass:true});onProgress(`PASS ${name}`);}
    catch(error){const stem=path.join(output,name);await Promise.allSettled([page.screenshot({path:stem+'.png',fullPage:true,timeout:5000}),context.tracing.stop({path:stem+'.zip'}),writeFile(stem+'.json',JSON.stringify({error:error.stack,errors,logs,url:page.url()},null,2))]);results.push({name,pass:false,error:error.stack});onProgress(`FAIL ${name}: ${error.message}`);}
    finally{await context.close();}
  }
  try{
    for(const width of widths)await scenario(`saved-looks-and-continue-${width}`,width,async page=>{
      await page.locator('#title-traveler').click();await page.locator('#traveler-tailoring>summary').click();await page.locator('#traveler-name').fill('abcdefghijklmnopqrstuvw xyz');await page.locator('[data-outfit="stargazer"]').click();assert.equal((await preferences(page)).travelerName,'abcdefghijklmnopqrstuvw');
      await openFavorites(page);await page.locator('#traveler-favorite-name-0').fill('Star road');await page.locator('[data-favorite-save="0"]').click();const first=await saved(page,WARDROBE_KEY);
      await page.locator('[data-outfit="gardener"]').click();await page.locator('[data-favorite-wear="0"]').click();assert.equal((await preferences(page)).coat,'plum');await page.locator('#traveler-favorites-undo').click();assert.equal(await page.locator('[data-favorite-wear="0"]').isEnabled(),false);
      await page.locator('#traveler-favorite-name-0').fill('Star road');await page.locator('[data-favorite-save="0"]').click();await page.locator('[data-outfit="gardener"]').click();await page.locator('[data-favorite-save="1"]').click();await page.locator('#traveler-favorites-undo').click();assert.equal(await page.locator('[data-favorite-wear="1"]').isEnabled(),false);assert.equal(await saved(page,WARDROBE_KEY),first);
      await page.locator('#settings-tab-access').click();await chooseOption(page,'#settings-reading-size','largest');await chooseOption(page,'#settings-contrast','high');await page.locator('#settings-tab-traveler').click();await fit(page);await page.locator('#settings-tab-access').click();await page.locator('#settings-access-reset').click();await page.locator('#settings-close').click();
      await enterFirstTrail(page);await playGuild(page,Array(48).fill('wait'),width<500);const half=Math.floor(story.length/2);await playGuild(page,story.slice(0,half),width<500);const checkpoint=await saved(page,TRAIL_SAVE_KEY),turn=await page.locator('#game-turns').textContent();await page.locator('#game-home').click();await page.reload();await page.locator('#loading-note[hidden]').waitFor({state:'attached'});
      // Simulate a browser suspending animation frames while replay is underway.
      await page.evaluate(()=>{const request=requestAnimationFrame.bind(window),cancel=cancelAnimationFrame.bind(window),pending=new Map();let id=-1;window.requestAnimationFrame=callback=>{pending.set(id,callback);return id--;};window.cancelAnimationFrame=key=>key<0?pending.delete(key):cancel(key);window.resumeSmokeFrames=()=>{window.requestAnimationFrame=request;window.cancelAnimationFrame=cancel;for(const callback of pending.values())request(callback);pending.clear();};});
      await page.locator('#title-continue').click();await page.locator('#adventure[data-status="playing"]').waitFor();assert.equal(await page.locator('#game-turns').textContent(),turn);assert.equal(await saved(page,TRAIL_SAVE_KEY),checkpoint);await page.evaluate(()=>window.resumeSmokeFrames());
      await clickControl(page,'#game-controls-settings');await page.locator('#settings-tab-traveler').click();await openFavorites(page);assert.equal(await saved(page,WARDROBE_KEY),first);await page.locator('[data-favorite-wear="0"]').click();assert.equal((await preferences(page)).coat,'plum');assert.equal((await preferences(page)).travelerName,'abcdefghijklmnopqrstuvw');await page.locator('#settings-close').click();assert.equal(await saved(page,TRAIL_SAVE_KEY),checkpoint);
      await playGuild(page,story.slice(half),width<500);await page.locator('#adventure[data-status="won"]').waitFor();await page.locator('#game-home').click();await page.locator('#title-traveler').click();await openFavorites(page);await page.locator('[data-favorite-wear="0"]').click();assert.equal(await page.locator('#adventure').getAttribute('data-status'),'won');
    });
    await scenario('learn-build-play-and-export',390,async page=>{
      await page.locator('#title-training').click();await page.locator('[data-training-lesson="play"]').click();await playTraining(page,training.play,true);assert.equal(await page.locator('#training-step-count').textContent(),'LESSON COMPLETE');await page.locator('#training-lessons').click();const world=await buildTrainingWorld(page,training.create,true);assert.equal(world.title,'Moonbeam Island');await page.locator('#training-home').click();await page.reload();await page.locator('#title-training').click();assert.match(await page.locator('#training-play-record').textContent(),/complete/);assert.match(await page.locator('#training-create-record').textContent(),/complete/);
    });
    await scenario('wardrobe-journeys-backup-and-fresh-start',390,async page=>{
      const ready=async()=>{await page.locator('#loading-note[hidden]').waitFor({state:'attached'});await page.waitForFunction(()=>!document.body.inert);};
      const confirm=async()=>{await Promise.all([page.waitForEvent('domcontentloaded'),page.locator('#save-confirm').click()]);await ready();};
      const tent=async()=>{await page.locator('#title-traveler').click();await openFavorites(page);};
      const switchTo=async id=>{await page.locator('#title-profile').click();await page.locator(`[data-journey="${id}"] [data-journey-action="switch"]`).click();await confirm();};
      await tent();await page.locator('[data-outfit="sailor"]').click();await page.locator('#traveler-favorite-name-0').fill('Harbor');await page.locator('[data-favorite-save="0"]').click();const first=await saved(page,WARDROBE_KEY);await page.locator('#settings-close').click();await page.locator('#title-profile').click();
      const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#save-download').click()]);const parts=[];for await(const part of await download.createReadStream())parts.push(part);const backup=Buffer.concat(parts);
      await page.locator('#save-create').click();await page.locator('#save-name').fill('Second tent');await confirm();const second=await page.evaluate(()=>JSON.parse(localStorage.getItem('tilewright.profiles.v1')).activeId);await tent();assert.equal(await page.locator('[data-favorite-wear="0"]').isEnabled(),false);await page.locator('[data-outfit="gardener"]').click();await page.locator('#traveler-favorite-name-0').fill('Fernwood');await page.locator('[data-favorite-save="0"]').click();await page.locator('#settings-close').click();
      await switchTo('original');await tent();assert.equal(await saved(page,WARDROBE_KEY),first);await page.locator('#settings-close').click();await page.locator('#title-profile').click();await page.locator('#save-start').click();await confirm();await tent();assert.equal(await page.locator('[data-favorite-wear="0"]').isEnabled(),false);await page.locator('#settings-close').click();await page.locator('#title-profile').click();await page.locator('#save-file').setInputFiles({name:'wardrobe-backup.json',mimeType:'application/json',buffer:backup});await page.locator('#save-dialog').waitFor();await confirm();await tent();assert.equal(await saved(page,WARDROBE_KEY),first);await page.locator('[data-favorite-wear="0"]').click();assert.equal((await preferences(page)).coat,'tide');await page.locator('#settings-close').click();await switchTo(second);await tent();assert.equal(await page.locator('#traveler-favorite-name-0').inputValue(),'Fernwood');assert.equal((await preferences(page)).coat,'fern');
    });
    await scenario('saved-look-storage-failure',390,async page=>{
      await page.evaluate(key=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(name,value){if(name===key)throw Error('simulated quota');return original.call(this,name,value);};},WARDROBE_KEY);
      await page.locator('#title-traveler').click();await page.locator('#settings-tab-access').click();await chooseOption(page,'#settings-reading-size','largest');await page.locator('#settings-tab-traveler').click();await openFavorites(page);await page.locator('[data-outfit="stargazer"]').click();await page.locator('#traveler-favorite-name-0').fill('ABCDEFGHIJKLMNOPQRSTUVWX');await page.locator('[data-favorite-save="0"]').click();await fit(page);assert.match(await page.locator('#traveler-favorites-note').textContent(),/this visit/);await page.locator('[data-outfit="gardener"]').click();await page.locator('[data-favorite-wear="0"]').click();assert.equal((await preferences(page)).coat,'plum');await page.locator('#traveler-favorites-undo').click();assert.equal(await page.locator('[data-favorite-wear="0"]').isEnabled(),false);
    });
    await scenario('lanternfair-four-chapter-story',390,async page=>{
      await page.locator('#title-traveler').click();await page.locator('#traveler-festival').click();await page.locator('[data-festival-book] .front-primary').click();for(const [index,chapter]of lanternfairBook().chapters.entries()){await page.locator('[data-book-challenge="clean"]').click();await page.locator('#book-continue').click();await playGuild(page,chapter.world.proof.actions,true);await page.locator('#adventure[data-status="won"]').waitFor();assert.equal(await page.locator('#game-health').getAttribute('aria-label'),'Health: 3 of 3');assert.equal(await page.locator('#game-coins').textContent(),'3/3');await page.locator('#game-primary').click();if(index<3){await page.reload();await page.locator('#title-workshop').click();await page.locator('#ws-tab-books').click();}}assert.match(await page.locator('#book-camp-kicker').textContent(),/LAST PAGE/);
    });
    await cartographerScenarios(scenario);
    await libraryClockworkScenarios(scenario);
    await pipOrchestraScenarios(scenario);
    await pipAtlasScenarios(scenario);
    await presentationScenarios(scenario);
    const report={browser:browser.version(),baseURL,results};await writeFile(path.join(output,'results.json'),JSON.stringify(report,null,2));if(!results.length)throw Error('No release browser checks matched the requested names.');if(results.some(item=>!item.pass))throw Error('Release browser checks failed. See playwright-report/release-smoke for screenshots, console output, and traces.');return report;
  }finally{await browser.close();}
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const {chromium}=await import('playwright'),release=await build(),server=createDevServer({root:release.destination});await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  try{await runReleaseSmoke(chromium,{baseURL:`http://127.0.0.1:${server.address().port}`,only:process.argv.slice(2)});}finally{await new Promise(resolve=>server.close(resolve));}
}
