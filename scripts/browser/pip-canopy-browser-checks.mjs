import assert from 'node:assert/strict';
import {chooseOption,waitForGameReady} from './ui-driver.mjs';
import {CANOPY_FAIR_MISSIONS} from '../../src/pip-canopy-fair.mjs';
import {DUO_KEY,DUO_STORIES,newDuoProject,remixDuoProject} from '../../src/pip-duo.mjs';
import {solvedTinkerProject,editTinkerProject,placeTinkerPart,tinkerCode,parseTinkerProject} from '../../src/pip-tinker.mjs';
import {duoBlueprint,repeatDuoBlueprint,placeDuoBlueprint,normalizeDuoBlueprint,parseDuoBlueprint} from '../../src/pip-duo-blueprints.mjs';
const R=['right','right','use'],W=['wait','wait','use'];
async function details(p,id){if(!await p.locator(id).evaluate(n=>n.open))await p.locator(id+'>summary').click();}
async function open(p){await waitForGameReady(p);await p.locator('#title-workshop').click();await p.locator('#ws-tab-lab').click();await p.locator('#ws-duo-adventures').click();}
async function collection(p,value,id){await details(p,'#ps-chooser');await chooseOption(p,'#ps-collection',value);if(id){await details(p,'#ps-chooser');await chooseOption(p,'#ps-trial',id);}}
async function win(p,ticks){await details(p,'#ps-test-options');await chooseOption(p,'#ps-speed','quick');await p.locator('#ps-test').click();await p.locator('#ps-run').click();await p.locator('#ps-status').filter({hasText:'Adventure complete!'}).waitFor({timeout:Math.max(15000,ticks*220+2000)});assert.match(await p.locator('#ps-status').textContent(),new RegExp('Tick '+ticks+'/'));}
async function cell(p,x,y){await details(p,'#ps-map-text');await chooseOption(p,'#ps-cursor-x',String(x));await chooseOption(p,'#ps-cursor-y',String(y));await p.locator('#ps-go-tile').click();}
async function download(p,id){const [d]=await Promise.all([p.waitForEvent('download'),p.locator(id).click()]),chunks=[];for await(const c of await d.createReadStream())chunks.push(c);return Buffer.concat(chunks);}
async function shared(p,project){const u=new URL(p.url());u.hash='pip='+tinkerCode(project);await p.goto(u.href);await waitForGameReady(p);await p.locator('#pip-studio[open]').waitFor();}
async function importPiece(p,piece){await details(p,'#ps-blueprints');await p.locator('#ps-bp-file').setInputFiles({name:'garden-piece.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(piece))});await p.locator('#ps-bp-note').filter({hasText:piece.name}).waitFor();}
async function projectFile(p){await p.locator('#ps-tab-share').click();const result=parseTinkerProject((await download(p,'#ps-export')).toString());await p.locator('#ps-tab-build').click();return result;}
async function fit(p){assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.ok(await p.locator('#pip-studio').evaluate(n=>n.scrollWidth<=n.clientWidth+1));for(const control of await p.locator('#pip-studio button:visible,#pip-studio [role=combobox]:visible').all())assert.ok(await control.evaluate(n=>{const r=n.getBoundingClientRect(),d=n.closest('dialog').getBoundingClientRect();return r.left>=d.left-1&&r.right<=d.right+1;}));}
const journal=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),DUO_KEY);
function hybrid(){const recipe=duoBlueprint('night-atelier');return normalizeDuoBlueprint({...recipe,height:3,road:[...recipe.road,{x:0,y:2},{x:1,y:2},{x:2,y:2}],parts:[...recipe.parts,{kind:'tube',x:0,y:2,channel:'amber'},{kind:'tube',x:2,y:2,channel:'amber'}]});}

async function playCanopyRepair(p,mission,width){
 const press=selector=>p.locator(selector)[width<500?'tap':'click']();
 const read=id=>p.locator('#ps-'+id).textContent(),canvas=p.locator('#ps-canvas');
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
  if(width<=320){await cell(p,part.x,part.y);await press('#ps-place-tile');}
  else{
   const bounds=await canvas.boundingBox(),point={x:bounds.width*(part.x+.5)/mission.width,y:bounds.height*(part.y+.5)/mission.height};
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
 for(const [i,part] of mission.solutionParts.entries()){
  await place(mission.id==='duo-bellflower-lift'&&part.kind==='cargo'?{...part,channel:'amber'}:part);
  if(mission.id==='duo-rain-bridge'&&i===1){
   await press('[data-ps-jump=programs]');await press('#ps-test-route');
   assert.match(await read('status'),/2\/3 placed.*Add the second jade tube end/);
   assert.equal(await p.locator('#ps-status').evaluate(n=>n===document.activeElement),true);
  }
 }
 if(mission.id==='duo-bellflower-lift'){
  await test();await press('#ps-run');
  const feedback=p.locator('#ps-playback-state').filter({hasText:'Inspect both cargo compasses'});await feedback.waitFor({timeout:18000});
  assert.match(await read('status'),/^Tick 100\/240/);
  assert.equal(await p.locator('#ps-next-story').isVisible(),false);
  assert.ok(await feedback.evaluate(n=>{const r=n.getBoundingClientRect(),header=n.closest('dialog').querySelector('.ps-heading').getBoundingClientRect();return r.top>=header.bottom-1&&r.bottom<=innerHeight;}));
  await press('#ps-test');await place(mission.solutionParts.find(part=>part.kind==='cargo'));
  assert.match(await read('inspect'),/match any.*Otherwise: South ↓ \/ South ↓ \/ Use.*Matching cargo: East → \/ East → \/ Use/);
 }
 await test();
 if(mission.id==='duo-bellflower-lift'){
  await milestone(6,/Cargo compass loaded Otherwise/);await milestone(9,/Pressed amber into jade/);
  await milestone(18,/Stored parcel/);assert.match(await read('duo-goals'),/Locker K3 holding jade from Pip/);
  await milestone(21,/Collected jade from locker/);assert.match(await read('duo-goals'),/Locker K3 empty/);
  for(const turn of [30,33,36])await milestone(turn);
  assert.match(await read('duo-goals'),/Letters 1\/2/);
  for(const turn of [39,45,48,51,60,63])await milestone(turn);
 }else if(mission.id==='duo-patient-bell'){
  await milestone(6,/Pressed amber into jade/);
  await milestone(9,/Passed parcel to Sprout.*Sprout: Cargo compass loaded Matching/);
  assert.match(await read('duo-goals'),/handoffs 1\/2/);assert.doesNotMatch(await read('duo-goals'),/locker relays/);
  await press('#ps-undo');assert.match(await read('duo-goals'),/handoffs 0\/2/);
  await milestone(9,/Passed parcel to Sprout.*Cargo compass loaded Matching/);await milestone(12,/Delivered jade/);
  assert.match(await read('duo-goals'),/Letters 1\/2/);
  for(const turn of [21,30,33])await milestone(turn);
 }else if(mission.id==='duo-rain-bridge'){
  assert.match(await read('duo-goals'),/Bridge 4 closed/);
  assert.doesNotMatch(await read('duo-goals'),/handoffs|locker relays/);
  await milestone(2,/Bridge 4 opens next turn/);assert.match(await read('duo-goals'),/Bridge 4 open/);
  await press('#ps-undo');assert.match(await read('duo-goals'),/Bridge 4 closed/);
  await milestone(2,/Bridge 4 opens next turn/);
  await milestone(5,/Sprout entered Bridge 4/);assert.match(await read('status'),/Pip: Holding Plate 4/);
  await press('#ps-step');assert.match(await read('status'),/^Tick 6\/240.*Pip: Holding Plate 4/);
  await milestone(9,/Traveled through the tube/);await milestone(12,/Delivered blue/);
  assert.match(await read('duo-goals'),/Letters 1\/2/);
  await milestone(21,/Traveled through the tube/);
  await milestone(23,/Sprout entered Bridge 4/);await milestone(35,/Sprout entered Bridge 4/);
  await milestone(39,/Traveled through the tube/);
 }else{
  await milestone(9,/Pressed amber into jade.*Pressed violet into amber/);await milestone(12,/Stored parcel/);
  assert.match(await read('duo-goals'),/Locker K1 holding jade from Pip.*Locker K4 holding amber from Sprout/);
  await milestone(18,/Collected amber.*Collected jade/);await milestone(24,/Pressed amber into blue.*Pressed jade into violet/);
  await milestone(27,/Delivered blue.*Delivered violet/);
  assert.match(await read('duo-goals'),/Letters 2\/4/);
  for(const channel of ['Blue','Violet'])assert.match(await read('duo-goals'),new RegExp(channel+' Quiet'));
  for(const turn of [39,42,48,54,57])await milestone(turn);
  assert.match(await read('duo-goals'),/Letters 4\/4.*lockers empty/);
  for(const channel of ['Blue','Violet'])assert.match(await read('duo-goals'),new RegExp(channel+' Powered'));
  assert.equal(await p.locator('#ps-next-story').isVisible(),false);
  await milestone(60,/Pip: Signal loaded Powered.*Sprout: Signal loaded Powered/);
 }
 assert.equal(await p.locator('#ps-next-story').isVisible(),false);
 await press('#ps-run');await p.locator('#ps-status').filter({hasText:'Adventure complete!'}).waitFor();await fit(p);
}

export async function pipCanopyScenarios(scenario){
 await scenario('pip-canopy-rain-milestones-large-text',320,async p=>{
  await p.locator('#title-accessibility').tap();await chooseOption(p,'#settings-reading-size','largest');
  await chooseOption(p,'#settings-contrast','high');await p.locator('#settings-close').tap();
  await open(p);await collection(p,'canopy-fair','duo-rain-bridge');
  await playCanopyRepair(p,CANOPY_FAIR_MISSIONS[2],320);
  assert.match(await p.locator('#ps-status').textContent(),/^Tick 42\/240 · Adventure complete!/);
 });
 for(const width of [390,1440])await scenario(`pip-canopy-four-story-missions-${width}`,width,async p=>{
  await waitForGameReady(p);await p.locator('#title-pip').click();await details(p,'#ph-filters');
  await p.locator('#ph-search').fill(CANOPY_FAIR_MISSIONS[0].title);await p.locator('[data-ph-mission=duo-bellflower-lift]').click();
  for(const [i,m]of CANOPY_FAIR_MISSIONS.entries()){
   assert.equal(await p.locator('#ps-title').textContent(),m.title);
   assert.match(await p.locator('#ps-kicker').textContent(),new RegExp('Chapter '+(17+i)+'/'+DUO_STORIES.length));
   await playCanopyRepair(p,m,width);
   assert.match(await p.locator('#ps-budget').textContent(),new RegExp(m.budget+'/'+m.budget));
   assert.match(await p.locator('#ps-status').textContent(),new RegExp('^Tick '+[66,36,42,61][i]+'/240 · Adventure complete!'));
   assert.ok((await p.locator('#ps-status').textContent()).includes(m.ending));
   if(i===3)assert.match(await p.locator('#ps-duo-goals').textContent(),/locker relays 4\/4 · lockers empty · home P home, S home/);
   if(i<3)await p.locator('#ps-next-story')[width<500?'tap':'click']();
  }
  assert.equal(await p.locator('#ps-next-story').isVisible(),true);
  assert.equal(Object.keys((await journal(p)).bests).length,4);
  await p.locator('#ps-next-story').click();assert.equal(await p.locator('#ps-title').textContent(),'The Lift Beneath the Stars');
  await p.locator('#ps-close').click();await p.reload();await open(p);await collection(p,'canopy-fair','duo-canopy-homecoming');
  assert.match(await p.locator('#ps-best').textContent(),/61 ticks/);await fit(p);
 });
 await scenario('pip-blueprint-independent-links-placement-undo-and-reload',390,async p=>{
  let seed=placeDuoBlueprint(newDuoProject(),duoBlueprint('tube-pair'),1,1);seed=placeDuoBlueprint(seed,duoBlueprint('locker-pair',{channel:'jade'}),1,3);await shared(p,seed);await importPiece(p,hybrid());await details(p,'#ps-bp-links');await p.locator('#ps-bp-unused-links').click();let piece=parseDuoBlueprint((await download(p,'#ps-bp-export')).toString());assert.ok(piece.parts.filter(p=>p.kind==='tube').every(p=>p.channel==='jade'));assert.equal(piece.parts.find(p=>p.kind==='locker').channel,'amber');await chooseOption(p,'#ps-bp-link-tube-amber','violet');await chooseOption(p,'#ps-bp-link-locker-amber','blue');piece=parseDuoBlueprint((await download(p,'#ps-bp-export')).toString());assert.equal(piece.parts.find(p=>p.kind==='source').channel,'amber');assert.equal(piece.parts.find(p=>p.kind==='press').output,'jade');assert.ok(piece.parts.filter(p=>p.kind==='tube').every(p=>p.channel==='violet'));assert.equal(piece.parts.find(p=>p.kind==='locker').channel,'blue');await cell(p,4,3);await p.locator('#ps-bp-place').click();assert.equal((await projectFile(p)).parts.length,9);await p.locator('#ps-undo').click();assert.deepEqual((await projectFile(p)).parts,seed.parts);await p.locator('#ps-bp-keep').click();assert.deepEqual(parseDuoBlueprint((await download(p,'#ps-bp-export')).toString()),piece);await p.locator('#ps-close').click();const reopen=new URL(p.url());reopen.hash='';await p.goto(reopen.href);await open(p);await collection(p,'create');await details(p,'#ps-blueprints');await chooseOption(p,'#ps-blueprint','piece-1');assert.deepEqual(parseDuoBlueprint((await download(p,'#ps-bp-export')).toString()),piece);assert.equal((await journal(p)).blueprints.length,1);await fit(p);
 });
 await scenario('pip-blueprint-link-swaps-and-invalid-map-recovery',1440,async p=>{
  const seed=newDuoProject('duo-creator',{width:13,height:9}),piece=repeatDuoBlueprint(duoBlueprint('tube-pair'),{count:2,shiftColours:true});await shared(p,seed);await importPiece(p,piece);await details(p,'#ps-bp-links');await chooseOption(p,'#ps-bp-link-tube-amber','jade');assert.match(await p.locator('#ps-bp-note').textContent(),/different numbers/);assert.equal(await p.locator('#ps-bp-place').isDisabled(),true);assert.equal(await p.locator('#ps-bp-find').isDisabled(),true);assert.equal((await journal(p)).drafts['duo-creator'].parts.length,0);await chooseOption(p,'#ps-bp-link-tube-jade','amber');const wired=parseDuoBlueprint((await download(p,'#ps-bp-export')).toString());assert.deepEqual(wired.parts.map(p=>p.channel),['jade','jade','amber','amber']);await cell(p,1,1);await p.locator('#ps-bp-place').click();assert.equal((await projectFile(p)).parts.length,4);await p.locator('#ps-undo').click();await p.locator('#ps-bp-reset-links').click();assert.deepEqual(parseDuoBlueprint((await download(p,'#ps-bp-export')).toString()),piece);await fit(p);
 });
 await scenario('pip-blueprint-find-room-and-corner-atelier-real-clear',390,async p=>{
  let seed=newDuoProject('duo-creator',{width:13,height:9});seed=editTinkerProject({...seed,starts:[{x:1,y:3},{x:11,y:7}]},{programs:[R,W]});await shared(p,seed);await details(p,'#ps-blueprints');await chooseOption(p,'#ps-blueprint','turning-atelier');await chooseOption(p,'#ps-bp-input','violet');await chooseOption(p,'#ps-bp-output','blue');await cell(p,12,8);assert.equal(await p.locator('#ps-bp-place').isDisabled(),true);await p.locator('#ps-bp-find').click();assert.match(await p.locator('#ps-notice').textContent(),/Suitable space 1\//);assert.match(await p.locator('#ps-inspect').textContent(),/Column 1, row 1/);assert.equal((await journal(p)).drafts['duo-creator'].parts.length,0);await p.locator('#ps-bp-find').click();assert.match(await p.locator('#ps-inspect').textContent(),/Column 2, row 1/);await cell(p,3,3);await p.locator('#ps-bp-place').click();await win(p,12);await p.locator('#ps-test').click();const cleared=await projectFile(p);assert.equal(cleared.proof.ticks,12);await details(p,'#ps-blueprints');await p.locator('#ps-bp-find').click();assert.equal((await projectFile(p)).proof.ticks,12);assert.deepEqual((await projectFile(p)).parts,cleared.parts);await fit(p);
 });
 await scenario('pip-blueprint-waiting-bell-target-and-handoff-clear',390,async p=>{
  let seed=newDuoProject('duo-creator',{width:13,height:9});seed={...seed,starts:[{x:1,y:5},{x:7,y:4}]};for(const part of [{kind:'source',x:3,y:5,channel:'amber'},{kind:'press',x:5,y:5,channel:'amber',output:'jade'},{kind:'handoff',x:7,y:5},{kind:'prism',x:1,y:5,operation:'mirror'},{kind:'prism',x:9,y:5,operation:'mirror'}])seed=placeTinkerPart(seed,part.kind,part.x,part.y,part);seed=editTinkerProject(seed,{programs:[R,W],handoffs:2});await shared(p,seed);await details(p,'#ps-blueprints');await chooseOption(p,'#ps-blueprint','waiting-bell');assert.equal(await p.locator('#ps-bp-recipe').isVisible(),false);assert.equal(await p.locator('#ps-bp-links').isVisible(),false);await chooseOption(p,'#ps-bp-channel','jade');await chooseOption(p,'#ps-bp-parcels','2');await cell(p,7,0);await p.locator('#ps-bp-place').click();await win(p,36);const cleared=await projectFile(p);assert.equal(cleared.version,3);assert.equal(cleared.handoffs,2);assert.equal(cleared.proof.ticks,36);assert.equal(cleared.parts.find(p=>p.kind==='receiver').parcels,2);await fit(p);
 });
 await scenario('pip-blueprint-links-enlarged-themed-menus-and-readonly',390,async p=>{
  await p.locator('#title-accessibility').click();await chooseOption(p,'#settings-reading-size','largest');await chooseOption(p,'#settings-contrast','high');await p.locator('#settings-close').click();await shared(p,remixDuoProject(solvedTinkerProject('duo-canopy-homecoming')));await importPiece(p,hybrid());await details(p,'#ps-bp-links');for(const [width,height]of [[320,568],[844,390],[768,1024],[1440,1000]]){await p.setViewportSize({width,height});await p.locator('[data-game-select=ps-bp-link-tube-amber]').click();assert.equal(await p.locator('.game-select-menu [role=option]').count(),4);await fit(p);await p.keyboard.press('End');await p.keyboard.press('Enter');assert.equal(await p.locator('#ps-bp-link-tube-amber').inputValue(),'blue');await p.locator('#ps-bp-unused-links').click();await fit(p);}await p.locator('#ps-test').click();assert.equal(await p.locator('[data-game-select=ps-bp-link-tube-amber]').isDisabled(),true);assert.equal(await p.locator('#ps-bp-unused-links').isDisabled(),true);assert.equal(await p.locator('#ps-bp-find').isDisabled(),true);await p.locator('#ps-test').click();assert.equal(await p.locator('#ps-bp-unused-links').isEnabled(),true);await fit(p);
 });
 await scenario('pip-blueprint-exhausted-links-and-intentional-locker-join',1440,async p=>{
  let seed=newDuoProject('duo-creator',{width:13,height:9});for(const [i,channel]of ['amber','jade','violet','blue'].entries())seed=placeDuoBlueprint(seed,duoBlueprint('tube-pair',{channel}),1,i+1);seed=placeTinkerPart(seed,'locker',5,5,{channel:'blue',mode:'send'});await shared(p,seed);await details(p,'#ps-blueprints');await chooseOption(p,'#ps-blueprint','tube-pair');await details(p,'#ps-bp-links');await p.locator('#ps-bp-unused-links').click();assert.match(await p.locator('#ps-notice').textContent(),/0 unused/);const before=await p.locator('#ps-inspect').textContent();await p.locator('#ps-bp-find').click();assert.match(await p.locator('#ps-notice').textContent(),/No suitable space/);assert.equal(await p.locator('#ps-inspect').textContent(),before);assert.deepEqual((await projectFile(p)).parts,seed.parts);const pair=duoBlueprint('locker-pair'),single={...pair,name:'One waiting locker',width:1,road:[{x:0,y:0}],parts:[{kind:'locker',x:0,y:0,channel:'amber',mode:'take'}]};await importPiece(p,single);await details(p,'#ps-bp-links');await chooseOption(p,'#ps-bp-link-locker-amber','blue');await cell(p,7,5);await p.locator('#ps-bp-place').click();assert.equal((await projectFile(p)).parts.filter(p=>p.kind==='locker'&&p.channel==='blue').length,2);await p.locator('#ps-undo').click();assert.deepEqual((await projectFile(p)).parts,seed.parts);await fit(p);
 });
}
