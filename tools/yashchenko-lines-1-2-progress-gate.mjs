import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const trainerPath = path.join(root, 'trainers/ege-profile/yashchenko-lines-1-2.html');
const teacherPath = path.join(root, 'trainers/ege-profile/yashchenko-lines-1-2-teacher.html');
const registryPath = path.join(root, 'trainers/board-compat.json');
const homepagePath = path.join(root, 'index.html');
const sitemapPath = path.join(root, 'sitemap.xml');
const require = createRequire(import.meta.url);
const { loadTrainerRegistry } = require('../board-server/trainer-registry.js');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function count(text, needle) {
  return text.split(needle).length - 1;
}

function inlineScripts(html) {
  return [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
}

function taskPayload(html) {
  const match = html.match(/var TASKS = (\[[\s\S]*?\]);\r?\nvar TID/);
  assert.ok(match, 'trainer must contain one parseable TASKS payload');
  return match[1];
}

function assertNoUnsafeText(file, text) {
  assert.doesNotMatch(text, /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u, `${file} contains prohibited control or bidi text`);
  assert.doesNotMatch(text, /(?:[A-Za-z]:\\|\/mnt\/data|file:\/\/)/i, `${file} contains an absolute local path`);
}

const trainer = read(trainerPath);
const teacher = read(teacherPath);
const homepage = read(homepagePath);
const sitemap = read(sitemapPath);
const manifest = JSON.parse(read(registryPath));

assert.match(trainer, /<title>Задания 1 и 2 · 36 вариантов Ященко — Mathexam\.space<\/title>/);
assert.match(trainer, /href="\.\.\/\.\.\/index\.html"/);
assert.match(trainer, /id="progressCard"/);
assert.match(trainer, /startProgressClient\(\);/);
assert.match(trainer, /history\.replaceState\(null, "", url\.pathname \+ url\.search\)/);
assert.match(trainer, /headers = \{Authorization:"Bearer " \+ assignmentContext\.studentCode\}/);
assert.match(trainer, /PRODUCTION_PROGRESS_API = "https:\/\/mathexam-board-ladynata\.amvera\.io"/);
assert.match(trainer, /storageTopicId\(\)[\s\S]*TID \+ "@" \+ assignmentContext\.assignmentId/);
assert.match(trainer, /saveTaskActivity\(key, \{attempts:1, errors:correct \? 0 : 1\}\)/);
assert.match(trainer, /saveTaskActivity\(key, \{hints:1\}\)/);

const payload = taskPayload(trainer);
const payloadHash = crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
assert.equal(payloadHash, '5bca2f9fb0fed87f57bf1063674a6da7605abc3ed32f8bb0c068137f4fd6e390', 'task corpus changed from the supplied source');
const tasks = JSON.parse(payload);
assert.equal(tasks.length, 72);
assert.equal(tasks.filter(task => task.line === 1).length, 36);
assert.equal(tasks.filter(task => task.line === 2).length, 36);
assert.equal(new Set(tasks.map(task => `t${task.line}-${task.n}`)).size, 72, 'task IDs must be unique');
assert.equal(tasks.every(task => typeof task.ans === 'string' && task.ans.length > 0), true);
assert.equal(tasks.every(task => Array.isArray(task.steps) && task.steps.length > 0), true);

assert.match(teacher, /<meta name="robots" content="noindex,nofollow">/);
assert.match(teacher, /var PRODUCTION_API = "https:\/\/mathexam-board-ladynata\.amvera\.io"/);
assert.match(teacher, /headers\.Authorization="Bearer "\+options\.teacherCode/);
assert.match(teacher, /searchParams\.set\("workspace",workspaceId\)/);
assert.match(teacher, /url\.hash="student="\+encodeURIComponent\(studentCode\)/);
assert.match(teacher, /Панель никогда не принимает код из query или fragment/);
assert.match(teacher, /initialUrl\.searchParams\.delete\(key\)/);
assert.match(teacher, /started|начато/);
assert.match(teacher, /solved|решено/);
assert.match(teacher, /самостоятельно/);
assert.match(teacher, /с подсказками/);
assert.match(teacher, /попытки/);
assert.match(teacher, /ошибки/);
assert.match(teacher, /Линия /);
assert.match(teacher, /лучший зачёт/);
assert.match(teacher, /Последняя активность/);

for (const [file, html] of [[trainerPath, trainer], [teacherPath, teacher]]) {
  assertNoUnsafeText(path.relative(root, file), html);
  const scripts = inlineScripts(html);
  assert.equal(scripts.length, 1, `${file} must have exactly one inline script`);
  assert.doesNotThrow(() => new Function(scripts[0]), `${file} inline script must parse`);
  assert.doesNotMatch(html, /<script[^>]+src=|<link[^>]+rel=["']stylesheet/i, `${file} must remain self-contained`);
  const origins = [...html.matchAll(/https?:\/\/[^\s"'<>\\]+/g)].map(match => match[0]);
  assert.equal(origins.every(value => value.startsWith('http://www.w3.org/') || value.startsWith('http://127.0.0.1:3000') || value.startsWith('https://mathexam-board-ladynata.amvera.io')), true, `${file} has an undeclared external origin`);
}

const entry = manifest.trainers.find(item => item.trainerId === 'yashchenko-t12');
assert.ok(entry, 'registry entry is missing');
assert.deepEqual(entry, {
  trainerId: 'yashchenko-t12',
  file: 'trainers/ege-profile/yashchenko-lines-1-2.html',
  title: 'ЕГЭ №1–2: 36 вариантов Ященко',
  group: 'Геометрия / ЕГЭ',
  boardCompatibility: 'opens-in-board',
  supportsSeed: false,
  supportsBoardMirror: false,
  supportsSemanticEvents: false,
  supportsProgressTracking: true,
  progressSchemaVersion: 1,
  notes: 'Открывается в iframe доски; персональный прогресс синхронизируется через Progress Workspaces API v1, mirror не подключён.'
});
assert.equal(manifest.trainers.filter(item => item.trainerId === 'yashchenko-t12').length, 1);

const runtimeRegistry = loadTrainerRegistry({ env: { TRAINER_REGISTRY_PATH: registryPath } });
assert.equal(runtimeRegistry.loaded, true, runtimeRegistry.error || 'registry must load');
assert.equal(runtimeRegistry.allowsProgress('yashchenko-t12'), true);
assert.deepEqual(runtimeRegistry.getProgressById('yashchenko-t12'), {
  trainerId: 'yashchenko-t12',
  file: 'trainers/ege-profile/yashchenko-lines-1-2.html',
  progressSchemaVersion: 1
});
assert.equal(runtimeRegistry.getById('yashchenko-t12'), null, 'progress opt-in must not create Board mirror authority');

const canonicalPath = '/trainers/ege-profile/yashchenko-lines-1-2.html';
const canonicalUrl = `https://mathexam.space${canonicalPath}`;
assert.equal(count(homepage, '<!-- yashchenko-lines-1-2:start -->'), 1);
assert.equal(count(homepage, '<!-- yashchenko-lines-1-2:end -->'), 1);
assert.equal(count(homepage, `href="${canonicalPath}"`), 2);
assert.equal(count(sitemap, `<loc>${canonicalUrl}</loc>`), 1);
assert.equal(count(sitemap, 'yashchenko-lines-1-2-teacher.html'), 0, 'teacher panel must stay out of sitemap');

console.log('YASHCHENKO_LINES_1_2_PROGRESS_V1_AUTHORING_CHECK_OK');
