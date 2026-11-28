/* NoobTrader entry animation: the NT logo above and the "noobtrader" name below,
 * each built from glowing dots that fly in from a cloud, while the app loads.
 *
 * Founder, 28 Nov 2026: "I want this logo anmiation on loading please the NT
 * above and NoobTrader below please while the app loads, it must run and
 * replace old animations for loading, get it from the website please. This
 * will be on entering the app please". It is the website's Shape Shifter
 * (website/fx.js: the "NT logo" and "noobtrader name" shapes, the same dot
 * program, colours and drawing of the name), cut down for a phone that is busy
 * starting the app: the website's 48,000 dots (24,000 on a phone of about 3 GB or less), two
 * shapes, one canvas.
 *
 * A plain script, not part of the React bundle, so the dots are already moving
 * while the app's JavaScript downloads. index.html holds the cover (#nt-boot)
 * and loads this file straight after it. The app calls window.__ntBoot.done()
 * once it is past its start-up check (src/utils/bootFx.js); the cover then
 * waits until the two shapes are built (never past MAX_HOLD_MS after it began
 * drawing), fades out and frees the graphics memory.
 *
 * With reduce motion on, the finished logo shows at once and stands still.
 * Wherever the dots cannot run well (no WebGL or a software-only one, data saver, under 2 GB of memory, a canvas that reads back made-up
 * pixels, or too slow once started) the cover goes at once and the app's own
 * start-up screen shows, as it always did. A cover the app never dismisses
 * (it failed to start) is taken away after GIVE_UP_MS.
 */
(function () {
  'use strict';
  var cover = document.getElementById('nt-boot');
  var canvas = cover && cover.querySelector('canvas');
  var api = { active: false, done: function () {} };
  window.__ntBoot = api;
  if (!cover || !canvas) return;

  var DOTS_FULL = 48000, DOTS_LOW = 24000;   // the website's counts: a phone of about 3 GB or less gets half
  var LOGO_SHARE = 0.56;                    // part of the dots that make the NT mark
  var SAMPLE_PX = 560;                      // detail of the hidden canvas shapes are read from
  var BUILD_SECONDS = 1.3;                  // cloud to finished shapes
  var MAX_HOLD_MS = 2200;                   // longest the cover waits for the shapes once the app is ready
  var FONT_WAIT_MS = 700;                   // longest the name waits for its font
  var LOGO_WAIT_MS = 900;                   // and the mark for logo.png
  var GIVE_UP_MS = 15000;                   // a cover nobody dismissed
  var FADE_MS = 380;
  var CAMERA_Z = 5.4, FOCAL = 2.747, SHAPE_HALF = 1.55, SLAB_DEPTH = 0.1, SLAB_FACE_SHARE = 0.7;
  var HALO_SHARE = 0.2, HALO_SIZE = 6, MAX_PIXEL_RATIO = 3;
  // Dot size at DOTS_FULL (fewer dots are drawn bigger to cover the same area),
  // brightness, and the hot centre: finer than the website's 0.03 because the
  // two shapes here are drawn smaller, so their dots sit closer together.
  var DOT_SIZE = 0.018, DOT_GAIN = 0.2, DOT_HOT = 0.22, HALO_GAIN = 0.05;
  var WATCH_FRAMES = 90, SLOW_FRAME_SECONDS = 0.066, SLOW_SECONDS_LIMIT = 3;   // the website's speed check
  var TAU = 6.2832;
  var GROTESK = '"Space Grotesk", Arial, Helvetica, sans-serif';
  var CYAN = [0.13, 0.77, 0.98], VIOLET = [0.55, 0.31, 0.98];
  // Where each shape sits (scene units) and how big it is drawn.
  var LOGO_Y = 0.95, LOGO_SIZE = 0.62, NAME_Y = -0.92, NAME_SIZE = 0.78;
  // Half the width and height of the pair, used to fit it to the screen.
  var CONTENT_HALF_W = 1.2, CONTENT_HALF_H = 1.75;

  var rand = Math.random;
  function warn(what, detail) {
    if (window.console && window.console.warn) window.console.warn('[NoobTrader] ' + what, detail === undefined ? '' : detail);
  }
  var gone = false;
  function remove() {
    if (gone) return;
    gone = true; api.active = false;
    if (cover.parentNode) cover.parentNode.removeChild(cover);
  }

  function unwanted() {
    if (!window.requestAnimationFrame || !window.Float32Array || !window.matchMedia) return 'old browser';
    if (navigator.connection && navigator.connection.saveData) return 'data saver';
    if (navigator.deviceMemory && navigator.deviceMemory < 2) return 'low memory';
    if (window.matchMedia('(forced-colors: active)').matches) return 'contrast theme';
    return '';
  }
  function canReadCanvas() {
    try {
      var pad = document.createElement('canvas'); pad.width = pad.height = 8;
      var c = pad.getContext('2d', { willReadFrequently: true }), px = c.getImageData(0, 0, 8, 8).data, i;
      for (i = 3; i < px.length; i += 4) if (px[i] > 120) return false;
      c.fillStyle = '#fff'; c.fillRect(0, 0, 8, 8); px = c.getImageData(0, 0, 8, 8).data;
      for (i = 3; i < px.length; i += 4) if (px[i] <= 120) return false;
      return true;
    } catch (err) { return false; }
  }
  // Reduce motion on: the same dot logo, already built and standing still.
  var CALM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var why = unwanted() || (canReadCanvas() ? '' : 'canvas cannot be read');
  if (why) { warn('boot dots off: ' + why); remove(); return; }

  var gl = null;
  try {
    gl = canvas.getContext('webgl', {
      alpha: false, antialias: false, depth: false, stencil: false,
      premultipliedAlpha: true, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true
    });
  } catch (err) { gl = null; }
  if (!gl) { warn('boot dots off: no hardware WebGL'); remove(); return; }

  var N = navigator.deviceMemory && navigator.deviceMemory < 4 ? DOTS_LOW : DOTS_FULL;
  var LOGO_N = Math.round(N * LOGO_SHARE), NAME_N = N - LOGO_N;
  // The soft glow, as on the website: left out on a phone held upright, a device
  // of 4 GB or less and a screen denser than 2x, where it costs the most blending.
  var halo = !(window.innerWidth < 700 || (navigator.deviceMemory && navigator.deviceMemory <= 4) || (window.devicePixelRatio || 1) > 2);

  // ── Shapes: a drawing on a hidden 200 px pad, dots scattered over what was
  //    painted. The same method as website/fx.js `sampler`. ─────────────────
  function sample(draw, count, skipWhite) {
    var SIZE = SAMPLE_PX, HALF = SIZE / 2, AREA = SIZE * SIZE;
    var pad = document.createElement('canvas'); pad.width = pad.height = SIZE;
    var c = pad.getContext('2d', { willReadFrequently: true });
    c.fillStyle = '#fff'; c.scale(SIZE / 200, SIZE / 200);
    draw(c);
    var px = c.getImageData(0, 0, SIZE, SIZE).data, spots = new Int32Array(AREA), found = 0, p, o;
    for (p = 0; p < AREA; p++) {
      o = p * 4;
      if (px[o + 3] > 120 && !(skipWhite && px[o] > 235 && px[o + 1] > 235 && px[o + 2] > 235)) spots[found++] = p;
    }
    if (!found) throw new Error('nothing was drawn');
    var out = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      var spot = spots[rand() * found | 0];
      out[i * 3] = (spot % SIZE - HALF + rand() - 0.5) / HALF * SHAPE_HALF;
      out[i * 3 + 1] = -((spot / SIZE | 0) - HALF + rand() - 0.5) / HALF * SHAPE_HALF;
      out[i * 3 + 2] = rand() < SLAB_FACE_SHARE ? (rand() < 0.5 ? SLAB_DEPTH : -SLAB_DEPTH) : (rand() - 0.5) * 2 * SLAB_DEPTH;
    }
    return out;
  }
  function words(c, text, size, x, y) {
    c.font = 'bold ' + size + 'px ' + GROTESK; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(text, x, y, 190);
  }
  function drawName(c) { words(c, 'noob', 62, 100, 70); words(c, 'trader', 62, 100, 134); }
  function logoShape(img) {
    if (img && img.naturalWidth) {
      try { return sample(function (c) { c.drawImage(img, 6, 6, 188, 188); }, LOGO_N, true); } catch (err) { warn('boot dots: logo could not be read', err); }
    }
    return sample(function (c) { words(c, 'nt', 150, 100, 100); }, LOGO_N);
  }
  function cloud(count) {
    var out = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      var th = rand() * TAU, ph = Math.acos(2 * rand() - 1), rad = 1.3 + rand() * 1.9;
      out[i * 3] = Math.sin(ph) * Math.cos(th) * rad;
      out[i * 3 + 1] = Math.sin(ph) * Math.sin(th) * rad;
      out[i * 3 + 2] = Math.cos(ph) * rad;
    }
    return out;
  }

  // ── The dot program: website/fx.js VERTEX/FRAGMENT, without the pointer. ──
  var VERTEX = [
    'attribute vec3 aFrom, aTo, aScatter;',
    'attribute float aDelay;',
    'uniform float uProgress, uBurst, uTime, uScale, uSize, uGain, uLocal;',
    'uniform vec2 uTurn, uLens;',
    'uniform vec3 uOffset, uToA, uToB;',
    'varying vec3 vCol;',
    'varying float vGain;',
    'float ease(float x) { return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0; }',
    'float across(vec3 p) { return clamp((p.x + p.y) / ' + (SHAPE_HALF * 2.06).toFixed(3) + ' + 0.5, 0.0, 1.0); }',
    'void main() {',
    '  float q = ease(clamp(uProgress * 1.5 - aDelay * 0.5, 0.0, 1.0));',
    '  vec3 p = mix(aFrom, aTo * uLocal + uOffset, q) + aScatter * sin(q * 3.14159) * uBurst;',
    '  p.xy += sin(uTime * 1.4 + aDelay * 40.0) * 0.006;',
    '  float cy = cos(uTurn.x), sy = sin(uTurn.x), cx = cos(uTurn.y), sx = sin(uTurn.y);',
    '  p = vec3(p.x * cy + p.z * sy, p.y, p.z * cy - p.x * sy);',
    '  p = vec3(p.x, p.y * cx - p.z * sx, p.y * sx + p.z * cx);',
    '  float depth = clamp(p.z / 1.6, -1.0, 1.0);',
    '  p *= uScale;',
    '  float z = ' + CAMERA_Z.toFixed(1) + ' - p.z;',
    '  gl_Position = vec4(p.xy * uLens / z, 0.0, 1.0);',
    '  gl_PointSize = max(1.5, uSize * (0.65 + 0.7 * fract(aDelay * 7.31)) / z);',
    '  float twinkle = 0.86 + 0.14 * sin(uTime * 2.3 + aDelay * 90.0);',
    '  vGain = min(1.0, uGain * (0.7 + 0.3 * depth) * twinkle);',
    // The cloud is cyan to violet like the website's; each shape ends in its own pair.
    '  vec3 cloudCol = mix(vec3(' + CYAN.join(',') + '), vec3(' + VIOLET.join(',') + '), across(aFrom * 0.5));',
    '  vCol = mix(cloudCol, mix(uToA, uToB, across(aTo)), q);',
    '}'
  ].join('\n');
  var FRAGMENT = [
    'precision mediump float;',
    'uniform float uEdge, uHot;',
    'varying vec3 vCol;',
    'varying float vGain;',
    'void main() {',
    '  float a = 1.0 - smoothstep(uEdge, 0.5, length(gl_PointCoord - 0.5));',
    '  vec3 c = vCol * a * a + vec3(uHot) * pow(a, 8.0);',
    '  gl_FragColor = vec4(c * vGain, 0.0);',
    '}'
  ].join('\n');

  function compile(type, source) {
    var sh = gl.createShader(type); gl.shaderSource(sh, source); gl.compileShader(sh);
    if (gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return sh;
    warn('boot dots off: this device refused the drawing program', gl.getShaderInfoLog(sh));
    return null;
  }
  var vs = compile(gl.VERTEX_SHADER, VERTEX), fs = compile(gl.FRAGMENT_SHADER, FRAGMENT);
  var prog = vs && fs ? gl.createProgram() : null;
  if (prog) { gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog); }
  if (!prog || !gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    if (prog) warn('boot dots off: this device refused the drawing program', gl.getProgramInfoLog(prog));
    remove(); return;
  }
  gl.useProgram(prog);

  function buffer(data) { var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); return b; }
  function attr(name) { var loc = gl.getAttribLocation(prog, name); if (loc >= 0) gl.enableVertexAttribArray(loc); return loc; }
  function bind(loc, buf, size, offset) { if (loc < 0) return; gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, offset); }
  function uni(name) { return gl.getUniformLocation(prog, name); }

  var delay = new Float32Array(N);
  for (var d = 0; d < N; d++) delay[d] = rand();
  var start = cloud(N);
  var fromBuf = buffer(start), scatterBuf = buffer(cloud(N)), delayBuf = buffer(delay);
  var logoBuf = null, nameBuf = null;
  var aFrom = attr('aFrom'), aTo = attr('aTo'), aScatter = attr('aScatter'), aDelay = attr('aDelay');
  var U = {};
  ['uProgress', 'uBurst', 'uTime', 'uScale', 'uSize', 'uGain', 'uLocal', 'uTurn', 'uLens', 'uOffset', 'uToA', 'uToB', 'uEdge', 'uHot']
    .forEach(function (n) { U[n] = uni(n); });
  gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
  gl.clearColor(0.039, 0.059, 0.102, 1);   // #0a0f1a, the app's start-up background

  // ── Timeline ─────────────────────────────────────────────────────────────
  var time = 0, last = 0, raf = 0, builtAt = -1, firstFrameAt = 0, watched = 0, slow = 0;
  var appReady = false, leaving = false, fit = 1, skipWatch = false;

  function layout() {
    var w = cover.clientWidth || window.innerWidth, h = cover.clientHeight || window.innerHeight;
    var ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    var pw = Math.max(1, Math.round(w * ratio)), ph = Math.max(1, Math.round(h * ratio));
    if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
    gl.viewport(0, 0, pw, ph);
    gl.uniform2f(U.uLens, FOCAL * h / w, FOCAL);
    // Seen half-size at the middle of the scene: CAMERA_Z / FOCAL tall, times w / h wide.
    var seenH = CAMERA_Z / FOCAL, seenW = seenH * w / h;
    fit = Math.min(1, 0.86 * seenW / CONTENT_HALF_W, 0.86 * seenH / CONTENT_HALF_H);
  }

  // Which of the two shapes each dot belongs to: the first LOGO_N dots are the mark.
  function drawRun(first, count, toBuf, local, offsetY, tintA, tintB, progress, gain, sizeUnit) {
    bind(aFrom, fromBuf, 3, first * 12); bind(aTo, toBuf, 3, 0);
    bind(aScatter, scatterBuf, 3, first * 12); bind(aDelay, delayBuf, 1, first * 4);
    gl.uniform1f(U.uProgress, progress); gl.uniform1f(U.uBurst, 0.62);
    gl.uniform1f(U.uLocal, local); gl.uniform3f(U.uOffset, 0, offsetY, 0);
    gl.uniform3fv(U.uToA, tintA); gl.uniform3fv(U.uToB, tintB);
    var size = DOT_SIZE * Math.sqrt(DOTS_FULL / N) * sizeUnit;
    if (halo) {
      gl.uniform1f(U.uSize, size * HALO_SIZE); gl.uniform1f(U.uGain, HALO_GAIN * gain / DOT_GAIN); gl.uniform1f(U.uEdge, 0); gl.uniform1f(U.uHot, 0);
      gl.drawArrays(gl.POINTS, 0, Math.floor(count * HALO_SHARE));
    }
    gl.uniform1f(U.uSize, size); gl.uniform1f(U.uGain, gain); gl.uniform1f(U.uEdge, 0.3); gl.uniform1f(U.uHot, DOT_HOT);
    gl.drawArrays(gl.POINTS, 0, count);
  }

  function frame(now) {
    raf = 0;
    if (gone) return;
    var raw = (now - last) / 1000; last = now; time += Math.min(raw, 0.1);
    if (!firstFrameAt) firstFrameAt = now;
    // The frame after the shapes were read waited for that work, not for drawing.
    else if (skipWatch) skipWatch = false;
    else if (watched < WATCH_FRAMES) {
      watched++; if (raw > SLOW_FRAME_SECONDS) slow += Math.min(raw, 0.5);
      if (slow > SLOW_SECONDS_LIMIT) { warn('boot dots were too slow on this device and switched themselves off'); stop(); return; }
    }
    try {
      var ready = logoBuf && nameBuf;
      if (ready && builtAt < 0) builtAt = time;
      var progress = ready ? (CALM ? 1 : Math.min(1, (time - builtAt) / BUILD_SECONDS)) : 0;
      // A slow sway once built, so the dots read as solid 3D letters.
      var sway = Math.max(0, Math.min(1, (progress - 0.6) / 0.4));
      gl.uniform2f(U.uTurn, Math.sin(time * 0.7) * 0.26 * sway + (1 - progress) * time * 0.5, Math.sin(time * 0.45) * 0.08 * sway);
      if (CALM) gl.uniform2f(U.uTurn, 0, 0);
      gl.uniform1f(U.uTime, CALM ? 0 : time);
      gl.uniform1f(U.uScale, fit);
      gl.clear(gl.COLOR_BUFFER_BIT);
      var sizeUnit = fit * FOCAL * canvas.height / 2;
      var gain = DOT_GAIN;
      if (ready) {
        drawRun(0, LOGO_N, logoBuf, LOGO_SIZE, LOGO_Y, CYAN, VIOLET, progress, gain, sizeUnit);
        drawRun(LOGO_N, NAME_N, nameBuf, NAME_SIZE, NAME_Y, VIOLET, CYAN, progress, gain, sizeUnit);
      } else if (!CALM) {
        // Still reading the shapes: the cloud turns on its own.
        drawRun(0, N, fromBuf, 1, 0, CYAN, VIOLET, 0, gain * 0.8, sizeUnit);
      }
    } catch (err) {
      warn('boot dots switched themselves off:', err); stop(); return;
    }
    maybeLeave(now);
    if (!gone) raf = window.requestAnimationFrame(frame);
  }

  function shapesDone() { return builtAt >= 0 && (CALM || time - builtAt >= BUILD_SECONDS); }
  function maybeLeave(now) {
    if (leaving || !appReady) return;
    if (shapesDone(now) || now - firstFrameAt > MAX_HOLD_MS) leave();
  }
  function leave() {
    if (leaving || gone) return;
    leaving = true; api.active = false;
    cover.style.opacity = '0';
    setTimeout(stop, FADE_MS + 40);
  }
  function stop() {
    if (gone) return;
    if (raf) window.cancelAnimationFrame(raf);
    raf = 0;
    window.removeEventListener('resize', layout);
    var lose = gl.getExtension('WEBGL_lose_context');
    if (lose && !gl.isContextLost()) lose.loseContext();
    remove();
  }

  api.active = true;
  // ?boot=hold keeps the dots up, to look at them (never dismissed, never given up).
  var HOLD = /[?&]boot=hold(&|$)/.test(window.location.search);
  api.done = function () {
    if (appReady || HOLD) return;
    appReady = true;
    // Dots that never drew a frame (a hidden tab) are no reason to wait.
    if (!firstFrameAt) { stop(); return; }
    maybeLeave(window.performance.now());
  };
  if (!HOLD) setTimeout(function () { if (!gone) { warn('boot dots: the app never said it was ready'); stop(); } }, GIVE_UP_MS);
  canvas.addEventListener('webglcontextlost', function () { if (gone) return; warn('boot dots: the graphics chip took the drawing back'); stop(); });
  window.addEventListener('resize', layout, { passive: true });
  layout();
  last = window.performance.now();
  raf = window.requestAnimationFrame(frame);

  // Read the two shapes once the logo picture and the name's font are in (or
  // have kept us waiting long enough).
  function settle(promise, ms) {
    return new Promise(function (resolve) {
      var t = setTimeout(resolve, ms);
      promise.then(function (v) { clearTimeout(t); resolve(v); }, function () { clearTimeout(t); resolve(null); });
    });
  }
  var img = new Image();
  var logoLoaded = new Promise(function (resolve, reject) { img.onload = function () { resolve(img); }; img.onerror = reject; });
  img.src = 'logo.png';
  var fontLoaded = document.fonts && document.fonts.load ? document.fonts.load('bold 62px "Space Grotesk"') : Promise.resolve();
  Promise.all([settle(logoLoaded, LOGO_WAIT_MS), settle(fontLoaded, FONT_WAIT_MS)]).then(function (got) {
    if (gone) return;
    try {
      logoBuf = buffer(logoShape(got[0]));
      nameBuf = buffer(sample(drawName, NAME_N));
      skipWatch = true;
    } catch (err) {
      warn('boot dots: shapes could not be made', err); stop();
    }
  });
})();
