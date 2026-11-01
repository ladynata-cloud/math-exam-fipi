'use strict';
// Author-side structural checks; this is not independent content approval.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..'), folder = path.join(root, 'content-drafts/atanasyan-chapter-iv-selfcheck');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const manifest = read(path.join(folder, 'manifest.json')), baseline = read(path.join(__dirname, 'baseline.json'));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
for (const [file, expected] of Object.entries(baseline.files)) assert.equal(sha(fs.readFileSync(path.join(root, file))), expected, 'published bytes preserved: ' + file);
const expectedIds = ['01','02','03-a','03-b','03-c','04','05-a','05-b','06','07','08','09','10'].map(x => 'ex-selfcheck-iv-' + x);
assert.deepEqual(manifest.cards, expectedIds); assert.equal(manifest.status, 'in-review');
assert.deepEqual(fs.readdirSync(folder).filter(x => x.endsWith('.json') && x !== 'manifest.json').sort(), expectedIds.map(x => x + '.json').sort());
const cards = manifest.cards.map(id => read(path.join(folder, id + '.json')));
const course = read(path.join(root, 'stereo-course/textbook/data/course.json')), source = read(path.join(root, 'stereo-course/textbook/source-index.json'));
const Ajv = require('ajv/dist/2020'), ajv = new Ajv({allErrors:true, strict:true}); require('ajv-formats')(ajv);
const validate = ajv.compile(read(path.join(root, 'stereo-course/textbook/schema/lesson.schema.json')));
const API = require(path.join(root, 'stereo-course/textbook/assets/engine.js'));
const {JSDOM} = require('jsdom'), dom = new JSDOM('<div id="model"></div>', {url:'https://example.test/', pretendToBeVisual:true, runScripts:'outside-only'});
for (const file of ['math-text.js','task-scene-viewer.js']) dom.window.eval(fs.readFileSync(path.join(root, 'stereo-course/assets', file), 'utf8'));
const theory = new Set(course.lessons.filter(c => c.kind === 'theory').map(c => c.id));
let steps = 0, views = 0;
for (const c of cards) {
  assert(validate(c), c.id + JSON.stringify(validate.errors));
  assert.deepEqual(API.validateLesson(c, course.catalog.book), [], c.id);
  assert.equal(c.status, 'in-review'); assert.deepEqual(c.review, {source:'pending', mathematics:'pending', pedagogy:'pending'});
  assert.equal(c.answer.mode, 'manual'); assert(!course.lessons.some(x => x.id === c.id), 'candidate absent from published bundle');
  assert.equal(c.source.chapter, 'IV. Цилиндр, конус и шар'); assert.equal(c.source.collection, 'selfcheck');
  const n = Number(c.source.exercise), page = n < 8 ? 111 : 112;
  assert.deepEqual(c.source.printedPages, [page]); assert.deepEqual(c.source.pdfPages, [page+2]);
  assert(source.entries.some(e => e.id === 'source-selfcheck-4-' + String(n).padStart(2,'0')));
  const model = c.visualization.model, used = new Set(['neutral']);
  for (const h of c.help) { used.add(h.view); h.theoryIds.forEach(id => assert(theory.has(id), c.id + ' contextual theory ' + id)); }
  for (const s of c.steps) { used.add(s.view); assert(s.justifications.length); s.justifications.forEach(j => { if(j.theoryId) assert(theory.has(j.theoryId)); }); }
  assert.deepEqual([...used].sort(), Object.keys(model.views).sort(), c.id + ': every state reachable');
  const mounted = dom.window.TaskSceneViewer.mount(dom.window.document.getElementById('model'), model);
  for (const v of used) { assert(mounted.setView(v)); const svg = dom.window.document.querySelector('svg'); assert(svg); assert(!/NaN|Infinity/.test(svg.outerHTML), c.id + ': finite SVG ' + v); }
  mounted.destroy();
  const initial = [c.title,c.statement.text,c.statement.goal,c.answer.prompt,c.visualization.caption,model.note,model.views.neutral.label].join('\n');
  assert(!/(?:Ответ|Вердикт)\s*[:=]|невозможная конфигурация|утверждение ложно/iu.test(initial), c.id + ': no initial textual answer');
  steps += c.steps.length; views += used.size;
}
for (let n=1; n<=10; n++) {
  const actual = cards.filter(c => Number(c.source.exercise) === n).map(c => c.source.subpart ?? null);
  assert.deepEqual(actual, n===3 ? ['а','б','в'] : n===5 ? ['а','б'] : [null]);
  assert.deepEqual(manifest.proposedSourceContracts[n], actual);
}
const entries = course.catalog.entries.filter(e => !e.id.startsWith('source-selfcheck-4-'));
const draftCatalog = {...course.catalog, entries:entries.concat(cards.map(c => Object.fromEntries(['id','revision','kind','title','status','source'].map(k => [k,c[k]]))))};
const checked = API.inspectBundle(draftCatalog, course.lessons.concat(cards));
assert.equal(checked.available.size, 640, 'pending candidates cannot become published lessons');
assert.equal(API.inspectBundle(course.catalog, course.lessons).available.size, 640);
assert.equal(steps, manifest.expected.steps); assert.equal(views, manifest.expected.views);
assert.equal(cards.length, 13); assert.equal(steps, 31); assert.equal(views, 45);
dom.window.close();
console.log('ATANASYAN_IV_SELFCHECK_DRAFT_CHECKS_OK: 13 draft cards, 31 steps, 45 reachable models; published 640 unchanged; review remains pending');
