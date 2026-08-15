import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const studentPath = 'trainers/dvi/math-18-20.html';
const studioPath = 'trainers/dvi/math-18-20-video-studio.html';
const teacherPath = 'trainers/dvi/math-18-20-teacher.html';
const student = fs.readFileSync(studentPath, 'utf8');
const studio = fs.readFileSync(studioPath, 'utf8');
const teacher = fs.readFileSync(teacherPath, 'utf8');
const homepage = fs.readFileSync('index.html', 'utf8');
const catalog = fs.readFileSync('trainers/index.html', 'utf8');
const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
const manifest = JSON.parse(fs.readFileSync('trainers/board-compat.json', 'utf8'));

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function learningAnchor(html) {
  const start = html.indexOf('var ri = function');
  const end = html.indexOf('/* ================= сценарий озвучки ================= */');
  assert.ok(start >= 0 && end > start, 'learning-generator anchor must be present');
  return html.slice(start, end).replace(/\r\n/g, '\n');
}

function inlineScripts(html) {
  return [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
}

for (const [label, html] of [['student', student], ['studio', studio], ['teacher', teacher]]) {
  const scripts = inlineScripts(html);
  assert.equal(scripts.length, 1, `${label} must contain one inline script`);
  assert.doesNotThrow(() => new Function(scripts[0]), `${label} inline script must parse`);
  assert.doesNotMatch(html, /C:\\Users\\|\/mnt\/data\//, `${label} must not expose machine paths`);
}

assert.equal(
  sha256(learningAnchor(student)),
  'b2f76a901f94a89563707ed0e704c37f96b130ce63b72f986c46fe60615826e7',
  'student generator and learning content must match the supplied source'
);
assert.equal(
  sha256(learningAnchor(studio)),
  '9d85045fb572da6e3599d0fc2682197d7d6df72359115748a9044e8a94550668',
  'video-studio generator and learning content must match the supplied source'
);

for (const marker of [
  '18 · Тригонометрия',
  '19 · Система с log',
  '20 · Пирамида',
  'function gen18(',
  'function gen19(',
  'function gen20(',
  "var DVI_TRAINER_ID='dvi-math-18-20'",
  "t18:{id:'t1-18',line:1}",
  "t19:{id:'t1-19',line:1}",
  "t20:{id:'t2-20',line:2}",
  'history.replaceState(null,\'\',url.pathname+url.search)',
  "Authorization:'Bearer '+dviAssignment.studentCode",
  'dviRecordAttempt(topicKey)',
  'dviRecordError(topicKey)',
  'dviRecordHint(topicKey)',
  "if(!auto&&!finishedRecorded){dviCompleteTopic(topicKey,errs===0&&!usedHelp)",
  'math-18-20-video-studio.html',
  'math-18-20-teacher.html'
]) assert.ok(student.includes(marker), `student marker missing: ${marker}`);

assert.match(student, /DVI_STORAGE_KEY\+\(dviAssignment\.assignmentId\?'@'\+dviAssignment\.assignmentId:''\)/);
assert.doesNotMatch(student, /searchParams\.set\(['"](?:student|code|token|access)/);
assert.match(studio, /<body class="studio">/);
assert.match(studio, /window\.MathExamVideoStudio=\{/);
assert.match(studio, /window\.__MATH_EXAM_VIDEO_READY__=true/);
assert.match(studio, /Автопоказ не записывается в прогресс ученика/);
assert.doesNotMatch(studio, /DVI_TRAINER_ID|\/api\/progress\/assignments/);

for (const marker of [
  'var TRAINER_ID = "dvi-math-18-20"',
  'new URL("math-18-20.html",window.location.href)',
  'url.hash="student="+encodeURIComponent(studentCode)',
  'url.searchParams.set("workspace",workspaceId)',
  'topicBox("t1-18","Задача 18 · Тригонометрия"',
  'topicBox("t1-19","Задача 19 · Система с log"',
  'topicBox("t2-20","Задача 20 · Пирамида"',
  'лучший результат: "+(drill.best||0)+" / 3',
  'math-18-20-video-studio.html'
]) assert.ok(teacher.includes(marker), `teacher marker missing: ${marker}`);
assert.doesNotMatch(teacher, /searchParams\.set\(['"](?:teacher|teacherCode|code|token|access)/);

const studentEntry = manifest.trainers.find(entry => entry.trainerId === 'dvi-math-18-20');
assert.deepEqual(studentEntry && {
  file: studentEntry.file,
  progress: studentEntry.supportsProgressTracking,
  schema: studentEntry.progressSchemaVersion,
  mirror: studentEntry.supportsBoardMirror
}, {
  file: studentPath,
  progress: true,
  schema: 1,
  mirror: false
});
const studioEntry = manifest.trainers.find(entry => entry.trainerId === 'dvi-math-18-20-video-studio');
assert.deepEqual(studioEntry && {
  file: studioEntry.file,
  progress: !!studioEntry.supportsProgressTracking,
  mirror: studioEntry.supportsBoardMirror
}, {
  file: studioPath,
  progress: false,
  mirror: false
});

assert.match(homepage, /href="\/trainers\/dvi\/math-18-20\.html"/);
assert.match(catalog, /\.\/dvi\/math-18-20\.html/);
assert.match(catalog, /\.\/dvi\/math-18-20-video-studio\.html/);
assert.match(sitemap, /https:\/\/mathexam\.space\/trainers\/dvi\/math-18-20\.html/);
assert.match(sitemap, /https:\/\/mathexam\.space\/trainers\/dvi\/math-18-20-video-studio\.html/);

console.log('DVI_MATH_18_20_PROGRESS_V1_AUTHORING_CHECK_OK');
