'use strict';

// Real Chromium checks supplement the exact arithmetic and jsdom state tests.
// Run with the pinned Playwright installation from task6-minimal.yml.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const trainerPath = '/trainers/oge-task6-fractions.html';
const artifacts = path.resolve(root, process.env.TASK6_BROWSER_ARTIFACTS || 'artifacts/task6-minimal');
const errors = [];
const requests = [];
fs.mkdirSync(artifacts, { recursive: true });

const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost');
  if (url.pathname === '/test-frame') {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end('<!doctype html><html lang="ru"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Встроенный тренажёр</title><style>html,body{margin:0;height:100%}iframe{display:block;border:0;width:100%;height:100%}</style><iframe title="Задание 6" src="' + trainerPath + '?embedded=1"></iframe></html>');
    return;
  }
  const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404); response.end(); return;
  }
  const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }[path.extname(file)] || 'application/octet-stream';
  response.writeHead(200, { 'Content-Type': type + '; charset=utf-8' });
  fs.createReadStream(file).pipe(response);
});

function watch(page) {
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (!/^(?:https?:\/\/127\.0\.0\.1:|file:|data:)/.test(request.url())) requests.push(request.url());
  });
}
async function state(page, expression) { return page.evaluate(source => eval(source), expression); }
async function showTask(page, index) {
  await state(page, `cat='all';startSet();pos=${index};renderTask()`);
}
async function exactStep(page, offset = 0) {
  return state(page, `Task6Hints.plan(TASKS[order[pos]]).steps[${offset}].expected.map(String).join('/')`);
}
async function noOverflow(page, label) {
  const box = await page.evaluate(() => ({
    width: innerWidth,
    body: document.body.scrollWidth,
    root: document.documentElement.scrollWidth,
    expression: document.querySelector('#card .expr')?.getBoundingClientRect().toJSON(),
  }));
  assert.ok(box.root <= box.width + 1, label + ': document does not scroll sideways ' + JSON.stringify(box));
  assert.ok(box.body <= box.width + 1, label + ': body does not scroll sideways');
  if (box.expression) {
    assert.ok(box.expression.left >= -1 && box.expression.right <= box.width + 1, label + ': expression stays in its own viewport');
  }
}
async function initialScreen(page) {
  await page.locator('#ans').waitFor();
  assert.equal(await page.locator('#settings').evaluate(element => element.open), false);
  assert.equal(await page.locator('#hintPanel').isVisible(), false);
  assert.equal(await page.locator('#hintToggle').getAttribute('aria-expanded'), 'false');
  assert.equal(await page.locator('#reveal').isVisible(), false);
  assert.equal(await page.locator('#stats').isVisible(), false);
  assert.equal(await page.locator('#taskJump').isVisible(), false);
  assert.equal(await page.locator('#card > .expr, #card .task-expression').count(), 1);
  for (const id of ['hintToggle', 'ans', 'check', 'skip']) {
    assert.ok(await page.locator('#' + id).isVisible(), id + ' is visible');
    const box = await page.locator('#' + id).boundingBox();
    assert.ok(box.width >= 44 && box.height >= 44, id + ' has a 44px touch target');
  }
}
async function screenshot(page, name) {
  await page.screenshot({ path: path.join(artifacts, name + '.png'), fullPage: true });
}

async function run() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'ru-RU', reducedMotion: 'reduce' });
    const page = await context.newPage();
    watch(page);

    for (const width of [320, 360, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(origin + trainerPath);
      await initialScreen(page);
      await noOverflow(page, width + 'px initial');
      await screenshot(page, width + '-question');

      const before = await state(page, 'JSON.stringify({records,streak,pos,answeredCur})');
      await page.locator('#hintToggle').click();
      assert.ok(await page.locator('#stepAnswer').isVisible());
      assert.equal(await page.locator('#solutionDetails').evaluate(element => element.open), false);
      const prompt = await page.locator('#stepPrompt').innerText();
      const expected = await exactStep(page);
      await page.locator('#stepAnswer').fill('1/0');
      await page.locator('#stepAnswer').press('Enter');
      assert.equal(await page.locator('#stepPrompt').innerText(), prompt);
      assert.ok((await page.locator('#stepFeedback').innerText()).trim());
      await page.locator('#stepAnswer').fill(expected);
      await page.locator('#stepAnswer').press('Enter');
      const accepted = await page.locator('#hintSteps').innerText();
      assert.ok(accepted.trim(), 'Accepted intermediate result remains visible');
      await page.locator('#hintToggle').click();
      await page.locator('#hintToggle').click();
      assert.equal(await page.locator('#hintSteps').innerText(), accepted);
      assert.equal(await page.locator('#ans').inputValue(), '');
      assert.equal(await state(page, 'JSON.stringify({records,streak,pos,answeredCur})'), before);
      await noOverflow(page, width + 'px hint');
      await screenshot(page, width + '-hint');

      await page.locator('#ans').fill('-0,62');
      await page.locator('#ans').press('Enter');
      assert.equal(await state(page, 'currentRecord().status'), 'solved-first');
      assert.equal(await state(page, 'pos'), 0);
      assert.equal(await page.locator('#ans').evaluate(element => element.readOnly), true);
      await page.locator('#ans').press('Enter');
      assert.equal(await state(page, 'pos'), 1);
      assert.equal(await page.locator('#hintPanel').isVisible(), false);
      assert.equal((await page.locator('#hintSteps').textContent()).trim(), '');
      assert.equal(await state(page, 'records[order[0]].status'), 'solved-first');
      console.log('PASS minimal screen, guided step and keyboard at ' + width + 'px');
    }

    // Exercise the real navigation controls after explicitly requesting them.
    await page.locator('#settings > summary').click();
    assert.ok(await page.locator('#taskJump').isVisible());
    await page.locator('#taskJump').selectOption('0');
    assert.equal(await page.locator('#ans').inputValue(), '-0,62');
    await page.locator('#check').click();
    assert.equal(await state(page, 'streak'), 1, 'Revisiting cannot create repeat credit');
    console.log('PASS optional navigation and result provenance');

    await page.setViewportSize({ width: 320, height: 900 });
    const sample = await state(page, `JSON.stringify([...new Set([
      ...TASKS.map((task,index)=>({index,length:task.html.length})).sort((a,b)=>b.length-a.length).slice(0,8).map(item=>item.index),
      ...TASKS.flatMap((task,index)=>task.mode==='numerator'?[index]:[])
    ])])`);
    for (const index of JSON.parse(sample)) {
      await showTask(page, index);
      await noOverflow(page, '320px task ' + index);
      const numerator = await state(page, "TASKS[order[pos]].mode==='numerator'");
      if (numerator) {
        assert.ok(await page.locator('#card .prompt').isVisible());
        assert.match(await page.locator('#card .prompt').innerText(), /числитель/);
      }
      await page.locator('#hintToggle').click();
      await noOverflow(page, '320px task ' + index + ' hint');
      assert.ok(await page.locator('#card > .expr .f .fd').count() > 0, 'Fraction bars in complex expression ' + index);
      assert.doesNotMatch(await page.locator('#stepExpression').innerText(), /\d\s*\/\s*\d/, 'Hint renders mathematical fractions with a bar');
    }
    await screenshot(page, '320-nested-or-numerator-hint');
    console.log('PASS nested fractions and all numerator-only conditions on narrow screen');

    const fractional = await state(page, 'TASKS.findIndex(task=>task.mode!=="numerator"&&!task.term)');
    await showTask(page, fractional);
    await page.locator('#hintToggle').click();
    await page.locator('#solutionDetails > summary').click();
    await page.locator('#reveal').click();
    assert.equal(await state(page, 'currentRecord().status'), 'revealed');
    assert.ok(await page.locator('#mark .f .fn').count() > 0);
    assert.ok(await page.locator('#mark .f .fd').count() > 0);
    assert.doesNotMatch(await page.locator('#mark').innerText(), /\d\s*\/\s*\d/);
    await noOverflow(page, '320px revealed fraction');
    await screenshot(page, '320-revealed-fraction');
    console.log('PASS explicit reveal, fraction bar and provenance');

    await page.goto(origin + '/test-frame');
    const embedded = page.frameLocator('iframe');
    await embedded.locator('#ans').waitFor();
    assert.equal(await embedded.locator('#hintPanel').isVisible(), false);
    await embedded.locator('#hintToggle').click();
    assert.ok(await embedded.locator('#stepAnswer').isVisible());
    await embedded.locator('#ans').fill('-31/50');
    await embedded.locator('#check').click();
    assert.match(await embedded.locator('#mark').innerText(), /Верно/);
    assert.equal(await embedded.locator('#ans').evaluate(element => element.readOnly), true);
    console.log('PASS canonical trainer embedded in an iframe');

    const offlineContext = await browser.newContext({ viewport: { width: 360, height: 800 }, offline: true });
    const offline = await offlineContext.newPage();
    watch(offline);
    await offline.goto(pathToFileURL(path.join(root, trainerPath.slice(1))).href);
    await initialScreen(offline);
    await offline.locator('#hintToggle').click();
    await offline.locator('#stepAnswer').fill(await exactStep(offline));
    await offline.locator('#stepAnswer').press('Enter');
    assert.ok((await offline.locator('#hintSteps').innerText()).trim());
    await offline.locator('#ans').fill('-0.62');
    await offline.locator('#ans').press('Enter');
    assert.equal(await state(offline, 'currentRecord().status'), 'solved-first');
    await noOverflow(offline, 'offline file');
    await screenshot(offline, '360-offline-file');
    await offlineContext.close();
    console.log('PASS standalone HTML with the network disabled');

    assert.deepEqual(errors, [], 'No browser runtime errors');
    assert.deepEqual(requests, [], 'No external dependencies requested');
    await context.close();
    console.log('Task 6 minimal browser checks passed.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
