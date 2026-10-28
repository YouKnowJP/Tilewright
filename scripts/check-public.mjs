import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {PUBLIC_FILES,GENERATED_FILES} from './build.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
export async function checkPublic(directory=path.join(root,'dist')){
 const files=[];async function visit(folder){for(const item of await readdir(folder,{withFileTypes:true})){const full=path.join(folder,item.name);if(item.isDirectory())await visit(full);else{assert.ok(item.isFile(),'Only ordinary public files are allowed.');files.push(path.relative(directory,full).split(path.sep).join('/'));}}}await visit(directory);
 assert.deepEqual(files.sort(),[...PUBLIC_FILES,...GENERATED_FILES].sort(),'The artifact must contain exactly its public allowlist and release metadata.');
 const packageInfo=JSON.parse(await readFile(path.join(root,'package.json'),'utf8')),release=JSON.parse(await readFile(path.join(directory,'release.json'),'utf8'));
 assert.equal(release.version,packageInfo.version);assert.equal(release.repository,'https://github.com/YouKnowJP/Tilewright');assert.equal(release.playURL,'https://youknowjp.github.io/Tilewright/');assert.equal(release.license,'SEE LICENSE IN LICENSE');assert.ok(release.sourceCommit===null||/^[a-f0-9]{40}$/.test(release.sourceCommit));
 for(const name of ['LICENSE','LEGACY-MIT-LICENSE.txt','THIRD_PARTY_NOTICES.md','PRIVACY.md','rights.html'])assert.equal(await readFile(path.join(directory,name),'utf8'),await readFile(path.join(root,name),'utf8'),`${name} must retain its complete source notice.`);
 assert.match(await readFile(path.join(directory,'LEGACY-MIT-LICENSE.txt'),'utf8'),/Copyright \(c\) 2025 Thong Pham/);assert.match(await readFile(path.join(directory,'rights.html'),'utf8'),/Earlier MIT releases remain an exception/);
 const html=await readFile(path.join(directory,'index.html'),'utf8');assert.match(html,/href="rights.html"/);assert.doesNotMatch(html,/OPEN SOURCE <span>·<\/span> MIT LICENSE/);
 const manifest=JSON.parse(await readFile(path.join(directory,'manifest.webmanifest'),'utf8'));assert.equal(manifest.start_url,'./#play');assert.equal(manifest.scope,'./');
 return {version:release.version,files:files.length,sourceCommit:release.sourceCommit};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(await checkPublic()));
