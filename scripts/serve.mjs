// Servidor estatico minimo, cero dependencias. Sirve el repo en 127.0.0.1:4173
// para que Playwright pruebe la vitrina. Es el reemplazo Node-only de
// `python3 -m http.server` para maquinas sin Python.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, normalize, sep } from 'node:path';

const ROOT = resolve(process.cwd());
const PORT = Number(process.env.PORT) || 4173;
const HOST = process.env.HOST || '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.txt':  'text/plain; charset=utf-8',
  '.xml':  'application/xml; charset=utf-8',
  '.pdf':  'application/pdf',
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    // Evita path traversal
    const safe = normalize(rel).replace(/^([/\\])+/, '');
    const full = join(ROOT, safe);
    if (!full.startsWith(ROOT + sep) && full !== ROOT) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    const st = await stat(full).catch(() => null);
    if (!st) { res.writeHead(404).end('Not Found'); return; }
    if (st.isDirectory()) {
      const idx = join(full, 'index.html');
      const idxSt = await stat(idx).catch(() => null);
      if (!idxSt) { res.writeHead(404).end('Not Found'); return; }
      const body = await readFile(idx);
      res.writeHead(200, { 'Content-Type': MIME['.html'] }).end(body);
      return;
    }
    const type = MIME[extname(full).toLowerCase()] || 'application/octet-stream';
    const body = await readFile(full);
    res.writeHead(200, { 'Content-Type': type }).end(body);
  } catch (err) {
    res.writeHead(500).end('Server error: ' + err.message);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`serve.mjs listo en http://${HOST}:${PORT}`);
});
