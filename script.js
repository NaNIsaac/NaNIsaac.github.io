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
  fetch('https://api.github.com/users/NaNIsaac/events/public?per_page=50').then((r) => (r.ok ? r.json() : [])).then((events) => {
    const latest = new Map();
    for (const e of events) if (OWN_WORK.test(e.type) && !latest.has(e.repo.name) && latest.size < 5) latest.set(e.repo.name, e.created_at);
    ghList.prepend(...[...latest].map(([name, at]) => logRow(`https://github.com/${name}`, name.replace(/^NaNIsaac\//, ''), at.slice(5, 10), true)));
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
    scene: { sources: [] },
    pauseLabel: (running) => (running ? (isKo() ? '일시정지' : 'Pause') : (isKo() ? '재생' : 'Play')),
  });
}
