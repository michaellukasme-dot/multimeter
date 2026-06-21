/* Amp Academy course player — service worker (B-3, SAS §2.3)
   Offline-first runtime cache. Structure-agnostic: caches each successful
   same-origin GET (shell, lessons, css, js, fonts) so the course works offline
   after first visit. Bump CACHE on any shipped asset change. */
const CACHE = 'aa-mm-v6';   /* v3: tutor relay live + window.Tutor exposure fix 2026-06-19 */

self.addEventListener('install', e => { self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit =>
      hit || fetch(e.request).then(resp => {
        if (resp && (resp.ok || resp.type === 'opaque')) {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return resp;
      }).catch(() => caches.match(e.request))
    )
  );
});
