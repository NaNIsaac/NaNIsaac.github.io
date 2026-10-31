// Reciprocal-space geometry in units of 2π/d, incident beam along +x.
// Rotate crystal about +y. Target reciprocal vector is G=(0,0,1).
export const TARGET = Object.freeze([0, 0, 1]);
export const toDegrees = r => r * 180 / Math.PI;
export const toRadians = d => d * Math.PI / 180;
export function braggAngle(ratio) {
  if (!Number.isFinite(ratio) || ratio <= 0 || ratio >= 2) throw new RangeError('Require 0 < λ/d < 2');
  return Math.asin(ratio / 2);
}
export function reciprocalPoint(h, k, l, phi) {
  const c = Math.cos(phi), s = Math.sin(phi);
  return {x:c*h+s*l, y:k, z:-s*h+c*l};
}
export function ewaldMismatch(g, ratio) {
  if (!Number.isFinite(ratio) || ratio <= 0) throw new RangeError('Require λ/d > 0');
  const kin = 1 / ratio;
  return Math.hypot(kin+g.x, g.y, g.z)-kin;
}
export function outgoingDirection(g, ratio) {
  const kin = 1 / ratio, v = {x:kin+g.x, y:g.y, z:g.z};
  const n = Math.hypot(v.x,v.y,v.z);
  return {x:v.x/n,y:v.y/n,z:v.z/n};
}
export function targetMismatch(phi, ratio) {
  return ewaldMismatch(reciprocalPoint(...TARGET, phi), ratio);
}
export function reciprocalGrid(phi, bound = 2) {
  const result=[];
  for(let h=-bound;h<=bound;h++) for(let k=-bound;k<=bound;k++)
    for(let l=-bound;l<=bound;l++){
      if(h===0&&k===0&&l===0)continue;
      result.push({h,k,l,...reciprocalPoint(h,k,l,phi)});
    }
  return result;
}
// Visual selection band, not instrumental resolution.
export function approximateEwaldHits(phi,ratio,tolerance=.07) {
  return reciprocalGrid(phi).filter(g => g.x+1/ratio>0 && Math.abs(ewaldMismatch(g,ratio))<tolerance);
}
export function targetDiffractionAngle(phi,ratio) {
  const s=outgoingDirection(reciprocalPoint(...TARGET,phi),ratio);
  return Math.atan2(s.z,s.x);
}
