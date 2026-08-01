// Landing-page service worker.
//
// Its only real job is to make https://noob-trader.com/ installable, so the
// "Install app" button on the landing page has something to prompt with —
// Chrome will not fire `beforeinstallprompt` on a page that has no service
// worker with a fetch handler.
//
// It is deliberately inert everywhere except the marketing page itself. Its
// scope is "/" (it has to be, for the root page), which means it would
// otherwise sit in front of the real app at /app/ as well. Any request outside
// this file's own asset list falls straight through to the network with no
// respondWith(), so the app keeps whatever caching its own build gives it.

const CACHE = 'nt-site-v1';
const SHELL = ['/', '/index.html', '/logo.png', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // Individually, so one missing asset cannot fail the whole install.
      .then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Hands the app back to itself — see the note at the top.
  if (url.pathname.startsWith('/app')) return;

  const isShell = SHELL.includes(url.pathname) || req.mode === 'navigate';
  if (!isShell) return;

  // Network first: the marketing copy changes far more often than it is read
  // offline, so a stale landing page is the worse failure of the two.
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('/index.html'))),
  );
});
