import {UNSUPPORTED_DUO_VERSION,UNSUPPORTED_BLUEPRINT_VERSION} from './pip-format-boundaries.mjs';
import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {RAIL_HOUSE_MISSIONS} from '../../src/pip-rail-house.mjs';
import {DUO_KEY,DUO_STORIES,newDuoProject,remixDuoProject} from '../../src/pip-duo.mjs';
import {solvedTinkerProject,tinkerCode,parseTinkerProject,startTinker,tinkerStep,tinkerStateKey} from '../../src/pip-tinker.mjs';
import {normalizeDuoBlueprint,duoBlueprint,parseDuoBlueprint} from '../../src/pip-duo-blueprints.mjs';
import {COLLECTION_SAVE_KEY,replayCollectionSnapshot} from '../../src/pip-collection-storage.mjs';
import {blueprintRailStations} from '../../src/pip-blueprint-rails.mjs';
import {parsePipCollection} from '../../src/pip-collections.mjs';import {parseSaveArchive} from '../../src/save-data.mjs';
import {chooseOption,waitForGameReady} from './ui-driver.mjs';
const times=[11,29,11,147],raw=(p,key=DUO_KEY)=>p.evaluate(k=>localStorage.getItem(k),key),journal=async p=>JSON.parse(await raw(p));
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

export async function pipRailScenarios(scenario){
 for(const width of[390,1440])await scenario(`pip-switchyard-four-missions-${width}`,width,async p=>{
  await home(p);
  await details(p,'#ph-filters');
  await chooseOption(p,'#ph-region','rail-house');
  assert.equal(await p.locator('[data-ph-mission]').count(),4);
  assert.equal(await p.locator('.ph-tags').filter({hasText:'Switch Rails & rides'}).count(),4);
  await p.locator('[data-ph-mission="duo-rail-sidecar"]').click();
  for(const[i,m]of RAIL_HOUSE_MISSIONS.entries()){assert.equal(await p.locator('#ps-title').textContent(),m.title);
  assert.match(await p.locator('#ps-kicker').textContent(),new RegExp('Chapter '+(89+i)+'/'+DUO_STORIES.length));
  await example(p);
  assert.match(await p.locator('#ps-budget').textContent(),new RegExp(m.budget+'/'+m.budget));
  await win(p,times[i]);
  assert.ok((await p.locator('#ps-status').textContent()).includes(m.ending));if(i<3)await p.locator('#ps-next-story').click();}
  assert.equal(await p.locator('#ps-next-story').isVisible(),true);
  await mainMenu(p);
  await p.reload();
  await home(p);
  await details(p,'#ph-filters');
  await chooseOption(p,'#ph-region','rail-house');
  await chooseOption(p,'#ph-filter','cleared');
  assert.equal(await p.locator('[data-ph-mission]').count(),4);
  await p.locator('[data-ph-mission="duo-rail-foundry"]').click();
  assert.match(await p.locator('#ps-best').textContent(),/147 ticks/);
  await fit(p);
 });
 await scenario('pip-switchyard-checkpoint-undo-backup-and-rehearsal',390,async p=>{
  await home(p);
  await p.locator('#ph-tab-create').click();
  await p.locator('#ph-build-collection').click();
  await p.locator('#ps-pack-rails').click();
  await p.locator('#pip-collection[open]').waitFor();
  const pack=parsePipCollection((await download(p,'#pc-export')).toString());
  assert.deepEqual(pack.chapters.map(c=>c.project.trialId),RAIL_HOUSE_MISSIONS.map(m=>m.id));
  const svg=await download(p,'#pc-poster');
  assert.match(svg.toString(),/» Switch Rail/);
  await decodePoster(p,svg.toString());
  await p.locator('[data-collection-replay="0"]').click();
  await p.locator('#ps-test').click();
  for(let i=0;i<4;i++)await p.locator('#ps-step').click();
  assert.match(await p.locator('#ps-status').textContent(),/^Tick 4\//);
  assert.ok((await p.locator('#ps-status').textContent()).length<160);
  await details(p,'#ps-power-details');
  assert.match(await p.locator('#ps-courier-text').textContent(),/ride queued · next card 2/);
  await p.locator('#ps-close').click();
  await p.reload();
  await home(p);
  await p.locator('#ph-continue').click();
  assert.match(await p.locator('#ps-status').textContent(),/^Tick 4\//);
  await p.locator('#ps-step').click();
  assert.match(await p.locator('#ps-status').textContent(),/^Tick 5\//);
  await quiet(p);
  let j=JSON.parse(await raw(p,COLLECTION_SAVE_KEY)),snapshot=j.records[0].states[0],reference=startTinker(solvedTinkerProject('duo-rail-sidecar'));
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
  await p.locator('#save-file').setInputFiles({name:'switchyard-backup.json',mimeType:'application/json',buffer:backup});
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
  await chooseOption(p,'#ps-rehearsal-filter','rail');
  assert.match(await p.locator('#ps-rehearsal-list').textContent(),/Switch Rail/);
  assert.equal(await raw(p),before);
  await p.locator('#ps-rehearsal-list button').filter({hasText:'reached'}).first().click();
  assert.match(await p.locator('#ps-rehearsal-frame').textContent(),/^Tick 4/);
  await p.locator('#ps-rehearsal-inspect').click();
  assert.match(await p.locator('#ps-status').textContent(),/^Tick 4\//);
  await p.locator('#ps-undo').click();
  assert.match(await p.locator('#ps-status').textContent(),/^Tick 3\//);
  await p.locator('#ps-step').click();
  assert.match(await p.locator('#ps-status').textContent(),/^Tick 4\//);
  await fit(p);
 });
 await scenario('pip-switchyard-blueprint-exits-and-exchange',1440,async p=>{
  await shared(p,newDuoProject('duo-creator',{width:13,height:9}));
  await p.locator('#ps-tab-build').click();
  await details(p,'#ps-blueprints');
  const source=duoBlueprint('rail-fork');
  await p.locator('#ps-bp-file').setInputFiles({name:'rail-lab.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(source))});
  await p.locator('#ps-notice').filter({hasText:'Blueprint opened for preview.'}).waitFor();
  assert.equal(await p.locator('#ps-bp-rails').evaluate(n=>n.open),false);
  await details(p,'#ps-bp-rails');
  await details(p,'#ps-bp-rail-preview');
  const before=await raw(p),draft=(await journal(p)).drafts['duo-creator'];
  const piece=async()=>parseDuoBlueprint((await download(p,'#ps-bp-export')).toString());
  const result=()=>p.locator('#ps-bp-rail-result').textContent();
  assert.match(await result(),/2,2 → 3,2\. The next card resumes/);
  await chooseOption(p,'#ps-bp-rail-sample','amber');
  assert.match(await result(),/2,2 → 2,1 → 3,1 → 3,2/);
  await chooseOption(p,'#ps-bp-rail-station','1');
  await chooseOption(p,'#ps-bp-rail-powered','down');
  await chooseOption(p,'#ps-bp-rail-station','0');
  assert.match(await result(),/loops back/);
  await chooseOption(p,'#ps-bp-rail-station','1');
  await p.locator('#ps-bp-rail-restore').click();
  assert.deepEqual(await piece(),source);
  await chooseOption(p,'#ps-bp-rail-station','0');
  await p.locator('#ps-bp-rail-copy').click();
  assert.deepEqual(blueprintRailStations(await piece()).map(s=>s.poweredExit),['up','up','up']);
  await p.locator('#ps-bp-rail-swap').click();
  assert.deepEqual(blueprintRailStations(await piece()).map(s=>s.quietExit),['up','up','up']);
  await p.locator('#ps-bp-rail-reset').click();
  assert.deepEqual(await piece(),source);
  await chooseOption(p,'#ps-bp-rail-quiet','left');
  await details(p,'#ps-bp-power');
  await chooseOption(p,'#ps-bp-power-amber','violet');
  await chooseOption(p,'#ps-bp-turns','1');
  const changed=await piece(),first=blueprintRailStations(changed)[0];
  assert.deepEqual([first.channel,first.quietExit,first.poweredExit],['violet','up','right']);
  assert.equal(changed.parts[3].channel,'violet');
  assert.equal(await raw(p),before);
  await p.locator('#ps-bp-keep').click();
  const kept=(await journal(p)).blueprints[0],bytes=await download(p,'#ps-bp-export');
  assert.deepEqual(kept.piece,changed);
  await details(p,'#ps-map-text');
  await chooseOption(p,'#ps-cursor-x','1');
  await chooseOption(p,'#ps-cursor-y','1');
  await p.locator('#ps-go-tile').click();
  await p.locator('#ps-bp-place').click();
  assert.equal((await journal(p)).drafts['duo-creator'].version,17);
  await p.locator('#ps-undo').click();
  assert.deepEqual((await journal(p)).drafts['duo-creator'],draft);
  await p.locator('#ps-bp-place').click();
  await chooseOption(p,'#ps-capture-width','3');
  await chooseOption(p,'#ps-capture-height','5');
  await p.locator('#ps-capture-piece').click();
  assert.deepEqual((await journal(p)).blueprints.at(-1).piece.parts,kept.piece.parts);
  await p.locator('#ps-bp-file').setInputFiles({name:'kept-rails.json',mimeType:'application/json',buffer:bytes});
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
  await chooseOption(p,'#ps-blueprint','rail-fork');
  await details(p,'#ps-bp-rails');
  await chooseOption(p,'#ps-bp-rail-quiet','left');
  await chooseOption(p,'#ps-bp-channel','jade');
  const rewiredPreset=blueprintRailStations(await piece())[0];
  assert.deepEqual([rewiredPreset.channel,rewiredPreset.quietExit],['jade','left']);
  await fit(p);
 });
 await scenario('pip-switchyard-brush-and-protected-imports',390,async p=>{
  await shared(p,newDuoProject());
  await p.locator('#ps-tab-build').click();
  await chooseOption(p,'#ps-brush','rail');
  assert.equal(await p.locator('#ps-counter-fields').isVisible(),false);
  await chooseOption(p,'#ps-rail-channel','jade');
  await chooseOption(p,'#ps-rail-quiet','left');
  await chooseOption(p,'#ps-rail-powered','up');
  await details(p,'#ps-map-text');
  await chooseOption(p,'#ps-cursor-x','2');
  await chooseOption(p,'#ps-cursor-y','2');
  await p.locator('#ps-go-tile').click();
  await p.locator('#ps-place-tile').click();
  assert.deepEqual((await journal(p)).drafts['duo-creator'].parts[0],{kind:'rail',x:2,y:2,channel:'jade',quietExit:'left',poweredExit:'up'});
  assert.match(await p.locator('#ps-inspect').textContent(),/Quiet West.*Powered North/);
  assert.match(await p.locator('#ps-map-list').textContent(),/without spending a card/);
  await chooseOption(p,'#ps-brush','inspect');
  await p.locator('#ps-edit-part').click();
  await chooseOption(p,'#ps-rail-powered','down');
  await p.locator('#ps-apply-part').click();
  assert.equal((await journal(p)).drafts['duo-creator'].parts[0].poweredExit,'down');
  await p.locator('#ps-undo').click();
  assert.equal((await journal(p)).drafts['duo-creator'].parts[0].poweredExit,'up');
  await details(p,'#ps-blueprints');
  await chooseOption(p,'#ps-blueprint','rail-corner');
  const piece=parseDuoBlueprint((await download(p,'#ps-bp-export')).toString()),saved=await raw(p);
  assert.match(await p.locator('#ps-bp-preview').getAttribute('aria-label'),/Powered South/);
  for(const bad of [{...piece,version:15},{...piece,version:UNSUPPORTED_BLUEPRINT_VERSION},{...piece,parts:piece.parts.map(s=>s.kind==='rail'?{...s,quietExit:'wait'}:s)}]){
   await p.locator('#ps-bp-file').setInputFiles({name:'bad-rail.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))});
   await p.locator('#ps-notice').filter({hasText:/version-17|garden-sized|Switch Rail/}).waitFor();
   assert.equal(await raw(p),saved);
   assert.deepEqual(parseDuoBlueprint((await download(p,'#ps-bp-export')).toString()),piece);
  }
  const draft=(await journal(p)).drafts['duo-creator'];
  await p.locator('#ps-tab-share').click();
  await details(p,'#ps-import-details');
  for(const bad of [{...draft,version:16},{...draft,version:UNSUPPORTED_DUO_VERSION},{...draft,proof:{ticks:1}},{...draft,parts:draft.parts.map(s=>({...s,poweredExit:'use'}))}]){
   await p.locator('#ps-file').setInputFiles({name:'bad-rail-project.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))});
   await p.locator('#ps-notice').filter({hasText:/version|Switch Rail|window/i}).waitFor();
   assert.equal(await raw(p),saved);
  }
  await fit(p);
 });
 await scenario('pip-switchyard-large-menus-and-legacy-replay',390,async p=>{
  await waitForGameReady(p);
  await p.locator('#title-accessibility').click();
  await chooseOption(p,'#settings-reading-size','largest');
  await chooseOption(p,'#settings-contrast','high');
  await p.locator('#settings-close').click();
  const solved=solvedTinkerProject('duo-rail-sidecar');
  await shared(p,{...remixDuoProject(solved),proof:solved.proof});
  await p.locator('#ps-tab-build').click();
  await chooseOption(p,'#ps-brush','rail');
  await details(p,'#ps-blueprints');
  await chooseOption(p,'#ps-blueprint','rail-fork');
  await details(p,'#ps-bp-rails');
  await details(p,'#ps-bp-rail-preview');
  const before=await raw(p),controls=[['ps-rail-channel',4],['ps-rail-quiet',4],['ps-bp-rail-station',3],['ps-bp-rail-powered',4],['ps-bp-rail-sample',5]];
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
  await win(p,11);
  for(const [id]of controls)assert.equal(await p.locator('[data-game-select='+id+']').isDisabled(),true);
  const project=await exported(p);
  assert.equal(project.version,17);
  assert.equal(project.proof.ticks,11);
  await shared(p,project);
  await win(p,11);
  const old=JSON.parse(await readFile(new URL('../../tests/fixtures/pip-v065-duo.json',import.meta.url),'utf8'));
  await shared(p,parseTinkerProject(old.project));
  await win(p,111);
  assert.equal(JSON.stringify(await exported(p))+'\n',old.project);
  await fit(p);
 });
}
