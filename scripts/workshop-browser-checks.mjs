import { chooseOption } from './ui-driver.mjs';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { WORKSHOP_CLEARS } from '../src/workshop-clears.mjs';
import { WORLD_REGIONS, WORLD_MISSIONS, workshopShowcases } from '../src/workshop-worlds.mjs';
import { adventureCode, serializeAdventure, parseAdventure } from '../src/workshop-sharing.mjs';
import { OBJECTS, blankAdventure } from '../src/workshop-model.mjs';
import { playGuild } from './guild-browser-checks.mjs';
const BASE='http://127.0.0.1:4174';
const savedKeys=['tilewright.document.v1','tilewright.adventures.v1','tilewright.expedition.v1','tilewright.tactics.v1','tilewright.guild.v1'];
const originals=page=>page.evaluate(keys=>keys.map(key=>localStorage.getItem(key)),savedKeys);
async function cell(page,x,y,{touch=false,dragTo=null}={}) {
  await page.locator('#ws-canvas').scrollIntoViewIfNeeded();const r=await page.locator('#ws-canvas').boundingBox(),size=await page.evaluate(()=>{const c=document.querySelector('#ws-canvas');return[c.width/24,c.height/24];});
  const p={x:r.x+(x+.5)*r.width/size[0],y:r.y+(y+.5)*r.height/size[1]};
  if(touch)await page.touchscreen.tap(p.x,p.y);else if(dragTo){await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(r.x+(dragTo.x+.5)*r.width/size[0],r.y+(dragTo.y+.5)*r.height/size[1],{steps:5});await page.mouse.up();}else await page.mouse.click(p.x,p.y);
}
async function chooseBrush(page,group,name){await page.locator('#ws-brush').click();await page.locator('#ws-brush-groups').getByRole('button',{name:group,exact:true}).click();await page.locator('#ws-brushes').getByRole('button',{name,exact:true}).click();}
async function notes(page,id){const compact=await page.evaluate(()=>innerWidth<=1000);if(compact)await page.locator(`[data-ws-panel="${id}"]`).click();else await page.locator('#ws-panel-'+id).click();}
async function closeNotes(page){if(await page.locator('#ws-inspector-dialog').isVisible())await page.locator('#ws-inspector-close').click();}
export async function checkWorkshop(browserType,{baseURL=BASE,channel='chrome',screenshots=false,widths=[320,390,768,1024,1440],desktop=true,onProgress=()=>{}}={}){
 const browser=await browserType.launch({headless:true,channel}),results=[];
 try{
  if(desktop){
   const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',acceptDownloads:true});
   try{
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});page.on('dialog',d=>d.accept());
    await page.goto(baseURL+'/#play');await page.locator('#title-workshop').click();assert.equal(await page.locator('.ws-adventure-card').count(),3);
    const original=await originals(page),packs=workshopShowcases();
    if(screenshots)await page.screenshot({path:'.playwright-mcp/workshop-shelf-desktop.png',fullPage:true});
    for(const [i,pack]of packs.entries())for(const rules of ['trail','nemesis']){
      await page.locator('.ws-adventure-card>button').nth(i).click();await page.locator('#ws-preview-dialog').waitFor();assert.match(await page.locator('#ws-preview-clear').textContent(),/verified/);
      if(i===0&&rules==='trail'){
        await page.locator('#ws-preview-watch').click();await page.locator('#ws-replay-toggle').click();await page.locator('#ws-replay-toggle').click();await page.locator('#ws-replay-reset').click();
        await page.locator('#ws-replay-step').click();assert.match(await page.locator('#ws-replay-position').textContent(),/^1\//);
        while(!await page.locator('#ws-replay-skip').isDisabled())await page.locator('#ws-replay-skip').click();assert.match(await page.locator('#ws-replay-caption').textContent(),/complete/i);
        await page.locator('#ws-replay-close').click();await page.locator('#ws-preview-add').click();
      }
      await chooseOption(page,'#ws-preview-difficulty',rules);await page.locator('#ws-preview-play').click();assert.equal(await page.locator('#game-turns').textContent(),'0');
      if(i===0)assert.doesNotMatch(await page.locator('#game-sidequests').textContent(),/weight bridge/);
      assert.match(await page.locator('#game-region').textContent(),/Player adventure/);assert.doesNotMatch(await page.locator('#game-region').textContent(),/NaN|Guild job/);
      await playGuild(page,WORKSHOP_CLEARS[i].actions);assert.equal(await page.locator('#adventure').getAttribute('data-status'),'won',pack.title+'/'+rules);
      assert.match(await page.locator('#game-primary').textContent(),/player adventures/);assert.doesNotMatch(await page.locator('#game-result-text').textContent(),/Guild|commendation/);
      await page.locator('#game-primary').click();assert.equal(await page.locator('#adventure-workshop').isVisible(),true);
      const result={world:pack.title,rules,checks:'Real playthrough, separate results, return to Workshop'};results.push(result);onProgress(result);
    }
    const alternates=JSON.parse(await readFile(new URL('../tests/fixtures/workshop-alternates.json',import.meta.url),'utf8'));
    for (const [i,proof] of alternates.entries()) { await page.locator('.ws-adventure-card>button').nth(i===0?0:1).click();await page.locator('#ws-preview-dialog').waitFor();await page.locator('#ws-preview-play').click();await playGuild(page,proof.actions);assert.equal(await page.locator('#adventure').getAttribute('data-status'),'won');await page.locator('#game-primary').click(); }
    assert.deepEqual(await originals(page),original);assert.equal(await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('tilewright.workshop.bests.v1')).records).length),6);
    await page.locator('#ws-new').click();await page.locator('#ws-new-width').fill('8');await page.locator('#ws-new-height').fill('8');await page.locator('#ws-new-form button[type="submit"]').click();
    await page.locator('#ws-title').fill('The Little Homecoming');await page.locator('#ws-author').fill('A test keeper');await page.locator('#ws-story-details summary').click();await page.locator('#ws-intro').fill('One lamp beyond the orchard. Bring its light home.');await page.locator('#ws-props-adventure button[type="submit"]').click();
    await chooseBrush(page,'Story','Talking keeper');await cell(page,6,6);await page.locator('#ws-inspect-tool').click();await cell(page,6,6);await page.locator('#ws-object-name').fill('Mira');await page.locator('#ws-object-text').fill('The river remembers every traveller.');await chooseOption(page,'#ws-object-reward','supplies');await page.locator('#ws-props-object button[type="submit"]').click();
    const draft=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('tilewright.workshop.draft.v1')));
    assert.equal((await draft()).markers.find(m=>m.kind==='guide').name,'Mira');assert.equal(await page.locator('#ws-object-fields .ws-checkbox:visible').count(),0);
    await chooseBrush(page,'Terrain','Water');await page.locator('#ws-brush').click();await chooseOption(page,'#ws-paint-mode','rectangle');await page.locator('#ws-palette-close').click();await cell(page,1,1,{dragTo:{x:2,y:2}});assert.equal((await draft()).map.layers[0].tiles[18],3);
    await page.locator('#ws-undo').click();assert.notEqual((await draft()).map.layers[0].tiles[18],3);await page.locator('#ws-redo').click();assert.equal((await draft()).map.layers[0].tiles[18],3);await page.locator('#ws-undo').click();
    await chooseBrush(page,'Stamps','Supply camp');await cell(page,4,4);assert.ok((await draft()).markers.some(m=>m.kind==='supplies'));await page.locator('#ws-undo').click();
    await chooseBrush(page,'Threats','Patrol warden');await cell(page,5,6);await page.locator('#ws-inspect-tool').click();await cell(page,5,6);await page.locator('#ws-route').click();await cell(page,4,6);await cell(page,4,5);await page.locator('#ws-route-finish').click();assert.equal((await draft()).markers.find(m=>m.kind==='patrol').route.length,3);await page.locator('#ws-delete-object').click();
    await page.locator('#ws-save').click();await page.locator('#ws-test').click();await playGuild(page,['up','up','right','right','down','down','right']);assert.equal(await page.locator('#adventure').getAttribute('data-status'),'won');assert.match(await page.locator('#game-result-text').textContent(),/Creator clear recorded/);
    await page.locator('#game-primary').click();assert.equal(await page.locator('#ws-build').isVisible(),true);assert.ok((await draft()).proof);
    if(screenshots)await page.screenshot({path:'.playwright-mcp/workshop-designer-desktop.png',fullPage:true});
    await page.locator('#ws-share').click();await page.locator('#ws-share-dialog').waitFor();assert.equal(await page.locator('#ws-copy-link').isDisabled(),true);assert.match(await page.locator('#ws-share-clear').textContent(),/Verified/);
    const code=await page.locator('#ws-export-code').inputValue();const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#ws-download').click()]);const chunks=[];for await(const c of await download.createReadStream())chunks.push(c);const file=Buffer.concat(chunks);assert.equal(parseAdventure(file.toString()).title,'The Little Homecoming');
    if(screenshots)await page.screenshot({path:'.playwright-mcp/workshop-share-desktop.png',fullPage:true});
    await page.locator('#ws-share-close').click();await page.reload();await page.locator('#title-workshop').click();await page.locator('#ws-tab-build').click();assert.equal(await page.locator('#ws-title').inputValue(),'The Little Homecoming');assert.ok((await draft()).proof);
    await page.locator('#ws-title').fill('The Edited Homecoming');await page.locator('#ws-props-adventure button[type="submit"]').click();assert.equal((await draft()).proof,undefined);
    const unchanged=await originals(page);await page.locator('#ws-tab-import').click();await page.locator('#ws-import-code').fill('LT1.incomplete');await page.locator('#ws-import-code-button').click();assert.match(await page.locator('#ws-status').textContent(),/complete/);
    await page.locator('#ws-file').setInputFiles({name:'friends-world.trail.json',mimeType:'application/json',buffer:file});await page.locator('#ws-preview-dialog').waitFor();assert.match(await page.locator('#ws-preview-clear').textContent(),/verified/);await page.locator('#ws-preview-close').click();
    await page.locator('#ws-import-code').fill(code);await page.locator('#ws-import-code-button').click();await page.locator('#ws-preview-dialog').waitFor();assert.equal(await page.locator('#ws-preview-title').textContent(),'The Little Homecoming');await page.locator('#ws-preview-close').click();assert.deepEqual(await originals(page),unchanged);assert.equal((await draft()).title,'The Edited Homecoming');
    await page.goto(baseURL+'/#adventure='+code);await page.locator('#ws-preview-dialog').waitFor();assert.equal(await page.locator('#game-layout').isVisible(),false);await page.locator('#ws-preview-close').click();
    const bad=blankAdventure();bad.proof={difficulty:'trail',actions:['wait']};await page.goto(baseURL+'/#adventure='+adventureCode(bad));await page.waitForFunction(()=>document.querySelector('#ws-status').dataset.error==='true');assert.match(await page.locator('#ws-status').textContent(),/does not finish/);assert.equal(await page.locator('#game-layout').isVisible(),false);
    assert.deepEqual(errors,[]);results.push({checks:'Creation, stories, paint/undo/redo, stamps, routes, real creator clear, file/code/URL import, invalid proof rejection, draft restoration and save isolation'});
    // A second browser storage space receives the exported file and code.
    const receiver=await browser.newContext({viewport:{width:1280,height:900}});try{const other=await receiver.newPage();await other.goto(baseURL+'/#adventure='+code);await other.locator('#ws-preview-dialog').waitFor();assert.equal(await other.locator('#ws-preview-title').textContent(),'The Little Homecoming');await other.locator('#ws-preview-add').click();await other.locator('#ws-preview-play').click();await playGuild(other,['up','up','right','right','down','down','right']);assert.equal(await other.locator('#adventure').getAttribute('data-status'),'won');assert.equal(await other.evaluate(()=>JSON.parse(localStorage.getItem('tilewright.workshop.v1')).entries.length),1);}finally{await receiver.close();}
   }finally{await context.close();}
  }
  if(desktop) { results.push(...await recoveryChecks(browser,baseURL)); results.push(...await designerChecks(browser,baseURL)); }
  for(const width of widths){
   const context=await browser.newContext({viewport:{width,height:900},hasTouch:width<=1000,acceptDownloads:true});
   try{const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());await page.goto(baseURL+'/#play');await page.locator('#title-workshop').click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
    await page.locator('.ws-adventure-card>button').first().click();await page.locator('#ws-preview-dialog').waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);await page.locator('#ws-preview-close').click();
    await page.locator('#ws-tab-build').click();await notes(page,'adventure');await page.locator('#ws-title').fill('A touch-built world');await page.locator('#ws-props-adventure button[type="submit"]').click();await closeNotes(page);
    await chooseBrush(page,'Goals','Treasure');await cell(page,4,4,{touch:width<=1000});assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('tilewright.workshop.draft.v1')).markers.filter(m=>m.kind==='coin').length),1);
    await page.locator('#ws-undo').click();await page.locator('#ws-redo').click();await notes(page,'checks');assert.match(await page.locator('#ws-check-title').textContent(),/Ready/);await closeNotes(page);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
    const fit=await page.locator('#ws-viewport').evaluate(el=>[el.scrollWidth-el.clientWidth,el.scrollHeight-el.clientHeight]);assert.ok(fit.every(n=>n<=1),'Fit should show the whole world without inner scrolling.');
    if(screenshots&&[390,1440].includes(width))await page.screenshot({path:`.playwright-mcp/workshop-designer-${width}.png`,fullPage:true});
    await page.locator('#ws-share').click();await page.locator('#ws-share-dialog').waitFor();await page.locator('#ws-manual-copy summary').click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);await page.locator('#ws-share-close').click();
    if(width<=1024){await page.locator('#ws-tab-shelf').click();const i=width===390?1:width===768?2:0;await page.locator('.ws-adventure-card>button').nth(i).click();await page.locator('#ws-preview-dialog').waitFor();await page.locator('#ws-preview-play').click();await playGuild(page,WORKSHOP_CLEARS[i].actions,width<=1000);assert.equal(await page.locator('#adventure').getAttribute('data-status'),'won');await page.locator('#game-primary').click();}
    await page.locator('#ws-home').click();assert.equal(await page.locator('#game-title-screen').isVisible(),true);assert.deepEqual(errors,[]);results.push({width,checks:'Responsive shelf, preview, properties dialog, touch painting, undo/redo, fit world, sharing and Main menu'});onProgress(results.at(-1));
   }finally{await context.close();}
  }
  return{browser:browser.version(),results};
 }finally{await browser.close();}
}

async function recoveryChecks(browser,baseURL) {
 const results=[],context=await browser.newContext({viewport:{width:1440,height:1000}});
 try {
  const page=await context.newPage();page.on('dialog',d=>d.accept());await page.goto(baseURL+'/#play');await page.locator('#title-workshop').click();
  for (const region of WORLD_REGIONS) for (const mission of WORLD_MISSIONS) {
   await page.locator('#ws-new-draft').isVisible().then(async visible=>{await page.locator(visible?'#ws-new-draft':'#ws-new').click();});
   await chooseOption(page,'#ws-new-mode','seed');await chooseOption(page,'#ws-new-region',region.id);await chooseOption(page,'#ws-new-mission',mission.id);await page.locator('#ws-new-form button[type="submit"]').click();
   assert.equal(await page.locator('#ws-build').isVisible(),true);await notes(page,'checks');assert.match(await page.locator('#ws-check-title').textContent(),/Ready/);
  }
  results.push({checks:'All 20 region/mission recipes created through visible controls'});
  await page.locator('#ws-new-draft').click();await chooseOption(page,'#ws-new-mode','current');await page.locator('#ws-new-form button[type="submit"]').click();assert.match(await page.locator('#ws-description').inputValue(),/painted world/);
  await chooseOption(page,'#ws-zoom','2');await page.locator('#ws-pan-tool').click();await cell(page,2,2,{dragTo:{x:1,y:1}});await chooseOption(page,'#ws-zoom','fit');
  await notes(page,'adventure');await page.locator('#ws-title').fill('Details saved on leaving');await page.locator('#ws-home').click();await page.locator('#title-workshop').click();await page.locator('#ws-tab-build').click();assert.equal(await page.locator('#ws-title').inputValue(),'Details saved on leaving');
  await page.locator('#ws-tab-import').click();await page.locator('#ws-file').setInputFiles({name:'too-big.json',mimeType:'application/json',buffer:Buffer.alloc(400001)});await page.waitForFunction(()=>document.querySelector('#ws-status').textContent.includes('400 KB'));assert.equal(await page.locator('#ws-preview-dialog').isVisible(),false);
  results.push({checks:'Terrain copy, pan/fit, unapplied form preservation, oversized-file rejection'});
 } finally { await context.close(); }
 const blocked=await browser.newContext({viewport:{width:1440,height:1000}});
 try {
  await blocked.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new DOMException('blocked','QuotaExceededError');};Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('denied');}}});});
  const page=await blocked.newPage();page.on('dialog',d=>d.accept());await page.goto(baseURL+'/#adventure='+adventureCode(blankAdventure(8,8)));await page.locator('#ws-preview-dialog').waitFor();await page.locator('#ws-preview-remix').click();await page.locator('#ws-test').click();await playGuild(page,['up','up','right','right','down','down','right']);assert.equal(await page.locator('#adventure').getAttribute('data-status'),'won');assert.match(await page.locator('#game-result-text').textContent(),/Saving unavailable/);await page.locator('#game-primary').click();assert.match(await page.locator('#ws-draft-state').textContent(),/Saving unavailable/);await page.locator('#ws-share').click();await page.locator('#ws-share-dialog').waitFor();await page.locator('#ws-copy-code').click();assert.equal(await page.locator('#ws-manual-copy').getAttribute('open'),'');assert.match(await page.locator('#ws-share-status').textContent(),/manually/);assert.match(await page.locator('#ws-export-code').inputValue(),/^LT1\./);
  results.push({checks:'Blocked storage retains actual completion and creator clear in session; denied clipboard exposes manual code'});
 } finally { await blocked.close(); }
 const damaged=await browser.newContext({viewport:{width:1440,height:1000}});
 try { const page=await damaged.newPage();page.on('dialog',d=>d.accept());await damaged.addInitScript(()=>{localStorage.setItem('tilewright.workshop.v1','damaged original shelf');});await page.goto(baseURL+'/#adventure='+adventureCode(blankAdventure(8,8)));await page.locator('#ws-preview-dialog').waitFor();await page.locator('#ws-preview-remix').click();await page.locator('#ws-test').click();await playGuild(page,['up','up','right','right','down','down','right']);assert.equal(await page.locator('#adventure').getAttribute('data-status'),'won');assert.equal(await page.evaluate(()=>localStorage.getItem('tilewright.workshop.v1')),'damaged original shelf');results.push({checks:'A creator clear never overwrites an unreadable shelf unless the player explicitly saves an adventure'}); } finally {await damaged.close();}
 return results;
}

async function designerChecks(browser,baseURL) {
 const context=await browser.newContext({viewport:{width:1440,height:1000},hasTouch:true});
 try {
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(baseURL+'/#play');await page.locator('#title-workshop').click();await page.locator('#ws-tab-build').click();
  for(const item of OBJECTS){await chooseBrush(page,item.group,item.name);await cell(page,6,6);await page.locator('#ws-inspect-tool').click();await cell(page,6,6);for(let n=0;n<2&&!(await page.locator('#ws-object-kind').textContent()).includes(item.name);n++)await cell(page,6,6);assert.match(await page.locator('#ws-object-kind').textContent(),new RegExp(item.name));const checks=item.id==='lever'?2:['hunter','watcher'].includes(item.id)?1:0;assert.equal(await page.locator('#ws-object-fields .ws-checkbox:visible').count(),checks,item.id+' should show only its own settings');}
  await chooseBrush(page,'Terrain','Stone');await page.locator('#ws-brush').click();await page.locator('#ws-layer-visible').uncheck();await page.locator('#ws-palette-close').click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('tilewright.workshop.draft.v1')).map.layers[0].visible),false);await page.locator('#ws-undo').click();
  await page.locator('[data-ws-quick="terrain:7"]').click();await page.locator('#ws-brush').click();await page.locator('#ws-layer-visible').uncheck();await page.locator('#ws-palette-close').click();await page.locator('[data-ws-quick="terrain:1"]').click();await page.locator('#ws-brush').click();assert.equal(await page.locator('#ws-layer-visible').isChecked(),true,'Quick terrain brushes must show the selected layer’s real visibility');await page.locator('#ws-palette-close').click();await page.locator('#ws-undo').click();
  const before=await page.evaluate(()=>localStorage.getItem('tilewright.workshop.draft.v1'));const r=await page.locator('#ws-canvas').boundingBox();
  if(browser.browserType().name()==='chromium'){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await cdp.detach();}
  else{await page.locator('#ws-canvas').evaluate(node=>node.addEventListener('pointerdown',event=>window.cancelledStroke=event.pointerId,{once:true}));await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.locator('#ws-canvas').evaluate(node=>node.dispatchEvent(new PointerEvent('pointercancel',{pointerId:window.cancelledStroke})));await page.mouse.up();}
  assert.equal(await page.evaluate(()=>localStorage.getItem('tilewright.workshop.draft.v1')),before,'Cancelled pointer strokes must not save edits');
  await page.locator('#ws-panel-adventure').click();await page.locator('#ws-title').fill('A Nemesis creator clear');await page.locator('#ws-world-details summary').click();await chooseOption(page,'#ws-test-rules','nemesis');await page.locator('#ws-props-adventure button[type="submit"]').click();assert.deepEqual(errors,[]);
  return [{checks:'All 24 object inspectors hide irrelevant settings; layer visibility, cancelled pointer stroke, and Nemesis playtest controls'}];
 } finally { await context.close(); }
}

export { designerChecks };
