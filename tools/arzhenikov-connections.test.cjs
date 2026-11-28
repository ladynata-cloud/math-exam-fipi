'use strict';

const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const folder = path.resolve(__dirname, '../trainers/oge-basics/multiplication-division');
const filename = path.join(folder, 'arzhenikov-course-connections.js');
const track = require(filename);
const engine = require(path.join(folder, 'arzhenikov-course-engine.js'));
const lessons = track.lessons;
const tasks = lessons.flatMap(lesson => lesson.tasks);
const byTask = new Map(tasks.map(task => [task.id, task]));
const clone = value => JSON.parse(JSON.stringify(value));

// Independent exact arithmetic. The browser engine and bank do not implement
// this BigInt representation or evaluate these typed expression trees.
function gcd(a, b) {
  a = a < 0n ? -a : a; b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a || 1n;
}
function rational(n, d = 1n) {
  assert.notEqual(d, 0n, 'A mathematical divisor cannot be zero');
  if (d < 0n) { n = -n; d = -d; }
  const common = gcd(n, d);
  return {n: n / common, d: d / common};
}
function exact(value) {
  const text = String(value).trim().replace(',', '.');
  let match = text.match(/^([+-]?)(\d+)\s+(\d+)\/(\d+)$/);
  if (match) {
    const d = BigInt(match[4]), n = BigInt(match[3]);
    assert(n < d && d > 0n, 'A mixed number has a proper fractional part');
    return rational((BigInt(match[2]) * d + n) * (match[1] === '-' ? -1n : 1n), d);
  }
  match = text.match(/^([+-]?\d+)\/(\d+)$/);
  if (match) return rational(BigInt(match[1]), BigInt(match[2]));
  match = text.match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
  assert(match, 'An exact literal is required, not executable text: ' + text);
  const part = match[3] || '';
  return rational(BigInt(match[2] + part) * (match[1] === '-' ? -1n : 1n), 10n ** BigInt(part.length));
}
const add = (a, b) => rational(a.n * b.d + b.n * a.d, a.d * b.d);
const subtract = (a, b) => rational(a.n * b.d - b.n * a.d, a.d * b.d);
const multiply = (a, b) => rational(a.n * b.n, a.d * b.d);
const divide = (a, b) => rational(a.n * b.d, a.d * b.n);
function apply(op, args) {
  if (op === 'r-value') { assert.equal(args.length, 1); return args[0]; }
  if (op === 'r-add') { assert(args.length >= 2); return args.reduce(add); }
  if (op === 'r-mul') { assert(args.length >= 2); return args.reduce(multiply); }
  if (op === 'r-sub') { assert.equal(args.length, 2); return subtract(...args); }
  if (op === 'r-div') { assert.equal(args.length, 2); return divide(...args); }
  assert.fail('Unreviewed mathematical operation: ' + op);
}
function evaluate(node, depth = 0) {
  assert(node && typeof node === 'object' && depth < 24, 'A bounded typed AST is required');
  if (node.type === 'value') {
    assert.deepEqual(Object.keys(node).sort(), ['type', 'value']);
    assert.equal(typeof node.value, 'string');
    return exact(node.value);
  }
  assert.equal(node.type, 'operation');
  assert.deepEqual(Object.keys(node).sort(), ['args', 'op', 'type']);
  assert(Array.isArray(node.args));
  return apply(node.op, node.args.map(child => evaluate(child, depth + 1)));
}
function oracle(item) {
  const c = item.calculation;
  assert(c && Array.isArray(c.args), item.id + ': explicit calculation metadata');
  if (c.op === 'r-expression') {
    assert.deepEqual(c.args, []);
    return evaluate(c.ast);
  }
  assert(!Object.hasOwn(c, 'ast'));
  return apply(c.op, c.args.map(exact));
}

// Each fixture was solved from the Russian condition, not copied from the
// calculation metadata. Anchors keep the reviewed quantities and the question
// together. This checks all 48 stories, including both independent pairs.
const stories = {
  'c-quotient': [
    ['3/4', ['Три одинаковые лепёшки', 'четырьмя детьми']],
    ['5/3', ['Пять литров', 'в три одинаковых кувшина']],
    ['2/5', ['Две одинаковые плитки', 'пятью друзьями']],
    ['7/4', ['Семь метров', 'четырьмя мастерицами']],
    ['5/6', ['шести одинаковых флажков', 'пять метров', 'остатка нет']],
    ['8/3', ['Восемь литров', 'тремя столами']],
    ['3/8', ['Три килограмма', 'восемью семьями']],
    ['11/4', ['Одиннадцать метров', 'четырьмя командами']]
  ],
  'c-mixed': [
    ['7', ['2 1/3 м', 'по 1/3 м', 'Сколько таких кусочков']],
    ['11/4', ['11/4 л', 'смешанное число']],
    ['9', ['1 4/5 м', '1/5 м', 'Сколько пятых']],
    ['3', ['15/5 кг', 'целых килограммов']],
    ['17/6', ['17/6 м', 'смешанным числом']],
    ['17', ['3 2/5 м', 'по 1/5 м', 'Сколько таких отрезков']],
    ['21/8', ['21/8 л', 'смешанным числом']],
    ['8', ['2 2/3 м', 'по 1/3 м', 'всю ткань']]
  ],
  'c-common': [
    ['2/3', ['12/18', 'несократимой']],
    ['5/12', ['1/4 листа', '1/6', 'всего']],
    ['3/5', ['15/25 м', 'несократимой']],
    ['7/12', ['5/6 л', '1/4 л', 'осталось']],
    ['3/4', ['18/24', 'несократимой']],
    ['25/24', ['2/3 м', '3/8 м', 'израсходовали']],
    ['3/5', ['21/35', 'несократимой']],
    ['13/24', ['7/8 кг', '1/3 кг', 'осталось']]
  ],
  'c-units': [
    ['43/20', ['1 м 35 см', '80 см', 'в метрах']],
    ['65', ['1 ч 30 мин', '25 мин', 'минут осталось']],
    ['850', ['1 кг 200 г', '350 г', 'граммов осталось']],
    ['23/20', ['0,75 л', '400 мл', 'литров воды стало']],
    ['45', ['15:40', '16:25', 'того же дня']],
    ['33/20', ['2,4 м', '75 см', 'метров ленты осталось']],
    ['7/4', ['1 ч 45 мин', 'в часах десятичной']],
    ['8', ['150 г', '1,2 кг', 'полных наборов']]
  ],
  'c-percent': [
    ['1/4', ['25%', 'несократимую обыкновенную']],
    ['20', ['1/5 книги', 'процентов всей книги']],
    ['40', ['0,4 всей выставки', 'процентов']],
    ['30', ['200 семян', '15%', 'Сколько семян']],
    ['12', ['80 страниц', '15%', 'страниц с иллюстрациями']],
    ['60', ['18 открыток', '30%', 'всех приготовленных']],
    ['7', ['35 кг', '20%', 'килограммов']],
    ['12', ['9 рисунков', '75%', 'всех рисунков']]
  ],
  'c-mixed-actions': [
    ['3', ['двух одинаковых украшений', '1 1/4 м', 'ещё 1/2 м']],
    ['3', ['2 1/2 л', 'Оставили 1/2 л', 'по 2/3 л']],
    ['5', ['(1 1/4 + 3/4) : 2/5']],
    ['3', ['3 3/4 − 1 1/2 × 1/2']],
    ['2', ['две ленты', 'по 3/4 м', 'одну ленту длиной 1/2 м']],
    ['1/2', ['2 1/4 м', 'отрезали 3/4 м', 'между тремя мастерами']],
    ['9', ['1 1/2 л', '0,75 л', 'по 1/4 л']],
    ['21/10', ['3 1/2 м', '2/5 всей тесьмы', 'Сколько метров осталось']]
  ]
};

test('six bounded bridge lessons retain the existing course contract and source attribution', () => {
  assert.equal(track.id, 'connections');
  assert.deepEqual(lessons.map(lesson => lesson.id),
    ['c-quotient', 'c-mixed', 'c-common', 'c-units', 'c-percent', 'c-mixed-actions']);
  assert.equal(tasks.length, 48);
  assert.equal(new Set(tasks.map(task => task.id)).size, 48);
  const oldLessons = ['arithmetic', 'written', 'fractions', 'decimals', 'algebra', 'geometry']
    .flatMap(name => require(path.join(folder, 'arzhenikov-course-' + name + '.js')).lessons);
  const allById = new Map([...oldLessons, ...lessons].map(lesson => [lesson.id, lesson]));
  for (const lesson of lessons) {
    assert.equal(lesson.tasks.length, 8);
    assert.equal(new Set(lesson.tasks.map(task => task.prompt)).size, 8);
    assert(track.bands.some(band => band.id === lesson.band));
    for (const field of ['title', 'goal', 'intro', 'rule', 'physical', 'sourcePages']) {
      assert.equal(typeof lesson[field], 'string', lesson.id + '.' + field);
      assert(lesson[field].length >= 12, lesson.id + '.' + field);
    }
    for (const field of ['problem', 'expression', 'explanation']) assert(lesson.worked[field].length >= 12);
    assert(track.sources.some(source => source.lessonIds.includes(lesson.id) && source.pages === lesson.sourcePages && source.href === lesson.sourceHref));
    for (const id of lesson.prerequisites) assert(allById.has(id), lesson.id + ': known prerequisite ' + id);
    assert.equal(lesson.reason.options.length, 3);
    assert.equal(lesson.reason.options.filter(option => option.id === lesson.reason.answer).length, 1);
    assert(lesson.reason.explanation.length > 30);
    for (const [index, task] of lesson.tasks.entries()) {
      assert.equal(task.id, lesson.id + '-' + (index + 1));
      for (const field of ['prompt', 'hint', 'explanation']) assert(task[field].length >= 20, task.id + '.' + field);
      assert.equal(typeof task.unit, 'string');
      assert.equal(typeof task.label, 'string');
      assert(Array.isArray(task.steps));
    }
    for (const link of lesson.connections) {
      if (link.href.startsWith('#course-')) assert(allById.has(link.href.slice(8)), 'Known return lesson: ' + link.href);
      else assert(link.href.startsWith('/trainers/oge-basics/percentages/'));
    }
  }
  for (const band of track.bands) assert(lessons.some(lesson => lesson.band === band.id));
  // A cycle would make the advertised prerequisite route impossible.
  function walk(id, active = new Set()) {
    assert(!active.has(id), 'Prerequisite cycle at ' + id);
    const next = new Set([...active, id]);
    for (const parent of allById.get(id).prerequisites || []) walk(parent, next);
  }
  lessons.forEach(lesson => walk(lesson.id));
});

test('all 48 reviewed conditions agree with independently hand-worked quantities', () => {
  let reviewed = 0;
  for (const [lessonId, conditions] of Object.entries(stories)) {
    assert.equal(conditions.length, 8);
    conditions.forEach(([expected, anchors], index) => {
      const task = byTask.get(lessonId + '-' + (index + 1));
      assert(task);
      for (const anchor of anchors) assert(task.prompt.includes(anchor), task.id + ': reviewed story anchor ' + anchor);
      assert.deepEqual(exact(task.answer), exact(expected), task.id + ': hand-worked answer');
      assert.deepEqual(oracle(task), exact(expected), task.id + ': mathematical model matches the story');
      reviewed += 1;
    });
  }
  assert.equal(reviewed, 48);
});

test('every final and intermediate calculation is exact and accepted by the existing engine', () => {
  let checked = 0;
  for (const task of tasks) {
    for (const item of [task, ...task.steps]) {
      assert.deepEqual(exact(item.answer), oracle(item), task.id + ': independent rational result');
      assert.equal(engine.checkAnswer(item, String(item.answer)).kind, 'correct', task.id + ': canonical format');
      checked += 1;
    }
  }
  assert.equal(checked, 51, '48 final answers and three meaningful training steps');
});

test('unscaffolded check pairs do not force a method, a denominator or hidden intermediate work', () => {
  let count = 0;
  for (const lesson of lessons) {
    for (const task of lesson.tasks.slice(4)) {
      assert.deepEqual(task.steps, [], task.id + ': final answer is available immediately');
      assert(!Object.hasOwn(task, 'requiredDenominator'), task.id + ': no dictated common denominator');
      // Events may follow one another in a story; an imperative telling the
      // pupil which calculation to do next would disclose the method.
      assert.doesNotMatch(task.prompt, /(?:сначала|затем)\s+(?:вычисли|найди|сложи|вычти|переведи)|общим знаменателем|со знаменателем|приведи к|умножь|раздели числитель/i);
      const record = engine.taskRecord(task);
      assert.equal(record.modelShown, false);
      assert.equal(record.modelReady, false);
      record.input = String(task.answer);
      assert.equal(engine.assess(task, record).kind, 'correct', task.id + ': no hidden steps block an independent answer');
      assert.equal(record.firstCorrect, true);
      assert.equal(record.firstHelpUsed, false);
      count += 1;
    }
  }
  assert.equal(count, 24);
});

test('common denominators remain flexible while a reduction task still requires a reduced result', () => {
  const sum = byTask.get('c-common-6');
  for (const value of ['25/24', '50/48', '75/72', '1 1/24']) {
    assert.equal(engine.checkAnswer(sum, value).kind, 'correct', 'Valid sum represented as ' + value);
  }
  const difference = byTask.get('c-common-8');
  for (const value of ['13/24', '26/48', '39/72']) assert.equal(engine.checkAnswer(difference, value).kind, 'correct');
  const reduced = byTask.get('c-common-5');
  assert.equal(engine.checkAnswer(reduced, '3/4').kind, 'correct');
  assert.equal(engine.checkAnswer(reduced, '9/12').kind, 'format', 'Right value is distinguished from the requested reduced notation');
  assert.equal(engine.checkAnswer(sum, '5/11').kind, 'wrong', 'Adding numerators and denominators is not fraction addition');
});

test('time, whole-versus-part and mixed-number checks reject common conceptual errors', () => {
  assert.equal(engine.checkAnswer(byTask.get('c-units-7'), '1,75').kind, 'correct');
  assert.equal(engine.checkAnswer(byTask.get('c-units-7'), '1,45').kind, 'wrong', 'Minutes are not hundredths of an hour');
  assert.equal(engine.checkAnswer(byTask.get('c-units-5'), '85').kind, 'wrong', 'Do not subtract clock digits as a decimal number');
  assert.equal(engine.checkAnswer(byTask.get('c-percent-6'), '5,4').kind, 'format', 'The whole is an integer number of cards');
  assert.equal(engine.checkAnswer(byTask.get('c-percent-6'), '18').kind, 'wrong', 'The known part is not the whole');
  assert.equal(engine.checkAnswer(byTask.get('c-percent-6'), '60').kind, 'correct');
  assert.equal(engine.checkAnswer(byTask.get('c-mixed-5'), '17/6').kind, 'format', 'The reverse conversion explicitly asks for a mixed number');
  assert.equal(engine.checkAnswer(byTask.get('c-mixed-5'), '2 5/6').kind, 'correct');
  assert.equal(engine.checkAnswer(byTask.get('c-mixed-6'), '3 2/5').kind, 'format', 'Counting fifths is not copying the given mixed number');
  assert.equal(engine.checkAnswer(byTask.get('c-mixed-6'), '17').kind, 'correct');
});

test('models have reachable controls and preserve multiple complete wholes', () => {
  const shapes = {
    'fraction-strip': ['parts', 'numerator'],
    'fraction-pair': ['parts', 'left', 'right'],
    'decimal-place': ['whole', 'tenths', 'hundredths', 'thousandths']
  };
  for (const task of tasks) {
    const {model} = task;
    assert(Object.hasOwn(shapes, model.kind), task.id + ': existing reviewed model');
    assert.deepEqual(model.controls.map(c => c.id), shapes[model.kind]);
    assert(model.caption.length >= 25);
    assert(model.controls.some(c => c.initial !== c.target), task.id + ': a real model action');
    const record = engine.taskRecord(task);
    for (const c of model.controls) {
      for (const value of [c.initial, c.target]) {
        assert(Number.isInteger(value) && value >= c.min && value <= c.max, task.id + '.' + c.id);
        assert(Number.isInteger((value - c.min) / c.step));
      }
      record.model[c.id] = c.target;
    }
    record.moves = 1;
    assert.equal(engine.modelMatches(task, record), true);
    if (model.kind === 'fraction-strip' || model.kind === 'fraction-pair') {
      assert(record.model.parts >= 1 && record.model.parts <= 35, 'Readable equal parts');
    }
  }
  for (const id of ['c-quotient-2', 'c-mixed-1', 'c-mixed-2', 'c-mixed-6', 'c-mixed-7']) {
    const values = Object.fromEntries(byTask.get(id).model.controls.map(c => [c.id, c.target]));
    assert(values.numerator > values.parts, id + ': model must contain more than one whole');
  }
  const q = byTask.get('c-quotient-6').model.controls;
  assert.equal(q.find(c => c.id === 'numerator').target, 8);
  assert.equal(q.find(c => c.id === 'parts').target, 3);
  // Existing renderer's public contract renders each whole separately.
  const renderer = fs.readFileSync(path.join(folder, 'arzhenikov-course-numbers.js'), 'utf8');
  assert.match(renderer, /Math\.ceil\(numerator \/ parts\)/);
  assert.match(renderer, /whole < count/);
});

test('wrong first answers, help and new-pair evidence survive reload independently', () => {
  const lesson = lessons.find(item => item.id === 'c-common');
  const state = engine.fresh(), rec = engine.record();
  state.active = lesson.id;
  state.lessons[lesson.id] = rec;
  for (const [i, task] of lesson.tasks.entries()) {
    const record = engine.taskRecord(task);
    rec.tasks[task.id] = record;
    if (i === 4) {
      record.input = '4/3'; assert.equal(engine.assess(task, record).kind, 'wrong');
      record.helpUsed = true; record.modelShown = true;
    }
    if (i === 5) { record.helpUsed = true; record.hint = true; }
    record.input = String(task.answer);
    assert.equal(engine.assess(task, record).kind, 'correct');
  }
  rec.reason = {choice: lesson.reason.answer, wrong: 0, passed: true};
  rec.completedAt = 100; rec.reviewedAt = 200; rec.phase = 'summary'; rec.cycle = 1; rec.cursor = 1;
  const reloaded = engine.normalize(clone(state), lessons);
  const result = reloaded.lessons[lesson.id];
  assert.equal(result.completedAt, 100);
  assert.equal(result.reviewedAt, 200);
  assert.equal(result.tasks['c-common-5'].firstCorrect, false);
  assert.equal(result.tasks['c-common-5'].firstHelpUsed, false);
  assert.equal(result.tasks['c-common-5'].helpUsed, true);
  assert.equal(result.tasks['c-common-6'].firstCorrect, true);
  assert.equal(result.tasks['c-common-6'].firstHelpUsed, true);
  for (const id of ['c-common-7', 'c-common-8']) {
    assert.equal(result.tasks[id].firstCorrect, true);
    assert.equal(result.tasks[id].firstHelpUsed, false);
  }
  assert.deepEqual(engine.progress(reloaded, lessons).independent.sort(), ['c-common-7', 'c-common-8']);
});

test('typed expression metadata cannot hide executable text or unreviewed arithmetic', () => {
  assert.throws(() => exact('2 + 3'));
  assert.throws(() => evaluate({type: 'call', function: 'eval', args: ['2 + 3']}));
  assert.throws(() => evaluate({type: 'value', value: 'globalThis.secret()'}));
  assert.throws(() => evaluate({type: 'operation', op: 'round', args: [{type: 'value', value: '1.5'}]}));
  assert.throws(() => evaluate({type: 'operation', op: 'r-div', args: [{type: 'value', value: '1'}, {type: 'value', value: '0'}]}));
  const altered = clone(byTask.get('c-mixed-actions-7'));
  altered.calculation.ast.op = 'r-mul';
  assert.notDeepEqual(oracle(altered), exact(stories['c-mixed-actions'][6][0]), 'A wrong operation fails the independently reviewed story');
});

test('the browser global and CommonJS expose the same self-contained course', () => {
  const context = {window: {}};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(filename, 'utf8'), context, {filename});
  assert.deepEqual(clone(context.window.ArzhenikovCourseConnections), clone(track));
});
