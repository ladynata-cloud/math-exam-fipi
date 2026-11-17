'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const fifth = 'v5f-fraction-same-add';
const sixth = 'v6f-fraction-lcd';
const privateInput = 'Сначала проверю знаменатель';
const command = (page, name) => page.locator('[data-cmd="' + name + '"]');

async function startServer() {
  const mime = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml' };
  const server = http.createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      let file = path.resolve(root, '.' + pathname);
      if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
      if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
      const bytes = await fs.readFile(file);
      res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }).end(bytes);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return server;
}

const readState = page => page.evaluate(() => JSON.parse(localStorage.getItem(WorkshopState.KEY)));
async function answer(page, step) {
  return page.evaluate(index => {
    const { skill, seed } = JSON.parse(localStorage.getItem(WorkshopState.KEY)).last;
    const task = WorkshopMath.generate(skill, seed);
    return WorkshopMath.fmt((index === null ? task : task.steps[index]).answer);
  }, step);
}

async function submit(page, value) {
  await page.locator('#answer').fill(value);
  await page.locator('#answer-form button').click();
}

async function downloadJson(page, name) {
  const [download] = await Promise.all([page.waitForEvent('download'), command(page, name).click()]);
  return JSON.parse(await fs.readFile(await download.path(), 'utf8'));
}

async function exercise(page, origin) {
  const open = async (grade, route = 'course/vilenkin' + grade) => {
    await page.goto(origin + '/school/index.html?course=vilenkin' + grade + '#' + route);
    await page.locator('main h1').waitFor();
  };
  const question = page.locator('#task-panel .question');
  const input = page.locator('#answer');
  await open(5);
  assert.equal(await command(page, 'resume-vilenkin').count(), 0);
  await page.locator('a[href="#v5-unit/29"]').click();
  await page.locator('[data-cmd="learn"][data-value="' + fifth + '"]').click();
  await input.waitFor();
  // A valid alternate spelling distinguishes the pupil's answer from a regenerated one.
  const firstAnswer = (await answer(page, 0)) + ',0';
  await submit(page, firstAnswer);
  await command(page, 'next').click();
  await input.fill(privateInput);
  const stepTitle = await page.locator('#task-panel h2').innerText();
  const originalPrompt = await question.innerText();
  await page.reload();
  assert.equal(await question.innerText(), originalPrompt);
  assert.equal(await page.locator('#task-panel h2').innerText(), stepTitle);
  assert.equal(await input.inputValue(), privateInput);
  assert.equal(await page.locator('.v6-history li b').textContent(), firstAnswer);
  const boardUrl = await page.locator('.lesson-head a[href*="trainer-board.html?trainer="]').getAttribute('href');

  // A second skill in fifth grade must not evict the first one.
  await open(5, 'lesson/v5f-place-build');
  await input.fill('другое занятие');
  await open(5, 'v5-unit/29');
  await page.locator('[data-cmd="learn"][data-value="' + fifth + '"]').click();
  assert.equal(await input.inputValue(), privateInput);

  await open(6);
  assert.equal(await command(page, 'resume-vilenkin').count(), 0);
  await open(6, 'lesson/' + sixth);
  await page.locator('[data-cmd="mode"][data-value="check"]').click();
  const checkPrompt = await question.innerText();
  await command(page, 'hint').click();
  assert.match(await page.locator('#help').innerText(), /Подсказка 1 из 3/);
  await open(6);
  await command(page, 'resume-vilenkin').click();
  assert.equal(await question.innerText(), checkPrompt);
  assert.match(await page.locator('.lesson-head .eyebrow').innerText(), /Самостоятельная проверка/i);
  assert.match(await page.locator('#help').innerText(), /Подсказка 1 из 3/);
  await command(page, 'hint').click();
  assert.match(await page.locator('#help').innerText(), /Подсказка 2 из 3/);
  await submit(page, await answer(page, null));
  let state = await readState(page);
  assert.equal(state.events.at(-1).assisted, true);
  assert.equal(state.events.at(-1).independent, false);

  await command(page, 'next').click();
  const retryPrompt = await question.innerText();
  assert.notEqual(retryPrompt, checkPrompt);
  await submit(page, '-999');
  await page.reload();
  assert.equal(await question.innerText(), retryPrompt);
  assert.equal(await input.inputValue(), '-999');
  await submit(page, await answer(page, null));
  state = await readState(page);
  assert.equal(state.events.at(-1).attempt, 2);
  assert.equal(state.events.at(-1).independent, false);

  // An unassisted, as-yet unanswered challenge retains its eligibility on reload.
  await command(page, 'next').click();
  const cleanPrompt = await question.innerText();
  await page.reload();
  assert.equal(await question.innerText(), cleanPrompt);
  const cleanAnswer = await answer(page, null);
  await input.fill(cleanAnswer);
  await input.press('Enter');
  state = await readState(page);
  assert.equal(state.events.at(-1).independent, true);
  assert.equal(state.skills[sixth].checks.length, 1);
  await page.reload();
  assert.equal(await input.isDisabled(), true);
  assert.equal(await input.inputValue(), cleanAnswer);
  assert.equal(await page.locator('#answer-form button').isDisabled(), true);
  await page.locator('#answer-form').dispatchEvent('submit');
  assert.deepEqual((await readState(page)).events, state.events);
  await command(page, 'next').click();
  await page.waitForURL(url => url.hash === '#progress');
  assert.deepEqual((await readState(page)).skills[sixth], state.skills[sixth]);
  await open(6);
  assert.equal(await command(page, 'resume-vilenkin').count(), 0);

  await open(5);
  await command(page, 'resume-vilenkin').click();
  assert.equal(await input.inputValue(), privateInput);
  const storedBeforeBoard = await page.evaluate(() => localStorage.getItem(WorkshopState.KEY));
  await page.route('**/api/trainer-registry', route => route.fulfill({
    contentType: 'application/json', body: JSON.stringify({ schemaVersion: 1, digest: 'a'.repeat(64), trainers: [] })
  }));
  await page.goto(new URL(boardUrl, page.url()).href);
  const frame = page.frameLocator('#trainerFrame');
  assert.equal(await frame.locator('#answer').inputValue(), '');
  assert.equal(await frame.locator('.v6-history').count(), 0);
  await frame.locator('#answer').fill('ответ на доске');
  await command(frame, 'hint').click();
  assert.equal(await page.evaluate(() => localStorage.getItem('mathexam.workshop.v1')), storedBeforeBoard);

  await open(5, 'progress');
  const report = await downloadJson(page, 'report');
  assert(!('vilenkinDrafts' in report.progress));
  assert(!JSON.stringify(report).includes(privateInput));
  assert.deepEqual(report.progress.events, state.events);
  const backup = await downloadJson(page, 'backup');
  assert(JSON.stringify(backup.vilenkinDrafts).includes(privateInput));

  await open(5, 'home');
  const assignment = { schema: 'mathexam-assignment', version: 1, id: 'a-1',
    title: 'Работа в классе', skills: [fifth], seed: 17 };
  await page.locator('#assignment-code').fill(Buffer.from(JSON.stringify(assignment)).toString('base64'));
  await command(page, 'load-code').click();
  await page.getByRole('button', { name: 'Начать задание', exact: true }).click();
  assert.equal(await input.inputValue(), '');
  await input.fill('ответ в задании');
  await open(5, 'home');
  await command(page, 'leave-assignment').click();
  await open(5, 'lesson/' + fifth);
  assert.equal(await input.inputValue(), privateInput);

  // Simulate importing a backup made before that lesson's generator changed.
  await open(5, 'progress');
  backup.vilenkinDrafts[fifth].signature = 'previous generator';
  await command(page, 'import-progress').click();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#file-input').setInputFiles({
    name: 'workshop.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup))
  });
  await page.waitForFunction(id => JSON.parse(localStorage.getItem(WorkshopState.KEY))
    .vilenkinDrafts[id].signature === 'previous generator', fifth);
  await open(5, 'lesson/' + fifth);
  assert.equal(await input.inputValue(), '');
  assert.equal(await page.locator('.v6-history').count(), 0);
  assert.equal((await readState(page)).vilenkinDrafts[fifth].savedInput, privateInput);
  await page.locator('#task-panel a[href="#progress"]').click();
  const retained = await downloadJson(page, 'backup');
  assert.deepEqual(retained.vilenkinDrafts[fifth], backup.vilenkinDrafts[fifth]);
  await open(5, 'lesson/' + fifth);
  assert.equal(await input.inputValue(), '');
  const replacement = 'решаю обновлённое задание';
  await input.fill(replacement);
  await page.reload();
  assert.equal(await input.inputValue(), replacement);
  const replaced = await readState(page);
  assert.equal(replaced.vilenkinDrafts[fifth].savedInput, replacement);
  assert.notEqual(replaced.vilenkinDrafts[fifth].signature, 'previous generator');
  assert.deepEqual(replaced.events, state.events);
}

(async () => {
  const server = await startServer();
  const origin = 'http://127.0.0.1:' + server.address().port;
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.context().route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await exercise(page, origin);
    assert.deepEqual(errors, []);
    console.log('PASS Vilenkin 5/6 workshop resume: saved steps, per-skill input, hints, retries, independent credit, board isolation and actual downloads');
  } finally {
    try { if (browser) await browser.close(); } finally { server.close(); }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
