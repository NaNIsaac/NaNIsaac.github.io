import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {braggAngle, reciprocalGrid, reciprocalPoint, targetMismatch, ewaldMismatch, toDegrees, toRadians} from './physics.mjs';

const $ = id => document.getElementById(id);
const angleSlider = $('angle'), ratioSlider = $('ratio');
const plot = $('mismatch-plot'), plotCtx = plot.getContext('2d');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const SCALE = .75;
const VIEW_BG = 0xf0e7d5; // Pale paper behind the pop-up physics diagrams.
let ratio = Number(ratioSlider.value);
let phi = 0; // Open away from Bragg: the visitor discovers the condition.
let scanning = false, scanStart = 0, visible = true;
const views = [];
let reciprocalGroup, targetBall, ewaldShell, ewaldWire, incident, outgoing, qLine;
let recipRenderer, realCrystal, drawFrame = 0;
let ewaldCircle = null;
let storyStep = 0, storyTarget = null;

function makeLine(scene, a, b, color, opacity = 1) {
  const geometry = new THREE.BufferGeometry().setFromPoints([a, b]);
  const material = new THREE.LineBasicMaterial({color, transparent:opacity<1, opacity});
  const line = new THREE.Line(geometry, material);
  scene.add(line); return line;
}
function setLine(line, a, b) {
  const arr = line.geometry.attributes.position;
  arr.setXYZ(0,a.x,a.y,a.z); arr.setXYZ(1,b.x,b.y,b.z);
  arr.needsUpdate = true; line.geometry.computeBoundingSphere();
}

function makeView(canvasId, cameraPos, target) {
  const canvas = $(canvasId), wrap = canvas.parentElement;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({canvas, alpha:false, antialias:true, powerPreference:'low-power'});
  } catch(error) {
    const warning = document.createElement('div');
    warning.className='ewald-webgl-warning';
    warning.textContent='WebGL unavailable — the numerical mismatch graph below still describes the Bragg condition.';
    warning.style.cssText='color:#dfe8e4;font:13px/1.6 sans-serif;padding:20px;position:absolute;inset:25% 4%;text-align:center';
    wrap.append(warning); return null;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();scene.background=new THREE.Color(VIEW_BG);
  const camera=new THREE.PerspectiveCamera(47,1,.1,60);
  camera.position.set(...cameraPos);
  const controls=new OrbitControls(camera,canvas);
  controls.target.set(...target);
  controls.enableDamping=!reduce.matches;
  controls.enablePan=false;
  controls.minDistance=3;controls.maxDistance=20;
  controls.update();
  scene.add(new THREE.HemisphereLight(0xfff7e8,0xb7aa91,2.5));
  const sun=new THREE.DirectionalLight(0xffe6bf,2.1);
  sun.position.set(-3,5,4);scene.add(sun);
  function resize(){
    const r=wrap.getBoundingClientRect();
    if(r.width===0||r.height===0)return;
    renderer.setSize(Math.round(r.width),Math.round(r.height),false);
    camera.aspect=r.width/r.height;camera.updateProjectionMatrix();
  }
  if('ResizeObserver' in window)new ResizeObserver(resize).observe(wrap);
  else addEventListener('resize',resize,{passive:true});
  resize();
  // Keyboard-only users can rotate the camera with the arrow keys.
  canvas.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
    e.preventDefault();
    const offset=camera.position.clone().sub(controls.target);
    const spherical=new THREE.Spherical().setFromVector3(offset);
    if(e.key==='ArrowLeft')spherical.theta-=.12;
    if(e.key==='ArrowRight')spherical.theta+=.12;
    if(e.key==='ArrowUp')spherical.phi=Math.max(.12,spherical.phi-.12);
    if(e.key==='ArrowDown')spherical.phi=Math.min(Math.PI-.12,spherical.phi+.12);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
    controls.update();
  });
  const view={scene,camera,renderer,controls,resize};
  views.push(view);return view;
}

function addAtoms(scene) {
  realCrystal=new THREE.Group();scene.add(realCrystal);
  const n=7,total=n*n*n;
  const inst=new THREE.InstancedMesh(
    new THREE.SphereGeometry(.058,8,6),
    new THREE.MeshStandardMaterial({color:0xa0784c,metalness:.08,roughness:.65}),
    total
  );
  const mat=new THREE.Matrix4();let i=0;
  for(let x=0;x<n;x++)for(let y=0;y<n;y++)for(let z=0;z<n;z++){
    mat.makeTranslation((x-3)*.32,(y-3)*.32,(z-3)*.32);
    inst.setMatrixAt(i++,mat);
  }
  inst.instanceMatrix.needsUpdate=true;realCrystal.add(inst);
  realCrystal.add(new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(2.06,2.06,2.06)),
    new THREE.LineBasicMaterial({color:0x8f7958,transparent:true,opacity:.32})
  ));
  makeLine(scene,new THREE.Vector3(-3.3,0,0),new THREE.Vector3(-1.15,0,0),0x327a91);
  const tip=new THREE.Mesh(new THREE.ConeGeometry(.11,.25,10),new THREE.MeshBasicMaterial({color:0x327a91}));
  tip.rotation.z=-Math.PI/2;tip.position.set(-1.15,0,0);scene.add(tip);
  const grid=new THREE.GridHelper(7,14,0xc1b39a,0xd2c6b3);
  grid.position.y=-1.3;grid.material.transparent=true;grid.material.opacity=.34;scene.add(grid);
}

function buildEwald(view) {
  const scene=view.scene;
  reciprocalGroup=new THREE.Group();scene.add(reciprocalGroup);
  const points=reciprocalGrid(0,2);
  const neutralMat=new THREE.MeshBasicMaterial({color:0x718995,transparent:true,opacity:.64});
  const geom=new THREE.SphereGeometry(.041,7,6);
  const inst=new THREE.InstancedMesh(geom,neutralMat,points.length);
  const matrix=new THREE.Matrix4();
  points.forEach((p,i)=>{matrix.makeTranslation(p.h*SCALE,p.k*SCALE,p.l*SCALE);inst.setMatrixAt(i,matrix)});
  inst.instanceMatrix.needsUpdate=true;reciprocalGroup.add(inst);
  targetBall=new THREE.Mesh(new THREE.SphereGeometry(.092,14,10),
    new THREE.MeshBasicMaterial({color:0xe8a43b}));
  reciprocalGroup.add(targetBall);targetBall.position.set(0,0,SCALE);
  const axisMat=new THREE.LineBasicMaterial({color:0x90a1a7,transparent:true,opacity:.50});
  const axisPoints=[[[ -2.4,0,0],[2.4,0,0]],[[0,-2.4,0],[0,2.4,0]],[[0,0,-2.4],[0,0,2.4]]];
  for(const [a,b] of axisPoints)scene.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a),new THREE.Vector3(...b)]),axisMat));
  const origin=new THREE.Mesh(new THREE.SphereGeometry(.066,12,10),
    new THREE.MeshBasicMaterial({color:0x283c47}));scene.add(origin);

  const sphereMaterial=new THREE.MeshBasicMaterial({
    color:0x69abc0,transparent:true,opacity:.16,side:THREE.DoubleSide,depthWrite:false
  });
  const wireMaterial=new THREE.MeshBasicMaterial({
    color:0x4f96a9,transparent:true,opacity:.34,wireframe:true,depthWrite:false
  });
  ewaldShell=new THREE.Mesh(new THREE.SphereGeometry(1,36,22),sphereMaterial);
  ewaldWire=new THREE.Mesh(new THREE.SphereGeometry(1,16,10),wireMaterial);
  scene.add(ewaldShell,ewaldWire);
  // The scattering-plane cross-section makes the sphere's geometry readable.
  const circlePoints=[];
  for(let i=0;i<=144;i++){
    const a=2*Math.PI*i/144;
    circlePoints.push(new THREE.Vector3(Math.cos(a),0,Math.sin(a)));
  }
  ewaldCircle=new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(circlePoints),
    new THREE.LineBasicMaterial({color:0x3b8194,transparent:true,opacity:.85})
  );
  scene.add(ewaldCircle);
  incident=makeLine(scene,new THREE.Vector3(-2,0,0),new THREE.Vector3(),0x31859b,.94);
  outgoing=makeLine(scene,new THREE.Vector3(-2,0,0),new THREE.Vector3(0,0,.75),0xc38a32,.9);
  qLine=makeLine(scene,new THREE.Vector3(),new THREE.Vector3(0,0,.75),0xc5a16d,.9);
  const grid=new THREE.GridHelper(8,16,0xc9bfae,0xd7cdbc);
  grid.position.y=-2.55;grid.material.transparent=true;grid.material.opacity=.26;
  scene.add(grid);
}

function updateGeometry() {
  if(realCrystal)realCrystal.rotation.y=phi;
  if(!reciprocalGroup)return;
  reciprocalGroup.rotation.y=phi;
  const k=1/ratio;
  const center=new THREE.Vector3(-k*SCALE,0,0);
  for(const obj of [ewaldShell,ewaldWire,ewaldCircle].filter(Boolean)){
    obj.position.copy(center);obj.scale.setScalar(k*SCALE);
  }
  const p=reciprocalPoint(0,0,1,phi);
  const g=new THREE.Vector3(p.x*SCALE,p.y*SCALE,p.z*SCALE);
  setLine(incident,center,new THREE.Vector3());
  setLine(outgoing,center,g);
  setLine(qLine,new THREE.Vector3(),g);
  const gap=Math.abs(targetMismatch(phi,ratio));
  const hit=gap<.022;
  targetBall.material.color.setHex(hit?0xffd269:0xe0a041);
  targetBall.scale.setScalar(hit?1.5:1);
  outgoing.material.opacity=hit?.95:.30;
  qLine.material.opacity=hit?.95:.55;
}

function plotMismatch() {
  const ctx=plotCtx,w=plot.width,h=plot.height;
  const left=68,right=w-28,top=23,bottom=h-56;
  const lo=-55,hi=20,ymin=-.45,ymax=.45;
  const xx=x=>left+(x-lo)/(hi-lo)*(right-left);
  const yy=y=>bottom-(y-ymin)/(ymax-ymin)*(bottom-top);
  ctx.fillStyle='#0e1c27';ctx.fillRect(0,0,w,h);
  ctx.font='12px Archivo, sans-serif';ctx.textAlign='right';
  for(const val of [-.4,-.2,0,.2,.4]){
    const y=yy(val);ctx.strokeStyle=val===0?'#afc7c5':'#2b4250';
    ctx.lineWidth=val===0?1.8:1;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();
    ctx.fillStyle='#9eb2b7';ctx.fillText(val.toFixed(1),left-9,y+4);
  }
  ctx.textAlign='center';
  for(const deg of [-50,-40,-30,-20,-10,0,10,20]){
    ctx.fillStyle='#9eb2b7';ctx.fillText(deg+'°',xx(deg),bottom+21);
  }
  ctx.beginPath();ctx.lineWidth=2.8;ctx.strokeStyle='#e7c66c';
  for(let i=0;i<=420;i++){
    const x=lo+(hi-lo)*i/420;
    const y=Math.max(ymin,Math.min(ymax,targetMismatch(toRadians(x),ratio)));
    if(i===0)ctx.moveTo(xx(x),yy(y));else ctx.lineTo(xx(x),yy(y));
  }
  ctx.stroke();
  const theta=-toDegrees(braggAngle(ratio));
  ctx.setLineDash([5,5]);ctx.strokeStyle='#86bac3';ctx.beginPath();
  ctx.moveTo(xx(theta),top);ctx.lineTo(xx(theta),bottom);ctx.stroke();ctx.setLineDash([]);
  const current=targetMismatch(phi,ratio);
  ctx.strokeStyle='#edf0e7';ctx.lineWidth=1.2;ctx.beginPath();
  ctx.moveTo(xx(toDegrees(phi)),top);ctx.lineTo(xx(toDegrees(phi)),bottom);ctx.stroke();
  ctx.fillStyle='#f9d987';ctx.beginPath();
  ctx.arc(xx(toDegrees(phi)),yy(Math.max(ymin,Math.min(ymax,current))),5,0,Math.PI*2);ctx.fill();
  ctx.font='12px Archivo, sans-serif';ctx.fillStyle='#b1c0c5';ctx.textAlign='left';
  ctx.fillText(document.documentElement.lang==='ko'?'결정 회전각':'Crystal rotation',left,bottom+43);
}

function updateState() {
  angleSlider.value=toDegrees(phi).toFixed(1);
  $('angle-value').textContent=toDegrees(phi).toFixed(1)+'°';
  $('ratio-value').textContent=ratio.toFixed(2);
  $('theta-value').textContent=toDegrees(braggAngle(ratio)).toFixed(1)+'°';
  const d=targetMismatch(phi,ratio);
  $('mismatch-value').textContent=(d>=0?'+':'')+d.toFixed(3);
  const hit=Math.abs(d)<.022;
  $('state').textContent=document.documentElement.lang==='ko'
    ? (hit?'(001)점이 Ewald 구 표면에 닿았습니다. 탄성 회절 조건입니다.':'(001)점이 구에서 벗어났습니다. 결정 회전각을 바꾸거나 브래그 조건 찾기를 눌러 보세요.')
    : (hit?'The (001) point reaches the Ewald sphere: the elastic diffraction condition is met.':'The (001) point misses the sphere. Rotate the crystal or select Find Bragg.');
  updateGeometry();plotMismatch();
}

angleSlider.addEventListener('input',()=>{
  storyTarget=null;
  scanning=false;$('scan').setAttribute('aria-pressed','false');
  phi=toRadians(Number(angleSlider.value));updateState();
});
ratioSlider.addEventListener('input',()=>{storyTarget=null;ratio=Number(ratioSlider.value);updateState()});
$('bragg').addEventListener('click',()=>{
  storyTarget=null;
  scanning=false;$('scan').setAttribute('aria-pressed','false');
  phi=-braggAngle(ratio);updateState();
});
$('scan').addEventListener('click',()=>{
  storyTarget=null;
  scanning=!scanning;scanStart=performance.now();
  $('scan').setAttribute('aria-pressed',String(scanning));
});
window.addEventListener('langchange',()=>{updateState();updateLesson()});
reduce.addEventListener('change',()=>{
  for(const view of views)view.controls.enableDamping=!reduce.matches;
  if(reduce.matches){scanning=false;$('scan').setAttribute('aria-pressed','false')}
});
if('IntersectionObserver' in window)
  new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting)}, {threshold:.03})
    .observe($('real-canvas'));


/* A three-beat lesson: first the physical object, then reciprocal geometry,
   finally the satisfying hit. No prior knowledge of reciprocal space needed. */
const chapters=[
  {
    title:['Why isn’t every angle bright?','결정을 비추면 항상 밝을까?'],
    body:['X-rays hit an ordered crystal. But the scattered waves do not always reinforce each other. The first view shows the crystal; the highlighted point in the second view represents one possible diffraction direction.','결정의 원자는 질서 있게 배열돼 있습니다. 하지만 산란된 파동이 언제나 같은 방향으로 보강되는 것은 아니죠. 먼저 왼쪽의 결정을 봅시다. 오른쪽 노란 점은 특정 회절 방향을 나타냅니다.'],
    progress:['01 / 03 · LOOK AT THE CRYSTAL','01 / 03 · 결정을 관찰하기'],
    action:['Turn the crystal →','결정을 돌려보기 →']
  },
  {
    title:['The crystal has a second map.','결정에는 또 다른 지도가 있습니다.'],
    body:['The right-hand dots are NOT atoms. Each is a possible momentum transfer, called a reciprocal-lattice point. The translucent sphere shows the transfers compatible with an X-ray keeping the same wavelength. Our golden dot has not reached it yet.','오른쪽의 점은 원자가 아닙니다. 각각은 결정의 주기성과 맞는 운동량 전달, 즉 역격자점입니다. 반투명한 구는 X선 파장이 바뀌지 않고 산란할 수 있는 조건을 나타냅니다. 아직 노란 점은 구에 닿지 않았습니다.'],
    progress:['02 / 03 · READ THE SECOND MAP','02 / 03 · 역공간 알아보기'],
    action:['Find the coincidence →','만나는 순간 찾기 →']
  },
  {
    title:['There — the Bragg reflection.','바로 그 순간, 브래그 회절.'],
    body:['The gold point now touches the sphere. The geometric condition for elastic diffraction is satisfied. Turn the angle slider away from this position, and the mismatch reappears. You have just found a Bragg angle without starting from the formula.','노란 점이 구 표면과 만났습니다. 이때 탄성 회절의 기하학적 조건이 성립합니다. 이제 아래 결정 회전각을 조금 바꾸면 다시 조건에서 벗어납니다. 수식을 외우기 전에 브래그 각도를 직접 찾은 셈입니다.'],
    progress:['03 / 03 · DISCOVER BRAGG','03 / 03 · 브래그 조건 발견'],
    action:['Try again ↺','다시 실험하기 ↺']
  }
];
function updateLesson(){
  const chapter=chapters[storyStep], lang=document.documentElement.lang==='ko'?1:0;
  $('lesson-number').textContent=String(storyStep+1).padStart(2,'0');
  $('lesson-progress').textContent=chapter.progress[lang];
  $('lesson-title').textContent=chapter.title[lang];
  $('lesson-text').textContent=chapter.body[lang];
  $('lesson-next').textContent=chapter.action[lang];
  $('lesson-restart').textContent=lang?'처음부터':'Start over';
  document.body.dataset.lessonStep=String(storyStep);
  const marks=[...document.querySelectorAll('.lesson-track span')];
  marks.forEach((mark,i)=>{
    mark.classList.toggle('current',i===storyStep);
    mark.classList.toggle('complete',i<storyStep);
  });
}
function setChapter(step){
  storyStep=step;scanning=false;
  $('scan').setAttribute('aria-pressed','false');
  if(step===0)storyTarget=0;
  if(step===1)storyTarget=-.10;
  if(step===2)storyTarget=-braggAngle(ratio);
  updateLesson();
}
$('lesson-next').addEventListener('click',()=>setChapter((storyStep+1)%3));
$('lesson-restart').addEventListener('click',()=>setChapter(0));

const left=makeView('real-canvas',[4.2,3.25,6.15],[0,0,0]);
const right=makeView('recip-canvas',[4.0,3.15,9.5],[-.65,0,0]);
if(left)addAtoms(left.scene);
if(right)buildEwald(right);
updateState();
updateLesson();

function animate(time) {
  drawFrame=requestAnimationFrame(animate);
  if(document.hidden||!visible)return;
  if(storyTarget!==null){
    const distance=storyTarget-phi;
    phi+=distance*.075;
    if(Math.abs(distance)<.0003){phi=storyTarget;storyTarget=null}
    updateState();
  } else if(scanning){
    phi=-braggAngle(ratio)+.24*Math.sin((time-scanStart)*.00095);
    updateState();
  }
  for(const view of views){view.controls.update();view.renderer.render(view.scene,view.camera)}
}
drawFrame=requestAnimationFrame(animate);
window.addEventListener('pagehide',()=>cancelAnimationFrame(drawFrame));
