/* ============================================================
   refs3d.js — two small 3D figures for the reference cards.
   Stylised, not portraits. They idle, blink, look toward your
   cursor when it is over their card, and nod when you click.
   ============================================================ */
(function () {
  'use strict';

  var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-ref-figure]'));
  if (!nodes.length) return;

  var B = window.Bench || {};
  var reduced = !!B.reduced;

  if (!window.THREE) {
    nodes.forEach(function (n) { n.style.display = 'none'; });
    return;
  }

  var SIZE = 190;

  function mat(color, shine, spec) {
    return new THREE.MeshPhongMaterial({
      color: color, shininess: shine === undefined ? 14 : shine,
      specular: spec === undefined ? 0x2a2420 : spec
    });
  }
  function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }
  function ball(r, m, s) { return new THREE.Mesh(new THREE.SphereGeometry(r, s || 18, s || 16), m); }
  function tube(rt, rb, h, m) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 16), m); }

  function build(canvas, opts) {
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
      if (!renderer.getContext()) throw new Error('no gl');
    } catch (e) { canvas.style.display = 'none'; return null; }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(SIZE, SIZE, false);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40);
    camera.position.set(0, 0.35, 6.1);
    camera.lookAt(0, 0.18, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x555f63, 0.82));
    var key = new THREE.DirectionalLight(0xfff4e8, 0.78);
    key.position.set(2.4, 4, 4);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0x9fe8f2, 0.34);
    fill.position.set(-3, 1.4, 2);
    scene.add(fill);

    var SKIN = opts.skin, HAIR = opts.hair, SHIRT = opts.shirt;
    var skinM = mat(SKIN, 10, 0x3a2c22);
    var hairM = mat(HAIR, 22, 0x4a4a4a);
    var shirtM = mat(SHIRT, 8, 0x22282a);

    var person = new THREE.Group();
    person.position.y = -0.32;
    scene.add(person);

    /* shoulders + shirt */
    var torso = box(1.62, 0.92, 0.72, shirtM);
    torso.position.y = -0.72;
    person.add(torso);
    var shoulderL = ball(0.34, shirtM, 14); shoulderL.position.set(-0.78, -0.48, 0); shoulderL.scale.set(1, 0.85, 0.95); person.add(shoulderL);
    var shoulderR = ball(0.34, shirtM, 14); shoulderR.position.set(0.78, -0.48, 0); shoulderR.scale.set(1, 0.85, 0.95); person.add(shoulderR);

    /* collar */
    var collar = box(0.62, 0.16, 0.5, mat(opts.collar, 14, 0x333a3c));
    collar.position.set(0, -0.30, 0.18);
    person.add(collar);

    var neck = tube(0.19, 0.22, 0.36, skinM);
    neck.position.y = -0.24;
    person.add(neck);

    /* head */
    var head = new THREE.Group();
    head.position.y = 0.22;
    person.add(head);

    var skull = ball(0.46, skinM);
    skull.scale.set(0.94, 1.06, 0.94);
    head.add(skull);

    var jaw = box(0.62, 0.34, 0.56, skinM);
    jaw.position.y = -0.32;
    head.add(jaw);

    var earL = ball(0.09, skinM, 10); earL.scale.set(0.6, 1.1, 0.9); earL.position.set(-0.44, -0.04, 0); head.add(earL);
    var earR = ball(0.09, skinM, 10); earR.scale.set(0.6, 1.1, 0.9); earR.position.set(0.44, -0.04, 0); head.add(earR);

    var nose = ball(0.09, skinM, 10);
    nose.scale.set(0.8, 1.1, 1.2);
    nose.position.set(0, -0.08, 0.42);
    head.add(nose);

    var mouth = box(0.20, 0.035, 0.05, mat(0x6d3a30, 8));
    mouth.position.set(0, -0.28, 0.40);
    head.add(mouth);

    /* eyes */
    var eyeM = mat(0x171310, 80, 0xffffff);
    var eyeL = ball(0.058, eyeM, 12); eyeL.position.set(-0.17, 0.03, 0.39); head.add(eyeL);
    var eyeR = ball(0.058, eyeM, 12); eyeR.position.set(0.17, 0.03, 0.39); head.add(eyeR);
    var lidL = box(0.15, 0.07, 0.08, skinM); lidL.position.set(-0.17, 0.11, 0.39); head.add(lidL);
    var lidR = box(0.15, 0.07, 0.08, skinM); lidR.position.set(0.17, 0.11, 0.39); head.add(lidR);

    /* brows */
    var browM = mat(opts.brow, 10);
    var browL = box(0.19, 0.045, 0.06, browM); browL.position.set(-0.17, 0.15, 0.40); head.add(browL);
    var browR = box(0.19, 0.045, 0.06, browM); browR.position.set(0.17, 0.15, 0.40); head.add(browR);

    /* hair */
    var hair = new THREE.Group();
    head.add(hair);
    var cap = ball(0.475, hairM);
    cap.scale.set(0.96, opts.hairHeight, 0.97);
    cap.position.y = opts.hairY;
    hair.add(cap);
    var back = box(0.78, 0.44, 0.30, hairM);
    back.position.set(0, 0.04, -0.30);
    hair.add(back);
    if (opts.receding) {
      /* pull the front of the hairline back and up */
      var temple = box(0.86, 0.20, 0.30, skinM);
      temple.position.set(0, 0.30, 0.28);
      hair.add(temple);
    } else {
      var fringe = box(0.72, 0.16, 0.16, hairM);
      fringe.position.set(0, 0.34, 0.34);
      hair.add(fringe);
    }

    /* beard / stubble */
    if (opts.beard) {
      var beard = box(0.60, 0.30, 0.50, mat(opts.beardColor, 8));
      beard.position.set(0, -0.36, 0.04);
      head.add(beard);
      var chin = box(0.28, 0.12, 0.16, mat(opts.beardColor, 8));
      chin.position.set(0, -0.46, 0.30);
      head.add(chin);
    }

    /* glasses */
    if (opts.glasses) {
      var frameM = mat(0x2b3336, 70, 0xcfe0e4);
      var ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.022, 8, 20), frameM);
      ring1.position.set(-0.17, 0.03, 0.42);
      head.add(ring1);
      var ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.022, 8, 20), frameM);
      ring2.position.set(0.17, 0.03, 0.42);
      head.add(ring2);
      var bridge = box(0.10, 0.022, 0.022, frameM);
      bridge.position.set(0, 0.05, 0.44);
      head.add(bridge);
      var armL = box(0.022, 0.022, 0.30, frameM); armL.position.set(-0.30, 0.04, 0.30); head.add(armL);
      var armR = box(0.022, 0.022, 0.30, frameM); armR.position.set(0.30, 0.04, 0.30); head.add(armR);
      var lensM = new THREE.MeshPhongMaterial({ color: 0xdff2f6, transparent: true, opacity: 0.20, shininess: 100 });
      var lens1 = new THREE.Mesh(new THREE.CircleGeometry(0.13, 18), lensM); lens1.position.set(-0.17, 0.03, 0.425); head.add(lens1);
      var lens2 = new THREE.Mesh(new THREE.CircleGeometry(0.13, 18), lensM); lens2.position.set(0.17, 0.03, 0.425); head.add(lens2);
    }

    /* a little lanyard so they read as faculty */
    var lan1 = box(0.05, 0.46, 0.03, mat(opts.accent, 20));
    lan1.position.set(-0.20, -0.55, 0.36); lan1.rotation.z = 0.18;
    person.add(lan1);
    var lan2 = box(0.05, 0.46, 0.03, mat(opts.accent, 20));
    lan2.position.set(0.20, -0.55, 0.36); lan2.rotation.z = -0.18;
    person.add(lan2);
    var badge = box(0.26, 0.34, 0.03, mat(0xf2f6f7, 30, 0xffffff));
    badge.position.set(0, -0.90, 0.38);
    person.add(badge);
    var badgeLine = box(0.16, 0.03, 0.02, mat(opts.accent, 20));
    badgeLine.position.set(0, -0.82, 0.40);
    person.add(badgeLine);

    return {
      canvas: canvas, renderer: renderer, scene: scene, camera: camera,
      person: person, head: head, hair: hair, mouth: mouth,
      lidL: lidL, lidR: lidR, eyeL: eyeL, eyeR: eyeR,
      browL: browL, browR: browR, skinM: skinM, hairM: hairM,
      look: { x: 0, y: 0 }, blink: 0, nextBlink: 1 + Math.random() * 3,
      nod: 0, wave: 0, t: Math.random() * 10, hover: false
    };
  }

  var PEOPLE = {
    older: {
      skin: 0xa9784f, hair: 0xb9bfc2, brow: 0x9aa1a4, shirt: 0x34474f,
      collar: 0xe8eef0, accent: 0x0c7b86, hairHeight: 0.62, hairY: 0.20,
      glasses: true, beard: true, beardColor: 0xb9bfc2, receding: true
    },
    younger: {
      skin: 0xb07a4e, hair: 0x2a1d15, brow: 0x2a1d15, shirt: 0x1d5f68,
      collar: 0xf2f6f7, accent: 0xa3e635, hairHeight: 0.78, hairY: 0.13,
      glasses: false, beard: true, beardColor: 0x35251a, receding: false
    }
  };

  var built = [];
  nodes.forEach(function (canvas) {
    var kind = canvas.getAttribute('data-ref-figure');
    var opts = PEOPLE[kind] || PEOPLE.younger;
    var f = build(canvas, opts);
    if (!f) return;
    built.push(f);

    var card = canvas.closest ? canvas.closest('.ref') : null;
    var host = card || canvas;

    host.addEventListener('pointermove', function (ev) {
      var r = canvas.getBoundingClientRect();
      if (!r.width) return;
      f.hover = true;
      f.look.x = Math.max(-1, Math.min(1, ((ev.clientX - (r.left + r.width / 2)) / (r.width * 1.6))));
      f.look.y = Math.max(-1, Math.min(1, ((ev.clientY - (r.top + r.height / 2)) / (r.height * 1.6))));
    });
    host.addEventListener('pointerleave', function () {
      f.hover = false;
      f.look.x = 0; f.look.y = 0;
    });
    host.addEventListener('click', function () {
      f.nod = 1;
      if (B.audio) B.audio.tone(520, 0.09, 'sine', 0.035);
    });
    canvas.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); f.nod = 1; }
    });
  });

  if (B.onTheme) {
    B.onTheme(function (c) {
      built.forEach(function (f) {
        f.scene.children.forEach(function (o) {
          if (o.isHemisphereLight) o.intensity = c.dark ? 0.66 : 0.82;
          if (o.isDirectionalLight) o.intensity = o.color.getHex() === 0x9fe8f2 ? (c.dark ? 0.5 : 0.34) : (c.dark ? 0.6 : 0.78);
        });
      });
    });
  }

  /* one loop drives both figures */
  var visible = true, running = true;
  document.addEventListener('visibilitychange', function () { running = !document.hidden; });
  try {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        for (var i = 0; i < built.length; i++) {
          if (built[i].canvas === e.target) built[i].onScreen = e.isIntersecting;
        }
      });
    }, { threshold: 0.05 });
    built.forEach(function (f) { io.observe(f.canvas); f.onScreen = false; });
  } catch (e) {
    built.forEach(function (f) { f.onScreen = true; });
  }

  function frame() {
    requestAnimationFrame(frame);
    if (!running) return;

    for (var i = 0; i < built.length; i++) {
      var f = built[i];
      if (!f.onScreen) continue;
      f.t += 0.016;

      f.nod *= 0.94;
      f.blink *= 0.78;
      f.nextBlink -= 0.016;
      if (f.nextBlink <= 0) { f.blink = 1; f.nextBlink = 2 + Math.random() * 4; }

      var idleX = reduced ? 0 : Math.sin(f.t * 0.42) * 0.16;
      var idleY = reduced ? 0 : Math.sin(f.t * 0.31 + 1.2) * 0.05;

      f.head.rotation.y += ((f.hover ? f.look.x * 0.55 : idleX) - f.head.rotation.y) * 0.09;
      f.head.rotation.x += ((f.hover ? f.look.y * 0.32 : idleY) + f.nod * 0.34 - f.head.rotation.x) * 0.12;
      f.head.rotation.z += ((f.hover ? f.look.x * 0.08 : 0) - f.head.rotation.z) * 0.08;

      f.person.position.y = -0.32 + (reduced ? 0 : Math.sin(f.t * 1.5) * 0.012);
      f.person.rotation.y += ((f.hover ? f.look.x * 0.16 : Math.sin(f.t * 0.27) * 0.06) - f.person.rotation.y) * 0.06;

      /* blink */
      f.lidL.scale.y = 1 + f.blink * 3.4;
      f.lidR.scale.y = 1 + f.blink * 3.4;
      f.lidL.position.y = 0.11 - f.blink * 0.085;
      f.lidR.position.y = 0.11 - f.blink * 0.085;

      /* a small smile when you hover, a bigger one when you click */
      var smile = (f.hover ? 0.45 : 0) + f.nod * 0.7;
      f.mouth.scale.set(1 + smile * 0.32, 1 + smile * 1.5, 1);
      f.mouth.position.y = -0.28 - smile * 0.012;
      f.browL.position.y = 0.15 + smile * 0.028;
      f.browR.position.y = 0.15 + smile * 0.028;

      f.renderer.render(f.scene, f.camera);
    }
  }
  requestAnimationFrame(frame);
})();
