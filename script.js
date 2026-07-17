/* ═══════════════════════════════════════════════════════════
   SILICON — VLSI Portfolio Interactions
   Md. Reshad Al Muttaki
   Boot sequence · Place-and-route hero · Interactive silicon lab
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ── BOOT PRELOADER ─────────────────────────────────── */
  (function boot() {
    var pre = $('#preloader');
    if (!pre) return;
    var logEl = $('#bootLog');
    var barEl = $('#bootBar');
    var done = false;

    function finish() {
      if (done) return;
      done = true;
      pre.classList.add('done');
      document.body.style.overflow = '';
      setTimeout(function () { if (pre && pre.parentNode) pre.parentNode.removeChild(pre); }, 700);
    }

    // Safety: never trap the user behind the loader.
    setTimeout(finish, 4000);
    pre.addEventListener('click', finish);
    window.addEventListener('wheel', finish, { passive: true, once: true });
    window.addEventListener('touchstart', finish, { passive: true, once: true });

    if (reduce) { finish(); return; }

    document.body.style.overflow = 'hidden';
    var lines = [
      '> power-on self-test ......... <span class="ok">[OK]</span>',
      '> Vdd rail .................. <span class="val">1.20 V</span>',
      '> PLL lock .................. <span class="val">3.20 GHz</span>',
      '> loading std-cell library .. <span class="ok">[OK]</span>',
      '> DRC / LVS ................. <span class="ok">clean</span>',
      '> booting reshad.vlsi ....... <span class="ok">[OK]</span>'
    ];
    var i = 0;
    (function step() {
      if (done) return;
      if (i < lines.length) {
        logEl.innerHTML += lines[i] + '\n';
        i++;
        if (barEl) barEl.style.width = Math.round((i / lines.length) * 100) + '%';
        setTimeout(step, 250);
      } else {
        setTimeout(finish, 420);
      }
    })();
  })();

  /* ── NAVBAR ─────────────────────────────────────────── */
  var navbar = $('#navbar');
  var navToggle = $('#navToggle');
  var navLinks = $('#navLinks');
  var railEl = $('#scrollRail');
  var toTop = $('#toTop');

  if (navToggle) {
    navToggle.addEventListener('click', function () {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('open');
    });
    $$('a', navLinks).forEach(function (link) {
      link.addEventListener('click', function () {
        navToggle.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });
  }

  var sections = $$('section[id]');
  var navItems = navLinks ? $$('a', navLinks) : [];
  function onScroll() {
    var y = window.scrollY;
    if (navbar) navbar.classList.toggle('scrolled', y > 60);
    // progress rail
    if (railEl) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      railEl.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
    // back to top
    if (toTop) toTop.classList.toggle('show', y > 600);
    // active section
    var pos = y + 130;
    sections.forEach(function (sec) {
      var top = sec.offsetTop, id = sec.getAttribute('id');
      if (pos >= top && pos < top + sec.offsetHeight) {
        navItems.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + id);
        });
      }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });

  // Smooth in-page scroll with offset
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var href = this.getAttribute('href');
      if (href === '#') return;
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 76;
      window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ── REVEAL ON SCROLL (staggered) ───────────────────── */
  var groups = $$('.stats-grid, .publications-grid, .courses-grid, .education-grid, .achievements-grid, .skills-container, .lab-grid, .refs-grid, .cert-modules, .floorplan');
  groups.forEach(function (grid) {
    $$('.reveal', grid).forEach(function (item, idx) {
      item.style.transitionDelay = (idx * 70) + 'ms';
    });
  });
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('revealed'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('revealed'); });
  }

  /* ── COUNTERS ───────────────────────────────────────── */
  function animateCounters() {
    $$('.stat-number[data-target]').forEach(function (el) {
      var target = parseFloat(el.dataset.target);
      var dec = el.dataset.decimal === 'true';
      if (reduce) { el.textContent = dec ? target.toFixed(2) : target; return; }
      var dur = 1400, start = null;
      function tick(t) {
        if (start === null) start = t;
        var p = Math.min((t - start) / dur, 1);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = dec ? (e * target).toFixed(2) : Math.round(e * target);
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = dec ? target.toFixed(2) : target;
      }
      requestAnimationFrame(tick);
    });
  }
  function animateGPA() {
    $$('.gpa-fill').forEach(function (c) {
      var pct = parseFloat(c.dataset.percent);
      var C = 2 * Math.PI * 35;
      c.style.strokeDasharray = C;
      c.style.strokeDashoffset = reduce ? (C - pct / 100 * C) : C;
      if (!reduce) setTimeout(function () { c.style.strokeDashoffset = C - pct / 100 * C; }, 120);
    });
  }
  function once(id, cb) {
    var sec = document.getElementById(id);
    if (!sec) return;
    if (!('IntersectionObserver' in window)) { cb(); return; }
    var fired = false;
    var o = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting && !fired) { fired = true; cb(); o.disconnect(); } });
    }, { threshold: 0.3 });
    o.observe(sec);
  }
  once('about', animateCounters);
  once('education', animateGPA);

  /* ── HERO: PLACE & ROUTE CANVAS ─────────────────────── */
  (function heroRoute() {
    var canvas = $('#hero-canvas');
    var hero = $('#hero');
    if (!canvas || !hero) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    var traces = [], packets = [], cells = [], pads = [];
    var mouse = { x: 0.5, y: 0.5, active: false };
    var COLORS = ['#22e0ff', '#22e0ff', '#22e0ff', '#a06bff', '#ff9d3b'];

    function rand(a, b) { return a + Math.random() * (b - a); }

    function build() {
      var rect = hero.getBoundingClientRect();
      W = rect.width; H = Math.max(rect.height, window.innerHeight);
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      traces = []; packets = []; cells = []; pads = [];
      var grid = Math.max(46, Math.min(W, H) / 14);

      // Manhattan traces
      var count = Math.round(Math.min(34, (W * H) / 42000));
      for (var i = 0; i < count; i++) {
        var sx = Math.round(rand(0, W) / grid) * grid;
        var sy = Math.round(rand(0, H) / grid) * grid;
        var ex = Math.round(rand(0, W) / grid) * grid;
        var ey = Math.round(rand(0, H) / grid) * grid;
        if (Math.abs(sx - ex) + Math.abs(sy - ey) < grid * 2) { ex += grid * 3; ey += grid * 2; }
        var pts;
        if (Math.random() < 0.5) pts = [{ x: sx, y: sy }, { x: ex, y: sy }, { x: ex, y: ey }];
        else                     pts = [{ x: sx, y: sy }, { x: sx, y: ey }, { x: ex, y: ey }];
        var segs = [], total = 0;
        for (var k = 0; k < pts.length - 1; k++) {
          var d = Math.hypot(pts[k + 1].x - pts[k].x, pts[k + 1].y - pts[k].y);
          segs.push(d); total += d;
        }
        traces.push({ pts: pts, segs: segs, total: total, color: COLORS[(Math.random() * COLORS.length) | 0] });
        pads.push(pts[0], pts[pts.length - 1]);
      }

      // Packets travel along a subset of traces
      var pk = Math.round(Math.min(16, count * 0.55));
      for (var p = 0; p < pk; p++) {
        var tr = traces[(Math.random() * traces.length) | 0];
        packets.push({ tr: tr, t: Math.random(), speed: rand(0.04, 0.11), color: tr.color });
      }

      // Standard cells in a couple of rows
      var rows = 2, perRow = Math.max(4, Math.round(W / 220));
      for (var r = 0; r < rows; r++) {
        var ry = H * (0.34 + r * 0.34);
        for (var c = 0; c < perRow; c++) {
          if (Math.random() < 0.4) continue;
          cells.push({ x: rand(40, W - 90), y: ry + rand(-20, 20), w: rand(26, 60), h: rand(16, 26) });
        }
      }
    }

    function pointAt(tr, t) {
      var dist = t * tr.total, acc = 0;
      for (var k = 0; k < tr.segs.length; k++) {
        if (acc + tr.segs[k] >= dist) {
          var f = tr.segs[k] === 0 ? 0 : (dist - acc) / tr.segs[k];
          var a = tr.pts[k], b = tr.pts[k + 1];
          return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
        }
        acc += tr.segs[k];
      }
      return tr.pts[tr.pts.length - 1];
    }

    function draw(dt) {
      ctx.clearRect(0, 0, W, H);
      var ox = (mouse.x - 0.5) * 26, oy = (mouse.y - 0.5) * 26;
      ctx.save();
      ctx.translate(-ox, -oy);

      // traces
      ctx.lineWidth = 1;
      traces.forEach(function (tr) {
        ctx.beginPath();
        ctx.moveTo(tr.pts[0].x, tr.pts[0].y);
        for (var k = 1; k < tr.pts.length; k++) ctx.lineTo(tr.pts[k].x, tr.pts[k].y);
        ctx.strokeStyle = tr.color;
        ctx.globalAlpha = 0.12;
        ctx.stroke();
      });

      // pads / vias
      ctx.globalAlpha = 0.5;
      pads.forEach(function (pd) {
        ctx.fillStyle = '#22e0ff';
        ctx.fillRect(pd.x - 2, pd.y - 2, 4, 4);
      });

      // standard cells
      ctx.globalAlpha = 0.14;
      ctx.strokeStyle = '#a06bff';
      ctx.lineWidth = 1;
      cells.forEach(function (cl) {
        ctx.strokeRect(cl.x, cl.y, cl.w, cl.h);
        ctx.fillStyle = 'rgba(160,107,255,0.06)';
        ctx.fillRect(cl.x, cl.y, cl.w, cl.h);
      });

      // packets (glowing)
      ctx.globalCompositeOperation = 'lighter';
      packets.forEach(function (pkt) {
        if (!reduce) {
          pkt.t += pkt.speed * dt;
          if (pkt.t > 1) { pkt.t = 0; pkt.tr = traces[(Math.random() * traces.length) | 0]; pkt.color = pkt.tr.color; }
        }
        var pos = pointAt(pkt.tr, pkt.t);
        // trail — sampled along the polyline so it hugs the right-angle corners
        var TAIL = 0.07, STEPS = 9, t0 = Math.max(0, pkt.t - TAIL);
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        for (var s = 0; s < STEPS; s++) {
          var pa = pointAt(pkt.tr, t0 + (pkt.t - t0) * (s / STEPS));
          var pb = pointAt(pkt.tr, t0 + (pkt.t - t0) * ((s + 1) / STEPS));
          ctx.strokeStyle = pkt.color;
          ctx.globalAlpha = 0.10 + 0.62 * (s / STEPS);
          ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
        }
        // head glow
        ctx.globalAlpha = 1;
        ctx.fillStyle = pkt.color;
        ctx.shadowColor = pkt.color; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(pos.x, pos.y, 2.4, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      });
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.restore();

      // cursor glow
      if (mouse.active && !reduce) {
        var gx = mouse.x * W, gy = mouse.y * H;
        var g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 150);
        g.addColorStop(0, 'rgba(34,224,255,0.10)');
        g.addColorStop(1, 'rgba(34,224,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(gx - 150, gy - 150, 300, 300);
      }
    }

    var last = 0, raf = null;
    function loop(t) {
      var dt = last ? Math.min((t - last) / 1000, 0.05) : 0.016;
      last = t;
      draw(dt);
      raf = requestAnimationFrame(loop);
    }

    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) / r.width;
      mouse.y = (e.clientY - r.top) / r.height;
      mouse.active = true;
    });
    hero.addEventListener('mouseleave', function () { mouse.active = false; });

    var rz;
    window.addEventListener('resize', function () {
      clearTimeout(rz);
      rz = setTimeout(build, 200);
    });

    build();
    if (reduce) { draw(0); }
    else { raf = requestAnimationFrame(loop); }
  })();

  /* ── HERO: ROLE TYPEWRITER ──────────────────────────── */
  (function roles() {
    var el = $('#heroRole');
    if (!el || reduce) return;
    var titles = [
      'VLSI & Semiconductor Device Engineer',
      'TCAD Device Modeling Researcher',
      'Sub-5 nm FinFET Designer',
      'Researcher · Educator · Innovator'
    ];
    var ti = 0, ci = 0, deleting = false;
    el.textContent = '';
    function tick() {
      var word = titles[ti];
      if (!deleting) {
        ci++;
        if (ci > word.length) { deleting = true; setTimeout(tick, 1600); return; }
      } else {
        ci--;
        if (ci < 0) { deleting = false; ti = (ti + 1) % titles.length; ci = 0; setTimeout(tick, 260); return; }
      }
      el.textContent = word.slice(0, ci);
      setTimeout(tick, deleting ? 34 : 62);
    }
    setTimeout(tick, 1200);
  })();

  /* Silicon-lab widgets (FinFET, logic, clock, adder, 7-seg, …) live in lab.js */

  /* ── CARD TILT (pointer only) ───────────────────────── */
  if (finePointer && !reduce) {
    $$('.pub-card, .timeline-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var rx = ((e.clientY - r.top) / r.height - 0.5) * -4;
        var ry = ((e.clientX - r.left) / r.width - 0.5) * 4;
        card.style.transform = 'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-4px)';
      });
      card.addEventListener('mouseleave', function () { card.style.transform = ''; });
    });

    /* ── SKILL MAGNETIC HOVER ─────────────────────────── */
    $$('.skill-tag, .social-chip').forEach(function (tag) {
      tag.addEventListener('mousemove', function (e) {
        var r = tag.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.18;
        var y = (e.clientY - r.top - r.height / 2) * 0.18;
        tag.style.transform = 'translate(' + x + 'px,' + (y - 2) + 'px)';
      });
      tag.addEventListener('mouseleave', function () { tag.style.transform = ''; });
    });
  }

})();
