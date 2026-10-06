'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');
const course = path.resolve(__dirname, '../ege-profil/atanasyan-10-11');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 360, height: 800 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let checkedViews = 0;
  try {
    await page.setContent('<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><body><main id="model" style="max-width:420px;margin:auto"></main></body></html>');
    await page.addStyleTag({ path: path.join(course, 'model.css') });
    await page.addScriptTag({ path: path.join(course, 'model.js') });
    const cube = {
      points: { A: [0, 0, 0], B: [2, 0, 0], C: [2, 2, 0], D: [0, 2, 0], A1: [0, 0, 2], B1: [2, 0, 2], C1: [2, 2, 2], D1: [0, 2, 2], M: [1, 0, 0] },
      edges: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'], ['A1', 'B1'], ['B1', 'C1'], ['C1', 'D1'], ['D1', 'A1'], ['A', 'A1'], ['B', 'B1'], ['C', 'C1'], ['D', 'D1']],
      faces: [['A', 'B', 'C', 'D'], ['A1', 'B1', 'C1', 'D1'], ['A', 'B', 'B1', 'A1'], ['B', 'C', 'C1', 'B1'], ['C', 'D', 'D1', 'C1'], ['D', 'A', 'A1', 'D1']],
      views: { neutral: { label: 'Куб', segments: [], polygon: [] }, section: { label: 'Сечение', segments: [['M', 'C1']], polygon: ['M', 'C', 'C1'] } }
    };
    await page.evaluate(model => { window.source = model; window.before = JSON.stringify(model); window.viewer = AtanasyanModel.mount(document.getElementById('model'), model); }, cube);
    assert.equal(await page.locator('[data-point="M"]').count(), 0, 'unused auxiliary point is withheld');
    assert.equal(await page.locator('[data-label="A1"]').textContent(), 'A₁');
    assert.equal(await page.locator('[data-hidden="true"]').count(), 3, 'three genuinely occluded edges of a generic cube view');
    await page.locator('svg').focus();
    await page.keyboard.press('ArrowRight');
    const rotated = await page.evaluate(() => viewer.getState());
    await page.evaluate(() => viewer.setView('section'));
    assert.equal(await page.locator('[data-point="M"]').count(), 1);
    assert.equal(await page.evaluate(() => viewer.getState().yaw), rotated.yaw, 'step highlight preserves camera');
    assert.equal(await page.locator('[data-highlight="plane"]').count(), 1);
    assert.equal(await page.locator('[data-highlight="segment"]').count(), 1);
    const box = await page.locator('svg').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 45, box.y + box.height / 2 - 20, { steps: 3 });
    await page.mouse.up();
    assert.notEqual(await page.evaluate(() => viewer.getState().yaw), rotated.yaw, 'pointer drag rotates');
    await page.getByRole('button', { name: 'Вернуть исходный вид', exact: true }).click();
    assert.equal(await page.evaluate(() => viewer.getState().yaw), -0.62);
    assert.equal(await page.evaluate(() => JSON.stringify(source) === before), true, 'rotation never mutates geometry');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, '360px has no overflow');
    assert.equal(await page.evaluate(() => AtanasyanModel.mount(document.getElementById('model'), source) && document.querySelectorAll('.atanasyan-model').length), 1, 'remount cleans old model');
    await page.evaluate(() => { viewer = AtanasyanModel.mount(document.getElementById('model'), source); viewer.destroy(); });
    assert.equal(await page.locator('svg').count(), 0, 'destroy removes the viewer');

    const lessons = [...require(path.join(course, 'lessons-a.js')), ...require(path.join(course, 'lessons-b.js'))];
    for (const lesson of lessons) {
      await page.evaluate(model => { window.source = model; window.before = JSON.stringify(model); window.viewer = AtanasyanModel.mount(document.getElementById('model'), model); }, lesson.model);
      for (const key of Object.keys(lesson.model.views)) {
        await page.evaluate(key => viewer.setView(key), key);
        for (const direction of ['Повернуть влево', 'Наклонить вверх', 'Повернуть вправо', 'Наклонить вниз']) {
          await page.getByRole('button', { name: direction, exact: true }).click();
          const invalid = await page.locator('svg').evaluate(svg => [...svg.querySelectorAll('[d],[x],[y],[cx],[cy]')].some(node => [...node.attributes].some(attribute => /^(d|x|y|cx|cy)$/.test(attribute.name) && /NaN|Infinity|undefined/.test(attribute.value))));
          assert.equal(invalid, false, lesson.id + ' ' + key + ' has finite projected geometry');
        }
        checkedViews++;
      }
      assert.equal(await page.evaluate(() => JSON.stringify(source) === before), true, lesson.id + ' coordinates unchanged');
    }
    assert.deepEqual(errors, []);
    console.log('ATANASYAN_MODEL_OK', JSON.stringify({ models: lessons.length, views: checkedViews, width: 360, keyboard: true, drag: true, hiddenEdges: true, preservedCamera: true, immutableCoordinates: true }));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
