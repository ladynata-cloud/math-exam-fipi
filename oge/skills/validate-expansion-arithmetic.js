"use strict";

// Independent mathematical checks for the eight arithmetic/algebra expansions.
// No browser or DOM claims are made by this script.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const {checkTask} = require("./engine.js");
const {witness} = require("./task-input.js");
const file = path.join(__dirname, "expansion-arithmetic.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));
let checks = 0;
const verify = (condition, message) => { assert.ok(condition, message); checks++; };
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); checks++; };
const tasks = data.topics.flatMap(t => [...t.quick, ...t.creative]);
const byId = new Map(tasks.map(t => [t.id, t]));
const task = suffix => { const t = byId.get("exp-" + suffix); assert.ok(t, suffix); return t; };
function accepted(t, input) { try { return checkTask(t, input).ok; } catch (_) { return false; } }
function values(v) { return {values:Object.fromEntries(Object.entries(v).map(([k,n]) => [k,String(n)]))}; }
function gcd(a,b) { while (b) [a,b] = [b,a % b]; return Math.abs(a); }
function rational(n,d) { const g = gcd(n,d); return [n / g,d / g]; }
function sumFractions(a,b,c,d) { return rational(a*d+b*c,b*d); }
function decimal(s) { return Number(String(s).replace(/−/g,"-").replace(",",".")); }

equal(data.version,1,"schema version");
equal(data.topics.map(t=>t.topicId),["n6","n7","n8","n9"],"topic order");
equal(tasks.length,24,"24 new cards");
equal(data.routes.length,8,"8 finite routes");
equal(new Set(tasks.map(t=>t.id)).size,24,"unique card identities");
equal(data.topics.reduce((n,t)=>n+t.skills.length,0),5,"five precise additional skills");
const oldTopics = ["topics-arithmetic.json","topics-functions.json","topics-geometry.json"]
  .flatMap(name=>JSON.parse(fs.readFileSync(path.join(__dirname,name),"utf8")));
const knownSkills = new Set([...oldTopics.flatMap(t=>t.skills),...data.topics.flatMap(t=>t.skills)].map(s=>s.id));
for (const t of tasks) {
  verify(knownSkills.has(t.skillId),t.id+" resolves its skill");
  verify(accepted(t,witness(t)),t.id+" accepts its witness");
  for(const v of t.alternativeSolutions||[]) verify(accepted(t,values(v)),t.id+" accepts stated alternative");
}
for(const t of data.topics) for(const s of t.skills) for(const r of s.requires) verify(knownSkills.has(r),s.id+" prerequisite "+r);
for (const r of data.routes) {
  equal(r.steps.length,3,r.id+" has exactly three steps");
  equal(r.steps.map(s=>s.optional),[false,true,false],r.id+" only workshop optional");
  equal(r.steps.map(s=>byId.get(s.taskId).learningMode),["quick","creative","quick"],r.id+" modes");
  verify(new Set(r.steps.map(s=>byId.get(s.taskId).skillId)).size===1,r.id+" keeps one learning goal");
  verify(r.steps.every(s=>byId.get(s.taskId).originAtlasId===r.originAtlasId),r.id+" atlas relationship");
}

// №6. Exact rational calculation distinguishes both coinciding wrong answers.
equal(sumFractions(3,2,2,3),[13,6],"sum is 13/6, not 1");
equal((3+2)/(2+3),1,"first invalid operation produces 1");
equal((3*2)/(2*3),1,"second invalid operation also produces 1");
equal(task("n6-errors-workshop").options.map(o=>o.correct),[true,true,false,false,true,false],"separate errors and true result");
verify(!accepted(task("n6-errors-workshop"),{selected:[0,4]}),"omitting the second error is incomplete");
verify(!accepted(task("n6-errors-workshop"),{selected:[0,1,2,4]}),"agreement does not certify methods");
const sums = [["n6-errors-entry",5,3,1,2],["n6-errors-exit",5,2,2,5]];
for (const [id,a,b,c,d] of sums) {
  const [n,k]=sumFractions(a,b,c,d);
  equal(task(id).answer,n/k,id+" exact rational reference");
  verify(accepted(task(id),{answer:n+"/"+k}),id+" accepts an exact fraction");
}
equal(task("n6-structure-entry").answer,4*(37+63)/10,"entry common factor");
equal(task("n6-structure-exit").answer,175*(48+52)/100,"exit common factor");
for(let hidden=0;hidden<=400;hidden++) equal(hidden*25+(400-hidden)*25,10000,"hidden parts preserve 10000 hundredths "+hidden);
const common=task("n6-structure-workshop");
verify(accepted(common,values({factor:"1/4",whole:400,result:100})),"equivalent factor representation");
verify(!accepted(common,values({factor:0.25,whole:400,result:100.25})),"sum result must agree");
verify(!accepted(common,values({factor:400,whole:0.25,result:100})),"field meanings are retained");

// №7. Derive the scale from the two fixed labels, independently of task.answer.
for (const id of ["n7-calibration-entry","n7-calibration-workshop","n7-calibration-exit"]) {
  const t=task(id),anchors=t.visual.ticks.filter(x=>x.label!==null);
  equal(anchors.length,2,id+" has exactly two original numerical labels");
  const [u,v]=anchors,step=(decimal(v.label)-decimal(u.label))/(v.position-u.position);
  const first=decimal(u.label)-u.position*step;
  verify(step>0,id+" increases rightwards");
  if(t.type==="number") {
    const requested=id.endsWith("entry")?3:5;
    equal(t.answer,first+requested*step,id+" coordinate reference");
  } else {
    equal([first,step],[-5,3],"reconstructed origin and step");
    equal(rational(2,step),[2,3],"zero lies two-thirds after second tick");
    verify(accepted(t,values({first,step,zero:"2/3"})),"exact zero position accepted");
    verify(!accepted(t,values({first,step:1,zero:1})),"unit-tick assumption rejected");
    verify(!accepted(t,values({first,step,zero:0})),"zero is not on second tick");
    verify(!accepted(t,values({first,step,zero:1})),"zero is not on third tick");
  }
}
equal(task("n7-bound-entry").options.map(o=>o.correct),[true,false,false,false],"sqrt10 below 3.2");
verify(10*100<32*32,"exact squares certify first comparison");
equal(task("n7-bound-exit").options.map(o=>o.correct),[false,false,true,false],"sqrt30 above 5.4");
verify(30*100>54*54,"exact squares certify exit comparison");
const bound=task("n7-bound-workshop");
for(let hundredths=0;hundredths<=500;hundredths++) {
  const b=hundredths/100,square=hundredths*hundredths/10000;
  const expected=hundredths>0&&hundredths<=450&&hundredths*hundredths>200000;
  equal(accepted(bound,values({b,square})),expected,"all hundredth upper-bound candidates "+hundredths);
}
verify(!accepted(bound,values({b:4.5,square:20})),"wrong square cannot certify strict inequality");
verify(!accepted(bound,values({b:4.47213595,square:20.00000001})),"claimed rounded square cannot turn a lower bound into an upper bound");
verify(!accepted(bound,values({b:-4.5,square:20.25})),"negative bound is not admissible");
verify(accepted(bound,values({b:"9/2",square:"81/4"})),"rational certificate accepted");

// №8. Area conservation is checked geometrically; algebra uses coefficient identities.
function polygonArea(points) {
  return Math.abs(points.reduce((n,[x,y],i)=>{const [u,v]=points[(i+1)%points.length];return n+x*v-y*u;},0))/2;
}
const cut=task("n8-cut-workshop");
equal(polygonArea(cut.visual.points),17*17-13*13,"drawn L area equals difference of squares");
equal(polygonArea(cut.visual.points),17*4+13*4,"same area as two uncut strips");
equal(cut.visual.segments[0].from,[0,4],"cut starts on left boundary");
equal(cut.visual.segments[0].to,[4,4],"cut ends at inner corner");
const divisors=Array.from({length:120},(_,i)=>i+1).filter(n=>120%n===0);
for(const width of divisors) {
  const height=120/width;
  equal(accepted(cut,values({width,height,area:120})),width===4||width===30,"area alone does not suffice "+width+" by "+height);
}
verify(!accepted(cut,values({width:30,height:4,area:136})),"area must match assembled rectangle");
verify(!accepted(cut,values({width:-4,height:-30,area:120})),"sides positive");
equal(task("n8-cut-entry").answer,(36-34)*(36+34),"difference squares entry");
equal(task("n8-cut-exit").answer,(51-49)*(51+49)/2,"difference squares exit");
equal([1,-2*3,3*3],[1,-6,9],"symbolic coefficients of (x-3)^2");
equal([1,-2*5,5*5],[1,-10,25],"symbolic coefficients of (x-5)^2");
for(let twice=-80;twice<=80;twice++) {
  const x=twice/2;
  equal(x*x-6*x+9,(x-3)**2,"expanded and squared forms agree "+x);
  verify((x-3)**2>=0,"nonnegative sample "+x);
}
equal(task("n8-square-entry").answer,(13-5)**2,"square entry value");
equal(task("n8-square-exit").answer,(37-3)**2,"square exit value");
equal([(2-3)**2,(4-3)**2],[1,1],"symmetric arguments");
equal(task("n8-square-workshop").pairs.map(p=>p.right),["Только при x = 3.","Оба значения равны 1.","Нет: квадрат любого действительного числа неотрицателен."],"three derived conclusions");

// №9. Check the actual grouped quantities and classify independently by coefficients.
equal(task("n9-story-entry").answer,40/4-3,"entry group count");
equal(task("n9-story-exit").answer,65/5-4,"exit group count");
equal(3*(5+2),21,"creative story has integral witness");
verify(!Number.isInteger((21-2)/3),"alternative whole-group addition incompatible with equal integer packs");
equal(task("n9-story-workshop").pairs.map(p=>p.right),["Синие жетоны в одном наборе.","Число одинаковых наборов.","Белые жетоны в каждом наборе.","Все жетоны во всех наборах."],"variable and constants retain units");
function classify(a,b,c,d) { return a===c ? (b===d ? "all" : "none") : (d-b)/(a-c); }
equal([classify(4,-8,4,-8),classify(4,-8,4,-7),classify(4,-8,5,-3)],["all","none",-5],"entry equation classes");
equal([classify(3,6,3,6),classify(3,6,3,4),classify(3,6,5,-8)],["all","none",7],"exit equation classes");
const kinds=task("n9-solutions-workshop");
for(let c=-12;c<=12;c++) for(let a=-5;a<=5;a++) {
  const candidate={b:6,c,a,r:a===2?0:1/(2-a)};
  const expected=classify(2,6,2,c)==="none"&&typeof classify(2,6,a,7)==="number";
  equal(accepted(kinds,values(candidate)),expected,"all integer constructor parameters c="+c+", a="+a);
  if(expected) verify(!accepted(kinds,values({...candidate,r:candidate.r+1})),"wrong root rejected c="+c+", a="+a);
}
verify(!accepted(kinds,values({b:0,c:7,a:3,r:-1})),"identity is not x=0");
verify(!accepted(kinds,values({b:6,c:6,a:3,r:-1})),"identity cannot fill no-solution slot");
verify(!accepted(kinds,values({b:6,c:7,a:2,r:0})),"equal coefficients with different constants cannot give one root");
verify(accepted(kinds,values({b:6,c:7,a:5,r:"-1/3"})),"fractional root retained");

console.log(JSON.stringify({status:"PASS",checks,topics:4,newSkills:5,ordinaryCards:16,workshops:8,routes:8,
  scope:"Independent mathematics and answer-validation checks; no browser layout or pupil efficacy claim."},null,2));
