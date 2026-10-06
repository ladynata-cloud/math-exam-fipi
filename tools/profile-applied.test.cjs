'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const lessons = require('../ege-profil/start/applied-data.js');
const tasks = lessons.flatMap(l => l.tasks);
const state = require('../ege-profil/start/state.js');
const close = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-7 * Math.max(1, Math.abs(expected)), `${label}: ${actual} != ${expected}`);
const root = path.resolve(__dirname, '..');

// These oracles use physical/accounting identities, independent of the stored
// answers, prompts, model values and authored intermediate calculations.
function oracle(m) {
  switch (m.kind) {
    case 'heat': return m.mass * m.capacity * m.rise;
    case 'power': return m.voltage * m.voltage / m.resistance;
    case 'pressure': return (m.surface + m.density * m.gravity * m.depth) / 1000;
    case 'braking': return (m.speed - Math.sqrt(m.speed * m.speed - 2 * m.acceleration * m.distance)) / m.acceleration;
    case 'decay': return Math.log(m.initial / m.final) / Math.log(2) * m.coefficient;
    case 'voltage-limit': return Math.sqrt(m.limit * m.resistance);
    case 'motion': {
      const slow = (Math.sqrt(m.difference ** 2 + 4 * m.distance * m.difference / m.gap) - m.difference) / 2;
      return slow + (m.askFast ? m.difference : 0);
    }
    case 'joint-work': return m.first * m.second / (m.first + m.second);
    case 'missing-worker': return m.joint * m.first / (m.first - m.joint);
    case 'production': return (Math.sqrt(m.difference ** 2 + 4 * m.amount * m.difference / m.gap) - m.difference) / 2;
    case 'mixture': return m.mass * (m.high - m.target) / (m.high - m.low);
    case 'dilution': return m.mass * (m.initial / m.target - 1);
    case 'two-mixtures': {
      const total = m.addedMass * m.replacement / (m.secondPercent - m.firstPercent);
      const initial = total - m.addedMass;
      return (m.high * initial - m.firstPercent * total) / (m.high - m.low);
    }
    case 'deposit': return m.amount * ((100 + m.rate) / 100) ** 2;
    case 'original-deposit': return 100 * m.final / (100 + m.rate);
    case 'compare-deposits': return m.amount * ((100 + m.compoundRate) / 100) ** 2 - m.amount * (1 + 2 * m.simpleRate / 100);
    case 'loan-linear': {
      let outstanding = m.amount, payments = 0;
      for (let year = 0; year < m.years; year++) { payments += outstanding * m.rate / 100 + m.amount / m.years; outstanding -= m.amount / m.years; }
      close(outstanding, 0, 'linear loan closed');
      return payments - (m.overpayment ? m.amount : 0);
    }
    case 'loan-principal': {
      let perRouble = 0;
      for (let year = 0; year < m.years; year++) perRouble += 1 / m.years + (1 - year / m.years) * m.rate / 100;
      return m.total / perRouble;
    }
    case 'loan-equal': {
      // Solve the remaining-debt recurrence; do not copy the annuity formula.
      const balance = payment => { let debt = m.amount; for (let i = 0; i < m.years; i++) debt += debt * m.rate / 100 - payment; return debt; };
      let low = 0, high = m.amount * (1 + m.rate / 100);
      for (let i = 0; i < 100; i++) { const middle = (low + high) / 2; if (balance(middle) > 0) low = middle; else high = middle; }
      const payment = (low + high) / 2; close(balance(payment), 0, 'equal-payment loan closed');
      return payment * m.years - (m.overpayment ? m.amount : 0);
    }
    default: throw Error('Missing independent oracle: ' + m.kind);
  }
}
function chain(m) {
  const answer = oracle(m);
  switch (m.kind) {
    case 'heat': return [m.mass * m.capacity, answer];
    case 'power': return [m.voltage ** 2, answer];
    case 'pressure': return [m.density * m.gravity * m.depth, answer * 1000, answer];
    case 'braking': {
      const b = 2 * m.speed / m.acceleration, c = 2 * m.distance / m.acceleration;
      return [b * b - 4 * c, Math.sqrt(b * b - 4 * c), answer];
    }
    case 'decay': return [m.initial / m.final, Math.log2(m.initial / m.final), answer];
    case 'voltage-limit': return [m.resistance * m.limit, answer];
    case 'motion': case 'production': {
      const product = (m.distance || m.amount) * m.difference / m.gap, discr = m.difference ** 2 + 4 * product;
      const out = [product, discr, Math.sqrt(discr), (Math.sqrt(discr) - m.difference) / 2];
      if (m.askFast) out.push(answer);
      return out;
    }
    case 'joint-work': return [1 / m.first, 1 / m.second, (m.first + m.second) / (m.first * m.second), answer];
    case 'missing-worker': return [1 / m.joint, (m.first - m.joint) / (m.joint * m.first), answer];
    case 'mixture': return [m.mass * m.high / 100, m.mass * m.target / 100, m.mass * (m.high - m.target) / 100, (m.high - m.low) / 100, answer];
    case 'dilution': return [m.mass * m.initial / 100, m.mass * m.initial / m.target, answer];
    case 'two-mixtures': {
      const total = m.addedMass * m.replacement / (m.secondPercent - m.firstPercent), initial = total - m.addedMass;
      const salt = m.firstPercent / 100 * total;
      return [m.addedMass * m.replacement / 100, total, initial, salt, m.high * initial - salt * 100, answer];
    }
    case 'deposit': {
      const interest = m.amount * m.rate / 100, after = m.amount + interest;
      return [interest, after, after * m.rate / 100, answer];
    }
    case 'original-deposit': return [(100 + m.rate) / 100, answer];
    case 'compare-deposits': return [2 * m.amount * m.simpleRate / 100, m.amount * (1 + 2 * m.simpleRate / 100), m.amount * (1 + m.compoundRate / 100), m.amount * (1 + m.compoundRate / 100) ** 2, answer];
    case 'loan-linear': {
      const debts = Array.from({ length: m.years }, (_, i) => m.amount * (1 - i / m.years)).reduce((s, debt) => s + debt, 0);
      const out = [m.amount / m.years, debts, debts * m.rate / 100];
      if (!m.overpayment) out.push(answer); return out;
    }
    case 'loan-principal': return [m.rate / 100 * (m.years + 1) / 2, 1 + m.rate / 100 * (m.years + 1) / 2, answer];
    case 'loan-equal': {
      const q = (100 + m.rate) / 100, first = m.amount * q, second = first * q;
      const result = [q, first, second, q + 1];
      if (m.years === 3) result.push(second * q, (q + 1) * q + 1);
      const total = answer + (m.overpayment ? m.amount : 0);
      result.push(total / m.years, total); if (m.overpayment) result.push(answer); return result;
    }
    default: throw Error('Missing step audit: ' + m.kind);
  }
}

test('48 distinct author-written tasks cover formulae 10, text problems 11 and finance 13', () => {
  assert.equal(lessons.length, 8); assert.equal(tasks.length, 48);
  const positions = new Map(), ids = new Set(), prompts = new Set();
  for (const lesson of lessons) {
    positions.set(lesson.position, (positions.get(lesson.position) || 0) + 1);
    assert.equal(lesson.tasks.length, 6); assert.ok(lesson.intro && lesson.why && lesson.prereq.text);
    for (const task of lesson.tasks) {
      assert.ok(!ids.has(task.id), task.id); ids.add(task.id);
      assert.ok(!prompts.has(task.prompt), task.id); prompts.add(task.prompt);
      assert.ok(task.steps.length >= 2 && task.steps.length <= 9, task.id);
      assert.ok(task.explanation && task.diagram.rows.length >= 2 && task.diagram.target && task.diagram.help);
      for (const step of task.steps) assert.ok(step.prompt && step.hint && step.why && step.focus);
      assert.doesNotMatch(JSON.stringify(task), /NaN|Infinity|undefined/, task.id);
    }
  }
  assert.deepEqual([...positions], [[10, 2], [11, 3], [13, 3]]);
  assert.match(lessons.find(l => l.id === 'applied-percent').intro, /подготовка/);
});

test('all final and intermediate numbers agree with independently recomputed physical and financial identities', () => {
  for (const task of tasks) {
    const answer = oracle(task.meta); close(task.answer, answer, task.id);
    assert.ok(Number.isFinite(task.answer) && task.answer > 0);
    // The answer must be an exact terminating decimal suitable for the short
    // answer form, rather than an accidental unannounced irrational root.
    close(task.answer * 100, Math.round(task.answer * 100), task.id + ' short numeric answer');
    const expected = chain(task.meta); assert.equal(task.steps.length, expected.length, task.id);
    expected.forEach((value, i) => close(task.steps[i].answer, value, task.id + ': step ' + (i + 1)));
    close(task.steps.at(-1).answer, task.answer, task.id + ' final step');
  }
});

test('the computed answers satisfy the original statements and meaningful domains', () => {
  for (const { id, meta: m, answer } of tasks) {
    if (m.kind === 'motion') {
      const slow = answer - (m.askFast ? m.difference : 0), fast = slow + m.difference;
      assert.ok(slow > 0 && fast > slow); close(m.distance / slow - m.distance / fast, m.gap, id);
    }
    if (m.kind === 'production') close(m.amount / answer - m.amount / (answer + m.difference), m.gap, id);
    if (m.kind === 'braking') { assert.ok(answer >= 0 && answer <= m.speed / m.acceleration); close(m.speed * answer - m.acceleration * answer ** 2 / 2, m.distance, id); }
    if (m.kind === 'voltage-limit') { close(answer ** 2 / m.resistance, m.limit, id); assert.ok((answer + .01) ** 2 / m.resistance > m.limit); }
    if (m.kind === 'mixture') { assert.ok(answer < m.mass); close(answer * m.low + (m.mass - answer) * m.high, m.mass * m.target, id); }
    if (m.kind === 'dilution') close(m.mass * m.initial, (m.mass + answer) * m.target, id);
    if (m.kind === 'two-mixtures') {
      const total = m.addedMass * m.replacement / (m.secondPercent - m.firstPercent), initial = total - m.addedMass;
      assert.ok(answer > 0 && answer < initial);
      const salt = answer * m.low / 100 + (initial - answer) * m.high / 100;
      close(salt / total * 100, m.firstPercent, id + ' water scenario');
      close((salt + m.addedMass * m.replacement / 100) / total * 100, m.secondPercent, id + ' replacement scenario');
    }
  }
});

test('browser scripts register every task model without changing existing lessons', () => {
  const ctx = vm.createContext({ ProfileLessons: [{ id: 'existing' }], ProfileTaskModels: { existing: () => {} } });
  vm.runInContext(fs.readFileSync(path.join(root, 'ege-profil/start/applied-data.js'), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'ege-profil/start/applied-tasks.js'), 'utf8'), ctx);
  assert.equal(ctx.ProfileLessons[0].id, 'existing'); assert.equal(ctx.ProfileLessons.length, 9);
  for (const task of tasks) assert.equal(typeof ctx.ProfileTaskModels[task.id], 'function', task.id);
  assert.equal(typeof ctx.ProfileTaskModels.existing, 'function');
});

test('guided and independent task pools stay separate and survive state serialization', () => {
  for (const lesson of lessons) {
    const store = new Map(), storage = { getItem: key => store.get(key) || null, setItem: (key, value) => store.set(key, value) };
    const model = state.create([lesson], storage), guided = new Set();
    for (let i = 0; i < 3; i++) { const s = model.start(lesson.id, 'guided', true); guided.add(s.taskId); model.finish(lesson.id, 'guided', s); }
    assert.equal(guided.size, 3);
    const independent = new Set();
    for (let i = 0; i < 3; i++) { const s = model.start(lesson.id, 'independent', true); assert.ok(!guided.has(s.taskId) && !s.familiar); independent.add(s.taskId); model.finish(lesson.id, 'independent', s); }
    assert.equal(independent.size, 3); model.persist();
    const restored = state.create([lesson], storage); assert.equal(restored.record(lesson.id).independent.length, 3);
    assert.equal(restored.start(lesson.id, 'independent', true).familiar, true);
  }
});

test('all figures remain finite; only earned answers appear and instructional reveals are recorded', () => {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM('<!doctype html><div id="model"></div>', { runScripts: 'outside-only' });
  const { window } = dom, container = window.document.getElementById('model');
  window.eval(fs.readFileSync(path.join(root, 'ege-profil/start/applied-data.js'), 'utf8'));
  window.eval(fs.readFileSync(path.join(root, 'ege-profil/start/applied-tasks.js'), 'utf8'));
  for (const task of tasks) {
    let helps = 0;
    const dispose = window.ProfileTaskModels[task.id](container, task, { mode: 'independent', step: 0, solved: false, onHelp() { helps++; } });
    const svg = container.querySelector('svg'); assert.ok(svg, task.id);
    assert.equal(svg.dataset.focus, 'neutral'); assert.doesNotMatch(svg.outerHTML, /NaN|Infinity|undefined/);
    assert.equal(container.querySelector('[data-target] td').textContent, '?', task.id + ': no unearned answer');
    assert.equal(container.querySelectorAll('[data-given]').length, task.diagram.rows.length);
    assert.ok(!container.textContent.includes(task.diagram.help), task.id + ': no unsolicited strategy');
    const highlight = container.querySelector('[data-model-action="highlight"]'); highlight.click();
    assert.equal(helps, 0); assert.equal(highlight.getAttribute('aria-pressed'), 'true');
    assert.equal(container.querySelector('[data-target] td').textContent, '?');
    const explain = container.querySelector('[data-model-action="explain"]'); explain.click();
    assert.equal(helps, 1); assert.equal(explain.getAttribute('aria-expanded'), 'true');
    assert.ok(container.textContent.includes(task.diagram.help));
    assert.equal(container.querySelector('[data-target] td').textContent, '?');
    explain.click(); assert.equal(helps, 1); assert.equal(explain.getAttribute('aria-expanded'), 'false');
    dispose(); highlight.click(); explain.click(); assert.equal(helps, 1, task.id + ': cleanup removes listeners');
    const done = window.ProfileTaskModels[task.id](container, task, { mode: 'independent', solved: true, onHelp() { helps++; } });
    close(Number(container.querySelector('[data-target] td').textContent.replace(',', '.').replace('−', '-')), task.answer, task.id + ': earned answer');
    container.querySelector('[data-model-action="explain"]').click(); assert.equal(helps, 1, task.id + ': post-answer help preserves earned credit'); done();
    for (let step = 0; step < task.steps.length; step++) {
      const disposeStep = window.ProfileTaskModels[task.id](container, task, { mode: 'guided', step, solved: false, completed: step });
      assert.equal(container.querySelector('[data-target] td').textContent, '?'); disposeStep();
    }
  }
  dom.window.close();
});
