'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const dir = path.join(root, 'learning/ichenskaya-grade7-works');
const read = file => JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const manifest = read('source-manifest.json'), course = read('course.json'), receipt = read('content-review.json');
const expected = [];
for (const kind of ['sr', 'kr']) for (let work = 1; work <= (kind === 'sr' ? 17 : 6); work++) {
  const count = kind === 'sr' ? ([4, 13, 17].includes(work) ? 3 : 2) : work === 3 ? 2 : work === 6 ? 4 : 3;
  for (let variant = 1; variant <= 2; variant++) for (let task = 1; task <= count; task++)
    expected.push(`ichenskaya-7-${kind}-${String(work).padStart(2, '0')}-v${variant}-task-${String(task).padStart(2, '0')}`);
}
assert.equal(expected.length, 110);
assert.deepEqual(manifest.entries.map(entry => entry.id), expected);
assert.deepEqual(course.lessons.map(lesson => lesson.id), expected);
assert.deepEqual(course.sections.flatMap(section => section.lessonIds), expected);
assert.equal(course.sections.length, 23);
assert.equal(course.lessons.filter(lesson => lesson.withinPrimaryScope).length, 54);
assert.equal(course.source.sha256, 'f3124410a12eeb8cb79a7282d63b3dc0b106871dc74ded526788ddaee23d877e');
assert.equal(course.source.manifestSha256, hash(fs.readFileSync(path.join(dir, 'source-manifest.json'))));
assert.equal(receipt.manifestSha256, course.source.manifestSha256);
assert.equal(receipt.authoredSha256, course.source.authoredSha256);
for (const key of ['source', 'mathematics', 'pedagogy']) assert.equal(receipt[key], 'passed');
const authored = new Map(fs.readdirSync(path.join(dir, 'content')).filter(file => file.endsWith('.json')).flatMap(file => {
  const value = JSON.parse(fs.readFileSync(path.join(dir, 'content', file), 'utf8'));
  return Array.isArray(value) ? value : value.cards;
}).map(card => [card.id, card]));
assert.equal(authored.size, 110);
const Planar = require(path.join(root, 'geometry-course/textbook/assets/planar-viewer.js'));
const State = require(path.join(root, 'learning/atanasyan-first-steps/state.js'));
let steps = 0, views = 0;
for (const [index, lesson] of course.lessons.entries()) {
  const source = authored.get(lesson.id);
  assert.deepEqual(lesson.source, manifest.entries[index].source);
  assert.equal(lesson.statement.text, source.condition);
  assert.equal(lesson.help.find(item => item.id === 'compare-result')?.text, source.answer);
  assert.equal(lesson.answer.mode, 'manual'); assert.equal(lesson.status, 'reviewed');
  for (const key of ['source', 'mathematics', 'pedagogy']) assert.equal(lesson.review[key], 'passed');
  assert.deepEqual(Planar.validateModel(lesson.visualization.model), [], lesson.id);
  views += Object.keys(lesson.visualization.model.views).length;
  for (const [stepIndex, step] of lesson.steps.entries()) {
    assert.equal(step.prompt, source.steps[stepIndex].prompt);
    assert.equal(step.explanation, source.steps[stepIndex].explanation);
    assert.equal(step.justifications[0].text, source.steps[stepIndex].reason);
    assert(lesson.visualization.model.views[step.view]);
    const record = State.empty(lesson);
    record.revealed = stepIndex + 1; record.assisted = true;
    record.model = { viewId: step.view, zoom: 1, maxStep: record.revealed };
    assert.equal(State.normalize(record, lesson).model.viewId, step.view);
    steps++;
  }
}
assert.equal(steps, course.counters.steps);
// Pin the high-risk source readings and keep the key's contradictions visible.
const card = id => authored.get(id);
assert.match(card('ichenskaya-7-sr-03-v2-task-02').condition, /DBA/);
assert.doesNotMatch(JSON.stringify(card('ichenskaya-7-sr-03-v2-task-02')), /PBA|PBC/);
assert.match(card('ichenskaya-7-sr-04-v2-task-03').condition, /AN = 13.*NB = 12.*AB = 8/);
assert.match(card('ichenskaya-7-sr-04-v2-task-03').answer, /Нет/);
assert.match(card('ichenskaya-7-sr-05-v1-task-01').answer, /53°.*103°/);
assert.match(card('ichenskaya-7-sr-05-v2-task-01').answer, /48°.*112°/);
assert.match(card('ichenskaya-7-sr-10-v1-task-02').condition, /радиусом 6/);
assert.match(card('ichenskaya-7-sr-10-v1-task-02').answer, /во всех трёх случаях.*два/);
assert.match(JSON.stringify(card('ichenskaya-7-sr-09-v2-task-01').steps), /пункте 30/);
// Pin the audited primary course; its source test also restores the original
// provenance and verifies the immutable teaching-content snapshot.
assert.equal(hash(fs.readFileSync(path.join(root, 'learning/atanasyan-first-steps/course.json'))), '0a55791957f465cf6f9c3736fe41ca8a4fb110601bbcf9c4e9843e38a3f5a0fe');
console.log(JSON.stringify({ gate: 'ICHENSKAYA_SOURCE_MODEL_WORK_OK', cards: 110, works: 23, variants: 46, primary: 54, steps, views }));
