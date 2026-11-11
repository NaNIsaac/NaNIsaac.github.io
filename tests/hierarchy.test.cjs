// Run: node tests/hierarchy.test.cjs
// Guard the section hierarchy and all calculator IDs used by tools.js.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const home = read('index.html');
const tools = read('tools/index.html');
const style = read('style.css');

function uniqueIds(html, label) {
  const ids = [...html.matchAll(/\\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, label + ': duplicate id');
  return new Set(ids);
}

const homeIds = uniqueIds(home, 'home');
const toolIds = uniqueIds(tools, 'tools');
const directory = home.indexOf('class="home-directory wrap"');
assert.ok(directory > 0 && directory < home.indexOf('id="research"'), 'editorial directory before detailed research');
assert.ok(!home.includes('home-gateway-grid'), 'duplicative dashboard gateway removed');
for (const target of ['#tratt', '#phase', '#measure', 'lab/', 'tools/']) {
  const nav = home.slice(directory, home.indexOf('</nav>', directory));
  assert.ok(nav.includes('href="' + target + '"'), 'directory link missing: ' + target);
}
for (const id of ['tratt', 'phase', 'measure', 'work']) {
  assert.ok(homeIds.has(id), 'destination exists: ' + id);
}
for (const id of ['quick-tools', 'geometry', 'sample-beam']) {
  assert.ok(toolIds.has(id), 'workbench category exists: ' + id);
}
assert.ok(tools.indexOf('id="peak-shift"') < tools.indexOf('id="shannon-sampling"'));
assert.ok(tools.indexOf('id="shannon-sampling"') < tools.indexOf('id="momentum-transfer"'));
const original = [
  'e-kev', 'e-ang', 'ps-old-e', 'ps-target-e', 'ps-old-tth', 'ps-out',
  'sh-sdd', 'sh-size', 'sh-pixel', 'sh-out', 'b-tth', 'b-q', 'b-d', 'b-out',
  'f-h', 'f-a', 'f-s', 'f-out', 'f-fig', 'a-t', 'a-l', 'a-out',
  's-tth', 's-w', 's-k', 's-out', 'l-a', 'l-b', 'l-c', 'l-h', 'l-k',
  'l-l', 'l-out', 'l-systems', 'l-centrings', 'l-peaks', 'share',
];
for (const id of original) assert.ok(toolIds.has(id), 'calculator hook missing: ' + id);
assert.equal((tools.match(/<section class="tool(?: tool-wide)?"/g) || []).length, 7);
assert.ok(style.includes('.home-directory') && style.includes('.workbench-featured'));
assert.ok(!home.includes('gateway-satellites'), 'duplicative first graphic removed');
assert.ok(!style.includes('.gateway-feature'), 'old dashboard styles removed');
assert.ok(style.includes('.tools #quick-tools .tool-grid { grid-template-columns: 1fr;'), 'phone calculators use readable single column');
assert.ok(style.includes('.tools .beam { position: relative;'), 'mobile beam panel does not cover results');

// The first research introduction has a single narrative and exactly three approaches.
const researchStart = home.indexOf('id="research"');
const researchEnd = home.indexOf('id="experience"', researchStart);
const researchIntro = home.slice(researchStart, researchEnd);
assert.ok(researchIntro.includes('data-ko="측정에서 구조까지"'), 'research overview heading');
assert.equal((researchIntro.match(/<p data-ko="<b>0[123] · /g) || []).length, 3, 'three research approaches');
assert.ok(researchIntro.includes('assets/img/workshop-xrr-talk.jpg'), 'research photograph retained');
assert.ok(style.includes('#research .intro-cols { grid-template-columns: repeat(2, minmax(0, 1fr));'), 'compact two-column mobile approach');


// Editorial hero: copy is the first grid child; the original working wave simulation is second.
const heroStart = home.indexOf('<section class="hero"');
const heroEnd = home.indexOf('</section>', heroStart);
const hero = home.slice(heroStart, heroEnd);
assert.ok(hero.includes('class="hero-stage"'), 'split hero wrapper exists');
assert.ok(hero.indexOf('class="hero-copy"') < hero.indexOf('class="film"'), 'research copy precedes wave canvas');
assert.ok(hero.includes('id="wave"') && hero.includes('id="pause"') && hero.includes('class="film-bar"'), 'live wave and controls preserved');
assert.ok(style.includes('grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);'), 'desktop uses 7:5 proportions');
assert.ok(style.includes('flex-direction: column;') && style.includes('.hero-stage .film'), 'phone stacks the intro before the canvas');
assert.ok(!home.includes('hero-wave-canvas'), 'do not replace the real wave simulation with the mockup');


// Each research case presents its principal finding before detailed exposition.
for (const [id, titleId] of [['tratt', 'tratt-title'], ['phase', 'phase-title'], ['measure', 'measure-title']]) {
  const start = home.indexOf('id="' + id + '"');
  const end = home.indexOf('</section>', start);
  const section = home.slice(start, end);
  assert.ok(section.includes('class="case-takeaway"'), 'takeaway missing in ' + id);
  assert.ok(section.includes('class="fineprint"'), 'validation caveat missing in ' + id);
  assert.ok(section.indexOf('id="' + titleId + '"') < section.indexOf('class="case-takeaway"'), 'takeaway follows case heading: ' + id);
}
assert.ok(style.includes('#phase.measure { display: flex; flex-direction: column;'), 'phone shows BCDI explanation before video');

console.log('hierarchy: ok');
