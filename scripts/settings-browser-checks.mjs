import assert from 'node:assert/strict';
import { chooseOption,enterFirstTrail } from './ui-driver.mjs';
const gameTurn=async page=>Number(await page.locator('#game-turns').textContent());
const lessonTurn=async page=>Number((await page.locator('#training-map').getAttribute('aria-label')).match(/Turn (\d+)/)[1]);
async function fitDialog(page){
  const state=await page.locator('#game-settings-dialog').evaluate(dialog=>({width:innerWidth,page:document.documentElement.scrollWidth,inside:dialog.scrollWidth,client:dialog.clientWidth,boxes:[...dialog.querySelectorAll('button,input,[role="combobox"]')].filter(node=>node.getClientRects().length).map(node=>{const b=node.getBoundingClientRect();return {id:node.id,w:b.width,left:b.left,right:b.right};})}));
  assert.equal(state.page,state.width);assert.ok(state.inside<=state.client+1);for(const box of state.boxes)assert.ok(box.w>=20&&box.left>=0&&box.right<=state.width,JSON.stringify(box));
}
export async function checkSettings(browserType,{baseURL='http://127.0.0.1:4174',channel,widths=[320,390,844,1440],screenshots=false,onProgress=()=>{}}={}){
  const browser=await browserType.launch({headless:true,...(channel?{channel}:{})}),results=[];
  const report=checks=>{results.push({checks});onProgress({checks});};
  try{
    for(const width of widths){
      const context=await browser.newContext({viewport:{width,height:width===320?568:width===390?844:width===844?390:1000},hasTouch:true});context.setDefaultTimeout(15000);
      try{
        const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
        await page.goto(baseURL);await page.locator('#loading-note[hidden]').waitFor({state:'attached'});await page.locator('#title-settings').click();
        for(const volume of ['0','100','35']){await page.locator('#settings-volume').focus();await page.keyboard.press(volume==='0'?'Home':'End');if(volume==='35'){await page.keyboard.press('Home');for(let i=0;i<7;i++)await page.keyboard.press('ArrowRight');}assert.equal(await page.locator('#settings-volume-value').textContent(),`${volume}%`);}
        await page.locator('[data-sound="on"]').click();await page.waitForFunction(()=>document.querySelector('[data-sound="on"]').getAttribute('aria-pressed')==='true');await page.locator('[data-sound="off"]').click();await page.waitForFunction(()=>document.querySelector('[data-sound="off"]').getAttribute('aria-pressed')==='true');
        for(const mode of ['reduced','system','reduced']){await page.locator(`[data-motion="${mode}"]`).click();assert.equal(await page.locator('body').getAttribute('data-game-motion'),mode);}
        await page.locator('[data-text-size="large"]').click();await fitDialog(page);await page.locator('#settings-tab-controls').click();
        for(const [id,values]of Object.entries({'controls-style':['auto','pad','swipe','tap','keyboard'],'keyboard-layout':['wasd','ijkl','arrows'],'pad-side':['left','right'],'control-size':['comfortable','large'],'key-repeat':['off','on']})){
          for(const value of values){await chooseOption(page,`#settings-${id}`,value);assert.equal(await page.locator(`#settings-${id}`).inputValue(),value);await fitDialog(page);}
        }
        await page.locator('.controller-options>summary').click();for(const value of ['on','off']){await chooseOption(page,'#settings-gamepad',value);assert.equal(await page.locator('#settings-gamepad').inputValue(),value);}await fitDialog(page);
        if(screenshots)await page.screenshot({path:`.playwright-mcp/settings-matrix-${browserType.name()}-${width}.png`});
        await page.locator('#settings-close').click();await page.reload();await page.locator('#loading-note[hidden]').waitFor({state:'attached'});await page.locator('#title-settings').click();
        assert.equal(await page.locator('[data-text-size="large"]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#settings-volume').inputValue(),'35');assert.equal(await page.locator('[data-sound="off"]').getAttribute('aria-pressed'),'true');await page.locator('#settings-tab-controls').click();
        for(const [id,value]of Object.entries({'controls-style':'keyboard','keyboard-layout':'arrows','pad-side':'right','control-size':'large','key-repeat':'on','gamepad':'off'}))assert.equal(await page.locator(`#settings-${id}`).inputValue(),value);
        await chooseOption(page,'#settings-key-repeat','off');await page.locator('#settings-close').click();await enterFirstTrail(page);await page.locator('#adventure-canvas').focus();await page.keyboard.press('w');assert.equal(await gameTurn(page),0,'Arrows-only layout ignores WASD.');await page.keyboard.down('ArrowUp');await page.waitForTimeout(220);await page.keyboard.down('ArrowUp');await page.keyboard.up('ArrowUp');assert.equal(await gameTurn(page),1,'A held key cannot repeat when disabled.');
        await page.locator('#game-controls-settings').click();await chooseOption(page,'#settings-key-repeat','on');await page.locator('#settings-close').click();await page.locator('#adventure-canvas').focus();await page.keyboard.down('ArrowUp');await page.waitForTimeout(220);await page.keyboard.down('ArrowUp');await page.keyboard.up('ArrowUp');assert.equal(await gameTurn(page),3,'Enabled movement repeat takes a second deliberate repeat step.');await page.keyboard.down('Space');await page.waitForTimeout(220);await page.keyboard.down('Space');await page.keyboard.up('Space');assert.equal(await gameTurn(page),4,'Wait never repeats.');assert.equal(await page.locator('#game-status-text').evaluate(node=>getComputedStyle(node).fontSize),'18px');
        await page.locator('#game-home').click();await page.locator('#title-training').click();await page.locator('[data-training-lesson="play"]').click();await page.locator('#training-map').focus();await page.keyboard.down('ArrowDown');await page.waitForTimeout(220);await page.keyboard.down('ArrowDown');await page.keyboard.up('ArrowDown');assert.equal(await lessonTurn(page),2,'Movement repeat also works in training.');await page.keyboard.down('Space');await page.waitForTimeout(220);await page.keyboard.down('Space');await page.keyboard.up('Space');assert.equal(await lessonTurn(page),3,'Training Wait never repeats.');
        assert.deepEqual(errors,[]);report(`${width}px: every control preference value, live sound, volume limits, motion and large text, reload persistence, arrows-only input, movement-repeat on/off, non-repeating Wait, and actual training input pass without overflow or runtime errors.`);
      }finally{await context.close();}
    }
    return {browser:browser.version(),results};
  }finally{await browser.close();}
}
