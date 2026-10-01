const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process');
const D=require('../trainers/oge-basics/multiplication-division/division-lab-core.js');
const examples={oneDigit:'147',zero:'201',remainder:'147',twoDigit:'24',decimalNatural:'4,2',appendZeros:'0,125',decimalDivisor:'3,2'};
for(const [level,answer] of Object.entries(examples)){
 const p=D.plan(D.make(level,0));assert.equal(p.quotient,answer);assert.equal(p.remainder,level==='remainder'?4:0);
 assert(p.actions.some(a=>a.kind==='product'));assert(p.actions.some(a=>a.kind==='subtract'));assert(p.actions.some(a=>a.kind==='bring'));assert(p.actions.some(a=>a.kind==='partial'));
 for(const a of p.actions)assert(D.check(a.answer,a),level+' '+a.kind);
}
const zero=D.plan(D.make('zero',0));assert(zero.cycles.some(c=>c.qd===0));assert(!D.check('',{kind:'digit',answer:'0'}));assert(!D.check('00',{kind:'digit',answer:'0'}));assert(D.check('0',{kind:'digit',answer:'0'}));
const appended=D.plan(D.make('appendZeros',0));assert.equal(appended.actions.filter(a=>a.kind==='comma').length,1);assert.equal(appended.actions.filter(a=>a.kind==='bring'&&a.appended).length,3);
assert(!D.check('0',{kind:'comma',answer:'0,'}));assert(D.check('0.',{kind:'comma',answer:'0,'}));
for(const raw of ['', '1e2','Infinity','NaN','-1','1/2','1+2','<script>'])assert.equal(D.equal(raw,'0'),false,raw);
assert(D.equal('1,20','1.2'));assert(!D.equal('1,2001','1,2'));assert.throws(()=>D.plan({level:'appendZeros',dividend:'1',divisor:'3'}));assert.throws(()=>D.plan({level:'oneDigit',dividend:'5',divisor:'0'}));
const carry=D.plan({level:'zero',dividend:'10005',divisor:'5'});assert.equal(carry.quotient,'2001');assert.equal(carry.cycles.filter(c=>c.qd===0).length,2);
const small=D.plan({level:'decimalDivisor',dividend:'0,084',divisor:'0,4'});assert.equal(small.normalizedDividend,'0,84');assert.equal(small.quotient,'0,21');
let count=0;for(const level of Object.keys(D.levels))for(let seed=0;seed<500;seed++){const p=D.plan(D.make(level,seed));assert(p.actions.length<150);for(const a of p.actions)assert(D.check(a.answer,a));count++;}
const state=D.blank(),task=D.make('zero',0),p=D.plan(task);state.session={task,mode:'check',step:3,errors:1,hints:0,reveals:0,repeated:false,input:'10'};
assert.deepEqual(D.validate(JSON.parse(JSON.stringify(state))),state);
for(const field of ['step','errors','hints','reveals']){const bad=structuredClone(state);bad.session[field]=-1;assert.throws(()=>D.validate(bad));}
let bad=structuredClone(state);bad.session.step=149;assert.throws(()=>D.validate(bad));bad=structuredClone(state);bad.session.task.level='unknown';assert.throws(()=>D.validate(bad));
state.records=[{...state.session,step:p.actions.length,input:'',errors:0,finishedAt:1000,independent:true}];assert.equal(D.validate(state).records[0].independent,true);
for(const field of ['errors','hints','reveals']){bad=structuredClone(state);bad.records[0][field]=1;assert.equal(D.validate(bad).records[0].independent,false);}
bad=structuredClone(state);bad.records[0].repeated=true;assert.equal(D.validate(bad).records[0].independent,false);
bad=structuredClone(state);bad.records=Array.from({length:1000},()=>({...state.records[0]}));assert.throws(()=>D.validate(bad));bad.session=null;assert.equal(D.validate(bad).records.length,1000);
const prefix='trainers/oge-basics/multiplication-division/';
const linked=['long-division-from-simple-to-decimals','long-division-one-digit','long-division-with-remainder','long-division-zero-in-quotient','long-division-two-digit','decimal-division-natural','division-append-zeros','decimal-divisor-shift','long-division-mixed-checkpoint'].map(s=>prefix+s+'.html').concat(['trainers/long-division-stepwise.html']);
for(const file of linked){const old=cp.execFileSync('git',['show','010e89c75c0fe110b57c983c728b8216fb38cd9d:'+file],{encoding:'utf8'}),now=fs.readFileSync(file,'utf8'),scripts=s=>[...s.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/g)].map(m=>m[0]);assert.deepEqual(scripts(now),scripts(old),file+' old runtime preserved');assert(now.includes('division-lab.html'));}
console.log(count+' generated plans, edge cases, exact input, state validation, evidence flags, and 10 preserved old runtimes: PASS');
