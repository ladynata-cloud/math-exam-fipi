'use strict';
// Source, publication, progression and retention boundaries for chapter III's
// final eleven cards. Independent mathematics and actual pixels are separate.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const dir = path.join(root, 'stereo-course/textbook/lessons');
const baseline = require('./additional310-baseline.cjs');
const {sha, published, ids} = baseline;
const later = require('./cylinder-baseline.cjs');
const currentIndex = require(root + '/stereo-course/textbook/source-index.json');
const sourceIndex = later.previousIndex(currentIndex);
const production = later.previousCourse(require(root + '/stereo-course/textbook/data/course.json'), currentIndex);
const registry = later.previousRegistry(require('./content-review.json'));
const screenshots = later.previousCases(require('./browser-cases.cjs'));
const API = require(root + '/stereo-course/textbook/assets/engine.js');
const reportPath = 'docs/reviews/ATANASYAN_CHAPTER_III_FINAL_310_319_CONTENT.json';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const content = card => {
  const copy = structuredClone(card);
  delete copy.status;
  delete copy.review;
  return copy;
};
const exact = (actual, expected, label) => {
  assert.equal(new Set(actual).size, actual.length, label + ': unique');
  assert.deepEqual([...actual].sort(), [...expected].sort(), label);
};
const allHelp = items => items.flatMap(item => [item, ...allHelp(item.children || [])]);

// Exact authored states and append-only capture inventory for this increment.
const CHECKPOINT = {
  steps: 73,
  views: 84,
  cases: 84,
  captureSHA256: '7bcf6d3a5f08530a3fa861cae5ee230858e52584044f140acc441390f4ef9228'
};
const report = JSON.parse(fs.readFileSync(path.join(root, reportPath), 'utf8'));
const expected = [...ids];
const cards = expected.map(id => JSON.parse(fs.readFileSync(path.join(dir, id + '.json'), 'utf8')));
const previous = baseline.previousCourse(production, sourceIndex);
const previousRegistry = baseline.previousRegistry(registry);
baseline.previousCases(screenshots);

// Check the whole prior release, including raw authored bytes and registered
// reviews, and prove that corruption cannot be hidden by the projection.
const corruptCourse = structuredClone(production);
corruptCourse.lessons.find(card => !ids.has(card.id)).title += ' changed';
assert.throws(() => baseline.previousCourse(corruptCourse, sourceIndex), /complete prior 507/);
const corruptRegistry = structuredClone(registry);
corruptRegistry.cards[0].sha256 = '0'.repeat(64);
assert.throws(() => baseline.previousRegistry(corruptRegistry), /complete prior review/);
const corruptIndex = structuredClone(sourceIndex);
corruptIndex.entries[0].source.printedPages = [999];
assert.throws(() => baseline.previousIndex(corruptIndex), /exact source index/);
const corruptCases = new Map(screenshots);
corruptCases.set([...corruptCases.keys()][0], 'changed-historical-case');
assert.throws(() => baseline.previousCases(corruptCases), /all 1188 prior browser cases/);
const rawPrevious = require('./sphere-baseline.cjs').previousLessonFiles(dir)
  .filter(name => name.endsWith('.json') && !require('./cone-baseline.cjs').ids.has(name.slice(0, -5)) && !ids.has(name.slice(0, -5)) && !later.ids.has(name.slice(0, -5)))
  .sort().map(name => [name, hash(fs.readFileSync(path.join(dir, name)))]);
assert.equal(rawPrevious.length, 507);
assert.equal(sha(rawPrevious), published.rawLessonManifestSHA256, 'all 507 prior authored files byte-identical');
assert.equal(sha(previousRegistry.cards), published.reviewRowsSHA256, 'all 507 prior review rows');
assert.equal(sha(previousRegistry.batches), published.reviewBatchesSHA256, 'all 26 prior review batches');
for (const [file, value] of Object.entries(published.immutableFiles)) {
  require('./companion-migration.cjs').assertHistoricalFile(file, value);
}
assert.equal(previous.lessons.length, 507);
assert.equal(previous.catalog.entries.length, 1374);
assert.equal(registry.cards.length, 518);
assert.equal(registry.batches.length, 27);
exact(registry.batches.at(-1).cardIds, expected, 'one exact independent review batch');
exact(registry.cards.map(row => row.id), production.lessons.map(card => card.id), 'one review per integrated card');
exact(production.lessons.filter(card => !previous.lessons.some(old => old.id === card.id)).map(card => card.id), expected, 'only eleven additional cards');

assert.equal(report.authorBase, published.commit);
assert.equal(report.sourceSHA256, sourceIndex.sourceSHA256);
assert.equal(report.verdict, 'PASS_INDEPENDENT_SOURCE_MATHEMATICS_AND_WRITTEN_PEDAGOGY');
assert.equal(report.authorReviewerSeparation.reviewerAuthoredLessons, false);
assert(Number.isFinite(Date.parse(report.reviewedAt)), 'independent review timestamp');
assert.deepEqual(report.openFindings, [], 'no unresolved source or mathematical findings');
exact(report.cards.map(card => card.id), expected, 'independent review scope');
assert.equal(report.aggregateSHA256, sha(cards.map(content)), 'independent aggregate binds the exact eleven cards');
assert.equal(report.oracle.path, 'tools/stereo-textbook/additional310-math.test.py');
assert.equal(hash(fs.readFileSync(path.join(root, report.oracle.path))), report.oracle.sha256, 'independently reviewed mathematical oracle');
assert.equal(registry.batches.at(-1).sourceBundleSHA256, report.aggregateSHA256, 'registered aggregate');
assert.equal(registry.batches.at(-1).reviewer, report.reviewer, 'registered independent reviewer');
assert.equal(registry.batches.at(-1).reviewedAt, report.reviewedAt, 'registered review timestamp');
assert.equal(registry.batches.at(-1).mathematicalReport, reportPath);

const Ajv = require('ajv/dist/2020');
const ajv = new Ajv({allErrors: true, strict: true});
require('ajv-formats')(ajv);
const validate = ajv.compile(require(root + '/stereo-course/textbook/schema/lesson.schema.json'));
const {JSDOM} = require('jsdom');
const dom = new JSDOM('<div id="app"></div><div id="model"></div>', {
  url: 'https://example.test/stereo-course/textbook/', pretendToBeVisual: true, runScripts: 'outside-only'
});
const win = dom.window;
for (const file of ['math-text.js', 'task-scene-viewer.js']) {
  win.eval(fs.readFileSync(root + '/stereo-course/assets/' + file, 'utf8'));
}
win.HTMLElement.prototype.scrollIntoView = () => {};
const allById = new Map(production.lessons.map(card => [card.id, card]));
const exactAnswers = {'ex-main-0310': '540', 'ex-main-0311-a': '315', 'ex-main-0313': '54', 'ex-main-0319': '3'};
// Explicit mathematical operands must remain whole in the actual page. Merely
// finding a fraction bar does not detect a clipped or partially parsed numerator.
const fractionCases = {
  'ex-main-0310': [
    ['step-1', '(8 · 25)', '2'], ['step-6', '(40 · 17)', '2']
  ],
  'ex-main-0311-a': [
    ['step-2', '(135 + 117)', '2'], ['step-3', '(2 · 84)', '14']
  ],
  'ex-main-0311-b': [
    ['step-6', '(DA · AE)', 'DE'], ['step-6', '(9 · 12)', '15'], ['step-6', '36', '5']
  ],
  'ex-main-0312': [
    ['step-4', '180°', 'n'], ['step-6', '(r · tan φ)', 'R'],
    ['step-6', 'r', 'R'], ['step-6', '180°', 'n']
  ],
  'ex-main-0313': [
    ['step-2', '(a√3)', '2'], ['step-2', '(a√3)', '6'], ['step-7', '((36 + 18) · 2)', '2']
  ],
  'ex-main-0314': [
    ['step-3', '(a − b)', '2'], ['step-6', '(56 − 24)', '2']
  ],
  'ex-main-0315': [
    ['step-2', '(a√2)', '2'], ['step-3', '(2SM)', '3'],
    ['step-3', '(2SN)', '3'], ['step-3', '(2SK)', '3'],
    ['step-3', '(2SL)', '3'], ['step-3', '(2MN)', '3'], ['step-7', '(a√2)', '3']
  ],
  'ex-main-0316': [
    ['step-3', 'CD', '3'], ['step-7', 'a', '3']
  ],
  'ex-main-0317': [
    ['step-3', '(a · √2)', '2'], ['step-5', '(a²)', '2'], ['step-5', '(a · √2)', '2']
  ],
  'ex-main-0318': [
    ['step-1', 'a', '2'], ['step-3', 'a', '2']
  ]
};
let steps = 0, views = 0;
for (const card of cards) {
  const id = card.id, number = card.source.exercise;
  assert(validate(card), id + ': ' + JSON.stringify(validate.errors));
  assert.deepEqual(API.validateLesson(card, production.catalog.book), [], id);
  assert.deepEqual(allById.get(id), card, id + ': exact integrated record');
  const review = report.cards.find(row => row.id === id);
  assert.equal(sha(content(card)), review.sha256, id + ': exact independently reviewed content');
  assert.equal(review.steps, card.steps.length, id + ': reviewed step count');
  assert.equal(review.modelStates, Object.keys(card.visualization.model.views).length, id + ': reviewed model count');
  assert.equal(card.status, 'reviewed');
  for (const field of ['source', 'mathematics', 'pedagogy']) assert.equal(card.review[field], 'passed');
  assert.equal(card.source.collection, 'main');
  assert.equal(card.source.chapter, 'III. Многогранники');
  assert.deepEqual(card.source.printedPages, [88]);
  assert.deepEqual(card.source.pdfPages, [90]);
  assert(baseline.parts[number].includes(card.source.subpart ?? null), id + ': original source subpart');
  const source = sourceIndex.entries.find(entry => entry.id === 'source-main-' + number.padStart(4, '0'));
  assert(source);
  assert.deepEqual(source.sourceSubparts, baseline.parts[number].filter(part => part !== null));
  assert.deepEqual(source.requiredParts, baseline.parts[number]);
  const rows = production.catalog.entries.filter(entry => baseline.target(entry) && entry.source.exercise === number);
  assert.equal(rows.length, baseline.parts[number].length);
  assert(rows.some(entry => entry.id === id && entry.status === 'reviewed'));
  exact(rows.map(entry => entry.source.subpart ?? null), baseline.parts[number], number + ': source parts complete');
  assert(card.answer.prompt.length > 25, id + ': specific answer instruction');
  assert.equal(card.answer.mode, Object.hasOwn(exactAnswers, id) ? 'exact' : 'manual', id + ': proof and multi-output honesty');
  if (card.answer.mode === 'exact') assert.deepEqual(card.answer.accepted, [exactAnswers[id]], id + ': source-specific answer');
  else assert.equal(card.answer.accepted, undefined, id + ': no automatic proof certification');

  const model = card.visualization.model, used = new Set(['neutral']), help = allHelp(card.help), references = [];
  for (const hint of help) {
    used.add(hint.view || 'neutral');
    references.push(...hint.theoryIds || []);
  }
  for (const step of card.steps) {
    used.add(step.view || 'neutral');
    references.push(...step.justifications.map(item => item.theoryId).filter(Boolean));
  }
  assert(references.length > 0, id + ': contextual theory');
  for (const ref of references) assert.equal(allById.get(ref)?.kind, 'theory', id + ': available theory ' + ref);
  exact([...used], Object.keys(model.views), id + ': every authored view reachable');
  const captured = new Set();
  for (const [key, filename] of screenshots) {
    const [owner, stage] = key.split('|');
    if (owner !== id) continue;
    assert(filename.startsWith('chapter3-final-'), id + ': separate focused artifact prefix');
    if (stage === 'condition') captured.add('neutral');
    else if (stage.startsWith('step-')) {
      const step = card.steps.find(item => item.id === stage);
      assert(step, id + ': known captured step');
      captured.add(step.view || 'neutral');
    } else if (stage.startsWith('help:')) {
      const hint = help.find(item => item.id === stage.slice(5));
      assert(hint, id + ': known captured help');
      captured.add(hint.view || 'neutral');
    } else assert.fail(id + ': unknown capture stage ' + stage);
  }
  assert(screenshots.has(id + '|condition'));
  assert(screenshots.has(id + '|' + card.steps.at(-1).id), id + ': complete final proof capture');
  exact([...captured], Object.keys(model.views), id + ': every model state captured at both widths');
  const mount = win.TaskSceneViewer.mount(win.document.getElementById('model'), model);
  for (const view of used) {
    assert(mount.setView(view));
    assert(!/NaN|Infinity/.test(win.document.querySelector('#model svg').outerHTML), id + ': finite model ' + view);
    for (const node of win.document.querySelectorAll('#model .am-focus, #model .am-note, #model .am-label')) {
      assert(!node.textContent.includes('/'), id + ': plain-text model caption, note or label must avoid slash fractions in ' + view);
      assert(!/[А-Яа-яЁё]\d/u.test(node.textContent), id + ': readable model number spacing in ' + view);
    }
  }
  mount.destroy();
  steps += card.steps.length;
  views += used.size;
}
assert.equal(steps, CHECKPOINT.steps);
assert.equal(views, CHECKPOINT.views);
const additiveCases = [...screenshots].filter(([key]) => ids.has(key.split('|')[0]));
assert.equal(additiveCases.length, CHECKPOINT.cases);
assert.equal(sha(additiveCases), CHECKPOINT.captureSHA256, 'exact additive capture inventory');
assert.equal(screenshots.size, 1188 + CHECKPOINT.cases);
const full = API.inspectBundle(production.catalog, production.lessons);
assert.deepEqual(full.issues, []);
assert.equal(full.available.size, 518);
assert.equal(production.catalog.entries.length, 1375);
assert.equal(full.coverage.availableExercises, 319);
assert.equal(full.coverage.availableTheoryPoints, 37);
assert.equal(full.coverage.availableSelfchecks, 40);
assert.equal(full.coverage.partiallyAvailable, 0);
for (const id of expected) {
  const copy = structuredClone(production);
  copy.catalog.entries.find(entry => entry.id === id).status = 'draft';
  copy.lessons = copy.lessons.filter(card => card.id !== id);
  const result = API.inspectBundle(copy.catalog, copy.lessons);
  assert.deepEqual(result.issues, []);
  assert.equal(result.available.size, 517);
  assert.equal(result.coverage.availableExercises, 318);
  assert.equal(result.coverage.partiallyAvailable, cards.find(card => card.id === id).source.exercise === '311' ? 1 : 0);
}
const pending = structuredClone(cards);
for (const card of pending) {
  card.status = 'in-review';
  card.review = {source: 'pending', mathematics: 'pending', pedagogy: 'pending'};
}
const pendingCatalog = {...production.catalog, entries: pending.map(card =>
  Object.fromEntries(['id', 'revision', 'kind', 'title', 'status', 'source'].map(key => [key, card[key]])))};
assert.equal(API.inspectBundle(pendingCatalog, pending).available.size, 0, 'unreviewed tasks cannot publish');

// Inspect the mounted rich text, rather than applying a different renderer to
// arbitrary model strings. Structured fraction operands are checked below.
const appRoot = win.document.getElementById('app');
const app = API.createApp(appRoot, production);
function checkRichText(id) {
  const surfaces = appRoot.querySelectorAll('.textbook-main, .textbook-help');
  assert.equal(surfaces.length, 2, id + ': actual mounted lesson surfaces');
  for (const surface of surfaces) {
    const copy = surface.cloneNode(true);
    for (const fraction of copy.querySelectorAll('.stereo-fraction')) fraction.remove();
    for (const model of copy.querySelectorAll('.textbook-model')) model.remove();
    const walker = win.document.createTreeWalker(copy, win.NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const text = walker.currentNode;
      if (text.parentElement.closest('button, input, textarea, select, option, script')) continue;
      assert(!/\d\s*\/\s*\d|[A-Za-zα-ωΑ-Ω²³)]\s*\/\s*[A-Za-zα-ωΑ-Ω(√\d]/u.test(text.textContent), id + ': raw arithmetic slash in mounted rich text: ' + text.textContent);
      assert(!/[А-Яа-яЁё]\d/u.test(text.textContent), id + ': readable mounted number spacing');
    }
  }
}
for (const card of cards) {
  assert(app.open(card.id));
  checkRichText(card.id + ' condition');
  const next = [...appRoot.querySelectorAll('button')].find(button => button.textContent === 'Разобрать по шагам');
  assert(next);
  for (let i = 0; i < card.steps.length; i++) next.click();
  assert.equal(appRoot.querySelectorAll('[data-step]').length, card.steps.length);
  checkRichText(card.id + ' complete proof');
  for (const [step, numerator, denominator] of fractionCases[card.id] || []) {
    const explanation = appRoot.querySelector('[data-step="' + step + '"] > details > p');
    assert(explanation, card.id + ': mounted explanation ' + step);
    const fractions = [...explanation.querySelectorAll('.stereo-fraction')];
    assert(fractions.some(fraction =>
      fraction.querySelector(':scope > .stereo-numerator').textContent === numerator &&
      fraction.querySelector(':scope > .stereo-denominator').textContent === denominator),
    card.id + ': whole mounted fraction operands ' + numerator + ' over ' + denominator + ' in ' + step);
  }
  const form = appRoot.querySelector('[data-final-form]');
  const field = form.querySelector('textarea, input');
  const stateKey = 'mathExamTextbook.v1:' + production.catalog.book.id + ':' + card.id + ':r' + card.revision;
  if (card.answer.mode === 'exact') {
    field.value = '999999';
    field.dispatchEvent(new win.Event('input', {bubbles: true}));
    form.dispatchEvent(new win.Event('submit', {bubbles: true, cancelable: true}));
    assert.equal(JSON.parse(win.localStorage.getItem(stateKey)).checked, false, card.id + ': wrong numeric result rejected');
    const feedback = appRoot.querySelector('[data-final-feedback]');
    assert(feedback, card.id + ': mounted wrong-answer feedback');
    assert(!/(?:^|[^\p{L}])(?:верно|правильно|отлично)(?=$|[^\p{L}])/iu.test(feedback.textContent),
      card.id + ': wrong numeric answer must not receive a positive verdict: ' + feedback.textContent);
    checkRichText(card.id + ' wrong-answer feedback');
  }
  field.value = exactAnswers[card.id] || 'Пробная запись рассуждения.';
  field.dispatchEvent(new win.Event('input', {bubbles: true}));
  form.dispatchEvent(new win.Event('submit', {bubbles: true, cancelable: true}));
  const saved = JSON.parse(win.localStorage.getItem(stateKey));
  assert.equal(saved.checked, card.answer.mode === 'exact', card.id + ': written proofs remain manual');
  assert.equal(saved.revealed, card.steps.length);
  assert.equal(saved.draft, field.value, card.id + ': answer draft retained');
  checkRichText(card.id + ' saved-answer feedback');
}
const malformedFraction = win.document.createElement('p');
malformedFraction.textContent = 'Контрольная дробь 12/5';
appRoot.querySelector('.textbook-main').append(malformedFraction);
assert.throws(() => checkRichText('negative control'), /raw arithmetic slash/);
malformedFraction.remove();
app.destroy();
dom.window.close();
console.log('ATANASYAN_CHAPTER_III_FINAL_310_319_CONTENT_OK', cards.length,
  'cards', steps, 'steps', views, 'states; all prior 507 exact; source 1–319 complete');
module.exports = {cards: cards.length, steps, views};
