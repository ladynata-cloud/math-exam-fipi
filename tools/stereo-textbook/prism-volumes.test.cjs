'use strict';

const assert = require('node:assert/strict');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const bundle = require('../../stereo-course/textbook/data/course.json');
const manifest = require('./prism-volumes.json');
const {available, issues} = engine.inspectBundle(bundle.catalog, bundle.lessons);
assert.deepEqual(issues, []);

const parts = {
  452: ['а', 'б'], 453: [null], 454: [null], 455: [null], 456: ['а', 'б', 'в', 'г'],
  457: [null], 458: [null], 459: ['а', 'б', 'в'], 460: [null], 461: [null], 462: [null],
  463: [null], 464: ['а', 'б', 'в', 'г', 'д'], 465: [null]
};
const cards = [...available.values()].filter(card => Object.hasOwn(manifest.cards, card.id));
assert.equal(cards.length, 26);
for (const [exercise, expected] of Object.entries(parts)) {
  const candidates = cards.filter(card => card.source.exercise === exercise);
  assert.deepEqual(candidates.map(card => card.source.subpart || null), expected);
}
const theories = cards.filter(card => card.kind === 'theory');
assert.deepEqual(theories.map(card => [card.source.point, card.source.pdfPages]), [
  ['54', [123, 124]], ['55', [124, 125]]
]);
const {PI, sin, cos, tan, sqrt, acos} = Math;
const delta = (a,b) => a.map((x,i) => x - b[i]);
const dot = (a,b) => a.reduce((sum,x,i) => sum + x*b[i],0);
const length = (a,b) => Math.hypot(...delta(a,b));
const angle = (a,o,b) => acos(dot(delta(a,o),delta(b,o))/(length(a,o)*length(b,o)));
function area(p, names) {
  let twice = 0;
  names.forEach((name,i) => {
    const [x,y] = p[name], [u,v] = p[names[(i+1)%names.length]];
    twice += x*v-u*y;
  });
  return Math.abs(twice)/2;
}
function close(a,b) {
  assert(Math.abs(a-b) < 1e-9*Math.max(1,Math.abs(b)), a+' differs from '+b);
}
function checkAnswer(card,value) {
  assert.equal(engine.classifyAnswer(String(value),card.answer.accepted).status,'correct',card.id);
  assert.equal(engine.classifyAnswer('9999',card.answer.accepted).status,'wrong',card.id);
}
for (const card of cards) {
  assert(card.steps.every(step => step.justifications.length));
  assert(card.steps.some(step => step.input));
  const model = card.visualization.model, p = model.points;
  viewer.prepare(model);
  for (const view of Object.values(model.views)) {
    for (const [a,o,b] of view.rightAngles || []) close(dot(delta(p[a],p[o]),delta(p[b],p[o])),0);
  }
  const n = Number(card.source.exercise), part = card.source.subpart;
  if (card.kind === 'theory') {
    if (card.source.point === '54') {
      const triangle = area(p,['A','B','C']);
      close(area(p,['A','B','H']) + area(p,['B','C','H']),triangle);
      close(length(p.A,p.H) + length(p.H,p.C),length(p.A,p.C));
      close(dot(delta(p.B,p.H),delta(p.C,p.H)),0);
      close(length(p.H,p.H1),length(p.A,p.A1));
      assert.deepEqual(model.views[card.steps[0].view].polygon,['A','B','C']);
      assert.deepEqual(model.views[card.steps[1].view].polygon,['B','H','H1','B1']);
      close(area(p,['A','B','C','D']), area(p,['A','B','C']) + area(p,['A','C','D']));
      close(length(p.A,p.A1),length(p.C,p.C1));
    } else {
      const circle = PI*length(p.O,p.B)**2;
      const inner = area(p,['i0','i1','i2','i3']), outer = area(p,['e0','e1','e2','e3']);
      close(inner,8); close(outer,16);
      assert(inner < circle && circle < outer);
    }
    continue;
  }
  assert.deepEqual(card.source.pdfPages,[126]);
  if (n >= 452 && n <= 458 || n >= 464) {
    const names = Object.keys(p).filter(k => /^[A-H]$/.test(k));
    const a = length(p.A,p.B), h = length(p.A,p.A1), S = area(p,names), V = S*h;
    if (n === 452 && part === 'а') {
      close(a,5); close(length(p.A,p.C),3); close(angle(p.B,p.A,p.C),2*PI/3);
      close(length(p.B,p.C)*h,35); close(V,75*sqrt(3)/4); checkAnswer(card,V);
    }
    if (n === 452 && part === 'б') {
      close(length(p.A,p.B1),3); close(length(p.C,p.B1),2); close(angle(p.A,p.B1,p.C),PI/3);
      close(angle(p.A,p.B,p.C),PI/2); close(V,3*sqrt(2)/2); checkAnswer(card,V);
    }
    if (n === 453) {
      const phi = angle(p.A,p.B,p.C);
      close(length(p.B,p.C),a); close(length(p.B,p.D),h); close(V,a**3*sin(phi)*cos(phi/2)/2);
    }
    if (n === 454) {
      const l = length(p.A1,p.C), beta = angle(p.A1,p.C,p.A), alpha = angle(p.A,p.B,p.C);
      close(V,l**3*cos(beta)**2*sin(beta)/(4*tan(alpha/2)));
    }
    if (n === 455) {
      const Q = a*length(p.M,p.K), beta = angle(p.K,p.M,p.N);
      close(length(p.N,p.K),h); close(V,Q**2*sin(2*beta)/(2*a));
    }
    if (n === 456) {
      close(h,a); close(V/a**3,names.length/(4*tan(PI/names.length))); checkAnswer(card,V/a**3);
    }
    if (n === 457) {
      close(angle(p.C,p.M,p.C1),PI/3); close(h,3*a/2); checkAnswer(card,V/a**3);
    }
    if (n === 458) {
      close(length(p.A,p.D1),8); close(angle(p.A,p.D1,p.D),PI/6); close(V,72); checkAnswer(card,V);
    }
    if (n === 464) {
      const r = length(p.O,p.A), count = names.length;
      for (const name of names) close(length(p.O,p[name]),r);
      const ratio = S/(PI*r*r);
      close(ratio,count*sin(2*PI/count)/(2*PI));
      if (part !== 'д') checkAnswer(card,ratio);
    }
    if (n === 465) {
      const alpha = angle(p.A,p.B,p.C), r = length(p.O,p.A);
      close(angle(p.B,p.A,p.C),PI/2); close(2*r,length(p.B,p.C)); close(PI*r*r*h,PI*a*a*h/(4*cos(alpha)**2));
    }
  } else {
    const r = length(p.O,p.B), h = length(p.O,p.P), V = PI*r*r*h;
    if (n === 459) {
      if (part === 'а') { close(V,24*PI); checkAnswer(card,V); }
      if (part === 'б') { close(V,120); close(h,3.6); checkAnswer(card,r); }
      if (part === 'в') { close(V,8*PI); close(r,h); checkAnswer(card,h); }
    }
    if (n === 460) {
      const meters = (6800/2.6)/(PI*(.4/2)**2)/100;
      checkAnswer(card,meters); checkAnswer(card,Math.round(meters));
    }
    if (n === 461) {
      close(r,9); close(h,7);
      const coefficient = .85*r*r*h;
      close(coefficient,481.95); checkAnswer(card,.85*V);
      checkAnswer(card,Math.round(coefficient*3.14)); checkAnswer(card,Math.round(coefficient*PI));
    }
    if (n === 462) {
      const Q = PI*r*r, axial = 2*r*h;
      close(V,axial*sqrt(PI*Q)/2);
    }
    if (n === 463) {
      const inner = length(p.O,p.J), kg = PI*(r*r-inner*inner)*2500*11.4/1000;
      close(inner,.65); close(r-inner,.4); close(kg,19.38*PI);
      checkAnswer(card,kg); checkAnswer(card,Math.round(kg));
    }
  }
}
let families = 0;
for (let m=1;m<=8;m++) for (let half=1;half<=8;half++) for (let h=1;h<=8;h++) {
  const alpha = PI*half/10, a = 2*m*sin(alpha/2), d = m*cos(alpha/2);
  const S = a*d/2, l = Math.hypot(a,h), beta = Math.atan2(h,a);
  close(S*d,m**3*sin(alpha)*cos(alpha/2)/2);
  close(S*h,l**3*cos(beta)**2*sin(beta)/(4*tan(alpha/2)));
  const section = a*Math.hypot(d,h), slope = Math.atan2(h,d);
  close(a*d*h,section**2*sin(2*slope)/(2*a)); families++;
}
console.log('ATANASYAN_PRISM_VOLUMES_OK: 26 lessons, the two volume theorems, 512 parameter sets, signed polygon areas, sectional angles, units and rounding');
