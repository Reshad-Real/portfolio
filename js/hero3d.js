/* ============================================================
   hero3d.js — the interactive board in the hero
   Drag to spin, hover a chip to read it, click a chip to fire a signal.
   Degrades to a static page if WebGL or three.js is unavailable.
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('heroCanvas');
  var fallback = document.getElementById('heroFallback');
  var hero = document.getElementById('hero');
  var hudRead = document.getElementById('hudRead');
  var hudHint = document.getElementById('hudHint');
  var B = window.Bench || {};

  function bail() {
    if (canvas) canvas.style.display = 'none';
    if (fallback) fallback.hidden = false;
  }

  if (!canvas || !hero) return;
  if (!window.THREE) { bail(); return; }

  var THREE = window.THREE;
  var renderer, scene, camera;

  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { bail(); return; }
  if (!renderer || !renderer.getContext || !renderer.getContext()) { bail(); return; }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);
  camera.position.set(0, 7.2, 10.4);
  camera.lookAt(0, 0, 0);

  var colors = (B.colors ? B.colors() : null) || { teal: '#0c7b86', tealB: '#0aa3b0', copper: '#a35f31', lime: '#6dbb1c', surface: '#ffffff', line: '#bccacc', dark: false };
  var reduced = !!B.reduced;

  /* ---------- lights ---------- */
  var hemi = new THREE.HemisphereLight(0xffffff, 0x445055, 1.0);
  scene.add(hemi);
  var key = new THREE.DirectionalLight(0xffffff, 1.05);
  key.position.set(5, 9, 6);
  scene.add(key);
  var rim = new THREE.PointLight(new THREE.Color(colors.tealB), 1.1, 30);
  rim.position.set(-6, 4, -5);
  scene.add(rim);
  var warm = new THREE.PointLight(new THREE.Color(colors.copper), 0.8, 26);
  warm.position.set(6, 3.4, 4);
  scene.add(warm);

  /* ---------- the board ---------- */
  var W = 11, D = 7.4, T = 0.34;
  var board = new THREE.Group();
  scene.add(board);

  function maskTexture(dark) {
    var c = document.createElement('canvas');
    c.width = 512; c.height = 344;
    var g = c.getContext('2d');
    g.fillStyle = dark ? '#0b1c1a' : '#e9efec';
    g.fillRect(0, 0, c.width, c.height);
    // faint routing grid
    g.strokeStyle = dark ? 'rgba(120,220,225,.10)' : 'rgba(20,80,90,.10)';
    g.lineWidth = 1;
    for (var x = 0; x <= c.width; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, c.height); g.stroke(); }
    for (var y = 0; y <= c.height; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(c.width, y); g.stroke(); }
    // silkscreen speckle of vias
    g.fillStyle = dark ? 'rgba(180,140,90,.30)' : 'rgba(150,95,50,.28)';
    for (var i = 0; i < 140; i++) {
      var px = Math.random() * c.width, py = Math.random() * c.height;
      g.beginPath(); g.arc(px, py, 1.6, 0, Math.PI * 2); g.fill();
    }
    var tex = new THREE.CanvasTexture(c);
    if (renderer.capabilities && renderer.capabilities.getMaxAnisotropy) {
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    }
    return tex;
  }

  var topTex = maskTexture(colors.dark);
  var edgeMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(colors.dark ? 0x0d2320 : 0xd7e0da), roughness: 0.85, metalness: 0.05 });
  var topMat = new THREE.MeshStandardMaterial({ map: topTex, roughness: 0.72, metalness: 0.08 });
  var boardMesh = new THREE.Mesh(
    new THREE.BoxGeometry(W, T, D),
    [edgeMat, edgeMat, topMat, edgeMat, edgeMat, edgeMat]
  );
  board.add(boardMesh);

  var TOP = T / 2;

  /* ---------- copper traces (also the routes the packets take) ---------- */
  var copperMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colors.copper), roughness: 0.35, metalness: 0.75
  });
  var padMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colors.copper), roughness: 0.3, metalness: 0.85
  });

  var routes = [
    [[-5.2, -2.6], [-2.9, -2.6], [-2.9, -0.6], [-1.6, -0.6]],
    [[-5.2, 1.9], [-3.6, 1.9], [-3.6, 0.5], [-2.4, 0.5]],
    [[-1.6, 0.9], [0.4, 0.9], [0.4, -1.6], [1.7, -1.6]],
    [[-1.0, -0.9], [0.9, -0.9], [0.9, 1.4], [2.1, 1.4]],
    [[-0.6, 0.6], [-0.6, 2.4], [0.1, 2.4]],
    [[3.1, -1.6], [4.6, -1.6], [4.6, 2.9], [1.2, 2.9]],
    [[5.2, 0.4], [3.6, 0.4], [3.6, 1.4], [3.2, 1.4]],
    [[-4.2, -1.9], [-4.2, 3.0], [-1.2, 3.0]]
  ];

  function addTrace(pts) {
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1];
      var dx = Math.abs(b[0] - a[0]), dz = Math.abs(b[1] - a[1]);
      var len = Math.max(dx, dz) + 0.09;
      var geo = new THREE.BoxGeometry(dx > dz ? len : 0.09, 0.035, dz >= dx ? len : 0.09);
      var m = new THREE.Mesh(geo, copperMat);
      m.position.set((a[0] + b[0]) / 2, TOP + 0.018, (a[1] + b[1]) / 2);
      board.add(m);
    }
    // vias at every corner and endpoint
    for (var j = 0; j < pts.length; j++) {
      var via = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.06, 12), padMat);
      via.position.set(pts[j][0], TOP + 0.03, pts[j][1]);
      board.add(via);
    }
  }
  for (var r = 0; r < routes.length; r++) addTrace(routes[r]);

  /* ---------- edge connector fingers ---------- */
  for (var f = 0; f < 9; f++) {
    var fin = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.9), padMat);
    fin.position.set(-W / 2 + 0.6 + f * 0.52, TOP + 0.02, D / 2 - 0.62);
    board.add(fin);
  }

  /* ---------- chips ---------- */
  function labelTexture(text, sub, dark) {
    var c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    var g = c.getContext('2d');
    g.fillStyle = dark ? '#11181c' : '#1b2428';
    g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = 'rgba(255,255,255,.10)';
    g.lineWidth = 4;
    g.strokeRect(6, 6, c.width - 12, c.height - 12);
    g.fillStyle = 'rgba(255,255,255,.16)';
    g.beginPath(); g.arc(30, 30, 9, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f2f7f7';
    g.font = '600 30px "JetBrains Mono", monospace';
    g.textAlign = 'center';
    g.fillText(text, c.width / 2, 62);
    g.fillStyle = 'rgba(220,240,240,.55)';
    g.font = '400 18px "JetBrains Mono", monospace';
    g.fillText(sub, c.width / 2, 92);
    return new THREE.CanvasTexture(c);
  }

  var chipDefs = [
    { id: 'U1', x: -1.6, z: -0.1, w: 2.4, d: 1.7, label: 'AS³', sub: 'GaN tri-gate', read: 'U1 · 5 nm AlGaN/GaN tri-gate FinFET' },
    { id: 'U2', x: 2.4, z: -1.6, w: 1.5, d: 1.2, label: 'TCAD', sub: 'Silvaco Atlas', read: 'U2 · Silvaco Atlas device modelling' },
    { id: 'U3', x: 2.7, z: 1.4, w: 1.3, d: 1.3, label: 'DT', sub: 'digital twin', read: 'U3 · digital-twin simulation of EV charging' },
    { id: 'U4', x: -4.2, z: -1.9, w: 1.2, d: 1.0, label: 'BIO', sub: 'e-skin', read: 'U4 · self-powered e-skin biosensor' },
    { id: 'U5', x: 0.6, z: 2.5, w: 1.4, d: 1.0, label: 'EDU', sub: '3 courses', read: 'U5 · circuits, electronics, energy conversion' }
  ];

  var chips = [];
  var pinMat = new THREE.MeshStandardMaterial({ color: 0xc9ced1, roughness: 0.3, metalness: 0.9 });

  chipDefs.forEach(function (def) {
    var grp = new THREE.Group();
    grp.position.set(def.x, TOP, def.z);

    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x1b2428, roughness: 0.55, metalness: 0.25 });
    var faceMat = new THREE.MeshStandardMaterial({ map: labelTexture(def.label, def.sub, colors.dark), roughness: 0.5, metalness: 0.2 });
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(def.w, 0.3, def.d),
      [bodyMat, bodyMat, faceMat, bodyMat, bodyMat, bodyMat]
    );
    body.position.y = 0.15;
    body.userData.chip = def.id;
    grp.add(body);

    var pins = Math.max(4, Math.round(def.w / 0.26));
    for (var p = 0; p < pins; p++) {
      var off = -def.w / 2 + 0.16 + p * ((def.w - 0.32) / Math.max(1, pins - 1));
      [-1, 1].forEach(function (side) {
        var pin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.22), pinMat);
        pin.position.set(off, 0.05, side * (def.d / 2 + 0.09));
        grp.add(pin);
      });
    }

    // A static hit target. The visible chip lifts when hovered, and if we
    // raycast against that it can rise out from under the cursor and flicker.
    var hit = new THREE.Mesh(
      new THREE.BoxGeometry(def.w + 0.3, 0.8, def.d + 0.3),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hit.position.set(def.x, TOP + 0.3, def.z);
    board.add(hit);

    board.add(grp);
    chips.push({ def: def, group: grp, body: body, hit: hit, lift: 0, target: 0 });
  });

  /* ---------- discrete components ---------- */
  var capMat = new THREE.MeshStandardMaterial({ color: 0x2a3338, roughness: 0.5, metalness: 0.4 });
  var capTop = new THREE.MeshStandardMaterial({ color: 0xa9b4b8, roughness: 0.35, metalness: 0.8 });
  var capSpots = [[-3.2, 2.2], [-2.4, 2.2], [4.3, -2.7], [3.5, -2.7], [0.2, -2.6]];
  capSpots.forEach(function (s) {
    var cap = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.62, 18), [capMat, capTop, capMat]);
    cap.position.set(s[0], TOP + 0.31, s[1]);
    board.add(cap);
  });

  var resBodyMat = new THREE.MeshStandardMaterial({ color: 0xd8c49a, roughness: 0.7, metalness: 0.05 });
  var resSpots = [[-4.6, 0.9], [-4.6, 1.6], [1.9, 2.6], [-0.9, -2.5]];
  resSpots.forEach(function (s) {
    var res = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.62, 14), resBodyMat);
    res.rotation.z = Math.PI / 2;
    res.position.set(s[0], TOP + 0.14, s[1]);
    board.add(res);
    for (var k = -1; k <= 1; k++) {
      var bandMat = new THREE.MeshStandardMaterial({ color: [0xc0392b, 0x2d6cdf, 0x2b2b2b][k + 1], roughness: 0.6 });
      var band = new THREE.Mesh(new THREE.CylinderGeometry(0.142, 0.142, 0.08, 14), bandMat);
      band.rotation.z = Math.PI / 2;
      band.position.set(s[0] + k * 0.14, TOP + 0.14, s[1]);
      board.add(band);
    }
  });

  /* ---------- indicator LEDs ---------- */
  var leds = [];
  var ledSpots = [[-5.0, -0.4], [-5.0, 0.1], [5.0, -2.9], [5.0, -2.4]];
  ledSpots.forEach(function (s, i) {
    var mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colors.lime),
      emissive: new THREE.Color(colors.lime),
      emissiveIntensity: 0.5, roughness: 0.25
    });
    var led = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 12), mat);
    led.position.set(s[0], TOP + 0.12, s[1]);
    board.add(led);
    leds.push({ mesh: led, mat: mat, phase: i * 0.9 });
  });

  /* ---------- signal packets ---------- */
  var packetMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(colors.tealB) });
  var packets = [];

  function routeLength(pts) {
    var total = 0;
    for (var i = 0; i < pts.length - 1; i++) {
      total += Math.abs(pts[i + 1][0] - pts[i][0]) + Math.abs(pts[i + 1][1] - pts[i][1]);
    }
    return total;
  }
  function pointAt(pts, dist) {
    var travelled = 0;
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1];
      var seg = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
      if (travelled + seg >= dist) {
        var t = seg === 0 ? 0 : (dist - travelled) / seg;
        return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      }
      travelled += seg;
    }
    var last = pts[pts.length - 1];
    return [last[0], last[1]];
  }

  routes.forEach(function (pts, i) {
    var count = 2;
    var len = routeLength(pts);
    for (var n = 0; n < count; n++) {
      var mesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), packetMat);
      mesh.position.y = TOP + 0.09;
      board.add(mesh);
      packets.push({
        mesh: mesh, pts: pts, len: len,
        d: (len / count) * n + i * 0.4,
        speed: 1.5 + (i % 3) * 0.35
      });
    }
  });

  /* ---------- click ripples ---------- */
  var ripples = [];
  function ripple(x, z) {
    var mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colors.tealB), transparent: true, opacity: 0.85, side: THREE.DoubleSide
    });
    var mesh = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.42, 40), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, TOP + 0.06, z);
    board.add(mesh);
    ripples.push({ mesh: mesh, mat: mat, life: 0 });
  }

  /* ---------- interaction ---------- */
  var yaw = -0.32, pitch = 0.05;
  var yawV = 0, pitchV = 0;
  var dragging = false, moved = false;
  var lastX = 0, lastY = 0, downX = 0, downY = 0;
  var pointer = new THREE.Vector2(-10, -10);
  var raycaster = new THREE.Raycaster();
  var hovered = null;
  var boost = 0;

  function setPointer(ev) {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  }

  canvas.addEventListener('pointerdown', function (ev) {
    dragging = true; moved = false;
    lastX = downX = ev.clientX;
    lastY = downY = ev.clientY;
    setPointer(ev);
    if (canvas.setPointerCapture) { try { canvas.setPointerCapture(ev.pointerId); } catch (e) {} }
  });

  window.addEventListener('pointermove', function (ev) {
    setPointer(ev);
    if (!dragging) return;
    var dx = ev.clientX - lastX, dy = ev.clientY - lastY;
    lastX = ev.clientX; lastY = ev.clientY;
    if (Math.abs(ev.clientX - downX) + Math.abs(ev.clientY - downY) > 6) moved = true;
    yawV += dx * 0.00042;
    pitchV += dy * 0.00028;
  });

  function endDrag(ev) {
    if (!dragging) return;
    dragging = false;
    if (!moved && ev) {
      setPointer(ev);
      pickChip(true);
    }
  }
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', function () { dragging = false; });
  canvas.addEventListener('pointerleave', function () { pointer.set(-10, -10); });

  function pickChip(click) {
    raycaster.setFromCamera(pointer, camera);
    var meshes = chips.map(function (c) { return c.hit; });
    var hits = raycaster.intersectObjects(meshes, false);
    var target = hits.length ? hits[0].object : null;
    var found = null;
    for (var i = 0; i < chips.length; i++) if (chips[i].hit === target) found = chips[i];

    if (found !== hovered) {
      hovered = found;
      canvas.style.cursor = found ? 'pointer' : 'grab';
      if (hudRead) hudRead.textContent = found ? found.def.read : 'U0 · idle';
    }
    for (var j = 0; j < chips.length; j++) chips[j].target = (chips[j] === found) ? 0.26 : 0;

    if (click && found) {
      ripple(found.def.x, found.def.z);
      boost = 1;
      if (hudHint) hudHint.textContent = 'signal fired from ' + found.def.id;
      if (B.audio) B.audio.tone(330 + chips.indexOf(found) * 90, 0.14, 'square', 0.05);
    }
  }

  /* ---------- theme sync ---------- */
  function applyTheme(c) {
    colors = c;
    if (topMat.map) topMat.map.dispose();
    topMat.map = maskTexture(c.dark);
    topMat.needsUpdate = true;
    edgeMat.color.set(c.dark ? 0x0d2320 : 0xd7e0da);
    copperMat.color.set(c.copper);
    padMat.color.set(c.copper);
    packetMat.color.set(c.tealB);
    rim.color.set(c.tealB);
    warm.color.set(c.copper);
    hemi.intensity = c.dark ? 0.42 : 1.0;
    key.intensity = c.dark ? 0.55 : 1.05;
    rim.intensity = c.dark ? 2.0 : 1.1;
    warm.intensity = c.dark ? 1.5 : 0.8;
    leds.forEach(function (l) { l.mat.color.set(c.lime); l.mat.emissive.set(c.lime); });
    chips.forEach(function (ch) {
      var mats = ch.body.material;
      if (mats && mats[2]) {
        if (mats[2].map) mats[2].map.dispose();
        mats[2].map = labelTexture(ch.def.label, ch.def.sub, c.dark);
        mats[2].needsUpdate = true;
      }
    });
  }
  if (B.onTheme) B.onTheme(applyTheme);
  applyTheme(colors);

  /* ---------- resize ---------- */
  function resize() {
    var w = hero.clientWidth || window.innerWidth;
    var h = hero.clientHeight || window.innerHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // pull the camera back on narrow screens so the whole board stays in frame
    var narrow = Math.min(1, w / 1100);
    camera.position.set(0, 7.2 + (1 - narrow) * 3.4, 10.4 + (1 - narrow) * 6.2);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);
  setTimeout(resize, 300);

  /* ---------- render loop ---------- */
  var running = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      running = entries[0].isIntersecting;
    }, { threshold: 0.02 }).observe(hero);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) running = false;
    else running = true;
  });

  var clock = new THREE.Clock();
  canvas.style.cursor = 'grab';

  function frame() {
    requestAnimationFrame(frame);
    if (!running) { clock.getDelta(); return; }

    var dt = Math.min(0.05, clock.getDelta());
    var t = clock.elapsedTime;

    // rotation with inertia
    if (!dragging && !reduced) yawV += 0.00007;
    yaw += yawV;
    pitch += pitchV;
    yawV *= 0.92;
    pitchV *= 0.9;
    pitch = Math.max(-0.42, Math.min(0.52, pitch));
    board.rotation.y = yaw;
    board.rotation.x = pitch;
    if (!reduced) board.position.y = Math.sin(t * 0.7) * 0.12;

    if (!dragging) pickChip(false);

    // chips lift under the cursor
    for (var i = 0; i < chips.length; i++) {
      var ch = chips[i];
      ch.lift += (ch.target - ch.lift) * Math.min(1, dt * 9);
      ch.group.position.y = TOP + ch.lift;
    }

    // packets
    boost = Math.max(0, boost - dt * 0.9);
    var mult = 1 + boost * 3;
    for (var p = 0; p < packets.length; p++) {
      var pk = packets[p];
      pk.d += pk.speed * mult * dt;
      if (pk.d > pk.len) pk.d -= pk.len;
      var pos = pointAt(pk.pts, pk.d);
      pk.mesh.position.x = pos[0];
      pk.mesh.position.z = pos[1];
      var s = 1 + boost * 0.8;
      pk.mesh.scale.set(s, s, s);
    }

    // blinking indicators
    for (var l = 0; l < leds.length; l++) {
      var v = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 2.2 + leds[l].phase));
      leds[l].mat.emissiveIntensity = v + boost;
    }

    // ripples
    for (var rp = ripples.length - 1; rp >= 0; rp--) {
      var R = ripples[rp];
      R.life += dt;
      var k = R.life / 1.1;
      R.mesh.scale.setScalar(1 + k * 9);
      R.mat.opacity = Math.max(0, 0.85 * (1 - k));
      if (k >= 1) {
        board.remove(R.mesh);
        R.mesh.geometry.dispose();
        R.mat.dispose();
        ripples.splice(rp, 1);
      }
    }

    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
})();
