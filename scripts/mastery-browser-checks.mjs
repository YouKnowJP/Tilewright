import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { LAB_ROOMS } from '../src/workshop-lab.mjs';
import { LAB_CLEARS } from '../src/workshop-lab-clears.mjs';
import { MASTERY_KEY, masteryCount, parseMastery } from '../src/workshop-mastery.mjs';
import { playGuild } from './guild-browser-checks.mjs';
import { clickControl } from './ui-driver.mjs';

const alternate=JSON.parse(await readFile(new URL('../tests/fixtures/foundry-alternate.json',import.meta.url),'utf8'));
const saved=page=>page.evaluate(key=>localStorage.getItem(key),MASTERY_KEY);
const others=page=>page.evaluate(key=>JSON.stringify(Object.entries(localStorage).filter(([id])=>id!==key&&id!=='tilewright.workshop.bests.v1').sort()),MASTERY_KEY);
async function lab(page){await page.locator('#title-workshop').click();await page.locator('#ws-tab-lab').click();}
async function select(page,id,rules='trail'){
  await page.locator(`[data-lab-collection="${LAB_ROOMS.find(room=>room.id===id).afterhours?'afterhours':'foundations'}"]`).click();if(await page.locator('#ws-lab-room-picker').isVisible())await page.locator('#ws-lab-room-picker').selectOption(id);else await page.locator(`[data-lab-room="${id}"]`).click();await page.locator('#ws-lab-rules').selectOption(rules);
}
async function start(page,id,rules){await select(page,id,rules);await page.locator('#ws-lab-play').click();await page.locator('#ws-preview-dialog').waitFor();assert.equal(await page.locator('#ws-preview-difficulty').inputValue(),rules);await page.locator('#ws-preview-play').click();}
async function finish(page,actions,touch=false){await playGuild(page,actions,touch);assert.equal(await page.locator('#adventure').getAttribute('data-status'),'won');assert.match(await page.locator('#game-result-text').textContent(),/seal/);await page.locator('#game-primary').click();await page.locator('#ws-lab').waitFor();}
async function fits(page){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),await page.evaluate(()=>innerWidth));}
export async function checkMastery(browserType,{baseURL='http://127.0.0.1:4174',channel,widths=[320,390,820,1440,844],fullRuns=true,screenshots=false,onProgress=()=>{}}={}){
  const browser=await browserType.launch({headless:true,...(channel?{channel}:{})}),results=[],report=checks=>{results.push({checks});onProgress({checks});};let exported;
  try{
    const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true,reducedMotion:'reduce'});context.setDefaultTimeout(15000);
    try{
      const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('response',response=>{if(response.status()>=400)errors.push(response.url());});await page.goto(baseURL);await lab(page);assert.equal(await page.locator('#ws-lab-file').isVisible(),false);const original=await others(page);
      for(const room of LAB_ROOMS)await select(page,room.id);assert.equal(await page.locator('[data-lab-room]:visible').count(),6);assert.equal(await saved(page),null);assert.equal(await others(page),original);
      for(const room of LAB_ROOMS.filter(room=>room.afterhours))for(const rules of fullRuns?['trail','nemesis']:['trail']){
        await start(page,room.id,rules);assert.match(await page.locator('#game-book-banner').textContent(),/Puzzle Lab seals/);await clickControl(page,'#notes-tab-quest');assert.equal(await page.locator('#game-commission-goals p').count(),3);await page.keyboard.press('Escape');await finish(page,LAB_CLEARS[room.id]);
        report(`${room.title}: normal ${rules} win, live seal goals, verified preview, saved awards, and return to Lab.`);
      }
      await start(page,'foundry','trail');await finish(page,alternate);assert.equal(parseMastery(await saved(page)).records['foundry-trail'].length,3);
      const before=await saved(page);await start(page,'foundry','trail');await finish(page,LAB_CLEARS.foundry);assert.equal(await saved(page),before);
      assert.equal(await others(page),original);await page.locator('#ws-lab-challenges>summary').click();await page.locator('#ws-lab-next-seal').click();const selected=await page.locator('[data-lab-room][aria-pressed="true"]').getAttribute('data-lab-room'),rules=await page.locator('#ws-lab-rules').inputValue();assert.ok((parseMastery(await saved(page)).records[`${selected}-${rules}`]||[]).length<3);
      await page.locator('.ws-lab-journal>summary').click();assert.equal(await page.locator('#ws-lab-file').isVisible(),false);const download=page.waitForEvent('download');await page.locator('#ws-lab-export').click();exported=await readFile(await(await download).path(),'utf8');assert.deepEqual(parseMastery(exported),parseMastery(await saved(page)));
      await page.reload();await lab(page);assert.deepEqual(parseMastery(await saved(page)),parseMastery(exported));await select(page,'caravan');await page.locator('#ws-lab-remix').click();assert.match(await page.locator('#ws-draft-title').textContent(),/Caravan/);assert.equal(await saved(page),exported);assert.deepEqual(errors,[]);
      report('Crate alternative adds the missing seal; replays cannot farm seals; missing-seal finder, original-save isolation, native journal download, reload, and caravan remix pass.');
    }finally{await context.close();}
    const imported=await browser.newContext();try{
      const page=await imported.newPage();await page.goto(baseURL);await lab(page);const original=await others(page),file={name:'journal.seals.json',mimeType:'application/json',buffer:Buffer.from(exported)};
      await page.locator('.ws-lab-journal>summary').click();const chooser=page.waitForEvent('filechooser');await page.locator('#ws-lab-import').click();await(await chooser).setFiles(file);await page.locator('#ws-mastery-dialog').waitFor();assert.equal(await saved(page),null);await page.locator('#ws-mastery-cancel').click();assert.equal(await saved(page),null);
      await page.locator('#ws-lab-file').setInputFiles(file);await page.locator('#ws-mastery-dialog').waitFor();await page.locator('#ws-mastery-confirm').click();assert.deepEqual(parseMastery(await saved(page)),parseMastery(exported));assert.equal(await others(page),original);
      for(const text of ['{}','{',' '.repeat(12001)]){await page.locator('#ws-lab-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(text)});await page.waitForFunction(()=>document.querySelector('#ws-status').dataset.error==='true');assert.equal(await page.locator('#ws-mastery-dialog').isVisible(),false);assert.deepEqual(parseMastery(await saved(page)),parseMastery(exported));}
      await page.evaluate(()=>{const original=File.prototype.text;File.prototype.text=async function(){const text=await original.call(this);return new Promise(resolve=>window.auditFileRelease=()=>resolve(text));};});
      await page.locator('#ws-lab-file').setInputFiles(file);await page.waitForFunction(()=>typeof window.auditFileRelease==='function');await page.locator('#ws-home').click();await page.evaluate(()=>window.auditFileRelease());await page.waitForTimeout(60);assert.equal(await page.locator('#ws-mastery-dialog').isVisible(),false);assert.equal(await page.locator('#game-title-screen').isVisible(),true);
      report('Fresh-browser journal preview, cancellation, exact restoration, invalid/oversized files, and other-save isolation pass.');
    }finally{await imported.close();}
    for(const width of widths){
      const context=await browser.newContext({viewport:{width,height:width===320?568:width===844?390:1000},hasTouch:true,reducedMotion:'reduce'});context.setDefaultTimeout(15000);
      try{const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(baseURL);await lab(page);await select(page,'caravan','nemesis');await fits(page);assert.equal(await page.locator('[data-lab-room]:visible').count(),width<=600?0:6);await page.locator('#ws-lab-challenges>summary').click();await fits(page);await page.locator('#ws-lab-challenges>summary').click();
        if(screenshots){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`.playwright-mcp/afterhours-lab-${width}.png`,fullPage:true});}
        await start(page,'foundry','trail');await fits(page);const bounds=await page.evaluate(()=>{const board=document.querySelector('#game-layout').getBoundingClientRect(),controls=document.querySelector('.game-controls').getBoundingClientRect();return {board:board.bottom,controls:controls.bottom};});assert.ok(bounds.controls<=bounds.board+1);
        await finish(page,alternate,width<768);await fits(page);assert.equal(masteryCount(parseMastery(await saved(page))),3);
        if(width===390)for(const id of ['glassferry','floodsong','caravan']){await start(page,id,'trail');if(screenshots){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`.playwright-mcp/afterhours-${id}-play-390.png`,fullPage:true});}await finish(page,LAB_CLEARS[id],true);await fits(page);}
        assert.deepEqual(errors,[]);report(`${width}px: six visible room choices, readable seals, fitted gameplay controls, native ${width<768?'touch':'keyboard'} alternate win, no sideways overflow.`);
      }finally{await context.close();}
    }
    for(const mode of ['corrupt','blocked','quota']){const context=await browser.newContext();try{
      await context.addInitScript(({key,mode})=>{if(mode==='corrupt')localStorage.setItem(key,'{');else{const method=mode==='blocked'?'getItem':'setItem',original=Storage.prototype[method];Storage.prototype[method]=function(...args){if(args[0]===key)throw Error('unavailable');return original.apply(this,args);};}},{key:MASTERY_KEY,mode});const page=await context.newPage();await page.goto(baseURL);await lab(page);await start(page,'locksmith','trail');await finish(page,LAB_CLEARS.locksmith);assert.match(await page.locator('#ws-lab-collection-count').textContent(),/^3\/72/);if(mode==='quota')assert.match(await page.locator('#ws-lab-save-note').textContent(),/unavailable/);report(`${mode} storage: playable fallback and retained session seals.`);
    }finally{await context.close();}}
    return results;
  }finally{await browser.close();}
}
