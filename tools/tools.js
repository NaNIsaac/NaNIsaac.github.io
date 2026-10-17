// Wires the /tools fields to calc.js. Every input recalculates on 'input'.
(() => {
  const $ = (id) => document.getElementById(id);
  const num = (id) => parseFloat($(id).value);
  const fmt = (v, digits = 4) => (Number.isFinite(v) ? +v.toPrecision(digits) : '—');
  const on = (ids, fn) => { ids.forEach((id) => $(id).addEventListener('input', fn)); fn(); };

  // Energy ↔ wavelength: whichever field was typed in drives the other
  const energyOut = () => {
    const lambda = num('e-ang');
    $('e-out').textContent = `E = ${fmt(num('e-kev'), 6)} keV   λ = ${fmt(lambda, 6)} Å   k = ${fmt((2 * Math.PI) / lambda)} Å⁻¹`;
  };
  $('e-kev').addEventListener('input', () => { $('e-ang').value = fmt(calc.wavelength(num('e-kev')), 6); energyOut(); });
  $('e-ang').addEventListener('input', () => { $('e-kev').value = fmt(calc.energy(num('e-ang')), 6); energyOut(); });
  $('e-ang').value = fmt(calc.wavelength(num('e-kev')), 6);
  energyOut();

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

  // A copy button under every result
  document.querySelectorAll('.tool-out').forEach((out) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tool-copy';
    b.textContent = 'Copy';
    b.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(out.textContent.replace(/ {3}/g, ', ')); b.textContent = 'Copied'; } catch { b.textContent = 'Select and copy'; }
      setTimeout(() => { b.textContent = 'Copy'; }, 1500);
    });
    out.after(b);
  });
})();
