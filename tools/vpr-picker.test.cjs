'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const data = JSON.parse(read('trainers/board-picker-data.json'));
const bank = require('../trainers/vpr-math/data.js');
const registry = require('../board-server/trainer-registry').loadTrainerRegistry({ env: {} });
const entryPath = id => '/trainers/vpr-math/index.html?route=' + id;
const tick = () => new Promise(resolve => setImmediate(resolve));

test('seven public VPR picker destinations retain their class and level and use the existing exact registry entry', () => {
  const selected = data.entries.filter(entry => entry.href.startsWith('/trainers/vpr-math/'));
  assert.deepEqual(selected.map(entry => entry.href), bank.routes.map(route => entryPath(route.id)));
  for (const entry of selected) {
    assert.equal(entry.group, 'ВПР / математика');
    assert.equal(data.entries.filter(item => item.href === entry.href).length, 1);
    assert.equal(registry.getByTrainerUrl(entry.href)?.trainerId, 'vpr-math');
    assert.deepEqual([...new URL(entry.href, 'https://mathexam.space').searchParams.keys()], ['route']);
  }
});

test('actual board picker finds VPR by text and group and opens all seven exact public routes', async () => {
  const errors = [], opened = [], requests = [];
  const virtualConsole = new VirtualConsole(); virtualConsole.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(read('trainers/trainer-board.html'), {
    url: 'https://mathexam.space/trainers/trainer-board.html', runScripts: 'outside-only', virtualConsole
  });
  const w = dom.window;
  try {
    w.matchMedia = () => ({ matches: false });
    w.HTMLElement.prototype.scrollIntoView = () => {};
    w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
    w.HTMLDialogElement.prototype.close = function () { this.open = false; };
    w.fetch = async url => { requests.push(String(url)); assert.match(String(url), /^board-picker-data\.json\?v=/); return { ok: true, json: async () => data }; };
    w.eval(read('trainers/board-picker.js'));
    w.BoardPicker.mount({ open(url) { opened.push(url); return true; }, retry() {}, role: () => 'teacher', fallback: [],
      mirrorCapability: url => registry.getByTrainerUrl(url) ? 'supported' : 'unsupported' });
    await tick(); await tick();
    assert.equal(requests.length, 1, 'The ordinary picker loads its committed public catalogue');
    const q = selector => w.document.querySelector(selector);
    const results = () => [...w.document.querySelectorAll('#pickerResults .picker-item')];
    q('#chooseTrainer').click();
    q('#pickerSearch').value = 'ВПР'; q('#pickerSearch').dispatchEvent(new w.Event('input'));
    // The established substring search also matches the word «вправо» in a
    // Vilenkin title. Keep that existing search behavior and verify every VPR hit.
    const vprResults = results().filter(button => button.querySelector('strong').textContent.startsWith('ВПР ·'));
    assert.deepEqual(vprResults.map(button => button.querySelector('strong').textContent), data.entries.filter(entry => entry.group === 'ВПР / математика').map(entry => entry.title));
    assert.equal(vprResults.length, 7, 'The normal search finds all seven VPR courses');
    assert(vprResults.every(button => button.querySelector('[data-mirror-capability=supported]')));
    q('#pickerSearch').value = ''; q('#pickerGroup').value = 'ВПР / математика'; q('#pickerGroup').dispatchEvent(new w.Event('change'));
    assert.equal(results().length, 7, 'The existing group filter exposes the same courses');
    for (const route of bank.routes) {
      q('#chooseTrainer').click();
      q('#pickerGroup').value = 'ВПР / математика';
      const query = 'ВПР ' + route.grade + ' класс' + (route.id.endsWith('u') ? ' углублённый' : ['g7', 'g8'].includes(route.id) ? ' базовый' : '');
      q('#pickerSearch').value = query; q('#pickerSearch').dispatchEvent(new w.Event('input'));
      assert.equal(results().length, 1, query);
      results()[0].click();
      assert.equal(opened.at(-1), entryPath(route.id), query);
      assert.equal(q('#trainerPicker').open, false);
    }
    assert.deepEqual(opened, bank.routes.map(route => entryPath(route.id)));
    assert.deepEqual(errors, []);
  } finally { w.close(); }
});
