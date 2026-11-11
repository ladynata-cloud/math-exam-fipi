"use strict";
// Independent focused review by the geometry workstream; no browser claims.
const fs=require("fs"),path=require("path"),crypto=require("crypto"),assert=require("assert/strict");
const file=path.join(__dirname,"expansion-functions.json");
const d=JSON.parse(fs.readFileSync(file,"utf8"));
const all=d.topics.flatMap(t=>[...t.quick,...t.creative]),map=Object.fromEntries(all.map(t=>[t.id,t]));
const {checkTask,evaluate}=require("./engine.js"),{witness}=require("./task-input.js");
let checks=0;
const test=(c,m)=>{checks++;assert(c,m);};
const close=(a,b)=>Math.abs(a-b)<1e-10;
const build=v=>({values:Object.fromEntries(Object.entries(v).map(([k,x])=>[k,String(x)]))});
for(const t of all)test(checkTask(t,witness(t)).ok,"supplied example "+t.id);
const direct={
  "exp-n10-return-entry":(2/5)**2,
  "exp-n10-return-exit":4*3/(5*4),
  "exp-n10-frequency-entry":24/40,
  "exp-n10-frequency-exit":1/2,
  "exp-n11-tariff-entry":150+25*(5-3),
  "exp-n11-tariff-exit":180+20*(7.5-4),
  "exp-n12-units-entry":48*15/60,
  "exp-n12-units-exit":60*18/60,
  "exp-n12-secrets-entry":2*3*5/(3+5),
  "exp-n12-secrets-exit":2*6*9/(6+9),
  "exp-n13-redundant-entry":Math.min(...Array.from({length:21},(_,i)=>i-10).filter(x=>x>=-1&&x>-3&&x<4)),
  "exp-n13-redundant-exit":Math.max(...Array.from({length:21},(_,i)=>i-10).filter(x=>2*x-4>=0&&-3*x>-18&&x>=0)),
  "exp-n14-diary-entry":[-2,3,8,13][3],
  "exp-n14-diary-exit":[7,11,15,19,23,27][5],
  "exp-n14-pairs-entry":[2,6,10,14,18,22].reduce((a,b)=>a+b),
  "exp-n14-pairs-exit":[3,5,7,9,11,13,15,17].reduce((a,b)=>a+b)
};
for(const [id,answer]of Object.entries(direct))test(close(map[id].answer,answer),"independent ordinary "+id);

// Labelled balls distinguish probability of both draws from the conditional second draw.
const returnTask=map["exp-n10-return-creative"],balls=["r1","r2","r3","b"];
let bothBack=0,bothAway=0,totalBack=0,totalAway=0;
for(const a of balls)for(const b of balls){
  totalBack++;if(a[0]==="r"&&b[0]==="r")bothBack++;
  if(a!==b){totalAway++;if(a[0]==="r"&&b[0]==="r")bothAway++;}
}
test(checkTask(returnTask,build({redBack:3,redAway:2,pBack:bothBack/totalBack,pAway:bothAway/totalAway})).ok,"enumerated urn outcomes");
test(!checkTask(returnTask,build({redBack:3,redAway:2,pBack:3/4,pAway:2/3})).ok,"conditional values do not replace joint probability");

const probe=map["exp-n11-probe-creative"];
for(const x of [0,1,2]){
  const ys=probe.models.map(m=>evaluate(m.expression,{x}));
  test((ys[0]!==ys[1])===(x===1),"distinguishing argument "+x);
}
for(const probes of [[0],[2],[0,2]]){
  let blocked=false;try{checkTask(probe,{probes,modelId:"quadratic"});}catch(_){blocked=true;}
  test(blocked,"uninformative probes do not certify a formula");
}
test(checkTask(probe,{probes:[1],modelId:"quadratic"}).ok,"informative probe and matching formula");
test(!checkTask(probe,{probes:[1],modelId:"linear"}).ok,"wrong formula after informative probe");

const tariff=map["exp-n11-tariff-creative"];
test(checkTask(tariff,build({k:30,b:60})).ok,"tariff coefficients");
test(!checkTask(tariff,build({k:30,b:120})).ok,"included kilometres not charged twice");
for(const x of [0,1.5,2,2.5,5,7]){
  const segments=tariff.visual.segments.filter(s=>(x>s.from||(x===s.from&&s.leftClosed))&&(x<s.to||(x===s.to&&s.rightClosed)));
  test(segments.length===1,"exactly one tariff branch at "+x);
  test(close(evaluate(segments[0].expression,{x,k:30,b:60}),120+30*Math.max(0,x-2)),"tariff value at "+x);
}

const F=(a,b)=>2*a*b/(a+b);
for(const [a,b,c,e]of [[1,9,5,5],[3,1,6,2],[5,1,6,2]])test(!close(F(a,b),F(c,e)),"insufficient-data counterexample");
test(close(F(3,7),4.2),"realizable sum and product data");

const redundant=map["exp-n13-redundant-creative"];
for(const a of [-1,0,0.5,2,2.01,5])for(const b of [0,2,5,5.000001,6.5,10]){
  const wanted=a>=0&&a<=2&&b>5&&b<=10;
  test(checkTask(redundant,build({omit:2,withoutFirst:a,withoutThird:b})).ok===wanted,"boundary and fractional witnesses "+a+","+b);
}

// Interpret the actual stored solution labels, then compare with the four original systems.
const systems=[x=>x>=3&&x<=3,x=>x>3&&x<=3,x=>x>=3&&x<3,x=>x>3&&x<=4];
function containsLabel(label,x){
  if(label==="Пустое множество")return false;
  const singleton=label.match(/^Только точка ([−\-\d.,]+)$/);
  if(singleton)return x===Number(singleton[1].replace("−","-").replace(",","."));
  const interval=label.match(/^Промежуток ([[(])([−\-\d.,]+); ([−\-\d.,]+)([)\]])$/);
  assert(interval,"unknown solution label "+label);
  const left=Number(interval[2].replace("−","-").replace(",",".")),right=Number(interval[3].replace("−","-").replace(",","."));
  return (x>left||(x===left&&interval[1]==="["))&&(x<right||(x===right&&interval[4]==="]"));
}
const strict=map["exp-n13-strict-creative"];
for(const x of [-100,2.999999,3,3.000001,3.5,4,4.000001,100])strict.pairs.forEach((p,i)=>{
  test(containsLabel(p.right,x)===systems[i](x),"stored solution set matches original system "+i+" at "+x);
});

const pairs=map["exp-n14-pairs-creative"];
test(checkTask(pairs,build({pairs:3,pairSum:20,middle:10,total:[1,4,7,10,13,16,19].reduce((a,b)=>a+b)})).ok,"odd series sum by direct addition");
let halfPairRejected=false;
try{halfPairRejected=!checkTask(pairs,build({pairs:3.5,pairSum:20,middle:0,total:70})).ok;}catch(_){halfPairRejected=true;}
test(halfPairRejected,"noninteger number of disjoint pairs rejected");

const report={status:"PASS",checks,sourceSha256:crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex"),scope:"Independent focused review: enumerated urn outcomes, ordinary answers, probe discrimination, tariff boundary and fractional distances, sufficient-data counterexamples, inequality witnesses and solution labels, odd sequence sums."};
fs.writeFileSync(path.join(__dirname,"QA_REVIEW_EXPANSION_FUNCTIONS.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report,null,2));
