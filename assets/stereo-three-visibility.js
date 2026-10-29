/* Shared hidden-stroke renderer for the two Three.js stereometry courses.
 * Exact interval boundaries against polygon/round-body triangles and ideal
 * spheres. Lines/circles use algebraic boundary roots, never sampled chords
 * or a whole-edge midpoint test. Cylinder/cone surfaces retain authored mesh
 * resolution; spheres use their mathematical surface to avoid facet flicker.
 */
(function (root) {
  'use strict';
  const EPS = 1e-8, TAU = Math.PI * 2;
  const add = (a,b) => a.map((x,i) => x+b[i]);
  const sub = (a,b) => a.map((x,i) => x-b[i]);
  const mul = (a,s) => a.map(x => x*s);
  const dot = (a,b) => a.reduce((s,x,i) => s+x*b[i],0);
  const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const norm = a => Math.hypot(...a);
  const unit = a => mul(a,1/norm(a));
  const value = (p,x) => dot(p.n,x)+p.d;
  const point = (c,t) => c.kind === 'circle'
    ? add(c.center,add(mul(c.u,Math.cos(c.start+c.arc*t)),mul(c.v,Math.sin(c.start+c.arc*t))))
    : add(c.a,mul(sub(c.b,c.a),t));
  function unique(xs) { return xs.sort((a,b)=>a-b).filter((x,i,a)=>!i||x-a[i-1]>1e-10); }
  function roots(curve,plane) {
    if (curve.kind !== 'circle') {
      const a=value(plane,curve.a),b=value(plane,curve.b),d=b-a;
      return Math.abs(d)>1e-14 ? [-a/d].filter(t=>t>0&&t<1) : [];
    }
    const a=dot(plane.n,curve.u),b=dot(plane.n,curve.v),c=value(plane,curve.center),r=Math.hypot(a,b);
    if (r<1e-14 || Math.abs(c)>r*(1+1e-12)) return [];
    const phase=Math.atan2(b,a),angle=Math.acos(Math.max(-1,Math.min(1,-c/r))),out=[];
    const lo=Math.min(curve.start,curve.start+curve.arc),hi=Math.max(curve.start,curve.start+curve.arc);
    for(const base of [phase-angle,phase+angle]) {
      const first=Math.ceil((lo-base)/TAU),last=Math.floor((hi-base)/TAU);
      for(let k=first;k<=last;k++){const t=(base+k*TAU-curve.start)/curve.arc;if(t>0&&t<1)out.push(t);}
    }
    return unique(out);
  }
  function intersect(a,b) {
    const out=[];let i=0,j=0;
    while(i<a.length&&j<b.length){const lo=Math.max(a[i][0],b[j][0]),hi=Math.min(a[i][1],b[j][1]);if(hi-lo>1e-10)out.push([lo,hi]);if(a[i][1]<b[j][1])i++;else j++;}
    return out;
  }
  function allowed(curve,plane,strict=false) {
    const cuts=unique([0,1,...roots(curve,plane)]),out=[];
    for(let i=1;i<cuts.length;i++)if(value(plane,point(curve,(cuts[i-1]+cuts[i])/2))>(strict?EPS:-EPS))out.push([cuts[i-1],cuts[i]]);
    return out;
  }
  function union(intervals) {
    const out=[];
    for(const p of intervals.sort((a,b)=>a[0]-b[0])){const last=out.at(-1);if(last&&p[0]<=last[1]+1e-9)last[1]=Math.max(last[1],p[1]);else out.push([...p]);}
    return out;
  }
  function clipNear(triangle,near) {
    const out=[];
    for(let i=0;i<triangle.length;i++){
      const a=triangle[i],b=triangle[(i+1)%triangle.length],da=value(near,a),db=value(near,b);
      if(da>=0)out.push(a);
      if((da>=0)!==(db>=0))out.push(add(a,mul(sub(b,a),da/(da-db))));
    }
    return out;
  }
  function cones(triangles,camera,near) {
    const out=[];
    for(const item of triangles){
      const poly=clipNear(item.points,near);
      for(let j=1;j+1<poly.length;j++){
        const t=[poly[0],poly[j],poly[j+1]],raw=cross(sub(t[1],t[0]),sub(t[2],t[0]));
        if(norm(raw)<1e-12)continue;
        const n=unit(raw),f=dot(n,sub(camera,t[0]));if(Math.abs(f)<EPS)continue;
        const planes=[];let degenerate=false;
        for(let k=0;k<3;k++){
          let side=cross(sub(t[k],camera),sub(t[(k+1)%3],camera));
          if(norm(side)<1e-12){degenerate=true;break;}
          side=unit(side);if(dot(side,sub(t[(k+2)%3],camera))<0)side=mul(side,-1);
          planes.push({n:side,d:-dot(side,camera)});
        }
        if(degenerate)continue;
        const back=mul(n,-Math.sign(f));// Float32 GPU positions must not hide their own double-precision edges.
        const depthTolerance=1e-6*Math.max(1,...t.flat().map(Math.abs));
        planes.push({n:back,d:-dot(back,t[0])-depthTolerance});
        out.push({planes,body:item.body,context:item.context});
      }
    }
    return out;
  }
  function classify(curve,prepared,near,owners=[],spheres=[],camera) {
    const visibleRange=allowed(curve,near),hidden=[];
    for(const cone of prepared){
      if(cone.context&&!owners.includes(cone.body))continue;
      let ranges=visibleRange;
      for(let i=0;i<4&&ranges.length;i++)ranges=intersect(ranges,allowed(curve,cone.planes[i],i===3));
      hidden.push(...ranges);
    }
    for(const sphere of spheres)if(!sphere.context||owners.includes(sphere.body))hidden.push(...sphereIntervals(curve,sphere,camera,near));
    const all=union(hidden),cuts=unique([0,1,...visibleRange.flat(),...all.flat()]),out=[];
    for(let i=1;i<cuts.length;i++){
      const start=cuts[i-1],end=cuts[i],t=(start+end)/2;
      if(!visibleRange.some(r=>t>=r[0]&&t<=r[1]))continue;
      const h=all.some(r=>t>=r[0]&&t<=r[1]),last=out.at(-1);
      if(last&&last.hidden===h&&Math.abs(last.end-start)<1e-9)last.end=end;
      else out.push({start,end,hidden:h});
    }
    return out;
  }
  // Real roots of degree <= 4, isolated between derivative roots. This is
  // algebraic root isolation, not visibility sampling; each open interval has
  // constant ray/sphere intersection topology.
  function polynomialRoots(coeff) {
    const scale=Math.max(...coeff.map(Math.abs));if(!scale)return [];
    const c=coeff.map(x=>x/scale);while(c.length>1&&Math.abs(c.at(-1))<1e-14)c.pop();
    const n=c.length-1;if(!n)return [];if(n===1)return [-c[0]/c[1]];
    const evalAt=x=>c.reduceRight((sum,v)=>sum*x+v,0);
    const roundoff=x=>32*Number.EPSILON*c.reduceRight((sum,v)=>sum*Math.abs(x)+Math.abs(v),0);
    const bound=1+Math.max(...c.slice(0,-1).map(x=>Math.abs(x/c[n])));
    const critical=polynomialRoots(c.slice(1).map((v,i)=>v*(i+1))).filter(x=>x>-bound&&x<bound);
    const cuts=[-bound,...critical,bound],out=[];
    for(const x of critical)if(Math.abs(evalAt(x))<=roundoff(x))out.push(x);
    for(let i=1;i<cuts.length;i++){
      let a=cuts[i-1],b=cuts[i],fa=evalAt(a),fb=evalAt(b);if(Math.abs(fa)<=roundoff(a)||Math.abs(fb)<=roundoff(b)||fa*fb>=0)continue;
      for(let k=0;k<90;k++){const m=(a+b)/2,f=evalAt(m);if((f>0)===(fa>0)){a=m;fa=f;}else b=m;}
      out.push((a+b)/2);
    }
    return unique(out);
  }
  function sphereIntervals(curve,sphere,camera,near) {
    const q=sub(camera,sphere.center),rr=sphere.radius**2,k=dot(q,q)-rr;
    // w=P-camera. All topology boundaries are quadratic forms in w:
    // ray tangency, endpoint on sphere, and sphere hit on the near plane.
    const nearDistance=-value(near,camera),f=near.n;
    const forms=[
      w=>dot(q,w)**2-dot(w,w)*k,
      w=>dot(add(q,w),add(q,w))-rr,
      w=>{const d=dot(f,w),v=add(mul(q,d),mul(w,nearDistance));return dot(v,v)-rr*d*d;},
      w=>dot(q,w)
    ];
    const cuts=[0,1];
    for(const form of forms){
      if(curve.kind!=='circle'){
        const a=sub(curve.a,camera),d=sub(curve.b,curve.a),v0=form(a),vp=form(add(a,d)),vm=form(sub(a,d));
        cuts.push(...polynomialRoots([v0,(vp-vm)/2,(vp+vm)/2-v0]).filter(t=>t>0&&t<1));
      }else{
        // tan(theta/2): evaluate the homogeneous quadratic using five exact
        // coefficient values; the numerator has degree at most four.
        const a=sub(curve.center,camera),u=curve.u,v=curve.v;
        const f0=form(a),fu=(form(add(a,u))-form(sub(a,u)))/2,fv=(form(add(a,v))-form(sub(a,v)))/2;
        const fuu=(form(add(a,u))+form(sub(a,u)))/2-f0,fvv=(form(add(a,v))+form(sub(a,v)))/2-f0;
        const fuv=form(add(a,add(u,v)))-f0-fu-fv-fuu-fvv;
        const coeff=[f0+fu+fuu,2*fv+2*fuv,2*f0-2*fuu+4*fvv,2*fv-2*fuv,f0-fu+fuu];
        const angles=[Math.PI,...polynomialRoots(coeff).map(x=>2*Math.atan(x))];
        const lo=Math.min(curve.start,curve.start+curve.arc),hi=Math.max(curve.start,curve.start+curve.arc);
        for(const angle of angles)for(let j=Math.ceil((lo-angle)/TAU);j<=Math.floor((hi-angle)/TAU);j++){
          const t=(angle+j*TAU-curve.start)/curve.arc;if(t>0&&t<1)cuts.push(t);
        }
      }
    }
    const sorted=unique(cuts),out=[];
    for(let i=1;i<sorted.length;i++){
      const a=sorted[i-1],b=sorted[i],p=point(curve,(a+b)/2),w=sub(p,camera),ww=dot(w,w),qw=dot(q,w),disc=qw*qw-ww*k;
      if(disc<=1e-12*Math.max(1,qw*qw,Math.abs(ww*k)))continue;
      const d=dot(f,w),root=Math.sqrt(disc),nearT=d>0?nearDistance/d:Infinity;
      const entry=(-qw-root)/ww,exit=(-qw+root)/ww;
      // Match clipped surface semantics: when the camera is inside the body,
      // or the near plane clips its front, only a remaining surface hit hides P.
      if([entry,exit].some(t=>t>=nearT-1e-10&&t>1e-10&&t<1-1e-8))out.push([a,b]);
    }
    return out;
  }
  function canonical(v) { const n=unit(v);const first=n.find(x=>Math.abs(x)>1e-8);return first<0?mul(n,-1):n; }
  function phase(curve) {
    if(curve.kind!=='circle'){const n=canonical(sub(curve.b,curve.a));return {a:dot(curve.a,n),b:dot(curve.b,n)};}
    const radius=norm(curve.u),n=canonical(cross(curve.u,curve.v));
    const ref=Math.abs(n[0])<0.9?[1,0,0]:[0,1,0],u=unit(sub(ref,mul(n,dot(ref,n)))),v=cross(n,u);
    const first=sub(point(curve,0),curve.center),a=Math.atan2(dot(first,v),dot(first,u))*radius;
    return {a,b:a+curve.arc*radius*Math.sign(dot(cross(curve.u,curve.v),n))};
  }
  function dashes(curve,parts,pitch=.28,length=.16) {
    // A whole circumference must contain an integer number of periods, so
    // equivalent arcs agree even when atan2 chooses a different 2π branch.
    if(curve.kind==='circle'){const circumference=TAU*norm(curve.u),ratio=length/pitch;pitch=circumference/Math.max(1,Math.round(circumference/pitch));length=pitch*ratio;}
    const ph=phase(curve),delta=ph.b-ph.a,out=[];
    for(const part of parts){
      if(!part.hidden){out.push(part);continue;}
      const lo=Math.min(ph.a+delta*part.start,ph.a+delta*part.end),hi=Math.max(ph.a+delta*part.start,ph.a+delta*part.end);
      for(let k=Math.floor(lo/pitch)-1;k<=Math.ceil(hi/pitch);k++){
        const a=(k*pitch-ph.a)/delta,b=(k*pitch+length-ph.a)/delta;
        const start=Math.max(part.start,Math.min(a,b)),end=Math.min(part.end,Math.max(a,b));
        if(end-start>1e-8)out.push({start,end,hidden:true});
      }
    }
    return out;
  }
  // Ownership of auxiliary strokes is derived from bounded source bodies.
  // Context/reference bodies hide their own construction, not a separate
  // inscribed solid. Convex polygon membership uses complete source faces.
  function bodyContains(g,p,circle) {
    const tol=1e-7;
    for(const sf of g.surfaces||[]){
      if(!['sphere','cyl','cone'].includes(sf.type))continue;
      const q=sub(p,sf.c),r=circle?.r||0;
      if(sf.type==='sphere'){
        const radial=circle?(circle.plane==='h'?Math.hypot(q[0],q[2]):Math.hypot(q[0],q[1])):0;
        if(dot(q,q)+r*r+2*r*radial<=sf.r*sf.r+tol)return true;
      }else if(!circle||circle.plane==='h'){
        if(Math.abs(q[1])>sf.h/2+tol)continue;
        const bound=sf.type==='cyl'?sf.r:sf.r*(sf.flip?(q[1]+sf.h/2)/sf.h:(sf.h/2-q[1])/sf.h);
        if(Math.hypot(q[0],q[2])+r<=bound+tol)return true;
      }
    }
    if(!(g.faces||[]).length)return false;
    const pts=Object.values(g.pts),center=mul(pts.reduce(add,[0,0,0]),1/pts.length);let valid=0;
    for(const names of g.faces){
      const a=g.pts[names[0]],b=g.pts[names[1]],c=g.pts[names[2]];if(!a||!b||!c)continue;
      let n=cross(sub(b,a),sub(c,a));if(norm(n)<1e-12)continue;n=unit(n);if(dot(n,sub(center,a))>0)n=mul(n,-1);
      const radius=circle?circle.r*(circle.plane==='h'?Math.hypot(n[0],n[2]):Math.hypot(n[0],n[1])):0;
      if(dot(n,sub(p,a))+radius>tol)return false;valid++;
    }
    return valid>=4;
  }
  // Two declared bodies may reuse A/B/O at different positions. Give earlier
  // occurrences private render keys, while preserving the last public binding
  // and the display letter. Coincident shared vertices retain the same key.
  function normalizeBodies(source) {
    const last={},used=new Set(),displayNames={},maps=[];
    source.forEach(g=>Object.entries(g.pts).forEach(([name,p])=>{last[name]=p;used.add(name);}));
    const bodies=source.map((g,i)=>{
      const names={};for(const [name,p]of Object.entries(g.pts)){
        let key=name;if(norm(sub(p,last[name]))>1e-9){key='__body'+i+'_'+name;while(used.has(key))key='__'+key;used.add(key);displayNames[key]=name;}names[name]=key;
      }
      maps.push(names);return {...g,pts:Object.fromEntries(Object.entries(g.pts).map(([n,p])=>[names[n],p])),
        faces:g.faces.map(f=>f.map(n=>names[n]||n)),edges:g.edges.map(e=>e.map(n=>names[n]||n))};
    });
    return {bodies,displayNames,maps};
  }
  function create(THREE,camera) {
    const surfaces=[],spheres=[],strokes=[],records=new WeakMap();let lastCamera='',prepared=[];
    const array=v=>[v.x,v.y,v.z];
    function surface(mesh,options={}) {
      mesh.updateWorldMatrix(true,false);
      if(mesh.geometry.type==='SphereGeometry'&&Math.abs(mesh.geometry.parameters.phiLength-TAU)<1e-8&&Math.abs(mesh.geometry.parameters.thetaStart)<1e-8&&Math.abs(mesh.geometry.parameters.thetaLength-Math.PI)<1e-8){const center=array(new THREE.Vector3().setFromMatrixPosition(mesh.matrixWorld)),scale=new THREE.Vector3().setFromMatrixScale(mesh.matrixWorld);if(Math.abs(scale.x-scale.y)<1e-8&&Math.abs(scale.x-scale.z)<1e-8){spheres.push({center,radius:mesh.geometry.parameters.radius*scale.x,body:options.body,context:!!options.context});lastCamera='';return;}}
      const geo=mesh.geometry,pos=geo.attributes.position,idx=geo.index,points=[];
      const v=new THREE.Vector3();
      for(let i=0;i<(idx?idx.count:pos.count);i+=3){
        const tri=[];for(let j=0;j<3;j++)tri.push(array(v.fromBufferAttribute(pos,idx?idx.getX(i+j):i+j).applyMatrix4(mesh.matrixWorld)));
        points.push({points:tri,body:options.body,context:!!options.context});
      }
      surfaces.push(...points);lastCamera='';
    }
    function caps(mesh,options={}) {
      const p=mesh.geometry.parameters;if(!p||!p.openEnded||options.caps==='none')return;
      const geo=new THREE.CylinderGeometry(p.radiusTop,p.radiusBottom,p.height,p.radialSegments,1,false,p.thetaStart,p.thetaLength);
      const pos=geo.attributes.position,idx=geo.index,arr=[],v=new THREE.Vector3();mesh.updateWorldMatrix(true,false);
      for(let i=0;i<idx.count;i+=3){
        const ids=[idx.getX(i),idx.getX(i+1),idx.getX(i+2)],ys=ids.map(n=>pos.getY(n));
        if(Math.max(...ys)-Math.min(...ys)>1e-7)continue;
        if(options.caps==='bottom'&&ys[0]>0)continue;
        for(const id of ids)arr.push(...array(v.fromBufferAttribute(pos,id).applyMatrix4(mesh.matrixWorld)));
      }
      for(let i=0;i<arr.length;i+=9)surfaces.push({points:[arr.slice(i,i+3),arr.slice(i+3,i+6),arr.slice(i+6,i+9)],body:options.body,context:!!options.context});
      geo.dispose();lastCamera='';
    }
    function register(mesh,options={}) {
      if(!options.curve&&records.has(mesh)){const old=records.get(mesh);if(options.body!=null&&!old.owners.includes(options.body))old.owners.push(options.body);old.key='';return old;}
      const group=new THREE.Group();group.name='classified-stroke';mesh.parent.add(group);
      const material=new THREE.MeshBasicMaterial({color:mesh.material.color,transparent:true,opacity:1,depthTest:false,depthWrite:false});
      const stroke={mesh,parent:mesh.parent,group,material,owners:options.body==null?[]:[options.body],radius:options.radius||.03,circle:!!options.circle,localCurve:options.curve,key:'',parts:[]};
      stroke.geometry=new THREE.CylinderGeometry(stroke.radius,stroke.radius,1,8);
      if(!options.curve)records.set(mesh,stroke);strokes.push(stroke);mesh.material.visible=false;return stroke;
    }
    function update() {
      camera.updateMatrixWorld();
      const cam=array(camera.getWorldPosition(new THREE.Vector3())),forward=array(camera.getWorldDirection(new THREE.Vector3()));
      const near={n:forward,d:-dot(forward,cam)-camera.near},key=[...cam,...forward,camera.near].join(',');
      const changed=lastCamera!==key;
      if(changed){prepared=cones(surfaces,cam,near);lastCamera=key;}
      for(const stroke of [...strokes]){
        const {mesh,group,material}=stroke;
        if(mesh.parent!==stroke.parent){remove(mesh);continue;}
        mesh.material.visible=false;material.color.copy(mesh.material.color);
        let shown=true;for(let p=mesh;p;p=p.parent)if(!p.visible){shown=false;break;}group.visible=shown;
        if(!shown)continue;
        mesh.updateWorldMatrix(true,false);
        const m=mesh.matrixWorld,stamp=m.elements.join(',');if(!changed&&stamp===stroke.key)continue;stroke.key=stamp;
        const world=p=>array(new THREE.Vector3(...p).applyMatrix4(m));let curve;
        if(stroke.localCurve){const p=stroke.localCurve;if(p.kind==='circle'){const center=world(p.center);curve={kind:'circle',center,u:sub(world(add(p.center,p.u)),center),v:sub(world(add(p.center,p.v)),center),start:p.start||0,arc:p.arc??TAU};}else curve={kind:'line',a:world(p.a),b:world(p.b)};}
        else if(stroke.circle){const p=mesh.geometry.parameters,center=world([0,0,0]);curve={kind:'circle',center,u:sub(world([p.radius,0,0]),center),v:sub(world([0,p.radius,0]),center),start:0,arc:p.arc||TAU};}
        else curve={kind:'line',a:world([0,-.5,0]),b:world([0,.5,0])};
        if(curve.kind==='circle'?norm(curve.u)<1e-7:norm(sub(curve.b,curve.a))<1e-7){group.visible=false;continue;}
        stroke.curve=curve;stroke.parts=classify(curve,prepared,near,stroke.owners,spheres,cam);
        const pieces=dashes(curve,stroke.parts);
        // Reuse meshes on camera moves; only short arc geometries vary.
        for(let i=0;i<Math.max(pieces.length,group.children.length);i++){
          let part=group.children[i];if(i>=pieces.length){part.visible=false;continue;}
          const piece=pieces[i];
          if(!part){part=new THREE.Mesh(stroke.geometry,material);part.renderOrder=5;group.add(part);}part.visible=true;
          if(curve.kind==='circle'){
            if(part.geometry!==stroke.geometry)part.geometry.dispose();
            const from=curve.start+curve.arc*piece.start,arc=curve.arc*(piece.end-piece.start),radius=norm(curve.u);
            part.geometry=new THREE.TorusGeometry(radius,stroke.radius,6,Math.max(2,Math.ceil(96*arc/TAU)),arc);
            const u=new THREE.Vector3(...unit(curve.u)),v=new THREE.Vector3(...unit(curve.v)),n=new THREE.Vector3().crossVectors(u,v);
            const basis=new THREE.Matrix4().makeBasis(u,v,n).multiply(new THREE.Matrix4().makeRotationZ(from));
            part.quaternion.setFromRotationMatrix(basis);part.position.set(...curve.center);part.scale.set(1,1,1);
          }else{
            const a=new THREE.Vector3(...point(curve,piece.start)),b=new THREE.Vector3(...point(curve,piece.end)),dir=b.clone().sub(a),len=dir.length();
            part.position.copy(a).addScaledVector(dir,.5);part.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());part.scale.set(1,len,1);
          }
          // Original course groups are identity transforms. Convert world
          // pieces to the actual parent frame for adapters with nested groups.
          group.updateWorldMatrix(true,false);
          const inverse=new THREE.Matrix4().copy(group.matrixWorld).invert();part.updateMatrix();part.matrix.premultiply(inverse);part.matrix.decompose(part.position,part.quaternion,part.scale);
          part.userData.visibility={...piece};
        }
      }
    }
    function remove(mesh) {
      for(let i=strokes.length-1;i>=0;i--){const s=strokes[i];if(s.mesh!==mesh)continue;const geos=new Set([s.geometry]);s.group.children.forEach(p=>geos.add(p.geometry));geos.forEach(g=>g.dispose());s.material.dispose();s.group.parent?.remove(s.group);strokes.splice(i,1);}
      records.delete(mesh);
    }
    function dispose() { for(const s of [...strokes])remove(s.mesh); }
    return {surface,caps,segment:(rec,options)=>register(rec.mesh,options),circle:(mesh,options)=>register(mesh,{...options,circle:true}),curve:(object,curve,options)=>register(object,{...options,curve}),update,dispose,remove,
      inspect:()=>({surfaces:surfaces.length,spheres:spheres.length,strokes:strokes.map(s=>({name:s.mesh.userData.seg||'circle',owners:s.owners,parts:s.parts,curve:s.curve,color:s.material.color.getHex(),pickMeshVisible:s.mesh.visible,pickMaterialVisible:s.mesh.material.visible}))})};
  }
  const api={create,cones,classify,roots,dashes,point,clipNear,polynomialRoots,sphereIntervals,bodyContains,normalizeBodies};
  root.StereoThreeVisibility=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
