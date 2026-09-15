// Bump this version whenever the app shell changes.
const CACHE_PREFIX = 'darkroom-tools-';
const CACHE_NAME = CACHE_PREFIX + 'v3';
const APP_SHELL = [
  './index.html', './js/data.js', './js/math.js', './js/app.js',
  './manifest.json', './icon.svg', './icon-192.png', './icon-512.png'
];
const APP_URLS = new Set(APP_SHELL.map(path => new URL(path, self.registration.scope).href));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL.map(path => new Request(new URL(path, self.registration.scope), {cache: 'reload'})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!url.href.startsWith(self.registration.scope)) return;
  const scope = new URL(self.registration.scope);
  const appNavigation = event.request.mode === 'navigate'
    && (url.pathname === scope.pathname || url.pathname === scope.pathname + 'index.html');
  if (!appNavigation && !APP_URLS.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const key = appNavigation ? new URL('./index.html', self.registration.scope).href : event.request;
    const cached = await cache.match(key);
    if (cached) return cached;
    // A failed fetch rejects normally; never resolve respondWith with undefined.
    return fetch(event.request);
  })());
});
