'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '../..'), baseline = require('./iv-selfcheck-baseline.cjs');
const {ids, sha, hash, exact, published} = baseline;
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const course = read('stereo-course/textbook/data/course.json');
const index = read('stereo-course/textbook/source-index.json');
const registry = require('./content-review.json'), cases = require('./browser-cases.cjs');
const previous = baseline.previousCourse(course, index);
baseline.previousIndex(index); baseline.previousRegistry(registry); baseline.previousCases(cases);
assert.equal(baseline.previousLessonFiles(path.join(root, 'stereo-course/textbook/lessons')).length, 640);
assert.equal(hash(fs.readFileSync(path.join(root, published.reviewReport))), published.reviewReportSHA256, 'original independent verdict remains byte-identical');
const API = require(root + '/stereo-course/textbook/assets/engine.js');
const result = API.inspectBundle(course.catalog, course.lessons);
assert.deepEqual(result.issues, []);
assert.equal(result.available.size, 653);
assert.equal(result.coverage.availableSelfchecks, 50);
assert.equal(result.coverage.availableExercises, 395);
assert.equal(result.coverage.availableTheoryPoints, 51);
assert.equal(result.coverage.partiallyAvailable, 0);
const cards = course.lessons.filter(card => ids.has(card.id)); exact(cards.map(card => card.id), ids, 'thirteen published IV cards');
let steps = 0, views = 0;
for (const card of cards) {
  const draftPath = 'content-drafts/atanasyan-chapter-iv-selfcheck/' + card.id + '.json';
  const draft = read(draftPath), raw = read('stereo-course/textbook/lessons/' + card.id + '.json');
  assert.equal(hash(fs.readFileSync(path.join(root, draftPath))), published.candidateRawHashes[card.id]);
  assert.deepEqual({...card, status: draft.status, review: draft.review}, draft, 'all source, proof and model fields identical to reviewed candidate');
  assert.deepEqual(card, raw, 'generated bundle matches raw card');
  assert.equal(sha(card), published.integratedHashes[card.id]);
  assert.equal(card.status, 'reviewed');
  assert.equal(card.answer.mode, 'manual', 'proofs never automatically certified');
  assert.deepEqual(API.validateLesson(card, course.catalog.book), []);
  for (const stage of ['condition', ...card.help.map(h => 'help:' + h.id), ...card.steps.map(s => s.id)]) assert(cases.has(card.id + '|' + stage));
  steps += card.steps.length; views += Object.keys(card.visualization.model.views).length;
}
assert.equal(steps, 31); assert.equal(views, 45);
// Removal or corruption must fail closed, including missing Cyrillic parts.
let rejected = 0;
for (const mutate of [
  data => { data.lessons = data.lessons.filter(card => card.id !== 'ex-selfcheck-iv-03-b'); },
  data => { data.lessons.find(card => ids.has(card.id)).steps[0].explanation += ' altered'; },
  data => { data.lessons.find(card => !ids.has(card.id)).revision++; },
  data => { data.catalog.entries.find(card => ids.has(card.id)).source.subpart = 'a'; }
]) { const data = structuredClone(course); mutate(data); assert.throws(() => baseline.previousCourse(data, index)); rejected++; }
const incomplete = structuredClone(index); delete incomplete.entries.find(baseline.target).requiredParts;
assert.throws(() => baseline.previousIndex(incomplete)); rejected++;
const pending = structuredClone(cards), catalog = structuredClone(course.catalog);
pending.forEach(card => {card.status = 'in-review'; card.review = {source:'pending',mathematics:'pending',pedagogy:'pending'};});
catalog.entries.forEach(entry => {if(ids.has(entry.id)) entry.status = 'in-review';});
assert.equal(API.inspectBundle(catalog, previous.lessons.concat(pending)).available.size, 640, 'pending additions never open');
const {JSDOM} = require('jsdom');
const dom = new JSDOM('<div id="app"></div>', {url:'https://example.test/stereo-course/textbook/', runScripts:'outside-only', pretendToBeVisual:true});
const win = dom.window;
for (const file of ['math-text.js', 'task-scene-viewer.js']) win.eval(fs.readFileSync(path.join(root, 'stereo-course/assets', file), 'utf8'));
win.eval(fs.readFileSync(path.join(root, 'stereo-course/textbook/assets/engine.js'), 'utf8'));
const appRoot = win.document.getElementById('app');
let app = win.StereoTextbook.createApp(appRoot, course);
const stateKey = card => 'mathExamTextbook.v1:' + card.source.bookId + ':' + card.id + ':r' + card.revision;
// Existing records are restored without rewriting any lesson identity/revision.
const old = previous.lessons.find(card => card.answer?.mode === 'manual');
app.open(old.id);let field=appRoot.querySelector('#final-answer');field.value='Сохранённая работа прежнего курса';field.dispatchEvent(new win.Event('input',{bubbles:true}));
const oldKey=stateKey(old),oldBytes=win.localStorage.getItem(oldKey);
for (const card of cards) {
  assert(app.open(card.id));
  assert.equal(appRoot.querySelectorAll('[data-step]').length, 0);
  assert(!appRoot.querySelector('[data-main-help]').open, 'explanations are optional');
  const caption=appRoot.querySelector('main>header>[data-companion-source]').textContent;
  assert(caption.includes('К вопросу '+card.source.exercise+' для самопроверки'));
  if(card.source.subpart)assert(caption.includes('подпункт '+card.source.subpart));
  assert(!caption.includes('К параграфу'), 'chapter questions have no invented paragraph');
  const input=appRoot.querySelector('#final-answer');input.value='Моё доказательство: '+card.id;input.dispatchEvent(new win.Event('input',{bubbles:true}));
  const next=appRoot.querySelector('[data-steps]+button');for(const _ of card.steps)next.click();
  assert.equal(appRoot.querySelectorAll('[data-step]').length,card.steps.length);
  const saved=JSON.parse(win.localStorage.getItem(stateKey(card)));
  assert.equal(saved.revealed,card.steps.length);assert.equal(saved.draft,input.value);assert.equal(saved.checked,false);
  app.home();assert(app.open(card.id));
  assert.equal(appRoot.querySelector('#final-answer').value,saved.draft);
  assert.equal(appRoot.querySelectorAll('[data-step]').length,card.steps.length);
}
assert.equal(win.localStorage.getItem(oldKey),oldBytes,'new work never changes old records');
app.destroy();app=win.StereoTextbook.createApp(appRoot,course);assert(app.open(old.id));
assert.equal(appRoot.querySelector('#final-answer').value,'Сохранённая работа прежнего курса');
for(const card of cards){assert(app.open(card.id));assert.equal(appRoot.querySelectorAll('[data-step]').length,card.steps.length);}
app.destroy();dom.window.close();
console.log('ATANASYAN_IV_SELFCHECK_INTEGRATION_OK: 653 cards; exact 640-card preservation; 13 unchanged candidates; 31 retained steps; 45 model states; '+rejected+' rejected corruptions');
