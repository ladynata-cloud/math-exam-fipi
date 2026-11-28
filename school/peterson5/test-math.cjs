'use strict';
const assert=require('node:assert/strict');
const M=require('./math.js');
function gcd(a,b){if(a<0n)a=-a;if(b<0n)b=-b;while(b)[a,b]=[b,a%b];return a;}
function norm(n,d){if(!d)throw Error('zero');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return [n/g,d/g];}
// Independent oracle deliberately does not use the implementation parser/arithmetic.
function q(s){s=String(s).replace(',','.');if(s.includes('/')){const [n,d]=s.split('/');return norm(BigInt(n),BigInt(d));}const neg=s.startsWith('-');if(neg)s=s.slice(1);const p=s.split('.'),d=10n**BigInt((p[1]||'').length);return norm((neg?-1n:1n)*BigInt(p[0]+(p[1]||'')),d);}
function calc(op,a,b){a=Array.isArray(a)?a:q(a);b=Array.isArray(b)?b:q(b);if(op==='add')return norm(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);if(op==='subtract')return norm(a[0]*b[1]-b[0]*a[1],a[1]*b[1]);if(op==='multiply')return norm(a[0]*b[0],a[1]*b[1]);if(op==='divide')return norm(a[0]*b[1],a[1]*b[0]);throw Error(op);}
function solve(c){if(c.op==='gcd')return [gcd(BigInt(c.left),BigInt(c.right)),1n];if(c.op==='lcm')return [BigInt(c.left)*BigInt(c.right)/gcd(BigInt(c.left),BigInt(c.right)),1n];if(c.op==='identity')return q(c.left);if(c.op==='add-product')return calc('add',c.left,calc('multiply',c.right,c.third));return calc(c.op,c.left,c.right);}
for(const [input,expect] of [['0',{n:0,d:1}],['2,50',{n:5,d:2}],['.125',{n:1,d:8}],[',5',{n:1,d:2}],[' 6 / 8 ',{n:3,d:4}],['−2 1/3',{n:-7,d:3}],['+2 1 / 3',{n:7,d:3}],['-0 1/2',{n:-1,d:2}],['1.000000000001',null],['1000000000000',{n:1000000000000,d:1}]])assert.deepEqual(M.parse(input),expect,input);
for(const s of ['', ' ', 'NaN','Infinity','1/0','0/0','2//3','1/2/3','1e3','12abc','1 2/2','2 4/3','2-1/3','1,-2','1.','++2','--1','0x10','1+1','1/1000000000001','1000000000001','1/−2','2 1/0','9999999999999999999999999999999999999999','0.0000000000001','1,2.3','1\n2'])assert.equal(M.parse(s),null,s);
for(const [a,b] of [['2 1/3','7/3'],['0,25','1/4'],['−2.5','-5/2'],['-0 1/2','-1/2'],['12/18','2/3']])assert.equal(M.equal(a,b),true,a+' = '+b);
assert.equal(M.equal('','0'),false);assert.equal(M.equal('0.333333333333','1/3'),false);assert.equal(M.equal('1/0','1/0'),false);
assert.equal(M.check('2/4','1/2','reduced-fraction'),false);assert.equal(M.check('1/2','2/4','reduced-fraction'),true);assert.equal(M.check('3/1','3','reduced-fraction'),false);assert.equal(M.check('3','3','reduced-fraction'),true);
assert.equal(M.check('1 1/2','3/2','improper-fraction'),false);assert.equal(M.check('6/4','3/2','improper-fraction'),true);assert.equal(M.check('0,5','1/2','decimal'),true);assert.equal(M.check('1/2','0,5','decimal'),false);
assert.equal(M.check('2.0','2','integer'),false);assert.equal(M.check('2','2','integer'),true);assert.equal(M.check('2 2/4','2 1/2','mixed-number'),false);assert.equal(M.check('2 1/2','5/2','mixed-number'),true);
assert.equal(M.format('3/4'),'{{frac:3:4}}');assert.equal(M.format('-7/3'),'−{{frac:7:3}}');assert.equal(M.format(5),'5');assert.equal(M.decimal('1/125'),'0,008');assert.equal(M.decimal('-3/4'),'-0,75');assert.throws(()=>M.decimal('1/3'));
const known=[['add','1/3','0.25','7/12'],['subtract','1/4','1/2','-1/4'],['multiply','1 1/2','0.2','3/10'],['divide','0.4','2/3','3/5']];
for(const [op,a,b,expected]of known)assert.equal(M.equal(M.operation(op,a,b),expected),true,op);
// Progress files identify a generated exercise by skill, level and seed. Keep the
// published prompt, answer and required form for all 25 previously available skills.
const legacySkills=['fraction-reduce','fraction-mixed','fraction-add','fraction-subtract','fraction-multiply','fraction-divide','decimal-add','decimal-subtract','decimal-multiply','decimal-divide','decimal-to-fraction','fraction-to-decimal','mixed-multiply','mixed-divide','unlike-multiply','unlike-divide','order-operations','percent-part','percent-whole','percent-ratio','natural-multiply','natural-divide','natural-order','gcd','lcm'];
const newSkills=['letter-product','unlike-fraction-subtract','decimal-place-subtract'];
const ids=new Set(M.skills.map(s=>s.id));
assert.deepEqual([...ids].sort(),[...legacySkills,...newSkills].sort());
assert.equal(M.skills.length,ids.size);
for(const s of M.skills)for(const p of s.prerequisites)assert(ids.has(p));
const signatures=[];
for(const id of legacySkills)for(const seed of [1,2,43,991])for(const level of [1,2,3]){
 const t=M.generate(id,seed,level);
 signatures.push([id,seed,level,t.prompt,t.answer,t.answerFormat||'']);
}
const digest=require('node:crypto').createHash('sha256').update(JSON.stringify(signatures)).digest('hex');
assert.equal(digest,'775a5013be2b04409848a9dddacba8661e88088ed128ae84412a4d97d23ef0e8','300 published exercise signatures');

function checkLetterProduct(t,level){
 const expression=t.prompt.match(/(?:[a-z]|\d+)(?:\s*[·×*]\s*(?:[a-z]|\d+))+/);
 assert(expression,t.prompt);
 const factors=expression[0].split(/\s*[·×*]\s*/);
 const coefficients=factors.filter(v=>/^\d+$/.test(v)),letters=factors.filter(v=>/^[a-z]$/.test(v)).sort();
 assert.equal(coefficients.length,1,t.prompt);
 assert.equal(letters.length,level,t.prompt);
 // Letter order may be interchanged. Two such choices would make the question ambiguous.
 const valid=t.choices.filter(choice=>{
  const match=/^(\d+)([a-z]+)$/.exec(choice.trim());
  return match&&match[1]===coefficients[0]&&[...match[2]].sort().join('')===letters.join('');
 });
 assert.deepEqual(valid,[t.answer],t.prompt+' | '+t.choices.join(', '));
 assert.equal(t.kind,'choice');
 assert(t.choices.length>=3);
 assert.equal(new Set(t.choices).size,t.choices.length);
 assert.deepEqual(q(t.steps[0].answer),[BigInt(coefficients[0]),1n]);
 assert.deepEqual(q(t.steps[1].answer),[BigInt(letters.length),1n]);
}

function checkNewSubtraction(t,id,level){
 const prompt=t.prompt.replace(/\{\{frac:(\d+):(\d+)\}\}/g,'$1/$2');
 if(id==='unlike-fraction-subtract'){
  const pair=/(\d+)\/(\d+)\s*[−-]\s*(\d+)\/(\d+)/.exec(prompt);
  assert(pair,t.prompt);
  const [a,b,c,d]=pair.slice(1).map(BigInt);
  assert(a>0n&&a<b&&c>0n&&c<d&&b!==d,t.prompt);
  const common=b*d/gcd(b,d),first=a*(common/b),second=c*(common/d);
  assert.deepEqual(t.steps.map(step=>step.answer),[common,first,second,first-second].map(String),t.prompt);
  const expected=norm(a*d-c*b,b*d);
  assert(expected[0]>0n,t.prompt);
  assert.deepEqual(q(t.answer),expected,t.prompt);
  assert.equal(t.answerFormat,'reduced-fraction');
  const sum=norm(a*d+c*b,b*d);
  assert(!M.check(sum.join('/'),t.answer,t.answerFormat),'adding the numerators is not subtraction');
  assert(!M.check((expected[0]*2n)+'/'+(expected[1]*2n),t.answer,t.answerFormat));
 }else{
  const pair=/(\d+[.,]\d+)\s*[−-]\s*(\d+[.,]\d+)/.exec(prompt);
  assert(pair,t.prompt);
  const digits=pair.slice(1).map(v=>v.split(/[.,]/)[1]);
  assert.notEqual(digits[0].length,digits[1].length,t.prompt);
  if(level<=2)assert.equal(Math.max(digits[0].length,digits[1].length),level+1,t.prompt);
  const padded=digits.map(part=>part.padEnd(Math.max(...digits.map(d=>d.length)),'0'));
  assert([...padded[0]].some((digit,i)=>digit<padded[1][i]),'borrow between places: '+t.prompt);
  const expected=calc('subtract',pair[1],pair[2]);
  assert(expected[0]>0n,t.prompt);
  assert.deepEqual(q(t.answer),expected,t.prompt);
  assert.equal(t.answerFormat,'decimal');
  const places=Math.max(...digits.map(part=>part.length));
  const units=pair.slice(1).map(v=>{const [whole,part]=v.split(/[.,]/);return BigInt(whole+part.padEnd(places,'0'));});
  assert.deepEqual(t.steps.map(step=>step.answer),[...units,units[0]-units[1]].map(String),t.prompt);
  const misaligned=BigInt(pair[1].replace(/[.,]/,''))-BigInt(pair[2].replace(/[.,]/,''));
  assert.notDeepEqual(norm(misaligned,10n**BigInt(places)),expected,'left-alignment error must change the answer');
  assert(!M.check(expected[0]+'/'+expected[1],t.answer,t.answerFormat));
 }
 assert(!M.check('0',t.answer,t.answerFormat));
}
let generated=0,steps=0;const diversity={};
for(const skill of M.skills){const prompts=new Set();for(let level=1;level<=3;level++){for(let seed=1;seed<=100;seed++){
 const t=M.generate(skill.id,seed,level);generated++;prompts.add(t.prompt);assert.deepEqual(t,M.generate(skill.id,seed,level),'deterministic');
 if(skill.id==='letter-product')checkLetterProduct(t,level);
 else{
  assert.equal(t.kind,'number');assert.deepEqual(q(t.answer),solve(t.calculation),skill.id+' '+seed+' level '+level);assert(M.check(t.answer,t.answer,t.answerFormat),skill.id+' answer format');
  if(newSkills.includes(skill.id))checkNewSubtraction(t,skill.id,level);
 }
 assert(t.finalLabel&&t.prompt&&t.hint&&t.explanation);assert(t.steps.length>=2&&t.steps.length<=5);assert.deepEqual(t.skills,[skill.id]);assert(!/(undefined|NaN|Infinity)/.test(JSON.stringify(t)));
 for(const s of t.steps){steps++;assert(M.parse(s.answer),'valid step '+skill.id);assert(M.check(s.answer,s.answer,s.answerFormat),'step format '+skill.id);assert(s.prompt&&s.hint&&s.explanation);}
 if(t.answerFormat==='decimal')assert(/^-?\d+(?:,\d+)?$/.test(t.answer));
 }}diversity[skill.id]=prompts.size;assert(prompts.size>=120,skill.id+' diverse generated prompts '+prompts.size);}
assert.throws(()=>M.generate('bad',1));assert.throws(()=>M.generate('fraction-add',NaN));assert.throws(()=>M.generate('fraction-add',1,0));assert.throws(()=>M.generate('fraction-add',1,4));
// Validate browser export without exposing CommonJS.
const vm=require('node:vm'),fs=require('node:fs');const ctx={};vm.runInNewContext(fs.readFileSync(__dirname+'/math.js','utf8'),ctx);assert.equal(ctx.PetersonMath.equal('0,5','1/2'),true);
console.log(JSON.stringify({ok:true,skills:M.skills.length,generated,steps,knownChecks:'parser, exact arithmetic, answer formats, UMD',uniquePrompts:diversity},null,2));
