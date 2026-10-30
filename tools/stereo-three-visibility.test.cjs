'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),V=require('../assets/stereo-three-visibility.js'),THREE=require('../trainers/ege-profile-stereometry-3d/js/three.min.js');
const near={n:[0,0,-1],d:4.9},camera=[0,0,5],triangle={points:[[-1,-1,0],[1,-1,0],[0,1,0]],body:0};
const line={kind:'line',a:[-3,0,-1],b:[3,0,-1]},prepared=V.cones([triangle],camera,near);
const partial=V.classify(line,prepared,near);assert.equal(partial.length,3);assert.equal(partial[1].hidden,true);assert(Math.abs(partial[1].start-.4)<1e-6);assert(Math.abs(partial[1].end-.6)<1e-6);
assert(V.classify({...line,a:[-3,0,1],b:[3,0,1]},prepared,near).every(p=>!p.hidden));
const context=V.cones([{...triangle,context:true}],camera,near);assert(V.classify(line,context,near).every(p=>!p.hidden));assert(V.classify(line,context,near,[0]).some(p=>p.hidden));
const qtri=triangle.points.map(p=>p.map(Math.fround));const ownLine={kind:'line',a:qtri[0],b:qtri[1]};assert(V.classify(ownLine,prepared,near).every(p=>!p.hidden));
// Near-plane crossing polygon is clipped, not discarded wholesale.
const cut=V.clipNear([[0,0,5],[2,0,3],[0,2,3]],{n:[0,0,-1],d:4});assert.equal(cut.length,4);assert(cut.every(p=>p[2]<=4));
// Reversed and subsegment strokes paint the same canonical hidden dash phase.
const painted=(c,t)=>V.dashes(c,[{start:0,end:1,hidden:true}]).some(p=>t>=p.start&&t<=p.end);
for(let i=1;i<997;i++){const t=i/997;assert.equal(painted(line,t),painted({...line,a:line.b,b:line.a},1-t));}
const ring={kind:'circle',center:[0,0,0],u:[2,0,0],v:[0,2,0],start:3,arc:5};
for(let i=1;i<997;i++){const t=i/997;assert.equal(painted(ring,t),painted({...ring,start:8,arc:-5},1-t));}
const sphere={center:[0,0,0],radius:2};
const sr=V.sphereIntervals({kind:'circle',center:[0,0,0],u:[2,0,0],v:[0,0,2],start:0,arc:2*Math.PI},sphere,camera,near);assert(sr.length);assert(sr.some(([a,b])=>a<.75&&b>.75));
// Inside-camera/near-clipped entry must not invent an opaque cutting cap.
assert.deepEqual(V.sphereIntervals({kind:'line',a:[0,0,.1],b:[0,0,1]},sphere,[0,0,0],{n:[0,0,1],d:-.01}),[]);
assert.deepEqual(V.sphereIntervals({kind:'line',a:[0,0,0],b:[0,0,1]},sphere,camera,{n:[0,0,-1],d:1}),[]);
const tangent={kind:'line',a:[2,-2,0],b:[2,2,0]};assert(V.sphereIntervals(tangent,sphere,[2,0,5],{n:[0,0,-1],d:4.9}).length===0);
assert.equal(V.polynomialRoots([1,-4,6,-4,1]).filter(x=>Math.abs(x-1)<1e-5).length,1,'repeated quartic root');
function segment(parent,a,b){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av),mesh=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,1,8),new THREE.MeshBasicMaterial({color:0x123456}));mesh.position.copy(av).addScaledVector(d,.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());mesh.scale.y=d.length();parent.add(mesh);return mesh;}
{
 const cam=new THREE.PerspectiveCamera(40,1,.1,100);cam.position.set(...camera);cam.lookAt(0,0,0);const group=new THREE.Group(),helper=V.create(THREE,cam),mesh=segment(group,[-3,0,-1],[3,0,-1]);
 const face=new THREE.Mesh(new THREE.BufferGeometry().setFromPoints(triangle.points.map(p=>new THREE.Vector3(...p))),new THREE.MeshBasicMaterial());group.add(face);helper.surface(face,{body:0});helper.segment({mesh},{body:0});helper.update();
 assert(helper.inspect().strokes[0].parts.some(p=>p.hidden));const before=JSON.stringify(helper.inspect().strokes[0].parts);mesh.material.color.setHex(0xff8800);helper.update();assert.equal(helper.inspect().strokes[0].color,0xff8800);assert.equal(JSON.stringify(helper.inspect().strokes[0].parts),before);assert.equal(mesh.material.visible,false);
 group.updateMatrixWorld(true);const ray=new THREE.Raycaster(new THREE.Vector3(0,0,5),new THREE.Vector3(0,0,-1));assert(ray.intersectObject(mesh).length,'invisible original material remains pickable');
 mesh.scale.y=3;helper.update();assert(Math.abs(new THREE.Vector3(...helper.inspect().strokes[0].curve.a).distanceTo(new THREE.Vector3(...helper.inspect().strokes[0].curve.b))-3)<1e-9);
 helper.remove(mesh);group.remove(mesh);assert.equal(helper.inspect().strokes.length,0);assert(!group.children.some(o=>o.name==='classified-stroke'));
 const again=segment(group,[-3,0,-1],[3,0,-1]);helper.segment({mesh:again});helper.update();assert.equal(helper.inspect().strokes.length,1);group.remove(again);helper.update();assert.equal(helper.inspect().strokes.length,0);helper.dispose();
}
// Logical cylinder caps: a closed solid hides its interior through the top;
// an explicitly open vessel does not acquire an invented mouth surface.
for(const capMode of ['both','bottom','none']){
 const cam=new THREE.PerspectiveCamera(40,1,.1,100);cam.position.set(0,10,0);cam.lookAt(0,0,0);
 const group=new THREE.Group(),helper=V.create(THREE,cam),body=new THREE.Mesh(new THREE.CylinderGeometry(1,1,2,16,1,true),new THREE.MeshBasicMaterial());group.add(body);helper.surface(body,{body:0});helper.caps(body,{body:0,caps:capMode});
 const mesh=segment(group,[0,-.5,0],[0,.5,0]);helper.segment({mesh},{body:0});helper.update();assert.equal(helper.inspect().surfaces,{both:64,bottom:48,none:32}[capMode]);assert.equal(helper.inspect().strokes[0].parts.some(p=>p.hidden),capMode==='both');helper.dispose();
}
{
 const cam=new THREE.PerspectiveCamera(),group=new THREE.Group(),helper=V.create(THREE,cam),half=new THREE.Mesh(new THREE.SphereGeometry(1,16,8,0,Math.PI),new THREE.MeshBasicMaterial());group.add(half);helper.surface(half,{body:0});assert.equal(helper.inspect().spheres,0,'partial sphere remains its actual authored surface');assert(helper.inspect().surfaces>0);helper.dispose();
}
function loadBank(folder){
 const ctx=vm.createContext({THREE,StereoThreeVisibility:V,console,window:{}});vm.runInContext(fs.readFileSync(path.join(root,folder,'js/data.js'),'utf8'),ctx);
 vm.runInContext('globalThis.bank=PROBLEMS;globalThis.dataFor=sceneData;globalThis.keyFor=segKey;makeSprite=()=>new THREE.Sprite(new THREE.SpriteMaterial());',ctx);
 const source=fs.readFileSync(path.join(root,folder,'js/trainer.js'),'utf8');const start=source.indexOf('function disposeTree')>=0?source.indexOf('function disposeTree'):source.indexOf('function buildScene');const end=source.indexOf('\n/* ============================================================',source.indexOf('function buildScene'));
 ctx.T={group:new THREE.Group(),badges:new THREE.Group(),grid:new THREE.Group(),camera:new THREE.PerspectiveCamera(38,1,.1,100),clock:{elapsedTime:0},sph:{},setCam(){this.camera.position.set(8,6,10);this.camera.lookAt(0,0,0);},goHome(){this.setCam();}};
 vm.runInContext(source.slice(start,end)+';globalThis.build=buildScene;',ctx);return ctx;
}
let cards=0,strokes=0,constructed=0;const collisions=[],performanceRows=[];
for(const folder of ['trainers/ege-profile-stereometry-3d','ege-profil/trainers/stereo']){
 const ctx=loadBank(folder);assert.equal(ctx.bank.length,folder.startsWith('trainers')?143:288);
 for(const p of ctx.bank){
  const sd=ctx.dataFor(p),names={};for(const [body,g]of sd.gen.entries())for(const[n,pt]of Object.entries(g.pts)){if(names[n]&&new THREE.Vector3(...names[n].pt).distanceTo(new THREE.Vector3(...pt))>1e-8)collisions.push({folder,id:p.id,name:n,body,previous:names[n].body});names[n]={pt,body};}
  ctx.build(p);ctx.T.visibility.update();cards++;
  const state=ctx.T.visibility.inspect();strokes+=state.strokes.length;
  // Independent source-coordinate oracle: every authored body edge and face
  // must be present at that body's own coordinates, even when names collide.
  const recs=Object.values(ctx.T.segMap),actualTriangles=new Set();
  const triKey=pts=>pts.map(p=>p.map(Math.fround).join(',')).sort().join(';');
  ctx.T.group.traverse(o=>{const pos=o.geometry?.attributes.position;if(o.geometry?.type!=='BufferGeometry'||o.geometry.index||!pos)return;for(let i=0;i+2<pos.count;i+=3)actualTriangles.add(triKey([0,1,2].map(j=>[pos.getX(i+j),pos.getY(i+j),pos.getZ(i+j)])));});
  const allSourcePoints=Object.assign({},...sd.gen.map(g=>g.pts));
  for(const g of sd.gen){
   const sourcePoint=n=>g.pts[n]||allSourcePoints[n];
   for(const [a,b]of g.edges){const A=sd.toW(sourcePoint(a)),B=sd.toW(sourcePoint(b));if(A.distanceTo(B)<1e-6)continue;assert(recs.some(r=>r.A.distanceTo(A)<1e-7&&r.B.distanceTo(B)<1e-7||r.A.distanceTo(B)<1e-7&&r.B.distanceTo(A)<1e-7),folder+':'+p.id+' body-local edge '+a+b);}
   for(const face of g.faces)for(let i=1;i+1<face.length;i++)assert(actualTriangles.has(triKey([face[0],face[i],face[i+1]].map(n=>sd.toW(sourcePoint(n)).toArray()))),folder+':'+p.id+' body-local face '+face);
  }
  for(const name of Object.keys(ctx.T.vertMap))assert(!ctx.T.displayName(name).startsWith('__body'),'internal aliases never become display letters');
  if(p.id==='676923'){
   const originalCone=sd.gen[0],find=n=>Object.keys(ctx.T.unitPts).find(k=>ctx.T.displayName(k)===n&&new THREE.Vector3(...ctx.T.unitPts[k]).distanceTo(new THREE.Vector3(...originalCone.pts[n]))<1e-9);
   const O=find('O'),P=find('P'),S=find('S'),Q=find('Q');assert.equal(ctx.T.scaleFn(O,P),3);assert(Math.abs(ctx.T.scaleFn(S,P)-6)<1e-9);assert(Math.abs(ctx.T.scaleFn(S,Q)-6)<1e-9);
   assert.equal(ctx.T.givenMap[ctx.keyFor(O,P)],'3','given radius binds to primary cone');
   const rec=ctx.T.addSeg(O,Q,{kind:'user'});assert.equal(ctx.T.scaleFn(rec.p1,rec.p2),3);assert.equal(ctx.T.displayName(rec.p1)+ctx.T.displayName(rec.p2),'OQ');
   ctx.T.visibility.remove(rec.mesh);rec.mesh.parent.remove(rec.mesh);delete ctx.T.segMap[ctx.keyFor(O,Q)];
  }

  for(const stroke of state.strokes){assert.equal(stroke.pickMaterialVisible,false);for(const part of stroke.parts){assert(Number.isFinite(part.start)&&Number.isFinite(part.end));assert(part.start>=0&&part.end<=1&&part.end>part.start);}}
  if(ctx.T.constructBuild){ctx.T.constructBuild();ctx.T.anims.forEach(a=>a.step(.5));ctx.T.visibility.update();ctx.T.anims.forEach(a=>a.step(1));ctx.T.visibility.update();constructed++;ctx.T.constructHide();ctx.T.visibility.update();}
  if(p.id==='676923'){
   const generators=Object.values(ctx.T.segMap).filter(r=>['PS','QS','SP','SQ'].includes(ctx.T.displayName(r.p1)+ctx.T.displayName(r.p2))&&!r.anon);
   assert(generators.filter(r=>(ctx.T.givenMap[ctx.keyFor(r.p1,r.p2)]||r.given)==='6').length>=2,folder+': both declared generators keep displayed given6 after construction '+JSON.stringify(generators.map(r=>[r.p1,r.p2,r.given])));
  }
  if(p.id==='pir-09'){const row=ctx.T.visibility.inspect().strokes.find(s=>s.name==='Q|T');assert(row?.owners.includes(1),'ghost pyramid construction owns midpoint');}
  if(['kon-19','kon-22'].includes(p.id)){const state=ctx.T.visibility.inspect();assert(state.strokes.filter(s=>s.name==='circle').every(s=>s.owners.includes(0)),'ghost section circles inherit cone ownership');assert(state.strokes.find(s=>s.name==='K|M')?.owners.includes(0),'section radius inherits ghost cone');}
  if([27125,27163].includes(p.id)||['27125','27163'].includes(p.id)){
   const times=[];for(let i=0;i<8;i++){ctx.T.camera.position.x+=.1;ctx.T.camera.lookAt(0,0,0);const start=performance.now();ctx.T.visibility.update();times.push(performance.now()-start);}times.sort((a,b)=>a-b);performanceRows.push({folder,id:p.id,strokes:state.strokes.length,spheres:state.spheres,medianMs:times[4]});
  }
 }
 ctx.T.visibility.dispose();
}
console.log(JSON.stringify({result:'STEREO_THREE_VISIBILITY_OK',cards,strokes,constructed,performance:performanceRows,sourceNameCollisionCardsRebound:[...new Set(collisions.map(c=>c.folder+':'+c.id))]},null,2));
