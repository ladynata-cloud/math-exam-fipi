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

function fixture(t, saved) {
  const dom = new JSDOM(read('trainers/spacemath/index.html'), {
    url: 'https://mathexam.space/trainers/spacemath/', runScripts: 'outside-only', pretendToBeVisual: true
  });
  t.after(() => dom.window.close());
  const w = dom.window, d = w.document;
  w.TextEncoder = TextEncoder;
  if (saved) w.localStorage.setItem('mathexam.spacemath.draft.v1', JSON.stringify(saved));
  let created = [], activeBoard;
  w.JXG = { COORDS_BY_USER: 0, JSXGraph: {
    freeBoard() {},
    initBoard() {
      created = [];
      const handlers = new Map();
      let bounds = [-8, 6, 8, -6];
      const update = () => created.forEach(element => element.updateDataArray?.());
      activeBoard = {
        canvasWidth: 800, canvasHeight: 600,
        unitX: 50, unitY: 50,
        getBoundingBox: () => [...bounds],
        getUsrCoordsOfMouse: event => event.coordinates,
        setBoundingBox(value) { bounds = [...value]; handlers.get('boundingbox')?.(); },
        setAttribute() {}, suspendUpdate() {}, unsuspendUpdate: update,
        on(type, callback) { handlers.set(type, callback); }, update, fullUpdate: update,
        emit(type, event) { handlers.get(type)?.(event); },
        create(type, args, attrs) {
          const events = new Map();
          let position;
          const coordinate = i => position?.[i] ?? (typeof args[i] === 'function' ? args[i]() : args[i]);
          const element = {
            type, args, attrs,
            on(name, callback) { events.set(name, callback); },
            emit(name, event) { events.get(name)?.(event); },
            setAttribute() {},
            setPosition(_method, value) { position = [...value]; },
            X: () => coordinate(0), Y: () => coordinate(1)
          };
          created.push(element); return element;
        }
      };
      return activeBoard;
    }
  }};
  w.eval(read('trainers/spacemath/expression.js'));
  w.eval(read('trainers/spacemath/model.js'));
  w.eval(read('trainers/spacemath/constructions.js'));
  w.eval(read('trainers/spacemath/app.js'));
  const select = id => d.querySelector('[data-object="' + id + '"]').click();
  const submit = () => d.querySelector('#edit-object-form button[type="submit"]').click();
  const install = objects => {
    const state = w.SpaceMathModel.empty();
    state.objects = w.JSON.parse(JSON.stringify(objects));
    w.SpaceMathApp.applyState(state);
  };
  return { w, d, select, submit, install, app: w.SpaceMathApp, created: () => created, board: () => activeBoard };
}
const point = (id, x, y) => ({ id, type: 'point', label: id.toUpperCase(), x, y });
const tableCells = f => Array.from(f.d.querySelectorAll('#function-table-output tbody tr'), row =>
  Array.from(row.cells, cell => cell.textContent.trim()));

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

test('projection, three-point circle and its area remain live after editing their parent point', t => {
  const f = fixture(t);
  f.install([point('a', 0, 0), point('b', 4, 0), point('c', 1, 3), { id: 'base', type: 'line', label: 'AB', parents: ['a', 'b'] }]);
  f.d.querySelector('[data-tool="projection"]').click(); f.select('base'); f.select('c');
  const projection = f.app.getState().objects.find(item => item.type === 'projection');
  f.d.querySelector('[data-tool="circle3"]').click(); f.select('a'); f.select('b'); f.select('c');
  const circle = f.app.getState().objects.find(item => item.type === 'circle3');
  f.d.querySelector('[data-tool="area"]').click(); f.select(circle.id);
  const area = f.app.getState().objects.find(item => item.type === 'area');
  let result = f.w.SpaceMathModel.evaluate(f.app.getState());
  assert.deepEqual([result[projection.id].x, result[projection.id].y], [1, 0]);
  assert.ok(Math.abs(result[area.id].value - 5 * Math.PI) < 1e-12);
  f.d.querySelector('[data-tool="move"]').click(); f.select('c');
  f.d.getElementById('edit-x').value = '2'; f.d.getElementById('edit-y').value = '2'; f.submit();
  result = f.w.SpaceMathModel.evaluate(f.app.getState());
  assert.deepEqual([result[projection.id].x, result[projection.id].y], [2, 0]);
  assert.ok(Math.abs(result[circle.id].c[0] - 2) < 1e-12 && Math.abs(result[circle.id].c[1]) < 1e-12);
  assert.ok(Math.abs(result[circle.id].r - 2) < 1e-12);
  assert.ok(Math.abs(result[area.id].value - 4 * Math.PI) < 1e-12);
  f.select(area.id); assert.match(f.d.getElementById('selected-description').textContent, /12[.,]566/);
  const label = f.created().find(item => item.type === 'text');
  assert.match(label.args[2](), /≈/);
  f.d.getElementById('undo').click();
  assert.deepEqual([f.w.SpaceMathModel.evaluate(f.app.getState())[projection.id].x, f.w.SpaceMathModel.evaluate(f.app.getState())[projection.id].y], [1, 0]);
});

test('function form creates its parameters, slider updates rendered samples and undo, and readonly blocks edits', t => {
  const f = fixture(t);
  f.d.getElementById('function-expression').value = 'f(x)=a*x^2+b';
  f.d.querySelector('#add-function-form button').click();
  const state = f.app.getState(), graph = state.objects.find(item => item.type === 'functionGraph');
  const sliders = state.objects.filter(item => item.type === 'slider');
  assert.equal(graph.expression, 'a*x^2+b');
  assert.deepEqual(Array.from(sliders, item => item.name), ['a', 'b']);
  assert.deepEqual(Array.from(graph.parents), Array.from(sliders, item => item.id));
  const curve = () => f.created().find(item => item.type === 'curve');
  const assertSamples = coefficient => {
    const drawing = curve();
    // Boundary endpoints are linearly clipped for SVG; interior samples remain exact evaluations.
    const bounds = f.board().getBoundingBox();
    const finite = drawing.dataX.map((x, i) => [x, drawing.dataY[i]])
      .filter(pair => pair.every(Number.isFinite) && pair[1] > bounds[3] && pair[1] < bounds[1]);
    assert.ok(finite.length > 20, 'visible graph has real rendered samples');
    for (const [x, y] of finite) assert.ok(Math.abs(y - (coefficient * x * x + 1)) < 1e-10);
  };
  assertSamples(1);
  const range = f.d.querySelector('[data-slider="' + sliders[0].id + '"]');
  range.value = '2.5'; range.dispatchEvent(new f.w.Event('input', { bubbles: true }));
  assertSamples(2.5);
  assert.match(range.closest('label').querySelector('output').textContent, /^2[.,]5$/);
  range.dispatchEvent(new f.w.Event('change', { bubbles: true }));
  assert.equal(f.app.getState().objects.find(item => item.id === sliders[0].id).value, 2.5);
  f.d.getElementById('undo').click(); assertSamples(1);
  f.d.getElementById('redo').click(); assertSamples(2.5);
  f.select(sliders[0].id); f.app.setReadOnly(true);
  for (const selector of ['#function-expression', '#add-function-form button', '#edit-slider-value', '#zoom-in', '[data-slider="' + sliders[0].id + '"]']) {
    assert.equal(f.d.querySelector(selector).disabled, true, selector + ' is read only');
  }
  const before = JSON.stringify(f.app.getState());
  const lockedRange = f.d.querySelector('[data-slider="' + sliders[0].id + '"]');
  lockedRange.value = '4'; lockedRange.dispatchEvent(new f.w.Event('input', { bubbles: true }));
  f.d.getElementById('edit-slider-value').value = '4';
  f.d.getElementById('edit-object-form').dispatchEvent(new f.w.Event('submit', { bubbles: true, cancelable: true }));
  f.d.getElementById('add-function-form').dispatchEvent(new f.w.Event('submit', { bubbles: true, cancelable: true }));
  assert.equal(JSON.stringify(f.app.getState()), before, 'readonly events cannot change parameters or add graphs');
});

test('local zoom and pan emit canonical viewport while remote views and readonly do not echo updates', async t => {
  const f = fixture(t), updates = [];
  f.app.subscribe(() => updates.push(JSON.parse(JSON.stringify(f.app.getState()))));
  f.d.getElementById('zoom-in').click();
  assert.equal(f.app.getState().view.viewport.span, 12 * .8);
  assert.equal(updates.length, 1);
  f.board().setBoundingBox([-2, 7, 14, -5]);
  await new Promise(resolve => setTimeout(resolve, 160));
  assert.deepEqual(JSON.parse(JSON.stringify(f.app.getState().view.viewport)), { x: 6, y: 1, span: 12 });
  assert.equal(updates.length, 2, 'one debounced viewport update for a local pan');
  const incoming = f.app.getState(); incoming.view.viewport = f.w.JSON.parse('{"x":3,"y":-2,"span":6}');
  f.app.applyState(incoming);
  assert.deepEqual(f.board().getBoundingBox(), [-1, 1, 7, -5], 'remote canonical viewport maps to current aspect ratio');
  await new Promise(resolve => setTimeout(resolve, 160));
  assert.equal(updates.length, 2, 'receiving the remote viewport does not publish it again');
  f.app.setReadOnly(true);
  f.d.getElementById('zoom-in').click();
  f.board().setBoundingBox([1, 4, 9, -2]);
  await new Promise(resolve => setTimeout(resolve, 160));
  assert.deepEqual(JSON.parse(JSON.stringify(f.app.getState().view.viewport)), { x: 3, y: -2, span: 6 });
  assert.equal(updates.length, 2, 'read-only viewport events cannot publish changes');
});

test('a point placed on a segment moves along it and stays locked in a shared view', async t => {
  const f = fixture(t);
  f.install([point('a', 0, 0), point('b', 4, 2), { id: 'ab', type: 'segment', label: 'AB', parents: ['a', 'b'] }]);
  f.d.querySelector('[data-tool="pointOn"]').click();
  f.board().emit('down', { coordinates: [3, 1.5] });
  await new Promise(resolve => f.w.setTimeout(resolve, 0));
  const attached = f.app.getState().objects.find(item => item.type === 'pointOn');
  assert.ok(attached, 'clicking the segment creates a dependent point');
  assert.deepEqual(Array.from(attached.parents), ['ab']);
  assert.ok(Math.abs(attached.parameter - .75) < 1e-12, 'the placement uses the click rather than the default position');

  f.d.querySelector('[data-tool="move"]').click();
  const drawing = f.created().find(element => element.type === 'point' && element.attrs.name === attached.label);
  assert.ok(drawing, 'attached point is rendered');
  drawing.emit('down');
  drawing.setPosition(f.w.JXG.COORDS_BY_USER, [8, 6]);
  drawing.emit('drag');
  f.board().emit('up');
  const current = () => f.w.SpaceMathModel.evaluate(f.app.getState())[attached.id];
  assert.deepEqual([current().x, current().y], [4, 2], 'dragging past the segment stops at its endpoint');

  f.select(attached.id);
  f.d.getElementById('edit-parameter').value = '.25';
  f.submit();
  assert.deepEqual([current().x, current().y], [1, .5], 'the precise editor preserves the segment constraint');
  f.d.getElementById('undo').click();
  assert.deepEqual([current().x, current().y], [4, 2]);
  f.d.getElementById('redo').click();
  f.app.setReadOnly(true);
  f.select(attached.id);
  assert.equal(f.d.getElementById('edit-parameter').disabled, true);
  f.d.getElementById('edit-parameter').value = '.5';
  f.d.getElementById('edit-object-form').dispatchEvent(new f.w.Event('submit', { bubbles: true, cancelable: true }));
  assert.deepEqual([current().x, current().y], [1, .5], 'an observer cannot alter the saved parameter');
});

test('vector transfer and both tangent branches remain attached to their defining objects', t => {
  const f = fixture(t);
  f.install([point('a', 0, 0), point('b', 4, 0), point('c', 0, 1)]);
  const tool = name => f.d.querySelector('[data-tool="' + name + '"]').click();
  const byType = name => f.app.getState().objects.filter(item => item.type === name);
  const evaluate = () => f.w.SpaceMathModel.evaluate(f.app.getState());
  tool('vector'); f.select('a'); f.select('b');
  const [vector] = byType('vector');
  assert.ok(vector);
  tool('translate'); f.select('c'); f.select(vector.id);
  const [translated] = byType('translate');
  assert.deepEqual([evaluate()[translated.id].x, evaluate()[translated.id].y], [4, 1]);

  tool('circleRadius'); f.d.getElementById('tool-parameter').value = '2'; f.select('a');
  const [circle] = byType('circleRadius');
  assert.equal(evaluate()[circle.id].r, 2);
  tool('tangent'); f.select(circle.id); f.select('b');
  const branches = byType('tangent');
  assert.equal(branches.length, 2, 'a single construction stores both tangent branches');
  assert.equal(branches.filter(branch => evaluate()[branch.id].defined).length, 2);

  tool('move'); f.select('b');
  f.d.getElementById('edit-x').value = '2';
  f.submit();
  assert.equal(branches.filter(branch => evaluate()[branch.id].defined).length, 1, 'there is only one tangent at the contact point');
  assert.equal(evaluate()[translated.id].x, 2, 'vector transfer follows the changed vector');
  f.d.getElementById('undo').click();
  assert.deepEqual(byType('tangent').map(branch => branch.id), branches.map(branch => branch.id), 'both identities survive moving through the tangency boundary');
  assert.equal(branches.filter(branch => evaluate()[branch.id].defined).length, 2);
});

test('a graph table follows formula and slider edits, then opens in read-only mode without echoing changes', t => {
  const author = fixture(t), viewer = fixture(t);
  author.d.getElementById('function-expression').value = 'a*sqrt(x)';
  author.d.querySelector('#add-function-form button').click();
  const graph = author.app.getState().objects.find(item => item.type === 'functionGraph');
  author.select(graph.id);
  author.d.getElementById('add-function-table').click();
  const table = author.app.getState().objects.find(item => item.type === 'functionTable');
  assert.ok(table, 'the selected graph can create a saved table');
  author.select(table.id);
  for (const [key, value] of [['start', '-1'], ['end', '1'], ['step', '1']]) {
    author.d.getElementById('edit-table-' + key).value = value;
  }
  author.submit();
  assert.deepEqual(tableCells(author).map(row => row[1]), ['—', '0', '1']);

  author.select(graph.id);
  author.d.getElementById('edit-expression').value = 'a*sqrt(x)+b';
  author.submit();
  const edited = author.app.getState();
  assert.equal(edited.objects.find(item => item.id === graph.id).expression, 'a*sqrt(x)+b');
  assert.deepEqual(Array.from(edited.objects.find(item => item.id === table.id).parents), [graph.id]);
  author.select(table.id);
  assert.deepEqual(tableCells(author).map(row => row[1]), ['—', '1', '2'], 'adding a formula parameter retains its downstream table');

  const a = edited.objects.find(item => item.type === 'slider' && item.name === 'a');
  const range = author.d.querySelector('[data-slider="' + a.id + '"]');
  range.value = '3';
  range.dispatchEvent(new author.w.Event('input', { bubbles: true }));
  assert.deepEqual(tableCells(author).map(row => row[1]), ['—', '1', '4'], 'table cells recompute during slider input');
  assert.equal(range.isConnected, true, 'updating the table must not replace the slider being dragged');
  range.dispatchEvent(new author.w.Event('change', { bubbles: true }));

  viewer.app.setReadOnly(true);
  const received = JSON.stringify(author.app.getState()), outgoing = [];
  viewer.app.subscribe(() => outgoing.push(viewer.app.getState()));
  viewer.app.applyState(viewer.w.JSON.parse(received));
  viewer.select(table.id);
  assert.deepEqual(tableCells(viewer), tableCells(author));
  assert.equal(viewer.d.getElementById('edit-table-end').disabled, true);
  viewer.d.getElementById('edit-table-end').value = '2';
  viewer.d.getElementById('edit-object-form').dispatchEvent(new viewer.w.Event('submit', { bubbles: true, cancelable: true }));
  assert.equal(JSON.stringify(viewer.app.getState()), received);

  const nextRange = author.d.querySelector('[data-slider="' + a.id + '"]');
  nextRange.value = '4';
  nextRange.dispatchEvent(new author.w.Event('input', { bubbles: true }));
  nextRange.dispatchEvent(new author.w.Event('change', { bubbles: true }));
  viewer.app.applyState(viewer.w.JSON.parse(JSON.stringify(author.app.getState())));
  assert.deepEqual(tableCells(viewer).map(row => row[1]), ['—', '1', '5'], 'an open table follows the author without needing to be selected again');
  assert.deepEqual(outgoing, []);
});

test('graph solution tools create both persistent branches, undo together and refuse writes in observation', t => {
  const f = fixture(t);
  f.install([{ id: 'g', type: 'functionGraph', label: 'f', parents: [], expression: 'x^2-4' }, { id: 'h', type: 'functionGraph', label: 'g', parents: [], expression: 'x+2' }]);
  const tool = type => f.d.querySelector('[data-tool="' + type + '"]').click();
  tool('functionRoot'); f.select('g');
  let model = f.app.getState(), roots = model.objects.filter(o => o.type === 'functionRoot');
  assert.equal(roots.length, 2); assert.deepEqual(Array.from(roots, o => o.branch), [0, 1]);
  assert.equal(f.w.SpaceMathModel.evaluate(model)[roots[0].id].x, -2);
  f.d.getElementById('undo').click(); assert.equal(f.app.getState().objects.length, 2);
  f.d.getElementById('redo').click(); assert.equal(f.app.getState().objects.length, 4);
  tool('functionIntersection'); f.select('g'); f.select('h');
  model = f.app.getState(); const intersections = model.objects.filter(o => o.type === 'functionIntersection');
  assert.equal(intersections.length, 2);
  const values = f.w.SpaceMathModel.evaluate(model);
  assert.deepEqual(Array.from(intersections, o => [values[o.id].x, values[o.id].y]), [[-2, 0], [3, 5]]);
  tool('move'); f.select(roots[0].id);
  assert.equal(f.d.getElementById('coordinate-editor').hidden, true);
  assert.match(f.d.getElementById('selected-description').textContent, /≈/);
  const persisted = JSON.parse(f.w.localStorage.getItem('mathexam.spacemath.draft.v1'));
  assert.deepEqual(persisted.objects.map(o => o.type), Array.from(model.objects, o => o.type));
  const reloaded = fixture(t, persisted);
  assert.deepEqual(JSON.parse(JSON.stringify(reloaded.app.getState())), persisted, 'actual editor startup restores local storage');
  let writes = 0; f.app.subscribe(() => writes++);
  f.app.setReadOnly(true);
  const before = JSON.stringify(f.app.getState());
  tool('functionRoot'); f.select('g'); f.d.getElementById('undo').click(); f.submit();
  assert.equal(JSON.stringify(f.app.getState()), before); assert.equal(writes, 0);
  for (const type of ['functionRoot', 'functionIntersection']) assert.equal(f.d.querySelector('[data-tool="' + type + '"]').disabled, true);
});

test('graph solutions update through sliders and synchronized observation, with missing branches retained', t => {
  const editor = fixture(t), observer = fixture(t);
  editor.install([{ id: 'a', type: 'slider', label: 'a', parents: [], name: 'a', min: -5, max: 5, step: 1, value: 1 }, { id: 'f', type: 'functionGraph', label: 'f', parents: ['a'], expression: 'x^2+a' }]);
  editor.d.querySelector('[data-tool="functionRoot"]').click(); editor.select('f');
  editor.d.querySelector('[data-tool="move"]').click();
  const roots = Array.from(editor.app.getState().objects.filter(o => o.type === 'functionRoot'), o => o.id);
  observer.app.setReadOnly(true);
  let observerWrites = 0; observer.app.subscribe(() => observerWrites++);
  const sync = () => observer.app.applyState(observer.w.JSON.parse(JSON.stringify(editor.app.getState())));
  editor.app.subscribe(sync); sync();
  for (const [value, expected] of [[0, [0]], [-4, [-2, 2]], [1, []], [-1, [-1, 1]]]) {
    const input = editor.d.querySelector('[data-slider="a"]'); input.value = String(value);
    input.dispatchEvent(new editor.w.Event('input')); input.dispatchEvent(new editor.w.Event('change'));
    const values = observer.w.SpaceMathModel.evaluate(observer.app.getState());
    assert.deepEqual(roots.filter(id => values[id].defined).map(id => values[id].x), expected);
    assert.equal(observer.app.getState().objects.length, 4);
  }
  assert.equal(observerWrites, 0);
  const restored = fixture(t); restored.app.applyState(restored.w.JSON.parse(JSON.stringify(observer.app.getState())));
  assert.deepEqual(JSON.parse(JSON.stringify(restored.app.getState())), JSON.parse(JSON.stringify(editor.app.getState())));
});

test('unsupported formulas and numerical uncertainty stay visible; tiny valid roots never display as zero', t => {
  const f = fixture(t);
  for (const [expression, expected] of [['1/x', /только прямые и параболы/], ['(x-1)^2-1e-30', /Недостаточно численной точности/], ['0', /Бесконечно много корней/], ['x^2+1', /Действительных решений нет/], ['x^2', /касание/]]) {
    f.install([{ id: 'g', type: 'functionGraph', label: 'f', parents: [], expression }, { id: 'r', type: 'functionRoot', label: 'R', parents: ['g'], branch: 0 }]);
    f.select('r'); assert.match(f.d.getElementById('selected-description').textContent, expected);
  }
  f.install([{ id: 'g', type: 'functionGraph', label: 'f', parents: [], expression: 'x-1e-20' }, { id: 'r', type: 'functionRoot', label: 'R', parents: ['g'], branch: 0 }]);
  f.select('r'); assert.match(f.d.getElementById('selected-description').textContent, /1E-20/);
});

test('classroom batch tools create one undo step and keep regular polygon dependencies', t => {
  const f = fixture(t);
  f.install([point('a', 0, 0), point('b', 2, 0)]);
  f.d.querySelector('[data-tool="regularPolygon"]').click();
  f.d.getElementById('tool-parameter').value = '4';
  f.select('a'); f.select('b');
  const square = f.app.getState(), polygon = square.objects.find(o => o.type === 'polygon');
  assert.ok(polygon);
  assert.equal(new Set(square.objects.filter(o => f.w.SpaceMathModel.pointTypes.includes(o.type)).map(o => o.label)).size, 4);
  const values = f.w.SpaceMathModel.evaluate(square);
  assert.ok(Math.abs(values[polygon.parents[2]].x - 2) < 1e-12);
  assert.ok(Math.abs(values[polygon.parents[2]].y - 2) < 1e-12);
  f.d.getElementById('undo').click();
  assert.equal(f.app.getState().objects.length, 2);
  f.d.getElementById('redo').click();
  assert.deepEqual(f.app.getState(), square);
  f.d.querySelector('[data-tool="move"]').click(); f.select('b');
  f.d.getElementById('edit-x').value = '4'; f.submit();
  assert.ok(Math.abs(f.w.SpaceMathModel.evaluate(f.app.getState())[polygon.parents[2]].y - 4) < 1e-12);
  const beforeInvalid = f.app.getState();
  f.d.querySelector('[data-tool="regularPolygon"]').click();
  f.d.getElementById('tool-parameter').value = '3.5'; f.select('a'); f.select('b');
  assert.deepEqual(f.app.getState(), beforeInvalid, 'fractional vertex count makes no partial batch');
});

test('whole polygon transformation shares a single editable angle and follows original vertices', t => {
  const f = fixture(t);
  f.install([point('a', 0, 0), point('b', 2, 0), point('c', 0, 2),
    {id:'tri',type:'polygon',label:'ABC',parents:['a','b','c']}]);
  f.d.querySelector('[data-tool="rotate"]').click();
  f.d.getElementById('tool-parameter').value = '90';
  f.select('tri'); f.select('a');
  const initial = f.app.getState(), descriptor = initial.objects.find(o => o.type === 'transformation');
  const image = initial.objects.filter(o => o.type === 'polygon').at(-1);
  assert.ok(descriptor && image);
  const images = initial.objects.filter(o => o.type === 'transformedPoint');
  assert.equal(images.length, 3);
  assert.ok(images.every(o => o.parents[1] === descriptor.id));
  f.d.querySelector('[data-tool="move"]').click(); f.select(descriptor.id);
  f.d.getElementById('edit-parameter').value = '180'; f.submit();
  const values = f.w.SpaceMathModel.evaluate(f.app.getState());
  assert.equal(values[image.parents[1]].x, -2);
  assert.equal(values[image.parents[1]].y, 0);
  assert.equal(values[image.parents[2]].x, 0);
  assert.equal(values[image.parents[2]].y, -2);
  f.select('b'); f.d.getElementById('edit-x').value = '3'; f.submit();
  assert.equal(f.w.SpaceMathModel.evaluate(f.app.getState())[image.parents[1]].x, -3);
});

test('saved appearance hides auxiliaries without removing dependent geometry and stays readonly to observers', t => {
  const f = fixture(t);
  f.install([point('a', 0, 0), point('b', 4, 0), {id:'m',type:'midpoint',label:'M',parents:['a','b']},
    {id:'seg',type:'segment',label:'AB',parents:['a','b']}]);
  f.select('a'); f.d.getElementById('appearance-visible').checked = false;
  f.d.getElementById('appearance-color').value = '#c62828'; f.submit();
  const state = f.app.getState();
  assert.equal(state.objects[0].appearance.visible, false);
  assert.equal(f.w.SpaceMathModel.evaluate(state).m.x, 2);
  const hidden = f.created().find(o => o.type === 'point' && o.attrs.name === 'A');
  assert.equal(hidden.attrs.visible(), false);
  f.select('seg'); f.d.getElementById('appearance-dash').value = '1';
  f.d.getElementById('appearance-width').value = '5'; f.submit();
  const line = f.created().find(o => o.type === 'line');
  assert.equal(line.attrs.dash, 1); assert.equal(line.attrs.strokeWidth, 5);
  f.app.setReadOnly(true);
  for (const id of ['appearance-visible','appearance-label','appearance-color','appearance-width','appearance-dash','appearance-fill'])
    assert.equal(f.d.getElementById(id).disabled, true, id);
  const before = f.app.getState();
  f.d.getElementById('appearance-color').value = '#000000';
  f.d.getElementById('edit-object-form').dispatchEvent(new f.w.Event('submit',{bubbles:true,cancelable:true}));
  assert.deepEqual(f.app.getState(), before);
  const incoming = f.app.getState(); incoming.objects[1].x = 6; f.app.applyState(incoming);
  assert.match(f.d.getElementById('selected-heading').textContent, /Отрезок/);
  assert.equal(f.w.SpaceMathModel.evaluate(f.app.getState()).m.x, 3);
});

test('valid imported appearance remains editable and tiny infinite line direction stays drawable', t => {
  const f = fixture(t);
  f.install([point('a',0,0),point('b',1e-20,0),point('c',1e6,0),
    {id:'line',type:'line',label:'l',parents:['a','b']},
    {id:'par',type:'parallel',label:'p',parents:['line','c']},
    {id:'poly',type:'polygon',label:'ABC',parents:['a','b','c'],appearance:{fillOpacity:.123,dash:1}}]);
  const parallel = f.created().filter(o => o.type === 'line')[1];
  assert.notEqual(parallel.args[0][0](), parallel.args[1][0](), 'display direction of infinite line is normalized');
  f.select('poly'); f.d.getElementById('object-label').value = 'P'; f.submit();
  const polygon = f.app.getState().objects.find(o => o.id === 'poly');
  assert.equal(polygon.label, 'P'); assert.equal(polygon.appearance.fillOpacity, .123); assert.equal(polygon.appearance.dash, 1);
});
