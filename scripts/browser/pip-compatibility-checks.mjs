import {pipWeavekeepersScenarios} from './pip-weavekeepers-browser-checks.mjs';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from '../build.mjs';
import {createDevServer} from '../../serve.mjs';
import {runReleaseSmoke} from './release-smoke.mjs';
import {pipKilnkeepersScenarios} from './pip-kilnkeepers-browser-checks.mjs';
import {pipMixingHouseScenarios} from './pip-mixing-house-browser-checks.mjs';
import {pipEchoPostScenarios} from './pip-echo-post-browser-checks.mjs';
export async function checkPipCompatibility(browserType){
 const names=[];await pipEchoPostScenarios(async name=>names.push(name));await pipMixingHouseScenarios(async name=>names.push(name));await pipKilnkeepersScenarios(async name=>names.push(name));await pipWeavekeepersScenarios(async name=>names.push(name));names.push('pip-sealkeeper-starter-codes-and-legacy-journals','pip-balance-enlarged-menus-readonly-and-legacy-share');assert.equal(names.length,26);assert.equal(new Set(names).size,26);
 const directory=await mkdtemp(path.join(tmpdir(),'tilewright-pip-compatibility-'));let server;
 try{const site=await build(directory),release=JSON.parse(await readFile(path.join(site.destination,'release.json'),'utf8'));server=createDevServer({root:site.destination});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const report=await runReleaseSmoke(browserType,{baseURL:`http://127.0.0.1:${server.address().port}/`,only:names});assert.equal(report.results.length,names.length);assert.deepEqual(new Set(report.results.map(r=>r.name)),new Set(names));const result={release,...report},out=fileURLToPath(new URL('../../playwright-report/pip-compatibility/',import.meta.url));await mkdir(out,{recursive:true});await writeFile(path.join(out,browserType.name()+'.json'),JSON.stringify(result,null,2));return result;
 }finally{if(server)await new Promise(resolve=>server.close(resolve));await rm(directory,{recursive:true,force:true});}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const engines=process.argv.slice(2);if(!engines.length)engines.push('chromium');if(engines.some(n=>!['chromium','firefox','webkit'].includes(n)))throw Error('Choose chromium, firefox or webkit.');const playwright=await import('playwright');for(const engine of engines){const report=await checkPipCompatibility(playwright[engine]);console.log(JSON.stringify({engine,release:report.release,cases:report.results.length}));}}
