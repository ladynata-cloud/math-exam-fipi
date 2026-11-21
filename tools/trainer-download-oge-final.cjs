'use strict';

const assert = require('node:assert/strict');

// Select existing native generator examples deterministically. Only randomness
// is controlled; the displayed condition, figure and actual grader stay native.
async function nativeExample(page, values, action) {
  await page.evaluate(values => {
    const original = Math.random;
    let index = 0;
    window.__restoreDownloadRandom = () => {
      Math.random = original;
      delete window.__restoreDownloadRandom;
    };
    Math.random = () => index < values.length ? values[index++] : original();
  }, values);
  try { await action(); }
  finally { await page.evaluate(() => window.__restoreDownloadRandom()); }
}

async function graphic(locator) {
  await locator.waitFor({ state: 'visible' });
  assert(await locator.evaluate(svg => svg.viewBox.baseVal.width > 0 && svg.childElementCount > 0));
}

async function gradeNumber(scope, { input, check, feedback, correct, wrong }) {
  const field = scope.locator(input), button = scope.locator(check), result = scope.locator(feedback);
  await button.click();
  assert(await field.isEnabled(), 'empty answer was accepted');
  assert((await result.innerText()).trim(), 'empty answer has no explanation');
  await field.fill(String(wrong));
  await button.click();
  assert(await field.isEnabled(), 'wrong answer was accepted');
  assert((await result.innerText()).trim(), 'wrong answer has no explanation');
  await field.fill(String(correct));
  await button.click();
  assert(await field.isDisabled(), 'correct answer was rejected');
  assert.match(await result.innerText(), /верно/i);
}

async function openSheet(scope, loadImage) {
  const sheet = scope.locator('.ocr-sheet').first();
  await sheet.locator(':scope > summary').click();
  const full = sheet.locator('.ocr-full-sheet').first();
  await full.locator(':scope > summary').click();
  const image = full.locator('img');
  await loadImage(image);
  assert.match(await image.getAttribute('src'), /^data:image\/png/);
}

async function algebraDraft(card, text) {
  // The enhancement scans native task changes on a queued timer. Wait for the
  // notebook to belong to this condition before typing into the new task.
  await card.page().waitForFunction(node => {
    const statement = node.querySelector('.prompt,.problem,.statement');
    const notebook = node.querySelector('.oca-work');
    return statement && notebook && notebook.dataset.problem === statement.innerHTML.replace(/\s+/g, ' ').trim();
  }, await card.elementHandle());
  const notebook = card.locator('.oca-work');
  await notebook.locator('textarea').fill(text);
  assert.match(await notebook.innerText(), /не оценивает правильность доказательства/);
  await notebook.locator('.oca-save-status').filter({ hasText: /сохранена/ }).waitFor();
  assert.match(await notebook.locator('.oca-save-status').innerText(), /сохранена/);
  assert.equal(await notebook.locator('textarea').inputValue(), text);
  return notebook.locator('textarea');
}

async function proofDraft(page, text) {
  const notebook = page.locator('.ocp-writing');
  await notebook.locator(':scope > summary').click();
  await notebook.locator('textarea').fill(text);
  assert.match(await notebook.innerText(), /Свободный текст можно обсудить с преподавателем/);
  await notebook.locator(':scope > summary').click();
  return notebook.locator('textarea');
}

module.exports = {
  async 'oge13-inequalities-series'(page, loadImage) {
    await page.locator('#settings > summary').click();
    await page.locator('#taskPicker').selectOption('quad:0');
    await page.locator('#settings > summary').click();
    assert.match(await page.locator('#taskText').innerText(), /x² − 49 < 0/);
    await page.locator('#check').click();
    assert.match(await page.locator('#msg').innerText(), /Сначала выбери ответ/);
    await page.locator('#chips button').first().click();
    await page.locator('#check').click();
    assert.match(await page.locator('#msg').innerText(), /Пока не сходится/);
    await page.locator('#hintToggle').click();
    const lab = page.locator('#task13LabHost [data-lab-kind="quad"]');
    await graphic(lab.locator('[data-lab-plot]'));
    const probe = lab.locator('[data-lab-action="probe"]');
    await probe.focus();
    await probe.press('Home');
    const before = await lab.getAttribute('data-probe-x');
    await probe.press('End');
    assert.notEqual(await lab.getAttribute('data-probe-x'), before, 'inequality model is not interactive offline');
    await openSheet(lab, loadImage);
    await page.locator('#hintReturn').click();
    assert.equal(await page.locator('#chips button').first().getAttribute('aria-pressed'), 'true', 'help lost the selected draft');
    await page.locator('#chips button').first().click();
    await page.locator('#chips button').nth(1).click();
    await page.locator('#check').click();
    assert.match(await page.locator('#msg').innerText(), /Верно/);
    assert(await page.locator('#check').isDisabled());
    await page.locator('#next').click();
    assert(await page.locator('#check').isEnabled());
    assert.equal(await page.locator('#chips [aria-pressed="true"]').count(), 0);
  },

  async 'oge-task20-equations'(page, loadImage) {
    await page.locator('#courseSettings > summary').click();
    // x² − x + sqrt(1−x) = sqrt(1−x) + 6: −2 is valid,
    // while the quadratic root 3 violates x ≤ 1.
    await nativeExample(page, [.15, .2, .6], () => page.locator('#picker .mcard').filter({ has: page.getByText('Уравнение с корнем', { exact: true }) }).click());
    await page.locator('#courseSettings > summary').click();
    const card = page.locator('#body .qbox');
    assert.match(await card.locator('.prompt').innerText(), /1\s*−\s*x/);
    const text = 'ОДЗ: x ≤ 1. После вычитания корней: x² − x − 6 = 0. Корень 3 не подходит.';
    const draft = await algebraDraft(card, text);
    const field = card.locator(':scope > div:not(.minimal-hint) .numin').first();
    await field.fill('3');
    await card.getByRole('button', { name: 'Хочешь подсказку?', exact: true }).click();
    assert.match(await card.locator('.minimal-help .sq').first().innerText(), /ОДЗ/);
    await openSheet(card.locator('.minimal-help'), loadImage);
    await card.getByRole('button', { name: 'Вернуться к заданию', exact: true }).click();
    assert.equal(await field.inputValue(), '3');
    assert.equal(await draft.inputValue(), text);
    await field.clear();
    await gradeNumber(card, { input: ':scope > div:not(.minimal-hint) .numin', check: ':scope > .btns .primary', feedback: ':scope > .fb', wrong: 3, correct: -2 });
    assert.equal(await draft.inputValue(), text);
    await card.getByRole('button', { name: 'Дальше →', exact: true }).click();
    assert.equal(await card.locator(':scope > div:not(.minimal-hint) .numin').inputValue(), '');
  },

  async 'oge-task21-word-problems'(page) {
    const card = page.locator('#content > .card');
    // Two cyclists: 10 and 24 km/h, first stops for 36 minutes,
    // distance 96 km. Meeting takes 3 h; second cyclist rides 72 km.
    await nativeExample(page, [.18, .5, .01, .3, .1], () => card.getByRole('button', { name: 'Другая задача →', exact: true }).click());
    assert.match(await card.locator('.problem').innerText(), /96 км/);
    assert.match(await card.locator('.problem').innerText(), /второй велосипедист/);
    const text = 'x — путь второго велосипедиста, км. (96−x)/10 + 36/60 = x/24. Ответ проверю в условии.';
    const draft = await algebraDraft(card, text);
    await card.getByRole('button', { name: 'Хочешь подсказку?', exact: true }).click();
    await graphic(card.locator('.minimal-help svg').first());
    const notice = card.locator('.minimal-help .oca-assisted-notice');
    await notice.waitFor({ state: 'visible' });
    assert.match(await notice.innerText(), /не считается самостоятельным/, 'shown movement model must identify assistance');
    await card.getByRole('button', { name: 'Вернуться к заданию', exact: true }).click();
    assert.equal(await draft.inputValue(), text);
    const answer = card.locator(':scope > div:not(.minimal-hint) .af').first();
    await gradeNumber(answer, { input: ':scope > span:first-child input', check: ':scope > .primary', feedback: '.fbk', wrong: 24, correct: 72 });
    assert.equal(await draft.inputValue(), text);
    await card.getByRole('button', { name: 'Следующая задача →', exact: true }).click();
    assert.equal(await card.locator(':scope > div:not(.minimal-hint) .af > span:first-child input').first().inputValue(), '');
  },

  async 'oge-task22-functions-graphs'(page, loadImage) {
    await page.locator('#courseSettings > summary').click();
    await page.locator('.mod-btn[data-mod="m3"]').click();
    await page.locator('#courseSettings > summary').click();
    const card = page.locator('.panel[data-mod="m3"] .mode-host[data-mode="marathon"]');
    const another = card.getByRole('button', { name: 'Другая задача →', exact: true });
    const graph = card.locator('.minimal-help svg.grapher').first();
    async function example(pickP) {
      await nativeExample(page, [.9, .9, .8, pickP], () => another.click());
      const data = await card.evaluate(host => ({ sub: host.__problem.sub, C: host.__problem.C, p: host.__problem.p, vals: host.__problem.vals.map(v => v.toString()) }));
      await card.getByRole('button', { name: 'Хочешь подсказку?', exact: true }).click();
      await graphic(graph);
      return data;
    }
    assert.deepEqual(await example(.45), { sub: 'shift_m', C: 3, p: -1, vals: ['3', '2'] });
    const oldHole = await graph.locator('.dot-open').evaluate(dot => [Number(dot.getAttribute('cx')), Number(dot.getAttribute('cy'))]);
    assert.deepEqual(await example(.35), { sub: 'shift_m', C: 3, p: -2, vals: ['3', '5/2'] });
    const geometry = await graph.evaluate(svg => {
      const vertical = [...svg.querySelectorAll('line.grid')].filter(line => line.getAttribute('x1') === line.getAttribute('x2')).map(line => Number(line.getAttribute('x1'))).sort((a,b) => a-b);
      const horizontal = [...svg.querySelectorAll('line.grid')].filter(line => line.getAttribute('y1') === line.getAttribute('y2')).map(line => Number(line.getAttribute('y1'))).sort((a,b) => a-b);
      const unit = values => Math.min(...values.slice(1).map((v,i) => v-values[i]).filter(v => v>0));
      const axes = [...svg.querySelectorAll('line.axis')];
      const vx = axes.find(line => line.getAttribute('x1') === line.getAttribute('x2'));
      const hy = axes.find(line => line.getAttribute('y1') === line.getAttribute('y2'));
      const hole = svg.querySelector('.dot-open'), ux = unit(vertical), uy = unit(horizontal);
      return { ux, uy, x: (Number(hole.getAttribute('cx'))-Number(vx.getAttribute('x1')))/ux, y: (Number(hy.getAttribute('y1'))-Number(hole.getAttribute('cy')))/uy, point: [Number(hole.getAttribute('cx')), Number(hole.getAttribute('cy'))] };
    });
    assert(Math.abs(geometry.ux-geometry.uy)<1e-7, 'graph axes must have the same scale');
    assert(Math.abs(geometry.x-2)<1e-7 && Math.abs(geometry.y-2.5)<1e-7, 'hole must be at (2; 2.5)');
    assert.notDeepEqual(geometry.point, oldHole, 'changing the excluded point did not update the drawing');
    const slider = card.getByRole('slider', { name: 'Положение прямой', exact: true });
    for (const [height, count] of [[2,1],[2.5,0],[3,0],[3.25,1]]) {
      await slider.evaluate((control, value) => {
        control.value = String(value);
        control.dispatchEvent(new Event('input', { bubbles: true }));
      }, height);
      assert.equal(await graph.locator('.badge-t2').textContent(), String(count), `incorrect intersections at y=${height}`);
      assert.equal(await graph.locator('.xmark').count(), count, `intersection markers disagree at y=${height}`);
    }
    await openSheet(card.locator('.minimal-help'), loadImage);
    const text = 'x ≠ 0, 2. График y=3−1/x с выколотой точкой (2; 2,5). Нет общих точек при m=2,5 или m=3.';
    const draft = await algebraDraft(card, text);
    await card.getByRole('button', { name: 'Вернуться к заданию', exact: true }).click();
    const check = card.locator(':scope > .btn-row .btn-check'), feedback = card.locator(':scope > .fb');
    await check.click();
    assert.match(await feedback.innerText(), /Собери ответ/);
    await card.getByRole('button', { name: '+ значение', exact: true }).click();
    const values = card.locator('.ans-host .v-dec');
    await values.nth(0).fill('2');
    await values.nth(1).fill('3');
    await check.click();
    assert(await check.isEnabled(), 'old excluded-point answer was accepted');
    assert.match(await feedback.innerText(), /Пока не совпадает/);
    await values.nth(0).fill('2,5');
    await check.click();
    assert(await check.isDisabled());
    assert.match(await feedback.innerText(), /Верно/);
    assert.equal(await draft.inputValue(), text, 'automatic answer grading must retain written reasoning');
    await another.click();
    assert(await check.isEnabled());
  },

  async 'oge-task23-geometry-calculations'(page) {
    await page.locator('#courseSettings > summary').click();
    await page.locator('#courseSettings select.sel').selectOption('rhombH');
    await page.locator('#courseSettings > summary').click();
    const card = page.locator('.train-host > .card');
    const condition = await card.locator('.q-text').innerText();
    const DH = Number(condition.match(/DH\s*=\s*(\d+)/)[1]), CH = Number(condition.match(/CH\s*=\s*(\d+)/)[1]);
    const height = Math.sqrt((DH+CH)**2-DH**2);
    await graphic(card.locator('.ocp-primary-figure svg').first());
    const text = 'AD = DC = DH + CH. AH перпендикулярна DC, поэтому AH² = AD² − DH².';
    const draft = await proofDraft(page, text);
    await page.locator('#courseHintToggle').click();
    assert(await page.locator('#courseHintPanel').isVisible());
    await page.locator('#courseHintToggle').click();
    assert.equal(await draft.inputValue(), text);
    await gradeNumber(card, { input: '.ans-inp', check: '.ans-row [data-board-action="answer"]', feedback: ':scope > .fb', wrong: DH+CH, correct: height.toFixed(8) });
    assert.equal(await draft.inputValue(), text);
    await card.locator('[data-board-action="next"]').click();
    assert.equal(await card.locator('.ans-inp').inputValue(), '');
    await page.reload();
    // Reopen this exact native condition after a reload. The normal next-task
    // generator deliberately selects a different archive entry.
    await page.evaluate(({ DH, CH }) => {
      buildTask(document.querySelector('.train-host'), { sub: 'rhombH', p: { DH, CH } }, 'train', () => {});
      window.OgeCourseProof.decorate();
    }, { DH, CH });
    assert.equal(await page.locator('.ocp-writing textarea').inputValue(), text, 'geometry calculation draft did not survive reload');
  },

  async 'oge-task25-geometry'(page) {
    // Use the native first prototype and its displayed length, independently
    // derive all three sides; rounding to hundredths is explicitly supported.
    const length = await page.evaluate(() => trS.p);
    assert.equal(typeof length, 'number');
    const answers = [length*Math.sqrt(13)/4, length*Math.sqrt(13)/2, 3*length*Math.sqrt(5)/4];
    await graphic(page.locator('#panel-train .ocp-primary-figure svg').first());
    const text = 'AD и BE равны и перпендикулярны. Из равенства треугольников следует BC=2AB. Дальше использую формулы медианы и биссектрисы.';
    const draft = await proofDraft(page, text);
    await page.locator('#courseHintToggle').click();
    await page.locator('#courseHintPanel').getByRole('button', { name: 'Решать по шагам', exact: true }).click();
    assert(await page.locator('#courseHintPanel .gsteps').isVisible());
    assert.equal(await draft.inputValue(), text);
    await page.locator('#courseHintToggle').click();
    const check = page.locator('#panel-train [data-act="tr-check"]');
    await check.click();
    assert.match(await page.locator('#trFb').innerText(), /Заполните все поля/);
    assert(await check.isEnabled());
    for (const field of await page.locator('#panel-train input[data-ai]').all()) await field.fill('1');
    await check.click();
    assert(await check.isEnabled(), 'wrong sides were accepted');
    for (let i=0;i<answers.length;i++) await page.locator(`#panel-train input[data-ai="${i}"]`).fill(answers[i].toFixed(2).replace('.',','));
    await check.click();
    assert(await check.isDisabled());
    assert.match(await page.locator('#trFb').innerText(), /Верно/);
    assert.equal(await draft.inputValue(), text);
    await page.locator('#panel-train [data-act="tr-next"]').click();
    assert.equal(await page.locator('#panel-train input[data-ai="0"]').inputValue(), '');
    await page.reload();
    const draw = await page.evaluate(length => (TYPES[0].pool.indexOf(length) + .1) / TYPES[0].pool.length, length);
    await nativeExample(page, [draw], () => page.evaluate(() => {
      newTrainTask(1);
      window.OgeCourseProof.decorate();
    }));
    assert.equal(await page.evaluate(() => trS.p), length);
    assert.equal(await page.locator('.ocp-writing textarea').inputValue(), text, 'geometry proof draft did not survive reload');
  },
};
