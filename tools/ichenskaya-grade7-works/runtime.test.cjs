'use strict';
// The state/UI fixtures below are synthetic; the source and browser gates use
// the separately reviewed actual conditions and diagrams.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const primary = JSON.parse(read('learning/atanasyan-first-steps/course.json'));
const manifestText = read('learning/ichenskaya-grade7-works/source-manifest.json');
const manifest = JSON.parse(manifestText);
const clone = value => JSON.parse(JSON.stringify(value));
const template = primary.lessons.find(lesson => lesson.id === 'atanasyan-7-9-main-92-part-1');
const bundle = {
  schemaVersion: 1, id: 'ichenskaya-grade7-works',
  book: { ...manifest.book, edition: 'Синтетическое издание для проверки интерфейса' }, catalog: { book: manifest.book },
  source: { sha256: crypto.createHash('sha256').update(manifestText).digest('hex'), bookSha256: manifest.source.sha256 },
  sections: clone(manifest.works), counters: clone(manifest.counts), displayOverrides: {},
  lessons: manifest.entries.map(entry => ({ ...clone(template), ...clone(entry), kind: 'exercise', status: 'reviewed', revision: 1,
    statement: { text: 'Синтетическое условие для проверки записей: ' + entry.title + '.', goal: 'Запиши проверочный ход решения.' } }))
};
const first = 'ichenskaya-7-sr-01-v1-task-01', second = 'ichenskaya-7-sr-01-v2-task-01';
const namespace = 'mathExamIchenskayaGrade7Works.v1';
function memory() { const values = new Map(); return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }; }
function setup(options = {}) {
  const dom = new JSDOM('<!doctype html><main id="host"></main>', { url: 'https://cabinet.example/learning/', runScripts: 'outside-only', pretendToBeVisual: true });
  const { window } = dom, host = window.document.getElementById('host');
  const helperMounts = [];
  window.HTMLElement.prototype.scrollIntoView = function () {};
  for (const file of ['geometry-course/textbook/assets/math-text.js', 'geometry-course/textbook/assets/planar-viewer.js',
    'learning/atanasyan-first-steps/state.js', 'learning/atanasyan-first-steps/app.js', 'learning/ichenskaya-grade7-works/app.js']) window.eval(read(file));
  window.LearningAssistant = { mount(_host, context) { helperMounts.push(context); return () => {}; } };
  const storage = options.storage || memory();
  const dispose = window.IchenskayaGrade7Works.mount(host, { bundle: window.JSON.parse(JSON.stringify(bundle)),
    storageScope: 'synthetic-pupil', initialLessonId: first, role: 'student', ...options, storage });
  const click = selector => { const item = host.querySelector(selector); assert(item, selector); item.click(); };
  const input = (selector, value) => { const field = host.querySelector(selector); assert(field, selector); field.value = value; field.dispatchEvent(new window.Event('input', { bubbles: true })); };
  const tick = () => new Promise(resolve => window.setTimeout(resolve, 5));
  const home = () => click('.afs-task-header button');
  const open = id => { home(); click('[data-lesson-id="' + id + '"]'); };
  const textButton = label => { const found = [...host.querySelectorAll('button')].find(button => button.textContent === label); assert(found, label); found.click(); };
  return { dom, window, host, storage, helperMounts, click, input, tick, home, open, textButton, close() { dispose(); window.close(); } };
}

test('trusted companion adapter keeps both source validators and source identities separate', () => {
  const f = setup();
  try {
    const local = value => f.window.JSON.parse(JSON.stringify(value));
    assert.equal(f.window.IchenskayaGrade7Works.validateBundle(local(bundle)).lessons.length, 110);
    assert.equal(f.window.AtanasyanFirstSteps.validateBundle(local(primary)).lessons.length, 255);
    assert.throws(() => f.window.AtanasyanFirstSteps.validateBundle(local(bundle)));
    assert.throws(() => f.window.IchenskayaGrade7Works.validateBundle(local(primary)));
    for (const mutate of [b => b.lessons.pop(), b => b.sections.pop(), b => { b.lessons[1].id = b.lessons[0].id; },
      b => { b.lessons[0].source.work = '1'; }, b => { b.lessons[0].source.variant = 2; },
      b => { b.sections[0].withinPrimaryScope = false; }, b => { b.source.bookSha256 = 'invalid'; }]) {
      const altered = local(bundle); mutate(altered); assert.throws(() => f.window.IchenskayaGrade7Works.validateBundle(altered));
    }
    assert.equal(f.host.querySelector('[data-import-legacy]'), null);
    assert.match(f.host.querySelector('.afs-eyebrow').textContent, /С-1 · вариант 1 · №1/);
    assert.match(f.host.querySelector('.afs-eyebrow').textContent, /печатная стр\. 3 · страница PDF 4/);
  } finally { f.close(); }
});

test('namespace and account isolation preserves original keys, last task and proof semantics', () => {
  const f = setup(), storage = memory();
  try {
    const api = f.window.AtanasyanFirstStepsState, lesson = f.window.JSON.parse(JSON.stringify(bundle.lessons[0]));
    const stores = [api.createStore({ storage, scope: 'pupil-a' }), api.createStore({ storage, scope: 'pupil-a', namespace }), api.createStore({ storage, scope: 'pupil-b', namespace })];
    for (const [index, store] of stores.entries()) {
      const state = api.empty(lesson); state.draft = 'Изолированная запись ' + index; state.submitted = true;
      assert.equal(store.write(lesson, state).saved, true); store.remember(lesson);
    }
    assert.equal(stores[0].keyFor(lesson), 'mathExamAtanasyanFirstSteps.v1:pupil-a:' + lesson.id + ':r1');
    assert.equal(new Set(stores.map(store => store.keyFor(lesson))).size, 3);
    for (const [index, store] of stores.entries()) {
      assert.equal(store.read(lesson).draft, 'Изолированная запись ' + index); assert.equal(store.last([lesson]), lesson.id);
      assert.equal(Object.hasOwn(store.read(lesson), 'checked'), false);
    }
    assert.throws(() => api.createStore({ storage, scope: 'pupil-a', namespace: 'unapproved' }));
  } finally { f.close(); }
});

test('variant-specific writing, help and export survive navigation and a new mount', async () => {
  const storage = memory(); let f = setup({ storage });
  try {
    f.input('[data-final-answer]', 'Моё решение первого варианта');
    f.click('[data-next-step]'); await f.tick(); f.input('#afs-step-0', 'Мой первый шаг');
    f.click('[data-step-explanation="0"] > summary'); await f.tick();
    f.click('[data-next-step]'); await f.tick();
    assert.equal(f.host.querySelector('#afs-step-0').value, 'Мой первый шаг');
    f.click('[data-guided-help] > summary'); f.click('[data-guided-help] > summary'); await f.tick();
    f.open(second); f.input('[data-final-answer]', 'Другое решение второго варианта'); f.open(first);
    assert.equal(f.host.querySelector('[data-final-answer]').value, 'Моё решение первого варианта');
    assert.equal(f.host.querySelector('#afs-step-0').value, 'Мой первый шаг');
    f.close(); f = setup({ storage });
    assert.equal(f.host.querySelector('[data-final-answer]').value, 'Моё решение первого варианта');
    assert.equal(f.host.querySelector('#afs-step-0').value, 'Мой первый шаг');
    assert.equal(f.host.querySelector('[data-step-explanation="0"]').open, true);
    assert.match(f.host.querySelector('[data-assistance-status]').textContent, /использована помощь/);
    f.click('[data-save-work]'); assert.match(f.host.querySelector('[data-save-status]').textContent, /обсудить с учителем/);
    f.textButton('Скачать резервную копию');
    const exported = JSON.parse(f.host.querySelector('textarea[aria-label="Записи для копирования"]').value);
    assert.equal(exported.format, 'mathexam-ichenskaya-grade7-works-work');
    assert.equal(exported.records.length, 2); assert(exported.records.every(record => record.lessonId.startsWith('ichenskaya-7-')));
    assert.equal(exported.records.find(record => record.lessonId === first).assisted, true);
  } finally { f.close(); }
});

test('collection and curriculum filters expose the 54/56 boundary and all work variants', () => {
  const f = setup({ initialLessonId: null });
  try {
    assert.equal(f.host.querySelectorAll('[data-route-section]').length, 23);
    assert.match(f.host.querySelector('[data-course-boundary]').textContent, /54 задачи.*56 задач/);
    const filter = f.host.querySelector('[data-course-filter]');
    for (const [value, expected] of [['sr', 74], ['kr', 36], ['primary', 54], ['later', 56], ['all', 110]]) {
      filter.value = value; filter.dispatchEvent(new f.window.Event('change')); assert.equal(f.host.querySelectorAll('[data-lesson-id]').length, expected);
    }
    assert.equal(f.host.querySelector('[data-companion-course]').getAttribute('href'), '/geometry-course/first-steps/');
  } finally { f.close(); }
});

test('native helper makes the launcher available with lazy companion task context', async () => {
  const f = setup({ api: async () => { throw Error('No real request in this fixture'); } });
  try {
    assert.equal(f.helperMounts.length, 1);
    assert.equal(f.helperMounts[0].lazy,true);
    f.click('[data-course-assistant] > summary'); await f.tick();
    assert.equal(f.helperMounts.length, 1);
    assert.deepEqual(JSON.parse(JSON.stringify(f.helperMounts[0].courseContext())), { courseId: 'ichenskaya-grade7-works', lessonId: first, stepIndex: 0 });
    assert.equal(f.helperMounts[0].onBeforeAsk(), true);
    assert.match(f.host.querySelector('[data-assistance-status]').textContent, /использована помощь/);
  } finally { f.close(); }
});

test('teacher preview never touches storage or API, and public mode cannot mount the authenticated helper', async () => {
  let reads = 0, writes = 0;
  const storage = { getItem() { reads++; return 'PRIVATE'; }, setItem() { writes++; } };
  for (const options of [{ role: 'teacher', readOnly: true, storage }, { role: 'public' }]) {
    const f = setup({ ...options, api: async () => { throw Error('Forbidden API'); } });
    try {
      f.click('[data-course-assistant] > summary'); await f.tick(); f.click('[data-next-step]'); await f.tick();
      assert.equal(f.helperMounts.length, 0);
      if (options.readOnly) {
        assert.equal(f.host.querySelector('[data-final-answer]').readOnly, true); assert.equal(f.host.querySelector('[data-save-work]').disabled, true);
        assert.equal(f.host.querySelector('#afs-step-0').readOnly, true); assert.doesNotMatch(f.host.textContent, /PRIVATE/);
      }
    } finally { f.close(); }
  }
  assert.equal(reads, 0); assert.equal(writes, 0);
});
