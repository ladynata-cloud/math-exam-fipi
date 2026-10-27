import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { resolveCourseContext, prepareCourseQuestion, answerCourseOffline } from '../src/course-context.js';
import { prepareCabinetQuestion, answerCabinetOffline, buildCabinetMessages } from '../src/cabinet-topics.js';

const require = createRequire(import.meta.url);
const cabinet = require('../../board-server/assistant-course-context');
const raw = readFileSync(new URL('../../learning/atanasyan-first-steps/course.json', import.meta.url));
const course = JSON.parse(raw.toString('utf8'));
const snapshot = JSON.parse(readFileSync(new URL('../knowledge/atanasyan-first-steps.json', import.meta.url), 'utf8'));
const contextFor = (id = 'atanasyan-7-9-main-153-part-1', stepIndex = 0) => ({ courseId: 'atanasyan-first-steps', lessonId: id, stepIndex });
function request(context = contextFor(), extra = {}) {
  const resolved = resolveCourseContext(context);
  return { profileId: 'atanasyan-first-steps', topic: resolved.topic, question: resolved.question,
    courseContext: context, courseRevision: resolved.courseRevision, attempt: '', mode: 'hint', hintLevel: 1,
    simpler: false, requestId: randomUUID(), ...extra };
}

test('independent service packages the exact minimum projection of all 255 reviewed course cards', () => {
  const digest = createHash('sha256').update(raw).digest('hex');
  assert.equal(digest, '551c433a5332dba52779e74f7e6f95289c3915bdc55da3f7c0ed71d0b7e651a3', 'Companion cannot widen or rewrite the primary course');
  assert.equal(createHash('sha256').update(readFileSync(new URL('../knowledge/atanasyan-first-steps.json', import.meta.url))).digest('hex'),
    '2b69a93b35d05dda1ae195cd5cf0ea2482dbd7064e82d7736750afcbdce024aa', 'Existing prepared source remains byte-identical');
  assert.equal(snapshot.courseSha256, digest);
  assert.deepEqual(snapshot, cabinet.projectCourse(course, digest));
  assert.equal(snapshot.lessons.filter(lesson => lesson.kind === 'exercise').length, 232);
  assert.equal(snapshot.lessons.filter(lesson => lesson.kind === 'theory').length, 23);
  assert.equal(new Set(snapshot.lessons.filter(lesson => lesson.kind === 'exercise').map(lesson => Number(lesson.source.exercise))).size, 160);
  assert.equal(Object.hasOwn(snapshot.lessons[0], 'visualization'), false);
  assert.equal(Object.hasOwn(snapshot.lessons[0], 'review'), false);
});

test('companion routing does not weaken the primary 255-card, namespace or review guards', () => {
  const digest = createHash('sha256').update(raw).digest('hex');
  for (const mutate of [
    value => { value.lessons.pop(); },
    value => { value.lessons = value.lessons.slice(0, 110); },
    value => { value.lessons[0].id = 'ichenskaya-7-sr-01-v1-task-01'; },
    value => { value.lessons[0].id = 'atanasyan-7-9-main-161-part-1'; },
    value => { value.lessons[0].review.mathematics = 'pending'; },
    value => { value.lessons[0].status = 'draft'; }
  ]) {
    const changed = structuredClone(course); mutate(changed);
    assert.throws(() => cabinet.projectCourse(changed, digest));
  }
});

test('both service boundaries resolve every valid step to the same authoritative condition and revision', () => {
  let checked = 0;
  for (const lesson of course.lessons) for (let index = 0; index < lesson.steps.length; index++) {
    const context = contextFor(lesson.id, index), server = cabinet.resolveCourseContext(context), service = resolveCourseContext(context);
    assert.equal(service.courseRevision, server.courseRevision);
    assert.equal(service.question, server.question);
    assert.equal(service.topic, server.topic);
    assert.deepEqual(service.courseContext, server.courseContext);
    const { input, cards } = prepareCabinetQuestion(request(context));
    const answer = answerCabinetOffline(input, cards);
    assert.deepEqual(answer.steps, [lesson.steps[index].prompt]);
    assert.equal(answer.verification, 'curated-guidance');
    assert.equal(answer.complete, false);
    assert.deepEqual(answer.courseContext, context);
    assert.match(answer.check, /проверит преподаватель/);
    checked++;
  }
  assert(checked > 700);
});

test('source mapping includes all construction steps and the corrected #62 statements', () => {
  assert.match(resolveCourseContext(contextFor('atanasyan-7-9-main-62-part-1')).question, /111°/);
  assert.notEqual(resolveCourseContext(contextFor('atanasyan-7-9-main-62-part-1')).question, 'Найти смежный к ABC111°.');
  const context = contextFor('atanasyan-7-9-theory-23-part-1');
  const { input, cards } = prepareCourseQuestion(request(context, { mode: 'full' }));
  const answer = answerCourseOffline(input, cards), lesson = snapshot.lessons.find(item => item.id === context.lessonId);
  assert.equal(lesson.steps.length, 18);
  assert.equal(answer.complete, true);
  assert(answer.steps.length <= 12);
  for (const step of lesson.steps) assert(answer.steps.join('\n').includes(step.explanation));
  assert.match(answer.check, /не означает.*самостоятельно/);
});

test('hint levels explain only the selected source step and never advance to another one', () => {
  const context = contextFor('atanasyan-7-9-main-153-part-1', 1);
  const lesson = resolveCourseContext(context).lesson, current = lesson.steps[1];
  for (const [hintLevel, expected] of [[1, current.prompt], [2, current.reasons[0]], [3, current.explanation], [8, current.explanation]]) {
    const { input, cards } = prepareCourseQuestion(request(context, { hintLevel }));
    const answer = answerCourseOffline(input, cards);
    assert.deepEqual(answer.steps, [expected]);
    assert(!answer.steps.join(' ').includes(lesson.steps[2].explanation));
    assert.equal(answer.complete, false);
  }
  const simple = prepareCourseQuestion(request(context, { hintLevel: 2, simpler: true }));
  assert.deepEqual(answerCourseOffline(simple.input, simple.cards).steps, [current.prompt]);
});

test('forged source, unknown or out-of-range context, arbitrary fields and private text fail closed', () => {
  for (const value of [null, [], {}, { ...contextFor(), courseId: 'other-course' }, { ...contextFor(), stepIndex: -1 },
    { ...contextFor(), stepIndex: 3 }, { ...contextFor(), stepIndex: 0.5 },
    contextFor('atanasyan-7-9-main-161-part-1'), contextFor('atanasyan-7-9-theory-24-part-1'),
    { ...contextFor(), question: 'browser condition' }, { ...contextFor(), url: 'https://other.example.test' }]) {
    assert.throws(() => cabinet.resolveCourseContext(value)); assert.throws(() => resolveCourseContext(value));
  }
  for (const extra of [{ profileId: 'triangle-congruence' }, { question: 'A forged condition' }, { topic: 'congruence-sas' },
    { courseRevision: 'a'.repeat(64) }, { solution: 'A forged answer' }, { attempt: 'teacher@example.test' },
    { attempt: 'x'.repeat(401) }, { hintLevel: 0 }, { simpler: 'yes' }]) {
    assert.throws(() => prepareCourseQuestion(request(contextFor(), extra)));
  }
  const prepared = prepareCourseQuestion(request());
  assert.throws(() => answerCourseOffline(prepared.input, [{ explanation: 'injected' }]));
  assert.throws(() => buildCabinetMessages(prepared.input, prepared.cards), error => error.code === 'CABINET_COURSE_SOURCE_ONLY');
});
