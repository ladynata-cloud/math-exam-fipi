'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(__dirname, '..');
const runtimeModules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
let chromium;
try { ({ chromium } = require('playwright')); } catch (_) {
  if (!runtimeModules) throw Error('Playwright is required. Install playwright, set NODE_PATH, or set CODEX_PRIMARY_RUNTIME_NODE_MODULES to its node_modules directory.');
  ({ chromium } = require(path.join(runtimeModules, 'playwright')));
}

async function run() {
  const fixture = '<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/learning/style.css"><link rel="stylesheet" href="/learning/teaching.css"><body><div class="content-column"><main id="host" style="max-width:1160px;margin:auto"></main></div><script src="/learning/catalog.js"></script><script src="/learning/teaching.js"></script></body></html>';
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (pathname === '/fixture') { response.setHeader('Content-Type', 'text/html;charset=utf-8'); return response.end(fixture); }
    if (/^\/api\/learning\/photos\/photo[0-9]+$/.test(pathname)) { response.setHeader('Content-Type','image/png'); return fs.createReadStream(path.join(root,'learning/reference-assets/fipi-2027-algebra.png')).pipe(response); }
    const file = path.resolve(root, '.' + pathname);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return response.writeHead(404).end();
    response.setHeader('Content-Type', { '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' }[path.extname(file)] || 'text/plain'); fs.createReadStream(file).pipe(response);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}), args: ['--no-sandbox'] });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:' + server.address().port + '/fixture');
    await page.evaluate(() => {
      window.calls = []; window.messages = [];
      const now = Date.UTC(2026, 9, 4);
      window.report = { student: { id: 'learner1', name: 'Тестовый ученик' }, generatedAt: now,
        counts: { started: 1, together: 1, hinted: 1, independent: 1, repeated: 0 },
        attempts: [{ id: 'a1', catalogId: 'path:triangle', title: 'Высота и теорема Пифагора', outcome: 'independent', updatedAt: now },
          { id: 'a2', catalogId: 'path:quadrilateral', title: 'Параллелограмм и трапеция', outcome: 'hinted', updatedAt: now },
          { id: 'old1', catalogId: 'path:triangle', title: 'Предыдущее решение', outcome: 'independent', archivedAt: now - 1000, updatedAt: now - 1000 }],
        positions: Array.from({ length: 21 }, (_, i) => ({ position: i + 1, started: i === 11 ? 2 : 0, independentlySolved: i === 11 ? 1 : 0, contentCount: i === 11 ? 1 : 0 })), assignments: [] };
      window.plan = { items: [{ catalogId: 'path:triangle', reason: 'Закрепить выбор высоты', priority: 'high' }], note: 'Следующее занятие' };
      window.assignment = { assignment: { id: 'hw1', title: 'Площади — два формата', status: 'draft', dueAt: '2026-10-10' }, attempt: { id: 'a1', trainerId: 'ege-path', contentId: 'triangle', outcome: 'started' }, photos: [], feedback: [], reviewRevision: 'ab'.repeat(32) };
      window.savedDrafts = [{id:'existing-draft',recommendations:[{catalogId:'path:practice-work',reason:'Повторить сложение производительностей',priority:'normal'}],parentNote:'',createdAt:now,status:'requires-teacher-review'}];
      window.apiMock = async (route, options = {}) => {
        const body = options.body && JSON.parse(options.body); calls.push({ route, method: options.method || 'GET', body });
        if (route.endsWith('/report')) return report;
        if (route.endsWith('/profile') && !body) return {profile:{course:'school',goal:null,focus:'',version:0,updatedAt:null}};
        if (route.endsWith('/plan')) { if (body) plan = { items: body.items, note: body.note }; return plan; }
        if (route.endsWith('/ai-drafts')) { if (!body) return {drafts:savedDrafts}; const draft={...body,id:'draft1',status:'requires-teacher-review',createdAt:now}; savedDrafts.unshift(draft); return {draft}; }
        if (route.endsWith('/reset')) return { archived: 2, preservedHistory: true };
        if (route.endsWith('/photos') && body) {
          if (window.failPhotoOnce) { window.failPhotoOnce = false; throw TypeError('lost response'); }
          assignment.photos.push({ id: 'photo' + assignment.photos.length, kind: body.kind, filename: body.filename, url: '/api/learning/photos/photo' + assignment.photos.length, createdAt: now });
          return { photo: assignment.photos.at(-1) };
        }
        if (route.endsWith('/publish')) { assignment.assignment.status = 'published'; return { published: true }; }
        if (route.endsWith('/feedback')) { if (body.reviewRevision !== assignment.reviewRevision) throw Object.assign(Error('stale review'), { status: 409 }); assignment.feedback.push({ text: body.text, status: body.status, createdAt: now }); return { feedback: assignment.feedback.at(-1) }; }
        if (route === '/assignments/hw1') return assignment;
        throw Error('Unexpected API route ' + route);
      };
      window.openView = (page, role = 'teacher') => {
        if (window.cleanup) window.cleanup();
        window.cleanup = LearningTeaching.mount(document.querySelector('#host'), { page, id: page === 'assignment' ? 'hw1' : 'learner1', account: { role }, catalog: LearningCatalog, students: [{ id: 'learner1', name: 'Тестовый ученик' }], api: apiMock, notice: (message, error) => messages.push({ message, error }), navigate: route => { window.navigated = route; } });
      };
      openView('student');
    });
    await page.getByRole('heading', { name: 'Тестовый ученик', exact: true }).waitFor();
    assert.equal(await page.locator('.teaching-stat').nth(3).locator('strong').textContent(), '1', 'Archived independent attempt must not inflate active count');
    assert.ok((await page.locator('#teaching-parent-text').inputValue()).includes('4 октября 2026'));
    assert.ok((await page.locator('#teaching-parent-text').inputValue()).includes('Одно решение не означает освоение'));
    assert.equal(await page.locator('.teaching-position-grid article').count(), 21);
    await page.locator('.teaching-ai-saved summary').click();
    await page.locator('[data-open-ai="0"]').click();
    await page.getByText('Повторить сложение производительностей', { exact: false }).waitFor();
    assert.equal(await page.locator('[data-plan-row]').count(), 1, 'Reopening a saved draft cannot change the plan');
    await page.locator('#teaching-ai textarea').fill(JSON.stringify({ recommendations: [{ catalogId: 'unknown', reason: 'x', priority: 'high' }] }));
    await page.locator('#teaching-ai [type=submit]').click();
    assert.ok((await page.locator('#teaching-ai .form-error').textContent()).includes('Неизвестный тренажёр'));
    assert.equal(await page.evaluate(() => calls.filter(call => call.method === 'POST' && call.route.endsWith('/ai-drafts')).length), 0);
    const reason = '<img src=x onerror="window.injected=true"> Нужна практика';
    await page.locator('#teaching-ai textarea').fill(JSON.stringify({ recommendations: [{ catalogId: 'path:quadrilateral', reason, priority: 'normal' }], parentNote: 'Обсудить выбор высоты.' }));
    await page.locator('#teaching-ai [type=submit]').click();
    await page.getByRole('heading', { name: 'Черновик сохранён' }).waitFor();
    assert.equal(await page.evaluate(() => window.injected || false), false);
    assert.equal(await page.locator('.teaching-ai-preview img').count(), 0);
    assert.equal(await page.evaluate(() => calls.filter(call => call.method === 'POST' && call.route === '/assignments').length), 0, 'AI draft cannot assign work');
    await page.locator('[data-ai-choice="0"]').check();
    await page.locator('[data-ai-to-plan]').click();
    assert.equal(await page.locator('[data-plan-row]').count(), 2);
    assert.equal(await page.evaluate(() => calls.filter(call => call.method === 'POST' && call.route.endsWith('/plan')).length), 0, 'Adding draft to editor cannot auto-save a plan');
    await page.locator('#teaching-plan [type=submit]').click();
    await page.waitForFunction(() => calls.some(call => call.method === 'POST' && call.route.endsWith('/plan')));
    assert.equal(await page.evaluate(() => plan.items.length), 2);
    await page.locator('.teaching-reset summary').click();
    await page.locator('#teaching-reset [name=scope]').selectOption('content');
    await page.locator('#teaching-reset [name=value]').selectOption('path:triangle');
    await page.locator('#teaching-reset [name=reason]').fill('Новая самостоятельная проверка');
    await page.locator('#teaching-reset [type=submit]').click();
    assert.equal(await page.evaluate(() => calls.filter(call => call.route.endsWith('/reset')).length), 0, 'Reset needs explicit checkbox');
    await page.locator('#teaching-reset [name=confirm]').check();
    await page.locator('#teaching-reset [type=submit]').click();
    await page.waitForFunction(() => calls.some(call => call.route.endsWith('/reset')));
    const reset = await page.evaluate(() => calls.find(call => call.route.endsWith('/reset')).body);
    assert.equal(reset.scope, 'content'); assert.equal(reset.value, 'path:triangle'); assert.ok(reset.opId);

    await page.evaluate(() => openView('assignment'));
    await page.getByRole('heading', { name: 'Площади — два формата' }).waitFor();
    assert.equal(await page.locator('[data-publish]').isDisabled(), true);
    const photoFile = path.join(root, 'learning/reference-assets/fipi-2027-algebra.png');
    await page.locator('#teaching-photo [type=file]').setInputFiles(photoFile);
    await page.waitForFunction(() => !document.querySelector('#teaching-photo [type=submit]').disabled);
    assert.equal(await page.locator('.teaching-photo-preview img').count(), 1);
    assert.equal(await page.evaluate(() => calls.filter(call => call.route.endsWith('/photos')).length), 0, 'Selecting a file only previews it');
    await page.evaluate(() => { window.failPhotoOnce = true; });
    await page.locator('#teaching-photo [type=submit]').click();
    await page.waitForFunction(() => messages.some(message => message.error));
    await page.locator('#teaching-photo [type=submit]').click();
    await page.waitForFunction(() => document.querySelector('[data-publish]') && !document.querySelector('[data-publish]').disabled);
    const uploads = await page.evaluate(() => calls.filter(call => call.route.endsWith('/photos')).map(call => call.body));
    assert.equal(uploads.length, 2); assert.equal(uploads[0].opId, uploads[1].opId, 'Retry must retain operation ID');
    assert.equal(uploads[1].mime, 'image/jpeg'); assert.equal(uploads[1].kind, 'task');
    assert.ok(Buffer.from(uploads[1].data, 'base64').length <= 3 * 1024 * 1024);
    assert.equal(Buffer.from(uploads[1].data, 'base64').subarray(0, 2).toString('hex'), 'ffd8');
    await page.locator('[data-publish]').click();
    await page.waitForFunction(() => !document.querySelector('[data-publish]'));
    assert.equal(await page.locator('#teaching-photo').count(), 0, 'Published teacher condition cannot be edited');
    await page.locator('#teaching-feedback [name=text]').fill('Основание выбрано верно. Проверь высоту к нему.');
    await page.locator('#teaching-feedback [name=status]').selectOption('revise');
    await page.locator('#teaching-feedback [type=submit]').click();
    await page.getByText('Основание выбрано верно. Проверь высоту к нему.', { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => calls.find(call => call.route.endsWith('/feedback')).body.reviewRevision), 'ab'.repeat(32), 'Teacher feedback carries the viewed revision');
    await page.evaluate(() => openView('assignment', 'student'));
    await page.getByRole('heading', { name: 'Копии решений в кабинете' }).waitFor();
    assert.equal(await page.locator('#teaching-feedback').count(), 0);
    assert.equal(await page.locator('[data-publish]').count(), 0);
    await page.locator('#teaching-photo [type=file]').setInputFiles(photoFile);
    await page.waitForFunction(() => !document.querySelector('#teaching-photo [type=submit]').disabled);
    await page.locator('#teaching-photo [type=submit]').click();
    await page.waitForFunction(() => calls.filter(call => call.route.endsWith('/photos')).at(-1)?.body.kind === 'solution');
    assert.equal(await page.evaluate(() => LearningTeaching.safePhotoUrl('https://external.invalid/photo.png')), '');
    assert.equal(await page.evaluate(() => LearningTeaching.safePhotoUrl('/api/learning/photos/x?token=secret')), '');
    await page.setViewportSize({ width: 375, height: 812 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    if (process.env.LEARNING_ARTIFACT_DIR) { fs.mkdirSync(process.env.LEARNING_ARTIFACT_DIR, { recursive: true }); await page.screenshot({ path: path.join(process.env.LEARNING_ARTIFACT_DIR, 'homework-student-mobile.png'), fullPage: true }); }
    await page.evaluate(() => openView('student', 'student'));
    await page.getByText('Этот раздел доступен преподавателю.', { exact: true }).waitFor();
    assert.equal(await page.locator('#teaching-reset').count(), 0);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => openView('student'));
    await page.getByRole('heading', { name: 'Тестовый ученик', exact: true }).waitFor();
    await page.evaluate(() => { window.print = () => {}; });
    await page.locator('[data-parent-print]').click();
    await page.emulateMedia({ media: 'print' });
    assert.equal(await page.locator('.teaching-print-text').isVisible(), true);
    assert.equal(await page.locator('#teaching-parent-text').isVisible(), false);
    assert.equal(await page.locator('#teaching-plan').isVisible(), false);
    await page.evaluate(() => dispatchEvent(new Event('afterprint')));
    await page.emulateMedia({ media: 'screen' });
    if (process.env.LEARNING_ARTIFACT_DIR) await page.screenshot({ path: path.join(process.env.LEARNING_ARTIFACT_DIR, 'teacher-report-desktop.png'), fullPage: true });
    await page.evaluate(() => { assignment.assignment.status = 'archived'; openView('assignment'); });
    await page.getByText('АРХИВ УЧЕБНОЙ РАБОТЫ', { exact: true }).waitFor();
    assert.equal(await page.locator('#teaching-photo').count(), 0);
    assert.equal(await page.locator('#teaching-feedback').count(), 0);
    assert.equal(await page.locator('[data-publish]').count(), 0);
    assert.equal(await page.getByText('Перед выдачей подготовьте оба формата', { exact: true }).count(), 0);
    assert.deepEqual(errors, []);
    console.log('LEARNING_TEACHING_BROWSER_OK (report counts/print, epoch dates, 21 positions, saved AI drafts, explicit reset, photo preview/retry/publish/solution, archived read-only, roles, mobile)');
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
