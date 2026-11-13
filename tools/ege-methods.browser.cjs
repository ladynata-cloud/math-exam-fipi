'use strict';

const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { createReadStream, mkdirSync, statSync } = require('node:fs');
const { createServer } = require('node:http');
const { extname, join, resolve, sep } = require('node:path');
const { setTimeout: wait } = require('node:timers/promises');
const { chromium } = require('playwright');
const { lessons } = require('../trainers/ege-methods/content.js');
const S = require('../trainers/ege-methods/state.js');

const root = resolve(__dirname, '..');
const trainer = '/trainers/ege-methods.html';
const shots = process.env.EGE_METHODS_SHOTS;
const errors = [];
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };

const site = createServer((req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/favicon.ico') return res.writeHead(204).end();
    let file = resolve(root, '.' + decodeURIComponent(url.pathname));
    if (!file.startsWith(root + sep)) return res.writeHead(403).end();
    if (statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!statSync(file).isFile()) return res.writeHead(404).end();
    res.setHeader('Content-Type', (mime[extname(file)] || 'application/octet-stream') + '; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'HEAD') return res.end();
    createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404).end();
  }
});

async function listen(server) {
  await new Promise((done, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', done);
  });
  return 'http://127.0.0.1:' + server.address().port;
}
const close = server => new Promise(done => server.close(done));

function monitor(page, origin) {
  page.setDefaultTimeout(12000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400 && response.url().startsWith(origin + '/')) {
      errors.push(response.status() + ' ' + new URL(response.url()).pathname);
    }
  });
}

async function setAnswer(container, field, index, answer = field.answer) {
  const input = container.locator('#answer-' + index);
  if (field.kind === 'choice') await input.selectOption(answer);
  else await input.fill(Array.isArray(answer) ? answer.join('; ') : String(answer));
}

async function screenshot(page, name) {
  if (!shots) return;
  mkdirSync(shots, { recursive: true });
  await page.screenshot({ path: join(shots, name + '.png'), fullPage: true });
}

async function standalone(browser, origin) {
  const page = await browser.newPage({ viewport: { width: 320, height: 900 } });
  monitor(page, origin);
  await page.goto(origin + trainer);
  await page.evaluate(() => {
    localStorage.setItem('mathExam.profile.partTwo.v1.evidence', 'profile before');
    localStorage.setItem('mathexam.ege-baza.reasoning.draft.v1', 'base before');
  });
  assert.equal(await page.locator('.lesson-card').count(), lessons.length);
  assert.equal(await page.locator('.hero a[href*="trainer-board"]').count(), 1);
  await page.getByRole('link', { name: 'Начать с оценок' }).click();

  for (const [index, lesson] of lessons.entries()) {
    await page.waitForURL(url => url.hash === '#lesson/' + lesson.id);
    await page.getByRole('heading', { level: 1, name: lesson.title, exact: true }).waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth === innerWidth), lesson.id + ' fits 320px');
    const question = await page.locator('.problem').boundingBox();
    assert(question.y + question.height <= 900, lesson.id + ' condition fits on first screen');
    if (lesson.model) {
      const model = await page.locator('figure.model').boundingBox();
      assert(model.y + model.height <= 900, lesson.id + ' model fits on first screen');
      if (lesson.model === 'line') {
        await page.locator('[data-model="-2"]').click();
        await page.getByText('−2 не подходит', { exact: false }).waitFor();
        await page.locator('[data-model="2"]').click();
        await page.getByText('2 подходит', { exact: false }).waitFor();
      } else if (lesson.model === 'packs') {
        for (const i of [0, 2, 4]) await page.locator('[data-model="' + i + '"]').click();
        await page.getByText('Всего наклеек: 13.').waitFor();
        await screenshot(page, '320-construction');
        await page.reload();
        await page.getByText('Всего наклеек: 13.').waitFor();
      } else {
        await page.locator('[data-model="11"]').click();
        await page.getByText('Второе: нет.', { exact: false }).waitFor();
        await page.locator('[data-model="10"]').click();
        await page.getByText('Второе: да.', { exact: false }).waitFor();
        await screenshot(page, '320-intersection');
        await page.setViewportSize({ width: 1280, height: 900 });
        await screenshot(page, '1280-intersection');
        await page.setViewportSize({ width: 320, height: 900 });
      }
    }

    if (index === 0) {
      const check = page.getByRole('button', { name: 'Проверить шаг' });
      await check.click();
      await page.getByText('Введи ответ или выбери вариант.').waitFor();
      assert.equal(await page.locator('#hint-text').isVisible(), false);
      await page.locator('#answer-0').fill('abc');
      await check.click();
      await page.getByText('Введи целое число.').waitFor();
      await page.locator('#answer-0').fill('9');
      await check.click();
      await page.getByText('Проверь вычисление', { exact: false }).waitFor();
      assert.equal(await page.locator('#hint-text').isVisible(), false);
      await check.click();
      await page.locator('#hint-text').waitFor({ state: 'visible' });
    }

    for (const [number, step] of lesson.steps.entries()) {
      await setAnswer(page, step.field, 0);
      await page.getByRole('button', { name: 'Проверить шаг' }).click();
      await page.waitForFunction(expected => document.querySelectorAll('.solved li').length === expected, number + 1);
    }
    await page.getByRole('link', { name: 'К самопроверке' }).click();
    await page.locator('#practice-form').waitFor();
    assert.equal(await page.locator('figure.model, #hint-text, #sample').count(), 0);
    if (index === 0) {
      await page.getByRole('button', { name: 'Проверить ответы' }).click();
      await page.getByText('Заполни все поля ответа.').waitFor();
      await setAnswer(page, lesson.practice.fields[0], 0, 14);
    }
    for (const [i, field] of lesson.practice.fields.entries()) {
      if (index !== 0 || i > 0) await setAnswer(page, field, i);
    }
    if (index === 0) {
      await page.getByRole('button', { name: 'Проверить ответы' }).click();
      await page.getByText('Проверь ответы в отмеченных полях', { exact: false }).waitFor();
      assert.equal(await page.locator('#answer-0').getAttribute('aria-invalid'), 'true');
      await setAnswer(page, lesson.practice.fields[0], 0);
    }
    if (lesson.practice.proof) await page.locator('#proof-draft').fill('Моё обоснование: 5 < x; пример.');
    await page.getByRole('button', { name: 'Проверить ответы' }).click();
    await page.getByRole('heading', { name: 'Ответы верны' }).waitFor();
    await page.getByRole('button', { name: 'Показать разбор' }).click();
    await page.locator('#sample').waitFor({ state: 'visible' });
    if (index === lessons.length - 1) {
      await page.reload();
      await page.getByRole('heading', { name: 'Ответы верны' }).waitFor();
      assert.equal(await page.locator('#proof-draft').inputValue(), 'Моё обоснование: 5 < x; пример.');
      await page.getByRole('button', { name: 'Скрыть разбор' }).waitFor();
      await page.getByRole('link', { name: /База №21 · Грибы/ }).click();
      await page.waitForURL('**/path/index.html#lesson=practice-mushroom-count');
      await page.getByText('Грибы — что значит «среди любых»', { exact: false }).first().waitFor();
      await page.goBack();
      await page.getByRole('link', { name: 'Посмотреть прогресс' }).click();
    } else {
      await page.getByRole('link', { name: 'Следующий урок' }).click();
    }
  }

  await page.getByRole('heading', { name: 'Мой прогресс' }).waitFor();
  assert.equal(await page.locator('#guided-progress').getAttribute('value'), '8');
  assert.equal(await page.locator('#practice-progress').getAttribute('value'), '8');
  assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).practice.attempts, S.prefix + 'bounds'), 2);
  assert.deepEqual(await page.evaluate(() => [
    localStorage.getItem('mathExam.profile.partTwo.v1.evidence'), localStorage.getItem('mathexam.ege-baza.reasoning.draft.v1')
  ]), ['profile before', 'base before']);
  await screenshot(page, '320-progress');
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole('link', { name: 'Все уроки', exact: true }).click();
  await screenshot(page, '1280-map');

  for (const [url, heading, linkText] of [
    ['/ege-profil/part-two/#exam/20', 'Числа и их свойства', /Профиль №20 · Оценка/],
    ['/ege-baza/#task?pos=21', 'Задачи на рассуждение', /База №21 · Оценка/]
  ]) {
    await page.goto(origin + url);
    await page.getByRole('heading', { level: 1, name: heading }).waitFor();
    await page.getByRole('link', { name: 'Азбука: оценка плюс пример' }).click();
    await page.getByRole('heading', { level: 1, name: /Азбука математических методов/ }).waitFor();
    await page.getByRole('link', { name: linkText }).click();
    if (url.includes('ege-profil')) await page.getByRole('heading', { level: 1, name: 'Оценка и достигающий её пример' }).waitFor();
    else {
      await page.waitForURL('**/path/index.html#lesson=practice-whole-count');
      await page.getByText('Оценка числа участников', { exact: false }).first().waitFor();
    }
  }
  await page.close();
}

async function boardFrame(page) {
  await page.waitForFunction(() => document.querySelector('#mirrorStatus')?.dataset.mirrorStatus === 'connected' &&
    document.querySelector('#trainerFrame')?.src.includes('/trainers/ege-methods.html'));
  const frame = page.frames().find(candidate => new URL(candidate.url()).pathname === trainer);
  assert(frame, 'Shared course frame exists');
  return frame;
}

async function sharedBoard(browser, origin, serverOrigin) {
  const teacher = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const student = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  for (const page of [teacher, student]) {
    monitor(page, origin);
    await page.addInitScript(pathname => {
      if (window === window.top || location.pathname !== pathname) return;
      window.personalAccess = [];
      for (const method of ['getItem', 'setItem', 'removeItem', 'clear']) {
        const original = Storage.prototype[method];
        Storage.prototype[method] = function (...args) {
          window.personalAccess.push(method);
          return original.apply(this, args);
        };
      }
    }, trainer);
  }

  await teacher.goto(origin + '/trainers/trainer-board.html?server=' + encodeURIComponent(serverOrigin));
  await teacher.locator('#openShare').click();
  await teacher.locator('#createRoom').click();
  await teacher.waitForFunction(() => document.querySelector('#shareStatus')?.textContent === 'подключено' &&
    document.querySelector('#studentLink')?.value.includes('role=student'));
  const pupilLink = await teacher.locator('#studentLink').inputValue();
  await teacher.locator('#sharePanel [data-close-panel]').click();
  await student.goto(pupilLink);

  await teacher.locator('#chooseTrainer').click();
  await teacher.locator('#pickerSearch').fill('ege-methods');
  await teacher.locator('#pickerResults .picker-item').click();
  const [t, s] = await Promise.all([boardFrame(teacher), boardFrame(student)]);
  await t.getByRole('link', { name: 'Пример, который можно проверить' }).click();
  await s.getByRole('heading', { name: 'Пример, который можно проверить' }).waitFor();
  await t.locator('[data-model="2"]').click();
  await s.getByText('Всего наклеек: 11.').waitFor();
  await t.getByRole('button', { name: 'Подсказка' }).click();
  await s.locator('#hint-text').waitFor({ state: 'visible' });
  await t.locator('#answer-0').fill('10');
  await s.waitForFunction(() => document.getElementById('answer-0')?.value === '10');
  await t.getByRole('button', { name: 'Проверить шаг' }).click();
  await s.getByRole('heading', { name: 'Построение примера' }).waitFor();

  await teacher.locator('#openShare').click();
  await teacher.locator('#controlToggle').click();
  await student.waitForFunction(() => document.body.classList.contains('control-owner'));
  await teacher.waitForFunction(() => !document.body.classList.contains('control-owner'));
  await teacher.locator('#sharePanel [data-close-panel]').click();
  await s.locator('#answer-0').fill('3');
  await s.getByRole('button', { name: 'Проверить шаг' }).click();
  await t.getByRole('heading', { name: 'Почему границ бывает мало' }).waitFor();
  await s.locator('#answer-0').selectOption('parity');
  await s.getByRole('button', { name: 'Проверить шаг' }).click();
  await s.getByRole('link', { name: 'К самопроверке' }).click();
  await t.locator('#practice-form').waitFor();

  const proof = 'Для любого n: a<b>c. Проверяю оба условия.';
  await s.locator('#proof-draft').fill(proof);
  await t.waitForFunction(expected => document.getElementById('proof-draft')?.value === expected, proof);

  await student.reload();
  const restored = await boardFrame(student);
  assert.equal(await restored.locator('#proof-draft').inputValue(), proof);
  await teacher.locator('#openShare').click();
  await teacher.locator('#controlToggle').click();
  await teacher.waitForFunction(() => document.body.classList.contains('control-owner'));
  await teacher.locator('#sharePanel [data-close-panel]').click();
  const late = await browser.newPage();
  monitor(late, origin);
  await late.goto(pupilLink);
  const lateFrame = await boardFrame(late);
  assert.equal(await lateFrame.locator('#proof-draft').inputValue(), proof);
  assert.deepEqual(await t.locator('body').evaluate(() => window.personalAccess), []);
  assert.deepEqual(await restored.locator('body').evaluate(() => window.personalAccess), []);
  await screenshot(teacher, '1280-board');
  await Promise.all([teacher.close(), student.close(), late.close()]);
}

(async () => {
  let child, browser;
  try {
    const origin = await listen(site);
    const temporary = createServer();
    const serverOrigin = await listen(temporary);
    await close(temporary);
    const env = { ...process.env, HOST: '127.0.0.1', PORT: new URL(serverOrigin).port, NODE_ENV: 'test', CORS_ALLOWED_ORIGINS: origin };
    for (const key of Object.keys(env)) if (/^(LEARNING_|PROGRESS_|GROUP_LESSON_|TRAINER_REGISTRY_)/.test(key)) delete env[key];
    child = spawn(process.execPath, ['index.js'], { cwd: join(root, 'board-server'), env, stdio: ['ignore', 'ignore', 'pipe'] });
    let logs = '';
    child.stderr.on('data', data => { logs += data; });
    let healthy = false;
    for (let tries = 0; tries < 80 && child.exitCode === null; tries++) {
      healthy = await fetch(serverOrigin + '/health', { signal: AbortSignal.timeout(500) }).then(res => res.ok, () => false);
      if (healthy) break;
      await wait(80);
    }
    assert(healthy, 'Local board failed to start: ' + logs);
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, headless: true, args: ['--no-sandbox'] });
    await standalone(browser, origin);
    await sharedBoard(browser, origin, serverOrigin);
    assert.deepEqual(errors, [], 'no browser errors or missing local assets');
    console.log('EGE_METHODS_BROWSER_OK: all 8 guided lessons and 8 independent tasks; 320 and 1280 px; both exam routes; saved answers; two-participant board with control transfer, reload and late join');
  } finally {
    await browser?.close();
    if (child && child.exitCode === null) child.kill('SIGTERM');
    await close(site);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
