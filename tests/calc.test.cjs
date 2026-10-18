// Run: node tests/calc.test.cjs
const assert = require('node:assert');
const { calc } = require('../tools/calc.js');
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

near(calc.wavelength(8.048), 1.5406, 1e-3, 'Cu Kα1 wavelength'); // 8.048 keV ↔ 1.5406 Å
near(calc.energy(calc.wavelength(12.4)), 12.4, 1e-12, 'round trip');
near(calc.twoTheta(3.1356, 1.5406), 28.44, 0.02, 'Si(111) 2θ with Cu Kα1'); // tabulated 28.44°
assert.ok(Number.isNaN(calc.twoTheta(0.5, 1.5406)), 'λ > 2d has no Bragg angle');
const q = calc.q(28.44, 1.5406);
near(calc.dFromQ(q), 3.1356, 2e-3, 'q → d recovers Si(111)');
near(calc.footprint(0.1, 0.5), 11.459, 1e-3, '0.1 mm beam at 0.5° covers 11.46 mm');
near(calc.transmission(1, 1), Math.exp(-1), 1e-15, 'one attenuation length');
near(calc.twoThetaFromQ(q, 1.5406), 28.44, 1e-9, 'q → 2θ round trip');
near(calc.dCubic(5.43102, 1, 1, 1), 3.1356, 1e-4, 'Si(111) from a');
near(calc.fillAngle(0.1, 11.459), 0.5, 1e-4, 'fill angle inverts footprint');
near(calc.scherrer(28.44, 0.2, 1.5406), 409.8, 0.5, 'Scherrer, 0.2° FWHM at Si(111)');

// Lattices: the general form reduces to the cubic, hexagonal and orthorhombic textbook formulas
const cub = { a: 5.43102, b: 5.43102, c: 5.43102, al: 90, be: 90, ga: 90 };
near(calc.dSpacing(cub, 1, 1, 1), 3.1356, 1e-4, 'Si(111) from the general form');
near(calc.volume(cub), 5.43102 ** 3, 1e-9, 'cubic volume');
const hex = { a: 3.21, b: 3.21, c: 5.21, al: 90, be: 90, ga: 120 }; // Mg
const dHex = (h, k, l) => 1 / Math.sqrt((4 / 3) * (h * h + h * k + k * k) / hex.a ** 2 + l * l / hex.c ** 2);
for (const [h, k, l] of [[1, 0, 0], [0, 0, 2], [1, 0, 1], [1, 1, 0], [1, 0, 3]]) near(calc.dSpacing(hex, h, k, l), dHex(h, k, l), 1e-9, `hexagonal (${h}${k}${l})`);
near(calc.volume(hex), (Math.sqrt(3) / 2) * 3.21 ** 2 * 5.21, 1e-9, 'hexagonal volume');
const ort = { a: 4, b: 5, c: 6, al: 90, be: 90, ga: 90 };
near(calc.dSpacing(ort, 1, 2, 3), 1 / Math.sqrt(1 / 16 + 4 / 25 + 9 / 36), 1e-12, 'orthorhombic (123)');
// Monoclinic (b unique): 1/d² = (h²/a² + k² sin²β/b² + l²/c² − 2hl cos β/(ac)) / sin²β
const mon = { a: 5, b: 6, c: 7, al: 90, be: 100, ga: 90 }, cb = Math.cos(Math.PI * 100 / 180), sb2 = 1 - cb * cb;
near(calc.dSpacing(mon, 1, 1, 1), 1 / Math.sqrt((1 / 25 + sb2 / 36 + 1 / 49 - (2 * cb) / 35) / sb2), 1e-12, 'monoclinic (111)');
// Centring extinctions
assert.strictEqual(calc.absentBy('F', 1, 1, 1), null);
assert.strictEqual(calc.absentBy('F', 2, 0, 0), null);
assert.strictEqual(calc.absentBy('F', 1, 0, 0), 'F');
assert.strictEqual(calc.absentBy('I', 1, 1, 0), null);
assert.strictEqual(calc.absentBy('I', 1, 0, 0), 'I');
assert.strictEqual(calc.absentBy('C', 1, 1, 1), null);
assert.strictEqual(calc.absentBy('C', 1, 0, 1), 'C');
assert.strictEqual(calc.absentBy('R', 1, 0, 1), null); // −1 + 0 + 1 = 0
assert.strictEqual(calc.absentBy('R', 1, 0, 0), 'R');
assert.strictEqual(calc.absentBy('R', 0, 1, 2), null); // 0 + 1 + 2 = 3
assert.strictEqual(calc.absentBy('P', 1, 0, 0), null);

console.log('calc: ok');
