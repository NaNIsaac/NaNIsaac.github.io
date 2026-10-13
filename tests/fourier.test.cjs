// Run: node tests/fourier.test.cjs
const assert = require('node:assert');
const { createFourier } = require('../fourier.js');

const N = 64;
const F = createFourier(N);
const energy = (re, im) => re.reduce((s, v, i) => s + v * v + im[i] * im[i], 0);

// Round trip on a random complex field.
const re = Float64Array.from({ length: N * N }, () => Math.random() - 0.5);
const im = Float64Array.from({ length: N * N }, () => Math.random() - 0.5);
const r0 = re.slice(), i0 = im.slice();
F.fft2(re, im);
// Parseval with this normalization: Σ|U|² = Σ|F|² / N²
const eField = energy(r0, i0), eSpec = energy(re, im) / (N * N);
assert.ok(Math.abs(eField - eSpec) / eField < 1e-10, `Parseval ${eField} vs ${eSpec}`);
F.fft2(re, im, true);
let err = 0;
for (let i = 0; i < re.length; i++) err = Math.max(err, Math.abs(re[i] - r0[i]), Math.abs(im[i] - i0[i]));
assert.ok(err < 1e-10, `round trip error ${err}`);

// Delta at origin -> flat spectrum; constant -> delta at DC (checks sign/normalization).
const d = new Float64Array(N * N), dz = new Float64Array(N * N);
d[0] = 1;
F.fft2(d, dz);
assert.ok(d.every((v) => Math.abs(v - 1) < 1e-12) && dz.every((v) => Math.abs(v) < 1e-12));

// Centered circle: spectrum is real and rotationally symmetric (x/y swap, ± frequency).
const c = F.aperture('circle', 10), cz = new Float64Array(N * N);
F.fft2(c, cz);
for (const k of [1, 3, 7]) {
  const a = c[k], b = c[k * N], m = c[N - k];
  assert.ok(Math.abs(a - b) < 1e-9 && Math.abs(a - m) < 1e-9, `circle symmetry at k=${k}`);
}

// Double slit: fringe period in the spectrum shrinks as separation grows (first zero moves inward).
function firstMin(sep) {
  const t = F.aperture('double', 2, sep), tz = new Float64Array(N * N);
  F.fft2(t, tz);
  for (let k = 1; k < N / 2; k++) if (t[k] * t[k] + tz[k] * tz[k] < 1e-6 * (t[0] * t[0])) return k;
  let best = 1;
  for (let k = 1; k < N / 2; k++) if (Math.hypot(t[k], tz[k]) < Math.hypot(t[best], tz[best])) best = k;
  return best;
}
assert.ok(firstMin(24) < firstMin(10), 'wider separation should give finer fringes');

// Low-pass keeps DC and removes high frequencies; high-pass removes DC.
const low = F.mask('low', 0.1), high = F.mask('high', 0.1);
assert.strictEqual(low[0], 1);
assert.strictEqual(high[0], 0);
assert.strictEqual(low[N / 2], 0);
assert.strictEqual(high[N / 2], 1);

console.log('fourier: ok');
