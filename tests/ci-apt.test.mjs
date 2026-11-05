import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {configureUbuntuApt,APT_NETWORK_CONFIG} from '../scripts/ci-apt.mjs';
async function fixture(fn){const root=await mkdtemp(path.join(os.tmpdir(),'tilewright-apt-'));try{await mkdir(path.join(root,'sources.list.d'));await fn(root);}finally{await rm(root,{recursive:true,force:true});}}
const put=(root,file,text)=>writeFile(path.join(root,file),text,'utf8');
const get=(root,file)=>readFile(path.join(root,file),'utf8');

test('CI rewrites the real mirror+file lists as well as signed APT sources',()=>fixture(async root=>{
 const sources='Types: deb\nURIs: mirror+file:/etc/apt/apt-mirrors.txt\nSuites: noble noble-updates\nSigned-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg\n';
 await put(root,'sources.list.d/ubuntu.sources',sources);await put(root,'apt-mirrors.txt','http://azure.archive.ubuntu.com/ubuntu\nhttp://archive.ubuntu.com/ubuntu\n');await put(root,'apt-mirrors-security.txt','http://azure.archive.ubuntu.com/ubuntu\nhttp://security.ubuntu.com/ubuntu\n');
 assert.deepEqual(await configureUbuntuApt(root),['apt-mirrors-security.txt','apt-mirrors.txt']);
 assert.equal(await get(root,'sources.list.d/ubuntu.sources'),sources);
 assert.equal(await get(root,'apt-mirrors.txt'),'https://archive.ubuntu.com/ubuntu\nhttps://archive.ubuntu.com/ubuntu\n');
 assert.equal(await get(root,'apt-mirrors-security.txt'),'https://archive.ubuntu.com/ubuntu\nhttps://security.ubuntu.com/ubuntu\n');
}));
test('CI preserves suites, components, signing keys and unrelated repository hosts',()=>fixture(async root=>{
 const before='deb [signed-by=/keys/ubuntu.gpg] https://azure.archive.ubuntu.com/ubuntu noble main universe\ndeb [signed-by=/keys/vendor.gpg] https://vendor.example/repo stable main\n';await put(root,'sources.list',before);await put(root,'sources.list.d/security.list','deb http://security.ubuntu.com/ubuntu noble-security main\n');await configureUbuntuApt(root);assert.equal(await get(root,'sources.list'),before.replace('https://azure.archive.ubuntu.com/ubuntu','https://archive.ubuntu.com/ubuntu'));assert.equal(await get(root,'sources.list.d/security.list'),'deb https://security.ubuntu.com/ubuntu noble-security main\n');
}));
test('CI ignores unrelated text, backups and configuration files',()=>fixture(async root=>{
 const text='http://azure.archive.ubuntu.com/ubuntu\n';for(const file of ['notes.txt','sources.list.d/ignored.txt','sources.list.d/ubuntu.sources.backup'])await put(root,file,text);await configureUbuntuApt(root);for(const file of ['notes.txt','sources.list.d/ignored.txt','sources.list.d/ubuntu.sources.backup'])assert.equal(await get(root,file),text);
}));
test('CI setup writes bounded HTTP/HTTPS acquisition with idempotent mirror contents',()=>fixture(async root=>{
 await put(root,'apt-mirrors.txt','http://azure.archive.ubuntu.com/ubuntu priority:1\n');await configureUbuntuApt(root);const mirror=await get(root,'apt-mirrors.txt');assert.deepEqual(await configureUbuntuApt(root),[]);assert.equal(await get(root,'apt-mirrors.txt'),mirror);assert.equal(await get(root,'apt.conf.d/99tilewright-network'),APT_NETWORK_CONFIG);assert.match(APT_NETWORK_CONFIG,/http::Timeout "30"/);assert.match(APT_NETWORK_CONFIG,/https::Timeout "30"/);assert.match(APT_NETWORK_CONFIG,/Retries "2"/);
}));
test('CI setup handles images without optional source files and rejects relative roots',()=>fixture(async root=>{
 await rm(path.join(root,'sources.list.d'),{recursive:true});assert.deepEqual(await configureUbuntuApt(root),[]);assert.equal(await get(root,'apt.conf.d/99tilewright-network'),APT_NETWORK_CONFIG);await assert.rejects(configureUbuntuApt('relative-root'),/absolute/);
}));
test('CI command uses its supplied temporary root without touching the host package manager',()=>fixture(async root=>{
 await put(root,'apt-mirrors.txt','http://azure.archive.ubuntu.com/ubuntu\n');const script=fileURLToPath(new URL('../scripts/ci-apt.mjs',import.meta.url)),out=execFileSync(process.execPath,[script,root],{encoding:'utf8'});assert.match(out,/apt-mirrors.txt/);assert.equal(await get(root,'apt-mirrors.txt'),'https://archive.ubuntu.com/ubuntu\n');assert.equal(await get(root,'apt.conf.d/99tilewright-network'),APT_NETWORK_CONFIG);
}));
