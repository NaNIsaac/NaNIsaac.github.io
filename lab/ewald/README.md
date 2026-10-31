# Ewald sphere: real space → reciprocal space

An interactive companion to [Rotate the crystal](../diffraction-3d/), at
/lab/ewald/. It explains **why** rotating a crystal produces a diffraction
condition using two synchronized Three.js views.

## Three short chapters, not an unexplained instrument panel

On entry the crystal starts **away from Bragg**, rather than already at the
answer. The guided story then moves through three ideas:

1. **Observe:** an ordered crystal does not produce a strong Bragg reflection
   at every angle.
2. **Interpret:** reciprocal-lattice points are momentum-transfer vectors,
   **not atoms**. The Ewald sphere represents elastic scattering geometry.
3. **Discover:** rotate the lattice until the (001) point reaches the sphere,
   then change the angle to see the condition fail again.

The **Show me / Find the coincidence** controls move the actual model
state, not a prerecorded video. The original independent angle/wavelength
controls remain available for exploration. Reduced-motion preferences
disable the optional automatic rocking animation on preference change.

Design direction: illustrated science field guide, with warm paper,
ink-colored diagrams, and one highlight color. This is an original
implementation informed by [Every Joule](https://iamtechartist.com/every-joule/)'s
predict/observe/discover teaching structure, not a copy of its code or art.

## What the visitor sees

- **Real space:** a schematic 7 × 7 × 7 simple-cubic atomic lattice.
- **Reciprocal space:** ideal reciprocal-lattice points from −2 through +2 in
  each coordinate (excluding the origin, drawn separately), an Ewald sphere,
  the incident wavevector, and a highlighted (001) vector.
- **Shared controls:** crystal rotation, wavelength/lattice-spacing ratio,
  one-click Bragg alignment, and a rocking animation.
- **A mismatch plot:** signed radial difference
  Δk = |k_in + G_001| − |k_in| against crystal rotation. Its zero means the
  highlighted reciprocal point touches the Ewald sphere.

In units of 2π/d, |k_in| = 1/(λ/d) and the Ewald sphere is centered at
−k_in. The incident beam is along +x and the crystal rotates about +y.
The highlighted G_001 intersects the sphere at phi = −asin(λ/2d).
At that condition the outgoing beam is deflected by 2 asin(λ/2d).

This is a **geometric single-scattering construction**, not a computed
reflection intensity or a measured diffraction pattern. The ideal points
have zero width; point highlighting uses a **display tolerance**, not a
physical peak width or detector resolution. The atomic spheres are schematic.

## Local use

Serve the website root with Python's HTTP server and open
http://localhost:8080/lab/ewald/. Three.js 0.160.0 is imported via
jsDelivr, so WebGL and external module access are needed for 3D.

## Test

Run from the website root:

    node --test lab/ewald/physics.test.mjs
    node --check lab/ewald/scene.js

Eight tests cover coordinate rotation, origin, Bragg geometry for several
wavelengths, expected 2θ, and the finite reciprocal grid. GitHub Actions
runs the tests and syntax checks on changes.

**Not verified by math tests:** the new chapter transitions, 3D rendering, mobile gesture interactions,
CDN availability, camera framing or screen-reader usability. Verify these
in an actual browser before highlighting on the main portfolio.

## Related

- [Finite crystal diffraction and detector intensity](../diffraction-3d/)
- [Time-dependent diffraction (TraTT)](https://github.com/NaNIsaac-Research/TraTT)
- [Phase-retrieval research (QoraPhase)](https://github.com/NaNIsaac/QoraPhase)
