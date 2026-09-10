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
  camera.position.set(0, 0.62, 10.0);
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

  /* ---------- the dog. Built facing +X. ---------- */
  var dog = new THREE.Group();
  dog.position.y = -0.06;  /* tuned against the geometry test so he sits centred */
  scene.add(dog);

  var torso = new THREE.Group();
  dog.add(torso);

  /* puppy proportions: short round body, big head */
  var trunk = ball(0.80, goldM);
  trunk.scale.set(1.38, 1.00, 0.98);
  torso.add(trunk);

  /* chest and rump stay inside the trunk's cross-section, so the body
     reads as one form instead of a string of beads */
  var chestBall = ball(0.62, goldM);
  chestBall.scale.set(0.96, 0.98, 0.96);
  chestBall.position.set(0.64, -0.02, 0);
  torso.add(chestBall);

  var rump = ball(0.64, goldM);
  rump.scale.set(0.98, 0.98, 0.99);
  rump.position.set(-0.62, 0.02, 0);
  torso.add(rump);

  var bib = ball(0.42, creamM);
  bib.scale.set(0.72, 1.12, 0.70);
  bib.position.set(0.86, -0.22, 0);
  torso.add(bib);

  /* ---------- head ---------- */
  var neck = tube(0.34, 0.42, 0.5, goldM);
  neck.position.set(1.02, 0.42, 0);
  neck.rotation.z = -0.5;
  torso.add(neck);

  var head = new THREE.Group();
  head.position.set(1.28, 0.92, 0);
  torso.add(head);

  var skull = ball(0.56, goldM);
  skull.scale.set(1.0, 0.96, 0.98);
  head.add(skull);

  /* forehead fluff */
  var topFluff = ball(0.30, goldM, 10);
  topFluff.position.set(-0.06, 0.44, 0);
  head.add(topFluff);

  /* short puppy muzzle */
  var muzzle = ball(0.34, creamM);
  muzzle.scale.set(1.22, 0.88, 0.96);
  muzzle.position.set(0.50, -0.14, 0);
  head.add(muzzle);

  var nose = ball(0.145, metal(NOSE, 70), 14);
  nose.scale.set(0.86, 0.78, 1.05);
  nose.position.set(0.80, -0.06, 0);
  head.add(nose);

  /* open mouth + tongue, like the photo */
  var jaw = new THREE.Group();
  jaw.position.set(0.34, -0.26, 0);
  head.add(jaw);
  var mouth = box(0.40, 0.16, 0.40, metal(0x6b3540, 20));
  mouth.position.set(0.16, -0.06, 0);
  jaw.add(mouth);
  var tongue = box(0.26, 0.09, 0.24, fur(TONGUE));
  tongue.position.set(0.30, -0.20, 0);
  tongue.rotation.z = 0.30;
  jaw.add(tongue);
  var tongueTip = ball(0.13, fur(TONGUE), 10);
  tongueTip.scale.set(1.0, 0.55, 0.9);
  tongueTip.position.set(0.42, -0.29, 0);
  jaw.add(tongueTip);

  /* the fur-side eye */
  var eye = ball(0.105, metal(0x171009, 90), 14);
  eye.position.set(0.40, 0.10, -0.27);
  head.add(eye);
  var glint = ball(0.034, lit(0xffffff), 8);
  glint.position.set(0.47, 0.16, -0.32);
  head.add(glint);
  var lid = ball(0.115, goldM, 12);
  lid.position.set(0.40, 0.24, -0.27);
  head.add(lid);

  /* the fur-side ear: long, floppy, hanging */
  var earFur = new THREE.Group();
  earFur.position.set(-0.02, 0.20, -0.46);
  head.add(earFur);
  var earFurM = ball(0.24, goldD, 12);
  earFurM.scale.set(0.62, 1.75, 0.82);
  earFurM.position.y = -0.34;
  earFur.add(earFurM);
  var earFurTip = ball(0.20, goldD, 10);
  earFurTip.scale.set(0.6, 0.9, 0.8);
  earFurTip.position.y = -0.66;
  earFur.add(earFurTip);
  earFur.rotation.x = -0.16;

  /* ---------- the chrome half ---------- */
  var cyber = new THREE.Group();
  head.add(cyber);

  /* A panel over one eye and cheek — the way the reference has it.
     A shell over the whole side turned the head into a silver blob. */
  var plateA = ball(0.575, chromeM, 24);
  plateA.scale.set(0.62, 0.78, 0.42);
  plateA.position.set(0.16, 0.10, 0.30);
  cyber.add(plateA);

  var cheekPlate = ball(0.42, chromeD, 18);
  cheekPlate.scale.set(0.72, 0.52, 0.40);
  cheekPlate.position.set(0.40, -0.14, 0.24);
  cyber.add(cheekPlate);

  /* a short lit seam along the panel's edge, not a hoop round the head */
  var seamLine = box(0.03, 0.62, 0.05, lit(OPTIC));
  seamLine.position.set(-0.15, 0.08, 0.40);
  seamLine.rotation.z = 0.16;
  cyber.add(seamLine);

  var browPlate = box(0.42, 0.07, 0.06, chromeD);
  browPlate.position.set(0.22, 0.40, 0.30);
  browPlate.rotation.z = -0.18;
  cyber.add(browPlate);

  /* the optic, set into the panel */
  var opticHousing = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.045, 10, 22), chromeD);
  opticHousing.position.set(0.30, 0.10, 0.40);
  opticHousing.rotation.y = -0.62;
  cyber.add(opticHousing);
  var opticLens = new THREE.Mesh(new THREE.CircleGeometry(0.125, 20), lit(OPTIC));
  opticLens.position.set(0.328, 0.10, 0.436);
  opticLens.rotation.y = -0.62;
  cyber.add(opticLens);
  var opticCore = new THREE.Mesh(new THREE.CircleGeometry(0.052, 16), lit(0xdff4ff));
  opticCore.position.set(0.34, 0.10, 0.449);
  opticCore.rotation.y = -0.62;
  cyber.add(opticCore);

  for (var rv = 0; rv < 3; rv++) {
    var rivet = ball(0.024, chromeD, 8);
    rivet.position.set(-0.08 + rv * 0.10, 0.36 - rv * 0.18, 0.36);
    cyber.add(rivet);
  }

  /* the chrome-side ear: metal plated, held up */
  var earBot = new THREE.Group();
  earBot.position.set(-0.04, 0.24, 0.46);
  head.add(earBot);
  var earBotM = ball(0.24, goldD, 16);
  earBotM.scale.set(0.62, 1.75, 0.82);
  earBotM.position.y = -0.34;
  earBot.add(earBotM);
  var earCuff = ball(0.20, chromeD, 14);
  earCuff.scale.set(0.76, 0.62, 0.94);
  earCuff.position.y = -0.66;
  earBot.add(earCuff);
  var earSeam = box(0.03, 0.03, 0.16, lit(OPTIC));
  earSeam.position.set(0.10, -0.70, 0.0);
  earBot.add(earSeam);
  earBot.rotation.x = 0.20;

  /* ---------- legs ---------- */
  function makeLeg(x, z, front) {
    var g = new THREE.Group();
    g.position.set(x, -0.46, z);
    torso.add(g);

    var thigh = tube(front ? 0.20 : 0.26, front ? 0.18 : 0.24, 0.52, goldM);
    thigh.position.y = -0.26;
    g.add(thigh);

    var knee = new THREE.Group();
    knee.position.y = -0.50;
    g.add(knee);

    var shin = tube(0.16, 0.17, 0.44, goldM);
    shin.position.y = -0.22;
    knee.add(shin);

    var paw = ball(0.22, creamM, 12);
    paw.scale.set(1.15, 0.72, 1.0);
    paw.position.set(0.05, -0.44, 0);
    knee.add(paw);

    return { g: g, knee: knee, paw: paw, front: !!front };
  }

  var legFL = makeLeg(0.70, 0.36, true);
  var legFR = makeLeg(0.70, -0.36, true);
  var legRL = makeLeg(-0.72, 0.34, false);
  var legRR = makeLeg(-0.72, -0.34, false);
  var legs = [legFL, legFR, legRL, legRR];

  /* ---------- fluffy tail ---------- */
  var tail = new THREE.Group();
  tail.position.set(-1.22, 0.10, 0);
  torso.add(tail);
  var seg = [];
  for (var s = 0; s < 3; s++) {
    var sg = new THREE.Group();
    var puff = ball(0.24 - s * 0.02, goldM, 11);
    puff.scale.set(1.1, 0.92, 0.92);
    puff.position.x = -0.20;
    sg.add(puff);
    sg.position.x = s === 0 ? 0 : -0.20;
    if (s === 0) tail.add(sg); else seg[s - 1].add(sg);
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
      torsoRotZ: 0.26, torsoY: -0.14,
      flHip: 0.10, flKnee: -0.06,
      rlHip: 0.92, rlKnee: -1.34,
      tailRotZ: 0.55, headRotZ: 0.10, headY: 0.98
    },
    stand: {
      torsoRotZ: 0.0, torsoY: 0.10,
      flHip: 0, flKnee: 0,
      rlHip: 0, rlKnee: 0,
      tailRotZ: 0.30, headRotZ: 0, headY: 0.92
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
    trunk.scale.set(1.42, 1.02 * breath, 1.0 * breath);

    /* head: bob, look about, snap up on a bark */
    head.position.y = pose.headY + Math.sin(clock * 1.8) * 0.012 + happy * 0.05;
    head.rotation.z = pose.headRotZ - barkT * 0.34 + (moving ? Math.sin(walkPhase * 2 + 0.5) * 0.03 : 0);
    head.rotation.y = moving ? 0 : Math.sin(clock * 0.5) * 0.22;
    jaw.rotation.z = 0.10 + barkT * 0.55 + happy * 0.14;
    tongue.rotation.z = 0.30 + Math.sin(clock * 3) * 0.06 + happy * 0.2;

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
    lid.position.y = 0.24 - blink * 0.16;
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
    nose: nose, skull: skull, opticLens: opticLens, plateA: plateA,
    setSit: function (v) { sitOverride = v; sitAmt = v; },
    freeSit: function () { sitOverride = null; }
  };
})();
