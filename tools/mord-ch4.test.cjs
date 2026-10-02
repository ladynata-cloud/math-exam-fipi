'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const lessons=require('../ege-profil/circle/chapter4.js');
const tasks=lessons.flatMap(l=>l.tasks), byId=Object.fromEntries(tasks.map(t=>[t.id,t]));
const P=Math.PI,T=2*P;
const near=(a,b,eps=1e-8)=>assert.ok(Math.abs(a-b)<eps,`${a} ≠ ${b}`);
const selected=f=>f.options.find(x=>x.value===f.expected).label;
const samePoint=(a,b)=>{near(Math.cos(a),Math.cos(b));near(Math.sin(a),Math.sin(b));};
function term(text,k=0){
  text=text.replaceAll('−','-').replaceAll(' ','');
  let multiple=1;
  if(text.includes('k')){multiple=k;text=text.replace('k','');}
  const pieces=text.split('/');
  assert.ok(pieces.length<=2,`bad term ${text}`);
  const denominator=pieces.length===2?Number(pieces[1]):1;
  let numerator=pieces[0];
  if(numerator.includes('π')){
    numerator=numerator.replace('π','');
    return (numerator===''?1:numerator==='-'?-1:Number(numerator))*P/denominator*multiple;
  }
  return Number(numerator)/denominator*multiple;
}
const formula=(text,k)=>text.split('+').reduce((sum,x)=>sum+term(x,k),0);
const chosenInterval=(task,t)=>{
  const text=selected(task.fields[0]);
  const strict=!text.includes('≤');
  const [left,right]=text.split(strict?' < t < ':' ≤ t ≤ ');
  for(let k=-12;k<=12;k++){
    const a=formula(left,k),b=formula(right,k);
    if(strict?t>a+1e-9&&t<b-1e-9:t>=a-1e-9&&t<=b+1e-9)return true;
  }
  return false;
};

test('§4 source coverage: all 20 exercise numbers and all 85 listed subparts',()=>{
  assert.equal(lessons.length,9);assert.equal(tasks.length,85);
  const counts=[8,8,4,3,4,4,4,4,4,4,4,4,4,3,3,4,4,4,4,4];
  for(let n=1;n<=20;n++)assert.equal(tasks.filter(t=>t.book===`4.${n}`).length,counts[n-1],`4.${n}`);
  assert.equal(new Set(tasks.map(t=>t.id)).size,tasks.length);
  let previous=0;
  for(const t of tasks){
    const book=Number(t.book.split('.')[1]);assert.ok(book>=previous,`${t.book} is out of source order`);previous=book;
    assert.ok(t.steps.length>=2);assert.ok(t.explanation.length>80);assert.ok(t.lab.goal.length>10);
    for(const question of [...t.steps,{fields:t.fields}]){
      assert.equal(new Set(question.fields.map(f=>f.id)).size,question.fields.length);
      for(const f of question.fields){
        assert.ok(['number','point','choice','multi','order'].includes(f.kind));
        if(f.kind==='choice'){
          assert.ok(f.options.some(o=>o.value===f.expected));
          assert.equal(new Set(f.options.map(o=>o.label)).size,f.options.length);
          assert.ok(f.options.every(o=>/^[a-f]$/.test(o.value)),'option IDs must not disclose answers');
        }else assert.ok(Number.isFinite(f.expected));
      }
    }
  }
});

test('directed arc lengths independently assembled in twelfths and twentieths of π',()=>{
  // This table comes directly from quarter partitions in source, independent of module metadata.
  const expected={
    '4.1':{AM:3/4,BK:2/3,MP:7/12,DC:3/2,KA:5/6,BP:5/6,CB:3/2,BC:1/2},
    '4.2':{AM:1/4,BD:1,CK:2/3,MP:19/12,DM:3/4,MK:17/12,CP:5/6,PC:7/6},
    '4.3':{AM:1/5,MB:3/10,DM:7/10,MC:4/5},
    '4.4':{CP:1/12,PD:5/12,AP:13/12}
  };
  for(const [book,arcs]of Object.entries(expected))for(const[arc,c]of Object.entries(arcs)){
    const t=tasks.find(t=>t.book===book&&t.part===arc);near(t.fields[0].expected,c*P);
    assert.ok(t.fields[0].expected>0&&t.fields[0].expected<T);
  }
  const length=(book,part)=>tasks.find(t=>t.book===book&&t.part===part).fields[0].expected;
  near(length('4.1','CB')+length('4.1','BC'),T);
  near(length('4.2','CP')+length('4.2','PC'),T);
  near(length('4.3','AM')+length('4.3','MB'),P/2);
  near(length('4.4','CP')+length('4.4','PD'),P/2);
});

test('point exercises: source inputs checked by Cartesian coordinates, including both negative 4.11 entries',()=>{
  const source={
    '4.5':[.5*P,P,1.5*P,2*P], '4.6':[7*P,4*P,10*P,3*P],
    '4.7':[P/3,P/4,P/6,P/8], '4.8':[2*P/3,3*P/4,5*P/6,5*P/4],
    '4.9':[4*P/3,5*P/3,7*P/6,11*P/6], '4.10':[-P/2,-2*P/3,-2*P,-3*P/4],
    '4.11':[25*P/4,-26*P/3,-25*P/6,16*P/3], '4.16':[1,-5,4.5,-3]
  };
  for(const [book,values]of Object.entries(source))values.forEach((input,i)=>{
    const task=tasks.filter(t=>t.book===book)[i];near(task.meta.input,input);samePoint(task.fields[0].expected,input);
    const reduced=task.steps[0].fields[0].expected*(task.meta.piCoefficient?P:1);
    assert.ok(reduced>=-1e-9&&reduced<T-1e-9);samePoint(reduced,input);
    const where=selected(task.steps[1].fields[0]);
    const x=Math.cos(input),y=Math.sin(input);
    if(Math.abs(x)<1e-8||Math.abs(y)<1e-8)assert.ok(where.includes('точка'));
    else assert.equal(where,['I','II','III','IV'][x>0?(y>0?0:3):(y>0?1:2)]+' четверть');
  });
});

test('all-number families generate exactly the specified circle points, not just one representative',()=>{
  const specs={
    'm4-13-a':[P/4], 'm4-13-b':[5], 'm4-13-v':[3*P/4], 'm4-13-g':[-3],
    'm4-14-a':[0], 'm4-14-b':[P], 'm4-14-v':[0,P],
    'm4-15-a':[P/2], 'm4-15-b':[3*P/2], 'm4-15-v':[P/2,3*P/2]
  };
  for(const[id,targets]of Object.entries(specs)){
    const t=byId[id], f=selected(t.fields[0]),hit=new Set();
    for(let k=-8;k<=8;k++){
      const v=formula(f,k),j=targets.findIndex(x=>Math.abs(Math.cos(x)-Math.cos(v))<1e-8&&Math.abs(Math.sin(x)-Math.sin(v))<1e-8);
      assert.ok(j>=0,`${id}: ${f} generates an unwanted point`);hit.add(j);
    }
    assert.equal(hit.size,targets.length);
    // Every target and several forward/backward turns must occur, excluding over-wide periods.
    for(const a of targets)for(let m=-3;m<=3;m++){
      const desired=a+m*T;
      assert.ok(Array.from({length:33},(_,i)=>i-16).some(k=>Math.abs(formula(f,k)-desired)<1e-8),`${id}: missing ${desired}`);
    }
  }
});

test('quadrants independently determined from sine/cosine signs for positive and negative raw radians',()=>{
  const source={'4.17':[6,2,3,4],'4.18':[5,-5,8,-8]};
  for(const[book,inputs]of Object.entries(source))inputs.forEach((x,i)=>{
    const t=tasks.filter(t=>t.book===book)[i],c=Math.cos(x),s=Math.sin(x);
    const q=c>0?(s>0?'I':'IV'):(s>0?'II':'III');
    assert.equal(selected(t.fields[0]),q);samePoint(t.steps[0].fields[0].expected,x);
  });
});

test('all open arcs: oriented membership over many turns, both endpoints excluded, intervals include k',()=>{
  const source={
    'm4-19-a':[0,P/4], 'm4-19-b':[P,P/4], 'm4-19-v':[P/4,0], 'm4-19-g':[P/4,P],
    'm4-20-a':[3*P/2,3*P/4], 'm4-20-b':[P/2,3*P/2], 'm4-20-v':[3*P/4,3*P/2], 'm4-20-g':[3*P/2,P/2]
  };
  for(const[id,[a,b]]of Object.entries(source)){
    const t=byId[id];assert.ok(selected(t.fields[0]).includes('2πk'));
    const second=id.startsWith('m4-20-');
    assert.ok(t.prompt.includes(second?'середина второй четверти':'середина первой четверти'));
    const m=t.lab.points.find(p=>p.label==='M');near(m.angle,second?3*P/4:P/4);
    samePoint(t.steps[0].fields[0].expected,a);samePoint(t.steps[0].fields[1].expected,b);
    near(t.steps[1].fields[0].expected,a/P);near(t.steps[1].fields[1].expected,(b>a?b:b+T)/P);
    const span=((b-a)%T+T)%T;
    for(let i=-400;i<=400;i++){
      const value=i*P/24,position=((value-a)%T+T)%T;
      const expected=position>1e-8&&position<span-1e-8;
      assert.equal(chosenInterval(t,value),expected,`${id}, t=${value/P}π`);
    }
    for(let k=-6;k<=6;k++){
      assert.equal(chosenInterval(t,a+k*T),false,`${id} included start`);
      assert.equal(chosenInterval(t,b+k*T),false,`${id} included end`);
      assert.equal(chosenInterval(t,a+span/2+k*T),true,`${id} lost inner point`);
    }
  }
});

test('line vs circle transformations include exceptional coincidences',()=>{
  const samples=[-9,-P,-P/3,0,P/2,P,8.4];
  for(const t of samples){
    near(Math.cos(t),Math.cos(-t));near(Math.sin(t),-Math.sin(-t));
    near(Math.cos(t+P),-Math.cos(t));near(Math.sin(t+P),-Math.sin(t));
    samePoint(t+P,t-P);near((t+P)-(t-P),T);
    for(let k=-3;k<=3;k++)samePoint(t,t+k*T);
  }
  assert.match(selected(byId['m4-12-a'].fields[1]),/совпадают при t = πk/);
  assert.match(selected(byId['m4-12-b'].fields[0]),/при k = 0 совпадают/);
});
console.log(JSON.stringify({gate:'MORD_CH4_CONTENT',lessons:lessons.length,tasks:tasks.length,steps:tasks.reduce((s,t)=>s+t.steps.length,0),sourceExercises:'4.1–4.20'}));
