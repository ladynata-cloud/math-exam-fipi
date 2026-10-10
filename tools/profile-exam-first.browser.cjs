'use strict';
// Behavior regression with simulated pupils. It does not estimate learning efficacy.
// The actual public UI runs on a disposable local origin; no real pupil data is used.
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const KEY = 'mathexam.profileStart2027.v1';
const lessons = ['geometry', 'algebra', 'stereo', 'probability', 'equations', 'functions', 'applied', 'readiness']
  .flatMap(name => require('../ege-profil/start/' + name + '-data.js'));
const byId = new Map(lessons.map(lesson => [lesson.id, lesson]));
const { exams } = require('../ege-profil/start/calm-data.js');
const entries = ['geo-right', 'vec-coordinates', 'stereo-box', 'prob-count', 'prob-independent',
  'prob-distribution', 'eq-linear', 'expr-powers', 'calc-tangent', 'applied-formula', 'applied-work', 'fn-line', 'applied-percent'];
const expectedHelp = [
  ['bridge-roots', 'bridge-triangle'], ['bridge-coordinates', 'bridge-signs', 'bridge-roots'],
  ['geo-right', 'geo-area', 'bridge-roots'], ['bridge-fractions'], ['prob-count', 'prob-complement', 'bridge-fractions'],
  ['prob-count', 'bridge-fractions', 'bridge-roots'], ['bridge-equations', 'bridge-fractions', 'bridge-roots', 'expr-powers'],
  ['bridge-signs', 'bridge-fractions', 'bridge-roots', 'bridge-triangle'], ['bridge-coordinates', 'fn-line', 'expr-powers'],
  ['bridge-equations', 'bridge-fractions'], ['expr-fractions', 'eq-rational', 'eq-quadratic'],
  ['bridge-coordinates', 'bridge-equations', 'expr-powers'], ['bridge-fractions', 'bridge-equations', 'applied-formula']
];
const server = http.createServer((req, res) => {
  try {
    let file = path.resolve(ROOT, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname));
    if (!file.startsWith(ROOT + path.sep)) return res.writeHead(403).end();
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
    res.end(fs.readFileSync(file));
  } catch (_) { res.writeHead(404).end(); }
});
const saved = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
const session = async (page, id, mode = 'independent') => (await saved(page)).sessions[id + ':' + mode];
const record = async (page, id) => (await saved(page)).records[id] || { independent: [], guided: [], attempts: 0 };
const progress = value => ({ taskId: value.taskId, started: value.started, step: value.step, draft: value.draft, answers: value.answers, done: value.done });
const noOverflow = async (page, label) => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No horizontal scrolling: ' + label);
const practice = async page => { await page.locator('#answer-form').waitFor(); };
async function answer(page, value) {
  const input = page.locator('#answer');
  if (await input.count()) await input.fill(String(value));
  else await page.getByRole('radio', { name: String(value), exact: true }).check();
  await page.locator('#submit-answer').click();
}
async function accept(page, value) {
  await answer(page, value); assert.equal(await page.locator('#feedback.good').count(), 1, await page.locator('#feedback').innerText());
  await page.locator('#next').click();
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port, base = origin + '/ege-profil/start/index.html';
  const errors = [], requests = [];
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, headless: true, args: ['--no-sandbox'] });
    async function learner(width) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      await context.route('**/*', route => {
        if (new URL(route.request().url()).origin === origin) return route.continue();
        requests.push(route.request().url()); return route.abort();
      });
      const page = await context.newPage(); page.setDefaultTimeout(10000);
      page.on('pageerror', error => errors.push(error.message));
      return { context, page };
    }
    async function catalog(page, hash = '#calm') {
      await page.goto(base + hash); await page.locator('[data-calm-exam="13"]').waitFor();
      assert.equal(await page.locator('[data-calm-exam]').count(), 13);
      assert.deepEqual(await page.locator('[data-exam-start]').evaluateAll(nodes => nodes.map(node => node.getAttribute('href'))), entries.map(id => '#practice/' + id + '/independent'));
      assert(await page.evaluate(() => {
        const first = document.querySelector('[data-calm-exam]');
        return [...document.querySelectorAll('main a[href="#readiness"]')].every(link => Boolean(first.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING));
      }), 'The catalogue comes before optional foundation navigation');
      await noOverflow(page, 'catalogue');
    }
    const desktop = await learner(1280), page = desktop.page;
    assert.deepEqual(exams.map(exam => exam.entry), entries);
    await catalog(page, ''); // Opening the course directly is exam-first too.
    if (process.env.PROFILE_EXAM_FIRST_SHOTS) {
      fs.mkdirSync(process.env.PROFILE_EXAM_FIRST_SHOTS, { recursive: true });
      await page.screenshot({ path: path.join(process.env.PROFILE_EXAM_FIRST_SHOTS, 'catalog-desktop.png'), fullPage: true });
    }
    for (const [index, id] of entries.entries()) {
      await catalog(page); await page.locator('[data-exam-start="' + (index + 1) + '"]').click(); await practice(page);
      assert.equal(new URL(page.url()).hash, '#practice/' + id + '/independent');
      const before = await session(page, id), lesson = byId.get(id), task = lesson.tasks.find(task => task.id === before.taskId);
      assert.equal(lesson.position, index + 1); assert(lesson.tasks.slice(3).includes(task));
      assert.equal(before.assisted, false, 'Entry does not silently count as help');
      assert.equal(await page.locator('#difficulty-help').isVisible(), false);
      for (const invalid of ['', 'не число']) {
        await answer(page, invalid);
        assert.equal((await session(page, id)).wrong, false, 'Invalid entry is not a mathematical error');
        assert.equal(await page.locator('#feedback.bad').count(), 0);
        assert.equal(await page.locator('#difficulty-help').isVisible(), false, 'Invalid entry does not trigger a remedial route');
      }
      await answer(page, Number(task.answer) + 123);
      assert.equal(await page.locator('#feedback.bad').count(), 1);
      assert.equal(await page.locator('#difficulty-help').isVisible(), true);
      assert.equal(new URL(page.url()).hash, '#practice/' + id + '/independent', 'A mistake offers help without forcing navigation');
      const links = await page.locator('#difficulty-help .prerequisite-link').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
      assert.deepEqual(links, expectedHelp[index].map(id => '#lesson/' + id), 'Targeted help for exam position ' + (index + 1));
      for (const link of links) assert(byId.has(link.replace('#lesson/', '')), 'No dead prerequisite link');
      assert.equal(await page.locator('#difficulty-help a[href*=grade7]').count(), 0);
      assert.equal((await record(page, id)).independent.length, 0);
      await noOverflow(page, id + ' with help');
    }
    await desktop.context.close();

    // A mobile pupil detours into one school topic, completes it, then resumes
    // exactly the original condition and draft. Help is not independent mastery.
    const mobile = await learner(360), pupil = mobile.page;
    await catalog(pupil);
    if (process.env.PROFILE_EXAM_FIRST_SHOTS) await pupil.screenshot({ path: path.join(process.env.PROFILE_EXAM_FIRST_SHOTS, 'catalog-mobile.png'), fullPage: true });
    await pupil.locator('[data-exam-start="1"]').click(); await practice(pupil);
    const original = await session(pupil, 'geo-right'), originalTask = byId.get('geo-right').tasks.find(task => task.id === original.taskId);
    await answer(pupil, '1/7');
    const wrong = await session(pupil, 'geo-right');
    await pupil.locator('#difficulty-help a[href="#lesson/bridge-triangle"]').click();
    await pupil.locator('#guided').waitFor();
    assert.equal((await session(pupil, 'geo-right')).assisted, true);
    await pupil.reload(); await pupil.locator('.return-to-task a[href="#practice/geo-right/independent"]').waitFor();
    await pupil.locator('#guided').click(); await practice(pupil);
    const bridgeSession = await session(pupil, 'bridge-triangle', 'guided');
    const bridgeTask = byId.get('bridge-triangle').tasks.find(task => task.id === bridgeSession.taskId);
    for (const step of bridgeTask.steps) await accept(pupil, step.answer);
    await pupil.locator('.result-panel').waitFor();
    assert.equal((await record(pupil, 'geo-right')).independent.length, 0);
    await pupil.locator('.return-to-task a').click(); await practice(pupil);
    assert.deepEqual(progress(await session(pupil, 'geo-right')), progress(wrong), 'Same task, step, draft and accepted history after school work');
    assert.equal(await pupil.locator('#answer').inputValue(), '1/7');
    await pupil.reload(); await practice(pupil); assert.equal(await pupil.locator('#answer').inputValue(), '1/7');
    await noOverflow(pupil, 'mobile return');
    await accept(pupil, originalTask.answer); await pupil.locator('.result-panel').waitFor();
    assert.equal((await record(pupil, 'geo-right')).independent.length, 0, 'Helped completion stays practice');
    await catalog(pupil); await pupil.locator('[data-exam-start="1"]').click(); await practice(pupil);
    const fresh = await session(pupil, 'geo-right'); assert.notEqual(fresh.taskId, original.taskId, 'Completed card begins another task');
    assert.equal(fresh.assisted, false); assert.equal(fresh.wrong, false);
    await accept(pupil, byId.get('geo-right').tasks.find(task => task.id === fresh.taskId).answer); await pupil.locator('.result-panel').waitFor();
    assert.equal((await record(pupil, 'geo-right')).independent.length, 1, 'A fresh unassisted task still earns independent credit');

    // Trigonometry is reached from its actual exam type, never a compulsory
    // preliminary course. Its additional prerequisite keeps the exam return link.
    await catalog(pupil); await pupil.locator('a[href="#calm/8"]').click();
    await pupil.locator('a[href="#practice/algebra-cosine/independent"]').click(); await practice(pupil);
    await answer(pupil, '7/9'); const trig = await session(pupil, 'algebra-cosine');
    assert.deepEqual(await pupil.locator('#difficulty-help .prerequisite-link').evaluateAll(nodes => nodes.map(node => node.getAttribute('href'))), ['#lesson/trig-coordinates', '#lesson/bridge-roots']);
    await pupil.locator('#difficulty-help a[href="#lesson/trig-coordinates"]').click(); await pupil.locator('#guided').click(); await practice(pupil);
    const trigBase = await session(pupil, 'trig-coordinates', 'guided');
    const trigQuestion = byId.get('trig-coordinates').tasks.find(task => task.id === trigBase.taskId).steps[0];
    await answer(pupil, trigQuestion.choices ? trigQuestion.choices.find(value => value !== trigQuestion.answer) : Number(trigQuestion.answer) + 321);
    await pupil.locator('#difficulty-help a[href="#lesson/bridge-coordinates"]').click(); await pupil.locator('#guided').waitFor();
    await pupil.reload(); await pupil.locator('.return-to-task a[href="#practice/algebra-cosine/independent"]').waitFor();
    await pupil.locator('.return-to-task a').click(); await practice(pupil);
    assert.deepEqual(progress(await session(pupil, 'algebra-cosine')), progress(trig));
    await accept(pupil, byId.get('algebra-cosine').tasks.find(task => task.id === trig.taskId).answer); await pupil.locator('.result-panel').waitFor();
    assert.equal((await record(pupil, 'algebra-cosine')).independent.length, 0);

    // A detour from an already accepted guided step preserves more than step zero.
    await pupil.goto(base + '#practice/eq-linear/guided'); await practice(pupil);
    const guidedSession = await session(pupil, 'eq-linear', 'guided');
    const guidedTask = byId.get('eq-linear').tasks.find(task => task.id === guidedSession.taskId);
    await accept(pupil, guidedTask.steps[0].answer); await practice(pupil);
    await answer(pupil, Number(guidedTask.steps[1].answer) + 321);
    const guided = await session(pupil, 'eq-linear', 'guided'); assert.equal(guided.step, 1);
    await pupil.locator('#difficulty-help a[href="#lesson/bridge-equations"]').click(); await pupil.locator('#guided').waitFor();
    await pupil.reload(); await pupil.locator('.return-to-task a').click(); await practice(pupil);
    assert.deepEqual(progress(await session(pupil, 'eq-linear', 'guided')), progress(guided));
    assert.equal(await pupil.locator('#solution-history [data-step]').count(), 1);
    await noOverflow(pupil, 'guided return');
    await mobile.context.close();
    assert.deepEqual(errors, []); assert.deepEqual(requests, []);
    console.log('PROFILE_EXAM_FIRST_BROWSER_OK: 13 independent entries and targeted repairs; invalid input; optional school/trig detours; nested return and reload; same draft/task/accepted step; helped work excluded from mastery; fresh next task; desktop/mobile');
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
