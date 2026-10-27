import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { exactKeys, requireValue } from './errors.js';
import { containsSensitiveText } from './privacy.js';

export const COURSE_PROFILE = 'atanasyan-first-steps';
export const COURSE_TOPIC = 'atanasyan-course-step';
export const ICHENSKAYA_COURSE = 'ichenskaya-grade7-works';
export const ICHENSKAYA_TOPIC = 'ichenskaya-course-step';
const ATANASYAN_COURSE = 'atanasyan-first-steps';
const ICHENSKAYA_SOURCE_SHA256 = 'f3124410a12eeb8cb79a7282d63b3dc0b106871dc74ded526788ddaee23d877e';
const ICHENSKAYA_MANIFEST_SHA256 = '7076005f4811effc4011d716b405aa20793a7882f5b69fa79cf003d583edc4d5';
const COURSE_SOURCES = Object.freeze({
  [ATANASYAN_COURSE]: Object.freeze({ file: new URL('../knowledge/atanasyan-first-steps.json', import.meta.url),
    topic: COURSE_TOPIC, url: 'https://mathexam.space/geometry-course/first-steps/' }),
  [ICHENSKAYA_COURSE]: Object.freeze({ file: new URL('../knowledge/ichenskaya-grade7-works.json', import.meta.url),
    topic: ICHENSKAYA_TOPIC, url: 'https://mathexam.space/geometry-course/ichenskaya-7-works/' })
});
const sourceCheck = value => requireValue(value, 'CABINET_COURSE_SOURCE_INVALID');

function validateAtanasyanSource(data) {
  // The old source guard remains independent of the companion's inventory.
  sourceCheck(data.schemaVersion === 1 && data.courseId === ATANASYAN_COURSE && data.topic === COURSE_TOPIC
    && /^[a-f0-9]{64}$/.test(data.courseSha256) && data.lessons?.length === 255
    && new Set(data.lessons.map(lesson => lesson.id)).size === 255);
}

function validateIchenskayaSource(data) {
  const raw = readFileSync(new URL('../knowledge/ichenskaya-grade7-works-manifest.json', import.meta.url));
  sourceCheck(createHash('sha256').update(raw).digest('hex') === ICHENSKAYA_MANIFEST_SHA256);
  const manifest = JSON.parse(raw.toString('utf8'));
  sourceCheck(manifest.schemaVersion === 1 && manifest.courseId === ICHENSKAYA_COURSE
    && manifest.source?.sha256 === ICHENSKAYA_SOURCE_SHA256 && manifest.counts?.cards === 110
    && manifest.entries?.length === 110 && new Set(manifest.entries.map(entry => entry.id)).size === 110);
  sourceCheck(data.schemaVersion === 1 && data.courseId === ICHENSKAYA_COURSE && data.topic === ICHENSKAYA_TOPIC
    && /^[a-f0-9]{64}$/.test(data.courseSha256) && data.sourceSha256 === ICHENSKAYA_SOURCE_SHA256
    && data.sourceManifestSha256 === ICHENSKAYA_MANIFEST_SHA256 && data.lessons?.length === 110
    && new Set(data.lessons.map(lesson => lesson.id)).size === 110);
  const expected = new Map(manifest.entries.map(entry => [entry.id, entry]));
  for (const lesson of data.lessons) {
    const entry = expected.get(lesson.id), match = /^ichenskaya-7-(sr|kr)-(\d{2})-v([12])-task-(\d{2})$/.exec(lesson.id);
    sourceCheck(entry && match && lesson.kind === 'exercise' && lesson.source
      && ['bookId', 'collection', 'work', 'variant', 'exercise'].every(key => lesson.source[key] === entry.source[key])
      && JSON.stringify(lesson.source.printedPages) === JSON.stringify(entry.source.printedPages)
      && JSON.stringify(lesson.source.pdfPages) === JSON.stringify(entry.source.pdfPages)
      && Array.isArray(lesson.steps) && lesson.steps.length >= 1 && lesson.steps.length <= 24);
  }
}

const knowledge = new Map();
function source(courseId) {
  if (!knowledge.has(courseId)) {
    sourceCheck(Object.hasOwn(COURSE_SOURCES, courseId));
    const data = JSON.parse(readFileSync(COURSE_SOURCES[courseId].file, 'utf8'));
    if (courseId === ATANASYAN_COURSE) validateAtanasyanSource(data);
    else validateIchenskayaSource(data);
    knowledge.set(courseId, data);
  }
  return knowledge.get(courseId);
}

export function resolveCourseContext(raw) {
  requireValue(exactKeys(raw, ['courseId', 'lessonId', 'stepIndex']) && Object.keys(raw).length === 3
    && typeof raw.courseId === 'string' && Object.hasOwn(COURSE_SOURCES, raw.courseId)
    && typeof raw.lessonId === 'string' && Number.isSafeInteger(raw.stepIndex), 'CABINET_COURSE_INVALID');
  const data = source(raw.courseId), lesson = data.lessons.find(item => item.id === raw.lessonId);
  if (raw.courseId === ATANASYAN_COURSE) {
    const match = /^atanasyan-7-9-(main|theory)-(\d+)-part-(\d+)$/.exec(raw.lessonId);
    requireValue(match && Number(match[2]) >= 1 && Number(match[2]) <= (match[1] === 'main' ? 160 : 23), 'CABINET_COURSE_INVALID');
  }
  requireValue(lesson && raw.stepIndex >= 0 && raw.stepIndex < lesson.steps.length, 'CABINET_COURSE_INVALID');
  return { courseContext: { courseId: raw.courseId, lessonId: lesson.id, stepIndex: raw.stepIndex },
    courseRevision: data.courseSha256, topic: data.topic, question: lesson.question, lesson };
}

export function prepareCourseQuestion(body) {
  const keys = ['profileId', 'topic', 'question', 'attempt', 'mode', 'hintLevel', 'simpler', 'requestId', 'courseContext', 'courseRevision'];
  requireValue(exactKeys(body, keys) && body.profileId === COURSE_PROFILE, 'CABINET_COURSE_INVALID');
  const resolved = resolveCourseContext(body.courseContext);
  requireValue(body.topic === resolved.topic && body.question === resolved.question
    && body.courseRevision === resolved.courseRevision, 'CABINET_COURSE_MISMATCH');
  requireValue(['hint', 'full'].includes(body.mode) && Number.isInteger(body.hintLevel) && body.hintLevel >= 1 && body.hintLevel <= 8
    && typeof body.simpler === 'boolean' && typeof body.attempt === 'string' && body.attempt.length <= 400
    && !/[\u0000-\u0008\u000b-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(body.attempt), 'CABINET_COURSE_INVALID');
  requireValue(!containsSensitiveText(body.attempt), 'PERSONAL_DATA_REJECTED');
  if (body.requestId !== undefined) requireValue(typeof body.requestId === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.requestId), 'REQUEST_ID_INVALID');
  return { input: { profileId: COURSE_PROFILE, topic: resolved.topic, question: resolved.question, attempt: body.attempt.trim(),
    courseContext: resolved.courseContext, courseRevision: resolved.courseRevision,
    mode: body.mode === 'full' ? 'explain' : 'hint', hintLevel: body.hintLevel, simpler: body.simpler,
    ...(body.requestId === undefined ? {} : { requestId: body.requestId }) }, cards: [] };
}

export function answerCourseOffline(input, cards) {
  requireValue(input && ['hint', 'explain'].includes(input.mode) && (cards === undefined || (Array.isArray(cards) && cards.length === 0)), 'CABINET_COURSE_INVALID');
  const safe = prepareCourseQuestion({ ...input, mode: input.mode === 'explain' ? 'full' : 'hint' }).input;
  const { lesson } = resolveCourseContext(safe.courseContext), index = safe.courseContext.stepIndex, step = lesson.steps[index];
  const complete = safe.mode === 'explain';
  let steps;
  if (complete) {
    // Theory 23 has eighteen reviewed steps. Pair them without truncation to
    // stay inside the existing response boundary of at most twelve entries.
    const groupSize = Math.ceil(lesson.steps.length / 12);
    steps = [];
    for (let i = 0; i < lesson.steps.length; i += groupSize) {
      steps.push(lesson.steps.slice(i, i + groupSize).map((item, offset) =>
        `Шаг ${i + offset + 1}. ${item.explanation}${item.reasons.length ? ' Основание: ' + item.reasons.join(' ') : ''}`).join('\n'));
    }
  } else {
    // Asking again never silently advances to another source step or exposes
    // the final result. The caller explicitly chooses the task's current step.
    const hint = safe.hintLevel === 1 ? step.prompt : safe.hintLevel === 2
      ? (step.reasons[0] || step.prompt) : step.explanation;
    steps = [safe.simpler && safe.hintLevel < 3 ? step.prompt : hint];
  }
  requireValue(steps.length <= 12 && steps.every(item => typeof item === 'string' && item.length <= 1500), 'CABINET_COURSE_SOURCE_INVALID');
  const url = `${COURSE_SOURCES[safe.courseContext.courseId].url}#${lesson.id}`;
  return { topic: safe.topic, title: `${lesson.title}${complete ? ' · разбор' : ' · шаг ' + (index + 1)}`,
    text: complete ? 'Это разбор по проверенным материалам курса. Сопоставь его со своим решением.'
      : `Остаёмся на шаге ${index + 1} из ${lesson.steps.length}. ${safe.simpler ? 'Начни с одного действия.' : 'Подсказка относится к выбранной задаче.'}`,
    steps, check: 'Помощь отмечена. Твоё рассуждение проверит преподаватель; открытый разбор не означает, что задача решена самостоятельно.',
    verification: 'curated-guidance', complete, sourceIds: [lesson.id], sources: [{ id: lesson.id, title: lesson.title, url }],
    courseContext: safe.courseContext, courseRevision: safe.courseRevision };
}
