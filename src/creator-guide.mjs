import { drawAtlasArt, CHAPTERS } from './adventure-art.mjs';

const PAGES = [
  { title: 'Give someone a reason to wander.', theme: 'woodland', lead: 'A good first world needs a beginning, a little discovery, and a way home.',
    steps: [['Choose your canvas', 'Paint terrain in Mapmaker, or use a blank, seeded, or remixed adventure in the Workshop. Build adventure copies terrain without changing your original map.'],
      ['Leave a trail of light', 'Place one starting point, one exit beacon, and at least one lantern. Your player restores every lantern before reaching the beacon.'],
      ['Make it yours', 'Choose a brush and paint. Inspect an object to edit it. World notes hold your invitation, opening story, specialist tools, ending, and hints.']] },
  { title: 'One crossing. More than one answer.', theme: 'marsh', lead: 'Interesting worlds ask the player to notice a possibility, then try it.',
    steps: [['Link a small puzzle', 'A plate holds bridges on its channel open. A lever opens its channel’s doors and cools its embers. Use the same channel at both ends. Stamps give you a starting arrangement.'],
      ['Leave room for another idea', 'A crate lasts; a lantern double buys time. Paired waystones offer a different crossing when a specialist kit is selected. Check that the player can also get home.'],
      ['Give the world a voice', 'A keeper can offer advice, supplies, or a choice that opens a route. Rescue keepers follow after all lights are restored. Relics must be carried to the beacon.']] },
  { title: 'Play it. Then pass on the light.', theme: 'coast', lead: 'A finished world is a story another player can actually complete.',
    steps: [['Read the world checks', 'Missing goals, overlapping objects, broken channels, and disconnected paths appear in Checks. A connected map can still contain a puzzle deadlock.'],
      ['Walk your own adventure', 'Playtest on Trail or Nemesis. Reach a real finish to record a creator clear. Watch the replay to review your route; changing the world removes its old clear. Test return routes and alternate choices too.'],
      ['Send a world to a friend', 'Save to your shelf, then Share a file or code. Your friend opens Workshop → Import & play. Hosted copies can share smaller play links. Keep downloaded backups; browser saves stay on this device.']] },
];
export function createCreatorGuide() {
  const dialog = document.getElementById('creator-guide-dialog'), $ = id => document.getElementById(`creator-guide-${id}`);
  let page = 0, returnTo = null;
  function render() {
    const data = PAGES[page]; drawAtlasArt($('art'), CHAPTERS.find(t => t.id === data.theme)); $('title').textContent = data.title;
    const lead = Object.assign(document.createElement('p'), { className:'creator-guide-lead',textContent:data.lead });
    $('copy').replaceChildren(lead,...data.steps.map(([title,text],index) => {
      const section=document.createElement('section'),number=document.createElement('span'),heading=document.createElement('h3'),p=document.createElement('p');number.textContent=String(index+1).padStart(2,'0');heading.textContent=title;p.textContent=text;section.append(number,heading,p);return section;
    }));
    document.querySelectorAll('[data-creator-page]').forEach(button => button.setAttribute('aria-pressed',String(Number(button.dataset.creatorPage)===page)));
    $('position').textContent=`${page+1} / ${PAGES.length}`; $('next').textContent=page===2?'Back to creating':'Next chapter';
    dialog.scrollTo(0,0);
  }
  $('close').onclick=()=>dialog.close();$('next').onclick=()=>{if(page===2)dialog.close();else{page++;render();}};
  document.querySelectorAll('[data-creator-page]').forEach(button=>{button.onclick=()=>{page=Number(button.dataset.creatorPage);render();};});
  dialog.addEventListener('close',()=>{if(returnTo?.isConnected&&returnTo.getClientRects().length)returnTo.focus({preventScroll:true});});
  return { open(trigger=document.activeElement) {returnTo=trigger;page=0;render();if(!dialog.open)dialog.showModal();}, close(){if(dialog.open)dialog.close();} };
}
