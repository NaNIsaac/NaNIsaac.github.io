// Fourier-optics sandbox math: complex N×N fields, radix-2 FFT, apertures, frequency filters.
// Convention: forward F = Σ U e^{-2πi(kx+ly)/N} (unnormalized), inverse carries 1/N².
// Arrays are stored unshifted (index 0 = zero frequency / origin); shifting is a display concern.
function createFourier(N) {
  if (N & (N - 1)) throw new Error('N must be a power of two');
  const bits = Math.log2(N);
  const rev = new Uint32Array(N);
  for (let i = 0; i < N; i++) {
    let r = 0;
    for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b);
    rev[i] = r;
  }
  const cos = new Float64Array(N / 2), sin = new Float64Array(N / 2);
  for (let i = 0; i < N / 2; i++) { cos[i] = Math.cos((2 * Math.PI * i) / N); sin[i] = Math.sin((2 * Math.PI * i) / N); }
  const tr = new Float64Array(N), ti = new Float64Array(N);

  function fft1(re, im, off, stride, inverse) {
    for (let i = 0; i < N; i++) { tr[rev[i]] = re[off + i * stride]; ti[rev[i]] = im[off + i * stride]; }
    const sgn = inverse ? 1 : -1;
    for (let size = 2; size <= N; size <<= 1) {
      const half = size >> 1, step = N / size;
      for (let start = 0; start < N; start += size) {
        for (let j = 0; j < half; j++) {
          const wr = cos[j * step], wi = sgn * sin[j * step];
          const a = start + j, b = a + half;
          const xr = tr[b] * wr - ti[b] * wi, xi = tr[b] * wi + ti[b] * wr;
          tr[b] = tr[a] - xr; ti[b] = ti[a] - xi;
          tr[a] += xr; ti[a] += xi;
        }
      }
    }
    for (let i = 0; i < N; i++) { re[off + i * stride] = tr[i]; im[off + i * stride] = ti[i]; }
  }

  function fft2(re, im, inverse = false) {
    for (let y = 0; y < N; y++) fft1(re, im, y * N, 1, inverse);
    for (let x = 0; x < N; x++) fft1(re, im, x, N, inverse);
    if (inverse) { const s = 1 / (N * N); for (let i = 0; i < re.length; i++) { re[i] *= s; im[i] *= s; } }
  }

  // Signed coordinate of an unshifted index: 0..N/2-1, then -N/2..-1.
  const signed = (i) => (i < N / 2 ? i : i - N);

  // Aperture transmission t(x,y) ∈ [0,1], centered at the origin, sizes in samples: the fraction of
  // each sample covered by the shape (4×4 sub-samples, placed symmetrically), so curved edges are
  // not staircased. Interior samples are exactly 1 and outside ones exactly 0.
  const SUB = 4, subs = Array.from({ length: SUB }, (_, i) => (i + 0.5) / SUB - 0.5);
  function inside(kind, u, v, size, sep) {
    const r = Math.hypot(u, v);
    if (kind === 'circle') return r <= size;
    if (kind === 'ring') return r <= size && r >= size * 0.7;
    if (kind === 'slit') return Math.abs(u) <= size / 2 && Math.abs(v) <= N * 0.3;
    if (kind === 'double') return Math.abs(Math.abs(u) - sep / 2) <= size / 2 && Math.abs(v) <= N * 0.3;
    if (kind === 'square') return Math.abs(u) <= size && Math.abs(v) <= size;
    return false;
  }
  function aperture(kind, size, sep = 0) {
    const t = new Float64Array(N * N);
    for (let y = 0; y < N; y++) {
      const v = signed(y);
      for (let x = 0; x < N; x++) {
        const u = signed(x);
        const c = inside(kind, u - 0.5, v - 0.5, size, sep);
        if (c === inside(kind, u + 0.5, v - 0.5, size, sep) && c === inside(kind, u - 0.5, v + 0.5, size, sep) && c === inside(kind, u + 0.5, v + 0.5, size, sep)) { t[y * N + x] = +c; continue; } // not on an edge
        let n = 0;
        for (const dv of subs) for (const du of subs) n += inside(kind, u + du, v + dv, size, sep);
        t[y * N + x] = n / (SUB * SUB);
      }
    }
    return t;
  }

  // Frequency mask H: 'none' | 'low' | 'high'; cutoff in cycles/sample (0 … 0.5·√2).
  function mask(kind, cutoff) {
    const H = new Float64Array(N * N);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const f = Math.hypot(signed(x), signed(y)) / N;
        H[y * N + x] = kind === 'low' ? +(f <= cutoff) : kind === 'high' ? +(f > cutoff) : 1;
      }
    }
    return H;
  }

  return { N, fft2, aperture, mask, signed };
}

if (typeof module === 'object') module.exports = { createFourier };
