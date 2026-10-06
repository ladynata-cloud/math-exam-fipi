'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const http = require('node:http');
const root = path.resolve(__dirname, '..');
const D = require('../ege-baza/path/data.js');
require('../ege-baza/path/practice.js');
require('../ege-baza/path/equation-practice.js');
require('../ege-baza/path/grade7-algebra.js');
require('../ege-baza/path/grade7-geometry.js');
require('../ege-baza/path/grade7-geometry-core.js');
require('../ege-baza/path/grade7-geometry-practice.js');
require('../ege-baza/path/grade7-foundations.js');
require('../ege-baza/path/pre7-arithmetic.js');
require('../ege-baza/path/pre7-applications.js');
const C = require('../learning/catalog.js');
const R = require('../learning/references.js');
const remediation = require('../board-server/learning-remediation-contracts.js');

function contentGate() {
  const pathItems = C.items.filter(item => item.trainerId === 'ege-path');
  assert.equal(pathItems.length, D.meta.length);
  assert.equal(pathItems.length, 169);
  assert.equal(pathItems.filter(item => item.grade7).length, 62);
  assert.equal(pathItems.filter(item => item.pre7).length, 18);
  assert.equal(pathItems.filter(item => item.grade7 && !item.pre7 && !/^grade7-g-(core|practice)-/.test(item.contentId)).length, 24);
  for (const meta of D.meta) {
    const item = C.get('path:' + meta.id);
    assert.ok(item, 'Missing course content ' + meta.id);
    assert.equal(item.title, meta.title);
    assert.equal(item.position, meta.pos);
    assert.equal(item.contentId, meta.id);
    assert.equal(item.trainingOnly, !!meta.trainingOnly);
    assert.equal(C.byPosition(meta.pos).find(value => value.id === item.id), item);
    assert.equal(C.byTopic(item.topicId).find(value => value.id === item.id), item);
  }
  const foundation = C.items.filter(item => item.trainerId === 'oge-basics');
  assert.equal(foundation.length, 36);
  for (const source of remediation.list()) {
    const item = C.get(source.id);
    for (const key of ['trainerId', 'contentId', 'title', 'position', 'url']) assert.equal(item[key], source[key]);
  }
  assert.equal(new Set(C.items.map(item => item.id)).size, C.items.length);
  assert.equal(C.positions.length, 21);
  assert.equal(C.topics.flatMap(topic => C.byTopic(topic.id)).length, C.items.length);
  for (let position = 1; position <= 21; position++) assert.ok(C.byPosition(position).length > 0);
  for (const item of C.items) {
    assert.ok(Object.isFrozen(item));
    const file = item.url.split('#')[0];
    assert.ok(fs.existsSync(path.join(root, file)), 'Missing trainer URL ' + item.url);
  }
  assert.equal(C.get('__proto__'), null);

  const source = JSON.parse(fs.readFileSync(path.join(root, 'learning/reference-assets/source.json')));
  const hash = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
  assert.equal(hash(source.source), source.sourceSha256);
  assert.equal(source.status, 'project');
  assert.deepEqual(source.referencePrintedPages, [4, 5, 6, 7]);
  assert.equal(R.pages.length, 4);
  assert.deepEqual(source.assets.map(asset => asset.file), R.pages.map(page => page.file));
  for (const asset of source.assets) {
    const file = 'learning/reference-assets/' + asset.file;
    assert.equal(hash(file), asset.sha256);
    const bytes = fs.readFileSync(path.join(root, file));
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(bytes.readUInt32BE(16), 842);
    assert.equal(bytes.readUInt32BE(20), 1191);
  }

  for (const meta of D.meta) {
    for (const seed of [0, 1, 2, 5, 17, 239, 4294967295]) {
      const task = D.task(meta.id, seed);
      const help = R.buildHelp(task, meta);
      assert.equal(help.question, task.q);
      assert.equal(help.contentId, meta.id);
      assert.equal(help.seed, seed);
      assert.ok(help.why.length);
      assert.ok(!/undefined|NaN|Infinity/.test(JSON.stringify(help)), 'Broken bindings: ' + meta.id);
      assert.equal(R.resolveTask({ contentId: meta.id, seed, task }), task, 'Must retain pinned task object');
    }
  }
  assert.equal(R.resolveTask({ contentId: 'triangle', seed: 5 }), null, 'Missing pinned task must not be regenerated');
  assert.equal(R.resolveTask({ contentId: 'triangle', task: D.task('grid', 5) }), null);
  const triangle = R.buildHelp(D.task('triangle', 5));
  assert.ok(triangle.bindings.includes('a = 42 — всё основание'));
  assert.ok(triangle.substitution.includes('35² − 21²'));
  assert.ok(triangle.formula.includes('(a · hₐ) / 2'));
  const boxSurface = R.buildHelp(D.task('box', 1));
  const boxVolume = R.buildHelp(D.task('box', 2));
  assert.equal(boxSurface.formula, 'S = 2(ab + ac + bc)');
  assert.equal(boxVolume.formula, 'V = abc');
  const quadratic = R.buildHelp(D.task('practice-quadratic', 5));
  assert.ok(quadratic.bindings.includes('b = -13'));
  assert.ok(quadratic.substitution.includes('(-13)²'));
  const percent = R.buildHelp(D.task('practice-percent-whole', 5));
  assert.equal(percent.substitution, 'целое = 525 / (75 / 100)');
  const cone = R.buildHelp(D.task('practice-cone-area', 5));
  assert.equal(cone.substitution, 'S₂/S₁ = (28 · 42) / (7 · 21)');

  const nav = fs.readFileSync(path.join(root, 'ege-baza/index.html'), 'utf8');
  assert.ok(nav.includes('107 тренажёров'));
  assert.ok(nav.includes('https://mathexam-board-ladynata.amvera.io/learning/'));
  console.log('LEARNING_CATALOG_REFERENCE_CONTENT_OK (205 identities, 62 school families including 18 pre7, 21 exam positions, 1183 help variants, 4 original reference pages)');
}

async function browserGate() {
  const runtimeModules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (_) {
    if (!runtimeModules) throw Error('Playwright is required. Install playwright, set NODE_PATH, or set CODEX_PRIMARY_RUNTIME_NODE_MODULES to its node_modules directory.');
    ({ chromium } = require(path.join(runtimeModules, 'playwright')));
  }
  const fixture = '<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/learning/references.css"><body><main id="host" style="max-width:340px;margin:20px auto"></main><script src="/ege-baza/path/data.js"></script><script src="/ege-baza/path/practice.js"></script><script src="/ege-baza/path/equation-practice.js"></script><script src="/ege-baza/path/grade7-algebra.js"></script><script src="/ege-baza/path/grade7-geometry.js"></script><script src="/ege-baza/path/grade7-geometry-core.js"></script><script src="/ege-baza/path/grade7-geometry-practice.js"></script><script src="/ege-baza/path/grade7-foundations.js"></script><script src="/ege-baza/path/pre7-arithmetic.js"></script><script src="/ege-baza/path/pre7-applications.js"></script><script src="/learning/references.js"></script></body></html>';
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (pathname === '/fixture') { response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end(fixture); return; }
    const file = path.resolve(root, '.' + pathname);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404).end(); return; }
    const type = { '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.pdf': 'application/pdf' }[path.extname(file)] || 'text/plain';
    response.setHeader('Content-Type', type); fs.createReadStream(file).pipe(response);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}), args: ['--no-sandbox'] });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto('http://127.0.0.1:' + server.address().port + '/fixture');
    await page.evaluate(() => {
      window.events = [];
      window.widget = LearningReferences.mount(document.querySelector('#host'), {
        taskSpec: { trainerId: 'ege-path', contentId: 'triangle', seed: 5, task: PathData.task('triangle', 5) },
        mode: 'practice',
        onHelp: (level, details) => { events.push({ level, details }); return new Promise(resolve => { window.accept = resolve; }); }
      });
    });
    await page.getByRole('button', { name: 'Справочный лист ФИПИ' }).click();
    assert.equal(await page.getByRole('link', { name: 'Исходный PDF', exact: true }).getAttribute('href'), 'https://mathexam.space/ege-baza/sources/demo-2027.pdf#page=2', 'Cabinet origin does not host the full source PDF');
    assert.equal(await page.locator('dialog[open] figure').count(), 4);
    assert.equal(await page.evaluate(() => events.length), 0);
    for (let i = 0; i < 4; i++) {
      const img = page.locator('dialog img').nth(i); await img.scrollIntoViewIfNeeded();
      await img.evaluate(el => el.decode()); assert.equal(await img.evaluate(el => el.naturalWidth), 842);
    }
    assert.ok((await page.locator('dialog').innerText()).includes('проект демоверсии'));
    await page.getByRole('button', { name: 'Закрыть', exact: true }).click();
    await page.locator('[data-reference-level="3"]').click();
    assert.equal(await page.locator('.reference-help-output').innerText(), '');
    assert.equal(await page.locator('[data-reference-level="2"]').isDisabled(), true);
    await page.evaluate(() => accept(true));
    await page.getByText('a = 42 — всё основание', { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => events[0].level), 3);
    assert.equal(await page.evaluate(() => events[0].details.contentId), 'triangle');
    await page.evaluate(() => {
      widget.destroy();
      widget = LearningReferences.mount(document.querySelector('#host'), {
        taskSpec: { contentId: 'triangle', task: PathData.task('triangle', 5) }, mode: 'practice', onHelp: async () => false
      });
    });
    await page.locator('[data-reference-level="2"]').click();
    await page.locator('.reference-error').waitFor();
    assert.equal(await page.locator('.reference-formula').count(), 0, 'Rejected receipt cannot reveal a hint');
    for (const mode of ['exam', 'diagnostic', 'checkpoint']) {
      await page.evaluate(mode => {
        widget.destroy();
        widget = LearningReferences.mount(document.querySelector('#host'), { taskSpec: { contentId: 'triangle', task: PathData.task('triangle', 5), mode }, onHelp: async () => true });
      }, mode);
      assert.equal(await page.locator('[data-reference-level]').count(), 0);
      assert.equal(await page.getByRole('button', { name: 'Справочный лист ФИПИ' }).count(), 1);
    }
    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByRole('button', { name: 'Справочный лист ФИПИ' }).click();
    const box = await page.locator('dialog').boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= 375);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog[open]').count(), 0);
    await page.evaluate(() => { widget.destroy(); });
    assert.equal(await page.locator('.learning-references').count(), 0);
    console.log('LEARNING_REFERENCE_BROWSER_OK (no-cost full sheet, persisted hint before reveal, rejection, exam isolation, mobile)');
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
}

contentGate();
if (process.argv.includes('--browser')) browserGate().catch(error => { console.error(error); process.exitCode = 1; });
