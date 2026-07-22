/* MedBank service worker — offline caching + best-effort daily reminder */
const CACHE = 'medbank-v1';
const ASSETS = ['./', './index.html', './content.js', './icon.svg', './manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
/* network-first for content so updates show, cache fallback offline */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});

/* daily reminder via periodic background sync (Chrome/Android) */
self.addEventListener('periodicsync', event => {
  if (event.tag === 'medbank-daily') event.waitUntil(maybeRemind());
});
async function maybeRemind() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const done = await readFlag('lastStudied');
    if (done === today) return;               // already studied today
    await self.registration.showNotification('MedBank', {
      body: 'Time for today’s review — keep your streak alive.',
      icon: './icon.svg', badge: './icon.svg', tag: 'medbank-daily'
    });
  } catch (e) {}
}
/* simple message channel so the page can tell the SW when it last studied */
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'studied') writeFlag('lastStudied', e.data.date);
  if (e.data && e.data.type === 'notify') {
    self.registration.showNotification('MedBank', { body: e.data.body || 'Cards are due.', icon: './icon.svg', tag: 'medbank-daily' });
  }
});
/* tiny IndexedDB-free flag store using Cache API */
async function writeFlag(k, v) { const c = await caches.open(CACHE); await c.put('flag:' + k, new Response(v)); }
async function readFlag(k) { const c = await caches.open(CACHE); const r = await c.match('flag:' + k); return r ? r.text() : null; }

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(cs => {
    for (const c of cs) if ('focus' in c) return c.focus();
    return self.clients.openWindow('./index.html');
  }));
});
