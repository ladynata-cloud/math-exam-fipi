'use strict';

// Behavioral acceptance checks for the formula course. These fixtures are
// intentionally independent of the production question bank and rendering.
const test = require('node:test');
const assert = require('node:assert/strict');
const State = require('../ege-profil/trainers/trig-formula-alphabet/state.js');
const Course = require('../ege-profil/trainers/trig-formula-alphabet/data.js');

const DAY = 86400000;
const START = Date.UTC(2026, 10, 16, 8);
const tasks = [
  { id: 'm01-s1-t1', tag: 'fill', answers: ['2sin(x)cos(x)'] },
  { id: 'm01-s1-t2', tag: 'apply', answers: ['cos(6x)'] },
  { id: 'm01-s1-t3', tag: 'reverse', answers: ['sin(2x)'] },
  { id: 'm01-s1-t4', tag: 'assemble', answers: ['sin(x)cos(y)+cos(x)sin(y)'] },
  { id: 'm01-s1-t5', tag: 'method', answers: ['sin(x)(cos(x)-1)=0'] },
  { id: 'm01-s1-t6', tag: 'domain', answers: ['2sin(x);sin(x)!=0'] }
];
const secondTasks = [
  { id: 'm01-s2-t1', tag: 'fill', answers: ['1/2'] },
  { id: 'm01-s2-t2', tag: 'apply', answers: ['sqrt(3)/2'] }
];
const DATA = { version: 1, modules: [{ id: 'm01', skills: [
  { id: 'm01-s1', tasks }, { id: 'm01-s2', tasks: secondTasks }
] }] };

function memory(initial = {}) {
  const values = new Map(Object.entries(initial));
  const writes = [];
  return {
    values, writes,
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); writes.push(key); }
  };
}

function session(storage = memory(), at = START) {
  let timestamp = at;
  const now = () => timestamp;
  return {
    storage,
    store: State.createStore(storage, DATA, now),
    moveTo(value) { timestamp = value; },
    reload() { this.store = State.createStore(storage, DATA, now); return this.store; }
  };
}

function answer(store, task = tasks[0], mode = 'learn') {
  const skill = task.id.startsWith('m01-s2') ? 'm01-s2' : 'm01-s1';
  store.begin(task.id, skill, mode);
  return store.submit(task.id, task.answers[0], task);
}

test('notation accepts ordinary keyboard and typographic forms without swapping functions and arguments', () => {
  assert(State.matches('2 · cos x · sin 3x', ['2sin(3x)cos(x)']));
  assert(State.matches('cos β · sin α + sin β · cos α', ['sin(a)cos(b)+cos(a)sin(b)']));
  assert(State.matches('sin² x', ['sin(x)^2']));
  assert(State.matches('tg(x)', ['tan(x)']));
  assert(State.matches('ctg(x)', ['cot(x)']));
  assert(State.matches('√3 / 2', ['sqrt(3)/2']));
  assert(State.matches('0,5', ['1/2']));
  assert(!State.matches('sin(2x)', ['sin(x)^2']));
  assert(!State.matches('sin(a)cos(b)', ['cos(a)sin(b)']));
});

test('whole-factor and whole-summand reordering is accepted; useful transformations still have to be performed', () => {
  assert(State.matches('cos(x)*2*sin(3x)', ['2sin(3x)cos(x)']));
  assert(State.matches('cos(a)sin(b)+sin(a)cos(b)', ['sin(a)cos(b)+cos(a)sin(b)']));
  assert(State.matches('2*(3*x+4*x)/2', ['7x']));
  assert(State.matches('(sqrt(2)/2)*2', ['sqrt(2)']));
  assert(!State.matches('sin(2x)', ['2sin(x)cos(x)']), 'copying the original expression does not complete a requested expansion');
  assert(!State.matches('2sin(a)cos(b)', ['2sin((a+b)/2)cos((a-b)/2)']));
});

test('odd and even function signs are consistent with the order of the half-difference', () => {
  assert(State.matches('cos(-x)', ['cos(x)']));
  assert(State.matches('sin(-x)', ['-sin(x)']));
  assert(State.matches('tan(-x)', ['-tan(x)']));
  assert(State.matches('2sin((a+b)/2)sin((b-a)/2)', ['-2sin((a+b)/2)sin((a-b)/2)']));
  assert(!State.matches('2sin((a+b)/2)sin((a-b)/2)', ['-2sin((a+b)/2)sin((a-b)/2)']));
  assert(!State.matches('sin(-x)', ['sin(x)']));
});

test('equivalence does not erase an excluded denominator point or invent a cross-multiplication', () => {
  assert(!State.matches('sin(x)/sin(x)', ['1']), 'the former is undefined at x=0');
  assert(!State.matches('0/sin(x)', ['0']), 'zero numerator does not restore excluded points');
  assert(!State.matches('x*x^-1', ['1']), 'negative powers retain the nonzero condition');
  assert(!State.matches('1/(x+1)', ['(x-1)/(x^2-1)']), 'x=1 is excluded only in the second expression');
  assert(!State.matches('2sin(x)', ['2sin(x);sin(x)!=0']), 'a required restriction is part of the answer');
  assert(State.matches('2sin(x);sin(x)≠0', ['2sin(x);sin(x)!=0']));
});

test('a nonzero constant factor or its sign does not change denominator restrictions', () => {
  assert(State.matches('1/(-x)', ['-1/x']));
  assert(State.matches('1/(2x)', ['0.5/x']));
  assert(State.matches('sin(x)/cos(x)', ['2sin(x)/(2cos(x))']));
  assert(!State.matches('sin(x)/cos(x)', ['2sin(x)/(2sin(x))']));
});

test('rational coefficients are exact: decimals can be fractions but a small nonzero value is not zero', () => {
  assert(State.matches('0.1+0.2', ['0.3']));
  assert(State.matches('1/3+1/6', ['1/2']));
  assert(State.matches('0,5', ['1/2']));
  assert(!State.matches('0.0000000000001', ['0']));
  assert(!State.matches('1.0000000000001', ['1']));
  assert(!State.matches('sin(x)+0.0000000000001', ['sin(x)']));
  assert(!State.matches('0.3333333333333333', ['1/3']), 'an approximation is not the exact fraction requested');
});

test('numeric radicals remain exact under extraction, multiplication and rational denominators', () => {
  for (const [actual, expected] of [
    ['sqrt(8)/2', 'sqrt(2)'],
    ['sqrt(12)/2', 'sqrt(3)'],
    ['1/sqrt(2)', 'sqrt(2)/2'],
    ['sqrt(1/2)', 'sqrt(2)/2'],
    ['sqrt(2)*sqrt(3)', 'sqrt(6)'],
    ['sqrt(2)*sqrt(2)', '2'],
    ['(sqrt(2)+sqrt(3))^2', '5+2sqrt(6)'],
    ['(sqrt(3)-sqrt(2))*(sqrt(3)+sqrt(2))', '1']
  ]) assert(State.matches(actual, [expected]), actual);
  assert(!State.matches('1.4142135623730951', ['sqrt(2)']));
  assert(!State.matches('sqrt(6)', ['sqrt(2)+sqrt(3)']));
  assert(!State.matches('sqrt(-4)', ['2']));
});

test('a comma-separated pair or set cannot be read as one decimal answer', () => {
  const roots = ['-1,1', '1,-1', '±1'];
  assert(State.matches('-1, 1', roots));
  assert(State.matches('±1', roots));
  assert(!State.matches('-1.1', roots));
  assert(!State.matches('1.1', roots));
  assert(State.matches('(cos(t), sin(t))', ['(cos(t),sin(t))']));
  assert(!State.matches('(cos(t).sin(t))', ['(cos(t),sin(t))']));
});

test('undefined function domains survive multiplication by zero and excessive algebra is rejected safely', () => {
  assert(!State.matches('0sqrt(x)', ['0']));
  assert(!State.matches('0tan(x)', ['0']));
  assert(!State.matches('0arcsin(x)', ['0']));
  assert(!State.matches('0sqrt(-1)', ['0']));
  assert(!State.matches('0arcsin(2)', ['0']));
  assert(!State.matches('0^0', ['1']));
  assert(!State.matches('x^0', ['1']), 'zeroth powers retain the nonzero-base restriction');
  assert(State.matches('x^0', ['x/x']));
  assert(!State.matches('x^9999999999999999999999', ['1']));
  assert(!State.matches('('.repeat(30) + 'x' + ')'.repeat(30), ['x']));
  assert.throws(() => State.canonical('sin('.repeat(12) + 'x' + ')'.repeat(12)), /complexity/,
    'nested atom serialization is bounded as well as source length and parser depth');
});

test('undefined, malformed, excessive and executable input cannot be accepted', () => {
  for (const value of ['', ' ', '0/0', '1/0', '0.0.0', '1..2', '1.2.3', 'sqrt(-1)', 'sin(', 'Math.sin(x)',
    'globalThis.compromised=true', '<script>alert(1)</script>', 'x'.repeat(351)]) {
    assert(!State.matches(value, ['0', '1', '0.2', '0.36', 'sin(x)']), value);
  }
  assert.equal(globalThis.compromised, undefined);
});

test('a requested product must be visible outside the function arguments and cannot be faked with a unit factor', () => {
  for (const text of ['sin(x)*sin(x)', 'sin x sin x', '3sin(x)', '-(2sin(x))',
    'sin(x)(2cos(x)-1)', '(1-sin(x))(2sin(x)+1)', 'sin(x)*sin(x)/2']) {
    assert(State.checkForm(text, 'product'), text);
  }
  for (const text of ['sin²x', '1*sin(x)^2', '(2-1)*sin(x)^2', '2*sin(x)^2/2',
    '2*0.5*sin(x)^2', 'sin(x)+sin(x)+sin(x)', 'sin(2*x)', 'sin(x*y)', 'sin(']) {
    assert(!State.checkForm(text, 'product'), text);
  }
});

test('a requested sum permits a scalar multiple or denominator but ignores operations inside arguments', () => {
  for (const text of ['sin(x)+cos(x)', '(sin(a+b)-sin(a-b))/2',
    'sqrt(2)/2*(sin(x)-cos(x))', 'cos(x)^2-sin(x)^2']) {
    assert(State.checkForm(text, 'sum'), text);
  }
  for (const text of ['sin(a+b)', '2sin(a)cos(b)', '0+sin(x)', 'sin(x)+(1-1)*cos(x)',
    '(sin(x)+cos(x))*(sin(x)-cos(x))']) {
    assert(!State.checkForm(text, 'sum'), text);
  }
});

test('a requested power remains visible through a scalar coefficient and malformed shapes are rejected', () => {
  for (const text of ['sin²x', '2cos(x)^2', '-2sin(x)^2', 'sqrt(2)*cos(x)^2/2']) {
    assert(State.checkForm(text, 'power'), text);
  }
  for (const text of ['sin(x)*sin(x)', 'sin(x^2)', 'cos(x)^2+1', 'sin(x)^1', 'cos(']) {
    assert(!State.checkForm(text, 'power'), text);
  }
  assert(State.checkForm('any ordinary text', undefined));
  assert(!State.checkForm('sin(x)^2', 'unknown'));
  assert(!State.checkForm('x'.repeat(351), 'power'));
});

test('directional parity exercises require the requested arguments while allowing reordered whole factors', () => {
  const sine = [{ fn: 'sin', arg: 'x' }];
  assert(State.checkArguments('-sin(x)', sine));
  assert(State.checkArguments('-sin(2x-x)', sine));
  assert(!State.checkArguments('sin(-x)', sine), 'the untouched original is equal but has the wrong argument');
  assert(!State.checkArguments('-sin(x)+cos(x)-cos(x)', sine), 'unrequested trig calls are still visible');
  const product = [{ fn: 'sin', arg: 'x' }, { fn: 'cos', arg: 'x' }];
  assert(State.checkArguments('-cos(x)*sin(x)', product));
  assert(!State.checkArguments('sin(-x)*cos(-x)', product));
  assert(State.checkArguments('cos(2*x+x)', [{ fn: 'cos', arg: '3*x' }]));
  assert(!State.checkArguments('cos(-3*x)', [{ fn: 'cos', arg: '3*x' }]));
  assert(State.checkArguments('cos(a+(-b))', [{ fn: 'cos', arg: 'a-b' }]));
  assert(!State.checkArguments('cos(b-a)', [{ fn: 'cos', arg: 'a-b' }]));
  assert(State.checkArguments('-sin(a-x)', [{ fn: 'sin', arg: 'a-x' }]));
  assert(!State.checkArguments('sin(x-a)', [{ fn: 'sin', arg: 'a-x' }]));
});

test('a scalar-result argument requirement rejects unsimplified canceling trig calls', () => {
  assert(State.checkArguments('0', []));
  assert(State.checkArguments('2-2', []));
  assert(!State.checkArguments('sin(-x)+sin(x)', []));
  assert(!State.checkArguments('cos(-x)-cos(x)', []));
  assert(!State.checkArguments('sin(', []));
  assert(!State.checkArguments('0', 'invalid'));
  assert(State.checkArguments('arbitrary text', undefined));
});

test('every real course skill has different task types and can attain independent mastery using its declared answers', () => {
  const store = State.createStore(memory(), Course, () => START);
  const seen = new Set();
  let count = 0;
  assert(Course.modules.length >= 18);
  for (const mod of Course.modules) for (const skill of mod.skills) {
    assert(new Set(skill.tasks.map(t => t.tag)).size >= 2, skill.id + ' needs two distinct types for mastery');
    for (const task of skill.tasks) {
      assert(!seen.has(task.id), 'duplicate task ID ' + task.id); seen.add(task.id);
      for (const declared of task.answers) {
        assert(State.checkForm(declared, task.requiredForm), task.id + ': declared answer violates its requested form: ' + declared);
        assert(State.checkArguments(declared, task.requiredArgs), task.id + ': declared answer violates its requested arguments: ' + declared);
      }
      store.begin(task.id, skill.id);
      assert.equal(store.submit(task.id, task.answers[0]).status, 'independent', task.id);
      count++;
    }
    assert(store.state.skills[skill.id].independent.length >= 2, skill.id);
    assert(store.state.skills[skill.id].kinds.length >= 2, skill.id);
  }
  assert(count >= 324);
  assert.equal(store.summary().independent, store.summary().totalSkills);
  assert(store.summary().totalSkills >= 54);
});

test('real transformation goals reject unchanged or unfinished equivalent forms without marking a mathematical error', () => {
  const store = State.createStore(memory(), Course, () => START);
  const bank = new Map(Course.modules.flatMap(m => m.skills.flatMap(s => s.tasks.map(t => [t.id, { ...t, skillId: s.id }]))));
  const unfinished = [
    ['m01-s1-01', 'sin²x'],
    ['m01-s1-02', 'cos²(3x)'],
    ['m01-s1-03', 'sin(x)+sin(x)+sin(x)'],
    ['m04-s3-06', 'cos(x)*cos(x)'],
    ['m05-s1-01', 'sin(-x)'],
    ['m05-s1-02', 'cos(-3*x)'],
    ['m05-s1-03', 'sin(x-a)'],
    ['m05-s1-04', 'sin(-x)+sin(x)'],
    ['m05-s1-05', 'cos(-x)-cos(x)'],
    ['m05-s1-06', 'sin(-x)*cos(-x)'],
    ['m06-s3-05', '-sin(x)*sin(x)'],
    ['m08-s2-06', 'cos(b-a)'],
    ['m10-s3-04', '2*cos(x)*cos(x)'],
    ['m10-s3-05', '-2*sin(x)*sin(x)'],
    ['m12-s2-04', 'sin(x)-sin(-x)'],
    ['m13-s2-04', 'cos(x)-cos(-x)'],
    ['m14-s1-03', '(sin(4*x)+sin(-2*x))/2'],
    ['m14-s1-04', '(sin(a+b)+sin(b-a))/2'],
    ['m16-s1-01', '2*cos(x)^2-sqrt(3)*cos(x)'],
    ['m16-s1-02', '2*sin(x)*cos(x)-sin(x)'],
    ['m16-s1-03', '1+sin(x)-2*sin(x)^2'],
    ['m16-s1-05', '2*sin(2*x)*cos(2*x)-2*sin(2*x)*cos(x)'],
    ['m16-s2-06', 'sin(x)^2-sin(x)*cos(x)'],
    ['m17-s3-03', '4*sin(x)*sin(x)*sin(x)'],
    ['m17-s3-04', '4*cos(x)*cos(x)*cos(x)']
  ];
  for (const [id, text] of unfinished) {
    const t = bank.get(id), a = store.begin(id, t.skillId);
    assert(State.matches(text, t.answers), id + ': the submitted form is mathematically equivalent');
    assert.equal(store.submit(id, text).status, 'form', id);
    assert.equal(a.checks, 0, id);
    assert.equal(a.wrong, false, id);
    assert.equal(a.closed, false, id);
    assert.equal(a.draft, text, id);
    assert(!store.state.skills[t.skillId].independent.includes(id), id);
    assert.equal(store.submit(id, t.answers[0]).status, 'independent', id);
  }
});

test('unfinished equivalent form survives reload and cannot clear previously opened help', () => {
  const storage = memory(), task = Course.modules[0].skills[0].tasks[0];
  let store = State.createStore(storage, Course, () => START);
  store.begin(task.id, 'm01-s1'); store.help(task.id);
  assert.equal(store.submit(task.id, 'sin²x').status, 'form');
  store = State.createStore(storage, Course, () => START);
  assert.equal(store.current(task.id).draft, 'sin²x');
  assert.equal(store.current(task.id).assisted, true);
  assert.equal(store.submit(task.id, 'sin(x)*sin(x)').status, 'assisted');
});

test('old profile and standalone records are backed up and retained without granting new mastery', () => {
  const profile = { progress: { ssum: { derive: true, assemble: true, product: true }, testBest: 5 }, unknownProfileField: { preserved: 17 } };
  const standalone = { anotherCourse: { solved: 19 }, trigSumToProductTrainer: {
    progress: { derive: { sin_sum: { done: true, withHint: true } } },
    lastTestScore: 4, lastTestAt: START - DAY, unknownTopicField: 'retain'
  } };
  const storage = memory({ [State.KEY]: JSON.stringify(profile), [State.OLD_KEY]: JSON.stringify(standalone) });
  const a = session(storage);
  const snapshot = JSON.parse(storage.getItem(State.KEY));
  assert.deepEqual(snapshot.progress, profile.progress);
  assert.deepEqual(snapshot.unknownProfileField, profile.unknownProfileField);
  assert.deepEqual(JSON.parse(storage.getItem(State.OLD_KEY)), standalone);
  assert.deepEqual(a.store.state.legacy.standalone, standalone.trigSumToProductTrainer);
  assert.equal(a.store.summary().independent, 0);
  assert.equal(a.store.summary().recalled, 0);
  const backup = storage.getItem(State.BACKUP_KEY);
  assert.equal(JSON.parse(backup).profile, JSON.stringify(profile));
  assert.equal(JSON.parse(backup).standalone, JSON.stringify(standalone));
  answer(a.store);
  a.reload();
  assert.equal(storage.getItem(State.BACKUP_KEY), backup, 'repeated migration does not overwrite the original backup');
  assert.deepEqual(JSON.parse(storage.getItem(State.OLD_KEY)), standalone);
  assert.deepEqual(JSON.parse(storage.getItem(State.KEY)).unknownProfileField, profile.unknownProfileField);
});

test('a later unrelated envelope change survives an ordinary course save', () => {
  const a = session();
  const envelope = JSON.parse(a.storage.getItem(State.KEY));
  envelope.latestOtherField = { value: 23 };
  a.storage.setItem(State.KEY, JSON.stringify(envelope));
  assert.equal(answer(a.store).status, 'independent');
  assert.equal(a.store.warning, '');
  assert.deepEqual(JSON.parse(a.storage.getItem(State.KEY)).latestOtherField, { value: 23 });
});

test('a passive second store does not freeze the first, but help in one blocks stale independent grading in the other', () => {
  const storage = memory();
  const a = State.createStore(storage, DATA, () => START);
  a.begin(tasks[0].id, 'm01-s1');
  a.state.view = { screen: 'task', taskId: tasks[0].id };
  assert.equal(a.persist(), true);
  const b = State.createStore(storage, DATA, () => START + 1000);
  assert.equal(a.persist(), true, 'sanitizing the view or reordering object keys is not a new result');
  assert.equal(a.warning, '');
  a.help(tasks[0].id);
  const protectedSnapshot = storage.getItem(State.KEY);
  assert.equal(b.submit(tasks[0].id, tasks[0].answers[0]).status, 'conflict');
  assert.equal(b.current(tasks[0].id).closed, false);
  assert.equal(b.current(tasks[0].id).checks, 0);
  assert.equal(b.state.skills['m01-s1'].independent.length, 0);
  assert.match(b.warning, /другой вкладке.*Обнови страницу/);
  assert.equal(b.persist(), false);
  assert.equal(storage.getItem(State.KEY), protectedSnapshot);
  const reloaded = State.createStore(storage, DATA, () => START + 2000);
  assert.equal(reloaded.warning, '');
  assert.equal(reloaded.current(tasks[0].id).assisted, true);
  assert.equal(reloaded.submit(tasks[0].id, tasks[0].answers[0]).status, 'assisted');
});

test('a stale tab cannot overwrite a different task record, and reloading lets both records survive', () => {
  const storage = memory();
  const a = State.createStore(storage, DATA, () => START);
  a.begin(tasks[0].id, 'm01-s1');
  const b = State.createStore(storage, DATA, () => START);
  assert.equal(answer(a, tasks[1]).status, 'independent');
  const saved = storage.getItem(State.KEY);
  b.begin(tasks[2].id, 'm01-s1');
  assert.equal(b.submit(tasks[2].id, tasks[2].answers[0]).status, 'conflict');
  assert.equal(storage.getItem(State.KEY), saved);
  assert.equal(b.state.skills['m01-s1'].independent.length, 0);
  const reloaded = State.createStore(storage, DATA, () => START);
  assert.equal(answer(reloaded, tasks[2]).status, 'independent');
  assert.deepEqual(reloaded.state.skills['m01-s1'].independent, [tasks[1].id, tasks[2].id]);
  const latest = JSON.parse(storage.getItem(State.KEY)).alphabet;
  assert(latest.activeByTask[tasks[0].id]);
  assert(latest.activeByTask[tasks[1].id]);
  assert(latest.activeByTask[tasks[2].id]);
});

test('a conflicting write between submit validation and persistence rolls back the local grade', () => {
  const storage = memory(), store = State.createStore(storage, DATA, () => START);
  const attempt = store.begin(tasks[0].id, 'm01-s1');
  const external = JSON.parse(storage.getItem(State.KEY));
  external.alphabet.attempts[attempt.id].assisted = true;
  const externalRaw = JSON.stringify(external);
  const originalGet = storage.getItem.bind(storage);
  let reads = 0;
  storage.getItem = key => {
    if (key === State.KEY && ++reads === 2) storage.values.set(State.KEY, externalRaw);
    return originalGet(key);
  };
  assert.equal(store.submit(tasks[0].id, tasks[0].answers[0]).status, 'conflict');
  assert.equal(attempt.closed, false);
  assert.equal(attempt.checks, 0);
  assert.equal(store.state.skills['m01-s1'].independent.length, 0);
  assert.equal(store.state.skills['m01-s1'].dueAt, null);
  assert.equal(storage.values.get(State.KEY), externalRaw);
});

test('write-only storage denial remains memory mode and does not falsely report another-tab conflict', () => {
  const storage = { getItem() { return null; }, setItem() { throw new Error('quota'); } };
  const a = State.createStore(storage, DATA, () => START);
  assert.equal(answer(a).status, 'independent');
  assert.equal(answer(a, tasks[1]).status, 'independent');
  assert.equal(a.summary().independent, 1);
  assert.match(a.warning, /Сохранение недоступно/);
  assert(!a.warning.includes('другой вкладке'));
});

test('corrupt JSON is backed up and course work remains available', () => {
  const raw = '{unfinished';
  const a = session(memory({ [State.KEY]: raw }));
  assert.match(a.store.warning, /поврежден/);
  assert.equal(JSON.parse(a.storage.getItem(State.BACKUP_KEY)).profile, raw);
  assert.equal(answer(a.store).status, 'independent');
  assert.doesNotThrow(() => a.reload());
  assert.equal(a.store.summary().independent, 0, 'one clean answer is not two distinct demonstrated kinds');
});

test('partial and foreign state cannot award an unrelated skill or crash the course', () => {
  const original = { alphabet: { version: 1, skills: {
    'm01-s1': { independent: ['foreign-task', tasks[0].id, tasks[0].id, secondTasks[0].id], dueAt: 'tomorrow', stage: -8 },
    'foreign-skill': { independent: ['foreign-task'] }
  }, attempts: { a1: null, malformed: { taskId: tasks[0].id } }, activeByTask: { [tasks[0].id]: 'malformed' } } };
  const a = session(memory({ [State.KEY]: JSON.stringify(original) }));
  assert.equal(a.store.summary().totalSkills, 2);
  assert.equal(a.store.summary().independent, 0);
  assert.equal(a.store.state.skills['m01-s1'].independent.length, 1);
  assert.deepEqual(a.store.due(), []);
  assert.doesNotThrow(() => answer(a.store));
});

test('an extreme saved attempt counter wraps safely without reusing a retained attempt ID', () => {
  const original = { alphabet: { version: 1, serial: Number.MAX_SAFE_INTEGER,
    attempts: { a1: { taskId: tasks[0].id, skillId: 'm01-s1' } },
    activeByTask: { [tasks[0].id]: 'a1' }
  } };
  const a = session(memory({ [State.KEY]: JSON.stringify(original) }));
  assert.equal(a.store.begin(tasks[1].id, 'm01-s1').id, 'a2');
  assert.equal(a.store.begin(tasks[2].id, 'm01-s1').id, 'a3');
  assert.equal(a.store.current(tasks[0].id).id, 'a1');
  assert.equal(new Set(Object.keys(a.store.state.attempts)).size, 3);
  a.reload();
  assert.equal(a.store.current(tasks[0].id).id, 'a1');
  assert.equal(a.store.current(tasks[2].id).id, 'a3');
});

test('a future saved schema is protected from writes', () => {
  const raw = JSON.stringify({ preserved: 'future', alphabet: { version: 99, unfamiliar: [1, 2, 3] } });
  const a = session(memory({ [State.KEY]: raw }));
  assert.match(a.store.warning, /другая версия/);
  assert.equal(answer(a.store).status, 'independent');
  assert.equal(a.storage.getItem(State.KEY), raw);
  assert.equal(a.store.persist(), false);
});

test('storage denial degrades to an explicitly labelled live session', () => {
  const blocked = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  const a = session(blocked);
  assert.match(a.store.warning, /сеансе/);
  assert.equal(answer(a.store).status, 'independent');
  assert.equal(answer(a.store, tasks[1]).status, 'independent');
  assert.equal(a.store.summary().independent, 1);
});

test('a failed migration backup leaves the original record untouched', () => {
  const raw = JSON.stringify({ progress: { testBest: 5 }, original: true });
  const storage = memory({ [State.KEY]: raw });
  const write = storage.setItem.bind(storage);
  storage.setItem = (key, value) => {
    if (key === State.BACKUP_KEY) throw new Error('quota');
    write(key, value);
  };
  const a = session(storage);
  assert.match(a.store.warning, /резервную копию/);
  answer(a.store);
  assert.equal(storage.getItem(State.KEY), raw);
});

test('a study visit or a single clean answer is not whole-skill mastery', () => {
  const a = session();
  a.store.study('m01-s1');
  assert.equal(a.store.summary().studied, 1);
  assert.equal(a.store.summary().independent, 0);
  assert.equal(answer(a.store).status, 'independent');
  assert.equal(a.store.summary().independent, 0);
  assert.equal(answer(a.store, tasks[1]).status, 'independent');
  assert.equal(a.store.summary().independent, 1);
  assert.equal(a.store.summary().applied, 1);
  assert.equal(a.store.state.skills['m01-s2'].independent.length, 0);
});

test('opening help survives reload, navigation and attempted restart of the live item', () => {
  const a = session();
  const first = a.store.begin(tasks[0].id, 'm01-s1');
  a.store.help(tasks[0].id);
  assert.equal(JSON.parse(a.storage.getItem(State.KEY)).alphabet.attempts[first.id].assisted, true, 'help is persisted immediately');
  a.store.begin(secondTasks[0].id, 'm01-s2');
  a.reload();
  assert.equal(a.store.begin(tasks[0].id, 'm01-s1').id, first.id);
  assert.equal(a.store.repeat(tasks[0].id, 'm01-s1').id, first.id);
  assert.equal(a.store.submit(tasks[0].id, tasks[0].answers[0]).status, 'assisted');
  assert.equal(a.store.state.skills['m01-s1'].independent.length, 0);
  assert.equal(a.store.summary().assisted, 1);
});

test('wrong followed by correct remains a correction after reload; new independent items can still demonstrate the skill', () => {
  const a = session();
  a.store.begin(tasks[0].id, 'm01-s1');
  assert.equal(a.store.submit(tasks[0].id, '3sin(x)cos(x)').status, 'wrong');
  a.reload();
  assert.equal(a.store.submit(tasks[0].id, tasks[0].answers[0]).status, 'corrected');
  assert.equal(a.store.summary().independent, 0);
  assert.equal(answer(a.store, tasks[1]).status, 'independent');
  assert.equal(answer(a.store, tasks[2]).status, 'independent');
  assert.equal(a.store.summary().independent, 1);
  assert.equal(a.store.summary().corrected, 1);
});

test('format errors do not count as mathematical attempts and cannot clear earlier assistance', () => {
  const a = session();
  const attempt = a.store.begin(tasks[0].id, 'm01-s1');
  for (const input of ['', ' ', 'sin(', '0/0']) {
    assert.equal(a.store.submit(tasks[0].id, input).status, 'format');
  }
  assert.equal(attempt.checks, 0);
  assert.equal(attempt.wrong, false);
  a.store.help(tasks[0].id);
  assert.equal(a.store.submit(tasks[0].id, 'sin(').status, 'format');
  a.reload();
  assert.equal(a.store.submit(tasks[0].id, tasks[0].answers[0]).status, 'assisted');
});

test('repeated submit and begin cannot replay a closed answer or move a review deadline', () => {
  const a = session();
  answer(a.store);
  const before = JSON.stringify(a.store.state.skills['m01-s1']);
  const attemptId = a.store.current(tasks[0].id).id;
  for (let i = 0; i < 12; i++) {
    const response = a.store.submit(tasks[0].id, tasks[0].answers[0]);
    assert.equal(response.duplicate, true);
    assert.equal(a.store.begin(tasks[0].id, 'm01-s1').id, attemptId);
  }
  assert.equal(JSON.stringify(a.store.state.skills['m01-s1']), before);
  a.reload();
  assert.equal(a.store.submit(tasks[0].id, tasks[0].answers[0]).duplicate, true);
  assert.equal(JSON.stringify(a.store.state.skills['m01-s1']), before);
});

test('explicit familiar practice before its due date never earns delayed recall or another independent success', () => {
  const a = session();
  answer(a.store);
  a.store.repeat(tasks[0].id, 'm01-s1', 'review');
  assert.equal(a.store.submit(tasks[0].id, tasks[0].answers[0]).status, 'familiar');
  assert.equal(a.store.summary().recalled, 0);
  assert.equal(a.store.state.skills['m01-s1'].independent.length, 1);
  assert.deepEqual(a.store.due(), []);
});

test('delayed clean retrieval schedules 1, 3, 7, 14 and 30 day intervals and survives reload', () => {
  const a = session();
  answer(a.store);
  let record = a.store.state.skills['m01-s1'];
  assert.equal(record.dueAt - START, DAY);
  for (const interval of [3, 7, 14, 30, 30]) {
    const scheduled = record.dueAt;
    a.moveTo(scheduled - 1);
    assert.deepEqual(a.store.due(), []);
    a.moveTo(scheduled);
    a.reload();
    assert.deepEqual(a.store.due(), ['m01-s1']);
    a.store.repeat(tasks[0].id, 'm01-s1', 'review');
    assert.equal(a.store.submit(tasks[0].id, tasks[0].answers[0]).status, 'recalled');
    record = a.store.state.skills['m01-s1'];
    assert.equal(record.dueAt - scheduled, interval * DAY);
    const deadline = record.dueAt;
    a.store.submit(tasks[0].id, tasks[0].answers[0]);
    assert.equal(record.dueAt, deadline);
  }
  assert.equal(a.store.summary().recalled, 1);
});

test('an error alone brings a well-spaced skill back to a near review even if the learner leaves', () => {
  const a = session();
  answer(a.store);
  for (let n = 0; n < 4; n++) {
    a.moveTo(a.store.state.skills['m01-s1'].dueAt);
    a.store.repeat(tasks[0].id, 'm01-s1', 'review');
    a.store.submit(tasks[0].id, tasks[0].answers[0]);
  }
  const currentTime = a.store.state.skills['m01-s1'].lastSuccess;
  a.store.repeat(tasks[0].id, 'm01-s1', 'practice');
  assert.equal(a.store.submit(tasks[0].id, '3sin(x)cos(x)').status, 'wrong');
  a.reload();
  assert.equal(a.store.state.skills['m01-s1'].stage, 0);
  assert.equal(a.store.state.skills['m01-s1'].dueAt, currentTime + DAY);
});

test('the first help request shortens a thirty-day interval immediately and repeat help does not postpone it', () => {
  const a = session();
  answer(a.store);
  for (let n = 0; n < 4; n++) {
    a.moveTo(a.store.state.skills['m01-s1'].dueAt);
    a.store.repeat(tasks[0].id, 'm01-s1', 'review');
    a.store.submit(tasks[0].id, tasks[0].answers[0]);
  }
  const currentTime = a.store.state.skills['m01-s1'].lastSuccess;
  assert.equal(a.store.state.skills['m01-s1'].dueAt, currentTime + 30 * DAY);
  a.store.repeat(tasks[0].id, 'm01-s1', 'practice');
  a.store.help(tasks[0].id);
  a.reload();
  assert.equal(a.store.current(tasks[0].id).assisted, true);
  assert.equal(a.store.current(tasks[0].id).wrong, false);
  assert.equal(a.store.state.skills['m01-s1'].stage, 0);
  assert.equal(a.store.state.skills['m01-s1'].dueAt, currentTime + DAY);
  a.moveTo(currentTime + DAY / 2);
  a.store.help(tasks[0].id); a.reload();
  assert.equal(a.store.state.skills['m01-s1'].dueAt, currentTime + DAY, 'reopening the same help does not keep postponing review');
});

test('exhausting a finite bank with help does not turn familiar or delayed known examples into new independent evidence', () => {
  const a = session();
  for (const t of tasks) {
    a.store.begin(t.id, 'm01-s1'); a.store.help(t.id);
    assert.equal(a.store.submit(t.id, t.answers[0]).status, 'assisted');
  }
  a.store.repeat(tasks[0].id, 'm01-s1');
  assert.equal(a.store.submit(tasks[0].id, tasks[0].answers[0]).status, 'familiar');
  a.moveTo(a.store.state.skills['m01-s1'].dueAt);
  a.store.repeat(tasks[0].id, 'm01-s1', 'review');
  assert.equal(a.store.submit(tasks[0].id, tasks[0].answers[0]).status, 'recalled');
  assert.equal(a.store.summary().independent, 0);
  assert.equal(a.store.summary().recalled, 1);
  assert.equal(a.store.state.skills['m01-s1'].independent.length, 0);
});

test('help during a scheduled review cannot earn recalled status', () => {
  const a = session();
  answer(a.store);
  const scheduled = a.store.state.skills['m01-s1'].dueAt;
  a.moveTo(scheduled);
  a.store.repeat(tasks[0].id, 'm01-s1', 'review');
  a.store.help(tasks[0].id);
  a.reload();
  assert.equal(a.store.submit(tasks[0].id, tasks[0].answers[0]).status, 'assisted');
  assert.equal(a.store.summary().recalled, 0);
  assert.equal(a.store.state.skills['m01-s1'].dueAt, scheduled + DAY);
});

test('read-only reporting neither mutates storage nor exposes shared unrelated course records', () => {
  const storage = memory({ [State.OLD_KEY]: JSON.stringify({
    unrelatedCourse: { value: 'not part of this report' }, trigSumToProductTrainer: { progress: {} }
  }) });
  const a = session(storage);
  answer(a.store);
  const before = JSON.stringify([...storage.values]);
  const report = a.store.report();
  assert.equal(report.kind, 'mathexam-formula-alphabet-report');
  assert.equal(report.summary.totalSkills, 2);
  assert.equal(JSON.stringify([...storage.values]), before);
  assert(!JSON.stringify(report).includes('unrelatedCourse'));
  report.skills['m01-s1'].independent.length = 0;
  assert.equal(a.store.state.skills['m01-s1'].independent.length, 1, 'report is a detached snapshot');
});
