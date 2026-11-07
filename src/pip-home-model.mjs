// New owned material. See LICENSE; prior MIT permissions remain effective.
import {DUO_STORIES} from './pip-duo.mjs';

export const PIP_REGIONS = Object.freeze([
 ['adventures','The first letters'],['night-mail','The Night Post'],['dawn-workshop','Dawn Workshop'],
 ['canopy-fair','The Canopy Fair'],['after-hours','Canopy After Hours'],['clocktower','The Clocktower Ledger'],
 ['star-atlas','Star Atlas'],['lantern-workshop','Lantern Workshop'],['bellkeeper','The Bellkeeper'],['sealkeeper','The Sealkeepers'],['rainwright','The Rainwrights'],['tidekeeper','The Tidekeepers'],['balancekeeper','The Balancekeepers'],['echo-post','The Echo Post'],['mixing-house','The Mixing House'],['kiln-house','The Kilnkeepers'],['weave-house','The Weavekeepers'],['drum-house','The Drumkeepers'],['rest-house','The Wayside Keepers'],['wind-house','The Windward Post']
].map(([id,name])=>Object.freeze({id,name})));
const labels = {handoff:'Teamwork',press:'Recipes & presses',prism:'Compass prisms',flip:'Route memories',plate:'Pressure plates',bridge:'Shared bridges',locker:'Parcel lockers',cargo:'Cargo compasses',tube:'Tube journeys',signal:'Signal stamps',latch:'Remembered lights',pulse:'Timed bells',seal:'Passport checks',tide:'Automatic tides',scale:'Cargo scales',echo:'Borrowed route cards',mixer:'Mixing recipes',kiln:'Powered recipes',weave:'Two-source circuits',drum:'Remembered power beats',rest:'Rest Stones & pacing',vane:'Wind Vanes & walking turns'};
export function pipMissionTags(mission) {
 const kinds = new Set([...mission.fixed,...(mission.solutionParts||[])].map(p=>p.kind));
 return Object.entries(labels).filter(([kind])=>kinds.has(kind)).map(([,label])=>label);
}
export function pipAdventureCards(journal,{region='all',filter='all',query=''}={}) {
 if(region!=='all'&&!PIP_REGIONS.some(r=>r.id===region))throw Error('Choose an adventure region.');
 if(!['all','unfinished','cleared','saved'].includes(filter))throw Error('Choose a progress filter.');
 const words=String(query).trim().toLowerCase().slice(0,80).split(/\s+/).filter(Boolean);
 return DUO_STORIES.map(m=>({id:m.id,title:m.title,chapter:m.chapter,region:m.collection,difficulty:m.difficulty,minutes:m.minutes,tags:pipMissionTags(m),cleared:Boolean(journal.bests[m.id]?.some(p=>p.proof)),saved:Boolean(journal.drafts[m.id])}))
  .filter(m=>(region==='all'||m.region===region)&&(filter==='all'||filter==='unfinished'&&!m.cleared||filter==='cleared'&&m.cleared||filter==='saved'&&m.saved)&&words.every(w=>`${m.title} ${m.difficulty} ${m.tags.join(' ')} ${PIP_REGIONS.find(r=>r.id===m.region)?.name}`.toLowerCase().includes(w)));
}
export function pipSuggestedMission(journal) {
 return DUO_STORIES.find(m=>!journal.bests[m.id]?.some(p=>p.proof)) || DUO_STORIES[0];
}
export function pipSavedSetup(journal,currentId) {
 const ids=DUO_STORIES.map(m=>m.id),has=id=>ids.includes(id)&&journal.drafts[id];
 const id=has(currentId)?currentId:Object.keys(journal.drafts).reverse().find(has);
 return id?{id,title:DUO_STORIES.find(m=>m.id===id).title}:null;
}
