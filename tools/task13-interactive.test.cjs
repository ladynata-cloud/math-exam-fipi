'use strict';
// Independent arithmetic: this evaluator reads the displayed expressions, never
// the laboratory's coefficients, solution helpers, or stored answer flags.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { JSDOM, VirtualConsole } = require('jsdom');
const route = 'trainers/oge13-inequalities-series.html';
const html = fs.readFileSync(path.join(__dirname, '..', route), 'utf8');
const TOPIC = 'mathExamCourseProgress.v1';
const families = ['linear', 'quad', 'graph', 'special', 'systems'];

function gcd(a, b) { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a || 1n; }
function rational(n, d = 1n) { n = BigInt(n); d = BigInt(d); assert.notEqual(d, 0n); if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d); return { n: n / g, d: d / g }; }
function number(s) {
  if (typeof s === 'object') return s;
  s = String(s).replaceAll('−', '-').replace(',', '.');
  if (s.includes('/')) { const [a, b] = s.split('/').map(number); return div(a, b); }
  const [a, b = ''] = s.split('.');
  return rational(BigInt((a === '-0' ? '-' : a) + b), 10n ** BigInt(b.length));
}
const add = (a, b) => rational(a.n * b.d + b.n * a.d, a.d * b.d);
const neg = a => rational(-a.n, a.d);
const sub = (a, b) => add(a, neg(b));
const mul = (a, b) => rational(a.n * b.n, a.d * b.d);
const div = (a, b) => rational(a.n * b.d, a.d * b.n);
const sign = a => a.n === 0n ? 0 : a.n > 0n ? 1 : -1;
const numeric = a => Number(a.n) / Number(a.d);

function expression(text, x) {
  const normalized = text.replaceAll('−', '-').replaceAll('²', '^2').replaceAll('·', '*').replace(/\s/g, '');
  const tokens = normalized.match(/\d+(?:[.,]\d+)?|x|[()+*/^\-]/g) || [];
  assert.equal(tokens.join(''), normalized, 'All original expression characters are parsed: ' + text);
  let i = 0;
  function atom() {
    if (tokens[i] === '+') { i++; return atom(); }
    if (tokens[i] === '-') { i++; return neg(atom()); }
    let value;
    if (tokens[i] === '(') { i++; value = sum(); assert.equal(tokens[i++], ')'); }
    else if (tokens[i] === 'x') { i++; value = number(x); }
    else { assert.match(tokens[i] || '', /^\d/); value = number(tokens[i++]); }
    if (tokens[i] === '^') { i++; assert.equal(tokens[i++], '2'); value = mul(value, value); }
    return value;
  }
  function product() {
    let value = atom();
    while (i < tokens.length) {
      if (tokens[i] === '*') { i++; value = mul(value, atom()); }
      else if (tokens[i] === '/') { i++; value = div(value, atom()); }
      else if (/^(?:x|\(|\d)/.test(tokens[i])) value = mul(value, atom());
      else break;
    }
    return value;
  }
  function sum() {
    let value = product();
    while (tokens[i] === '+' || tokens[i] === '-') { const op = tokens[i++], next = product(); value = op === '+' ? add(value, next) : sub(value, next); }
    return value;
  }
  const value = sum(); assert.equal(i, tokens.length, 'Expression consumed: ' + text); return value;
}
function inequality(text, x) {
  const parts = text.split(/(≤|≥|<|>)/); assert.equal(parts.length, 3, text);
  const left = expression(parts[0], x), right = expression(parts[2], x), residual = sub(left, right), s = sign(residual);
  return { left, right, residual, truth: parts[1] === '<' ? s < 0 : parts[1] === '>' ? s > 0 : parts[1] === '≤' ? s <= 0 : s >= 0 };
}
function intervalContains(text, x) {
  return text.split('∪').some(part => {
    part = part.trim(); const [lo, hi] = part.slice(1, -1).split(';').map(s => s.trim());
    const a = lo.includes('∞') || (part[0] === '[' ? sign(sub(number(x), number(lo))) >= 0 : sign(sub(number(x), number(lo))) > 0);
    const b = hi.includes('∞') || (part.at(-1) === ']' ? sign(sub(number(x), number(hi))) <= 0 : sign(sub(number(x), number(hi))) < 0);
    return a && b;
  });
}
function boot(t) {
  const errors = [], vc = new VirtualConsole(); vc.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(html, { url: 'https://mathexam.space/' + route, runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc });
  t.after(() => { dom.window.close(); assert.deepEqual(errors, [], 'No runtime errors'); });
  return { window: dom.window, doc: dom.window.document, get: id => { const el = dom.window.document.getElementById(id); assert.ok(el, '#' + id); return el; }, eval: s => dom.window.eval(s) };
}
const bankOf = ui => JSON.parse(ui.eval('JSON.stringify(DATA)'));
function pick(ui, family, index) { const el = ui.get('taskPicker'); el.value = family + ':' + index; el.dispatchEvent(new ui.window.Event('change', { bubbles: true })); }
function help(ui) { if (ui.get('hintPanel').hidden) ui.get('hintToggle').click(); const lab = ui.get('task13LabHost').querySelector('[data-task13-lab]'); assert.ok(lab, 'Inline laboratory exists'); return lab; }
function visible(node) { for (let p = node; p; p = p.parentElement) { if (p.hidden) return false; if (p.matches('details:not([open])') && !p.querySelector(':scope > summary')?.contains(node)) return false; } return true; }
function get(lab, selector) { const node = lab.querySelector(selector); assert.ok(node, selector); return node; }
function input(ui, el, value) { el.value = String(value); el.dispatchEvent(new ui.window.Event('input', { bubbles: true })); }
function selected(ui) { return ui.eval('JSON.stringify({selectedChoice,selectedZones,checked,solution})'); }
function stats(ui) { return ui.window.localStorage.getItem(TOPIC); }
function snapshotMain(ui) { return { selected: selected(ui), stats: stats(ui) }; }
function assertMain(ui, before, message) { assert.deepEqual(snapshotMain(ui), before, message); }
function assertProbe(lab, original, x = lab.dataset.probeX) {
  const expected = inequality(original, x);
  assert.equal(lab.dataset.probeTruth, String(expected.truth), original + ', x=' + String(x));
  if (lab.dataset.probeValue !== undefined) assert.ok(Math.abs(Number(lab.dataset.probeValue) - numeric(expected.residual)) < 1e-7, 'Correct original residual for ' + original);
  if (lab.dataset.pointPosition !== undefined) assert.equal(lab.dataset.pointPosition, sign(expected.residual) < 0 ? 'below' : sign(expected.residual) > 0 ? 'above' : 'on');
}

test('the complete bank remains identical: 26 existing prototypes in five families', t => {
  const ui = boot(t), bank = bankOf(ui), source = html.slice(html.indexOf('const DATA='), html.indexOf('let mod='));
  assert.equal(crypto.createHash('sha256').update(source).digest('hex'), '4378385faf4e6be08ae040da90ad9ae54e0e70aca970b2d354592108283e6527');
  assert.deepEqual(Object.fromEntries(families.map(f => [f, bank[f].length])), { linear: 6, quad: 8, graph: 4, special: 4, systems: 4 });
  assert.equal(ui.get('taskPicker').options.length, 26);
});

test('independent exact arithmetic verifies each stored answer and every graph candidate', t => {
  const ui = boot(t), bank = bankOf(ui);
  const probes = ['-20', '-10', '-8', '-7', '-6', '-3.6', '-3', '-2', '-1.5', '-1', '-6/7', '-0.6', '0', '0.4', '0.5', '6/7', '1', '2.5', '3', '4', '6', '6.6', '7', '8', '10', '20'];
  for (const item of bank.linear) for (const x of probes) assert.equal(intervalContains(item.ans, x), inequality(item.e, x).truth, item.e + ' at ' + x);
  for (const item of bank.systems) for (const x of probes) assert.equal(intervalContains(item.ans, x), item.e.every(e => inequality(e, x).truth), item.e.join(' AND ') + ' at ' + x);
  for (const item of bank.graph) {
    const [lo, hi] = item.roots;
    const given = x => { const v = numeric(number(x)); return v === lo || v === hi ? item.closed : item.zones[v < lo ? 0 : v > hi ? 2 : 1]; };
    const matches = item.options.filter(candidate => probes.every(x => inequality(candidate, x).truth === given(x)));
    assert.deepEqual(matches, [item.ans], 'Exactly one candidate matches all boundaries and interval signs');
  }
  for (const item of bank.special) {
    const all = /люб/.test(item.q);
    const matches = item.options.filter(candidate => probes.every(x => inequality(candidate, x).truth === all));
    assert.deepEqual(matches, [item.ans]);
  }
  const expectedZones = [[false, true, false], [true, false, true], [true, false, true], [false, true, false], [true, false, true], [false, true, false], [true, false, true], [false, true, false]];
  bank.quad.forEach((item, index) => {
    const lo = number(item.l1), hi = number(item.l2), x = [sub(lo, number(1)), div(add(lo, hi), number(2)), add(hi, number(1))];
    assert.deepEqual(x.map(probe => inequality(item.e, probe).truth), expectedZones[index], item.e);
    for (const endpoint of [lo, hi]) assert.equal(inequality(item.e, endpoint).truth, /[≥≤]/.test(item.e), 'Exact endpoint inclusion for ' + item.e);
  });
  assert.equal(sign(inequality(bank.quad[4].e, '-6/7').residual), 0);
  assert.equal(sign(inequality(bank.quad[4].e, '6/7').residual), 0);
});

test('every prototype opens its own optional laboratory without selecting or grading an answer', t => {
  const ui = boot(t), bank = bankOf(ui);
  assert.equal(ui.get('hintPanel').hidden, true);
  for (const family of families) for (let index = 0; index < bank[family].length; index++) {
    pick(ui, family, index); const before = snapshotMain(ui), lab = help(ui);
    assert.equal(lab.dataset.labKind, family); assert.equal(visible(lab), true); assertMain(ui, before, family + ':' + index);
    assert.ok(lab.querySelector('button,input,select'), 'Actionable model for ' + family + ':' + index);
    assert.ok(lab.querySelector('[data-lab-status]'), 'Readable response to manipulation');
    ui.get('hintReturn').click(); assert.equal(ui.get('hintPanel').hidden, true); assertMain(ui, before, 'Returning from help leaves the attempt intact');
  }
});

test('quadratic laboratories connect every interval, exact root and open/closed endpoint to the original inequality', t => {
  const ui = boot(t), bank = bankOf(ui);
  for (let index = 0; index < bank.quad.length; index++) {
    const item = bank.quad[index]; pick(ui, 'quad', index); const before = snapshotMain(ui), lab = help(ui);
    for (const region of lab.querySelectorAll('[data-lab-action="region"]')) {
      region.click(); assertProbe(lab, item.e);
      const positive = sign(inequality(item.e, lab.dataset.probeX).residual) > 0;
      const slot = get(lab, `[data-sign-slot="${region.dataset.region}"]`);
      get(lab, `[data-lab-action="sign"][data-sign="${positive ? 'minus' : 'plus'}"]`).click(); assert.equal(slot.textContent, '?', 'An incorrect sign does not fill the interval');
      get(lab, `[data-lab-action="sign"][data-sign="${positive ? 'plus' : 'minus'}"]`).click(); assert.equal(slot.textContent, positive ? '+' : '−');
    }
    assert.equal(lab.querySelectorAll('[data-lab-action="region"]').length, 3);
    for (let root = 0; root < 2; root++) {
      get(lab, `[data-lab-action="root"][data-root-index="${root}"]`).click();
      assertProbe(lab, item.e, root ? item.l2 : item.l1);
      assert.equal(lab.dataset.pointPosition, 'on');
      const included = /[≥≤]/.test(item.e); assert.equal(lab.dataset.probeTruth, String(included));
      const endpointSelector = `[data-boundary-value="${root ? item.r2 : item.r1}"]`;
      get(lab, `[data-lab-action="boundary"][data-included="${!included}"]`).click();
      assert.equal(get(lab, endpointSelector).dataset.boundaryIncluded, 'unexplored', 'An incorrect answer cannot mark the endpoint');
      get(lab, `[data-lab-action="boundary"][data-included="${included}"]`).click();
      assert.equal(get(lab, endpointSelector).dataset.boundaryIncluded, String(included));
    }
    assertMain(ui, before, 'Probing roots never fills answer chips');
  }
  pick(ui, 'quad', 4); const lab = help(ui), svg = get(lab, '[data-lab-plot]');
  assert.doesNotMatch(lab.textContent, /6\/7/, 'Fractional endpoints use a horizontal fraction bar');
  assert.ok(lab.querySelector('.fraction, .t13-fraction, .t13c-frac, [data-fraction]') || lab.querySelectorAll('tspan').length >= 6);
  const yMin = Number(svg.dataset.yMin), yMax = Number(svg.dataset.yMax);
  assert.ok(yMin < -36 && yMax > 0 && 36 / (yMax - yMin) > .08, 'The fractional-root parabola has a visibly non-flat minimum');
});

test('all four candidates in each graph laboratory use their own original polynomial and preserve the question picture', t => {
  const ui = boot(t), bank = bankOf(ui);
  for (let index = 0; index < bank.graph.length; index++) {
    const item = bank.graph[index]; pick(ui, 'graph', index); const originalPicture = ui.get('board').outerHTML, before = snapshotMain(ui), lab = help(ui);
    for (let candidate = 0; candidate < 4; candidate++) {
      get(lab, `[data-lab-action="candidate"][data-candidate="${candidate}"]`).click();
      assert.equal(lab.dataset.activeCandidate, String(candidate));
      const probe = get(lab, '[data-lab-action="probe"]');
      for (const step of [0, 39, 100, 163, 200]) {
        input(ui, probe, step); assertProbe(lab, item.options[candidate]);
        const x = Number(lab.dataset.probeX), [lo, hi] = item.roots;
        const given = x === lo || x === hi ? item.closed : item.zones[x < lo ? 0 : x > hi ? 2 : 1];
        assert.equal(lab.dataset.givenMembership, String(given));
      }
      const roots = Array.from(lab.querySelectorAll('[data-lab-action="root"]')).map(button => button.dataset.rootIndex);
      for (const root of roots) {
        get(lab, `[data-lab-action="root"][data-root-index="${root}"]`).click(); assertProbe(lab, item.options[candidate]);
        const x = Number(lab.dataset.probeX), [lo, hi] = item.roots;
        const given = x === lo || x === hi ? item.closed : item.zones[x < lo ? 0 : x > hi ? 2 : 1];
        assert.equal(lab.dataset.givenMembership, String(given), 'Boundary comparison remains strict or inclusive according to the given picture');
      }
    }
    assert.equal(ui.get('board').outerHTML, originalPicture, 'Given graph is immutable'); assertMain(ui, before, 'Candidate investigation is separate from answer selection');
  }
});

test('special-case laboratories distinguish sampled evidence from a reason valid for every number', t => {
  const ui = boot(t), bank = bankOf(ui);
  for (let index = 0; index < bank.special.length; index++) {
    pick(ui, 'special', index); const lab = help(ui), before = snapshotMain(ui);
    for (let candidate = 0; candidate < 4; candidate++) {
      get(lab, `[data-lab-action="candidate"][data-candidate="${candidate}"]`).click();
      for (const step of [0, 73, 100, 147, 200]) { input(ui, get(lab, '[data-lab-action="probe"]'), step); assertProbe(lab, bank.special[index].options[candidate]); }
      get(lab, '[data-lab-action="minimum"]').click();
      const reason = get(lab, '[data-minimum-reason]'), original = bank.special[index].options[candidate], minimum = inequality(original, 0);
      assert.equal(Number(reason.dataset.minimum), numeric(minimum.residual)); assert.equal(reason.dataset.atZero, String(minimum.truth));
      assert.match(reason.textContent, /при любом x.*Равенство достигается при x = 0/s, 'The minimum is justified, not inferred from samples');
      const atDistantPoint = inequality(original, 100).truth;
      if (minimum.truth && atDistantPoint) assert.match(reason.textContent, /верно при любом x/);
      else if (!minimum.truth && !atDistantPoint) assert.match(reason.textContent, /решений нет/);
      else assert.match(reason.textContent, /одни значения x подходят, а другие — нет/);
    }
    assert.match(get(lab, '[data-lab-status]').textContent, /проверка одного числа/iu, 'A finite trial is explicitly only one sample');
    assert.match(get(lab, '[data-lab-status]').textContent, /для вывода обо всех числах/iu, 'A universal conclusion requires further reasoning');
    const minimum = get(lab, 'details[data-lab-help="minimum"]'); minimum.open = true;
    assert.match(minimum.textContent, /квадрат|x²/i); assertMain(ui, before, 'Reasoning help does not answer or grade');
  }
});

function displayedLinearSides(lab, x) {
  const totals = { left: number(0), right: number(0) };
  for (const card of lab.querySelectorAll('[data-term-id]')) totals[card.dataset.side] = add(totals[card.dataset.side], expression(card.textContent, x));
  return totals;
}
function assertEquivalentCards(lab, original) {
  for (const x of [-7, -1, 0, 2, 8]) {
    const sides = displayedLinearSides(lab, x), expected = inequality(original, x);
    assert.equal(sign(sub(sub(sides.left, sides.right), expected.residual)), 0, 'Displayed cards preserve original residual at x=' + x);
  }
}

test('all six linear laboratories preserve algebra when signed cards cross the inequality or brackets expand', t => {
  const ui = boot(t), bank = bankOf(ui);
  for (let index = 0; index < bank.linear.length; index++) {
    const item = bank.linear[index]; pick(ui, 'linear', index); const lab = help(ui), before = snapshotMain(ui);
    const sourceSign = item.e.match(/[≤≥<>]/)[0];
    assertEquivalentCards(lab, item.e);
    const ids = Array.from(lab.querySelectorAll('[data-term-id]')).map(card => card.dataset.termId);
    for (const id of ids) {
      let card = get(lab, `[data-term-id="${id}"]`); const originalSide = card.dataset.side;
      const coefficientName = card.dataset.kind === 'bracket' ? 'k' : 'c', coefficient = Number(card.dataset[coefficientName]);
      card.click(); card = get(lab, `[data-term-id="${id}"]`);
      assert.notEqual(card.dataset.side, originalSide); assert.equal(Number(card.dataset[coefficientName]), -coefficient);
      assert.equal(get(lab, '[data-linear-comparator]').textContent, sourceSign, 'Moving a term never reverses the inequality');
      assertEquivalentCards(lab, item.e);
      card.dispatchEvent(new ui.window.KeyboardEvent('keydown', { key: originalSide === 'left' ? 'ArrowLeft' : 'ArrowRight', bubbles: true }));
      assert.equal(get(lab, `[data-term-id="${id}"]`).dataset.side, originalSide); assertEquivalentCards(lab, item.e);
    }
    if (index === 3) {
      const expand = get(lab, '[data-lab-action="expand-bracket"]'); assert.equal(expand.disabled, true);
      get(lab, '[data-lab-action="expand-part"][data-part="0"]').click(); assert.equal(expand.disabled, true, 'Both products must be explored');
      get(lab, '[data-lab-action="expand-part"][data-part="1"]').click(); assert.equal(expand.disabled, false); expand.click();
      assert.equal(lab.querySelectorAll('[data-kind="bracket"]').length, 0);
      assert.equal(get(lab, '[data-term-id="l1p0"]').dataset.c, '-12'); assert.equal(get(lab, '[data-term-id="l1p1"]').dataset.c, '-3');
      assertEquivalentCards(lab, item.e);
    }
    for (const id of Array.from(lab.querySelectorAll('[data-term-id]')).map(card => card.dataset.termId)) {
      const card = get(lab, `[data-term-id="${id}"]`), destination = card.dataset.power === '1' ? 'left' : 'right';
      if (card.dataset.side !== destination) card.click();
    }
    assertEquivalentCards(lab, item.e);
    get(lab, '[data-lab-action="combine"]').click();
    const residual0 = inequality(item.e, 0).residual, a = sub(inequality(item.e, 1).residual, residual0);
    const divisor = get(lab, '[data-lab-input="divisor"]');
    for (const invalid of ['0', 'abc', String(numeric(a) + 1)]) {
      input(ui, divisor, invalid); get(lab, '[data-lab-action="check-divisor"]').click(); assert.equal(lab.dataset.divisorValid, 'false');
    }
    input(ui, divisor, numeric(a)); get(lab, '[data-lab-action="check-divisor"]').click(); assert.equal(lab.dataset.divisorValid, 'true');
    const reverse = { '<': '>', '>': '<', '≤': '≥', '≥': '≤' }, expectedSign = sign(a) < 0 ? reverse[sourceSign] : sourceSign;
    for (const candidate of ['<', '≤', '>', '≥']) {
      get(lab, `[data-lab-action="choose-sign"][data-sign="${candidate}"]`).click();
      assert.equal(lab.dataset.signCorrect, String(candidate === expectedSign), 'Dividing preserves strictness and reverses direction only for a negative divisor');
    }
    for (const offset of [-1, 0, 1]) { get(lab, `[data-lab-action="probe-sample"][data-offset="${offset}"]`).click(); assertProbe(lab, item.e); }
    assertMain(ui, before, 'Working through the entire laboratory does not select or grade the main answer');
  }
});

test('all four system laboratories require both original conditions, including every boundary', t => {
  const ui = boot(t), bank = bankOf(ui);
  for (let index = 0; index < bank.systems.length; index++) {
    const item = bank.systems[index]; pick(ui, 'systems', index); const lab = help(ui), before = snapshotMain(ui), probe = get(lab, '[data-lab-input="probe"]');
    let sawOneOnly = false, sawBoth = false;
    const bounds = item.rays.map(ray => ray.v), probes = [Number(probe.min), Number(probe.max), (bounds[0] + bounds[1]) / 2, ...bounds.flatMap(x => [x - .1, x, x + .1])];
    for (const value of probes) {
      input(ui, probe, Math.round(value * 1000) / 1000); const x = lab.dataset.probeX, truth = item.e.map(e => inequality(e, x).truth);
      assert.equal(lab.dataset.firstTruth, String(truth[0])); assert.equal(lab.dataset.secondTruth, String(truth[1]));
      assert.equal(lab.dataset.bothTruth, String(truth.every(Boolean))); assert.equal(lab.dataset.probeTruth, String(truth.every(Boolean)));
      sawOneOnly ||= truth[0] !== truth[1]; sawBoth ||= truth.every(Boolean);
    }
    assert.equal(sawOneOnly, true, 'A one-condition-only point distinguishes intersection from union'); assert.equal(sawBoth, true);
    for (let boundary = 0; boundary < 2; boundary++) {
      get(lab, `[data-lab-action="probe-boundary"][data-boundary-index="${boundary}"]`).click();
      assert.equal(Number(lab.dataset.probeX), bounds[boundary]);
      assert.equal(lab.dataset.bothTruth, String(item.e.every(e => inequality(e, String(bounds[boundary])).truth)));
    }
    for (const operation of ['or', 'and']) {
      get(lab, `[data-lab-action="set-operation"][data-operation="${operation}"]`).click();
      assert.equal(lab.dataset.operation, operation);
      const breaks = [Number(probe.min), ...new Set(bounds), Number(probe.max)].sort((a, b) => a - b), expectedSegments = [];
      for (let segment = 0; segment < breaks.length - 1; segment++) {
        const x = String((breaks[segment] + breaks[segment + 1]) / 2), values = item.e.map(e => inequality(e, x).truth);
        if (operation === 'and' ? values.every(Boolean) : values.some(Boolean)) expectedSegments.push(String(segment));
      }
      assert.deepEqual(Array.from(lab.querySelectorAll('[data-overlap-segment]')).map(node => node.dataset.overlapSegment), expectedSegments);
      for (const endpoint of lab.querySelectorAll('[data-overlap-endpoint]')) {
        const values = item.e.map(e => inequality(e, endpoint.dataset.overlapEndpoint).truth);
        assert.equal(endpoint.dataset.included, String(operation === 'and' ? values.every(Boolean) : values.some(Boolean)));
      }
      assert.equal(lab.dataset.probeTruth, String(item.e.every(e => inequality(e, lab.dataset.probeX).truth)), 'Union experiment cannot redefine the task as OR');
    }
    assertMain(ui, before, 'System exploration never marks the final answer');
  }
});

test('nested help, choices, previous/next and topic switching preserve each local investigation', t => {
  const ui = boot(t);
  for (const family of families) {
    pick(ui, family, 0); const lab = help(ui);
    const probe = lab.querySelector('[data-lab-action="probe"], [data-lab-input="probe"]');
    assert.ok(probe, family + ' has an x control');
    input(ui, probe, Number(probe.min) + (Number(probe.max) - Number(probe.min)) * .7);
    const probeX = lab.dataset.probeX;
    const details = Array.from(lab.querySelectorAll('details')).find(node => !node.hidden); assert.ok(details, family + ' has help within help'); details.open = true;
    if (family === 'quad') ui.get('chips').children[0].click(); else ui.get('choices').children[0].click();
    const choice = selected(ui), result = stats(ui);
    assert.equal(help(ui), lab, 'Selecting an answer preserves the actual model node');
    assert.equal(lab.dataset.probeX, probeX); assert.equal(details.open, true);
    ui.get('hintReturn').click(); assert.equal(ui.get('hintPanel').hidden, true);
    assert.equal(help(ui), lab); assert.equal(lab.dataset.probeX, probeX); assert.equal(details.open, true);
    ui.get('next').click(); assert.equal(ui.get('hintPanel').hidden, true);
    ui.get('previous').click(); assert.equal(help(ui), lab); assert.equal(selected(ui), choice);
    assert.equal(lab.dataset.probeX, probeX); assert.equal(details.open, true);
    const alternate = family === 'quad' ? 'linear' : 'quad'; pick(ui, alternate, 1); pick(ui, family, 0);
    assert.equal(help(ui), lab); assert.equal(selected(ui), choice); assert.equal(lab.dataset.probeX, probeX); assert.equal(details.open, true);
    assert.equal(stats(ui), result, 'Navigation and assistance never change credit');
  }
});

test('local investigations cannot duplicate credit, bypass a reveal lock, or roll a solved attempt back', t => {
  const ui = boot(t), bank = bankOf(ui);
  pick(ui, 'linear', 0); help(ui);
  const correctIndex = bank.linear[0].options.indexOf(bank.linear[0].ans);
  ui.get('choices').children[correctIndex].click(); ui.get('check').click();
  assert.equal(ui.eval('loadStats().correct'), 1); const accepted = snapshotMain(ui);
  const lab = help(ui); input(ui, get(lab, '[data-lab-input="probe"]'), 5);
  ui.get('hintReturn').click(); help(ui); ui.eval('checkAnswer()'); assertMain(ui, accepted, 'Exploration cannot award twice or change accepted answers');
  ui.get('next').click(); help(ui); ui.get('solutionDetails').open = true; ui.eval('showSolution()');
  const revealed = snapshotMain(ui), revealedLab = help(ui);
  input(ui, get(revealedLab, '[data-lab-input="probe"]'), -5);
  ui.get('hintReturn').click(); help(ui); ui.eval('checkAnswer()'); assertMain(ui, revealed, 'A revealed result remains locked');
  ui.get('previous').click(); assertMain(ui, accepted, 'Returning to the solved attempt preserves its state');
  ui.get('next').click(); assertMain(ui, revealed, 'Returning to a reveal preserves its state');
  assert.equal(ui.get('check').disabled, true);
});

test('an explicit new round resets local models and selections while preserving the accumulated progress record', t => {
  const ui = boot(t); pick(ui, 'quad', 4); const oldLab = help(ui);
  get(oldLab, '[data-lab-action="root"][data-root-index="1"]').click();
  const nested = oldLab.querySelector('details'); nested.open = true;
  ui.get('chips').children[0].click(); ui.get('check').click();
  const saved = stats(ui); ui.get('newRound').click();
  assert.equal(ui.get('hintPanel').hidden, true); assert.equal(ui.eval('labCache.size'), 0);
  assert.equal(ui.eval('Object.keys(sessionStates).length'), 0); assert.equal(ui.eval('Object.values(idx).every(x=>x===0)'), true);
  assert.equal(ui.eval('selectedChoice===null&&!selectedZones.some(Boolean)&&!checked&&!solution'), true);
  assert.equal(stats(ui), saved);
  pick(ui, 'quad', 4); const newLab = help(ui); assert.notEqual(newLab, oldLab); assert.equal(newLab.querySelector('details').open, false);
  assert.equal(stats(ui), saved);
});
