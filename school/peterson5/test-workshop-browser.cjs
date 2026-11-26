'use strict';

// Real Chromium gate. Run after build-workshop.cjs; Playwright's bundled
// Chromium is the default. CHROMIUM_EXECUTABLE_PATH may select an installed one.
// No mocked DOM, storage events, Web Locks, or replacement course code are used.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'artifacts/peterson5-workshop');
const KEY = 'mathexam.peterson5.workshop.v1';
const VIEWPORTS = [
  { width: 1440, height: 960 },
  { width: 768, height: 1024 },
  { width: 320, height: 900 }
];
const summary = {
  gate: 'PETERSON5_WORKSHOP_BROWSER_OK',
  status: 'running',
  startedAt: new Date().toISOString(),
  browser: 'chromium',
  customExecutable: Boolean(process.env.CHROMIUM_EXECUTABLE_PATH),
  assertions: 0,
  viewports: VIEWPORTS,
  screenshots: [],
  visualChecks: [],
  results: [],
  pageErrors: [],
  consoleErrors: [],
  requestFailures: []
};
const contexts = new Set();
let browser;
let server;
let origin;
let activePage;
let phase = 'startup';

function ok(value, label) {
  summary.assertions++;
  assert(value, label);
}

function equal(actual, expected, label) {
  summary.assertions++;
  assert.deepEqual(actual, expected, label);
}

function passed(name, details = {}) {
  summary.results.push({ name, status: 'passed', ...details });
  console.log('PASS ' + name);
}

async function startServer() {
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ico': 'image/x-icon'
  };
  server = http.createServer(async (req, res) => {
    try {
      if (!['GET', 'HEAD'].includes(req.method)) {
        res.writeHead(405).end();
        return;
      }
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      let file = path.resolve(ROOT, '.' + pathname);
      if (file !== ROOT && !file.startsWith(ROOT + path.sep)) {
        res.writeHead(403).end();
        return;
      }
      if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
      const body = await fs.readFile(file);
      res.writeHead(200, {
        'Content-Type': types[path.extname(file)] || 'application/octet-stream',
        'Content-Length': body.length,
        'Cache-Control': 'no-store'
      });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch (error) {
      res.writeHead(error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : 400);
      res.end('Resource unavailable');
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  origin = 'http://127.0.0.1:' + server.address().port;
}

function observe(page, label) {
  page.setDefaultTimeout(12000);
  page.on('pageerror', error => summary.pageErrors.push({ page: label, url: page.url(), message: error.message }));
  page.on('console', message => {
    if (message.type() === 'error') summary.consoleErrors.push({ page: label, url: page.url(), message: message.text() });
  });
  page.on('requestfailed', request => summary.requestFailures.push({
    page: label, url: request.url(), failure: request.failure()?.errorText || 'unknown'
  }));
  return page;
}

async function newContext(viewport = VIEWPORTS[0]) {
  const context = await browser.newContext({ viewport, locale: 'ru-RU', reducedMotion: 'reduce' });
  contexts.add(context);
  return context;
}

async function open(context, label, hash = '#home') {
  const page = observe(await context.newPage(), label);
  activePage = page;
  const response = await page.goto(origin + '/school/peterson5/' + hash, { waitUntil: 'load' });
  ok(response?.ok(), 'The actual course document loads: ' + label);
  await page.waitForFunction(() => window.PetersonApp && window.PetersonWorkshop && window.PetersonWorkshopData?.topics?.length === 43);
  await settled(page);
  return page;
}

async function settled(page) {
  await page.evaluate(async () => {
    await window.PetersonWorkshop.whenIdle();
    if (document.fonts) await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function go(page, hash) {
  activePage = page;
  await page.evaluate(async route => {
    history.replaceState(null, '', route);
    window.PetersonApp.route();
    await window.PetersonWorkshop.whenIdle();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    window.scrollTo(0, 0);
  }, hash);
}

async function reload(page) {
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.PetersonApp && window.PetersonWorkshop);
  await settled(page);
}

async function state(page) {
  return page.evaluate(() => window.PetersonWorkshop.getState());
}

async function disk(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
}

async function topic(page, id) {
  return page.evaluate(topicId => window.PetersonWorkshopData.topics.find(t => t.id === topicId), id);
}

async function enter(page, selector, question, value, wait = true) {
  const fields = page.locator(selector).locator('[data-w-value]');
  if (question.kind === 'choice') {
    const index = await fields.evaluateAll((nodes, answer) => nodes.findIndex(node => node.value === answer), value);
    ok(index >= 0, 'The requested radio option exists: ' + selector);
    await fields.nth(index).check();
  } else {
    await fields.fill(value);
  }
  if (wait) await settled(page);
}

async function submit(page, selector, question, value) {
  await enter(page, selector, question, value);
  await page.locator(selector).locator('button[type="submit"]').click();
  await settled(page);
}

async function click(page, selector) {
  await page.locator(selector).click();
  await settled(page);
}

async function screenshot(page, name, fullPage = true) {
  ok(!summary.screenshots.some(item => item.name === name), 'Screenshot names are unique: ' + name);
  await settled(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  const filename = name + '.png';
  await page.screenshot({ path: path.join(OUT, filename), fullPage, animations: 'disabled' });
  const stat = await fs.stat(path.join(OUT, filename));
  ok(stat.size > 1000, 'A real PNG was produced: ' + filename);
  summary.screenshots.push({ name, file: filename, viewport: page.viewportSize(), route: new URL(page.url()).hash, fullPage, bytes: stat.size });
}

async function visual(page, label) {
  await settled(page);
  const metrics = await page.evaluate(() => {
    const visible = element => {
      const style = getComputedStyle(element), box = element.getBoundingClientRect();
      return box.width > 0 && box.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const describe = element => ({
      tag: element.tagName.toLowerCase(),
      id: element.id || undefined,
      class: element.className || undefined,
      text: (element.textContent || element.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 110)
    });
    // Test the learner's entered response, option text and submit controls.
    // Inline references and decorative numbers are not form text or tap targets.
    const fontSelector = [
      'main input:not([type="radio"]):not([type="hidden"])',
      'main select', 'main textarea',
      '[data-w-form] button[type="submit"]',
      '[data-w-step-form] button[type="submit"]',
      '[data-w-check-form] button[type="submit"]',
      '.workshop-choice > span:last-child'
    ].join(',');
    const fonts = [...document.querySelectorAll(fontSelector)].filter(visible).map(element => ({
      ...describe(element), px: parseFloat(getComputedStyle(element).fontSize)
    }));
    const tapSelector = [
      'main button', 'main .button', 'main summary',
      'main input:not([type="radio"]):not([type="hidden"])',
      'main select', 'main textarea', '.workshop-choice', '.workshop-tabs a'
    ].join(',');
    const taps = [...document.querySelectorAll(tapSelector)].filter(visible).map(element => {
      const box = element.getBoundingClientRect();
      return { ...describe(element), width: box.width, height: box.height };
    });
    const documentWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const overflow = [...document.querySelectorAll('main *')].filter(visible).map(element => {
      const box = element.getBoundingClientRect();
      return { ...describe(element), left: box.left, right: box.right, width: box.width };
    }).filter(box => box.right > innerWidth + 1 || box.left < -1).slice(0, 12);
    return {
      viewport: { width: innerWidth, height: innerHeight },
      route: location.hash, documentWidth,
      fontsTested: fonts.length,
      minFormFont: fonts.length ? Math.min(...fonts.map(item => item.px)) : null,
      fontViolations: fonts.filter(item => item.px < 17 - 0.01),
      tapsTested: taps.length,
      minTapWidth: taps.length ? Math.min(...taps.map(item => item.width)) : null,
      minTapHeight: taps.length ? Math.min(...taps.map(item => item.height)) : null,
      tapViolations: taps.filter(item => item.width < 44 - 0.1 || item.height < 44 - 0.1),
      overflow
    };
  });
  const passed = metrics.documentWidth <= metrics.viewport.width + 1 &&
    metrics.fontViolations.length === 0 && metrics.tapViolations.length === 0;
  summary.visualChecks.push({ label, passed, ...metrics });
  summary.assertions++;
  // Collect the whole matrix before failing, so one CI run gives every affected
  // viewport and screenshots instead of concealing later layout regressions.
}

async function noCheckReveal(page, t, label) {
  equal(await page.locator('.workshop-check-review,.workshop-result,[data-w-hint],[data-w-steps],[data-w-solution],[data-w-step-form]').count(), 0,
    'An unfinished check has no help, result or revealed answers: ' + label);
  const body = await page.locator('main').innerText();
  ok(!body.includes('Верный ответ:'), 'No correct-answer label before question three: ' + label);
  for (const q of t.check) ok(!body.includes(q.explanation), 'No explanation is leaked during check: ' + q.id);
}

async function completeMixedCheck(page, id, name, saveScreenshot = false) {
  const t = await topic(page, id);
  await go(page, '#topic/' + id + '/check');
  ok(!await page.evaluate(q => window.PetersonWorkshop.check('0', q), t.check[0]), 'Zero is a deliberately wrong valid first answer');
  await enter(page, '[data-w-check-form]', t.check[0], '99');
  await enter(page, '[data-w-check-form]', t.check[0], '0');
  let saved = await state(page);
  equal(Object.keys(saved.checks[id].answers).length, 0, 'Editing a draft does not submit an answer');
  equal(saved.checks[id].drafts[t.check[0].id], '0', 'The latest edited draft is saved');
  await noCheckReveal(page, t, name + '-initial');
  await submit(page, '[data-w-check-form]', t.check[0], '0');
  equal((await state(page)).checks[id].answers[t.check[0].id], '0', 'The first wrong answer is fixed when submitted');
  await noCheckReveal(page, t, name + '-after-one');
  await enter(page, '[data-w-check-form]', t.check[1], '999');
  await enter(page, '[data-w-check-form]', t.check[1], t.check[1].answer);
  await reload(page);
  equal(await page.locator('[data-w-check-form] [data-w-value]').inputValue(), t.check[1].answer, 'A revised unsubmitted draft survives reload');
  equal(Object.keys((await state(page)).checks[id].answers).length, 1, 'Reload does not submit the second draft');
  await noCheckReveal(page, t, name + '-reloaded-draft');
  await submit(page, '[data-w-check-form]', t.check[1], t.check[1].answer);
  await noCheckReveal(page, t, name + '-after-two');
  await submit(page, '[data-w-check-form]', t.check[2], t.check[2].answer);
  const frozen = (await state(page)).checks[id];
  equal(await page.locator('.workshop-score strong').innerText(), '2', 'The first wrong answer produces an honest 2/3');
  equal(await page.locator('.workshop-check-review').count(), 3, 'Review appears for all three answers only after completion');
  equal(frozen.aided, false, 'Unassisted check is not marked aided by its own reload');
  await reload(page);
  equal((await state(page)).checks[id], frozen, 'The completed first result is unchanged after reload');
  equal(await page.locator('[data-w-check-form]').count(), 0, 'Reload cannot retake the frozen first check');
  equal(await page.locator('.workshop-score strong').innerText(), '2', 'The displayed frozen result survives reload');
  await visual(page, name + '-result');
  if (saveScreenshot) await screenshot(page, name + '-result');
  return frozen;
}

async function visualMatrix() {
  phase = 'visual-matrix';
  for (const viewport of VIEWPORTS) {
    const context = await newContext(viewport);
    const page = await open(context, 'matrix-' + viewport.width);
    const suffix = String(viewport.width);
    equal(await page.locator('[data-w-topic]').count(), 43, 'Home contains all 43 topic entries');
    await visual(page, 'home-' + suffix);
    await screenshot(page, 'home-' + suffix, false);
    for (const id of ['p01', 'p06', 'p25']) {
      await go(page, '#topic/' + id + '/discover');
      equal(await page.locator('[data-w-form]').count(), 1, id + ' discovery is a real interactive form');
      if (id === 'p06') {
        const q = (await topic(page, id)).discovery;
        equal(q.kind, 'set', 'The enumeration discovery exposes a complete-set response');
        for (const number of q.answer.split(/\s+/).slice(0, 2)) {
          await page.locator('#set-one').fill(number);
          await click(page, '[data-w-add]');
        }
        equal(await page.locator('[data-w-remove]').count(), 2, 'Found enumeration cases appear as removable chips');
      }
      await visual(page, id + '-discover-' + suffix);
      await screenshot(page, id + '-discover-' + suffix);
      await go(page, '#topic/' + id + '/practice');
      await visual(page, id + '-practice-' + suffix);
      if (id === 'p25') {
        const q = (await topic(page, id)).practice[0];
        await click(page, '[data-w-steps]');
        await submit(page, '[data-w-step-form]', q.steps[0], q.steps[0].answer);
        equal(await page.locator('.workshop-step.is-done').count(), 1, 'A completed step stays visible alongside the current one');
        await visual(page, 'p25-practice-open-step-' + suffix);
        await screenshot(page, 'p25-practice-open-step-' + suffix);
      }
    }
    for (const id of ['p01', 'p06', 'p25']) {
      await go(page, '#topic/' + id + '/check');
      await visual(page, id + '-check-' + suffix);
      await noCheckReveal(page, await topic(page, id), id + '-' + suffix);
    }
    await completeMixedCheck(page, 'p25', 'p25-check-' + suffix, true);
    if (viewport.width === 320) {
      const ids = await page.evaluate(() => window.PetersonWorkshopData.topics.map(t => t.id));
      equal(ids.length, 43, 'All 43 authored discoveries enter the narrow-screen sweep');
      for (const id of ids) {
        await go(page, '#topic/' + id + '/discover');
        equal(await page.locator('[data-w-form]').count(), 1, id + ' renders on the narrowest viewport');
        await visual(page, id + '-discover-all-320');
      }
      passed('all-43-discoveries-render-at-320', { topics: ids });
    }
    await context.close();
    contexts.delete(context);
  }
  const failedLayouts = summary.visualChecks.filter(check => !check.passed);
  summary.results.push({
    name: 'responsive-learning-and-check-matrix',
    status: failedLayouts.length ? 'failed' : 'passed',
    widths: VIEWPORTS.map(v => v.width),
    checks: summary.visualChecks.length,
    failedLayouts: failedLayouts.map(check => check.label)
  });
  console.log((failedLayouts.length ? 'FAIL' : 'PASS') + ' responsive-learning-and-check-matrix');
}

async function notesAndSteps() {
  phase = 'steps-notes-reload';
  const context = await newContext(VIEWPORTS[2]);
  const page = await open(context, phase, '#topic/p25/practice/0');
  const q = (await topic(page, 'p25')).practice[0];
  await submit(page, '[data-w-form]', q, '16');
  await click(page, '[data-w-steps]');
  await submit(page, '[data-w-step-form]', q.steps[0], q.steps[0].answer);
  await enter(page, '[data-w-step-form]', q.steps[1], '1');
  await enter(page, '[data-w-step-form]', q.steps[1], q.steps[1].answer);
  await click(page, '.workshop-notes summary');
  const note = 'В двух целых четырнадцать седьмых. Проверю оставшиеся доли.';
  await page.locator('#workshop-notes').fill(note);
  await settled(page);
  const before = (await state(page)).entries[q.id];
  equal(before.firstWrong, '16', 'The original learning error is retained');
  equal(before.step, 1, 'Only the submitted correct step counts as completed');
  equal(before.stepValues[1], q.steps[1].answer, 'The next step is saved as a draft');
  await reload(page);
  equal((await state(page)).entries[q.id], before, 'Task, error, current step, drafts and notes survive reload');
  equal(await page.locator('#workshop-notes').inputValue(), note, 'The learner can read the restored note');
  equal(await page.locator('.workshop-step.is-done').count(), 1, 'The completed step is restored visibly');
  equal(await page.locator('[data-w-step-form] [data-w-value]').inputValue(), q.steps[1].answer, 'The unfinished step draft is restored visibly');
  await submit(page, '[data-w-step-form]', q.steps[1], q.steps[1].answer);
  await submit(page, '[data-w-form]', q, q.answer);
  const completed = (await state(page)).entries[q.id];
  ok(completed.accepted && completed.aided, 'Assisted work is accepted without inventing independence');
  equal(completed.first, '16', 'A later correct answer does not rewrite the first attempt');
  equal(completed.note, note, 'Finishing the question does not erase its notes');
  passed('steps-notes-first-error-and-reload');
  await context.close();
  contexts.delete(context);
}

async function legacyAttribution() {
  phase = 'legacy-help-attribution';
  const context = await newContext();
  const page = await open(context, phase, '#topic/p25/check');
  const t = await topic(page, 'p25');
  await submit(page, '[data-w-check-form]', t.check[0], t.check[0].answer);
  await go(page, '#lesson/p26/0');
  equal((await state(page)).checks.p25.aided, false, 'Another legacy topic does not mark this check aided');
  await go(page, '#topic/p25/check');
  await noCheckReveal(page, t, 'after-unrelated-legacy-topic');
  await go(page, '#lesson/p25/0');
  equal((await state(page)).checks.p25.aided, true, 'Returning to the same legacy topic marks the unfinished check aided');
  await go(page, '#topic/p25/check');
  await submit(page, '[data-w-check-form]', t.check[1], t.check[1].answer);
  await submit(page, '[data-w-check-form]', t.check[2], t.check[2].answer);
  equal(await page.locator('.workshop-result h2').innerText(), 'Проверка с повторением', 'The visible final result discloses same-topic help');
  passed('legacy-same-topic-versus-other-topic');
  await context.close();
  contexts.delete(context);
}

async function concurrentTabs() {
  phase = 'real-multi-tab-drafts';
  const context = await newContext();
  const a = await open(context, 'draft-tab-a', '#topic/p25/practice/0');
  const b = await open(context, 'draft-tab-b', '#topic/p26/practice/0');
  ok(await a.evaluate(() => typeof navigator.locks?.request === 'function'), 'The real browser supports Web Locks on localhost');
  const qa = (await topic(a, 'p25')).practice[0], qb = (await topic(b, 'p26')).practice[0];
  await Promise.all([
    enter(a, '[data-w-form]', qa, '16', false),
    enter(b, '[data-w-form]', qb, '3/4', false)
  ]);
  await Promise.all([settled(a), settled(b)]);
  let saved = await disk(a);
  equal(saved.entries[qa.id].value, '16', 'Concurrent draft A is preserved on shared disk');
  equal(saved.entries[qb.id].value, '3/4', 'Concurrent draft B is preserved on shared disk');
  await Promise.all([reload(a), reload(b)]);
  equal(await a.locator('[data-w-form] [data-w-value]').inputValue(), '16', 'Tab A can reload its own draft');
  equal(await b.locator('[data-w-form] [data-w-value]').inputValue(), '3/4', 'Tab B can reload its own draft');
  passed('real-two-tab-unrelated-drafts', { storage: 'shared BrowserContext', locks: 'native Web Locks' });

  phase = 'real-multi-tab-stale-check';
  await go(a, '#topic/p25/check');
  await go(b, '#topic/p25/check');
  const t = await topic(a, 'p25');
  // Keep B's actual field focused. A storage event may refresh state, but must
  // not erase that focused draft or replace B's already-open question.
  await enter(b, '[data-w-check-form]', t.check[0], '1');
  const staleHeading = await b.locator('#workshop-question').textContent();
  await b.locator('[data-w-check-form] [data-w-value]').focus();
  await submit(a, '[data-w-check-form]', t.check[0], '0');
  await b.waitForFunction(({ key, id }) => JSON.parse(localStorage.getItem(key)).checks.p25.answers[id] === '0', { key: KEY, id: t.check[0].id });
  equal(await b.locator('#workshop-question').textContent(), staleHeading, 'B still has the first, stale question while its input is focused');
  equal(await b.locator('[data-w-check-form] [data-w-value]').inputValue(), '1', 'B retains its distinct unsent answer in the stale form');
  await b.locator('[data-w-check-form] [data-w-value]').press('Enter');
  await settled(b);
  saved = await disk(b);
  equal(saved.checks.p25.answers[t.check[0].id], '0', 'B cannot replace A\'s first submitted answer');
  equal(Object.keys(saved.checks.p25.answers).length, 1, 'A stale submit cannot accidentally answer the next question');
  await noCheckReveal(b, t, 'after-stale-submit');

  // A now has the next question open. B consults the same topic while A holds
  // a draft; A's subsequent write must merge the newer help attribution.
  await go(a, '#topic/p25/check');
  await enter(a, '[data-w-check-form]', t.check[1], t.check[1].answer);
  await go(b, '#lesson/p25/0');
  equal((await disk(b)).checks.p25.aided, true, 'B\'s actual legacy visit records same-topic help');
  await submit(a, '[data-w-check-form]', t.check[1], t.check[1].answer);
  saved = await disk(a);
  equal(saved.checks.p25.aided, true, 'A\'s next answer preserves help recorded by B');
  equal(saved.checks.p25.answers[t.check[0].id], '0', 'Help merging also preserves the first wrong answer');
  await submit(a, '[data-w-check-form]', t.check[2], t.check[2].answer);
  equal(await a.locator('.workshop-result h2').innerText(), 'Проверка с повторением', 'The multi-tab result honestly reports consulted help');
  equal(await a.locator('.workshop-score strong').innerText(), '2', 'The stale answer could not inflate the final result');
  passed('real-two-tab-stale-submit-and-help-merge', { firstAnswer: '0', staleAnswer: '1', score: '2/3', aided: true });
  await context.close();
  contexts.delete(context);
}

async function animatedExamples() {
  phase = 'animated-examples';
  for (const viewport of [VIEWPORTS[0], VIEWPORTS[2]]) {
    const context = await newContext(viewport), page = await open(context, 'gif-' + viewport.width, '#topic/p28/discover');
    equal(await page.locator('[data-p5-gif-toggle]').getAttribute('aria-pressed'), 'false', 'No GIF autoplay');
    await click(page, '.p5-media > summary');
    const poster = page.locator('.p5-media img');
    await page.waitForFunction(() => document.querySelector('.p5-media img')?.naturalWidth === 640);
    ok((await poster.getAttribute('src')).endsWith('p28.png'), 'Static conclusion loads');
    await click(page, '[data-p5-gif-toggle]');
    await page.waitForFunction(() => document.querySelector('.p5-media img')?.naturalWidth === 640 && document.querySelector('.p5-media img').src.endsWith('.gif'));
    equal(await page.locator('[data-p5-gif-toggle]').getAttribute('aria-pressed'), 'true', 'Explicit play works with reduced-motion preference');
    equal((await disk(page)).entries['p28-discover'].aided, true, 'Opened visual explanation is attributed as help');
    await click(page, '[data-p5-gif-toggle]');
    ok((await poster.getAttribute('src')).endsWith('p28.png'), 'Stop replaces moving GIF with its static conclusion');
    await visual(page, 'gif-' + viewport.width);
    await screenshot(page, 'gif-stopped-' + viewport.width);
    await reload(page);
    equal(await page.locator('[data-p5-gif-toggle]').getAttribute('aria-pressed'), 'false', 'Reload never starts animation automatically');
    await context.close(); contexts.delete(context);
  }
  passed('actual-gif-loading-play-stop-and-help', {widths:[1440,320],reducedMotion:true});
}

async function navigatorFlowLayout() {
  phase = 'navigator-flow-layout';
  for (const viewport of [VIEWPORTS[0], VIEWPORTS[2]]) {
    const context = await newContext(viewport), page = await open(context, 'navigator-' + viewport.width, '#topic/p28/discover');
    const host = page.locator('#maxexam-public-assistant'), launcher = host.locator('.launcher'), panel = host.locator('.panel');
    await launcher.waitFor({state:'visible'});
    equal(await host.count(), 1, 'The existing navigator host is preserved');
    const presentation = await host.evaluate(element => {
      const button=element.shadowRoot.querySelector('.launcher'),label=element.shadowRoot.querySelector('.launcher-label'),strong=label.querySelector('strong'),box=button.getBoundingClientRect();
      return {inMenu:document.querySelector('header.topbar nav').contains(element),position:getComputedStyle(button).position,
        width:box.width,height:box.height,left:box.left,right:box.right,labelWidth:label.getBoundingClientRect().width,
        labelClip:getComputedStyle(label).clipPath,labelFont:parseFloat(getComputedStyle(strong).fontSize),label:strong.textContent};
    });
    equal(presentation.inMenu, true, 'Navigator occupies space in the course menu');
    equal(presentation.position, 'static', 'Navigator launcher scrolls with the header');
    equal(presentation.label, 'Навигатор', 'The navigation button keeps its visible name');
    equal(presentation.labelClip, 'none', 'The mobile navigation label is not visually hidden');
    ok(presentation.labelWidth > 60 && presentation.labelFont >= 15, 'The navigation label is readable');
    ok(presentation.height >= 44 && presentation.width >= 100 && presentation.left >= 0 && presentation.right <= viewport.width,
      'The full navigation button fits the viewport with an accessible target');
    for (const selector of ['#workshop-question','[data-w-form] [data-w-value]','[data-w-form] button[type="submit"]']) {
      await page.locator(selector).scrollIntoViewIfNeeded();
      await settled(page);
      const overlap = await page.evaluate(selector => {
        const button=document.getElementById('maxexam-public-assistant').shadowRoot.querySelector('.launcher').getBoundingClientRect();
        const target=document.querySelector(selector).getBoundingClientRect();
        return button.left<target.right&&button.right>target.left&&button.top<target.bottom&&button.bottom>target.top;
      },selector);
      equal(overlap, false, 'Navigator never covers the visible question or answer: ' + selector + ' at ' + viewport.width);
    }
    const before = await state(page);
    await launcher.click();
    await panel.waitFor({state:'visible'});
    equal(await launcher.getAttribute('aria-expanded'), 'true', 'The same launcher opens its existing dialog');
    equal(await panel.evaluate(element => getComputedStyle(element).position), 'fixed', 'The opened dialog retains its viewport positioning');
    const box = await panel.boundingBox();
    ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width && box.y + box.height <= viewport.height,
      'The navigation dialog fits the viewport');
    await screenshot(page, 'navigator-dialog-' + viewport.width, false);
    await host.locator('textarea').press('Escape');
    equal(await panel.isVisible(), false, 'Escape closes the existing navigation dialog');
    equal(await launcher.getAttribute('aria-expanded'), 'false', 'Closing restores the launcher state');
    equal(await host.evaluate(element => document.activeElement===element&&element.shadowRoot.activeElement===element.shadowRoot.querySelector('.launcher')),
      true, 'Closing returns keyboard focus to the navigation button');
    equal(await state(page), before, 'Opening and closing navigation preserves the learner\'s work');
    await context.close(); contexts.delete(context);
  }
  passed('navigator-in-header-without-question-or-answer-overlap', {widths:[1440,320],dialog:true,keyboardReturn:true});
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  await startServer();
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}),
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  summary.browserVersion = browser.version();
  await visualMatrix();
  await notesAndSteps();
  await legacyAttribution();
  await concurrentTabs();
  await navigatorFlowLayout();
  await animatedExamples();
  equal(summary.pageErrors, [], 'No uncaught JavaScript exceptions on any tested page or viewport');
  const failures = summary.visualChecks.filter(check => !check.passed);
  equal(failures.map(check => ({
    label: check.label, viewport: check.viewport, documentWidth: check.documentWidth,
    fonts: check.fontViolations, taps: check.tapViolations, overflow: check.overflow
  })), [], 'All tested layouts fit their viewport, keep form text at least 17px and primary targets at least 44px');
  summary.status = 'passed';
  summary.finishedAt = new Date().toISOString();
  console.log('PETERSON5_WORKSHOP_BROWSER_OK');
}

main().catch(async error => {
  summary.status = 'failed';
  summary.failure = { phase, message: error.message, stack: error.stack };
  summary.finishedAt = new Date().toISOString();
  console.error(error);
  if (activePage && !activePage.isClosed()) {
    try { await screenshot(activePage, 'failure-' + phase.replace(/[^a-z0-9-]/gi, '-')); }
    catch (captureError) { summary.failure.screenshotError = captureError.message; }
  }
  process.exitCode = 1;
}).finally(async () => {
  await fs.mkdir(OUT, { recursive: true });
  await fs.writeFile(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  for (const context of contexts) await context.close().catch(() => {});
  if (browser) await browser.close().catch(() => {});
  if (server?.listening) await new Promise(resolve => server.close(resolve));
});
