import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/service-worker.js', import.meta.url), 'utf8');
function worker() {
  const scope = 'https://example.org/quadro/';
  const listeners = {}, data = new Map(), deleted = [], network = [];
  const cache = {
    async addAll(urls) { for (const url of urls) data.set(url, { url, cached: true }); },
    async match(key) { return data.get(key); },
    async put(key, value) { data.set(key, value); },
  };
  vm.runInNewContext(`const VERSION = 'test'; const PRECACHE = ['./', 'index.html', 'assets/app.js'];\n${source}`, {
    URL, Set, self: { registration: { scope }, clients: { claim: async () => {} }, addEventListener: (name, callback) => { listeners[name] = callback; } },
    caches: { open: async () => cache, keys: async () => [`quadro-livre:${scope}:old`, `quadro-livre:${scope}:test`, 'unrelated-cache'],
      delete: async key => deleted.push(key) },
    fetch: async request => { network.push(request.url); return { ok: true, clone: () => ({ network: true }) }; },
  });
  return {
    data, deleted, network,
    async lifecycle(name) { let promise; listeners[name]({ waitUntil: value => { promise = value; } }); await promise; },
    async fetch(url, mode = 'cors', method = 'GET') {
      let response;
      listeners.fetch({ request: { url, mode, method }, respondWith: value => { response = value; } });
      return response;
    },
  };
}

test('install precaches shell; offline navigation resolves cached index in subdirectory', async () => {
  const sw = worker();
  await sw.lifecycle('install');
  assert.equal(sw.data.size, 3);
  const response = await sw.fetch('https://example.org/quadro/?installed=1', 'navigate');
  assert.equal(response.url, 'https://example.org/quadro/index.html');
  assert.equal(response.cached, true);
  assert.equal(sw.network.length, 0);
});

test('activation deletes only older caches belonging to this exact scope', async () => {
  const sw = worker();
  await sw.lifecycle('activate');
  assert.deepEqual(sw.deleted, ['quadro-livre:https://example.org/quadro/:old']);
});

test('worker does not intercept cross-origin, other scopes, writes or unknown assets', async () => {
  const sw = worker();
  for (const args of [['https://other.org/quadro/assets/app.js'], ['https://example.org/another/'],
    ['https://example.org/quadro/api/private'], ['https://example.org/quadro/assets/app.js', 'cors', 'POST']]) {
    assert.equal(await sw.fetch(...args), undefined);
  }
  assert.equal(sw.network.length, 0);
});

test('precached hashed assets work offline with query strings', async () => {
  const sw = worker();
  await sw.lifecycle('install');
  assert.equal((await sw.fetch('https://example.org/quadro/assets/app.js?v=1')).cached, true);
  assert.equal(sw.network.length, 0);
});
