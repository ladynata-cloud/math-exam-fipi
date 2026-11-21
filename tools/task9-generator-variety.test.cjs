'use strict';

const {test,before}=require('node:test');
const assert=require('node:assert/strict');
let math,oracle,trainer;
const N=2000;
before(async()=>{
 math=await import('./oge-algebra-contract.lib.mjs');
 oracle=await import('./oge-algebra-contract.t9.mjs');
 trainer=math.loadTrainer('trainers/oge-task9-equations.html');
});
const number=f=>Number(f.n)/Number(f.d);
function coeff(terms,power){
 let result=math.R(0);
 for(const term of terms){
  const part=term.br?math.mul(term.br.k,coeff(term.br.inner,power)):(term.x===power?term.c:math.R(0));
  result=math.add(result,part);
 }
 return result;
}
function finite(f){let d=f.d;while(d%2n===0n)d/=2n;while(d%5n===0n)d/=5n;return d===1n;}
function shape(t){
 const side=terms=>terms.map(term=>term.br?'br':term.x===2?'x2':term.x===1?'x':'n').join('+');
 return side(t.p.Lt)+'='+side(t.p.Rt);
}
function sample(gid){
 const tasks=trainer.run(`RNG=mkRng(20261110);Array.from({length:${N}},()=>genTask(${JSON.stringify(gid)}))`);
 const eq=trainer.run('taskEqnHTML'),key=trainer.run('taskKey'),check=trainer.run('checkFinal');
 const answers=new Set(),equations=new Set(),denominators=new Set(),coefs=new Map(),shapes=new Set();
 let positive=0,negative=0,negativeFactor=0,bothPositive=0,bothNegative=0,mixed=0;
 for(const [i,t] of tasks.entries()){
  const r=oracle.answer(t),label=gid+' sample '+i;
  assert.equal(r.bad,undefined,label);
  assert.ok(math.eq(r.key,key(t)),label+' independently derived key');
  assert.ok(r.roots.every(finite),label+' roots are terminating decimals');
  assert.equal(check(t,math.str(r.key)).ok,true,label+' exact answer accepted');
  assert.equal(check(t,'99999').ok,false,label+' unrelated answer rejected');
  for(const root of r.roots)denominators.add(Number(root.d));
  answers.add(math.str(r.key));equations.add(eq(t));shapes.add(shape(t));
  if(r.key.n>0n)positive++;if(r.key.n<0n)negative++;
  const power=gid.startsWith('g_l')?1:2;
  const c=number(math.sub(coeff(t.p.Lt,power),coeff(t.p.Rt,power)));
  coefs.set(c,(coefs.get(c)||0)+1);
  if([...t.p.Lt,...t.p.Rt].some(term=>term.br&&term.br.k.n<0n))negativeFactor++;
  if(r.roots.length===2){
   const [lo,hi]=r.roots;
   if(lo.n>0n)bothPositive++;else if(hi.n<0n)bothNegative++;else if(lo.n<0n&&hi.n>0n)mixed++;
   assert.equal(check(t,math.str(r.roots[t.ask==='min'?1:0])).ok,false,label+' other root rejected');
  }
 }
 return {tasks,answers,equations,denominators,coefs,shapes,positive,negative,negativeFactor,bothPositive,bothNegative,mixed};
}
for(const gid of ['g_l1','g_l2','g_lb'])test(gid+': 2000 equations have varied divisors and decimal answers',()=>{
 const s=sample(gid),abs=new Map();for(const[k,n]of s.coefs)abs.set(Math.abs(k),(abs.get(Math.abs(k))||0)+n);
 assert.ok((abs.get(2)||0)<=N/4,'division by 2 stays occasional');
 assert.ok(Math.max(...abs.values())<=N/4,'no replacement dominant divisor');
 assert.ok(abs.has(1),'some equations finish without division');
 assert.ok(abs.size>=10,'at least ten absolute linear coefficients');
 for(const d of [1,2,4,5,8,10])assert.ok(s.denominators.has(d),'root denominator '+d);
 assert.ok(s.answers.size>=150,'answers extend beyond integers and halves');
 assert.ok(s.equations.size>=1850,'at least 92.5% distinct equations');
 assert.ok(s.positive>500&&s.negative>500,'both signs are common');
 if(gid==='g_lb'){
  assert.ok(s.shapes.size>=7,'one/two brackets and terms on different sides');
  assert.ok(s.negativeFactor>500,'negative bracket multipliers are common');
 }
});
test('g_qf: 2000 full quadratics vary coefficients and roots within basic arithmetic bounds',()=>{
 const s=sample('g_qf');
 for(const [i,t] of s.tasks.entries()){
  // Derive the coefficients from the displayed terms, without taskNorm or
  // the generator's chosen roots, so the arithmetic limit is independent.
  const [c,b,a]=[0,1,2].map(power=>math.sub(coeff(t.p.Lt,power),coeff(t.p.Rt,power)));
  const D=math.sub(math.mul(b,b),math.mul(math.R(4),math.mul(a,c)));
  assert.ok(math.cmp(b,math.R(-60))>=0&&math.cmp(b,math.R(60))<=0,'sample '+i+': |b| <= 60');
  assert.ok(math.cmp(c,math.R(-200))>=0&&math.cmp(c,math.R(200))<=0,'sample '+i+': |c| <= 200');
  assert.ok(math.cmp(D,math.R(0))>0&&math.cmp(D,math.R(1600))<=0,'sample '+i+': 0 < D <= 1600');
 }
 assert.equal(s.coefs.size,10);
 for(let a=1;a<=10;a++)assert.ok((s.coefs.get(a)||0)>=80,'leading coefficient '+a+' is represented');
 assert.ok((s.coefs.get(1)||0)<=N/4,'the formula denominator is not usually 2');
 assert.ok(Math.max(...s.coefs.values())<=N/4,'no leading coefficient dominates');
 // The bounded pool yields 1151–1197 distinct equations in four seeds
 // (1184 here, versus 700 before). The initial 1400 target encouraged
 // unnecessarily large discriminants; arithmetic bounds take priority.
 assert.ok(s.equations.size>=1100,`${s.equations.size} distinct equations out of ${N}`);assert.ok(s.answers.size>=120);
 assert.ok(s.bothPositive>100&&s.bothNegative>100&&s.mixed>500);
 for(const d of [1,2,4,5,8,10])assert.ok(s.denominators.has(d),'quadratic root denominator '+d);
});
test('g_qnc: 2000 factor-x tasks preserve zero and vary the other root',()=>{
 const s=sample('g_qnc');
 assert.ok(s.equations.size>=900);assert.ok(s.answers.size>=120);
 assert.ok([...s.coefs.keys()].some(a=>a<0)&&[...s.coefs.keys()].some(a=>a>0));
 for(const d of [1,2,4,5,8,10])assert.ok(s.denominators.has(d));
 for(const t of s.tasks)assert.ok(oracle.solve(t).roots.some(r=>r.n===0n),'zero root remains');
});
test('g_qnb: 2000 square tasks vary integer coefficients and noninteger square roots',()=>{
 const s=sample('g_qnb');
 assert.ok(s.equations.size>=250);assert.ok(s.answers.size>=50);
 assert.ok(s.coefs.size>=20);
 for(const d of [1,2,4,5])assert.ok(s.denominators.has(d));
 for(const t of s.tasks){const [lo,hi]=oracle.solve(t).roots;assert.ok(math.eq(math.neg(lo),hi));}
});
