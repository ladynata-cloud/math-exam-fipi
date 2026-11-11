'use strict';

// DOM router contract only; native browser and visual checks remain separate.
// Optional argument: checkout root, for comparing the same test against other refs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const topics = JSON.parse(read('content/course-entrances/topics.json'));

const courses = [
  { name: 'peterson6', lesson: 'p08', key: 'mathexam.peterson6.part1.v1',
    scripts: ['math.js', 'models.js', 'data.js', 'app.js'] },
  { name: 'makarychev8', lesson: 'p02', key: 'mathexam.makarychev8.2024.v1',
    scripts: ['../peterson6/math.js', 'task-graphs.js', 'check.js', 'models.js', 'data.js', 'app.js'] }
];

function open(course) {
  const entry = 'https://course.test/school/' + course.name + '/';
  const lesson = '#lesson/' + course.lesson + '/0';
  const errors = [], virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error.message));
  virtualConsole.on('error', (...args) => errors.push(args.join(' ')));
  const dom = new JSDOM(read('school/' + course.name + '/index.html'), {
    url: entry + lesson, runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole
  });
  const w = dom.window, d = w.document;
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.matchMedia = media => ({ media, matches: false, addEventListener() {}, removeEventListener() {} });
  // The same real curriculum scripts as test-ui.cjs, plus the entrance adapter.
  for (const file of ['assets/course-examples-data.js', 'assets/course-examples.js',
    ...course.scripts.map(file => 'school/' + course.name + '/' + file)]) w.eval(read(file));
  return { w, d, entry, lesson, errors, close: () => w.close() };
}

function navigate(w, url) {
  const changed = new Promise(resolve => w.addEventListener('hashchange', resolve, { once: true }));
  w.location.href = url;
  return changed;
}

for (const course of courses) test(course.name + ': hash return waits for the real router and preserves work', { timeout: 10000 }, async () => {
  const f = open(course), { w, d } = f;
  try {
    const input = (selector, value) => {
      const element = d.querySelector(selector);
      assert.ok(element, selector);
      element.value = value;
      element.dispatchEvent(new w.Event('input', { bubbles: true }));
    };
    input('#final-answer', '123');
    input('#notebook', 'Synthetic unfinished calculation');
    const summary = d.querySelector('[data-ce-native] > summary');
    assert.ok(summary, 'the lesson retains its native explanation');
    summary.click();
    const saved = () => w.localStorage.getItem(course.key);
    const tasks = JSON.parse(saved()).tasks;
    const taskId = Object.keys(tasks).find(id => tasks[id].value === '123');
    assert.ok(taskId, 'draft is persisted through the actual input handler');
    const original = tasks[taskId];
    assert.equal(original.assisted, true);
    assert.equal(original.correct, false);
    assert.equal(original.independent, false);
    const expected = topics.filter(t => t.course === course.name)
      .map(t => '/school/' + course.name + '/topics/' + t.slug + '/');
    assert.equal(expected.length, 3);
    const links = () => [...d.querySelectorAll('.ce-native-link .ce-links a')]
      .map(a => a.getAttribute('href'));

    for (let visit = 0; visit < 3; visit++) {
      assert.equal(d.querySelector('#final-answer').value, '123');
      assert.equal(d.querySelector('#notebook').value, original.note);
      const before = saved();
      const changed = navigate(w, f.entry);
      assert.equal(w.location.hash, '');
      // Same-document navigation changes the URL before dispatching hashchange.
      // Reading count() at this point reproduces the old browser assertion's 0.
      assert.deepEqual(links(), [], 'catalogue is absent before hashchange renders home');
      const event = await changed;
      assert.equal(event.newURL, f.entry);
      assert.equal(d.querySelectorAll('.ce-native-link').length, 1, 'one catalogue per home render');
      assert.deepEqual(links(), expected, 'all three original destinations remain present');
      assert.equal(saved(), before, 'returning home does not rewrite saved work');
      assert.deepEqual(JSON.parse(saved()).tasks[taskId], original, 'assisted draft and credit are preserved');
      assert.equal(d.querySelector('.error-page'), null);
      if (visit < 2) await navigate(w, f.entry + f.lesson);
    }
    assert.deepEqual(f.errors, []);
  } finally { f.close(); }
});
