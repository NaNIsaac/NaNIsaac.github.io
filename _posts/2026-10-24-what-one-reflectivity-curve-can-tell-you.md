---
title: What one reflectivity curve can tell you
description: Whether a wrong X-ray reflectivity fit comes from the optimizer or from the curve itself, what a scan of 36 simulated conditions settled, and the 13 it could not decide.
tags: [xrr, statistics]
---

This is research in progress. The work sits in an open draft pull request,
[ReflectoLearn#24](https://github.com/NaNIsaac/ReflectoLearn/pull/24); every number below is
copied from that branch and its linked issues.

## Context

ReflectoLearn fits X-ray reflectivity (XRR) curves of thin films: a network gives a first guess of
thickness $$d$$, roughness $$\sigma$$ and scattering length density $$\rho$$ (in
$$10^{-6}\,\text{Å}^{-2}$$), and a local fit called refine polishes it together with instrument
nuisances such as an angle offset, the resolution, the Cu Kα2 fraction and a thin top oxide. On
simulated curves, refine sometimes ended 30 % or more away from the true film. Either the optimizer
stopped in the wrong place, or several structures fit the curve within the counting noise. The
first needs a better fit; the second needs a method that returns more than one answer. I wanted to
know which before building anything.

## What I found

**The local picture overstated the problem.** The Fisher information of Poisson counts,
$$F = J^\mathsf{T} \operatorname{diag}(\lambda)\, J$$ with $$J = \partial \ln \lambda / \partial \theta$$,
gives the smallest standard deviation an unbiased fit can reach, $$\sqrt{(F^{-1})_{ii}}$$. With the
top oxide free over an unbounded range, film thickness traded against the oxide's density with a
correlation of −0.998 to −1.000, and at $$q_\max = 0.21\,\text{Å}^{-1}$$ the bound on $$d$$ was 5 to
34 %. That looked like a non-identifiable film. It was not: within refine's actual bounds (oxide SLD
15 to 22, Kα2 ratio at most 0.6) the weak direction is cut off, and on a 2θ 0.2–6° scan $$d$$ came
out to about ±0.4 %. I wrote the first conclusion into the notes and then had to correct it.

**A profile likelihood is easy to compute too optimistically.** The quantity that decides is

$$
\mathrm{PL}(d) = \min_{\eta} D(d, \eta), \qquad \Delta\chi^2(d) = \mathrm{PL}(d) - \min_d \mathrm{PL}(d),
$$

where $$D$$ is the Poisson deviance and $$\eta$$ are the other eleven parameters. My first version
stepped $$d$$ outward and warm-started each inner fit from the previous point. A local fit can only
find a value at or above the true minimum, so that curve is an upper bound on $$\mathrm{PL}$$: its
$$\Delta\chi^2 \le 1$$ interval is a lower bound on the true one, and "no second minimum" holds only
along the branch it followed. The cross-review caught this; each profile point is now the lowest of
three restarted fits, and modes come from global starts.

**refine's wrong answers were its own.** From 16 starts on each of three curves, all 48 refine
endpoints were worse than the best fit by $$\Delta D > 4.8 \times 10^4$$. Forty-three are plain
optimizer failures: they are worse even on refine's own objective. The other five are preferred by
refine's log-MSE objective over the maximum-likelihood fit, so a better optimizer would not fix
them ([#25](https://github.com/NaNIsaac/ReflectoLearn/issues/25)). A likelihood preset reached the
best fit from 46 of 48 starts, but only 42 of 48 on new seeds and a new film, under the
pre-registered 43, so it is offered as an opt-in in an open PR
([#31](https://github.com/NaNIsaac/ReflectoLearn/pull/31)) and the default stays as it is.

**The MCMC intervals had not converged.** refine's sampler runs 2000 steps and keeps half. The
autocorrelation time τ was 76 to 97 steps, so the kept half is a quarter to a fifth of the 50 τ a
converged estimate needs, and nothing warned ([#29](https://github.com/NaNIsaac/ReflectoLearn/issues/29)). Whitening the coordinates by the
Fisher matrix at the fit and switching to differential-evolution moves cut τ by a factor of 2 to 4,
enough for two of three cases to converge. In one of them the Gaussian likelihood in $$\log_{10} R$$
that refine uses gave a thickness interval 2.45 times wider than the profile, while the Poisson
likelihood agreed. The third case still does not converge.

**The condition scan.** I registered the rules before running: 36 noise-free conditions over
$$q_\max$$, film contrast, how freely the nuisances move, and single film versus bilayer; 64
Latin-hypercube starts each; a parameter is *multimodal* if two distinct modes sit within
$$\Delta\chi^2 \le 1$$, a *ridge* if its half-width is at least 2 %, *identifiable* otherwise.

- Single film, 19 conditions: one mode in every one. $$\rho$$ is identifiable in all 19. $$d$$ is
  identifiable in 7 and a ridge in 12, and 11 of those 12 half-widths are 2.2 to 3.8 %, close to the
  line I drew.
- Bilayer, 18 conditions: only 5 reached the true structure's basin at all, from 1 to 5 of 64 starts.
  Those 5 have one mode each. The other 13 were never reached, so they are **not tested**. They are
  not evidence of a single solution, and among them are 5 of the 6 bilayer conditions that the
  decision rule depends on.

A thin search also weakens the single-film negatives. If the true basin is reached from $$k$$ of 64
starts, a second basin of the same size is missed by all of them with probability
$$(1 - k/64)^{64} \approx e^{-k}$$: 0.36 for $$k = 1$$. Four single-film conditions and two of the
reached bilayers sit at $$k = 1$$ or 2.

So I am not building a model that returns several answers, on the conditions I could actually
test. "XRR is unimodal here" is not what the scan shows.

## Next

The 13 undecided bilayer conditions go into a separately registered run with a stronger search:
more starts or a higher evaluation cap (41 to 54 of 64 bilayer fits stopped at the 200-evaluation
limit), with one condition timed first. refine itself needs a working optimizer and a likelihood
that matches the counts: fixes, not new models.
