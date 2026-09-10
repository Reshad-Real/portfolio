/* ============================================================
   dog3d.js — BYTE, the cyber-dog
   Follows the pointer around the whole page, can be petted,
   naps when you stop moving, and remembers how many boops it got.
   Rendered in a small fixed canvas that is moved with a CSS transform,
   so it costs almost nothing and never blocks a click.
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('dogCanvas');
  var bubble = document.getElementById('dogBubble');
  var toggle = document.getElementById('dogToggle');
  var counter = document.getElementById('petCount');
  var B = window.Bench || {};
  if (!canvas) return;

  var SIZE = 240;         // canvas box in CSS pixels
  var HALF = SIZE / 2;
  var PET_RADIUS = 78;    // how close the pointer must be to count as a pet

  var pets = parseInt((B.store ? B.store.get('pets', '0') : '0'), 10) || 0;
  if (counter) counter.textContent = String(pets);

  var visible = (B.store ? B.store.get('dog', '1') : '1') !== '0';

  if (!window.THREE) {
    canvas.style.display = 'none';
    if (toggle) toggle.style.display = 'none';
    return;
  }
  var THREE = window.THREE;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  } catch (e) {
    canvas.style.display = 'none';
    if (toggle) toggle.style.display = 'none';
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(SIZE, SIZE, false);
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;

  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(-HALF, HALF, HALF, -HALF, -400, 400);
  camera.position.set(0, 0, 100);
  camera.lookAt(0, 0, 0);

  var C = (B.colors ? B.colors() : null) || { teal: '#0c7b86', tealB: '#0aa3b0', copper: '#a35f31', lime: '#6dbb1c', dark: false };

  scene.add(new THREE.HemisphereLight(0xffffff, 0x33484f, 1.05));
  var sun = new THREE.DirectionalLight(0xffffff, 0.95);
  sun.position.set(3, 6, 8);
  scene.add(sun);
  var glow = new THREE.PointLight(new THREE.Color(C.tealB), 1.2, 260);
  glow.position.set(-40, 30, 60);
  scene.add(glow);

  /* ---------- materials ---------- */
  var M = {
    shell: new THREE.MeshStandardMaterial({ color: 0xf3f7f8, roughness: 0.55, metalness: 0.12 }),
    shell2: new THREE.MeshStandardMaterial({ color: 0xd9e3e6, roughness: 0.6, metalness: 0.15 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x27343a, roughness: 0.5, metalness: 0.3 }),
    accent: new THREE.MeshStandardMaterial({
      color: new THREE.Color(C.tealB), emissive: new THREE.Color(C.tealB),
      emissiveIntensity: 0.55, roughness: 0.35
    }),
    eye: new THREE.MeshStandardMaterial({
      color: new THREE.Color(C.tealB), emissive: new THREE.Color(C.tealB),
      emissiveIntensity: 1.5, roughness: 0.2
    }),
    warm: new THREE.MeshStandardMaterial({
      color: new THREE.Color(C.copper), emissive: new THREE.Color(C.copper),
      emissiveIntensity: 0.5, roughness: 0.4
    })
  };

  /* ---------- build BYTE ---------- */
  var dog = new THREE.Group();
  dog.scale.setScalar(34);
  scene.add(dog);

  var rig = new THREE.Group();       // everything that bobs
  dog.add(rig);

  // torso
  var torso = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.95, 1.0), M.shell);
  torso.position.set(0, 0.95, 0);
  rig.add(torso);

  // belly plate
  var belly = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.36, 1.02), M.shell2);
  belly.position.set(-0.05, 0.72, 0);
  rig.add(belly);

  // back vent light
  var vent = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.5), M.accent);
  vent.position.set(-0.1, 1.44, 0);
  rig.add(vent);

  // head group (turns toward the pointer)
  var head = new THREE.Group();
  head.position.set(0.72, 1.45, 0);
  rig.add(head);

  var skull = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.88, 0.9), M.shell);
  head.add(skull);

  var snout = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.4, 0.55), M.shell2);
  snout.position.set(0.62, -0.16, 0);
  head.add(snout);

  var nose = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), M.dark);
  nose.position.set(0.9, -0.1, 0);
  head.add(nose);

  // eyes
  var eyes = [];
  [-1, 1].forEach(function (s) {
    var e = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 12), M.eye);
    e.position.set(0.42, 0.12, s * 0.28);
    head.add(e);
    eyes.push(e);
  });

  // ears
  var ears = [];
  [-1, 1].forEach(function (s) {
    var pivot = new THREE.Group();
    pivot.position.set(-0.1, 0.42, s * 0.3);
    var earGeo = new THREE.ConeGeometry(0.22, 0.55, 4);
    earGeo.translate(0, 0.27, 0);
    var ear = new THREE.Mesh(earGeo, M.shell2);
    ear.rotation.y = Math.PI / 4;
    pivot.add(ear);
    var tip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), M.accent);
    tip.position.y = 0.56;
    pivot.add(tip);
    pivot.rotation.z = s * 0 + 0.16;
    head.add(pivot);
    ears.push(pivot);
  });

  // antenna
  var ant = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 8), M.dark);
  ant.position.set(-0.28, 0.66, 0);
  head.add(ant);
  var antTip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), M.warm);
  antTip.position.set(-0.28, 0.94, 0);
  head.add(antTip);

  // collar
  var collar = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.08, 8, 22), M.accent);
  collar.position.set(0.5, 1.16, 0);
  collar.rotation.y = Math.PI / 2;
  collar.rotation.x = 0.25;
  rig.add(collar);
  var tag = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.05), M.warm);
  tag.position.set(0.62, 0.82, 0);
  rig.add(tag);

  // legs — geometry shifted so each leg swings from the hip
  var legs = [];
  [[0.45, 0.32], [0.45, -0.32], [-0.45, 0.32], [-0.45, -0.32]].forEach(function (p, i) {
    var geo = new THREE.BoxGeometry(0.24, 0.62, 0.24);
    geo.translate(0, -0.31, 0);
    var leg = new THREE.Mesh(geo, i < 2 ? M.shell2 : M.shell2);
    leg.position.set(p[0], 0.52, p[1]);
    rig.add(leg);
    var paw = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.28), M.dark);
    paw.position.set(0, -0.6, 0);
    leg.add(paw);
    legs.push({ mesh: leg, phase: (i === 0 || i === 3) ? 0 : Math.PI });
  });

  // tail
  var tail = new THREE.Group();
  tail.position.set(-0.78, 1.2, 0);
  rig.add(tail);
  var tailGeo = new THREE.CylinderGeometry(0.07, 0.11, 0.62, 8);
  tailGeo.translate(0, 0.31, 0);
  var tailSeg = new THREE.Mesh(tailGeo, M.shell2);
  tailSeg.rotation.z = 0.9;
  tail.add(tailSeg);
  var tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), M.accent);
  tailTip.position.set(-0.48, 0.36, 0);
  tail.add(tailTip);

  /* ---------- heart particles ---------- */
  var heartTex = (function () {
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var g = c.getContext('2d');
    g.clearRect(0, 0, 64, 64);
    g.fillStyle = '#ff5d7a';
    g.beginPath();
    g.moveTo(32, 54);
    g.bezierCurveTo(4, 34, 10, 10, 32, 22);
    g.bezierCurveTo(54, 10, 60, 34, 32, 54);
    g.fill();
    return new THREE.CanvasTexture(c);
  })();
  var hearts = [];
  function spawnHeart() {
    var mat = new THREE.MeshBasicMaterial({ map: heartTex, transparent: true, depthWrite: false });
    var m = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), mat);
    m.position.set((Math.random() - 0.5) * 30, 30 + Math.random() * 10, 40);
    scene.add(m);
    hearts.push({ mesh: m, mat: mat, life: 0, vx: (Math.random() - 0.5) * 18, vy: 42 + Math.random() * 22 });
  }

  /* ---------- state ---------- */
  var w = window.innerWidth, h = window.innerHeight;
  var px = w - 170, py = h - 190;          // dog position, screen space
  var tx = px, ty = py;                    // target
  var vx = 0, vy = 0;
  var facing = -1, faceAngle = Math.PI + 0.5;
  var walk = 0, wag = 0, wagSpeed = 3;
  var idleTime = 0, sleeping = false;
  var petPulse = 0, near = false, hinted = false;
  var pointerSeen = false;
  var wanderT = 0;

  var LINES = [
    'Boop received.',
    'My tail runs off a 555 timer.',
    'Woof. That is 3.3 volts of love.',
    'I fetch packets, not sticks.',
    'Good human. Low noise floor.',
    'Scratch behind the heatsink.',
    'I sniff out floating nodes.',
    'My bark is 50 ohm terminated.',
    'Powered by one very happy cell.',
    'Recharging. Do not unplug.'
  ];
  var SLEEP_LINES = ['z z z', 'sleep mode · 0.1 mA', 'dreaming of clean signals'];

  function say(text, ms) {
    if (!bubble || !visible) return;
    bubble.textContent = text;
    bubble.classList.add('show');
    clearTimeout(say._t);
    say._t = setTimeout(function () { bubble.classList.remove('show'); }, ms || 2400);
  }

  /* ---------- pointer tracking ---------- */
  function setTarget(x, y) {
    pointerSeen = true;
    tx = x + 84;
    ty = y + 74;
    var m = 70;
    tx = Math.max(m, Math.min(w - m, tx));
    ty = Math.max(80, Math.min(h - m, ty));
    idleTime = 0;
    if (sleeping) {
      sleeping = false;
      say('Awake. What did I miss?', 1800);
    }
  }

  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    setTarget(e.clientX, e.clientY);
    checkNear(e.clientX, e.clientY);
  }, { passive: true });

  window.addEventListener('touchstart', function (e) {
    if (!e.touches || !e.touches.length) return;
    var t = e.touches[0];
    setTarget(t.clientX, t.clientY);
    if (dist(t.clientX, t.clientY) < PET_RADIUS + 20) pet();
  }, { passive: true });

  function dist(x, y) {
    var dx = x - px, dy = y - (py - 34);
    return Math.sqrt(dx * dx + dy * dy);
  }

  function checkNear(x, y) {
    var d = dist(x, y);
    var now = d < PET_RADIUS;
    if (now && !near && !hinted) {
      hinted = true;
      say('Click to pet me.', 2600);
    }
    near = now;
  }

  function pet() {
    if (!visible) return;
    pets++;
    if (B.store) B.store.set('pets', pets);
    if (counter) counter.textContent = String(pets);
    petPulse = 1;
    wagSpeed = 22;
    for (var i = 0; i < 4; i++) spawnHeart();
    if (B.audio) {
      B.audio.tone(660, 0.09, 'square', 0.05);
      setTimeout(function () { B.audio.tone(880, 0.11, 'square', 0.05); }, 90);
    }
    if (pets === 10) say('Ten boops. Maximum happiness reached.', 3200);
    else if (pets === 50) say('Fifty boops. You are my favourite node.', 3200);
    else say(LINES[Math.floor(Math.random() * LINES.length)], 2400);
  }

  window.addEventListener('click', function (e) {
    if (!visible) return;
    var t = e.target;
    // never steal a click that was meant for something on the page
    if (t && t.closest && t.closest('a, button, input, select, textarea, canvas, [role="tab"]')) return;
    if (dist(e.clientX, e.clientY) < PET_RADIUS) pet();
  });

  /* ---------- toggle ---------- */
  function applyVisible() {
    canvas.classList.toggle('off', !visible);
    if (toggle) toggle.setAttribute('aria-pressed', visible ? 'true' : 'false');
    if (!visible && bubble) bubble.classList.remove('show');
  }
  applyVisible();
  if (toggle) {
    toggle.addEventListener('click', function () {
      visible = !visible;
      if (B.store) B.store.set('dog', visible ? '1' : '0');
      applyVisible();
      if (visible) say('Back online.', 1800);
    });
  }

  /* ---------- theme ---------- */
  if (B.onTheme) {
    B.onTheme(function (c) {
      C = c;
      M.shell.color.set(c.dark ? 0x223038 : 0xf3f7f8);
      M.shell2.color.set(c.dark ? 0x1a262c : 0xd9e3e6);
      M.accent.color.set(c.tealB); M.accent.emissive.set(c.tealB);
      M.eye.color.set(c.tealB); M.eye.emissive.set(c.tealB);
      M.warm.color.set(c.copper); M.warm.emissive.set(c.copper);
      glow.color.set(c.tealB);
      glow.intensity = c.dark ? 2.1 : 1.2;
      sun.intensity = c.dark ? 0.5 : 0.95;
    });
  }

  window.addEventListener('resize', function () {
    w = window.innerWidth; h = window.innerHeight;
    px = Math.min(px, w - 60); py = Math.min(py, h - 60);
  });

  /* ---------- shortest-path angle lerp ---------- */
  function angleLerp(from, to, t) {
    var d = ((to - from + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (d < -Math.PI) d += Math.PI * 2;
    return from + d * t;
  }

  /* ---------- loop ---------- */
  var clock = new THREE.Clock();
  var paused = false;
  document.addEventListener('visibilitychange', function () { paused = document.hidden; });

  function frame() {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, clock.getDelta());
    if (paused || !visible) return;
    var t = clock.elapsedTime;

    idleTime += dt;

    // with no mouse (touch devices) BYTE patrols the bottom of the screen
    if (!pointerSeen) {
      wanderT += dt * 0.25;
      tx = w * 0.5 + Math.sin(wanderT) * (w * 0.32);
      ty = h - 120;
    } else if (idleTime > 16 && !sleeping) {
      sleeping = true;
      say(SLEEP_LINES[Math.floor(Math.random() * SLEEP_LINES.length)], 3000);
    }

    // spring toward the target
    var k = sleeping ? 1.4 : 4.2;
    var ax = (tx - px) * k, ay = (ty - py) * k;
    vx += ax * dt; vy += ay * dt;
    vx *= 0.86; vy *= 0.86;
    px += vx * dt; py += vy * dt;

    var speed = Math.sqrt(vx * vx + vy * vy);

    // face the direction of travel
    if (Math.abs(vx) > 22) facing = vx > 0 ? 1 : -1;
    var wanted = facing > 0 ? -0.5 : (Math.PI + 0.5);
    faceAngle = angleLerp(faceAngle, wanted, Math.min(1, dt * 6));
    dog.rotation.y = faceAngle;

    // move the canvas box, not the whole viewport
    canvas.style.transform = 'translate3d(' + (px - HALF) + 'px,' + (py - HALF) + 'px,0)';

    if (bubble && bubble.classList.contains('show')) {
      bubble.style.left = px + 'px';
      bubble.style.top = (py - 74) + 'px';
    }

    // gait
    var moving = speed > 30;
    walk += dt * (moving ? Math.min(16, 4 + speed * 0.035) : 0);
    var swing = moving ? 0.62 : 0;
    for (var i = 0; i < legs.length; i++) {
      legs[i].mesh.rotation.z = Math.sin(walk + legs[i].phase) * swing;
    }

    // body bob and lean
    petPulse = Math.max(0, petPulse - dt * 1.4);
    var bob = moving ? Math.abs(Math.sin(walk * 1.0)) * 0.07 : Math.sin(t * 1.8) * 0.035;
    rig.position.y = bob + petPulse * 0.45;
    rig.rotation.z = Math.max(-0.16, Math.min(0.16, -vx * 0.00045));

    // tail
    wagSpeed += ((moving ? 9 : 4.5) - wagSpeed) * Math.min(1, dt * 1.6);
    wag += dt * wagSpeed;
    tail.rotation.y = Math.sin(wag) * (0.5 + petPulse * 0.5);
    tail.rotation.z = Math.sin(wag * 0.5) * 0.12;

    // head looks slightly toward the pointer, ears perk when close
    var lookY = Math.max(-0.5, Math.min(0.5, (tx - px) * 0.004));
    var lookX = Math.max(-0.35, Math.min(0.35, (ty - py) * 0.004));
    head.rotation.y = lookY * facing;
    head.rotation.x = lookX;
    var perk = (near || petPulse > 0) ? -0.32 : 0.16;
    for (var e2 = 0; e2 < ears.length; e2++) {
      ears[e2].rotation.z += (perk - ears[e2].rotation.z) * Math.min(1, dt * 7);
    }

    // eyes: blink, squint when happy, dim when asleep
    var blink = (Math.sin(t * 0.9) > 0.985) ? 0.12 : 1;
    var squint = petPulse > 0.15 ? 0.35 : 1;
    var open = sleeping ? 0.1 : Math.min(blink, squint);
    for (var e3 = 0; e3 < eyes.length; e3++) {
      eyes[e3].scale.y += (open - eyes[e3].scale.y) * Math.min(1, dt * 14);
    }
    M.eye.emissiveIntensity = sleeping ? 0.25 : 1.4 + petPulse * 1.6;
    M.warm.emissiveIntensity = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 3.4));
    M.accent.emissiveIntensity = 0.45 + petPulse * 0.9;

    // hearts
    for (var hI = hearts.length - 1; hI >= 0; hI--) {
      var H = hearts[hI];
      H.life += dt;
      H.mesh.position.x += H.vx * dt;
      H.mesh.position.y += H.vy * dt;
      H.mesh.rotation.z = Math.sin(H.life * 4) * 0.3;
      H.mat.opacity = Math.max(0, 1 - H.life / 1.5);
      if (H.life > 1.5) {
        scene.remove(H.mesh);
        H.mesh.geometry.dispose();
        H.mat.dispose();
        hearts.splice(hI, 1);
      }
    }

    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  // a small hello, once the page has settled
  setTimeout(function () {
    if (visible) say(pets > 0 ? 'Back again. ' + pets + ' boops so far.' : 'I am BYTE. Follow me around.', 3200);
  }, 5200);
})();
