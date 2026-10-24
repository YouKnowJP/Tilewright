// Navigate the public UI before operating controls that live in a library,
// notes tab, or menu. Browser checks still use normal visible clicks/taps.
export async function enterFirstTrail(page) {
  await page.locator('#adventure[data-view]').waitFor();
  if (await page.locator('#game-layout').isVisible()) return;
  if (await page.locator('#game-title-screen').isVisible()) {
    if (await page.locator('#front-journal').isVisible()) await page.locator('#journal-back').click();
    if (await page.locator('#title-play').isVisible()) await page.locator('#title-play').click();
    await page.locator('#front-story').click();
  } else if (!await page.locator('#trail-picker').isVisible()) await page.locator('#library-story').click();
  await page.locator('.atlas-nav button').first().click(); await page.locator('[data-stage="trail-1"]').click();
  await page.locator('#adventure[data-view="play"]').waitFor();
}
async function prepareControl(page, selector) {
  const original=page.locator(selector);
  const select=await original.evaluate(el=>el.matches('select.game-select-source')?el.id:null);
  const target=select?page.locator(`[data-game-select="${select}"]`):original;
  await page.locator('#loading-note[hidden]').waitFor({ state: 'attached' });
  if (await page.locator('#editor').isVisible()) { await revealEditorControl(page,target); if(await target.isVisible())return; }
  if (selector === '#mode-create' && !await page.locator('#editor').isVisible()) {
    if (await page.locator('#game-layout').isVisible()) await page.locator('#game-home').click();
    else if (await page.locator('#adventure-library').isVisible()) await page.locator('#library-title').click();
  }
  if (await page.locator('#game-title-screen').isVisible()) {
    if (selector === '#mode-create') {
      if (!await page.locator('#title-mapmaker').isVisible()) await page.locator(await page.locator('#front-journal').isVisible() ? '#journal-back' : '#front-back').click();
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
  await prepareControl(page, selector); await chooseOption(page,selector,value);
}

// Creator panels are separate dialogs on compact screens. Open them using
// their visible controls before filling a field or choosing a palette item.
export async function closeEditorPanels(page) {
  for(const [dialog,button]of [['#maker-palette-dialog','#maker-palette-close'],['#maker-settings-dialog','#maker-settings-close']])if(await page.locator(dialog).isVisible())await page.locator(button).click();
}
export async function revealEditorControl(page,target) {
  const location=await target.evaluate(el=>({panel:el.closest('.palette-panel')?'palette':el.closest('.inspector')?'settings':null,dialog:el.closest('dialog')?.id}));
  if(location.dialog&&!['maker-palette-dialog','maker-settings-dialog'].includes(location.dialog))return;
  const panel=location.panel;
  if(panel){const dialog=page.locator(`#maker-${panel}-dialog`);if(await page.locator(`#maker-${panel}-button`).isVisible()&&!await dialog.isVisible()){await closeEditorPanels(page);await page.locator(`#maker-${panel}-button`).click();}}
  else await closeEditorPanels(page);
}
export async function editorButton(page,options) {
  const target=page.locator('#editor, #maker-palette-dialog, #maker-settings-dialog, dialog[open]').getByRole('button',{...options,includeHidden:true});
  await revealEditorControl(page,target);await page.getByRole('button',options).click();
}

export async function chooseOption(page,selector,choice) {
  const value=await page.locator(selector).evaluate((select,choice)=>{
    const option=[...select.options].find((option,index)=>typeof choice==='string'?option.value===choice:choice.label!==undefined?option.label===choice.label:choice.index!==undefined?index===choice.index:option.value===choice.value);
    if(!option)throw Error('No matching dropdown choice: '+JSON.stringify(choice));return option.value;
  },choice);
  const id=await page.locator(selector).getAttribute('id');
  await page.locator(`[data-game-select="${id}"]`).click();
  await page.locator(`.game-select-menu [role="option"][data-value=${JSON.stringify(value)}]`).click();
}
