'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const base = 'trainers/oge-basics/';
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const A = require('../trainers/oge-basics/arithmetic-route.js');

function mount(search = '', populate = () => {}) {
  const dom = new JSDOM(read(base + 'arithmetic-route.html'), {url:'https://mathexam.space/' + base + 'arithmetic-route.html' + search, runScripts:'outside-only'});
  const w = dom.window;
  populate(w.localStorage);
  for (const file of ['multiplication-division/division-lab-core.js', 'multiplication-division/division-guided-core.js', 'arithmetic-route.js', 'arithmetic-route-page.js', 'navigation-minimal.js']) w.eval(read(base + file));
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  return {w, doc:w.document, close:() => w.close()};
}
const attempt = (level, at, extra = {}) => ({version:1, level, at, fingerprint:'fixture-' + at, errors:0, hints:0, revealed:false, ...extra});
const put = (storage, level, at, extra) => storage.setItem(A.prefix + at, JSON.stringify(attempt(level, at, extra)));

const fresh = mount();
assert.equal(fresh.doc.querySelector('h1').textContent, 'Научиться считать');
assert(fresh.doc.getElementById('route-resume').hidden, 'No invented progress on a fresh browser');
assert.deepEqual([...fresh.doc.querySelectorAll('[data-operation]')].map(a => a.dataset.operation), ['addition','subtraction','multiplication','division']);
for (const [operation, level] of [['addition','n1a'], ['subtraction','n1b'], ['multiplication','t2a']]) {
  const url = new URL(fresh.doc.querySelector('[data-operation="' + operation + '"]').href);
  assert.equal(url.pathname, '/trainers/arifmetika.html');
  assert.equal(url.searchParams.get('course'), 'preoge');
  assert.equal(url.searchParams.get('level'), level);
}
const division = new URL(fresh.doc.querySelector('[data-operation="division"]').href);
assert.equal(division.pathname, '/' + base + 'multiplication-division/long-division-from-simple-to-decimals.html');
assert.equal(division.searchParams.get('course'), 'preoge');
assert.equal(division.hash, '#start');
assert.equal(fresh.doc.querySelectorAll('#route-overview [data-skill]').length, A.groups.length, 'Every existing topic stays reachable');
assert(!fresh.doc.getElementById('route-topics').open, 'Exact-topic catalogue is secondary to the four simple starts');
assert(fresh.doc.getElementById('division-course-entry').closest('details.basics-secondary'), 'Shared navigation still keeps the full course secondary');
assert(!fresh.doc.getElementById('route-start').closest('details'), 'The four simple starts are visible without opening the catalogue');
assert.match(fresh.doc.querySelector('.diagnostic-choice').textContent, /деление/);
assert.match(fresh.doc.querySelector('.diagnostic-choice').textContent, /можно пропустить/);
assert.match(fresh.doc.getElementById('division-course-entry').textContent, /четыре линейки/);
assert.doesNotMatch(fresh.doc.getElementById('division-course-entry').textContent, /Деление уголком · весь курс/);
for (const a of fresh.doc.querySelectorAll('a[href]')) {
  const url = new URL(a.href);
  if (url.origin !== 'https://mathexam.space') continue;
  let file = url.pathname.slice(1);
  if (file.endsWith('/')) file += 'index.html';
  assert(fs.existsSync(path.join(root, file)), 'Existing destination: ' + a.href);
}
fresh.close();

const continuing = mount('', storage => {
  put(storage, 'n1a', 100);
  put(storage, 't2b', 200);
  storage.setItem(A.prefix + 'damaged', '{bad');
});
assert(!continuing.doc.getElementById('route-resume').hidden);
assert.equal(new URL(continuing.doc.getElementById('resume-link').href).searchParams.get('skill'), 'multiply', 'Continue the most recent valid saved topic');
assert.equal(continuing.w.localStorage.length, 3, 'No new persistence keys');
assert.equal(continuing.w.localStorage.getItem(A.prefix + 'damaged'), '{bad', 'Damaged progress is not rewritten');
continuing.close();

const guided = mount('', storage => {
  put(storage, 'n1a', 100);
  storage.setItem(A.guidedKey, JSON.stringify({version:1,records:[{id:1,at:300,topic:'oneDigit',task:{topicId:'oneDigit',level:'oneDigit',dividend:'72',divisor:'3'},errors:0,hints:0,reveals:0,repeated:false}]}));
});
const guidedLink = new URL(guided.doc.getElementById('resume-link').href);
assert.equal(guidedLink.hash, '#oneDigit', 'Keep the saved guided topic, not merely a related practice level');
assert.equal(guidedLink.searchParams.get('course'), 'preoge');
assert.equal(guided.w.localStorage.length, 2);
guided.close();

for (const group of A.groups) {
  const detail = mount('?skill=' + group.id, storage => put(storage, group.levels[0][0], 100));
  assert(detail.doc.getElementById('route-start').hidden);
  assert(detail.doc.getElementById('route-topics').hidden);
  assert(!detail.doc.getElementById('route-detail').hidden);
  assert.equal(detail.doc.querySelectorAll('#route-levels [data-level]').length, group.levels.length);
  assert.equal(new URL(detail.doc.getElementById('start-practice').href).searchParams.get('level'), group.levels[0][0], 'Existing nearest-step semantics');
  assert.equal(detail.doc.getElementById('start-practice').textContent, 'Продолжить занятия');
  detail.close();
}
const blocked = A.createStore({get length(){throw Error('blocked');}, getItem(){throw Error('blocked');}});
assert.equal(blocked.lastActivity(), null);
assert(blocked.notice());
console.log('ARITHMETIC_ROUTE_ENTRY_OK: four simple starts, optional division check, all old topic routes, last valid saved topic, exact guided hash, and no progress writes.');
