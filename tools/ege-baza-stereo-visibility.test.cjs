'use strict';
// Independent world-space rays verify the actual basic-EGE SVG intervals.
// The production classifier instead clips projected polygons and sphere depth.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source=read('ege-baza/path/models.js'),shared=read('stereo-course/assets/task-scene-viewer.js');
assert.equal(source.split('// BEGIN GENERATED VISIBILITY FALLBACK\n')[1].split('// END GENERATED VISIBILITY FALLBACK')[0],shared.split('  // BEGIN SHARED VISIBILITY CORE\n')[1].split('  // END SHARED VISIBILITY CORE')[0],'base model embeds the exact reviewed shared core');
const D=require('../ege-baza/path/data.js');require('../ege-baza/path/practice.js');
const dom=new JSDOM('<!doctype html><div id="model"></div>',{runScripts:'outside-only'}),w=dom.window,host=w.document.getElementById('model');
w.PathData=D;w.structuredClone=structuredClone;w.eval(source);
const stats={models:0,paths:0,rays:0,splitLines:0,rotatedChanges:0,staticFigures:0,negativeControls:0};
const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),mul=(a,t)=>a.map(x=>x*t),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function hidden(point,line,model,camera){
 stats.rays++;const direction=[Math.sin(camera.angle)*Math.cos(camera.tilt),Math.cos(camera.angle)*Math.cos(camera.tilt),Math.sin(camera.tilt)];
 if(model.sphere){
  const {center,radius}=model.sphere;
  if(line.surface){const radial=sub(point,center);point=add(center,mul(radial,radius/Math.hypot(...radial)));}
  const o=sub(point,center),b=dot(o,direction),perp=cross(o,direction),disc=radius*radius-dot(perp,perp);
  return disc>1e-12*radius*radius&&-b+Math.sqrt(disc)>radius*1e-7;
 }
 for(const face of model.faces)for(let i=1;i<face.length-1;i++){
  const a=face[0],e1=sub(face[i],a),e2=sub(face[i+1],a),p=cross(direction,e2),det=dot(e1,p);
  if(Math.abs(det)<1e-12*Math.hypot(...e1)*Math.hypot(...e2))continue;
  const s=sub(point,a),u=dot(s,p)/det;if(u< -1e-9||u>1+1e-9)continue;
  const q=cross(s,e1),v=dot(direction,q)/det;if(v< -1e-9||u+v>1+1e-9)continue;
  if(dot(e2,q)/det>1e-7*Math.max(...model.lines.flatMap(l=>[...l.a,...l.b]).map(Math.abs)))return true;
 }
 return false;
}
function inspect(task,camera){
 const model=w.PathModels.solidModel(task.model,camera.cut,camera.angle,camera.tilt),byId=new Map(model.lines.map(l=>[l.id,l])),groups=new Map();
 assert.equal(model.faces.length,{box:6,pyramid:5,cylinder:122,cone:121,sphere:0}[task.model.body]);
 const pointKey=p=>p.map(x=>Math.abs(x)<1e-10?0:Number(x.toFixed(9))).join(','),adjacency=new Map();
 for(const face of model.faces)face.forEach((p,i)=>{const key=[pointKey(p),pointKey(face[(i+1)%face.length])].sort().join('|');adjacency.set(key,(adjacency.get(key)||0)+1);});
 for(const count of adjacency.values())assert.equal(count,2,'closed body has exactly two faces at each boundary edge');
 const {a,b,h,body}=task.model;
 const contour=model.lines.filter(l=>l.id.startsWith('silhouette-')),direction=[Math.sin(camera.angle)*Math.cos(camera.tilt),Math.cos(camera.angle)*Math.cos(camera.tilt),Math.sin(camera.tilt)];
 assert.equal(contour.length,body==='sphere'?120:body==='cylinder'?2:body==='cone'&&Math.abs(a*Math.tan(camera.tilt)/h)<1?2:0,'camera silhouette is present independently of construction grid');
 for(const l of contour){
  if(body==='sphere')for(const p of [l.a,l.b])assert(Math.abs(dot(p,direction))<1e-8,'sphere outline is in camera plane');
  else assert(Math.abs(dot([l.a[0]/a,l.a[1]/a,body==='cone'?a/h:0],direction))<1e-8,'outline generator is tangent to the analytic surface');
 }
 for(const p of model.faces.flat()){
  assert(p[2]>=-1e-9&&p[2]<=h+1e-9,'body uses the given height');
  if(body==='box'||body==='pyramid')assert(Math.abs(p[0])<=a/2+1e-9&&Math.abs(p[1])<=b/2+1e-9,'body uses the given base dimensions');
  else assert(Math.abs(Math.hypot(p[0],p[1])-a)<1e-9||body==='cone'&&Math.abs(p[2]-h)<1e-9,'round body uses the given radius');
 }
 if(model.sphere)for(const line of model.lines.filter(l=>l.surface))for(const p of [line.a,line.b])assert(Math.abs(Math.hypot(...p)-a)<1e-9,'only actual sphere surface arcs receive surface semantics');
 const rotate=([x,y,z])=>{const depth=x*Math.sin(camera.angle)+y*Math.cos(camera.angle);return[x*Math.cos(camera.angle)-y*Math.sin(camera.angle),z*Math.cos(camera.tilt)-depth*Math.sin(camera.tilt)];};
 const points=model.lines.flatMap(l=>[rotate(l.a),rotate(l.b)]),low=[0,1].map(i=>Math.min(...points.map(p=>p[i]))),high=[0,1].map(i=>Math.max(...points.map(p=>p[i]))),scale=Math.min(550/Math.max(high[0]-low[0],.001),300/Math.max(high[1]-low[1],.001));
 const project=p=>{const q=rotate(p);return[300+(q[0]-(low[0]+high[0])/2)*scale,175-(q[1]-(low[1]+high[1])/2)*scale];};
 for(const node of host.querySelectorAll('path[data-solid-line]')){
  const line=byId.get(node.dataset.solidLine),start=+node.dataset.partStart,end=+node.dataset.partEnd,isHidden=node.dataset.hidden==='true';assert(line);assert(start>=0&&end<=1&&end>start);
  const part={start,end,hidden:isHidden};if(!groups.has(line.id))groups.set(line.id,[]);groups.get(line.id).push(part);
  const xy=node.getAttribute('d').match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/ig).map(Number),wanted=[...project(add(line.a,mul(sub(line.b,line.a),start))),...project(add(line.a,mul(sub(line.b,line.a),end)))];
  assert.equal(xy.length,4);xy.forEach((x,i)=>assert(Number.isFinite(x)&&Math.abs(x-wanted[i])<1e-7,'actual projected endpoint'));assert(xy[0]>=24&&xy[0]<=576&&xy[2]>=24&&xy[2]<=576&&xy[1]>=24&&xy[1]<=326&&xy[3]>=24&&xy[3]<=326,'fit into600×350viewBox at any camera');
  assert.equal(node.getAttribute('stroke-dasharray'),isHidden?'5 5':'none','actual dash style');
  if(line.id.startsWith('silhouette-'))assert(!isHidden,'camera silhouette stays solid');
  for(const f of [.113,.371,.617,.887]){const t=start+(end-start)*f;assert.equal(isHidden,hidden(add(line.a,mul(sub(line.b,line.a),t)),line,model,camera),task.model.body+' ray oracle '+line.id);}
  stats.paths++;
 }
 assert.equal(groups.size,model.lines.length,'every authored body and auxiliary line drawn');
 for(const [id,parts]of groups){parts.sort((a,b)=>a.start-b.start);assert.equal(parts[0].start,0);assert.equal(parts.at(-1).end,1);parts.slice(1).forEach((p,i)=>assert(Math.abs(p.start-parts[i].end)<1e-10,'continuous coverage '+id));if(parts.length>1)stats.splitLines++;}
 assert(groups.get('axis').some(p=>p.hidden),'internal radius/height is hidden');
 assert([...groups.values()].some(parts=>parts.some(p=>!p.hidden)),'visible contour retained');
 return JSON.stringify([...groups]);
}
for(const [id,seed]of [['box',0],['box',5],['pyramid',0],['pyramid',5],['roundbody',0],['roundbody',1],['roundbody',2],['scale',0]]){
 const task=D.task(id,seed),before=JSON.stringify(task),cameras=[{angle:.65,tilt:.4,cut:1/3},{angle:2.1,tilt:-.45,cut:.2},{angle:-1.2,tilt:1.1,cut:.8}];let previous;
 for(const camera of cameras){w.PathModels.mount(host,task,{state:{kind:'solid',...camera}});const result=inspect(task,camera);if(previous&&previous!==result)stats.rotatedChanges++;previous=result;stats.models++;}
 assert.equal(JSON.stringify(task),before,'conditions, answers and model dimensions untouched');
}
assert(stats.splitLines>0,'camera-crossing sphere arcs split into exact hidden/visible intervals');
// A deliberately solid interior height must be rejected by the ray oracle.
const task=D.task('box',0),camera={angle:.65,tilt:.4,cut:1/3};w.PathModels.mount(host,task,{state:{kind:'solid',...camera}});
const wrong=host.querySelector('[data-solid-line="axis"][data-hidden="true"]');wrong.dataset.hidden='false';wrong.setAttribute('stroke-dasharray','none');assert.throws(()=>inspect(task,camera),/ray oracle/);stats.negativeControls++;
let changes=[];const session=w.PathModels.mount(host,D.task('scale',0),{state:{kind:'solid',angle:.3,tilt:.2,cut:.4},onChange:s=>changes.push(s)});
for(const [id,value]of [['angle',120],['tilt',-35],['cut',.65]]){const input=host.querySelector('#'+id);input.value=value;input.dispatchEvent(new w.Event('input'));}
const saved=session.getState(),markup=host.querySelector('svg').innerHTML;assert.equal(saved.cut,.65);assert(Math.abs(saved.angle-2*Math.PI/3)<1e-12);assert.equal(changes.length,3);
w.PathModels.mount(host,D.task('scale',0),{state:saved});assert.equal(host.querySelector('svg').innerHTML,markup,'existing semantic camera/section state restores exactly');
const figures=require('../ege-baza/path/stereo-figures.js');
function rings(doc){for(const ellipse of doc.querySelectorAll('[data-stereo-ring]')){
 assert.equal(ellipse.getAttribute('stroke'),'none','ellipse fill does not repaint arcs');
 const back=ellipse.nextElementSibling,front=back.nextElementSibling,visibleTop=ellipse.dataset.stereoRing==='cylinder-top';
 assert.equal(back.dataset.hidden,String(!visibleTop));assert.equal(front.dataset.hidden,'false');
 assert.equal(back.querySelector('path').hasAttribute('stroke-dasharray'),!visibleTop,'back ring arc');assert(!front.querySelector('path').hasAttribute('stroke-dasharray'),'front ring arc');
}}
for(const {id}of D.meta.filter(m=>[11,13].includes(m.pos)))for(let seed=0;seed<7;seed++){
 const html=figures.visual(D.task(id,seed)),view=new JSDOM(html),doc=view.window.document;rings(doc);
 for(const radius of doc.querySelectorAll('[data-stereo-aux="radius"]'))assert(radius.querySelector('path[stroke-dasharray]'),'interior radius dashed');
 if(id==='practice-box-diagonal')assert(!doc.querySelector('[data-stereo-given="diagonal"]').previousElementSibling.hasAttribute('stroke-dasharray'),'front-face diagonal solid');
 stats.staticFigures++;view.window.close();
}
const bad=new JSDOM(figures.visual(D.task('roundbody',1)));bad.window.document.querySelector('[data-ring-half="back"] path').removeAttribute('stroke-dasharray');assert.throws(()=>rings(bad.window.document),/back ring arc/);stats.negativeControls++;bad.window.close();
w.close();console.log('EGE_BAZA_STEREO_VISIBILITY_OK '+JSON.stringify(stats));
