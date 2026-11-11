import assert from 'node:assert/strict';
import {chooseOption,waitForGameReady} from './ui-driver.mjs';
import {CLOCKTOWER_MISSIONS} from '../../src/pip-clocktower.mjs';
import {DUO_STORIES,remixDuoProject} from '../../src/pip-duo.mjs';
import {solvedTinkerProject} from '../../src/pip-tinker.mjs';
import {pipCollectionCode,parsePipCollection} from '../../src/pip-collections.mjs';
import {COLLECTION_SAVE_KEY} from '../../src/pip-collection-storage.mjs';
import {parseSaveArchive} from '../../src/save-data.mjs';
const pack=(projects=[solvedTinkerProject('duo-first-letter'),solvedTinkerProject('duo-clock-minute')],name='Our returning lanterns')=>({format:'pip-adventure-collection',version:1,name,author:'Tavi',intro:'A collection worth returning to.',chapters:projects.map(project=>({title:project.name,note:'Return to finish this road.',project}))});
async function details(p,id){if(!await p.locator(id).evaluate(n=>n.open))await p.locator(id+'>summary').click();}
async function open(p){await waitForGameReady(p);await p.locator('#title-workshop').click();await p.locator('#ws-tab-lab').click();await p.locator('#ws-duo-adventures').click();}
async function builder(p){await p.locator('#ps-tab-share').click();await details(p,'#ps-pack-builder');}
async function library(p){await builder(p);await details(p,'#ps-pack-library');}
async function shared(p,value){const u=new URL(p.url());u.hash='pip-pack='+pipCollectionCode(value);await p.goto(u.href);await waitForGameReady(p);await p.locator('#pip-collection[open]').waitFor();}
async function reload(p){const u=new URL(p.url());u.hash='';await p.goto(u.href);await waitForGameReady(p);}
async function saved(p){await p.locator('#game-confirm-dialog').waitFor({state:'detached'});await p.locator('#ps-pack-storage').filter({hasText:/saved in this journey|saved automatically/}).waitFor({state:'attached'});}
async function journal(p){return p.evaluate(key=>{const id=JSON.parse(localStorage.getItem('tilewright.profiles.v1')||'{"activeId":"original"}').activeId,physical=id==='original'?key:`tilewright.profile.${id}.${key.slice('tilewright.'.length)}`;return JSON.parse(localStorage.getItem(physical)||'null');},COLLECTION_SAVE_KEY);}
async function download(p,id){const [d]=await Promise.all([p.waitForEvent('download'),p.locator(id).click()]),chunks=[];for await(const c of await d.createReadStream())chunks.push(c);return Buffer.concat(chunks);}
async function speed(p){await details(p,'#ps-test-options');await chooseOption(p,'#ps-speed','quick');}
async function finish(p,ticks){await p.locator('#ps-run').click();await p.locator('#ps-status').filter({hasText:'Adventure complete!'}).waitFor({timeout:ticks*220+4000});assert.match(await p.locator('#ps-status').textContent(),new RegExp('Tick '+ticks+'/'));await saved(p);}
async function win(p,ticks){await speed(p);await p.locator('#ps-test').click();await finish(p,ticks);}
async function fit(p,id='#pip-studio'){assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.ok(await p.locator(id).evaluate(n=>n.scrollWidth<=n.clientWidth+1));for(const b of await p.locator(id+' button:visible,'+id+' [role=combobox]:visible').all())assert.ok(await b.evaluate(n=>{const r=n.getBoundingClientRect(),d=n.closest('dialog').getBoundingClientRect();return r.left>=d.left-1&&r.right<=d.right+1;}));}
async function home(p){if(await p.locator('#pip-collection').isVisible())await p.locator('#pc-close').click();if(await p.locator('#pip-studio').isVisible())await p.locator('#ps-close').click();if(await p.locator('#ws-home').isVisible())await p.locator('#ws-home').click();await p.locator('#game-title-screen').waitFor();}
async function confirmReload(p){await Promise.all([p.waitForEvent('domcontentloaded'),p.locator('#save-confirm').click()]);await waitForGameReady(p);await p.waitForFunction(()=>!document.body.inert);}
async function playClocktowerRepair(p,mission,width){
 const press=selector=>p.locator(selector)[width<500?'tap':'click']();
 const read=id=>p.locator('#ps-'+id).textContent();
 async function place(part){
  await press('[data-ps-jump=build-tools]');await chooseOption(p,'#ps-brush',part.kind);
  if(part.kind==='press'){
   await chooseOption(p,'#ps-input',part.channel);await chooseOption(p,'#ps-output',part.output);
  }else if(part.kind==='cargo'){
   await chooseOption(p,'#ps-cargo-match',part.channel);
   for(const [bank,cards] of [['a',part.program],['b',part.alternate]])for(const [i,card] of cards.entries())await chooseOption(p,`#ps-card-route-${bank}-${i}`,card);
  }else{
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
 async function milestone(turn,message){
  await press('#ps-event');await p.locator('#ps-run[aria-pressed=false]').waitFor();
  assert.match(await read('status'),new RegExp('^Tick '+turn+'/240'));
  if(message)assert.match(await read('playback-state'),message);
 }
 assert.equal(await p.locator('#ps-story-goal').isVisible(),true);
 assert.match(await read('status'),new RegExp('Repair parts 0/'+mission.budget+' placed'));
 await press('[data-ps-jump=build-tools]');assert.equal(await p.locator('#ps-repair-help').isVisible(),true);
 for(const [i,part] of mission.solutionParts.entries()){
  await place(part);
  if(mission.id==='duo-clock-minute'&&i===3){
   await press('[data-ps-jump=programs]');await press('#ps-test-route');
   assert.match(await read('status'),/4\/5 placed.*Add the second blue tube end/);
   assert.equal(await p.locator('#ps-status').evaluate(n=>n===document.activeElement),true);
  }
  if(mission.id==='duo-clock-ledger'&&i===3){
   const status=await read('status');assert.match(status,/4\/8 placed/);
   assert.match(status,/Recipe press E \(2 left\)/);assert.match(status,/Parcel locker K \(2 left\)/);
  }
 }
 await press('[data-ps-jump=programs]');
 for(const [i,actor] of ['pip','sprout'].entries()){
  await press('#ps-actor-'+actor);
  for(const [index,card] of mission.solution[i].entries())await chooseOption(p,`#ps-card-${actor}-${index}`,card);
 }
 await press('#ps-test-route');assert.equal(await read('event'),'Next milestone');
 await speed(p);await press('#ps-test-options > summary');
 for(let i=0;i<3;i++)await press('#ps-step');
 assert.match(await read('status'),/^Tick 3\/240.*Pip: Collected amber/);
 if(mission.id==='duo-clock-hands'){
  for(const turn of [6,9,18,21,30,33,36])await milestone(turn);
  assert.match(await read('duo-goals'),/Letters 1\/3.*Locker K3 empty.*Jade Quiet/);
  for(const turn of [45,48,60,69,72,81,84,87,90])await milestone(turn);
  assert.match(await read('duo-goals'),/Letters 2\/3/);
  for(const turn of [99,102,114,126,129,138,141,150,153,156])await milestone(turn);
  assert.match(await read('duo-goals'),/Letters 3\/3.*lockers empty.*Jade Powered/);
  assert.equal(await p.locator('#ps-next-story').isVisible(),false);
  for(const turn of [165,168,174])await milestone(turn);
  await milestone(175,/Sprout reached the home flag/);
  assert.match(await read('duo-goals'),/home P away, S home/);
  assert.equal(await p.locator('#ps-next-story').isVisible(),false);
  await milestone(180,/Pip: Signal loaded Powered/);
 }else if(mission.id==='duo-clock-spare'){
  assert.match(await read('duo-goals'),/Spare mail allowed/);
  for(const turn of [9,12,21,36,39,42,48,54,57,69])await milestone(turn);
  await milestone(72,/Sprout: Locker K4 full; amber kept safely/);
  assert.match(await read('status'),/Sprout: Locker K4 full; amber kept safely/);
  assert.match(await read('duo-goals'),/Locker K4 holding amber from Sprout/);
  const feedback=p.locator('#ps-playback-state');
  assert.ok(await feedback.evaluate(n=>{const r=n.getBoundingClientRect(),header=n.closest('dialog').querySelector('.ps-heading').getBoundingClientRect();return r.top>=header.bottom-1&&r.bottom<=innerHeight;}));
  await press('#ps-undo');assert.match(await read('status'),/^Tick 71\/240/);
  await milestone(72,/Locker K4 full; amber kept safely/);
  for(const turn of [81,96,102,108,114,117])await milestone(turn);
  assert.match(await read('duo-goals'),/Letters 4\/6/);
  for(const turn of [129,132,141,156,162,168,174])await milestone(turn);
  assert.match(await read('duo-goals'),/Letters 5\/6.*locker relays 6 · required 4 met/);
  for(const turn of [177,180])await milestone(turn);
 }else if(mission.id==='duo-clock-minute'){
  for(const turn of [6,9,18])await milestone(turn);
  await milestone(21,/Pip: Traveled through the tube.*Collected jade from locker/);
  for(const turn of [30,33,36,45,48,60,63,72,75,84,87,90])await milestone(turn);
  assert.match(await read('duo-goals'),/Letters 2\/3/);
  for(const turn of [99,102,114,117,126,129,138,141,144])await milestone(turn);
  assert.match(await read('duo-goals'),/Letters 3\/3.*Jade Powered/);
  assert.equal(await p.locator('#ps-next-story').isVisible(),false);
  for(const turn of [153,156,162])await milestone(turn);
 }else{
  for(const turn of [9,18,21,24,36,48,54])await milestone(turn);
  assert.match(await read('duo-goals'),/Letters 2\/6.*lockers empty/);
  for(const turn of [69,78,81,84,96,108,114])await milestone(turn);
  assert.match(await read('duo-goals'),/Letters 4\/6/);
  for(const channel of ['Blue','Violet'])assert.match(await read('duo-goals'),new RegExp(channel+' Quiet'));
  for(const turn of [129,138,141,144,156,168,174])await milestone(turn);
  assert.match(await read('duo-goals'),/Letters 6\/6.*locker relays 6 · required 4 met.*lockers empty/);
  for(const channel of ['Blue','Violet'])assert.match(await read('duo-goals'),new RegExp(channel+' Powered'));
  assert.equal(await p.locator('#ps-next-story').isVisible(),false);
  await milestone(180,/Signal loaded Powered/);
 }
 assert.equal(await p.locator('#ps-next-story').isVisible(),false);
 await press('#ps-run');await p.locator('#ps-status').filter({hasText:'Adventure complete!'}).waitFor();
 assert.ok(await p.locator('#ps-next-story').evaluate(n=>{const r=n.getBoundingClientRect(),header=n.closest('dialog').querySelector('.ps-heading').getBoundingClientRect();return r.top>=header.bottom-1&&r.bottom<=innerHeight;}),'The whole next-chapter action stays below the fixed header.');
 if(mission.id==='duo-clock-spare')assert.match(await read('duo-goals'),/Spare mail allowed.*Locker K4 holding amber from Sprout/);
 await fit(p);
}
export async function pipPersistenceScenarios(scenario){
 await scenario('pip-clocktower-spare-mail-large-text',320,async p=>{
  await p.locator('#title-accessibility').tap();await chooseOption(p,'#settings-reading-size','largest');
  await chooseOption(p,'#settings-contrast','high');await p.locator('#settings-close').tap();
  await open(p);await details(p,'#ps-chooser');await chooseOption(p,'#ps-collection','clocktower');
  await details(p,'#ps-chooser');await chooseOption(p,'#ps-trial','duo-clock-spare');
  await playClocktowerRepair(p,CLOCKTOWER_MISSIONS[1],320);
  assert.match(await p.locator('#ps-status').textContent(),/^Tick 181\/240 · Adventure complete!/);
 });
 for(const width of [390,1440])await scenario(`pip-clocktower-four-timing-repairs-${width}`,width,async p=>{
  await waitForGameReady(p);await p.locator('#title-pip').click();await details(p,'#ph-filters');
  await p.locator('#ph-search').fill(CLOCKTOWER_MISSIONS[0].title);await p.locator('[data-ph-mission=duo-clock-hands]').click();
  for(const [i,m]of CLOCKTOWER_MISSIONS.entries()){
   assert.equal(await p.locator('#ps-title').textContent(),m.title);
   assert.match(await p.locator('#ps-kicker').textContent(),new RegExp('Chapter '+(25+i)+'/'+DUO_STORIES.length));
   await playClocktowerRepair(p,m,width);assert.match(await p.locator('#ps-budget').textContent(),new RegExp(m.budget+'/'+m.budget));
   assert.match(await p.locator('#ps-status').textContent(),new RegExp('^Tick '+[181,181,163,181][i]+'/240 · Adventure complete!'));
   assert.ok((await p.locator('#ps-status').textContent()).includes(m.ending));
   if(i<3)await p.locator('#ps-next-story')[width<500?'tap':'click']();
  }
  await p.locator('#ps-next-story').click();assert.equal(await p.locator('#ps-title').textContent(),'The Westward Constellation');
  await p.locator('#ps-close').click();await p.reload();await open(p);await details(p,'#ps-chooser');
  await chooseOption(p,'#ps-collection','clocktower');await details(p,'#ps-chooser');await chooseOption(p,'#ps-trial','duo-clock-ledger');
  assert.match(await p.locator('#ps-best').textContent(),/181 ticks/);await fit(p);
 });
 await scenario('pip-collection-autosaved-assembly-library-copy-and-reload',390,async p=>{await shared(p,pack());await p.locator('#pc-remix').click();await p.locator('#ps-pack-name').fill('The notebook we kept');await saved(p);assert.equal((await journal(p)).assembly.name,'The notebook we kept');await p.locator('[data-pack-edit=duplicate][data-chapter="0"]').click();await p.locator('[data-pack-edit=earlier][data-chapter="2"]').click();await library(p);await p.locator('#ps-pack-save').click();await p.locator('#game-confirm-cancel').click();assert.equal((await journal(p)).records[0].collection.chapters.length,2);await p.locator('#ps-pack-save').click();await p.locator('#game-confirm-accept').click();await saved(p);assert.equal((await journal(p)).records[0].collection.chapters.length,3);await p.locator('#ps-pack-copy-save').click();await saved(p);assert.equal((await journal(p)).records.length,2);await p.locator('#ps-pack-load').click();await p.locator('[data-collection-replay="0"]').click();await win(p,9);await library(p);await chooseOption(p,'#ps-pack-shelf','collection-1');await p.locator('#ps-pack-load').click();assert.match(await p.locator('#pc-progress').textContent(),/0\/3/);await p.locator('#pc-close').click();assert.equal((await journal(p)).records.find(r=>r.id==='collection-2').states[0].clear.proof.ticks,9);await reload(p);await open(p);await library(p);assert.equal(await p.locator('#ps-pack-name').inputValue(),'The notebook we kept');assert.equal(await p.locator('#ps-pack-chapters article').count(),3);assert.equal(await p.locator('#ps-pack-shelf option').count(),3);assert.equal((await journal(p)).editing,'collection-2');const exported=parsePipCollection((await download(p,'#ps-pack-export')).toString());assert.equal(exported.chapters.length,3);assert.equal(exported.chapters[1].project.trialId,'duo-clock-minute');for(let i=0;i<6;i++)await p.locator('#ps-pack-copy-save').click();await saved(p);assert.equal((await journal(p)).records.length,8);assert.equal(await p.locator('#ps-pack-copy-save').isDisabled(),true);assert.equal(await p.locator('#ps-pack-shelf option').count(),9);assert.equal((await journal(p)).records.find(r=>r.id==='collection-2').states[0].clear.proof.ticks,9);await details(p,'#ps-pack-exchange');await p.locator('#ps-pack-import-code').fill(pipCollectionCode(pack([solvedTinkerProject('duo-after-bell')],'A ninth road')));await p.locator('#ps-pack-import').click();assert.match(await p.locator('#pc-storage').textContent(),/full|not on the saved shelf/);await p.locator('[data-collection-replay="0"]').click();await p.locator('#ps-test').click();for(let i=0;i<3;i++)await p.locator('#ps-step').click();await library(p);await chooseOption(p,'#ps-pack-shelf','collection-8');await details(p,'#ps-pack-manage');await p.locator('#ps-pack-remove').click();await p.locator('#game-confirm-accept').click();await p.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).records.length===7,COLLECTION_SAVE_KEY);await p.locator('#ps-pack-open').click();await p.locator('#pc-save').click();await saved(p);assert.equal((await journal(p)).records.length,8);assert.equal((await journal(p)).records.find(r=>r.id==='collection-8').states[0].ticks,3);await p.locator('#pc-close').click();await fit(p);});
 await scenario('pip-collection-test-position-undo-clear-and-restart-survive-reload',1440,async p=>{await shared(p,pack([solvedTinkerProject('duo-clock-minute')]));await p.locator('[data-collection-replay="0"]').click();await speed(p);await p.locator('#ps-test').click();for(let i=0;i<41;i++)await p.locator('#ps-step').click();await saved(p);let j=await journal(p);assert.equal(j.records[0].states[0].ticks,41);assert.equal(j.records[0].states[0].clear,null);await reload(p);await open(p);await library(p);await chooseOption(p,'#ps-pack-shelf','collection-1');await p.locator('#ps-pack-continue').click();await p.locator('#ps-status').filter({hasText:'Tick 41/'}).waitFor();await p.locator('#ps-undo').click();assert.match(await p.locator('#ps-status').textContent(),/Tick 40\//);await p.locator('#ps-step').click();await finish(p,163);j=await journal(p);assert.equal(j.records[0].states[0].clear.proof.ticks,163);await reload(p);await open(p);await library(p);await p.locator('#ps-pack-load').click();assert.match(await p.locator('#pc-progress').textContent(),/Collection complete · 1\/1/);await p.locator('#pc-close').click();await details(p,'#ps-pack-manage');await p.locator('#ps-pack-restart').click();await p.locator('#game-confirm-cancel').click();assert.ok((await journal(p)).records[0].states[0].clear);await p.locator('#ps-pack-restart').click();await p.locator('#game-confirm-accept').click();await saved(p);await reload(p);assert.equal((await journal(p)).records[0].states[0].clear,null);assert.equal((await journal(p)).records[0].lastChapter,null);});
 await scenario('pip-collection-updates-preserve-reordered-clears-and-reset-changed-maps',390,async p=>{const custom={...remixDuoProject(solvedTinkerProject('duo-first-letter')),proof:{ticks:9}};await shared(p,pack([custom,solvedTinkerProject('duo-after-bell')]));await p.locator('[data-collection-replay="0"]').click();await win(p,9);await p.locator('#ps-pack-chapter-menu').click();await p.locator('#pc-remix').click();await p.locator('[data-pack-edit=later][data-chapter="0"]').click();await library(p);await p.locator('#ps-pack-save').click();await p.locator('#game-confirm-accept').click();await saved(p);assert.equal((await journal(p)).records[0].states[1].clear.proof.ticks,9);await p.locator('#ps-tab-build').click();await p.locator('#ps-test').click();await chooseOption(p,'#ps-brush','road');await details(p,'#ps-map-text');await chooseOption(p,'#ps-cursor-x','0');await chooseOption(p,'#ps-cursor-y','0');await p.locator('#ps-go-tile').click();await p.locator('#ps-place-tile').click();await win(p,9);await builder(p);await p.locator('[data-pack-edit=remove][data-chapter="1"]').click();await p.locator('#ps-pack-add-current').click();await library(p);await p.locator('#ps-pack-save').click();await p.locator('#game-confirm-accept').click();await saved(p);const j=await journal(p);assert.equal(j.records[0].states[1].clear,null);assert.equal(j.records[0].states[1].project,null);const file=(await download(p,'#ps-pack-export')).toString();assert.ok(!file.includes('"states"'));assert.ok(!file.includes('lastChapter'));await fit(p);});
 await scenario('pip-collection-journeys-backup-fresh-start-and-restore',1440,async p=>{await shared(p,pack([solvedTinkerProject('duo-first-letter')]));await p.locator('[data-collection-replay="0"]').click();await win(p,9);await p.locator('#ps-pack-chapter-menu').click();await p.locator('#pc-remix').click();await p.locator('#ps-pack-name').fill('A journey’s saved notebook');await saved(p);await home(p);await p.locator('#title-profile').click();const backup=await download(p,'#save-download');assert.ok(parseSaveArchive(backup.toString()).entries.some(([k])=>k===COLLECTION_SAVE_KEY));await p.locator('#save-create').click();await p.locator('#save-name').fill('Sprout’s other journey');await confirmReload(p);const second=await p.evaluate(()=>JSON.parse(localStorage.getItem('tilewright.profiles.v1')).activeId);assert.equal(await journal(p),null);await shared(p,pack([solvedTinkerProject('duo-first-letter')],'A different journey'));await p.locator('#pc-close').click();await home(p);await p.locator('#title-profile').click();await p.locator('[data-journey="original"] [data-journey-action="switch"]').click();await confirmReload(p);assert.equal((await journal(p)).records[0].states[0].clear.proof.ticks,9);await p.locator('#title-profile').click();await p.locator('#save-start').click();await confirmReload(p);assert.equal(await journal(p),null);assert.ok(await p.evaluate(({id,key})=>localStorage.getItem(`tilewright.profile.${id}.${key.slice('tilewright.'.length)}`),{id:second,key:COLLECTION_SAVE_KEY}));await p.locator('#title-profile').click();await p.locator('#save-file').setInputFiles({name:'collection-backup.json',mimeType:'application/json',buffer:backup});await confirmReload(p);assert.equal((await journal(p)).records[0].states[0].clear.proof.ticks,9);assert.equal((await journal(p)).assembly.name,'A journey’s saved notebook');await open(p);await library(p);await p.locator('#ps-pack-load').click();assert.match(await p.locator('#pc-progress').textContent(),/Collection complete · 1\/1/);await fit(p,'#pip-collection');});
 await scenario('pip-collection-corruption-quota-and-other-tab-protection',1440,async p=>{await p.evaluate(key=>localStorage.setItem(key,'{broken collection shelf'),COLLECTION_SAVE_KEY);await reload(p);await open(p);await library(p);await p.locator('#ps-pack-add-current').click();assert.match(await p.locator('#ps-pack-storage').textContent(),/Existing data is protected/);await details(p,'#ps-pack-manage');assert.equal((await download(p,'#ps-pack-recovery')).toString(),'{broken collection shelf');assert.equal(await p.evaluate(k=>localStorage.getItem(k),COLLECTION_SAVE_KEY),'{broken collection shelf');await p.evaluate(key=>localStorage.removeItem(key),COLLECTION_SAVE_KEY);await reload(p);await open(p);await builder(p);await p.evaluate(key=>{const original=Storage.prototype.setItem;window.__restoreWrites=()=>Storage.prototype.setItem=original;Storage.prototype.setItem=function(k,v){if(k===key)throw Error('Simulated collection quota');return original.call(this,k,v);};},COLLECTION_SAVE_KEY);await details(p,'#ps-pack-exchange');await p.locator('#ps-pack-import-code').fill(pipCollectionCode(pack()));await p.locator('#ps-pack-import').click();await p.locator('#pc-storage').filter({hasText:/quota/}).waitFor();assert.equal(await p.evaluate(k=>localStorage.getItem(k),COLLECTION_SAVE_KEY),null);assert.equal(parsePipCollection((await download(p,'#pc-export')).toString()).chapters.length,2);await p.locator('[data-collection-replay="0"]').click();await p.locator('#game-confirm-accept').click();await p.locator('#game-confirm-dialog').waitFor({state:'detached'});await p.locator('#ps-pack-session-save').filter({hasText:/quota/}).waitFor();await p.evaluate(()=>window.__restoreWrites());await reload(p);await shared(p,pack());await p.locator('#pc-close').click();await builder(p);const other=await p.context().newPage();try{await other.goto(new URL('./',p.url()).href);await waitForGameReady(other);await open(other);await builder(other);await other.locator('#ps-pack-name').fill('Written in another tab');await saved(other);await p.locator('#ps-pack-storage').filter({hasText:/another tab/}).waitFor();await p.locator('#ps-pack-name').fill('A stale writer');await p.locator('#ps-pack-name').press('Tab');await p.waitForTimeout(550);assert.equal((await journal(p)).assembly.name,'Written in another tab');}finally{await other.close();}await fit(p);});
 await scenario('pip-collection-saved-menus-large-text-resume-and-delete',390,async p=>{await waitForGameReady(p);await p.locator('#title-accessibility').click();await chooseOption(p,'#settings-reading-size','largest');await chooseOption(p,'#settings-contrast','high');await p.locator('#settings-close').click();await shared(p,pack([solvedTinkerProject('duo-first-letter')]));await p.locator('[data-collection-replay="0"]').click();await p.locator('#ps-test').click();for(let i=0;i<3;i++)await p.locator('#ps-step').click();await saved(p);await p.locator('#ps-pack-chapter-menu').click();for(const [width,height]of [[320,568],[844,390],[768,1024],[1440,1000]]){await p.setViewportSize({width,height});assert.match(await p.locator('[data-collection-resume="0"]').textContent(),/tick 3/);await fit(p,'#pip-collection');await p.locator('#pc-close').click();await library(p);await p.locator('[data-game-select=ps-pack-shelf]').click();assert.equal(await p.locator('.game-select-menu [role=option]').count(),2);await fit(p);await p.keyboard.press('Escape');await p.locator('#ps-pack-load').click();await p.keyboard.press('Escape');await p.waitForFunction(()=>document.activeElement.id==='ps-pack-load');await p.locator('#ps-pack-load').click();}await p.locator('#pc-close').click();await details(p,'#ps-pack-manage');await p.locator('#ps-pack-remove').click();await p.locator('#game-confirm-cancel').click();assert.equal((await journal(p)).records.length,1);await p.locator('#ps-pack-remove').click();await p.locator('#game-confirm-accept').click();await saved(p);assert.equal((await journal(p)).records.length,0);assert.equal((await journal(p)).current,null);await fit(p);});
}
