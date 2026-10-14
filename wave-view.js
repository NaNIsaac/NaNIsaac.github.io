// Interactive wave canvas: draws a wave.js simulation and handles pointer input.
// scene geometry is in fractions of the canvas so a resize keeps the composition;
// barrier: null removes the wall, slits may hold 1 or 2 openings.
// wake: true makes a mouse moving over the canvas leave a speed-scaled ripple trail.
function mountWave(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  const off = document.createElement('canvas');
  const octx = off.getContext('2d');
  const { pauseButton, hint, wake, pauseLabel: label = (r) => (r ? 'Pause' : 'Play') } = opts;

  const STEP_MS = 1000 / 120;
  const GAIN = 3;
  const scene = {
    sources: [{ fx: 0.53, fy: 0.4 }, { fx: 0.53, fy: 0.6 }],
    barrier: 0.7, slits: [0.43, 0.57], detector: 0.93,
    slitHalf: 3, // cells; default wavelength is 8 cells
    period: 16, // steps per oscillation
    ...opts.scene,
  };

  let sim, img, det, cell, cssW, cssH, dpr, colors, dropped = false;

  function readColor(name) {
    const v = getComputedStyle(document.body).getPropertyValue(name).trim();
    return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16));
  }
  function recolor() {
    colors = { bg: readColor('--bg'), a: readColor('--accent'), v: readColor('--violet'), light: document.body.classList.contains('light') };
  }

  function applyScene() {
    sim.period = scene.period;
    sim.sources = scene.sources.map((s) => ({ x: s.fx * sim.w, y: s.fy * sim.h }));
    sim.setBarrier(scene.barrier == null ? null : Math.round(scene.barrier * sim.w), scene.slits.map((fy) => ({ y: fy * sim.h, half: scene.slitHalf })));
  }

  function tick() {
    sim.step();
    const x = Math.round(scene.detector * sim.w), f = sim.field;
    // Detector: exponential moving average of u² over ~6 periods (relative intensity only).
    for (let y = 0; y < sim.h; y++) { const u = f[y * sim.w + x]; det[y] += (u * u - det[y]) * 0.01; }
  }

  function build() {
    const r = canvas.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    cssW = r.width; cssH = r.height;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    const w = Math.min(420, Math.round(cssW / 3));
    const h = Math.round((w * cssH) / cssW); // square cells: no anisotropic stretching
    cell = cssW / w;
    sim = createWave(w, h);
    off.width = w; off.height = h;
    img = octx.createImageData(w, h);
    det = new Float32Array(h);
    applyScene();
    if (scene.sources.length) for (let i = 0; i < 600; i++) tick(); // composed frame before the first paint
    if (!scene.sources.length && !dropped) { dropped = true; sim.pulse(0.55 * sim.w, 0.5 * sim.h, 1.5); } // one drop so a still screen reads as live
    draw();
  }

  function draw() {
    const f = sim.field, d = img.data, { bg, a, v, light } = colors;
    for (let i = 0, j = 0; i < f.length; i++, j += 4) {
      let m = f[i] * GAIN;
      m = m / (1 + Math.abs(m));
      const c = m > 0 ? a : v;
      const k = m > 0 ? m : -m * 0.8;
      const hi = !light && m > 0.7 ? (m - 0.7) * 1.6 : 0; // artistic crest highlight, display only
      for (let ch = 0; ch < 3; ch++) {
        const base = bg[ch] + (c[ch] - bg[ch]) * k;
        d[j + ch] = base + (255 - base) * hi;
      }
      d[j + 3] = 255;
    }
    octx.putImageData(img, 0, 0);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, 0, 0, cssW, cssH);
    if (!light) { // bloom
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.4;
      ctx.filter = 'blur(10px)';
      ctx.drawImage(off, 0, 0, cssW, cssH);
      ctx.restore();
    }

    const accent = `rgb(${a})`;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    if (scene.barrier != null) {
      const bx = Math.round(scene.barrier * sim.w) * cell;
      ctx.fillStyle = light ? 'rgba(20,32,51,.55)' : 'rgba(234,247,255,.42)';
      let y0 = 0;
      for (const fy of [...scene.slits].sort((p, q) => p - q)) {
        const top = (fy * sim.h - scene.slitHalf - 0.5) * cell;
        ctx.fillRect(bx, y0, 2 * cell, top - y0);
        y0 = (fy * sim.h + scene.slitHalf + 0.5) * cell;
      }
      ctx.fillRect(bx, y0, 2 * cell, cssH - y0);
      for (const fy of scene.slits) {
        ctx.beginPath();
        ctx.arc(bx + cell, fy * cssH, 7, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    for (const s of scene.sources) {
      const x = s.fx * cssW, y = s.fy * cssH;
      ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = light ? accent : '#fff';
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
    }

    // Detector line + live relative-intensity profile (solver data only)
    const dx = scene.detector * cssW;
    ctx.setLineDash([3, 5]);
    ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.moveTo(dx, 0); ctx.lineTo(dx, cssH); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.9;
    let max = 1e-9;
    for (const e of det) max = Math.max(max, e);
    ctx.beginPath();
    for (let y = 0; y < det.length; y++) {
      const px = dx - (det[y] / max) * Math.min(70, cssW * 0.08), py = (y + 0.5) * cell;
      y ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Animation: fixed solver step, paused offscreen / hidden / by the user.
  let running = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visible = true, raf = 0, last = 0, acc = 0;
  function frame(now) {
    raf = 0;
    if (!running || !visible || document.hidden) return;
    acc += Math.min(now - (last || now), 100); // clamp after tab switches
    last = now;
    while (acc >= STEP_MS) { tick(); acc -= STEP_MS; }
    draw();
    raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && running && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } }
  function pauseLabel() { if (pauseButton) pauseButton.textContent = label(running); }
  pauseButton?.addEventListener('click', () => { running = !running; pauseLabel(); kick(); });
  window.addEventListener('langchange', pauseLabel);
  window.addEventListener('themechange', () => { recolor(); if (sim) draw(); });
  document.addEventListener('visibilitychange', kick);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(canvas);

  // Pointer: click = pulse, drag handle = move it, drag empty space = trail of pulses.
  let press = null;
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  function hitTest(p, touch) {
    const rad = touch ? 26 : 18;
    for (let k = 0; k < scene.sources.length; k++) {
      const s = scene.sources[k];
      if (Math.hypot(p.x - s.fx * cssW, p.y - s.fy * cssH) < rad) return { kind: 'source', k };
    }
    if (scene.barrier == null) return null;
    const bx = (Math.round(scene.barrier * sim.w) + 1) * cell;
    for (let k = 0; k < scene.slits.length; k++) {
      if (Math.hypot(p.x - bx, p.y - scene.slits[k] * cssH) < rad) return { kind: 'slit', k };
    }
    return null;
  }
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  function moveHandle(hit, p) {
    if (hit.kind === 'source') {
      const s = scene.sources[hit.k];
      s.fx = clamp(p.x / cssW, 0.14, (scene.barrier ?? 0.9) - 0.05);
      s.fy = clamp(p.y / cssH, 0.14, 0.86);
      sim.sources = scene.sources.map((q) => ({ x: q.fx * sim.w, y: q.fy * sim.h }));
    } else {
      const other = scene.slits[1 - hit.k];
      const minGap = (2 * scene.slitHalf + 3) / sim.h;
      let fy = clamp(p.y / cssH, 0.12, 0.88);
      if (other != null && Math.abs(fy - other) < minGap) fy = other + (fy < other ? -minGap : minGap);
      scene.slits[hit.k] = clamp(fy, 0.12, 0.88);
      applyScene();
    }
  }
  function engaged() { hint?.classList.add('gone'); }

  // Wake: splats every ~1.5 cells along the segment since the last move, amplitude ∝ speed.
  let prevMove = null;
  function trail(p, t) {
    const q = prevMove;
    prevMove = { x: p.x / cell, y: p.y / cell, t };
    if (!q || t - q.t > 100) return; // pointer just entered or rested
    const d = Math.hypot(prevMove.x - q.x, prevMove.y - q.y);
    const a = Math.min(0.012, (d / Math.max(t - q.t, 1)) * 0.03);
    if (a < 0.001) return;
    const n = Math.ceil(d / 1.5);
    for (let k = 1; k <= n; k++) sim.pulse(q.x + ((prevMove.x - q.x) * k) / n, q.y + ((prevMove.y - q.y) * k) / n, a);
  }
  canvas.addEventListener('pointerleave', () => { prevMove = null; });

  canvas.addEventListener('pointerdown', (e) => {
    if (!sim || e.button > 0) return;
    const p = pos(e), touch = e.pointerType !== 'mouse';
    press = { start: p, hit: hitTest(p, touch), dragging: false, thr: touch ? 10 : 6, lastPulse: 0 };
    canvas.setPointerCapture(e.pointerId);
    if (press.hit) canvas.classList.add('grabbing');
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!sim) return;
    const p = pos(e);
    if (!press) {
      canvas.classList.toggle('grab', !!hitTest(p, false));
      if (wake && e.pointerType === 'mouse') trail(p, e.timeStamp);
      return;
    }
    if (!press.dragging && Math.hypot(p.x - press.start.x, p.y - press.start.y) > press.thr) press.dragging = true;
    if (!press.dragging) return;
    engaged();
    if (press.hit) moveHandle(press.hit, p);
    else if (e.timeStamp - press.lastPulse > 40) { press.lastPulse = e.timeStamp; sim.pulse(p.x / cell, p.y / cell, 1.2); }
    if (!running) draw();
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!press) return;
    if (!press.dragging && !press.hit) { const p = pos(e); sim.pulse(p.x / cell, p.y / cell); engaged(); }
    press = null;
    canvas.classList.remove('grab', 'grabbing');
    if (!running) draw();
  });
  canvas.addEventListener('pointercancel', () => { press = null; canvas.classList.remove('grab', 'grabbing'); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && press) { press = null; canvas.classList.remove('grab', 'grabbing'); } });

  let resizeTimer, lastW = 0, lastH = 0;
  new ResizeObserver(([e]) => {
    const { width, height } = e.contentRect;
    if (Math.abs(width - lastW) < 2 && Math.abs(height - lastH) < 80) return; // ignore mobile URL-bar jitter
    lastW = width; lastH = height;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { build(); kick(); }, sim ? 200 : 0);
  }).observe(canvas);

  recolor();
  pauseLabel();
  // Call after changing scene fields: rebuilds walls/sources and resets the detector average.
  return { scene, apply() { if (!sim) return; applyScene(); det.fill(0); if (!running) draw(); } };
}
