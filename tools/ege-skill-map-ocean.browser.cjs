'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const mediaTypes = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml'
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
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${origin}/ege-baza/#map`);
    const ocean = page.getByRole('region', { name: 'Подводная экспедиция' });
    await ocean.waitFor();
    assert.equal(await page.locator('[data-exam-position]').count(), 21, 'the numbered basic EGE catalogue remains intact');
    await fits(page, `base ocean and exam catalogue fit ${width}px`);
    const craft = ocean.locator('.ocean-expedition-craft');
    const stationSelect = ocean.getByRole('combobox', { name: 'Станция' });
    const next = ocean.getByRole('button', { name: 'Следующая станция' });
    const stationNames = ['Поверхность океана', 'Коралловый риф', 'Водоворот', 'Затонувшие корабли', 'Атлантида', 'Логово чудовищ', 'Марианская впадина'];
    const links = [];
    for (const [index, name] of stationNames.entries()) {
      const pin = ocean.locator(`[data-ocean-station="${index}"]`);
      if (width === 320) await stationSelect.selectOption(String(index));
      else await pin.press('Enter');
      assert.equal(await pin.getAttribute('aria-pressed'), 'true', name);
      assert(await ocean.getByRole('heading', { name }).isVisible(), name);
      assert.equal(await craft.innerText(), index === 6 ? 'Батискаф' : 'Подводная лодка');
      links.push(...await ocean.locator('.ocean-expedition-tasks a').evaluateAll(nodes => nodes.map(node => node.hash)));
      if (width === 320 && index === 0) {
        const progress = await page.evaluate(() => localStorage.getItem('mathexam.ege-baza.path.v1'));
        await ocean.locator('.ocean-expedition-mission summary').click();
        const mission = ocean.locator('form[data-ocean-mission]');
        await mission.locator('input[name="answer"]').fill('9');
        await mission.getByRole('button', { name: 'Проверить', exact: true }).click();
        assert.match(await ocean.locator('[data-ocean-mission-feedback]').innerText(), /^Верно/);
        assert.equal(await page.evaluate(() => localStorage.getItem('mathexam.ege-baza.path.v1')), progress, 'expedition practice does not write exam progress');
      }
    }
    assert.deepEqual(links, Array.from({ length: 21 }, (_, index) => `#task?pos=${index + 1}`), 'all ocean links point to the corresponding exam number');
    assert.equal(await next.getAttribute('aria-disabled'), 'true');
    await ocean.getByRole('button', { name: 'Предыдущая станция' }).press('Enter');
    assert(await ocean.getByRole('heading', { name: 'Логово чудовищ' }).isVisible(), 'keyboard piloting selects the previous station');
    await next.press('Enter');

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

    await ocean.locator('a[href="#task?pos=21"]').click();
    await page.locator('[data-exam-task="21"]').waitFor();
    await page.locator('#content a[href="#map"]').first().click();
    await ocean.waitFor();
    assert(await ocean.getByRole('heading', { name: 'Марианская впадина' }).isVisible(), 'returning from a task restores the current station');
  }
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
