// Lab 2.0 state contract. Pure data utilities; no DOM or persistence side effects.
export const SCHEMA_VERSION = 1;
export const MODES = Object.freeze(['discover', 'explore', 'understand']);
const LIMITS = Object.freeze({rotationDeg: [-42, 10], wavelengthRatio: [0.36, 0.9]});
export function validateParameters(value) {
  if (!value || typeof value !== 'object') throw new TypeError('parameters object required');
  for (const [key, [min, max]] of Object.entries(LIMITS)) {
    if (typeof value[key] !== 'number' || !Number.isFinite(value[key]) || value[key] < min || value[key] > max)
      throw new RangeError(`${key} must be a finite number between ${min} and ${max}`);
  }
  return {rotationDeg: value.rotationDeg, wavelengthRatio: value.wavelengthRatio};
}
export function createExperimentState(parameters = {rotationDeg: -28, wavelengthRatio: 0.58}) {
  return {
    schemaVersion: SCHEMA_VERSION, id: 'diffraction-3d', mode: 'discover',
    parameters: validateParameters(parameters),
    mission: {step: 1, attempts: 0, hintLevel: 0, completed: false}
  };
}
export function validateExperimentState(value) {
  if (!value || typeof value !== 'object' || value.schemaVersion !== SCHEMA_VERSION || value.id !== 'diffraction-3d')
    throw new RangeError('Unsupported experiment state/version');
  if (!MODES.includes(value.mode)) throw new RangeError('Unknown experiment mode');
  const p = validateParameters(value.parameters);
  const m = value.mission;
  if (!m || ![1, 2, 'complete'].includes(m.step) ||
      !Number.isSafeInteger(m.attempts) || m.attempts < 0 ||
      !Number.isInteger(m.hintLevel) || m.hintLevel < 0 || m.hintLevel > 3 ||
      typeof m.completed !== 'boolean' ||
      (m.step === 'complete') !== m.completed)
    throw new RangeError('Invalid mission progress');
  return {schemaVersion: SCHEMA_VERSION, id: 'diffraction-3d', mode: value.mode,
    parameters: p, mission: {...m, step: m.step}};
}
export function encodeShareParameters(parameters, mode = 'explore') {
  const p = validateParameters(parameters);
  if (!MODES.includes(mode)) throw new RangeError('Unknown mode');
  const query = new URLSearchParams();
  query.set('v', String(SCHEMA_VERSION));
  query.set('angle', String(p.rotationDeg));
  query.set('ratio', String(p.wavelengthRatio));
  query.set('mode', mode);
  return query.toString();
}
export function decodeShareParameters(query) {
  const search = new URLSearchParams(String(query).replace(/^\?/, ''));
  if (search.get('v') !== String(SCHEMA_VERSION)) throw new RangeError('Unsupported URL version');
  const parse = key => {
    const raw = search.get(key);
    if (raw === null || raw.trim() === '') throw new RangeError(`Missing ${key}`);
    return Number(raw);
  };
  const mode = search.get('mode');
  if (!MODES.includes(mode)) throw new RangeError('Unknown mode');
  return {parameters: validateParameters({rotationDeg: parse('angle'), wavelengthRatio: parse('ratio')}), mode};
}
