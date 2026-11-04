'use strict';
// Independent coordinate/answer regression gate for points 4–6 and exercises
// 16–35. This checks the supplied figures and explicit boundary configurations;
// numerical examples are not a substitute for the independent proof review.
// Usage: node tools/stereo-textbook/parallel-content.test.cjs
// Optional: --content=/path/to/array-or-course.json --repo=/path/to/repository
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const options = Object.fromEntries(process.argv.slice(2).map(arg => {
  const m = /^--(content|repo)=(.+)$/.exec(arg);
  assert(m, 'Unknown argument: ' + arg);
  return [m[1], path.resolve(m[2])];
}));
const root = options.repo || path.resolve(__dirname, '../..');
const contentPath = options.content || path.join(root, 'stereo-course/textbook/data/course.json');
const raw = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
const all = Array.isArray(raw) ? raw : raw.lessons;
assert(Array.isArray(all), 'Content must be a lesson array or a course bundle');
const lessons = all.filter(l => l.source.bookId === 'atanasyan-2024-10-11' && (
  l.source.collection === 'main' && +l.source.exercise >= 16 && +l.source.exercise <= 35 ||
  l.source.collection === 'theory' && +l.source.point >= 4 && +l.source.point <= 6));
assert.equal(lessons.length, 24, 'Complete block: 3 theory cards, 20 exercises, exercise 18 has two cards');
const untouched = JSON.stringify(lessons);
const exercise = (n, subpart) => {
  const matches = lessons.filter(l => l.source.collection === 'main' && l.source.exercise === String(n) &&
    (subpart === undefined || l.source.subpart === subpart));
  assert.equal(matches.length, 1, 'Unique source exercise ' + n + (subpart || ''));
  return matches[0];
};
const theory = n => {
  const matches = lessons.filter(l => l.source.collection === 'theory' && l.source.point === String(n));
  assert.equal(matches.length, 1, 'Unique theory point ' + n);
  return matches[0];
};
const model = l => l.visualization.model;
const points = l => model(l).points;
const sub = (a, b) => a.map((v, i) => v - b[i]);
const add = (a, b) => a.map((v, i) => v + b[i]);
const mul = (a, k) => a.map(v => v * k);
const dot = (a, b) => a.reduce((v, x, i) => v + x * b[i], 0);
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const norm = a => Math.hypot(...a);
const near = (a, b, message) => assert(Math.abs(a-b) <= 1e-8 * Math.max(1, Math.abs(a), Math.abs(b)), message || `${a} != ${b}`);
const equalPoint = (a, b, message) => near(norm(sub(a, b)), 0, message);
const midpoint = (a, b) => mul(add(a, b), .5);
const distance = (p, a, b) => norm(sub(p[a], p[b]));
function line(a, b) {
  const u = sub(b, a);
  assert(norm(u) > 1e-10, 'A line needs two distinct points');
  return {p: a, u};
}
const namedLine = (p, a, b) => line(p[a], p[b]);
const onLine = (x, l) => norm(cross(sub(x, l.p), l.u)) <= 1e-8 * Math.max(1, norm(l.u));
function plane(a, b, c) {
  const n = cross(sub(b, a), sub(c, a));
  assert(norm(n) > 1e-10, 'A plane needs three noncollinear points');
  return {p: a, n: mul(n, 1 / norm(n))};
}
const namedPlane = (p, a, b, c) => plane(p[a], p[b], p[c]);
const onPlane = (x, q) => Math.abs(dot(sub(x, q.p), q.n)) < 1e-8;
function linePlane(l, q) {
  const denominator = dot(l.u, q.n);
  if (Math.abs(denominator) < 1e-9 * norm(l.u)) return {kind: onPlane(l.p, q) ? 'contained' : 'parallel'};
  return {kind: 'crossing', point: add(l.p, mul(l.u, dot(sub(q.p, l.p), q.n) / denominator))};
}
function relation(l, m) {
  const n = cross(l.u, m.u);
  if (norm(n) < 1e-9 * norm(l.u) * norm(m.u)) return onLine(m.p, l) ? 'coincident' : 'parallel';
  return Math.abs(dot(sub(m.p, l.p), n)) < 1e-8 * norm(n) ? 'intersecting' : 'skew';
}
const expectRelation = (p, a, b, c, d, expected) => assert.equal(relation(namedLine(p, a, b), namedLine(p, c, d)), expected, [a,b,c,d].join('/'));
const expectPlane = (p, a, b, q, expected) => assert.equal(linePlane(namedLine(p, a, b), q).kind, expected, `${a}${b} vs plane`);
function number(text) {
  const s = String(text).trim().replace(/\s*см\s*$/u, '').replace(',', '.');
  if (/^-?\d+(?:\.\d+)?$/.test(s)) return Number(s);
  const mixed = /^(?:(\d+)\s+)?(\d+)\/(\d+)$/.exec(s);
  assert(mixed && +mixed[3] !== 0, 'Unsupported explicit numerical answer: ' + text);
  return +(mixed[1] || 0) + +mixed[2] / +mixed[3];
}
function exactAnswer(l, expected) {
  assert.equal(l.answer.mode, 'exact', l.id);
  for (const accepted of l.answer.accepted) near(number(accepted), expected, l.id + ': wrong equivalent answer ' + accepted);
  assert(l.answer.accepted.length > 0);
}
function numericalStep(l, expected) {
  assert.equal(l.answer.mode, 'manual', 'A numerical result must not automatically certify a requested proof');
  const candidates = l.steps.filter(s => s.input && s.input.accepted.every(v => { try { return Math.abs(number(v)-expected) < 1e-8; } catch { return false; } }));
  assert(candidates.length, l.id + ': requested numerical result has no correct checkable step');
}
let groups = 0;
function check(name, fn) { fn(); groups++; console.log('PASS ' + name); }

check('complete source identities and usable geometric references', () => {
  for (let n=16; n<=35; n++) if (n !== 18) exercise(n);
  exercise(18, 'а'); exercise(18, 'б'); [4,5,6].forEach(theory);
  for (const l of lessons) {
    assert.deepEqual(l.source.pdfPages, l.source.printedPages.map(p => p+2), l.id);
    const m=model(l), p=m.points;
    for (const xyz of Object.values(p)) assert(xyz.length === 3 && xyz.every(Number.isFinite), l.id);
    const polygons=[...(m.faces||[]), ...Object.values(m.views).map(v=>v.polygon).filter(v=>v?.length)];
    for (const names of polygons) {
      const q=namedPlane(p, ...names.slice(0,3));
      for (const name of names) assert(onPlane(p[name],q), l.id+': nonplanar polygon '+name);
    }
    const sequences=[...(m.edges||[]),...(m.arrows||[]),...Object.values(m.views).flatMap(v=>v.segments||[])];
    for (const pair of sequences) namedLine(p,...pair);
    for (const s of l.steps) { assert(s.justifications.length); if(s.view) assert(m.views[s.view],l.id); }
    function walk(hs) {for(const h of hs){if(h.view)assert(m.views[h.view],l.id);walk(h.children||[]);}}
    walk(l.help);
  }
});

check('theory 4–6: parallel pairs, transversals, and three line/plane positions', () => {
  let p=points(theory(4));expectRelation(p,'_a0','_a1','_b0','_b1','parallel');assert(onLine(p.M,namedLine(p,'_b0','_b1')));assert(!onLine(p.M,namedLine(p,'_a0','_a1')));
  p=points(theory(5));for(const pair of [['_a0','_a1','_b0','_b1'],['_a0','_a1','_c0','_c1']])expectRelation(p,...pair,'parallel');
  let q=namedPlane(p,'_x0','_x1','_x2');for(const [a,b,x] of [['_a0','_a1','M'],['_b0','_b1','K'],['_c0','_c1','N']]){const hit=linePlane(namedLine(p,a,b),q);assert.equal(hit.kind,'crossing');equalPoint(hit.point,p[x]);}
  p=points(theory(6));q=namedPlane(p,'_p0','_p1','_p2');expectPlane(p,'_a0','_a1',q,'parallel');expectPlane(p,'_b0','_b1',q,'contained');expectPlane(p,'_c0','_c1',q,'crossing');expectPlane(p,'_d0','_d1',q,'parallel');expectRelation(p,'_a0','_a1','_b0','_b1','parallel');
});

check('16: two distinct intersections force the whole transversal into the plane', () => {
  const p=points(exercise(16)),q=namedPlane(p,'_p0','_p1','_p2');expectRelation(p,'_a0','_a1','_b0','_b1','parallel');
  for(const [x,a,b] of [['P','_a0','_a1'],['Q','_b0','_b1']]){assert(onLine(p[x],namedLine(p,a,b)));assert(onLine(p[x],namedLine(p,'_c0','_c1')));}
  assert(distance(p,'P','Q')>0);expectPlane(p,'_c0','_c1',q,'contained');
});

check('17 and 18a/b: exact givens, midpoints, similarity ratios and all accepted answers', () => {
  let l=exercise(17),p=points(l);assert(!onPlane(p.D,namedPlane(p,'A','B','C')));near(distance(p,'A','D'),12);near(distance(p,'B','C'),14);
  for(const [m,a,b]of [['M','D','B'],['N','D','C'],['Q','A','C'],['P','A','B']])equalPoint(p[m],midpoint(p[a],p[b]));
  const perimeter=[['M','N'],['N','Q'],['Q','P'],['P','M']].reduce((s,[a,b])=>s+distance(p,a,b),0);near(perimeter,26);exactAnswer(l,perimeter);
  for(const [part,r,total,result] of [['а',.5,7,3.5],['б',.6,20,12]]) {
    l=exercise(18,part);p=points(l);const q=namedPlane(p,'_p0','_p1','_p2');
    near(distance(p,'B','B1'),total);equalPoint(p.C,add(p.A,mul(sub(p.B,p.A),r)));equalPoint(p.C1,add(p.A,mul(sub(p.B1,p.A),r)));
    expectRelation(p,'B','B1','C','C1','parallel');for(const x of ['A','B1','C1'])assert(onPlane(p[x],q));for(const x of ['B','C'])assert(!onPlane(p[x],q));
    near(distance(p,'C','C1'),result);exactAnswer(l,result);
  }
});

check('19: intersections can lie on extensions, not on the sides', () => {
  const p=points(exercise(19)),q=namedPlane(p,'_p0','_p1','_p2');equalPoint(add(p.A,p.C),add(p.B,p.D));
  for(const [a,b,x]of [['A','B','E'],['B','C','F'],['A','D','G'],['D','C','H']]){const hit=linePlane(namedLine(p,a,b),q);assert.equal(hit.kind,'crossing');equalPoint(hit.point,p[x]);}
  assert(dot(sub(p.G,p.A),sub(p.D,p.A))<0,'AD intersection is beyond A');assert(dot(sub(p.H,p.C),sub(p.C,p.D))>0,'DC intersection is beyond C');
});

check('20: both possible planes through the midline; rotated intermediate cases', () => {
  const p=points(exercise(20));equalPoint(p.M,midpoint(p.A,p.B));equalPoint(p.N,midpoint(p.D,p.C));expectRelation(p,'A','D','B','C','parallel');
  for(const [keys,wanted]of [[['_v0','_v1','_v2'],'parallel'],[['_f0','_f1','_f2'],'contained']]){const q=namedPlane(p,...keys);expectPlane(p,'M','N',q,'contained');expectPlane(p,'A','D',q,wanted);expectPlane(p,'B','C',q,wanted);}
  for(const angle of [0,.1,.7,Math.PI/2,2.9,Math.PI]){const q={p:p.M,n:[0,Math.sin(angle),Math.cos(angle)]};expectPlane(p,'M','N',q,'contained');for(const pair of [['A','D'],['B','C']])assert.notEqual(linePlane(namedLine(p,...pair),q).kind,'crossing');}
});

check('21: every parallel direction crosses both planes, including one shared crossing point', () => {
  const p=points(exercise(21)),a=namedPlane(p,'A','B','C'),b=namedPlane(p,'A','B','D'),direction=sub(p.D,p.C);
  assert(!onPlane(p.D,a));assert(!onPlane(p.C,b));expectRelation(p,'_l0','_l1','C','D','parallel');
  equalPoint(linePlane(namedLine(p,'_l0','_l1'),a).point,p.E);equalPoint(linePlane(namedLine(p,'_l0','_l1'),b).point,p.F);
  for(const origin of [p.A,p.B,[9,-4,2],[-3,7,-8]])for(const q of [a,b])assert.equal(linePlane({p:origin,u:direction},q).kind,'crossing');
  equalPoint(linePlane({p:p.A,u:direction},a).point,p.A);equalPoint(linePlane({p:p.A,u:direction},b).point,p.A);
});

check('22–25: plane-parallel conclusions require outside points as well as parallel directions', () => {
  let p=points(exercise(22)),q=namedPlane(p,'_p0','_p1','_p2');equalPoint(p.M,midpoint(p.A,p.C));equalPoint(p.N,midpoint(p.B,p.C));expectRelation(p,'M','N','A','B','parallel');expectPlane(p,'M','N',q,'parallel');assert(!onPlane(p.C,q));
  p=points(exercise(23));near(dot(sub(p.B,p.A),sub(p.D,p.A)),0);equalPoint(add(p.A,p.C),add(p.B,p.D));assert(!onPlane(p.M,namedPlane(p,'A','B','C')));expectPlane(p,'C','D',namedPlane(p,'A','B','M'),'parallel');
  p=points(exercise(24));expectRelation(p,'A','D','B','C','parallel');assert(!onPlane(p.M,namedPlane(p,'A','B','C')));expectPlane(p,'A','D',namedPlane(p,'B','M','C'),'parallel');
  p=points(exercise(25));expectRelation(p,'_aL','_aR','_cL','_cR','parallel');for(const prefix of ['_alpha','_beta']){q=namedPlane(p,prefix+'0',prefix+'1',prefix+'2');expectPlane(p,'_cL','_cR',q,'contained');expectPlane(p,'_aL','_aR',q,'parallel');}
});

check('26: similarity in the actual model, and explicit degenerate endpoint', () => {
  const p=points(exercise(26)),q=namedPlane(p,'_alpha0','_alpha1','_alpha2');expectPlane(p,'A','C',q,'parallel');
  equalPoint(linePlane(namedLine(p,'A','B'),q).point,p.M);equalPoint(linePlane(namedLine(p,'B','C'),q).point,p.N);expectRelation(p,'M','N','A','C','parallel');
  const ratio=distance(p,'B','M')/distance(p,'B','A');near(distance(p,'B','N')/distance(p,'B','C'),ratio);near(distance(p,'M','N')/distance(p,'A','C'),ratio);
  for(const height of [.2,1.7,3.9]){const alpha={p:[0,0,height],n:[0,.5,1]},m=linePlane(namedLine(p,'A','B'),alpha).point,n=linePlane(namedLine(p,'B','C'),alpha).point;assert(norm(cross(sub(m,p.B),sub(n,p.B)))>1e-6);assert.equal(relation(line(m,n),namedLine(p,'A','C')),'parallel');}
  const throughB={p:p.B,n:[0,.5,1]};equalPoint(linePlane(namedLine(p,'A','B'),throughB).point,p.B);equalPoint(linePlane(namedLine(p,'B','C'),throughB).point,p.B);expectPlane(p,'A','C',throughB,'parallel');
  assert.equal(exercise(26).answer.mode,'manual','The caveat must be reasoned about, not accepted as a bare numeric answer');
});

check('27–29: solve from actual lengths/ratios and retain required proof grading', () => {
  let l=exercise(27),p=points(l),q=namedPlane(p,'_alpha0','_alpha1','_alpha2');near(distance(p,'A','B')/distance(p,'B','C'),4/3);assert(onLine(p.C,namedLine(p,'A','B')));near(distance(p,'C','D'),12);expectPlane(p,'C','D',q,'parallel');
  equalPoint(linePlane(namedLine(p,'A','D'),q).point,p.E);const be=distance(p,'C','D')*distance(p,'A','B')/distance(p,'A','C');near(be,48);near(distance(p,'B','E'),be);numericalStep(l,be);
  l=exercise(28);p=points(l);q=namedPlane(p,'_alpha0','_alpha1','_alpha2');assert(onLine(p.D,namedLine(p,'A','B')));assert(onLine(p.E,namedLine(p,'A','C')));near(distance(p,'B','D')/distance(p,'D','A'),2/3);near(distance(p,'D','E'),5);expectPlane(p,'B','C',q,'contained');expectPlane(p,'D','E',q,'parallel');
  const bc=distance(p,'D','E')*distance(p,'A','B')/distance(p,'A','D');near(bc,25/3);near(distance(p,'B','C'),bc);exactAnswer(l,bc);
  l=exercise(29);p=points(l);near(distance(p,'B','C'),12);equalPoint(p.K,midpoint(p.B,p.M));equalPoint(p.H,midpoint(p.C,p.M));expectRelation(p,'A','D','B','C','parallel');assert(!onPlane(p.M,namedPlane(p,'A','B','C')));equalPoint(linePlane(namedLine(p,'M','C'),namedPlane(p,'A','D','K')).point,p.H);near(distance(p,'K','H'),6);numericalStep(l,6);
});

check('30–32: contained base, parallel midline, midpoint section and common-line direction', () => {
  let p=points(exercise(30)),q=namedPlane(p,'_alpha0','_alpha1','_alpha2');expectPlane(p,'A','B',q,'parallel');assert(onPlane(p.C,q));expectPlane(p,'C','D',q,'contained');equalPoint(p.E,midpoint(p.A,p.D));equalPoint(p.F,midpoint(p.B,p.C));expectPlane(p,'E','F',q,'parallel');
  p=points(exercise(31));q=namedPlane(p,'_alpha0','_alpha1','_alpha2');equalPoint(p.M,midpoint(p.A,p.B));equalPoint(p.N,midpoint(p.A,p.C));expectPlane(p,'B','C',q,'parallel');expectPlane(p,'M','N',q,'contained');equalPoint(linePlane(namedLine(p,'A','C'),q).point,p.N);
  p=points(exercise(32));for(const prefix of ['_alpha','_beta']){q=namedPlane(p,prefix+'0',prefix+'1',prefix+'2');expectPlane(p,'A','B',q,'contained');expectPlane(p,'_aL','_aR',q,'parallel');}expectRelation(p,'_aL','_aR','A','B','parallel');
});

check('33: both configurations have correct pairwise intersections and different triple intersections', () => {
  const p=points(exercise(33));for(const prefix of ['_meet','_parallel']) {
    const planes=Object.fromEntries(['alpha','beta','gamma'].map(name=>[name,namedPlane(p,prefix+name+'0',prefix+name+'1',prefix+name+'2')]));
    for(const [name,a,b]of [['l','alpha','beta'],['m','alpha','gamma'],['n','beta','gamma']])for(const q of [planes[a],planes[b]])expectPlane(p,prefix+name+'0',prefix+name+'1',q,'contained');
    const l=namedLine(p,prefix+'l0',prefix+'l1'),m=namedLine(p,prefix+'m0',prefix+'m1'),n=namedLine(p,prefix+'n0',prefix+'n1');
    if(prefix==='_meet'){for(const ln of [l,m,n])assert(onLine(p.O,ln));assert.equal(relation(l,m),'intersecting');assert(Math.abs(dot(planes.alpha.n,cross(planes.beta.n,planes.gamma.n)))>.1);}
    else {for(const [a,b]of [[l,m],[l,n],[m,n]])assert.equal(relation(a,b),'parallel');assert(!onPlane(l.p,planes.gamma),'No point of alpha∩beta belongs to the third plane');}
  }
  const m=model(exercise(33));assert.equal(m.edges.length,0);assert.equal((m.faces||[]).length,0,'Alternative configurations must not be global superimposed faces');
});

check('34: all six line pairs, K=B, interior K, near N and excluded K=N', () => {
  const p=points(exercise(34));assert(!onPlane(p.D,namedPlane(p,'A','B','C')));for(const [m,a,b]of [['M','D','A'],['N','D','B'],['P','D','C']])equalPoint(p[m],midpoint(p[a],p[b]));
  expectRelation(p,'N','D','A','B','intersecting');expectRelation(p,'M','N','A','B','parallel');expectRelation(p,'M','P','A','C','parallel');expectRelation(p,'M','D','B','C','skew');
  assert(onLine(p.T,namedLine(p,'P','K')));assert(onLine(p.T,namedLine(p,'B','C')));
  for(const t of [0,.1,.5,.9,.9999]){const k=add(p.B,mul(sub(p.N,p.B),t));assert.equal(relation(line(p.P,k),namedLine(p,'B','C')),'intersecting');assert.equal(relation(line(k,p.N),namedLine(p,'A','C')),'skew');}
  assert.equal(relation(line(p.P,p.N),namedLine(p,'B','C')),'parallel','K=N changes the other classification');assert.throws(()=>line(p.N,p.N),/distinct/,'KN is undefined at K=N');
  assert.equal(exercise(34).answer.mode,'manual');
});

check('35: one parallel plus one skew, and the unpictured both-skew case', () => {
  const p=points(exercise(35)),a=namedLine(p,'_aL','_aR'),b=namedLine(p,'_bL','_bR'),c=namedLine(p,'_cL','_cR');assert(!onLine(p.M,a));assert(onLine(p.M,b));assert(onLine(p.M,c));assert.equal(relation(a,b),'parallel');assert.equal(relation(a,c),'skew');
  const other={p:p.M,u:add(c.u,a.u)};assert.equal(relation(a,other),'skew');assert.equal(relation(c,other),'intersecting');
  for(const pair of [[b,c],[c,other]]){const kinds=pair.map(x=>relation(a,x));assert(kinds.includes('skew'));assert(!kinds.includes('intersecting'));}
  assert.equal(exercise(35).answer.mode,'manual');
});

check('actual viewer preserves source geometry and keeps proof constructions out of neutral views', () => {
  const {JSDOM}=require('jsdom'),dom=new JSDOM('<div id="model"></div>',{runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
  w.eval(fs.readFileSync(path.join(root,'stereo-course/assets/task-scene-viewer.js'),'utf8'));
  const hidden={27:['E'],29:['H'],30:['E','F'],31:['N'],32:['M'],33:['O'],34:['T']};let views=0;
  try {for(const l of lessons){const source=model(l),before=JSON.stringify(source),host=w.document.getElementById('model'),api=w.TaskSceneViewer.mount(host,source),camera=JSON.stringify(api.getState());
    for(const name of hidden[+l.source.exercise]||[])assert(!host.querySelector(`[data-label="${name}"]`),l.id+': premature '+name);
    for(const key of Object.keys(source.views)){assert.equal(api.setView(key),true);assert(!/NaN|Infinity|undefined/.test(host.querySelector('svg').outerHTML),l.id+':'+key);views++;}
    api.setView('neutral');assert.equal(JSON.stringify(api.getState()),camera);api.destroy();assert.equal(JSON.stringify(source),before,l.id+': source model mutated');
  }}finally{dom.window.close();}
  assert.equal(views,101,'All views in the reviewed 24-card block were visited');
});
assert.equal(JSON.stringify(lessons), untouched, 'The gate must not modify authored content');
console.log(`ATANASYAN_PARALLEL_CONTENT_OK ${lessons.length} cards; ${groups} mathematical/geometry/viewer groups`);
