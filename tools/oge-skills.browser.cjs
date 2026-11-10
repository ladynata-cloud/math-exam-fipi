'use strict';
// Synthetic learner journeys in a disposable local Chromium context. No production writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const catalog = require('../oge/skills/catalog.js');
const C = require('../foundations/route-core.js');
const V = require('../foundations/route-visuals.js');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'artifacts/oge-skills');
const PREFIX = 'mathExamOge.skillMaps.v1.';
const NOTES_PREFIX = 'mathExamOge.skillNotes.v1.';
const SUCCESS = '6 опорных вопросов решены самостоятельно';
const geometry = catalog.byId['oge-18'];
const tall = geometry.questions.map((q, index) => ({ q, index }))
  .filter(({ q }) => q.visual?.type === 'graph' && q.visual.ymax - q.visual.ymin > q.visual.xmax - q.visual.xmin)
  .sort((a, b) => (b.q.visual.ymax - b.q.visual.ymin) / (b.q.visual.xmax - b.q.visual.xmin)
    - (a.q.visual.ymax - a.q.visual.ymin) / (a.q.visual.xmax - a.q.visual.xmin))[0];
const visuals = catalog.routes.flatMap(map => map.questions.filter(q => q.visual).map(q => ({ id: q.id, visual: q.visual })));

function preflight() {
  assert.equal(catalog.routes.length, 28);
  assert.equal(catalog.routes.reduce((n, map) => n + C.questions(map, 'check-a').length + C.questions(map, 'check-b').length, 0), 336);
  assert.equal(catalog.byId['oge-11'].nodes.length, 6);
  assert(tall && tall.index >= 6, 'an actual tall №18 check grid must be available');
  assert.equal(C.questions(catalog.byId['oge-6'], 'check-a')[0].input, 'number');
  for (const map of catalog.routes) for (const mode of ['check-a', 'check-b']) {
    assert.equal(C.questions(map, mode).length, 6);
    for (const q of C.questions(map, mode)) assert(C.correct(q, String(q.answer)), q.id);
  }
  for (const item of visuals) {
    const html = V.figure(item.visual);
    assert(html && !/NaN|undefined|Infinity/.test(html), item.id);
  }
  const html = fs.readFileSync(path.join(root, 'oge/skills/index.html'), 'utf8');
  for (const match of html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css)(?:\?[^"#]*)?)"/g)) {
    const url = new URL(match[1], 'http://fixture/oge/skills/');
    assert.equal(url.origin, 'http://fixture');
    assert(fs.existsSync(path.join(root, url.pathname)), 'Missing page dependency: ' + url.pathname);
  }
  return { maps: 28, freshChecks: 56, freshAnswers: 336, models: visuals.length,
    graphs: visuals.filter(x => x.visual.type === 'graph').length, tallGrid: tall.q.id,
    browserExecuted: false, note: 'Preflight validates the fixture plan; it does not claim a browser pass.' };
}

function makeServer() {
  const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
    '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2' };
  return http.createServer((req, res) => {
    try {
      if (!['GET', 'HEAD'].includes(req.method)) return res.writeHead(405).end();
      const pathname = decodeURIComponent(new URL(req.url, 'http://fixture').pathname);
      let file = path.resolve(root, '.' + pathname);
      if (file !== root && !file.startsWith(root + path.sep)) return res.writeHead(403).end();
      if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
      res.setHeader('Cache-Control', 'no-store');
      if (req.method === 'HEAD') return res.end();
      res.end(fs.readFileSync(file));
    } catch (_) { res.writeHead(404).end(); }
  });
}

async function run(browser, origin, report) {
  const errors = [], assetFailures = [], blockedOrigins = new Set();
  const viewports = new Map();
  async function context(width = 1280, extra = {}) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, locale: 'ru-RU',
      reducedMotion: 'reduce', acceptDownloads: true, ...extra });
    await ctx.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin === origin || ['data:', 'blob:'].includes(url.protocol)) return route.continue();
      blockedOrigins.add(url.origin);
      return route.abort('blockedbyclient');
    });
    return ctx;
  }
  async function newPage(ctx, label) {
    const page = await ctx.newPage();
    page.setDefaultTimeout(6000);
    page.setDefaultNavigationTimeout(15000);
    page.on('pageerror', error => errors.push(label + ': ' + error.message));
    page.on('response', response => {
      if (response.url().startsWith(origin + '/') && response.status() >= 400
          && ['document', 'script', 'stylesheet'].includes(response.request().resourceType())) {
        assetFailures.push(label + ': ' + response.status() + ' ' + new URL(response.url()).pathname);
      }
    });
    return page;
  }
  async function go(page, hash = '') {
    await page.goto(origin + '/oge/skills/' + hash, { waitUntil: 'domcontentloaded' });
  }
  async function question(page, q) {
    await page.waitForFunction(prompt => document.getElementById('skill-question-title')?.textContent.trim() === prompt, q.prompt);
  }
  async function mapNode(page, map, node = map.nodes[0]) {
    await go(page, '#' + map.id + '?node=' + node.id);
    await page.waitForFunction(title => document.getElementById('skill-node-title')?.textContent.trim() === title, node.title);
    return node;
  }
  async function check(page, map, mode = 'check-a') {
    await go(page, '#' + map.id + '?session=' + mode);
    await page.waitForFunction(title => document.getElementById('skill-title')?.textContent.trim() === title, map.title);
    await question(page, C.questions(map, mode)[0]);
  }
  async function fit(page, label) {
    const measured = await page.evaluate(() => ({ width: innerWidth,
      scroll: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) }));
    assert(measured.scroll <= measured.width + 1, label + ': horizontal overflow ' + JSON.stringify(measured));
    viewports.set(measured.width, (viewports.get(measured.width) || 0) + 1);
  }
  async function shot(locator, name) {
    const file = path.join(out, name + '.png');
    await locator.screenshot({ path: file, animations: 'disabled' });
    const bytes = fs.readFileSync(file);
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
    report.screenshots.push({ file: name + '.png', width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) });
    if (process.env.OGE_SKILLS_INLINE_VISUALS === '1') console.log('OGE_SKILLS_VISUAL ' + name + ' ' + bytes.toString('base64'));
  }
  async function enter(page, q, value = String(q.answer)) {
    const form = page.locator('#skill-answer-form');
    if (q.input === 'choice') {
      const index = q.choices.indexOf(value);
      assert(index >= 0, 'No choice for ' + q.id);
      const radio = form.locator('input[name="answer"]').nth(index);
      assert.equal(await radio.getAttribute('value'), value);
      await radio.check();
    } else {
      await page.locator('#skill-answer').fill(value);
    }
    await form.locator('#skill-check').click();
  }
  async function finishSet(page, map, mode, options = {}) {
    const qs = C.questions(map, mode);
    for (let i = options.from || 0; i < qs.length; i++) {
      await question(page, qs[i]);
      await fit(page, map.id + '/' + mode + '/' + i);
      if (options.beforeAnswer) await options.beforeAnswer(qs[i]);
      await enter(page, qs[i]);
      await page.locator('#skill-next').waitFor({ state: 'visible' });
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'skill-next', 'accepted answer focuses continuation');
      await page.locator('#skill-next').click();
      if (options.fresh) report.freshAnswers++;
    }
    await page.locator('#skill-result-title').waitFor();
    await fit(page, map.id + '/' + mode + '/result');
  }
  async function state(page, id, mode) {
    return page.evaluate(({ id, mode, prefix }) => {
      const reader = window.FoundationRouteStore.create(window.OgeSkillCatalog, localStorage, { prefix });
      return reader.summary()[id].sessions.find(session => session.mode === mode);
    }, { id, mode, prefix: PREFIX });
  }
  async function waitNote(page, map, node, text) {
    await page.waitForFunction(({ map, node, text }) => {
      const notes = window.OgeSkillNotes.create(window.OgeSkillCatalog, localStorage);
      return notes.latest(map, node).text === text;
    }, { map: map.id, node: node.id, text });
  }

  const desktop = await context(), page = await newPage(desktop, 'desktop');
  await go(page);
  await page.locator('[data-skill-map]').first().waitFor();
  assert.equal(await page.locator('[data-skill-map]').count(), 28);
  await fit(page, 'home1280');
  const graphMap = catalog.byId['oge-11'];
  await mapNode(page, graphMap);
  assert.equal(await page.locator('#skill-map-panel[open] [data-node-link]').count(), 6);
  await page.waitForFunction(count => document.querySelectorAll('#skill-edges .skill-edge').length === count,
    graphMap.nodes.reduce((n, node) => n + node.dependsOn.length, 0));
  await fit(page, 'six-node-map1280');
  await page.locator('#skill-map-panel > summary').focus();
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.nodeLink), graphMap.nodes[0].id);
  await shot(page.locator('#skill-map-panel'), 'desktop-map11-six-nodes-1280');

  // All 336 fresh answers go through production form events; no direct store.act() seeding.
  for (const map of catalog.routes) {
    // A disposable per-map history keeps this exhaustive UI pass bounded while A and B share that map's history.
    await page.evaluate(({ prefix, notes }) => {
      for (const key of Object.keys(localStorage)) if (key.startsWith(prefix) || key.startsWith(notes)) localStorage.removeItem(key);
    }, { prefix: PREFIX, notes: NOTES_PREFIX });
    for (const mode of ['check-a', 'check-b']) {
      await check(page, map, mode);
      await finishSet(page, map, mode, { fresh: true, beforeAnswer: async q => {
        if (map.id === geometry.id && q.id === tall.q.id) await shot(page.locator('.question-card'), 'geometry18-exact-tall-grid-1280');
      } });
      assert.equal(await page.locator('#skill-result-title').textContent(), SUCCESS, map.id + '/' + mode);
      assert.equal(await page.locator('.result-stats > div').nth(1).locator('b').textContent(), '6 / 6');
      const saved = await state(page, map.id, mode);
      assert(saved.finished && saved.verified && saved.independent === 6 && saved.repeated === 0, map.id + '/' + mode);
      report.freshChecks.push({ map: map.id, mode, independent: saved.independent });
    }
  }
  assert.equal(report.freshAnswers, 336);
  assert.equal(report.freshChecks.length, 56);

  // Every model is attached to the real DOM and styled by the production page.
  // Grid-unit equality is measured after the SVG screen transform, including tall geometry grids.
  report.models = await page.evaluate(items => {
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:0;top:0;width:320px;height:1px;overflow:hidden;visibility:hidden';
    document.body.append(host);
    const result = [];
    try {
      for (const item of items) {
        host.innerHTML = window.FoundationRouteVisuals.figure(item.visual);
        if (!host.innerHTML || /NaN|undefined|Infinity/.test(host.innerHTML)) throw Error('Invalid rendered model ' + item.id);
        if (!host.querySelector('svg,table,.bar-model')) throw Error('Missing rendered model ' + item.id);
        const row = { id: item.id, type: item.visual.type };
        if (item.visual.type === 'graph') {
          const svg = host.querySelector('svg'), matrix = svg.getScreenCTM();
          const lines = [...svg.querySelectorAll('.graph-grid')];
          const vertical = lines.filter(line => line.x1.baseVal.value === line.x2.baseVal.value).map(line => line.x1.baseVal.value).sort((a, b) => a - b);
          const horizontal = lines.filter(line => line.y1.baseVal.value === line.y2.baseVal.value).map(line => line.y1.baseVal.value).sort((a, b) => a - b);
          if (!matrix || vertical.length < 2 || horizontal.length < 2) throw Error('Unmeasurable grid ' + item.id);
          const dx = (vertical[1] - vertical[0]) * Math.hypot(matrix.a, matrix.b);
          const dy = (horizontal[1] - horizontal[0]) * Math.hypot(matrix.c, matrix.d);
          if (!(dx > 0 && dy > 0 && Math.abs(dx - dy) < 0.01)) throw Error('Unequal grid units ' + item.id + ': ' + dx + '/' + dy);
          row.equalScreenUnits = true;
        }
        result.push(row);
      }
    } finally { host.remove(); }
    return result;
  }, visuals);
  assert.equal(report.models.length, visuals.length);
  await desktop.close();

  for (const width of [320, 390]) {
    const ctx = await context(width), mobile = await newPage(ctx, 'mobile' + width);
    await go(mobile);
    await mobile.locator('#skill-search').waitFor();
    await fit(mobile, 'home' + width);
    await mobile.locator('#skill-search').focus();
    await mobile.keyboard.type('график');
    assert(await mobile.locator('[data-skill-map]').count() > 0);
    assert(await mobile.locator('[data-skill-map]').count() < 28);
    await fit(mobile, 'keyboard-search' + width);
    const noteNode = graphMap.nodes[0];
    await mapNode(mobile, graphMap, noteNode);
    await mobile.locator('#skill-map-panel > summary').focus();
    await mobile.keyboard.press('Enter');
    await mobile.locator('#skill-map-panel[open]').waitFor();
    await mobile.keyboard.press('Tab');
    assert.equal(await mobile.evaluate(() => document.activeElement?.dataset.nodeLink), noteNode.id);
    await fit(mobile, 'expanded-six-node-map' + width);

    if (width === 390) {
      const first = 'Сначала читаю x на горизонтальной оси, затем y на вертикальной. Проверяю точку по таблице.';
      const revised = 'Сначала читаю абсциссу и ординату. Второй способ — подставить x в формулу и сравнить полученный y.';
      await mobile.locator('#skill-explanation').fill(first);
      await waitNote(mobile, graphMap, noteNode, first);
      await mobile.locator('[data-review="0"]').check();
      await mobile.reload({ waitUntil: 'domcontentloaded' });
      await mobile.locator('#skill-explanation').waitFor();
      assert.equal(await mobile.locator('#skill-explanation').inputValue(), first);
      assert(await mobile.locator('[data-review="0"]').isChecked());
      await mobile.locator('#skill-explanation').fill(revised);
      assert.equal(await mobile.locator('[data-review]:checked').count(), 0);
      await waitNote(mobile, graphMap, noteNode, revised);
      await mobile.reload({ waitUntil: 'domcontentloaded' });
      await mobile.locator('#skill-explanation').waitFor();
      assert.equal(await mobile.locator('#skill-explanation').inputValue(), revised);
      assert.equal(await mobile.locator('[data-review]:checked').count(), 0);
      await fit(mobile, 'notebook390');
      await shot(mobile.locator('.skill-notebook'), 'mobile-notebook-390');
      await mobile.locator('.skill-tabs a[href*="view=notes"]').click();
      await mobile.locator('#skill-download').waitFor();
      const article = mobile.locator('.skill-evidence').filter({ has: mobile.getByRole('heading', { name: noteNode.title, exact: true }) });
      await article.locator('details > summary').click();
      assert((await article.locator('details').textContent()).includes(first));
      const downloadPromise = mobile.waitForEvent('download');
      await mobile.locator('#skill-download').click();
      const download = await downloadPromise;
      assert.equal(download.suggestedFilename(), 'mathexam-oge-11-work.json');
      const file = path.join(out, 'synthetic-written-work.json');
      await download.saveAs(file);
      assert.equal(await download.failure(), null);
      const exported = JSON.parse(fs.readFileSync(file, 'utf8'));
      assert.equal(exported.format, 'MathExam.OGE.skills.work.v1');
      assert.equal(exported.map.id, graphMap.id);
      const explanation = exported.explanations.find(item => item.node === noteNode.id);
      assert.equal(explanation.text, revised);
      assert.deepEqual(explanation.history.map(item => item.text), [first, revised]);
      assert.deepEqual(explanation.checks, []);
      assert.equal(exported.questions.length, 18);
      for (const q of exported.questions) assert.deepEqual(Object.keys(q).sort(), ['id', 'node', 'prompt']);
      const forbidden = new Set(['answer', 'choices', 'oracle', 'hint', 'solution']);
      function noAnswerKeys(value) {
        if (!value || typeof value !== 'object') return;
        for (const [key, child] of Object.entries(value)) { assert(!forbidden.has(key), 'Unexpected answer-bank key in work export: ' + key); noAnswerKeys(child); }
      }
      noAnswerKeys(exported);
      report.journeys.push('written explanation: reload, version-specific self-review, history, JSON without answer keys');

      // Follow the real foundation page and its exact OGE return, preserving this node's text.
      await article.locator('a').click();
      await mobile.locator('#skill-explanation').waitFor();
      await mobile.locator('[data-foundation]').first().click();
      await mobile.locator('#exam-back').waitFor();
      assert.equal(await mobile.locator('#exam-back').getAttribute('href'), '/oge/skills/#' + graphMap.id + '?node=' + noteNode.id);
      assert.equal(new URL(mobile.url()).pathname, '/foundations/route.html');
      await mobile.locator('#exam-back').click();
      await mobile.locator('#skill-explanation').waitFor();
      assert.equal(new URL(mobile.url()).hash, '#' + graphMap.id + '?node=' + noteNode.id);
      assert.equal(await mobile.locator('#skill-explanation').inputValue(), revised);
      report.journeys.push('foundation page returns to the exact OGE node with its explanation');
    }

    const arithmetic = catalog.byId['oge-6'], practice = C.questions(arithmetic, 'practice');
    await check(mobile, arithmetic, 'practice');
    await enter(mobile, practice[0], '999');
    assert(await mobile.locator('#skill-next').isHidden());
    await enter(mobile, practice[0], '998');
    assert(await mobile.locator('#skill-hint-box').isVisible());
    await mobile.locator('#skill-answer').fill('0,3');
    await mobile.reload({ waitUntil: 'domcontentloaded' });
    await question(mobile, practice[0]);
    assert.equal(await mobile.locator('#skill-answer').inputValue(), '0,3');
    assert(await mobile.locator('#skill-hint-box').isVisible());
    await finishSet(mobile, arithmetic, 'practice');
    assert.equal(await mobile.locator('#skill-result-title').textContent(), 'Учебная порция закончена');
    const assistedPractice = await state(mobile, arithmetic.id, 'practice');
    assert(assistedPractice.items[0].help && assistedPractice.items[0].errors === 2 && !assistedPractice.verified);
    await check(mobile, arithmetic, 'check-a');
    const numeric = C.questions(arithmetic, 'check-a')[0];
    await mobile.locator('#skill-answer').focus();
    await mobile.keyboard.type(String(numeric.answer));
    await mobile.keyboard.press('Enter');
    await mobile.locator('#skill-next').waitFor({ state: 'visible' });
    assert.equal(await mobile.evaluate(() => document.activeElement?.id), 'skill-next');
    await mobile.keyboard.press('Enter');
    await question(mobile, C.questions(arithmetic, 'check-a')[1]);
    await finishSet(mobile, arithmetic, 'check-a', { from: 1 });
    assert.equal(await mobile.locator('#skill-result-title').textContent(), SUCCESS);
    if (width === 390) {
      await mobile.locator('#skill-repeat').click();
      await finishSet(mobile, arithmetic, 'check-a');
      assert.equal(await mobile.locator('#skill-result-title').textContent(), 'Знакомый набор повторён');
      const replay = await state(mobile, arithmetic.id, 'check-a');
      assert(!replay.verified && replay.repeated === 6 && replay.independent === 0);
      report.journeys.push('familiar replay receives no fresh-check credit');
    }
    report.journeys.push(width + 'px: keyboard map/search, two mistakes, automatic help, exact draft reload, numeric Enter and next focus');
    await ctx.close();
  }

  const peers = await context(), a = await newPage(peers, 'check-tab'), b = await newPage(peers, 'model-tab');
  await check(a, graphMap);
  await mapNode(b, graphMap);
  await a.waitForFunction(({ id, prefix }) => window.FoundationRouteStore.create(window.OgeSkillCatalog, localStorage, { prefix })
    .summary()[id].unfinished?.items[0].help, { id: graphMap.id, prefix: PREFIX });
  await finishSet(a, graphMap, 'check-a');
  assert.notEqual(await a.locator('#skill-result-title').textContent(), SUCCESS);
  await a.reload({ waitUntil: 'domcontentloaded' });
  await a.locator('#skill-result-title').waitFor();
  assert.equal(await a.locator('.skill-result-list > li').first().locator('.skill-record-label').textContent(), 'С помощью');
  assert.equal((await state(a, graphMap.id, 'check-a')).verified, false);
  report.journeys.push('two real tabs: model help survives answering and reload in the other tab');
  await peers.close();

  // Three open views must react to an actual storage event sent by a fourth, disposable tab.
  const corrupt = await context(), resultPage = await newPage(corrupt, 'live-result');
  await check(resultPage, graphMap);
  await finishSet(resultPage, graphMap, 'check-a');
  assert.equal(await resultPage.locator('#skill-result-title').textContent(), SUCCESS);
  const homePage = await newPage(corrupt, 'live-home'), notePage = await newPage(corrupt, 'live-note'), writer = await newPage(corrupt, 'storage-writer');
  await go(homePage);
  const badge = homePage.locator('[data-skill-map="oge-11"] .route-progress');
  await badge.waitFor();
  assert.equal(await badge.textContent(), SUCCESS);
  await mapNode(notePage, graphMap);
  const typed = 'Мой введённый текст остаётся здесь: сравниваю координаты и проверяю подстановкой.';
  await notePage.locator('#skill-explanation').fill(typed);
  await notePage.evaluate(() => { window.__fixtureNoteElement = document.getElementById('skill-explanation'); });
  await go(writer);
  await writer.locator('[data-skill-map]').first().waitFor();
  const corruptKey = PREFIX + 'event.synthetic-corrupt-peer';
  await writer.evaluate(key => localStorage.setItem(key, '{broken'), corruptKey);
  await homePage.waitForFunction(() => document.querySelector('[data-skill-map="oge-11"] .route-progress')?.textContent === 'Результат проверки сейчас не подтверждён');
  await resultPage.waitForFunction(success => {
    const title = document.getElementById('skill-result-title');
    return title && title.textContent !== success;
  }, SUCCESS);
  await notePage.waitForFunction(() => {
    const badges = [...document.querySelectorAll('[data-node-link] em')];
    return badges.length === 6 && badges.every(node => node.textContent === 'Результат проверки сейчас не подтверждён');
  });
  for (const p of [homePage, resultPage, notePage]) assert(await p.locator('#skill-storage').isVisible());
  assert.equal(await notePage.locator('#skill-explanation').inputValue(), typed);
  assert(await notePage.evaluate(() => document.getElementById('skill-explanation') === window.__fixtureNoteElement));
  assert.equal(await writer.evaluate(key => localStorage.getItem(key), corruptKey), '{broken');
  report.journeys.push('real peer corruption immediately revokes home, result and node badges without replacing typed text');
  await corrupt.close();

  const denied = await context(320);
  await denied.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw Error('blocked by fixture'); } }));
  const blocked = await newPage(denied, 'blocked-storage'), arithmetic = catalog.byId['oge-6'];
  await check(blocked, arithmetic, 'practice');
  assert(await blocked.locator('#skill-storage').isVisible());
  await enter(blocked, C.questions(arithmetic, 'practice')[0]);
  await blocked.locator('#skill-next').waitFor({ state: 'visible' });
  await fit(blocked, 'blocked-practice320');
  await go(blocked, '#' + arithmetic.id + '?session=check-a');
  await blocked.locator('#skill-retry-save').waitFor();
  assert.equal(await blocked.locator('#skill-question-title').count(), 0);
  assert(await blocked.locator('#skill-storage').isVisible());
  await fit(blocked, 'blocked-check320');
  report.journeys.push('blocked storage keeps practice usable and pauses a check before its first question');
  await denied.close();

  assert.deepEqual(errors, [], 'No browser exceptions');
  assert.deepEqual(assetFailures, [], 'No missing local documents, scripts or stylesheets');
  assert.equal(report.screenshots.length, 3);
  report.viewports = [...viewports].sort((a, b) => a[0] - b[0]).map(([width, checks]) => ({ width, overflowChecks: checks }));
  assert.deepEqual(report.viewports.map(v => v.width), [320, 390, 1280]);
  report.blockedExternalOrigins = [...blockedOrigins].sort();
  report.browserErrors = errors;
}

async function main() {
  const plan = preflight();
  if (process.argv.includes('--preflight')) {
    console.log('OGE_SKILLS_BROWSER_PREFLIGHT_OK ' + JSON.stringify(plan));
    return;
  }
  const started = Date.now(), server = makeServer();
  const report = { kind: 'synthetic-local-Chromium', maps: catalog.routes.length, freshAnswers: 0,
    freshChecks: [], models: [], journeys: [], screenshots: [], browserExecuted: false };
  let browser, timer;
  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const origin = 'http://127.0.0.1:' + server.address().port;
    browser = await chromium.launch({ headless: true, timeout: 15000 });
    report.browserExecuted = true;
    fs.mkdirSync(out, { recursive: true });
    await Promise.race([run(browser, origin, report), new Promise((_, reject) => {
      timer = setTimeout(() => reject(Error('OGE skill browser suite exceeded its four-minute budget')), Math.max(1000, 240000 - (Date.now() - started)));
    })]);
    report.elapsedMs = Date.now() - started;
    report.status = 'PASS';
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
    console.log('OGE_SKILLS_BROWSER_OK ' + JSON.stringify({ maps: report.maps, freshChecks: report.freshChecks.length,
      freshAnswers: report.freshAnswers, models: report.models.length, journeys: report.journeys.length,
      screenshots: report.screenshots.map(x => x.file), elapsedMs: report.elapsedMs }));
  } catch (error) {
    report.status = 'FAIL';
    report.elapsedMs = Date.now() - started;
    report.failure = error.message;
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, 'failure.json'), JSON.stringify(report, null, 2));
    throw error;
  } finally {
    clearTimeout(timer);
    if (browser) await browser.close();
    if (server.listening) await new Promise(resolve => { server.close(resolve); server.closeAllConnections?.(); });
  }
}

module.exports = { preflight };
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
