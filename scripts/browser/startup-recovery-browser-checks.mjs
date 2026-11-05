import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {build} from '../build.mjs';
import {createDevServer} from '../../serve.mjs';
import {COLLECTION_SAVE_KEY} from '../../src/pip-collection-storage.mjs';
import {waitForGameReady} from './ui-driver.mjs';

// Intentional network failures use separate error accounting. The ordinary
// release runner continues to reject every unexpected console/network error.
export async function checkStartupRecovery(browserType,{baseURL,onProgress=console.log}={}){
 const fixture=JSON.parse(await readFile(new URL('../../tests/fixtures/pip-v051-duo.json',import.meta.url),'utf8')),bytes=JSON.stringify(fixture.journal),browser=await browserType.launch({headless:true}),results=[];
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'});context.setDefaultTimeout(15000);
 await context.addInitScript(({key,bytes})=>{if(!localStorage.getItem(key))localStorage.setItem(key,bytes);},{key:COLLECTION_SAVE_KEY,bytes});
 const output=fileURLToPath(new URL('../../playwright-report/startup-recovery/',import.meta.url)),stem=path.join(output,browserType.name()+'-failure');await mkdir(output,{recursive:true});await context.tracing.start({screenshots:true,snapshots:true,sources:true});
 const page=await context.newPage(),errors=[],faultConsole=[];let fault=true;
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')(fault?faultConsole:errors).push(m.text());});page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(baseURL))errors.push(`${r.status()} ${r.url()}`);});
 const saved=()=>page.evaluate(k=>localStorage.getItem(k),COLLECTION_SAVE_KEY),pass=name=>{results.push({name,pass:true});onProgress('PASS '+name);};
 try{
  await page.route('**/src/app.mjs',route=>route.abort('failed'));await page.goto(baseURL);await page.locator('#startup-status strong').filter({hasText:'The game could not load.'}).waitFor();assert.equal(await saved(),bytes);assert.equal(await page.locator('#startup-retry').isVisible(),true);assert.ok(faultConsole.some(s=>s.startsWith('Tilewright startup failed:')));assert.ok(faultConsole.every(s=>/^Tilewright startup failed:|Failed to load resource|Load failed|Loading failed for the module|error loading dynamically imported module/i.test(s)),faultConsole.join('\n'));assert.deepEqual(errors,[]);
  await page.unroute('**/src/app.mjs');fault=false;await page.locator('#startup-retry').click();await waitForGameReady(page);assert.equal(await saved(),bytes);assert.deepEqual(errors,[]);pass('startup-interrupted-module-retry-preserves-saves');
  let release;const held=new Promise(resolve=>release=resolve);await page.route('**/src/app.mjs',async route=>{await held;await route.continue();});const loading=page.reload({waitUntil:'commit'});await loading;await page.locator('#startup-status strong').filter({hasText:'The trail is taking longer to light.'}).waitFor({timeout:20000});assert.equal(await page.locator('#startup-retry').isVisible(),true);assert.equal(await saved(),bytes);release();await waitForGameReady(page);await page.unroute('**/src/app.mjs');assert.equal(await saved(),bytes);assert.deepEqual(errors,[]);pass('startup-slow-module-recovers-without-reload-or-save-write');
  await context.setOffline(true);await page.locator('#title-pip').click();await page.locator('#ph-continue').click();assert.match(await page.locator('#ps-status').textContent(),/^Tick 58\//);await page.locator('#ps-step').click();assert.match(await page.locator('#ps-status').textContent(),/^Tick 59\//);await page.locator('#ps-undo').click();assert.match(await page.locator('#ps-status').textContent(),/^Tick 58\//);await page.locator('#ps-close').click();await context.setOffline(false);await page.reload();await waitForGameReady(page);await page.locator('#title-pip').click();await page.locator('#ph-continue').click();assert.match(await page.locator('#ps-status').textContent(),/^Tick 58\//);await page.locator('#ps-undo').click();assert.match(await page.locator('#ps-status').textContent(),/^Tick 57\//);assert.deepEqual(errors,[]);pass('loaded-game-offline-controls-and-online-reload-retain-history');
  await context.tracing.stop();for(const extension of ['png','zip','json'])await rm(stem+'.'+extension,{force:true});return {browser:browserType.name(),results};
 }catch(error){await Promise.allSettled([page.screenshot({path:stem+'.png',fullPage:true,timeout:5000}),context.tracing.stop({path:stem+'.zip'}),writeFile(stem+'.json',JSON.stringify({error:error.stack,errors,faultConsole,url:page.url()},null,2))]);throw error;}finally{await context.close();await browser.close();}
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const engines=process.argv.slice(2);if(engines.some(e=>!['chromium','firefox','webkit'].includes(e)))throw Error('Choose chromium, firefox or webkit.');const pw=await import('playwright'),site=await build(),server=createDevServer({root:site.destination});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{for(const engine of engines.length?engines:['chromium']){const report=await checkStartupRecovery(pw[engine],{baseURL:`http://127.0.0.1:${server.address().port}/`});await mkdir(new URL('../../playwright-report/startup-recovery/',import.meta.url),{recursive:true});await writeFile(new URL(`../../playwright-report/startup-recovery/${engine}.json`,import.meta.url),JSON.stringify(report,null,2));}}finally{await new Promise(r=>server.close(r));}
}
