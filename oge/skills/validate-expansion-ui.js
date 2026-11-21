"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const {createHarness,STORAGE_PROGRESS}=require("./dom-harness");
const {specification}=require("./exam-format");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"course-data.json"),"utf8"));
const html=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const additions=["arithmetic","functions","geometry","practical","second-part","division"].map(name=>JSON.parse(fs.readFileSync(path.join(__dirname,"expansion-"+name+".json"),"utf8")));
const creative=additions.flatMap(part=>part.topics.flatMap(topic=>topic.creative||[]))
  .concat(JSON.parse(fs.readFileSync(path.join(__dirname,"topics-practical.json"),"utf8")).flatMap(topic=>topic.creative));
const report={status:"running",method:"JSDOM with real event handlers; synthetic SVG dimensions only",generatedAt:new Date().toISOString(),htmlSha256:crypto.createHash("sha256").update(html).digest("hex"),limitations:["No real browser layout, screenshots, touch or student observation.","SVG checks concern mathematical coordinates and state, not rendered typography."],passed:[],failed:null};
function plain(value){return JSON.parse(JSON.stringify(value));}
function test(name,fn){
  if(report.failed)return;
  try{fn();report.passed.push(name);}catch(error){report.failed={name,message:error.message,stack:String(error.stack).replaceAll(__dirname,".")};}
}
function fixture(options,fn){let h=createHarness({...options,html});const context={get h(){return h;},reload(){h=h.reload();return h;}};try{fn(context);}finally{h.close();}}
function svgValid(h){
  for(const figure of h.document.querySelectorAll("[data-figure]")){
    assert(figure.querySelector("svg"),"Expected a drawn figure after valid input.");
    for(const svg of figure.querySelectorAll("svg")){
      assert(!/NaN|Infinity/.test(svg.outerHTML),"Non-finite SVG coordinate.");
      const box=svg.getAttribute("viewBox").split(/\s+/).map(Number);
      assert(box.length===4&&box[2]>0&&box[3]>0,"Invalid SVG bounds.");
    }
  }
}
test("all-topics-keep-four-task-overview",()=>fixture({},({h})=>{
  for(const topic of data.topics){
    h.select("#skill-topic",topic.id);
    assert.equal(h.document.querySelectorAll(".progress-dots span").length,4);
    assert.equal(h.api.task().id,topic.overviewTaskIds[0]);
    assert.equal(h.document.querySelector(".map"),null);
    assert(!h.query(".series-picker").open);
  }
}));
for(const width of [320,736])for(const task of creative)test("workshop-"+task.id+"-"+width,()=>fixture({width},({h})=>{
  h.openStatic(task.id);
  assert(!h.query(".creative-picker").open,"Workshop list must collapse after selection.");
  h.solve();svgValid(h);
  assert.equal(h.api.progress[task.id].independent,1);
  assert.equal(h.api.progress[task.id].learningMode,"creative");
}));
test("function-choice-needs-distinguishing-value",()=>fixture({},context=>{
  let h=context.h;h.openStatic("exp-n11-probe-creative");
  h.click('[data-action="model"][data-value="quadratic"]');
  h.click('[data-action="check"]');
  assert.equal(h.api.state.feedback.kind,"invalid");
  assert.equal(h.api.progress[h.api.task().id],undefined);
  h.click('[data-action="probe"][data-value="0"]');
  h.click('[data-action="probe"][data-value="2"]');
  h.click('[data-action="check"]');
  assert.equal(h.api.state.feedback.kind,"invalid");
  assert.equal(h.api.taskState(h.api.task()).helpUsed,false,"Non-distinguishing data are part of the activity, not a hint.");
  h=context.reload();
  assert.deepEqual(plain(h.api.taskState(h.api.task()).probes),[0,2]);
  h.click('[data-action="probe"][data-value="1"]');
  const rows=Array.from(h.document.querySelectorAll(".task-table tbody tr")).map(row=>row.textContent);
  assert(rows.some(row=>row.includes("Выбрано вами")));
  h.click('[data-action="check"]');
  assert.equal(h.api.state.feedback.ok,true);
  const taskId=h.api.task().id;
  h.click('[data-action="model"][data-value="linear"]');
  assert.equal(h.api.state.feedback,null);
  assert.equal(h.document.querySelector('.task [data-action="next"]'),null);
  h.click('[data-action="check"]');
  assert.equal(h.api.state.feedback.ok,false);
  assert.equal(h.api.progress[taskId].successful,1);
}));
test("fixed-route-resume-and-repeat-do-not-create-new-cards",()=>fixture({},context=>{
  let h=context.h,route=data.routes.find(r=>r.originAtlasId==="6.1");
  h.openRoute(route.id);const ids=h.api.series.materialize(h.api.state.runs[route.id]).map(t=>t.id);
  h.solve();h.click('[data-action="next"]');
  assert.equal(h.api.task().learningMode,"creative");
  h=context.reload();assert.equal(h.api.task().id,ids[1]);
  h.click('[data-action="skip-workshop"]');h.solve();h.click('[data-action="next"]');
  assert(h.query(".ordinary-result").textContent.includes("2 из 2"));
  h.click('[data-action="route"][data-route="'+route.id+'"]');
  const repeated=h.api.state.runs[route.id];
  assert.equal(repeated.fresh,false);
  assert.deepEqual(plain(h.api.series.materialize(repeated).map(t=>t.id)),plain(ids));
  assert(h.document.body.textContent.includes("уже встречались"));
}));
test("one-extra-ordinary-task-can-be-opened-from-map",()=>fixture({},({h})=>{
  h.openStatic("exp-n12-units-entry");
  assert(h.api.state.activeRun.startsWith("task:"));
  h.solve();h.click('[data-action="next"]');
  assert(h.query(".ordinary-result").textContent.includes("1 из 1"));
}));
test("circle-input-keeps-given-points-and-removes-stale-circle",()=>fixture({},({h})=>{
  h.openStatic("exp-n16-center-creative");h.fillCorrect();
  const task=h.api.task(),d=task.visual.dynamic;
  const svg=h.query('[data-figure="custom"] svg');
  const circle=svg.querySelector('[data-geometry-circle]');assert(circle);
  const cx=+circle.getAttribute("cx"),cy=+circle.getAttribute("cy"),radius=+circle.getAttribute("r");
  const points=Array.from(svg.querySelectorAll('circle:not([data-geometry-circle])')).filter(node=>node.getAttribute("fill")==="var(--accent)");
  assert.equal(points.length,task.visual.points.length);
  for(const point of points)assert(Math.abs(Math.hypot(+point.getAttribute("cx")-cx,+point.getAttribute("cy")-cy)-radius)<1e-7,"A given point is not on the constructed circle.");
  h.input('[data-field="build"][data-name="'+d.r+'"]',"");
  assert(h.query('[data-figure="custom"]').querySelector("svg"));
  assert.equal(h.document.querySelector('[data-geometry-circle]'),null);
  assert(h.query(".figure-placeholder").textContent.length>0);
}));
test("unused-distance-answer-does-not-hide-geometry",()=>fixture({},({h})=>{
  h.openStatic("exp-n18-distance-creative");h.fillCorrect();
  const t=h.api.task(),d=t.visual.dynamic;
  const coordinateNames=[d.x,d.y];
  const other=t.fields.find(f=>!coordinateNames.includes(f.name));assert(other);
  h.input('[data-field="build"][data-name="'+other.name+'"]',"");
  assert(h.document.querySelector('[data-figure="custom"] svg'));
  assert.equal(h.document.querySelector(".figure-placeholder"),null);
}));
test("piecewise-graph-updates-with-coefficients",()=>fixture({},({h})=>{
  h.openStatic("exp-n11-tariff-creative");h.fillCorrect();
  const before=h.query('[data-piecewise-segment="1"]').getAttribute("d");
  h.input('[data-field="build"][data-name="k"]',31);
  const after=h.query('[data-piecewise-segment="1"]').getAttribute("d");
  assert.notEqual(before,after);
  assert(h.query('[data-piecewise-segment="0"]').getAttribute("d"));
  const ends=Array.from(h.document.querySelectorAll("[data-endpoint]")).map(el=>el.getAttribute("data-endpoint"));
  assert(ends.includes("closed")&&ends.includes("open"));
  h.input('[data-field="build"][data-name="k"]',"");
  assert.equal(h.document.querySelector('[data-piecewise-segment="1"]'),null);
  assert(h.query(".figure-placeholder"));
}));
test("calibration-keeps-original-labels-after-empty-input",()=>fixture({},({h})=>{
  h.openStatic("exp-n7-calibration-workshop");h.fillCorrect();
  assert(h.query('[data-figure="custom"]').textContent.includes("Ваши значения"));
  h.input('[data-field="build"][data-name="first"]',"");
  const figure=h.query('[data-figure="custom"]');
  assert(figure.querySelector("svg"));
  assert(!figure.textContent.includes("Ваши значения"));
  assert(figure.textContent.includes("−2")&&figure.textContent.includes("4"));
}));
for(const width of [320,736])for(const family of ["bridge-decimal-product","bridge-root-point","bridge-algebraic-fraction"])
test("new-family-"+family+"-"+width,()=>fixture({width},({h})=>{
  h.openFamily(family);const task=h.solve();svgValid(h);
  if(family==="bridge-root-point"){
    const circles=Array.from(h.document.querySelectorAll("[data-numberline-point]"));
    assert.equal(circles.length,4);
    const xs=circles.map(c=>+c.getAttribute("cx"));
    assert(xs.every((x,i)=>i===0||x>xs[i-1]));
    const v=task.visual;
    const ratios=circles.map(c=>(+c.getAttribute("cx")-xs[0])/(xs.at(-1)-xs[0]));
    ratios.forEach((ratio,i)=>assert(Math.abs(ratio-(v.points[i].x-v.points[0].x)/(v.points.at(-1).x-v.points[0].x))<1e-9));
  }
}));
test("answer-notation-is-separate-from-mathematical-progress",()=>fixture({},context=>{
  let h=context.h;
  const suitable=data.topics.find(t=>t.id==="n6").quick.find(t=>specification(t,"n6"));assert(suitable);
  h.openStatic(suitable.id);
  h.solve();const task=h.api.task(),spec=specification(task,"n6");assert(spec&&spec.kind==="number");
  const progressBefore=h.storage.get(STORAGE_PROGRESS);
  h.openDetails(".exam-format");
  h.input('[data-field="exam-answer"]',String(spec.expected)+"+0");
  h.click('[data-action="check-format"]');
  assert.equal(h.api.taskState(task).examFeedback.ok,false);
  assert.equal(h.storage.get(STORAGE_PROGRESS),progressBefore);
  h.input('[data-field="exam-answer"]',String(spec.expected).replace(".",","));
  h.click('[data-action="check-format"]');
  assert.equal(h.api.taskState(task).examFeedback.ok,true);
  assert.equal(h.storage.get(STORAGE_PROGRESS),progressBefore);
  h=context.reload();
  assert.equal(h.api.taskState(h.api.task()).formatSucceeded,true);
  assert.equal(h.storage.get(STORAGE_PROGRESS),progressBefore);
}));
test("graph-matching-answer-has-fixed-digit-order",()=>fixture({},({h})=>{
  h.openFamily("func-graph-match");h.solve();const t=h.api.task(),spec=specification(t,"n11");assert(spec);
  h.openDetails(".exam-format");
  assert.equal(h.document.querySelectorAll(".format-options li").length,t.matchOptions.length);
  h.input('[data-field="exam-answer"]',spec.expected.split("").join(" "));
  h.click('[data-action="check-format"]');assert.equal(h.api.taskState(t).examFeedback.formatOk,false);
  h.input('[data-field="exam-answer"]',spec.expected);h.click('[data-action="check-format"]');
  assert.equal(h.api.taskState(t).examFeedback.ok,true);
}));
test("statement-notation-accepts-equivalent-order-without-extra-credit",()=>fixture({},({h})=>{
  const topic=data.topics.find(t=>t.id==="n19"),task=topic.quick.find(t=>t.type==="multi");assert(task);
  h.openStatic(task.id);h.solve();const spec=specification(task,"n19");assert(spec);
  h.openDetails(".exam-format");const before=h.storage.get(STORAGE_PROGRESS);
  h.input('[data-field="exam-answer"]',spec.expected.split("").reverse().join(""));
  h.click('[data-action="check-format"]');assert.equal(h.api.taskState(h.api.task()).examFeedback.ok,true);
  assert.equal(h.storage.get(STORAGE_PROGRESS),before);
}));
test("storage-unavailable-still-allows-new-activity",()=>fixture({storageBlocked:true},({h})=>{
  h.openStatic("exp-n11-probe-creative");h.solve();assert.equal(h.api.state.feedback.ok,true);
  assert(h.document.body.textContent.includes("Ответы и подсказки доступны в этой открытой вкладке."));
}));
report.status=report.failed?"failed":"passed";report.passedCases=report.passed.length;
fs.writeFileSync(path.join(__dirname,"QA_EXPANSION_DOM.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({status:report.status,passed:report.passedCases,failed:report.failed}));
process.exitCode=report.failed?1:0;
