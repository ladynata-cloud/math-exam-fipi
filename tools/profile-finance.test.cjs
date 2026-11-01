'use strict';
// Public-parameter oracles deliberately do not read answer/answerExact, worked
// steps, or a production financial formula. They replay cash flows and search
// permitted integers; model tests separately protect disclosure and persistence.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const lessons = require('../ege-profil/start/finance-data.js');
const oldFinance = require('../ege-profil/start/applied-data.js').filter(l => l.position === 13);
const Check = require('../ege-profil/start/checks.js');
const State = require('../ege-profil/start/state.js');
const Checkpoint = require('../ege-profil/start/checkpoint.js');
const Models = require('../ege-profil/start/finance-tasks.js');
const tasks = lessons.flatMap(l => l.tasks);
const directory = path.resolve(__dirname, '../ege-profil/start');

// Exact decimal/rational arithmetic keeps strict boundaries (and kopecks) exact.
const gcd = (a,b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a,b] = [b,a%b]; return a; };
class Q {
  constructor(n,d=1n) { n=BigInt(n);d=BigInt(d);assert(d);if(d<0n){n=-n;d=-d;}const g=gcd(n,d);this.n=n/g;this.d=d/g; }
  static of(x) {
    if(x instanceof Q)return x;
    const s=String(x); if(s.includes('/')){const [a,b]=s.split('/');return Q.of(a).div(Q.of(b));}
    assert(/^-?\d+(?:\.\d+)?$/.test(s),'Exact public parameter: '+s);
    const [a,b='']=s.split('.');return new Q(BigInt(a+b),10n**BigInt(b.length));
  }
  add(v){v=Q.of(v);return new Q(this.n*v.d+v.n*this.d,this.d*v.d);}
  sub(v){return this.add(Q.of(v).neg());} neg(){return new Q(-this.n,this.d);}
  mul(v){v=Q.of(v);return new Q(this.n*v.n,this.d*v.d);}
  div(v){v=Q.of(v);return new Q(this.n*v.d,this.d*v.n);}
  cmp(v){v=Q.of(v);const x=this.n*v.d-v.n*this.d;return x<0n?-1:x>0n?1:0;}
  num(){return Number(this.n)/Number(this.d);} text(){return this.d===1n?String(this.n):this.n+'/'+this.d;}
}
const q = Q.of, sum = xs => xs.reduce((a,b)=>a.add(b),q(0));
const rate = x => q(x).div(100);
function loan(initial,r,after) {
  let before=q(initial);r=q(r);const rows=[];
  for(const remaining of after){const after=q(remaining),interest=before.mul(r),principal=before.sub(after),payment=principal.add(interest);
    assert(after.cmp(0)>=0);assert(payment.cmp(0)>0);rows.push({before,interest,withInterest:before.add(interest),principal,payment,after});before=after;}
  assert.equal(before.text(),'0','The loan closes after its last real payment');
  assert.equal(sum(rows.map(x=>x.payment)).text(),q(initial).add(sum(rows.map(x=>x.interest))).text());
  return rows;
}
function decreasing(S,r,n){S=q(S);return loan(S,r,Array.from({length:n},(_,i)=>S.mul(n-i-1).div(n)));}
function paymentTotal(rows){return sum(rows.map(x=>x.payment));}
function repaidWithEqualPayments(S,r,n){
  // Repeated backward substitution determines the initial debt covered by one
  // unit payment. Scaling that schedule finds the required payment.
  const factor=q(1).add(r);let covered=q(0);
  for(let k=0;k<n;k++)covered=covered.add(1).div(factor);
  const A=q(S).div(covered);let D=q(S);const after=[];
  for(let k=0;k<n;k++){D=D.mul(factor).sub(A);after.push(D);}
  return loan(S,r,after);
}
function findInteger(predicate,max=100000){for(let n=1;n<=max;n++)if(predicate(n))return n;assert.fail('No admissible integer in the public domain');}
function rootRate(balance,target){let lo=0,hi=1;while(balance(hi)<target)hi*=2;for(let i=0;i<100;i++){const mid=(lo+hi)/2;if(balance(mid)<target)lo=mid;else hi=mid;}return (lo+hi)/2;}
function reverse(S,payments,r){let D=q(S);const after=[];for(const A of payments){D=D.mul(q(1).add(r)).sub(A);after.push(D);}return after;}
function twoStage(S,M,n,a,r){S=q(S);M=q(M);const b=n-a;return loan(S,r,[...Array.from({length:a},(_,i)=>S.sub(S.sub(M).mul(i+1).div(a))),...Array.from({length:b},(_,i)=>M.mul(b-i-1).div(b))]);}
function deposit(initial,r,operations){let D=q(initial);const rows=[];for(const operation of operations){const before=D,op=q(operation),interest=before.add(op).mul(r);D=before.add(op).add(interest);rows.push({before,operation:op,start:before.add(op),rate:q(r).mul(100),interest,after:D});}return {answer:D,rows};}

function oracle(source,m){
  let answer,rows;const r=rate(m.rate_percent_per_period??m.annual_rate_percent??m.rate_percent??0);
  switch(String(source)){
    case '513106':rows=loan(1,r,m.after_fractions_of_initial);answer=sum(rows.map(x=>x.interest)).mul(100);break;
    case '517569':{
      const S=q(m.principal_rub),T=q(m.total_payments_rub);
      const n=findInteger(n=>paymentTotal(decreasing(S,r,n)).cmp(T)===0,300);rows=decreasing(S,r,n);answer=q(n);break;
    }
    case '517568':case '526293':case '624083':{
      const S=q(m.principal_rub),P=q(m.minimum_payment_rub);
      const n=findInteger(n=>decreasing(S,r,n).at(-1).payment.cmp(P)===0,300);rows=decreasing(S,r,n);answer=paymentTotal(rows).div(source==='526293'?1000000:1);break;
    }
    case '701456':{
      const fraction=q(1).sub(rate(m.decrease_percent_of_previous));
      const unit=loan(1,r,[fraction,fraction.mul(fraction),0]);
      const S=q(m.total_payments_rub).div(paymentTotal(unit));rows=loan(S,r,[S.mul(fraction),S.mul(fraction).mul(fraction),0]);answer=S.div(1000);break;
    }
    case '630129':{
      const S=q(m.principal_rub),after=reverse(S,m.first_two_payments_rub,r);rows=loan(S,r,[...after,0]);answer=paymentTotal(rows);break;
    }
    case '630219':case '672873':{
      const A=q(source==='630219'?m.first_two_payments_rub[0]:m.first_two_payments_thousand),B=q(source==='630219'?m.last_payment_rub:m.last_payment_thousand),factor=q(1).add(r);
      let S=B.div(factor);S=S.add(A).div(factor);S=S.add(A).div(factor);rows=loan(S,r,[...reverse(S,[A,A],r),0]);answer=S.div(source==='630219'?1000:1);break;
    }
    case '643163':{
      const unit=loan(1,r,m.after_fractions_of_initial),T=paymentTotal(unit),limit=q(m.total_strictly_greater_than_millions);
      const n=findInteger(n=>T.mul(n).cmp(limit)>0);assert(T.mul(n-1).cmp(limit)<=0);rows=loan(n,r,m.after_fractions_of_initial.map(x=>q(x).mul(n)));answer=q(n);break;
    }
    case '517503':case '660699':case '704627':{
      const S=q(m.principal_rub??m.principal_rubles);rows=repaidWithEqualPayments(S,r,m.periods??m.years);answer=paymentTotal(rows);break;
    }
    case '517574':{
      const S=Number(m.principal_rub),payments=m.payments_rub.map(Number);
      const x=rootRate(x=>payments.reduce((D,A)=>D*(1+x)-A,S),0);answer=x*100;const exactRate=q(Number(answer.toFixed(9))).div(100);rows=loan(m.principal_rub,exactRate,reverse(m.principal_rub,m.payments_rub,exactRate));break;
    }
    case '561179':{
      const oldRate=rate(m.original_rate_percent);rows=repaidWithEqualPayments(m.principal_rub,oldRate,2);
      const reducedLast=rows[0].after.mul(q(1).add(rate(m.new_second_period_rate_percent)));answer=rows[1].payment.sub(reducedLast);const before=rows[0].after,interest=before.mul(rate(m.new_second_period_rate_percent));rows[1]={before,interest,withInterest:before.add(interest),principal:before,payment:reducedLast,after:q(0)};break;
    }
    case '628752':{
      let S=q(0);for(let j=0;j<m.periods;j++)S=S.add(m.equal_payment_rub).div(q(1).add(r));rows=repaidWithEqualPayments(S,r,m.periods);answer=S;break;
    }
    case '630110':{
      const S=q(m.principal_rub),tail=repaidWithEqualPayments(S,r,2);rows=loan(S,r,[S,S,S,tail[0].after,0]);answer=rows.at(-1).payment.sub(rows[0].payment).div(1000000);break;
    }
    case '707183':{
      const unit=repaidWithEqualPayments(1,r,m.periods),over=paymentTotal(unit).sub(1),S=q(m.overpayment_rub).div(over);rows=repaidWithEqualPayments(S,r,m.periods);answer=S;break;
    }
    case '517203':{
      const S=q(m.principal_million),C=S.div(m.years);answer=q(m.min_last_payment_million).sub(C).div(C).mul(100);rows=decreasing(S,answer.div(100),m.years);break;
    }
    case '517480':{
      const S=q(m.principal_million),P=q(m.max_payment_million),n=findInteger(n=>decreasing(S,r,n)[0].payment.cmp(P)===0,300);rows=decreasing(S,r,n);answer=paymentTotal(rows);break;
    }
    case '525142':case '525414':case '526017':case '548818':{
      const coefficients=m.balance_coefficients_exact.slice(1),unit=loan(1,r,coefficients),limit=q(m.limit);
      const admissible=n=>{const values=m.constraint==='total_lt'?[paymentTotal(unit).mul(n)]:unit.map(x=>x.payment.mul(n));return values.every(x=>m.constraint==='each_le'?x.cmp(limit)<=0:x.cmp(limit)<0);};
      const firstBad=findInteger(n=>!admissible(n));answer=q(firstBad-1);assert(admissible(firstBad-1));assert(!admissible(firstBad));rows=loan(answer,r,coefficients.map(x=>q(x).mul(answer)));break;
    }
    case '630122':case '697032':{
      const S=q(m.principal_thousand),B=q(m.last_payment_thousand),factor=q(1).add(r);
      // Separate the accumulated debt with no first-two payments from the
      // amount removed by a unit payment on each of those two dates.
      const unpaid=S.mul(factor).mul(factor).mul(factor),removed=factor.mul(factor).add(factor),A=unpaid.sub(B).div(removed);
      rows=loan(S,r,[...reverse(S,[A,A],r),0]);answer=source==='630122'?A.mul(1000):paymentTotal(rows);break;
    }
    case '630197':{
      const S=q(m.principal_thousand),A=q(m.first_two_payments_thousand);rows=loan(S,r,[...reverse(S,[A,A],r),0]);answer=rows.at(-1).payment;break;
    }
    case '704682':{const v=deposit(m.initial_million,r,[0,m.additions_years_2_3_million,m.additions_years_2_3_million]);({answer,rows}=v);break;}
    case '704683':{const W=q(m.withdrawals_years_2_3_4_thousand).neg(),v=deposit(m.initial_thousand,r,[0,W,W,W]);rows=v.rows;answer=v.answer.mul(1000);break;}
    case '704684':{
      const A=q(m.additions_years_2_3_thousand),factor=q(1).add(r);let S=q(m.final_thousand);for(const addition of [A,A,q(0)])S=S.div(factor).sub(addition);const v=deposit(S,r,[0,A,A]);rows=v.rows;answer=S;break;
    }
    case '704685':{const S=Number(m.initial_thousand),T=Number(m.final_thousand);answer=rootRate(x=>S*(1+x)**m.years,T)*100;rows=deposit(m.initial_thousand,q(Number(answer.toFixed(9))).div(100),Array(m.years).fill(0)).rows;break;}
    case '704686':{
      let variable=q(m.initial_rubles);for(const pct of m.variable_rates_percent)variable=variable.mul(q(1).add(rate(pct)));
      const fixedSchedule=deposit(m.initial_rubles,rate(m.fixed_rate_percent),[0,0,0]),fixed=fixedSchedule.answer;rows=[...fixedSchedule.rows];let D=q(m.initial_rubles);for(const pct of m.variable_rates_percent){const next=deposit(D,rate(pct),[0]);rows.push(...next.rows);D=next.answer;}answer=fixed.sub(variable);if(answer.cmp(0)<0)answer=answer.neg();break;
    }
    case 'fipi-two-stage-principal':{
      const n=m.years,a=m.split_after,M=q(m.midpoint_thousand),T=q(m.total_thousand);
      // Difference of two legal schedules gives the price of one extra unit
      // of initial principal while the same midpoint remains fixed.
      const low=M.add(1),base=paymentTotal(twoStage(low,M,n,a,r)),next=paymentTotal(twoStage(low.add(1),M,n,a,r));
      const S=low.add(T.sub(base).div(next.sub(base)));rows=twoStage(S,M,n,a,r);answer=S;break;
    }
    case 'fipi-two-stage-rate':{
      const S=q(m.principal_thousand),M=q(m.midpoint_thousand),unit=twoStage(S,M,m.years,m.split_after,1),bases=sum(unit.map(x=>x.before));answer=q(m.total_thousand).sub(S).div(bases).mul(100);rows=twoStage(S,M,m.years,m.split_after,answer.div(100));break;
    }
    case 'fipi-first-months-rate':{
      const S=q(m.principal_thousand),n=m.months,unit=decreasing(S,0,n).slice(m.window_start-1,m.window_end),bases=sum(unit.map(x=>x.before)),principal=sum(unit.map(x=>x.principal));
      answer=q(m.window_total_thousand).sub(principal).div(bases).mul(100);rows=decreasing(S,answer.div(100),n);break;
    }
    case 'fipi-late-year-principal':{
      const unit=decreasing(1,r,m.months).slice(m.window_start-1,m.window_end);answer=q(m.window_total_million).div(paymentTotal(unit));rows=decreasing(answer,r,m.months);break;
    }
    case 'fipi-two-stage-midpoint':{
      const S=q(m.principal_thousand),n=m.years,a=m.split_after,base=paymentTotal(twoStage(S,1,n,a,r)),next=paymentTotal(twoStage(S,2,n,a,r));
      const M=q(1).add(q(m.total_thousand).sub(base).div(next.sub(base)));rows=twoStage(S,M,n,a,r);answer=M.mul(1000);break;
    }
    case 'fipi-balloon-total':{
      const S=q(m.principal_thousand),M=q(m.balance_after_regular_thousand),k=m.regular_months;assert.equal(m.periods,k+1);const C=S.sub(M).div(k);
      rows=loan(S,rate(m.rate_percent_per_month),[...Array.from({length:k},(_,i)=>S.sub(C.mul(i+1))),0]);answer=paymentTotal(rows).mul(1000);break;
    }
    case 'fipi-four-equal-total-to-principal':{
      const A=q(m.total_rub).div(m.years);let S=q(0);for(let i=0;i<m.years;i++)S=S.add(A).div(q(1).add(r));rows=repaidWithEqualPayments(S,r,m.years);answer=S;break;
    }
    default:assert.fail('Missing independent mathematical oracle for '+source);
  }
  return {answer:answer instanceof Q?answer.num():answer,exact:answer instanceof Q?answer.text():null,rows};
}

function closeEnough(actual,expected,label){assert(Math.abs(actual-expected)<=Math.max(1e-9,Math.abs(expected)*5e-15),`${label}: ${actual} vs ${expected}`);}
function finiteDecimal(exact){let d=q(exact).d;while(d%2n===0n)d/=2n;while(d%5n===0n)d/=5n;return d===1n;}

test('13 complete lessons add 39 guided/independent pairs and keep finite exam answers',()=>{
  assert.equal(lessons.length,13);assert.equal(tasks.length,78);assert.equal(tasks.reduce((n,t)=>n+t.steps.length,0),442);
  assert.equal(new Set(tasks.map(t=>t.id)).size,78);assert.equal(new Set(tasks.map(t=>String(t.meta.sourceId))).size,39);
  const pairs=new Map();
  for(const l of lessons){assert.equal(l.position,13);assert.equal(l.group,'finance');assert.equal(l.tasks.length,6);
    for(const [i,t] of l.tasks.entries()){
      assert.equal(t.role,i<3?'guided':'independent',t.id);assert.equal(t.meta.kind,'finance-authored');assert.equal(t.finance.schema,1);
      assert(t.prompt&&t.question&&t.unit,t.id+': complete question and explicit target unit');assert.equal(t.strictNumeric,true);assert(finiteDecimal(t.answerExact),t.id);
      assert(t.steps.length>=2&&t.steps.length<=9);assert.equal(q(t.steps.at(-1).answerExact).text(),q(t.answerExact).text(),t.id+': walkthrough reaches target');
      for(const s of t.steps){assert(s.prompt&&s.hint&&s.why&&s.retry,t.id+': complete numerical step');assert.equal(typeof s.unit,'string',t.id+': explicitly typed unit, empty only for a dimensionless intermediate');assert.equal(s.strictNumeric,true);closeEnough(s.answer,q(s.answerExact).num(),t.id+': exact intermediate');assert(Check.check(s.answer,s.answerExact,s.choices,s),t.id+': exact fractional answer accepted');if(s.domain==='integer')assert(Number.isInteger(Number(s.answer)));}
      if(t.target.integer_required)assert.equal(t.domain,'integer',t.id);
      const key=String(t.meta.sourceId);if(!pairs.has(key))pairs.set(key,[]);pairs.get(key).push(t);
      assert.doesNotMatch(JSON.stringify(t),/\/workspace\/|\/tmp\/|embedded-\d|file-inline-libfile|API[_-]?KEY/iu,'No private attachment or machine details');
    }
  }
  for(const pair of pairs.values()){assert.equal(pair.length,2);assert.deepEqual(pair.map(t=>t.role).sort(),['guided','independent']);assert.notDeepEqual(pair[0].meta.parameters,pair[1].meta.parameters,'Independent sibling changes public values');}
});

test('all 78 financial answers follow independent cash-flow oracles and boundary neighbours',()=>{
  for(const t of tasks){const value=oracle(String(t.meta.sourceId),t.meta.parameters);closeEnough(t.answer,value.answer,t.id);if(value.exact)assert.equal(q(t.answerExact).text(),q(value.exact).text(),t.id+': exact answer');}
});

test('every authored ledger cell agrees with the independent recurrence in its declared unit',()=>{
  const nativeThousand=new Set(['630122','630197','672873','697032','704683','704684','704685','548818','fipi-two-stage-principal','fipi-two-stage-rate','fipi-first-months-rate','fipi-two-stage-midpoint','fipi-balloon-total']);
  const nativeMillion=new Set(['517203','517480','525142','525414','526017','643163','704682','fipi-late-year-principal']);
  const unitRubles={'rubles':q(1),'thousand-rubles':q(1000),'million-rubles':q(1000000)};
  let count=0;
  for(const t of tasks){
    const sid=String(t.meta.sourceId),expected=oracle(sid,t.meta.parameters).rows;assert(expected&&expected.length,t.id+': full independent ledger');
    assert.equal(t.finance.rows.length,expected.length,t.id+': no imaginary extra interest period');
    const native=nativeThousand.has(sid)?q(1000):nativeMillion.has(sid)?q(1000000):q(1);
    const conversion=t.finance.scale==='principal-fraction'?q(1).div(expected[0].before):native.div(unitRubles[t.finance.scale]);
    for(let i=0;i<expected.length;i++)for(const [column,cell] of Object.entries(t.finance.rows[i].cells)){
      assert(expected[i][column] instanceof Q,t.id+': oracle covers accounting column '+column);
      const value=column==='rate'?expected[i][column]:expected[i][column].mul(conversion);
      if(cell.valueExact===undefined){assert.equal(sid,'517203');assert.equal(column,'payment');assert.equal(i,expected.length-1);assert(cell.given&&/^≥ /.test(cell.display),'A given lower bound is explicitly a bound');closeEnough(Check.number(cell.display.slice(2).replace(/ /g,'')),value.num(),t.id+': minimum rate attains the stated boundary');}
      else {assert.equal(q(cell.valueExact).text(),value.text(),t.id+': '+i+'/'+column+' in '+t.finance.scale);closeEnough(cell.value,value.num(),t.id+': numeric ledger value');}count++;
    }
  }
  assert.equal(count,tasks.reduce((n,t)=>n+t.finance.rows.reduce((a,r)=>a+Object.keys(r.cells).length,0),0),'The gate verifies every ledger value, not only displayed first rows');
});

test('large money and whole-period checks reject near answers while accepting exact fractions',()=>{
  const money=tasks.find(t=>t.unit==='руб.'&&t.answer>=1000000)||tasks.find(t=>t.answer>=1000000);assert(money);
  assert.equal(Check.check(money.answer,String(money.answer+0.01),null,money),false,'A kopeck error is not accepted as a correct large rouble amount');
  const integers=tasks.flatMap(t=>[t,...t.steps]).filter(q=>q.domain==='integer');assert(integers.length>5);
  for(const question of integers){assert.equal(Check.check(question.answer,String(question.answer+1e-8),question.choices,question),false);assert.equal(Check.check(question.answer,String(question.answer+0.1),question.choices,question),false);}
  const fractions=tasks.flatMap(t=>t.steps).filter(s=>!finiteDecimal(s.answerExact));assert(fractions.length>0);
  for(const question of fractions)assert(Check.check(question.answer,question.answerExact,question.choices,question));
  assert(Check.check(10000000,'10000000'),'An exact large legacy answer remains accepted');
  assert(!Check.check(10000000,'10000000.5'),'Large legacy amounts no longer accept a half-rouble error');
  assert(Check.check(9,'9.00000001'),'Existing integer-looking questions remain backward compatible without domain metadata');
});

test('mixed checkpoint forwards financial units and integer constraints to the real checker',()=>{
  const candidates=lessons.flatMap(l=>l.tasks.slice(3));
  const money=candidates.find(t=>/руб/.test(t.unit)&&t.answer>=1000000),integer=candidates.find(t=>t.domain==='integer');assert(money&&integer);
  function atTask(task){
    const memory=new Map(),storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},state=State.create(lessons,storage);
    for(const other of candidates)if(other.id!==task.id)state.data.seen[other.id]=1;state.persist();
    const checkpoint=Checkpoint.create(lessons,storage,state);let view=checkpoint.startRound();
    while(view.number!==13){assert(view.unavailable);view=checkpoint.next();}
    assert.equal(view.task.id,task.id);return {checkpoint,view};
  }
  for(const [task,input,correct] of [[money,String(money.answer+0.01),false],[integer,String(integer.answer+1e-8),false],[money,money.answerExact,true],[integer,integer.answerExact,true]]){
    const {checkpoint,view}=atTask(task);checkpoint.submit(input,Check.check,view.token);assert.equal(checkpoint.current().correct,correct,task.id+': checkpoint keeps domain/tolerance rules');assert.equal(checkpoint.current().submitted,true);
  }
});

test('original 18 task objects and previously saved steps are byte-for-byte stable',()=>{
  const originalTasks=oldFinance.flatMap(l=>l.tasks);assert.equal(originalTasks.length,18);
  // Normalized task objects from approved base a8eb6b26c917c337a3f9672c0b8eb40243f6e6a3.
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(originalTasks)).digest('hex'),'7bb74f4eb0346329de22e209d0f66bb7b99a2f67aef9840e8debea8114d50084');
  const l=oldFinance.find(l=>l.tasks[0].steps.length>=3),t=l.tasks[0],key=l.id+':guided';
  const saved={taskId:t.id,step:2,wrong:false,assisted:true,familiar:false,done:false,draft:'1/7',answers:t.steps.slice(0,2).map(s=>String(s.answer)),started:'2026-10-29T12:00:00.000Z',registered:false};
  const memory=new Map([[State.KEY,JSON.stringify({version:1,records:{[l.id]:{guided:[t.id],independent:[],attempts:1}},seen:{[t.id]:1},sessions:{[key]:saved}})]]);
  const storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
  const state=State.create([...oldFinance,...lessons],storage);assert.equal(state.warning,'');assert.deepEqual(state.start(l.id,'guided'),saved);assert(state.persist());
  const reloaded=State.create([...oldFinance,...lessons],storage);assert.deepEqual(reloaded.data.sessions[key],saved);assert.deepEqual(reloaded.record(l.id),{guided:[t.id],independent:[],attempts:1});
});

function serialized(v){return JSON.parse(JSON.stringify(v));}
function sceneRows(scene){assert(Array.isArray(scene.rows));return scene.rows;}
function sceneCells(scene){return sceneRows(scene).flatMap(row=>Object.values(row.cells));}
function assertSanitized(scene,label){
  for(const cell of sceneCells(scene)){
    assert.equal(typeof cell.visible,'boolean',label);assert.equal(Object.hasOwn(cell,'value'),false,label);assert.equal(Object.hasOwn(cell,'valueExact'),false,label);
    if(!cell.visible){assert.equal(cell.display,'…',label);assert(cell.locked,label);}else assert(cell.given||cell.earned,label+': displayed calculated values must be earned');
  }
}

test('all models reveal calculated cells only after accepted work, never from a guessed future step',()=>{
  assert.equal(Models.ids.length,78);
  for(const t of tasks){
    for(let completed=0;completed<=t.steps.length;completed++){
      const scene=Models.sceneFor(t,{mode:'guided',completed,step:Math.min(completed,t.steps.length-1),solved:completed===t.steps.length});assertSanitized(scene,t.id);
      for(const row of scene.rows)for(const cell of Object.values(row.cells))if(cell.earned)assert(completed>0,t.id+': no earned cells initially');
    }
    const future=Models.sceneFor(t,{mode:'guided',completed:0,step:t.steps.length-1,solved:true});assert.equal(sceneCells(future).filter(c=>c.earned).length,0,t.id+': a future question index is not accepted work');
    const hidden=Models.sceneFor(t,{mode:'independent',completed:0,step:0,solved:false});
    const forged=Models.sceneFor(t,{mode:'independent',completed:t.steps.length,step:t.steps.length,solved:false});
    assertSanitized(hidden,t.id);assertSanitized(forged,t.id);assert.deepEqual(sceneRows(forged),sceneRows(hidden),t.id+': completed counter alone cannot disclose independent solution');
    const solved=Models.sceneFor(t,{mode:'independent',completed:1,step:0,solved:true});assertSanitized(solved,t.id);assert(sceneCells(solved).some(c=>c.earned),t.id+': solved task exposes calculation for review');
  }
});

test('unknown loan duration cannot leak through row count, pager, hidden metadata, or focus',()=>{
  const unknown=tasks.filter(t=>t.finance.revealScheduleAfter>0||t.finance.revealScheduleAfter===null);assert(unknown.length>=6);
  for(const t of unknown){
    const original=Models.sceneFor(t,{mode:'guided',completed:0,step:0,solved:false});assert.equal(original.scheduleLocked,true,t.id);assert.equal(original.totalRows,null,t.id);assert.equal(original.window.total,null,t.id);assert.equal(original.window.canNext,false,t.id);assert.equal(original.window.canPrevious,false,t.id);
    assert.equal(original.rows.length,3,t.id+': first/next/last symbolic preview');
    const altered=serialized(t);altered.finance.rows=Array.from({length:97},(_,i)=>({...serialized(t.finance.rows[0]),label:'Скрытый период '+i,cells:{before:{display:'SECRET_'+i,given:false,revealAfter:null}}}));
    const alternative=Models.sceneFor(altered,{mode:'guided',completed:0,step:0,solved:false});assert.deepEqual(serialized(alternative),serialized(original),t.id+': hidden true term must not affect the scene');
    assert.doesNotMatch(JSON.stringify(original),/SECRET_|valueExact|"total":\d/u);
    if(Number.isInteger(t.finance.revealScheduleAfter)){
      const unlocked=Models.sceneFor(t,{mode:'guided',completed:t.finance.revealScheduleAfter,step:t.finance.revealScheduleAfter-1,solved:false});assert.equal(unlocked.scheduleLocked,false,t.id);assert.equal(unlocked.totalRows,t.finance.rows.length,t.id);
    }
  }
});

test('financial model disclosure records help first, ignores stale actions, and cleans up listeners',()=>{
  const dom=new JSDOM('<main id="model"></main>',{runScripts:'outside-only'}),w=dom.window;
  for(const name of ['finance-data','finance-tasks'])w.eval(fs.readFileSync(path.join(directory,name+'.js'),'utf8'));
  const container=w.document.getElementById('model');
  try{
    for(const l of w.ProfileLessons)for(const t of l.tasks.slice(3)){
      let helped=0,current=true;const cleanup=w.ProfileFinanceModels.render(container,t,{mode:'independent',completed:0,step:0,solved:false,isCurrent:()=>current,onHelp(){assert.equal(container.querySelector('.finance-explanation').textContent,'',t.id+': mark help before explanation disclosure');helped++;return true;}});
      const open=container.querySelector('[data-model-action="finance-help"]');assert(open,t.id+': explicit model help action');assert.equal(helped,0);open.click();assert.equal(helped,1);assert(container.querySelector('.finance-explanation').textContent.length>40,t.id+': requested help explains the accounting model');assert.equal(container.querySelectorAll('[data-state="earned"]').length,0,t.id+': model help does not invent accepted calculations');
      cleanup();const snapshot=container.innerHTML;open.click();assert.equal(container.innerHTML,snapshot);assert.equal(helped,1);
      const staleCleanup=w.ProfileFinanceModels.render(container,t,{mode:'independent',completed:0,step:0,solved:false,isCurrent:()=>current,onHelp(){helped++;return true;}});current=false;const stale=container.querySelector('[data-model-action="finance-help"]');const before=container.innerHTML;stale.click();assert.equal(helped,1);assert.equal(container.innerHTML,before);staleCleanup();
    }
  }finally{w.close();}
});


test('finance sources distinguish draft 2027 numbering from historical practice',()=>{
  for(const lesson of lessons) for(const link of lesson.links||[]) {
    if(link.href.includes('/2027/')) assert.match(link.title,/проект/iu);
    if(link.href.includes('2026')) assert.match(link.title,/2026/);
  }
  const app=fs.readFileSync(path.join(directory,'app.js'),'utf8');
  assert.match(app,/проекту ЕГЭ 2027/);
  assert.match(app,/их включение не означает, что каждый такой тип обязателен/);
});
