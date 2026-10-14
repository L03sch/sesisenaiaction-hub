import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export function securityHeaders(origin = 'https://inlbptawboswnwdqlnlm.supabase.co') {
  const url = new URL(origin);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('SUPABASE_ORIGIN must be an HTTPS origin');
  }
  return {
    'Content-Security-Policy': `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://ava.sesisenai.org.br ${url.origin}; connect-src 'self' ${url.origin} wss://${url.host}; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`,
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000',
  };
}

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };

export function createSecureServer({ directory = resolve('dist'), supabaseOrigin = process.env.SUPABASE_ORIGIN } = {}) {
  const root = resolve(directory);
  const headers = securityHeaders(supabaseOrigin);
  return createServer(async (req, res) => {
    for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
    res.setHeader('Cache-Control', 'no-cache');
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return;
    }
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const file = resolve(root, `.${pathname}`);
      if (file !== root && !file.startsWith(root + sep)) { res.writeHead(400); res.end(); return; }
      let target = file;
      try { if (!(await stat(target)).isFile()) target = resolve(root, 'index.html'); }
      catch { target = extname(pathname) ? null : resolve(root, 'index.html'); }
      if (!target) { res.writeHead(404); res.end(); return; }
      const body = await readFile(target);
      res.writeHead(200, { 'Content-Type': types[extname(target)] || 'application/octet-stream' });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch { res.writeHead(400); res.end(); }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createSecureServer().listen(Number(process.env.PORT || 8080), process.env.HOST || '127.0.0.1', () => {
    console.log('Secure production server listening');
  });
}
