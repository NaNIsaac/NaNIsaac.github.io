// Run: node tests/xrr.test.cjs
// xrr.js against ReflectoLearn's golden curves (tests/golden/xrr.json, a copy of ReflectoLearn's
// tests/golden/xrr.json from benchmark.parratt in float64), plus the textbook limits.
const assert = require('node:assert');
const path = require('node:path');
const { reflectivity } = require('../xrr.js');
const golden = require(path.join(__dirname, 'golden', 'xrr.json'));

for (const stack of golden.stacks) {
  const got = reflectivity(golden.q, stack.layers);
  let worst = 0;
  for (let i = 0; i < got.length; i++) worst = Math.max(worst, Math.abs(Math.log10(got[i]) - Math.log10(stack.R[i])));
  assert.ok(worst < 1e-10, `${stack.name}: max |Δlog10 R| = ${worst}`);
}

// Bare substrate: total reflection below the edge, Fresnel's q^-4 tail above it.
const si = [{ sld: [0, 0], thickness: 0, roughness: 0 }, { sld: [20.07, 0], thickness: 0, roughness: 0 }];
const qc = 4 * Math.sqrt(Math.PI * 20.07e-6);
for (const r of reflectivity([0.2 * qc, 0.5 * qc, 0.9 * qc], si)) assert.ok(Math.abs(r - 1) < 1e-12, `below edge R = ${r}`);
const tail = reflectivity([0.8, 1.0], si).map((r, i) => r * [0.8, 1.0][i] ** 4);
for (const t of tail) assert.ok(Math.abs(t / (qc ** 4 / 16) - 1) < 2e-2, `q^-4 tail ${t}`);

console.log(`xrr: ${golden.stacks.length} golden stacks ok`);
