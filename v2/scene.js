import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function boot(host){
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(34, 1, .1, 100);
  cam.position.set(0,.5,9.2);

  const R = new THREE.WebGLRenderer({antialias:true, alpha:true, powerPreference:'high-performance'});
  R.setPixelRatio(Math.min(devicePixelRatio,2));
  /* ── lo que faltaba: color y tono correctos ── */
  R.outputColorSpace = THREE.SRGBColorSpace;
  R.toneMapping = THREE.ACESFilmicToneMapping;
  R.toneMappingExposure = 1.05;
  R.shadowMap.enabled = true;
  R.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(R.domElement);

  /* ── iluminación por entorno (IBL): da reflejos reales ── */
  const pmrem = new THREE.PMREMGenerator(R);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;

  const key = new THREE.DirectionalLight(0xfff4e6, 2.4);
  key.position.set(4.5,7.5,5); key.castShadow = true;
  key.shadow.mapSize.set(2048,2048);
  key.shadow.camera.near=1; key.shadow.camera.far=26;
  key.shadow.camera.left=-6; key.shadow.camera.right=6;
  key.shadow.camera.top=6; key.shadow.camera.bottom=-6;
  key.shadow.bias=-0.0004; key.shadow.normalBias=.02;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xdfeaf2, .45); fill.position.set(-5,2,3); scene.add(fill);
  const rim  = new THREE.DirectionalLight(0xE8613C, .55);  rim.position.set(-4,3,-6); scene.add(rim);

  /* ── textura de cartón con relieve ── */
  function cardTex(size=1024, base=[214,196,164]){
    const c=document.createElement('canvas'); c.width=c.height=size;
    const x=c.getContext('2d');
    x.fillStyle=`rgb(${base.join(',')})`; x.fillRect(0,0,size,size);
    const im=x.getImageData(0,0,size,size), d=im.data;
    for(let i=0;i<d.length;i+=4){ const n=(Math.random()-.5)*44;
      d[i]+=n; d[i+1]+=n*.95; d[i+2]+=n*.8; }
    x.putImageData(im,0,0);
    x.globalAlpha=.20; x.strokeStyle='#7a6038'; x.lineWidth=2.4;
    for(let y=0;y<size;y+=9){x.beginPath();x.moveTo(0,y);x.lineTo(size,y);x.stroke();}
    x.globalAlpha=.13; x.strokeStyle='#fff3dd';
    for(let y=4;y<size;y+=9){x.beginPath();x.moveTo(0,y);x.lineTo(size,y);x.stroke();}
    const t=new THREE.CanvasTexture(c);
    t.colorSpace=THREE.SRGBColorSpace; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8;
    return t;
  }
  function bumpTex(size=512){
    const c=document.createElement('canvas'); c.width=c.height=size;
    const x=c.getContext('2d'); x.fillStyle='#808080'; x.fillRect(0,0,size,size);
    for(let y=0;y<size;y+=18){
      x.fillStyle='#333'; x.fillRect(0,y,size,7);
      x.fillStyle='#d0d0d0'; x.fillRect(0,y+7,size,11);
    }
    const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; return t;
  }
  const carton = new THREE.MeshStandardMaterial({
    map:cardTex(), bumpMap:bumpTex(), bumpScale:.10, roughness:.95, metalness:0 });
  const madera = new THREE.MeshStandardMaterial({color:0xB79263, roughness:.88, metalness:0});
  const boyaM  = new THREE.MeshStandardMaterial({color:0xE8613C, roughness:.42, metalness:.06});
  const acero  = new THREE.MeshStandardMaterial({color:0xB9C9D4, roughness:.24, metalness:.92});

  // etiqueta impresa: se dibuja en canvas y se aplica a la cara frontal
  function labelTex(){
    const W=1024,H=640,c=document.createElement('canvas');
    c.width=W;c.height=H;const x=c.getContext('2d');
    x.fillStyle='#DCCBA9';x.fillRect(0,0,W,H);
    // grano del cartón
    const im=x.getImageData(0,0,W,H),d=im.data;
    for(let i=0;i<d.length;i+=4){const n=(Math.random()-.5)*40;d[i]+=n;d[i+1]+=n*.95;d[i+2]+=n*.8;}
    x.putImageData(im,0,0);
    x.globalAlpha=.16;x.strokeStyle='#6f5730';x.lineWidth=3;
    for(let y=0;y<H;y+=22){x.beginPath();x.moveTo(0,y);x.lineTo(W,y);x.stroke();}
    x.globalAlpha=1;
    // isotipo Bayline (etiqueta + hilo + aro de boya), en tinta
    x.save(); x.translate(90,150); x.scale(1.7,1.7);
    x.strokeStyle='#12405E'; x.lineWidth=5; x.lineJoin='round'; x.lineCap='round';
    x.setLineDash([13.5,11.3]);
    x.beginPath(); x.moveTo(36,34); x.lineTo(22,52); x.lineTo(30,72); x.stroke();
    x.setLineDash([]);
    x.fillStyle='#12405E';
    x.beginPath(); x.arc(22,52,4.5,0,7); x.fill();
    x.beginPath(); x.arc(30,72,4.5,0,7); x.fill();
    x.save(); x.translate(36,34); x.rotate(-14*Math.PI/180); x.translate(-36,-34);
    x.beginPath(); x.moveTo(38,16); x.lineTo(78,16); x.lineTo(78,52); x.lineTo(38,52);
    x.lineTo(20,34); x.closePath(); x.stroke();
    x.strokeStyle='#E8613C'; x.lineWidth=4.5;
    x.beginPath(); x.arc(36,34,6.5,0,7); x.stroke();
    x.restore(); x.restore();
    // wordmark
    x.fillStyle='#12405E'; x.font='700 92px "Author", system-ui, sans-serif';
    x.fillText('Bayline', 246, 214);
    // línea de anotación mono
    x.fillStyle='#5E6E79'; x.font='500 34px "Spline Sans Mono", monospace';
    x.fillText('SU COMERCIO, EN RUTA', 250, 268);
    // sello inferior
    x.strokeStyle='#8a6f45'; x.lineWidth=3; x.globalAlpha=.55;
    x.strokeRect(92,392,360,112); x.globalAlpha=1;
    x.fillStyle='#5E6E79'; x.font='500 30px "Spline Sans Mono", monospace';
    x.fillText('PEDIDO  ·  DESPACHADO', 118, 436);
    x.fillText('ECOMMERCE COMPLETO', 118, 478);
    const tex=new THREE.CanvasTexture(c);
    tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=8; return tex;
  }

  const root = new THREE.Group(); root.scale.setScalar(1.02); scene.add(root);
  const RB=(w,h,d,r,mat)=>{const m=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,3,r),mat);
    m.castShadow=true;m.receiveShadow=true;return m;};

  /* palet */
  const palet=new THREE.Group(); root.add(palet);
  for(let i=0;i<3;i++){const t=RB(3.5,.14,.46,.02,madera);t.position.set(0,-1.30,-1.06+i*1.06);palet.add(t);}
  for(let i=0;i<3;i++){const b=RB(.38,.24,2.75,.02,madera);b.position.set(-1.44+i*1.44,-1.49,0);palet.add(b);}

  /* caja: un solo volumen biselado + solapas */
  const caja=new THREE.Group(); root.add(caja);
  const cuerpo = RB(3.15,2.0,2.35,.045,carton); cuerpo.position.y=-.18; caja.add(cuerpo);
  /* cinta boya */
  const cinta = RB(3.17,.16,2.37,.02,boyaM); cinta.position.y=-.86; caja.add(cinta);
  const matLabel = new THREE.MeshStandardMaterial({map:labelTex(), roughness:.94, metalness:0});
  const front = new THREE.Mesh(new THREE.PlaneGeometry(2.98,1.86), matLabel);
  front.position.set(0,-.18,1.183); front.castShadow=false; caja.add(front);
  const side = new THREE.Mesh(new THREE.PlaneGeometry(2.2,1.86), matLabel);
  side.position.set(1.58,-.18,0); side.rotation.y=Math.PI/2; caja.add(side);
  /* solapas superiores entreabiertas (sin abrir del todo) */
  const flapGeo=(w,d)=>new RoundedBoxGeometry(w,.055,d,2,.02);
  const fA=new THREE.Mesh(flapGeo(3.13,1.14),carton); fA.castShadow=true;
  const pA=new THREE.Group(); pA.position.set(0,.82,-1.17); fA.position.z=.57; pA.add(fA); caja.add(pA);
  const fB=new THREE.Mesh(flapGeo(3.13,1.14),carton); fB.castShadow=true;
  const pB=new THREE.Group(); pB.position.set(0,.82,1.17); fB.position.z=-.57; pB.add(fB); caja.add(pB);
  pA.rotation.x=-.34; pB.rotation.x=.34;

  /* gancho y cables */
  const gan=new THREE.Group(); root.add(gan); scene.userData.gan=gan;
  const barra=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,1.8,16),acero);
  barra.position.y=2.85; barra.castShadow=true; gan.add(barra);
  const aro=new THREE.Mesh(new THREE.TorusGeometry(.22,.048,14,32),boyaM);
  aro.position.y=1.92; aro.rotation.x=Math.PI/2; aro.castShadow=true; gan.add(aro);
  const top=new THREE.Vector3(0,1.88,0);
  [[-1.5,-1.1],[1.5,-1.1],[-1.5,1.1],[1.5,1.1]].forEach(([x,z])=>{
    const b=new THREE.Vector3(x,.80,z);
    const len=top.distanceTo(b);
    const cb=new THREE.Mesh(new THREE.CylinderGeometry(.013,.013,len,8),acero);
    cb.position.copy(top.clone().add(b).multiplyScalar(.5));
    cb.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), b.clone().sub(top).normalize());
    cb.castShadow=true; gan.add(cb);
  });

  /* sombra de contacto */
  const piso=new THREE.Mesh(new THREE.PlaneGeometry(30,30), new THREE.ShadowMaterial({opacity:.16}));
  piso.rotation.x=-Math.PI/2; piso.position.y=-1.72; piso.receiveShadow=true; scene.add(piso);

  /* ── movimiento: solo gira y viaja ── */
  let tgt=0,cur=0,t0=0,tStart=0,intro=0;
  const maxS=()=>Math.max(1,document.body.scrollHeight-innerHeight);
  const onS=()=>{tgt=scrollY/maxS()}; addEventListener('scroll',onS,{passive:true}); onS();
  const sm=t=>t*t*(3-2*t);
  const trk=(p,K)=>{for(let i=0;i<K.length-1;i++){const[a,va]=K[i],[b,vb]=K[i+1];
    if(p<=b){const t=Math.min(1,Math.max(0,(p-a)/((b-a)||1)));return va+(vb-va)*sm(t);}}
    return K[K.length-1][1];};

  function size(){
    const w=host.clientWidth||innerWidth, h=host.clientHeight||innerHeight;
    cam.aspect=w/h; cam.updateProjectionMatrix(); R.setSize(w,h,false);
  }
  size(); addEventListener('resize',size,{passive:true});

  function loop(now){
    const dt=Math.min(.05,(now-t0)/1000||0); t0=now;
    cur+=(tgt-cur)*(1-Math.pow(.0016,dt));
    const p=cur;
    root.position.x = trk(p,[[0,0],[.14,0],[.26,2.2],[.42,2.2],[.52,-2.2],[.64,-2.2],[.74,2.2],[.86,2.2],[.94,0],[1,0]]);
    root.rotation.y = -.42 + p*2.35;
    if(!tStart) tStart=now;
    intro = Math.min(1,(now-tStart)/1400);
    const e = 1-Math.pow(1-intro,3);
    root.position.y = 2.1 - e*2.05 - p*3.4 + Math.sin(now/900)*.05*e;   // baja con el scroll
    root.rotation.z = Math.sin(p*Math.PI*2)*.02;
    gan.position.y = e*1.85 + p*3.4;   // el gancho queda arriba
    cam.position.set(0,.8+p*.7,10.8-p*.5);
    cam.lookAt(root.position.x*.4,-.05+p*.3,0);
    R.render(scene,cam);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
