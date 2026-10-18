import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { build, PUBLIC_FILES } from '../scripts/build.mjs';
import { createDevServer } from '../serve.mjs';

test('static builds contain only public assets and can be rebuilt', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'tilewright-test-'));
  try {
    const destination = path.join(directory, 'site');
    const result = await build(destination);
    assert.equal(result.files.length, PUBLIC_FILES.length + 2);
    const marker = JSON.parse(await readFile(path.join(destination, '.tilewright-build.json'), 'utf8'));
    assert.equal(marker.project, 'tilewright');
    for (const file of PUBLIC_FILES) assert.ok((await readFile(path.join(destination, file))).length > 0);
    assert.ok(!(await readdir(destination)).includes('tests'));
    await build(destination);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('build refuses to delete an unrelated nonempty directory', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'tilewright-test-'));
  try {
    const destination = path.join(directory, 'precious'); await mkdir(destination);
    await writeFile(path.join(destination, 'keep.txt'), 'keep me');
    await assert.rejects(build(destination), /empty directory/);
    assert.equal(await readFile(path.join(destination, 'keep.txt'), 'utf8'), 'keep me');
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('development server serves modules, supports HEAD, and rejects private paths and writes', async () => {
  const server = createDevServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const page = await fetch(base); assert.equal(page.status, 200);
    assert.match(await page.text(), /Tilewright/);
    assert.match(page.headers.get('content-security-policy'), /connect-src 'none'/);
    const module = await fetch(`${base}/src/model.mjs`);
    assert.match(module.headers.get('content-type'), /javascript/);
    const head = await fetch(base, { method: 'HEAD' }); assert.equal(head.status, 200); assert.equal(await head.text(), '');
    for (const file of ['package.json', '.env', '.git/config', 'tests/model.test.mjs', 'serve.mjs', 'src/../package.json', '%2e%2e%2fLICENSE', 'src%2f..%2f..%2fLICENSE']) {
      assert.equal((await fetch(`${base}/${file}`)).status, 404, file);
    }
    assert.equal((await fetch(`${base}/%ZZ`)).status, 400);
    assert.equal((await fetch(base, { method: 'POST', body: 'hello' })).status, 405);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
