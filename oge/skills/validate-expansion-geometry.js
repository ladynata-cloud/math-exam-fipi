"use strict";
// Independent geometric calculations for the extension; this does not draw a browser page.
const fs = require("fs");
const path = require("path");
const assert = require("assert/strict");
const crypto = require("crypto");
const {checkTask} = require("./engine.js");
const {witness} = require("./task-input.js");
const file = path.join(__dirname, "expansion-geometry.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const cards = data.topics.flatMap(t => [...t.quick, ...t.creative]);
const index = Object.fromEntries(cards.map(t => [t.id, t]));
let checks = 0;
function verify(value, label) { checks++; assert(value, label); }
function near(a,b,label) { verify(Number.isFinite(a) && Number.isFinite(b) && Math.abs(a-b)<1e-9*Math.max(1,Math.abs(a),Math.abs(b)),label); }
function length(a,b) { return Math.hypot(a[0]-b[0],a[1]-b[1]); }
function signedDoubleArea(p) { return p.reduce((sum,a,i)=>{const b=p[(i+1)%p.length];return sum+a[0]*b[1]-a[1]*b[0];},0); }
function area(p) { return Math.abs(signedDoubleArea(p))/2; }
function dot(a,b) { return a[0]*b[0]+a[1]*b[1]; }
function sub(a,b) { return [a[0]-b[0],a[1]-b[1]]; }
function midpoint(a,b) { return [(a[0]+b[0])/2,(a[1]+b[1])/2]; }
function circumcenter([a,b,c]) {
  const d=2*(a[0]*(b[1]-c[1])+b[0]*(c[1]-a[1])+c[0]*(a[1]-b[1]));
  verify(Math.abs(d)>1e-10,"three non-collinear circle points");
  const aa=dot(a,a),bb=dot(b,b),cc=dot(c,c);
  return [(aa*(b[1]-c[1])+bb*(c[1]-a[1])+cc*(a[1]-b[1]))/d,
    (aa*(c[0]-b[0])+bb*(a[0]-c[0])+cc*(b[0]-a[0]))/d];
}
function pointMap(task) { return Object.fromEntries(task.visual.labels.map((l,i)=>[l,task.visual.points[i]])); }
function buildInput(values) { return {values:Object.fromEntries(Object.entries(values).map(([k,v])=>[k,String(v)]))}; }
function accepts(id,input,label) { verify(checkTask(index[id],input).ok,label||id); }
function rejects(id,input,label) { let accepted=false;try{accepted=checkTask(index[id],input).ok;}catch(_){} verify(!accepted,label||id); }
function numberAnswer(id,expected) { near(index[id].answer,expected,`independent answer ${id}`);accepts(id,{answer:String(expected)}); }

verify(data.version===1,"schema version");
verify(data.topics.length===5,"five topics");
verify(cards.length===30,"thirty cards");
verify(data.topics.every(t=>t.quick.length===4&&t.creative.length===2),"four ordinary and two creative per topic");
verify(data.routes.length===10,"ten finite routes");
verify(new Set(cards.map(t=>t.id)).size===30,"unique ids");
const seenOrigins=new Set();
for(const topic of data.topics){
  for(const t of [...topic.quick,...topic.creative]){
    verify(t.id.startsWith("exp-"+topic.topicId+"-"),`task namespace ${t.id}`);
    for(const key of ["title","prompt","hint","explanation","skillId","originAtlasId"])
      verify(typeof t[key]==="string"&&t[key].length>0,`required ${key} ${t.id}`);
    accepts(t.id,witness(t),`engine accepts supplied valid example ${t.id}`);
    if(t.type==="number")rejects(t.id,{answer:String(t.answer+0.75)},`wrong numeric answer ${t.id}`);
    if(t.type==="build")rejects(t.id,{values:{}},`empty constructor ${t.id}`);
    if(t.visual){
      verify(t.visual.points.every(p=>p.length===2&&p.every(Number.isFinite)),`finite drawing ${t.id}`);
      verify(t.visual.points.length===t.visual.labels.length,`point labels ${t.id}`);
      for(const circle of t.visual.circles||[])verify(circle.radius>0&&Number.isFinite(circle.radius),`positive radius ${t.id}`);
      if(t.visual.bounds){
        const b=t.visual.bounds;
        verify(b.xMin<b.xMax&&b.yMin<b.yMax,`fixed finite bounds ${t.id}`);
        for(const p of t.visual.points)verify(p[0]>=b.xMin&&p[0]<=b.xMax&&p[1]>=b.yMin&&p[1]<=b.yMax,`given point in bounds ${t.id}`);
        for(const c of t.visual.circles||[]){
          verify(c.center[0]-c.radius>=b.xMin&&c.center[0]+c.radius<=b.xMax&&c.center[1]-c.radius>=b.yMin&&c.center[1]+c.radius<=b.yMax,`circle in bounds ${t.id}`);
        }
      }
    }
  }
}
for(const r of data.routes){
  verify(r.steps.length===3,"route has three steps "+r.id);
  verify(!r.steps[0].optional&&r.steps[1].optional&&!r.steps[2].optional,"only workshop optional "+r.id);
  verify(r.steps.every(s=>index[s.taskId]),"route references existing tasks "+r.id);
  const ts=r.steps.map(s=>index[s.taskId]);
  verify(ts.every(t=>t.originAtlasId===r.originAtlasId),"route provenance "+r.id);
  verify(ts.every(t=>t.skillId===ts[0].skillId),"same narrow primary goal "+r.id);
  seenOrigins.add(r.originAtlasId);
}
verify([...seenOrigins].sort().join(",")==="15.1,15.2,16.1,16.2,17.1,17.2,18.1,18.2,19.1,19.2","complete atlas geometry coverage");

// 15.1: exact coordinate areas and ratios; no reuse of stored answer formula.
for(const [id,total,ratio] of [["exp-n15-area-entry",60,2/3],["exp-n15-area-creative",48,1/3],["exp-n15-area-exit",75,3/2]]){
  const t=index[id],p=pointMap(t),left=area([p.A,p.B,p.D]),right=area([p.A,p.D,p.C]);
  near(area([p.A,p.B,p.C]),total,"full triangle area "+id);
  near(left+right,total,"partition exhausts triangle "+id);
  near(left/right,ratio,"area ratio "+id);
  near(length(p.B,p.D)/length(p.D,p.C),ratio,"base ratio "+id);
  if(id.endsWith("entry"))numberAnswer(id,left);
  if(id.endsWith("exit"))numberAnswer(id,right);
  if(t.type==="build"){
    accepts(id,buildInput({p:left,q:right}),"coordinate-derived partition accepted");
    rejects(id,buildInput({p:right,q:left}),"reversed area ratio rejected");
    rejects(id,buildInput({p:24,q:24}),"equal halves do not match 1 to 3");
    rejects(id,buildInput({p:12,q:12}),"partial total rejected");
  }
}

// 15.2: side lengths of the drawn triangles, converse, and every allowed new d.
for(const [id,expected] of [["exp-n15-right-entry",[13,5,12]],["exp-n15-right-exit",[25,7,24]]]){
  const p=pointMap(index[id]);
  [length(p.A,p.B),length(p.B,p.C),length(p.C,p.A)].forEach((v,i)=>near(v,expected[i],"drawn side "+id));
  near(dot(sub(p.A,p.C),sub(p.B,p.C)),0,"right angle at C "+id);
}
verify(index["exp-n15-right-entry"].options.filter(o=>o.correct)[0].text==="C","correct right-angle vertex");
numberAnswer("exp-n15-right-exit",90);
for(let c=8;c<=14;c++)for(let d=8;d<=14;d++){
  const should=c===Math.hypot(6,8)&&d>8&&d<14&&d*d!==6*6+8*8;
  let actual=false;try{actual=checkTask(index["exp-n15-right-creative"],buildInput({c,d})).ok;}catch(_){}
  verify(actual===should,`all integer side pairs c=${c}, d=${d}`);
}
rejects("exp-n15-right-creative",buildInput({c:10,d:11.5}),"integer d required");

// 16.1: determinant-based circle center and radius, and display bounds for every range extreme.
const centerEntry=index["exp-n16-center-entry"];
numberAnswer(centerEntry.id,midpoint(...centerEntry.visual.points)[0]);
const circleTask=index["exp-n16-center-creative"],center=circumcenter(circleTask.visual.points),radius=length(center,circleTask.visual.points[0]);
circleTask.visual.points.forEach(p=>near(length(center,p),radius,"equal radius to every point"));
accepts(circleTask.id,buildInput({ox:center[0],oy:center[1],r:radius}),"determinant center accepted");
for(let ox=1;ox<=5;ox++)for(let oy=2;oy<=6;oy++)for(let r=3;r<=6;r++){
  const equal=circleTask.visual.points.every(p=>Math.abs(length([ox,oy],p)-r)<1e-9);
  verify(checkTask(circleTask,buildInput({ox,oy,r})).ok===equal,`center candidate ${ox},${oy},${r}`);
  const b=circleTask.visual.bounds;
  verify(ox-r>=b.xMin&&ox+r<=b.xMax&&oy-r>=b.yMin&&oy+r<=b.yMax,"candidate circle contained in fixed bounds");
}
rejects(circleTask.id,buildInput({ox:3,oy:4,r:-5}),"negative radius rejected");
numberAnswer("exp-n16-center-exit",circumcenter(index["exp-n16-center-exit"].visual.points)[1]);

// 16.2: independent tangent lengths and exact perpendicular distances to the drawn circle.
for(const id of ["exp-n16-tangents-entry","exp-n16-tangents-creative","exp-n16-tangents-exit"]){
  const t=index[id],p=pointMap(t),circle=t.visual.circles[0],ab=length(p.A,p.B),ac=length(p.A,p.C),bc=length(p.B,p.C),s=(ab+ac+bc)/2;
  const expected={x:s-bc,y:s-ac,z:s-ab};
  near(length(p.A,p.F),expected.x,"AF from sides "+id);near(length(p.A,p.E),expected.x,"AE from sides "+id);
  near(length(p.B,p.F),expected.y,"BF from sides "+id);near(length(p.B,p.D),expected.y,"BD from sides "+id);
  near(length(p.C,p.E),expected.z,"CE from sides "+id);near(length(p.C,p.D),expected.z,"CD from sides "+id);
  near(area([p.A,p.B,p.C])/s,circle.radius,"inradius from area "+id);
  for(const [point,a,b] of [[p.F,p.A,p.B],[p.D,p.B,p.C],[p.E,p.A,p.C]]){
    near(area([point,a,b]),0,"tangency point lies on side "+id);
    near(length(circle.center,point),circle.radius,"radius to contact point "+id);
    near(dot(sub(circle.center,point),sub(b,a)),0,"radius perpendicular to tangent "+id);
  }
  if(t.type==="build"){
    accepts(id,buildInput(expected),"side-derived three tangent lengths accepted");
    rejects(id,buildInput({x:6,y:7,z:8}),"misassigned tangent lengths rejected");
    rejects(id,buildInput({x:0,y:13,z:15}),"one vertex zero does not satisfy all sides");
  }else numberAnswer(id,id.endsWith("entry")?expected.x:expected.y);
}

// 17.1: vector completion and shared midpoint; supplied order matters.
for(const id of ["exp-n17-vertex-entry","exp-n17-vertex-creative","exp-n17-vertex-exit"]){
  const t=index[id],[a,b,c]=t.visual.points,d=[a[0]+c[0]-b[0],a[1]+c[1]-b[1]];
  midpoint(a,c).forEach((v,i)=>near(v,midpoint(b,d)[i],"coincident diagonal midpoint "+id));
  verify(area([a,b,c,d])>0,"nondegenerate parallelogram "+id);
  if(t.type==="build"){
    accepts(id,buildInput({dx:d[0],dy:d[1]}),"vector completion accepted");
    rejects(id,buildInput({dx:a[0]+b[0]-c[0],dy:a[1]+b[1]-c[1]}),"wrong vertex order rejected");
    rejects(id,buildInput({dx:d[0]+1,dy:d[1]}),"only one correct coordinate insufficient");
  }else numberAnswer(id,d[id.endsWith("entry")?0:1]);
}

// 17.2: shoelace and an actual half-turn establish two congruent trapezoids.
for(const id of ["exp-n17-trapezoid-entry","exp-n17-trapezoid-exit"])numberAnswer(id,area(index[id].visual.points));
const tr=index["exp-n17-trapezoid-creative"],p=pointMap(tr),rotationCenter=midpoint(p.B,p.C);
function halfTurn(a) { return [2*rotationCenter[0]-a[0],2*rotationCenter[1]-a[1]]; }
for(const [from,to] of [["A","F"],["B","C"],["C","B"],["D","E"]])halfTurn(p[from]).forEach((x,i)=>near(x,p[to][i],"half turn maps "+from+" to "+to));
near(area([p.A,p.B,p.C,p.D]),21,"first trapezoid area");
near(area([p.B,p.E,p.F,p.C]),21,"second trapezoid area");
near(area([p.A,p.E,p.F,p.D]),42,"combined parallelogram area");
near(length(p.A,p.E),length(p.A,p.B)+length(p.C,p.D),"sum of bases");
verify(tr.answer[0].startsWith("Две одинаковые")&&tr.answer[3].includes("42 ÷ 2 = 21"),"proof starts with construction and ends with half-area");
rejects(tr.id,{order:[...tr.answer].reverse()},"reverse dependency order rejected");

// 18.1: independent oriented areas and disjoint outer triangles.
for(const id of ["exp-n18-complement-entry","exp-n18-complement-exit"])numberAnswer(id,area(index[id].visual.points));
const comp=index["exp-n18-complement-creative"],q=pointMap(comp),bottomRight=[6,1],topRight=[6,5],topLeft=[1,5];
const pieces={bottom:area([q.A,bottomRight,q.B]),right:area([q.B,topRight,q.C]),left:area([q.C,topLeft,q.A]),area:area([q.A,q.B,q.C])};
near(Object.values(pieces).reduce((a,b)=>a+b,0),20,"parts exactly fill rectangle");
accepts(comp.id,buildInput(pieces),"shoelace-derived complementary areas accepted");
rejects(comp.id,buildInput({...pieces,area:20}),"outer rectangle is not inner area");
rejects(comp.id,buildInput({...pieces,bottom:pieces.right,right:pieces.bottom}),"named exterior parts are distinguished");
rejects(comp.id,buildInput({...pieces,left:8,area:5}),"wrong part plus compensated total rejected");

// 18.2: enumerate all integer P in the allowed rectangle; exactly two one-turn paths.
for(const id of ["exp-n18-distance-entry","exp-n18-distance-exit"])numberAnswer(id,length(...index[id].visual.points));
const pathId="exp-n18-distance-creative";let acceptedCorners=0;
for(let px=0;px<=3;px++)for(let py=0;py<=4;py++){
  const A=[0,0],P=[px,py],B=[3,4];
  const firstHorizontal=A[1]===P[1]&&A[0]!==P[0],firstVertical=A[0]===P[0]&&A[1]!==P[1];
  const secondHorizontal=P[1]===B[1]&&P[0]!==B[0],secondVertical=P[0]===B[0]&&P[1]!==B[1];
  const wanted=(firstHorizontal&&secondVertical)||(firstVertical&&secondHorizontal);
  const actual=checkTask(index[pathId],buildInput({px,py,direct:5,path:7})).ok;
  verify(actual===wanted,`one-turn grid path P(${px},${py})`);
  if(actual){acceptedCorners++;near(length(A,P)+length(P,B),7,"one-turn path length");}
}
verify(acceptedCorners===2,"both and only valid corners accepted");
rejects(pathId,buildInput({px:0,py:4,direct:7,path:5}),"distance and path cannot be interchanged");

// 19.1: theorem choices and explicit counterexamples to both insufficient additions.
const angle=40*Math.PI/180,third=(a,b)=>Math.sqrt(a*a+b*b-2*a*b*Math.cos(angle));
const triangleA=[2,3,third(2,3)],triangleB=[2,4,third(2,4)];
near(triangleA[0],triangleB[0],"counterexample preserves AB = DE");
verify(triangleA[0]/triangleB[0]!==triangleA[1]/triangleB[1],"equal side plus equal included angle does not force similarity");
const perA=triangleA.reduce((a,b)=>a+b),perB=triangleB.reduce((a,b)=>a+b),scaledB=triangleB.map(x=>x*perA/perB);
near(perA,scaledB.reduce((a,b)=>a+b),"equal-perimeter counterexample");
verify(Math.abs(triangleA[0]/scaledB[0]-triangleA[1]/scaledB[1])>1e-3,"equal perimeter and one angle do not force similarity");
const supplement=index["exp-n19-condition-creative"];
verify(supplement.options.map(o=>o.correct).join(",")==="true,true,false,false","AA and included-angle proportional-sides conditions");
// Positive cases: two equal angles fix the third; SAS scaling preserves included angle and all sides.
near(180-40-65,75,"third angle in AA witness");
const scale=2.75,scaledA=[2*scale,3*scale,third(2*scale,3*scale)];
triangleA.forEach((side,i)=>near(scaledA[i]/side,scale,"SAS yields corresponding-side ratios"));
accepts(supplement.id,{selected:[0,1]},"all sufficient conditions accepted");
rejects(supplement.id,{selected:[0]},"omitted sufficient condition rejected");
rejects(supplement.id,{selected:[0,1,2]},"insufficient added condition rejected");

// 19.2: exact circle drawings and both directions, including different-radius counterexamples.
const converse=index["exp-n19-converse-creative"],cpts=pointMap(converse);
for(const [O,A,B,r] of [[cpts.O,cpts.A,cpts.B,2],[cpts.P,cpts.C,cpts.D,5]]){
  near(length(O,A),r,"circle radius to first endpoint");near(length(O,B),r,"circle radius to second endpoint");
  near(dot(sub(A,O),sub(B,O))/(r*r),0.5,"central angle is 60 degrees");
  near(length(A,B),r,"60-degree chord equals radius");
}
verify(length(cpts.A,cpts.B)!==length(cpts.C,cpts.D),"equal angles at different radii have unequal chords");
function chord(r,degrees){return 2*r*Math.sin(degrees*Math.PI/360);}
near(chord(2,60),chord(Math.sqrt(2),90),"equal chords may have unequal central angles");
for(const r of [1,2,5,11])for(const angleDeg of [10,30,60,90,150,180]){
  const c=chord(r,angleDeg),restored=2*Math.asin(Math.min(1,c/(2*r)))*180/Math.PI;
  near(restored,angleDeg,"chord and minor central angle invert at fixed radius");
}
verify(converse.pairs.map(p=>p.right).join(",")==="Верно,Верно,Неверно,Неверно","truth values of both implications with and without common radius");

const report={status:"PASS",checks,topics:data.topics.length,ordinary:20,creative:10,routes:10,newSkills:data.topics.reduce((s,t)=>s+t.skills.length,0),
  sourceSha256:crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex"),
  scope:"Independent coordinate geometry, tangent lengths, circumcenters, construction alternatives, theorem counterexamples, data structure and engine acceptance. No real-browser layout or student effectiveness claims."};
fs.writeFileSync(path.join(__dirname,"QA_EXPANSION_GEOMETRY.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report,null,2));
