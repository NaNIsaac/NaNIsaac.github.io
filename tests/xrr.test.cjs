// Run: node tests/xrr.test.cjs
const assert = require('node:assert');
const { reflectivity } = require('../xrr.js');

const Si = { rho: 2.0e-5, sigma: 0 };
const qc = 4 * Math.sqrt(Math.PI * Si.rho); // critical edge of the bare substrate

// Total external reflection below the critical edge.
assert.ok(Math.abs(reflectivity(0.5 * qc, [], Si) - 1) < 1e-9, 'R < 1 below the critical edge');

// Far above it the bare substrate follows the Fresnel q⁻⁴ tail: R ≈ (qc / 2q)⁴.
const q = 8 * qc, fresnel = (qc / (2 * q)) ** 4;
assert.ok(Math.abs(reflectivity(q, [], Si) / fresnel - 1) < 0.05, 'Fresnel tail');

// A film writes Kiessig fringes with period Δq ≈ 2π / t.
const t = 200, film = [{ rho: 3.3e-5, d: t, sigma: 0 }];
const minima = [];
let prev = Infinity, falling = false;
for (let k = 0; k < 4000; k++) {
  const qq = 0.08 + k * 0.00005, r = reflectivity(qq, film, Si);
  if (r > prev && falling) minima.push(qq);
  falling = k > 0 && r < prev; prev = r;
}
const spacing = (minima.at(-1) - minima[0]) / (minima.length - 1);
assert.ok(Math.abs(spacing / ((2 * Math.PI) / t) - 1) < 0.05, `Kiessig spacing ${spacing}`);

// Roughness damps reflectivity at high q.
assert.ok(reflectivity(0.2, [{ ...film[0], sigma: 8 }], { ...Si, sigma: 8 }) < reflectivity(0.2, film, Si), 'roughness');

console.log('xrr: ok');
