import test from 'node:test';
import assert from 'node:assert/strict';
import {braggAngle, reciprocalPoint, ewaldMismatch, targetMismatch,
  targetDiffractionAngle, reciprocalGrid, approximateEwaldHits} from './physics.mjs';
const approx=(a,b,eps=1e-10)=>assert.ok(Math.abs(a-b)<eps, String(a)+' vs '+String(b));
test('reciprocal vector rotates about y',()=>{
  const g=reciprocalPoint(0,0,1,Math.PI/2);
  approx(g.x,1);approx(g.y,0);approx(g.z,0);
});
test('Ewald sphere passes through reciprocal origin',()=>{
  for(const r of [.36,.58,.9])approx(ewaldMismatch({x:0,y:0,z:0},r),0);
});
test('001 point reaches Ewald sphere at negative Bragg angle',()=>{
  for(const r of [.36,.58,.9])approx(targetMismatch(-braggAngle(r),r),0);
});
test('diffracted beam has correct 2θ at Bragg',()=>{
  const r=.58;approx(targetDiffractionAngle(-braggAngle(r),r),2*braggAngle(r));
});
test('rotation off Bragg makes a measurable mismatch',()=>{
  const r=.58;assert.ok(Math.abs(targetMismatch(-braggAngle(r)+.15,r))>.02);
});
test('reciprocal grid contains target but not origin',()=>{
  const points=reciprocalGrid(0,1);assert.equal(points.length,26);
  assert.ok(points.some(g=>g.h===0&&g.k===0&&g.l===1));
  assert.ok(!points.some(g=>g.h===0&&g.k===0&&g.l===0));
});
test('visual hit filter includes target at Bragg',()=>{
  const r=.58;assert.ok(approximateEwaldHits(-braggAngle(r),r).some(g=>g.h===0&&g.k===0&&g.l===1));
});
test('invalid input is rejected',()=>{
  assert.throws(()=>braggAngle(2.1),RangeError);
  assert.throws(()=>ewaldMismatch({x:0,y:0,z:0},0),RangeError);
});
