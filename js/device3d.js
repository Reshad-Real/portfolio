/* ============================================================
   device3d.js — the hero object: a 5 nm AlGaN/GaN AS³-FinFET.
   Drag to rotate. Hover a layer to read it. Click to isolate it.
   The gate-bias switch actually opens and closes the channel.
   Lives in a right-hand panel, never full screen.
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('deviceCanvas');
  var fallback = document.getElementById('deviceFallback');
  if (!canvas) return;

  var B = window.Bench || {};
  var reduced = !!B.reduced;
  var readout = document.getElementById('devRead');
  var current = document.getElementById('devCurrent');
  var biasBtn = document.getElementById('biasBtn');
  var explodeBtn = document.getElementById('explodeBtn');
  var hint = document.getElementById('devHint');

  function bail() {
    canvas.style.display = 'none';
    if (fallback) fallback.hidden = false;
    var tools = document.getElementById('devTools');
    if (tools) tools.hidden = true;
  }

  if (!window.THREE) { bail(); return; }

  /* ---------- renderer ---------- */
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    if (!renderer.getContext()) throw new Error('no gl');
  } catch (e) { bail(); return; }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(36, 1, 0.1, 120);
  camera.position.set(8.2, 6.6, 10.4);
  camera.lookAt(0, 2.1, 0);

  var key = new THREE.DirectionalLight(0xffffff, 0.92);
  key.position.set(6, 11, 8);
  scene.add(key);
  var rim = new THREE.DirectionalLight(0x9fe8f2, 0.42);
  rim.position.set(-8, 4, -6);
  scene.add(rim);
  var hemi = new THREE.HemisphereLight(0xffffff, 0x5a6a70, 0.62);
  scene.add(hemi);

  var device = new THREE.Group();
  device.rotation.y = -0.5;
  scene.add(device);

  /* ---------- helpers ---------- */
  function hex(c) { return new THREE.Color(c).getHex(); }

  function slab(w, h, d, color, opts) {
    opts = opts || {};
    var mat = new THREE.MeshPhongMaterial({
      color: hex(color),
      shininess: opts.shine === undefined ? 26 : opts.shine,
      specular: hex(opts.spec || '#2b3538'),
      transparent: !!opts.opacity && opts.opacity < 1,
      opacity: opts.opacity === undefined ? 1 : opts.opacity,
      flatShading: !!opts.flat
    });
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  }

  function labelSprite(text, color) {
    var c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    var g = c.getContext('2d');
    if (g) {
      g.clearRect(0, 0, 256, 128);
      g.font = 'bold 66px ui-monospace, "JetBrains Mono", monospace';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = color;
      g.fillText(text, 128, 66);
    }
    var tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sp.scale.set(1.5, 0.75, 1);
    sp.userData.tex = tex;
    return sp;
  }

  /* ---------- the stack ----------
     Everything is sized in arbitrary units; the point is the shape of the
     device, not a to-scale drawing of a 5 nm gate.                       */
  var W = 8.0, D = 5.2;
  var parts = [];

  function addPart(def) {
    var m = def.mesh;
    m.position.set(def.x || 0, def.y, def.z || 0);
    device.add(m);
    var p = {
      id: def.id, name: def.name, info: def.info, mesh: m,
      baseY: def.y, outY: def.y + (def.out || 0),
      baseColor: def.color, dim: 0, sel: 0, hoverT: 0
    };
    parts.push(p);
    return p;
  }

  var C = {
    sub: '#3d474b', buf: '#1d5f68', bar: '#2f8f9b', fin: '#3aa6b4',
    gate: '#b4762f', sd: '#8d949a', pass: '#c9d2d4'
  };

  var pSub = addPart({
    id: 'SUB', name: 'Si substrate', y: 0.40, out: -1.5, color: C.sub,
    mesh: slab(W, 0.80, D, C.sub, { shine: 8, flat: true }),
    info: 'Silicon handle wafer. Cheap, thermally sane, and the reason GaN-on-Si scaled at all.'
  });
  var pBuf = addPart({
    id: 'BUF', name: 'GaN buffer', y: 1.25, out: -0.6, color: C.buf,
    mesh: slab(W, 0.90, D, C.buf, { shine: 30 }),
    info: 'Thick GaN buffer with a graded transition. Its job is to swallow lattice mismatch and keep leakage down.'
  });
  var pBar = addPart({
    id: 'BAR', name: 'AlGaN barrier', y: 1.82, out: 0.5, color: C.bar,
    mesh: slab(W, 0.24, D, C.bar, { shine: 70, spec: '#8fe6f0' }),
    info: 'AlGaN barrier. Spontaneous and piezoelectric polarisation here is what forms the 2DEG underneath.'
  });

  /* fins */
  var finGroup = new THREE.Group();
  device.add(finGroup);
  var FIN_Y = 2.50, FIN_H = 1.12, FIN_W = 5.6, FIN_T = 0.60;
  var finZ = [-1.55, 0, 1.55];
  var fins = [];
  for (var i = 0; i < finZ.length; i++) {
    var f = slab(FIN_W, FIN_H, FIN_T, C.fin, { shine: 60, spec: '#7fd8e4' });
    f.position.set(0, FIN_Y, finZ[i]);
    finGroup.add(f);
    fins.push(f);
  }
  var pFin = {
    id: 'FIN', name: 'AS³ tri-gate fins', info: 'Three asymmetric-spacer fins. Wrapping the gate on three sides is what keeps short-channel effects survivable at 5 nm.',
    mesh: fins[1], group: finGroup, baseY: 0, outY: 0.9, dim: 0, sel: 0, hoverT: 0, baseColor: C.fin, extra: fins
  };
  parts.push(pFin);

  /* channel glow strips — the 2DEG */
  var glows = [];
  for (i = 0; i < finZ.length; i++) {
    var gmat = new THREE.MeshBasicMaterial({ color: hex('#a3e635'), transparent: true, opacity: 0 });
    var gl = new THREE.Mesh(new THREE.BoxGeometry(FIN_W + 0.02, 0.10, FIN_T + 0.04), gmat);
    gl.position.set(0, FIN_Y - FIN_H / 2 + 0.06, finZ[i]);
    finGroup.add(gl);
    glows.push(gl);
  }

  /* gate */
  var gateMesh = slab(1.55, 1.95, D - 0.2, C.gate, { shine: 92, spec: '#ffd9a8', opacity: 0.9 });
  var pGate = addPart({
    id: 'GATE', name: 'Wrap-around gate', y: 2.62, out: 1.5, color: C.gate,
    mesh: gateMesh,
    info: 'The gate metal, wrapped over and around every fin. Bias it and the channel below opens.'
  });

  /* source / drain */
  var pSrc = addPart({
    id: 'SRC', name: 'Source', y: 2.42, x: -3.30, out: 0.9, color: C.sd,
    mesh: slab(1.20, 1.45, D - 0.5, C.sd, { shine: 84, spec: '#e8eef0' }),
    info: 'Heavily doped source contact. Electrons are injected here.'
  });
  var pDrn = addPart({
    id: 'DRN', name: 'Drain', y: 2.42, x: 3.30, out: 0.9, color: C.sd,
    mesh: slab(1.20, 1.45, D - 0.5, C.sd, { shine: 84, spec: '#e8eef0' }),
    info: 'Drain contact. Collect the carriers, measure the current, publish the paper.'
  });

  /* S G D sprite labels */
  var sprites = [];
  function tagLabel(text, x, y, z) {
    var s = labelSprite(text, '#0d1618');
    s.position.set(x, y, z);
    device.add(s);
    sprites.push(s);
    return s;
  }
  var sgd = [
    tagLabel('S', -3.30, 3.75, 0),
    tagLabel('G', 0, 4.10, 0),
    tagLabel('D', 3.30, 3.75, 0)
  ];

  /* electrons */
  var electrons = [];
  var eGeo = new THREE.SphereGeometry(0.115, 12, 12);
  var eMat = new THREE.MeshBasicMaterial({ color: hex('#a3e635') });
  for (i = 0; i < 27; i++) {
    var e = new THREE.Mesh(eGeo, eMat);
    var lane = i % finZ.length;
    e.userData = {
      lane: lane,
      t: Math.random(),
      speed: 0.16 + Math.random() * 0.1,
      jig: Math.random() * 6.28
    };
    e.position.set(0, FIN_Y - FIN_H / 2 + 0.08, finZ[lane]);
    finGroup.add(e);
    electrons.push(e);
  }

  /* ---------- state ---------- */
  var bias = true;           // gate on
  var exploded = false;
  var flow = 1;              // 0..1 — how open the channel is
  var selected = null;
  var hovered = null;
  var shownCurrent = 0;

  var yaw = -0.5, pitch = 0.30, yawV = 0, pitchV = 0;
  var dragging = false, moved = false, lastX = 0, lastY = 0;

  var pointer = new THREE.Vector2(-2, -2);
  var raycaster = new THREE.Raycaster();

  /* ---------- theme ---------- */
  function applyTheme() {
    var c = (B.colors ? B.colors() : null) || {};
    var dark = !!c.dark;
    C.sub = dark ? '#2a3336' : '#3d474b';
    C.buf = dark ? '#13525c' : '#1d5f68';
    C.bar = dark ? '#2fd0e0' : '#2f8f9b';
    C.fin = dark ? '#36bccb' : '#3aa6b4';
    C.gate = dark ? '#e39a5c' : '#b4762f';
    C.sd = dark ? '#7d868c' : '#8d949a';
    pSub.baseColor = C.sub; pBuf.baseColor = C.buf; pBar.baseColor = C.bar;
    pGate.baseColor = C.gate; pSrc.baseColor = C.sd; pDrn.baseColor = C.sd;
    pFin.baseColor = C.fin;
    hemi.groundColor.set(hex(dark ? '#0b1416' : '#5a6a70'));
    hemi.intensity = dark ? 0.5 : 0.62;
    key.intensity = dark ? 0.7 : 0.92;

    var ink = dark ? '#e9f4f5' : '#0d1618';
    var texts = ['S', 'G', 'D'];
    for (var s = 0; s < sgd.length; s++) {
      var old = sgd[s].material.map;
      var fresh = labelSprite(texts[s], ink);
      sgd[s].material.map = fresh.material.map;
      sgd[s].material.needsUpdate = true;
      if (old && old.dispose) old.dispose();
    }
    var eCol = dark ? '#c6f24f' : '#4f8f14';
    eMat.color.set(hex(eCol));
    for (var g = 0; g < glows.length; g++) glows[g].material.color.set(hex(eCol));
  }
  if (B.onTheme) B.onTheme(applyTheme);
  applyTheme();

  /* ---------- sizing ---------- */
  function resize() {
    var w = canvas.clientWidth || canvas.parentNode.clientWidth || 520;
    var h = canvas.clientHeight || 420;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    var narrow = w < 460;
    camera.position.set(narrow ? 9.4 : 8.2, narrow ? 7.2 : 6.6, narrow ? 12.0 : 10.4);
    camera.lookAt(0, 2.1, 0);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  /* ---------- picking ---------- */
  function setPointer(ev) {
    var r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
  }

  function pickable() {
    var list = [];
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].extra) {
        for (var j = 0; j < parts[i].extra.length; j++) list.push(parts[i].extra[j]);
      } else list.push(parts[i].mesh);
    }
    return list;
  }

  function partFor(mesh) {
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].mesh === mesh) return parts[i];
      if (parts[i].extra && parts[i].extra.indexOf(mesh) !== -1) return parts[i];
    }
    return null;
  }

  function pick(click) {
    raycaster.setFromCamera(pointer, camera);
    var hits = raycaster.intersectObjects(pickable(), false);
    var found = hits.length ? partFor(hits[0].object) : null;

    if (found !== hovered) {
      hovered = found;
      canvas.style.cursor = found ? 'pointer' : 'grab';
      if (!selected) say(found);
    }

    if (click) {
      if (found) {
        selected = (selected === found) ? null : found;
        say(selected || hovered);
        if (B.audio) B.audio.tone(selected ? 620 : 380, 0.09, 'triangle', 0.05);
      } else if (selected) {
        selected = null;
        say(hovered);
      }
    }
  }

  function say(p) {
    if (!readout) return;
    if (!p) {
      readout.innerHTML = '<b>AlGaN/GaN AS³-FinFET</b> · hover a layer to read it';
      return;
    }
    readout.innerHTML = '<b>' + p.name + '</b> · ' + p.info;
  }
  say(null);

  /* ---------- drag ---------- */
  canvas.addEventListener('pointerdown', function (ev) {
    dragging = true; moved = false;
    lastX = ev.clientX; lastY = ev.clientY;
    canvas.style.cursor = 'grabbing';
    try { canvas.setPointerCapture(ev.pointerId); } catch (e) {}
  });

  canvas.addEventListener('pointermove', function (ev) {
    setPointer(ev);
    if (!dragging) return;
    var dx = ev.clientX - lastX, dy = ev.clientY - lastY;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    lastX = ev.clientX; lastY = ev.clientY;
    yawV += dx * 0.0055;
    pitchV += dy * 0.0032;
  });

  function endDrag(ev) {
    if (!dragging) return;
    dragging = false;
    canvas.style.cursor = hovered ? 'pointer' : 'grab';
    if (!moved && ev) { setPointer(ev); pick(true); }
  }
  window.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointerleave', function () {
    pointer.set(-2, -2);
    if (!selected) { hovered = null; say(null); }
  });

  canvas.addEventListener('keydown', function (ev) {
    if (ev.key === 'ArrowLeft') { yawV -= 0.06; ev.preventDefault(); }
    if (ev.key === 'ArrowRight') { yawV += 0.06; ev.preventDefault(); }
    if (ev.key === 'ArrowUp') { pitchV -= 0.04; ev.preventDefault(); }
    if (ev.key === 'ArrowDown') { pitchV += 0.04; ev.preventDefault(); }
  });

  /* ---------- controls ---------- */
  function paintBias() {
    if (!biasBtn) return;
    biasBtn.setAttribute('aria-pressed', bias ? 'true' : 'false');
    biasBtn.querySelector('.sw-state').textContent = bias ? 'ON' : 'OFF';
    biasBtn.classList.toggle('on', bias);
  }
  if (biasBtn) {
    biasBtn.addEventListener('click', function () {
      bias = !bias;
      paintBias();
      if (B.audio) B.audio.tone(bias ? 660 : 240, 0.13, bias ? 'triangle' : 'sawtooth', 0.06);
      if (hint) hint.textContent = bias ? 'channel open · carriers flowing' : 'pinched off · no conduction';
    });
    paintBias();
  }
  if (explodeBtn) {
    explodeBtn.addEventListener('click', function () {
      exploded = !exploded;
      explodeBtn.setAttribute('aria-pressed', exploded ? 'true' : 'false');
      explodeBtn.querySelector('.sw-state').textContent = exploded ? 'ON' : 'OFF';
      explodeBtn.classList.toggle('on', exploded);
      if (B.audio) B.audio.tone(exploded ? 520 : 400, 0.12, 'sine', 0.05);
    });
  }

  /* ---------- loop ---------- */
  var visible = true, running = true;
  try {
    var io = new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
    }, { threshold: 0.02 });
    io.observe(canvas);
  } catch (e) {}
  document.addEventListener('visibilitychange', function () { running = !document.hidden; });

  var t = 0;
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || !running) return;
    t += 0.016;

    /* rotation */
    if (!dragging && !reduced) yawV += 0.00006;
    yaw += yawV; pitch += pitchV;
    yawV *= 0.90; pitchV *= 0.86;
    pitch = Math.max(-0.05, Math.min(0.78, pitch));
    device.rotation.y = yaw;
    device.rotation.x = pitch;
    device.position.y = reduced ? 0 : Math.sin(t * 0.8) * 0.07;

    if (!dragging) pick(false);

    /* channel opening */
    var want = bias ? 1 : 0;
    flow += (want - flow) * 0.07;

    /* layer motion */
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var isSel = selected === p;
      var isHov = hovered === p && !selected;
      var wantDim = selected && !isSel ? 1 : 0;
      p.dim += (wantDim - p.dim) * 0.12;
      p.sel += ((isSel ? 1 : 0) - p.sel) * 0.12;
      p.hoverT += ((isHov ? 1 : 0) - p.hoverT) * 0.16;

      var target = p.mesh;
      var lift = (exploded ? 1 : 0) * ((p.outY - p.baseY) || 0);
      var pull = p.sel * 0.55 + p.hoverT * 0.16;

      if (p.group) {
        p.group.position.y = lift + pull;
      } else {
        target.position.y = p.baseY + lift + pull;
      }

      var meshes = p.extra || [target];
      for (var m = 0; m < meshes.length; m++) {
        var mat = meshes[m].material;
        var base = new THREE.Color(hex(p.baseColor));
        if (p.hoverT > 0.001 || p.sel > 0.001) {
          base.offsetHSL(0, 0.05 * (p.hoverT + p.sel), 0.09 * (p.hoverT + p.sel));
        }
        mat.color.copy(base);
        var wantOp = 1 - p.dim * 0.78;
        if (p.id === 'GATE') wantOp *= 0.9;
        mat.opacity = wantOp;
        mat.transparent = wantOp < 0.999;
      }
    }

    /* 2DEG glow */
    for (i = 0; i < glows.length; i++) {
      glows[i].material.opacity = flow * (0.5 + Math.sin(t * 3 + i) * 0.14);
    }

    /* electrons */
    for (i = 0; i < electrons.length; i++) {
      var e = electrons[i], u = e.userData;
      var sp = u.speed * (0.12 + flow * 1.5);
      u.t += sp * 0.016 * 4;
      if (u.t > 1) u.t -= 1;
      var x = -2.75 + u.t * 5.5;
      e.position.x = x;
      var wob = flow > 0.5 ? 0.03 : 0.14;
      e.position.y = FIN_Y - FIN_H / 2 + 0.08 + Math.sin(t * 6 + u.jig) * wob;
      e.position.z = finZ[u.lane] + Math.cos(t * 4 + u.jig) * wob * 1.4;
      e.visible = flow > 0.06 || (i % 4 === 0);
      var s = 0.7 + flow * 0.5;
      e.scale.setScalar(s);
    }

    /* current readout */
    var target2 = flow * 1.24;
    shownCurrent += (target2 - shownCurrent) * 0.09;
    if (current) current.textContent = shownCurrent.toFixed(2);

    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  if (hint) hint.textContent = 'drag to rotate · click a layer';
})();
