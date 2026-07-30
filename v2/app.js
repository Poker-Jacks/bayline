import * as THREE from 'three';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const stage = document.getElementById('stage');
const fb = document.getElementById('fallback');
export function boot(){
if (reduce){ stage.style.display='none'; fb.style.display='flex'; return; }

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, innerWidth/innerHeight, .1, 120);
const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0xBDD3DE, 1.05));
const key = new THREE.DirectionalLight(0xffffff, 2.1);
key.position.set(5,8,6); key.castShadow=true; key.shadow.mapSize.set(1024,1024);
key.shadow.camera.near=1; key.shadow.camera.far=30;
key.shadow.camera.left=-8; key.shadow.camera.right=8; key.shadow.camera.top=8; key.shadow.camera.bottom=-8;
key.shadow.bias=-0.0006; scene.add(key);
const rim = new THREE.DirectionalLight(0xE8613C,.45); rim.position.set(-7,3,-5); scene.add(rim);

/* ── textura de cartón procedural ─────────────────────────── */
function cardboard(w=512,h=512,base='#D9C9A8'){
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const x=c.getContext('2d');
  x.fillStyle=base; x.fillRect(0,0,w,h);
  // fibras
  const img=x.getImageData(0,0,w,h), d=img.data;
  for(let i=0;i<d.length;i+=4){
    const n=(Math.random()-.5)*22;
    d[i]=Math.min(255,Math.max(0,d[i]+n));
    d[i+1]=Math.min(255,Math.max(0,d[i+1]+n));
    d[i+2]=Math.min(255,Math.max(0,d[i+2]+n*1.2));
  }
  x.putImageData(img,0,0);
  // corrugado
  x.globalAlpha=.10; x.strokeStyle='#8A7350'; x.lineWidth=1.6;
  for(let y=0;y<h;y+=7){ x.beginPath(); x.moveTo(0,y); x.lineTo(w,y); x.stroke(); }
  x.globalAlpha=.06; x.strokeStyle='#FFF6E4';
  for(let y=3;y<h;y+=7){ x.beginPath(); x.moveTo(0,y); x.lineTo(w,y); x.stroke(); }
  const t=new THREE.CanvasTexture(c);
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=4;
  return t;
}
const texOut = cardboard(512,512,'#DCCBA9');
const texIn  = cardboard(512,512,'#C6B189');
const matCaja = new THREE.MeshStandardMaterial({map:texOut, roughness:.94, metalness:0, side:THREE.DoubleSide});
const matIn   = new THREE.MeshStandardMaterial({map:texIn,  roughness:.96, metalness:0, side:THREE.DoubleSide});
const M=(c,r=.75,m=.05)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
const matMadera=M(0xC9A87C,.93), matBoya=M(0xE8613C,.5,.08), matMetal=M(0xAFC7D6,.32,.85);
const matP1=M(0x3E7CA6,.7), matP2=M(0xBDD3DE,.8), matP3=M(0x12405E,.7);

const root = new THREE.Group(); root.scale.setScalar(.8); scene.add(root);
const mk=(w,h,d,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.castShadow=true;m.receiveShadow=true;return m;};

/* palet */
const palet=new THREE.Group();
for(let i=0;i<3;i++){const t=mk(3.5,.13,.44,matMadera);t.position.set(0,-1.34,-1.08+i*1.08);palet.add(t);}
for(let i=0;i<3;i++){const b=mk(.36,.24,2.8,matMadera);b.position.set(-1.45+i*1.45,-1.52,0);palet.add(b);}
root.add(palet);

/* caja */
const W=3.2,H=2.0,D=2.4,T=.08;
const caja=new THREE.Group(); root.add(caja);
const piso=mk(W,T,D,matCaja); piso.position.y=-1.2; caja.add(piso);
const pL=mk(T,H,D,matCaja); pL.position.set(-W/2,-1.2+H/2,0); caja.add(pL);
const pR=mk(T,H,D,matCaja); pR.position.set( W/2,-1.2+H/2,0); caja.add(pR);
const pB=mk(W,H,T,matCaja); pB.position.set(0,-1.2+H/2,-D/2); caja.add(pB);

/* PARED FRONTAL que se abre hacia abajo (bisagra abajo) */
const pivF=new THREE.Group(); pivF.position.set(0,-1.2,D/2); caja.add(pivF);
const pFront=mk(W,H,T,matCaja); pFront.position.set(0,H/2,0); pivF.add(pFront);
const cinta=mk(W*1.004,.15,T*1.5,matBoya); cinta.position.set(0,H*.62,0); pivF.add(cinta);

/* tapas superiores */
const tapaGeo=new THREE.BoxGeometry(W,T,D/2);
const pivA=new THREE.Group(); pivA.position.set(0,-1.2+H,-D/2); caja.add(pivA);
const tA=new THREE.Mesh(tapaGeo,matCaja); tA.castShadow=true; tA.position.z=D/4; pivA.add(tA);
const pivB=new THREE.Group(); pivB.position.set(0,-1.2+H,D/2); caja.add(pivB);
const tB=new THREE.Mesh(tapaGeo,matCaja); tB.castShadow=true; tB.position.z=-D/4; pivB.add(tB);

/* producto adentro */
const carga=new THREE.Group(); root.add(carga);
[[-.9,-.55,matP1],[0,-.55,matP2],[.9,-.55,matP3],[-.45,.55,matP2],[.45,.55,matP1]]
 .forEach(([x,z,m],i)=>{
  const c=mk(.8,.74,.8,m); c.position.set(x,-1.2+.37+.05,z); c.userData.i=i; carga.add(c);
  const l=mk(.82,.055,.82,matBoya); l.position.set(x,-1.2+.76,z); l.userData.i=i; carga.add(l);
});

/* gancho */
const gan=new THREE.Group(); root.add(gan);
const barra=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1.6,12),matMetal); barra.position.y=2.6; gan.add(barra);
const anillo=new THREE.Mesh(new THREE.TorusGeometry(.23,.05,10,26),matBoya);
anillo.position.y=1.74; anillo.rotation.x=Math.PI/2; gan.add(anillo);
[[-W/2,-D/2],[W/2,-D/2],[-W/2,D/2],[W/2,D/2]].forEach(([x,z])=>{
  const a=new THREE.Vector3(0,1.7,0), b=new THREE.Vector3(x,-1.2+H,z);
  const len=a.distanceTo(b);
  const cb=new THREE.Mesh(new THREE.CylinderGeometry(.016,.016,len,6),matMetal);
  cb.position.copy(a.clone().add(b).multiplyScalar(.5));
  cb.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), b.clone().sub(a).normalize());
  gan.add(cb);
});

const suelo=new THREE.Mesh(new THREE.PlaneGeometry(40,40), new THREE.ShadowMaterial({opacity:.13}));
suelo.rotation.x=-Math.PI/2; suelo.position.y=-1.78; suelo.receiveShadow=true; scene.add(suelo);

/* ── scroll ─────────────────────────────────────────────── */
let target=0,cur=0,t0=0;
const maxS=()=>Math.max(1,document.body.scrollHeight-innerHeight);
const onS=()=>{target=scrollY/maxS()}; addEventListener('scroll',onS,{passive:true}); onS();
const cl=v=>Math.min(1,Math.max(0,v));
const sm=t=>t*t*(3-2*t);
const seg=(p,a,b)=>sm(cl((p-a)/(b-a)));
function track(p,K){for(let i=0;i<K.length-1;i++){const[p0,v0]=K[i],[p1,v1]=K[i+1];
  if(p<=p1){const t=cl((p-p0)/((p1-p0)||1));return v0+(v1-v0)*sm(t);}}return K[K.length-1][1];}

function frame(now){
  const dt=Math.min(.05,(now-t0)/1000||0); t0=now;
  cur += (target-cur)*(1-Math.pow(.0018,dt));
  const p=cur;

  root.position.x = track(p,[[0,0],[.16,0],[.26,2.5],[.40,2.5],[.50,-2.5],[.62,-2.5],[.72,2.5],[.84,2.5],[.92,0],[1,0]]);
  root.rotation.y = -.5 + p*2.2;
  root.position.y = Math.sin(p*Math.PI)*.3 - p*.15;

  /* apertura: tapas primero, pared frontal después */
  const oT = seg(p,.14,.26);
  pivA.rotation.x = -oT*2.15; pivB.rotation.x = oT*2.15;
  const oF = seg(p,.24,.38);
  pivF.rotation.x = oF*1.75;                    // la pared cae hacia el frente

  /* el producto sale escalonado */
  const lift = seg(p,.34,.58);
  carga.children.forEach(c=>{
    const d=c.userData.i*.09;
    const l=cl((lift-d)/(1-d||1));
    c.position.y = (c.geometry.parameters.height>.3 ? -1.2+.42 : -1.2+.76) + l*1.5;
    c.rotation.y = l*(c.userData.i%2?-.6:.6);
  });

  camera.position.set(0, .55+p*.9, 10.4-p*.9);
  camera.lookAt(root.position.x*.42, -.1+p*.4, 0);
  renderer.render(scene,camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,2));
},{passive:true});
}
