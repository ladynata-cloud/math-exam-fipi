'use strict';
// Fictional learner journeys. These are automated usability/regression scenarios,
// not observations of real pupils or evidence that a skill has been mastered.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('playwright');
const G = require('../trainers/oge-basics/multiplication-division/division-guided-core');
const root = path.resolve(__dirname, '..');
const ROUTE = '/trainers/oge-basics/arithmetic-route.html';
const OLD = '/trainers/arifmetika.html';
const GUIDED = '/trainers/oge-basics/multiplication-division/long-division-from-simple-to-decimals.html';
const screenshots = process.env.PREOGE_SCREENSHOTS;
const errors = [];
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + new URL(req.url, 'http://fixture').pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  try {
    res.setHeader('Content-Type', ({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'})[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  } catch (_) { res.writeHead(404).end(); }
});
let origin;
async function route(page, skill = 'division') {
  await page.goto(origin + ROUTE + '?skill=' + skill);
  await page.waitForFunction(() => window.PreOgeArithmetic && document.querySelector('a[data-level]'));
}
async function legacyReady(page, level) {
  await page.waitForFunction(expected => window.levelId === expected && window.task, level);
  assert.equal(await page.locator('#level').inputValue(), level, 'The requested skill opens directly');
}
async function legacy(page, level) {
  await page.goto(origin + OLD + '?course=preoge&level=' + level);
  await legacyReady(page, level);
}
async function chooseLegacy(page, level) {
  const details = page.locator('#arithmetic-choices');
  if (await details.count() && await details.getAttribute('open') === null) await details.locator('summary').click();
  await page.locator('#level').selectOption(level);
  await legacyReady(page, level);
}
const oldState = page => page.evaluate(() => ({task, phase, stepIdx, selLen, qDone, errors, finished}));
async function summary(page, level) {
  await page.waitForFunction(() => window.PreOgeArithmetic?.summaryForLevel);
  return page.evaluate(id => window.PreOgeArithmetic.summaryForLevel(id), level);
}
async function oldAnswer(page, value, keyboard = false) {
  await page.locator('#ans').fill(String(value));
  if (keyboard) await page.locator('#ans').press('Enter');
  else await page.locator('#check').click();
}
async function selectPrefix(page, length) {
  while ((await oldState(page)).selLen < length) await page.locator('#more').click();
  while ((await oldState(page)).selLen > length) await page.locator('#less').click();
}
async function oldOne(page) {
  const s = await oldState(page), t = s.task;
  if (s.finished) return false;
  if (s.phase === 'select') {
    await selectPrefix(page, t.steps[0].end + 1);
    await page.locator('#selok').click();
    return true;
  }
  const a = await page.evaluate(() => {
    if (phase === 'simple') return task.ansv;
    if (phase === 'vis') return task.P;
    if (phase === 'shiftM') return task.m;
    if (phase === 'shiftA') return task.Pval;
    if (phase === 'shiftB') return task.d;
    if (phase === 'digit') return task.steps[stepIdx].qd;
    if (phase === 'mult') return (trialDigit === null ? task.steps[stepIdx].qd : trialDigit) * task.d;
    if (phase === 'sub') return task.steps[stepIdx].rem;
    throw Error('No fixture answer for phase ' + phase);
  });
  await oldAnswer(page, a);
  return true;
}
async function oldFinish(page) {
  for (let i = 0; i < 100; i++) if (!(await oldOne(page))) return;
  throw Error('Legacy example did not finish');
}
const guidedState = page => page.evaluate(() => window.__divisionGuidedDebug.state());
async function guidedReady(page) { await page.waitForFunction(() => window.__divisionGuidedDebug); }
async function guidedOne(page) {
  const all = await guidedState(page), s = all.sessions[all.active];
  if (s.done) return false;
  if (s.accepted) { await page.locator('#primary').click(); return true; }
  const a = G.plan(s.task).actions[s.step];
  if (a.options) await page.locator('[data-option=' + JSON.stringify(a.answer) + ']').click();
  else if (a.kind === 'start') await page.locator('[data-prefix-end="' + a.sourceIndex + '"]').click();
  else await page.locator('#answer').fill(a.answer);
  await page.locator('#primary').click();
  assert((await guidedState(page)).sessions[all.active].accepted, 'The correct guided action must be accepted');
  return true;
}
async function guidedFinish(page) {
  for (let i = 0; i < 220; i++) if (!(await guidedOne(page))) return;
  throw Error('Guided example did not finish');
}
async function reflow(page, label) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label + ': the document must fit the phone');
}
async function wholeQuotientVisible(page, label) {
  const box = await page.locator('#cornerwrap').evaluate(el => {
    const outer = el.getBoundingClientRect();
    const cells = [...el.querySelectorAll('#qrow > div')].map(c => c.getBoundingClientRect());
    return {left:outer.left, right:outer.right, digits:cells.map(c => ({left:c.left,right:c.right,top:c.top}))};
  });
  assert(box.digits.every(d => d.left >= box.left - 1 && d.right <= box.right + 1), label + ': every answer digit must be visible without discovering a horizontal scroll');
  const tops = box.digits.map(d => d.top);
  assert(Math.max(...tops) - Math.min(...tops) < 1, label + ': a quotient must not wrap into two numbers');
}
async function shot(page, name) {
  if (!screenshots) return;
  fs.mkdirSync(screenshots, {recursive:true});
  await page.screenshot({path:path.join(screenshots, name + '.png'), fullPage:true});
}
async function learner(browser, name, width, run) {
  const context = await browser.newContext({viewport:{width,height:900}});
  // Reproducible real generators; no tasks, answers or learner results are injected.
  await context.addInitScript(() => {
    let seed = 0x62f17a39;
    Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(name + ': ' + error.message));
  try { await run(page); console.log('PASS fictional learner: ' + name); }
  finally { await context.close(); }
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.CHROMIUM_EXECUTABLE_PATH} : {})});
  try {
    await learner(browser, 'weak multiplication table', 390, async page => {
      await route(page, 'multiply');
      await page.locator('a[data-level="t2a"]').first().click(); await legacyReady(page, 't2a');
      assert(await page.locator('#viswrap').isVisible(), 'Visual rows are actually shown');
      const first = await oldState(page);
      await page.locator('#check').click();
      assert.equal((await oldState(page)).finished, false, 'Blank is not zero or a completed task');
      await oldAnswer(page, first.task.P + 1);
      assert.equal((await oldState(page)).errors, 1);
      await page.locator('#hint').click(); await oldFinish(page);
      let progress = await summary(page, 't2a');
      assert.equal(progress.solved, 1); assert.equal(progress.independent, 0, 'Help is never independent work');
      await page.reload(); await legacyReady(page, 't2a'); await oldFinish(page);
      progress = await summary(page, 't2a');
      assert.equal(progress.solved, 1, 'Revisiting the same condition does not inflate completed examples');
      assert.equal(progress.independent, 0, 'Repeating a helped example is not new independent work');
      await chooseLegacy(page, 'n2d');
      await oldFinish(page);
      progress = await summary(page, 'n2d');
      assert.equal(progress.solved, 1); assert.equal(progress.independent, 1);
      await page.locator('#next').click(); await page.locator('#solution').click();
      progress = await summary(page, 'n2d');
      assert.equal(progress.viewed, 1, 'A revealed solution is recorded as viewed');
      assert.equal(progress.solved, 1); assert.equal(progress.independent, 1, 'Viewing does not increase completed or independent counts');
      await reflow(page, 'table on 390px'); await shot(page, 'table-390');
      await page.locator('#preoge-return').click();
      assert.equal(new URL(page.url()).pathname, ROUTE);
      assert.equal((await summary(page, 't2a')).independent, 0);
      assert.equal((await summary(page, 'n2d')).independent, 1);
    });
    await learner(browser, 'partial dividend and two-digit trial', 1280, async page => {
      await legacy(page, 'n4d');
      const initial = await oldState(page), need = initial.task.steps[0].end + 1;
      assert(need > 1 && need < initial.task.digits.length, 'Fixture needs both smaller and larger prefixes');
      await page.locator('#selok').click();
      assert.equal((await oldState(page)).phase, 'select');
      assert.match(await page.locator('#fb').innerText(), /меньше|цифру/);
      await selectPrefix(page, need + 1); await page.locator('#selok').click();
      assert.equal((await oldState(page)).errors, 2);
      assert.match(await page.locator('#fb').innerText(), /лишнее|Убери/);
      await selectPrefix(page, need); await page.locator('#selok').click();
      assert.equal((await oldState(page)).phase, 'digit');
      const digit = initial.task.steps[0].qd, trial = digit === 9 ? 8 : digit + 1;
      await oldAnswer(page, trial); assert.equal((await oldState(page)).phase, 'mult');
      await oldAnswer(page, trial * initial.task.d);
      assert.equal((await oldState(page)).phase, 'digit', 'A bad trial returns to selecting a digit');
      assert.equal((await oldState(page)).qDone, 0, 'A rejected trial is not written in the answer');
      await oldFinish(page);
      assert.equal((await page.locator('#qrow').innerText()).replace(/\s/g,''), initial.task.qStr);
      assert((await page.locator('#cleft .cline').count()) > 2, 'Earlier written calculation rows remain');
      assert.equal((await summary(page, 'n4d')).independent, 0);
      await chooseLegacy(page, 'n3e'); await oldFinish(page);
      assert.equal((await summary(page, 'n3e')).independent, 1);
      await shot(page, 'corner-completed');
    });
    await learner(browser, 'zero cannot be skipped', 320, async page => {
      await legacy(page, 'n4c');
      let zero;
      for (let i = 0; i < 80; i++) {
        const s = await oldState(page);
        if (s.phase === 'digit' && s.task.steps[s.stepIdx].qd === 0) { zero = s; break; }
        assert(await oldOne(page), 'The generated task must contain a zero quotient digit');
      }
      assert(zero, 'Reached a required zero');
      await page.locator('#check').click();
      assert.equal((await oldState(page)).qDone, zero.qDone, 'Blank cannot replace a zero');
      await oldAnswer(page, 1);
      assert.equal((await oldState(page)).phase, 'digit');
      assert.equal((await oldState(page)).qDone, zero.qDone);
      await oldAnswer(page, 0, true);
      assert.equal((await oldState(page)).qDone, zero.qDone + 1, 'Keyboard accepts a written zero');
      await oldFinish(page);
      assert.equal((await page.locator('#qrow').innerText()).replace(/\s/g,''), zero.task.qStr);
      assert.equal((await summary(page, 'n4c')).independent, 0);
      await wholeQuotientVisible(page, 'four-digit quotient on 320px');
      await reflow(page, 'zero division on 320px'); await shot(page, 'zero-320');
    });
    await learner(browser, 'decimal shift must change both numbers', 390, async page => {
      await legacy(page, 'n5f');
      const {task:t} = await oldState(page);
      assert.equal((await oldState(page)).phase, 'shiftM');
      assert.doesNotMatch(await page.locator('#instruction').innerText(), /делить на дробь нельзя/i);
      await oldAnswer(page, t.m, true);
      assert.equal((await oldState(page)).phase, 'shiftA');
      await oldAnswer(page, t.origA);
      assert.equal((await oldState(page)).phase, 'shiftA', 'Leaving the dividend unchanged is rejected');
      await oldAnswer(page, String(t.Pval).replace('.', ','));
      assert.equal((await oldState(page)).phase, 'shiftB');
      await oldAnswer(page, t.origB);
      assert.equal((await oldState(page)).phase, 'shiftB', 'Leaving the divisor unchanged is rejected');
      await oldAnswer(page, t.d);
      assert.equal((await oldState(page)).phase, 'select');
      assert((await page.locator('#prompt').innerText()).includes(t.disp + ' ÷ ' + t.d), 'Both transformed numbers are visible');
      await oldFinish(page);
      assert.equal((await page.locator('#qrow').innerText()).replace(/\s/g,''), t.qStr);
      assert.equal((await summary(page, 'n5f')).independent, 0);
      await wholeQuotientVisible(page, 'decimal quotient on 390px');
      await reflow(page, 'decimal division on 390px'); await shot(page, 'decimal-390');
    });
    await learner(browser, 'guided help then genuinely new work', 1280, async page => {
      await page.goto(origin + GUIDED + '?course=preoge#start'); await guidedReady(page);
      await page.locator('#help-toggle').click(); await page.locator('#reveal').click();
      await guidedFinish(page);
      await page.locator('#course-return-completion').click();
      let p = await summary(page, 'n3e');
      assert.equal(p.guidedSolved, 1); assert.equal(p.guidedIndependent, 0);
      await page.goto(origin + GUIDED + '?course=preoge#start'); await guidedReady(page);
      await page.locator('#repeat-example').click(); await guidedFinish(page);
      assert.equal((await guidedState(page)).records.at(-1).repeated, true);
      await page.locator('#course-return-completion').click();
      p = await summary(page, 'n3e');
      assert.equal(p.guidedSolved, 1, 'A repeated condition is not a new solved example');
      assert.equal(p.guidedIndependent, 0, 'Repeating a revealed condition is not new independent work');
      await page.goto(origin + GUIDED + '?course=preoge#start'); await guidedReady(page);
      await page.locator('#next-example').click(); await guidedFinish(page);
      await page.reload(); await guidedReady(page);
      assert.equal((await guidedState(page)).records.length, 3, 'Reload does not add a completion');
      await page.locator('#course-return-completion').click();
      p = await summary(page, 'n3e');
      assert.equal(p.guidedSolved, 2); assert.equal(p.guidedIndependent, 1);
      assert.equal(p.solved, 0, 'Guided examples remain separate from self-practice');
    });
    await learner(browser, 'mobile return and interrupted lesson', 320, async page => {
      await route(page); await reflow(page, 'route on 320px');
      await page.locator('a[href*="long-division-from-simple-to-decimals"][href*="#start"]').first().click();
      await guidedReady(page);
      await page.locator('#answer').fill('4'); await page.locator('#primary').click();
      const before = await guidedState(page);
      await page.reload(); await guidedReady(page);
      assert.deepEqual(await guidedState(page), before, 'Accepted current step survives interruption');
      await guidedFinish(page); await reflow(page, 'guided on 320px');
      await page.locator('#course-return-completion').click();
      assert.equal((await summary(page, 'n3e')).guidedIndependent, 1);
      await page.locator('a[data-level="n3e"]').first().click(); await legacyReady(page, 'n3e');
      await oldFinish(page); await page.locator('#preoge-return').click();
      let p = await summary(page, 'n3e');
      assert.equal(p.independent, 1); assert.equal(p.guidedIndependent, 1);
      await page.reload();
      p = await summary(page, 'n3e'); assert.equal(p.independent, 1);
      await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {configurable:true, value:{writeText:() => Promise.reject(Error('fixture denial'))}}));
      await page.locator('details.report > summary').click();
      await page.locator('#route-report-copy').click();
      assert(await page.locator('#route-report-text').isVisible(), 'Report remains selectable when clipboard is denied');
      assert((await page.locator('#route-report-text').inputValue()).length > 50);
      await reflow(page, 'report on 320px'); await shot(page, 'route-report-320');
    });
    // Compatibility smoke is separate from the six learner scenarios.
    const context = await browser.newContext(), page = await context.newPage();
    page.on('pageerror', error => errors.push('all-level hints: ' + error.message));
    try {
      await legacy(page, 'n1a');
      const levels = await page.evaluate(() => Object.keys(LEVELS));
      for (const level of levels) {
        await chooseLegacy(page, level); await page.locator('#hint').click();
        assert((await page.locator('#fb').innerText()).trim(), level + ': a useful hint must appear');
        assert.equal((await oldState(page)).finished, false, level + ': asking for help cannot finish an example');
      }
      console.log('PASS compatibility: hints across ' + levels.length + ' legacy levels');
    } finally { await context.close(); }
    assert.deepEqual(errors, [], 'No browser JavaScript exceptions');
    console.log('PREOGE_ARITHMETIC_BROWSER_OK: six fictional learner journeys, real controls, mistakes, help, repeats, separate progress, reload, route returns, clipboard fallback and 320/390px.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); if (errors.length) console.error('Browser errors:', errors); server.close(); process.exitCode = 1; });
