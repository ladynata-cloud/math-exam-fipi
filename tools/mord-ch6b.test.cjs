'use strict';
const assert = require('node:assert/strict');
const lessons = require('../ege-profil/circle/chapter6b.js');
const tasks = lessons.flatMap(l => l.tasks), byId = new Map(tasks.map(t => [t.id, t]));
const P = Math.PI, T = 2 * P, s = Math.sin, c = Math.cos, tan = Math.tan, cot = x => 1 / tan(x);
const near = (a, b, label) => assert.ok(Math.abs(a - b) < 1e-7, `${label}: ${a} != ${b}`);
const chosen = f => f.options.find(o => o.value === f.expected)?.label;
const id = (n, part) => `m6-${n}-${part}`;
const sourceParts = {20:4,21:4,22:4,23:4,24:4,25:4,26:2,27:2,28:2,29:2,30:4,31:2,32:4,33:4,34:4,35:4,36:2,37:4,38:2,39:4,40:4,41:4};
assert.equal(lessons.length, 6);
assert.equal(tasks.length, 74);
assert.equal(byId.size, tasks.length);
Object.entries(sourceParts).forEach(([n, count]) => {
  const items = tasks.filter(t => t.book === `6.${n}`);
  assert.equal(items.length, count, `source coverage 6.${n}`);
  assert.deepEqual(items.map(t => t.part), ['а','б','в','г'].slice(0,count));
});
for (const lesson of lessons) {
  assert.ok(lesson.intro.length > 350 && lesson.summary && lesson.lab);
  for (const task of lesson.tasks) {
    assert.ok(task.steps.length >= 2 && task.explanation.length > 30, task.id);
    assert.ok(task.prompt && task.lab && task.meta.source);
    for (const question of [...task.steps, task]) {
      assert.equal(new Set(question.fields.map(f => f.id)).size, question.fields.length, task.id);
      for (const field of question.fields) {
        if (['number','point'].includes(field.kind)) assert.ok(Number.isFinite(field.expected), task.id);
        else {
          assert.ok(field.options?.length >= 2, task.id);
          assert.equal(new Set(field.options.map(o=>o.value)).size,field.options.length);
          assert.ok(field.options.every(o => /^[a-z]$/.test(o.value)), `opaque values ${task.id}`);
          const expected = Array.isArray(field.expected) ? field.expected : [field.expected];
          assert.ok(expected.every(value => field.options.some(o=>o.value===value)), task.id);
          if (field.kind === 'order') assert.equal(expected.length, field.options.length, task.id);
        }
      }
    }
  }
}

// Directly transcribed source expressions, independent of content metadata and generated keys.
const signs = {
  20:[s(4*P/7),c(-5*P/7),s(9*P/8),s(-3*P/8)],
  21:[tan(6*P/7),cot(10*P/9),tan(8*P/11),cot(11*P/5)],
  22:[s(-2),c(3),s(5),c(-6)],
  23:[s(10),c(-12),s(-15),c(8)],
  24:[s(1)*c(2),s(P/7)*c(-7*P/5),c(2)*s(-3),c(-14*P/9)*s(-4*P/9)],
  25:[c(5*P/9)-tan(25*P/18),tan(1)-c(2),s(7*P/10)-cot(3*P/5),s(2)-cot(5.5)],
  26:[s(1)*c(2)*tan(3)*cot(4),s(-5)*c(-6)*tan(-7)*cot(-8)],
  35:[s(2*P/9)-s(10*P/9),s(1)-s(1.1),s(15*P/8)-c(P/4),c(1)-c(0.9)]
};
for (const [n, values] of Object.entries(signs)) values.forEach((value, i) => {
  const task = byId.get(id(n, ['a','b','v','g'][i]));
  assert.equal(chosen(task.fields[0]),value>0?'Положительное':value<0?'Отрицательное':'Равно нулю',task.id);
});
const exactNumeric = {
  'm6-27-a':c(1)+c(1+P)+s(-P/3)+c(-P/6),
  'm6-27-b':s(2)+s(2+P)+c(-P/12)**2+s(P/12)**2,
  'm6-28-a':s(1.5+2*P*19)**2+c(1.5)**2+c(-P/4)+s(-P/6),
  'm6-28-b':c(P/8+4*P)**2+s(P/8-44*P)**2,
  'm6-29-a':tan(2.5)*cot(2.5)+c(P)**2-s(P/8)**2-c(P/8)**2,
  'm6-29-b':s(3*P/7)**2-2*tan(1)*cot(1)+c(-3*P/7)**2+s(5*P/2)**2
};
for (const [taskId,value] of Object.entries(exactNumeric)) near(byId.get(taskId).fields[0].expected,value,taskId);
for (const k of [-101,-3,0,5,207]) near(byId.get('m6-28-a').fields[0].expected,s(1.5+2*P*k)**2+c(1.5)**2+c(-P/4)+s(-P/6),`6.28a k=${k}`);

function angle(label) {
  let text = label.trim().replaceAll('−','-').replaceAll(' ','');
  if (text==='0') return 0;
  const m = text.match(/^(-?)(\d*)π(?:\/(\d+))?$/);
  assert.ok(m, `unparsed exact angle ${label}`);
  return (m[1]?-1:1)*(Number(m[2]||1))*P/Number(m[3]||1);
}
const equations = {
  'm6-30-a': t=>10*s(t)-Math.sqrt(75),
  'm6-30-b': t=>Math.sqrt(8)*s(t)+2,
  'm6-30-v': t=>8*c(t)-Math.sqrt(32),
  'm6-30-g': t=>8*c(t)+Math.sqrt(48),
  'm6-31-a': t=>s(P/8)**2+c(P/8)**2-Math.sqrt(2)*s(t),
  'm6-31-b': t=>Math.sqrt(4/3)*c(t)-c(1)**2-s(1)**2,
  'm6-32-a': t=>Math.abs(s(t))-1,
  'm6-32-b': t=>Math.sqrt(Math.max(0,1-s(t)**2))-0.5,
  'm6-32-v': t=>Math.abs(c(t))-1,
  'm6-32-g': t=>Math.sqrt(Math.max(0,1-c(t)**2))-Math.sqrt(2)/2
};
const rootCounts = {'m6-30-a':2,'m6-30-b':2,'m6-30-v':2,'m6-30-g':2,'m6-31-a':2,'m6-31-b':2,'m6-32-a':2,'m6-32-b':4,'m6-32-v':2,'m6-32-g':4};
for (const [taskId, residual] of Object.entries(equations)) {
  const task=byId.get(taskId), field=task.fields[0];
  assert.equal(field.kind,'multi');
  assert.equal(field.expected.length,rootCounts[taskId]);
  const roots=[];
  for (const option of field.options) {
    const match=option.label.match(/^(.+) \+ 2πk, k ∈ ℤ$/);
    assert.ok(match,`${taskId}: every family includes every integer k`);
    const base=angle(match[1]);
    const correct=field.expected.includes(option.value);
    assert.equal(Math.abs(residual(base))<1e-7,correct,`${taskId}: correct and distractor families`);
    if(correct){
      roots.push(base);
      for(const k of [-17,-2,0,3,12]) near(residual(base+T*k),0,`${taskId}: k=${k}`);
    }
  }
  // All roots of these source equations are on the π/12 grid; independently scan the entire turn.
  const reference=Array.from({length:24},(_,i)=>i*P/12).filter(t=>Math.abs(residual(t))<1e-7);
  assert.equal(reference.length,rootCounts[taskId],`${taskId}: independent root count`);
  for(const r of reference) assert.ok(roots.some(t=>Math.abs(t-r)<1e-7),`${taskId}: omitted root ${r}`);
}
const domainValues=[s(10.2*P),c(1.3*P),s(-3.4*P),c(-6.9*P)];
domainValues.forEach((v,i)=>assert.equal(chosen(byId.get(id(33,['a','b','v','g'][i])).fields[0]),v>=0?'Да':'Нет'));
assert.match(lessons.find(l=>l.id==='m6-root-domain').intro,/u ≥ 0/);
const compared=[[s(7*P/10),s(5*P/6)],[c(2),s(2)],[c(P/8),c(P/3)],[s(1),c(1)]];
compared.forEach(([a,b],i)=>assert.equal(chosen(byId.get(id(34,['a','b','v','g'][i])).fields[0]),a>b?'a > b':a<b?'a < b':'a = b'));
const ordered={
  'm6-36-a':[s(P/7),s(P/5),s(2*P/3),s(7*P/6),s(4*P/3)],
  'm6-36-b':[c(P/8),c(P/3),c(5*P/6),c(5*P/4),c(7*P/4)],
  'm6-37-a':[s(2),s(3),c(4),c(5)],
  'm6-37-b':[c(3),c(4),c(6),c(7)],
  'm6-37-v':[s(3),s(4),s(6),s(7)],
  'm6-37-g':[c(2),c(3),s(4),s(5)],
  'm6-38-a':[1,s(1),c(1),tan(1)],
  'm6-38-b':[2,s(2),c(2),cot(2)]
};
for(const [taskId,values] of Object.entries(ordered)) {
  const expected=values.map((value,i)=>({value,key:String.fromCharCode(97+i)})).sort((a,b)=>a.value-b.value).map(x=>x.key);
  assert.deepEqual(byId.get(taskId).fields[0].expected,expected,taskId);
  // Guided sign grouping is also checked against source values.
  const field=byId.get(taskId).steps[0].fields[0];
  if(field.kind==='multi') assert.deepEqual(field.expected,values.flatMap((v,i)=>v<0?[String.fromCharCode(97+i)]:[]),taskId);
}

const rawInequalities = {
  'm6-39-a':[s,0,'>'], 'm6-39-b':[s,Math.sqrt(3)/2,'<'], 'm6-39-v':[s,0,'<'], 'm6-39-g':[s,Math.sqrt(3)/2,'>'],
  'm6-40-a':[c,0,'>'], 'm6-40-b':[c,Math.sqrt(2)/2,'<'], 'm6-40-v':[c,0,'<'], 'm6-40-g':[c,Math.sqrt(2)/2,'>'],
  'm6-41-a':[s,-Math.sqrt(2)/2,'>'], 'm6-41-b':[c,-Math.sqrt(3)/2,'>'], 'm6-41-v':[s,-Math.sqrt(2)/2,'<'], 'm6-41-g':[c,-Math.sqrt(3)/2,'<']
};
function interval(label) {
  const pieces=label.replaceAll(' + 2πk','').replaceAll('2πk','0').split(/ < t < /);
  assert.equal(pieces.length,2,label);
  return pieces.map(angle);
}
function inPeriodic(t,lo,hi) {
  for(let k=-30;k<=30;k++) if(t>lo+T*k+1e-9 && t<hi+T*k-1e-9) return true;
  return false;
}
let checkedPoints=0;
for(const [taskId,[fn,threshold,relation]] of Object.entries(rawInequalities)) {
  const task=byId.get(taskId), right=chosen(task.fields[0]);
  assert.ok(!right.includes('≤'),taskId);
  const [lo,hi]=interval(right);
  near(fn(lo),threshold,`${taskId} left boundary`);
  near(fn(hi),threshold,`${taskId} right boundary`);
  assert.ok(hi>lo && hi-lo<T,taskId);
  for(let i=-240;i<=240;i++) {
    const t=i*P/37+0.00123, expected=relation==='>'?fn(t)>threshold:fn(t)<threshold;
    assert.equal(inPeriodic(t,lo,hi),expected,`${taskId} at ${t}`);
    checkedPoints++;
  }
  for(const edge of [lo,hi]) for(const k of [-3,0,5]) assert.equal(inPeriodic(edge+T*k,lo,hi),false,`${taskId}: excluded boundary`);
  const boundaryField=task.steps[0].fields[0];
  for(const option of boundaryField.options) {
    const equality=Math.abs(fn(angle(option.label))-threshold)<1e-8;
    assert.equal(boundaryField.expected.includes(option.value),equality,`${taskId}: boundary choice`);
  }
}
console.log(JSON.stringify({gate:'MORD_CH6B_OK',lessons:lessons.length,tasks:tasks.length,sourceParts:74,equationFamilies:Object.keys(equations).length,inequalityPoints:checkedPoints,steps:tasks.reduce((n,t)=>n+t.steps.length,0)}));
