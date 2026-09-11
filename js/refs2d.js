/* ============================================================
   refs2d.js — the two reference portraits, drawn flat.
   Stylised avatars, not likenesses. They blink, breathe, and
   glance toward your cursor when it crosses their card.
   ============================================================ */
(function () {
  'use strict';

  var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-ref-figure]'));
  if (!nodes.length) return;

  var B = window.Bench || {};
  var reduced = !!B.reduced;

  var PEOPLE = {
    older: {
      skin: '#c48f5f', skinLit: '#d9a875', skinShade: '#a6784e', hair: '#c2c8cc', hairDark: '#a7aeb3',
      shirt: '#3a5560', collar: '#eef3f5', accent: '#0c7b86',
      beard: '#c6ccd0', glasses: true, receding: true, brow: '#aab1b5'
    },
    younger: {
      skin: '#bd8756', skinLit: '#d3a06a', skinShade: '#9d7044', hair: '#33241a', hairDark: '#221710',
      shirt: '#1d6f78', collar: '#f4f8f9', accent: '#6dbb1c',
      beard: '#402e20', glasses: false, receding: false, brow: '#33241a'
    }
  };

  function portrait(o, uid) {
    /* Hair is the thing that makes these read as people rather than
       cartoons. The older figure gets grey at the temples and a thin
       strip over the crown — a receded hairline, not a helmet. The
       younger gets a clean hairline arc with no flaps sticking out. */
    var hair = o.receding
      ? '<path d="M37 86 C34 70 34 54 40 44 C44 37 50 33 58 31 C51 41 46 55 45 71 C44.5 77 44 81 43 88 Z" fill="' + o.hair + '"/>' +
        '<path d="M103 86 C106 70 106 54 100 44 C96 37 90 33 82 31 C89 41 94 55 95 71 C95.5 77 96 81 97 88 Z" fill="' + o.hair + '"/>' +
        '<path d="M44 43 C51 32 60 28 70 28 C80 28 89 32 96 43 C88 35 80 33 70 33 C60 33 52 35 44 43 Z" fill="' + o.hairDark + '"/>' +
        '<path d="M46 40 C54 33 62 31 70 31 C78 31 86 33 94 40 C86 36 78 35 70 35 C62 35 54 36 46 40 Z" fill="' + o.hair + '" opacity=".7"/>'
      : '<path d="M37 80 C35 70 35 60 38 52 C43 36 55 27 70 27 C85 27 97 36 102 52 C105 60 105 70 103 80 ' +
        'C100 67 96 58 91 55 C85 51 79 56 70 56 C61 56 55 51 49 55 C44 58 40 67 37 80 Z" fill="' + o.hair + '"/>' +
        '<path d="M37 80 C39 68 42 60 47 56 C44 64 43 72 43 82 Z" fill="' + o.hairDark + '"/>' +
        '<path d="M103 80 C101 68 98 60 93 56 C96 64 97 72 97 82 Z" fill="' + o.hairDark + '"/>';

    var beard = '<path d="M42 84 C44 102 54 114 70 114 C86 114 96 102 98 84 ' +
      'C96 96 90 104 82 107 C78 108.5 74 109 70 109 C66 109 62 108.5 58 107 C50 104 44 96 42 84 Z" fill="' + o.beard + '"/>' +
      '<path d="M59 96 C64 92.5 76 92.5 81 96 C76 100 64 100 59 96 Z" fill="' + o.beard + '"/>';

    var glasses = o.glasses
      ? '<g class="r-glasses">' +
          '<circle cx="55" cy="78" r="11" fill="#dff0f4" fill-opacity=".28" stroke="#3c4a4f" stroke-width="2.2"/>' +
          '<circle cx="85" cy="78" r="11" fill="#dff0f4" fill-opacity=".28" stroke="#3c4a4f" stroke-width="2.2"/>' +
          '<path d="M66 77 h8" stroke="#3c4a4f" stroke-width="2.2" stroke-linecap="round"/>' +
          '<path d="M44 76 l-7 -3 M96 76 l7 -3" stroke="#3c4a4f" stroke-width="2.2" stroke-linecap="round"/>' +
        '</g>'
      : '';

    return '' +
    '<svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" class="ref-svg" aria-hidden="true">' +
      '<defs>' +
        '<clipPath id="rc' + uid + '"><circle cx="70" cy="70" r="70"/></clipPath>' +
        '<linearGradient id="rb' + uid + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#f4f8f9"/><stop offset="1" stop-color="#dae5e9"/>' +
        '</linearGradient>' +
        '<linearGradient id="rs' + uid + '" x1="0.3" y1="0" x2="0.8" y2="1">' +
          '<stop offset="0" stop-color="' + o.skinLit + '"/><stop offset="1" stop-color="' + o.skin + '"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<g clip-path="url(#rc' + uid + ')">' +
        '<rect width="140" height="140" fill="url(#rb' + uid + ')"/>' +

        '<g class="r-person">' +
          '<path d="M70 110 C40 110 21 124 17 146 h106 C119 124 100 110 70 110 Z" fill="' + o.shirt + '"/>' +
          '<path d="M59 98 h22 v18 c0 6 -22 6 -22 0 z" fill="' + o.skinShade + '"/>' +
          '<path d="M57 112 l13 15 l13 -15 l-7 -4 h-12 z" fill="' + o.collar + '"/>' +
          '<rect x="52" y="124" width="4" height="16" rx="2" fill="' + o.accent + '" transform="rotate(8 54 132)"/>' +
          '<rect x="84" y="124" width="4" height="16" rx="2" fill="' + o.accent + '" transform="rotate(-8 86 132)"/>' +

          '<g class="r-head">' +
            '<ellipse cx="35.5" cy="74" rx="6.5" ry="9.5" fill="' + o.skinShade + '"/>' +
            '<ellipse cx="104.5" cy="74" rx="6.5" ry="9.5" fill="' + o.skinShade + '"/>' +

            '<path d="M70 30 C91 30 103 45 103 68 C103 84 99 97 91 105 C85 111 78 115 70 115 ' +
              'C62 115 55 111 49 105 C41 97 37 84 37 68 C37 45 49 30 70 30 Z" fill="url(#rs' + uid + ')"/>' +
            /* a little shading down one side so the face is not flat */
            '<path d="M92 44 C101 52 103 62 103 70 C103 86 99 98 91 105 C96 92 98 68 92 44 Z" ' +
                 'fill="' + o.skinShade + '" opacity=".35"/>' +

            hair +

            '<path class="r-brow-l" d="M46 66 C51 62 59 62 63 65" stroke="' + o.brow + '" stroke-width="3.6" fill="none" stroke-linecap="round"/>' +
            '<path class="r-brow-r" d="M77 65 C81 62 89 62 94 66" stroke="' + o.brow + '" stroke-width="3.6" fill="none" stroke-linecap="round"/>' +

            '<g class="r-eyes">' +
              '<ellipse class="r-eye" cx="55" cy="78" rx="4.6" ry="5" fill="#231a13"/>' +
              '<ellipse class="r-eye" cx="85" cy="78" rx="4.6" ry="5" fill="#231a13"/>' +
              '<circle cx="56.7" cy="76.3" r="1.5" fill="#fff"/>' +
              '<circle cx="86.7" cy="76.3" r="1.5" fill="#fff"/>' +
              '<rect class="r-lid" x="48" y="68" width="14" height="0" rx="3" fill="' + o.skin + '"/>' +
              '<rect class="r-lid" x="78" y="68" width="14" height="0" rx="3" fill="' + o.skin + '"/>' +
            '</g>' +

            '<path d="M70 76 C67 86 66 91 70 93 C73 94 75 93 76.5 91" stroke="' + o.skinShade + '" ' +
                 'stroke-width="2.4" fill="none" stroke-linecap="round"/>' +

            beard +
            '<path class="r-mouth" d="M62 104 q8 6 16 0" stroke="#7c4436" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
            glasses +
          '</g>' +
        '</g>' +
      '</g>' +
      '<circle cx="70" cy="70" r="69" fill="none" stroke="rgba(13,22,24,.10)" stroke-width="2"/>' +
    '</svg>';
  }

  var built = [];
  nodes.forEach(function (host, idx) {
    var kind = host.getAttribute('data-ref-figure');
    var o = PEOPLE[kind] || PEOPLE.younger;
    host.innerHTML = portrait(o, idx);
    host.setAttribute('tabindex', '0');
    host.setAttribute('role', 'img');

    var f = {
      kind: kind, host: host,
      head: host.querySelector('.r-head'),
      person: host.querySelector('.r-person'),
      mouth: host.querySelector('.r-mouth'),
      lids: host.querySelectorAll('.r-lid'),
      brows: host.querySelectorAll('.r-brow-l, .r-brow-r'),
      look: { x: 0, y: 0 }, hover: false,
      blink: 0, nextBlink: 1 + Math.random() * 3,
      nod: 0, t: Math.random() * 10, onScreen: true
    };
    built.push(f);

    var card = (host.closest && host.closest('.ref')) || host;
    card.addEventListener('pointermove', function (ev) {
      var r = host.getBoundingClientRect();
      if (!r.width) return;
      f.hover = true;
      f.look.x = Math.max(-1, Math.min(1, (ev.clientX - (r.left + r.width / 2)) / (r.width * 1.4)));
      f.look.y = Math.max(-1, Math.min(1, (ev.clientY - (r.top + r.height / 2)) / (r.height * 1.4)));
    });
    card.addEventListener('pointerleave', function () {
      f.hover = false; f.look.x = 0; f.look.y = 0;
    });
    card.addEventListener('click', function () {
      f.nod = 1;
      if (B.audio) B.audio.tone(520, 0.09, 'sine', 0.035);
    });
    host.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); f.nod = 1; }
    });
  });

  var running = true;
  document.addEventListener('visibilitychange', function () { running = !document.hidden; });
  try {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        for (var i = 0; i < built.length; i++) {
          if (built[i].host === e.target) built[i].onScreen = e.isIntersecting;
        }
      });
    }, { threshold: 0.05 });
    built.forEach(function (f) { io.observe(f.host); });
  } catch (e) {}

  function frame() {
    requestAnimationFrame(frame);
    if (!running) return;

    for (var i = 0; i < built.length; i++) {
      var f = built[i];
      if (!f.onScreen || !f.head) continue;
      f.t += 0.016;
      f.nod *= 0.93;
      f.blink *= 0.76;
      f.nextBlink -= 0.016;
      if (f.nextBlink <= 0) { f.blink = 1; f.nextBlink = 2 + Math.random() * 4; }

      var idleX = reduced ? 0 : Math.sin(f.t * 0.4) * 2.4;
      var idleY = reduced ? 0 : Math.sin(f.t * 0.3 + 1.2) * 1.2;
      var tx = f.hover ? f.look.x * 6 : idleX;
      var ty = (f.hover ? f.look.y * 3.5 : idleY) + f.nod * 4;
      var rot = f.hover ? f.look.x * 3.5 : idleX * 0.5;

      f.head.setAttribute('transform',
        'translate(' + tx.toFixed(2) + ' ' + ty.toFixed(2) + ') rotate(' + rot.toFixed(2) + ' 70 80)');
      if (f.person) {
        f.person.setAttribute('transform',
          'translate(0 ' + (reduced ? 0 : Math.sin(f.t * 1.5) * 1.1).toFixed(2) + ')');
      }

      for (var l = 0; l < f.lids.length; l++) {
        f.lids[l].setAttribute('height', (f.blink * 15).toFixed(2));
        f.lids[l].setAttribute('y', (68 + f.blink * 5).toFixed(2));
      }

      var smile = (f.hover ? 0.5 : 0) + f.nod * 0.8;
      if (f.mouth) {
        f.mouth.setAttribute('d', 'M62 104 q8 ' + (6 + smile * 5).toFixed(1) + ' 16 0');
      }
      for (var b = 0; b < f.brows.length; b++) {
        f.brows[b].setAttribute('transform', 'translate(0 ' + (-smile * 1.6).toFixed(2) + ')');
      }
    }
  }
  requestAnimationFrame(frame);

  window.__refs = built;
})();
