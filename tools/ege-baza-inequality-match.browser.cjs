'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { createInterface } = require('node:readline');
const path = require('node:path');
const { chromium } = require('playwright');
const { createSet } = require('../ege-baza/inequality-match/lesson.js');

const root = path.resolve(__dirname, '..');
const lessonPath = '/ege-baza/inequality-match/index.html';
const familyPath = '/ege-baza/path/index.html#lesson=practice-inequality-match';

async function startSite(t) {
  const server = spawn('python3', ['-u', '-m', 'http.server', '0', '--bind', '127.0.0.1', '--directory', root],
    { stdio: ['ignore', 'pipe', 'ignore'] });
  t.after(() => server.kill());
  const output = createInterface({ input: server.stdout });
  const [line] = await Promise.race([
    once(output, 'line'),
    once(server, 'exit').then(([code]) => { throw Error('Local preview exited with ' + code); })
  ]);
  return 'http://127.0.0.1:' + line.match(/port (\d+)/)[1];
}

async function assertFits(page, label) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label);
}

test('№18 — вход из задания, учебная модель, отдельная проверка и возврат к черновику', async t => {
  const site = await startSite(t);
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox']
  });
  t.after(() => browser.close());
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const errors = [];
  context.on('page', p => p.on('pageerror', err => errors.push(err.message)));

  const family = await context.newPage();
  await family.goto(site + familyPath);
  await family.locator('#answer').fill('23');
  await family.locator('.ref-help > summary').click();
  const sheet = family.locator('.ref-rule[data-sheet-id="inequality-line"]');
  await sheet.locator('summary').first().click();
  const [lesson] = await Promise.all([
    family.waitForEvent('popup'),
    sheet.locator('a[href*="#sheet=inequality-line"]').click()
  ]);
  const openLesson = lesson.locator('a[href$="inequality-match/index.html"]');
  await openLesson.waitFor();
  await lesson.evaluate(() => localStorage.setItem('untouched-course-fixture', 'старый результат'));
  const before = await lesson.evaluate(() => ({ ...localStorage }));
  await openLesson.click();
  assert.equal(new URL(lesson.url()).pathname, lessonPath);
  const practice = lesson.locator('#practice-panel');
  const check = lesson.locator('#check-panel');
  await practice.locator('input[name=answer]').waitFor();
  for (const width of [320, 390, 1280]) {
    await lesson.setViewportSize({ width, height: 840 });
    await assertFits(lesson, 'lesson overflows at ' + width);
  }
  const readout = lesson.locator('#model-readout');
  const slider = lesson.locator('#test-x');
  async function probe(value) {
    await slider.fill(String(value));
    return readout.innerText();
  }
  await lesson.selectOption('#base-select', '2');
  const outside = await probe(1);
  const included = await probe(3);
  const excluded = await probe(4);
  assert.match(outside, /не определён/);
  assert.match(included, /Неравенство выполнено/);
  assert.match(excluded, /Неравенство не выполнено/);
  await lesson.selectOption('#base-select', '0.5');
  assert.match(await readout.innerText(), /Неравенство выполнено/);
  assert(await lesson.locator('#model-line circle').count() >= 2);

  const hint = practice.locator('[data-hint]');
  await hint.click();
  const answer = practice.locator('input[name=answer]');
  const feedback = practice.locator('[data-feedback]');
  assert.match(await feedback.innerText(), /Строка А/);
  const correct = createSet('practice', 0).answer;
  await answer.fill([...correct].reverse().join(''));
  await practice.locator('button[type=submit]').click();
  const diagnostic = await feedback.innerText();
  assert.match(diagnostic, /Проверь строку А/);
  await answer.fill(correct);
  await practice.locator('button[type=submit]').click();
  assert.match(await feedback.innerText(), /Верно/);
  const practiced = await practice.locator('[data-exercise]').innerText();
  await practice.locator('[data-next]').click();
  assert.notEqual(await practice.locator('[data-exercise]').innerText(), practiced);

  const examAnswer = check.locator('input[name=answer]');
  const examSubmit = check.locator('button[type=submit]');
  assert.equal(await check.locator('[data-hint], details').count(), 0);
  await examAnswer.fill('11');
  await examSubmit.click();
  assert(await examAnswer.isEditable(), 'format correction uses no attempt');
  const key = createSet('check', 0).answer;
  await examAnswer.fill([...key].reverse().join(''));
  await examSubmit.click();
  assert(!(await examAnswer.isEditable()));
  assert.match(await check.locator('[data-feedback]').innerText(), /есть ошибка/);
  assert(!(await check.locator('[data-feedback]').innerText()).includes(key), 'control must not disclose the key');
  await lesson.reload();
  await check.locator('[data-next]').waitFor();
  assert(!(await examAnswer.isEditable()), 'reload cannot retry a submitted control');
  await check.locator('[data-next]').click();
  assert(await examAnswer.isEditable());
  await examAnswer.fill(createSet('check', 1).answer);
  await examSubmit.click();
  assert(!(await examAnswer.isEditable()));
  assert.match(await check.locator('[data-feedback]').innerText(), /Верно/);
  assert.deepEqual(await lesson.evaluate(() => ({ ...localStorage })), before);

  for (let variant = 2; variant < 24; variant++) {
    await check.locator('[data-next]').click();
    await examAnswer.fill(createSet('check', variant).answer);
    await examSubmit.click();
    assert.match(await check.locator('[data-feedback]').innerText(), /Верно/);
  }
  await lesson.reload();
  assert(await check.locator('[data-next]').isDisabled(), 'control stops after the last fresh set');

  const baseLink = lesson.locator('a[href*="/algebra/"][href$="#log"]');
  const [foundation] = await Promise.all([lesson.waitForEvent('popup'), baseLink.click()]);
  await foundation.locator('[data-route=log][aria-current=page]').waitFor();
  await foundation.close();
  assert(!(await examAnswer.isEditable()));
  assert.equal(await lesson.evaluate(() => localStorage.getItem('untouched-course-fixture')), 'старый результат');
  // The algebra section can save its own route when opened. Only the new unit is
  // forbidden to modify older results. Check the original path state explicitly.
  assert.equal(await lesson.evaluate(() => localStorage.getItem('mathexam.ege-baza.path.v1')),
    before['mathexam.ege-baza.path.v1']);
  await family.reload();
  assert.equal(await family.locator('#answer').inputValue(), '23');
  await lesson.locator('footer a[href$="#lesson=practice-inequality-match"]').click();
  await lesson.locator('#answer').waitFor();
  assert.equal(await lesson.locator('#answer').inputValue(), '23');
  assert.deepEqual(errors, []);

  const paper = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 320, height: 720 } });
  await paper.goto(site + lessonPath);
  assert(await paper.getByRole('heading', { name: /на бумаге/ }).isVisible());
  assert.equal(await paper.locator('input:visible, select:visible').count(), 0);
  await paper.locator('#paper-title').locator('..').locator('summary').click();
  assert(await paper.getByText('3421', { exact: true }).isVisible());
  await assertFits(paper, 'paper lesson overflows at 320');
});
