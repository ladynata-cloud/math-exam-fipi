'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const test = require('node:test');
const { chromium } = require('playwright');
const navigator = require('../assets/assistant/navigator-data.js');

const root = fs.realpathSync(path.join(__dirname, '..'));
const path2026 = '/ege-profil/exam/full-exam.html';
const path2027 = path2026 + '?edition=2027';
const store = 'mathExamCourseProgress.v1';
const types = { '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const digest = values => crypto.createHash('sha256').update(JSON.stringify(values)).digest('hex');

// These conditions and answers were captured from the 2026 exam at 314779fb.
const legacyFixtures = [
  { width: 320, timestamp: 1794902400320,
    conditions: 'edcf6bfd99af9bf4190397114c239d22f484a822c77231e30f244365c25f507a',
    answers: ['6,5', '-11', '588', '0,16', '0,42', '5', '3', '-2', '33600', '38', '5', '5'] },
  { width: 390, timestamp: 1794902400390,
    conditions: 'e8c2b14e8a84ba7be54b6f36a855cad219d9aa8ff91b7cbf8f6365a3eee84cef',
    answers: ['8,5', '2', '300', '0,333333', '0,48', '5', '2', '12', '67200', '60', '6', '-3'] },
  { width: 1280, timestamp: 1794902401280,
    conditions: '57948ce8613f9693847f6af34e7087973a197097e0e195aefd5ab5c26e2f62e2',
    answers: ['2,5', '-6', '108', '0,133333', '0,32', '2', '2', '2', '42000', '135', '7', '2'] },
];
const legacyScale = [0, 6, 11, 17, 22, 27, 34, 40, 46, 52, 58, 64, 70, 72, 74, 76, 78, 80,
  82, 84, 86, 88, 90, 92, 94, 95, 96, 97, 98, 99, 100, 100, 100];

test('navigator offers the current variant and finds the explicit 2026 edition', () => {
  for (const [text, expected] of [
    ['ЕГЭ профиль пробный экзамен', path2027],
    ['ЕГЭ профиль пробник 2027', path2027],
    ['ЕГЭ профиль пробник 2026', path2026],
  ]) {
    const answer = navigator.respond({text, pathname: '/ege-profil/'});
    assert.deepEqual(answer.links.map(link => link.url), [expected]);
  }
});

test('2027 timed variant, 32 primary marks and independent 2026 history', { timeout: 120000 }, async t => {
  const server = http.createServer((request, response) => {
    try {
      const url = new URL(request.url, 'http://fixture');
      let file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
      if (!file.startsWith(root + path.sep)) return response.writeHead(403).end();
      if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      file = fs.realpathSync(file);
      if (!file.startsWith(root + path.sep)) return response.writeHead(403).end();
      response.setHeader('Content-Type', types[path.extname(file)] || 'text/html');
      response.end(fs.readFileSync(file));
    } catch (_) {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  let browser;
  t.after(async () => {
    if (browser) await browser.close();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  });
  const origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox']});

  for (const { width, timestamp, conditions, answers: legacyAnswers } of legacyFixtures) {
    await t.test(String(width) + 'px', async () => {
      const context = await browser.newContext({viewport: {width, height: 900}});
      try {
        const page = await context.newPage();
        const errors = [];
        const dialogs = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('dialog', dialog => {
          dialogs.push(dialog.message());
          void dialog.accept();
        });

        await page.goto(origin + path2026);
        await page.evaluate(startTime => {
          Date.now = () => startTime;
          Math.random = () => 0;
        }, timestamp);
        await page.locator('#optNoTimer').check();
        await page.locator('#startBtn').click();
        const legacyConditions = () => page.locator('#taskHost .taskbody').evaluateAll(cards =>
          cards.map(card => card.textContent.replace(/\s+/g, ' ').trim()));
        assert.equal(digest(await legacyConditions()), conditions);
        await page.locator('#task-1 input').fill(legacyAnswers[0]);
        const oldDraft = await page.evaluate(key => JSON.parse(localStorage.getItem(key))['full-exam-active'], store);

        await page.goto(origin + '/ege-profil/');
        await page.locator('a[href="exam/full-exam.html?edition=2027"]').click();
        assert.equal(new URL(page.url()).search, '?edition=2027');
        assert.match(await page.locator('#examHeading').textContent(), /2027/);
        assert.equal(await page.locator('#resumeBtn').isVisible(), false);
        await page.locator('#startBtn').click();
        assert.equal(await page.locator('#taskHost .card').count(), 19);
        assert.equal(await page.locator('#taskHost input').count(), 12);
        assert.equal(await page.locator('#taskHost textarea').count(), 7);
        assert.match(await page.locator('#clock').textContent(), /3:(54|55):\d\d/);
        const layout = await page.evaluate(() => {
          const width = document.documentElement.scrollWidth;
          const outside = width <= innerWidth + 1 ? [] : [...document.querySelectorAll('body *')]
            .filter(item => !item.closest('.navgrid'))
            .map(item => ({node: item.id || item.getAttribute('class') || item.tagName,
              right: Math.round(item.getBoundingClientRect().right),
              content: item.textContent.trim().slice(0, 60)}))
            .filter(item => item.right > innerWidth + 1).slice(0, 12);
          return { width, viewport: innerWidth, outside };
        });
        assert(layout.width <= layout.viewport + 1, JSON.stringify(layout));
        const rendered = await page.locator('#taskHost .card').evaluateAll(cards => cards.map(card => card.id));
        assert.deepEqual(rendered, Array.from({length: 19}, (_, index) => 'task-' + (index + 1)));
        const accepted = await page.evaluate(() => [
          FE.checkDecimal('−1,25', -1.25), FE.checkDecimal('1e2', 100),
          FE.checkDecimal('0x10', 16), FE.checkDecimal('0,500001', 0.5),
          FE.checkDecimal('12.0000000000000001', 12), FE.checkDecimal('0012,000', 12),
          FE.checkDecimal('−0,000', 0),
        ]);
        assert.deepEqual(accepted, [true, false, false, false, false, true, true]);

        const answers = await page.evaluate(() => ProfilePractice2027.slice(0, 12).map(task => task.t.answer));
        for (const [index, answer] of answers.entries()) {
          await page.locator('#task-' + (index + 1) + ' input').fill(String(answer).replace('.', ','));
        }
        await page.reload();
        await page.locator('#resumeBtn').click();
        assert.equal(await page.locator('#task-1 input').inputValue(), String(answers[0]).replace('.', ','));
        await page.locator('#finishBtn2').click();
        assert.equal(await page.locator('#resPrimary').textContent(), '12');
        assert.deepEqual(dialogs, [], 'optional answer notes for written tasks do not block completion');
        assert.equal(await page.locator('#resTestBlock').isVisible(), false);
        assert.equal(await page.locator('#resultScale').isVisible(), false);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'results fit the viewport');
        assert.equal(await page.locator('#resultHost summary').filter({hasText: 'Учебные критерии'}).count(), 7);
        for (const id of [13, 14, 15, 16, 17, 18, 19]) {
          await page.locator('.chips[data-line="' + id + '"] button').last().click();
        }
        assert.equal(await page.locator('#resPrimary').textContent(), '32');
        const all = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), store);
        assert.deepEqual(all['full-exam-active'], oldDraft);
        assert.equal(all['full-exam-2027-v1'].attempts[0].primary, 32);
        assert.equal(all['full-exam-2027-v1'].attempts[0].test, null);
        assert.equal(await page.locator('.practice a[href*="#fipi/2027/16"]').count(), 1);

        await page.goto(origin + path2026);
        await page.locator('#resumeBtn').click();
        assert.equal(digest(await legacyConditions()), conditions);
        assert.equal(await page.locator('#task-1 input').inputValue(), legacyAnswers[0]);
        for (const [index, answer] of legacyAnswers.slice(1).entries()) {
          await page.locator('#task-' + (index + 2) + ' input').fill(answer);
        }
        await page.locator('#finishBtn2').click();
        assert.match(dialogs[0], /Без ответа осталось заданий: 7/);
        assert.equal(await page.locator('#resPrimary').textContent(), '12');
        assert.equal(await page.locator('#resTest').textContent(), '70');
        assert.equal(await page.locator('#resTestBlock').isVisible(), true);
        assert.match(await page.locator('#resultScale').textContent(), /2026/);
        assert.deepEqual(await page.locator('#scaleHost tr').last().locator('td').allTextContents(), legacyScale.map(String));
        const afterLegacy = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), store);
        assert.deepEqual(afterLegacy['full-exam-2027-v1'], all['full-exam-2027-v1']);
        assert.equal(afterLegacy['full-exam'].attempts[0].test, 70);
        assert.deepEqual(errors, []);
      } finally {
        await context.close();
      }
    });
  }
});
