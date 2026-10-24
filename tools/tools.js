// Wires the /tools fields to calc.js. The beam energy is shared; every field recalculates on 'input'.
(() => {
  const $ = (id) => document.getElementById(id);
  const num = (id) => parseFloat($(id).value);
  const fmt = (v, digits = 5) => (Number.isFinite(v) ? String(+v.toPrecision(digits)) : '');
  const ko = () => document.documentElement.lang === 'ko';
  const tr = (en, k) => (ko() ? k : en);
  const lambda = () => calc.wavelength(num('e-kev'));

  // Kα1 lines (keV) and cubic reflections (lattice constant a in Å, hkl)
  const LINES = [['Cu', 8.04778], ['Mo', 17.47934], ['Ag', 22.16292], ['Co', 6.93032], ['Cr', 5.41472]];
  const REFLECTIONS = [['Si 111', 5.43102, 1, 1, 1], ['Si 220', 5.43102, 2, 2, 0], ['Si 311', 5.43102, 3, 1, 1], ['Si 400', 5.43102, 4, 0, 0], ['Ge 111', 5.6579, 1, 1, 1]];

  // Results: label, value, unit. Each value is a button that copies "label = value unit".
  // A value that differs from the one it replaces gets a brief brass underline, so you see what moved.
  function show(id, rows) {
    const before = new Map([...$(id).querySelectorAll('div')].map((d) => [d.querySelector('dt').textContent, d.querySelector('dd').textContent]));
    $(id).replaceChildren(...rows.map(([label, value, unit = '']) => {
      const div = document.createElement('div');
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = label;
      if (value === null) { dd.className = 'warn'; dd.textContent = unit; } else {
        const b = document.createElement('button');
        b.type = 'button';
        b.innerHTML = /^[°%]$/.test(unit) ? `${value}${unit}` : `${value}<small>${unit}</small>`;
        const old = before.get(label);
        if (old !== undefined && old !== `${value}${unit}`) b.classList.add('changed');
        b.addEventListener('click', () => copy(`${label ? `${label} = ` : ''}${value}${/^[°%]$/.test(unit) ? '' : ' '}${unit}`.trim(), b));
        dd.append(b);
      }
      div.append(dt, dd);
      return div;
    }));
  }
  async function copy(text, el) {
    let ok = true;
    try { await navigator.clipboard.writeText(text); } catch { ok = false; }
    el.dataset.copied = ok ? tr('Copied', '복사됨') : tr('Select to copy', '선택해서 복사');
    setTimeout(() => delete el.dataset.copied, 1400);
  }
  function chips(id, items, pick) {
    $(id).replaceChildren(...items.map((item) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = item.label;
      b.addEventListener('click', () => pick(item));
      return b;
    }));
  }
  const press = (id, i) => $(id).querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-pressed', i === j));

  // Beam: energy ↔ wavelength, then everything that depends on λ
  function beam() {
    press('e-presets', LINES.findIndex(([, e]) => Math.abs(e - num('e-kev')) < 5e-4));
    angle(); scherrer(); lattice();
  }
  $('e-kev').addEventListener('input', () => { $('e-ang').value = fmt(calc.wavelength(num('e-kev')), 6); beam(); });
  $('e-ang').addEventListener('input', () => { $('e-kev').value = fmt(calc.energy(num('e-ang')), 6); beam(); });
  chips('e-presets', LINES.map(([el, e]) => ({ label: `${el} Kα₁`, e })), ({ e }) => {
    $('e-kev').value = e;
    $('e-kev').dispatchEvent(new Event('input'));
  });

  // Bragg / q / d: whichever was typed last is the source; an energy change keeps d (or 2θ, if that was typed)
  let angleSource = 'b-d';
  function angle() {
    const l = lambda();
    let d = num('b-d');
    if (angleSource === 'b-tth') d = calc.dFromQ(calc.q(num('b-tth'), l));
    if (angleSource === 'b-q') d = calc.dFromQ(num('b-q'));
    const q = calc.dFromQ(d), tth = calc.twoTheta(d, l);
    if (angleSource !== 'b-d') $('b-d').value = fmt(d, 6);
    if (angleSource !== 'b-q') $('b-q').value = fmt(q, 6);
    if (angleSource !== 'b-tth') $('b-tth').value = fmt(tth, 6);
    press('b-presets', REFLECTIONS.findIndex(([, a, h, k, ll]) => Math.abs(calc.dCubic(a, h, k, ll) - d) < 5e-4));
    if (!Number.isFinite(d) || d <= 0) return show('b-out', []);
    show('b-out', Number.isFinite(tth)
      ? [['2θ', fmt(tth), '°'], ['θ', fmt(tth / 2), '°'], ['q', fmt(q), 'Å⁻¹'], ['d', fmt(d), 'Å']]
      : [[tr('No reflection', '반사 없음'), null, tr(`λ = ${fmt(l, 4)} Å is longer than 2d = ${fmt(2 * d, 4)} Å. Raise the energy.`, `λ = ${fmt(l, 4)} Å가 2d = ${fmt(2 * d, 4)} Å보다 깁니다. 에너지를 높이세요.`)]]);
  }
  ['b-tth', 'b-q', 'b-d'].forEach((id) => $(id).addEventListener('input', () => { angleSource = id; angle(); }));
  chips('b-presets', REFLECTIONS.map(([label, a, h, k, l]) => ({ label, d: calc.dCubic(a, h, k, l) })), ({ d }) => {
    $('b-d').value = fmt(d, 6);
    angleSource = 'b-d';
    angle();
  });

  function footprint() {
    const h = num('f-h'), a = num('f-a'), s = num('f-s');
    const L = calc.footprint(h, a), fill = calc.fillAngle(h, s);
    show('f-out', [
      [tr('Footprint', 'footprint'), fmt(L, 4), 'mm'],
      [tr('Beam on sample', '시료에 닿는 빔'), fmt(100 * Math.min(1, s / L), 3), '%'],
      [tr('Full beam above', '전체 빔이 닿는 각도'), fmt(fill, 4), '°'],
    ]);
    sketch(L, s);
  }
  // Side view: footprint and sample to one scale; the beam comes in at a drawn angle, not the real one.
  function sketch(L, s) {
    const fig = $('f-fig');
    if (!(L > 0 && s > 0)) { fig.replaceChildren(); return; }
    const y = 46, rise = 30, run = rise / Math.tan((14 * Math.PI) / 180); // the beam needs `run` units on the left
    const k = (312 - run - 8) / Math.max(L, s), mid = run + 8 + (312 - run - 8) / 2;
    const sx = mid - (s * k) / 2, lx = mid - (L * k) / 2, lw = L * k, sw = s * k;
    const on0 = Math.max(lx, sx), on1 = Math.min(lx + lw, sx + sw);
    fig.innerHTML = `<polygon class="foot-beam" points="${lx - run},${y - rise} ${lx + lw - run},${y - rise} ${lx + lw},${y} ${lx},${y}"/>`
      + `<rect class="foot-sample" x="${sx}" y="${y}" width="${sw}" height="7"/>`
      + `<line class="foot-spill" x1="${lx}" y1="${y - 1}" x2="${lx + lw}" y2="${y - 1}"/>`
      + `<line class="foot-on" x1="${on0}" y1="${y - 1}" x2="${on1}" y2="${y - 1}"/>`;
  }

  function transmission() {
    const T = calc.transmission(num('a-t'), num('a-l'));
    show('a-out', [[tr('Transmitted', '투과'), fmt(100 * T, 3), '%'], [tr('Absorbed', '흡수'), fmt(100 * (1 - T), 3), '%']]);
  }


  function scherrer() {
    const tau = calc.scherrer(num('s-tth'), num('s-w'), lambda(), num('s-k'));
    show('s-out', [[tr('Crystallite size', '결정 크기'), fmt(tau / 10, 3), 'nm']]);
  }

  // Bravais lattice: 7 systems × their centrings = the 14 lattices. `free` lists the cell constants
  // the system leaves open; the rest follow from it (hexagonal and R use hexagonal axes, γ = 120°).
  const SYSTEMS = [
    { id: 'cubic', en: 'Cubic', ko: '입방', p: 'c', cen: ['P', 'I', 'F'], free: ['a'], cell: (v) => ({ b: v.a, c: v.a, al: 90, be: 90, ga: 90 }) },
    { id: 'tetragonal', en: 'Tetragonal', ko: '정방', p: 't', cen: ['P', 'I'], free: ['a', 'c'], cell: (v) => ({ b: v.a, al: 90, be: 90, ga: 90 }) },
    { id: 'orthorhombic', en: 'Orthorhombic', ko: '사방', p: 'o', cen: ['P', 'C', 'I', 'F'], free: ['a', 'b', 'c'], cell: () => ({ al: 90, be: 90, ga: 90 }) },
    { id: 'hexagonal', en: 'Hexagonal', ko: '육방', p: 'h', cen: ['P'], free: ['a', 'c'], cell: (v) => ({ b: v.a, al: 90, be: 90, ga: 120 }) },
    { id: 'trigonal', en: 'Rhombohedral', ko: '능면체', p: 'h', cen: ['R'], free: ['a', 'c'], cell: (v) => ({ b: v.a, al: 90, be: 90, ga: 120 }) },
    { id: 'monoclinic', en: 'Monoclinic', ko: '단사', p: 'm', cen: ['P', 'C'], free: ['a', 'b', 'c', 'be'], cell: () => ({ al: 90, ga: 90 }) },
    { id: 'triclinic', en: 'Triclinic', ko: '삼사', p: 'a', cen: ['P'], free: ['a', 'b', 'c', 'al', 'be', 'ga'], cell: () => ({}) },
  ];
  const CENTRING = { P: ['primitive', '단순'], I: ['body-centred', '체심'], F: ['face-centred', '면심'], C: ['base-centred', '저심'], R: ['rhombohedral', '능면체'] };
  const lat = { sys: 'cubic', cen: 'F' };
  const KEYS = ['a', 'b', 'c', 'al', 'be', 'ga'];
  const system = () => SYSTEMS.find((s) => s.id === lat.sys);
  function cellNow() {
    const v = Object.fromEntries(KEYS.map((k) => [k, num(`l-${k}`)]));
    return { ...v, ...system().cell(v) };
  }
  function latticeChips() {
    chips('l-systems', SYSTEMS.map((s) => ({ label: tr(s.en, s.ko), s })), ({ s }) => {
      lat.sys = s.id;
      if (!s.cen.includes(lat.cen)) lat.cen = s.cen[0];
      latticeChips(); lattice();
    });
    press('l-systems', SYSTEMS.findIndex((s) => s.id === lat.sys));
    const cens = system().cen;
    chips('l-centrings', cens.map((c) => ({ label: `${c} · ${tr(...CENTRING[c])}`, c })), ({ c }) => { lat.cen = c; latticeChips(); lattice(); });
    press('l-centrings', cens.indexOf(lat.cen));
  }
  function lattice() {
    const s = system(), cell = cellNow(), l = lambda();
    KEYS.forEach((k) => { $(`l-${k}-f`).hidden = !s.free.includes(k); });
    const [h, k, ll] = ['l-h', 'l-k', 'l-l'].map((id) => Math.round(num(id)));
    const V = calc.volume(cell), name = `${s.p}${lat.cen}`;
    if (!(V > 0)) return show('l-out', [[tr('No cell', '셀 없음'), null, tr('These angles do not close a cell.', '이 각도로는 셀이 닫히지 않습니다.')]]);
    const rows = [[tr('Lattice', '격자'), name, ''], [tr('Cell volume', '셀 부피'), fmt(V, 5), 'Å³']];
    if (!(h || k || ll)) rows.push([tr('Pick hkl', 'hkl 입력'), null, tr('(000) is the direct beam.', '(000)은 직진 빔입니다.')]);
    else {
      const d = calc.dSpacing(cell, h, k, ll), tth = calc.twoTheta(d, l);
      rows.push(['d', fmt(d), 'Å'], ['2θ', Number.isFinite(tth) ? fmt(tth) : '—', Number.isFinite(tth) ? '°' : ''], ['q', fmt(calc.dFromQ(d)), 'Å⁻¹']);
      const by = calc.absentBy(lat.cen, h, k, ll);
      if (by) rows.push([tr('Absent', '소멸'), null, tr(`(${h}${k}${ll}) is forbidden by ${by} (${CENTRING[by][0]}) centring.`, `(${h}${k}${ll})은 ${by}(${CENTRING[by][1]}) 중심화로 사라지는 반사입니다.`)]);
    }
    show('l-out', rows);
    // The first allowed reflections, one per d (lowest |hkl| as the label), that this energy can reach
    const seen = new Map();
    for (let a = 4; a >= -4; a--) for (let b = 4; b >= -4; b--) for (let c = 4; c >= -4; c--) { // descending: (1 1 1), not (−1 −1 −1)
      if (!(a || b || c) || calc.absentBy(lat.cen, a, b, c)) continue;
      const d = calc.dSpacing(cell, a, b, c), key = d.toFixed(4), neg = (a < 0) + (b < 0) + (c < 0);
      if (!(d > l / 2) || (seen.has(key) && seen.get(key).neg <= neg)) continue; // 2d > λ; per spacing keep the fewest minus signs
      seen.set(key, { d, neg, hkl: [a, b, c] });
    }
    const peaks = [...seen.values()].sort((p, q2) => q2.d - p.d).slice(0, 8);
    chips('l-peaks', peaks.map(({ d, hkl }) => ({ label: `(${hkl.join(' ')}) ${fmt(calc.twoTheta(d, l), 4)}°`, hkl })), ({ hkl }) => {
      ['l-h', 'l-k', 'l-l'].forEach((id, i) => { $(id).value = hkl[i]; });
      lattice();
    });
  }

  const on = (ids, fn) => ids.forEach((id) => $(id).addEventListener('input', fn));
  on(['l-a', 'l-b', 'l-c', 'l-al', 'l-be', 'l-ga', 'l-h', 'l-k', 'l-l'], lattice);
  on(['f-h', 'f-a', 'f-s'], footprint);
  on(['a-t', 'a-l'], transmission);
  on(['s-tth', 's-w', 's-k'], scherrer);

  // Link state: typed values that differ from the defaults go in the query string, so a link reproduces the page
  const inputs = [...document.querySelectorAll('main input')];
  const params = new URLSearchParams(location.search);
  inputs.forEach((i) => { if (params.has(i.id)) i.value = params.get(i.id); });
  angleSource = ['b-tth', 'b-q'].find((id) => params.has(id)) ?? 'b-d';
  if (SYSTEMS.some((x) => x.id === params.get('l-sys'))) lat.sys = params.get('l-sys');
  lat.cen = system().cen.includes(params.get('l-cen')) ? params.get('l-cen') : (params.has('l-sys') ? system().cen[0] : lat.cen);
  const link = () => {
    const derived = ['e-ang', 'b-tth', 'b-q', 'b-d'].filter((id) => id !== angleSource);
    const p = new URLSearchParams();
    inputs.forEach((i) => { if (!derived.includes(i.id) && i.value !== i.defaultValue) p.set(i.id, i.value); });
    if (lat.sys !== 'cubic' || lat.cen !== 'F') { p.set('l-sys', lat.sys); p.set('l-cen', lat.cen); }
    return `${location.origin}${location.pathname}${p.size ? `?${p}` : ''}${location.hash}`;
  };
  document.querySelector('main').addEventListener('input', () => history.replaceState(null, '', link()));
  document.querySelector('main').addEventListener('click', (e) => { if (e.target.closest('.chips')) history.replaceState(null, '', link()); });
  $('share').addEventListener('click', () => copy(link(), $('share')));

  $('e-ang').value = fmt(calc.wavelength(num('e-kev')), 6);
  latticeChips();
  beam(); footprint(); transmission();
  window.addEventListener('langchange', () => { angle(); footprint(); transmission(); scherrer(); latticeChips(); lattice(); });
})();
