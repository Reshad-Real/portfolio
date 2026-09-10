/* ============================================================
   games.js — the bench arcade
   Four self-contained games behind one shell. Each exposes
   mount / start / stop, and cleans up every timer it creates.
   ============================================================ */
(function () {
  'use strict';

  var B = window.Bench || {};
  var tabsEl = document.getElementById('gameTabs');
  var titleEl = document.getElementById('gbTitle');
  var ruleEl = document.getElementById('gbRule');
  var scoreEl = document.getElementById('gbScore');
  var bestEl = document.getElementById('gbBest');
  var startEl = document.getElementById('gbStart');
  var soundEl = document.getElementById('gbSound');
  var msgEl = document.getElementById('gameMsg');
  if (!tabsEl || !startEl) return;

  function snd(f, d, type, vol) { if (B.audio) B.audio.tone(f, d, type, vol); }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function pick(arr) { return arr[rnd(arr.length)]; }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  /* =========================================================
     1. LOGIC GATE LAB
     ========================================================= */
  function LogicGame() {
    var host, api, svg, bits;
    var nodes, layers, target, level, score, timeLeft, tick, nextT, playing;

    var TWO = ['AND', 'OR', 'XOR', 'NAND', 'NOR', 'XNOR'];
    var ONE = ['NOT', 'BUF'];

    function evalGate(g, a, b) {
      switch (g) {
        case 'AND': return a & b;
        case 'OR': return a | b;
        case 'XOR': return a ^ b;
        case 'NAND': return (a & b) ? 0 : 1;
        case 'NOR': return (a | b) ? 0 : 1;
        case 'XNOR': return (a ^ b) ? 0 : 1;
        case 'NOT': return a ? 0 : 1;
        default: return a;
      }
    }

    function build(nInputs) {
      var all = [];
      var l0 = [];
      for (var i = 0; i < nInputs; i++) {
        var n = { kind: 'in', name: String.fromCharCode(65 + i), value: 0, idx: i };
        l0.push(n); all.push(n);
      }
      var lay = [l0];
      var cur = l0;
      while (cur.length > 1) {
        var next = [];
        for (var j = 0; j < cur.length; j += 2) {
          var node;
          if (j + 1 < cur.length) node = { kind: 'gate', gate: pick(TWO), a: cur[j], b: cur[j + 1], value: 0 };
          else node = { kind: 'gate', gate: pick(ONE), a: cur[j], b: null, value: 0 };
          next.push(node); all.push(node);
        }
        lay.push(next);
        cur = next;
      }
      return { layers: lay, all: all, out: cur[0], n: nInputs };
    }

    function evaluate(c, mask) {
      for (var i = 0; i < c.layers[0].length; i++) {
        c.layers[0][i].value = (mask >> i) & 1;
      }
      for (var L = 1; L < c.layers.length; L++) {
        for (var k = 0; k < c.layers[L].length; k++) {
          var g = c.layers[L][k];
          g.value = evalGate(g.gate, g.a.value, g.b ? g.b.value : 0);
        }
      }
      return c.out.value;
    }

    function makeCircuit(nInputs) {
      // keep generating until the puzzle has a solution and is not already solved
      for (var attempt = 0; attempt < 60; attempt++) {
        var c = build(nInputs);
        var wanted = 1;
        var hits = [], misses = [];
        for (var m = 0; m < (1 << nInputs); m++) {
          if (evaluate(c, m) === wanted) hits.push(m); else misses.push(m);
        }
        if (hits.length === 0 || misses.length === 0) continue;
        // start from a state that is NOT a solution
        evaluate(c, pick(misses));
        c.target = wanted;
        return c;
      }
      var fb = build(2);
      fb.target = 1;
      evaluate(fb, 0);
      return fb;
    }

    function layout(c) {
      var maxNodes = c.layers[0].length;
      var H = Math.max(200, 70 + maxNodes * 66);
      var W = 660;
      var cols = c.layers.length;
      var xs = 520 / (cols + 0.6);
      for (var L = 0; L < cols; L++) {
        var arr = c.layers[L];
        for (var i = 0; i < arr.length; i++) {
          arr[i].x = 62 + L * xs;
          arr[i].y = H / 2 + (i - (arr.length - 1) / 2) * (H - 60) / Math.max(1, arr.length);
        }
      }
      c.W = W; c.H = H;
      c.ledX = 62 + cols * xs + 26;
      return c;
    }

    function wirePath(x1, y1, x2, y2) {
      var mid = (x1 + x2) / 2;
      return 'M' + x1 + ' ' + y1 + ' H' + mid + ' V' + y2 + ' H' + x2;
    }

    function render(c) {
      var ns = 'http://www.w3.org/2000/svg';
      var s = document.createElementNS(ns, 'svg');
      s.setAttribute('viewBox', '0 0 ' + c.W + ' ' + c.H);
      s.setAttribute('class', 'lg-svg');
      s.setAttribute('role', 'group');
      s.setAttribute('aria-label', 'Logic circuit. Toggle the input switches.');

      function add(tag, attrs, parent) {
        var e = document.createElementNS(ns, tag);
        for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
        (parent || s).appendChild(e);
        return e;
      }

      // wires first so boxes sit on top
      for (var L = 1; L < c.layers.length; L++) {
        for (var i = 0; i < c.layers[L].length; i++) {
          var g = c.layers[L][i];
          var ins = g.b ? [g.a, g.b] : [g.a];
          for (var k = 0; k < ins.length; k++) {
            var src = ins[k];
            var offset = ins.length === 2 ? (k === 0 ? -11 : 11) : 0;
            var p = add('path', {
              d: wirePath(src.x + 32, src.y, g.x - 38, g.y + offset),
              class: 'wire' + (src.value ? ' hot' : '')
            });
            g['wire' + k] = p;
          }
        }
      }
      // output wire
      var outWire = add('path', {
        d: wirePath(c.out.x + 38, c.out.y, c.ledX - 22, c.H / 2),
        class: 'wire' + (c.out.value ? ' hot' : '')
      });
      c.outWire = outWire;

      // input switches
      for (var a = 0; a < c.layers[0].length; a++) {
        (function (node) {
          var g = add('g', { class: 'sw' + (node.value ? ' on' : ''), tabindex: '0', role: 'button', 'aria-label': 'Input ' + node.name });
          add('rect', { class: 'sw-box', x: node.x - 32, y: node.y - 22, width: 64, height: 44, rx: 9 }, g);
          var txt = add('text', { class: 'sw-txt', x: node.x, y: node.y + 1 }, g);
          txt.textContent = node.name + ' = ' + node.value;
          node.el = g; node.txt = txt;
          g.style.cursor = 'pointer';
          g.addEventListener('click', function () { toggle(node); });
          g.addEventListener('keydown', function (ev) {
            if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggle(node); }
          });
        })(c.layers[0][a]);
      }

      // gates
      for (var L2 = 1; L2 < c.layers.length; L2++) {
        for (var j = 0; j < c.layers[L2].length; j++) {
          var gn = c.layers[L2][j];
          add('rect', { class: 'gate-box', x: gn.x - 38, y: gn.y - 22, width: 76, height: 44, rx: 8 });
          var t = add('text', { class: 'gate-label', x: gn.x, y: gn.y + 1 });
          t.textContent = gn.gate;
        }
      }

      // output LED
      var ledG = add('g', { class: 'led' + (c.out.value ? ' led-on' : '') });
      add('circle', { class: 'led-body', cx: c.ledX, cy: c.H / 2, r: 20 }, ledG);
      var lbl = add('text', { class: 'gate-label', x: c.ledX, y: c.H / 2 + 44 }, ledG);
      lbl.textContent = 'OUT';
      c.ledG = ledG;

      return s;
    }

    function refresh(c) {
      var mask = 0;
      for (var i = 0; i < c.layers[0].length; i++) mask |= (c.layers[0][i].value << i);
      var out = evaluate(c, mask);

      for (var a = 0; a < c.layers[0].length; a++) {
        var n = c.layers[0][a];
        if (n.el) n.el.setAttribute('class', 'sw' + (n.value ? ' on' : ''));
        if (n.txt) n.txt.textContent = n.name + ' = ' + n.value;
      }
      for (var L = 1; L < c.layers.length; L++) {
        for (var j = 0; j < c.layers[L].length; j++) {
          var g = c.layers[L][j];
          var ins = g.b ? [g.a, g.b] : [g.a];
          for (var k = 0; k < ins.length; k++) {
            var w = g['wire' + k];
            if (w) w.setAttribute('class', 'wire' + (ins[k].value ? ' hot' : ''));
          }
        }
      }
      if (c.outWire) c.outWire.setAttribute('class', 'wire' + (out ? ' hot' : ''));
      if (c.ledG) c.ledG.setAttribute('class', 'led' + (out ? ' led-on' : ''));
      return out;
    }

    function toggle(node) {
      if (!playing) { api.msg('Press start first.'); return; }
      node.value = node.value ? 0 : 1;
      snd(node.value ? 520 : 380, 0.06, 'square', 0.05);
      var out = refresh(nodes);
      updateBits();
      if (out === nodes.target) solved();
    }

    function updateBits() {
      if (!bits) return;
      bits.innerHTML = '';

      var lvl = el('span', null, 'level ');
      lvl.appendChild(el('b', null, String(level)));
      bits.appendChild(lvl);

      bits.appendChild(el('span', 'lg-target', 'drive OUT to 1'));

      var time = el('span', null, 'time ');
      time.appendChild(el('b', null, Math.max(0, timeLeft) + 's'));
      bits.appendChild(time);
    }

    function solved() {
      if (!playing) return;
      playing = false;                       // brief pause between circuits
      var gain = 10 + level * 5;
      score += gain;
      api.setScore(score);
      api.msg('Output high. +' + gain, 'good');
      snd(660, 0.1, 'square', 0.06);
      setTimeout(function () { snd(990, 0.14, 'square', 0.06); }, 90);
      nextT = setTimeout(function () {
        if (timeLeft <= 0) return;
        level++;
        playing = true;
        newCircuit();
      }, 620);
    }

    function newCircuit() {
      var nIn = Math.min(4, 2 + Math.floor((level - 1) / 3));
      nodes = layout(makeCircuit(nIn));
      svg.innerHTML = '';
      svg.appendChild(render(nodes));
      refresh(nodes);
      updateBits();
    }

    return {
      title: 'Logic Gate Lab',
      rule: 'Flip the inputs until the output LED lights. 60 seconds.',
      key: 'logic',
      mount: function (el0, a) {
        host = el0; api = a;
        host.innerHTML = '';
        var wrap = el('div', 'lg-wrap');
        svg = el('div');
        svg.style.width = '100%';
        svg.style.display = 'flex';
        svg.style.justifyContent = 'center';
        bits = el('div', 'lg-bits');
        wrap.appendChild(svg);
        wrap.appendChild(bits);
        host.appendChild(wrap);
        level = 1; score = 0; timeLeft = 60; playing = false;
        newCircuit();
        api.msg('Press start. Each solved circuit is worth more than the last.');
      },
      start: function () {
        this.stop();
        level = 1; score = 0; timeLeft = 60; playing = true;
        api.setScore(0);
        newCircuit();
        api.msg('Go. Drive the output high.');
        tick = setInterval(function () {
          timeLeft--;
          updateBits();
          if (timeLeft === 5) snd(440, 0.1, 'sine', 0.05);
          if (timeLeft <= 0) {
            clearInterval(tick); tick = null;
            playing = false;
            api.finish(score, 'Time. ' + score + ' points across ' + (level - 1) + ' circuits.');
          }
        }, 1000);
      },
      stop: function () {
        playing = false;
        if (tick) { clearInterval(tick); tick = null; }
        if (nextT) { clearTimeout(nextT); nextT = null; }
      }
    };
  }

  /* =========================================================
     2. TRACE ROUTER
     ========================================================= */
  function RouterGame() {
    var host, api, canvas, ctx, meta;
    var N, cells, dpr, SIZE = 440, cell;
    var level, score, moves, playing, raf, solvedFlash;

    var UP = 1, RIGHT = 2, DOWN = 4, LEFT = 8;
    var DIRS = [
      { bit: UP, dx: 0, dy: -1, opp: DOWN },
      { bit: RIGHT, dx: 1, dy: 0, opp: LEFT },
      { bit: DOWN, dx: 0, dy: 1, opp: UP },
      { bit: LEFT, dx: -1, dy: 0, opp: RIGHT }
    ];

    function rot(mask, times) {
      var m = mask;
      for (var i = 0; i < (times % 4 + 4) % 4; i++) m = ((m << 1) | (m >> 3)) & 15;
      return m;
    }
    function idx(x, y) { return y * N + x; }

    function generate() {
      cells = [];
      for (var i = 0; i < N * N; i++) cells.push({ base: 0, rot: 0, vis: 0, target: 0, lit: false });

      // randomised depth-first spanning tree from the VCC pad
      var visited = new Array(N * N);
      var stack = [{ x: 0, y: 0 }];
      visited[0] = true;
      while (stack.length) {
        var c = stack[stack.length - 1];
        var options = [];
        for (var d = 0; d < 4; d++) {
          var nx = c.x + DIRS[d].dx, ny = c.y + DIRS[d].dy;
          if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
          if (visited[idx(nx, ny)]) continue;
          options.push(d);
        }
        if (!options.length) { stack.pop(); continue; }
        var pickD = options[rnd(options.length)];
        var tx = c.x + DIRS[pickD].dx, ty = c.y + DIRS[pickD].dy;
        cells[idx(c.x, c.y)].base |= DIRS[pickD].bit;
        cells[idx(tx, ty)].base |= DIRS[pickD].opp;
        visited[idx(tx, ty)] = true;
        stack.push({ x: tx, y: ty });
      }

      // scramble, making sure we do not hand out a finished board
      var anyRotated = false;
      for (var k = 0; k < cells.length; k++) {
        var r = rnd(4);
        cells[k].rot = r;
        cells[k].vis = r * Math.PI / 2;
        cells[k].target = r * Math.PI / 2;
        // a 4-way or symmetric piece cannot be "wrong", ignore those
        if (r !== 0 && cells[k].base !== 15) anyRotated = true;
      }
      if (!anyRotated) {
        var c0 = cells[idx(N - 1, N - 1)];
        c0.rot = 1; c0.vis = c0.target = Math.PI / 2;
      }
      moves = 0;
      power();
    }

    function power() {
      for (var i = 0; i < cells.length; i++) cells[i].lit = false;
      var queue = [{ x: 0, y: 0 }];
      cells[0].lit = true;
      while (queue.length) {
        var c = queue.shift();
        var mask = rot(cells[idx(c.x, c.y)].base, cells[idx(c.x, c.y)].rot);
        for (var d = 0; d < 4; d++) {
          if (!(mask & DIRS[d].bit)) continue;
          var nx = c.x + DIRS[d].dx, ny = c.y + DIRS[d].dy;
          if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
          var nc = cells[idx(nx, ny)];
          if (nc.lit) continue;
          var nmask = rot(nc.base, nc.rot);
          if (!(nmask & DIRS[d].opp)) continue;
          nc.lit = true;
          queue.push({ x: nx, y: ny });
        }
      }
      var count = 0;
      for (var j = 0; j < cells.length; j++) if (cells[j].lit) count++;
      return count;
    }

    function colors() { return (B.colors ? B.colors() : { lime: '#6dbb1c', teal: '#0c7b86', copper: '#a35f31', line: '#bccacc', surface: '#fff', dark: false }); }

    function draw() {
      if (!ctx) return;
      var col = colors();
      ctx.clearRect(0, 0, SIZE, SIZE);

      // board
      ctx.fillStyle = col.dark ? 'rgba(255,255,255,.02)' : 'rgba(0,0,0,.02)';
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.strokeStyle = col.dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.07)';
      ctx.lineWidth = 1;
      for (var g = 1; g < N; g++) {
        ctx.beginPath(); ctx.moveTo(g * cell, 0); ctx.lineTo(g * cell, SIZE); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, g * cell); ctx.lineTo(SIZE, g * cell); ctx.stroke();
      }

      for (var y = 0; y < N; y++) {
        for (var x = 0; x < N; x++) {
          var c = cells[idx(x, y)];
          var cx = x * cell + cell / 2, cy = y * cell + cell / 2;
          var arms = [];
          for (var d = 0; d < 4; d++) if (c.base & DIRS[d].bit) arms.push(d);

          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(c.vis);

          var hot = c.lit;
          ctx.strokeStyle = hot ? col.lime : col.line;
          ctx.lineWidth = hot ? 9 : 7;
          ctx.lineCap = 'round';
          if (hot) { ctx.shadowColor = col.lime; ctx.shadowBlur = 12; }

          for (var a = 0; a < arms.length; a++) {
            var dd = DIRS[arms[a]];
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(dd.dx * cell * 0.5, dd.dy * cell * 0.5);
            ctx.stroke();
          }

          // node pad, or an LED on a dead end
          ctx.shadowBlur = hot ? 14 : 0;
          if (arms.length === 1) {
            ctx.fillStyle = hot ? col.lime : col.line;
            ctx.beginPath(); ctx.arc(0, 0, cell * 0.17, 0, Math.PI * 2); ctx.fill();
          } else {
            ctx.fillStyle = hot ? col.lime : col.line;
            ctx.beginPath(); ctx.arc(0, 0, cell * 0.1, 0, Math.PI * 2); ctx.fill();
          }
          ctx.restore();

          // the source pad never rotates and is drawn on top
          if (x === 0 && y === 0) {
            ctx.save();
            ctx.shadowBlur = 0;
            ctx.fillStyle = col.copper;
            ctx.beginPath();
            ctx.arc(cx, cy, cell * 0.26, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = col.dark ? '#04090a' : '#ffffff';
            ctx.font = '600 ' + Math.round(cell * 0.26) + 'px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('V', cx, cy + 1);
            ctx.restore();
          }
        }
      }

      if (solvedFlash > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.45, solvedFlash);
        ctx.fillStyle = col.lime;
        ctx.fillRect(0, 0, SIZE, SIZE);
        ctx.restore();
      }
    }

    function animate() {
      raf = requestAnimationFrame(animate);
      if (document.hidden || (host && host.hidden)) return;
      var changed = false;
      for (var i = 0; i < cells.length; i++) {
        var c = cells[i];
        if (Math.abs(c.target - c.vis) > 0.001) {
          c.vis += (c.target - c.vis) * 0.24;
          changed = true;
        } else if (c.vis !== c.target) { c.vis = c.target; changed = true; }
      }
      if (solvedFlash > 0) { solvedFlash -= 0.02; changed = true; }
      if (changed || draw.force) { draw(); draw.force = false; }
    }

    function updateMeta(lit) {
      if (!meta) return;
      meta.innerHTML = '';
      var a = el('span', null, 'grid ' + N + '×' + N);
      var b = el('span', null, 'lit ');
      b.appendChild(el('b', null, lit + ' / ' + (N * N)));
      var c = el('span', null, 'rotations ' + moves);
      meta.appendChild(a); meta.appendChild(b); meta.appendChild(c);
    }

    function onClick(ev) {
      if (!playing) { api.msg('Press start first.'); return; }
      var rect = canvas.getBoundingClientRect();
      if (!rect.width) return;
      var x = Math.floor(((ev.clientX - rect.left) / rect.width) * N);
      var y = Math.floor(((ev.clientY - rect.top) / rect.height) * N);
      if (x < 0 || y < 0 || x >= N || y >= N) return;
      var c = cells[idx(x, y)];
      c.rot = (c.rot + 1) % 4;
      c.target += Math.PI / 2;
      moves++;
      snd(300 + rnd(120), 0.05, 'square', 0.04);
      var lit = power();
      updateMeta(lit);
      draw.force = true;
      if (lit === N * N) win();
    }

    function win() {
      playing = false;
      var bonus = Math.max(20, 140 - moves * 2);
      score += level * 25 + bonus;
      api.setScore(score);
      solvedFlash = 0.45;
      api.msg('Board fully powered in ' + moves + ' rotations. +' + (level * 25 + bonus), 'good');
      snd(523, 0.11, 'square', 0.06);
      setTimeout(function () { snd(659, 0.11, 'square', 0.06); }, 110);
      setTimeout(function () { snd(784, 0.16, 'square', 0.06); }, 220);
      setTimeout(function () {
        level++;
        N = Math.min(8, 4 + level);
        cell = SIZE / N;
        generate();
        updateMeta(power());
        draw.force = true;
        playing = true;
        api.msg('Level ' + level + '. Grid is ' + N + '×' + N + ' now.');
      }, 1500);
    }

    return {
      title: 'Trace Router',
      rule: 'Rotate every trace until the whole board is powered from the V pad.',
      key: 'router',
      mount: function (el0, a) {
        host = el0; api = a;
        host.innerHTML = '';
        var wrap = el('div', 'tr');
        canvas = document.createElement('canvas');
        canvas.id = 'routerCanvas';
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = SIZE * dpr;
        canvas.height = SIZE * dpr;
        ctx = canvas.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);
        canvas.addEventListener('click', onClick);
        meta = el('div', 'tr-meta');
        wrap.appendChild(canvas);
        wrap.appendChild(meta);
        host.appendChild(wrap);

        level = 1; score = 0; playing = false;
        N = 5; cell = SIZE / N;
        generate();
        updateMeta(power());
        draw.force = true;
        if (!raf) animate();
        api.msg('Press start. Click a tile to rotate it a quarter turn.');
      },
      start: function () {
        this.stop();
        level = 1; score = 0; N = 5; cell = SIZE / N;
        api.setScore(0);
        generate();
        updateMeta(power());
        draw.force = true;
        playing = true;
        if (!raf) animate();
        api.msg('Light every pad on the board.');
      },
      stop: function () {
        playing = false;
      }
    };
  }

  /* =========================================================
     3. RESISTOR RUSH
     ========================================================= */
  function ResistorGame() {
    var host, api, resEl, optsEl, timerEl, promptEl;
    var score, streak, timeLeft, qLeft, playing, answer, mode;
    var barTick = null, sessionTick = null, gapTimer = null;

    var CODES = [
      { n: 'black', hex: '#141414' }, { n: 'brown', hex: '#6b3f22' }, { n: 'red', hex: '#c0392b' },
      { n: 'orange', hex: '#e07a1f' }, { n: 'yellow', hex: '#e8c62c' }, { n: 'green', hex: '#2e8b45' },
      { n: 'blue', hex: '#2d6cdf' }, { n: 'violet', hex: '#8353c9' }, { n: 'grey', hex: '#8d9296' },
      { n: 'white', hex: '#f2f2f2' }
    ];
    var TOL = { hex: '#c9a227', label: '±5%' };

    function fmt(ohms) {
      if (ohms >= 1e6) return trim(ohms / 1e6) + ' MΩ';
      if (ohms >= 1e3) return trim(ohms / 1e3) + ' kΩ';
      return trim(ohms) + ' Ω';
    }
    function trim(v) {
      var s = v.toFixed(2);
      s = s.replace(/\.?0+$/, '');
      return s;
    }

    function makeQuestion() {
      var d1 = 1 + rnd(9);
      var d2 = rnd(10);
      var mult = rnd(6);
      var value = (d1 * 10 + d2) * Math.pow(10, mult);
      var bands = [CODES[d1], CODES[d2], CODES[mult], TOL];

      var opts = [value];
      var guard = 0;
      while (opts.length < 4 && guard++ < 60) {
        var variant;
        var roll = rnd(3);
        if (roll === 0) variant = (d1 * 10 + d2) * Math.pow(10, Math.max(0, Math.min(6, mult + (rnd(2) ? 1 : -1))));
        else if (roll === 1) variant = ((d1 * 10 + ((d2 + 1 + rnd(3)) % 10))) * Math.pow(10, mult);
        else variant = ((((d1 + 1 + rnd(3)) % 9) + 1) * 10 + d2) * Math.pow(10, mult);
        if (opts.indexOf(variant) === -1) opts.push(variant);
      }
      while (opts.length < 4) opts.push(value * (opts.length + 1) * 10);

      // shuffle
      for (var i = opts.length - 1; i > 0; i--) {
        var j = rnd(i + 1); var t = opts[i]; opts[i] = opts[j]; opts[j] = t;
      }
      return { bands: bands, value: value, opts: opts, reverse: mode === 'reverse' };
    }

    function drawResistor(bands) {
      resEl.innerHTML = '';
      var body = el('div', 'res-body');
      for (var i = 0; i < bands.length; i++) {
        var b = el('span', 'res-band');
        b.style.background = bands[i].hex;
        body.appendChild(b);
        if (i === 2) body.appendChild(el('span', 'res-band gap'));
      }
      resEl.appendChild(body);
    }

    function nextQuestion() {
      if (!playing) return;
      mode = (score > 120 && Math.random() < 0.4) ? 'reverse' : 'forward';
      answer = makeQuestion();
      qLeft = 100;

      if (answer.reverse) {
        // show the value, ask which band set matches
        resEl.innerHTML = '';
        promptEl.innerHTML = '';
        promptEl.appendChild(document.createTextNode('which resistor reads '));
        promptEl.appendChild(el('b', null, fmt(answer.value)));
        promptEl.appendChild(document.createTextNode('?'));
      } else {
        drawResistor(answer.bands);
        promptEl.textContent = 'read the bands';
      }

      optsEl.innerHTML = '';
      for (var i = 0; i < answer.opts.length; i++) {
        (function (v) {
          var btn = el('button', 'rr-opt', answer.reverse ? '' : fmt(v));
          btn.type = 'button';
          btn.setAttribute('data-val', String(v));
          btn.setAttribute('aria-label', fmt(v));
          if (answer.reverse) {
            // render a miniature resistor for each option
            var mini = el('span');
            mini.style.display = 'inline-flex';
            mini.style.gap = '4px';
            mini.style.alignItems = 'center';
            var digits = bandsFor(v);
            for (var k = 0; k < digits.length; k++) {
              var sw = el('span');
              sw.style.width = '12px'; sw.style.height = '26px';
              sw.style.borderRadius = '2px';
              sw.style.background = digits[k].hex;
              sw.style.border = '1px solid rgba(128,128,128,.4)';
              mini.appendChild(sw);
            }
            btn.appendChild(mini);
          }
          btn.addEventListener('click', function () { answerPick(btn, v); });
          optsEl.appendChild(btn);
        })(answer.opts[i]);
      }
    }

    function bandsFor(value) {
      var mult = 0, v = value;
      while (v >= 100 && mult < 8) { v = v / 10; mult++; }
      var d = Math.round(v);
      var d1 = Math.floor(d / 10), d2 = d % 10;
      return [CODES[Math.max(0, Math.min(9, d1))], CODES[Math.max(0, Math.min(9, d2))], CODES[Math.max(0, Math.min(9, mult))]];
    }

    function answerPick(btn, v) {
      if (!playing || !answer) return;
      var all = optsEl.querySelectorAll('.rr-opt');
      for (var i = 0; i < all.length; i++) all[i].disabled = true;
      qLeft = 100;

      if (v === answer.value) {
        streak++;
        var gain = 10 + Math.min(30, streak * 4);
        score += gain;
        btn.classList.add('right');
        api.setScore(score);
        api.msg('Correct. ' + fmt(answer.value) + '. Streak ' + streak + '. +' + gain, 'good');
        snd(760, 0.09, 'triangle', 0.06);
      } else {
        streak = 0;
        btn.classList.add('wrong');
        for (var j = 0; j < all.length; j++) {
          if (all[j] !== btn && parseFloat(all[j].getAttribute('data-val')) === answer.value) {
            all[j].classList.add('right');
          }
        }
        api.msg('It was ' + fmt(answer.value) + '. Streak reset.', 'bad');
        snd(180, 0.2, 'sawtooth', 0.05);
      }
      if (gapTimer) clearTimeout(gapTimer);
      gapTimer = setTimeout(nextQuestion, 950);
    }

    function registryStopResistor() {
      playing = false;
      if (barTick) { clearInterval(barTick); barTick = null; }
      if (sessionTick) { clearInterval(sessionTick); sessionTick = null; }
      if (gapTimer) { clearTimeout(gapTimer); gapTimer = null; }
      if (optsEl) {
        var all = optsEl.querySelectorAll('.rr-opt');
        for (var i = 0; i < all.length; i++) all[i].disabled = true;
      }
    }

    return {
      title: 'Resistor Rush',
      rule: 'Read the colour bands before the clock runs out. Streaks pay more.',
      key: 'resistor',
      mount: function (el0, a) {
        host = el0; api = a;
        host.innerHTML = '';
        var wrap = el('div', 'rr');
        promptEl = el('div', 'rr-prompt', 'press start');
        resEl = el('div', 'res');
        timerEl = el('div', 'rr-timer');
        timerEl.appendChild(el('span'));
        optsEl = el('div', 'rr-options');
        wrap.appendChild(resEl);
        wrap.appendChild(promptEl);
        wrap.appendChild(timerEl);
        wrap.appendChild(optsEl);
        host.appendChild(wrap);
        score = 0; streak = 0; playing = false;
        drawResistor([CODES[1], CODES[0], CODES[2], TOL]);
        api.msg('Press start. Black 0, brown 1, red 2, orange 3, yellow 4, green 5, blue 6, violet 7, grey 8, white 9.');
      },
      start: function () {
        this.stop();
        score = 0; streak = 0; timeLeft = 60; qLeft = 100; playing = true;
        api.setScore(0);
        nextQuestion();
        api.msg('Go. Eight seconds a resistor.');

        // per-question bar: 100% over 8 seconds
        barTick = setInterval(function () {
          if (!playing) return;
          qLeft -= 4;
          var bar = timerEl.firstChild;
          if (bar) bar.style.width = Math.max(0, qLeft) + '%';
          if (qLeft <= 0 && answer) {
            streak = 0;
            api.msg('Too slow. It was ' + fmt(answer.value) + '.', 'bad');
            snd(160, 0.18, 'sawtooth', 0.05);
            if (gapTimer) { clearTimeout(gapTimer); gapTimer = null; }
            nextQuestion();
          }
        }, 320);

        // whole session: 60 seconds
        sessionTick = setInterval(function () {
          timeLeft--;
          if (timeLeft === 5) snd(440, 0.1, 'sine', 0.05);
          if (timeLeft <= 0) {
            var finalScore = score;
            registryStopResistor();
            api.finish(finalScore, 'Time. ' + finalScore + ' points, best streak kept.');
          }
        }, 1000);
      },
      stop: function () { registryStopResistor(); }
    };
  }

  /* =========================================================
     4. SIGNAL SEQUENCE
     ========================================================= */
  function SignalGame() {
    var host, api, boardEl, readEl;
    var pads = [], seq = [], step, playing, accepting, round, score, timers = [];

    var PADS = [
      { c: '#12b5c4', f: 329.63 },
      { c: '#7ac70c', f: 392.00 },
      { c: '#e08a2f', f: 523.25 },
      { c: '#8353c9', f: 659.25 },
      { c: '#d64550', f: 784.00 },
      { c: '#2d8cf0', f: 880.00 }
    ];

    function clearTimers() {
      for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
      timers = [];
    }
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

    function padCount() { return round > 7 ? 6 : 4; }

    function buildBoard() {
      boardEl.innerHTML = '';
      pads = [];
      var n = padCount();
      boardEl.style.gridTemplateColumns = 'repeat(' + (n > 4 ? 3 : 2) + ', auto)';
      for (var i = 0; i < n; i++) {
        (function (i2) {
          var b = el('button', 'sg-pad', 'LED' + (i2 + 1));
          b.type = 'button';
          b.style.setProperty('--pad', PADS[i2].c);
          b.addEventListener('click', function () { press(i2); });
          boardEl.appendChild(b);
          pads.push(b);
        })(i);
      }
    }

    function flash(i, ms) {
      if (!pads[i]) return;
      pads[i].classList.add('lit');
      snd(PADS[i].f, (ms || 300) / 1000, 'triangle', 0.07);
      later(function () { if (pads[i]) pads[i].classList.remove('lit'); }, ms || 300);
    }

    function playSequence() {
      accepting = false;
      setPads(true);
      api.msg('Watch the board.');
      var gap = Math.max(230, 620 - round * 26);
      for (var i = 0; i < seq.length; i++) {
        (function (i2) {
          later(function () { flash(seq[i2], gap * 0.55); }, i2 * gap + 400);
        })(i);
      }
      later(function () {
        accepting = true;
        setPads(false);
        api.msg('Your turn. ' + seq.length + ' in the sequence.');
        updateRead();
      }, seq.length * gap + 500);
    }

    function setPads(disabled) {
      for (var i = 0; i < pads.length; i++) pads[i].disabled = !!disabled;
    }

    function updateRead() {
      if (!readEl) return;
      readEl.innerHTML = '';
      readEl.appendChild(document.createTextNode('round '));
      readEl.appendChild(el('b', null, String(round)));
      readEl.appendChild(document.createTextNode(' · length ' + seq.length + ' · entered ' + step));
    }

    function nextRound() {
      round++;
      if (padCount() !== pads.length) buildBoard();
      seq.push(rnd(padCount()));
      step = 0;
      updateRead();
      later(playSequence, 600);
    }

    function press(i) {
      if (!playing || !accepting) return;
      flash(i, 220);
      if (seq[step] === i) {
        step++;
        updateRead();
        if (step >= seq.length) {
          accepting = false;
          var gain = round * 5;
          score += gain;
          api.setScore(score);
          api.msg('Clean. +' + gain, 'good');
          later(nextRound, 750);
        }
      } else {
        accepting = false;
        playing = false;
        setPads(true);
        snd(120, 0.35, 'sawtooth', 0.07);
        api.finish(score, 'Wrong pad on round ' + round + '. Final score ' + score + '.');
      }
    }

    return {
      title: 'Signal Sequence',
      rule: 'Repeat the pattern the board plays back. It adds one every round.',
      key: 'signal',
      mount: function (el0, a) {
        host = el0; api = a;
        host.innerHTML = '';
        var wrap = el('div', 'sg');
        boardEl = el('div', 'sg-board');
        readEl = el('div', 'sg-readout');
        wrap.appendChild(boardEl);
        wrap.appendChild(readEl);
        host.appendChild(wrap);
        round = 0; seq = []; score = 0; step = 0; playing = false;
        buildBoard();
        setPads(true);
        readEl.textContent = 'press start';
        api.msg('Press start. Two extra pads appear after round 7.');
      },
      start: function () {
        this.stop();
        round = 0; seq = []; score = 0; step = 0;
        playing = true; accepting = false;
        api.setScore(0);
        buildBoard();
        nextRound();
      },
      stop: function () {
        playing = false; accepting = false;
        clearTimers();
        setPads(true);
      }
    };
  }

  /* =========================================================
     SHELL
     ========================================================= */
  var registry = {
    logic: LogicGame(),
    router: RouterGame(),
    resistor: ResistorGame(),
    signal: SignalGame()
  };
  var mounted = {};
  var current = null;
  var currentKey = null;

  function api(key) {
    return {
      setScore: function (v) { if (scoreEl) scoreEl.textContent = String(v); },
      msg: function (text, kind) {
        if (!msgEl) return;
        msgEl.textContent = text;
        msgEl.className = 'game-msg' + (kind ? ' ' + kind : '');
      },
      finish: function (score, text) {
        var bestKey = 'best-' + key;
        var best = parseInt((B.store ? B.store.get(bestKey, '0') : '0'), 10) || 0;
        if (score > best) {
          best = score;
          if (B.store) B.store.set(bestKey, best);
          text += ' New best.';
        }
        if (bestEl) bestEl.textContent = String(best);
        if (msgEl) { msgEl.textContent = text; msgEl.className = 'game-msg'; }
        startEl.textContent = 'Play again';
      }
    };
  }

  function loadBest(key) {
    var best = parseInt((B.store ? B.store.get('best-' + key, '0') : '0'), 10) || 0;
    if (bestEl) bestEl.textContent = String(best);
  }

  function select(key) {
    if (!registry[key]) return;
    if (current && current.stop) current.stop();

    var panels = document.querySelectorAll('.game-panel');
    for (var i = 0; i < panels.length; i++) panels[i].hidden = true;
    var panel = document.getElementById('panel-' + key);
    if (!panel) return;
    panel.hidden = false;

    var buttons = tabsEl.querySelectorAll('button');
    for (var j = 0; j < buttons.length; j++) {
      buttons[j].setAttribute('aria-selected', buttons[j].getAttribute('data-game') === key ? 'true' : 'false');
    }

    current = registry[key];
    currentKey = key;
    if (titleEl) titleEl.textContent = current.title;
    if (ruleEl) ruleEl.textContent = current.rule;
    if (scoreEl) scoreEl.textContent = '0';
    loadBest(key);
    startEl.textContent = 'Start';

    if (!mounted[key]) {
      current.mount(panel, api(key));
      mounted[key] = true;
    } else if (msgEl) {
      msgEl.textContent = 'Press start.';
      msgEl.className = 'game-msg';
    }
  }

  tabsEl.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('button[data-game]') : null;
    if (!btn) return;
    select(btn.getAttribute('data-game'));
  });

  startEl.addEventListener('click', function () {
    if (B.audio) B.audio.unlock();
    if (current && current.start) {
      current.start();
      startEl.textContent = 'Restart';
    }
  });

  if (soundEl) {
    var paintSound = function () {
      var on = B.audio ? B.audio.enabled : false;
      soundEl.textContent = on ? 'Sound on' : 'Sound off';
      soundEl.setAttribute('aria-pressed', on ? 'true' : 'false');
    };
    paintSound();
    soundEl.addEventListener('click', function () {
      if (!B.audio) return;
      B.audio.setEnabled(!B.audio.enabled);
      if (B.audio.enabled) { B.audio.unlock(); B.audio.tone(600, 0.1, 'triangle', 0.06); }
      paintSound();
    });
  }

  // mount the first game only when the arcade is actually reached
  var arcade = document.getElementById('arcade');
  var started = false;
  function boot() {
    if (started) return;
    started = true;
    select('logic');
  }
  if (arcade && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { boot(); io.disconnect(); }
    }, { rootMargin: '200px' });
    io.observe(arcade);
  } else {
    boot();
  }
})();
