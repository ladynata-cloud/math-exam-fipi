'use strict';

// The pupil supplies identifiers only. Conditions and explanations are resolved
// from the reviewed, bounded public course, never from a browser payload.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { requireValue } = require('./learning-auth');
// One persisted pupil profile serves exactly the two reviewed source courses.
// Its historical ID stays stable; it is not the request's course identifier.
const SOURCE_PROFILE_ID = 'atanasyan-first-steps';
const COURSE_ID = 'atanasyan-first-steps';
const TOPIC = 'atanasyan-course-step';
const COURSE_FILE = path.join(__dirname, '../learning/atanasyan-first-steps/course.json');
const ICHENSKAYA_COURSE_ID = 'ichenskaya-grade7-works';
const ICHENSKAYA_TOPIC = 'ichenskaya-course-step';
const ICHENSKAYA_SOURCE_SHA256 = 'f3124410a12eeb8cb79a7282d63b3dc0b106871dc74ded526788ddaee23d877e';
const ICHENSKAYA_MANIFEST_SHA256 = '7076005f4811effc4011d716b405aa20793a7882f5b69fa79cf003d583edc4d5';
const ICHENSKAYA_MANIFEST_FILE = path.join(__dirname, '../learning/ichenskaya-grade7-works/source-manifest.json');
const COURSE_SOURCES = Object.freeze({
  [COURSE_ID]: Object.freeze({ file: COURSE_FILE, topic: TOPIC }),
  [ICHENSKAYA_COURSE_ID]: Object.freeze({ file: path.join(__dirname, '../learning/ichenskaya-grade7-works/course.json'), topic: ICHENSKAYA_TOPIC })
});
const plain = value => value && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const text = (value, maximum) => typeof value === 'string' && value.length > 0 && value.length <= maximum
  && !/[\u0000-\u0008\u000b-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(value)
  && !/<\/?[a-z][^>]*>/iu.test(value);
const check = value => requireValue(value, 'LEARNING_ASSISTANT_COURSE_INVALID');

function projectAtanasyanCourse(course, courseSha256) {
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

let ichenskayaManifest;
function sourceManifest() {
  if (!ichenskayaManifest) {
    const raw = fs.readFileSync(ICHENSKAYA_MANIFEST_FILE);
    check(crypto.createHash('sha256').update(raw).digest('hex') === ICHENSKAYA_MANIFEST_SHA256);
    const data = JSON.parse(raw.toString('utf8'));
    check(data.schemaVersion === 1 && data.courseId === ICHENSKAYA_COURSE_ID
      && data.source?.sha256 === ICHENSKAYA_SOURCE_SHA256 && data.counts?.cards === 110
      && data.entries?.length === 110 && new Set(data.entries.map(entry => entry.id)).size === 110);
    ichenskayaManifest = data;
  }
  return ichenskayaManifest;
}

function projectIchenskayaCourse(course, courseSha256) {
  const manifest = sourceManifest(), expected = new Map(manifest.entries.map(entry => [entry.id, entry]));
  check(course?.id === ICHENSKAYA_COURSE_ID && course.schemaVersion === 1 && /^[a-f0-9]{64}$/.test(courseSha256)
    && course.source?.sha256 === ICHENSKAYA_SOURCE_SHA256 && course.source.bookSha256 === ICHENSKAYA_SOURCE_SHA256
    && course.source.manifestSha256 === ICHENSKAYA_MANIFEST_SHA256 && course.lessons?.length === 110);
  const seen = new Set();
  const lessons = course.lessons.map(lesson => {
    const match = /^ichenskaya-7-(sr|kr)-(\d{2})-v([12])-task-(\d{2})$/.exec(lesson.id), entry = expected.get(lesson.id);
    check(match && entry && !seen.has(lesson.id) && lesson.kind === 'exercise' && lesson.status === 'reviewed'
      && ['source', 'mathematics', 'pedagogy'].every(key => lesson.review?.[key] === 'passed'));
    seen.add(lesson.id);
    const source = lesson.source;
    check(source && source.bookId === 'ichenskaya-2018-geometry-7'
      && source.collection === match[1] && source.work === Number(match[2])
      && source.variant === Number(match[3]) && source.exercise === String(Number(match[4]))
      && ['bookId', 'collection', 'work', 'variant', 'exercise'].every(key => source[key] === entry.source[key])
      && JSON.stringify(source.printedPages) === JSON.stringify(entry.source.printedPages)
      && JSON.stringify(source.pdfPages) === JSON.stringify(entry.source.pdfPages));
    const question = lesson.statement?.text;
    check(text(lesson.title, 200) && text(question, 1000) && Array.isArray(lesson.steps)
      && lesson.steps.length >= 1 && lesson.steps.length <= 24);
    const steps = lesson.steps.map(step => {
      check(text(step.prompt, 600) && text(step.explanation, 1200) && Array.isArray(step.justifications));
      const reasons = step.justifications.map(reason => { check(text(reason.text, 600)); return reason.text; });
      check(reasons.length <= 6);
      return { prompt: step.prompt, explanation: step.explanation, reasons };
    });
    return { id: lesson.id, title: lesson.title, kind: lesson.kind, question, steps,
      source: { bookId: source.bookId, collection: source.collection, work: source.work, variant: source.variant,
        exercise: source.exercise, printedPages: source.printedPages, pdfPages: source.pdfPages } };
  });
  return { schemaVersion: 1, courseId: ICHENSKAYA_COURSE_ID, topic: ICHENSKAYA_TOPIC, courseSha256,
    sourceSha256: ICHENSKAYA_SOURCE_SHA256, sourceManifestSha256: ICHENSKAYA_MANIFEST_SHA256, lessons };
}

function projectCourse(course, courseSha256) {
  if (course?.id === COURSE_ID) return projectAtanasyanCourse(course, courseSha256);
  if (course?.id === ICHENSKAYA_COURSE_ID) return projectIchenskayaCourse(course, courseSha256);
  check(false);
}

const cache = new Map();
function courseKnowledge(courseId) {
  if (!cache.has(courseId)) {
    check(Object.hasOwn(COURSE_SOURCES, courseId));
    const raw = fs.readFileSync(COURSE_SOURCES[courseId].file);
    const data = JSON.parse(raw.toString('utf8'));
    check(data.id === courseId);
    cache.set(courseId, projectCourse(data, crypto.createHash('sha256').update(raw).digest('hex')));
  }
  return cache.get(courseId);
}

function resolveCourseContext(raw) {
  check(plain(raw) && Object.keys(raw).length === 3
    && ['courseId', 'lessonId', 'stepIndex'].every(key => Object.hasOwn(raw, key))
    && typeof raw.courseId === 'string' && Object.hasOwn(COURSE_SOURCES, raw.courseId)
    && typeof raw.lessonId === 'string' && Number.isSafeInteger(raw.stepIndex));
  const knowledge = courseKnowledge(raw.courseId), lesson = knowledge.lessons.find(item => item.id === raw.lessonId);
  // This validates a source step, not a claim of server-verified local progress.
  check(lesson && raw.stepIndex >= 0 && raw.stepIndex < lesson.steps.length);
  return { courseContext: { courseId: raw.courseId, lessonId: lesson.id, stepIndex: raw.stepIndex },
    courseRevision: knowledge.courseSha256, topic: knowledge.topic, question: lesson.question, title: lesson.title,
    stepCount: lesson.steps.length };
}

module.exports = { SOURCE_PROFILE_ID, COURSE_ID, TOPIC, COURSE_FILE, COURSE_SOURCES,
  ICHENSKAYA_COURSE_ID, ICHENSKAYA_TOPIC, ICHENSKAYA_MANIFEST_FILE, ICHENSKAYA_MANIFEST_SHA256,
  projectCourse, resolveCourseContext };
