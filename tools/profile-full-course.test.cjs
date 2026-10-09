'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const modules = ['geometry', 'stereo', 'algebra', 'probability', 'equations', 'functions', 'applied', 'readiness'];
const D = modules.flatMap(name => require('../ege-profil/start/' + name + '-data.js'));
const C = require('../ege-profil/start/checks.js');
const S = require('../ege-profil/start/state.js');
const tracked = new Set(execFileSync('git', ['ls-tree', '-r', '--name-only', 'HEAD'], {cwd:root, encoding:'utf8'}).split('\n'));
const lessonIds = new Set(), taskIds = new Set();
let steps = 0;
for (const l of D) {
  assert(!lessonIds.has(l.id), 'duplicate lesson ' + l.id); lessonIds.add(l.id);
  assert(l.title && l.summary && l.intro && l.prereq?.text, l.id + ' teaching context');
  assert.equal(l.tasks.length, 6, l.id + ' three guided + three independent');
  // In a graph-reading exercise the coordinates of the figure are part of the condition.
  assert.equal(new Set(l.tasks.map(t => JSON.stringify([t.prompt,t.meta]))).size, 6, l.id + ' new conditions');
  for (const link of [...(l.links || []), l.prereq].filter(x => x?.href)) {
    if (/^https?:/.test(link.href)) continue;
    const relative = new URL(link.href, 'https://fixture/ege-profil/start/index.html').pathname.slice(1);
    const file = relative.endsWith('/') ? relative + 'index.html' : relative;
    assert(fs.existsSync(path.join(root, file)) || tracked.has(file), 'broken lesson link ' + link.href);
  }
  for (const t of l.tasks) {
    assert(!taskIds.has(t.id), 'duplicate task ' + t.id); taskIds.add(t.id);
    assert.equal(typeof t.answer, 'number', t.id + ' short answer');
    assert(Number.isFinite(t.answer), t.id + ' finite answer');
    assert(C.check(t.answer, String(t.answer)), t.id + ' accepted key');
    assert(!C.check(t.answer, String(t.answer + 7)), t.id + ' rejected error');
    // A one-operation probability example needs one step, not artificial padding.
    assert(t.explanation && t.steps.length >= 1 && t.steps.length <= 15, t.id + ' saved-step capacity');
    for (const q of t.steps) {
      assert(q.prompt && q.hint && q.why, t.id + ' every step explains its reason');
      assert(C.check(q.answer, String(q.answer), q.choices), t.id + ' valid step input');
      if (q.choices) assert(q.choices.includes(q.answer), t.id + ' choice exists');
      steps++;
    }
  }
}
for (let n=1; n<=13; n++) assert(D.some(l => l.position===n), 'missing first-part position '+n);
assert.equal(S.KEY, 'mathexam.profileStart2027.v1', 'old progress identity');
const values = new Map([['mathExamCourseProgress.v1', 'unchanged']]);
const storage = {getItem:k=>values.get(k)||null, setItem:(k,v)=>values.set(k,v)};
let state = S.create(D, storage);
for (const l of D) {
  const guided=state.start(l.id,'guided');
  assert(l.tasks.slice(0,3).some(t=>t.id===guided.taskId));
  guided.answers=[String(l.tasks[0].steps[0].answer)]; guided.step=1; guided.draft='0,25'; state.persist();
  const independent=state.start(l.id,'independent');
  assert(l.tasks.slice(3).some(t=>t.id===independent.taskId));
  assert.notEqual(independent.taskId,guided.taskId);
  state.finish(l.id,'independent',independent); state.finish(l.id,'independent',independent);
  assert.equal(state.record(l.id).attempts,1,'repeat finish is idempotent');
}
state=S.create(D,storage);
for(const l of D){assert.equal(state.start(l.id,'guided').draft,'0,25');assert.equal(state.record(l.id).independent.length,1);}
assert.equal(values.get('mathExamCourseProgress.v1'),'unchanged');
assert.equal(state.export().storage,'local-browser');
const html=fs.readFileSync(path.join(root,'ege-profil/start/index.html'),'utf8');
for(const name of modules)assert(html.includes(name+'-data.js'),name+' loaded');
assert(html.includes('href="#part-one"'));assert(html.includes('href="#exam/16"'));
console.log(JSON.stringify({gate:'PROFILE_FULL_COURSE_DATA_OK',positions:13,lessons:D.length,tasks:taskIds.size,steps,legacyKeyPreserved:true,independentConditionsSeparate:true}));
