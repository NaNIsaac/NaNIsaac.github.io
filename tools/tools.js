// Wires the /tools fields to calc.js. Every input recalculates on 'input'.
(() => {
  const $ = (id) => document.getElementById(id);
  const num = (id) => parseFloat($(id).value);
  const fmt = (v, digits = 4) => (Number.isFinite(v) ? +v.toPrecision(digits) : '—');
  const on = (ids, fn) => { ids.forEach((id) => $(id).addEventListener('input', fn)); fn(); };

  // Energy ↔ wavelength: whichever field was typed in drives the other
  $('e-kev').addEventListener('input', () => { $('e-ang').value = fmt(calc.wavelength(num('e-kev')), 6); });
  $('e-ang').addEventListener('input', () => { $('e-kev').value = fmt(calc.energy(num('e-ang')), 6); });
  $('e-ang').value = fmt(calc.wavelength(num('e-kev')), 6);

  on(['b-d', 'b-kev'], () => {
    const lambda = calc.wavelength(num('b-kev')), tth = calc.twoTheta(num('b-d'), lambda);
    $('b-out').textContent = Number.isFinite(tth)
      ? `2θ = ${fmt(tth)}°   θ = ${fmt(tth / 2)}°   q = ${fmt(calc.q(tth, lambda))} Å⁻¹   λ = ${fmt(lambda)} Å`
      : `No reflection: λ = ${fmt(lambda)} Å is longer than 2d.`;
  });

  on(['q-tth', 'q-kev'], () => {
    const q = calc.q(num('q-tth'), calc.wavelength(num('q-kev')));
    $('q-out').textContent = `q = ${fmt(q)} Å⁻¹   d = ${fmt(calc.dFromQ(q))} Å`;
  });

  on(['f-h', 'f-a'], () => { $('f-out').textContent = `Footprint L = ${fmt(calc.footprint(num('f-h'), num('f-a')))} mm`; });

  on(['a-t', 'a-l'], () => {
    const T = calc.transmission(num('a-t'), num('a-l'));
    $('a-out').textContent = `Transmitted ${fmt(100 * T, 3)}%   absorbed ${fmt(100 * (1 - T), 3)}%`;
  });
})();
