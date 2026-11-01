'use strict';

// Source protection and route-boundary regression checks.  This is deliberately
// independent of the builder's selection helper: it compares every exported
// lesson and catalogue entry with the sealed textbook source.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const sourcePath = path.join(root, 'geometry-course/textbook/data/course.json');
const targetPath = path.join(root, 'learning/atanasyan-first-steps/course.json');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const sourceBytes = fs.readFileSync(sourcePath);
const courseBytes = fs.readFileSync(targetPath);
const source = JSON.parse(sourceBytes);
const course = JSON.parse(courseBytes);

assert.equal(course.schemaVersion, 1);
assert.equal(course.id, 'atanasyan-first-steps');
assert.equal(hash(sourceBytes), 'af1e3a373745d3a66e3e6f71b14d02de4cd81f0c688a8929c0475277cc22b574');
assert.equal(course.source.sha256, hash(sourceBytes));
// Chapters V–VIII extend only the surrounding source bundle. Retain the original
// selected-content fingerprint and independently restore the old provenance
// field to verify the exact sealed route bytes, including every card/model.
assert.equal(course.source.selectionSha256, '175e92c3dc4476da7148b4e8c2d2e305d7cd322c55d6d5db1290cc98a1004318');
const serialized = courseBytes.toString('utf8');
assert.equal(serialized.split(course.source.sha256).length, 2);
const previousProvenance = serialized.replace(course.source.sha256,
  'afd4228a2e1444c8fca719fcc2dc0145ca5419354980a33dcadbf637b560325d');
assert.equal(hash(Buffer.from(previousProvenance)), '551c433a5332dba52779e74f7e6f95289c3915bdc55da3f7c0ed71d0b7e651a3',
  'Rebinding bundle provenance must not change any reviewed route content');
assert.equal(course.source.bookSha256, source.sourceInventory.book.sourceSha256);
assert.deepEqual(course.book, source.catalog.book);
assert.deepEqual(course.boundaries.exerciseNumbers, [1, 160]);
assert.deepEqual(course.boundaries.theoryPoints, [1, 23]);
assert.equal(course.boundaries.completeWithinScope, true);
assert.equal(course.boundaries.fullTextbookComplete, false);

const originalLessons = new Map(source.lessons.map(lesson => [lesson.id, lesson]));
const originalEntries = new Map(source.catalog.entries.map(entry => [entry.id, entry]));
const expected = source.lessons.filter(lesson =>
  (lesson.source.collection === 'main' && Number(lesson.source.exercise) >= 1 && Number(lesson.source.exercise) <= 160)
  || (lesson.kind === 'theory' && Number(lesson.source.point) >= 1 && Number(lesson.source.point) <= 23));
const actualIds = course.lessons.map(lesson => lesson.id);
assert.equal(actualIds.length, 255);
assert.equal(new Set(actualIds).size, 255);
assert.deepEqual(new Set(actualIds), new Set(expected.map(lesson => lesson.id)));
for (const lesson of course.lessons) {
  assert.deepEqual(lesson, originalLessons.get(lesson.id), `Changed source card ${lesson.id}`);
  assert.equal(lesson.status, 'reviewed');
  assert.equal(lesson.source.bookId, 'atanasyan-2023-7-9');
  assert.ok(lesson.source.printedPages.every(page => page >= 5 && page <= 49));
  if (lesson.kind === 'exercise') assert.equal(lesson.answer.mode, 'manual');
}
assert.deepEqual(course.catalog.entries.map(entry => entry.id), actualIds);
for (const entry of course.catalog.entries) assert.deepEqual(entry, originalEntries.get(entry.id));
assert.equal(course.catalog.inventoryComplete, false, 'Do not claim that the whole textbook is complete');

const numbers = [...new Set(course.lessons.filter(lesson => lesson.kind === 'exercise').map(lesson => Number(lesson.source.exercise)))].sort((a, b) => a - b);
assert.deepEqual(numbers, Array.from({ length: 160 }, (_, index) => index + 1));
const theories = course.lessons.filter(lesson => lesson.kind === 'theory');
assert.deepEqual(theories.map(lesson => Number(lesson.source.point)).sort((a, b) => a - b), Array.from({ length: 23 }, (_, index) => index + 1));
const theoryIds = new Set(theories.map(lesson => lesson.id));
function checkReferences(value) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) { for (const item of value) checkReferences(item); return; }
  for (const [key, item] of Object.entries(value)) {
    if (key === 'theoryId') assert.ok(theoryIds.has(item), `Missing theory ${item}`);
    else if (key === 'theoryIds') for (const id of item) assert.ok(theoryIds.has(id), `Missing theory ${id}`);
    else checkReferences(item);
  }
}
checkReferences(course.lessons);

assert.deepEqual(course.sections.map(section => section.exerciseNumbers), [[1, 10], [11, 20], [21, 26], [27, 44], [45, 57], [58, 74], [75, 91], [92, 104], [105, 125], [126, 147], [148, 152], [153, 160]]);
assert.deepEqual(course.sections.flatMap(section => section.lessonIds), actualIds);
for (const section of course.sections) {
  const lessons = section.lessonIds.map(id => originalLessons.get(id));
  const theoryCount = section.theoryPoints.length;
  assert.deepEqual(lessons.slice(0, theoryCount).map(lesson => Number(lesson.source.point)), section.theoryPoints);
  assert.ok(lessons.slice(theoryCount).every(lesson => lesson.kind === 'exercise'));
  assert.ok(lessons.every(lesson => lesson.source.chapter === section.chapter));
  const pages = lessons.flatMap(lesson => lesson.source.printedPages);
  assert.deepEqual(section.printedPages, [Math.min(...pages), Math.max(...pages)]);
}
assert.ok(actualIds.indexOf('atanasyan-7-9-main-91-part-1') < actualIds.indexOf('atanasyan-7-9-theory-14-part-1'));
assert.equal(course.sections.at(-1).lessonIds.at(-1), 'atanasyan-7-9-main-160-part-2');

assert.deepEqual(Object.keys(course.displayOverrides).sort(), [1, 2, 3].map(part => `atanasyan-7-9-main-62-part-${part}`));
for (const [part, degrees] of [[1, 111], [2, 90], [3, 15]]) {
  const id = `atanasyan-7-9-main-62-part-${part}`;
  const correction = course.displayOverrides[id];
  assert.equal(correction.originalStatementText, originalLessons.get(id).statement.text);
  assert.equal(correction.statementText, `Найдите угол, смежный с углом ABC, если ∠ABC = ${degrees}°.`);
  assert.equal(course.lessons.find(lesson => lesson.id === id).statement.text, correction.originalStatementText);
  const angleChecks = originalLessons.get(id).visualization.model.checks.filter(check => check.type === 'angle');
  assert.ok(angleChecks.some(check => check.degrees === degrees && check.points.join(',') === 'A,B,C'));
}

const engine = require(path.join(root, 'geometry-course/textbook/assets/engine.js'));
const inspected = engine.inspectBundle(course.catalog, course.lessons);
assert.equal(inspected.issues.length, 0, JSON.stringify(inspected.issues));
assert.equal(inspected.available.size, 255);
assert.equal(inspected.coverage.availableExercises, 160);
assert.equal(inspected.coverage.availableTheoryPoints, 23);
assert.equal(inspected.coverage.partiallyAvailable, 0);
assert.equal(inspected.coverage.availableSelfchecks, 0);

// Run `python3 tools/atanasyan-first-steps/build.py --check` as the separate
// reproducibility gate, without making this static check spawn another runtime.
assert.equal(hash(fs.readFileSync(sourcePath)), hash(sourceBytes), 'A read-only check changed the canonical textbook');
assert.equal(hash(fs.readFileSync(targetPath)), hash(courseBytes), 'Check mode changed the projection');
console.log(JSON.stringify({ gate: 'ATANASYAN_FIRST_STEPS_SOURCE_TEST_OK', sourceIdentity: true, exactCards: 255, exerciseNumbers: 160, theoryPoints: 23, sections: 12, displayOnlyCorrections: 3, fullTextbookComplete: false }));
