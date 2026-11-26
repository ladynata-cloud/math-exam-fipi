'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const test = require('node:test');
const { JSDOM } = require('jsdom');
const state = require('../ege-profil/part-two/state.js');
const vectors = require('./fixtures/profile-equation-answers.json');

const root = path.resolve(__dirname, '..');
const folder = path.join(root, 'ege-profil/part-two');
const coursePath = '/ege-profil/part-two/index.html';
const html = fs.readFileSync(path.join(folder, 'index.html'), 'utf8');
const general = '11π/6+2πn; 7π/6+2πn';
const correctSelection = '−5π/6; −13π/6; −17π/6';
const selectionId = 'p14-circle-selection-7';
const historyId = 'p14-trig-factors-4';
const introId = 'p14-circle-selection-1';
const route = (id, mode = 'independent') => '#task/' + id + '/' + mode;
const idle = () => new Promise(resolve => setImmediate(resolve));

async function settle(w) {
  await w.ProfilePartTwoApp.store.flush();
  await idle();
  await w.ProfilePartTwoApp.store.flush();
  await idle();
}

async function boot(id, saved = [], mode) {
  const dom = new JSDOM(html, { url: 'https://mathexam.space' + coursePath + route(id, mode), runScripts: 'outside-only' });
  const { window: w } = dom;
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.scrollTo = () => {};
  for (const [key, value] of saved) w.localStorage.setItem(key, value);
  for (const script of w.document.querySelectorAll('script[src]')) {
    const src = script.getAttribute('src').split('?')[0];
    if (!src.startsWith('/assets/')) w.eval(fs.readFileSync(path.resolve(folder, src), 'utf8'));
  }
  await settle(w);
  return w;
}

function input(w, selector, value) {
  const field = w.document.querySelector(selector);
  assert(field, selector);
  field.value = value;
  field.dispatchEvent(new w.Event('input', { bubbles: true }));
}

async function submit(w) {
  w.document.querySelector('#final-form').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await settle(w);
}

test('wrong selection records one attempt and keeps the correct general solution through format feedback and reload', async () => {
  let w = await boot(selectionId);
  try {
    assert.equal(w.document.querySelectorAll('[data-final]').length, 2);
    assert.doesNotMatch(w.document.querySelector('.condition').textContent, /три корня|количеств/);
    const read = () => w.ProfilePartTwoApp.store.read(selectionId);
    input(w, '#final-0', general);
    input(w, '#final-1', '−π/6');
    await submit(w);
    assert.equal(read().attemptCount, 1);
    assert.equal(read().wrong, 1);
    assert.equal(state.equationCheck(read(), 'general'), 'correct');
    assert.equal(state.equationCheck(read(), 'selected'), 'missing-extra-outside-interval');
    assert.match(w.document.querySelector('#equation-result-1').textContent, /исключённой границе/);
    input(w, '#final-1', '−13π/');
    await submit(w);
    assert.equal(read().attemptCount, 1);
    assert.equal(state.equationCheck(read(), 'general'), 'correct');
    assert.equal(state.equationCheck(read(), 'selected'), '');
    assert.equal(w.document.querySelector('#final-1').getAttribute('aria-invalid'), 'true');
    assert.match(w.document.querySelector('#feedback').textContent, /формат/);
    const saved = [[state.PREFIX + selectionId, w.localStorage.getItem(state.PREFIX + selectionId)]];
    w.close();
    w = await boot(selectionId, saved);
    assert.equal(w.document.querySelector('#final-1').value, '−13π/');
    assert.match(w.document.querySelector('#equation-result-0').textContent, /верен/);
    input(w, '#final-1', correctSelection);
    await submit(w);
    assert.equal(read().attemptCount, 2);
    assert(read().completed && read().independent);
    assert.equal(read().attempts[0].answers[1], '−π/6');
    await submit(w);
    assert.equal(read().attemptCount, 2);
  } finally { w.close(); }
});

test('historic completion remains distinguishable and both legacy sine forms run through the new UI', async () => {
  const old = state.create(null).read(historyId);
  const history = vectors.legacy.find(entry => entry.task === historyId).record;
  Object.assign(old, history, { drafts: { ...old.drafts, ...history.drafts } });
  let w = await boot(historyId, [[state.PREFIX + historyId, JSON.stringify(old)]]);
  try {
    assert.match(w.document.querySelector('#historical-completion').textContent, /Прежний результат/);
    assert.equal(w.document.querySelector('#completion'), null);
    assert.match(w.document.querySelector('.earlier-equation').textContent, /1\/4/);
    assert.equal(w.document.querySelector('#final-0').value, '');
    assert.equal(w.document.querySelector('#equation-result-0').textContent, '');
    w.close();
    w = await boot(introId);
    for (const text of ['π/6+2πn; 5π/6+2πn', '(-1)^n π/6+πn']) {
      input(w, '#final-0', text);
      input(w, '#final-1', 'π/6;5π/6');
      await submit(w);
      assert(w.document.querySelector('#completion'));
      const record = w.ProfilePartTwoApp.store.read(introId);
      assert.equal(state.equationCheck(record, 'general'), 'correct');
      assert.equal(record.independent, false);
    }
  } finally { w.close(); }
});

test('an exact answer update preserves the H05 proof snapshot and rejects a stale pair atomically', async () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const a = state.create(storage);
  const b = state.create(storage);
  await a.patch(selectionId, record => {
    record.drafts.proof = 'Оба ряда и проверка границ';
    record.proofChecks = [0];
    record.proofReviewSnapshot = { proof: record.drafts.proof, checks: [0] };
    assert.equal(state.updateEquationDraft(record, { general: '', selected: '' }, { general, selected: '−π/6' }), 'updated');
  });
  await b.patch(selectionId, record => state.updateEquationDraft(record, { selected: '−π/6' }, { selected: correctSelection }) === 'updated');
  const current = b.read(selectionId);
  await a.patch(selectionId, record => state.updateEquationDraft(record, { general, selected: '−π/6' }, { general: 'πn' }) === 'updated');
  assert.deepEqual(a.read(selectionId), current);
  assert.deepEqual(state.currentProofChecks(current), [0]);
  assert.equal(current.attemptCount, 0);
  await a.patch(selectionId, record => {
    assert.equal(a.finishEquation(record, { general, selected: correctSelection },
      { general: 'correct', selected: 'correct' }, { mode: 'independent', independentEligible: true }), 'correct');
  });
  assert.deepEqual(state.currentProofChecks(a.read(selectionId)), [0]);
});

test('native Chromium keeps stale visible answers in two tabs with 320 and 1280 pixel viewports', {
  skip: !(process.env.CI || process.env.H06_NATIVE_BROWSER === '1') && 'set H06_NATIVE_BROWSER=1',
  timeout: 120000,
}, async t => {
  const { chromium } = require('playwright');
  const types = { '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
  const server = http.createServer((request, response) => {
    try {
      const name = decodeURIComponent(new URL(request.url, 'http://fixture').pathname);
      const file = fs.realpathSync(path.resolve(root, '.' + name));
      if (!file.startsWith(root + path.sep)) return response.writeHead(403).end();
      response.setHeader('Content-Type', types[path.extname(file)] || 'text/html');
      response.end(fs.readFileSync(file));
    } catch (_) { response.writeHead(404).end(); }
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
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] });
  const url = `http://127.0.0.1:${server.address().port}` + coursePath + route(selectionId);
  for (const width of [320, 1280]) await t.test(`${width}px`, async () => {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    try {
      const stale = await context.newPage(), fresh = await context.newPage();
      const errors = [];
      stale.on('pageerror', error => errors.push(error.message));
      fresh.on('pageerror', error => errors.push(error.message));
      await stale.goto(url);
      await stale.locator('#final-0').waitFor();
      assert.equal(await stale.locator('#equation-open-saved').isVisible(), false);
      await stale.locator('#final-0').fill(general);
      await stale.locator('#final-1').fill('−π/6');
      await stale.evaluate(() => window.ProfilePartTwoApp.store.flush());
      await fresh.goto(url);
      await fresh.locator('#final-1').fill(correctSelection);
      await fresh.evaluate(() => window.ProfilePartTwoApp.store.flush());
      await stale.locator('#equation-sync-warning').waitFor({ state: 'visible' });
      assert.equal(await stale.locator('#final-1').inputValue(), '−π/6');
      assert.equal(await stale.locator('#final-form button[type="submit"]').isDisabled(), true);
      const before = await fresh.evaluate(id => window.ProfilePartTwoApp.store.read(id), selectionId);
      await stale.locator('#final-form').evaluate(form => form.requestSubmit());
      await stale.evaluate(() => window.ProfilePartTwoApp.store.flush());
      const after = await fresh.evaluate(id => window.ProfilePartTwoApp.store.read(id), selectionId);
      assert.deepEqual(after, before);
      await stale.locator('#equation-open-saved').click();
      assert.equal(await stale.locator('#final-1').inputValue(), correctSelection);
      assert.equal(await stale.locator('#equation-open-saved').isVisible(), false);
      await stale.locator('#final-form button[type="submit"]').click();
      await stale.locator('#completion').waitFor();
      assert.equal(await stale.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
      const done = await fresh.evaluate(id => window.ProfilePartTwoApp.store.read(id), selectionId);
      assert.equal(done.attemptCount, 1);
      assert(done.completed && done.independent);
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });
});
