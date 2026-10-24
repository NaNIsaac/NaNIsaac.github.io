// Lab page. Scene 1 reuses the hero renderer (wave-view.js); scene 2 is the Fourier bench (fourier.js).
(() => {
  const $ = (s) => document.querySelector(s);
  const ko = () => typeof isKo === 'function' && isKo(); // script.js owns the language switch
  const view = mountWave($('#lab-wave'), {
    pauseButton: $('#w-pause'),
    pauseLabel: (running) => (running ? (ko() ? '정지' : 'Pause') : (ko() ? '재생' : 'Play')),
    tools: true,
    onChange: showValues, // drags on the canvas (gap grips, double-click sources) keep the controls honest
    scene: { sources: [{ fx: 0.25, fy: 0.4 }, { fx: 0.25, fy: 0.6 }], barrier: 0.55, slits: [0.42, 0.58], detector: 0.92 },
  });
  const sc = view.scene;
  const opts = { sources: '2', barrier: 'double', sample: 'none', jaws: 'absorb' };
  const LATTICE = { fx: 0.4, fy: 0.5, theta: 0, d: 9, n: 3 }; // d = 9 cells against λ = 12 cells: Bragg orders exist (2d > λ)
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
  function pressed(id, v) { document.querySelectorAll(`${id} button`).forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.v === v))); }
  function showValues() {
    $('#w-slit').value = sc.slitHalf;
    const cells = ko() ? '칸' : ' cells';
    $('#w-period-out').textContent = `λ = ${sc.period / 2}${cells}`;
    $('#w-slit-out').textContent = `${2 * sc.slitHalf + 1}${cells}`;
    const n = String(sc.sources.length);
    opts.sources = n;
    pressed('#w-sources', n);
  }
  function setSources() {
    sc.sources = opts.sources === '1' ? [{ fx: 0.25, fy: 0.5 }] : [{ fx: 0.25, fy: 0.4 }, { fx: 0.25, fy: 0.6 }];
    applyWave();
  }
  function setSample() {
    sc.lattice = opts.sample === 'lattice' ? { ...LATTICE } : null;
    if (sc.lattice && opts.barrier !== 'none') { opts.barrier = 'none'; pressed('#w-barrier', 'none'); } // the lattice is the sample: clear the bench
    if (sc.lattice && opts.sources === '2') { opts.sources = '1'; sc.sources = [{ fx: 0.12, fy: 0.5 }]; }
    applyWave();
  }
  function applyWave() {
    sc.barrier = opts.barrier === 'none' ? null : (sc.barrier ?? 0.55);
    sc.absorb = opts.jaws === 'absorb';
    sc.slits = opts.barrier === 'single' ? [0.5] : opts.barrier === 'double' ? [0.42, 0.58] : [];
    sc.period = +$('#w-period').value;
    sc.slitHalf = +$('#w-slit').value;
    view.apply();
    showValues();
  }
  seg('#w-sources', 'sources', setSources);
  seg('#w-barrier', 'barrier', applyWave);
  seg('#w-sample', 'sample', setSample);
  seg('#w-jaws', 'jaws', applyWave);
  $('#w-period').addEventListener('input', applyWave);
  $('#w-slit').addEventListener('input', applyWave);
  applyWave();
  window.addEventListener('langchange', () => {
    showValues();
    const p = $('#w-pause'), running = p.textContent === 'Pause' || p.textContent === '정지';
    p.textContent = running ? (ko() ? '정지' : 'Pause') : (ko() ? '재생' : 'Play');
  });
})();

(() => {
  const N = 256, F = createFourier(N);
  const $ = (s) => document.querySelector(s);
  const ko = () => typeof isKo === 'function' && isKo();
  const tr = (en, k) => (ko() ? k : en);
  const state = { kind: 'circle', size: 12, sep: 40, filter: 'none', cutoff: 0.08, view: 'image', ink: 1 };
  const canvases = { a: $('#c-aperture'), s: $('#c-spectrum'), o: $('#c-output') };
  const drawn = new Float64Array(N * N); // the 'draw' aperture, unshifted
  const stops = new Float64Array(N * N).fill(1); // painted Fourier-plane stops (0 = blocked), unshifted
  const idx = (cx, cy) => ((cy + N / 2) % N) * N + ((cx + N / 2) % N); // canvas pixel (centred) -> unshifted index

  // Raster an aperture on a 2D canvas (centred) and keep its alpha as transmission, so edges are anti-aliased.
  function raster(drawShapes) {
    const c = document.createElement('canvas');
    c.width = c.height = N;
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    drawShapes(g);
    const px = g.getImageData(0, 0, N, N).data, t = new Float64Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) t[idx(x, y)] = px[(y * N + x) * 4 + 3] / 255;
    return t;
  }
  const disc = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
  const ENV = N * 0.36; // circular envelope for the many-feature presets
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647); // fixed holes: the same speckle every time
  function aperture() {
    const { kind, size, sep } = state, c = N / 2;
    if (kind === 'draw') return drawn;
    if (kind === 'letter') return raster((g) => { g.font = `700 ${Math.round(size * 7)}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('λ', c, c); });
    if (kind === 'grating') return raster((g) => {
      g.beginPath(); g.arc(c, c, ENV, 0, Math.PI * 2); g.clip(); // bars of width sep/2, period sep, inside the envelope
      for (let x = c - Math.ceil(ENV / sep) * sep; x < c + ENV; x += sep) g.fillRect(x - sep / 4, 0, sep / 2, N);
    });
    if (kind === 'lattice') return raster((g) => { // hexagonal lattice of holes, spacing sep, hole radius size/4
      const r = Math.max(1, size / 4), h = (sep * Math.sqrt(3)) / 2;
      for (let j = -Math.ceil(ENV / h); j <= Math.ceil(ENV / h); j++) for (let i = -Math.ceil(ENV / sep) - 1; i <= Math.ceil(ENV / sep) + 1; i++) {
        const x = (i + (Math.abs(j) % 2) / 2) * sep, y = j * h;
        if (Math.hypot(x, y) <= ENV) disc(g, c + x, c + y, r);
      }
    });
    if (kind === 'speckle') return raster((g) => {
      seed = 7;
      for (let n = 0; n < 90; n++) { const r = ENV * Math.sqrt(rand()), a = 2 * Math.PI * rand(); disc(g, c + r * Math.cos(a), c + r * Math.sin(a), Math.max(1, size / 4)); }
    });
    return F.aperture(kind, size, sep);
  }

  function rgb(name) {
    const v = getComputedStyle(document.body).getPropertyValue(name).trim();
    return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16));
  }
  // Draw an unshifted N×N array of values in [0,1], centered on the canvas; returns the image for overlays.
  // tint: a faint brass wash on the mid-to-bright levels (the spectrum panel), as on the home page
  function paint(canvas, val, tint = false) {
    const g = canvas.getContext('2d'), img = g.createImageData(N, N), d = img.data;
    const bg = rgb('--surface'), a = rgb('--ink'), brass = rgb('--accent');
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const m = Math.min(1, val[idx(x, y)]), j = (y * N + x) * 4, w = tint ? 0.28 * Math.sin(Math.PI * m) ** 2 : 0;
        for (let ch = 0; ch < 3; ch++) { const base = bg[ch] + (a[ch] - bg[ch]) * m; d[j + ch] = base + (brass[ch] - base) * w; }
        d[j + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    return img;
  }

  let pending = false, hover = null;
  const frames = {};
  function update() { if (!pending) { pending = true; requestAnimationFrame(compute); } }

  function compute() {
    pending = false;
    const t = aperture();
    const re = t.slice(), im = new Float64Array(N * N);
    F.fft2(re, im);
    const I = new Float64Array(N * N);
    let imax = 0, total = 0;
    for (let i = 0; i < I.length; i++) { I[i] = re[i] * re[i] + im[i] * im[i]; imax = Math.max(imax, I[i]); total += I[i]; }
    const H = state.filter === 'paint' ? stops : F.mask(state.filter, state.cutoff);
    let kept = 0, amax = 0;
    for (let i = 0; i < H.length; i++) { re[i] *= H[i]; im[i] *= H[i]; kept += I[i] * H[i]; amax = Math.max(amax, Math.hypot(re[i], im[i])); }
    // Right panel: the filtered field, or the same spectrum with its phase set to zero, or with every magnitude set to one
    if (state.view !== 'image') for (let i = 0; i < re.length; i++) {
      const m = Math.hypot(re[i], im[i]);
      if (state.view === 'nophase') { re[i] = m; im[i] = 0; } else if (m > 1e-9 * amax) { re[i] /= m; im[i] /= m; } else { re[i] = im[i] = 0; }
    }
    F.fft2(re, im, true);
    const out = new Float64Array(N * N);
    let omax = 0;
    for (let i = 0; i < out.length; i++) { out[i] = re[i] * re[i] + im[i] * im[i]; omax = Math.max(omax, out[i]); }

    frames.a = paint(canvases.a, t);
    const logI = I.map((v) => Math.log10(1 + (v / (imax || 1)) * 1e4) / 4);
    if (state.filter !== 'none') for (let i = 0; i < logI.length; i++) logI[i] *= 0.25 + 0.75 * H[i];
    frames.s = paint(canvases.s, logI, true);
    frames.o = paint(canvases.o, out.map((v) => Math.sqrt(v / (omax || 1))));
    frames.t = t;
    overlays();
    const area = t.reduce((s, v) => s + v, 0).toFixed(1), power = ((100 * kept) / (total || 1)).toFixed(2);
    $('#readout').textContent = tr(`open area ${area} px² · spectral power passed ${power}%`, `열린 면적 ${area} px² · 통과한 스펙트럼 세기 ${power}%`);
    captions();
  }

  // Overlays redraw on top of the cached panels: the cutoff circle and, while hovering the spectrum,
  // the point and its mirror, and the grating that frequency stands for, drawn over the aperture.
  function overlays() {
    for (const k of ['a', 's', 'o']) if (frames[k]) canvases[k].getContext('2d').putImageData(frames[k], 0, 0);
    const brass = getComputedStyle(document.body).getPropertyValue('--accent').trim();
    if (state.filter === 'low' || state.filter === 'high') {
      const g = canvases.s.getContext('2d');
      g.strokeStyle = brass; g.setLineDash([4, 4]); g.lineWidth = 1;
      g.beginPath(); g.arc(N / 2, N / 2, state.cutoff * N, 0, Math.PI * 2); g.stroke();
      g.setLineDash([]);
    }
    if (hover?.panel !== 's') return;
    const { fx, fy } = hover, f = Math.hypot(fx, fy);
    const gs = canvases.s.getContext('2d');
    gs.strokeStyle = brass; gs.lineWidth = 1.5;
    for (const s of [1, -1]) { gs.beginPath(); gs.arc(N / 2 + s * fx * N, N / 2 + s * fy * N, 5, 0, Math.PI * 2); gs.stroke(); }
    if (!f) return;
    const g = canvases.a.getContext('2d'), p = 1 / f, nx = fx / f, ny = fy / f; // crests of cos 2π f·r: lines ⟂ f, 1/|f| apart
    g.strokeStyle = brass; g.globalAlpha = 0.6; g.lineWidth = 1;
    g.beginPath();
    for (let k = -Math.ceil(N / p); k <= Math.ceil(N / p); k++) {
      const cx = N / 2 + nx * k * p, cy = N / 2 + ny * k * p;
      g.moveTo(cx - ny * N, cy + nx * N); g.lineTo(cx + ny * N, cy - nx * N);
    }
    g.stroke(); g.globalAlpha = 1;
  }

  function captions() {
    const draw = state.kind === 'draw', paintStops = state.filter === 'paint';
    const resizable = ['circle', 'ring', 'slit', 'double', 'square'].includes(state.kind);
    $('#cap-a').textContent = draw ? tr('Aperture: draw with the pointer', '조리개: 포인터로 그리기') : resizable ? tr('Aperture: drag to resize', '조리개: 끌어서 크기 조절') : tr('Aperture', '조리개');
    $('#cap-s').textContent = paintStops ? tr('Far field (log): paint to block, hover to read', '원거리 세기(로그): 칠하면 막고, 마우스를 올리면 값 표시')
      : tr('Far field (log): drag to set a cutoff, hover to read', '원거리 세기(로그): 끌어서 차단, 마우스를 올리면 값 표시');
    $('#cap-o').textContent = { image: tr('What gets through, transformed back', '통과한 성분의 역변환'), nophase: tr('Same magnitudes, phase thrown away', '크기 유지, 위상 제거'), phaseonly: tr('Phase kept, every magnitude set to one', '위상 유지, 크기는 모두 1') }[state.view];
    canvases.a.classList.toggle('paintable', draw);
    canvases.a.classList.toggle('draggable', resizable);
    canvases.s.classList.toggle('paintable', paintStops);
  }

  // Controls
  function seg(id, key, after) {
    const root = $(id);
    root.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      root.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      if (after) after(b.dataset.v); else state[key] = b.dataset.v;
      sync();
    });
  }
  seg('#aperture', 'kind', (v) => {
    if (v === 'draw' && state.kind !== 'draw') drawn.set(aperture()); // start from the shape on screen
    state.kind = v;
  });
  seg('#filter', 'filter');
  seg('#view', 'view');
  seg('#brush', 'ink', (v) => { state.ink = +v; });
  $('#clear-draw').addEventListener('click', () => { drawn.fill(0); update(); });
  $('#clear-stops').addEventListener('click', () => { stops.fill(1); update(); });
  const ranges = { size: (v) => `${v} px`, sep: (v) => `${v} px`, cutoff: (v) => `${(+v).toFixed(3)} cyc/px` };
  for (const k of Object.keys(ranges)) $(`#${k}`).addEventListener('input', (e) => { state[k] = +e.target.value; sync(); });
  function sync() {
    for (const [k, f] of Object.entries(ranges)) { $(`#${k}`).value = state[k]; $(`#${k}-out`).textContent = f(state[k]); }
    $('#sep-wrap').hidden = !['double', 'grating', 'lattice'].includes(state.kind);
    $('#size-wrap').hidden = ['draw', 'grating'].includes(state.kind);
    $('#draw-tools').hidden = state.kind !== 'draw';
    $('#cutoff-wrap').hidden = !['low', 'high'].includes(state.filter);
    $('#clear-stops').hidden = state.filter !== 'paint';
    update();
  }

  // Pointer position in grid pixels of the centred panel
  const at = (canvas, e) => { const r = canvas.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * N, y: ((e.clientY - r.top) / r.height) * N }; };
  // A soft-edged round brush: v = 1 adds transmission, v = 0 removes it
  function brush(arr, x, y, r, v) {
    for (let j = Math.floor(y - r - 1); j <= Math.ceil(y + r + 1); j++) for (let i = Math.floor(x - r - 1); i <= Math.ceil(x + r + 1); i++) {
      if (i < 0 || j < 0 || i >= N || j >= N) continue;
      const cover = Math.min(1, Math.max(0, r + 0.5 - Math.hypot(i + 0.5 - x, j + 0.5 - y))), k = idx(i, j);
      arr[k] = v ? Math.max(arr[k], cover) : Math.min(arr[k], 1 - cover);
    }
  }
  const along = (p, q, fn) => { const n = Math.max(1, Math.ceil(Math.hypot(q.x - p.x, q.y - p.y) / 1.5)); for (let k = 0; k <= n; k++) fn(p.x + ((q.x - p.x) * k) / n, p.y + ((q.y - p.y) * k) / n); };
  function stroke(canvas, apply) { // pointer drags; consecutive points are joined so a fast stroke stays continuous
    let last = null;
    canvas.addEventListener('pointerdown', (e) => { canvas.setPointerCapture(e.pointerId); last = at(canvas, e); apply(last, last); });
    canvas.addEventListener('pointermove', (e) => { if (!canvas.hasPointerCapture(e.pointerId)) return; const p = at(canvas, e); apply(last, p); last = p; });
  }
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  stroke(canvases.a, (p, q) => {
    if (state.kind === 'draw') { along(p, q, (x, y) => brush(drawn, x, y, 4, state.ink)); return update(); }
    const dx = q.x - N / 2, dy = q.y - N / 2;
    if (state.kind === 'double') state.sep = clamp(Math.round(2 * Math.abs(dx)), 8, 120);
    else if (state.kind === 'slit') state.size = clamp(Math.round(2 * Math.abs(dx)), 2, 60);
    else if (['circle', 'ring', 'square'].includes(state.kind)) state.size = clamp(Math.round(Math.hypot(dx, dy)), 2, 60);
    else return;
    sync();
  });
  stroke(canvases.s, (p, q) => {
    if (state.filter === 'paint') { along(p, q, (x, y) => brush(stops, x, y, 3, 0)); return update(); }
    if (state.filter === 'none') $('#filter [data-v="low"]').click();
    state.cutoff = clamp(+(Math.hypot(q.x - N / 2, q.y - N / 2) / N).toFixed(3), 0.005, 0.5);
    sync();
  });

  // Hover: what the point under the pointer means, in the line under the panels and, for the spectrum, on the aperture
  const f3 = (v) => (Math.abs(v) < 5e-4 ? '0' : v.toFixed(3));
  for (const [k, canvas] of Object.entries(canvases)) {
    canvas.addEventListener('pointermove', (e) => {
      const { x, y } = at(canvas, e), cx = clamp(Math.floor(x), 0, N - 1), cy = clamp(Math.floor(y), 0, N - 1);
      const u = cx - N / 2, v = N / 2 - cy;
      if (k === 's') {
        const fx = u / N, fy = -v / N, f = Math.hypot(fx, fy);
        hover = { panel: 's', fx, fy };
        $('#hover').textContent = f ? tr(`frequency (${f3(fx)}, ${f3(-fy)}) cyc/px: a grating of period ${(1 / f).toFixed(1)} px, drawn over the aperture`, `주파수 (${f3(fx)}, ${f3(-fy)}) cyc/px: 주기 ${(1 / f).toFixed(1)} px 격자, 조리개 위에 표시`)
          : tr('zero frequency: the mean transmission', '0 주파수: 평균 투과');
      } else {
        hover = null;
        $('#hover').textContent = `x ${u}, y ${v} px` + (k === 'a' && frames.t ? ` · t = ${frames.t[idx(cx, cy)].toFixed(2)}` : '');
      }
      overlays();
    });
    canvas.addEventListener('pointerleave', () => { hover = null; $('#hover').textContent = ''; overlays(); });
  }

  window.addEventListener('themechange', update);
  window.addEventListener('langchange', update);
  sync();
})();
