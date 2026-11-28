'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {JSDOM, ResourceLoader, VirtualConsole} = require('jsdom');
const {resolvePublicScript} = require('./public-page-script.cjs');
const map = require('../ege-profil/exam-map.js');
const root = path.resolve(__dirname, '..');
const startBanks = ['geometry', 'stereo', 'algebra', 'probability', 'equations', 'functions', 'applied', 'finance', 'readiness', 'vector-basics'];
const start = startBanks.flatMap(name => require('../ege-profil/start/' + name + '-data.js'));
const partTwo = ['algebra', 'geometry', 'models'].flatMap(name => require('../ege-profil/part-two/content-' + name + '.js'));
const digest = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const plain = value => JSON.parse(JSON.stringify(value));
const pause = () => new Promise(resolve => setTimeout(resolve, 5));

async function boot(area, hash, saved = []) {
  const file = path.join(root, 'ege-profil', area, 'index.html');
  const dom = new JSDOM(fs.readFileSync(file, 'utf8'), {url: 'https://mathexam.space/ege-profil/' + area + '/' + hash, runScripts: 'outside-only', pretendToBeVisual: true});
  const w = dom.window;
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  saved.forEach(([key, value]) => w.localStorage.setItem(key, value));
  for (const script of w.document.querySelectorAll('script[src]')) {
    const src = script.getAttribute('src');
    if (src.startsWith('/assets/')) continue;
    w.eval(fs.readFileSync(resolvePublicScript(root, path.dirname(file), src), 'utf8'));
  }
  await pause();
  if (w.ProfilePartTwoApp) await w.ProfilePartTwoApp.store.flush();
  return dom;
}
async function go(w, hash) {
  w.location.hash = hash;
  await pause();
  if (w.ProfilePartTwoApp) await w.ProfilePartTwoApp.store.flush();
}
function lessonLinks(w, ids) {
  const hrefs = [...w.document.querySelectorAll('main a[href]')].map(link => link.getAttribute('href'));
  for (const id of ids) assert(hrefs.some(href => href.includes('/' + id)), 'Actual lesson remains reachable: ' + id);
}

async function delayedMapConsumers(file, {supplied = false, reversed = false, fail = false, preFailed = false, late = false} = {}) {
  const url = 'https://mathexam.space/' + file;
  const page = new JSDOM(fs.readFileSync(path.join(root, file), 'utf8'), {url});
  // Use the real consumers, order, URLs and data attributes from each unchanged
  // page. This isolates their dependency contract from unrelated trainer code.
  let tags = [...page.window.document.querySelectorAll('script[src]')].filter(script =>
    /\/ege-profil\/(?:start\/course-links|skill-map(?:-data)?)\.js$/.test(new URL(script.src).pathname));
  assert.equal(tags.length, 3, file);
  if (reversed) tags = [tags[1], tags[2], tags[0]];
  const attributes = tags.map(script => [...script.attributes].map(attribute => [attribute.name, attribute.value]));
  const html = '<html><head>' + (supplied ? '<script ' + (preFailed ? 'defer' : 'async') + ' src="/ege-profil/exam-map.js?v=20261115-fipi-map"></script>' : '') +
    (late ? '' : tags.map(script => script.outerHTML).join('')) + '</head><body><h1>Учебная тема</h1></body></html>';
  page.window.close();
  const pending = [], errors = [];
  class Loader extends ResourceLoader {
    fetch(request) {
      const pathname = new URL(request).pathname;
      if (pathname === '/ege-profil/exam-map.js') {
        const waiting = new Promise((resolve, reject) => pending.push({resolve, reject}));
        waiting.abort = () => {}; // JSDOM may close after a dependency assertion fails.
        if (preFailed) pending[pending.length - 1].reject(new Error('Intentional earlier registry transport failure'));
        return waiting;
      }
      assert.match(pathname, /\/ege-profil\/(?:start\/course-links|skill-map(?:-data)?)\.js$/);
      return Promise.resolve(fs.readFileSync(path.join(root, pathname)));
    }
  }
  const console = new VirtualConsole();
  console.on('jsdomError', error => errors.push(error));
  const dom = new JSDOM(html, {url, runScripts: 'dangerously', resources: new Loader(), virtualConsole: console});
  const w = dom.window;
  try {
    await new Promise(resolve => w.document.addEventListener('DOMContentLoaded', resolve, {once: true}));
    if (late) {
      if (w.document.readyState !== 'complete') await new Promise(resolve => w.addEventListener('load', resolve, {once: true}));
      assert.equal(w.document.readyState, 'complete');
      for (const list of attributes) {
        const script = w.document.createElement('script');
        for (const [name, value] of list) script.setAttribute(name, value);
        await new Promise((resolve, reject) => {
          script.addEventListener('load', resolve, {once: true});
          script.addEventListener('error', () => reject(new Error('Consumer failed to load')), {once: true});
          w.document.head.append(script);
        });
      }
    }
    assert.equal(pending.length, 1, file + ': one pending map request');
    assert.equal([...w.document.querySelectorAll('script[src]')].filter(script =>
      new URL(script.src).pathname === '/ege-profil/exam-map.js').length, 1, file + ': one map script');
    assert.equal(w.ProfileExamMap, undefined, 'The registry is still unavailable');
    assert(w.ProfileExamMapReady && typeof w.ProfileExamMapReady.then === 'function', 'Consumers share readiness');
    if (preFailed) assert.equal(errors.length, 1, 'The supplied script failed before the consumers subscribed');
    else if (fail) pending[0].reject(new Error('Intentional registry transport failure'));
    else pending[0].resolve(fs.readFileSync(path.join(root, 'ege-profil/exam-map.js')));
    const registry = await w.ProfileExamMapReady;
    await pause();
    if (fail || preFailed) {
      assert.equal(registry, null, 'A failed request cannot report a loaded registry');
      assert.equal(w.ProfileExamMap, undefined);
      assert.equal(errors.length, 1, 'The transport error remains observable');
      assert.match(errors[0].message, /Could not load script/);
    } else {
      assert.equal(registry, w.ProfileExamMap);
      assert.equal(registry.entries.length, 19);
      assert.deepEqual(errors, []);
    }
    assert.equal(pending.length, 1, 'No second request after settlement');
    assert.equal(w.document.querySelectorAll('#profile-course-nav').length, 1);
    assert.equal(w.document.querySelectorAll('[data-profile-skill-trigger]').length, 1);
  } finally {
    // Settle every pending request even when an assertion exposes a duplicate.
    for (const request of pending) request.resolve(fs.readFileSync(path.join(root, 'ege-profil/exam-map.js')));
    w.close();
  }
}

test('H02 unchanged nested pages share one delayed map request across navigation and skill maps', {timeout: 5000}, async () => {
  for (const file of ['ege-profil/trainers/stereo/index.html', 'ege-profil/trainers/stereo/trainer.html', 'ege-profil/trigonometry/index.html']) {
    await delayedMapConsumers(file);
  }
  await delayedMapConsumers('ege-profil/trainers/stereo/trainer.html', {reversed: true});
  await delayedMapConsumers('ege-profil/trainers/stereo/trainer.html', {supplied: true});
});

test('H02 failed map loading stays observable without duplicate requests or false readiness', {timeout: 5000}, async () => {
  await delayedMapConsumers('ege-profil/trainers/stereo/trainer.html', {fail: true});
});

test('H02 an earlier failed deferred map settles for consumers before and after window load', {timeout: 5000}, async () => {
  await delayedMapConsumers('ege-profil/trainers/stereo/trainer.html', {supplied: true, preFailed: true});
  await delayedMapConsumers('ege-profil/trainers/stereo/trainer.html', {supplied: true, preFailed: true, late: true});
});

test('H02 official registry has exactly 19 positions, correct parts and 32 primary points', () => {
  assert.deepEqual(map.entries.map(entry => entry.number), Array.from({length: 19}, (_, i) => i + 1));
  assert.equal(new Set(map.entries.map(entry => entry.id)).size, 19);
  // Independent expected subject order from the approved FIPI/H02 table.
  assert.deepEqual(map.entries.map(entry => entry.id), [
    'planimetry', 'vectors', 'stereometry', 'probability', 'compound-probability',
    'equations', 'expressions', 'derivative', 'formulas', 'word-problems', 'functions', 'extrema',
    'part-two-equations', 'part-two-stereometry', 'inequalities', 'finance', 'part-two-planimetry', 'parameters', 'numbers'
  ]);
  assert.deepEqual(map.entries.filter(entry => entry.source === 'start').map(entry => [entry.number, entry.legacyStart]),
    [[1,1],[2,2],[3,3],[4,4],[5,5],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,9],[16,13]]);
  assert.deepEqual(map.entries.filter(entry => entry.part === 1).map(entry => entry.number), Array.from({length: 12}, (_, i) => i + 1));
  assert.deepEqual(map.entries.filter(entry => entry.part === 2).map(entry => entry.points), [2, 3, 2, 2, 3, 4, 4]);
  assert.equal(map.entries.reduce((sum, entry) => sum + entry.points, 0), 32);
  assert.deepEqual(map.extras.map(entry => entry.id), ['random-variables', 'optimization']);
  const startIds = new Set(start.map(lesson => lesson.id)), partIds = new Set(partTwo.map(lesson => lesson.id));
  for (const entry of [...map.entries, ...map.extras]) {
    assert(Object.isFrozen(entry) && Object.isFrozen(entry.lessonIds));
    assert(entry.lessonIds.includes(entry.entry));
    for (const id of [...entry.lessonIds, ...entry.preparationIds]) assert((entry.source === 'start' ? startIds : partIds).has(id), entry.id + ' -> ' + id);
    assert.equal(map.topic(entry.id), entry);
    assert.equal(map.href(entry), '/ege-profil/' + entry.source + '/' + map.hash(entry));
  }
  for (const value of [0, 20, -1, 1.5, NaN, Infinity, '01', '1e1', ' 1', '1/2', {}, null]) assert.equal(map.get(value), null);
});

test('H02 legacy routing identities preserve their subjects and the split calculus group', () => {
  assert.equal(map.fromLegacyStart(6).id, 'random-variables');
  assert.equal(map.fromLegacyStart(7).number, 6);
  assert.equal(map.fromLegacyStart(8).number, 7);
  assert.equal(map.fromLegacyStart(13).number, 16);
  assert.equal(map.fromLegacyStart(16).number, 15);
  assert.deepEqual(map.fromLegacyStart(9).lessonIds, start.filter(lesson => lesson.position === 9).map(lesson => lesson.id));
  assert.equal(map.forLesson('calc-extreme').number, 12);
  assert.equal(map.forLesson('calc-tangent').number, 8);
  assert.equal(map.forLesson('calc-value').number, 8);
  assert.equal(map.forLesson('calc-integral').number, 8);
  assert.deepEqual(map.topic('integral').lessonIds, ['calc-integral']);
  assert.equal(map.get(16).lessonIds.length, 16);
  assert.equal(map.fromLegacyPartTwo(17).id, 'optimization');
  assert.deepEqual([14, 15, 16, 18, 19, 20].map(number => map.fromLegacyPartTwo(number).number), [13, 14, 15, 17, 18, 19]);
});

test('H02 preserves the approved base curriculum, all task IDs, answers and ordering', () => {
  // Snapshots were computed from c6d0643c05962be5065f531a5910b81fe3d4262d.
  // START differs only in three confirmed FIPI source captions and the two
  // corresponding printed-page references (15), plus the applied-percent intro
  // number 13 -> 16; mathematical content is intact.
  assert.equal(start.length, 90);
  assert.equal(start.reduce((count, lesson) => count + lesson.tasks.length, 0), 540);
  assert.equal(partTwo.length, 42);
  assert.equal(partTwo.reduce((count, lesson) => count + lesson.tasks.length, 0), 264);
  for (const lesson of partTwo) {
    assert.deepEqual(lesson.tasks.slice(6).map(task => task.id),
      lesson.exam === 14 ? [`${lesson.id}-7`, `${lesson.id}-8`] : []);
  }
  const preservedPartTwo = partTwo.map(lesson => ({ ...lesson, tasks: lesson.tasks.slice(0, 6) }));
  // №13 corrects one theory paragraph: cancellation requires a nonzero divisor.
  // Check the new wording, then reconstruct the exact earlier bank for the two historical digests.
  const factors = preservedPartTwo.find(lesson => lesson.id === 'p14-trig-factors');
  assert.equal(factors.theory[1], 'Произведение равно нулю, когда хотя бы один множитель равен нулю. Делить на sin x можно лишь при sin x ≠ 0. Отдельно рассмотрите случай sin x = 0, затем объедините решения.');
  factors.theory = factors.theory.slice();
  factors.theory[1] = 'Произведение равно нулю, когда хотя бы один множитель равен нулю. Деление на sin x потеряло бы все корни sin x = 0.';
  // #607 changes only six pairs of powers hints and one prerequisite in this bank.
  // Seal the new bank, then undo exactly those fields before checking the previous seals.
  assert.equal(digest(start), '4918dca85b009f0cde547b5a40e1d6fd933ce231df432879cf985d5bb4576b56');
  const restoredModules = {};
  const restoreBank = () => startBanks.flatMap(name =>
    restoredModules['ege-profil/start/' + name + '-data.js'] || require('../ege-profil/start/' + name + '-data.js'));
  const equations = restoredModules['ege-profil/start/equations-data.js'] = plain(require('../ege-profil/start/equations-data.js'));
  for (const task of equations.find(lesson => lesson.id === 'expr-powers').tasks) {
    delete task.independentHint;
    task.steps[0].hint = 'При одинаковом основании складываем показатели, а основание оставляем прежним.';
  }
  const functions = restoredModules['ege-profil/start/functions-data.js'] = plain(require('../ege-profil/start/functions-data.js'));
  functions.find(lesson => lesson.id === 'calc-special').prereq.text = '<p>√9 = 3. Число в нулевой степени равно 1. Для a/x сначала определяем ненулевой знаменатель.</p>';
  // PR 664 clarifies only 20 prompt/hint/why strings in similar-triangle and
  // cube-edge steps. Seal the reviewed copy and independently restore the H02
  // bank: IDs, numerical answers, task ordering and every other field stay exact.
  assert.equal(digest(restoreBank()), '1a346b954dc06d67ccbf2b8bdf206d5aeb575f42dd4e1e1f94f3cc44971fd1b6');
  const inverse = require('./fixtures/profile-reviewed-ratio-copy.json');
  assert.equal(inverse.length, 20);
  for (const entry of inverse) {
    assert(['ege-profil/start/geometry-data.js', 'ege-profil/start/stereo-data.js'].includes(entry.file));
    assert(['prompt', 'hint', 'why'].includes(entry.path.at(-1)));
    const rows = restoredModules[entry.file] ||= plain(require('../' + entry.file));
    const parent = entry.path.slice(0, -1).reduce((value, key) => value[key], rows);
    const key = entry.path.at(-1);
    assert.equal(parent[key], entry.after, entry.file + ':' + entry.path.join('.'));
    parent[key] = entry.before;
  }
  // PR 655 revises only the six explanatory fields of the earlier vector lesson.
  // Restore them after the ratio inverse, so both reviews share the original seal.
  const earlierStart = plain(restoreBank());
  const opposites = earlierStart.find(lesson => lesson.id === 'vec-basics-equality');
  opposites.title = 'Направление, равенство и перенос';
  opposites.summary = 'Сравни стрелки и отложи равный вектор от новой точки.';
  opposites.intro = '<p>Ненулевые векторы коллинеарны, если лежат на одной прямой или на параллельных прямых. Коллинеарные ненулевые векторы могут быть сонаправлены или противоположно направлены. Равные ненулевые векторы сонаправлены и имеют одинаковую длину. Все нулевые векторы равны.</p>';
  opposites.prereq.text = '<p>Сравни поворот и длину двух стрелок. При переносе повтори от новой точки тот же ход по клеткам.</p>';
  const example = opposites.tasks.find(task => task.id === 'vec-basics-parallel-opposite');
  example.explanation = 'Стрелки лежат на параллельных прямых, но направлены в противоположные стороны.';
  example.steps.at(-1).why = example.explanation;
  assert.equal(digest(earlierStart), 'c60b1e343d35b0039601e5e41d8a3862537807adb0d1c64c6cc671a2f5211d9b');

  // Accepted H04 adds explicit answerFormat descriptors without changing the
  // mathematical bank. Preserve its full snapshot from main 1469ad50 as well
  // as the original H02 snapshot with only that metadata removed.
  assert.equal(digest(preservedPartTwo), '1e81234793712d0c5f61ce416b62a6044aada8598b0ee4766aa81f1fb59cfbdd');
  const beforeAnswerFormat = JSON.parse(JSON.stringify(preservedPartTwo, (key, value) => key === 'answerFormat' ? undefined : value));
  assert.equal(digest(beforeAnswerFormat), '826602f90743e1e0fe8d4e0f825441eb8fa090a63575f1fa6dc99d9a1bdd74e7');
  const skills = require('../ege-profil/skill-map-data.js');
  assert.equal(digest(Object.entries(skills.maps).map(([key, value]) => [key, value.challenges])), '99ecc0b2b022473b160f41537a346022e162973ed8350ad67e500fb85ca5b37a');
  assert.equal(digest(Object.entries(skills.trainers).map(([key, value]) => [key, value.challenges])), 'b1f864936a7b3521099dbf0dd4dba18a47205388427a7f635c2eba65c237cb68');
});

test('H02 preserves H01 parsing, START persistence and the existing exam bank', () => {
  // The shared timed exam page serves both editions. The 2027 exam browser
  // suite checks the legacy page using fixed 2026 task and scoring fixtures.
  const files = {
    'ege-profil/start/checks.js': 'cf2db7ec857df82b6aa5a2097a827f96f2da6e2c0e9a56f79c8087664715f242',
    'ege-profil/start/state.js': '3ebfbbd56d01d0a710e253acbc086c3a9a6b0a59d2302ee3ae8904dce29d2bac',
    'ege-profil/exam/bank.js': '305b6bf3477df7c7c238f2b5885c177a144b2e7753d589c1357db8819fa377b8',
    'ege-profil/exam/variant.html': '5e434dd78f68e58425998d00375b7c79bcbef14c77086f1bc01f8e246709d34d'
  };
  for (const [file, expected] of Object.entries(files)) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex'), expected, file);
});

test('H02 all canonical routes show their number and real lessons without writing progress', async () => {
  for (const area of ['start', 'part-two']) {
    const dom = await boot(area, area === 'start' ? '#calm' : '#map', [['unrelated-progress', 'unchanged']]);
    const w = dom.window;
    try {
      for (const entry of map.entries.filter(item => item.source === area)) {
        await go(w, map.hash(entry));
        const text = w.document.querySelector('main').textContent;
        assert.match(text, new RegExp('№\\s*' + entry.number + '(?:\\D|$)'), entry.id);
        lessonLinks(w, entry.number === 2 ? entry.preparationIds : entry.lessonIds);
      }
      for (const entry of map.extras.filter(item => item.source === area)) {
        await go(w, map.hash(entry));
        assert.match(w.document.querySelector('main').textContent, /[Дд]ополнительн/);
        lessonLinks(w, entry.number === 2 ? entry.preparationIds : entry.lessonIds);
      }
      assert.equal(w.localStorage.getItem('mathexam.profileStart2027.v1'), null, 'Navigation creates no START record');
      assert.equal(Object.keys(w.localStorage).filter(key => key.startsWith('mathExam.profile.partTwo.v1.')).length, 0, 'Navigation creates no Part Two completion');
      assert.equal(w.localStorage.getItem('unrelated-progress'), 'unchanged');
    } finally { w.close(); }
  }
});

test('H02 bookmarked numeric routes still expose their original subjects', async () => {
  const dom = await boot('start', '#calm/13'), w = dom.window;
  try {
    for (const hash of ['#calm/13', '#exam/13']) {
      await go(w, hash);
      lessonLinks(w, map.get(16).lessonIds);
      assert.match(w.document.querySelector('main').textContent, /№\s*16/);
    }
    for (const hash of ['#calm/9', '#exam/9']) {
      await go(w, hash);
      lessonLinks(w, map.fromLegacyStart(9).lessonIds);
    }
    await go(w, '#exam/16');
    assert.match(w.document.querySelector('main h1').textContent, /Неравенства/);
    assert.match(w.document.querySelector('main').textContent, /№\s*15/);
  } finally { w.close(); }
  const other = await boot('part-two', '#exam/14');
  try {
    for (let legacy = 14; legacy <= 20; legacy++) {
      await go(other.window, '#exam/' + legacy);
      lessonLinks(other.window, map.fromLegacyPartTwo(legacy).lessonIds);
    }
  } finally { other.window.close(); }
});

test('H02 saved Part Two proof, attempts, help and lab identity survive official navigation', async () => {
  const API = require('../ege-profil/part-two/state.js');
  const values = new Map();
  const storage = {getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, String(value))};
  const store = API.create(storage), task = partTwo.find(lesson => lesson.id === 'param-linear').tasks[3];
  await store.attempt(task.id, {kind: 'final', answers: ['wrong'], correct: false, mode: 'independent', independentEligible: true});
  await store.patch(task.id, record => {record.drafts.proof = 'Сохранённое обоснование'; record.drafts.final = task.final.map(() => '12/5'); record.helped = true;});
  const labKey = 'mathexam.profilePartTwoLab.v1.19';
  const lab = {version: 1, p: 3, changed: true, prediction: {value: '2', correct: false}, transferFirst: null, transferLast: null, draft: '7'};
  values.set(labKey, JSON.stringify(lab));
  const snapshot = [...values.entries()];
  const dom = await boot('part-two', '#fipi/2027/18', snapshot), w = dom.window;
  try {
    await go(w, '#task/' + task.id + '/independent');
    assert.equal(w.document.getElementById('proof-draft').value, 'Сохранённое обоснование');
    assert.equal(w.ProfilePartTwoApp.store.read(task.id).attempts[0].answers[0], 'wrong');
    assert.equal(w.ProfilePartTwoApp.store.read(task.id).helped, true);
    await go(w, '#fipi/2027/18');
    for (const [key, value] of snapshot) assert.equal(w.localStorage.getItem(key), value, key);
    assert.equal(w.localStorage.getItem('mathexam.profilePartTwoLab.v1.18'), null, 'Official 18 must not migrate legacy lab 19');
    assert.deepEqual(plain(w.ProfilePartTwoLabs.createStore(19, w.localStorage).snapshot()), lab);
  } finally { w.close(); }
});
