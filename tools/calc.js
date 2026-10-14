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
  // Beam footprint on a flat sample at grazing incidence α: L = h / sin α (same unit as h)
  footprint: (height, alpha) => height / Math.sin(rad(alpha)),
  // Transmission through thickness t of a material with attenuation length ℓ (same units)
  transmission: (t, attLength) => Math.exp(-t / attLength),
};

if (typeof module === 'object') module.exports = { calc, HC };
