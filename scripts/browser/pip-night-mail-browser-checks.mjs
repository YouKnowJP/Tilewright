import assert from 'node:assert/strict';
import {chooseOption,waitForGameReady} from './ui-driver.mjs';
import {NIGHT_MAIL_MISSIONS} from '../../src/pip-night-mail.mjs';
import {DUO_STORIES,DUO_KEY} from '../../src/pip-duo.mjs';
import {solvedTinkerProject,tinkerCode,parseTinkerProject,parseTinkerCode} from '../../src/pip-tinker.mjs';
import {parseDuoBlueprint} from '../../src/pip-duo-blueprints.mjs';
async function details(p,id){if(!await p.locator(id).evaluate(n=>n.open))await p.locator(id+'>summary').click();}
async function open(p){await waitForGameReady(p);await p.locator('#title-workshop').click();await p.locator('#ws-tab-lab').click();await p.locator('#ws-duo-adventures').click();}
async function collection(p,value,id){await details(p,'#ps-chooser');await chooseOption(p,'#ps-collection',value);if(id){await details(p,'#ps-chooser');await chooseOption(p,'#ps-trial',id);}}
async function example(p){await details(p,'#ps-help');for(let i=0;i<3;i++)await p.locator('#ps-nudge').click();await p.locator('#ps-example').click();await p.locator('#game-confirm-accept').click();}
async function win(p){await details(p,'#ps-test-options');await chooseOption(p,'#ps-speed','quick');await p.locator('#ps-test').click();await p.locator('#ps-run').click();await p.locator('#ps-status').filter({hasText:'Adventure complete!'}).waitFor();}
async function cell(p,x,y){await details(p,'#ps-map-text');await chooseOption(p,'#ps-cursor-x',String(x));await chooseOption(p,'#ps-cursor-y',String(y));await p.locator('#ps-go-tile').click();}
async function fit(p){assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.ok(await p.locator('#pip-studio').evaluate(n=>n.scrollWidth<=n.clientWidth+1));for(const control of await p.locator('#pip-studio button:visible,#pip-studio [role=combobox]:visible').all())assert.ok(await control.evaluate(n=>{const r=n.getBoundingClientRect(),d=n.closest('dialog').getBoundingClientRect();return r.left>=d.left-1&&r.right<=d.right+1;}));}
async function download(p,id){const [d]=await Promise.all([p.waitForEvent('download'),p.locator(id).click()]),chunks=[];for await(const c of await d.createReadStream())chunks.push(c);return Buffer.concat(chunks);}

async function enterCards(p,press,mission){
 await press('[data-ps-jump=programs]');
 for(const [i,actor] of ['pip','sprout'].entries()){
  await press('#ps-actor-'+actor);
  for(const [card,command] of mission.solution[i].entries())await chooseOption(p,`#ps-card-${actor}-${card}`,command);
 }
 await press('#ps-test-route');
}

export async function pipNightMailScenarios(scenario){
 for(const width of [390,1440])await scenario(`pip-night-post-first-relays-${width}`,width,async p=>{
  const press=selector=>p.locator(selector)[width<500?'tap':'click']();
  const status=p.locator('#ps-status'),goals=p.locator('#ps-duo-goals'),next=p.locator('#ps-next-story');
  const playback=p.locator('#ps-playback-state');
  const [festival,midnight,compass,blue]=DUO_STORIES.slice(5,9);
  async function plan(mission,guide){
   assert.equal(await p.locator('#ps-title').textContent(),mission.title);
   assert.equal(await p.locator('#ps-story-goal').isVisible(),true);
   await press('[data-ps-jump=programs]');
   assert.match(await p.locator('#ps-card-help').textContent(),guide);
   for(const [i,actor] of ['pip','sprout'].entries()){
    await press('#ps-actor-'+actor);
    for(const [card,command] of mission.solution[i].entries())await chooseOption(p,`#ps-card-${actor}-${card}`,command);
   }
   await press('#ps-test-route');
   assert.equal(await p.locator('#ps-event').textContent(),'Next milestone');
   assert.match(await status.textContent(),/^Tick 0\//);
  }
  async function milestone(turn,message,summary=message){
   await press('#ps-event');
   await p.locator('#ps-run[aria-pressed=false]').waitFor({state:'attached'});
   assert.match(await status.textContent(),new RegExp('^Tick '+turn+'/240'));
   if(message)assert.match(await status.textContent(),message);
   assert.match(await playback.textContent(),/Milestone reached/);
   if(summary)assert.match(await playback.textContent(),summary);
  }
  async function finish(turn){
   await press('#ps-run');
   await status.filter({hasText:'Adventure complete!'}).waitFor();
   assert.match(await status.textContent(),new RegExp('^Tick '+turn+'/240'));
   await fit(p);
  }

  await waitForGameReady(p);await press('#title-pip');await press('[data-ph-mission=duo-lantern-festival]');
  await plan(festival,/Quiet signal stamps/);
  await details(p,'#ps-test-options');await chooseOption(p,'#ps-speed','quick');await press('#ps-test-options > summary');
  assert.match(await goals.textContent(),/Quiet until both windows fill/);
  await milestone(6,/Passed parcel/);
  await milestone(9,/Delivered jade/);
  await milestone(24,/Passed parcel/);
  await milestone(36,/Signal loaded Quiet.*Delivered jade/,/Delivered jade/);
  assert.match(await goals.textContent(),/Letters 2\/2.*Powered on the next Use/);
  assert.equal(await next.isVisible(),false);
  await milestone(39,/Signal loaded Powered/);
  await milestone(41);
  assert.match(await goals.textContent(),/P away, S home/);
  assert.match(await playback.textContent(),/Sprout reached the home flag/);
  await finish(55);
  assert.match(await next.textContent(),/The Midnight Post/);
  await press('#ps-next-story');

  await press('[data-ps-jump=programs]');await press('#ps-test-route');await press('#ps-event');
  await playback.filter({hasText:'This route repeats'}).waitFor();
  await press('#ps-test');
  await plan(midnight,/An early visit can find K1 empty/);
  for(let i=0;i<3;i++)await press('#ps-step');
  assert.match(await status.textContent(),/Sprout: Locker empty/);
  await milestone(6,/Stored parcel/);
  assert.match(await goals.textContent(),/locker relays 0\/2.*Locker K1 holding amber from Pip/);
  assert.ok(await p.locator('#pip-studio').evaluate(n=>n.scrollWidth<=n.clientWidth+1));
  await press('#ps-undo');
  assert.match(await status.textContent(),/^Tick 5\//);
  assert.match(await goals.textContent(),/Locker K1 empty/);
  await milestone(6,/Stored parcel/);
  await milestone(27,/Sprout: Collected amber from locker/);
  assert.match(await goals.textContent(),/locker relays 1\/2.*Locker K1 empty/);
  await finish(72);await press('#ps-next-story');

  await plan(compass,/Otherwise sends Sprout back/);
  await milestone(6,/Cargo compass loaded Otherwise/);
  await milestone(9,/Collected amber from locker/);
  await milestone(18,/Cargo compass loaded Matching/);
  await finish(45);await press('#ps-next-story');

  await plan(blue,/K3 links the two locker ends and can carry jade/);
  await milestone(6,/Pressed amber into jade.*Cargo compass loaded Otherwise/);
  await milestone(9,/Stored parcel.*Collected jade/);
  assert.match(await goals.textContent(),/locker relays 1\/2.*Locker K3 empty/);
  await milestone(18,/Cargo compass loaded Matching/);
  await milestone(21,/Pressed jade into blue/);
  await finish(54);await press('#ps-next-story');
  assert.equal(await p.locator('#ps-title').textContent(),NIGHT_MAIL_MISSIONS[3].title);
  assert.equal(await p.locator('#ps-event').textContent(),'Next milestone');
 });
 for(const width of [390,1440])await scenario(`pip-night-post-repairs-and-finale-${width}`,width,async p=>{
  const press=selector=>p.locator(selector)[width<500?'tap':'click']();
  const read=id=>p.locator('#ps-'+id).textContent();
  const [twin,brass,finale]=NIGHT_MAIL_MISSIONS.slice(3);
  const canvas=p.locator('#ps-canvas');
  async function placeAt(x,y){
   await press('[data-ps-jump=canvas]');
   const bounds=await canvas.boundingBox();
   const point={x:bounds.width*(x+.5)/13,y:bounds.height*(y+.5)/7};
   if(width<500)await p.touchscreen.tap(bounds.x+point.x,bounds.y+point.y);
   else await canvas.click({position:point});
  }
  async function tryUnfinished(issue){
   await press('[data-ps-jump=programs]');await press('#ps-test-route');
   assert.match(await read('status'),issue);
   assert.equal(await p.locator('#ps-status').evaluate(n=>n===document.activeElement),true);
   assert.equal(await p.locator('#ps-step').isVisible(),false);
  }
  async function milestone(turn,event){
   await press('#ps-event');
   await p.locator('#ps-run[aria-pressed=false]').waitFor({state:'attached'});
   assert.match(await read('status'),new RegExp('^Tick '+turn+'/240'));
   if(event)assert.match(await read('playback-state'),event);
  }
  async function finish(turn){
   await press('#ps-run');
   await p.locator('#ps-status').filter({hasText:'Adventure complete!'}).waitFor();
   assert.match(await read('status'),new RegExp('^Tick '+turn+'/240'));
   await fit(p);
   await press('#ps-next-story');
  }

  await waitForGameReady(p);await press('#title-pip');await press('#ph-following');
  await press('[data-ph-mission=duo-twin-depots]');
  assert.match(await read('story-goal'),/K1 and K4/);
  await enterCards(p,press,twin);
  await details(p,'#ps-test-options');await chooseOption(p,'#ps-speed','quick');await press('#ps-test-options > summary');
  await milestone(6,/Pip: Stored parcel.*Sprout: Stored parcel/);
  assert.match(await read('duo-goals'),/Locker K1 holding amber from Pip.*Locker K4 holding blue from Sprout/);
  await milestone(9,/Collected blue.*Collected amber/);await milestone(12,/Delivered blue.*Delivered amber/);
  assert.match(await read('duo-goals'),/Amber Quiet · Blue Quiet/);
  await milestone(36);await milestone(39);await milestone(42);
  assert.match(await read('duo-goals'),/Letters 4\/4.*Amber Powered · Blue Powered/);
  assert.equal(await p.locator('#ps-next-story').isVisible(),false);
  await finish(61);

  assert.equal(await read('title'),brass.title);
  await tryUnfinished(/0\/2 placed.*Add the second violet tube end/);
  await press('[data-ps-jump=build-tools]');
  assert.match(await read('repair-help'),/Pair the violet tube \(U3\)/);
  const tube=brass.solutionParts.find(part=>part.kind==='tube');
  await chooseOption(p,'#ps-brush','tube');
  assert.equal(await read('channel-label'),'Tube link number');
  await chooseOption(p,'#ps-channel',tube.channel);
  await placeAt(0,0);
  assert.match(await read('inspect'),/Column 1, row 1.*Place an available repair part on a free garden tile/);
  await placeAt(tube.x,tube.y);
  assert.match(await read('inspect'),/U3 · violet link · paired with column 7, row 2/);
  assert.match(await read('status'),/1\/2 placed.*Cargo compass/);
  await press('#ps-undo');
  assert.match(await read('status'),/0\/2 placed.*second violet tube/);
  await placeAt(tube.x,tube.y);
  const compass=brass.solutionParts.find(part=>part.kind==='cargo');
  await press('[data-ps-jump=build-tools]');await chooseOption(p,'#ps-brush','cargo');
  await chooseOption(p,'#ps-cargo-match',compass.channel);
  for(const [bank,cards] of [['a',compass.program],['b',compass.alternate]]){
   for(const [i,card] of cards.entries())await chooseOption(p,`#ps-card-route-${bank}-${i}`,card);
  }
  await placeAt(compass.x,compass.y);
  assert.match(await read('status'),/2\/2 placed.*test the route/);
  await enterCards(p,press,brass);
  await milestone(6,/Cargo compass loaded Otherwise/);await milestone(9,/Collected jade/);
  await milestone(18,/Cargo compass loaded Matching/);await milestone(20,/Traveled through the tube/);
  await finish(73);

  assert.equal(await read('title'),finale.title);
  await tryUnfinished(/0\/2 placed.*violet window.*jade window/);
  for(const [i,part] of finale.solutionParts.entries()){
   await press('[data-ps-jump=build-tools]');await chooseOption(p,'#ps-brush','press');
   await chooseOption(p,'#ps-input',part.channel);await chooseOption(p,'#ps-output',part.output);
   await placeAt(part.x,part.y);
   if(i===0)assert.match(await read('status'),/1\/2 placed.*violet window/);
  }
  await enterCards(p,press,finale);
  await milestone(6,/Pressed amber into jade.*Pressed blue into violet/);
  await milestone(9);
  assert.match(await read('duo-goals'),/Locker K1 holding jade from Pip.*Locker K4 holding violet from Sprout/);
  for(const turn of [12,15,42,45,48,51])await milestone(turn);
  assert.match(await read('duo-goals'),/Letters 4\/4.*lockers empty.*Jade Powered · Violet Powered/);
  assert.equal(await p.locator('#ps-next-story').isVisible(),false);
  await finish(73);
  assert.equal(await read('title'),'The Reversed Route Library');
 });
 for(const width of [390,1440])await scenario(`pip-night-mail-six-hard-missions-${width}`,width,async p=>{await open(p);await collection(p,'night-mail');for(const [i,m]of NIGHT_MAIL_MISSIONS.entries()){assert.equal(await p.locator('#ps-title').textContent(),m.title);assert.match(await p.locator('#ps-kicker').textContent(),new RegExp('Chapter '+(i+7)+'/'+DUO_STORIES.length));await example(p);await win(p);assert.match(await p.locator('#ps-status').textContent(),new RegExp('Tick '+[72,45,54,61,73,73][i]+'/'));assert.ok((await p.locator('#ps-status').textContent()).includes(m.ending));assert.match(await p.locator('#ps-duo-goals').textContent(),new RegExp('locker relays '+m.relays+'/'+m.relays));if(m.emptyLockers)assert.match(await p.locator('#ps-duo-goals').textContent(),/lockers empty/);if(i<5)await p.locator('#ps-next-story').click();}assert.equal(await p.locator('#ps-next-story').isVisible(),NIGHT_MAIL_MISSIONS.at(-1).id!==DUO_STORIES.at(-1).id);const j=JSON.parse(await p.evaluate(k=>localStorage.getItem(k),DUO_KEY));assert.equal(Object.keys(j.bests).length,6);assert.equal(j.drafts['duo-last-collection'].parts.length,2);await p.locator('#ps-test').click();await p.locator('#ps-tab-gallery').click();await p.locator('#ps-slots article').first().getByRole('button',{name:'Display current invention'}).click();assert.match(await p.locator('#ps-slots article').first().textContent(),/73 ticks/);await p.locator('#ps-close').click();await p.reload();await open(p);await collection(p,'night-mail','duo-last-collection');assert.match(await p.locator('#ps-best').textContent(),/73 ticks/);await fit(p);});
 await scenario('pip-night-mail-creator-mechanics-and-goal-editing',390,async p=>{await open(p);await collection(p,'night-mail','duo-cargo-crossroads');await example(p);await p.locator('#ps-remix').click();assert.equal(await p.locator('#ps-locker-goals').isVisible(),false);await details(p,'#ps-duo-story');assert.equal(await p.locator('#ps-relays').inputValue(),'2');await cell(p,5,1);await p.locator('#ps-edit-part').click();assert.equal(await p.locator('#ps-cargo-match').inputValue(),'any');assert.equal(await p.locator('#ps-bank-a legend').textContent(),'Otherwise');assert.equal(await p.locator('#ps-bank-b legend').textContent(),'Matching cargo');await chooseOption(p,'#ps-cargo-match','amber');await p.locator('#ps-apply-part').click();assert.match(await p.locator('#ps-inspect').textContent(),/match amber/);await cell(p,5,5);await p.locator('#ps-edit-part').click();assert.equal(await p.locator('#ps-locker-mode').inputValue(),'send');await chooseOption(p,'#ps-locker-mode','both');await p.locator('#ps-apply-part').click();await p.locator('#ps-undo').click();await chooseOption(p,'#ps-brush','inspect');await chooseOption(p,'#ps-relays','2');await win(p);await p.locator('#ps-undo').click();assert.match(await p.locator('#ps-status').textContent(),/Tick 44/);await p.locator('#ps-step').click();await p.locator('#ps-test').click();await details(p,'#ps-adventure-library');await p.locator('#ps-save-adventure').click();await p.locator('#ps-tab-share').click();const project=parseTinkerProject((await download(p,'#ps-export')).toString());assert.equal(project.version,3);assert.equal(project.proof.ticks,45);assert.equal(project.relays,2);assert.deepEqual(parseTinkerCode(await p.locator('#ps-code').inputValue()),project);await fit(p);});
 await scenario('pip-night-mail-blueprint-arrangements-and-saved-revisions',390,async p=>{await open(p);await collection(p,'create');await details(p,'#ps-blueprints');await chooseOption(p,'#ps-blueprint','locker-pair');await details(p,'#ps-bp-arrange');await chooseOption(p,'#ps-bp-reflection','horizontal');await chooseOption(p,'#ps-bp-count','2');await p.locator('#ps-bp-shift').check();await cell(p,1,1);assert.match(await p.locator('#ps-bp-fit').textContent(),/7 × 1 fits/);await p.locator('#ps-bp-place').click();assert.match(await p.locator('#ps-budget').textContent(),/4\/32/);assert.equal(await p.locator('#ps-bp-place').isDisabled(),true);assert.match(await p.locator('#ps-bp-fit').textContent(),/free tiles/);await p.locator('#ps-undo').click();assert.match(await p.locator('#ps-budget').textContent(),/0\/32/);await details(p,'#ps-bp-metadata');await p.locator('#ps-bp-name').fill('Our paired night post');await p.locator('#ps-bp-author').fill('Rook');await p.locator('#ps-bp-description').fill('Send at the right end. Two independent channels.');await p.locator('#ps-bp-description').press('Tab');await p.locator('#ps-bp-keep').click();let bp=parseDuoBlueprint((await download(p,'#ps-bp-export')).toString());assert.equal(bp.name,'Our paired night post');assert.equal(bp.width,7);assert.deepEqual(bp.parts.map(p=>p.mode),['send','take','send','take']);assert.deepEqual(bp.parts.map(p=>p.channel),['amber','amber','jade','jade']);await details(p,'#ps-bp-metadata');await p.locator('#ps-bp-name').fill('A revised night post');await p.locator('#ps-bp-name').press('Tab');await p.locator('#ps-bp-update').click();await p.locator('#game-confirm-cancel').click();assert.equal(JSON.parse(await p.evaluate(k=>localStorage.getItem(k),DUO_KEY)).blueprints[0].piece.name,'Our paired night post');await p.locator('#ps-bp-update').click();await p.locator('#game-confirm-accept').click();bp=parseDuoBlueprint((await download(p,'#ps-bp-export')).toString());assert.equal(bp.name,'A revised night post');assert.equal(bp.width,7);await cell(p,1,1);await p.locator('#ps-bp-place').click();await p.locator('#ps-tab-share').click();let project=parseTinkerProject((await download(p,'#ps-export')).toString());assert.equal(project.version,3);assert.equal(project.parts.length,4);await p.locator('#ps-tab-build').click();await details(p,'#ps-blueprints');await chooseOption(p,'#ps-blueprint','cargo-switch');await details(p,'#ps-bp-arrange');await chooseOption(p,'#ps-bp-reflection','horizontal');const cargo=parseDuoBlueprint((await download(p,'#ps-bp-export')).toString()).parts.find(p=>p.kind==='cargo');assert.equal(cargo.program[0],'right');assert.equal(cargo.alternate[0],'left');await fit(p);});
 await scenario('pip-night-mail-shared-repairs-and-old-project-continuity',1440,async p=>{const u=new URL(p.url());u.hash='pip='+tinkerCode(solvedTinkerProject('duo-last-collection'));await p.goto(u.href);await p.locator('#pip-studio[open]').waitFor();await win(p);await p.locator('#ps-tab-share').click();const exported=parseTinkerProject((await download(p,'#ps-export')).toString());assert.equal(exported.version,3);assert.equal(exported.parts.length,2);const bad={...exported,proof:{ticks:1}};await p.locator('#ps-file').setInputFiles({name:'false-clear.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))});assert.match(await p.locator('#ps-notice').textContent(),/does not finish/);await p.locator('#ps-file').setInputFiles({name:'old-project.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(solvedTinkerProject('duo-first-letter')))});await win(p);await p.locator('#ps-tab-share').click();assert.equal(parseTinkerProject((await download(p,'#ps-export')).toString()).version,2);await fit(p);});
 await scenario('pip-night-mail-enlarged-controls-previews-and-readonly',390,async p=>{await p.locator('#title-accessibility').click();await chooseOption(p,'#settings-reading-size','largest');await chooseOption(p,'#settings-contrast','high');await p.locator('#settings-close').click();await open(p);await collection(p,'night-mail','duo-twin-depots');await example(p);await p.locator('#ps-remix').click();for(const [width,height]of [[320,568],[844,390],[768,1024],[1440,1000]]){await p.setViewportSize({width,height});await details(p,'#ps-duo-story');await details(p,'#ps-blueprints');await chooseOption(p,'#ps-blueprint','locker-pair');await details(p,'#ps-bp-arrange');await details(p,'#ps-bp-metadata');await p.locator('[data-game-select=ps-bp-reflection]').click();assert.equal(await p.locator('.game-select-menu [role=option]').count(),3);await fit(p);await p.keyboard.press('Escape');await chooseOption(p,'#ps-brush','cargo');await p.locator('[data-game-select=ps-cargo-match]').click();assert.equal(await p.locator('.game-select-menu [role=option]').count(),5);await fit(p);await p.keyboard.press('Escape');await chooseOption(p,'#ps-brush','inspect');await cell(p,12,6);assert.equal(await p.locator('#ps-bp-place').isDisabled(),true);assert.match(await p.locator('#ps-bp-fit').textContent(),/whole blueprint fits/);}await p.locator('#ps-test').click();assert.equal(await p.locator('#ps-relays').isDisabled(),true);assert.equal(await p.locator('#ps-bp-update').isDisabled(),true);assert.equal(await p.locator('[data-game-select=ps-bp-reflection]').isDisabled(),true);await p.locator('#ps-test').click();await fit(p);});
}
