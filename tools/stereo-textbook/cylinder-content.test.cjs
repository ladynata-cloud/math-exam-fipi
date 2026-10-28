'use strict';
// Source identities, additive publication, actual DOM and retained work.
// Independent cylinder mathematics and actual browser pixels are separate gates.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const dir = path.join(root, 'stereo-course/textbook/lessons');
const baseline = require('./cylinder-baseline.cjs');
const {ids, published, sha} = baseline;
const sourceIndex = require(root + '/stereo-course/textbook/source-index.json');
const production = require(root + '/stereo-course/textbook/data/course.json');
const registry = require('./content-review.json');
const screenshots = require('./browser-cases.cjs');
const API = require(root + '/stereo-course/textbook/assets/engine.js');
const reportPath = 'docs/reviews/ATANASYAN_CYLINDER_CONTENT.json';
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
  const premature = /контрпример|бесконеч|ровно две невозможны|именно по AB|почему ответ 2|одна или три|утверждение\s+(?:ложно|неверно)(?=$|[\s.,;!])|(?:ответ|вердикт)\s*[:=—–]\s*(?:нет|да)(?=$|[\s.,;!])/iu;
  for (const [name, text] of Object.entries(surfaces))
    assert(!premature.test(text), card.id + ': initial ' + name + ' discloses a premature verdict: ' + text);
}
for (const card of cards) noInitialVerdict(card);
// Explicit candidate checkpoint. Publication still requires the independent
// exact-content review above; every later change must be reviewed and rebound.
const CHECKPOINT = {
  steps: 165, views: 178, cases: 206,
  captureSHA256: '2948eca4045f5910c92a7207b61b3c4b03cf6d1c823fa9ac86ead930e2954f20'
};

const previous = baseline.previousCourse(production, sourceIndex);
const oldRegistry = baseline.previousRegistry(registry);
baseline.previousCases(screenshots);
const rawPrevious = fs.readdirSync(dir).filter(name => name.endsWith('.json') && !ids.has(name.slice(0, -5)))
  .sort().map(name => [name, hash(fs.readFileSync(path.join(dir, name)))]);
assert.equal(rawPrevious.length, 518);
assert.equal(sha(rawPrevious), published.rawLessonManifestSHA256, 'all 518 prior authored files byte-identical');
assert.equal(sha(oldRegistry.cards), published.reviewRowsSHA256, 'all 518 prior review rows');
assert.equal(sha(oldRegistry.batches), published.reviewBatchesSHA256, 'all 27 prior review batches');
for (const [file, expectedHash] of Object.entries(published.immutableFiles))
  assert.equal(hash(fs.readFileSync(path.join(root, file))), expectedHash, 'unchanged released runtime/schema/builder: ' + file);
assert.equal(registry.cards.length, 554);
assert.equal(registry.batches.length, 28);
exact(registry.cards.map(row => row.id), production.lessons.map(card => card.id), 'one review per published card');
exact(registry.batches.at(-1).cardIds, expected, 'one exact independent cylinder batch');
exact(production.lessons.filter(card => !previous.lessons.some(old => old.id === card.id)).map(card => card.id), expected, 'only the 36 cylinder cards');

// Negative controls exercise the projection boundary: no historical corruption
// or new unapproved identity may be silently discarded as cylinder content.
let rejected = 0;
const reject = (make, check, pattern) => { assert.throws(() => check(make()), pattern); rejected++; };
reject(() => { const x = structuredClone(cards.find(card => card.id === 'ex-main-0323')); x.visualization.model.note += ' Числа выбираем только для контрпримера.'; return x; }, noInitialVerdict, /initial modelNote discloses a premature verdict/);
reject(() => { const x = structuredClone(production); x.lessons.find(card => !ids.has(card.id)).title += ' altered'; return x; }, x => baseline.previousCourse(x, sourceIndex), /complete prior 518/);
reject(() => { const x = structuredClone(production); x.lessons.find(card => !ids.has(card.id)).review.reviewer += ' altered'; return x; }, x => baseline.previousCourse(x, sourceIndex), /complete prior 518/);
reject(() => { const x = structuredClone(production); x.catalog.entries[0].source.printedPages = [999]; return x; }, x => baseline.previousCourse(x, sourceIndex), /complete prior 518/);
reject(() => { const x = structuredClone(production); x.lessons.push({...structuredClone(x.lessons[0]), id: 'unapproved-extra-card'}); return x; }, x => baseline.previousCourse(x, sourceIndex), /complete prior 518/);
reject(() => { const x = structuredClone(sourceIndex); x.entries[0].title += ' altered'; return x; }, baseline.previousIndex, /exact source index/);
reject(() => { const x = structuredClone(sourceIndex); x.entries.find(baseline.target).source.printedPages = [999]; return x; }, baseline.previousIndex, /original cylinder source metadata/);
reject(() => { const x = structuredClone(sourceIndex); x.entries.find(baseline.target).requiredParts = ['invented']; return x; }, baseline.previousIndex, /completeness contract/);
reject(() => { const x = structuredClone(registry); x.cards.find(row => !ids.has(row.id)).sha256 = '0'.repeat(64); return x; }, baseline.previousRegistry, /complete prior review/);
reject(() => { const x = structuredClone(registry); x.batches.at(-1).cardIds[0] = 'unapproved-extra-card'; return x; }, baseline.previousRegistry, /exact cylinder review batch/);
reject(() => { const x = new Map(screenshots); x.set([...x.keys()].find(key => !ids.has(key.split('|')[0])), 'altered-historical-image'); return x; }, baseline.previousCases, /all 1272 prior browser cases/);
reject(() => { const x = new Map(screenshots); x.set('unapproved-extra-card|condition', 'extra'); return x; }, baseline.previousCases, /all 1272 prior browser cases/);

assert.equal(report.authorBase, published.commit);
assert.equal(report.sourceSHA256, sourceIndex.sourceSHA256);
assert.equal(report.verdict, 'PASS_INDEPENDENT_SOURCE_MATHEMATICS_AND_WRITTEN_PEDAGOGY');
assert.equal(report.authorReviewerSeparation.reviewerAuthoredLessons, false);
assert(Number.isFinite(Date.parse(report.reviewedAt)), 'independent review timestamp');
assert.deepEqual(report.openFindings, [], 'no unresolved source or mathematical findings');
exact(report.cards.map(card => card.id), expected, 'independent review covers all and only cylinder cards');
assert.equal(report.aggregateSHA256, sha(cards.map(content)), 'independent aggregate binds exact cylinder content');
assert.equal(report.oracle.path, 'tools/stereo-textbook/cylinder-math.test.py');
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
  assert(source && baseline.target(source), id + ': approved original cylinder position');
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
  if (!isTheory) assert(references.some(ref => ['theory-038', 'theory-039'].includes(ref)), id + ': contextual cylinder theory');
  for (const ref of references) assert.equal(allById.get(ref)?.kind, 'theory', id + ': available theory ' + ref);
  exact([...used], Object.keys(model.views), id + ': every authored state reachable');
  const captured = new Set();
  for (const [key, filename] of screenshots) {
    const [owner, stage] = key.split('|'); if (owner !== id) continue;
    assert(filename.startsWith('cylinder-'), id + ': focused cylinder artifact');
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
    for (const node of win.document.querySelectorAll('#model .am-focus, #model .am-note, #model .am-label'))
      assert(!node.textContent.includes('/'), id + ': model labels use readable words instead of slash fractions');
  }
  mount.destroy(); steps += card.steps.length; views += used.size;
}
assert.equal(steps, CHECKPOINT.steps, 'exact cylinder justified-step count');
assert.equal(views, CHECKPOINT.views, 'exact cylinder authored-state count');
const addedCases = [...screenshots].filter(([key]) => ids.has(key.split('|')[0]));
assert.equal(addedCases.length, CHECKPOINT.cases);
assert.equal(sha(addedCases), CHECKPOINT.captureSHA256, 'exact reviewed additive capture inventory');
assert.equal(screenshots.size, 1272 + CHECKPOINT.cases);
const full = API.inspectBundle(production.catalog, production.lessons);
assert.deepEqual(full.issues, []);
assert.equal(full.available.size, 554);
assert.equal(production.catalog.entries.length, 1383);
assert.equal(full.coverage.availableExercises, 345);
assert.equal(full.coverage.availableTheoryPoints, 39);
assert.equal(full.coverage.availableSelfchecks, 40);
assert.equal(full.coverage.partiallyAvailable, 0);
assert.equal(full.coverage.draft, 829, 'later book content remains an honest pending inventory');
for (const card of cards) {
  const copy = structuredClone(production);
  copy.catalog.entries.find(entry => entry.id === card.id).status = 'draft';
  copy.lessons = copy.lessons.filter(lesson => lesson.id !== card.id);
  const result = API.inspectBundle(copy.catalog, copy.lessons);
  assert.deepEqual(result.issues, []);
  assert.equal(result.available.size, 553);
  assert.equal(result.coverage.availableExercises, card.kind === 'exercise' ? 344 : 345);
  assert.equal(result.coverage.availableTheoryPoints, card.kind === 'theory' ? 38 : 39);
  assert.equal(result.coverage.partiallyAvailable, card.kind === 'exercise' && baseline.parts[card.source.exercise].length > 1 ? 1 : 0);
}
const pending = structuredClone(cards);
for (const card of pending) { card.status = 'in-review'; card.review = {source: 'pending', mathematics: 'pending', pedagogy: 'pending'}; }
const pendingCatalog = {...production.catalog, entries: pending.map(card => Object.fromEntries(['id', 'revision', 'kind', 'title', 'status', 'source'].map(key => [key, card[key]])))};
assert.equal(API.inspectBundle(pendingCatalog, pending).available.size, 0, 'unreviewed cylinder cards cannot publish');

const appRoot = win.document.getElementById('app'), app = API.createApp(appRoot, production);
function checkRichText(id) {
  for (const surface of appRoot.querySelectorAll('.textbook-main, .textbook-help')) {
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
  assert(app.open(card.id)); checkRichText(card.id + ' condition');
  const source = appRoot.querySelector('main>header>[data-companion-source]');
  assert.match(source.textContent, /К главе IV.*К параграфу 1 «Цилиндр»/s);
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
  field.value = card.answer.mode === 'exact' ? card.answer.accepted[0] : 'Моё рассуждение: цилиндр и его сечение.';
  field.dispatchEvent(new win.Event('input', {bubbles: true}));
  form.dispatchEvent(new win.Event('submit', {bubbles: true, cancelable: true}));
  const saved = JSON.parse(win.localStorage.getItem(stateKey));
  assert.equal(saved.checked, card.answer.mode === 'exact', card.id + ': manual proof stays uncertified');
  assert.equal(saved.revealed, card.steps.length);
  assert.equal(saved.draft, field.value, card.id + ': written work retained');
  checkRichText(card.id + ' answer feedback');
}
// These are the actual nested-denominator forms rejected during image review.
// Run them through the unchanged renderer: an inner fraction bar must not hide
// an unrendered outer division from the mounted-DOM guard.
for (const text of ['5/√(5/π)', '25/(5/π)', '(d² · cos²(φ/2))/(2π)']) {
  const malformed = win.document.createElement('p');
  win.StereoMath.appendText(malformed, text);
  appRoot.querySelector('.textbook-main').append(malformed);
  assert.throws(() => checkRichText('nested fraction negative control'), /raw fraction in mounted rich text/);
  malformed.remove(); rejected++;
}
app.destroy(); dom.window.close();
console.log('ATANASYAN_CYLINDER_CONTENT_OK', cards.length, 'cards', steps, 'steps', views,
  'states;', rejected, 'negative controls; prior 518 exact; full paragraph1, exercises1–345, theory1–39');
module.exports = {cards: cards.length, steps, views};
