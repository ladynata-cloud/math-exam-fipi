'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const zlib = require('node:zlib');

const root = path.resolve(__dirname, '..');
const lessonPath = 'trainers/college-stereometry/polyhedra-sections/index.html';
const downloadPath = 'downloads/trainers/college-stereometry-lesson-7';
const html = fs.readFileSync(path.join(root, lessonPath), 'utf8');
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
const taskData = scripts.find(match => /\bid=["']task-data["']/.test(match[1]))[2];
const mainScript = scripts.find(match => match[2].includes('function parseMath('))[2];
const bank = JSON.parse(taskData);

// This small DOM fixture runs the actual lesson initialization and event
// handlers. It deliberately has no geometry, grading or lab-reset logic.
function fixture() {
  const ids = new Map();
  const attributes = text => Object.fromEntries([...text.matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
  class Element {
    constructor(tag, attrs = {}) {
      this.tagName = tag.toLowerCase();
      this.attrs = attrs;
      this.dataset = Object.fromEntries(Object.entries(attrs).filter(([k]) => k.startsWith('data-')).map(([k, v]) => [k.slice(5), v]));
      this.listeners = new Map();
      this.children = [];
      this.style = {};
      this.value = attrs.value || '';
      this.textContent = '';
      this._html = '';
      const classes = new Set((attrs.class || '').split(/\s+/));
      this.classList = {
        add: (...names) => names.forEach(name => classes.add(name)),
        remove: (...names) => names.forEach(name => classes.delete(name)),
        toggle: (name, on) => { if (on === undefined) on = !classes.has(name); on ? classes.add(name) : classes.delete(name); return on; }
      };
      if (attrs.id) ids.set(attrs.id, this);
    }
    set innerHTML(value) {
      for (const child of this.children) if (ids.get(child.attrs.id) === child) ids.delete(child.attrs.id);
      this._html = String(value);
      this.children = elements(this._html);
    }
    get innerHTML() { return this._html; }
    querySelectorAll(selector) { return this.children.filter(child => matches(child, selector)); }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    setAttribute(name, value) { this.attrs[name] = String(value); }
    addEventListener(name, handler) { this.listeners.set(name, handler); }
    click() { if (!this.disabled && this.onclick) this.onclick({ target: this, preventDefault() {} }); }
  }
  function matches(element, selector) {
    const attr = selector.match(/^\[([\w-]+)\]$/);
    return attr ? Object.hasOwn(element.attrs, attr[1]) : element.tagName === selector;
  }
  function elements(markup) {
    return [...markup.matchAll(/<([a-z][\w-]*)\b([^<>]*?)>/gi)].map(m => new Element(m[1], attributes(m[2])));
  }
  const staticElements = elements(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ''));
  new Element('script', { id: 'task-data' }).textContent = taskData;
  const document = {
    getElementById: id => ids.get(id) || null,
    querySelectorAll: selector => staticElements.filter(element => matches(element, selector)),
    createElement: tag => new Element(tag)
  };
  const saved = new Map();
  const context = vm.createContext({
    document,
    localStorage: { getItem: key => saved.get(key) || null, setItem: (key, value) => saved.set(key, value) },
    location: { hash: '' }, history: { replaceState() {} }, window: { print() {} }, console
  });
  vm.runInContext(mainScript, context, { filename: lessonPath, timeout: 1000 });
  return {
    context, document,
    read: expression => vm.runInContext(expression, context),
    chooseLab: kind => {
      const button = document.querySelectorAll('[data-lab]').find(element => element.dataset.lab === kind);
      assert(button, `Missing lab button: ${kind}`);
      button.click();
    },
    slide: (id, value) => {
      const input = document.getElementById(id);
      assert(input, `Missing slider: ${id}`);
      input.value = String(value);
      input.listeners.get('input')({ target: input });
    }
  };
}

test('36 distinct cards and 12 homework problems keep their complete learner content', () => {
  assert.equal(bank.length, 36);
  assert.equal(new Set(bank.map(task => task.id)).size, 36);
  assert.deepEqual(Object.fromEntries(['repeat', 'sections', 'solids', 'photo'].map(group => [group, bank.filter(task => task.group === group).length])), {
    repeat: 6, sections: 6, solids: 10, photo: 14
  });
  for (const task of bank) {
    assert(task.title && task.condition && task.figure, task.id);
    assert(task.hints.length && task.solution.length, `${task.id}: learner guidance`);
    assert(['numeric', 'choice', 'manual'].includes(task.type), task.id);
    if (task.type === 'choice') {
      assert(Number.isInteger(task.correct) && task.correct >= 0 && task.correct < task.choices.length, task.id);
      assert.equal(new Set(task.choices).size, task.choices.length, `${task.id}: distinct alternatives`);
    }
  }
  assert.equal(fixture().read('HOME.length'), 12);
});

test('numeric answer keys agree with independently calculated lengths, angles and counts', () => {
  const expected = {
    'repeat-01': [13], 'repeat-02': [10], 'repeat-03': [9], 'repeat-04': [8], 'repeat-05': [30],
    'solids-01': [4, 6, 4], 'solids-02': [6, 12, 8], 'solids-03': [8, 6],
    'solids-04': [60, 180], 'solids-05': [270],
    'photo-278a': [5], 'photo-278b': [4], 'photo-278c': [3], 'photo-278c-tetra': [6],
    'photo-279': [60], 'photo-282': [90]
  };
  assert.deepEqual(bank.filter(task => task.type === 'numeric').map(task => task.id).sort(), Object.keys(expected).sort());
  for (const [id, values] of Object.entries(expected)) {
    assert.deepEqual(bank.find(task => task.id === id).fields.map(field => field.value), values, id);
  }
  for (const [id, answer] of Object.entries({
    'solids-09': '18√3 см²', 'solids-10': '25√2 см²',
    'photo-281-area': '√3 : 1', 'photo-283a': 'a²√3 / 9', 'photo-283b': 'a²√2 / 9'
  })) {
    const task = bank.find(item => item.id === id);
    assert.equal(task.choices[task.correct], answer, id);
  }
});

test('the real expression parser accepts documented notation and preserves precedence', () => {
  const { parseMath } = fixture().context;
  const examples = [
    ['4√2', Math.sqrt(32)], ['sqrt(2)/9', Math.sqrt(2) / 9], ['13√3/2', 13 * Math.sqrt(3) / 2],
    ['3/5', 0.6], ['0,6', 0.6], ['2(3+4)', 14], ['(1+2)(3+4)', 21],
    ['2^3^2', 512], ['-2^2', -4], ['(-2)^2', 4], ['−3 + 5', 2],
    ['2³ + 3²', 17], ['π/2', Math.PI / 2], ['√(9+7)', 4], ['2×3·4', 24]
  ];
  for (const [input, expected] of examples) assert(Math.abs(parseMath(input) - expected) < 1e-10, input);
});

test('malformed, nonfinite and executable expressions are rejected', () => {
  const { context } = fixture();
  for (const input of [
    '', ' ', '1/0', '0/0', 'sqrt(-1)', '2**3', '2(3', '3)', '1.2.3',
    '12 см', '0x10', 'Infinity', 'NaN', '1e3', 'sqrt()', '()', '√', '2;3',
    'globalThis.injected=1', 'Math.sqrt(4)', '9'.repeat(141)
  ]) assert.throws(() => context.parseMath(input), undefined, input);
  assert.equal(context.injected, undefined);
});

test('counts require exact integers while measured values accept two decimal places', () => {
  const { parseMath, matchesField } = fixture().context;
  const countTasks = ['solids-01', 'solids-02', 'solids-03', 'photo-278a', 'photo-278b', 'photo-278c', 'photo-278c-tetra'];
  for (const id of countTasks) {
    for (const field of bank.find(task => task.id === id).fields) {
      assert(matchesField(parseMath(`${field.value * 2}/2`), field), `${id}: equivalent exact count`);
      for (const offset of [-0.01, 0.01, 0.5, 1]) assert.equal(matchesField(field.value + offset, field), false, `${id}: ${field.label} + ${offset}`);
    }
  }
  const diagonal = { label: 'Диагональ грани', unit: 'см', value: Math.sqrt(2) };
  assert(matchesField(parseMath('1,41'), diagonal));
  assert(matchesField(parseMath('√2'), diagonal));
  assert.equal(matchesField(parseMath('1,4'), diagonal), false);
});

test('switching from an edited cube resets visible and hidden prism parameters', () => {
  const clean = fixture();
  clean.chooseLab('prism-cut');
  const expectedFigure = clean.document.getElementById('lab-figure').innerHTML;
  const changed = fixture();
  changed.slide('lab-m', 0.2);
  changed.slide('lab-n', 0.8);
  changed.document.getElementById('step-next').click();
  assert.equal(changed.read('lab.n'), 0.8, 'the test must first exercise a changed cube');
  changed.chooseLab('prism-cut');
  assert.equal(changed.document.getElementById('lab-figure').innerHTML, expectedFigure);
  assert.equal(changed.document.getElementById('lab-m').value, '0.5');
  assert.equal(changed.document.getElementById('lab-k').value, '0.5');
  assert.equal(changed.read('lab.n'), 0.5, 'N has no prism slider and must not inherit the cube position');
  assert.equal(changed.read('lab.step'), 0);
  for (let step = 0; step < 5; step++) changed.document.getElementById('step-next').click();
  const svg = changed.document.getElementById('lab-figure').innerHTML;
  assert(!/NaN|Infinity/.test(svg));
  const point = text => text.split(',').map(Number);
  const edges = [...svg.matchAll(/<path class="(?:edge|hidden-edge)" d="M([^ ]+) L([^"]+)"/g)].map(match => [point(match[1]), point(match[2])]);
  assert.equal(edges.length, 9);
  const [A, B] = edges[0], C = edges[1][1], [A1, B1] = edges[3], C1 = edges[4][1];
  const along = (a, b, ratio) => a.map((value, i) => value + (b[i] - value) * ratio);
  // For three given midpoints the section plane is x + 3y + z = 3/2.
  // Hence BL/BC = 1/4 and A1P/A1C1 = 1/6, independently of the drawing projection.
  const expectedSection = [along(A1, B1, 0.5), along(B, B1, 0.5), along(B, C, 0.25), along(A, C, 0.5), along(A1, C1, 1 / 6)];
  const polygon = svg.match(/<polygon class="section-fill" points="([^"]+)"/);
  assert(polygon, 'the final prism step closes a section');
  const actual = polygon[1].split(' ').map(point);
  assert.equal(actual.length, 5);
  actual.forEach((vertex, i) => vertex.forEach((value, axis) => assert(Math.abs(value - expectedSection[i][axis]) < 1e-8, `section vertex ${i}, coordinate ${axis}`)));
});

// Read the ordinary ZIP produced for the student using only Node built-ins.
function unzip(buffer) {
  const end = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  assert(end >= 0, 'ZIP end of central directory');
  const count = buffer.readUInt16LE(end + 10), files = new Map();
  let cursor = buffer.readUInt32LE(end + 16);
  for (let i = 0; i < count; i++) {
    assert.equal(buffer.readUInt32LE(cursor), 0x02014b50);
    const method = buffer.readUInt16LE(cursor + 10), length = buffer.readUInt32LE(cursor + 20);
    const nameLength = buffer.readUInt16LE(cursor + 28), extraLength = buffer.readUInt16LE(cursor + 30), commentLength = buffer.readUInt16LE(cursor + 32);
    const name = buffer.toString('utf8', cursor + 46, cursor + 46 + nameLength), local = buffer.readUInt32LE(cursor + 42);
    assert.equal(buffer.readUInt32LE(local), 0x04034b50);
    const start = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
    const compressed = buffer.subarray(start, start + length);
    assert([0, 8].includes(method), `Unsupported ZIP compression: ${method}`);
    assert(!files.has(name), `Duplicate ZIP member: ${name}`);
    files.set(name, method === 8 ? zlib.inflateRawSync(compressed) : compressed);
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return files;
}

test('public page and download package are anonymous and contain only student files', () => {
  assert(!/Artem|Арт[её]м/i.test(html), 'No pupil name in public HTML, metadata or export filename');
  const files = unzip(fs.readFileSync(path.join(root, downloadPath, 'college-stereometry-lesson-7-package.zip')));
  assert.deepEqual([...files.keys()].sort(), ['Homework.pdf', 'README.txt', 'Trainer.html']);
  for (const name of files.keys()) assert(!/teacher|answer|ответ|Artem|Арт[её]м/i.test(name), name);
  for (const name of ['Trainer.html', 'README.txt']) {
    assert(!/Artem|Арт[её]м|\/workspace\//i.test(files.get(name).toString('utf8')), `${name}: no private data`);
  }
  const offline = files.get('Trainer.html').toString('utf8');
  assert.doesNotMatch(offline, /<script\b[^>]*\bsrc\s*=/i, 'offline lesson has no remote script dependency');
  const offlineRuntime = [...offline.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].find(match => match[2].includes('function parseMath('))[2];
  assert.equal(offlineRuntime, mainScript, 'online and offline lesson runtime agree');
  assert.match(offline, /href=["']\.\/Homework\.pdf["']/);
  const offlineData = [...offline.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].find(match => /\bid=["']task-data["']/.test(match[1]))[2];
  assert.deepEqual(JSON.parse(offlineData), bank, 'online and offline exercise banks agree');
  const pdf = files.get('Homework.pdf');
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  assert.deepEqual(pdf, fs.readFileSync(path.join(root, downloadPath, 'college-stereometry-lesson-7-homework.pdf')));
});
