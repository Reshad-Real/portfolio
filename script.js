/* ═══════════════════════════════════════════════════════════
   CIRCUIT NEXUS — Portfolio JavaScript
   Three.js 3D Hero · Scroll Animations · Interactions
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  // ── NAVBAR ─────────────────────────────────────────────
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  });
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
  });
  // Close mobile menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });
  // Active section highlighting
  const sections = document.querySelectorAll('section[id]');
  const navItems = navLinks.querySelectorAll('a');
  function highlightNav() {
    const scrollY = window.scrollY + 120;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      if (scrollY >= top && scrollY < top + height) {
        navItems.forEach(a => {
          a.classList.remove('active');
          if (a.getAttribute('href') === '#' + id) {
            a.classList.add('active');
          }
        });
      }
    });
  }
  window.addEventListener('scroll', highlightNav);
  // ── REVEAL ON SCROLL ───────────────────────────────────
  const revealElements = document.querySelectorAll('.reveal');
  function revealOnScroll() {
    const triggerBottom = window.innerHeight * 0.88;
    revealElements.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < triggerBottom) {
        // Stagger delay for siblings
        const delay = el.dataset.delay || 0;
        setTimeout(() => {
          el.classList.add('revealed');
        }, delay);
      }
    });
  }
  // Apply stagger delays to reveal groups
  document.querySelectorAll('.research-grid, .publications-grid, .stats-grid, .courses-grid, .education-grid, .achievements-grid, .skills-container').forEach(grid => {
    grid.querySelectorAll('.reveal').forEach((item, i) => {
      item.dataset.delay = i * 80;
    });
  });
  window.addEventListener('scroll', revealOnScroll);
  revealOnScroll(); // Initial check
  // ── COUNTER ANIMATION ─────────────────────────────────
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');
  let countersStarted = false;
  function animateCounters() {
    if (countersStarted) return;
    const statsSection = document.getElementById('about');
    if (!statsSection) return;
    const rect = statsSection.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.8) {
      countersStarted = true;
      statNumbers.forEach(el => {
        const target = parseFloat(el.dataset.target);
        const isDecimal = el.dataset.decimal === 'true';
        const duration = 1500;
        const startTime = performance.now();
        function update(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = eased * target;
          if (isDecimal) {
            el.textContent = current.toFixed(2);
          } else {
            el.textContent = Math.round(current);
          }
          if (progress < 1) {
            requestAnimationFrame(update);
          } else {
            el.textContent = isDecimal ? target.toFixed(2) : target;
          }
        }
        requestAnimationFrame(update);
      });
    }
  }
  window.addEventListener('scroll', animateCounters);
  // ── GPA CIRCLE ANIMATION ──────────────────────────────
  const gpaCircles = document.querySelectorAll('.gpa-fill');
  let gpaStarted = false;
  function animateGPA() {
    if (gpaStarted) return;
    const eduSection = document.getElementById('education');
    if (!eduSection) return;
    const rect = eduSection.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.8) {
      gpaStarted = true;
      gpaCircles.forEach(circle => {
        const percent = parseFloat(circle.dataset.percent);
        const circumference = 2 * Math.PI * 35; // r=35
        const offset = circumference - (percent / 100) * circumference;
        circle.style.strokeDasharray = circumference;
        circle.style.strokeDashoffset = circumference;
        // Trigger animation after a small delay
        setTimeout(() => {
          circle.style.strokeDashoffset = offset;
        }, 100);
      });
    }
  }
  window.addEventListener('scroll', animateGPA);
  // ── AMBIENT PARTICLES (CSS-based) ─────────────────────
  function createAmbientParticles() {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'ambient-particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 20 + 's';
      particle.style.animationDuration = (15 + Math.random() * 15) + 's';
      document.body.appendChild(particle);
    }
  }
  createAmbientParticles();
  // ── THREE.JS HERO PARTICLE NETWORK ────────────────────
  function initHeroScene() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas || typeof THREE === 'undefined') return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 50;
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    // ── Particle System ──
    const PARTICLE_COUNT = 180;
    const SPREAD = 80;
    const CONNECTION_DISTANCE = 14;
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    const particleVelocities = [];
    const particleSizes = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * SPREAD;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * SPREAD;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      particleVelocities.push({
        x: (Math.random() - 0.5) * 0.02,
        y: (Math.random() - 0.5) * 0.02,
        z: (Math.random() - 0.5) * 0.01
      });
      particleSizes[i] = 1.5 + Math.random() * 2.5;
    }
    // Particle geometry
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
    // Custom shader for glowing particles
    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0x00e5ff) },
        uTime: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        varying float vAlpha;
        uniform float uTime;
        void main() {
          vAlpha = 0.4 + 0.3 * sin(uTime * 0.5 + position.x * 0.1);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (50.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = smoothstep(0.5, 0.1, dist) * vAlpha;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    // ── Connection Lines ──
    const MAX_LINES = PARTICLE_COUNT * 6;
    const linePositions = new Float32Array(MAX_LINES * 6);
    const lineColors = new Float32Array(MAX_LINES * 6);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);
    // ── Circuit Trace Grid (subtle background grid) ──
    const gridHelper = new THREE.GridHelper(120, 30, 0x00e5ff, 0x00e5ff);
    gridHelper.material.opacity = 0.03;
    gridHelper.material.transparent = true;
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = -15;
    scene.add(gridHelper);
    // ── Mouse Interaction ──
    const mouse = { x: 0, y: 0, worldX: 0, worldY: 0 };
    canvas.addEventListener('mousemove', (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouse.worldX = mouse.x * SPREAD * 0.5;
      mouse.worldY = mouse.y * SPREAD * 0.5;
    });
    // ── Resize Handler ──
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onResize);
    // ── Animation Loop ──
    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      particleMaterial.uniforms.uTime.value = time;
      const positions = particleGeometry.attributes.position.array;
      // Update particle positions
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const ix = i * 3;
        const iy = i * 3 + 1;
        const iz = i * 3 + 2;
        positions[ix] += particleVelocities[i].x;
        positions[iy] += particleVelocities[i].y;
        positions[iz] += particleVelocities[i].z;
        // Boundary wrapping
        if (positions[ix] > SPREAD / 2) positions[ix] = -SPREAD / 2;
        if (positions[ix] < -SPREAD / 2) positions[ix] = SPREAD / 2;
        if (positions[iy] > SPREAD / 2) positions[iy] = -SPREAD / 2;
        if (positions[iy] < -SPREAD / 2) positions[iy] = SPREAD / 2;
        if (positions[iz] > 15) positions[iz] = -15;
        if (positions[iz] < -15) positions[iz] = 15;
        // Mouse repulsion
        const dx = positions[ix] - mouse.worldX;
        const dy = positions[iy] - mouse.worldY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 15) {
          const force = (15 - dist) / 15 * 0.08;
          positions[ix] += (dx / dist) * force;
          positions[iy] += (dy / dist) * force;
        }
      }
      particleGeometry.attributes.position.needsUpdate = true;
      // Update connection lines
      let lineIndex = 0;
      const lp = lineGeometry.attributes.position.array;
      const lc = lineGeometry.attributes.color.array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        for (let j = i + 1; j < PARTICLE_COUNT; j++) {
          if (lineIndex >= MAX_LINES) break;
          const ax = positions[i * 3];
          const ay = positions[i * 3 + 1];
          const az = positions[i * 3 + 2];
          const bx = positions[j * 3];
          const by = positions[j * 3 + 1];
          const bz = positions[j * 3 + 2];
          const ddx = ax - bx;
          const ddy = ay - by;
          const ddz = az - bz;
          const d = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);
          if (d < CONNECTION_DISTANCE) {
            const li = lineIndex * 6;
            lp[li] = ax;
            lp[li + 1] = ay;
            lp[li + 2] = az;
            lp[li + 3] = bx;
            lp[li + 4] = by;
            lp[li + 5] = bz;
            const alpha = 1 - d / CONNECTION_DISTANCE;
            // Cyan to amber gradient based on distance
            const r = alpha * 0;
            const g = alpha * 0.9;
            const b = alpha * 1;
            lc[li] = r; lc[li + 1] = g; lc[li + 2] = b;
            lc[li + 3] = r; lc[li + 4] = g; lc[li + 5] = b;
            lineIndex++;
          }
        }
        if (lineIndex >= MAX_LINES) break;
      }
      // Clear unused line segments
      for (let i = lineIndex * 6; i < MAX_LINES * 6; i++) {
        lp[i] = 0;
        lc[i] = 0;
      }
      lineGeometry.attributes.position.needsUpdate = true;
      lineGeometry.attributes.color.needsUpdate = true;
      lineGeometry.setDrawRange(0, lineIndex * 2);
      // Gentle camera sway
      camera.position.x += (mouse.x * 3 - camera.position.x) * 0.02;
      camera.position.y += (mouse.y * 2 - camera.position.y) * 0.02;
      camera.lookAt(scene.position);
      // Subtle grid rotation
      gridHelper.rotation.z = time * 0.02;
      renderer.render(scene, camera);
    }
    animate();
  }
  // ── PUBLICATION CARD TILT EFFECT ───────────────────────
  function initTiltEffect() {
    const cards = document.querySelectorAll('.pub-card, .timeline-card');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -3;
        const rotateY = ((x - centerX) / centerX) * 3;
        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
        // Spotlight gradient follows cursor
        const percentX = (x / rect.width) * 100;
        const percentY = (y / rect.height) * 100;
        card.style.background = `
          radial-gradient(circle at ${percentX}% ${percentY}%, rgba(0, 229, 255, 0.06) 0%, transparent 50%),
          rgba(12, 18, 34, 0.65)
        `;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.background = '';
      });
    });
  }
  // ── SKILL TAG MAGNETIC HOVER ──────────────────────────
  function initSkillHover() {
    document.querySelectorAll('.skill-tag').forEach(tag => {
      tag.addEventListener('mousemove', (e) => {
        const rect = tag.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        tag.style.transform = `translate(${x * 0.15}px, ${y * 0.15 - 2}px)`;
      });
      tag.addEventListener('mouseleave', () => {
        tag.style.transform = '';
      });
    });
  }
  // ── RESEARCH TILE GLOW ────────────────────────────────
  function initResearchGlow() {
    document.querySelectorAll('.research-tile').forEach(tile => {
      tile.addEventListener('mousemove', (e) => {
        const rect = tile.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        tile.style.setProperty('--glow-x', x + '%');
        tile.style.setProperty('--glow-y', y + '%');
      });
    });
  }
  // ── SMOOTH SCROLL ─────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
  // ── CIRCUIT TRACE DRAWING (canvas overlay for sections) ──
  function drawCircuitTraces() {
    const traceCanvas = document.createElement('canvas');
    traceCanvas.id = 'circuit-traces';
    traceCanvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
      opacity: 0.04;
    `;
    document.body.appendChild(traceCanvas);
    const ctx = traceCanvas.getContext('2d');
    let w, h;
    function resize() {
      w = traceCanvas.width = window.innerWidth;
      h = traceCanvas.height = window.innerHeight;
      draw();
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1;
      // Draw horizontal circuit traces
      const spacing = 80;
      for (let y = spacing; y < h; y += spacing) {
        ctx.beginPath();
        let x = 0;
        ctx.moveTo(x, y);
        while (x < w) {
          const segLen = 30 + Math.random() * 60;
          x += segLen;
          ctx.lineTo(x, y);
          // Random right-angle turns
          if (Math.random() > 0.7 && x < w - 40) {
            const turnLen = 15 + Math.random() * 25;
            const dir = Math.random() > 0.5 ? 1 : -1;
            ctx.lineTo(x, y + turnLen * dir);
            ctx.lineTo(x + 20, y + turnLen * dir);
            ctx.lineTo(x + 20, y);
            x += 20;
          }
        }
        ctx.stroke();
        // Draw nodes at random positions
        if (Math.random() > 0.5) {
          const nodeX = spacing + Math.random() * (w - spacing * 2);
          ctx.beginPath();
          ctx.arc(nodeX, y, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#00e5ff';
          ctx.fill();
        }
      }
    }
    resize();
    window.addEventListener('resize', resize);
  }
  // ── TYPED EFFECT FOR HERO GREETING ────────────────────
  function typeEffect(element, text, speed = 50) {
    element.textContent = '';
    let i = 0;
    function type() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      }
    }
    setTimeout(type, 800);
  }
  // ── INIT ──────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initHeroScene();
    initTiltEffect();
    initSkillHover();
    initResearchGlow();
    drawCircuitTraces();
    // Type effect for greeting
    const greeting = document.querySelector('.hero-greeting');
    if (greeting) {
      const text = greeting.textContent;
      typeEffect(greeting, text);
    }
  });
})();