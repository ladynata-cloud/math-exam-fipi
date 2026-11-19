'use strict';
// Real published cards and browser storage. The expected values below come
// from their authored statements, independently of the runtime parser.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '../..');
const bundle = require(root + '/stereo-course/textbook/data/course.json');
const find = exercise => bundle.lessons.find(l => l.source.collection === 'main' && l.source.exercise === exercise);
const fraction = bundle.lessons.find(l => l.id === 'ex-main-0018-a');
const empty = find('28');
const manual = bundle.lessons.find(l => l.kind === 'exercise' && l.answer?.mode === 'manual');
assert(fraction && empty && manual);
const key = card => 'mathExamTextbook.v1:' + bundle.catalog.book.id + ':' + card.id + ':r' + card.revision;
const out = path.resolve(process.env.HARMONIZATION_TEXTBOOK_ARTIFACTS || 'artifacts/atanasyan-harmonization/textbook');
fs.mkdirSync(out, {recursive: true});
const evidence = {completed: false, engineSHA256: crypto.createHash('sha256').update(fs.readFileSync(root + '/stereo-course/textbook/assets/engine.js')).digest('hex'), widths: [], errors: []};
let browser, server;
(async () => {
  server = http.createServer((req, res) => {
    const requested = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
    if (!requested.startsWith(root + path.sep)) return res.writeHead(403).end();
    let file = requested;
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (error, bytes) => {
      if (error) return res.writeHead(404).end();
      res.setHeader('Content-Type', ({'.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json'})[path.extname(file)] || 'application/octet-stream');
      res.end(bytes);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port + '/stereo-course/textbook/';
  browser = await chromium.launch({headless: true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {})});
  for (const width of [320, 1280]) {
    const context = await browser.newContext({viewport: {width, height: 900}});
    const page = await context.newPage();
    const watch = p => p.on('pageerror', error => evidence.errors.push(error.message));
    watch(page);
    const open = async (card, target = page) => {
      // The published textbook consumes the deep link on document startup.
      // A fragment-only goto keeps the previously mounted card alive.
      await target.goto('about:blank');
      await target.goto(base + '#' + card.id);
      await target.locator('.textbook-lesson-header [data-companion-source="' + card.id + '"]').waitFor();
      await target.locator('[data-main-model] svg').waitFor();
      await target.locator('#final-answer').waitFor();
    };
    const state = card => page.evaluate(k => JSON.parse(localStorage.getItem(k)), key(card));
    const submit = async value => {
      await page.locator('#final-answer').fill(value);
      await page.locator('[data-final-form] button').click();
      return page.locator('[data-final-feedback]');
    };
    await open(empty);
    for (const [input, status] of [['', 'empty'], ['1/', 'incomplete'], ['(1/0)^0', 'domain'], ['sqrt(-4)^0', 'domain'], ['1/(1/0)', 'domain']]) {
      const feedback = await submit(input);
      assert.equal(await feedback.getAttribute('data-answer-status'), status);
      assert(!/25\s*[\/⁄]\s*3/.test(await feedback.innerText()), 'invalid input must not reveal the authored result');
      const saved = await state(empty);
      assert.equal(saved.assisted, false);
      assert.equal(saved.wrongAttempts, 0);
      assert.equal(saved.firstAttempt, null);
      assert.equal(saved.checked, false);
    }
    for (const input of ['999', '998']) {
      const feedback = await submit(input);
      assert.equal(await feedback.getAttribute('data-answer-status'), 'wrong');
      assert(!/25\s*[\/⁄]\s*3/.test(await feedback.innerText()));
    }
    assert.match(await page.locator('[data-final-feedback]').innerText(), /Можно открыть/);
    assert.equal((await state(empty)).wrongAttempts, 2);
    assert.equal((await state(empty)).assisted, false);
    await submit('25/3');
    assert.equal((await state(empty)).checkedWith, 'corrected');
    assert.match(await page.locator('[data-final-feedback]').innerText(), /исправил.*самостоятельно/);
    await page.screenshot({path: path.join(out, width + '-corrected-28.png')});
    await page.reload();
    await page.locator('#final-answer').waitFor();
    assert.equal(await page.locator('#final-answer').inputValue(), '25/3');
    assert.equal((await state(empty)).checkedWith, 'corrected');
    await open(fraction);
    await submit('14/4');
    assert.equal((await state(fraction)).checkedWith, 'independent');
    assert.equal((await state(fraction)).firstAttempt.input, '14/4');
    for (const equivalent of ['7/2', '3,5', '3.5']) {
      assert.equal(await (await submit(equivalent)).getAttribute('data-answer-status'), 'correct');
      assert.equal((await state(fraction)).firstAttempt.input, '14/4');
    }
    const second = await context.newPage(); watch(second);
    await open(fraction, second);
    await page.locator('#final-answer').fill('Новая работа в первой вкладке');
    await second.locator('.course-conflict').waitFor();
    assert.equal(await second.locator('#final-answer').getAttribute('readonly'), '');
    assert.match(await second.locator('.course-conflict textarea').inputValue(), /3\.5/);
    await second.locator('.course-conflict button').click();
    assert.equal(await second.locator('#final-answer').inputValue(), 'Новая работа в первой вкладке');
    await second.close();
    await open(manual);
    let feedback = await submit('');
    assert.match(await feedback.innerText(), /Пустое поле/);
    assert.equal((await state(manual)).checked, false);
    feedback = await submit('Мой довод: выделю сечение и обосную перпендикулярность.');
    assert.match(await feedback.innerText(), /обсудить с учителем/);
    assert.equal((await state(manual)).checked, false, 'saving prose is not automatic mathematical certification');
    await open(empty);
    await page.locator('[data-main-help]>summary').click();
    await page.locator('[data-answer-explanation]').click();
    assert.equal((await state(empty)).assisted, true);
    assert.match(await page.locator('[data-final-feedback]').innerText(), /25/);
    assert.equal((await state(empty)).checkedWith, 'corrected', 'later help does not rewrite a previously recorded result');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert(overflow <= 1, 'numeric feedback stays within the viewport');
    evidence.widths.push({width, height: 900, invalidInputs: 5, validEquivalents: 4, wrongThenCorrected: true, manualUncertified: true, twoTabRecovery: true, explicitHelp: true, overflow});
    await context.close();
  }
  assert.deepEqual(evidence.errors, []);
  evidence.completed = true;
  console.log('ATANASYAN_TEXTBOOK_HARMONIZATION_BROWSER_OK: real №18а/28, two widths, invalid/wrong/correct/manual/help/persistence and two-tab recovery');
})().catch(error => { evidence.failure = error.stack; console.error(error); process.exitCode = 1; }).finally(async () => {
  fs.writeFileSync(path.join(out, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
  await browser?.close();
  server?.close();
});
