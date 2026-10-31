# Lab 2.0 / Step 01 — foundation

This stage is deliberately **additive**: no changes to published HTML, scenes or physics solvers.

## Numerical conventions
- Incident X-ray beam along +x; sample rotates around +y.
- UI and shared state: degrees. Physics engines: radians.
- Wavelength ratio is λ/d (dimensionless).
- Target reciprocal point is (001). The Bragg sample rotation is **negative**: phi = -asin((λ/d)/2).
- Diffraction computes finite simple-cubic lattice intensity (9×7×7 point scatterers).
- Ewald computes an ideal reciprocal-space geometry. Ewald mismatch is **not** physical intensity or instrumental peak width.
- Bragg intensity is normalized at the ideal peak. The detector visualization uses display-only contrast.

## Contract
- `lab/shared/experiment-state.mjs`: versioned state validation, defaults and URL parameter codec. No storage side effects. Share URLs contain no mission achievements.
- `lab/shared/diffraction-adapter.mjs`: pure numerical bridge, no DOM/Three.js dependency. It does not conflate Ewald mismatch with measured detector intensity.
- `lab/shared/foundation.test.mjs`: convention checks and serialization tests.
- Original scenes continue to use their existing physics modules until Step 02 integration.

## Local verification

```sh
node --test lab/diffraction-3d/physics.test.mjs lab/ewald/physics.test.mjs lab/shared/foundation.test.mjs
```

## Step 02 entry criteria
1. Existing physics tests plus foundation tests pass.
2. New Discover UI reads the adapter without changing the physics engines.
3. Game hints, success thresholds and results depend on **raw normalized intensity**, never the gamma-adjusted display brightness.
4. Any state restore uses validation and handles bad/old versions with a safe default.
5. Public pages remain unchanged until the playable mode is reviewed.
