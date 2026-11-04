'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const hash = '#atanasyan-7-9-main-92-part-1';
const wrapper = '/trainers/atanasyan-7-9.html';
function picker(origin = 'https://mathexam.space') {
  const context = { window: {}, URL, location: new URL(origin + '/trainers/trainer-board.html') };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'trainers/board-picker.js'), 'utf8'), context);
  return context.window.BoardPicker;
}
test('literal same-origin exercise 92a opens its registered wrapper and retains query/hash', () => {
  for (const origin of ['https://mathexam.space', 'http://127.0.0.1:5173']) {
    const { normalize, canonical } = picker(origin);
    for (const entry of ['/geometry-course/textbook/', '/geometry-course/textbook/index.html']) {
      for (const source of [entry, origin + entry, '//' + new URL(origin).host + entry]) {
        assert.equal(normalize(source + '?mode=practice' + hash), wrapper + '?mode=practice' + hash);
      }
    }
    assert.equal(normalize(wrapper + hash), wrapper + hash);
    assert.equal(canonical('/geometry-course/textbook/?seed=3' + hash), wrapper + hash);
  }
});
test('other origins and nonliteral paths gain no new alias', () => {
  const { normalize } = picker();
  for (const value of [
    'https://example.com/geometry-course/textbook/' + hash,
    '/geometry-course/textbook//' + hash,
    '/geometry-course/%74extbook/' + hash,
    '/geometry-course/other/../textbook/' + hash,
    '/geometry-course/textbook/%2e/index.html' + hash,
  ]) assert.equal(normalize(value), value, value);
  assert.throws(() => normalize('javascript:alert(1)'));
  assert.throws(() => normalize('/trainers/trainer-board.html'));
});
test('picker and exact registry agree without widening the canonical file boundary', () => {
  const { canonical } = picker();
  const entries = JSON.parse(fs.readFileSync(path.join(root, 'trainers/board-picker-data.json'))).entries;
  assert.equal(entries.filter(entry => canonical(entry.href) === wrapper + hash).length, 1);
  const { loadTrainerRegistry, canonicalTrainerFile } = require('../board-server/trainer-registry');
  const registry = loadTrainerRegistry({ env: {} });
  assert.deepEqual(registry.getByTrainerUrl(wrapper + hash), {
    trainerId: 'atanasyan-7-9', file: wrapper.slice(1), version: '1.0.0',
    stateSchemaVersion: 1, bridgeProtocolVersion: 1, allowLegacyHtml: false
  });
  assert.equal(canonicalTrainerFile('geometry-course/textbook/index.html'), null);
  assert.equal(registry.getByTrainerUrl('/geometry-course/textbook/' + hash), null);
});

test('grade 7 course, native activities and both managed families open their bounded wrappers',()=>{
 const {normalize}=picker();
 for(const hash of ['', '#atanasyan-7-9-main-92-part-2','#atanasyan-7-9-main-161-part-1'])assert.equal(normalize('/geometry-course/textbook/'+hash),'/trainers/atanasyan-grade7.html'+hash);
 assert.equal(normalize('/geometry-course/first-steps/'),'/trainers/atanasyan-grade7.html');
 assert.equal(normalize('/geometry-course/trainers/ch2-p4-t2-proof-sss.html'),'/trainers/geometry7-practice.html?activity=ch2-p4-t2-proof-sss');
 for(const id of ['grade7-r-point-on-line-segment','grade7-g-core-sas'])assert.equal(normalize('/ege-baza/path/#lesson='+id),'/trainers/geometry7-rebuild.html#lesson='+id);
});
