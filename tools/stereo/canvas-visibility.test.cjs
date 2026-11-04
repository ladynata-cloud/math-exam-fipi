'use strict';
// Observe actual canvas stroke calls. A separate ray/triangle (and analytic
// sphere) oracle checks the rendered intervals; no renderer classifier is used
// to decide whether a point ought to be hidden.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const sync=require('./sync_canvas_visibility.cjs');
const root=path.resolve(__dirname,'../..');
const Viewer=require(root+'/stereo-course/assets/task-scene-viewer.js');
const Space=require(root+'/stereo-course/assets/space.js');
const {sub,dot,cross,lerp}=Space;
const stats={mounts:0,strokes:0,raySamples:0,hidden:0,visible:0,phaseComparisons:0,negativeControls:0};
const parse=x=>JSON.parse(JSON.stringify(x));
const cameraAngles=[[.65,.48],[-1.3,-.45],[0,0],[0,Math.PI/2]];
const kinds=['box','pyramid','prism','tetrahedron','frustum','octahedron','cylinder','cone','cone-frustum','sphere'];
const colors=new Set(['#dde7e1','#d29a5355','#2a587b','#537b8955','#bc7020','#a851ba']);
const expected=sync.build();
for(const file of sync.targets){
 const code=fs.readFileSync(path.join(root,file),'utf8');
 assert.equal(code,expected.output,'all canvas copies contain the exact canonical source: '+file);
 assert.equal(sync.between(code,sync.targetStart,sync.targetEnd),expected.core,'canvas fallback is the exact reviewed SVG core');
}

function hiddenByRay(point,surfaces,tolerance){
 let uncertain=false;
 for(const face of surfaces){
  if(face.sphere){
   const {center,radius}=face.sphere;let relative=sub(point,center);
   // Section-circle chords stand for explicitly requested surface arcs only.
   if(face.surface){const length=Math.hypot(...relative);assert(length>0);relative=relative.map(x=>x*radius/length);}
   const radial2=relative[0]**2+relative[1]**2;
   if(radial2>=radius*radius-1e-12*Math.max(1,radius*radius))continue; // A tangent ray covers no interval.
   const exit=-relative[2]+Math.sqrt(Math.max(0,radius*radius-radial2));
   if(exit>tolerance*32)return true;
   if(exit>tolerance/4)uncertain=true;
   continue;
  }
  // Canvas solids have convex faces; triangulation is independent of the
  // renderer's projected-polygon interval method.
  const a=face.vertices[0],direction=[0,0,1];
  for(let i=1;i<face.vertices.length-1;i++){
   const e1=sub(face.vertices[i],a),e2=sub(face.vertices[i+1],a),p=cross(direction,e2),det=dot(e1,p);
   if(Math.abs(det)<1e-12*Math.hypot(...e1)*Math.hypot(...e2))continue;
   const offset=sub(point,a),u=dot(offset,p)/det,q=cross(offset,e1),v=dot(direction,q)/det;
   if(u< -1e-9||v< -1e-9||u+v>1+1e-9)continue;
   const distance=dot(e2,q)/det;
   if(distance>tolerance*32)return true;
   if(distance>tolerance/4)uncertain=true;
  }
 }
 return uncertain?null:false;
}
const screen=(point,zoom)=>[400+point[0]*zoom,250-point[1]*zoom];
const coordinateKey=p=>p.map(x=>x.toFixed(5)).join(',');
const strokeKey=(a,b,hidden)=>coordinateKey(a)+'>'+coordinateKey(b)+'|'+hidden;
function checkPaint(calls,paint,zoom,label){
 const wanted=new Map();
 for(const {a,b,surfaces,tolerance,parts}of calls){
  assert(parts.length,label+' complete line, including visible pieces');
  let end=0;
  for(const part of parts){
   assert(Math.abs(part.start-end)<1e-8&&part.end>part.start&&part.end<=1+1e-8,label+' no interval gaps or overlap');end=part.end;
   for(const proportion of [.23,.5,.77]){
    const t=part.start+(part.end-part.start)*proportion,result=hiddenByRay(lerp(a,b,t),surfaces,tolerance);
    if(result===null)continue;
    // A single ray may hit exactly a projected vertex while its neighbours
    // miss the solid. That isolated tangency does not hide a stroke interval.
    const probe=Math.min(1e-6,(part.end-part.start)*.01);
    if(hiddenByRay(lerp(a,b,t-probe),surfaces,tolerance)!==result
        ||hiddenByRay(lerp(a,b,t+probe),surfaces,tolerance)!==result)continue;
    assert.equal(part.hidden,result,label+' ray oracle visibility '+JSON.stringify({a,b,part,t,point:lerp(a,b,t)}));stats.raySamples++;
   }
   const key=strokeKey(screen(lerp(a,b,part.start),zoom),screen(lerp(a,b,part.end),zoom),part.hidden);
   wanted.set(key,(wanted.get(key)||0)+1);
  }
  assert(Math.abs(end-1)<1e-8,label+' complete line ends at one');
 }
 let reachedVisible=false;
 for(const stroke of paint){
  assert.equal(stroke.path.length,2,label+' every classified stroke is one segment');
  const hidden=stroke.dash.length>0;assert.deepEqual(stroke.dash,hidden?[5,5]:[],label+' ordinary hidden-line pattern');
  if(hidden){assert(!reachedVisible,label+' hidden strokes precede visible boundaries');stats.hidden++;}else{reachedVisible=true;stats.visible++;}
  const key=strokeKey(stroke.path[0],stroke.path[1],hidden);
  assert(wanted.get(key)>0,label+' actual stroke has the checked geometry and visibility '+key);
  wanted.set(key,wanted.get(key)-1);stats.strokes++;
 }
 assert([...wanted.values()].every(n=>n===0),label+' every checked interval was actually stroked');
}
function phaseAgreement(paint){
 const hidden=paint.filter(p=>p.dash.length&&p.color==='#a851ba');
 for(let i=0;i<hidden.length;i++)for(let j=i+1;j<hidden.length;j++){
  const a=hidden[i],b=hidden[j],u=sub(a.path[1],a.path[0]),v=sub(b.path[1],b.path[0]);
  const length=Math.hypot(...u),otherLength=Math.hypot(...v);if(length<1e-7||otherLength<1e-7)continue;
  const cross2=(p,q)=>p[0]*q[1]-p[1]*q[0];
  if(Math.abs(cross2(u,v))>1e-7*length*otherLength||Math.abs(cross2(u,sub(b.path[0],a.path[0])))>1e-6*length)continue;
  for(const t of [.17,.37,.63,.81]){
   const point=lerp(a.path[0],a.path[1],t),distance=dot(sub(point,b.path[0]),v)/otherLength;
   if(distance<1e-6||distance>otherLength-1e-6)continue;
   const phaseA=((t*length+a.offset)%10+10)%10,phaseB=((distance+b.offset)%10+10)%10;
   if([phaseA,phaseB].some(p=>Math.min(p,Math.abs(p-5),10-p)<1e-6))continue;
   assert.equal(phaseA<5,phaseB<5,'reversed or subdivided coincident hidden lines cannot fill their gaps');stats.phaseComparisons++;
  }
 }
}
function scenario(kind,yaw,pitch,code,shared=true,mutateParts){
 const dom=new JSDOM('<div id="model"></div>',{runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 const records=[],calls=[],errors=[];let pathNow=[],dash=[];
 const context={scale(){},beginPath(){pathNow=[];},moveTo(x,y){pathNow.push([x,y]);},lineTo(x,y){pathNow.push([x,y]);},closePath(){},fill(){},fillRect(){},clearRect(){records.length=0;calls.length=0;},arc(){},strokeText(){},fillText(){},measureText(text){return {width:text.length*8};},setLineDash(value){dash=[...value];},lineDashOffset:0,
  stroke(){if(colors.has(this.strokeStyle))records.push({path:parse(pathNow),dash:parse(dash),offset:this.lineDashOffset,color:this.strokeStyle,width:this.lineWidth});}};
 w.HTMLCanvasElement.prototype.getContext=()=>context;
 w.addEventListener('error',event=>errors.push(event.message));
 w.eval(fs.readFileSync(path.join(root,'stereo-course/assets/space.js'),'utf8'));
 if(shared)w.TaskSceneViewer={visibilityParts(a,b,surfaces,tolerance){const args=parse({a,b,surfaces,tolerance}),parts=mutateParts?mutateParts(a,b,surfaces,tolerance):Viewer.visibilityParts(a,b,surfaces,tolerance);calls.push({...args,parts:parse(parts)});return parts;}};
 w.eval(code);
 const solid=Space.solid(kind,4,3,4),points=[],lines=[];
 if(kind==='sphere'){
  const top=solid.vertices.length-1,topEdge=solid.edges.findIndex(edge=>edge.includes(top)),edge=solid.edges[topEdge];
  points.push({id:'M',kind:'edge',edge:0,t:solid.edges[0][0]===0?0:1},{id:'N',kind:'edge',edge:topEdge,t:edge[0]===top?0:1});lines.push({a:'M',b:'N'});
 }else{
  for(const [a,b]of solid.edges)if(solid.names[a]&&solid.names[b])lines.push({a:solid.names[a],b:solid.names[b]},{a:solid.names[b],b:solid.names[a]});
  if(kind==='box')lines.push({a:'A',b:'C₁'},{a:'C₁',b:'A'});
 }
 const saved={kind,a:4,b:3,h:4,yaw,pitch,zoom:62,level:.5,tilt:23,turn:41,points,lines,showSection:true,showPlane:true};
 const before=JSON.stringify(saved),changes=[];
 const api=w.SpaceViewer.mount(w.document.getElementById('model'),{kind,saved},value=>changes.push(value));
 assert.equal(JSON.stringify(saved),before,'drawing does not mutate supplied saved work');assert.equal(changes.length,0,'drawing does not write learner progress');
 const label=kind+' camera '+yaw+','+pitch;
 if(shared){assert(calls.length>22,label+' body/construction strokes use geometric classification');checkPaint(calls,records,api.state.zoom,label);phaseAgreement(records);
  if(kind==='sphere'){
   assert.equal(calls.filter(c=>c.surfaces.some(s=>s.surface)).length,api.section.length,'only section circle strokes use arc semantics');
   assert(records.some(r=>r.color==='#a851ba'&&r.dash.length),'a diameter construction remains hidden inside the sphere');
  }
 }
 const result=parse(records),state=JSON.stringify(api.state);api.redraw();assert.equal(JSON.stringify(api.state),state,'redrawing retains camera and construction state');assert.equal(changes.length,0);
 assert.deepEqual(parse(records),result,'redrawing is deterministic');assert.deepEqual(errors,[]);
 api.destroy();w.close();stats.mounts++;return result;
}
for(const kind of kinds)for(const [yaw,pitch]of cameraAngles){
 const shared=scenario(kind,yaw,pitch,expected.output,true);
 const offline=scenario(kind,yaw,pitch,expected.output,false);
 assert.deepEqual(offline,shared,'offline fallback renders exactly the same geometry and dash phases');
}
for(const file of sync.targets.slice(1))scenario('box',.65,.48,fs.readFileSync(path.join(root,file),'utf8'),false);
for(const hidden of [false,true]){
 assert.throws(()=>scenario('box',.65,.48,expected.output,true,()=>[{start:0,end:1,hidden}]),/ray oracle visibility/);stats.negativeControls++;
}
assert.throws(()=>scenario('sphere',.65,.48,expected.output,true,(a,b,surfaces,tolerance)=>Viewer.visibilityParts(a,b,surfaces.map(s=>({...s,surface:true})),tolerance)),/ray oracle visibility/);stats.negativeControls++;
assert(stats.raySamples>10000&&stats.hidden>100&&stats.visible>100&&stats.phaseComparisons>100,'substantial independent coverage');
console.log('CANVAS_VISIBILITY_OK '+JSON.stringify(stats));
