import {UNSUPPORTED_DUO_VERSION,UNSUPPORTED_BLUEPRINT_VERSION} from './pip-format-boundaries.mjs';
import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {MEETING_HOUSE_MISSIONS} from '../../src/pip-meeting-house.mjs';
import {DUO_KEY,DUO_STORIES,newDuoProject,remixDuoProject} from '../../src/pip-duo.mjs';
import {solvedTinkerProject,tinkerCode,parseTinkerProject,startTinker,tinkerStep,tinkerStateKey} from '../../src/pip-tinker.mjs';
import {normalizeDuoBlueprint,duoBlueprint,parseDuoBlueprint} from '../../src/pip-duo-blueprints.mjs';
import {COLLECTION_SAVE_KEY,replayCollectionSnapshot} from '../../src/pip-collection-storage.mjs';
import {duoBlueprintLinks} from '../../src/pip-blueprint-links.mjs';
import {parsePipCollection} from '../../src/pip-collections.mjs';import {parseSaveArchive} from '../../src/save-data.mjs';
import {chooseOption,waitForGameReady} from './ui-driver.mjs';
const times=[12,19,21,127],raw=(p,key=DUO_KEY)=>p.evaluate(k=>localStorage.getItem(k),key),journal=async p=>JSON.parse(await raw(p));
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

export async function pipMeetingScenarios(scenario){
 for(const width of[390,1440])await scenario(`pip-meeting-four-missions-${width}`,width,async p=>{
  await home(p);
  await details(p,'#ph-filters');
  await chooseOption(p,'#ph-region','meeting-house');
  assert.equal(await p.locator('[data-ph-mission]').count(),4);
  assert.equal(await p.locator('.ph-tags').filter({hasText:'Rendezvous Posts'}).count(),4);
  await p.locator('[data-ph-mission="duo-meeting-dusk"]').click();
  for(const[i,m]of MEETING_HOUSE_MISSIONS.entries()){assert.equal(await p.locator('#ps-title').textContent(),m.title);
  assert.match(await p.locator('#ps-kicker').textContent(),new RegExp('Chapter '+(93+i)+'/'+DUO_STORIES.length));
  await example(p);
  assert.match(await p.locator('#ps-budget').textContent(),new RegExp(m.budget+'/'+m.budget));
  await win(p,times[i]);
  assert.ok((await p.locator('#ps-status').textContent()).includes(m.ending));if(i<3)await p.locator('#ps-next-story').click();}
  assert.equal(await p.locator('#ps-next-story').isVisible(),false);
  await mainMenu(p);
  await p.reload();
  await home(p);
  await details(p,'#ph-filters');
  await chooseOption(p,'#ph-region','meeting-house');
  await chooseOption(p,'#ph-filter','cleared');
  assert.equal(await p.locator('[data-ph-mission]').count(),4);
  await p.locator('[data-ph-mission="duo-meeting-rounds"]').click();
  assert.match(await p.locator('#ps-best').textContent(),/127 ticks/);
  await fit(p);
 });
 await scenario('pip-meeting-checkpoint-undo-backup-and-rehearsal',390,async p=>{
  await home(p);
  await p.locator('#ph-tab-create').click();
  await p.locator('#ph-build-collection').click();
  await p.locator('#ps-pack-meetings').click();
  await p.locator('#pip-collection[open]').waitFor();
  const pack=parsePipCollection((await download(p,'#pc-export')).toString());
  assert.deepEqual(pack.chapters.map(c=>c.project.trialId),MEETING_HOUSE_MISSIONS.map(m=>m.id));
  const svg=await download(p,'#pc-poster');
  assert.match(svg.toString(),/↔ Rendezvous Post/);
  await decodePoster(p,svg.toString());
  await p.locator('[data-collection-replay="0"]').click();
  await p.locator('#ps-test').click();
  for(let i=0;i<4;i++)await p.locator('#ps-step').click();
  assert.match(await p.locator('#ps-status').textContent(),/^Tick 4\//);
  assert.ok((await p.locator('#ps-status').textContent()).length<160);
  await details(p,'#ps-power-details');
  assert.match(await p.locator('#ps-courier-text').textContent(),/meeting queued · next card 2/);
  await p.locator('#ps-close').click();
  await p.reload();
  await home(p);
  await p.locator('#ph-continue').click();
  assert.match(await p.locator('#ps-status').textContent(),/^Tick 4\//);
  await p.locator('#ps-step').click();
  assert.match(await p.locator('#ps-status').textContent(),/^Tick 5\//);
  await quiet(p);
  let j=JSON.parse(await raw(p,COLLECTION_SAVE_KEY)),snapshot=j.records[0].states[0],reference=startTinker(solvedTinkerProject('duo-meeting-dusk'));
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
  await p.locator('#save-file').setInputFiles({name:'meeting-backup.json',mimeType:'application/json',buffer:backup});
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
  await chooseOption(p,'#ps-rehearsal-filter','meeting');
  assert.match(await p.locator('#ps-rehearsal-list').textContent(),/Rendezvous/);
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
 await scenario('pip-meeting-blueprint-pairs-and-exchange',1440,async p=>{
  await shared(p,newDuoProject('duo-creator',{width:13,height:9}));
  await p.locator('#ps-tab-build').click();
  await details(p,'#ps-blueprints');
  await chooseOption(p,'#ps-blueprint','meeting-stagger');
  assert.equal(await p.locator('#ps-bp-meeting').evaluate(n=>n.open),false);
  await details(p,'#ps-bp-meeting');
  const before=await raw(p),draft=(await journal(p)).drafts['duo-creator'];
  const piece=async()=>parseDuoBlueprint((await download(p,'#ps-bp-export')).toString());
  const result=()=>p.locator('#ps-bp-meeting-result').textContent();
  assert.match(await result(),/Both resume on turn 8\. Pip waits 3 turns/);
  await chooseOption(p,'#ps-bp-meeting-pip','7');
  await chooseOption(p,'#ps-bp-meeting-sprout','4');
  assert.match(await result(),/Both resume on turn 8\. Pip waits no extra turns\. Sprout waits 3 turns/);
  await details(p,'#ps-bp-arrange');
  await chooseOption(p,'#ps-bp-count','2');
  assert.deepEqual(duoBlueprintLinks(await piece()).map(link=>[link.channel,link.ends]),[['amber',2],['jade',2]]);
  await details(p,'#ps-bp-links');
  await chooseOption(p,'#ps-bp-link-sync-amber','violet');
  await chooseOption(p,'#ps-bp-meeting-link','violet');
  assert.match(await p.locator('#ps-bp-meeting-ends').textContent(),/column 3, row 1 and column 3, row 3/);
  const changed=await piece();
  assert.deepEqual(duoBlueprintLinks(changed).map(link=>link.channel),['jade','violet']);
  assert.ok(changed.parts.filter(part=>part.kind==='source').every(part=>part.channel==='amber'));
  assert.equal(await raw(p),before);
  await p.locator('#ps-bp-keep').click();
  const kept=(await journal(p)).blueprints[0],bytes=await download(p,'#ps-bp-export');
  assert.deepEqual(kept.piece,changed);
  await details(p,'#ps-map-text');
  await chooseOption(p,'#ps-cursor-x','1');
  await chooseOption(p,'#ps-cursor-y','1');
  await p.locator('#ps-go-tile').click();
  await p.locator('#ps-bp-place').click();
  assert.equal((await journal(p)).drafts['duo-creator'].version,18);
  await p.locator('#ps-undo').click();
  assert.deepEqual((await journal(p)).drafts['duo-creator'],draft);
  await p.locator('#ps-bp-place').click();
  await chooseOption(p,'#ps-capture-width','11');
  await chooseOption(p,'#ps-capture-height','3');
  await p.locator('#ps-capture-piece').click();
  assert.deepEqual((await journal(p)).blueprints.at(-1).piece.parts,kept.piece.parts);
  await p.locator('#ps-bp-file').setInputFiles({name:'kept-posts.json',mimeType:'application/json',buffer:bytes});
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
 await scenario('pip-meeting-brush-and-protected-imports',390,async p=>{
  const garden={...newDuoProject(),parts:[{kind:'source',x:1,y:2,channel:'jade'},{kind:'receiver',x:6,y:2,channel:'jade'}]};
  await shared(p,garden);
  await p.locator('#ps-tab-build').click();
  await chooseOption(p,'#ps-brush','sync');
  assert.equal(await p.locator('#ps-channel-label').textContent(),'Link number');
  await chooseOption(p,'#ps-channel','jade');
  await details(p,'#ps-map-text');
  await chooseOption(p,'#ps-cursor-y','2');
  const place=async x=>{
   await chooseOption(p,'#ps-cursor-x',String(x));
   await p.locator('#ps-go-tile').click();
   await p.locator('#ps-place-tile').click();
  };
  await place(2);
  assert.deepEqual((await journal(p)).drafts['duo-creator'].parts.find(part=>part.kind==='sync'),{kind:'sync',x:2,y:2,channel:'jade'});
  assert.match(await p.locator('#ps-inspect').textContent(),/other link 2 · jade post/);
  await p.locator('#ps-test').click();
  assert.match(await p.locator('#ps-notice').textContent(),/second jade Rendezvous Post/);
  await place(3);
  const saved=await raw(p);
  await place(4);
  assert.match(await p.locator('#ps-notice').textContent(),/at most two posts/);
  assert.equal(await raw(p),saved);
  await p.locator('#ps-undo').click();
  assert.equal((await journal(p)).drafts['duo-creator'].parts.filter(part=>part.kind==='sync').length,1);
  await details(p,'#ps-blueprints');
  await chooseOption(p,'#ps-blueprint','meeting-lanes');
  const piece=parseDuoBlueprint((await download(p,'#ps-bp-export')).toString()),before=await raw(p);
  for(const bad of [{...piece,version:16},{...piece,version:UNSUPPORTED_BLUEPRINT_VERSION},{...piece,parts:piece.parts.filter((_,i)=>i!==1)}]){
   await p.locator('#ps-bp-file').setInputFiles({name:'bad-posts.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))});
   await p.locator('#ps-notice').filter({hasText:/version-18|garden-sized|both Rendezvous/}).waitFor();
   assert.equal(await raw(p),before);
   assert.deepEqual(parseDuoBlueprint((await download(p,'#ps-bp-export')).toString()),piece);
  }
  const draft=(await journal(p)).drafts['duo-creator'];
  await p.locator('#ps-tab-share').click();
  await details(p,'#ps-import-details');
  for(const bad of [{...draft,version:17},{...draft,version:UNSUPPORTED_DUO_VERSION},{...draft,proof:{ticks:1}},{...draft,parts:draft.parts.map(s=>({...s,channel:'unknown'}))}]){
   await p.locator('#ps-file').setInputFiles({name:'bad-meeting-project.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))});
   await p.locator('#ps-notice').filter({hasText:/version|colour|window|Rendezvous/i}).waitFor();
   assert.equal(await raw(p),before);
  }
  await fit(p);
 });
 await scenario('pip-meeting-large-menus-and-legacy-replay',390,async p=>{
  await waitForGameReady(p);
  await p.locator('#title-accessibility').click();
  await chooseOption(p,'#settings-reading-size','largest');
  await chooseOption(p,'#settings-contrast','high');
  await p.locator('#settings-close').click();
  const solved=solvedTinkerProject('duo-meeting-dusk');
  await shared(p,{...remixDuoProject(solved),proof:solved.proof});
  await p.locator('#ps-tab-build').click();
  await chooseOption(p,'#ps-brush','sync');
  await details(p,'#ps-blueprints');
  await chooseOption(p,'#ps-blueprint','meeting-lanes');
  await details(p,'#ps-bp-links');
  await details(p,'#ps-bp-meeting');
  const before=await raw(p),controls=[['ps-channel',4],['ps-bp-link-sync-amber',4],['ps-bp-meeting-link',1],['ps-bp-meeting-pip',16],['ps-bp-meeting-sprout',16]];
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
  assert.equal(project.version,18);
  assert.equal(project.proof.ticks,12);
  await shared(p,project);
  await win(p,12);
  const old=JSON.parse(await readFile(new URL('../../tests/fixtures/pip-v066-duo.json',import.meta.url),'utf8'));
  await shared(p,parseTinkerProject(old.project));
  await win(p,147);
  assert.equal(JSON.stringify(await exported(p))+'\n',old.project);
  await fit(p);
 });
}
