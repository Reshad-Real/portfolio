/* ============================================================
   games.js — the arcade. Four cabinets, one shell.
     runner   Electron Runner — dodge defects, collect charge
     gate     Gate Crash      — answer falling logic gates
     router   Trace Router    — rotate copper until the board lights
     resistor Resistor Rush   — read the colour bands, fast
   ============================================================ */
(function () {
  'use strict';

  var host = document.getElementById('arcade');
  if (!host) return;

  var B = window.Bench || {};
  var reduced = !!B.reduced;

  var elScore = document.getElementById('gbScore');
  var elBest = document.getElementById('gbBest');
  var elCombo = document.getElementById('gbCombo');
  var elLives = document.getElementById('gbLives');
  var elTitle = document.getElementById('gbTitle');
  var elRule = document.getElementById('gbRule');
  var elMsg = document.getElementById('gameMsg');
  var elStart = document.getElementById('gbStart');
  var elSound = document.getElementById('gbSound');
  var tabs = document.getElementById('gameTabs');

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function rand(n) { return Math.floor(Math.random() * n); }
  function pick(a) { return a[rand(a.length)]; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function beep(f, d, t, v) { if (B.audio) B.audio.tone(f, d, t, v); }

  /* ---------- shared state ---------- */
  var score = 0, combo = 1, lives = 0, best = 0;
  var activeKey = null, active = null;

  function setScore(v) {
    score = Math.max(0, Math.round(v));
    if (elScore) elScore.textContent = score;
    if (score > best) {
      best = score;
      if (elBest) elBest.textContent = best;
      if (activeKey && B.store) B.store.set('best-' + activeKey, best);
    }
  }
  function addScore(v) { setScore(score + Math.round(v * combo)); }
  function setCombo(v) {
    combo = Math.max(1, v);
    if (elCombo) {
      elCombo.textContent = '×' + combo;
      elCombo.classList.toggle('hot', combo >= 3);
    }
  }
  function setLives(v) {
    lives = v;
    if (!elLives) return;
    elLives.innerHTML = '';
    for (var i = 0; i < 3; i++) {
      var d = el('span', 'life' + (i < v ? '' : ' out'));
      elLives.appendChild(d);
    }
  }
  function msg(text, kind) {
    if (!elMsg) return;
    elMsg.textContent = text;
    elMsg.className = 'game-msg' + (kind ? ' ' + kind : '');
  }

  /* ---------- canvas helper with retina + shake + particles ---------- */
  function Stage(canvas) {
    var ctx = canvas.getContext('2d');
    var s = {
      canvas: canvas, ctx: ctx, w: 0, h: 0,
      shake: 0, parts: [], colors: {}
    };
    s.fit = function () {
      var r = canvas.getBoundingClientRect();
      var w = Math.max(320, Math.round(r.width || canvas.clientWidth || 640));
      var h = Math.round(canvas.clientHeight || 360);
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      s.w = w; s.h = h;
    };
    s.theme = function () {
      var c = (B.colors ? B.colors() : {}) || {};
      s.colors = {
        dark: !!c.dark,
        ink: c.ink || '#0d1618',
        line: c.line || '#bccacc',
        teal: c.tealB || '#0aa3b0',
        lime: c.lime || '#6dbb1c',
        copper: c.copper || '#a35f31',
        surface: c.surface || '#ffffff',
        bad: c.dark ? '#ff7b6b' : '#d24a35'
      };
    };
    s.burst = function (x, y, color, n, power) {
      if (reduced) return;
      for (var i = 0; i < (n || 10); i++) {
        s.parts.push({
          x: x, y: y,
          vx: (Math.random() - 0.5) * (power || 5),
          vy: (Math.random() - 0.5) * (power || 5) - 1,
          life: 1, color: color, r: 1.5 + Math.random() * 2.5
        });
      }
    };
    s.stepParts = function () {
      for (var i = s.parts.length - 1; i >= 0; i--) {
        var p = s.parts[i];
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.16; p.vx *= 0.99;
        p.life -= 0.026;
        if (p.life <= 0) s.parts.splice(i, 1);
      }
      s.shake *= 0.86;
    };
    s.drawParts = function () {
      for (var i = 0; i < s.parts.length; i++) {
        var p = s.parts[i];
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.life, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    s.applyShake = function () {
      if (s.shake > 0.2) {
        ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
      }
    };
    s.theme();
    return s;
  }

  /* ============================================================
     1. ELECTRON RUNNER
     ============================================================ */
  function ElectronRunner(mount) {
    var wrap = el('div', 'rn-wrap');
    var canvas = el('canvas', 'rn-canvas');
    canvas.setAttribute('aria-label', 'Electron Runner. Use up and down arrows to change lane.');
    canvas.tabIndex = 0;
    wrap.appendChild(canvas);

    var pad = el('div', 'rn-pad');
    var up = el('button', 'rn-btn', '▲');
    var down = el('button', 'rn-btn', '▼');
    up.type = down.type = 'button';
    up.setAttribute('aria-label', 'Move up a lane');
    down.setAttribute('aria-label', 'Move down a lane');
    pad.appendChild(up); pad.appendChild(down);
    wrap.appendChild(pad);
    mount.appendChild(wrap);

    var st = Stage(canvas);
    var LANES = 3;
    var lane = 1, laneY = 0;
    var speed = 3.4, dist = 0, spawnT = 0, invuln = 0, distPoints = 0;
    var items = [];
    var running = false, raf = 0;
    var trail = [];

    function laneCentre(i) { return st.h * (0.26 + i * 0.24); }

    function reset() {
      lane = 1; laneY = laneCentre(1);
      speed = 3.4; dist = 0; spawnT = 20; invuln = 0; distPoints = 0;
      items.length = 0; trail.length = 0;
      st.parts.length = 0;
    }

    function move(d) {
      var next = clamp(lane + d, 0, LANES - 1);
      if (next !== lane) { lane = next; beep(340 + lane * 90, 0.05, 'sine', 0.03); }
    }

    canvas.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowUp' || ev.key === 'w') { move(-1); ev.preventDefault(); }
      if (ev.key === 'ArrowDown' || ev.key === 's') { move(1); ev.preventDefault(); }
    });
    up.addEventListener('click', function () { move(-1); });
    down.addEventListener('click', function () { move(1); });
    canvas.addEventListener('pointerdown', function (ev) {
      var r = canvas.getBoundingClientRect();
      move(ev.clientY - r.top < r.height / 2 ? -1 : 1);
    });
    document.addEventListener('keydown', function (ev) {
      if (!running || activeKey !== 'runner') return;
      if (ev.key === 'ArrowUp') { move(-1); ev.preventDefault(); }
      if (ev.key === 'ArrowDown') { move(1); ev.preventDefault(); }
    });

    function spawn() {
      var kind = Math.random();
      var l = rand(LANES);
      if (kind < 0.42) {
        items.push({ t: 'defect', lane: l, x: st.w + 40, spin: 0 });
      } else if (kind < 0.56) {
        /* a wall of two — leave one lane open */
        var open = rand(LANES);
        for (var i = 0; i < LANES; i++) {
          if (i !== open) items.push({ t: 'defect', lane: i, x: st.w + 40, spin: 0 });
        }
      } else if (kind < 0.94) {
        items.push({ t: 'charge', lane: l, x: st.w + 40, spin: 0 });
      } else {
        items.push({ t: 'boost', lane: l, x: st.w + 40, spin: 0 });
      }
    }

    function hit() {
      if (invuln > 0) return;
      invuln = 70;
      setCombo(1);
      setLives(lives - 1);
      st.shake = 16;
      st.burst(120, laneY, st.colors.bad, 22, 8);
      beep(150, 0.22, 'sawtooth', 0.07);
      if (lives <= 0) stop(true);
    }

    function step() {
      raf = requestAnimationFrame(step);
      if (!running) return;
      if (document.hidden || mount.hidden) return;

      var ctx = st.ctx;
      if (!ctx) return;
      st.fitIfNeeded();

      dist += speed;
      speed = Math.min(11, 3.4 + dist / 2600);
      if (invuln > 0) invuln--;

      spawnT -= speed * 0.16;
      if (spawnT <= 0) { spawn(); spawnT = 26 + Math.random() * 26 - speed; }

      laneY += (laneCentre(lane) - laneY) * 0.24;

      trail.push({ x: 120, y: laneY });
      if (trail.length > 16) trail.shift();

      for (var i = items.length - 1; i >= 0; i--) {
        var it = items[i];
        it.x -= speed;
        it.spin += 0.06;
        var iy = laneCentre(it.lane);
        if (it.x < -50) { items.splice(i, 1); continue; }
        if (Math.abs(it.x - 120) < 22 && Math.abs(iy - laneY) < 24) {
          if (it.t === 'defect') { hit(); items.splice(i, 1); }
          else if (it.t === 'charge') {
            items.splice(i, 1);
            addScore(5);
            setCombo(combo + 1);
            st.burst(it.x, iy, st.colors.lime, 12, 5);
            beep(620 + Math.min(combo, 8) * 40, 0.06, 'triangle', 0.04);
          } else {
            items.splice(i, 1);
            invuln = 150;
            addScore(15);
            st.burst(it.x, iy, st.colors.teal, 20, 7);
            beep(880, 0.18, 'triangle', 0.05);
          }
        }
      }

      /* distance points, one per 12 units travelled */
      var earned = Math.floor(dist / 12);
      if (earned > distPoints) {
        setScore(score + (earned - distPoints));
        distPoints = earned;
      }

      st.stepParts();
      draw();
    }

    function draw() {
      var ctx = st.ctx, c = st.colors;
      ctx.save();
      ctx.clearRect(0, 0, st.w, st.h);
      st.applyShake();

      /* channel walls */
      ctx.fillStyle = c.dark ? 'rgba(47,208,224,.06)' : 'rgba(12,123,134,.05)';
      ctx.fillRect(0, st.h * 0.18, st.w, st.h * 0.66);
      ctx.strokeStyle = c.line;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, st.h * 0.18); ctx.lineTo(st.w, st.h * 0.18);
      ctx.moveTo(0, st.h * 0.84); ctx.lineTo(st.w, st.h * 0.84);
      ctx.stroke();

      /* lattice dots scrolling by */
      ctx.fillStyle = c.dark ? 'rgba(233,244,245,.16)' : 'rgba(13,22,24,.13)';
      var off = (dist * 0.6) % 46;
      for (var x = -off; x < st.w; x += 46) {
        for (var l = 0; l < LANES; l++) {
          ctx.beginPath();
          ctx.arc(x, laneCentre(l) + 26, 1.8, 0, 6.2832);
          ctx.fill();
        }
      }

      /* items */
      for (var i = 0; i < items.length; i++) {
        var it = items[i], y = laneCentre(it.lane);
        if (it.t === 'defect') {
          ctx.save();
          ctx.translate(it.x, y);
          ctx.rotate(it.spin);
          ctx.strokeStyle = c.bad;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(-11, -11); ctx.lineTo(11, 11);
          ctx.moveTo(11, -11); ctx.lineTo(-11, 11);
          ctx.stroke();
          ctx.restore();
        } else if (it.t === 'charge') {
          ctx.fillStyle = c.lime;
          ctx.beginPath();
          ctx.arc(it.x, y + Math.sin(it.spin * 2) * 3, 7, 0, 6.2832);
          ctx.fill();
        } else {
          ctx.save();
          ctx.translate(it.x, y);
          ctx.rotate(it.spin);
          ctx.fillStyle = c.teal;
          ctx.fillRect(-9, -9, 18, 18);
          ctx.restore();
        }
      }

      /* trail */
      for (i = 0; i < trail.length; i++) {
        ctx.globalAlpha = (i / trail.length) * 0.4;
        ctx.fillStyle = c.teal;
        ctx.beginPath();
        ctx.arc(trail[i].x - (trail.length - i) * 5, trail[i].y, 5 * (i / trail.length), 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      /* the electron */
      var flash = invuln > 0 && Math.floor(invuln / 5) % 2 === 0;
      ctx.fillStyle = flash ? c.surface : c.teal;
      ctx.strokeStyle = c.teal;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(120, laneY, 11, 0, 6.2832);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = c.dark ? '#04191c' : '#ffffff';
      ctx.font = 'bold 13px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('–', 120, laneY);

      st.drawParts();
      ctx.restore();
    }

    var lastW = 0;
    st.fitIfNeeded = function () {
      var r = canvas.getBoundingClientRect();
      if (Math.abs((r.width || 0) - lastW) > 2) { lastW = r.width || 0; st.fit(); }
    };

    function start() {
      st.theme(); st.fit(); lastW = canvas.getBoundingClientRect().width || 0;
      reset();
      setScore(0); setCombo(1); setLives(3);
      running = true;
      msg('Dodge the defects. Collect the charge.', '');
      try { canvas.focus({ preventScroll: true }); } catch (e) {}
      if (!raf) raf = requestAnimationFrame(step);
    }
    function stop(dead) {
      running = false;
      if (dead) msg('Scattered. Final score ' + score + '.', 'bad');
    }

    return {
      title: 'Electron Runner',
      rule: 'You are a carrier in the channel. Arrow keys or tap to change lane.',
      start: start,
      stop: function () { running = false; },
      destroy: function () { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; },
      theme: function () { st.theme(); }
    };
  }

  /* ============================================================
     2. GATE CRASH
     ============================================================ */
  function GateCrash(mount) {
    var wrap = el('div', 'gc-wrap');
    var canvas = el('canvas', 'gc-canvas');
    canvas.setAttribute('aria-label', 'Gate Crash. Answer the output of the lowest gate.');
    canvas.tabIndex = 0;
    wrap.appendChild(canvas);
    var pad = el('div', 'gc-pad');
    var b0 = el('button', 'gc-btn', '0');
    var b1 = el('button', 'gc-btn', '1');
    b0.type = b1.type = 'button';
    b0.setAttribute('aria-label', 'Answer zero');
    b1.setAttribute('aria-label', 'Answer one');
    pad.appendChild(b0); pad.appendChild(b1);
    wrap.appendChild(pad);
    mount.appendChild(wrap);

    var st = Stage(canvas);
    var GATES = {
      AND: function (a, b) { return a & b; },
      OR: function (a, b) { return a | b; },
      XOR: function (a, b) { return a ^ b; },
      NAND: function (a, b) { return 1 - (a & b); },
      NOR: function (a, b) { return 1 - (a | b); },
      XNOR: function (a, b) { return 1 - (a ^ b); },
      NOT: function (a) { return 1 - a; }
    };
    var pool = ['AND', 'OR', 'XOR', 'NAND'];
    var blocks = [];
    var fall = 0.55, spawnT = 0, running = false, raf = 0, level = 1, solved = 0;

    function makeBlock() {
      var name = pick(pool);
      var a = rand(2), b = rand(2);
      var out = name === 'NOT' ? GATES.NOT(a) : GATES[name](a, b);
      return {
        name: name, a: a, b: b, out: out,
        x: 40 + Math.random() * Math.max(10, st.w - 200),
        y: -60, flash: 0
      };
    }

    function lowest() {
      var lo = null;
      for (var i = 0; i < blocks.length; i++) if (!lo || blocks[i].y > lo.y) lo = blocks[i];
      return lo;
    }

    function answer(v) {
      if (!running) return;
      var b = lowest();
      if (!b) return;
      if (b.out === v) {
        solved++;
        addScore(10 + Math.floor(level * 2));
        setCombo(combo + 1);
        st.burst(b.x + 60, b.y + 24, st.colors.lime, 14, 5);
        beep(560 + Math.min(combo, 9) * 45, 0.07, 'triangle', 0.045);
        blocks.splice(blocks.indexOf(b), 1);
        if (solved % 6 === 0) {
          level++;
          fall += 0.12;
          if (level === 2 && pool.indexOf('NOR') === -1) pool.push('NOR');
          if (level === 3 && pool.indexOf('XNOR') === -1) pool.push('XNOR');
          if (level === 4 && pool.indexOf('NOT') === -1) pool.push('NOT');
          msg('Level ' + level + '. They fall faster now.', 'good');
        }
      } else {
        b.flash = 1;
        setCombo(1);
        setLives(lives - 1);
        st.shake = 14;
        st.burst(b.x + 60, b.y + 24, st.colors.bad, 16, 6);
        beep(160, 0.2, 'sawtooth', 0.06);
        if (lives <= 0) return stop(true);
      }
    }

    b0.addEventListener('click', function () { answer(0); });
    b1.addEventListener('click', function () { answer(1); });
    function onKey(ev) {
      if (!running || activeKey !== 'gate') return;
      if (ev.key === '0') { answer(0); ev.preventDefault(); }
      if (ev.key === '1') { answer(1); ev.preventDefault(); }
    }
    canvas.addEventListener('keydown', onKey);
    document.addEventListener('keydown', onKey);

    var lastW = 0;
    function fitIfNeeded() {
      var r = canvas.getBoundingClientRect();
      if (Math.abs((r.width || 0) - lastW) > 2) { lastW = r.width || 0; st.fit(); }
    }

    function step() {
      raf = requestAnimationFrame(step);
      if (!running || document.hidden || mount.hidden) return;
      fitIfNeeded();

      spawnT -= 1;
      if (spawnT <= 0 && blocks.length < 4) {
        blocks.push(makeBlock());
        spawnT = Math.max(40, 130 - level * 9);
      }

      var floor = st.h - 44;
      for (var i = blocks.length - 1; i >= 0; i--) {
        var b = blocks[i];
        b.y += fall;
        b.flash *= 0.9;
        if (b.y + 48 >= floor) {
          blocks.splice(i, 1);
          setCombo(1);
          setLives(lives - 1);
          st.shake = 18;
          st.burst(b.x + 60, floor, st.colors.bad, 20, 7);
          beep(130, 0.24, 'sawtooth', 0.07);
          if (lives <= 0) { stop(true); break; }
        }
      }

      st.stepParts();
      draw();
    }

    function draw() {
      var ctx = st.ctx, c = st.colors;
      if (!ctx) return;
      ctx.save();
      ctx.clearRect(0, 0, st.w, st.h);
      st.applyShake();

      var floor = st.h - 44;
      /* the substrate they must not touch */
      ctx.fillStyle = c.dark ? 'rgba(255,123,107,.10)' : 'rgba(210,74,53,.08)';
      ctx.fillRect(0, floor, st.w, st.h - floor);
      ctx.strokeStyle = c.bad;
      ctx.setLineDash([7, 6]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, floor); ctx.lineTo(st.w, floor);
      ctx.stroke();
      ctx.setLineDash([]);

      var lo = lowest();
      for (var i = 0; i < blocks.length; i++) {
        var b = blocks[i];
        var isLo = b === lo;
        ctx.save();
        ctx.translate(b.x, b.y);

        ctx.fillStyle = b.flash > 0.05 ? c.bad : (c.dark ? '#123c44' : '#ffffff');
        ctx.strokeStyle = isLo ? c.teal : c.line;
        ctx.lineWidth = isLo ? 3 : 1.5;
        var w = 122, h = 50, r = 10;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.arcTo(w, 0, w, h, r);
        ctx.arcTo(w, h, 0, h, r);
        ctx.arcTo(0, h, 0, 0, r);
        ctx.arcTo(0, 0, w, 0, r);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = c.ink;
        ctx.font = 'bold 17px ui-monospace, "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        var label = b.name === 'NOT' ? 'NOT ' + b.a : b.a + ' ' + b.name + ' ' + b.b;
        ctx.fillText(label, w / 2, h / 2);
        ctx.restore();
      }

      st.drawParts();

      ctx.fillStyle = c.ink;
      ctx.globalAlpha = 0.55;
      ctx.font = '12px ui-monospace, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('level ' + level + ' · answer the outlined gate', 12, 18);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    function start() {
      st.theme(); st.fit(); lastW = canvas.getBoundingClientRect().width || 0;
      blocks.length = 0; st.parts.length = 0;
      fall = 0.55; spawnT = 0; level = 1; solved = 0;
      pool = ['AND', 'OR', 'XOR', 'NAND'];
      setScore(0); setCombo(1); setLives(3);
      running = true;
      msg('Press 0 or 1 for the outlined gate before it lands.', '');
      try { canvas.focus({ preventScroll: true }); } catch (e) {}
      if (!raf) raf = requestAnimationFrame(step);
    }
    function stop(dead) {
      running = false;
      if (dead) msg('Substrate breached. Final score ' + score + '.', 'bad');
    }

    return {
      title: 'Gate Crash',
      rule: 'Falling gates. Give the output of the outlined one before it hits the substrate.',
      start: start,
      stop: function () { running = false; },
      destroy: function () { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; },
      theme: function () { st.theme(); }
    };
  }

  /* ============================================================
     3. TRACE ROUTER
     ============================================================ */
  function TraceRouter(mount) {
    var wrap = el('div', 'rt-wrap');
    var canvas = el('canvas', 'rt-canvas');
    canvas.setAttribute('aria-label', 'Trace Router. Click a tile to rotate it.');
    canvas.tabIndex = 0;
    var meta = el('div', 'rt-meta');
    wrap.appendChild(canvas);
    wrap.appendChild(meta);
    mount.appendChild(wrap);

    var st = Stage(canvas);
    var N = 5, cell = 74, grid = [], lit = [], moves = 0, level = 1;
    var running = false, raf = 0, timeLeft = 0;

    var U = 1, R = 2, D = 4, L = 8;
    function rot(mask, times) {
      for (var i = 0; i < (times % 4 + 4) % 4; i++) {
        mask = ((mask << 1) | (mask >> 3)) & 15;
      }
      return mask;
    }

    function build() {
      grid = [];
      for (var i = 0; i < N * N; i++) grid.push({ mask: 0, angle: 0, want: 0 });
      var seen = [];
      for (i = 0; i < N * N; i++) seen.push(false);
      var stack = [0];
      seen[0] = true;
      while (stack.length) {
        var cur = stack[stack.length - 1];
        var cx = cur % N, cy = Math.floor(cur / N);
        var opts = [];
        if (cy > 0 && !seen[cur - N]) opts.push([cur - N, U, D]);
        if (cx < N - 1 && !seen[cur + 1]) opts.push([cur + 1, R, L]);
        if (cy < N - 1 && !seen[cur + N]) opts.push([cur + N, D, U]);
        if (cx > 0 && !seen[cur - 1]) opts.push([cur - 1, L, R]);
        if (!opts.length) { stack.pop(); continue; }
        var ch = pick(opts);
        grid[cur].mask |= ch[1];
        grid[ch[0]].mask |= ch[2];
        seen[ch[0]] = true;
        stack.push(ch[0]);
      }
      /* scramble, making sure at least one tile is actually wrong */
      var wrong = false;
      for (i = 0; i < N * N; i++) {
        var t = rand(4);
        if (t) wrong = true;
        grid[i].mask = rot(grid[i].mask, t);
        grid[i].want = grid[i].angle = 0;
      }
      if (!wrong) {
        var idx = N * N - 1;
        grid[idx].mask = rot(grid[idx].mask, 1);
      }
      moves = 0;
      power();
    }

    function power() {
      lit = [];
      for (var i = 0; i < N * N; i++) lit.push(false);
      var stack = [0];
      lit[0] = true;
      while (stack.length) {
        var cur = stack.pop();
        var cx = cur % N, cy = Math.floor(cur / N), m = grid[cur].mask;
        if ((m & U) && cy > 0 && (grid[cur - N].mask & D) && !lit[cur - N]) { lit[cur - N] = true; stack.push(cur - N); }
        if ((m & R) && cx < N - 1 && (grid[cur + 1].mask & L) && !lit[cur + 1]) { lit[cur + 1] = true; stack.push(cur + 1); }
        if ((m & D) && cy < N - 1 && (grid[cur + N].mask & U) && !lit[cur + N]) { lit[cur + N] = true; stack.push(cur + N); }
        if ((m & L) && cx > 0 && (grid[cur - 1].mask & R) && !lit[cur - 1]) { lit[cur - 1] = true; stack.push(cur - 1); }
      }
      var all = lit.every(function (v) { return v; });
      meta.innerHTML = '<span>grid <b>' + N + '×' + N + '</b></span><span>lit <b>' + lit.filter(Boolean).length + ' / ' + N * N + '</b></span><span>time <b>' + Math.ceil(timeLeft) + 's</b></span>';
      return all;
    }

    function sizeCell() {
      var r = canvas.getBoundingClientRect();
      var avail = Math.min(r.width || 460, 460);
      cell = Math.floor(avail / N);
      st.fit();
    }

    canvas.addEventListener('click', function (ev) {
      if (!running) return;
      var r = canvas.getBoundingClientRect();
      var x = Math.floor((ev.clientX - r.left) / cell);
      var y = Math.floor((ev.clientY - r.top) / cell);
      if (x < 0 || y < 0 || x >= N || y >= N) return;
      var idx = y * N + x;
      grid[idx].mask = rot(grid[idx].mask, 1);
      grid[idx].want += Math.PI / 2;
      moves++;
      beep(300 + rand(120), 0.05, 'square', 0.03);
      if (power()) win();
    });

    function win() {
      running = false;
      var bonus = Math.max(0, 90 - moves * 2) + Math.ceil(timeLeft) * 3;
      var award = level * 25 + bonus;
      addScore(award);
      setCombo(combo + 1);
      st.burst(st.w / 2, st.h / 2, st.colors.lime, 34, 9);
      msg('Board fully powered in ' + moves + ' rotations. +' + award, 'good');
      beep(680, 0.14, 'triangle', 0.05);
      setTimeout(function () { beep(880, 0.2, 'triangle', 0.05); }, 130);
      setTimeout(function () {
        level++;
        if (N < 8) N++;
        timeLeft = 45 + N * 6;
        sizeCell();
        build();
        running = true;
      }, 1100);
    }

    var lastW = 0;
    function step() {
      raf = requestAnimationFrame(step);
      if (document.hidden || mount.hidden) return;
      var r = canvas.getBoundingClientRect();
      if (Math.abs((r.width || 0) - lastW) > 2) { lastW = r.width || 0; sizeCell(); }
      if (running) {
        timeLeft -= 0.016;
        if (timeLeft <= 0) {
          running = false;
          setCombo(1);
          msg('Out of time. Final score ' + score + '.', 'bad');
          beep(150, 0.25, 'sawtooth', 0.06);
        }
        if (Math.floor(timeLeft * 60) % 30 === 0) power();
      }
      st.stepParts();
      draw();
    }

    function draw() {
      var ctx = st.ctx, c = st.colors;
      if (!ctx || !grid.length) return;
      ctx.save();
      ctx.clearRect(0, 0, st.w, st.h);
      st.applyShake();

      for (var i = 0; i < grid.length; i++) {
        var g = grid[i];
        g.angle += (g.want - g.angle) * 0.28;
        var cx = (i % N) * cell + cell / 2;
        var cy = Math.floor(i / N) * cell + cell / 2;

        ctx.fillStyle = c.dark ? 'rgba(233,244,245,.04)' : 'rgba(13,22,24,.03)';
        ctx.fillRect(cx - cell / 2 + 1, cy - cell / 2 + 1, cell - 2, cell - 2);
        ctx.strokeStyle = c.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - cell / 2 + 1, cy - cell / 2 + 1, cell - 2, cell - 2);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(g.angle);
        var base = rot(g.mask, -Math.round(g.want / (Math.PI / 2)));
        ctx.strokeStyle = lit[i] ? c.lime : c.copper;
        ctx.lineWidth = Math.max(4, cell * 0.13);
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (base & U) { ctx.moveTo(0, 0); ctx.lineTo(0, -cell / 2 + 2); }
        if (base & R) { ctx.moveTo(0, 0); ctx.lineTo(cell / 2 - 2, 0); }
        if (base & D) { ctx.moveTo(0, 0); ctx.lineTo(0, cell / 2 - 2); }
        if (base & L) { ctx.moveTo(0, 0); ctx.lineTo(-cell / 2 + 2, 0); }
        ctx.stroke();
        ctx.fillStyle = lit[i] ? c.lime : c.copper;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(4, cell * 0.09), 0, 6.2832);
        ctx.fill();
        ctx.restore();

        if (i === 0) {
          ctx.fillStyle = c.teal;
          ctx.font = 'bold ' + Math.round(cell * 0.26) + 'px ui-monospace, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('V', cx - cell * 0.3, cy - cell * 0.3);
        }
      }
      st.drawParts();
      ctx.restore();
    }

    function start() {
      st.theme();
      N = 5; level = 1;
      timeLeft = 45 + N * 6;
      sizeCell();
      lastW = canvas.getBoundingClientRect().width || 0;
      build();
      setScore(0); setCombo(1); setLives(0);
      running = true;
      msg('Rotate every trace until the whole board is powered from V.', '');
      if (!raf) raf = requestAnimationFrame(step);
    }

    return {
      title: 'Trace Router',
      rule: 'Rotate the copper until power from V reaches every pad. The grid grows each round.',
      noLives: true,
      start: start,
      stop: function () { running = false; },
      destroy: function () { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; },
      theme: function () { st.theme(); }
    };
  }

  /* ============================================================
     4. RESISTOR RUSH
     ============================================================ */
  function ResistorRush(mount) {
    var wrap = el('div', 'rr-wrap');
    var view = el('div', 'rr-view');
    var bodyEl = el('div', 'res-body');
    var lead1 = el('span', 'res-lead');
    var lead2 = el('span', 'res-lead');
    view.appendChild(lead1); view.appendChild(bodyEl); view.appendChild(lead2);
    var q = el('p', 'rr-q');
    var opts = el('div', 'rr-opts');
    var bar = el('div', 'rr-bar');
    var barFill = el('span');
    bar.appendChild(barFill);
    wrap.appendChild(bar);
    wrap.appendChild(view);
    wrap.appendChild(q);
    wrap.appendChild(opts);
    mount.appendChild(wrap);

    var COLORS = [
      ['black', '#12181a'], ['brown', '#7c4a21'], ['red', '#c0392b'], ['orange', '#d97a20'],
      ['yellow', '#e2c044'], ['green', '#3f8f3f'], ['blue', '#2f6fb5'], ['violet', '#7d5ba6'],
      ['grey', '#9aa3a6'], ['white', '#f1f4f5']
    ];
    var TOL = [['gold', '#c9a227', '5%'], ['silver', '#b9c0c4', '10%']];

    var running = false, answer = 0, reverse = false;
    var qTime = 0, session = 0, tick = 0, gap = 0;

    function bandsFor(value) {
      var mult = 0, v = value;
      while (v >= 100) { v /= 10; mult++; }
      var d = Math.round(v);
      return [Math.floor(d / 10), d % 10, mult];
    }
    function fmt(v) {
      if (v >= 1e6) return (v / 1e6).toFixed(v % 1e6 ? 1 : 0) + ' MΩ';
      if (v >= 1e3) return (v / 1e3).toFixed(v % 1e3 ? 1 : 0) + ' kΩ';
      return v + ' Ω';
    }
    function makeValue() {
      var d1 = 1 + rand(9), d2 = rand(10), m = rand(6);
      return (d1 * 10 + d2) * Math.pow(10, m);
    }

    function render(value) {
      bodyEl.innerHTML = '';
      var b = bandsFor(value);
      for (var i = 0; i < 3; i++) {
        var s = el('span', 'res-band');
        s.style.background = COLORS[b[i]][1];
        bodyEl.appendChild(s);
        if (i === 1) bodyEl.appendChild(el('span', 'res-band gap'));
      }
      var t = pick(TOL);
      var ts = el('span', 'res-band');
      ts.style.background = t[1];
      bodyEl.appendChild(el('span', 'res-band gap'));
      bodyEl.appendChild(ts);
      return b;
    }

    function ask() {
      if (!running) return;
      var value = makeValue();
      answer = value;
      reverse = score > 90 && Math.random() < 0.4;
      opts.innerHTML = '';
      var choices = [value];
      var guard = 0;
      while (choices.length < 4 && guard++ < 60) {
        var alt = makeValue();
        if (choices.indexOf(alt) === -1) choices.push(alt);
      }
      choices.sort(function () { return Math.random() - 0.5; });

      if (reverse) {
        q.textContent = 'Which set of bands reads ' + fmt(value) + '?';
        bodyEl.innerHTML = '';
        view.style.visibility = 'hidden';
        for (var i = 0; i < choices.length; i++) {
          var btn = el('button', 'rr-opt');
          btn.type = 'button';
          btn.setAttribute('data-val', choices[i]);
          var mini = el('span', 'rr-mini');
          var bb = bandsFor(choices[i]);
          for (var k = 0; k < 3; k++) {
            var sp = el('span');
            sp.style.background = COLORS[bb[k]][1];
            mini.appendChild(sp);
          }
          btn.appendChild(mini);
          opts.appendChild(btn);
        }
      } else {
        view.style.visibility = 'visible';
        render(value);
        q.textContent = 'What is this resistor?';
        for (i = 0; i < choices.length; i++) {
          var b2 = el('button', 'rr-opt', fmt(choices[i]));
          b2.type = 'button';
          b2.setAttribute('data-val', choices[i]);
          opts.appendChild(b2);
        }
      }
      qTime = Math.max(3.4, 8 - score / 90);
    }

    opts.addEventListener('click', function (ev) {
      if (!running) return;
      var btn = ev.target.closest ? ev.target.closest('.rr-opt') : null;
      if (!btn || btn.disabled) return;
      var all = opts.querySelectorAll('.rr-opt');
      for (var i = 0; i < all.length; i++) all[i].disabled = true;

      var val = parseFloat(btn.getAttribute('data-val'));
      if (val === answer) {
        btn.classList.add('right');
        addScore(10 + Math.round(qTime * 2));
        setCombo(combo + 1);
        beep(560 + Math.min(combo, 8) * 50, 0.08, 'triangle', 0.045);
        msg('Correct. ' + fmt(answer) + (combo > 2 ? ' · ×' + combo + ' streak' : ''), 'good');
      } else {
        btn.classList.add('wrong');
        for (i = 0; i < all.length; i++) {
          if (parseFloat(all[i].getAttribute('data-val')) === answer) all[i].classList.add('right');
        }
        setCombo(1);
        beep(170, 0.18, 'sawtooth', 0.055);
        msg('It was ' + fmt(answer) + '.', 'bad');
      }
      clearTimeout(gap);
      gap = setTimeout(ask, 780);
    });

    function loop() {
      if (!running) return;
      qTime -= 0.1;
      session -= 0.1;
      barFill.style.width = clamp(qTime / 8, 0, 1) * 100 + '%';
      barFill.style.background = qTime < 2 ? 'var(--bad, #d24a35)' : 'var(--teal-b)';
      if (qTime <= 0) {
        setCombo(1);
        msg('Too slow. It was ' + fmt(answer) + '.', 'bad');
        beep(170, 0.18, 'sawtooth', 0.05);
        ask();
      }
      if (session <= 0) return stop();
    }

    function start() {
      setScore(0); setCombo(1); setLives(0);
      running = true;
      session = 60;
      clearInterval(tick);
      tick = setInterval(loop, 100);
      msg('Read the bands. 60 seconds.', '');
      ask();
    }
    function stop() {
      running = false;
      clearInterval(tick);
      clearTimeout(gap);
      msg('Time. Final score ' + score + '.', '');
    }

    return {
      title: 'Resistor Rush',
      rule: 'Four bands, four choices, eight seconds. Streaks multiply. It reverses when you get good.',
      noLives: true,
      start: start,
      stop: stop,
      destroy: function () { running = false; clearInterval(tick); clearTimeout(gap); },
      theme: function () {}
    };
  }

  /* ============================================================
     shell
     ============================================================ */
  var FACTORIES = {
    runner: ElectronRunner,
    gate: GateCrash,
    router: TraceRouter,
    resistor: ResistorRush
  };
  var instances = {};

  function panel(key) { return document.getElementById('panel-' + key); }

  function select(key) {
    if (!FACTORIES[key]) return;
    if (active && active.stop) active.stop();

    activeKey = key;
    Object.keys(FACTORIES).forEach(function (k) {
      var p = panel(k);
      if (p) p.hidden = k !== key;
      var t = tabs ? tabs.querySelector('[data-game="' + k + '"]') : null;
      if (t) {
        t.setAttribute('aria-selected', k === key ? 'true' : 'false');
        t.classList.toggle('on', k === key);
      }
    });

    if (!instances[key]) {
      var mount = panel(key);
      if (!mount) return;
      instances[key] = FACTORIES[key](mount);
    }
    active = instances[key];

    if (elTitle) elTitle.textContent = active.title;
    if (elRule) elRule.textContent = active.rule;
    if (elLives) elLives.hidden = !!active.noLives;

    best = parseInt((B.store ? B.store.get('best-' + key, '0') : '0'), 10) || 0;
    if (elBest) elBest.textContent = best;
    setScore(0);
    setCombo(1);
    setLives(active.noLives ? 0 : 3);
    msg('Press start.');
  }

  if (tabs) {
    tabs.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-game]') : null;
      if (b) select(b.getAttribute('data-game'));
    });
    tabs.addEventListener('keydown', function (ev) {
      var list = Array.prototype.slice.call(tabs.querySelectorAll('[data-game]'));
      var i = list.indexOf(document.activeElement);
      if (i === -1) return;
      if (ev.key === 'ArrowRight') { list[(i + 1) % list.length].focus(); ev.preventDefault(); }
      if (ev.key === 'ArrowLeft') { list[(i - 1 + list.length) % list.length].focus(); ev.preventDefault(); }
    });
  }

  if (elStart) {
    elStart.addEventListener('click', function () {
      if (B.audio) B.audio.unlock();
      if (active && active.start) active.start();
    });
  }

  var paintSound = function () {
    if (!elSound || !B.audio) return;
    elSound.textContent = B.audio.enabled ? 'Sound on' : 'Sound off';
    elSound.setAttribute('aria-pressed', B.audio.enabled ? 'true' : 'false');
  };
  if (elSound && B.audio) {
    elSound.addEventListener('click', function () {
      B.audio.setEnabled(!B.audio.enabled);
      paintSound();
    });
    paintSound();
  }

  if (B.onTheme) {
    B.onTheme(function () {
      Object.keys(instances).forEach(function (k) {
        if (instances[k].theme) instances[k].theme();
      });
    });
  }

  select('runner');
})();
