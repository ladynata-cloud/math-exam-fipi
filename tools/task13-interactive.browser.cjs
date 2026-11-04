'use strict';

// Run by .github/workflows/task13-interactive.yml. All learner actions below
// use the visible interface; page.evaluate is reserved for observations.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const artifacts = path.resolve(root, process.env.TASK13_BROWSER_ARTIFACTS || 'artifacts/task13-interactive');
const KEY = 'mathExamCourseProgress.v1';
const FAMILY = { linear: 6, quad: 8, graph: 4, special: 4, systems: 4 };
const LABEL = { linear: 'Линейные', quad: 'Квадратные', graph: 'По рисунку', special: 'Нет/любое', systems: 'Системы' };
const CASES = Object.entries(FAMILY).flatMap(([kind, count]) => Array.from({ length: count }, (_, index) => ({ kind, index, key: `${kind}:${index}` })));
const QUADRATICS = [
  { roots: [-7, 7], a: 1, sign: '<' }, { roots: [-8, 8], a: 1, sign: '≥' },
  { roots: [-3, 8], a: 1, sign: '≥' }, { roots: [-2, 7], a: 1, sign: '≤' },
  { roots: [-6 / 7, 6 / 7], a: 49, sign: '≥' }, { roots: [-3, 3], a: 1, sign: '<' },
  { roots: [0, 7], a: -1, sign: '<' }, { roots: [0, 6], a: -1, sign: '>' }
];
const LINEAR = [
  { a: -10, b: 4, sign: '≥' }, { a: -5, b: -10, sign: '≥' },
  { a: 4, b: -2, sign: '<' }, { a: -6, b: -9, sign: '>' },
  { a: -4, b: 10, sign: '≤' }, { a: 1, b: 8, sign: '≤' }
];
const SYSTEMS = [
  [{ value: -3.6, sign: '≤' }, { value: -3, sign: '≤' }],
  [{ value: -0.6, sign: '≤' }, { value: -3, sign: '≥' }],
  [{ value: 6.6, sign: '≥' }, { value: 4, sign: '≥' }],
  [{ value: -1, sign: '>' }, { value: 3, sign: '<' }]
];
const GRAPH = [
  { roots: [-7, 7], zones: [false, true, false], closed: false },
  { roots: [-6, 6], zones: [true, false, true], closed: false },
  { roots: [-8, 8], zones: [false, true, false], closed: true },
  { roots: [0, 7], zones: [true, false, true], closed: false }
];
const compare = (value, sign) => sign === '<' ? value < -1e-9 : sign === '>' ? value > 1e-9 : sign === '≤' ? value <= 1e-9 : value >= -1e-9;
const close = (actual, expected, label) => assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < 1e-8, `${label}: ${actual} ≠ ${expected}`);
const coverage = [];
const errors = [];
const external = [];
fs.mkdirSync(artifacts, { recursive: true });

const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (pathname === '/favicon.ico') { response.writeHead(204); response.end(); return; }
  const file = path.resolve(root, '.' + decodeURIComponent(pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404); response.end(); return;
  }
  const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' }[path.extname(file)] || 'application/octet-stream';
  response.writeHead(200, { 'Content-Type': type + '; charset=utf-8' });
  fs.createReadStream(file).pipe(response);
});

async function progress(page) { return page.evaluate(key => localStorage.getItem(key), KEY); }
async function selectedAnswer(page) { return page.locator('#modulePanel [aria-pressed="true"]').allTextContents(); }
async function snapshot(lab) {
  return lab.evaluate(element => ({ attributes: [...element.attributes].map(a => [a.name, a.value]), html: element.innerHTML }));
}
async function settings(page, open) {
  if (await page.locator('#settings').evaluate(element => element.open) !== open) await page.locator('#settings > summary').click();
}
async function chooseTask(page, key) {
  await settings(page, true);
  await page.locator('#taskPicker').selectOption(key);
  assert.equal(await page.locator('#taskPicker').inputValue(), key, 'Task picker reaches the requested prototype');
  await settings(page, false);
}
async function nestedHelp(lab) {
  const details = lab.locator('details');
  for (let i = 0; i < await details.count(); i++) {
    const detail = details.nth(i);
    if (!await detail.isVisible()) continue;
    if (!await detail.evaluate(element => element.open)) await detail.locator(':scope > summary').click();
    assert.ok((await detail.innerText()).trim().length > (await detail.locator(':scope > summary').innerText()).trim().length, 'Nested help contains useful guidance');
  }
}
async function modelFits(page, label) {
  const issues = await page.evaluate(() => {
    const found = [];
    const visible = element => { const box = element.getBoundingClientRect(); return box.width > 0 && box.height > 0 && getComputedStyle(element).visibility !== 'hidden'; };
    const short = element => element.id || element.getAttribute('data-lab-action') || element.getAttribute('data-lab-kind') || element.tagName;
    if (document.documentElement.scrollWidth > innerWidth + 1 || document.body.scrollWidth > innerWidth + 1) found.push('page horizontally overflows');
    for (const element of document.querySelectorAll('.main, #taskText, #hintPanel, #givenBoard, #hintBoard, #task13LabHost, #task13LabHost *')) {
      if (!(element instanceof HTMLElement) || !visible(element)) continue;
      const box = element.getBoundingClientRect(), style = getComputedStyle(element);
      if (box.left < -1 || box.right > innerWidth + 1) found.push(`${short(element)} lies outside viewport`);
      if (!['inline', 'contents'].includes(style.display) && !['INPUT', 'SELECT'].includes(element.tagName) && element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 2) found.push(`${short(element)} has hidden internal horizontal overflow: ${element.scrollWidth}/${element.clientWidth}`);
      if (element.matches('button, input, select, summary') && (box.height < 43 || box.width < 43)) found.push(`${short(element)} target is ${box.width.toFixed(1)}×${box.height.toFixed(1)}px`);
    }
    for (const svg of document.querySelectorAll('svg')) {
      if (!visible(svg)) continue;
      const view = svg.viewBox.baseVal;
      if (!(view.width > 0 && view.height > 0)) found.push('Visible SVG has no finite viewBox');
      for (const element of svg.querySelectorAll('*')) {
        for (const attribute of element.attributes) if (/^(d|points|x|y|x1|x2|y1|y2|cx|cy|r|width|height|transform)$/.test(attribute.name) && /NaN|Infinity|undefined/.test(attribute.value)) found.push(`Nonfinite SVG geometry: ${attribute.name}`);
      }
      for (const text of svg.querySelectorAll('text')) {
        if (!text.textContent.trim() || !visible(text)) continue;
        const box = text.getBBox(), matrix = text.getScreenCTM();
        const font = parseFloat(getComputedStyle(text).fontSize) * Math.hypot(matrix.a, matrix.b);
        if (font < 15.5) found.push(`SVG text too small (${font.toFixed(1)}px): ${text.textContent.trim()}`);
        if (box.x < view.x - 1 || box.y < view.y - 1 || box.x + box.width > view.x + view.width + 1 || box.y + box.height > view.y + view.height + 1) found.push(`SVG text clipped: ${text.textContent.trim()}`);
      }
    }
    return found;
  });
  assert.deepEqual(issues, [], `${label}: readable models and no inner-board scrolling`);
}

async function keyboardProbe(lab, selector, validate) {
  const input = lab.locator(selector);
  assert.equal(await input.count(), 1, 'A labelled trial control is available');
  assert.ok((await input.getAttribute('aria-label')) || await input.evaluate(e => e.labels?.length > 0), 'Trial control explains what to change');
  await input.focus(); await input.press('Home');
  const first = await snapshot(lab);
  const firstPoint = await lab.locator('[data-probe-point]').evaluateAll(nodes => nodes.map(n => [n.getAttribute('cx'), n.getAttribute('cy')]));
  await validate();
  await input.press('End');
  assert.notDeepEqual(await snapshot(lab), first, 'Keyboard trial changes the visible model');
  assert.notDeepEqual(await lab.locator('[data-probe-point]').evaluateAll(nodes => nodes.map(n => [n.getAttribute('cx'), n.getAttribute('cy')])), firstPoint, 'The trial marker itself moves');
  await validate();
  await input.press('ArrowLeft');
  await validate();
}

async function verifyQuadraticProbe(lab, index) {
  const task = QUADRATICS[index], x = Number(await lab.getAttribute('data-probe-x'));
  const expected = task.a * (x - task.roots[0]) * (x - task.roots[1]);
  close(Number(await lab.getAttribute('data-probe-value')), expected, 'Quadratic probe value');
  assert.equal(await lab.getAttribute('data-probe-truth'), String(compare(expected, task.sign)), 'Quadratic comparison matches independent arithmetic');
}

async function openDetail(lab, selector) {
  const detail = lab.locator(selector);
  assert.equal(await detail.count(), 1, `Help exists: ${selector}`);
  if (!await detail.evaluate(e => e.open)) await detail.locator(':scope > summary').click();
}

async function pointerProbe(page, lab, selector) {
  const plot = lab.locator(selector);
  await plot.scrollIntoViewIfNeeded();
  const box = await plot.boundingBox();
  assert.ok(box && box.width > 100 && box.height > 20, 'Interactive plot is usable');
  const before = await lab.getAttribute('data-probe-x');
  const pointFraction = await plot.evaluate(svg => Number(svg.querySelector('[data-probe-point]').getAttribute('cx')) / svg.viewBox.baseVal.width);
  assert.ok(Number.isFinite(pointFraction), 'The current trial marker has a finite position');
  // Pick the opposite part of the actual plot. A fixed 31% tap rounded back
  // to the already selected x = −3 in systems:1, so it did not test movement.
  const targetFraction = pointFraction < .5 ? .8 : .2;
  if (page.viewportSize().width < 600) {
    await plot.tap({ position: { x: box.width * targetFraction, y: box.height * .4 } });
  } else {
    await page.mouse.move(box.x + box.width * pointFraction, box.y + box.height * .4);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * targetFraction, box.y + box.height * .4, { steps: 8 });
    await page.mouse.up();
  }
  assert.notEqual(await lab.getAttribute('data-probe-x'), before, 'Pointer or touch interaction changes x');
}

function candidatePolynomial(text) {
  const normalized = text.replace(/^\s*\d+\)\s*/, '').replace(/\s/g, '').replace(/−/g, '-');
  const match = /^x²([+-]\d+x)?([+-]\d+)?([<>≤≥])0$/.exec(normalized);
  assert.ok(match, `Known quadratic option syntax: ${text}`);
  return { b: match[1] ? Number(match[1].slice(0, -1)) : 0, c: match[2] ? Number(match[2]) : 0, sign: match[3] };
}

async function verifyCandidate(lab, kind, index, polynomial) {
  const x = Number(await lab.getAttribute('data-probe-x'));
  const y = x * x + polynomial.b * x + polynomial.c;
  close(Number(await lab.getAttribute('data-probe-value')), y, 'Candidate polynomial value');
  assert.equal(await lab.getAttribute('data-probe-truth'), String(compare(y, polynomial.sign)), 'Candidate comparison is mathematically correct');
  if (kind === 'graph') {
    const task = GRAPH[index];
    const membership = task.roots.includes(x) ? task.closed : task.zones[x < task.roots[0] ? 0 : x < task.roots[1] ? 1 : 2];
    assert.equal(await lab.getAttribute('data-given-membership'), String(membership), 'Membership refers to the original marked set');
  }
}

async function exerciseCurve(page, lab, kind, index) {
  await nestedHelp(lab);
  if (kind === 'quad') {
    const task = QUADRATICS[index];
    await keyboardProbe(lab, '[data-lab-action="probe"]', () => verifyQuadraticProbe(lab, index));
    for (let region = 0; region < 3; region++) {
      await lab.locator(`[data-lab-action="region"][data-region="${region}"]`).click();
      await verifyQuadraticProbe(lab, index);
      const value = Number(await lab.getAttribute('data-probe-value'));
      const sign = value > 0 ? 'plus' : 'minus';
      await lab.locator(`[data-lab-action="sign"][data-sign="${sign === 'plus' ? 'minus' : 'plus'}"]`).click();
      assert.equal(await lab.locator(`[data-sign-slot="${region}"]`).textContent(), '?', 'A wrong sign is not placed in the interval table');
      await lab.locator(`[data-lab-action="sign"][data-sign="${sign}"]`).click();
      assert.equal(await lab.locator(`[data-sign-slot="${region}"]`).textContent(), sign === 'plus' ? '+' : '−');
    }
    for (let i = 0; i < 2; i++) {
      await lab.locator(`[data-lab-action="root"][data-root-index="${i}"]`).click();
      close(Number(await lab.getAttribute('data-probe-x')), task.roots[i], 'Root button preserves exact value');
      await verifyQuadraticProbe(lab, index);
      assert.equal(await lab.getAttribute('data-point-position'), 'on');
      assert.equal(await lab.getAttribute('data-probe-value'), '0');
      const expected = task.sign === '≤' || task.sign === '≥';
      await lab.locator(`[data-lab-action="boundary"][data-included="${!expected}"]`).click();
      await lab.locator(`[data-lab-action="boundary"][data-included="${expected}"]`).click();
      assert.equal(await lab.locator('[data-lab-help="boundary"] [data-boundary-included]').getAttribute('data-boundary-included'), String(expected), 'Strictness determines inclusion of the exact root');
      assert.equal(await lab.locator(`[data-lab-plot] [data-boundary-value="${task.roots[i]}"]`).getAttribute('data-boundary-included'), String(expected), 'The boundary drawing follows the discovered inclusion rule');
    }
    if (index === 4) {
      assert.equal(await lab.locator('[data-lab-action="root"] .fraction').count(), 2, 'Both ±6/7 controls use fraction bars');
      assert.doesNotMatch(await lab.innerText(), /6\s*\/\s*7/, 'Visible fractional roots do not use slash notation');
      assert.equal(await lab.locator('[data-lab-plot] g[aria-label]').count(), 2, 'Exact fractional axis labels are rendered separately');
    }
    await lab.locator('[data-lab-action="region"][data-region="1"]').click();
    const geometry = await lab.locator('[data-lab-plot]').evaluate(svg => ({
      depth: Math.abs(Number(svg.dataset.probeScreenY) - Number(svg.dataset.axisY)),
      scale: svg.getBoundingClientRect().width / svg.viewBox.baseVal.width
    }));
    assert.ok(geometry.depth >= 30 && geometry.depth * geometry.scale >= 18, 'Adaptive curve exposes its vertex, including 49x²−36 and negative leading coefficients');
    await pointerProbe(page, lab, '[data-lab-plot]');
    await verifyQuadraticProbe(lab, index);
  } else {
    const candidates = lab.locator('[data-lab-action="candidate"]');
    assert.equal(await candidates.count(), 4, 'Every offered inequality can be explored');
    for (let candidate = 0; candidate < 4; candidate++) {
      const button = candidates.nth(candidate), polynomial = candidatePolynomial(await button.innerText());
      await button.click();
      assert.equal(await lab.getAttribute('data-active-candidate'), String(candidate));
      const validate = () => verifyCandidate(lab, kind, index, polynomial);
      await keyboardProbe(lab, '[data-lab-action="probe"]', validate);
      if (kind === 'graph') {
        for (let boundary = 0; boundary < 2; boundary++) {
          await lab.locator(`[data-lab-action="root"][data-root-index="${boundary}"]`).click();
          close(Number(await lab.getAttribute('data-probe-x')), GRAPH[index].roots[boundary], 'Graph boundary is checked exactly');
          await validate();
        }
        for (let region = 0; region < 3; region++) {
          await lab.locator(`[data-lab-action="region"][data-region="${region}"]`).click();
          await validate();
        }
      } else {
        const beforeOpposite = Number(await lab.getAttribute('data-probe-x'));
        await lab.locator('[data-lab-action="opposite"]').click();
        close(Number(await lab.getAttribute('data-probe-x')), -beforeOpposite, 'Opposite x has the same square');
        await validate();
        await lab.locator('[data-lab-action="zero"]').click();
        close(Number(await lab.getAttribute('data-probe-x')), 0, 'Zero probe');
        await validate();
        await lab.locator('[data-lab-action="minimum"]').click();
        assert.match(await lab.locator('[data-minimum-reason]').innerText(), /x² ≥ 0 при любом x/, 'All-number reasoning is distinct from finite trial samples');
        close(Number(await lab.locator('[data-minimum-reason]').getAttribute('data-minimum')), polynomial.c, 'The minimum is derived from x² ≥ 0');
      }
    }
    const polynomial = candidatePolynomial(await candidates.nth(3).innerText());
    await pointerProbe(page, lab, '[data-lab-plot]');
    await verifyCandidate(lab, kind, index, polynomial);
  }
}

async function exerciseLinear(page, lab, index, width) {
  const fixture = LINEAR[index];
  const cards = lab.locator('[data-term-id]');
  const ids = await cards.evaluateAll(nodes => nodes.map(n => n.dataset.termId));
  for (const id of ids) {
    const card = lab.locator(`[data-term-id="${id}"]`);
    const side = await card.getAttribute('data-side');
    const attribute = await card.getAttribute('data-kind') === 'bracket' ? 'data-k' : 'data-c';
    const coefficient = Number(await card.getAttribute(attribute));
    if (width < 600) await card.tap(); else await card.click();
    assert.equal(await card.getAttribute('data-side'), side === 'left' ? 'right' : 'left');
    close(Number(await card.getAttribute(attribute)), -coefficient, 'Transfer negates the whole signed term');
    assert.equal(await lab.locator('[data-linear-comparator]').textContent(), fixture.sign, 'Moving a term does not reverse the inequality');
    await card.press(side === 'left' ? 'ArrowLeft' : 'ArrowRight');
    assert.equal(await card.getAttribute('data-side'), side);
    close(Number(await card.getAttribute(attribute)), coefficient, 'Keyboard return restores the term');
  }
  if (width === 1280 && index === 0) {
    const card = lab.locator('[data-term-id="l0"]');
    await card.scrollIntoViewIfNeeded();
    const from = await card.boundingBox(), to = await lab.locator('[data-drop-side="right"]').boundingBox();
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width / 2, to.y + 20, { steps: 12 });
    await page.mouse.move(to.x + to.width / 2, to.y + 21);
    await page.mouse.up();
    assert.equal(await card.getAttribute('data-side'), 'right', 'Native pointer drag transfers a signed term');
    await card.press('ArrowLeft');
  }
  if (index === 3) {
    await openDetail(lab, '[data-lab-section="brackets"]');
    await lab.locator('[data-lab-action="expand-part"][data-part="0"]').click();
    assert.equal(await lab.locator('[data-lab-action="expand-bracket"]').isDisabled(), true, 'Both factors must be considered');
    await lab.locator('[data-lab-action="expand-part"][data-part="1"]').click();
    await lab.locator('[data-lab-action="expand-bracket"]').click();
    assert.equal(await lab.locator('[data-kind="bracket"]').count(), 0);
    assert.equal(await lab.locator('[data-term-id="l1p0"]').getAttribute('data-c'), '-12');
    assert.equal(await lab.locator('[data-term-id="l1p1"]').getAttribute('data-c'), '-3');
  }
  const remaining = await cards.evaluateAll(nodes => nodes.map(n => ({ id: n.dataset.termId, side: n.dataset.side, power: n.dataset.power })));
  for (const term of remaining) {
    const target = term.power === '1' ? 'left' : 'right';
    if (term.side !== target) await lab.locator(`[data-term-id="${term.id}"]`).click();
  }
  await openDetail(lab, '[data-lab-section="divide"]');
  await lab.locator('[data-lab-action="combine"]').click();
  const sums = await cards.evaluateAll(nodes => nodes.reduce((s, n) => { s[n.dataset.side] += Number(n.dataset.c); return s; }, { left: 0, right: 0 }));
  close(sums.left, fixture.a, 'Collected x coefficient'); close(sums.right, -fixture.b, 'Collected constant');
  const divisor = lab.locator('[data-lab-input="divisor"]');
  await divisor.fill('0'); await lab.locator('[data-lab-action="check-divisor"]').click();
  assert.equal(await lab.getAttribute('data-divisor-valid'), 'false', 'Zero divisor is rejected');
  await divisor.fill(String(fixture.a)); await lab.locator('[data-lab-action="check-divisor"]').click();
  assert.equal(await lab.getAttribute('data-divisor-valid'), 'true');
  const reversed = { '<': '>', '>': '<', '≤': '≥', '≥': '≤' };
  const expectedSign = fixture.a < 0 ? reversed[fixture.sign] : fixture.sign;
  await lab.locator(`[data-lab-action="choose-sign"][data-sign="${reversed[expectedSign]}"]`).click();
  assert.equal(await lab.getAttribute('data-sign-correct'), 'false');
  await lab.locator(`[data-lab-action="choose-sign"][data-sign="${expectedSign}"]`).click();
  assert.equal(await lab.getAttribute('data-sign-correct'), 'true');
  assert.equal(await lab.locator('[data-sign-result] .fraction').count(), 1, 'Division is displayed with a fraction bar');
  await nestedHelp(lab);
  const validate = async () => {
    const x = Number(await lab.getAttribute('data-probe-x'));
    assert.equal(await lab.getAttribute('data-probe-truth'), String(compare(fixture.a * x + fixture.b, fixture.sign)), 'Trial is checked in the original inequality');
  };
  await keyboardProbe(lab, '[data-lab-input="probe"]', validate);
  for (const offset of [-1, 0, 1]) {
    await lab.locator(`[data-lab-action="probe-sample"][data-offset="${offset}"]`).click();
    close(Number(await lab.getAttribute('data-probe-x')), -fixture.b / fixture.a + offset, 'Exact boundary neighbourhood');
    await validate();
  }
  await pointerProbe(page, lab, '[data-probe-line]');
  await validate();
}

async function exerciseSystems(page, lab, index) {
  const fixture = SYSTEMS[index];
  const validate = async () => {
    const x = Number(await lab.getAttribute('data-probe-x'));
    const truth = fixture.map(c => compare(x - c.value, c.sign));
    assert.equal(await lab.getAttribute('data-first-truth'), String(truth[0]));
    assert.equal(await lab.getAttribute('data-second-truth'), String(truth[1]));
    assert.equal(await lab.getAttribute('data-both-truth'), String(truth.every(Boolean)), 'A system requires both conditions simultaneously');
  };
  await keyboardProbe(lab, '[data-lab-input="probe"]', validate);
  for (let i = 0; i < 2; i++) {
    await lab.locator(`[data-lab-action="probe-boundary"][data-boundary-index="${i}"]`).click();
    close(Number(await lab.getAttribute('data-probe-x')), fixture[i].value, 'System boundary is checked exactly');
    await validate();
  }
  await nestedHelp(lab);
  const overlap = lab.locator('[data-system-overlap]');
  const intersection = await overlap.innerHTML();
  await lab.locator('[data-lab-action="set-operation"][data-operation="or"]').click();
  assert.equal(await lab.getAttribute('data-operation'), 'or');
  assert.notEqual(await overlap.innerHTML(), intersection, 'Union experiment visibly differs from intersection');
  await validate();
  await lab.locator('[data-lab-action="set-operation"][data-operation="and"]').click();
  assert.equal(await overlap.innerHTML(), intersection, 'Returning to a system restores the common part');
  for (const boundary of fixture) {
    const included = fixture.every(condition => compare(boundary.value - condition.value, condition.sign));
    assert.equal(await overlap.locator(`[data-overlap-endpoint="${boundary.value}"]`).getAttribute('data-included'), String(included), 'Overlap endpoint uses the strictness of both conditions');
  }
  await pointerProbe(page, lab, '[data-system-line="0"]');
  await validate();
}

async function retainedState(page, lab, task, beforeProgress) {
  const beforeChoice = await snapshot(lab);
  const answers = page.locator('#modulePanel button');
  await answers.first().click();
  assert.deepEqual(await snapshot(lab), beforeChoice, 'Choosing an answer does not rebuild or reset the experiment');
  const chosen = await selectedAnswer(page);
  assert.ok(chosen.length, 'Only an explicit answer click selects a final answer');
  const saved = await snapshot(lab);
  await page.locator('#hintToggle').click();
  assert.equal(await page.locator('#hintPanel').isVisible(), false);
  await page.locator('#hintToggle').click();
  assert.deepEqual(await snapshot(lab), saved, 'Close/reopen retains the trial and nested-help state');
  await page.locator('#hintReturn').click();
  assert.equal(await page.locator('#hintPanel').isVisible(), false);
  assert.equal(await page.locator('#hintToggle').evaluate(e => e === document.activeElement), true, 'Return puts keyboard focus on the help button');
  await page.locator('#hintToggle').click();
  assert.deepEqual(await snapshot(lab), saved, 'Explicit return preserves the experiment');
  await page.locator('#next').click();
  await page.locator('#previous').click();
  assert.equal(await page.locator('#taskPicker').inputValue(), task.key);
  assert.deepEqual(await snapshot(lab), saved, 'Next/previous retains this prototype’s experiment');
  assert.deepEqual(await selectedAnswer(page), chosen, 'Next/previous retains the answer draft');
  await settings(page, true);
  const other = task.kind === 'linear' ? 'quad' : 'linear';
  await page.getByRole('button', { name: LABEL[other], exact: true }).click();
  await page.getByRole('button', { name: LABEL[task.kind], exact: true }).click();
  await settings(page, false);
  assert.equal(await page.locator('#taskPicker').inputValue(), task.key);
  assert.deepEqual(await snapshot(lab), saved, 'Topic navigation retains the experiment');
  assert.deepEqual(await selectedAnswer(page), chosen, 'Topic navigation retains the answer draft');
  assert.equal(await progress(page), beforeProgress, 'Help and draft choices never award progress');
}

async function oneTask(page, task, width) {
  await chooseTask(page, task.key);
  assert.equal(await page.locator('#hintPanel').isVisible(), false, `${task.key}: help is initially optional`);
  assert.deepEqual(await selectedAnswer(page), [], `${task.key}: no supplied answer`);
  assert.match(await page.locator('#taskPosition').innerText(), new RegExp(`${task.index + 1}\\s+из\\s+${FAMILY[task.kind]}`));
  const given = task.kind === 'graph' ? await page.locator('#givenBoard').innerHTML() : null;
  const beforeProgress = await progress(page);
  await modelFits(page, `${width}/${task.key}/question`);
  await page.locator('#hintToggle').click();
  const lab = page.locator(`#task13LabHost [data-task13-lab][data-lab-kind="${task.kind}"]`);
  assert.equal(await lab.count(), 1, 'Each prototype opens a relevant laboratory');
  assert.ok(await lab.isVisible());
  assert.ok((await lab.locator('[data-lab-status]').innerText()).trim().length > 0, 'The model explains the current experiment');
  if (task.kind === 'linear') await exerciseLinear(page, lab, task.index, width);
  else if (task.kind === 'systems') await exerciseSystems(page, lab, task.index);
  else await exerciseCurve(page, lab, task.kind, task.index);
  await nestedHelp(lab);
  assert.deepEqual(await selectedAnswer(page), [], 'Laboratory controls cannot fill the final answer');
  assert.equal(await progress(page), beforeProgress, 'Laboratory experiments cannot award credit');
  if (given !== null) assert.equal(await page.locator('#givenBoard').innerHTML(), given, 'Candidate experiments leave the given drawing unchanged');
  await modelFits(page, `${width}/${task.key}/laboratory`);
  const reference = page.locator('#referenceDetails');
  if (await reference.isVisible()) {
    await reference.locator(':scope > summary').click();
    await modelFits(page, `${width}/${task.key}/reference`);
    await reference.locator(':scope > summary').click();
  }
  await retainedState(page, lab, task, beforeProgress);
  if (given !== null) assert.equal(await page.locator('#givenBoard').innerHTML(), given, 'Answer drafts also leave the given drawing unchanged');
  await page.screenshot({ path: path.join(artifacts, `${width}-${task.kind}-${task.index + 1}.png`), fullPage: true });
  coverage.push({ viewport: width, prototype: task.key, optionalHelp: true, liveModel: true, retainedTrialAndDraft: true, noAnswerAutofill: true, noCreditFromHelp: true, internalFit: true });
}

async function gradingAndNewRound(page) {
  await chooseTask(page, 'quad:0');
  // The first selected chip was only a draft. Select exactly the middle interval.
  for (const button of await page.locator('#chips button[aria-pressed="true"]').all()) await button.click();
  await page.locator('#chips button').nth(1).focus();
  await page.keyboard.press('Space');
  await page.locator('#check').click();
  assert.match(await page.locator('#msg').innerText(), /Верно/);
  assert.equal(await page.locator('#correct').textContent(), '1');
  assert.equal(await page.locator('#check').isDisabled(), true);
  const credited = await progress(page);
  await page.locator('#next').click(); await page.locator('#previous').click();
  assert.equal(await page.locator('#check').isDisabled(), true, 'Returning cannot award duplicate credit');
  assert.equal(await progress(page), credited);
  await chooseTask(page, 'linear:0');
  if (!await page.locator('#hintPanel').isVisible()) await page.locator('#hintToggle').click();
  await page.locator('#solutionDetails > summary').click();
  await page.getByRole('button', { name: 'Показать решение', exact: true }).click();
  assert.equal(await page.locator('#check').isDisabled(), true, 'A revealed solution cannot be graded');
  assert.equal(await progress(page), credited, 'Revealing a solution awards no credit');
  await settings(page, true); await page.locator('#newRound').click();
  assert.equal(await page.locator('#settings').evaluate(e => e.open), false);
  assert.equal(await page.locator('#hintPanel').isVisible(), false);
  assert.equal(await page.locator('#check').isDisabled(), false);
  assert.deepEqual(await selectedAnswer(page), [], 'New round clears the draft');
  assert.equal(await progress(page), credited, 'New round retains accumulated statistics');
  await page.locator('#hintToggle').click();
  assert.equal(await page.locator('#task13LabHost details[open]').count(), 0, 'New round clears nested experiment state');
  coverage.push({ check: 'grade-once-reveal-no-credit-new-round', passed: true });
}

async function run() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    for (const width of [1280, 360, 320]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, locale: 'ru-RU', reducedMotion: 'reduce', hasTouch: width < 600 });
      await context.tracing.start({ screenshots: false, snapshots: true, sources: true });
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      page.on('pageerror', error => errors.push({ viewport: width, message: error.message }));
      await context.route('**/*', route => {
        if (route.request().url().startsWith(origin + '/')) return route.continue();
        external.push(route.request().url()); return route.abort();
      });
      try {
        await page.goto(origin + '/trainers/oge13-inequalities-series.html');
        await settings(page, true);
        assert.equal(await page.locator('#taskPicker option').count(), 26, 'All existing 26 prototypes are selectable');
        await settings(page, false);
        assert.equal(await page.locator('.course-back').getAttribute('href'), '../oge/', 'Course return remains available');
        const tasks = width === 320 ? CASES.filter(t => t.index === 0 || t.key === 'quad:4' || t.key === 'quad:6') : CASES;
        for (const task of tasks) await oneTask(page, task, width);
        if (width !== 320) await gradingAndNewRound(page);
        console.log(`PASS №13: ${tasks.length} prototypes at ${width}px`);
      } catch (error) {
        await page.screenshot({ path: path.join(artifacts, `failure-${width}.png`), fullPage: true }).catch(() => {});
        throw error;
      } finally {
        await context.tracing.stop({ path: path.join(artifacts, `trace-${width}.zip`) });
        await context.close();
      }
    }
    assert.deepEqual(errors, [], 'No browser runtime errors');
    assert.deepEqual(external, [], 'No external runtime dependencies');
    console.log('Task 13 cloud browser coverage passed.');
  } finally {
    fs.writeFileSync(path.join(artifacts, 'coverage.json'), JSON.stringify({ coverage, errors, external }, null, 2));
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
