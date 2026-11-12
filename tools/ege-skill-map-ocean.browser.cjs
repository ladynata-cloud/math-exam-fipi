'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const mediaTypes = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp'
};
const server = http.createServer(async (request, response) => {
  try {
    let file = path.resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
    if (!file.startsWith(root + path.sep)) return response.writeHead(403).end();
    if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const data = await fs.readFile(file);
    response.setHeader('Content-Type', mediaTypes[path.extname(file)] || 'application/octet-stream');
    response.end(data);
  } catch {
    response.writeHead(404).end();
  }
});

const examKey = 'mathexam.profileStart2027.v1';
const trigger = '[data-profile-skill-trigger]';
const dialog = 'dialog[data-profile-skill-dialog]';
const challenge = '[data-profile-skill-challenge]';

async function fits(page, description) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), description);
}

async function openSkillMap(page) {
  const button = page.locator(trigger).first();
  await button.waitFor({ state: 'visible' });
  await button.press('Enter');
  const map = page.locator(`${dialog}[open]`);
  await map.waitFor({ state: 'visible' });
  return map;
}

async function checkProfileRoutes(page, origin) {
  for (let number = 1; number <= 20; number++) {
    const route = number <= 13 ? `start/#calm/${number}` : `part-two/#exam/${number}`;
    await page.goto(`${origin}/ege-profil/${route}`);
    const map = await openSkillMap(page);
    assert.match(await map.locator('.profile-skill-subtitle').innerText(), new RegExp(`^№${number}(?:\\s|$)`));
    assert(await map.locator(challenge).first().isVisible(), `creative exercise for profile number ${number}`);
    await page.keyboard.press('Escape');
    await map.waitFor({ state: 'hidden' });
    await page.waitForFunction(selector => document.activeElement === document.querySelector(selector), trigger);
  }
  await page.goto(`${origin}/ege-profil/trainers/vectors-t2.html`);
  const legacyMap = await openSkillMap(page);
  assert(await legacyMap.locator(challenge).first().isVisible(), 'legacy vector trainer has a creative exercise');
  await page.keyboard.press('Escape');
}

async function checkCreativePractice(page, origin) {
  const url = `${origin}/ege-profil/start/#practice/geo-right/independent`;
  await page.goto(url);
  const examAnswer = page.locator('#answer');
  const draft = '7/3';
  await examAnswer.fill(draft);
  await page.waitForFunction(({ key, value }) => JSON.parse(localStorage.getItem(key))?.sessions['geo-right:independent']?.draft === value, { key: examKey, value: draft });
  const examBefore = await page.evaluate(key => localStorage.getItem(key), examKey);
  let map = await openSkillMap(page);
  let workshop = map.locator(challenge).first();
  assert(await workshop.getByRole('heading', { name: 'Спроектируй треугольный знак' }).isVisible());
  const hint = workshop.locator('[data-profile-skill-hint]');
  assert.equal(await hint.getAttribute('open'), null, 'hint is disclosed on request');
  await workshop.getByLabel('Высота, см').fill('7');
  await workshop.getByLabel('Боковая сторона, см').fill('10');
  await workshop.getByRole('button', { name: 'Проверить', exact: true }).click();
  assert.match(await workshop.getByRole('status').innerText(), /^Пока не сходится/);
  await hint.locator('summary').click();
  assert.notEqual(await hint.getAttribute('open'), null, 'requested hint is visible');
  await workshop.getByLabel('Высота, см').fill('16/2');
  await fits(page, 'creative map fits narrow viewport');
  assert.equal(await page.evaluate(key => localStorage.getItem(key), examKey), examBefore, 'workshop activity does not mark an exam attempt as assisted');
  await page.reload();
  assert.equal(await examAnswer.inputValue(), draft, 'exam draft survives a refresh after using the workshop');
  map = await openSkillMap(page);
  workshop = map.locator(challenge).first();
  assert.equal(await workshop.getByLabel('Высота, см').inputValue(), '16/2', 'workshop draft survives refresh');
  assert.equal(await workshop.getByLabel('Боковая сторона, см').inputValue(), '10');
  const beforeCheck = await page.evaluate(key => localStorage.getItem(key), examKey);
  await workshop.getByRole('button', { name: 'Проверить', exact: true }).click();
  assert.match(await workshop.getByRole('status').innerText(), /^Верно, с подсказкой\./, 'equivalent fractional input is accepted and hint usage is remembered');
  assert.equal(await page.evaluate(key => localStorage.getItem(key), examKey), beforeCheck, 'workshop success does not overwrite exam progress');
  await page.reload();
  map = await openSkillMap(page);
  assert.match(await map.locator('[data-profile-skill-progress]').innerText(), /^Решено 1 из 1/);
  assert.match(await map.locator(challenge).first().getByRole('status').innerText(), /^Верно, с подсказкой\./);
  await page.keyboard.press('Escape');
}

async function checkOcean(page, origin) {
  const pointNames = [
    'Плавучая база', 'Мерный буй', 'Журнал погружений',
    'Черепаший грот', 'Коралловый сад', 'Развилка рифа',
    'Граница течений', 'Светящийся косяк', 'Песчаная терраса',
    'Карта фрегата', 'Грузовой трюм', 'Мачта фрегата',
    'Купол Атлантиды', 'Зал мерных чаш', 'Мозаика Атлантиды',
    'След морского змея', 'Камера эха', 'Подводный разлом',
    'Зонд у кромки', 'Спуск батискафа', 'Сад чёрных курильщиков'
  ];
  const answers = ['9', '2400', '19', '10', '3', '22', '8', '2', '20', '36', '120', '13', '8', '0,55', '70', '16', '7', '−2', '3', '12', '15'];

  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${origin}/ege-baza/${width === 320 ? '' : 'index.html#map'}`);
    const ocean = page.getByRole('region', { name: 'Подводная экспедиция' });
    await ocean.waitFor();
    assert.equal(await page.locator('[data-exam-position]').count(), 21, 'the numbered basic EGE catalogue remains intact');
    const atlas = ocean.locator('img.ocean-expedition-atlas');
    await atlas.evaluate(img => img.decode());
    assert.equal(await atlas.evaluate(img => img.naturalWidth), 1440);
    await fits(page, `base ocean and exam catalogue fit ${width}px`);
    const selector = ocean.getByRole('combobox', { name: 'Точка погружения' });
    const previous = ocean.getByRole('button', { name: 'Предыдущая точка' });
    const next = ocean.getByRole('button', { name: 'Следующая точка' });
    const task = ocean.locator('.ocean-expedition-task');
    const stage = ocean.locator('.ocean-expedition-scene');
    const scenes = new Set();
    const progressBefore = await page.evaluate(() => Object.entries(localStorage));
    assert.equal(await selector.locator('optgroup').count(), 7);
    assert.equal(await selector.locator('option').count(), 21);
    assert.equal(await previous.getAttribute('aria-disabled'), 'true');
    for (const [index, name] of pointNames.entries()) {
      const pos = index + 1;
      const pin = ocean.locator(`[data-ocean-point="${index}"]`);
      if (width === 320) {
        assert(!(await pin.isVisible()), 'dense desktop pins are replaced by the touch selector');
        await selector.selectOption(String(index));
        assert.equal(await ocean.locator('.ocean-expedition-mobile-pin').innerText(), String(pos));
      } else {
        await pin.click();
      }
      assert.equal(await pin.getAttribute('aria-pressed'), 'true', name);
      assert.equal(await selector.inputValue(), String(index), name);
      assert(await ocean.getByRole('heading', { name, exact: true }).isVisible(), name);
      assert.equal(await ocean.locator('.ocean-expedition-craft').innerText(), pos >= 19 ? 'Батискаф' : 'Подводная лодка');
      assert.equal(await task.getAttribute('href'), `#task?pos=${pos}`, name);
      scenes.add(await stage.evaluate(node => getComputedStyle(node).backgroundPosition));
      if (width === 320) {
        await ocean.locator('.ocean-expedition-mission summary').click();
        const mission = ocean.locator('form[data-ocean-mission]');
        const answer = mission.getByLabel('Ответ');
        const check = mission.getByRole('button', { name: 'Проверить', exact: true });
        const feedback = ocean.locator('[data-ocean-mission-feedback]');
        if (pos === 1) {
          await answer.fill('девять');
          await check.click();
          assert.equal(await feedback.innerText(), 'Введи число в поле «Ответ».');
          await answer.fill('8');
          await check.click();
          assert.match(await feedback.innerText(), /Сравни 8 × 8/);
        }
        if (pos === 3 || pos === 6) assert(await ocean.getByRole('table').isVisible(), name);
        if (pos === 8) assert.equal(await ocean.locator('.ocean-expedition-choices li').count(), 3);
        if (pos === 9) assert.equal(await ocean.locator('.ocean-expedition-grid [data-filled="1"]').count(), 20);
        await answer.fill(answers[index]);
        await check.click();
        assert.match(await feedback.innerText(), /^Верно\./, name);
        await fits(page, name + ' and its task fit the phone');
      } else {
        await task.click();
        await page.locator(`[data-exam-task="${pos}"]`).waitFor();
        await page.locator('#content a[href="#map"]').first().click();
        await ocean.getByRole('heading', { name, exact: true }).waitFor();
      }
    }
    assert.equal(scenes.size, 21, 'each point has its own close-up of the atlas');
    assert.equal(await next.getAttribute('aria-disabled'), 'true');
    assert.deepEqual(await page.evaluate(() => Object.entries(localStorage)), progressBefore, 'the expedition does not write course progress');
    await previous.press('Enter');
    assert(await ocean.getByRole('heading', { name: 'Спуск батискафа' }).isVisible(), 'keyboard selects the previous point');
    await next.press('Enter');
    if (width === 1280) {
      const lastPin = ocean.locator('[data-ocean-point="20"]');
      await lastPin.press('Home');
      const firstPin = ocean.locator('[data-ocean-point="0"]');
      assert(await firstPin.evaluate(node => node === document.activeElement), 'Home moves focus and selection to the first point');
      await firstPin.press('ArrowRight');
      assert(await ocean.getByRole('heading', { name: 'Мерный буй' }).isVisible());
      await ocean.locator('[data-ocean-point="1"]').press('End');
      assert.equal(await lastPin.getAttribute('aria-pressed'), 'true');
    }

    const canvas = ocean.locator('canvas');
    await canvas.scrollIntoViewIfNeeded();
    const resume = ocean.getByRole('button', { name: 'Включить анимацию' });
    assert(await resume.isVisible(), 'system preference pauses the ocean animation');
    const firstFrame = await canvas.evaluate(node => node.toDataURL());
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await canvas.evaluate(node => node.toDataURL()), firstFrame, 'ocean stays still when reduced motion is requested');
    await resume.click();
    const pause = ocean.getByRole('button', { name: 'Пауза анимации' });
    await pause.waitFor();
    await page.waitForFunction(frame => document.querySelector('.ocean-expedition canvas').toDataURL() !== frame, firstFrame);
    await pause.click();
    await resume.waitFor();

    await task.click();
    await page.locator('[data-exam-task="21"]').waitFor();
    await page.locator('#content a[href="#map"]').first().click();
    await ocean.getByRole('heading', { name: 'Сад чёрных курильщиков' }).waitFor();
  }
  await page.setViewportSize({ width: 768, height: 900 });
  await fits(page, 'the expedition scene fits the tablet sidebar layout');
}

(async () => {
  let browser;
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    await context.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await checkProfileRoutes(page, origin);
    await page.setViewportSize({ width: 320, height: 900 });
    await checkCreativePractice(page, origin);
    await checkOcean(page, origin);
    assert.deepEqual(errors, [], 'no unexpected browser errors');
    console.log('EGE_SKILL_MAP_OCEAN_BROWSER_OK');
  } finally {
    await browser?.close();
    if (server.listening) await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
