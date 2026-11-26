/* CTD Trader — service worker v8.5.5
   Network-first (по чистому URL, без ?t=): HTML, style.css, app.js, manifest, data/prices|history|icons|game-icons.json
   Остальное (иконки, картинки юнитов): stale-while-revalidate
   Web Share Target: POST ./share-target -> файлы кладутся в кэш 'ctd-share', редирект на ./?share=1 */
const VERSION = 'ctd-v8.5.5';
const SHARE_CACHE = 'ctd-share';
const CORE = ['./', './index.html', './style.css', './app.js', './manifest.json', './icon.svg'];
const DATA_FILES = ['prices.json', 'history.json', 'icons.json', 'game-icons.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION)
      .then((c) => c.addAll(CORE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== SHARE_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

function isDataFile(url) {
  return DATA_FILES.some((f) => url.pathname.endsWith('/data/' + f));
}

function isFresh(req, url) {
  return req.mode === 'navigate'
    || (req.headers.get('accept') || '').includes('text/html')
    || url.pathname.endsWith('/')
    || url.pathname.endsWith('.html')
    || url.pathname.endsWith('/style.css')
    || url.pathname.endsWith('/app.js')
    || url.pathname.endsWith('/manifest.json')
    || isDataFile(url);
}

async function networkFirst(req, url) {
  const cache = await caches.open(VERSION);
  // data/*.json кэшируем по чистому URL (без ?t=...), чтобы не плодить дубли
  const key = isDataFile(url) ? (url.origin + url.pathname) : req;
  try {
    const res = await fetch(req, { cache: 'no-store' });
    if (!res || !res.ok) throw new Error('bad status');
    cache.put(key, res.clone());
    return res;
  } catch {
    const hit = (await cache.match(key)) || (await cache.match(req, { ignoreSearch: true }));
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
  const net = fetch(req)
    .then((res) => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; })
    .catch(() => null);
  return hit || (await net) || new Response('', { status: 504 });
}

/* Web Share Target: manifest.json -> share_target.action = "./share-target", method POST, enctype multipart/form-data, поле "shots" */
async function handleShare(req) {
  try {
    const form = await req.formData();
    const files = form.getAll('shots').filter((f) => f && typeof f !== 'string');
    const cache = await caches.open(SHARE_CACHE);
    // очищаем прошлые расшаренные файлы
    for (const k of await cache.keys()) await cache.delete(k);
    let i = 0;
    for (const f of files) {
      const name = encodeURIComponent(f.name || ('shot-' + i));
      await cache.put(
        new Request('./__shared__/' + i + '-' + name),
        new Response(f, { headers: { 'Content-Type': f.type || 'image/png', 'X-Name': name } })
      );
      i++;
    }
    return Response.redirect('./?share=' + (i || 0), 303);
  } catch {
    return Response.redirect('./', 303);
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  if (req.method === 'POST' && url.origin === location.origin && url.pathname.endsWith('/share-target')) {
    e.respondWith(handleShare(req));
    return;
  }

  if (req.method !== 'GET') return;
  if (!/^https?:$/.test(url.protocol)) return;
  if (url.origin !== location.origin && !/\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(url.pathname)) return;
  if (url.origin === location.origin && url.pathname.includes('/__shared__/')) return; // читает только страница из кэша напрямую
  if (url.origin === location.origin && isFresh(req, url)) e.respondWith(networkFirst(req, url));
  else e.respondWith(staleWhileRevalidate(req));
});
