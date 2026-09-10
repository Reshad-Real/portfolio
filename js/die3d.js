/* ============================================================
   die3d.js — the hero object: a chip floorplan, seen from above.
   Blocks are the units on a die. Hover one to read it, click to
   isolate it. Power drives signal packets along the channels;
   X-ray drops the block heights so you can see the routing.

   Everything here is a box on a plate: simple forms that hold up
   at any angle, rather than organic shapes that go wrong.
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('dieCanvas');
  var fallback = document.getElementById('dieFallback');
  if (!canvas) return;

  var B = window.Bench || {};
  var reduced = !!B.reduced;
  var readout = document.getElementById('dieRead');
  var stat = document.getElementById('dieStat');
  var powerBtn = document.getElementById('powerBtn');
  var xrayBtn = document.getElementById('xrayBtn');
  var hint = document.getElementById('dieHint');

  function bail() {
    canvas.style.display = 'none';
    if (fallback) fallback.hidden = false;
    var tools = document.getElementById('dieTools');
    if (tools) tools.hidden = true;
  }
  if (!window.THREE) { bail(); return; }

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    if (!renderer.getContext()) throw new Error('no gl');
  } catch (e) { bail(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
  var CAM = 27.0;
  var AIM = new THREE.Vector3(0, -0.4, 0);
  camera.position.set(CAM * 0.40, CAM * 0.64, CAM * 0.66);
  camera.lookAt(AIM);

  var key = new THREE.DirectionalLight(0xffffff, 0.88);
  key.position.set(6, 12, 7);
  scene.add(key);
  var rim = new THREE.DirectionalLight(0x9fe8f2, 0.42);
  rim.position.set(-8, 4, -7);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x50636a, 0.66));

  var die = new THREE.Group();
  scene.add(die);

  /* ---------- palette ---------- */
  var COL = {
    sub: 0x2b3a40, plate: 0x415761, core: 0x1d8f9c, sram: 0xb4762f,
    pll: 0x6dbb1c, io: 0x8d979c, analog: 0x4d6f8f, route: 0x5d7681
  };
  function solid(color, shine) {
    return new THREE.MeshPhongMaterial({
      color: color, shininess: shine === undefined ? 34 : shine, specular: 0x35464c
    });
  }
  function lit(color) { return new THREE.MeshBasicMaterial({ color: color }); }
  function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }

  /* ---------- substrate ---------- */
  var S = 9.0;
  var base = box(S, 0.5, S, solid(COL.sub, 12));
  base.position.y = -0.25;
  die.add(base);

  var plate = box(S - 0.7, 0.12, S - 0.7, solid(COL.plate, 22));
  plate.position.y = 0.06;
  die.add(plate);

  /* routing grid, visible once the blocks drop away */
  var routeMat = new THREE.MeshBasicMaterial({ color: COL.route, transparent: true, opacity: 0.5 });
  var routes = [];
  for (var r = -3; r <= 3; r++) {
    var h1 = box(S - 0.9, 0.03, 0.07, routeMat);
    h1.position.set(0, 0.13, r * 1.15);
    die.add(h1); routes.push(h1);
    var v1 = box(0.07, 0.03, S - 0.9, routeMat);
    v1.position.set(r * 1.15, 0.13, 0);
    die.add(v1); routes.push(v1);
  }

  /* ---------- the floorplan ---------- */
  var BLOCKS = [
    { id: 'CORE', name: 'Logic core',
      info: 'The datapath. Standard cells placed and routed until timing closes, or until you accept that it will not.',
      x: -1.5, z: -1.3, w: 3.4, d: 2.9, h: 1.5, c: COL.core },
    { id: 'SRAM0', name: 'SRAM macro',
      info: 'Compiled memory. Dense, regular, and the first thing to show up on a die photograph.',
      x: 2.2, z: -1.9, w: 2.4, d: 1.7, h: 1.15, c: COL.sram, striped: true },
    { id: 'SRAM1', name: 'SRAM macro',
      info: 'A second array. Memory usually eats more of the die than anyone expects.',
      x: 2.2, z: 0.1, w: 2.4, d: 1.7, h: 1.15, c: COL.sram, striped: true },
    { id: 'PLL', name: 'PLL',
      info: 'Phase-locked loop. It makes the clock, and it is fussy about everything nearby.',
      x: -2.6, z: 2.1, w: 1.7, d: 1.7, h: 1.9, c: COL.pll },
    { id: 'ANA', name: 'Analogue block',
      info: 'Bias, references, converters. Hand-drawn layout, guarded from the digital noise next door.',
      x: 0.3, z: 2.2, w: 2.6, d: 1.5, h: 1.0, c: COL.analog },
    { id: 'IO', name: 'I/O ring',
      info: 'Pads and drivers around the edge. Everything the die says to the outside world goes through here.',
      x: 2.7, z: 2.3, w: 1.5, d: 1.3, h: 0.7, c: COL.io }
  ];

  var blocks = [];
  for (var i = 0; i < BLOCKS.length; i++) {
    var d = BLOCKS[i];
    var m = box(d.w, d.h, d.d, solid(d.c));
    m.position.set(d.x, 0.12 + d.h / 2, d.z);
    die.add(m);

    if (d.striped) {
      for (var s = 0; s < 4; s++) {
        var stripe = box(d.w - 0.3, 0.04, 0.08, lit(0xe4c79a));
        stripe.position.set(d.x, 0.12 + d.h + 0.02, d.z - d.d / 2 + 0.36 + s * 0.32);
        die.add(stripe);
      }
    }

    blocks.push({
      def: d, mesh: m, baseY: 0.12 + d.h / 2, h: d.h,
      hoverT: 0, sel: 0, dim: 0
    });
  }

  /* pads around the edge */
  var padMat = solid(COL.io, 60);
  for (i = 0; i < 13; i++) {
    var t = -S / 2 + 0.7 + i * ((S - 1.4) / 12);
    [[t, -S / 2 + 0.28], [t, S / 2 - 0.28], [-S / 2 + 0.28, t], [S / 2 - 0.28, t]].forEach(function (p) {
      var pad = box(0.26, 0.16, 0.26, padMat);
      pad.position.set(p[0], 0.18, p[1]);
      die.add(pad);
    });
  }

  /* ---------- signal packets ---------- */
  var PATHS = [
    [[-4, -2.3], [4, -2.3]], [[-4, 1.15], [4, 1.15]],
    [[-2.3, -4], [-2.3, 4]], [[1.15, -4], [1.15, 4]],
    [[-4, 3.45], [4, 3.45]], [[3.45, -4], [3.45, 4]]
  ];
  var packets = [];
  var packetGeo = new THREE.BoxGeometry(0.34, 0.07, 0.13);
  for (i = 0; i < 14; i++) {
    var path = PATHS[i % PATHS.length];
    var horizontal = path[0][1] === path[1][1];
    var mat = new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? 0xa3e635 : 0x2fd0e0 });
    var pk = new THREE.Mesh(packetGeo, mat);
    if (!horizontal) pk.rotation.y = Math.PI / 2;
    die.add(pk);
    packets.push({
      mesh: pk, path: path, horizontal: horizontal,
      t: Math.random(), speed: 0.16 + Math.random() * 0.22
    });
  }

  /* ============================================================
     Orbiting probes. Each one is a live link into the page.
     ============================================================ */
  var orbits = new THREE.Group();
  scene.add(orbits);

  var SECTIONS = [
    { id: 'about', label: 'About', tint: 0x0aa3b0 },
    { id: 'work', label: 'Work', tint: 0xa35f31 },
    { id: 'papers', label: 'Papers', tint: 0x6dbb1c },
    { id: 'research', label: 'Research', tint: 0x0aa3b0 },
    { id: 'teaching', label: 'Teaching', tint: 0xa35f31 },
    { id: 'contact', label: 'Contact', tint: 0x6dbb1c }
  ];

  function makeLabel(text, color) {
    var c = document.createElement('canvas');
    c.width = 320; c.height = 84;
    var g = c.getContext('2d');
    if (g) {
      g.clearRect(0, 0, 320, 84);
      g.font = '600 44px Inter, system-ui, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = color;
      g.fillText(text, 160, 46);
    }
    var tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  var ORB_R = 4.9;
  var probes = [];
  for (var pi = 0; pi < SECTIONS.length; pi++) {
    var def = SECTIONS[pi];
    var g = new THREE.Group();
    orbits.add(g);

    var core = new THREE.Mesh(new THREE.SphereGeometry(0.20, 14, 12), lit(def.tint));
    g.add(core);
    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.03, 8, 22),
      new THREE.MeshBasicMaterial({ color: def.tint, transparent: true, opacity: 0.75 }));
    g.add(ring);
    var halo = new THREE.Mesh(new THREE.SphereGeometry(0.44, 12, 10),
      new THREE.MeshBasicMaterial({ color: def.tint, transparent: true, opacity: 0.13 }));
    g.add(halo);
    var labelSp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeLabel(def.label, '#0d1618'), transparent: true, depthTest: false, opacity: 0.9
    }));
    labelSp.scale.set(1.7, 0.44, 1);
    labelSp.position.y = 0.68;
    g.add(labelSp);

    probes.push({
      def: def, group: g, core: core, ring: ring, halo: halo, label: labelSp,
      a: (pi / SECTIONS.length) * Math.PI * 2,
      speed: 0.16 + (pi % 3) * 0.035,
      lift: 1.4 + (pi % 3) * 0.9,
      hoverT: 0, pulse: Math.random() * 6.28
    });
  }

  function placeProbes() {
    for (var i = 0; i < probes.length; i++) {
      var p = probes[i];
      p.group.position.set(
        Math.cos(p.a) * ORB_R,
        p.lift + Math.sin(p.a * 2) * 0.5,
        Math.sin(p.a) * ORB_R
      );
    }
  }
  placeProbes();

  function goToSection(id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (B.audio) {
      B.audio.tone(660, 0.09, 'triangle', 0.05);
      setTimeout(function () { B.audio.tone(880, 0.13, 'triangle', 0.045); }, 80);
    }
    try {
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    } catch (e) { window.location.hash = '#' + id; }
  }

  /* ---------- state ---------- */
  var powered = true, xray = false;
  var yaw = -0.42, pitch = 0, yawV = 0, pitchV = 0;
  var dragging = false, moved = false, lastX = 0, lastY = 0;
  var pointer = new THREE.Vector2(-2, -2);
  var ray = new THREE.Raycaster();
  var hovered = null, hoveredProbe = null, selected = null;
  var t = 0;

  function say(b) {
    if (!readout) return;
    if (!b) {
      readout.innerHTML = '<b>Floorplan · 9 mm² die</b> · hover a block to read it';
      return;
    }
    readout.innerHTML = '<b>' + b.def.name + '</b> · ' + b.def.info;
  }
  say(null);
  function paintStat() {
    if (stat) stat.textContent = powered ? 'powered' : 'idle';
    if (stat) stat.className = 'die-stat' + (powered ? ' live' : '');
  }
  paintStat();

  /* ---------- sizing ---------- */
  function resize() {
    var w = canvas.clientWidth || 520;
    var h = canvas.clientHeight || 380;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.setLength(w < 460 ? CAM * 1.18 : CAM);
    camera.lookAt(AIM);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  /* ---------- picking ---------- */
  function setPointer(ev) {
    var rct = canvas.getBoundingClientRect();
    if (!rct.width || !rct.height) return;
    pointer.x = ((ev.clientX - rct.left) / rct.width) * 2 - 1;
    pointer.y = -((ev.clientY - rct.top) / rct.height) * 2 + 1;
  }
  function meshes() {
    var out = [];
    for (var i = 0; i < probes.length; i++) { out.push(probes[i].core); out.push(probes[i].halo); }
    for (i = 0; i < blocks.length; i++) out.push(blocks[i].mesh);
    return out;
  }
  function probeFor(m) {
    for (var i = 0; i < probes.length; i++) {
      if (probes[i].core === m || probes[i].halo === m) return probes[i];
    }
    return null;
  }
  function blockFor(m) {
    for (var i = 0; i < blocks.length; i++) if (blocks[i].mesh === m) return blocks[i];
    return null;
  }

  function pick(clicked) {
    ray.setFromCamera(pointer, camera);
    var hits = ray.intersectObjects(meshes(), false);
    var obj = hits.length ? hits[0].object : null;
    var probe = obj ? probeFor(obj) : null;
    var found = probe ? null : (obj ? blockFor(obj) : null);

    if (probe !== hoveredProbe) {
      hoveredProbe = probe;
      if (probe && readout) {
        readout.innerHTML = '<b>Go to ' + probe.def.label + '</b> · click this probe to jump there';
      } else if (!probe) say(selected || hovered);
    }
    if (found !== hovered) {
      hovered = found;
      if (!probe) say(selected || found);
    }
    canvas.style.cursor = (probe || found) ? 'pointer' : 'grab';

    if (clicked) {
      if (probe) goToSection(probe.def.id);
      else if (found) {
        selected = selected === found ? null : found;
        say(selected || found);
        if (B.audio) B.audio.tone(selected ? 620 : 380, 0.09, 'triangle', 0.05);
      } else if (selected) {
        selected = null;
        say(hovered);
      }
    }
  }

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
    yawV += dx * 0.005;
    pitchV += dy * 0.003;
  });
  window.addEventListener('pointerup', function (ev) {
    if (!dragging) return;
    dragging = false;
    canvas.style.cursor = 'grab';
    if (!moved && ev) { setPointer(ev); pick(true); }
  });
  canvas.addEventListener('pointerleave', function () {
    pointer.set(-2, -2);
    hovered = null; hoveredProbe = null;
    say(selected);
  });
  canvas.addEventListener('keydown', function (ev) {
    if (ev.key === 'ArrowLeft') { yawV -= 0.06; ev.preventDefault(); }
    if (ev.key === 'ArrowRight') { yawV += 0.06; ev.preventDefault(); }
    if (ev.key === 'ArrowUp') { pitchV -= 0.04; ev.preventDefault(); }
    if (ev.key === 'ArrowDown') { pitchV += 0.04; ev.preventDefault(); }
  });

  /* ---------- controls ---------- */
  function wire(btn, get, set, on, off) {
    if (!btn) return;
    function paint() {
      btn.setAttribute('aria-pressed', get() ? 'true' : 'false');
      btn.classList.toggle('on', get());
      var sp = btn.querySelector('.sw-state');
      if (sp) sp.textContent = get() ? on : off;
    }
    btn.addEventListener('click', function () {
      set(!get());
      paint();
      paintStat();
      if (B.audio) B.audio.tone(get() ? 640 : 300, 0.11, 'triangle', 0.05);
    });
    paint();
  }
  wire(powerBtn, function () { return powered; }, function (v) { powered = v; }, 'ON', 'OFF');
  wire(xrayBtn, function () { return xray; }, function (v) { xray = v; }, 'ON', 'OFF');

  /* ---------- theme ---------- */
  function applyTheme() {
    var c = (B.colors ? B.colors() : {}) || {};
    var dark = !!c.dark;
    base.material.color.setHex(dark ? 0x14242a : 0x2b3a40);
    plate.material.color.setHex(dark ? 0x24404a : 0x415761);
    routeMat.color.setHex(dark ? 0x6f95a1 : 0x5d7681);
    key.intensity = dark ? 0.7 : 0.88;
    var ink = dark ? '#e9f4f5' : '#0d1618';
    for (var pj = 0; pj < probes.length; pj++) {
      var old = probes[pj].label.material.map;
      probes[pj].label.material.map = makeLabel(probes[pj].def.label, ink);
      probes[pj].label.material.needsUpdate = true;
      if (old && old.dispose) old.dispose();
    }
  }
  if (B.onTheme) B.onTheme(applyTheme);
  applyTheme();

  /* ---------- loop ---------- */
  var visible = true, running = true;
  try {
    var io = new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0.02 });
    io.observe(canvas);
  } catch (e) {}
  document.addEventListener('visibilitychange', function () { running = !document.hidden; });

  function frame() {
    requestAnimationFrame(frame);
    if (!visible || !running) return;
    t += 0.016;

    if (!dragging && !reduced) yawV += 0.00040;
    yaw += yawV; pitch += pitchV;
    yawV *= 0.90; pitchV *= 0.86;
    pitch = Math.max(-0.35, Math.min(0.45, pitch));
    die.rotation.y = yaw;
    die.rotation.x = pitch;
    orbits.rotation.x = pitch * 0.4;

    if (!dragging) pick(false);

    /* blocks: hover lift, selection focus, x-ray flatten */
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      var isSel = selected === b;
      var isHov = hovered === b && !selected;
      b.hoverT += ((isHov ? 1 : 0) - b.hoverT) * 0.16;
      b.sel += ((isSel ? 1 : 0) - b.sel) * 0.13;
      b.dim += (((selected && !isSel) ? 1 : 0) - b.dim) * 0.12;

      var squash = xray ? 0.16 : 1;
      var sy = squash + b.sel * 0.12;
      b.mesh.scale.y = sy;
      b.mesh.position.y = 0.12 + (b.h * sy) / 2 + b.hoverT * 0.30 + b.sel * 0.55;

      var col = new THREE.Color(b.def.c);
      if (b.hoverT > 0.001 || b.sel > 0.001) {
        col.offsetHSL(0, 0.04 * (b.hoverT + b.sel), 0.10 * (b.hoverT + b.sel));
      }
      b.mesh.material.color.copy(col);
      b.mesh.material.opacity = 1 - b.dim * 0.66;
      b.mesh.material.transparent = b.dim > 0.01;
    }

    /* routing shows through in x-ray */
    for (i = 0; i < routes.length; i++) {
      routes[i].material.opacity = xray ? 0.85 : 0.28;
    }

    /* signal packets run the channels */
    for (i = 0; i < packets.length; i++) {
      var pk = packets[i];
      if (powered && !reduced) pk.t += pk.speed * 0.016;
      else if (powered) pk.t += pk.speed * 0.004;
      if (pk.t > 1) pk.t -= 1;
      var a = pk.path[0], bb = pk.path[1];
      pk.mesh.position.set(
        a[0] + (bb[0] - a[0]) * pk.t,
        0.17,
        a[1] + (bb[1] - a[1]) * pk.t
      );
      pk.mesh.visible = powered;
    }

    /* probes */
    for (i = 0; i < probes.length; i++) {
      var pr = probes[i];
      if (!reduced) pr.a += 0.0016 + pr.speed * 0.0022;
      pr.pulse += 0.03;
      var hv = hoveredProbe === pr;
      pr.hoverT += ((hv ? 1 : 0) - pr.hoverT) * 0.16;
      pr.core.scale.setScalar(1 + Math.sin(pr.pulse) * 0.10 + pr.hoverT * 0.55);
      pr.halo.scale.setScalar(1 + Math.sin(pr.pulse * 0.8) * 0.16 + pr.hoverT * 0.5);
      pr.halo.material.opacity = 0.11 + pr.hoverT * 0.22;
      pr.ring.rotation.z += 0.01 + pr.hoverT * 0.06;
      pr.ring.rotation.x = Math.PI / 2.6 + Math.sin(pr.pulse * 0.5) * 0.3;
      pr.ring.scale.setScalar(1 + pr.hoverT * 0.35);
      pr.label.material.opacity = 0.62 + pr.hoverT * 0.38;
      pr.label.scale.set(1.7 + pr.hoverT * 0.36, 0.44 + pr.hoverT * 0.1, 1);
    }
    placeProbes();

    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  if (hint) hint.textContent = 'drag · click a block · click a probe to jump';

  canvas.__die = {
    scene: scene, camera: camera, die: die, blocks: blocks,
    packets: packets, probes: probes, orbits: orbits,
    isXray: function () { return xray; }, isPowered: function () { return powered; }
  };
})();
