'use strict';

// Actual standalone pages: the longest object names must fit narrow phones,
// while the selected-object instruction keeps their complete readable names.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
const output = process.env.GEOMETRY_OBJECT_LABEL_ARTIFACTS;

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const results = [], errors = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(error.message));
    if (output) fs.mkdirSync(output, { recursive: true });
    for (const width of [1280, 360, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const id of ['segments', 'trig-circle']) {
        await page.goto(pathToFileURL(path.join(root, 'geometry-course/atlas', id + '.html')).href);
        await page.locator('[data-stage="1"]').click();
        await page.locator('[data-tool="intersection"]').click();
        const first = await page.locator('.object-select option').first().textContent();
        assert.equal(first, id === 'segments' ? 'Отрезок AB' : 'Окружность с центром O через точку A');
        await page.locator('[data-act="object"]').click();
        assert((await page.locator('.tool-instruction').textContent()).includes(first));
        const size = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: innerWidth }));
        assert(size.content <= size.viewport + 1, `${id} overflows at ${width}px`);
        if (output) await page.screenshot({ path: path.join(output, `geolab-${id}-${width}.png`), fullPage: true });
        results.push({ id, width, completeSelectionName: true, overflow: false });
      }
    }
    assert.deepEqual(errors, []);
    process.stdout.write(JSON.stringify({ gate: 'GEOMETRY_OBJECT_LABEL_BROWSER_OK', results }) + '\n');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
