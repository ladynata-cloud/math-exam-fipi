'use strict';
const assert=require('node:assert/strict');
const D=require('../ege-baza/path/data.js');require('../ege-baza/path/practice.js');require('../ege-baza/path/equation-practice.js');
const legacySeeds=[-499,-1,0,1,13,99,501],before=D.meta.map(m=>({id:m.id,tasks:legacySeeds.map(seed=>JSON.stringify(D.task(m.id,seed)))}));
require('../ege-baza/path/grade7-algebra.js');

// Independent exact rational arithmetic and parser for the actual displayed condition.
const gcd=(a,b)=>b?gcd(b,a%b):(a<0n?-a:a);
function R(a,b=1n){a=BigInt(a);b=BigInt(b);assert.notEqual(b,0n);if(b<0n){a=-a;b=-b;}const g=gcd(a,b);return {n:a/g,d:b/g};}
const add=(a,b)=>R(a.n*b.d+b.n*a.d,a.d*b.d),neg=a=>R(-a.n,a.d),sub=(a,b)=>add(a,neg(b)),mul=(a,b)=>R(a.n*b.n,a.d*b.d),div=(a,b)=>R(a.n*b.d,a.d*b.n);
const eq=(a,b,label)=>assert.deepEqual(a,b,label),num=r=>Number(r.n)/Number(r.d),str=r=>r.d===1n?String(r.n):`${r.n}/${r.d}`;
function evaluate(source,vars={}){
 const clean=String(source).replace(/\s/g,'').replaceAll('−','-').replaceAll('·','*').replaceAll(',','.');
 const tokens=clean.match(/\d+(?:\.\d+)?|[xy()+*/-]/g)||[];assert.equal(tokens.join(''),clean,'safe complete expression: '+source);
 let at=0;
 function atom(){let t=tokens[at++];if(t==='-')return neg(atom());if(t==='+')return atom();if(t==='('){const v=sum();assert.equal(tokens[at++],')');return v;}if(t==='x'||t==='y'){assert(vars[t],'missing variable '+t);return vars[t];}assert(/^\d+(\.\d+)?$/.test(t),'unexpected token '+t);const [whole,decimal='']=t.split('.');return R(whole+decimal,10n**BigInt(decimal.length));}
 function product(){let v=atom();while(at<tokens.length){const t=tokens[at];if(t==='*'||t==='/'){at++;v=(t==='*'?mul:div)(v,atom());}else if(t==='('||t==='x'||t==='y'||/^\d/.test(t)){v=mul(v,atom());}else break;}return v;}
 function sum(){let v=product();while(tokens[at]==='+'||tokens[at]==='-'){const op=tokens[at++];v=(op==='+'?add:sub)(v,product());}return v;}
 const result=sum();assert.equal(at,tokens.length,source);return result;
}
const rv=x=>evaluate(x),v=x=>num(rv(x));
function actualExpression(t){
 if(t.id.endsWith('substitution-negative-fraction'))return t.q.match(/^Найди значение (.+) при x = /)[1];
 return t.q.split('. ')[0];
}
function modelParts(t){return ['left','right'].map(side=>[t.model[side].filter(x=>x[1]===1).reduce((a,x)=>a+x[0],0),t.model[side].filter(x=>x[1]===0).reduce((a,x)=>a+x[0],0)]);}
let taskCount=0,stepCount=0;
for(const meta of D.grade7Algebra.families){
 const m=D.meta.find(m=>m.id===meta.id);assert(m.trainingOnly&&m.grade7&&m.expanded);assert.equal(m.pos,null);assert.equal(m.subject,'algebra');assert(m.gap&&m.idea);
 const conditions=[new Set(),new Set(),new Set()],answerSigns=new Set(),choicePositions=new Set();
 for(let seed=0;seed<D.grade7Algebra.count;seed++){
  const t=D.task(meta.id,seed),p=t.params,mode=p.mode;taskCount++;conditions[mode].add(t.q);
  assert.equal(t.id,meta.id);assert.equal(t.seed,seed);assert.equal(t.pos,null);assert(t.strict);assert(!/NaN|Infinity|undefined|<script/i.test(JSON.stringify(t)));
  const answer=rv(t.answer);assert(D.correct(t,str(answer)));assert(D.correct(t,`${answer.n*7n}/${answer.d*7n}`));assert(!D.correct(t,str(add(answer,R(1)))));
  for(const bad of ['', 'NaN','Infinity','1/0','<script>1</script>'])assert(!D.correct(t,bad));
  answerSigns.add(Math.sign(num(answer)));
  for(const s of t.steps){stepCount++;assert(s.strict&&s.q&&s.why);const a=rv(s.a);assert(D.correct(s,str(a)));assert(!D.correct(s,str(add(a,R(1)))));assert(!D.correct(s,'1/0'));if(s.choices){assert.equal(s.choices.length,3);assert.equal(new Set(s.choices.map(x=>x.label)).size,3);assert.equal(new Set(s.choices.map(x=>x.value)).size,3);assert(s.choices.some(x=>x.value===s.a));choicePositions.add(s.a);}}
  const ss=t.steps.map(s=>rv(s.a));let expected;
  if(meta.id.endsWith('expression-structure')){
   const exp=actualExpression(t),x=R(p.x);eq(evaluate(exp,{x}),answer,t.q);
   const correct=t.steps[0].choices.find(x=>x.value===t.steps[0].a).label;assert.equal(correct,['Сложение','Умножение','Деление'][mode]);
   expected=[null,R(mode===0?p.a*p.x:p.x+p.b),answer];
  }else if(meta.id.endsWith('opposite-expression')){
   const exp=actualExpression(t),constant=evaluate(exp,{x:R(0)}),coefficient=sub(evaluate(exp,{x:R(1)}),constant);eq(evaluate(exp,{x:R(p.x)}),answer,t.q);
   const choices=t.steps[0].choices;
   for(const c of choices){const matches=[-3,0,4].every(x=>{const a=evaluate(exp,{x:R(x)}),b=evaluate(c.label,{x:R(x)});return a.n===b.n&&a.d===b.d;});assert.equal(matches,c.value===t.steps[0].a,'expanded choice must be an identity');}
   expected=[null,coefficient,constant,answer];
  }else if(meta.id.endsWith('two-variable-collect')){
   const exp=actualExpression(t),constant=evaluate(exp,{x:R(0),y:R(0)}),a=sub(evaluate(exp,{x:R(1),y:R(0)}),constant),b=sub(evaluate(exp,{x:R(0),y:R(1)}),constant);
   eq(evaluate(exp,{x:R(p.x),y:R(p.y)}),answer,t.q);assert(t.steps[0].choices.find(x=>x.value===t.steps[0].a).label.startsWith('Слагаемые с x отдельно'));
   expected=[null,a,b,mul(a,R(p.x)),answer];
  }else if(meta.id.endsWith('substitution-negative-fraction')){
   const exp=actualExpression(t),x=R(p.num,p.den);eq(evaluate(exp,{x}),answer,t.q);
   const correct=t.steps[0].choices.find(x=>x.value===t.steps[0].a);eq(evaluate(correct.label),answer,'substitution option');
   const first=mode===0?mul(R(p.a),x):mode===1?mul(R(p.b),x):sub(x,R(p.b));expected=[null,first,answer];
  }else if(meta.id.endsWith('equation-word-perimeter')){
   const P=R(p.P),d=R(p.d),m=R(p.m);
   const width=mode===0?div(sub(P,mul(R(2),d)),R(4)):mode===1?div(P,mul(R(2),add(m,R(1)))):div(add(P,d),R(3));eq(width,answer,t.q);
   const other=mode===0?add(width,d):mode===1?mul(width,m):sub(width,d);assert(num(other)>0);if(mode===2)assert(num(other)<2*num(width));else assert(num(other)>num(width));
   const correct=t.steps[0].choices.find(x=>x.value===t.steps[0].a),[left,right]=correct.label.split(' = ');eq(evaluate(left,{x:width}),evaluate(right),'perimeter equation');
   const A=mode===0?4:mode===1?2*(p.m+1):3,B=mode===0?2*p.d:mode===1?0:-p.d;expected=[null,R(A),R(p.P-B),width,other,P];
   const [[ma,mb],[mc,md]]=modelParts(t);assert.deepEqual([ma,mb,mc,md],[A,B,0,p.P]);
  }else{
   const [left,right]=actualExpression(t).split(' = ');assert(left&&right,t.q);
   const l0=evaluate(left,{x:R(0)}),r0=evaluate(right,{x:R(0)}),la=sub(evaluate(left,{x:R(1)}),l0),ra=sub(evaluate(right,{x:R(1)}),r0);
   const root=div(sub(r0,l0),sub(la,ra));eq(root,answer,t.q);eq(evaluate(left,{x:answer}),evaluate(right,{x:answer}),'original root substitution');
   const [[A,B],[C,E]]=modelParts(t);const modelScale=meta.id.endsWith('equation-denominators')?p.d*p.f/Number(gcd(BigInt(p.d),BigInt(p.f))):meta.id.endsWith('equation-decimals')?p.scale:1;
   eq(mul(la,R(modelScale)),R(A));eq(mul(l0,R(modelScale)),R(B));eq(mul(ra,R(modelScale)),R(C));eq(mul(r0,R(modelScale)),R(E));assert.notEqual(A,C);assert.equal(t.model.root,num(root));assert(t.model.expansion.includes('равносильн'));
   const tail=[R(A-C),R(E-B),root,evaluate(left,{x:root})];
   expected=meta.id.endsWith('equation-two-brackets')?[R(A),R(B),R(E),...tail]:[R(modelScale),R(A),R(B),R(E),...tail];
   if(meta.id.endsWith('equation-denominators')&&mode===1)assert(t.steps[2].why.includes('Целое число вне дроби тоже'));
   assert(t.steps.at(-1).why.includes('Левая часть:'));assert(t.steps.at(-1).why.includes('правая часть:'));
  }
  assert.equal(expected.length,ss.length);expected.forEach((a,i)=>{if(a)eq(ss[i],a,meta.id+' seed '+seed+' step '+i);});
  for(const shift of [-1080,-360,360,720]){const same=D.task(meta.id,seed+shift);delete same.seed;const original={...t};delete original.seed;assert.deepEqual(same,original,'signed seed periodicity');}
 }
 for(const conditionsOfMode of conditions)assert.equal(conditionsOfMode.size,120,meta.id+' has 120 distinct conditions per structural mode');
 if(choicePositions.size)assert.equal(choicePositions.size,3,'correct choice position varies');
 if(meta.id.includes('equation-')&&!meta.id.endsWith('word-perimeter'))assert.deepEqual(answerSigns,new Set([-1,0,1]),'negative, zero and positive roots');
}
for(const legacy of before)assert.deepEqual(legacySeeds.map(seed=>JSON.stringify(D.task(legacy.id,seed))),legacy.tasks,legacy.id+' unchanged');
assert.equal(D.grade7Algebra.families.length,8);assert.equal(D.grade7Algebra.count,360);
console.log(`GRADE7_ALGEBRA_OK: ${taskCount} independently parsed exact conditions, ${stepCount} checked steps, 3 structural modes × 120 conditions per family, signed seed replay, choice identities, root checks and ${before.length*legacySeeds.length} legacy tasks preserved`);
