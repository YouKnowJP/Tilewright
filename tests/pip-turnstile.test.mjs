import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DUO_CHANNELS, DUO_STORIES, newDuoProject, normalizeDuoProject, duoReadiness} from '../src/pip-duo.mjs';
import {TOLL_HOUSE_MISSIONS} from '../src/pip-toll-house.mjs';
import {turnstilePayment, normalizeTurnstile} from '../src/pip-turnstile.mjs';
import {solvedTinkerProject, editTinkerProject, startTinker, tinkerStep, tinkerStateKey, tinkerPoweredChannels, tinkerCode, parseTinkerCode, parseTinkerProject, serializeTinkerProject} from '../src/pip-tinker.mjs';
import {captureDuoBlueprint, configureDuoBlueprint, duoBlueprint, normalizeDuoBlueprint, placeDuoBlueprint, repeatDuoBlueprint, parseDuoBlueprint, serializeDuoBlueprint} from '../src/pip-duo-blueprints.mjs';
import {blueprintPowerChannels, rewireBlueprintPower} from '../src/pip-blueprint-power.mjs';
import {blueprintParcelColours, recolourBlueprintParcels} from '../src/pip-blueprint-recipes.mjs';
import {transformDuoGarden} from '../src/pip-garden-tools.mjs';
import {parsePipCollection, parsePipCollectionCode, pipCollectionCode, serializePipCollection, normalizePipCollection} from '../src/pip-collections.mjs';
import {pipCollectionPoster} from '../src/pip-collection-poster.mjs';
import {rehearseTinker} from '../src/pip-rehearsal.mjs';

const gate = {kind:'turnstile', x:2, y:2, fare:'amber', channel:'blue', duration:3};
function step(state, turns) {
  for (let i = 0; i < turns; i++) state = tinkerStep(state);
  return state;
}
function handState(parts = [gate], {first = 'amber', second = null, programs = [['right','use','wait'],['right','wait','wait']]} = {}) {
  const project = normalizeDuoProject({...newDuoProject(), version:19, starts:[{x:1,y:2},{x:5,y:3}], programs, parts});
  const state = startTinker(project);
  state.bots[0].parcel = first;
  state.bots[1].parcel = second;
  return state;
}

test('matching fares are spent only on entry, and all six windows start on the next turn', () => {
  for (const fare of DUO_CHANNELS) for (let duration = 1; duration <= 6; duration++) {
    const turnstile = {...gate, fare, duration};
    assert.deepEqual(normalizeTurnstile(turnstile), {fare,channel:'blue',duration});
    assert.deepEqual(turnstilePayment(turnstile, fare, 1), {first:2,last:1+duration});
    const start = handState([turnstile], {first:fare}), paid = step(start, 1);
    assert.equal(start.bots[0].parcel, fare);
    assert.equal(paid.bots[0].parcel, null);
    assert.equal(paid.bots[0].x, 2);
    assert.equal(paid.bots[0].index, 1);
    assert.equal(paid.pulses.blue, duration);
    assert.ok(tinkerPoweredChannels(paid).has('blue'));
    assert.equal(step(paid, 1).pulses.blue, duration > 1 ? duration - 1 : undefined);
    assert.match(step(paid, 1).bots[0].last, /Use keeps cargo/);
    assert.ok(!tinkerPoweredChannels(step(paid, duration)).has('blue'));
  }
});
test('wrong, empty and occupied entries preserve parcels and emit no receipt', () => {
  for (const first of ['jade', null]) {
    const result = step(handState([gate],{first}), 1);
    assert.equal(result.bots[0].parcel, first);
    assert.equal(result.bots[0].x, 1);
    assert.match(result.bots[0].last,/needs amber fare/);
    assert.deepEqual(result.pulses, {});
  }
  const start = handState();
  Object.assign(start.bots[1], {x:2,y:2});
  const occupied = step(start, 1);
  assert.equal(occupied.bots[0].parcel, 'amber');
  assert.deepEqual(occupied.pulses, {});
  const standing = handState();
  Object.assign(standing.bots[0], {x:2,y:2,index:1});
  const used = step(standing, 1);
  assert.equal(used.bots[0].parcel, 'amber');
  assert.deepEqual(used.pulses, {});
});
test('payment cannot open the other courier’s bridge on the same turn', () => {
  const s = handState([gate,{kind:'bridge',x:6,y:3,channel:'blue'}], {programs:[['right','use','wait'],['right','right','wait']]});
  const payment = step(s, 1);
  assert.equal(payment.bots[1].x, 5);
  assert.equal(step(payment, 1).bots[1].x, 6);
});
test('simultaneous receipts on one circuit keep the longest remaining window', () => {
  for (const duration of [1,4,6]) {
    const s = handState([gate,{...gate,x:6,y:3,duration}], {second:'amber'});
    s.pulses.blue = 5;
    const result = step(s, 1);
    assert.equal(result.pulses.blue, Math.max(4,duration));
    assert.deepEqual(result.bots.map(b=>b.parcel), [null,null]);
    assert.equal(result.events.filter(e=>e.includes('paid amber')).length, 2);
  }
});
test('switch rail rides pay or block without spending the next card', () => {
  const rail = {kind:'rail',x:1,y:2,channel:'jade',quietExit:'right',poweredExit:'right'};
  for (const first of ['amber','jade']) {
    const s = handState([rail,gate], {first});
    s.bots[0].rolling = true;
    const r = step(s,1);
    assert.equal(r.bots[0].index,0);
    assert.equal(r.bots[0].rolling,false);
    assert.equal(r.bots[0].x,first==='amber'?2:1);
    assert.equal(r.bots[0].parcel,first==='amber'?null:first);
    assert.equal(r.events.filter(e=>e.includes('paid amber')).length, first==='amber'?1:0);
    assert.equal(r.events.filter(e=>e.includes('Switch Rail')).length,1);
  }
});
test('the four authored routes really pay all intended fares and clear with verified proofs', () => {
  const ticks = [12,18,18,58], fares = [[4],[4,4],[4,4,10],[4,4,25,25,34,34,55,55]];
  for (const [i,mission] of TOLL_HOUSE_MISSIONS.entries()) {
    assert.equal(DUO_STORIES[96+i].id, mission.id);
    const project = solvedTinkerProject(mission.id);
    assert.equal(project.proof.ticks,ticks[i]);
    assert.deepEqual(parseTinkerCode(tinkerCode(project)),project);
    const trace = rehearseTinker(project,60);
    assert.equal(trace.stop,'won');
    assert.deepEqual(trace.events.filter(e=>e.kind==='fare'&&e.text.includes('paid')).map(e=>e.tick),fares[i]);
    if (i===3) assert.deepEqual(trace.frames.at(-1).pulses,{});
  }
});
test('readiness identifies an impossible fare and formats reject invalid settings', () => {
  const project = placeDuoBlueprint(newDuoProject(),duoBlueprint('fare-crossing'),0,0);
  assert.equal(project.version,19);
  assert.equal(duoReadiness(project).ready,true);
  const noAmber = {...project,parts:project.parts.filter(p=>p.kind!=='source'||p.channel!=='amber')};
  assert.deepEqual(duoReadiness(noAmber).errors,['A Parcel Turnstile needs a source or recipe for its amber fare.']);
  for (const patch of [{fare:'any'}, {channel:'silver'}, {duration:0}, {duration:7}, {duration:'3'}]) {
    assert.throws(()=>normalizeTurnstile({...gate,...patch}),/parcel fare/);
  }
  for (const version of [18,21]) assert.throws(()=>normalizeDuoProject({...project,version}),/version/);
  for (const version of [17,20]) assert.throws(()=>normalizeDuoBlueprint({...duoBlueprint('fare-crossing'),version}));
});
test('fare and power transformations compose independently through capture and exchange', () => {
  const piece = duoBlueprint('fare-crossing'), toll = p=>p.parts.find(s=>s.kind==='turnstile');
  assert.deepEqual(blueprintPowerChannels(piece),[{channel:'blue',parts:2}]);
  assert.deepEqual(blueprintParcelColours(piece),['amber','jade','violet']);
  const rewired = rewireBlueprintPower(piece,{blue:'jade'});
  assert.deepEqual(toll(rewired),{...toll(piece),channel:'jade'});
  const recoloured = recolourBlueprintParcels(rewired,{amber:'blue',blue:'amber',jade:'jade',violet:'violet'});
  assert.deepEqual(toll(recoloured),{...toll(rewired),fare:'blue'});
  const repeated = repeatDuoBlueprint(configureDuoBlueprint(recoloured,{reflection:'horizontal'}),{count:2,axis:'down',gap:1,shiftColours:true});
  assert.deepEqual(repeated.parts.filter(s=>s.kind==='turnstile').map(s=>[s.fare,s.channel,s.x,s.y]),[['blue','jade',3,0],['amber','violet',3,4]]);
  const placed = placeDuoBlueprint(newDuoProject('duo-creator',{width:9,height:9}),repeated,1,1);
  assert.deepEqual(captureDuoBlueprint(placed,{x:1,y:1,width:7,height:7}).parts,repeated.parts);
  assert.deepEqual(parseDuoBlueprint(serializeDuoBlueprint(repeated)),repeated);
  assert.equal(toll(transformDuoGarden(placed,'palette')).fare,'amber');
});
test('both starter blueprints work from their west ends with the documented cards', () => {
  for (const [id,row,turns] of [['fare-crossing',0,12],['fare-dispatch',1,10]]) {
    const piece = duoBlueprint(id), base = placeDuoBlueprint(newDuoProject(),piece,0,0);
    const programs = [['right','right','use'],id==='fare-crossing'?['right','wait','use']:['wait','wait','wait']];
    const project = editTinkerProject({...base,starts:[{x:0,y:row},id==='fare-crossing'?{x:0,y:2}:{x:7,y:3}]},{programs});
    assert.equal(step(startTinker(project),turns).status,'won');
  }
});
test('Toll House collection codes and poster include the fare rules and verified clears', () => {
  const chapters = TOLL_HOUSE_MISSIONS.map(m=>({title:m.title,project:solvedTinkerProject(m.id)}));
  const pack = normalizePipCollection({format:'pip-adventure-collection',version:1,name:'The Toll House',chapters});
  assert.deepEqual(parsePipCollectionCode(pipCollectionCode(pack)),pack);
  const svg = pipCollectionPoster(pack);
  assert.match(svg,/Parcel Turnstile/);
  assert.match(svg,/Spends one amber parcel/);
  assert.doesNotMatch(svg,/undefined/);
});
test('literal v0.67 projects, blueprints, collections and exact waiting states are preserved', async () => {
  const old = JSON.parse(await readFile(new URL('./fixtures/pip-v067-duo.json',import.meta.url),'utf8'));
  const p = parseTinkerProject(old.project);
  assert.equal(serializeTinkerProject(p),old.project);
  assert.equal(tinkerCode(p),old.code);
  assert.equal(serializeDuoBlueprint(parseDuoBlueprint(old.piece)),old.piece);
  for (const [file,code] of [['collection','collectionCode'],['bonus','bonusCode']]) {
    const pack = parsePipCollection(old[file]);
    assert.equal(serializePipCollection(pack),old[file]);
    assert.equal(pipCollectionCode(pack),old[code]);
  }
  let state = startTinker(p);
  for (const {tick,key} of old.frames) {
    state=step(state,tick-state.ticks);
    assert.equal(tinkerStateKey(state),key);
  }
  assert.equal(state.status,'won');
});
