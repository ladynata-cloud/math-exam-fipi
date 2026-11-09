'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const base = process.env.WORKSHOP_URL || pathToFileURL(path.resolve(__dirname, '../school/index.html')).href;
const course = (grade, route = `course/vilenkin${grade}`) => `${base}?course=vilenkin${grade}#${route}`;
const button = (page, command) => page.locator(`[data-cmd=${command}]`);
const open = async (page, grade, route) => {
  await page.goto(course(grade, route));
  await page.locator('main h1').waitFor();
};
const submit = async (page, value) => {
  await page.locator('#answer').fill(value);
  await page.locator('#answer-form button').click();
};
const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem(WorkshopState.KEY)));
const correctAnswer = page => page.evaluate(() => {
  const { last } = JSON.parse(localStorage.getItem(WorkshopState.KEY));
  return WorkshopMath.fmt(WorkshopMath.generate(last.skill, last.seed).answer);
});

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 900 } });
    page.on('pageerror', error => errors.push(error.message));
    await open(page, 5);
    assert.match(await page.locator('a[href="#v5-unit/29"]').innerText(), /Самостоятельно: 0 из/);
    assert.equal(await button(page, 'resume-vilenkin').count(), 0);

    await open(page, 5, 'lesson/v5f-fraction-same-add');
    const firstStep = await page.evaluate(() => WorkshopMath.fmt(WorkshopMath.generate('v5f-fraction-same-add', 0).steps[0].answer));
    await submit(page, firstStep);
    await button(page, 'next').click();
    await page.locator('#answer').fill('мой черновик');
    await page.reload();
    assert.equal(await page.locator('#answer').inputValue(), 'мой черновик');
    assert.match(await page.locator('.v6-history summary').innerText(), /\(1\)/);

    // Both published courses share a storage record: a lesson switch or reload
    // must preserve the other course's unfinished work and assistance evidence.
    const v5DraftBeforeM9 = (await saved(page)).vilenkinDrafts.vilenkin5;
    await page.goto(`${base}?course=makarychev9#lesson/m9f-root-square`);
    await page.locator('#m9-prediction').fill('Проверю знак корня');
    await page.locator('#answer').fill('незавершённый ответ М9');
    const m9DraftBeforeReload = (await saved(page)).m9Drafts['m9f-root-square'];
    await page.reload();
    assert.equal(await page.locator('#answer').inputValue(), 'незавершённый ответ М9');
    assert.deepEqual((await saved(page)).vilenkinDrafts.vilenkin5, v5DraftBeforeM9);
    await open(page, 5, 'lesson/v5f-fraction-same-add');
    assert.equal(await page.locator('#answer').inputValue(), 'мой черновик');
    assert.equal((await saved(page)).m9Drafts['m9f-root-square'].input, m9DraftBeforeReload.input);
    assert.equal((await saved(page)).m9Drafts['m9f-root-square'].inquiry.prediction, 'Проверю знак корня');

    await open(page, 6, 'lesson/v6f-fraction-lcd');
    await page.locator('[data-cmd=mode][data-value=check]').click();
    const initialPrompt = await page.locator('#task-panel .question').innerText();
    await button(page, 'hint').click();
    await open(page, 6);
    assert.match(await page.locator('a[href="#v6-unit/9"]').innerText(), /Самостоятельно: 0 из/);
    assert.match(await page.locator('.panel.featured').innerText(), /К следующему навыку/);
    await button(page, 'resume-vilenkin').click();
    await page.locator('#task-panel .question').waitFor();
    assert.equal(await page.locator('#task-panel .question').innerText(), initialPrompt);
    await submit(page, await correctAnswer(page));
    let result = (await saved(page)).events.at(-1);
    assert.equal(result.assisted, true);
    assert.equal(result.independent, false);
    await button(page, 'next').click();
    assert.notEqual(await page.locator('#task-panel .question').innerText(), initialPrompt);
    await submit(page, '-999');
    await page.reload();
    assert.equal((await saved(page)).vilenkinDrafts.vilenkin6.checkIndex, 1);
    assert.equal(await page.locator('#answer').inputValue(), '-999');
    await submit(page, await correctAnswer(page));
    result = (await saved(page)).events.at(-1);
    assert.equal(result.attempt, 2);
    assert.equal(result.independent, false);
    await open(page, 6);
    assert.match(await page.locator('a[href="#v6-unit/9"]').innerText(), /Разобрано с помощью: 1/);

    await open(page, 5);
    await button(page, 'resume-vilenkin').click();
    assert.equal(await page.locator('#answer').inputValue(), 'мой черновик');
    await open(page, 5, 'progress');
    const downloadPromise = page.waitForEvent('download');
    await button(page, 'report').click();
    const report = JSON.parse(await fs.readFile(await (await downloadPromise).path(), 'utf8'));
    assert.equal('vilenkinDrafts' in report.progress, false);
    assert.equal(report.progress.events.length, (await saved(page)).events.length);

    await page.evaluate(() => localStorage.removeItem(WorkshopState.KEY));
    await page.reload();
    const pilot = page;
    await open(pilot, 5, 'lesson/v5f-fraction-same-add');
    await pilot.getByRole('link', { name: /Сложение дробей · из 5 в 6 класс/ }).click();
    await pilot.getByRole('heading', { name: 'Как сложить половину и треть?' }).waitFor();
    assert.equal(await pilot.locator('#fraction-pilot-model svg').count(), 0);
    await pilot.getByRole('button', { name: 'Между 1/2 и 1' }).click();
    await pilot.locator('#fraction-pilot-model svg').waitFor();
    await pilot.locator('[data-field=den]').fill('6');
    assert.match(await pilot.locator('.v6-readout').innerText(), /делится на 6 частей/);
    await pilot.getByText('Сверить объяснение', { exact: true }).click();
    assert.match(await pilot.locator('#fraction-pilot-experiment details').innerText(), /5\/6/);
    for (const width of [320, 1280]) {
      await pilot.setViewportSize({ width, height: 900 });
      assert(await pilot.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    }
    await button(pilot, 'fraction-check').click();
    assert.match(await pilot.locator('#task-panel .question').innerText(), /2\/3 \+ 1\/4/);
    assert.equal(await pilot.locator('.v6-lab').count(), 0);
    await submit(pilot, '22/24');
    assert.equal((await saved(pilot)).events.at(-1).independent, true);
    await button(pilot, 'next').click();
    await submit(pilot, await correctAnswer(pilot));
    assert.equal((await saved(pilot)).skills['v6f-fraction-add'].checks.length, 2);
    await open(pilot, 6);
    assert.match(await pilot.locator('a[href="#v6-unit/10"]').innerText(), /Самостоятельно: 1 из/);
    await open(pilot, 6, 'vilenkin-fractions');
    await pilot.getByRole('button', { name: 'Меньше 1/2' }).click();
    await button(pilot, 'fraction-check').click();
    assert.doesNotMatch(await pilot.locator('#task-panel .question').innerText(), /2\/3 \+ 1\/4/);

    await pilot.evaluate(() => {
      const state = WorkshopState.blank();
      delete state.vilenkinDrafts;
      state.last = { skill: 'v5f-fraction-same-add', mode: 'check', seed: 1001 };
      WorkshopState.save(localStorage, state);
    });
    await pilot.goto(course(5, 'lesson/v5f-fraction-same-add'));
    await pilot.reload();
    assert.match(await pilot.locator('.lesson-head .eyebrow').innerText(), /Самостоятельная проверка/i);
    await submit(pilot, await correctAnswer(pilot));
    assert.equal((await saved(pilot)).events.at(-1).independent, false);
    assert.deepEqual(errors, []);
    console.log('PASS Vilenkin mastery: course cards, separate drafts, reload, help and retries, report privacy, linked fractions and independent check, legacy data, mobile width.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
