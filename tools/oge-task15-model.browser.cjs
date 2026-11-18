'use strict';
const assert = require('node:assert/strict');

module.exports = async function checkTriangleHelp(page) {
  const lab = page.locator('#oge-video-models');
  const panel = page.locator('[data-triangle-model]');
  const figure = page.locator('#main .diagram svg');
  const nativeAnswer = page.locator('#ans');
  const errors = [];
  const observeError = err => errors.push(err.message);
  page.on('pageerror', observeError);
  try {
    for (const [opposite, adjacent, hypotenuse] of [[3,4,5], [24,7,25]]) {
      await page.evaluate(([p,r,q]) => window.__oge15.trainWith('rtTrig', {fn:'id', p,r,q, k:1, g:''}), [opposite,adjacent,hypotenuse]);
      assert(!(await lab.isVisible()), 'median and height do not appear for a sine problem');
      const original = await figure.innerHTML();
      assert.equal(await page.evaluate(() => !!window.__oge15.debug().tr.hinted), false);
      await panel.locator('summary').click();
      await panel.getByRole('button', {name:'AB',exact:true}).click();
      assert.match(await panel.innerText(), /гипотенуза/);
      assert.equal(await figure.locator('[data-model-side]').getAttribute('data-model-side'), 'AB');
      assert.equal(await panel.locator('input').count(), 0);
      await panel.getByRole('button', {name:'BC',exact:true}).click();
      assert.equal(await figure.locator('[data-of="B-C"]').textContent(), String(opposite));
      assert.equal(await figure.locator('[data-of="A-B"]').textContent(), String(hypotenuse));
      assert.equal(await figure.locator('[data-of="A-C"]').textContent(), '?');
      const field = panel.getByRole('textbox');
      await field.fill(String(adjacent * adjacent)); await field.press('Enter');
      assert.match(await panel.innerText(), /положительный квадратный корень/);
      await field.fill(String(adjacent)); await field.press('Enter');
      assert.equal(await figure.locator('[data-of="A-C"]').textContent(), String(adjacent));
      await panel.getByRole('button', {name:'Ввести ответ в задаче'}).click();
      assert(await nativeAnswer.evaluate(n => n === document.activeElement));
      assert.equal(await nativeAnswer.inputValue(), '', 'helper leaves the final answer for the student');
      await panel.locator('summary').click();
      await page.waitForFunction(() => !document.querySelector('#main [data-model-side]'));
      assert.equal(await figure.innerHTML(), original);
      await nativeAnswer.fill(String(adjacent/hypotenuse).replace('.', ','));
      await page.waitForFunction(() => performance.now() - window.__oge15.debug().tr.t0 >= 400);
      await nativeAnswer.press('Enter');
      assert.match(await page.locator('#fb').innerText(), /Верно.*с подсказкой/);
    }
    await page.evaluate(() => window.__oge15.trainWith('rtLegCos', window.__oge15.SUBS.rtLegCos.proto));
    await panel.locator('summary').click();
    await panel.getByRole('button', {name:'AC',exact:true}).click();
    assert.match(await panel.innerText(), /cos A = AC \/ AB/);
    await page.locator('[data-tab="quiz"]').click();
    assert(!(await lab.isVisible()) && !(await panel.isVisible()), 'quiz must not expose practice help');
    await page.locator('[data-tab="train"]').click();
    assert.match(await panel.innerText(), /cos A = AC \/ AB/, 'the same practice diagram and help survive a tab change');
    await page.evaluate(() => window.__oge15.trainWith('angSum', window.__oge15.SUBS.angSum.proto));
    assert(!(await lab.isVisible()) && !(await panel.isVisible()), 'no unrelated inquiry on a triangle-angle task');
    await page.evaluate(() => window.__oge15.trainWith('areaBH', window.__oge15.SUBS.areaBH.proto));
    assert(await lab.isVisible(), 'area and height retain the independent inquiry');
    assert.deepEqual(errors, []);
  } finally { page.off('pageerror', observeError); }
};
