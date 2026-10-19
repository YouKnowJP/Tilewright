// Navigate the public UI before operating controls that live in a library,
// notes tab, or menu. Browser checks still use normal visible clicks/taps.
async function prepareControl(page, selector) {
  const target = page.locator(selector);
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
    if (await page.locator('#adventure-library').isVisible()) await page.locator('#library-resume').click();
    if (await page.locator('#game-notes-button').isVisible()) await page.locator('#game-notes-button').click();
    await page.locator(`#notes-tab-${location.notes.slice(6)}`).click();
  } else {
    if (await page.locator('#adventure-library').isVisible()) await page.locator('#library-resume').click();
    if (location.menu && !await target.isVisible()) await page.locator('#game-menu summary').click();
  }
}
export async function clickControl(page, selector, touch = false) {
  const browsing = await page.locator('#adventure-library').isVisible();
  const tab = browsing ? await page.locator('.adventure-library-tabs [aria-pressed="true"]').getAttribute('id') : null;
  await prepareControl(page, selector);
  await page.locator(selector)[touch ? 'tap' : 'click']();
  if (selector === '#forget-habits') {
    if (await page.locator('#game-notes-dialog').isVisible()) await page.locator('#game-notes-close').click();
    if (browsing) { await page.locator('#game-choose').click(); await page.locator(`#${tab}`).click(); }
    else await page.locator('#adventure-canvas').focus();
  }
}
export async function selectControl(page, selector, value) {
  await prepareControl(page, selector); await page.locator(selector).selectOption(value);
}
