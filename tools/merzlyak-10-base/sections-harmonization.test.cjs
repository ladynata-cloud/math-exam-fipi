'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '../..');
const course = path.join(root, 'stereo-course/merzlyak-10-base');
const API = require(path.join(course, 'assets/engine.js'));
const lessons = Array.from({ length: 6 }, (_, i) => JSON.parse(fs.readFileSync(
  path.join(course, `lessons/research-sections-00${i + 1}.json`), 'utf8')));
const ids = new Set(lessons.map(lesson => lesson.id));
const bundle = JSON.parse(fs.readFileSync(path.join(course, 'data/course.json'), 'utf8'));
const copy = value => JSON.parse(JSON.stringify(value));
const canonical = value => Array.isArray(value) ? value.map(canonical) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort()
    .map(key => [key, canonical(value[key])])) : value;
const hash = value => crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');

// Fixed mathematical/storage contracts: unchanged cards retain main 5f25f75.
// Cards 001, 002 and 005 use the independently reviewed corrections from PR #658
// at 4bd581f3ef48979806289aebdd20fdfdfa4ab310 (finite faces vs planes and labelled views).
// Exact hashes still reject any additional statement, proof, geometry or storage change.
// These hashes exclude the new teaching prompts/help and additive highlighted views.
const contracts = [
  'e993cc9e7bc940b4236f52854abe82e2a7d8cb107b103fb7083c574ea719b779',
  'b2db0f1dda82137c6758737e700ef284b2ad8b65ebdf83b6f55e8a4b0a926a38',
  '54e0159964caf8344e063ff9506751d0a4a8aa348db619954f660df1a65a1316',
  '6b651c23764834984c9a5708fb8d739b77decadb93e6053cc995c889c113f1ad',
  '6723402e7a72ff58f9691be68f1675922e9c68ff472d25c5c9cc8fe4df75a539',
  '7d5463c305b07046717ddb170f5c4bd5789bfdeb415192bd3d4b25e5e7921713'
];
const oldViews = [
  ['neutral', 'traces', 'bcd', 'abd'],
  ['neutral', 'lower', 'centre', 'upper', 'section'],
  ['neutral', 'xy', 'trace', 'parallel'],
  ['neutral', 'section', 'front', 'top', 'base', 'trapezoid', 'second-top', 'second-front', 'second-section'],
  ['neutral', 'diagonal', 'top', 'bottom', 'section', 'ratio-top'],
  ['neutral', 'parallel', 'centroid', 'base', 'section']
];
const oldViewHashes = [
  'd42300c1ad49f41efea1ebdb04585c51fd0d945437af9e96e7263599ea244f8d',
  'ea7a7e4660ce729527f46e94fbb8438c120189100384938ac7522f68c5acdb4b',
  '751dd96096f81fe0afceeef57dda274301039f06f24dcadd76d95b637016e151',
  '6eb70d0e794c4c21e2cf422bc681433c5e46897fc91dd6dee66dab6227720de9',
  'b79afd11b944e794b0acc23ba6cded12aad2682cc979fbf5e30d3fed0659780f',
  '044a8e7c1950342e379ce6b0f26b07b9e6330c167b9ad0fc26fda36209fc2f03'
];
function mathContract(lesson) {
  const geometry = Object.fromEntries(Object.entries(lesson.visualization.model).filter(([key]) => key !== 'views'));
  return {
    id: lesson.id, revision: lesson.revision, kind: lesson.kind, title: lesson.title,
    source: lesson.source, statement: lesson.statement.text, answer: lesson.answer, geometry,
    proof: lesson.steps.map(step => ({ id: step.id, explanation: step.explanation, justifications: step.justifications }))
  };
}
function helpItems(items) { return items.flatMap(item => [item, ...helpItems(item.children || [])]); }
const storageKey = lesson => `mathExamTextbook.v1:${bundle.catalog.book.id}:${lesson.id}:r${lesson.revision}`;
const sample = {
  ...bundle,
  catalog: { ...bundle.catalog, entries: lessons.map(lesson => Object.fromEntries(
    ['id', 'revision', 'kind', 'title', 'status', 'source'].map(key => [key, copy(lesson[key])]))) },
  lessons
};
function boot(saved = {}) {
  const dom = new JSDOM('<div id="app"></div>', {
    url: 'https://example.test/stereo-course/merzlyak-10-base/',
    runScripts: 'outside-only', pretendToBeVisual: true
  });
  const win = dom.window, doc = win.document, errors = [], mounts = [];
  win.addEventListener('error', event => errors.push(event.error));
  win.HTMLElement.prototype.scrollIntoView = () => {};
  win.scrollTo = () => {};
  for (const [key, raw] of Object.entries(saved)) win.localStorage.setItem(key, raw);
  win.TaskSceneViewer = {
    mount(element, model, options) {
      const svg = doc.createElement('svg');
      element.append(svg);
      const camera = options.savedCamera || { yaw: .6, pitch: .4 };
      const viewer = { selected: 'neutral', setView(view) {
        assert(Object.hasOwn(model.views, view), 'an authored question selects a real view');
        this.selected = view;
      }, getState: () => camera, destroy: () => svg.remove() };
      mounts.push(viewer);
      return viewer;
    }
  };
  for (const file of ['stereo-course/assets/math-text.js', 'stereo-course/merzlyak-10-base/assets/engine.js']) {
    win.eval(fs.readFileSync(path.join(root, file), 'utf8'));
  }
  const app = win.StereoTextbook.createApp(doc.getElementById('app'), copy(sample));
  return { win, doc, app, errors, mounts,
    state: lesson => JSON.parse(win.localStorage.getItem(storageKey(lesson))),
    close() { app.destroy(); win.close(); } };
}
function input(f, selector, value) {
  const field = f.doc.querySelector(selector);
  assert(field, selector);
  field.value = value;
  field.dispatchEvent(new f.win.Event('input', { bubbles: true }));
  return field;
}
function submit(f, form) {
  form.dispatchEvent(new f.win.Event('submit', { bubbles: true, cancelable: true }));
}
function displayText(element) {
  const clone = element.cloneNode(true);
  for (const fraction of [...clone.querySelectorAll('.stereo-fraction')].reverse()) {
    fraction.replaceWith(fraction.querySelector('.stereo-numerator').textContent + '/' +
      fraction.querySelector('.stereo-denominator').textContent);
  }
  return clone.textContent;
}
const tick = () => new Promise(resolve => setTimeout(resolve, 5));

test('six source conditions, proofs, answers, geometry, old views and progress revisions remain exact', () => {
  for (const [index, lesson] of lessons.entries()) {
    assert.equal(hash(mathContract(lesson)), contracts[index], lesson.id);
    assert.equal(hash(Object.fromEntries(oldViews[index].map(name => [name, lesson.visualization.model.views[name]]))),
      oldViewHashes[index], lesson.id + ' existing views');
    assert.equal(lesson.answer.mode, 'manual');
  }
});

test('six reviewed cards match the rebuilt bundle; other 983 cards and catalog records remain exact', () => {
  for (const lesson of lessons) {
    assert.equal(lesson.status, 'reviewed', lesson.id + ' requires current content review');
    assert.deepEqual(API.validateLesson(lesson, bundle.catalog.book), [], lesson.id);
    assert.deepEqual(bundle.lessons.find(item => item.id === lesson.id), lesson, lesson.id + ' generated content');
  }
  const unrelated = copy(bundle);
  unrelated.catalog.entries = unrelated.catalog.entries.filter(item => !ids.has(item.id));
  unrelated.lessons = unrelated.lessons.filter(item => !ids.has(item.id));
  assert.equal(unrelated.lessons.length, 983);
  assert.equal(hash(unrelated), '82f62edc1278c7f5ba2244a0ac7c4571d417ef2fbb981e3269007977a406ab80');
});

test('tiered help and each intermediate question use existing points with bounded labels', () => {
  for (const lesson of lessons) {
    const model = lesson.visualization.model;
    assert(lesson.statement.givens.length > 0);
    assert(lesson.help.some(item => item.children?.length));
    for (const item of helpItems(lesson.help)) {
      assert(Object.hasOwn(model.views, item.view), lesson.id + ' / ' + item.id);
      assert(item.text.length <= 250, 'one short help item: ' + item.id);
    }
    for (const step of lesson.steps) {
      assert(step.prompt.includes('?'), lesson.id + ' / ' + step.id + ' asks before explaining');
      assert(Object.hasOwn(model.views, step.view));
    }
    for (const view of Object.values(model.views)) {
      const points = new Set([...(view.points || []), ...(view.polygon || []), ...(view.segments || []).flat()]);
      assert(points.size <= 8, lesson.id + ' avoids adding unreadable label clusters');
      assert([...points].every(point => Object.hasOwn(model.points, point)));
    }
  }
});

test('the selected view labels the endpoints needed for each construction or intermediate ratio', () => {
  // Task requirements, not all letters in contextual plane names. With labelNames=[]
  // the real viewer labels only endpoints, polygon vertices and explicit view.points.
  const required = [
    ['M N K X Y', 'A B C D M N K', 'B D Z X K M Y'],
    ['M N P', 'M N O P A B C C1', 'A B C1 D1 M Q O', 'M N P O Q R S', 'M N P Q R S'],
    ['A A1 B B1 X Y', 'C1 X Y U V A B C', 'X Y U V A B'],
    ['A1 B1 X Y P', 'P C1 X H', 'A B C D', 'A X A1 P Y T D1 C1', 'A X A1 F V T D1 E1', 'X J E1 T V'],
    ['A N A1 C1 T', 'Q N C D C1 D1 R', 'A R P B C', 'T U Q D1 M C1 A1', 'N C1 Q C R D', 'R C P D A B'],
    ['E F A D K', 'B U G A D P Q', 'A K C P E L B', 'A C P Q E F G']
  ];
  for (const [index, lesson] of lessons.entries()) {
    for (const [stepIndex, step] of lesson.steps.entries()) {
      const view = lesson.visualization.model.views[step.view];
      const visible = new Set([...(view.points || []), ...(view.polygon || []), ...(view.segments || []).flat()]);
      for (const point of required[index][stepIndex].split(' ')) {
        assert(visible.has(point), `${lesson.id} ${step.id}: required point ${point} has no label`);
      }
    }
  }
});

test('every question precedes a closed explanation and correct intermediate answers never certify a proof', () => {
  const f = boot();
  try {
    let fields = 0;
    for (const lesson of lessons) {
      assert.equal(f.app.open(lesson.id), true, lesson.id);
      assert.equal(f.doc.querySelectorAll('[data-step]').length, 0);
      assert.equal(f.state(lesson), null, 'opening a card is not help');
      for (const step of lesson.steps) {
        f.doc.querySelector('[data-step-hint]').click();
        const section = f.doc.querySelector(`[data-step="${step.id}"]`);
        assert(section);
        assert.equal(section.querySelector('[data-step-explanation]').open, false);
        assert.equal(f.mounts.at(-1).selected, step.view);
        assert.equal(f.state(lesson).assisted, true);
        if (!step.input) continue;
        fields++;
        const form = section.querySelector('form'), feedback = form.querySelector('[role="status"]');
        input(f, `#step-${step.id}`, 'ошибка'); submit(f, form);
        assert.equal(displayText(feedback), step.input.feedback);
        for (const accepted of step.input.accepted) {
          input(f, `#step-${step.id}`, accepted); submit(f, form);
          assert.equal(feedback.textContent, 'Ответ на этот шаг совпал.');
        }
        assert.equal(f.state(lesson).checked, false, 'partial correctness is not proof correctness');
        assert.equal(f.state(lesson).manualSaved, false);
      }
      input(f, '#final-answer', 'Собственное доказательство: каждый переход ещё нужно проверить.');
      submit(f, f.doc.querySelector('[data-final-form]'));
      assert.equal(f.state(lesson).manualSaved, true);
      assert.equal(f.state(lesson).checked, false);
      assert.equal(f.state(lesson).assisted, true);
      assert.match(f.doc.querySelector('[data-final-feedback]').textContent, /обсудить с учителем/);
    }
    assert.equal(fields, 12);
    assert.deepEqual(f.errors, []);
  } finally { f.close(); }
});

test('nested help selects its authored view and remains assistance after saving', async () => {
  const f = boot();
  try {
    for (const lesson of lessons) {
      f.app.open(lesson.id);
      f.doc.querySelector('[data-main-help]>summary').click(); await tick();
      for (const item of helpItems(lesson.help)) {
        const disclosure = f.doc.querySelector(`[data-help="${item.id}"]`);
        disclosure.open = true; await tick();
        assert.equal(f.mounts.at(-1).selected, item.view, lesson.id + ' / ' + item.id);
      }
      assert.equal(f.state(lesson).assisted, true);
      assert.equal(f.state(lesson).checked, false);
    }
    assert.deepEqual(f.errors, []);
  } finally { f.close(); }
});

test('legacy drafts, opened steps and camera survive without changing storage keys or hydration writes', async () => {
  for (const lesson of lessons) {
    const raw = JSON.stringify({ draft: 'Моя прежняя запись о сечении.', stepDrafts: { 'step-2': 'Старый промежуточный ответ' },
      revealed: 2, assisted: true, checked: false, camera: { yaw: .35, pitch: .2 } }, null, 2);
    const f = boot({ [storageKey(lesson)]: raw });
    try {
      f.app.open(lesson.id); await tick();
      assert.equal(f.doc.querySelector('#final-answer').value, 'Моя прежняя запись о сечении.');
      assert.equal(f.doc.querySelectorAll('[data-step]').length, 2);
      assert.deepEqual(copy(f.mounts.at(-1).getState()), { yaw: .35, pitch: .2 });
      if (lesson.steps[1].input) assert.equal(f.doc.querySelector('#step-step-2').value, 'Старый промежуточный ответ');
      assert.equal(f.win.localStorage.getItem(storageKey(lesson)), raw);
      assert.equal(f.state(lesson).checked, false);
    } finally { f.close(); }
  }
});

test('both distinct section-4 ratios remain examples and never become a unique exact final answer', () => {
  const lesson = lessons[3], points = lesson.visualization.model.points;
  const distance = (a, b) => Math.hypot(...points[a].map((x, i) => x - points[b][i]));
  assert(Math.abs(distance('A', 'Y') / distance('Y', 'A1') - 2 / 3) < 1e-7);
  assert(Math.abs(distance('A', 'V') / distance('V', 'A1') - 1 / 3) < 1e-7);
  assert.equal(lesson.answer.mode, 'manual');
  assert.equal(lesson.answer.accepted, undefined);
  assert.match(lesson.steps.at(-1).explanation, /единственного численного отношения.*нет/);
  assert(lesson.steps[3].input.accepted.includes('2:3'));
  assert(lesson.steps[4].input.accepted.includes('1:3'));
});
