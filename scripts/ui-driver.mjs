// Navigate the public UI before operating controls that live in a library,
// notes tab, or menu. Browser checks still use normal visible clicks/taps.
export async function enterFirstTrail(page) {
  await page.locator('#adventure[data-view]').waitFor();
  if (await page.locator('#game-layout').isVisible()) return;
  if (await page.locator('#game-title-screen').isVisible()) {
    if (await page.locator('#title-play').isVisible()) await page.locator('#title-play').click();
    await page.locator('#front-story').click();
  } else if (!await page.locator('#trail-picker').isVisible()) await page.locator('#library-story').click();
  await page.locator('[data-stage="trail-1"]').click();
  await page.locator('#adventure[data-view="play"]').waitFor();
}
async function prepareControl(page, selector) {
  const target = page.locator(selector);
  await page.locator('#loading-note[hidden]').waitFor({ state: 'attached' });
  if (await page.locator('#game-title-screen').isVisible()) {
    if (selector === '#mode-create') {
      if (!await page.locator('#title-mapmaker').isVisible()) await page.locator('#front-back').click();
      await page.locator('#title-mapmaker').click();
    } else {
      const location = await target.evaluate(el => ({ library: Boolean(el.closest('#adventure-library')), hub: el.closest('#guild-hub') ? 'guild' : el.closest('#expedition-hub') ? 'expeditions' : 'story' }));
      if (location.library) {
        if (await page.locator('#title-play').isVisible()) await page.locator('#title-play').click();
        await page.locator(`#front-${location.hub}`).click();
      } else if (await page.locator('#title-continue').isVisible()) await page.locator('#title-continue').click();
      else await enterFirstTrail(page);
    }
  }
  if (await page.locator('#game-notes-dialog').isVisible() && !await target.evaluate(el => Boolean(el.closest('#game-notes-dialog')))) await page.locator('#game-notes-close').click();
  if (await target.isVisible()) return;
  const location = await target.evaluate(el => ({
    library: Boolean(el.closest('#adventure-library')),
    hub: el.closest('#guild-hub') ? 'guild' : el.closest('#expedition-hub') ? 'expeditions' : null,
    chapter: el.closest('.atlas-chapter')?.id,
    notes: el.closest('.notes-panel')?.id,
    menu: Boolean(el.closest('#game-menu')),
    shortcut: Boolean(el.closest('.library-shortcuts')),
  }));
  if (location.library) {
    if (!await page.locator('#adventure-library').isVisible()) await page.locator('#game-choose').click();
    if (location.hub) await page.locator(`#library-${location.hub}`).click();
    if (location.shortcut && !await target.isVisible()) await page.locator('.library-shortcuts summary').click();
    if (location.chapter) {
      await page.locator('#library-story').click();
      const index = await page.locator('.atlas-chapter').evaluateAll((els, id) => els.findIndex(el => el.id === id), location.chapter);
      await page.locator('.atlas-nav button').nth(index).click();
    }
  } else if (location.notes) {
    if (await page.locator('#adventure-library').isVisible()) {
      if (await page.locator('#library-resume').isVisible()) await page.locator('#library-resume').click();
      else await enterFirstTrail(page);
    }
    if (await page.locator('#game-notes-button').isVisible()) await page.locator('#game-notes-button').click();
    await page.locator(`#notes-tab-${location.notes.slice(6)}`).click();
  } else {
    if (await page.locator('#adventure-library').isVisible()) {
      if (await page.locator('#library-resume').isVisible()) await page.locator('#library-resume').click();
      else await enterFirstTrail(page);
    }
    if (location.menu && !await target.isVisible()) await page.locator('#game-menu summary').click();
  }
}
export async function clickControl(page, selector, touch = false) {
  const browsing = await page.locator('#adventure-library').isVisible();
  const tab = browsing ? await page.locator('.adventure-library-tabs [aria-pressed="true"]').getAttribute('id') : null;
  await prepareControl(page, selector);
  await page.locator(selector)[touch ? 'tap' : 'click']();
  if (selector === '#mode-play' && await page.locator('#game-title-screen').isVisible() && await page.locator('#title-continue').isVisible()) await page.locator('#title-continue').click();
  if (selector === '#forget-habits') {
    if (await page.locator('#game-notes-dialog').isVisible()) await page.locator('#game-notes-close').click();
    if (browsing) { await page.locator('#game-choose').click(); await page.locator(`#${tab}`).click(); }
    else await page.locator('#adventure-canvas').focus();
  }
}
export async function selectControl(page, selector, value) {
  await prepareControl(page, selector); await page.locator(selector).selectOption(value);
}
