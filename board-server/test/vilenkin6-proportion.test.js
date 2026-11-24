'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const math = require('../../courses/vilenkin-6-part-1/textbook-math.js');
const units = require('../../courses/vilenkin-6-part-1/textbook-data/units-D.json').filter(u => [18,19,20,21].includes(u.id));
const C = require('../../trainers/vilenkin6-proportion/core.js')(units, math);
const {loadTrainerRegistry} = require('../trainer-registry');
const catalog = require('../../trainers/board-picker-data.json');
const trainerFile = 'trainers/vilenkin6-proportion/index.html';
test('Vilenkin ratio trainer is explicitly authorized and all four board entrances are present', () => {
  const registry = loadTrainerRegistry({env:{}});
  assert.deepEqual(registry.getById('vilenkin6-proportion'), {trainerId:'vilenkin6-proportion', file:trainerFile, version:'1.0.0', stateSchemaVersion:1, bridgeProtocolVersion:1, allowLegacyHtml:false});
  const hrefs = new Set(catalog.entries.map(row => row.href));
  for (const suffix of ['', '?unit=18', '?unit=19', '?unit=20', '?unit=21']) {
    const href = '/' + trainerFile + suffix;
    assert.ok(hrefs.has(href), href);
    assert.equal(registry.getByTrainerUrl(href)?.trainerId, 'vilenkin6-proportion');
  }
});
const answer = v => Array.isArray(v) ? v[0] : v;
test('all 32 Vilenkin 6 ratio/proportion/variation/scale tasks accept their guided and final answers', () => {
  assert.equal(C.tasks.length,32);
  let steps=0;
  for (const task of C.tasks) {
    let s=C.change(C.initial(task.id),'mode','guided');
    s=C.change(s,'hint');
    assert.equal(C.current(s).work.hints[0],true);
    for (const step of task.steps) {
      s=C.change(s,'input',answer(step.answer));
      s=C.change(s,'check');
      assert.equal(C.current(s).work.feedback,'correct',task.id);
      steps++;
    }
    assert.equal(C.current(s).work.complete,true);
    assert.deepEqual(C.normalize(JSON.parse(JSON.stringify(s))),s);
    s=C.change(s,'repeat');
    s=C.change(s,'mode','independent');
    s=C.change(s,'input',answer(task.answer));
    s=C.change(s,'check');
    assert.equal(C.current(s).work.complete,true,task.id);
  }
  assert.equal(steps,82);
});
test('mirror snapshot preserves selected task, draft, notes, rule and hint across section switches', () => {
  const first=C.tasks[0].id, next=C.tasks[8].id;
  let s=C.initial(first);
  s=C.change(s,'input','12');s=C.change(s,'notes','Общий черновик');s=C.change(s,'rules',true);s=C.change(s,'hint');
  s=C.change(s,'task',next);s=C.change(s,'input','224');
  s=C.normalize(JSON.parse(JSON.stringify(s)));
  assert.equal(s.taskId,next);assert.equal(s.rulesOpen,true);
  s=C.change(s,'task',first);
  assert.equal(C.current(s).work.answers[0],'12');
  assert.equal(C.current(s).work.notes,'Общий черновик');
  assert.equal(C.current(s).work.hints[0],true);
  const malformed=C.clone(s);malformed.works[first].step=1;
  assert.throws(()=>C.normalize(malformed));
});
test('max snapshot stays within 64 KiB server limit', () => {
  const s=C.initial();
  for (const p of Object.values(s.works)) {
    p.answers=p.answers.map(()=> '\u0800'.repeat(90));
    p.final='\u0800'.repeat(90);p.notes='\u0800'.repeat(120);
    p.wrong=p.wrong.map(()=>10000);p.hints=p.hints.map(()=>true);
  }
  assert.ok(Buffer.byteLength(JSON.stringify(C.normalize(s)),'utf8')<=65536);
});
