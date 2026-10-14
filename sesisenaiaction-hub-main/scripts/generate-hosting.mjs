import { loadEnv } from 'vite';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { securityHeaders } from './security-headers.mjs';

const mode = process.argv[2] || 'production';
const env = loadEnv(mode, process.cwd(), 'VITE_');
const origin = env.VITE_SUPABASE_URL;
const headers = securityHeaders(origin);
const directory = resolve('dist');
await writeFile(resolve(directory, '_headers'), `/*\n${Object.entries(headers).map(([name, value]) => `  ${name}: ${value}`).join('\n')}\n`);
await writeFile(resolve(directory, 'security-config.json'), JSON.stringify({ supabaseOrigin: new URL(origin).origin }, null, 2) + '\n');

// Meta is a fallback for static hosts that ignore _headers. Frame protection,
// HSTS and nosniff still require HTTP response headers from the hosting layer.
const csp = headers['Content-Security-Policy'].replace("; frame-ancestors 'none'", '');
const escape = value => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const index = resolve(directory, 'index.html');
const html = await readFile(index, 'utf8');
await writeFile(index, html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${escape(csp)}" />\n    <meta name="referrer" content="${headers['Referrer-Policy']}" />`));
console.log('Generated hosting headers and CSP from the build Supabase origin');
