import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const trainerPath = 'trainers/oge-task6-fractions.html';
const baselineSha = 'fbd46afd92a58875b1b89af329b9d37a676abe52';
const git = (...args) => execFileSync('git',
  ['-c', 'safe.directory=' + root, ...args], { cwd: root, encoding: 'utf8' });
const html = fs.readFileSync(path.join(root, trainerPath), 'utf8');
const baseline = git('show', baselineSha + ':' + trainerPath);
const tasksBlock = source => {
  const matches = [...source.matchAll(/const TASKS = (\[[^\r\n]+\]);/g)];
  assert.equal(matches.length, 1, 'Exactly one frozen JSON TASKS declaration is required');
  return { bytes: Buffer.from(matches[0][0], 'utf8'), tasks: JSON.parse(matches[0][1]) };
};
const tasks = tasksBlock(html).tasks;
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
assert.equal(scripts.length, 1, 'One self-contained inline script');
const script = scripts[0][1];
// Validate the actual inline script before evaluating any trainer functions.
const syntaxResult = spawnSync(process.execPath, ['--check', '--input-type=commonjs'], {
  input: script, encoding: 'utf8', timeout: 10000,
});
assert.equal(syntaxResult.status, 0, syntaxResult.stderr || syntaxResult.error?.message);
let bigIntCalls = 0;
const context = vm.createContext({
  BigInt(value) { bigIntCalls++; return BigInt(value); },
});
const initialization = script.search(/\n(?:\/\/ Initialize trainer[^\n]*\n)?\$\('shuffle'\)\.(?:onchange|addEventListener)/);
assert.ok(initialization > 0, 'Find the explicit initialization boundary without executing DOM wiring');
vm.runInContext(script.slice(0, initialization), context, { timeout: 1000 });
const api = vm.runInContext('({ parseInput, eqFrac, createRecord, applyTaskEvent, summarizeRecords })', context);
const plain = value => JSON.parse(JSON.stringify(value));
const sourceMatches = (pattern, message = String(pattern)) => assert.ok(pattern.test(html), message);
const sourceRejects = (pattern, message = String(pattern)) => assert.ok(!pattern.test(html), message);
const scriptRejects = (pattern, message = String(pattern)) => assert.ok(!pattern.test(script), message);

test('inline JavaScript syntax is valid', () => {
  assert.equal(syntaxResult.status, 0, syntaxResult.stderr || syntaxResult.error?.message);
});

test('TASKS bytes, count, categories, order and duplicate data remain frozen', () => {
  assert.deepEqual(tasksBlock(html).bytes, tasksBlock(baseline).bytes, 'STOP: TASKS differs from approved baseline');
  assert.equal(tasks.length, 174);
  assert.deepEqual(tasks.reduce((counts, t) => {
    counts[t.cat] = (counts[t.cat] || 0) + 1; return counts;
  }, {}), { bank: 81, progon: 26, dec: 21, frac: 18, combo: 18, adv: 10 });
  const codes = tasks.map(t => t.code).filter(Boolean);
  assert.equal(new Set(codes).size, codes.length);
});

// This evaluator consumes displayed HTML only. Stored answers are read after
// evaluation for comparison, never as parsing or calculation inputs.
function gcd(a, b) {
  a = a < 0n ? -a : a; b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
}
function rational(n, d = 1n) {
  n = BigInt(n); d = BigInt(d);
  assert.notEqual(d, 0n, 'Nonzero denominator');
  if (d < 0n) { n = -n; d = -d; }
  const factor = gcd(n, d);
  return { n: n / factor, d: d / factor };
}
const add = (a, b) => rational(a.n * b.d + b.n * a.d, a.d * b.d);
const subtract = (a, b) => rational(a.n * b.d - b.n * a.d, a.d * b.d);
const multiply = (a, b) => rational(a.n * b.n, a.d * b.d);
const divide = (a, b) => rational(a.n * b.d, a.d * b.n);
const asFraction = value => value.n + '/' + value.d;
function decimal(text) {
  text = text.trim().replaceAll('−', '-');
  assert.match(text, /^-?\d+(?:[.,]\d+)?$/, 'Closed numeric grammar');
  const parts = text.replace(',', '.').split('.');
  return rational(BigInt(parts.join('')), 10n ** BigInt((parts[1] || '').length));
}
const atom = text => ({ kind: 'number', value: decimal(text) });

function htmlTree(source) {
  const rootNode = { tag: 'root', classes: [], children: [] };
  const stack = [rootNode];
  for (const token of source.match(/<[^>]+>|[^<]+/g) || []) {
    if (token.startsWith('</')) {
      assert.equal(stack.at(-1).tag, token.slice(2, -1), 'Balanced HTML');
      assert.ok(stack.length > 1); stack.pop();
    } else if (token.startsWith('<')) {
      const match = token.match(/^<(span|sup)(?: class="([^"]+)")?>$/);
      assert.ok(match, 'Unsupported HTML: ' + token);
      const node = { tag: match[1], classes: (match[2] || '').split(' '), children: [] };
      stack.at(-1).children.push(node); stack.push(node);
    } else if (token.trim()) {
      stack.at(-1).children.push(token.trim());
    }
  }
  assert.equal(stack.length, 1, 'All HTML tags closed');
  return rootNode;
}

function parseExpression(tokens) {
  let cursor = 0;
  function prefix() {
    const token = tokens[cursor++];
    assert.ok(token, 'Operand required');
    if (typeof token === 'object') return token;
    if (token === '+' || token === '-') {
      return { kind: 'unary', op: token, arg: expression(25) };
    }
    assert.equal(token, '(');
    const node = expression(0);
    assert.equal(tokens[cursor++], ')');
    return node;
  }
  function expression(minimum) {
    let left = prefix();
    while (cursor < tokens.length) {
      const op = tokens[cursor];
      const precedence = { '+': 10, '-': 10, '*': 20, '/': 20, '^': 30 }[op];
      if (precedence === undefined || precedence < minimum) break;
      cursor++;
      const right = expression(precedence + (op === '^' ? 0 : 1));
      left = { kind: 'binary', op, left, right };
    }
    return left;
  }
  const result = expression(0);
  assert.equal(cursor, tokens.length, 'Entire expression consumed');
  return result;
}

function tokensFromHtml(node) {
  if (typeof node === 'string') return [atom(node)];
  const has = name => node.classes.includes(name);
  const children = () => node.children.flatMap(tokensFromHtml);
  if (node.tag === 'root' || has('fn') || has('fd')) return children();
  if (node.tag === 'sup') return ['^', ...children()];
  if (has('f')) {
    assert.equal(node.children.length, 2);
    assert.deepEqual(node.children[0].classes, ['fn']);
    assert.deepEqual(node.children[1].classes, ['fd']);
    return [{
      kind: 'binary', op: '/',
      left: parseExpression(tokensFromHtml(node.children[0])),
      right: parseExpression(tokensFromHtml(node.children[1])),
    }];
  }
  if (has('mx')) {
    assert.equal(node.children.length, 2);
    return [{
      kind: 'mixed',
      whole: parseExpression(tokensFromHtml(node.children[0])),
      part: parseExpression(tokensFromHtml(node.children[1])),
    }];
  }
  assert.ok(node.children.every(child => typeof child === 'string'));
  const text = node.children.join('').trim();
  if (has('mn')) return [atom(text)];
  assert.ok(has('mo') || has('br'), 'Unsupported expression class');
  const op = text.replaceAll('−', '-').replaceAll('·', '*').replaceAll(':', '/');
  assert.ok(['+', '-', '*', '/', '(', ')'].includes(op), 'Closed operator grammar');
  return [op];
}

function evaluate(node) {
  if (node.kind === 'number') return node.value;
  if (node.kind === 'mixed') {
    const whole = evaluate(node.whole), part = evaluate(node.part);
    assert.equal(whole.d, 1n); assert.ok(whole.n >= 0n);
    assert.ok(part.n > 0n && part.n < part.d);
    return add(whole, part);
  }
  if (node.kind === 'unary') {
    const value = evaluate(node.arg);
    return node.op === '-' ? rational(-value.n, value.d) : value;
  }
  const left = evaluate(node.left), right = evaluate(node.right);
  if (node.op === '^') {
    assert.equal(right.d, 1n);
    assert.ok(right.n >= -100n && right.n <= 100n);
    return right.n < 0n
      ? rational(left.d ** -right.n, left.n ** -right.n)
      : rational(left.n ** right.n, left.d ** right.n);
  }
  const operation = { '+': add, '-': subtract, '*': multiply, '/': divide }[node.op];
  assert.ok(operation);
  return operation(left, right);
}
const evaluateHtml = source => evaluate(parseExpression(tokensFromHtml(htmlTree(source))));
const evaluateTokens = tokens => evaluate(parseExpression(tokens));

test('independent evaluator checks precedence, signs, mixed and nested fractions, and negative powers', () => {
  const cases = [
    [add(decimal('0.1'), decimal('0.2')), '3/10'],
    [decimal('-0,52'), '-13/25'],
    [rational(6, -8), '-3/4'],
    [rational(0, 100), '0/1'],
    [evaluateTokens([atom('2'), '+', atom('3'), '*', atom('4')]), '14/1'],
    [evaluateTokens(['(', atom('2'), '+', atom('3'), ')', '*', atom('4')]), '20/1'],
    [evaluateTokens([atom('8'), '/', atom('2'), '/', atom('2')]), '2/1'],
    [evaluateTokens(['-', atom('2'), '^', atom('2')]), '-4/1'],
    [evaluateTokens(['(', '-', atom('2'), ')', '^', atom('2')]), '4/1'],
    [evaluateTokens([atom('10'), '^', atom('−2')]), '1/100'],
    [evaluate({ kind: 'mixed', whole: atom('2'),
      part: { kind: 'binary', op: '/', left: atom('3'), right: atom('4') } }), '11/4'],
    [divide(rational(1), subtract(rational(1, 18), rational(1, 21))), '126/1'],
  ];
  for (const [actual, expected] of cases) assert.equal(asFraction(actual), expected);
  assert.throws(() => rational(1, 0));
  assert.throws(() => evaluateHtml('<span class="unknown">2</span>'));
  assert.throws(() => evaluateTokens([atom('1'), atom('2')]));
});

test('all 174 displayed expressions independently match n/d, display, termination and mode', () => {
  let verified = 0, numerator = 0;
  for (const task of tasks) {
    const id = task.code || task.cat + '#' + task.num;
    const actual = evaluateHtml(task.html);
    assert.ok(Number.isSafeInteger(task.n) && Number.isSafeInteger(task.d), id);
    assert.ok(task.d > 0, id);
    assert.equal(gcd(BigInt(task.n), BigInt(task.d)), 1n, id);
    assert.equal(asFraction(actual), asFraction(rational(task.n, task.d)), id);
    assert.ok(['value', 'numerator'].includes(task.mode), id);
    let denominator = actual.d;
    for (const factor of [2n, 5n]) while (denominator % factor === 0n) denominator /= factor;
    assert.equal(task.term, denominator === 1n, id);
    const display = /^-?\d+\/-?\d+$/.test(task.ansDisp)
      ? rational(...task.ansDisp.split('/')) : decimal(task.ansDisp);
    const expected = task.mode === 'numerator' ? rational(actual.n) : actual;
    assert.equal(asFraction(display), asFraction(expected), id);
    if (task.mode === 'numerator') {
      numerator++;
      assert.equal(BigInt(task.n), actual.n, id);
      sourceMatches(/числитель этой дроби/);
    }
    verified++;
  }
  assert.equal(numerator, 3);
  assert.equal(verified, 174);
});

const validInputs = [
  ['0,5', 1n, 2n], ['0.5', 1n, 2n], ['1/2', 1n, 2n], ['2/4', 1n, 2n],
  ['-0,5', -1n, 2n], ['−0.5', -1n, 2n], ['-1/2', -1n, 2n],
  ['1/-2', -1n, 2n], ['-1/-2', 1n, 2n], ['−1 / −2', 1n, 2n],
  ['  20  ', 20n, 1n], ['-20', -20n, 1n], ['−20', -20n, 1n],
  [' \t1 / 2 \n', 1n, 2n], ['1\t/\t-2', -1n, 2n],
  ['0', 0n, 1n], ['-0', 0n, 1n], ['0/-5', 0n, 1n],
  ['20.0', 20n, 1n], ['40/2', 20n, 1n], ['-20/-1', 20n, 1n],
  ['900719925474099312345/1801439850948198624690', 1n, 2n],
  ['9'.repeat(128), BigInt('9'.repeat(128)), 1n],
];
test('parser accepts 23 documented exact forms, including BigInt-sized fractions', () => {
  for (const [input, n, d] of validInputs) {
    const result = api.parseInput(input);
    assert.equal(result.ok, true, JSON.stringify(input));
    assert.equal(typeof result.value[0], 'bigint');
    assert.equal(typeof result.value[1], 'bigint');
    assert.notEqual(result.value[1], 0n);
    assert.equal(api.eqFrac(result.value, n, d), true, JSON.stringify(input));
  }
});

const invalidInputs = [
  ['', 'EMPTY'], [' \t\n ', 'EMPTY'],
  ['1 1/2', 'MIXED_NUMBER'], ['-3 1/50', 'MIXED_NUMBER'], ['−3 1 / 50', 'MIXED_NUMBER'],
  ['1/0', 'ZERO_DENOMINATOR'], ['0/0', 'ZERO_DENOMINATOR'],
  ['1/-0', 'ZERO_DENOMINATOR'], ['1 / 00', 'ZERO_DENOMINATOR'],
  ...['1 2', '1 2/3', '1/2 3', '0, 5', '- 1/2', '1/- 2', '1:2',
    'NaN', 'Infinity', '-Infinity', '1e3', '1E-3', '1+1', '2*3', '(2)',
    '1/2/3', '//', '/', '-', '--1', '++1', '+-1', '-+1', '−−1',
    '1/--2', 'abc', '<b>1</b>', '½', '1.', '.5', '1,2.3']
    .map(input => [input, 'UNSUPPORTED_FORMAT']),
];
test('parser rejects unsupported input without joining digital tokens', () => {
  for (const [input, expectedError] of invalidInputs) {
    const result = api.parseInput(input);
    assert.equal(result.ok, false, JSON.stringify(input));
    // A digit-gap before a fraction may be classified as mixed rather than generic.
    if (input === '1 2/3') assert.ok(['MIXED_NUMBER', expectedError].includes(result.error));
    else assert.equal(result.error, expectedError, JSON.stringify(input));
    assert.equal('value' in result, false);
  }
});

test('trimmed input over 128 characters is rejected before any BigInt conversion', () => {
  for (const input of ['9'.repeat(129), '0.' + '1'.repeat(127), '9'.repeat(1_000_000)]) {
    bigIntCalls = 0;
    assert.deepEqual(plain(api.parseInput(input)), { ok: false, error: 'TOO_LONG' });
    assert.equal(bigIntCalls, 0, 'Length check must precede BigInt parsing');
  }
  assert.equal(api.parseInput(' '.repeat(200) + '20' + ' '.repeat(200)).ok, true);
});

test('exact equality accepts equivalent numerator answers and rejects nearby huge fractions', () => {
  for (const input of ['20', '20.0', '20,0', '40/2', '-20/-1', ' 40 / 2 ']) {
    const result = api.parseInput(input);
    assert.equal(result.ok, true);
    assert.equal(api.eqFrac(result.value, 20, 1), true, input);
  }
  assert.equal(api.eqFrac([9007199254740993n, 9007199254740992n], 1, 1), false);
  assert.equal(api.eqFrac([-1n, -2n], 1, 2), true);
  assert.equal(api.eqFrac([0n, -5n], 0, 1), true);
});

function transition(record, event) {
  const before = plain(record);
  const result = api.applyTaskEvent(record, event);
  assert.deepEqual(plain(record), before, 'State transition must not mutate its input');
  assert.equal(typeof result.independentCredit, 'boolean');
  assert.equal(typeof result.resetStreak, 'boolean');
  return result;
}
function play(events) {
  let record = api.createRecord(), streak = 0;
  const transitions = [];
  for (const event of events) {
    const result = transition(record, event);
    record = result.record;
    if (result.resetStreak) streak = 0;
    if (result.independentCredit) streak++;
    transitions.push({ status: record.status, credit: result.independentCredit, reset: result.resetStreak });
  }
  return { record: plain(record), streak, transitions };
}

const stateCases = [
  ['first answer', ['correct'], 'solved-first', 0, false, 1],
  ['one wrong then correct', ['wrong', 'correct'], 'solved-retry', 1, false, 1],
  ['several wrong then correct', ['wrong', 'wrong', 'correct'], 'solved-retry', 2, false, 1],
  ['reveal then correct on revisit', ['reveal', 'correct'], 'revealed', 0, true, 0],
  ['wrong, reveal, correct', ['wrong', 'reveal', 'correct'], 'revealed', 1, true, 0],
  ['repeated first success', ['correct', 'correct'], 'solved-first', 0, false, 1],
  ['repeated retry success', ['wrong', 'correct', 'correct'], 'solved-retry', 1, false, 1],
  ['skip', ['skip'], 'skipped', 0, false, 0],
  ['skip then solve', ['skip', 'correct'], 'solved-first', 0, false, 1],
  ['wrong, skip, solve', ['wrong', 'skip', 'correct'], 'solved-retry', 1, false, 1],
  ['skip then reveal', ['skip', 'reveal'], 'revealed', 0, true, 0],
];
test('11 answer-history transitions preserve attempts, assistance and single credit', () => {
  assert.deepEqual(plain(api.createRecord()),
    { wrongAttempts: 0, answerWasRevealed: false, status: null });
  for (const [name, events, status, wrongAttempts, answerWasRevealed, streak] of stateCases) {
    const result = play(events);
    assert.deepEqual(result.record, { status, wrongAttempts, answerWasRevealed }, name);
    assert.equal(result.streak, streak, name);
    assert.ok(result.transitions.filter(t => t.credit).length <= 1, name);
  }
});

test('navigation changes neither historical attempts nor reveal provenance', () => {
  const records = {};
  records[5] = transition(api.createRecord(), 'wrong').record;
  records[8] = transition(api.createRecord(), 'reveal').record;
  // Render/navigation has no event to erase this per-task record.
  records[5] = transition(records[5], 'correct').record;
  records[8] = transition(records[8], 'correct').record;
  assert.equal(records[5].status, 'solved-retry');
  assert.equal(records[5].wrongAttempts, 1);
  assert.equal(records[8].status, 'revealed');
  assert.equal(records[8].answerWasRevealed, true);
});

test('skip, wrong and reveal reset streak; terminal revisits cannot mint credit', () => {
  for (const event of ['skip', 'wrong', 'reveal']) {
    assert.equal(transition(api.createRecord(), event).resetStreak, true, event);
  }
  for (const sequence of [['correct'], ['wrong', 'correct']]) {
    const solved = play(sequence).record;
    for (const event of ['correct', 'skip', 'reveal']) {
      const result = transition(solved, event);
      assert.equal(result.record.status, solved.status, event);
      assert.equal(result.independentCredit, false, event);
      if (event === 'reveal' || event === 'skip') assert.equal(result.resetStreak, true);
    }
  }
  const revealed = play(['reveal']).record;
  for (const event of ['correct', 'skip', 'reveal']) {
    const result = transition(revealed, event);
    assert.equal(result.record.status, 'revealed');
    assert.equal(result.record.answerWasRevealed, true);
    assert.equal(result.independentCredit, false);
  }
});

test('summary gives disjoint counts for current order and all-skipped truth', () => {
  const records = {
    0: play(['correct']).record,
    1: play(['wrong', 'correct']).record,
    2: play(['reveal', 'correct']).record,
    3: play(['skip']).record,
    4: api.createRecord(),
    6: play(['correct']).record,
  };
  const expected = { first: 1, retry: 1, revealed: 1, skipped: 1, unseen: 2, independent: 2, total: 6 };
  assert.deepEqual(plain(api.summarizeRecords([0, 1, 2, 3, 4, 5], records)), expected);
  const before = plain(api.summarizeRecords([0, 1, 2, 3, 4, 5], records));
  records[0] = transition(records[0], 'correct').record;
  records[1] = transition(records[1], 'correct').record;
  records[2] = transition(records[2], 'correct').record;
  assert.deepEqual(plain(api.summarizeRecords([0, 1, 2, 3, 4, 5], records)), before);
  assert.equal(before.first + before.retry + before.revealed + before.skipped + before.unseen, before.total);
  assert.deepEqual(plain(api.summarizeRecords([0, 1], {
    0: play(['skip']).record, 1: play(['skip']).record,
  })), { first: 0, retry: 0, revealed: 0, skipped: 2, unseen: 0, independent: 0, total: 2 });
  assert.deepEqual(plain(api.summarizeRecords([], records)),
    { first: 0, retry: 0, revealed: 0, skipped: 0, unseen: 0, independent: 0, total: 0 });
});

test('trainer remains offline, dependency-free and without storage APIs or dynamic code evaluation', () => {
  sourceRejects(/<script\b[^>]*\bsrc\s*=/i);
  sourceRejects(/<link\b[^>]*\bhref\s*=\s*["'](?:https?:)?\/\//i);
  sourceRejects(/@import\b|url\(\s*["']?(?:https?:)?\/\//i);
  scriptRejects(/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB)\b/);
  scriptRejects(/\beval\s*\(|\bnew\s+Function\b|\bimport\s*(?:\(|["'{*])/);
  scriptRejects(/document\.cookie|navigator\.serviceWorker/);
});

test('format contract, accessible navigation and disclosure exist in source', () => {
  sourceMatches(/maxlength=["']128["']/i);
  sourceRejects(/role=["']tab(?:list)?["']/i);
  sourceMatches(/aria-pressed/);
  sourceMatches(/aria-live=["']polite["']/);
  sourceMatches(/prefers-reduced-motion/);
  sourceMatches(/focus-visible/);
  sourceMatches(/<select\b[^>]*id=["'][^"']+["']/);
  sourceMatches(/Перейти к задаче/);
  sourceMatches(/Прогресс хранится только до обновления страницы/);
  sourceMatches(/Смена раздела или режима/);
  sourceMatches(/Раздел завершён/);
  sourceRejects(/Раздел пройден|с подсказкой/i);
  sourceMatches(/смешанн[а-яё\s]*числ[а-яё\s]*[^<\n]*неправильн/iu);
  scriptRejects(/replace\s*\(\s*\/\\s\+\/g\s*,\s*['"]['"]\s*\)/);
  const dotsStart = script.search(/function render(?:Dots|Navigation)\(/);
  assert.ok(dotsStart >= 0);
  const dotsEnd = script.indexOf('\nfunction ', dotsStart + 1);
  const dots = script.slice(dotsStart, dotsEnd < 0 ? initialization : dotsEnd);
  assert.ok(!/onclick|addEventListener|tabIndex|tabindex/.test(dots), 'Visual task indicators have no interaction handlers');
  sourceMatches(/id=["']dots["'][^>]*aria-hidden=["']true["']|aria-hidden=["']true["'][^>]*id=["']dots["']/);
});

test('two scoped relative help links resolve to existing offline files', () => {
  for (const target of ['./oge-basics/fraction-meaning.html', './oge-basics/fraction-common-denominator.html']) {
    assert.ok(html.includes('href="' + target + '"'), target);
    assert.ok(fs.statSync(path.resolve(root, 'trainers', target)).isFile(), target);
  }
  sourceMatches(/Повторить смысл дроби/);
  sourceMatches(/Потренировать общий знаменатель/);
});

test('only the six approved paths differ from the approved base', () => {
  const allowed = new Set([
    trainerPath,
    'tools/oge-task6-fractions-focused.test.mjs',
    'tools/oge-task6-fractions-focused.browser.mjs',
    'docs/tasks/OGE_TASK6_FRACTIONS_FOCUSED_FIX.md',
    'tools/trainer-inventory/test/inventory.test.mjs',
    'docs/tasks/TRAINER_INVENTORY_HASH_BASIS_V1.md',
  ]);
  const changed = [
    ...git('diff', '--name-only', baselineSha).trim().split(/\r?\n/),
    ...git('ls-files', '--others', '--exclude-standard').trim().split(/\r?\n/),
  ].filter(Boolean);
  for (const file of changed) assert.ok(allowed.has(file), 'Out-of-scope change: ' + file);
});
