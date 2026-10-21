// Lab scene 3: X-ray reflectivity of one film on a substrate (xrr.js), and, when a trained model is
// published next to this page, ReflectoLearn's CNN estimate from the same scan (xrr-input.js + ONNX).
(() => {
  const $ = (s) => document.querySelector(s);
  const ko = () => typeof isKo === 'function' && isKo();
  const tr = (en, k) => (ko() ? k : en);
  const canvas = $('#c-xrr');
  if (!canvas) return;

  const LAMBDA = 1.54; // Å, Cu Kα as in ReflectoLearn's config
  const SUBSTRATES = { si: { sld: 20.07, label: 'Si' }, glass: { sld: 18.9, label: 'SiO₂' } };
  const SUB_ROUGHNESS = 3; // Å
  const TTH = Array.from({ length: 291 }, (_, i) => 0.2 + 0.02 * i); // 2θ 0.2° to 6°, the G1c scan
  const tth2q = (t) => (4 * Math.PI / LAMBDA) * Math.sin((t * Math.PI) / 360);
  const Q_SCAN = TTH.map(tth2q);
  const Q_MAX = Q_SCAN[Q_SCAN.length - 1];
  const Q_LINE = Array.from({ length: 700 }, (_, i) => 0.004 + ((Q_MAX - 0.004) * i) / 699);
  const COUNTS = 1e7, BACKGROUND = 1e-7;
  const LOG_MIN = -9;
  const MODEL = { json: 'xrr-model.json', onnx: 'xrr-model.onnx' };
  const ORT = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/';

  const state = { d: 250, sigma: 5, sld: 45, sub: 'si', noise: 'ideal', seed: 1 };
  let estimate = null; // { d, sigma, sld } from the CNN for the current scan, or null
  let model = null; // { contract, session } once loaded
  let modelAvailable = null; // null = not checked yet

  const stack = (p) => [
    { sld: [0, 0], thickness: 0, roughness: 0 },
    { sld: [p.sld, 0], thickness: p.d, roughness: p.sigma },
    { sld: [SUBSTRATES[state.sub].sld, 0], thickness: 0, roughness: SUB_ROUGHNESS },
  ];

  // Seeded Poisson counts, so a redraw does not reshuffle the noise.
  function mulberry(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function poisson(lambda, rand) {
    if (lambda > 50) { // normal limit, Box–Muller
      const z = Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
      return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * z));
    }
    let k = 0, p = 1;
    const limit = Math.exp(-lambda);
    do { k++; p *= rand(); } while (p > limit);
    return k - 1;
  }

  // The scan the page "measures": ideal R, or counts with Poisson noise, normalised to the plateau.
  function scan() {
    const r = reflectivity(Q_SCAN, stack(state));
    if (state.noise === 'ideal') return Array.from(r);
    const rand = mulberry(state.seed);
    return Array.from(r, (v) => poisson((v + BACKGROUND) * COUNTS, rand) / COUNTS);
  }

  function color(name) { return getComputedStyle(document.body).getPropertyValue(name).trim(); }

  function draw(measured) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const g = canvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    const pad = { l: 48, r: 14, t: 14, b: 36 };
    const X = (q) => pad.l + ((w - pad.l - pad.r) * q) / Q_MAX;
    const Y = (lg) => pad.t + ((h - pad.t - pad.b) * (0.3 - lg)) / (0.3 - LOG_MIN);
    const ink = color('--ink'), muted = color('--muted'), accent = color('--accent');
    g.font = '12px Archivo, sans-serif';
    g.fillStyle = muted;
    g.strokeStyle = muted;
    g.lineWidth = 1;
    g.globalAlpha = 0.35;
    for (let e = 0; e >= LOG_MIN; e -= 3) { g.beginPath(); g.moveTo(pad.l, Y(e)); g.lineTo(w - pad.r, Y(e)); g.stroke(); }
    g.globalAlpha = 1;
    for (let e = 0; e >= LOG_MIN; e -= 3) g.fillText(e === 0 ? '1' : `1e${e}`, 6, Y(e) + 4);
    for (let q = 0; q <= Q_MAX + 1e-9; q += 0.1) g.fillText(q.toFixed(1), X(q) - 8, h - 18);
    g.fillText(tr('q (1/Å)', 'q (1/Å)'), w - pad.r - 52, h - 4);
    g.fillText('R', 6, 11);

    // critical edges of film and substrate: q_c = 4 √(π · SLD)
    // labels go on the outer side of each line, so two close edges do not collide
    const edges = [[state.sld, tr('film edge', '막 임계각')], [SUBSTRATES[state.sub].sld, tr('substrate edge', '기판 임계각')]]
      .map(([sld, label]) => ({ qc: 4 * Math.sqrt(Math.PI * sld * 1e-6), label }))
      .sort((a, b) => a.qc - b.qc);
    edges.forEach(({ qc, label }, i) => {
      g.setLineDash([3, 4]);
      g.beginPath(); g.moveTo(X(qc), pad.t); g.lineTo(X(qc), h - pad.b); g.stroke();
      g.setLineDash([]);
      g.textAlign = i === 0 ? 'right' : 'left';
      g.fillText(label, X(qc) + (i === 0 ? -5 : 5), h - pad.b - 8);
    });
    g.textAlign = 'left';

    const line = (r, stroke, width, dash = []) => {
      g.strokeStyle = stroke; g.lineWidth = width; g.setLineDash(dash);
      g.beginPath();
      Q_LINE.forEach((q, i) => {
        const y = Y(Math.max(Math.log10(Math.max(r[i], 1e-30)), LOG_MIN));
        i ? g.lineTo(X(q), y) : g.moveTo(X(q), y);
      });
      g.stroke(); g.setLineDash([]);
    };
    if (state.noise === 'counts') {
      g.fillStyle = muted;
      measured.forEach((v, i) => { if (v > 0) g.fillRect(X(Q_SCAN[i]) - 1.5, Y(Math.log10(v)) - 1.5, 3, 3); });
    }
    line(reflectivity(Q_LINE, stack(state)), ink, 1.6);
    if (estimate) line(reflectivity(Q_LINE, stack(estimate)), accent, 2, [6, 4]);
  }

  function readout() {
    const qc = 4 * Math.sqrt(Math.PI * state.sld * 1e-6);
    const parts = [
      tr(`Film edge q_c = ${qc.toFixed(4)} 1/Å`, `막 임계각 q_c = ${qc.toFixed(4)} 1/Å`),
      tr(`fringe period 2π/d = ${(2 * Math.PI / state.d).toFixed(4)} 1/Å`, `무늬 주기 2π/d = ${(2 * Math.PI / state.d).toFixed(4)} 1/Å`),
    ];
    if (estimate) {
      const pct = (a, b) => `${(100 * (a / b - 1)).toFixed(1)} %`;
      parts.push(tr(
        `CNN: d ${estimate.d.toFixed(1)} Å (${pct(estimate.d, state.d)}), σ ${estimate.sigma.toFixed(1)} Å, SLD ${estimate.sld.toFixed(1)} (${pct(estimate.sld, state.sld)}), no refinement`,
        `CNN: d ${estimate.d.toFixed(1)} Å (${pct(estimate.d, state.d)}), σ ${estimate.sigma.toFixed(1)} Å, SLD ${estimate.sld.toFixed(1)} (${pct(estimate.sld, state.sld)}), refine 없음`,
      ));
    }
    $('#xrr-readout').textContent = parts.join(' · ');
    const note = $('#xrr-model-note');
    if (modelAvailable === false) note.textContent = tr('No trained model is published on this page yet, so the CNN estimate is off.', '이 페이지에는 아직 학습된 모델이 올라와 있지 않아 CNN 추정은 꺼져 있습니다.');
    else if (model) {
      const { points } = model.contract.input.q_grid;
      note.textContent = tr(`ReflectoLearn CNN, ${points}-point q grid, one film on a substrate. The estimate is the network alone, before any fit.`, `ReflectoLearn CNN, q 격자 ${points}점, 기판 위 막 하나. 추정값은 피팅 전 네트워크만의 결과입니다.`);
    }
    else note.textContent = '';
  }

  function outputs() {
    $('#xrr-d-out').textContent = `${state.d} Å`;
    $('#xrr-sigma-out').textContent = `${state.sigma} Å`;
    $('#xrr-sld-out').textContent = `${state.sld}`;
  }

  function update() {
    outputs();
    draw(scan());
    readout();
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = () => reject(new Error(`could not load ${src}`));
      document.head.append(s);
    });
  }

  async function runModel() {
    const button = $('#xrr-estimate');
    button.disabled = true;
    try {
      if (!model) {
        await loadScript(`${ORT}ort.min.js`);
        ort.env.wasm.wasmPaths = ORT;
        const contract = await (await fetch(MODEL.json)).json();
        const session = await ort.InferenceSession.create(MODEL.onnx, { executionProviders: ['wasm'] });
        model = { contract, session };
      }
      const x = modelInput(Q_SCAN, scan().map((v) => v * COUNTS), model.contract);
      const { shape } = model.contract.input;
      const out = await model.session.run({ x: new ort.Tensor('float32', x, shape) });
      const [d, sigma, sld] = out.params.data;
      estimate = { d, sigma: Math.max(sigma, 0), sld };
    } catch (err) {
      $('#xrr-model-note').textContent = tr(`The model could not run: ${err.message}`, `모델을 실행하지 못했습니다: ${err.message}`);
      button.disabled = false;
      return;
    }
    button.disabled = false;
    update();
  }

  function seg(id, key) {
    const root = $(id);
    root.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      root.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      state[key] = b.dataset.v;
      estimate = null;
      update();
    });
  }
  for (const [id, key] of [['#xrr-d', 'd'], ['#xrr-sigma', 'sigma'], ['#xrr-sld', 'sld']]) {
    $(id).addEventListener('input', (e) => { state[key] = +e.target.value; estimate = null; update(); });
  }
  seg('#xrr-sub', 'sub');
  seg('#xrr-noise', 'noise');
  $('#xrr-reroll').addEventListener('click', () => { state.seed++; estimate = null; update(); });
  $('#xrr-estimate').addEventListener('click', runModel);
  window.addEventListener('themechange', update);
  window.addEventListener('langchange', update);
  new ResizeObserver(() => draw(scan())).observe(canvas);

  fetch(MODEL.json, { method: 'HEAD' })
    .then((r) => { modelAvailable = r.ok; })
    .catch(() => { modelAvailable = false; })
    .finally(() => { $('#xrr-estimate').hidden = !modelAvailable; readout(); });
  update();
})();
