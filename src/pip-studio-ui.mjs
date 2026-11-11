// New owned material. See LICENSE; prior MIT permissions remain effective.
import {createCardDialEditor} from './pip-card-dial-ui.mjs';
import {cardDialDescription} from './pip-card-dial.mjs';
import {createTurnstileEditor} from './pip-turnstile-ui.mjs';
import {turnstileDescription} from './pip-turnstile.mjs';
import {rendezvousDescription} from './pip-rendezvous.mjs';
import {RAIL_DIRECTIONS,railDescription} from './pip-rails.mjs';
import {createRailEditor} from './pip-rail-editor.mjs';
import {counterDescription} from './pip-counters.mjs';
import {createCounterEditor} from './pip-counter-editor.mjs';
import {vaneDescription} from './pip-vanes.mjs';
import {createVaneEditor} from './pip-vane-editor.mjs';
import {restDescription} from './pip-rests.mjs';
import {createRestEditor} from './pip-rest-editor.mjs';
import {drumDescription} from './pip-drums.mjs';
import {createDrumEditor} from './pip-drum-editor.mjs';
import {weaveDescription} from './pip-weaves.mjs';
import {createWeaveEditor} from './pip-weave-editor.mjs';
import {TINKER_LIMIT,tinkerDefinition,tinkerCatalogue,newTinkerProject,normalizeTinkerProject,editTinkerProject,placeTinkerPart,startTinker,tinkerStep,tinkerParts,tinkerPoweredChannels,kilnPowerChannels,weavePowerChannels,drumPowerChannels,tinkerStateKey,tinkerHint,solvedTinkerProject,clearTinkerProject,tinkerMetrics,serializeTinkerProject,parseTinkerProject,tinkerCode,parseTinkerCode,tinkerPlayLink,compileTinkerAdventure,keepTinkerResult} from './pip-tinker.mjs';
import {loadPipStudio as loadTinkerJournal,savePipStudio as saveTinkerJournal} from './pip-duo-storage.mjs';
import {kilnDescription} from './pip-kilns.mjs';
import {createKilnEditor} from './pip-kiln-editor.mjs';
import {mixerDescription} from './pip-mixers.mjs';
import {ECHO_OPERATIONS,echoDescription} from './pip-echoes.mjs';
import {createTideEditor} from './pip-tide-editor.mjs';
import {scaleMatches,scaleDescription} from './pip-scales.mjs';
import {tideOpen,tideDescription} from './pip-tides.mjs';
import {DUO_STORIES,DUO_CHANNELS,sealDescription,duoEditable,duoReadiness,paintDuoTerrain,moveDuoCompanion} from './pip-duo.mjs';
import {createPipRehearsal} from './pip-rehearsal-ui.mjs';
import {createPipHome} from './pip-home-ui.mjs';
import {createPipPractice} from './pip-practice-ui.mjs';
import {PIP_OPENING_GUIDES} from './pip-staged-hints.mjs';
import {describeBlueprintRoute} from './pip-blueprint-cards.mjs';
import {pipCanvasCommand,pipCanvasHelp} from './pip-controls.mjs';
import {createPipCollections} from './pip-collections-ui.mjs';
import {createDuoTools} from './pip-duo-ui.mjs';
import {CLOCKWORK_LABELS,PRISM_OPERATIONS} from './clockwork.mjs';
import {PIP_PAINTS,PIP_ANTENNAE,PIP_SCARVES,loadPipLook,savePipLook,normalizePipLook} from './pip-look.mjs';
import {drawWorkshopObject} from './workshop-art.mjs';
import {serializeAdventure} from './workshop-sharing.mjs';
import {verifyAdventureProof} from './workshop-model.mjs';
import {confirmGame} from './game-confirm.mjs';
const names={dial:'Card Dial ⟳',turnstile:'Parcel Turnstile $',sync:'Rendezvous Post ↔',rail:'Switch Rail »',counter:'Footfall Counter O',vane:'Wind Vane F',rest:'Rest Stone R',drum:'Memory Drum D',weave:'Weave relay W',source:'Parcel well Q',receiver:'Delivery window N',kiln:'Recipe kiln I',mixer:'Mixing bowl Y',press:'Recipe press E',tube:'Courier tube U',prism:'Compass prism X',flip:'Route memory Z',handoff:'Handoff H',plate:'Pressure plate P',bridge:'Shared bridge B',locker:'Parcel locker K',cargo:'Cargo compass C',signal:'Signal stamp M',latch:'Lantern switch L',pulse:'Timed bell A',tide:'Tide beacon T',scale:'Cargo scale V',echo:'Echo stamp J',seal:'Parcel seal G','pip-dock':'Pip home P','sprout-dock':'Sprout home S'};
const kinds={dial:'pip-dial',turnstile:'pip-turnstile',sync:'pip-sync',rail:'pip-rail',counter:'pip-counter',vane:'pip-vane',rest:'pip-rest',drum:'pip-drum',weave:'pip-weave',source:'pip-parcel',receiver:'pip-socket',kiln:'pip-kiln',mixer:'pip-mixer',press:'pip-press',tube:'pip-tube',prism:'pip-prism',flip:'pip-flip',handoff:'partner',plate:'plate',bridge:'bridge',locker:'pip-locker',cargo:'pip-sorter',signal:'pip-router',latch:'pip-lantern-switch',pulse:'pip-pulse-bell',tide:'pip-tide',scale:'pip-scale',echo:'pip-echo',seal:'pip-seal','pip-dock':'pip-stop','sprout-dock':'pip-stop'};
const node=(tag,text='',className='')=>{const n=document.createElement(tag);n.textContent=text;n.className=className;return n;};
function spareLockerEvent(state,event){
 if(!PIP_OPENING_GUIDES[state.project.trialId]?.spareMail)return event;
 const courier=state.bots.find(bot=>event===bot.id+': Locker full; cargo kept');
 if(!courier)return event;
 const locker=tinkerParts(state.project).find(part=>part.kind==='locker'&&part.x===courier.x&&part.y===courier.y);
 return locker?`${courier.id}: Locker K${DUO_CHANNELS.indexOf(locker.channel)+1} full; ${courier.parcel} kept safely`:event;
}
function storyMilestone(before,after,homes,bridges){
 const handoffs=PIP_OPENING_GUIDES[after.project.trialId]?.tracker==='handoffs';
 const events=after.events.filter(event=>{
  const spareMail=PIP_OPENING_GUIDES[after.project.trialId]?.spareMail&&/: Locker full; cargo kept$/.test(event);
  if(!spareMail&&!/: (?:Passed parcel to |Stored parcel in locker$|Collected .+ from locker$|Delivered |Pressed |Cargo compass loaded |Traveled through the tube$|Signal loaded Powered$)/.test(event))return false;
  if(handoffs){
   const i=after.bots.findIndex(bot=>event===bot.id+': Cargo compass loaded Otherwise');
   if(i>=0&&!before.bots[i].program.some((card,index)=>card!==after.bots[i].program[index]))return false;
  }
  return true;
 }).map(event=>spareLockerEvent(after,event));
 if(bridges.length){
  const previousPower=tinkerPoweredChannels(before),nextPower=tinkerPoweredChannels(after);
  for(const channel of new Set(bridges.map(bridge=>bridge.channel))){
   if(previousPower.has(channel)!==nextPower.has(channel))events.push(`Bridge ${DUO_CHANNELS.indexOf(channel)+1} ${nextPower.has(channel)?'opens':'closes'} next turn`);
  }
  for(const bridge of bridges)for(const [i,courier] of after.bots.entries()){
   const previous=before.bots[i];
   if(courier.x===bridge.x&&courier.y===bridge.y&&(previous.x!==bridge.x||previous.y!==bridge.y))events.push(`${courier.id} entered Bridge ${DUO_CHANNELS.indexOf(bridge.channel)+1}`);
  }
 }
 for(const {kind,x,y} of homes){
  const i=kind==='pip-dock'?0:1;
  const courier=after.bots[i],previous=before.bots[i];
  if(courier.x===x&&courier.y===y&&(previous.x!==x||previous.y!==y))events.push(`${courier.id} reached the home flag`);
 }
 return events.join(' · ');
}
function describeTube(tile,parts){
 const partner=parts.find(part=>part.kind==='tube'&&part.channel===tile.channel&&part.id!==tile.id);
 const link=DUO_CHANNELS.indexOf(tile.channel)+1;
 return `Courier tube U${link} · ${tile.channel} link · ${partner?`paired with column ${partner.x+1}, row ${partner.y+1}`:'second end missing'}`;
}
function describeLocker(tile,state){
 const link=DUO_CHANNELS.indexOf(tile.channel)+1;
 const role={send:'Send only',take:'Collect only',both:'Send and collect'}[tile.mode??'both'];
 const stored=state.lockers?.[tile.channel];
 const contents=stored?`holding ${stored.parcel} from ${stored.by}`:'empty';
 return `Parcel locker K${link} · link ${tile.channel} · ${role} · ${contents}`;
}
export function createPipStudio({storage,getPreferences=()=>({}),onLook=()=>{},onHomeExit=()=>{}}){
 const loaded=loadTinkerJournal(storage),wardrobe=loadPipLook(storage);let journal=loaded.journal,look=wardrobe.look,project=journal.drafts['first-use']||newTinkerProject(),state=startTinker(project),mode='build',tab='build',cursor={x:1,y:3},history=[],edits=[],timer=null,auto=false,hintLevel=-1,opener=null,shareToken=0,duo=null,programActor=0,rehearsal=null,collections=null,home=null,practice=null,homeOrigin=false,requestHome=false,homeOpener=null,studioSaveFailed=loaded.failed;
 const dialog=node('dialog','','front-dialog pip-studio');dialog.id='pip-studio';dialog.setAttribute('aria-labelledby','pip-studio-title');
 dialog.innerHTML=`<div class="front-dialog-heading ps-heading"><div class="ps-heading-line"><p class="title-kicker">BUILD &amp; PLAY</p><div class="ps-actions"><button id="ps-home">Adventure home</button><button id="ps-close" data-controller-back>Back</button></div></div><nav class="ps-jump-nav" aria-label="Workbench shortcuts"><button data-ps-jump="canvas">Garden</button><button data-ps-jump="programs">Cards</button><button data-ps-jump="build-tools">Tools</button><button data-ps-jump="help">Hints</button></nav></div><h2 id="pip-studio-title">Pip’s workshop</h2>
 <nav class="ps-tabs" aria-label="Pip workshop sections">${[['build','Build & play'],['look','Dress Pip'],['gallery','Your inventions'],['share','Share & feedback']].map(([id,label])=>`<button id="ps-tab-${id}" data-ps-tab="${id}" aria-label="${id==='gallery'?'Display your inventions':label}" aria-pressed="${id==='build'}">${({build:"Play",look:"Dress",gallery:"Display",share:"Share"})[id]}</button>`).join('')}</nav>
 <p id="ps-notice" class="ps-notice" role="status"></p>
 <section id="ps-build"><details id="ps-chooser"><summary>Choose an invention · Learn / Trials / Duo adventures</summary><div class="ps-pickers"><label>Collection<select id="ps-collection"><option value="learn">Learn with Pip · 4 lessons</option><option value="trial">Tinkerer’s Trials · 4 challenges</option><option value="relay">Pip & Sprout · 2 prototypes</option><option value="adventures">Pip &amp; Sprout · 6 story missions</option><option value="night-mail">The Night Post · 6 harder missions</option><option value="dawn-workshop">Dawn Workshop · 4 mastery repairs</option><option value="canopy-fair">The Canopy Fair · 4 tower adventures</option><option value="after-hours">Canopy After Hours · 4 mastery repairs</option><option value="clocktower">The Clocktower Ledger · 4 timing repairs</option><option value="star-atlas">Star Atlas · 4 cartographer repairs</option><option value="lantern-workshop">Lantern Workshop · 4 switch adventures</option><option value="bellkeeper">The Bellkeeper · 4 timed adventures</option><option value="sealkeeper">The Sealkeepers · 4 passport adventures</option><option value="drum-house">The Drumkeepers · 4 memory-beat adventures</option><option value="weave-house">The Weavekeepers · 4 circuit adventures</option><option value="kiln-house">The Kilnkeepers · 4 powered-recipe adventures</option><option value="mixing-house">The Mixing House · 4 ingredient adventures</option><option value="echo-post">The Echo Post · 4 borrowed-route repairs</option><option value="balancekeeper">The Balancekeepers · 4 cargo-scale repairs</option><option value="tidekeeper">The Tidekeepers · 4 rhythm repairs</option><option value="rainwright">The Rainwrights · 4 storm adventures</option><option value="dial-finale">Card Dial finale</option><option value="create">Create a duo adventure</option></select></label><label>Adventure<select id="ps-trial"></select></label></div></details><div class="ps-brief"><p id="ps-kicker" class="title-kicker"></p><h3 id="ps-title" tabindex="-1"></h3><p id="ps-story"></p><p id="ps-best"></p></div>
 <div class="ps-workbench"><div class="ps-board"><canvas id="ps-canvas" width="450" height="350" tabindex="0" aria-label="Pip invention garden" aria-describedby="ps-map-help ps-inspect"></canvas><p id="ps-inspect" role="status"></p><div id="ps-selection-tools" class="ps-actions" hidden><button id="ps-edit-part">Edit this part</button><button id="ps-remove-part">Remove this part</button></div><details id="ps-map-text"><summary>Garden controls &amp; text view</summary><p id="ps-map-help" class="ws-footnote">Tap a tile to inspect or place your selected part. Keyboard: arrows move the cursor, Space places or inspects. Numbers on parcels also identify their colour.</p><div class="ps-pickers"><label>Column<select id="ps-cursor-x"></select></label><label>Row<select id="ps-cursor-y"></select></label></div><div class="ps-actions"><button id="ps-go-tile">Go to tile</button><button id="ps-place-tile">Place selected part</button></div><div id="ps-map-list"></div></details></div>
 <div class="ps-panel"><div class="ps-actions"><button id="ps-test" class="front-primary">Test invention</button><button id="ps-undo">Undo edit</button><button id="ps-reset">Reset test</button></div><p id="ps-status" class="ps-status" role="status"></p><div id="ps-run-tools" class="ps-actions" hidden><button id="ps-step">One tick</button><button id="ps-event">Next event</button><button id="ps-run">Run</button></div>
 <fieldset id="ps-build-tools"><legend id="ps-budget">Your parts tray</legend><label>Part<select id="ps-brush"></select></label><div id="ps-channel-fields"><label><span id="ps-channel-label">Parcel / signal colour</span><select id="ps-channel"></select></label></div><p id="ps-latch-note" hidden>Use L to toggle remembered power. Matching bridges and signals read it next tick. The light stays on until a courier uses any L of that numbered colour again.</p><div id="ps-seal-fields" hidden><label>Required cargo<select id="ps-seal-match">${[['all','Any hands'],['empty','Empty hands'],['any','Any parcel'],...DUO_CHANNELS.map((c,i)=>[c,(i+1)+' · '+c])].map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select></label><label>Courier badge<select id="ps-seal-courier"><option value="either">Either courier</option><option value="pip">Pip</option><option value="sprout">Sprout</option></select></label><label id="ps-seal-heading-field">Inspect couriers heading<select id="ps-seal-heading"><option value="all">Every direction</option><option value="up">North ↑</option><option value="right">East →</option><option value="down">South ↓</option><option value="left">West ←</option></select></label><p id="ps-seal-note">G checks entry automatically and keeps the parcel. Other directions pass without inspection. A courier already inside can leave freely.</p></div><div id="ps-pulse-fields" hidden><label>Powered ticks after ringing<select id="ps-duration">${[1,2,3,4,5,6].map(n=>`<option${n===3?' selected':''}>${n}</option>`).join('')}</select></label><p>Use A powers this numbered channel starting next tick. Ringing again extends the remaining time; a shorter bell never cuts a longer ring short. Cargo and cards stay as they are.</p><p id="ps-pulse-limit"></p></div><div id="ps-locker-fields"><label>Locker role<select id="ps-locker-mode"><option value="both">Send &amp; collect</option><option value="send">Send only</option><option value="take">Collect only</option></select></label><p>Matching locker numbers share one parcel slot. Use sends or collects. A relay counts when the other partner collects.</p></div><div id="ps-cargo-fields"><label>Match carried parcel<select id="ps-cargo-match"><option value="any">Any parcel</option><option value="amber">1 · Amber</option><option value="jade">2 · Jade</option><option value="violet">3 · Violet</option><option value="blue">4 · Blue</option></select></label></div><div id="ps-receiver-fields"><label>Parcels needed<select id="ps-parcels"><option>1</option><option>2</option><option>3</option></select></label></div><div id="ps-prism-fields"><label>Prism operation<select id="ps-operation"></select></label></div><div id="ps-echo-fields" hidden><label>Echo arrangement<select id="ps-echo-operation">${Object.entries(ECHO_OPERATIONS).map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select></label><p>Use J learns the other courier’s three cards from turn start, then starts at card 1. Cargo stays held. Copies do not depend on who acts first.</p></div><div id="ps-mixer-fields" hidden><label>First ingredient<select id="ps-mixer-first"></select></label><label>Second ingredient<select id="ps-mixer-second"></select></label><label>Blended parcel<select id="ps-mixer-output"></select></label><p>Use Y leaves the first ingredient in its own bowl. Add the other to carry the blend. Either order works. Wrong or repeated ingredients stay held; empty hands leave the bowl alone. Each bowl is independent.</p></div><div id="ps-press-fields"><label>Recipe input<select id="ps-input"></select></label><label>Recipe output<select id="ps-output"></select></label></div><div id="ps-flip-fields"><p>Each visit loads the next route and starts card 1. Cargo stays held.</p><div id="ps-bank-a"></div><div id="ps-bank-b"></div><label>First visit loads<select id="ps-first-route"><option value="a">Route A</option><option value="b">Route B</option></select></label></div><button id="ps-apply-part" hidden>Apply settings to this part</button></fieldset><div id="ps-actor-tabs" class="ps-actions" aria-label="Companion cards" hidden><button id="ps-actor-pip" aria-pressed="true">Pip’s cards</button><button id="ps-actor-sprout" aria-pressed="false">Sprout’s cards</button></div><div id="ps-programs"></div>
 <details id="ps-help"><summary>A little help from Tavi</summary><p id="ps-hint-stage" hidden></p><p id="ps-hint">Hints are optional. Try your own idea first.</p><div class="ps-actions"><button id="ps-nudge">Ask for a clue</button><button id="ps-hint-back" disabled>Previous clue</button><button id="ps-example" hidden>Try the worked example</button><button id="ps-practice">Try a tiny practice garden</button></div></details>
 <details id="ps-name-details"><summary>Name your invention</summary><p>Rename at the bench. A new name keeps a working clear.</p><label>Invention name<input id="ps-name" maxlength="48"></label><label>Creator name<input id="ps-author" maxlength="48"></label></details><p class="ws-footnote" id="ps-save-note"></p></div></div></section>
 <section id="ps-look" hidden><div class="ps-dressing"><canvas id="ps-portrait" width="240" height="180" aria-label="Pip appearance preview"></canvas><div><h3>A little more you.</h3><p>Paint, antenna and ribbon are always available. Your choices follow Pip into adventures. Sprout keeps a leaf antenna so the partners are easy to distinguish.</p><label>Paint<select id="ps-paint"></select></label><label>Antenna<select id="ps-antenna"></select></label><label>Ribbon<select id="ps-scarf"></select></label><p id="ps-look-note" role="status"></p></div></div></section>
 <section id="ps-gallery" hidden><h3>Small inventions. A place to keep them.</h3><p>Keep three working answers in your Trailhouse display. Reopen one to watch or remix it. Your fastest and smallest answers also stay with each challenge.</p><label>Display collection<select id="ps-gallery-family"><option value="1">Classic inventions</option><option value="2">Duo adventures</option></select></label><div id="ps-slots" class="ps-slots"></div></section>
 <section id="ps-share" hidden><h3>Send a friend a new road.</h3><p id="ps-share-note"></p><div class="ps-actions"><button id="ps-export">Download Pip project</button><button id="ps-copy">Copy project code</button><button id="ps-link">Copy play link</button><button id="ps-postcard">Download postcard</button><button id="ps-world">Download playable adventure</button></div><details id="ps-code-details"><summary>Read or copy the project code</summary><label>Project code<textarea id="ps-code" readonly rows="4"></textarea></label></details><details id="ps-import-details"><summary>Open a friend’s invention</summary><label>Pip code or link<textarea id="ps-import-code" maxlength="60000" rows="4"></textarea></label><div class="ps-actions"><button id="ps-import">Preview project</button><button id="ps-import-file">Choose Pip project file</button></div><input id="ps-file" type="file" accept=".json,application/json" hidden><p>Opening a project keeps your other challenge drafts. A working solution is verified before it can be replayed. Two-companion projects open here; ordinary adventure files use the main Workshop import.</p></details>
 <details id="ps-feedback"><summary>Help make the next invention better</summary><p>Your answers stay here until you copy or download them. Nothing is uploaded. Leave out personal information.</p><label>How did it feel?<select id="ps-feeling"><option value="just-right">Just right</option><option value="too-easy">Too easy</option><option value="too-hard">Too hard</option><option value="unclear">I didn’t understand the next step</option></select></label><label>What was most fun, confusing, or worth changing?<textarea id="ps-feedback-text" maxlength="400" rows="4"></textarea></label><button id="ps-feedback-save">Download feedback note</button></details><p class="ws-footnote">Community picks are reviewed by the game’s owner. <a href="https://github.com/YouKnowJP/Tilewright/issues/new?template=adventure.yml" target="_blank" rel="noopener noreferrer">Suggest an adventure</a> using a share code. This opens GitHub; an account is required. Sharing a file or link with friends needs no account.</p></section>`;
 document.body.append(dialog);const $=id=>dialog.querySelector('#ps-'+id),canvas=$('canvas');$('build-tools').before($('actor-tabs'),$('programs'));
 $('title').insertAdjacentHTML('afterend','<p id="ps-story-goal" class="ps-story-goal" hidden></p>');
 $('actor-tabs').insertAdjacentHTML('beforebegin','<p id="ps-card-help" hidden></p>');
 $('programs').insertAdjacentHTML('afterend','<button id="ps-test-route" class="front-primary" hidden>Test these cards</button>');
 $('budget').insertAdjacentHTML('afterend','<p id="ps-repair-help" hidden></p>');
 const briefing=node('details');briefing.id='ps-story-details';briefing.append(node('summary','Briefing & progress'));$('story').before(briefing);briefing.append($('story'));
 const dock=node('div','','ps-play-dock');dock.id='ps-play-dock';canvas.after(dock);dock.append($('test').parentElement,$('status'),$('run-tools'));dock.prepend($('inspect'),$('selection-tools'));
 const activeTool=node('div','','ps-tool-mode');activeTool.id='ps-active-tool';activeTool.hidden=true;
 activeTool.innerHTML='<p id="ps-active-tool-text" role="status"></p><button id="ps-inspect-mode">Inspect garden</button>';
 canvas.before(activeTool);
 canvas.setAttribute('aria-describedby','ps-map-help ps-inspect ps-active-tool-text');
 $('status').tabIndex=-1;
 const playbackState=node('p','','ps-playback-state');playbackState.id='ps-playback-state';playbackState.setAttribute('role','status');$('run-tools').before(playbackState);let pauseReason='';
 const heading=dialog.querySelector('.ps-heading'),cardsShortcut=heading.querySelector('[data-ps-jump="programs"]'),toolsShortcut=heading.querySelector('[data-ps-jump="build-tools"]');if(typeof ResizeObserver==='function')new ResizeObserver(()=>{const height=heading.getBoundingClientRect().height;if(height)dialog.style.setProperty('--ps-header-height',height+'px');}).observe(heading);
 function jump(id){
  stop();
  if(tab!=='build')showTab('build');
  let target=$(id);
  if(id==='programs'&&!$('actor-tabs').hidden)target=$('card-help').hidden?$('actor-tabs'):$('card-help');
  if(target.hidden)target=$('duo-creator')?.hidden===false?$('duo-creator'):$('help');
  if(target.tagName==='DETAILS')target.open=true;
  if(!target.hasAttribute('tabindex'))target.tabIndex=-1;
  (target===canvas&&!activeTool.hidden?activeTool:target).scrollIntoView({block:'start'});
  (target.tagName==='DETAILS'?target.querySelector('summary'):target).focus({preventScroll:true});
 }
 for(const button of heading.querySelectorAll('[data-ps-jump]'))button.onclick=()=>jump(button.dataset.psJump);
 $('test-route').onclick=()=>{
  if(mode!=='build')return;
  $('test').click();
  if(mode==='test')jump('canvas');
 };
 $('inspect-mode').onclick=()=>{
  stop();$('brush').value='inspect';render();jump('canvas');
 };
 function notice(message){$('notice').textContent=message;}
 function guard(fn,onError=notice){try{return fn();}catch(error){onError(error.message);return null;}}
 function placementError(message){
  notice(message);
  inspect();
  $('inspect').textContent+=' · '+message;
 }
 function renderStoryGuide(trial){
  const guide=PIP_OPENING_GUIDES[project.trialId],planning=Boolean(guide)&&mode==='build';
  const repair=planning&&guide.repair,partsMissing=repair&&project.parts.length<trial.budget;
  for(const [id,message] of [['story-goal',guide?.goal],['card-help',planning?guide.cards:null],['repair-help',repair]]){
   const line=$(id);
   line.hidden=!message;
   if(message&&line.textContent!==message)line.textContent=message;
  }
  $('test-route').hidden=!planning;
  const label=planning?'Plan cards':'Cards';
  if(cardsShortcut.textContent!==label)cardsShortcut.textContent=label;
  cardsShortcut.classList.toggle('front-primary',planning&&!partsMissing);
  const toolsLabel=repair?'Repair':'Tools';
  if(toolsShortcut.textContent!==toolsLabel)toolsShortcut.textContent=toolsLabel;
  toolsShortcut.classList.toggle('front-primary',Boolean(partsMissing));
  const eventLabel=guide?.tracker?'Next milestone':'Next event';
  if($('event').textContent!==eventLabel)$('event').textContent=eventLabel;
 }
 function renderActiveTool(){
  const brush=$('brush'),visible=mode==='build'&&brush.value!=='inspect';
  activeTool.hidden=!visible;
  const label=visible?'Garden tool · '+(names[brush.value]||brush.selectedOptions[0]?.textContent||''):'';
  if($('active-tool-text').textContent!==label)$('active-tool-text').textContent=label;
 }
 function repairStatus(trial){
  const {errors}=duoReadiness(project);
  const missing=Object.entries(trial.inventory)
   .filter(([kind,amount])=>project.parts.filter(part=>part.kind===kind).length<amount)
   .map(([kind,amount])=>names[kind]+(amount>1?` (${amount-project.parts.filter(part=>part.kind===kind).length} left)`:''));
  const next=[missing.length?`Still to place · ${missing.join(', ')}`:'',errors.join(' ')].filter(Boolean).join(' · ')||'Plan your cards and test the route.';
  return `Repair parts ${project.parts.length}/${trial.budget} placed · ${next}`;
 }
 function rainTurnStatus(trial){
  const before=history.at(-1);
  if(!before)return state.last;
  const holdingPlate=PIP_OPENING_GUIDES[trial.id]?.tracker==='bridges';
  const parts=tinkerParts(project);
  const power=tinkerPoweredChannels(before);
  return state.events.map(event=>{
   const courier=before.bots.find(bot=>event===bot.id+': Blocked'||holdingPlate&&event===bot.id+': Nothing to use here');
   if(!courier)return event;
   const plate=holdingPlate&&parts.find(tile=>tile.kind==='plate'&&tile.x===courier.x&&tile.y===courier.y);
   if(plate)return `${courier.id}: Holding Plate ${DUO_CHANNELS.indexOf(plate.channel)+1}`;
   const direction=RAIL_DIRECTIONS[courier.program[courier.index]];
   if(!direction)return event;
   const [dx,dy]=direction;
   const bridge=parts.find(tile=>tile.kind==='bridge'&&tile.x===courier.x+dx&&tile.y===courier.y+dy);
   if(!bridge||power.has(bridge.channel))return event;
   const number=DUO_CHANNELS.indexOf(bridge.channel)+1;
   return `${courier.id}: Bridge ${number} was closed at the start of this turn`;
  }).join(' · ')||state.last;
 }
 function routeStatus(trial){
  if(mode==='build'&&PIP_OPENING_GUIDES[project.trialId]?.repair)return repairStatus(trial);
  if(mode==='build')return trial.budget
   ?'Bench open. Set the cards and place your parts.'
   :'Choose your cards, then test the route.';
  const tick=`Tick ${state.ticks}/${TINKER_LIMIT} · `;
  if(state.status!=='playing')return tick+state.last;
  if(project.version<14){
   const nextCards=state.bots.map(b=>`${b.id} next: card ${b.index+1}, ${CLOCKWORK_LABELS[b.program[b.index]]}`).join(' · ');
   const guide=PIP_OPENING_GUIDES[trial.id];
   const last=trial.id==='duo-rain-bridges'||guide?.tracker==='bridges'?rainTurnStatus(trial):guide?.spareMail?state.events.map(event=>spareLockerEvent(state,event)).join(' · ')||state.last:state.last;
   return tick+last+' · '+nextCards;
  }
  return tick+state.bots.map(b=>b.resting?`${b.id} resting ${b.resting} turn${b.resting===1?'':'s'}`:`${b.id}: ${b.last}`).join(' · ');
 }
 function playback(){playbackState.hidden=mode!=='test'||state.status==='won';const text=state.status!=='playing'?'Test stopped · Undo or return to the bench.':auto?'Running · Pause or Escape':pauseReason||'Paused · Step or Run when ready.';if(playbackState.textContent!==text)playbackState.textContent=text;const label=auto?'Pause':'Run';if($('run').textContent!==label)$('run').textContent=label;if($('run').getAttribute('aria-pressed')!==String(auto))$('run').setAttribute('aria-pressed',String(auto));const help=(mode==='test'?'Tap a tile to inspect it. ':'Tap a tile to inspect or place your selected part. ')+pipCanvasHelp({mode,keyboardLayout:getPreferences().keyboardLayout});if($('map-help').textContent!==help)$('map-help').textContent=help;canvas.setAttribute('aria-keyshortcuts','ArrowUp ArrowRight ArrowDown ArrowLeft Space Enter z'+(mode==='test'?' r':''));}
 function stop(reason=''){auto=false;clearTimeout(timer);timer=null;pauseReason=typeof reason==='string'?reason:'';playback();}
 function save(){const ok=!loaded.failed&&saveTinkerJournal(storage,journal,project.version);studioSaveFailed=!ok;$('save-note').textContent=ok?'Drafts and personal bests stay on this device. Full journey backups include this workshop.':'This workshop is available for this visit. Existing unreadable data is protected. Download a project to keep your work.';}
 function selectOptions(element,items){element.replaceChildren(...Object.entries(items).map(([value,label])=>new Option(label.name||label,value)));}
 function cards(host,label,program,change){const box=node('fieldset'),legend=node('legend',label);box.append(legend);program.forEach((value,i)=>{const line=node('label',`Card ${i+1}`),select=node('select');select.id=`ps-card-${label.toLowerCase().replaceAll(' ','-')}-${i}`;select.setAttribute('aria-label',`${label} card ${i+1}`);selectOptions(select,CLOCKWORK_LABELS);select.value=value;select.onchange=()=>change(i,select.value);line.append(select);box.append(line);});host.append(box);}
 const banks={a:['up','wait','use'],b:['right','wait','use']};for(const id of ['a','b'])cards($('bank-'+id),'Route '+id.toUpperCase(),banks[id],(i,value)=>banks[id][i]=value);
 for(const [id,value]of [['mixer-first','amber'],['mixer-second','blue'],['mixer-output','jade']]){selectOptions($(id),Object.fromEntries(DUO_CHANNELS.map((c,i)=>[c,(i+1)+' · '+c])));$(id).value=value;}
 const kilnEditor=createKilnEditor({prefix:'ps-kiln-',anchor:$('mixer-fields')});
 const weaveEditor=createWeaveEditor({prefix:'ps-weave-',anchor:kilnEditor.element});
 const drumEditor=createDrumEditor({prefix:'ps-drum-',anchor:weaveEditor.element});const restEditor=createRestEditor({prefix:'ps-rest-',anchor:drumEditor.element,onChange:render});const vaneEditor=createVaneEditor({prefix:'ps-vane-',anchor:restEditor.element,onChange:render});const counterEditor=createCounterEditor({prefix:'ps-counter-',anchor:vaneEditor.element,onChange:render});const railEditor=createRailEditor({prefix:'ps-rail-',anchor:counterEditor.element,onChange:render});
 const turnstileEditor=createTurnstileEditor({prefix:'ps-toll-',anchor:railEditor.element,onChange:render});
 const dialEditor=createCardDialEditor({anchor:turnstileEditor.element,onChange:render});
 selectOptions($('operation'),PRISM_OPERATIONS);$('operation').value='rotate-left';for(const id of ['input','output','channel'])selectOptions($(id),{amber:'1 · Amber',jade:'2 · Jade',violet:'3 · Violet',blue:'4 · Blue'});$('output').value='jade';
 function chooseTrialOptions(){const collection=$('collection').value;$('trial').replaceChildren(...tinkerCatalogue().filter(t=>t.collection===collection).map(t=>new Option(t.title,t.id)));}
 function remember(){journal.drafts={...Object.fromEntries(Object.entries(journal.drafts).filter(([id])=>id!==project.trialId)),[project.trialId]:project};save();}
 function mutate(next){stop();edits.push(project);if(edits.length>80)edits.shift();project=next;state=startTinker(project);history=[];remember();render();}
 function loadProject(next,persist=true){stop();project=next;state=startTinker(project);mode='build';history=[];edits=[];hintLevel=-1;hint();$('practice').hidden=next.version<2;const trial=tinkerDefinition(project);$('collection').value=trial.collection;chooseTrialOptions();$('trial').value=trial.id;$('chooser').open=false;$('brush').replaceChildren(new Option('Inspect tile','inspect'),new Option('Remove a placed part','erase'),...(duoEditable(project)?[['road','Paint garden road'],['water','Paint water'],['pip-start','Move Pip’s start'],['sprout-start','Move Sprout’s start']].map(([value,label])=>new Option(label,value)):[]),...Object.keys(trial.inventory).map(k=>new Option(k==='turnstile'?`Turnstile $ · ${trial.inventory[k]}`:k==='sync'?`Post ↔ · ${trial.inventory[k]}`:k==='rail'?`Rail » · ${trial.inventory[k]}`:k==='counter'?`Counter O · ${trial.inventory[k]}`:`${names[k]} · ${trial.inventory[k]} available`,k)));$('name').value=project.name;$('author').value=project.author;cursor=project.version>=2?{...trial.starts[0]}:{x:Math.min(cursor.x,(trial.width||9)-1),y:Math.min(cursor.y,(trial.height||7)-1)};programActor=0;for(const [id,count]of [['cursor-x',trial.width||9],['cursor-y',trial.height||7]])$(id).replaceChildren(...Array.from({length:count},(_,i)=>new Option(String(i+1),String(i))));duo?.loaded();rehearsal?.loaded();collections?.loaded();if(persist)remember();else $('save-note').textContent=loaded.failed?'This workshop is available for this visit. Existing unreadable data is protected. Download a project to keep your work.':'Your draft changes and personal bests stay on this device. Full journey backups include this workshop.';render();if(dialog.open&&tab==='build'){dialog.scrollTop=0;$('title').focus({preventScroll:true});}}
 let renderedPrograms='';function programUI(){const host=$('programs'),key=JSON.stringify([project.programs,mode,project.version,programActor]);if(key===renderedPrograms)return;renderedPrograms=key;const focus=host.contains(document.activeElement)?document.activeElement.getAttribute('aria-label'):null;host.replaceChildren();project.programs.forEach((program,i)=>cards(host,i?'Sprout':'Pip',program,(card,value)=>guard(()=>{const programs=project.programs.map(p=>[...p]);programs[i][card]=value;mutate(editTinkerProject(project,{programs}));})));$('actor-tabs').hidden=project.version<2;[...host.children].forEach((box,i)=>box.hidden=project.version>=2&&i!==programActor);for(const [i,id]of ['pip','sprout'].entries())$('actor-'+id).setAttribute('aria-pressed',String(i===programActor));for(const input of host.querySelectorAll('select'))input.disabled=mode==='test';if(focus)requestAnimationFrame(()=>{const source=[...host.querySelectorAll('select')].find(s=>s.getAttribute('aria-label')===focus);const trigger=source?.nextElementSibling;((trigger?.matches('[role=combobox]')?trigger:source))?.focus({preventScroll:true});});}
 function selectedPart(){return project.parts.find(p=>p.x===cursor.x&&p.y===cursor.y);}
 const tideEditor=createTideEditor({prefix:'ps-tide-',anchor:$('pulse-fields'),onChange:()=>{}});
 function inspect(){$('cursor-x').value=cursor.x;$('cursor-y').value=cursor.y;$('place-tile').disabled=mode!=='build';const editable=mode==='build'&&selectedPart();$('selection-tools').hidden=!editable;$('apply-part').hidden=!editable||$('brush').value!==editable.kind;const parts=tinkerParts(project),tile=parts.find(p=>p.x===cursor.x&&p.y===cursor.y),bots=state.bots.filter(b=>b.x===cursor.x&&b.y===cursor.y);const description=tile?.kind==='locker'?describeLocker(tile,state):tile?.kind==='cargo'?`${names.cargo} · match ${tile.channel} · ${describeBlueprintRoute(tile)}`:tile?.kind==='tube'&&project.version>=2?describeTube(tile,parts):tile?.kind==='dial'?`${names.dial} · ${cardDialDescription(tile)}`:tile?.kind==='turnstile'?`${names.turnstile} · ${turnstileDescription(tile)}`:tile?.kind==='sync'?`${names.sync} · ${rendezvousDescription(tile)}`:tile?.kind==='rail'?`${names.rail} · ${railDescription(tile)}`:tile?.kind==='counter'?`${names.counter} · ${counterDescription(tile,state.counters?.[tile.id])}`:tile?.kind==='vane'?`${names.vane} · ${vaneDescription(tile)}`:tile?.kind==='rest'?`${names.rest} · ${restDescription(tile)}`:tile?.kind==='drum'?`${names.drum} · ${drumDescription(tile,state.drums?.[tile.id]||Array(tile.delay).fill(false))}`:tile?.kind==='weave'?`${names.weave} · ${weaveDescription(tile,weavePowerChannels(state).has(tile.channel))}`:tile?.kind==='kiln'?`${names.kiln} · ${kilnDescription(tile,kilnPowerChannels(state).has(tile.channel))}`:tile?.kind==='mixer'?`${names.mixer} · ${mixerDescription(tile,state.mixers?.[tile.id])}`:tile?.kind==='echo'?`${names.echo} · ${echoDescription(tile)}`:tile?.kind==='scale'?`${names.scale} · ${scaleDescription(tile)}`:tile?.kind==='seal'?`${names.seal} · ${sealDescription(tile)} · parcel kept`:tile?`${names[tile.kind]}${tile.channel?' · '+(tile.kind==='locker'?'link ':tile.kind==='cargo'?'match ':['latch','pulse','tide','plate','bridge'].includes(tile.kind)?'power ':'parcel ')+tile.channel:''}${tile.output?' → '+tile.output:''}${tile.operation?' · '+PRISM_OPERATIONS[tile.operation]:''}${tile.kind==='flip'?' · next Route '+((state.flips[tile.id]??tile.initial)?'B':'A'):''}${tile.kind==='tide'?' · '+tideDescription(tile,state.ticks+1):''}${tile.kind==='pulse'?' · '+tile.duration+' powered tick'+(tile.duration===1?'':'s')+' per ring · '+(state.pulses?.[tile.channel]||0)+' ticks ahead':''}${tile.kind==='latch'?' · '+(state.switches?.[tile.channel]?'on':'off')+' · changes affect the next tick':''}${tile.kind==='bridge'&&project.version>=2?' · next tick '+(tinkerPoweredChannels(state).has(tile.channel)?'open':'closed'):''}${tile.kind==='locker'?' · '+tile.mode+' · '+(state.lockers?.[tile.channel]?.parcel||'empty'):''}${tile.kind==='receiver'?' · '+((state.received[tile.id]||0)+'/'+(tile.parcels||1)+' delivered'):''}`:tinkerDefinition(project).road.some(p=>p.x===cursor.x&&p.y===cursor.y)?'Open garden tile':'Water · no parts here';duo?.placement();$('inspect').textContent=`Column ${cursor.x+1}, row ${cursor.y+1}: ${description}${bots.length?' · '+bots.map(b=>b.id+' carrying '+(b.parcel||'nothing')).join(', '):''}`;}
 function paint(target=canvas,{postcard=false}={}){const trial=tinkerDefinition(project),width=trial.width||9,height=trial.height||7;if(target.width!==width*50)target.width=width*50;if(target.height!==height*50+(postcard?95:0))target.height=height*50+(postcard?95:0);const ctx=target.getContext('2d'),size=50;ctx.imageSmoothingEnabled=false;ctx.fillStyle='#102f3e';ctx.fillRect(0,0,target.width,target.height);const parts=tinkerParts(project);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const road=trial.road.some(p=>p.x===x&&p.y===y);ctx.fillStyle=road?'#47685b':(x+y)%2?'#183e4c':'#1a4450';ctx.fillRect(x*size+1,y*size+1,48,48);if(road){ctx.fillStyle='#627b62';ctx.fillRect(x*size+5,y*size+5,40,3);}ctx.fillStyle='#c6ddcf';ctx.font='10px sans-serif';ctx.textAlign='left';if(x===0)ctx.fillText(String(y+1),4,y*size+14);if(y===0)ctx.fillText(String(x+1),x*size+22,14);}
 const readyChannels=project.version>=2&&parts.some(p=>p.kind==='bridge')?tinkerPoweredChannels(state,parts):null,hotKilns=parts.some(p=>p.kind==='kiln')?kilnPowerChannels(state,parts):new Set();for(const tile of parts){drawWorkshopObject(ctx,{...tile,kind:kinds[tile.kind],order:tile.kind==='pip-dock'?'P':tile.kind==='sprout-dock'?'S':undefined,hideCue:true,poweredOutput:tile.kind==='kiln'?tile.powered:undefined,stored:tile.kind==='mixer'?state.mixers?.[tile.id]:tile.kind==='locker'?state.lockers?.[tile.channel]?.parcel:null,powered:tile.kind==='counter'?Boolean(state.counters?.[tile.id]?.[1]):tile.kind==='drum'?drumPowerChannels(state,parts).has(tile.channel):tile.kind==='weave'?weavePowerChannels(state,parts).has(tile.channel):tile.kind==='kiln'?hotKilns.has(tile.channel):tile.kind==='scale'?state.bots.some(b=>b.x===tile.x&&b.y===tile.y&&scaleMatches(tile,b)):tile.kind==='tide'?tideOpen(tile,state.ticks+1):tile.kind==='pulse'?Boolean(state.pulses?.[tile.channel]):tile.kind==='latch'?Boolean(state.switches?.[tile.channel]):Boolean(state.received[tile.id]),remaining:state.pulses?.[tile.channel]||0,x:tile.x,y:tile.y},size);if(tile.kind==='bridge'&&readyChannels?.has(tile.channel)){ctx.strokeStyle='#fff1bc';ctx.lineWidth=3;ctx.strokeRect(tile.x*size+4,tile.y*size+4,size-8,size-8);}ctx.fillStyle='#fff4cb';ctx.font='bold 12px sans-serif';ctx.textAlign='left';const symbol={dial:tile.shift==='skip'?'⟳':'⟲',turnstile:'$',sync:'↔',rail:'»',counter:'O',vane:'F',rest:'R',drum:'D',weave:'W',source:'Q',receiver:'N',kiln:'I',mixer:'Y',press:'E',tube:'U',prism:'X',flip:'Z',handoff:'H',plate:'P',bridge:'B',signal:'M',latch:'L',pulse:'A',tide:'T',scale:'V',echo:'J',seal:'G',locker:'K',cargo:'C','pip-dock':'P','sprout-dock':'S'}[tile.kind],number={amber:1,jade:2,violet:3,blue:4}[tile.channel]||(tile.kind==='seal'?({all:'–',empty:'0',any:'*'}[tile.channel]||''):'');ctx.fillStyle='#102936';ctx.fillRect(tile.x*size,tile.y*size+35,33,15);ctx.fillStyle='#fff4cb';ctx.fillText(symbol+(tile.kind==='rest'?tile.duration:number)+(tile.kind==='seal'&&tile.courier!=='either'?tile.courier==='pip'?'P':'S':''),tile.x*size+2,tile.y*size+47);}
 for(const [i,bot]of state.bots.entries()){drawWorkshopObject(ctx,{...bot,kind:'clockwork',look:i?{...look,antenna:'leaf',paint:'fern'}:look,mood:bot.last.startsWith('Blocked')?'puzzled':state.status==='won'?'pleased':'curious'},size);ctx.fillStyle='#102936';ctx.fillRect(bot.x*size+30,bot.y*size,20,17);ctx.fillStyle='#fff4cb';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText(i?'S':'P',bot.x*size+40,bot.y*size+13);}
 if(!postcard){const f=duo?.footprint();if(f){ctx.save();ctx.setLineDash([8,5]);ctx.strokeStyle=f.valid?'#a7f2db':'#ffbb9c';ctx.lineWidth=4;ctx.strokeRect(f.x*size+3,f.y*size+3,f.width*size-6,f.height*size-6);ctx.restore();}ctx.strokeStyle='#fff3b0';ctx.lineWidth=3;ctx.strokeRect(cursor.x*size+2,cursor.y*size+2,46,46);}else{ctx.fillStyle='#102936';const edge=height*50;ctx.fillRect(0,edge,target.width,95);ctx.fillStyle='#fff1c5';ctx.textAlign='left';ctx.font='bold 17px sans-serif';ctx.fillText(project.name,14,edge+25,target.width-28);ctx.font='14px sans-serif';const m=tinkerMetrics(project);ctx.fillText(`By ${project.author} · ${m.parts} parts · ${m.ticks||'draft'} ticks`,14,edge+50,target.width-28);ctx.fillText('Pip’s workshop · Tilewright · Share the project to play',14,edge+76,target.width-28);}}
 function render(){playback();const trial=tinkerDefinition(project),bellLimit=trial.maxBellDuration||6;heading.querySelector('[data-ps-jump=build-tools]').hidden=!trial.budget&&!duoEditable(project);if($('duration').options.length!==bellLimit){const value=Math.min(Number($('duration').value)||3,bellLimit);$('duration').replaceChildren(...Array.from({length:bellLimit},(_,i)=>new Option(String(i+1),String(i+1))));$('duration').value=value;}$('pulse-limit').hidden=bellLimit===6;$('pulse-limit').textContent=bellLimit<6?`This repair allows at most ${bellLimit} powered tick${bellLimit===1?'':'s'} per bell. Remix the garden to choose longer rings.`:'';cursor.x=Math.max(0,Math.min((trial.width||9)-1,cursor.x));cursor.y=Math.max(0,Math.min((trial.height||7)-1,cursor.y));for(const [id,count]of [['cursor-x',trial.width||9],['cursor-y',trial.height||7]])if($(id).options.length!==count)$(id).replaceChildren(...Array.from({length:count},(_,i)=>new Option(String(i+1),String(i))));$('name').value=project.name;$('author').value=project.author;$('name').disabled=mode==='test';$('author').disabled=mode==='test';$('title').textContent=project.name;$('kicker').textContent=`${trial.chapter?'Chapter '+trial.chapter+'/'+DUO_STORIES.length+' · ':''}${trial.difficulty} · ${trial.minutes}${trial.collection==='create'?'':' estimate'}${trial.collection==='relay'?' · OPTIONAL TWO-COMPANION PROTOTYPE':''}`;$('story').textContent=trial.story;const bests=journal.bests[trial.id]||[];$('best').textContent=duoEditable(project)?(project.proof?'Your adventure has a verified clear in '+project.proof.ticks+' ticks. Share it or keep it on your shelf.':'Create freely. Every window must fill; your story can add handoffs and home flags.'):bests.length?`Your answers · fastest ${Math.min(...bests.map(p=>p.proof.ticks))} ticks · smallest ${Math.min(...bests.map(p=>p.parts.length))} parts. Optimization is optional.`:'No deadline. Make it work, then make it your own.';$('budget').textContent=`Your parts tray · ${project.parts.length}/${trial.budget} placed`;$('build-tools').disabled=mode==='test';$('build-tools').hidden=!trial.budget;$('test').textContent=mode==='build'?'Test invention':'Back to the bench';$('run-tools').hidden=mode!=='test'||state.status==='won';$('reset').disabled=mode!=='test';$('undo').textContent=mode==='test'?'Undo tick':'Undo edit';$('undo').disabled=!(mode==='test'?history:edits).length;$('status').textContent=routeStatus(trial);$('status').classList.toggle('ps-clear',mode==='test'&&state.status==='won');renderStoryGuide(trial);renderActiveTool();for(const id of ['step','event','run'])$(id).disabled=state.status!=='playing';$('prism-fields').hidden=$('brush').value!=='prism';$('echo-fields').hidden=$('brush').value!=='echo';$('press-fields').hidden=$('brush').value!=='press';$('mixer-fields').hidden=$('brush').value!=='mixer';kilnEditor.element.hidden=$('brush').value!=='kiln';weaveEditor.element.hidden=$('brush').value!=='weave';drumEditor.element.hidden=$('brush').value!=='drum';restEditor.element.hidden=$('brush').value!=='rest';vaneEditor.element.hidden=$('brush').value!=='vane';counterEditor.element.hidden=$('brush').value!=='counter';railEditor.element.hidden=$('brush').value!=='rail';turnstileEditor.element.hidden=$('brush').value!=='turnstile';dialEditor.element.hidden=$('brush').value!=='dial';$('flip-fields').hidden=!['flip','signal','cargo'].includes($('brush').value);$('first-route').closest('label').hidden=$('brush').value!=='flip';$('channel-fields').hidden=!['source','receiver','tube','plate','bridge','signal','locker','latch','pulse','scale','sync'].includes($('brush').value);$('channel-label').textContent=$('brush').value==='tube'?'Tube link number':$('brush').value==='locker'?'Locker link number':$('brush').value==='sync'?'Link number':$('brush').value==='scale'?'Power channel':'Parcel / signal colour';$('latch-note').hidden=$('brush').value!=='latch';$('pulse-fields').hidden=$('brush').value!=='pulse';tideEditor.element.hidden=$('brush').value!=='tide';$('seal-fields').hidden=!['seal','scale'].includes($('brush').value);$('seal-heading-field').hidden=$('brush').value==='scale';$('seal-note').textContent=$('brush').value==='scale'?'V reads cargo and badge at turn start. Standing on it powers matching bridges and signals next turn. No Use is needed.':'G checks entry automatically and keeps the parcel. Other directions pass without inspection. A courier already inside can leave freely.';$('locker-fields').hidden=$('brush').value!=='locker';$('cargo-fields').hidden=$('brush').value!=='cargo';$('receiver-fields').hidden=$('brush').value!=='receiver';for(const [id,label]of [['a','Quiet'],['b','Powered']])$('bank-'+id).querySelector('legend').textContent=$('brush').value==='cargo'?(id==='a'?'Otherwise':'Matching cargo'):$('brush').value==='signal'?label:'Route '+id.toUpperCase();$('flip-fields').querySelector('p').textContent=$('brush').value==='cargo'?'Use reads the parcel being carried. Matching cargo or Otherwise restarts at card 1 and keeps the parcel.':$('brush').value==='signal'?(project.version>=12?'Use reads relay and Memory Drum outputs and other power at turn start, plus matching plates and filled windows. Both banks restart at card 1.':project.version>=8?'Use reads matching cargo scales at turn start, plus plates, windows, lanterns, bells and tides. Both banks restart at card 1.':project.version>=7?'Use reads matching plates, filled windows, lanterns, timed bells or automatic tides. Both banks restart at card 1.':project.version>=4?'Use reads matching plates, filled windows, remembered lantern power or timed bells. Quiet and Powered both restart at card 1.':'Use reads matching plates or filled windows. Quiet and Powered both restart at card 1.'):'Each visit loads the next route and starts card 1. Cargo stays held.';programUI();inspect();paint();$('map-list').replaceChildren(...partsText());duo?.render();collections?.render();rehearsal?.render();}
 function partsText(){return [...state.bots.map(b=>node('p',`${b.id}: column ${b.x+1}, row ${b.y+1} · carrying ${b.parcel||'nothing'} · next card ${b.index+1}, ${CLOCKWORK_LABELS[b.program[b.index]]} · ${b.last}`)),...tinkerParts(project).map(p=>node('p',`${names[p.kind]}${p.kind==='dial'?' · '+cardDialDescription(p):p.kind==='turnstile'?' · '+turnstileDescription(p):p.kind==='sync'?' · '+rendezvousDescription(p):p.kind==='rail'?' · '+railDescription(p):p.kind==='counter'?' · '+counterDescription(p,state.counters?.[p.id]):p.kind==='vane'?' · '+vaneDescription(p):p.kind==='rest'?' · '+restDescription(p):p.kind==='drum'?' · '+drumDescription(p,state.drums?.[p.id]||Array(p.delay).fill(false)):p.kind==='weave'?' · '+weaveDescription(p,weavePowerChannels(state).has(p.channel)):p.kind==='kiln'?' · '+kilnDescription(p,kilnPowerChannels(state).has(p.channel)):p.kind==='mixer'?' · '+mixerDescription(p,state.mixers?.[p.id]):p.kind==='seal'?' · '+sealDescription(p):p.kind==='scale'?' · '+scaleDescription(p):p.kind==='echo'?' · '+echoDescription(p):''} at column ${p.x+1}, row ${p.y+1}${p.channel?' · '+p.channel:''}${p.output?' → '+p.output:''}${p.operation&&p.kind!=='echo'?' · '+PRISM_OPERATIONS[p.operation]:''}${['flip','signal','cargo'].includes(p.kind)?' · '+(p.kind==='cargo'?'Otherwise: ':p.kind==='signal'?'Quiet: ':'A: ')+p.program.join(' / ')+' · '+(p.kind==='cargo'?'Matching: ':p.kind==='signal'?'Powered: ':'B: ')+p.alternate.join(' / '):''}${p.kind==='tide'?' · '+tideDescription(p,state.ticks+1):''}${p.kind==='pulse'?' · '+p.duration+' powered tick'+(p.duration===1?'':'s')+' per ring · '+(state.pulses?.[p.channel]||0)+' ticks ahead':''}${p.kind==='latch'?' · '+(state.switches?.[p.channel]?'on':'off')+' · power changes next tick':''}${p.kind==='locker'?' · '+p.mode+' · '+(state.lockers?.[p.channel]?.parcel||'empty'):''}${p.kind==='receiver'?' · '+((state.received[p.id]||0)+'/'+(p.parcels||1)+' delivered'):''}`))];}
 function tick(){
  if(mode!=='test'||state.status!=='playing')return;
  const focusedPlayback=$('run-tools').contains(document.activeElement);
  history.push(state);if(history.length>240)history.shift();
  state=tinkerStep(state);
  if(state.status==='won'){project=clearTinkerProject(state);journal=keepTinkerResult(journal,project);save();stop();}
  else if(state.status!=='playing')stop();
  render();
  if(state.status==='won'){
   const target=$('next-story').hidden?$('status'):$('next-story');
   if(focusedPlayback)target.focus({preventScroll:true});
   target.scrollIntoView({block:'start'});
  }
 }
 function advance(kind='run'){
  stop();
  if(mode!=='test'||state.status!=='playing')return;
  auto=true;playback();
  const seen=new Set([tinkerStateKey(state)]);
  const parts=kind==='milestone'?tinkerParts(project):[];
  const homes=parts.filter(part=>part.kind.endsWith('-dock'));
  const bridges=PIP_OPENING_GUIDES[project.trialId]?.tracker==='bridges'?parts.filter(part=>part.kind==='bridge'):[];
  const loop=()=>{
   if(!auto||!dialog.open||document.hidden||document.activeElement?.closest('dialog[open]')!==dialog)return stop('Paused · Run when you return.');
   const before=state;
   tick();
   if(!auto||state.status!=='playing')return stop();
   const key=tinkerStateKey(state);
   if(seen.has(key)){
    const guide=PIP_OPENING_GUIDES[project.trialId];
    const message=guide?.repeat||'This route repeats. Return to the bench to try a new idea.';
    if(kind==='milestone'||guide?.repeat){
     stop(message);
     playbackState.scrollIntoView({block:'start'});
    }
    else{stop();notice(message);}
    return;
   }
   const milestone=kind==='milestone'&&storyMilestone(before,state,homes,bridges);
   if(milestone)return stop('Milestone reached · '+milestone);
   if(kind==='event'&&state.events.length){
    stop();notice('Next event reached. Inspect the garden or advance again.');return;
   }
   seen.add(key);
   timer=setTimeout(loop,duo?.delay()??(getPreferences().motion==='reduced'?280:200));
  };
  loop();
 }
 function place(){if(mode!=='build'||$('brush').value==='inspect'){inspect();return;}if(duoEditable(project)&&['road','water','pip-start','sprout-start'].includes($('brush').value)){guard(()=>mutate(['road','water'].includes($('brush').value)?paintDuoTerrain(project,cursor.x,cursor.y,$('brush').value==='road'):moveDuoCompanion(project,$('brush').value==='pip-start'?0:1,cursor.x,cursor.y)));return;}guard(()=>mutate(placeTinkerPart(project,$('brush').value,cursor.x,cursor.y,{operation:$('brush').value==='echo'?$('echo-operation').value:$('operation').value,second:$('mixer-second').value,channel:$('brush').value==='mixer'?$('mixer-first').value:$('brush').value==='seal'?$('seal-match').value:$('brush').value==='cargo'?$('cargo-match').value:$('brush').value==='press'?$('input').value:$('channel').value,courier:$('seal-courier').value,match:$('seal-match').value,heading:$('seal-heading').value,duration:Number($('duration').value),...tideEditor.value(),mode:$('locker-mode').value,parcels:Number($('parcels').value),output:$('brush').value==='mixer'?$('mixer-output').value:$('output').value,program:banks.a,alternate:banks.b,initial:$('first-route').value==='b',...($('brush').value==='kiln'?kilnEditor.value():{}),...($('brush').value==='weave'?weaveEditor.value():{}),...($('brush').value==='drum'?drumEditor.value():{}),...($('brush').value==='rest'?restEditor.value():{}),...($('brush').value==='vane'?vaneEditor.value():{}),...($('brush').value==='counter'?counterEditor.value():{}),...($('brush').value==='rail'?railEditor.value():{}),...($('brush').value==='turnstile'?turnstileEditor.value():{}),...($('brush').value==='dial'?dialEditor.value():{})})),placementError);}

 $('go-tile').onclick=()=>{stop();cursor={x:Number($('cursor-x').value),y:Number($('cursor-y').value)};inspect();paint();};$('place-tile').onclick=()=>{stop();place();paint();};
 $('edit-part').onclick=()=>{if(mode!=='build')return;const tile=selectedPart();if(!tile)return;$('brush').value=tile.kind;if(tile.kind==='prism')$('operation').value=tile.operation;if(tile.kind==='echo')$('echo-operation').value=tile.operation;if(tile.kind==='kiln')kilnEditor.set(tile);if(tile.kind==='weave')weaveEditor.set(tile);if(tile.kind==='drum')drumEditor.set(tile);if(tile.kind==='rest')restEditor.set(tile);if(tile.kind==='vane')vaneEditor.set(tile);if(tile.kind==='counter')counterEditor.set(tile);if(tile.kind==='rail')railEditor.set(tile);if(tile.kind==='turnstile')turnstileEditor.set(tile);if(tile.kind==='dial')dialEditor.set(tile);if(tile.kind==='mixer'){$('mixer-first').value=tile.channel;$('mixer-second').value=tile.second;$('mixer-output').value=tile.output;}if(tile.kind==='press'){$('input').value=tile.channel;$('output').value=tile.output;}if(DUO_CHANNELS.includes(tile.channel))$('channel').value=tile.channel;if(tile.kind==='scale'){$('seal-match').value=tile.match;$('seal-courier').value=tile.courier;}if(tile.kind==='seal'){$('seal-match').value=tile.channel;$('seal-courier').value=tile.courier;$('seal-heading').value=tile.heading;}if(tile.kind==='locker')$('locker-mode').value=tile.mode;if(tile.kind==='cargo')$('cargo-match').value=tile.channel;if(tile.kind==='receiver')$('parcels').value=tile.parcels||1;if(tile.kind==='pulse')$('duration').value=tile.duration;if(tile.kind==='tide')tideEditor.set(tile);if(['flip','signal','cargo'].includes(tile.kind)){for(const [bank,program]of [['a',tile.program],['b',tile.alternate]]){banks[bank]=[...program];[...$('bank-'+bank).querySelectorAll('select')].forEach((select,i)=>select.value=program[i]);}$('first-route').value=tile.initial?'b':'a';}render();notice('Part loaded into the tray. Change its settings, then Apply to update this tile.');$('build-tools').scrollIntoView({block:'nearest'});const trigger=$('brush').nextElementSibling;(trigger?.matches('[role=combobox]')?trigger:$('brush')).focus({preventScroll:true});};
 $('apply-part').onclick=()=>{if(mode!=='build'||!selectedPart()||$('brush').value!==selectedPart().kind)return;place();canvas.scrollIntoView({block:'nearest'});canvas.focus({preventScroll:true});};
 $('remove-part').onclick=()=>{if(mode==='build'&&selectedPart()){guard(()=>mutate(placeTinkerPart(project,'erase',cursor.x,cursor.y)));canvas.focus({preventScroll:true});}};
 canvas.addEventListener('pointerdown',()=>stop());canvas.onclick=e=>{const r=canvas.getBoundingClientRect();cursor={x:Math.max(0,Math.min((tinkerDefinition(project).width||9)-1,Math.floor((e.clientX-r.left)*(tinkerDefinition(project).width||9)/r.width))),y:Math.max(0,Math.min((tinkerDefinition(project).height||7)-1,Math.floor((e.clientY-r.top)*(tinkerDefinition(project).height||7)/r.height)))};place();paint();canvas.focus({preventScroll:true});};
 canvas.onkeydown=e=>{if(document.activeElement!==canvas||document.activeElement.closest('dialog[open]')!==dialog)return;const command=pipCanvasCommand(e,{mode,...getPreferences()});if(!command)return;e.preventDefault();if(command.action==='inspect'){stop();const d={up:[0,-1],right:[1,0],down:[0,1],left:[-1,0]}[command.direction];cursor.x=Math.max(0,Math.min((tinkerDefinition(project).width||9)-1,cursor.x+d[0]));cursor.y=Math.max(0,Math.min((tinkerDefinition(project).height||7)-1,cursor.y+d[1]));inspect();paint();}else if(command.action==='place'){stop();place();paint();}else if(['step','run','undo'].includes(command.action))$(command.action).click();};
 $('collection').onchange=()=>{chooseTrialOptions();loadProject(journal.drafts[$('trial').value]||newTinkerProject($('trial').value));};$('trial').onchange=()=>loadProject(journal.drafts[$('trial').value]||newTinkerProject($('trial').value));$('brush').onchange=render;
 $('test').onclick=()=>{
  stop();
  if(mode==='build'){
   const issue=project.version>=2?duoReadiness(project).errors[0]:
    tinkerParts(project).filter(part=>part.kind==='tube').length===1?'A tube needs a matching end. Place the second tube before testing.':'';
   const repair=PIP_OPENING_GUIDES[project.trialId]?.repair;
   if(issue){
    notice(issue);
    if(repair)jump('status');
    return;
   }
   if(repair)notice('');
   mode='test';state=startTinker(project);history=[];
  }else{
   mode='build';state=startTinker(project);history=[];
  }
  render();
 };
 $('step').onclick=()=>{stop();tick();};$('event').onclick=()=>advance(PIP_OPENING_GUIDES[project.trialId]?.tracker?'milestone':'event');$('run').onclick=()=>auto?stop():advance();$('reset').onclick=()=>{stop();state=startTinker(project);history=[];render();};$('undo').onclick=()=>{stop();if(mode==='test'&&history.length)state=history.pop();else if(mode==='build'&&edits.length){project=edits.pop();state=startTinker(project);remember();}render();};
 function hint(){const custom=duoEditable(project),labels=['A small clue','Try an experiment',custom?'Design checklist':'Worked route'];$('hint-stage').hidden=hintLevel<0;$('hint-stage').textContent=hintLevel<0?'':`${hintLevel+1} / 3 · ${labels[hintLevel]}`;$('hint').textContent=hintLevel<0?'Hints are optional. Try your own idea first.':tinkerHint(project,hintLevel);$('nudge').disabled=hintLevel===2;$('nudge').textContent=hintLevel<0?'Ask for a clue':hintLevel===0?'Try an experiment':hintLevel===1?(custom?'Read the design checklist':'Show the worked route'):'All clues revealed';$('hint-back').disabled=hintLevel<1;$('example').hidden=hintLevel<2||duoEditable(project);}
 $('nudge').onclick=()=>{stop();hintLevel=Math.min(2,hintLevel+1);hint();};$('hint-back').onclick=()=>{stop();hintLevel=Math.max(0,hintLevel-1);hint();};$('practice').onclick=()=>practice.open(project,$('practice'));$('example').onclick=async()=>{stop();if(await confirmGame('Replace this challenge draft with Tavi’s working example? Your other challenges and saved inventions stay in the workshop.',{title:'Try a worked example?',accept:'Load the example'})){mutate(solvedTinkerProject(project.trialId));notice('Worked example loaded. Test it one tick at a time to see why it works.');}};
 for(const id of ['name','author'])$(id).onchange=()=>{if(mode!=='build')return;guard(()=>{const next=normalizeTinkerProject({...project,[id==='name'?'name':'author']:$(id).value});if(next.name!==project.name||next.author!==project.author)mutate(next);});render();};
 function showTab(id){stop();shareToken++;tab=id;dialog.dataset.psTab=id;for(const name of ['build','look','gallery','share']){$(name).hidden=name!==id;$('tab-'+name).setAttribute('aria-pressed',String(name===id));}notice('');if(id==='look')drawLook();if(id==='gallery'){$('gallery-family').value=String(project.version>=2?2:1);gallery();}if(id==='share')share();}
 for(const button of dialog.querySelectorAll('[data-ps-tab]'))button.onclick=()=>showTab(button.dataset.psTab);
 function drawLook(){const ctx=$('portrait').getContext('2d');ctx.fillStyle='#153743';ctx.fillRect(0,0,240,180);ctx.fillStyle='#52715e';ctx.fillRect(25,143,190,7);ctx.save();ctx.translate(64,20);drawWorkshopObject(ctx,{kind:'clockwork',x:0,y:0,look,mood:'pleased'},112);ctx.restore();}
 for(const [id,values,key]of [['paint',PIP_PAINTS,'paint'],['antenna',PIP_ANTENNAE,'antenna'],['scarf',PIP_SCARVES,'scarf']]){selectOptions($(id),values);$(id).value=look[key];$(id).onchange=()=>{look=normalizePipLook({...look,[key]:$(id).value});const ok=!wardrobe.failed&&savePipLook(storage,look);$('look-note').textContent=ok?'Pip is ready for the next adventure.':'Appearance kept for this visit; existing unreadable data is protected or saving is unavailable.';drawLook();paint();onLook();};}
 function gallery(){$('slots').replaceChildren(...(Number($('gallery-family').value)===2?journal.duoShowcase:journal.showcase).map((p,i)=>{const card=node('article','','ps-slot');card.append(node('p',`TRAILHOUSE DISPLAY ${i+1}`,'title-kicker'),node('h4',p?p.name:'An open shelf'),node('p',p?`${tinkerDefinition(p).title} · ${p.proof?.ticks||'draft'} ticks · ${p.parts.length} parts`:'Finish a test, then keep your favorite answer here.'));const load=node('button','Open this invention');load.disabled=!p;load.onclick=()=>openProject(p);const keep=node('button','Display current invention');keep.disabled=!project.proof||Number($('gallery-family').value)!==(project.version>=2?2:1);keep.onclick=async()=>{if(p&&!await confirmGame('Replace this display? The challenge’s personal bests are kept separately.',{title:'Update this shelf?',accept:'Display this invention'}))return;(project.version>=2?journal.duoShowcase:journal.showcase)[i]=project;save();gallery();};card.append(load,keep);return card;}));}
 function download(text,type,name){const url=URL.createObjectURL(new Blob([text],{type})),a=node('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 async function copy(text){try{await navigator.clipboard.writeText(text);notice('Copied. Send it to a friend to open in Tilewright.');}catch{$('code-details').open=true;$('code').value=text;$('code').focus();$('code').select();notice('Copy the selected text manually.');}}
 function share(){const trial=tinkerDefinition(project),code=tinkerCode(project),link=tinkerPlayLink(project,location.href);$('code').value=code;$('link').disabled=!link;$('world').disabled=!project.proof||trial.starts.length!==1;$('share-note').textContent=`${project.proof?'Verified working solution · '+project.proof.ticks+' ticks.':'Draft project · no working solution attached yet.'} ${trial.starts.length===2?'Two-companion adventures share as Pip projects and play links.':'A working single-companion project can also become an ordinary playable adventure.'}${!link?' Copy a code or download a file from this local copy; hosted copies also offer play links.':''}`;}
 $('export').onclick=()=>guard(()=>download(serializeTinkerProject(project),'application/json','pip-invention.json'));$('copy').onclick=()=>guard(()=>copy(tinkerCode(project)));$('link').onclick=()=>guard(()=>copy(tinkerPlayLink(project,location.href)));$('postcard').onclick=()=>{const art=node('canvas');art.width=450;art.height=445;paint(art,{postcard:true});art.toBlob(blob=>{if(blob)download(blob,'image/png','pip-invention.png');});};
 $('world').onclick=async()=>{const token=++shareToken;try{const world=compileTinkerAdventure(project);await verifyAdventureProof(world);if(token!==shareToken||!dialog.open)return;download(serializeAdventure(world),'application/json','pip-adventure.json');notice('Playable adventure downloaded with a verified creator clear. Import it in the main Workshop, or remix it into a longer story.');}catch(error){notice(error.message);}};
 async function openProject(next){stop();if(journal.drafts[next.trialId]&&serializeTinkerProject(journal.drafts[next.trialId])!==serializeTinkerProject(next)&&!await confirmGame(`Open “${next.name}” by ${next.author}? It replaces the current draft for this challenge. Other challenge drafts and saved inventions stay.`,{title:next.proof?'Verified invention ready':'Open an unfinished invention?',accept:'Open this invention'}))return false;loadProject(next);showTab('build');notice(next.proof?'Working solution verified. Test the invention to replay or change it.':'Draft opened. Tinker and test before sharing a working solution.');return true;}
 $('import').onclick=()=>guard(()=>openProject(parseTinkerCode($('import-code').value)));$('import-file').onclick=()=>$('file').click();$('file').onchange=async()=>{try{const file=$('file').files[0];if(!file)return;if(file.size>40_000)throw Error('Choose a Pip project smaller than 40 KB.');await openProject(parseTinkerProject(await file.text()));}catch(error){notice(error.message);}finally{$('file').value='';}};
 $('feedback-save').onclick=()=>download(JSON.stringify({format:'pip-playtest-feedback',version:1,trial:project.trialId,metrics:tinkerMetrics(project),feeling:$('feeling').value,comment:$('feedback-text').value.slice(0,400)},null,2)+'\n','application/json','pip-feedback.json');
 $('close').onclick=()=>dialog.close();$('home').onclick=()=>openHome(document.getElementById('title-pip'));dialog.addEventListener('close',()=>{
 // A queued native close can arrive after a share link reopens this dialog.
 if(dialog.open)return;
 stop();collections?.close();shareToken++;if(requestHome||homeOrigin){requestHome=false;homeOrigin=false;home.open(homeOpener||document.getElementById('title-pip'));return;}const target=opener?.getClientRects().length?opener:[document.getElementById('adventure-canvas'),document.getElementById('ws-pip-studio')].find(n=>n?.getClientRects().length&&!n.closest('[hidden]'));target?.focus({preventScroll:true});});document.addEventListener('visibilitychange',()=>{if(document.hidden&&auto)stop('Paused · Page away. Run when ready.');});
 dialog.addEventListener('keydown',e=>{if(e.key==='Escape'){if(e.repeat)e.preventDefault();else if(auto){e.preventDefault();stop('Paused · Choose Run when you are ready.');}else stop();}});
 window.addEventListener('blur',()=>{if(auto)stop('Paused · Window away. Run when ready.');});
 window.addEventListener('pagehide',()=>{if(auto)stop('Paused · Run when you return.');});
 for(const type of ['focusin','pointerdown'])dialog.addEventListener(type,e=>{if(auto&&!e.target.closest('#ps-canvas,#ps-run-tools,#ps-undo'))stop('Paused · Explore at your own pace.');});
 for(const [parent,label,id,target]of [['ws-lab','Visit Pip’s workshop','ws-pip-studio','build'],['ws-lab','Pip & Sprout · story & creator','ws-duo-adventures','duo'],['house-village','Your invention display','house-pip-studio','gallery']]){const button=node('button',label,'front-primary');button.id=id;button.onclick=()=>open(target==='duo'?'duo-first-letter':null,target==='duo'?'build':target,button);document.getElementById(parent)?.append(button);}
 function open(id=null,target='build',returnTo=document.activeElement){stop();opener=returnTo;if(id)loadProject(journal.drafts[id]||newTinkerProject(id));else render();$('home').hidden=homeOrigin;$('close').textContent=homeOrigin?'Adventure home':'Back';showTab(target);if(!dialog.open)dialog.showModal();dialog.scrollTop=0;$('close').focus({preventScroll:true});}
 $('gallery-family').onchange=gallery;for(const [i,id]of ['pip','sprout'].entries())$('actor-'+id).onclick=()=>{programActor=i;programUI();};
 duo=createDuoTools({dialog,getProject:()=>project,getState:()=>state,getMode:()=>mode,getCursor:()=>cursor,selectCursor:next=>{stop();cursor={...next};inspect();paint();},getJournal:()=>journal,setJournal:next=>journal=next,mutate,loadProject,openProject,save,notice,stop,guard,getPreferences,repaint:paint});
 rehearsal=createPipRehearsal({dialog,getProject:()=>project,stop,notice,onInspect(frame,prior){state=structuredClone(frame);history=prior;mode='test';if(state.status==='won'){project=clearTinkerProject(state);journal=keepTinkerResult(journal,project);save();}render();}});
 collections=createPipCollections({dialog,storage,getProject:()=>project,getState:()=>state,getMode:()=>mode,getJournal:()=>journal,openProject,onResume(restored){stop();state=restored.state;history=restored.history;mode=restored.testing?'test':'build';if(state.status==='won'){project=clearTinkerProject(state);journal=keepTinkerResult(journal,project);save();}render();},showShare:()=>showTab('share'),stop,notice});
 briefing.append($('best'));$('name-details').before($('chooser'),$('remix'));
 practice=createPipPractice({getLook:()=>look,stop});
 function openHome(returnTo=document.activeElement){stop();homeOpener=returnTo;if(dialog.open){requestHome=true;dialog.close();}else home.open(returnTo);}
 const fromHome=fn=>()=>{homeOrigin=true;fn();};
 home=createPipHome({getJournal:()=>journal,getProject:()=>project,getCollections:()=>collections.homeData(),getLook:()=>look,onExit:onHomeExit,getSaveIssue:()=>studioSaveFailed?(loaded.failed?'Some invention saves could not be read. Existing data is protected. Download projects to keep this visit.':'Invention saving is unavailable for this visit. Download projects before leaving.'):'',
  onMission:id=>{homeOrigin=true;collections.detach();open(id);},onCollection:(id,resume)=>{homeOrigin=true;open(null,'build');collections.openSaved(id,resume);},
  onCreate:fromHome(()=>{collections.detach();open('duo-creator');}),onLearn:fromHome(()=>{collections.detach();open('first-use');}),
  onBuilder:fromHome(()=>{open(null,'share');collections.showBuilder();}),
  onImport:kind=>{homeOrigin=true;open(null,'share');if(kind==='collection')collections.showBuilder(true);else{$('import-details').open=true;$('import-details').scrollIntoView({block:'start'});$('import-code').focus({preventScroll:true});}}
 });
 document.getElementById('title-pip').onclick=()=>openHome(document.getElementById('title-pip'));
 loadProject(project,false);
 return {get look(){return {...look};},get openNow(){return dialog.open||home.openNow||practice.openNow;},open,openHome,close(){homeOrigin=false;requestHome=false;practice.close();home.close();collections?.close();dialog.close();},openCollectionCode(code){open(null,'share');try{collections.openCode(code);}catch(error){notice(error.message);}},async openCode(code){open(null,'share');try{await openProject(parseTinkerCode(code));}catch(error){notice(error.message);}},stop,control(command){if(practice.openNow)return practice.control(command);if(home.openNow)return command==='undo';if(collections?.openNow)return command==='undo';if(!dialog.open||document.activeElement?.closest('dialog[open]')!==dialog)return false;if(command==='pause'&&tab==='build'&&mode==='test'){$('run').click();return true;}if(command==='back'&&auto){stop('Paused · Choose Run when ready.');return true;}if(command==='undo'){if(tab==='build')$('undo').click();return true;}if(document.activeElement===canvas&&['up','right','down','left','interact'].includes(command)){const key={up:'ArrowUp',right:'ArrowRight',down:'ArrowDown',left:'ArrowLeft',interact:' '}[command];canvas.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true}));return true;}return false;}};
}
