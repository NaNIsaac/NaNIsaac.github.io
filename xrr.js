// X-ray reflectivity of a layer stack, Parratt recursion with Névot–Croce roughness.
// Units: q in Å⁻¹, thickness and roughness in Å, SLD ρ in Å⁻² (X-ray: r_e × electron density).
// Absorption is neglected (real SLDs), which is fine for the shape of the fringes shown here.
// layers: [{ rho, d, sigma }] from the top (below air); substrate: { rho, sigma } (sigma of its top interface).
function reflectivity(q, layers, substrate) {
  const media = [{ rho: 0 }, ...layers, substrate];
  // kz_j = sqrt((q/2)² − 4π ρ_j), complex when the wave is evanescent below the critical angle
  const kz = media.map((m) => csqrt(q * q / 4 - 4 * Math.PI * m.rho));
  let X = [0, 0]; // no reflection from below the substrate
  for (let j = media.length - 2; j >= 0; j--) {
    const a = kz[j], b = kz[j + 1];
    const sigma = (j + 1 < media.length - 1 ? layers[j].sigma : substrate.sigma) || 0;
    let r = cdiv(csub(a, b), cadd(a, b));
    r = cmul(r, cexp(cscale(cmul(a, b), -2 * sigma * sigma)));
    // phase through layer j+1 (the substrate is semi-infinite: no phase)
    const ph = j + 1 < media.length - 1 ? cexp(cmul([0, 2 * layers[j].d], b)) : [1, 0];
    const Xp = cmul(X, ph);
    X = cdiv(cadd(r, Xp), cadd([1, 0], cmul(r, Xp)));
  }
  return X[0] * X[0] + X[1] * X[1];
}

function csqrt(x) { return x >= 0 ? [Math.sqrt(x), 0] : [0, Math.sqrt(-x)]; }
function cadd(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
function csub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
function cmul(a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; }
function cscale(a, s) { return [a[0] * s, a[1] * s]; }
function cdiv(a, b) { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; }
function cexp(a) { const e = Math.exp(a[0]); return [e * Math.cos(a[1]), e * Math.sin(a[1])]; }

if (typeof module === 'object') module.exports = { reflectivity };
