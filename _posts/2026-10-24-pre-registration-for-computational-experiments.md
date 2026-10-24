---
title: Pre-registration for computational experiments
description: Writing down what result would make a claim false before running the simulation, three cases where the written prediction lost, and two errors that only an independent recomputation found.
tags: [methods, research]
---

## Context

A simulation can always be run once more. With a different grid, a different window, another
definition of the quantity being measured, a curve that looked wrong starts to look right, and
nothing in the record shows how many tries it took. Clinical trials answer this with
pre-registration: the outcome and the analysis are fixed before the data come in. I now do the same
for computations.

The rule I follow: before a computational experiment is run, its notebook or README states
what would make the claim false, as a number, a comparison and a convergence check. A result that
crosses the line is recorded as falsified; the line is not moved afterwards. Trial runs made before
the rule was written are listed as pilot history, and a confirmation uses new seeds and new
conditions.

Over roughly twelve hours on 22 and 23 October, about twenty experiments across my projects were
registered this way. Seven ended falsified or as a table of conditions instead of a yes.

## What I found

### Three predictions that lost

**One number for a crossover.** In the time-resolved diffraction work in
[TraTT#16](https://github.com/NaNIsaac-Research/TraTT/pull/16) (an open draft; the physics is not published
yet, so only the test is described here), the candidate central claim was that a single
dimensionless amplitude decides when a linear estimate stops working, whatever the packet length,
absorption or position. The rule, written into the script before the run: if, at equal amplitude,
the measured saturation spreads by more than a factor 2 across packet shapes, the claim is false.
Over 24 series and 192 points the spread was a factor 14.1 at the smallest amplitude tested and
still 3.7 at the largest (lab notebook Entry 68). The claim was reworded before anything was built
on it.

**A rule with a bug in it.** A later experiment (Entry 86) asked whether an integrated observable
tolerates a wide beam. Under the registered rule it did not pass. Reading
the result showed that the amplitude metric was mis-specified: it divided a beam-weighted mean by a
channel mean, so it measured the beam width, not the shape it was meant to test. The rule was not
altered after the fact. The flaw was written down, the verdict stayed "does not pass", and the
question was registered again (Entry 87) with every metric written as a formula first and the
normalisation denominators explicit. The expectation, also written beforehand, was that three of
the four step runs would pass at the narrowest registered beam width and one might not. Two step
runs failed there, one of them by 0.05 % on the period criterion, and so did the ramp run. The registered threshold was too tight by a factor
1.7 for two cases. It was not adjusted; the outcome is a table of the width each case needs.

**A regularizer that did less than expected.** For a 2D Born-approximation reconstruction
([QoraHolo#7](https://github.com/NaNIsaac/QoraHolo/pull/7), merged), four criteria were written down
before the noise study. Three passed. The third, that total-variation regularization would cut the
core standard deviation by at least 30 % at noise level η = 0.3 with a bias of at most
$$2 \times 10^{-4}$$, failed: the reduction was 10 %. A side prediction, that positivity would stop
beating plain Landweber iteration at η = 1.0, was also wrong. All of it is in the PR description,
next to the passes.

### Two errors that review found

Pre-registration protects against moving the goalposts. It does not catch an arithmetic slip in the
text that defines them. For that, a research result here is only called confirmed after a
cross-review in which someone who did not write the analysis recomputes at least one point
independently, without running the author's scripts.

- **A factor 2 in one sentence.** An independent integration reproduced two earlier TraTT results
  to three digits and, on the way, found that a sentence gave the displacement amplitude as
  $$u_0 = 7.6\ \text{pm} \times S$$. From $$u_0 = S d / 2\pi$$ with $$d = 96.01$$ pm it is
  $$15.28\ \text{pm} \times S$$; the sentence had quoted the $$S = 0.5$$ row of its own table. The
  table was right and no verdict changed (Entry 80), but a reader taking the sentence would have
  been off by 2.
- **A wave that does not couple.** One block of a table (Entry 85) carried over a transverse wave
  to a geometry where its displacement is perpendicular to the reflection vector, so
  $$\mathbf{h} \cdot \mathbf{u} = 0$$ and it does not enter the measurement at all. The block was
  recomputed with a longitudinal wave, and the first version's numbers are kept in the notebook,
  marked withdrawn.

In the same twelve hours, six results were corrected through cross-review. One of them is in
[What one reflectivity curve can tell you](/notes/2026/10/what-one-reflectivity-curve-can-tell-you/):
a profile likelihood computed by continuation is only an upper bound, so the widths it gives are
too narrow.

### What it costs

Writing the rule is quick. What it changes is what I am allowed to say afterwards. A
falsified line stays in the record next to the result that crossed it, and the honest reading of
Entry 87 is "passes under a looser condition than predicted", not "passes".

## Next

The registered rules and the results are still compared by hand. An automatic check, one that
reads the registered thresholds from a notebook and compares them with the recorded outcome, has
been proposed but not built.
