'use strict';
const assert=require('node:assert/strict');
const D=require('../ege-baza/path/data.js');
require('../ege-baza/path/practice.js');
require('../ege-baza/path/equation-practice.js');
const oldSeeds=[0,1,17,119,239,359,100003];
const oldTasks=D.meta.map(m=>({id:m.id,tasks:oldSeeds.map(seed=>JSON.stringify(D.task(m.id,seed)))}));
require('../ege-baza/path/grade7-foundations.js');

// Independent rational oracle: every operation is on integers, never rounded doubles.
const gcd=(a,b)=>b?gcd(b,a%b):a<0n?-a:a;
function R(n,d=1){n=BigInt(n);d=BigInt(d);assert.notEqual(d,0n);if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return [n/g,d/g];}
const add=(a,b)=>R(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
const sub=(a,b)=>R(a[0]*b[1]-b[0]*a[1],a[1]*b[1]);
const mul=(a,b)=>R(a[0]*b[0],a[1]*b[1]);
const div=(a,b)=>R(a[0]*b[1],a[1]*b[0]);
function parse(s){
 s=String(s).trim().replaceAll('−','-').replace(',','.');
 if(s.includes('/')){const [a,b]=s.split('/');return div(parse(a),parse(b));}
 const m=s.match(/^(-?)(\d+)(?:\.(\d+))?$/);assert(m,'Exact decimal or fraction: '+s);
 const tail=m[3]||'';return R(BigInt(m[2]+tail)*(m[1]?-1n:1n),10n**BigInt(tail.length));
}
const asString=r=>`${r[0]}/${r[1]}`;
function checkStep(s,expected){assert.deepEqual(parse(s.a),Array.isArray(expected)?expected:R(expected),s.q);}
function oracle(t){
 const p=t.params,s=t.steps,m=p.mode;
 switch(t.id){
  case 'grade7-b-mixed-borrow':{
   const left=add(R(p.A),R(p.p,p.d)),right=add(R(p.B),R(p.q,p.e)),answer=sub(left,right);
   assert(p.p/p.d<p.q/p.e,'Every variant really needs exchanging one whole.');
   const common=Number(BigInt(p.d*p.e)/gcd(BigInt(p.d),BigInt(p.e))),converted=p.p*common/p.d;
   let i=0;if(m===1){checkStep(s[i++],common);checkStep(s[i++],converted);}
   checkStep(s[i++],p.A-1);checkStep(s[i++],converted+common);checkStep(s[i++],converted+common-p.q);checkStep(s[i++],p.A-p.B-1);checkStep(s[i++],answer);
   assert.equal(i,s.length);assert(answer[0]>0n);return answer;
  }
  case 'grade7-b-fraction-product-cancel':{
   const answer=mul(R(...p.left),R(...p.right));let i=0;
   if(m===1)checkStep(s[i++],p.left[0]);if(m===2)checkStep(s[i++],p.c+1);
   checkStep(s[i++],p.c);checkStep(s[i++],m===1?p.right[1]/p.c:p.left[1]/p.c);checkStep(s[i++],answer);
   assert.equal(i,s.length);assert(p.left[1]>0&&p.right[1]>0);return answer;
  }
  case 'grade7-b-fraction-division-meaning':{
   const answer=div(R(...p.left),R(...p.right));assert(p.right[0]>0);
   checkStep(s[0],R(p.right[1],p.right[0]));checkStep(s[1],p.left[0]*p.right[1]);checkStep(s[2],p.left[1]*p.right[0]);checkStep(s[3],answer);
   assert.deepEqual(mul(answer,R(...p.right)),R(...p.left),'Multiplying quotient by divisor restores dividend.');return answer;
  }
  case 'grade7-b-decimal-place-align':{
   // Also evaluate the displayed expression, independently of the parameter total.
   const expression=t.q.match(/^Вычисли (.+)\. Записывай/)[1],terms=expression.split(' ');
   let answer=parse(terms[0]);for(let i=1;i<terms.length;i+=2)answer=terms[i]==='+'?add(answer,parse(terms[i+1])):sub(answer,parse(terms[i+1]));
   let i=0;checkStep(s[i++],p.scale);checkStep(s[i++],p.A);checkStep(s[i++],p.B);if(m===2)checkStep(s[i++],p.A+p.B);
   checkStep(s[i++],mul(answer,R(p.scale)));checkStep(s[i++],answer);assert.equal(i,s.length);
   assert.deepEqual(answer,R(p.A+p.sign*p.B-p.C,p.scale));assert(p.A>p.B);return answer;
  }
  case 'grade7-b-decimal-divisor-scale':{
   const parts=t.q.match(/^Вычисли (.+) : (.+)\.$/),left=parse(parts[1]),right=parse(parts[2]),answer=div(left,right);
   checkStep(s[0],10**p.bd);checkStep(s[1],p.b);checkStep(s[2],mul(left,R(10**p.bd)));checkStep(s[3],answer);
   assert.deepEqual(div(mul(left,R(10**p.bd)),mul(right,R(10**p.bd))),answer,'Same scaling preserves quotient.');assert(p.b>0);return answer;
  }
  case 'grade7-b-signed-fraction-sum':{
   const first=R((m===2?1:-1)*p.a,p.d),second=R((m===1?-1:1)*p.b,p.e),answer=add(first,second);
   const common=Number(BigInt(p.d*p.e)/gcd(BigInt(p.d),BigInt(p.e)));
   checkStep(s[0],common);checkStep(s[1],mul(first,R(common)));checkStep(s[2],mul(second,R(common)));checkStep(s[3],mul(answer,R(common)));checkStep(s[4],answer);return answer;
  }
  case 'grade7-b-ratio-units':{
   if(m===2){checkStep(s[0],p.total);checkStep(s[1],p.a+p.b);checkStep(s[2],R(p.total,p.a+p.b));checkStep(s[3],R(p.total*p.b,p.a+p.b));assert.deepEqual(parse(t.q.match(/длиной ([\d,]+) м/)[1]),R(p.total,100));return R(p.total*p.b,p.a+p.b);}
   const common=Number(gcd(BigInt(p.first),BigInt(p.second)));checkStep(s[0],m===0?p.first:p.second);checkStep(s[1],common);checkStep(s[2],p.first/common);checkStep(s[3],p.second/common);checkStep(s[4],R(p.first,p.second));
   if(m===0)assert.deepEqual(mul(parse(t.q.match(/лент ([\d,]+) м/)[1]),R(100)),R(p.first));
   else assert.deepEqual(mul(parse(t.q.match(/второго ([\d,]+) кг/)[1]),R(1000)),R(p.second));
   return R(p.first,p.second);
  }
  case 'grade7-b-percent-proportion':{
   const answer=m===0?div(mul(R(p.whole),R(p.p)),R(100)):m===1?div(mul(R(p.part),R(100)),R(p.p)):div(mul(R(p.part),R(100)),R(p.whole));
   assert.deepEqual(R(p.part,p.whole),R(p.p,100),'Same ratio for quantity and percent.');
   checkStep(s[0],100);checkStep(s[1],m===0?p.whole*p.p:p.part*100);checkStep(s[2],m===0?100:m===1?p.p:p.whole);checkStep(s[3],answer);
   assert(p.p>0&&p.p<100&&p.part<p.whole);assert(t.q.includes('пропорци'));assert(s[1].q.includes(' = '));return answer;
  }
  default:throw Error('Missing independent oracle '+t.id);
 }
}

assert.equal(D.grade7Foundations.families.length,8);
assert.equal(D.grade7Foundations.count,360);
assert.equal(new Set(D.meta.map(m=>m.id)).size,D.meta.length);
let total=0,steps=0,smallDecimalQuotients=0;const signs=new Set();
for(const family of D.grade7Foundations.families){
 const meta=D.meta.find(m=>m.id===family.id);for(const key of ['grade7','expanded','trainingOnly'])assert.equal(meta[key],true);assert.equal(meta.pos,null);assert.equal(meta.subject,'foundation');assert(meta.idea&&meta.gap);
 const unique=[new Set(),new Set(),new Set()];
 for(let seed=0;seed<360;seed++){
  const t=D.task(family.id,seed),expected=oracle(t),label=family.id+' seed '+seed;
  assert.equal(t.params.mode,Math.floor(seed/120));unique[t.params.mode].add(t.q);
  assert.deepEqual(parse(t.a),expected,label);assert.deepEqual(parse(t.answerExact),expected,label+' exact answer');
  assert.equal(t.answer,Number(expected[0])/Number(expected[1]));assert(D.correct(t,asString(expected)),label);assert(D.correct(t,D.answerText(t)),label+' answer text');
  assert(!D.correct(t,asString(add(expected,R(1)))));for(const invalid of ['', '1/0','abc'])assert(!D.correct(t,invalid));
  for(const s of t.steps){assert.equal(s.strict,true);assert(s.q&&s.why);assert(D.correct(s,D.answerText(s)),s.q);assert(!D.correct(s,asString(add(parse(s.a),R(1)))));assert(!D.correct(s,'1/0'));steps++;}
  assert(['plan','fraction-bars','ratio-parts','percent-base'].includes(t.model.kind));
  if(t.model.kind==='fraction-bars'){const [a,b]=t.model.fractions[0];assert(Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&a<=b&&b<=20);}
  if(t.model.kind==='ratio-parts'){assert(t.model.a>0&&t.model.b>0&&t.model.a+t.model.b<=24);assert.equal(t.model.total,t.params.total);assert.equal(t.model.unit,'см');assert.equal(t.model.total/(t.model.a+t.model.b)*t.model.b,t.answer,'Model and answer use the same centimetres.');}
  if(t.model.kind==='percent-base'){assert(t.model.whole>0&&t.model.p>0&&t.model.p<100);}
  if(family.id==='grade7-b-decimal-divisor-scale'&&t.answer<1){
   assert(t.answer>0);assert.equal(t.params.mode,1);assert.match(D.answerText(t),/^0,[1-9]$/,'A quotient below one keeps its leading zero.');
   assert.match(D.answerText(t.steps.at(-1)),/^0,[1-9]$/,'The worked final line keeps its leading zero.');
   assert(t.steps.at(-1).why.includes('в целой части частного запиши 0'));
   assert(D.correct(t,D.answerText(t)));assert(!D.correct(t,String(t.answer*10)),'Missing decimal place is rejected.');smallDecimalQuotients++;
  }
  if(family.id==='grade7-b-signed-fraction-sum'&&t.params.mode===0)signs.add(Math.sign(t.answer));
  const clone=D.task(family.id,seed);assert.deepEqual(clone,t,'deterministic '+label);assert.equal(D.task(family.id,seed+360).q,t.q);assert.equal(D.task(family.id,seed-360).q,t.q);total++;
 }
 unique.forEach((set,mode)=>assert.equal(set.size,120,`${family.id} mode ${mode} unique statements`));
}
assert(signs.has(-1)&&signs.has(0)&&signs.has(1),'Unlike signs cover negative, zero and positive results.');
assert.equal(smallDecimalQuotients,72,'The decimal-division mode includes 72 positive quotients below one.');
for(const old of oldTasks)assert.deepEqual(oldSeeds.map(seed=>JSON.stringify(D.task(old.id,seed))),old.tasks,old.id+' old seeds unchanged');
console.log(`GRADE7_FOUNDATIONS_OK: ${total} unique tasks, ${steps} exact intermediate steps, 24 structural modes, ${smallDecimalQuotients} leading-zero quotients, exact rational/display/decimal/unit/proportion checks, deterministic signed seeds, ${oldTasks.length*oldSeeds.length} legacy tasks unchanged`);
