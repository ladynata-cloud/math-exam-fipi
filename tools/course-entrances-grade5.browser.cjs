'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

module.exports = async function checkGrade5(browser, origin) {
  const shots = process.env.GRADE5_ENTRY_SHOTS;
  if (shots) await fs.mkdir(shots, {recursive: true});
  for (const [slug, pathname, count, start] of [
    ['peterson', '/school/peterson5/', 43, '.workshop-hero .button'],
    ['vilenkin', '/courses/vilenkin-5-part-1/', 29, '#startCourse']
  ]) {
    for (const width of [320, 390, 1280]) {
      const viewport = {width, height: width === 320 ? 740 : width === 390 ? 844 : 900};
      const plain = await browser.newContext({viewport, javaScriptEnabled: false});
      const active = await browser.newContext({viewport, reducedMotion: 'reduce'});
      try {
        const html = await plain.newPage(), page = await active.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const url = origin + pathname + '?from=catalog';
        const fit = async (view, state) => {
          assert.equal(await view.locator('h1').count(), 1);
          assert(await view.evaluate(() => document.documentElement.scrollWidth <= innerWidth), slug + ' ' + state + ' overflow');
          if (shots) await view.screenshot({path: path.join(shots, slug + '-' + width + '-' + state + '.png')});
        };
        await html.goto(url);
        await fit(html, 'html');
        const cta = html.locator('.entry-start');
        const bounds = await cta.boundingBox();
        assert(bounds.y + bounds.height <= viewport.height && bounds.height >= 44);
        const topics = await html.locator('.grade5-entry li a').evaluateAll(links => links.map(link =>
          ({hash: link.hash, title: link.textContent.trim(), height: link.offsetHeight})));
        assert.equal(new Set(topics.map(t => t.hash)).size, count);
        assert(topics.every(t => t.height >= 44));
        await cta.click();
        assert.equal(await html.locator(':target a').getAttribute('href'), topics[0].hash);
        await page.goto(url);
        await page.locator(start).first().waitFor();
        assert.equal(await page.locator('.grade5-entry').count(), 0);
        const launcher = page.locator('header nav #maxexam-public-assistant .launcher');
        await launcher.waitFor();
        assert.equal(await launcher.evaluate(el => getComputedStyle(el).position), 'static');
        await launcher.click();
        assert.equal(await launcher.getAttribute('aria-expanded'), 'true');
        await page.keyboard.press('Escape');
        assert.equal(await launcher.getAttribute('aria-expanded'), 'false');
        await page.evaluate(() => scrollTo(0, 0));
        await fit(page, 'course');
        await page.locator(start).first().click();
        const seen = width === 390 ? topics : [topics[0], topics.at(-1)];
        for (const topic of seen) {
          await page.goto(url + topic.hash);
          await page.getByRole('heading', {level: 1, name: topic.title, exact: true}).waitFor();
          assert.equal(new URL(page.url()).search, '?from=catalog');
          if (topic === topics[0]) await fit(page, 'lesson');
        }
        // During a delayed boot a normal HTML click must survive app initialization.
        let release;
        const paused = new Promise(done => {release = done});
        await page.route('**/app.js*', async route => {await paused; await route.continue()});
        await page.goto(url, {waitUntil: 'commit'});
        const last = topics.at(-1);
        try { await page.locator('.grade5-entry li a').last().click(); }
        finally { release(); }
        await page.getByRole('heading', {level: 1, name: last.title, exact: true}).waitFor();
        assert.equal(new URL(page.url()).hash, last.hash);
        if (slug === 'vilenkin' && width === 390) {
          await page.unroute('**/app.js*');
          await page.route('**/data/lessons-1.json', route => route.abort());
          await page.reload();
          await page.getByRole('button', {name: 'Повторить загрузку'}).waitFor();
          assert.equal(await page.locator('.grade5-entry li a').count(), count);
          await page.unroute('**/data/lessons-1.json');
          await page.getByRole('button', {name: 'Повторить загрузку'}).click();
          await page.getByRole('heading', {level: 1, name: last.title, exact: true}).waitFor();
        }
        assert.deepEqual(errors, []);
      } finally {
        await plain.close();
        await active.close();
      }
    }
  }
  console.log('GRADE5_ENTRY_ROUTES_OK: 43 + 29 native routes, delayed boot and three viewports');
};
