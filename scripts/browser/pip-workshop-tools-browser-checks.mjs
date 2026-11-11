import assert from 'node:assert/strict';
import {chooseOption,waitForGameReady} from './ui-driver.mjs';
import {DAWN_WORKSHOP_MISSIONS} from '../../src/pip-dawn-workshop.mjs';
import {DUO_KEY,DUO_STORIES} from '../../src/pip-duo.mjs';
import {solvedTinkerProject,tinkerCode,parseTinkerProject} from '../../src/pip-tinker.mjs';
async function details(p,id){if(!await p.locator(id).evaluate(n=>n.open))await p.locator(id+'>summary').click();}
async function open(p){await waitForGameReady(p);await p.locator('#title-workshop').click();await p.locator('#ws-tab-lab').click();await p.locator('#ws-duo-adventures').click();}
async function collection(p,value,id){await details(p,'#ps-chooser');await chooseOption(p,'#ps-collection',value);if(id){await details(p,'#ps-chooser');await chooseOption(p,'#ps-trial',id);}}
async function example(p){await details(p,'#ps-help');for(let i=0;i<3;i++)await p.locator('#ps-nudge').click();await p.locator('#ps-example').click();await p.locator('#game-confirm-accept').click();await p.locator('#game-confirm-dialog').waitFor({state:'detached'});}
async function win(p,ticks=98){await details(p,'#ps-test-options');await chooseOption(p,'#ps-speed','quick');await p.locator('#ps-test').click();await p.locator('#ps-run').click();await p.locator('#ps-status').filter({hasText:'Adventure complete!'}).waitFor({timeout:Math.max(15000,ticks*220+2000)});}
async function share(p){await p.locator('#ps-tab-share').click();const [d]=await Promise.all([p.waitForEvent('download'),p.locator('#ps-export').click()]),chunks=[];for await(const c of await d.createReadStream())chunks.push(c);const project=parseTinkerProject(Buffer.concat(chunks).toString());await p.locator('#ps-tab-build').click();return project;}
async function cell(p,x,y){await details(p,'#ps-map-text');await chooseOption(p,'#ps-cursor-x',String(x));await chooseOption(p,'#ps-cursor-y',String(y));await p.locator('#ps-go-tile').click();}
async function shared(p,id){const u=new URL(p.url());u.hash='pip='+tinkerCode(solvedTinkerProject(id));await p.goto(u.href);await waitForGameReady(p);await p.locator('#pip-studio[open]').waitFor();}
async function fit(p){assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.ok(await p.locator('#pip-studio').evaluate(n=>n.scrollWidth<=n.clientWidth+1));for(const control of await p.locator('#pip-studio button:visible,#pip-studio [role=combobox]:visible').all())assert.ok(await control.evaluate(n=>{const r=n.getBoundingClientRect(),d=n.closest('dialog').getBoundingClientRect();return r.left>=d.left-1&&r.right<=d.right+1;}));}
async function playDawnRepair(p,mission,width){
 const press=selector=>p.locator(selector)[width<500?'tap':'click']();
 const read=id=>p.locator('#ps-'+id).textContent(),canvas=p.locator('#ps-canvas');
 async function place(part){
  await press('[data-ps-jump=build-tools]');await chooseOption(p,'#ps-brush',part.kind);
  if(part.kind==='cargo'){
   await chooseOption(p,'#ps-cargo-match',part.channel);
   for(const [bank,cards] of [['a',part.program],['b',part.alternate]]){
    for(const [i,card] of cards.entries())await chooseOption(p,`#ps-card-route-${bank}-${i}`,card);
   }
  }else if(part.kind==='prism')await chooseOption(p,'#ps-operation',part.operation);
  else if(part.kind==='tube'){
   assert.equal(await read('channel-label'),'Tube link number');
   await chooseOption(p,'#ps-channel',part.channel);
  }
  else if(part.kind==='locker'){
   assert.equal(await read('channel-label'),'Locker link number');
   await chooseOption(p,'#ps-channel',part.channel);await chooseOption(p,'#ps-locker-mode',part.mode);
  }else{
   await chooseOption(p,'#ps-input',part.channel);await chooseOption(p,'#ps-output',part.output);
  }
  await press('[data-ps-jump=canvas]');
  const bounds=await canvas.boundingBox(),point={x:bounds.width*(part.x+.5)/mission.width,y:bounds.height*(part.y+.5)/mission.height};
  if(width<500)await p.touchscreen.tap(bounds.x+point.x,bounds.y+point.y);
  else await canvas.click({position:point});
 }
 async function plan(){
  await press('[data-ps-jump=programs]');
  for(const [i,actor] of ['pip','sprout'].entries()){
   await press('#ps-actor-'+actor);
   for(const [index,card] of mission.solution[i].entries())await chooseOption(p,`#ps-card-${actor}-${index}`,card);
  }
  await press('#ps-test-route');
  assert.equal(await read('event'),'Next milestone');
  assert.equal(await p.locator('#ps-active-tool').isVisible(),false);
  await details(p,'#ps-test-options');await chooseOption(p,'#ps-speed','quick');await press('#ps-test-options > summary');
 }
 async function milestone(turn,message){
  await press('#ps-event');await p.locator('#ps-run[aria-pressed=false]').waitFor({state:'attached'});
  assert.match(await read('status'),new RegExp('^Tick '+turn+'/240'));
  if(message)assert.match(await read('playback-state'),message);
 }
 assert.equal(await p.locator('#ps-story-goal').isVisible(),true);
 assert.match(await read('status'),new RegExp('Repair parts 0/'+mission.budget+' placed'));
 await press('[data-ps-jump=build-tools]');
 assert.equal(await p.locator('#ps-repair-help').isVisible(),true);
 if(mission.id==='duo-dawn-library'){
  assert.match(await read('repair-help'),/Otherwise should point toward K1/);
  await place(mission.solutionParts[0]);
  assert.match(await read('inspect'),/Otherwise: East → \/ East → \/ Use.*Matching cargo: West ← \/ West ← \/ Use/);
  await place(mission.solutionParts[1]);await press('#ps-undo');
  assert.match(await read('status'),/1\/2 placed.*Compass prism/);
  await place(mission.solutionParts[1]);
 }else if(mission.id==='duo-dawn-relay'){
  assert.match(await read('repair-help'),/Sprout’s road sends/);
  assert.match(await read('status'),/Parcel locker K \(2 left\)/);
  for(const part of mission.solutionParts)await place({...part,mode:'take'});
  await plan();await press('#ps-run');
  const feedback=p.locator('#ps-playback-state').filter({hasText:'Inspect both K4 locker roles'});
  await feedback.waitFor();
  assert.ok(await feedback.evaluate(n=>{
   const bounds=n.getBoundingClientRect(),dialog=n.closest('dialog'),header=dialog.querySelector('.ps-heading').getBoundingClientRect();
   return bounds.top>=header.bottom-1&&bounds.bottom<=dialog.getBoundingClientRect().bottom+1;
  }),'The advice remains readable below the fixed header.');
  assert.equal(await p.locator('#ps-next-story').isVisible(),false);
  await press('#ps-test');
  const sender=mission.solutionParts.find(part=>part.mode==='send');
  await place(sender);
  assert.match(await read('inspect'),/Parcel locker K4 · link blue · Send only/);
 }else if(mission.id==='duo-dawn-dyehouse'){
  await press('[data-ps-jump=programs]');await press('#ps-test-route');
  assert.match(await read('status'),/amber window needs/);
  assert.equal(await p.locator('#ps-status').evaluate(n=>n===document.activeElement),true);
  for(const [i,part] of mission.solutionParts.entries()){
   await place(part);
   if(i===0)assert.match(await read('status'),/1\/2 placed.*amber window needs/);
  }
 }else{
  assert.match(await read('repair-help'),/press between Pip’s well and send locker/);
  for(const part of mission.solutionParts)await place(part);
  assert.equal(await p.locator('#ps-active-tool').isVisible(),true);
  assert.match(await read('active-tool-text'),/Garden tool · Recipe press/);
  await press('#ps-inspect-mode');
  assert.equal(await p.locator('#ps-brush').inputValue(),'inspect');
  assert.equal(await p.locator('#ps-active-tool').isVisible(),false);
  const bounds=await canvas.boundingBox(),well=mission.fixed.find(part=>part.kind==='source');
  const point={x:bounds.width*(well.x+.5)/mission.width,y:bounds.height*(well.y+.5)/mission.height};
  if(width<500)await p.touchscreen.tap(bounds.x+point.x,bounds.y+point.y);
  else await canvas.click({position:point});
  assert.match(await read('inspect'),/Parcel well/);
  assert.doesNotMatch(await read('inspect'),/budget/);
 }
 await plan();
 if(mission.id==='duo-dawn-library'){
  await milestone(6,/Cargo compass loaded Otherwise/);await milestone(9,/Collected amber/);
  assert.match(await read('duo-goals'),/locker relays 1\/2.*Locker K1 empty/);
  await milestone(18,/Cargo compass loaded Matching/);
 }else if(mission.id==='duo-dawn-relay'){
  await milestone(6,/Pip: Stored parcel.*Sprout: Stored parcel/);
  assert.match(await read('duo-goals'),/Locker K1 holding amber from Pip.*Locker K4 holding blue from Sprout/);
  await press('#ps-undo');assert.match(await read('duo-goals'),/Locker K1 empty.*Locker K4 empty/);
  await milestone(6);await milestone(9);await milestone(12);
  assert.match(await read('duo-goals'),/Letters 2\/4.*Amber Quiet · Blue Quiet/);
  await milestone(36);await milestone(39);await milestone(42);
  assert.equal(await p.locator('#ps-next-story').isVisible(),false);
  assert.match(await read('duo-goals'),/lockers empty.*Amber Powered · Blue Powered/);
 }else if(mission.id==='duo-dawn-dyehouse'){
  await milestone(6,/Pressed jade into violet.*Cargo compass loaded Otherwise/);
  await milestone(9);await milestone(18);await milestone(21,/Pressed violet into amber/);await milestone(24,/Delivered amber/);
  for(const turn of [30,33,36,39,48,51,54])await milestone(turn);
  assert.match(await read('duo-goals'),/Letters 2\/3/);
  assert.equal(await p.locator('#ps-next-story').isVisible(),false);
 }else{
  await milestone(6,/Pressed amber into jade.*Cargo compass loaded Otherwise/);
  await milestone(9,/Stored parcel.*Collected jade/);
  await milestone(18,/Cargo compass loaded Matching/);
  await milestone(20,/Traveled through the tube/);
  await milestone(23,/Pressed jade into blue/);await milestone(26,/Delivered blue/);
  assert.match(await read('duo-goals'),/Letters 1\/3/);
  for(const turn of [30,33,37,40,43,52,54,57,60])await milestone(turn);
  assert.match(await read('duo-goals'),/Letters 2\/3/);
  assert.equal(await p.locator('#ps-next-story').isVisible(),false);
  for(const turn of [71,74,77,78,81,86,88,91,94])await milestone(turn);
  assert.match(await read('duo-goals'),/Letters 3\/3.*Blue Powered/);
  assert.equal(await p.locator('#ps-next-story').isVisible(),false);
 }
 await press('#ps-run');await p.locator('#ps-status').filter({hasText:'Adventure complete!'}).waitFor();
 await fit(p);
}
export async function pipWorkshopToolsScenarios(scenario){
 await scenario('pip-dawn-relay-loop-feedback-large-text',320,async p=>{
  await p.locator('#title-accessibility').click();await chooseOption(p,'#settings-reading-size','largest');
  await chooseOption(p,'#settings-contrast','high');await p.locator('#settings-close').click();
  await open(p);await collection(p,'dawn-workshop','duo-dawn-relay');
  await playDawnRepair(p,DAWN_WORKSHOP_MISSIONS[1],320);
  assert.match(await p.locator('#ps-status').textContent(),/^Tick 61\/240 · Adventure complete!/);
 });
 for(const width of [390,1440])await scenario(`pip-dawn-four-repair-missions-${width}`,width,async p=>{
  await open(p);await collection(p,'dawn-workshop');
  for(const [i,mission] of DAWN_WORKSHOP_MISSIONS.entries()){
   const ticks=[45,61,84,98][i];
   assert.equal(await p.locator('#ps-title').textContent(),mission.title);
   assert.match(await p.locator('#ps-kicker').textContent(),new RegExp('Chapter '+(i+13)+'/'+DUO_STORIES.length));
   await playDawnRepair(p,mission,width);
   assert.match(await p.locator('#ps-budget').textContent(),new RegExp(mission.budget+'/'+mission.budget));
   const status=await p.locator('#ps-status').textContent();
   assert.match(status,new RegExp('^Tick '+ticks+'/240 · Adventure complete!'));
   assert.ok(status.includes(mission.ending));
   if(i<3)await p.locator('#ps-next-story')[width<500?'tap':'click']();
  }
  assert.equal(await p.locator('#ps-next-story').isVisible(),true);
  await p.locator('#ps-next-story').click();assert.equal(await p.locator('#ps-title').textContent(),'The Bellflower Lift');
  await p.locator('#ps-close').click();await p.reload();await open(p);await collection(p,'dawn-workshop','duo-dawn-express');
  assert.match(await p.locator('#ps-best').textContent(),/98 ticks/);await fit(p);
 });
 await scenario('pip-rehearsal-filters-frame-inspection-and-undo',390,async p=>{await shared(p,'duo-dawn-express');await details(p,'#ps-rehearsal');await chooseOption(p,'#ps-rehearsal-length','240');await p.locator('#ps-rehearse').click();assert.match(await p.locator('#ps-rehearsal-note').textContent(),/98 ticks rehearsed · route complete/);assert.equal(await p.locator('#ps-test').textContent(),'Test invention');let j=JSON.parse(await p.evaluate(k=>localStorage.getItem(k),DUO_KEY));assert.equal(j.bests['duo-dawn-express'],undefined);await details(p,'#ps-rehearsal-events');assert.equal(await p.locator('#ps-rehearsal-list button').count(),8);await p.locator('#ps-rehearsal-next').click();assert.match(await p.locator('#ps-rehearsal-page').textContent(),/Events 9–16/);await p.locator('#ps-rehearsal-previous').click();assert.match(await p.locator('#ps-rehearsal-page').textContent(),/Events 1–8/);await chooseOption(p,'#ps-rehearsal-filter','delivery');assert.equal(await p.locator('#ps-rehearsal-list button').count(),3);await p.locator('#ps-test').click();await p.locator('#ps-run').click();await p.locator('#ps-rehearsal-list button').last().click();assert.equal(await p.locator('#ps-run').textContent(),'Run');const paused=await p.locator('#ps-status').textContent();await p.waitForTimeout(300);assert.equal(await p.locator('#ps-status').textContent(),paused);assert.match(await p.locator('#ps-rehearsal-frame').textContent(),/Tick 94/);await p.locator('#ps-rehearsal-back').click();assert.match(await p.locator('#ps-rehearsal-frame').textContent(),/Tick 93/);await p.locator('#ps-rehearsal-forward').click();await p.locator('#ps-rehearsal-inspect').click();assert.match(await p.locator('#ps-status').textContent(),/Tick 94/);await p.locator('#ps-undo').click();assert.match(await p.locator('#ps-status').textContent(),/Tick 93/);await p.locator('#ps-step').click();await chooseOption(p,'#ps-rehearsal-tick','98');await p.locator('#ps-rehearsal-inspect').click();assert.match(await p.locator('#ps-status').textContent(),/Adventure complete!/);assert.match(await p.locator('#ps-best').textContent(),/98 ticks/);await p.locator('#ps-test').click();await chooseOption(p,'#ps-card-pip-0','wait');assert.equal(await p.locator('#ps-rehearsal-results').isVisible(),false);assert.match(await p.locator('#ps-rehearsal-note').textContent(),/changed/);await collection(p,'learn','first-use');await details(p,'#ps-rehearsal');await p.locator('#ps-rehearse').click();assert.match(await p.locator('#ps-rehearsal-note').textContent(),/no Use card/);await chooseOption(p,'#ps-card-pip-2','use');await p.locator('#ps-rehearse').click();assert.match(await p.locator('#ps-rehearsal-note').textContent(),/6 ticks rehearsed · route complete/);await chooseOption(p,'#ps-rehearsal-tick','6');await p.locator('#ps-rehearsal-inspect').click();assert.match(await p.locator('#ps-status').textContent(),/Invention complete!/);const legacy=await share(p);assert.equal(legacy.version,1);assert.equal(legacy.proof.ticks,6);await fit(p);});
 await scenario('pip-garden-tools-turn-resize-area-and-real-wins',390,async p=>{await shared(p,'duo-first-letter');await p.locator('#ps-remix').click();await details(p,'#ps-garden-tools');await chooseOption(p,'#ps-garden-transform','vertical');await p.locator('#ps-transform-garden').click();await win(p,9);await p.locator('#ps-test').click();await p.locator('#ps-undo').click();await chooseOption(p,'#ps-garden-transform','right');await p.locator('#ps-transform-garden').click();assert.equal(await p.locator('#ps-canvas').getAttribute('width'),'350');assert.equal(await p.locator('#ps-canvas').getAttribute('height'),'450');assert.equal(await p.locator('#ps-cursor-x option').count(),7);assert.equal(await p.locator('#ps-cursor-y option').count(),9);assert.equal(await p.locator('#ps-capture-width option').count(),7);await win(p,9);await p.locator('#ps-test').click();await details(p,'#ps-resize-options');await chooseOption(p,'#ps-resize-width','11');await chooseOption(p,'#ps-resize-anchor','centre');await p.locator('#ps-resize-garden').click();assert.equal(await p.locator('#ps-canvas').getAttribute('width'),'550');assert.equal(await p.locator('#ps-cursor-x option').count(),11);await win(p,9);await p.locator('#ps-test').click();const before=await share(p);await details(p,'#ps-garden-tools');await details(p,'#ps-area-options');await cell(p,0,0);await chooseOption(p,'#ps-area-width','2');await chooseOption(p,'#ps-area-height','2');await p.locator('#ps-edit-area').click();assert.equal((await share(p)).board.road.some(p=>p.x===0&&p.y===0),true);await chooseOption(p,'#ps-area-brush','water');await p.locator('#ps-edit-area').click();assert.equal((await share(p)).board.road.some(p=>p.x===0&&p.y===0),false);await cell(p,before.starts[0].x,before.starts[0].y);await chooseOption(p,'#ps-area-width','1');await chooseOption(p,'#ps-area-height','1');await p.locator('#ps-edit-area').click();assert.match(await p.locator('#ps-notice').textContent(),/Move companions/);await cell(p,before.parts[0].x,before.parts[0].y);await chooseOption(p,'#ps-area-brush','erase');await p.locator('#ps-edit-area').click();assert.equal((await share(p)).parts.length,before.parts.length-1);await p.locator('#ps-undo').click();assert.equal((await share(p)).parts.length,before.parts.length);await cell(p,10,8);await chooseOption(p,'#ps-resize-width','7');await p.locator('#ps-resize-garden').click();assert.equal(await p.locator('#ps-cursor-x option').count(),7);assert.match(await p.locator('#ps-inspect').textContent(),/Column 7, row 9/);await win(p,9);await fit(p);});
 await scenario('pip-garden-tools-palette-partners-sharing-and-save-isolation',1440,async p=>{await shared(p,'duo-twin-depots');await p.locator('#ps-remix').click();await details(p,'#ps-garden-tools');await chooseOption(p,'#ps-garden-transform','partners');await p.locator('#ps-transform-garden').click();await chooseOption(p,'#ps-garden-transform','palette');await p.locator('#ps-transform-garden').click();await win(p,61);await p.locator('#ps-test').click();const project=await share(p);assert.equal(project.proof.ticks,61);assert.equal(project.version,3);await details(p,'#ps-adventure-library');await p.locator('#ps-save-adventure').click();const j=JSON.parse(await p.evaluate(k=>localStorage.getItem(k),DUO_KEY));assert.deepEqual(j.drafts['duo-twin-depots'],solvedTinkerProject('duo-twin-depots'));assert.equal(j.adventures[0].project.proof.ticks,61);const url=new URL(p.url());url.hash='pip='+tinkerCode(project);await p.goto(url.href);await p.locator('#pip-studio[open]').waitFor();await win(p,61);await fit(p);});
 await scenario('pip-workshop-tools-enlarged-menus-and-readonly',390,async p=>{await p.locator('#title-accessibility').click();await chooseOption(p,'#settings-reading-size','largest');await chooseOption(p,'#settings-contrast','high');await p.locator('#settings-close').click();await shared(p,'duo-dawn-express');await p.locator('#ps-remix').click();for(const [width,height]of [[320,568],[844,390],[768,1024],[1440,1000]]){await p.setViewportSize({width,height});await details(p,'#ps-garden-tools');await details(p,'#ps-resize-options');await details(p,'#ps-area-options');await details(p,'#ps-rehearsal');await p.locator('[data-game-select=ps-garden-transform]').click();assert.equal(await p.locator('.game-select-menu [role=option]').count(),6);await fit(p);await p.keyboard.press('Escape');await chooseOption(p,'#ps-garden-transform','right');await p.locator('#ps-transform-garden').click();assert.match(await p.locator('#ps-notice').textContent(),/cannot turn/);await chooseOption(p,'#ps-rehearsal-length','240');await p.locator('#ps-rehearse').click();await p.locator('[data-game-select=ps-rehearsal-tick]').click();assert.equal(await p.locator('.game-select-menu [role=option]').count(),99);await fit(p);await p.keyboard.press('Escape');}await chooseOption(p,'#ps-rehearsal-tick','0');await p.locator('#ps-rehearsal-inspect').click();assert.equal(await p.locator('[data-game-select=ps-garden-transform]').isDisabled(),true);assert.equal(await p.locator('[data-game-select=ps-area-brush]').isDisabled(),true);await p.locator('#ps-test').click();await fit(p);});
}
