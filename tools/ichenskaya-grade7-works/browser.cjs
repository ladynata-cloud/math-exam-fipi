'use strict';
// Actual source rendering and native input. Synthetic accounts only, no provider.
// With Playwright installed: node tools/ichenskaya-grade7-works/browser.cjs
// Optional: PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, ICHENSKAYA_WORKS_ARTIFACTS.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
const artifacts = path.resolve(process.env.ICHENSKAYA_WORKS_ARTIFACTS || '/tmp/ichenskaya-course-qa');
const course = JSON.parse(fs.readFileSync(path.join(root, 'learning/ichenskaya-grade7-works/course.json'), 'utf8'));
const lessons = new Map(course.lessons.map(lesson => [lesson.id, lesson]));
const cases = ['ichenskaya-7-sr-01-v1-task-01', 'ichenskaya-7-sr-07-v1-task-02', 'ichenskaya-7-sr-09-v2-task-01',
  'ichenskaya-7-sr-10-v1-task-01', 'ichenskaya-7-kr-02-v2-task-03', 'ichenskaya-7-sr-13-v1-task-02',
  'ichenskaya-7-sr-16-v2-task-02', 'ichenskaya-7-kr-06-v2-task-04'];
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
const server = http.createServer((request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
  catch (_) { response.writeHead(400).end(); return; }
  if (!/^\/(?:learning|geometry-course|ege-baza\/path)\//.test(pathname) || pathname.split('/').some(part => part.startsWith('.'))) { response.writeHead(404).end(); return; }
  const file = path.resolve(root, '.' + pathname + (pathname.endsWith('/') ? 'index.html' : ''));
  if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  fs.readFile(file, (error, bytes) => { if (error) { response.writeHead(404).end(); return; }
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); response.end(bytes); });
});
const result = { public: [], native: [], courseSwitches: [], teacherPreview: null, screenshots: [], pageErrors: [], unexpectedRequests: [], externalRequests: [] };
let browser;
const normalize = value => value.replace(/\s+/g, ' ').trim();
async function ready(page, id) {
  await page.locator('[data-full-condition]').waitFor(); await page.locator('[data-course-model] .planar-svg').waitFor();
  const lesson = lessons.get(id), label = (lesson.source.collection === 'sr' ? 'С-' : 'К-') + lesson.source.work
    + ' · вариант ' + lesson.source.variant + ' · №' + lesson.source.exercise;
  assert((await page.locator('.afs-task-header h1').innerText()).includes(label));
  const expected = await page.evaluate(text => { const node = document.createElement('p'); StereoMath.appendText(node, text); return node.textContent; },
    course.displayOverrides?.[id]?.statementText || lesson.statement.text);
  assert.equal(normalize(await page.locator('[data-full-condition]').textContent()), normalize(expected), id + ': complete source condition');
  const early = lesson.source.work <= (lesson.source.collection === 'sr' ? 10 : 2);
  assert.match(await page.locator('[data-lesson-boundary]').innerText(), early ? /подходит к основному курсу/ : /выходит за пределы/);
}
async function geometry(page, label) {
  const shape = await page.evaluate(() => {
    const svg = document.querySelector('[data-course-model] .planar-svg'), view = svg.closest('.planar-viewport').getBoundingClientRect();
    const labels = [...svg.querySelectorAll('.planar-label')].map(node => { const r = node.getBoundingClientRect(); return { text: node.textContent,
      clipped: r.left < view.left - 2 || r.right > view.right + 2 || r.top < view.top - 2 || r.bottom > view.bottom + 2 }; });
    return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, svgWidth: svg.getBoundingClientRect().width, labels };
  });
  assert(shape.scrollWidth <= shape.width + 1, label + ': horizontal overflow ' + JSON.stringify(shape));
  assert(shape.svgWidth > 150 && shape.labels.length > 0, label + ': usable labeled drawing');
  assert(!shape.labels.some(item => item.clipped), label + ': clipped labels ' + JSON.stringify(shape.labels.filter(item => item.clipped)));
  return shape;
}
async function screenshot(page, name, top = true) {
  if (top) await page.evaluate(() => window.scrollTo(0, 0));
  const file = path.join(artifacts, name + '.png'); await page.screenshot({ path: file, fullPage: false }); result.screenshots.push(file);
}
async function selectFromHome(page, id) {
  const lesson = lessons.get(id);
  await page.locator('[data-course-search]').fill((lesson.source.collection === 'sr' ? 'С-' : 'К-') + lesson.source.work);
  await page.locator('[data-lesson-id="' + id + '"]').click(); await ready(page, id);
}
async function reopen(page, id) { await page.getByRole('button', { name: '← Все разделы курса', exact: true }).click(); await selectFromHome(page, id); }
async function journey(page, id, width, mode) {
  const lesson = lessons.get(id), draft = 'Моё решение: ' + id + '. Записываю данные и обоснование.', step = 'Мой первый шаг: называю известные элементы.';
  await ready(page, id); await page.locator('[data-final-answer]').fill(draft);
  await page.locator('[data-guided-help] > summary').click(); await page.locator('[data-next-step]').click();
  await page.locator('#afs-step-0').fill(step); await page.locator('[data-step-explanation="0"] > summary').click();
  await page.locator('[data-step-reason="0"] > summary').click();
  await page.locator('[data-step-index="0"]').getByRole('button', { name: 'Показать на чертеже', exact: true }).click();
  await page.locator('[data-guided-help] > summary').click(); await page.locator('[data-guided-help] > summary').click();
  for (let index = 1; index < lesson.steps.length; index++) {
    await page.locator('[data-next-step]').click(); assert.equal(await page.locator('#afs-step-0').inputValue(), step);
  }
  assert.equal(await page.locator('[data-final-answer]').inputValue(), draft);
  assert.equal(await page.locator('[data-step-explanation="0"]').getAttribute('open'), '');
  assert.equal(await page.locator('[data-step-reason="0"]').getAttribute('open'), '');
  await page.locator('[data-save-work]').click(); assert.match(await page.locator('[data-save-status]').innerText(), /сохранена.*устройстве.*учителем/);
  assert.match(await page.locator('[data-work-status]').innerText(), /с помощью.*учителем/);
  const drawing = await geometry(page, mode + '-' + width + '-' + id);
  await screenshot(page, mode + '-' + width + '-' + id);
  if (id === cases[1] && width === 390) { await page.locator('[data-step-index="0"]').scrollIntoViewIfNeeded(); await screenshot(page, mode + '-390-step-writing', false); }
  await reopen(page, id === cases[0] ? 'ichenskaya-7-sr-01-v2-task-01' : cases[0]); await reopen(page, id);
  assert.equal(await page.locator('[data-final-answer]').inputValue(), draft); assert.equal(await page.locator('#afs-step-0').inputValue(), step);
  await page.reload(); await ready(page, id);
  assert.equal(await page.locator('[data-final-answer]').inputValue(), draft); assert.equal(await page.locator('#afs-step-0').inputValue(), step);
  assert.equal(await page.locator('[data-step-index]').count(), lesson.steps.length);
  assert.equal(await page.locator('[data-step-explanation="0"]').getAttribute('open'), '');
  assert.equal(await page.locator('[data-step-reason="0"]').getAttribute('open'), '');
  assert.match(await page.locator('[data-assistance-status]').innerText(), /использована помощь/);
  return { id, width, steps: lesson.steps.length, retainedDraft: true, retainedStep: true, retainedHelp: true, drawing };
}
async function pageFor(origin, width) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' }), page = await context.newPage();
  page.on('pageerror', error => result.pageErrors.push(String(error)));
  await page.route('**/*', async route => { const url = new URL(route.request().url());
    if (url.origin !== origin) { result.externalRequests.push(url.href); await route.abort(); } else await route.continue(); });
  return { context, page };
}
async function cabinet(page, teacher = false) {
  const calls = [], profile = { course: 'school', goal: null, focus: 'Курс: https://mathexam.space/geometry-course/first-steps/', version: 1 };
  const pupil = { id: 'synthetic-pupil', role: 'student', name: 'Проверочный ученик', login: 'synthetic-pupil', profile };
  const account = teacher ? { id: 'synthetic-teacher', role: 'teacher', name: 'Преподаватель', login: 'synthetic-teacher' } : pupil;
  await page.route('**/api/learning/**', async route => {
    const pathname = new URL(route.request().url()).pathname.slice('/api/learning'.length); calls.push({ pathname, method: route.request().method() });
    const responses = { '/status': {}, '/session': { account, csrfToken: 'synthetic-csrf' }, '/profile': { profile }, '/attempts': { attempts: [] },
      '/assignments': { assignments: [] }, '/lessons': { lessons: [] }, '/teacher/students': { students: [pupil] }, '/teacher/students/synthetic-pupil/profile': { profile },
      '/assistant': { enabled: false, configuredEnabled: false, available: false, mode: 'unavailable' } };
    if (route.request().method() !== 'GET' || !Object.hasOwn(responses, pathname)) {
      result.unexpectedRequests.push(route.request().method() + ' ' + pathname); await route.fulfill({ status: 404, body: '{}' }); return;
    }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(responses[pathname]) });
  });
  return calls;
}
async function switchCourses(page, origin, width) {
  const primaryId = 'atanasyan-7-9-main-1-part-1';
  await page.goto(origin + '/learning/?role=student#atanasyan-lesson=' + primaryId);
  await page.locator('[data-final-answer]').fill('Запись в основном курсе остаётся своей.');
  assert.equal(await page.locator('.afs-original-link').getAttribute('href'), 'https://mathexam.space/geometry-course/textbook/#' + primaryId);
  await page.getByRole('button', { name: '← Все разделы курса', exact: true }).click();
  await page.locator('[data-companion-course]').click(); await page.locator('[data-course-boundary]').waitFor(); await selectFromHome(page, cases[0]);
  assert.match(await page.locator('[data-final-answer]').inputValue(), /Моё решение: ichenskaya/);
  await page.locator('[data-final-answer]').fill('Отдельная запись в сборнике Иченской.');
  await page.getByRole('button', { name: '← Все разделы курса', exact: true }).click(); await page.locator('[data-companion-course]').click();
  await page.locator('[data-lesson-id="' + primaryId + '"]').click();
  assert.equal(await page.locator('[data-final-answer]').inputValue(), 'Запись в основном курсе остаётся своей.');
  await page.getByRole('button', { name: '← Все разделы курса', exact: true }).click(); await page.locator('[data-companion-course]').click(); await selectFromHome(page, cases[0]);
  assert.equal(await page.locator('[data-final-answer]').inputValue(), 'Отдельная запись в сборнике Иченской.');
  await page.getByRole('button', { name: '← Все разделы курса', exact: true }).click(); await page.getByRole('button', { name: '← В кабинет', exact: true }).click();
  await page.locator('[data-attached-course="ichenskaya-grade7-works"]').waitFor();
  assert.equal(await page.locator('[data-attached-course]').count(), 2); await screenshot(page, 'cabinet-' + width + '-two-courses');
  return { width, primaryDraftRetained: true, companionDraftRetained: true, cards: 2 };
}
async function run() {
  fs.mkdirSync(artifacts, { recursive: true });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'], ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
  for (const width of [1280, 390]) {
    const publicView = await pageFor(origin, width), publicCalls = [];
    publicView.page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) publicCalls.push(request.url()); });
    try {
      for (const id of cases) {
        await publicView.page.goto(origin + '/geometry-course/ichenskaya-7-works/#' + id); await publicView.page.evaluate(() => localStorage.clear()); await publicView.page.reload();
        result.public.push(await journey(publicView.page, id, width, 'public')); console.log('PASS public', width, id);
      }
      await publicView.page.locator('[data-course-assistant] > summary').click();
      assert.match(await publicView.page.locator('[data-course-assistant-host]').innerText(), /внутри твоего кабинета/); assert.equal(publicCalls.length, 0);
      await publicView.page.getByRole('button', { name: '← Все разделы курса', exact: true }).click();
      assert.equal(await publicView.page.locator('[data-route-section]').count(), 23); await screenshot(publicView.page, 'public-' + width + '-work-catalog');
    } finally { await publicView.context.close(); }
    const native = await pageFor(origin, width);
    try {
      const calls = await cabinet(native.page);
      for (const id of cases) {
        await native.page.goto(origin + '/learning/?role=student#ichenskaya-lesson=' + id);
        result.native.push(await journey(native.page, id, width, 'cabinet')); console.log('PASS native', width, id);
      }
      assert.equal(calls.filter(call => call.pathname === '/assistant').length, 0, 'helper stays lazy');
      await native.page.locator('[data-course-assistant] > summary').click();
      await native.page.waitForFunction(() => document.querySelector('[data-course-assistant-host]')?.hidden === true);
      assert.equal(calls.filter(call => call.pathname === '/assistant').length, 1);
      result.courseSwitches.push(await switchCourses(native.page, origin, width));
    } finally { await native.context.close(); }
  }
  const preview = await pageFor(origin, 390);
  try {
    await preview.page.addInitScript(() => {
      window.__courseStorageCalls = [];
      for (const method of ['getItem', 'setItem', 'removeItem']) { const original = Storage.prototype[method]; Storage.prototype[method] = function (...args) {
        if (/^mathExam(?:AtanasyanFirstSteps|IchenskayaGrade7Works|Textbook)/.test(String(args[0]))) window.__courseStorageCalls.push(method + ':' + args[0]);
        return original.apply(this, args);
      }; }
    });
    const calls = await cabinet(preview.page, true);
    await preview.page.goto(origin + '/learning/?role=teacher#ichenskaya-lesson=' + cases.at(-1) + '&preview=synthetic-pupil'); await ready(preview.page, cases.at(-1));
    assert.equal(await preview.page.locator('[data-final-answer]').isEditable(), false); assert.equal(await preview.page.locator('[data-save-work]').isEnabled(), false);
    await preview.page.locator('[data-guided-help] > summary').click(); await preview.page.locator('[data-next-step]').click();
    assert.equal(await preview.page.locator('#afs-step-0').isEditable(), false); await preview.page.locator('[data-course-assistant] > summary').click();
    assert.match(await preview.page.locator('[data-course-assistant-host]').innerText(), /просмотр преподавателя/);
    assert.deepEqual(await preview.page.evaluate(() => window.__courseStorageCalls), []); assert.equal(calls.filter(call => call.pathname === '/assistant').length, 0);
    result.teacherPreview = { storageCalls: 0, assistantCalls: 0, readOnly: true, drawing: await geometry(preview.page, 'teacher-preview') };
    await screenshot(preview.page, 'teacher-390-readonly');
  } finally { await preview.context.close(); }
  assert.deepEqual(result.pageErrors, []); assert.deepEqual(result.unexpectedRequests, []); assert.deepEqual(result.externalRequests, []);
  console.log('ICHENSKAYA_GRADE7_WORKS_BROWSER_OK', result.public.length + ' public; ' + result.native.length + ' native; ' + result.courseSwitches.length + ' preserved two-course switches; readonly preview');
}
run().catch(error => { result.failure = String(error.stack || error); console.error(error); process.exitCode = 1; })
  .finally(async () => { fs.mkdirSync(artifacts, { recursive: true }); fs.writeFileSync(path.join(artifacts, 'browser-report.json'), JSON.stringify(result, null, 2) + '\n');
    if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); });
