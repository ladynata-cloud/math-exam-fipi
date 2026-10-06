'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const directory = path.join(root, 'ege-profil/atanasyan-10-11');
const textbook = require('../stereo-course/data/textbook.json');
const workshop = require('../stereo-course/data/course.json');
const context = { window: {} };
for (const file of ['lessons-a.js', 'lessons-b.js', 'lessons.js']) {
  vm.runInNewContext(fs.readFileSync(path.join(directory, file), 'utf8'), context, { filename: file });
}
const { lessons, families } = JSON.parse(JSON.stringify(context.window.AtanasyanCourse));
const authored = [...require('../ege-profil/atanasyan-10-11/lessons-a.js'), ...require('../ege-profil/atanasyan-10-11/lessons-b.js')];
const unique = (values, label) => assert.equal(new Set(values).size, values.length, label);
assert.equal(lessons.length, 12);
assert.equal(families.length, 6);
for (const key of ['id', 'storageKey', 'trainerId', 'reportName']) unique(lessons.map(lesson => lesson[key]), key);
const points = new Map(textbook.topics.map(topic => [topic.point, topic]));
const units = new Map(workshop.units.map(unit => [unit.id, unit]));
let stepCount = 0, fieldCount = 0, modelViews = 0;
for (const family of families) assert.equal(lessons.filter(lesson => lesson.family === family.id).length, 2, family.id);
for (const lesson of lessons) {
  const original = authored.find(item => item.id === lesson.id);
  for (const key of Object.keys(original)) assert.deepEqual(lesson[key], original[key], lesson.id + ': browser/CommonJS parity of ' + key);
  assert.equal(lesson.storageKey, 'mathexam.atanasyan15.' + lesson.id + '.v1');
  assert.equal(lesson.reportPath, 'lesson.html?lesson=' + lesson.id);
  assert.equal(lesson.apiName, '__atanasyanLesson');
  assert.equal(lesson.domainStepIndex, -1);
  for (const key of ['title', 'problemHtml', 'reportProblem', 'reportAnswer', 'answerHtml']) assert.ok(typeof lesson[key] === 'string' && lesson[key].trim(), lesson.id + '.' + key);
  assert.ok(lesson.problemHtml.includes('а)') && lesson.problemHtml.includes('б)'), lesson.id + ': proof and computation');
  assert.ok(lesson.bookPoints.length && lesson.unitIds.length);
  unique(lesson.bookPoints, lesson.id + ': textbook points');
  unique(lesson.unitIds, lesson.id + ': workshop units');
  const linkedPoints = new Set();
  for (const id of lesson.unitIds) {
    const unit = units.get(id);
    assert.ok(unit, lesson.id + ': unknown workshop unit ' + id);
    for (const source of unit.source) {
      const topic = points.get(source.point);
      assert.deepEqual(source, topic, id + ': source point/page must match the verified textbook map');
      assert.ok(Number.isInteger(source.page) && source.page > 0);
      linkedPoints.add(source.point);
    }
  }
  for (const point of lesson.bookPoints) {
    assert.ok(points.has(point), lesson.id + ': unknown textbook point ' + point);
    assert.ok(linkedPoints.has(point), lesson.id + ': textbook point lacks linked workshop unit ' + point);
  }
  assert.ok(lesson.steps.length >= 7 && lesson.steps.length <= 12, lesson.id + ': bounded sequence');
  const phases = lesson.steps.map(step => step.phase);
  assert.ok(phases.includes('а) Доказательство') && phases.includes('б) Вычисление'));
  let computation = false;
  const fieldIds = [];
  for (const step of lesson.steps) {
    stepCount++;
    for (const key of ['title', 'body', 'hint', 'record', 'modelView']) assert.ok(typeof step[key] === 'string' && step[key].trim(), lesson.id + ': missing ' + key);
    assert.ok(['а) Доказательство', 'б) Вычисление'].includes(step.phase));
    if (step.phase === 'б) Вычисление') computation = true;
    if (computation) assert.equal(step.phase, 'б) Вычисление', lesson.id + ': proof must precede computation');
    assert.ok(lesson.model.views[step.modelView], lesson.id + ': unknown model view ' + step.modelView);
    assert.equal(step.fields.length, 1, lesson.id + ': exactly one current question');
    assert.doesNotMatch(step.hint, /<[^>]+>/, 'hints render as plain text');
    for (const field of step.fields) {
      fieldCount++;
      fieldIds.push(field.id);
      assert.match(field.id, /^[a-z][a-z0-9-]*$/);
      assert.ok(field.label && typeof field.correct === 'string');
      if (field.kind === 'number') {
        assert.match(field.correct, /^-?\d+(?:\.\d+)?$/, lesson.id + ': numeric answers supported by the shared runtime');
        assert.ok(Number.isFinite(Number(field.correct)));
      } else {
        assert.equal(field.kind, 'choice');
        assert.ok(field.options.length >= 3);
        unique(field.options.map(option => option.id), lesson.id + '/' + field.id + ': choices');
        assert.equal(field.options.filter(option => option.id === field.correct).length, 1);
        assert.ok(field.options.every(option => typeof option.html === 'string' && option.html.trim()));
      }
    }
  }
  unique(fieldIds, lesson.id + ': question IDs');
  const model = lesson.model;
  assert.ok(model.views.neutral);
  for (const [name, coordinates] of Object.entries(model.points)) {
    assert.equal(coordinates.length, 3, lesson.id + ': point ' + name);
    assert.ok(coordinates.every(Number.isFinite));
  }
  function reference(names, minimum, label) {
    assert.ok(Array.isArray(names) && names.length >= minimum, lesson.id + ': ' + label);
    unique(names, lesson.id + ': repeated point in ' + label);
    for (const name of names) assert.ok(Object.hasOwn(model.points, name), lesson.id + ': unknown model point ' + name);
  }
  for (const edge of model.edges) {
    reference(edge, 2, 'edge');
    assert.equal(edge.length, 2);
    assert.ok(Math.hypot(...model.points[edge[0]].map((value, i) => value - model.points[edge[1]][i])) > 1e-9);
  }
  for (const face of model.faces) reference(face, 3, 'face');
  for (const view of Object.values(model.views)) {
    modelViews++;
    assert.ok(typeof view.label === 'string' && view.label.trim());
    for (const segment of view.segments) { reference(segment, 2, 'highlighted segment'); assert.equal(segment.length, 2); }
    if (view.polygon.length) reference(view.polygon, 3, 'highlighted polygon');
    if (view.points) reference(view.points, 0, 'highlighted points');
  }
}

// Check actual assets and entry routes, including the shared engine loaded once.
let links = 0;
for (const name of ['index.html', 'lesson.html']) {
  const full = path.join(directory, name), html = fs.readFileSync(full, 'utf8');
  assert.match(html, /<html lang="ru"/);
  for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(?:https?:|#)/.test(url)) continue;
    assert.ok(fs.existsSync(path.resolve(directory, url.split(/[?#]/)[0])), name + ': broken asset ' + url);
    links++;
  }
  if (name === 'lesson.html') assert.equal((html.match(/guided-lesson\.js/g) || []).length, 1);
}
assert.match(fs.readFileSync(path.join(root, 'ege-profil/index.html'), 'utf8'), /href="atanasyan-10-11\/index\.html"/);
const profileRoute = fs.readFileSync(path.join(root, 'ege-profil/start/app.js'), 'utf8');
assert.match(profileRoute, /page==='exam'&&id==='15'\)return stereometryCourse\(\)/);
assert.match(profileRoute, /page==='exam'&&id==='16'\)return inequalities\(\)/);
assert.match(profileRoute, /href="\.\.\/atanasyan-10-11\/index\.html"/);
console.log('ATANASYAN_PROFILE15_STATIC_OK', JSON.stringify({ lessons: lessons.length, families: families.length, steps: stepCount, fields: fieldCount, modelViews, links, textbookPages: true }));
