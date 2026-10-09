'use strict';
// Public foundations navigation only. These are software scenarios, not real
// pupil observations; visits must never be treated as completed learning.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('playwright');
const preparation = require('../learning/preparation-map.js');

const root = path.resolve(__dirname, '..');
const CABINET = 'https://mathexam-board-ladynata.amvera.io';
const VISITS_KEY = 'mathExamFoundations.visits.v1';
const screenshots = process.env.FOUNDATIONS_SCREENSHOTS;
const errors = [];
const server = http.createServer((req, res) => {
  try {
    let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://fixture').pathname));
    if (file !== root && !file.startsWith(root + path.sep)) return res.writeHead(403).end();
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    res.setHeader('Content-Type', ({
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8'
    })[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  } catch (_) { res.writeHead(404).end(); }
});
let origin;

async function ready(page, hash = '') {
  await page.goto(origin + '/foundations/' + hash);
  await page.waitForFunction(() => window.LearningPreparation && document.querySelectorAll('.stage').length === window.LearningPreparation.groups.length);
}
async function view(page, name) {
  await page.locator('#tab-' + name).click();
  await page.waitForFunction(id => document.getElementById('tab-' + id).getAttribute('aria-selected') === 'true', name);
}
async function reflow(page, label) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label + ': no horizontal overflow');
}
async function cabinetDestinations(page) {
  const links = await page.locator('a[href]').evaluateAll(nodes => nodes.map(node => node.href).filter(href => new URL(href).pathname === '/learning/'));
  assert(links.length > 4, 'Cabinet actions exist in the header, route and footer');
  for (const href of links) assert.equal(new URL(href).origin, CABINET, 'Public links must use the working account origin, not GitHub Pages');
}
async function shot(page, name) {
  if (!screenshots) return;
  fs.mkdirSync(screenshots, {recursive:true});
  await page.screenshot({path:path.join(screenshots, name + '.png'), fullPage:false});
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = 'http://127.0.0.1:' + server.address().port;
  let browser;
  try {
    browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.CHROMIUM_EXECUTABLE_PATH} : {})});
    for (const width of [1280, 390, 320]) {
      const context = await browser.newContext({viewport:{width,height:900}});
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(width + ': ' + error.message));
      try {
        await ready(page);
        assert.equal(await page.locator('.stage').count(), 12);
        await reflow(page, 'Route at ' + width);
        await cabinetDestinations(page);
        await shot(page, 'foundations-route-' + width);

        // The shortcut must also reopen a section after the hash is unchanged.
        await page.locator('[data-topic="division"]').click();
        await page.waitForFunction(() => document.getElementById('stage-division').open);
        await page.locator('#stage-division > summary').click();
        assert.equal(await page.locator('#stage-division').getAttribute('open'), null);
        await page.locator('[data-topic="division"]').click();
        assert.notEqual(await page.locator('#stage-division').getAttribute('open'), null);
        const taskURL = await page.locator('#stage-division a[data-visit]').first().getAttribute('href');
        assert(taskURL.startsWith(CABINET + '/learning/#practice=oge-basics%3A'));

        await view(page, 'laboratory');
        assert.equal(await page.locator('#panel-tasks').isHidden(), true);
        assert.equal(await page.locator('#laboratory-list .item').count(), preparation.allItems.length);
        await cabinetDestinations(page);
        await page.locator('#lab-search').fill('запятые');
        assert.equal(await page.locator('#laboratory-list .item').count(), 1);
        assert((await page.locator('#laboratory-list .item-main a').getAttribute('href')).includes('arifmetika.html?course=preoge&level=n5f'));
        await page.locator('#lab-search').fill('небывалаятема');
        assert.equal(await page.locator('#laboratory-list .item').count(), 0);
        assert((await page.locator('#lab-count').textContent()).includes('пока не нашли'));
        await page.locator('#lab-search').fill('деление');
        assert(await page.locator('#laboratory-list .item').count() > 5);
        await reflow(page, 'Laboratory at ' + width);
        await shot(page, 'foundations-laboratory-' + width);
        await page.locator('#tab-laboratory').focus();
        await page.keyboard.press('ArrowLeft');
        await page.waitForFunction(() => document.getElementById('tab-tasks').getAttribute('aria-selected') === 'true');
        assert.equal(await page.locator('#tab-tasks').evaluate(element => element === document.activeElement), true);

        // Follow the actual public trainer and return; no result is fabricated.
        await ready(page, '#laboratory');
        await page.locator('#lab-search').fill('запятые');
        await page.locator('#laboratory-list .item-main a').click();
        await page.waitForURL('**/trainers/arifmetika.html?course=preoge&level=n5f');
        await page.goBack();
        await page.locator('#resume:not([hidden])').waitFor();
        assert((await page.locator('#resume').textContent()).includes('история открытий'));
        assert((await page.locator('#resume a').getAttribute('href')).includes('level=n5f'));
        const stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), VISITS_KEY);
        assert.equal(Object.keys(stored.visits).length, 1);
        assert.equal(stored.last.id, 'public:decimal-linked');
        assert.deepEqual(Object.keys(stored).sort(), ['last', 'version', 'visits']);

        // Resuming a managed topic must retain the absolute cabinet destination.
        await page.evaluate(key => localStorage.setItem(key, JSON.stringify({version:1,visits:{},last:{id:'path:pre7-place-value',mode:'tasks'}})), VISITS_KEY);
        await ready(page);
        assert.equal(await page.locator('#resume a').getAttribute('href'), CABINET + '/learning/#practice=path%3Apre7-place-value');
        console.log('PASS foundations ' + width + 'px: route, laboratory, keyboard, real return, visit-only history and cabinet destinations');
      } finally { await context.close(); }
    }

    const blocked = await browser.newContext();
    try {
      await blocked.addInitScript(() => Object.defineProperty(window, 'localStorage', {get(){throw Error('fixture storage denial');}}));
      const page = await blocked.newPage();
      page.on('pageerror', error => errors.push('storage denied: ' + error.message));
      await ready(page);
      assert((await page.locator('#visits-note').textContent()).includes('не разрешил'));
      await view(page, 'laboratory');
      assert.equal(await page.locator('#laboratory-list .item').count(), preparation.allItems.length);
    } finally { await blocked.close(); }

    // A public laboratory deep link opens the intended lesson from its first
    // explanation. It must not require ?practice=1 to resolve the topic.
    const source = await browser.newPage();
    source.on('pageerror', error => errors.push('source lesson: ' + error.message));
    await source.goto(origin + '/ege-baza/path/index.html#lesson=pre7-place-value');
    await source.locator('h1').waitFor();
    assert.equal((await source.locator('h1').textContent()).trim(), 'Разряды числа и важные нули');
    assert((await source.locator('.stage-nav [aria-current="step"]').textContent()).includes('Понять'));
    await source.close();
    assert.deepEqual(errors, [], 'No browser JavaScript exceptions');
    console.log('FOUNDATIONS_PUBLIC_BROWSER_OK');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); if (errors.length) console.error('Browser errors:', errors); server.close(); process.exitCode = 1; });
