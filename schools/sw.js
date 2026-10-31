/* NoobTrader: clean-up service worker for the retired /schools/ address.
 *
 * Published by scripts/deploy-web.mjs as schools/sw.js in the website repo,
 * and it is the ONLY file left in schools/. https://noob-trader.com/schools/
 * itself answers 404 like any missing page; https://noob-trader.com/app/ is
 * the only app (founder, 31 Oct 2026: "only noob-trader.com/app/ --- schools
 * is not available anymore").
 *
 * WHY IT EXISTS
 * Anyone who installed "NT Schools" to the home screen, or opened /schools/ in
 * a browser, has a service worker registered with scope /schools/ that serves
 * the old cached app. If /schools/sw.js simply disappeared, the browser's
 * update check would get a 404, and a 404 KEEPS the existing worker: those
 * people would run a stale app against the live database indefinitely. The
 * running app asks for /schools/sw.js on every launch and every return to the
 * foreground (src/main.jsx), finds this file, and installs it. This worker
 * then sends every open /schools/ window to the same address under /app/
 * (query and hash kept) and stays, redirecting later launches the same way.
 *
 * CACHES ARE LEFT ALONE. Cache storage is shared by the whole origin, and the
 * /schools/ copy was the SAME build as /app/ (public/sw.js names its cache
 * "nt-<build id>-shell" in both places), so the two cannot be told apart.
 * Deleting any could empty /app/'s offline shell. /app/'s own worker already
 * deletes every cache that is not its current build's.
 *
 * WHEN IT CAN BE DELETED
 * After 31 Oct 2027. By then any phone that still had the old worker will
 * have opened it (and been cleaned up) or the app will long since have been
 * removed. Delete this file and the stageSchoolsKillSwitch() step in
 * scripts/deploy-web.mjs together, and the /schools/ checks in
 * .github/workflows/deploy-website.yml.
 */

const OLD_PREFIX = "/schools";
const NEW_PREFIX = "/app";

/** The same address under /app/, or null when the URL is not under /schools/. */
const appUrlFor = (href) => {
  let url;
  try { url = new URL(href); } catch { return null; }
  if (url.origin !== self.location.origin) return null;
  const p = url.pathname;
  if (p !== OLD_PREFIX && !p.startsWith(`${OLD_PREFIX}/`)) return null;
  const rest = p.slice(OLD_PREFIX.length) || "/";
  url.pathname = `${NEW_PREFIX}${rest}`;
  return url.href;                                   // search and hash ride along
};

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Take every /schools/ window first, so navigate() below is allowed on it.
    // It does NOT unregister: an installed "NT Schools" icon opens /schools/
    // (its old manifest's start_url) on every tap, and only this worker's
    // fetch redirect below stands between that tap and a 404 with no address
    // bar. Staying registered also covers the reload the old app does when
    // this worker takes control. Anyone without the worker still gets 404.
    try { await self.clients.claim(); } catch { /* still move them */ }
    let windows = [];
    try { windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true }); } catch { windows = []; }
    await Promise.all(windows.map((client) => {
      const to = appUrlFor(client.url);
      if (!to || typeof client.navigate !== "function") return null;
      return client.navigate(to).catch(() => null);
    }));
  })());
});

// Every page load under /schools/ (an installed icon's launch, a bookmark in a
// browser that had the old app, the old app's reload on takeover) goes to the
// same address under /app/.
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  const to = appUrlFor(event.request.url);
  if (to) event.respondWith(Response.redirect(to, 302));
});
