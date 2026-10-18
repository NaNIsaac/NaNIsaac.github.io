// Beamline arithmetic. Energies in keV, lengths in Å unless named otherwise, angles in degrees.
const HC = 12.398419843320026; // h·c in keV·Å (CODATA 2018)
const rad = (deg) => (deg * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

const calc = {
  wavelength: (keV) => HC / keV, // λ = hc / E
  energy: (angstrom) => HC / angstrom,
  // Bragg: λ = 2 d sin θ. Returns 2θ, or NaN when λ > 2d (no reflection possible).
  twoTheta: (d, lambda) => 2 * deg(Math.asin(lambda / (2 * d))),
  // q = 4π sin θ / λ, with θ half the scattering angle 2θ
  q: (twoTheta, lambda) => (4 * Math.PI * Math.sin(rad(twoTheta / 2))) / lambda,
  dFromQ: (q) => (2 * Math.PI) / q,
  twoThetaFromQ: (q, lambda) => 2 * deg(Math.asin((q * lambda) / (4 * Math.PI))),
  // Cubic lattice: d = a / √(h² + k² + l²)
  dCubic: (a, h, k, l) => a / Math.hypot(h, k, l),
  // Beam footprint on a flat sample at grazing incidence α: L = h / sin α (same unit as h)
  footprint: (height, alpha) => height / Math.sin(rad(alpha)),
  // Largest incidence angle at which the footprint still overfills a sample of length s: sin α = h / s
  fillAngle: (height, sampleLength) => deg(Math.asin(height / sampleLength)),
  // Transmission through thickness t of a material with attenuation length ℓ (same units)
  transmission: (t, attLength) => Math.exp(-t / attLength),
  // Film thickness from the Kiessig fringe period Δq: t = 2π / Δq
  kiessig: (dq) => (2 * Math.PI) / dq,
  // Small-angle fringe period in q from a period in 2θ: Δq ≈ 2π Δ(2θ) / λ
  dqFromTwoTheta: (dTwoTheta, lambda) => (2 * Math.PI * rad(dTwoTheta)) / lambda,
  // Scherrer: τ = K λ / (β cos θ), β the peak FWHM in 2θ (degrees). Same length unit as λ.
  scherrer: (twoTheta, fwhm, lambda, K = 0.9) => (K * lambda) / (rad(fwhm) * Math.cos(rad(twoTheta / 2))),
  // Unit cell {a, b, c in Å; al, be, ga in degrees}: volume, and d(hkl) from the general triclinic
  // form 1/d² = h·G*·h, which every Bravais lattice reduces to.
  volume: ({ a, b, c, al, be, ga }) => {
    const [ca, cb, cg] = [al, be, ga].map((x) => Math.cos(rad(x)));
    return a * b * c * Math.sqrt(1 - ca * ca - cb * cb - cg * cg + 2 * ca * cb * cg);
  },
  dSpacing: (cell, h, k, l) => {
    const { a, b, c, al, be, ga } = cell;
    const [ca, cb, cg] = [al, be, ga].map((x) => Math.cos(rad(x)));
    const [sa, sb, sg] = [al, be, ga].map((x) => Math.sin(rad(x)));
    const V = calc.volume(cell);
    const s = h * h * b * b * c * c * sa * sa + k * k * a * a * c * c * sb * sb + l * l * a * a * b * b * sg * sg
      + 2 * h * k * a * b * c * c * (ca * cb - cg) + 2 * k * l * a * a * b * c * (cb * cg - ca) + 2 * h * l * a * b * b * c * (ca * cg - cb);
    return V / Math.sqrt(s);
  },
  // Lattice centring that makes (hkl) systematically absent, or null if it is allowed.
  // R is the rhombohedral lattice on hexagonal axes, obverse setting: −h + k + l = 3n.
  absentBy: (centring, h, k, l) => {
    const odd = (n) => Math.abs(n) % 2 === 1;
    if (centring === 'I' && odd(h + k + l)) return 'I';
    if (centring === 'F' && !(odd(h) === odd(k) && odd(k) === odd(l))) return 'F';
    if (centring === 'C' && odd(h + k)) return 'C';
    if (centring === 'R' && ((-h + k + l) % 3 + 3) % 3 !== 0) return 'R';
    return null;
  },
};

if (typeof module === 'object') module.exports = { calc, HC };
