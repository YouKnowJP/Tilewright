import assert from 'node:assert/strict';
import {newDuoProject} from '../../src/pip-duo.mjs';
import {CARD_DIAL_FINALE} from '../../src/pip-dial-finale.mjs';
import {tinkerCode} from '../../src/pip-tinker.mjs';
import {chooseOption,waitForGameReady} from './ui-driver.mjs';

export async function pipDialScenarios(scenario) {
  for(const width of [390,1440])await scenario(`pip-dial-finale-repair-and-clear-${width}`,width,async page=>{
    const mission=CARD_DIAL_FINALE,url=new URL(page.url());url.hash='pip='+tinkerCode(newDuoProject(mission.id));
    const press=selector=>page.locator(selector)[width<500?'tap':'click']();
    await page.goto(url.href);await waitForGameReady(page);await page.locator('#pip-studio[open]').waitFor();
    const canvas=page.locator('#ps-canvas'),rendered=new Map();
    const pixels=part=>canvas.evaluate((c,p)=>Array.from(c.getContext('2d').getImageData(p.x*50+8,p.y*50+10,30,20).data),part);
    for(const part of mission.solutionParts){
      const before=await pixels(part);
      await press('[data-ps-jump=build-tools]');await chooseOption(page,'#ps-brush','dial');await chooseOption(page,'#ps-dial-shift',part.shift);
      await press('[data-ps-jump=canvas]');
      const bounds=await canvas.boundingBox(),point={x:bounds.width*(part.x+.5)/mission.width,y:bounds.height*(part.y+.5)/mission.height};
      if(width<500)await page.touchscreen.tap(bounds.x+point.x,bounds.y+point.y);else await canvas.click({position:point});
      const after=await pixels(part);assert.notDeepEqual(after,before,'A placed Card Dial has a visible station body.');rendered.set(part.shift,after);
    }
    assert.notDeepEqual(rendered.get('skip'),rendered.get('rewind'),'Skip and Rewind dials have distinct artwork.');
    await press('[data-ps-jump=programs]');
    for(const [i,actor] of ['pip','sprout'].entries()){
      await press('#ps-actor-'+actor);
      for(const [index,card] of mission.solution[i].entries())await chooseOption(page,`#ps-card-${actor}-${index}`,card);
    }
    if(!await page.locator('#ps-test-options').evaluate(n=>n.open))await press('#ps-test-options > summary');
    await chooseOption(page,'#ps-speed','quick');await press('#ps-test');await press('#ps-run');
    await page.locator('#ps-status').filter({hasText:'Adventure complete!'}).waitFor({timeout:20000});
    assert.match(await page.locator('#ps-status').textContent(),/^Tick 90\/240/);
    assert.match(await page.locator('#ps-duo-goals').textContent(),/Letters 6\/6.*timed power silent.*home P home, S home/);
    const savedURL=new URL(page.url());savedURL.hash='';await page.goto(savedURL.href);await waitForGameReady(page);
    await press('#title-pip');await press('#ph-filters > summary');await page.locator('#ph-search').fill(mission.title);
    await press('[data-ph-mission=duo-dial-finale]');
    assert.match(await page.locator('#ps-best').textContent(),/90 ticks/);
    assert.match(await page.locator('#ps-budget').textContent(),/4\/4 placed/);
  });
  for (const width of [390,1440]) {
    await scenario(`pip-dial-blueprint-next-card-${width}`,width,async page => {
      const project = {...newDuoProject(),programs:[['up','right','down'],['wait','up','left']]};
      const url = new URL(page.url());
      url.hash = 'pip=' + tinkerCode(project);
      const click = selector => width < 500 ? page.locator(selector).tap() : page.locator(selector).click();
      const preview = () => page.locator('#ps-bp-dial-result').textContent();
      const status = () => page.locator('#ps-status').textContent();
      const pip = () => page.locator('#ps-map-list p').nth(0).textContent();
      const sprout = () => page.locator('#ps-map-list p').nth(1).textContent();
      const select = (id,value) => chooseOption(page,'#ps-' + id,value);
      const open = async id => {
        if (await page.locator(id).getAttribute('open') === null) await click(id + ' > summary');
      };

      await page.goto(url.href);
      await waitForGameReady(page);
      await click('#ps-tab-build');

      let firstFootprint;
      for (const wraps of [true,false]) {
        const piece = {
          format:'pip-duo-blueprint',version:19,name:'Two Card Dials',width:5,height:2,
          road:[{x:0,y:0},{x:4,y:0},{x:1,y:1},{x:3,y:1}],
          parts:[
            {kind:'dial',x:0,y:0,shift:wraps?'skip':'rewind'},
            {kind:'dial',x:4,y:0,shift:wraps?'rewind':'skip'},
            {kind:'source',x:1,y:1,channel:'amber'},
            {kind:'receiver',x:3,y:1,channel:'amber'},
          ],
        };
        await open('#ps-blueprints');
        await page.locator('#ps-bp-file').setInputFiles({
          name:'two-card-dials.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(piece)),
        });
        await page.locator('#ps-notice').filter({hasText:'Blueprint opened for preview'}).waitFor();
        const footprint=await page.locator('#ps-bp-preview').evaluate(c=>c.toDataURL());
        if(wraps)firstFootprint=footprint;
        else assert.notEqual(footprint,firstFootprint,'Blueprint symbols distinguish Skip and Rewind settings.');
        await open('#ps-bp-dials');
        await select('bp-dial-next','2');
        assert.equal(await preview(),wraps?'Skip ahead. Next to run is Card 1 · North ↑.':'Rewind one. Next to run is Card 2 · East →.');
        await select('bp-dial-station','1');
        await select('bp-dial-courier','1');
        await select('bp-dial-next','0');
        assert.equal(await preview(),wraps?'Rewind one. Next to run is Card 3 · West ←.':'Skip ahead. Next to run is Card 2 · North ↑.');
        assert.ok(await page.locator('#pip-studio').evaluate(n => n.scrollWidth <= n.clientWidth + 1));

        await open('#ps-map-text');
        await select('cursor-x','2');
        await select('cursor-y','2');
        await click('#ps-go-tile');
        await click('#ps-bp-place');
        assert.match(await page.locator('#ps-notice').textContent(),/Blueprint placed/);
        await click('#ps-test');
        await click('#ps-step');
        await click('#ps-step');
        assert.match(await status(),wraps?/Pip: Card Dial · Skip ahead · card 3 → 1 · North/:/Pip: Card Dial · Rewind one · card 3 → 2 · East/);
        await click('#ps-step');
        assert.match(await pip(),wraps?/column 3, row 2/:/column 4, row 3/);
        assert.match(await status(),wraps?/Sprout: Card Dial · Rewind one · card 1 → 3 · West/:/Sprout: Card Dial · Skip ahead · card 1 → 2 · North/);
        await click('#ps-step');
        assert.match(await sprout(),wraps?/column 6, row 3/:/column 7, row 2/);
        await click('#ps-test');
        await click('#ps-undo');
      }
    });
  }
}
