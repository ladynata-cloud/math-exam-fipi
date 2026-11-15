'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function openDigitTask(page) {
  await page.getByRole('tab', { name: 'Задачи' }).click();
  await page.locator('#taskList button').filter({ hasText: 'Число минус сумма его цифр' }).click();
  return page.locator('#tPoints .point');
}

async function equalGroupExamples(page) {
  await page.getByRole('tab', { name: 'Дриллы и зачёт' }).click();
  const examples = await page.evaluate(() => {
    const originalRandom = Math.random;
    try {
      const result = [];
      for (let n = 6; n <= 14; n++) {
        const total = n * (n + 1) / 2;
        const possibilities = Array.from({ length: n - 1 }, (_, i) => i + 2)
          .filter(k => total % k === 0 && total / k >= n);
        possibilities.forEach((k, i) => {
          const values = [(n - 6 + 0.5) / 9, 0, (i + 0.5) / possibilities.length];
          Math.random = () => values.shift();
          const drill = N19.GENS.groups();
          result.push({ n, k, chosen: drill.p, answer: drill.answer, solution: drill.sol });
        });
      }
      const sample = [0.7, 0.1, 0.45];
      Math.random = () => sample.shift();
      const chip = [...document.querySelectorAll('#drillChips button')]
        .find(button => button.textContent === 'Группы равной суммы');
      chip.click();
      return result;
    } finally {
      Math.random = originalRandom;
    }
  });
  assert(examples.length > 10);
  for (const { n, k, chosen, answer, solution } of examples) {
    assert.deepEqual(chosen, { n, k });
    assert.equal(answer, true);
    const groups = [...solution.matchAll(/\(([0-9 +]+)\)/g)].map(match => match[1].split(' + ').map(Number));
    assert.equal(groups.length, k);
    for (const group of groups) {
      assert.equal(group.reduce((sum, member) => sum + member, 0), n * (n + 1) / (2 * k));
    }
    assert.deepEqual(groups.flat().sort((a, b) => a - b), Array.from({ length: n }, (_, i) => i + 1));
  }
  assert.match(await page.locator('#dText').innerText(), /12 разбить на 3/);
  await page.locator('#dNo').click();
  assert(await page.locator('#dFb.bad').isVisible());
  await page.locator('#dSol').click();
  assert.match(await page.locator('#dFb').innerText(), /26.*Подходящее разбиение/);
  await page.locator('#dYes').click();
  assert(await page.locator('#dFb.ok').isVisible());
}

async function divisibility(page, { limit = 2025, example = 2030, maximum = 2039 } = {}) {
  assert(await page.getByRole('heading', { name: 'Как обосновать ответ' }).isVisible());
  const points = await openDigitTask(page);
  const [first, reason, last] = [points.nth(0), points.nth(1), points.nth(2)];
  const exampleInput = first.getByRole('textbox', { name: 'Ответ' });
  const firstCheck = first.getByRole('button', { name: 'Проверить' });
  assert.match(await first.locator('h3').innerText(), new RegExp(String(limit)));
  await firstCheck.click();
  assert(await first.locator('.feedback.bad').isVisible());
  await exampleInput.fill(String(example === 2030 ? 2050 : 2030));
  await firstCheck.click();
  assert(await first.locator('.feedback.bad').isVisible());
  await exampleInput.fill(String(example));
  await exampleInput.press('Enter');
  assert(await first.locator('.feedback.ok').isVisible());

  await reason.getByRole('button', { name: 'Да', exact: true }).click();
  assert(await reason.locator('.feedback.bad').isVisible());
  await reason.getByRole('button', { name: 'Нет', exact: true }).click();
  assert(!(await reason.evaluate(node => node.classList.contains('solved'))));
  const goodReason = reason.getByRole('button', { name: new RegExp(String(limit + 1) + ' на 9 не делится') });
  await goodReason.click();
  assert(await reason.locator('.feedback.ok').isVisible());

  await last.getByRole('button', { name: 'Следующий шаг разбора' }).click();
  assert.match(await last.locator('.step.on').innerText(), /10q − S\(q\) ≥ 9q/);
  const maximumInput = last.getByRole('textbox', { name: 'Ответ' });
  await maximumInput.fill(String(maximum - 1));
  await maximumInput.press('Enter');
  assert(await last.locator('.feedback.bad').isVisible());
  await maximumInput.fill(String(maximum));
  await maximumInput.press('Enter');
  assert(await last.locator('.feedback.ok').isVisible());
  await last.getByRole('button', { name: 'Разбор целиком' }).click();
  assert.match(await last.locator('.steps').innerText(), /число четырёхзначное/);
  assert.equal(await last.locator('.answerline').innerText(), 'Ответ: ' + maximum + '.');
  await page.reload();
  await openDigitTask(page);
  assert.equal(await page.locator('#tPoints .point.solved').count(), 3);
  await equalGroupExamples(page);
}

async function sections(page) {
  assert.deepEqual(await page.evaluate(() => [COURSE.lessons.length, COURSE.learningPath.length]), [186, 26]);
  assert.equal(await page.locator('[data-path-stage]').count(), 26);
  await page.getByRole('button', { name: 'Начать с первой грани', exact: true }).click();
  assert.equal(await page.locator('#lesson-title').innerText(), 'Находим одну грань');
  await page.evaluate(() => { location.hash = '#starter-18'; });
  await page.getByRole('heading', { name: 'Наклонный срез: правило то же' }).waitFor();
  await page.locator('[data-action="start-practice"]').click();
  await page.locator('[data-plane-choice="CGHD"]').click();
  assert.equal(await page.locator('[data-action="construct"]').count(), 0);
  await page.locator('.step-hint > summary').click();
  assert.match(await page.locator('.step-hint').innerText(), /оба ребра/);
  await page.locator('[data-plane-choice="AEFB"]').click();
  await page.locator('[data-action="construct"]').click();
  assert.equal(await page.locator('[data-history-step]').count(), 1);
  await page.locator('[data-action="next-step"]').click();
  await page.locator('[data-plane-choice="BFGC"]').click();
  await page.locator('[data-action="construct"]').click();
  assert.equal(await page.locator('[data-history-step]').count(), 2);

  await page.locator('.starter-draft > summary').click();
  // The native details toggle is dispatched after the click has completed.
  await page.waitForFunction(() => window.SECTIONS_APP.getState().tasks['starter-18'].draftOpen);
  const explanation = 'Точки M и N лежат в грани AEFB, поэтому MN — сторона сечения.';
  await page.locator('#proof-draft').fill(explanation);
  const model = page.locator('.course-main .model-svg');
  const beforeRotation = await model.innerHTML();
  await model.press('ArrowRight');
  await page.waitForFunction(before => document.querySelector('.course-main .model-svg').innerHTML !== before, beforeRotation);
  const readWork = () => page.evaluate(() => window.SECTIONS_APP.getState().tasks['starter-18']);
  const saved = await readWork();
  assert.equal(saved.mistakes, 1);
  assert.equal(saved.independentSteps, 0, 'The hint changes mastery credit');
  await page.reload();
  await page.locator('#lesson-title').waitFor();
  assert.deepEqual(await readWork(), saved);
  assert.equal(await page.locator('#proof-draft').inputValue(), explanation);
}

async function checkEditedDivisibility(browser, entry, target) {
  const html = fs.readFileSync(path.join(target, entry.slug + '.html'), 'utf8');
  const start = html.indexOf('    { id:"p1", tag:');
  const end = html.indexOf('    { id:"p2", tag:', start);
  assert(start >= 0 && end > start);
  const predicate = 'v - digitSum(v) === 2025';
  assert.equal(html.split(predicate).length, 2);
  const changed = html.slice(start, end)
    .replaceAll('2025', '2043').replaceAll('2026', '2044')
    .replaceAll('2030', '2050').replaceAll('2031', '2051').replaceAll('2039', '2059')
    .replace('2 + 0 + 3 + 0 = 5, и 2050 − 5', '2 + 0 + 5 + 0 = 7, и 2050 − 7')
    .replace('q ≤ 225 и N ≤ 2259', 'q ≤ 227 и N ≤ 2279')
    .replace('N ≤ 2061', 'N ≤ 2079').replace('откуда x = 3', 'откуда x = 5')
    .replace('2059 − 14', '2059 − 16');
  const copy = path.join(target, entry.slug + '-my.html');
  fs.writeFileSync(copy, (html.slice(0, start) + changed + html.slice(end)).replace(predicate, 'v - digitSum(v) === 2043'));
  const context = await browser.newContext({ offline: true, viewport: { width: 320, height: 900 } });
  try {
    const page = await context.newPage();
    const issues = [];
    page.on('pageerror', error => issues.push(error.message));
    page.on('request', request => { if (/^(https?|wss?):/.test(request.url())) issues.push(request.url()); });
    page.on('requestfailed', request => issues.push(request.url()));
    await page.goto(pathToFileURL(copy).href);
    await divisibility(page, { limit: 2043, example: 2050, maximum: 2059 });
    assert.deepEqual(issues, [], 'Edited numbers trial must work without the site');
  } finally {
    await context.close();
  }
}

const scenarios = {
  'ege-profil-divisibility': page => divisibility(page),
  'ege-profil-sections-from-zero': sections,
};

module.exports = { scenarios, checkEditedDivisibility };
