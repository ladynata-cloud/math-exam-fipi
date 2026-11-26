'use strict';

const assert = require('node:assert/strict');
const {test} = require('node:test');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const directory = path.resolve(__dirname, '../trainers/oge-basics/multiplication-division');
const names = ['written', 'fractions', 'decimals'];
const legacyNames = ['arithmetic', 'algebra', 'geometry'];
const load = name => require(path.join(directory, 'arzhenikov-course-' + name + '.js'));
const tracks = names.map(load);
const oldTracks = legacyNames.map(load);
const lessons = tracks.flatMap(track => track.lessons);
const tasks = lessons.flatMap(lesson => lesson.tasks);
const oldLessons = oldTracks.flatMap(track => track.lessons);
const allLessons = [...oldLessons, ...lessons];
const byId = new Map(allLessons.map(lesson => [lesson.id, lesson]));
const taskById = new Map(allLessons.flatMap(lesson => lesson.tasks).map(task => [task.id, task]));
const engine = require(path.join(directory, 'arzhenikov-course-engine.js'));
const clone = value => JSON.parse(JSON.stringify(value));

// This oracle is deliberately separate from the Number-based browser parser,
// authored answers and the banks' generators. All calculations use BigInt
// numerator/denominator pairs, including floor and decimal scaling.
function gcd(a, b) {
  a = a < 0n ? -a : a; b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a || 1n;
}
function rational(n, d = 1n) {
  assert.notEqual(d, 0n, 'oracle denominator is nonzero');
  if (d < 0n) { n = -n; d = -d; }
  const common = gcd(n, d);
  return {n: n / common, d: d / common};
}
function exact(value) {
  const source = String(value).trim().replace(/−/g, '-').replace(',', '.');
  const parts = source.match(/^([+-]?)(\d+)\s+(\d+)\/(\d+)$/);
  if (parts) {
    const den = BigInt(parts[4]);
    assert(BigInt(parts[3]) < den && den > 0n, 'proper fractional part in a mixed number');
    return rational((BigInt(parts[2]) * den + BigInt(parts[3])) * (parts[1] === '-' ? -1n : 1n), den);
  }
  const fraction = source.match(/^([+-]?\d+)\/(\d+)$/);
  if (fraction) return rational(BigInt(fraction[1]), BigInt(fraction[2]));
  const decimal = source.match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
  assert(decimal, 'oracle accepts a number, not code or an expression: ' + source);
  const digits = decimal[3] || '';
  return rational(BigInt(decimal[2] + digits) * (decimal[1] === '-' ? -1n : 1n), 10n ** BigInt(digits.length));
}
const add = (a, b) => rational(a.n * b.d + b.n * a.d, a.d * b.d);
const subtract = (a, b) => rational(a.n * b.d - b.n * a.d, a.d * b.d);
const multiply = (a, b) => rational(a.n * b.n, a.d * b.d);
const divide = (a, b) => rational(a.n * b.d, a.d * b.n);
function floor(value) {
  const quotient = value.n / value.d;
  return value.n < 0n && value.n % value.d !== 0n ? quotient - 1n : quotient;
}
function oracle(item) {
  const c = item.calculation;
  assert(c && Array.isArray(c.args), (item.id || item.label) + ': explicit independent operands');
  const args = c.args.map(exact), [a, b] = args;
  switch (c.op) {
    case 'r-value': assert.equal(args.length, 1); return a;
    case 'r-add': return args.reduce(add, rational(0n));
    case 'r-sub': assert.equal(args.length, 2); return subtract(a, b);
    case 'r-mul': return args.reduce(multiply, rational(1n));
    case 'r-div': assert.equal(args.length, 2); return divide(a, b);
    case 'r-floor': assert.equal(args.length, 2); return rational(floor(divide(a, b)));
    case 'r-remainder': assert.equal(args.length, 2); return subtract(a, multiply(rational(floor(divide(a, b))), b));
    case 'r-compare': {
      const delta = a.n * b.d - b.n * a.d;
      return delta < 0n ? '<' : delta > 0n ? '>' : '=';
    }
    default: assert.fail('Unreviewed arithmetic operation: ' + c.op);
  }
}
function finiteDecimal(value) {
  assert(value.n >= 0n, 'written examples use nonnegative magnitudes');
  let remainder = value.n % value.d;
  const integer = String(value.n / value.d);
  if (remainder === 0n) return integer;
  let digits = '';
  while (remainder !== 0n) {
    assert(digits.length < 12, 'finite quotient within the authored decimal scope');
    remainder *= 10n;
    digits += String(remainder / value.d);
    remainder %= value.d;
  }
  return integer + '.' + digits;
}
const valueOf = value => ['<', '>', '='].includes(String(value)) ? String(value) : exact(value);
function meaningful(value, label, length = 6) {
  assert.equal(typeof value, 'string', label);
  assert(value.trim().length >= length, label + ': authored explanation');
  assert(!/\b(?:TODO|FIXME|undefined|NaN)\b/.test(value), label + ': no placeholder');
}
function solve(task, draft = engine.taskRecord(task)) {
  for (const step of task.steps || []) {
    draft.steps[step.id].input = String(step.answer);
    assert.equal(engine.assessStep(task, draft, step.id).kind, 'correct', task.id + ' / ' + step.id);
  }
  draft.input = String(task.answer);
  assert.equal(engine.assess(task, draft).kind, 'correct', task.id + ': complete result');
  return draft;
}
function savedDraft(lesson, task, draft) {
  const saved = engine.fresh();
  saved.active = lesson.id;
  const record = engine.record();
  record.phase = 'task'; record.cursor = lesson.tasks.indexOf(task);
  record.tasks[task.id] = draft;
  saved.lessons[lesson.id] = record;
  return saved;
}

test('36 additional lessons and 288 distinct conditions preserve all 40 original lessons byte for byte', () => {
  // Approved baseline 1712651b. A rewrite or removal of an earlier course is
  // outside this task even when its lesson count remains unchanged.
  const baseline = {
    arithmetic: '316170703d1ea08f4d6e8b646de329990606de41407536ee0bd9094e2f5f1626',
    algebra: '3fad45b6b87c259bed2fc80e58c53c49677a27f3723b3e708aeca674b2b4a03a',
    geometry: '989e0cbe1c587f748ff35a80b4daa683d062677efa48bacadfedbcb50796f252'
  };
  for (const name of legacyNames) {
    const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(directory, 'arzhenikov-course-' + name + '.js'))).digest('hex');
    assert.equal(actual, baseline[name], name + ': earlier authored bank remains intact');
  }
  assert.equal(oldLessons.length, 40);
  assert.equal(oldLessons.flatMap(lesson => lesson.tasks).length, 320);
  assert.equal(lessons.length, 36);
  assert.equal(tasks.length, 288);
  assert.equal(allLessons.length, 76);
  assert.equal(new Set(allLessons.map(lesson => lesson.id)).size, 76);
  assert.equal(new Set([...oldLessons.flatMap(lesson => lesson.tasks), ...tasks].map(task => task.id)).size, 608);
  assert.equal(new Set(tasks.map(task => task.prompt.trim())).size, 288);
  for (const track of tracks) {
    assert.equal(track.lessons.length, 12, track.id);
    assert(track.sources.some(source => source.href === 'https://djvu.online/file/AIsMeWPu7uz8w'), track.id + ': primary fractional-arithmetic source');
    if (track.id === 'written') assert(track.sources.some(source => source.href === 'https://djvu.online/file/Zmmk0C6Gqh83D'));
    for (const lesson of track.lessons) {
      assert(track.bands.some(band => band.id === lesson.band), lesson.id + ': named section');
      assert.equal(lesson.tasks.length, 8, lesson.id + ': two model, two practice, two checks, two repeats');
      for (const field of ['title', 'goal', 'intro', 'rule', 'physical']) meaningful(lesson[field], lesson.id + '.' + field);
      for (const field of ['problem', 'expression', 'explanation']) meaningful(lesson.worked[field], lesson.id + '.worked.' + field, 3);
      assert.equal(lesson.reason.options.length, 3);
      assert.equal(new Set(lesson.reason.options.map(option => option.id)).size, 3);
      assert.equal(new Set(lesson.reason.options.map(option => option.text)).size, 3);
      assert.equal(lesson.reason.options.filter(option => option.id === lesson.reason.answer).length, 1);
      meaningful(lesson.reason.explanation, lesson.id + ': explanation of reason', 15);
      for (const task of lesson.tasks) {
        meaningful(task.prompt, task.id + ': condition', 12);
        meaningful(task.hint, task.id + ': help', 12);
        meaningful(task.explanation, task.id + ': explanation', 12);
        assert.equal(typeof task.unit, 'string');
        assert.equal(new Set((task.steps || []).map(step => step.id)).size, (task.steps || []).length, task.id + ': stable unique step keys');
      }
    }
  }
});

test('all new final and intermediate answers follow an independent exact rational oracle', () => {
  let checked = 0;
  for (const task of tasks) {
    for (const item of [task, ...(task.steps || [])]) {
      const expected = oracle(item);
      assert.deepEqual(valueOf(item.answer), expected, task.id + ' / ' + (item.id || item.label) + ': independent mathematics');
      assert.equal(engine.checkAnswer(item, String(item.answer)).kind, 'correct', task.id + ': canonical answer meets its own format requirement');
      if (item.requireReduced) {
        const match = String(item.answer).match(/(\d+)\/(\d+)$/);
        if (match) assert.equal(gcd(BigInt(match[1]), BigInt(match[2])), 1n, task.id + ': simplified displayed answer');
      }
      if (item.requiredDenominator) {
        assert.equal(String(item.answer).split('/')[1], String(item.requiredDenominator), task.id + ': requested representation');
      }
      checked += 1;
    }
  }
  assert(checked > 1200, 'The gate covers intermediate calculations as well as 288 final answers');
});

test('hand-worked story fixtures check the intended operation, units, zeroes and inverse questions', () => {
  // These answers were worked from the Russian conditions, independently of
  // task.calculation. They prevent a wrong question/operation pair agreeing
  // with itself in the generated arithmetic data.
  const fixtures = {
    'w-first-block-2': [15, /156 : 3/],
    'w-trial-digit-1': [6, /52.*8/],
    'w-multiply-6': [96, /делитель 24, выбранная цифра 4/],
    'w-subtract-3': [0, /56.*7/],
    'w-bring-down-4': [6, /0 десятка.*6 единиц/],
    'w-zero-1': [206, /824/],
    'w-zero-5': [1020, /3060/],
    'w-remainder-5': [5, /125.*6/],
    'w-two-digit-8': [27, /1512.*56/],
    'w-decimal-dividend-5': ['0.21', /0,84/],
    'w-decimal-dividend-7': ['1.008', /6,048/],
    'w-add-zeroes-2': ['0.375', /3 л.*восемь/],
    'w-decimal-divisor-3': ['0.6', /0,54.*0,9/],
    'w-decimal-divisor-5': ['2.2', /2,772 : 1,26/],
    'f-meaning-8': ['5/12', /12.*5/],
    'f-equivalent-5': ['9/21', /3\/7.*двадцать первыми/],
    'f-reduce-5': ['2/3', /10\/15/],
    'f-common-denominator-5': ['15/24', /1\/3.*5\/8/],
    'f-compare-5': ['>', /5\/6.*7\/9/],
    'f-add-5': ['13/21', /2\/7.*1\/3/],
    'f-subtract-5': ['13/24', /7\/8.*1\/3/],
    'f-mixed-5': ['1 1/2', /3 3\/8.*1 7\/8/],
    'f-multiply-5': ['1/2', /3\/5.*5\/6/],
    'f-divide-1': [6, /3\/4.*1\/8/],
    'f-divide-8': ['7/30', /7\/10.*три/],
    'f-part-of-1': [9, /24.*3\/8/],
    'f-whole-from-part-1': [16, /12.*3\/4/],
    'd-place-8': ['2.005', /2 кг 5 г/],
    'd-compare-1': ['>', /0,8.*0,12/],
    'd-compare-5': ['<', /3,007.*3,07/],
    'd-add-1': ['2.05', /1,25.*0,8/],
    'd-subtract-5': ['3.134', /6,004.*2,87/],
    'd-times-ten-8': ['12.5', /0,125.*100/],
    'd-divide-ten-5': ['0.075', /0,75.*10/],
    'd-multiply-integer-5': ['0.72', /9.*0,08/],
    'd-multiply-8': ['1.02', /2,04.*0,5/],
    'd-divide-integer-8': ['0.252', /1,008.*4/],
    'd-divide-decimal-8': ['0.5', /0,45 : 0,9/],
    'd-convert-1': ['0.75', /3\/4/],
    'd-convert-8': ['5/4', /1,25/],
    'd-applications-5': ['5.8', /0,65.*0,8.*четыре/],
    'd-applications-8': ['0.6', /1,5.*0,8.*Половину/]
  };
  for (const [id, [answer, condition]] of Object.entries(fixtures)) {
    const task = taskById.get(id); assert(task, id);
    assert.match(task.prompt, condition, id + ': same reviewed condition');
    assert.deepEqual(valueOf(task.answer), valueOf(answer), id + ': hand-worked answer');
  }
  assert.equal(taskById.get('d-multiply-1').unit, 'м²');
  assert.equal(taskById.get('d-place-1').unit, 'см');
  assert.equal(taskById.get('f-whole-from-part-1').unit, 'открыток');
  assert.notEqual(taskById.get('w-multiply-6').answer, 72, 'independent condition differs from the worked 24 × 3');
});

test('recommended prerequisites are acyclic and retain connections to the previous routes', () => {
  const done = new Set();
  function visit(id, ancestors = new Set()) {
    assert(byId.has(id), id + ': prerequisite exists');
    assert(!ancestors.has(id), id + ': no prerequisite cycle');
    if (done.has(id)) return;
    const next = new Set([...ancestors, id]);
    byId.get(id).prerequisites.forEach(parent => visit(parent, next));
    done.add(id);
  }
  allLessons.forEach(lesson => visit(lesson.id));
  for (const lesson of lessons) {
    for (const link of lesson.connections || []) {
      if (link.href.startsWith('#course-')) assert(byId.has(link.href.slice(8)), lesson.id + ': linked lesson');
      if (link.href.startsWith('#courses-')) assert([...tracks, ...oldTracks].some(track => '#courses-' + track.id === link.href), lesson.id + ': linked track');
    }
  }
  const written = tracks.find(track => track.id === 'written');
  assert(written.lessons.some(lesson => lesson.connections.some(link => link.href === '#bridge')));
  assert(written.lessons.some(lesson => lesson.connections.some(link => link.href === '#harbor')));
  assert(lessons.some(lesson => lesson.prerequisites.includes('a-fraction')));
});

test('every new model has reachable, nontrivial controls and meaningful mathematical targets', () => {
  const kinds = {
    quotient: ['digit'], 'division-prefix': ['digits'], place: ['hundreds', 'tens', 'ones'],
    'fraction-strip': ['parts', 'numerator'], 'fraction-pair': ['parts', 'left', 'right'],
    'fraction-area': ['cols', 'rows', 'width', 'height'],
    'decimal-place': ['whole', 'tenths', 'hundredths', 'thousandths']
  };
  const operations = {add: ['left', 'right'], subtract: ['left', 'right'], repeat: ['size', 'copies'], share: ['each'], measure: ['groups']};
  for (const task of tasks) {
    const model = task.model;
    const keys = model.kind === 'decimal-operation' ? operations[model.meta.operation] : kinds[model.kind];
    assert(keys, task.id + ': reviewed model family');
    assert.deepEqual(model.controls.map(control => control.id).sort(), [...keys].sort(), task.id);
    const initial = Object.fromEntries(model.controls.map(c => [c.id, c.initial]));
    const target = Object.fromEntries(model.controls.map(c => [c.id, c.target]));
    for (const c of model.controls) {
      for (const n of ['min', 'max', 'step', 'initial', 'target']) assert(Number.isSafeInteger(c[n]), task.id + '.' + c.id + '.' + n);
      assert(c.step > 0 && c.min <= c.max, task.id);
      for (const value of [c.initial, c.target]) {
        assert(value >= c.min && value <= c.max, task.id + ': reachable value');
        assert(Number.isInteger((value - c.min) / c.step), task.id + ': button-reachable value');
      }
    }
    assert(model.controls.some(c => c.initial !== c.target), task.id + ': an action is needed');
    assert(engine.valuesValid(model, initial), task.id + ': valid initial model');
    assert(engine.valuesValid(model, target), task.id + ': valid target model');
    const draft = engine.taskRecord(task); draft.model = target;
    assert.equal(engine.modelMatches(task, draft), false, task.id + ': viewing the model is not an action');
    draft.moves = 1;
    assert.equal(engine.modelMatches(task, draft), true, task.id + ': learner can reach the target');
    if (model.kind === 'quotient') {
      assert.equal(target.digit, Math.floor(model.meta.partial / model.meta.divisor), task.id + ': greatest fitting multiple');
      assert(target.digit >= 0 && target.digit <= 9);
    }
    if (model.kind === 'division-prefix') {
      const digits = model.meta.dividend, count = target.digits, divisor = model.meta.divisor;
      assert(Number(digits.slice(0, count)) >= divisor, task.id + ': selected prefix is enough');
      assert(count === 1 || Number(digits.slice(0, count - 1)) < divisor, task.id + ': prefix is minimal');
    }
    if (model.kind === 'place') {
      assert(Object.values(target).every(value => value >= 0 && value <= 9));
      assert.equal(target.hundreds * 100 + target.tens * 10 + target.ones, task.answer, task.id + ': regrouping preserves the combined value');
    }
    if (model.kind === 'fraction-strip') {
      let pictured = rational(BigInt(target.numerator), BigInt(target.parts));
      if (model.meta.whole) pictured = multiply(exact(model.meta.whole), pictured);
      if (model.meta.knownPart) pictured = divide(exact(model.meta.knownPart), pictured);
      assert.deepEqual(pictured, exact(task.answer), task.id + ': strip represents the stated whole and part');
    }
    if (model.kind === 'fraction-pair') {
      const left = rational(BigInt(target.left), BigInt(target.parts));
      const right = rational(BigInt(target.right), BigInt(target.parts));
      if (task.id.startsWith('f-common-denominator-')) {
        assert.deepEqual(left, exact(task.steps[0].calculation.args[0]), task.id + ': left fraction preserved');
        assert.deepEqual(right, exact(task.calculation.args[0]), task.id + ': right fraction preserved');
        assert.equal(target.parts, task.requiredDenominator);
      } else {
        assert.deepEqual(left, exact(task.calculation.args[0]), task.id + ': first operand preserved');
        assert.deepEqual(right, exact(task.calculation.args[1]), task.id + ': second operand preserved');
      }
    }
    if (model.kind === 'fraction-area') {
      assert(target.width <= target.cols && target.height <= target.rows);
      assert(target.cols * target.rows <= 144, task.id + ': visible exact grid');
      assert.deepEqual(rational(BigInt(target.width * target.height), BigInt(target.cols * target.rows)), exact(task.answer), task.id + ': overlap matches the fraction product');
    }
    if (model.kind === 'decimal-place') {
      for (const key of ['tenths', 'hundredths', 'thousandths']) assert(target[key] >= 0 && target[key] <= 9, task.id + ': decimal digit');
      const pictured = rational(BigInt(target.whole * 1000 + target.tenths * 100 + target.hundredths * 10 + target.thousandths), 1000n);
      // Multi-operation stories model their original physical quantity, before
      // the first computation. These fixtures are read from their conditions.
      const initialApplication = ['1.2', '3.5', '1.5', '2', '0.65', '6.3', '3.6', '1.5'];
      const original = task.id.startsWith('d-place-') ? task.answer
        : task.id.startsWith('d-applications-') ? initialApplication[Number(task.id.split('-').at(-1)) - 1]
        : task.calculation.args[0];
      assert.deepEqual(pictured, exact(original), task.id + ': place values represent the original quantity');
    }
    if (model.kind === 'decimal-operation') {
      const meta = model.meta, scale = exact(meta.scale);
      assert([10, 100, 1000].includes(meta.scale), task.id + ': named equal decimal units');
      let pictured;
      switch (meta.operation) {
        case 'add':
        case 'subtract':
          assert.equal(target.left, meta.left);
          assert.equal(target.right, meta.right);
          assert.deepEqual(divide(exact(target.left), scale), exact(task.calculation.args[0]));
          assert.deepEqual(divide(exact(target.right), scale), exact(task.calculation.args[1]));
          pictured = divide(exact(meta.operation === 'add' ? target.left + target.right : target.left - target.right), scale);
          break;
        case 'repeat':
          assert.equal(target.size, meta.size);
          assert.equal(target.copies, meta.groups);
          assert.deepEqual(divide(exact(target.size), scale), exact(task.calculation.args[0]));
          assert.deepEqual(exact(target.copies), exact(task.calculation.args[1]));
          pictured = divide(exact(target.size * target.copies), scale);
          break;
        case 'share':
          assert.equal(target.each * meta.groups, meta.total, task.id + ': the whole quantity is distributed equally');
          assert.deepEqual(divide(exact(meta.total), scale), exact(task.calculation.args[0]));
          assert.deepEqual(exact(meta.groups), exact(task.calculation.args[1]));
          pictured = divide(exact(target.each), scale);
          break;
        case 'measure':
          assert.equal(target.groups * meta.size, meta.total, task.id + ': filled measures use the whole quantity');
          assert.deepEqual(divide(exact(meta.total), scale), exact(task.calculation.args[0]));
          assert.deepEqual(divide(exact(meta.size), scale), exact(task.calculation.args[1]));
          pictured = exact(target.groups);
          break;
      }
      assert.deepEqual(pictured, exact(task.answer), task.id + ': physical operation produces the requested quantity');
    }
  }
  assert.equal(taskById.get('w-first-block-1').model.kind, 'division-prefix', 'first-prefix lesson models prefix choice, not a supplied answer');
  assert.equal(taskById.get('w-bring-down-1').model.kind, 'place', 'bring-down lesson models the change of unit');
});

// Reconstruct the written algorithm from the original dividend and divisor,
// independently of the bank's answer, normalized strings or step.calculation.
function expectedWritten(task) {
  const source = task.written;
  const originalDividend = exact(source.dividend), originalDivisor = exact(source.divisor);
  const places = (source.divisor.split('.')[1] || '').length;
  const scale = 10n ** BigInt(places);
  const normalized = multiply(originalDividend, rational(scale));
  const divisorValue = multiply(originalDivisor, rational(scale));
  assert.equal(divisorValue.d, 1n);
  const divisor = divisorValue.n;
  const normalizedText = finiteDecimal(normalized), pieces = normalizedText.split('.');
  let digits = pieces.join('');
  const wholeLength = pieces[0].length;
  let end = 1;
  while (end < wholeLength && BigInt(digits.slice(0, end)) < divisor) end += 1;
  let part = BigInt(digits.slice(0, end)), group = 0, remainder = 0n;
  let quotient = '', comma = null, extraZeroes = 0;
  const expected = [];
  const event = (role, value, extra = {}) => expected.push({role, value: rational(value), ...extra});
  if (places) {
    event('scale-factor', scale);
    event('scale-divisor', divisor);
    expected.push({role: 'scale-dividend', value: normalized});
  }
  event('partial', part, {column: end - 1, group});
  while (true) {
    const q = part / divisor, product = q * divisor;
    remainder = part - product;
    assert(q >= 0n && q <= 9n);
    event('digit', q, {column: end - 1, group});
    event('product', product, {column: end - 1, group});
    event('remainder', remainder, {column: end - 1, group});
    quotient += String(q);
    const supplied = end < digits.length;
    if (!supplied && (remainder === 0n || task.answerFormat !== 'decimal')) break;
    if (!supplied) {
      extraZeroes += 1;
      assert(extraZeroes <= 9, 'authored decimal division terminates');
      digits += '0';
    }
    if (end === wholeLength) {
      comma = quotient.length;
      event('decimal-point', BigInt(comma), {column: end - 1, group});
    }
    const next = BigInt(digits[end]);
    part = remainder * 10n + next;
    group += 1;
    event('bring', part, {column: end, group, nextDigit: Number(next), appended: !supplied});
    end += 1;
  }
  if (comma !== null) quotient = quotient.slice(0, comma) + '.' + quotient.slice(comma);
  return {expected, quotient, remainder, scale, normalizedText, divisor: String(divisor), extraZeroes};
}

test('all full written records reconstruct from the original numbers, preserving zeroes and decimal positions', () => {
  let full = 0, zeroSteps = 0, decimalPoints = 0, changedDivisors = 0;
  for (const task of tasks.filter(task => task.written)) {
    full += 1;
    const expected = expectedWritten(task), w = task.written;
    assert.equal(task.steps.length, expected.expected.length, task.id + ': no omitted or extra calculation');
    task.steps.forEach((step, i) => {
      const actual = expected.expected[i];
      assert.equal(step.role, actual.role, task.id + ': ordered mathematical action ' + i);
      assert.deepEqual(exact(step.answer), actual.value, task.id + ': independently reconstructed step ' + i);
      for (const key of ['column', 'group', 'nextDigit', 'appended']) if (key in actual) assert.equal(step[key], actual[key], task.id + ': position ' + key);
      if (step.role === 'digit' && exact(step.answer).n === 0n) zeroSteps += 1;
      if (step.role === 'decimal-point') decimalPoints += 1;
    });
    assert.equal(w.quotient, expected.quotient, task.id + ': quotient digit positions');
    assert.equal(BigInt(w.remainder), expected.remainder);
    assert.equal(BigInt(w.scale), expected.scale);
    assert.deepEqual(exact(w.normalizedDividend), exact(expected.normalizedText));
    assert.equal(w.normalizedDivisor, expected.divisor);
    assert.equal(w.addedZeroes, expected.extraZeroes);
    const reconstruction = add(multiply(exact(w.quotient), exact(w.divisor)), rational(expected.remainder));
    assert.deepEqual(reconstruction, exact(w.dividend), task.id + ': original quantity restored');
    if (expected.scale > 1n) changedDivisors += 1;
  }
  assert.equal(full, 56, 'seven later lessons have complete written algorithms');
  assert(zeroSteps >= 12, 'internal, terminal and zero-integer-part digits are actually practised');
  assert(decimalPoints >= 20);
  assert.equal(changedDivisors, 8, 'all decimal divisors change both numbers');
  const first = taskById.get('w-one-digit-1');
  assert.deepEqual(first.steps.filter(s => s.role === 'digit').map(s => s.answer), [2, 8]);
  assert.deepEqual(taskById.get('w-zero-1').steps.filter(s => s.role === 'digit').map(s => s.answer), [2, 0, 6]);
  assert.deepEqual(taskById.get('w-add-zeroes-2').steps.filter(s => s.role === 'digit').map(s => s.answer), [0, 3, 7, 5]);
});

test('fraction, decimal, comparison and mixed-number input is exact and never evaluates code', () => {
  const valid = [
    ['1/2', '1/2'], ['2/4', '1/2'], ['0,5', '1/2'], ['0.500', '1/2'],
    ['1 1/2', '3/2'], ['+1 1/2', '3/2'], ['-1 1/2', '-3/2'], ['−0 1/2', '-1/2'],
    [' -3/4 ', '-3/4'], ['2\u00a01/3', '7/3'], ['0', '0'], ['0,001', '1/1000']
  ];
  for (const [input, expected] of valid) {
    const actual = engine.parseRational(input);
    assert(actual, input + ': accepted input');
    assert.deepEqual(rational(BigInt(actual.n), BigInt(actual.d)), exact(expected), input);
  }
  for (const input of ['', ' ', '1/0', '1/2/3', '1+2', '2**3', '0x10', 'NaN', 'Infinity', '1e3', 'Math.random()',
    '(()=>1)()', '2/(-3)', '1,2.3', '--2', '1 3/2', '9007199254740992', '0.0000000001']) {
    assert.equal(engine.parseRational(input), null, input + ': unsupported text cannot become a numeric result');
  }
  assert.equal(engine.checkAnswer({answer: '0.3', answerFormat: 'decimal'}, '0,300000000').kind, 'correct');
  assert.equal(engine.checkAnswer({answer: '0.3', answerFormat: 'decimal'}, '0,300000001').kind, 'wrong', 'nearby is not exact');
  assert.equal(engine.checkAnswer({answer: '1/2', answerFormat: 'fraction'}, '2/4').kind, 'correct', 'equivalent value is accepted when no simplification is requested');
  assert.equal(engine.checkAnswer({answer: '1/2', answerFormat: 'fraction', requireReduced: true}, '2/4').kind, 'format');
  assert.equal(engine.checkAnswer({answer: '3/6', answerFormat: 'fraction', requiredDenominator: 6}, '1/2').kind, 'format');
  assert.equal(engine.checkAnswer({answer: '3/6', answerFormat: 'fraction', requiredDenominator: 6}, '3/6').kind, 'correct');
  assert.equal(engine.checkAnswer({answer: '1 1/2', answerFormat: 'mixed'}, '3/2').kind, 'format');
  assert.equal(engine.checkAnswer({answer: '1 1/2', answerFormat: 'mixed'}, '1 1/2').kind, 'correct');
  assert.equal(engine.checkAnswer({answer: '1/2', answerFormat: 'fraction'}, '0.5').kind, 'format');
  assert.equal(engine.checkAnswer({answer: '0.5', answerFormat: 'decimal'}, '1/2').kind, 'format');
  assert.equal(engine.checkAnswer({answer: '<', answerFormat: 'comparison'}, ' > ').kind, 'wrong');
  assert.equal(engine.checkAnswer({answer: '<', answerFormat: 'comparison'}, ' < ').kind, 'correct');
});

test('unfinished or invalid steps cannot be bypassed by entering the correct final answer', () => {
  for (const task of tasks.filter(task => task.steps?.length)) {
    const draft = engine.taskRecord(task);
    draft.input = String(task.answer);
    assert.equal(engine.assess(task, draft).kind, 'blocked', task.id + ': steps must precede result');
    assert.equal(draft.attempts, 0);
    assert.equal(draft.everSolved, false);
    if (task.steps.length > 1) {
      const second = task.steps[1]; draft.steps[second.id].input = String(second.answer);
      assert.equal(engine.assessStep(task, draft, second.id).kind, 'blocked', task.id + ': cannot jump over a step');
    }
    const first = task.steps[0];
    draft.steps[first.id].input = '1+2';
    assert.equal(engine.assessStep(task, draft, first.id).kind, 'format');
    assert.equal(draft.firstCorrect, null, task.id + ': malformed text is not a mathematical first attempt');
    assert.equal(draft.attempts, 0);
    solve(task, draft);
    assert.equal(draft.firstCorrect, true);
    assert.equal(draft.firstHelpUsed, false);
    assert.equal(engine.stepsComplete(task, draft), true);
    draft.steps[first.id].input = '999999';
    assert.equal(engine.assess(task, draft).kind, 'blocked', task.id + ': corrupt step content cannot masquerade as completed');
  }
});

test('a wrong intermediate calculation and assistance survive correction and reload', () => {
  const lesson = byId.get('f-add'), task = lesson.tasks[4], draft = engine.taskRecord(task), first = task.steps[0];
  draft.steps[first.id].input = '999999';
  assert.equal(engine.assessStep(task, draft, first.id).kind, 'wrong');
  assert.equal(draft.firstCorrect, false);
  draft.helpUsed = true; draft.steps[first.id].hint = true;
  solve(task, draft);
  const restored = engine.normalize(clone(savedDraft(lesson, task, draft)), allLessons);
  const result = restored.lessons[lesson.id].tasks[task.id];
  assert.equal(result.steps[first.id].wrong, 1);
  assert.equal(result.steps[first.id].solved, true);
  assert.equal(result.firstCorrect, false);
  assert.equal(result.helpUsed, true);
  assert.equal(result.solved, true);
  assert.equal(engine.progress(restored, allLessons).independent.includes(task.id), false);
  assert.equal(result.input, String(task.answer));
});

test('a first independent success remains historical after a later mistaken rehearsal', () => {
  const lesson = byId.get('d-add'), task = lesson.tasks[4], first = solve(task);
  assert.equal(first.firstCorrect, true);
  assert.equal(first.firstHelpUsed, false);
  const rehearsal = engine.resetDraft(task, first), step = task.steps[0];
  rehearsal.steps[step.id].input = '999999';
  assert.equal(engine.assessStep(task, rehearsal, step.id).kind, 'wrong');
  rehearsal.steps[step.id].hint = true; rehearsal.helpUsed = true;
  solve(task, rehearsal);
  const state = engine.normalize(clone(savedDraft(lesson, task, rehearsal)), allLessons);
  const restored = state.lessons[lesson.id].tasks[task.id];
  assert.equal(restored.steps[step.id].wrong, 1, 'the later error is still visible');
  assert.equal(restored.helpUsed, true, 'the later help is still visible');
  assert.equal(restored.firstCorrect, true, 'later error cannot rewrite the first completed answer');
  assert.equal(restored.firstHelpUsed, false);
  assert.equal(engine.progress(state, allLessons).independent.includes(task.id), true);
});

test('step-level help is used when a restored record lacks explicit first-help attribution', () => {
  const lesson = byId.get('f-subtract'), task = lesson.tasks[4], draft = solve(task);
  draft.steps[task.steps[0].id].hint = true;
  draft.helpUsed = false;
  delete draft.firstHelpUsed;
  const state = engine.normalize(clone(savedDraft(lesson, task, draft)), allLessons);
  const restored = state.lessons[lesson.id].tasks[task.id];
  assert.equal(restored.helpUsed, true);
  assert.equal(restored.firstHelpUsed, true, 'missing attribution cannot invent independent success despite saved help');
  assert.equal(engine.progress(state, allLessons).independent.includes(task.id), false);
});

test('loading all 76 lessons preserves completed legacy records and unfinished new drafts', () => {
  const state = engine.fresh();
  for (const lesson of oldLessons) {
    const rec = engine.record();
    rec.phase = 'summary'; rec.cursor = 5; rec.completedAt = 123456789;
    rec.reason = {choice: lesson.reason.answer, wrong: 0, passed: true};
    for (const task of lesson.tasks.slice(0, 6)) {
      const draft = solve(task);
      delete draft.steps; // Original v1 records had no step subrecords.
      rec.tasks[task.id] = draft;
    }
    state.lessons[lesson.id] = rec;
  }
  const lesson = byId.get('w-zero'), task = lesson.tasks[4];
  const current = engine.record(), draft = engine.taskRecord(task), first = task.steps[0];
  current.phase = 'task'; current.cursor = 4;
  draft.steps[first.id].input = String(first.answer);
  assert.equal(engine.assessStep(task, draft, first.id).kind, 'correct');
  draft.steps[task.steps[1].id].input = '2';
  current.tasks[task.id] = draft;
  state.lessons[lesson.id] = current; state.active = lesson.id;
  const originalProgress = engine.normalize(clone(state), oldLessons);
  const expanded = engine.normalize(clone(state), allLessons);
  for (const old of oldLessons) assert.deepEqual(expanded.lessons[old.id], originalProgress.lessons[old.id], old.id + ': unchanged restored work');
  assert.equal(engine.progress(expanded, allLessons).completed.length, 40);
  assert.equal(engine.progress(expanded, allLessons).independent.length, 80);
  assert.equal(expanded.active, lesson.id);
  assert.equal(expanded.lessons[lesson.id].tasks[task.id].steps[first.id].solved, true);
  assert.equal(expanded.lessons[lesson.id].tasks[task.id].steps[task.steps[1].id].input, '2');
  assert.equal(expanded.lessons[lesson.id].tasks[task.id].steps[task.steps[1].id].solved, false);
  assert.equal(expanded.lessons[lesson.id].tasks[task.id].firstCorrect, null);
});

test('browser scripts and Node read identical banks without a network or module loader', () => {
  const context = {window: {}};
  vm.createContext(context);
  const globals = {written: 'ArzhenikovCourseWritten', fractions: 'ArzhenikovCourseFractions', decimals: 'ArzhenikovCourseDecimals'};
  for (const track of tracks) {
    const filename = 'arzhenikov-course-' + track.id + '.js';
    vm.runInContext(fs.readFileSync(path.join(directory, filename), 'utf8'), context, {filename});
    assert.deepEqual(clone(context.window[globals[track.id]]), track, track.id + ': identical self-contained data');
  }
});

module.exports = {tracks, lessons, tasks, allLessons, exact, oracle, expectedWritten};
