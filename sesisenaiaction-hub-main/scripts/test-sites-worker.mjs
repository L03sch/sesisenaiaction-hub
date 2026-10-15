import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSitesWorker } from './build-sites-worker.mjs';
import { securityHeaders } from './security-headers.mjs';

test('Sites Worker preserves binary assets and SPA routes with headers on every response', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sites-security-'));
  try {
    const html = '<div id="root">Plano de ação</div>';
    await writeFile(join(dir, 'index.html'), html);
    await writeFile(join(dir, 'logo.png'), new Uint8Array([0, 255, 128, 42]));
    await writeFile(join(dir, '_headers'), 'not a public asset');
    const output = join(dir, 'worker.mjs');
    const origin = 'https://example.supabase.co';
    await buildSitesWorker(dir, output, origin);
    const { default: worker } = await import(`data:text/javascript;base64,${(await readFile(output)).toString('base64')}`);
    for (const [path, method, status] of [['/auth','GET',200], ['/plans/id/edit','GET',200], ['/logo.png','GET',200], ['/missing.js','GET',404], ['/.git/config','GET',404], ['/auth','POST',405], ['/plans','HEAD',200], ['/%ZZ','GET',400]]) {
      const response = worker.fetch(new Request('https://site.test' + path, { method }));
      assert.equal(response.status, status, path);
      for (const [name, value] of Object.entries(securityHeaders(origin))) assert.equal(response.headers.get(name), value, `${path}: ${name}`);
      if (path === '/auth' && method === 'GET') assert.equal(await response.text(), html);
      if (path === '/logo.png') assert.deepEqual(new Uint8Array(await response.arrayBuffer()), new Uint8Array([0, 255, 128, 42]));
      if (method === 'HEAD') assert.equal(await response.text(), '');
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
});
