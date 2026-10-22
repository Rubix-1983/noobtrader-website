/* Clickjacking guard (security audit 2026-10-22, finding 4).
 *
 * Another site could load the app in an invisible frame over a fake button, so
 * a signed-in teen's tap lands on Buy, Join or Convert XP. The real fixes are
 * the X-Frame-Options header or CSP frame-ancestors, but GitHub Pages sends no
 * headers and frame-ancestors is ignored in a <meta> CSP. So: when framed, hide
 * the whole page and try to break out to the top window.
 *
 * Nothing legitimate frames the app: no <iframe> in src/, website/ or public/,
 * and the Capacitor Android/iOS WebView and an installed PWA are top-level
 * windows, where window.top === window.self and this does nothing.
 *
 * External file, not inline, so the CSP's script-src 'self' allows it. Loaded
 * synchronously as the first script in <head> so nothing renders first.
 */
(function () {
  var framed;
  try { framed = window.top !== window.self; } catch (e) { framed = true; }
  if (!framed) return;
  document.documentElement.style.display = "none";
  try { window.top.location = window.self.location.href; } catch (e) { /* sandboxed frame: stays hidden */ }
})();
