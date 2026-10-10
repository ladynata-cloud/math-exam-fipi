'use strict';
// Synthetic learner journeys for a requested explanation, not an efficacy study.
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const KEY = 'mathexam.profileStart2027.v1';
const lesson = require('../ege-profil/start/geometry-data.js').find(item => item.id === 'geo-right');
const cases = [
  { id: 'geo-right-cosine', mode: 'independent', result: 15, ratio: '0,8', draft: '14,5',
    meaning: [/прилежащ/iu, /гипотенуз/iu], relation: [/12/u, /0[,.]8/u, /дел|раздел|дол|част/iu],
    arithmetic: /12\s*[:/÷]\s*0[,.]8\s*=|120\s*[:/÷]\s*8\s*=/u, check: /15\s*[·×*]\s*0[,.]8|0[,.]8\s*[·×*]\s*15|12\s*[:/÷]\s*15/u },
  { id: 'geo-right-tangent', mode: 'independent', result: 15, ratio: '2,5', draft: '14,5',
    meaning: [/противолежащ/iu, /прилежащ/iu], relation: [/6/u, /2[,.]5/u, /умнож|раза|раз/iu],
    arithmetic: /6\s*[·×*]\s*2[,.]5\s*=|2[,.]5\s*[·×*]\s*6\s*=/u, check: /15\s*[:/÷]\s*6/u },
  { id: 'geo-right-sine', mode: 'guided', result: 7, ratio: '0,28', draft: 'a = 25 / 0,28',
    meaning: [/противолежащ/iu, /гипотенуз/iu], relation: [/25/u, /0[,.]28/u, /умнож|дол|част/iu],
    arithmetic: /25\s*[·×*]\s*0[,.]28\s*=|0[,.]28\s*[·×*]\s*25\s*=/u, check: /7\s*[:/÷]\s*25/u }
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
const stored = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
const session = async (page, mode) => (await stored(page)).sessions['geo-right:' + mode];
const progress = value => ({ taskId: value.taskId, step: value.step, draft: value.draft, answers: value.answers, started: value.started });
const noOverflow = async (page, label) => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label + ' fits the viewport');
async function fill(page, value) {
  if (await page.locator('#answer').count()) await page.locator('#answer').fill(String(value));
  else await page.getByRole('radio', { name: String(value), exact: true }).check();
}
async function accept(page, value) {
  await fill(page, value); await page.locator('#submit-answer').click();
  assert.equal(await page.locator('#feedback.good').count(), 1, await page.locator('#feedback').innerText());
  await page.locator('#next').click();
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port, base = origin + '/ege-profil/start/index.html';
  let browser; const errors = [], failedRequests = []; let journeys = 0;
  const shots = process.env.PROFILE_TRIANGLE_SHOTS;
  try {
    if (shots) fs.mkdirSync(shots, { recursive: true });
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, headless: true, args: ['--no-sandbox'] });
    for (const width of [1280, 360]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage(); page.setDefaultTimeout(12000);
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(origin)) failedRequests.push(response.status() + ' ' + response.url()); });
      await page.goto(base); await page.locator('[data-calm-exam="13"]').waitFor();
      assert.equal(await page.locator('[data-calm-exam]').count(), 13, 'The independent-first catalogue remains the entry');
      assert.equal(await page.locator('[data-exam-start="1"]').getAttribute('href'), '#practice/geo-right/independent');
      await page.locator('[data-exam-start="1"]').click(); await page.locator('#answer-form').waitFor();
      for (const item of cases) {
        if (item.mode === 'guided') {
          // Sine belongs to the authored guided pool. Seed that real task so
          // its UI can be checked without inventing an independent task type.
          await page.evaluate(({ key, id }) => {
            const data = JSON.parse(localStorage.getItem(key));
            data.sessions['geo-right:guided'] = { taskId: id, step: 0, wrong: false, assisted: true, familiar: false,
              done: false, draft: '', answers: [], started: new Date().toISOString(), registered: false };
            data.seen[id] = 1; localStorage.setItem(key, JSON.stringify(data));
          }, { key: KEY, id: item.id });
          await page.goto(base + '?sine-fixture=' + width + '#practice/geo-right/guided');
        }
        await page.locator('#answer-form').waitFor();
        assert.equal((await session(page, item.mode)).taskId, item.id);
        const model = page.locator('#task-model'), open = model.locator('[data-trig-open]');
        await open.waitFor();
        assert.equal(await model.locator('[data-trig-explanation]').count(), 0, 'Method content is absent before help, including hidden DOM');
        assert.match(await model.innerText(), new RegExp(item.ratio.replace(',', '[,.]')));
        if (item.mode === 'independent') {
          assert.equal((await session(page, item.mode)).assisted, false);
          assert.doesNotMatch(await model.innerText(), /(^|[^\d])15([^\d]|$)/u, 'No final answer before independent help');
          assert.doesNotMatch(await model.innerText(), item.arithmetic, 'No method before independent help');
        }
        await fill(page, item.draft); const before = progress(await session(page, item.mode));
        await noOverflow(page, item.id + ' before');
        if (shots && item.id === 'geo-right-cosine') await page.screenshot({ path: path.join(shots, 'cosine-before-' + width + '.png'), fullPage: true });
        await open.focus(); await page.keyboard.press('Enter');
        const panel = model.locator('[data-trig-explanation]'); await panel.waitFor();
        assert.equal(await open.getAttribute('aria-expanded'), 'true');
        assert.equal(await open.evaluate(node => document.activeElement === node), true, 'Opening explanation keeps keyboard focus');
        assert.equal((await session(page, item.mode)).assisted, true, 'Explicit explanation is recorded as help');
        const list = panel.locator('[data-trig-step]');
        assert.equal(await list.count(), 1, 'Only the first explanation step opens initially');
        const seen = [];
        for (let step = 1; step <= 5; step++) {
          assert.equal(await list.count(), step);
          assert.deepEqual(await list.evaluateAll(nodes => nodes.map(node => Number(node.dataset.trigStep))), Array.from({ length: step }, (_, i) => i + 1));
          const texts = await list.allInnerTexts();
          assert.deepEqual(texts.slice(0, seen.length), seen, 'Earlier explanation steps remain on screen');
          seen.push(texts.at(-1));
          if (step < 4) assert.doesNotMatch(texts.join(' '), new RegExp('(^|[^\\d])' + item.result + '([^\\d]|$)', 'u'), 'The final number is not revealed in early steps');
          assert.deepEqual(progress(await session(page, item.mode)), before, 'Reading help does not alter the original answer or step');
          await noOverflow(page, item.id + ' explanation ' + step);
          if (step < 5) {
            const next = panel.locator('[data-trig-next]'); await next.focus(); await page.keyboard.press('Enter');
            assert.equal(await next.evaluate(node => document.activeElement === node), true, 'Revealing the next step keeps keyboard focus');
          }
        }
        const text = seen.join(' ');
        for (const meaning of item.meaning) assert.match(text, meaning, item.id + ' names the relevant sides');
        for (const relationship of item.relation) assert.match(text, relationship, item.id + ' explains what operation means');
        assert.match(text, item.arithmetic, item.id + ' performs the actual arithmetic');
        assert.match(seen[4], item.check, item.id + ' checks the original ratio');
        if (shots && item.id === 'geo-right-cosine') await page.screenshot({ path: path.join(shots, 'cosine-after-' + width + '.png'), fullPage: true });
        await open.click(); assert.equal(await panel.isVisible(), false);
        await open.click(); assert.equal(await list.count(), 5, 'Reopening keeps all five previously revealed steps');
        assert.deepEqual(progress(await session(page, item.mode)), before);
        await page.reload(); await page.locator('#answer-form').waitFor();
        assert.deepEqual(progress(await session(page, item.mode)), before, 'Original task and draft survive help plus reload');
        assert.equal((await session(page, item.mode)).assisted, true, 'Reload cannot erase the help flag');
        const task = lesson.tasks.find(task => task.id === item.id);
        if (item.mode === 'guided') for (const step of task.steps) await accept(page, step.answer);
        else await accept(page, item.result);
        await page.locator('.result-panel').waitFor();
        assert.equal((await stored(page)).records['geo-right'].independent.length, 0, 'Explained work never earns independent mastery');
        journeys++;
        if (item.id === 'geo-right-cosine') { await page.locator('#another').click(); await page.locator('#answer-form').waitFor(); }
      }
      await context.close();
    }
    assert.deepEqual(errors, []); assert.deepEqual(failedRequests, []);
    console.log('PROFILE_TRIANGLE_EXPLANATION_BROWSER_OK ' + JSON.stringify({ journeys, types: 3, steps: 5, widths: [360, 1280], keyboard: true, retainedHistory: true, draftReload: true, helpCredit: true, errors, failedRequests }));
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
