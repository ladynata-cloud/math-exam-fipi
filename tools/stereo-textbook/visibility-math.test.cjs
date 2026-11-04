'use strict';
// Independent visibility oracle: triangulated world-space faces and ray/triangle
// intersections. The renderer uses projected polygon intervals, not this method.
// This gate examines actual SVG paths, their complete parameter coverage, depth
// classification, drawn endpoints and computed dash style. It never imports the
// renderer's geometric helpers or modifies authored lessons/review flags.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '../..');
const rendererPath = process.env.VISIBILITY_RENDERER || path.join(root, 'stereo-course/assets/task-scene-viewer.js');
const stylePath = process.env.VISIBILITY_STYLE || path.join(root, 'stereo-course/assets/task-scenes.css');
const defaultBundles = ['stereo-course/textbook/data/course.json','stereo-course/merzlyak-10-base/data/course.json','stereo-course/shestakov-yaschenko-10-11/data/course.json'].map(p=>path.join(root,p));
const bundlePaths = process.env.VISIBILITY_BUNDLES ? process.env.VISIBILITY_BUNDLES.split(path.delimiter) : process.env.VISIBILITY_BUNDLE ? [process.env.VISIBILITY_BUNDLE] : defaultBundles;
const profileMap = new Map(), profileDir=path.join(__dirname,'visibility-profiles');
const signature = source => JSON.stringify([source.points,source.edges||[],source.faces||[],Object.entries(source.views||{}).map(([id,v])=>[id,v.segments||[],v.polygon||[]]),!!source.planar]);
if(!process.argv.includes('--fixtures-only') && fs.existsSync(profileDir))for(const file of fs.readdirSync(profileDir).filter(p=>p.endsWith('.json'))){
  const document=JSON.parse(fs.readFileSync(path.join(profileDir,file),'utf8'));
  assert(Array.isArray(document.profiles),file+' explicit profile list');
  for(const profile of document.profiles){
    assert.equal(typeof profile.signature,'string',file+' profile binding');
    assert(Array.isArray(profile.lessonIds)&&profile.lessonIds.length,file+' profile source identities');
    const previous=profileMap.get(profile.signature);
    if(previous)assert.deepEqual([previous.faces,previous.views,previous.spheres,previous.viewSpheres],[profile.faces,profile.views,profile.spheres,profile.viewSpheres],file+' conflicting geometry profiles');
    profileMap.set(profile.signature,profile);
  }
}
const dom = new JSDOM('<!doctype html><head></head><body><div class="task-scene" id="mount"></div></body>', { runScripts: 'dangerously' });
const w = dom.window, host = w.document.getElementById('mount');
const css = w.document.createElement('style'); css.textContent = fs.readFileSync(stylePath, 'utf8'); w.document.head.append(css);
w.eval(fs.readFileSync(rendererPath, 'utf8'));
const errors = []; w.addEventListener('error', e => errors.push(e.message));
const stats = { fixtures: 0, cards: 0, authoredViews: 0, rotatedModels: 0, rotatedViews: 0, profiledCards: 0, sphereRays: 0, paths: 0, hiddenPaths: 0, splitLines: 0, rays: 0, negativeControls: 0 };
const sub = (a,b) => a.map((v,i) => v-b[i]);
const dot = (a,b) => a.reduce((s,v,i) => s+v*b[i],0);
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const pointAt = (a,b,t) => a.map((v,i) => v+(b[i]-v)*t);
const signedArea = (a,b,c) => (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const same = (a,b) => Math.hypot(...sub(a,b)) < 1e-12;

function triangulate(vertices) {
  // Ear clipping handles concave polygons. A fan would falsely occlude their
  // notches, so a dedicated concave fixture below rejects that shortcut.
  let vertices3 = vertices.filter((v,i) => !same(v,vertices[(i+vertices.length-1)%vertices.length]));
  if (vertices3.length < 3) return [];
  const normal = [0,0,0];
  for (let i=0;i<vertices3.length;i++) {
    const a=vertices3[i],b=vertices3[(i+1)%vertices3.length];
    normal[0]+=(a[1]-b[1])*(a[2]+b[2]); normal[1]+=(a[2]-b[2])*(a[0]+b[0]); normal[2]+=(a[0]-b[0])*(a[1]+b[1]);
  }
  const drop=normal.map(Math.abs).indexOf(Math.max(...normal.map(Math.abs)));
  const project=v=>v.filter((_,i)=>i!==drop);
  let vertices2=vertices3.map(project);
  const area=vertices2.reduce((s,a,i)=>{const b=vertices2[(i+1)%vertices2.length];return s+a[0]*b[1]-a[1]*b[0];},0);
  const size=Math.max(1,...vertices2.flat().map(Math.abs)),eps=1e-12*size*size;
  if (Math.abs(area)<eps) return [];
  const sign=Math.sign(area), indices=vertices3.map((_,i)=>i),triangles=[];
  while(indices.length>3) {
    let removed=false;
    for(let j=0;j<indices.length;j++) {
      const a=indices[(j+indices.length-1)%indices.length],b=indices[j],c=indices[(j+1)%indices.length];
      const turn=sign*signedArea(vertices2[a],vertices2[b],vertices2[c]);
      if (Math.abs(turn)<=eps) {indices.splice(j,1);removed=true;break;}
      if (turn<0) continue;
      const occupied=indices.some(k=>k!==a&&k!==b&&k!==c&&[signedArea(vertices2[a],vertices2[b],vertices2[k]),signedArea(vertices2[b],vertices2[c],vertices2[k]),signedArea(vertices2[c],vertices2[a],vertices2[k])].every(v=>sign*v>=-eps));
      if (occupied) continue;
      triangles.push([vertices3[a],vertices3[b],vertices3[c]]);indices.splice(j,1);removed=true;break;
    }
    assert(removed,'oracle cannot triangulate authored simple polygon');
  }
  if(indices.length===3)triangles.push(indices.map(i=>vertices3[i]));
  return triangles;
}
function prepareOracle(model) {
  const points=Object.values(model.points),center=[0,1,2].map(i=>(Math.min(...points.map(p=>p[i]))+Math.max(...points.map(p=>p[i])))/2);
  const radius=Math.max(.001,...points.map(p=>Math.hypot(...sub(p,center))));
  const profile=profileMap.get(signature(model)),cache=new Map();
  function surfaces(viewKey){
    if(cache.has(viewKey))return cache.get(viewKey);
    // A reviewed profile explicitly replaces an incomplete drawing surface. It
    // does not add old decorative plane patches back into the occluding body.
    const faces=profile?.views?.[viewKey]??profile?.faces??model.faces??[];
    const spheres=profile?.viewSpheres?.[viewKey]??profile?.spheres??model.spheres??[];
    const triangles=faces.flatMap(face=>triangulate(face.map(n=>{assert(model.points[n],'profile unknown point '+n);return model.points[n];}))).map(([a,b,c])=>({a,e1:sub(b,a),e2:sub(c,a)}));
    for(const sphere of spheres){assert(Array.isArray(sphere.center)&&sphere.center.length===3&&sphere.center.every(Number.isFinite));assert(Number.isFinite(sphere.radius)&&sphere.radius>0);for(const pair of sphere.surfaceEdges||[]){assert(pair.length===2&&pair.every(n=>model.points[n]),'sphere arc endpoints');for(const n of pair)assert(Math.abs(Math.hypot(...sub(model.points[n],sphere.center))-sphere.radius)<=Math.max(1,sphere.radius)*1e-7,'sphere arc endpoint must lie on its surface');}}
    const result={triangles,spheres,identity:JSON.stringify([faces,spheres])};cache.set(viewKey,result);return result;
  }
  return {model,center,radius,profile,surfaces};
}
function isHidden(oracle,point,camera,pair) {
  stats.rays++;
  if(oracle.model.planar) return false;
  const direction=[Math.sin(camera.yaw)*Math.cos(camera.pitch),Math.cos(camera.yaw)*Math.cos(camera.pitch),Math.sin(camera.pitch)];
  // Möller–Trumbore, two-sided triangles, positive world-space ray distance.
  // Coplanar lines and tangencies are visible; faces strictly in front occlude.
  for(const tri of oracle.triangles) {
    const p=cross(direction,tri.e2), determinant=dot(tri.e1,p);
    if(Math.abs(determinant)<1e-12*Math.hypot(...tri.e1)*Math.hypot(...tri.e2))continue;
    const inv=1/determinant,s=sub(point,tri.a),u=dot(s,p)*inv;
    if(u < -1e-9 || u > 1+1e-9)continue;
    const q=cross(s,tri.e1),v=dot(direction,q)*inv;
    if(v < -1e-9 || u+v > 1+1e-9)continue;
    const distance=dot(tri.e2,q)*inv;
    if(distance>oracle.radius*1e-7)return true;
  }
  for(const sphere of oracle.spheres){
    stats.sphereRays++;
    let origin=point;
    const ownArc=(sphere.surfaceEdges||[]).some(edge=>pair&&((edge[0]===pair[0]&&edge[1]===pair[1])||(edge[0]===pair[1]&&edge[1]===pair[0])));
    if(ownArc){const radial=sub(point,sphere.center),length=Math.hypot(...radial);assert(length>sphere.radius*1e-9,'sphere surface arc cannot pass through center');origin=sphere.center.map((v,i)=>v+radial[i]*sphere.radius/length);}
    const offset=sub(origin,sphere.center),b=dot(offset,direction),perpendicular=cross(offset,direction),distanceSquared=dot(perpendicular,perpendicular),discriminant=sphere.radius*sphere.radius-distanceSquared;
    // Closest approach avoids subtracting two large along-ray distances. A
    // tangent ray crosses no interior; its roundoff bound is machine-relative.
    if(discriminant<=16*Number.EPSILON*Math.max(sphere.radius*sphere.radius,distanceSquared))continue;
    const exit=-b+Math.sqrt(Math.max(0,discriminant));
    if(exit>oracle.radius*1e-7)return true;
  }
  return false;
}
function expectedLines(model,viewKey) {
  const view=model.views?.[viewKey]||{},lines=new Map();
  function add(kind,pair){lines.set(kind+'|'+pair.join('-'),{kind,pair});}
  (model.edges||[]).forEach(pair=>add('edge',pair));
  (view.segments||[]).forEach(pair=>add('segment',pair));
  (model.arrows||[]).forEach(pair=>add('vector',pair));
  const polygon=view.polygon||[];polygon.forEach((name,i)=>add('boundary',[name,polygon[(i+1)%polygon.length]]));
  return lines;
}
function svgPoint(oracle,point,camera) {
  const [x,y,z]=sub(point,oracle.center),depth=x*Math.sin(camera.yaw)+y*Math.cos(camera.yaw),q=[x*Math.cos(camera.yaw)-y*Math.sin(camera.yaw),z*Math.cos(camera.pitch)-depth*Math.sin(camera.pitch)];
  const box=host.querySelector('svg').getAttribute('viewBox').split(/\s+/).map(Number),scale=Math.min(box[2],box[3])*.36/oracle.radius;
  return [box[2]/2+q[0]*scale,box[3]/2-q[1]*scale];
}
function inspect(oracle,camera,viewKey,label,{styles=false}={}) {
  oracle={...oracle,...oracle.surfaces(viewKey)};
  const expected=expectedLines(oracle.model,viewKey),groups=new Map();
  const lineNodes=host.querySelectorAll('path.am-edge,path.am-segment,path.am-plane-border');
  assert.equal(lineNodes.length,host.querySelectorAll('path[data-edge],path[data-segment],path[data-vector],path[data-boundary]').length,label+' no unclassified solid overlay');
  if(styles)for(const fill of host.querySelectorAll('.am-face,.am-plane'))assert.equal(w.getComputedStyle(fill).stroke,'none',label+' face fills must not repaint hidden boundaries');
  for(const node of host.querySelectorAll('path[data-edge],path[data-segment],path[data-vector],path[data-boundary]')) {
    const kind=['edge','segment','vector','boundary'].find(k=>node.hasAttribute('data-'+k)),key=kind+'|'+node.getAttribute('data-'+kind);
    assert(expected.has(key),label+' unexpected drawn line '+key);
    assert(node.hasAttribute('data-part-start')&&node.hasAttribute('data-part-end'),label+' missing complete line interval '+key);
    const start=Number(node.dataset.partStart),end=Number(node.dataset.partEnd),hidden=node.dataset.hidden;
    assert(Number.isFinite(start)&&Number.isFinite(end)&&start>=-1e-10&&end<=1+1e-10&&end>start,label+' invalid interval '+key);
    assert(['true','false'].includes(hidden),label+' missing visibility state '+key);
    const part={start,end,hidden:hidden==='true',node};
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(part); stats.paths++;if(part.hidden)stats.hiddenPaths++;
    const pair=expected.get(key).pair,a=oracle.model.points[pair[0]],b=oracle.model.points[pair[1]];
    const match=node.getAttribute('d').match(/^M\s*([-\d.e+]+)[ ,]+([-\d.e+]+)\s*L\s*([-\d.e+]+)[ ,]+([-\d.e+]+)\s*$/i);
    assert(match,label+' each interval must draw exactly one segment '+key);
    const actual=match.slice(1).map(Number),wanted=[...svgPoint(oracle,pointAt(a,b,start),camera),...svgPoint(oracle,pointAt(a,b,end),camera)];
    actual.forEach((v,i)=>assert(Math.abs(v-wanted[i])<=.0011,label+' drawn endpoint disagrees with interval '+key));
    for(const f of [.113,.371,.617,.887]) {
      const t=start+(end-start)*f,correct=isHidden(oracle,pointAt(a,b,t),camera,pair);
      assert.equal(part.hidden,correct,`${label} ${key} visibility at t=${t}: SVG=${part.hidden}, ray=${correct}`);
    }
    if(styles){const dash=w.getComputedStyle(node).strokeDasharray;assert.equal(Boolean(dash&&dash!=='none'&&!/^0(?:[ ,]+0)*$/.test(dash)),part.hidden,label+' computed dash style '+key);}
    if(kind==='vector')assert.equal(node.hasAttribute('marker-end'),end>=1-1e-10,label+' vector arrow appears only at original endpoint');
  }
  for(const [key,line]of expected) {
    const parts=groups.get(key);
    if(!parts){assert(line.kind==='edge'&&oracle.model.smooth,label+' dropped authored line '+key);continue;}
    // Some historical data repeats a line. Deduplicate identical draws only;
    // distinct overlapping or missing parameter intervals must still fail.
    const unique=[...new Map(parts.map(p=>[`${p.start}:${p.end}:${p.hidden}`,p])).values()].sort((a,b)=>a.start-b.start);
    assert(Math.abs(unique[0].start)<1e-9&&Math.abs(unique.at(-1).end-1)<1e-9,label+' truncated line '+key);
    unique.slice(1).forEach((p,i)=>assert(Math.abs(p.start-unique[i].end)<1e-9,label+' gap or overlap '+key));
    if(unique.length>1)stats.splitLines++;
    const [a,b]=line.pair.map(n=>oracle.model.points[n]);
    for(let j=0;j<17;j++){
      const t=(j+.4142135623730951)/17,part=unique.find(p=>p.start<=t&&p.end>=t);
      assert(part,label+' uncovered independent probe '+key);
      assert.equal(part.hidden,isHidden(oracle,pointAt(a,b,t),camera,line.pair),label+' independent probe '+key+' t='+t);
    }
  }
  return groups;
}
function mount(model,camera) {return w.TaskSceneViewer.mount(host,model,camera?{savedCamera:camera}:{});}
function model(points,faces,edges,extra={}) {return {points,faces,edges,views:{neutral:{label:'Visibility fixture'}},...extra};}
const straight={yaw:0,pitch:0};
const screen=model({A:[-1,1,-1],B:[1,1,-1],C:[1,1,1],D:[-1,1,1],U:[-2,0,0],V:[2,0,0],F:[-.5,0,.5],G:[.5,2,.5],I:[0,0,0],J:[0,2,0]},[['A','B','C','D']],[['U','V'],['F','G'],['A','C'],['I','J']],{arrows:[['U','V']],views:{neutral:{label:'Crossing and depth',segments:[['U','V'],['F','G']],polygon:['A','B','C','D']}}});
function states(groups,key){return [...groups.get(key)].sort((a,b)=>a.start-b.start).map(p=>[p.start,p.end,p.hidden]);}
function fixture(name,source,camera=straight,check,viewKey='neutral') {
  const frozen=JSON.stringify(source),api=mount(source,camera),oracle=prepareOracle(source);api.setView(viewKey);const groups=inspect(oracle,api.getState(),viewKey,name,{styles:true});
  check?.(groups,api,oracle);assert.equal(JSON.stringify(source),frozen,name+' source geometry mutation');api.destroy();stats.fixtures++;
}
fixture('partial-plane',screen,straight,(groups,api,oracle)=>{
  const parts=states(groups,'edge|U-V');assert.equal(parts.length,3);[0,.25,.75].forEach((v,i)=>assert(Math.abs(parts[i][0]-v)<1e-6));assert.deepEqual(parts.map(p=>p[2]),[false,true,false]);
  assert.deepEqual(states(groups,'edge|A-C').map(p=>p[2]),[false],'coplanar face diagonal visible');
  assert.deepEqual(states(groups,'edge|F-G').map(p=>p[2]),[true,false],'line passing through face changes depth');
  assert.deepEqual(states(groups,'edge|I-J').map(p=>p[2]),[true,false],'zero projected length still preserves depth transition');
  const target=groups.get('edge|U-V').find(p=>p.hidden).node,old=target.dataset.hidden;target.dataset.hidden='false';assert.throws(()=>inspect(oracle,api.getState(),'neutral','negative visibility'));target.dataset.hidden=old;stats.negativeControls++;
  const last=groups.get('edge|U-V').at(-1).node,value=last.dataset.partEnd;last.dataset.partEnd='.9';assert.throws(()=>inspect(oracle,api.getState(),'neutral','negative gap'));last.dataset.partEnd=value;stats.negativeControls++;
  const arrow=groups.get('vector|U-V')[0].node;arrow.setAttribute('marker-end','url(#false-interior-arrow)');assert.throws(()=>inspect(oracle,api.getState(),'neutral','negative arrow'));arrow.removeAttribute('marker-end');stats.negativeControls++;
});
fixture('coincident-hidden',model({A:[-1,1,-1],B:[1,1,-1],C:[1,1,1],D:[-1,1,1],U:[-.9,0,0],V:[.9,0,0],W:[0,0,0]},[['A','B','C','D']],[['U','V']],{views:{neutral:{segments:[['V','U'],['U','W'],['W','V']]}}}),straight,(groups)=>{
  function checkPhases(){
    const nodes=[...groups.values()].flat().filter(p=>p.hidden).map(p=>p.node);
    const paths=nodes.map(node=>{const coordinates=node.getAttribute('d').match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/ig).map(Number);return {node,a:coordinates.slice(0,2),b:coordinates.slice(2),offset:Number(node.getAttribute('stroke-dashoffset')||0)};});
    const reference=paths[0];
    for(let i=0;i<101;i++){
      const t=.05+i*.009,point=reference.a.map((v,j)=>v+(reference.b[j]-v)*t),paints=[];let boundary=false;
      for(const p of paths){const delta=p.b.map((v,j)=>v-p.a[j]),length=Math.hypot(...delta),along=point.reduce((sum,v,j)=>sum+(v-p.a[j])*delta[j]/length,0);if(along<.01||along>length-.01)continue;const phase=((along+p.offset)%10+10)%10;if(Math.min(phase,Math.abs(phase-5),10-phase)<.002){boundary=true;continue;}paints.push(phase<5);}
      if(boundary)continue;assert(paints.length>=2,'coincident fixture has multiple overlapping paths');assert(paints.every(v=>v===paints[0]),'coincident reversed or subdivided dashed paths must share gaps');
    }
  }
  checkPhases();const reversed=groups.get('segment|V-U')[0].node,value=reversed.getAttribute('stroke-dashoffset');reversed.setAttribute('stroke-dashoffset',String(Number(value)+2.5));assert.throws(checkPhases);reversed.setAttribute('stroke-dashoffset',value);stats.negativeControls++;
});
fixture('planar-never-hidden',{...screen,planar:true});
fixture('no-faces',model({A:[0,0,0],B:[1,1,1]},[],[['A','B']]));
fixture('edge-on-plane',model({A:[-1,-1,0],B:[1,-1,0],C:[1,1,0],D:[-1,1,0],U:[-2,0,0],V:[2,0,0]},[['A','B','C','D']],[['U','V']]));
const concave=model({A:[0,1,0],B:[3,1,0],C:[3,1,1],D:[1,1,1],E:[1,1,3],F:[0,1,3],U:[.5,0,2],V:[2.5,0,2]},[['A','B','C','D','E','F']],[['U','V']]);
fixture('concave-open-face',concave,straight,g=>{const p=states(g,'edge|U-V');assert.deepEqual(p.map(p=>p[2]),[true,false]);assert(Math.abs(p[0][1]-.25)<1e-6);});
fixture('concave-reversed-face',{...concave,faces:concave.faces.map(f=>[...f].reverse())});
fixture('rotated-plane',screen,{yaw:1.7,pitch:.5});
fixture('tiny-shadow',model({A:[-.0001,1,-1],B:[.0001,1,-1],C:[.0001,1,1],D:[-.0001,1,1],U:[-2,0,0],V:[2,0,0]},[['A','B','C','D']],[['U','V']]),straight,g=>{assert.equal(states(g,'edge|U-V').length,3);assert.deepEqual(states(g,'edge|U-V').map(p=>p[2]),[false,true,false]);});
const ball=model({U:[-2,0,0],V:[2,0,0],F:[-.4,1,0],G:[.4,1,0],I:[0,-2,0],J:[0,2,0],P:[-.5,Math.sqrt(.75),0],Q:[.5,Math.sqrt(.75),0]},[],[['U','V'],['F','G'],['I','J'],['P','Q']],{spheres:[{center:[0,0,0],radius:1}]});
fixture('analytic-sphere',ball,straight,g=>{assert.deepEqual(states(g,'edge|U-V').map(p=>p[2]),[false,true,false]);assert.deepEqual(states(g,'edge|F-G').map(p=>p[2]),[false]);assert(states(g,'edge|P-Q').filter(p=>p[2]).reduce((s,p)=>s+p[1]-p[0],0)>.99999,'interior chord hidden');});
fixture('sphere-surface-arc',{...ball,spheres:[{center:[0,0,0],radius:1,surfaceEdges:[['P','Q']]}]},straight,g=>assert.deepEqual(states(g,'edge|P-Q').map(p=>p[2]),[false],'front surface arc visible'));
fixture('rotated-sphere-surface',{...ball,spheres:[{center:[0,0,0],radius:1,surfaceEdges:[['P','Q']]}]},{yaw:2.4,pitch:.21});
fixture('planar-sphere',{...ball,planar:true});
fixture('sphere-tangent-ray',model({U:[1,-2,0],V:[1,2,0]},[],[['U','V']],{spheres:[{center:[0,0,0],radius:1}]}),straight,g=>assert.deepEqual(states(g,'edge|U-V').map(p=>p[2]),[false],'edge-on tangent ray crosses no interior'));
const cubePoints={A:[-1,-1,-1],B:[1,-1,-1],C:[1,1,-1],D:[-1,1,-1],E:[-1,-1,1],F:[1,-1,1],G:[1,1,1],H:[-1,1,1],I:[-.4,0,0],J:[.4,0,0]};
const cubeFaces=[['A','B','C','D'],['E','H','G','F'],['A','E','F','B'],['B','F','G','C'],['C','G','H','D'],['D','H','E','A']];
fixture('closed-cube',model(cubePoints,cubeFaces,[['A','B'],['E','F'],['E','G'],['E','H'],['I','J']],{views:{neutral:{segments:[['A','B'],['I','J']],polygon:['A','B','F','E']}}}),{yaw:.37,pitch:.29});

// Two open cone nappes touch at one vertex, but they are separate surface
// components. Their normals must be oriented from their own component center.
const nappePoints={S:[0,0,0]},nappeFaces=[],nappeEdges=[],ringCount=24;
for(const [prefix,height]of [['U',2],['L',-2]])for(let i=0;i<ringCount;i++)nappePoints[prefix+i]=[Math.cos(2*Math.PI*i/ringCount),Math.sin(2*Math.PI*i/ringCount),height];
for(const prefix of ['U','L'])for(let i=0;i<ringCount;i++){const a=prefix+i,b=prefix+((i+1)%ringCount);nappeFaces.push(['S',a,b]);nappeEdges.push([a,b],['S',a]);}
const nappes=model(nappePoints,nappeFaces,nappeEdges,{smooth:true,labelNames:['S']});
fixture('two-open-cone-nappes',nappes,{yaw:.37,pitch:.29},groups=>{
  const prepared=w.TaskSceneViewer.prepare(nappes);
  for(const face of prepared.faces){const center=face.names.reduce((sum,n)=>sum.map((v,i)=>v+nappePoints[n][i]/3),[0,0,0]);assert(face.normal[0]*center[0]+face.normal[1]*center[1]>.1,'each cone nappe must have outward lateral normals');}
  for(const prefix of ['U','L'])assert.equal([...groups.keys()].filter(k=>k.startsWith('edge|S-'+prefix)).length,2,'each smooth open nappe retains two silhouette generators');
});

const lessons=[];
for(const bundlePath of bundlePaths){const primary=JSON.parse(fs.readFileSync(bundlePath,'utf8')),rows=Array.isArray(primary)?primary:primary.lessons;assert(Array.isArray(rows)&&rows.length,'authored bundle required');lessons.push(...rows);}
const existingIds=new Set(lessons.map(l=>l.id));
if(process.env.VISIBILITY_EXTRA_BUNDLE){const extra=JSON.parse(fs.readFileSync(process.env.VISIBILITY_EXTRA_BUNDLE,'utf8'));for(const lesson of (Array.isArray(extra)?extra:extra.lessons))if(!existingIds.has(lesson.id)){lessons.push(lesson);existingIds.add(lesson.id);}}
const first=JSON.parse(fs.readFileSync(defaultBundles[0],'utf8')).lessons.find(l=>l.id==='atanasyan2024-main-001-a');
assert(first,'actual reported textbook figure required');
fixture('reported-figure',first.visualization.model,null,(groups,api,oracle)=>{
  for(const key of ['edge|D-E','edge|M-K','edge|E-C'])assert(groups.get(key).filter(p=>p.hidden).reduce((s,p)=>s+p.end-p.start,0)>1-1e-6,'reported hidden auxiliary '+key);
  assert(groups.get('edge|C-D').every(p=>!p.hidden),'outer contour DC must remain solid');
  host.querySelector('[aria-label="Повернуть вправо"]').click();inspect(oracle,api.getState(),'neutral','reported figure after real control',{styles:true});
  api.reset();inspect(oracle,api.getState(),'neutral','reported figure reset',{styles:true});
});
const rounded=JSON.parse(fs.readFileSync(defaultBundles[1],'utf8')).lessons.find(l=>l.id==='ex-18-044');
fixture('rounded-face-endpoint',rounded.visualization.model,{yaw:-2.27,pitch:.89},groups=>assert(groups.get('boundary|A-H').every(p=>!p.hidden),'rounded point on frontface must not create a zero-pixel hidden fragment'),'normal');
if(!process.argv.includes('--fixtures-only')){
  const rotations=[{yaw:1.13,pitch:-.31},{yaw:-2.27,pitch:.89}];
  for(const lesson of lessons){
    const source=lesson.visualization.model,sourceHash=JSON.stringify(source),oracle=prepareOracle(source),api=mount(source);
    for(const view of Object.keys(source.views||{neutral:{}})) {api.setView(view);inspect(oracle,api.getState(),view,lesson.id+'/'+view);stats.authoredViews++;}
    api.destroy();
    // Select real authored views that cover every line under every distinct
    // effective surface configuration. Do not synthesize a new model signature:
    // that would accidentally bypass the profile used in production.
    if(!source.planar){
      const selected=[],covered=new Set();
      for(const view of Object.keys(source.views||{neutral:{}})){
        const geometry=oracle.surfaces(view).identity,keys=[geometry+'|surface',...[...expectedLines(source,view).keys()].map(k=>geometry+'|'+k)];
        if(keys.some(k=>!covered.has(k))){selected.push(view);keys.forEach(k=>covered.add(k));}
      }
      for(const camera of rotations){const rotated=mount(source,camera);for(const view of selected){rotated.setView(view);inspect(oracle,rotated.getState(),view,lesson.id+'/rotated/'+camera.yaw+'/'+view);stats.rotatedViews++;}rotated.destroy();stats.rotatedModels++;}
    }
    if(oracle.profile)stats.profiledCards++;
    assert.equal(JSON.stringify(source),sourceHash,lesson.id+' source mutation');stats.cards++;
    if(stats.cards%100===0)console.log('VISIBILITY_PROGRESS '+JSON.stringify({cards:stats.cards,views:stats.authoredViews,rays:stats.rays}));
  }
}
assert.deepEqual(errors,[],'viewer runtime errors');dom.window.close();
console.log('ATANASYAN_VISIBILITY_MATH_OK '+JSON.stringify(stats));
