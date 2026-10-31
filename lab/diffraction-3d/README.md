# Rotate the crystal — interactive 3D diffraction

A standalone physics exhibit for [Isaac Yong's lab](https://nanisaac.github.io/lab/).
After deployment: https://nanisaac.github.io/lab/diffraction-3d/

## What visitors can do

Drag to orbit a finite 9 × 7 × 7 simple-cubic lattice in a Three.js scene. Change crystal rotation and the wavelength/lattice-spacing ratio, or click **Find Bragg angle** and **Rock crystal**. The displayed detector map and rocking curve recalculate from the **same** kinematic coherent-sum model. English/Korean and dark/light modes reuse the main site's preferences.

The canvas texture is an enhanced-contrast representation of intensity; it is **not** a physically calibrated detector count. The 3D lattice point sizes and beam lines are diagrammatic.

## Model, not a measured diffraction result

The incident wave travels along +x. For each detector direction we evaluate

I(q) ∝ |∑ exp(iq·r_j)|², q = kout − kin,

with identical point scatterers at a finite simple-cubic array of positions. A separable product of finite-lattice interference factors evaluates the sum without a GPU compute step. The first-order Bragg angle obeys 2d sin θ = λ.

This is a kinematic single-scattering educational model. It **does not** include dynamical diffraction, multiple scattering, absorption, strains, detector response or photon statistics. No beamline measurement was analyzed or reproduced.

## Run and test

Serve from the website repository root:

~~~sh
python -m http.server 8080
# http://localhost:8080/lab/diffraction-3d/
~~~

Three.js and OrbitControls are imported from a fixed **0.160.0** CDN version, with no npm build step. The Three.js stage needs WebGL and network access to jsDelivr.

~~~sh
node --test lab/diffraction-3d/physics.test.mjs
node --check lab/diffraction-3d/scene.js
node --check lab/diffraction-3d/ui.js
~~~

The authoring sandbox ran **six physics checks successfully** and parsed the JS syntax. It could not complete an actual browser-rendering test because the sandbox browser blocked its local HTTP address. Test WebGL, CDN imports, rotation controls, and 390 px mobile layout in a normal browser before advertising this page on the homepage.

## Integration boundary

The page lives in its own directory and does not change existing home/lab files, because other open PRs edit those entrypoints. If the preview is acceptable, add a single link labeled **3D diffraction — rotate the crystal** on the 2D lab page after reconciling those PRs.

## Design reference, not copied assets

The interaction borrows *principles*, not source code or imagery: motion as scientific explanation (Every Joule), deliberate hover interaction and unobtrusive presentation (calzsvg). The Claude Artifact supplied by the owner was not accessible via this tool environment and was not used as a copied design source.
