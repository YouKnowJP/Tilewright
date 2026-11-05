// New owned material. See LICENSE; prior MIT permissions remain effective.
import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const replacements = [
 ['http://azure.archive.ubuntu.com/ubuntu','https://archive.ubuntu.com/ubuntu'],
 ['https://azure.archive.ubuntu.com/ubuntu','https://archive.ubuntu.com/ubuntu'],
 ['http://archive.ubuntu.com/ubuntu','https://archive.ubuntu.com/ubuntu'],
 ['http://security.ubuntu.com/ubuntu','https://security.ubuntu.com/ubuntu']
];
export const APT_NETWORK_CONFIG='Acquire::http::Timeout "30";\nAcquire::https::Timeout "30";\nAcquire::Retries "2";\n';

// GitHub's Ubuntu images can reference mirror+file:/etc/apt/apt-mirrors*.txt.
// Updating only sources.list/.sources leaves those actual download hosts unchanged.
export async function configureUbuntuApt(root) {
 if(typeof root!=='string'||!path.isAbsolute(root))throw Error('Choose an absolute APT configuration directory.');
 const entries=await readdir(root),sourceDir=path.join(root,'sources.list.d');
 let sources=[];try{sources=await readdir(sourceDir);}catch(error){if(error.code!=='ENOENT')throw error;}
 const files=[path.join(root,'sources.list'),...sources.filter(name=>/\.(?:list|sources)$/.test(name)).sort().map(name=>path.join(sourceDir,name)),...entries.filter(name=>/^apt-mirrors.*\.txt$/.test(name)).sort().map(name=>path.join(root,name))],changed=[];
 for(const file of files){
  let before;try{before=await readFile(file,'utf8');}catch(error){if(error.code==='ENOENT')continue;throw error;}
  let after=before;for(const [from,to]of replacements)after=after.replaceAll(from,to);
  if(after!==before){await writeFile(file,after,'utf8');changed.push(path.relative(root,file).split(path.sep).join('/'));}
 }
 await mkdir(path.join(root,'apt.conf.d'),{recursive:true});
 await writeFile(path.join(root,'apt.conf.d','99tilewright-network'),APT_NETWORK_CONFIG,'utf8');
 return changed.sort();
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length>3)throw Error('Use ci-apt.mjs with one optional absolute APT directory.');
 const changed=await configureUbuntuApt(process.argv[2]||'/etc/apt');
 console.log('Bounded APT downloads; Ubuntu HTTPS sources/mirror lists: '+(changed.join(', ')||'already configured'));
}
