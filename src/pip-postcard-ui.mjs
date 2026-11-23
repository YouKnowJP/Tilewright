// New owned material. See LICENSE; prior MIT permissions remain effective.
import {PIP_POSTCARDS, featuredPostcard, postcardProgress} from './pip-postcards.mjs';

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

export function createPipPostcardBoard({opener, getJournal, getSaveIssue, onPlay}) {
  const dialog = document.createElement('dialog');
  dialog.id = 'pip-postcards';
  dialog.className = 'front-dialog pip-home pip-postcards';
  dialog.setAttribute('aria-labelledby', 'postcards-title');
  dialog.innerHTML = `
    <div class="front-dialog-heading">
      <h2 id="postcards-title">Pip’s Weekly Postcard</h2>
      <button id="postcards-close" data-controller-back>Main menu</button>
    </div>
    <p>Take a short delivery puzzle. The featured postcard changes every Monday (UTC).</p>
    <p id="postcards-save-warning" class="ps-notice" role="status" hidden></p>
    <section aria-labelledby="postcards-featured-title">
      <h3 id="postcards-featured-title">This week’s postcard</h3>
      <div id="postcards-featured"></div>
    </section>
    <section aria-labelledby="postcards-archive-title">
      <h3 id="postcards-archive-title">Postcard archive</h3>
      <p>Catch up or replay a favorite anytime.</p>
      <div id="postcards-archive" class="ph-cards"></div>
    </section>`;
  document.body.append(dialog);

  const close = dialog.querySelector('#postcards-close');
  close.onclick = () => dialog.close();
  dialog.addEventListener('close', () => {
    if (!dialog.open && !document.querySelector('dialog[open]')) opener.focus({preventScroll: true});
  });

  function renderCard(puzzle, journal, featured) {
    const progress = postcardProgress(puzzle, journal);
    const card = element('article', '', 'ph-card postcard-card');
    const title = element('h4', puzzle.title);
    const stamp = element('p', progress.stamped ? 'Stamp earned' : `Stamp goal · ${puzzle.stampTicks} ticks or fewer`, 'postcard-stamp');
    stamp.classList.toggle('postcard-stamp-earned', progress.stamped);
    const timing = progress.best === null ? puzzle.minutes : `Cleared · Best ${progress.best} ticks`;
    const play = element('button', progress.saved ? 'Open saved cards' : 'Start postcard', featured ? 'front-primary' : '');
    play.dataset.postcard = puzzle.id;
    play.setAttribute('aria-label', `${play.textContent} · ${puzzle.title}`);
    play.onclick = () => {
      dialog.close();
      onPlay(puzzle.id, opener);
    };
    card.append(title, element('p', puzzle.story), element('p', timing, 'postcard-time'), stamp, play);
    return card;
  }

  function open(selectedId = null) {
    const journal = getJournal();
    const featured = featuredPostcard();
    const archive = PIP_POSTCARDS.filter(puzzle => puzzle !== featured);
    dialog.querySelector('#postcards-featured').replaceChildren(renderCard(featured, journal, true));
    dialog.querySelector('#postcards-archive').replaceChildren(...archive.map(puzzle => renderCard(puzzle, journal, false)));
    const warning = dialog.querySelector('#postcards-save-warning');
    warning.textContent = getSaveIssue();
    warning.hidden = !warning.textContent;
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    const selected = selectedId && [...dialog.querySelectorAll('[data-postcard]')].find(button => button.dataset.postcard === selectedId);
    if (selected) {
      selected.scrollIntoView({block: 'nearest'});
      selected.focus({preventScroll: true});
    } else {
      close.focus({preventScroll: true});
    }
  }

  return {open, close: () => dialog.close(), get openNow() { return dialog.open; }};
}
