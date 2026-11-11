"use strict";

// Independent review gate: notation is a separate, optional activity.
// Real task data and current application source are used. DOM emulation is not
// browser layout QA and does not navigate to or fetch any external resource.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const format=require("./exam-format.js");
const {evaluate}=require("./engine.js");
const {createHarness,STORAGE_PROGRESS}=require("./dom-harness.js");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"course-data.json"),"utf8"));
const sourceNames=["series-arithmetic.js","series-equations.js","series-functions.js","series-exam-bridges.js",
  "series-foundation-bridges.js","series-runtime.js","exam-format.js","engine.js"];
const sources=Object.fromEntries(sourceNames.map(name=>[name,fs.readFileSync(path.join(__dirname,name),"utf8")]));
const sha=s=>crypto.createHash("sha256").update(s).digest("hex");
let checks=0,scenarios=0;
const failures=[];
function verify(value,message){assert.ok(value,message);checks++;}
function equal(a,b,message){assert.deepEqual(a,b,message);checks++;}
function plain(value){return JSON.parse(JSON.stringify(value));}
function scenario(name,fn){
  scenarios++;
  try{fn();}catch(e){failures.push({name,message:e.message});}
}
function specNumber(expected){
  const spec=format.specification({type:"number",answer:expected,learningMode:"quick"},"n6");
  verify(!!spec,"supported finite number "+expected);return spec;
}
function response(spec,raw){return format.check(spec,raw,evaluate);}
function correct(spec,raw){const r=response(spec,raw);equal([r.ok,r.formatOk,r.mathOk],[true,true,true],"correct notation "+raw);}
function wrongNumber(spec,raw){const r=response(spec,raw);equal([r.ok,r.formatOk,r.mathOk],[false,true,false],"wrong exact number "+raw);}
function badFormat(spec,raw,knownMath){
  const r=response(spec,raw);verify(!r.ok&&!r.formatOk,"invalid notation "+raw);
  if(knownMath!==undefined)equal(r.mathOk,knownMath,"mathematical classification "+raw);
  return r;
}
function allTasks(){return data.topics.flatMap(topic=>[
  ...topic.quick.map(t=>({...t,topicId:topic.id,learningMode:"quick"})),
  ...topic.creative.map(t=>({...t,topicId:topic.id,learningMode:"creative"}))
]);}

scenario("exact finite decimal notation",()=>{
  const s=specNumber(1.5);
  for(const raw of ["1,5","01,500","0001,5000"," 1,5 "])correct(s,raw);
  for(const raw of ["1,5000000000000000001","1,4999999999999999999","1,5000000001","1,5001","15"])wrongNumber(s,raw);
  for(const raw of ["1.5","3/2"])badFormat(s,raw,true);
  for(const raw of ["1,5 см","1;5","1,,5","1/2/3","one",""," ","1<2","1,5\n2"])badFormat(s,raw);
  const zero=specNumber(0);
  for(const raw of ["0","-0","−0,000","000,000"])correct(zero,raw);
  wrongNumber(zero,"0,0000000000000000000000000001");
  const negative=specNumber(-2.75);
  correct(negative,"−2,7500");correct(negative,"-2,75");wrongNumber(negative,"2,75");
  badFormat(negative,"−2.75",true);
});
scenario("invalid notation must not assert approximate equality",()=>{
  for(const [expected,raw] of [
    [0,"0.00000000001"],[0,"1/100000000000"],[1,"1.00000000001"],
    [1.5,"1.5000000000000000001"],[10000000000,"10000000000+0,5"]
  ]){
    const r=badFormat(specNumber(expected),raw);
    verify(r.mathOk!==true,"inexact value is not declared mathematically equal: "+raw);
    verify(!r.message.includes("Числовое значение верное"),"no false assurance: "+raw);
  }
  const sum=badFormat(specNumber(0.3),"0,1+0,2");
  verify(sum.mathOk!==false,"an exact rational sum must not be called mathematically wrong because of floating arithmetic");
});
scenario("length and unsupported expected answers",()=>{
  const s=specNumber(1);
  correct(s,"0".repeat(127)+"1");
  badFormat(s,"0".repeat(128)+"1");
  badFormat(s,"9".repeat(300));
  for(const expected of [1/3,2/7,Math.sqrt(2),Math.PI,Infinity,-Infinity,NaN,9007199254740992])
    equal(format.specification({type:"number",answer:expected},"n6"),null,"unsupported exact representation is not offered: "+expected);
  equal(format.specification({type:"number",answer:1,learningMode:"creative"},"n6"),null,"creative tasks excluded");
  equal(format.specification({type:"number",answer:1},"base"),null,"foundations not assigned an exam answer field");
});
scenario("real numeric cards preserve value and reject long rounded alternatives",()=>{
  let eligible=0;
  for(const t of allTasks()){
    const s=format.specification(t,t.topicId);
    if(s?.kind!=="number")continue;
    eligible++;correct(s,String(t.answer).replace(".",","));
    const candidate=String(t.answer+1).replace(".",",");
    wrongNumber(s,candidate);
    verify(t.learningMode==="quick","format does not apply to creative cards");
  }
  verify(eligible>20,"substantial real fixed-card coverage");
});
scenario("one digit for real number 7 and number 13 tasks",()=>{
  const samples=allTasks().filter(t=>["n7","n13"].includes(t.topicId)&&t.type==="choice"&&t.learningMode==="quick");
  const rootFamily=require("./series-foundation-bridges.js").families.find(f=>f.id==="bridge-root-point");
  samples.push({...rootFamily.generate(37),topicId:"n7",learningMode:"quick"});
  for(const t of samples){
    const expected=String(t.options.findIndex(o=>o.correct)+1),s=format.specification(t,t.topicId);
    verify(!!s,t.id+" offers numbered answer");equal(s.expected,expected,t.id+" expected number is its visible option");
    correct(s,expected);
    for(const raw of ["0"+expected,expected+expected,expected+",0",t.options[Number(expected)-1].text])badFormat(s,raw);
    const wrong=String((Number(expected)%t.options.length)+1),r=response(s,wrong);
    equal([r.ok,r.formatOk,r.mathOk],[false,true,false],t.id+" another single digit is a mathematical error");
    equal(s.choices.map(o=>o.number),t.options.map((_,i)=>i+1),t.id+" numbering displayed explicitly");
  }
});
scenario("number 11 sequence follows the visible graph order",()=>{
  const f=require("./series-functions.js").families.find(f=>f.id==="func-graph-match");
  verify(!!f,"graph correspondence family exists");
  for(const seed of [0,1,16,37,63,127,999]){
    const t=f.generate(seed);t.topicId="n11";t.learningMode="quick";
    const s=format.specification(t,"n11"),expected=t.pairs.map(p=>t.matchOptions.indexOf(p.right)+1).join("");
    verify(!!s,"graph sequence offered "+seed);equal(s.expected,expected,"graph-to-formula order "+seed);
    correct(s,expected);badFormat(s,expected.split("").join(" "));badFormat(s,expected.slice(1));
    const wrong=expected.slice(1)+expected[0];verify(!response(s,wrong).ok,"permuted formula order rejected "+seed);
    const reordered=plain(t);reordered.pairs.reverse();
    const rs=format.specification(reordered,"n11");
    equal(rs.expected,expected.split("").reverse().join(""),"visible order controls the requested sequence");
  }
});
scenario("number 19 accepts a set of claim numbers without repetition",()=>{
  const samples=allTasks().filter(t=>t.topicId==="n19"&&["choice","multi"].includes(t.type)&&t.learningMode==="quick");
  const f=require("./series-exam-bridges.js").families.find(f=>f.id==="exam-geometry-one-true");
  samples.push({...f.generate(37),topicId:"n19",learningMode:"quick"});
  for(const t of samples){
    const expected=t.options.flatMap((o,i)=>o.correct?[String(i+1)]:[]).join("");
    const s=format.specification(t,"n19");verify(!!s,t.id+" actual statement card has format practice");
    correct(s,expected);correct(s,expected.split("").reverse().join(""));
    badFormat(s,expected.length>1?expected.split("").join(","):expected+",");
    verify(!response(s,expected+expected[0]).ok,t.id+" repeated claim number rejected");
    const omitted=expected.slice(1);if(omitted)verify(!response(s,omitted).ok,t.id+" missing true claim rejected");
    verify(!response(s,"0").ok,t.id+" zero is not a claim");
  }
});
scenario("generated decimal and algebraic answers all have exact notation",()=>{
  const families=require("./series-foundation-bridges.js").families.filter(f=>f.id!=="bridge-root-point");
  for(const f of families)for(let seed=0;seed<1000;seed++){
    const t=f.generate(seed),s=format.specification(t,f.topicId);
    verify(!!s,f.id+" seed "+seed+" supported finite answer");
    correct(s,String(t.answer).replace(".",","));
  }
});
scenario("root point alternative text does not disclose the answer",()=>{
  const f=require("./series-foundation-bridges.js").families.find(f=>f.id==="bridge-root-point");
  for(let seed=0;seed<1000;seed++){
    const t=f.generate(seed),s=t.visual.ariaLabel;
    verify(!/правильн|соответствует.*[ABCD]|ответ\s*[:—-]/i.test(s),"no explicit correct point in alt text "+seed);
    const root=Math.sqrt(t.math.radicand);
    verify(!s.includes(String(root))&&!s.includes(String(root).replace(".",",")),"no hidden exact root coordinate "+seed);
    verify(s.includes("A, B, C, D"),"all point names present "+seed);
  }
});

// Build an in-memory execution fixture from unchanged current source files.
// This tests actual event handlers without changing or publishing the built HTML.
const fixtureHtml='<!doctype html><html><body><style>'+fs.readFileSync(path.join(__dirname,"styles.css"),"utf8")+'</style>'+
  fs.readFileSync(path.join(__dirname,"app-fragment.html"),"utf8")+
  '<script>window.OGE_DATA='+JSON.stringify(data).replace(/<\//g,"<\\/")+';</script><script>'+sourceNames.map(n=>sources[n]).join("\n")+'</script></body></html>';
function fixture(fn){let h=createHarness({html:fixtureHtml});try{fn({get h(){return h;},reload(){h=h.reload();return h;}});}finally{h.close();}}
function counters(h){return plain(h.api.progress);}
function typeFormat(h,value){h.input('[data-field="exam-answer"]',value);h.click('button[data-action="check-format"]');}
scenario("notation checks never award another mathematical success",()=>fixture(({h})=>{
  h.openFamily("bridge-decimal-product");
  equal(h.document.querySelector(".exam-format"),null,"notation hidden before mathematical solution");
  const t=h.solve(),before=counters(h),state=h.api.taskState(t),help=state.helpUsed;
  h.openDetails(".exam-format");
  const answer=String(t.answer).replace(".",",");
  typeFormat(h,answer);verify(h.api.taskState(t).examFeedback.ok,"correct notation accepted in actual DOM");
  equal(counters(h),before,"first notation check does not mutate math history");
  typeFormat(h,answer);typeFormat(h,answer+" см");typeFormat(h,String(t.answer+1).replace(".",","));
  equal(counters(h),before,"repeated correct, format-error and wrong-value checks leave math history identical");
  equal(h.api.taskState(t).helpUsed,help,"notation practice does not change help state");
  equal(h.api.taskState(t).formatChecks,4,"format checks stored separately");
  typeFormat(h,answer);verify(h.api.taskState(t).formatSucceeded,"separate format success recorded");
  h.input('[data-field="exam-answer"]',answer+"0");
  equal(h.document.querySelector(".format-feedback"),null,"editing notation clears stale message");
  verify(!h.api.taskState(t).formatSucceeded,"editing notation clears current success");
  equal(counters(h),before,"editing notation does not affect math history");
}));
scenario("help remains help after format success and reload",()=>fixture(context=>{
  let h=context.h;h.openFamily("bridge-algebraic-fraction");h.click('button[data-action="hint"]');
  const t=h.solve(),before=counters(h);
  verify(h.api.taskState(t).helpUsed,"mathematical hint retained");
  equal(before[t.id].independent,0,"helped solution was not independent");
  h.openDetails(".exam-format");typeFormat(h,String(t.answer).replace(".",","));
  equal(counters(h),before,"format success leaves guided mathematical result intact");
  h=context.reload();
  equal(counters(h),before,"mathematical history preserved after reload");
  verify(h.api.taskState(h.api.task()).helpUsed,"help survives reload and formatting");
  verify(h.api.taskState(h.api.task()).formatSucceeded,"format success restored as separate state");
  equal(JSON.parse(h.storage.get(STORAGE_PROGRESS)),before,"stored math history unchanged");
}));
scenario("Enter in format field does not submit mathematics",()=>fixture(({h})=>{
  h.openFamily("bridge-decimal-product");const t=h.solve(),before=counters(h);
  h.openDetails(".exam-format");h.input('[data-field="exam-answer"]',String(t.answer).replace(".",","));
  h.query('[data-field="exam-answer"]').dispatchEvent(new h.window.KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true}));h.flush();
  verify(h.api.taskState(t).examFeedback.ok,"Enter checks notation");
  equal(counters(h),before,"Enter did not create another math attempt");
}));
scenario("notation is optional and editing math does not restore old success",()=>fixture(({h})=>{
  h.openFamily("bridge-decimal-product");const t=h.solve();
  h.click('button[data-action="next"]');verify(h.document.querySelector(".completed"),"ordinary series can finish without notation practice");
  h.openFamily("bridge-decimal-product");const fresh=h.solve();h.openDetails(".exam-format");
  typeFormat(h,String(fresh.answer).replace(".",","));const before=counters(h);
  h.input('[data-field="answer"]',String(fresh.answer+1));
  equal(h.document.querySelector(".task .feedback"),null,"edited mathematics loses old feedback");
  typeFormat(h,String(fresh.answer).replace(".",","));
  equal(h.document.querySelector(".task .feedback"),null,"notation check does not resurrect mathematical success feedback");
  equal(counters(h),before,"format recheck did not submit edited math");
}));
scenario("changing a selected option clears notation success without rewriting mathematics",()=>fixture(({h})=>{
  h.openFamily("bridge-root-point");const t=h.solve(),expected=String(t.options.findIndex(o=>o.correct)+1);
  h.openDetails(".exam-format");typeFormat(h,expected);const before=counters(h);
  const wrong=t.options.findIndex(o=>!o.correct);
  h.click('button[data-action="option"][data-index="'+wrong+'"]');
  equal(h.document.querySelector(".format-feedback"),null,"choice edit clears notation message");
  verify(!h.api.taskState(t).formatSucceeded,"choice edit clears notation success");
  equal(h.document.querySelector(".task .feedback"),null,"choice edit clears mathematical result message");
  typeFormat(h,expected);equal(counters(h),before,"notation does not submit changed choice");
  equal(h.document.querySelector(".task .feedback"),null,"notation does not resurrect choice success");
}));
scenario("changing a graph correspondence clears notation success",()=>fixture(({h})=>{
  h.openFamily("func-graph-match");const t=h.solve();
  const expected=t.pairs.map(p=>t.matchOptions.indexOf(p.right)+1).join("");
  h.openDetails(".exam-format");typeFormat(h,expected);const before=counters(h);
  h.select('select[data-field="match"][data-index="0"]',t.matchOptions.find(v=>v!==t.pairs[0].right));
  equal(h.document.querySelector(".format-feedback"),null,"correspondence edit clears notation message");
  verify(!h.api.taskState(t).formatSucceeded,"correspondence edit clears notation success");
  typeFormat(h,expected);equal(counters(h),before,"notation does not submit changed correspondence");
  equal(h.document.querySelector(".task .feedback"),null,"notation does not resurrect correspondence success");
}));
scenario("real statement-format panel has one numbering and separate history",()=>fixture(({h})=>{
  h.openFamily("exam-geometry-one-true");const t=h.solve();
  h.openDetails(".exam-format");
  const li=Array.from(h.document.querySelectorAll(".format-options li"));
  equal(li.length,t.options.length,"all statements displayed for answer numbering");
  for(let i=0;i<li.length;i++)verify(!li[i].textContent.startsWith((i+1)+"."),"original enumeration stripped before ordered-list numbering");
  const expected=String(t.options.findIndex(o=>o.correct)+1),before=counters(h);
  typeFormat(h,expected);verify(h.api.taskState(t).examFeedback.ok,"true statement number accepted");
  typeFormat(h,expected+expected);verify(!h.api.taskState(t).examFeedback.ok,"duplicated statement number rejected");
  equal(counters(h),before,"statement notation never adds a mathematical attempt");
}));

scenario("review snapshot stays unchanged during execution",()=>{
  for(const name of sourceNames)equal(fs.readFileSync(path.join(__dirname,name),"utf8"),sources[name],"source changed during review: "+name);
});

const report={status:failures.length?"FAIL":"PASS",generatedAt:new Date().toISOString(),checks,scenarios,failures,
  sourceSha256:Object.fromEntries(sourceNames.map(n=>[n,sha(sources[n])])),
  courseDataSha256:sha(fs.readFileSync(path.join(__dirname,"course-data.json"))),
  limitations:["Internal review; not an external provider review.","DOM emulation executes current source snapshots in memory; not a real browser or a build-publication gate.","Does not certify actual OGE answer-sheet scanning or cell-count requirements."]};
fs.writeFileSync(path.join(__dirname,"QA_ANSWER_FORMAT.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report,null,2));
if(failures.length)process.exitCode=1;
