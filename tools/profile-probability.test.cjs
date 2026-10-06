'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const lessons = require('../ege-profil/start/probability-data.js');
const tasks = lessons.flatMap(l => l.tasks);
const root = path.resolve(__dirname, '..');
const close = (actual, expected, label) => assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < 1e-9, `${label}: ${actual} != ${expected}`);
const sum = values => values.reduce((a, b) => a + b, 0);
const outcomes = count => Array.from({ length: 2 ** count }, (_, code) => Array.from({ length: count }, (_, j) => (code >> j) & 1));
// Independent numerical audit. Enumeration checks event probabilities instead
// of reproducing the authored multiplication/combinations shortcuts.
function chain(m) {
  switch (m.kind) {
    case 'classical': {
      const bag = [...Array(m.red).fill('red'), ...Array(m.blue).fill('blue')];
      const red = bag.filter(x => x === 'red').length;
      return [bag.length, red, red / bag.length];
    }
    case 'complement-count': return [m.total - m.studied, (m.total - m.studied) / m.total];
    case 'complement-chance': return [1 - m.p];
    case 'range': return [m.pUpper, m.pUpper - m.pLower];
    case 'both': return [m.p * m.q];
    case 'atleast': {
      const pq = [m.p, m.q];
      const probability = sum(outcomes(2).filter(row => sum(row) >= 1).map(row => row.reduce((v, hit, i) => v * (hit ? pq[i] : 1 - pq[i]), 1)));
      return [1 - m.p, 1 - m.q, (1 - m.p) * (1 - m.q), probability];
    }
    case 'sequence': return [1 - m.p, m.p ** 2, (1 - m.p) ** 2, [1, 1, 0, 0].reduce((v, hit) => v * (hit ? m.p : 1 - m.p), 1)];
    case 'afterdraw': return [m.total - 1, m.red - 1, (m.red - 1) / (m.total - 1)];
    case 'full': return [1 - m.bad, m.bad * m.rejectBad, (1 - m.bad) * m.rejectGood, m.bad * m.rejectBad + (1 - m.bad) * m.rejectGood];
    case 'conditional': return [m.group, m.event / m.group];
    case 'bernoulli': {
      const matching = outcomes(m.trials).filter(row => sum(row) === m.hits);
      const weights = matching.map(row => row.reduce((p, hit) => p * (hit ? m.p : 1 - m.p), 1));
      return [1 - m.p, weights[0], matching.length, sum(weights)];
    }
    case 'missing': {
      const known = sum(m.probabilities.filter(x => x !== null)); return [known, 1 - known];
    }
    case 'expectation': {
      const terms = m.values.map((x, i) => x * m.probabilities[i]); return [...terms, sum(terms)];
    }
    case 'lottery': {
      const allTickets = m.prizes.flatMap((prize, i) => Array(m.counts[i]).fill(prize));
      allTickets.push(...Array(m.total - allTickets.length).fill(0));
      return [m.prizes[0] * m.counts[0], m.prizes[1] * m.counts[1], sum(allTickets), sum(allTickets) / allTickets.length];
    }
    case 'variance-two': {
      const values = [m.low, m.high], mean = sum(values) / values.length;
      const variance = sum(values.map(x => (x - mean) ** 2)) / values.length;
      return [mean, mean - m.low, variance];
    }
    case 'standard': return [Math.sqrt(m.variance)];
    case 'binomial-variance': {
      // Obtain moments from the full distribution, including all possible
      // counts; no use of the np(1-p) expression authored for the student.
      const choose = (n, k) => { let c = 1; for (let j = 1; j <= k; j++) c *= (n - j + 1) / j; return c; };
      const dist = Array.from({ length: m.trials + 1 }, (_, k) => ({ value: k, prob: choose(m.trials, k) * m.p ** k * (1 - m.p) ** (m.trials - k) }));
      const mean = sum(dist.map(x => x.value * x.prob));
      return [1 - m.p, mean, sum(dist.map(x => (x.value - mean) ** 2 * x.prob))];
    }
    case 'uniform': return [m.b - m.a, m.right - m.left, (m.right - m.left) / (m.b - m.a)];
    case 'normal': return [1 - m.middle, (1 - m.middle) / 2];
    case 'exponential': return [Math.exp(2 * Math.log(m.survive))];
    default: throw Error('Missing independent audit: ' + m.kind);
  }
}

test('nine themes, three per exam position, have separate guided/independent numerical examples', () => {
  assert.equal(lessons.length, 9); assert.equal(tasks.length, 54);
  const ids = new Set(), prompts = new Set();
  for (const position of [4, 5, 6]) assert.equal(lessons.filter(l => l.position === position).length, 3);
  for (const l of lessons) {
    assert.equal(l.tasks.length, 6); assert.equal(l.group, 'probability');
    assert.ok(l.title && l.summary && l.intro && l.why && l.prereq.text && l.model);
    for (const t of l.tasks) {
      assert.ok(!ids.has(t.id), t.id); ids.add(t.id); assert.ok(!prompts.has(t.prompt), t.id); prompts.add(t.prompt);
      assert.ok(t.diagram && t.diagram.type && t.explanation);
      assert.ok(t.steps.length >= 1 && t.steps.length <= 4);
      t.steps.forEach(s => assert.ok(s.prompt && s.hint && s.why && s.focus));
    }
  }
});

test('all 54 final answers and every intermediate value recompute independently', () => {
  for (const t of tasks) {
    const expected = chain(t.meta);
    assert.equal(t.steps.length, expected.length, t.id);
    expected.forEach((x, i) => close(t.steps[i].answer, x, `${t.id}: step ${i + 1}`));
    close(t.answer, expected.at(-1), t.id);
    if (!['expectation', 'lottery', 'variance-two', 'standard', 'binomial-variance'].includes(t.meta.kind)) assert.ok(t.answer >= 0 && t.answer <= 1, t.id);
    // The exam uses finite decimal answers. These authored values have at
    // most six decimal places, so they need neither rounding nor ellipses.
    close(t.answer * 1e6, Math.round(t.answer * 1e6), t.id + ' finite decimal');
  }
});

test('probability givens are coherent and distributions exhaust their outcomes', () => {
  for (const t of tasks) {
    const m = t.meta;
    for (const k of ['p', 'q', 'pLower', 'pUpper', 'bad', 'rejectBad', 'rejectGood', 'middle', 'survive']) {
      if (k in m) assert.ok(m[k] > 0 && m[k] < 1, `${t.id}:${k}`);
    }
    if (m.probabilities) {
      assert.equal(m.values.length, m.probabilities.length);
      const known = m.probabilities.filter(p => p !== null); known.forEach(p => assert.ok(p >= 0 && p <= 1));
      if (m.kind === 'missing') { assert.equal(m.probabilities.filter(p => p === null).length, 1); assert.ok(sum(known) < 1); }
      else close(sum(known), 1, t.id + ' total probability');
    }
    if (m.kind === 'range') assert.ok(m.lower < m.upper && m.pLower < m.pUpper);
    if (m.kind === 'uniform') assert.ok(m.a <= m.left && m.left < m.right && m.right <= m.b);
    if (m.kind === 'lottery') assert.ok(sum(m.counts) < m.total && m.prizes.length === m.counts.length);
    if (m.kind === 'afterdraw') assert.ok(m.red > 1 && m.red < m.total);
  }
});

test('browser and CommonJS register equivalent author task data', () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(root, 'ege-profil/start/probability-data.js'), 'utf8'), context);
  assert.equal(JSON.stringify(context.ProfileLessons), JSON.stringify(lessons));
});

test('all figures are task-bound, neutral in independent work, use native buttons and dispose', () => {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM('<!doctype html><div id="model"></div>', { runScripts: 'outside-only' });
  const { window } = dom, container = window.document.getElementById('model');
  window.eval(fs.readFileSync(path.join(root, 'ege-profil/start/probability-data.js'), 'utf8'));
  window.eval(fs.readFileSync(path.join(root, 'ege-profil/start/probability-tasks.js'), 'utf8'));
  for (const t of tasks) {
    container.replaceChildren(); let help = 0;
    const dispose = window.ProfileTaskModels[t.id](container, t, { mode: 'independent', step: 0, onHelp() { help++; } });
    const svg = container.querySelector('svg'), button = container.querySelector('button');
    assert.ok(svg && button && dispose, t.id); assert.equal(button.type, 'button'); assert.equal(svg.dataset.focus, 'neutral');
    assert.equal(container.querySelector('[data-task-id]').dataset.taskId, t.id);
    assert.doesNotMatch(svg.innerHTML, /NaN|Infinity|undefined/, t.id);
    assert.equal(help, 0);
    assert.equal(container.querySelectorAll('[data-pattern-cell]').length, 0, t.id + ': no automatic enumeration');
    if (t.diagram.type === 'distribution') {
      const unknown = t.diagram.probabilities.indexOf(null);
      if (unknown >= 0) assert.equal(container.querySelector(`[data-distribution-cell="1-${unknown}"]`).textContent, '?');
    }
    button.click(); assert.equal(help, 1); assert.equal(button.getAttribute('aria-pressed'), 'true');
    assert.doesNotMatch(svg.innerHTML, /NaN|Infinity|undefined/, t.id);
    if (t.diagram.type === 'bernoulli') {
      const count = outcomes(t.meta.trials).filter(row => sum(row) === t.meta.hits).length;
      assert.equal(container.querySelectorAll('[data-pattern-cell]').length, count * t.meta.trials);
    }
    button.click(); assert.equal(help, 1, 'Hiding a hint is not a new hint');
    const before = svg.outerHTML; dispose(); button.click(); assert.equal(svg.outerHTML, before, t.id + ': dispose');
    container.replaceChildren(); let postHelp = 0;
    const release = window.ProfileTaskModels[t.id](container, t, { mode: 'independent', step: 0, solved: true, onHelp() { postHelp++; } });
    container.querySelector('button').click(); assert.equal(postHelp, 0, 'Reading after a correct answer does not remove credit'); release();
    t.steps.forEach((s, step) => {
      container.replaceChildren(); const stop = window.ProfileTaskModels[t.id](container, t, { mode: 'guided', step });
      assert.doesNotMatch(container.querySelector('svg').innerHTML, /NaN|Infinity|undefined/, t.id + ':' + step);
      stop();
    });
  }
  dom.window.close();
});
