/* ============================================================
   dog3d.js — BYTE, a golden retriever puppy with half a chrome face.
   Sits in the bottom-right corner, facing you. Click him and he
   barks, then offers a choice. Three clicks and he trots home.

   Poses are two sets of joint angles — SIT and STAND — and every
   joint lerps between them, so sitting down and getting up read
   as one motion rather than a snap.
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('dogCanvas');
  var bubble = document.getElementById('dogBubble');
  var menu = document.getElementById('dogMenu');
  if (!canvas) return;

  var B = window.Bench || {};
  var reduced = !!B.reduced;
  var SIZE = 205;
  var HALF = SIZE / 2;

  function hide() { canvas.style.display = 'none'; if (menu) menu.hidden = true; }
  if (!window.THREE) { hide(); return; }

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    if (!renderer.getContext()) throw new Error('no gl');
  } catch (e) { hide(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(SIZE, SIZE, false);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  camera.position.set(0, 0.62, 8.7);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x6a5334, 0.9));
  var sun = new THREE.DirectionalLight(0xfff3df, 0.9);
  sun.position.set(2.6, 5.5, 5);
  scene.add(sun);
  var rimLight = new THREE.DirectionalLight(0xbfe9f5, 0.35);
  rimLight.position.set(-4, 2, -3);
  scene.add(rimLight);
  var blue = new THREE.PointLight(0x39b6ff, 0.7, 7);
  blue.position.set(0.9, 1.9, 1.5);
  scene.add(blue);

  /* ---------- palette: golden retriever ---------- */
  var GOLD = 0xdda94f, GOLD_D = 0xb9862f, CREAM = 0xf2dcab, NOSE = 0x2a2018;
  var CHROME = 0xc2ccd2, CHROME_D = 0x8d9aa2, OPTIC = 0x39b6ff, TONGUE = 0xe98a9a;

  function fur(color) {
    return new THREE.MeshPhongMaterial({ color: color, shininess: 4, specular: 0x1d1610 });
  }
  function metal(color, shine) {
    return new THREE.MeshPhongMaterial({ color: color, shininess: shine || 95, specular: 0xf0fbff });
  }
  function lit(color) { return new THREE.MeshBasicMaterial({ color: color }); }
  function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }
  function ball(r, m, s) { return new THREE.Mesh(new THREE.SphereGeometry(r, s || 24, s || 18), m); }
  function tube(rt, rb, h, m) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 14), m); }

  var goldM = fur(GOLD), goldD = fur(GOLD_D), creamM = fur(CREAM);
  var chromeM = metal(CHROME), chromeD = metal(CHROME_D, 60);

  /* ---------- the dog. Built facing +X. ----------
     PROPORTIONS ARE THE WHOLE POINT HERE. Earlier versions had an adult
     dog's build — long body, small head, long jointed legs — which reads
     as a lumpy quadruped no matter how good the details are. A puppy is
     roughly: head nearly as big as the body, body short and round, legs
     stubby with no visible knee. Those ratios are asserted in the tests. */
  var dog = new THREE.Group();
  dog.position.y = -0.10;
  scene.add(dog);

  var torso = new THREE.Group();
  dog.add(torso);

  /* ONE rounded body. No chest or rump spheres bulging out of it. */
  var trunk = ball(0.82, goldM, 28);
  trunk.scale.set(1.06, 1.00, 0.94);
  torso.add(trunk);

  var bib = ball(0.50, creamM, 20);
  bib.scale.set(0.72, 1.02, 0.74);
  bib.position.set(0.52, -0.22, 0);
  torso.add(bib);

  /* ---------- head: big, the way a puppy's is ---------- */
  var head = new THREE.Group();
  head.position.set(0.62, 0.92, 0);
  torso.add(head);

  var skull = ball(0.72, goldM, 28);
  skull.scale.set(1.0, 0.95, 0.98);
  head.add(skull);

  var muzzle = ball(0.40, creamM, 22);
  muzzle.scale.set(1.05, 0.78, 0.92);
  muzzle.position.set(0.52, -0.20, 0);
  head.add(muzzle);

  var nose = ball(0.155, metal(NOSE, 60), 16);
  nose.scale.set(0.88, 0.80, 1.02);
  nose.position.set(0.84, -0.12, 0);
  head.add(nose);

  var jaw = new THREE.Group();
  jaw.position.set(0.40, -0.34, 0);
  head.add(jaw);
  var mouth = ball(0.24, metal(0x6b3540, 18), 16);
  mouth.scale.set(0.80, 0.52, 0.80);
  mouth.position.set(0.20, -0.02, 0);
  jaw.add(mouth);
  var tongue = ball(0.16, fur(TONGUE), 14);
  tongue.scale.set(0.92, 0.44, 0.80);
  tongue.position.set(0.30, -0.14, 0);
  jaw.add(tongue);
  var tongueTip = ball(0.12, fur(TONGUE), 12);
  tongueTip.scale.set(0.9, 0.42, 0.85);
  tongueTip.position.set(0.40, -0.20, 0);
  jaw.add(tongueTip);

  /* the fur-side eye */
  var eye = ball(0.125, metal(0x171009, 90), 16);
  eye.position.set(0.50, 0.14, -0.32);
  head.add(eye);
  var glint = ball(0.042, lit(0xffffff), 10);
  glint.position.set(0.58, 0.21, -0.38);
  head.add(glint);
  var lid = ball(0.135, goldM, 14);
  lid.position.set(0.50, 0.31, -0.32);
  head.add(lid);

  /* ---------- big floppy ears ---------- */
  var earFur = new THREE.Group();
  earFur.position.set(-0.04, 0.26, -0.56);
  head.add(earFur);
  var earFurM = ball(0.30, goldD, 18);
  earFurM.scale.set(0.60, 1.55, 0.82);
  earFurM.position.y = -0.40;
  earFur.add(earFurM);
  earFur.rotation.x = -0.20;
  earFur.rotation.z = 0.10;

  var earBot = new THREE.Group();
  earBot.position.set(-0.04, 0.26, 0.56);
  head.add(earBot);
  var earBotM = ball(0.30, goldD, 18);
  earBotM.scale.set(0.60, 1.55, 0.82);
  earBotM.position.y = -0.40;
  earBot.add(earBotM);
  var earCuff = ball(0.22, chromeD, 16);
  earCuff.scale.set(0.82, 0.58, 0.98);
  earCuff.position.y = -0.74;
  earBot.add(earCuff);
  var earSeam = box(0.03, 0.03, 0.18, lit(OPTIC));
  earSeam.position.set(0.10, -0.80, 0);
  earBot.add(earSeam);
  earBot.rotation.x = 0.20;
  earBot.rotation.z = 0.10;

  /* ---------- the chrome panel: one eye and cheek only ---------- */
  var cyber = new THREE.Group();
  head.add(cyber);

  var plateA = ball(0.735, chromeM, 26);
  plateA.scale.set(0.60, 0.74, 0.40);
  plateA.position.set(0.22, 0.12, 0.36);
  cyber.add(plateA);

  var cheekPlate = ball(0.52, chromeD, 20);
  cheekPlate.scale.set(0.70, 0.52, 0.42);
  cheekPlate.position.set(0.50, -0.16, 0.28);
  cyber.add(cheekPlate);

  var seamLine = box(0.035, 0.72, 0.05, lit(OPTIC));
  seamLine.position.set(-0.16, 0.10, 0.48);
  seamLine.rotation.z = 0.14;
  cyber.add(seamLine);

  var opticHousing = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.05, 10, 24), chromeD);
  opticHousing.position.set(0.38, 0.13, 0.47);
  opticHousing.rotation.y = -0.6;
  cyber.add(opticHousing);
  var opticLens = new THREE.Mesh(new THREE.CircleGeometry(0.145, 22), lit(OPTIC));
  opticLens.position.set(0.408, 0.13, 0.508);
  opticLens.rotation.y = -0.6;
  cyber.add(opticLens);
  var opticCore = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16), lit(0xdff4ff));
  opticCore.position.set(0.42, 0.13, 0.522);
  opticCore.rotation.y = -0.6;
  cyber.add(opticCore);

  for (var rv = 0; rv < 3; rv++) {
    var rivet = ball(0.028, chromeD, 8);
    rivet.position.set(-0.06 + rv * 0.12, 0.44 - rv * 0.20, 0.42);
    cyber.add(rivet);
  }

  /* ---------- stubby legs: one segment, no visible knee ---------- */
  function makeLeg(x, z, front) {
    var g = new THREE.Group();
    g.position.set(x, -0.58, z);
    torso.add(g);

    var limb = tube(0.20, 0.22, 0.42, goldM);
    limb.position.y = -0.21;
    g.add(limb);

    /* kept as a group so the walk cycle still has something to bend */
    var knee = new THREE.Group();
    knee.position.y = -0.40;
    g.add(knee);

    var paw = ball(0.24, creamM, 16);
    paw.scale.set(1.0, 0.72, 1.05);
    paw.position.set(0.03, -0.14, 0);
    knee.add(paw);

    return { g: g, knee: knee, paw: paw, front: !!front };
  }

  var legFL = makeLeg(0.48, 0.40, true);
  var legFR = makeLeg(0.48, -0.40, true);
  var legRL = makeLeg(-0.52, 0.38, false);
  var legRR = makeLeg(-0.52, -0.38, false);
  var legs = [legFL, legFR, legRL, legRR];

  /* ---------- small curled tail ---------- */
  var tail = new THREE.Group();
  tail.position.set(-0.86, 0.30, 0);
  torso.add(tail);
  var seg = [];
  for (var sI = 0; sI < 3; sI++) {
    var sg = new THREE.Group();
    var puff = ball(0.21 - sI * 0.025, goldM, 14);
    puff.position.x = -0.16;
    sg.add(puff);
    sg.position.x = sI === 0 ? 0 : -0.16;
    if (sI === 0) tail.add(sg); else seg[sI - 1].add(sg);
    seg.push(sg);
  }

  /* ---------- hearts ---------- */
  var heartTex = (function () {
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var g = c.getContext('2d');
    if (g) {
      g.fillStyle = '#e2557a';
      g.beginPath();
      g.moveTo(32, 54);
      g.bezierCurveTo(2, 34, 10, 8, 32, 22);
      g.bezierCurveTo(54, 8, 62, 34, 32, 54);
      g.fill();
    }
    return new THREE.CanvasTexture(c);
  })();
  var hearts = [];
  for (var h = 0; h < 6; h++) {
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartTex, transparent: true, opacity: 0, depthTest: false }));
    sp.scale.set(0.4, 0.4, 1);
    sp.visible = false;
    sp.userData = { life: 0, vx: 0, vy: 0 };
    scene.add(sp);
    hearts.push(sp);
  }

  /* ---------- poses ---------- */
  /* every value lerps, so sitting down is a motion, not a jump */
  var POSE = {
    sit: {
      torsoRotZ: 0.20, torsoY: -0.16,
      flHip: 0.04, flKnee: 0.0,
      rlHip: 0.44, rlKnee: -0.62,
      tailRotZ: 0.60, headRotZ: 0.08, headY: 0.96
    },
    stand: {
      torsoRotZ: 0.0, torsoY: 0.04,
      flHip: 0, flKnee: 0,
      rlHip: 0, rlKnee: 0,
      tailRotZ: 0.34, headRotZ: 0, headY: 0.92
    }
  };
  var pose = {};
  for (var k in POSE.sit) pose[k] = POSE.sit[k];
  var sitAmt = 1;             // 1 = sitting, 0 = standing
  var sitOverride = null;     // tests pin a pose through this

  /* ---------- placement ---------- */
  var MARGIN = 14;
  function homeX() { return Math.max(MARGIN, window.innerWidth - SIZE - MARGIN); }
  var pos = { x: homeX(), y: -MARGIN };
  var target = { x: pos.x, y: pos.y };
  var facing = 1;
  var IDLE_YAW = -1.12;                       // three-quarter view, chrome side to camera
  function walkYaw() { return facing > 0 ? 0 : Math.PI; }
  var yaw = IDLE_YAW;

  function place() {
    canvas.style.transform = 'translate3d(' + pos.x.toFixed(1) + 'px,' + pos.y.toFixed(1) + 'px,0)';
    if (menu && !menu.hidden) positionMenu();
    if (bubble) {
      var bl = Math.max(8, Math.min(window.innerWidth - 240, pos.x + 10));
      bubble.style.transform = 'translate3d(' + bl.toFixed(1) + 'px,' + (pos.y - SIZE + 40).toFixed(1) + 'px,0)';
    }
  }
  function positionMenu() {
    if (!menu) return;
    var mw = menu.offsetWidth || 172;
    var left = pos.x + HALF - mw / 2;
    left = Math.max(8, Math.min(window.innerWidth - mw - 8, left));
    menu.style.transform = 'translate3d(' + left.toFixed(1) + 'px,' + (pos.y - SIZE + 88).toFixed(1) + 'px,0)';
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
  function barkSound() {
    if (!B.audio) return;
    B.audio.tone(470, 0.08, 'square', 0.05);
    setTimeout(function () { B.audio.tone(360, 0.12, 'square', 0.045); }, 100);
  }
  function bark() { barkT = 1; wagBoost = 1; barkSound(); }

  /* ---------- menu ---------- */
  var pendingMenu = 0;
  var TRIPLE_MS = 900;

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
    happy = 1;
    wagBoost = 1.8;
    pets++;
    if (B.store) B.store.set('pets', pets);
    if (petOut) petOut.textContent = pets;
    if (B.audio) {
      B.audio.tone(600, 0.1, 'triangle', 0.05);
      setTimeout(function () { B.audio.tone(800, 0.14, 'triangle', 0.045); }, 90);
    }
    var made = 0;
    for (var i = 0; i < hearts.length && made < 4; i++) {
      var sp2 = hearts[i];
      if (sp2.userData.life > 0) continue;
      sp2.visible = true;
      sp2.position.set(0.6 + (Math.random() - 0.5) * 0.7, 1.5, 0.5);
      sp2.userData.life = 1;
      sp2.userData.vx = (Math.random() - 0.5) * 0.028;
      sp2.userData.vy = 0.026 + Math.random() * 0.018;
      made++;
    }
    say(LINES[Math.floor(Math.random() * LINES.length)]);
  }

  function newWanderTarget() {
    var maxX = Math.max(MARGIN, window.innerWidth - SIZE - MARGIN);
    target.x = MARGIN + Math.random() * (maxX - MARGIN);
    target.y = -MARGIN - Math.random() * Math.min(120, window.innerHeight * 0.16);
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
      if (ev.key === 'Escape') { closeMenu(); try { canvas.focus(); } catch (e) {} }
    });
  }

  /* ---------- clicks ---------- */
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

  canvas.addEventListener('click', onDogClick);
  canvas.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onDogClick(); }
  });
  document.addEventListener('click', function (ev) {
    if (!menu || menu.hidden) return;
    if (menu.contains(ev.target) || canvas.contains(ev.target)) return;
    closeMenu();
  });

  /* ---------- show / hide ---------- */
  var on = (B.store ? B.store.get('dog', '1') : '1') !== '0';
  var toggle = document.getElementById('dogToggle');
  function paintToggle() {
    canvas.style.display = on ? '' : 'none';
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

  if (B.onTheme) {
    B.onTheme(function (c) {
      sun.intensity = c.dark ? 0.66 : 0.9;
      rimLight.intensity = c.dark ? 0.5 : 0.35;
      goldM.color.setHex(c.dark ? 0xc9963f : GOLD);
      goldD.color.setHex(c.dark ? 0xa2762a : GOLD_D);
      creamM.color.setHex(c.dark ? 0xdcc79a : CREAM);
    });
  }

  /* ---------- loop ---------- */
  var running = true;
  document.addEventListener('visibilitychange', function () { running = !document.hidden; });

  function lerp(a, b, n) { return a + (b - a) * n; }

  function frame() {
    requestAnimationFrame(frame);
    if (!running || !on) return;
    clock += 0.016;

    var dx = target.x - pos.x;
    var dy = target.y - pos.y;
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

    /* sit when idle, stand to walk */
    sitAmt = lerp(sitAmt, sitOverride === null ? (moving ? 0 : 1) : sitOverride, 0.08);
    var src = POSE.stand, dst = POSE.sit;
    for (var key in dst) pose[key] = lerp(src[key], dst[key], sitAmt);

    /* face the camera when sitting, face the way you walk when moving */
    var wantYaw = moving ? walkYaw() : IDLE_YAW;
    var diff = wantYaw - yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    yaw += diff * 0.10;
    dog.rotation.y = yaw;

    /* gait */
    walkPhase += moving ? 0.06 + speed * 0.05 : 0.01;
    happy *= 0.975;
    wagBoost *= 0.965;
    barkT *= 0.90;

    var stride = moving ? 0.60 * (1 - sitAmt) : 0;
    for (var i = 0; i < legs.length; i++) {
      var L = legs[i];
      var ph = walkPhase + (i === 0 || i === 3 ? 0 : Math.PI);
      var swing = Math.sin(ph) * stride;
      var base = L.front ? pose.flHip : pose.rlHip;
      var baseK = L.front ? pose.flKnee : pose.rlKnee;
      L.g.rotation.z = base + swing;
      L.knee.rotation.z = baseK + Math.max(0, Math.sin(ph + 0.9)) * stride * 0.85;
    }

    torso.rotation.z = pose.torsoRotZ;
    torso.position.y = pose.torsoY +
      (reduced ? 0 : Math.abs(Math.sin(walkPhase)) * (moving ? 0.05 : 0.012));

    /* breathing */
    var breath = 1 + Math.sin(clock * 1.8) * (moving ? 0.004 : 0.014);
    trunk.scale.set(1.06, 1.00 * breath, 0.94 * breath);

    /* head: bob, look about, snap up on a bark */
    head.position.y = pose.headY + Math.sin(clock * 1.8) * 0.012 + happy * 0.05;
    head.rotation.z = pose.headRotZ - barkT * 0.34 + (moving ? Math.sin(walkPhase * 2 + 0.5) * 0.03 : 0);
    head.rotation.y = moving ? 0 : Math.sin(clock * 0.5) * 0.22;
    jaw.rotation.z = 0.06 + barkT * 0.50 + happy * 0.12;
    tongue.rotation.z = 0.10 + Math.sin(clock * 3) * 0.06 + happy * 0.16;

    /* ears swing */
    earFur.rotation.x = -0.16 + Math.sin(walkPhase * 2) * (moving ? 0.22 : 0.035) - happy * 0.12;
    earBot.rotation.x = 0.20 - Math.sin(walkPhase * 2) * (moving ? 0.18 : 0.03) + happy * 0.10;

    /* tail: a fluffy chain, each segment lagging the one before */
    var wag = 0.34 + wagBoost * 0.9 + (moving ? 0.22 : 0);
    tail.rotation.z = pose.tailRotZ;
    for (var sI = 0; sI < seg.length; sI++) {
      seg[sI].rotation.y = Math.sin(clock * (5 + wagBoost * 6) - sI * 0.6) * wag * (0.5 + sI * 0.2);
      seg[sI].rotation.z = sI === 0 ? 0 : 0.20;
    }

    /* blink */
    nextBlink -= 0.016;
    if (nextBlink <= 0) { blink = 1; nextBlink = 2.4 + Math.random() * 3.4; }
    blink *= 0.80;
    lid.position.y = 0.31 - blink * 0.20;
    eye.scale.y = Math.max(0.1, 1 - blink * 1.05) * (1 - happy * 0.4);
    glint.visible = blink < 0.4;

    /* optic pulse */
    var pulse = 1 + Math.sin(clock * 3.2) * 0.10 + barkT * 0.28;
    opticCore.scale.setScalar(pulse);
    blue.intensity = 0.7 + Math.sin(clock * 3.2) * 0.16;
    seamLine.material.color.setHex(Math.sin(clock * 2) > -0.6 ? OPTIC : 0x1d6a99);
    earSeam.material.color.setHex(Math.sin(clock * 2 + 1) > 0 ? OPTIC : 0x1d6a99);

    /* hearts */
    for (i = 0; i < hearts.length; i++) {
      var hs = hearts[i];
      if (hs.userData.life <= 0) { hs.visible = false; continue; }
      hs.userData.life -= 0.016;
      hs.position.x += hs.userData.vx;
      hs.position.y += hs.userData.vy;
      hs.material.opacity = Math.max(0, Math.min(1, hs.userData.life)) * 0.95;
      hs.scale.setScalar(0.28 + (1 - hs.userData.life) * 0.22);
    }

    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  setTimeout(function () { if (on) say('Woof! Click me.', 3200); }, 2600);

  /* exposed for the geometry tests */
  canvas.__dog = {
    scene: scene, camera: camera, dog: dog, head: head, legs: legs,
    nose: nose, skull: skull, trunk: trunk, opticLens: opticLens, plateA: plateA,
    setSit: function (v) { sitOverride = v; sitAmt = v; },
    freeSit: function () { sitOverride = null; }
  };
})();
