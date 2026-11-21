'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const root = path.resolve(__dirname, '..');
const base = 'trainers/oge-basics/multiplication-division/';
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read(base + 'division-path.html');
const G = require('../' + base + 'division-guided-core.js');
const extension = JSON.parse(read('oge/skills/expansion-division.json'));

function page(t, hash = '', saved = null) {
  const dom = new JSDOM(html, {url:'https://mathexam.space/' + base + 'division-path.html' + hash, runScripts:'outside-only'});
  t.after(() => dom.window.close());
  const w = dom.window, original = saved === null ? null : JSON.stringify(saved), writes = [];
  Object.defineProperty(w, 'localStorage', {value:{getItem:() => original, setItem:(...args) => writes.push(args), removeItem:(...args) => writes.push(args)}});
  w.DivisionGuided = G;
  w.eval(read(base + 'division-path.js'));
  return {w, document:w.document, writes};
}

test('optional map exposes all six skills and opens the real full exercises in separate tabs', t => {
  const {document:d} = page(t), map = d.getElementById('division-skill-map');
  assert.equal(map.open, false, 'the ordinary route is not expanded into a full map on arrival');
  const cards = [...map.querySelectorAll('[data-division-skill]')];
  assert.deepEqual(cards.map(card => card.dataset.divisionSkill), extension.topics[0].skills.map(skill => skill.id));
  for (const card of cards) {
    const skill = extension.topics[0].skills.find(item => item.id === card.dataset.divisionSkill);
    const link = card.querySelector('a[href]');
    assert.equal(link.href, new URL(skill.supportLinks[0].href, 'https://mathexam.space').href, 'public and general maps reach the same practice');
    assert.equal(link.target, '_blank');
    assert(link.relList.contains('noopener'));
    assert.equal(link.getAttribute('aria-describedby'), 'division-map-return');
    assert(d.getElementById(link.getAttribute('aria-describedby')));
    assert.equal(card.querySelector('[data-progress],[data-guided]'), null, 'support is not a new ordinary progress stage');
  }
  assert.match(d.getElementById('division-map-return').textContent, /новой вкладке/);
  assert.match(map.textContent, /исходным числам/);
  assert.match(map.textContent, /остаток меньше делителя/);
});

test('a direct skill link expands only the optional map and keeps an existing division session resumable', t => {
  const task = G.make('twoDigit',0), plan = G.plan(task);
  const saved = {version:1, records:[], active:'twoDigit', sessions:{twoDigit:{task, done:false, accepted:false, step:1, answers:[plan.actions[0].answer]}}};
  const before = JSON.stringify(saved);
  const {w,document:d,writes} = page(t, '#skill-round-hundreds', saved);
  assert.equal(d.getElementById('division-skill-map').open, true);
  assert.equal(d.getElementById('continue-division').hash, '#twoDigit');
  assert.match(d.getElementById('continue-division').textContent, /Продолжить/);
  assert.deepEqual(writes, []);
  assert.equal(JSON.stringify(saved), before);
  assert.equal(w.localStorage.getItem('mathExamBasics.guidedDivision.v1'), before);
});

test('map hash navigation is optional, accepts a later skill link and ignores malformed fragments', t => {
  const {w,document:d,writes} = page(t, '#stage-twoDigit');
  const map = d.getElementById('division-skill-map');
  assert.equal(map.open, false, 'going directly to an ordinary stage keeps the map closed');
  w.history.replaceState(null, '', '#skill-quotient-digit');
  w.dispatchEvent(new w.HashChangeEvent('hashchange'));
  assert.equal(map.open, true);
  map.open = false;
  w.history.replaceState(null, '', '#%E0%A4%A');
  assert.doesNotThrow(() => w.dispatchEvent(new w.HashChangeEvent('hashchange')));
  assert.equal(map.open, false);
  w.history.replaceState(null, '', '#division-skill-map');
  w.dispatchEvent(new w.HashChangeEvent('hashchange'));
  assert.equal(map.open, true);
  assert.deepEqual(writes, []);
});
