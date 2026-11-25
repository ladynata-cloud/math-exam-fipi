'use strict';

const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const { createServer } = require('node:http');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const coursePath = '/trainers/tyurin-statistics/index.html';
const direct = '?lab=condition#lesson/114-10';
const originalKey = 'math:tyurin-stats:v1:114-10';
const labKey = 'math:tyurin-condition:v1';
const media = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

// Serve the actual course and its static dependencies from this checkout.
async function serve() {
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const file = path.resolve(root, '.' + pathname);
    if (!file.startsWith(root + path.sep)) return response.writeHead(403).end();
    try {
      const body = await readFile(file);
      response.writeHead(200, { 'Content-Type': media[path.extname(file)] || 'application/octet-stream' }).end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve));
  return server;
}

function command(page, name) {
  return page.locator(`#condition-work [data-cmd="${name}"]`);
}

async function checkDeck(page, overlap, filtered = false) {
  const deck = page.locator('#condition-work .condition-deck');
  assert.equal(await deck.locator('.condition-card').count(), 24);
  assert.equal(await deck.locator('[data-geometry=true]').count(), 9);
  assert.equal(await deck.locator('[data-star=true]').count(), 8);
  assert.equal(await deck.locator('[data-geometry=true][data-star=true]').count(), overlap);
  assert.equal(await deck.locator('[data-muted=true]').count(), filtered ? 16 : 0);
  if (!filtered) {
    const table = page.locator('#condition-work .condition-table');
    assert.deepEqual(await table.locator('tbody td').allTextContents(),
      [overlap, 9 - overlap, 9, 8 - overlap, 7 + overlap, 15].map(String));
    assert.deepEqual(await table.locator('tfoot td').allTextContents(), ['8', '16', '24']);
  }
}

async function stage(page, name) {
  const section = page.locator(`#condition-work [data-stage="${name}"]`);
  await section.waitFor({ state: 'visible' });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Horizontal overflow at ${name}`);
  return section;
}

async function chooseOverlap(page, n) {
  const slider = page.locator('#condition-overlap');
  await slider.focus();
  await slider.press('Home');
  for (let i = 0; i < n; i++) await slider.press('ArrowRight');
  assert.equal(await slider.inputValue(), String(n));
  assert(await slider.evaluate(el => el === document.activeElement), 'Keyboard focus remains on the range');
  await checkDeck(page, n);
  await command(page, 'check-overlap').click();
}

async function checkTransfer(page, prior, given, relation) {
  await page.locator('#condition-base').fill(prior);
  await page.locator('#condition-given').fill(given);
  await page.locator('#condition-relation').selectOption(relation);
  await command(page, 'check-transfer').click();
}

async function lessonRoutes(page, url) {
  await page.goto(url);
  const courseEntry = page.locator('#condition-entry a');
  await courseEntry.click();
  assert.equal(new URL(page.url()).hash, '#lesson/114-10');
  await stage(page, 'predict');
  await page.goto(url + '#lesson/113-35');
  const lab = page.locator('#condition-lab');
  await lab.waitFor({ state: 'visible' });
  assert.equal(await lab.evaluate(el => el.open), false);
  assert.equal(await page.locator('#lesson option').count(), 33);
  for (const id of ['114-12', '113-4', '114-10']) {
    await page.locator('#lesson').selectOption(id);
    assert.equal(new URL(page.url()).hash, '#lesson/' + id);
    assert.equal(await lab.isVisible(), id !== '113-4');
  }
  await page.evaluate(() => { location.hash = '#lesson/113-4'; });
  await lab.waitFor({ state: 'hidden' });
  await page.goBack();
  await lab.waitFor({ state: 'visible' });
  assert.equal(await page.locator('#lesson').inputValue(), '114-10');
}

async function predictAndFilter(page) {
  await stage(page, 'predict');
  await checkDeck(page, 6);
  assert.equal(await page.locator('#condition-answer').isVisible(), false);
  await page.locator('#condition-work input[name=direction][value=up]').check();
  await command(page, 'predict').click();
  await stage(page, 'condition');
  await command(page, 'filter').click();
  await page.locator('#condition-answer').waitFor({ state: 'visible' });
  await checkDeck(page, 6, true);
}

async function sampling(page) {
  const text = page.locator('#condition-frequency');
  await page.locator('#condition-work details > summary').click();
  // One unmarked card first, then a complete ordered pass through the deck.
  // This makes the zero-denominator branch and the frequency repeatable.
  await page.evaluate(() => {
    const original = Math.random;
    let i = -1;
    Math.random = () => {
      const card = (24 + i) % 24;
      if (++i === 24) Math.random = original;
      return (card + 0.5) / 24;
    };
  });
  await command(page, 'draw-one').click();
  assert.match(await text.innerText(), /пока не выпадали/);
  await command(page, 'draw-many').click();
  assert.match(await text.innerText(), /25\D+8\D+3\D+3\/8/);
}

async function learner(page, url) {
  await lessonRoutes(page, url);
  await page.locator('#work [data-action=practice]').click();
  await page.locator('#answer').fill('17/31');
  const saved = await page.evaluate(key => localStorage.getItem(key), originalKey);
  assert.equal(JSON.parse(saved).draft, '17/31');
  await page.goto(url + direct);
  await predictAndFilter(page);
  const answer = page.locator('#condition-answer');
  await answer.fill('6/24');
  await command(page, 'answer').click();
  const note = page.locator('#condition-work .condition-result[role=status]');
  const jointMessage = await note.innerText();
  assert.match(jointMessage, /пересечени/);
  assert.equal(await command(page, 'explore').isVisible(), false);
  await answer.fill('6/9');
  await command(page, 'answer').click();
  assert.match(await note.innerText(), /обратн/);
  await page.reload();
  await stage(page, 'condition');
  assert.equal(await answer.inputValue(), '6/9');
  assert.equal(await page.locator('#answer').inputValue(), '17/31');
  await answer.fill('0,75');
  await command(page, 'answer').click();
  await command(page, 'explore').click();
  await stage(page, 'independent');
  await chooseOverlap(page, 6);
  assert.equal(await command(page, 'next').isVisible(), false);
  await chooseOverlap(page, 3);
  await command(page, 'next').click();
  await stage(page, 'disjoint');
  await chooseOverlap(page, 0);
  await command(page, 'next').click();
  await stage(page, 'rule');
  await sampling(page);
  await command(page, 'transfer').click();

  // Separate answer key from counts in the four published stories.
  // N, A, B, and their intersection are respectively (20,8,5,3),
  // (30,12,10,4), (28,7,12,0), (36,12,9,1).
  const answers = [
    ['8/20', '3/5', 'dependent'],
    ['12/30', '4/10', 'independent'],
    ['1/4', '0', 'disjoint'],
    ['1/3', '1/9', 'dependent']
  ];
  let firstStory;
  for (const [i, key] of answers.entries()) {
    const exercise = await stage(page, 'transfer');
    const story = await exercise.innerText();
    if (i === 0) {
      firstStory = story;
      await checkTransfer(page, '8/20', '3/20', 'dependent');
      await stage(page, 'transfer');
      assert.equal(await command(page, 'again').isVisible(), false);
    } else assert.notEqual(story, firstStory);
    await checkTransfer(page, ...key);
    const result = await stage(page, 'result');
    assert.match(await result.innerText(), i === 0 ? /исправ|повторн|со второй/i : /перв/i);
    if (i === 0) {
      await page.reload();
      await stage(page, 'result');
    }
    if (i < answers.length - 1) await command(page, 'again').click();
  }
  assert.equal(await page.evaluate(key => localStorage.getItem(key), originalKey), saved,
    'Lab activity must not overwrite the existing lesson draft');
  await page.locator('#condition-work a[href="#lesson/114-12"]').click();
  await page.waitForFunction(() => document.getElementById('lesson').value === '114-12');
  assert.equal(await page.locator('#condition-lab').evaluate(el => el.open), false,
    'Returning to the textbook lesson should collapse the supplemental lab');
}

async function embedded(page, origin) {
  const labSave = await page.evaluate(key => localStorage.getItem(key), labKey);
  assert(labSave);
  await page.route(origin + '/embed-probe', route => route.fulfill({ contentType: 'text/html',
    body: `<iframe title="Курс" src="${coursePath}${direct}"></iframe>` }));
  await page.goto(origin + '/embed-probe');
  const frame = page.frameLocator('iframe');
  await frame.locator('#model').waitFor();
  assert.equal(await frame.locator('#lesson').inputValue(), '114-10');
  assert.equal(await frame.locator('#condition-lab').isVisible(), false);
  assert.equal(await page.evaluate(key => localStorage.getItem(key), labKey), labSave);
}

async function run() {
  const server = await serve();
  const origin = 'http://127.0.0.1:' + server.address().port;
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
      args: ['--no-sandbox'] });
    const errors = [];
    for (const width of [320, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 800 } });
      const page = await context.newPage();
      page.setDefaultTimeout(5000);
      page.on('pageerror', error => errors.push(`${width}: ${error.message}`));
      await learner(page, origin + coursePath);
      await embedded(page, origin);
      await context.close();
      console.log(`${width}px: routes, filtering, keyboard model, four transfers, resumed drafts and iframe isolation`);
    }
    const offline = await browser.newContext({ offline: true, viewport: { width: 390, height: 780 } });
    const filePage = await offline.newPage();
    filePage.setDefaultTimeout(5000);
    filePage.on('pageerror', error => errors.push(`file: ${error.message}`));
    await learner(filePage, pathToFileURL(path.join(root, coursePath)).href);
    await offline.close();
    assert.deepEqual(errors, []);
    console.log('390px: local file offline, complete journey through all four transfer problems');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
