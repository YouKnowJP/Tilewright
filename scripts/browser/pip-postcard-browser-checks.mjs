import assert from 'node:assert/strict';
import {chooseOption, waitForGameReady} from './ui-driver.mjs';

const openingWeek = new Date('2026-11-23T12:00:00Z');
const nextWeek = new Date('2026-11-30T00:00:00Z');
const dawn = 'postcard-before-dawn';
const jade = 'postcard-dash-of-jade';
const brass = 'postcard-brass-shortcut';

export async function pipPostcardScenarios(scenario) {
  for (const width of [390, 1440]) {
    await scenario(`pip-weekly-postcards-${width}`, width, async page => {
      const press = selector => page.locator(selector)[width < 500 ? 'tap' : 'click']();
      const board = page.locator('#pip-postcards');
      const featured = board.locator('#postcards-featured');
      const archive = board.locator('#postcards-archive');
      const status = page.locator('#ps-status');
      const cardButton = id => `[data-postcard="${id}"]`;
      const card = id => board.locator('.postcard-card').filter({has: page.locator(cardButton(id))});
      const start = async id => {
        await press(cardButton(id));
        await page.locator('#pip-studio[open]').waitFor();
        assert.equal(await board.isVisible(), false);
        assert.equal(await page.locator('#ps-tab-share').isVisible(), false);
      };
      const setCards = async (actor, changes) => {
        await press('[data-ps-jump=programs]');
        await press('#ps-actor-' + actor);
        for (const [index, command] of changes) await chooseOption(page, `#ps-card-${actor}-${index}`, command);
      };
      const play = async (ticks, stamp) => {
        await press('#ps-test-route');
        for (let tick = 0; tick < ticks; tick++) await press('#ps-step');
        const result = await status.textContent();
        assert.match(result, new RegExp(`^Tick ${ticks}/240 · Adventure complete!`));
        assert.equal(result.includes('Postage stamp earned'), stamp);
        assert.equal(await page.locator('#ps-next-story').isVisible(), false);
        await press('#ps-return-postcards');
        await board.waitFor();
      };

      await page.clock.setFixedTime(openingWeek);
      await press('#title-postcards');
      assert.equal(await featured.locator(cardButton(dawn)).count(), 1);
      assert.equal(await archive.locator('[data-postcard]').count(), 2);

      if (width < 500) {
        await page.setViewportSize({width: 320, height: 568});
        assert.ok(await board.evaluate(node => node.scrollWidth <= node.clientWidth + 1));
        for (const button of await board.locator('button').all()) assert.ok((await button.boundingBox()).height >= 44);
        await page.setViewportSize({width, height: 844});
      }

      await start(dawn);
      await setCards('pip', [[2, 'wait']]);
      await setCards('sprout', [[0, 'right']]);
      await play(15, false);
      assert.match(await card(dawn).innerText(), /Cleared · Best 15 ticks/);
      assert.doesNotMatch(await card(dawn).innerText(), /Stamp earned/);
      await page.waitForFunction(id => document.activeElement?.dataset.postcard === id, dawn);

      await start(dawn);
      assert.equal(await page.locator('#ps-card-pip-2').inputValue(), 'wait');
      await setCards('pip', [[2, 'right']]);
      await setCards('sprout', [[0, 'wait'], [1, 'right']]);
      await play(9, true);
      await start(jade);
      await setCards('pip', [[0, 'use'], [2, 'right']]);
      await play(9, true);
      await start(brass);
      await setCards('sprout', [[0, 'down']]);
      await play(11, true);

      await press('#postcards-close');
      await page.waitForFunction(() => document.activeElement?.id === 'title-postcards');
      await page.clock.setFixedTime(nextWeek);
      await page.reload();
      await waitForGameReady(page);
      await press('#title-postcards');
      assert.equal(await featured.locator(cardButton(jade)).count(), 1);
      assert.equal(await archive.locator(cardButton(dawn)).count(), 1);
      assert.equal(await board.getByText('Stamp earned', {exact: true}).count(), 3);
      await start(dawn);
      assert.equal(await page.locator('#ps-card-pip-2').inputValue(), 'right');
      await page.keyboard.press('Escape');
      await board.waitFor();
      await page.waitForFunction(id => document.activeElement?.dataset.postcard === id, dawn);
      await press('#postcards-close');
      await press('#title-pip');
      assert.match(await page.locator('#ph-progress').textContent(), /^0\/101 /);
      assert.equal(await page.locator('#ph-continue').isVisible(), false);
      await press('#ph-next');
      assert.equal(await page.locator('#ps-tab-share').isVisible(), true);
      assert.equal(await page.locator('#ps-title').textContent(), 'A Letter for Two');
    });
  }
}
