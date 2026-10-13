const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

// Theme (initial class is set by the inline script in <body> to avoid a flash)
const themeButton = document.querySelector('#theme');
function updateThemeIcon() { themeButton.textContent = document.body.classList.contains('light') ? '☀' : '☾'; }
updateThemeIcon();
themeButton.addEventListener('click', () => {
  document.body.classList.toggle('light');
  store.set('isaac-theme', document.body.classList.contains('light') ? 'light' : 'dark');
  updateThemeIcon();
  window.dispatchEvent(new Event('themechange'));
});

// Language: English in the markup, Korean in data-ko (home page only)
const langButton = document.querySelector('#lang');
const translatable = [...document.querySelectorAll('[data-ko]')];
translatable.forEach((el) => { el.dataset.en = el.innerHTML; });
const isKo = () => document.documentElement.lang === 'ko';
function setLang(lang) {
  document.documentElement.lang = lang;
  translatable.forEach((el) => { el.innerHTML = lang === 'ko' ? el.dataset.ko : el.dataset.en; });
  langButton.textContent = lang === 'ko' ? 'EN' : '한';
  langButton.setAttribute('aria-label', lang === 'ko' ? 'Switch to English' : '한국어로 보기');
  window.dispatchEvent(new Event('langchange'));
}
if (langButton) {
  langButton.addEventListener('click', () => { const next = isKo() ? 'en' : 'ko'; store.set('isaac-lang', next); setLang(next); });
  if (store.get('isaac-lang') === 'ko') setLang('ko');
}

const yearEl = document.querySelector('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Lately: newest notes (Jekyll JSON feed) and public GitHub activity. Both optional; failures leave the fallback link.
function logRow(href, title, meta, external) {
  const a = document.createElement('a');
  a.href = href;
  if (external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  const strong = document.createElement('strong'); strong.textContent = title;
  const em = document.createElement('em'); em.className = 'mono'; em.textContent = meta;
  a.append(strong, em);
  return a;
}
const notesList = document.querySelector('#notes-list');
if (notesList) {
  fetch('notes/feed.json').then((r) => (r.ok ? r.json() : [])).then((posts) => {
    notesList.prepend(...posts.slice(0, 4).map((p) => logRow(p.url, p.title, p.date.slice(5))));
    if (!posts[0]) return;
    const days = Math.floor((Date.now() - new Date(posts[0].date)) / 864e5);
    document.querySelector('#notes-age').textContent = days < 1 ? 'Last note: today' : `Last note: ${days} day${days > 1 ? 's' : ''} ago`;
  }).catch(() => {});
}
const OWN_WORK = /^(Push|PullRequest|Create|Release|Issues|PullRequestReview)Event$/; // not stars/forks of other people's repos
const ghList = document.querySelector('#gh-list');
if (ghList) {
  fetch('https://api.github.com/users/SJB7777/events/public?per_page=50').then((r) => (r.ok ? r.json() : [])).then((events) => {
    const latest = new Map();
    for (const e of events) if (OWN_WORK.test(e.type) && !latest.has(e.repo.name) && latest.size < 5) latest.set(e.repo.name, e.created_at);
    ghList.prepend(...[...latest].map(([name, at]) => logRow(`https://github.com/${name}`, name.replace(/^SJB7777\//, ''), at.slice(5, 10), true)));
  }).catch(() => {});
}

// Liquid Light hero: solver in wave.js, this part only draws and handles pointer input.
(() => {
  const canvas = document.querySelector('#wave');
  if (!canvas || typeof createWave !== 'function') return;
  const ctx = canvas.getContext('2d');
  const off = document.createElement('canvas');
  const octx = off.getContext('2d');
  const pauseButton = document.querySelector('#pause');
  const hint = document.querySelector('#hint');

  const STEP_MS = 1000 / 120;
  const GAIN = 3;
  const SLIT_HALF = 3; // cells; wavelength is 8 cells
  // Scene geometry in fractions of the canvas, so a resize keeps the composition.
  const scene = { sources: [{ fx: 0.53, fy: 0.4 }, { fx: 0.53, fy: 0.6 }], barrier: 0.7, slits: [0.43, 0.57], detector: 0.93 };

  let sim, img, det, cell, cssW, cssH, dpr, colors;

  function readColor(name) {
    const v = getComputedStyle(document.body).getPropertyValue(name).trim();
    return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16));
  }
  function recolor() {
    colors = { bg: readColor('--bg'), a: readColor('--accent'), v: readColor('--violet'), light: document.body.classList.contains('light') };
  }

  function applyScene() {
    sim.sources = scene.sources.map((s) => ({ x: s.fx * sim.w, y: s.fy * sim.h }));
    sim.setBarrier(Math.round(scene.barrier * sim.w), scene.slits.map((fy) => ({ y: fy * sim.h, half: SLIT_HALF })));
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
    for (let i = 0; i < 600; i++) tick(); // composed frame before the first paint
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
    const bx = Math.round(scene.barrier * sim.w) * cell;
    ctx.fillStyle = light ? 'rgba(20,32,51,.55)' : 'rgba(234,247,255,.42)';
    let y0 = 0;
    for (const fy of [...scene.slits].sort((p, q) => p - q)) {
      const top = (fy * sim.h - SLIT_HALF - 0.5) * cell;
      ctx.fillRect(bx, y0, 2 * cell, top - y0);
      y0 = (fy * sim.h + SLIT_HALF + 0.5) * cell;
    }
    ctx.fillRect(bx, y0, 2 * cell, cssH - y0);

    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    for (const fy of scene.slits) {
      ctx.beginPath();
      ctx.arc(bx + cell, fy * cssH, 7, 0, Math.PI * 2);
      ctx.stroke();
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
  function pauseLabel() { pauseButton.textContent = running ? (isKo() ? '일시정지' : 'Pause') : (isKo() ? '재생' : 'Play'); }
  pauseButton.addEventListener('click', () => { running = !running; pauseLabel(); kick(); });
  window.addEventListener('langchange', pauseLabel);
  window.addEventListener('themechange', () => { recolor(); if (sim) draw(); });
  document.addEventListener('visibilitychange', kick);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(canvas);

  // Pointer: click = pulse, drag handle = move it, drag empty space = trail of pulses.
  let press = null;
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  function hitTest(p, touch) {
    const rad = touch ? 26 : 18;
    const bx = (Math.round(scene.barrier * sim.w) + 1) * cell;
    for (let k = 0; k < scene.sources.length; k++) {
      const s = scene.sources[k];
      if (Math.hypot(p.x - s.fx * cssW, p.y - s.fy * cssH) < rad) return { kind: 'source', k };
    }
    for (let k = 0; k < scene.slits.length; k++) {
      if (Math.hypot(p.x - bx, p.y - scene.slits[k] * cssH) < rad) return { kind: 'slit', k };
    }
    return null;
  }
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  function moveHandle(hit, p) {
    if (hit.kind === 'source') {
      const s = scene.sources[hit.k];
      s.fx = clamp(p.x / cssW, 0.14, scene.barrier - 0.05);
      s.fy = clamp(p.y / cssH, 0.14, 0.86);
      sim.sources = scene.sources.map((q) => ({ x: q.fx * sim.w, y: q.fy * sim.h }));
    } else {
      const other = scene.slits[1 - hit.k];
      const minGap = (2 * SLIT_HALF + 3) / sim.h;
      let fy = clamp(p.y / cssH, 0.12, 0.88);
      if (Math.abs(fy - other) < minGap) fy = other + (fy < other ? -minGap : minGap);
      scene.slits[hit.k] = clamp(fy, 0.12, 0.88);
      applyScene();
    }
  }
  function engaged() { hint.classList.add('gone'); }

  canvas.addEventListener('pointerdown', (e) => {
    if (!sim || e.button > 0) return;
    const p = pos(e), touch = e.pointerType !== 'mouse';
    press = { start: p, hit: hitTest(p, touch), dragging: false, thr: touch ? 10 : 6, lastPulse: 0 };
    canvas.setPointerCapture(e.pointerId);
    if (press.hit) canvas.className = 'grabbing';
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!sim) return;
    const p = pos(e);
    if (!press) { canvas.className = hitTest(p, false) ? 'grab' : ''; return; }
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
    canvas.className = '';
    if (!running) draw();
  });
  canvas.addEventListener('pointercancel', () => { press = null; canvas.className = ''; });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && press) { press = null; canvas.className = ''; } });

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
})();
