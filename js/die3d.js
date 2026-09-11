/* ============================================================
   die3d.js — the hero: a chip floorplan, and the site map.

   The six functional blocks ARE the navigation. Hover one to read
   what it holds, click it to travel to that section. Around them
   sit the things a real floorplan has and nobody clicks: filler
   and decap, a seal ring, a pad ring, power straps, a clock spine,
   standard-cell rows, and SRAM bit arrays.
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
  var CAM = 28.5;
  var AIM = new THREE.Vector3(0, -0.3, 0);
  camera.position.set(CAM * 0.36, CAM * 0.68, CAM * 0.64);
  camera.lookAt(AIM);

  var key = new THREE.DirectionalLight(0xfff6ea, 0.95);
  key.position.set(6, 13, 6);
  scene.add(key);
  var rim = new THREE.DirectionalLight(0x9fe8f2, 0.45);
  rim.position.set(-8, 5, -7);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x3d4d55, 0.6));

  var die = new THREE.Group();
  scene.add(die);

  /* ---------- palette: a die photograph, not a toy ---------- */
  var COL = {
    scribe: 0x16232a, sub: 0x22333b, oxide: 0x2f4550,
    core: 0x2f7f8c, sram: 0x9c6a34, pll: 0x5f8f2a,
    ana: 0x46688a, io: 0x7d888e, mem: 0x8a5f7a,
    fill: 0x354954, metal: 0xa9b6bd, gold: 0xc9a227, spine: 0x2fd0e0
  };
  function solid(c, shine, spec) {
    return new THREE.MeshPhongMaterial({
      color: c, shininess: shine === undefined ? 40 : shine,
      specular: spec === undefined ? 0x3a4a52 : spec
    });
  }
  function lit(c, op) {
    return new THREE.MeshBasicMaterial({
      color: c, transparent: op !== undefined, opacity: op === undefined ? 1 : op
    });
  }
  function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }


  /* ---------- procedural die textures ----------
     Painted onto canvases and mapped to the top face of each block. This
     is what makes a floorplan look like a die photograph rather than a
     set of coloured boxes: the surface detail is far finer than geometry
     could reasonably carry. */
  function makeTex(draw, px) {
    var c = document.createElement('canvas');
    c.width = c.height = px || 256;
    var g = c.getContext('2d');
    if (g) draw(g, c.width);
    var tx = new THREE.CanvasTexture(c);
    tx.needsUpdate = true;
    tx.anisotropy = 4;
    return tx;
  }
  function hexStr(n) { return '#' + ('000000' + n.toString(16)).slice(-6); }
  function shade(hex, f) {
    var col = new THREE.Color(hex);
    col.offsetHSL(0, 0, f);
    return '#' + col.getHexString();
  }

  /* standard-cell rows: fine horizontal tracks with power rails and vias */
  function texStdCell(base) {
    return makeTex(function (g, n) {
      g.fillStyle = shade(base, -0.16); g.fillRect(0, 0, n, n);
      for (var y = 0; y < n; y += 10) {
        g.fillStyle = shade(base, 0.06);
        g.fillRect(0, y, n, 6);
        g.fillStyle = shade(base, 0.20);
        g.fillRect(0, y, n, 1.4);
        g.fillRect(0, y + 5, n, 1.4);
      }
      g.fillStyle = shade(base, 0.30);
      for (var i = 0; i < 340; i++) {
        g.fillRect(Math.random() * n, Math.floor(Math.random() * (n / 10)) * 10 + 2, 2, 2);
      }
      for (var x = 0; x < n; x += 46) {
        g.fillStyle = shade(base, 0.16);
        g.fillRect(x, 0, 2.6, n);
      }
    });
  }
  /* memory: a dense, regular bit-cell array with sense amps at one edge */
  function texSram(base) {
    return makeTex(function (g, n) {
      g.fillStyle = shade(base, -0.18); g.fillRect(0, 0, n, n);
      g.fillStyle = shade(base, 0.14);
      for (var y = 4; y < n - 26; y += 6) {
        for (var x = 4; x < n - 4; x += 6) g.fillRect(x, y, 4, 4);
      }
      g.fillStyle = shade(base, 0.28);
      g.fillRect(0, n - 24, n, 10);
      g.fillStyle = shade(base, 0.06);
      g.fillRect(0, n - 12, n, 12);
      g.fillStyle = shade(base, 0.34);
      for (var x2 = 6; x2 < n; x2 += 24) g.fillRect(x2, n - 22, 3, 6);
    });
  }
  /* analogue: fewer, larger, hand-drawn looking shapes with guard rings */
  function texAnalog(base) {
    return makeTex(function (g, n) {
      g.fillStyle = shade(base, -0.14); g.fillRect(0, 0, n, n);
      g.strokeStyle = shade(base, 0.26); g.lineWidth = 3;
      g.strokeRect(6, 6, n - 12, n - 12);
      var rects = [[22, 26, 78, 62], [116, 22, 52, 96], [184, 30, 46, 46],
                   [26, 108, 64, 84], [110, 138, 96, 54], [180, 96, 52, 32]];
      for (var i = 0; i < rects.length; i++) {
        g.fillStyle = shade(base, i % 2 ? 0.10 : 0.20);
        g.fillRect(rects[i][0], rects[i][1], rects[i][2], rects[i][3]);
        g.strokeStyle = shade(base, 0.30); g.lineWidth = 1.6;
        g.strokeRect(rects[i][0], rects[i][1], rects[i][2], rects[i][3]);
      }
      g.fillStyle = shade(base, 0.34);
      for (var k = 0; k < 26; k++) g.fillRect(Math.random() * n, 200 + Math.random() * 40, 6, 3);
    });
  }
  /* I/O: driver slabs and ESD structures in a row */
  function texIO(base) {
    return makeTex(function (g, n) {
      g.fillStyle = shade(base, -0.16); g.fillRect(0, 0, n, n);
      for (var x = 8; x < n - 8; x += 40) {
        g.fillStyle = shade(base, 0.18);
        g.fillRect(x, 16, 30, n - 76);
        g.fillStyle = shade(base, 0.32);
        g.fillRect(x, n - 52, 30, 30);
      }
      g.fillStyle = shade(base, 0.26);
      g.fillRect(0, n - 16, n, 8);
    });
  }
  /* filler and decap: uniform hatch, deliberately featureless */
  function texFiller(base) {
    return makeTex(function (g, n) {
      g.fillStyle = shade(base, -0.10); g.fillRect(0, 0, n, n);
      g.strokeStyle = shade(base, 0.14); g.lineWidth = 3;
      for (var i = -n; i < n * 2; i += 12) {
        g.beginPath(); g.moveTo(i, 0); g.lineTo(i + n, n); g.stroke();
      }
    }, 128);
  }
  /* the oxide surface between blocks: faint routing and speckle */
  function texOxide(base) {
    return makeTex(function (g, n) {
      g.fillStyle = shade(base, -0.06); g.fillRect(0, 0, n, n);
      g.strokeStyle = shade(base, 0.10); g.lineWidth = 2;
      for (var i = 0; i < n; i += 16) {
        g.beginPath(); g.moveTo(i, 0); g.lineTo(i, n); g.stroke();
        g.beginPath(); g.moveTo(0, i); g.lineTo(n, i); g.stroke();
      }
      g.fillStyle = shade(base, 0.16);
      for (var k = 0; k < 500; k++) g.fillRect(Math.random() * n, Math.random() * n, 2, 2);
    });
  }

  /* ---------- substrate, scribe line, seal ring ---------- */
  var S = 9.0, HALF = S / 2;
  var scribe = box(S + 0.5, 0.36, S + 0.5, solid(COL.scribe, 10));
  scribe.position.y = -0.30;
  die.add(scribe);

  var base = box(S, 0.34, S, solid(COL.sub, 16));
  base.position.y = -0.05;
  die.add(base);

  var oxideTop = solid(COL.oxide, 26);
  oxideTop.map = texOxide(COL.oxide);
  if (oxideTop.map) { oxideTop.map.wrapS = oxideTop.map.wrapT = THREE.RepeatWrapping; oxideTop.map.repeat.set(3, 3); }
  var oxide = new THREE.Mesh(new THREE.BoxGeometry(S - 0.5, 0.12, S - 0.5),
    [solid(COL.oxide, 26), solid(COL.oxide, 26), oxideTop,
     solid(COL.oxide, 26), solid(COL.oxide, 26), solid(COL.oxide, 26)]);
  oxide.position.y = 0.16;
  die.add(oxide);

  /* seal ring: four thin metal walls around the perimeter */
  var sealMat = solid(COL.metal, 90, 0xf0f7fa);
  [[0, -HALF + 0.34, S - 0.6, 0.10], [0, HALF - 0.34, S - 0.6, 0.10],
   [-HALF + 0.34, 0, 0.10, S - 0.6], [HALF - 0.34, 0, 0.10, S - 0.6]]
    .forEach(function (r) {
      var w = box(r[2], 0.22, r[3], sealMat);
      w.position.set(r[0], 0.28, r[1]);
      die.add(w);
    });

  /* corner alignment marks */
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) {
    var m1 = box(0.5, 0.06, 0.12, lit(COL.metal));
    m1.position.set(c[0] * (HALF - 0.85), 0.24, c[1] * (HALF - 0.85));
    die.add(m1);
    var m2 = box(0.12, 0.06, 0.5, lit(COL.metal));
    m2.position.set(c[0] * (HALF - 0.85), 0.24, c[1] * (HALF - 0.85));
    die.add(m2);
  });

  /* ---------- routing grid, revealed by X-ray ---------- */
  var routeMat = lit(0x6f8b96, 0.3);
  var routes = [];
  for (var r = -3; r <= 3; r++) {
    var h1 = box(S - 0.9, 0.02, 0.06, routeMat);
    h1.position.set(0, 0.23, r * 1.15);
    die.add(h1); routes.push(h1);
    var v1 = box(0.06, 0.02, S - 0.9, routeMat);
    v1.position.set(r * 1.15, 0.23, 0);
    die.add(v1); routes.push(v1);
  }

  /* ---------- the six blocks that are also the navigation ---------- */
  var BLOCKS = [
    { id: 'about', label: 'ABOUT', tag: 'U1 · logic core',
      info: 'The datapath. Who I am and how the work actually goes.',
      x: -1.40, z: -1.40, w: 3.40, d: 2.60, h: 1.35, c: COL.core, surface: 'rows' },
    { id: 'work', label: 'WORK', tag: 'U2 · SRAM macro',
      info: 'Where I have worked: BRAC CREST, RSGI, tutoring, Ulkasemi.',
      x: 2.15, z: -2.00, w: 2.60, d: 1.60, h: 1.05, c: COL.sram, surface: 'array' },
    { id: 'papers', label: 'PAPERS', tag: 'U3 · SRAM macro',
      info: 'Six Q1 journal papers, each linked to its DOI.',
      x: 2.15, z: -0.15, w: 2.60, d: 1.60, h: 1.05, c: COL.mem, surface: 'array' },
    { id: 'research', label: 'RESEARCH', tag: 'U5 · PLL',
      info: 'What I am building: GaN tri-gates, e-skin sensors, digital twins.',
      x: -2.75, z: 1.60, w: 2.00, d: 1.80, h: 1.65, c: COL.pll, surface: 'analog' },
    { id: 'teaching', label: 'TEACHING', tag: 'U6 · analogue',
      info: 'Four semesters of tutoring, and where I studied.',
      x: 0.15, z: 1.75, w: 2.60, d: 1.50, h: 0.95, c: COL.ana, surface: 'analog' },
    { id: 'contact', label: 'CONTACT', tag: 'J1 · I/O ring',
      info: 'Everything this die says to the outside world goes through here.',
      x: 2.60, z: 2.00, w: 1.70, d: 1.40, h: 0.75, c: COL.io, surface: 'io' }
  ];

  function makeLabel(text, color, weight) {
    var c = document.createElement('canvas');
    c.width = 360; c.height = 80;
    var g = c.getContext('2d');
    if (g) {
      g.clearRect(0, 0, 360, 80);
      g.font = (weight || '700') + ' 42px Inter, system-ui, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = color;
      g.fillText(text, 180, 44);
    }
    var tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  var TOP = 0.22;
  var TEXER = { rows: texStdCell, array: texSram, analog: texAnalog, io: texIO };
  var blocks = [];
  for (var i = 0; i < BLOCKS.length; i++) {
    var d = BLOCKS[i];
    var sideMat = solid(d.c, 26);
    var topMat = solid(d.c, 44);
    var painter = TEXER[d.surface] || texStdCell;
    topMat.map = painter(d.c);
    var m = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.h, d.d),
      [sideMat, sideMat, topMat, sideMat, sideMat, sideMat]);
    m.position.set(d.x, TOP + d.h / 2, d.z);
    die.add(m);

    var sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeLabel(d.label, '#0d1618'), transparent: true, depthTest: false, opacity: 0.92
    }));
    sp.scale.set(1.95, 0.43, 1);
    sp.position.set(d.x, TOP + d.h + 0.62, d.z);
    die.add(sp);

    blocks.push({
      def: d, mesh: m, label: sp, h: d.h,
      mats: [sideMat, topMat], hoverT: 0, dim: 0
    });
  }

  /* ---------- filler and decap: detail, not navigation ---------- */
  var FILL = [
    { x: -3.65, z: -1.77, w: 1.00, d: 4.70, h: 0.42 },
    { x: -2.85, z: 3.35, w: 2.60, d: 1.40, h: 0.38 },
    { x: 0.15, z: 3.35, w: 2.60, d: 1.30, h: 0.34 },
    { x: 2.85, z: 3.50, w: 2.40, d: 1.00, h: 0.30 },
    { x: 0.20, z: -3.50, w: 5.50, d: 1.00, h: 0.36 },
    { x: -0.35, z: 0.45, w: 1.30, d: 0.80, h: 0.28 }
  ];
  var fillMat = solid(COL.fill, 20);
  var fillTop = solid(COL.fill, 24);
  fillTop.map = texFiller(COL.fill);
  if (fillTop.map) {
    fillTop.map.wrapS = fillTop.map.wrapT = THREE.RepeatWrapping;
    fillTop.map.repeat.set(2, 2);
  }
  for (i = 0; i < FILL.length; i++) {
    var f = FILL[i];
    var fm = new THREE.Mesh(new THREE.BoxGeometry(f.w, f.h, f.d),
      [fillMat, fillMat, fillTop, fillMat, fillMat, fillMat]);
    fm.position.set(f.x, TOP + f.h / 2, f.z);
    die.add(fm);
  }

  /* ---------- pad ring ---------- */
  var padMat = solid(COL.gold, 96, 0xfff3cf);
  var stubMat = solid(COL.metal, 80, 0xeef6f9);
  for (i = 0; i < 12; i++) {
    var t = -HALF + 0.95 + i * ((S - 1.9) / 11);
    [[t, -HALF + 0.62, 0, 1], [t, HALF - 0.62, 0, -1],
     [-HALF + 0.62, t, 1, 0], [HALF - 0.62, t, -1, 0]].forEach(function (p) {
      var pad = box(0.30, 0.18, 0.30, padMat);
      pad.position.set(p[0], 0.31, p[1]);
      die.add(pad);
      var stub = box(p[2] ? 0.34 : 0.07, 0.05, p[2] ? 0.07 : 0.34, stubMat);
      stub.position.set(p[0] + p[2] * 0.30, 0.30, p[1] + p[3] * 0.30);
      die.add(stub);
    });
  }

  /* ---------- power straps above everything ---------- */
  var strapMat = lit(0xcdd9de, 0.30);
  var straps = [];
  for (i = 0; i < 5; i++) {
    var strap = box(S - 0.8, 0.07, 0.30, strapMat);
    strap.position.set(0, 2.35, -3.0 + i * 1.5);
    die.add(strap);
    straps.push(strap);
  }

  /* clock spine */
  var spine = box(0.14, 0.05, S - 1.2, lit(COL.spine, 0.75));
  spine.position.set(0.55, 2.42, 0);
  die.add(spine);
  straps.push(spine);

  /* ---------- signal packets along the channels ---------- */
  var PATHS = [
    [[-4, -2.3], [4, -2.3]], [[-4, 1.15], [4, 1.15]],
    [[-2.3, -4], [-2.3, 4]], [[1.15, -4], [1.15, 4]],
    [[-4, 3.45], [4, 3.45]], [[3.45, -4], [3.45, 4]]
  ];
  var packets = [];
  var packetGeo = new THREE.BoxGeometry(0.36, 0.06, 0.12);
  for (i = 0; i < 16; i++) {
    var path = PATHS[i % PATHS.length];
    var horizontal = path[0][1] === path[1][1];
    var pk = new THREE.Mesh(packetGeo, lit(i % 3 === 0 ? 0xa3e635 : 0x2fd0e0));
    if (!horizontal) pk.rotation.y = Math.PI / 2;
    die.add(pk);
    packets.push({ mesh: pk, path: path, t: Math.random(), speed: 0.16 + Math.random() * 0.22 });
  }

  /* ---------- state ---------- */
  var powered = true, xray = false;
  var yaw = -0.40, pitch = 0, yawV = 0, pitchV = 0;
  var dragging = false, moved = false, lastX = 0, lastY = 0;
  var pointer = new THREE.Vector2(-2, -2);
  var ray = new THREE.Raycaster();
  var hovered = null;
  var t = 0;

  function say(b) {
    if (!readout) return;
    if (!b) {
      readout.innerHTML = '<b>Floorplan · 9 mm² die</b> · every block is a section — hover one';
      return;
    }
    readout.innerHTML = '<b>Go to ' + b.def.label.charAt(0) + b.def.label.slice(1).toLowerCase() +
      '</b> <span class="die-desig">' + b.def.tag + '</span> · ' + b.def.info;
  }
  say(null);
  function paintStat() {
    if (!stat) return;
    stat.textContent = powered ? 'powered' : 'idle';
    stat.className = 'die-stat' + (powered ? ' live' : '');
  }
  paintStat();

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

  /* ---------- sizing ---------- */
  function resize() {
    var w = canvas.clientWidth || 520;
    var h = canvas.clientHeight || 380;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.setLength(w < 460 ? CAM * 1.16 : CAM);
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
    for (var i = 0; i < blocks.length; i++) out.push(blocks[i].mesh);
    return out;
  }
  function blockFor(m) {
    for (var i = 0; i < blocks.length; i++) if (blocks[i].mesh === m) return blocks[i];
    return null;
  }
  function pick(clicked) {
    ray.setFromCamera(pointer, camera);
    var hits = ray.intersectObjects(meshes(), false);
    var found = hits.length ? blockFor(hits[0].object) : null;
    if (found !== hovered) {
      hovered = found;
      canvas.style.cursor = found ? 'pointer' : 'grab';
      say(found);
    }
    if (clicked && found) goToSection(found.def.id);
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
    hovered = null;
    say(null);
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
    scribe.material.color.setHex(dark ? 0x0a1418 : 0x16232a);
    base.material.color.setHex(dark ? 0x14252c : 0x22333b);
    var oxCol = dark ? 0x1d3540 : 0x2f4550;
    var oxMats = Array.isArray(oxide.material) ? oxide.material : [oxide.material];
    for (var om = 0; om < oxMats.length; om++) oxMats[om].color.setHex(oxCol);
    key.intensity = dark ? 0.76 : 0.95;
    var ink = dark ? '#e9f4f5' : '#0d1618';
    for (var i = 0; i < blocks.length; i++) {
      var old = blocks[i].label.material.map;
      blocks[i].label.material.map = makeLabel(blocks[i].def.label, ink);
      blocks[i].label.material.needsUpdate = true;
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

    if (!dragging && !reduced) yawV += 0.00038;
    yaw += yawV; pitch += pitchV;
    yawV *= 0.90; pitchV *= 0.86;
    pitch = Math.max(-0.32, Math.min(0.42, pitch));
    die.rotation.y = yaw;
    die.rotation.x = pitch;

    if (!dragging) pick(false);

    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      var isHov = hovered === b;
      b.hoverT += ((isHov ? 1 : 0) - b.hoverT) * 0.16;
      b.dim += (((hovered && !isHov) ? 1 : 0) - b.dim) * 0.12;

      var squash = xray ? 0.16 : 1;
      b.mesh.scale.y = squash;
      b.mesh.position.y = TOP + (b.h * squash) / 2 + b.hoverT * 0.38;

      var col = new THREE.Color(b.def.c);
      if (b.hoverT > 0.001) col.offsetHSL(0, 0.06 * b.hoverT, 0.15 * b.hoverT);
      for (var mi = 0; mi < b.mats.length; mi++) {
        b.mats[mi].color.copy(col);
        b.mats[mi].opacity = 1 - b.dim * 0.45;
        b.mats[mi].transparent = b.dim > 0.01;
      }

      b.label.position.y = TOP + b.h * squash + 0.62 + b.hoverT * 0.42;
      b.label.material.opacity = 0.62 + b.hoverT * 0.38 - b.dim * 0.24;
      b.label.scale.set(1.95 + b.hoverT * 0.34, 0.43 + b.hoverT * 0.08, 1);
    }

    for (i = 0; i < routes.length; i++) routes[i].material.opacity = xray ? 0.85 : 0.22;
    for (i = 0; i < straps.length; i++) {
      straps[i].visible = !xray;
      straps[i].material.opacity = (straps[i] === spine ? 0.75 : 0.30) * (powered ? 1 : 0.45);
    }

    for (i = 0; i < packets.length; i++) {
      var pk = packets[i];
      if (powered) pk.t += pk.speed * (reduced ? 0.004 : 0.016);
      if (pk.t > 1) pk.t -= 1;
      var a = pk.path[0], bb = pk.path[1];
      pk.mesh.position.set(a[0] + (bb[0] - a[0]) * pk.t, 0.30, a[1] + (bb[1] - a[1]) * pk.t);
      pk.mesh.visible = powered;
    }

    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  if (hint) hint.textContent = 'drag to rotate · click a block';

  canvas.__die = {
    scene: scene, camera: camera, die: die, blocks: blocks, packets: packets,
    fills: FILL, isXray: function () { return xray; }, isPowered: function () { return powered; }
  };
})();
