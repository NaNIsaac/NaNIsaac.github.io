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
const OWN_WORK = /^(Push|PullRequest|Create|Release|Issues|PullRequestReview)Event$/; // not stars/forks of other people's repos
const ghList = document.querySelector('#gh-list');
if (ghList) {
  fetch('https://api.github.com/users/NaNIsaac/events/public?per_page=50').then((r) => (r.ok ? r.json() : [])).then((events) => {
    const latest = new Map();
    for (const e of events) if (OWN_WORK.test(e.type) && !latest.has(e.repo.name) && latest.size < 5) latest.set(e.repo.name, e.created_at);
    ghList.prepend(...[...latest].map(([name, at]) => logRow(`https://github.com/${name}`, name.replace(/^NaNIsaac\//, ''), at, true)));
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
