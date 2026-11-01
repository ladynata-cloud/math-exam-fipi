'use strict';
// Source identities, additive publication, actual DOM and retained work.
// Independent cone mathematics and actual browser pixels are separate gates.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const dir = path.join(root, 'stereo-course/textbook/lessons');
const baseline = require('./cone-baseline.cjs');
const {ids, published, sha} = baseline;
const later = require('./sphere-baseline.cjs');
const currentIndex = require(root + '/stereo-course/textbook/source-index.json');
const sourceIndex = later.previousIndex(currentIndex);
const production = later.previousCourse(require(root + '/stereo-course/textbook/data/course.json'), currentIndex);
const registry = later.previousRegistry(require('./content-review.json'));
const screenshots = later.previousCases(require('./browser-cases.cjs'));
const API = require(root + '/stereo-course/textbook/assets/engine.js');
const reportPath = 'docs/reviews/ATANASYAN_CONE_CONTENT.json';
const report = JSON.parse(fs.readFileSync(path.join(root, reportPath), 'utf8'));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const content = card => { const copy = structuredClone(card); delete copy.status; delete copy.review; return copy; };
const exact = (actual, expected, label) => {
  assert.equal(new Set(actual).size, actual.length, label + ': unique');
  assert.deepEqual([...actual].sort(), [...expected].sort(), label);
};
const helpItems = items => items.flatMap(item => [item, ...helpItems(item.children || [])]);
const expected = [...ids];
const cards = expected.map(id => JSON.parse(fs.readFileSync(path.join(dir, id + '.json'), 'utf8')));
const {visibleLabelKeys} = require('./browser-shards.cjs');
function noInitialVerdict(card) {
  if (card.kind !== 'exercise') return;
  const model = card.visualization.model;
  const surfaces = {
    title: card.title, condition: card.statement.text, goal: card.statement.goal,
    answerPrompt: card.answer.prompt, caption: card.visualization.caption,
    modelNote: model.note || '', neutralLabel: model.views.neutral.label,
    ...Object.fromEntries((card.statement.givens || []).map((text, i) => ['given-' + i, text])),
    ...Object.fromEntries(visibleLabelKeys(card, 'neutral').map(name => ['pointLabel-' + name, model.labels?.[name] || name]))
  };
  // Reuse the established task-first verdict guard on every initial surface,
  // including model notes and visible point labels. Conditional answer prompts
  // such as "если считаешь ... неверным" do not assert a verdict. Help and
  // revealed explanations are deliberately outside this initial-screen check.
  const premature = /(?:ответ|вердикт)\s*[:=—–]|контрпример|бесконеч|ровно две невозможны|именно по AB|почему ответ 2|одна или три|утверждение\s+(?:ложно|неверно)(?=$|[\s.,;!])|(?:ответ|вердикт)\s*[:=—–]\s*(?:нет|да)(?=$|[\s.,;!])/iu;
  for (const [name, text] of Object.entries(surfaces))
    assert(!premature.test(text), card.id + ': initial ' + name + ' discloses a premature verdict: ' + text);
}
for (const card of cards) noInitialVerdict(card);
assert.equal(sourceIndex.entries.length, 1253, 'complete source inventory is retained');
// Explicit candidate checkpoint. Publication still requires the independent
// exact-content review above; every later change must be reviewed and rebound.
const CHECKPOINT = {
  steps: 166, views: 171, cases: 207,
  captureSHA256: 'b940525a643803ead741693531ffbcd562881b57fa6f6cea356993d6f91fc496'
};

const previous = baseline.previousCourse(production, sourceIndex);
const oldRegistry = baseline.previousRegistry(registry);
baseline.previousCases(screenshots);
const rawPrevious = later.previousLessonFiles(dir).filter(name => name.endsWith('.json') && !ids.has(name.slice(0, -5)))
  .sort().map(name => [name, hash(fs.readFileSync(path.join(dir, name)))]);
assert.equal(rawPrevious.length, 554);
assert.equal(sha(rawPrevious), published.rawLessonManifestSHA256, 'all 554 prior authored files byte-identical');
assert.equal(sha(oldRegistry.cards), published.reviewRowsSHA256, 'all 554 prior review rows');
assert.equal(sha(oldRegistry.batches), published.reviewBatchesSHA256, 'all 28 prior review batches');
// Preserve the original cone baseline, while accepting only the exact two
// visibility assets already reviewed and published in PR376. All other
// runtime/schema/builder bytes remain frozen by this content-only release.
const visibilityMigration = require('./visibility-migration.cjs');
const sphereSchemaMigration = require('./sphere-schema-migration.cjs');
for (const [file, expectedHash] of Object.entries(published.immutableFiles)) {
  if (Object.hasOwn(visibilityMigration.originals, file))
    visibilityMigration.assertVisibilityMigration(file, expectedHash);
  else if (Object.hasOwn(sphereSchemaMigration.originals, file))
    sphereSchemaMigration.assertSphereSchemaMigration(file, expectedHash);
  else
    assert.equal(hash(fs.readFileSync(path.join(root, file))), expectedHash, 'unchanged released runtime/schema/builder: ' + file);
}
assert.equal(registry.cards.length, 594);
assert.equal(registry.batches.length, 29);
exact(registry.cards.map(row => row.id), production.lessons.map(card => card.id), 'one review per published card');
exact(registry.batches.at(-1).cardIds, expected, 'one exact independent cone batch');
exact(production.lessons.filter(card => !previous.lessons.some(old => old.id === card.id)).map(card => card.id), expected, 'only the 40 cone cards');

// Negative controls exercise the projection boundary: no historical corruption
// or new unapproved identity may be silently discarded as cone content.
let rejected = 0;
const reject = (make, check, pattern) => { assert.throws(() => check(make()), pattern); rejected++; };
reject(() => { const x = structuredClone(cards.find(card => card.id === 'ex-main-0346')); x.visualization.model.note += ' Числа выбираем только для контрпримера.'; return x; }, noInitialVerdict, /initial modelNote discloses a premature verdict/);
reject(() => { const x = structuredClone(cards.find(card => card.id === 'ex-main-0346')); x.visualization.caption += ' Ответ: 5 см.'; return x; }, noInitialVerdict, /initial caption discloses a premature verdict/);
reject(() => { const x = structuredClone(production); x.lessons.find(card => !ids.has(card.id)).title += ' altered'; return x; }, x => baseline.previousCourse(x, sourceIndex), /complete prior 554/);
reject(() => { const x = structuredClone(production); x.lessons.find(card => !ids.has(card.id)).review.reviewer += ' altered'; return x; }, x => baseline.previousCourse(x, sourceIndex), /complete prior 554/);
reject(() => { const x = structuredClone(production); x.catalog.entries[0].source.printedPages = [999]; return x; }, x => baseline.previousCourse(x, sourceIndex), /complete prior 554/);
reject(() => { const x = structuredClone(production); x.lessons.push({...structuredClone(x.lessons[0]), id: 'unapproved-extra-card'}); return x; }, x => baseline.previousCourse(x, sourceIndex), /complete prior 554/);
reject(() => { const x = structuredClone(sourceIndex); x.entries[0].title += ' altered'; return x; }, baseline.previousIndex, /exact source index/);
reject(() => { const x = structuredClone(sourceIndex); x.entries.find(baseline.target).source.printedPages = [999]; return x; }, baseline.previousIndex, /original cone source metadata/);
reject(() => { const x = structuredClone(sourceIndex); x.entries.find(baseline.target).requiredParts = ['invented']; return x; }, baseline.previousIndex, /completeness contract/);
reject(() => { const x = structuredClone(registry); x.cards.find(row => !ids.has(row.id)).sha256 = '0'.repeat(64); return x; }, baseline.previousRegistry, /complete prior review/);
reject(() => { const x = structuredClone(registry); x.batches.at(-1).cardIds[0] = 'unapproved-extra-card'; return x; }, baseline.previousRegistry, /exact cone review batch/);
reject(() => { const x = new Map(screenshots); x.set([...x.keys()].find(key => !ids.has(key.split('|')[0])), 'altered-historical-image'); return x; }, baseline.previousCases, /all 1478 prior browser cases/);
reject(() => { const x = new Map(screenshots); x.set('unapproved-extra-card|condition', 'extra'); return x; }, baseline.previousCases, /all 1478 prior browser cases/);

assert.equal(report.authorBase, published.commit);
assert.equal(report.sourceSHA256, sourceIndex.sourceSHA256);
assert.equal(report.verdict, 'PASS_INDEPENDENT_SOURCE_MATHEMATICS_AND_WRITTEN_PEDAGOGY');
assert.equal(report.authorReviewerSeparation.reviewerAuthoredLessons, false);
assert(Number.isFinite(Date.parse(report.reviewedAt)), 'independent review timestamp');
assert.deepEqual(report.openFindings, [], 'no unresolved source or mathematical findings');
exact(report.cards.map(card => card.id), expected, 'independent review covers all and only cone cards');
assert.equal(report.aggregateSHA256, sha(cards.map(content)), 'independent aggregate binds exact cone content');
assert.equal(report.oracle.path, 'tools/stereo-textbook/cone-math.test.py');
assert.equal(hash(fs.readFileSync(path.join(root, report.oracle.path))), report.oracle.sha256, 'independently reviewed oracle bytes');
assert.equal(registry.batches.at(-1).sourceBundleSHA256, report.aggregateSHA256);
assert.equal(registry.batches.at(-1).reviewer, report.reviewer);
assert.equal(registry.batches.at(-1).reviewedAt, report.reviewedAt);
assert.equal(registry.batches.at(-1).mathematicalReport, reportPath);

const Ajv = require('ajv/dist/2020'), ajv = new Ajv({allErrors: true, strict: true});
require('ajv-formats')(ajv);
const validate = ajv.compile(require(root + '/stereo-course/textbook/schema/lesson.schema.json'));
const {JSDOM} = require('jsdom');
const dom = new JSDOM('<div id="app"></div><div id="model"></div>', {
  url: 'https://example.test/stereo-course/textbook/', pretendToBeVisual: true, runScripts: 'outside-only'
});
const win = dom.window;
for (const file of ['math-text.js', 'task-scene-viewer.js']) win.eval(fs.readFileSync(root + '/stereo-course/assets/' + file, 'utf8'));
win.HTMLElement.prototype.scrollIntoView = () => {};
const allById = new Map(production.lessons.map(card => [card.id, card]));
function checkModelText(id) {
  for (const node of win.document.querySelectorAll('#model .am-focus, #model .am-note, #model .am-label'))
    assert(!node.textContent.includes('/'), id + ': model labels use readable words instead of slash fractions');
}
let steps = 0, views = 0;
for (const card of cards) {
  const id = card.id, isTheory = card.kind === 'theory';
  assert(validate(card), id + ': ' + JSON.stringify(validate.errors));
  assert.deepEqual(API.validateLesson(card, production.catalog.book), [], id);
  assert.deepEqual(allById.get(id), card, id + ': exact integrated record');
  const reviewed = report.cards.find(row => row.id === id);
  assert.equal(sha(content(card)), reviewed.sha256, id + ': exact independently reviewed content');
  assert.equal(reviewed.steps, card.steps.length, id + ': independently reviewed step count');
  assert.equal(reviewed.modelStates, Object.keys(card.visualization.model.views).length, id + ': independently reviewed model count');
  assert.equal(card.status, 'reviewed');
  for (const key of ['source', 'mathematics', 'pedagogy']) assert.equal(card.review[key], 'passed');
  assert.equal(card.source.chapter, 'IV. Цилиндр, конус и шар');
  assert.equal(card.source.collection, isTheory ? 'theory' : 'main');
  const source = sourceIndex.entries.find(entry => entry.id === (isTheory ? 'source-theory-' + card.source.point.padStart(3, '0') : 'source-main-' + card.source.exercise.padStart(4, '0')));
  assert(source && baseline.target(source), id + ': approved original cone position');
  const parts = baseline.requiredParts(source);
  assert.deepEqual(source.requiredParts, parts, id + ': complete source contract');
  assert(parts.includes(card.source.subpart ?? null), id + ': actual source part');
  const partIndex = parts.indexOf(card.source.subpart ?? null);
  assert.equal(id, isTheory ? 'theory-' + card.source.point.padStart(3, '0')
    : 'ex-main-' + card.source.exercise.padStart(4, '0') + (parts[0] === null ? '' : '-' + 'abc'[partIndex]), id + ': exact identity');
  assert(card.source.printedPages.every(page => source.source.printedPages.includes(page)));
  assert.deepEqual(card.source.pdfPages, card.source.printedPages.map(page => page + 2));
  const rows = production.catalog.entries.filter(entry => entry.source.collection === card.source.collection
    && (isTheory ? entry.source.point === card.source.point : entry.source.exercise === card.source.exercise));
  exact(rows.map(entry => entry.source.subpart ?? null), parts, id + ': every actual part exactly once');
  assert(rows.every(entry => entry.status === 'reviewed'));
  if (!isTheory) {
    assert(card.answer.prompt.length > 25, id + ': task-specific answer instruction');
    if (card.answer.mode === 'manual') assert.equal(card.answer.accepted, undefined, id + ': written proofs are not certified automatically');
  }
  const model = card.visualization.model, used = new Set(['neutral']), help = helpItems(card.help), references = [];
  for (const hint of help) { used.add(hint.view || 'neutral'); references.push(...hint.theoryIds || []); }
  for (const step of card.steps) { used.add(step.view || 'neutral'); references.push(...step.justifications.map(item => item.theoryId).filter(Boolean)); }
  if (!isTheory) assert(references.some(ref => ['theory-040', 'theory-041', 'theory-042'].includes(ref)), id + ': contextual cone theory');
  for (const ref of references) assert.equal(allById.get(ref)?.kind, 'theory', id + ': available theory ' + ref);
  exact([...used], Object.keys(model.views), id + ': every authored state reachable');
  const captured = new Set();
  for (const [key, filename] of screenshots) {
    const [owner, stage] = key.split('|'); if (owner !== id) continue;
    assert(filename.startsWith('cone-'), id + ': focused cone artifact');
    if (stage === 'condition') captured.add('neutral');
    else if (stage.startsWith('step-')) { const step = card.steps.find(item => item.id === stage); assert(step, id + ': known captured step'); captured.add(step.view || 'neutral'); }
    else if (stage.startsWith('help:')) { const hint = help.find(item => item.id === stage.slice(5)); assert(hint, id + ': known captured help'); captured.add(hint.view || 'neutral'); }
    else assert.fail(id + ': unknown capture stage ' + stage);
  }
  assert(screenshots.has(id + '|condition'), id + ': initial task capture');
  assert(screenshots.has(id + '|' + card.steps.at(-1).id), id + ': complete final explanation capture');
  exact([...captured], Object.keys(model.views), id + ': every model state captured at both widths');
  const mount = win.TaskSceneViewer.mount(win.document.getElementById('model'), model);
  for (const view of used) {
    assert(mount.setView(view));
    assert(!/NaN|Infinity/.test(win.document.querySelector('#model svg').outerHTML), id + ': finite rendered model ' + view);
    checkModelText(id + ' ' + view);
  }
  mount.destroy(); steps += card.steps.length; views += used.size;
}
// A raw ratio in a cone view label is never fraction-formatted by the SVG viewer.
const malformedModel = structuredClone(cards[0].visualization.model);
malformedModel.views.neutral.label = 'r/R=x/(x+l)';
const malformedMount = win.TaskSceneViewer.mount(win.document.getElementById('model'), malformedModel);
assert.throws(() => checkModelText('cone model negative control'), /model labels use readable words instead of slash fractions/);
malformedMount.destroy(); rejected++;
assert.equal(steps, CHECKPOINT.steps, 'exact cone justified-step count');
assert.equal(views, CHECKPOINT.views, 'exact cone authored-state count');
const addedCases = [...screenshots].filter(([key]) => ids.has(key.split('|')[0]));
assert.equal(addedCases.length, CHECKPOINT.cases);
assert.equal(sha(addedCases), CHECKPOINT.captureSHA256, 'exact reviewed additive capture inventory');
assert.equal(screenshots.size, 1478 + CHECKPOINT.cases);
const full = API.inspectBundle(production.catalog, production.lessons);
assert.deepEqual(full.issues, []);
assert.equal(full.available.size, 594);
assert.equal(production.catalog.entries.length, 1394);
assert.equal(full.coverage.availableExercises, 371);
assert.equal(full.coverage.availableTheoryPoints, 42);
assert.equal(full.coverage.availableSelfchecks, 40);
assert.equal(full.coverage.partiallyAvailable, 0);
assert.equal(production.lessons.filter(card => card.kind === 'exercise').length, 501);
assert.equal(full.coverage.draft, 800, 'later book content remains an honest pending inventory');
for (const card of cards) {
  const copy = structuredClone(production);
  copy.catalog.entries.find(entry => entry.id === card.id).status = 'draft';
  copy.lessons = copy.lessons.filter(lesson => lesson.id !== card.id);
  const result = API.inspectBundle(copy.catalog, copy.lessons);
  assert.deepEqual(result.issues, []);
  assert.equal(result.available.size, 593);
  assert.equal(result.coverage.availableExercises, card.kind === 'exercise' ? 370 : 371);
  assert.equal(result.coverage.availableTheoryPoints, card.kind === 'theory' ? 41 : 42);
  assert.equal(result.coverage.partiallyAvailable, card.kind === 'exercise' && baseline.parts[card.source.exercise].length > 1 ? 1 : 0);
}
const pending = structuredClone(cards);
for (const card of pending) { card.status = 'in-review'; card.review = {source: 'pending', mathematics: 'pending', pedagogy: 'pending'}; }
const pendingCatalog = {...production.catalog, entries: pending.map(card => Object.fromEntries(['id', 'revision', 'kind', 'title', 'status', 'source'].map(key => [key, card[key]])))};
assert.equal(API.inspectBundle(pendingCatalog, pending).available.size, 0, 'unreviewed cone cards cannot publish');

const appRoot = win.document.getElementById('app'), app = API.createApp(appRoot, production);
function checkRichText(id) {
  for (const surface of appRoot.querySelectorAll('.textbook-main, .textbook-help')) {
    // A fraction bar can be present and still split the authored expression:
    // (2h)²/2 used to leave (2h) outside a fraction whose numerator was only ².
    for (const node of surface.querySelectorAll('.stereo-fraction > .stereo-numerator, .stereo-fraction > .stereo-denominator'))
      assert(!/^[⁰¹²³⁴⁵⁶⁷⁸⁹]+$/u.test(node.textContent.trim()), id + ': detached exponent in rendered fraction');
    const copy = surface.cloneNode(true);
    for (const node of copy.querySelectorAll('.stereo-fraction, .textbook-model, button, input, textarea, select, option, script')) node.remove();
    // Math atoms split a visible expression across text nodes. Inspect their
    // combined displayed text so a digit, slash and radical in different spans
    // cannot evade the outer-division check after inner fraction bars disappear.
    const text = copy.textContent;
    const raw = text.match(/[\dA-Za-zα-ωΑ-Ω²³)]\s*\/\s*[A-Za-zα-ωΑ-Ω(√\d]/u);
    assert(!raw, id + ': raw fraction in mounted rich text: ' + (raw ? text.slice(Math.max(0, raw.index - 60), raw.index + 100) : ''));
  }
}
for (const card of cards) {
  assert(app.open(card.id));
  assert.equal(appRoot.querySelectorAll('[data-step]').length, 0, card.id + ': solution is hidden before learner action');
  noInitialVerdict(card); checkRichText(card.id + ' condition');
  for (const hint of helpItems(card.help)) {
    const detail = [...appRoot.querySelectorAll('[data-help]')].find(node => node.dataset.help === hint.id);
    assert(detail, card.id + ': mounted help ' + hint.id);
    detail.open = true; detail.dispatchEvent(new win.Event('toggle'));
    checkRichText(card.id + ' help ' + hint.id);
    detail.open = false;
  }
  const source = appRoot.querySelector('main>header>[data-companion-source]');
  assert.match(source.textContent, /К главе IV.*К параграфу 2 «Конус»/s);
  const next = [...appRoot.querySelectorAll('button')].find(button => button.textContent === 'Разобрать по шагам');
  assert(next); for (const _ of card.steps) next.click();
  assert.equal(appRoot.querySelectorAll('[data-step]').length, card.steps.length);
  checkRichText(card.id + ' complete explanation');
  if (card.kind === 'theory') continue;
  const form = appRoot.querySelector('[data-final-form]'), field = form.querySelector('textarea, input');
  const stateKey = 'mathExamTextbook.v1:' + production.catalog.book.id + ':' + card.id + ':r' + card.revision;
  if (card.answer.mode === 'exact') {
    field.value = '999999999'; field.dispatchEvent(new win.Event('input', {bubbles: true}));
    form.dispatchEvent(new win.Event('submit', {bubbles: true, cancelable: true}));
    assert.equal(JSON.parse(win.localStorage.getItem(stateKey)).checked, false, card.id + ': wrong number rejected');
  }
  field.value = card.answer.mode === 'exact' ? card.answer.accepted[0] : 'Моё рассуждение: конус и его сечение.';
  field.dispatchEvent(new win.Event('input', {bubbles: true}));
  form.dispatchEvent(new win.Event('submit', {bubbles: true, cancelable: true}));
  const saved = JSON.parse(win.localStorage.getItem(stateKey));
  assert.equal(saved.checked, card.answer.mode === 'exact', card.id + ': manual proof stays uncertified');
  assert.equal(saved.revealed, card.steps.length);
  assert.equal(saved.draft, field.value, card.id + ': written work retained');
  checkRichText(card.id + ' answer feedback');
}
// These actual nested-denominator failures were caught in the cylinder image review.
// Keep them and the cone product/ratio failures as rendered regression controls.
// Run them through the unchanged renderer: an inner fraction bar must not hide
// an unrendered outer division from the mounted-DOM guard.
for (const text of ['5/√(5/π)', '25/(5/π)', '(d² · cos²(φ/2))/(2π)', 'rl/(R−r)', '(4√(3)/3) · (2√(6)/3)/2']) {
  const malformed = win.document.createElement('p');
  win.StereoMath.appendText(malformed, text);
  appRoot.querySelector('.textbook-main').append(malformed);
  assert.throws(() => checkRichText('nested fraction negative control'), /raw fraction in mounted rich text/);
  malformed.remove(); rejected++;
}
const intactPower = win.document.createElement('p');
win.StereoMath.appendText(intactPower, '4h²/2');
assert.equal(intactPower.querySelector('.stereo-numerator')?.textContent, '4h²');
assert.equal(intactPower.querySelector('.stereo-denominator')?.textContent, '2');
appRoot.querySelector('.textbook-main').append(intactPower);
checkRichText('intact exponent positive control'); intactPower.remove();
const detachedPower = win.document.createElement('p');
win.StereoMath.appendText(detachedPower, '(2h)²/2');
appRoot.querySelector('.textbook-main').append(detachedPower);
assert.throws(() => checkRichText('detached exponent negative control'), /detached exponent in rendered fraction/);
detachedPower.remove(); rejected++;
app.destroy(); dom.window.close();
console.log('ATANASYAN_CONE_CONTENT_OK', cards.length, 'cards', steps, 'steps', views,
  'states;', rejected, 'negative controls; prior 554 exact; full paragraph2, exercises1–371, theory1–42');
module.exports = {cards: cards.length, steps, views};
