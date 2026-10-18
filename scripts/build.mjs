import { cp, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const PUBLIC_FILES = Object.freeze(['index.html', 'style.css', 'adventure.css', 'icon.svg', 'LICENSE',
  'src/bootstrap.mjs', 'src/app.mjs', 'src/model.mjs', 'src/sample.mjs', 'src/render.mjs', 'src/storage.mjs',
  'src/viewport.mjs', 'src/icons.mjs', 'src/operations.mjs', 'src/adventure.mjs', 'src/adventure-levels.mjs',
  'src/adventure-records.mjs', 'src/adventure-render.mjs', 'src/adventure-sound.mjs', 'src/adventure-ui.mjs', 'src/adventure-brain.mjs', 'src/adventure-tactics.mjs']);

export async function build(destination = path.join(ROOT, 'dist')) {
  destination = path.resolve(destination);
  let existing;
  try { existing = await readdir(destination); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const marker = '.tilewright-build.json';
  if (existing?.length) {
    let owned = false;
    try { owned = JSON.parse(await readFile(path.join(destination, marker), 'utf8')).project === 'tilewright'; }
    catch { /* Never replace a directory that is not a Tilewright build. */ }
    if (!owned) throw new Error('Choose an empty directory or an existing Tilewright build.');
  }
  await mkdir(path.dirname(destination), { recursive: true });
  const staging = await mkdtemp(path.join(path.dirname(destination), '.tilewright-build-'));
  try {
    for (const file of PUBLIC_FILES) {
      await mkdir(path.dirname(path.join(staging, file)), { recursive: true });
      await cp(path.join(ROOT, file), path.join(staging, file));
    }
    const { version } = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
    await writeFile(path.join(staging, marker), JSON.stringify({ project: 'tilewright', version, files: PUBLIC_FILES }, null, 2) + '\n');
    await writeFile(path.join(staging, 'RELEASE.md'), `# Tilewright ${version}\n\nServe this directory over HTTP (not file://). No installation or external services required.\n\nFor example: python3 -m http.server 4174 --bind 127.0.0.1\n\nOpen http://127.0.0.1:4174. Choose Play adventures or open http://127.0.0.1:4174/#play for Lantern Trails.\n\nAdventure bests use a separate browser save. Maps are saved in this browser's storage; export JSON for durable backups.\n\nMIT; see LICENSE. Source: https://github.com/YouKnowJP/Personal-Project/tree/main/Tilewright\n`);
    if (existing) await rm(destination, { recursive: true });
    await rename(staging, destination);
    return { destination, version, files: [...PUBLIC_FILES, marker, 'RELEASE.md'] };
  } catch (error) { await rm(staging, { recursive: true, force: true }); throw error; }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await build();
  console.log(`Tilewright ${result.version}: ${result.files.length} files built in ${result.destination}`);
}
