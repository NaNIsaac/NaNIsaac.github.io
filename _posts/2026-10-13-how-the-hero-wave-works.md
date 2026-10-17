---
title: How the homepage wave works
description: The model behind the interactive hero — a 2D scalar wave equation on a grid, a double slit with absorbing jaws, and what the detector line does and does not measure.
tags: [simulation, waves]
---

The ripple field on the front page is not an animation loop. It is a small solver
for the 2D scalar wave equation, stepped about 120 times per second in your browser.

## Model

$$
\frac{\partial^2 u}{\partial t^2} = c^2 \left( \frac{\partial^2 u}{\partial x^2} + \frac{\partial^2 u}{\partial y^2} \right) + s(x, y, t)
$$

discretized with the explicit leapfrog scheme and a five-point Laplacian on square cells:

$$
u^{n+1}_{ij} = 2u^n_{ij} - u^{n-1}_{ij} + r^2 \left( u^n_{i+1,j} + u^n_{i-1,j} + u^n_{i,j+1} + u^n_{i,j-1} - 4u^n_{ij} \right)
$$

with $$r = c\,\Delta t / \Delta x = 0.5$$, inside the 2D stability limit $$r \le 1/\sqrt{2}$$.
Units are grid cells and time steps — there is no mapping to SI and none is implied.

- **One steady source** on the home page, $$s \propto \sin(2\pi t / T)$$,
  sits left of the slits so the double slit always has something to diffract. The slit itself
  is fixed here; moving it is the [lab](/lab/)'s job. (The lab keeps two coherent oscillators
  with $$T = 24$$ steps by default, so the wavelength is $$cT = 12$$ cells; a slider changes it.)
- **Moving the mouse** leaves a faint wake of Gaussian bumps whose amplitude scales with
  pointer speed; **click** adds one strong bump; **dragging** adds a rate-limited trail.
- **The barrier** is two cells of Dirichlet wall, $$u = 0$$, with a six-cell graded damping
  layer on its upstream face, so the jaws mostly soak up what hits them, like tungsten
  X-ray slit blades. This is an approximation, not a perfect absorber: some reflection
  remains. (The lab can switch the jaws to ideal reflectors.) Each slit is 7 cells wide,
  narrower than the 12-cell wavelength, so diffraction is strong.
- **Edges** use a quadratic sponge layer,
  $$u^{n+1} = \left[ 2u^n - (1-\sigma)u^{n-1} + r^2 \nabla^2 u^n \right] / (1+\sigma)$$,
  to suppress border reflections. It is an approximation, not a perfectly matched layer.

## The detector line

The curve on the right is an exponential moving average of $$u^2$$ along one column,
with a time constant of about six periods, normalized to its own maximum. It is a
*relative* intensity from the solver arrays only — the glow and bloom are drawn on top
and never feed into it. In the lab, drag a slit and the fringes on the detector respond after a short lag.

One honest caveat: this is an in-plane 2D field. A real double slit lit in 3D produces a
2D pattern on a screen; here the slit is a gap in a line, and the detector sees a 1D profile.
The fringe physics — spacing shrinks as the slits move apart — is the same.

## Colors

The field is drawn like exposed film on a grey panel: crests develop toward the ink colour,
troughs toward the opposite tone. The shading is a visual encoding of the sign of $$u$$,
not the colour of any real wavelength.

The solver is about 100 lines of plain JavaScript (`wave.js`), with a regression test that
checks stability, absorption at the edges, that a closed barrier blocks transmission, and
that the absorbing jaws send back less than a quarter of the energy reflecting ones do.
