// Lab page. Scene 1 reuses the hero renderer (wave-view.js); scene 2 is the Fourier bench (fourier.js).
(() => {
  const $ = (s) => document.querySelector(s);
  const view = mountWave($('#lab-wave'), {
    pauseButton: $('#w-pause'),
    scene: { sources: [{ fx: 0.25, fy: 0.4 }, { fx: 0.25, fy: 0.6 }], barrier: 0.55, slits: [0.42, 0.58], detector: 0.92 },
  });
  const sc = view.scene;
  const opts = { sources: '2', barrier: 'double' };
  function seg(id, key, onChange) {
    const root = $(id);
    root.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      root.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      opts[key] = b.dataset.v;
      onChange();
    });
  }
  function applyWave() {
    sc.sources = opts.sources === '1' ? [{ fx: 0.25, fy: 0.5 }] : [{ fx: 0.25, fy: 0.4 }, { fx: 0.25, fy: 0.6 }];
    sc.barrier = opts.barrier === 'none' ? null : 0.55;
    sc.slits = opts.barrier === 'single' ? [0.5] : opts.barrier === 'double' ? [0.42, 0.58] : [];
    sc.period = +$('#w-period').value;
    sc.slitHalf = +$('#w-slit').value;
    $('#w-period-out').textContent = `λ = ${sc.period / 2} cells`;
    $('#w-slit-out').textContent = `${2 * sc.slitHalf + 1} cells`;
    view.apply();
  }
  seg('#w-sources', 'sources', applyWave);
  seg('#w-barrier', 'barrier', applyWave);
  $('#w-period').addEventListener('input', applyWave);
  $('#w-slit').addEventListener('input', applyWave);
  applyWave();
})();

(() => {
  const N = 256, F = createFourier(N);
  const $ = (s) => document.querySelector(s);
  const state = { kind: 'circle', size: 12, sep: 40, filter: 'none', cutoff: 0.08 };
  const canvases = { a: $('#c-aperture'), s: $('#c-spectrum'), o: $('#c-output') };

  function letter(size) {
    const c = document.createElement('canvas');
    c.width = c.height = N;
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.font = `700 ${Math.round(size * 7)}px serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('λ', N / 2, N / 2);
    const px = g.getImageData(0, 0, N, N).data, t = new Float64Array(N * N);
    // Drawn centered; store unshifted so the origin sits at index 0.
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) t[((y + N / 2) % N) * N + ((x + N / 2) % N)] = px[(y * N + x) * 4 + 3] > 127 ? 1 : 0;
    return t;
  }

  function rgb(name) {
    const v = getComputedStyle(document.body).getPropertyValue(name).trim();
    return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16));
  }

  // Draw an unshifted N×N array of values in [0,1], centered on the canvas.
  function paint(canvas, val) {
    const g = canvas.getContext('2d'), img = g.createImageData(N, N), d = img.data;
    const bg = rgb('--bg'), a = rgb('--accent'), light = document.body.classList.contains('light');
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const v = val[((y + N / 2) % N) * N + ((x + N / 2) % N)];
        const j = (y * N + x) * 4;
        for (let ch = 0; ch < 3; ch++) {
          d[j + ch] = light || v < 0.6 ? bg[ch] + (a[ch] - bg[ch]) * Math.min(1, light ? v : v / 0.6) : a[ch] + (255 - a[ch]) * ((v - 0.6) / 0.4);
        }
        d[j + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
  }

  let pending = false;
  function update() { if (!pending) { pending = true; requestAnimationFrame(compute); } }

  function compute() {
    pending = false;
    const t = state.kind === 'letter' ? letter(state.size) : F.aperture(state.kind, state.size, state.sep);
    const re = t.slice(), im = new Float64Array(N * N);
    F.fft2(re, im);
    const I = new Float64Array(N * N);
    let imax = 0, total = 0;
    for (let i = 0; i < I.length; i++) { I[i] = re[i] * re[i] + im[i] * im[i]; imax = Math.max(imax, I[i]); total += I[i]; }
    const H = F.mask(state.filter, state.cutoff);
    let kept = 0;
    for (let i = 0; i < H.length; i++) { re[i] *= H[i]; im[i] *= H[i]; kept += I[i] * H[i]; }
    F.fft2(re, im, true);
    const out = new Float64Array(N * N);
    let omax = 0;
    for (let i = 0; i < out.length; i++) { out[i] = re[i] * re[i] + im[i] * im[i]; omax = Math.max(omax, out[i]); }

    paint(canvases.a, t);
    const logI = I.map((v) => Math.log10(1 + (v / (imax || 1)) * 1e4) / 4);
    if (state.filter !== 'none') for (let i = 0; i < logI.length; i++) if (!H[i]) logI[i] *= 0.25;
    paint(canvases.s, logI);
    paint(canvases.o, out.map((v) => Math.sqrt(v / (omax || 1))));

    if (state.filter !== 'none') { // cutoff circle overlay
      const g = canvases.s.getContext('2d');
      g.strokeStyle = 'rgba(255,255,255,.7)';
      g.setLineDash([4, 4]);
      g.beginPath(); g.arc(N / 2, N / 2, state.cutoff * N, 0, Math.PI * 2); g.stroke();
      g.setLineDash([]);
    }
    $('#readout').textContent = `open area ${t.reduce((s, v) => s + v, 0)} px² · retained spectral power ${((100 * kept) / (total || 1)).toFixed(2)}%`;
  }

  // Controls
  function seg(id, key) {
    const root = $(id);
    root.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      root.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      state[key] = b.dataset.v;
      sync();
    });
  }
  seg('#aperture', 'kind');
  seg('#filter', 'filter');
  const ranges = { size: (v) => `${v} px`, sep: (v) => `${v} px`, cutoff: (v) => `${(+v).toFixed(3)} cyc/px` };
  for (const k of Object.keys(ranges)) $(`#${k}`).addEventListener('input', (e) => { state[k] = +e.target.value; sync(); });
  function sync() {
    for (const [k, f] of Object.entries(ranges)) { $(`#${k}`).value = state[k]; $(`#${k}-out`).textContent = f(state[k]); }
    $('#sep-wrap').hidden = state.kind !== 'double';
    update();
  }

  // Drag on panels: aperture panel sets size, spectrum panel sets cutoff.
  function drag(canvas, apply) {
    const at = (e) => { const r = canvas.getBoundingClientRect(); return { dx: ((e.clientX - r.left) / r.width - 0.5) * N, dy: ((e.clientY - r.top) / r.height - 0.5) * N }; };
    canvas.addEventListener('pointerdown', (e) => { canvas.setPointerCapture(e.pointerId); apply(at(e)); sync(); });
    canvas.addEventListener('pointermove', (e) => { if (canvas.hasPointerCapture(e.pointerId)) { apply(at(e)); sync(); } });
  }
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  drag(canvases.a, ({ dx, dy }) => {
    const slitLike = state.kind === 'slit' || state.kind === 'double';
    if (state.kind === 'double') state.sep = clamp(Math.round(2 * Math.abs(dx)), 8, 120);
    else state.size = clamp(Math.round(slitLike ? 2 * Math.abs(dx) : Math.hypot(dx, dy)), 2, 60);
  });
  drag(canvases.s, ({ dx, dy }) => {
    if (state.filter === 'none') $('#filter [data-v="low"]').click();
    state.cutoff = clamp(+(Math.hypot(dx, dy) / N).toFixed(3), 0.005, 0.5);
  });
  window.addEventListener('themechange', update);
  sync();
})();
