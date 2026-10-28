import { execFileSync } from 'node:child_process';
import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const index = 'docs/FILE_INDEX.md';
const checking = process.argv.includes('--check');
const candidates = execFileSync('git', ['ls-files', '--cached', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
const files = [];
for (const file of new Set([...candidates, index])) {
  try { if ((await stat(path.join(root, file))).isFile()) files.push(file); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
files.sort();

const folders = new Map();
for (const file of files) {
  const folder = path.posix.dirname(file);
  if (!folders.has(folder)) folders.set(folder, []);
  folders.get(folder).push(file);
}
const entries = [...folders].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
const href = file => '../' + file.split('/').map(encodeURIComponent).join('/');
const folderName = folder => folder === '.' ? 'Repository root' : folder + '/';
const lines = [
  '# Repository file index', '',
  'Start with the [repository organization guide](README.md) or the',
  '[project overview](../README.md). This index lists every tracked file and',
  'staged addition that currently exists. Generated builds, browser',
  'captures, dependencies, and operating-system metadata are excluded.', '',
  `**${files.length} files in ${folders.size} folders.** Stage new files before refreshing. Run`,
  '`node /path/to/Tilewright/scripts/repository-files.mjs`, or run',
  '`node scripts/repository-files.mjs` from the repository root.', '',
  '## Folders', '', '| Folder | Files |', '| --- | ---: |',
  ...entries.map(([folder, items]) => `| [${folderName(folder)}](${href(folder)}/) | ${items.length} |`), ''
];
for (const [folder, items] of entries) {
  lines.push('<details>', `<summary>${folderName(folder)} — ${items.length} files</summary>`, '',
    ...items.map(file => `- [${path.posix.basename(file)}](${href(file)})`), '', '</details>', '');
}
const expected = lines.join('\n');
const failures = [];
if (checking) {
  if (await readFile(path.join(root, index), 'utf8') !== expected) failures.push(`${index}: stale; run node scripts/repository-files.mjs`);
} else await writeFile(path.join(root, index), expected);

async function reference(file, target) {
  if (!target || /^(?:[a-z][a-z\d+.-]*:|#|\/)/i.test(target)) return false;
  const local = target.split(/[?#]/, 1)[0];
  if (!local) return false;
  try {
    const resolved = path.resolve(root, path.dirname(file), decodeURIComponent(local));
    const relative = path.relative(root, resolved);
    if (relative === '..' || relative.startsWith('..' + path.sep)) throw new Error('outside the repository');
    if (relative.split(path.sep).some(part => ['.playwright-mcp', 'playwright-report', 'test-results'].includes(part))) return false;
    await stat(resolved);
  } catch (error) { failures.push(`${file}: ${target} (${error.code || error.message})`); }
  return true;
}

let references = 0;
for (const file of files) {
  if (!/\.(?:md|mjs|html)$/.test(file)) continue;
  let source = await readFile(path.join(root, file), 'utf8');
  const targets = [];
  if (file.endsWith('.md')) {
    source = source.replace(/^```[^\n]*\n[\s\S]*?^```[^\n]*$/gm, '');
    for (const match of source.matchAll(/!?\[[^\]\n]*\]\((?:<([^>]+)>|([^\s)]+))(?:\s+"[^"]*")?\)/g)) targets.push(match[1] || match[2]);
  } else if (file.endsWith('.mjs')) {
    for (const match of source.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*)(['"])(\.[^'"\n]+)\1/g)) targets.push(match[2]);
    for (const match of source.matchAll(/new URL\(\s*(['"])(\.[^'"\n]+)\1\s*,\s*import\.meta\.url/g)) targets.push(match[2]);
  } else {
    for (const match of source.matchAll(/(?:src|href)=(['"])([^'"\n]+)\1/g)) targets.push(match[2]);
  }
  for (const target of targets) if (await reference(file, target)) references++;
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else console.log(`${checking ? 'Checked' : 'Updated'} ${index}: ${files.length} files; ${references} local references checked.`);
