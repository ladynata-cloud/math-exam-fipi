'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');

const root = path.resolve(__dirname, '..');
const output = process.env.ARTIFACT_DIR || '/tmp/division-dialogue-browser';
const entries = ['/trainers/long-division-stepwise.html',
  '/trainers/oge-basics/multiplication-division/long-division-from-simple-to-decimals.html'];
const progressKey = 'mathExamBasics.guidedDivision.v1';
const preferenceKey = 'mathexam.divisionHelp.preference.v1';
const results = [];
const failures = [];
const mime = {'.html':'text/html;charset=utf-8', '.js':'text/javascript;charset=utf-8',
  '.json':'application/json', '.css':'text/css', '.svg':'image/svg+xml', '.png':'image/png',
  '.jpg':'image/jpeg', '.woff2':'font/woff2'};
fs.mkdirSync(output, {recursive:true});

const server = http.createServer((request, response) => {
  try {
    let file = path.resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://local').pathname));
    if (file !== root && !file.startsWith(root + path.sep)) return response.writeHead(403).end();
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    response.end(fs.readFileSync(file));
  } catch {
    response.writeHead(404).end();
  }
});

(async () => {
  let browser;
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const origin = 'http://127.0.0.1:' + server.address().port;
    browser = await chromium.launch({headless:true,
      ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.CHROMIUM_EXECUTABLE_PATH} : {})});
    for (const width of [320, 390, 1280]) {
      for (const [entryIndex, entry] of entries.entries()) {
        const viewport = {width, height:width < 600 ? 844 : 900};
        const context = await browser.newContext({viewport});
        // Synthetic pupils and QA questions must never reach production telemetry.
        await context.route('**/*', route => new URL(route.request().url()).origin === origin
          ? route.continue() : route.abort());
        const page = await context.newPage();
        page.setDefaultTimeout(10000);
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const last = () => page.locator('#division-conversation p:last-child span').innerText();
        const snapshot = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey);
        const ask = async text => {
          await page.locator('#division-question').fill(text);
          await page.locator('#division-question').press('Enter');
        };
        const openHelp = async () => {
          if (!(await page.locator('#division-question').isVisible())) await page.locator('.bh-toggle').click();
        };
        const open = async topic => {
          await page.goto(origin + entry + '#' + topic, {waitUntil:'load'});
          await page.locator('#division-dialogue').waitFor({state:'attached'});
          await page.waitForFunction(({key, selected}) =>
            JSON.parse(localStorage.getItem(key) || 'null')?.active === selected,
          {key:progressKey, selected:topic});
        };
        try {
          await open('quotientDigit');
          await page.locator('#answer').fill('8');
          await page.locator('#answer').press('Enter');
          await openHelp();
          await ask('Пробую 3');
          assert.match(await last(), /3 × 3/);
          await ask('9');
          assert.match(await last(), /9 с 12/);
          await ask('Меньше');
          assert.match(await last(), /Прибавь.*9.*3/);
          await ask('12');
          assert.match(await last(), /Ещё одна целая группа помещается/);
          const current = (await snapshot()).sessions.quotientDigit;
          assert.equal(current.step, 0);
          assert.equal(current.reveals, 0);
          assert.equal(current.draft, '8');
          assert.equal(await page.evaluate(key => localStorage.getItem(key), preferenceKey), null);
          assert.equal(await page.locator('#division-service-option').isVisible(), false);
          await page.locator('#division-dialogue').scrollIntoViewIfNeeded();
          const box = await page.locator('#division-dialogue').boundingBox();
          assert(box && box.x >= -1 && box.x + box.width <= width + 1, 'help stays inside viewport');
          await page.screenshot({path:path.join(output, `entry-${entryIndex}-${width}-digit.png`), fullPage:true});

          await open('decimalDivisor');
          await openHelp();
          await ask('Почему оба числа меняются?');
          await ask('Объясни проще');
          await ask('Ещё проще');
          assert.match(await last(), /единица измерения.*столько же/);
          await page.locator('#division-remember-help').check();
          const stored = await page.evaluate(key => localStorage.getItem(key), preferenceKey);
          assert.deepEqual(JSON.parse(stored), {version:1, enabled:true, intent:'why-simple'});
          const nativeBeforeReload = (await snapshot()).sessions.decimalDivisor;
          await page.reload({waitUntil:'load'});
          await page.locator('#division-dialogue').waitFor({state:'attached'});
          assert.equal(await page.locator('#division-remember-help').isChecked(), true);
          assert.equal((await snapshot()).sessions.decimalDivisor.step, nativeBeforeReload.step);
          await openHelp();
          await ask('Объясни проще');
          assert.match(await last(), /единица измерения.*столько же/);
          assert.equal((await snapshot()).sessions.decimalDivisor.reveals, 0);
          await page.locator('#division-dialogue').scrollIntoViewIfNeeded();
          await page.screenshot({path:path.join(output, `entry-${entryIndex}-${width}-memory.png`), fullPage:true});
          await page.locator('#division-forget-help').click();
          assert.equal(await page.evaluate(key => localStorage.getItem(key), preferenceKey), null);
          assert.equal(await page.locator('#division-remember-help').isChecked(), false);
          assert.deepEqual(errors, [], 'no page exceptions');
          results.push({entry, viewport, passed:true,
            scenarios:['numeric-dialogue','native-progress','why-simpler','preference-reload-reset']});
        } catch (error) {
          failures.push({entry, viewport, error:error.message, pageErrors:errors});
          await page.screenshot({path:path.join(output, `entry-${entryIndex}-${width}-failure.png`), fullPage:true}).catch(() => {});
        } finally {
          await context.close();
        }
      }
    }
    assert.equal(results.length, 6, JSON.stringify(failures));
    console.log('DIVISION_DIALOGUE_BROWSER_PASS', results.length);
  } catch (error) {
    failures.push({stage:'browser-run', error:error.message});
    process.exitCode = 1;
    console.error('DIVISION_DIALOGUE_BROWSER_FAIL', error.message);
  } finally {
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({results, failures}, null, 2) + '\n');
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
})();
