import { readFileSync } from 'node:fs';
import { exactKeys, requireValue } from './errors.js';
import { containsSensitiveText } from './privacy.js';

export const COURSE_PROFILE = 'atanasyan-first-steps';
export const COURSE_TOPIC = 'atanasyan-course-step';
const COURSE_FILE = new URL('../knowledge/atanasyan-first-steps.json', import.meta.url);
let knowledge;
function source() {
  if (!knowledge) {
    const data = JSON.parse(readFileSync(COURSE_FILE, 'utf8'));
    requireValue(data.schemaVersion === 1 && data.courseId === COURSE_PROFILE && data.topic === COURSE_TOPIC
      && /^[a-f0-9]{64}$/.test(data.courseSha256) && data.lessons?.length === 255
      && new Set(data.lessons.map(lesson => lesson.id)).size === 255, 'CABINET_COURSE_SOURCE_INVALID');
    knowledge = data;
  }
  return knowledge;
}

export function resolveCourseContext(raw) {
  requireValue(exactKeys(raw, ['courseId', 'lessonId', 'stepIndex']) && Object.keys(raw).length === 3
    && raw.courseId === COURSE_PROFILE && typeof raw.lessonId === 'string' && Number.isSafeInteger(raw.stepIndex), 'CABINET_COURSE_INVALID');
  const data = source(), lesson = data.lessons.find(item => item.id === raw.lessonId);
  const match = /^atanasyan-7-9-(main|theory)-(\d+)-part-(\d+)$/.exec(raw.lessonId);
  requireValue(lesson && match && Number(match[2]) >= 1 && Number(match[2]) <= (match[1] === 'main' ? 160 : 23)
    && raw.stepIndex >= 0 && raw.stepIndex < lesson.steps.length, 'CABINET_COURSE_INVALID');
  return { courseContext: { courseId: COURSE_PROFILE, lessonId: lesson.id, stepIndex: raw.stepIndex },
    courseRevision: data.courseSha256, topic: COURSE_TOPIC, question: lesson.question, lesson };
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
  const url = `https://mathexam.space/geometry-course/first-steps/#${lesson.id}`;
  return { topic: COURSE_TOPIC, title: `${lesson.title}${complete ? ' · разбор' : ' · шаг ' + (index + 1)}`,
    text: complete ? 'Это разбор по проверенным материалам курса. Сопоставь его со своим решением.'
      : `Остаёмся на шаге ${index + 1} из ${lesson.steps.length}. ${safe.simpler ? 'Начни с одного действия.' : 'Подсказка относится к выбранной задаче.'}`,
    steps, check: 'Помощь отмечена. Твоё рассуждение проверит преподаватель; открытый разбор не означает, что задача решена самостоятельно.',
    verification: 'curated-guidance', complete, sourceIds: [lesson.id], sources: [{ id: lesson.id, title: lesson.title, url }],
    courseContext: safe.courseContext, courseRevision: safe.courseRevision };
}
