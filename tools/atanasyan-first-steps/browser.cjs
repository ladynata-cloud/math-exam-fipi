'use strict';
// Actual browser input and rendering on public pages and synthetic cabinet
// accounts. No real account, provider call or deployed service is used.
// Run with pinned Playwright available through NODE_PATH:
// node tools/atanasyan-first-steps/browser.cjs
// Optional PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH selects an installed Chromium;
// ATANASYAN_FIRST_STEPS_ARTIFACTS chooses the external screenshot/report folder.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const repo = path.resolve(__dirname, '../..');
const artifacts = path.resolve(process.env.ATANASYAN_FIRST_STEPS_ARTIFACTS || path.join(require('node:os').tmpdir(), 'atanasyan-first-steps-qa'));
const bundle = JSON.parse(fs.readFileSync(path.join(repo, 'learning/atanasyan-first-steps/course.json'), 'utf8'));
const lessons = new Map(bundle.lessons.map(lesson => [lesson.id, lesson]));
const cases = [
  'atanasyan-7-9-main-1-part-1',
  'atanasyan-7-9-main-100-part-1',
  'atanasyan-7-9-main-145-part-1',
  'atanasyan-7-9-main-158-part-1',
  'atanasyan-7-9-main-159-part-2',
  'atanasyan-7-9-main-160-part-2'
];
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
const publicAssistantAssets = new Set(['/assets/assistant/data.js', '/assets/assistant/widget.js', '/assets/assistant/widget.css']);
const server = http.createServer((request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
  catch (_) { response.writeHead(400).end(); return; }
  if ((!/^\/(?:learning|geometry-course|ege-baza\/path)\//.test(pathname) && !publicAssistantAssets.has(pathname)) || pathname.split('/').some(part => part.startsWith('.'))) {
    response.writeHead(404).end(); return;
  }
  const file = path.resolve(repo, '.' + pathname + (pathname.endsWith('/') ? 'index.html' : ''));
  if (!file.startsWith(repo + path.sep)) { response.writeHead(403).end(); return; }
  fs.readFile(file, (error, bytes) => {
    if (error) { response.writeHead(404).end(); return; }
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(bytes);
  });
});
const result = { viewportJourneys: [], nativeJourneys: [], teacherPreview: null, screenshots: [], pageErrors: [], unexpectedRequests: [], externalRequests: [] };
let browser;

async function assertPublicNavigator(page) {
  const host = page.locator('#maxexam-public-assistant');
  const launcher = host.locator('.launcher');
  await launcher.waitFor();
  assert.equal(await host.count(), 1, 'The public course loads exactly one real navigator');
  await page.waitForFunction(() => document.querySelector('#maxexam-public-assistant')?.shadowRoot?.querySelector('link[rel="stylesheet"]')?.sheet);
  assert.equal(await launcher.evaluate(node => getComputedStyle(node).position), 'fixed', 'Navigator stylesheet must actually load');
  const dialog = page.getByRole('dialog', { name: 'MaxExam 0.0', exact: true });
  assert.equal(await launcher.getAttribute('aria-expanded'), 'false');
  assert.equal(await dialog.isVisible(), false);
  await launcher.click();
  await dialog.waitFor();
  assert.equal(await launcher.getAttribute('aria-expanded'), 'true');
  assert((await host.locator('.log').innerText()).trim().length > 0, 'Real catalogue welcome must render');
  await host.getByRole('button', { name: 'Закрыть помощника', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
  assert.equal(await launcher.getAttribute('aria-expanded'), 'false');
  return { loaded: true, styled: true, opened: true, closed: true };
}
async function assertReady(page, id) {
  await page.locator('[data-full-condition]').waitFor();
  await page.locator('[data-final-answer]').waitFor();
  await page.locator('[data-course-model] .planar-svg').waitFor();
  assert((await page.locator('.afs-task-header h1').innerText()).includes('№' + lessons.get(id).source.exercise));
  const condition = (await page.locator('[data-full-condition]').innerText()).replace(/\s+/g, ' ').trim();
  const expected = bundle.displayOverrides[id]?.statementText || lessons.get(id).statement.text;
  assert.equal(condition, expected.replace(/\s+/g, ' ').trim(), id + ' must show its complete source condition');
  if (id === 'atanasyan-7-9-main-100-part-1') {
    assert.equal(condition, 'В четырёхугольнике ABCD проведена AC (рис. 59). Даны BC = AD и ∠BCA = ∠CAD. Докажите ΔABC = ΔCDA.', '№100а must retain its exact SAS condition');
  }
}
async function geometryCheck(page, label) {
  const shape = await page.evaluate(() => {
    const svg = document.querySelector('[data-course-model] .planar-svg');
    const viewport = svg.closest('.planar-viewport').getBoundingClientRect();
    const labels = [...svg.querySelectorAll('.planar-label')].map(node => {
      const rect = node.getBoundingClientRect();
      return { text: node.textContent, x: rect.x, y: rect.y, width: rect.width, height: rect.height,
        clipped: rect.left < viewport.left - 2 || rect.right > viewport.right + 2 || rect.top < viewport.top - 2 || rect.bottom > viewport.bottom + 2 };
    });
    return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, svgWidth: svg.getBoundingClientRect().width, labels };
  });
  assert(shape.scrollWidth <= shape.width + 1, label + ': horizontal page overflow ' + JSON.stringify(shape));
  assert(shape.svgWidth > 150, label + ': diagram too narrow');
  assert(shape.labels.length > 0, label + ': diagram labels absent');
  assert(shape.labels.every(item => [item.x, item.y, item.width, item.height].every(Number.isFinite)), label + ': invalid label geometry');
  assert(!shape.labels.some(item => item.clipped), label + ': clipped diagram labels ' + JSON.stringify(shape.labels.filter(item => item.clipped)));
  return { pageWidth: shape.width, scrollWidth: shape.scrollWidth, svgWidth: shape.svgWidth, labels: shape.labels.map(item => item.text) };
}
async function screenshot(page, name) {
  await page.evaluate(() => window.scrollTo(0, 0));
  const file = path.join(artifacts, name + '.png');
  await page.screenshot({ path: file, fullPage: false });
  result.screenshots.push(file);
}
async function returnByCatalog(page, id) {
  await page.getByRole('button', { name: '← Все разделы курса', exact: true }).click();
  await page.locator('[data-course-search]').fill(lessons.get(id).source.exercise);
  await page.locator('[data-lesson-id="' + id + '"]').click();
  await assertReady(page, id);
}
async function exerciseJourney(page, id, { prefix, width, native = false } = {}) {
  const lesson = lessons.get(id);
  const draft = 'Моя проверочная запись к №' + lesson.source.exercise + ': сначала записываю данные и цель.';
  const firstStep = 'Мой первый шаг: выделяю известные элементы и нужное построение.';
  await assertReady(page, id);
  const publicNavigator = native ? null : await assertPublicNavigator(page);
  await page.locator('[data-final-answer]').fill(draft);
  await page.locator('[data-guided-help] > summary').click();
  await page.locator('[data-next-step]').click();
  await page.locator('[data-step-index="0"]').waitFor();
  await page.locator('#afs-step-0').fill(firstStep);
  await page.locator('[data-step-explanation="0"] > summary').click();
  await page.locator('[data-step-reason="0"] > summary').click();
  await page.locator('[data-step-index="0"]').getByRole('button', { name: 'Показать на чертеже', exact: true }).click();
  assert.equal(await page.locator('[data-final-answer]').inputValue(), draft);
  await page.locator('[data-guided-help] > summary').click();
  assert.equal(await page.locator('#afs-step-0').inputValue(), firstStep);
  await page.locator('[data-guided-help] > summary').click();
  for (let index = 1; index < lesson.steps.length; index++) {
    await page.locator('[data-next-step]').click();
    assert.equal(await page.locator('[data-step-index]').count(), index + 1);
    assert.equal(await page.locator('#afs-step-0').inputValue(), firstStep, 'revealing later steps erased earlier work');
  }
  assert.equal(await page.locator('[data-step-explanation="0"]').getAttribute('open'), '', 'earlier explanation stays open');
  assert.equal(await page.locator('[data-step-reason="0"]').getAttribute('open'), '', 'earlier reason stays open');
  if (await page.locator('.afs-rules').count()) {
    await page.locator('.afs-rules > summary').click();
    await page.locator('.afs-rules > button').first().click();
    await page.locator('.afs-theory-dialog[open]').waitFor();
    assert.equal(await page.locator('[data-final-answer]').inputValue(), draft);
    assert(await page.locator('.afs-theory-dialog .planar-svg').count());
    await page.locator('.afs-theory-dialog').getByRole('button', { name: 'Вернуться к задаче', exact: true }).click();
    assert.equal(await page.locator('#afs-step-0').inputValue(), firstStep, 'theory return erased work');
  }
  await page.locator('[data-save-work]').click();
  assert.match(await page.locator('[data-save-status]').innerText(), /сохранена.*устройстве/);
  assert.match(await page.locator('[data-work-status]').innerText(), /с помощью.*учителем/);
  const geometry = await geometryCheck(page, prefix + '-' + width + '-' + id);
  await screenshot(page, prefix + '-' + width + '-' + lesson.source.exercise + '-' + (lesson.source.subpart || 'main'));
  const other = id === cases[0] ? cases[1] : cases[0];
  await returnByCatalog(page, other);
  await returnByCatalog(page, id);
  assert.equal(await page.locator('[data-final-answer]').inputValue(), draft, 'task return erased final draft');
  assert.equal(await page.locator('#afs-step-0').inputValue(), firstStep, 'task return erased step draft');
  await page.reload(); await assertReady(page, id);
  assert.equal(await page.locator('[data-final-answer]').inputValue(), draft, 'reload erased final draft');
  assert.equal(await page.locator('#afs-step-0').inputValue(), firstStep, 'reload erased step draft');
  assert.equal(await page.locator('[data-step-index]').count(), lesson.steps.length);
  assert.match(await page.locator('[data-assistance-status]').innerText(), /использована помощь/);
  assert.equal(await page.locator('[data-step-explanation="0"]').getAttribute('open'), '');
  assert.equal(await page.locator('[data-step-reason="0"]').getAttribute('open'), '');
  return { id, viewport: width, native, publicNavigator, steps: lesson.steps.length, retainedDraft: true, retainedStep: true, retainedAssistance: true, retainedExplanation: true, geometry };
}
async function makePage(origin, viewport) {
  const context = await browser.newContext({ viewport: { width: viewport, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', error => result.pageErrors.push(String(error)));
  await page.route('**/*', async route => {
    const target = new URL(route.request().url());
    if (target.origin !== origin) { result.externalRequests.push(target.href); await route.abort(); }
    else await route.continue();
  });
  return { context, page };
}
async function cabinetFixture(page, { teacher = false } = {}) {
  const apiCalls = [];
  const profile = { course: 'school', goal: null, focus: 'Курс: https://mathexam.space/geometry-course/first-steps/', version: 1 };
  const pupil = { id: 'synthetic-pupil', role: 'student', name: 'Проверочный ученик', login: 'synthetic-pupil', profile };
  const account = teacher ? { id: 'synthetic-teacher', role: 'teacher', name: 'Преподаватель', login: 'synthetic-teacher' } : pupil;
  await page.route('**/api/learning/**', async route => {
    const pathname = new URL(route.request().url()).pathname.slice('/api/learning'.length);
    apiCalls.push({ pathname, method: route.request().method() });
    const responses = {
      '/status': {}, '/session': { account, csrfToken: 'synthetic-csrf' }, '/profile': { profile },
      '/attempts': { attempts: [] }, '/assignments': { assignments: [] }, '/lessons': { lessons: [] },
      '/teacher/students': { students: [pupil] }, '/teacher/students/synthetic-pupil/profile': { profile },
      '/assistant': { enabled: false, configuredEnabled: false, available: false, mode: 'unavailable' }
    };
    if (route.request().method() !== 'GET' || !Object.hasOwn(responses, pathname)) {
      result.unexpectedRequests.push(route.request().method() + ' ' + pathname);
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'SYNTHETIC_ROUTE_NOT_ALLOWED' }) }); return;
    }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(responses[pathname]) });
  });
  return apiCalls;
}

async function run() {
  fs.mkdirSync(artifacts, { recursive: true });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'], ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
  for (const width of [1280, 390]) {
    const { context, page } = await makePage(origin, width);
    const calls = [];
    page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) calls.push(request.url()); });
    try {
      for (const id of cases) {
        await page.goto(origin + '/geometry-course/first-steps/#' + id);
        // Each representative journey starts independently; the return/reload
        // assertions within it establish restoration of actual native input.
        await page.evaluate(() => localStorage.clear()); await page.reload();
        result.viewportJourneys.push(await exerciseJourney(page, id, { prefix: 'public', width }));
        console.log('PASS public', width, id);
      }
      await page.locator('[data-course-assistant] > summary').click();
      assert.match(await page.locator('[data-course-assistant-host]').innerText(), /внутри твоего кабинета/);
      assert.equal(calls.length, 0, 'public course must not request authenticated helper APIs');
      await page.getByRole('button', { name: '← Все разделы курса', exact: true }).click();
      await screenshot(page, 'public-' + width + '-route');
      assert.equal(await page.locator('[data-route-section]').count(), 12);
    } finally { await context.close(); }
    const native = await makePage(origin, width);
    try {
      const calls = await cabinetFixture(native.page);
      for (const id of cases) {
        await native.page.goto(origin + '/learning/?role=student#atanasyan-lesson=' + id);
        result.nativeJourneys.push(await exerciseJourney(native.page, id, { prefix: 'cabinet', width, native: true }));
        console.log('PASS native', width, id);
      }
      assert(calls.every(call => call.method === 'GET'));
      assert.equal(calls.filter(call => call.pathname === '/assistant').length, 0, 'native helper stays lazy until explicitly opened');
      await native.page.locator('[data-course-assistant] > summary').click();
      await native.page.waitForFunction(() => document.querySelector('[data-course-assistant-host]')?.hidden === true);
      assert.equal(calls.filter(call => call.pathname === '/assistant').length, 1);
    } finally { await native.context.close(); }
  }
  const preview = await makePage(origin, 390);
  try {
    await preview.page.addInitScript(() => {
      window.__courseStorageCalls = [];
      for (const name of ['getItem', 'setItem', 'removeItem']) {
        const original = Storage.prototype[name];
        Storage.prototype[name] = function (...args) {
          if (String(args[0]).startsWith('mathExamAtanasyanFirstSteps') || String(args[0]).startsWith('mathExamTextbook')) window.__courseStorageCalls.push(name + ':' + args[0]);
          return original.apply(this, args);
        };
      }
    });
    const calls = await cabinetFixture(preview.page, { teacher: true });
    await preview.page.goto(origin + '/learning/?role=teacher#atanasyan-lesson=' + cases[3] + '&preview=synthetic-pupil');
    await assertReady(preview.page, cases[3]);
    assert.equal(await preview.page.locator('[data-final-answer]').isEditable(), false);
    assert.equal(await preview.page.locator('[data-save-work]').isEnabled(), false);
    await preview.page.locator('[data-guided-help] > summary').click();
    await preview.page.locator('[data-next-step]').click();
    assert.equal(await preview.page.locator('#afs-step-0').isEditable(), false);
    await preview.page.locator('[data-course-assistant] > summary').click();
    assert.match(await preview.page.locator('[data-course-assistant-host]').innerText(), /просмотр преподавателя/);
    assert.deepEqual(await preview.page.evaluate(() => window.__courseStorageCalls), []);
    assert(calls.every(call => call.method === 'GET' && call.pathname !== '/assistant'));
    await screenshot(preview.page, 'cabinet-teacher-390-readonly');
    result.teacherPreview = { readOnly: true, courseStorageCalls: 0, helperRequests: 0, geometry: await geometryCheck(preview.page, 'teacher-preview') };
    console.log('PASS teacher readonly storage and helper isolation');
  } finally { await preview.context.close(); }
  assert.deepEqual(result.pageErrors, []);
  assert.deepEqual(result.unexpectedRequests, []);
  assert.deepEqual(result.externalRequests, []);
  console.log('ATANASYAN_FIRST_STEPS_BROWSER_OK', result.viewportJourneys.length + ' public; ' + result.nativeJourneys.length + ' native; readonly preview');
}

run().catch(error => { result.failure = String(error.stack || error); console.error(error); process.exitCode = 1; })
  .finally(async () => {
    fs.mkdirSync(artifacts, { recursive: true });
    fs.writeFileSync(path.join(artifacts, 'browser-report.json'), JSON.stringify(result, null, 2) + '\n');
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  });
