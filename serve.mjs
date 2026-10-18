import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PUBLIC_FILES } from './scripts/build.mjs';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const TYPES = { '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };

export function createDevServer() {
  return http.createServer(async (request, response) => {
    const headers = { 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'" };
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { ...headers, Allow: 'GET, HEAD' }); response.end(); return;
    }
    let relative;
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    } catch { response.writeHead(400, headers); response.end(); return; }
    if (!PUBLIC_FILES.includes(relative)) { response.writeHead(404, headers); response.end('Not found'); return; }
    try {
      const body = await readFile(path.join(ROOT, relative));
      response.writeHead(200, { ...headers, 'Content-Type': TYPES[path.extname(relative)] || 'text/plain; charset=utf-8' });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch { response.writeHead(404, headers); response.end('Not found'); }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4174);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535.');
  const server = createDevServer();
  server.listen(port, '127.0.0.1', () => console.log(`Tilewright is ready: http://127.0.0.1:${port}`));
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
}
