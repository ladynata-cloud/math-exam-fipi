'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function methodsAtlas(page) {
  const atlasLink = page.locator('.az-catalog a').filter({ hasText: 'Функции и графики для задач с параметром' });
  assert.match(await atlasLink.getAttribute('href'), /^file:/);
  await atlasLink.click();
  await page.waitForURL(url => url.protocol === 'file:' && url.hash === '#/function-atlas');
  const atlas = page.locator('.az-atlas');
  await atlas.waitFor({ state: 'visible' });
  const levels = atlas.locator('select');
  const count = atlas.locator('.az-atlas-count');
  const reveal = atlas.locator('summary');
  assert.equal(await levels.locator('option').count(), 25);
  await levels.selectOption('hole');
  await reveal.click();
  assert.equal(await atlas.locator('.atlas-open').count(), 1);
  assert.match(await count.innerText(), /равно 0/);
  await levels.selectOption('plateau');
  assert.equal(await count.isVisible(), false);
  await reveal.click();
  assert.match(await count.innerText(), /бесконечно/);
  await atlas.locator('#az-atlas-level').fill('3');
  assert.equal(await count.isVisible(), false);
  await reveal.click();
  assert.match(await count.innerText(), /равно 2/);
  const courseLink = page.locator('.az-resources a').filter({ hasText: 'Функции и графики · №11' });
  assert.match(await courseLink.getAttribute('href'), /^https:\/\/mathexam\.space\//);

  await page.locator('.az-navigation a').first().click();
  await page.waitForURL(url => url.protocol === 'file:' && url.hash === '');
  await page.locator('.az-catalog a').filter({ hasText: 'Методы решения задач с параметром' }).click();
  await page.locator('.az-skill-list a[href$="/plane"]').click();
  await page.waitForURL(url => url.protocol === 'file:' && url.hash === '#/parameter-methods/plane');
  await page.locator('[data-parameter-plane] svg').waitFor({ state: 'visible' });
  assert.equal(await page.locator('[data-plane-slice] line').count(), 0);
  await page.locator('[data-plane-predict=yes]').click();
  assert(await page.locator('[data-plane-slice] line').count());
  const note = 'Проверяю границы сечения.';
  await page.locator('#az-note').fill(note);
  const submit = page.locator('#az-form [type=submit]');
  const answer = page.locator('#az-answer');
  const feedback = page.locator('#az-feedback');
  await submit.click();
  assert.match(await feedback.innerText(), /Введи ответ/);
  await answer.fill('[0; 2]');
  await submit.click();
  assert.match(await feedback.innerText(), /Пока не сходится/);
  await answer.fill('[0; 1]');
  await submit.click();
  await page.locator('[data-advance]').click();
  await answer.fill('(0; 2]');
  await page.reload();
  assert.equal(await page.locator('#az-note').inputValue(), note);
  assert.equal(await answer.inputValue(), '(0; 2]');
  await submit.click();
  assert(await page.locator('[data-advance]').isVisible());

  for (const [key, value] of [['exam', '19'], ['fipi', '2027/18']]) {
    const url = new URL(page.url());
    url.search = '';
    url.searchParams.set(key, value);
    url.hash = '';
    await page.goto(url.href);
    await page.locator('#alphabet-main h1').waitFor();
    assert.match(await page.locator('#alphabet-main h1').innerText(), /Основы для №\s*18/);
    const methods = page.locator('.az-catalog a').filter({ hasText: 'Методы решения задач с параметром' });
    const href = new URL(await methods.getAttribute('href'));
    assert.equal(href.protocol, 'file:');
    assert.equal(href.searchParams.get(key), value, 'the local link preserves the original route namespace');
    await methods.click();
    const back = page.locator('.az-navigation a').filter({ hasText: 'Вернуться: № 18' });
    assert.equal(await back.getAttribute('href'), 'https://mathexam.space/ege-profil/part-two/#fipi/2027/18');
    await page.locator('.az-skill-list a[href$="/plane"]').click();
    assert.equal(await page.locator('#az-note').inputValue(), note);
    assert.equal(await answer.inputValue(), '(0; 2]', 'the saved answer survives legacy and official context links');
  }
}

function penaltyLedger(februaryDays) {
  // Use integer tenths of thousands of rubles for the independent check.
  const principal = 1000;
  let debt = principal;
  let total = 0;
  [700, 500, 300, 200, 100, 0].forEach((after, month) => {
    const payment = debt * 11 - after * 10;
    const lateDays = month === 0 ? februaryDays : month === 3 ? 9 : 0;
    total += payment + payment * lateDays * 3 / 100;
    debt = after;
  });
  assert.equal(debt, 0);
  return (total - principal * 10) / 10;
}

async function finance(page, { days = 5 } = {}) {
  const chooser = page.locator('#taskChooser');
  await chooser.locator('summary').click();
  await chooser.getByRole('button', { name: /Пени за задержку/ }).click();
  assert.match(await page.locator('body').innerText(), new RegExp('просрочка ' + days + ' дн'));
  const before = await page.evaluate(() => STATE.finalAnswerAttempts);
  const check = page.locator('.final-answer-row').getByRole('button', { name: 'Проверить', exact: true });
  const feedback = page.locator('.final-box > .feedback');
  const input = page.locator('#finalAnswerInput');
  await check.click();
  assert.equal(await feedback.count(), 0);
  assert.equal(await page.evaluate(() => STATE.finalAnswerAttempts), before);
  const answer = penaltyLedger(days);
  await input.fill(String(penaltyLedger(days === 5 ? 4 : 5)).replace('.', ','));
  await check.click();
  assert.match(await feedback.innerText(), /Не сходится/);
  for (const submission of ['1 0', '1/0']) {
    await input.fill(submission);
    await check.click();
    assert.match(await feedback.innerText(), /Не сходится/);
  }
  await input.fill(String(answer).replace('.', ','));
  await check.click();
  assert.match(await feedback.innerText(), /Правильно!.*самостоятельно/);
  assert.equal(await page.evaluate(() => getStats().independentTasks.I1), true);
  assert.equal(await page.evaluate(() => getTask('I1').steps[1].answer), 12 * days);
  const solution = page.locator('.final-box summary').filter({ hasText: /^Итоговое уравнение и разбор$/ });
  await solution.click();
  assert((await solution.locator('xpath=..').innerText()).includes(String(answer).replace('.', ',') + ' тыс'));
}

async function trigonometry(page) {
  await page.getByRole('tab', { name: /Окружность/ }).click();
  const circle = page.locator('#ucSvg');
  assert(await circle.isVisible());
  await page.locator('#ucChips').getByRole('button', { name: 'π/2', exact: true }).click();
  assert.equal(Number(await page.locator('#ucOutX').innerText()), 0);
  assert.equal(Number(await page.locator('#ucOutY').innerText()), 1);
  await page.locator('#ucDeg').click();
  assert.match(await page.locator('#ucOutT').innerText(), /90°/);
  await page.getByRole('tab', { name: /Тренажёр/ }).click();
  await page.evaluate(() => { Math.random = () => 0.01; });
  await page.locator('#qFilter [data-f="8"]').click();
  assert.match(await page.locator('#qText').innerText(), /Чему равен синус/);
  const score = page.locator('#qRight');
  assert.equal(await score.innerText(), '0');
  const options = page.locator('#qAnswers');
  await options.getByRole('button', { name: 'прилежащий / гипотенуза', exact: true }).click();
  assert.equal(await options.locator('.correct').count(), 0);
  assert.match(await page.locator('#qFeedback').innerText(), /Пока неверно/);
  await page.locator('#qSolution').click();
  assert.match(await page.locator('#qFeedback').innerText(), /Синус = противолежащий катет/);
  await page.locator('#qNext').click();
  await options.getByRole('button', { name: 'противолежащий / гипотенуза', exact: true }).click();
  assert.equal(await score.innerText(), '1');
}

async function planimetry(page) {
  await page.locator('.topic-picker > summary').click();
  await page.locator('[data-group=par]').click();
  await page.locator('[data-type=t18]').click();
  const card = page.locator('#taskArea');
  const diagram = card.locator('svg');
  assert(await diagram.isVisible());
  assert.equal(await diagram.locator('.sg2').count(), 2);
  const text = await card.locator('.q').first().innerText();
  const [area, diagonalOrRatio] = text.match(/\d+(?:,\d+)?/g).map(value => Number(value.replace(',', '.')));
  const answer = text.includes('раз больше') ? Math.sqrt(2 * area / diagonalOrRatio) : 2 * area / diagonalOrRatio;
  assert(Number.isFinite(answer));
  const input = card.locator('input.num');
  const submit = card.locator('[data-action=check]');
  await submit.click();
  assert.match(await card.locator('.fb.hint').innerText(), /Введите число/);
  await input.fill(String(answer + 1));
  await submit.click();
  assert(await card.locator('.fb.bad').isVisible());
  await card.locator('[data-action=steps]').click();
  assert.match(await card.locator('.steps').innerText(), /[Дд]иагонал/);
  await input.fill(String(answer).replace('.', ','));
  await submit.click();
  assert(await card.locator('.ansline').filter({ hasText: /^Ответ:/ }).isVisible());
  assert(await card.locator('.fb.ok').isVisible());
  await card.locator('[data-action=new]').click();
  assert(await input.isVisible());
  await page.locator('[data-mode=exam]').click();
  await card.locator('[data-action=exam-start]').click();
  assert(await card.locator('[data-action=exam-check]').isVisible());
}

async function checkEditedFinance(browser, entry, folder) {
  const original = fs.readFileSync(path.join(folder, entry.slug + '.html'), 'utf8');
  const start = original.indexOf("  id: 'I1',");
  const end = original.indexOf('\n});', start);
  assert(start > 0 && end > start);
  // Apply the GIF example to one task in an actual local copy. Leave the
  // checking functions untouched so the accepted answer is verified end to end.
  let task = original.slice(start, end);
  const changes = [
    ['15-го</em> числа (просрочка 5', '14-го</em> числа (просрочка 4'],
    ['февраль 5 дн.', 'февраль 4 дн.'],
    ['400·5·0,03 = 60', '400·4·0,03 = 48'],
    ['просрочка 5 дней.', 'просрочка 4 дня.'],
    ['answer: 60,', 'answer: 48,'],
    ['400 · 5 · 0,03', '400 · 4 · 0,03'],
    ['0,03 = 60 тыс.', '0,03 = 48 тыс.'],
    ['60 + 35,1', '48 + 35,1'],
    ['95,1', '83,1'],
    ['1375,1', '1363,1'],
    ['375,1', '363,1'],
    ['375.1', '363.1']
  ];
  for (const [before, after] of changes) {
    assert(task.includes(before), before);
    task = task.replaceAll(before, after);
  }
  const file = path.join(folder, entry.slug + '-my.html');
  fs.writeFileSync(file, original.slice(0, start) + task + original.slice(end));
  const context = await browser.newContext({ offline: true, viewport: { width: 320, height: 900 } });
  try {
    const page = await context.newPage();
    const issues = [];
    page.on('pageerror', error => issues.push(error.message));
    page.on('requestfailed', request => issues.push(request.url()));
    page.on('request', request => { if (/^(https?|wss?):/.test(request.url())) issues.push(request.url()); });
    await page.goto(pathToFileURL(file).href);
    await finance(page, { days: 4 });
    assert.match(await page.evaluate(() => getTask('I1').table.rows[0][4]), /400·4·0,03 = 48/);
    assert.deepEqual(issues, []);
  } finally {
    await context.close();
  }
}

module.exports = {
  scenarios: {
    'ege-profil-methods-atlas': methodsAtlas,
    'ege-profil-finance': finance,
    'ege-profil-trigonometry': trigonometry,
    'ege-profil-planimetry-yashchenko': planimetry,
  },
  checkEditedFinance,
};
