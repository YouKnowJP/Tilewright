import {UNSUPPORTED_DUO_VERSION,UNSUPPORTED_BLUEPRINT_VERSION} from './pip-format-boundaries.mjs';
import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {TOLL_HOUSE_MISSIONS} from '../../src/pip-toll-house.mjs';
import {DUO_KEY,DUO_STORIES,newDuoProject,remixDuoProject} from '../../src/pip-duo.mjs';
import {solvedTinkerProject,tinkerCode,parseTinkerProject,startTinker,tinkerStep,tinkerStateKey} from '../../src/pip-tinker.mjs';
import {parseDuoBlueprint} from '../../src/pip-duo-blueprints.mjs';
import {COLLECTION_SAVE_KEY,replayCollectionSnapshot} from '../../src/pip-collection-storage.mjs';
import {parsePipCollection} from '../../src/pip-collections.mjs';import {parseSaveArchive} from '../../src/save-data.mjs';
import {chooseOption,waitForGameReady} from './ui-driver.mjs';
const times=[12,18,18,58],raw=(p,key=DUO_KEY)=>p.evaluate(k=>localStorage.getItem(k),key),journal=async p=>JSON.parse(await raw(p));
async function details(p,id){if(!await p.locator(id).evaluate(n=>n.open))await p.locator(id+'>summary').click();}
async function home(p){await waitForGameReady(p);await p.locator('#title-pip').click();}
async function example(p){await p.locator('[data-ps-jump=help]').click();for(let i=0;i<3;i++)await p.locator('#ps-nudge').click();await p.locator('#ps-example').click();await p.locator('#game-confirm-accept').click();await p.locator('#game-confirm-dialog').waitFor({state:'detached'});}
async function win(p,ticks){await p.locator('#ps-test').click();await details(p,'#ps-test-options');await chooseOption(p,'#ps-speed','quick');await p.locator('#ps-run').click();await p.locator('#ps-status').filter({hasText:'Adventure complete!'}).waitFor({timeout:ticks*150+5000});assert.match(await p.locator('#ps-status').textContent(),new RegExp('Tick '+ticks+'/'));}
async function shared(p,project){const url=new URL(p.url());url.hash='pip='+tinkerCode(project);if(url.href===p.url())await p.reload();else await p.goto(url.href);await waitForGameReady(p);await p.locator('#pip-studio[open]').waitFor();await p.locator('#ps-test').filter({hasText:'Test invention'}).waitFor();}
async function download(p,id){const[d]=await Promise.all([p.waitForEvent('download'),p.locator(id).click()]),chunks=[];for await(const c of await d.createReadStream())chunks.push(c);return Buffer.concat(chunks);}
async function exported(p){await p.locator('#ps-tab-share').click();return parseTinkerProject((await download(p,'#ps-export')).toString());}
async function fit(p,id='#pip-studio'){assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.ok(await p.locator(id).evaluate(n=>n.scrollWidth<=n.clientWidth+1));const menu=p.locator('.game-select-menu');if(await menu.isVisible())assert.ok(await menu.evaluate(n=>{const b=n.getBoundingClientRect();return b.left>=-1&&b.top>=-1&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1;}),'Themed menu stays inside the viewport.');}
async function quiet(p){await p.waitForFunction(()=>!document.querySelector('#ps-pack-storage').textContent.includes('Saving collection'));}
async function mainMenu(p){await p.locator('#ps-close').click();if(await p.locator('#ph-close').isVisible())await p.locator('#ph-close').click();}

async function decodePoster(p,svg){const page=await p.context().newPage();try{const result=await page.evaluate(async svg=>{const doc=new DOMParser().parseFromString(svg,'image/svg+xml'),im=new Image();im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await im.decode();return {errors:doc.querySelectorAll('parsererror').length,width:im.naturalWidth,height:im.naturalHeight};},svg);assert.deepEqual(result,{errors:0,width:1000,height:1034});}finally{await page.close();}}

export async function pipTollScenarios(scenario){
 for(const width of[390,1440])await scenario(`pip-toll-four-missions-${width}`,width,async p=>{
  await home(p);
  await details(p,'#ph-filters');
  await chooseOption(p,'#ph-region','toll-house');
  assert.equal(await p.locator('[data-ph-mission]').count(),4);
  assert.equal(await p.locator('.ph-tags').filter({hasText:'Parcel Turnstiles'}).count(),4);
  await p.locator('[data-ph-mission="duo-toll-tickets"]').click();
  for(const[i,m]of TOLL_HOUSE_MISSIONS.entries()){assert.equal(await p.locator('#ps-title').textContent(),m.title);
  assert.match(await p.locator('#ps-kicker').textContent(),new RegExp('Chapter '+(97+i)+'/'+DUO_STORIES.length));
  await example(p);
  assert.match(await p.locator('#ps-budget').textContent(),new RegExp(m.budget+'/'+m.budget));
  await win(p,times[i]);
  assert.ok((await p.locator('#ps-status').textContent()).includes(m.ending));if(i<3)await p.locator('#ps-next-story').click();}
  await p.locator('#ps-next-story').click();
  assert.equal(await p.locator('#ps-title').textContent(),'The Three-Lap Dispatch');
  await mainMenu(p);
  await p.reload();
  await home(p);
  await details(p,'#ph-filters');
  await chooseOption(p,'#ph-region','toll-house');
  await chooseOption(p,'#ph-filter','cleared');
  assert.equal(await p.locator('[data-ph-mission]').count(),4);
  await p.locator('[data-ph-mission="duo-toll-rounds"]').click();
  assert.match(await p.locator('#ps-best').textContent(),/58 ticks/);
  await fit(p);
 });
 await scenario('pip-toll-checkpoint-undo-backup-and-rehearsal',390,async p=>{
  await home(p);
  await p.locator('#ph-tab-create').click();
  await p.locator('#ph-build-collection').click();
  await p.locator('#ps-pack-tolls').click();
  await p.locator('#pip-collection[open]').waitFor();
  const pack=parsePipCollection((await download(p,'#pc-export')).toString());
  assert.deepEqual(pack.chapters.map(c=>c.project.trialId),TOLL_HOUSE_MISSIONS.map(m=>m.id));
  const svg=await download(p,'#pc-poster');
  assert.match(svg.toString(),/\$ Parcel Turnstile/);
  await decodePoster(p,svg.toString());
  await p.locator('[data-collection-replay="0"]').click();
  await p.locator('#ps-test').click();
  for(let i=0;i<4;i++)await p.locator('#ps-step').click();
  assert.match(await p.locator('#ps-status').textContent(),/^Tick 4\//);
  assert.ok((await p.locator('#ps-status').textContent()).length<160);
  await details(p,'#ps-power-details');
  assert.match(await p.locator('#ps-courier-text').textContent(),/Pip: empty hands · ready · next card 2/);
  await p.locator('#ps-close').click();
  await p.reload();
  await home(p);
  await p.locator('#ph-continue').click();
  assert.match(await p.locator('#ps-status').textContent(),/^Tick 4\//);
  await p.locator('#ps-step').click();
  assert.match(await p.locator('#ps-status').textContent(),/^Tick 5\//);
  await quiet(p);
  let j=JSON.parse(await raw(p,COLLECTION_SAVE_KEY)),snapshot=j.records[0].states[0],reference=startTinker(solvedTinkerProject('duo-toll-tickets'));
  for(let i=0;i<5;i++)reference=tinkerStep(reference);
  assert.equal(tinkerStateKey(replayCollectionSnapshot(snapshot).state),tinkerStateKey(reference));
  await p.locator('#ps-undo').click();
  assert.match(await p.locator('#ps-status').textContent(),/^Tick 4\//);
  await p.locator('#ps-step').click();
  await mainMenu(p);
  await p.locator('#title-profile').click();
  const backup=await download(p,'#save-download');
  assert.ok(parseSaveArchive(backup.toString()).entries.some(([key])=>key===COLLECTION_SAVE_KEY));
  await p.locator('#settings-close').click();
  await home(p);
  await p.locator('#ph-continue').click();
  await p.locator('#ps-step').click();
  await mainMenu(p);
  await p.locator('#title-profile').click();
  await p.locator('#save-file').setInputFiles({name:'toll-backup.json',mimeType:'application/json',buffer:backup});
  await Promise.all([p.waitForEvent('domcontentloaded'),p.locator('#save-confirm').click()]);
  await waitForGameReady(p);
  await p.waitForFunction(()=>!document.body.inert);
  await home(p);
  await p.locator('#ph-continue').click();
  assert.match(await p.locator('#ps-status').textContent(),/^Tick 5\//);
  await p.locator('#ps-undo').click();
  assert.match(await p.locator('#ps-status').textContent(),/^Tick 4\//);
  await p.locator('#ps-test').click();
  await details(p,'#ps-rehearsal');
  const before=await raw(p);
  await chooseOption(p,'#ps-rehearsal-length','24');
  await p.locator('#ps-rehearse').click();
  await details(p,'#ps-rehearsal-events');
  await chooseOption(p,'#ps-rehearsal-filter','fare');
  assert.match(await p.locator('#ps-rehearsal-list').textContent(),/Parcel Turnstile/);
  assert.equal(await raw(p),before);
  await p.locator('#ps-rehearsal-list button').filter({hasText:'paid amber'}).first().click();
  assert.match(await p.locator('#ps-rehearsal-frame').textContent(),/^Tick 4/);
  await p.locator('#ps-rehearsal-inspect').click();
  assert.match(await p.locator('#ps-status').textContent(),/^Tick 4\//);
  await p.locator('#ps-undo').click();
  assert.match(await p.locator('#ps-status').textContent(),/^Tick 3\//);
  await p.locator('#ps-step').click();
  assert.match(await p.locator('#ps-status').textContent(),/^Tick 4\//);
  await fit(p);
 });
 await scenario('pip-toll-blueprint-compose-wire-and-exchange',1440,async p=>{
  await shared(p,newDuoProject('duo-creator',{width:13,height:9}));
  await p.locator('#ps-tab-build').click();
  await details(p,'#ps-blueprints');
  await chooseOption(p,'#ps-blueprint','fare-crossing');
  const composer='#ps-bp-turnstiles', preview='#ps-bp-toll-preview';
  assert.equal(await p.locator(composer).evaluate(n=>n.open),false);
  await details(p,composer);
  await details(p,preview);
  const before=await raw(p),draft=(await journal(p)).drafts['duo-creator'];
  const piece=async()=>parseDuoBlueprint((await download(p,'#ps-bp-export')).toString());
  const result=()=>p.locator('#ps-bp-toll-result').textContent();
  assert.match(await result(),/turns 5–7\. Turn 7 can use/);
  await chooseOption(p,'#ps-bp-toll-crossing','4');
  assert.match(await result(),/Turn 4 falls outside/);
  await chooseOption(p,'#ps-bp-toll-cargo','jade');
  assert.match(await result(),/Entry blocked.*amber.*Cargo stays/);
  await chooseOption(p,'#ps-bp-toll-fare','jade');
  await chooseOption(p,'#ps-bp-toll-duration','4');
  assert.match(await result(),/turns 5–8/);
  await p.locator('#ps-bp-toll-reset').click();
  assert.match(await result(),/Entry blocked.*amber/);
  await chooseOption(p,'#ps-bp-toll-fare','jade');
  await chooseOption(p,'#ps-bp-toll-duration','4');
  await details(p,'#ps-bp-power');
  await chooseOption(p,'#ps-bp-power-blue','amber');
  assert.deepEqual((await piece()).parts.find(part=>part.kind==='turnstile'),{kind:'turnstile',x:3,y:0,fare:'jade',channel:'amber',duration:4});
  await details(p,'#ps-bp-arrange');
  await chooseOption(p,'#ps-bp-axis','down');
  await chooseOption(p,'#ps-bp-count','2');
  const changed=await piece();
  assert.deepEqual(changed.parts.filter(part=>part.kind==='turnstile').map(s=>[s.y,s.fare,s.channel,s.duration]),[[0,'jade','amber',4],[4,'jade','amber',4]]);
  assert.ok(changed.parts.filter(part=>part.kind==='bridge').every(part=>part.channel==='amber'));
  assert.equal(await raw(p),before);
  await p.locator('#ps-bp-keep').click();
  const kept=(await journal(p)).blueprints[0],bytes=await download(p,'#ps-bp-export');
  assert.deepEqual(kept.piece,changed);
  await details(p,'#ps-map-text');
  await chooseOption(p,'#ps-cursor-x','1');
  await chooseOption(p,'#ps-cursor-y','1');
  await p.locator('#ps-go-tile').click();
  await p.locator('#ps-bp-place').click();
  assert.equal((await journal(p)).drafts['duo-creator'].version,19);
  await p.locator('#ps-undo').click();
  assert.deepEqual((await journal(p)).drafts['duo-creator'],draft);
  await p.locator('#ps-bp-place').click();
  await chooseOption(p,'#ps-capture-width','7');
  await chooseOption(p,'#ps-capture-height','7');
  await p.locator('#ps-capture-piece').click();
  assert.deepEqual((await journal(p)).blueprints.at(-1).piece.parts,kept.piece.parts);
  await p.locator('#ps-bp-file').setInputFiles({name:'kept-fares.json',mimeType:'application/json',buffer:bytes});
  await p.locator('#ps-notice').filter({hasText:'Blueprint opened for preview.'}).waitFor();
  assert.deepEqual(await piece(),kept.piece);
  await mainMenu(p);
  await p.goto(new URL('.',p.url()).href);
  await waitForGameReady(p);
  await p.reload();
  await home(p);
  await p.locator('#ph-tab-create').click();
  await p.locator('#ph-create-adventure').click();
  await details(p,'#ps-blueprints');
  await chooseOption(p,'#ps-blueprint',kept.id);
  assert.deepEqual(await piece(),kept.piece);
  await fit(p);
 });
 await scenario('pip-toll-brush-and-protected-imports',390,async p=>{
  const garden={...newDuoProject(),parts:[{kind:'source',x:1,y:2,channel:'jade'},{kind:'receiver',x:6,y:2,channel:'jade'}]};
  await shared(p,garden);
  await p.locator('#ps-tab-build').click();
  await chooseOption(p,'#ps-brush','turnstile');
  await chooseOption(p,'#ps-toll-fare','violet');
  await chooseOption(p,'#ps-toll-channel','jade');
  await chooseOption(p,'#ps-toll-duration','5');
  await details(p,'#ps-map-text');
  await chooseOption(p,'#ps-cursor-y','2');
  await chooseOption(p,'#ps-cursor-x','2');
  await p.locator('#ps-go-tile').click();
  await p.locator('#ps-place-tile').click();
  const gate=async()=>(await journal(p)).drafts['duo-creator'].parts.find(part=>part.kind==='turnstile');
  assert.deepEqual(await gate(),{kind:'turnstile',x:2,y:2,fare:'violet',channel:'jade',duration:5});
  assert.match(await p.locator('#ps-inspect').textContent(),/one violet parcel.*circuit 2.*5 following turns/);
  await p.locator('#ps-test').click();
  assert.match(await p.locator('#ps-notice').textContent(),/source or recipe for its violet fare/);
  await chooseOption(p,'#ps-toll-fare','jade');
  await p.locator('#ps-apply-part').click();
  assert.equal((await gate()).fare,'jade');
  await p.locator('#ps-undo').click();
  assert.equal((await gate()).fare,'violet');
  await details(p,'#ps-blueprints');
  await chooseOption(p,'#ps-blueprint','fare-dispatch');
  const piece=parseDuoBlueprint((await download(p,'#ps-bp-export')).toString()),before=await raw(p);
  const invalid=piece.parts.map(part=>part.kind==='turnstile'?{...part,duration:7}:part);
  for(const bad of [{...piece,version:17},{...piece,version:UNSUPPORTED_BLUEPRINT_VERSION},{...piece,parts:invalid}]){
   await p.locator('#ps-bp-file').setInputFiles({name:'bad-fare.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))});
   await p.locator('#ps-notice').filter({hasText:/version-19|garden-sized|one to six/}).waitFor();
   assert.equal(await raw(p),before);
   assert.deepEqual(parseDuoBlueprint((await download(p,'#ps-bp-export')).toString()),piece);
  }
  const draft=(await journal(p)).drafts['duo-creator'];
  await p.locator('#ps-tab-share').click();
  await details(p,'#ps-import-details');
  for(const bad of [{...draft,version:18},{...draft,version:UNSUPPORTED_DUO_VERSION},{...draft,proof:{ticks:1}}]){
   await p.locator('#ps-file').setInputFiles({name:'bad-fare-project.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))});
   await p.locator('#ps-notice').filter({hasText:/version|violet fare/i}).waitFor();
   assert.equal(await raw(p),before);
  }
  await fit(p);
 });
 await scenario('pip-toll-large-menus-and-legacy-replay',390,async p=>{
  await waitForGameReady(p);
  await p.locator('#title-accessibility').click();
  await chooseOption(p,'#settings-reading-size','largest');
  await chooseOption(p,'#settings-contrast','high');
  await p.locator('#settings-close').click();
  const solved=solvedTinkerProject('duo-toll-tickets');
  await shared(p,{...remixDuoProject(solved),proof:solved.proof});
  await p.locator('#ps-tab-build').click();
  await chooseOption(p,'#ps-brush','turnstile');
  await details(p,'#ps-blueprints');
  await chooseOption(p,'#ps-blueprint','fare-crossing');
  await details(p,'#ps-bp-turnstiles');
  await details(p,'#ps-bp-toll-preview');
  const before=await raw(p),controls=[['ps-toll-fare',4],['ps-toll-channel',4],['ps-toll-duration',6],['ps-bp-toll-station',1],['ps-bp-toll-fare',4],['ps-bp-toll-cargo',5],['ps-bp-toll-entry',24],['ps-bp-toll-crossing',24]];
  for(const [width,height]of [[320,568],[390,844],[844,390],[768,1024],[1440,1000]]){
   await p.setViewportSize({width,height});
   for(const [id,count]of controls){
    const control=p.locator('[data-game-select='+id+']');
    await control.click();
    assert.equal(await p.locator('.game-select-menu [role=option]').count(),count);
    await fit(p);
    await p.keyboard.press('Escape');
    assert.equal(await control.evaluate(n=>n===document.activeElement),true);
    assert.ok(await control.locator('span').first().evaluate(n=>n.scrollWidth<=n.clientWidth+1),`${id} label fits at ${width} × ${height}`);
   }
  }
  assert.equal(await raw(p),before);
  await win(p,12);
  for(const [id]of controls)assert.equal(await p.locator('[data-game-select='+id+']').isDisabled(),true);
  const project=await exported(p);
  assert.equal(project.version,19);
  assert.equal(project.proof.ticks,12);
  await shared(p,project);
  await win(p,12);
  const old=JSON.parse(await readFile(new URL('../../tests/fixtures/pip-v067-duo.json',import.meta.url),'utf8'));
  await shared(p,parseTinkerProject(old.project));
  await win(p,127);
  assert.equal(JSON.stringify(await exported(p))+'\n',old.project);
 });
}
