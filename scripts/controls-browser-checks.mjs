import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { enterFirstTrail, clickControl } from './ui-driver.mjs';
import { createCampaign } from '../src/adventure-levels.mjs';
const first=createCampaign()[0],directions={up:'ArrowUp',right:'ArrowRight',down:'ArrowDown',left:'ArrowLeft',wait:'Space'};
const turns=async page=>Number(await page.locator('#game-turns').textContent());
async function choose(page,changes){await page.locator('#game-controls-settings').click();for(const [id,value]of Object.entries(changes))await page.locator(`#settings-${id}`).selectOption(value);await page.locator('#settings-close').click();}
async function moveOnMap(page,direction,style,touch=false,cdp=null){
  if(direction==='wait'){await page.locator('#game-wait').click();return;}
  const canvas=page.locator('#adventure-canvas');await canvas.scrollIntoViewIfNeeded();
  const point=await canvas.evaluate((node,{direction,style,width,height})=>{
    const r=node.getBoundingClientRect(),match=node.getAttribute('aria-label').match(/Column (\d+), row (\d+)/),x=Number(match[1])-1,y=Number(match[2])-1,columns=node.width/24,rows=node.height/24;
    const left=Math.max(0,Math.min(width-columns,x-(columns-1)/2)),top=Math.max(0,Math.min(height-rows,y-(rows-1)/2));
    const origin=style==='tap'?{x:r.left+r.width*(x-left+.5)/columns,y:r.top+r.height*(y-top+.5)/rows}:{x:r.left+r.width/2,y:r.top+r.height/2};
    const dx={left:-1,right:1}[direction]||0,dy={up:-1,down:1}[direction]||0;
    const distance=Math.max(18,Math.min(40,dx?(dx>0?r.right-origin.x:origin.x-r.left)-2:(dy>0?r.bottom-origin.y:origin.y-r.top)-2));
    return {origin,end:{x:origin.x+dx*distance,y:origin.y+dy*distance}};
  },{direction,style,width:first.map.width,height:first.map.height});
  if(style==='tap'){await page.touchscreen.tap(point.end.x,point.end.y);}
  else if(cdp){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:point.origin.x,y:point.origin.y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.end.x,y:point.end.y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  else{await page.mouse.move(point.origin.x,point.origin.y);await page.mouse.down();await page.mouse.move(point.end.x,point.end.y,{steps:3});await page.mouse.up();}
}
async function layout(page){
 await page.waitForFunction(()=>{const c=document.querySelector('#adventure-canvas').getBoundingClientRect(),v=document.querySelector('#game-viewport').getBoundingClientRect();return c.width>0&&c.left>=v.left-1&&c.right<=v.right+1&&c.top>=v.top-1&&c.bottom<=v.bottom+1;},null,{timeout:4000});
 const state=await page.evaluate(()=>{const box=s=>document.querySelector(s).getBoundingClientRect().toJSON();return {width:innerWidth,scroll:document.documentElement.scrollWidth,layout:box('#game-layout'),canvas:box('#adventure-canvas'),view:box('#game-viewport'),controls:box('.game-controls')};});
 assert.ok(state.scroll<=state.width,'No sideways page scroll');assert.ok(state.canvas.width>0&&state.canvas.height>0);assert.ok(state.canvas.left>=state.view.left-1&&state.canvas.right<=state.view.right+1);assert.ok(state.canvas.top>=state.view.top-1&&state.canvas.bottom<=state.view.bottom+1);assert.ok(state.controls.bottom<=state.layout.bottom+1,'All controls fit inside the game layout');
}
export async function checkControls(browserType,{baseURL='http://127.0.0.1:4174',channel,screenshots=false,onProgress=()=>{},sizes=[[320,568],[390,844],[430,932],[768,1024],[820,1180],[1024,768],[1280,720],[844,390],[568,320],[600,800]]}={}){
 const browser=await browserType.launch({headless:true,...(channel?{channel}:{})}),results=[],report=value=>{results.push(value);onProgress(value);},route=JSON.parse(await readFile(new URL('../tests/fixtures/adventure-routes.json',import.meta.url),'utf8'))['trail-1'];
 try{
  const context=await browser.newContext({viewport:{width:1280,height:900},hasTouch:true,reducedMotion:'reduce'});context.setDefaultTimeout(15_000);
  try{
   await context.addInitScript(()=>{window.__controlPad={connected:true,mapping:'standard',index:0,id:'test standard controller',axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[window.__controlPad],configurable:true});});
   const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('response',response=>{if(response.status()>=400)errors.push(response.url());});await page.goto(baseURL);await page.locator('#title-settings').click();await page.locator('#settings-tab-controls').click();assert.equal(await page.locator('#settings-controls').isVisible(),true);await page.locator('#settings-keyboard-layout').selectOption('ijkl');await page.locator('#settings-controls-style').selectOption('keyboard');await page.locator('#settings-close').click();await page.reload();await page.locator('#title-settings').click();await page.locator('#settings-tab-controls').click();assert.equal(await page.locator('#settings-keyboard-layout').inputValue(),'ijkl');assert.equal(await page.locator('#settings-controls-style').inputValue(),'keyboard');await page.locator('#settings-close').click();await enterFirstTrail(page);
   assert.equal(await page.locator('.direction-pad').isVisible(),false);await page.locator('#adventure-canvas').focus();await page.keyboard.down('i');assert.equal(await turns(page),1);await page.keyboard.down('i');assert.equal(await turns(page),1);await page.keyboard.up('i');
   for(const action of route.slice(1)){await page.locator('#adventure-canvas').focus();await page.keyboard.press({up:'i',right:'l',down:'k',left:'j',wait:'Space'}[action]);}assert.equal(await page.locator('#adventure').getAttribute('data-status'),'won');report({checks:'Saved IJKL keyboard layout, keyboard-focus UI, one step per key press, full native mission win.'});
   for(const style of ['pad','swipe','tap']){
    await clickControl(page,'#game-restart');await choose(page,{'controls-style':style,'pad-side':'right','control-size':'large'});const before=await turns(page);await layout(page);assert.equal(await turns(page),before);
    if(style==='pad'){const sizes=await page.locator('[data-move="up"]').boundingBox();assert.ok(sizes.width>=52&&sizes.height>=52);const pad=await page.locator('.direction-pad').boundingBox(),dash=await page.locator('#dash-button').boundingBox();assert.ok(pad.x>dash.x);}
    else assert.equal(await page.locator('.direction-pad').isVisible(),false);
    for(const action of route){if(style==='pad')await page.locator(action==='wait'?'#game-wait':`[data-move="${action}"]`).tap();else await moveOnMap(page,action,style,true);}
    assert.equal(await page.locator('#adventure').getAttribute('data-status'),'won',style);report({style,checks:'Complete native mission, live style switching, large buttons, right-side pad, and fitted controls.'});
   }
   await clickControl(page,'#game-restart');await choose(page,{'controls-style':'auto','keyboard-layout':'wasd','control-size':'comfortable','pad-side':'left'});await page.locator('#adventure-canvas').focus();const before=await turns(page);
   // Interrupt real captured pointers; synthetic cancellation models browser loss.
   for(const type of ['pointercancel','lostpointercapture']){
    const canvas=page.locator('#adventure-canvas');await canvas.scrollIntoViewIfNeeded();const r=await canvas.boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2;
    await canvas.evaluate(node=>node.addEventListener('pointerdown',event=>window.__lastPointer=event.pointerId,{once:true}));await page.mouse.move(x,y);await page.mouse.down();
    if(type==='lostpointercapture')await canvas.evaluate(node=>node.releasePointerCapture(window.__lastPointer));else await canvas.dispatchEvent(type,{pointerId:await page.evaluate(()=>window.__lastPointer)});
    await page.mouse.move(x,y-45,{steps:3});await page.mouse.up();assert.equal(await turns(page),before);
   }
   if(browserType.name()==='chromium'){
    const canvas=page.locator('#adventure-canvas');await canvas.scrollIntoViewIfNeeded();const r=await canvas.boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2,cdp=await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1},{x:x+30,y,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-45,id:1},{x:x+30,y:y-45,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await turns(page),before);
   }
   await page.locator('#game-controls-settings').click();await page.locator('.controller-options>summary').click();await page.locator('#settings-gamepad').selectOption('on');await page.waitForFunction(()=>document.querySelector('#settings-gamepad-status').textContent.includes('ready'));
   const hold=async index=>page.evaluate(index=>window.__controlPad.buttons[index].pressed=true,index),release=async()=>{await page.evaluate(()=>window.__controlPad.buttons.forEach(button=>button.pressed=false));await page.waitForTimeout(40);};
   // A Back press closes the menu, but holding it through the close must not spend a wait turn.
   await hold(1);await page.locator('#game-settings-dialog').waitFor({state:'hidden'});await page.waitForTimeout(200);assert.equal(await turns(page),before);await release();await hold(1);await page.waitForFunction(old=>Number(document.querySelector('#game-turns').textContent)===old+1,before);await page.waitForTimeout(200);assert.equal(await turns(page),before+1);await release();
   await hold(9);await page.locator('#game-overlay').waitFor();await release();const paused=await turns(page);await hold(12);await page.waitForTimeout(100);assert.equal(await turns(page),paused);await release();await hold(1);await page.locator('#game-overlay').waitFor({state:'hidden'});await release();assert.equal(await turns(page),paused);
   await page.locator('#game-controls-settings').click();await page.locator('#settings-gamepad').selectOption('off');await page.locator('#settings-close').click();report({checks:'Cancellation cannot move; simulated standard-controller polling, one action per press, held-menu isolation, pause navigation, and touch/keyboard fallback.'});
   // Training uses the same selected keyboard and movement preferences.
   await page.locator('#game-home').click();await page.locator('#title-training').click();await page.locator('[data-training-lesson="play"]').click();await page.locator('#training-controls-settings').click();await page.locator('#settings-keyboard-layout').selectOption('ijkl');await page.locator('#settings-controls-style').selectOption('tap');await page.locator('#settings-close').click();await page.locator('#training-map').focus();await page.keyboard.press('i');assert.match(await page.locator('#training-map').getAttribute('aria-label'),/Turn 1/);assert.equal(await page.locator('.training-dpad').isVisible(),false);assert.deepEqual(errors,[]);report({checks:'Training honors saved keyboard and touch style; no page errors or missing assets.'});
  }finally{await context.close();}
  for(const [width,height]of sizes){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true,...(browserType.name()!=='firefox'?{isMobile:width<768}:{}),deviceScaleFactor:width<1100?2:1,reducedMotion:'reduce'});context.setDefaultTimeout(15_000);
   try{const page=await context.newPage();await page.goto(baseURL);await enterFirstTrail(page);const start=await turns(page);for(const style of ['auto','pad','swipe','tap','keyboard']){await choose(page,{'controls-style':style,'control-size':'large','pad-side':'right'});await layout(page);assert.equal(await turns(page),start);}
    await choose(page,{'controls-style':'pad'});await page.locator('[data-move="up"]').tap();assert.equal(await turns(page),1);await page.setViewportSize({width:height,height:width});await layout(page);assert.equal(await turns(page),1);await page.setViewportSize({width,height});
    if(screenshots&&[390,820,844].includes(width)){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`.playwright-mcp/controls-${browserType.name()}-${width}.png`,fullPage:true});await page.locator('#game-controls-settings').click();await page.screenshot({path:`.playwright-mcp/options-${browserType.name()}-${width}.png`,fullPage:true});await page.locator('#settings-close').click();}
    if(width===390){await choose(page,{'controls-style':'swipe'});const cdp=browserType.name()==='chromium'?await context.newCDPSession(page):null;for(const direction of route.slice(1)){await moveOnMap(page,direction,'swipe',false,cdp);}assert.equal(await page.locator('#adventure').getAttribute('data-status'),'won');}
    report({width,height,checks:'All five styles fit, live changes spend no turns, 52px pad, native tap, rotation preserves the run'+(width===390?', complete phone swipe mission.':'.')});
   }finally{await context.close();}
  }
  for(const mode of ['blocked','full','old']){const context=await browser.newContext({hasTouch:true});try{await context.addInitScript(mode=>{const key='tilewright.preferences.v1';if(mode==='old')localStorage.setItem(key,JSON.stringify({version:1,preferences:{volume:25,motion:'reduced',text:'large'}}));else{const method=mode==='blocked'?'getItem':'setItem',original=Storage.prototype[method];Storage.prototype[method]=function(...args){if(args[0]===key)throw Error('blocked');return original.apply(this,args);};}},mode);const page=await context.newPage();await page.goto(baseURL);await enterFirstTrail(page);await choose(page,{'controls-style':'tap'});await moveOnMap(page,'up','tap',true);assert.equal(await turns(page),1);report({storage:mode,checks:'Old or unavailable preferences keep controls usable.'});}finally{await context.close();}}
  return {browser:await browser.version(),results};
 }finally{await browser.close();}
}
