'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '../..');
const topic = 'pogorelov-base-7-16';
const other = 'pogorelov-base-8-62';
const url = id => `http://geometry.test/geometry-pogorelov/atlas/${id}.html`;
const primary = (page, id) => page.evaluate(key => JSON.parse(localStorage.getItem(GeoStore.KEY)).units[key], id);
async function download(page) {
  const received = page.waitForEvent('download');
  await page.locator('#export-progress').click();
  const stream = await (await received).createReadStream();
  const chunks = [];
  for await (const part of stream) chunks.push(part);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.GEOMETRY_CHROMIUM || chromium.executablePath() });
  try {
    const context = await browser.newContext();
    await context.route('http://geometry.test/**', async route => {
      const file = path.join(root, new URL(route.request().url()).pathname);
      try { await route.fulfill({path: file}); }
      catch { await route.fulfill({status: 404,body: ''}); }
    });
    const first = await context.newPage();
    const second = await context.newPage();
    await first.goto(url(topic));
    await second.goto(url(topic));
    // An ordinary visit in another tab records a start event, not a conflict.
    await first.locator('[data-stage="1"]').click();
    const observation = 'В первом построении изменяю положение вершины.';
    await first.locator('#observation').fill(observation);
    await first.waitForFunction(({id,note}) => JSON.parse(localStorage.getItem(GeoStore.KEY)).units[id].observation === note, {id: topic,note: observation});
    assert.equal(await first.locator('#storage-notice').isVisible(), false);
    const saved = await primary(first, topic);
    await second.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    assert.deepEqual(await primary(first, topic), saved);

    await second.locator('[data-stage="4"]').click();
    await second.locator('#answer').fill('17');
    await second.waitForFunction(() => document.getElementById('storage-notice').textContent.includes('Скачать прогресс'));
    const backup = (await download(second)).units[topic];
    assert.equal(backup.draft, '17');
    assert.notEqual(backup.seed, saved.seed);
    assert.equal(backup.observation, '');
    assert.deepEqual(await primary(first, topic), saved);
    await second.reload();
    await second.locator('#answer').waitFor();
    assert.equal(await second.locator('#answer').inputValue(), '17');
    assert.equal((await download(second)).units[topic].draft, '17');

    // A second lesson can save normally even while this tab has an alternate first lesson.
    await second.goto(url(other));
    await second.locator('[data-stage="1"]').click();
    await second.locator('#observation').fill('Другая тема: сопоставляю катет и гипотенузу.');
    await download(second);
    assert.match((await primary(first, other)).observation, /гипотенузу/);
    const canonical = (await download(first)).units[topic];
    assert.equal(canonical.observation, observation);
    assert.equal(canonical.seed, saved.seed);
    assert.equal(canonical.draft, '');
    console.log('POGORELOV_TAB_CONFLICT_OK two tabs, variants, reload, independent lessons and both exports');
  } finally { await browser.close(); }
})().catch(error => { console.error(error);process.exitCode=1; });
