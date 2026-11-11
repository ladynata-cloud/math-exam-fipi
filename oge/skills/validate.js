"use strict";
const fs=require("fs");
const path=require("path");
const assert=require("assert/strict");
const {evaluate,checkTask,close,compare,fmt}=require("./engine");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"course-data.json"),"utf8"));
const ids=new Set(),skills=new Set(),tasks=[];
let checks=0;
function verify(condition,message){checks++;assert(condition,message);}
function raises(fn,label){checks++;assert.throws(fn,undefined,label);}
for(const t of data.topics){
  verify(!ids.has(t.id),"duplicate topic "+t.id);ids.add(t.id);
  verify(t.overviewTaskIds.length===4,"overview remains four tasks "+t.id);
  verify(new Set(t.overviewTaskIds).size===4,"unique overview tasks "+t.id);
  for(const id of t.overviewTaskIds)verify(t.quick.some(q=>q.id===id),"overview references ordinary task "+id);
  for(const s of t.skills){verify(!skills.has(s.id),"duplicate skill "+s.id);skills.add(s.id);}
  tasks.push(...t.quick,...t.creative);
}
verify(data.topics.map(t=>t.id).join(",")==="base,n6,n7,n8,n9,n10,n11,n12,n13,n14,n15,n16,n17,n18,n19","coverage");
for(const t of data.topics)for(const s of t.skills)for(const r of s.requires||[])verify(skills.has(r),"missing prerequisite "+r);
const allSkills=data.topics.flatMap(t=>t.skills);
function visit(id,chain=new Set()){verify(!chain.has(id),"skill cycle "+id);const next=new Set(chain);next.add(id);for(const r of allSkills.find(s=>s.id===id).requires||[])visit(r,next);}
allSkills.forEach(s=>visit(s.id));
const taskIds=new Set();
for(const t of tasks){
  verify(!taskIds.has(t.id),"duplicate task "+t.id);taskIds.add(t.id);
  verify(skills.has(t.skillId),"unknown skill "+t.id);
  for(const k of ["prompt","hint","explanation","title"])verify(typeof t[k]==="string"&&t[k].length>0,"empty "+k+" "+t.id);
  let input={};
  switch(t.type){
    case "experiment": input={probes:t.exampleSolution.probes,modelId:t.exampleSolution.modelId};break;
    case "number":case "numberline":input.answer=String(t.answer);break;
    case "choice":case "multi":
      input.selected=t.options.flatMap((o,i)=>o.correct?[i]:[]);
      verify(t.type==="multi"?input.selected.length>0:input.selected.length===1,"answer choices "+t.id);
      verify(input.selected.length<t.options.length,"no distractor "+t.id);break;
    case "match":input.matches=Object.fromEntries(t.pairs.map((p,i)=>[i,p.right]));break;
    case "order":
      verify([...t.items].sort().join("|")===[...t.answer].sort().join("|"),"order items "+t.id);
      input.order=t.answer;break;
    case "build":verify(!!t.exampleSolution,"build witness "+t.id);input.values=Object.fromEntries(Object.entries(t.exampleSolution).map(([k,v])=>[k,String(v)]));break;
    case "counterexample":verify(t.exampleCounterexample!==undefined,"counterexample "+t.id);input.answer=String(t.exampleCounterexample);break;
    case "battle":verify(t.a*t.b<0,"battle opposite signs "+t.id);input.answer=String(t.a+t.b);input.sign=t.a+t.b<0?"−":t.a+t.b>0?"+":"0";break;
    case "graph":
      verify(t.points.length>=2&&t.points[0][0]!==t.points[1][0],"two distinct graph x "+t.id);
      for(const [x,y] of t.points)verify(close(y,t.k*x+t.b),"target graph point "+t.id);
      input={k:t.k,b:t.b};break;
    case "fraction":
      input.partition=t.denominatorA*t.denominatorB;
      input.answer=String(input.partition*(t.numeratorA/t.denominatorA+t.numeratorB/t.denominatorB));break;
    case "probability":
      verify(Number.isInteger(t.total*t.numerator/t.denominator),"probability possible "+t.id);
      input.red=Array.from({length:t.total*t.numerator/t.denominator},(_,i)=>i);break;
    case "tiltArea":input.answer=String(t.base*t.height);break;
    case "triangleGate":input.answer=String((Math.abs(t.sideA-t.sideB)+t.sideA+t.sideB)/2);break;
    default:throw Error("unsupported "+t.type+" "+t.id);
  }
  verify(checkTask(t,input).ok,"witness rejected "+t.id);
  if(["number","numberline","battle","tiltArea","triangleGate","counterexample"].includes(t.type))raises(()=>checkTask(t,{answer:""}),"blank "+t.id);
  if(t.type==="number")verify(!checkTask(t,{answer:String(t.answer+1)}).ok,"wrong answer accepted "+t.id);
  if(t.type==="build"){
    const f=t.fields.find(f=>f.step===1);
    if(f){let v={...input.values,[f.name]:String(t.exampleSolution[f.name]+0.5)};raises(()=>checkTask(t,{values:v}),"fraction in integer field "+t.id);}
  }
}
const parserCases=[["1/2+1/3",5/6],["−2,5",-2.5],["-2^2",-4],["(-2)^2",4],["2^-2",.25],["2^3^2",512],["sqrt(49)+abs(-3)",10]];
for(const [expr,wanted] of parserCases)verify(close(evaluate(expr),wanted),"parser "+expr);
for(const expr of ["","NaN","Infinity","1/0","sqrt(-1)","1;2","2abc","alert(1)","globalThis.process","1//2"])raises(()=>evaluate(expr),"invalid expression "+expr);
const triangle={type:"triangleGate",sideA:5,sideB:8};
for(const x of [3,13,0,-1,14])verify(!checkTask(triangle,{answer:String(x)}).ok,"triangle boundary "+x);
for(const x of [4,8,12,12.5])verify(checkTask(triangle,{answer:String(x)}).ok,"triangle interior "+x);
verify(!checkTask({type:"counterexample",left:"sqrt(x^2)",right:"x",field:"x"},{answer:"3"}).ok,"coincidence is not counterexample");
verify(checkTask({type:"counterexample",left:"sqrt(x^2)",right:"x",field:"x"},{answer:"-3"}).ok,"negative square root counterexample");
verify(checkTask({type:"counterexample",left:"sqrt(x^2)",right:"x",field:"x"},{answer:"-0.000000001"}).ok,"small negative counterexample");
verify(!checkTask({type:"battle",a:-8,b:5},{answer:"-3",sign:"+"}).ok,"battle checks sign as well as sum");
verify(checkTask({type:"battle",a:-8,b:5},{answer:"-3",sign:"−"}).ok,"battle correct sign and sum");
verify(fmt(-1e-9)!=="0","small counterexample remains visible");
verify(evaluate(fmt(-1e-9))===-1e-9,"small formatted number keeps its value");
verify(!compare(5+1e-9,"lte",5),"value beyond upper boundary is rejected");
verify(!compare(2-1e-9,"gte",2),"value below lower boundary is rejected");
verify(compare(0.1+0.2,"lte",0.3),"boundary tolerates arithmetic roundoff");
const report={status:"PASS",checks,topics:data.topics.length,skills:skills.size,quick:data.topics.reduce((n,t)=>n+t.quick.length,0),creative:data.topics.reduce((n,t)=>n+t.creative.length,0),tasks:tasks.length,types:[...new Set(tasks.map(t=>t.type))].sort(),scope:"Data witnesses, mathematical boundaries, parser validation; browser checks are recorded separately."};
fs.writeFileSync(path.join(__dirname,"QA_REPORT.json"),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
