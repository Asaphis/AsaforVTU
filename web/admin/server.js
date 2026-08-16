const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT || 5003);
const backendUrl = String(
  process.env.VTU_BACKEND_URL ||
  process.env.BACKEND_URL ||
  process.env.VITE_VTU_BACKEND_URL ||
  'https://vtuapi.ferixas.com'
).replace(/\/$/, '');
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function isInsideRoot(filePath) {
  const relative = path.relative(root, filePath);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function staticPath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname);
  const normalized = path.normalize(pathname).replace(/^([.][.][/\\])+/, '');
  return path.resolve(root, normalized === '/' ? 'index.html' : `.${path.sep}${normalized}`);
}

function readBody(req, limit = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('Request body is too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function proxyApi(req, res) {
  const original = new URL(req.url || '/', 'http://localhost');
  const body = ['GET', 'HEAD'].includes(req.method || '') ? undefined : await readBody(req);
  const headers = { Accept: 'application/json' };
  const authorization = req.headers.authorization;
  const adminEmail = req.headers['x-admin-email'];
  const contentType = req.headers['content-type'];
  if (authorization) headers.Authorization = authorization;
  if (adminEmail) headers['X-Admin-Email'] = adminEmail;
  if (contentType && body?.length) headers['Content-Type'] = contentType;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const upstream = await fetch(`${backendUrl}${original.pathname}${original.search}`, {
      method: req.method,
      headers,
      body,
      signal: controller.signal,
    });
    const responseBody = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(upstream.status, {
      'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'same-origin',
    });
    if (req.method === 'HEAD') return res.end();
    return res.end(responseBody);
  } catch (error) {
    const status = error.name === 'AbortError' ? 504 : 502;
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify({ error: status === 504 ? 'Backend request timed out' : 'Backend service is unavailable' }));
  } finally {
    clearTimeout(timeout);
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url || '/', 'http://localhost').pathname;
    if (pathname.startsWith('/api/')) return await proxyApi(req, res);

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      return res.end('Method Not Allowed');
    }

    let filePath = staticPath(req.url || '/');
    if (!isInsideRoot(filePath) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      filePath = path.join(root, 'index.html');
    }

    const extension = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': contentTypes[extension] || 'application/octet-stream',
      'Cache-Control': extension === '.html' ? 'no-cache, no-store, must-revalidate' : 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'same-origin',
      'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'",
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    });
    if (req.method === 'HEAD') return res.end();
    return fs.createReadStream(filePath).pipe(res);
  } catch (_) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`AsaforVTU admin server listening on port ${port}`);
});
