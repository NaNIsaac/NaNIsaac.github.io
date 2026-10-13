// Terminal mode: press ` anywhere (or a [data-terminal] button). Builds its own dialog so any page can load it.
(() => {
  const REPO = 'SJB7777/SJB7777.github.io';
  const HC = 12.398419843; // h·c in keV·Å
  const LINKS = {
    github: 'https://github.com/SJB7777',
    blog: 'https://blog.naver.com/sjbpepper',
    notes: '/notes/',
    toolkit: 'https://xray.ooguy.com/',
    reflectolearn: 'https://github.com/SJB7777/ReflectoLearn',
    qoraflow: 'https://github.com/SJB7777/QoraFlow',
    qoraphase: 'https://github.com/SJB7777/QoraPhase',
    qoradfxm: 'https://github.com/SJB7777/QoraDFXM',
    tratt: 'https://github.com/SJB7777/TraTT',
    site: `https://github.com/${REPO}`,
  };

  const dialog = document.createElement('dialog');
  dialog.id = 'terminal-dialog';
  dialog.setAttribute('aria-label', 'Terminal mode');
  dialog.innerHTML = `<div class="terminal-header"><span>● ● ●</span><strong>isaac@portfolio ~ %</strong><button aria-label="Close">×</button></div>
    <div class="terminal-output" aria-live="polite"><p>IsaacOS / portfolio shell v0.3 — type <b>help</b></p></div>
    <form><label for="terminal-input">❯</label><input id="terminal-input" autocomplete="off" spellcheck="false" aria-label="Terminal command"><button type="submit">↵</button></form>`;
  document.body.append(dialog);
  const output = dialog.querySelector('.terminal-output');
  const input = dialog.querySelector('input');
  dialog.querySelector('.terminal-header button').addEventListener('click', () => dialog.close());

  function open() { if (!dialog.open) dialog.showModal(); input.focus(); }
  document.querySelectorAll('[data-terminal]').forEach((b) => b.addEventListener('click', open));
  window.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if (e.key === '`' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); open(); }
  });

  function print(text, cls) {
    const p = document.createElement('p');
    p.textContent = text;
    if (cls) p.className = cls;
    output.append(p);
    output.scrollTop = output.scrollHeight;
  }

  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  const num = (s) => { const v = parseFloat(s); if (!Number.isFinite(v)) throw new Error(`not a number: ${s ?? '(missing)'}`); return v; };
  const fmt = (v, d = 4) => Number(v.toPrecision(d)).toString();
  const today = () => new Date().toISOString().slice(0, 10);

  function newNoteUrl(title) {
    const slug = title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'note';
    const body = `---\ntitle: ${JSON.stringify(title)}\ndescription: \ntags: []\n---\n\n`;
    return `https://github.com/${REPO}/new/master/_posts?filename=${encodeURIComponent(`${today()}-${slug}.md`)}&value=${encodeURIComponent(body)}`;
  }

  // Local lists (this browser only): ideas to write up, small todos.
  function list(name, args) {
    const key = `isaac-${name}`, items = store.get(key, []);
    const [sub, ...rest] = args;
    if (!sub || sub === 'ls') {
      if (!items.length) return print(`(no ${name}s — add one: ${name} <text>)`);
      items.forEach((it, i) => print(`${String(i + 1).padStart(2)}  ${it.text}  · ${it.date}`));
      return;
    }
    if (sub === 'rm' || sub === 'done') {
      const i = num(rest[0]) - 1;
      if (!items[i]) throw new Error(`no ${name} #${rest[0]}`);
      const [gone] = items.splice(i, 1);
      store.set(key, items);
      return print(`${sub === 'done' ? '✓' : '✗'} ${gone.text}`);
    }
    if (sub === 'write' && name === 'idea') {
      const it = items[num(rest[0]) - 1];
      if (!it) throw new Error(`no idea #${rest[0]}`);
      window.open(newNoteUrl(it.text), '_blank', 'noopener');
      return print('Opened a new note on GitHub. Remove it from the list with: idea rm ' + rest[0]);
    }
    const text = args.join(' ');
    items.push({ text, date: today() });
    store.set(key, items);
    print(`+ ${name} #${items.length}: ${text}`);
  }

  const MATH = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'sqrt', 'cbrt', 'log', 'log10', 'log2', 'exp', 'abs', 'min', 'max', 'pow', 'PI', 'E', 'deg', 'rad'];
  function calc(expr) {
    const words = expr.match(/[A-Za-z_]\w*/g) || [];
    const bad = words.find((w) => !MATH.includes(w) && !/^e\d*$/.test(w));
    if (bad || /[^\w\s+\-*/().,^%]/.test(expr)) throw new Error(`unsupported: ${bad || 'character'}`);
    const f = new Function(`"use strict"; const {${MATH.slice(0, -2).join(',')}} = Math; const deg = Math.PI / 180, rad = 180 / Math.PI; return (${expr.replace(/\^/g, '**')});`);
    return f();
  }

  const commands = {
    help: () => [
      'X-ray      xray <E keV | λ Å>   bragg <d Å> <E keV>   q <2θ °> <E keV>   d <q Å⁻¹>',
      'Math       calc <expr>          e.g. calc 4*PI*sin(15*deg)/1.54',
      'Write      new <title>          open a prefilled note on GitHub',
      '           notes                latest published notes',
      '           idea <text> | ideas | idea write <n> | idea rm <n>',
      'Do         todo <text> | todos | todo done <n>',
      'Go         open <github|blog|notes|toolkit|site|reflectolearn|qoraflow|qoraphase|qoradfxm|tratt>',
      '           gh                   recent public GitHub activity',
      'Site       about  research  theme  clear  exit   (↑/↓ history)',
    ].forEach((l) => print(l)),
    about: () => print('Isaac Yong (용이삭) — MS student in Physics, Sogang University (CUPT Lab).\nBuilding the software layer of X-ray experiments.'),
    research: () => print('01 X-ray Reflectometry & Inverse Problems\n02 Coherent & Time-resolved Imaging\n03 Experimental Imaging & Data Systems'),
    xray: ([v]) => {
      if (/a$/i.test(v || '')) { const l = num(v); print(`λ = ${fmt(l)} Å  →  E = ${fmt(HC / l)} keV,  k = ${fmt((2 * Math.PI) / l)} Å⁻¹`); return; }
      const e = num(v);
      print(`E = ${fmt(e)} keV  →  λ = ${fmt(HC / e)} Å,  k = ${fmt((2 * Math.PI * e) / HC)} Å⁻¹`);
    },
    bragg: ([d, e]) => {
      const s = HC / num(e) / (2 * num(d));
      if (s > 1) throw new Error('no reflection: λ > 2d');
      const th = (Math.asin(s) * 180) / Math.PI;
      print(`θ = ${fmt(th)}°,  2θ = ${fmt(2 * th)}°,  q = ${fmt((2 * Math.PI) / num(d))} Å⁻¹`);
    },
    q: ([tth, e]) => {
      const q = ((4 * Math.PI) / (HC / num(e))) * Math.sin((num(tth) * Math.PI) / 360);
      print(`q = ${fmt(q)} Å⁻¹,  d = ${fmt((2 * Math.PI) / q)} Å`);
    },
    d: ([q]) => print(`d = ${fmt((2 * Math.PI) / num(q))} Å`),
    calc: (args) => print(`= ${fmt(calc(args.join(' ')), 10)}`),
    new: (args) => {
      const title = args.join(' ') || 'Untitled note';
      window.open(newNoteUrl(title), '_blank', 'noopener');
      print(`Opened GitHub editor for “${title}”. Commit it and it is live in about a minute.`);
    },
    notes: async () => {
      const r = await fetch('/notes/feed.json');
      const posts = r.ok ? await r.json().catch(() => null) : null;
      if (!posts) throw new Error('notes feed unavailable here (it is generated by the Jekyll build on GitHub Pages)');
      if (!posts.length) return print('No notes yet. Start one: new <title>');
      posts.forEach((p) => print(`${p.date}  ${p.title}  ${location.origin}${p.url}`));
      const days = Math.floor((Date.now() - new Date(posts[0].date)) / 864e5);
      print(days === 0 ? 'Last note: today. Nice.' : `Last note: ${days} day${days > 1 ? 's' : ''} ago.`, 'dim');
    },
    idea: (a) => list('idea', a),
    ideas: () => list('idea', []),
    todo: (a) => list('todo', a),
    todos: () => list('todo', []),
    open: ([name]) => {
      const url = LINKS[(name || '').toLowerCase()];
      if (!url) throw new Error(`open: ${Object.keys(LINKS).join(' | ')}`);
      window.open(url, '_blank', 'noopener');
    },
    gh: async () => {
      const r = await fetch('https://api.github.com/users/SJB7777/events/public?per_page=30');
      if (!r.ok) throw new Error(`GitHub API ${r.status}`);
      const seen = new Set();
      for (const ev of await r.json()) {
        if (seen.has(ev.repo.name) || seen.size >= 8) continue;
        seen.add(ev.repo.name);
        print(`${ev.created_at.slice(0, 10)}  ${ev.type.replace('Event', '').padEnd(12)} ${ev.repo.name}`);
      }
    },
    theme: () => document.querySelector('#theme')?.click(),
    clear: () => output.replaceChildren(),
    exit: () => dialog.close(),
  };

  const history = store.get('isaac-history', []);
  let cursor = history.length;
  input.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    cursor = Math.max(0, Math.min(history.length, cursor + (e.key === 'ArrowUp' ? -1 : 1)));
    input.value = history[cursor] ?? '';
  });

  dialog.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const line = input.value.trim();
    input.value = '';
    if (!line) return;
    history.push(line);
    store.set('isaac-history', history.slice(-50));
    cursor = history.length;
    const [name, ...args] = line.split(/\s+/);
    const cmd = name.toLowerCase();
    if (cmd !== 'clear') print('❯ ' + line, 'cmd');
    if (!Object.hasOwn(commands, cmd)) return print(`Unknown command: ${cmd}. Try 'help'.`);
    try { await commands[cmd](args); } catch (err) { print(`error: ${err.message}`, 'err'); }
  });
})();
