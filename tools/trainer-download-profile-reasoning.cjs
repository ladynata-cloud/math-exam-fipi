'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function logWork(page) {
  return page.evaluate(() => {
    const state = window.__logTrainer.getState();
    return state.work[state.taskId];
  });
}

async function checkLogStep(page, stage) {
  await page.locator('#check-step').click();
  const work = await logWork(page);
  assert.equal(work.stage, stage);
  assert.equal(work.accepted, true, await page.locator('#feedback').innerText());
  await page.locator('#continue-step').click();
}

async function solveLogSign(page, boundary) {
  await page.waitForFunction(() => window.__logTrainer);
  const task = await page.evaluate(() => window.LogInequalities.getTask('sign-1'));
  assert.equal(task.answerText.replace(/\s/g, ''), '(1;' + boundary + ']');
  assert.equal((await logWork(page)).stage, 0);
  await page.locator('#check-step').click();
  assert.equal((await logWork(page)).accepted, false);
  await page.locator('#hint-button').click();
  assert((await logWork(page)).helps > 0);
  for (const option of task.domainChoices.filter(option => option.correct)) {
    await page.locator('input[name="domain"][value="' + option.id + '"]').check();
  }
  await checkLogStep(page, 0);

  const transform = task.transformChoices.find(option => option.correct);
  await page.locator('input[name="transform"][value="' + transform.id + '"]').check();
  await checkLogStep(page, 1);

  const wrong = boundary === 6 ? '0; 1; 4' : '0; 1';
  await page.locator('#critical-input').fill(wrong);
  await page.reload();
  await page.waitForFunction(() => window.__logTrainer);
  assert.equal(await page.locator('#critical-input').inputValue(), wrong);
  await page.locator('#check-step').click();
  assert.equal((await logWork(page)).accepted, false, 'Wrong boundary must be rejected');
  assert.equal(await page.locator('#feedback').getAttribute('data-kind'), 'error');
  await page.locator('#critical-input').fill('0; 1; ' + boundary);
  await checkLogStep(page, 2);

  for (let index = 0; index < task.rationalSigns.length; index += 2) {
    if (task.domainCells[index]) {
      await page.locator('[data-sign="' + index + '"]').selectOption(String(task.rationalSigns[index]));
    }
  }
  await checkLogStep(page, 3);

  // Both variants select the open interval after 1 and its right endpoint.
  const correctCells = task.solutionCells.flatMap((chosen, index) => chosen ? [index] : []);
  assert.deepEqual(correctCells, [6, 7]);
  for (const index of correctCells) await page.locator('[data-cell="' + index + '"]').click();
  await checkLogStep(page, 4);
  assert((await logWork(page)).complete);
  assert.equal(await page.locator('#completion-answer').innerText(), 'Ответ: ' + task.answerText);
}

async function finishGuidedLesson(page, apiName, stepsCount, wrongChoice, reportAnswer) {
  const readState = () => page.evaluate(name => window[name].getState(), apiName);
  const steps = await page.evaluate(name => window[name].steps, apiName);
  assert.equal(steps.length, stepsCount);
  await page.locator('#check').click();
  assert.equal((await readState()).feedback.kind, 'wrong');
  await page.locator('input[data-field="' + steps[0].fields[0].id + '"][data-choice="' + wrongChoice + '"]').check();
  await page.locator('#check').click();
  assert.equal((await readState()).feedback.kind, 'wrong');
  await page.locator('#hint').click();
  assert((await readState()).helps.includes(0));
  for (const [index, step] of steps.entries()) {
    for (const field of step.fields) {
      if (field.kind === 'axis') {
        for (const token of field.correct) {
          await page.locator('[data-axis="' + field.id + '"][data-token="' + token + '"]').press('Enter');
        }
      } else if (field.kind === 'number') {
        await page.locator('input[data-field="' + field.id + '"]').fill(field.correct);
      } else {
        for (const choice of Array.isArray(field.correct) ? field.correct : [field.correct]) {
          await page.locator('input[data-field="' + field.id + '"][data-choice="' + choice + '"]').check();
        }
      }
    }
    await page.locator('#check').click();
    assert.equal((await readState()).feedback.kind, 'good', step.title);
    await page.locator('#next').click();
    if (index === 0) {
      await page.reload();
      assert.equal((await readState()).step, 1, 'The accepted first step must survive reload');
    }
  }
  assert.equal((await readState()).solved.length, stepsCount);
  assert(await page.locator('#completion').isVisible());
  assert(await page.locator('#final-answer math').isVisible());
  assert.equal(await page.evaluate(() => window.MathExamGuidedLesson.reportAnswer), reportAnswer);
}

async function practiceMethods(page) {
  assert.equal(await page.locator('main .eyebrow').first().innerText(), 'ЕГЭ · профиль №19 и база №21');
  const submit = () => page.locator('#practice-form button[type=submit]').click();
  await page.evaluate(() => { location.hash = '#practice/divisibility'; });
  await page.locator('#practice-form').waitFor();
  await submit();
  await page.getByText('Заполни все поля ответа.', { exact: true }).waitFor();
  await page.locator('#answer-0').fill('18; 42');
  await submit();
  await page.waitForFunction(() => {
    const message = document.getElementById('practice-feedback');
    return message?.textContent && message.textContent !== 'Заполни все поля ответа.';
  });
  assert.equal(await page.locator('#practice-complete').count(), 0);
  await page.locator('#answer-0').fill('18; 48');
  await submit();
  await page.locator('#practice-complete').waitFor();

  await page.evaluate(() => { location.hash = '#practice/maximum'; });
  const draft = page.locator('#proof-draft');
  await draft.waitFor();
  await page.locator('#answer-0').fill('11');
  await page.locator('#answer-1').fill('4; 5; 11');
  const explanation = 'Два разных количества дают минимум 4 + 5. Значит, максимум 11.';
  await draft.fill(explanation);
  await submit();
  await page.locator('#practice-complete').waitFor();
  await page.reload();
  await page.locator('#practice-complete').waitFor();
  assert.equal(await draft.inputValue(), explanation);
  await page.getByRole('button', { name: 'Показать разбор' }).click();
  assert.match(await page.locator('#sample').innerText(), /4 \+ 5 = 9/);
}

async function checkEditedLog(browser, entry, target) {
  const source = fs.readFileSync(path.join(target, entry.slug + '.html'), 'utf8');
  const original = 'b=[6,8,10,12][v],t=h?';
  assert.equal(source.split(original).length, 2, 'The GIF points to exactly one editable parameter');
  const copy = path.join(target, entry.slug + '-my.html');
  fs.writeFileSync(copy, source.replace(original, 'b=[8,8,10,12][v],t=h?'));
  const context = await browser.newContext({ offline: true, viewport: { width: 320, height: 900 } });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const issues = [];
    page.on('pageerror', error => issues.push(error.message));
    page.on('request', request => { if (/^(https?|wss?):/.test(request.url())) issues.push(request.url()); });
    page.on('requestfailed', request => issues.push(request.url()));
    page.on('console', event => { if (event.type() === 'error') issues.push(event.text()); });
    await page.goto(pathToFileURL(copy).href);
    await solveLogSign(page, 6);
    assert.deepEqual(issues, [], 'Edited logarithmic practice runs without network or script errors');
  } finally {
    await context.close();
  }
}

const scenarios = {
  'ege-profil-log-inequalities': page => solveLogSign(page, 4),
  'ege-profil-log-variable-base': page => finishGuidedLesson(page, '__logExample', 18, 'arg', '(−4; −3) ∪ (−1; 3)'),
  'ege-profil-log-nested': page => finishGuidedLesson(page, '__nestedLogExample', 26, 'whole', '(1; (1+√5)/2)'),
  'ege-profil-estimate-example': practiceMethods
};

module.exports = { scenarios, checkEditedLog };
