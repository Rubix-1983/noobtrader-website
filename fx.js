// fx.js: the landing page's two 3D dot animations. Plain WebGL, no library.
//
// 1. SHAPE SHIFTER, in the top section (#hero). Thousands of glowing dots build
//    one shape, burst into a cloud and build back in as the next. Sixteen
//    shapes, each a part of NoobTrader: the NT logo, the dollar, a rising
//    chart, a gold coin, lessons, the world, the rankings podium, the Arcade,
//    the "noobtrader" name, a trophy, the app on a phone, the Lounge, a
//    level-up star, the Daily Spin, crypto and the streak flame. The pointer
//    turns it; a click on it skips to the next shape.
//    Founder, 27 Nov 2026: "a super dynamic animation on the landing page that
//    shows trading app, markets, $, graphs"; then "more wow factors ... 3D ...
//    built out and in animations which react to the mouse and turn"; picked
//    example E, "Shape Shifter"; then "not ultra HD", "way too bright", "more
//    types of 3d items ... like gold coins, rankings", and "the other parts of
//    the app too ... I want NT in the animation 3D too please and NoobTrader as
//    well ... not after each other". 28 Nov 2026: "the animation should not
//    have the sign up steps remove that", then "check the animation does
//    remove the 3 steps to sign up as it pops up and should not" and, of the
//    "Start in three taps" card, "this should not show": the card this
//    animation replaces must never flash up first (see doneWaiting below).
//    The first of those was misread as the phone shape, which came out for a
//    few hours and is back.
//
// 2. THE 3D MASCOT, on the white "explained by stickman" band (.mascot). The
//    same dots, in ink, build the stickman and the NT logo he shows off. He is
//    a real figure in space: a ball head, limbs with elbows and knees, moved
//    through a routine of poses (MASCOT_DANCE below); the logo and a prop join
//    in; the pointer turns the whole scene and he looks at it.
//    Founder, 28 Nov 2026, about that band: "that can be much cooler and more
//    wow factor", then "I think we have the animation on the logo and a
//    animation of the stick man on the top similar to the main page too".
//
// Nothing here holds the page up: it starts after the page has loaded, the top
// shapes are built a slice at a time (about one shape a second), and the mascot
// is not started at all until its band is about to scroll into view. Each
// animation's drawing pauses while it is off screen; the building of the top
// shapes carries on until all sixteen are made.
//
// Both are extras on top of a page that works without them. The stickman card
// (top) and the drawn stickman with the logo picture (band) stay in the page
// and are the fallback: this file only adds the class `fx-on` to #hero or to
// .mascot once a first frame has been drawn. Everything stays off when the
// visitor asked for reduced motion, data saver is on, a contrast theme is in
// use, the device reports under 2 GB of memory, or the browser will not let a
// page read its own canvas. An animation also stays off when WebGL is missing
// or only software-drawn, and switches itself off if its first frames come out
// too slow, if anything goes wrong inside a frame, or if reduced motion is
// switched on while the page is open. Whatever switches one off says so in
// the console.
//
// Test switches: `?fx=off` keeps the fallbacks; `?fx=force` skips the checks
// above (reduced motion, data saver, contrast theme, memory, software drawing,
// too slow); `?fx-shape=7` opens the top animation on that shape; `?fx-beat=7`
// runs the stickman's routine straight to that beat and holds it.
// scripts/website-fx.test.js runs this file without a browser.
(function () {
  'use strict';

  // The page keeps the top section's fallback card out of sight while this
  // file is still to start (the class fx-wait on <html>, set by the small
  // script at the end of the page's <head>), so the card never flashes up
  // before the dots. Founder, 28 Nov 2026: "check the animation does remove the
  // 3 steps to sign up as it pops up and should not". The moment this file
  // knows, the class comes off: the top animation has drawn (the card then
  // stays hidden under fx-on), or it will not start (the card fades in and is
  // the picture, as it always was).
  function doneWaiting() { document.documentElement.classList.remove('fx-wait'); }

  var query = window.location.search;
  var FORCE = /[?&]fx=force\b/.test(query);
  // Is this a visit the animations stay out of? (The script in the page's
  // <head> makes the same checks: change both together.)
  function unwanted() {
    if (!window.requestAnimationFrame || !window.Float32Array) return true;
    if (/[?&]fx=off\b/.test(query)) return true;
    if (FORCE) return false;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
    if (navigator.connection && navigator.connection.saveData) return true;
    if (navigator.deviceMemory && navigator.deviceMemory < 2) return true;
    // A contrast theme repaints the page's backgrounds and leaves canvases alone,
    // so the dots could vanish against them while their fallback was hidden.
    return window.matchMedia('(forced-colors: active)').matches;
  }
  if (unwanted()) { doneWaiting(); return; }

  // ── Numbers both animations share ──────────────────────────────────────
  var CAMERA_Z = 5.4;
  var FOCAL = 2.747;              // 1 / tan(20 degrees): a 40 degree view
  var SHAPE_HALF = 1.55;          // drawn shapes sit inside -1.55..1.55
  var SLAB_DEPTH = 0.2;           // half-thickness of a flat shape, so it is solid when turned
  var SLAB_FACE_SHARE = 0.7;      // part of its dots that sit on the front and back faces
  var MAX_PIXEL_RATIO = 3;        // draw at the screen's full sharpness
  var SAMPLE_PX = 560;            // detail of the hidden canvas shapes are read from
  var HALO_SHARE = 0.2;           // part of the dots that also cast a soft glow
  var HALO_SIZE = 6;
  // Brightness. A shape that packs its dots into a small area would burn out to
  // white (founder: "way too bright"), so each one is dimmed by how much of the
  // pad it covers. The reference is the dollar sign, which looked right at 0.15.
  var GAIN_REFERENCE = 0.15;
  var GAIN_REFERENCE_COVER = 0.24;
  var GAIN_MIN = 0.13;
  var GAIN_MAX = 0.26;
  var GAIN_OPEN = 0.42;           // the world and the cloud: dots spread through space
  var BUILD_GAP_MS = 200;         // pause before the top shapes after the first are built, and between two of the stickman's props
  var SLICE_DOTS = 4000;          // a top shape is built this many dots at a time...
  var SLICE_GAP_MS = 40;          // ...with this pause between two slices, so no frame waits long for one...
  var SHAPE_GAP_MS = 500;         // ...and this pause before the next shape is begun: about one shape a second
  var READY_TIMEOUT_MS = 2500;    // do not wait longer than this for the logo or fonts
  var WATCH_FRAMES = 90;          // frames checked for speed after start
  var SLOW_FRAME_SECONDS = 0.066; // a slow frame: slower than 15 a second
  var SLOW_FRAME_MOST = 0.5;      // one slow frame counts for no more than this long
  var SLOW_SECONDS_LIMIT = 3;     // this much time spent in slow frames: give up, show the fallback
  var TAU = 6.2832;
  var SANS = 'Arial, Helvetica, sans-serif';
  var GROTESK = '"Space Grotesk", ' + SANS;

  var ORANGE = [1, 0.55, 0.1], PINK = [0.96, 0.45, 0.71], RED = [1, 0.3, 0.2], GOLD = [1, 0.76, 0.07];
  var GREEN = [0, 0.83, 0.67], CYAN = [0.13, 0.77, 0.98], VIOLET = [0.55, 0.31, 0.98], BLUE = [0.08, 0.39, 0.99];

  var rand = Math.random;
  function clamp1(x) { return x < -1 ? -1 : x > 1 ? 1 : x; }
  // A device short of memory gets fewer dots. A browser that reports memory at
  // all rounds it to a power of two (1, 2, 4 or 8 on an Android phone), so
  // "under 4" is a phone with about 3 GB or less; one that reports under 2 gets
  // no animation at all (see `unwanted`). Up to 28 Nov 2026 the line was "4 or
  // less", which took in phones, tablets and laptops of up to about 6 GB.
  // Safari and Firefox report nothing: full dots there.
  var LOW_MEMORY_GB = 4;
  function lowMemory() { return !!navigator.deviceMemory && navigator.deviceMemory < LOW_MEMORY_GB; }
  // Nothing here fails silently: whatever switches an animation off, or leaves
  // a shape out, says so in the console.
  function warn(what, detail) {
    if (window.console && window.console.warn) window.console.warn('[NoobTrader] ' + what, detail === undefined ? '' : detail);
  }
  // Some browsers hand a page made-up pixels when it reads a canvas back (a
  // guard against fingerprinting). Every shape here is read from a hidden
  // canvas, so there the animations stay off: an untouched canvas must read
  // back as empty, and a painted one as painted.
  function canReadCanvas() {
    try {
      var pad = document.createElement('canvas'); pad.width = pad.height = 8;
      // (read twice below: the option stops the browser warning about that)
      var c = pad.getContext('2d', { willReadFrequently: true }), px = c.getImageData(0, 0, 8, 8).data, i;
      for (i = 3; i < px.length; i += 4) if (px[i] > 120) return false;
      c.fillStyle = '#fff'; c.fillRect(0, 0, 8, 8); px = c.getImageData(0, 0, 8, 8).data;
      for (i = 3; i < px.length; i += 4) if (px[i] <= 120) return false;
      return true;
    } catch (err) { return false; }
  }

  // ── Drawings. Each is written for a 200 px pad and painted in white. ───
  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function star(c, cx, cy, outer, inner) {
    c.beginPath();
    for (var k = 0; k < 10; k++) { var a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? inner : outer; c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    c.closePath();
  }
  function text(c, words, size, x, y, font) {
    c.font = 'bold ' + size + 'px ' + (font || SANS); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(words, x, y, 190);
  }
  var DRAW = {
    dollar: function (c) { text(c, '$', 196, 100, 108); },
    chart: function (c) {
      var xs = [22, 52, 82, 112, 142, 172], tops = [161, 135, 149, 110, 118, 76];
      for (var k = 0; k < xs.length; k++) c.fillRect(xs[k] - 8, tops[k], 16, 190 - tops[k]);
      c.lineWidth = 8; c.beginPath(); c.moveTo(14, 148); c.lineTo(50, 116); c.lineTo(78, 132); c.lineTo(118, 84); c.lineTo(142, 98); c.lineTo(184, 36); c.stroke();
      c.beginPath(); c.moveTo(152, 32); c.lineTo(188, 32); c.lineTo(188, 68); c.stroke();
    },
    coinDollar: function (c) { text(c, '$', 112, 100, 105); },
    book: function (c) {
      c.lineWidth = 8;
      c.beginPath(); c.moveTo(100, 54); c.quadraticCurveTo(60, 34, 16, 48); c.lineTo(16, 158); c.quadraticCurveTo(60, 144, 100, 166); c.closePath(); c.stroke();
      c.beginPath(); c.moveTo(100, 54); c.quadraticCurveTo(140, 34, 184, 48); c.lineTo(184, 158); c.quadraticCurveTo(140, 144, 100, 166); c.stroke();
      c.lineWidth = 5;
      for (var y = 78; y <= 122; y += 22) { c.beginPath(); c.moveTo(34, y); c.lineTo(82, y + 6); c.stroke(); c.beginPath(); c.moveTo(118, y + 6); c.lineTo(166, y); c.stroke(); }
    },
    podium: function (c) {
      c.fillRect(20, 108, 52, 80); c.fillRect(74, 74, 52, 114); c.fillRect(128, 130, 52, 58);
      c.globalCompositeOperation = 'destination-out';
      text(c, '2', 40, 46, 150); text(c, '1', 40, 100, 128); text(c, '3', 40, 154, 162);
      c.globalCompositeOperation = 'source-over';
      star(c, 100, 38, 26, 11); c.fill();
    },
    controller: function (c) {
      c.lineWidth = 9; roundRect(c, 20, 62, 160, 86, 42); c.stroke();
      c.fillRect(48, 99, 38, 12); c.fillRect(61, 86, 12, 38);
      c.beginPath(); c.arc(126, 92, 9, 0, TAU); c.fill(); c.beginPath(); c.arc(148, 114, 9, 0, TAU); c.fill();
    },
    name: function (c) { text(c, 'noob', 62, 100, 70, GROTESK); text(c, 'trader', 62, 100, 134, GROTESK); },
    trophy: function (c) {
      c.beginPath(); c.moveTo(56, 26); c.lineTo(144, 26); c.bezierCurveTo(144, 92, 124, 114, 100, 114); c.bezierCurveTo(76, 114, 56, 92, 56, 26); c.fill();
      c.lineWidth = 9; c.beginPath(); c.arc(54, 58, 22, Math.PI * 0.5, Math.PI * 1.5); c.stroke();
      c.beginPath(); c.arc(146, 58, 22, -Math.PI * 0.5, Math.PI * 0.5); c.stroke();
      c.fillRect(92, 112, 16, 34); roundRect(c, 66, 146, 68, 14, 4); c.fill(); roundRect(c, 52, 164, 96, 22, 5); c.fill();
    },
    phone: function (c) {
      c.lineWidth = 8; roundRect(c, 56, 10, 88, 180, 20); c.stroke(); c.fillRect(88, 24, 24, 5);
      c.lineWidth = 6; c.beginPath(); c.moveTo(72, 104); c.lineTo(88, 86); c.lineTo(100, 96); c.lineTo(116, 66); c.lineTo(128, 74); c.stroke();
      roundRect(c, 72, 124, 56, 8, 4); c.fill(); roundRect(c, 72, 152, 56, 20, 8); c.fill();
    },
    bubble: function (c) {
      c.lineWidth = 9; roundRect(c, 18, 28, 164, 112, 26); c.stroke();
      c.beginPath(); c.moveTo(58, 140); c.lineTo(46, 178); c.lineTo(98, 140); c.stroke();
      for (var x = 66; x <= 134; x += 34) { c.beginPath(); c.arc(x, 84, 10, 0, TAU); c.fill(); }
    },
    star: function (c) { c.lineWidth = 9; star(c, 100, 106, 92, 40); c.stroke(); star(c, 100, 106, 46, 20); c.fill(); },
    wheel: function (c) {
      c.lineWidth = 8; c.beginPath(); c.arc(100, 108, 82, 0, TAU); c.stroke();
      c.lineWidth = 5;
      for (var k = 0; k < 8; k++) { var a = k * TAU / 8; c.beginPath(); c.moveTo(100, 108); c.lineTo(100 + Math.cos(a) * 82, 108 + Math.sin(a) * 82); c.stroke(); }
      c.beginPath(); c.arc(100, 108, 15, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(86, 6); c.lineTo(114, 6); c.lineTo(100, 34); c.closePath(); c.fill();
    },
    coinB: function (c) { text(c, 'B', 104, 101, 104); c.fillRect(88, 42, 8, 18); c.fillRect(104, 42, 8, 18); c.fillRect(88, 142, 8, 18); c.fillRect(104, 142, 8, 18); },
    flame: function (c) {
      c.lineWidth = 9; c.beginPath(); c.moveTo(100, 14);
      c.bezierCurveTo(128, 56, 166, 86, 166, 130); c.bezierCurveTo(166, 166, 136, 188, 100, 188);
      c.bezierCurveTo(64, 188, 34, 166, 34, 130); c.bezierCurveTo(34, 104, 52, 84, 66, 66);
      c.bezierCurveTo(70, 86, 80, 96, 90, 98); c.bezierCurveTo(84, 66, 88, 36, 100, 14); c.stroke();
      c.beginPath(); c.moveTo(100, 114); c.bezierCurveTo(120, 136, 122, 150, 122, 158); c.bezierCurveTo(122, 172, 112, 180, 100, 180);
      c.bezierCurveTo(88, 180, 78, 172, 78, 158); c.bezierCurveTo(78, 146, 88, 132, 100, 114); c.fill();
    },
    shield: function (c) {
      c.lineWidth = 10; c.beginPath(); c.moveTo(100, 14); c.lineTo(170, 40); c.lineTo(170, 96);
      c.bezierCurveTo(170, 140, 140, 172, 100, 188); c.bezierCurveTo(60, 172, 30, 140, 30, 96); c.lineTo(30, 40); c.closePath(); c.stroke();
      c.lineWidth = 14; c.beginPath(); c.moveTo(66, 100); c.lineTo(92, 126); c.lineTo(136, 72); c.stroke();
    }
  };

  // ── Shapes: draw on a hidden canvas, then scatter `count` dots over the
  //    pixels that were painted. A shape is made in two steps, so that a big
  //    one can be built a slice at a time and no frame waits long for it
  //    (with every dot placed in one go, a 48,000 dot shape took about twice
  //    as long to build as a 12,000 dot one: measured on this computer with
  //    its processor slowed down, not on a phone).
  //    The call itself reads the drawing, which cannot be split, and returns
  //    { data, gain, fill }; fill(from, to) then places the dots from..to-1.
  //    `skipWhite` is for a picture with a white ground. ───────────────────
  function sampler(draw, count, skipWhite) {
    var SIZE = SAMPLE_PX, HALF = SIZE / 2, AREA = SIZE * SIZE;
    var pad = document.createElement('canvas'); pad.width = pad.height = SIZE;
    var c = pad.getContext('2d');
    c.fillStyle = c.strokeStyle = '#fff'; c.lineCap = c.lineJoin = 'round';
    c.scale(SIZE / 200, SIZE / 200);
    draw(c);
    // Every painted pixel, kept as one number: its row times the pad's width, plus its column.
    var px = c.getImageData(0, 0, SIZE, SIZE).data, spots = new Int32Array(AREA), found = 0, p, o;
    for (p = 0; p < AREA; p++) {
      o = p * 4;
      if (px[o + 3] > 120 && !(skipWhite && px[o] > 235 && px[o + 1] > 235 && px[o + 2] > 235)) spots[found++] = p;
    }
    if (!found) throw new Error('nothing was drawn');   // every dot would sit on one point
    var out = new Float32Array(count * 3);
    var gain = GAIN_REFERENCE * Math.sqrt(found / AREA / GAIN_REFERENCE_COVER);
    return {
      data: out, gain: Math.max(GAIN_MIN, Math.min(GAIN_MAX, gain)),
      fill: function (from, to) {
        for (var i = from; i < to; i++) {
          var spot = spots[rand() * found | 0];
          out[i * 3] = (spot % SIZE - HALF + rand() - 0.5) / HALF * SHAPE_HALF;
          out[i * 3 + 1] = -((spot / SIZE | 0) - HALF + rand() - 0.5) / HALF * SHAPE_HALF;
          out[i * 3 + 2] = rand() < SLAB_FACE_SHARE ? (rand() < 0.5 ? SLAB_DEPTH : -SLAB_DEPTH) : (rand() - 0.5) * 2 * SLAB_DEPTH;
        }
      }
    };
  }
  // Every dot of a two-step shape placed in one go: for the few dots of the
  // stickman's logo and props.
  function whole(made) { made.fill(0, made.data.length / 3); return made; }
  function sample(draw, count, skipWhite) { return whole(sampler(draw, count, skipWhite)); }
  // A coin is a real disc: two faces with a rim of dots joining them. Two-step, like `sampler`.
  function coin(glyph, count) {
    var RIM_SHARE = 0.22, RIM_RADIUS = 0.9 * SHAPE_HALF;
    var made = sampler(function (c) {
      c.lineWidth = 9; c.beginPath(); c.arc(100, 100, 88, 0, TAU); c.stroke();
      c.lineWidth = 3; c.beginPath(); c.arc(100, 100, 72, 0, TAU); c.stroke();
      glyph(c);
    }, count), out = made.data, flat = made.fill;
    made.fill = function (from, to) {
      flat(from, to);
      for (var i = from; i < to; i++) {
        if (rand() < RIM_SHARE) { var a = rand() * TAU; out[i * 3] = Math.cos(a) * RIM_RADIUS; out[i * 3 + 1] = Math.sin(a) * RIM_RADIUS; out[i * 3 + 2] = (rand() - 0.5) * 2 * SLAB_DEPTH; }
        else out[i * 3 + 2] = rand() < 0.5 ? SLAB_DEPTH : -SLAB_DEPTH;
      }
    };
    return made;
  }
  // The world: a surface of dots plus bright lines of longitude and latitude. Two-step, like `sampler`.
  function globe(count) {
    var out = new Float32Array(count * 3), golden = Math.PI * (3 - Math.sqrt(5)), R = 1.45;
    var MERIDIANS = 12, PARALLELS = 7, SURFACE = 0.4, MERIDIAN_SHARE = 0.75;
    var SHUFFLE = 7919;   // a prime that divides none of the dot counts: it visits every place once, out of order
    return {
      data: out, gain: GAIN_OPEN,
      fill: function (from, to) {
        var lat, lon;
        for (var i = from; i < to; i++) {
          var pick = rand(), place = (i * SHUFFLE) % count;
          // The surface dots are spread evenly from pole to pole, but not in that
          // order: the soft glow is drawn from the first fifth of the dots.
          if (pick < SURFACE) { lat = Math.asin(1 - (place / (count - 1)) * 2); lon = golden * place; }
          else if (pick < MERIDIAN_SHARE) { lon = Math.floor(rand() * MERIDIANS) / MERIDIANS * TAU; lat = (rand() - 0.5) * Math.PI; }
          else { lat = (Math.floor(rand() * PARALLELS) + 1) / (PARALLELS + 1) * Math.PI - Math.PI / 2; lon = rand() * TAU; }
          out[i * 3] = Math.cos(lat) * Math.cos(lon) * R; out[i * 3 + 1] = Math.sin(lat) * R; out[i * 3 + 2] = Math.cos(lat) * Math.sin(lon) * R;
        }
      }
    };
  }
  // The real mark, read from logo.png; the letters alone if the file did not load. Two-step, like `sampler`.
  function logoShape(logo, count) {
    if (logo && logo.naturalWidth) return sampler(function (c) { c.drawImage(logo, 6, 6, 188, 188); }, count, true);
    return sampler(function (c) { text(c, 'nt', 150, 100, 100, GROTESK); }, count);
  }

  // ── The dot program. All the motion that every dot shares (the morph, the
  //    burst, the turn) is worked out on the graphics chip. ───────────────
  var VERTEX = [
    'attribute vec3 aFrom, aTo, aScatter;',
    'attribute float aDelay;',
    'uniform float uProgress, uBurst, uTime, uScale, uSize, uGain, uLocal, uSpin;',
    'uniform vec2 uTurn, uLens, uCentre;',
    'uniform vec3 uOffset, uFromA, uFromB, uToA, uToB;',
    'varying vec3 vCol;',
    'varying float vGain;',
    'float ease(float x) { return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0; }',
    // 0 at the bottom-left of a shape, 1 at its top-right.
    'float across(vec3 p) { return clamp((p.x + p.y) / ' + (SHAPE_HALF * 2.06).toFixed(3) + ' + 0.5, 0.0, 1.0); }',
    'void main() {',
    '  float q = ease(clamp(uProgress * 1.5 - aDelay * 0.5, 0.0, 1.0));',
    '  vec3 p = mix(aFrom, aTo, q) + aScatter * sin(q * 3.14159) * uBurst;',
    '  p.xy += sin(uTime * 1.4 + aDelay * 40.0) * 0.006;',
    // This run of dots: spun about its own upright axis, sized, put in its place.
    '  float cs = cos(uSpin), ss = sin(uSpin);',
    '  p = vec3(p.x * cs + p.z * ss, p.y, p.z * cs - p.x * ss) * uLocal + uOffset;',
    // The whole scene, turned toward the pointer.
    '  float cy = cos(uTurn.x), sy = sin(uTurn.x), cx = cos(uTurn.y), sx = sin(uTurn.y);',
    '  p = vec3(p.x * cy + p.z * sy, p.y, p.z * cy - p.x * sy);',
    '  p = vec3(p.x, p.y * cx - p.z * sx, p.y * sx + p.z * cx);',
    // Dots nearer the viewer are stronger, so the shape reads as solid.
    '  float depth = clamp(p.z / 1.6, -1.0, 1.0);',
    '  p *= uScale;',
    '  float z = ' + CAMERA_Z.toFixed(1) + ' - p.z;',
    '  gl_Position = vec4(p.xy * uLens / z + uCentre, 0.0, 1.0);',
    '  gl_PointSize = max(1.5, uSize * (0.65 + 0.7 * fract(aDelay * 7.31)) / z);',
    '  float twinkle = 0.86 + 0.14 * sin(uTime * 2.3 + aDelay * 90.0);',
    '  vGain = min(1.0, uGain * (0.7 + 0.3 * depth) * twinkle);',
    '  vCol = mix(mix(uFromA, uFromB, across(aFrom)), mix(uToA, uToB, across(aTo)), q);',
    '}'
  ].join('\n');
  var FRAGMENT = [
    'precision mediump float;',
    'uniform float uEdge, uHot, uInk;',
    'varying vec3 vCol;',
    'varying float vGain;',
    'void main() {',
    '  float a = 1.0 - smoothstep(uEdge, 0.5, length(gl_PointCoord - 0.5));',
    // A coloured disc with a slightly hotter centre. On the dark top section
    // uInk is 0: alpha 0 with premultiplied colour, so the dots ADD light to
    // the page behind them. On the white band uInk is 1: the same colour with
    // its own alpha, so the dots are laid OVER the page like ink.
    '  vec3 c = vCol * a * a + vec3(uHot) * pow(a, 8.0);',
    '  gl_FragColor = vec4(c * vGain, a * a * vGain * uInk);',
    '}'
  ].join('\n');

  // One canvas of N dots. Returns null where WebGL is missing or only
  // software-drawn. `host` gets the class `fx-on` once a first frame is drawn.
  // The dots are drawn as one or more ACTORS: runs of dots that each have their
  // own shapes, place, size and colours. `ink` is for a light background.
  function field(cv, host, N, ink) {
    var gl = null;
    try {
      gl = cv.getContext('webgl', {
        alpha: true, antialias: false, depth: false, stencil: false,
        premultipliedAlpha: true, powerPreference: 'low-power',
        failIfMajorPerformanceCaveat: !FORCE
      });
    } catch (err) { gl = null; }
    if (!gl) return null;

    var scatter = new Float32Array(N * 3), delay = new Float32Array(N), i;
    for (i = 0; i < N; i++) {
      var th = rand() * TAU, ph = Math.acos(2 * rand() - 1), rad = 1.3 + rand() * 1.9;
      scatter[i * 3] = Math.sin(ph) * Math.cos(th) * rad;
      scatter[i * 3 + 1] = Math.sin(ph) * Math.sin(th) * rad;
      scatter[i * 3 + 2] = Math.cos(ph) * rad;
      delay[i] = rand();
    }

    function compile(type, source) {
      var sh = gl.createShader(type); gl.shaderSource(sh, source); gl.compileShader(sh);
      if (gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return sh;
      warn('a 3D animation is off: this device refused its drawing program', gl.getShaderInfoLog(sh));
      return null;
    }
    var vs = compile(gl.VERTEX_SHADER, VERTEX), fs = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vs || !fs) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      warn('a 3D animation is off: this device refused its drawing program', gl.getProgramInfoLog(prog));
      return null;
    }
    gl.useProgram(prog);

    function buffer(data, moving) {
      var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, data, moving ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW); return b;
    }
    function attr(name) { var loc = gl.getAttribLocation(prog, name); if (loc >= 0) gl.enableVertexAttribArray(loc); return loc; }
    function bind(loc, buf, size, offset) { if (loc < 0) return; gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, offset); }
    function uni(name) { return gl.getUniformLocation(prog, name); }
    var scatterBuf = buffer(scatter), delayBuf = buffer(delay);
    var aFrom = attr('aFrom'), aTo = attr('aTo'), aScatter = attr('aScatter'), aDelay = attr('aDelay');
    var uProgress = uni('uProgress'), uBurst = uni('uBurst'), uTime = uni('uTime'), uScale = uni('uScale'), uSize = uni('uSize');
    var uTurn = uni('uTurn'), uLens = uni('uLens'), uCentre = uni('uCentre');
    var uGain = uni('uGain'), uEdge = uni('uEdge'), uHot = uni('uHot'), uLocal = uni('uLocal'), uSpin = uni('uSpin'), uOffset = uni('uOffset');
    var uFromA = uni('uFromA'), uFromB = uni('uFromB'), uToA = uni('uToA'), uToB = uni('uToB');
    gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, ink ? gl.ONE_MINUS_SRC_ALPHA : gl.ONE);
    gl.uniform1f(uni('uInk'), ink ? 1 : 0);
    gl.clearColor(0, 0, 0, 0);

    var actors = [], tick = null, ended = null, undo = null, raf = 0, last = 0, onScreen = true, watched = 0, slow = 0;
    var F = {
      N: N, scatter: scatter, cloud: scatterBuf, buffer: buffer,
      time: 0, scale: 1, turnX: 0, turnY: 0, awake: false, shown: false, dead: false
    };

    // A run of `count` dots starting at dot `first`. Its owner sets these each frame.
    F.actor = function (first, count) {
      var a = {
        first: first, count: count,
        from: null, to: null,          // the two shapes (buffers) it is between
        progress: 0, burst: 0,         // how far between them, and how far the dots fly on the way
        gain: 0, halo: 0,              // strength of the dots, and of the soft glow (0: none)
        dot: 0.03, edge: 0.3, hot: 0,  // dot size, how soft its rim is, how hot its middle
        local: 1, spin: 0, offset: [0, 0, 0],
        tintFrom: [CYAN, VIOLET], tintTo: [CYAN, VIOLET]
      };
      actors.push(a); return a;
    };
    F.write = function (buf, data) { gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, data); };
    // The canvas is `w` by `h` page pixels and the scene's middle is at (cx, cy) on it.
    F.lens = function (w, h, cx, cy) {
      var ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      var pw = Math.round(w * ratio), ph = Math.round(h * ratio);
      if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
      gl.viewport(0, 0, pw, ph);
      gl.uniform2f(uLens, FOCAL * h / w, FOCAL);
      gl.uniform2f(uCentre, cx / w * 2 - 1, -(cy / h * 2 - 1));
    };

    function draw(a, sizeUnit) {
      if (!a.from || !a.to || a.gain <= 0.002) return;
      bind(aFrom, a.from, 3, 0); bind(aTo, a.to, 3, 0);
      bind(aScatter, scatterBuf, 3, a.first * 12); bind(aDelay, delayBuf, 1, a.first * 4);
      gl.uniform1f(uProgress, a.progress); gl.uniform1f(uBurst, a.burst);
      gl.uniform1f(uLocal, a.local); gl.uniform1f(uSpin, a.spin); gl.uniform3fv(uOffset, a.offset);
      gl.uniform3fv(uFromA, a.tintFrom[0]); gl.uniform3fv(uFromB, a.tintFrom[1]);
      gl.uniform3fv(uToA, a.tintTo[0]); gl.uniform3fv(uToB, a.tintTo[1]);
      var size = a.dot * sizeUnit;
      // A soft glow from some of the dots, then every dot as a sharp point.
      if (a.halo > 0) {
        gl.uniform1f(uSize, size * HALO_SIZE); gl.uniform1f(uGain, a.halo * a.gain); gl.uniform1f(uEdge, 0.0); gl.uniform1f(uHot, 0.0);
        gl.drawArrays(gl.POINTS, 0, Math.floor(a.count * HALO_SHARE));
      }
      gl.uniform1f(uSize, size); gl.uniform1f(uGain, a.gain); gl.uniform1f(uEdge, a.edge); gl.uniform1f(uHot, a.hot);
      gl.drawArrays(gl.POINTS, 0, a.count);
    }
    function frame(now) {
      raf = 0; if (F.dead || !F.awake) return;
      var raw = (now - last) / 1000, dt = Math.min(raw, 0.05); last = now; F.time += Math.min(raw, 0.3);
      // Too slow on this device? Over the first frames, add up the time spent in
      // slow ones; past the limit, give up at once and show the fallback.
      if (F.shown && !FORCE && watched < WATCH_FRAMES) {
        watched++; if (raw > SLOW_FRAME_SECONDS) slow += Math.min(raw, SLOW_FRAME_MOST);
        if (slow > SLOW_SECONDS_LIMIT) { warn('a 3D animation was too slow on this device and switched itself off'); F.stop(); return; }
      }
      // Anything that goes wrong inside a frame switches the animation off (the
      // fallback comes back) instead of leaving a frozen picture.
      try {
        tick(F.time, dt);
        if (F.dead) return;
        gl.uniform1f(uTime, F.time); gl.uniform1f(uScale, F.scale); gl.uniform2f(uTurn, F.turnX, F.turnY);
        gl.clear(gl.COLOR_BUFFER_BIT);
        var sizeUnit = F.scale * FOCAL * cv.height / 2;
        for (var k = 0; k < actors.length; k++) draw(actors[k], sizeUnit);
      } catch (err) {
        warn('a 3D animation switched itself off:', err);
        F.stop();
        return;
      }
      if (!F.shown) { F.shown = true; host.classList.add('fx-on'); }
      raf = window.requestAnimationFrame(frame);
    }
    function kick() { if (!raf && !F.dead && F.awake) { last = window.performance.now(); raf = window.requestAnimationFrame(frame); } }
    function sync() { F.awake = onScreen && !document.hidden; kick(); }

    // Give up for good: the fallback picture comes back.
    F.stop = function () {
      if (F.dead) return;
      F.dead = true; F.awake = false; if (raf) window.cancelAnimationFrame(raf); raf = 0;
      host.classList.remove('fx-on');
      if (undo) undo();
      if (ended) ended();
      var lose = gl.getExtension('WEBGL_lose_context');   // hand the graphics memory back
      if (lose && !gl.isContextLost()) lose.loseContext();
    };
    // Begin. `onTick(time, dt)` runs before every frame; `onLayout` whenever the
    // page may have moved things; `onStop` once, if the animation gives up.
    F.start = function (onTick, onLayout, onStop) {
      tick = onTick; ended = onStop || null;
      // A context the browser takes away is not asked back: the animation stops.
      function lost() { F.stop(); }
      cv.addEventListener('webglcontextlost', lost);
      var sizes = window.ResizeObserver ? new window.ResizeObserver(onLayout) : null;
      if (sizes) sizes.observe(host);
      window.addEventListener('resize', onLayout, { passive: true });
      var views = window.IntersectionObserver ? new window.IntersectionObserver(function (entries) { onScreen = entries[entries.length - 1].isIntersecting; sync(); }) : null;
      if (views) views.observe(host);
      document.addEventListener('visibilitychange', sync);
      // Reduced motion switched on while the page is open: stop, the fallback returns.
      var calm = window.matchMedia('(prefers-reduced-motion: reduce)');
      function calmed() { if (calm.matches && !FORCE) F.stop(); }
      if (calm.addEventListener) calm.addEventListener('change', calmed); else if (calm.addListener) calm.addListener(calmed);
      undo = function () {
        cv.removeEventListener('webglcontextlost', lost);
        if (sizes) sizes.disconnect();
        if (views) views.disconnect();
        window.removeEventListener('resize', onLayout);
        document.removeEventListener('visibilitychange', sync);
        if (calm.removeEventListener) calm.removeEventListener('change', calmed); else if (calm.removeListener) calm.removeListener(calmed);
      };
      // The mascot starts long after the page loads: the setting may have been
      // switched on in between.
      if (calm.matches && !FORCE) { F.stop(); return; }
      onLayout(); sync();
    };
    return F;
  }

  // ══ 1. SHAPE SHIFTER (the top section) ═════════════════════════════════
  // A phone gets the same dots as a desktop. A window under 700 px wide used to
  // get a quarter of them (12,000), and any device that reported 4 GB of memory
  // or less, at any width, a seventh (7,000; many Android phones report 4),
  // each drawn twice as wide or more to fill the gaps, and the picture was
  // coarse (founder, 28 Nov 2026: "On mobile the animation isn't high
  // quality"; coarse dots is the reading acted on). A dot of half the width
  // covers a quarter of the pixels, so four times the dots is the same amount
  // of blending for the graphics chip. What does grow with the dots: the
  // points sent to it each frame, the dot buffers (208 bytes a dot over the
  // sixteen shapes, about 10 MB at 48,000) and the work of building a shape,
  // which is why shapes are built a slice at a time (`sampler`, `buildStep`).
  var COUNT_FULL = 48000;         // dots, on a phone as on a desktop
  var COUNT_LOW_MEMORY = 24000;   // dots when the device reports under 4 GB
  var SMALL_SCREEN_PX = 700;      // narrower than this is a phone held upright: no soft glow (below)
  var HOLD_SECONDS = 2.2;         // how long a finished shape stays
  var MORPH_SECONDS = 1.9;        // burst out and build in
  var MAX_HALF_PX = 210;          // biggest half-height on screen
  var DOT_SIZE = 0.03;            // at COUNT_FULL; fewer dots are drawn bigger, to cover the same area
  var HALO_GAIN = 0.05;
  var HALO_MAX_PIXEL_RATIO = 2;   // no glow pass on a denser screen than this
  var HALO_MODEST_GB = 4;         // nor on a device that reports this much memory or less
  var HERO_BURST = 0.62;          // how far the dots fly between two shapes
  var HERO_SWELL = 0.14;          // how much bigger the shape grows under a pointer
  var HERO_TURN_X = 1.15, HERO_TURN_Y = 0.6;   // furthest turn toward the pointer, in radians
  // A finger (founder, 28 Nov 2026: "on the phone the reaction to the touch and
  // moving is not great"). A mouse turns the shape by hovering; a finger cannot
  // hover, so it spins the shape by dragging sideways, like a globe: the dot
  // under the finger follows it. Let go while moving and it keeps spinning,
  // slows, and settles facing front. An up-or-down drag still scrolls the page.
  var DRAG_TURN = 1;              // radians of spin per shape-radius of finger travel
  var SPIN_MAX = 14;              // fastest fling, radians a second
  // After a lift the spin is a damped spring toward the full turn it would
  // coast into, so it slows and stops facing front in one smooth movement.
  var SPIN_DAMP = 3;              // how fast a fling slows (per second)
  var SPIN_PULL = SPIN_DAMP * SPIN_DAMP / 4;   // the spring's pull home: just enough not to swing past
  var FLING_STALE_MS = 90;        // a finger that stopped this long before lifting flings nothing
  var TAP_SLOP_PX = 10;           // a press that moved further is a drag, not a tap
  var POP = 0.07;                 // the shape jumps this much bigger the moment it is touched or clicked
  var QUEUED_HOLD_SECONDS = 0.45; // a tap while a shape is changing: the next one is held only this long

  function hero(logo) {
    var host = document.getElementById('hero'), cv = document.getElementById('heroFx');
    var visual = host && host.querySelector('.hero2-visual');
    if (!host || !cv || !visual) return false;

    var N = lowMemory() ? COUNT_LOW_MEMORY : COUNT_FULL;
    var F = field(cv, host, N, false);
    if (!F) return false;
    var dots = F.actor(0, N);
    dots.dot = DOT_SIZE * Math.sqrt(COUNT_FULL / N);
    // The soft glow is nearly nine tenths of the pixels the graphics chip has to
    // blend, for a few per cent of the light (at phone size it can hardly be
    // seen). It is left out on a phone held upright, on a device that reports
    // 4 GB of memory or less, and on a screen with more than two device pixels
    // to the page pixel (a phone on its side, a 4K laptop scaled to 250%),
    // where it would cost the most. Other wide screens keep it. These are the
    // same screens as before the dots were evened out on 28 Nov 2026, on
    // purpose: the full dots are about the same blending for a modest tablet
    // as its few fat ones were; with the glow on top it would be nine times
    // what that tablet blended before.
    var modest = !!navigator.deviceMemory && navigator.deviceMemory <= HALO_MODEST_GB;
    var plain = modest || window.innerWidth < SMALL_SCREEN_PX || (window.devicePixelRatio || 1) > HALO_MAX_PIXEL_RATIO;
    dots.halo = plain ? 0 : HALO_GAIN;
    dots.hot = 0.08; dots.burst = HERO_BURST;

    // The list, in the order shown. `make` runs once, when its turn to be built
    // comes; `tint` is two colours blended from bottom-left to top-right.
    var SHAPES = [
      { name: 'NT logo', tint: [CYAN, VIOLET], make: function () { return logoShape(logo, N); } },
      { name: 'dollar', tint: [GOLD, GREEN], make: function () { return sampler(DRAW.dollar, N); } },
      { name: 'rising chart', tint: [GREEN, CYAN], make: function () { return sampler(DRAW.chart, N); } },
      { name: 'gold coin', tint: [ORANGE, GOLD], make: function () { return coin(DRAW.coinDollar, N); } },
      { name: 'lessons (open book)', tint: [PINK, VIOLET], make: function () { return sampler(DRAW.book, N); } },
      { name: 'the world', tint: [VIOLET, CYAN], make: function () { return globe(N); } },
      { name: 'rankings podium', tint: [BLUE, CYAN], make: function () { return sampler(DRAW.podium, N); } },
      { name: 'Arcade (game controller)', tint: [VIOLET, PINK], make: function () { return sampler(DRAW.controller, N); } },
      { name: 'noobtrader name', tint: [VIOLET, CYAN], make: function () { return sampler(DRAW.name, N); } },
      { name: 'trophy', tint: [ORANGE, GOLD], make: function () { return sampler(DRAW.trophy, N); } },
      { name: 'the app on a phone', tint: [VIOLET, BLUE], make: function () { return sampler(DRAW.phone, N); } },
      { name: 'Lounge (speech bubble)', tint: [CYAN, GREEN], make: function () { return sampler(DRAW.bubble, N); } },
      { name: 'level-up star', tint: [PINK, GOLD], make: function () { return sampler(DRAW.star, N); } },
      { name: 'Daily Spin (wheel)', tint: [GOLD, PINK], make: function () { return sampler(DRAW.wheel, N); } },
      { name: 'crypto coin', tint: [ORANGE, GOLD], make: function () { return coin(DRAW.coinB, N); } },
      { name: 'streak flame', tint: [RED, GOLD], make: function () { return sampler(DRAW.flame, N); } }
    ];
    var LOOP = SHAPES.length, CLOUD = LOOP;   // the cloud is the opening shape, one past the list

    // One buffer per shape, filled in as each is built. The cloud is ready now.
    var posBuf = [], gains = [], tints = [], built = 0;
    posBuf[CLOUD] = F.cloud; gains[CLOUD] = GAIN_OPEN; tints[CLOUD] = [VIOLET, CYAN];
    // One slice of building. The first slice of a shape reads its drawing,
    // each one after it places SLICE_DOTS dots, and the slice that places
    // the last of them hands the shape to the graphics chip. A shape that
    // cannot be drawn on this device is shown as the cloud.
    var making = null, placed = 0;
    function buildStep() {
      if (F.dead || built >= LOOP) return;
      var shape = SHAPES[built];
      try {
        if (!making) {
          making = shape.make(); placed = 0;
          // A line of SHAPES whose `make` hands back nothing (a forgotten
          // `return`) would otherwise be read again on every step, for ever.
          if (!making) throw new Error('its make() returned nothing');
          return;
        }
        var upTo = Math.min(N, placed + SLICE_DOTS);
        making.fill(placed, upTo); placed = upTo;
        if (placed < N) return;
        posBuf[built] = F.buffer(making.data); gains[built] = making.gain;
      } catch (err) {
        warn('the shape "' + shape.name + '" could not be drawn and is shown as a cloud:', err);
        posBuf[built] = F.cloud; gains[built] = GAIN_OPEN;
      }
      tints[built] = shape.tint; built++; making = null;
    }
    // The shapes after the first: about one a second. One read of a drawing a
    // second is what keeps the building out of the frames' way (the read is
    // the long piece, and the page's too-slow rule counts every long frame);
    // the slices take the placing of the dots out of the read's own frame.
    // tick() chooses the next shape as the one on screen finishes building in,
    // so the second shape has to exist 1.9 s after the first frame (it is
    // ready about 0.7 s after it where timers run on time), and after that a
    // shape every four seconds, or every two when the visitor clicks on. One
    // that is late is not waited for: the first shape is shown again.
    function buildRest() {
      var before = built;
      buildStep();
      if (built < LOOP && !F.dead) window.setTimeout(buildRest, built > before ? SHAPE_GAP_MS : SLICE_GAP_MS);
    }

    // Layout: the canvas covers the whole top section; the shape is drawn
    // where the picture column is.
    var heroW = 1, heroH = 1, centreX = 0, centreY = 0, halfPx = 100, baseScale = 1;
    function layout() {
      var r = host.getBoundingClientRect(), v = visual.getBoundingClientRect();
      if (!r.width || !r.height) return;
      heroW = r.width; heroH = r.height;
      centreX = v.left + v.width / 2 - r.left; centreY = v.top + v.height / 2 - r.top;
      halfPx = Math.min(v.width * 0.42, v.height * 0.62, MAX_HALF_PX);
      baseScale = halfPx * CAMERA_Z / (SHAPE_HALF * FOCAL * heroH / 2);
      F.lens(heroW, heroH, centreX, centreY);
      // The shape is taller than the picture column it is drawn on (a quarter
      // taller on a phone, more while it swells). The page is told by how much
      // it sticks out, top and bottom, and stretches the column's reach to the
      // whole shape (`.hero2-visual::after` in index.html): a click on the
      // shape's top or bottom edge then skips on like one on its middle, and
      // quick clicks there select nothing (they used to select the "10,000"
      // under it: founder, 28 Nov 2026, "when clicking it highlights a block").
      visual.style.setProperty('--fx-over', Math.max(0, Math.ceil(halfPx * (1 + HERO_SWELL) - v.height / 2)) + 'px');
    }

    // Pointer: a mouse turns the shape toward it and swells it when it is over
    // the shape; a finger spins it by dragging (above). A click or a tap on the
    // picture column moves to the next shape, with a pop the moment it lands.
    var targetX = 0, targetY = 0, turnX = 0, turnY = 0, inside = false, near = false, swell = 0, clicked = false;
    var spin = 0, spinVel = 0, spinHome = 0, finger = null, fingerX = 0, fingerAt = 0, travel = 0, pop = 0, grabbed = false, tapTouch = false;
    function onMove(e) {
      if (e.pointerType === 'touch') return;   // a finger is handled below
      var r = host.getBoundingClientRect(), dx = e.clientX - r.left - centreX, dy = e.clientY - r.top - centreY;
      targetX = clamp1(dx / (heroW * 0.5)); targetY = clamp1(dy / (heroH * 0.5));
      inside = true; near = Math.sqrt(dx * dx + dy * dy) < halfPx * 1.4;
    }
    function away(e) { if (e && e.pointerType === 'touch') return; inside = false; near = false; }
    // A mouse pops the shape as it presses. A finger may be starting a page
    // scroll, so it pops the shape only once it is known: a tap (on its click)
    // or a sideways drag (past TAP_SLOP_PX). Until then nothing moves under it:
    // the idle sway is folded into the spin where it stands.
    function onDown(e) {
      travel = 0; tapTouch = e.pointerType === 'touch';
      if (!tapTouch) { pop = 1; return; }
      if (finger !== null) return;
      finger = e.pointerId; fingerX = e.clientX; fingerAt = e.timeStamp || 0; spinVel = 0; grabbed = false;
      spin += turnX * HERO_TURN_X; turnX = 0;
    }
    function onFingerMove(e) {
      if (e.pointerId !== finger) return;
      var step = e.clientX - fingerX, at = e.timeStamp || 0, angle = step / Math.max(1, halfPx) * DRAG_TURN;
      travel += Math.abs(step); spin += angle;
      if (!grabbed && travel > TAP_SLOP_PX) { grabbed = true; pop = 1; }
      if (at > fingerAt) spinVel = spinVel * 0.5 + angle / ((at - fingerAt) / 1000) * 0.5;
      fingerX = e.clientX; fingerAt = at;
    }
    function onLift(e) {
      if (e.pointerId !== finger) return;
      finger = null;
      // A scroll took the finger over (cancel), or it stopped before lifting: no fling.
      if (e.type === 'pointercancel' || (e.timeStamp || 0) - fingerAt > FLING_STALE_MS) spinVel = 0;
      spinVel = Math.max(-SPIN_MAX, Math.min(SPIN_MAX, spinVel));
      spinHome = Math.round((spin + spinVel / SPIN_DAMP) / TAU) * TAU;   // where it would coast to
    }
    function onClick() {
      if (travel > TAP_SLOP_PX) { travel = 0; return; }   // the end of a spin, not a tap
      clicked = true;
      if (tapTouch) pop = 1;
    }
    host.addEventListener('pointermove', onMove, { passive: true });
    host.addEventListener('pointerleave', away);
    host.addEventListener('pointercancel', away);
    visual.addEventListener('pointerdown', onDown, { passive: true });
    visual.addEventListener('pointermove', onFingerMove, { passive: true });
    visual.addEventListener('pointerup', onLift);
    visual.addEventListener('pointercancel', onLift);
    visual.addEventListener('click', onClick);
    // The spin when no finger holds it: a fling coasts, slows and stops at the
    // full turn it was heading for (spinHome), so the shape ends facing front.
    function coast(dt) {
      if (finger !== null || (spin === 0 && spinVel === 0)) return;
      spinVel += ((spinHome - spin) * SPIN_PULL - SPIN_DAMP * spinVel) * dt;
      spin += spinVel * dt;
      if (Math.abs(spin - spinHome) < 1e-3 && Math.abs(spinVel) < 1e-2) { spin = 0; spinVel = 0; spinHome = 0; }
    }

    var from = CLOUD, to = 0, phaseStart = -HOLD_SECONDS, waiting = true, queued = false;
    function tick(time, dt) {
      // A first frame is on screen and the card is hidden under fx-on: the
      // page's "still waiting" mark can go.
      if (waiting && F.shown) { waiting = false; doneWaiting(); }
      var ax = targetX, ay = targetY, held = finger !== null, holding = held && grabbed;
      // While a finger holds the shape, its own idle sway stops (the finger turns it).
      if (held) { ax = 0; ay = 0; } else if (!inside) { ax = Math.sin(time * 0.45) * 0.5; ay = Math.sin(time * 0.6 + 1) * 0.28; }
      var k = Math.min(1, dt * 5);
      turnX += (ax - turnX) * k; turnY += (ay - turnY) * k;
      swell += ((near || holding ? 1 : 0) - swell) * Math.min(1, dt * (holding ? 8 : 4));
      coast(dt);
      pop *= Math.exp(-7 * dt);

      var elapsed = time - phaseStart;
      if (clicked) {
        clicked = false;
        if (elapsed < HOLD_SECONDS) { phaseStart = time - HOLD_SECONDS; elapsed = HOLD_SECONDS; }
        else queued = true;   // mid-change: the next shape is shown only briefly
      }
      if (elapsed > HOLD_SECONDS + MORPH_SECONDS) {
        from = to; to = (to + 1) % LOOP; if (!posBuf[to]) to = 0;   // not built yet: back to the start
        phaseStart = time; elapsed = 0;
        if (queued) { queued = false; phaseStart = time - (HOLD_SECONDS - QUEUED_HOLD_SECONDS); }
      }
      var progress = elapsed < HOLD_SECONDS ? 0 : (elapsed - HOLD_SECONDS) / MORPH_SECONDS;

      dots.from = posBuf[from]; dots.to = posBuf[to]; dots.tintFrom = tints[from]; dots.tintTo = tints[to];
      dots.progress = progress;
      dots.gain = gains[from] + (gains[to] - gains[from]) * Math.min(1, progress * 1.3);
      F.scale = baseScale * (1 + HERO_SWELL * swell) * (1 + POP * pop); F.turnX = turnX * HERO_TURN_X + spin; F.turnY = turnY * HERO_TURN_Y;
    }

    // `?fx-shape=7` opens on that shape in the list (0 is the first): for testing.
    var first = parseInt((/[?&]fx-shape=(\d+)/.exec(query) || [])[1], 10) % LOOP || 0;
    while (built <= first && !F.dead) buildStep();   // up to the opening shape, whole, before the first frame
    to = first;
    F.start(tick, layout, function () {
      doneWaiting();   // it gave up: the card is the picture again
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', away);
      host.removeEventListener('pointercancel', away);
      visual.removeEventListener('pointerdown', onDown);
      visual.removeEventListener('pointermove', onFingerMove);
      visual.removeEventListener('pointerup', onLift);
      visual.removeEventListener('pointercancel', onLift);
      visual.removeEventListener('click', onClick);
    });
    window.setTimeout(buildRest, BUILD_GAP_MS);   // the others, a slice at a time
    return true;
  }

  // ══ 2. THE 3D MASCOT (the white band) ══════════════════════════════════
  // The stickman is measured in the units of his own drawing: the 200 x 330
  // box of the <svg> in index.html, x to the right, y DOWN, plus z toward the
  // viewer. Poses below are written in those units. Inside the scene y is
  // turned to point up and the middle of the box, (100, 165), is the origin.
  var M_UNIT = 0.01;              // one drawing unit, in the scene's units
  var M_MID_X = 100, M_MID_Y = 165, M_FLOOR_Y = 318, M_HEAD_Y = 92;
  var M_GROW = 1.2;               // the 3D stickman is this much bigger than the drawing, growing up from his feet
  var M_TURN_X = 0.6, M_TURN_Y = 0.3;   // furthest turn of the scene toward the pointer, in radians
  var M_TILT = 0.1;               // the scene is always seen from a little above, so the floor shows
  var M_LOOK = 0.3;               // how much further his head alone turns
  var M_LOOK_NOD = 0.6;           // share of that used for looking up and down
  var M_EYE_SHIFT = 4;            // his eyes move this far toward the pointer
  var M_NEAR_PX = 190;            // pointer this close: he grins and swells
  var M_ROOM_PX = 150;            // clear space he needs on his right, for a prop held at arm's length
  var M_SHIFT_MAX_PX = 70;        // the scene moves left by up to this much to get it
  var M_STICK = 7200, M_LOGO = 4600, M_PROP = 2400, M_SHADOW = 520;            // dots
  var M_STICK_FEW = 4200, M_LOGO_FEW = 2800, M_PROP_FEW = 1500, M_SHADOW_FEW = 320; // dots when the device reports under 4 GB
  var M_IDLE_SECONDS = 10;        // rest between two runs of the routine
  var M_BURST = 0.3;              // how far his dots fly when he bursts and rebuilds
  var M_CLOUD = 0.42;             // size of the cloud he first builds in from
  var M_LOGO_CLOUD = 0.62, M_LOGO_BURST = 1.0, M_PROP_BURST = 0.8;
  var M_ENTER_SECONDS = 1.5;      // the logo's build-in
  var M_STICK_GAIN = 1.25, M_LOGO_GAIN = 1.25, M_PROP_GAIN = 1.3, M_LOGO_HALO = 0.012;
  var M_STICK_DOT = 0.034, M_LOGO_DOT = 0.03, M_PROP_DOT = 0.03;
  var M_PROP_SIZE = 80;           // a prop is this many drawing units across
  var M_PROP_SWAP_SECONDS = 0.6;  // shortest time one prop takes to become another
  var M_LOGO_ACT_SECONDS = 0.7, M_LOGO_BURST_SECONDS = 1.1;   // shortest time for a logo action, and for its burst
  var M_COIN_SPIN = 2.2;          // a coin turns this fast (radians a second); other props only sway
  var M_CHEST_DROP = 30, M_CHEST_OUT = 42;   // a prop at his chest: this far below his shoulders (clear of his chin), this far in front
  var M_BREATH = 1.2;             // his body rises and falls this much
  // His shadow: a flat round patch on the floor under him. Seen level it is a
  // soft line; it opens into an oval as the scene tips, and shrinks when he jumps.
  var M_SHADOW_WIDE = 50, M_SHADOW_DEEP = 30, M_SHADOW_GAIN = 0.5, M_SHADOW_DOT = 0.05;
  var M_SHADOW_FADE = 110;        // a jump this high (drawing units) fades it to its faintest
  // The stickman's own measures, in drawing units.
  var HEAD_R = 58, FACE_R = 56, SPINE = 98, SHOULDER = 76, ARM = 37, LEG = 39, LIMB_R = 4.5, RING_R = 3.2, EYE_R = 8;
  var INK = [0.067, 0.102, 0.227];   // #111a3a, the stickman's line colour
  var AMBER = [0.93, 0.5, 0.06], HONEY = [0.98, 0.7, 0.05], TEAL = [0, 0.7, 0.57], SKY = [0.1, 0.62, 0.95];
  var PROP_TINT = {
    none: [INK, INK], coin: [AMBER, HONEY], star: [PINK, HONEY], trophy: [AMBER, HONEY], chart: [TEAL, SKY],
    book: [PINK, VIOLET], flame: [RED, HONEY], shield: [TEAL, BLUE]
  };

  // The 11 points a pose gives, in this order, 3 numbers each.
  var JOINTS = ['hip', 'neck', 'head', 'elbowL', 'handL', 'elbowR', 'handR', 'kneeL', 'footL', 'kneeR', 'footR'];
  var T_HIP = 0, T_NECK = 3, T_HEAD = 6, T_ELBOW_L = 9, T_HAND_L = 12, T_ELBOW_R = 15, T_HAND_R = 18, T_KNEE_L = 21, T_FOOT_L = 24, T_KNEE_R = 27, T_FOOT_R = 30;
  // Where the solved figure keeps its joints (it adds the shoulder).
  var J_HIP = 0, J_NECK = 3, J_HEAD = 6, J_SHOULDER = 9, J_ELBOW_L = 12, J_HAND_L = 15, J_ELBOW_R = 18, J_HAND_R = 21, J_KNEE_L = 24, J_FOOT_L = 27, J_KNEE_R = 30, J_FOOT_R = 33;
  var BONES = [J_HIP, J_NECK, J_SHOULDER, J_ELBOW_L, J_ELBOW_L, J_HAND_L, J_SHOULDER, J_ELBOW_R, J_ELBOW_R, J_HAND_R,
    J_HIP, J_KNEE_L, J_KNEE_L, J_FOOT_L, J_HIP, J_KNEE_R, J_KNEE_R, J_FOOT_R];
  var BONE_LENGTH = [SPINE, ARM, ARM, ARM, ARM, LEG, LEG, LEG, LEG];
  // Faces, measured from the middle of the head, y up.
  // mouth: left end x, y; right end x, y; how far its top line and its bottom line dip.
  var MOUTH = { smile: [-20, -24, 22, -22, -40, -40], grin: [-26, -19, 28, -17, -32, -58], open: [-12, -32, 12, -32, -14, -52], flat: [-18, -28, 18, -27, -28, -28] };
  // eyes: how open the left one is, the right one, and their size.
  var EYES = { open: [1, 1, 1], wide: [1.2, 1.2, 1.15], blink: [0.12, 0.12, 1], wink: [1, 0.12, 1] };
  var BROWS = { rest: 0, up: 8 };
  var EYE_L_X = -20, EYE_R_X = 22, EYE_Y = 2;
  // What a beat may ask of the logo, and where it may put a prop.
  var LOGO_ACTS = ['none', 'pulse', 'spin', 'burst', 'hop'];
  var PLACES = ['handL', 'handR', 'aboveHead', 'chest', 'logo', 'floorL', 'floorR'];
  // A joint follows the pose's middle point only when that point is clearly
  // off the limb's own line: within BEND_DOUBT units of it the point says
  // nothing, from BEND_TRUST units it is followed exactly, with a smooth mix
  // between. And the side a joint bends to may turn about its limb no faster
  // than BEND_TURN radians a second: asked for the other side, it swings round
  // in a few frames instead of flicking across in one.
  var BEND_DOUBT = 2, BEND_TRUST = 8, BEND_TURN = 16;
  var BROW_L = [-34, 20, -24, 30, -12, 24], BROW_R = [12, 24, 24, 30, 34, 20];
  var F_GRIN = MOUTH.grin, F_SIZE = 10;   // a face is 10 numbers: 6 mouth, 3 eyes, 1 brows

  var EASE = {
    inOut: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    out: function (t) { return 1 - Math.pow(1 - t, 3); },
    'in': function (t) { return t * t * t; },
    back: function (t) { var c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    bounce: function (t) {
      var n = 7.5625, d = 2.75;
      if (t < 1 / d) return n * t * t;
      if (t < 2 / d) { t -= 1.5 / d; return n * t * t + 0.75; }
      if (t < 2.5 / d) { t -= 2.25 / d; return n * t * t + 0.9375; }
      t -= 2.625 / d; return n * t * t + 0.984375;
    }
  };

  // What is wrong with a routine, in words; '' when it is sound. A routine
  // with a mistake in it is not started: the drawn stickman simply stays.
  function routineFault(dance) {
    var poses = dance && dance.poses, beats = dance && dance.beats, names = {}, i, k, p, b, v;
    if (!poses || !beats || beats.length < 2) return 'it needs poses and at least two beats';
    for (i = 0; i < poses.length; i++) {
      p = poses[i];
      if (!p || !p.name) return 'pose ' + i + ' has no name';
      for (k = 0; k < JOINTS.length; k++) {
        v = p[JOINTS[k]];
        if (!v || v.length !== 3 || !isFinite(v[0] + v[1] + v[2])) return 'pose "' + p.name + '": ' + JOINTS[k] + ' must be three numbers';
      }
      if (!MOUTH[p.mouth] || !EYES[p.eyes] || !(p.brows in BROWS)) return 'pose "' + p.name + '" has a face word that is not known';
      names[p.name] = true;
    }
    if (!names.rest) return 'there is no pose called rest';
    for (i = 0; i < beats.length; i++) {
      b = beats[i];
      if (!b || !names[b.pose]) return 'beat ' + i + ' names a pose that is not in the list';
      if (!(b.move >= 0) || !(b.hold >= 0) || !isFinite(b.move + b.hold)) return 'beat ' + i + ': move and hold must be numbers';
      if (b.spin !== undefined && !isFinite(b.spin)) return 'beat ' + i + ': spin must be a number of turns';
      if (!EASE[b.ease] || LOGO_ACTS.indexOf(b.logo) < 0 || !PROP_TINT[b.prop] || PLACES.indexOf(b.propAt) < 0) return 'beat ' + i + ' has an ease, logo, prop or propAt word that is not known';
    }
    return '';
  }
  function readPose(p) {
    var j = new Float32Array(JOINTS.length * 3);
    for (var k = 0; k < JOINTS.length; k++) {
      var v = p[JOINTS[k]];
      j[k * 3] = v[0] - M_MID_X; j[k * 3 + 1] = M_MID_Y - v[1]; j[k * 3 + 2] = v[2];
    }
    return { j: j, f: new Float32Array(MOUTH[p.mouth].concat(EYES[p.eyes], [BROWS[p.brows]])) };
  }

  // `parts`: where he stands (`svg`, a box 200 by 330 of his drawing's units)
  // and the flat logo beside him (`flat`). On a card (`parts.card`) he never
  // shifts left, and after his entrance he waits, holding his card's prop,
  // until `parts.waiting()` says the card is selected; then he dances, once
  // each time it is selected. Returns { play } (start the dance now), or nothing.
  function mascot(logo, host, cv, dance, parts) {
    parts = parts || {};
    var svg = parts.svg || document.getElementById('mascotSvg'), flat = parts.flat || host.querySelector('.mascot-logo');
    var waiting = parts.waiting || null;
    if (!svg || !flat) return;
    var fault = routineFault(dance);
    if (fault) { warn('the stickman animation is off: its routine has a mistake:', fault); return; }
    var few = lowMemory();
    var nLogo = few ? M_LOGO_FEW : M_LOGO, nStick = few ? M_STICK_FEW : M_STICK, nProp = few ? M_PROP_FEW : M_PROP, nShadow = few ? M_SHADOW_FEW : M_SHADOW;
    var F = field(cv, host, nShadow + nLogo + nStick + nProp, true);
    if (!F) return;
    var U = M_UNIT, i, k, n;

    var POSES = {}, BEATS = dance.beats;
    for (i = 0; i < dance.poses.length; i++) POSES[dance.poses[i].name] = readPose(dance.poses[i]);
    var REST = POSES.rest;
    function newPose() { return { j: new Float32Array(JOINTS.length * 3), f: new Float32Array(F_SIZE) }; }
    function copyPose(a, out) { out.j.set(a.j); out.f.set(a.f); }
    function blend(a, b, e, out) {
      for (var m = 0; m < out.j.length; m++) out.j[m] = a.j[m] + (b.j[m] - a.j[m]) * e;
      for (m = 0; m < F_SIZE; m++) out.f[m] = a.f[m] + (b.f[m] - a.f[m]) * e;
    }
    var cur = newPose(), fromPose = newPose();
    copyPose(REST, cur); copyPose(REST, fromPose);

    // ── Where each of his dots sits on him: three numbers per dot, read
    //    against the part it belongs to. Parts: 9 bones, the head's outline,
    //    two eyes, two eyebrows, the mouth. ───────────────────────────────
    var WEIGHT = [SPINE * 9, ARM * 9, ARM * 9, ARM * 9, ARM * 9, LEG * 9, LEG * 9, LEG * 9, LEG * 9, 2000, 300, 300, 170, 170, 560];
    var P_RING = 9, P_EYE = 10, P_BROW = 12, P_MOUTH = 14, PARTS = WEIGHT.length;
    var part = [0], total = 0, run = 0;
    for (k = 0; k < PARTS; k++) total += WEIGHT[k];
    for (k = 0; k < PARTS; k++) { run += WEIGHT[k]; part.push(k === PARTS - 1 ? nStick : Math.round(run / total * nStick)); }
    var loc = new Float32Array(nStick * 3);
    function inBall(radius, out) {   // a random point inside a ball
      var x, y, z;
      do { x = rand() * 2 - 1; y = rand() * 2 - 1; z = rand() * 2 - 1; } while (x * x + y * y + z * z > 1);
      out[0] = x * radius; out[1] = y * radius; out[2] = z * radius;
    }
    var tmp = [0, 0, 0];
    for (k = 0; k < PARTS; k++) for (i = part[k]; i < part[k + 1]; i++) {
      var a, b, c, r, ang;
      if (k < P_RING) {
        // A bone is a round rod with a ball at each end, so joints stay smooth.
        var len = BONE_LENGTH[k], capShare = LIMB_R * 4 / 3 / (len + LIMB_R * 4 / 3);
        if (rand() < capShare) { inBall(LIMB_R, tmp); a = (rand() < 0.5 ? 0 : 1) + tmp[0] / len; b = tmp[1]; c = tmp[2]; }
        else { a = rand(); r = LIMB_R * Math.sqrt(rand()); ang = rand() * TAU; b = Math.cos(ang) * r; c = Math.sin(ang) * r; }
      } else if (k === P_RING) {
        // The outline of his head: a hoop, as thick as the line it is drawn with.
        var th = rand() * TAU; r = RING_R * Math.sqrt(rand()); ang = rand() * TAU;
        a = Math.cos(th) * (HEAD_R + Math.cos(ang) * r); b = Math.sin(th) * (HEAD_R + Math.cos(ang) * r); c = Math.sin(ang) * r;
      } else if (k < P_BROW) {
        r = Math.sqrt(rand()); ang = rand() * TAU; a = Math.cos(ang) * r; b = Math.sin(ang) * r; c = rand() * 2 - 1;
      } else if (k < P_MOUTH) {
        a = rand(); b = (rand() - 0.5) * 6; c = rand() * 2 - 1;
      } else {
        a = rand(); b = (rand() - 0.5) * 6; c = rand() < 0.5 ? 0 : 1;   // c: the top line or the bottom line
      }
      loc[i * 3] = a; loc[i * 3 + 1] = b; loc[i * 3 + 2] = c;
    }

    // ── The figure: from a pose's targets to where every joint really is. ──
    var J = new Float32Array(36), up = [0, 1, 0];
    var bendWas = new Float32Array(36);   // the side each joint last bent to (kept at the joint's own place in J)
    var bendStep = -1;                    // seconds since the figure was last solved; below 0: let every joint turn freely
    // A two-part limb from `root` (already solved) toward the target point. Its
    // joint bends to the side the pose's middle point is on. A middle point on
    // the limb's own line (a straight arm or leg, as in his drawing) says
    // nothing, and trusting the sliver left over made the joint snap from side
    // to side with every breath. So there the joint takes its natural side:
    // `lean` is -1 for an elbow (back, away from the viewer) and 1 for a knee
    // (forward), which from the front still looks like the straight line drawn.
    function limb(root, target, hint, len, mid, end, lean) {
      var t = cur.j, ax = J[root], ay = J[root + 1], az = J[root + 2];
      var dx = t[target] - ax, dy = t[target + 1] - ay, dz = t[target + 2] - az;
      var d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.001;
      dx /= d; dy /= d; dz /= d;
      var reach = Math.min(d, len * 2 - 0.01), along = reach / 2, out = Math.sqrt(Math.max(0, len * len - along * along));
      // the part of the middle point that lies off the limb's line
      var hx = t[hint] - ax, hy = t[hint + 1] - ay, hz = t[hint + 2] - az, dot = hx * dx + hy * dy + hz * dz;
      hx -= dx * dot; hy -= dy * dot; hz -= dz * dot;
      var hl = Math.sqrt(hx * hx + hy * hy + hz * hz);
      // the natural side: back or forward (down, for a limb pointing at the
      // viewer), made square to the limb
      var deep = Math.abs(dz), wy = -deep, wz = lean * (1 - deep), across = dy * wy + dz * wz;
      var nx = -dx * across, ny = wy - dy * across, nz = wz - dz * across, nl = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (nl < 0.001) { nx = 1; ny = 0; nz = 0; nl = 1; }
      var trust = hl <= BEND_DOUBT ? 0 : hl >= BEND_TRUST ? 1 : (hl - BEND_DOUBT) / (BEND_TRUST - BEND_DOUBT);
      var bx = nx / nl * (1 - trust), by = ny / nl * (1 - trust), bz = nz / nl * (1 - trust);
      if (trust > 0) { bx += hx / hl * trust; by += hy / hl * trust; bz += hz / hl * trust; }
      var bl = Math.sqrt(bx * bx + by * by + bz * bz);
      if (bl < 0.001) { bx = nx / nl; by = ny / nl; bz = nz / nl; bl = 1; }
      bx /= bl; by /= bl; bz /= bl;
      // Turn toward that side from the side it had, no faster than BEND_TURN.
      var wx = bendWas[mid], wy = bendWas[mid + 1], wz = bendWas[mid + 2], wd = wx * dx + wy * dy + wz * dz;
      wx -= dx * wd; wy -= dy * wd; wz -= dz * wd;   // the old side, made square to the limb as it lies now
      var wl = Math.sqrt(wx * wx + wy * wy + wz * wz);
      if (bendStep >= 0 && wl > 0.001) {
        wx /= wl; wy /= wl; wz /= wl;
        // the angle from the old side to the new one, about the limb
        var turn = Math.atan2(dx * (wy * bz - wz * by) + dy * (wz * bx - wx * bz) + dz * (wx * by - wy * bx), wx * bx + wy * by + wz * bz);
        var most = BEND_TURN * bendStep;
        if (turn > most) turn = most; else if (turn < -most) turn = -most;
        var ct = Math.cos(turn), st = Math.sin(turn);
        bx = wx * ct + (dy * wz - dz * wy) * st; by = wy * ct + (dz * wx - dx * wz) * st; bz = wz * ct + (dx * wy - dy * wx) * st;
      }
      bendWas[mid] = bx; bendWas[mid + 1] = by; bendWas[mid + 2] = bz;
      J[mid] = ax + dx * along + bx * out; J[mid + 1] = ay + dy * along + by * out; J[mid + 2] = az + dz * along + bz * out;
      J[end] = ax + dx * reach; J[end + 1] = ay + dy * reach; J[end + 2] = az + dz * reach;
    }
    function solve(time) {
      var t = cur.j;
      J[J_HIP] = t[T_HIP]; J[J_HIP + 1] = t[T_HIP + 1] + Math.sin(time * 2.1) * M_BREATH; J[J_HIP + 2] = t[T_HIP + 2];
      var dx = t[T_NECK] - t[T_HIP], dy = t[T_NECK + 1] - t[T_HIP + 1], dz = t[T_NECK + 2] - t[T_HIP + 2];
      var d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < 0.001) { dx = 0; dy = 1; dz = 0; } else { dx /= d; dy /= d; dz /= d; }
      for (var m = 0; m < 3; m++) {
        var dir = m === 0 ? dx : m === 1 ? dy : dz;
        J[J_NECK + m] = J[J_HIP + m] + dir * SPINE; J[J_SHOULDER + m] = J[J_HIP + m] + dir * SHOULDER;
      }
      dx = t[T_HEAD] - t[T_NECK]; dy = t[T_HEAD + 1] - t[T_NECK + 1]; dz = t[T_HEAD + 2] - t[T_NECK + 2];
      d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < 0.001) { up[0] = 0; up[1] = 1; up[2] = 0; } else { up[0] = dx / d; up[1] = dy / d; up[2] = dz / d; }
      for (m = 0; m < 3; m++) J[J_HEAD + m] = J[J_NECK + m] + up[m] * HEAD_R;
      limb(J_SHOULDER, T_HAND_L, T_ELBOW_L, ARM, J_ELBOW_L, J_HAND_L, -1);
      limb(J_SHOULDER, T_HAND_R, T_ELBOW_R, ARM, J_ELBOW_R, J_HAND_R, -1);
      limb(J_HIP, T_FOOT_L, T_KNEE_L, LEG, J_KNEE_L, J_FOOT_L, 1);
      limb(J_HIP, T_FOOT_R, T_KNEE_R, LEG, J_KNEE_R, J_FOOT_R, 1);
    }

    // ── His dots, worked out afresh every frame from the solved figure. ────
    var stick = new Float32Array(nStick * 3);
    var lookX = 0, lookY = 0, eyeX = 0, eyeY = 0, grin = 0, blink = 1;
    var o = 0;   // where the next dot is written in `stick` (and read in `loc`)
    function writeBones() {
      for (k = 0; k < P_RING; k++) {
        var A = BONES[k * 2], B = BONES[k * 2 + 1];
        var ax = J[A], ay = J[A + 1], az = J[A + 2], bx = J[B] - ax, by = J[B + 1] - ay, bz = J[B + 2] - az;
        var bl = Math.sqrt(bx * bx + by * by + bz * bz) || 1, ux = bx / bl, uy = by / bl, uz = bz / bl;
        // two directions square to the bone, for the roundness of the rod
        var px, py, pz;
        if (Math.abs(uz) < 0.9) { px = uy; py = -ux; pz = 0; } else { px = 0; py = uz; pz = -uy; }
        var pl = Math.sqrt(px * px + py * py + pz * pz) || 1; px /= pl; py /= pl; pz /= pl;
        var qx = uy * pz - uz * py, qy = uz * px - ux * pz, qz = ux * py - uy * px;
        for (i = part[k], n = part[k + 1]; i < n; i++, o += 3) {
          var la = loc[o], lb = loc[o + 1], lc = loc[o + 2];
          stick[o] = (ax + bx * la + px * lb + qx * lc) * U;
          stick[o + 1] = (ay + by * la + py * lb + qy * lc) * U;
          stick[o + 2] = (az + bz * la + pz * lb + qz * lc) * U;
        }
      }
    }
    // The head is a ball. A ball's outline is a circle from every side, so its
    // hoop is kept facing the viewer: r, v and w are screen-right, screen-up and
    // toward-the-viewer, as the turned scene sees them.
    function writeOutline() {
      var hx = J[J_HEAD], hy = J[J_HEAD + 1], hz = J[J_HEAD + 2];
      var cy = Math.cos(F.turnX), sy = Math.sin(F.turnX), cx = Math.cos(F.turnY), sx = Math.sin(F.turnY);
      var rx = cy, rz = sy, vx = sy * sx, vy = cx, vz = -cy * sx, wx = -sy * cx, wy = sx, wz = cy * cx;
      for (i = part[P_RING], n = part[P_RING + 1]; i < n; i++, o += 3) {
        stick[o] = (hx + rx * loc[o] + vx * loc[o + 1] + wx * loc[o + 2]) * U;
        stick[o + 1] = (hy + vy * loc[o + 1] + wy * loc[o + 2]) * U;
        stick[o + 2] = (hz + rz * loc[o] + vz * loc[o + 1] + wz * loc[o + 2]) * U;
      }
    }
    // The face lies on the front of that ball, so it slides across the head as
    // he turns. `face` is its own right, up and forward, three numbers each.
    var face = new Float32Array(9), mouth = new Float32Array(6);
    function aimFace() {
      var ux = up[0], uy = up[1], uz = up[2];
      var rx = 1 - ux * ux, ry = -ux * uy, rz = -ux * uz, rl = Math.sqrt(rx * rx + ry * ry + rz * rz);
      if (rl < 0.01) { rx = 0; ry = 1; rz = 0; rl = 1; }
      rx /= rl; ry /= rl; rz /= rl;
      var fx = ry * uz - rz * uy, fy = rz * ux - rx * uz, fz = rx * uy - ry * ux;
      // he looks a little further toward the pointer than his body turns
      var cl = Math.cos(lookX), sl = Math.sin(lookX), gx = fx * cl + rx * sl, gy = fy * cl + ry * sl, gz = fz * cl + rz * sl;
      var cn = Math.cos(lookY), sn = Math.sin(lookY);
      face[0] = rx * cl - fx * sl; face[1] = ry * cl - fy * sl; face[2] = rz * cl - fz * sl;
      face[3] = ux * cn - gx * sn; face[4] = uy * cn - gy * sn; face[5] = uz * cn - gz * sn;
      face[6] = gx * cn + ux * sn; face[7] = gy * cn + uy * sn; face[8] = gz * cn + uz * sn;
    }
    // One dot of the face, at (lx, ly) on it, raised `lift` off the ball.
    function put(lx, ly, lift) {
      var lz = Math.sqrt(Math.max(0, FACE_R * FACE_R - lx * lx - ly * ly)) + lift;
      stick[o] = (J[J_HEAD] + face[0] * lx + face[3] * ly + face[6] * lz) * U;
      stick[o + 1] = (J[J_HEAD + 1] + face[1] * lx + face[4] * ly + face[7] * lz) * U;
      stick[o + 2] = (J[J_HEAD + 2] + face[2] * lx + face[5] * ly + face[8] * lz) * U;
      o += 3;
    }
    function writeFace() {
      var f = cur.f, size = f[8], e, t, s;
      for (e = 0; e < 2; e++) {
        var open = f[6 + e] * blink, ex = (e ? EYE_R_X : EYE_L_X) + eyeX;
        for (i = part[P_EYE + e], n = part[P_EYE + e + 1]; i < n; i++) put(ex + loc[o] * EYE_R * size, EYE_Y + eyeY + loc[o + 1] * EYE_R * size * open, loc[o + 2]);
      }
      for (e = 0; e < 2; e++) {
        var br = e ? BROW_R : BROW_L;
        for (i = part[P_BROW + e], n = part[P_BROW + e + 1]; i < n; i++) {
          t = loc[o]; s = 1 - t;
          put(br[0] * s * s + 2 * br[2] * t * s + br[4] * t * t, br[1] * s * s + 2 * br[3] * t * s + br[5] * t * t + loc[o + 1] + f[9], loc[o + 2]);
        }
      }
      // the mouth: two lines from corner to corner; where they part, it is open.
      // When the pointer is close, whatever mouth he has widens into a grin.
      var m = mouth;
      for (e = 0; e < 6; e++) m[e] = f[e] + (F_GRIN[e] - f[e]) * grin;
      for (i = part[P_MOUTH], n = part[P_MOUTH + 1]; i < n; i++) {
        t = loc[o]; s = 1 - t;
        put(m[0] + (m[2] - m[0]) * t, m[1] * s * s + 2 * (loc[o + 2] ? m[5] : m[4]) * t * s + m[3] * t * t + loc[o + 1], 0);
      }
    }
    function writeDots() { o = 0; writeBones(); writeOutline(); aimFace(); writeFace(); }

    // ── The four actors: shadow, logo, stickman, prop (drawn in that order). ──
    function cloudOf(first, count, size) {
      var out = new Float32Array(count * 3);
      for (var m = 0; m < count * 3; m++) out[m] = F.scatter[first * 3 + m] * size;
      return F.buffer(out);
    }
    var shadowA = F.actor(0, nShadow), logoA = F.actor(nShadow, nLogo), stickA = F.actor(nShadow + nLogo, nStick), propA = F.actor(nShadow + nLogo + nStick, nProp);
    var patch = new Float32Array(nShadow * 3);
    for (i = 0; i < nShadow; i++) {
      var sr = Math.sqrt(rand()), sa = rand() * TAU;
      patch[i * 3] = Math.cos(sa) * sr * M_SHADOW_WIDE * U; patch[i * 3 + 2] = Math.sin(sa) * sr * M_SHADOW_DEEP * U;
    }
    shadowA.from = shadowA.to = F.buffer(patch); shadowA.dot = M_SHADOW_DOT; shadowA.edge = 0;
    shadowA.tintFrom = shadowA.tintTo = [INK, INK];
    var logoBuf = null;
    try { logoBuf = F.buffer(whole(logoShape(logo, nLogo)).data); } catch (err) { logoBuf = null; warn('the logo beside the stickman could not be drawn and is left out:', err); }
    var logoCloud = cloudOf(nShadow, nLogo, M_LOGO_CLOUD);
    logoA.from = logoCloud; logoA.to = logoBuf || logoCloud; logoA.dot = M_LOGO_DOT; logoA.halo = M_LOGO_HALO; logoA.edge = 0.25;
    var stickBuf = F.buffer(stick, true), snapBuf = F.buffer(stick, true), stickCloud = cloudOf(nShadow + nLogo, nStick, M_CLOUD);
    stickA.from = stickCloud; stickA.to = stickBuf; stickA.dot = M_STICK_DOT; stickA.edge = 0.25;
    stickA.tintFrom = stickA.tintTo = [INK, INK];
    var propBufs = { none: F.buffer(new Float32Array(nProp * 3)) }, propKind = 'none';
    function propBuf(kind) {
      if (!propBufs[kind]) {
        var made = null;
        try { made = kind === 'coin' ? whole(coin(DRAW.coinDollar, nProp)) : sample(DRAW[kind], nProp); } catch (err) { made = null; warn('the prop "' + kind + '" could not be drawn and is left out:', err); }
        propBufs[kind] = made ? F.buffer(made.data) : propBufs.none;
      }
      return propBufs[kind];
    }
    propA.from = propA.to = propBufs.none; propA.dot = M_PROP_DOT; propA.edge = 0.25;
    propA.tintFrom = propA.tintTo = PROP_TINT.none;
    propA.local = M_PROP_SIZE * U / (SHAPE_HALF * 2);

    // ── Layout: the canvas is bigger than the mascot's box, so bursts have
    //    room; the stickman stands where the drawn one stood. ───────────────
    var logoHome = [-123, 0, 0], logoWide = 107, headPxX = 0, headPxY = 0, baseScale = 1;
    function layout() {
      var r = cv.getBoundingClientRect(), s = svg.getBoundingClientRect(), l = flat.getBoundingClientRect();
      if (!r.width || !r.height || !s.width) return;
      var px = s.width / 200, perUnit = px * M_GROW;        // page pixels per drawing unit: drawn, and 3D
      var flatPx = (svg.clientWidth || s.width) / 200;      // the same, as the page lays it out
      var midX = s.left + s.width / 2 - r.left, feetY = s.top + M_FLOOR_Y * px - r.top;
      // Where the mascot sits against the page's right edge (a narrow window), or
      // against the canvas's own edge (old browsers, see the CSS), move the scene
      // left, so a prop in his outstretched hand is not cut off.
      var room = Math.min(document.documentElement.clientWidth, r.right) - (s.left + s.width / 2);
      var shift = parts.card ? 0 : Math.max(0, Math.min(M_SHIFT_MAX_PX, M_ROOM_PX - room));
      midX -= shift;
      // The page is told, so that the reach of his box (`.mascot::before` and
      // `::after` in index.html: where a click moves him on and nothing can be
      // selected) moves left with him.
      host.style.setProperty('--fx-shift', Math.round(shift) + 'px');
      var midY = feetY - (M_FLOOR_Y - M_MID_Y) * perUnit;
      F.lens(r.width, r.height, midX, midY);
      baseScale = perUnit / U * 2 * CAMERA_Z / (FOCAL * r.height);
      headPxX = midX; headPxY = midY - (M_MID_Y - M_HEAD_Y) * perUnit;
      // The logo keeps the place and size the flat picture has beside the drawing.
      logoHome[0] = (l.left + l.width / 2 - (s.left + s.width / 2)) / px;
      logoHome[1] = (s.top + M_MID_Y * px - (l.top + l.height / 2)) / px;
      logoWide = (flat.offsetWidth || 64) / flatPx;
    }

    // ── Pointer: the scene turns toward it, he looks at it, grins when it is
    //    close; a click moves him on to his next move. ──────────────────────
    var targetX = 0, targetY = 0, turnX = 0, turnY = 0, inside = false, near = false, swell = 0, aimX = 0, aimY = 0, poke = false;
    // A finger cannot hover: it counts only while it is down on him (then he
    // looks at it and grins, and the scene turns toward it as it moves), and
    // he goes back to his own sway when it lifts.
    var finger = null;
    function onMove(e) {
      if (!F.awake || (e.pointerType === 'touch' && e.pointerId !== finger)) return;
      var r = cv.getBoundingClientRect(), dx = e.clientX - r.left - headPxX, dy = e.clientY - r.top - headPxY;
      var d = Math.sqrt(dx * dx + dy * dy) || 1, shift = Math.min(M_EYE_SHIFT, d / 40);
      targetX = clamp1(dx / (window.innerWidth * 0.45)); targetY = clamp1(dy / (window.innerHeight * 0.6));
      aimX = dx / d * shift; aimY = -dy / d * shift;
      inside = true; near = d < M_NEAR_PX;
    }
    function away(e) { if (e && e.pointerType === 'touch' && finger !== null) return; inside = false; near = false; }
    function onPoke() { poke = true; }
    function onTouch(e) { if (e.pointerType !== 'touch' || finger !== null) return; finger = e.pointerId; onMove(e); }
    function onLift(e) { if (e.pointerId !== finger) return; finger = null; away(); }
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', away);
    host.addEventListener('pointerdown', onTouch, { passive: true });
    window.addEventListener('pointerup', onLift);
    window.addEventListener('pointercancel', onLift);
    host.addEventListener('click', onPoke);

    // ── The routine. ───────────────────────────────────────────────────────
    var bi = 0, bt = 0, beat = BEATS[0], moveT = 1, bursting = false, opening = true, resting = false, restT = 0;
    var logoAct = 'enter', logoT = 0, logoDur = M_ENTER_SECONDS;
    var propT = 1, propDur = 1, propGainFrom = 0, propGainTo = 0, propFresh = true;
    var propPos = [0, 0, 0], propFrom = [0, 0, 0], spot = [0, 0, 0], propSpin = 0;
    // `?fx-beat=7` runs the routine straight to that beat and holds it there: for testing.
    var holdBeat = parseInt((/[?&]fx-beat=(\d+)/.exec(query) || [])[1], 10), held = false;

    // Where a prop goes, in the scene's drawing units.
    function anchor(name, out) {
      var hand = name === 'handL' ? J_HAND_L : J_HAND_R, elbow = name === 'handL' ? J_ELBOW_L : J_ELBOW_R, m;
      if (name === 'handL' || name === 'handR') {
        // just beyond the hand, in line with the forearm
        var dx = J[hand] - J[elbow], dy = J[hand + 1] - J[elbow + 1], dz = J[hand + 2] - J[elbow + 2], d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
        var past = M_PROP_SIZE * 0.42 / d;
        out[0] = J[hand] + dx * past; out[1] = J[hand + 1] + dy * past; out[2] = J[hand + 2] + dz * past;
      } else if (name === 'aboveHead') {
        out[0] = J[J_HEAD]; out[1] = J[J_HEAD + 1] + HEAD_R + M_PROP_SIZE / 2 + 14; out[2] = J[J_HEAD + 2];
      } else if (name === 'chest') {
        out[0] = J[J_SHOULDER]; out[1] = J[J_SHOULDER + 1] - M_CHEST_DROP; out[2] = J[J_SHOULDER + 2] + M_CHEST_OUT;
      } else if (name === 'logo') {
        for (m = 0; m < 3; m++) out[m] = logoHome[m];
      } else {
        out[0] = name === 'floorL' ? -95 : 95; out[1] = M_MID_Y - M_FLOOR_Y + M_PROP_SIZE / 2; out[2] = 0;
      }
    }
    // Start beat `index`. `forced` makes it a burst (after a click).
    function begin(index, forced) {
      bi = index; bt = 0; beat = BEATS[bi]; resting = false;
      if (index === 1) cue = false;   // a card's dance asked for is now playing
      copyPose(cur, fromPose);
      bursting = !!(beat.burst || forced);
      moveT = bursting ? Math.max(beat.move, 0.9) : Math.max(beat.move, 0.01);
      if (bursting) {
        if (stickA.gain > 0) { F.write(snapBuf, stick); stickA.from = snapBuf; opening = false; }
        else { stickA.from = stickCloud; opening = true; }   // nothing on screen yet: build in from the cloud
        stickA.to = stickBuf; stickA.progress = 0;
        copyPose(POSES[beat.pose], cur);
      }
      // The logo does one thing at a time: an action asked for while another is
      // still running (or while the logo is still building in) is skipped.
      if (beat.logo !== 'none' && logoAct === 'none') {
        logoAct = beat.logo; logoT = 0;
        logoDur = Math.max(moveT, logoAct === 'burst' ? M_LOGO_BURST_SECONDS : M_LOGO_ACT_SECONDS);
      }
      propFresh = false;   // moveProp() starts the beat's prop change, this same frame if the stage is free
      for (var m = 0; m < 3; m++) propFrom[m] = propPos[m];
    }
    // Change the prop on stage to `kind`: the old one bursts into dots and the
    // new one builds in from them.
    function swapProp(kind, seconds) {
      propA.from = propBuf(propKind); propA.to = propBuf(kind);
      propA.tintFrom = PROP_TINT[propKind]; propA.tintTo = PROP_TINT[kind];
      // `none`, and a prop that could not be drawn on this device, are invisible
      propGainFrom = propA.from === propBufs.none ? 0 : M_PROP_GAIN; propGainTo = propA.to === propBufs.none ? 0 : M_PROP_GAIN;
      propT = 0; propDur = seconds; propA.progress = 0; propA.burst = M_PROP_BURST;
      propFresh = propKind === 'none'; propKind = kind;   // a prop that comes from nothing appears in its place; one that changes kind glides
    }
    function advance(dt) {
      // A click or a tap moves him straight on to his next move (founder, 28 Nov
      // 2026: "the clicks or touches moves through movements too please"); after
      // his last one, or while he rests, he starts the routine again. Not while
      // he is in pieces.
      if (poke) { poke = false; if (!bursting) begin(resting || bi + 1 >= BEATS.length ? 1 : bi + 1, false); }
      if (resting && cue) { cue = false; begin(1, false); }
      if (resting && !waiting) { restT += dt; if (restT > M_IDLE_SECONDS) begin(1, false); }
      bt += dt;
      var p = Math.min(1, bt / moveT);
      if (bursting) {
        stickA.progress = p; stickA.burst = M_BURST;
        stickA.gain = opening ? M_STICK_GAIN * Math.min(1, p * 1.3) : M_STICK_GAIN;
        if (p >= 1) { bursting = false; opening = false; stickA.from = stickBuf; stickA.progress = 0; stickA.burst = 0; }
      } else if (!resting) {
        blend(fromPose, POSES[beat.pose], (EASE[beat.ease] || EASE.inOut)(p), cur);
      }
      // A beat with `spin` turns him that many whole turns on the spot while he
      // moves into its pose (whole turns, so he ends facing front again).
      stickA.spin = beat.spin && !bursting && !resting && p < 1 ? TAU * beat.spin * (EASE[beat.ease] || EASE.inOut)(p) : 0;
      if (!resting && bt >= moveT + beat.hold && bi !== holdBeat) {   // (a beat held for testing is never left)
        if (waiting && bi === 0 && !cue) { resting = true; restT = 0; }   // on a card: hold the entrance pose until selected
        else if (bi + 1 < BEATS.length) begin(bi + 1, false);
        else { resting = true; restT = 0; }
      }
    }
    function moveLogo(time, dt) {
      if (!logoBuf) { logoA.gain = 0; return; }   // the mark could not be drawn on this device
      var grow = 1 + 0.035 * Math.sin(time * 2.4), lift = Math.sin(time * 1.3) * 3, p = 1;
      if (logoAct !== 'none') { logoT += dt; p = Math.min(1, logoT / logoDur); }
      logoA.spin = 0; logoA.gain = M_LOGO_GAIN;
      if (logoAct === 'enter') { logoA.progress = p; logoA.burst = M_LOGO_BURST * 0.6; logoA.gain = M_LOGO_GAIN * Math.min(1, p * 1.3); }
      else if (logoAct === 'burst') { logoA.progress = p; logoA.burst = M_LOGO_BURST; }
      else if (logoAct === 'pulse') grow *= 1 + 0.15 * Math.sin(Math.PI * p);
      else if (logoAct === 'hop') lift += 30 * 4 * p * (1 - p);
      else if (logoAct === 'spin') logoA.spin = TAU * EASE.inOut(p);
      if (p >= 1 && logoAct !== 'none') { logoAct = 'none'; logoA.from = logoA.to; logoA.progress = 0; logoA.burst = 0; }
      logoA.local = logoWide * U / (SHAPE_HALF * 2 * 0.94) * grow;
      logoA.offset[0] = logoHome[0] * U; logoA.offset[1] = (logoHome[1] + lift) * U; logoA.offset[2] = logoHome[2] * U;
    }
    function moveProp(time, dt) {
      // A change waits for the one before it to finish, so the dots never jump.
      if (propT >= propDur && beat.prop !== propKind) swapProp(beat.prop, Math.max(moveT - bt, M_PROP_SWAP_SECONDS));
      if (propT < propDur) {
        propT += dt;
        var p = Math.min(1, propT / propDur);
        propA.progress = p; propA.gain = propGainFrom + (propGainTo - propGainFrom) * Math.min(1, p * 1.3);
        if (p >= 1) { propA.from = propA.to; propA.tintFrom = propA.tintTo; propA.progress = 0; propA.burst = 0; }
      }
      // It glides from where it was to this beat's place, with an arc for a toss.
      var e = propFresh ? 1 : EASE.inOut(Math.min(1, bt / Math.max(moveT, 0.01)));
      anchor(beat.propAt, spot);
      for (var m = 0; m < 3; m++) propPos[m] = propFrom[m] + (spot[m] - propFrom[m]) * e;
      propPos[1] += (beat.propArc || 0) * 4 * e * (1 - e);
      propA.offset[0] = propPos[0] * U; propA.offset[1] = propPos[1] * U; propA.offset[2] = propPos[2] * U;
      // One running angle, so nothing ever turns by a jump: a coin keeps spinning;
      // anything else comes round to face the front and sways there.
      if (propKind === 'coin') propSpin += dt * M_COIN_SPIN;
      else {
        propSpin -= TAU * Math.round(propSpin / TAU);
        propSpin += (Math.sin(time * 1.6) * 0.35 - propSpin) * Math.min(1, dt * 6);
      }
      propA.spin = propSpin;
    }

    // The shadow stays under his hips, and thins out as his feet leave the floor.
    function moveShadow() {
      var floor = M_MID_Y - M_FLOOR_Y, lift = Math.max(0, Math.min(J[J_FOOT_L + 1], J[J_FOOT_R + 1]) - floor);
      var high = Math.min(1, lift / M_SHADOW_FADE);
      shadowA.offset[0] = J[J_HIP] * U; shadowA.offset[1] = (floor - LIMB_R) * U; shadowA.offset[2] = J[J_HIP + 2] * U;
      shadowA.local = 1 - 0.45 * high;
      shadowA.gain = M_SHADOW_GAIN * (1 - 0.7 * high) * Math.min(1, stickA.gain / M_STICK_GAIN);
    }

    var nextBlink = 2.5, clock = 0, cue = false;
    function tick(time, dt) {
      // `step` is the time since the last frame on the scene's clock: the routine
      // runs on it, so it keeps its pace when frames are slow. `dt` only smooths.
      var step = held ? 0 : Math.max(0, time - clock); clock = time;
      var ax = targetX, ay = targetY;
      if (!inside) { ax = Math.sin(time * 0.5) * 0.45; ay = Math.sin(time * 0.65 + 1) * 0.25; }
      var kk = Math.min(1, dt * 5);
      turnX += (ax - turnX) * kk; turnY += (ay - turnY) * kk;
      swell += ((near ? 1 : 0) - swell) * Math.min(1, dt * 4);
      grin += ((near ? 1 : 0) - grin) * Math.min(1, dt * 6);
      eyeX += ((inside ? aimX : 0) - eyeX) * kk; eyeY += ((inside ? aimY : 0) - eyeY) * kk;
      F.turnX = turnX * M_TURN_X; F.turnY = turnY * M_TURN_Y + M_TILT; F.scale = baseScale * (1 + 0.05 * swell);
      lookX = turnX * M_LOOK; lookY = -turnY * M_LOOK * M_LOOK_NOD;
      // a blink every few seconds
      if (time > nextBlink + 0.13) nextBlink = time + 2.2 + rand() * 3.2;
      blink = time > nextBlink ? 0.12 : 1;

      if (!held) advance(step);
      bendStep = bursting ? -1 : step;   // behind a burst he is rebuilt in his new pose at once
      solve(time);
      writeDots();
      F.write(stickBuf, stick);
      moveShadow();
      moveLogo(time, step);
      moveProp(time, step);
    }

    solve(0); anchor(beat.propAt, propPos);
    begin(0, true);   // his entrance is always a build-in from the cloud
    if (holdBeat >= 0 && holdBeat < BEATS.length) {
      for (var step = 0; step < 4000 && (bi < holdBeat || bt < moveT + beat.hold / 2); step++) tick(step * 0.03, 0.03);
      held = true;
    }
    F.start(tick, layout, function () {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', away);
      host.removeEventListener('pointerdown', onTouch);
      window.removeEventListener('pointerup', onLift);
      window.removeEventListener('pointercancel', onLift);
      host.removeEventListener('click', onPoke);
    });
    // The routine's props are drawn ahead of time, one at a time between frames,
    // so none has to be drawn in the very frame it first appears.
    var kinds = [], drawn = 0;
    for (i = 0; i < BEATS.length; i++) if (BEATS[i].prop !== 'none' && kinds.indexOf(BEATS[i].prop) < 0) kinds.push(BEATS[i].prop);
    function drawProps() {
      if (F.dead || drawn >= kinds.length) return;
      propBuf(kinds[drawn++]);
      window.setTimeout(drawProps, BUILD_GAP_MS);
    }
    window.setTimeout(drawProps, BUILD_GAP_MS);
    return { play: function () { cue = true; } };
  }

  // The routine. A pose is 11 target points and a face; bones keep their
  // length, so a hand or foot goes to its point only if it can reach. A beat
  // moves him into a pose (`move` seconds, then `hold`), says what the logo
  // does, and which prop is on stage and where. `burst` rebuilds him from a
  // cloud of dots instead of moving him. Beat 0 is his entrance; after the
  // last beat he rests, then it plays again from beat 1.
  //
  // The words it may use (routineFault() refuses any other, and the routine
  // then does not start):
  //   mouth  smile | grin | open | flat      eyes  open | wide | blink | wink
  //   brows  rest | up                       ease  inOut | out | in | back | bounce
  //   logo   none | pulse | spin | burst | hop
  //   prop   none | coin | star | trophy | chart | book | flame | shield
  //   propAt handL | handR | aboveHead | chest | logo | floorL | floorR
  // Three things the code does with them that are easy to miss:
  // - On beat 0 the logo always builds in by itself (1.5 s), so that beat's
  //   `logo` is skipped and the beat should last at least that long. Any logo
  //   action asked for while another is still running is skipped too.
  // - A burst takes at least 0.9 s, a logo action 0.7 s (its burst 1.1 s) and a
  //   prop change 0.6 s, however short the beat's `move` is.
  // - A prop that follows `none` appears at its own propAt; a prop that changes
  //   kind glides there from where the last one was. So a `none` beat between
  //   two props should keep the old propAt.
  // The reach of his box (where a click moves him on: two rules in index.html,
  // `.mascot.fx-on::before` and `::after`) was measured for the places THIS
  // routine uses. `floorL`, a low `handL`, a higher jump or a bigger prop
  // stand outside it (floorL where he is drawn left of his box, on a window
  // under about 1210 px wide), and between about 900 and 930 px wide a prop at
  // floorL is drawn over the end of the heading: measure the reach again
  // (`?fx=force&fx-beat=N` at 900, 1024 and 1280 px) before using them.
  // This routine was chosen on 28 Nov 2026 from three written for it: he waves,
  // pokes the logo, then shows the six ideas of the six cards below, in order.
  var MASCOT_DANCE = {
    poses: [
      { name: 'rest', hip: [100, 248, 0], neck: [100, 150, 0], head: [100, 92, 0], elbowL: [73, 194, 0], handL: [46, 216, 0], elbowR: [129, 147, 0], handR: [158, 122, 0], kneeL: [83, 283, 0], footL: [66, 318, 0], kneeR: [117, 283, 0], footR: [134, 318, 0], mouth: 'smile', eyes: 'open', brows: 'rest' },
      { name: 'waveOut', hip: [100, 248, 0], neck: [100, 150, 0], head: [103, 92, 0], elbowL: [73, 194, 0], handL: [46, 216, 0], elbowR: [140, 176, 0], handR: [165, 160, 26], kneeL: [83, 283, 0], footL: [66, 318, 0], kneeR: [117, 283, 0], footR: [134, 318, 0], mouth: 'grin', eyes: 'open', brows: 'rest' },
      { name: 'windup', hip: [106, 256, 0], neck: [123, 160, -12], head: [126, 102, -14], elbowL: [78, 204, -4], handL: [104, 206, 8], elbowR: [150, 200, -12], handR: [172, 212, -32], kneeL: [84, 289, 8], footL: [66, 318, 0], kneeR: [124, 290, 8], footR: [134, 318, 0], mouth: 'smile', eyes: 'open', brows: 'rest' },
      { name: 'reach', hip: [96, 251, 0], neck: [89, 153, 0], head: [100, 96, 0], elbowL: [56, 178, 4], handL: [20, 170, 0], elbowR: [124, 196, -12], handR: [150, 206, -30], kneeL: [78, 285, 6], footL: [66, 318, 0], kneeR: [116, 284, 4], footR: [134, 318, 0], mouth: 'smile', eyes: 'open', brows: 'up' },
      { name: 'whoa', hip: [112, 247, 0], neck: [126, 150, -8], head: [128, 92, -10], elbowL: [86, 174, 0], handL: [62, 144, 6], elbowR: [160, 170, 0], handR: [188, 142, 6], kneeL: [86, 262, 44], footL: [88, 292, 34], kneeR: [130, 284, 6], footR: [134, 318, 0], mouth: 'open', eyes: 'wide', brows: 'up' },
      { name: 'showCoin', hip: [100, 250, 6], neck: [100, 154, 26], head: [103, 97, 36], elbowL: [66, 206, 22], handL: [62, 198, 56], elbowR: [134, 206, 22], handR: [138, 198, 56], kneeL: [82, 285, 10], footL: [66, 318, 0], kneeR: [118, 285, 10], footR: [134, 318, 0], mouth: 'grin', eyes: 'open', brows: 'up' },
      { name: 'read', hip: [100, 249, 0], neck: [100, 152, 12], head: [102, 98, 34], elbowL: [68, 204, 6], handL: [62, 200, 44], elbowR: [132, 204, 6], handR: [138, 200, 44], kneeL: [83, 284, 2], footL: [66, 318, 0], kneeR: [117, 284, 2], footR: [134, 318, 0], mouth: 'flat', eyes: 'open', brows: 'rest' },
      { name: 'crouch', hip: [100, 280, 0], neck: [100, 184, 18], head: [100, 127, 14], elbowL: [74, 228, -10], handL: [58, 246, -30], elbowR: [126, 228, -10], handR: [142, 246, -30], kneeL: [62, 286, 20], footL: [66, 318, 0], kneeR: [138, 286, 20], footR: [134, 318, 0], mouth: 'open', eyes: 'wide', brows: 'up' },
      { name: 'jump', hip: [100, 200, 0], neck: [100, 102, 0], head: [100, 44, 0], elbowL: [66, 106, 4], handL: [38, 88, 14], elbowR: [134, 106, 4], handR: [162, 88, 14], kneeL: [80, 232, -6], footL: [64, 260, -30], kneeR: [120, 232, -6], footR: [136, 260, -30], mouth: 'grin', eyes: 'wide', brows: 'up' },
      { name: 'levelUp', hip: [100, 250, 0], neck: [100, 152, -6], head: [100, 95, -14], elbowL: [62, 182, -4], handL: [44, 150, 12], elbowR: [138, 182, -4], handR: [156, 150, 12], kneeL: [82, 284, 4], footL: [66, 318, 0], kneeR: [118, 284, 4], footR: [134, 318, 0], mouth: 'grin', eyes: 'open', brows: 'up' },
      { name: 'rise', hip: [102, 250, 0], neck: [106, 152, 0], head: [112, 94, 0], elbowL: [80, 196, -14], handL: [54, 210, -30], elbowR: [140, 164, 4], handR: [171, 148, 13], kneeL: [84, 284, 4], footL: [66, 318, 0], kneeR: [120, 284, 4], footR: [134, 318, 0], mouth: 'grin', eyes: 'wide', brows: 'up' },
      { name: 'champ', hip: [100, 250, 0], neck: [100, 152, -8], head: [96, 95, -18], elbowL: [66, 160, 0], handL: [35, 143, 9], elbowR: [134, 160, 0], handR: [165, 143, 9], kneeL: [80, 284, 6], footL: [66, 318, 0], kneeR: [120, 284, 6], footR: [134, 318, 0], mouth: 'grin', eyes: 'blink', brows: 'up' },
      { name: 'guard', hip: [100, 256, 6], neck: [100, 160, 26], head: [100, 103, 36], elbowL: [70, 206, 34], handL: [90, 198, 66], elbowR: [134, 196, 6], handR: [156, 208, -17], kneeL: [76, 288, 18], footL: [66, 318, 0], kneeR: [124, 288, 18], footR: [134, 318, 0], mouth: 'smile', eyes: 'open', brows: 'rest' },
      { name: 'glideA', hip: [114, 250, 0], neck: [112, 152, -4], head: [110, 95, -6], elbowL: [88, 196, 8], handL: [72, 222, 18], elbowR: [138, 198, 8], handR: [152, 224, 18], kneeL: [98, 284, 0], footL: [84, 318, 0], kneeR: [134, 276, 22], footR: [142, 311, 6], mouth: 'smile', eyes: 'open', brows: 'up' },
      { name: 'glideB', hip: [128, 250, 0], neck: [126, 152, -4], head: [124, 95, -6], elbowL: [102, 196, 8], handL: [86, 222, 18], elbowR: [152, 198, 8], handR: [166, 224, 18], kneeL: [112, 276, 22], footL: [106, 311, 6], kneeR: [146, 284, 0], footR: [162, 318, 0], mouth: 'smile', eyes: 'open', brows: 'up' },
      { name: 'glideC', hip: [142, 250, 0], neck: [140, 152, -4], head: [138, 95, -6], elbowL: [116, 196, 8], handL: [100, 222, 18], elbowR: [166, 198, 8], handR: [180, 224, 18], kneeL: [126, 284, 0], footL: [112, 318, 0], kneeR: [162, 276, 22], footR: [170, 311, 6], mouth: 'smile', eyes: 'open', brows: 'up' },
      { name: 'toeStand', hip: [100, 248, 0], neck: [98, 150, 0], head: [95, 92, -6], elbowL: [74, 212, -12], handL: [90, 238, 4], elbowR: [132, 128, 0], handR: [150, 96, 6], kneeL: [86, 283, 0], footL: [70, 318, 0], kneeR: [116, 280, 12], footR: [114, 306, 10], mouth: 'open', eyes: 'wide', brows: 'up' },
      { name: 'wink', hip: [95, 251, 0], neck: [103, 153, -6], head: [110, 96, -8], elbowL: [58, 200, -10], handL: [80, 230, 4], elbowR: [136, 204, -10], handR: [110, 232, 4], kneeL: [79, 284, 4], footL: [66, 318, 0], kneeR: [116, 284, 2], footR: [134, 318, 0], mouth: 'grin', eyes: 'wink', brows: 'up' }
    ],
    beats: [
      // 0. He and the logo build in together from a cloud of dots.
      { pose: 'rest', move: 1.2, hold: 0.5, ease: 'out', burst: true, logo: 'burst', prop: 'none', propAt: 'logo', propArc: 0 },
      // 1. Wave: his arm swings out toward you, with a grin.
      { pose: 'waveOut', move: 0.3, hold: 0, ease: 'inOut', burst: false, logo: 'none', prop: 'none', propAt: 'logo', propArc: 0 },
      // 2. Arm swings back up.
      { pose: 'rest', move: 0.3, hold: 0, ease: 'inOut', burst: false, logo: 'none', prop: 'none', propAt: 'logo', propArc: 0 },
      // 3. Second swing out.
      { pose: 'waveOut', move: 0.3, hold: 0, ease: 'inOut', burst: false, logo: 'none', prop: 'none', propAt: 'logo', propArc: 0 },
      // 4. Back up and holds; the logo pulses hello back.
      { pose: 'rest', move: 0.3, hold: 0.6, ease: 'out', burst: false, logo: 'pulse', prop: 'none', propAt: 'logo', propArc: 0 },
      // 5. Wind-up: dips and leans away from the logo, left arm cocked.
      { pose: 'windup', move: 0.35, hold: 0.15, ease: 'inOut', burst: false, logo: 'none', prop: 'none', propAt: 'logo', propArc: 0 },
      // 6. Quick cheeky poke at the edge of the logo.
      { pose: 'reach', move: 0.25, hold: 0.25, ease: 'back', burst: false, logo: 'none', prop: 'none', propAt: 'logo', propArc: 0 },
      // 7. The logo spins; he leaps back, hands up, one knee up, eyes wide, and freezes.
      { pose: 'whoa', move: 0.24, hold: 1, ease: 'back', burst: false, logo: 'spin', prop: 'none', propAt: 'logo', propArc: 0 },
      // 8. The logo pulses and a gold coin forms on it; he reaches in, gently this time.
      { pose: 'reach', move: 0.5, hold: 0.3, ease: 'inOut', burst: false, logo: 'pulse', prop: 'coin', propAt: 'logo', propArc: 0 },
      // 9. He lifts the coin off and holds it out to you in both hands: virtual cash.
      { pose: 'showCoin', move: 0.5, hold: 1.1, ease: 'back', burst: false, logo: 'none', prop: 'coin', propAt: 'chest', propArc: 0 },
      // 10. The coin turns into a book in his hands; head bowed, he reads.
      { pose: 'read', move: 0.5, hold: 1, ease: 'inOut', burst: false, logo: 'none', prop: 'book', propAt: 'chest', propArc: 0 },
      // 11. Aha! Eyes wide, he drops into a deep squat; the book pops into dots.
      { pose: 'crouch', move: 0.3, hold: 0.15, ease: 'inOut', burst: false, logo: 'none', prop: 'none', propAt: 'chest', propArc: 0 },
      // 12. Springs up, arms and legs flung wide; the logo hops with him.
      { pose: 'jump', move: 0.26, hold: 0.14, ease: 'out', burst: false, logo: 'hop', prop: 'none', propAt: 'chest', propArc: 0 },
      // 13. Lands back in the squat.
      { pose: 'crouch', move: 0.2, hold: 0.22, ease: 'in', burst: false, logo: 'none', prop: 'none', propAt: 'chest', propArc: 0 },
      // 14. Pops up flexing both arms; the dots re-form as a star above his head: level up.
      { pose: 'levelUp', move: 0.35, hold: 1.2, ease: 'back', burst: false, logo: 'none', prop: 'star', propAt: 'aboveHead', propArc: 0 },
      // 15. Wind-up to his right; the star pops into dots.
      { pose: 'windup', move: 0.35, hold: 0.15, ease: 'inOut', burst: false, logo: 'none', prop: 'none', propAt: 'aboveHead', propArc: 0 },
      // 16. His arm sweeps up and a rising chart grows out of the floor beside him.
      { pose: 'rise', move: 0.5, hold: 1.1, ease: 'back', burst: false, logo: 'none', prop: 'chart', propAt: 'floorR', propArc: 0 },
      // 17. He, the chart and the logo all burst into dots and rebuild: arms flung wide, a trophy held up.
      { pose: 'champ', move: 1.1, hold: 1.4, ease: 'out', burst: true, logo: 'burst', prop: 'trophy', propAt: 'handR', propArc: 0 },
      // 18. Wind-up again; the trophy pops into dots.
      { pose: 'windup', move: 0.35, hold: 0.15, ease: 'inOut', burst: false, logo: 'none', prop: 'none', propAt: 'handR', propArc: 0 },
      // 19. He pushes a shield out toward you: no real money, ever.
      { pose: 'guard', move: 0.35, hold: 1.2, ease: 'back', burst: false, logo: 'none', prop: 'shield', propAt: 'chest', propArc: 0 },
      // 20. He slides the shield onto the logo like a badge.
      { pose: 'reach', move: 0.55, hold: 0.3, ease: 'inOut', burst: false, logo: 'none', prop: 'shield', propAt: 'logo', propArc: 0 },
      // 21. The logo spins and swallows the shield; hands on hips, he winks.
      { pose: 'wink', move: 0.45, hold: 1.4, ease: 'back', burst: false, logo: 'spin', prop: 'none', propAt: 'logo', propArc: 0 },
      // 22. The moonwalk: he glides off to the side, one heel up, then the other...
      { pose: 'glideA', move: 0.4, hold: 0.05, ease: 'inOut', burst: false, logo: 'none', prop: 'none', propAt: 'logo', propArc: 0 },
      // 23. ...the other heel up, still gliding...
      { pose: 'glideB', move: 0.4, hold: 0.05, ease: 'inOut', burst: false, logo: 'none', prop: 'none', propAt: 'logo', propArc: 0 },
      // 24. ...and one more.
      { pose: 'glideC', move: 0.4, hold: 0.1, ease: 'inOut', burst: false, logo: 'none', prop: 'none', propAt: 'logo', propArc: 0 },
      // 25. A full spin as he slides back to the middle.
      { pose: 'rest', move: 0.9, hold: 0, ease: 'out', burst: false, logo: 'none', prop: 'none', propAt: 'logo', propArc: 0, spin: 1 },
      // 26. Up on his toes, one hand pointing high, mouth open: freeze.
      { pose: 'toeStand', move: 0.22, hold: 0.9, ease: 'back', burst: false, logo: 'pulse', prop: 'none', propAt: 'logo', propArc: 0 },
      // 27. The logo pulses, good as new; he eases back to his wave pose.
      { pose: 'rest', move: 0.6, hold: 0.4, ease: 'inOut', burst: false, logo: 'pulse', prop: 'none', propAt: 'logo', propArc: 0 }
    ]
  };

  // ── The six cards' dancers (founder, 28 Nov 2026: "On the webiste in the
  //    cards we need the same type of stick man too if the card is selected",
  //    "each one moves differently and has a famous dance. Floss, Moonwalk,
  //    Jump and spits...etc etc", "soo cool wow factors and reacting to the
  //    mobile and mouse"). Each card's picture becomes a dot stickman holding
  //    the card's prop; when the card is selected he does his own dance once.
  //    His poses are built from the band stickman's, so they share one look. ──
  var CARD_REST = { hip: [100, 248, 0], neck: [100, 150, 0], head: [100, 92, 0], elbowL: [73, 194, 0], handL: [46, 216, 0], elbowR: [127, 194, 0], handR: [154, 216, 0], kneeL: [83, 283, 0], footL: [66, 318, 0], kneeR: [117, 283, 0], footR: [134, 318, 0], mouth: 'smile', eyes: 'open', brows: 'rest' };
  function bandPose(name) {
    for (var i = 0; i < MASCOT_DANCE.poses.length; i++) if (MASCOT_DANCE.poses[i].name === name) return MASCOT_DANCE.poses[i];
    return CARD_REST;
  }
  // A pose: `base` (a pose, or the name of one of the band stickman's) with `changes`.
  function cardPose(name, base, changes) {
    var p = { name: name }, from = typeof base === 'string' ? bandPose(base) : base, k;
    for (k in from) if (k !== 'name') p[k] = from[k];
    for (k in changes) p[k] = changes[k];
    return p;
  }
  // The same pose seen in a mirror: left and right swap.
  function mirrorPose(name, p) {
    var q = { name: name }, k, v, side;
    for (k in p) {
      if (k === 'name') continue;
      v = p[k]; side = k.charAt(k.length - 1);
      if (v && v.length === 3) q[side === 'L' ? k.slice(0, -1) + 'R' : side === 'R' ? k.slice(0, -1) + 'L' : k] = [200 - v[0], v[1], v[2]];
      else q[k] = v;
    }
    return q;
  }
  function cardBeat(pose, move, hold, ease, prop, propAt, more) {
    var b = { pose: pose, move: move, hold: hold, ease: ease, burst: false, logo: 'none', prop: prop, propAt: propAt, propArc: 0 }, k;
    for (k in more) b[k] = more[k];
    return b;
  }
  // Beat 0 is his entrance: built in from a cloud of dots, holding his prop.
  // It lasts 1.6 s, as the logo takes 1.5 s to build in beside him.
  function cardEntrance(pose, prop, propAt) { return cardBeat(pose, 1.6, 0.3, 'out', prop, propAt, { burst: true }); }
  // `count` beats that swap between two poses.
  function swaps(a, b, count, move, hold, ease, prop, propAt) {
    var out = [];
    for (var i = 0; i < count; i++) out.push(cardBeat(i % 2 ? b : a, move, hold, ease, prop, propAt));
    return out;
  }

  var REST_POSE = cardPose('rest', CARD_REST, {});
  var FLOSS_A = cardPose('flossA', CARD_REST, { hip: [90, 248, 0], neck: [96, 150, 0], head: [96, 92, 0], elbowL: [104, 200, 22], handL: [118, 232, 26], elbowR: [146, 196, -18], handR: [164, 226, -20], kneeL: [76, 283, 4], kneeR: [112, 283, 4], mouth: 'grin' });
  var ROBOT_A = cardPose('robotA', CARD_REST, { elbowL: [62, 172, 0], handL: [62, 136, 0], elbowR: [138, 172, 0], handR: [138, 208, 0], mouth: 'flat', eyes: 'wide' });
  var ROBOT_C = cardPose('robotC', CARD_REST, { head: [110, 93, -8], elbowL: [68, 182, 0], handL: [68, 182, 37], elbowR: [132, 182, 0], handR: [132, 182, 37], mouth: 'flat', eyes: 'wide', brows: 'up' });
  var DAB_R = cardPose('dabR', CARD_REST, { hip: [100, 250, 0], neck: [104, 152, 0], head: [116, 104, 18], elbowR: [128, 146, 0], handR: [154, 120, 0], elbowL: [122, 144, 28], handL: [146, 154, 30], kneeL: [82, 285, 6], kneeR: [118, 285, 6], mouth: 'grin', eyes: 'blink' });
  // The victory groove (founder, 28 Nov 2026: "Add a fortnight dance too please"):
  // the well-known victory dance, both arms swinging across his chest while he
  // bounces from foot to foot. No game's name is used on the page.
  var GROOVE_A = cardPose('grooveA', CARD_REST, { hip: [96, 256, 0], neck: [98, 158, 6], head: [96, 100, 8], elbowL: [70, 196, 20], handL: [62, 180, 44], elbowR: [120, 200, 24], handR: [88, 186, 46], kneeL: [80, 288, 14], kneeR: [118, 280, 8], footR: [134, 308, 8], mouth: 'grin' });
  var RUN_A = cardPose('runA', CARD_REST, { hip: [100, 244, 0], neck: [100, 146, 0], head: [100, 88, 0], kneeL: [96, 226, 30], footL: [96, 256, 14], kneeR: [110, 282, -8], footR: [116, 316, -26], elbowL: [82, 190, -16], handL: [90, 172, -30], elbowR: [118, 190, 16], handR: [112, 170, 34], mouth: 'grin' });
  var RUN_MID = cardPose('runMid', CARD_REST, { hip: [100, 256, 0], neck: [100, 158, 0], head: [100, 100, 0], kneeL: [86, 286, 10], footL: [80, 318, 0], kneeR: [114, 286, 10], footR: [120, 318, 0], elbowL: [78, 204, 0], handL: [70, 224, 10], elbowR: [122, 204, 0], handR: [130, 224, 10], mouth: 'grin' });

  var CARD_DANCES = [
    // 1. Virtual cash: the moonwalk and a spin, and a coin flipped and caught.
    { name: 'moonwalk',
      poses: [REST_POSE, bandPose('glideA'), bandPose('glideB'), bandPose('glideC'), bandPose('toeStand'),
        cardPose('holdCoin', CARD_REST, { elbowR: [130, 192, 14], handR: [150, 178, 34], mouth: 'grin' }),
        cardPose('flipCatch', CARD_REST, { head: [102, 92, -10], elbowR: [128, 170, 10], handR: [140, 140, 22], eyes: 'wide', brows: 'up', mouth: 'open' })],
      beats: [cardEntrance('holdCoin', 'coin', 'handR'),
        cardBeat('glideA', 0.4, 0.05, 'inOut', 'coin', 'handR'),
        cardBeat('glideB', 0.4, 0.05, 'inOut', 'coin', 'handR'),
        cardBeat('glideC', 0.4, 0.1, 'inOut', 'coin', 'handR'),
        cardBeat('rest', 0.9, 0, 'out', 'coin', 'handR', { spin: 1 }),
        cardBeat('toeStand', 0.22, 0.6, 'back', 'coin', 'handR', { logo: 'pulse' }),
        cardBeat('flipCatch', 0.35, 0.5, 'out', 'coin', 'aboveHead', { propArc: 40 }),
        cardBeat('holdCoin', 0.45, 0.4, 'back', 'coin', 'handR', { logo: 'spin' })] },
    // 2. Lessons: the robot, then back to his book.
    { name: 'robot',
      poses: [REST_POSE, bandPose('read'), ROBOT_A, mirrorPose('robotB', ROBOT_A), ROBOT_C, mirrorPose('robotD', ROBOT_C),
        cardPose('robotDip', ROBOT_A, { hip: [100, 262, 0], neck: [100, 164, 0], head: [100, 106, 0], elbowL: [62, 186, 0], handL: [62, 150, 0], elbowR: [138, 186, 0], handR: [138, 222, 0], kneeL: [80, 290, 14], kneeR: [120, 290, 14] })],
      beats: [cardEntrance('read', 'book', 'chest'),
        cardBeat('robotA', 0.12, 0.3, 'out', 'book', 'floorR'),
        cardBeat('robotB', 0.12, 0.3, 'out', 'book', 'floorR'),
        cardBeat('robotC', 0.12, 0.3, 'out', 'book', 'floorR'),
        cardBeat('robotD', 0.12, 0.3, 'out', 'book', 'floorR'),
        cardBeat('robotDip', 0.15, 0.25, 'out', 'book', 'floorR'),
        cardBeat('robotA', 0.12, 0.25, 'out', 'book', 'floorR'),
        cardBeat('read', 0.5, 0.6, 'back', 'book', 'chest', { logo: 'pulse' })] },
    // 3. Level up: a jump into the splits, and the splits on the floor.
    { name: 'splits',
      poses: [REST_POSE, bandPose('levelUp'), bandPose('crouch'),
        cardPose('splitJump', CARD_REST, { hip: [100, 196, 0], neck: [100, 98, 0], head: [100, 40, 0], elbowL: [70, 112, 0], handL: [44, 86, 0], elbowR: [130, 112, 0], handR: [156, 86, 0], kneeL: [64, 206, 0], footL: [28, 214, 0], kneeR: [136, 206, 0], footR: [172, 214, 0], mouth: 'grin', eyes: 'wide', brows: 'up' }),
        cardPose('splitsFloor', CARD_REST, { hip: [100, 302, 0], neck: [100, 204, 0], head: [100, 146, 0], elbowL: [70, 186, 0], handL: [46, 156, 0], elbowR: [130, 186, 0], handR: [154, 156, 0], kneeL: [62, 308, 0], footL: [24, 318, 0], kneeR: [138, 308, 0], footR: [176, 318, 0], mouth: 'grin', eyes: 'blink', brows: 'up' })],
      beats: [cardEntrance('levelUp', 'star', 'aboveHead'),
        cardBeat('crouch', 0.25, 0.1, 'inOut', 'star', 'handR'),
        cardBeat('splitJump', 0.24, 0.12, 'out', 'star', 'handR', { logo: 'hop' }),
        cardBeat('splitsFloor', 0.3, 0.9, 'back', 'star', 'handR', { logo: 'pulse' }),
        cardBeat('crouch', 0.35, 0.1, 'inOut', 'star', 'handR'),
        cardBeat('levelUp', 0.35, 0.8, 'back', 'star', 'aboveHead', { logo: 'spin' })] },
    // 4. Leaderboard: the floss, his chart beside him.
    { name: 'floss',
      poses: [REST_POSE, bandPose('rise'), FLOSS_A, mirrorPose('flossB', FLOSS_A)],
      beats: [cardEntrance('rise', 'chart', 'floorR')].concat(
        swaps('flossA', 'flossB', 8, 0.2, 0.02, 'inOut', 'chart', 'floorR'),
        [cardBeat('rise', 0.4, 0.8, 'back', 'chart', 'floorR', { logo: 'pulse' })]) },
    // 5. Competition: a spin into a dab, both ways, then the victory groove, trophy in hand.
    { name: 'dab',
      poses: [REST_POSE, bandPose('champ'), bandPose('windup'), DAB_R, mirrorPose('dabL', DAB_R), GROOVE_A, mirrorPose('grooveB', GROOVE_A)],
      beats: [cardEntrance('champ', 'trophy', 'handR'),
        cardBeat('windup', 0.35, 0.1, 'inOut', 'trophy', 'handR'),
        cardBeat('rest', 0.8, 0, 'out', 'trophy', 'handR', { spin: 1 }),
        cardBeat('dabR', 0.14, 0.9, 'back', 'trophy', 'handR', { logo: 'pulse' }),
        cardBeat('rest', 0.5, 0, 'inOut', 'trophy', 'handR', { spin: -1 }),
        cardBeat('dabL', 0.14, 0.9, 'back', 'trophy', 'handR')].concat(
        swaps('grooveA', 'grooveB', 8, 0.22, 0.02, 'inOut', 'trophy', 'floorR'),
        [cardBeat('champ', 0.45, 0.8, 'back', 'trophy', 'handR', { logo: 'spin' })]) },
    // 6. Safe: the running man, then on guard with his shield.
    { name: 'running man',
      poses: [REST_POSE, bandPose('guard'), RUN_A, mirrorPose('runB', RUN_A), RUN_MID],
      beats: [cardEntrance('guard', 'shield', 'chest')].concat(
        swaps('runA', 'runMid', 2, 0.16, 0.02, 'out', 'shield', 'floorL'),
        swaps('runB', 'runMid', 2, 0.16, 0.02, 'out', 'shield', 'floorL'),
        swaps('runA', 'runMid', 2, 0.16, 0.02, 'out', 'shield', 'floorL'),
        swaps('runB', 'runMid', 2, 0.16, 0.02, 'out', 'shield', 'floorL'),
        [cardBeat('guard', 0.4, 0.8, 'back', 'shield', 'chest', { logo: 'pulse' })]) }
  ];
  var CARD_START_GAP_MS = 180;   // the six cards start one after another, not in one frame
  var CARD_MIDDLE = '-40% 0px -40% 0px';   // on a touch screen: a card this near the window's middle is selected

  // Each card's picture gets a stage: the picture stays underneath (shown again
  // if the animation stops), with a canvas, the box he stands in and the place
  // of his small logo laid over it. He dances when his card is selected: the
  // mouse comes onto it, a finger taps it, or (on a touch screen) it is
  // scrolled to the middle of the window.
  function startCards(logo) {
    var cards = document.querySelectorAll ? document.querySelectorAll('.sticker-card') : [];
    if (!cards.length || !window.IntersectionObserver) return;
    var stages = [], i;
    for (i = 0; i < cards.length && i < CARD_DANCES.length; i++) {
      var img = cards[i].querySelector('.sticker-img');
      if (!img) continue;
      var stage = document.createElement('div'); stage.className = 'card-stage';
      img.parentNode.insertBefore(stage, img); stage.appendChild(img);
      var cv = document.createElement('canvas'); cv.className = 'card-fx'; cv.setAttribute('aria-hidden', 'true');
      var box = document.createElement('span'); box.className = 'card-box';
      var flat = document.createElement('span'); flat.className = 'card-logo';
      stage.appendChild(cv); stage.appendChild(box); stage.appendChild(flat);
      stages.push({ card: cards[i], stage: stage, cv: cv, box: box, flat: flat, dance: CARD_DANCES[i] });
    }
    var touch = !!(window.matchMedia && window.matchMedia('(hover: none)').matches), started = false;
    function startOne(s) {
      var run = null;
      try { run = mascot(logo, s.stage, s.cv, s.dance, { svg: s.box, flat: s.flat, card: true, waiting: true }); }
      catch (err) { warn('a card\'s stickman animation is off:', err); }
      if (!run) return;
      s.card.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') run.play(); });
      s.card.addEventListener('pointerdown', function (e) { if (e.pointerType === 'touch') run.play(); }, { passive: true });
      if (touch) {
        var middle = new window.IntersectionObserver(function (entries) {
          if (entries[entries.length - 1].isIntersecting) run.play();
        }, { rootMargin: CARD_MIDDLE });
        middle.observe(s.stage);
      }
    }
    var near = new window.IntersectionObserver(function (entries) {
      for (var k = 0; k < entries.length; k++) if (entries[k].isIntersecting && !started) {
        started = true; near.disconnect();
        stages.forEach(function (s, n) { window.setTimeout(function () { startOne(s); }, n * CARD_START_GAP_MS); });
      }
    }, { rootMargin: '300px' });
    stages.forEach(function (s) { near.observe(s.stage); });
  }

  // Start only after the page itself has finished loading, so the words and
  // the Play button are never held up by the pictures. Then wait (briefly) for
  // the page's fonts and the logo file, which some of the shapes are drawn from.
  function prepare() {
    var logo = new window.Image(), started = false;
    function run(name, start) {
      try { start(); } catch (err) { warn('the ' + name + ' animation is off:', err); }
    }
    function go() {
      if (started) return; started = true;
      if (!canReadCanvas()) { warn('the 3D animations are off: this browser does not let a page read its own canvas'); doneWaiting(); return; }
      var top = false;
      run('top', function () { top = hero(logo); });
      if (!top) doneWaiting();   // no top animation on this device: the card is the picture
      // The mascot is started only when its band is about to scroll into view.
      var host = document.querySelector('.mascot'), cv = document.getElementById('mascotFx');
      if (!host || !cv || !window.IntersectionObserver) { run('card', function () { startCards(logo); }); return; }
      var wait = new window.IntersectionObserver(function (entries) {
        if (!entries[entries.length - 1].isIntersecting) return;
        wait.disconnect();
        run('mascot', function () { mascot(logo, host, cv, MASCOT_DANCE); });
      }, { rootMargin: '300px' });
      wait.observe(host);
      run('card', function () { startCards(logo); });
    }
    var fonts = document.fonts && document.fonts.ready;
    function loadLogo() { logo.onload = go; logo.onerror = go; logo.src = './logo.png'; }
    if (fonts && fonts.then) fonts.then(loadLogo, loadLogo); else loadLogo();
    window.setTimeout(go, READY_TIMEOUT_MS);
  }
  if (document.readyState === 'complete') prepare(); else window.addEventListener('load', prepare);
})();
