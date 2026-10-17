// Interactive wave canvas: draws a wave.js simulation and handles pointer input.
// scene geometry is in fractions of the canvas so a resize keeps the composition;
// barrier: null removes the wall, slits may hold 1 or 2 openings.
// wake: true makes a mouse moving over the canvas leave a speed-scaled ripple trail.
// tools: true is the optical-table mode (lab): double-click pins/removes a source, the barrier and the
// slit edges drag, a finite hexagonal lattice moves and rotates, and the detector shows I(y, t) and <I(y)>.
// fixed: true draws the slit as a plain plate and makes nothing draggable; taps and moves only ripple.
// Until the first touch a ghost hand alternates a tap and a swipe left of the slits, so people see what each does.
// onChange(scene) fires after a drag changes the scene.
function mountWave(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  const off = document.createElement('canvas');
  const film = document.createElement('canvas');
  const fctx = film.getContext('2d');
  const octx = off.getContext('2d');
  const { pauseButton, hint, wake, tools, fixed, onChange, pauseLabel: label = (r) => (r ? 'Pause' : 'Play') } = opts;
  // Affordance: brass arrows on what can be dragged until the first drag, and one slow nudge of the slits after load.
  let cued = !fixed, nudge = null;
  let ghost = fixed ? { t0: performance.now() + 1500, n: -1 } : null;

  // speed scales solver steps per second, gain the display contrast; a calm preview uses less of both.
  const STEP_MS = 1000 / (120 * (opts.speed ?? 1));
  const GAIN = 3 * (opts.gain ?? 1);
  const scene = {
    sources: [{ fx: 0.53, fy: 0.4 }, { fx: 0.53, fy: 0.6 }],
    barrier: 0.7, slits: [0.43, 0.57], detector: 0.93,
    slitHalf: 3, // cells; default wavelength is 12 cells
    period: 24, // steps per oscillation; wavelength = 0.5 * period = 12 cells
    lattice: null, // { fx, fy, theta, d (cells), n (rings) }: hard point scatterers on a hexagonal lattice
    absorb: true, // jaws absorb like real slit blades; false makes them ideal reflectors
    ...opts.scene,
  };

  let sim, img, det, inst, expo, grain, filmImg, cell, cssW, cssH, dpr, colors, hover = null, pop = null, press = null;

  function readColor(name) {
    const v = getComputedStyle(document.body).getPropertyValue(name).trim();
    return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16));
  }
  function recolor() {
    // Film look: crests develop toward the ink, troughs toward --wave-neg, on the panel's --surface.
    colors = { bg: readColor('--surface'), a: readColor('--ink'), v: readColor('--wave-neg'), brass: readColor('--accent') };
  }

  // Hexagonal lattice: a1 = d·(cos θ, sin θ), a2 = a1 rotated 60°; atoms with hex distance ≤ n. Cells.
  function latticeAtoms(L) {
    const cx = L.fx * sim.w, cy = L.fy * sim.h, c = Math.cos(L.theta), s = Math.sin(L.theta), out = [];
    for (let i = -L.n; i <= L.n; i++) {
      for (let j = -L.n; j <= L.n; j++) {
        if (Math.max(Math.abs(i), Math.abs(j), Math.abs(i + j)) > L.n) continue;
        const px = (i + j / 2) * L.d, py = (j * Math.sqrt(3) / 2) * L.d;
        out.push({ x: cx + px * c - py * s, y: cy + px * s + py * c });
      }
    }
    return out;
  }
  const shellR = (L) => (L.n + 0.6) * L.d; // cells

  function applyScene() {
    sim.period = scene.period;
    sim.setPoints(scene.lattice ? latticeAtoms(scene.lattice) : []);
    sim.sources = scene.sources.map((s) => ({ x: s.fx * sim.w, y: s.fy * sim.h, a: s.a }));
    sim.setBarrier(scene.barrier == null ? null : Math.round(scene.barrier * sim.w), scene.slits.map((fy) => ({ y: fy * sim.h, half: scene.slitHalf })), scene.absorb);
  }

  function tick() {
    sim.step();
    const x = Math.round(scene.detector * sim.w), f = sim.field;
    // Detector: exponential moving average of u² over ~6 periods (relative intensity only).
    for (let y = 0; y < sim.h; y++) { const u = f[y * sim.w + x]; inst[y] = u * u; det[y] += (inst[y] - det[y]) * 0.01; expo[y] += inst[y]; }
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
    inst = new Float32Array(h);
    expo = new Float32Array(h);
    grain = Float32Array.from({ length: h * FILM_COLS }, Math.random);
    film.width = FILM_COLS; film.height = h;
    filmImg = fctx.createImageData(FILM_COLS, h);
    applyScene();
    if (scene.sources.length) for (let i = 0; i < 600; i++) tick(); // composed frame before the first paint
    if (cued && !nudge && scene.barrier != null && scene.slits.length && running && !build.done) nudge = { t0: performance.now() + 1400, base: [...scene.slits] };
    build.done = true;
    draw();
  }

  function draw() {
    const f = sim.field, d = img.data, { bg, a, v } = colors;
    for (let i = 0, j = 0; i < f.length; i++, j += 4) {
      let m = f[i] * GAIN;
      m = m / (1 + Math.abs(m));
      const c = m > 0 ? a : v;
      const k = m > 0 ? m : -m;
      for (let ch = 0; ch < 3; ch++) d[j + ch] = bg[ch] + (c[ch] - bg[ch]) * k;
      d[j + 3] = 255;
    }
    octx.putImageData(img, 0, 0);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high'; // the field is ~3x upscaled: smooth interpolation, not visible cells
    ctx.filter = `blur(${(cell * 0.6).toFixed(1)}px)`; // and a soft focus so no cell edge survives on large screens
    ctx.drawImage(off, -cell, -cell, cssW + 2 * cell, cssH + 2 * cell); // drawn a cell oversize so the blur has no pale rim
    ctx.filter = 'none';
    const ink = `rgb(${a})`;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.5;
    if (scene.barrier != null) drawBench(ink);

    if (scene.lattice) drawLattice(f, ink);
    if (pop) { // a pinned source swells once
      const age = (performance.now() - pop.t) / 350;
      if (age < 1) { ctx.globalAlpha = 1 - age; ctx.beginPath(); ctx.arc(pop.x, pop.y, 11 + 14 * age, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; } else pop = null;
    }

    if (ghost) drawGhost(ink);

    for (const s of scene.sources) {
      const x = s.fx * cssW, y = s.fy * cssH;
      if (fixed) { ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); continue; }
      ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = ink;
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
    }

    drawFilm(ink);
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1.5;
  }

  // The slit as bench hardware: a plate with knife-edged jaws on a mount that rides a rail.
  // The jaws are bevelled on the downstream face; the plate stops at the mount; brass marks what a hand holds.
  const RAIL_H = 12, MOUNT = 14, BEVEL = 8, RAIL = fixed ? 0 : RAIL_H;
  // Fixed mode: one flat plate, full height, with two clean openings. No rail, mount or cues.
  function drawPlate(ink) {
    const bx = Math.round(scene.barrier * sim.w) * cell, W = Math.max(3, 2 * cell);
    const edges = [...scene.slits].sort((p, q) => p - q).map((fy) => [(fy * sim.h - scene.slitHalf - 0.5) * cell, (fy * sim.h + scene.slitHalf + 0.5) * cell]);
    ctx.fillStyle = ink;
    ctx.globalAlpha = 0.9;
    let y0 = 0;
    for (const [t, b] of edges) { if (t > y0) ctx.fillRect(bx, y0, W, t - y0); y0 = b; }
    if (cssH > y0) ctx.fillRect(bx, y0, W, cssH - y0);
    ctx.globalAlpha = 1;
  }
  function drawBench(ink) {
    if (fixed) return drawPlate(ink);
    const brass = `rgb(${colors.brass})`, W = 2 * cell, bx = Math.round(scene.barrier * sim.w) * cell, mid = bx + W / 2;
    const railY = cssH - RAIL, plateEnd = railY - MOUNT;
    const held = (kind) => (press?.hit?.kind === kind && press.hit) || (hover?.kind === kind && hover);
    // rail with a scale: a tick every 10px, a longer one every 50px
    ctx.fillStyle = ink;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(0, railY, cssW, 2);
    ctx.globalAlpha = 0.35;
    for (let x = 0; x < cssW; x += 10) ctx.fillRect(x, railY + 2, 1, x % 50 ? 3 : 6);
    ctx.globalAlpha = 1;
    // plate segments between the openings, each a polygon whose ends taper to a knife edge at a gap
    const edges = [...scene.slits].sort((p, q) => p - q).map((fy) => [(fy * sim.h - scene.slitHalf - 0.5) * cell, (fy * sim.h + scene.slitHalf + 0.5) * cell]);
    let y0 = 0, gapAbove = false;
    for (let k = 0; k <= edges.length; k++) {
      const y1 = k < edges.length ? edges[k][0] : plateEnd, gapBelow = k < edges.length;
      if (y1 > y0) {
        const b0 = gapAbove ? Math.min(BEVEL, (y1 - y0) / 2) : 0, b1 = gapBelow ? Math.min(BEVEL, (y1 - y0) / 2) : 0;
        ctx.beginPath();
        ctx.moveTo(bx, y0); ctx.lineTo(bx + (b0 ? 1.5 : W), y0); ctx.lineTo(bx + W, y0 + b0);
        ctx.lineTo(bx + W, y1 - b1); ctx.lineTo(bx + (b1 ? 1.5 : W), y1); ctx.lineTo(bx, y1);
        ctx.closePath(); ctx.fill();
      }
      if (k < edges.length) { y0 = edges[k][1]; gapAbove = true; }
    }
    // a held or hovered opening shows brass on its upstream face; a held jaw shows brass at its tip
    const slitHit = held('slit'), gapHit = held('gap');
    ctx.fillStyle = brass;
    if (slitHit) { const fy = scene.slits[slitHit.k]; const [t, b] = [(fy * sim.h - scene.slitHalf - 0.5) * cell, (fy * sim.h + scene.slitHalf + 0.5) * cell]; ctx.fillRect(bx - 4, t, 2, b - t); }
    if (gapHit) { const fy = scene.slits[gapHit.k]; for (const sgn of [-1, 1]) ctx.fillRect(bx - 4, (fy * sim.h + sgn * (scene.slitHalf + 0.5)) * cell - 1 + sgn * 3, W + 4, 2); }
    // mount: a block on the rail, a brass knob on its side
    const mountHit = held('barrier');
    ctx.fillStyle = ink;
    ctx.fillRect(mid - 22, plateEnd, 44, MOUNT);
    ctx.fillStyle = brass;
    ctx.beginPath(); ctx.arc(mid + 29, plateEnd + MOUNT / 2, mountHit ? 7 : 6, 0, Math.PI * 2); ctx.fill();
    if (press?.dragging && gapHit) {
      ctx.fillStyle = ink;
      ctx.font = '13px Archivo, sans-serif';
      ctx.fillText(`g = ${2 * scene.slitHalf + 1}`, bx + W + 10, scene.slits[gapHit.k] * cssH + 4);
    }
    if (cued) { // ↕ beside each opening, ‹ › around the mount
      ctx.strokeStyle = brass; ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (const fy of scene.slits) {
        const x = bx - 14, y = fy * cssH;
        ctx.beginPath();
        ctx.moveTo(x, y - 9); ctx.lineTo(x, y + 9);
        ctx.moveTo(x - 4, y - 5); ctx.lineTo(x, y - 9); ctx.lineTo(x + 4, y - 5);
        ctx.moveTo(x - 4, y + 5); ctx.lineTo(x, y + 9); ctx.lineTo(x + 4, y + 5);
        ctx.stroke();
      }
      const my = plateEnd + MOUNT / 2;
      ctx.beginPath();
      ctx.moveTo(mid - 28, my - 5); ctx.lineTo(mid - 33, my); ctx.lineTo(mid - 28, my + 5);
      ctx.moveTo(mid + 40, my - 5); ctx.lineTo(mid + 45, my); ctx.lineTo(mid + 40, my + 5);
      ctx.stroke();
      ctx.lineCap = 'butt'; ctx.strokeStyle = ink; ctx.lineWidth = 1.5;
    }
  }

  // Detector: a film strip that integrates what arrives (exposure = Σ u² per row), grain fixed per build.
  // Click it to load fresh film. The running average <I(y)> sits beside it; tools mode adds I(y, t).
  const FILM_W = 20, FILM_COLS = 6;
  function drawFilm(ink) {
    const dx = scene.detector * cssW, x0 = Math.round(dx - FILM_W / 2), { a, v } = colors;
    let emax = 1e-9;
    for (const e of expo) emax = Math.max(emax, e);
    const d = filmImg.data;
    for (let y = 0; y < sim.h; y++) {
      const dk = (expo[y] / emax) ** 0.6;
      for (let c = 0; c < FILM_COLS; c++) {
        const t = Math.min(1, dk * (0.8 + 0.4 * grain[y * FILM_COLS + c])), j = (y * FILM_COLS + c) * 4;
        for (let ch = 0; ch < 3; ch++) d[j + ch] = v[ch] + (a[ch] - v[ch]) * t;
        d[j + 3] = 255;
      }
    }
    fctx.putImageData(filmImg, 0, 0);
    ctx.filter = `blur(${(cell * 0.35).toFixed(1)}px)`; // grain stays, blocks go
    ctx.drawImage(film, x0, 0, FILM_W, cssH - RAIL);
    ctx.filter = 'none';
    let max = 1e-9, imax = 1e-9;
    for (const e of det) max = Math.max(max, e);
    for (const e of inst) imax = Math.max(imax, e);
    const base = x0 - 4, span = Math.min(70, cssW * 0.08);
    const curve = (arr, m) => { ctx.beginPath(); for (let y = 0; y < arr.length; y++) { const px = base - (arr[y] / m) * span, py = (y + 0.5) * cell; y ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } };
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, cssW, cssH - RAIL); ctx.clip(); // curves stop at the rail
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1;
    if (tools) { ctx.globalAlpha = 0.45; curve(inst, imax); ctx.stroke(); } // I(y, t): what arrives this instant, own scale
    ctx.lineWidth = tools ? 2.2 : 1.5;
    ctx.globalAlpha = 0.9; curve(det, max); ctx.stroke(); // <I(y)>: running average
    ctx.restore();
  }

  // Atoms brighten with the local wave amplitude (sampled beside the hard cell, which is always 0).
  function drawLattice(f, ink) {
    const L = scene.lattice, cx = L.fx * cssW, cy = L.fy * cssH, R = shellR(L) * cell;
    const active = (hover && hover.kind in LATTICE) || (press && press.hit && press.hit.kind in LATTICE);
    ctx.fillStyle = ink;
    for (const a of latticeAtoms(L)) {
      const i = Math.round(a.y) * sim.w + Math.round(a.x) + 1;
      const u = Math.abs(f[i] || 0) * GAIN;
      ctx.globalAlpha = Math.min(1, 0.3 + u);
      ctx.beginPath(); ctx.arc(a.x * cell, a.y * cell, 1.6 + Math.min(1.4, u), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = active ? 0.8 : 0.3;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let k = 0; k <= 6; k++) {
      const t = L.theta + (k * Math.PI) / 3, x = cx + R * Math.cos(t), y = cy + R * Math.sin(t);
      k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    const hx = cx + R * Math.cos(L.theta), hy = cy + R * Math.sin(L.theta);
    ctx.beginPath(); ctx.arc(hx, hy, 6, 0, Math.PI * 2); ctx.stroke(); // rotate handle on the a1 vertex
    ctx.beginPath(); ctx.moveTo(cx - 5, cy); ctx.lineTo(cx + 5, cy); ctx.moveTo(cx, cy - 5); ctx.lineTo(cx, cy + 5); ctx.stroke();
    if (active) {
      ctx.globalAlpha = 0.9;
      ctx.font = '13px Archivo, sans-serif';
      const deg = ((Math.round((L.theta * 180) / Math.PI) % 60) + 90) % 60 - 30; // hexagonal: 60° periodic
      ctx.fillText(`θ = ${deg}°`, cx - 18, cy - R - 10);
    }
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1.5;
  }

  // Animation: fixed solver step, paused offscreen / hidden / by the user.
  let running = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visible = true, raf = 0, last = 0, acc = 0;
  function frame(now) {
    raf = 0;
    if (!sim || !running || !visible || document.hidden) return; // build() runs on the first resize and kicks again
    acc += Math.min(now - (last || now), 100); // clamp after tab switches
    last = now;
    while (acc >= STEP_MS) { tick(); acc -= STEP_MS; }
    if (nudge) { // slits glide up and back once, damped: shows they move before anyone has to guess
      const p = (now - nudge.t0) / 1600;
      if (p >= 1 || press) { scene.slits = nudge.base; nudge = null; applyScene(); }
      else if (p > 0) { const off = 0.05 * Math.sin(2 * Math.PI * p) * (1 - p); scene.slits = nudge.base.map((f) => f - off); applyScene(); }
    }
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
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const LATTICE = { lattice: 1, rotate: 1 };
  function hitTest(p, touch) {
    if (fixed) return Math.abs(p.x - scene.detector * cssW) < FILM_W / 2 + 4 ? { kind: 'film' } : null;
    const rad = touch ? 26 : 18;
    for (let k = 0; k < scene.sources.length; k++) {
      const s = scene.sources[k];
      if (Math.hypot(p.x - s.fx * cssW, p.y - s.fy * cssH) < rad) return { kind: 'source', k };
    }
    const L = scene.lattice;
    if (tools && L) {
      const cx = L.fx * cssW, cy = L.fy * cssH, R = shellR(L) * cell, r = Math.hypot(p.x - cx, p.y - cy);
      if (Math.hypot(p.x - cx - R * Math.cos(L.theta), p.y - cy - R * Math.sin(L.theta)) < rad || Math.abs(r - R) < rad * 0.5) return { kind: 'rotate' };
      if (r < R) return { kind: 'lattice' };
    }
    if (Math.abs(p.x - scene.detector * cssW) < FILM_W / 2 + 4) return { kind: 'film' };
    if (scene.barrier == null) return null;
    const mid = (Math.round(scene.barrier * sim.w) + 1) * cell;
    if (Math.abs(p.x - mid - 4) < (touch ? 40 : 34) && p.y > cssH - RAIL - MOUNT - (touch ? 16 : 8)) return { kind: 'barrier' };
    if (Math.abs(p.x - mid) > (touch ? 20 : 12)) return null;
    for (let k = 0; k < scene.slits.length; k++) {
      const dy = Math.abs(p.y - scene.slits[k] * cssH), edge = (scene.slitHalf + 0.5) * cell;
      if (tools && Math.abs(dy - edge) < (touch ? 10 : 6)) return { kind: 'gap', k };
      if (dy < edge + (tools ? -2 : 12)) return { kind: 'slit', k };
    }
    return null;
  }
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  function moveHandle(hit, p) {
    if (hit.kind === 'film') return;
    cued = false;
    expo.fill(0); // a changed bench needs fresh film
    if (hit.kind === 'source') {
      const s = scene.sources[hit.k];
      s.fx = clamp(p.x / cssW, 0.14, (scene.barrier ?? 0.9) - 0.05);
      s.fy = clamp(p.y / cssH, 0.14, 0.86);
      sim.sources = scene.sources.map((q) => ({ x: q.fx * sim.w, y: q.fy * sim.h, a: q.a }));
    } else if (hit.kind === 'lattice') {
      scene.lattice.fx = clamp(p.x / cssW, 0.08, 0.92);
      scene.lattice.fy = clamp(p.y / cssH, 0.08, 0.92);
      applyScene();
    } else if (hit.kind === 'rotate') {
      const L = scene.lattice;
      L.theta = Math.atan2(p.y - L.fy * cssH, p.x - L.fx * cssW) - hit.offset;
      applyScene();
    } else if (hit.kind === 'barrier') {
      scene.barrier = clamp(p.x / cssW, 0.3, scene.detector - 0.08);
      applyScene();
    } else if (hit.kind === 'gap') {
      scene.slitHalf = clamp(Math.round(Math.abs(p.y / cell - scene.slits[hit.k] * sim.h) - 0.5), 1, 10);
      applyScene();
    } else {
      const other = scene.slits[1 - hit.k];
      const minGap = (2 * scene.slitHalf + 3) / sim.h;
      let fy = clamp(p.y / cssH, 0.12, 0.88);
      if (other != null && Math.abs(fy - other) < minGap) fy = other + (fy < other ? -minGap : minGap);
      scene.slits[hit.k] = clamp(fy, 0.12, 0.88);
      applyScene();
    }
    onChange?.(scene);
  }
  function engaged() { hint?.classList.add('gone'); ghost = null; }

  // Ghost hand, alternating two gestures. Tap: a dot presses down, a ring spreads, and the field gets the
  // burst a real tap gives. Swipe: the dot wanders toward the slits leaving the wake a moving mouse leaves.
  const GHOST_MS = 2800;
  function drawGhost(ink) {
    const t = performance.now() - ghost.t0;
    if (t < 0) return;
    const n = Math.floor(t / GHOST_MS), ph = (t % GHOST_MS) / GHOST_MS, B = scene.barrier * cssW;
    ctx.fillStyle = ink;
    if (n % 2) { // swipe
      const q = Math.min(1, Math.max(0, (ph - 0.1) / 0.6));
      const x = (0.15 + 0.6 * q) * B, y = (0.5 + 0.22 * Math.sin(2 * Math.PI * q)) * cssH;
      const c = { x: x / cell, y: y / cell };
      if (q > 0 && q < 1 && (!ghost.last || Math.hypot(c.x - ghost.last.x, c.y - ghost.last.y) >= 4)) { ghost.last = c; sim.burst(c.x, c.y, 0.05, 2); }
      if (q >= 1) ghost.last = null;
      ctx.globalAlpha = 0.6 * Math.min(1, ph / 0.1, (1 - ph) / 0.2);
      ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
    } else { // tap
      const x = 0.4 * B, y = 0.5 * cssH;
      if (n !== ghost.n && ph > 0.15) { ghost.n = n; sim.burst(x / cell, y / cell, 0.6); }
      const down = ph < 0.15 ? ph / 0.15 : Math.max(0, 1 - (ph - 0.15) / 0.2);
      ctx.globalAlpha = 0.25 + 0.5 * down;
      ctx.beginPath(); ctx.arc(x, y, 9 - 3 * down, 0, Math.PI * 2); ctx.fill();
      if (ph > 0.15 && ph < 0.75) {
        const q = (ph - 0.15) / 0.6;
        ctx.globalAlpha = 0.6 * (1 - q);
        ctx.beginPath(); ctx.arc(x, y, 10 + 30 * q, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  // Wake: short bursts every ~4 cells along the segment since the last move, amplitude ∝ speed.
  let prevMove = null;
  function trail(p, t, gain = 1) {
    const q = prevMove;
    prevMove = { x: p.x / cell, y: p.y / cell, t };
    if (!q || t - q.t > 100) return; // pointer just entered or rested
    const d = Math.hypot(prevMove.x - q.x, prevMove.y - q.y);
    const a = Math.min(0.05, (d / Math.max(t - q.t, 1)) * 0.12 * gain);
    if (a < 0.004) return;
    const n = Math.ceil(d / 4);
    for (let k = 1; k <= n; k++) sim.burst(q.x + ((prevMove.x - q.x) * k) / n, q.y + ((prevMove.y - q.y) * k) / n, a, 2);
  }
  canvas.addEventListener('pointerleave', () => { prevMove = null; });
  // Scrolling under a resting mouse moves the canvas past it: that is pointer motion too. The segment comes
  // from the scroll distance itself, so every scroll event counts, even the first after a pause.
  let mouse = null, lastScroll = scrollY, lastScrollT = 0; // mouse: last position anywhere, client coordinates
  if (wake) {
    window.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') mouse = { x: e.clientX, y: e.clientY }; }, { passive: true });
    window.addEventListener('scroll', (e) => {
      const dy = scrollY - lastScroll, dt = clamp(e.timeStamp - lastScrollT, 8, 50);
      lastScroll = scrollY; lastScrollT = e.timeStamp;
      if (!mouse || !sim || !dy) return;
      const r = canvas.getBoundingClientRect(), p = { x: mouse.x - r.left, y: mouse.y - r.top };
      if (p.x < 0 || p.x > r.width || p.y < 0 || p.y > r.height) return;
      prevMove = { x: p.x / cell, y: (p.y - dy) / cell, t: e.timeStamp - dt };
      trail(p, e.timeStamp, 2); // a scroll is a coarser motion than a hand, so it counts double
    }, { passive: true });
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (!sim || e.button > 0) return;
    const p = pos(e), touch = e.pointerType !== 'mouse';
    press = { start: p, hit: hitTest(p, touch), dragging: false, thr: touch ? 10 : 6, lastPulse: 0 };
    if (press.hit?.kind === 'rotate') { const L = scene.lattice; press.hit.offset = Math.atan2(p.y - L.fy * cssH, p.x - L.fx * cssW) - L.theta; }
    canvas.setPointerCapture(e.pointerId);
    if (press.hit) canvas.classList.add('grabbing');
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!sim) return;
    const p = pos(e);
    if (!press) {
      hover = hitTest(p, false);
      canvas.classList.toggle('grab', !!hover);
      if (!running && tools) draw();
      if (wake && e.pointerType === 'mouse') { trail(p, e.timeStamp); ghost = null; }
      return;
    }
    if (!press.dragging && Math.hypot(p.x - press.start.x, p.y - press.start.y) > press.thr) press.dragging = true;
    if (!press.dragging) return;
    engaged();
    if (press.hit) moveHandle(press.hit, p);
    else if (e.timeStamp - press.lastPulse > 40) { press.lastPulse = e.timeStamp; sim.burst(p.x / cell, p.y / cell, 0.35, 2); }
    if (!running) draw();
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!press) return;
    if (!press.dragging && press.hit?.kind === 'film') expo.fill(0); // fresh film
    if (!press.dragging && !press.hit) { const p = pos(e); sim.burst(p.x / cell, p.y / cell); engaged(); }
    press = null;
    canvas.classList.remove('grab', 'grabbing');
    if (!running) draw();
  });
  if (tools) canvas.addEventListener('dblclick', (e) => {
    if (!sim) return;
    const p = pos(e), hit = hitTest(p, false);
    if (hit?.kind === 'source') scene.sources.splice(hit.k, 1);
    else if (!hit && scene.sources.length < 6) { scene.sources.push({ fx: p.x / cssW, fy: p.y / cssH }); pop = { x: p.x, y: p.y, t: performance.now() }; }
    else return;
    applyScene();
    expo.fill(0);
    onChange?.(scene);
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
  return { scene, apply() { if (!sim) return; applyScene(); det.fill(0); expo.fill(0); if (!running) draw(); } };
}
