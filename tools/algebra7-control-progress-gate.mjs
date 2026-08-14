import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const trainerPath = path.join(root, 'trainers/algebra-7/control-work.html');
const teacherPath = path.join(root, 'trainers/algebra-7/control-work-teacher.html');
const registryPath = path.join(root, 'trainers/board-compat.json');
const homepagePath = path.join(root, 'index.html');
const catalogPath = path.join(root, 'trainers/index.html');
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

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function sourceMechanicsAnchor(html) {
  const start = html.indexOf("const ri=(a,b)=>");
  const end = html.indexOf("const S={view:'menu'");
  assert.ok(start >= 0 && end > start, 'supplied trainer mechanics anchor must be present');
  return html.slice(start, end);
}

function assertNoUnsafeText(file, text) {
  assert.doesNotMatch(text, /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u, `${file} contains prohibited control or bidi text`);
  assert.doesNotMatch(text, /(?:[A-Za-z]:\\|\/mnt\/data|file:\/\/)/i, `${file} contains an absolute local path`);
}

const trainer = read(trainerPath);
const teacher = read(teacherPath);
const homepage = read(homepagePath);
const catalog = read(catalogPath);
const sitemap = read(sitemapPath);
const manifest = JSON.parse(read(registryPath));

assert.match(trainer, /<title>Контрольная: алгебра, 7 класс — Mathexam\.space<\/title>/);
assert.match(trainer, /href="\.\.\/\.\.\/index\.html"/);
assert.match(trainer, /href="control-work-teacher\.html"/);
assert.match(trainer, /id="progressCard"/);
assert.match(trainer, /startProgressClient\(\);/);
assert.match(trainer, /history\.replaceState\(null,'',url\.pathname\+url\.search\)/);
assert.match(trainer, /Authorization:'Bearer '\+assignmentContext\.studentCode/);
assert.match(trainer, /PRODUCTION_PROGRESS_API='https:\/\/mathexam-board-ladynata\.amvera\.io'/);
assert.match(trainer, /STORAGE_KEY_BASE\+\(assignmentContext\.assignmentId\?'@'\+assignmentContext\.assignmentId:''\)/);
assert.match(trainer, /s1:\{id:'t1-1',line:1\},s4:\{id:'t1-2',line:1\}/);
assert.match(trainer, /s2:\{id:'t2-1',line:2\},s3:\{id:'t2-2',line:2\}/);
assert.match(trainer, /markSkillStarted\(id\);render\(\)/);
assert.match(trainer, /recordCurrentAttempt\(\)/);
assert.match(trainer, /recordCurrentError\(\)/);
assert.match(trainer, /recordCurrentHint\(\)/);
assert.match(trainer, /completeSkill\(S\.prob\.skill,clean\)/);
assert.equal(
  sha256(sourceMechanicsAnchor(trainer)),
  'a67840b0363fb9dd8d19bd594292fec14cded5ee4dc8420f7ac88e9ea987f57a',
  'supplied generators, task content, and guided mechanics changed'
);
for (const generator of ['genSimplify', 'genSystem', 'genGraph', 'genFactor']) {
  assert.equal(count(trainer, `function ${generator}()`), 1, `${generator} must be preserved exactly once`);
}

assert.match(teacher, /<meta name="robots" content="noindex,nofollow">/);
assert.match(teacher, /var PRODUCTION_API = "https:\/\/mathexam-board-ladynata\.amvera\.io"/);
assert.match(teacher, /var TRAINER_ID = "algebra7-control"/);
assert.match(teacher, /headers\.Authorization="Bearer "\+options\.teacherCode/);
assert.match(teacher, /searchParams\.set\("workspace",workspaceId\)/);
assert.match(teacher, /url\.hash="student="\+encodeURIComponent\(studentCode\)/);
assert.match(teacher, /Панель никогда не принимает код из query или fragment/);
assert.match(teacher, /initialUrl\.searchParams\.delete\(key\)/);
assert.match(teacher, /тем начато/);
assert.match(teacher, /тем пройдено/);
assert.match(teacher, /Упрощение выражений/);
assert.match(teacher, /Разложение на множители/);
assert.match(teacher, /Система уравнений/);
assert.match(teacher, /График функции/);
assert.match(teacher, /самостоятельно/);
assert.match(teacher, /с подсказками/);
assert.match(teacher, /попытки/);
assert.match(teacher, /ошибки/);
assert.match(teacher, /Последняя активность/);

for (const [file, html] of [[trainerPath, trainer], [teacherPath, teacher]]) {
  assertNoUnsafeText(path.relative(root, file), html);
  const scripts = inlineScripts(html);
  assert.equal(scripts.length, 1, `${file} must have exactly one inline script`);
  assert.doesNotThrow(() => new Function(scripts[0]), `${file} inline script must parse`);
  assert.doesNotMatch(html, /<script[^>]+src=/i, `${file} must not load executable code from another origin`);
  const origins = [...html.matchAll(/https?:\/\/[^\s"'<>\\]+/g)].map(match => match[0]);
  assert.equal(origins.every(value =>
    value.startsWith('http://www.w3.org/')
      || value.startsWith('http://127.0.0.1:3000')
      || value.startsWith('https://mathexam-board-ladynata.amvera.io')
      || value.startsWith('https://fonts.googleapis.com')
      || value.startsWith('https://fonts.gstatic.com')
  ), true, `${file} has an undeclared external origin`);
}

const entry = manifest.trainers.find(item => item.trainerId === 'algebra7-control');
assert.ok(entry, 'registry entry is missing');
assert.deepEqual(entry, {
  trainerId: 'algebra7-control',
  file: 'trainers/algebra-7/control-work.html',
  title: 'Алгебра, 7 класс: контрольная по выражениям и графику',
  group: 'Алгебра / 7 класс',
  boardCompatibility: 'opens-in-board',
  supportsSeed: false,
  supportsBoardMirror: false,
  supportsSemanticEvents: false,
  supportsProgressTracking: true,
  progressSchemaVersion: 1,
  notes: 'Открывается в iframe доски; персональный прогресс по четырём темам синхронизируется через Progress Workspaces API v1, mirror не подключён.'
});
assert.equal(manifest.trainers.filter(item => item.trainerId === 'algebra7-control').length, 1);

const runtimeRegistry = loadTrainerRegistry({ env: { TRAINER_REGISTRY_PATH: registryPath } });
assert.equal(runtimeRegistry.loaded, true, runtimeRegistry.error || 'registry must load');
assert.equal(runtimeRegistry.allowsProgress('algebra7-control'), true);
assert.deepEqual(runtimeRegistry.getProgressById('algebra7-control'), {
  trainerId: 'algebra7-control',
  file: 'trainers/algebra-7/control-work.html',
  progressSchemaVersion: 1
});
assert.equal(runtimeRegistry.getById('algebra7-control'), null, 'progress opt-in must not create Board mirror authority');

const canonicalPath = '/trainers/algebra-7/control-work.html';
const canonicalUrl = `https://mathexam.space${canonicalPath}`;
assert.equal(count(homepage, '<!-- algebra7-control:start -->'), 1);
assert.equal(count(homepage, '<!-- algebra7-control:end -->'), 1);
assert.equal(count(homepage, `href="${canonicalPath}"`), 2);
assert.equal(count(catalog, "'./algebra-7/control-work.html'"), 1);
assert.equal(count(sitemap, `<loc>${canonicalUrl}</loc>`), 1);
assert.equal(count(sitemap, 'control-work-teacher.html'), 0, 'teacher panel must stay out of sitemap');

console.log('ALGEBRA7_CONTROL_PROGRESS_V1_AUTHORING_CHECK_OK');
