'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..'), KEY = 'mathexam.vilenkin5.quality.v1';
const plain = value => JSON.parse(JSON.stringify(value));
const tick = () => new Promise(resolve => setTimeout(resolve, 20));
const route = '#lesson/v5f-division-column';
function boot({ board = false, reduced = false, saved = {} } = {}) {
  const file = board ? 'trainers/vilenkin5.html' : 'school/index.html';
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const dom = new JSDOM(html, { url: 'https://fixture.test/' + file + '?course=vilenkin5' + route,
    runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window, errors = [];
  w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = () => {};
  w.TextEncoder = TextEncoder;
  w.matchMedia = () => ({ matches: reduced, addEventListener() {}, removeEventListener() {} });
  w.MathExamBoard = { register() {} }; // Transport is exercised by the separate real Socket.IO gate.
  for (const [key, value] of Object.entries(saved)) w.localStorage.setItem(key, value);
  w.addEventListener('error', event => errors.push(event.message));
  for (const script of w.document.querySelectorAll('script[src]')) {
    const file = new URL(script.src).pathname;
    if (file.startsWith('/assets/') || file === '/trainers/board-bridge.js') continue;
    w.eval(fs.readFileSync(path.join(root, file), 'utf8'));
  }
  return { w, errors, $: selector => w.document.querySelector(selector),
    state: () => plain(w.Vilenkin5Quality.getState()), close: () => w.close() };
}
function input(f, selector, value) {
  const element = f.$(selector); assert(element, selector);
  element.value = value; element.dispatchEvent(new f.w.Event('input', { bubbles: true }));
}
(async () => {
  const teacher = boot({ board: true }), student = boot({ board: true }), quiet = boot({ board: true, reduced: true });
  const personal = boot();
  try {
    await tick();
    assert.equal(teacher.w.Vilenkin5MediaData.length, 53);
    assert.equal(new Set(teacher.w.Vilenkin5MediaData.map(item => item.id)).size, 53);
    for (const item of teacher.w.Vilenkin5MediaData) {
      assert(fs.existsSync(path.join(root, 'school', item.src)));
      assert(fs.existsSync(path.join(root, 'school', item.poster)));
      assert(item.description.length > 25);
    }
    assert.match(teacher.$('.v5-media img').src, /u13\.png$/);
    assert.equal(teacher.$('.v5-media').open, false);
    input(teacher, '#answer', '12');
    input(teacher, '#v5-quality-note', 'Сравниваю произведение с делимым.');
    const before = teacher.state().scene;
    teacher.$('.v5-media').open = true; await tick();
    assert.equal(teacher.state().scene.media.id, 'u13');
    assert.equal(teacher.state().scene.media.open, true);
    teacher.$('[data-v5-gif-toggle]').click();
    assert.match(teacher.$('.v5-media img').src, /u13\.gif$/);
    assert.equal(teacher.state().scene.media.playing, true);
    assert.equal(teacher.state().scene.assisted, true);
    assert.equal(teacher.state().scene.savedInput, before.savedInput);
    assert.equal(teacher.state().scene.note, before.note);
    assert.deepEqual(teacher.state().scene.model, before.model);
    const shared = plain(teacher.w.__vilenkin5Board.getState());
    student.w.__vilenkin5Board.applyState(student.w.JSON.parse(JSON.stringify(shared)));
    quiet.w.__vilenkin5Board.applyState(quiet.w.JSON.parse(JSON.stringify(shared))); await tick();
    assert.deepEqual(plain(student.w.__vilenkin5Board.getState()), shared);
    assert.match(student.$('.v5-media img').src, /u13\.gif$/);
    assert.equal(student.$('#answer').value, '12');
    assert.equal(student.$('#v5-quality-note').value, before.note);
    assert.match(quiet.$('.v5-media img').src, /u13\.png$/);
    assert.match(quiet.$('[data-v5-media-status]').textContent, /уменьшение движения/);
    assert.equal(quiet.state().scene.media.playing, true);
    teacher.$('[data-v5-gif-toggle]').click();
    student.w.__vilenkin5Board.applyState(student.w.JSON.parse(JSON.stringify(teacher.w.__vilenkin5Board.getState()))); await tick();
    assert.match(student.$('.v5-media img').src, /u13\.png$/);
    assert.equal(student.state().scene.media.playing, false);
    teacher.$('.v5-media').open = false; await tick();
    assert.equal(teacher.state().scene.media.open, false);
    personal.$('.v5-media').open = true; await tick();
    personal.$('[data-v5-gif-toggle]').click();
    const saved = { [KEY]: personal.w.localStorage.getItem(KEY) };
    assert.equal(personal.state().scene.media.playing, true);
    const reloaded = boot({ saved });
    try {
      assert.match(reloaded.$('.v5-media img').src, /u13\.png$/);
      await tick();
      assert.equal(reloaded.state().scene.media.playing, false);
      assert.equal(reloaded.state().scene.media.open, true);
      assert.deepEqual(reloaded.errors, []);
    } finally { reloaded.close(); }
    for (const f of [teacher, student, quiet, personal]) assert.deepEqual(f.errors, []);
    console.log('VILENKIN5_MEDIA_DOM_OK: 53 real assets; play/stop; shared state; reduced motion; personal quiet reload; notes/answers/model preserved');
  } finally { [teacher, student, quiet, personal].forEach(f => f.close()); }
})().catch(error => { console.error(error); process.exitCode = 1; });
