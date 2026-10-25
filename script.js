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
// Linked on the first switch so English pages never fetch it; unicode-range subsets download only the glyphs in use
const KO_FONT = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';
function linkKoFont() {
  if (document.querySelector(`link[href="${KO_FONT}"]`)) return;
  document.head.append(Object.assign(document.createElement('link'), { rel: 'stylesheet', href: KO_FONT }));
}
function setLang(lang) {
  if (lang === 'ko') linkKoFont();
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
// GitHub rows come from the stats collector's snapshot on this origin (NaNIsaac/stats, every six hours):
// no api.github.com call per visitor, no rate limit, and the same definition of "upstream" as the stats page and the README.
function prRow(pr) {
  const a = document.createElement('a');
  a.href = pr.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
  const strong = document.createElement('strong'); strong.textContent = pr.repo;
  const span = document.createElement('span'); span.textContent = pr.title;
  strong.append(span);
  const em = document.createElement('em'); em.textContent = pr.state; em.title = pr.created.slice(0, 10);
  a.append(strong, em);
  return a;
}
const ghList = document.querySelector('#gh-list');
const prList = document.querySelector('#pr-list');
if (ghList || prList) {
  fetch('stats/data/latest.json').then((r) => (r.ok ? r.json() : null)).then((s) => {
    if (!s) return;
    const pushed = (s.repos ?? []).filter((r) => r.pushed && !r.fork && !r.archived).sort((a, b) => b.pushed.localeCompare(a.pushed)).slice(0, 5);
    ghList?.prepend(...pushed.map((r) => logRow(r.url, r.name, r.pushed, true)));
    const prs = (s.pulls?.elsewhere ?? []).filter((pr) => pr.state !== 'closed').slice(0, 4);
    prList?.prepend(...prs.map(prRow));
  }).catch(() => {});
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
    pauseLabel: (running) => (running ? (isKo() ? '정지' : 'Pause') : (isKo() ? '재생' : 'Play')),
  });
}

// Videos play only while on screen; with reduced motion they stay on the poster (the final frame) with controls
const stillVideos = matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window);
for (const video of document.querySelectorAll('.fit-video')) {
  if (stillVideos) video.controls = true;
  else new IntersectionObserver(([e]) => { e.isIntersecting ? video.play().catch(() => {}) : video.pause(); }).observe(video);
}

// One caption line per shot, kept out of the video so it follows the page language.
// Until a video first plays, its poster (the last shot) is on screen, so the last line is.
for (const cue of document.querySelectorAll('.video-cue')) {
  const video = cue.closest('figure').querySelector('video');
  const lines = JSON.parse(cue.dataset.cues);
  const show = () => {
    const line = video.played.length ? lines.findLast((l) => l.t <= video.currentTime) ?? lines[0] : lines.at(-1);
    const text = isKo() ? line.ko : line.en;
    if (cue.textContent !== text) cue.textContent = text;
  };
  video.addEventListener('timeupdate', show);
  window.addEventListener('langchange', show);
  show();
}
