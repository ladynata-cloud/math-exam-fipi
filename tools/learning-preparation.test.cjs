'use strict';
// Integration checks for the shared course map: links must resolve to actual
// exercises, and the public laboratory must not masquerade as recorded work.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const map = require('../learning/preparation-map');
const catalog = require('../learning/catalog');
const contracts = require('../board-server/learning-contracts');
const school = require('../school/curriculum');
const math = require('../school/math');
require('../school/algebra7').install(school, math);
require('../school/secondary').install(school, math);
require('../school/core-content').install(school);
require('../school/core-math').install(math);
require('../school/paths').install(school);
const editions = require('../school/editions-content');
editions.install(school);
const v6 = require('../school/vilenkin6-lessons');
v6.install(school, editions);
require('../school/vilenkin5-lessons').install(school, v6);

function checkLink(link) {
  const url = new URL(link, 'https://mathexam.space');
  assert.equal(url.origin, 'https://mathexam.space', link);
  let file = path.join(root, decodeURIComponent(url.pathname));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  assert.ok(fs.existsSync(file), 'Missing destination: ' + link);
  if (url.pathname === '/school/index.html' && url.hash.startsWith('#lesson/')) {
    const id = decodeURIComponent(url.hash.slice(8));
    assert.ok(school.byId[id], 'Missing school lesson: ' + id);
    const course = school.pathById[url.searchParams.get('course')];
    assert.ok(course && course.ids.includes(id), 'Lesson outside selected course: ' + link);
  }
  if (url.pathname === '/ege-baza/path/index.html' && url.hash.startsWith('#lesson=')) {
    assert.ok(catalog.get('path:' + decodeURIComponent(url.hash.slice(8))), link);
  }
}

const seen = new Set();
for (const group of map.groups) {
  assert.ok(group.items.some(item => item.tier === 'core'), 'No starting tasks: ' + group.id);
  for (const item of group.items) {
    assert.ok(!seen.has(item.id), 'Duplicate exercise: ' + item.id); seen.add(item.id);
    checkLink(item.url);
    assert.equal(map.get(item.id), item);
    assert.equal(map.groupFor(item.id), group);
    if (item.kind === 'managed') {
      const source = catalog.get(item.managedId);
      assert.ok(source, 'Unknown managed identity: ' + item.managedId);
      assert.equal(decodeURIComponent(new URL(item.url, 'https://mathexam.space').hash.slice(10)), source.id);
      checkLink(item.publicUrl);
      // A valid catalog label alone is insufficient: the server must actually
      // create and normalize the task opened by this route.
      const created = contracts.create(source.trainerId, source.contentId, 239);
      contracts.normalize(source.trainerId, created.taskSpec, created.state);
      assert.equal(map.practiceUrl(item.id), item.url);
    } else {
      assert.equal(item.kind, 'public');
      assert.equal(item.managedId, null);
      assert.equal(map.practiceUrl(item.id), '');
    }
  }
}
for (const source of catalog.items.filter(item => item.trainerId === 'oge-basics' || item.pre7 || /^grade7-b-/.test(item.contentId))) {
  assert.ok(map.get(source.id), 'Missing prerequisite exercise: ' + source.id);
}
for (const goal of Object.values(map.goals)) {
  assert.ok(goal.managedIds.length > 0);
  for (const id of goal.managedIds) assert.ok(map.get(id)?.managedId, 'Unrecordable recommendation: ' + id);
  for (const item of goal.publicItems) {
    assert.equal(item.kind, 'public'); assert.equal(item.managedId, null); checkLink(item.url);
  }
}
assert.equal(map.get('__proto__'), null);
assert.equal(map.practiceUrl('missing'), '');
console.log('LEARNING_PREPARATION_OK (' + map.groups.length + ' groups, ' + seen.size + ' destinations, server contracts and school lesson links)');
