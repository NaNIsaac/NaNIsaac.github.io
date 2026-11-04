import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { braggAngle, braggPeakIntensity, braggDirection, detectorPattern, LATTICE } from './physics.mjs';

const $ = (id) => document.getElementById(id);
const canvas = $('scene-3d');
const wrap = $('scene-wrap');
const angle = $('angle');
const ratioInput = $('ratio');
const mapCanvas = $('detector-map');
const plotCanvas = $('rocking-plot');
const mapCtx = mapCanvas.getContext('2d', {willReadFrequently: true});
const plotCtx = plotCanvas.getContext('2d');
const fallback = $('scene-fallback');
const DEG = 180 / Math.PI;
const DETECTOR = {x: 3.2, centerZ: 2.0, horizontalSpan: 3.4, verticalSpan: 2.5};
let phi = -braggAngle(Number(ratioInput.value));
let ratio = Number(ratioInput.value);
let rocking = false;
let visible = true;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let lastMap = -Infinity, lastAngle = NaN, lastRatio = NaN, playingSince = 0;
let renderer, detectorTexture, sample, scatterRay, scatterGlow, spot, controls, scene, camera, raf = 0;

function paintMap() {
  const field = detectorPattern(phi, ratio, {width: mapCanvas.width, height: mapCanvas.height, ...DETECTOR});
  const frame = mapCtx.createImageData(field.width, field.height);
  for (let i = 0; i < field.pixels.length; i++) {
    // Display-only nonlinear contrast makes weak spots visible.
    const v = Math.pow(Math.min(1, field.pixels[i]), 0.32);
    const off = 4 * i;
    frame.data[off] = Math.round(9 + 243 * v);
    frame.data[off + 1] = Math.round(24 + 206 * v);
    frame.data[off + 2] = Math.round(36 + 116 * v);
    frame.data[off + 3] = 255;
  }
  mapCtx.putImageData(frame, 0, 0);
  if (detectorTexture) detectorTexture.needsUpdate = true;
}

function paintPlot() {
  const ctx = plotCtx, w = plotCanvas.width, h = plotCanvas.height;
  const left = 53, right = w - 22, top = 23, bottom = h - 48;
  const min = -42, max = 10;
  const xx = (v) => left + (v - min) / (max - min) * (right - left);
  const yy = (v) => bottom - v * (bottom - top);
  ctx.fillStyle = '#0f1c25'; ctx.fillRect(0, 0, w, h);
  ctx.lineWidth = 1; ctx.strokeStyle = '#374953';
  ctx.font = '12px Archivo, sans-serif'; ctx.fillStyle = '#a4b4b7';
  ctx.textAlign = 'right';
  for (const v of [0, .25, .5, .75, 1]) {
    const y = yy(v); ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke();
    ctx.fillText(v.toFixed(2).replace(/0$/, ''), left - 9, y + 4);
  }
  ctx.textAlign = 'center';
  for (const v of [-40, -30, -20, -10, 0, 10]) {
    const x = xx(v); ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke();
    ctx.fillText(v + '°', x, bottom + 22);
  }
  ctx.strokeStyle = '#e1ca70'; ctx.lineWidth = 2.7; ctx.beginPath();
  for (let i = 0; i <= 300; i++) {
    const degrees = min + (max - min) * i / 300;
    const intensity = braggPeakIntensity(degrees / DEG, ratio);
    if (i === 0) ctx.moveTo(xx(degrees), yy(intensity));
    else ctx.lineTo(xx(degrees), yy(intensity));
  }
  ctx.stroke();
  ctx.strokeStyle = '#80aeba'; ctx.setLineDash([5, 5]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xx(-braggAngle(ratio) * DEG), top);
  ctx.lineTo(xx(-braggAngle(ratio) * DEG), bottom); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = '#e6e5dd'; ctx.lineWidth = 1.5; ctx.beginPath();
  ctx.moveTo(xx(phi * DEG), top); ctx.lineTo(xx(phi * DEG), bottom); ctx.stroke();
  ctx.fillStyle = '#f2e6c1'; ctx.beginPath();
  ctx.arc(xx(phi * DEG), yy(braggPeakIntensity(phi, ratio)), 4.3, 0, 2 * Math.PI); ctx.fill();
  ctx.textAlign = 'left'; ctx.fillStyle = '#a4b4b7'; ctx.font = '12px Archivo,sans-serif';
  ctx.fillText(document.documentElement.lang === 'ko' ? '결정 회전각' : 'Crystal rotation', left, bottom + 40);
}

function updateReadout() {
  angle.value = (phi * DEG).toFixed(1);
  $('angle-value').textContent = (phi * DEG).toFixed(1) + '°';
  $('ratio-value').textContent = ratio.toFixed(2);
  $('bragg-value').textContent = (braggAngle(ratio) * DEG).toFixed(1) + '°';
  const signal = braggPeakIntensity(phi, ratio);
  $('signal-value').textContent = signal.toFixed(3);
  const nearPeak = Math.abs(phi + braggAngle(ratio)) < 0.025;
  $('signal-explanation').textContent = document.documentElement.lang === 'ko'
    ? (nearPeak ? '브래그 조건 부근: 산란파가 같은 위상으로 더해져 강한 신호를 만듭니다.' : '브래그 조건에서 벗어남: 산란파가 서로 상쇄되어 이 방향의 신호가 약해집니다.')
    : (nearPeak ? 'Near the Bragg condition: scattered waves add in phase, producing a strong peak.' : 'Away from Bragg: scattered waves cancel and the signal in this direction weakens.');
  if (sample) sample.rotation.y = phi;
  if (!scatterRay) return;
  const dir = braggDirection(ratio);
  const end = new THREE.Vector3(DETECTOR.x, 0, dir.z * DETECTOR.x / dir.x);
  for (const line of [scatterRay, scatterGlow]) {
    const positions = line.geometry.attributes.position;
    positions.setXYZ(0, 0, 0, 0); positions.setXYZ(1, end.x, end.y, end.z);
    positions.needsUpdate = true; line.geometry.computeBoundingSphere();
  }
  const v = Math.pow(braggPeakIntensity(phi, ratio), .45);
  scatterRay.material.opacity = .12 + .84 * v;
  scatterGlow.material.opacity = .11 + .65 * v;
  spot.position.copy(end); spot.material.opacity = .13 + .80 * v;
}

function updateMeasurements(force = false) {
  const now = performance.now();
  if (force || ((!rocking || now - lastMap > 90) && (lastAngle !== phi || lastRatio !== ratio))) {
    paintMap(); paintPlot();
    lastMap = now; lastAngle = phi; lastRatio = ratio;
  }
  updateReadout();
}

function addLine(from, to, color, opacity = 1) {
  const points = [new THREE.Vector3(...from), new THREE.Vector3(...to)];
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({color, opacity, transparent: true, depthWrite: false})
  );
  scene.add(line); return line;
}

function createScene() {
  try {
    renderer = new THREE.WebGLRenderer({canvas, alpha: true, antialias: true, powerPreference: 'low-power'});
  } catch (error) {
    fallback.textContent = document.documentElement.lang === 'ko'
      ? 'WebGL을 시작하지 못했습니다. 아래의 검출기와 회전 곡선은 이용할 수 있습니다.'
      : 'WebGL is unavailable. The detector map and rocking curve below remain available.';
    return false;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(38, 1, .1, 70);
  camera.position.set(6.4, 4.5, 8.3); camera.lookAt(.3, 0, .7);
  controls = new OrbitControls(camera, canvas);
  controls.target.set(.25, 0, .6);
  controls.enableDamping = true; controls.dampingFactor = .07;
  controls.minDistance = 4.2; controls.maxDistance = 19;
  controls.enablePan = false; controls.maxPolarAngle = Math.PI * .84;
  controls.enableDamping = !reducedMotion.matches;
  const initialCamera = camera.position.clone();
  const initialTarget = controls.target.clone();
  $('reset-view').addEventListener('click', () => {
    camera.position.copy(initialCamera);
    controls.target.copy(initialTarget);
    controls.update();
  });
  canvas.addEventListener('keydown', (event) => {
    const delta = .10;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const offset = camera.position.clone().sub(controls.target);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    if (event.key === 'ArrowLeft') spherical.theta -= delta;
    if (event.key === 'ArrowRight') spherical.theta += delta;
    if (event.key === 'ArrowUp') spherical.phi = Math.max(.1, spherical.phi - delta);
    if (event.key === 'ArrowDown') spherical.phi = Math.min(Math.PI - .1, spherical.phi + delta);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
    controls.update();
  });
  scene.add(new THREE.HemisphereLight(0xd4e8ff, 0x273a46, 2.0));
  const sun = new THREE.DirectionalLight(0xffe4a9, 2.3);
  sun.position.set(-4, 6, 6); scene.add(sun);
  const fill = new THREE.DirectionalLight(0x9dbeda, 1.1);
  fill.position.set(3, 1, -4); scene.add(fill);

  // Atomic positions are drawn for illustration. The physics module uses
  // the same finite lattice dimensions, in lattice-spacing units.
  sample = new THREE.Group(); scene.add(sample);
  const atoms = new THREE.InstancedMesh(
    new THREE.SphereGeometry(.045, 8, 6),
    new THREE.MeshStandardMaterial({color: 0xd8b969, roughness: .35, metalness: .38}),
    LATTICE.nx * LATTICE.ny * LATTICE.nz
  );
  const matrix = new THREE.Matrix4();
  const step = .285; let index = 0;
  for (let iz = 0; iz < LATTICE.nz; iz++) {
    for (let iy = 0; iy < LATTICE.ny; iy++) {
      for (let ix = 0; ix < LATTICE.nx; ix++) {
        matrix.makeTranslation(
          (ix - (LATTICE.nx - 1) / 2) * step,
          (iy - (LATTICE.ny - 1) / 2) * step,
          (iz - (LATTICE.nz - 1) / 2) * step
        );
        atoms.setMatrixAt(index++, matrix);
      }
    }
  }
  atoms.instanceMatrix.needsUpdate = true; sample.add(atoms);
  sample.add(new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(LATTICE.nx * step, LATTICE.ny * step, LATTICE.nz * step)),
    new THREE.LineBasicMaterial({color: 0x7397aa, opacity: .3, transparent: true})
  ));
  for (let iz = 1; iz < LATTICE.nz - 1; iz += 2) {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry((LATTICE.nx - 1) * step, (LATTICE.ny - 1) * step),
      new THREE.MeshBasicMaterial({color: 0x6e94a3, transparent: true, opacity: .055, side: THREE.DoubleSide, depthWrite: false})
    );
    plane.position.z = (iz - (LATTICE.nz - 1) / 2) * step; sample.add(plane);
  }
  addLine([-3.5, 0, 0], [0, 0, 0], 0xb1ddec, .9);
  const source = new THREE.Mesh(new THREE.SphereGeometry(.085, 12, 10), new THREE.MeshBasicMaterial({color: 0xc5e8e8}));
  source.position.set(-3.48, 0, 0); scene.add(source);
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 10), new THREE.MeshBasicMaterial({color: 0xffdd7c})));
  scatterGlow = addLine([0, 0, 0], [DETECTOR.x, 0, 2], 0xffd87a, .15);
  scatterRay = addLine([0, 0, 0], [DETECTOR.x, 0, 2], 0xf8c34e, .8);

  detectorTexture = new THREE.CanvasTexture(mapCanvas);
  detectorTexture.colorSpace = THREE.SRGBColorSpace;
  detectorTexture.minFilter = THREE.LinearFilter;
  detectorTexture.magFilter = THREE.LinearFilter;
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(DETECTOR.horizontalSpan, DETECTOR.verticalSpan),
    new THREE.MeshBasicMaterial({map: detectorTexture, side: THREE.DoubleSide})
  );
  screen.rotation.y = -Math.PI / 2;
  screen.position.set(DETECTOR.x, 0, DETECTOR.centerZ); scene.add(screen);
  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(DETECTOR.horizontalSpan, DETECTOR.verticalSpan)),
    new THREE.LineBasicMaterial({color: 0xa8b3ad, opacity: .85, transparent: true})
  );
  outline.rotation.copy(screen.rotation); outline.position.copy(screen.position);
  outline.position.x -= .015; scene.add(outline);
  spot = new THREE.Mesh(
    new THREE.SphereGeometry(.07, 10, 8),
    new THREE.MeshBasicMaterial({color: 0xffe6a7, transparent: true, opacity: 1, depthWrite: false})
  );
  scene.add(spot);
  const grid = new THREE.GridHelper(9, 18, 0x38515e, 0x2c404c);
  grid.position.y = -1.45; grid.material.transparent = true; grid.material.opacity = .35;
  scene.add(grid);

  function resize() {
    const rect = wrap.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(wrap);
  else window.addEventListener('resize', resize, {passive: true});
  resize(); fallback.hidden = true;
  return true;
}

angle.addEventListener('input', () => {
  rocking = false; $('rock').setAttribute('aria-pressed', 'false');
  phi = Number(angle.value) / DEG; updateMeasurements(true);
});
ratioInput.addEventListener('input', () => {
  ratio = Number(ratioInput.value); updateMeasurements(true);
});
$('find-peak').addEventListener('click', () => {
  rocking = false; $('rock').setAttribute('aria-pressed', 'false');
  phi = -braggAngle(ratio); updateMeasurements(true);
});
$('rock').addEventListener('click', () => {
  rocking = !rocking; playingSince = performance.now();
  $('rock').setAttribute('aria-pressed', String(rocking));
});
$('save-map').addEventListener('click', () => {
  // Save the raw simulated detector canvas; the nonlinear contrast is visual only.
  const link = document.createElement('a');
  link.download = `diffraction-detector-${(phi * DEG).toFixed(1)}deg.png`;
  link.href = mapCanvas.toDataURL('image/png');
  link.click();
});
window.addEventListener('langchange', updateReadout);
reducedMotion.addEventListener('change', () => {
  if (controls) controls.enableDamping = !reducedMotion.matches;
  if (reducedMotion.matches) { rocking = false; $('rock').setAttribute('aria-pressed', 'false'); }
});
window.addEventListener('langchange', paintPlot);
window.addEventListener('themechange', paintPlot);
if ('IntersectionObserver' in window) {
  new IntersectionObserver(entries => {
    visible = entries.some(e => e.isIntersecting);
  }, {threshold: .01}).observe(wrap);
}
const has3D = createScene();
updateMeasurements(true); // 2D map and plot work if WebGL initialization fails.
function frame(time) {
  raf = requestAnimationFrame(frame);
  if (!visible || document.hidden) return;
  if (rocking) {
    phi = -braggAngle(ratio) + .22 * Math.sin((time - playingSince) * .0009);
    updateMeasurements();
  }
  if (has3D) { controls.update(); renderer.render(scene, camera); }
}
raf = requestAnimationFrame(frame);
window.addEventListener('pagehide', () => { if (raf) cancelAnimationFrame(raf); });
