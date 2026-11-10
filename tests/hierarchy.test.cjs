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
const gateway = home.indexOf('class="home-gateway wrap"');
assert.ok(gateway > 0 && gateway < home.indexOf('id="research"'), 'gateway before detailed research');
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
assert.ok(style.includes('.home-gateway-grid') && style.includes('.workbench-featured'));
assert.ok(home.includes('class="gateway-satellites"'), 'featured research uses a scientific schematic');
assert.ok(!home.includes('gateway-feature-art'), 'decorative bars removed');
assert.ok(home.includes('schematic, not measured data.'), 'scientific schematic is labeled');
assert.ok(style.includes('.tools #quick-tools .tool-grid { grid-template-columns: 1fr;'), 'phone calculators use readable single column');
assert.ok(style.includes('.tools .beam { position: relative;'), 'mobile beam panel does not cover results');
console.log('hierarchy: ok');
