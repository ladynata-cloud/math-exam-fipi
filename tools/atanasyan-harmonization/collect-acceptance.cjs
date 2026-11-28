'use strict';
// Run only after both the mathematics/state job and all real-browser jobs
// succeeded. This joins their actual evidence; missing topics cannot be inferred.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const input = path.resolve(process.env.HARMONIZATION_EVIDENCE_INPUT || 'artifacts/harmonization-shards');
const output = path.resolve(process.env.HARMONIZATION_ACCEPTANCE_OUTPUT || 'artifacts/atanasyan-acceptance');
function list(folder) {
  return fs.readdirSync(folder, {withFileTypes: true}).flatMap(entry => entry.isDirectory() ? list(path.join(folder, entry.name)) : [path.join(folder, entry.name)]);
}
const files = list(input);
function evidence(suite, filename) {
  const candidates = files.filter(file => file.includes('atanasyan-harmonization-' + suite + path.sep) && path.basename(file) === filename);
  assert.equal(candidates.length, 1, suite + ': exactly one original evidence file');
  return JSON.parse(fs.readFileSync(candidates[0], 'utf8'));
}
const geometry = evidence('geometry', 'report.json');
const stereo = evidence('stereometry', 'measurements.json');
const textbook = evidence('textbook-input', 'evidence.json');
const download = evidence('offline-package', 'evidence.json');
assert.equal(geometry.status, 'PASS');
assert.deepEqual(geometry.failures, []);
assert.deepEqual(geometry.consoleErrors, []);
assert.deepEqual(stereo.errors, []);
assert(!stereo.failure);
for (const [name, report] of [['textbook', textbook], ['download', download]]) {
  assert.equal(report.completed, true, name + ': completed real browser execution');
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.widths.map(row => row.width).sort((a, b) => a - b), [320, 1280]);
}
assert.deepEqual(download.networkRequests, []);
const courses = [
  {name: '7–9', units: require(root + '/geometry-course/data/course.json').units, rows: geometry.views, width: row => row.width, prefix: 'geometry-course/atlas/'},
  {name: '10–11', units: require(root + '/stereo-course/data/course.json').units, rows: stereo.routes, width: row => row.width, prefix: 'stereo-course/index.html#'}
];
assert.deepEqual(courses.map(course => course.units.length), [63, 39]);
const rows = [];
for (const course of courses) {
  const expected = new Set(course.units.flatMap(unit => [320, 1280].map(width => unit.id + '@' + width)));
  assert.equal(course.rows.length, expected.size, course.name + ': exact viewport count');
  for (const row of course.rows) assert(expected.delete(row.id + '@' + course.width(row)), course.name + ': unique known topic and viewport');
  assert.equal(expected.size, 0, course.name + ': every required viewport actually completed');
  for (const unit of course.units) rows.push({course: course.name, id: unit.id, title: unit.title, path: course.prefix + unit.id + (course.name === '7–9' ? '.html' : ''), audited: true, implemented: true, mathematicsChecked: true, interfaceChecked: true, browserViewports: ['320×900', '1280×900'], published: false});
}
assert.deepEqual([...geometry.offline].sort(), courses[0].units.map(unit => unit.id).sort(), 'all 63 standalone geometry lessons actually opened offline');
assert.deepEqual(geometry.naturalOffline.map(row => row.id).sort(), courses[0].units.map(unit => unit.id).sort(), 'all 63 standalone lessons retain immediate natural reloads');
for (const row of geometry.naturalOffline) assert.equal(row.reloads.length, 2, row.id + ': both immediate natural reloads completed');
assert.equal(geometry.checkpointRecovery.status, 'PASS', 'isolated missing-key recovery completed in the native browser');
assert.equal(geometry.checkpointRecovery.id, 'segments');
assert.equal(geometry.checkpointRecovery.kind, 'isolated-missing-key');
assert(stereo.checks.includes('copied standalone HTML, offline research/task/reload'));
const head = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim();
assert.equal(head, process.env.HARMONIZATION_EXPECTED_HEAD, 'evidence belongs to the requested PR head');
const source = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
assert.equal(stereo.sourceSha256, source('stereo-course/index.html'));
assert.equal(textbook.engineSHA256, source('stereo-course/textbook/assets/engine.js'));
const report = {task: 'ATANASYAN_7_11_HARMONIZATION_20261116', base: '5f25f75b6e7178ad1d492c7bcb28ed9e63c97bae', head, published: false, topics: rows, sourceSHA256: Object.fromEntries(['geometry-course/assets/investigations.js', 'geometry-course/assets/lesson.js', 'geometry-course/assets/store.js', 'stereo-course/index.html', 'stereo-course/textbook/assets/engine.js', 'downloads/trainers/geometry-course/geometry-course-package.zip'].map(file => [file, source(file)]))};
fs.mkdirSync(output, {recursive: true});
fs.writeFileSync(path.join(output, 'acceptance.json'), JSON.stringify(report, null, 2) + '\n');
const markdown = ['# Атанасян: карта приёмки 102 тем', '', 'Task: `' + report.task + '`', '', 'Base: `' + report.base + '` · Head: `' + head + '`', '', 'Все строки ниже основаны на завершённых математических, state/DOM и браузерных jobs этого запуска. Проверены 320×900 и 1280×900. Публикация не выполнена: результат подготовлен для Draft PR.', '', '| Курс | ID | Тема | Обследовано | Изменено | Математика | Интерфейс | Опубликовано |', '| --- | --- | --- | --- | --- | --- | --- | --- |', ...rows.map(row => '| ' + [row.course, '`' + row.id + '`', row.title.replace(/\|/g, '\\|'), 'Да', 'Да', 'PASS', 'PASS', 'Нет'].join(' | ') + ' |'), ''].join('\n');
fs.writeFileSync(path.join(output, 'acceptance.md'), markdown);
console.log('ATANASYAN_HARMONIZATION_ACCEPTANCE_COLLECTED: 102 topics, 204 actual topic/viewports, retained banks and offline package; publication remains false');
