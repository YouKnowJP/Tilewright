import assert from 'node:assert/strict';
import {chooseOption,waitForGameReady} from './ui-driver.mjs';
import {AFTER_HOURS_MISSIONS} from '../../src/pip-after-hours.mjs';
import {DUO_STORIES,remixDuoProject} from '../../src/pip-duo.mjs';
import {solvedTinkerProject,tinkerCode,parseTinkerProject} from '../../src/pip-tinker.mjs';
import {pipCollectionCode,parsePipCollectionCode,parsePipCollection,MAX_COLLECTION_BYTES} from '../../src/pip-collections.mjs';
const pack=(projects=[solvedTinkerProject('duo-first-letter'),solvedTinkerProject('duo-after-lanterns')])=>({format:'pip-adventure-collection',version:1,name:'A moonlit collection',author:'Tavi',intro:'Two friends, two roads.',chapters:projects.map(project=>({title:project.name,note:'Find your own road, or study the creator’s route.',project}))});
async function details(p,id){if(!await p.locator(id).evaluate(n=>n.open))await p.locator(id+'>summary').click();}
async function open(p){await waitForGameReady(p);await p.locator('#title-workshop').click();await p.locator('#ws-tab-lab').click();await p.locator('#ws-duo-adventures').click();}
async function collection(p,value,id){await details(p,'#ps-chooser');await chooseOption(p,'#ps-collection',value);if(id){await details(p,'#ps-chooser');await chooseOption(p,'#ps-trial',id);}}
async function win(p,ticks){await details(p,'#ps-test-options');await chooseOption(p,'#ps-speed','quick');await p.locator('#ps-test').click();await p.locator('#ps-run').click();await p.locator('#ps-status').filter({hasText:'Adventure complete!'}).waitFor({timeout:Math.max(15000,ticks*220+2000)});assert.match(await p.locator('#ps-status').textContent(),new RegExp('Tick '+ticks+'/'));}
async function shared(p,value,kind='pip-pack'){const u=new URL(p.url());u.hash=kind+'='+(kind==='pip-pack'?pipCollectionCode(value):tinkerCode(value));await p.goto(u.href);await waitForGameReady(p);await p.locator(kind==='pip-pack'?'#pip-collection[open]':'#pip-studio[open]').waitFor();}
async function download(p,id){const [d]=await Promise.all([p.waitForEvent('download'),p.locator(id).click()]),chunks=[];for await(const c of await d.createReadStream())chunks.push(c);return Buffer.concat(chunks);}
async function project(p){await p.locator('#ps-tab-share').click();const value=parseTinkerProject((await download(p,'#ps-export')).toString());await p.locator('#ps-tab-build').click();return value;}
async function builder(p){await p.locator('#ps-tab-share').click();await details(p,'#ps-pack-builder');}
async function fit(p,id='#pip-studio'){assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.ok(await p.locator(id).evaluate(n=>n.scrollWidth<=n.clientWidth+1));for(const button of await p.locator(id+' button:visible,'+id+' [role=combobox]:visible').all())assert.ok(await button.evaluate(n=>{const r=n.getBoundingClientRect(),d=n.closest('dialog').getBoundingClientRect();return r.left>=d.left-1&&r.right<=d.right+1;}));}
async function playAfterHoursRepair(p,mission,width){
 const press=selector=>p.locator(selector)[width<500?'tap':'click']();
 const read=id=>p.locator('#ps-'+id).textContent();
 async function place(part){
  await press('[data-ps-jump=build-tools]');await chooseOption(p,'#ps-brush',part.kind);
  if(part.kind==='press'){
   await chooseOption(p,'#ps-input',part.channel);await chooseOption(p,'#ps-output',part.output);
  }else if(part.kind==='cargo'){
   await chooseOption(p,'#ps-cargo-match',part.channel);
   for(const [bank,cards] of [['a',part.program],['b',part.alternate]])for(const [i,card] of cards.entries())await chooseOption(p,`#ps-card-route-${bank}-${i}`,card);
  }else if(part.kind==='prism')await chooseOption(p,'#ps-operation',part.operation);
  else{
   await chooseOption(p,'#ps-channel',part.channel);
   if(part.kind==='locker')await chooseOption(p,'#ps-locker-mode',part.mode);
  }
  await press('[data-ps-jump=canvas]');
  if(width<=320){
   await details(p,'#ps-map-text');await chooseOption(p,'#ps-cursor-x',String(part.x));await chooseOption(p,'#ps-cursor-y',String(part.y));
   await press('#ps-go-tile');await press('#ps-place-tile');
  }else{
   const canvas=p.locator('#ps-canvas'),bounds=await canvas.boundingBox(),point={x:bounds.width*(part.x+.5)/mission.width,y:bounds.height*(part.y+.5)/mission.height};
   if(width<500)await p.touchscreen.tap(bounds.x+point.x,bounds.y+point.y);
   else await canvas.click({position:point});
  }
 }
 async function test(){
  await press('[data-ps-jump=programs]');
  for(const [i,actor] of ['pip','sprout'].entries()){
   await press('#ps-actor-'+actor);
   for(const [index,card] of mission.solution[i].entries())await chooseOption(p,`#ps-card-${actor}-${index}`,card);
  }
  await press('#ps-test-route');assert.equal(await read('event'),'Next milestone');
  await details(p,'#ps-test-options');await chooseOption(p,'#ps-speed','quick');await press('#ps-test-options > summary');
 }
 async function milestone(turn,message){
  await press('#ps-event');await p.locator('#ps-run[aria-pressed=false]').waitFor();
  assert.match(await read('status'),new RegExp('^Tick '+turn+'/240'));
  if(message)assert.match(await read('playback-state'),message);
 }
 assert.equal(await p.locator('#ps-story-goal').isVisible(),true);
 assert.match(await read('status'),new RegExp('Repair parts 0/'+mission.budget+' placed'));
 await press('[data-ps-jump=build-tools]');assert.equal(await p.locator('#ps-repair-help').isVisible(),true);
 const parts=mission.id==='duo-after-lanterns'?[...mission.solutionParts.filter(part=>part.kind==='press'&&part.y===5),...mission.solutionParts.filter(part=>part.kind!=='press'||part.y!==5)]:mission.solutionParts;
 for(const [i,part] of parts.entries()){
  if(mission.id==='duo-after-rain'&&part.kind==='plate')continue;
  await place(part);
  if(mission.id==='duo-after-lanterns'&&i===1)assert.match(await read('status'),/2\/6 placed.*Parcel locker K \(2 left\).*Recipe press E \(2 left\).*violet window needs/);
 }
 if(mission.id==='duo-after-lift'){
  await press('#ps-undo');assert.match(await read('status'),/2\/3 placed.*Compass prism X/);
  await place(parts.at(-1));
 }
 if(mission.id==='duo-after-rain'){
  assert.match(await read('status'),/3\/4 placed.*Pressure plate P/);
  await test();assert.match(await read('duo-goals'),/Bridge 1 closed/);await press('#ps-run');
  const feedback=p.locator('#ps-playback-state').filter({hasText:'Check the amber plate'});await feedback.waitFor();
  assert.match(await read('status'),/^Tick 8\/240.*Bridge 1 was closed at the start/);
  assert.equal(await p.locator('#ps-next-story').isVisible(),false);
  assert.ok(await feedback.evaluate(n=>{const r=n.getBoundingClientRect(),header=n.closest('dialog').querySelector('.ps-heading').getBoundingClientRect();return r.top>=header.bottom-1&&r.bottom<=innerHeight;}));
  await press('#ps-test');await place(parts.find(part=>part.kind==='plate'));
 }
 await test();
 if(mission.id==='duo-after-lift'){
  await milestone(6,/Cargo compass loaded Otherwise/);await milestone(9,/Pressed violet into blue/);
  await milestone(18,/Stored parcel/);assert.match(await read('duo-goals'),/Locker K1 holding blue from Pip/);
  await milestone(21,/Collected blue/);
  for(const turn of [30,33,36])await milestone(turn);
  assert.match(await read('duo-goals'),/Letters 1\/3/);
  for(const turn of [39,45,48,51,60,63,66])await milestone(turn);
  assert.match(await read('duo-goals'),/Letters 2\/3/);
 }else if(mission.id==='duo-after-bell'){
  await milestone(6,/Pressed jade into violet/);assert.doesNotMatch(await read('playback-state'),/Otherwise/);
  await milestone(9,/Passed parcel to Sprout.*Sprout: Cargo compass loaded Matching/);
  assert.match(await read('duo-goals'),/handoffs 1\/3/);assert.doesNotMatch(await read('duo-goals'),/locker relays/);
  await press('#ps-undo');assert.match(await read('duo-goals'),/handoffs 0\/3/);
  await milestone(9,/Passed parcel to Sprout.*Cargo compass loaded Matching/);await milestone(12,/Delivered violet/);
  assert.match(await read('duo-goals'),/Letters 1\/3/);
  await milestone(21,/Cargo compass loaded Otherwise/);await milestone(30,/Pressed jade into violet/);
  await milestone(33,/Passed parcel to Sprout/);await milestone(36,/Delivered violet/);
  assert.match(await read('duo-goals'),/Letters 2\/3/);
  for(const turn of [45,54,57])await milestone(turn);
 }else if(mission.id==='duo-after-rain'){
  await milestone(2,/Bridge 1 opens next turn/);assert.match(await read('duo-goals'),/Bridge 1 open/);
  assert.doesNotMatch(await read('duo-goals'),/handoffs|locker relays/);
  await press('#ps-undo');assert.match(await read('duo-goals'),/Bridge 1 closed/);
  await milestone(2,/Bridge 1 opens next turn/);await milestone(5,/Sprout entered Bridge 1/);
  assert.match(await read('status'),/Pip: Holding Plate 1/);
  await press('#ps-step');assert.match(await read('status'),/^Tick 6\/240.*Pip: Holding Plate 1/);
  await milestone(9,/Traveled through the tube/);await milestone(12,/Delivered amber/);
  for(const turn of [21,23,35,39,42])await milestone(turn);
  assert.match(await read('duo-goals'),/Letters 2\/3.*Bridge 1 open/);
  for(const turn of [51,53,65,69])await milestone(turn);
 }else{
  await milestone(9,/Pressed blue into amber.*Pressed jade into blue/);await milestone(12,/Stored parcel/);
  assert.match(await read('duo-goals'),/Locker K3 holding blue from Sprout.*Locker K4 holding amber from Pip/);
  await milestone(18,/Collected blue.*Collected amber/);await milestone(24,/Pressed blue into violet.*Pressed amber into jade/);
  await milestone(27,/Delivered violet.*Delivered jade/);assert.match(await read('duo-goals'),/Letters 2\/6/);
  for(const turn of [39,42,48,54,57])await milestone(turn);
  assert.match(await read('duo-goals'),/Letters 4\/6/);
  for(const channel of ['Jade','Violet'])assert.match(await read('duo-goals'),new RegExp(channel+' Quiet'));
  assert.equal(await p.locator('#ps-next-story').isVisible(),false);
  for(const turn of [69,72,78,84,87])await milestone(turn);
  assert.match(await read('duo-goals'),/Letters 6\/6.*lockers empty/);
  for(const channel of ['Jade','Violet'])assert.match(await read('duo-goals'),new RegExp(channel+' Powered'));
  assert.equal(await p.locator('#ps-next-story').isVisible(),false);
  await milestone(90,/Pip: Signal loaded Powered.*Sprout: Signal loaded Powered/);
 }
 assert.equal(await p.locator('#ps-next-story').isVisible(),false);
 await press('#ps-run');await p.locator('#ps-status').filter({hasText:'Adventure complete!'}).waitFor();await fit(p);
}
export async function pipCollectionsScenarios(scenario){
 await scenario('pip-after-hours-repaired-plate-large-text',320,async p=>{
  await p.locator('#title-accessibility').tap();await chooseOption(p,'#settings-reading-size','largest');
  await chooseOption(p,'#settings-contrast','high');await p.locator('#settings-close').tap();
  await open(p);await collection(p,'after-hours','duo-after-rain');
  await playAfterHoursRepair(p,AFTER_HOURS_MISSIONS[2],320);
  assert.match(await p.locator('#ps-status').textContent(),/^Tick 72\/240 · Adventure complete!/);
 });
 for(const width of [390,1440])await scenario(`pip-after-hours-four-mastery-repairs-${width}`,width,async p=>{
  await waitForGameReady(p);await p.locator('#title-pip').click();await details(p,'#ph-filters');
  await p.locator('#ph-search').fill(AFTER_HOURS_MISSIONS[0].title);await p.locator('[data-ph-mission=duo-after-lift]').click();
  for(const [i,m]of AFTER_HOURS_MISSIONS.entries()){
   assert.equal(await p.locator('#ps-title').textContent(),m.title);
   assert.match(await p.locator('#ps-kicker').textContent(),new RegExp('Chapter '+(21+i)+'/'+DUO_STORIES.length));
   await playAfterHoursRepair(p,m,width);assert.match(await p.locator('#ps-budget').textContent(),new RegExp(m.budget+'/'+m.budget));
   assert.match(await p.locator('#ps-status').textContent(),new RegExp('^Tick '+[96,60,72,91][i]+'/240 · Adventure complete!'));
   assert.ok((await p.locator('#ps-status').textContent()).includes(m.ending));
   if(i<3)await p.locator('#ps-next-story')[width<500?'tap':'click']();
  }
  assert.equal(await p.locator('#ps-next-story').isVisible(),true);
  await p.locator('#ps-next-story').click();assert.equal(await p.locator('#ps-title').textContent(),'The Slow Hand and the Swift');
  await p.locator('#ps-close').click();await p.reload();await open(p);await collection(p,'after-hours','duo-after-lanterns');
  assert.match(await p.locator('#ps-best').textContent(),/91 ticks/);await fit(p);
 });
 await scenario('pip-collection-builder-snapshots-reorder-metadata-and-capacity',390,async p=>{
  const original={...remixDuoProject(solvedTinkerProject('duo-first-letter')),proof:{ticks:9}};await shared(p,original,'pip');await details(p,'#ps-adventure-library');await p.locator('#ps-save-adventure').click();await builder(p);await p.locator('#ps-pack-add-current').click();await p.locator('#ps-pack-name').fill('Our paper roads');await p.locator('#ps-pack-author').fill('Rook');await p.locator('#ps-pack-intro').fill('Two friends carry a small constellation.');await p.locator('#ps-pack-intro').press('Tab');await chooseOption(p,'#ps-pack-saved','adventure-1');await p.locator('#ps-pack-add-saved').click();await p.locator('#ps-tab-build').click();await details(p,'#ps-name-details');await p.locator('#ps-name').fill('A later bench name');await p.locator('#ps-name').press('Tab');await builder(p);await p.locator('#ps-pack-add-current').click();assert.equal((await p.locator('#ps-pack-chapters h4').allTextContents())[0],'1 · '+original.name);await p.locator('[data-pack-edit=earlier][data-chapter="2"]').click();await p.locator('[data-pack-edit=remove][data-chapter="0"]').click();await details(p,'#ps-pack-chapters article:first-child>details:first-of-type');await p.getByLabel('Chapter 1 title',{exact:true}).fill('Rook’s first paper road');await p.getByLabel('Chapter 1 title',{exact:true}).press('Tab');await p.getByLabel('Chapter 1 note',{exact:true}).fill('A note for the next builder.');await p.getByLabel('Chapter 1 note',{exact:true}).press('Tab');const value=parsePipCollection((await download(p,'#ps-pack-export')).toString());assert.equal(value.chapters.length,2);assert.equal(value.chapters[0].project.name,'A later bench name');assert.equal(value.chapters[1].project.name,original.name);assert.equal(value.chapters[0].title,'Rook’s first paper road');assert.equal(value.chapters[0].note,'A note for the next builder.');assert.deepEqual(parsePipCollectionCode(await p.locator('#ps-pack-code').inputValue()),value);for(let i=0;i<4;i++)await p.locator('#ps-pack-add-current').click();assert.match(await p.locator('#ps-pack-count').textContent(),/6\/6/);assert.equal(await p.locator('#ps-pack-add-current').isDisabled(),true);assert.equal(await p.locator('#ps-pack-add-saved').isDisabled(),true);await p.locator('[data-pack-edit=remove][data-chapter="5"]').click();assert.equal(await p.locator('#ps-pack-add-current').isEnabled(),true);await fit(p);
 });
 await scenario('pip-collection-player-fresh-replay-next-and-completion',1440,async p=>{
  await shared(p,pack());assert.equal(await p.locator('#pc-chapters article').count(),2);assert.match(await p.locator('#pc-progress').textContent(),/0\/2/);await p.locator('[data-collection-play="1"]').click();await p.locator('#ps-pack-session').filter({hasText:'chapter 2/2'}).waitFor();let fresh=await project(p);assert.equal(fresh.proof,undefined);assert.equal(fresh.parts.length,0);assert.deepEqual(fresh.programs,[['wait','wait','wait'],['wait','wait','wait']]);await p.locator('#ps-pack-chapter-menu').click();assert.match(await p.locator('#pc-progress').textContent(),/0\/2/);await p.locator('[data-collection-replay="0"]').click();await win(p,9);await p.locator('#ps-pack-next').click();assert.equal(await p.locator('#ps-title').textContent(),'Six Letters Before Sunrise');assert.equal((await project(p)).parts.length,0);await p.locator('#ps-pack-chapter-menu').click();await p.locator('[data-collection-replay="1"]').click();await p.locator('#game-confirm-cancel').click();await p.locator('#pip-collection[open]').waitFor();assert.match(await p.locator('#pc-progress').textContent(),/1\/2/);await p.locator('[data-collection-replay="1"]').click();await p.locator('#game-confirm-accept').click();await p.locator('#game-confirm-dialog').waitFor({state:'detached'});await win(p,91);await p.locator('#ps-pack-chapter-menu').click();assert.match(await p.locator('#pc-progress').textContent(),/Collection complete · 2\/2/);assert.equal(await p.locator('#pc-chapters').getByText(/CLEARED/).count(),2);await fit(p,'#pip-collection');
 });
 await scenario('pip-collection-custom-remix-does-not-award-original-chapter',390,async p=>{
  const custom={...remixDuoProject(solvedTinkerProject('duo-first-letter')),proof:{ticks:9}};await shared(p,pack([custom]));await p.locator('[data-collection-replay="0"]').click();await chooseOption(p,'#ps-brush','road');await details(p,'#ps-map-text');await chooseOption(p,'#ps-cursor-x','0');await chooseOption(p,'#ps-cursor-y','0');await p.locator('#ps-go-tile').click();await p.locator('#ps-place-tile').click();await win(p,9);assert.match(await p.locator('#ps-pack-session').textContent(),/map changed: remix/);await p.locator('#ps-pack-chapter-menu').click();assert.match(await p.locator('#pc-progress').textContent(),/0\/1/);await p.locator('[data-collection-replay="0"]').click();await p.locator('#game-confirm-accept').click();await p.locator('#game-confirm-dialog').waitFor({state:'detached'});await win(p,9);await p.locator('#ps-pack-chapter-menu').click();assert.match(await p.locator('#pc-progress').textContent(),/Collection complete · 1\/1/);await fit(p,'#pip-collection');
 });
 await scenario('pip-collection-import-rejects-damage-and-keeps-active-collection',390,async p=>{
  const value=pack();await shared(p,value);await p.locator('#pc-close').click();await builder(p);await details(p,'#ps-pack-exchange');await p.locator('#ps-pack-import-code').fill(pipCollectionCode(value).slice(0,-3));await p.locator('#ps-pack-import').click();assert.match(await p.locator('#ps-notice').textContent(),/transit|incomplete/);for(const [name,buffer]of [['broken.json',Buffer.from('{bad')],['large.json',Buffer.alloc(MAX_COLLECTION_BYTES+1,32)],['false-clear.json',Buffer.from(JSON.stringify({...value,chapters:[{project:{...solvedTinkerProject('duo-first-letter'),proof:{ticks:1}}}]}))]]){await p.locator('#ps-pack-file').setInputFiles({name,mimeType:'application/json',buffer});assert.equal(await p.locator('#pip-collection').isVisible(),false);}await p.locator('#ps-pack-open').click();assert.equal(await p.locator('#pip-collection-title').textContent(),value.name);assert.equal(await p.locator('#pc-chapters article').count(),2);await p.locator('#pc-close').click();const draft=pack([{...customDraft()}]);await p.locator('#ps-pack-file').setInputFiles({name:'draft.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(draft))});assert.equal(await p.locator('[data-collection-replay]').count(),0);assert.match(await p.locator('#pc-chapters').textContent(),/no verified creator route/);await fit(p,'#pip-collection');
 });
 await scenario('pip-collection-remix-confirmations-starter-and-sharing',1440,async p=>{
  await open(p);await builder(p);await p.locator('#ps-pack-add-current').click();assert.match(await p.locator('#ps-pack-count').textContent(),/1\/6/);await details(p,'#ps-pack-exchange');await p.locator('#ps-pack-import-code').fill(pipCollectionCode(pack()));await p.locator('#ps-pack-import').click();await p.locator('#pc-remix').click();await p.locator('#game-confirm-cancel').click();await p.locator('#pc-remix').click();await p.locator('#game-confirm-accept').click();await p.locator('#pip-collection').waitFor({state:'hidden'});assert.match(await p.locator('#ps-pack-count').textContent(),/2\/6/);await p.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('Clipboard unavailable in this test');}}}));await p.locator('#ps-pack-copy').click();await p.locator('#ps-notice').filter({hasText:'Copy the selected collection text manually.'}).waitFor();assert.equal(parsePipCollectionCode(await p.locator('#ps-pack-code').inputValue()).chapters.length,2);if(await p.locator('#ps-pack-link').isEnabled()){await p.locator('#ps-pack-link').click();await p.waitForFunction(()=>document.querySelector('#ps-pack-code').value.includes('#pip-pack='));assert.equal(parsePipCollectionCode(await p.locator('#ps-pack-code').inputValue()).chapters.length,2);}await p.locator('#ps-pack-starter').click();await p.locator('#game-confirm-cancel').click();assert.match(await p.locator('#ps-pack-count').textContent(),/2\/6/);await p.locator('#ps-pack-starter').click();await p.locator('#game-confirm-accept').click();await p.locator('#pip-collection[open]').waitFor();const exported=parsePipCollection((await download(p,'#pc-export')).toString());assert.equal(exported.chapters.length,4);assert.deepEqual(exported.chapters.map(c=>c.project.proof.ticks),[96,60,72,91]);await fit(p,'#pip-collection');
 });
 await scenario('pip-collection-responsive-large-text-dropdown-and-focus',390,async p=>{
  await waitForGameReady(p);await p.evaluate(()=>{window.__collectionPad={connected:true,mapping:'standard',index:0,id:'Collection test controller',axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[window.__collectionPad]});});await p.locator('#title-accessibility').click();await chooseOption(p,'#settings-reading-size','largest');await chooseOption(p,'#settings-contrast','high');await p.locator('#settings-tab-controls').click();await details(p,'.controller-options');await chooseOption(p,'#settings-gamepad','on');await p.waitForFunction(()=>document.querySelector('#settings-gamepad-status').textContent.includes('ready'));await p.locator('#settings-close').click();await shared(p,pack());await p.evaluate(()=>{window.__collectionPad={connected:true,mapping:'standard',index:0,id:'Collection test controller',axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[window.__collectionPad]});});await p.waitForFunction(()=>document.querySelector('#settings-gamepad-status').textContent.includes('ready'));const press=async(index,condition)=>{await p.evaluate(i=>window.__collectionPad.buttons[i].pressed=true,index);await p.waitForFunction(condition);await p.evaluate(()=>window.__collectionPad.buttons.forEach(b=>b.pressed=false));await p.waitForTimeout(40);};await press(13,()=>document.activeElement?.matches('[data-collection-play="0"]'));await press(0,()=>!document.querySelector('#pip-collection').open&&document.querySelector('#ps-pack-session').textContent.includes('chapter 1/2'));await p.locator('#ps-pack-chapter-menu').click();const status=await p.locator('#ps-status').textContent();await p.evaluate(()=>window.__collectionPad.buttons[11].pressed=true);await p.waitForTimeout(100);assert.equal(await p.locator('#ps-status').textContent(),status);await p.evaluate(()=>window.__collectionPad.buttons[11].pressed=false);await p.waitForTimeout(40);await press(1,()=>!document.querySelector('#pip-collection').open&&document.querySelector('#pip-studio').open);await builder(p);await p.locator('#ps-pack-open').click();for(const [width,height]of [[320,568],[844,390],[768,1024],[1440,1000]]){await p.setViewportSize({width,height});await fit(p,'#pip-collection');await p.locator('#pc-close').click();await builder(p);await details(p,'#ps-pack-exchange');await p.locator('#ps-pack-import-code').fill(pipCollectionCode(pack()));await p.locator('#ps-pack-import').click();await p.keyboard.press('Escape');await p.waitForFunction(()=>document.activeElement.id==='ps-pack-import');await p.locator('[data-game-select=ps-pack-saved]').click();assert.ok(await p.locator('.game-select-menu [role=option]').count()>=1);await fit(p);await p.keyboard.press('Escape');await p.locator('#ps-pack-import').click();}await fit(p,'#pip-collection');
 });
}
function customDraft(){const p=remixDuoProject(solvedTinkerProject('duo-first-letter'));return {...p,programs:[['wait','wait','wait'],['wait','wait','wait']]};}
