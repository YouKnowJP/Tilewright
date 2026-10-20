import assert from 'node:assert/strict';
import { editorButton, revealEditorControl, closeEditorPanels } from './ui-driver.mjs';
async function cell(page,id,x,y,width,height){await page.locator(id).scrollIntoViewIfNeeded();const r=await page.locator(id).boundingBox();await page.mouse.click(r.x+(x+.5)*r.width/width,r.y+(y+.5)*r.height/height);}
async function guide(page,trigger){const before=await page.evaluate(()=>JSON.stringify(Object.entries(localStorage).sort()));await page.locator(trigger).click();for(let i=0;i<3;i++){assert.equal(await page.locator('#creator-guide-position').textContent(),`${i+1} / 3`);assert.equal(await page.locator('#creator-guide-copy section').count(),3);await page.keyboard.press('r');await page.keyboard.press('ArrowUp');await page.locator('#creator-guide-next').click();}assert.equal(await page.locator('#creator-guide-dialog').isVisible(),false);assert.equal(await page.evaluate(()=>JSON.stringify(Object.entries(localStorage).sort())),before);assert.equal(await page.evaluate(()=>document.activeElement.id),trigger.slice(1));}
export async function checkCreators(browserType,{baseURL='http://127.0.0.1:4174',channel='chrome',screenshots=false,onProgress=()=>{}}={}){
 const browser=await browserType.launch({headless:true,channel}),results=[];
 try{
 for(const [width,height]of [[320,740],[390,900],[768,900],[1024,768],[1440,900],[320,568],[844,390]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',acceptDownloads:true});
  try{
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+':'+r.url());});page.on('dialog',d=>d.accept());
   await page.goto(baseURL);await page.locator('#loading-note').waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
   assert.equal(await page.locator('#editor').isVisible(),true);assert.equal(await page.locator('.inspector').isVisible(),width>1100);
   await guide(page,width<=1100?'#maker-guide':'#maker-guide-wide');
   await editorButton(page,{name:'Sand tile',exact:true});if(width<=1100)assert.equal(await page.locator('#maker-palette-dialog').isVisible(),false);
   // Palette selection leaves keyboard painting on the canvas, including after
   // a native dialog's asynchronous close event.
   if(width<=1100){await page.waitForFunction(()=>document.activeElement.id==='map');assert.equal(await page.evaluate(()=>document.activeElement.id),'map');}
   await cell(page,'#map',2,2,28,20);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('tilewright.document.v1')).layers[0].tiles[58]),4);
   const terrain=await page.evaluate(()=>localStorage.getItem('tilewright.document.v1'));
   await page.locator('#maker-use-terrain').click();await page.locator('#ws-new-dialog').waitFor();assert.equal(await page.locator('#ws-new-mode').inputValue(),'current');assert.equal(await page.locator('#ws-new-art').evaluate(c=>c.width>0&&c.height>0),true);
   await page.locator('#ws-new-form button[type="submit"]').click();await page.locator('#ws-build').waitFor();assert.equal(await page.locator('#ws-heading').textContent(),'World studio');
   assert.equal(await page.evaluate(()=>localStorage.getItem('tilewright.document.v1')),terrain);
   assert.equal(await page.locator('[data-ws-quick]').count(),8);assert.ok(await page.locator('#ws-quest-strip button').count()>=3);
   await guide(page,'#ws-guide');
   await page.locator('[data-ws-quick="object:lantern"]').click();await cell(page,'#ws-canvas',3,3,28,20);
   const count=await page.evaluate(()=>JSON.parse(localStorage.getItem('tilewright.workshop.draft.v1')).markers.filter(m=>m.kind==='lantern').length);assert.ok(count>=2);await page.locator('#ws-undo').click();await page.locator('#ws-redo').click();
   if(width<=1000)await page.locator('[data-ws-panel="adventure"]').click();else await page.locator('#ws-panel-adventure').click();
   assert.equal(await page.locator('#ws-story-details').getAttribute('open'),null);await page.locator('#ws-story-details summary').click();await page.locator('#ws-intro').fill('A lantern waits beyond the new path.');if(width===390)await page.locator('#ws-title').fill('W'.repeat(64));await page.locator('#ws-props-adventure button[type="submit"]').click();if(width<=1000)await page.locator('#ws-inspector-close').click();
   if(width===390){await page.locator('[data-ws-panel="adventure"]').click();await page.locator('#ws-challenge-details summary').click();await page.locator('#ws-par').fill('0');await page.locator('#ws-challenge-details summary').click();await page.locator('#ws-inspector-close').click();await page.locator('#ws-save').click();assert.equal(await page.locator('#ws-inspector-dialog').isVisible(),true);assert.equal(await page.locator('#ws-par').isVisible(),true);await page.locator('#ws-par').fill('120');await page.locator('#ws-props-adventure button[type="submit"]').click();await page.locator('#ws-inspector-close').click();}
   await page.locator('#ws-step-design').click();assert.equal(await page.locator('#ws-props-adventure').isVisible(),true);if(width<=1000)await page.locator('#ws-inspector-close').click();
   if(width<=1000)await page.locator('[data-ws-panel="checks"]').click();else await page.locator('#ws-panel-checks').click();assert.equal(await page.locator('#ws-readiness strong').count(),2);assert.match(await page.locator('#ws-readiness').textContent(),/World structure|Creator clear/);if(width<=1000)await page.locator('#ws-inspector-close').click();
   const fit=await page.locator('#ws-viewport').evaluate(el=>[el.scrollWidth-el.clientWidth,el.scrollHeight-el.clientHeight]);assert.ok(fit.every(n=>n<=1),'Fit keeps the whole adventure in its workspace');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
   if(screenshots&&[390,1440].includes(width))await page.screenshot({path:`.playwright-mcp/creator-studio-${width}.png`,fullPage:true});
   await page.locator('#ws-home').click();assert.equal(await page.locator('#game-title-screen').isVisible(),true);await page.locator('#title-mapmaker').click();await revealEditorControl(page,page.locator('#map-name'));assert.equal(await page.locator('#map-name').inputValue(),'Willowbend');await closeEditorPanels(page);assert.equal(await page.evaluate(()=>localStorage.getItem('tilewright.document.v1')),terrain);
   assert.deepEqual(errors,[]);const result={width,height,checks:'Unified creator shell, native panels/focus, three guide pages, terrain-to-adventure handoff, quick brushes/history, story disclosure, readiness, fit, save preservation and Main menu'};results.push(result);onProgress(result);
  }finally{await context.close();}
 }
 return {browser:browser.version(),results};
 }finally{await browser.close();}
}
