'use strict';

// Exercise the actual editor's forms and drawing labels. JSXGraph rendering is
// stubbed here; geometry comes from the production model, not test arithmetic.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function fixture(t) {
  const dom = new JSDOM(read('trainers/spacemath/index.html'), {
    url: 'https://mathexam.space/trainers/spacemath/', runScripts: 'outside-only', pretendToBeVisual: true
  });
  t.after(() => dom.window.close());
  const w = dom.window, d = w.document;
  w.TextEncoder = TextEncoder;
  let created = [];
  w.JXG = { COORDS_BY_USER: 0, JSXGraph: {
    freeBoard() {},
    initBoard() {
      created = [];
      return {
        getBoundingBox: () => [-8, 6, 8, -6], setBoundingBox() {}, suspendUpdate() {}, unsuspendUpdate() {},
        on() {}, update() {}, fullUpdate() {},
        create(type, args, attrs) {
          const element = { type, args, attrs, on() {}, setAttribute() {}, setPosition() {} };
          created.push(element); return element;
        }
      };
    }
  }};
  w.eval(read('trainers/spacemath/model.js'));
  w.eval(read('trainers/spacemath/app.js'));
  const select = id => d.querySelector('[data-object="' + id + '"]').click();
  const submit = () => d.querySelector('#edit-object-form button[type="submit"]').click();
  const install = objects => {
    const state = w.SpaceMathModel.empty();
    state.objects = w.JSON.parse(JSON.stringify(objects));
    w.SpaceMathApp.applyState(state);
  };
  return { w, d, select, submit, install, app: w.SpaceMathApp, created: () => created };
}
const point = (id, x, y) => ({ id, type: 'point', label: id.toUpperCase(), x, y });

test('renaming a free point preserves full coordinates and dependent geometry, including tiny coordinates', t => {
  const f = fixture(t);
  for (const [x, y] of [[Math.PI, -Math.E], [1e-12, -7e-14], [999999.123456789, -999999.987654321]]) {
    f.install([point('a', x, y), point('b', 6, 8), { id: 'm', type: 'midpoint', label: 'M', parents: ['a', 'b'] }]);
    const before = f.app.getState(), midpoint = f.w.SpaceMathModel.evaluate(before).m;
    f.select('a');
    assert.equal(Number(f.d.getElementById('edit-x').value), x);
    assert.equal(Number(f.d.getElementById('edit-y').value), y);
    f.d.getElementById('object-label').value = 'P'; f.submit();
    const after = f.app.getState(), actual = f.w.SpaceMathModel.evaluate(after).m;
    assert.equal(after.objects[0].label, 'P');
    assert.equal(after.objects[0].x, x); assert.equal(after.objects[0].y, y);
    assert.equal(actual.x, midpoint.x); assert.equal(actual.y, midpoint.y);
    f.d.getElementById('undo').click();
    assert.equal(f.app.getState().objects[0].label, 'A');
    f.d.getElementById('redo').click();
    assert.equal(f.app.getState().objects[0].x, x);
    assert.equal(f.app.getState().objects[0].y, y);
  }
});

test('explicit coordinate edits update only entered values and readonly cannot apply changes', t => {
  const f = fixture(t), originalY = Math.PI;
  f.install([point('a', 1, originalY)]); f.select('a');
  f.d.getElementById('edit-x').value = '-2.34567890123456'; f.submit();
  assert.equal(f.app.getState().objects[0].x, -2.34567890123456);
  assert.equal(f.app.getState().objects[0].y, originalY);
  f.app.setReadOnly(true);
  f.d.getElementById('edit-x').value = '42';
  f.d.getElementById('edit-object-form').dispatchEvent(new f.w.Event('submit', { bubbles: true, cancelable: true }));
  assert.equal(f.app.getState().objects[0].x, -2.34567890123456);
});

test('arrow keys change only their axis and preserve subdecimal coordinates on the other axis', t => {
  const f = fixture(t);
  for (const [key, dx, dy] of [['ArrowLeft', -.1, 0], ['ArrowRight', .1, 0], ['ArrowUp', 0, .1], ['ArrowDown', 0, -.1]]) {
    const x = 3e-13, y = -7e-14;
    f.install([point('a', x, y)]); f.select('a');
    f.d.getElementById('geometry-board').dispatchEvent(new f.w.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    const after = f.app.getState().objects[0];
    assert.equal(after.x, dx ? x + dx : x);
    assert.equal(after.y, dy ? y + dy : y);
  }
});

test('undefined bisector reports its limitation visibly and keeps dependencies for recovery', t => {
  const f = fixture(t);
  f.install([point('a', -1, 0), point('b', 0, 0), point('c', 1, 0)]);
  f.d.querySelector('[data-tool="bisector"]').click();
  f.select('a'); f.select('b'); f.select('c');
  const bisector = f.app.getState().objects.find(item => item.type === 'bisector');
  assert.ok(bisector, 'undefined construction retains live parents');
  assert.equal(f.w.SpaceMathModel.evaluate(f.app.getState())[bisector.id].defined, false);
  assert.match(f.d.getElementById('feedback').textContent, /180°/);
  assert.match(f.d.getElementById('feedback').textContent, /Сдвиньте точку/);
  assert.doesNotMatch(f.d.getElementById('feedback').textContent, /готово|выберите сторону/);
  assert.equal(f.d.getElementById('feedback').classList.contains('error'), true);
  assert.match(f.d.getElementById('selected-description').textContent, /180°/);
  f.d.querySelector('[data-tool="move"]').click(); f.select('c');
  f.d.getElementById('edit-y').value = '1'; f.submit();
  assert.equal(f.w.SpaceMathModel.evaluate(f.app.getState())[bisector.id].defined, true);
  f.select(bisector.id);
  assert.doesNotMatch(f.d.getElementById('selected-description').textContent, /Не определено/);
});

test('rounded distance, angle and circle radius are presented as approximations without rounding model values', t => {
  const f = fixture(t);
  f.install([
    point('a', 0, 0), point('b', 1, 1), point('c', 3, 1),
    { id: 'distance', type: 'distance', label: 'AB', parents: ['a', 'b'] },
    { id: 'angle', type: 'angle', label: 'α', parents: ['b', 'a', 'c'] },
    { id: 'circle', type: 'circle', label: 'k', parents: ['a', 'b'] }
  ]);
  const labels = f.created().filter(item => item.type === 'text').map(item => item.args[2]());
  assert.equal(labels.length, 2); assert.ok(labels.every(label => label.includes(' ≈ ') && !label.includes(' = ')));
  for (const id of ['distance', 'angle', 'circle']) {
    f.select(id); assert.match(f.d.getElementById('selected-description').textContent, /≈/);
    assert.doesNotMatch(f.d.getElementById('selected-description').textContent, /=/);
  }
  const measured = f.w.SpaceMathModel.evaluate(f.app.getState());
  assert.equal(measured.distance.value, Math.sqrt(2));
  assert.equal(measured.circle.r, Math.sqrt(2));
});

test('the triangle example contains an actual height segment with live perpendicular dependencies', t => {
  const f = fixture(t); f.d.getElementById('example').click();
  const state = f.app.getState();
  const height = state.objects.find(item => item.label === 'Высота CH');
  assert.ok(height); assert.equal(height.type, 'segment');
  assert.deepEqual(Array.from(height.parents), ['c', 'h']);
  assert.doesNotMatch(state.objects.find(item => item.id === 'altitude').label, /Высота/);
  f.select('b'); f.d.getElementById('edit-y').value = '1'; f.submit();
  const result = f.w.SpaceMathModel.evaluate(f.app.getState());
  assert.equal(result[height.id].defined, true);
  assert.deepEqual(Array.from(result[height.id].domain), [0, 1]);
  const base = result.base.d, altitude = result[height.id].d;
  assert.ok(Math.abs(base[0] * altitude[0] + base[1] * altitude[1]) < 1e-10);
  assert.equal(result[height.id].a[0], result.c.x);
  assert.equal(result[height.id].a[1], result.c.y);
});
