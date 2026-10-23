---
title: Testing a CUDA port against its CPU twin
description: How I check that a CUDA phase-retrieval library computes what its JAX original does, iteration by iteration from shared starts, with a tolerance taken from float32 rounding, and the build traps that made a passing test mean less than it said.
tags: [gpu, testing, phase retrieval]
---

## Context

[QoraPhaseCU](https://github.com/NaNIsaac/QoraPhaseCU) is a C++20 and CUDA port of
[QoraPhase](https://github.com/NaNIsaac/QoraPhase), my JAX library for phase retrieval in coherent
diffraction imaging. It follows QoraPhase operator for operator (ER, HIO, RAAR, shrinkwrap,
detwinning) and has a CPU reference backend and a CUDA backend behind one API. The question for a
port is simple to state: does it compute the same thing? Comparing final reconstructions does not
answer it. Phase retrieval from random starts lands on different solutions, and two libraries that
both reach a low error can still disagree on every step along the way.

## What I found

### Same start, few iterations

The first change was to let QoraPhaseCU accept a starting object instead of drawing its own random
start ([QoraPhaseCU#1](https://github.com/NaNIsaac/QoraPhaseCU/pull/1)). With that, the equivalence
suite ([QoraPhaseCU#2](https://github.com/NaNIsaac/QoraPhaseCU/pull/2), merged) gives both libraries
the same start and compares them iteration by iteration:

- ER, HIO and RAAR, 10 iterations, on 32×32, 33×31, 16³ and 15×16×17 arrays (even, odd, 2D, 3D);
- masked pixels, 200 ER iterations, and shrinkwrap (max and rms) with detwinning and repeats;
- on QoraPhaseCU alone, invariances: a global phase carries through, and a twin start with the
  mirrored support gives the twin.

The comparisons are short on purpose. While choosing the tolerance policy for QoraPhase's own
reference ([QoraPhase#17](https://github.com/NaNIsaac/QoraPhase/pull/17), still open), a probe showed
that HIO and RAAR amplify a $$10^{-7}$$ rounding difference to $$10^{-2}$$–$$10^{-1}$$ within 50
iterations, for complex64 against complex128 of the same NumPy reference as much as for JAX. A long
comparison of those two would mostly measure that amplification. ER
stays within the rounding floor for 200 iterations, so it gets the long test.

### A tolerance from rounding, not from what passes

Two bounds, and the suite uses whichever is available:

- **Fixed:** a relative distance of $$10^{-4}$$, about ten times the largest distance measured between
  the two libraries on these cases.
- **Floor:** when `qoraphase.testing` is importable, each case is run through the NumPy reference in
  complex64 and in complex128, and the distance between the two is that case's floor. A backend
  passes if it is within ten times the floor of the complex128 result.

I prefer the floor: it is set per case by what float32 arithmetic can reach there, which one
fixed number cannot be.

### The first GPU run

On 23 October I ran it on an RTX 5070 (CUDA 13.4, native Windows): 36 equivalence tests passed, 18
on the CPU backend and 18 on CUDA, with the fixed bound and the floor bound both, and the C++ suite
passed 68 of 68, including the CUDA variants (naive, fused, graph-launched, batched, cuFFT callback)
against the CPU backend from given starts. CI has no GPU, so the CUDA half of this runs only where I
run it by hand.

The same check, one level up: [QoraHolo](https://github.com/NaNIsaac/QoraHolo), a holotomography
package (off-axis holograms in, a 3D refractive-index volume out) with a CPU and a CUDA
implementation of every stage, has a first-run example that simulates 49 angles of a bead
with 1 % noise and reconstructs it. Built with CUDA, it printed a mean refractive index inside the
bead of 1.3592 (true 1.3600) and an RMSE of $$1.89 \times 10^{-3}$$; `backend="cpu"` on the same
build, and a CPU-only build, printed the same two numbers
([QoraHolo#9](https://github.com/NaNIsaac/QoraHolo/pull/9)). That is agreement at the printed
precision of a smoke test, not a toleranced comparison like the one above.

### Build traps that fake a result

Four things could make a passing run mean less than it said.

- **`No CUDA toolset found` is the environment, not the code.** On Windows, scikit-build-core
  configures with the Visual Studio generator by default, and that generator finds CUDA only through
  the toolkit's Visual Studio integration. A toolkit from conda-forge does not have it. Setting
  `CMAKE_GENERATOR=Ninja` avoids it; this is now in both packages' install docs.
- **A rebuild without CUDA.** `uv run` without `--no-sync` rebuilds the package without the CMake
  define, so a test command can silently run against a CPU-only module. The run above used
  `--no-sync` and checked that `cuda_available()` returned true.
- **A missing DLL path.** A CUDA build imported without `CUDA_PATH` set fails with
  `DLL load failed while importing _core`.
- **A toolchain that cannot link.** The local MinGW toolchain fails to link the Python module (a
  libstdc++ symbol mismatch), so the Python tests ran in CI on the wheel job, and the GPU run used
  MSVC.

I also wrote down the versions (Python 3.14.5, jax and jaxlib 0.12.0.1 on CPU, numpy 2.5.4, as
locked) because the older CPU timings in QoraPhase's performance notes used JAX 0.11.1 and are not
comparable with anything here.

## Next

The JAX side of the comparison ran on CPU only. JAX has no CUDA build for native Windows, so
JAX-on-GPU equivalence needs WSL2. The proposal is to run the same suite there together with the
GPU speed measurements, rather than hold this check open for it. The floor bound depends on
`qoraphase.testing`, which arrives with QoraPhase#17.
