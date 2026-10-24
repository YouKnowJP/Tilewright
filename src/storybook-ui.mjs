import { normalizeBook, normalizeBookDraft, chooseBookRoute, bookKey, serializeBook, parseBook, beginBook, bookStage, chooseChapter, finishChapter, chapterChallenges, challengeProgress, bookScore, bookHonors, loadBooks, saveBooks, recordBook, MAX_BOOK_BYTES } from './storybook-model.mjs';
import { rememberTrail } from './trail-memories.mjs';
import { featuredBooks } from './storybook-worlds.mjs';
import { adventureKey } from './workshop-model.mjs';
import { drawWorkshopWorld } from './workshop-art.mjs';

export function createStorybookUI({ storage, getWorlds, getDraft, onPlay, onResume, canResume=()=>false, onReplace }) {
  const $ = id => document.getElementById(`book-${id}`), books = featuredBooks(), state = loadBooks(storage);
  let failed = state.unavailable || state.damaged, selected = 'wander', composing = false, sources = [];
  const notice = (message, error = false) => { $('notice').textContent = message; $('notice').dataset.error = String(error); };
  const guard = fn => { try { return fn(); } catch (error) { notice(error.message, true); return null; } };
  function persist() { failed = !saveBooks(storage, state); saveNote(); return !failed; }
  function saveNote() { $('save-note').textContent = failed ? 'Browser saving is unavailable or a saved section could not be read. Keep this tab open and download your book to keep its worlds.' : 'Chapters save at camp. Reloading restarts the open chapter. Worlds, Workshop drafts, and other game modes keep their own saves.'; }
  function download(book) { const blob = new Blob([serializeBook(book)], { type: 'application/json' }), url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = (book.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50) || 'journey') + '.storybook.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notice('Storybook prepared for download. Send the file to a friend; they can import it in Storybooks.'); }
  function replaceDraft(book) {
    if (state.draft.chapters.length && !confirm('Replace your storybook draft? Download it first if you want to keep it. Your world studio draft and active story stay safe.')) return;
    state.draft = normalizeBookDraft(book); composing = true; persist(); render(); notice('Your book is ready to edit. Its worlds are independent snapshots.');
  }
  function startBook(book, difficulty = $('rules').value) {
    if (state.session && state.session.phase !== 'won' && !confirm('Start a new storybook? This replaces your active book checkpoint. Your saved worlds and storybook draft stay safe.')) return;
    const next=beginBook(book,difficulty);if(state.session)onReplace?.(bookKey(state.session.book));state.session=next; selected = 'wander'; composing = false; persist(); render(); $('camp-heading').focus({ preventScroll: true });
  }
  function button(label, fn, cls = '') { const element = document.createElement('button'); element.textContent = label; element.onclick = () => guard(fn); if (cls) element.className = cls; return element; }
  function paragraph(value, cls = '') { const element = document.createElement('p'); element.textContent = value; element.className = cls; return element; }
  function heading(value, tag = 'h4') { return Object.assign(document.createElement(tag), { textContent: value }); }
  function renderCovers() {
    $('covers').replaceChildren(...books.map((book,index)=>({book,index,original:book.chapters.every(chapter=>chapter.world.source==='Storybook original')})).sort((a,b)=>Number(b.book.title==='The Welcome Lanterns')-Number(a.book.title==='The Welcome Lanterns')||Number(b.book.chapters.some(page=>page.routes))-Number(a.book.chapters.some(page=>page.routes))||Number(b.original)-Number(a.original)).map(({book,index,original}) => {
      const card = document.createElement('article'), art = document.createElement('canvas'), copy = document.createElement('div'), actions = document.createElement('div');
      card.className = `book-cover book-cover-${index}`; card.dataset.bookCover = String(index);if(book.title==='The Welcome Lanterns')card.dataset.peacefulBook='true'; art.setAttribute('aria-hidden', 'true'); drawWorkshopWorld(art, book.chapters[0].world, { thumbnail: true }); copy.className = 'book-cover-copy'; actions.className = 'book-actions';
      const best = state.records[`${bookKey(book)}-${$('rules').value}`];
      copy.append(paragraph(`${original?'NEW STORY':String(index + 1).padStart(2, '0')} / ${book.chapters.length}${original?' ORIGINAL':''} CHAPTERS`, 'title-kicker'), heading(book.title), paragraph(book.synopsis), paragraph(best ? `Best on ${$('rules').value}: ${best.honors} honors · ${best.score} points` : book.title==='The Welcome Lanterns'?'PEACEFUL STORY · no enemies, no timed hazards.':original ? 'New maps, keeper stories, and optional paths to explore.' : 'Puzzle Lab worlds woven into a longer journey.', 'ws-footnote'));
      actions.append(button('Read this book', () => startBook(book), 'front-primary'), button('Make your version', () => replaceDraft(book))); copy.append(actions); card.append(art, copy); return card;
    }));
  }
  function renderCamp() {
    const session = state.session; $('camp').hidden = !session; if (!session) return;
    const branching=session.book.chapters.some(page=>page.routes);
    const done = session.phase === 'won', crossroads = session.phase === 'choice', chapter = session.book.chapters[session.chapter];
    $('camp-kicker').textContent = done ? 'THE LAST PAGE, TURNED' : crossroads ? 'TWO ROADS / YOUR PROMISE' : branching ? `PAGE ${session.receipts.length+1} / ${session.difficulty.toUpperCase()}` : `CHAPTER ${session.chapter + 1} OF ${session.book.chapters.length} / ${session.difficulty.toUpperCase()}`;
    $('camp-heading').textContent = session.book.title;
    $('chapter-title').textContent = done ? 'Every journey leaves a little light.' : crossroads ? 'Which promise will you carry?' : chapter.world.title;
    $('passage').textContent = done ? session.ending || session.book.ending || 'The road is brighter for your footsteps. Close this book, or follow a different challenge through it again.' : crossroads ? chapter.world.ending || chapter.passage : chapter.passage || chapter.world.intro;
    drawWorkshopWorld($('camp-art'), (chapter || session.book.chapters.at(-1)).world, { thumbnail: true });
    $('tally').textContent = `${session.receipts.length} ${session.receipts.length===1?'chapter':'chapters'} restored${session.book.chapters.some(page=>page.routes)?' · Branching story':' / '+session.book.chapters.length} · ${bookHonors(session)} ${bookHonors(session)===1?'honor':'honors'} · ${bookScore(session)} points`;
    $('routes').hidden = !crossroads;
    $('routes').replaceChildren(...(crossroads ? chapter.routes : []).map(route => { const element=button('',()=>{state.session=chooseBookRoute(state.session,route.id);state.records=recordBook(state.records,state.session);selected='wander';persist();render();$('camp-heading').focus({preventScroll:true});});element.dataset.bookRoute=route.id;element.append(heading(route.label,'strong'),paragraph(route.description));return element; }));
    $('challenge-panel').hidden = session.phase !== 'interlude';
    if (session.phase === 'interlude') {
      const offers = chapterChallenges(bookStage(session), session.difficulty); if (!offers.some(offer => offer.id === selected)) selected = 'wander';
      $('challenges').replaceChildren(...offers.map(offer => {
        const element = button('', () => { selected = offer.id; renderCamp(); }); element.dataset.bookChallenge = offer.id; element.setAttribute('aria-pressed', String(selected === offer.id));
        element.append(heading(offer.name, 'strong'), paragraph(offer.description), paragraph(offer.bonus ? 'Optional honor · +150 points' : 'A relaxed chapter', 'book-reward')); return element;
      }));
    }
    const resumable=session.phase==='playing'&&canResume(bookStage(session),session.difficulty);
    $('continue').hidden = done || crossroads; $('continue').textContent = session.phase === 'playing' ? `${resumable?'Resume':'Restart'} ${branching?'page':'chapter'} ${branching?session.receipts.length+1:session.chapter + 1}` : `Enter ${branching?'page':'chapter'} ${branching?session.receipts.length+1:session.chapter + 1}`;
    $('checkpoint-note').textContent = crossroads ? 'Your completed chapter is saved. Choose a road to change the next chapter and the ending. You can read the other route on another journey.' : done ? 'Your full-book best is recorded for this book version and rule set. Follow another road or try different chapter challenges on your next reading.' : resumable?'Resume chapter returns to your current position and choices. The board shows whether browser saving is available.':session.phase === 'playing' ? 'This chapter is underway, but another adventure has the active Continue slot. Restart this chapter to begin it again; completed chapters remain saved.' : 'Choose one optional challenge. It never blocks the story. Supplies and hunter habits start fresh in each chapter.';
    $('receipts').replaceChildren(...session.receipts.map((receipt, index) => {
      const chapter = session.book.chapters[receipt.chapter], offer = chapterChallenges({ ...bookStage({ ...session, phase: 'interlude', chapter: receipt.chapter }) }, session.difficulty).find(item => item.id === receipt.challenge);
      const page=document.createElement('details'),summary=document.createElement('summary');page.className='book-restored-page';
      summary.textContent=`${index + 1}. ${chapter.world.title} · ${receipt.turns} turns · ${receipt.score} points`;
      if(receipt.route)summary.textContent+=' · '+chapter.routes.find(route=>route.id===receipt.route).label;
      page.append(summary,paragraph(chapter.passage||chapter.world.intro,'book-page-story'),paragraph(chapter.world.ending||'Another light restored.','book-page-story'),paragraph(receipt.challenge === 'wander' ? 'Story followed' : `${offer.name}: ${receipt.earned ? 'honor earned' : 'another route to try'}`));return page;
    }));
    $('receipts-details').hidden = !session.receipts.length;
  }
  function draftFields() { for (const name of ['title','author','synopsis','ending']) state.draft[name] = $(name).value; persist(); }
  function renderRoadEditor(body,chapter,index) {
    const fold=document.createElement('details'); fold.className='book-road-editor'; const summary=document.createElement('summary');summary.textContent='Road after this chapter';fold.append(summary);
    const field=(caption,control)=>{const label=document.createElement('label');label.textContent=caption;label.append(control);fold.append(label);return control;};
    const mode=document.createElement('select');mode.setAttribute('aria-label',`Road after chapter ${index+1}`);mode.append(new Option('In order','auto'),new Option('Jump to a later chapter','jump'),new Option('Two player choices','choice'),...(index>0?[new Option('Finish with an ending','end')]:[]));mode.value=chapter.routes?'choice':chapter.next==='end'?'end':chapter.next!==undefined?'jump':'auto';field('How does the story continue?',mode);
    const destinations=()=>[...state.draft.chapters.map((page,i)=>({i,name:`${i+1}. ${page.world.title}`})).filter(item=>item.i>index).map(item=>new Option(item.name,String(item.i))),...(index>0?[new Option('The ending','end')]:[])];
    const save=(patch,redraw=false)=>guard(()=>{const next={...chapter};delete next.routes;delete next.next;delete next.ending;if(patch.routes&&chapter.ending!==undefined)next.ending=chapter.ending;Object.assign(next,patch);state.draft=normalizeBookDraft({...state.draft,chapters:state.draft.chapters.map((page,i)=>i===index?next:page)});chapter=state.draft.chapters[index];persist();if(redraw){renderBuilder();const road=document.querySelector(`[data-book-chapter="${index}"] .book-road-editor`);road.open=true;road.querySelector('summary').focus({preventScroll:true});}});
    mode.onchange=()=>{if(mode.value==='auto')save({},true);else if(mode.value==='end')save({next:'end',ending:chapter.ending||''},true);else {const options=destinations();if(!options.length){notice('Add a later chapter before creating this road.',true);mode.value='auto';return;}const target=value=>value==='end'?'end':Number(value);if(mode.value==='jump')save({next:target(options[0].value)},true);else save({routes:[{id:'first-road',label:'Take the first road',description:'',target:target(options[0].value)},{id:'second-road',label:'Take the other road',description:'',target:target((options[1]||options[0]).value)}]},true);}};
    if(chapter.next!==undefined&&chapter.next!=='end'){const select=document.createElement('select');select.append(...destinations());select.value=String(chapter.next);field('Continue at',select);select.onchange=()=>save({next:select.value==='end'?'end':Number(select.value)},true);}
    if(chapter.next==='end'){const ending=document.createElement('textarea');ending.rows=3;ending.maxLength=800;ending.value=chapter.ending||'';field('This road’s ending (optional)',ending);ending.onchange=()=>save({next:'end',ending:ending.value});}
    for(const [r,route] of (chapter.routes||[]).entries()){
      const label=document.createElement('input');label.maxLength=80;label.value=route.label;field(`Choice ${r+1}`,label);
      const description=document.createElement('input');description.maxLength=240;description.value=route.description;field('What will this choice change?',description);
      const target=document.createElement('select');target.append(...destinations());target.value=String(route.target);field(`Choice ${r+1} leads to`,target);
      const ending=document.createElement('textarea');ending.rows=2;ending.maxLength=800;ending.value=route.ending||'';if(route.target==='end')field('Ending for this choice',ending);
      const change=(redraw=false)=>save({routes:chapter.routes.map((item,i)=>i===r?{...item,label:label.value,description:description.value,target:target.value==='end'?'end':Number(target.value),...(target.value==='end'?{ending:ending.value}:{})}:item)},redraw);
      label.onchange=description.onchange=ending.onchange=()=>change();target.onchange=()=>change(true);
    }
    body.append(fold);
  }
  function renderBuilder() {
    for (const name of ['title','author','synopsis','ending']) $(name).value = state.draft[name];
    const keys = new Set(); sources = getWorlds().filter(pack => { const key = adventureKey(pack); if (keys.has(key)) return false; keys.add(key); return true; });
    $('world').replaceChildren(new Option('Current world studio draft', 'draft'), ...sources.map((pack, index) => new Option(pack.title, String(index))));
    $('add').disabled = state.draft.chapters.length >= 6;
    $('chapter-count').textContent = `${state.draft.chapters.length}/6 chapters · two needed to play`;
    $('chapters').replaceChildren(...state.draft.chapters.map((chapter, index) => {
      const row = document.createElement('article'), art = document.createElement('canvas'), body = document.createElement('div'), actions = document.createElement('div'), label = document.createElement('label'), passage = document.createElement('textarea');
      row.className = 'book-chapter'; row.dataset.bookChapter = String(index); art.setAttribute('aria-hidden','true'); drawWorkshopWorld(art,chapter.world,{thumbnail:true}); body.append(paragraph(`CHAPTER ${index + 1}`, 'title-kicker'), heading(chapter.world.title));
      label.textContent = 'Story before this chapter'; passage.value = chapter.passage; passage.maxLength = 800; passage.rows = 3; passage.oninput = () => { state.draft.chapters[index].passage = passage.value; persist(); }; label.append(passage); body.append(label); renderRoadEditor(body,chapter,index); actions.className = 'book-actions';
      for (const [name, delta] of [['Earlier',-1],['Later',1]]) { const move = button(name, () => { if(state.draft.chapters.some(page=>page.routes||page.next!==undefined))throw Error('Set chapter roads to In order before rearranging this book.'); const next = index + delta; [state.draft.chapters[index], state.draft.chapters[next]] = [state.draft.chapters[next], state.draft.chapters[index]]; persist(); renderBuilder(); }); move.disabled = index + delta < 0 || index + delta >= state.draft.chapters.length; move.setAttribute('aria-label', `Move chapter ${index + 1} ${name.toLowerCase()}`); actions.append(move); }
      actions.append(button('Remove', () => { if(state.draft.chapters.some(page=>page.routes||page.next!==undefined))throw Error('Set chapter roads to In order before removing a chapter.'); state.draft.chapters.splice(index,1); persist(); renderBuilder(); })); body.append(actions); row.append(art,body); return row;
    }));
    $('draft-play').disabled = $('draft-download').disabled = state.draft.chapters.length < 2;
  }
  function render() { document.getElementById('ws-books').dataset.phase=state.session?.phase||'library';document.getElementById('ws-books').dataset.reading = String(Boolean(state.session && !composing)); $('library').hidden = composing; $('builder').hidden = !composing; renderCovers(); renderCamp(); renderBuilder(); $('more-books').open = !state.session; saveNote(); }
  for (const name of ['title','author','synopsis','ending']) $(name).oninput = draftFields;
  $('compose').onclick = () => { composing = true; render(); $('title').focus(); };
  $('back').onclick = () => { composing = false; render(); $(state.session ? 'camp-heading' : 'heading').focus({preventScroll:true}); };
  $('rules').onchange = renderCovers;
  $('add').onclick = () => guard(() => {
    if (state.draft.chapters.length >= 6) throw Error('A storybook holds up to six chapters.');
    const world = $('world').value === 'draft' ? getDraft() : sources[Number($('world').value)];
    state.draft = normalizeBookDraft({ ...state.draft, chapters: [...state.draft.chapters, { world, passage: '' }] }); persist(); renderBuilder(); notice('World added as an independent snapshot. Write its opening scene, then put your chapters in order.');
  });
  $('clear').onclick = () => { if (!state.draft.chapters.length || confirm('Clear your storybook draft? Download it first if you want to keep it. Your active story and individual worlds stay safe.')) { state.draft = normalizeBookDraft({chapters:[]}); persist(); renderBuilder(); } };
  $('draft-play').onclick = () => guard(() => startBook(normalizeBook(state.draft), $('draft-rules').value));
  $('draft-download').onclick = () => guard(() => download(normalizeBook(state.draft)));
  $('active-download').onclick = () => guard(() => download(state.session.book));
  $('active-remix').onclick = () => guard(() => replaceDraft(state.session.book));
  $('continue').onclick = () => guard(() => {
    if(state.session.phase==='playing'&&canResume(bookStage(state.session),state.session.difficulty)){onResume();return;}
    if(state.session.phase==='choice')return;
    if (state.session.phase === 'interlude') state.session = chooseChapter(state.session,selected);
    persist(); onPlay(bookStage(state.session),state.session.difficulty);
  });
  $('import').onclick = () => { $('file').value = ''; $('file').click(); };
  $('file').onchange = async () => { const file = $('file').files[0]; if (!file) return; try { if (file.size > MAX_BOOK_BYTES) throw Error('Choose a storybook smaller than 1.6 MB.'); const book = parseBook(await file.text()); replaceDraft(book); } catch (error) { notice(error.message,true); } };
  saveNote();
  return {
    show() { render(); },
    runSource(run){
      const expected=state.session?.phase==='playing'?bookStage(state.session):null;
      if(!expected||run.difficulty!==state.session.difficulty||expected.workshop.key!==run.stage.workshop.key||JSON.stringify(expected.workshop.storybook)!==JSON.stringify(run.stage.workshop.storybook))throw Error('This saved chapter belongs to an earlier storybook. Open Storybooks to continue your current book.');
      return {kind:'book',world:state.session.book.chapters[state.session.chapter].world,meta:expected.workshop.storybook};
    },
    get failed() { return failed; },
    status(run) { if (!run.stage.workshop?.storybook) return null; const meta = run.stage.workshop.storybook, challenge = challengeProgress(run,meta.challenge); return { ...challenge, label: `${meta.title} · ${meta.page?'Page '+meta.page+' / branching story':'Chapter '+(meta.chapter+1)+'/'+meta.length}`, saved: !failed }; },
    recordWin(run) { return guard(() => { state.session = finishChapter(state.session,run); state.records = recordBook(state.records,state.session); if(state.session.phase==='won'&&state.session.book.title==='The Keeper’s Promise'){const route=state.session.receipts.find(receipt=>receipt.route)?.route;if(route)rememberTrail(storage,[route]);} persist(); const progress = challengeProgress(run,run.stage.workshop.storybook.challenge); return progress.bonus ? progress.earned ? `${progress.name}: honor earned. +150 points.` : `${progress.name}: another route to try. Your story continues.` : 'Another chapter of your story, restored.'; }) || 'This chapter belongs to an earlier book. Return to Storybooks to continue your active story.'; },
  };
}
