'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');

async function run() {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH });
  try {
    const output = path.join(root, 'artifacts/oge-navigation-minimal');
    fs.mkdirSync(output, { recursive: true });
    for (const width of [320, 360, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(pathToFileURL(path.join(root, 'trainers/oge-course/index.html')).href);
      await page.getByRole('heading', { name: 'Подготовка к ОГЭ', exact: true }).waitFor();
      assert.equal(await page.locator('details[open]').count(), 0);
      assert.equal(await page.locator('#part1 .entry').count(), 10);
      assert.equal(await page.locator('#geometry .entry').count(), 5);
      assert.equal(await page.locator('#part2 .entry').count(), 6);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.screenshot({ path: path.join(output, 'course-' + width + '.png'), fullPage: true });

      await page.getByRole('link', { name: 'Повторить основы', exact: true }).click();
      await page.locator('#gaps[open]').waitFor({ state: 'attached' });
      assert.equal(await page.locator('#gaps').getAttribute('open'), '');
      assert(await page.locator('#gaps .entry').first().isVisible());
      await page.locator('#downloads > summary').click();
      const fractionZip = page.locator('#downloads').getByRole('link', { name: '№6 · обыкновенные и десятичные дроби · ZIP', exact: true });
      assert(await fractionZip.isVisible());
      assert.equal(await fractionZip.getAttribute('href'), '/downloads/trainers/oge-task6-fractions/oge-task6-fractions-package.zip');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));

      await page.goto(pathToFileURL(path.join(root, 'oge/index.html')).href);
      const start = page.getByRole('link', { name: 'Начать с графиков №11', exact: true });
      await start.waitFor();
      assert.equal(await start.getAttribute('href'), '/oge/skills/?topic=n11');
      assert(await page.getByRole('link', { name: 'Все 25 тем ↓', exact: true }).first().isVisible());
      assert.equal(await page.locator('details[open]').count(), 0);
      await page.getByText('Информатика', { exact: true }).click();
      assert(await page.getByRole('link', { name: 'ОГЭ по информатике · задания 1–10 →', exact: true }).isVisible());
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('OGE_NAVIGATION_MINIMAL_BROWSER_OK');
  } finally {
    await browser.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
