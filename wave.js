// 2D scalar wave equation  u_tt = c^2 (u_xx + u_yy) + s, explicit leapfrog on square cells.
// r = c·dt/dx = 0.5, inside the 2D CFL limit 1/sqrt(2). Walls are Dirichlet (u = 0): an
// idealized reflecting barrier. Edges use a quadratic sponge band, not an exact PML.
// Units are grid cells and time steps; no SI mapping is claimed.
function createWave(w, h) {
  const n = w * h;
  let prev = new Float32Array(n), curr = new Float32Array(n), next = new Float32Array(n);
  const wall = new Uint8Array(n);
  const damp = new Float32Array(n);
  const band = Math.max(8, Math.round(Math.min(w, h) * 0.12));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = Math.min(x, y, w - 1 - x, h - 1 - y);
      const s = d < band ? (band - d) / band : 0;
      damp[y * w + x] = 0.15 * s * s; // sigma
    }
  }
  const r2 = 0.25;

  function splat(buf, cx, cy, a, sigma) {
    const rad = Math.ceil(sigma * 3);
    const x0 = Math.max(1, Math.round(cx) - rad), x1 = Math.min(w - 2, Math.round(cx) + rad);
    const y0 = Math.max(1, Math.round(cy) - rad), y1 = Math.min(h - 2, Math.round(cy) + rad);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = y * w + x;
        if (!wall[i]) buf[i] += a * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * sigma * sigma));
      }
    }
  }

  const sim = {
    w, h, wall, t: 0,
    period: 16, // steps per oscillation; wavelength = 0.5 * period = 8 cells
    sources: [], // { x, y, phase } in cells, coherent at the same frequency
    get field() { return curr; },
    step() {
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1, i = y * w + 1; x < w - 1; x++, i++) {
          next[i] = wall[i] ? 0 : (2 * curr[i] - (1 - damp[i]) * prev[i]
            + r2 * (curr[i + 1] + curr[i - 1] + curr[i + w] + curr[i - w] - 4 * curr[i])) / (1 + damp[i]);
        }
      }
      sim.t++;
      const phase = (2 * Math.PI * sim.t) / sim.period;
      for (const s of sim.sources) splat(next, s.x, s.y, 0.3 * Math.sin(phase + (s.phase || 0)), 1.5);
      [prev, curr, next] = [curr, next, prev];
    },
    pulse(x, y, a = 2.5) { splat(curr, x, y, a, 2.2); },
    // Vertical barrier at column x (2 cells thick) with openings given as [{ y, half }] in cells.
    setBarrier(x, gaps) {
      wall.fill(0);
      if (x == null) return;
      for (let y = 0; y < h; y++) {
        if (gaps.some((g) => Math.abs(y - g.y) <= g.half)) continue;
        for (let dx = 0; dx < 2; dx++) {
          const i = y * w + x + dx;
          wall[i] = 1; curr[i] = 0; prev[i] = 0;
        }
      }
    },
  };
  return sim;
}

if (typeof module === 'object') module.exports = { createWave };
