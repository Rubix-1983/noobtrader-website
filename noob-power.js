/* ─── NOOB POWER, the dial you can turn ────────────────────────────────────
 *
 * Founder, 19 August: an icon on the page that "generates multiplier
 * excitement and hook, interactive with a mouse to show how Noob Power works
 * when a mouse and click occurs on it", kept as its own code section.
 *
 * WHAT IT DOES. Click the ring and a friend joins it. The arc sweeps, a coin
 * flies off, and the multiplier steps up the REAL ladder. Hovering primes it
 * (the ring lifts and the next rung is named) without changing anything, so a
 * mouse gets the hook and a thumb still gets the whole thing on tap.
 *
 * THE LADDER IS THE LIVE ONE, NOT A NICE-LOOKING CURVE. Copied from
 * noob_power_tiers on 19 August 2026 (version 1), which _noob_power_for reads:
 *
 *     0 -> 1.00   1 -> 1.05   3 -> 1.10   5 -> 1.20    10 -> 1.30
 *    25 -> 1.45  50 -> 1.60  100 -> 1.90  200 -> 2.20  350 -> 2.60
 *   500 -> 3.00
 *
 * That shape is the honest part and the reason this is worth building. The
 * jump from nothing to one friend is instant, and then it slows down hard: 3x
 * needs FIVE HUNDRED friends who are all still playing. A widget that let the
 * dial race to 3x in four clicks would be teaching the opposite of what the
 * product does, on a page aimed at 13 to 18 year olds. So the click adds one
 * friend, the sentence underneath always names the real distance to the next
 * rung, and the top rung is reachable only by holding the button down for a
 * while, which is itself the lesson.
 *
 * If the tiers ever change in the database, this file is the one place to
 * change them, and the number in index.html's NOOB Power card ("up to 3 times
 * faster at the top rung") has to move with it.
 *
 * NO NETWORK. This is a toy on a marketing page, not a reading of anybody's
 * account. It invents nothing about real players and shows no live figures;
 * the live figures are the ticker above it, which has its own source.
 */
(function () {
  "use strict";

  var mount = document.getElementById("noobPower");
  if (!mount) return;

  // [friends needed, multiplier] exactly as noob_power_tiers holds them.
  var TIERS = [
    [0, 1.00], [1, 1.05], [3, 1.10], [5, 1.20], [10, 1.30], [25, 1.45],
    [50, 1.60], [100, 1.90], [200, 2.20], [350, 2.60], [500, 3.00]
  ];
  var MAX_FRIENDS = TIERS[TIERS.length - 1][0];
  var CIRC = 2 * Math.PI * 52;          // r=52 in the SVG below
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var friends = 0;
  var held = null;

  function multiplierFor(n) {
    var m = 1;
    for (var i = 0; i < TIERS.length; i++) if (n >= TIERS[i][0]) m = TIERS[i][1];
    return m;
  }

  function nextTier(n) {
    for (var i = 0; i < TIERS.length; i++) if (TIERS[i][0] > n) return TIERS[i];
    return null;
  }

  mount.innerHTML =
    '<button class="np-dial" id="npDial" type="button"' +
    ' aria-describedby="npReadout">' +
      '<svg viewBox="0 0 120 120" aria-hidden="true">' +
        '<defs>' +
          '<linearGradient id="npGrad" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0%" stop-color="#20C4FB"/>' +
            '<stop offset="55%" stop-color="#1464FD"/>' +
            '<stop offset="100%" stop-color="#8B4EF9"/>' +
          '</linearGradient>' +
        '</defs>' +
        '<circle class="np-track" cx="60" cy="60" r="52" fill="none" stroke-width="9"/>' +
        '<circle class="np-arc" id="npArc" cx="60" cy="60" r="52" fill="none" stroke-width="9"' +
        ' transform="rotate(-90 60 60)" stroke-dasharray="' + CIRC + '"' +
        ' stroke-dashoffset="' + CIRC + '"/>' +
        '<text class="np-mult" id="npMult" x="60" y="58" text-anchor="middle">1.00x</text>' +
        '<text class="np-mult-sub" x="60" y="76" text-anchor="middle">EARN RATE</text>' +
      '</svg>' +
      '<span class="np-spark" id="npSpark" aria-hidden="true"></span>' +
    '</button>' +
    '<div class="np-body">' +
      // The mark instead of a typed heading: it says NOOB POWER itself, and
      // repeating the words underneath would be the same thing twice. It is
      // decorative, so the h3 stays for screen readers and is hidden visually.
      '<img class="np-mark" src="illustrations/noob-power.webp" alt="" aria-hidden="true">' +
      '<h3 class="np-sr">NOOB Power</h3>' +
      '<p>Every friend you bring who is actually playing makes your own NOOB arrive faster. ' +
        'Tap the ring to add one and watch the rate climb.</p>' +
      '<div class="np-readout" id="npReadout" role="status">' +
        '<span class="np-friends" id="npFriends">0</span>' +
        '<span class="np-friends-label" id="npFriendsLabel">friends earning</span>' +
      '</div>' +
      '<span class="np-next" id="npNext">Your first friend takes you to 1.05x.</span>' +
      '<div class="np-controls">' +
        '<button class="np-btn np-btn-primary" id="npAdd" type="button">Add a friend</button>' +
        '<button class="np-btn" id="npReset" type="button">Start again</button>' +
      '</div>' +
      '<ul class="np-rungs" id="npRungs"></ul>' +
      '<p class="np-foot">The ladder above is the real one. One friend lifts you straight away, ' +
        'and the top rung needs 500 friends who are all still playing. Nobody is counting people ' +
        'who signed up and left.</p>' +
    '</div>';

  var dial = document.getElementById("npDial");
  var arc = document.getElementById("npArc");
  var multEl = document.getElementById("npMult");
  var friendsEl = document.getElementById("npFriends");
  var labelEl = document.getElementById("npFriendsLabel");
  var nextEl = document.getElementById("npNext");
  var spark = document.getElementById("npSpark");
  var rungsEl = document.getElementById("npRungs");

  TIERS.forEach(function (t) {
    if (t[0] === 0) return;
    var li = document.createElement("li");
    li.className = "np-rung";
    li.dataset.at = String(t[0]);
    li.textContent = t[0] + " = " + t[1].toFixed(2) + "x";
    rungsEl.appendChild(li);
  });

  function render(reachedRung) {
    var m = multiplierFor(friends);
    var next = nextTier(friends);

    multEl.textContent = m.toFixed(2) + "x";
    friendsEl.textContent = String(friends);
    labelEl.textContent = friends === 1 ? "friend earning" : "friends earning";

    // The arc measures progress toward the TOP rung, so its emptiness early on
    // is honest: one friend is a real gain in rate and a sliver of the journey.
    var frac = Math.min(friends / MAX_FRIENDS, 1);
    arc.style.strokeDashoffset = String(CIRC * (1 - frac));

    if (next) {
      var away = next[0] - friends;
      nextEl.textContent = away === 1
        ? "One more friend takes you to " + next[1].toFixed(2) + "x."
        : away + " more friends takes you to " + next[1].toFixed(2) + "x.";
    } else {
      nextEl.textContent = "Top rung. 3.00x is as fast as NOOB Power goes.";
    }

    Array.prototype.forEach.call(rungsEl.children, function (li) {
      li.classList.toggle("np-reached", friends >= Number(li.dataset.at));
    });

    dial.setAttribute("aria-label",
      "NOOB Power demonstration. " + friends + (friends === 1 ? " friend" : " friends") +
      " earning, rate " + m.toFixed(2) + " times. Activate to add a friend.");

    if (reachedRung && !reduced) fly();
  }

  // A coin leaves the ring on every rung reached. Direction varies so a run of
  // them does not look like one repeated animation.
  var sparkSeq = 0;
  function fly() {
    sparkSeq += 1;
    var angle = (sparkSeq * 47) % 360 * (Math.PI / 180);
    spark.style.setProperty("--np-dx", (Math.cos(angle) * 78).toFixed(1) + "px");
    spark.style.setProperty("--np-dy", (Math.sin(angle) * 78).toFixed(1) + "px");
    spark.classList.remove("np-fly");
    void spark.offsetWidth;                     // restart the animation
    spark.classList.add("np-fly");
  }

  function addFriend() {
    if (friends >= MAX_FRIENDS) return;
    var before = multiplierFor(friends);
    friends += 1;
    render(multiplierFor(friends) > before);
  }

  dial.addEventListener("click", addFriend);
  document.getElementById("npAdd").addEventListener("click", addFriend);
  document.getElementById("npReset").addEventListener("click", function () {
    friends = 0;
    render(false);
  });

  // Holding the button accelerates, because reaching 500 one click at a time
  // is not a demonstration, it is a chore. It still passes through every rung
  // so the slowing-down is felt rather than skipped.
  function startHold(e) {
    if (e.type === "pointerdown" && e.button !== 0) return;
    var speed = 260;
    function step() {
      addFriend();
      speed = Math.max(18, speed * 0.72);
      held = window.setTimeout(step, speed);
    }
    held = window.setTimeout(step, 420);
  }
  function stopHold() {
    if (held) { window.clearTimeout(held); held = null; }
  }
  ["pointerdown"].forEach(function (t) { dial.addEventListener(t, startHold); });
  ["pointerup", "pointerleave", "pointercancel"].forEach(function (t) {
    dial.addEventListener(t, stopHold);
  });

  render(false);
})();
