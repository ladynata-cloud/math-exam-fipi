'use strict';
// CI-only Chromium regression. All answers are entered through the actual UI;
// sessionStorage is read, never injected, to verify resume and first-attempt evidence.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('playwright');
const C = require('../trainers/oge-basics/multiplication-division/division-diagnostic-core.js');
const root = path.resolve(__dirname, '..');
const route = '/trainers/oge-basics/multiplication-division/division-diagnostic.html';
const KEY = 'mathExam.divisionDiagnostic.tab.v1';
const output = process.env.DIVISION_DIAGNOSTIC_OUTPUT_DIR;
const errors = [];
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + new URL(req.url, 'http://fixture').pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  try {
    res.setHeader('Content-Type', ({'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8'})[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  } catch (_) { res.writeHead(404).end(); }
});
const readState = page => page.evaluate(key => JSON.parse(sessionStorage.getItem(key)), KEY);
async function screenshot(page, name) {
  if (!output || !name) return;
  fs.mkdirSync(output, {recursive:true});
  await page.screenshot({path:path.join(output, name + '.png'), fullPage:true});
}
async function layout(page, name) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), name + ': no horizontal document overflow');
  if (await page.locator('#answer').count()) {
    assert(await page.locator('#answer').evaluate(node => parseFloat(getComputedStyle(node).fontSize) >= 24), name + ': answer input remains readable');
  }
}
async function reloadExact(page) {
  const before = await readState(page);
  await page.reload();
  await page.locator('#diagnostic > section').first().waitFor({state:'visible'});
  assert.deepEqual(await readState(page), before, 'Reload preserves validated answers, pending continuation and drafts');
}
async function selectPrefix(page, length, keyboard = false) {
  for (let n = 0; n < 6; n++) {
    const selected = (await readState(page)).selection;
    if (selected === length) return;
    if (keyboard) await page.locator('#question-title').press(selected < length ? 'ArrowRight' : 'ArrowLeft');
    else await page.locator('[data-do="' + (selected < length ? 'more' : 'less') + '"]').click();
  }
  throw Error('Prefix arrows did not reach ' + length);
}
async function partialRows(page) {
  return page.locator('.workspace .work > .numrow').evaluateAll(nodes => nodes.map(node => node.textContent.replace(/\s/g, '')));
}
async function answer(page, question, value, options = {}) {
  assert.equal(await page.locator('#question-title').innerText(), question.prompt);
  const before = await readState(page);
  if (question.kind === 'selection') {
    await selectPrefix(page, Number(value), options.keyboard);
    assert.equal(await page.locator('.workspace .numrow .selected').count(), Number(value), 'Arrows highlight the learner-selected prefix');
    if (options.reload) {
      await reloadExact(page);
      assert.equal(await page.locator('.workspace .numrow .selected').count(), Number(value));
    }
    await screenshot(page, options.shot);
  } else {
    await page.locator('#answer').fill(value);
    await layout(page, question.id);
    if (options.reload) {
      await reloadExact(page);
      assert.equal(await page.locator('#answer').inputValue(), value, 'Unsubmitted numeric draft survives reload');
    }
  }
  if (question.kind === 'partial') {
    assert(!(await partialRows(page)).includes(question.answer), 'The combined partial dividend is not written in the notebook before answering');
    assert.equal(await page.locator('.workspace .arrow').count(), 1, 'The source digit is indicated without revealing the combined number');
    if (options.shot) await screenshot(page, options.shot);
  }
  await page.locator('#answer-form button[type="submit"]').click();
  const accepted = await readState(page), result = accepted.records.at(-1);
  assert.equal(accepted.records.length, before.records.length + 1, 'One submitted response adds one evidence record');
  assert(accepted.accepted, 'Each response waits for explicit continuation');
  assert.equal(result.id, question.id);
  assert.equal(result.value, value);
  assert.equal(result.correct, C.isCorrect(question, value));
  assert.equal(await page.locator('.feedback.correct').count(), result.correct ? 1 : 0);
  if (question.kind === 'partial') assert((await partialRows(page)).includes(question.answer), 'Canonical partial dividend appears after the response');
  if (options.reloadAccepted) await reloadExact(page);
  await layout(page, question.id + '-accepted');
  await page.locator('[data-do="next"]').click();
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.CHROMIUM_EXECUTABLE_PATH} : {})});
  try {
    for (const width of [320, 390, 1060]) {
      const context = await browser.newContext({viewport:{width, height:900}, reducedMotion:'reduce'});
      const page = await context.newPage();
      page.setDefaultTimeout(12000);
      page.on('pageerror', error => errors.push(width + 'px: ' + error.message));
      try {
        await page.goto('http://127.0.0.1:' + server.address().port + route);
        await page.locator('[data-do="start"]').click();
        const model = C.build(0);
        assert.equal(model.questions.length, 18);
        assert.equal(await page.locator('.numrow .selected').count(), 0, 'Correct starting prefix is not preselected');
        await page.locator('#answer-form button[type="submit"]').click();
        assert.equal((await readState(page)).records.length, 0, 'Empty selection is not an incorrect arithmetic answer');
        assert(await page.locator('#input-error').isVisible());
        // Both arrow directions work; this intermediate selection is not scored.
        await selectPrefix(page, 2, true);
        await selectPrefix(page, 1, true);
        assert.equal((await readState(page)).records.length, 0);
        let numericReloaded = false, partialShot = false;
        for (let i = 0; i < model.questions.length; i++) {
          const q = model.questions[i];
          const wrongPrefix = width === 390 && i === 0;
          const wrongSubtract = width !== 320 && q.skill === 'subtract';
          const value = wrongPrefix ? '2' : wrongSubtract ? String(Number(q.answer) + 1) : q.answer;
          const reload = i === 0 || (!numericReloaded && q.kind !== 'selection');
          if (q.kind !== 'selection') numericReloaded = true;
          const shot = i === 0 ? 'prefix-' + width : q.kind === 'partial' && !partialShot ? 'partial-pending-' + width : null;
          if (q.kind === 'partial') partialShot = true;
          await answer(page, q, value, {keyboard:i === 0, reload, reloadAccepted:wrongSubtract, shot});
        }
        const mainRecords = (await readState(page)).records;
        const affected = new Set(mainRecords.filter(r => !r.correct).map(r => r.skill));
        for (const skill of C.SKILL_ORDER.filter(skill => affected.has(skill))) {
          const q = C.confirmation(skill, 0);
          await answer(page, q, skill === 'subtract' ? String(Number(q.answer) + 1) : q.answer);
        }
        assert.equal(await page.locator('.result-list li').count(), 8);
        const finished = await readState(page);
        assert.equal(finished.screen, 'report');
        assert.equal(finished.records.length, 18 + affected.size);
        assert.equal(finished.accepted, false);
        assert.match(await page.locator('#diagnostic').innerText(), /Рекомендации относятся только к этим заданиям/);
        if (width === 320) {
          assert.equal(await page.locator('.result-list .status.observed').count(), 8);
          assert.equal(await page.locator('.result-list .status.focus').count(), 0);
          assert.match(await page.locator('.start-here a').getAttribute('href'), /course-simple-check\.html$/);
        } else {
          assert.equal(await page.locator('.result-list .status.focus').count(), 1, 'Only the confirmed subtraction difficulty is prioritised');
          assert.match(await page.locator('.start-here a').getAttribute('href'), /course-subtract\.html$/);
          assert.equal(await page.locator('.result-list .status.uncertain').count(), width === 390 ? 1 : 0, 'A corrected prefix followup does not become a confirmed gap');
        }
        await reloadExact(page);
        await layout(page, 'report-' + width);
        await screenshot(page, 'report-' + width);
        console.log('PASS: division diagnostic ' + width + 'px, ' + finished.records.length + ' real responses, saved-state reload and targeted route');
      } catch (error) {
        await screenshot(page, 'failure-' + width);
        throw error;
      } finally { await context.close(); }
    }
    assert.deepEqual(errors, [], 'No browser JavaScript exceptions');
    console.log('DIVISION_DIAGNOSTIC_BROWSER_OK: 320/390/1060px, arrows, canonical steps, no partial-answer leak, independent followups, resume, readable inputs and no overflow.');
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
