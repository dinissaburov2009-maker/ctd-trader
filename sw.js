/* CTD Trader — service worker v5.3.0
   HTML и data/*.json (prices, history, icons): network-first (всегда свежее, кэш только офлайн)
   Остальное (иконки, картинки юнитов): stale-while-revalidate */
const VERSION = 'ctd-v5.3.0';
const CORE = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE).catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

function isFresh(req, url) {
  return req.mode === 'navigate'
    || (req.headers.get('accept') || '').includes('text/html')
    || url.pathname.endsWith('/')
    || url.pathname.endsWith('.html')
    || url.pathname.endsWith('/data/prices.json')
    || url.pathname.endsWith('/data/history.json')
    || url.pathname.endsWith('/data/icons.json')
    || url.pathname.endsWith('/manifest.json');
}

async function networkFirst(req) {
  const cache = await caches.open(VERSION);
  try {
    const res = await fetch(req, { cache: 'no-store' });
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate') {
      const page = await cache.match('./index.html');
      if (page) return page;
    }
    return new Response('', { status: 503, statusText: 'offline' });
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(req);
  const net = fetch(req).then((res) => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; }).catch(() => null);
  return hit || (await net) || new Response('', { status: 504 });
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (!/^https?:$/.test(url.protocol)) return;
  if (url.origin !== location.origin && !/\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(url.pathname)) return;
  if (url.origin === location.origin && isFresh(req, url)) e.respondWith(networkFirst(req));
  else e.respondWith(staleWhileRevalidate(req));
});
