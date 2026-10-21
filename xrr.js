// X-ray specular reflectivity of a layer stack: Parratt recursion with Névot–Croce roughness.
// Same physics and conventions as ReflectoLearn's reference engine (benchmark.parratt):
//   q in 1/Å; SLD in 1e-6/Å² as [real, imag] with imag > 0 absorbing; thickness and rms roughness
//   in Å; layers from the ambient down to the substrate, roughness = that layer's top interface.
// tests/xrr.test.cjs checks it against ReflectoLearn's golden curves (tests/golden/xrr.json).

// Complex numbers as [re, im].
const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
function cdiv(a, b) {
  const d = b[0] * b[0] + b[1] * b[1];
  return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
}
function cexp(a) {
  const m = Math.exp(a[0]);
  return [m * Math.cos(a[1]), m * Math.sin(a[1])];
}
// Principal square root (Re ≥ 0), as numpy's sqrt. The larger part comes from |z| ± Re and the
// other as Im/(2t): taking both from |z| ± Re loses digits when Im is tiny (weak absorbers, high q).
function csqrt(a) {
  const [x, y] = a;
  if (x === 0 && y === 0) return [0, y];
  const r = Math.hypot(x, y);
  if (x >= 0) {
    const t = Math.sqrt((r + x) / 2);
    return [t, y / (2 * t)];
  }
  const t = Math.sqrt((r - x) / 2);
  const negative = y < 0 || Object.is(y, -0);
  return [Math.abs(y) / (2 * t), negative ? -t : t];
}

// |r(q)|² for each q. `layers`: [{ sld: [re, im], thickness, roughness }, ...], at least two.
function reflectivity(q, layers) {
  const n = layers.length;
  if (n < 2) throw new Error('need an ambient and a substrate');
  // Conjugated SLD so the principal root gives Im k > 0 (decay into absorbers) in every layer.
  const sld = layers.map((l) => [l.sld[0] * 1e-6, -l.sld[1] * 1e-6]);
  const out = new Float64Array(q.length);
  const kz = new Array(n);
  for (let i = 0; i < q.length; i++) {
    const k0 = (q[i] / 2) ** 2;
    for (let j = 0; j < n; j++) {
      const v = csub(sld[j], sld[0]);
      // 0 - x, not -x: a lossless layer must keep Im = +0 so below the edge k = +i|k|, as in numpy
      kz[j] = csqrt([k0 - 4 * Math.PI * v[0], 0 - 4 * Math.PI * v[1]]);
    }
    let x = [0, 0];
    for (let j = n - 2; j >= 0; j--) {
      const k1 = kz[j], k2 = kz[j + 1];
      const sigma = layers[j + 1].roughness;
      const damp = cexp(cmul([-2 * sigma * sigma, 0], cmul(k1, k2)));
      const r = cmul(cdiv(csub(k1, k2), cadd(k1, k2)), damp);
      const d = j + 1 < n - 1 ? layers[j + 1].thickness : 0;
      const xp = cmul(x, cexp(cmul([0, 2 * d], k2)));
      x = cdiv(cadd(r, xp), cadd([1, 0], cmul(r, xp)));
    }
    out[i] = x[0] * x[0] + x[1] * x[1];
  }
  return out;
}

if (typeof module === 'object') module.exports = { reflectivity };
