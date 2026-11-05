import test from 'node:test';
import assert from 'node:assert/strict';
import {STAR_ATLAS_MISSIONS} from '../src/pip-star-atlas.mjs';
import {solvedTinkerProject,startTinker,tinkerStep,editTinkerProject,serializeTinkerProject,parseTinkerProject} from '../src/pip-tinker.mjs';
import {remixDuoProject} from '../src/pip-duo.mjs';
import {normalizePipCollection,serializePipCollection,pipCollectionCode,parsePipCollectionCode,collectionChapterShape} from '../src/pip-collections.mjs';
import {COLLECTION_REMIXES,remixCollectionChapter,replaceCollectionChapter,copyCollectionChapter} from '../src/pip-collection-tools.mjs';
import {pipCollectionPoster} from '../src/pip-collection-poster.mjs';
import {emptyCollectionJournal,keepCollection,captureCollectionChapter,normalizeCollectionJournal,setCollectionAssembly} from '../src/pip-collection-storage.mjs';
const run=p=>{let s=startTinker(p);while(s.status==='playing')s=tinkerStep(s);return s;};
const pack=(projects=[solvedTinkerProject('duo-first-letter'),solvedTinkerProject('duo-atlas-home')])=>normalizePipCollection({format:'pip-adventure-collection',version:1,name:'Our star atlas',author:'Tavi',intro:'Roads worth returning to.',chapters:projects.map(project=>({title:project.name,note:'A new chapter for two friends.',project}))});
for(const [i,m] of STAR_ATLAS_MISSIONS.entries())test(`Star Atlas ${m.id}: required repairs, immutable turns, goals and portable clear`,()=>{
 const p=solvedTinkerProject(m.id),before=structuredClone(p);let s=startTinker(p);
 while(s.status==='playing'){const previous=s,snapshot=structuredClone(s);s=tinkerStep(s);assert.deepEqual(previous,snapshot);assert.notDeepEqual([s.bots[0].x,s.bots[0].y],[s.bots[1].x,s.bots[1].y]);}
 assert.equal(s.status,'won');assert.equal(s.ticks,[181,181,163,181][i]);assert.equal(p.parts.length,[8,9,10,12][i]);
 for(const part of p.parts)assert.equal(run(editTinkerProject(p,{parts:p.parts.filter(x=>x!==part)})).status,'limit');
 assert.deepEqual(parseTinkerProject(serializeTinkerProject(p)),p);assert.deepEqual(p,before);if(m.emptyLockers)assert.deepEqual(s.lockers,{});assert.ok(s.lockerTransfers>=m.relays);
});
for(const [op]of COLLECTION_REMIXES)test(`collection ${op}: preserve credits, validate creator route, keep original immutable`,()=>{
 const input=pack([solvedTinkerProject('duo-first-letter')]),before=structuredClone(input),next=remixCollectionChapter(input,0,op),project=next.chapters[0].project;
 assert.equal(project.trialId,'duo-creator');assert.equal(project.author,input.chapters[0].project.author);assert.equal(project.source,'Remix of A Letter for Two by Lantern Trails');assert.equal(run(project).status,'won');assert.equal(project.proof.ticks,run(project).ticks);assert.equal(next.chapters[0].title,input.chapters[0].title);assert.deepEqual(input,before);assert.equal(next.version,1);
});
for(const m of STAR_ATLAS_MISSIONS)test(`Star Atlas ${m.id}: editable mirror and palette routes remain verified`,()=>{const input=pack([solvedTinkerProject(m.id)]);for(const op of ['horizontal','vertical','palette']){const project=remixCollectionChapter(input,0,op).chapters[0].project;assert.equal(project.proof.ticks,input.chapters[0].project.proof.ticks);assert.equal(run(project).status,'won');}});
test('courier trades recalculate changed clear times and drop genuinely broken creator routes',()=>{const changed=remixCollectionChapter(pack([solvedTinkerProject('duo-lantern-festival')]),0,'partners').chapters[0].project;assert.equal(changed.proof.ticks,41);assert.equal(run(changed).ticks,41);const broken=remixCollectionChapter(pack([solvedTinkerProject('duo-dyehouse')]),0,'partners').chapters[0].project;assert.equal(broken.proof,undefined);assert.equal(run(broken).status,'limit');});
test('successive remixes retain working cards, canonical PC1 sharing and original provenance',()=>{
 let p=pack([solvedTinkerProject('duo-first-letter')]);for(const [op]of COLLECTION_REMIXES)p=remixCollectionChapter(p,0,op);assert.equal(p.chapters[0].project.proof.ticks,9);assert.equal(p.chapters[0].project.source,'Remix of A Letter for Two by Lantern Trails');assert.deepEqual(parsePipCollectionCode(pipCollectionCode(p)),p);
});
test('unfinished maps remain drafts rather than acquiring a creator proof',()=>{
 const project=editTinkerProject(remixDuoProject(solvedTinkerProject('duo-first-letter')),{programs:[['wait','wait','wait'],['wait','wait','wait']]}),input=pack([project]);for(const [op]of COLLECTION_REMIXES)assert.equal(remixCollectionChapter(input,0,op).chapters[0].project.proof,undefined);
});
test('invalid indices, unsupported operations and oversize quarter turns leave collections intact',()=>{
 const p=pack(),before=structuredClone(p);for(const fn of [()=>remixCollectionChapter(p,1,'right'),()=>remixCollectionChapter(p,0,'unknown'),()=>remixCollectionChapter(p,-1,'palette'),()=>remixCollectionChapter(p,3,'palette')])assert.throws(fn);assert.deepEqual(p,before);
});
test('map replacement preserves chapter presentation and normalized, independently cloned projects',()=>{
 const input=pack(),project=solvedTinkerProject('duo-dyehouse'),before=structuredClone(input),next=replaceCollectionChapter(input,0,project);
 assert.equal(next.chapters[0].title,input.chapters[0].title);assert.equal(next.chapters[0].note,input.chapters[0].note);assert.equal(next.chapters[0].project.trialId,'duo-dyehouse');next.chapters[0].project.programs[0][0]='wait';assert.deepEqual(input,before);assert.notEqual(project.programs[0][0],'wait');assert.throws(()=>replaceCollectionChapter(input,0,solvedTinkerProject('first-use')));assert.throws(()=>replaceCollectionChapter(input,4,project));
});
test('copying saved chapters supports an empty assembly, independent snapshots and the six-chapter bound',()=>{
 const source=pack(),empty={...source,chapters:[]},copied=copyCollectionChapter(empty,source,1);assert.equal(copied.chapters.length,1);assert.equal(copied.chapters[0].project.trialId,'duo-atlas-home');copied.chapters[0].note='Changed in the new assembly';assert.notEqual(source.chapters[1].note,copied.chapters[0].note);
 let full=pack();while(full.chapters.length<6)full=copyCollectionChapter(full,source,0);assert.throws(()=>copyCollectionChapter(full,source,0),/six/);assert.throws(()=>copyCollectionChapter(empty,source,8));assert.throws(()=>copyCollectionChapter({...empty,version:9},source,0));
});
test('a saved transformed chapter resets only its changed map; reordered unchanged progress follows its map',()=>{
 const p=pack([solvedTinkerProject('duo-first-letter'),solvedTinkerProject('duo-dyehouse')]),kept=keepCollection(emptyCollectionJournal(),p);let j=captureCollectionChapter(kept.journal,kept.id,0,{project:p.chapters[0].project,testing:true,ticks:9,clear:p.chapters[0].project});j=captureCollectionChapter(j,kept.id,1,{project:p.chapters[1].project,testing:true,ticks:5});
 const transformed=remixCollectionChapter(p,0,'horizontal'),updated=keepCollection(j,{...transformed,chapters:[...transformed.chapters].reverse()},kept.id).journal;assert.equal(updated.records[0].states[0].ticks,5);assert.equal(updated.records[0].states[1].clear,null);assert.equal(updated.records[0].states[1].project,null);assert.equal(updated.records[0].lastChapter,0);assert.doesNotThrow(()=>normalizeCollectionJournal(updated));
 const restored=keepCollection(j,p,kept.id).journal;assert.equal(restored.records[0].states[0].clear.proof.ticks,9);assert.equal(j.records[0].states[0].clear.proof.ticks,9);
});
test('new tools do not alter source collection progress or original shared bytes',()=>{
 const p=pack(),kept=keepCollection(emptyCollectionJournal(),p),j=captureCollectionChapter(kept.journal,kept.id,0,{project:p.chapters[0].project,testing:true,ticks:4}),before=structuredClone(j),text=serializePipCollection(p);
 const assembly=copyCollectionChapter(remixCollectionChapter(p,0,'palette'),p,1),next=setCollectionAssembly(j,assembly);assert.deepEqual(next.records,j.records);assert.deepEqual(j,before);assert.equal(serializePipCollection(next.records[0].collection),text);assert.notEqual(collectionChapterShape(next.assembly.chapters[0].project),collectionChapterShape(p.chapters[0].project));
});
test('reversing duplicate maps keeps their distinct chapter-card setups and clears',()=>{
 const project=solvedTinkerProject('duo-first-letter'),p=pack([project,project]);p.chapters[1].title='The second visit';p.chapters[1].note='Try this one independently.';const k=keepCollection(emptyCollectionJournal(),p);let j=captureCollectionChapter(k.journal,k.id,0,{project,testing:true,ticks:9,clear:project});j=captureCollectionChapter(j,k.id,1,{project,testing:true,ticks:3});const next=keepCollection(j,{...p,chapters:[...p.chapters].reverse()},k.id).journal.records[0];assert.equal(next.states[0].ticks,3);assert.equal(next.states[0].clear,null);assert.equal(next.states[1].clear.proof.ticks,9);assert.equal(next.lastChapter,0);
});
test('renamed duplicates cannot take progress reserved for unchanged later chapter cards',()=>{
 const project=solvedTinkerProject('duo-first-letter'),p=pack([project,project]);p.chapters[1].title='A separate road';const k=keepCollection(emptyCollectionJournal(),p);let j=captureCollectionChapter(k.journal,k.id,0,{project,testing:true,ticks:9,clear:project});j=captureCollectionChapter(j,k.id,1,{project,testing:true,ticks:4});const next=keepCollection(j,{...p,chapters:[{...p.chapters[1],title:'A renamed separate road'},p.chapters[0]]},k.id).journal.records[0];assert.equal(next.states[0].ticks,4);assert.equal(next.states[0].clear,null);assert.equal(next.states[1].clear.proof.ticks,9);
});
test('changing or deleting a cleared duplicate never awards a retained unplayed card',()=>{
 const project=solvedTinkerProject('duo-first-letter'),p=pack([project,project]);p.chapters[1].note='An unplayed second visit';const k=keepCollection(emptyCollectionJournal(),p),j=captureCollectionChapter(k.journal,k.id,0,{project,testing:true,ticks:9,clear:project});for(const chapters of [[p.chapters[1]],[{...p.chapters[0],project:solvedTinkerProject('duo-dyehouse')},p.chapters[1]]]){const result=keepCollection(j,{...p,chapters},k.id).journal;assert.ok(result.records[0].states.every(s=>s.clear===null));assert.equal(result.records[0].lastChapter,null);assert.doesNotThrow(()=>normalizeCollectionJournal(result));}
});
test('posters include bounded chapter maps, credits and honest proof labels, excluding personal progress',()=>{
 const p=pack(),poster=pipCollectionPoster({...p,states:'PRIVATE PROGRESS',lastChapter:1});assert.match(poster,/width="1000" height="644"/);assert.equal((poster.match(/<g aria-label="Chapter/g)||[]).length,2);assert.match(poster,/Creator route · 181 ticks/);assert.match(poster,/P and S mark starting companions/);assert.ok(!poster.includes('PRIVATE PROGRESS'));assert.ok(!poster.includes('lastChapter'));assert.ok(!poster.includes('<script'));assert.ok(!poster.includes('<a '));assert.ok(!poster.includes('http://127.0.0.1'));
 const draft=pack([editTinkerProject(solvedTinkerProject('duo-first-letter'),{})]);assert.match(pipCollectionPoster(draft),/Draft · no verified/);
});
test('poster text and link attributes escape markup; only safe bounded hosted play links are included',()=>{
 const p={...pack([solvedTinkerProject('duo-first-letter')]),name:'<script>" & atlas',author:'Maker <&>',chapters:[{...pack().chapters[0],title:'<img onerror=bad> & stars',note:'A <foreignObject> & "sign"'}]},svg=pipCollectionPoster(p,'https://example.test/Tilewright/');assert.ok(svg.includes('&lt;script&gt;&quot; &amp; atlas'));assert.ok(!svg.includes('<script>'));assert.ok(!svg.includes('<img'));assert.ok(!svg.includes('<foreignObject>'));assert.match(svg,/<a href="https:\/\/example.test\/Tilewright\/#pip-pack=PC1\./);
 for(const url of ['http://127.0.0.1:4174/','javascript:alert(1)','https://user:pass@example.test/'])assert.ok(!pipCollectionPoster(p,url).includes('<a '));
});
test('six-chapter posters keep every card and refuse invalid collections',()=>{
 const p=pack(),full={...p,chapters:Array.from({length:6},(_,i)=>({...p.chapters[i%2],title:'A long chapter title for the paper atlas '+i}))},svg=pipCollectionPoster(full,'https://example.test/');assert.match(svg,/height="1424"/);assert.equal((svg.match(/<g aria-label="Chapter/g)||[]).length,6);const large={...p,chapters:Array(6).fill({...p.chapters[1],project:{...remixDuoProject(p.chapters[1].project),proof:p.chapters[1].project.proof}})};assert.ok(!pipCollectionPoster(large,'https://example.test/').includes('<a '));assert.throws(()=>pipCollectionPoster({...p,chapters:[]}));
});
