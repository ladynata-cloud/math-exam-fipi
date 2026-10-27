'use strict';

// The pupil supplies identifiers only. Conditions and explanations are resolved
// from the reviewed, bounded public course, never from a browser payload.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { requireValue } = require('./learning-auth');
const COURSE_ID = 'atanasyan-first-steps';
const TOPIC = 'atanasyan-course-step';
const COURSE_FILE = path.join(__dirname, '../learning/atanasyan-first-steps/course.json');
const plain = value => value && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const text = (value, maximum) => typeof value === 'string' && value.length > 0 && value.length <= maximum
  && !/[\u0000-\u0008\u000b-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(value)
  && !/<\/?[a-z][^>]*>/iu.test(value);
const check = value => requireValue(value, 'LEARNING_ASSISTANT_COURSE_INVALID');

function projectCourse(course, courseSha256) {
  check(course?.id === COURSE_ID && course.schemaVersion === 1 && /^[a-f0-9]{64}$/.test(courseSha256)
    && /^[a-f0-9]{64}$/.test(course.source?.sha256) && course.lessons?.length === 255);
  const seen = new Set();
  const lessons = course.lessons.map(lesson => {
    const match = /^atanasyan-7-9-(main|theory)-(\d+)-part-(\d+)$/.exec(lesson.id);
    check(match && !seen.has(lesson.id) && Number(match[2]) >= 1
      && Number(match[2]) <= (match[1] === 'main' ? 160 : 23)
      && lesson.kind === (match[1] === 'main' ? 'exercise' : 'theory')
      && lesson.status === 'reviewed' && ['source', 'mathematics', 'pedagogy'].every(key => lesson.review?.[key] === 'passed'));
    seen.add(lesson.id);
    const question = course.displayOverrides?.[lesson.id]?.statementText || lesson.statement?.text;
    check(text(lesson.title, 200) && text(question, 1000) && Array.isArray(lesson.steps)
      && lesson.steps.length >= 1 && lesson.steps.length <= 24);
    const steps = lesson.steps.map(step => {
      check(text(step.prompt, 600) && text(step.explanation, 1200) && Array.isArray(step.justifications));
      const reasons = step.justifications.map(reason => {
        check(text(reason.text, 600)); return reason.text;
      });
      check(reasons.length <= 6);
      return { prompt: step.prompt, explanation: step.explanation, reasons };
    });
    return { id: lesson.id, title: lesson.title, kind: lesson.kind, question, steps,
      source: { bookId: lesson.source.bookId, printedPages: lesson.source.printedPages,
        ...(lesson.kind === 'exercise' ? { exercise: lesson.source.exercise, subpart: lesson.source.subpart || '' }
          : { point: lesson.source.point }) } };
  });
  return { schemaVersion: 1, courseId: COURSE_ID, topic: TOPIC, courseSha256,
    sourceSha256: course.source.sha256, lessons };
}

let cached;
function courseKnowledge() {
  if (!cached) {
    const raw = fs.readFileSync(COURSE_FILE);
    cached = projectCourse(JSON.parse(raw.toString('utf8')), crypto.createHash('sha256').update(raw).digest('hex'));
  }
  return cached;
}

function resolveCourseContext(raw) {
  check(plain(raw) && Object.keys(raw).length === 3
    && ['courseId', 'lessonId', 'stepIndex'].every(key => Object.hasOwn(raw, key))
    && raw.courseId === COURSE_ID && typeof raw.lessonId === 'string' && Number.isSafeInteger(raw.stepIndex));
  const knowledge = courseKnowledge(), lesson = knowledge.lessons.find(item => item.id === raw.lessonId);
  // This validates a source step, not a claim of server-verified local progress.
  check(lesson && raw.stepIndex >= 0 && raw.stepIndex < lesson.steps.length);
  return { courseContext: { courseId: COURSE_ID, lessonId: lesson.id, stepIndex: raw.stepIndex },
    courseRevision: knowledge.courseSha256, topic: TOPIC, question: lesson.question, title: lesson.title,
    stepCount: lesson.steps.length };
}

module.exports = { COURSE_ID, TOPIC, COURSE_FILE, projectCourse, resolveCourseContext };
