// Run: node tests/i18n.test.cjs
// The Korean copy is written on its own, not translated line by line, so the two languages may differ
// in wording and order. They must still point to the same places, and every video cue needs both lines.
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pages = ['index.html', 'lab/index.html', 'tools/index.html'];
const decode = (s) => s.replaceAll('&quot;', '"').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
const hrefs = (html) => [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]).sort();

function innerHtml(html, tag, from) {
  const open = new RegExp(`<${tag}[\\s>]|</${tag}>`, 'g');
  open.lastIndex = from;
  let depth = 1;
  for (let m; (m = open.exec(html)); ) {
    depth += m[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return html.slice(from, m.index);
  }
  throw new Error(`unclosed <${tag}>`);
}

let checked = 0;
for (const file of pages) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  for (const m of html.matchAll(/<(\w+)\b[^>]*?\sdata-ko="([^"]*)"[^>]*>/g)) {
    const en = innerHtml(html, m[1], m.index + m[0].length);
    const ko = decode(m[2]);
    assert.ok(ko.trim(), `${file}: empty data-ko on <${m[1]}>`);
    assert.deepStrictEqual(hrefs(ko), hrefs(en), `${file}: links differ between languages in "${ko.slice(0, 40)}"`);
    checked++;
  }
  for (const m of html.matchAll(/data-cues='([^']*)'/g)) {
    for (const cue of JSON.parse(m[1])) assert.ok(cue.en && cue.ko && Number.isFinite(cue.t), `${file}: cue at ${cue.t}`);
  }
}
// On the home page, a screen reader in Korean mode hears Korean: every picture and movie carries its Korean text.
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const [tag, attr, ko] of [['img', 'alt', 'data-ko-alt'], ['video', 'aria-label', 'data-ko-label'], ['canvas', 'aria-label', 'data-ko-label']]) {
  for (const m of home.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'g'))) {
    if (!m[0].includes(` ${attr}="`)) continue;
    assert.match(m[0], new RegExp(`\\s${ko}="[^"]+"`), `index.html: <${tag}> ${attr} without ${ko}`);
    checked++;
  }
}
// A nav link names the section it lands on, in both languages.
for (const file of [...pages, '_layouts/base.html']) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const navs = [...html.matchAll(/<nav\b[\s\S]*?<\/nav>/g)].map((n) => n[0]).join('\n');
  for (const m of navs.matchAll(/<a\b[^>]*href="[^"]*#research"[^>]*>([^<]*)<\/a>/g)) {
    assert.strictEqual(m[1], 'Research', `${file}: link to #research reads "${m[1]}"`);
    assert.match(m[0], /data-ko="연구"/, `${file}: link to #research without data-ko="연구"`);
    checked++;
  }
}
console.log(`i18n: ${checked} strings ok`);
