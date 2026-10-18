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
// Dates read as "3 days ago" in either language; hovering shows the date itself.
function ago(iso) {
  const d = Math.floor((Date.now() - new Date(iso)) / 864e5);
  if (isKo()) return d < 1 ? '오늘' : d === 1 ? '어제' : d < 30 ? `${d}일 전` : `${Math.floor(d / 30)}달 전`;
  return d < 1 ? 'today' : d === 1 ? 'yesterday' : d < 30 ? `${d} days ago` : `${Math.floor(d / 30)} mo ago`;
}
function stamp(em, iso, prefix) {
  em.dataset.date = iso;
  if (prefix) em.dataset.prefix = prefix;
  em.title = iso.slice(0, 10);
  em.textContent = em.dataset.prefix ? (isKo() ? `마지막 노트 ${ago(iso)}` : `last note ${ago(iso)}`) : ago(iso);
}
window.addEventListener('langchange', () => document.querySelectorAll('em[data-date]').forEach((em) => stamp(em, em.dataset.date)));
function logRow(href, title, iso, external) {
  const a = document.createElement('a');
  a.href = href;
  if (external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  const strong = document.createElement('strong'); strong.textContent = title;
  const em = document.createElement('em'); stamp(em, iso);
  a.append(strong, em);
  return a;
}
const notesList = document.querySelector('#notes-list');
if (notesList) {
  fetch('notes/feed.json').then((r) => (r.ok ? r.json() : [])).then((posts) => {
    notesList.prepend(...posts.slice(0, 4).map((p) => logRow(p.url, p.title, p.date)));
    if (posts[0]) stamp(document.querySelector('#notes-age'), posts[0].date, 'last');
  }).catch(() => {});
}
const OWN_WORK = /^(Push|PullRequest|Create|Release|Issues|PullRequestReview)Event$/; // not stars/forks of other people's repos
const ghList = document.querySelector('#gh-list');
if (ghList) {
  fetch('https://api.github.com/users/NaNIsaac/events/public?per_page=50').then((r) => (r.ok ? r.json() : [])).then((events) => {
    const latest = new Map();
    for (const e of events) if (OWN_WORK.test(e.type) && !latest.has(e.repo.name) && latest.size < 5) latest.set(e.repo.name, e.created_at);
    ghList.prepend(...[...latest].map(([name, at]) => logRow(`https://github.com/${name}`, name.replace(/^NaNIsaac\//, ''), at, true)));
  }).catch(() => {});
}

// Lab preview on the home page: the optical-table renderer with a lattice in place, no slit
const labPreview = document.querySelector('#lab-preview');
if (labPreview && typeof mountWave === 'function') {
  mountWave(labPreview, {
    tools: true,
    speed: 0.5, gain: 0.55, // half speed, softer contrast: it sits beside reading text
    demo: true, // a ghost hand turns and shifts the lattice until someone touches it
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
    fixed: true, // the slit is scenery here; moving it is the lab's job
    scene: { sources: [], slits: [0.36, 0.64] }, // no steady source: taps light it; slits wide apart so the two waves read
    pauseLabel: (running) => (running ? (isKo() ? '일시정지' : 'Pause') : (isKo() ? '재생' : 'Play')),
  });
}

// Shared canvas helpers
const cssVar = (name) => getComputedStyle(document.body).getPropertyValue(name).trim();
const hexRgb = (v) => [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16));

// XRefine video: plays only while on screen; with reduced motion it stays on the poster (the final fit) with controls
const fitVideo = document.querySelector('.fit-video');
if (fitVideo) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) fitVideo.controls = true;
  else new IntersectionObserver(([e]) => { e.isIntersecting ? fitVideo.play().catch(() => {}) : fitVideo.pause(); }).observe(fitVideo);
}

// Reconstruct: an aperture and its far-field intensity (fourier.js), cycling through four shapes on its own.
// Nothing to operate here; the lab has the controls. Pauses offscreen, stays on the circle with reduced motion.
const ftA = document.querySelector('#ft-a'), ftS = document.querySelector('#ft-s');
if (ftA && typeof createFourier === 'function') {
  const N = 128, F = createFourier(N);
  const SHAPES = [
    { kind: 'circle', size: 10, en: 'circle', ko: '원' },
    { kind: 'ring', size: 12, en: 'ring', ko: '고리' },
    { kind: 'double', size: 2.5, sep: 20, en: 'double slit', ko: '이중 슬릿' },
    { kind: 'square', size: 8, en: 'square', ko: '정사각형' },
  ];
  // Each shape is transformed once; a cycle only repaints.
  const frames = SHAPES.map((sh) => {
    const t = F.aperture(sh.kind, sh.size, sh.sep ?? 0);
    const re = t.slice(), im = new Float64Array(N * N);
    F.fft2(re, im);
    let max = 0;
    const I = re.map((v, i) => { const p = v * v + im[i] * im[i]; max = Math.max(max, p); return p; });
    return { t, I: I.map((v) => Math.log10(1 + (v / (max || 1)) * 1e4) / 4) };
  });
  // tint: a faint brass wash on the mid-to-bright levels (the detector panel), the hero's detector colour
  function paint(canvas, val, tint = false) {
    const g = canvas.getContext('2d'), img = g.createImageData(N, N), d = img.data;
    const bg = hexRgb(cssVar('--surface')), ink = hexRgb(cssVar('--ink')), brass = hexRgb(cssVar('--accent'));
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const v = Math.min(1, val[((y + N / 2) % N) * N + ((x + N / 2) % N)]), j = (y * N + x) * 4; // draw centred
        const w = tint ? 0.28 * Math.sin(Math.PI * v) ** 2 : 0;
        for (let c = 0; c < 3; c++) { const base = bg[c] + (ink[c] - bg[c]) * v; d[j + c] = base + (brass[c] - base) * w; }
        d[j + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
  }
  const panels = document.querySelector('#ft-panels'), nameEl = document.querySelector('#ft-name');
  let k = 0, timer = 0, onScreen = false;
  function show() {
    paint(ftA, frames[k].t);
    paint(ftS, frames[k].I, true);
    nameEl.textContent = isKo() ? SHAPES[k].ko : SHAPES[k].en;
  }
  function advance() {
    panels.classList.add('fading');
    setTimeout(() => { k = (k + 1) % SHAPES.length; show(); panels.classList.remove('fading'); }, 350);
  }
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function schedule() {
    clearInterval(timer); timer = 0;
    if (!still && onScreen && !document.hidden) timer = setInterval(advance, 3200);
  }
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; schedule(); }).observe(panels);
  document.addEventListener('visibilitychange', schedule);
  window.addEventListener('themechange', show);
  window.addEventListener('langchange', show);
  show();
}
