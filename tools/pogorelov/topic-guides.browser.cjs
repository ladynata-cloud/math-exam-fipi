'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const {chromium} = require('playwright');
const recipes = require('./guide-recipes.json');
const replayGuideRecipe = require('./replay-guide-recipe.cjs');

const root = path.resolve(__dirname, '../..');
const course = require(path.join(root, 'geometry-pogorelov/data/course.json'));
const topicPoints = [16, 20, 39, 61, 62, 67, 80, 98, 112, 127, 131];
const guideSelector = '[data-pogorelov-topic-guide]';
const origin = 'http://geometry.test';

function mediaType(url) {
  const pathname = new URL(url).pathname;
  if (pathname.startsWith('/assets/geometry-experiment-gifs/')) {
    return path.extname(pathname).toLowerCase();
  }
  return '';
}

async function frame(guide, type) {
  const visible = guide.locator('img[src$="' + type + '"]:visible');
  await visible.first().waitFor();
  await guide.page().waitForFunction(({selector, type}) => {
    const img = document.querySelector(selector + ' img');
    return img?.getAttribute('src') && new URL(img.src).pathname.endsWith(type) &&
      img.currentSrc === img.src && img.complete && img.naturalWidth > 0;
  }, {selector: guideSelector, type}, {timeout: 5000});
  assert.equal(await guide.locator('img:visible').count(), 1, 'Exactly one guide image is visible');
  const url = await visible.evaluate(async img => {
    await img.decode();
    if (!img.naturalWidth || !img.naturalHeight) throw Error('The frame is empty');
    return img.currentSrc;
  });
  assert.equal(mediaType(url), type, url);
  return url;
}

async function openLesson(page, unit) {
  await page.goto(origin + '/geometry-pogorelov/atlas/' + unit.id + '.html');
  await page.locator('[data-stage="1"]').click();
  await page.locator('#geo-board canvas').waitFor();
}

async function savedUnit(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem(GeoStore.KEY)).units[COURSE_CONFIG.unit.id]);
}

async function demonstratePerpendicular(page, board) {
  await board.locator('[data-tool="perpendicular"]').click();
  for (const point of ['C', 'A', 'B']) {
    await board.locator('.point-select').selectOption(point);
    await board.locator('[data-act="select"]').click();
  }
  assert.match(await board.locator('.lab-readout').innerText(), /90°/);
  await page.waitForFunction(() => {
    const saved = JSON.parse(localStorage.getItem(GeoStore.KEY)).units[COURSE_CONFIG.unit.id];
    return saved.construction && saved.drawing;
  });
}

async function main() {
  const browser = await chromium.launch({
    executablePath: process.env.GEOMETRY_CHROMIUM || chromium.executablePath()
  });
  try {
    const page = await browser.newPage({viewport: {width: 1152, height: 864}});
    page.setDefaultTimeout(5000);
    const errors = [];
    const requests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      if (mediaType(request.url())) requests.push(request.url());
    });
    await page.route(origin + '/**', async route => {
      const requested = new URL(route.request().url());
      try {
        await route.fulfill({path: path.join(root, requested.pathname)});
      } catch (error) {
        if (mediaType(requested)) errors.push(requested.pathname + ': ' + error.message);
        await route.fulfill({status: 404, body: ''});
      }
    });

    const uniqueFirstFrames = new Set();
    assert.deepEqual(recipes.map(r => r.topicPoint).sort((a, b) => a - b), topicPoints);
    let replayedSteps = 0;
    for (const point of topicPoints) {
      const unit = course.units.find(item => item.points[0] === point);
      assert.ok(unit, 'Textbook section ' + point);
      const before = requests.length;
      await openLesson(page, unit);
      const guide = page.locator(guideSelector);
      await guide.waitFor({state: 'attached'});
      const summary = guide.locator('summary');
      const details = summary.locator('..');
      assert.equal(await guide.count(), 1, unit.id);
      assert.equal(await details.evaluate(el => el.open), false, unit.id);
      assert.equal(requests.length, before, 'Closed guide fetched media in ' + unit.id);

      if (point === 16) await demonstratePerpendicular(page, page.locator('#geo-board'));
      const observation = 'Моё наблюдение по пункту ' + point;
      await page.locator('#observation').fill(observation);
      await page.waitForFunction(note => {
        const unit = JSON.parse(localStorage.getItem(GeoStore.KEY)).units[COURSE_CONFIG.unit.id];
        return unit.observation === note;
      }, observation);
      const saved = await savedUnit(page);
      const boardReadout = await page.locator('#geo-board .lab-readout').innerText();

      await summary.focus();
      await page.keyboard.press('Enter');
      const definition = await page.evaluate(point => window.PogorelovTopicGuideIndex[point], point);
      assert.ok(definition.steps.length >= 2, unit.id);
      const first = await frame(guide, '.png');
      assert.ok(new URL(first).pathname.endsWith('/' + definition.id + '-01.png'));
      assert.ok(!uniqueFirstFrames.has(first), 'A different topic reused ' + first);
      uniqueFirstFrames.add(first);
      assert.equal(requests.slice(before).filter(url => mediaType(url) === '.gif').length, 0);
      const caption = guide.locator('[data-guide-caption]');
      const next = guide.locator('[data-guide-next]');
      for (const [index, step] of definition.steps.entries()) {
        if (index > 0) await next.click();
        const expectedFrame = definition.id + '-' + String(index + 1).padStart(2, '0') + '.png';
        assert.ok(new URL(await frame(guide, '.png')).pathname.endsWith('/' + expectedFrame), expectedFrame);
        assert.equal(await caption.innerText(), step, expectedFrame);
        const readout = guide.locator('[data-guide-readout]');
        assert.ok(definition.readouts[index].length > 0, expectedFrame);
        assert.equal(await readout.innerText(), definition.readouts[index], expectedFrame);
        const count = await guide.locator('[data-guide-position]').innerText();
        assert.deepEqual(count.match(/\d+/g).map(Number), [index + 1, definition.steps.length]);
      }
      await guide.locator('[data-guide-prev]').click();
      assert.equal(await caption.innerText(), definition.steps.at(-2), unit.id);
      const play = guide.locator('[data-guide-play]');
      await play.click();
      const clip = await frame(guide, '.gif');
      assert.ok(new URL(clip).pathname.endsWith('/' + definition.id + '.gif'));
      await play.click();
      await frame(guide, '.png');
      await play.click();
      await frame(guide, '.gif');
      await summary.click();
      assert.equal(await guide.locator('img:visible').count(), 0);
      await summary.click();
      await frame(guide, '.png');
      assert.deepEqual(await savedUnit(page), saved, 'Viewing guide changed learner progress in ' + unit.id);
      assert.equal(await page.locator('#observation').inputValue(), observation);
      assert.equal(await page.locator('#geo-board .lab-readout').innerText(), boardReadout);
      const recipe = recipes.find(r => r.topicPoint === point);
      await replayGuideRecipe(page, recipe, definition);
      replayedSteps += recipe.steps.length;
      await page.locator('[data-stage="2"]').click();
      assert.equal(await page.locator(guideSelector).count(), 0);
    }

    const mobile = course.units.find(unit => unit.points[0] === 131);
    await page.setViewportSize({width: 320, height: 720});
    await page.emulateMedia({reducedMotion: 'reduce'});
    await openLesson(page, mobile);
    const guide = page.locator(guideSelector);
    await guide.locator('summary').click();
    await frame(guide, '.png');
    await guide.locator('[data-guide-next]').click();
    await frame(guide, '.png');
    assert.ok(await guide.locator('[data-guide-readout]').evaluate(el =>
      parseFloat(getComputedStyle(el).fontSize) >= 14), 'Measurements must be legible on mobile');
    const bounds = await guide.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const image = [...el.querySelectorAll('img')].find(img => img.offsetWidth);
      const imageRect = image.getBoundingClientRect();
      return [rect.left, rect.right, imageRect.left, imageRect.right];
    });
    assert.ok(Math.min(bounds[0], bounds[2]) >= -1 && Math.max(bounds[1], bounds[3]) <= 321,
      'The mobile guide extends beyond 320 px: ' + bounds);
    // A learner on a slow connection can still use all still frames when a GIF fails.
    const forMobile = await page.evaluate(() => window.PogorelovTopicGuideIndex[131]);
    const clipPattern = '**/' + forMobile.id + '.gif';
    await page.route(clipPattern, route => route.fulfill({status: 404, body: ''}));
    await guide.locator('[data-guide-play]').click();
    await guide.locator('[data-guide-error]').waitFor();
    await frame(guide, '.png');
    assert.equal(await guide.locator('[data-guide-play]').getAttribute('aria-pressed'), 'false');
    await guide.locator('[data-guide-next]').click();
    await frame(guide, '.png');
    await page.unroute(clipPattern);

    const other = course.units.find(unit => !unit.topicQuestion && !unit.space);
    const beforeOther = requests.length;
    await openLesson(page, other);
    assert.equal(await page.locator(guideSelector).count(), 0, other.id);
    assert.equal(requests.length, beforeOther);
    assert.deepEqual(errors, []);
    console.log('POGORELOV_TOPIC_GUIDES_OK: 11 guides, ' + replayedSteps +
      ' steps reproduced on the lesson board, opt-in animation, 320 px, progress and construction preserved');
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
