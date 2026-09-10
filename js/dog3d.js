/* ============================================================
   dog3d.js — BYTE, a brown dog with salvaged parts.
   Lives in the bottom-right corner. Click him and he barks and
   offers a choice: pet him, or send him off for a walk.
   Three clicks in a row and he trots home.
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('dogCanvas');
  var bubble = document.getElementById('dogBubble');
  var menu = document.getElementById('dogMenu');
  if (!canvas) return;

  var B = window.Bench || {};
  var reduced = !!B.reduced;
  var SIZE = 260;
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
  var camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  camera.position.set(0.6, 1.9, 8.4);
  camera.lookAt(0, 0.55, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x4a4038, 0.86));
  var sun = new THREE.DirectionalLight(0xfff2e0, 0.85);
  sun.position.set(3, 6, 5);
  scene.add(sun);
  var cyan = new THREE.PointLight(0x2fd0e0, 0.5, 9);
  cyan.position.set(-1.4, 1.4, 1.6);
  scene.add(cyan);

  /* ---------- palette ---------- */
  var FUR = 0x7d4a24, FUR_D = 0x5d3517, FUR_L = 0xc39a63, NOSE = 0x211812;
  var METAL = 0x9aa4a9, METAL_D = 0x6d777c, GLOW = 0x2fd0e0, LED = 0xa3e635;

  function mat(color, shine, spec) {
    return new THREE.MeshPhongMaterial({
      color: color, shininess: shine === undefined ? 12 : shine,
      specular: spec === undefined ? 0x241a12 : spec
    });
  }
  function glowMat(color) { return new THREE.MeshBasicMaterial({ color: color }); }
  function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }
  function ball(r, m, seg) { return new THREE.Mesh(new THREE.SphereGeometry(r, seg || 16, seg || 14), m); }
  function tube(rt, rb, h, m) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 14), m); }

  var furMat = mat(FUR, 6), furD = mat(FUR_D, 5), furL = mat(FUR_L, 7);
  var metalMat = mat(METAL, 88, 0xe6f2f5), metalD = mat(METAL_D, 70, 0xbcd2d8);

  /* ---------- the dog. Faces +X. ---------- */
  var dog = new THREE.Group();
  dog.position.y = -0.30;
  scene.add(dog);

  var body = new THREE.Group();
  dog.add(body);

  /* torso: chest deeper than the hips, like an actual dog */
  var trunk = box(2.15, 1.02, 1.0, furMat);
  body.add(trunk);

  var chest = ball(0.60, furMat);
  chest.scale.set(1.05, 0.96, 0.92);
  chest.position.set(0.98, -0.02, 0);
  body.add(chest);

  var hips = ball(0.55, furMat);
  hips.scale.set(1.0, 0.94, 0.94);
  hips.position.set(-1.02, 0.04, 0);
  body.add(hips);

  var belly = box(1.9, 0.34, 0.86, furL);
  belly.position.set(0.05, -0.44, 0);
  body.add(belly);

  /* cyber plate riveted onto the near flank */
  var plate = box(0.92, 0.56, 0.06, metalD);
  plate.position.set(-0.15, 0.10, 0.52);
  body.add(plate);
  var seam = box(0.74, 0.05, 0.03, glowMat(GLOW));
  seam.position.set(-0.15, 0.10, 0.56);
  body.add(seam);
  for (var rv = 0; rv < 4; rv++) {
    var rivet = ball(0.035, metalMat, 8);
    rivet.position.set(-0.52 + rv * 0.25, 0.31, 0.55);
    body.add(rivet);
  }

  /* neck + head */
  var neck = tube(0.30, 0.36, 0.66, furMat);
  neck.position.set(1.16, 0.44, 0);
  neck.rotation.z = -0.62;
  body.add(neck);

  var head = new THREE.Group();
  head.position.set(1.52, 0.86, 0);
  body.add(head);

  var skull = ball(0.42, furMat);
  skull.scale.set(1.06, 0.98, 0.94);
  head.add(skull);

  var brow = box(0.36, 0.16, 0.66, furMat);
  brow.position.set(0.16, 0.16, 0);
  head.add(brow);

  var muzzle = box(0.56, 0.31, 0.44, furL);
  muzzle.position.set(0.52, -0.12, 0);
  head.add(muzzle);
  var muzzleTip = ball(0.20, furL);
  muzzleTip.scale.set(0.9, 0.86, 0.92);
  muzzleTip.position.set(0.76, -0.11, 0);
  head.add(muzzleTip);

  var jaw = new THREE.Group();
  jaw.position.set(0.30, -0.24, 0);
  head.add(jaw);
  var jawBox = box(0.48, 0.13, 0.38, furD);
  jawBox.position.set(0.22, -0.04, 0);
  jaw.add(jawBox);

  var nose = ball(0.115, mat(NOSE, 60, 0x555555));
  nose.scale.set(0.9, 0.8, 1.05);
  nose.position.set(0.90, -0.06, 0);
  head.add(nose);

  /* eyes: one his, one issued to him */
  var eyeL = ball(0.085, mat(0x140f0a, 90, 0xffffff), 12);
  eyeL.position.set(0.34, 0.10, 0.25);
  head.add(eyeL);

  var optic = new THREE.Group();
  optic.position.set(0.34, 0.10, -0.25);
  head.add(optic);
  var opticRing = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.035, 8, 18), metalMat);
  opticRing.rotation.y = Math.PI / 2;
  optic.add(opticRing);
  var opticLens = ball(0.075, glowMat(GLOW), 12);
  optic.add(opticLens);

  /* lid for blinking */
  var lidL = box(0.14, 0.10, 0.14, furMat);
  lidL.position.set(0.34, 0.19, 0.25);
  head.add(lidL);

  /* ears — floppy, one nicked and patched with metal */
  var earL = new THREE.Group();
  earL.position.set(-0.02, 0.30, 0.34);
  head.add(earL);
  var earLm = box(0.22, 0.52, 0.14, furD);
  earLm.position.y = -0.22;
  earL.add(earLm);
  earL.rotation.z = -0.18;
  earL.rotation.x = 0.30;

  var earR = new THREE.Group();
  earR.position.set(-0.02, 0.30, -0.34);
  head.add(earR);
  var earRm = box(0.20, 0.40, 0.13, furD);
  earRm.position.y = -0.18;
  earR.add(earRm);
  var earPatch = box(0.20, 0.18, 0.05, metalD);
  earPatch.position.set(0, -0.40, 0);
  earR.add(earPatch);
  earR.rotation.z = -0.10;
  earR.rotation.x = -0.34;

  /* antenna */
  var ant = tube(0.018, 0.026, 0.52, metalMat);
  ant.position.set(-0.16, 0.52, 0.12);
  ant.rotation.z = 0.28;
  head.add(ant);
  var antTip = ball(0.055, glowMat(LED), 10);
  antTip.position.set(-0.30, 0.76, 0.12);
  head.add(antTip);

  /* collar + tag */
  var collar = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.062, 8, 20), mat(0x1d5f68, 40, 0x7fd8e4));
  collar.position.set(1.22, 0.52, 0);
  collar.rotation.y = Math.PI / 2;
  collar.rotation.x = 0.62;
  body.add(collar);
  var tag = box(0.15, 0.17, 0.03, metalMat);
  tag.position.set(1.34, 0.24, 0.10);
  body.add(tag);

  /* ---------- legs ---------- */
  function makeLeg(x, z, cyber) {
    var g = new THREE.Group();
    g.position.set(x, -0.42, z);
    body.add(g);

    var upM = cyber ? metalD : furMat;
    var loM = cyber ? metalMat : furMat;

    var thigh = box(cyber ? 0.22 : 0.30, 0.52, cyber ? 0.22 : 0.30, upM);
    thigh.position.y = -0.24;
    g.add(thigh);

    var knee = new THREE.Group();
    knee.position.y = -0.48;
    g.add(knee);

    if (cyber) {
      var joint = ball(0.10, glowMat(GLOW), 10);
      knee.add(joint);
      var piston = tube(0.05, 0.05, 0.34, metalMat);
      piston.position.set(0.07, -0.20, 0);
      knee.add(piston);
    }

    var shin = box(cyber ? 0.17 : 0.24, 0.44, cyber ? 0.17 : 0.24, loM);
    shin.position.y = -0.22;
    knee.add(shin);

    var paw = box(0.30, 0.15, 0.34, cyber ? metalMat : furL);
    paw.position.set(0.04, -0.48, 0);
    knee.add(paw);
    if (cyber) {
      var toe = box(0.30, 0.05, 0.34, glowMat(GLOW));
      toe.position.set(0.04, -0.55, 0);
      knee.add(toe);
    }

    return { g: g, knee: knee, cyber: !!cyber };
  }

  /* the front near leg is the replacement */
  var legs = [
    makeLeg(0.86, 0.36, true),
    makeLeg(0.86, -0.36, false),
    makeLeg(-0.86, 0.36, false),
    makeLeg(-0.86, -0.36, false)
  ];

  /* ---------- tail ---------- */
  var tail = new THREE.Group();
  tail.position.set(-1.28, 0.26, 0);
  body.add(tail);
  var t1 = tube(0.11, 0.14, 0.42, furMat);
  t1.position.set(-0.14, 0.12, 0);
  t1.rotation.z = 1.05;
  tail.add(t1);
  var tail2 = new THREE.Group();
  tail2.position.set(-0.28, 0.26, 0);
  tail.add(tail2);
  var t2 = tube(0.075, 0.10, 0.38, furMat);
  t2.position.set(-0.10, 0.14, 0);
  t2.rotation.z = 0.75;
  tail2.add(t2);
  var tTip = tube(0.05, 0.075, 0.24, metalMat);
  tTip.position.set(-0.22, 0.28, 0);
  tTip.rotation.z = 0.55;
  tail2.add(tTip);
  var tLed = ball(0.045, glowMat(LED), 8);
  tLed.position.set(-0.29, 0.38, 0);
  tail2.add(tLed);

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
  for (var h = 0; h < 8; h++) {
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartTex, transparent: true, opacity: 0, depthTest: false }));
    sp.scale.set(0.42, 0.42, 1);
    sp.visible = false;
    sp.userData = { life: 0, vx: 0, vy: 0 };
    scene.add(sp);
    hearts.push(sp);
  }

  /* ---------- placement on screen ---------- */
  var MARGIN = 14;
  function homeX() { return Math.max(MARGIN, window.innerWidth - SIZE - MARGIN); }
  var pos = { x: homeX(), y: -MARGIN };
  var target = { x: pos.x, y: pos.y };
  var facing = -1;
  var faceAngle = -Math.PI / 2 * facing;

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
  var walkPhase = 0;
  var speed = 0;
  var wagBoost = 0;
  var barkT = 0;
  var happy = 0;
  var blink = 0, nextBlink = 2 + Math.random() * 3;
  var pauseT = 0;
  var clock = 0;

  var LINES = [
    'Woof! My front leg is under warranty.',
    'Woof woof! I run on 3.3 volts and snacks.',
    'Rrrf! I can smell a floating gate from here.',
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
    B.audio.tone(430, 0.09, 'square', 0.05);
    setTimeout(function () { B.audio.tone(330, 0.13, 'square', 0.045); }, 105);
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
    wagBoost = 1.6;
    pets++;
    if (B.store) B.store.set('pets', pets);
    if (petOut) petOut.textContent = pets;
    if (B.audio) {
      B.audio.tone(560, 0.1, 'triangle', 0.05);
      setTimeout(function () { B.audio.tone(760, 0.14, 'triangle', 0.045); }, 90);
    }
    var made = 0;
    for (var i = 0; i < hearts.length && made < 4; i++) {
      var s = hearts[i];
      if (s.userData.life > 0) continue;
      s.visible = true;
      s.position.set(0.9 + (Math.random() - 0.5) * 0.6, 1.3, 0.4);
      s.userData.life = 1;
      s.userData.vx = (Math.random() - 0.5) * 0.028;
      s.userData.vy = 0.026 + Math.random() * 0.018;
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
    if (B.audio) B.audio.tone(390, 0.12, 'triangle', 0.045);
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

  /* ---------- clicks on the dog ---------- */
  var clickTimes = [];

  function onDogClick() {
    var now = Date.now();
    clickTimes.push(now);
    clickTimes = clickTimes.filter(function (t) { return now - t < TRIPLE_MS; });

    /* the bark is immediate — it should feel like he heard you */
    bark();
    clearTimeout(pendingMenu);

    if (clickTimes.length >= 3) {
      clickTimes.length = 0;
      goHome();
      return;
    }

    /* stop him where he stands so the menu lines up with him */
    if (state === 'walking' || state === 'returning') {
      state = 'idle';
      target.x = pos.x;
      target.y = pos.y;
    }

    /* hold the menu back a beat, so clicks two and three of a
       triple-click don't flash it open and shut */
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

  /* ---------- theme ---------- */
  if (B.onTheme) {
    B.onTheme(function (c) {
      var dark = !!c.dark;
      sun.intensity = dark ? 0.62 : 0.85;
      furMat.color.setHex(dark ? 0x6b3f1f : FUR);
      furD.color.setHex(dark ? 0x4d2b12 : FUR_D);
      furL.color.setHex(dark ? 0xa98351 : FUR_L);
    });
  }

  /* ---------- loop ---------- */
  var running = true;
  document.addEventListener('visibilitychange', function () { running = !document.hidden; });

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

    var wantAngle = -Math.PI / 2 * facing;
    var diff = wantAngle - faceAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    faceAngle += diff * 0.14;
    dog.rotation.y = faceAngle;

    var moving = speed > 0.25;
    walkPhase += moving ? 0.055 + speed * 0.045 : 0.012;
    happy *= 0.975;
    wagBoost *= 0.965;
    barkT *= 0.90;

    var stride = moving ? 0.62 : 0.05;
    for (var i = 0; i < legs.length; i++) {
      var ph = walkPhase + (i === 0 || i === 3 ? 0 : Math.PI);
      var sw = Math.sin(ph) * stride;
      legs[i].g.rotation.z = sw;
      legs[i].knee.rotation.z = Math.max(0, Math.sin(ph + 0.9)) * stride * 0.9;
    }

    body.position.y = reduced ? 0 : Math.abs(Math.sin(walkPhase)) * (moving ? 0.06 : 0.018);
    body.rotation.z = moving ? Math.sin(walkPhase * 2) * 0.018 : Math.sin(clock * 1.3) * 0.008;

    var breath = 1 + Math.sin(clock * 1.9) * (moving ? 0.004 : 0.012);
    trunk.scale.set(1, breath, breath);

    head.rotation.z = -barkT * 0.42 + (moving ? Math.sin(walkPhase * 2 + 0.5) * 0.03 : 0);
    head.rotation.y = moving ? 0 : Math.sin(clock * 0.55) * 0.30;
    head.position.y = 0.86 + Math.sin(clock * 1.9) * 0.012 + happy * 0.05;
    jaw.rotation.z = barkT * 0.55 + happy * 0.12;

    earL.rotation.x = 0.30 + Math.sin(walkPhase * 2) * (moving ? 0.22 : 0.04) - happy * 0.3;
    earR.rotation.x = -0.34 - Math.sin(walkPhase * 2) * (moving ? 0.20 : 0.035) + happy * 0.28;

    var wag = 0.30 + wagBoost * 0.9 + (moving ? 0.25 : 0);
    tail.rotation.y = Math.sin(clock * (5 + wagBoost * 7)) * wag;
    tail2.rotation.y = Math.sin(clock * (5 + wagBoost * 7) - 0.5) * wag * 0.7;

    nextBlink -= 0.016;
    if (nextBlink <= 0) { blink = 1; nextBlink = 2.4 + Math.random() * 3.4; }
    blink *= 0.80;
    lidL.scale.y = 1 + blink * 2.6;
    lidL.position.y = 0.19 - blink * 0.09;
    eyeL.scale.y = Math.max(0.08, 1 - blink * 1.1) * (1 - happy * 0.55);
    opticLens.scale.setScalar(1 + Math.sin(clock * 3.4) * 0.10 + barkT * 0.3);
    antTip.material.color.setHex(Math.sin(clock * 3) > 0 ? LED : 0x4d7a12);
    tLed.material.color.setHex(Math.sin(clock * 3 + 1) > 0 ? LED : 0x4d7a12);
    cyan.intensity = 0.5 + Math.sin(clock * 3.4) * 0.12;

    for (i = 0; i < hearts.length; i++) {
      var s = hearts[i];
      if (s.userData.life <= 0) { s.visible = false; continue; }
      s.userData.life -= 0.016;
      s.position.x += s.userData.vx;
      s.position.y += s.userData.vy;
      s.material.opacity = Math.max(0, Math.min(1, s.userData.life)) * 0.95;
      s.scale.setScalar(0.30 + (1 - s.userData.life) * 0.22);
    }

    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  setTimeout(function () { if (on) say('Woof! Click me.', 3200); }, 2600);
})();
