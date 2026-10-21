import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { featuredBooks } from '../src/storybook-worlds.mjs';
import { BOOK_KEY, parseBook } from '../src/storybook-model.mjs';
import { puzzleLabWorld } from '../src/workshop-lab.mjs';
import { LAB_CLEARS } from '../src/workshop-lab-clears.mjs';
import { STORY_LEVELS, storyAdventure } from '../src/storybook-adventures.mjs';
import { STORY_ALTERNATIVES } from '../tests/fixtures/story-alternatives.mjs';
import { serializeBook } from '../src/storybook-model.mjs';
import { playGuild } from './guild-browser-checks.mjs';
import { clickControl } from './ui-driver.mjs';

const saved = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)),BOOK_KEY);
const otherSaves = page => page.evaluate(key => JSON.stringify(Object.entries(localStorage).filter(([name])=>name!==key).sort()),BOOK_KEY);
async function openBooks(page) { await page.locator('#title-workshop').click(); await page.locator('#ws-tab-books').click(); }
async function newBook(page,index,difficulty) {
  if (await page.locator('#book-more-books').getAttribute('open') === null) await page.locator('#book-more-books>summary').click();
  await page.locator('#book-rules').selectOption(difficulty); await page.locator(`[data-book-cover="${index}"] button`).first().click();
}
async function finish(page,actions,touch=false,ending='') { await playGuild(page,actions,touch); assert.equal(await page.locator('#adventure').getAttribute('data-status'),'won'); assert.equal(await page.locator('#game-primary').textContent(),'Turn the page →');if(ending)assert.ok((await page.locator('#game-result-text').textContent()).includes(ending));await page.locator('#game-primary').click(); }
async function fits(page) { assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'The storybook must not create sideways document scrolling.'); }

export async function checkStorybooks(browserType,{baseURL='http://127.0.0.1:4174',channel='chrome',fullBooks=true,widths=[320,390,768,1024,1440,844],screenshots=false,onProgress=()=>{}}={}) {
  const browser=await browserType.launch({headless:true,channel}),results=[];
  const report=value=>{results.push(value);onProgress(value);};
  const contextFor = async options => { const context = await browser.newContext(options); context.setDefaultTimeout(15_000); return context; };
  let exported;
  try {
    const context=await contextFor({viewport:{width:1440,height:1000},acceptDownloads:true,reducedMotion:'reduce'});
    try {
      const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('response',response=>{if(response.status()>=400)errors.push(response.url());});
      await page.goto(baseURL);await openBooks(page);const originals=await otherSaves(page);
      for(const [index,book] of featuredBooks().entries()) for(const difficulty of ['trail','nemesis']) {
        if(!fullBooks && (index!==0||difficulty!=='trail'))continue;
        await newBook(page,index,difficulty);
        assert.match(await page.locator('#book-passage').textContent(),new RegExp(book.chapters[0].passage.slice(0,12)));
        for(const chapter of book.chapters) {
          await page.locator('[data-book-challenge="clean"]').click();await page.locator('#book-continue').click();
          assert.equal(await page.locator('#game-difficulty').isDisabled(),true);assert.match(await page.locator('#game-book-banner').textContent(),/Untouched light/);
          await finish(page,chapter.world.proof.actions,false,chapter.world.source==='Storybook original'?chapter.world.ending:'');assert.match(await page.locator('#book-tally').textContent(),/honors/);
        }
        const state=await saved(page);assert.equal(state.session.phase,'won');assert.equal(state.session.receipts.filter(receipt=>receipt.earned).length,book.chapters.length);
        assert.equal(await page.locator('#book-continue').isVisible(),false);assert.equal(await otherSaves(page),originals);
        if(await page.locator('#book-receipts-details').getAttribute('open')===null)await page.locator('#book-receipts-details>summary').click();await page.locator('.book-restored-page>summary').first().click();assert.equal(await page.locator('.book-restored-page .book-page-story').first().textContent(),book.chapters[0].passage);assert.equal(await page.locator('.book-restored-page .book-page-story').nth(1).textContent(),book.chapters[0].world.ending);
        report({book:book.title,difficulty,chapters:book.chapters.length,checks:'Native keyboard wins, visible chapter endings, rereadable restored pages, clean honors, whole-book records, and other-save isolation.'});
      }
      // Reload at camp and mid-chapter, then finish after deliberately missing an optional honor.
      await newBook(page,0,'trail');await page.locator('#book-continue').click();await finish(page,LAB_CLEARS.counterweight);
      await page.reload();await openBooks(page);assert.match(await page.locator('#book-camp-kicker').textContent(),/CHAPTER 2/);
      await page.locator('[data-book-challenge="resourceful"]').click();await page.locator('#book-continue').click();await playGuild(page,['right']);
      await page.reload();await openBooks(page);assert.equal(await page.locator('#book-continue').textContent(),'Restart chapter 2');
      await page.locator('#book-continue').click();assert.equal(await page.locator('#game-turns').textContent(),'0');await finish(page,LAB_CLEARS.footstep);
      assert.equal((await saved(page)).session.receipts[1].earned,false);assert.match(await page.locator('#book-camp-kicker').textContent(),/CHAPTER 3/);
      await page.locator('[data-book-challenge="voices"]').click();if(screenshots)await page.screenshot({path:'.playwright-mcp/storybook-camp-desktop.png',fullPage:true});
      const download=page.waitForEvent('download');await page.locator('#book-active-download').click();exported=await readFile(await(await download).path(),'utf8');assert.equal(parseBook(exported).chapters.length,3);
      const checkpoint=JSON.stringify((await saved(page)).session);
      await page.locator('#ws-home').click();await page.locator('#title-play').click();await page.locator('#front-story').click();assert.equal(await page.locator('#game-difficulty').isDisabled(),false);await page.locator('#game-difficulty').selectOption('nemesis');
      assert.equal(JSON.stringify((await saved(page)).session),checkpoint);await page.locator('#library-resume').click();assert.equal(await page.locator('#game-difficulty').inputValue(),'trail');assert.equal(await page.locator('#game-difficulty').isDisabled(),true);await page.locator('#game-primary').click();
      assert.equal(await otherSaves(page),originals);
      report({checks:'Camp reload, mid-chapter restart, missed no-power honor, guide challenge, portable download, other-mode rule selection, and unchanged-rule Continue.'});
      // Builder edits survive reload. Reorder, remove, duplicate, all six slots, and cancelled replacement.
      await page.locator('#book-active-remix').click();await page.locator('#book-title').fill('The keeper’s own road');await page.locator('#book-synopsis').fill('<b>Only a story, never markup.</b>');
      await page.locator('[data-book-chapter="0"] textarea').fill('A new opening, written by a keeper.');await page.locator('[aria-label="Move chapter 1 later"]').click();
      assert.equal((await saved(page)).draft.chapters[1].passage,'A new opening, written by a keeper.');
      await page.locator('[data-book-chapter="0"] button').last().click();
      for(let index=0;index<4;index++){await page.locator('#book-world').selectOption({label:'Counterweight Creek'});await page.locator('#book-add').click();}
      assert.equal(await page.locator('#book-add').isDisabled(),true);assert.equal((await saved(page)).draft.chapters.length,6);
      const beforeCancel=JSON.stringify((await saved(page)).draft);page.once('dialog',dialog=>dialog.dismiss());await page.locator('#book-clear').click();assert.equal(JSON.stringify((await saved(page)).draft),beforeCancel);
      await page.reload();await openBooks(page);await page.locator('#book-compose').click();assert.equal(await page.locator('#book-title').inputValue(),'The keeper’s own road');assert.equal(await page.locator('[data-book-chapter]').count(),6);
      if(screenshots)await page.screenshot({path:'.playwright-mcp/storybook-builder-desktop.png',fullPage:true});
      const builderDownload=page.waitForEvent('download');await page.locator('#book-draft-download').click();assert.equal(parseBook(await readFile(await(await builderDownload).path(),'utf8')).chapters.length,6);
      page.once('dialog',dialog=>dialog.dismiss());await page.locator('#book-file').setInputFiles({name:'friend.storybook.json',mimeType:'application/json',buffer:Buffer.from(exported)});assert.equal((await saved(page)).draft.title,'The keeper’s own road');
      await page.locator('#book-file').setInputFiles({name:'bad.storybook.json',mimeType:'application/json',buffer:Buffer.from('{broken')});await page.waitForFunction(()=>document.querySelector('#book-notice').textContent.includes('JSON'));assert.equal((await saved(page)).draft.title,'The keeper’s own road');
      const activeBefore=(await saved(page)).session;await page.locator('#book-title').fill('');await page.locator('#book-draft-play').click();assert.match(await page.locator('#book-notice').textContent(),/title/);assert.deepEqual((await saved(page)).session,activeBefore);
      await page.locator('#book-title').fill('The keeper’s own road');page.once('dialog',dialog=>dialog.dismiss());await page.locator('#book-draft-play').click();assert.deepEqual((await saved(page)).session,activeBefore);
      await page.locator('#book-draft-rules').selectOption('nemesis');page.once('dialog',dialog=>dialog.accept());await page.locator('#book-draft-play').click();assert.match(await page.locator('#book-camp-heading').textContent(),/keeper’s own road/);await page.locator('#book-continue').click();await finish(page,LAB_CLEARS.counterweight);assert.equal((await saved(page)).session.chapter,1);
      assert.equal(await otherSaves(page),originals);assert.deepEqual(errors,[]);report({checks:'Six-slot authoring, independent chapter snapshots, written interludes, reorder/remove, persistence, draft download, cancelled and malformed import.'});
    } finally {await context.close();}
    // Friend receives a self-contained book, without the original browser or its shelf.
    const friend=await contextFor({viewport:{width:390,height:844},hasTouch:true,isMobile:true,acceptDownloads:true});
    try {
      const page=await friend.newPage();await page.goto(baseURL);await openBooks(page);const originals=await otherSaves(page);
      await page.locator('#book-file').setInputFiles({name:'friend.storybook.json',mimeType:'application/json',buffer:Buffer.from(exported)});await page.locator('#book-builder').waitFor();
      assert.equal(await page.locator('[data-book-chapter]').count(),3);await page.locator('#book-draft-rules').selectOption('nemesis');await page.locator('#book-draft-play').tap();
      assert.match(await page.locator('#book-camp-kicker').textContent(),/NEMESIS/);await page.locator('#book-continue').tap();await finish(page,LAB_CLEARS.counterweight,true);assert.equal((await saved(page)).session.chapter,1);
      assert.equal(await otherSaves(page),originals);report({checks:'Independent friend browser imports bundled worlds, chooses Nemesis, and completes chapter one using touch controls.'});
    } finally {await friend.close();}
    if(fullBooks)for(const [id,actions]of Object.entries(STORY_ALTERNATIVES))for(const difficulty of ['trail','nemesis']){
      const context=await contextFor({viewport:{width:1440,height:900}});
      try{
        const page=await context.newPage(),world=storyAdventure(id),challenge=id==='remembering'?'resourceful':id==='undelivered'?'voices':'treasure';await page.goto(baseURL);await openBooks(page);
        const file=serializeBook({title:'Another answer',author:'A keeper',chapters:[{world,passage:'Try another way through.'},{world,passage:'Return with a different idea.'}]});
        await page.locator('#book-file').setInputFiles({name:'another-answer.storybook.json',mimeType:'application/json',buffer:Buffer.from(file)});await page.locator('#book-draft-rules').selectOption(difficulty);await page.locator('#book-draft-play').click();await page.locator(`[data-book-challenge="${challenge}"]`).click();await page.locator('#book-continue').click();await finish(page,actions,false,world.ending);assert.equal((await saved(page)).session.receipts[0].earned,true);
        report({alternate:id,difficulty,checks:'An actual alternate-solution win earns its voice, treasure, or no-power honor.'});
      }finally{await context.close();}
    }
    if(fullBooks)for(const index of [3,4]){
      const width=index===3?390:320,height=index===3?844:568,context=await contextFor({viewport:{width,height},hasTouch:true,isMobile:true}),book=featuredBooks()[index];
      try{
        const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(baseURL);await openBooks(page);assert.equal(await page.locator('#book-covers>article').first().getAttribute('data-book-cover'),'3');await newBook(page,index,index===3?'trail':'nemesis');
        for(const [chapterIndex,chapter]of book.chapters.entries()){
          await fits(page);if(screenshots&&chapterIndex===0){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`.playwright-mcp/new-story-${index}-camp-${width}.png`,fullPage:true});}
          await page.locator('[data-book-challenge="clean"]').tap();await page.locator('#book-continue').tap();await fits(page);await page.waitForFunction(()=>{const board=document.querySelector('.game-main'),controls=document.querySelector('.game-controls');return board.scrollHeight<=board.clientHeight+1&&controls.getBoundingClientRect().bottom<=board.getBoundingClientRect().bottom+1;});
          if(screenshots&&chapterIndex===3)await page.screenshot({path:`.playwright-mcp/new-story-${index}-finale-${width}.png`,fullPage:true});
          await finish(page,chapter.world.proof.actions,true,chapter.world.ending);
        }
        assert.equal((await saved(page)).session.phase,'won');assert.equal(await page.locator('#book-passage').textContent(),book.ending);await fits(page);assert.deepEqual(errors,[]);
        report({book:book.title,width,height,checks:'All four original chapters completed with native touch, including long dialogues, chapter endings, and the full book epilogue.'});
      }finally{await context.close();}
    }
    for(const width of widths) {
      const context=await contextFor({viewport:{width,height:width===844?390:900},hasTouch:true,isMobile:width<600});
      try {
        const page=await context.newPage();await page.goto(baseURL);await openBooks(page);assert.equal(await page.locator('#book-file').isVisible(),false);await fits(page);await newBook(page,0,'trail');await fits(page);
        await page.locator('[data-book-challenge="swift"]').tap();if(screenshots){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`.playwright-mcp/storybook-camp-${width}.png`,fullPage:true});}
        await page.locator('#book-continue').tap();await fits(page);assert.ok(await page.locator('#game-book-banner').isVisible());
        const bounds=await page.evaluate(()=>({height:innerHeight,document:document.documentElement.scrollHeight,controls:document.querySelector('.game-controls').getBoundingClientRect().bottom,canvas:document.querySelector('#adventure-canvas').getBoundingClientRect().toJSON(),view:document.querySelector('#game-viewport').getBoundingClientRect().toJSON()}));
        if(bounds.height>=740){assert.equal(bounds.document,bounds.height);assert.ok(bounds.controls<=bounds.height);}else assert.ok(bounds.document<=704);
        assert.ok(bounds.canvas.width>0&&bounds.canvas.height>0&&bounds.canvas.left>=bounds.view.left&&bounds.canvas.right<=bounds.view.right+1);
        await clickControl(page,'#game-choose',true);
        await page.locator('#book-active-remix').tap();await fits(page);if(screenshots)await page.screenshot({path:`.playwright-mcp/storybook-builder-${width}.png`,fullPage:true});
        for(const level of STORY_LEVELS)assert.equal(await page.locator('#book-world option').filter({hasText:level.title}).count(),1);
        report({width,checks:'Touch navigation, readable interlude and challenge choices, gameplay banner, creator layout, and no sideways scrolling.'});
      } finally {await context.close();}
    }
    for(const mode of ['blocked','full','damaged']) {
      const context=await contextFor();
      try {
        await context.addInitScript(({key,mode,world})=>{
          if(mode==='damaged')localStorage.setItem(key,JSON.stringify({version:1,draft:{chapters:[{world}]},session:{phase:'broken'},records:{}}));
          if(mode==='blocked')Storage.prototype.getItem=function(){throw Error('Saving blocked');};
          if(mode!=='damaged')Storage.prototype.setItem=function(){throw Error('Saving full');};
        },{key:BOOK_KEY,mode,world:puzzleLabWorld('counterweight')});
        const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(baseURL);await openBooks(page);
        if(mode!=='full')assert.match(await page.locator('#book-save-note').textContent(),/unavailable|could not be read/);await newBook(page,0,'trail');if(mode!=='damaged')assert.match(await page.locator('#book-save-note').textContent(),/unavailable/);await page.locator('#book-continue').click();await finish(page,LAB_CLEARS.counterweight);assert.match(await page.locator('#book-camp-kicker').textContent(),/CHAPTER 2/);assert.deepEqual(errors,[]);
        report({storage:mode,checks:'Book remains playable; failed or damaged saves are explained without a startup failure.'});
      } finally {await context.close();}
    }
    return results;
  } finally {await browser.close();}
}
