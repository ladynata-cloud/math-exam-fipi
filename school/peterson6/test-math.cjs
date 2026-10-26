'use strict';
const assert=require('node:assert/strict');
const M=require('./math.js');
function gcd(a,b){if(a<0n)a=-a;if(b<0n)b=-b;while(b)[a,b]=[b,a%b];return a;}
function norm(n,d){if(!d)throw Error('zero');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return [n/g,d/g];}
// Independent oracle deliberately does not use the implementation parser/arithmetic.
function q(s){s=String(s).replace(',','.');if(s.includes('/')){const [n,d]=s.split('/');return norm(BigInt(n),BigInt(d));}const neg=s.startsWith('-');if(neg)s=s.slice(1);const p=s.split('.'),d=10n**BigInt((p[1]||'').length);return norm((neg?-1n:1n)*BigInt(p[0]+(p[1]||'')),d);}
function calc(op,a,b){a=Array.isArray(a)?a:q(a);b=Array.isArray(b)?b:q(b);if(op==='add')return norm(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);if(op==='subtract')return norm(a[0]*b[1]-b[0]*a[1],a[1]*b[1]);if(op==='multiply')return norm(a[0]*b[0],a[1]*b[1]);if(op==='divide')return norm(a[0]*b[1],a[1]*b[0]);throw Error(op);}
function solve(c){
 if(c.op==='identity')return q(c.left);
 if(c.op==='add-product')return calc('add',c.left,calc('multiply',c.right,c.third));
 if(c.op==='scale')return calc('divide',calc('multiply',c.left,c.right),'100');
 if(c.op==='proportion')return calc('divide',calc('multiply',c.left,c.third),c.right);
 if(c.op==='direct')return calc('multiply',calc('divide',c.right,c.left),c.third);
 if(c.op==='inverse')return calc('divide',calc('multiply',c.left,c.right),c.third);
 if(c.op==='parts')return calc('multiply',calc('divide',c.left,calc('add',c.right,c.third)),c.right);
 if(c.op==='abs'){const n=q(c.left);return [n[0]<0n?-n[0]:n[0],n[1]];}
 if(c.op==='maximum')return q(BigInt(c.left)>BigInt(c.right)?c.left:c.right);
 if(c.op==='base-value'){let value=0n;for(const digit of c.digits){assert(Number(digit)<c.base);value=value*BigInt(c.base)+BigInt(digit);}return [value,1n];}
 if(c.op==='equation')return calc('divide',calc('subtract',c.third,c.right),c.left);
 if(c.op==='like-terms')return calc('subtract',calc('add',c.left,c.right),c.third);
 if(c.op==='remaining-angle')return calc('subtract','180',calc('add',c.left,c.right));
 if(c.op==='volume')return calc('multiply',calc('multiply',c.left,c.right),c.third);
 if(c.op==='bracket')return calc('subtract',c.left,calc('subtract',c.right,c.third));
 if(c.op==='distance'){const n=calc('subtract',c.left,c.right);return [n[0]<0n?-n[0]:n[0],n[1]];}
 return calc(c.op,c.left,c.right);
}
for(const [input,expect] of [['0',{n:0,d:1}],['2,50',{n:5,d:2}],['.125',{n:1,d:8}],[',5',{n:1,d:2}],[' 6 / 8 ',{n:3,d:4}],['−2 1/3',{n:-7,d:3}],['+2 1 / 3',{n:7,d:3}],['-0 1/2',{n:-1,d:2}],['1.000000000001',null],['1000000000000',{n:1000000000000,d:1}]])assert.deepEqual(M.parse(input),expect,input);
for(const s of ['', ' ', 'NaN','Infinity','1/0','0/0','2//3','1/2/3','1e3','12abc','1 2/2','2 4/3','2-1/3','1,-2','1.','++2','--1','0x10','1+1','1/1000000000001','1000000000001','1/−2','2 1/0','9999999999999999999999999999999999999999','0.0000000000001','1,2.3','1\n2'])assert.equal(M.parse(s),null,s);
for(const [a,b] of [['2 1/3','7/3'],['0,25','1/4'],['−2.5','-5/2'],['-0 1/2','-1/2'],['12/18','2/3']])assert.equal(M.equal(a,b),true,a+' = '+b);
assert.equal(M.equal('','0'),false);assert.equal(M.equal('0.333333333333','1/3'),false);assert.equal(M.equal('1/0','1/0'),false);
assert.equal(M.check('2/4','1/2','reduced-fraction'),false);assert.equal(M.check('1/2','2/4','reduced-fraction'),true);assert.equal(M.check('3/1','3','reduced-fraction'),false);assert.equal(M.check('3','3','reduced-fraction'),true);
assert.equal(M.check('1 1/2','3/2','improper-fraction'),false);assert.equal(M.check('6/4','3/2','improper-fraction'),true);assert.equal(M.check('0,5','1/2','decimal'),true);assert.equal(M.check('1/2','0,5','decimal'),false);
assert.equal(M.check('2.0','2','integer'),false);assert.equal(M.check('2','2','integer'),true);
assert.equal(M.format('3/4'),'{{frac:3:4}}');assert.equal(M.format('-7/3'),'−{{frac:7:3}}');assert.equal(M.format(5),'5');assert.equal(M.decimal('1/125'),'0,008');assert.equal(M.decimal('-3/4'),'-0,75');assert.throws(()=>M.decimal('1/3'));
const known=[['add','1/3','0.25','7/12'],['subtract','1/4','1/2','-1/4'],['multiply','1 1/2','0.2','3/10'],['divide','0.4','2/3','3/5']];
for(const [op,a,b,expected]of known)assert.equal(M.equal(M.operation(op,a,b),expected),true,op);
assert.equal(M.skills.length,43);const ids=new Set(M.skills.map(s=>s.id));assert.equal(ids.size,43);for(const s of M.skills)for(const p of s.prerequisites)assert(ids.has(p));
let generated=0,steps=0;const diversity={};
for(const skill of M.skills){const prompts=new Set();for(let level=1;level<=3;level++){for(let seed=1;seed<=100;seed++){
 const t=M.generate(skill.id,seed,level);generated++;prompts.add(t.prompt);assert.deepEqual(t,M.generate(skill.id,seed,level),'deterministic');assert.deepEqual(q(t.answer),solve(t.calculation),skill.id+' '+seed+' level '+level);assert(M.check(t.answer,t.answer,t.answerFormat),skill.id+' answer format');assert(t.finalLabel&&t.prompt&&t.hint&&t.explanation);assert(t.steps.length>=2&&t.steps.length<=5);assert.equal(t.kind,'number');assert.deepEqual(t.skills,[skill.id]);assert(!/(undefined|NaN|Infinity)/.test(JSON.stringify(t)));
 for(const s of t.steps){steps++;assert(M.parse(s.answer),'valid step '+skill.id);assert(M.check(s.answer,s.answer,s.answerFormat),'step format '+skill.id);assert(s.prompt&&s.hint&&s.explanation);}
 if(t.answerFormat==='decimal')assert(/^-?\d+(?:,\d+)?$/.test(t.answer));
 }}diversity[skill.id]=prompts.size;assert(prompts.size>=120,skill.id+' diverse generated prompts '+prompts.size);}
assert.throws(()=>M.generate('bad',1));assert.throws(()=>M.generate('fraction-add',NaN));assert.throws(()=>M.generate('fraction-add',1,0));assert.throws(()=>M.generate('fraction-add',1,4));
// Validate browser export without exposing CommonJS.
const vm=require('node:vm'),fs=require('node:fs');const ctx={};vm.runInNewContext(fs.readFileSync(__dirname+'/math.js','utf8'),ctx);assert.equal(ctx.PetersonMath.equal('0,5','1/2'),true);
console.log(JSON.stringify({ok:true,skills:M.skills.length,generated,steps,knownChecks:'parser, exact arithmetic, answer formats, UMD',uniquePrompts:diversity},null,2));
