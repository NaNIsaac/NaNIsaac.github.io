---
title: The same oxide, two conventions
description: My X-ray reflectivity tools put the native SiO₂ layer on opposite sides of the film depending on which code built the model, and for one test film the two orders give curves that differ by a median 60 %.
tags: [xrr, scientific software]
---

## Context

A thin film grown on a silicon wafer usually sits on the wafer's native SiO₂. In a
reflectivity model that is one more layer, and it has to go somewhere: under the film
(Si / SiO₂ / film) or on top of it (Si / film / SiO₂), as it would for a film that oxidises itself.
I have written the same pipeline more than once, in Reflecto, ReflectoExp and ReflectoLearn: a
simulator that makes training curves, a network that guesses the structure, a fitter that refines
the guess. I never wrote down which order each one used.

## What I found

An audit of where the XRR code came from turned it up
([ReflectoLearn#32](https://github.com/NaNIsaac-Research/ReflectoLearn/issues/32),
[ReflectoExp#9](https://github.com/NaNIsaac/ReflectoExp/issues/9),
[Reflecto#3](https://github.com/NaNIsaac/Reflecto/issues/3), all open). GenX stacks layers from the
substrate up, so `Stack(Layers=[Film, SiO2])` means Si / film / SiO₂, oxide on top. A cross-review
read the code of each tool and the GenX 3.8.0 source (GenX itself was not run):

| code | order, substrate → top | oxide |
|---|---|---|
| ReflectoExp training simulator (`simul_genx.py`) | Si / SiO₂ / film | under the film; its docstring says the opposite |
| ReflectoExp GenX fitters (exp05–07) | Si / film / SiO₂ | on top |
| ReflectoLearn training generator, refine, GenX fitter | Si / film / SiO₂ | on top |
| ReflectoLearn synthetic benchmark | Si / SiO₂ / film | under the film |

So in the older experiments the network was trained on curves with the oxide under the film and its
guess was then refined in a model with the oxide on top. Reflecto, which ships weights from those
experiments, has the same split. In the newer package the training side and the fit agree with
each other, but the synthetic benchmark used to score them builds its truth the other way round.

The two orders are not a small nuisance shift. For a 240 Å film (roughness 6 Å, SLD 45 in
$$10^{-6}\,\text{Å}^{-2}$$) on Si with 10 Å of SiO₂, an independent float64 Parratt calculation over
2θ 0.2–6° gives

$$
\operatorname{median}_q \left| \frac{R_\text{top}(q)}{R_\text{buried}(q)} - 1 \right| = 0.60,
$$

and the largest difference is 2.35 decades in $$\log_{10} R$$, because the fringe minima move.
Other films and oxide thicknesses give medians of 0.28 to 1.4. Part of the difference is where the
roughness goes: with the oxide on top, the oxide carries the surface roughness and the film's
roughness becomes a buried interface.

Did this make my earlier fits wrong? Some of the recorded GenX fits from those experiments ended
with several parameters at their bounds, which is what fitting the wrong structure can look like.
I have not checked whether this is the reason, nor how a trained network is affected. That is
the honest state: the mismatch is established, its effect on past results is not. The
identifiability study in [What one reflectivity curve can tell you](/notes/2026/10/what-one-reflectivity-curve-can-tell-you/)
has no such mismatch: none of its truth curves comes from the benchmark, and all of its forward
models put the oxide on top.

## Next

Which order is right depends on the sample: buried for a film deposited on a wafer, which is the
usual case; on top for a film that oxidises; both in the training distribution if the tools must
handle either. That is a decision still open. Whichever it is, the first step is the same: one
order used by the simulator, the fitter and the benchmark alike. I am designing a shared XRR
repository for the forward model, the structure generator and the fitter, and its structure
conventions are where the layer order will be written down once, with units, instead of being
inherited from whichever script a tool was copied from. Changing the order means regenerating the
training data, retraining, and rebuilding the golden values.
