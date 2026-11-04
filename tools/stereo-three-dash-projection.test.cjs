'use strict';
// Geometry-only projection oracle. This does not claim a browser/raster pass:
// it projects the actual generated mesh triangles independently and checks
// their painted centres and empty gaps, including the reported CA1 diagonal.
const assert=require('node:assert/strict');
const THREE=require('../trainers/ege-profile-stereometry-3d/js/three.min.js');
const V=require('../assets/stereo-three-visibility.js');
const v=p=>new THREE.Vector3(...p);
const inside=(p,a,b,c)=>{
  const cross=(u,w,q)=>(w.x-u.x)*(q.y-u.y)-(w.y-u.y)*(q.x-u.x);
  const ds=[cross(a,b,p),cross(b,c,p),cross(c,a,p)];
  return ds.every(d=>d>=-1e-11)||ds.every(d=>d<=1e-11);
};
function camera(width,height,distance,theta=-.65,phi=1.18){
  const c=new THREE.PerspectiveCamera(38,width/height,.1,100);
  c.position.setFromSphericalCoords(distance,phi,theta);c.lookAt(0,0,0);c.updateMatrixWorld();return c;
}
function model(c,a,b,{scale=[1,1,1],rotation=[0,0,0],wall=false}={}){
  const group=new THREE.Group();group.scale.set(...scale);group.rotation.set(...rotation);
  const helper=V.create(THREE,c);
  const body=new THREE.Mesh(wall?new THREE.PlaneGeometry(1000,1000):new THREE.BoxGeometry(5.6,5.6,5.6),new THREE.MeshBasicMaterial());
  if(wall){body.position.copy(c.position).addScaledVector(c.getWorldDirection(new THREE.Vector3()),.2);body.quaternion.copy(c.quaternion);}
  helper.surface(body,{body:0});
  const A=v(a),B=v(b),d=B.clone().sub(A),mesh=new THREE.Mesh(new THREE.CylinderGeometry(.034,.034,1,8),new THREE.MeshBasicMaterial());
  mesh.position.copy(A).addScaledVector(d,.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());mesh.scale.y=d.length();group.add(mesh);
  helper.segment({mesh},{body:0,radius:.034});helper.update();
  return {c,group,helper,mesh,dispose(){helper.dispose();body.geometry.dispose();body.material.dispose();mesh.geometry.dispose();mesh.material.dispose();}};
}
function output(model){
  const {c,group,helper}=model;group.updateMatrixWorld(true);
  const state=helper.inspect().strokes[0],parts=group.children.find(p=>p.name==='classified-stroke').children.filter(p=>p.visible);
  const triangles=[];
  for(const mesh of parts){
    const pos=mesh.geometry.attributes.position,idx=mesh.geometry.index;
    for(let i=0;i<idx.count;i+=3)triangles.push([0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(pos,idx.getX(i+j)).applyMatrix4(mesh.matrixWorld).project(c)));
  }
  const at=t=>v(state.curve.a).lerp(v(state.curve.b),t).project(c);
  return {state,pieces:parts.filter(p=>p.userData.visibility.hidden).map(p=>p.userData.visibility).sort((a,b)=>a.start-b.start),at,painted:p=>triangles.some(t=>inside(p,...t))};
}
let triangleChecks=0,phaseChecks=0,minimumMobileGap=Infinity;const rows=[];
const A=[2.8,-2.8,-2.8],B=[-2.8,2.8,2.8];
for(const [width,height]of [[320,520],[760,1000]])for(const distance of [12,23,28,32]){
  const c=camera(width,height,distance),m=model(c,A,B),r=output(m);assert(r.pieces.length>=3);
  const gaps=[];
  for(let i=0;i<r.pieces.length;i++){
    const piece=r.pieces[i];assert(r.painted(r.at((piece.start+piece.end)/2)),'actual mesh paints each dash centre');triangleChecks++;
    if(!i)continue;
    const previous=r.pieces[i-1],middle=r.at((previous.end+piece.start)/2);
    assert(!r.painted(middle),'actual projected triangles leave each gap empty');triangleChecks++;
    const a=r.at(previous.end),b=r.at(piece.start),gap=Math.hypot((a.x-b.x)*width/2,(a.y-b.y)*height/2);gaps.push(gap);
    assert(gap>=height*.0085,'camera foreshortening does not collapse a hidden gap');
  }
  if(width===320)minimumMobileGap=Math.min(minimumMobileGap,...gaps);
  rows.push({width,height,distance,dashes:r.pieces.length,minimumGapPixels:Math.min(...gaps)});
  // Subdivision and direction must not create a second pattern that fills the
  // first line's gaps. Compare actual triangle coverage at shared world points.
  const reversed=model(c,B,A),partial=model(c,v(A).lerp(v(B),.2).toArray(),v(A).lerp(v(B),.83).toArray());
  const rr=output(reversed),rp=output(partial);
  for(let i=1;i<181;i++){
    const t=.2+.63*i/181,p=r.at(t);
    // Exclude only the antialias boundary's numerical neighbourhood, not gaps.
    if(r.pieces.some(d=>Math.min(Math.abs(t-d.start),Math.abs(t-d.end))<1e-6))continue;
    assert.equal(r.painted(p),rr.painted(p),'reversal keeps actual painted phase');
    assert.equal(r.painted(p),rp.painted(p),'collinear subsegment keeps actual painted phase');phaseChecks+=2;
  }
  reversed.dispose();partial.dispose();m.dispose();
}
// Nested transformed adapters retain exact projected ends, including inverse
// shear that cannot be represented by decomposing into position/rotation/scale.
for(const scale of [[1,1,1],[2,2,2],[.8,1.7,.5]]){
  const c=camera(320,520,10,0,Math.PI/2),m=model(c,[-.3,-1,1],[.3,1,-2],{scale,rotation:[.2,.3,.4],wall:true}),r=output(m);
  assert(r.pieces.length>2);
  for(let i=0;i<r.pieces.length;i++){
    const piece=r.pieces[i];assert(r.painted(r.at((piece.start+piece.end)/2)));triangleChecks++;
    if(i){assert(!r.painted(r.at((r.pieces[i-1].end+piece.start)/2)),'nested parent keeps gap empty');triangleChecks++;}
  }
  // A resized, rotated camera can change projection without changing position.
  const before=JSON.stringify(r.pieces);c.fov=55;c.aspect=1.4;c.updateProjectionMatrix();m.helper.update();
  assert.notEqual(JSON.stringify(output(m).pieces),before,'projection-only change refreshes runtime dash phase');
  const group=m.group.children.find(p=>p.name==='classified-stroke'),geometry=group.children[0].geometry,position=geometry.attributes.position;
  const beforeRoll=JSON.stringify(output(m).pieces);c.rotateZ(Math.PI);m.helper.update();
  assert.notEqual(JSON.stringify(output(m).pieces),beforeRoll,'pure camera roll refreshes projected phase');
  assert.equal(group.children[0].geometry,geometry,'camera moves reuse hidden dash geometry');
  assert.equal(geometry.attributes.position,position,'camera moves reuse the GPU position attribute');
  let disposals=0;geometry.addEventListener('dispose',()=>disposals++);m.group.remove(m.mesh);m.helper.update();
  assert.equal(disposals,1,'removing a source stroke disposes its reused dash buffer');m.dispose();
}
// A line crossing the near plane can have enormous projected endpoints. Only
// the viewport range gets dash meshes; the finite exact near-clipped parts stay.
{
  const c=camera(320,520,10,0,Math.PI/2),m=model(c,[-10,0,9.999999],[10,.2,-100],{wall:true}),r=output(m);
  assert(r.pieces.length>0&&r.pieces.length<100,'near-plane projection has bounded dash count');
  assert(r.pieces.every(p=>Number.isFinite(p.start)&&Number.isFinite(p.end)&&p.start>=0&&p.end<=1));m.dispose();
  const along=model(c,[0,0,0],[0,0,-5],{wall:true});assert.equal(output(along).pieces.length,0,'a projected point does not create an infinite dash loop');along.dispose();
}
// Negative control: the old fixed world-space pattern really is too fine at
// the reported fitted phone camera; this gate must not merely echo metadata.
{
  const c=camera(320,520,28),curve={kind:'line',a:A,b:B},pieces=V.dashes(curve,[{start:0,end:1,hidden:true}]).sort((a,b)=>a.start-b.start);
  const a=v(V.point(curve,pieces[0].end)).project(c),b=v(V.point(curve,pieces[1].start)).project(c);
  assert(Math.hypot((a.x-b.x)*160,(a.y-b.y)*260)<1.5,'old world pattern is rejected by the readable-gap threshold');
}
console.log(JSON.stringify({result:'STEREO_THREE_DASH_PROJECTION_OK',triangleChecks,phaseChecks,minimumMobileGap,rows,limits:'Projected actual mesh triangles only; real WebGL pixels are a separate browser gate.'},null,2));
