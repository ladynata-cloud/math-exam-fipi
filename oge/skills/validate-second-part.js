"use strict";
// Independent mathematics and contract checks for the second-part skill maps.
// No browser is launched, no report file is written, and no full proof is scored.
const fs = require("fs");
const path = require("path");
const assert = require("assert/strict");
const crypto = require("crypto");
const {checkTask, evaluate} = require("./engine.js");
const {witness} = require("./task-input.js");
const files = ["topics-second-part.json", "expansion-second-part.json"];
const topics = JSON.parse(fs.readFileSync(path.join(__dirname, files[0]), "utf8"));
const expansion = JSON.parse(fs.readFileSync(path.join(__dirname, files[1]), "utf8"));
const ordinary = topics.flatMap(t => t.quick).concat(expansion.topics.flatMap(t => t.quick));
const creative = expansion.topics.flatMap(t => t.creative);
const cards = ordinary.concat(creative);
const index = Object.fromEntries(cards.map(t => [t.id, t]));
let checks = 0;
function verify(value, message) { checks++; assert(value, message); }
function near(a, b, message) {
  verify(Number.isFinite(a) && Number.isFinite(b) && Math.abs(a-b) < 1e-9*Math.max(1, Math.abs(a), Math.abs(b)), message);
}
function succeeds(id, input) { try { return checkTask(index[id], input).ok; } catch (_) { return false; } }
function accepts(id, input, message) { verify(succeeds(id, input), message || "accept " + id); }
function rejects(id, input, message) { verify(!succeeds(id, input), message || "reject " + id); }
function build(values) { return {values:Object.fromEntries(Object.entries(values).map(([k,v]) => [k,String(v)]))}; }
function number(id, expected) {
  near(index[id].answer, expected, "independently derived key " + id);
  accepts(id, {answer:String(expected)}, "derived numeric answer " + id);
}
function flags(id, expected) {
  assert.deepEqual(index[id].options.map(o => o.correct), expected, "independent logical key " + id); checks++;
  accepts(id, {selected:expected.flatMap((value,i) => value ? [i] : [])}, "derived choices " + id);
}
function numeric(text) { return Number(text.replace(/−/g, "-").replace(/,/g, ".")); }
function length(a,b) { return Math.hypot(a[0]-b[0], a[1]-b[1]); }
function sub(a,b) { return [a[0]-b[0],a[1]-b[1]]; }
function dot(a,b) { return a[0]*b[0]+a[1]*b[1]; }
function cross(a,b) { return a[0]*b[1]-a[1]*b[0]; }
function area(points) { return Math.abs(points.reduce((sum,a,i) => sum + cross(a,points[(i+1)%points.length]),0))/2; }
function midpoint(a,b) { return [(a[0]+b[0])/2,(a[1]+b[1])/2]; }
function pointMap(id) { const v=index[id].visual;return Object.fromEntries(v.labels.map((l,i)=>[l,v.points[i]])); }
function angle(a,b,c) {
  const u=sub(a,b),v=sub(c,b);
  return Math.acos(Math.max(-1,Math.min(1,dot(u,v)/(length(a,b)*length(c,b)))));
}
function pointLineDistance(p,a,b) { return Math.abs(cross(sub(b,a),sub(p,a)))/length(a,b); }
function containsInterval(label,x) {
  label=label.replace(/−/g,"-").trim();
  if(label.includes("∪"))return label.split("∪").some(part=>containsInterval(part,x));
  if(label.startsWith("x < "))return x<numeric(label.slice(4));
  if(label.startsWith("x ≠ "))return x!==numeric(label.slice(4));
  const m=label.match(/^([[(])\s*(-?∞|[-\d.]+);\s*(\+?∞|[-\d.]+)\s*([\])])$/);
  assert(m,"recognized interval " + label);
  const lo=m[2]==="-∞"?-Infinity:Number(m[2]),hi=m[3].includes("∞")?Infinity:Number(m[3]);
  return (x>lo||(m[1]==="["&&x===lo))&&(x<hi||(m[4]==="]"&&x===hi));
}

// Data shape, links, finite routes, and honest assessment scope.
verify(topics.length===6 && expansion.topics.length===6,"six second-part topics");
verify(topics.map(t=>t.id).join(",")==="n20,n21,n22,n23,n24,n25","canonical task numbering");
verify(expansion.version===1,"expansion version");
verify(ordinary.length===36 && creative.length===24,"36 ordinary and 24 creative tasks");
verify(cards.length===new Set(cards.map(t=>t.id)).size,"unique task ids");
verify(topics.reduce((n,t)=>n+t.skills.length,0)===42,"42 skills");
verify(expansion.routes.length===12,"twelve routes");
const knownSkills=new Set();
for(const name of fs.readdirSync(__dirname).filter(n=>/^topics-.*\.json$/.test(n))) {
  const data=JSON.parse(fs.readFileSync(path.join(__dirname,name),"utf8"));
  for(const topic of data)for(const skill of topic.skills)knownSkills.add(skill.id);
}
for(const t of topics){
  const extra=expansion.topics.find(e=>e.topicId===t.id);
  verify(t.quick.length===4 && t.creative.length===0,"four-task initial overview " + t.id);
  verify(extra && extra.quick.length===2 && extra.creative.length===4,"optional expansion " + t.id);
  verify(t.assessment==="written-steps","only individual steps assessed " + t.id);
  verify(typeof t.writtenWorkNote==="string"&&t.writtenWorkNote.includes("отдельно"),"separate written-work note " + t.id);
  verify(/^\/trainers\/[a-z0-9-]+\.html$/.test(t.sourceHref),"local canonical trainer link " + t.id);
  verify(fs.existsSync(path.join(__dirname,"../..",t.sourceHref.slice(1))),"trainer file exists " + t.id);
  for(const skill of t.skills){
    verify(skill.label.length>5 && skill.evidence.length>20,"meaningful skill evidence " + skill.id);
    verify(skill.requires.every(id=>knownSkills.has(id)),"known prerequisites " + skill.id);
    const associated=cards.filter(q=>q.skillId===skill.id || (skill.relatedTasks||[]).includes(q.id));
    verify(associated.length>0 || skill.separateCheck===false,"skill has real tasks " + skill.id);
    verify((skill.relatedTasks||[]).every(id=>index[id]),"valid explicit task links " + skill.id);
    if(skill.id.endsWith("-written"))verify(skill.separateCheck===false,"full written work not auto-certified " + skill.id);
  }
}
for(const route of expansion.routes){
  verify(route.steps.length===3,"finite three-step route " + route.id);
  assert.deepEqual(route.steps.map(s=>s.optional),[false,true,false],"only workshop optional " + route.id);checks++;
  verify(route.steps.every(s=>index[s.taskId]),"existing route tasks " + route.id);
  verify(route.steps.every(s=>s.taskId.startsWith(route.topicId+"-")),"route stays in its topic " + route.id);
  verify(ordinary.includes(index[route.steps[0].taskId])&&ordinary.includes(index[route.steps[2].taskId]),"ordinary entry and exit " + route.id);
  verify(creative.includes(index[route.steps[1].taskId]),"optional step is workshop " + route.id);
}
for(const t of cards){
  for(const key of ["title","prompt","hint","explanation","skillId"])
    verify(typeof t[key]==="string"&&t[key].length>0,"required " + key + " " + t.id);
  verify(knownSkills.has(t.skillId),"primary skill exists " + t.id);
  verify(!/\b(?:masteredProof|examScore)\b/.test(JSON.stringify(t)),"no proof mastery or exam score field " + t.id);
  accepts(t.id,witness(t),"engine accepts supplied example " + t.id);
  if(t.type==="number")rejects(t.id,{answer:String(t.answer+0.375)},"wrong numeric answer " + t.id);
  if(t.type==="choice"||t.type==="multi"){
    const yes=t.options.flatMap((o,i)=>o.correct?[i]:[]),no=t.options.findIndex(o=>!o.correct);
    verify(yes.length>0&&no>=0,"nontrivial choice " + t.id);
    if(t.type==="choice")verify(yes.length===1,"one correct choice " + t.id);
    rejects(t.id,{selected:[no]},"wrong selection " + t.id);
    if(t.type==="multi"){
      rejects(t.id,{selected:yes.concat(no)},"extra false selection " + t.id);
      rejects(t.id,{selected:yes.slice(1)},"missing true selection " + t.id);
    }
  }
  if(t.type==="match"){
    const correct=witness(t);
    for(let i=0;i<t.pairs.length;i++){
      const different=t.pairs.find(p=>p.right!==t.pairs[i].right).right;
      rejects(t.id,{matches:{...correct.matches,[i]:different}},"wrong reason or value " + t.id + " " + i);
    }
  }
  if(t.type==="order"){
    verify(new Set(t.items).size===t.items.length,"distinct order items " + t.id);
    assert.deepEqual([...t.items].sort(),[...t.answer].sort(),"order is a permutation " + t.id);checks++;
    rejects(t.id,{order:[...t.answer].reverse()},"reverse dependency order " + t.id);
    for(let i=0;i<t.answer.length-1;i++){
      const order=t.answer.slice();[order[i],order[i+1]]=[order[i+1],order[i]];
      rejects(t.id,{order},"adjacent dependency reversed " + t.id + " " + i);
    }
  }
  if(t.type==="build"){
    rejects(t.id,{values:{}},"empty constructor " + t.id);
    for(const f of t.fields)rejects(t.id,build({...t.exampleSolution,[f.name]:t.exampleSolution[f.name]+1}),"one inconsistent field " + t.id + " " + f.name);
  }
  if(t.visual?.kind==="polygon"){
    const v=t.visual;
    verify(v.points.length===v.labels.length,"labels fit points " + t.id);
    verify(v.points.every(p=>p.length===2&&p.every(Number.isFinite)),"finite geometry " + t.id);
    if(v.bounds){
      const b=v.bounds;
      verify(b.xMin<b.xMax&&b.yMin<b.yMax,"ordered drawing bounds " + t.id);
      for(const p of v.points)verify(p[0]>=b.xMin&&p[0]<=b.xMax&&p[1]>=b.yMin&&p[1]<=b.yMax,"point visible " + t.id);
      for(const c of v.circles||[])verify(c.radius>0&&c.center[0]-c.radius>=b.xMin&&c.center[0]+c.radius<=b.xMax&&c.center[1]-c.radius>=b.yMin&&c.center[1]+c.radius<=b.yMax,"full circle visible " + t.id);
    }
  }
}

// №20: original equations, their domains, all roots, and full solution sets.
for(const [id,a] of [["n20-q-domain",3],["n20-x-domain",5]]){
  const roots=[-a,a].filter(x=>x!==a&&(x*x-a*a)/(x-a)===0);
  verify(roots.length===1,"one admissible rational-equation root " + id);number(id,roots[0]);
  rejects(id,{answer:String(a)},"zero denominator is not a root " + id);
}
for(const [id,polynomial] of [["n20-q-factors",x=>x*(x-4)],["n20-x-factors",x=>x*(x+2)*(x-5)]])
  flags(id,index[id].options.map(o=>polynomial(numeric(o.text))===0));
const signSamples=[-100,-3.00001,-3,-2,-1,0,0.99999,1,1.00001,100];
flags("n20-q-signs",index["n20-q-signs"].options.map(o=>signSamples.every(x=>containsInterval(o.text,x)===((x-1)*(x+3)<=0))));
flags("n20-q-system",index["n20-q-system"].options.map(o=>{const [x,y]=o.text.slice(1,-1).split(";").map(numeric);return x+y===7&&x*y===12;}));
for(let p=-10;p<=10;p++)for(let q=-10;q<=10;q++)
  verify(succeeds("n20-c-polynomial",build({p,q}))===((-2)**2+p*(-2)+q===0&&3**2+p*3+q===0),"both roots of constructed quadratic " + p + "," + q);
for(const x of [-10,-4,-1,-1e-12,0,1e-12,1,4,10])
  verify(succeeds("n20-c-lost-zero",{answer:String(x)})===(x*(x-4)===0&&x-4!==0),"lost-root certificate " + x);
const rationalOrder=index["n20-c-domain-order"].answer;
verify(rationalOrder[0].includes("x ≠ 4")&&rationalOrder[1].includes("С учётом этого ограничения")&&rationalOrder[2].includes("x = −4")&&rationalOrder[3].includes("−4 ≠ 4"),"order explicitly depends on preceding rational-equation steps");
near(((-4)**2-16)/(-4-4),0,"ordered rational-equation root satisfies original denominator");
const inequalityRules=[x=>(x-1)*(x+3)<=0,x=>x!==-3&&(x-1)/(x+3)<=0,x=>-2*x>6,x=>(x-1)**2>0];
index["n20-c-boundaries"].pairs.forEach((p,i)=>{
  for(const x of signSamples)verify(containsInterval(p.right,x)===inequalityRules[i](x),"matched full inequality solution " + i + " at " + x);
});

// №21: independently form rates, masses, travel times and contextual restrictions.
for(const [id,distance,delta] of [["n21-q-movement",60,5],["n21-x-movement",84,7]]){
  const slow=(-delta+Math.sqrt(delta*delta+4*distance*delta))/2;
  near(distance/slow-distance/(slow+delta),1,"derived travel-time difference " + id);
  flags(id,index[id].options.map(o=>{
    const [left,right]=o.text.split("=");return Math.abs(evaluate(left,{x:slow})-evaluate(right,{x:slow}))<1e-10;
  }));
}
number("n21-q-work",1/(1/4+1/6));
number("n21-q-mixture",(2*10+3*20)/(2+3));
number("n21-x-mixture",(4*5+6*20)/(4+6));
rejects("n21-q-mixture",{answer:"15"},"unweighted mean of concentrations rejected");
flags("n21-q-context",[true,false,false,false]);
for(const v of [0,1,2,2.0001,3,10])verify((v>2)===(v-2>0),"upstream positive speed domain " + v);
const table=index["n21-c-table"].pairs;
for(const x of [10,15,20,37]){
  const values=[x+5,60/x,60/(x+5),60/x-60/(x+5)];
  table.forEach((p,i)=>near(evaluate(p.right,{x}),values[i],"independent movement-table quantity " + i));
}
for(let slow=5;slow<=30;slow++)for(let fast=5;fast<=35;fast++){
  const expected=fast-slow===5&&Math.abs(60/slow-60/fast-1)<1e-12;
  verify(succeeds("n21-c-speeds",build({slow,fast}))===expected,"all allowed integer speed pairs " + slow + "," + fast);
}
for(let ai=0;ai<=40;ai++)for(let bi=0;bi<=40;bi++){
  const low=ai/4,high=bi/4,total=low+high,salt=low*0.1+high*0.25;
  const expected=total===10&&Math.abs(salt-1.9)<1e-12;
  verify(succeeds("n21-c-mixture",build({low,high}))===expected,"conservation of mass and salt " + low + "," + high);
}
const t1=60/30,t2=60/60,average=(60+60)/(t1+t2);
accepts("n21-c-average",build({t1,t2,v:average}),"average speed from complete journey");
rejects("n21-c-average",build({t1,t2,v:(30+60)/2}),"arithmetic mean is not journey average");
rejects("n21-c-average",build({t1:1,t2:1,v:60}),"invented equal durations rejected even if total equation fits");

// №22: domains survive cancellation; endpoint membership and root multiplicities.
function activeSegments(v,x){return v.segments.filter(s=>(x>s.from||(x===s.from&&s.leftClosed))&&(x<s.to||(x===s.to&&s.rightClosed)));}
for(const [id,excluded,slope,intercept] of [["n22-q-hole",2,1,2],["n22-c-hole-repair",1,1,1],["n22-x-hole",-3,1,-3]]){
  const v=index[id].visual;
  verify(activeSegments(v,excluded).length===0,"hole really excluded " + id);
  for(const x of [excluded-1,excluded-1e-6,excluded+1e-6,excluded+1]){
    const active=activeSegments(v,x);verify(active.length===1,"one function branch off hole " + id);
    near(evaluate(active[0].expression,{x}),slope*x+intercept,"drawn reduced expression " + id);
  }
}
number("n22-q-hole",4-2===2?0:1);
number("n22-x-hole",0+3!==-3?1:0);
flags("n22-c-hole-repair",[true,false,true,true,false]);
const parabola=index["n22-q-vertex"].visual,vertexX=-parabola.b/(2*parabola.a);
verify(parabola.a>0,"upward parabola has a minimum");near(vertexX,1,"parabola vertex argument");
number("n22-q-vertex",parabola.c-parabola.b*parabola.b/(4*parabola.a));
number("n22-q-boundary",0*0-1);
for(const x of [-0.01,0,0.01]){
  const active=activeSegments(index["n22-q-boundary"].visual,x);
  verify(active.length===1,"piecewise graph has one value at boundary " + x);
  near(evaluate(active[0].expression,{x}),x<0?x+2:x*x-1,"correct side of piecewise boundary " + x);
}
function absoluteRoots(a,m){
  if(m<0)return [];
  const values=[];
  for(const square of [a+m,a-m])if(square>=0){const r=Math.sqrt(square);values.push(r,-r);}
  return [...new Set(values.map(x=>Number(x.toPrecision(13))))];
}
number("n22-q-intersections",absoluteRoots(4,0).length);
number("n22-x-intersections",absoluteRoots(9,9).length);
for(let m=1;m<=8;m++){
  const a=Math.sqrt(Math.max(0,4-m)),b=Math.sqrt(4+m),expected=absoluteRoots(4,m).length===4;
  verify(succeeds("n22-c-parameter",build({m,a,b}))===expected,"all offered horizontal levels m=" + m);
  if(expected){
    const roots=absoluteRoots(4,m);verify(roots.length===4,"four distinct roots " + m);
    roots.forEach(x=>near(Math.abs(x*x-4),m,"root on horizontal line " + m));
    rejects("n22-c-parameter",build({m,a:b,b:a}),"positive roots must be ordered " + m);
  }
}
rejects("n22-c-parameter",build({m:4,a:0,b:Math.sqrt(8)}),"coalesced zero is not two roots");
rejects("n22-c-parameter",build({m:4,a:0.00001,b:Math.sqrt(8)}),"explicit m < 4 blocks a tiny false positive near the double root");
rejects("n22-c-parameter",build({m:1.5,a:Math.sqrt(2.5),b:Math.sqrt(5.5)}),"requested m is integer");
const line=index["n22-c-line"],[[x1,y1],[x2,y2]]=line.points,k=(y2-y1)/(x2-x1),b=y1-k*x1;
near(line.k,k,"slope derived from both points");near(line.b,b,"intercept derived from a point");
accepts(line.id,{k,b},"derived line coefficients");rejects(line.id,{k:k+0.5,b},"one wrong line coefficient");
const model=index["n22-c-model"];
for(const point of model.known)for(const candidate of model.models)near(evaluate(candidate.expression,{x:point.x}),point.y,"both models fit known point");
for(const x of model.probeValues){
  const differs=Math.abs(x*x-4)!==x*x-4;verify(differs===(x===0),"only interior negative expression distinguishes modulus " + x);
  const input={probes:[x],modelId:"absolute"};
  if(differs)accepts(model.id,input,"informative function query");else rejects(model.id,input,"uninformative query cannot certify formula");
}
rejects(model.id,{probes:[0],modelId:"quadratic"},"wrong formula after informative query");

// №23: coordinate-derived lengths, areas, perpendicularity and similarity.
for(const [id,a,b] of [["n23-q-height",6,8],["n23-c-area",5,12],["n23-x-height",9,12]]){
  const p=pointMap(id),S=area([p.A,p.B,p.C]),c=length(p.A,p.B),h=length(p.C,p.H);
  near(length(p.A,p.C),a,"first drawn cathetus " + id);near(length(p.B,p.C),b,"second drawn cathetus " + id);
  near(dot(sub(p.A,p.C),sub(p.B,p.C)),0,"actual right angle at C " + id);
  near(dot(sub(p.C,p.H),sub(p.B,p.A)),0,"actual perpendicular height " + id);
  near(S,a*b/2,"independent coordinate area " + id);near(h,2*S/c,"height by two area formulas " + id);
  if(id==="n23-c-area"){
    accepts(id,build({S,h}),"coordinate-derived area and height");
    rejects(id,build({S,h:Math.round(h)}),"premature rounding of height rejected");
  }else number(id,h);
}
const sim=pointMap("n23-q-similarity"),scale=length(sim.A,sim.D)/length(sim.A,sim.B);
near(length(sim.A,sim.D),4,"given AD");near(length(sim.A,sim.B),10,"given AB");near(length(sim.B,sim.C),15,"given BC");
near(cross(sub(sim.E,sim.D),sub(sim.C,sim.B)),0,"DE genuinely parallel to BC");
near(length(sim.A,sim.E)/length(sim.A,sim.C),scale,"equal corresponding side ratios");
number("n23-q-similarity",length(sim.D,sim.E));
for(const id of ["n23-q-chord","n23-c-chord","n23-x-chord"]){
  const p=pointMap(id),circle=index[id].visual.circles[0],half=length(p.A,p.M),whole=length(p.A,p.B);
  near(length(p.O,p.A),circle.radius,"endpoint on circle " + id);near(length(p.O,p.B),circle.radius,"other endpoint on circle " + id);
  midpoint(p.A,p.B).forEach((value,i)=>near(value,p.M[i],"perpendicular meets chord midpoint " + id));
  near(dot(sub(p.O,p.M),sub(p.B,p.A)),0,"distance to chord perpendicular " + id);
  near(whole,2*half,"full chord twice half " + id);
  if(id==="n23-c-chord"){
    accepts(id,build({a:half,c:whole}),"independently calculated half and full chord");
    rejects(id,build({a:half,c:half}),"half chord cannot be submitted as full chord");
  }else number(id,whole);
}
const tangent=pointMap("n23-q-tangent");
near(length(tangent.O,tangent.T),5,"tangent radius");near(length(tangent.O,tangent.A),13,"external point distance");
near(dot(sub(tangent.O,tangent.T),sub(tangent.A,tangent.T)),0,"radius perpendicular to actual tangent");
number("n23-q-tangent",length(tangent.A,tangent.T));
flags("n23-c-conditions",[true,true,false,false]);
// Independent counterexamples with A=(0,0), B=(6,0), C=(0,8).
verify(3===3&&3/6!==3/8,"AD = AE alone does not fix corresponding ratios");
verify(6-2===8-4&&2/6!==4/8,"BD = CE alone does not fix corresponding ratios");
let triangles=0;
for(let a=1;a<=10;a++)for(let b=1;b<=10;b++){
  const expected=Math.hypot(a,b)===10&&a*b/2===24;
  verify(succeeds("n23-c-triangle",build({a,b}))===expected,"both triangle conditions " + a + "," + b);
  if(expected)triangles++;
}
verify(triangles===2,"both and only swapped cathetus pairs accepted");

// №24: logical grounds and genuine counterexamples; this is not proof grading.
flags("n24-q-congruence",[true,false,false,false]);
flags("n24-q-given",[true,false,false,false]);
for(const id of ["n24-q-congruence","n24-c-proof-order"]){
  const p=pointMap(id);
  near(length(p.A,p.B),length(p.A,p.C),"given equal sides " + id);
  near(length(p.B,p.D),length(p.C,p.D),"midpoint equality " + id);
  near(angle(p.B,p.D,p.A),angle(p.C,p.D,p.A),"corresponding angles after SSS " + id);
  near(angle(p.B,p.D,p.A)+angle(p.C,p.D,p.A),Math.PI,"adjacent angles form straight angle " + id);
}
const proof=index["n24-c-proof-order"].answer;
verify(proof[0].includes("середина")&&proof[1].includes("Используем это равенство")&&proof[2].includes("Из равенства этих треугольников")&&proof[3].includes("Равные смежные углы"),"explicitly dependent proof chain, not arbitrary ordering");
for(const id of ["n24-q-parallel","n24-x-parallel"]){
  const p=pointMap(id);
  flags(id,index[id].options.map(o=>{
    const letters=[...o.text.matchAll(/∠([A-Z]{3})/g)].map(m=>m[1]);
    verify(letters.length===2,"two named angles " + id);
    const values=letters.map(s=>angle(p[s[0]],p[s[1]],p[s[2]]));return Math.abs(values[0]-values[1])<1e-10;
  }));
  if(id==="n24-q-parallel")near(cross(sub(p.B,p.A),sub(p.D,p.C)),0,"AB parallel CD");
  else near(cross(sub(p.D,p.A),sub(p.C,p.B)),0,"AD parallel BC");
}
const circle=pointMap("n24-q-circle");
for(const p of Object.values(circle))near(length([0,0],p),5,"four proof points on one circle");
near(angle(circle.A,circle.C,circle.B),angle(circle.A,circle.D,circle.B),"same arc gives equal inscribed angles");
const oppositeArc=[5/Math.sqrt(2),5/Math.sqrt(2)];
verify(Math.abs(angle(circle.A,oppositeArc,circle.B)-angle(circle.A,circle.C,circle.B))>0.1,"opposite-arc vertex is a counterexample without same-arc condition");
flags("n24-q-circle",[true,false,false,false]);
const reasons=["Противоположные стороны параллелограмма равны.","Накрест лежащие углы при AB ∥ CD и секущей AC.","Общая сторона.","По двум сторонам и углу между ними.","Соответствующие углы равных треугольников."];
assert.deepEqual(index["n24-c-reasons"].pairs.map(p=>p.right),reasons,"complete SAS justification chain");checks++;
const pg=pointMap("n24-c-reasons");
near(length(pg.A,pg.B),length(pg.C,pg.D),"SAS first side");
near(angle(pg.B,pg.A,pg.C),angle(pg.D,pg.C,pg.A),"SAS included angle");
near(angle(pg.B,pg.C,pg.A),angle(pg.D,pg.A,pg.C),"resulting corresponding angle");
flags("n24-c-conditions",[true,true,false,false]);
near(length([1,0],[0,Math.sqrt(24)]),5,"DE equals half of BC in insufficient-condition example");
verify(1/6!==Math.sqrt(24)/8,"half third side alone does not force similarity");
verify(3/6!==3/8,"equal short sides alone do not force similarity");
for(const k of [2,3,4]){
  const a=3*k,b=4*k,c=Math.hypot(a,b),S=a*b/2;
  accepts("n24-c-counterexample",build({k,c,S}),"scaled triangle is a real counterexample " + k);
  near((a*a+c*c-b*b)/(2*a*c),(3*3+5*5-4*4)/(2*3*5),"corresponding angle preserved by scaling");
  verify(c!==5,"scaled triangles not congruent");
  rejects("n24-c-counterexample",build({k,c,S:6*k}),"area is not scaled linearly");
}
rejects("n24-c-counterexample",build({k:1,c:5,S:6}),"unchanged triangle does not refute congruence");
const kite=pointMap("n24-x-congruence");
near(length(kite.A,kite.B),length(kite.A,kite.D),"kite first equal side pair");
near(length(kite.C,kite.B),length(kite.C,kite.D),"kite second equal side pair");
near(angle(kite.B,kite.A,kite.C),angle(kite.C,kite.A,kite.D),"kite conclusion follows from SSS");
flags("n24-x-congruence",[true,false,false,false]);

// №25: all drawings satisfy their metric conditions; auxiliary construction verified.
const bisector=pointMap("n25-q-bisector"),AB=length(bisector.A,bisector.B),AC=length(bisector.A,bisector.C),BC=length(bisector.B,bisector.C);
near(AB,13,"bisector triangle AB");near(AC,15,"bisector triangle AC");near(BC,14,"bisector triangle BC");
near(length(bisector.B,bisector.D)/length(bisector.D,bisector.C),AB/AC,"bisector side ratio");
near(angle(bisector.B,bisector.A,bisector.D),angle(bisector.D,bisector.A,bisector.C),"AD really bisects the angle");
number("n25-q-bisector",BC*AB/(AB+AC));
for(const id of ["n25-q-inradius","n25-c-incircle","n25-x-inradius"]){
  const p=pointMap(id),verts=[p.A,p.B,p.C],S=area(verts),semi=(length(p.A,p.B)+length(p.B,p.C)+length(p.C,p.A))/2;
  const circle=index[id].visual.circles[0],r=S/semi;
  near(circle.radius,r,"incircle radius independently derived from sides and area " + id);
  for(let i=0;i<3;i++)near(pointLineDistance(circle.center,verts[i],verts[(i+1)%3]),r,"circle tangent to side " + id + " " + i);
  const orientations=verts.map((a,i)=>cross(sub(verts[(i+1)%3],a),sub(circle.center,a)));
  verify(orientations.every(x=>x>0)||orientations.every(x=>x<0),"incircle center inside triangle " + id);
  if(id==="n25-c-incircle"){
    accepts(id,build({S,p:semi,r}),"coordinate-derived incircle construction");
    rejects(id,build({S,p:2*semi,r:r/2}),"perimeter cannot replace semiperimeter even if product stays S");
  }else number(id,r);
}
for(const [id,bottom,top] of [["n25-q-height",18,8],["n25-c-trapezoid",16,6],["n25-x-trapezoid",20,10]]){
  const p=pointMap(id),d=(bottom-top)/2,h=pointLineDistance(p.B,p.A,p.D),S=area([p.A,p.B,p.C,p.D]);
  near(length(p.A,p.D),bottom,"larger trapezoid base " + id);near(length(p.B,p.C),top,"smaller trapezoid base " + id);
  near(length(p.A,p.B),13,"first equal trapezoid leg " + id);near(length(p.C,p.D),13,"second equal trapezoid leg " + id);
  near(cross(sub(p.D,p.A),sub(p.C,p.B)),0,"trapezoid bases parallel " + id);
  near(h,Math.sqrt(13*13-d*d),"height from actual leg and projection " + id);
  near(S,(bottom+top)*h/2,"coordinate trapezoid area " + id);
  for(const segment of index[id].visual.segments)near(dot(sub(segment.to,segment.from),sub(p.D,p.A)),0,"auxiliary segment really perpendicular " + id);
  if(id==="n25-c-trapezoid"){
    accepts(id,build({d,h,S}),"consistent trapezoid construction");
    rejects(id,build({d:bottom-top,h,S}),"full base difference is not one projection");
  }else number(id,id==="n25-q-height"?h:S);
}
number("n25-q-scale",12*(3/2)**2);
const vx=(13*13-15*15+14*14)/(2*14),vh=Math.sqrt(13*13-vx*vx),vS=14*vh/2;
accepts("n25-c-vertex",build({x:vx,h:vh,S:vS}),"independent intersection of two circles gives vertex");
let vertices=0;
for(let x=0;x<=14;x++)for(let h=1;h<=15;h++){
  const expected=Math.abs(Math.hypot(x,h)-13)<1e-12&&Math.abs(Math.hypot(x-14,h)-15)<1e-12;
  verify(succeeds("n25-c-vertex",build({x,h,S:7*h}))===expected,"all offered integer vertices " + x + "," + h);
  if(expected)vertices++;
}
verify(vertices===1,"unique vertex above the base");
rejects("n25-c-vertex",build({x:5,h:-12,S:84}),"mirror point below base violates h > 0");
const dynamic=index["n25-c-vertex"].visual;
verify(dynamic.dynamic.kind==="vertex"&&dynamic.dynamic.index===0&&dynamic.dynamic.x==="x"&&dynamic.dynamic.y==="h","dynamic vertex uses both requested coordinates");
for(const x of [0,14])for(const h of [1,15])verify(x>=dynamic.bounds.xMin&&x<=dynamic.bounds.xMax&&h>=dynamic.bounds.yMin&&h<=dynamic.bounds.yMax,"all extreme candidate vertices visible");
for(const k of [2,3,4]){
  const a=3*k,b=4*k,c=5*k,S=a*b/2,p=(a+b+c)/2,r=S/p;
  accepts("n25-c-scale",build({k,S,r}),"scaled area and inradius from actual sides " + k);
  rejects("n25-c-scale",build({k,S:6*k,r}),"area cannot scale like length " + k);
  rejects("n25-c-scale",build({k,S,r:k*k}),"radius cannot scale like area " + k);
}

console.log(JSON.stringify({status:"PASS",checks,topics:topics.length,skills:42,ordinary:ordinary.length,creative:creative.length,routes:expansion.routes.length,
  sources:Object.fromEntries(files.map(file=>[file,crypto.createHash("sha256").update(fs.readFileSync(path.join(__dirname,file))).digest("hex")])),
  scope:"Independent equations and domains, complete selected solution sets, conservation models, graph endpoint membership and intersection counts, coordinate geometry, sufficient-condition counterexamples, construction alternatives and rejection of bad answers. Individual learning steps only; no real-browser layout or full-proof assessment claims."
},null,2));
