/* MedBank service worker — offline caching + best-effort daily reminder */
const CACHE = 'medbank-v2';
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

/* recurring reminder via periodic background sync (Chrome/Android; best-effort timing) */
self.addEventListener('periodicsync', event => {
  if (event.tag === 'medbank-nudge' || event.tag === 'medbank-daily') event.waitUntil(maybeRemind());
});
function notifyOpts(body, url, strict) {
  return {
    body: body || 'Cards are due.',
    icon: './icon.svg', badge: './icon.svg', tag: 'medbank-nudge',
    renotify: true, requireInteraction: !!strict, silent: false,
    vibrate: [250, 120, 250, 120, 250],
    actions: [{ action: 'review', title: '▶ Review now' }, { action: 'later', title: 'Later' }],
    data: { url: url || './index.html#/nudge' }
  };
}
async function maybeRemind() {
  try {
    // prefer a page-staged payload that carries the actual cards
    const body = await readFlag('payloadBody');
    const url  = (await readFlag('payloadUrl')) || './index.html#/nudge';
    const strict = (await readFlag('strict')) === '1';
    if (body) { await self.registration.showNotification('MedBank', notifyOpts(body, url, strict)); return; }
    // fallback if nothing staged
    const hc = parseInt((await readFlag('hardCount')) || '0', 10);
    const n = Math.min(5, hc);
    const fb = hc > 0 ? `Review ${n} hard card${n === 1 ? '' : 's'} to keep them sharp.`
                      : 'Time for a quick review — keep your streak alive.';
    await self.registration.showNotification('MedBank', notifyOpts(fb, hc > 0 ? './index.html#/nudge' : './index.html#/today', strict));
  } catch (e) {}
}
/* message channel: page tells the SW its state, stages a card payload, or asks it to notify */
self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.type === 'studied')   writeFlag('lastStudied', d.date);
  if (d.type === 'hardcount') writeFlag('hardCount', String(d.n || 0));
  if (d.type === 'payload')   { writeFlag('payloadBody', d.body || ''); writeFlag('payloadUrl', d.url || './index.html#/nudge'); }
  if (d.type === 'notify')    { writeFlag('strict', d.strict ? '1' : '0'); self.registration.showNotification('MedBank', notifyOpts(d.body, d.url, d.strict)); }
});
/* tiny IndexedDB-free flag store using Cache API */
async function writeFlag(k, v) { const c = await caches.open(CACHE); await c.put('flag:' + k, new Response(v)); }
async function readFlag(k) { const c = await caches.open(CACHE); const r = await c.match('flag:' + k); return r ? r.text() : null; }

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'later') return;            // dismiss without opening
  const url = (e.notification.data && e.notification.data.url) || './index.html#/nudge';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) { if ('focus' in c) { if (c.navigate) { try { c.navigate(url); } catch (_) {} } return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
