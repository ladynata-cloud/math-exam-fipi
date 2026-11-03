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
        const faces=[],lines=[];
        world.traverse(object=>{
          for(let parent=object;parent;parent=parent.parent)if(!parent.visible)return;
          if(object.isLine){
            const points=[],positions=object.geometry.attributes.position;
            for(let i=0;i<positions.count;i++){const p=new T.Vector3().fromBufferAttribute(positions,i).applyMatrix4(object.matrixWorld).project(view);points.push({x:(p.x+1)*width/2,y:(1-p.y)*height/2});}
            lines.push({points,color:object.material.color.clone().convertLinearToSRGB().getStyle(),opacity:object.material.opacity,closed:object.isLineLoop});return;
          }
          if(!object.isMesh)return;
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
        ctx.lineWidth=.8;
        for(const line of lines){ctx.beginPath();line.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));if(line.closed)ctx.closePath();ctx.strokeStyle=line.color;ctx.globalAlpha=line.opacity;ctx.stroke();}ctx.globalAlpha=1;
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
  // Small, reusable course models. These are illustrations, not problem conditions.
  const blue=material(0x729da3), pale=material(0xd6e2c3);
  const dot=(g,x,y,z=0,mat=terra,r=.075)=>mesh(g,new T.SphereGeometry(r,10,6),mat,x,y,z);
  const group=id=>(models[id]=new T.Group());
  function polygon(g,points,mat=green){points.forEach((p,i)=>rod(g,p,points[(i+1)%points.length],.045,mat));}
  function axes(g){rod(g,v(-1.2,0,-.06),v(1.2,0,-.06),.018,silver);rod(g,v(0,-1.1,-.06),v(0,1.1,-.06),.018,silver);}
  function curve(g,f,min=-1,max=1,mat=green){const pts=[];for(let i=0;i<=32;i++){const x=min+(max-min)*i/32;pts.push(v(x,f(x),.02));}tube(g,pts,.04,mat);}
  function lattice(g){for(let i=-2;i<=2;i++){rod(g,v(i*.5,-1,-.08),v(i*.5,1,-.08),.012,silver);rod(g,v(-1,i*.5,-.08),v(1,i*.5,-.08),.012,silver);}}
  const fraction=group('fraction');
  for(let i=0;i<6;i++){const a=i*Math.PI/3;mesh(fraction,new T.CylinderGeometry(1,1,.16,8,1,false,a+.035,Math.PI/3-.07),i<4?green:cream).rotation.x=Math.PI/2;}
  const decimal=group('decimal');for(let x=0;x<5;x++)for(let y=0;y<2;y++)box(decimal,.35,.35,.12,x+y*5<7?green:cream,(x-2)*.4,(y-.5)*.4);
  for(const id of ['numberline','comparison','interval']){
    const g=group(id);rod(g,v(-1.25,0),v(1.25,0),.025,ink);
    for(let i=-3;i<=3;i++)rod(g,v(i*.36,-.09),v(i*.36,.09),.016,silver);
    if(id==='interval'){rod(g,v(-.7,.18),v(.85,.18),.06,green);dot(g,-.7,.18);mesh(g,new T.TorusGeometry(.075,.022,6,16),terra,.85,.18,0);}
    else{dot(g,-.7,0);dot(g,.72,0,0,green);if(id==='comparison'){rod(g,v(-.15,.35),v(.2,.55),.035,terra);rod(g,v(.2,.55),v(-.15,.75),.035,terra);}}
  }
  const powers=group('powers');for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++)box(powers,.49,.49,.49,(x+y+z)%2?cream:green,(x-.5)*.56,(y-.5)*.56,(z-.5)*.56);
  const root=group('root');[v(-1,-.1),v(-.7,-.45),v(-.35,.65),v(1,.65)].forEach((p,i,a)=>{if(i<a.length-1)rod(root,p,a[i+1],.065,green);});box(root,.53,.53,.14,cream,.35,.05,0);
  const balance=group('balance');box(balance,1.1,.15,.5,cream,0,-.8);rod(balance,v(0,-.73),v(0,.6),.055,ink);rod(balance,v(-1,.5),v(1,.5),.045,ink);
  for(const x of [-.8,.8]){rod(balance,v(x,.5),v(x,-.2),.02,silver);box(balance,.6,.07,.5,green,x,-.25);}
  box(balance,.28,.28,.28,terra,-.8,-.07);dot(balance,.8,-.05,0,blue,.16);
  const roots=group('roots');axes(roots);curve(roots,x=>x*x-.5);dot(roots,-Math.SQRT1_2,0);dot(roots,Math.SQRT1_2,0);
  const balls=group('balls');box(balls,1.8,.12,1.1,cream,0,-.55);for(let i=0;i<6;i++)dot(balls,(i%3-1)*.52,-.25,Math.floor(i/3)*.5-.25,i<2?terra:green,.23);
  const linegraph=group('linegraph');axes(linegraph);rod(linegraph,v(-.9,-.8),v(.9,1),.05,green);
  const hyperbola=group('hyperbola');axes(hyperbola);curve(hyperbola,x=>.35/x,.32,1.1,terra);curve(hyperbola,x=>.35/x,-1.1,-.32,terra);
  const absolute=group('absolute');axes(absolute);rod(absolute,v(-1,.8),v(0,-.6),.05,green);rod(absolute,v(0,-.6),v(1,.8),.05,green);
  const area=group('area');polygon(area,[v(-1,-.65),v(1,-.65),v(1,.65),v(-1,.65)]);rod(area,v(-1,-.85),v(1,-.85),.025,terra);rod(area,v(1.2,-.65),v(1.2,.65),.025,blue);
  const car=group('car');box(car,1.8,.42,.7,green,0,-.1);box(car,.9,.4,.66,cream,-.12,.28);for(const x of [-.6,.6])for(const z of [-.38,.38]){const w=mesh(car,new T.CylinderGeometry(.23,.23,.12,14),rubber,x,-.32,z);w.rotation.x=Math.PI/2;}
  for(const [id,heights] of [['arithmetic',[.35,.6,.85,1.1]],['geometric',[.16,.32,.64,1.28]]]){const g=group(id);heights.forEach((h,i)=>box(g,.35,h,.45,i%2?terra:green,(i-1.5)*.47,h/2-.65));}
  const righttriangle=group('righttriangle');polygon(righttriangle,[v(-.8,-.65),v(.8,-.65),v(-.8,.95)]);rod(righttriangle,v(-.8,-.42),v(-.57,-.42),.02,terra);rod(righttriangle,v(-.57,-.42),v(-.57,-.65),.02,terra);
  const isosceles=group('isosceles');polygon(isosceles,[v(-.9,-.6),v(.9,-.6),v(0,.95)]);rod(isosceles,v(0,.95),v(0,-.6),.02,terra);
  for(const id of ['chord','tangent','cyclic','construction']){
    const g=group(id);mesh(g,new T.TorusGeometry(1,.035,6,40),green);
    if(id==='tangent'){rod(g,v(1,-1.25),v(1,1.25),.035,terra);rod(g,v(0,0),v(1,0),.025,blue);dot(g,1,0);}
    else if(id==='chord'){const a=v(-.8,-.6),b=v(.8,-.6),c=v(0,1);polygon(g,[a,b,c],cream);rod(g,a,b,.045,terra);}
    else if(id==='cyclic')polygon(g,[v(-.8,.6),v(.6,.8),v(.8,-.6),v(-.6,-.8)],terra);
    else{polygon(g,[v(0,1),v(-.8,-.6),v(.8,-.6)],cream);rod(g,v(0,1),v(0,-.6),.025,terra);rod(g,v(-1,0),v(1,0),.02,blue);}
  }
  for(const [id,pts] of [['trapezoid',[v(-1,-.6),v(1,-.6),v(.55,.6),v(-.55,.6)]],['parallelogram',[v(-1,-.6),v(.55,-.6),v(1,.6),v(-.55,.6)]],['square',[v(-.75,-.75),v(.75,-.75),v(.75,.75),v(-.75,.75)]]])polygon(group(id),pts,terra);
  const gridtriangle=group('gridtriangle');lattice(gridtriangle);polygon(gridtriangle,[v(-1,-1),v(1,-1),v(.5,1)],terra);
  const gridlength=group('gridlength');lattice(gridlength);rod(gridlength,v(-1,-.5),v(1,1),.05,green);dot(gridlength,-1,-.5);dot(gridlength,1,1);
  const parallel=group('parallel');for(const y of [-.45,.45])rod(parallel,v(-1.1,y),v(1.1,y),.04,green);rod(parallel,v(-.65,-1),v(.65,1),.04,terra);
  const congruence=group('congruence');for(const x of [-.65,.65]){polygon(congruence,[v(x-.4,-.6),v(x+.4,-.6),v(x,.7)],x<0?green:terra);rod(congruence,v(x-.12,-.52),v(x+.12,-.68),.02,ink);}
  const work=group('work');mesh(work,new T.CylinderGeometry(.75,.75,.8,20,1,true),cream,0,-.2);mesh(work,new T.CylinderGeometry(.7,.7,.35,20),blue,0,-.35);rod(work,v(.55,.2),v(.55,1),.07,silver);rod(work,v(.55,1),v(0,1),.07,silver);dot(work,0,.65,0,blue,.08);
  const mixture=group('mixture');for(const [x,h,mat] of [[-.55,.4,green],[.55,.7,terra]]){mesh(mixture,new T.CylinderGeometry(.35,.35,.9,16,1,true),cream,x,0);mesh(mixture,new T.CylinderGeometry(.31,.31,h,16),mat,x,h/2-.45);}
  const tariff=group('tariff');box(tariff,.85,1.5,.17,ink);box(tariff,.7,1.12,.03,pale,0,.08,.1);for(let i=0;i<3;i++)box(tariff,.12,.2+i*.2,.04,green,(i-1)*.2,-.3+i*.1,.13);
  const roads=group('roads');box(roads,2,.1,1.6,pale,0,-.1);for(const [a,b] of [[v(-.8,0,-.5),v(.8,0,.55)],[v(-.8,0,.5),v(.8,0,.55)],[v(-.8,0,-.5),v(-.8,0,.5)]])rod(roads,a,b,.035,ink);for(const [x,z] of [[-.8,-.5],[-.8,.5],[.8,.55]])box(roads,.2,.3,.2,terra,x,.15,z);
  // The overview uses a lighter wheel; detailed inspection keeps the full tire.
  const lightTire=new T.Group();mesh(lightTire,new T.TorusGeometry(.94,.32,8,24),rubber);mesh(lightTire,new T.TorusGeometry(.62,.055,6,20),silver);for(let i=0;i<6;i++){const a=i*Math.PI/3;rod(lightTire,v(0,0),v(.6*Math.cos(a),.6*Math.sin(a)),.045,silver);}
  const topics=window.OGE_HOME_TOPICS;
  if(!Array.isArray(topics)||topics.length!==25)return;
  const radii={};
  for(const [id,g] of Object.entries(models)){
    g.updateMatrixWorld(true);let radius=0;
    g.traverse(m=>{if(!m.isMesh)return;const p=m.geometry.attributes.position;for(let i=0;i<p.count;i++)radius=Math.max(radius,new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld).length());});
    radii[id]=radius;
  }
  const system=new T.Group(),sun=new T.Group();scene.add(system);system.add(sun);sun.name='oge-center';
  mesh(sun,new T.SphereGeometry(.55,20,12),material(0xc5a168,{roughness:.5}));
  const halo=mesh(sun,new T.TorusGeometry(.7,.014,6,36),cream);halo.rotation.x=.65;
  const orbitColors=[0x638c70,0xa88961,0x5f8f99,0x879d58,0xb28170];
  const orbits=topics.map((topic,index)=>{
    const g=new T.Group();g.name='orbit-'+topic.number;system.add(g);
    const tilt=new T.Euler(.35+(index*7%17)/17*.95,Math.sin(index*1.7)*.6,index*.68);
    const pts=[];for(let i=0;i<96;i++){const a=i*Math.PI*2/96;pts.push(v(Math.cos(a),Math.sin(a)));}
    const pathMat=new T.LineBasicMaterial({color:orbitColors[Math.floor(index/5)],transparent:true,opacity:.28});pathMat.color.convertSRGBToLinear();
    const path=new T.LineLoop(new T.BufferGeometry().setFromPoints(pts),pathMat);path.name='orbit-path';g.add(path);
    const satellites=topic.types.map((type,j)=>{
      const node=new T.Group();node.name='satellite-'+topic.number+'-'+j;node.userData={orbit:topic.number,type:j};g.add(node);
      const body=models[type.model].clone(true);node.add(body);
      const light=type.model==='tires'?lightTire.clone(true):null;if(light)node.add(light);
      return {node,body,light,radius:radii[type.model],type};
    });
    return {topic,g,path,tilt,satellites,radius:1.7+index*.205,speed:.18-index*.0038,phase:index*2.399};
  });
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused=reduced.matches,visible=true,lost=false,frame=0,last=0,painted=0,time=0,selected=0,selectedType=-1,drag=null,dragAngle=0;
  const pause=document.getElementById('model-pause'),picker=document.querySelector('.orbit-picker'),tabs=document.querySelector('.model-tabs'),label=document.querySelector('.orbit-label');
  function pose(){
    const overview=!selected,solo=selectedType>=0;
    sun.visible=!solo;sun.scale.setScalar(overview?1:.8);
    system.rotation.set(0,solo?0:dragAngle*.6,solo?0:dragAngle*.15);
    for(const orbit of orbits){
      orbit.g.visible=overview||orbit.topic.number===selected;if(!orbit.g.visible)continue;
      orbit.g.rotation.copy(solo?new T.Euler():orbit.tilt);
      orbit.path.visible=!solo;orbit.path.scale.setScalar(overview?orbit.radius:2.8);orbit.path.material.opacity=overview?.28:.65;
      orbit.satellites.forEach((sat,j)=>{
        sat.node.visible=!solo||j===selectedType;if(!sat.node.visible)return;
        const angle=orbit.phase+time*orbit.speed+j*Math.PI*2/orbit.satellites.length;
        const radius=solo?0:overview?orbit.radius:2.8;
        sat.node.position.set(radius*Math.cos(angle),radius*Math.sin(angle),0);
        // Keep model orientation independent of its orbit plane.
        sat.node.quaternion.copy(orbit.g.quaternion).invert();
        const size=solo?1.8:overview?.36:.84;
        sat.body.scale.setScalar(size/sat.radius);
        const baseTilt=['apartment','plot','paper','roads','fraction','work','mixture'].includes(sat.type.model)?.55:.12;
        sat.body.rotation.set(baseTilt,time*.23+j*.6+(solo?dragAngle:0),-.08);
        sat.body.visible=!overview||!sat.light;
        if(sat.light){sat.light.visible=overview;sat.light.scale.copy(sat.body.scale);sat.light.rotation.copy(sat.body.rotation);}
      });
    }
  }
  function render(){if(lost)return;pose();renderer.render(scene,camera);}
  function animate(now){frame=0;if(paused||!visible||document.hidden||lost)return;time+=last?Math.min((now-last)/1000,.1):0;last=now;if(!software||now-painted>80){render();painted=now;}frame=requestAnimationFrame(animate);}
  function schedule(){cancelAnimationFrame(frame);frame=0;last=0;if(!paused&&visible&&!document.hidden&&!lost)frame=requestAnimationFrame(animate);}
  function pauseLabel(){pause.textContent=paused?'Вращать':'Пауза';pause.setAttribute('aria-pressed',String(paused));host.dataset.motion=paused?'paused':'running';}
  function resize(){
    const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;
    const vertical=Math.PI*35/360,narrow=Math.min(vertical,Math.atan(Math.tan(vertical)*camera.aspect));
    const radius=selectedType>=0?1.95:selected?3.8:7.1;
    camera.position.z=radius/Math.sin(narrow)*1.04;camera.updateProjectionMatrix();render();
  }
  function caption(){
    const orbit=selected?orbits[selected-1]:null,type=selectedType>=0?orbit.topic.types[selectedType]:null;
    const title=orbit?'№'+selected+' · '+orbit.topic.title:'25 заданий — 25 орбит';
    const description=type?type.label+(type.description?' · '+type.description:'')+(selected<=5?' · Пример сюжета общего блока №1–5.':''):orbit?(selected<=5?'Сюжеты блока №1–5 меняются в вариантах. Выберите модель.':orbit.topic.types.map(t=>t.label).join(' · ')):'На каждой орбите — свои типы задач. Выберите номер и рассмотрите их ближе.';
    document.getElementById('model-number').textContent=title;document.getElementById('model-description').textContent=description;
    document.getElementById('model-link').href=type?type.href:orbit?orbit.topic.href:'/trainers/oge-course/';
    canvas.setAttribute('aria-label',title+'. '+description);label.textContent=selected?'№'+selected:'ОГЭ';label.hidden=selectedType>=0;
    host.dataset.selection=selected?String(selected):'all';host.dataset.detail=selectedType>=0?'model':selected?'orbit':'all';
  }
  function chooseType(index){selectedType=index;dragAngle=0;tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.type)===index)));caption();resize();}
  function chooseOrbit(number){
    selected=number;selectedType=-1;dragAngle=0;
    picker.querySelectorAll('[data-orbit]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.orbit===(number?String(number):'all'))));
    tabs.replaceChildren();tabs.hidden=!number;
    if(number){
      const items=[{label:'Вся орбита'},...orbits[number-1].topic.types];
      items.forEach((item,j)=>{const b=document.createElement('button');b.type='button';b.textContent=item.label;b.dataset.type=String(j-1);b.setAttribute('aria-pressed',String(j===0));b.addEventListener('click',()=>chooseType(j-1));tabs.append(b);});
    }
    caption();resize();
  }
  picker.querySelectorAll('[data-orbit]').forEach(b=>b.addEventListener('click',()=>chooseOrbit(b.dataset.orbit==='all'?0:Number(b.dataset.orbit))));
  pause.addEventListener('click',()=>{paused=!paused;pauseLabel();schedule();});
  const motionChange=()=>{paused=reduced.matches;pauseLabel();schedule();};if(reduced.addEventListener)reduced.addEventListener('change',motionChange);
  document.addEventListener('visibilitychange',schedule);
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:0}).observe(stage);
  if('ResizeObserver' in window)new ResizeObserver(resize).observe(stage);else window.addEventListener('resize',resize);
  const raycaster=new T.Raycaster();
  stage.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,angle:dragAngle};stage.setPointerCapture(e.pointerId);});
  stage.addEventListener('pointermove',e=>{if(!drag)return;dragAngle=drag.angle+(e.clientX-drag.x)*.009;render();});
  stage.addEventListener('pointerup',e=>{
    if(drag&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<6){
      const rect=canvas.getBoundingClientRect();raycaster.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2),camera);
      const hits=raycaster.intersectObject(system,true);
      for(const hit of hits){if(!hit.object.isMesh)continue;let node=hit.object,shown=true;for(let p=node;p;p=p.parent)if(!p.visible)shown=false;if(!shown)continue;while(node&&!node.userData.orbit)node=node.parent;if(node){if(!selected)chooseOrbit(node.userData.orbit);else chooseType(node.userData.type);break;}}
    }drag=null;
  });
  ['pointercancel','lostpointercapture'].forEach(event=>stage.addEventListener(event,()=>{drag=null;}));
  const fallback=document.querySelector('.model-fallback');
  function availability(ready){canvas.hidden=!ready;fallback.toggleAttribute('hidden',ready);pause.hidden=!ready;picker.hidden=!ready;tabs.hidden=!ready||!selected;document.getElementById('model-hint').hidden=!ready;label.hidden=!ready||selectedType>=0;host.dataset.renderer=ready?(software?'canvas':'webgl'):'fallback';}
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(frame);availability(false);});
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;availability(true);resize();schedule();});
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;});window.addEventListener('pageshow',()=>{resize();schedule();});
  availability(true);chooseOrbit(0);pauseLabel();resize();schedule();
})();
