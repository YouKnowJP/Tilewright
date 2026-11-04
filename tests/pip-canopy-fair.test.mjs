import test from 'node:test';
import assert from 'node:assert/strict';
import {CANOPY_FAIR_MISSIONS} from '../src/pip-canopy-fair.mjs';
import {DUO_CHANNELS,newDuoProject,remixDuoProject,duoReadiness} from '../src/pip-duo.mjs';
import {solvedTinkerProject,startTinker,tinkerStep,clearTinkerProject,normalizeTinkerProject,editTinkerProject,placeTinkerPart,serializeTinkerProject,parseTinkerProject,tinkerCode,parseTinkerCode} from '../src/pip-tinker.mjs';
import {duoBlueprint,normalizeDuoBlueprint,placeDuoBlueprint,captureDuoBlueprint,serializeDuoBlueprint,parseDuoBlueprint} from '../src/pip-duo-blueprints.mjs';
import {duoBlueprintLinks,rewireDuoBlueprint,unusedDuoBlueprintLinks,duoBlueprintPlacements} from '../src/pip-blueprint-links.mjs';
import {transformDuoGarden} from '../src/pip-garden-tools.mjs';
import {loadPipStudio,savePipStudio,keepDuoBlueprint,keepDuoAdventure} from '../src/pip-duo-storage.mjs';
const R=['right','right','use'],W=['wait','wait','use'];
function run(project){let state=startTinker(project);while(state.status==='playing')state=tinkerStep(state);return state;}
function frames(project){let state=startTinker(project);const trace=[state];while(state.status==='playing'){const before=structuredClone(state),previous=state;state=tinkerStep(state);assert.deepEqual(previous,before);assert.notDeepEqual(state.bots.map(b=>[b.x,b.y])[0],state.bots.map(b=>[b.x,b.y])[1]);trace.push(state);}return trace;}

for(const [i,mission] of CANOPY_FAIR_MISSIONS.entries())test(`Canopy ${mission.id}: necessary repairs, complete goals and portable clear`,()=>{
 const project=solvedTinkerProject(mission.id),before=structuredClone(project),trace=frames(project),end=trace.at(-1);
 assert.equal(end.status,'won');assert.equal(end.ticks,[66,36,42,61][i]);assert.equal(project.parts.length,mission.budget);assert.equal(duoReadiness(project).ready,true);assert.ok(end.transfers>=mission.handoffs);assert.ok(end.lockerTransfers>=mission.relays);if(mission.emptyLockers)assert.deepEqual(end.lockers,{});
 assert.equal(run(newDuoProject(mission.id)).status,'limit');for(const removed of project.parts){const incomplete=editTinkerProject(project,{parts:project.parts.filter(p=>p!==removed)});assert.equal(run(incomplete).status,'limit',`Every supplied repair matters: ${removed.kind} at ${removed.x},${removed.y}`);}
 assert.deepEqual(clearTinkerProject(end),project);assert.deepEqual(parseTinkerProject(serializeTinkerProject(project)),project);assert.deepEqual(parseTinkerCode(tinkerCode(project)),project);assert.equal(run(remixDuoProject(project)).ticks,end.ticks);assert.throws(()=>normalizeTinkerProject({...project,proof:{ticks:end.ticks-1}}));assert.throws(()=>editTinkerProject(project,{parts:[...project.parts,project.parts[0]]}));assert.deepEqual(project,before);
});
for(const mission of CANOPY_FAIR_MISSIONS)test(`Canopy ${mission.id}: mirrors and palette changes retain a working adventure`,()=>{
 const project=remixDuoProject(solvedTinkerProject(mission.id));for(const operation of ['horizontal','vertical','palette']){const result=run(transformDuoGarden(project,operation));assert.equal(result.status,'won');assert.equal(result.ticks,run(project).ticks);}
});
test('the waiting bell reads Pip’s handoff on the same tick and waits again between deliveries',()=>{
 const trace=frames(solvedTinkerProject('duo-patient-bell'));
 assert.match(trace[6].bots[1].last,/Otherwise/);assert.equal(trace[6].bots[1].y,4);assert.equal(trace[9].transfers,1);assert.equal(trace[9].bots[1].parcel,'jade');assert.match(trace[9].bots[1].last,/Matching/);assert.equal(trace[24].bots[1].parcel,null);assert.match(trace[24].bots[1].last,/Otherwise/);assert.equal(trace[33].transfers,2);
});
test('the rain bridge stays held through every outward and returning crossing',()=>{
 const trace=frames(solvedTinkerProject('duo-rain-bridge'));for(const s of trace.slice(2))assert.deepEqual([s.bots[0].x,s.bots[0].y],[3,1]);for(const tick of [5,24,35])assert.deepEqual([trace[tick].bots[1].x,trace[tick].bots[1].y],[5,5]);assert.equal(trace[12].status,'playing');assert.equal(trace[42].status,'won');
});
test('the canopy finale waits for both return flags after every letter and relay is complete',()=>{
 const trace=frames(solvedTinkerProject('duo-canopy-homecoming'));assert.equal(trace[57].status,'playing');assert.equal(trace[57].lockerTransfers,4);assert.deepEqual(trace[57].lockers,{});assert.equal(Object.values(trace[57].received).reduce((a,b)=>a+b,0),4);assert.equal(trace[60].status,'playing');assert.deepEqual(trace[61].bots.map(b=>[b.x,b.y]),[[1,0],[11,0]]);
});
function mixedPiece(){
 return normalizeDuoBlueprint({format:'pip-duo-blueprint',version:2,name:'A connected atelier',author:'Pip',note:'Independent link numbers.',width:9,height:5,road:Array.from({length:45},(_,i)=>({x:i%9,y:Math.floor(i/9)})),parts:[
  {kind:'source',x:0,y:0,channel:'amber'},{kind:'press',x:2,y:0,channel:'amber',output:'jade'},{kind:'receiver',x:4,y:0,channel:'jade',parcels:2},{kind:'signal',x:8,y:0,channel:'amber',program:R,alternate:W},
  ...[0,2].map(x=>({kind:'tube',x,y:2,channel:'amber'})),{kind:'locker',x:4,y:2,channel:'amber',mode:'send'},{kind:'locker',x:6,y:2,channel:'amber',mode:'take'},{kind:'plate',x:8,y:2,channel:'amber'},{kind:'cargo',x:8,y:4,channel:'any',program:W,alternate:R}
 ]});
}
test('blueprint wiring changes only complete tube and locker connections, preserving recipes and programs',()=>{
 const piece=mixedPiece(),before=structuredClone(piece),wired=rewireDuoBlueprint(piece,{tube:{amber:'blue'},locker:{amber:'jade'}});
 assert.deepEqual(duoBlueprintLinks(wired),[{kind:'tube',channel:'blue',ends:2},{kind:'locker',channel:'jade',ends:2}]);assert.deepEqual(wired.parts.filter(p=>!['tube','locker'].includes(p.kind)),piece.parts.filter(p=>!['tube','locker'].includes(p.kind)));assert.deepEqual(wired.parts.filter(p=>p.kind==='locker').map(p=>p.mode),['send','take']);assert.deepEqual(rewireDuoBlueprint(piece),piece);assert.deepEqual(parseDuoBlueprint(serializeDuoBlueprint(wired)),wired);assert.deepEqual(piece,before);
});
test('wiring supports atomic swaps and refuses merged, unknown or malformed connection maps',()=>{
 const first=duoBlueprint('tube-pair'),piece=normalizeDuoBlueprint({...first,width:7,road:[...first.road,...first.road.map(p=>({...p,x:p.x+4}))],parts:[...first.parts,...first.parts.map(p=>({...p,x:p.x+4,channel:'jade'}))]});
 assert.deepEqual(rewireDuoBlueprint(piece,{tube:{amber:'jade',jade:'amber'}}).parts.map(p=>p.channel),['jade','jade','amber','amber']);for(const map of [{tube:{amber:'jade'}},{tube:{blue:'amber'}},{tube:{amber:'pink'}},{tube:[]},{tube:null},{signal:{}},null,[]])assert.throws(()=>rewireDuoBlueprint(piece,map));
});
test('all tube numbers can be rebound without upgrading older blueprint bytes',()=>{
 const piece=duoBlueprint('tube-pair');for(const channel of DUO_CHANNELS){const wired=rewireDuoBlueprint(piece,{tube:{amber:channel}});assert.equal(wired.version,1);assert.ok(wired.parts.every(p=>p.channel===channel));assert.deepEqual(parseDuoBlueprint(serializeDuoBlueprint(wired)),wired);}assert.equal(serializeDuoBlueprint(rewireDuoBlueprint(piece)),serializeDuoBlueprint(piece));
});
test('unused connections preserve free source numbers and treat tubes and lockers as separate networks',()=>{
 let project=placeDuoBlueprint(newDuoProject('duo-creator',{width:13,height:9}),duoBlueprint('tube-pair'),1,1);project=placeDuoBlueprint(project,duoBlueprint('locker-pair',{channel:'jade'}),1,3);
 const piece=mixedPiece(),before=structuredClone(project),map=unusedDuoBlueprintLinks(project,piece);assert.equal(map.tube.amber,'jade');assert.equal(map.locker.amber,'amber');assert.deepEqual(project,before);assert.equal(rewireDuoBlueprint(piece,map).parts.find(p=>p.kind==='source').channel,'amber');
 const two={...duoBlueprint('tube-pair'),width:7,road:[{x:0,y:0},{x:2,y:0},{x:4,y:0},{x:6,y:0}],parts:[{kind:'tube',x:0,y:0,channel:'amber'},{kind:'tube',x:2,y:0,channel:'amber'},{kind:'tube',x:4,y:0,channel:'jade'},{kind:'tube',x:6,y:0,channel:'jade'}]};assert.deepEqual(unusedDuoBlueprintLinks(project,two).tube,{amber:'violet',jade:'jade'});
});
test('unused-link suggestions fail atomically when every network number is occupied',()=>{
 let project=newDuoProject('duo-creator',{width:13,height:9});for(const [i,channel]of DUO_CHANNELS.entries())project=placeDuoBlueprint(project,duoBlueprint('tube-pair',{channel}),1,1+i);const before=structuredClone(project);assert.throws(()=>unusedDuoBlueprintLinks(project,duoBlueprint('tube-pair')),/0 unused/);assert.deepEqual(project,before);assert.throws(()=>unusedDuoBlueprintLinks(solvedTinkerProject('duo-first-letter'),duoBlueprint('tube-pair')),/Remix/);
});
test('space search enforces geometry, occupied stations and connection caps without editing the garden',()=>{
 let project=remixDuoProject(solvedTinkerProject('duo-first-letter')),piece=duoBlueprint('tube-pair'),before=structuredClone(project),places=duoBlueprintPlacements(project,piece);assert.ok(places.length);assert.deepEqual(places[0],{x:0,y:0});assert.deepEqual(project,before);for(const p of places){assert.ok(p.x>=0&&p.y>=0&&p.x+piece.width<=project.board.width&&p.y+piece.height<=project.board.height);assert.doesNotThrow(()=>placeDuoBlueprint(project,piece,p.x,p.y));}assert.ok(!places.some(p=>p.x===3&&p.y===3));
 project=placeDuoBlueprint(project,piece,0,0);assert.deepEqual(duoBlueprintPlacements(project,piece),[]);piece=rewireDuoBlueprint(piece,unusedDuoBlueprintLinks(project,piece));assert.ok(duoBlueprintPlacements(project,piece).length);assert.throws(()=>duoBlueprintPlacements(solvedTinkerProject('duo-first-letter'),piece),/Remix/);
 const huge=normalizeDuoBlueprint({...duoBlueprint('recipe'),width:13});assert.deepEqual(duoBlueprintPlacements(newDuoProject(),huge),[]);
});
test('manual locker wiring can intentionally complete an existing one-ended connection',()=>{
 let project=placeTinkerPart(newDuoProject(),'locker',2,2,{channel:'blue',mode:'send'});const raw=duoBlueprint('locker-pair'),single=normalizeDuoBlueprint({...raw,width:1,road:[{x:0,y:0}],parts:[{kind:'locker',x:0,y:0,channel:'amber',mode:'take'}]}),piece=rewireDuoBlueprint(single,{locker:{amber:'blue'}});project=placeDuoBlueprint(project,piece,5,4);assert.equal(project.parts.filter(p=>p.kind==='locker'&&p.channel==='blue').length,2);assert.deepEqual(duoBlueprintPlacements(project,piece),[]);
});
test('the waiting-bell template creates a real two-handoff adventure',()=>{
 let project=newDuoProject('duo-creator',{width:13,height:9});project={...project,starts:[{x:1,y:5},{x:7,y:4}]};project=placeDuoBlueprint(project,duoBlueprint('waiting-bell',{channel:'jade',parcels:2}),7,0);for(const part of [{kind:'source',x:3,y:5,channel:'amber'},{kind:'press',x:5,y:5,channel:'amber',output:'jade'},{kind:'handoff',x:7,y:5},{kind:'prism',x:1,y:5,operation:'mirror'},{kind:'prism',x:9,y:5,operation:'mirror'}])project=placeTinkerPart(project,part.kind,part.x,part.y,part);project=editTinkerProject(project,{programs:[R,W],handoffs:2});assert.equal(run(project).ticks,36);assert.equal(run(project).status,'won');
});
test('the corner-atelier template turns a configured recipe route into a real delivery',()=>{
 let project=newDuoProject('duo-creator',{width:13,height:9});project={...project,starts:[{x:1,y:3},{x:11,y:7}]};const piece=duoBlueprint('turning-atelier',{input:'violet',output:'blue'});project=placeDuoBlueprint(project,piece,3,3);project=editTinkerProject(project,{programs:[R,W]});const state=run(project);assert.equal(state.status,'won');assert.equal(state.ticks,12);assert.deepEqual(captureDuoBlueprint(project,{x:3,y:3,width:5,height:3},piece.name).parts,piece.parts);assert.throws(()=>duoBlueprint('turning-atelier',{input:'blue',output:'blue'}));
});
test('new story clears, custom adventures and rewired pieces survive a journal reload',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};let journal=loadPipStudio(storage).journal;for(const m of CANOPY_FAIR_MISSIONS)journal.drafts[m.id]=solvedTinkerProject(m.id);journal=keepDuoAdventure(journal,remixDuoProject(journal.drafts['duo-canopy-homecoming'])).journal;journal=keepDuoBlueprint(journal,rewireDuoBlueprint(mixedPiece(),{tube:{amber:'blue'},locker:{amber:'violet'}}));assert.ok(savePipStudio(storage,journal,3));const loaded=loadPipStudio(storage);assert.equal(loaded.failed,false);assert.deepEqual(loaded.journal,journal);assert.equal(run(loaded.journal.adventures[0].project).status,'won');
});
