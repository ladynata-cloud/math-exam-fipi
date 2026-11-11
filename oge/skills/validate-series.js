"use strict";
const fs=require("fs");
const path=require("path");
const assert=require("assert/strict");
const {create,signature}=require("./series-runtime");
const {checkTask,evaluate}=require("./engine");
const {witness}=require("./task-input");
const parts=[require("./series-arithmetic"),require("./series-equations"),require("./series-functions"),require("./series-exam-bridges"),require("./series-foundation-bridges")];
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"course-data.json"),"utf8"));
parts.push({routes:data.routes||[],tasks:data.topics.flatMap(topic=>[
  ...topic.quick.map(t=>({...t,topicId:topic.id,learningMode:"quick"})),
  ...topic.creative.map(t=>({...t,topicId:topic.id,learningMode:"creative"}))
])});
const registry=create(parts);
const skills=new Set(data.topics.flatMap(t=>t.skills.map(s=>s.id)));
const topics=new Set(data.topics.map(t=>t.id));
let checks=0,generations=0,diagnostics=0;
function verify(value,message){checks++;assert(value,message);}
const uniqueness=[],types=new Set(),allGeneratedIds=new Set();
for(const topic of data.topics)for(const skill of topic.skills){
  for(const familyId of skill.relatedFamilies||[])verify(!!registry.familyIndex[familyId],"missing related family "+familyId);
  for(const taskId of skill.relatedTasks||[])verify(topic.creative.some(task=>task.id===taskId),"missing related workshop "+taskId);
}
for(const family of registry.families){
  verify(skills.has(family.skillId),"unknown family skill "+family.id);
  verify(topics.has(family.topicId),"unknown family topic "+family.id);
  verify(["quick","creative"].includes(family.mode),"unknown family mode "+family.id);
  const signatures=new Map();
  for(let seed=0;seed<registry.maxSeeds;seed++){
    const task=registry.task(family.id,seed);
    generations++;types.add(task.type);allGeneratedIds.add(task.id);
    verify(skills.has(task.skillId),"unknown generated skill "+task.id);
    for(const key of ["title","prompt","hint","explanation"])
      verify(typeof task[key]==="string"&&task[key].trim().length>0,"missing "+key+" "+task.id);
    verify(checkTask(task,witness(task)).ok,"witness rejected "+family.id+" seed "+seed);
    const sig=signature(task),prior=signatures.get(task.id);
    verify(prior===undefined||prior===sig,"mathematical ID collision "+task.id);
    signatures.set(task.id,sig);
    if(task.type==="choice"||task.type==="multi"){
      verify(new Set(task.options.map(o=>o.text)).size===task.options.length,"duplicate choices "+task.id);
      const correct=task.options.filter(o=>o.correct).length;
      verify(correct>0&&correct<task.options.length,"empty or trivial options "+task.id);
      if(task.type==="choice")verify(correct===1,"ambiguous single choice "+task.id);
    }
    if(task.type==="match"&&task.matchOptions){
      verify(new Set(task.matchOptions).size===task.matchOptions.length,"duplicate matching choices "+task.id);
      task.pairs.forEach(p=>verify(task.matchOptions.includes(p.right),"missing matching answer "+task.id));
    }
    for(const d of task.diagnostics||[]){
      verify(Number.isFinite(d.value),"nonfinite diagnostic "+task.id);
      verify(!checkTask(task,{answer:String(d.value)}).ok,"diagnostic is actually correct "+task.id);
      diagnostics++;
    }
    if(seed<3)verify(JSON.stringify(registry.task(family.id,seed))===JSON.stringify(task),"nondeterministic "+task.id);
  }
  const first=registry.task(family.id,37);
  const next=registry.next(family.id,37,[first.id]);
  verify(signatures.size>1?next.fresh&&next.task.id!==first.id:!next.fresh,"fresh variant classification "+family.id);
  uniqueness.push({familyId:family.id,mathematicallyDistinctCards:signatures.size});
}
for(const route of registry.routes){
  verify(route.steps.length>=2&&route.steps.length<=6,"route length "+route.id);
  const run=registry.start(route.id,37,[]),tasks=registry.materialize(run);
  verify(tasks[0].learningMode==="quick","ordinary entry "+route.id);
  verify(tasks.at(-1).learningMode==="quick","ordinary exit "+route.id);
  verify(tasks.length===route.steps.length,"run length "+route.id);
  verify(new Set(tasks.map(t=>t.id)).size===tasks.length,"repeated card inside one run "+route.id);
  verify(run.fresh,"new route starts fresh "+route.id);
  const resumed=registry.materialize(JSON.parse(JSON.stringify(run)));
  verify(resumed.map(t=>t.id).join("|")===tasks.map(t=>t.id).join("|"),"stable persisted route "+route.id);
  if(route.steps.some(step=>step.variants)){
    for(let seed=0;seed<registry.maxSeeds;seed++){
      const selected=registry.materialize(registry.start(route.id,seed,[]));
      route.steps.forEach((step,i)=>{
        if(step.variants)verify(step.variants.includes(selected[i].variant),"route drifted into another mathematical goal "+route.id+" seed "+seed);
      });
    }
  }
}
const exhausted=registry.next(registry.families[0].id,0,[...allGeneratedIds]);
verify(!exhausted.fresh,"exhausted family cannot claim a new card");
const selectedExhausted=registry.next("arith-decimal-plain",0,[...allGeneratedIds],["decimal-subtract"]);
verify(!selectedExhausted.fresh&&selectedExhausted.task.variant==="decimal-subtract","an exhausted selected case must not fall back to another operation");
assert.throws(()=>registry.next("arith-decimal-plain",0,[],["unknown-case"]));
const example=registry.task(registry.families[0].id,37);
const relabelled={...example,title:"Другой заголовок",hint:"Другая опора",explanation:"Другая редакция"};
verify(signature(example)===signature(relabelled),"copy edit must not reset mathematical history");
const reorderedA=registry.task("arith-estimate-change",0),reorderedB=registry.task("arith-estimate-change",63);
verify(reorderedA.id===reorderedB.id,"same mathematical multiple choice keeps one history");
verify(reorderedA.presentationId!==reorderedB.presentationId,"different option order gets a separate input presentation");
const claimA=registry.task("exam-geometry-one-true",16),claimB=registry.task("exam-geometry-one-true",19);
verify(claimA.id===claimB.id,"renumbering the same claims must keep mathematical history");
verify(claimA.presentationId!==claimB.presentationId,"renumbered claims retain distinct input presentation");
const intervalOriginal=registry.task("exam-inequality-picture",37),intervalReordered=JSON.parse(JSON.stringify(intervalOriginal));
intervalReordered.visual.rows.reverse();intervalReordered.options.reverse();
intervalReordered.visual.rows.forEach((row,i)=>{row.label=String(i+1);intervalReordered.options[i].text="Рисунок "+(i+1);});
verify(signature(intervalOriginal)===signature(intervalReordered),"numbering interval drawings must not create a new mathematical task");
const graphOriginal=registry.task("func-graph-match",37),graphReordered=JSON.parse(JSON.stringify(graphOriginal));
graphReordered.visual.plots.reverse();graphReordered.pairs.reverse();
graphReordered.visual.plots.forEach((plot,i)=>{plot.label=["А","Б","В"][i];plot.ariaLabel=plot.label+". Другое описание.";graphReordered.pairs[i].left=plot.label;});
verify(signature(graphOriginal)===signature(graphReordered),"relettering graphs must not create a new mathematical task");
assert.throws(()=>evaluate("1e-400"));
assert.throws(()=>evaluate("1e-200^2"));
assert.throws(()=>checkTask({type:"fraction",numeratorA:1,denominatorA:3,numeratorB:1,denominatorB:2},{partition:-12,answer:"-10"}));
const certified={type:"counterexample",field:"x",left:"sqrt(x^2)",right:"x",comparisonLeft:"abs(x)",counterexampleWhen:[{left:"x",op:"lt",right:"0"}]};
verify(!checkTask(certified,{answer:"1e-200"}).ok,"positive small number is not a square-root counterexample");
verify(checkTask(certified,{answer:"-1e-200"}).ok,"negative small number is a square-root counterexample");
const report={
  status:"PASS",checks,generationsChecked:generations,diagnosticValuesChecked:diagnostics,
  families:registry.families.length,routes:registry.routes.length,types:[...types].sort(),uniqueness,
  scope:"Generator contracts over seeds 0–999, witnesses, diagnostics, identity and routes. Independent mathematical reviews are separate.",
  limitations:["Generation count is not a count of unique mathematical structures.","No browser layout or learner-effectiveness claim."]
};
fs.writeFileSync(path.join(__dirname,"QA_SERIES_REPORT.json"),JSON.stringify(report,null,2)+"\n","utf8");
console.log(JSON.stringify({...report,uniqueness:undefined},null,2));
