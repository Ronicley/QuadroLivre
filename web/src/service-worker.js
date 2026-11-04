/* VERSION and PRECACHE are injected from the actual Vite build output. */
const PREFIX = `quadro-livre:${self.registration.scope}:`;
const CACHE = `${PREFIX}${VERSION}`;
const urls = PRECACHE.map(file => new URL(file, self.registration.scope).href);
const allowed = new Set(urls);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(urls)));
  // Keep updates waiting while an older editor is open; never reload during a stroke.
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (!url.href.startsWith(self.registration.scope)) return;
  url.search = '';
  const navigation = request.mode === 'navigate';
  const key = navigation ? new URL('index.html', self.registration.scope).href : url.href;
  if (!navigation && !allowed.has(key)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const saved = await cache.match(key);
    if (saved) return saved;
    const response = await fetch(request);
    if (response.ok && allowed.has(key)) await cache.put(key, response.clone());
    return response;
  })());
});
