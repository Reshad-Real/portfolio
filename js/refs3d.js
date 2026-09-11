/* ============================================================
   refs3d.js — two small 3D busts for the reference cards.
   Stylised, not portraits. They breathe, blink, follow your
   cursor across their card, and nod when clicked.

   Framing rule: the whole bust is sized to sit inside the canvas
   with margin, so nothing is ever cropped by the frame.
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

  var SIZE = 112;

  function mat(color, shine, spec) {
    return new THREE.MeshPhongMaterial({
      color: color, shininess: shine === undefined ? 12 : shine,
      specular: spec === undefined ? 0x2a2018 : spec
    });
  }
  function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }
  function ball(r, m, s) { return new THREE.Mesh(new THREE.SphereGeometry(r, s || 20, s || 16), m); }
  function tube(rt, rb, h, m) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 16), m); }

  function build(canvas, o) {
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
      if (!renderer.getContext()) throw new Error('no gl');
    } catch (e) { canvas.style.display = 'none'; return null; }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(SIZE, SIZE, false);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
    camera.position.set(0, 0.06, 4.5);
    camera.lookAt(0, 0.02, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x59646a, 0.86));
    var key = new THREE.DirectionalLight(0xfff4e8, 0.8);
    key.position.set(2.2, 3.4, 4);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0x9fe8f2, 0.32);
    fill.position.set(-3, 1, 2.4);
    scene.add(fill);

    var skinM = mat(o.skin, 3, 0x1f1811);
    var hairM = mat(o.hair, 8, 0x3a3a3a);
    var shirtM = mat(o.shirt, 4, 0x181d1f);

    var person = new THREE.Group();
    scene.add(person);

    /* ---- shoulders: a bust, cut off at the bottom of the frame ---- */
    var shoulders = ball(0.92, shirtM, 22);
    shoulders.scale.set(1.62, 0.90, 0.92);
    shoulders.position.y = -1.44;
    person.add(shoulders);

    var collarM = mat(o.collar, 12, 0x333a3c);
    var collarRing = new THREE.Mesh(new THREE.TorusGeometry(0.235, 0.05, 8, 22), collarM);
    collarRing.position.set(0, -0.70, 0.02);
    collarRing.rotation.x = Math.PI / 2 - 0.22;
    person.add(collarRing);
    var vL = box(0.05, 0.30, 0.04, collarM);
    vL.position.set(-0.11, -0.86, 0.28); vL.rotation.z = 0.42;
    person.add(vL);
    var vR = box(0.05, 0.30, 0.04, collarM);
    vR.position.set(0.11, -0.86, 0.28); vR.rotation.z = -0.42;
    person.add(vR);

    var neck = tube(0.17, 0.21, 0.36, skinM);
    neck.position.y = -0.70;
    person.add(neck);

    /* ---- head ---- */
    var head = new THREE.Group();
    head.position.y = -0.06;
    person.add(head);

    var skull = ball(0.46, skinM);
    skull.scale.set(0.95, 1.06, 0.96);
    head.add(skull);

    var jaw = ball(0.34, skinM, 18);
    jaw.scale.set(0.94, 0.86, 0.92);
    jaw.position.y = -0.28;
    head.add(jaw);

    var earL = ball(0.085, skinM, 12); earL.scale.set(0.55, 1.15, 0.85); earL.position.set(-0.43, -0.04, 0); head.add(earL);
    var earR = ball(0.085, skinM, 12); earR.scale.set(0.55, 1.15, 0.85); earR.position.set(0.43, -0.04, 0); head.add(earR);

    /* the nose is the frontmost thing on the face — hair must stay behind it */
    var nose = ball(0.085, skinM, 12);
    nose.scale.set(0.82, 1.15, 1.25);
    nose.position.set(0, -0.07, 0.42);
    head.add(nose);

    var mouth = box(0.20, 0.04, 0.05, mat(0x71392f, 6));
    mouth.position.set(0, -0.27, 0.38);
    head.add(mouth);

    var eyeM = mat(0x161210, 78, 0xffffff);
    var eyeL = ball(0.050, eyeM, 16); eyeL.position.set(-0.163, 0.035, 0.385); head.add(eyeL);
    var eyeR = ball(0.050, eyeM, 16); eyeR.position.set(0.163, 0.035, 0.385); head.add(eyeR);
    var lidL = ball(0.058, skinM, 14); lidL.position.set(-0.163, 0.108, 0.372); head.add(lidL);
    var lidR = ball(0.058, skinM, 14); lidR.position.set(0.163, 0.108, 0.372); head.add(lidR);

    var browM = mat(o.brow, 9);
    var browL = box(0.185, 0.05, 0.06, browM); browL.position.set(-0.168, 0.155, 0.383); head.add(browL);
    var browR = box(0.185, 0.05, 0.06, browM); browR.position.set(0.168, 0.155, 0.383); head.add(browR);

    /* ---- hair ----
       One shell that follows the skull, plus a band around the sides and
       back. Nothing is a loose box hanging off a temple, and nothing
       reaches further forward than the brow. */
    var hair = new THREE.Group();
    head.add(hair);

    /* The cap is deliberately larger than the skull (0.46 x 1.06 = 0.488 tall).
       When it was smaller the crown poked through and both figures read bald. */
    var cap = ball(0.505, hairM, 26);
    cap.scale.set(o.capS[0], o.capS[1], o.capS[2]);
    cap.position.set(0, o.hairY, o.hairZ);
    hair.add(cap);

    /* sides and back, as a shell that follows the skull rather than a
       torus arc — an arc's bounding volume kept reaching past the nose */
    var sides = ball(0.472, hairM, 20);
    sides.scale.set(o.sideS[0], o.sideS[1], o.sideS[2]);
    sides.position.set(0, o.sideY, o.sideZ);
    hair.add(sides);

    var backHair = ball(0.44, hairM, 18);
    backHair.scale.set(0.94, o.backH, 0.58);
    backHair.position.set(0, 0.06, -0.22);
    hair.add(backHair);

    if (o.fringe) {
      var fringe = ball(0.40, hairM, 16);
      fringe.scale.set(1.02, 0.40, 0.62);
      fringe.position.set(0, 0.31, 0.08);
      hair.add(fringe);
    }

    /* ---- beard ---- */
    var beard = null;
    if (o.beard) {
      beard = new THREE.Group();
      head.add(beard);
      var beardM = mat(o.beardColor, 6);
      var cheek = ball(0.335, beardM, 20);
      cheek.scale.set(0.98, 0.74, 0.92);
      cheek.position.set(0, -0.31, -0.01);
      beard.add(cheek);
      /* carve the mouth back out of the beard */
      var lipGap = ball(0.10, skinM, 12);
      lipGap.scale.set(1.5, 0.62, 0.7);
      lipGap.position.set(0, -0.255, 0.30);
      beard.add(lipGap);
    }

    /* ---- glasses ---- */
    if (o.glasses) {
      var frameM = mat(0x2b3336, 70, 0xcfe0e4);
      var r1 = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.017, 8, 20), frameM);
      r1.position.set(-0.165, 0.04, 0.40); head.add(r1);
      var r2 = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.017, 8, 20), frameM);
      r2.position.set(0.165, 0.04, 0.40); head.add(r2);
      var bridge = box(0.10, 0.018, 0.018, frameM);
      bridge.position.set(0, 0.06, 0.41); head.add(bridge);
      var aL = box(0.018, 0.018, 0.26, frameM); aL.position.set(-0.30, 0.05, 0.28); head.add(aL);
      var aR = box(0.018, 0.018, 0.26, frameM); aR.position.set(0.30, 0.05, 0.28); head.add(aR);
      var lensM = new THREE.MeshPhongMaterial({ color: 0xdff2f6, transparent: true, opacity: 0.16, shininess: 100 });
      var l1 = new THREE.Mesh(new THREE.CircleGeometry(0.10, 18), lensM); l1.position.set(-0.165, 0.04, 0.405); head.add(l1);
      var l2 = new THREE.Mesh(new THREE.CircleGeometry(0.10, 18), lensM); l2.position.set(0.165, 0.04, 0.405); head.add(l2);
    }

    /* ---- lanyard ---- */
    var accentM = mat(o.accent, 18);
    var lan1 = box(0.04, 0.36, 0.03, accentM);
    lan1.position.set(-0.17, -0.90, 0.30); lan1.rotation.z = 0.16;
    person.add(lan1);
    var lan2 = box(0.04, 0.36, 0.03, accentM);
    lan2.position.set(0.17, -0.90, 0.30); lan2.rotation.z = -0.16;
    person.add(lan2);
    var badge = box(0.22, 0.28, 0.025, mat(0xf2f6f7, 26, 0xffffff));
    badge.position.set(0, -1.18, 0.34);
    person.add(badge);

    return {
      canvas: canvas, renderer: renderer, scene: scene, camera: camera,
      person: person, head: head, hair: hair, mouth: mouth, nose: nose, skullMesh: skull,
      lidL: lidL, lidR: lidR, eyeL: eyeL, eyeR: eyeR, browL: browL, browR: browR,
      beard: beard,
      look: { x: 0, y: 0 }, blink: 0, nextBlink: 1 + Math.random() * 3,
      nod: 0, t: Math.random() * 10, hover: false, onScreen: false
    };
  }

  var PEOPLE = {
    older: {
      skin: 0xb08055, hair: 0xaeb5b9, brow: 0x98a0a4, shirt: 0x34474f,
      collar: 0xe8eef0, accent: 0x0c7b86, beardColor: 0xb4bbbf,
      capS: [0.99, 0.88, 0.93], hairY: 0.115, hairZ: -0.10,
      sideS: [1.00, 0.84, 0.93], sideY: 0.02, sideZ: -0.07, backH: 0.74,
      glasses: true, beard: true, fringe: false
    },
    younger: {
      skin: 0xb88154, hair: 0x2b1e16, brow: 0x2b1e16, shirt: 0x1d5f68,
      collar: 0xf2f6f7, accent: 0x6dbb1c, beardColor: 0x35251a,
      capS: [1.02, 0.98, 0.98], hairY: 0.085, hairZ: -0.05,
      sideS: [1.02, 0.92, 0.97], sideY: 0.03, sideZ: -0.06, backH: 0.82,
      glasses: false, beard: true, fringe: true
    }
  };

  var built = [];
  nodes.forEach(function (canvas) {
    var kind = canvas.getAttribute('data-ref-figure');
    var f = build(canvas, PEOPLE[kind] || PEOPLE.younger);
    if (!f) return;
    f.kind = kind;
    built.push(f);

    var host = (canvas.closest && canvas.closest('.ref')) || canvas;

    host.addEventListener('pointermove', function (ev) {
      var r = canvas.getBoundingClientRect();
      if (!r.width) return;
      f.hover = true;
      f.look.x = Math.max(-1, Math.min(1, (ev.clientX - (r.left + r.width / 2)) / (r.width * 1.5)));
      f.look.y = Math.max(-1, Math.min(1, (ev.clientY - (r.top + r.height / 2)) / (r.height * 1.5)));
    });
    host.addEventListener('pointerleave', function () {
      f.hover = false; f.look.x = 0; f.look.y = 0;
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
        f.scene.children.forEach(function (obj) {
          if (obj.isHemisphereLight) obj.intensity = c.dark ? 0.7 : 0.86;
          else if (obj.isDirectionalLight) obj.intensity = obj.intensity > 0.5 ? (c.dark ? 0.66 : 0.8) : (c.dark ? 0.46 : 0.32);
        });
      });
    });
  }

  var running = true;
  document.addEventListener('visibilitychange', function () { running = !document.hidden; });
  try {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        for (var i = 0; i < built.length; i++) {
          if (built[i].canvas === e.target) built[i].onScreen = e.isIntersecting;
        }
      });
    }, { threshold: 0.05 });
    built.forEach(function (f) { io.observe(f.canvas); });
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

      var idleX = reduced ? 0 : Math.sin(f.t * 0.4) * 0.14;
      var idleY = reduced ? 0 : Math.sin(f.t * 0.3 + 1.2) * 0.045;

      f.head.rotation.y += ((f.hover ? f.look.x * 0.5 : idleX) - f.head.rotation.y) * 0.09;
      f.head.rotation.x += ((f.hover ? f.look.y * 0.28 : idleY) + f.nod * 0.30 - f.head.rotation.x) * 0.12;
      f.head.rotation.z += ((f.hover ? f.look.x * 0.07 : 0) - f.head.rotation.z) * 0.08;

      f.person.position.y = reduced ? 0 : Math.sin(f.t * 1.5) * 0.012;
      f.person.rotation.y += ((f.hover ? f.look.x * 0.14 : Math.sin(f.t * 0.26) * 0.05) - f.person.rotation.y) * 0.06;

      var b = f.blink;
      f.lidL.position.y = 0.108 - b * 0.085;
      f.lidR.position.y = 0.108 - b * 0.085;
      f.eyeL.scale.y = Math.max(0.08, 1 - b * 1.1);
      f.eyeR.scale.y = Math.max(0.08, 1 - b * 1.1);

      var smile = (f.hover ? 0.4 : 0) + f.nod * 0.7;
      f.mouth.scale.set(1 + smile * 0.3, 1 + smile * 1.4, 1);
      f.mouth.position.y = -0.27 - smile * 0.01;
      f.browL.position.y = 0.155 + smile * 0.026;
      f.browR.position.y = 0.155 + smile * 0.026;

      f.renderer.render(f.scene, f.camera);
    }
  }
  requestAnimationFrame(frame);

  /* exposed for the geometry tests */
  window.__refs = built;
})();
