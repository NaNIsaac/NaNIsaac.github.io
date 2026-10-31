/* Kinematic scattering toy model for an ideal finite simple-cubic lattice.
 * A plane wave enters in the +x direction. Each identical point scatterer has
 * unit amplitude. The finite lattice form factor is a product of three
 * Dirichlet kernels. We deliberately do not model dynamical diffraction,
 * strain, absorption, detector response, or atomic form factors.
 */
export const TAU = 2 * Math.PI;
export const LATTICE = Object.freeze({ nx: 9, ny: 7, nz: 7 });

export function braggAngle(ratio) {
  if (!Number.isFinite(ratio) || ratio <= 0 || ratio >= 2) throw new RangeError('0 < wavelength / spacing < 2 required');
  return Math.asin(ratio / 2);
}

export function finiteLatticeFactor(n, qa) {
  if (!Number.isInteger(n) || n < 1) throw new RangeError('n must be a positive integer');
  const folded = ((qa + Math.PI) % TAU + TAU) % TAU - Math.PI;
  const den = Math.sin(folded / 2);
  if (Math.abs(den) < 1e-9) return 1;
  const value = Math.sin(n * folded / 2) / (n * den);
  return Math.max(0, Math.min(1, value * value));
}

export function scatteringIntensity(direction, phi, wavelengthOverSpacing, lattice = LATTICE) {
  const {x, y, z} = direction;
  const length = Math.hypot(x, y, z);
  if (!(length > 0)) return 0;
  const waveNumber = TAU / wavelengthOverSpacing;
  const qx = waveNumber * (x / length - 1);
  const qy = waveNumber * y / length;
  const qz = waveNumber * z / length;
  const c = Math.cos(phi), s = Math.sin(phi);
  const lx = c * qx - s * qz;
  const lz = s * qx + c * qz;
  return finiteLatticeFactor(lattice.nx, lx) *
    finiteLatticeFactor(lattice.ny, qy) *
    finiteLatticeFactor(lattice.nz, lz);
}

export function braggDirection(ratio) {
  const theta = braggAngle(ratio);
  return { x: Math.cos(2 * theta), y: 0, z: Math.sin(2 * theta) };
}

export function braggPeakIntensity(phi, ratio, lattice = LATTICE) {
  return scatteringIntensity(braggDirection(ratio), phi, ratio, lattice);
}

export function detectorPattern(phi, ratio, opts = {}) {
  const { width = 144, height = 112, x = 3.2, centerZ = 2.0,
    horizontalSpan = 3.4, verticalSpan = 2.5, lattice = LATTICE } = opts;
  const output = new Float32Array(width * height);
  let max = 0;
  for (let j = 0; j < height; j++) {
    const yy = (0.5 - (j + 0.5) / height) * verticalSpan;
    for (let i = 0; i < width; i++) {
      const zz = centerZ + ((i + 0.5) / width - 0.5) * horizontalSpan;
      const v = scatteringIntensity({x, y: yy, z: zz}, phi, ratio, lattice);
      output[j * width + i] = v;
      max = Math.max(max, v);
    }
  }
  return {pixels: output, width, height, max};
}
