'use strict';

// Real-browser acceptance of shipped lessons and a read-only pinned #623 composition.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets/geometry-experiment-gifs');
const OUTPUT = path.resolve(process.env.GEOMETRY_GIFS_EVIDENCE || path.join(ROOT, '../geometry-gif-ui-artifacts'));
const ORIGIN = 'https://geometry-fixture.test';
const catalogue = JSON.parse(fs.readFileSync(path.join(ASSETS, 'catalog.json')));
const media = JSON.parse(fs.readFileSync(path.join(ASSETS, 'media.json')));
const errors = [], results = [];
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const fixtureFiles = new Map();
const manualHost = '[data-geometry-guide-surface="manual"]';
const byRoleButton = (scope, name) => scope.getByRole('button', { name, exact: true });
const componentOnly = process.argv.slice(2).includes('--component-only');
assert(process.argv.slice(2).every(arg => arg === '--component-only'), 'only --component-only is supported; CI runs the complete default suite');

async function openRetainedBoard(page) {
  const retained = page.locator('details.manual-research');
  if (await retained.count() && !await retained.evaluate(node => node.open)) await retained.locator('summary').first().click();
}
async function legacyObservation(page) {
  const field = page.locator('#legacy-observation');
  return await field.count() ? field : page.locator('#observation');
}

function fullConfig(filename) {
  const mapping = catalogue.pages[filename];
  const conf = { unitId: mapping.unitId, manual: mapping.manual, experiments: mapping.experiments, investigations: mapping.investigations, clips: [] };
  const url = file => `data:image/${file.endsWith('.gif') ? 'gif' : 'png'};base64,${fs.readFileSync(path.join(ASSETS, file)).toString('base64')}`;
  for (const id of new Set([...conf.manual, ...conf.experiments, ...conf.investigations])) {
    const clip = catalogue.clips[id], recording = media.clips[id];
    conf.clips.push({ id, title: clip.title, note: clip.note, steps: clip.steps.map(step => ({ caption: step.caption })), width: recording.width, height: recording.height, gif: url(recording.gif), poster: url(recording.poster), frames: recording.frames.map(url) });
  }
  return conf;
}

function pinnedFixture() {
  const ref = catalogue.compatibility.pendingHead;
  assert(/^[a-f0-9]{40}$/.test(ref), 'immutable pending source');
  const filename = 'geometry-course/atlas/midline.html';
  const html = execFileSync('git', ['show', `${ref}:${filename}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  assert(html.includes('GeoInvestigations.mount'), 'fixture really contains the pending topic runtime');
  const css = fs.readFileSync(path.join(ASSETS, 'guide.css'), 'utf8');
  const runtime = fs.readFileSync(path.join(ASSETS, 'guide.js'), 'utf8').replace(/<\/script/g, '<\\/script');
  const config = JSON.stringify(fullConfig(filename)).replace(/</g, '\\u003c');
  const script = `<script>${runtime}\nwindow.__guideFixture=window.MathExamGeometryExperimentGifs.attach(document.getElementById('lesson'),${config});</script>`;
  return html.replace('</head>', `<style>${css}</style></head>`).replace('</body>', script + '</body>');
}

async function routeLocal(context, { offline = false } = {}) {
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    // Navigator is unrelated to this course and its externally fetched suggestions.
    if (/^\/assets\/assistant\/navigator-(?:data|widget)\.js$/.test(url.pathname)) {
      await route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
      return;
    }
    if (url.protocol === 'file:') {
      if (offline && url.pathname !== path.join(ROOT, 'geometry-course/atlas/midline.html')) {
        errors.push('Unexpected standalone dependency: ' + url.pathname);
        await route.abort();
      } else await route.continue();
      return;
    }
    if (url.origin !== ORIGIN || offline) {
      errors.push('Unexpected external request: ' + url.origin + url.pathname);
      await route.abort();
      return;
    }
    const relative = decodeURIComponent(url.pathname).slice(1);
    if (fixtureFiles.has(relative)) {
      await route.fulfill({ status: 200, contentType: mime['.html'], body: fixtureFiles.get(relative) });
      return;
    }
    const file = path.resolve(ROOT, relative);
    if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      errors.push('Missing fixture asset: ' + relative);
      await route.fulfill({ status: 404, body: 'Missing fixture resource' });
      return;
    }
    await route.fulfill({ status: 200, contentType: mime[path.extname(file)] || 'application/octet-stream', body: fs.readFileSync(file) });
  });
}

async function watch(page) {
  page.on('pageerror', error => errors.push(error.message));
  const gifRequests = [];
  page.on('request', request => { if (/\/assets\/geometry-experiment-gifs\/[^?]+\.gif(?:\?|$)/.test(request.url())) gifRequests.push(request.url()); });
  return gifRequests;
}

async function imageReady(scope) {
  const preview = scope.locator('.geg-preview img');
  await preview.scrollIntoViewIfNeeded();
  await preview.evaluate(image => image.decode());
  assert(await preview.evaluate(image => image.naturalWidth > 0), 'actual PNG/GIF decodes');
}

async function noPageOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({ width: innerWidth, body: document.body.scrollWidth, html: document.documentElement.scrollWidth }));
  assert(dimensions.body <= dimensions.width + 1 && dimensions.html <= dimensions.width + 1, label + ': ' + JSON.stringify(dimensions));
}

async function stored(page) {
  return page.evaluate(() => JSON.stringify(Object.fromEntries(Object.keys(localStorage).filter(key => /mathExamGeometry|mathExamCourseProgress/.test(key)).sort().map(key => [key, localStorage.getItem(key)]))));
}

function savedWork(filename) {
  const mapping = catalogue.pages[filename];
  const G = require(path.join(ROOT, mapping.course, 'assets/geometry.js'));
  const S = require(path.join(ROOT, mapping.course, 'assets/store.js'));
  const board = new G.Board(G.scene('triangle'));
  board.addPoint(45, 45); board.addPoint(65, 45); // M and N already used by earlier pupil work.
  board.make('midpoint', ['C', 'A']);
  board.make('midpoint', ['C', 'B']);
  board.make('segment', ['Q', 'P']);
  return { key: S.KEY, id: mapping.unitId, data: { version: 1, units: { [mapping.unitId]: S.clean({ stage: 1, seed: 19, draft: '7/2', written: 'Своё объяснение сохраняется.', observation: 'Я сравниваю длины после движения.', drawing: JSON.parse(board.snapshot()), moved: true, construction: true, attempts: 3, independent: 1, hints: 2, assisted: true }) } } };
}

async function exerciseViewer(page, host, label) {
  await imageReady(host);
  await byRoleButton(host, 'Крупно').click();
  const dialog = host.locator('dialog');
  await dialog.waitFor({ state: 'visible' });
  assert(await dialog.evaluate(node => node.matches(':modal')), 'native modal makes background inert');
  assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('geg-dialog-close')), true, 'close receives initial focus');
  const before = await dialog.locator('.geg-dialog-scroll img').evaluate(image => image.getBoundingClientRect().width);
  for (let i = 0; i < 3; i++) await byRoleButton(dialog, 'Увеличить изображение').click();
  const after = await dialog.locator('.geg-dialog-scroll img').evaluate(image => image.getBoundingClientRect().width);
  assert(after > before, 'zoom exposes readable source controls');
  assert(await dialog.locator('.geg-dialog-scroll').evaluate(el => el.scrollWidth >= el.clientWidth), 'zoom contained within viewer');
  await noPageOverflow(page, label + ' zoom');
  for (let i = 0; i < 16; i++) {
    await page.keyboard.press('Tab');
    assert(await dialog.evaluate(node => node.contains(document.activeElement)), 'focus stays inside native modal');
  }
  await byRoleButton(dialog, 'Закрыть').focus();
  await page.keyboard.press('Shift+Tab');
  assert(await dialog.locator('.geg-dialog-scroll').evaluate(node => node === document.activeElement), 'reverse Tab wraps inside viewer');
  await byRoleButton(dialog, 'Следующий шаг крупно').click();
  assert.match(await dialog.locator('.geg-dialog-caption').innerText(), /Шаг 2 из/);
  await byRoleButton(dialog, 'Смотреть GIF крупно').click();
  assert.equal(await host.locator('.geometry-experiment-guide').getAttribute('data-playing'), 'true');
  assert(/^(?:data:image\/gif;base64,|\/assets\/geometry-experiment-gifs\/.*\.gif$)/.test(await dialog.locator('.geg-dialog-scroll img').getAttribute('src')));
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  await page.waitForFunction(() => !document.querySelector('dialog[open]'));
  assert.equal(await host.locator('.geometry-experiment-guide').getAttribute('data-playing'), 'false');
  assert(await byRoleButton(host, 'Крупно').evaluate(button => button === document.activeElement), 'focus restored to opener');
}

async function componentLifecycle(browser) {
  const context = await browser.newContext({ viewport: { width: 320, height: 900 } });
  const filename = '__fixtures__/guide-lifecycle.html';
  const css = fs.readFileSync(path.join(ASSETS, 'guide.css'), 'utf8');
  const runtime = fs.readFileSync(path.join(ASSETS, 'guide.js'), 'utf8').replace(/<\/script/g, '<\\/script');
  const config = JSON.stringify(fullConfig('geometry-course/atlas/midline.html')).replace(/</g, '\\u003c');
  fixtureFiles.set(filename, `<!doctype html><html lang="ru"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:8px}${css}</style><main id="fixture"><details id="panel" open><summary>Поле эксперимента</summary><div id="guide-host"></div></details></main><script>${runtime}
    window.fixtureConfig=${config};
    window.mountFixture=()=>window.fixtureGuide=window.MathExamGeometryExperimentGifs.mount(document.getElementById('guide-host'),window.fixtureConfig,'manual');
    window.mountFixture();
    window.pupilEvents=0;
    for(const type of ['click','input','change','submit']) document.getElementById('guide-host').addEventListener(type,()=>window.pupilEvents++);
    </script></html>`);
  await routeLocal(context);
  const page = await context.newPage(); await watch(page);
  try {
    await page.goto(ORIGIN + '/' + filename);
    const host = page.locator('#guide-host'), dialog = host.locator('dialog');
    await exerciseViewer(page, host, 'isolated 320px guide');
    assert.equal(await page.evaluate(() => window.pupilEvents), 0, 'guide controls do not reach pupil handlers');

    await byRoleButton(host, 'Смотреть GIF').click();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.querySelector('.geg-play').disabled);
    assert.equal(await host.locator('section').getAttribute('data-playing'), 'false', 'motion preference stops inline animation');
    assert.equal(await host.locator('img[src^="data:image/gif"]').count(), 0);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForFunction(() => !document.querySelector('.geg-play').disabled);
    assert.equal(await host.locator('section').getAttribute('data-playing'), 'false', 'motion preference never resumes automatically');
    await byRoleButton(host, 'Крупно').click();
    await byRoleButton(dialog, 'Смотреть GIF крупно').click();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.querySelector('.geg-dialog-play').disabled);
    assert.equal(await host.locator('section').getAttribute('data-playing'), 'false', 'motion preference stops modal animation');
    assert.equal(await host.locator('img[src^="data:image/gif"]').count(), 0);
    await byRoleButton(dialog, 'Следующий шаг крупно').click();
    assert.equal(await dialog.locator('.geg-dialog-caption').innerText(), await host.locator('.geg-caption').innerText(), 'steps stay synchronized across views');
    await byRoleButton(dialog, 'Закрыть').click();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForFunction(() => !document.querySelector('.geg-play').disabled);

    await byRoleButton(host, 'Смотреть GIF').click();
    await page.locator('#panel > summary').click();
    await page.waitForFunction(() => document.querySelector('.geometry-experiment-guide').dataset.playing === 'false');
    await page.locator('#panel > summary').click();
    assert.equal(await host.locator('section').getAttribute('data-playing'), 'false', 'reopening a parent does not restart playback');
    await byRoleButton(host, 'Крупно').click();
    await byRoleButton(dialog, 'Смотреть GIF крупно').click();
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(await host.locator('section').getAttribute('data-playing'), 'false', 'page lifecycle closes viewer and stops animation');
    await byRoleButton(host, 'Смотреть GIF').click();
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
      delete document.hidden;
    });
    assert.equal(await host.locator('section').getAttribute('data-playing'), 'false', 'hidden-document event stops animation');

    await byRoleButton(host, 'Крупно').click();
    await page.evaluate(() => window.fixtureGuide.destroy());
    assert.equal(await page.locator('dialog').count(), 0, 'destroy removes the native modal from the top layer');
    for (let i = 0; i < 3; i++) await page.evaluate(() => window.mountFixture());
    assert.equal(await host.locator('.geometry-experiment-guide').count(), 1, 'same-host remount remains unique');
    await byRoleButton(host, 'Следующий шаг инструкции').click();
    assert.match(await host.locator('.geg-caption').innerText(), /Шаг 2 из/, 'remount has only one active action listener');
    await page.evaluate(() => {
      window.fixtureGuide.destroy();
      window.fixtureGuide=window.MathExamGeometryExperimentGifs.mount(document.getElementById('guide-host'),{manual:['broken'],clips:[{id:'broken',title:'Проверка недоступного изображения',gif:'data:image/gif;base64,AAAA',poster:'data:image/png;base64,AAAA',frames:['data:image/png;base64,AAAA'],steps:[{caption:'Нажми кнопку «Двигать».'}]}]},'manual');
    });
    await page.waitForFunction(() => document.querySelector('.geg-transcript').open);
    assert.match(await host.locator('.geg-status').first().innerText(), /Изображение не загрузилось/);
    assert.match(await host.locator('.geg-transcript').innerText(), /Нажми кнопку «Двигать»/);
    await page.screenshot({ path: path.join(OUTPUT, 'image-error-text-fallback.png') });
    results.push({ componentLifecycle: true, width: 320, keyboardTrap: true, reducedMotionBothViews: true, parentClose: true, pagehide: true, visibilityEvent: true, destroyAndRemount: true, imageErrorFallback: true });
    await pogorelovTopicOwnership(page);
  } finally { await context.close(); }
}

async function pogorelovTopicOwnership(page) {
  const rel = 'geometry-pogorelov/atlas/pogorelov-base-7-1.html';
  const oldPage = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const flagged = rel.replace('.html', '-test-topic.html');
  const withQuestion = oldPage.replace(/(window\.COURSE_CONFIG=)(.*?)(;<\/script>)/s, (_, start, raw, end) => {
    const config = JSON.parse(raw);
    config.unit.topicQuestion = 'Какие точки задают прямую?';
    return start + JSON.stringify(config).replace(/</g, '\\u003c') + end;
  });
  assert.notEqual(withQuestion, oldPage);
  fixtureFiles.set(flagged, withQuestion);
  try {
    await page.goto(ORIGIN + '/' + flagged);
    await page.locator('[data-stage="1"]').click();
    await page.locator('#geo-board canvas').waitFor();
    assert.equal(await page.locator(manualHost).count(), 0, 'a topic question owns the board without a marker');

    await page.goto(ORIGIN + '/' + rel);
    await page.locator('[data-stage="1"]').click();
    const oldGuide = page.locator(manualHost);
    await oldGuide.waitFor();
    await byRoleButton(oldGuide, 'Смотреть GIF').click();
    await page.locator('.geometry-experiment-guide[data-playing="true"]').waitFor();
    await page.locator('#geo-board').evaluate(board => {
      const own = document.createElement('details');
      own.dataset.pogorelovTopicGuide = '';
      own.innerHTML = '<summary>Опыт с прямой</summary>';
      board.before(own);
    });
    await oldGuide.waitFor({ state: 'detached' });
    assert.equal(await page.locator('[data-pogorelov-topic-guide]').count(), 1);
    assert.equal(await page.locator('.geometry-experiment-guide[data-playing="true"]').count(), 0);
    await page.locator('[data-stage="0"]').click();
    await page.locator('[data-stage="1"]').click();
    await page.locator('#geo-board canvas').waitFor();
    assert.equal(await oldGuide.count(), 0, 'an obsolete player stays detached across stage changes');
    results.push({ pogorelovTopicOwnsBoard: true, lateTopicGuideReleasesPlayer: true });
  } finally {
    fixtureFiles.delete(flagged);
  }
}

async function allPages(browser) {
  const context = await browser.newContext({ viewport: { width: 1024, height: 900 } });
  await routeLocal(context);
  const page = await context.newPage(), gifRequests = await watch(page);
  try {
    for (const [filename, mapping] of Object.entries(catalogue.pages)) {
      await page.goto(ORIGIN + '/' + filename);
      await page.locator('[data-stage="1"]').click();
      await openRetainedBoard(page);
      const host = page.locator(manualHost);
      if (mapping.course === 'geometry-pogorelov' && await page.evaluate(() =>
        Boolean(window.COURSE_CONFIG.unit.topicQuestion || document.querySelector('#lesson [data-pogorelov-topic-guide]')))) {
        await page.locator('#geo-board canvas').waitFor();
        assert.equal(await page.locator('[data-geometry-guide-surface]').count(), 0, filename + ': no legacy player for a topic scene');
        results.push({ filename, topicOwnsGuide: true });
        continue;
      }
      await host.waitFor();
      assert.equal(await host.count(), 1, filename + ': one guide beside the manual board');
      assert.equal(await host.locator('.geometry-experiment-guide').getAttribute('data-clip'), mapping.manual[0]);
      const harmonized = mapping.course === 'geometry-course';
      assert.equal(await page.locator('#topic-investigation .topic-investigation').count(), harmonized ? 1 : 0, filename + ': exact current research surface');
      const experimentGuide = page.locator('[data-geometry-guide-surface="experiments"]');
      assert.equal(await experimentGuide.count(), mapping.experiments.length ? 1 : 0, filename + ': extra experiment mapping for current stage');
      assert.equal(await page.locator('[data-geometry-guide-surface="investigations"]').count(), harmonized ? 1 : 0, filename + ': guide follows the actual topic surface');
      await imageReady(host);
      assert.equal(await page.locator('.geometry-experiment-guide[data-playing="true"]').count(), 0);
      assert.equal(await page.locator('.geometry-experiment-guide img[src^="data:image/gif"]').count(), 0, filename + ': no GIF decoded before request');
      assert.equal(gifRequests.length, 0, 'no GIF network prefetch');
      for (const guide of await experimentGuide.all()) {
        assert.equal(await guide.locator('.geometry-experiment-guide').getAttribute('data-clip'), mapping.experiments[0], filename + ': guide matches extra model');
        assert(await guide.evaluate(node => node.nextElementSibling?.id === 'extra-model'), filename + ': guide beside extra model controls');
        if (harmonized) {
          assert(await guide.evaluate(node => Boolean(node.closest('details.manual-research'))), filename + ': additional research model stays inside retained work');
        }
        await imageReady(guide);
      }
      if (harmonized) {
        await page.locator('[data-stage="0"]').click();
        assert.equal(await page.locator('[data-geometry-guide-surface="experiments"]').count(), mapping.experiments.length ? 1 : 0, filename + ': additional model is on the explanation stage');
        for (const other of await page.locator('[data-geometry-guide-surface="experiments"]').all()) await imageReady(other);
      }
      results.push({ filename, guide: mapping.manual[0], staticPreview: true, noAutoplay: true });
    }
  } finally { await context.close(); }
}

async function midlineMatrix(browser) {
  const filenames = ['geometry-course/atlas/midline.html', 'geometry-pogorelov/atlas/pogorelov-base-8-58.html'];
  for (const filename of filenames) for (const width of [320, 390, 768, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 500 });
    await routeLocal(context);
    const saved = savedWork(filename);
    await context.addInitScript(saved => { if (!localStorage.getItem(saved.key)) localStorage.setItem(saved.key, JSON.stringify(saved.data)); }, saved);
    const page = await context.newPage(), requests = await watch(page);
    try {
      await page.goto(ORIGIN + '/' + filename);
      await openRetainedBoard(page);
      const host = page.locator(manualHost);
      await host.waitFor();
      assert.match(await page.locator('.lab-readout').innerText(), /PQ = 3.60/);
      assert.doesNotMatch(await page.locator('.lab-readout').innerText(), /ACB|S△/);
      const before = await stored(page);
      await byRoleButton(host, 'Смотреть GIF').click();
      assert.equal(await host.locator('.geometry-experiment-guide').getAttribute('data-playing'), 'true');
      await byRoleButton(host, 'Следующий шаг инструкции').click();
      assert.match(await host.locator('.geg-caption').innerText(), /Шаг 2 из/);
      await byRoleButton(host, 'Повторить инструкцию с начала').click();
      assert.match(await host.locator('.geg-caption').innerText(), /Шаг 1 из/);
      await exerciseViewer(page, host, filename + ' ' + width);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForFunction(() => document.querySelector('.geg-play').disabled);
      await byRoleButton(host, 'Следующий шаг инструкции').click();
      await byRoleButton(host, 'Крупно').click();
      const dialog = host.locator('dialog');
      assert.equal(await byRoleButton(dialog, 'Смотреть GIF крупно').isDisabled(), true);
      await byRoleButton(dialog, 'Закрыть').click();
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.waitForFunction(() => !document.querySelector('.geg-play').disabled);
      await host.getByLabel('Пример действия на чертеже').selectOption(catalogue.pages[filename].manual[1]);
      await imageReady(host);
      await page.waitForTimeout(250); // Existing lesson save debounce: catches accidental bubbling into progress handlers.
      assert.equal(await stored(page), before, filename + ': all guide controls preserve exact stored pupil work');
      if (filename.startsWith('geometry-course/')) assert.equal(requests.length, 0, 'standalone guide media are embedded');
      else assert(requests.length > 0, 'online GIF loads only when explicitly played');
      await noPageOverflow(page, filename + ' ' + width);
      await host.scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(OUTPUT, `${catalogue.pages[filename].course}-${width}.png`), fullPage: true });
      await byRoleButton(host, 'Крупно').click();
      for (let i = 0; i < 3; i++) await byRoleButton(host.locator('dialog'), 'Увеличить изображение').click();
      await page.screenshot({ path: path.join(OUTPUT, `${catalogue.pages[filename].course}-${width}-large.png`) });
      await page.keyboard.press('Escape');
      for (let i = 0; i < 3; i++) {
        await page.locator('[data-stage="0"]').click();
        await page.waitForFunction(() => !document.querySelector('[data-geometry-guide-surface="manual"]'));
        await page.locator('[data-stage="1"]').click();
        await openRetainedBoard(page);
        await host.waitFor();
        assert.equal(await host.count(), 1, 'returning to a stage does not duplicate the guide');
      }
      assert.equal(await (await legacyObservation(page)).inputValue(), 'Я сравниваю длины после движения.');
      assert.match(await page.locator('.lab-readout').innerText(), /PQ = 3.60/);
      await page.reload(); await openRetainedBoard(page); await host.waitFor();
      assert.equal(await (await legacyObservation(page)).inputValue(), 'Я сравниваю длины после движения.');
      assert.match(await page.locator('.lab-readout').innerText(), /PQ = 3.60/);
      results.push({ filename, width, playback: true, modalZoom: true, exactWorkPreserved: true, remount: true, reload: true });
    } finally { await context.close(); }
  }
}

async function standalone(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 900 }, offline: true });
  await routeLocal(context, { offline: true });
  const page = await context.newPage(); await watch(page);
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'geometry-course/atlas/midline.html')).href);
    await page.locator('[data-stage="1"]').click();
    await openRetainedBoard(page);
    const host = page.locator(manualHost); await host.waitFor(); await imageReady(host);
    await byRoleButton(host, 'Смотреть GIF').click(); await imageReady(host);
    await byRoleButton(host, 'Остановить GIF').click();
    await page.reload(); await page.locator('[data-stage="1"]').click(); await openRetainedBoard(page); await imageReady(host);
    results.push({ standalone: 'geometry-course/atlas/midline.html', offline: true, reload: true });
  } finally { await context.close(); }
}

async function pendingCompatibility(browser) {
  const filename = '__fixtures__/pending-midline.html';
  fixtureFiles.set(filename, pinnedFixture());
  const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
  await routeLocal(context);
  const page = await context.newPage(); await watch(page);
  try {
    await page.goto(ORIGIN + '/' + filename);
    await page.locator('[data-stage="1"]').click();
    const primary = page.locator('[data-geometry-guide-surface="investigations"]'), manual = page.locator(manualHost);
    await primary.waitFor(); await manual.waitFor({ state: 'attached' });
    assert.equal(await primary.evaluate(node => !!node.closest('details')), false, 'topic instruction stays beside the primary experience outside retained work');
    assert.equal(await manual.evaluate(node => node.closest('details')?.className), 'manual-research', 'old construction instruction stays inside its own field');
    assert.equal(await primary.locator('.geometry-experiment-guide').getAttribute('data-clip'), 'atanasyan-topic-midline');
    const before = await stored(page);
    await byRoleButton(primary, 'Смотреть GIF').click();
    await byRoleButton(primary, 'Остановить GIF').click();
    await page.locator('.manual-research summary').first().click();
    await byRoleButton(manual, 'Смотреть GIF').click();
    await page.locator('.manual-research summary').first().click();
    await page.waitForFunction(() => document.querySelector('[data-geometry-guide-surface="manual"] .geometry-experiment-guide').dataset.playing === 'false');
    await page.waitForTimeout(250);
    assert.equal(await stored(page), before, 'help does not choose a forecast or record a conclusion');
    assert.equal(await page.locator('.research-predict select').inputValue(), '');
    await page.locator('.research-predict select').selectOption('unsure');
    await page.locator('.research-predict button').click();
    await page.locator('[data-value="x"]').focus();
    for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(250);
    const changed = await stored(page);
    await byRoleButton(primary, 'Следующий шаг инструкции').click();
    await page.waitForTimeout(250);
    // The experiment's own debounced save may complete now; comparison uses state values rather than timestamps.
    const current = await page.evaluate(() => ({ prediction: document.querySelector('.research-predict select').value, x: document.querySelector('[data-value="x"]').value, observation: document.querySelector('#observation').value }));
    assert.deepEqual(current, { prediction: 'unsure', x: '4', observation: '' });
    assert.equal(await stored(page), changed, 'guide steps preserve the saved forecast, parameters and observation');
    await primary.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(OUTPUT, 'pending-623-primary.png'), fullPage: true });
    results.push({ compatibility: catalogue.compatibility.pendingHead, primaryAndManualSeparated: true, forecastPreserved: true });
  } finally { await context.close(); }
}

(async () => {
  fs.mkdirSync(OUTPUT, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.GEOMETRY_GIFS_BROWSER || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || process.env.CHROMIUM_EXECUTABLE_PATH || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    await componentLifecycle(browser);
    if (!componentOnly) {
      await allPages(browser);
      await midlineMatrix(browser);
      await standalone(browser);
      await pendingCompatibility(browser);
    }
    assert.deepEqual(errors, []);
    const output = { gate: componentOnly ? 'GEOMETRY_EXPERIMENT_GIFS_COMPONENT_OK' : 'GEOMETRY_EXPERIMENT_GIFS_UI_OK', browser: browser.version(), results, errors };
    fs.writeFileSync(path.join(OUTPUT, 'results.json'), JSON.stringify(output, null, 2) + '\n');
    console.log(JSON.stringify({ gate: output.gate, pageCoverage: componentOnly ? 0 : 147, responsiveCases: componentOnly ? 0 : 8, componentLifecycle: true, standalone: !componentOnly, pendingCompatibility: !componentOnly, artifacts: OUTPUT }));
  } finally { await browser.close(); }
})().catch(error => {
  fs.mkdirSync(OUTPUT, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT, 'failure.json'), JSON.stringify({ gate: 'FAILED', error: error.stack, results, errors }, null, 2) + '\n');
  console.error(error.stack || error);
  process.exitCode = 1;
});
