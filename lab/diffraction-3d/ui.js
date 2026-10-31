/* Shared site language and theme preferences; works even if WebGL fails. */
(() => {
  const get = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
  const put = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
  const lang = document.querySelector('#lang');
  const theme = document.querySelector('#theme');
  const entries = [...document.querySelectorAll('[data-ko]')];
  for (const el of entries) el.dataset.en = el.innerHTML;
  function updateTheme() {
    theme.textContent = document.body.classList.contains('dark') ? 'Light' : 'Dark';
    window.dispatchEvent(new Event('themechange'));
  }
  theme.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    put('isaac-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    updateTheme();
  });
  function setLang(value) {
    document.documentElement.lang = value;
    for (const el of entries) el.innerHTML = value === 'ko' ? el.dataset.ko : el.dataset.en;
    lang.textContent = value === 'ko' ? 'EN' : '한';
    lang.setAttribute('aria-label', value === 'ko' ? 'Switch to English' : '한국어로 보기');
    window.dispatchEvent(new Event('langchange'));
  }
  lang.addEventListener('click', () => {
    const next = document.documentElement.lang === 'ko' ? 'en' : 'ko';
    put('isaac-lang', next);
    setLang(next);
  });
  updateTheme();
  if (get('isaac-lang') === 'ko') setLang('ko');
})();
