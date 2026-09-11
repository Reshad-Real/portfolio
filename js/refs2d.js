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
      skin: '#c08f62', skinShade: '#a87a50', hair: '#b9c0c4', hairDark: '#9aa3a8',
      shirt: '#3a5560', collar: '#eef3f5', accent: '#0c7b86',
      beard: '#bfc6ca', glasses: true, receding: true, brow: '#a7afb3'
    },
    younger: {
      skin: '#c08f62', skinShade: '#a87a50', hair: '#2e2018', hairDark: '#1e140e',
      shirt: '#1d6f78', collar: '#f4f8f9', accent: '#6dbb1c',
      beard: '#3a291d', glasses: false, receding: false, brow: '#2e2018'
    }
  };

  function portrait(o, uid) {
    var hairBack = o.receding
      /* a high, receded hairline: the shell starts further back */
      ? '<path d="M34 74 c0 -26 14 -44 36 -44 c22 0 36 16 36 40 c0 6 -1 10 -2 13 ' +
        'c-4 -14 -13 -22 -26 -22 c-16 0 -26 8 -30 22 c-4 -3 -8 -3 -14 -9 z" fill="' + o.hair + '"/>'
      : '<path d="M32 76 c0 -30 16 -48 38 -48 c23 0 38 18 38 46 c0 8 -1 12 -3 16 ' +
        'c-3 -16 -6 -22 -12 -22 c-8 0 -10 6 -23 6 c-13 0 -18 -6 -25 -6 c-7 0 -10 6 -13 22 z" fill="' + o.hair + '"/>';

    var sideHair = o.receding
      ? '<path d="M32 74 q-3 22 4 34 q-9 -4 -10 -20 q-1 -12 6 -14 z" fill="' + o.hairDark + '"/>' +
        '<path d="M108 74 q3 22 -4 34 q9 -4 10 -20 q1 -12 -6 -14 z" fill="' + o.hairDark + '"/>'
      : '<path d="M32 74 q-4 20 2 32 q-8 -4 -9 -18 q-1 -12 7 -14 z" fill="' + o.hairDark + '"/>' +
        '<path d="M108 74 q4 20 -2 32 q8 -4 9 -18 q1 -12 -7 -14 z" fill="' + o.hairDark + '"/>';

    var glasses = o.glasses
      ? '<g opacity=".92">' +
          '<circle cx="55" cy="82" r="13" fill="#dff0f4" fill-opacity=".35" stroke="#3c4a4f" stroke-width="2.4"/>' +
          '<circle cx="85" cy="82" r="13" fill="#dff0f4" fill-opacity=".35" stroke="#3c4a4f" stroke-width="2.4"/>' +
          '<path d="M68 81 h4" stroke="#3c4a4f" stroke-width="2.4"/>' +
          '<path d="M42 80 l-8 -3 M98 80 l8 -3" stroke="#3c4a4f" stroke-width="2.4" stroke-linecap="round"/>' +
        '</g>'
      : '';

    return '' +
    '<svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" class="ref-svg" aria-hidden="true">' +
      '<defs>' +
        '<clipPath id="rc' + uid + '"><circle cx="70" cy="70" r="70"/></clipPath>' +
        '<linearGradient id="rb' + uid + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#f2f7f8"/><stop offset="1" stop-color="#dde7ea"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<g clip-path="url(#rc' + uid + ')">' +
        '<rect width="140" height="140" fill="url(#rb' + uid + ')"/>' +

        '<g class="r-person">' +
          /* shoulders */
          '<path d="M70 112 c-30 0 -48 14 -52 34 h104 c-4 -20 -22 -34 -52 -34 z" fill="' + o.shirt + '"/>' +
          '<path d="M58 114 l12 14 l12 -14 l-6 -4 h-12 z" fill="' + o.collar + '"/>' +
          '<rect x="52" y="126" width="4" height="14" rx="2" fill="' + o.accent + '" transform="rotate(8 54 133)"/>' +
          '<rect x="84" y="126" width="4" height="14" rx="2" fill="' + o.accent + '" transform="rotate(-8 86 133)"/>' +

          /* neck */
          '<path d="M58 96 h24 v16 c0 6 -24 6 -24 0 z" fill="' + o.skinShade + '"/>' +

          '<g class="r-head">' +
            /* ears */
            '<ellipse cx="32" cy="80" rx="6" ry="9" fill="' + o.skinShade + '"/>' +
            '<ellipse cx="108" cy="80" rx="6" ry="9" fill="' + o.skinShade + '"/>' +
            /* face */
            '<path d="M70 34 c22 0 34 16 34 40 c0 26 -14 42 -34 42 c-20 0 -34 -16 -34 -42 c0 -24 12 -40 34 -40 z" fill="' + o.skin + '"/>' +
            sideHair +
            hairBack +
            /* brows */
            '<path class="r-brow-l" d="M46 71 q9 -5 17 -1" stroke="' + o.brow + '" stroke-width="4" fill="none" stroke-linecap="round"/>' +
            '<path class="r-brow-r" d="M77 70 q8 -4 17 1" stroke="' + o.brow + '" stroke-width="4" fill="none" stroke-linecap="round"/>' +
            /* eyes */
            '<g class="r-eyes">' +
              '<ellipse class="r-eye" cx="55" cy="82" rx="4.6" ry="5" fill="#1d1712"/>' +
              '<ellipse class="r-eye" cx="85" cy="82" rx="4.6" ry="5" fill="#1d1712"/>' +
              '<circle cx="56.6" cy="80.4" r="1.5" fill="#fff"/>' +
              '<circle cx="86.6" cy="80.4" r="1.5" fill="#fff"/>' +
              '<rect class="r-lid" x="49" y="70" width="13" height="0" rx="3" fill="' + o.skin + '"/>' +
              '<rect class="r-lid" x="79" y="70" width="13" height="0" rx="3" fill="' + o.skin + '"/>' +
            '</g>' +
            /* nose */
            '<path d="M70 84 q-5 10 0 13 q4 2 6 -1" stroke="' + o.skinShade + '" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
            /* beard and mouth */
            '<path d="M48 98 q3 20 22 20 q19 0 22 -20 q-6 12 -22 12 q-16 0 -22 -12 z" fill="' + o.beard + '"/>' +
            '<path class="r-mouth" d="M62 104 q8 6 16 0" stroke="#7a4436" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
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
        f.lids[l].setAttribute('height', (f.blink * 13).toFixed(2));
        f.lids[l].setAttribute('y', (70 + f.blink * 6).toFixed(2));
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
