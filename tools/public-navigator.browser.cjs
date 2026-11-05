'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const pages = require('../assets/assistant/pages.json');
const catalogue = require('../assets/assistant/navigator-data.js').catalogue;
const origin = process.env.NAV_ORIGIN || 'http://127.0.0.1:8765';
const out = process.env.ARTIFACT_DIR || '/tmp/public-navigator-qa';
fs.mkdirSync(out, { recursive: true });
for (const item of catalogue) {
  if (!item.url.startsWith('/')) continue;
  const pathname = new URL(item.url, origin).pathname;
  assert.ok(fs.existsSync(path.join(process.cwd(), pathname, pathname.endsWith('/') ? 'index.html' : '')), item.url);
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const viewport of [{width:1280,height:900}, {width:320,height:640}, {width:844,height:390}]) {
      const context = await browser.newContext({ viewport });
      // Do not send synthetic QA text or page visits to production analytics.
      await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      for (const filename of pages) {
        const route = '/' + filename.replace(/index\.html$/, '');
        await page.goto(origin + route, { waitUntil: 'load' });
        const host = page.locator('#maxexam-public-assistant');
        const launcher = host.locator('.launcher');
        const panel = host.locator('.panel');
        await launcher.waitFor({ state: 'visible' });
        assert.equal(await host.count(), 1);
        assert.match(await launcher.innerText(), /Навигатор/);
        assert.equal(await panel.isVisible(), false);
        const box = await launcher.boundingBox();
        assert.ok(box.x > viewport.width / 2 && box.y > viewport.height / 2);
        assert.ok(box.x + box.width <= viewport.width && box.y + box.height <= viewport.height);
        assert.equal(await launcher.evaluate(e => getComputedStyle(e).position), 'fixed');
        if (filename === 'index.html') await page.screenshot({ path: path.join(out, `home-${viewport.width}.png`) });
        await launcher.click();
        await panel.waitFor({state:'visible'});
        const panelBox = await panel.boundingBox();
        assert.ok(panelBox.x >= 0 && panelBox.y >= 0 && panelBox.x + panelBox.width <= viewport.width);
        const input = host.locator('textarea');
        await input.fill('Я в 6 классе, надо делить уголком');
        await input.press('Enter');
        assert.equal(await host.locator('.navigator').last().locator('a').first().getAttribute('href'), '/trainers/long-division-stepwise.html');
        await input.fill('мой PIN — 1234');
        await host.locator('.send').click();
        assert.ok(!(await host.locator('.log').innerText()).includes('1234'));
        await input.press('Escape');
        assert.equal(await panel.isVisible(), false);
        await launcher.click();
        await host.locator('.clear').click();
        assert.equal(await host.locator('.visitor').count(), 0);
        await input.fill('Где найти графики ОГЭ?');
        await host.locator('.send').click();
        if (filename === 'index.html') await page.screenshot({ path: path.join(out, `chat-${viewport.width}.png`) });
        await host.locator('.icon-button').click();
        assert.equal(await panel.isVisible(), false);
        await page.reload({waitUntil:'load'});
        await launcher.waitFor({state:'visible'});
        assert.equal(await panel.isVisible(), false);
        results.push({route,viewport,launcher:box,passed:true});
      }
      assert.deepEqual(errors, []);
      await context.close();
    }
    fs.writeFileSync(path.join(out,'results.json'), JSON.stringify({result:'PUBLIC_NAVIGATOR_VISIBLE_OK', catalogue:catalogue.length, results},null,2));
    console.log('PUBLIC_NAVIGATOR_VISIBLE_OK', results.length, 'page/viewport journeys;', catalogue.length, 'catalogue entries');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
