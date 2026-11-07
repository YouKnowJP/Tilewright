import {pipTollScenarios} from './pip-toll-browser-checks.mjs';
import {pipMeetingScenarios} from './pip-meeting-browser-checks.mjs';
import {pipRailScenarios} from './pip-switchyard-browser-checks.mjs';
import {pipCounterScenarios} from './pip-footfall-browser-checks.mjs';
import {pipWindwardScenarios} from './pip-windward-browser-checks.mjs';
import {pipRestkeepersScenarios} from './pip-restkeepers-browser-checks.mjs';
import {pipDrumkeepersScenarios} from './pip-drumkeepers-browser-checks.mjs';
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
import {parseReleaseArgs,createReleaseSelector} from './release-selection.mjs';
export async function pipCompatibilityNames({shard=null}={}){
 const selected=createReleaseSelector({shard});
 const names=[];await pipEchoPostScenarios(async name=>names.push(name));await pipMixingHouseScenarios(async name=>names.push(name));await pipKilnkeepersScenarios(async name=>names.push(name));await pipWeavekeepersScenarios(async name=>names.push(name));await pipDrumkeepersScenarios(async name=>names.push(name));await pipRestkeepersScenarios(async name=>names.push(name));await pipWindwardScenarios(async name=>names.push(name));await pipCounterScenarios(async name=>names.push(name));await pipRailScenarios(async name=>names.push(name));await pipMeetingScenarios(async name=>names.push(name));await pipTollScenarios(async name=>names.push(name));names.push('pip-sealkeeper-starter-codes-and-legacy-journals','pip-balance-enlarged-menus-readonly-and-legacy-share');assert.equal(names.length,68);assert.equal(new Set(names).size,68);
 return names.filter(selected);
}
export async function checkPipCompatibility(browserType,{shard=null}={}){
 const names=await pipCompatibilityNames({shard});
 const directory=await mkdtemp(path.join(tmpdir(),'tilewright-pip-compatibility-'));let server;
 try{const site=await build(directory),release=JSON.parse(await readFile(path.join(site.destination,'release.json'),'utf8'));server=createDevServer({root:site.destination});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const report=await runReleaseSmoke(browserType,{baseURL:`http://127.0.0.1:${server.address().port}/`,only:names});assert.equal(report.results.length,names.length);assert.deepEqual(new Set(report.results.map(r=>r.name)),new Set(names));const result={release,compatibilityShard:shard,...report},out=fileURLToPath(new URL('../../playwright-report/pip-compatibility/',import.meta.url));await mkdir(out,{recursive:true});await writeFile(path.join(out,browserType.name()+(shard?`-${shard.index}-of-${shard.total}`:'')+'.json'),JSON.stringify(result,null,2));return result;
 }finally{if(server)await new Promise(resolve=>server.close(resolve));await rm(directory,{recursive:true,force:true});}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const {only:engines,shard}=parseReleaseArgs(process.argv.slice(2));if(!engines.length)engines.push('chromium');if(engines.some(n=>!['chromium','firefox','webkit'].includes(n)))throw Error('Choose chromium, firefox or webkit.');const playwright=await import('playwright');for(const engine of engines){const report=await checkPipCompatibility(playwright[engine],{shard});console.log(JSON.stringify({engine,release:report.release,shard,cases:report.results.length}));}}
