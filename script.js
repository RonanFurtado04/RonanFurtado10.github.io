(() => {
  const $ = s => document.querySelector(s);
  $('#year').textContent = new Date().getFullYear();
  $('#menuToggle').addEventListener('click', () => $('#nav').classList.toggle('open'));
  document.querySelectorAll('#nav a').forEach(a => a.addEventListener('click', () => $('#nav').classList.remove('open')));

  // Abstract 3D sculpture: a cloud of luminous points, connected strands, and floating orbs.
  // There is deliberately no avatar or human model.
  const canvas = $('#scene');
  if (!window.THREE || !canvas) return;
  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, .1, 100);
  camera.position.set(0, 0, 11);
  const root = new THREE.Group();
  scene.add(root);

  const particleCount = 1050;
  const positions = new Float32Array(particleCount * 3);
  const original = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const colorA = new THREE.Color('#47e3c4');
  const colorB = new THREE.Color('#a777ff');
  for (let i=0;i<particleCount;i++) {
    // A twisted, slightly irregular torus-like cloud.
    const t = Math.random()*Math.PI*2;
    const u = Math.random()*Math.PI*2;
    const major = 2.15 + .3*Math.sin(3*t);
    const minor = .72 + Math.random()*.24;
    const x = (major + minor*Math.cos(u))*Math.cos(t);
    const y = (major + minor*Math.cos(u))*Math.sin(t)*.88;
    const z = minor*Math.sin(u) + .36*Math.sin(2*t);
    const idx=i*3;
    positions[idx]=x;positions[idx+1]=y;positions[idx+2]=z;
    original[idx]=x;original[idx+1]=y;original[idx+2]=z;
    const c=colorA.clone().lerp(colorB, Math.max(0,Math.min(1,(x+3.2)/6.4)));
    colors[idx]=c.r;colors[idx+1]=c.g;colors[idx+2]=c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const pointMat = new THREE.PointsMaterial({size:.027,vertexColors:true,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false});
  const points = new THREE.Points(geo,pointMat);
  root.add(points);

  // Fine connections between selected neighboring points create a technical network effect.
  const linePositions=[];
  for(let i=0;i<particleCount;i+=3){
    const a=i*3;
    let nearest=-1, best=.24;
    for(let j=i+1;j<Math.min(i+35,particleCount);j++){
      const b=j*3, dx=original[a]-original[b],dy=original[a+1]-original[b+1],dz=original[a+2]-original[b+2];
      const d=dx*dx+dy*dy+dz*dz;
      if(d<best){best=d;nearest=j;}
    }
    if(nearest>=0){
      const b=nearest*3;
      linePositions.push(original[a],original[a+1],original[a+2],original[b],original[b+1],original[b+2]);
    }
  }
  const lineGeo=new THREE.BufferGeometry();
  lineGeo.setAttribute('position',new THREE.Float32BufferAttribute(linePositions,3));
  const lines=new THREE.LineSegments(lineGeo,new THREE.LineBasicMaterial({color:0x5adfc9,transparent:true,opacity:.17,blending:THREE.AdditiveBlending,depthWrite:false}));
  root.add(lines);

  // A few larger glassy spheres orbit the central structure.
  const orbs=[];
  const orbMat1=new THREE.MeshBasicMaterial({color:0x6ce9d0,transparent:true,opacity:.85});
  const orbMat2=new THREE.MeshBasicMaterial({color:0xc78dff,transparent:true,opacity:.9});
  for(let i=0;i<7;i++){
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(i%3===0?.055:.025,16,12),i%2?orbMat1:orbMat2);
    mesh.userData={phase:Math.random()*Math.PI*2,radius:2.8+Math.random()*.5,speed:.16+Math.random()*.25};
    root.add(mesh);orbs.push(mesh);
  }
  const ambient=new THREE.PointLight(0x3ee5cb,2.5,20);ambient.position.set(0,2,3);scene.add(ambient);
  const purpleLight=new THREE.PointLight(0xa45cff,2,18);purpleLight.position.set(3,-2,-2);scene.add(purpleLight);

  let pointerX=0,pointerY=0,targetX=0,targetY=0;
  window.addEventListener('pointermove',e=>{targetX=(e.clientX/window.innerWidth-.5)*.45;targetY=(e.clientY/window.innerHeight-.5)*.24;},{passive:true});
  canvas.addEventListener('pointerdown',()=>{root.userData.boost=1.8;});
  window.addEventListener('resize',resize);
  function resize(){
    const w=canvas.clientWidth||window.innerWidth,h=canvas.clientHeight||window.innerHeight;
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  resize();
  const clock=new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    const t=clock.getElapsedTime();
    pointerX+=(targetX-pointerX)*.025;pointerY+=(targetY-pointerY)*.025;
    root.rotation.y=t*.075+pointerX;
    root.rotation.x=Math.sin(t*.22)*.08+pointerY;
    const boost=root.userData.boost||1;
    root.scale.setScalar(1+Math.sin(t*.7)*.018);
    root.rotation.z=Math.sin(t*.13)*.06;
    const p=geo.attributes.position.array;
    for(let i=0;i<particleCount;i++){
      const k=i*3;
      const wave=Math.sin(t*.8+i*.035)*.025;
      p[k]=original[k]*(1+wave*.35);
      p[k+1]=original[k+1]+Math.sin(t*.55+i*.017)*.025;
      p[k+2]=original[k+2]+Math.cos(t*.65+i*.022)*.035;
    }
    geo.attributes.position.needsUpdate=true;
    orbs.forEach(o=>{const d=o.userData,a=t*d.speed+d.phase;o.position.set(Math.cos(a)*d.radius,Math.sin(a*1.25)*1.45,Math.sin(a)*1.25);});
    if(root.userData.boost){root.userData.boost+=(1-root.userData.boost)*.035;if(Math.abs(root.userData.boost-1)<.02)root.userData.boost=0;}
    renderer.render(scene,camera);
  }
  animate();
})();