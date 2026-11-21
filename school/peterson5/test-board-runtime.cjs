'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '../..');
function boot() {
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'trainers/peterson5.html'), 'utf8'), {
    url: 'https://example.test/trainers/peterson5.html#home', runScripts: 'outside-only', pretendToBeVisual: true
  });
  const w = dom.window; w.scrollTo = () => {}; w.TextEncoder = TextEncoder;
  for (const key of ['mathexam.peterson5.v1', 'mathexam.peterson5.workshop.v1']) w.localStorage.setItem(key, 'PRIVATE');
  let reads = 0, writes = 0;
  w.Storage.prototype.getItem = function () { reads++; throw Error('Shared course must not read personal work'); };
  w.Storage.prototype.setItem = function () { writes++; throw Error('Shared course must not write personal work'); };
  w.MathExamBoard = { register(adapter) { w.registeredBoard = adapter; adapter.subscribe(() => {}); } };
  for (const file of ['math.js', 'models.js', 'data.js', 'workshop-data.js', 'board-session.js', 'media-data.js', 'media.js', 'workshop.js', 'app.js', 'board-runtime.js']) {
    w.eval(fs.readFileSync(path.join(__dirname, file), 'utf8'));
  }
  const result = {
    dom, w, d: w.document,
    go(hash) { w.history.replaceState(null, '', hash); w.PetersonApp.route(); },
    get() { return JSON.parse(JSON.stringify(w.__peterson5Board.getState())); },
    apply(value) { w.__peterson5Board.applyState(w.JSON.parse(JSON.stringify(value))); },
    input(selector, value) { const input = w.document.querySelector(selector); input.value = value; input.dispatchEvent(new w.Event('input', { bubbles: true })); },
    access() { return { reads, writes }; },
    close() { w.close(); }
  };
  assert.equal(w.registeredBoard.id, 'peterson5');
  return result;
}
const tick = () => new Promise(done => setTimeout(done, 10));
(async () => {
  const teacher = boot(), learner = boot();
  try {
    for (const id of ['p01', 'p06', 'p25', 'p43']) for (const stage of ['discover', 'practice', 'check']) {
      teacher.go('#topic/' + id + '/' + stage); learner.apply(teacher.get());
      assert.deepEqual(learner.get(), teacher.get(), id + ' / ' + stage);
    }
    teacher.go('#topic/p01/discover'); teacher.d.querySelector('[data-w-hint]').click(); await tick();
    teacher.input('#workshop-notes', 'Общий черновик'); await tick(); learner.apply(teacher.get());
    assert.equal(learner.d.querySelector('#workshop-notes').value, 'Общий черновик');
    assert.equal(learner.get().workshop.entries['p01-discover'].aided, true);
    teacher.input('#workshop-notes', '<b>Общий текст</b>' + 'я'.repeat(3000)); await tick();
    assert.equal(teacher.d.querySelector('#workshop-notes').value.length, 2000);
    assert(!teacher.get().workshop.entries['p01-discover'].note.includes('<b>'));
    learner.apply(teacher.get()); assert.deepEqual(learner.get(), teacher.get());
    const before = learner.get(), badLayout = structuredClone(before); badLayout.view.details = [];
    assert.throws(() => learner.apply(badLayout)); assert.deepEqual(learner.get(), before, 'Bad view rolls back state, route and DOM');
    teacher.d.querySelector('.p5-media').open = true; await tick();
    teacher.d.querySelector('[data-p5-gif-toggle]').click(); await tick(); learner.apply(teacher.get());
    assert.equal(learner.d.querySelector('[data-p5-gif-toggle]').getAttribute('aria-pressed'), 'true');
    assert.equal(learner.get().view.media.gifPlaying, true);
    for (const route of ['#lesson/p02/0', '#practice/fraction-add/1', '#progress', '#home']) {
      teacher.go(route); learner.apply(teacher.get()); assert.deepEqual(learner.get(), teacher.get(), route);
    }
    assert.deepEqual(teacher.access(), { reads: 0, writes: 0 });
    assert.deepEqual(learner.access(), { reads: 0, writes: 0 });
    console.log('PETERSON5_BOARD_DOM_OK: real course rendering; privacy; current scene; notes; atomic rollback; GIF state; no independent credit');
  } finally { teacher.close(); learner.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
