import assert from 'node:assert/strict';
import { LAB_ROOMS, transformAdventure } from '../src/workshop-lab.mjs';
import { LAB_CLEARS } from '../src/workshop-lab-clears.mjs';
import { playGuild } from './guild-browser-checks.mjs';
import { chooseOption, clickControl } from './ui-driver.mjs';
import { blankAdventure, placeObject } from '../src/workshop-model.mjs';

const draftKey = 'tilewright.workshop.draft.v1', bestKey = 'tilewright.workshop.bests.v1';
const draft = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), draftKey);
const saves = page => page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort()));
async function lab(page) { await page.locator('#title-workshop').click(); await page.locator('#ws-tab-lab').click(); }
async function selectRoom(page,id) { await page.locator(`[data-lab-collection="${LAB_ROOMS.find(room=>room.id===id).afterhours?'afterhours':'foundations'}"]`).click(); if(await page.locator('#ws-lab-room-picker-control').isVisible())await chooseOption(page,'#ws-lab-room-picker',id);else await page.locator(`[data-lab-room="${id}"]`).click(); }
async function playRoom(page, id, difficulty, actions = LAB_CLEARS[id]) {
  await selectRoom(page,id); await page.locator('#ws-lab-play').click(); await page.locator('#ws-preview-dialog').waitFor();
  assert.match(await page.locator('#ws-preview-clear').textContent(), /verified/);
  await chooseOption(page,'#ws-preview-difficulty',difficulty); await page.locator('#ws-preview-play').click();
  await playGuild(page, actions); assert.equal(await page.locator('#adventure').getAttribute('data-status'), 'won');
  assert.equal(await page.locator('#game-primary').textContent(), 'Back to Puzzle Lab');
  await page.locator('#game-primary').click(); await page.locator('#ws-lab').waitFor();
}
async function cursorTo(page, x, y) {
  await page.locator('#ws-inspect-tool').click(); await page.locator('#ws-canvas').focus();
  const [oldX, oldY] = (await page.locator('#ws-position').textContent()).split(',').map(Number);
  for (const [delta, positive, negative] of [[x + 1 - oldX, 'ArrowRight', 'ArrowLeft'], [y + 1 - oldY, 'ArrowDown', 'ArrowUp']]) for (let i = 0; i < Math.abs(delta); i++) await page.keyboard.press(delta > 0 ? positive : negative);
}
export async function checkLongWorld(browser, baseURL) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  try {
    const world = placeObject(blankAdventure(64, 8), 'start', 62, 4);
    await context.addInitScript(pack => localStorage.setItem('tilewright.workshop.draft.v1', JSON.stringify(pack)), world);
    const page = await context.newPage(); await page.goto(baseURL); await page.locator('#title-workshop').click(); await page.locator('#ws-tab-build').click();
    await page.locator('#ws-remix-tools').click(); await page.locator('[data-ws-transform="rotate"]').click();
    assert.deepEqual([(await draft(page)).map.width, (await draft(page)).map.height], [8, 64]);
    await page.locator('#ws-undo').click();
    const [x, y] = (await page.locator('#ws-position').textContent()).split(',').map(Number); assert.ok(x >= 1 && x <= 64 && y >= 1 && y <= 8);
    await page.locator('#ws-redo').click(); const again = await draft(page); assert.equal(again.map.width, 8); assert.equal(again.map.height, 64);
    return { checks: 'A 64×8 world rotates to 8×64; Undo/Redo retain bounded cursor coordinates and the full map.' };
  } finally { await context.close(); }
}
export async function checkPuzzleLab(browserType, { baseURL = 'http://127.0.0.1:4174', channel = 'chrome', desktop = true, fullRooms = true, widths = [320, 390, 768, 1024, 1440, 844], screenshots = false, onProgress = () => {} } = {}) {
  const browser = await browserType.launch({ headless: true, channel }), results = [];
  try {
    if (desktop) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
      try {
        const page = await context.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('response', r => { if (r.status() >= 400) errors.push(r.url()); });
        await page.goto(baseURL); await lab(page); const original = await saves(page);
        for (const room of LAB_ROOMS) await selectRoom(page,room.id);
        await page.locator('.ws-spark summary').click(); await page.locator('#ws-spark-seed').fill('lantern-boat'); await page.locator('#ws-spark-form button[type="submit"]').click();
        const spark = await page.locator('#ws-spark-title').textContent(); await page.locator('#ws-spark-next').click();
        await page.locator('#ws-spark-seed').fill('lantern-boat'); await page.locator('#ws-spark-form button[type="submit"]').click(); assert.equal(await page.locator('#ws-spark-title').textContent(), spark);
        assert.equal(await saves(page), original, 'Browsing rooms and ideas must not alter saves.');
        if (screenshots) await page.screenshot({ path: '.playwright-mcp/puzzle-lab-1440.png', fullPage: true });
        if (fullRooms) for (const room of LAB_ROOMS) for (const difficulty of ['trail', 'nemesis']) {
          await playRoom(page, room.id, difficulty); assert.match(await page.locator('#ws-lab-progress').textContent(), new RegExp(difficulty));
          const result = { room: room.title, difficulty, checks: 'Native complete win, verified proof preview, saved best, return to Puzzle Lab' }; results.push(result); onProgress(result);
        }
        await playRoom(page, 'footstep', 'trail', ['up', 'up', 'up', 'right', 'right', 'down', 'down', 'right', 'down', 'right', 'right', 'right', 'down', 'down']);
        const supplies = LAB_CLEARS.tidekeeper.map(action => action === 'choose:route' ? 'choose:shield' : action); supplies.splice(supplies.indexOf('close-dialogue') + 1, 0, 'interact:ferry');
        await playRoom(page, 'tidekeeper', 'trail', supplies);
        await page.locator('[data-lab-collection="foundations"]').click(); await page.locator('[data-lab-room="counterweight"]').click(); await page.locator('#ws-lab-remix').click(); await page.locator('#ws-build').waitFor();
        await page.locator('#ws-test').click(); await playGuild(page, LAB_CLEARS.counterweight); await page.locator('#game-primary').click();
        const baseline = await draft(page); assert.ok(baseline.proof);
        for (const operation of ['rotate', 'mirror-x', 'mirror-y']) {
          await page.locator('#ws-remix-tools').click(); await page.locator(`[data-ws-transform="${operation}"]`).click();
          const transformed = await draft(page), expected = transformAdventure(baseline, operation); assert.deepEqual(transformed.map, expected.map); assert.deepEqual(transformed.markers, expected.markers); assert.equal(transformed.proof, undefined);
          const mapping = operation === 'rotate' ? { up: 'right', right: 'down', down: 'left', left: 'up' } : operation === 'mirror-x' ? { left: 'right', right: 'left' } : { up: 'down', down: 'up' };
          await page.locator('#ws-test').click(); await playGuild(page, LAB_CLEARS.counterweight.map(action => mapping[action] || action)); assert.equal(await page.locator('#adventure').getAttribute('data-status'), 'won'); await page.locator('#game-primary').click();
          await page.locator('#ws-undo').click(); assert.deepEqual(await draft(page), baseline);
          await page.locator('#ws-redo').click(); assert.deepEqual((await draft(page)).map, expected.map); await page.locator('#ws-undo').click();
        }
        await cursorTo(page, 0, 0); await page.locator('#ws-remix-tools').click(); await page.locator('#ws-practice').click(); assert.match(await page.locator('#ws-remix-note').textContent(), /open, walkable/); await page.locator('#ws-remix-close').click();
        await cursorTo(page, 5, 5); const beforePractice = await saves(page);
        await page.locator('#ws-remix-tools').click(); if (screenshots) await page.screenshot({ path: '.playwright-mcp/remix-tools-1440.png' }); await page.locator('#ws-practice').click();
        assert.match(await page.locator('#game-region').textContent(), /Practice run/); assert.match(await page.locator('#adventure-canvas').getAttribute('aria-label'), /Column 6, row 6/);
        await clickControl(page, '#game-restart'); assert.match(await page.locator('#game-region').textContent(), /Practice run/);
        await playGuild(page, ['up', 'left', 'left', 'left', 'down', ...LAB_CLEARS.counterweight]);
        assert.equal(await page.locator('#adventure').getAttribute('data-status'), 'won'); assert.match(await page.locator('#game-result-text').textContent(), /Bests and creator clears are unchanged/); assert.equal(await page.locator('#game-stars').isVisible(), false);
        await page.locator('#game-primary').click(); assert.equal(await saves(page), beforePractice); assert.deepEqual(await draft(page), baseline);
        await page.locator('#ws-test').click(); await playGuild(page, LAB_CLEARS.counterweight); assert.match(await page.locator('#game-result-text').textContent(), /Creator clear recorded/); assert.equal(await page.locator('#game-stars').isVisible(), true);
        assert.deepEqual(errors, []); results.push({ checks: 'Two alternate solutions; all transforms win through native input; Undo/Redo retain original proof; blocked cursor feedback; cursor practice and restart never alter bests/draft; later full Playtest records normally.' });
      } finally { await context.close(); }
    }
    for (const width of widths) {
      const context = await browser.newContext({ viewport: { width, height: width === 844 ? 390 : 900 }, hasTouch: true, reducedMotion: 'reduce' });
      try {
        const page = await context.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
        await page.goto(baseURL); await lab(page); assert.equal(await page.locator('[data-lab-room]').count(), 12);
        for (const room of LAB_ROOMS) await selectRoom(page,room.id);
        if (screenshots && width === 390) await page.screenshot({ path: '.playwright-mcp/puzzle-lab-390.png', fullPage: true });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
        await selectRoom(page,'counterweight'); await page.locator('#ws-lab-remix').tap(); await cursorTo(page, 2, 5);
        await page.locator('#ws-remix-tools').tap(); await page.locator('[data-ws-transform="rotate"]').tap(); assert.equal((await draft(page)).map.width, 10); await page.locator('#ws-undo').tap();
        await page.locator('#ws-test').tap(); await playGuild(page, LAB_CLEARS.counterweight, true); assert.equal(await page.locator('#adventure').getAttribute('data-status'), 'won'); await page.locator('#game-primary').tap();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width); assert.deepEqual(errors, []);
        const result = { width, checks: 'Twelve-room navigation in two collections, responsive preview, touch remix/rotate/undo, actual touch playtest win, retained editor return, no horizontal overflow' }; results.push(result); onProgress(result);
      } finally { await context.close(); }
    }
    results.push(await checkLongWorld(browser, baseURL));
    return { browser: browser.version(), results };
  } finally { await browser.close(); }
}
