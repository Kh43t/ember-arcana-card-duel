// serve.ts — serve game/ locally for play-testing, then open it.
// Run: node serve.ts  (then open http://localhost:8080 in desktop Chrome)

import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), 'game');
const PORT = 8080;
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  const file = join(ROOT, path === '/' ? 'index.html' : path);
  if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}/`;
  console.log(`Ember Arcana at ${url}`);
  const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${opener} ${url}`);
});
