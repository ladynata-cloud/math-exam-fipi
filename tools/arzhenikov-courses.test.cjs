'use strict';

const assert = require('node:assert/strict');
const {test} = require('node:test');
const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');

const directory = path.resolve(__dirname, '../trainers/oge-basics/multiplication-division');
const definitions = [
  ['arithmetic', 'ArzhenikovCourseArithmetic', 24],
  ['algebra', 'ArzhenikovCourseAlgebra', 8],
  ['geometry', 'ArzhenikovCourseGeometry', 8]
];
const tracks = definitions.map(([id]) => require(path.join(directory, 'arzhenikov-course-' + id + '.js')));
const lessons = tracks.flatMap(track => track.lessons);
const tasks = lessons.flatMap(lesson => lesson.tasks);
const byId = new Map(lessons.map(lesson => [lesson.id, lesson]));
const engine = require(path.join(directory, 'arzhenikov-course-engine.js'));

function meaningful(value, label, minimum = 8) {
  assert.equal(typeof value, 'string', label + ': text');
  assert(value.trim().length >= minimum, label + ': meaningful authored text');
  assert(!/\b(?:TODO|FIXME|undefined|NaN)\b/.test(value), label + ': no implementation placeholder');
}

// This verifier uses the mathematical operands, not the displayed answer or
// the browser checker. Fixed independently worked textual cases below add a
// separate check that the declared operation actually matches the question.
function derive(calculation, label) {
  assert(calculation && Array.isArray(calculation.args), label + ': mathematical operands');
  const {op, args} = calculation;
  assert(args.every(Number.isFinite), label + ': finite operands');
  const [a, b, c] = args;
  switch (op) {
    case 'sum': return args.reduce((total, value) => total + value, 0);
    case 'difference': assert.equal(args.length, 2, label); return a - b;
    case 'product': return args.reduce((total, value) => total * value, 1);
    case 'quotient': assert.equal(args.length, 2, label); assert.notEqual(b, 0, label); return a / b;
    case 'floor-quotient': assert(a >= 0 && b > 0, label); return Math.floor(a / b);
    case 'remainder': assert(a >= 0 && b > 0, label); return a - Math.floor(a / b) * b;
    case 'ceil-quotient': assert(a >= 0 && b > 0, label); return Math.ceil(a / b);
    case 'linear': assert.equal(args.length, 3, label); assert.notEqual(a, 0, label); return (c - b) / a;
    case 'fraction': assert.equal(args.length, 3, label); assert(c > 0, label); return a * b / c;
    case 'place': assert.equal(args.length, 3, label); return a * 100 + b * 10 + c;
    case 'perimeter': assert.equal(args.length, 2, label); assert(a > 0 && b > 0, label); return 2 * (a + b);
    case 'power': assert.equal(args.length, 2, label); return a ** b;
    case 'expression': assert.equal(args.length, 3, label); return a * b + c;
    default: assert.fail(label + ': unreviewed mathematical operation ' + op);
  }
}

test('three complete, freely addressable courses provide 40 lessons and 320 different conditions', () => {
  assert.equal(lessons.length, 40);
  assert.equal(tasks.length, 320);
  assert.equal(new Set(lessons.map(lesson => lesson.id)).size, lessons.length);
  assert.equal(new Set(tasks.map(task => task.id)).size, tasks.length);
  for (let index = 0; index < tracks.length; index++) {
    const track = tracks[index];
    assert.equal(track.id, definitions[index][0]);
    assert.equal(track.lessons.length, definitions[index][2]);
    for (const field of ['title', 'subtitle', 'description']) meaningful(track[field], track.id + '.' + field);
    const bands = new Map(track.bands.map(band => [band.id, band]));
    assert.equal(bands.size, track.bands.length);
    for (const band of track.bands) {
      meaningful(band.title, band.id + '.title', 2);
      meaningful(band.description, band.id + '.description');
      assert(track.lessons.some(lesson => lesson.band === band.id), band.id + ': nonempty learning section');
    }
    for (const lesson of track.lessons) {
      assert(/^[a-z][a-z0-9-]+$/.test(lesson.id), lesson.id + ': stable URL fragment');
      assert(bands.has(lesson.band), lesson.id + ': known learning section');
      assert.equal(lesson.tasks.length, 8, lesson.id + ': learning, transfer and a fresh repeat pair');
      assert.equal(new Set(lesson.tasks.map(task => task.prompt.trim())).size, 8, lesson.id + ': no duplicate question');
      for (const field of ['title', 'goal', 'intro', 'rule', 'physical']) meaningful(lesson[field], lesson.id + '.' + field);
      for (const field of ['problem', 'expression', 'explanation']) meaningful(lesson.worked[field], lesson.id + '.worked.' + field, field === 'expression' ? 3 : 12);
      for (const task of lesson.tasks) {
        for (const field of ['prompt', 'hint', 'explanation']) meaningful(task[field], task.id + '.' + field, 12);
        meaningful(task.label, task.id + '.label', 2);
        assert.equal(typeof task.unit, 'string', task.id + ': explicit unit, possibly dimensionless');
      }
    }
  }
});

test('all 320 authored numeric answers follow their mathematical quantities and valid domains', () => {
  for (const task of tasks) {
    assert(Number.isSafeInteger(task.answer), task.id + ': answer is an exact integer');
    const expected = derive(task.calculation, task.id);
    assert(Number.isSafeInteger(expected), task.id + ': no unintended rounding');
    assert.equal(task.answer, expected, task.id + ': mathematical result');
    if (task.calculation.op === 'remainder') {
      assert(task.answer >= 0 && task.answer < task.calculation.args[1], task.id + ': canonical remainder');
    }
    if (task.calculation.op === 'ceil-quotient') {
      const [total, capacity] = task.calculation.args;
      assert(task.answer * capacity >= total, task.id + ': everything fits');
      assert(total === 0 || (task.answer - 1) * capacity < total, task.id + ': no superfluous container');
    }
  }
});

test('independently worked conditions preserve critical meanings, units and boundary cases', () => {
  // Read from the authored Russian questions and worked independently. These
  // literals deliberately do not come from task.calculation or task.answer.
  const fixed = {
    'a-add-twenty-1': 12, 'a-sub-twenty-1': 7,
    'a-take-6': 0, 'a-take-8': 4, 'a-place-zero-1': 307, 'a-place-zero-4': 700,
    'a-remainder-1': 2, 'a-remainder-6': 0,
    'a-capacity-1': 4, 'a-capacity-5': 3, 'a-fraction-3': 12,
    'a-reserve-1': 4, 'a-restore-1': 17,
    'b-missing-sum-1': 7, 'b-missing-sum-8': 20,
    'b-subtraction-1': 12, 'b-subtraction-2': 8, 'b-subtraction-8': 15,
    'b-missing-factor-1': 6, 'b-missing-factor-8': 10,
    'b-division-1': 21, 'b-division-2': 4, 'b-division-8': 7,
    'b-signed-line-1': 2, 'b-signed-line-2': -3, 'b-signed-line-8': 6,
    'b-expressions-1': 14, 'b-expressions-8': 31,
    'b-two-step-1': 6, 'b-two-step-8': 6, 'b-sequences-1': 11, 'b-sequences-8': 39,
    'g-segments-1': 8, 'g-segments-2': 8, 'g-segments-8': 14,
    'g-length-units-1': 40, 'g-length-units-3': 600, 'g-length-units-8': 9,
    'g-right-angle-1': 60, 'g-straight-angle-2': 60, 'g-straight-angle-8': 90,
    'g-triangle-angles-3': 65, 'g-triangle-angles-7': 90,
    'g-perimeter-1': 14, 'g-perimeter-6': 24, 'g-area-1': 12, 'g-area-6': 36,
    'g-same-perimeter-1': 15, 'g-same-perimeter-8': 35
  };
  const taskById = new Map(tasks.map(task => [task.id, task]));
  for (const [id, expected] of Object.entries(fixed)) {
    assert(taskById.has(id), id + ': reviewed condition remains available');
    assert.equal(taskById.get(id).answer, expected, id + ': independent worked result');
  }
  assert.equal(taskById.get('g-perimeter-1').unit, 'см');
  assert.equal(taskById.get('g-area-1').unit, 'см²');
  assert.match(taskById.get('g-segments-8').prompt, /BC\s*=\s*9/);
  assert.deepEqual(Object.fromEntries(taskById.get('g-segments-8').model.controls.map(control => [control.id, control.target])), {a: 14, b: 9},
    'AC=23 and BC=9 means the first model segment AB is 14, not the known second segment');
  const zero = taskById.get('a-place-zero-1').model.controls;
  assert.equal(zero.find(control => control.id === 'tens').target, 0, '307 keeps the empty tens position');
});

test('every action model has reachable integer controls and a valid mathematical target', () => {
  const shape = {
    line: ['start', 'move'], groups: ['groups', 'size'], place: ['hundreds', 'tens', 'ones'],
    fraction: ['parts', 'shaded'], balance: ['x'], rectangle: ['width', 'height'],
    segments: ['a', 'b'], angle: ['angle'], triangle: ['alpha', 'beta']
  };
  for (const task of tasks) {
    const model = task.model;
    assert(model && Object.hasOwn(shape, model.kind), task.id + ': reviewed model kind');
    meaningful(model.caption, task.id + ': model instruction', 12);
    assert.deepEqual(model.controls.map(control => control.id).sort(), [...shape[model.kind]].sort(), task.id + ': model quantities');
    const target = Object.fromEntries(model.controls.map(control => [control.id, control.target]));
    for (const control of model.controls) {
      const label = task.id + '.' + control.id;
      meaningful(control.label, label + ': visible quantity', 2);
      for (const key of ['min', 'max', 'step', 'initial', 'target']) assert(Number.isFinite(control[key]), label + '.' + key);
      assert(control.max >= control.min && control.step > 0, label + ': bounded control, including a fixed known quantity');
      for (const value of [control.initial, control.target]) {
        assert(value >= control.min && value <= control.max, label + ': bounded state');
        assert(Number.isInteger((value - control.min) / control.step), label + ': reachable using buttons or keyboard');
      }
    }
    assert(model.controls.some(control => control.initial !== control.target), task.id + ': action needs a real change');
    if (model.kind === 'groups') assert(target.groups >= 1 && target.size >= 1 && target.groups * target.size <= 100, task.id + ': legible concrete groups');
    if (model.kind === 'place') assert(Object.values(target).every(value => Number.isInteger(value) && value >= 0 && value <= 9), task.id + ': base-ten digits');
    if (model.kind === 'fraction') assert(target.parts >= 1 && target.parts <= 12 && target.shaded >= 0 && target.shaded <= target.parts, task.id + ': whole partition');
    if (model.kind === 'balance') {
      const {a, b, c} = model.meta;
      assert([a, b, c].every(Number.isFinite), task.id + ': both sides of equation');
      assert.equal(a * target.x + b, c, task.id + ': balanced target');
    }
    if (model.kind === 'rectangle') assert(target.width > 0 && target.height > 0 && target.width * target.height <= 100, task.id + ': valid cell rectangle');
    if (model.kind === 'segments') assert(target.a >= 0 && target.b >= 0 && target.a + target.b > 0, task.id + ': segment lengths');
    if (model.kind === 'angle') assert(target.angle >= 0 && target.angle <= 180, task.id + ': stated angle range');
    if (model.kind === 'triangle') assert(target.alpha > 0 && target.beta > 0 && target.alpha + target.beta < 180, task.id + ': nondegenerate triangle');
  }
});

test('all 40 explanation questions are unambiguous choices with meaningful feedback', () => {
  for (const lesson of lessons) {
    const question = lesson.reason;
    meaningful(question.prompt, lesson.id + ': question');
    meaningful(question.explanation, lesson.id + ': explanation', 15);
    assert.equal(question.options.length, 3, lesson.id + ': three considered explanations');
    assert.equal(new Set(question.options.map(option => option.id)).size, 3, lesson.id + ': unique values');
    assert.equal(new Set(question.options.map(option => option.text.trim())).size, 3, lesson.id + ': different meanings');
    assert.equal(question.options.filter(option => option.id === question.answer).length, 1, lesson.id + ': one accepted meaning');
    for (const option of question.options) meaningful(option.text, lesson.id + ': reason option', 8);
  }
});

test('recommendations form a valid, acyclic learning order and connections are real links', () => {
  const checked = new Set();
  function visit(id, ancestors = new Set()) {
    assert(byId.has(id), id + ': prerequisite exists');
    assert(!ancestors.has(id), id + ': no circular prerequisites');
    if (checked.has(id)) return;
    const lesson = byId.get(id);
    assert(Array.isArray(lesson.prerequisites), id + ': prerequisites declared');
    const next = new Set([...ancestors, id]);
    lesson.prerequisites.forEach(parent => visit(parent, next));
    checked.add(id);
  }
  lessons.forEach(lesson => visit(lesson.id));
  for (const lesson of lessons) {
    for (const link of lesson.connections || []) {
      meaningful(link.label, lesson.id + ': connected practice', 4);
      assert(/^(?:#[a-z][a-z0-9-]*|\/(?!\/)|https:\/\/)/.test(link.href), lesson.id + ': safe destination');
      if (link.href.startsWith('/')) {
        const filename = link.href.split(/[?#]/)[0];
        const resolved = path.join(__dirname, '..', filename.replace(/^\//, ''), filename.endsWith('/') ? 'index.html' : '');
        assert(fs.existsSync(resolved), lesson.id + ': existing practice ' + link.href);
      }
    }
  }
});

test('the same complete data loads offline as ordinary browser scripts and as Node modules', () => {
  const context = {window: {}};
  vm.createContext(context);
  for (let index = 0; index < definitions.length; index++) {
    const [id, globalName] = definitions[index];
    const file = path.join(directory, 'arzhenikov-course-' + id + '.js');
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, {filename: path.basename(file)});
    assert.deepEqual(JSON.parse(JSON.stringify(context.window[globalName])), tracks[index], id + ': identical browser data');
  }
});

test('an empty or malformed answer never becomes success, and a corrected first error remains recorded', () => {
  const task = lessons[0].tasks[0], draft = engine.taskRecord(task);
  for (const input of ['', ' ', '1+2', '12xyz', 'NaN', 'Infinity', '2,5']) {
    draft.input = input;
    assert.equal(engine.assess(task, draft).kind, 'format', input + ': an exact integer is required');
    assert.equal(draft.firstCorrect, null);
    assert.equal(draft.attempts, 0);
    assert.equal(draft.solved, false);
  }
  for (const [input, value] of [['0', 0], ['−3', -3], ['+7', 7], ['12,0', 12], [' 24 ', 24]]) {
    assert.equal(engine.parseNumber(input), value, 'Accepted integer form ' + input);
  }
  draft.input = String(task.answer + 1);
  assert.equal(engine.assess(task, draft).kind, 'wrong');
  assert.equal(draft.firstCorrect, false);
  draft.helpUsed = true;
  draft.input = String(task.answer);
  assert.equal(engine.assess(task, draft).kind, 'correct');
  assert.equal(draft.firstCorrect, false, 'A correction cannot rewrite the first answer');
  assert.equal(draft.attempts, 2);
  assert.equal(draft.wrong, 1);
  assert.equal(draft.everSolved, true);
  const repeat = engine.resetDraft(task, draft);
  assert.equal(repeat.firstCorrect, false);
  assert.equal(repeat.helpUsed, true);
  assert.equal(repeat.everSolved, true);
  repeat.input = String(task.answer);
  engine.assess(task, repeat);
  assert.equal(repeat.firstCorrect, false, 'Remembering a corrected task on replay is not a first-try solution');
});

test('a model requires a real, valid mathematical action, not merely opening its view', () => {
  for (const task of tasks) {
    const draft = engine.taskRecord(task);
    assert.equal(engine.modelMatches(task, draft), false, task.id + ': untouched view');
    draft.model = Object.fromEntries(task.model.controls.map(control => [control.id, control.target]));
    assert.equal(engine.modelMatches(task, draft), false, task.id + ': target without a learner action');
    draft.moves = 1;
    assert.equal(engine.modelMatches(task, draft), true, task.id + ': valid constructed target');
    const control = task.model.controls[0];
    draft.model[control.id] = control.max + control.step;
    assert.equal(engine.modelMatches(task, draft), false, task.id + ': out-of-range model');
  }
});

test('normalization cannot turn partial or inconsistent local records into independent mastery', () => {
  const lesson = lessons[0], task = lesson.tasks[4];
  const clean = engine.fresh();
  assert.deepEqual(engine.progress(clean, lessons).completed, []);
  assert.deepEqual(engine.progress(clean, lessons).independent, []);
  const rec = engine.record();
  clean.lessons[lesson.id] = rec;
  rec.phase = 'summary'; rec.completedAt = 12345;
  const partial = engine.normalize(JSON.parse(JSON.stringify(clean)), lessons);
  assert.deepEqual(engine.progress(partial, lessons).completed, [], 'A timestamp and a summary screen alone are not completion');
  assert.equal(partial.lessons[lesson.id].phase, 'intro');
  rec.tasks[task.id] = {...engine.taskRecord(task), input: String(task.answer), attempts: 1, firstCorrect: true, everSolved: false};
  const inconsistent = engine.normalize(JSON.parse(JSON.stringify(clean)), lessons);
  assert.deepEqual(engine.progress(inconsistent, lessons).independent, [], 'An inconsistent firstCorrect flag without a solved result is not evidence');
  rec.tasks[task.id] = {...engine.taskRecord(task), input: String(task.answer), attempts: 1, firstCorrect: true,
    everSolved: true, solved: true, modelShown: true, helpUsed: false};
  const modelHelp = engine.normalize(JSON.parse(JSON.stringify(clean)), lessons);
  assert.deepEqual(engine.progress(modelHelp, lessons).independent, [], 'A revealed model remains help even when another stored flag is missing');
});

test('help during a later rehearsal cannot erase an earlier first independent solution', () => {
  const lesson = lessons[1], task = lesson.tasks[4];
  const state = engine.fresh(), rec = engine.record(); state.lessons[lesson.id] = rec;
  const first = engine.taskRecord(task); rec.tasks[task.id] = first;
  first.input = String(task.answer); engine.assess(task, first);
  assert.equal(first.firstCorrect, true);
  assert.equal(first.firstHelpUsed, false);
  assert.deepEqual(engine.progress(state, lessons).independent, [task.id]);
  const repeated = engine.resetDraft(task, first); rec.tasks[task.id] = repeated;
  repeated.helpUsed = true; repeated.hint = true; repeated.input = String(task.answer);
  engine.assess(task, repeated);
  const restored = engine.normalize(JSON.parse(JSON.stringify(state)), lessons);
  assert.equal(restored.lessons[lesson.id].tasks[task.id].helpUsed, true, 'The later assistance is still recorded');
  assert.equal(restored.lessons[lesson.id].tasks[task.id].firstHelpUsed, false, 'First-attempt evidence stays historical');
  assert.deepEqual(engine.progress(restored, lessons).independent, [task.id]);
});

module.exports = {tracks, lessons, tasks, derive};
