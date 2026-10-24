'use strict';
// Structural regression gate for the five paper-model tasks. This file does
// not award independent review or replace the folding oracle / image review.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const lessonsDir = path.join(root, 'stereo-course/textbook/lessons');
const baseline = require('./practical-baseline.cjs');
const {sha, published} = baseline;
const manifest = require('./polyhedra-practical-manifest.json');
const production = require(root + '/stereo-course/textbook/data/course.json');
const sourceIndex = require(root + '/stereo-course/textbook/source-index.json');
const registry = require('./content-review.json');
const screenshots = require('./browser-cases.cjs');
const API = require(root + '/stereo-course/textbook/assets/engine.js');
const report = require(root + '/docs/reviews/ATANASYAN_POLYHEDRA_PRACTICAL_MATH.json');

const specs = [
  {number:271, figure:95, faces:4, sides:3, hinges:3, seams:3, steps:7, views:9, solid:'tetrahedron'},
  {number:272, figure:96, faces:6, sides:4, hinges:5, seams:7, steps:7, views:13, solid:'cube'},
  {number:273, figure:97, faces:8, sides:3, hinges:7, seams:5, steps:7, views:11, solid:'octahedron'},
  {number:274, figure:98, faces:12, sides:5, hinges:11, seams:19, steps:8, views:25, solid:'dodecahedron'},
  {number:275, figure:99, faces:20, sides:3, hinges:19, seams:11, steps:8, views:17, solid:'icosahedron'}
];
const expectedIds = specs.map(s => 'ex-main-' + String(s.number).padStart(4, '0'));
const ids = new Set(expectedIds);
const contracts = Object.fromEntries(specs.map(s => [String(s.number), [null]]));
const rawSha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const exact = (actual, expected, label) => {
  assert.equal(new Set(actual).size, actual.length, label + ': no duplicates');
  assert.deepEqual([...actual].sort(), [...expected].sort(), label);
};
const content = card => {
  const copy = structuredClone(card);
  delete copy.status;
  delete copy.review;
  return copy;
};
const edgeKey = edge => [...edge].sort().join('|');
const allHelp = items => items.flatMap(item => [item, ...allHelp(item.children || [])]);

assert.equal(manifest.status, 'reviewed', 'manifest follows completed independent review');
exact(manifest.cards, expectedIds, 'exact five-card scope');
assert.deepEqual(manifest.reviewedSourceContracts, contracts);
assert.deepEqual(manifest.expected, {
  cards:5, exerciseCards:5, totalCards:479, completeTheoryPoints:37,
  completeExercises:287, selfchecks:40, catalogEntries:1368
});
assert.equal(manifest.steps, 37);
assert.equal(manifest.views, 75);
assert.equal(manifest.totalSteps, 1730);
assert.equal(manifest.totalViews, 1784);
assert.deepEqual(manifest.sourceFigures, Object.fromEntries(specs.map(s => [String(s.number), s.figure])));

// Reconstruct the complete release fixture, not a subset with selected fields
// removed. Only the five new requiredParts contracts may differ in the index.
const previous = baseline.previousCourse(production, sourceIndex);
baseline.previousIndex(sourceIndex);
const previousRegistry = baseline.previousRegistry(registry);
const previousCases = baseline.previousCases(screenshots);
assert.equal(previous.lessons.length, 474);
assert.equal(previous.catalog.entries.length, 1368);
assert.equal(previousRegistry.cards.length, 474);
assert.equal(previousRegistry.batches.length, 22);
assert.equal(previousCases.size, 917);
const authoredFiles = fs.readdirSync(lessonsDir).filter(name => name.endsWith('.json')).sort();
const rawOld = authoredFiles.filter(name => !ids.has(name.slice(0, -5)))
  .map(name => [name, rawSha(fs.readFileSync(path.join(lessonsDir, name)))]);
assert.equal(rawOld.length, 474);
assert.equal(sha(rawOld), published.rawLessonManifestSHA256, 'all 474 prior authored files stay byte-identical');
for (const [file, hash] of Object.entries(published.immutableFiles)) {
  assert.equal(rawSha(fs.readFileSync(path.join(root, file))), hash, 'unchanged runtime/schema/builder: ' + file);
}

const cards = expectedIds.map(id => JSON.parse(fs.readFileSync(path.join(lessonsDir, id + '.json'), 'utf8')));
const allById = new Map(production.lessons.map(card => [card.id, card]));
exact(authoredFiles.map(name => name.slice(0, -5)), production.lessons.map(card => card.id), 'authored and integrated cards');
exact(production.lessons.filter(card => !previous.lessons.some(old => old.id === card.id)).map(card => card.id), expectedIds, 'only five cards added');
assert.equal(registry.cards.length, 479);
assert.equal(registry.batches.length, 23);
exact(registry.cards.map(row => row.id), production.lessons.map(card => card.id), 'one registered review per card');
exact(registry.batches.at(-1).cardIds, expectedIds, 'one new review batch with this exact scope');

// Bind the independently issued review to the exact content being published.
// A copied status marker alone is insufficient evidence for these assertions.
assert.equal(report.verdict, 'PASS_INDEPENDENT_SOURCE_MATHEMATICS_AND_WRITTEN_PEDAGOGY');
assert.equal(report.authorBase, published.commit);
assert.equal(report.authorReviewerSeparation.reviewerAuthoredLessons, false);
assert.deepEqual(report.openFindings, []);
assert.deepEqual(report.scope, {sourcePositions:5, cards:5, steps:37, modelStates:75, seamPairs:45});
assert.equal(report.aggregateSHA256, sha(cards.map(content)), 'independent review aggregate');
assert.equal(registry.batches.at(-1).sourceBundleSHA256, report.aggregateSHA256, 'registered independent aggregate');
assert.equal(registry.batches.at(-1).reviewer, report.reviewer, 'registered independent reviewer');
assert.equal(registry.batches.at(-1).reviewedAt, report.reviewedAt, 'registered independent review timestamp');
assert.equal(registry.batches.at(-1).mathematicalReport, 'docs/reviews/ATANASYAN_POLYHEDRA_PRACTICAL_MATH.json');
exact(report.cards.map(row => row.id), expectedIds, 'independent review card scope');
assert.equal(report.oracle.path, 'tools/stereo-textbook/polyhedra-practical-math.test.py');
assert.equal(rawSha(fs.readFileSync(path.join(root, report.oracle.path))), report.oracle.sha256, 'independently reviewed oracle');

const Ajv = require('ajv/dist/2020');
const ajv = new Ajv({allErrors:true, strict:true});
require('ajv-formats')(ajv);
const validate = ajv.compile(require(root + '/stereo-course/textbook/schema/lesson.schema.json'));
const {JSDOM} = require('jsdom');
const dom = new JSDOM('<div id="model"></div><div id="app"></div>', {
  url:'https://example.test/stereo-course/textbook/', pretendToBeVisual:true, runScripts:'outside-only'
});
const win = dom.window;
win.eval(fs.readFileSync(root + '/stereo-course/assets/math-text.js', 'utf8'));
win.eval(fs.readFileSync(root + '/stereo-course/assets/task-scene-viewer.js', 'utf8'));
win.HTMLElement.prototype.scrollIntoView = () => {};
win.scrollTo = () => {};
let steps = 0, views = 0;

function display(value, at, id) {
  if (typeof value === 'string') {
    assert(!/[А-Яа-яЁё]\d/u.test(value), id + at + ': readable spacing before numbers');
    if (value.includes('/')) {
      const node = win.document.createElement('div');
      win.StereoMath.appendText(node, value);
      for (const fraction of node.querySelectorAll('.stereo-fraction')) fraction.remove();
      assert(!node.textContent.includes('/'), id + at + ': arithmetic ratios render as fraction bars');
    }
  } else if (Array.isArray(value)) value.forEach((item, i) => display(item, at + '.' + i, id));
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) display(item, at + '.' + key, id);
  }
}

for (const [index, card] of cards.entries()) {
  const spec = specs[index], label = card.id + ': ';
  assert(validate(card), label + JSON.stringify(validate.errors));
  assert.deepEqual(API.validateLesson(card, production.catalog.book), [], card.id);
  assert.equal(card.id, expectedIds[index]);
  assert.equal(card.kind, 'exercise');
  assert.equal(card.status, 'reviewed');
  assert.equal(card.review.reviewer, report.reviewer, label + 'independent reviewer identity');
  assert.equal(card.review.at, report.reviewedAt, label + 'independent review timestamp');
  for (const field of ['source', 'mathematics', 'pedagogy']) assert.equal(card.review[field], 'passed', label + field);
  assert.deepEqual(allById.get(card.id), card, label + 'exact integrated record');
  const hash = sha(content(card));
  assert.equal(registry.cards.find(row => row.id === card.id).sha256, hash, label + 'registered content hash');
  const reviewed = report.cards.find(row => row.id === card.id);
  assert.equal(reviewed.canonicalSHA256, hash, label + 'independent content hash');
  assert.equal(reviewed.steps, spec.steps);
  assert.equal(reviewed.modelStates, spec.views);
  assert.deepEqual(card.source, {
    bookId:'atanasyan-2024-10-11', collection:'main', exercise:String(spec.number),
    chapter:'III. Многогранники', printedPages:[84], pdfPages:[86]
  }, label + 'one original unsplit source position');
  assert.equal(card.answer.mode, 'manual', label + 'physical work is assessed manually');
  assert(!Object.hasOwn(card.answer, 'accepted'), label + 'no automatic completion answer');
  assert(card.steps.every(step => !Object.hasOwn(step, 'input')), label + 'no numeric input substitutes for assembly');
  assert.equal(card.steps.length, spec.steps);
  assert.equal(card.visualization.type, 'scene3d');
  const model = card.visualization.model, hints = allHelp(card.help);
  assert.equal(model.planar, true, label + 'primary model is the paper net');
  assert.deepEqual(model.labelNames, [], label + 'uncluttered initial labels');
  assert.deepEqual(model.neutralPoints, [], label + 'no initial seam markers');
  assert.deepEqual(Object.keys(model.views.neutral), ['label'], label + 'neutral state has no construction overlay');
  assert.equal(model.faces.length, spec.faces);
  assert(model.faces.every(face => face.length === spec.sides));
  const bodyNames = new Set(model.faces.flat());
  assert([...bodyNames].every(name => model.points[name][2] === 0), label + 'flat net faces');
  const incidence = new Map();
  for (const face of model.faces) for (let i = 0; i < face.length; i++) {
    const key = edgeKey([face[i], face[(i + 1) % face.length]]);
    incidence.set(key, (incidence.get(key) || 0) + 1);
  }
  assert([...incidence.values()].every(count => count === 1 || count === 2), label + 'net edge incidence');
  exact(model.edges.map(edgeKey), [...incidence.keys()], label + 'body edges contain no tab or marker');
  exact(model.views.folds.segments.map(edgeKey), [...incidence].filter(([, n]) => n === 2).map(([key]) => key), label + 'all fold lines');
  exact(model.views.cuts.segments.map(edgeKey), [...incidence].filter(([, n]) => n === 1).map(([key]) => key), label + 'all cut edges');
  assert.equal(model.views.folds.segments.length, spec.hinges);
  assert.equal(model.views.cuts.segments.length, 2 * spec.seams);
  assert(model.faces.some(face => sha([...face].sort()) === sha([...model.views.face.polygon].sort())), label + 'chosen face is a body face');
  assert.equal(model.views.scale.segments.length, 1);
  assert.equal(model.views.scale.points.length, 1);
  assert.equal(model.labels[model.views.scale.points[0]], 'a');
  assert(incidence.has(edgeKey(model.views.scale.segments[0])), label + 'representative body side');
  const tab = model.views.tab;
  assert.equal(tab.polygon.length, 4, label + 'one illustrative trapezoidal tab');
  assert.equal(tab.polygon.filter(name => !bodyNames.has(name)).length, 2, label + 'tab is separate from body faces');
  assert.equal(tab.segments.length, 1);
  assert.equal(incidence.get(edgeKey(tab.segments[0])), 1, label + 'tab attaches to a cut edge');
  const seamHelp = hints.find(hint => hint.id === 'h-seams');
  assert(seamHelp, label + 'seam help parent');
  exact(seamHelp.children.map(hint => hint.id), Array.from({length:spec.seams}, (_, i) => 'h-seam-' + (i + 1)), label + 'every seam has a nested help');
  const seamEdges = [];
  for (let number = 1; number <= spec.seams; number++) {
    const key = 'seam-' + number, view = model.views[key];
    assert.equal(view.segments.length, 2, label + key + ' has exactly two matching edges');
    assert.equal(view.points.length, 2, label + key + ' has two local labels');
    assert(view.points.every(name => model.labels[name] === String(number)), label + key + ' matching numbers');
    assert.equal(seamHelp.children.find(hint => hint.id === 'h-' + key).view, key);
    seamEdges.push(...view.segments.map(edgeKey));
  }
  exact(seamEdges, model.views.cuts.segments.map(edgeKey), label + 'each boundary edge belongs to exactly one seam');
  const used = new Set(['neutral']), refs = [];
  for (const hint of hints) { used.add(hint.view || 'neutral'); refs.push(...hint.theoryIds || []); }
  for (const step of card.steps) {
    used.add(step.view || 'neutral');
    refs.push(...step.justifications.flatMap(j => j.theoryId ? [j.theoryId] : []));
  }
  const theoryId = 'theory-036-' + spec.solid;
  assert(hints.find(hint => hint.id === 'h-solid')?.theoryIds?.includes(theoryId), label + 'finished solid in contextual theory');
  assert(card.steps.at(-1).justifications.some(j => j.theoryId === theoryId), label + 'final physical-model check links theory');
  assert.equal(card.steps.at(-1).view, 'neutral');
  for (const id of refs) assert.equal(allById.get(id)?.kind, 'theory', label + 'available contextual theory ' + id);
  exact([...used], Object.keys(model.views), label + 'every authored model state is reachable');
  assert.equal(used.size, spec.views);
  const mounted = win.TaskSceneViewer.mount(win.document.getElementById('model'), model);
  for (const view of used) {
    assert(mounted.setView(view), label + 'render ' + view);
    const svg = win.document.getElementById('model').querySelector('svg');
    assert(svg && !/NaN|Infinity/.test(svg.outerHTML), label + 'finite SVG ' + view);
    if (view === 'neutral') assert.equal(svg.querySelectorAll('text').length, 0, label + 'neutral net has no crowded labels');
    if (view.startsWith('seam-')) {
      assert.deepEqual([...svg.querySelectorAll('text')].map(node => node.textContent), [view.slice(5), view.slice(5)], label + 'only the chosen seam is numbered');
    }
  }
  mounted.destroy();
  for (const [key, value] of Object.entries(card)) if (!['source', 'review'].includes(key)) display(value, '.' + key, card.id);
  const captured = new Set(), cases = [...screenshots].filter(([key]) => key.startsWith(card.id + '|'));
  assert.equal(cases.length, spec.views + 1, label + 'one capture per view plus final instructions');
  for (const [key] of cases) {
    const stage = key.split('|')[1];
    if (stage === 'condition') captured.add('neutral');
    else if (stage.startsWith('step-')) {
      const step = card.steps.find(item => item.id === stage);
      assert(step, label + 'known captured step ' + stage);
      captured.add(step.view || 'neutral');
    } else {
      assert(stage.startsWith('help:'), label + 'known browser stage');
      const hint = hints.find(item => item.id === stage.slice(5));
      assert(hint, label + 'known captured help ' + stage);
      captured.add(hint.view || 'neutral');
    }
  }
  assert(screenshots.has(card.id + '|condition'), label + 'initial browser capture');
  assert(screenshots.has(card.id + '|' + card.steps.at(-1).id), label + 'complete final instructions capture');
  exact([...captured], Object.keys(model.views), label + 'browser capture cases cover all states');
  steps += card.steps.length;
  views += used.size;
}

assert.equal(steps, 37);
assert.equal(views, 75);
assert.equal(screenshots.size, 997, '917 preserved cases plus 80 practical cases');
exact([...screenshots.values()], [...new Set(screenshots.values())], 'unique screenshot filenames');
assert.equal(production.lessons.length, 479);
assert.equal(production.lessons.filter(card => card.kind === 'exercise').length, 391);
assert.equal(production.lessons.reduce((sum, card) => sum + card.steps.length, 0), 1730);
assert.equal(production.lessons.reduce((sum, card) => sum + Object.keys(card.visualization.model.views).length, 0), 1784);
for (const spec of specs) {
  const number = String(spec.number), source = sourceIndex.entries.find(entry => entry.id === 'source-main-0' + number);
  assert(source, 'source index position ' + number);
  assert.deepEqual(source.requiredParts, [null]);
  assert.deepEqual(source.sourceSubparts, []);
  assert.deepEqual(source.source.printedPages, [84]);
  assert.deepEqual(source.source.pdfPages, [86]);
  const rows = production.catalog.entries.filter(entry => entry.source.collection === 'main' && entry.source.exercise === number);
  assert.equal(rows.length, 1, 'one unsplit catalog position ' + number);
  assert.equal(rows[0].id, 'ex-main-0' + number);
  assert.equal(rows[0].status, 'reviewed');
  assert.equal(rows[0].source.subpart, undefined);
}
const full = API.inspectBundle(production.catalog, production.lessons);
assert.deepEqual(full.issues, []);
assert.equal(full.available.size, 479);
assert.equal(production.catalog.entries.length, 1368);
assert.equal(full.coverage.availableTheoryPoints, 37);
assert.equal(full.coverage.availableExercises, 287);
assert.equal(full.coverage.availableSelfchecks, 40);
assert.equal(full.coverage.partiallyAvailable, 0);
for (const id of expectedIds) {
  const copy = structuredClone(production);
  copy.catalog.entries.find(entry => entry.id === id).status = 'draft';
  copy.lessons = copy.lessons.filter(card => card.id !== id);
  const result = API.inspectBundle(copy.catalog, copy.lessons);
  assert.deepEqual(result.issues, []);
  assert.equal(result.available.size, 478, id + ': withholding an unsplit task removes one card');
  assert.equal(result.coverage.availableExercises, 286, id + ': withholding a task removes its source number');
  assert.equal(result.coverage.partiallyAvailable, 0, id + ': no invented partial source');
}
const pending = structuredClone(cards);
for (const card of pending) { card.status = 'in-review'; card.review = {source:'pending', mathematics:'pending', pedagogy:'pending'}; }
const pendingCatalog = {...production.catalog, entries:pending.map(card => Object.fromEntries(['id','revision','kind','title','status','source'].map(key => [key, card[key]])))};
assert.equal(API.inspectBundle(pendingCatalog, pending).available.size, 0, 'unreviewed practical cards cannot publish');

// Exercise the actual source disclosure, retained steps, contextual solid and
// manual answer flow. Saving a description must never certify a paper model.
const appRoot = win.document.getElementById('app');
const app = API.createApp(appRoot, production);
for (const [index, card] of cards.entries()) {
  assert(app.open(card.id), card.id + ': open reviewed practical task');
  assert(appRoot.querySelector('[data-main-model] svg'), card.id + ': actual primary net');
  const disclosure = [...appRoot.querySelectorAll('summary')].find(node => node.textContent === 'Где это в учебнике?');
  assert(disclosure, card.id + ': source disclosure');
  const sourceText = disclosure.parentElement.querySelector('p').textContent;
  for (const text of ['стр. 84', 'PDF 86', '№ ' + card.source.exercise]) assert(sourceText.includes(text), card.id + ': visible source ' + text);
  const next = [...appRoot.querySelectorAll('button')].find(button => button.textContent === 'Разобрать по шагам');
  assert(next, card.id + ': step control');
  for (let i = 0; i < card.steps.length; i++) next.click();
  assert.equal(appRoot.querySelectorAll('[data-step]').length, card.steps.length, card.id + ': earlier steps retained');
  assert(next.hidden, card.id + ': all steps revealed');
  const form = appRoot.querySelector('[data-final-form]'), field = form.querySelector('textarea');
  assert(field, card.id + ': manual response field');
  assert.equal(form.querySelector('button').textContent, 'Сохранить рассуждение');
  field.value = 'Пробная запись о ходе сборки.';
  field.dispatchEvent(new win.Event('input', {bubbles:true}));
  form.dispatchEvent(new win.Event('submit', {bubbles:true, cancelable:true}));
  assert.match(appRoot.querySelector('[data-final-feedback]').textContent, /обсудить с учителем/);
  const stateKey = 'mathExamTextbook.v1:' + production.catalog.book.id + ':' + card.id + ':r' + card.revision;
  const saved = JSON.parse(win.localStorage.getItem(stateKey));
  assert.equal(saved.checked, false, card.id + ': no automatic physical-model credit');
  assert.equal(saved.revealed, card.steps.length);
  const solidId = 'theory-036-' + specs[index].solid;
  const solidButton = [...appRoot.querySelector('[data-help="h-solid"]').querySelectorAll('button')]
    .find(button => button.textContent.includes(allById.get(solidId).title));
  assert(solidButton, card.id + ': contextual finished-solid button');
  solidButton.click();
  const dialog = appRoot.querySelector('dialog[data-theory="' + solidId + '"]');
  assert(dialog && dialog.querySelector('svg'), card.id + ': existing closed-solid theory dialog');
  dialog.querySelector('button').click();
  assert.equal(appRoot.querySelectorAll('dialog').length, 0, card.id + ': returns to net');
  assert.equal(appRoot.querySelectorAll('[data-step]').length, card.steps.length, card.id + ': steps retained after theory');
}
app.destroy();
dom.window.close();
console.log('ATANASYAN_POLYHEDRA_PRACTICAL_CONTENT_OK', cards.length, 'cards', steps, 'steps', views, 'states; prior 474 exact; practical 271–275 complete; manual paper-model assessment');
