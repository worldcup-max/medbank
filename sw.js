/* MedBank service worker — offline caching + best-effort daily reminder */
const CACHE = 'medbank-v167';
const ASSETS = ['./', './index.html', './app.html', './content.js', './icon.svg', './manifest.webmanifest',
  './site.css', './config.js', './sync.js', './level-switcher.js', './paywall.js', './import-tab.js',
  './lecture-record.js', './study-timer.js', './study-dock.js', './content-loader.js', './auth-ui.js',
  './restore.js', './mb-personal-restore.js', './404.html'];

self.addEventListener('install', e => {
  // Resilient precache: cache each asset individually so ONE missing/failed file
  // can never fail the whole install (which would leave users stuck on the old build).
  e.waitUntil(
    caches.open(CACHE).then(c => Promise.all(ASSETS.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
/* Stale-while-revalidate: serve the app shell INSTANTLY from cache, then refresh the
   cache in the background for next time. The whole shell stays one consistent cache
   generation, so versions never mix. New builds still arrive reliably: bumping CACHE
   makes the browser install a fresh SW (which re-fetches every asset), and the page's
   existing controllerchange handler auto-reloads once onto the new version. */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  let url; try { url = new URL(e.request.url); } catch (_) { return; }
  // never touch cross-origin requests (Supabase, Render API, Puter, CDNs) — straight to network
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetching = fetch(e.request).then(res => {
        // only cache good, same-origin (basic) responses — never opaque/error responses
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      }).catch(() => null);
      // cache first (fast); if nothing cached, wait on the network; final fallback = app shell
      return cached || fetching.then(r => r || caches.match('./app.html')).then(r => r || caches.match('./index.html'));
    })
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
    data: { url: url || './app.html#/nudge' }
  };
}
async function maybeRemind() {
  try {
    // prefer a page-staged payload that carries the actual cards
    const body = await readFlag('payloadBody');
    const url  = (await readFlag('payloadUrl')) || './app.html#/nudge';
    const strict = (await readFlag('strict')) === '1';
    if (body) { await self.registration.showNotification('MedBank', notifyOpts(body, url, strict)); return; }
    // fallback if nothing staged
    const hc = parseInt((await readFlag('hardCount')) || '0', 10);
    const n = Math.min(5, hc);
    const fb = hc > 0 ? `Review ${n} hard card${n === 1 ? '' : 's'} to keep them sharp.`
                      : 'Time for a quick review — keep your streak alive.';
    await self.registration.showNotification('MedBank', notifyOpts(fb, hc > 0 ? './app.html#/nudge' : './app.html#/today', strict));
  } catch (e) {}
}
/* message channel: page tells the SW its state, stages a card payload, or asks it to notify */
self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.type === 'skipWaiting') self.skipWaiting();
  if (d.type === 'studied')   writeFlag('lastStudied', d.date);
  if (d.type === 'hardcount') writeFlag('hardCount', String(d.n || 0));
  if (d.type === 'payload')   { writeFlag('payloadBody', d.body || ''); writeFlag('payloadUrl', d.url || './app.html#/nudge'); }
  if (d.type === 'notify')    { writeFlag('strict', d.strict ? '1' : '0'); self.registration.showNotification('MedBank', notifyOpts(d.body, d.url, d.strict)); }
});
/* tiny IndexedDB-free flag store using Cache API */
async function writeFlag(k, v) { const c = await caches.open(CACHE); await c.put('flag:' + k, new Response(v)); }
async function readFlag(k) { const c = await caches.open(CACHE); const r = await c.match('flag:' + k); return r ? r.text() : null; }

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'later') return;            // dismiss without opening
  const url = (e.notification.data && e.notification.data.url) || './app.html#/nudge';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) { if ('focus' in c) { if (c.navigate) { try { c.navigate(url); } catch (_) {} } return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
