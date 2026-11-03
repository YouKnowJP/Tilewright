import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {GARDEN_LEVELS as ids,GARDEN_CLEARS as clears,gardenWorld,gardensBook} from '../src/pip-gardens-worlds.mjs';
import {glassworksWorld} from '../src/pip-glassworks-worlds.mjs';
import {createRun,stepRun,resultFor,missionGoals,canEnter,walkableCells} from '../src/adventure.mjs';
import {checkAdventure,adventureStage,editAdventure,placeObject,blankAdventure,verifyAdventureProof} from '../src/workshop-model.mjs';
import {serializeAdventure,parseAdventure,adventurePlayLink,parseAdventureCode} from '../src/workshop-sharing.mjs';
import {serializeBook,parseBook} from '../src/storybook-model.mjs';
import {clockworkSignal,clockworkRoutes,clockworkBankLabel,clockworkRehearsal,CLOCKWORK_COMMANDS} from '../src/clockwork.mjs';
import {workshopBlueprints,copyBlueprint} from '../src/workshop-blueprints.mjs';
import {captureAssembly,serializeAssembly,parseAssembly,pasteAssembly,mirrorAssembly,rotateAssembly,loadAssemblies,saveAssemblies,MAX_ASSEMBLIES} from '../src/workshop-assemblies.mjs';
import {transformAdventure} from '../src/workshop-lab.mjs';
import {rotateRoom} from '../src/adventure-wonders.mjs';
import {surroundings,mapMarkers} from '../src/adventure-accessibility.mjs';
import {beginRewind,advanceRewind,undoRewind,serializeTrail,restoreTrail,runFingerprint} from '../src/adventure-rewind.mjs';
import {trailReview,inspectReview,reviewFrame} from '../src/adventure-reviews.mjs';
const start=(id='two-ways-home')=>createRun(adventureStage(gardenWorld(id)));
const at=(r,stamp=r.stage.clockworkStamps[0])=>({...r,clockwork:{...r.clockwork,x:stamp.x,y:stamp.y,program:['use','wait','wait'],index:0}});
function manual(actions){let running=false;return actions.flatMap(a=>{if(a==='clockwork-toggle'){running=!running;return [];}return [running&&['up','right','down','left','wait'].includes(a)?'clockwork-step':a];});}
for(const id of ids)for(const difficulty of ['trail','nemesis'])test(`Gardens ${id} has a three-star ${difficulty} clear and portable proof`,async()=>{
 const w=gardenWorld(id),before=structuredClone(w),c=checkAdventure(w);assert.deepEqual(c.errors,[]);let r=createRun(c.stage,{difficulty});for(const a of clears[id])r=stepRun(r,a);
 assert.equal(r.status,'won');assert.equal(resultFor(r).stars,3);assert.ok(missionGoals(r).every(g=>g.done));assert.equal(r.clockwork.running,false);assert.equal(r.clockwork.rewritesUsed,1);
 assert.equal((await verifyAdventureProof(w)).status,'won');assert.equal(w.version,13);assert.deepEqual(parseAdventure(serializeAdventure(w)),w);assert.deepEqual(parseAdventureCode(adventurePlayLink(w,'https://youknowjp.github.io/Tilewright/')),w);assert.deepEqual(w,before);
});
for(const id of ids)for(const difficulty of ['trail','nemesis'])test(`Gardens ${id} permits an all-treasure ${difficulty} route`,()=>{
 const w=editAdventure(gardenWorld(id,{proof:false}),{rules:{allCoins:true}});let r=createRun(adventureStage(w),{difficulty}),i=0;while(!r.collectedLanterns.length&&i<clears[id].length)r=stepRun(r,clears[id][i++]);assert.ok(r.collectedLanterns.length);
 const d=w.map.height-2-r.player.y;for(const a of ['right','right','up',...Array(d+1).fill('down'),...Array(d).fill('up'),'left','left',...clears[id].slice(i)])r=stepRun(r,a);assert.equal(r.status,'won');assert.equal(r.collectedCoins.length,2);assert.equal(resultFor(r).stars,3);
});
// Manual alternatives keep keeper moves in the finale while Pip is paused.
for(const id of ids.filter(id=>id!=='clockwork-gardens'))for(const difficulty of ['trail','nemesis'])test(`Gardens ${id} supports paused single-card ${difficulty} play`,()=>{
 let r=createRun(adventureStage(gardenWorld(id)),{difficulty});for(const a of manual(clears[id]))r=stepRun(r,a);assert.equal(r.status,'won');assert.equal(resultFor(r).stars,3);
});
for(const difficulty of ['trail','nemesis'])test(`Gardens finale supports an explicit paused ${difficulty} alternative`,()=>{
 const w=gardenWorld('clockwork-gardens'),program=clears['clockwork-gardens'][0],prep=['up',...Array(4).fill('right'),'down','left','left',...Array(4).fill('right')];let r=createRun(adventureStage(w),{difficulty});
 for(const a of [program,...Array(54).fill('clockwork-step'),...prep,'interact:home-note',...Array(153).fill('clockwork-step'),...Array(11).fill('right'),...Array(15).fill('left'),'up','left','left','down','down'])r=stepRun(r,a);assert.equal(r.status,'won');assert.equal(resultFor(r).stars,3);
});
test('flip Use loads A then B, holds the tile and restarts card one without spending rewrites',()=>{
 const input=at(start()),before=structuredClone(input),stamp=input.stage.clockworkStamps[0],a=stepRun(input,'clockwork-step');assert.deepEqual(a.clockwork.program,stamp.program);assert.equal(a.clockwork.index,0);assert.equal(a.clockwork.rewritesUsed,0);assert.equal(clockworkSignal(a,stamp),true);assert.deepEqual(clockworkRoutes(a,stamp),['quiet']);assert.match(a.message,/Route A/);assert.deepEqual([a.clockwork.x,a.clockwork.y],[stamp.x,stamp.y]);
 const b=stepRun(at(a),'clockwork-step');assert.deepEqual(b.clockwork.program,stamp.alternate);assert.equal(clockworkSignal(b,stamp),false);assert.deepEqual(clockworkRoutes(b,stamp),['quiet','powered']);assert.ok(missionGoals(b).find(g=>g.label.includes('Garden sign')).done);assert.deepEqual(input,before);
});
test('starting B, retained cargo and independent stamps do not read shared plate signals',()=>{
 const b=at(start('pendulum-post')),s=b.stage.clockworkStamps[0];assert.equal(clockworkSignal(b,s),true);const next=stepRun(b,'clockwork-step');assert.deepEqual(next.clockwork.program,s.alternate);assert.equal(clockworkSignal(next,s),false);
 let r=start('clockwork-gardens');const [first,second]=r.stage.clockworkStamps;r={...at(r),clockwork:{...at(r).clockwork,parcel:'violet'}};r=stepRun(r,'clockwork-step');assert.equal(r.clockwork.parcel,'violet');assert.equal(clockworkSignal(r,second),false);assert.equal(clockworkSignal(r,first),true);
 const before=structuredClone(r);for(let i=0;i<8;i++)assert.equal(clockworkSignal(r,first),true);assert.deepEqual(r,before);
});
test('remembered bits and both-route records remain bounded across repeated visits and own prototype IDs',()=>{
 const w=gardenWorld('two-ways-home',{proof:false}),changed=editAdventure(w,{markers:w.markers.map(m=>m.kind==='pip-flip'?{...m,id:'constructor'}:m)});let r=createRun(adventureStage(changed));for(let i=0;i<101;i++)r=stepRun(at(r),'clockwork-step');assert.deepEqual(r.clockwork.flips,{constructor:true});assert.deepEqual(r.clockwork.routed.constructor,['quiet','powered']);assert.deepEqual(r.clockwork.stamped,['constructor']);
});
test('walking, waiting and unrelated Use do not turn a paused sign; loaded cards stay latched',()=>{
 let r=stepRun(at(start()),'clockwork-step');const program=[...r.clockwork.program],flips=structuredClone(r.clockwork.flips);for(const a of ['right','left','wait'])r=stepRun(r,a);assert.deepEqual(r.clockwork.flips,flips);assert.deepEqual(r.clockwork.program,program);
 r={...r,clockwork:{...r.clockwork,x:2,y:4,index:0,program:['use','wait','wait']}};r=stepRun(r,'clockwork-step');assert.deepEqual(r.clockwork.flips,flips);
});
test('all 216 free rehearsal drafts leave next banks, records, rewrites and inventory unchanged',()=>{
 const r=at(start()),before=structuredClone(r);for(const a of CLOCKWORK_COMMANDS)for(const b of CLOCKWORK_COMMANDS)for(const c of CLOCKWORK_COMMANDS)assert.equal(clockworkRehearsal(r,canEnter,[a,b,c]).length,6);assert.match(clockworkRehearsal(r,canEnter,['use','wait','wait'])[0].result,/Route A/);assert.deepEqual(r,before);
});
test('dock returns restore each starting bank, clear goals and keep cards and spent rewrites; Undo reverses it',()=>{
 for(const id of ['two-ways-home','pendulum-post']){const w=gardenWorld(id,{proof:false}),open=editAdventure(w,{markers:w.markers.map(m=>m.kind==='clockwork'?{...m,dockLocked:false}:m)});let t=beginRewind(createRun(adventureStage(open)),{kind:'world',world:open,origin:'shelf'});for(const a of manual(clears[id]).slice(0,4))t=advanceRewind(t,a);const fingerprint=runFingerprint(t.run),returned=advanceRewind(t,'clockwork-reset');assert.deepEqual(returned.run.clockwork.flips,{});assert.deepEqual(returned.run.clockwork.routed,{});assert.deepEqual(returned.run.clockwork.program,t.run.clockwork.program);assert.equal(returned.run.clockwork.rewritesUsed,1);assert.equal(clockworkSignal(returned.run,returned.run.stage.clockworkStamps[0]),id==='pendulum-post');assert.equal(runFingerprint(undoRewind(returned).run),fingerprint);}
});
test('flip stamps share the eight-program-station cap, need two valid programs and need no external source',()=>{
 const w=gardenWorld('two-ways-home',{proof:false});assert.equal(checkAdventure(w).ready,true);for(const patch of [{program:['up']},{alternate:['fly','wait','use']}])assert.throws(()=>editAdventure(w,{markers:w.markers.map(m=>m.kind==='pip-flip'?{...m,...patch}:m)}));
 const many=[...w.markers,...Array.from({length:8},(_,i)=>({kind:'pip-flip',id:'extra-'+i,x:i+1,y:8}))];assert.match(checkAdventure({...w,markers:many}).errors.join(' '),/eight program stamps/);
 const stage=adventureStage(w);assert.throws(()=>createRun({...stage,clockworkStamps:stage.clockworkStamps.map(s=>({...s,alternate:undefined}))}),/two programs/);assert.throws(()=>createRun({...stage,clockworkStamps:stage.clockworkStamps.map(s=>({...s,initial:'B'}))}),/starting route/);
});
test('repaint, whole-map transforms, assembly mirrors and room turns retain banks and starting state',()=>{
 const w=gardenWorld('pendulum-post',{proof:false}),before=structuredClone(w),p=placeObject(w,'pip-flip',4,4).markers.find(m=>m.kind==='pip-flip');assert.equal(p.initial,true);assert.deepEqual(p.program,['left','left','use']);assert.equal(p.both,true);
 let turned=w;for(let i=0;i<4;i++)turned=transformAdventure(turned,'rotate');assert.deepEqual(turned,w);assert.deepEqual(transformAdventure(transformAdventure(w,'mirror-x'),'mirror-x'),w);
 const a=workshopBlueprints()[0].piece;assert.deepEqual(rotateAssembly(a,1).markers.find(m=>m.kind==='pip-flip').program,['right','right','use']);assert.equal(mirrorAssembly(a).markers.find(m=>m.kind==='pip-flip').alternate[0],'left');assert.deepEqual(w,before);
 let r=stepRun(at(start()),'clockwork-step');r={...r,wonders:{rotations:{},vaults:[],security:0,treasure:0,fired:[],dialogue:{}}};const original=structuredClone(r);for(let n=0;n<4;n++)r=rotateRoom(r,{id:'room',x:4,y:4,radius:1},walkableCells);assert.deepEqual(r.stage.clockworkStamps,original.stage.clockworkStamps);assert.deepEqual(r.clockwork,original.clockwork);
});
test('Z cues describe the next bank, both engraved programs and route history without relying on colour',()=>{
 const r=at(start());r.seen.fill(1);assert.equal(mapMarkers(r).find(p=>p.label==='Z').number,'1');assert.match(JSON.stringify(surroundings({...r,player:{x:4,y:4}})),/Flip stamp Z1.*Route A next.*Route B/);assert.equal(clockworkBankLabel(r.stage.clockworkStamps[0],'powered'),'Route B');
});
test('blueprints are complete portable originals, independently copied and bounded to twelve slots',()=>{
 const all=workshopBlueprints();assert.equal(all.length,4);for(const {id,piece}of all){assert.deepEqual(parseAssembly(serializeAssembly(piece)),piece);const copied=copyBlueprint([],id);assert.deepEqual(copied,[piece]);copied[0].map.layers[0].tiles[0]=0;assert.notDeepEqual(copied[0],workshopBlueprints().find(b=>b.id===id).piece);}
 let items=[];for(let i=0;i<MAX_ASSEMBLIES;i++)items=copyBlueprint(items,all[0].id);const before=structuredClone(items);assert.throws(()=>copyBlueprint(items,all[0].id),/twelve/);assert.throws(()=>copyBlueprint(items,'constructor'),/Choose/);assert.deepEqual(items,before);
});
test('blueprint placement remaps full tube/parcel networks and fresh IDs, leaving source pieces untouched',()=>{
 for(const {piece}of workshopBlueprints()){const before=structuredClone(piece),target=blankAdventure(24,24),placed=pasteAssembly(target,piece,{x:10,y:10},1,'x');assert.equal(placed.markers.length,target.markers.length+piece.markers.length);assert.deepEqual(piece,before);assert.equal(new Set(placed.markers.map(m=>m.id)).size,placed.markers.length);}
 const a=workshopBlueprints()[0].piece,w=blankAdventure(24,24),once=pasteAssembly(w,a,{x:10,y:10}),twice=pasteAssembly(once,a,{x:15,y:10});assert.equal(twice.markers.filter(m=>m.kind==='pip-flip').length,2);assert.deepEqual(twice.markers.filter(m=>m.kind==='bell').map(m=>m.order),[1,2]);
 let raw;const storage={getItem:()=>raw,setItem:(_k,v)=>raw=v};assert.equal(saveAssemblies(storage,copyBlueprint([],'return-sign')),true);assert.equal(loadAssemblies(storage).items[0].name,a.name);
});
test('book exports, exact Continue, Undo and completed reviews retain independent route memories',async()=>{
 assert.deepEqual(parseBook(serializeBook(gardensBook())),gardensBook());const w=gardenWorld('clockwork-gardens'),actions=clears['clockwork-gardens'];let t=beginRewind(createRun(adventureStage(w)),{kind:'world',world:w,origin:'shelf'});for(const a of actions.slice(0,44))t=advanceRewind(t,a);const restored=(await restoreTrail(JSON.parse(serializeTrail(t)))).trail;assert.equal(runFingerprint(restored.run),runFingerprint(t.run));assert.equal(runFingerprint(undoRewind(advanceRewind(restored,actions[44])).run),runFingerprint(t.run));for(const a of actions.slice(44))t=advanceRewind(t,a);assert.equal(t.run.status,'won');const review=await inspectReview(trailReview(t));assert.deepEqual(await reviewFrame(review.seed,review.seed.actions.length),t.run);
});
test('captured v0.40 checkpoints and full v12 export bytes retain their original winning outcome',async()=>{
 const f=JSON.parse(await readFile(new URL('fixtures/pip-v040-trail.json',import.meta.url),'utf8'));let t=(await restoreTrail(f.checkpoint)).trail;for(const a of f.remaining)t=advanceRewind(t,a);assert.equal(t.run.status,'won');assert.equal(runFingerprint(t.run),f.finalFingerprint);assert.equal(createHash('sha256').update(serializeAdventure(glassworksWorld('glassworks'))).digest('hex'),f.exportSha256);
});
