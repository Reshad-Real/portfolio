/* ============================================================
   scope3d.js — the hero: a bench oscilloscope.

   The cabinet is deliberately simple geometry — a box, a bezel, some
   knobs — because all the character lives on the screen, and the screen
   is a 2D canvas redrawn every frame. Flat drawing is where the detail
   can actually be controlled.

   The six front-panel keys are the site navigation. The knobs change
   what the scope is showing.
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('scopeCanvas');
  var fallback = document.getElementById('scopeFallback');
  if (!canvas) return;

  var B = window.Bench || {};
  var reduced = !!B.reduced;
  var readout = document.getElementById('scopeRead');
  var stat = document.getElementById('scopeStat');
  var runBtn = document.getElementById('runBtn');
  var modeBtn = document.getElementById('modeBtn');
  var hint = document.getElementById('scopeHint');

  function bail() {
    canvas.style.display = 'none';
    if (fallback) fallback.hidden = false;
    var tools = document.getElementById('scopeTools');
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
  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120);
  var CAM = 20.5;
  camera.position.set(CAM * 0.20, CAM * 0.30, CAM * 0.93);
  camera.lookAt(0, -0.1, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x4a5459, 0.72));
  var key = new THREE.DirectionalLight(0xfff6ec, 0.9);
  key.position.set(4, 8, 10);
  scene.add(key);
  var rim = new THREE.DirectionalLight(0x8fe0ee, 0.4);
  rim.position.set(-7, 3, -5);
  scene.add(rim);
  var screenGlow = new THREE.PointLight(0x3ee08a, 0.7, 12);
  screenGlow.position.set(-0.6, 0.7, 3.2);
  scene.add(screenGlow);

  var scope = new THREE.Group();
  scene.add(scope);

  function solid(c, shine, spec) {
    return new THREE.MeshPhongMaterial({
      color: c, shininess: shine === undefined ? 30 : shine,
      specular: spec === undefined ? 0x3a4246 : spec
    });
  }
  function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }

  var CASE = 0x59666d, CASE_D = 0x3e4a50, BEZEL = 0x232c31;

  /* ---------- cabinet ---------- */
  var body = box(11.4, 7.4, 3.4, solid(CASE, 22));
  scope.add(body);

  var faceplate = box(11.0, 7.0, 0.22, solid(CASE_D, 30));
  faceplate.position.z = 1.74;
  scope.add(faceplate);

  var bezel = box(7.5, 5.1, 0.34, solid(BEZEL, 46));
  bezel.position.set(-1.5, 0.65, 1.86);
  scope.add(bezel);

  /* carry handle */
  var handleMat = solid(0x2f373c, 40);
  var hTop = box(5.0, 0.34, 0.34, handleMat);
  hTop.position.set(0, 4.05, 0);
  scope.add(hTop);
  var hL = box(0.32, 0.9, 0.32, handleMat);
  hL.position.set(-2.35, 3.62, 0);
  scope.add(hL);
  var hR = box(0.32, 0.9, 0.32, handleMat);
  hR.position.set(2.35, 3.62, 0);
  scope.add(hR);

  /* feet */
  [-4.4, 4.4].forEach(function (x) {
    var foot = box(1.1, 0.34, 2.6, solid(0x2b3338, 18));
    foot.position.set(x, -3.85, 0);
    scope.add(foot);
  });

  /* vents on the right of the face */
  for (var v = 0; v < 7; v++) {
    var vent = box(1.7, 0.10, 0.06, solid(0x2b3338, 14));
    vent.position.set(3.25, 2.6 - v * 0.3, 1.87);
    scope.add(vent);
  }

  /* ---------- the screen: a 2D canvas, redrawn every frame ---------- */
  var SW = 768, SH = 512;
  var sc = document.createElement('canvas');
  sc.width = SW; sc.height = SH;
  var g = sc.getContext('2d');
  var screenTex = new THREE.CanvasTexture(sc);
  screenTex.needsUpdate = true;
  var screen = new THREE.Mesh(
    new THREE.PlaneGeometry(6.9, 4.6),
    new THREE.MeshBasicMaterial({ map: screenTex })
  );
  screen.position.set(-1.5, 0.65, 2.05);
  scope.add(screen);

  /* ---------- knobs ---------- */
  var knobMat = solid(0x8e9aa1, 62, 0xe8f2f6);
  var knobs = [];
  var KNOBS = [
    { id: 'mode', label: 'MODE', y: 2.05 },
    { id: 'freq', label: 'TIME/DIV', y: 0.55 },
    { id: 'amp', label: 'VOLTS/DIV', y: -0.95 }
  ];
  for (var k = 0; k < KNOBS.length; k++) {
    var grp = new THREE.Group();
    grp.position.set(3.25, KNOBS[k].y, 1.9);
    scope.add(grp);
    var knob = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.58, 0.42, 22), knobMat);
    knob.rotation.x = Math.PI / 2;
    grp.add(knob);
    var pointer3 = box(0.09, 0.44, 0.1, solid(0xe8eff2, 70));
    pointer3.position.set(0, 0.3, 0.22);
    grp.add(pointer3);
    var ringk = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.045, 8, 26), solid(0x2f383d, 20));
    ringk.position.z = -0.1;
    grp.add(ringk);
    knobs.push({ def: KNOBS[k], group: grp, knob: knob, angle: 0, want: 0, hoverT: 0 });
  }

  /* ---------- front-panel keys: the navigation ---------- */
  function keyTex(text, on) {
    var c = document.createElement('canvas');
    c.width = 256; c.height = 96;
    var x = c.getContext('2d');
    if (x) {
      x.fillStyle = on ? '#dff7ea' : '#384248';
      x.fillRect(0, 0, 256, 96);
      x.fillStyle = on ? '#0d3a28' : '#cfdde3';
      x.font = '700 34px Inter, system-ui, sans-serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText(text, 128, 52);
      x.fillStyle = on ? '#3ee08a' : '#5d6b73';
      x.fillRect(16, 14, 224, 4);
    }
    var t = new THREE.CanvasTexture(c);
    t.needsUpdate = true;
    return t;
  }

  var SECTIONS = [
    { id: 'about', label: 'ABOUT' },
    { id: 'work', label: 'WORK' },
    { id: 'papers', label: 'PAPERS' },
    { id: 'research', label: 'RESEARCH' },
    { id: 'teaching', label: 'TEACHING' },
    { id: 'contact', label: 'CONTACT' }
  ];
  var keys = [];
  var KEY_W = 1.62, KEY_H = 0.74;
  for (var i = 0; i < SECTIONS.length; i++) {
    var def = SECTIONS[i];
    var side = solid(0x364046, 26);
    var faceM = new THREE.MeshBasicMaterial({ map: keyTex(def.label, false) });
    var kb = new THREE.Mesh(new THREE.BoxGeometry(KEY_W, KEY_H, 0.36),
      [side, side, side, side, faceM, side]);
    kb.position.set(-4.35 + i * 1.74, -2.72, 1.86);
    scope.add(kb);
    keys.push({ def: def, mesh: kb, faceM: faceM, hoverT: 0, baseZ: 1.86 });
  }

  /* a label strip above the keys */
  var stripTex = (function () {
    var c = document.createElement('canvas');
    c.width = 1024; c.height = 64;
    var x = c.getContext('2d');
    if (x) {
      x.fillStyle = '#2b3439';
      x.fillRect(0, 0, 1024, 64);
      x.fillStyle = '#8fa2ab';
      x.font = '500 26px ui-monospace, monospace';
      x.textAlign = 'left';
      x.textBaseline = 'middle';
      x.fillText('SELECT  ·  press a key to jump to that section', 24, 34);
    }
    var t = new THREE.CanvasTexture(c);
    t.needsUpdate = true;
    return t;
  })();
  var strip = new THREE.Mesh(new THREE.PlaneGeometry(10.4, 0.62),
    new THREE.MeshBasicMaterial({ map: stripTex }));
  strip.position.set(0, -1.92, 1.89);
  scope.add(strip);

  /* ---------- scope state ---------- */
  var MODES = [
    { id: 'sine', name: 'CH1 · sine', note: 'A clean sine from the function generator.' },
    { id: 'square', name: 'CH1 · square', note: 'A square wave, with the overshoot a real probe would show.' },
    { id: 'ring', name: 'CH1 · step', note: 'A step response ringing down — an underdamped load.' },
    { id: 'lissajous', name: 'X-Y · Lissajous', note: 'Channel 1 against channel 2. The shape is the phase difference.' },
    { id: 'eye', name: 'CH1 · eye', note: 'An eye diagram: every bit period overlaid. The opening is your margin.' }
  ];
  var mode = 0, freqStep = 2, ampStep = 2, running = true;
  var FREQS = [0.5, 1, 2, 4, 8];
  var AMPS = [0.35, 0.55, 0.75, 0.95, 1.15];

  function modeDef() { return MODES[mode]; }

  function paintStat() {
    if (!stat) return;
    stat.textContent = running ? 'running' : 'stopped';
    stat.className = 'scope-stat' + (running ? ' live' : '');
  }
  function say(html) { if (readout) readout.innerHTML = html; }
  function sayDefault() {
    say('<b>' + modeDef().name + '</b> · ' + modeDef().note);
  }
  sayDefault();
  paintStat();

  function cycleMode(dir) {
    mode = (mode + (dir || 1) + MODES.length) % MODES.length;
    knobs[0].want += (dir || 1) * (Math.PI / 3);
    sayDefault();
    if (B.audio) B.audio.tone(520, 0.07, 'triangle', 0.04);
  }
  function cycleKnob(which) {
    if (which === 'freq') {
      freqStep = (freqStep + 1) % FREQS.length;
      knobs[1].want += Math.PI / 3;
      say('<b>TIME/DIV</b> · sweep set to step ' + (freqStep + 1) + ' of ' + FREQS.length);
    } else if (which === 'amp') {
      ampStep = (ampStep + 1) % AMPS.length;
      knobs[2].want += Math.PI / 3;
      say('<b>VOLTS/DIV</b> · vertical gain set to step ' + (ampStep + 1) + ' of ' + AMPS.length);
    } else {
      cycleMode(1);
      return;
    }
    if (B.audio) B.audio.tone(420, 0.06, 'square', 0.035);
  }

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

  /* ---------- drawing the screen ---------- */
  var phase = 0;
  var TRACE = '#3ee08a', TRACE_DIM = 'rgba(62,224,138,.28)';

  function drawScreen() {
    if (!g) return;
    var W = SW, H = SH;

    g.fillStyle = '#08130f';
    g.fillRect(0, 0, W, H);

    /* graticule */
    g.strokeStyle = 'rgba(120,180,150,.16)';
    g.lineWidth = 1;
    for (var x = 0; x <= 10; x++) {
      g.beginPath(); g.moveTo(x * W / 10, 0); g.lineTo(x * W / 10, H); g.stroke();
    }
    for (var y = 0; y <= 8; y++) {
      g.beginPath(); g.moveTo(0, y * H / 8); g.lineTo(W, y * H / 8); g.stroke();
    }
    g.strokeStyle = 'rgba(120,180,150,.34)';
    g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
    g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.stroke();
    /* centre tick marks */
    g.strokeStyle = 'rgba(120,180,150,.4)';
    for (var t2 = 0; t2 < 50; t2++) {
      var px = t2 * W / 50;
      g.beginPath(); g.moveTo(px, H / 2 - 5); g.lineTo(px, H / 2 + 5); g.stroke();
    }

    var amp = AMPS[ampStep] * (H / 2 - 40);
    var f = FREQS[freqStep];
    var mid = H / 2;

    function stroke(fn, colour, width, alpha) {
      g.strokeStyle = colour;
      g.lineWidth = width;
      g.globalAlpha = alpha === undefined ? 1 : alpha;
      g.beginPath();
      fn();
      g.stroke();
      g.globalAlpha = 1;
    }

    var m = modeDef().id;

    if (m === 'lissajous') {
      var a = f, b = f + 1;
      function liss() {
        for (var i = 0; i <= 420; i++) {
          var th = (i / 420) * Math.PI * 2;
          var px2 = W / 2 + Math.sin(a * th + phase) * (W / 2 - 60) * 0.62;
          var py = mid + Math.sin(b * th) * amp;
          if (i === 0) g.moveTo(px2, py); else g.lineTo(px2, py);
        }
      }
      stroke(liss, TRACE_DIM, 9, 0.5);
      stroke(liss, TRACE, 2.6);
    } else if (m === 'eye') {
      for (var s = 0; s < 14; s++) {
        var bit0 = (s % 2), bit1 = ((s * 7 + 3) % 3) % 2;
        (function (b0, b1, idx) {
          function eye() {
            for (var i = 0; i <= 120; i++) {
              var u = i / 120;
              var lv = b0 + (b1 - b0) * (0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, u * 2.4)));
              var px3 = u * W;
              var py2 = mid + (0.5 - lv) * amp * 1.7 + Math.sin(u * 30 + idx) * 3;
              if (i === 0) g.moveTo(px3, py2); else g.lineTo(px3, py2);
            }
          }
          stroke(eye, TRACE, 1.8, 0.42);
        })(bit0, bit1, s + phase);
      }
      g.strokeStyle = 'rgba(62,224,138,.9)';
      g.lineWidth = 2;
      g.strokeRect(W * 0.36, mid - amp * 0.42, W * 0.28, amp * 0.84);
      g.fillStyle = 'rgba(62,224,138,.75)';
      g.font = '500 22px ui-monospace, monospace';
      g.fillText('eye opening', W * 0.36 + 8, mid - amp * 0.42 - 10);
    } else {
      function wave() {
        for (var i = 0; i <= W; i += 2) {
          var u2 = i / W;
          var th2 = u2 * Math.PI * 2 * f + phase;
          var val;
          if (m === 'sine') val = Math.sin(th2);
          else if (m === 'square') {
            val = Math.sin(th2) >= 0 ? 1 : -1;
            var edge = Math.abs(Math.sin(th2));
            if (edge < 0.18) val *= 1 + (0.18 - edge) * 1.6;   /* overshoot at the edges */
          } else {
            var env = Math.exp(-u2 * 3.2);
            val = u2 < 0.08 ? (u2 / 0.08) - 1 : Math.cos((u2 - 0.08) * Math.PI * 2 * f * 1.6 + phase) * env;
          }
          var py3 = mid - val * amp;
          if (i === 0) g.moveTo(i, py3); else g.lineTo(i, py3);
        }
      }
      stroke(wave, TRACE_DIM, 10, 0.45);
      stroke(wave, TRACE, 2.8);
    }

    /* channel markers */
    g.fillStyle = TRACE;
    g.beginPath();
    g.moveTo(4, mid - 10); g.lineTo(20, mid); g.lineTo(4, mid + 10);
    g.closePath(); g.fill();

    /* text overlays */
    g.font = '600 24px ui-monospace, monospace';
    g.fillStyle = 'rgba(206,240,224,.92)';
    g.fillText(modeDef().name, 16, 34);

    g.textAlign = 'right';
    g.fillStyle = running ? '#9ef0c4' : '#ffb36b';
    g.fillText(running ? 'TRIG  AUTO' : 'STOPPED', W - 16, 34);
    g.textAlign = 'left';

    g.font = '500 21px ui-monospace, monospace';
    g.fillStyle = 'rgba(160,205,185,.78)';
    var labels = [
      (FREQS[freqStep] * 50) + ' µs/div',
      AMPS[ampStep].toFixed(2) + ' V/div',
      'Vpp ' + (AMPS[ampStep] * 2).toFixed(2) + ' V',
      'f ' + (FREQS[freqStep] * 1.25).toFixed(2) + ' kHz'
    ];
    for (var li = 0; li < labels.length; li++) {
      g.fillText(labels[li], 16 + li * 190, H - 16);
    }

    screenTex.needsUpdate = true;
  }

  /* ---------- sizing ---------- */
  function resize() {
    var w = canvas.clientWidth || 520;
    var h = canvas.clientHeight || 380;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.setLength(w < 460 ? CAM * 1.2 : CAM);
    camera.lookAt(0, -0.1, 0);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  /* ---------- picking ---------- */
  var pointer = new THREE.Vector2(-2, -2);
  var ray = new THREE.Raycaster();
  var hoverKey = null, hoverKnob = null;
  var yaw = 0, pitch = 0, yawV = 0, pitchV = 0;
  var dragging = false, moved = false, lastX = 0, lastY = 0;

  function setPointer(ev) {
    var r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
  }
  function targets() {
    var out = [];
    for (var i = 0; i < keys.length; i++) out.push(keys[i].mesh);
    for (i = 0; i < knobs.length; i++) out.push(knobs[i].knob);
    return out;
  }
  function pick(clicked) {
    ray.setFromCamera(pointer, camera);
    var hits = ray.intersectObjects(targets(), false);
    var obj = hits.length ? hits[0].object : null;
    var kk = null, kn = null;
    for (var i = 0; i < keys.length; i++) if (keys[i].mesh === obj) kk = keys[i];
    for (i = 0; i < knobs.length; i++) if (knobs[i].knob === obj) kn = knobs[i];

    if (kk !== hoverKey || kn !== hoverKnob) {
      hoverKey = kk; hoverKnob = kn;
      if (kk) say('<b>Go to ' + kk.def.label.charAt(0) + kk.def.label.slice(1).toLowerCase() +
        '</b> · press this key to jump there');
      else if (kn) say('<b>' + kn.def.label + '</b> · turn it');
      else sayDefault();
    }
    canvas.style.cursor = (kk || kn) ? 'pointer' : 'grab';

    if (clicked) {
      if (kk) goToSection(kk.def.id);
      else if (kn) cycleKnob(kn.def.id);
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
    yawV += dx * 0.0035;
    pitchV += dy * 0.0022;
  });
  window.addEventListener('pointerup', function (ev) {
    if (!dragging) return;
    dragging = false;
    canvas.style.cursor = 'grab';
    if (!moved && ev) { setPointer(ev); pick(true); }
  });
  canvas.addEventListener('pointerleave', function () {
    pointer.set(-2, -2);
    hoverKey = null; hoverKnob = null;
    sayDefault();
  });
  canvas.addEventListener('keydown', function (ev) {
    if (ev.key === 'ArrowLeft') { yawV -= 0.05; ev.preventDefault(); }
    if (ev.key === 'ArrowRight') { yawV += 0.05; ev.preventDefault(); }
    if (ev.key === 'ArrowUp') { pitchV -= 0.035; ev.preventDefault(); }
    if (ev.key === 'ArrowDown') { pitchV += 0.035; ev.preventDefault(); }
    if (ev.key === 'Enter' || ev.key === ' ') { cycleMode(1); ev.preventDefault(); }
  });

  /* ---------- panel controls ---------- */
  if (runBtn) {
    runBtn.addEventListener('click', function () {
      running = !running;
      runBtn.setAttribute('aria-pressed', running ? 'true' : 'false');
      runBtn.classList.toggle('on', running);
      var sp = runBtn.querySelector('.sw-state');
      if (sp) sp.textContent = running ? 'RUN' : 'STOP';
      paintStat();
      if (B.audio) B.audio.tone(running ? 640 : 300, 0.11, 'triangle', 0.05);
    });
    runBtn.classList.add('on');
  }
  if (modeBtn) {
    modeBtn.addEventListener('click', function () {
      cycleMode(1);
      var sp = modeBtn.querySelector('.sw-state');
      if (sp) sp.textContent = modeDef().id.toUpperCase();
    });
    var sp0 = modeBtn.querySelector('.sw-state');
    if (sp0) sp0.textContent = modeDef().id.toUpperCase();
  }

  /* ---------- theme ---------- */
  function applyTheme() {
    var c = (B.colors ? B.colors() : {}) || {};
    var dark = !!c.dark;
    body.material.color.setHex(dark ? 0x3f4a50 : CASE);
    faceplate.material.color.setHex(dark ? 0x2c363b : CASE_D);
    key.intensity = dark ? 0.72 : 0.9;
    screenGlow.intensity = dark ? 1.0 : 0.7;
  }
  if (B.onTheme) B.onTheme(applyTheme);
  applyTheme();

  /* ---------- loop ---------- */
  var visible = true, awake = true;
  try {
    var io = new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0.02 });
    io.observe(canvas);
  } catch (e) {}
  document.addEventListener('visibilitychange', function () { awake = !document.hidden; });

  function frame() {
    requestAnimationFrame(frame);
    if (!visible || !awake) return;

    if (!dragging && !reduced) yawV += (0 - yaw) * 0.0006;
    yaw += yawV; pitch += pitchV;
    yawV *= 0.90; pitchV *= 0.88;
    yaw = Math.max(-0.55, Math.min(0.55, yaw));
    pitch = Math.max(-0.3, Math.min(0.36, pitch));
    scope.rotation.y = yaw + (reduced ? 0 : Math.sin(Date.now() * 0.00018) * 0.05);
    scope.rotation.x = pitch;

    if (!dragging) pick(false);

    if (running && !reduced) phase += 0.045;
    else if (running) phase += 0.008;
    drawScreen();

    for (var i = 0; i < keys.length; i++) {
      var kk = keys[i];
      var want = hoverKey === kk ? 1 : 0;
      if (kk.hoverT !== want) {
        kk.hoverT += (want - kk.hoverT) * 0.25;
        if (Math.abs(kk.hoverT - want) < 0.03) {
          kk.hoverT = want;
          kk.faceM.map = keyTex(kk.def.label, want === 1);
          kk.faceM.needsUpdate = true;
        }
      }
      kk.mesh.position.z = kk.baseZ - kk.hoverT * 0.12;
      kk.mesh.position.y = -2.72 - kk.hoverT * 0.03;
    }

    for (i = 0; i < knobs.length; i++) {
      var kn = knobs[i];
      kn.angle += (kn.want - kn.angle) * 0.18;
      kn.group.rotation.z = kn.angle;
      var hw = hoverKnob === kn ? 1 : 0;
      kn.hoverT += (hw - kn.hoverT) * 0.18;
      kn.group.scale.setScalar(1 + kn.hoverT * 0.1);
    }

    screenGlow.intensity = (running ? 0.7 : 0.3) + Math.sin(phase * 2) * 0.06;

    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  if (hint) hint.textContent = 'drag to tilt · turn the knobs · press a key';

  canvas.__scope = {
    scene: scene, camera: camera, scope: scope, keys: keys, knobs: knobs,
    modes: MODES, mode: function () { return MODES[mode].id; },
    isRunning: function () { return running; },
    screenCanvas: sc
  };
})();
