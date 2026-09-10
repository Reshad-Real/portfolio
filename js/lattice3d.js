/* ============================================================
   lattice3d.js — the hero object: a silicon unit cell.
   Diamond cubic, eighteen atoms, sixteen bonds.
   Click an atom to dope it. Add donors and it goes n-type;
   add acceptors and it goes p-type. Heat it and it rattles.
   Bias it and the free carriers drift.
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('crystalCanvas');
  var fallback = document.getElementById('crystalFallback');
  if (!canvas) return;

  var B = window.Bench || {};
  var reduced = !!B.reduced;
  var readout = document.getElementById('crysRead');
  var stat = document.getElementById('crysStat');
  var biasBtn = document.getElementById('biasBtn');
  var heatBtn = document.getElementById('heatBtn');
  var resetBtn = document.getElementById('resetBtn');
  var hint = document.getElementById('crysHint');

  function bail() {
    canvas.style.display = 'none';
    if (fallback) fallback.hidden = false;
    var tools = document.getElementById('crysTools');
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
  var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  var CAM = 19.0;
  var AIM = new THREE.Vector3(0, -0.30, 0);
  camera.position.set(CAM * 0.52, CAM * 0.40, CAM * 0.74);
  camera.lookAt(AIM);

  var key = new THREE.DirectionalLight(0xffffff, 0.85);
  key.position.set(6, 10, 8);
  scene.add(key);
  var rim = new THREE.DirectionalLight(0x9fe8f2, 0.45);
  rim.position.set(-7, -3, -6);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x54666b, 0.65));

  var cell = new THREE.Group();
  scene.add(cell);

  /* ---------- the diamond cubic cell ---------- */
  var A = 4.2;                  // edge of the drawn cell
  var H = A / 2;
  var Q = A / 4;
  var SITES = [
    /* corners */
    [-H, -H, -H], [H, -H, -H], [-H, H, -H], [-H, -H, H],
    [H, H, -H], [H, -H, H], [-H, H, H], [H, H, H],
    /* face centres */
    [0, 0, -H], [0, 0, H], [0, -H, 0], [0, H, 0], [-H, 0, 0], [H, 0, 0],
    /* the four tetrahedral interior sites */
    [-Q, -Q, -Q], [Q, Q, -Q], [Q, -Q, Q], [-Q, Q, Q]
  ];

  var SI = 0x7f8f96, DONOR = 0x2fa8d8, ACCEPTOR = 0xd8663f;
  var atomGeo = new THREE.SphereGeometry(0.40, 20, 16);
  var atoms = [];

  function atomMat(color) {
    return new THREE.MeshPhongMaterial({ color: color, shininess: 66, specular: 0xdfeef2 });
  }

  for (var i = 0; i < SITES.length; i++) {
    var m = new THREE.Mesh(atomGeo, atomMat(SI));
    m.position.set(SITES[i][0], SITES[i][1], SITES[i][2]);
    cell.add(m);
    atoms.push({
      mesh: m, home: m.position.clone(), kind: 'Si',
      phase: Math.random() * 6.28, hoverT: 0, pop: 0,
      interior: i >= 14
    });
  }

  /* bonds: every pair at the tetrahedral bond length */
  var BOND = A * 0.4331 + 0.06;
  var bondGeo = new THREE.CylinderGeometry(0.09, 0.09, 1, 8);
  var bondMat = new THREE.MeshPhongMaterial({ color: 0x9aa8ad, shininess: 20 });
  var bonds = [];
  var up = new THREE.Vector3(0, 1, 0);

  for (i = 0; i < atoms.length; i++) {
    for (var j = i + 1; j < atoms.length; j++) {
      var d = atoms[i].home.distanceTo(atoms[j].home);
      if (d > BOND) continue;
      var bm = new THREE.Mesh(bondGeo, bondMat);
      cell.add(bm);
      bonds.push({ mesh: bm, a: atoms[i], b: atoms[j] });
    }
  }

  function layBond(b) {
    var pa = b.a.mesh.position, pb = b.b.mesh.position;
    var dir = new THREE.Vector3().subVectors(pb, pa);
    var len = dir.length();
    b.mesh.position.copy(pa).addScaledVector(dir, 0.5);
    b.mesh.scale.set(1, len, 1);
    b.mesh.quaternion.setFromUnitVectors(up, dir.normalize());
  }
  for (i = 0; i < bonds.length; i++) layBond(bonds[i]);

  /* a faint wireframe of the cell edges, so the cube reads */
  var edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(A, A, A)),
    new THREE.LineBasicMaterial({ color: 0x9aa8ad, transparent: true, opacity: 0.28 })
  );
  cell.add(edges);

  /* ---------- free carriers ---------- */
  var carrierGeo = new THREE.SphereGeometry(0.16, 12, 10);
  var carriers = [];

  function addCarrier(atom, negative) {
    var mat = new THREE.MeshBasicMaterial({ color: negative ? 0x86d918 : 0xe08a3c });
    var m = new THREE.Mesh(carrierGeo, mat);
    cell.add(m);
    carriers.push({
      mesh: m, negative: negative, owner: atom,
      t: Math.random() * 6.28, r: 1.0 + Math.random() * 0.35,
      drift: Math.random() * 6.28, tilt: Math.random() * 3.14
    });
  }
  function dropCarriers(atom) {
    for (var c = carriers.length - 1; c >= 0; c--) {
      if (carriers[c].owner === atom) {
        cell.remove(carriers[c].mesh);
        carriers[c].mesh.material.dispose();
        carriers.splice(c, 1);
      }
    }
  }

  /* ============================================================
     Orbiting probes. Each one is a live link into the page: hover to
     light it up, click to travel to that section.
     ============================================================ */
  var orbits = new THREE.Group();
  scene.add(orbits);

  var SECTIONS = [
    { id: 'about',    label: 'About',    tint: 0x0aa3b0 },
    { id: 'work',     label: 'Work',     tint: 0xa35f31 },
    { id: 'papers',   label: 'Papers',   tint: 0x6dbb1c },
    { id: 'research', label: 'Research', tint: 0x0aa3b0 },
    { id: 'teaching', label: 'Teaching', tint: 0xa35f31 },
    { id: 'contact',  label: 'Contact',  tint: 0x6dbb1c }
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

  var ORB_R = 3.15;
  var probes = [];

  for (var pi = 0; pi < SECTIONS.length; pi++) {
    var def = SECTIONS[pi];
    var g = new THREE.Group();
    orbits.add(g);

    var core = new THREE.Mesh(
      new THREE.SphereGeometry(0.19, 14, 12),
      new THREE.MeshBasicMaterial({ color: def.tint })
    );
    g.add(core);

    var ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.34, 0.028, 8, 22),
      new THREE.MeshBasicMaterial({ color: def.tint, transparent: true, opacity: 0.75 })
    );
    g.add(ring);

    var halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 12, 10),
      new THREE.MeshBasicMaterial({ color: def.tint, transparent: true, opacity: 0.13 })
    );
    g.add(halo);

    var labelSp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeLabel(def.label, '#0d1618'), transparent: true, depthTest: false, opacity: 0.9
    }));
    labelSp.scale.set(1.5, 0.39, 1);
    labelSp.position.y = 0.62;
    g.add(labelSp);

    probes.push({
      def: def, group: g, core: core, ring: ring, halo: halo, label: labelSp,
      a: (pi / SECTIONS.length) * Math.PI * 2,
      speed: 0.16 + (pi % 3) * 0.035,
      incline: -0.5 + (pi % 4) * 0.30,
      hoverT: 0, pulse: Math.random() * 6.28
    });
  }

  function placeProbes() {
    for (var i = 0; i < probes.length; i++) {
      var p = probes[i];
      var x = Math.cos(p.a) * ORB_R;
      var z = Math.sin(p.a) * ORB_R;
      var y = Math.sin(p.a * 1.0 + p.incline) * ORB_R * 0.36;
      p.group.position.set(x, y, z);
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
    } catch (e) {
      window.location.hash = '#' + id;
    }
  }

  /* ---------- state ---------- */
  var bias = false, heat = false;
  var yaw = 0.5, pitch = 0.22, yawV = 0, pitchV = 0;
  var dragging = false, moved = false, lastX = 0, lastY = 0;
  var pointer = new THREE.Vector2(-2, -2);
  var ray = new THREE.Raycaster();
  var hovered = null;
  var t = 0;

  var INFO = {
    Si: 'Silicon. Four valence electrons, four covalent bonds, nothing spare to carry current.',
    P: 'Phosphorus donor. Five valence electrons — the fifth has no bond to sit in, so it wanders.',
    B: 'Boron acceptor. Three valence electrons leaves a hole, and holes move too.'
  };

  function census() {
    var don = 0, acc = 0;
    for (var i = 0; i < atoms.length; i++) {
      if (atoms[i].kind === 'P') don++;
      else if (atoms[i].kind === 'B') acc++;
    }
    return { don: don, acc: acc };
  }

  function paintStat() {
    if (!stat) return;
    var c = census();
    var label, cls;
    if (c.don === 0 && c.acc === 0) { label = 'intrinsic'; cls = ''; }
    else if (c.don > c.acc) { label = 'n-type · ' + c.don + ' donor' + (c.don > 1 ? 's' : ''); cls = 'n'; }
    else if (c.acc > c.don) { label = 'p-type · ' + c.acc + ' acceptor' + (c.acc > 1 ? 's' : ''); cls = 'p'; }
    else { label = 'compensated · ' + c.don + ' / ' + c.acc; cls = ''; }
    stat.textContent = label;
    stat.className = 'crys-stat ' + cls;
  }

  function say(atom) {
    if (!readout) return;
    if (!atom) {
      readout.innerHTML = '<b>Silicon · diamond cubic</b> · click any atom to dope it';
      return;
    }
    var name = atom.kind === 'Si' ? 'Silicon atom' : atom.kind === 'P' ? 'Phosphorus (donor)' : 'Boron (acceptor)';
    readout.innerHTML = '<b>' + name + '</b> · ' + INFO[atom.kind];
  }
  say(null);
  paintStat();

  function dope(atom) {
    dropCarriers(atom);
    if (atom.kind === 'Si') {
      atom.kind = 'P';
      atom.mesh.material.color.setHex(DONOR);
      addCarrier(atom, true);
      if (B.audio) B.audio.tone(720, 0.1, 'triangle', 0.05);
    } else if (atom.kind === 'P') {
      atom.kind = 'B';
      atom.mesh.material.color.setHex(ACCEPTOR);
      addCarrier(atom, false);
      if (B.audio) B.audio.tone(430, 0.1, 'triangle', 0.05);
    } else {
      atom.kind = 'Si';
      atom.mesh.material.color.setHex(SI);
      if (B.audio) B.audio.tone(300, 0.09, 'sine', 0.04);
    }
    atom.pop = 1;
    say(atom);
    paintStat();
  }

  /* ---------- sizing ---------- */
  function resize() {
    var w = canvas.clientWidth || 520;
    var h = canvas.clientHeight || 380;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    var d = w < 460 ? CAM * 1.16 : CAM;
    camera.position.setLength(d);
    camera.lookAt(AIM);
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
  function meshes() {
    var out = [];
    for (var i = 0; i < probes.length; i++) { out.push(probes[i].core); out.push(probes[i].halo); }
    for (i = 0; i < atoms.length; i++) out.push(atoms[i].mesh);
    return out;
  }
  function probeFor(mesh) {
    for (var i = 0; i < probes.length; i++) {
      if (probes[i].core === mesh || probes[i].halo === mesh) return probes[i];
    }
    return null;
  }
  function atomFor(mesh) {
    for (var i = 0; i < atoms.length; i++) if (atoms[i].mesh === mesh) return atoms[i];
    return null;
  }
  var hoveredProbe = null;

  function pick(clicked) {
    ray.setFromCamera(pointer, camera);
    var hits = ray.intersectObjects(meshes(), false);
    var obj = hits.length ? hits[0].object : null;
    var probe = obj ? probeFor(obj) : null;
    var found = probe ? null : (obj ? atomFor(obj) : null);

    if (probe !== hoveredProbe) {
      hoveredProbe = probe;
      if (probe && readout) {
        readout.innerHTML = '<b>Go to ' + probe.def.label + '</b> · click this probe to jump there';
      } else if (!probe) {
        say(hovered);
      }
    }
    if (found !== hovered) {
      hovered = found;
      if (!probe) say(found);
    }
    canvas.style.cursor = (probe || found) ? 'pointer' : 'grab';

    if (clicked) {
      if (probe) goToSection(probe.def.id);
      else if (found) dope(found);
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
    yawV += dx * 0.0055;
    pitchV += dy * 0.0032;
  });
  window.addEventListener('pointerup', function (ev) {
    if (!dragging) return;
    dragging = false;
    canvas.style.cursor = hovered ? 'pointer' : 'grab';
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
    if (ev.key === 'Enter' || ev.key === ' ') {
      /* keyboard route: dope one of the interior atoms */
      for (var i = 14; i < atoms.length; i++) {
        if (atoms[i].kind === 'Si') { dope(atoms[i]); ev.preventDefault(); return; }
      }
      dope(atoms[14]);
      ev.preventDefault();
    }
  });

  /* ---------- controls ---------- */
  function wire(btn, get, set, onLabel, offLabel) {
    if (!btn) return;
    function paint() {
      btn.setAttribute('aria-pressed', get() ? 'true' : 'false');
      btn.classList.toggle('on', get());
      var s = btn.querySelector('.sw-state');
      if (s) s.textContent = get() ? onLabel : offLabel;
    }
    btn.addEventListener('click', function () {
      set(!get());
      paint();
      if (B.audio) B.audio.tone(get() ? 640 : 300, 0.11, 'triangle', 0.05);
    });
    paint();
  }
  wire(biasBtn, function () { return bias; }, function (v) { bias = v; }, 'ON', 'OFF');
  wire(heatBtn, function () { return heat; }, function (v) { heat = v; }, '300 K', '0 K');

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      for (var i = 0; i < atoms.length; i++) {
        if (atoms[i].kind !== 'Si') {
          dropCarriers(atoms[i]);
          atoms[i].kind = 'Si';
          atoms[i].mesh.material.color.setHex(SI);
        }
      }
      paintStat();
      say(null);
      if (B.audio) B.audio.tone(260, 0.12, 'sine', 0.045);
    });
  }

  /* ---------- theme ---------- */
  function applyTheme() {
    var c = (B.colors ? B.colors() : {}) || {};
    var dark = !!c.dark;
    SI = dark ? 0x8fa2a9 : 0x7f8f96;
    for (var i = 0; i < atoms.length; i++) {
      if (atoms[i].kind === 'Si') atoms[i].mesh.material.color.setHex(SI);
    }
    bondMat.color.setHex(dark ? 0x54686e : 0x9aa8ad);
    edges.material.color.setHex(dark ? 0x3f5459 : 0x9aa8ad);
    edges.material.opacity = dark ? 0.4 : 0.28;
    key.intensity = dark ? 0.68 : 0.85;
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

    if (!dragging && !reduced) yawV += 0.00042;
    yaw += yawV; pitch += pitchV;
    yawV *= 0.90; pitchV *= 0.86;
    pitch = Math.max(-0.7, Math.min(0.85, pitch));
    cell.rotation.y = yaw;
    cell.rotation.x = pitch;

    if (!dragging) pick(false);

    /* thermal rattle */
    var amp = heat ? 0.075 : 0.0;
    for (var i = 0; i < atoms.length; i++) {
      var a = atoms[i];
      a.pop *= 0.88;
      var isHov = hovered === a;
      a.hoverT += ((isHov ? 1 : 0) - a.hoverT) * 0.18;
      if (reduced) {
        a.mesh.position.copy(a.home);
      } else {
        a.mesh.position.set(
          a.home.x + Math.sin(t * 7.3 + a.phase) * amp,
          a.home.y + Math.sin(t * 6.1 + a.phase * 1.7) * amp,
          a.home.z + Math.cos(t * 8.0 + a.phase * 0.9) * amp
        );
      }
      var s = 1 + a.hoverT * 0.16 + a.pop * 0.5;
      a.mesh.scale.setScalar(s);
    }
    for (i = 0; i < bonds.length; i++) layBond(bonds[i]);

    /* carriers: bound orbits when unbiased, drifting when biased */
    for (i = 0; i < carriers.length; i++) {
      var c = carriers[i];
      var speed = (heat ? 2.6 : 1.6) * (c.negative ? 1.25 : 0.85);
      c.t += 0.016 * speed;
      if (bias) {
        c.drift += 0.016 * (c.negative ? 1.5 : -1.05) * (heat ? 1.5 : 1);
        var x = ((c.drift * 1.5 + A) % (A * 2)) - A;
        if (!c.negative) x = -x;
        c.mesh.position.set(
          x,
          c.owner.home.y + Math.sin(c.t * 3) * 0.34,
          c.owner.home.z + Math.cos(c.t * 2.4) * 0.34
        );
      } else {
        var r = c.r + Math.sin(c.t) * 0.08;
        c.mesh.position.set(
          c.owner.mesh.position.x + Math.cos(c.t) * r,
          c.owner.mesh.position.y + Math.sin(c.t * 1.3) * r * 0.55,
          c.owner.mesh.position.z + Math.sin(c.t) * Math.cos(c.tilt) * r
        );
      }
      var pulse = 1 + Math.sin(t * 6 + c.t) * 0.14;
      c.mesh.scale.setScalar(pulse);
    }

    /* orbiting probes */
    for (i = 0; i < probes.length; i++) {
      var pr = probes[i];
      if (!reduced) pr.a += 0.0016 + pr.speed * 0.0022;
      pr.pulse += 0.03;
      var isHov = hoveredProbe === pr;
      pr.hoverT += ((isHov ? 1 : 0) - pr.hoverT) * 0.16;

      var beat = 1 + Math.sin(pr.pulse) * 0.10 + pr.hoverT * 0.55;
      pr.core.scale.setScalar(beat);
      pr.halo.scale.setScalar(1 + Math.sin(pr.pulse * 0.8) * 0.16 + pr.hoverT * 0.5);
      pr.halo.material.opacity = 0.11 + pr.hoverT * 0.22;
      pr.ring.rotation.z += 0.01 + pr.hoverT * 0.06;
      pr.ring.rotation.x = Math.PI / 2.6 + Math.sin(pr.pulse * 0.5) * 0.3;
      pr.ring.scale.setScalar(1 + pr.hoverT * 0.35);
      pr.label.material.opacity = 0.62 + pr.hoverT * 0.38;
      pr.label.scale.set(1.5 + pr.hoverT * 0.34, 0.39 + pr.hoverT * 0.09, 1);
    }
    placeProbes();

    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  if (hint) hint.textContent = 'drag · click an atom to dope · click a probe to jump';

  /* exposed for the geometry tests */
  canvas.__lattice = { scene: scene, camera: camera, cell: cell, atoms: atoms,
    carriers: carriers, probes: probes, orbits: orbits };
})();
