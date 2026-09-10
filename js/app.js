/* ============================================================
   app.js — theme, navigation, reveals, and shared helpers
   Every block is defensive: if one feature fails the rest still runs.
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = false;
  try {
    reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {}

  /* ---------- tiny storage wrapper (private mode safe) ---------- */
  var store = {
    get: function (k, fallback) {
      try {
        var v = localStorage.getItem('bench-' + k);
        return v === null ? fallback : v;
      } catch (e) { return fallback; }
    },
    set: function (k, v) {
      try { localStorage.setItem('bench-' + k, String(v)); } catch (e) {}
    }
  };

  /* ---------- audio ---------- */
  var audio = {
    ctx: null,
    enabled: store.get('sound', '1') === '1',
    unlock: function () {
      if (this.ctx) return this.ctx;
      try {
        var C = window.AudioContext || window.webkitAudioContext;
        if (!C) return null;
        this.ctx = new C();
      } catch (e) { this.ctx = null; }
      return this.ctx;
    },
    tone: function (freq, dur, type, vol) {
      if (!this.enabled) return;
      var ctx = this.unlock();
      if (!ctx) return;
      if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
      try {
        var t = ctx.currentTime;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(vol || 0.13, t + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.16));
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + (dur || 0.16) + 0.03);
      } catch (e) {}
    },
    setEnabled: function (on) {
      this.enabled = !!on;
      store.set('sound', on ? '1' : '0');
    }
  };

  /* ---------- theme-aware colours for the 3D scenes ---------- */
  function readColors() {
    var cs = getComputedStyle(root);
    function v(name, fallback) {
      var s = cs.getPropertyValue(name);
      s = s ? s.trim() : '';
      return s || fallback;
    }
    return {
      dark: root.getAttribute('data-theme') === 'dark',
      teal: v('--teal', '#0c7b86'),
      tealB: v('--teal-b', '#0aa3b0'),
      copper: v('--copper', '#a35f31'),
      lime: v('--lime-b', '#6dbb1c'),
      ink: v('--ink', '#0d1618'),
      surface: v('--surface', '#ffffff'),
      line: v('--line-2', '#bccacc'),
      bg: v('--bg', '#eef2f2')
    };
  }

  var themeListeners = [];
  var Bench = {
    reduced: reduced,
    store: store,
    audio: audio,
    colors: readColors,
    onTheme: function (fn) { if (typeof fn === 'function') themeListeners.push(fn); },
    emitTheme: function () {
      var c = readColors();
      for (var i = 0; i < themeListeners.length; i++) {
        try { themeListeners[i](c); } catch (e) {}
      }
    }
  };
  window.Bench = Bench;

  /* ---------- theme toggle ---------- */
  (function theme() {
    var btn = document.getElementById('themeToggle');
    var label = document.getElementById('themeLabel');
    var meta = document.querySelector('meta[name="theme-color"]');

    function paint() {
      var dark = root.getAttribute('data-theme') === 'dark';
      if (label) label.textContent = dark ? 'Light' : 'Dark';
      if (btn) btn.setAttribute('title', dark ? 'Switch to the lit bench' : 'Switch to the dark bench');
      if (meta) meta.setAttribute('content', dark ? '#060b0d' : '#ffffff');
    }
    paint();

    if (btn) {
      btn.addEventListener('click', function () {
        var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        store.set('theme', next);
        paint();
        audio.tone(next === 'dark' ? 320 : 520, 0.1, 'triangle', 0.06);
        // let CSS variables settle before the 3D scenes re-read them
        setTimeout(function () { Bench.emitTheme(); }, 30);
      });
    }
  })();

  /* ---------- navigation ---------- */
  (function nav() {
    var bar = document.getElementById('nav');
    var links = document.getElementById('navLinks');
    var burger = document.getElementById('navToggle');

    if (burger && links) {
      burger.addEventListener('click', function () {
        var open = links.classList.toggle('open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      links.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') {
          links.classList.remove('open');
          burger.setAttribute('aria-expanded', 'false');
        }
      });
    }

    var anchors = links ? links.querySelectorAll('a[href^="#"]') : [];
    var sections = [];
    for (var i = 0; i < anchors.length; i++) {
      var id = anchors[i].getAttribute('href').slice(1);
      var sec = document.getElementById(id);
      if (sec) sections.push({ link: anchors[i], el: sec });
    }

    var rail = document.getElementById('scrollRail');
    var toTop = document.getElementById('toTop');
    var ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var y = window.pageYOffset || root.scrollTop || 0;
        var h = Math.max(1, (document.body.scrollHeight || 0) - window.innerHeight);

        if (bar) bar.classList.toggle('stuck', y > 8);
        if (rail) rail.style.width = Math.min(100, (y / h) * 100) + '%';
        if (toTop) toTop.classList.toggle('show', y > 600);

        var current = null;
        for (var j = 0; j < sections.length; j++) {
          var top = sections[j].el.getBoundingClientRect().top;
          if (top <= 140) current = sections[j];
        }
        for (var k = 0; k < sections.length; k++) {
          sections[k].link.classList.toggle('active', sections[k] === current);
        }
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (toTop) {
      toTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      });
    }
  })();

  /* ---------- reveals, counters, dials ---------- */
  (function reveals() {
    var targets = document.querySelectorAll(
      '.reveal, .paper, .tl, .blockk, .kit, .cert, .ref, .pads li, .dial-item, ' +
      '.hero-stats li, .course-list li, .tools-grid li, .ap-list li'
    );

    function countUp(el) {
      var target = parseFloat(el.getAttribute('data-count') || '0');
      var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
      if (reduced) { el.textContent = target.toFixed(dec); return; }
      var start = performance.now();
      var dur = 1100;
      function frame(now) {
        var p = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(dec);
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    if (!('IntersectionObserver' in window)) {
      for (var n = 0; n < targets.length; n++) targets[n].classList.add('reveal-in');
      var nums = document.querySelectorAll('[data-count]');
      for (var m = 0; m < nums.length; m++) countUp(nums[m]);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.remove('reveal-init');
        el.classList.add('reveal-in');

        var nums = el.querySelectorAll ? el.querySelectorAll('[data-count]') : [];
        for (var i = 0; i < nums.length; i++) countUp(nums[i]);
        if (el.hasAttribute && el.hasAttribute('data-count')) countUp(el);

        var dials = el.querySelectorAll ? el.querySelectorAll('.dial-fg[data-pct]') : [];
        for (var d = 0; d < dials.length; d++) {
          var pct = parseFloat(dials[d].getAttribute('data-pct') || '0');
          dials[d].style.strokeDashoffset = String(213.6 * (1 - pct / 100));
        }
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px' });

    for (var t = 0; t < targets.length; t++) {
      if (!reduced) targets[t].classList.add('reveal-init');
      io.observe(targets[t]);
    }
  })();


  /* ---------- pointer tilt on cards ---------- */
  (function tilt() {
    if (reduced) return;
    var cards = document.querySelectorAll('.tilt');
    for (var i = 0; i < cards.length; i++) {
      (function (card) {
        card.addEventListener('pointermove', function (ev) {
          var r = card.getBoundingClientRect();
          var px = (ev.clientX - r.left) / r.width - 0.5;
          var py = (ev.clientY - r.top) / r.height - 0.5;
          card.style.transform =
            'perspective(700px) rotateX(' + (-py * 5).toFixed(2) + 'deg) rotateY(' +
            (px * 6).toFixed(2) + 'deg) translateY(-3px)';
          card.style.setProperty('--gx', ((px + 0.5) * 100).toFixed(1) + '%');
          card.style.setProperty('--gy', ((py + 0.5) * 100).toFixed(1) + '%');
        });
        card.addEventListener('pointerleave', function () { card.style.transform = ''; });
      })(cards[i]);
    }
  })();

  /* ---------- the role line settles into place ---------- */
  (function scramble() {
    var el = document.getElementById('heroRole');
    if (!el || reduced) return;
    var final = el.textContent;
    var pool = '01<>{}[]/\\|=+-*#@$%&';
    var frame = 0;
    var settled = 0;
    function tick() {
      frame++;
      if (frame % 2 === 0) settled += 0.6;
      var out = '';
      for (var i = 0; i < final.length; i++) {
        if (i < settled || final[i] === ' ') out += final[i];
        else out += pool[Math.floor(Math.random() * pool.length)];
      }
      el.textContent = out;
      if (settled < final.length) requestAnimationFrame(tick);
      else el.textContent = final;
    }
    setTimeout(function () { requestAnimationFrame(tick); }, 340);
  })();

  /* ---------- stagger anything that reveals as a group ---------- */
  (function stagger() {
    var groups = document.querySelectorAll('.tools-grid, .course-list, .ap-list, .pads, .papers, .floor');
    for (var g = 0; g < groups.length; g++) {
      var kids = groups[g].children;
      for (var k = 0; k < kids.length; k++) {
        kids[k].style.setProperty('--d', (k * 55) + 'ms');
      }
    }
  })();

  /* ---------- keep the current theme in sync on first paint ---------- */
  window.addEventListener('load', function () {
    setTimeout(function () { Bench.emitTheme(); }, 60);
  });
})();
