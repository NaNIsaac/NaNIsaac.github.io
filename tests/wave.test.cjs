// Run: node tests/wave.test.cjs
const assert = require('node:assert');
const { createWave } = require('../wave.js');

function energyRightOf(sim, x0) {
  let e = 0;
  for (let y = 0; y < sim.h; y++) for (let x = x0; x < sim.w; x++) e += sim.field[y * sim.w + x] ** 2;
  return e;
}

// Stays finite and bounded under continuous driving.
const sim = createWave(160, 90);
sim.sources.push({ x: 40, y: 35 }, { x: 40, y: 55 });
sim.setBarrier(100, [{ y: 38, half: 3 }, { y: 52, half: 3 }]);
for (let i = 0; i < 4000; i++) sim.step();
let max = 0;
for (const v of sim.field) { assert.ok(Number.isFinite(v)); max = Math.max(max, Math.abs(v)); }
assert.ok(max < 5, `amplitude ran away: ${max}`);

// Sponge absorbs: after sources stop, the field decays.
const before = energyRightOf(sim, 0);
sim.sources.length = 0;
for (let i = 0; i < 3000; i++) sim.step();
assert.ok(energyRightOf(sim, 0) < before * 1e-2, 'field did not decay after sources removed');

// A closed barrier blocks transmission; open slits let energy through.
function transmitted(gaps) {
  const s = createWave(160, 90);
  s.sources.push({ x: 40, y: 45 });
  s.setBarrier(80, gaps);
  for (let i = 0; i < 400; i++) s.step();
  return energyRightOf(s, 82);
}
const open = transmitted([{ y: 38, half: 3 }, { y: 52, half: 3 }]);
const closed = transmitted([]);
assert.ok(closed < open * 1e-3, `closed=${closed} open=${open}`);

console.log('wave: ok');
