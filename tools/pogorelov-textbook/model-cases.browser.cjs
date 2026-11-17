'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

async function checkCases() {
  const url = pathToFileURL(path.resolve(__dirname, '../../geometry-pogorelov/textbook/index.html'));
  const browser = await chromium.launch();
  try {
    for (const width of [320, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const id of ['p5-n11', 'p7-n4', 'p12-n2']) {
        await page.goto(url.href + '#task/' + id);
        const select = page.locator('#model-case');
        const drawing = page.locator('#drawing svg');
        const original = await drawing.innerHTML();
        await page.locator('#answer-0').fill('2+');
        await select.selectOption('1');
        assert.notEqual(await drawing.innerHTML(), original);
        assert.equal(await page.locator('#answer-0').inputValue(), '2+');
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        const caption = await page.locator('figcaption').innerText();
        await page.locator('#enlarge').click();
        assert.equal(await page.locator('dialog p.info').innerText(), caption);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#enlarge').evaluate(el => el === document.activeElement), true);
        await select.selectOption('0');
        assert.equal(await drawing.innerHTML(), original);
      }
      assert.deepEqual(errors, []);
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

checkCases().catch(error => { console.error(error); process.exitCode = 1; });
