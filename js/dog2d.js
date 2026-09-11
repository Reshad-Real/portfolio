/* ============================================================
   dog2d.js — BYTE, drawn rather than modelled.

   Two poses live in one SVG: a front-facing sit and a side-on walk.
   Everything that moves is a named group transformed from the loop,
   so the behaviour (bark, menu, wander, come home) is unchanged from
   the 3D version — only the rendering is different, and flat vector
   shapes hold their form in a way stacked ellipsoids never did.
   ============================================================ */
(function () {
  'use strict';

  var stage = document.getElementById('dogStage');
  var bubble = document.getElementById('dogBubble');
  var menu = document.getElementById('dogMenu');
  if (!stage) return;

  var B = window.Bench || {};
  var reduced = !!B.reduced;
  var SIZE = 200;
  var HALF = SIZE / 2;

  /* ---------- the drawing ---------- */
  var SVG =
  '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="byte-svg" aria-hidden="true">' +
    '<defs>' +
      '<linearGradient id="b-fur" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#f0c063"/><stop offset="1" stop-color="#d99a3c"/>' +
      '</linearGradient>' +
      '<linearGradient id="b-fur-d" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#d09437"/><stop offset="1" stop-color="#ab7526"/>' +
      '</linearGradient>' +
      '<linearGradient id="b-cream" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#fdf1d4"/><stop offset="1" stop-color="#f2dcac"/>' +
      '</linearGradient>' +
      '<linearGradient id="b-steel" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="#eef4f7"/><stop offset="0.45" stop-color="#c3ced5"/>' +
        '<stop offset="0.7" stop-color="#9aa8b1"/><stop offset="1" stop-color="#cfd9df"/>' +
      '</linearGradient>' +
      '<radialGradient id="b-optic" cx="0.5" cy="0.5" r="0.5">' +
        '<stop offset="0" stop-color="#eafaff"/><stop offset="0.35" stop-color="#4fc9ff"/>' +
        '<stop offset="1" stop-color="#1c7fc4"/>' +
      '</radialGradient>' +
      '<clipPath id="b-halfclip"><rect x="0" y="0" width="100" height="200"/></clipPath>' +
    '</defs>' +

    /* ================= SITTING, FACING YOU ================= */
    '<g id="b-front">' +
      '<g id="b-tail">' +
        '<path d="M148 150 q26 -6 30 -30 q2 -16 -10 -20 q-10 -3 -12 10 q-3 18 -14 26 z" ' +
             'fill="url(#b-fur-d)"/>' +
      '</g>' +

      /* haunches and body */
      '<g id="b-body">' +
        '<path d="M100 92 c34 0 54 26 54 56 c0 22 -12 38 -26 42 l-56 0 c-14 -4 -26 -20 -26 -42 c0 -30 20 -56 54 -56 z" ' +
             'fill="url(#b-fur)"/>' +
        '<ellipse cx="100" cy="150" rx="26" ry="30" fill="url(#b-cream)"/>' +
      '</g>' +

      /* front legs */
      '<g id="b-legs">' +
        '<rect x="72" y="142" width="19" height="44" rx="9.5" fill="url(#b-fur)"/>' +
        '<rect x="109" y="142" width="19" height="44" rx="9.5" fill="url(#b-fur)"/>' +
        '<ellipse cx="81.5" cy="184" rx="12" ry="8" fill="url(#b-cream)"/>' +
        '<ellipse cx="118.5" cy="184" rx="12" ry="8" fill="url(#b-cream)"/>' +
        '<path d="M75 184 v-5 M81.5 185 v-6 M88 184 v-5" stroke="#e0c691" stroke-width="1.6" stroke-linecap="round"/>' +
        '<path d="M112 184 v-5 M118.5 185 v-6 M125 184 v-5" stroke="#e0c691" stroke-width="1.6" stroke-linecap="round"/>' +
      '</g>' +

      /* rear paws peeking out at the sides */
      '<ellipse cx="58" cy="176" rx="14" ry="9" fill="url(#b-cream)"/>' +
      '<ellipse cx="142" cy="176" rx="14" ry="9" fill="url(#b-cream)"/>' +

      '<g id="b-head">' +
        /* ears sit behind the skull */
        '<g id="b-ear-l"><path d="M62 44 c-20 2 -30 20 -28 44 c2 22 12 34 24 32 c10 -2 14 -16 12 -36 c-2 -18 0 -32 -8 -40 z" ' +
             'fill="url(#b-fur-d)"/></g>' +
        '<g id="b-ear-r"><path d="M138 44 c20 2 30 20 28 44 c-2 22 -12 34 -24 32 c-10 -2 -14 -16 -12 -36 c2 -18 0 -32 8 -40 z" ' +
             'fill="url(#b-fur-d)"/>' +
             '<path d="M146 112 c10 2 16 -6 16 -16 l-22 4 z" fill="#aab6bd"/>' +
             '<path d="M143 106 l18 -3" stroke="#4fc9ff" stroke-width="2.4" stroke-linecap="round"/></g>' +

        /* skull */
        '<path id="b-skull" d="M100 26 c30 0 50 22 50 50 c0 30 -22 50 -50 50 c-28 0 -50 -20 -50 -50 c0 -28 20 -50 50 -50 z" ' +
             'fill="url(#b-fur)"/>' +

        /* the chrome half — a clip, so the split is exact */
        '<g clip-path="url(#b-halfclip)">' +
          '<path d="M100 26 c30 0 50 22 50 50 c0 30 -22 50 -50 50 c-28 0 -50 -20 -50 -50 c0 -28 20 -50 50 -50 z" ' +
               'fill="url(#b-steel)"/>' +
          '<path d="M62 46 q-14 16 -13 38" stroke="#8fa0aa" stroke-width="2" fill="none" opacity=".8"/>' +
          '<path d="M56 92 q14 12 30 14" stroke="#8fa0aa" stroke-width="2" fill="none" opacity=".8"/>' +
          '<circle cx="66" cy="52" r="2.1" fill="#8b99a3"/>' +
          '<circle cx="58" cy="72" r="2.1" fill="#8b99a3"/>' +
          '<circle cx="64" cy="100" r="2.1" fill="#8b99a3"/>' +
        '</g>' +
        '<path d="M100 26 v100" stroke="#4fc9ff" stroke-width="2.6" stroke-linecap="round" id="b-seam" opacity=".9"/>' +

        /* muzzle */
        '<ellipse cx="100" cy="98" rx="28" ry="21" fill="url(#b-cream)"/>' +
        '<g id="b-jaw">' +
          '<path d="M86 104 q14 14 28 0" stroke="#a9773c" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
          '<path id="b-tongue" d="M94 108 q6 12 12 0 z" fill="#ef8ea0"/>' +
        '</g>' +
        '<path d="M92 88 q8 -6 16 0 q-2 8 -8 8 q-6 0 -8 -8 z" fill="#2e2118"/>' +

        /* the fur-side eye */
        '<g id="b-eye">' +
          '<ellipse cx="123" cy="72" rx="8" ry="8.6" fill="#1d1409"/>' +
          '<circle cx="125.6" cy="69" r="2.8" fill="#ffffff"/>' +
          '<rect id="b-lid" x="114" y="60" width="18" height="0" rx="4" fill="#e0a94a"/>' +
        '</g>' +

        /* the optic in the metal half */
        '<g id="b-optic-g">' +
          '<circle cx="77" cy="72" r="13" fill="#6d7d87"/>' +
          '<circle cx="77" cy="72" r="10.5" fill="url(#b-optic)"/>' +
          '<circle id="b-optic-ring" cx="77" cy="72" r="6" fill="none" stroke="#d8f4ff" stroke-width="1.8" opacity=".85"/>' +
          '<circle id="b-optic-core" cx="77" cy="72" r="2.6" fill="#ffffff"/>' +
        '</g>' +

        /* brow tuft */
        '<path d="M112 46 q10 -6 20 2" stroke="#c98f34" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>' +
      '</g>' +
    '</g>' +

    /* ================= SIDE ON, WALKING =================
       In profile you only ever see one side of him, so splitting the head
       down the middle read as a helmet. This side shows the metal cheek
       plate set into an otherwise furry head. Legs start well inside the
       body outline so there is no gap where they join. */
    '<g id="b-side" style="display:none">' +
      '<defs><clipPath id="b-headclip"><circle cx="146" cy="84" r="37"/></clipPath></defs>' +

      /* tail, behind everything */
      '<g id="s-tail"><path d="M50 106 c-16 -6 -26 -24 -22 -40 c2 -9 12 -12 17 -4 c5 8 2 20 7 28 c4 6 10 9 16 10 z" ' +
           'fill="url(#b-fur-d)"/></g>' +

      /* far legs sit behind the body */
      '<g id="s-leg-rb"><rect x="56" y="116" width="16" height="58" rx="8" fill="url(#b-fur-d)"/>' +
        '<ellipse cx="64" cy="172" rx="11.5" ry="7" fill="#e2c79b"/></g>' +
      '<g id="s-leg-fb"><rect x="112" y="116" width="16" height="58" rx="8" fill="url(#b-fur-d)"/>' +
        '<ellipse cx="120" cy="172" rx="11.5" ry="7" fill="#e2c79b"/></g>' +

      /* body */
      '<g id="s-body">' +
        '<path d="M44 120 c0 -22 16 -34 46 -34 c30 0 48 12 48 32 c0 22 -18 34 -48 34 c-30 0 -46 -12 -46 -32 z" ' +
             'fill="url(#b-fur)"/>' +
        '<path d="M70 148 c8 6 22 8 34 6 c14 -2 24 -9 28 -18 c2 14 -10 26 -30 28 c-18 2 -30 -6 -32 -16 z" ' +
             'fill="url(#b-cream)" opacity=".9"/>' +
      '</g>' +

      /* near legs, overlapping the body */
      '<g id="s-leg-rf"><rect x="68" y="114" width="18" height="62" rx="9" fill="url(#b-fur)"/>' +
        '<ellipse cx="77" cy="174" rx="12.5" ry="7.5" fill="url(#b-cream)"/></g>' +
      '<g id="s-leg-ff"><rect x="118" y="114" width="18" height="62" rx="9" fill="url(#b-fur)"/>' +
        '<ellipse cx="127" cy="174" rx="12.5" ry="7.5" fill="url(#b-cream)"/></g>' +

      '<g id="s-head">' +
        /* ear hangs behind the jaw */
        '<g id="s-ear"><path d="M136 56 c-16 2 -24 18 -21 40 c2 16 12 25 21 22 c9 -3 11 -18 9 -34 c-2 -16 -1 -27 -9 -28 z" ' +
             'fill="url(#b-fur-d)"/>' +
          '<path d="M139 112 c8 3 14 -4 14 -13 l-19 4 z" fill="#aab6bd"/></g>' +

        /* skull and snout */
        '<circle cx="146" cy="84" r="37" fill="url(#b-fur)"/>' +
        '<path d="M168 96 c10 -4 24 -2 28 4 c3 6 1 12 -4 14 c-8 3 -22 2 -28 -4 z" fill="url(#b-cream)"/>' +
        '<ellipse cx="172" cy="98" rx="20" ry="15" fill="url(#b-cream)"/>' +
        '<path d="M186 90 c4 -3 9 -3 12 1 c1 5 -2 8 -6 8 c-4 0 -7 -4 -6 -9 z" fill="#2e2118"/>' +
        '<g id="s-jaw">' +
          '<path d="M166 104 q10 9 20 1" stroke="#a9773c" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
          '<path d="M172 107 q5 9 9 0 z" fill="#ef8ea0"/>' +
        '</g>' +

        /* the metal cheek plate, clipped to the skull */
        '<g clip-path="url(#b-headclip)">' +
          '<path d="M150 54 c14 4 22 16 22 30 c0 16 -10 28 -24 31 c-12 3 -22 -4 -25 -16 c-4 -16 0 -34 10 -42 c5 -4 11 -5 17 -3 z" ' +
               'fill="url(#b-steel)"/>' +
          '<path d="M133 62 q-7 20 -3 40" stroke="#8fa0aa" stroke-width="1.8" fill="none" opacity=".75"/>' +
          '<circle cx="139" cy="66" r="1.9" fill="#8b99a3"/>' +
          '<circle cx="136" cy="100" r="1.9" fill="#8b99a3"/>' +
        '</g>' +
        '<path d="M150 54 c-12 -1 -20 6 -24 18 c-5 14 -4 30 0 42" stroke="#4fc9ff" stroke-width="2.2" ' +
             'fill="none" stroke-linecap="round" opacity=".85"/>' +

        /* the optic sits where the eye would be */
        '<circle cx="152" cy="80" r="12" fill="#6d7d87"/>' +
        '<circle cx="152" cy="80" r="9.5" fill="url(#b-optic)"/>' +
        '<circle cx="152" cy="80" r="5" fill="none" stroke="#d8f4ff" stroke-width="1.6" opacity=".8"/>' +
        '<circle cx="152" cy="80" r="2.4" fill="#ffffff"/>' +

        /* collar where the head meets the body */
        '<path d="M120 92 c6 12 8 22 6 32 c-8 -2 -14 -10 -16 -22 z" fill="#1d6f78"/>' +
        '<circle cx="118" cy="120" r="4" fill="#c9a227"/>' +
      '</g>' +
    '</g>' +
  '</svg>';

  stage.innerHTML = SVG;
  stage.setAttribute('role', 'button');
  stage.setAttribute('tabindex', '0');
  stage.setAttribute('aria-label', 'BYTE the cyber-dog. Activate to bark and open his menu.');

  function el(id) { return stage.querySelector('#' + id); }
  var front = el('b-front'), side = el('b-side');
  var head = el('b-head'), earL = el('b-ear-l'), earR = el('b-ear-r');
  var tail = el('b-tail'), body = el('b-body'), jaw = el('b-jaw');
  var lid = el('b-lid'), opticRing = el('b-optic-ring'), opticCore = el('b-optic-core');
  var seam = el('b-seam'), tongue = el('b-tongue');
  var sideHead = el('s-head'), sideTail = el('s-tail'), sideJaw = el('s-jaw');
  var sLegs = ['s-leg-rb', 's-leg-fb', 's-leg-rf', 's-leg-ff'].map(el);

  /* the lid fill got mangled in the string; set it properly */
  if (lid) lid.setAttribute('fill', '#e0a94a');

  function T(node, str) { if (node) node.setAttribute('transform', str); }

  /* ---------- hearts ---------- */
  var heartLayer = document.createElement('div');
  heartLayer.className = 'byte-hearts';
  stage.appendChild(heartLayer);
  function popHearts() {
    for (var i = 0; i < 4; i++) {
      var h = document.createElement('span');
      h.className = 'byte-heart';
      h.style.left = (42 + Math.random() * 46) + '%';
      h.style.animationDelay = (i * 90) + 'ms';
      heartLayer.appendChild(h);
      setTimeout(function (node) {
        return function () { if (node.parentNode) node.parentNode.removeChild(node); };
      }(h), 1500 + i * 90);
    }
  }

  /* ---------- placement ---------- */
  var MARGIN = 14;
  function homeX() { return Math.max(MARGIN, window.innerWidth - SIZE - MARGIN); }
  var pos = { x: homeX(), y: -MARGIN };
  var target = { x: pos.x, y: pos.y };
  var facing = -1;

  function place() {
    stage.style.transform = 'translate3d(' + pos.x.toFixed(1) + 'px,' + pos.y.toFixed(1) + 'px,0)';
    if (menu && !menu.hidden) positionMenu();
    if (bubble) {
      var bl = Math.max(8, Math.min(window.innerWidth - 240, pos.x + 6));
      bubble.style.transform = 'translate3d(' + bl.toFixed(1) + 'px,' + (pos.y - SIZE + 26).toFixed(1) + 'px,0)';
    }
  }
  function positionMenu() {
    if (!menu) return;
    var mw = menu.offsetWidth || 172;
    var left = pos.x + HALF - mw / 2;
    left = Math.max(8, Math.min(window.innerWidth - mw - 8, left));
    menu.style.transform = 'translate3d(' + left.toFixed(1) + 'px,' + (pos.y - SIZE + 70).toFixed(1) + 'px,0)';
  }
  place();
  window.addEventListener('resize', function () {
    var maxX = Math.max(MARGIN, window.innerWidth - SIZE - MARGIN);
    if (state === 'idle') { pos.x = homeX(); target.x = pos.x; }
    pos.x = Math.min(pos.x, maxX);
    place();
  });

  /* ---------- state ---------- */
  var state = 'idle';
  var walkPhase = 0, speed = 0, wagBoost = 0, barkT = 0, happy = 0;
  var blink = 0, nextBlink = 2 + Math.random() * 3;
  var pauseT = 0, clock = 0;

  var LINES = [
    'Woof! Half of me is under warranty.',
    'Woof woof! I run on 3.3 volts and snacks.',
    'Rrrf! I can see infrared out of this eye.',
    'Woof! My tail is clocked at 4 hertz.',
    'Bark! I fetch, but only pointers.',
    'Woof! Scratch behind the metal ear, it conducts.'
  ];
  var WALK_LINES = ['Woof! Off I go.', 'Bark! Patrolling the bench.', 'Woof woof! Back in a bit.'];

  var pets = parseInt((B.store ? B.store.get('pets', '0') : '0'), 10) || 0;
  var petOut = document.getElementById('petCount');
  if (petOut) petOut.textContent = pets;

  function say(text, ms) {
    if (!bubble) return;
    bubble.textContent = text;
    bubble.classList.add('show');
    clearTimeout(say._t);
    say._t = setTimeout(function () { bubble.classList.remove('show'); }, ms || 2600);
  }
  function bark() {
    barkT = 1; wagBoost = 1;
    if (B.audio) {
      B.audio.tone(470, 0.08, 'square', 0.05);
      setTimeout(function () { B.audio.tone(360, 0.12, 'square', 0.045); }, 100);
    }
  }

  /* ---------- menu ---------- */
  var pendingMenu = 0, TRIPLE_MS = 900;
  function openMenu() {
    if (!menu) return;
    menu.hidden = false;
    positionMenu();
    menu.classList.add('show');
    var first = menu.querySelector('button');
    if (first) { try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } }
  }
  function closeMenu() {
    if (!menu) return;
    clearTimeout(pendingMenu);
    menu.classList.remove('show');
    menu.hidden = true;
  }
  function pet() {
    closeMenu();
    happy = 1; wagBoost = 1.8;
    pets++;
    if (B.store) B.store.set('pets', pets);
    if (petOut) petOut.textContent = pets;
    if (B.audio) {
      B.audio.tone(600, 0.1, 'triangle', 0.05);
      setTimeout(function () { B.audio.tone(800, 0.14, 'triangle', 0.045); }, 90);
    }
    popHearts();
    say(LINES[Math.floor(Math.random() * LINES.length)]);
  }
  function newWanderTarget() {
    var maxX = Math.max(MARGIN, window.innerWidth - SIZE - MARGIN);
    target.x = MARGIN + Math.random() * (maxX - MARGIN);
    target.y = -MARGIN - Math.random() * Math.min(110, window.innerHeight * 0.15);
  }
  function goWalk() {
    closeMenu();
    state = 'walking';
    bark();
    say(WALK_LINES[Math.floor(Math.random() * WALK_LINES.length)]);
    newWanderTarget();
  }
  function goHome() {
    closeMenu();
    state = 'returning';
    target.x = homeX();
    target.y = -MARGIN;
    say('Woof. Heading back to my corner.', 2200);
    if (B.audio) B.audio.tone(400, 0.12, 'triangle', 0.045);
  }

  if (menu) {
    menu.addEventListener('click', function (ev) {
      var b = ev.target && ev.target.closest ? ev.target.closest('button') : null;
      if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'pet') pet();
      else if (act === 'walk') goWalk();
      else if (act === 'home') goHome();
      else closeMenu();
    });
    menu.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { closeMenu(); try { stage.focus(); } catch (e) {} }
    });
  }

  var clickTimes = [];
  function onDogClick() {
    var now = Date.now();
    clickTimes.push(now);
    clickTimes = clickTimes.filter(function (tt) { return now - tt < TRIPLE_MS; });
    bark();
    clearTimeout(pendingMenu);
    if (clickTimes.length >= 3) {
      clickTimes.length = 0;
      goHome();
      return;
    }
    if (state === 'walking' || state === 'returning') {
      state = 'idle';
      target.x = pos.x;
      target.y = pos.y;
    }
    closeMenu();
    pendingMenu = setTimeout(openMenu, 280);
  }
  stage.addEventListener('click', onDogClick);
  stage.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onDogClick(); }
  });
  document.addEventListener('click', function (ev) {
    if (!menu || menu.hidden) return;
    if (menu.contains(ev.target) || stage.contains(ev.target)) return;
    closeMenu();
  });

  /* ---------- show / hide ---------- */
  var on = (B.store ? B.store.get('dog', '1') : '1') !== '0';
  var toggle = document.getElementById('dogToggle');
  function paintToggle() {
    stage.style.display = on ? '' : 'none';
    if (!on) { closeMenu(); if (bubble) bubble.classList.remove('show'); }
    if (toggle) toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  if (toggle) {
    toggle.addEventListener('click', function () {
      on = !on;
      if (B.store) B.store.set('dog', on ? '1' : '0');
      paintToggle();
      if (on) { say('Woof! Back on duty.', 2000); bark(); }
    });
  }
  paintToggle();

  /* ---------- loop ---------- */
  var running = true;
  document.addEventListener('visibilitychange', function () { running = !document.hidden; });

  function frame() {
    requestAnimationFrame(frame);
    if (!running || !on) return;
    clock += 0.016;

    var dx = target.x - pos.x, dy = target.y - pos.y;
    var dist = Math.sqrt(dx * dx + dy * dy);

    if (state === 'walking' || state === 'returning') {
      if (dist < 6) {
        if (state === 'returning') {
          state = 'idle';
          pos.x = target.x; pos.y = target.y;
          say('Woof.', 1400);
        } else {
          pauseT -= 0.016;
          if (pauseT <= 0) { newWanderTarget(); pauseT = 0.5 + Math.random() * 1.4; }
        }
        speed += (0 - speed) * 0.12;
      } else {
        var want = state === 'returning' ? 2.6 : 1.9;
        speed += (want - speed) * 0.06;
        pos.x += (dx / dist) * speed;
        pos.y += (dy / dist) * speed;
        if (Math.abs(dx) > 4) facing = dx > 0 ? 1 : -1;
      }
      place();
    } else {
      speed += (0 - speed) * 0.14;
      if (Math.abs(dx) > 1) { pos.x += dx * 0.06; place(); }
    }

    var moving = speed > 0.25;
    front.style.display = moving ? 'none' : '';
    side.style.display = moving ? '' : 'none';
    stage.classList.toggle('face-left', moving && facing < 0);

    walkPhase += moving ? 0.10 + speed * 0.05 : 0.012;
    happy *= 0.975;
    wagBoost *= 0.965;
    barkT *= 0.90;

    nextBlink -= 0.016;
    if (nextBlink <= 0) { blink = 1; nextBlink = 2.4 + Math.random() * 3.4; }
    blink *= 0.76;

    if (!moving) {
      /* breathing */
      var br = 1 + Math.sin(clock * 1.8) * (reduced ? 0 : 0.016);
      T(body, 'translate(100 150) scale(' + br.toFixed(4) + ' ' + (2 - br).toFixed(4) + ') translate(-100 -150)');

      /* head: gentle sway, snap up on a bark */
      var hx = reduced ? 0 : Math.sin(clock * 0.6) * 3;
      var hr = (reduced ? 0 : Math.sin(clock * 0.45) * 2) - barkT * 7 + happy * 2;
      T(head, 'translate(' + hx.toFixed(2) + ' ' + (-barkT * 4).toFixed(2) +
              ') rotate(' + hr.toFixed(2) + ' 100 92)');

      /* ears swing off the head's motion */
      T(earL, 'rotate(' + (-hr * 0.8 - happy * 5 + Math.sin(clock * 1.1) * 1.5).toFixed(2) + ' 62 48)');
      T(earR, 'rotate(' + (-hr * 0.8 + happy * 5 - Math.sin(clock * 1.1) * 1.5).toFixed(2) + ' 138 48)');

      /* tail wag */
      var wag = Math.sin(clock * (5 + wagBoost * 7)) * (7 + wagBoost * 13);
      T(tail, 'rotate(' + wag.toFixed(2) + ' 150 150)');

      /* jaw opens on a bark */
      T(jaw, 'translate(0 ' + (barkT * 5 + happy * 1.5).toFixed(2) + ')');
      if (tongue) tongue.setAttribute('opacity', String(0.45 + barkT * 0.55 + happy * 0.4));

      /* blink */
      if (lid) {
        lid.setAttribute('height', (blink * 18).toFixed(2));
        lid.setAttribute('y', (60 + blink * 4).toFixed(2));
      }
    } else {
      /* diagonal pairs, pivoting where each leg meets the body */
      var swing = Math.sin(walkPhase) * 20;
      T(sLegs[0], 'rotate(' + swing.toFixed(2) + ' 64 122)');
      T(sLegs[3], 'rotate(' + swing.toFixed(2) + ' 127 120)');
      T(sLegs[1], 'rotate(' + (-swing).toFixed(2) + ' 120 122)');
      T(sLegs[2], 'rotate(' + (-swing).toFixed(2) + ' 77 120)');
      var bob = Math.abs(Math.sin(walkPhase)) * 2.5;
      T(el('s-body'), 'translate(0 ' + (-bob).toFixed(2) + ')');
      T(sideHead, 'translate(0 ' + (-bob).toFixed(2) + ') rotate(' + (-barkT * 8).toFixed(2) + ' 130 100)');
      T(sideJaw, 'translate(0 ' + (barkT * 4).toFixed(2) + ')');
      T(el('s-ear'), 'rotate(' + (Math.sin(walkPhase * 2) * 9).toFixed(2) + ' 136 58)');
      T(sideTail, 'rotate(' + (Math.sin(clock * 9) * 13).toFixed(2) + ' 52 108)');
    }

    /* the optic pulses in both poses */
    var pulse = 1 + Math.sin(clock * 3.2) * 0.12 + barkT * 0.3;
    if (opticCore) opticCore.setAttribute('r', (2.6 * pulse).toFixed(2));
    if (opticRing) opticRing.setAttribute('opacity', (0.6 + Math.sin(clock * 3.2) * 0.25).toFixed(2));
    if (seam) seam.setAttribute('opacity', (0.7 + Math.sin(clock * 2) * 0.25).toFixed(2));
  }
  requestAnimationFrame(frame);

  setTimeout(function () { if (on) say('Woof! Click me.', 3200); }, 2600);

  /* exposed for the tests */
  stage.__byte = {
    front: front, side: side,
    isWalking: function () { return side.style.display !== 'none'; },
    state: function () { return state; },
    pos: pos
  };
})();
