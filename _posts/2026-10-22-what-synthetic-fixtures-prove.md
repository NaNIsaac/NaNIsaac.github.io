---
title: What our synthetic fixtures prove, and what they do not
description: Five end-to-end tests on data with a known answer, the four problems they turned up, and the limits that keep a passing test from meaning more than it does.
tags: [testing, scientific software]
published: false
---

<!--
Draft for Isaac. Not published: `published: false` keeps Jekyll from building it.
Every number below is taken from the linked PR or issue; none was re-run for this note.
Items marked [source pending] need a citable PR before publishing.
-->

A synthetic fixture runs an analysis package on data whose answer is known: a sample is
simulated, turned into what the instrument would record, and pushed through the same public
functions a user calls. Five of the repositories behind this site now have one. This note says
what each one checks, what it found, and where its evidence stops.

## Two kinds of numbers

Each fixture stores two sets of expected values, kept apart on purpose.

- **Truth**: the answer that was put into the simulation, with a tolerance and a unit. A truth
  check asks whether the code is right.
- **Regression**: what the code returns today for a fixed random seed, with a tight tolerance. A
  regression check asks only whether the code changed.

When a truth check fails, the wrong value is not written into the truth. The failure becomes an
issue, and the check stays in the suite as a *strict expected failure* tied to that issue. The
suite stays green, the bug stays visible, and a fix makes the check pass unexpectedly, which fails
the run and forces someone to update the expected values on purpose.

Tolerances come from the noise, not from what happens to pass. For the ellipse fit below, a run
on one seed came out 3 to 7 % below the expected fit error. A sweep over 2000 seeds gave a mean
ratio of 0.9994 with a standard error of 0.0012 and a spread of 5.1 % per run: scatter, not bias.
The tolerance is about three of those spreads.

## The five fixtures

| package | path under test | truth checks | found |
|---|---|---|---|
| [CXD](https://github.com/NaNIsaac/CXD/pull/11) (coherent X-ray diffraction) | SPEC file and TIFF frames → q sampling → hand-off array for phase retrieval | total counts, q steps against the closed form, peak position after cropping | the hand-off accepted an inverted mask, and a (y, x, frame) array; both now raise (the axis order when the frame count is given) |
| [QoraPhase](https://github.com/NaNIsaac/QoraPhase/pull/12) (phase retrieval) | noisy diffraction counts → default reconstruction recipe, no support given | final error between 0.9 and 1.05 of the noise floor; support size against the object | nothing wrong |
| [ReflectoLearn](https://github.com/NaNIsaac/ReflectoLearn/pull/15) (X-ray reflectivity) | simulated counts → preprocessing → fit | film thickness, roughness, scattering length density (SLD) | SLD 30 % low |
| [QoraFlow](https://github.com/NaNIsaac/QoraFlow/pull/24) (pump-probe reduction) | raw run files → dark, QBPM normalisation, laser on/off split → ROI curves | on/off intensity ratio and peak shift against the injected response | shift 4 % low |
| [QoraDFXM](https://github.com/NaNIsaac/QoraDFXM/pull/12) (dark-field X-ray microscopy) | detector shot → ellipse fit and ring profile from the command line | centre, diameters, tilt, fit error against point jitter, ring radius | nothing wrong |

### What they caught

**A fit that trades one parameter for another**
([ReflectoLearn#14](https://github.com/NaNIsaac/ReflectoLearn/issues/14)). A 250 Å film with SLD
45 (in 10⁻⁶ Å⁻²) came out 252 Å thick, which is right, but with SLD 31.8. The simulated data had
no angular offset. The fit moved its 2θ offset to −0.078°, close to its bound, and lowered the SLD
to put the critical edge back where it was. Both the offset and the SLD move the edge, so the data
alone cannot always separate them. With the offset fixed at zero the SLD comes back to 44.3 to
44.8. Which fix is right changes every number the package reports, so it is a decision for the
maintainer, not for the test.

**A centroid pulled by the background**
([QoraFlow#28](https://github.com/NaNIsaac/QoraFlow/issues/28)). The laser-on peak was moved by
0.730, 1.297 and 1.446 pixels at three delays; the reduction reported 0.689, 1.241 and 1.366. The
ratio of reported to injected shift stayed between 0.94 and 0.98 over four seeds, so it is systematic. The centre of mass is
taken over the whole region of interest, and a flat background in that region pulls it toward the
region's centre. Subtracting the median of the region's edge recovers the injected shift. That does
not settle the fix: on a toy region with a sloped background, the edge median over-corrects to
1.314 for a true shift of 1.000, and fitting a plane to the edge instead under-corrects to 0.922
when the peak has a wide tail. Which estimate holds depends on what real backgrounds look like,
which a synthetic test cannot say.

**Inputs that should have been refused.** A second set of tests feeds deliberately wrong input.

- [ReflectoLearn#16](https://github.com/NaNIsaac/ReflectoLearn/issues/16): a reflectivity curve
  listed from high to low angle, as some instruments write it, was interpolated as if sorted and
  produced zero valid points, with no error. Swapped arguments and a q range outside the model grid
  did the same; an unsorted curve came out scrambled.
- [QoraPhase#16](https://github.com/NaNIsaac/QoraPhase/issues/16): a mask with its polarity
  inverted (98 % of pixels marked bad) and a pattern with its origin in the corner both reached the
  reconstruction without a warning.

None of these four shows up in a plot of a plausible-looking result. Each was found because the
test knew the answer.

## What a passing fixture does not show

- **Synthetic is not measured.** Every fixture draws its data from the same family of physics the
  code assumes: a Gaussian peak, a Parratt reflectivity, Poisson counts, a flat floor. Effects the
  simulation leaves out cannot fail the test: interdiffusion in a film, gain switching in the
  detector, a beam that is not Gaussian, a person who picks points with correlated errors. When the
  simulator and the model share an assumption, a passing test checks the arithmetic, not the
  assumption.
- **One seed, one sample.** Each regression snapshot is one draw. Where a seed sweep was run, this
  note says so; elsewhere the tolerance is an estimate.
- **A floor is not always noise.** In phase retrieval, the error a reconstruction reaches is easy to
  read as "not converged yet". On a benchmark where the true object is known, starting the default
  recipe from the truth itself still ends at a Fourier error of 0.051, and the truth cut to its own
  support fits only to 0.051, 0.034 or 0.025 depending on the support threshold. The object in
  detector frame is band-limited, not compact, so a support constraint cannot represent it exactly.
  That floor belongs to the problem, not to the algorithm, and a longer run will not lower it.
  [source pending: the F13d write-up]
- **A fixture covers one path.** CXD's fixture deliberately leaves out its quick regridding
  function, because that function ignores parts of the diffractometer geometry and a test through it
  would pin physically wrong values.

## What comes next

The open questions above (the offset-SLD trade-off, the background estimate) need measured data to
decide. One way is to take aggregate statistics from real runs, such as the slope of the background
at the edge of a region, and use those numbers to set up the synthetic cases, without publishing the
measurements themselves.
