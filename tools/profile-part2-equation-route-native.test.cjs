'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..');
const slug = 'ege-profil-part-two';
const packageDir = path.join(root, 'downloads/trainers', slug);
const steps = ['coordinates', 'turns', 'identities', 'families', 'equivalence',
  'substitution', 'factors', 'lost-roots', 'interval', 'exam'];
const legacyTask = 'p14-circle-selection-4';
const legacyNote = 'Обе точки имеют абсциссу −1/2. Проверю четверти.';
const exactAnswer = {
  coordinates: '5/12', turns: '3pi/4', identities: '119/169',
  families: 'x=pi/3+pi*k; x=-pi/3+pi*k',
  substitution: 'x=pi*k; x=pi/6+pi*k; x=-pi/6+pi*k',
  factors: 'x=pi/2+pi*k; x=-pi/4+pi*k',
  interval: '7pi/6; 11pi/6; 19pi/6'
};

function site() {
  const mimes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.gif': 'image/gif' };
  return http.createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost');
    const file = path.resolve(root, '.' + url.pathname, url.pathname.endsWith('/') ? 'index.html' : '');
    if (!file.startsWith(root + path.sep)) return response.writeHead(403).end();
    fs.readFile(file, (error, body) => {
      if (error) return response.writeHead(404).end();
      response.writeHead(200, { 'Content-Type': (mimes[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8' }).end(body);
    });
  });
}

async function journey(page, url) {
  await page.goto(url + '#task/' + legacyTask + '/independent');
  await page.locator('#proof-draft').fill(legacyNote);
  await page.locator('#final-0').fill('x=2pi/3+2pi*k; x=4pi/3+2pi*k');
  await page.locator('#final-1').fill('4pi/3; 2pi/3');
  await page.locator('#final-form button[type=submit]').click();
  await page.locator('#completion').waitFor();
  const readLegacy = () => page.evaluate(async id => {
    await ProfilePartTwoApp.store.flush();
    return localStorage.getItem(ProfilePartTwoApp.store.key(id));
  }, legacyTask);
  const saved = await readLegacy();
  assert.equal(JSON.parse(saved).independent, true);
  assert.equal(JSON.parse(saved).drafts.proof, legacyNote);

  await page.goto(url + '#fipi/2027/13');
  await page.locator('[data-school-start]').press('Enter');
  const route = page.locator('#school-route');
  const select = route.locator('[data-school-step]');
  const title = route.locator('[data-school-title]');
  const answer = route.locator('[data-school-answer]');
  const feedback = route.locator('[data-school-feedback]');
  const check = route.locator('[data-school-check]');
  await title.waitFor();
  assert.deepEqual(await select.locator('option').evaluateAll(options => options.map(o => o.value)), steps);
  for (const step of steps) {
    await page.waitForFunction(id => document.querySelector('[data-school-step]')?.value === id, step);
    assert((await title.innerText()).length > 6);
    const example = route.locator('details').first();
    await example.locator('summary').press('Enter');
    assert(await example.locator('li').count() >= 2);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), step + ' fits horizontally');
    if (step === 'exam') break;
    if (step === 'coordinates') {
      const angle = route.locator('#school-circle-angle');
      await angle.fill('90');
      assert.match(await route.locator('[data-school-circle-values]').innerText(), /не определ[её]н/);
      await answer.fill('12/5');
      await check.click();
      assert.match(await feedback.innerText(), /ординату/i);
      await route.locator('[data-school-hint]').click();
      await page.reload();
      assert.equal(await answer.inputValue(), '12/5');
      assert(await route.locator('.hint').first().isVisible());
    }
    if (step in exactAnswer) await answer.fill(exactAnswer[step]);
    else if (step === 'equivalence') await answer.nth(1).check();
    else await route.getByRole('radio', { name: /x = π \+ 2πk/ }).check();
    await check.click();
    assert.match(await feedback.innerText(), /^Верно\./, step);
    if (step === 'interval') {
      await route.locator('a[href="#lesson/p14-circle-selection/model"]').click();
      await page.locator('#model-lab[open] [data-lab-prediction]').waitFor();
      // Hold the next frame until the pupil has focused the navigation link.
      // A callback from the previous render must not take the next Enter key.
      const now = Date.now();
      await page.clock.install({ time: now });
      await page.clock.pauseAt(now + 60000);
      await page.goBack();
      await title.waitFor();
      assert.equal(await answer.inputValue(), exactAnswer.interval);
      assert(await title.evaluate(node => node === document.activeElement), 'the returned step receives focus when rendered');
      const next = route.locator('[data-school-next]');
      await next.focus();
      await page.clock.runFor(32);
      assert(await next.evaluate(node => node === document.activeElement), 'the next frame preserves the pupil’s focus');
      await page.keyboard.press('Enter');
      await page.clock.resume();
      continue;
    }
    await route.locator('[data-school-next]').press('Enter');
  }
  const exam = route.locator('a[href="#task/p14-trig-factors-8/independent/trig-exam"]');
  assert.equal(await route.locator('a[href^="#task/"][href$="/independent/trig-exam"]').count(), 4);
  await exam.click();
  await page.locator('#final-form').waitFor();
  assert.equal(await page.locator('#main h1').innerText(), 'Самостоятельная работа №13');
  await page.locator('.modes [aria-current="page"]').click();
  assert.equal(new URL(page.url()).hash, '#task/p14-trig-factors-8/independent/trig-exam');
  await page.locator('#final-0').fill('x=πe');
  await page.locator('#final-1').fill('0');
  await page.locator('#final-form button[type=submit]').click();
  await page.getByText(/^Проверьте формат записи/).waitFor();
  assert.equal(await page.locator('#completion').count(), 0);
  await page.locator('#final-0').fill('x=pi*k');
  await page.locator('#final-1').fill('pi');
  await page.locator('#final-form button[type=submit]').click();
  await page.locator('#feedback.error').waitFor();
  assert.equal(await page.locator('#completion').count(), 0);
  await page.locator('#final-1').fill('0');
  await page.locator('#final-form button[type=submit]').click();
  await page.locator('#completion').waitFor();
  await page.reload();
  assert.equal(await page.locator('#final-1').inputValue(), '0');
  await page.locator('#main > .back').click();
  await title.waitFor();
  assert.equal(await select.inputValue(), 'exam');
  assert.equal(await readLegacy(), saved, 'School practice preserves the previous written task, attempts and credit');
}

test('№13 school route, independent practice and earlier saved work on web, standalone HTML and extracted ZIP', {
  skip: !(process.env.CI || process.env.SCHOOL_ROUTE_BROWSER === '1') && 'set SCHOOL_ROUTE_BROWSER=1 for Chromium',
  timeout: 240000
}, async t => {
  const { chromium } = require('playwright');
  const extracted = fs.mkdtempSync(path.join(os.tmpdir(), 'math-exam-13-'));
  t.after(() => fs.rmSync(extracted, { force: true, recursive: true }));
  execFileSync('python3', ['-m', 'zipfile', '-e', path.join(packageDir, slug + '-package.zip'), extracted]);
  const standalone = path.join(packageDir, slug + '.html');
  const zipHtml = path.join(extracted, slug + '.html');
  assert.deepEqual(fs.readFileSync(standalone), fs.readFileSync(zipHtml));
  const server = site();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] });
  t.after(() => browser.close());
  const formats = { web: origin + '/ege-profil/part-two/', html: pathToFileURL(standalone).href, zip: pathToFileURL(zipHtml).href };
  for (const [format, url] of Object.entries(formats)) for (const width of [320, 1280]) {
    await t.test(format + ' ' + width + 'px', async () => {
      const offline = format !== 'web';
      const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width === 320, offline });
      try {
        const page = await context.newPage();
        page.setDefaultTimeout(6000);
        const errors = [], remote = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('request', req => { if (offline && /^https?:/.test(req.url())) remote.push(req.url()); });
        await journey(page, url);
        assert.deepEqual(errors, []);
        assert.deepEqual(remote, [], 'the entire offline route runs without network requests');
      } finally { await context.close(); }
    });
  }
});
