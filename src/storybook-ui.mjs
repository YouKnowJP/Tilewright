import {confirmGame} from './game-confirm.mjs';
import {loadBookBookmarks,saveBookBookmarks,upsertBookBookmark,bookmarkId} from './storybook-bookmarks.mjs';
import { normalizeBook, normalizeBookDraft, chooseBookRoute, bookKey, serializeBook, parseBook, beginBook, bookStage, chooseChapter, finishChapter, chapterChallenges, challengeProgress, bookScore, bookHonors, loadBooks, saveBooks, recordBook, MAX_BOOK_BYTES } from './storybook-model.mjs';
import { SAGA_BOOKS } from './saga-worlds.mjs';
import { rememberTrail } from './trail-memories.mjs';
import { featuredBooks } from './storybook-worlds.mjs';
import { adventureKey } from './workshop-model.mjs';
import { drawWorkshopWorld,drawParcelworksCover } from './workshop-art.mjs';

export function createStorybookUI({ storage, getWorlds, getDraft, onPlay, onResume, canResume=()=>false, onReplace }) {
  const $ = id => document.getElementById(`book-${id}`), books = featuredBooks(), state = loadBooks(storage);
  const archive=loadBookBookmarks(storage);const newer=state.session&&archive.entries.find(item=>bookmarkId(item)===bookmarkId(state.session)&&(item.bookmarkRevision||0)>(state.session.bookmarkRevision||0));if(newer)state.session=newer;let bookmarks=archive.entries,page=0,archivedSession=state.session,bookmarkDirty=false;
  let failed = state.unavailable || state.damaged || archive.damaged || archive.unavailable, selected = 'wander', composing = false, sources = [];
  const notice = (message, error = false) => { $('notice').textContent = message; $('notice').dataset.error = String(error); };
  const guard = fn => { try { const result=fn();if(result?.catch)result.catch(error=>notice(error.message,true));return result; } catch (error) { notice(error.message, true); return null; } };
  function persist() { let bookmarksSaved=true;if(state.session!==archivedSession||bookmarkDirty){if(state.session){const previous=bookmarks.find(item=>bookmarkId(item)===bookmarkId(state.session));state.session={...state.session,bookmarkRevision:Math.max(state.session.bookmarkRevision||0,previous?.bookmarkRevision||0)+1};}bookmarks=upsertBookBookmark(bookmarks,state.session);bookmarksSaved=saveBookBookmarks(storage,bookmarks);if(bookmarksSaved){archivedSession=state.session;bookmarkDirty=false;}}const activeSaved=saveBooks(storage,state);failed=!activeSaved||!bookmarksSaved;saveNote();return !failed; }
  function saveNote() { $('save-note').textContent = failed ? 'Browser saving is unavailable or a saved section could not be read. Keep this tab open and download your book to keep its worlds.' : 'Every story keeps its completed chapters and choices. Continue trail restores the latest in-chapter position; older books reopen at their chapter bookmark. Full game backups include your story bookmarks.'; }
  function download(book) { const blob = new Blob([serializeBook(book)], { type: 'application/json' }), url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = (book.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50) || 'journey') + '.storybook.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notice('Storybook prepared for download. Send the file to a friend; they can import it in Storybooks.'); }
  async function replaceDraft(book) {
    if (state.draft.chapters.length && !await confirmGame('Replace your storybook draft? Download it first if you want to keep it. Your world studio draft and active story stay safe.',{title:'Make a new version?',accept:'Replace draft'})) return;
    state.draft = normalizeBookDraft(book); composing = true; persist(); render();$('title').focus({preventScroll:true}); notice('Your book is ready to edit. Its worlds are independent snapshots.');
  }
  async function startBook(book, difficulty = $('rules').value, restart=false) {
    const id=`${bookKey(book)}-${difficulty}`,saved=[...bookmarks,state.session].filter(Boolean).findLast(item=>bookmarkId(item)===id);
    if(restart&&saved&&!await confirmGame('Start this book again? Its completed chapters, choices and any matching Continue trail on these rules will be replaced. Other story bookmarks stay safe.',{title:'Turn back to page one?',accept:'Start again'}))return;
    const archived=upsertBookBookmark(bookmarks,state.session),next=!restart&&saved?saved:beginBook(book,difficulty);
    upsertBookBookmark(archived,next); // Capacity check before changing the active story.
    if(restart)onReplace?.(bookKey(book),difficulty);
    bookmarks=archived;state.session=next;selected='wander';composing=false;persist();render();$('camp-heading').focus({preventScroll:true});window.scrollTo(0,0);
  }
  function button(label, fn, cls = '') { const element = document.createElement('button'); element.textContent = label;element.tabIndex=0; element.onclick = () => guard(fn); if (cls) element.className = cls; return element; }
  function paragraph(value, cls = '') { const element = document.createElement('p'); element.textContent = value; element.className = cls; return element; }
  function heading(value, tag = 'h4') { return Object.assign(document.createElement(tag), { textContent: value }); }
  const shelf=document.createElement('div');shelf.className='book-shelf';shelf.innerHTML='<label>Bookshelf<select id="book-shelf-filter"><option value="all">All stories</option><option value="new">New adventures · 18 levels</option><option value="clockwork">Clockwork companions · new</option><option value="peaceful">Peaceful stories</option><option value="challenge">More challenge</option></select></label><label>Find a story<input id="book-search" type="search" placeholder="Title, keeper, or idea"></label><p id="book-shelf-count" role="status"></p>';$('covers').insertAdjacentElement('beforebegin',shelf);$('shelf-filter').onchange=()=>{page=0;renderCovers();};$('search').oninput=()=>{page=0;renderCovers();};
  const pager=document.createElement('nav');pager.className='shelf-pager';pager.setAttribute('aria-label','Storybook pages');const previous=button('Previous stories',()=>{page--;renderCovers();$('shelf-filter').focus();}),next=button('Next stories',()=>{page++;renderCovers();$('shelf-filter').focus();}),pageNote=document.createElement('span');previous.id='book-page-previous';next.id='book-page-next';pageNote.id='book-page-note';pageNote.setAttribute('role','status');pager.append(previous,pageNote,next);$('covers').after(pager);
  const savedStories=document.createElement('details');savedStories.id='book-bookmarks';savedStories.className='book-saved-stories';const summary=document.createElement('summary');summary.textContent='Your story bookmarks';const bookmarkList=document.createElement('div');savedStories.append(summary,bookmarkList);shelf.before(savedStories);
  function renderCovers() {
    const selection=$('shelf-filter').value,query=$('search').value.trim().toLowerCase(),newTitles=new Set(SAGA_BOOKS.map(b=>b.title));
    const match=book=>{const threats=book.chapters.some(c=>c.world.markers.some(m=>['patrol','hunter','watcher','ember','vault'].includes(m.kind)));return (selection==='all'||selection==='new'&&newTitles.has(book.title)||selection==='clockwork'&&book.chapters.some(c=>c.world.markers.some(m=>m.kind==='clockwork'))||selection==='peaceful'&&!threats||selection==='challenge'&&(threats||book.chapters.some(c=>c.world.markers.some(m=>m.kind==='clockwork'&&(m.rewrites||m.dockLocked)))))&&`${book.title} ${book.synopsis} ${book.chapters.map(c=>c.passage).join(" ")}`.toLowerCase().includes(query);};const found=books.filter(match);page=Math.max(0,Math.min(page,Math.max(0,Math.ceil(found.length/4)-1)));previous.disabled=page===0;next.disabled=(page+1)*4>=found.length;pageNote.textContent=found.length?`Page ${page+1} / ${Math.ceil(found.length/4)}`:'No matching stories';pager.hidden=found.length<=4;renderBookmarks();$('shelf-count').textContent=`${found.length} stories · ${found.reduce((n,b)=>n+b.chapters.length,0)} chapters`;
    $('covers').replaceChildren(...books.map((book,index)=>({book,index,original:book.chapters.every(chapter=>['Storybook original','Lost Cartographer original','Clockwork Post original','Pocket Orchestra original','Brassbound Atlas original','Parcelworks original'].includes(chapter.world.source))})).filter(item=>match(item.book)).sort((a,b)=>Number(b.book.title==='Pip and the Midnight Parcelworks')-Number(a.book.title==='Pip and the Midnight Parcelworks')||Number(b.book.title==='Pip and the Brassbound Atlas')-Number(a.book.title==='Pip and the Brassbound Atlas')||Number(b.book.title==='Pip and the Pocket Orchestra')-Number(a.book.title==='Pip and the Pocket Orchestra')||Number(b.book.title==='The Clockwork Post')-Number(a.book.title==='The Clockwork Post')||Number(b.book.title==='The Welcome Lanterns')-Number(a.book.title==='The Welcome Lanterns')||Number(b.book.chapters.some(page=>page.routes))-Number(a.book.chapters.some(page=>page.routes))||Number(b.original)-Number(a.original)).slice(page*4,page*4+4).map(({book,index,original}) => {
      const card = document.createElement('article'), art = document.createElement('canvas'), copy = document.createElement('div'), actions = document.createElement('div');
      card.className = `book-cover book-cover-${index}`; card.dataset.bookCover = String(index);if(book.title==='The Lanternfair Letters')card.dataset.festivalBook='true';if(book.title==='The Welcome Lanterns')card.dataset.peacefulBook='true'; art.setAttribute('aria-hidden', 'true'); if(book.chapters[0].world.source==='Parcelworks original'){card.classList.add('book-cover-parcelworks');drawParcelworksCover(art);}else drawWorkshopWorld(art, book.chapters[0].world, { thumbnail: true }); copy.className = 'book-cover-copy'; actions.className = 'book-actions';
      const id=`${bookKey(book)}-${$('rules').value}`,saved=[...bookmarks,state.session].filter(Boolean).findLast(item=>bookmarkId(item)===id);const best = state.records[id];
      const about=document.createElement('details'),aboutTitle=document.createElement('summary');about.className='book-about';aboutTitle.textContent='About this story';aboutTitle.tabIndex=0;about.append(aboutTitle,paragraph(book.synopsis));
      const peaceful=!book.chapters.some(c=>c.world.markers.some(m=>['hunter','patrol','watcher','ember','vault'].includes(m.kind))),robot=book.chapters.some(c=>c.world.markers.some(m=>m.kind==='clockwork'));
      copy.append(paragraph(`${original?'ORIGINAL STORY':String(index + 1).padStart(2, '0')} / ${book.chapters.length} CHAPTERS`, 'title-kicker'), heading(book.title),about,paragraph(best?`Best on ${$('rules').value}: ${best.honors} honors · ${best.score} points`:robot?'Programmable companion · no enemies':peaceful?'PEACEFUL STORY · no enemies, no timed hazards.':book.chapters.some(c=>c.routes)?'Branching roads · alternate endings':'Puzzles & exploration · optional challenges','ws-footnote'));

      actions.append(button(saved&&saved.phase!=='won'?`Continue · ${saved.phase==='choice'?'Choose a road':'Chapter '+(saved.chapter+1)}`:'Read this book', () => startBook(book,$('rules').value,saved?.phase==='won'), 'front-primary'), button('Make your version', () => replaceDraft(book)));if(saved&&saved.phase!=='won')actions.append(button('Start again',()=>startBook(book,$('rules').value,true))); copy.append(actions); card.append(art, copy); return card;
    }));
  }
  function renderBookmarks(){
    const all=state.session?[...bookmarks.filter(item=>bookmarkId(item)!==bookmarkId(state.session)),state.session]:bookmarks;savedStories.querySelector('summary').textContent=`Your story bookmarks · ${all.length}/32`;
    bookmarkList.replaceChildren(...[...all].reverse().map(session=>{const row=document.createElement('article'),label=document.createElement('p');label.textContent=`${session.book.title} · ${session.difficulty} · ${session.receipts.length} chapters restored${session.phase==='won'?' · Complete':''}`;row.append(label,button('Open bookmark',()=>startBook(session.book,session.difficulty)));if(!state.session||bookmarkId(session)!==bookmarkId(state.session))row.append(button('Remove bookmark',async()=>{if(!await confirmGame('Remove this story bookmark? Its saved chapters, choices and any matching Continue trail will be forgotten. Download a full game backup first to keep them.',{title:'Remove story bookmark?',accept:'Remove bookmark'}))return;onReplace?.(bookKey(session.book),session.difficulty);bookmarks=bookmarks.filter(item=>bookmarkId(item)!==bookmarkId(session));bookmarkDirty=true;persist();render();savedStories.querySelector('summary').focus({preventScroll:true});}));return row;}));
    if(!all.length)bookmarkList.textContent='Start a story to keep its place here. Each journey has its own bookmarks.';
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
    $('routes').replaceChildren(...(crossroads ? chapter.routes : []).map(route => { const element=button('',()=>{state.session=chooseBookRoute(state.session,route.id);state.records=recordBook(state.records,state.session);selected='wander';persist();render();$('camp-heading').focus({preventScroll:true});window.scrollTo(0,0);});element.dataset.bookRoute=route.id;element.append(heading(route.label,'strong'),paragraph(route.description));return element; }));
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
  $('clear').onclick = async () => { if (!state.draft.chapters.length || await confirmGame('Clear your storybook draft? Download it first if you want to keep it. Your active story and individual worlds stay safe.',{title:'Clear the writing desk?',accept:'Clear draft'})) { state.draft = normalizeBookDraft({chapters:[]}); persist(); renderBuilder(); } };
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
      const meta=run.stage.workshop?.storybook;if(meta&&(!state.session||bookKey(state.session.book)!==meta.key||state.session.difficulty!==run.difficulty)){const saved=bookmarks.find(item=>bookKey(item.book)===meta.key&&item.difficulty===run.difficulty&&item.phase==='playing');if(saved){bookmarks=upsertBookBookmark(bookmarks,state.session);state.session=saved;persist();}}
      const expected=state.session?.phase==='playing'?bookStage(state.session):null;
      if(!expected||run.difficulty!==state.session.difficulty||expected.workshop.key!==run.stage.workshop.key||JSON.stringify(expected.workshop.storybook)!==JSON.stringify(run.stage.workshop.storybook))throw Error('This saved chapter belongs to an earlier storybook. Open Storybooks to continue your current book.');
      return {kind:'book',world:state.session.book.chapters[state.session.chapter].world,meta:expected.workshop.storybook};
    },
    get failed() { return failed; },
    status(run) { if (!run.stage.workshop?.storybook) return null; const meta = run.stage.workshop.storybook, challenge = challengeProgress(run,meta.challenge); return { ...challenge, label: `${meta.title} · ${meta.page?'Page '+meta.page+' / branching story':'Chapter '+(meta.chapter+1)+'/'+meta.length}`, saved: !failed }; },
    recordWin(run) { return guard(() => { state.session = finishChapter(state.session,run); state.records = recordBook(state.records,state.session); if(state.session.phase==='won'&&state.session.book.title==='The Keeper’s Promise'){const route=state.session.receipts.find(receipt=>receipt.route)?.route;if(route)rememberTrail(storage,[route]);} persist(); const progress = challengeProgress(run,run.stage.workshop.storybook.challenge); return progress.bonus ? progress.earned ? `${progress.name}: honor earned. +150 points.` : `${progress.name}: another route to try. Your story continues.` : 'Another chapter of your story, restored.'; }) || 'This chapter belongs to an earlier book. Return to Storybooks to continue your active story.'; },
  };
}
