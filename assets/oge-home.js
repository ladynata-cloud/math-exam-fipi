/* A small, isolated 3D exhibit. No trainer state, storage or network writes. */
(() => {
  'use strict';
  const host = document.querySelector('.model-exhibit');
  const canvas = document.getElementById('oge-model-canvas');
  const stage = document.getElementById('model-stage');
  if (!host || !canvas || !window.THREE) return;
  const T = window.THREE;
  // Software projection keeps the same real 3D geometry usable without WebGL.
  function softwareRenderer() {
    const ctx=canvas.getContext('2d');
    if(!ctx)return null;
    let width=1,height=1,ratio=1;
    const matrix=new T.Matrix4(), normalMatrix=new T.Matrix3();
    const light=new T.Vector3(-.4,.7,1).normalize();
    return {
      setPixelRatio(value){ratio=Math.min(value,1.25);},
      setSize(w,h){width=w;height=h;canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);},
      render(world,view){
        world.updateMatrixWorld(true);view.updateMatrixWorld(true);
        view.matrixWorldInverse.copy(view.matrixWorld).invert();
        const faces=[];
        world.traverse(object=>{
          if(!object.isMesh)return;
          for(let parent=object;parent;parent=parent.parent)if(!parent.visible)return;
          matrix.multiplyMatrices(view.matrixWorldInverse,object.matrixWorld);
          normalMatrix.getNormalMatrix(matrix);
          const positions=object.geometry.attributes.position, normals=object.geometry.attributes.normal;
          const indices=object.geometry.index, count=indices?indices.count:positions.count;
          const vertices=[];
          for(let i=0;i<positions.count;i++){
            const p=new T.Vector3().fromBufferAttribute(positions,i).applyMatrix4(matrix);
            const n=new T.Vector3().fromBufferAttribute(normals,i).applyMatrix3(normalMatrix).normalize();
            const z=p.z;p.applyMatrix4(view.projectionMatrix);
            vertices.push({x:(p.x+1)*width/2,y:(1-p.y)*height/2,z,n});
          }
          const color=object.material.color.clone().convertLinearToSRGB();
          for(let i=0;i<count;i+=3){
            const a=vertices[indices?indices.getX(i):i],b=vertices[indices?indices.getX(i+1):i+1],c=vertices[indices?indices.getX(i+2):i+2];
            if((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)>=0)continue;
            const normal=a.n.clone().add(b.n).add(c.n).normalize();
            const shade=.5+.5*Math.max(0,normal.dot(light));
            const rgb=[color.r,color.g,color.b].map(v=>Math.min(255,Math.round(v*255*shade+12)));
            faces.push({a,b,c,z:(a.z+b.z+c.z)/3,color:'rgb('+rgb.join(',')+')'});
          }
        });
        faces.sort((a,b)=>a.z-b.z);
        ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);
        ctx.lineWidth=.45;
        for(const f of faces){ctx.beginPath();ctx.moveTo(f.a.x,f.a.y);ctx.lineTo(f.b.x,f.b.y);ctx.lineTo(f.c.x,f.c.y);ctx.closePath();ctx.fillStyle=f.color;ctx.strokeStyle=f.color;ctx.fill();ctx.stroke();}
      }
    };
  }
  let renderer, software=false;
  try { renderer = new T.WebGLRenderer({canvas, alpha:true, antialias:true, powerPreference:'low-power'}); }
  catch (_) { renderer=softwareRenderer();software=true; }
  if(!renderer)return; // The inline SVG and real course links remain usable.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(35, 1, .1, 70);
  camera.position.set(0, 0, 11.8);
  camera.lookAt(0, 0, 0);
  scene.add(new T.HemisphereLight(0xfffef2, 0x859a79, .8));
  const key = new T.DirectionalLight(0xfff8e1, 1.3); key.position.set(-4, 6, 7); scene.add(key);
  const rim = new T.DirectionalLight(0xd2eee1, .5); rim.position.set(5, 1, -3); scene.add(rim);
  const material = (color, options={}) => {
    const mat=new T.MeshStandardMaterial({color, roughness:.65, metalness:.05, ...options});
    mat.color.convertSRGBToLinear();
    return mat;
  };
  const rubber=material(0x243d34), tread=material(0x334e41), silver=material(0xc3cdbd,{metalness:.55,roughness:.27});
  const cream=material(0xf5e5c9), green=material(0x82a777), terra=material(0xc78657), ink=material(0x294a3a);
  const v = (x,y,z=0) => new T.Vector3(x,y,z);
  function mesh(group, geometry, mat, x=0,y=0,z=0) { const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);group.add(m);return m; }
  function box(g,w,h,d,mat,x=0,y=0,z=0){return mesh(g,new T.BoxGeometry(w,h,d),mat,x,y,z);}
  function rod(g,a,b,r,mat) {const d=b.clone().sub(a);const m=mesh(g,new T.CylinderGeometry(r,r,d.length(),10),mat);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(v(0,1,0),d.normalize());return m;}
  function tube(g,points,r,mat,closed=false) { return mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(points,closed),Math.max(32,points.length*2),r,8,closed),mat); }
  const models = {};
  // A true toroidal tire, rim, spokes, sidewall rings and tread blocks.
  const tire=models.tires=new T.Group();
  mesh(tire,new T.TorusGeometry(.94,.32,22,64),rubber);
  for(const z of [-.21,.21]) {
    mesh(tire,new T.TorusGeometry(.94,.065,10,64),tread,0,0,z);
    mesh(tire,new T.TorusGeometry(.64,.055,10,48),silver,0,0,z);
    for(let i=0;i<6;i++){const a=i*Math.PI/3;rod(tire,v(.12*Math.cos(a),.12*Math.sin(a),z),v(.61*Math.cos(a+.15),.61*Math.sin(a+.15),z),.055,silver);}
  }
  const hub=mesh(tire,new T.CylinderGeometry(.19,.19,.5,24),silver);hub.rotation.x=Math.PI/2;
  for(let i=0;i<44;i++) {const a=i*Math.PI*2/44;for(const z of [-.14,.14]) {const m=box(tire,.15,.07,.17,tread,1.245*Math.cos(a),1.245*Math.sin(a),z);m.rotation.z=a-Math.PI/2;m.rotation.y=z>0?.3:-.3;}}
  // Cutaway apartment on a rectangular plan: walls, openings and furniture.
  const apartment=models.apartment=new T.Group();
  box(apartment,2.8,.13,2.25,cream,0,-.37,0);
  box(apartment,1.3,.025,1.05,material(0xd2dfba),-.7,-.29,-.54);
  box(apartment,1.3,.025,1.05,material(0xe3d7b4),.7,-.29,-.54);
  box(apartment,1.3,.025,1.03,material(0xc7dbd0),-.7,-.29,.55);
  box(apartment,1.3,.025,1.03,material(0xece0ca),.7,-.29,.55);
  box(apartment,2.85,.75,.09,cream,0,.04,-1.12);
  box(apartment,.09,.75,2.25,cream,-1.4,.04,0);
  box(apartment,.09,.75,2.25,cream,1.4,.04,0);
  // Lower front edge keeps the floor plan legible as the model turns.
  box(apartment,2.8,.15,.09,cream,0,-.22,1.12);
  box(apartment,.08,.62,.8,cream,0,0,-.72);box(apartment,.08,.62,.8,cream,0,0,.72);
  box(apartment,.9,.62,.08,cream,-.93,0,0);box(apartment,.9,.62,.08,cream,.93,0,0);
  box(apartment,.64,.22,.95,material(0x91b4a0),-.83,-.14,-.55);
  box(apartment,.55,.09,.25,cream,-.83,.015,-.86);
  box(apartment,.67,.22,.36,green,.77,-.15,.65);box(apartment,.67,.22,.11,green,.77,.02,.79);
  box(apartment,.65,.18,.24,silver,.86,-.16,-.89);
  mesh(apartment,new T.CylinderGeometry(.26,.26,.07,24),cream,.7,-.05,-.35);
  rod(apartment,v(.7,-.26,-.35),v(.7,-.05,-.35),.045,silver);
  // Two exact quadratic curves, with the coefficient sign visible in the caption.
  const graphs=models.graphs=new T.Group();
  for(const [offset,sign,mat] of [[-.85,1,green],[.85,-1,terra]]) {
    const g=new T.Group();g.position.x=offset;graphs.add(g);
    const axisMat=material(0xb6c6a8);
    rod(g,v(-.72,0,-.07),v(.72,0,-.07),.014,axisMat);
    rod(g,v(0,-.7,-.07),v(0,.8,-.07),.014,axisMat);
    const points=[];for(let i=0;i<=48;i++){const x=-.62+i*1.24/48;points.push(v(x,sign*(2.8*x*x-.48),0));}
    tube(g,points,.046,mat);
    for(const x of [-.19,.19]) mesh(g,new T.SphereGeometry(.045,12,8),ink,x,sign===1?.22:.18,.025);
  }
  // An equilateral triangle inscribed in a circle: exact circumradius 1.
  const geometry=models.geometry=new T.Group();
  mesh(geometry,new T.TorusGeometry(1,.035,10,72),green);
  const points=[v(0,1),v(-Math.sqrt(3)/2,-.5),v(Math.sqrt(3)/2,-.5)];
  points.forEach((p,i)=>{rod(geometry,p,points[(i+1)%3],.045,cream);mesh(geometry,new T.SphereGeometry(.08,16,10),terra,p.x,p.y,0);});
  rod(geometry,v(0,1),v(0,-.5),.015,green);
  rod(geometry,v(0,-.36),v(.14,-.36),.012,green);rod(geometry,v(.14,-.36),v(.14,-.5),.012,green);
  // A stove from practical tasks: firebox, stone basket and chimney.
  const stove=models.stove=new T.Group();
  box(stove,1.1,1.35,.85,ink,0,-.2,0);
  box(stove,.74,.72,.04,terra,0,-.23,.445);
  box(stove,.56,.53,.05,rubber,0,-.23,.48);
  rod(stove,v(.22,-.28,.53),v(.22,-.03,.53),.035,silver);
  box(stove,1.22,.16,.96,silver,0,.51,0);
  for(let i=0;i<7;i++)mesh(stove,new T.IcosahedronGeometry(.18,0),i%2?silver:tread,(i%3-1)*.32,.68,Math.floor(i/3)*.25-.25);
  mesh(stove,new T.CylinderGeometry(.15,.15,.9,16),silver,0,1.06,-.25);
  for(const x of [-.39,.39])for(const z of [-.28,.28])box(stove,.12,.25,.12,tread,x,-.96,z);
  // A fenced rectangular plot, gabled house, path and tree.
  const plot=models.plot=new T.Group();
  mesh(plot,new T.BoxGeometry(2.4,.12,1.9,8,1,8),green,0,-.5,0);
  mesh(plot,new T.BoxGeometry(.95,.85,.8,8,8,8),cream,-.35,-.03,-.25);
  const roofShape=new T.Shape();roofShape.moveTo(-.6,0);roofShape.lineTo(0,.45);roofShape.lineTo(.6,0);roofShape.closePath();
  mesh(plot,new T.ExtrudeGeometry(roofShape,{depth:1,steps:8,bevelEnabled:false}),terra,-.35,.395,-.75);
  box(plot,.21,.44,.03,ink,-.35,-.2,.165);
  box(plot,.21,.22,.04,silver,-.65,.04,.17);
  box(plot,.3,.02,.65,cream,-.35,-.425,.58);
  for(const x of [-1.13,1.13])rod(plot,v(x,-.25,-.88),v(x,-.25,.88),.028,cream);
  for(const z of [-.88,.88])rod(plot,v(-1.13,-.25,z),v(1.13,-.25,z),.028,cream);
  for(const x of [-1.13,0,1.13])for(const z of [-.88,.88])rod(plot,v(x,-.44,z),v(x,-.12,z),.03,cream);
  rod(plot,v(.73,-.44,-.48),v(.73,.4,-.48),.055,terra);
  mesh(plot,new T.IcosahedronGeometry(.43,1),tread,.73,.48,-.48);
  // Successive A-series sheets: every smaller sheet has half the area.
  const paper=models.paper=new T.Group();
  const sheetMats=[cream,green,material(0xe8ba80)];
  for(let i=0;i<3;i++){
    const scale=Math.pow(Math.SQRT1_2,i),sheet=new T.Group();
    // Separate parallel sheets stay legible in both GPU and painter rendering.
    sheet.position.set([-1.15,.12,1.05][i],0,0);paper.add(sheet);
    box(sheet,1.2*scale,.055,1.2*Math.SQRT2*scale,sheetMats[i]);
  }
  // A conventional die: opposing face counts sum to seven.
  const dice=models.dice=new T.Group();box(dice,1.35,1.35,1.35,cream);
  const pipGeometry=new T.SphereGeometry(.095,10,8);
  const patterns={1:[[0,0]],2:[[-1,1],[1,-1]],3:[[-1,1],[0,0],[1,-1]],4:[[-1,1],[1,1],[-1,-1],[1,-1]],5:[[-1,1],[1,1],[0,0],[-1,-1],[1,-1]],6:[[-1,1],[1,1],[-1,0],[1,0],[-1,-1],[1,-1]]};
  for(const [count,axis,sign] of [[1,'z',1],[6,'z',-1],[2,'y',1],[5,'y',-1],[3,'x',1],[4,'x',-1]]){
    for(const [a,b] of patterns[count]){
      const pos=axis==='z'?[a*.32,b*.32,sign*.66]:axis==='y'?[a*.32,sign*.66,b*.32]:[sign*.66,a*.32,b*.32];
      mesh(dice,pipGeometry,ink,...pos);
    }
  }
  // The same orbital coordinates drive both the visible paths and each planet.
  // All orbit planes share one origin; motion is separate from the models' spin.
  const orbitRadii=[1.25,2.7,4.25], orbitSpeeds=[.17,.12,.085];
  const system=new T.Group(), paths=new T.Group(), sun=new T.Group();scene.add(system);system.add(paths,sun);
  const orbitMat=material(0xc1cfb1), gold=material(0xc5a168,{roughness:.5});
  mesh(sun,new T.SphereGeometry(.48,24,16),gold);
  const halo=mesh(sun,new T.TorusGeometry(.61,.014,6,48),cream);halo.rotation.x=.65;
  orbitRadii.forEach(radius=>{
    const pts=[];for(let i=0;i<96;i++){const a=i*Math.PI*2/96;pts.push(v(radius*Math.cos(a),radius*Math.sin(a),radius*Math.sin(a)*.36));}
    tube(paths,pts,.009,orbitMat,true);
  });
  const layout={
    geometry:{orbit:0,phase:.55,s:.37,solo:1.58,r:[.05,.18,-.14]},
    dice:{orbit:0,phase:Math.PI+.55,s:.48,solo:1.7,r:[.35,-.5,.12]},
    tires:{orbit:1,phase:3.25,s:.55,solo:1.58,r:[.13,-.4,-.23]},
    graphs:{orbit:1,phase:3.25+Math.PI*2/3,s:.47,solo:1.58,r:[-.08,-.1,-.05]},
    paper:{orbit:1,phase:3.25+Math.PI*4/3,s:.51,solo:1.5,r:[.65,-.3,-.1]},
    apartment:{orbit:2,phase:5.9,s:.46,solo:1.28,r:[.6,-.6,.08]},
    stove:{orbit:2,phase:5.9+Math.PI*2/3,s:.53,solo:1.32,r:[.1,-.35,-.08]},
    plot:{orbit:2,phase:5.9+Math.PI*4/3,s:.5,solo:1.3,r:[.55,-.4,.05]}
  };
  const modelRadii={};
  for(const [id,g] of Object.entries(models)){
    // A rotation-invariant bound keeps every individual view inside narrow screens.
    g.updateMatrixWorld(true);let radius=0;
    g.traverse(m=>{if(!m.isMesh)return;const positions=m.geometry.attributes.position;for(let i=0;i<positions.count;i++)radius=Math.max(radius,new T.Vector3().fromBufferAttribute(positions,i).applyMatrix4(m.matrixWorld).length());});
    modelRadii[id]=radius;system.add(g);
  }
  const info={
    all:['Математическая Солнечная система','8 моделей на трёх орбитах. Выберите любую — рассмотрим ближе.','/trainers/oge-course/'],
    tires:['№ 1–5 · Шины','Ширина, профиль и диаметр. Разбираем маркировку колеса.','/trainers/oge-1-5-trainers/practice-1-5-tires.html'],
    apartment:['№ 1–5 · Квартиры','План, масштаб и площадь комнат. Учимся читать чертёж.','/trainers/oge-1-5-trainers/practice-1-5-apartments.html'],
    graphs:['№ 11 · Параболы','a > 0 — ветви вверх. a < 0 — ветви вниз.','/trainers/oge-task11-graphs-trainer.html'],
    geometry:['№ 15–19 · Геометрия','Треугольники, окружности, углы и площади — наглядно.','/trainers/oge-course/#geometry'],
    stove:['№ 1–5 · Печи','Размеры парной, объём и выбор подходящей печи.','/trainers/oge-1-5-trainers/practice-1-5-stoves.html'],
    plot:['№ 1–5 · Участки','Дом, дорожки и ограда. Считаем длины и площади по плану.','/trainers/oge-1-5-trainers/practice-1-5-land-plots.html'],
    paper:['№ 1–5 · Бумага','Форматы серии A: каждый следующий лист вдвое меньше по площади.','/trainers/oge-1-5-trainers/practice-1-5-paper-sheets.html'],
    dice:['№ 10 · Вероятность','Шесть граней кубика — шесть возможных исходов броска.','/trainers/oge-task10-probability.html']
  };
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused=reduced.matches, visible=true, lost=false, frame=0, last=0, painted=0, time=0, selection='all', drag=null, dragAngle=0;
  const pause=document.getElementById('model-pause');
  let orbitX=1,orbitY=.58;
  function pose() {
    const all=selection==='all';paths.visible=sun.visible=all;
    paths.scale.set(orbitX,orbitY,1);
    Object.entries(models).forEach(([id,g],i)=>{
      const l=layout[id];g.visible=all||id===selection;
      if(!g.visible)return;
      if(all){
        const angle=l.phase+time*orbitSpeeds[l.orbit]+dragAngle, radius=orbitRadii[l.orbit];
        g.position.set(radius*Math.cos(angle)*orbitX,radius*Math.sin(angle)*orbitY,radius*Math.sin(angle)*.36);
      }else g.position.set(0,id==='apartment'?-.1:0,0);
      g.scale.setScalar(all?l.s:l.solo);
      g.rotation.set(...l.r);
      g.rotation.y+=(id==='tires'?time*.32:time*.18)+(all?0:dragAngle);
      g.rotation.z+=Math.sin(time*.32+i)*.035;
    });
  }
  function render(){if(lost)return;pose();renderer.render(scene,camera);}
  function animate(now){frame=0;if(paused||!visible||document.hidden||lost)return;time+=last?Math.min((now-last)/1000,.05):0;last=now;if(!software||now-painted>65){render();painted=now;}frame=requestAnimationFrame(animate);}
  function schedule(){cancelAnimationFrame(frame);frame=0;last=0;if(!paused&&visible&&!document.hidden&&!lost)frame=requestAnimationFrame(animate);}
  function pauseLabel(){pause.textContent=paused?'Вращать':'Пауза';pause.setAttribute('aria-pressed',String(paused));host.dataset.motion=paused?'paused':'running';}
  function resize(){
    const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;
    renderer.setSize(w,h,false);camera.aspect=w/h;
    orbitX=Math.min(1,Math.max(.6,camera.aspect/1.5));orbitY=camera.aspect<1.2?.8:.58;
    // Frame the outer orbit and the full model extents, including near-side depth.
    const halfWidth=4.25*orbitX+.95, halfHeight=4.25*orbitY+.95;
    const vertical=Math.PI*35/360, narrow=Math.min(vertical,Math.atan(Math.tan(vertical)*camera.aspect));
    camera.position.z=selection==='all'?Math.max(halfHeight,halfWidth/camera.aspect)/Math.tan(vertical)+1.7:(modelRadii[selection]*layout[selection].solo+.12)/Math.sin(narrow)*1.06;
    camera.updateProjectionMatrix();render();
  }
  function choose(id){selection=id;dragAngle=0;host.dataset.selection=id;document.querySelectorAll('[data-model]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.model===id)));const data=info[id];document.getElementById('model-number').textContent=data[0];document.getElementById('model-description').textContent=data[1];document.getElementById('model-link').href=data[2];canvas.setAttribute('aria-label','Объёмная модель: '+data[0]+'. '+data[1]);resize();}
  document.querySelectorAll('[data-model]').forEach(b=>b.addEventListener('click',()=>choose(b.dataset.model)));
  pause.addEventListener('click',()=>{paused=!paused;pauseLabel();schedule();});
  const motionChange=()=>{paused=reduced.matches;pauseLabel();schedule();};
  if(reduced.addEventListener)reduced.addEventListener('change',motionChange);
  document.addEventListener('visibilitychange',schedule);
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:0}).observe(stage);
  if('ResizeObserver' in window)new ResizeObserver(resize).observe(stage);else window.addEventListener('resize',resize);
  stage.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,angle:dragAngle};stage.setPointerCapture(e.pointerId);});
  stage.addEventListener('pointermove',e=>{if(!drag)return;dragAngle=drag.angle+(e.clientX-drag.x)*.009;render();});
  ['pointerup','pointercancel','lostpointercapture'].forEach(event=>stage.addEventListener(event,()=>{drag=null;}));
  const fallback=document.querySelector('.model-fallback');
  function availability(ready){canvas.hidden=!ready;fallback.toggleAttribute('hidden',ready);pause.hidden=!ready;document.querySelector('.model-tabs').hidden=!ready;document.getElementById('model-hint').hidden=!ready;host.dataset.renderer=ready?(software?'canvas':'webgl'):'fallback';}
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(frame);availability(false);});
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;availability(true);resize();schedule();});
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;});
  window.addEventListener('pageshow',()=>{resize();schedule();});
  availability(true);choose('all');pauseLabel();resize();schedule();
})();
