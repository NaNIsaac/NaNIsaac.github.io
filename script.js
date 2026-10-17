const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

// Theme (initial class is set by the inline script in <body> to avoid a flash)
const themeButton = document.querySelector('#theme');
function updateThemeIcon() { themeButton.textContent = document.body.classList.contains('dark') ? 'Light' : 'Dark'; }
updateThemeIcon();
themeButton.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  store.set('isaac-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
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

// Entrances: sections rise in once as they enter. Without script (or with reduced motion) everything is simply shown.
const revealed = document.querySelectorAll('.reveal, .shutter');
if (revealed.length && 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('js');
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -12% 0px' });
  revealed.forEach((el) => io.observe(el));
}

const yearEl = document.querySelector('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Lately: newest notes (Jekyll JSON feed) and public GitHub activity. Both optional; failures leave the fallback link.
function logRow(href, title, meta, external) {
  const a = document.createElement('a');
  a.href = href;
  if (external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  const strong = document.createElement('strong'); strong.textContent = title;
  const em = document.createElement('em'); em.textContent = meta;
  a.append(strong, em);
  return a;
}
const notesList = document.querySelector('#notes-list');
if (notesList) {
  fetch('notes/feed.json').then((r) => (r.ok ? r.json() : [])).then((posts) => {
    notesList.prepend(...posts.slice(0, 4).map((p) => logRow(p.url, p.title, p.date.slice(5))));
    if (!posts[0]) return;
    const days = Math.floor((Date.now() - new Date(posts[0].date)) / 864e5);
    document.querySelector('#notes-age').textContent = days < 1 ? 'last note today' : `last note ${days} day${days > 1 ? 's' : ''} ago`;
  }).catch(() => {});
}
const OWN_WORK = /^(Push|PullRequest|Create|Release|Issues|PullRequestReview)Event$/; // not stars/forks of other people's repos
const ghList = document.querySelector('#gh-list');
if (ghList) {
  fetch('https://api.github.com/users/NaNIsaac/events/public?per_page=50').then((r) => (r.ok ? r.json() : [])).then((events) => {
    const latest = new Map();
    for (const e of events) if (OWN_WORK.test(e.type) && !latest.has(e.repo.name) && latest.size < 5) latest.set(e.repo.name, e.created_at);
    ghList.prepend(...[...latest].map(([name, at]) => logRow(`https://github.com/${name}`, name.replace(/^NaNIsaac\//, ''), at.slice(5, 10), true)));
  }).catch(() => {});
}

// Lab preview on the home page: the optical-table renderer with a lattice in place, no slit
const labPreview = document.querySelector('#lab-preview');
if (labPreview && typeof mountWave === 'function') {
  mountWave(labPreview, {
    tools: true,
    speed: 0.5, gain: 0.55, // half speed, softer contrast: it sits beside reading text
    scene: { sources: [{ fx: 0.1, fy: 0.5 }], barrier: null, slits: [], detector: 0.92, lattice: { fx: 0.48, fy: 0.5, theta: 0.35, d: 9, n: 3 } },
  });
}

// Liquid Light hero (renderer in wave-view.js, solver in wave.js)
const waveCanvas = document.querySelector('#wave');
if (waveCanvas && typeof mountWave === 'function') {
  const pauseButton = document.querySelector('#pause');
  mountWave(waveCanvas, {
    hint: document.querySelector('#hint'),
    pauseButton,
    wake: true,
    scene: { sources: [] },
    pauseLabel: (running) => (running ? (isKo() ? '일시정지' : 'Pause') : (isKo() ? '재생' : 'Play')),
  });
}

// Shared canvas helpers for the two small home benches
const cssVar = (name) => getComputedStyle(document.body).getPropertyValue(name).trim();
const hexRgb = (v) => [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16));
function fitCanvas(canvas) {
  const r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { g, w: r.width, h: r.height };
}

// Measure: reflectivity of a film on silicon, Parratt recursion (xrr.js), redrawn on every slider move
const xrrCanvas = document.querySelector('#xrr');
if (xrrCanvas && typeof reflectivity === 'function') {
  const SI = 2.0e-5, FILM = 3.3e-5; // X-ray SLD in Å⁻²: silicon, and an Al₂O₃-like film
  const Q0 = 0.01, Q1 = 0.3, LOG_MIN = -8;
  const tIn = document.querySelector('#xrr-t'), sIn = document.querySelector('#xrr-s');
  function drawXRR() {
    const t = +tIn.value, s = +sIn.value;
    document.querySelector('#xrr-t-out').textContent = `${t} Å`;
    document.querySelector('#xrr-s-out').textContent = `${s} Å`;
    document.querySelector('#xrr-out').textContent = `Fringe period 2π/t = ${((2 * Math.PI) / t).toFixed(4)} Å⁻¹`;
    const { g, w, h } = fitCanvas(xrrCanvas);
    const ink = cssVar('--ink'), muted = cssVar('--muted');
    const L = 52, B = 36, T = 14, R = 14, pw = w - L - R, ph = h - T - B;
    const X = (q) => L + ((q - Q0) / (Q1 - Q0)) * pw;
    const Y = (r) => T + (Math.max(Math.log10(r), LOG_MIN) / LOG_MIN) * ph;
    g.clearRect(0, 0, w, h);
    g.font = '13px Archivo, sans-serif';
    g.fillStyle = muted;
    g.textAlign = 'center';
    for (const q of [0.05, 0.1, 0.15, 0.2, 0.25, 0.3]) { g.fillRect(X(q), T + ph, 1, 5); g.fillText(q.toFixed(2), X(q), T + ph + 20); }
    g.textAlign = 'right';
    for (const e of [0, -2, -4, -6, -8]) { g.fillRect(L - 5, Y(10 ** e), 5, 1); g.fillText(`10${e ? '⁻' + '⁰¹²³⁴⁵⁶⁷⁸⁹'[-e] : '⁰'}`, L - 9, Y(10 ** e) + 4); }
    g.textAlign = 'left';
    g.fillText('q, Å⁻¹', L + pw - 44, T + ph - 8);
    g.fillText('R', L + 6, T + 12);
    const plot = (layers, sub, color, width) => {
      g.strokeStyle = color; g.lineWidth = width; g.beginPath();
      for (let i = 0; i <= 600; i++) {
        const q = Q0 + ((Q1 - Q0) * i) / 600, y = Y(reflectivity(q, layers, sub));
        i ? g.lineTo(X(q), y) : g.moveTo(X(q), y);
      }
      g.stroke();
    };
    plot([], { rho: SI, sigma: s }, muted, 1); // the bare substrate, for reference
    plot([{ rho: FILM, d: t, sigma: s }], { rho: SI, sigma: s }, ink, 2);
  }
  tIn.addEventListener('input', drawXRR);
  sIn.addEventListener('input', drawXRR);
  window.addEventListener('themechange', drawXRR);
  new ResizeObserver(drawXRR).observe(xrrCanvas);
}

// XRefine training video: plays only while on screen; with reduced motion it stays on the poster (last epoch) with controls
const fitVideo = document.querySelector('.fit-video');
if (fitVideo) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) fitVideo.controls = true;
  else new IntersectionObserver(([e]) => { e.isIntersecting ? fitVideo.play().catch(() => {}) : fitVideo.pause(); }).observe(fitVideo);
}

// Reconstruct: an aperture and its far-field intensity (fourier.js); drag on the aperture to resize it
const ftA = document.querySelector('#ft-a'), ftS = document.querySelector('#ft-s');
if (ftA && typeof createFourier === 'function') {
  const N = 128, F = createFourier(N), st = { kind: 'circle', size: 10 };
  function paint(canvas, val) {
    const g = canvas.getContext('2d'), img = g.createImageData(N, N), d = img.data;
    const bg = hexRgb(cssVar('--surface')), ink = hexRgb(cssVar('--ink'));
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const v = Math.min(1, val[((y + N / 2) % N) * N + ((x + N / 2) % N)]), j = (y * N + x) * 4; // draw centred
        for (let c = 0; c < 3; c++) d[j + c] = bg[c] + (ink[c] - bg[c]) * v;
        d[j + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
  }
  function computeFT() {
    const size = st.kind === 'double' ? Math.max(2, st.size / 4) : st.size;
    const t = F.aperture(st.kind, size, Math.round(st.size * 2));
    const re = t.slice(), im = new Float64Array(N * N);
    F.fft2(re, im);
    let max = 0;
    const I = re.map((v, i) => { const p = v * v + im[i] * im[i]; max = Math.max(max, p); return p; });
    paint(ftA, t);
    paint(ftS, I.map((v) => Math.log10(1 + (v / (max || 1)) * 1e4) / 4));
  }
  document.querySelector('#ft-kind').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    document.querySelectorAll('#ft-kind button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    st.kind = b.dataset.v;
    computeFT();
  });
  let dragging = false;
  const resize = (e) => {
    const r = ftA.getBoundingClientRect(), dist = Math.hypot(e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2);
    st.size = Math.min(40, Math.max(2, Math.round((dist / r.width) * N)));
    computeFT();
  };
  ftA.addEventListener('pointerdown', (e) => { dragging = true; ftA.setPointerCapture(e.pointerId); resize(e); });
  ftA.addEventListener('pointermove', (e) => { if (dragging) resize(e); });
  ftA.addEventListener('pointerup', () => { dragging = false; });
  window.addEventListener('themechange', computeFT);
  computeFT();
}
