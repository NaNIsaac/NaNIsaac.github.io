import test from 'node:test';
import assert from 'node:assert/strict';
import {createExperimentState, validateExperimentState, encodeShareParameters, decodeShareParameters} from './experiment-state.mjs';
import {observeDiffraction, validateModelAgreement} from './diffraction-adapter.mjs';

test('defaults have independent state and validated boundaries', () => {
  const one = createExperimentState(), two = createExperimentState();
  one.mission.attempts = 3;
  assert.equal(two.mission.attempts, 0);
  assert.deepEqual(validateExperimentState(one), one);
  assert.throws(() => createExperimentState({rotationDeg: Infinity, wavelengthRatio: .58}), RangeError);
  assert.throws(() => createExperimentState({rotationDeg: -28, wavelengthRatio: 0}), RangeError);
});
test('invalid and stale mission records fail explicitly', () => {
  assert.throws(() => validateExperimentState({...createExperimentState(), schemaVersion: 2}), RangeError);
  assert.throws(() => validateExperimentState({...createExperimentState(), mission: {step:'complete', attempts:0, hintLevel:0, completed:false}}), RangeError);
});
test('share links round-trip parameters but never carry achievements', () => {
  const original = {rotationDeg: -16.9, wavelengthRatio: .58};
  const url = encodeShareParameters(original, 'explore');
  assert.deepEqual(decodeShareParameters('?'+url), {parameters: original, mode:'explore'});
  assert.ok(!url.includes('attempts') && !url.includes('completed'));
  assert.throws(() => decodeShareParameters('v=1&angle=&ratio=.58&mode=explore'), RangeError);
  assert.throws(() => decodeShareParameters('v=0&angle=-28&ratio=.58&mode=explore'), RangeError);
});
test('two physics modules agree for the usable ratio range', () => {
  for (const ratio of [.36, .4, .58, .75, .9]) assert.equal(validateModelAgreement(ratio), true);
});
test('adapter preserves numeric observables and detector shape', () => {
  const r = observeDiffraction({rotationDeg: -Math.asin(.58/2)*180/Math.PI, wavelengthRatio: .58}, {width:8,height:6});
  assert.ok(Math.abs(r.normalizedIntensity-1)<1e-12);
  assert.ok(Math.abs(r.ewaldMismatch)<1e-12);
  assert.equal(r.detector.pixels.length, 48);
});
