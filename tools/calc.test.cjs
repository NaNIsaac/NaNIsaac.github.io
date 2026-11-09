// Run: node --test tools/calc.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const { calc } = require('./calc.js');

const close = (actual, expected, rel = 1e-10) =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.max(1, Math.abs(expected)),
    `expected ${actual} ≈ ${expected}`);

test('unchanged wavelength retains Bragg peak angle', () => {
  const r = calc.peakShift(28.44, 8.048, 8.048);
  assert.equal(r.accessible, true);
  close(r.newTwoTheta, 28.44);
  close(r.deltaTwoTheta, 0);
});

test('halving wavelength reduces the Bragg angle and preserves q', () => {
  const r = calc.peakShift(60, 8, 16);
  close(r.newTwoTheta, 2 * Math.asin(0.25) * 180 / Math.PI);
  assert.ok(r.deltaTwoTheta < 0);
  close(r.q, calc.q(60, calc.wavelength(8)));
});

test('inaccessible Bragg condition and invalid inputs', () => {
  assert.equal(calc.peakShift(120, 8, 4).accessible, false);
  assert.equal(calc.peakShift(28, 0, 8), null);
  assert.equal(calc.peakShift(0, 8, 8), null);
});

test('changing beam energy gives the new peak angle at fixed d', () => {
  const r = calc.peakShift(28.44, 8.048, 10);
  assert.equal(r.accessible, true);
  const expected = 2 * Math.asin((8.048 / 10) * Math.sin(28.44 * Math.PI / 360)) * 180 / Math.PI;
  close(r.newTwoTheta, expected);
  assert.ok(r.newTwoTheta < 28.44);
});

test('Shannon sampling dimensions, reciprocal pixel and critical SDD', () => {
  // 12.398419843 keV gives 1 Å; L=1000 mm, D=100 nm, p=100 µm:
  // speckle period=1000 µm, so s=10, and the s=2 SDD is 200 mm.
  const r = calc.shannonSampling(1000, 100, 12.398419843320026, 100);
  close(r.speckleUm, 1000);
  close(r.sampling, 10);
  close(r.minSddMm, 200);
  close(r.deltaQ, 2 * Math.PI * 1e-4);
  assert.equal(r.meetsNyquist, true);
});

test('sampling scales inversely with particle extent and pitch', () => {
  const a = calc.shannonSampling(500, 200, 10, 75);
  const b = calc.shannonSampling(500, 400, 10, 75);
  close(b.sampling, a.sampling / 2);
  const c = calc.shannonSampling(500, 200, 10, 150);
  close(c.sampling, a.sampling / 2);
  assert.equal(calc.shannonSampling(0, 200, 10, 75), null);
});
