'use strict';

const assert=require('node:assert/strict');
const engine=require('../../stereo-course/textbook/assets/engine.js');
const viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json');
const manifest=require('./signed-vector-combinations.json');
const {wrongStepAnswers}=require('./wrong-step-answers.cjs');
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
const steps={
 '0573-a':['-1','DB','AB','да'],'0573-b':['-1','DC','AB','да'],'0573-c':['-1','DC','AB','да'],
 '0574-a':['OE','AD','нет','OD'],'0574-b':['AM','PK','AK','0'],'0574-c':['AB','MP','0','AP']
};
const terms={a:['AC','DC','BD'],b:['DA','DC','CB'],c:['DA','CD','BC']};
const printed={a:'AC-DC-BD',b:'DC+CB-DA',c:'-(DA+CD+BC)'};
const original={a:'OP-EP+KD-KA',b:'AD+MP+EK-EP-MD',c:'AC-BC-PM-AP+BM'};
function signature(text){
 const latin={'А':'A','В':'B','С':'C','М':'M','Р':'P','К':'K'};
 let s=text.replace(/\s|→/gu,'').replaceAll('−','-').replace(/[АВСМРК]/gu,letter=>latin[letter]),factor=1;
 if(s.startsWith('-(')&&s.endsWith(')')){s=s.slice(2,-1);factor=-1;}
 const balances=new Map();
 if(s==='0')return [];
 for(const match of s.matchAll(/([+-]?)([A-Z])([A-Z])/gu)){
  const sign=(match[1]==='-'?-1:1)*factor;
  balances.set(match[2],(balances.get(match[2])||0)-sign);
  balances.set(match[3],(balances.get(match[3])||0)+sign);
 }
 return [...balances].filter(([,n])=>n).sort(([x],[y])=>x.localeCompare(y));
}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
let count=0,checks=0;
for(const [suffix,expected] of Object.entries(steps)){
 const id='ex-main-'+suffix,c=available.get(id),m=c.visualization.model,part=suffix.at(-1);
 assert(Object.hasOwn(manifest.cards,id));viewer.prepare(m);
 assert.deepEqual(c.source.printedPages,[149]);assert.deepEqual(c.source.pdfPages,[151]);
 assert.deepEqual(new Set(['neutral',...c.help.map(h=>h.view),...c.steps.map(v=>v.view)]),new Set(Object.keys(m.views)));
 for(const [i,step] of c.steps.entries()){
  assert.equal(engine.classifyAnswer(expected[i],step.input.accepted).status,'correct',id+'/'+step.id);
  for(const w of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(w,step.input.accepted).status,'wrong');count++;
 }
 if(suffix.startsWith('0573')){
  const signs=terms[part],truth=signature('AB'),source=printed[part];
  assert.deepEqual(signature(source),truth);assert.equal(engine.classifyAnswer(source,c.answer.accepted).status,'correct');
  for(const form of c.answer.accepted)assert.deepEqual(signature(form),truth);
  let right=0;
  for(let bit=0;bit<8;bit++){
   const expr=signs.map((word,i)=>((bit>>i)&1?'-':i?'+':'')+word).join('');
   const valid=same(signature(expr),truth);
   assert.equal(engine.classifyAnswer(expr,c.answer.accepted).status,valid?'correct':'wrong',id+' '+expr);
   if(valid)right++;checks++;
  }
  assert.equal(right,1);
 }else{
  const truth=signature(original[part]);
  for(const expr of c.answer.accepted.filter(x=>x!=='нулевой вектор'))assert.deepEqual(signature(expr),truth);
  if(part==='a'){
   const vertices=['O','P','E','K','D','A'],answers=new Set();
   for(const a of vertices)for(const b of vertices)for(const e of vertices)for(const f of vertices){
    const expression=a+b+'+'+e+f;
    if(same(signature(expression),truth))answers.add(expression);
   }
   assert.deepEqual(answers,new Set(['AD+OE','OE+AD','AE+OD','OD+AE']));
   for(const expr of answers)assert.equal(engine.classifyAnswer(expr,c.answer.accepted).status,'correct');
  }else assert.deepEqual(truth,signature(part==='b'?'AK':'0'));
 }
}
assert.deepEqual(manifest.parts,{'573':['а','б','в'],'574':['а','б','в']});assert.equal(count,24);assert.equal(checks,24);
console.log('ATANASYAN_SIGNED_VECTOR_COMBINATIONS_OK: all printed expressions, 24 candidate sign patterns, four equivalent two-vector sums, 24 checked fields');
