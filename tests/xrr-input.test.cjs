// Run: node tests/xrr-input.test.cjs
// xrr-input.js against ReflectoLearn's golden model input (tests/golden/onnx_input.json, a copy of
// ReflectoLearn's tests/golden/onnx_input.json): same curve, same x as predict builds.
const assert = require('node:assert');
const path = require('node:path');
const { modelInput, qGrid } = require('../xrr-input.js');
const golden = require(path.join(__dirname, 'golden', 'onnx_input.json'));

const n = golden.contract.input.q_grid.points;
const x = modelInput(golden.q, golden.intensity, golden.contract);
assert.strictEqual(x.length, 2 * n);
let worst = 0;
for (let i = 0; i < n; i++) {
  assert.strictEqual(x[n + i], golden.x_mask[i], `mask at ${i}`);
  worst = Math.max(worst, Math.abs(x[i] - golden.x_log[i]));
}
// qGrid rebuilds torch's float32 grid exactly, so only float32 rounding of x remains.
assert.ok(worst < 1e-6, `max |Δ log10 R| = ${worst}`);

// Order does not matter: load_measured_curve sorts a file before predict sees it.
const rev = modelInput([...golden.q].reverse(), [...golden.intensity].reverse(), golden.contract);
assert.deepStrictEqual(Array.from(rev), Array.from(x));

const grid = qGrid(golden.contract);
assert.strictEqual(grid.length, n);
assert.ok(Math.abs(grid[0] - golden.contract.input.q_grid.start) < 1e-12);

console.log(`xrr-input: ${golden.x_mask.filter(Boolean).length} of ${n} points match, max |Δ| = ${worst.toExponential(1)}`);
