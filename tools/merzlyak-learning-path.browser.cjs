'use strict';

// CI regression for learner entry points and real task interactions. Screenshots
// are review evidence, not a mathematical-content verdict. Run browsers in CI.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'artifacts/merzlyak-learning-path');
const viewports = [{ width: 320, height: 900 }, { width: 1280, height: 900 }];
const lessons = [
  ['merzlyak-base-8-12', 'Подобные треугольники'],
  ['merzlyak-base-8-13', 'Первый признак подобия треугольников'],
  ['merzlyak-base-8-14', 'Второй и третий признаки подобия треугольников'],
];
const stages = ['Понять', 'Исследовать', 'Доказать', 'Решить с опорой', 'Самостоятельно', 'Своими словами'];
const mimeTypes = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};
const evidence = { commit: process.env.GITHUB_SHA || null, viewports, states: [], firstViewportModels: [], firstScreenTasks: [], scrollChecks: [], interactions: [], errors: [], completed: false };
fs.mkdirSync(output, { recursive: true });

const server = http.createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let file = path.resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) {
      response.writeHead(403).end();
      return;
    }
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    response.setHeader('Content-Type', mimeTypes[path.extname(file)] || 'application/octet-stream');
    response.end(fs.readFileSync(file));
  } catch {
    response.writeHead(404).end();
  }
});

async function visible(locator, message) {
  await locator.waitFor({ state: 'visible' });
  assert(await locator.isVisible(), message);
}

async function recordLayout(page, name, viewport) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const layout = await page.evaluate(() => {
    const width = window.innerWidth;
    return {
      width,
      scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      overflowing: [...document.body.querySelectorAll('*')].filter(node => {
        const box = node.getBoundingClientRect();
        return box.width && (box.right > width + 1 || box.left < -1) && getComputedStyle(node).position !== 'fixed';
      }).slice(0, 8).map(node => ({ tag: node.tagName, id: node.id, class: node.className?.baseVal ?? node.className })),
    };
  });
  const screenshot = `${name}-${viewport.width}.png`;
  await page.screenshot({ path: path.join(output, screenshot), fullPage: false });
  evidence.states.push({ name, viewport, ...layout, screenshot });
  assert(layout.scrollWidth <= viewport.width + 1, `${name} overflows at ${viewport.width}px: ${JSON.stringify(layout)}`);
}

async function openPage(page, url) {
  let response = await page.goto(url, { waitUntil: 'load' });
  // Hash-based grade-10 links can be same-document navigations. A direct URL
  // visit must boot the requested card, not leave the previously mounted card.
  if (!response) response = await page.reload({ waitUntil: 'load' });
  assert(response?.ok(), `Cannot open ${url}: ${response?.status()}`);
}

async function assertAtTop(page, message) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const scrollY = await page.evaluate(() => window.scrollY);
  evidence.scrollChecks.push({ name: message, viewport: page.viewportSize(), scrollY });
  assert.equal(scrollY, 0, message);
}

async function assertVisibleInViewport(locator, viewport, message) {
  await visible(locator, message);
  const box = await locator.boundingBox();
  assert(box, message + ' has bounds');
  assert(box.x >= 0 && box.y >= 0 && box.width > 0 && box.height > 0 && box.x + box.width <= viewport.width + 1 && box.y + box.height <= viewport.height + 1,
    `${message} must fit in ${viewport.width}×${viewport.height}: ${JSON.stringify(box)}`);
  return box;
}

async function assertTaskFirst(page, name, condition, answer, viewport, model = null) {
  await visible(condition, name + ' has a condition');
  await visible(answer, name + ' has a response control');
  const bounds = {};
  const parts = [['condition', condition], ['responseControl', answer], ...(model ? [['model', model]] : [])];
  for (const [label, locator] of parts) bounds[label] = await assertVisibleInViewport(locator, viewport, name + ' ' + label + ' before scrolling');
  evidence.firstScreenTasks.push({ name, viewport, bounds });
}

async function checkHomes(page, base, viewport) {
  await openPage(page, base + '/geometry-merzlyak/');
  await visible(page.getByRole('heading', { level: 1, name: 'Мой путь по геометрии', exact: true }), '7–9 course heading');
  let journey = page.getByRole('region', { name: 'Мой путь по курсу', exact: true });
  await visible(journey, '7–9 learning path');
  await visible(journey.getByRole('link', { name: /Начать урок/ }), '7–9 start action');
  await recordLayout(page, 'geometry-home', viewport);
  for (const summary of await journey.locator('summary').all()) {
    if (!(await summary.evaluate(node => node.parentElement.open))) await summary.click();
  }
  assert.equal(await journey.getByRole('progressbar').count() > 0, true, '7–9 path includes chapter progress');
  await recordLayout(page, 'geometry-home-expanded', viewport);

  await openPage(page, base + '/stereo-course/merzlyak-10-base/');
  journey = page.getByRole('region', { name: 'Мой путь по курсу', exact: true });
  await visible(journey, '10th-grade learning path loaded');
  await visible(journey.getByRole('heading', { level: 2, name: 'Мой путь по курсу', exact: true }), '10th-grade path heading');
  await recordLayout(page, 'stereo-home', viewport);
  for (const summary of await journey.locator('summary').all()) {
    if (!(await summary.evaluate(node => node.parentElement.open))) await summary.click();
  }
  await recordLayout(page, 'stereo-home-expanded', viewport);
  await journey.getByRole('button', { name: 'Начать с первой темы', exact: true }).click();
  await visible(page.getByRole('navigation', { name: 'Дальше по теме', exact: true }), 'Theory offers a next learning step');
  await assertAtTop(page, 'Starting a topic shows the condition at the top');
  await recordLayout(page, 'stereo-first-topic', viewport);
  await page.getByRole('button', { name: /^Перейти к практике:/ }).click();
  const title = await page.getByRole('heading', { level: 1 }).innerText();
  await assertAtTop(page, 'Theory-to-practice navigation starts at the condition, not at the previous scroll position');
  await recordLayout(page, 'stereo-first-practice', viewport);
  await page.reload({ waitUntil: 'load' });
  await visible(page.getByRole('heading', { level: 1, name: title, exact: true }), 'A practice card survives reload');
  await openPage(page, base + '/stereo-course/merzlyak-10-base/');
  await page.getByRole('region', { name: 'Мой путь по курсу', exact: true }).getByRole('button', { name: /^Продолжить:/ }).click();
  await visible(page.getByRole('heading', { level: 1, name: title, exact: true }), 'Continue returns to the same practice card');
  await assertAtTop(page, 'Continue shows the resumed condition at the top');
}

async function checkSimilarity(page, base, viewport) {
  for (const [id, title] of lessons) {
    await openPage(page, `${base}/geometry-merzlyak/atlas/${id}.html`);
    await visible(page.getByRole('heading', { level: 1, name: title, exact: true }), id + ' heading');
    for (const [index, stage] of stages.entries()) {
      await page.getByRole('button', { name: `${String(index + 1).padStart(2, '0')} ${stage}`, exact: true }).click();
      await visible(page.locator('#lesson').getByRole('heading', { level: 2 }), id + ' stage ' + stage);
      if (index === 1) {
        const canvas = page.locator('#geo-board canvas');
        await visible(canvas, 'Investigation has a working drawing surface');
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const bounds = await canvas.evaluate(node => {
          const box = node.getBoundingClientRect();
          return { top: box.top, bottom: box.bottom, left: box.left, right: box.right, width: box.width, height: box.height };
        });
        evidence.firstViewportModels.push({ id, viewport, bounds });
        assert(bounds.width > 0 && bounds.height > 0 && bounds.top >= 0 && bounds.bottom <= viewport.height + 1 && bounds.left >= 0 && bounds.right <= viewport.width + 1,
          `${id} investigation canvas must fit in the first ${viewport.width}×${viewport.height} viewport: ${JSON.stringify(bounds)}`);
      }
      if (index === 3) await page.getByRole('button', { name: 'Показать смысл шага', exact: true }).click();
      if (index === 4) await page.getByRole('button', { name: 'Полный разбор с ответом', exact: true }).click();
      await recordLayout(page, `${id}-stage-${index + 1}`, viewport);
    }
    const draft = 'Если соответствующие углы равны, нужно указать соответствие вершин и основание подобия.';
    await page.getByRole('textbox', { name: 'Моё доказательство', exact: true }).fill(draft);
    // Leave by a learner control so this also exercises saving a manual draft.
    await page.getByRole('button', { name: 'Завершить занятие', exact: true }).click();
    await page.reload({ waitUntil: 'load' });
    assert.equal(await page.getByRole('textbox', { name: 'Моё доказательство', exact: true }).inputValue(), draft, id + ' preserves written work');
  }
}

async function checkStereoInteraction(page, base, viewport) {
  // This authored problem asks for the maximum number of five noncoplanar
  // points on one line. Three is possible; four would put all five in a plane.
  // Keep the expected answer independent of the application's answer checker.
  const url = base + '/stereo-course/merzlyak-10-base/#ex-02-011';
  await openPage(page, url);
  await visible(page.getByRole('heading', { level: 1, name: '№ 2.11. Сколько точек может лежать на прямой?', exact: true }), 'Real grade-10 practice problem');
  const condition = page.locator('.textbook-condition');
  const firstCondition = await condition.innerText();
  const answer = page.locator('#final-answer');
  await assertAtTop(page, 'Grade-10 independent problem starts at the condition');
  await assertTaskFirst(page, 'stereo-independent', condition, page.locator('[data-try-answer]'), viewport, page.locator('[data-main-model] svg'));
  await recordLayout(page, 'stereo-independent-start', viewport);
  await page.locator('[data-try-answer]').click();
  assert.equal(await answer.evaluate(node => node === document.activeElement), true, 'Try independently focuses the answer');
  await assertVisibleInViewport(answer, viewport, 'The requested answer control');

  const plan = 'Предположу, что четыре точки на прямой; проверю, где лежит пятая.';
  await page.locator('details:has([data-personal-plan]) > summary').click();
  await page.locator('[data-personal-plan]').fill(plan);
  for (let attempt = 0; attempt < 2; attempt++) {
    await answer.fill('4');
    await page.getByRole('button', { name: 'Проверить ответ', exact: true }).click();
    assert.equal(await page.locator('[data-step]').count(), 0, 'An incorrect answer must not reveal a solution step');
    assert.equal(await page.locator('[data-main-help]').evaluate(node => node.open), false, 'Errors do not open help automatically');
  }
  await visible(page.locator('[data-hint-offer]'), 'Two errors offer optional support');
  assert.doesNotMatch(await page.locator('[data-work-status]').innerText(), /С помощью/i, 'An error alone is not assistance');
  await recordLayout(page, 'stereo-independent-two-errors', viewport);

  await page.locator('[data-step-hint]').click();
  assert.equal(await page.locator('[data-step]').count(), 1, 'One request reveals one step');
  const explanation = page.locator('[data-step]').first().locator('[data-step-explanation]');
  assert.equal(await explanation.evaluate(node => node.open), false, 'A step starts with a question, not its explanation');
  await explanation.locator(':scope > summary').click();
  await visible(explanation.locator('p').first(), 'The learner can request the explanation');
  await page.reload({ waitUntil: 'load' });
  await visible(page.locator('[data-step]').first(), 'Requested help stays visible after reload');
  assert.equal(await page.locator('[data-step]').count(), 1);
  assert.equal(await page.locator('[data-main-help]').evaluate(node => node.open), true);
  assert.equal(await page.locator('[data-step-explanation]').first().evaluate(node => node.open), true, 'The requested explanation stays open');
  assert.equal(await page.locator('[data-personal-plan]').inputValue(), plan, 'The personal plan survives reload');
  assert.equal(await answer.inputValue(), '4', 'The learner answer survives reload');
  assert.match(await page.locator('[data-work-status]').innerText(), /с помощью/i, 'Restored help remains marked as assistance before solving');
  await recordLayout(page, 'stereo-independent-help-restored', viewport);

  await page.locator('[data-step-hint]').click();
  assert.equal(await page.locator('[data-step]').count(), 2, 'The next request adds exactly one more step');
  assert.equal(await page.locator('[data-step-explanation]').first().evaluate(node => node.open), true, 'Earlier explanation is retained');
  await answer.fill('3');
  await page.getByRole('button', { name: 'Проверить ответ', exact: true }).click();
  assert.match(await page.locator('[data-work-status]').innerText(), /С помощью/i, 'A correct answer after help is honestly marked as assisted');
  await recordLayout(page, 'stereo-independent-assisted-result', viewport);

  await page.locator('[data-fresh-task]').click();
  await visible(page.getByRole('heading', { level: 1, name: /№ 2\.19\./ }), 'The fresh exact-answer problem stays in paragraph 2');
  assert.notEqual(await condition.innerText(), firstCondition, 'Another problem has a different condition');
  assert.equal(await page.locator('#final-answer').inputValue(), '', 'Another problem starts with its own response');
  assert.equal(await page.locator('[data-step]').count(), 0, 'Help does not leak into another problem');
  await assertAtTop(page, 'Another grade-10 problem starts at its own condition');
  await recordLayout(page, 'stereo-independent-next-problem', viewport);

  await openPage(page, url);
  await visible(page.locator('[data-work-status]'), 'Original problem can be revisited');
  assert.equal(await page.locator('#final-answer').inputValue(), '3', 'Moving to another task preserves the old answer');
  assert.equal(await page.locator('[data-personal-plan]').inputValue(), plan, 'Moving to another task preserves the old plan');
  assert.equal(await page.locator('[data-step]').count(), 2, 'Moving to another task preserves requested steps');
  assert.match(await page.locator('[data-work-status]').innerText(), /С помощью/i, 'Reopening cannot turn assistance into independence');
  await recordLayout(page, 'stereo-independent-original-retained', viewport);
  evidence.interactions.push({ course: 'merzlyak-10-base', id: 'ex-02-011', viewport, checks: ['two-errors-without-auto-help', 'optional-progressive-help', 'plan-and-help-reload', 'assisted-result', 'different-same-paragraph-task', 'original-work-retained'] });
}

async function checkGeometryInteraction(page, base, viewport) {
  // Exercise the shared trainer outside the three rewritten similarity lessons.
  // Solve the visible segment problem from AC = AB + BC, without calling the
  // task generator or reading the application's expected answer.
  const id = 'merzlyak-base-7-2';
  await openPage(page, `${base}/geometry-merzlyak/atlas/${id}.html`);
  await page.getByRole('button', { name: '05 Самостоятельно', exact: true }).click();
  const condition = page.locator('.task-question');
  const firstCondition = await condition.innerText();
  const givens = firstCondition.match(/AC\s*=\s*(\d+)\s*см,\s*BC\s*=\s*(\d+)\s*см/);
  assert(givens && /B лежит между A и C/.test(firstCondition), 'The selected problem supplies segment addition givens');
  const expected = String(Number(givens[1]) - Number(givens[2]));
  const answer = page.getByRole('textbox', { name: 'Твой ответ', exact: true });
  await assertAtTop(page, 'Grade-7 independent problem starts at the condition');
  await assertTaskFirst(page, 'geometry-independent', condition, answer, viewport);
  await recordLayout(page, 'geometry-independent-start', viewport);

  for (let attempt = 0; attempt < 2; attempt++) {
    await answer.fill('0');
    await page.getByRole('button', { name: 'Проверить', exact: true }).click();
    assert.equal(await page.locator('#hint-box [data-help-step]').count(), 0, 'An incorrect answer does not reveal solution steps');
    assert.equal(await page.locator('#error-advice-box').count(), 0, 'Diagnostic advice is not forced after an error');
  }
  await visible(page.locator('#help-offer'), 'Two errors offer a learner-controlled next move');
  assert.doesNotMatch(await page.locator('#attempt-summary').innerText(), /Помощь открыта/, 'Errors do not count as assistance');
  await recordLayout(page, 'geometry-independent-two-errors', viewport);

  await page.getByRole('button', { name: 'Понять ошибку', exact: true }).click();
  const advice = (await page.locator('#error-advice-box').innerText()).trim();
  assert(advice.length > 0, 'Optional error advice has useful content');
  assert.match(await page.locator('#attempt-summary').innerText(), /Помощь открыта/);
  await page.reload({ waitUntil: 'load' });
  await visible(page.locator('#error-advice-box'), 'Requested error advice stays visible after reload');
  assert.equal((await page.locator('#error-advice-box').innerText()).trim(), advice);
  assert.equal(await answer.inputValue(), '0', 'The attempted answer survives reload');
  assert.match(await page.locator('#attempt-summary').innerText(), /Помощь открыта/, 'Reload keeps the assistance status');
  await recordLayout(page, 'geometry-independent-help-restored', viewport);

  await page.locator('[data-action="show-solution"]').click();
  assert.equal(await page.locator('#hint-box [data-help-step]').count(), 1, 'A request reveals only one guiding question');
  const firstStep = page.locator('#hint-box [data-help-step="0"]');
  assert.match(await firstStep.innerText(), /Запиши сумму AB\+BC числом/);
  assert.doesNotMatch(await firstStep.innerText(), /Целый отрезок AC состоит/, 'The explanation waits for an explicit request');
  await page.locator('[data-help-explain="0"]').click();
  assert.match(await firstStep.innerText(), /Целый отрезок AC состоит/, 'The requested explanation gives a mathematical reason');
  await page.locator('[data-action="show-solution"]').click();
  assert.equal(await page.locator('#hint-box [data-help-step]').count(), 2, 'A second request adds one step');
  assert.match(await firstStep.innerText(), /Целый отрезок AC состоит/, 'Earlier explanation remains available');
  await page.reload({ waitUntil: 'load' });
  await visible(page.locator('#hint-box [data-help-step="1"]'), 'Progressive help survives reload');
  assert.match(await firstStep.innerText(), /Целый отрезок AC состоит/);
  await answer.fill(expected);
  await page.getByRole('button', { name: 'Проверить', exact: true }).click();
  assert.match(await page.locator('#answer-feedback').innerText(), /после.*помощ|после.*разбор|с помощью/i, 'A correct response after help is not independent');
  const totals = await page.locator('#attempt-totals').innerText();
  assert.match(totals, /С помощью:\s*1/);
  await recordLayout(page, 'geometry-independent-assisted-result', viewport);

  await page.locator('[data-action="new-task"]').click();
  assert.notEqual(await condition.innerText(), firstCondition, 'A new variant must change the actual condition');
  assert.equal(await answer.inputValue(), '', 'A new variant has its own response');
  assert.equal(await page.locator('#hint-box [data-help-step]').count(), 0, 'Old help does not leak into the new variant');
  assert.equal(await page.locator('#attempt-totals').innerText(), totals, 'A new variant does not erase earned results');
  await recordLayout(page, 'geometry-independent-next-problem', viewport);
  await page.reload({ waitUntil: 'load' });
  await visible(page.locator('#attempt-history > summary'), 'Earlier variants remain available');
  await page.locator('#attempt-history > summary').click();
  const history = await page.locator('#attempt-history').innerText();
  assert(history.includes(firstCondition), 'Earlier condition is retained in history');
  assert.match(history, new RegExp('[Оо]твет[^\\n]*' + expected), 'Earlier answer is retained in history');
  assert.match(history, /с помощью|помощь|разбор/i, 'Earlier help is not hidden from history');
  assert.equal(await page.locator('#attempt-totals').innerText(), totals, 'Cumulative results survive reload');
  await recordLayout(page, 'geometry-independent-history-retained', viewport);
  evidence.interactions.push({ course: 'geometry-merzlyak', id, viewport, checks: ['two-errors-without-auto-help', 'optional-error-advice', 'advice-and-answer-reload', 'progressive-explanation-reload', 'assisted-result', 'different-condition', 'prior-variant-and-totals-retained'] });
}

let browser, activePage;
(async () => {
  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const base = 'http://127.0.0.1:' + server.address().port;
    browser = await chromium.launch({ headless: true, ...(process.env.GEOMETRY_CHROMIUM ? { executablePath: process.env.GEOMETRY_CHROMIUM } : {}) });
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
      const page = await context.newPage();
      activePage = page;
      page.setDefaultTimeout(15000);
      page.on('pageerror', error => evidence.errors.push({ viewport, url: page.url(), kind: 'pageerror', message: error.message }));
      page.on('console', message => {
        if (message.type() === 'error' && !message.location().url.endsWith('/favicon.ico')) evidence.errors.push({ viewport, url: page.url(), kind: 'console', message: message.text() });
      });
      await checkHomes(page, base, viewport);
      await checkStereoInteraction(page, base, viewport);
      await checkGeometryInteraction(page, base, viewport);
      await checkSimilarity(page, base, viewport);
      await context.close();
    }
    assert.deepEqual(evidence.errors, [], 'No browser JavaScript errors');
    evidence.completed = true;
    console.log(`MERZLYAK_LEARNING_PATH_BROWSER_OK: ${evidence.states.length} layout states; 320×900 and 1280×900`);
  } catch (error) {
    evidence.failure = error.stack;
    console.error(error);
    process.exitCode = 1;
    if (activePage && !activePage.isClosed()) {
      const viewport = activePage.viewportSize();
      const screenshot = `failure-${viewport?.width || 'unknown'}.png`;
      try {
        await activePage.screenshot({ path: path.join(output, screenshot), fullPage: false });
        evidence.failureScreenshot = { screenshot, viewport, url: activePage.url() };
      } catch (captureError) {
        evidence.failureScreenshotError = captureError.message;
      }
    }
  } finally {
    fs.writeFileSync(path.join(output, 'browser-evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
    await browser?.close();
    server.closeAllConnections?.();
    if (server.listening) await new Promise(resolve => server.close(resolve));
  }
})();
