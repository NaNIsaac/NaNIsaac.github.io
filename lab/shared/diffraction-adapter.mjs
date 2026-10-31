// Shared numeric contract between the existing diffraction and Ewald models.
// Internal rotation is radians; public UI rotation is degrees.
// A negative rotation reaches the (001) Bragg condition with beam along +x.
import {braggAngle as diffractionBragg, braggPeakIntensity, detectorPattern} from '../diffraction-3d/physics.mjs';
import {braggAngle as ewaldBragg, targetMismatch, targetDiffractionAngle} from '../ewald/physics.mjs';
import {validateParameters} from './experiment-state.mjs';

export function observeDiffraction(parameters, detectorOptions) {
  const {rotationDeg, wavelengthRatio} = validateParameters(parameters);
  const phi = rotationDeg * Math.PI / 180;
  const theta = diffractionBragg(wavelengthRatio);
  return {
    rotationDeg, wavelengthRatio,
    braggRotationDeg: -theta * 180 / Math.PI,
    normalizedIntensity: braggPeakIntensity(phi, wavelengthRatio),
    ewaldMismatch: targetMismatch(phi, wavelengthRatio),
    // The two modules describe different observables, not identical intensities.
    ...(detectorOptions ? {detector: detectorPattern(phi, wavelengthRatio, detectorOptions)} : {})
  };
}
export function validateModelAgreement(ratio, tolerance = 1e-12) {
  const a = diffractionBragg(ratio), b = ewaldBragg(ratio);
  if (Math.abs(a - b) > tolerance) throw new Error('Bragg conventions disagree');
  const phi = -a;
  if (Math.abs(targetMismatch(phi, ratio)) > tolerance) throw new Error('Ewald condition does not match diffraction');
  if (Math.abs(targetDiffractionAngle(phi, ratio) - 2*a) > tolerance)
    throw new Error('Scattered beam direction convention differs');
  if (Math.abs(braggPeakIntensity(phi, ratio) - 1) > tolerance)
    throw new Error('Diffraction peak not normalized');
  return true;
}
