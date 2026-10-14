import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export async function verifyHosting(origin) {
  const base = new URL(origin);
  const local = ['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname);
  if ((base.protocol !== 'https:' && !(local && base.protocol === 'http:')) || base.username || base.password || base.pathname !== '/' || base.search || base.hash) {
    throw new Error('Provide an HTTPS origin, or an HTTP loopback origin for local QA');
  }
  const problems = [];
  for (const path of ['/auth', '/dashboard', '/plans']) {
    const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(15000) });
    const prefix = `${path}: `;
    if (!local && new URL(response.url).protocol !== 'https:') problems.push(prefix + 'HTTPS downgrade');
    if (new URL(response.url).origin !== base.origin) problems.push(prefix + 'redirected to another origin');
    if (response.status !== 200) problems.push(prefix + `HTTP ${response.status}`);
    if (!response.headers.get('content-type')?.includes('text/html')) problems.push(prefix + 'response is not HTML');
    const csp = response.headers.get('content-security-policy') || '';
    for (const directive of ["frame-ancestors 'none'", "object-src 'none'", "script-src 'self'"]) {
      if (!csp.split(';').some(part => part.trim() === directive)) problems.push(prefix + 'missing CSP ' + directive);
    }
    for (const [name, expected] of Object.entries({ 'x-frame-options': 'DENY', 'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin-when-cross-origin' })) {
      if (response.headers.get(name) !== expected) problems.push(prefix + 'missing/incorrect ' + name);
    }
    const hsts = response.headers.get('strict-transport-security') || '';
    if (Number(hsts.match(/(?:^|;)\s*max-age=(\d+)/i)?.[1] || 0) < 31536000) problems.push(prefix + 'missing/short HSTS');
    const html = await response.text();
    if (!html.includes('id="root"') || !/<script[^>]+src=/.test(html)) problems.push(prefix + 'response is not the application shell');
  }
  if (problems.length) throw new Error(problems.join('\n'));
  return 'Protective headers and SPA responses verified on /auth, /dashboard and /plans';
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(await verifyHosting(process.argv[2])); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
