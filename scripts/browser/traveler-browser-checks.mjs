import assert from 'node:assert/strict';
import { artifactPath } from './artifacts.mjs';
import { chooseOption,enterFirstTrail } from './ui-driver.mjs';
import { playGuild } from './guild-browser-checks.mjs';
import { TRAVELER_CHOICES,DEFAULT_TRAVELER,OUTFITS } from '../../src/traveler-art.mjs';
import { PREFERENCES_KEY } from '../../src/adventure-preferences.mjs';
import { lanternfairBook } from '../../src/storybook-lanternfair.mjs';

async function fit(page) {
  const bounds=await page.locator('#game-settings-dialog').evaluate(dialog=>({width:innerWidth,page:document.documentElement.scrollWidth,inside:dialog.scrollWidth,client:dialog.clientWidth,buttons:[...dialog.querySelectorAll('#settings-traveler button')].filter(n=>n.getClientRects().length).map(n=>({id:n.id,...n.getBoundingClientRect().toJSON()}))}));
  assert.ok(bounds.page<=bounds.width+1);assert.ok(bounds.inside<=bounds.client+1);for(const button of bounds.buttons){assert.ok(button.left>=0&&button.right<=bounds.width+1,JSON.stringify(button));assert.ok(button.height>=44,JSON.stringify(button));}
}
const preferences=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).preferences,PREFERENCES_KEY);
const progress=page=>page.evaluate(key=>Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('tilewright.')&&k!==key).map(k=>[k,localStorage.getItem(k)])),PREFERENCES_KEY);

export async function checkTraveler(browserType,{baseURL='http://127.0.0.1:4174',channel,widths=[320,390,768,844,1440],fullBooks=true,screenshots=false,onProgress=()=>{}}={}) {
  const browser=await browserType.launch({headless:true,...(channel?{channel}:{})}),results=[],report=checks=>{results.push({checks});onProgress({checks});};
  try {
    for(const width of widths) {
      const context=await browser.newContext({viewport:{width,height:width===320?568:width===844?390:width===390?844:1000},hasTouch:true,reducedMotion:'reduce'});
      try {
        const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
        await page.goto(baseURL);await page.locator('#loading-note[hidden]').waitFor({state:'attached'});await page.locator('#title-traveler').click();await fit(page);
        const looks=new Set();for(const outfit of OUTFITS){await page.locator(`[data-outfit="${outfit.id}"]`).click();assert.equal(await page.locator(`[data-outfit="${outfit.id}"]`).getAttribute('aria-pressed'),'true');assert.equal((await preferences(page)).coat,outfit.coat);looks.add(await page.locator('#traveler-preview').evaluate(canvas=>canvas.toDataURL()));}assert.equal(looks.size,6);
        await page.locator('#traveler-tailoring>summary').click();
        for(const [field,options]of Object.entries(TRAVELER_CHOICES))for(const choice of options){await chooseOption(page,`#traveler-${field}`,choice.id);assert.equal((await preferences(page))[field],choice.id);await fit(page);}
        await page.locator('#traveler-name').fill('  灯り <Iris> 🌙  ');await page.locator('#traveler-turn').click();assert.equal((await preferences(page)).travelerName,'灯り Iris 🌙');
        const beforeTurn=await preferences(page);for(let i=0;i<4;i++)await page.locator('#traveler-turn').click();assert.deepEqual(await preferences(page),beforeTurn,'Turning the preview cannot save or change an outfit.');
        await page.locator('#traveler-shuffle').click();assert.equal((await preferences(page)).skin,beforeTurn.skin);assert.equal((await preferences(page)).travelerName,beforeTurn.travelerName);
        await page.locator('#traveler-reset').click();assert.equal((await preferences(page)).coat,DEFAULT_TRAVELER.coat);assert.equal((await preferences(page)).travelerName,beforeTurn.travelerName);
        await page.locator('[data-outfit="sailor"]').click();await chooseOption(page,'#traveler-campSky','starfall');await chooseOption(page,'#traveler-hairStyle','braid');await chooseOption(page,'#traveler-skin','umber');
        await page.locator('#settings-tab-access').click();await chooseOption(page,'#settings-reading-size','largest');await chooseOption(page,'#settings-contrast','high');await page.locator('#settings-tab-traveler').click();await fit(page);await page.locator('#settings-tab-access').click();await page.locator('#settings-access-reset').click();await page.locator('#settings-tab-traveler').click();
        const saved=await preferences(page);await page.reload();await page.locator('#title-traveler').click();assert.deepEqual(await preferences(page),saved);assert.match(await page.locator('#traveler-description').textContent(),/灯り Iris 🌙.*Tide coat/);await fit(page);
        if(screenshots&&[390,1440].includes(width)){await page.locator('#game-settings-dialog').evaluate(n=>n.scrollTop=0);await page.screenshot({path:artifactPath(`traveler-tent-${width}.png`)});}
        await page.locator('#settings-close').click();await enterFirstTrail(page);const checkpoint=await progress(page),turn=await page.locator('#game-turns').textContent(),image=await page.locator('#adventure-canvas').evaluate(n=>n.toDataURL());
        await page.locator('#game-controls-settings').click();await page.locator('#settings-tab-traveler').click();await page.locator('#traveler-tailoring>summary').click();await page.locator('#traveler-name').fill('Aster');await page.locator('#traveler-name').pressSequentially('wasd');await page.locator('[data-outfit="gardener"]').click();await page.locator('#settings-close').click();assert.equal(await page.locator('#game-turns').textContent(),turn);assert.deepEqual(await progress(page),checkpoint,'Changing clothes cannot modify a checkpoint, learning, or game progress.');assert.notEqual(await page.locator('#adventure-canvas').evaluate(n=>n.toDataURL()),image);
        await page.locator('#game-home').click();await page.locator('#title-traveler').click();await page.locator('#traveler-festival').click();await page.locator('[data-festival-book]').waitFor({state:'visible'});
        if(fullBooks&&[390,1440].includes(width)) {
          const difficulty=width===1440?'nemesis':'trail';await chooseOption(page,'#book-rules',difficulty);await page.locator('[data-festival-book] .front-primary').click();
          for(const [index,chapter]of lanternfairBook().chapters.entries()) {
            await page.locator('[data-book-challenge="clean"]').click();await page.locator('#book-continue').click();await page.locator('#adventure[data-status="playing"]').waitFor();const initialHealth=await page.locator('#game-health').getAttribute('aria-label');await playGuild(page,chapter.world.proof.actions,width===390);await page.locator('#adventure[data-status="won"]').waitFor();assert.equal(await page.locator('#game-health').getAttribute('aria-label'),initialHealth);
            if(screenshots&&index===3)await page.screenshot({path:artifactPath(`lanternfair-ending-${width}.png`),fullPage:true});
            await page.locator('#game-primary').click();
            if(index<3){await page.reload();await page.locator('#title-workshop').click();await page.locator('#ws-tab-books').click();}
          }
          assert.match(await page.locator('#book-camp-kicker').textContent(),/LAST PAGE/);assert.equal(await page.locator('#book-continue').isVisible(),false);report(`${width}px: all four Lanternfair chapters completed with actual ${width===390?'touch':'keyboard'} input on ${difficulty}, full treasure, keeper dialogue, puzzle crossings, homecoming, and saved camps across reload.`);
        }
        assert.deepEqual(errors,[]);report(`${width}px: all six outfits, every cosmetic/atmosphere option, Unicode name, preview turn, shuffle/reset, reload, real gameplay appearance, no-turn outfit changes, intact progress, themed dropdowns, and Lanternfair navigation fit without runtime errors.`);
      }finally{await context.close();}
    }
    const context=await browser.newContext();try{await context.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('blocked')};Storage.prototype.setItem=()=>{throw Error('blocked')};});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(baseURL);await page.locator('#title-traveler').click();await page.locator('[data-outfit="stargazer"]').click();assert.match(await page.locator('#traveler-description').textContent(),/Plum coat/);assert.match(await page.locator('#settings-save-note').textContent(),/this visit/);assert.deepEqual(errors,[]);report('Blocked storage keeps the tent usable and reports session-only appearance.');}finally{await context.close();}
    return{browser:browser.version(),results};
  }finally{await browser.close();}
}
