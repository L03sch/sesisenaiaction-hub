import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { securityHeaders } from './security-headers.mjs';

// Sites static hosting does not apply _headers. Embed the already-built files
// in a Worker so every HTTP response carries the same reviewed policy.
export async function buildSitesWorker(directory, output, supabaseOrigin) {
  const files = Object.create(null);
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };
  async function collect(root, prefix = '') {
    for (const entry of await readdir(root, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name.startsWith('_') || entry.name === 'security-config.json') continue;
      const pathname = `${prefix}/${entry.name}`;
      const filename = resolve(root, entry.name);
      if (entry.isDirectory()) await collect(filename, pathname);
      else if (entry.isFile()) files[pathname] = { type: types[extname(entry.name)] || 'application/octet-stream', body: (await readFile(filename)).toString('base64') };
      else throw new Error('Static files must not contain symlinks or special entries');
    }
  }
  await collect(resolve(directory));
  if (!files['/index.html']) throw new Error('Missing application index.html');
  const policy = securityHeaders(supabaseOrigin);
  const source = `const files = JSON.parse(${JSON.stringify(JSON.stringify(files))});
const policy = ${JSON.stringify(policy)};
export default {
  fetch(request) {
    const headers = new Headers(policy);
    headers.set('Cache-Control', 'no-cache');
    if (!['GET', 'HEAD'].includes(request.method)) {
      headers.set('Allow', 'GET, HEAD');
      return new Response(null, { status: 405, headers });
    }
    let path;
    try { path = decodeURIComponent(new URL(request.url).pathname); }
    catch { return new Response(null, { status: 400, headers }); }
    if (path.includes('\\\\') || path.split('/').some(part => part === '..' || part.startsWith('.'))) return new Response(null, { status: 404, headers });
    let file = Object.hasOwn(files, path) ? files[path] : null;
    if (!file && !path.split('/').pop().includes('.')) file = files['/index.html'];
    if (!file) return new Response(null, { status: 404, headers });
    headers.set('Content-Type', file.type);
    const bytes = request.method === 'HEAD' ? null : Uint8Array.from(atob(file.body), c => c.charCodeAt(0));
    return new Response(bytes, { status: 200, headers });
  }
};
`;
  await mkdir(resolve(output, '..'), { recursive: true });
  await writeFile(output, source);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [directory, output, origin] = process.argv.slice(2);
  if (!directory || !output || !origin) throw new Error('Provide static directory, Worker output file and Supabase origin');
  await buildSitesWorker(directory, output, origin);
}
