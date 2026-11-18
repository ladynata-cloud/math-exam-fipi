'use strict';

const assert = require('node:assert/strict');

async function gradeNumber(scope, { input, check, feedback, correct, wrong = '987654321', accepted = /верно/i }) {
  const field = scope.locator(input);
  const button = scope.locator(check);
  const result = scope.locator(feedback);
  const locked = () => field.evaluate(node => node.disabled || node.readOnly);
  await button.click();
  assert(!(await locked()), 'empty answer was accepted');
  assert((await result.innerText()).trim(), 'empty answer has no feedback');
  await field.fill(wrong);
  await button.click();
  assert(!(await locked()), 'wrong answer was accepted');
  assert((await result.innerText()).trim(), 'wrong answer has no feedback');
  await field.fill(String(correct));
  await button.click();
  assert(await locked(), 'correct answer was rejected');
  assert.match(await result.innerText(), accepted);
}

async function graphic(locator) {
  await locator.waitFor({ state: 'visible' });
  assert(await locator.evaluate(svg => svg.viewBox.baseVal.width > 0 && svg.childElementCount > 0));
}

async function geometryFigure(page) {
  await graphic(page.locator('#main .ocg-primary-figure svg').first());
}

async function openReference(page, selector, loadImage) {
  const reference = page.locator(selector);
  await reference.locator(':scope > summary').click();
  await loadImage(reference.locator(':scope > figure img').first());
  const full = reference.locator('.ocr-full-sheet').first();
  await full.locator(':scope > summary').click();
  await loadImage(full.locator('img'));
  for (const src of await reference.locator('img').evaluateAll(images => images.map(image => image.src))) {
    assert.match(src, /^data:image\/png/);
  }
}

module.exports = {
  async 'oge-task7-number-line'(page) {
    const key = await page.evaluate(() => BANK[marIdx].key - 1);
    const card = page.locator('#marTask');
    const choices = card.locator('.optbtn');
    assert.equal(await card.locator('.msg').innerText(), '');
    await choices.nth((key + 1) % 4).click();
    assert(await card.locator('.msg.bad').isVisible());
    await card.getByRole('button', { name: 'Хочешь подсказку?' }).click();
    await card.getByText('Как читать точки на прямой?', { exact: true }).click();
    await graphic(card.locator('.oca-exploration svg'));
    await card.getByRole('button', { name: 'Вернуться к заданию' }).click();
    await choices.nth(key).click();
    assert.match(await card.locator('.msg.good').innerText(), /верно/i);
    await card.getByRole('button', { name: 'Следующая →' }).click();
    assert.equal(await card.locator('.msg').innerText(), '');
  },
  async 'oge-task8-powers-roots'(page, loadImage) {
    const card = page.locator('#marGrid > .mtask:not([hidden])').first();
    const id = (await card.locator('.mid span').textContent()).split(' · ')[0].replace('№ ', '');
    const answer = await page.evaluate(id => BANK.find(task => task.id === id).ans.join('/'), id);
    await card.getByRole('button', { name: 'Хочешь подсказку?' }).click();
    const sheet = card.locator('.ocr-sheet');
    await sheet.locator(':scope > summary').click();
    const sheets = await sheet.locator('.ocr-full-sheet').all();
    assert.equal(sheets.length, 2);
    for (const full of sheets) {
      await full.locator('summary').click();
      await loadImage(full.locator('img'));
    }
    await gradeNumber(card, { input: ':scope > .mrow .ans', check: ':scope > .mrow .ck',
      feedback: ':scope > .mrow .fb', correct: answer });
  },
  async 'oge-task10-probability'(page) {
    await page.evaluate(() => marNew(attach(genTask('10.1', { of: () => 10, ri: () => 3 }))));
    const prefix = '#mar-root ';
    const check = page.locator(prefix + '[id$="-ck"]');
    const feedback = page.locator(prefix + '[id$="-fb"]');
    await check.click();
    assert.match(await feedback.innerText(), /Введи ответ/);
    await page.locator(prefix + '.aw-dec').fill('0,7');
    await check.click();
    assert(await feedback.evaluate(node => node.classList.contains('no')));
    await page.locator(prefix + '[id$="-tofrac"]').click();
    await page.locator(prefix + '.aw-n').fill('3');
    await page.locator(prefix + '.aw-d').fill('0');
    await check.click();
    assert(await check.isEnabled(), 'denominator zero was accepted');
    await page.locator(prefix + '.aw-d').fill('10');
    await check.click();
    assert.match(await feedback.innerText(), /Верно!/);
    await page.locator(prefix + '[id$="-next"]').click();
    assert.equal(await page.locator(prefix + '.aw-dec').inputValue(), '');
  },
  async 'oge-task12-formulas-trainer'(page) {
    const answer = await page.evaluate(() => {
      cur = GENS[0].make();
      A = newState();
      renderTask();
      return cur.subst.vals[0] * cur.subst.vals[1];
    });
    await page.getByRole('button', { name: 'Хочешь подсказку?' }).click();
    assert(await page.locator('.minimal-step-current').isVisible());
    await gradeNumber(page, { input: '#ansIn', check: '#checkBtn', feedback: '#fb', correct: answer, accepted: /Верно!/ });
    await page.locator('#nextBtn').click();
    assert.equal(await page.locator('#ansIn').inputValue(), '');
  },
  async 'oge-task15-triangles'(page) {
    await require('./oge-task15-model.browser.cjs')(page);
    const task = await page.evaluate(() => ({ answer: tr.t.ans, steps: tr.t.steps.length }));
    await graphic(page.locator('#main .diagram svg'));
    const model = page.locator('#oge-video-models');
    await model.locator(':scope > summary').click();
    assert(await model.locator('[data-ovm-picker]').isVisible());
    await page.waitForFunction(() => performance.now() - tr.t0 >= 400);
    await gradeNumber(page, { input: '#ans', check: '#check', feedback: '#fb', correct: task.answer, accepted: /Верно!/ });
    await page.waitForFunction(() => performance.now() - tr.doneAt >= 400);
    await page.locator('#next').click();
    assert(task.steps > 0);
    assert.equal(await page.locator('#ans').inputValue(), '');
  },
  async 'oge-task16-circle'(page) {
    const result = await page.evaluate(() => {
      trTask = buildArchive(ARCHIVE.find(task => task.nums.includes('311956')));
      trAtt = 0;
      trDone = false;
      trMissed = false;
      renderTrain();
      return { central: trTask.p.c, inscribed: trTask.ans };
    });
    assert.deepEqual(result, { central: 48, inscribed: 24 });
    await geometryFigure(page);
    await page.locator('#courseHintToggle').click();
    await page.locator('#hintBtn').click();
    assert.equal(await page.locator('#task16Steps .step').count(), 1);
    await page.getByRole('button', { name: 'Вернуться к моему ответу' }).click();
    await gradeNumber(page, { input: '#ans', check: '#check', feedback: '#fb', correct: 24, wrong: '48', accepted: /Верно!/ });
    await page.locator('#next').click();
    assert.equal(await page.locator('#courseHintPanel').isVisible(), false);
  },
  async 'oge-task17-quadrilaterals'(page, loadImage) {
    const setRhombus = (d1, d2) => page.evaluate(({ d1, d2 }) => {
      CUR = build('rhombAreaDiag', { d1, d2 }, { gen: true, srcLab: 'Авторский пример' });
      renderTrain(false);
      return CUR.ans;
    }, { d1, d2 });
    assert.equal(await setRhombus(14, 6), 42);
    const figure = page.locator('#main .ocg-primary-figure svg').first();
    await graphic(figure);
    const original = await figure.innerHTML();
    assert.equal(await setRhombus(12, 8), 48);
    await graphic(figure);
    assert.notEqual(await figure.innerHTML(), original, 'changing diagonals did not update the drawing');
    assert.match(await page.locator('#tzone .task').innerText(), /12\s+и\s+8/);
    await gradeNumber(page, { input: '#ans', check: '#chk', feedback: '#fb', correct: 48, wrong: '42', accepted: /Верно!/ });
    await page.locator('#nxt').click();
    assert.equal(await page.locator('#courseHintPanel').isVisible(), false);

    assert.equal(await setRhombus(12, 8), 48);
    await page.locator('#courseHintToggle').click();
    await page.locator('#stepH').click();
    assert.match(await page.locator('#ssol').innerText(), /48/);
    await openReference(page, '#courseHintPanel .ocr-sheet', loadImage);
    await page.getByRole('button', { name: 'Вернуться к моему ответу' }).click();
    assert(await page.locator('#chk').isDisabled(), 'showing the only worked step completes the assisted example');
  },
  async 'oge-task18-grid'(page) {
    const answer = await page.evaluate(() => {
      TR.task = archTask(ARCHIVE.find(task => task.id === 89));
      TR.done = false;
      TR.shown = false;
      drawTrain();
      return TR.task.ans;
    });
    assert.equal(answer, 1.5);
    await geometryFigure(page);
    if ((await page.viewportSize()).width < 440) {
      const right = page.locator('#main [data-geometry-pan="right"]:visible').first();
      await right.click();
      assert(await page.locator('#main .ocg-primary-figure').first().evaluate(node => node.scrollLeft > 0));
    }
    const input = page.locator('#ansIn');
    await input.fill('1,5');
    await page.locator('#courseHintToggle').click();
    await page.locator('#hintBtn').click();
    await page.locator('#hintBtn').click();
    assert.equal(await page.locator('#task18Steps .step').count(), 2);
    assert.equal(await input.inputValue(), '1,5');
    await page.getByRole('button', { name: 'Вернуться к моему ответу' }).click();
    await input.clear();
    await gradeNumber(page, { input: '#ansIn', check: '#chkBtn', feedback: '#fb', correct: '1,5', wrong: '15', accepted: /Верно!/ });
    await page.locator('#nextBtn').click();
    assert.equal(await page.locator('#courseHintPanel').isVisible(), false);
  },
};
