'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = { window: {}, location: new URL('https://mathexam.space/trainers/trainer-board.html'), URL };
vm.runInNewContext(fs.readFileSync(path.join(root, 'trainers/board-picker.js'), 'utf8'), context);
const normalize = context.window.BoardPicker.normalize;
const entries = JSON.parse(fs.readFileSync(path.join(root, 'trainers/board-picker-data.json'))).entries;
const full = entries.filter(item => item.href === '/trainers/vilenkin5.html#course/vilenkin5');
assert.equal(full.length, 1);
const lessons = entries.filter(item => item.href.startsWith('/school/index.html?course=vilenkin5#lesson/v5f-'));
assert.equal(lessons.length, 134);
for (const item of lessons) assert.equal(normalize(item.href), '/trainers/vilenkin5.html' + new URL(item.href, context.location).hash);
for (let point = 1; point <= 53; point++) assert.equal(normalize('/school/index.html?course=vilenkin5#v5-unit/' + point), '/trainers/vilenkin5.html#v5-unit/' + point);
for (const url of ['/courses/vilenkin-5/', '/courses/vilenkin-5/index.html', '/school/index.html?course=vilenkin5'])
  assert.equal(normalize(url), '/trainers/vilenkin5.html#course/vilenkin5');
for (const url of ['/school/index.html?course=vilenkin6#course/vilenkin6', '/school/index.html?course=makarychev9#course/makarychev9',
  '/school/index.html?course=vilenkin5#progress', '/school/index.html#v5-unit/54', '/courses/vilenkin-5-part-1/']) assert.equal(normalize(url), url);
console.log('VILENKIN5_PICKER_OK: one full-course entry, 134 legacy lesson links, 53 units; other courses and unsupported scenes unchanged');
