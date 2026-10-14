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

// Point scatterers are hard cells and survive a barrier change.
const pts = createWave(60, 40);
pts.setPoints([{ x: 20, y: 20 }, { x: 26.4, y: 20 }]);
pts.setBarrier(40, [{ y: 20, half: 3 }]);
assert.ok(pts.wall[20 * 60 + 20] && pts.wall[20 * 60 + 26], 'points lost after setBarrier');
pts.setBarrier(null);
assert.ok(pts.wall[20 * 60 + 20] && !pts.wall[10 * 60 + 40], 'barrier removal broke points');

// A burst is finite: it drives for its length, then the packet leaves and the sponge takes it.
const b = createWave(120, 80);
b.burst(60, 40);
for (let i = 0; i < 4 * b.period + 1; i++) b.step();
assert.ok(b.bursts.length === 0, 'burst did not end');
let bmax = 0;
for (const v of b.field) bmax = Math.max(bmax, Math.abs(v));
assert.ok(bmax > 0.05 && bmax < 5, `burst amplitude ${bmax}`);

// Absorbing jaws send back much less than reflecting ones.
function reflected(absorb) {
  const s = createWave(200, 80);
  s.setBarrier(120, [], absorb);
  s.burst(70, 40);
  for (let i = 0; i < 230; i++) s.step(); // packet has hit the wall and come back past x = 90
  let e = 0;
  for (let y = 0; y < s.h; y++) for (let x = 20; x < 100; x++) e += s.field[y * s.w + x] ** 2;
  return e;
}
const refl = reflected(false), abs = reflected(true);
assert.ok(abs < refl * 0.25, `absorbing jaws reflect too much: ${abs} vs ${refl}`);

console.log('wave: ok');
