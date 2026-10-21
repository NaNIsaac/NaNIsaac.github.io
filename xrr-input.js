// Model input for ReflectoLearn's exported CNN, built as model.json's contract describes it
// (the same steps as reflectolearn.predict.preprocess_measured).
// tests/xrr-input.test.cjs checks it against ReflectoLearn's tests/golden/onnx_input.json.

// The grid exactly as torch.linspace builds it in float32: from the start for the first half, from
// the stop for the rest. A float64 linspace differs by up to 7e-8 1/Å, which moves log10 R by up to
// 4e-5 on steep fringes.
function qGrid(contract) {
  const { start, stop, points } = contract.input.q_grid;
  const f = Math.fround;
  const step = f(f(f(stop) - f(start)) / f(points - 1));
  return Float64Array.from({ length: points }, (_, i) =>
    i < points >> 1 ? f(f(start) + f(step * i)) : f(f(stop) - f(step * (points - 1 - i))));
}

// Linear interpolation of ascending (q, y) at each grid point; NaN outside [q[0], q[last]].
function interpolate(grid, q, y) {
  const out = new Float64Array(grid.length);
  let j = 0;
  for (let i = 0; i < grid.length; i++) {
    const g = grid[i];
    if (!(g >= q[0] && g <= q[q.length - 1])) { out[i] = NaN; continue; }
    while (j < q.length - 2 && q[j + 1] < g) j++;
    const t = (g - q[j]) / (q[j + 1] - q[j]);
    out[i] = g === q[j + 1] ? y[j + 1] : y[j] + t * (y[j + 1] - y[j]);
  }
  return out;
}

// x as a Float32Array of shape (1, 2, Q), row-major: [log10 R channel..., mask channel...].
function modelInput(q, intensity, contract) {
  const order = Array.from(q, (_, i) => i).sort((a, b) => q[a] - q[b]);
  const qs = order.map((i) => q[i]);
  const ys = order.map((i) => intensity[i]);
  const grid = qGrid(contract);
  const values = interpolate(grid, qs, ys);
  const n = grid.length;
  let max = 0;
  for (const v of values) if (Number.isFinite(v)) max = Math.max(max, Math.max(v, 0));
  const scale = Math.max(max, 1e-30);
  const x = new Float32Array(2 * n);
  for (let i = 0; i < n; i++) {
    const measured = Number.isFinite(values[i]);
    const r = Math.max(Math.max(measured ? values[i] : 0, 0) / scale, 1e-15);
    x[i] = measured ? Math.min(Math.log10(r), 0) : contract.input.log_floor;
    x[n + i] = measured ? 1 : 0;
  }
  return x;
}

if (typeof module === 'object') module.exports = { qGrid, modelInput };
