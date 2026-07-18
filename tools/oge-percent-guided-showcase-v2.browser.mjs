import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mathexam-percent-v2-'));
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

function serve() {
  return new Promise(resolve => {
    const server = http.createServer((request, response) => {
      const rawPath = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
      const relative = rawPath === '/' ? 'index.html' : rawPath.replace(/^\/+/, '');
      const file = path.resolve(root, relative);
      if (file !== root && !file.startsWith(`${root}${path.sep}`)) {
        response.writeHead(403).end('Forbidden');
        return;
      }
      fs.readFile(file, (error, data) => {
        if (error) {
          response.writeHead(404).end('Not found');
          return;
        }
        response.writeHead(200, {
          'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream'
        });
        response.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function numeric(value) {
  return Number(String(value).replace(/\s/g, '').replace(',', '.').replace(/[^0-9.-]/g, ''));
}

function answerFromHtml(question) {
  let match;
  if ((match = question.match(/Найдите <b>([^<]+)%<\/b> от числа <b>([^<]+)<\/b>/))) {
    return (numeric(match[1]) * numeric(match[2])) / 100;
  }
  if ((match = question.match(/Всего потрачено <b>([^<]+) руб<\/b>/))) {
    const first = question.match(/<tr><td>[^<]+<\/td><td>([^<]+) руб<\/td><\/tr>/);
    assert.ok(first);
    return (numeric(first[1]) / numeric(match[1])) * 100;
  }
  if (
    (match = question.match(
      /изменилась с <b>([^<]+) руб<\/b> до <b>([^<]+) руб<\/b>/
    ))
  ) {
    return (Math.abs(numeric(match[2]) - numeric(match[1])) / numeric(match[1])) * 100;
  }
  if (
    (match = question.match(
      /стоил <b>([^<]+) руб<\/b> и (подорожал|подешевел) на <b>([^<]+)%<\/b>/
    ))
  ) {
    return numeric(match[1]) * (1 + (match[2] === 'подорожал' ? 1 : -1) * numeric(match[3]) / 100);
  }
  if (
    (match = question.match(
      /После (повышения|снижения) на <b>([^<]+)%<\/b> цена стала <b>([^<]+) руб<\/b>/
    ))
  ) {
    return numeric(match[3]) / (1 + (match[1] === 'повышения' ? 1 : -1) * numeric(match[2]) / 100);
  }
  if (
    (match = question.match(
      /Число <b>([^<]+)<\/b> составляет сколько процентов от числа <b>([^<]+)<\/b>/
    ))
  ) {
    return (numeric(match[1]) / numeric(match[2])) * 100;
  }
  if (
    (match = question.match(
      /число <b>([^<]+)<\/b> (?:больше|меньше) числа <b>([^<]+)<\/b>/
    ))
  ) {
    return (Math.abs(numeric(match[1]) - numeric(match[2])) / numeric(match[2])) * 100;
  }
  if (
    (match = question.match(
      /Цена была <b>([^<]+) руб<\/b>\. Сначала она (выросла|снизилась) на <b>([^<]+)%<\/b>, затем (выросла|снизилась) на <b>([^<]+)%<\/b>/
    ))
  ) {
    return (
      numeric(match[1]) *
      (1 + (match[2] === 'выросла' ? 1 : -1) * numeric(match[3]) / 100) *
      (1 + (match[4] === 'выросла' ? 1 : -1) * numeric(match[5]) / 100)
    );
  }
  throw new Error(`Unsupported question: ${question}`);
}

async function currentAnswer(page, selector) {
  return answerFromHtml(await page.locator(selector).innerHTML());
}

function recordErrors(page, errors) {
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
}

async function completeLearning(page) {
  await page.locator('.route-card[data-route="learn"]').click();
  await page.locator('#learn-whole-input').fill('240');
  await page.locator('#learn-whole-check').click();
  await page.locator('#learn-next').click();

  await page.locator('#one-pct-input').fill('2');
  await page.locator('#twenty-five-input').fill('50');
  await page.locator('#one-pct-check').click();
  await page.locator('#learn-next').click();

  for (const choice of [1, 0, 1]) {
    await page.locator('[data-whole-choice]').nth(choice).click();
    await page.waitForTimeout(700);
  }
  await page.locator('#learn-next').click();

  for (const [token, slot] of [
    ['ten', 'partValue'],
    ['x', 'partPercent'],
    ['twentyfive', 'wholeValue'],
    ['hundred', 'wholePercent']
  ]) {
    await page.locator(`[data-token="${token}"]`).click();
    await page.locator(`[data-slot="${slot}"]`).click();
  }
  await page.locator('#table-check').click();
  await page.screenshot({
    path: path.join(evidenceDir, 'learning-table.png'),
    fullPage: true
  });
  await page.locator('#learn-next').click();

  await page.locator('[data-prop="correct"]').click();
  await page.locator('#learn-next').click();

  for (const method of ['one', 'prop', 'quick']) {
    await page.locator(`[data-method="${method}"]`).click();
  }
  await page.locator('#learn-next').click();

  for (const type of ['of', 'change', 'reverse']) {
    await page.locator(`[data-type-choice="${type}"]`).click();
    await page.waitForTimeout(700);
  }
  await page.locator('#learn-next').click();

  await page.locator('#guided-one').fill('3,5');
  await page.locator('#guided-answer').fill('70');
  await page.locator('#guided-check').click();
  await page.locator('#learn-next').click();
  await assertText(page, '#learn-count', 'Шаг 9 из 9');
  await page.locator('#learn-next').click();
  await page.locator('#view-practice:not([hidden])').waitFor();
}

async function assertText(page, selector, expected) {
  assert.equal((await page.locator(selector).textContent()).trim(), expected);
}

async function solvePractice(page) {
  const answer = await currentAnswer(page, '#practice-question');
  await page.locator('#practice-input').fill(String(answer).replace('.', ','));
  await page.locator('#practice-input').press('Enter');
}

async function solveCheckpoint(page, wrongFirst = false) {
  for (let index = 0; index < 5; index += 1) {
    const answer = await currentAnswer(page, '#check-question');
    const value = wrongFirst && index === 0 ? answer + 12345 : answer;
    await page.locator('#check-input').fill(String(value).replace('.', ','));
    await page.locator('#check-input').press('Enter');
  }
}

const server = await serve();
const address = server.address();
const baseUrl = `http://127.0.0.1:${address.port}`;
const trainerUrl = `${baseUrl}/trainers/oge-1-5-trainers/percent-table-trainer.html`;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {})
});
const errors = [];

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: baseUrl
  });
  let page = await context.newPage();
  recordErrors(page, errors);
  await page.addInitScript(() => {
    localStorage.setItem(
      'percentTrainer.v1',
      JSON.stringify({
        perType: { of: 2, table: 1, change: 0, apply: 3, reverse: 0 },
        lessonDone: true,
        lessonStep: 5,
        streak: 2
      })
    );
  });
  const response = await page.goto(trainerUrl, { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200);
  await assertText(page, 'h1', 'Процентыбез паники');
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
    false
  );
  const legacy = await page.evaluate(() => JSON.parse(localStorage.getItem('percentTrainer.v1')));
  assert.equal(legacy.stats.of.independent, 2);
  assert.equal(legacy.stats.apply.independent, 3);
  assert.equal(legacy.lessonDone, true);
  assert.equal(legacy.lessonStep, 5);
  assert.equal(legacy.streak, 2);
  const shared = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('mathExamCourseProgress.v1'))
  );
  assert.equal(shared.percentTableTrainer.total, 5);
  await page.screenshot({ path: path.join(evidenceDir, 'desktop-home.png'), fullPage: true });
  await page.evaluate(() => localStorage.clear());
  await page.close();

  page = await context.newPage();
  recordErrors(page, errors);
  await page.goto(trainerUrl, { waitUntil: 'networkidle' });

  await completeLearning(page);

  await page.locator('[data-skill="of"]').click();
  const independentBefore = Number(await page.locator('#stat-independent').textContent());
  await solvePractice(page);
  assert.equal(Number(await page.locator('#stat-independent').textContent()), independentBefore + 1);
  assert.match(await page.locator('#practice-feedback').textContent(), /Самостоятельно/);

  await page.locator('#next-task').click();
  const supportedBefore = Number(await page.locator('#stat-supported').textContent());
  await page.locator('#hint-btn').click();
  await solvePractice(page);
  assert.equal(Number(await page.locator('#stat-supported').textContent()), supportedBefore + 1);
  assert.match(await page.locator('#practice-feedback').textContent(), /подсказки|исправления/);

  await page.locator('#next-task').click();
  const reviewedBefore = Number(await page.locator('#stat-reviewed').textContent());
  const masteryBefore = Number(await page.locator('#stat-independent').textContent());
  await page.locator('#solution-btn').click();
  assert.equal(Number(await page.locator('#stat-reviewed').textContent()), reviewedBefore + 1);
  assert.equal(Number(await page.locator('#stat-independent').textContent()), masteryBefore);
  assert.match(await page.locator('#credit-chip').textContent(), /Разобрано/);

  await page.locator('#next-task').click();
  for (let index = 0; index < 2; index += 1) {
    await page.locator('#practice-input').fill('-999');
    await page.locator('#practice-check').click();
  }
  assert.equal(await page.locator('#hint-stack .hint-card').count(), 1);
  assert.match(await page.locator('#credit-chip').textContent(), /подсказкой|исправления/);

  await page.locator('[data-skill="mix"]').click();
  await assertText(page, '#task-badge', 'Смешанная задача');
  await solvePractice(page);
  assert.notEqual((await page.locator('#task-badge').textContent()).trim(), 'Смешанная задача');

  await page.locator('[data-difficulty="advanced"]').click();
  assert.notEqual((await page.locator('#task-badge').textContent()).trim(), 'Смешанная задача');
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: path.join(evidenceDir, 'practice-advanced.png'),
    fullPage: true
  });
  await solvePractice(page);

  await page.locator('[data-view="review"]').click();
  const reviewQuestion = (await page.locator('#review-question').textContent()).trim();
  await page.locator('#try-similar').click();
  const practiceQuestion = (await page.locator('#practice-question').textContent()).trim();
  assert.notEqual(practiceQuestion, reviewQuestion);

  await page.locator('[data-view="check"]').click();
  await page.locator('[data-check-level="standard"]').click();
  await solveCheckpoint(page);
  await assertText(page, '#result-score', '5/5');
  assert.equal(await page.locator('#result-details details').count(), 5);
  await page.locator('#copy-result').click();
  assert.match(await page.locator('#copy-feedback').textContent(), /скопирован/i);
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: path.join(evidenceDir, 'checkpoint-result.png'),
    fullPage: true
  });

  await page.locator('#repeat-check').click();
  await page.locator('[data-check-level="standard"]').click();
  await solveCheckpoint(page, true);
  await assertText(page, '#result-score', '4/5');
  assert.equal(await page.locator('#result-details details.no').count(), 1);

  await page.locator('#repeat-check').click();
  await page.locator('[data-check-level="advanced"]').click();
  await solveCheckpoint(page);
  await assertText(page, '#result-score', '5/5');

  page.once('dialog', dialog => dialog.accept());
  await page.locator('#reset-all').click();
  const resetOwn = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('percentTrainer.v1'))
  );
  assert.deepEqual(resetOwn.perType, {
    of: 0,
    table: 0,
    change: 0,
    apply: 0,
    reverse: 0
  });
  assert.equal(resetOwn.learnDone, false);
  assert.equal(resetOwn.checkpointBest.standard, 0);
  assert.deepEqual(
    await page.evaluate(() => {
      const value = JSON.parse(localStorage.getItem('mathExamCourseProgress.v1') || '{}');
      return value.percentTableTrainer;
    }),
    { solved: 0, total: 5 }
  );
  await context.close();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobile = await mobileContext.newPage();
  recordErrors(mobile, errors);
  await mobile.goto(trainerUrl, { waitUntil: 'networkidle' });
  assert.equal(
    await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
    false
  );
  await mobile.screenshot({
    path: path.join(evidenceDir, 'mobile-home.png'),
    fullPage: true
  });
  await mobileContext.close();

  const boardContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const board = await boardContext.newPage();
  recordErrors(board, errors);
  await board.goto(`${baseUrl}/trainers/trainer-board.html`, { waitUntil: 'networkidle' });
  const quickValue = '/trainers/oge-1-5-trainers/percent-table-trainer.html';
  await board.locator(`#trainerQuick option[value="${quickValue}"]`).waitFor({
    state: 'attached'
  });
  await board.locator('#trainerQuick').selectOption(quickValue);
  await assertText(board, '#trainerQuickStatus', 'Открывается в доске');
  const frame = board.frameLocator('#trainerFrame');
  await frame.locator('h1').waitFor();
  await assertText(frame, 'h1', 'Процентыбез паники');
  await boardContext.close();

  assert.deepEqual(errors, []);
  console.log(`OGE_PERCENT_GUIDED_SHOWCASE_V2_BROWSER_OK ${evidenceDir}`);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
