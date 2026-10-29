'use strict';

// Real local browser and HTTP, synthetic accounts/responses only. This suite
// measures the cabinet UI and its identity fences, never model quality.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const ROOT = path.resolve(__dirname, '..');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'))); }
const clone = value => JSON.parse(JSON.stringify(value));
const profile = { id: 'peterson-decimals', title: '6 класс · Десятичные дроби', topics: [
  { id: 'decimal-addition', title: 'Сложение и вычитание', example: '2,35 + 0,7' },
  { id: 'decimal-division', title: 'Деление', example: '7,2 : 0,3' }
], links: [{ title: 'Тренировка вычислений', url: 'https://mathexam.space/school/peterson6/#skills' },
  { title: 'Недопустимая ссылка', url: 'javascript:window.injected=true' }] };
const pupil = { id: 'fixture-pupil-a', role: 'student', name: 'Учебный профиль A', login: 'fixture_a', profile: { course: 'school', goal: null, focus: '', version: 0 } };
const peer = { ...pupil, id: 'fixture-pupil-b', name: 'Учебный профиль B', login: 'fixture_b' };
const status = () => ({ ok: true, configuredEnabled: true, enabled: true, available: true, profile: clone(profile), mode: 'offline',
  externalAvailable: false, externalAllowed: false, externalEnabled: false, dailyLimit: 10, used: 0, remaining: 10, version: 0 });
let fixtureStatus = status(), actor = clone(pupil), calls = [], sequence = 0, failNext = false, delayNext = false, held = null, unsafeTitle = true, fixtureAttempt = null;
const makeAnswer = (contextMode = 'entered') => ({ ok: true, contextMode, answer: { answerId: 'fixture-answer-' + (++sequence), topic: 'decimal-addition',
  title: unsafeTitle ? 'Следующий шаг <img src=x onerror="window.injected=true">' : 'Сложение десятичных дробей', steps: ['Поставь запятые одну под другой.'],
  check: '', verification: 'curated-guidance', sourceIds: ['decimal-card'] }, remaining: --fixtureStatus.remaining });
const fixtureHTML = '<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
  + '<link rel="stylesheet" href="/learning/style.css"><link rel="stylesheet" href="/learning/assistant.css">'
  + '<body><main style="max-width:1000px;margin:24px auto;padding:16px"><h1>Проверка помощника</h1><div id="host" hidden></div></main>'
  + '<script src="/learning/assistant.js"></script></body></html>';
const read = req => new Promise((resolve, reject) => { let text = ''; req.on('data', data => { text += data; }); req.on('end', () => {
  try { resolve(text ? JSON.parse(text) : undefined); } catch (e) { reject(e); }
}); req.on('error', reject); });
function send(res, code, body) { if (res.destroyed || res.writableEnded) return; res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); }
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/learning/')) {
      const route = url.pathname.slice('/api/learning'.length), body = await read(req);
      calls.push({ path: route, body, method: req.method, actor: req.headers['x-learning-account'] });
      if (route === '/status') return send(res, 200, { available: true, storage: 'sqlite', trainers: [] });
      if (route === '/session') return send(res, 200, { account: clone(actor), csrfToken: 'fixture-csrf' });
      if (route === '/profile') return send(res, 200, { profile: actor.profile });
      if (route === '/attempts') return send(res, 200, { attempts: fixtureAttempt ? [clone(fixtureAttempt)] : [] });
      if (fixtureAttempt && route === '/attempts/' + fixtureAttempt.id) return send(res, 200, clone(fixtureAttempt));
      if (route === '/assignments') return send(res, 200, { assignments: [] });
      if (route === '/lessons') return send(res, 200, { lessons: [] });
      if (route === '/progress') return send(res, 200, { progress: [] });
      if (route === '/plan') return send(res, 200, { items: [], note: '' });
      if (route === '/assistant' || route.endsWith('/assistant') && req.method === 'GET') return send(res, 200,
        actor.id === peer.id ? { ...fixtureStatus, configuredEnabled: false, enabled: false, profile: null } : fixtureStatus);
      if (route.endsWith('/assistant') && req.method === 'POST') {
        fixtureStatus = { ...fixtureStatus, configuredEnabled: body.enabled, enabled: body.enabled && fixtureStatus.available,
          profileId: body.profileId, dailyLimit: body.dailyLimit, externalAllowed: body.externalAllowed, version: body.version + 1 };
        return send(res, 200, fixtureStatus);
      }
      if (route === '/assistant/ask') {
        const currentTask = fixtureAttempt && body.attemptId === fixtureAttempt.id;
        const answer = () => {
          const value = makeAnswer(body.courseContext ? 'course-task' : currentTask ? 'current-task' : 'entered');
          if (body.courseContext) {
            value.courseContext = clone(body.courseContext);
            value.answer.topic = body.courseContext.courseId === 'ichenskaya-grade7-works' ? 'ichenskaya-course-step' : 'atanasyan-course-step';
            value.answer.title = 'Подсказка к выбранному шагу';
            const courseId=body.courseContext.courseId==='ichenskaya-grade7-works'?'ichenskaya-grade7-works':'atanasyan-first-steps';
            const course=JSON.parse(fs.readFileSync(path.join(ROOT,'learning',courseId,'course.json'),'utf8'));
            const sourceStep=course.lessons.find(lesson=>lesson.id===body.courseContext.lessonId)?.steps[body.courseContext.stepIndex];
            if(sourceStep)value.answer.steps=[sourceStep.prompt,sourceStep.explanation];
          }
          return value;
        };
        if (currentTask) { fixtureAttempt.version++; fixtureAttempt.outcome = 'hinted'; fixtureAttempt.assistance.hints++; }
        if (failNext) { failNext = false; fixtureStatus.remaining--; return send(res, 503, { ok: false, error: 'ASSISTANT_SERVICE_UNAVAILABLE' }); }
        if (delayNext) { delayNext = false; held = () => send(res, 200, answer()); return; }
        return send(res, 200, answer());
      }
      if (route === '/assistant/feedback') return send(res, 200, { ok: true });
      return send(res, 404, { ok: false, error: 'LEARNING_NOT_FOUND' });
    }
    if (url.pathname === '/fixture') { res.setHeader('Content-Type', 'text/html;charset=utf-8'); return res.end(fixtureHTML); }
    const file = path.resolve(ROOT, '.' + (url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname));
    if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return res.writeHead(404).end();
    res.setHeader('Content-Type', { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' }[path.extname(file)] || 'text/plain');
    fs.createReadStream(file).pipe(res);
  } catch (_) { send(res, 500, { ok: false, error: 'FIXTURE_ERROR' }); }
});
const check = [];
async function until(predicate, message) { for (let i = 0; i < 300; i++) { if (predicate()) return; await new Promise(resolve => setTimeout(resolve, 20)); } throw Error(message); }
(async () => {
  let browser;
  const errors = [], blocked = [];
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const origin = 'http://127.0.0.1:' + server.address().port;
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking'] });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'ru-RU' });
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin === origin || ['data:', 'blob:', 'about:'].includes(url.protocol)) return route.continue();
      blocked.push(url.origin); return route.abort();
    });
    const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
    page.setDefaultTimeout(12000);
    async function mount(role = 'student', extra = {}) {
      await page.goto(origin + '/fixture');
      await page.evaluate(({ role, extra }) => {
        let active = true;
        const api = async (path, opts = {}) => {
          const response = await fetch('/api/learning' + path, { ...opts, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'fixture-csrf', 'X-Learning-Account': 'fixture-pupil-a' } });
          const value = await response.json(); if (!response.ok) throw Object.assign(Error(value.error), { code: value.error, status: response.status }); return value;
        };
        window.fixtureCourse = extra.courseContext || null; window.allowCourseAsk = true; window.courseAssisted = false;
        const courseOptions = extra.courseContext ? { ...extra, courseContext: () => window.fixtureCourse,
          onBeforeAsk: async () => { if (!window.allowCourseAsk) return false; window.courseAssisted = true; return true; } } : extra;
        const dispose = LearningAssistant.mount(document.querySelector('#host'), { api, role, studentId: role === 'teacher' ? 'fixture-pupil-a' : undefined, isCurrent: () => active, ...courseOptions });
        window.refreshAssistant = () => dispose.refresh?.();
        window.closeAssistant = () => { active = false; dispose(); };
      }, { role, extra });
      if(role!=='teacher'&&!extra.startClosed)await page.locator('[data-assistant-launcher]').click();
    }
    await mount('student',{startClosed:true});
    await page.locator('[data-assistant-launcher]').waitFor();
    assert.equal(await page.locator('.cabinet-assistant[role=dialog]').isHidden(),true);
    assert.equal(calls.filter(call=>call.path==='/assistant/ask').length,0,'Opening a cabinet never requests an answer');
    await page.locator('[data-assistant-launcher]').click();
    assert.equal(await page.locator('[data-assistant-launcher]').getAttribute('aria-expanded'),'true');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.cabinet-assistant[role=dialog]').isHidden(),true);
    assert.equal(await page.locator('[data-assistant-launcher]').evaluate(el=>el===document.activeElement),true);
    await page.locator('[data-assistant-launcher]').click();
    check.push('floating helper starts closed; opening and Escape never request an answer and restore launcher focus');
    await page.getByRole('heading', { name: 'MaxExam 0.0 · проверенные подсказки' }).waitFor();
    assert.equal(await page.getByText('Внешняя модель не подключена.', { exact: false }).count(), 1);
    assert.equal(await page.locator('[name=assistant-external-consent]').count(), 0);
    assert.equal(await page.locator('[name=assistant-question]').getAttribute('maxlength'), '1000');
    assert.equal(await page.locator('a[href^="javascript:"]').count(), 0);
    await page.locator('[data-assistant-example]').click();
    await page.getByRole('button', { name: 'Хочу подсказку', exact: true }).click();
    await page.locator('[data-assistant-answer]').waitFor();
    assert.equal(await page.locator('[data-assistant-answer] img').count(), 0);
    assert.equal(await page.evaluate(() => window.injected || false), false);
    assert.equal(calls.filter(call => call.path === '/assistant/ask')[0].body.externalConsent, false);
    assert.equal(calls.filter(call => call.path === '/assistant/ask')[0].body.hintLevel, 1);
    await page.locator('[data-assistant-close]').click();
    assert.equal(await page.locator('[data-assistant-answer]').count(),1);
    assert.equal(await page.locator('.cabinet-assistant[role=dialog]').isHidden(),true);
    await page.locator('[data-assistant-launcher]').click();
    assert.equal(await page.locator('[data-assistant-answer]').count(),1,'Closing retains source answers');
    await page.getByRole('button', { name: 'Следующая подсказка', exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('[data-assistant-answer]').length === 2);
    assert.equal(calls.filter(call => call.path === '/assistant/ask').at(-1).body.hintLevel, 2);
    await page.getByRole('button', { name: 'Объясни проще', exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('[data-assistant-answer]').length === 3);
    assert.equal(calls.filter(call => call.path === '/assistant/ask').at(-1).body.simpler, true);
    assert.equal(calls.filter(call => call.path === '/assistant/ask').at(-1).body.hintLevel, 2);
    await page.getByRole('button', { name: 'Кажется, ошибка', exact: true }).first().click();
    await page.getByText('Отметка сохранена для проверки.', { exact: false }).waitFor();
    assert.equal(calls.filter(call => call.path === '/assistant/feedback').at(-1).body.rating, 'incorrect');
    check.push('offline provenance, retained hints, smaller-step request, categorical feedback, inert model text');

    const priorCalls = calls.filter(call => call.path === '/assistant/ask').length;
    const priorReads = calls.filter(call => call.path === '/assistant' && call.method === 'GET').length;
    failNext = true; fixtureStatus.mode = 'unavailable';
    await page.locator('[name=assistant-question]').fill('7,2 : 0,3');
    await page.getByRole('button', { name: 'Хочу подсказку', exact: true }).click();
    await page.getByText('Не удалось получить ответ.', { exact: false }).waitFor();
    assert.equal(await page.locator('[name=assistant-question]').inputValue(), '7,2 : 0,3');
    assert.equal(await page.locator('[data-assistant-answer]').count(), 3);
    assert.equal(calls.filter(call => call.path === '/assistant/ask').length, priorCalls + 1, 'No automatic paid retry');
    await page.getByText('Осталось подсказок сегодня: 6 из 10.', { exact: true }).waitFor();
    assert.equal(calls.filter(call => call.path === '/assistant' && call.method === 'GET').length, priorReads + 1, 'One free status read updates quota after failure');
    assert.equal(await page.getByRole('button', { name: 'Хочу подсказку', exact: true }).isDisabled(), true);
    fixtureStatus.mode = 'offline';
    await page.getByRole('button', { name: 'Проверить подключение', exact: true }).click();
    await page.getByText('Состояние помощника обновлено.', { exact: false }).waitFor();
    assert.equal(await page.locator('[name=assistant-question]').inputValue(), '7,2 : 0,3');
    assert.equal(await page.locator('[data-assistant-answer]').count(), 3);
    assert.equal(await page.getByRole('button', { name: 'Хочу подсказку', exact: true }).isEnabled(), true);
    assert.equal(calls.filter(call => call.path === '/assistant/ask').length, priorCalls + 1, 'Checking connection does not send another question');
    assert.equal(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage })), '{}');
    check.push('failed request preserves task/steps, refreshes quota with one status GET, no retry or persisted question');

    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Mobile has no horizontal overflow: ' + JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('body *')].map(node => ({tag:node.tagName,cls:node.className,left:node.getBoundingClientRect().left,right:node.getBoundingClientRect().right})).filter(x => x.left < -1 || x.right > innerWidth + 1).slice(0,10))));
    assert.ok((await page.getByRole('button', { name: 'Объясни проще', exact: true }).boundingBox()).height >= 44);
    if (process.env.LEARNING_ASSISTANT_BROWSER_ARTIFACTS) {
      const dir = path.resolve(process.env.LEARNING_ASSISTANT_BROWSER_ARTIFACTS);
      if (!dir.startsWith(require('node:os').tmpdir() + path.sep)) throw Error('Screenshot output must be under the temporary directory');
      unsafeTitle = false; fixtureStatus = status();
      await mount(); await page.locator('[data-assistant-example]').click();
      await page.getByRole('button', { name: 'Хочу подсказку', exact: true }).click();
      await page.locator('[data-assistant-answer]').waitFor();
      fs.mkdirSync(dir, { recursive: true }); await page.screenshot({ path: path.join(dir, 'assistant-mobile.png'), fullPage: true });
      await page.setViewportSize({ width: 1440, height: 1000 }); await page.screenshot({ path: path.join(dir, 'assistant-desktop.png'), fullPage: true });
    }
    check.push('desktop/mobile readable controls and bounded layout');

    const asksBeforeUnavailable = calls.filter(call => call.path === '/assistant/ask').length;
    fixtureStatus = { ...status(), mode: 'unavailable' };
    await mount(); await page.getByRole('heading', { name: 'MaxExam 0.0 · временно недоступен' }).waitFor();
    assert.equal(await page.locator('[name=assistant-question]').count(), 0);
    fixtureStatus = status();
    await page.getByRole('button', { name: 'Проверить подключение', exact: true }).click();
    await page.getByRole('heading', { name: 'MaxExam 0.0 · проверенные подсказки' }).waitFor();
    fixtureStatus = { ...status(), examActive: true };
    await mount(); await page.getByText('Помощник будет доступен после завершения проверочной работы.', { exact: true }).waitFor();
    assert.equal(await page.locator('[name=assistant-question]').count(), 0);
    assert.equal(calls.filter(call => call.path === '/assistant/ask').length, asksBeforeUnavailable);
    check.push('unavailable service and active exam do not offer or charge requests; connection refresh is explicit');

    fixtureStatus = { ...status(), remaining: 0 };
    await mount(); await page.getByRole('heading', { name: 'MaxExam 0.0 · проверенные подсказки' }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Хочу подсказку', exact: true }).isDisabled(), true);
    fixtureStatus = { ...status(), mode: 'api', externalAvailable: true, externalAllowed: true, externalEnabled: true };
    await mount(); await page.locator('[name=assistant-external-consent]').waitFor();
    assert.equal(await page.locator('[name=assistant-external-consent]').isChecked(), false);
    await page.locator('[data-assistant-example]').click(); await page.locator('[name=assistant-external-consent]').check();
    await page.getByRole('button', { name: 'Хочу подсказку', exact: true }).click();
    await page.locator('[data-assistant-answer]').waitFor();
    assert.equal(calls.filter(call => call.path === '/assistant/ask').at(-1).body.externalConsent, true);
    assert.equal(await page.locator('[name=assistant-external-consent]').isChecked(), false, 'Consent is not silently reused for another request');
    check.push('exhausted limit blocks calls; external transfer requires explicit unchecked consent');

    fixtureStatus = { ...status(), configuredEnabled: true, enabled: false, available: false, mode: 'unavailable', version: 4 };
    await mount('teacher'); await page.getByRole('heading', { name: 'MaxExam 0.0 в этом кабинете' }).waitFor();
    assert.equal(await page.locator('[name=assistant-enabled]').isChecked(), true, 'Teacher sees saved choice even if transport is unavailable');
    await page.locator('[name=assistant-profile]').selectOption('triangle-congruence');
    await page.locator('[name=assistant-limit]').fill('6');
    await page.getByRole('button', { name: 'Сохранить настройки помощника', exact: true }).click();
    await page.getByText('Настройки помощника сохранены.', { exact: true }).waitFor();
    const config = calls.filter(call => call.path.endsWith('/assistant') && call.method === 'POST').at(-1);
    assert.equal(config.path, '/teacher/students/fixture-pupil-a/assistant'); assert.equal(config.body.version, 4);
    assert.equal(config.body.profileId, 'triangle-congruence'); assert.equal(config.body.externalAllowed, false);
    check.push('teacher configuration stays scoped, uses current version and does not activate external access');

    const courseContext = { courseId: 'atanasyan-first-steps', lessonId: 'atanasyan-7-9-main-153-part-1', stepIndex: 0 };
    const courseProfile = require('../board-server/assistant-profile-catalog.json').find(row => row.id === courseContext.courseId);
    fixtureStatus = { ...status(), mode: 'api', externalAvailable: true, externalAllowed: true, externalEnabled: true };
    await mount('teacher');
    await page.locator('[name=assistant-external]').waitFor();
    assert.equal(await page.locator('[name=assistant-external]').isChecked(), true);
    await page.locator('[name=assistant-profile]').selectOption(courseContext.courseId);
    assert.equal(await page.locator('[name=assistant-external]').isChecked(), false);
    assert.equal(await page.locator('[name=assistant-external]').isDisabled(), true);
    assert.equal(await page.locator('[name=assistant-external]').isHidden(), true);
    await page.getByRole('button', { name: 'Сохранить настройки помощника', exact: true }).click();
    await page.getByText('Настройки помощника сохранены.', { exact: true }).waitFor();
    const sourceConfig = calls.filter(call => call.path.endsWith('/assistant') && call.method === 'POST').at(-1).body;
    assert.equal(sourceConfig.profileId, courseContext.courseId);
    assert.equal(sourceConfig.externalAllowed, false);
    assert.equal(await page.locator('[name=assistant-external]').isDisabled(), true);
    check.push('selecting the source-only profile clears, hides and disables a previous external permission before saving');

    fixtureStatus = { ...status(), profile: clone(courseProfile) };
    const beforeCourseHome = calls.filter(call => call.path === '/assistant/ask').length;
    await mount(); await page.locator('[data-assistant-open-course]').first().waitFor();
    assert.equal(await page.locator('[data-assistant-open-course]').count(), 2);
    assert.equal(await page.locator('[data-assistant-open-course="atanasyan-first-steps"]').getAttribute('href'), '#atanasyan-course');
    assert.equal(await page.locator('[data-assistant-open-course="ichenskaya-grade7-works"]').getAttribute('href'), '#ichenskaya-course');
    assert.equal(await page.locator('[name=assistant-question]').count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Хочу подсказку', exact: true }).count(), 0);
    assert.equal(calls.filter(call => call.path === '/assistant/ask').length, beforeCourseHome);
    check.push('one source-profile cabinet home opens both native courses without a manual-question form or profile switch');

    fixtureStatus = { ...status(), profile: clone(courseProfile) };
    await mount('student', { courseContext, courseTaskLabel: 'Задача 153', courseTaskPrompt: 'На прямой даны точки A и B.' });
    await page.locator('[data-assistant-course-task]').waitFor();
    assert.equal(await page.locator('[name=assistant-question]').count(), 0, 'Known course condition is not manually retyped');
    assert.equal(await page.locator('[name=assistant-topic]').count(), 0, 'The selected source task determines the topic');
    assert.equal(await page.locator('[name=assistant-attempt]').count(), 0, 'Source-only guidance does not offer an ignored free-text question');
    const beforeCourse = calls.filter(call => call.path === '/assistant/ask').length;
    await page.evaluate(() => { window.allowCourseAsk = false; });
    await page.getByRole('button', { name: 'Хочу подсказку', exact: true }).click();
    await page.getByText('Подсказка не запрошена.', { exact: false }).waitFor();
    assert.equal(calls.filter(call => call.path === '/assistant/ask').length, beforeCourse);
    await page.evaluate(() => { window.allowCourseAsk = true; });
    delayNext = true;
    await page.getByRole('button', { name: 'Хочу подсказку', exact: true }).click();
    await until(() => held, 'Course fixture request did not start');
    assert.equal(await page.evaluate(() => window.courseAssisted), true, 'Local assistance is recorded before the request completes');
    const courseRequest = calls.filter(call => call.path === '/assistant/ask').at(-1).body;
    assert.deepEqual(courseRequest.courseContext, courseContext);
    for (const field of ['question', 'topic', 'solution', 'attemptId', 'profileId']) assert.equal(Object.hasOwn(courseRequest, field), false);
    assert.equal(courseRequest.externalConsent, false);
    await page.evaluate(() => { window.fixtureCourse.stepIndex = 1; refreshAssistant(); });
    held(); held = null;
    await page.locator('[data-assistant-answer]').waitFor();
    assert.equal(await page.locator('.cabinet-assistant-question').textContent(), 'Задача 153 · шаг 1', 'A late reply keeps the captured step label');
    assert.equal(await page.getByRole('button', { name: 'Хочу подсказку', exact: true }).isEnabled(), true, 'New step starts at hint one after an older reply');
    await page.getByRole('button', { name: 'Хочу подсказку', exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('[data-assistant-answer]').length === 2);
    assert.equal(calls.filter(call => call.path === '/assistant/ask').at(-1).body.hintLevel, 1);
    assert.equal(calls.filter(call => call.path === '/assistant/ask').at(-1).body.courseContext.stepIndex, 1);
    for (const count of [3, 4]) {
      await page.getByRole('button', { name: 'Ещё подсказка к шагу', exact: true }).click();
      await page.waitForFunction(count => document.querySelectorAll('[data-assistant-answer]').length === count, count);
    }
    assert.equal(await page.getByRole('button', { name: 'Ещё подсказка к шагу', exact: true }).isDisabled(), true);
    await page.evaluate(() => { window.fixtureCourse.stepIndex = 2; refreshAssistant(); });
    assert.equal(await page.getByRole('button', { name: 'Хочу подсказку', exact: true }).isEnabled(), true, 'Revealing a new step resets the exhausted hint ladder');
    assert.equal(await page.locator('[data-assistant-answer]').count(), 4, 'Refreshing current step preserves earlier answers');
    await page.setViewportSize({ width: 320, height: 780 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    check.push('course context needs no retyping; pre-ask permission/assistance, captured step label and 320px layout are retained');

    fixtureStatus = { ...status(), profile: clone(courseProfile) }; delayNext = true;
    await mount('student', { courseContext, courseTaskLabel: 'Задача 153' });
    await page.getByRole('button', { name: 'Хочу подсказку', exact: true }).click();
    await until(() => held, 'Delayed source-course request did not start');
    await page.evaluate(() => { window.fixtureCourse.lessonId = 'atanasyan-7-9-main-154-part-1'; });
    held(); held = null;
    await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('[data-assistant-answer]').count(), 0, 'A reply cannot move to another course task');
    await page.evaluate(() => closeAssistant());
    check.push('source-course task identity fences reject a stale reply without moving it to the next exercise');

    const companionContext = { courseId: 'ichenskaya-grade7-works', lessonId: 'ichenskaya-7-sr-01-v1-task-01', stepIndex: 0 };
    fixtureStatus = { ...status(), profile: clone(courseProfile) };
    const priorSettings = calls.filter(call => call.path.endsWith('/assistant') && call.method === 'POST').length;
    await mount('student', { courseContext: companionContext, courseTaskLabel: 'С-1 · вариант 1 · задача 1' });
    await page.locator('[data-assistant-course-task]').waitFor();
    assert.equal(await page.locator('[name=assistant-question]').count(), 0);
    assert.equal(await page.locator('[name=assistant-external-consent]').count(), 0);
    await page.getByRole('button', { name: 'Хочу подсказку', exact: true }).click();
    await page.locator('[data-assistant-answer]').waitFor();
    assert.deepEqual(calls.filter(call => call.path === '/assistant/ask').at(-1).body.courseContext, companionContext);
    assert.equal(await page.locator('.cabinet-assistant-question').textContent(), 'С-1 · вариант 1 · задача 1 · шаг 1');
    assert.equal(calls.filter(call => call.path.endsWith('/assistant') && call.method === 'POST').length, priorSettings);
    check.push('the companion uses the same saved source profile, task-specific label and no external or free-text form');

    for (const [initial, next] of [[courseContext, companionContext], [companionContext, courseContext]]) {
      fixtureStatus = { ...status(), profile: clone(courseProfile) }; delayNext = true;
      await mount('student', { courseContext: initial, courseTaskLabel: 'Исходная задача' });
      await page.getByRole('button', { name: 'Хочу подсказку', exact: true }).click();
      await until(() => held, 'Delayed cross-course request did not start');
      await page.evaluate(next => { window.fixtureCourse = next; }, next);
      held(); held = null;
      await page.waitForLoadState('networkidle');
      assert.equal(await page.locator('[data-assistant-answer]').count(), 0, 'An older answer cannot cross either course boundary');
      await page.evaluate(() => closeAssistant());
    }
    check.push('late responses cannot cross primary-to-companion or companion-to-primary navigation');
    await page.setViewportSize({ width: 1440, height: 1000 });

    fixtureStatus = status(); delayNext = true;
    await mount(); await page.locator('[data-assistant-example]').click();
    await page.getByRole('button', { name: 'Хочу подсказку', exact: true }).click();
    await until(() => held, 'Delayed fixture request did not start');
    await page.evaluate(() => closeAssistant()); held(); held = null;
    assert.equal(await page.locator('#host').textContent(), ''); assert.equal(await page.locator('#host').isHidden(), true);
    check.push('destroy aborts pending response and removes task/answer data');

    // The real cabinet polls attempt versions while the server has already
    // marked help and the helper response is still pending. The helper host
    // must survive that workspace update without losing its retained steps.
    fixtureStatus = status(); actor = clone(pupil);
    fixtureAttempt = { id: 'fixture-current-attempt', learnerId: pupil.id, teacherId: 'fixture-teacher',
      trainerId: 'fixture-structured', contentId: 'fixture-task', taskSpec: null, state: {}, strokes: [],
      controller: 'student', version: 0, trainerVersion: 0, outcome: 'started', assistance: { hints: 0 },
      createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };
    await page.goto(origin + '/learning/#attempt=fixture-current-attempt');
    await page.locator('[data-assistant-launcher]').click();
    await page.getByRole('heading', { name: 'MaxExam 0.0 · проверенные подсказки' }).waitFor();
    await page.locator('[data-assistant-example]').click();
    await page.getByRole('button', { name: 'Хочу подсказку', exact: true }).click();
    await page.locator('[data-assistant-answer]').waitFor();
    await page.getByText('Подсказка к текущему заданию кабинета', { exact: true }).waitFor();
    assert.equal(await page.locator('[data-assistant-answer] .cabinet-assistant-question').textContent(), 'Подсказка к текущему заданию кабинета');
    await page.waitForFunction(() => !document.querySelector('button[type=submit].primary')?.disabled);
    const pollReads = calls.filter(call => call.path === '/attempts/fixture-current-attempt').length;
    await page.evaluate(() => { window.originalAssistantQuestion = document.querySelector('[name=assistant-question]'); });
    delayNext = true;
    await page.getByRole('button', { name: 'Следующая подсказка', exact: true }).click();
    await until(() => held, 'Delayed current-task response did not start');
    await until(() => calls.filter(call => call.path === '/attempts/fixture-current-attempt').length > pollReads, 'Current attempt was not polled');
    assert.equal(await page.evaluate(() => document.querySelector('[name=assistant-question]') === window.originalAssistantQuestion), true);
    assert.equal(await page.locator('[data-assistant-answer]').count(), 1);
    assert.equal(await page.locator('[name=assistant-question]').inputValue(), '2,35 + 0,7');
    held(); held = null;
    await page.waitForFunction(() => document.querySelectorAll('[data-assistant-answer]').length === 2);
    assert.equal(calls.filter(call => call.path === '/assistant/ask').at(-1).body.attemptId, fixtureAttempt.id);
    check.push('real cabinet attempt poll preserves a pending helper view and retained steps; authoritative task label avoids false entered context');
    fixtureAttempt = null;

    // Exercise actual app.js mounting and same-browser account replacement.
    fixtureStatus = status(); actor = clone(pupil);
    await page.goto(origin + '/learning/#home');
    await page.locator('[data-assistant-launcher]').waitFor();
    const welcome = page.locator('[data-mw-close]'); if (await welcome.isVisible()) await welcome.click();
    await page.locator('[data-assistant-launcher]').click();
    await page.getByRole('heading', { name: 'MaxExam 0.0 · проверенные подсказки' }).waitFor();
    await page.locator('[data-assistant-example]').click(); delayNext = true;
    await page.getByRole('button', { name: 'Хочу подсказку', exact: true }).click();
    await until(() => held, 'Actual cabinet request did not start');
    actor = clone(peer);
    await page.evaluate(() => LearningApp.synchronizeAccount({ shield: true }));
    held(); held = null;
    await page.waitForFunction(() => LearningApp.account()?.id === 'fixture-pupil-b');
    assert.equal(await page.locator('#cabinet-assistant-host').isHidden(), true);
    assert.equal(await page.locator('[data-assistant-answer]').count(), 0);
    assert.equal(await page.locator('body').textContent().then(text => text.includes('Следующий шаг <img')), false);
    actor = clone(pupil); await page.evaluate(() => LearningApp.synchronizeAccount({ shield: true }));
    await page.locator('[data-assistant-launcher]').click();
    await page.getByRole('heading', { name: 'MaxExam 0.0 · проверенные подсказки' }).waitFor();
    await page.evaluate(() => LearningApp.navigate('security'));
    await page.waitForFunction(() => document.querySelector('#cabinet-assistant-host').hidden);
    check.push('actual cabinet route wiring and account-switch fence hide prior pupil data');

    // app.js recognises a run parameter even when it is not the first hash key.
    // Helper availability from a prior route must not make it appear in a run.
    await page.goto(origin + '/learning/#home');
    // A hash-only goto keeps the security test's parked document; reload the
    // synthetic pupil session before testing the independent run-route case.
    await page.reload();
    await page.locator('[data-assistant-launcher]').click();
    await page.getByRole('heading', { name: 'MaxExam 0.0 · проверенные подсказки' }).waitFor();
    const beforeRunReads = calls.filter(call => call.path === '/assistant' && call.method === 'GET').length;
    await page.evaluate(() => LearningApp.navigate('route&run=fixture-exam'));
    await page.getByRole('heading', { name: 'Работа временно недоступна', exact: true }).waitFor();
    await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('#cabinet-assistant-host').isHidden(), true);
    assert.equal(calls.filter(call => call.path === '/assistant' && call.method === 'GET').length, beforeRunReads);
    check.push('exam run parameter suppresses the helper regardless of hash-key order');

    // Real native course renderer: launcher is visible throughout a lesson,
    // while its status and source answer are still requested only on demand.
    actor = clone(pupil); actor.profile.focus = 'https://mathexam.space/geometry-course/first-steps/';
    fixtureStatus = { ...status(), profile: clone(courseProfile) }; unsafeTitle = false;
    for(const [width,courseRoute] of [[1440,'atanasyan-lesson=atanasyan-7-9-main-1-part-1'],[390,'ichenskaya-lesson=ichenskaya-7-sr-01-v1-task-01']]){
      await page.setViewportSize({width,height:width===1440?1000:844});
      const reads=calls.filter(call=>call.path==='/assistant').length,asks=calls.filter(call=>call.path==='/assistant/ask').length;
      await page.goto(origin+'/learning/?role=student#'+courseRoute);
      await page.locator('[data-assistant-launcher]').waitFor();
      assert.equal(await page.locator('.cabinet-assistant[role=dialog]').isHidden(),true);
      assert.equal(calls.filter(call=>call.path==='/assistant').length,reads,'Native launcher does not read status until opened');
      const launchBox=await page.locator('[data-assistant-launcher]').boundingBox();
      assert(width-launchBox.x-launchBox.width<30);assert((width===1440?1000:844)-launchBox.y-launchBox.height<30);
      await page.locator('[data-assistant-launcher]').click();
      await page.getByRole('button',{name:'Хочу подсказку',exact:true}).waitFor();
      assert.equal(calls.filter(call=>call.path==='/assistant/ask').length,asks,'Opening the panel does not request a source answer');
      await page.getByRole('button',{name:'Хочу подсказку',exact:true}).click();
      await page.locator('[data-assistant-answer]').waitFor();
      await page.waitForFunction(()=>!document.querySelector('.cabinet-assistant-actions button[type=submit]')?.disabled);
      assert.match(await page.locator('[data-assistance-status]').innerText(),/использована помощь/);
      assert.equal(calls.filter(call=>call.path==='/assistant/ask').at(-1).body.courseContext.courseId,courseRoute.startsWith('atanasyan')?'atanasyan-first-steps':'ichenskaya-grade7-works');
      const panelBox=await page.locator('.cabinet-assistant[role=dialog]').boundingBox();assert(panelBox.x>=0&&panelBox.y>=0&&panelBox.x+panelBox.width<=width+1);
      if(process.env.LEARNING_ASSISTANT_BROWSER_ARTIFACTS){const dir=path.resolve(process.env.LEARNING_ASSISTANT_BROWSER_ARTIFACTS);fs.mkdirSync(dir,{recursive:true});await page.screenshot({path:path.join(dir,'native-assistant-'+width+'.png')});}
      await page.locator('[data-assistant-close]').click();assert.equal(await page.locator('[data-assistant-answer]').count(),1);
      await page.getByRole('button',{name:'← Все разделы курса',exact:true}).click();await page.getByRole('button',{name:'← В кабинет',exact:true}).click();await page.locator('[data-attached-course]').first().waitFor();
      assert.equal(await page.locator('[data-assistant-answer]').count(),0);
    }
    check.push('actual native Atanasyan and Ichenskaya renderers keep a lazy lower-right helper on desktop/mobile, record help before the answer, and clear context on exit');

    assert.deepEqual(errors, []);
    assert.deepEqual(blocked, []);
    console.log(JSON.stringify({ gate: 'MATHEXAM_ASSISTANT_CABINET_BROWSER_OK', checks: check, liveModelRequests: 0 }, null, 2));
  } finally {
    if (held) { held(); held = null; }
    await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
