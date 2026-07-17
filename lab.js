/* ═══════════════════════════════════════════════════════════
   THE SILICON LAB — interactive VLSI playground
   Md. Reshad Al Muttaki
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ── REVEAL ─────────────────────────────────────────── */
  var revealEls = $$('.reveal');
  $$('.lab-modules').forEach(function (grid) {
    $$('.reveal', grid).forEach(function (el, i) { el.style.transitionDelay = (i * 60) + 'ms'; });
  });
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('revealed'); });
  }

  /* ── BACK TO TOP ────────────────────────────────────── */
  var toTop = $('#toTop');
  if (toTop) {
    window.addEventListener('scroll', function () {
      toTop.classList.toggle('show', window.scrollY > 500);
    }, { passive: true });
    toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  }

  /* ── HEADER: PLACE & ROUTE CANVAS ───────────────────── */
  (function route() {
    var canvas = $('#lab-canvas');
    var host = $('.lab-hero');
    if (!canvas || !host) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, traces = [], packets = [], pads = [];
    var COLORS = ['#22e0ff', '#22e0ff', '#a06bff', '#ff9d3b'];
    function rand(a, b) { return a + Math.random() * (b - a); }

    function build() {
      var r = host.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      traces = []; packets = []; pads = [];
      var grid = Math.max(46, Math.min(W, H) / 8);
      var count = Math.round(Math.min(26, (W * H) / 34000));
      for (var i = 0; i < count; i++) {
        var sx = Math.round(rand(0, W) / grid) * grid, sy = Math.round(rand(0, H) / grid) * grid;
        var ex = Math.round(rand(0, W) / grid) * grid, ey = Math.round(rand(0, H) / grid) * grid;
        if (Math.abs(sx - ex) + Math.abs(sy - ey) < grid * 2) { ex += grid * 2; ey += grid; }
        var pts = Math.random() < 0.5
          ? [{ x: sx, y: sy }, { x: ex, y: sy }, { x: ex, y: ey }]
          : [{ x: sx, y: sy }, { x: sx, y: ey }, { x: ex, y: ey }];
        var segs = [], total = 0;
        for (var k = 0; k < pts.length - 1; k++) { var d = Math.hypot(pts[k+1].x-pts[k].x, pts[k+1].y-pts[k].y); segs.push(d); total += d; }
        traces.push({ pts: pts, segs: segs, total: total, color: COLORS[(Math.random()*COLORS.length)|0] });
        pads.push(pts[0], pts[pts.length - 1]);
      }
      var pk = Math.round(Math.min(14, count * 0.6));
      for (var p = 0; p < pk; p++) { var tr = traces[(Math.random()*traces.length)|0]; packets.push({ tr: tr, t: Math.random(), speed: rand(0.05, 0.12), color: tr.color }); }
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
      ctx.lineWidth = 1;
      traces.forEach(function (tr) {
        ctx.beginPath(); ctx.moveTo(tr.pts[0].x, tr.pts[0].y);
        for (var k = 1; k < tr.pts.length; k++) ctx.lineTo(tr.pts[k].x, tr.pts[k].y);
        ctx.strokeStyle = tr.color; ctx.globalAlpha = 0.12; ctx.stroke();
      });
      ctx.globalAlpha = 0.5;
      pads.forEach(function (pd) { ctx.fillStyle = '#22e0ff'; ctx.fillRect(pd.x - 2, pd.y - 2, 4, 4); });
      ctx.globalCompositeOperation = 'lighter';
      packets.forEach(function (pkt) {
        if (!reduce) { pkt.t += pkt.speed * dt; if (pkt.t > 1) { pkt.t = 0; pkt.tr = traces[(Math.random()*traces.length)|0]; pkt.color = pkt.tr.color; } }
        var pos = pointAt(pkt.tr, pkt.t);
        var TAIL = 0.08, STEPS = 9, t0 = Math.max(0, pkt.t - TAIL);
        ctx.lineWidth = 2; ctx.lineCap = 'round';
        for (var s = 0; s < STEPS; s++) {
          var pa = pointAt(pkt.tr, t0 + (pkt.t - t0) * (s / STEPS));
          var pb = pointAt(pkt.tr, t0 + (pkt.t - t0) * ((s + 1) / STEPS));
          ctx.strokeStyle = pkt.color; ctx.globalAlpha = 0.10 + 0.62 * (s / STEPS);
          ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
        }
        ctx.globalAlpha = 1; ctx.fillStyle = pkt.color; ctx.shadowColor = pkt.color; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(pos.x, pos.y, 2.4, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      });
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }
    var last = 0;
    function loop(t) { var dt = last ? Math.min((t - last) / 1000, 0.05) : 0.016; last = t; draw(dt); requestAnimationFrame(loop); }
    var rz; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(build, 200); });
    build();
    if (reduce) draw(0); else requestAnimationFrame(loop);
  })();

  /* ── 1 · FinFET ─────────────────────────────────────── */
  (function finfet() {
    var svg = $('#finfetSvg'); if (!svg) return;
    var sw = $('#ffSwitch'), stateEl = $('#ffState'), valEl = $('#ffCurrentVal');
    var slider = $('#ffVgs'), vgsEl = $('#ffVgsVal');
    var electrons = $$('.ff-electron', svg);
    var VTH = 0.30, phase = 0, on = false, speed = 0;

    function apply() {
      var vgs = parseInt(slider.value, 10) / 100;
      if (vgsEl) vgsEl.textContent = vgs.toFixed(2) + ' V';
      on = vgs > VTH;
      var over = Math.max(0, vgs - VTH);
      var ids = 260 * over * over; // square-law-ish, µA
      speed = 0.002 + over * 0.010;
      svg.classList.toggle('on', on);
      if (sw) sw.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (stateEl) stateEl.textContent = on ? 'ON' : 'OFF';
      if (valEl) valEl.textContent = on ? (ids < 10 ? ids.toFixed(1) : Math.round(ids)) + ' µA' : '0.0 µA';
    }
    slider.addEventListener('input', apply);
    if (sw) sw.addEventListener('click', function () { slider.value = on ? 0 : 95; apply(); });
    function loop() {
      if (on && !reduce) phase = (phase + speed) % 1;
      electrons.forEach(function (e, i) {
        var t = (phase + i / electrons.length) % 1;
        e.setAttribute('cx', (70 + t * 198).toFixed(1));
        e.setAttribute('cy', (127 + Math.sin(t * Math.PI * 4) * 1.5).toFixed(1));
      });
      requestAnimationFrame(loop);
    }
    apply(); loop();
  })();

  /* ── 2 · CMOS inverter ──────────────────────────────── */
  (function inverter() {
    var btn = $('#invA'); if (!btn) return;
    var pmos = $('#invPmos'), nmos = $('#invNmos');
    var pull = $('#invPullup'), pdown = $('#invPulldown');
    var led = $('#invLed'), outEl = $('#invOut'), aState = $('#invAState');
    var a = 0;
    function render() {
      var y = a ? 0 : 1;
      if (aState) aState.textContent = a;
      if (outEl) outEl.textContent = y;
      btn.setAttribute('aria-pressed', a ? 'true' : 'false');
      if (led) led.classList.toggle('on', y === 1);
      // A=0 -> PMOS conducts, pull-up active ; A=1 -> NMOS conducts, pull-down active
      if (pmos) { pmos.classList.toggle('on', a === 0); pmos.classList.toggle('off', a === 1); }
      if (nmos) { nmos.classList.toggle('on', a === 1); nmos.classList.toggle('off', a === 0); }
      if (pull) pull.classList.toggle('on', a === 0);
      if (pdown) pdown.classList.toggle('on', a === 1);
    }
    btn.addEventListener('click', function () { a = a ? 0 : 1; render(); });
    render();
  })();

  /* ── 3 · Logic gate bench ───────────────────────────── */
  (function logic() {
    var bitA = $('#bitA'), bitB = $('#bitB'); if (!bitA || !bitB) return;
    var glyph = $('#gateGlyph'), led = $('#logicLed'), outEl = $('#logicOut'), wire = $('#gateWire');
    var tbody = $('#truthTable tbody'), select = $('#gateSelect'), gate = 'AND';
    var fns = {
      AND: function (a,b){return a&b;}, OR: function(a,b){return a|b;}, XOR: function(a,b){return a^b;},
      NAND: function(a,b){return (a&b)?0:1;}, NOR: function(a,b){return (a|b)?0:1;}, XNOR: function(a,b){return (a^b)?0:1;}
    };
    var rows = [[0,0],[0,1],[1,0],[1,1]];
    function getBit(el){ return parseInt(el.dataset.bit,10); }
    function buildTable(){
      tbody.innerHTML='';
      rows.forEach(function(r){
        var y=fns[gate](r[0],r[1]);
        var tr=document.createElement('tr'); tr.dataset.key=r[0]+''+r[1];
        tr.innerHTML='<td>'+r[0]+'</td><td>'+r[1]+'</td><td>'+y+'</td>';
        tbody.appendChild(tr);
      });
    }
    function update(){
      var a=getBit(bitA), b=getBit(bitB), y=fns[gate](a,b);
      if(outEl) outEl.textContent=y;
      if(led) led.classList.toggle('on', y===1);
      if(wire) wire.style.background = y===1 ? 'linear-gradient(90deg, var(--green), var(--cyan))' : '';
      var key=a+''+b;
      $$('tr',tbody).forEach(function(tr){ tr.classList.toggle('active-row', tr.dataset.key===key); });
    }
    function toggle(el){ var v=getBit(el)?0:1; el.dataset.bit=v; el.classList.toggle('hot',v===1); $('.bit-val',el).textContent=v; update(); }
    bitA.addEventListener('click',function(){toggle(bitA);});
    bitB.addEventListener('click',function(){toggle(bitB);});
    if(select) select.addEventListener('click',function(e){
      var btn=e.target.closest('.chip-btn'); if(!btn) return;
      gate=btn.dataset.gate;
      $$('.chip-btn',select).forEach(function(b){ b.classList.toggle('active', b===btn); });
      if(glyph) glyph.textContent=gate; buildTable(); update();
    });
    buildTable(); update();
  })();

  /* ── 4 · 7-segment decoder ──────────────────────────── */
  (function sevenSeg() {
    var host = $('#segBits'); if (!host) return;
    var bits = $$('.tbit', host);
    var hexEl = $('#segHex'), decEl = $('#segDec'), binEl = $('#segBin');
    // segment map a b c d e f g for 0..F
    var MAP = {
      0:'abcdef',1:'bc',2:'abdeg',3:'abcdg',4:'bcfg',5:'acdfg',6:'acdefg',7:'abc',
      8:'abcdefg',9:'abcdfg',10:'abcefg',11:'cdefg',12:'adef',13:'bcdeg',14:'adefg',15:'aefg'
    };
    var HEX = '0123456789ABCDEF';
    function render() {
      var v = 0, bin = '';
      bits.forEach(function (b) { var on = parseInt(b.dataset.bit,10); v += on * parseInt(b.dataset.w,10); bin += on; });
      var lit = MAP[v] || '';
      'abcdefg'.split('').forEach(function (s) { var el = $('#seg-' + s); if (el) el.classList.toggle('on', lit.indexOf(s) > -1); });
      if (hexEl) hexEl.textContent = HEX[v];
      if (decEl) decEl.textContent = 'DEC ' + v;
      if (binEl) binEl.textContent = bin;
    }
    bits.forEach(function (b) {
      b.addEventListener('click', function () {
        var v = parseInt(b.dataset.bit,10) ? 0 : 1; b.dataset.bit = v;
        b.classList.toggle('on', v === 1); $('b', b).textContent = v; render();
      });
    });
    render();
  })();

  /* ── 5 · Ripple-carry adder ─────────────────────────── */
  (function adder() {
    var aHost = $('#adderA'), bHost = $('#adderB'), cHost = $('#adderCin'), faRow = $('#faRow'), eq = $('#adderEq');
    if (!aHost || !bHost || !faRow) return;

    function makeBits(host, prefix, n) {
      for (var i = n - 1; i >= 0; i--) {
        var b = document.createElement('button');
        b.className = 'tbit'; b.dataset.bit = '0'; b.dataset.w = Math.pow(2, i);
        b.innerHTML = '<b>0</b><small>' + prefix + i + '</small>';
        host.appendChild(b);
      }
    }
    makeBits(aHost, 'A', 4); makeBits(bHost, 'B', 4);
    var cb = document.createElement('button');
    cb.className = 'tbit'; cb.dataset.bit = '0'; cb.innerHTML = '<b>0</b><small>C0</small>';
    cHost.appendChild(cb);

    // build FA cells FA3..FA0
    var faCells = [];
    for (var i = 3; i >= 0; i--) {
      var fa = document.createElement('div');
      fa.className = 'fa';
      fa.innerHTML = '<small>FA' + i + '</small><b>0</b><small class="cout">c→0</small>';
      faRow.appendChild(fa);
      faCells[i] = fa;
    }

    function bitsVal(host) {
      var v = 0; $$('.tbit', host).forEach(function (b) { v += parseInt(b.dataset.bit,10) * parseInt(b.dataset.w,10); }); return v;
    }
    function render() {
      var A = bitsVal(aHost), B = bitsVal(bHost), Cin = parseInt(cb.dataset.bit,10);
      var carry = Cin, sum = 0;
      for (var i = 0; i < 4; i++) {
        var a = (A >> i) & 1, b = (B >> i) & 1;
        var s = a ^ b ^ carry;
        var cout = (a & b) | (b & carry) | (a & carry);
        sum |= s << i;
        var fa = faCells[i];
        $('b', fa).textContent = s;
        $('.cout', fa).textContent = 'c→' + cout;
        fa.classList.toggle('hot-carry', cout === 1);
        fa.classList.toggle('carry-in', true);
        carry = cout;
      }
      var total = A + B + Cin;
      if (eq) eq.innerHTML = A + ' + ' + B + (Cin ? ' + 1' : '') + ' = <b>' + total + '</b> <span style="color:var(--text-mute)">(0b' + total.toString(2) + ')</span>';
    }
    faRow.parentNode.addEventListener('click', function (e) {
      var b = e.target.closest('.tbit'); if (!b) return;
      var v = parseInt(b.dataset.bit,10) ? 0 : 1; b.dataset.bit = v;
      b.classList.toggle('on', v === 1); $('b', b).textContent = v; render();
    });
    render();
  })();

  /* ── 6 · 8-bit register ─────────────────────────────── */
  (function register() {
    var host = $('#regBits'); if (!host) return;
    var decEl = $('#regDec'), hexEl = $('#regHex'), binEl = $('#regBin');
    for (var i = 7; i >= 0; i--) {
      var b = document.createElement('button');
      b.className = 'tbit'; b.dataset.bit = '0'; b.dataset.w = Math.pow(2, i);
      b.innerHTML = '<b>0</b><small>' + Math.pow(2, i) + '</small>';
      host.appendChild(b);
    }
    function render() {
      var v = 0, bin = '';
      $$('.tbit', host).forEach(function (b) { var on = parseInt(b.dataset.bit,10); v += on * parseInt(b.dataset.w,10); bin += on; });
      if (decEl) decEl.textContent = v;
      if (hexEl) hexEl.textContent = '0x' + ('0' + v.toString(16).toUpperCase()).slice(-2);
      if (binEl) binEl.textContent = bin;
    }
    host.addEventListener('click', function (e) {
      var b = e.target.closest('.tbit'); if (!b) return;
      var v = parseInt(b.dataset.bit,10) ? 0 : 1; b.dataset.bit = v;
      b.classList.toggle('on', v === 1); $('b', b).textContent = v; render();
    });
    render();
  })();

  /* ── 7 · System clock ───────────────────────────────── */
  (function clock() {
    var slider = $('#clkSlider'); if (!slider) return;
    var freqEl = $('#clkFreq'), perEl = $('#clkPeriod'), flow = $('.scope-flow');
    function update() {
      var f = parseInt(slider.value, 10) / 10;
      if (freqEl) freqEl.textContent = f.toFixed(2) + ' GHz';
      if (perEl) perEl.textContent = Math.round(1000 / f) + ' ps';
      if (flow && !reduce) flow.style.animationDuration = Math.max(0.5, 3.2 / f * 2.6).toFixed(2) + 's';
    }
    slider.addEventListener('input', update); update();
  })();

  /* ── 8 · MOSFET I–V characteristics ─────────────────── */
  (function ivCurve() {
    var canvas = $('#ivCanvas'); if (!canvas) return;
    var ctx = canvas.getContext('2d'); if (!ctx) return;
    var slider = $('#ivVgs'), vgsEl = $('#ivVgsVal'), regionEl = $('#ivRegion');
    var VTH = 0.30, K = 900, VDSMAX = 1.4, IMAX = 900; // µA scale
    var dpr = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0;
    var PAD = { l: 46, r: 14, t: 14, b: 34 };

    function size() {
      W = canvas.clientWidth || canvas.parentNode.clientWidth || 360;
      H = Math.round(W * 0.62);
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function x(vds) { return PAD.l + (vds / VDSMAX) * (W - PAD.l - PAD.r); }
    function y(id) { return H - PAD.b - (id / IMAX) * (H - PAD.t - PAD.b); }
    function idOf(vgs, vds) {
      var ov = vgs - VTH; if (ov <= 0) return 0;
      var vsat = ov;
      if (vds < vsat) return K * (ov * vds - vds * vds / 2);
      return K * ov * ov / 2;
    }
    function grid() {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(120,160,220,0.12)'; ctx.lineWidth = 1;
      ctx.fillStyle = '#6b7c9c'; ctx.font = '10px "JetBrains Mono", monospace';
      var i;
      for (i = 0; i <= 7; i++) { var gx = PAD.l + i / 7 * (W - PAD.l - PAD.r); ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(gx, PAD.t); ctx.lineTo(gx, H - PAD.b); ctx.stroke(); }
      for (i = 0; i <= 4; i++) { var gy = PAD.t + i / 4 * (H - PAD.t - PAD.b); ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(PAD.l, gy); ctx.lineTo(W - PAD.r, gy); ctx.stroke(); }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(120,170,230,0.35)';
      ctx.beginPath(); ctx.moveTo(PAD.l, PAD.t); ctx.lineTo(PAD.l, H - PAD.b); ctx.lineTo(W - PAD.r, H - PAD.b); ctx.stroke();
      ctx.fillText('I_D (µA)', 6, PAD.t + 8);
      ctx.fillText('V_DS (V)', W - PAD.r - 52, H - 8);
    }
    function curve(vgs, active) {
      ctx.beginPath();
      for (var vds = 0; vds <= VDSMAX + 0.001; vds += 0.02) {
        var xd = x(vds), yd = y(Math.min(idOf(vgs, vds), IMAX));
        if (vds === 0) ctx.moveTo(xd, yd); else ctx.lineTo(xd, yd);
      }
      if (active) { ctx.strokeStyle = '#22e0ff'; ctx.lineWidth = 2.6; ctx.shadowColor = '#22e0ff'; ctx.shadowBlur = 8; }
      else { ctx.strokeStyle = 'rgba(160,107,255,0.4)'; ctx.lineWidth = 1.4; ctx.shadowBlur = 0; }
      ctx.stroke(); ctx.shadowBlur = 0;
      // saturation knee marker on active curve
      if (active) {
        var vsat = vgs - VTH;
        if (vsat > 0 && vsat < VDSMAX) {
          ctx.fillStyle = '#ff9d3b';
          ctx.beginPath(); ctx.arc(x(vsat), y(idOf(vgs, vsat)), 3.5, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    function render() {
      var vgs = parseInt(slider.value, 10) / 100;
      if (vgsEl) vgsEl.textContent = vgs.toFixed(2) + ' V';
      if (regionEl) regionEl.textContent = (vgs > VTH ? 'sat @ ' + (vgs - VTH).toFixed(2) + ' V' : 'cut-off');
      grid();
      [0.5, 0.7, 0.9, 1.1, 1.2].forEach(function (v) { curve(v, false); });
      curve(vgs, true);
    }
    var rz; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { size(); render(); }, 200); });
    slider.addEventListener('input', render);
    size(); render();
  })();

})();
