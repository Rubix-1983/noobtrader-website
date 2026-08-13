/* NoobTrader service worker.
 *
 * Exists for two reasons:
 *   1. A browser will not offer "Install" without a service worker that has a
 *      fetch handler. This is what turns the site into something that sits on
 *      the home screen instead of an APK you have to sideload.
 *   2. Offline resilience for the shell, so opening the app on a bad connection
 *      shows the UI rather than the browser's dinosaur.
 *
 * DELIBERATELY CONSERVATIVE ABOUT DATA. This is a trading app: a cached price
 * is a WRONG price, and the server now refuses trades against stale quotes
 * anyway. So market data, Supabase and every API call go straight to the
 * network and are never served from cache. Only the immutable build output —
 * hashed JS/CSS and brand images — is cached.
 */

// 20260813133418 is replaced with the build timestamp by the swVersion() plugin in
// vite.config.js. It MUST change every deploy: the activate handler deletes any
// cache whose key does not start with VERSION, so a constant version means an
// old shell can never be evicted. That is how a user ends up pinned to a build
// from before a fix and reports the bug as still present.
const VERSION = "nt-20260813133418";
const SHELL = `${VERSION}-shell`;

// Anything the app cannot function without. Scope-relative so this works under
// /app/ on noob-trader.com as well as at the origin root (Capacitor, Express).
const SHELL_URLS = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL)
      // Individually, so one 404 cannot fail the whole install and leave the
      // app permanently uninstallable.
      .then((cache) => Promise.allSettled(SHELL_URLS.map((u) => cache.add(u))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)),
      ))
      .then(() => self.clients.claim()),
  );
});

// Never cache anything that could go stale in a way that misleads a trader.
const isLiveData = (url) =>
  url.pathname.startsWith("/api/") ||
  url.hostname.endsWith(".supabase.co") ||
  url.hostname === "auth.noob-trader.com" ||
  url.hostname.endsWith(".onrender.com");

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (isLiveData(url)) return;                       // straight to the network
  if (url.origin !== self.location.origin) return;   // fonts etc. — let the browser decide

  // Navigations: network first so a deploy is picked up immediately, falling
  // back to the cached shell when offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put("./index.html", copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("./index.html", { ignoreSearch: true })
          .then((r) => r || caches.match("./"))),
    );
    return;
  }

  // Build output is content-hashed, so a cache hit is always the right file.
  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok && res.type === "basic") {
        const copy = res.clone();
        caches.open(SHELL).then((c) => c.put(req, copy)).catch(() => {});
      }
      return res;
    })),
  );
});

// Lets the page trigger an immediate update instead of waiting for all tabs to
// close — used by the "new version available" path in main.jsx.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
