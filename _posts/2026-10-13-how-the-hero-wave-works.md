---
title: How the homepage wave works
description: The model behind the interactive hero — a 2D scalar wave equation on a grid, a reflecting double slit, and what the detector line does and does not measure.
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

- **Sources** are two coherent oscillators, each a small Gaussian drive
  $$s \propto \sin(2\pi t / T)$$ with $$T = 16$$ steps, so the wavelength is
  $$cT = 8$$ cells.
- **Click** adds a single Gaussian bump; **dragging on empty space** adds a rate-limited
  trail of smaller bumps. Neither creates new persistent sources.
- **The barrier** is Dirichlet, $$u = 0$$: an idealized *reflecting* wall, which is why
  the region left of it fills with standing-wave structure. Each slit is 7 cells wide,
  a bit less than one wavelength, so diffraction is strong.
- **Edges** use a quadratic sponge layer,
  $$u^{n+1} = \left[ 2u^n - (1-\sigma)u^{n-1} + r^2 \nabla^2 u^n \right] / (1+\sigma)$$,
  to suppress border reflections. It is an approximation, not a perfectly matched layer.

## The detector line

The curve on the right is an exponential moving average of $$u^2$$ along one column,
with a time constant of about six periods, normalized to its own maximum. It is a
*relative* intensity from the solver arrays only — the glow and bloom are drawn on top
and never feed into it. Drag a slit and the fringes on the detector respond after a short lag.

One honest caveat: this is an in-plane 2D field. A real double slit lit in 3D produces a
2D pattern on a screen; here the slit is a gap in a line, and the detector sees a 1D profile.
The fringe physics — spacing shrinks as the slits move apart — is the same.

## Colors

Positive displacement maps toward cyan, negative toward violet, with a white highlight on
the strongest crests. The palette is a visual encoding of the sign of $$u$$, not the
color of any real wavelength.

The solver is about 70 lines of plain JavaScript (`wave.js`), with a regression test that
checks stability, absorption at the edges, and that a closed barrier blocks transmission.
