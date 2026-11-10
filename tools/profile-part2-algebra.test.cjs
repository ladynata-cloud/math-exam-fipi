'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const lessons=require('../ege-profil/part-two/content-algebra.js');
const tasks=lessons.flatMap(l=>l.tasks);
const number=v=>{
  if(typeof v==='number')return v;
  const s=String(v).replace(/−/g,'-').replace(',','.');
  if(s.includes('/')){const [a,b]=s.split('/').map(Number);return a/b;}
  return Number(s);
};
const near=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-7,message||`${a} != ${b}`);
const fields=t=>t.final.map(x=>x.answers[0]);
const nfields=t=>fields(t).map(number);
const numRoots=(A,B,C)=>{
  const D=B*B-4*A*C;
  if(D<0)return [];
  return [...new Set([(-B-Math.sqrt(D))/(2*A),(-B+Math.sqrt(D))/(2*A)])].sort((a,b)=>a-b);
};

test('12 complete algebra lessons: distinct conditions, both numbers and real prerequisite links',()=>{
  assert.equal(lessons.length,12);assert.equal(tasks.length,72);
  assert.equal(lessons.filter(l=>l.exam===14).length,6);
  assert.equal(lessons.filter(l=>l.exam===16).length,6);
  assert.equal(new Set(tasks.map(t=>t.id)).size,72);
  assert.equal(new Set(tasks.map(t=>t.prompt)).size,72);
  for(const l of lessons){
    assert.equal(l.tasks.length,6);assert.ok(l.theory.length>=3);
    for(const p of l.prerequisites){
      let file=p.href.split(/[?#]/)[0];if(file.endsWith('/'))file+='index.html';
      assert.ok(fs.existsSync(path.join(__dirname,'..',file)),`missing prerequisite ${p.href}`);
    }
    for(const t of l.tasks){
      assert.ok(t.steps.length>=4);assert.ok(t.solution.length>=3);
      assert.ok(t.proof.prompt);assert.ok(t.proof.criteria.length>=3);
      for(const s of t.steps)assert.ok(s.prompt&&s.hint&&s.explanation&&s.answers.length);
      for(const f of t.final)assert.ok(f.label&&f.answers.length);
    }
  }
});

test('all answer aliases work in the actual course checker; empty input never passes',()=>{
  const engine=require('../ege-profil/part-two/state.js');
  const checker=require('../ege-profil/start/checks.js');
  for(const t of tasks)for(const field of [...t.steps,...t.final]){
    for(const value of field.answers)assert.equal(engine.matches(field.answers,String(value),checker),true,`${t.id}: ${value}`);
    assert.equal(engine.matches(field.answers,'',checker),false,t.id);
    const value=number(field.answers[0]);
    if(Number.isFinite(value)){
      assert.equal(engine.matches(field.answers,`${value*2}/2`,checker),true,t.id);
      assert.equal(engine.matches(field.answers,String(value+1),checker),false,t.id);
    }
  }
});

test('START prerequisite hashes refer to actual authored lesson IDs',()=>{
  const sources=['equations-data.js','functions-data.js'].map(file=>fs.readFileSync(path.join(__dirname,'../ege-profil/start',file),'utf8')).join('\n');
  for(const lesson of lessons)for(const p of lesson.prerequisites){
    const hash=p.href.match(/^\/ege-profil\/start\/#lesson\/([a-z0-9-]+)$/);
    if(hash)assert.ok(sources.includes("'"+hash[1]+"'"),p.href);
  }
});

for(const t of tasks.filter(t=>t.meta.kind==='trig-selection'))test(`${t.id}: all roots and interval endpoints`,()=>{
  const m=t.meta,actual=nfields(t),fn=m.fn==='sin'?Math.sin:Math.cos;
  for(const c of actual){assert.ok(c>=0&&c<=2);near(fn(c*Math.PI),m.value);}
  assert.equal(actual.length,2);assert.notEqual(actual[0],actual[1]);
  const first=m.fn==='sin'?Math.asin(m.value):Math.acos(m.value);
  const raw=m.fn==='sin'?[first,Math.PI-first]:[first,-first];
  const expected=raw.map(x=>((x%(2*Math.PI))+2*Math.PI)%(2*Math.PI)/Math.PI).sort((a,b)=>a-b);
  expected.forEach((x,i)=>near(actual[i],x));
  assert.ok(Math.abs(fn(0)-m.value)>0.1);
  assert.ok(Math.abs(fn(2*Math.PI)-m.value)>0.1);
});

for(const t of tasks.filter(t=>t.meta.kind==='trig-factor'))test(`${t.id}: division would lose three roots`,()=>{
  const m=t.meta,actual=nfields(t);
  assert.equal(actual.length,5);assert.equal(new Set(actual).size,5);
  [0,1,2].forEach(c=>assert.ok(actual.includes(c)));
  actual.forEach(c=>near(Math.sin(2*c*Math.PI),m.k*Math.sin(c*Math.PI)));
  const alpha=Math.acos(m.k/2)/Math.PI;
  [0,alpha,1,2-alpha,2].sort((a,b)=>a-b).forEach((x,i)=>near(actual[i],x));
});

for(const t of tasks.filter(t=>t.meta.kind==='exponential-equation'))test(`${t.id}: independent quadratic calculation and back-substitution`,()=>{
  const m=t.meta;
  const expected=numRoots(1,-m.sum,m.prod).filter(v=>v>0).map(v=>Math.log(v)/Math.log(m.base)).sort((a,b)=>a-b);
  const actual=nfields(t);assert.equal(actual.length,expected.length);
  actual.forEach((x,i)=>{near(x,expected[i]);near(m.base**(2*x)-m.sum*m.base**x+m.prod,0);});
});

for(const t of tasks.filter(t=>t.meta.kind==='log-equation'))test(`${t.id}: check individual logarithms, not just product`,()=>{
  const m=t.meta;
  const all=numRoots(1,-m.a-m.c,m.a*m.c-m.K);
  const expected=all.filter(x=>x>m.a&&x>m.c);
  assert.equal(expected.length,1);near(nfields(t)[0],expected[0]);
  const x=expected[0],log=v=>Math.log(v)/Math.log(m.base);
  near(log(x-m.a)+log(x-m.c),log(m.K));
  assert.ok(all.some(v=>v<=m.a||v<=m.c));
});

for(const t of tasks.filter(t=>t.meta.kind==='radical-equation'))test(`${t.id}: extraneous root rejected by original equation`,()=>{
  const m=t.meta;
  const all=numRoots(1,-2*m.b-1,m.b*m.b-m.a);
  const expected=all.filter(x=>x+m.a>=0&&Math.abs(Math.sqrt(x+m.a)-(x-m.b))<1e-7);
  assert.equal(expected.length,1);near(nfields(t)[0],expected[0]);
  assert.ok(all.some(x=>x-m.b<0));
});

for(const t of tasks.filter(t=>t.meta.kind==='rational-equation'))test(`${t.id}: denominator survives cancellation`,()=>{
  const m=t.meta,actual=nfields(t),candidates=[m.b-Math.sqrt(m.k*m.k),m.b+Math.sqrt(m.k*m.k)];
  const expected=candidates.filter(x=>x!==m.a);
  assert.equal(actual[0],expected.length);assert.deepEqual(actual.slice(1),expected);
  expected.forEach(x=>near(((x-m.a)*(x-m.b)/(x-m.a))**2,m.k*m.k));
});

function candidates(m){
  const points=[];
  for(let k=-555;k<=740;k++)points.push(k/37);
  for(const k of ['a','b','c','p','q','r','bad','boundary']){
    if(Number.isFinite(m[k]))points.push(m[k]-1e-5,m[k],m[k]+1e-5);
  }
  if(Number.isFinite(m.a))points.push(m.a+1-1e-5,m.a+1,m.a+1+1e-5);
  return points;
}
for(const t of tasks.filter(t=>t.meta.kind==='rational-repeated'))test(`${t.id}: original rational expression on 1300+ points`,()=>{
  const m=t.meta,[L,M,R]=nfields(t);
  for(const x of candidates(m)){
    const actual=x<=L||x===M||x>R;
    const value=(x-m.a)**2*(x-m.b)/(x-m.c);
    const expected=x!==m.c&&value>=0;
    assert.equal(actual,expected,`${t.id} x=${x}`);
  }
});
for(const t of tasks.filter(t=>t.meta.kind==='exponential-inequality'))test(`${t.id}: original exponential inequality on 1300+ points`,()=>{
  const m=t.meta,[L,R]=nfields(t);
  for(const x of candidates(m)){
    const v=m.base**(2*x)-m.sum*m.base**x+m.prod;
    const expected=v<=1e-10;
    assert.equal(x>=L&&x<=R,expected,`${t.id} x=${x}, residual=${v}`);
  }
});
for(const t of tasks.filter(t=>t.meta.kind==='fixed-log-inequality'))test(`${t.id}: direct logarithm including zero/pole boundaries`,()=>{
  const m=t.meta,[sign,raw]=fields(t),B=number(raw);
  for(const x of candidates(m)){
    const arg=(x-m.a)/(x-m.c);
    const expected=x!==m.c&&arg>0&&Math.log(arg)/Math.log(m.base)>=0;
    assert.equal(sign==='>'?x>B:x<B,expected,`${t.id} x=${x}`);
  }
});
for(const t of tasks.filter(t=>t.meta.kind==='variable-log-inequality'))test(`${t.id}: base domain and both monotonicity branches`,()=>{
  const m=t.meta,values=fields(t);
  for(const x of candidates(m)){
    const base=x-m.a,arg=x-m.b;
    const expected=base>0&&base!==1&&arg>0&&Math.log(arg)/Math.log(base)>=1;
    const actual=m.result==='empty'?false:m.result==='ray'?x>number(values[1]):x>number(values[0])&&x<number(values[1]);
    assert.equal(actual,expected,`${t.id} x=${x}`);
  }
});
for(const t of tasks.filter(t=>t.meta.kind==='radical-inequality'))test(`${t.id}: original radical and strict endpoint`,()=>{
  const m=t.meta,[sign,raw]=fields(t),B=number(raw);
  for(const x of candidates(m)){
    const expected=x+m.a>=0&&(m.strict?Math.sqrt(x+m.a)<x-m.b:Math.sqrt(x+m.a)<=x-m.b);
    const actual=sign==='>'?x>B:x>=B;
    assert.equal(actual,expected,`${t.id} x=${x}`);
  }
});
for(const t of tasks.filter(t=>t.meta.kind==='cancelled-inequality'))test(`${t.id}: original fraction versus final ray and hole`,()=>{
  const m=t.meta,[sign,raw,hole]=fields(t),B=number(raw);
  for(const x of candidates(m)){
    const v=(x-m.a)*(x-m.b)/(x-m.a);
    const expected=x!==m.a&&(m.right?v>=0:v<=0);
    const actual=(sign==='≥'?x>=B:x<=B)&&(hole==='нет'||x!==number(hole));
    assert.equal(actual,expected,`${t.id} x=${x}`);
  }
});
