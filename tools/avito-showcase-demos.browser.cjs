'use strict';

// Real learner journeys for the four advertised examples. Answers below are
// derived independently from the visible arithmetic/geometry, never copied
// from a trainer's answer key or written directly into its saved progress.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('playwright');

const root = path.resolve(__dirname, '..');
const artifacts = process.env.SHOWCASE_DEMO_ARTIFACTS;
const widths = [320, 390, 1280];
const routes = {
  division: '/trainers/long-division-stepwise.html#start',
  graphs: '/trainers/oge-task11-graphs-trainer.html',
  triangle: '/ege-profil/start/index.html#practice/geo-right/guided',
  cone: '/stereo-course/textbook/#ex-main-0346'
};
const mime = {'.html':'text/html; charset=utf-8', '.js':'application/javascript',
  '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.woff2':'font/woff2'};
const report = {widths, routes, cases: [], errors: [], failedRequests: []};
const resources = new Set();
const externalResources = new Set();
let server;
let base;

async function fits(page, label) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label + ': no horizontal overflow');
}
async function shot(page, id, width, state) {
  if (!artifacts) return;
  await page.screenshot({path:path.join(artifacts, `${id}-${width}-${state}.png`), fullPage:true, animations:'disabled'});
}
async function reload(page, selector) {
  await page.reload();
  await page.locator(selector).waitFor();
}

async function division(page, width) {
  await page.goto(base + routes.division);
  await page.locator('#answer').waitFor();
  assert.equal(await page.locator('#problem').innerText(), '48 : 2');
  await fits(page, 'division initial');
  await shot(page, 'division', width, 'initial');

  await page.locator('#primary').click();
  assert.equal(await page.locator('#completion').isVisible(), false);
  await page.locator('#answer').fill('9');
  await page.locator('#primary').click();
  assert.match(await page.locator('#feedback').innerText(), /Начинаем с первой цифры слева/);
  assert.match(await page.locator('#prompt').innerText(), /С какого числа/);
  const help = page.locator('.bh-toggle');
  await help.click();
  assert(await page.locator('#help-content').isVisible());
  await help.click();
  await page.locator('#answer').fill('4');
  await reload(page, '#answer');
  assert.equal(await page.locator('#answer').inputValue(), '4', 'division unfinished answer retained');

  // 4 tens / 2 = 2 tens, 8 units / 2 = 4 units. Both remainders are 0;
  // the complete quotient is 24, and the inverse multiplication gives 48.
  const answers = ['4','2','2','4','0','да','8','8','4','8','0','да','24','48'];
  for (const answer of answers) {
    if (answer === 'да') await page.locator('[data-option="да"]').click();
    else await page.locator('#answer').fill(answer);
    await page.locator('#primary').click();
  }
  await page.locator('#completion').waitFor();
  assert.equal(await page.locator('.quotient').innerText(), String(48 / 2));
  await fits(page, 'division completed');
  await shot(page, 'division', width, 'completed');
  await reload(page, '#completion');
  assert.equal(await page.locator('.quotient').innerText(), '24');
  const records = await page.evaluate(() => JSON.parse(localStorage.getItem('mathExamBasics.guidedDivision.v1')).records);
  assert.equal(records.length, 1, 'reload does not duplicate the completed example');
  await page.locator('#next-example').click();
  assert.equal(await page.locator('#problem').innerText(), '69 : 3');
  return {acceptedSteps:14, expectedAnswer:24, checks:['wrong answer', 'hint', 'draft reload', 'complete', 'result reload', 'next example']};
}

async function graphs(page, width) {
  await page.goto(base + routes.graphs);
  await page.locator('#m4-graphs svg').first().waitFor();
  assert.equal(await page.locator('#m4-graphs svg').count(), 3);
  await fits(page, 'graphs initial');
  await shot(page, 'graphs', width, 'initial');
  const forms = await page.locator('#m4-desc .row > span:nth-child(2)').allTextContents();
  assert.deepEqual(forms.map(t => t.replace(/\s/g, '')), ['y=x', 'y=x2', 'y=1x']);

  // Identify the three visible plotted shapes, without reading M4.task.key.
  // y=x has one straight rising path through the origin; y=x² has one path
  // entirely on/above the x-axis; y=1/x has two disconnected paths.
  const shapes = await page.locator('#m4-graphs svg').evaluateAll(svgs => svgs.map(svg => {
    const lines = [...svg.querySelectorAll('polyline')];
    if (lines.length === 2) return 'hyperbola';
    if (lines.length !== 1) return 'unexpected';
    const points = lines[0].getAttribute('points').trim().split(/\s+/).map(p => p.split(',').map(Number));
    const size = svg.viewBox.baseVal.width;
    if (points.every(([x, y]) => Math.abs(x + y - size) <= 0.2)) return 'line';
    if (points.every(([, y]) => y <= size / 2 + 0.1)) return 'parabola';
    return 'unexpected';
  }));
  assert.deepEqual([...shapes].sort(), ['hyperbola','line','parabola']);
  const correct = ['line','parabola','hyperbola'].map(shape => String(shapes.indexOf(shape) + 1));

  await page.locator('#m4-graphs .gitem').first().click();
  assert.equal(await page.locator('#m4-graphs .gitem').first().getAttribute('aria-expanded'), 'true');
  await fits(page, 'enlarged graph');
  await page.locator('#m4-graphs .gitem').first().click();
  await page.locator('#m4-answer').fill([correct[1], correct[0], correct[2]].join(''));
  await page.locator('#m4-check').click();
  assert.match(await page.locator('#m4-soft').innerText(), /Верно 1 из 3/);
  await page.locator('#m4-hint').click();
  assert(await page.locator('#m4-hintbox').isVisible());
  await page.locator('[data-family=lin]').click();
  const before = await page.locator('#lab-graph').innerHTML();
  const slider = page.locator('#lab-controls input[type=range]').first();
  if (await slider.count()) { await slider.focus(); await page.keyboard.press('ArrowRight'); }
  else { await page.locator('#lab-k').selectOption('4'); await page.locator('#lab-k').dispatchEvent('input'); }
  assert.notEqual(await page.locator('#lab-graph').innerHTML(), before, 'hint model responds to learner control');
  await page.locator('#m4-hint').click();
  for (let i = 0; i < correct.length; i++) await page.locator(`#m4-desc select[data-i="${i}"]`).selectOption(correct[i]);
  await page.locator('#m4-check').click();
  assert.match(await page.locator('#m4-good').innerText(), /Верно!/);
  await fits(page, 'graphs completed');
  await shot(page, 'graphs', width, 'completed');
  const record = await page.evaluate(() => JSON.parse(localStorage.getItem('mathExamCourseProgress.v1'))['oge-t11-grafiki']);
  assert.equal(record.solvedByType.t45, 1);
  await reload(page, '#m4-graphs');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('mathExamCourseProgress.v1'))['oge-t11-grafiki'].solvedByType.t45), 1, 'completed graph result survives reload');
  return {acceptedMatches:3, expectedMapping:correct.join(''), checks:['plot shapes independently classified', 'enlarge', 'wrong answer', 'interactive hint', 'correct', 'result reload']};
}

async function triangle(page, width) {
  await page.goto(base + routes.triangle);
  await page.locator('#answer-form').waitFor();
  assert.match(await page.locator('.task-condition').innerText(), /равны 9 и 12/);
  assert(await page.locator('#task-model').isVisible());
  await fits(page, 'triangle initial');
  await shot(page, 'triangle', width, 'initial');
  await page.locator('#answer').fill('21');
  await page.locator('#submit-answer').click();
  assert.match(await page.locator('#feedback').innerText(), /Пока не сходится/);
  assert.equal(await page.locator('#next').isVisible(), false);
  await page.locator('#hint').click();
  assert.match(await page.locator('#hint-box').innerText(), /квадрат/);
  await page.locator('#hint').click();
  const square = 9 ** 2 + 12 ** 2;
  await page.locator('#answer').fill(String(square));
  await page.locator('#submit-answer').click();
  assert.match(await page.locator('#feedback').innerText(), /Верно/);
  await page.locator('#next').click();
  await page.locator('#answer').fill(String(Math.sqrt(square)));
  await reload(page, '#answer');
  assert.equal(await page.locator('#answer').inputValue(), '15');
  assert.match(await page.locator('#solution-history').innerText(), /225/);
  await page.locator('#submit-answer').click();
  await page.locator('#next').click();
  await page.locator('.result-panel').waitFor();
  assert.match(await page.locator('.result-panel').innerText(), /15/);
  await fits(page, 'triangle completed');
  await shot(page, 'triangle', width, 'completed');
  await reload(page, '.result-panel');
  assert.match(await page.locator('.result-panel').innerText(), /15/);
  return {acceptedSteps:2, expectedAnswer:15, checks:['wrong answer', 'hint', 'intermediate history', 'draft reload', 'complete', 'result reload']};
}

async function cone(page, width) {
  await page.goto(base + routes.cone);
  await page.locator('[data-main-model] svg').waitFor();
  assert.match(await page.locator('.textbook-condition').innerText(), /15.*8/);
  await fits(page, 'cone initial');
  await shot(page, 'cone', width, 'initial');
  const svg = page.locator('[data-main-model] svg');
  const oldYaw = await svg.getAttribute('data-yaw');
  await page.getByRole('button', {name:'Повернуть вправо', exact:true}).click();
  assert.notEqual(await svg.getAttribute('data-yaw'), oldYaw);
  await page.getByRole('button', {name:'Развернуть рисунок', exact:true}).click();
  await fits(page, 'cone expanded');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('[data-main-model] .am-expand').getAttribute('aria-expanded'), 'false');

  await page.locator('[data-main-help] > summary').click();
  for (let i = 1; i <= 3; i++) {
    await page.getByRole('button', {name:i === 1 ? 'Разобрать по шагам' : 'Следующий шаг', exact:true}).click();
    const step = page.locator(`[data-step="step-${i}"]`);
    await step.locator('details > summary').first().click();
    await step.getByRole('button', {name:'Показать на рисунке', exact:true}).click();
    assert.equal(await svg.getAttribute('data-view'), i === 3 ? 'slant' : 'triangle');
  }
  assert.match(await page.locator('[data-step="step-2"]').innerText(), /289/);
  assert.match(await page.locator('[data-step="step-3"]').innerText(), /17/);
  assert.equal(await page.getByRole('button', {name:'Следующий шаг', exact:true}).isVisible(), false);
  // This existing course deliberately saves a reasoning draft for discussion
  // with the teacher. It must never be described as automatic proof marking.
  const answer = `PO ⟂ OA; PA² = 15² + 8² = 289; PA = ${Math.hypot(15,8)} см.`;
  await page.locator('#final-answer').fill(answer);
  await page.getByRole('button', {name:'Сохранить рассуждение', exact:true}).click();
  assert.match(await page.locator('[data-final-feedback]').innerText(), /сохранено.*обсудить с учителем/);
  await fits(page, 'cone completed');
  await shot(page, 'cone', width, 'completed');
  await reload(page, '#final-answer');
  assert.equal(await page.locator('#final-answer').inputValue(), answer);
  assert.equal(await page.locator('[data-steps] > section').count(), 3, 'all revealed steps retained');
  return {explainedSteps:3, expectedAnswer:17, assessment:'saved reasoning; teacher assesses justification', checks:['rotate', 'expand and keyboard close', 'three explained/model steps', 'save reasoning', 'reload']};
}

(async () => {
  if (artifacts) fs.mkdirSync(artifacts, {recursive:true});
  if (process.env.SHOWCASE_BASE_URL) base = process.env.SHOWCASE_BASE_URL.replace(/\/$/, '');
  else {
    server = http.createServer((req, res) => {
      try {
        const pathname = decodeURIComponent(new URL(req.url, 'http://local').pathname);
        if (pathname === '/favicon.ico') return res.writeHead(204).end();
        let file = path.resolve(root, '.' + pathname);
        if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
        if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
        res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
        fs.createReadStream(file).pipe(res);
      } catch { res.writeHead(404).end(); }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    base = 'http://127.0.0.1:' + server.address().port;
  }
  let browser;
  try {
    browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.CHROMIUM_EXECUTABLE_PATH} : {})});
    report.browser = browser.version();
    report.source = process.env.SHOWCASE_BASE_URL ? 'published origin' : 'local worktree';
    for (const width of widths) for (const [id, run] of Object.entries({division, graphs, triangle, cone})) {
      const context = await browser.newContext({viewport:{width, height:900}, isMobile:width < 600, hasTouch:width < 600});
      const page = await context.newPage();
      page.setDefaultTimeout(20000);
      page.on('request', request => {
        const url = new URL(request.url());
        if (!/^https?:$/.test(url.protocol)) return;
        if (url.origin === new URL(base).origin) {
          if (url.pathname !== '/favicon.ico') resources.add(url.pathname + url.search);
        } else externalResources.add(url.href);
      });
      page.on('pageerror', error => report.errors.push({id, width, error:error.message}));
      page.on('response', response => {if (response.url().startsWith(base + '/') && response.status() >= 400) report.failedRequests.push({id, width, status:response.status(), url:response.url()});});
      try {
        const result = await run(page, width);
        report.cases.push({id, width, result:'PASS', ...result});
        console.log(`PASS ${id} at ${width}px`);
      } catch (error) {
        report.cases.push({id, width, result:'FAIL', error:error.message});
        await shot(page, id, width, 'failure');
        throw error;
      } finally { await context.close(); }
    }
    assert.deepEqual(report.errors, []);
    assert.deepEqual(report.failedRequests, []);
    console.log('AVITO_SHOWCASE_DEMOS_OK: 12 complete learner journeys across 320/390/1280px; arithmetic, OGE graphs, EGE triangle and guided cone reasoning.');
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
    report.resources = [...resources].sort();
    report.externalResources = [...externalResources].sort();
    if (artifacts) fs.writeFileSync(path.join(artifacts, 'results.json'), JSON.stringify(report, null, 2) + '\n');
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
