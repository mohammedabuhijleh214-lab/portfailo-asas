/* Cyber Warden — Service Worker */
'use strict';

const CACHE = 'cw-flagship-v3';
const PRECACHE = [
  './',
  './index.html',
  './offline.html',
  './404.html',
  './css/style.css',
  './css/animations.css',
  './css/flagship.css',
  './css/terminal.css',
  './css/dashboard.css',
  './css/rtl.css',
  './css/responsive.css',
  './css/errors.css',
  './js/config.js',
  './js/security.js',
  './js/script.js',
  './js/i18n.js',
  './js/particles.js',
  './js/terminal.js',
  './js/dashboard.js',
  './js/showcase.js',
  './js/viz.js',
  './js/contact.js',
  './js/sound.js',
  './js/gsap-story.js',
  './js/three-bg.js',
  './js/seo.js',
  './js/pwa.js',
  './js/media.js',
  './js/a11y.js',
  './assets/icons/favicon.svg',
  './assets/icons/icon-192.svg',
  './assets/icons/icon-512.svg',
  './manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/') || url.hostname === '127.0.0.1' && url.port === '8787') {
    event.respondWith(fetch(request).catch(() => caches.match('./offline.html')));
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request).then((c) => c || caches.match('./offline.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetched;
    })
  );
});
