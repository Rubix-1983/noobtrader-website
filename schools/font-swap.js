/* Brand fonts, non-blocking. index.html loads the Google Fonts stylesheet as
 * media="print" so it never gates first paint, and this flips it to "all" once
 * it has loaded. It used to be an inline onload="this.media='all'" attribute,
 * which the Content-Security-Policy (script-src 'self') blocks: the fonts would
 * never have switched on. Deferred, so the <link> exists when this runs; if the
 * sheet already loaded by then, .sheet is set and it flips at once.
 */
(function () {
  var link = document.getElementById("nt-fonts");
  if (!link) return;
  var on = function () { link.media = "all"; };
  if (link.sheet) on();
  else link.addEventListener("load", on);
})();
