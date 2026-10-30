'use strict';
// Exercise the real SVG builder. Independent world-space rays are used below;
// the shared visibility algorithm is not used to calculate expected results.
const assert = require('node:assert/strict'), fs = require('node:fs'), crypto = require('node:crypto');
const { JSDOM } = require('jsdom');
const file = 'ege-profil/start/stereo-tasks.js', source = fs.readFileSync(file, 'utf8');
const shared = fs.readFileSync('stereo-course/assets/task-scene-viewer.js', 'utf8').split('  // BEGIN SHARED VISIBILITY CORE\n')[1].split('  // END SHARED VISIBILITY CORE')[0];
assert.equal(source.split('  // BEGIN GENERATED PROFILE VISIBILITY FALLBACK\n')[1].split('  // END GENERATED PROFILE VISIBILITY FALLBACK')[0], shared, 'exact shared numeric core');
let instrumented = source.replace('svg.innerHTML = `<title>', `
  if (root.__reverseStrokeControl) {
    const original = strokes.find(s => s.attrs.includes('data-feature="height"'));
    strokes.push({...original, p:original.q, q:original.p, attrs:'data-reverse-control="true"'});
  }
  root.__visibilityAudit = {strokes, surfaces, roundBodies, yaw, pitch, scale};
  svg.innerHTML = \`<title>`);
instrumented = instrumented.replace("      return '';\n    }\n    function roundSurface", `
      if (root.__reverseCurveControl && surface?.sphere && !root.__reversingCurve) {
        root.__reversingCurve = true;
        curve3(points.slice().reverse(), color, 'data-reverse-curve="true"', surface);
        root.__reversingCurve = false;
      }
      return '';
    }
    function roundSurface`);
assert.notEqual(instrumented, source);
const dom = new JSDOM('<div id="model"></div>', { runScripts: 'outside-only' }), w = dom.window, container = w.document.getElementById('model');
w.eval(fs.readFileSync('ege-profil/start/stereo-data.js', 'utf8')); w.eval(instrumented);
const tasks = w.ProfileLessons.filter(l => l.group === 'stereometry').flatMap(l => l.tasks);
const sub=(a,b)=>a.map((x,i)=>x-b[i]),add=(a,b)=>a.map((x,i)=>x+b[i]),mul=(a,k)=>a.map(x=>x*k),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function inverse(p,yaw,pitch){const c=Math.cos(yaw),s=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);return [c*p[0]+s*sp*p[1]-s*cp*p[2],cp*p[1]+sp*p[2],s*p[0]-c*sp*p[1]+c*cp*p[2]];}
function inside(p,poly,N){const axis=N.map(Math.abs).indexOf(Math.max(...N.map(Math.abs))),keep=[0,1,2].filter(i=>i!==axis);const q=keep.map(i=>p[i]),v=poly.map(a=>keep.map(i=>a[i]));let yes=false;for(let i=0,j=v.length-1;i<v.length;j=i++){const a=v[i],b=v[j];if((a[1]>q[1])!==(b[1]>q[1])&&q[0]<(b[0]-a[0])*(q[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
function polygonHit(p,V,poly){const N=cross(sub(poly[1],poly[0]),sub(poly[2],poly[0])),den=dot(N,V);if(Math.abs(den)<1e-10)return false;const t=dot(N,sub(poly[0],p))/den;return t>2e-6&&inside(add(p,mul(V,t)),poly,N);}
function roots(A,B,C){if(Math.abs(A)<1e-12)return Math.abs(B)<1e-12?[]:[-C/B];const d=B*B-4*A*C;if(d<1e-12*(B*B+Math.abs(4*A*C)))return [];const q=Math.sqrt(d);return[(-B-q)/(2*A),(-B+q)/(2*A)];}
function roundHit(p,V,b){const k=b.isCone?b.radius/b.height:0,dy=b.high-p[1];const side=(r,inner=false)=>roots(V[0]**2+V[2]**2-k*k*V[1]**2,2*(p[0]*V[0]+p[2]*V[2]+k*k*dy*V[1]),p[0]**2+p[2]**2-(b.isCone?k*k*dy*dy:r*r)).some(t=>t>2e-6&&p[1]+t*V[1]>=b.low-1e-8&&p[1]+t*V[1]<=b.high+1e-8);
 if(side(b.radius)||b.inner&&side(b.inner,true))return true;
 for(const [y,enabled] of [[b.low,b.bottom],[b.high,b.top&&!b.isCone]])if(enabled&&Math.abs(V[1])>1e-12){const t=(y-p[1])/V[1],q=add(p,mul(V,t)),r2=q[0]**2+q[2]**2;if(t>2e-6&&r2<b.radius*b.radius-1e-8&&r2>(b.inner||0)**2+1e-8)return true;}return false;
}
function oracle(p,stroke,audit){const V=[-Math.sin(audit.yaw)*Math.cos(audit.pitch),Math.sin(audit.pitch),Math.cos(audit.yaw)*Math.cos(audit.pitch)];
 // Chords explicitly declared as sampled curves represent points on a curved
 // surface. Interior radius/diameter strokes have no such declaration.
 if(stroke.surface?.body){const b=stroke.surface.body,r=(stroke.surface.radius||b.radius)*(b.isCone?(b.high-p[1])/b.height:1),m=Math.hypot(p[0],p[2]);if(m>1e-12)p=[p[0]*r/m,p[1],p[2]*r/m];}
 if(stroke.surface?.sphere){const r=stroke.surface.sphere.radius;p=mul(p,r/Math.hypot(...p));}
 for(const face of audit.surfaces){if(face.owner)continue;if(face.sphere){const center=inverse(face.sphere.center,audit.yaw,audit.pitch),q=sub(p,center);if(roots(1,2*dot(q,V),dot(q,q)-face.sphere.radius**2).some(t=>t>2e-6))return true;}else if(polygonHit(p,V,face.vertices.map(q=>inverse(q,audit.yaw,audit.pitch))))return true;}
 return audit.roundBodies.some(b=>roundHit(p,V,b));
}
let renders=0,samples=0,paths=0,partial=0;const failures=[];
function inspect(task,context,camera){delete container._profileStereoView;const dispose=w.ProfileTaskModels[task.id](container,task,context);if(camera){const saved=dispose.getBoardState();dispose.applyBoardState(w.JSON.parse(JSON.stringify({...saved,yaw:camera[0],pitch:camera[1]})));}
 const audit=w.__visibilityAudit,svg=container.querySelector('svg');assert(!/NaN|Infinity|undefined/.test(svg.innerHTML));
 const nodes=[...svg.querySelectorAll('[data-source-stroke]')];assert(nodes.length>0);paths+=nodes.length;
 for(const [index,stroke] of audit.strokes.entries()){
  const pieces=nodes.filter(n=>+n.dataset.sourceStroke===index);if(!pieces.length)continue;
  const states=new Set(pieces.map(n=>n.dataset.hidden));if(states.size>1)partial++;
  for(const n of pieces){assert.equal(n.hasAttribute('stroke-dasharray'),n.dataset.hidden==='true'||n.dataset.ghost==='true');assert(+n.dataset.partEnd>+n.dataset.partStart);}
  for(const t of [.19,.43,.71]){const part=pieces.find(n=>t>=+n.dataset.partStart-1e-9&&t<=+n.dataset.partEnd+1e-9);if(!part)continue;const p=add(stroke.p,mul(sub(stroke.q,stroke.p),t)),expected=oracle(p,stroke,audit),actual=part.dataset.hidden==='true';samples++;if(expected!==actual)failures.push({id:task.id,focus:svg.dataset.focus,yaw:audit.yaw,pitch:audit.pitch,feature:part.dataset.feature||null,index,t,expected,actual,p,from:stroke.p,to:stroke.q,surface:stroke.surface?{cap:stroke.surface.cap,body:!!stroke.surface.body,sphere:!!stroke.surface.sphere}:null});}
 }
 renders++;dispose();return {audit,svg,nodes};
}
for(const task of tasks)inspect(task,{mode:'independent',solved:false,step:0});
const representatives=[...new Map(tasks.map(t=>[t.diagram.shape+':'+(t.diagram.variant||''),t])).values()];
for(const task of representatives)for(let k=0;k<12;k++)inspect(task,{mode:'guided',step:task.steps.findIndex(s=>s.focus==='section')>=0?task.steps.findIndex(s=>s.focus==='section'):0},[-.65+k*Math.PI/6,[.14,.4,1.25][k%3]]);
// The exact cone tangent camera makes its side-ray quadratic linear; test
// that limit and both neighboring views, not only ordinary camera angles.
const tangentTask=tasks.find(t=>t.id==='stereo-cone-volume');
const tangentPitch=Math.atan(tangentTask.diagram.dimensions[1]/tangentTask.diagram.dimensions[0]);
for(const shift of [-.001,0,.001])inspect(tangentTask,{mode:'guided',step:1},[-.65,tangentPitch+shift]);
// Actual authored interior radii must remain hidden up to their endpoints.
// This catches the visible slivers produced by an inscribed polygonal cylinder.
for (const id of ['stereo-cylinder-volume','stereo-cone-volume','stereo-sphere-area','stereo-compound-cone-cylinder']) {
  const {nodes}=inspect(tasks.find(t=>t.id===id),{mode:'independent',step:0});
  const radius=nodes.filter(n=>n.dataset.feature==='radius');
  assert(radius.length>0, `${id}: radius control exists`);
  const visible=radius.reduce((sum,n)=>sum+(n.dataset.hidden==='false'?+n.dataset.partEnd-+n.dataset.partStart:0),0);
  assert(visible<1e-7, `${id}: no visible endpoint slivers (${visible})`);
}
// A copied/reversed highlighted line must have exactly the same physical gaps.
// The extra stroke exists only in this test's in-memory source instrumentation.
w.__reverseStrokeControl=true;
const control=inspect(tasks.find(t=>t.id==='stereo-cylinder-volume'),{mode:'independent',step:0});
w.__reverseStrokeControl=false;
const original=control.nodes.filter(n=>n.dataset.feature==='height'&&n.dataset.hidden==='true');
const reversed=control.nodes.filter(n=>n.dataset.reverseControl==='true'&&n.dataset.hidden==='true');
assert.equal(original.length,1);assert.equal(reversed.length,1);
const coordinates=n=>n.getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number);
function painted(n,x,y) {
  if(!n.hasAttribute('stroke-dasharray')) return true;
  const [x1,y1,x2,y2]=coordinates(n), length=Math.hypot(x2-x1,y2-y1);
  const distance=((x-x1)*(x2-x1)+(y-y1)*(y2-y1))/length;
  return ((distance+Number(n.getAttribute('stroke-dashoffset')))%10+10)%10<5;
}
let reversalSamples=0,gapSamples=0;
const [x1,y1,x2,y2]=coordinates(original[0]);
for(let i=1;i<500;i++) {
  const t=i/500,x=x1+(x2-x1)*t,y=y1+(y2-y1)*t;
  assert.equal(painted(original[0],x,y),painted(reversed[0],x,y),'reversed overlay preserves physical gaps');
  reversalSamples++;if(!painted(original[0],x,y))gapSamples++;
}
assert(gapSamples>100&&gapSamples<400);
const assertGap=()=>{
  const missing=[];
  for(let i=1;i<500;i++) {
    const t=i/500,x=x1+(x2-x1)*t,y=y1+(y2-y1)*t;
    if(!painted(original[0],x,y))missing.push(!painted(reversed[0],x,y));
  }
  assert(missing.every(Boolean),'highlight fills a hidden-line gap');
};
assertGap();
const savedDash=reversed[0].getAttribute('stroke-dasharray'), savedOffset=reversed[0].getAttribute('stroke-dashoffset');
reversed[0].removeAttribute('stroke-dasharray');
assert.throws(assertGap,/highlight fills/, 'solid-overlay negative control must fail');
reversed[0].setAttribute('stroke-dasharray',savedDash);
reversed[0].setAttribute('stroke-dashoffset',String(Number(savedOffset)+5));
assert.throws(assertGap,/highlight fills/, 'shifted-phase negative control must fail');
reversed[0].setAttribute('stroke-dashoffset',savedOffset);
assertGap();
// Repeat the actual sphere equator in reverse, then compare the rendered
// arclength pattern on every hidden chord. A per-chord phase reset fails this.
w.__reverseCurveControl=true;
const curveControl=inspect(tasks.find(t=>t.id==='stereo-sphere-area'),{mode:'independent',step:0});
w.__reverseCurveControl=false;
let curveReversalSamples=0,curveGaps=0;
const nearPoint=(a,b)=>Math.hypot(...sub(a,b))<1e-9;
for(const [index,stroke] of curveControl.audit.strokes.entries()) {
  if(!stroke.surface?.sphere||stroke.attrs.includes('data-reverse-curve'))continue;
  const reverseIndex=curveControl.audit.strokes.findIndex(s=>s.attrs.includes('data-reverse-curve')&&nearPoint(stroke.p,s.q)&&nearPoint(stroke.q,s.p));
  assert(reverseIndex>=0);
  const forwardParts=curveControl.nodes.filter(n=>+n.dataset.sourceStroke===index&&n.dataset.hidden==='true');
  const backwardParts=curveControl.nodes.filter(n=>+n.dataset.sourceStroke===reverseIndex&&n.dataset.hidden==='true');
  for(const n of forwardParts)for(let i=1;i<10;i++) {
    const [a,b,c,d]=coordinates(n),u=i/10,t=+n.dataset.partStart+(+n.dataset.partEnd-+n.dataset.partStart)*u;
    const reverse=backwardParts.find(n=>1-t>=+n.dataset.partStart-1e-8&&1-t<=+n.dataset.partEnd+1e-8);
    assert(reverse,'reverse curve preserves hidden intervals');
    const x=a+(c-a)*u,y=b+(d-b)*u;
    // SVG endpoints are rounded to .01 units. Samples within .03 of a dash
    // boundary are ambiguous at that precision; all other physical gaps match.
    const length=Math.hypot(c-a,d-b),phase=((length*u+Number(n.getAttribute('stroke-dashoffset')))%5+5)%5;
    if(Math.min(phase,5-phase)<.03)continue;
    assert.equal(painted(n,x,y),painted(reverse,x,y),'reversed sampled arc preserves physical gaps');
    curveReversalSamples++;if(!painted(n,x,y))curveGaps++;
  }
}
assert(curveReversalSamples>400&&curveGaps>100);
if(failures.length){
  console.error(JSON.stringify({renders,samples,paths,partial,failures:failures.slice(0,5),failureGroups:Object.fromEntries([...new Set(failures.map(f=>f.id))].map(id=>[id,failures.filter(f=>f.id===id).length])),failureCount:failures.length},null,2));
  process.exitCode=1;
}else console.log('PROFILE_STEREO_VISIBILITY_OK '+JSON.stringify({renders,samples,paths,partial,reversalSamples,gapSamples,negativeControls:2,coneTangentViews:3,curveReversalSamples,curveGaps,sourceSha256:crypto.createHash('sha256').update(source).digest('hex')}));
dom.window.close();
