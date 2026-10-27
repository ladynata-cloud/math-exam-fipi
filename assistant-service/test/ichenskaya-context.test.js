import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, cpSync, copyFileSync, appendFileSync, rmSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { COURSE_PROFILE, ICHENSKAYA_COURSE, ICHENSKAYA_TOPIC, resolveCourseContext,
  prepareCourseQuestion, answerCourseOffline } from '../src/course-context.js';
import { buildCabinetMessages } from '../src/cabinet-topics.js';

const require = createRequire(import.meta.url), cabinet = require('../../board-server/assistant-course-context');
const raw = readFileSync(new URL('../../learning/ichenskaya-grade7-works/course.json', import.meta.url));
const course = JSON.parse(raw.toString('utf8'));
const manifestRaw = readFileSync(new URL('../../learning/ichenskaya-grade7-works/source-manifest.json', import.meta.url));
const manifest = JSON.parse(manifestRaw.toString('utf8'));
const snapshot = JSON.parse(readFileSync(new URL('../knowledge/ichenskaya-grade7-works.json', import.meta.url), 'utf8'));
const contextFor = (lessonId = 'ichenskaya-7-sr-01-v1-task-01', stepIndex = 0) => ({ courseId: ICHENSKAYA_COURSE, lessonId, stepIndex });
const digest = createHash('sha256').update(raw).digest('hex');
function request(context = contextFor(), extra = {}) {
  const resolved = resolveCourseContext(context);
  return { profileId: COURSE_PROFILE, topic: resolved.topic, question: resolved.question, courseContext: context,
    courseRevision: resolved.courseRevision, attempt: '', mode: 'hint', hintLevel: 1, simpler: false, requestId: randomUUID(), ...extra };
}

test('companion snapshot and independent manifest copy match exactly all 110 approved source entries', () => {
  assert.equal(cabinet.SOURCE_PROFILE_ID, COURSE_PROFILE);
  assert.deepEqual(Object.keys(cabinet.COURSE_SOURCES), ['atanasyan-first-steps', ICHENSKAYA_COURSE]);
  assert.equal(createHash('sha256').update(manifestRaw).digest('hex'), cabinet.ICHENSKAYA_MANIFEST_SHA256);
  assert.deepEqual(readFileSync(new URL('../knowledge/ichenskaya-grade7-works-manifest.json', import.meta.url)), manifestRaw);
  assert.deepEqual(snapshot, cabinet.projectCourse(course, digest));
  assert.equal(snapshot.courseSha256, digest); assert.equal(snapshot.sourceManifestSha256, cabinet.ICHENSKAYA_MANIFEST_SHA256);
  assert.equal(snapshot.lessons.length, 110);
  assert.deepEqual(new Set(snapshot.lessons.map(lesson => lesson.id)), new Set(manifest.entries.map(entry => entry.id)));
  assert.equal(snapshot.lessons.filter(lesson => lesson.source.collection === 'sr').length, 74);
  assert.equal(snapshot.lessons.filter(lesson => lesson.source.collection === 'kr').length, 36);
  for (const lesson of snapshot.lessons) {
    assert.equal(Object.hasOwn(lesson, 'visualization'), false);
    assert.deepEqual(lesson.source, manifest.entries.find(entry => entry.id === lesson.id).source);
  }
});

test('every companion step resolves independently and keeps source-specific hint/full-review boundaries', () => {
  for (const lesson of course.lessons) for (let index = 0; index < lesson.steps.length; index++) {
    const context = contextFor(lesson.id, index), board = cabinet.resolveCourseContext(context), service = resolveCourseContext(context);
    assert.equal(board.question, lesson.statement.text);
    assert.equal(service.question, board.question); assert.equal(service.courseRevision, board.courseRevision);
    assert.equal(board.topic, ICHENSKAYA_TOPIC); assert.equal(service.topic, ICHENSKAYA_TOPIC);
    for (const [mode, hintLevel] of [['hint', 1], ['hint', 2], ['hint', 3], ['full', 1]]) {
      const prepared = prepareCourseQuestion(request(context, { mode, hintLevel }));
      const answer = answerCourseOffline(prepared.input, prepared.cards);
      assert.equal(answer.verification, 'curated-guidance'); assert.equal(answer.complete, mode === 'full');
      assert.deepEqual(answer.courseContext, context); assert.equal(answer.courseRevision, digest);
      assert.equal(answer.topic, ICHENSKAYA_TOPIC);
      assert.equal(answer.sources[0].url, 'https://mathexam.space/geometry-course/ichenskaya-7-works/#' + lesson.id);
      assert.match(answer.check, /проверит преподаватель/);
      assert(answer.steps.length <= 12 && answer.steps.every(step => step.length <= 1500));
      if (mode === 'hint') {
        const step = lesson.steps[index], expected = hintLevel === 1 ? step.prompt : hintLevel === 2
          ? step.justifications[0]?.text || step.prompt : step.explanation;
        assert.deepEqual(answer.steps, [expected]);
      } else for (const step of lesson.steps) assert(answer.steps.join('\n').includes(step.explanation));
      assert.throws(() => buildCabinetMessages(prepared.input, prepared.cards), error => error.code === 'CABINET_COURSE_SOURCE_ONLY');
    }
  }
});

test('cross-course identifiers, revisions, topics, browser data and invalid source inventory fail closed', () => {
  const primary = { courseId: 'atanasyan-first-steps', lessonId: 'atanasyan-7-9-main-153-part-1', stepIndex: 0 };
  const invalid = [
    { ...contextFor(), courseId: 'atanasyan-first-steps' }, { ...primary, courseId: ICHENSKAYA_COURSE },
    contextFor('ichenskaya-7-sr-18-v1-task-01'), contextFor('ichenskaya-7-kr-07-v1-task-01'),
    contextFor('ichenskaya-7-sr-01-v3-task-01'), contextFor('ichenskaya-7-z-01-v1-task-01'),
    contextFor('ichenskaya-7-sr-1-v1-task-1'), contextFor('ichenskaya-7-sr-01-v1-task-99'),
    { ...contextFor(), courseId: '__proto__' }, { ...contextFor(), courseId: '../atanasyan-first-steps' },
    { ...contextFor(), stepIndex: -1 }, { ...contextFor(), stepIndex: 999 }, { ...contextFor(), stepIndex: 0.1 },
    { ...contextFor(), url: 'https://other.example.test' }, { ...contextFor(), question: 'browser condition' }
  ];
  for (const context of invalid) {
    assert.throws(() => cabinet.resolveCourseContext(context)); assert.throws(() => resolveCourseContext(context));
  }
  for (const extra of [{ profileId: ICHENSKAYA_COURSE }, { topic: 'atanasyan-course-step' },
    { courseRevision: resolveCourseContext(primary).courseRevision }, { question: resolveCourseContext(primary).question },
    { solution: 'browser proof' }, { attempt: 'teacher@example.test' }]) assert.throws(() => prepareCourseQuestion(request(contextFor(), extra)));
  for (const mutate of [
    value => { value.lessons.pop(); },
    value => { value.lessons[0].id = primary.lessonId; },
    value => { value.lessons[0].source.variant = 2; },
    value => { value.lessons[0].source.pdfPages = [1]; },
    value => { value.lessons[0].review.mathematics = 'pending'; },
    value => { value.source.sha256 = '0'.repeat(64); },
    value => { value.source.manifestSha256 = '0'.repeat(64); }
  ]) { const changed = structuredClone(course); mutate(changed); assert.throws(() => cabinet.projectCourse(changed, digest)); }
});

test('isolated helper layout resolves both courses without repository data and rejects a changed manifest', async t => {
  const serviceRoot = fileURLToPath(new URL('../', import.meta.url));
  const directory = mkdtempSync(path.join(tmpdir(), 'mathexam-source-helper-image-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  // Exactly the source/knowledge/package layout copied by the helper Dockerfile.
  for (const folder of ['src', 'knowledge']) cpSync(path.join(serviceRoot, folder), path.join(directory, folder), { recursive: true });
  copyFileSync(path.join(serviceRoot, 'package.json'), path.join(directory, 'package.json'));
  const moduleUrl = pathToFileURL(path.join(directory, 'src/course-context.js')).href;
  const standalone = await import(moduleUrl);
  const primary = { courseId: 'atanasyan-first-steps', lessonId: 'atanasyan-7-9-main-160-part-2', stepIndex: 0 };
  const companion = contextFor('ichenskaya-7-kr-06-v2-task-04');
  assert.deepEqual(standalone.resolveCourseContext(primary).courseContext, primary);
  assert.deepEqual(standalone.resolveCourseContext(companion).courseContext, companion);
  appendFileSync(path.join(directory, 'knowledge/ichenskaya-grade7-works-manifest.json'), '\n');
  const changed = await import(moduleUrl + '?changed-manifest');
  assert.throws(() => changed.resolveCourseContext(companion), error => error.code === 'CABINET_COURSE_SOURCE_INVALID');
  assert.deepEqual(changed.resolveCourseContext(primary).courseContext, primary, 'A companion failure cannot borrow or corrupt the primary source');
});
