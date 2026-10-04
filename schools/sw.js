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

// 20261004142633 is replaced with the build timestamp by the swVersion() plugin in
// vite.config.js. It MUST change every deploy: the activate handler deletes any
// cache whose key does not start with VERSION, so a constant version means an
// old shell can never be evicted. That is how a user ends up pinned to a build
// from before a fix and reports the bug as still present.
const VERSION = "nt-20261004142633";
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

// Lets a page ask this worker to take over immediately instead of waiting for
// every tab to close. The install handler already calls skipWaiting, so this
// is a belt-and-braces hook rather than the main path: what actually gets a
// user onto a new build is the controllerchange listener in src/main.jsx,
// which reloads the running page once the new worker claims it. This comment
// used to claim main.jsx already did that. It did not, and users stayed on
// old builds until they happened to reopen the app.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

// ─── WEB PUSH (notifications plan R2, §3.2 item 5, §7.6) ─────────────────
// The push worker on the server (server/push/) sends Declarative Web Push
// JSON to every endpoint:
//   {"web_push":8030,
//    "notification":{"title","body","navigate","lang","dir","tag"},
//    "nt":{"o":<route key>,"n":<notice id>,"d":<delivery id>}}
// Safari 18.4+ can show that with no JavaScript at all; every other browser
// (and Safari, when this worker is running) hands it to the `push` handler
// below. The text was rendered on the server from fixed templates in the
// learner's language, and carries no name, amount or share count.
//
// Three rules this code keeps:
//   1. EVERY push shows a notification, a malformed or empty one included.
//      Safari revokes the permission of a site whose push shows nothing, and
//      Chrome shows its own "site updated in the background" line instead.
//      The fallback is fixed English, baked in here: a broken payload has no
//      language to speak.
//   2. A tap never opens a URL taken from the payload. Only the route KEY is
//      read, checked against the same allow-list as the app
//      (src/constants/notifications.js NOTIF_ROUTES, pinned by
//      public/sw.push.test.js), and the app is opened at its own scope with
//      ?open=<key>&n=<id>&d=<id>. Anything else opens Home. The app then acts
//      on it past its sign-in gates, and only after the server says the
//      notice belongs to the learner signed in (notif_open, owner-scoped).
//   3. No action buttons, no requireInteraction, no vibration pattern, no
//      re-alert when a notice replaces one with the same tag (plan §2.2).
const NT_PUSH_ROUTES = [
  "home", "wallet", "cfd", "bot_lab", "orders", "compete", "cup", "friends",
  "friends_pending", "inbox", "notify_settings", "report_daily", "report_weekly",
  "admin_queue", "asset", "admin_signups",
];
const NT_PUSH_FALLBACK = { title: "NoobTrader", body: "You have an update" };
const NT_TAG_RE = /^[A-Za-z0-9_-]{1,32}$/;
const NT_LANG_RE = /^[a-z]{2,3}(-[A-Za-z0-9]{2,4})?$/;

const ntPosInt = (v) => {
  const s = String(v ?? "").trim();
  if (!/^\d{1,18}$/.test(s)) return null;
  const n = Number(s);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
};

/** { o, n, d } with `o` on the allow-list (else "home"), n and d positive ints or null. */
const ntTapData = (raw) => {
  const r = raw && typeof raw === "object" ? raw : {};
  return {
    o: NT_PUSH_ROUTES.includes(r.o) ? r.o : "home",
    n: ntPosInt(r.n),
    d: ntPosInt(r.d),
  };
};

const ntText = (v, max) => (typeof v === "string" && v.trim() ? v.slice(0, max) : null);

/**
 * What to show for one push event's data (a PushMessageData, or anything with
 * .json() / .text()). Never throws: a payload that cannot be read is the
 * fixed English fallback.
 */
const ntNotificationFor = (data) => {
  let msg = null;
  try { msg = data ? data.json() : null; } catch { msg = null; }
  const note = msg && typeof msg === "object" && msg.notification && typeof msg.notification === "object"
    ? msg.notification : null;
  const title = (note && ntText(note.title, 120)) || NT_PUSH_FALLBACK.title;
  const body = (note && ntText(note.body, 300)) || (note && ntText(note.title, 120) ? "" : NT_PUSH_FALLBACK.body);
  const options = {
    body,
    icon: "./icon-192.png",
    badge: "./notif-badge-72.png",
    data: ntTapData(msg && msg.nt),
    renotify: false,
  };
  if (note && NT_TAG_RE.test(note.tag || "")) options.tag = note.tag;
  if (note && NT_LANG_RE.test(note.lang || "")) options.lang = note.lang;
  if (note && (note.dir === "rtl" || note.dir === "ltr")) options.dir = note.dir;
  return { title, options };
};

/** The app's own address for a tap: ./?open=<o>&n=<n>&d=<d> at this worker's scope. */
const ntOpenUrl = (scope, tap) => {
  const q = new URLSearchParams({ open: tap.o });
  if (tap.n) q.set("n", String(tap.n));
  if (tap.d) q.set("d", String(tap.d));
  return new URL(`./?${q.toString()}`, scope).href;
};

const ntOnPush = (event) => {
  const { title, options } = ntNotificationFor(event.data);
  const shown = self.registration.showNotification(title, options)
    .catch(() => self.registration.showNotification(NT_PUSH_FALLBACK.title, { body: NT_PUSH_FALLBACK.body }));
  // An open app refreshes its bell at once instead of waiting for its poll.
  const told = self.clients.matchAll({ type: "window", includeUncontrolled: true })
    .then((list) => { for (const c of list) c.postMessage({ type: "nt-push" }); })
    .catch(() => {});
  event.waitUntil(Promise.all([shown, told]));
};

const ntOnNotificationClick = (event) => {
  event.notification.close();
  const tap = ntTapData(event.notification.data);
  const scope = self.registration.scope;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        // An open window of THIS app (its scope, /app/): focus it and hand it
        // the tap. It stashes the tap and acts on it past its gates.
        const open = list.find((c) => typeof c.url === "string" && c.url.startsWith(scope));
        if (open) {
          open.postMessage({ type: "nt-open", o: tap.o, n: tap.n, d: tap.d });
          return typeof open.focus === "function" ? open.focus() : open;
        }
        return self.clients.openWindow(ntOpenUrl(scope, tap));
      })
      .catch(() => self.clients.openWindow(ntOpenUrl(scope, { o: "home", n: null, d: null })).catch(() => {})),
  );
};

// The push service replaced or expired the subscription. Subscribe again
// with the same application server key where the browser still says which
// one it was. The server learns the new address when the app next opens
// (hooks/usePushRegistration.js compares it with the one it registered), and
// the old address is deleted on its first 404/410. A worker has no session,
// so nothing is registered from here.
const ntOnSubscriptionChange = (event) => {
  const key = event.oldSubscription && event.oldSubscription.options
    ? event.oldSubscription.options.applicationServerKey : null;
  if (!key) return;
  event.waitUntil(
    self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key })
      .catch(() => {}),
  );
};

self.addEventListener("push", ntOnPush);
self.addEventListener("notificationclick", ntOnNotificationClick);
self.addEventListener("pushsubscriptionchange", ntOnSubscriptionChange);
