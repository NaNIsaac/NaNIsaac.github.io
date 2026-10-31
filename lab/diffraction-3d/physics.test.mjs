import test from 'node:test';
import assert from 'node:assert/strict';
import {braggAngle, braggPeakIntensity, scatteringIntensity, braggDirection,
  finiteLatticeFactor, detectorPattern} from './physics.mjs';

const ratio = 0.58;
const phi = -braggAngle(ratio);
test('first-order Bragg angle obeys 2d sin(theta) = wavelength', () => {
  assert.ok(Math.abs(2 * Math.sin(-phi) - ratio) < 1e-12);
});
test('finite lattice factor is 1 at reciprocal lattice points', () => {
  for (const multiple of [-2, -1, 0, 1, 2])
    assert.ok(Math.abs(finiteLatticeFactor(9, 2*Math.PI*multiple) - 1) < 1e-11);
});
test('kinematic intensity is normalized and peaks at Bragg orientation', () => {
  const peak = braggPeakIntensity(phi, ratio);
  assert.ok(peak > 0.9999999999, `peak ${peak}`);
  const off = braggPeakIntensity(phi + 0.15, ratio);
  assert.ok(peak > off * 2, `peak ${peak}, off ${off}`);
});
test('rotation convention agrees with first reciprocal lattice vector', () => {
  assert.ok(scatteringIntensity(braggDirection(ratio), phi, ratio) > 0.9999999);
});
test('detector returns a finite, bounded field', () => {
  const map = detectorPattern(phi, ratio, {width: 32, height: 24});
  assert.equal(map.pixels.length, 768);
  assert.ok(map.max > 0.05 && map.max <= 1);
  for (const p of map.pixels) assert.ok(Number.isFinite(p) && p >= 0 && p <= 1);
});
test('input validation avoids impossible Bragg angle', () => {
  assert.throws(() => braggAngle(2.5), RangeError);
  assert.throws(() => finiteLatticeFactor(0, 2), RangeError);
});
