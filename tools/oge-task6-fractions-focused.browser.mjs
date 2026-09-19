import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

// External tooling only; no dependency or browser download is installed by this test.
// PLAYWRIGHT_CORE_PATH accepts a package directory or its entry module.
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH (or BROWSER_EXECUTABLE_PATH) selects a browser.
const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const trainerPath = 'trainers/oge-task6-fractions.html';
const helpPaths = [
  './oge-basics/fraction-meaning.html',
  './oge-basics/fraction-common-denominator.html'
];
let chromium;
try {
  ({ chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || 'playwright-core'));
} catch {
  throw new Error('Browser tooling unavailable: set PLAYWRIGHT_CORE_PATH to an external playwright-core module.');
}
const { loadTrainerRegistry } = require(path.join(root, 'board-server/trainer-registry.js'));
const registry = loadTrainerRegistry({ baseDir: path.join(root, 'board-server'), env: {} });
assert.equal(registry.loaded, true, 'Actual board registry must be available');
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.png': 'image/png'
};
const server = http.createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/api/trainer-registry') {
      response.writeHead(200, { 'Content-Type': mime['.json'] });
      response.end(JSON.stringify(registry.publicPayload));
      return;
    }
    let file = path.resolve(root, pathname.replace(/^\/+/, '') || 'index.html');
    if (!file.startsWith(`${root}${path.sep}`)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (error, data) => {
      if (error) { response.writeHead(404).end('Not found'); return; }
      response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
      response.end(data);
    });
  } catch {
    response.writeHead(400).end('Bad request');
  }
});

const errors = [];
const unexpectedRequests = [];
const evidence = { surfaces: [], scenarios: 0, layouts: 0, targetMeasurements: 0, minimumContrast: Infinity };
let browser;
let baseUrl;
let trainerUrl;

function observe(page, label) {
  page.on('pageerror', error => errors.push(`${label}: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`${label}: ${message.text()}`);
  });
  page.on('requestfailed', request => {
    errors.push(`${label}: request failed ${new URL(request.url()).pathname}: ${request.failure()?.errorText}`);
  });
}

async function newContext(options = {}) {
  const context = await browser.newContext(options);
  context.setDefaultTimeout(10000);
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.protocol === 'file:' || url.origin === baseUrl) return route.continue();
    unexpectedRequests.push(`${url.protocol}//${url.host}${url.pathname}`);
    return route.abort('blockedbyclient');
  });
  return context;
}

async function record(target, index = 0) {
  return target.evaluate(i => records[order[i]] || null, index);
}

async function snapshot(target) {
  return target.evaluate(() => ({
    pos, streak, statuses: order.map(index => records[index]?.status || null),
    counter: document.querySelector('#counter').textContent.replace(/\s+/g, ' ').trim(),
    stats: document.querySelector('#stats').textContent.replace(/\s+/g, ' ').trim()
  }));
}

async function jump(target, index) {
  await target.locator('#taskJump').selectOption({ index });
  assert.equal(await target.evaluate(() => pos), index, 'Select must navigate to its task');
  assert.ok(['taskHeading', 'ans'].includes(await target.evaluate(() => document.activeElement.id)),
    'Jump must focus the task heading or answer');
}

async function activate(target, selector, touch = false) {
  if (touch) await target.locator(selector).tap();
  else await target.locator(selector).click();
}

async function answer(target, value, touch = false) {
  await target.locator('#ans').fill(value);
  await activate(target, '#check', touch);
}

async function reset(target, touch = false) {
  const button = target.getByRole('button', { name: /начать раздел заново/i });
  if (touch) await button.tap(); else await button.click();
  assert.equal((await snapshot(target)).statuses.filter(Boolean).length, 0);
}

async function expectCounts(target, first, retry, revealed, skipped) {
  const s = await snapshot(target);
  for (const [status, count] of Object.entries({
    'solved-first': first, 'solved-retry': retry, revealed, skipped
  })) assert.equal(s.statuses.filter(item => item === status).length, count, status);
  assert.match(s.counter, new RegExp(`самостоятельно\\s+${first + retry}`, 'i'));
  assert.match(s.counter, new RegExp(`ответ показан\\s+${revealed}`, 'i'));
  assert.match(s.counter, new RegExp(`пропущено\\s+${skipped}`, 'i'));
  assert.doesNotMatch(s.counter, /решено/i);
  const options = await target.locator('#taskJump option').allTextContents();
  assert.equal(options.length, s.statuses.length);
  const stateText = {
    'solved-first': /✓.*с первой/, 'solved-retry': /↻.*после ошибок/,
    revealed: /👁.*ответ показан/, skipped: /—.*пропущено/
  };
  s.statuses.forEach((status, index) => assert.match(options[index],
    stateText[status] || /ещё не пройдено/, `Accessible option state for task ${index + 1}`));
  return s;
}

async function measureTargets(target, label) {
  const targets = await target.evaluate(() => [...document.querySelectorAll('button,input,select,a[href]')]
    .filter(element => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden')
    .map(element => {
      // The checkbox's associated label is its actual pointer target.
      const hit = element.type === 'checkbox' ? element.closest('label') || element : element;
      const r = hit.getBoundingClientRect();
      return { name: element.id || element.textContent.trim(), width: r.width, height: r.height };
    }));
  assert.ok(targets.length >= 4, `${label}: measured actual controls`);
  for (const item of targets) {
    assert.ok(item.width >= 44 && item.height >= 44,
      `${label}: target ${item.name} is ${item.width} x ${item.height}, expected >=44 x 44`);
  }
  evidence.targetMeasurements += targets.length;
}

async function accessibility(target, label) {
  assert.equal(await target.locator('[role="tab"],[role="tablist"]').count(), 0);
  const chips = await target.locator('.chip').evaluateAll(elements => elements.map(element => ({
    tag: element.tagName, pressed: element.getAttribute('aria-pressed')
  })));
  assert.ok(chips.length >= 6);
  assert.ok(chips.every(item => item.tag === 'BUTTON' && ['true', 'false'].includes(item.pressed)));
  assert.equal(chips.filter(item => item.pressed === 'true').length, 1);
  assert.equal(await target.locator('#mark').getAttribute('aria-live'), 'polite');
  assert.equal(await target.locator('#ans').getAttribute('maxlength'), '128');
  assert.ok(await target.locator('#taskJump').evaluate(element =>
    (element.labels && [...element.labels].some(label => /Перейти к задаче/i.test(label.textContent))) ||
    /Перейти к задаче/i.test(element.getAttribute('aria-label') || '')));
  const dots = await target.locator('#dots').evaluate(element => ({
    hidden: element.getAttribute('aria-hidden') === 'true',
    interactive: [...element.querySelectorAll('*')].some(child =>
      child.onclick || child.hasAttribute('tabindex') || ['BUTTON', 'A', 'INPUT'].includes(child.tagName))
  }));
  assert.deepEqual(dots, { hidden: true, interactive: false });
  const text = await target.locator('body').innerText();
  for (const symbol of ['✓', '↻', '👁', '—']) assert.ok(text.includes(symbol), `${label}: text legend ${symbol}`);
  assert.match(text, /Прогресс хранится только до обновления страницы/);
  assert.match(text, /Смена раздела или режима[\s\S]*вперемешку[\s\S]*заново/);
  assert.match(text, /смешанн[\s\S]*неправильн/i);
  await measureTargets(target, label);
}

async function assertFocus(target, selector) {
  await target.locator(selector).focus();
  // A key changes the browser's interaction modality without activating a control.
  await target.locator(selector).press('Shift');
  const focus = await target.locator(selector).evaluate(element => {
    const style = getComputedStyle(element);
    return { active: document.activeElement === element, visible: element.matches(':focus-visible'),
      outline: style.outlineStyle, width: parseFloat(style.outlineWidth), shadow: style.boxShadow };
  });
  assert.equal(focus.active, true);
  assert.equal(focus.visible, true, `${selector}: keyboard focus-visible`);
  assert.ok((focus.outline !== 'none' && focus.width >= 2) || focus.shadow !== 'none',
    `${selector}: visible keyboard focus ring`);
}

async function contrast(target) {
  const ratios = await target.evaluate(() => {
    const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
    const luminance = color => rgb(color).map(x => {
      const v = x / 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    function background(element) {
      for (let node = element; node; node = node.parentElement) {
        const value = getComputedStyle(node).backgroundColor;
        if (value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') return value;
      }
      return 'rgb(255, 255, 255)';
    }
    return [...document.querySelectorAll('#stats span,#stats b,#mark,#mark span,.legend span')]
      .filter(element => element.getClientRects().length && element.textContent.trim())
      .map(element => {
        const style = getComputedStyle(element);
        const a = luminance(style.color), b = luminance(background(element));
        return { text: element.textContent.trim(), ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
      });
  });
  assert.ok(ratios.length > 3, 'Actual state text contrast measured');
  for (const item of ratios) assert.ok(item.ratio >= 4.5,
    `State text contrast ${item.ratio.toFixed(2)} < 4.5: ${item.text}`);
  evidence.minimumContrast = Math.min(evidence.minimumContrast, ...ratios.map(item => item.ratio));
}

async function checkLinks(target, protocol) {
  for (const relative of helpPaths) {
    const link = target.locator(`a[href="${relative}"]`);
    assert.equal(await link.count(), 1, `Help link ${relative}`);
    const resolved = new URL(await link.getAttribute('href'), target.url());
    assert.equal(resolved.protocol, protocol);
    const localFile = path.resolve(root, 'trainers', relative);
    assert.equal(fs.statSync(localFile).isFile(), true);
    if (protocol === 'http:') {
      const response = await fetch(resolved);
      assert.equal(response.status, 200, 'Help link serves real repository file');
    }
  }
}

async function allTaskLayouts(target, label) {
  await target.locator('.chip').first().click();
  const length = await target.locator('#taskJump option').count();
  assert.equal(length, 174, 'All category exposes the complete bank');
  let superscripts = 0;
  for (let index = 0; index < length; index += 1) {
    await jump(target, index);
    const geometry = await target.evaluate(() => {
      const expr = document.querySelector('.expr');
      const rect = expr.getBoundingClientRect();
      const overflow = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > innerWidth + 1;
      const childrenOutside = [...expr.querySelectorAll('*')].some(element => {
        const r = element.getBoundingClientRect();
        return r.width && (r.left < rect.left - 1 || r.right > rect.right + 1);
      });
      const powers = [...expr.querySelectorAll('sup')].map(element => {
        const r = element.getBoundingClientRect();
        let previous = element.previousSibling;
        while (previous && previous.nodeType === Node.TEXT_NODE && !previous.textContent.trim()) previous = previous.previousSibling;
        let base;
        if (previous) {
          const range = document.createRange();
          range.selectNodeContents(previous);
          base = range.getBoundingClientRect();
        }
        return { top: r.top, bottom: r.bottom, font: parseFloat(getComputedStyle(element).fontSize),
          baseTop: base?.top, baseBottom: base?.bottom,
          parentFont: parseFloat(getComputedStyle(element.parentElement).fontSize) };
      });
      return { overflow, childrenOutside, powers };
    });
    assert.equal(geometry.overflow, false, `${label} task ${index + 1}: document overflow`);
    assert.equal(geometry.childrenOutside, false, `${label} task ${index + 1}: clipped expression`);
    for (const power of geometry.powers) {
      assert.ok(power.baseBottom && power.bottom < power.baseBottom - 1,
        `${label} task ${index + 1}: superscript must be visibly above its base: ${JSON.stringify(power)}`);
      assert.ok(power.font < power.parentFont, 'Superscript is smaller than its base');
      superscripts += 1;
    }
    evidence.layouts += 1;
  }
  assert.ok(superscripts > 0, `${label}: actual advanced superscript exercised`);
}

async function flows(page, label, touch = false) {
  await page.goto(trainerUrl, { waitUntil: 'load' });
  await accessibility(page, label);
  await checkLinks(page, 'http:');
  await answer(page, '-3 1/50', touch);
  assert.match(await page.locator('#mark').innerText(), /смешанн[\s\S]*неправильн/i);
  assert.equal((await record(page))?.status || null, null);
  await answer(page, '1 1/2', touch);
  assert.match(await page.locator('#mark').innerText(), /смешанн/i);
  await answer(page, '-0,62', touch);
  await expectCounts(page, 1, 0, 0, 0);
  assert.equal((await snapshot(page)).streak, 1);
  const firstResult = await snapshot(page);
  await page.locator('.chip[aria-pressed="true"]').click();
  assert.deepEqual(await snapshot(page), firstResult, 'Active category preserves progress');
  await measureTargets(page, `${label} next button`);
  await contrast(page);
  await activate(page, '#check', touch);
  await answer(page, '999', touch);
  await jump(page, 0);
  await jump(page, 1);
  await answer(page, '1,8', touch);
  await expectCounts(page, 1, 1, 0, 0);
  assert.equal((await record(page, 1)).wrongAttempts, 1, 'Wrong attempt survives navigation');
  await contrast(page);
  await activate(page, '#check', touch);
  await activate(page, '#reveal', touch);
  assert.equal((await record(page, 2)).status, 'revealed');
  await jump(page, 2);
  await answer(page, '14,3', touch);
  await expectCounts(page, 1, 1, 1, 0);
  assert.equal((await record(page, 2)).answerWasRevealed, true);
  assert.match(await page.locator('#mark').innerText(), /ответ уже был показан[\s\S]*не засчитывается/i);
  assert.equal((await snapshot(page)).streak, 0);
  await contrast(page);
  await jump(page, 0);
  await answer(page, '-0,62', touch);
  assert.equal((await snapshot(page)).streak, 0, 'Revisit must not advance streak');
  await expectCounts(page, 1, 1, 1, 0);
  await jump(page, 1);
  await answer(page, '1,8', touch);
  assert.equal((await record(page, 1)).status, 'solved-retry');
  await jump(page, 3);
  await answer(page, '1,26', touch);
  assert.equal((await snapshot(page)).streak, 1);
  await activate(page, '#check', touch);
  await activate(page, '#skip', touch);
  await expectCounts(page, 2, 1, 1, 1);
  assert.equal((await snapshot(page)).streak, 0, 'Skip resets streak');
  await jump(page, 4);
  await answer(page, '0,8', touch);
  await expectCounts(page, 3, 1, 1, 0);
  await jump(page, 0);
  await activate(page, '#reveal', touch);
  assert.equal((await record(page)).status, 'solved-first', 'Reveal must not downgrade independent result');
  await reset(page, touch);
  await page.locator('#ans').fill('-0,62');
  await page.locator('#ans').press('Enter');
  assert.equal((await snapshot(page)).pos, 0, 'First Enter only checks; original keyup must not advance');
  assert.match(await page.locator('#mark').innerText(), /верно/i);
  assert.ok(['ans', 'check'].includes(await page.evaluate(() => document.activeElement.id)));
  await page.keyboard.press('Enter');
  assert.equal((await snapshot(page)).pos, 1, 'Second separate Enter advances');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'ans');
  await page.locator('#ans').fill('999');
  await page.locator('#ans').press('Enter');
  assert.equal((await snapshot(page)).pos, 1);
  await page.locator('#ans').fill('1,8');
  await page.locator('#ans').press('Enter');
  assert.equal((await snapshot(page)).pos, 1, 'Retry success Enter must not skip result');
  await page.keyboard.press('Enter');
  assert.equal((await snapshot(page)).pos, 2);
  await activate(page, '#reveal', touch);
  await page.keyboard.press('Enter');
  assert.equal((await snapshot(page)).pos, 3, 'Reveal leaves predictable next action');
  await assertFocus(page, '#ans');
  await assertFocus(page, '#taskJump');
  await page.locator('#taskJump').press('Home');
  await page.locator('#taskJump').press('ArrowDown');
  await page.keyboard.press('Enter');
  assert.equal((await snapshot(page)).pos, 1, 'Keyboard select navigation');
  assert.ok(['taskHeading', 'ans'].includes(await page.evaluate(() => document.activeElement.id)));
  await page.locator('#shuffle').check();
  assert.equal((await snapshot(page)).statuses.filter(Boolean).length, 0, 'Shuffle reset matches disclosure');
  assert.equal(await page.evaluate(() => new Set(order).size === order.length), true);
  await page.locator('#shuffle').uncheck();
  await page.locator('.chip').filter({ hasText: 'Десятичные' }).click();
  assert.equal((await snapshot(page)).statuses.length, 21);
  assert.equal((await snapshot(page)).statuses.filter(Boolean).length, 0);
  await page.reload({ waitUntil: 'load' });
  await answer(page, '-0,62', touch);
  await page.reload({ waitUntil: 'load' });
  assert.equal((await snapshot(page)).statuses.filter(Boolean).length, 0, 'Reload resets disclosed in-memory state');
  await answer(page, '-0,62', touch);
  await page.locator('#check').click();
  await answer(page, '999', touch);
  await answer(page, '1,8', touch);
  await page.locator('#check').click();
  await page.locator('#reveal').click();
  await page.locator('#check').click();
  for (let i = 3; i < 81; i += 1) await activate(page, '#skip', touch);
  await expectCounts(page, 1, 1, 1, 78);
  const summary = await page.locator('.summary').innerText();
  assert.match(summary, /Раздел завершён/);
  assert.match(summary, /2\s*\/\s*81/);
  for (const expected of [/с первой:\s*1/, /после ошибок:\s*1/, /ответ показан:\s*1/, /пропущено:\s*78/]) {
    assert.match(summary, expected, 'Summary agrees with actual counters');
  }
  assert.doesNotMatch(summary, /с подсказкой|Раздел пройден/i);
  await measureTargets(page, `${label} summary`);
  await page.getByRole('button', { name: /Пройти ещё раз/i }).click();
  for (let i = 0; i < 81; i += 1) await activate(page, '#skip', touch);
  await expectCounts(page, 0, 0, 0, 81);
  assert.match(await page.locator('.summary').innerText(), /0\s*\/\s*81/);
  assert.match(await page.locator('.summary').innerText(), /пропущено:\s*81/);
  assert.match(await page.locator('.summary').innerText(), /Раздел завершён/);
  await page.getByRole('button', { name: /Пройти ещё раз/i }).click();
  await allTaskLayouts(page, label);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await jump(page, 0);
  await answer(page, '-0,62', touch);
  const motion = await page.locator('#mark .anim').evaluate(element => {
    const style = getComputedStyle(element);
    return { animation: style.animationName, duration: style.animationDuration, transition: style.transitionDuration };
  });
  assert.ok(motion.animation === 'none' || motion.duration.split(',').every(value => parseFloat(value) <= 0.001));
  assert.ok(motion.transition.split(',').every(value => parseFloat(value) <= 0.001));
  evidence.scenarios += 22;
  evidence.surfaces.push(label);
}

try {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  trainerUrl = `${baseUrl}/${trainerPath}`;
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || process.env.BROWSER_EXECUTABLE_PATH;
  try {
    browser = await chromium.launch({ headless: true, timeout: 30000,
      ...(executablePath ? { executablePath } : { channel: 'msedge' }) });
  } catch (error) {
    throw new Error(`Browser unavailable: set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH to system Edge/Chromium. ${error.message}`);
  }
  for (const [label, width, height, touch] of [
    ['desktop', 1280, 900, false], ['mobile-390', 390, 844, true], ['mobile-360', 360, 844, true]
  ]) {
    const context = await newContext({ viewport: { width, height }, isMobile: touch, hasTouch: touch });
    try {
      await context.addInitScript(() => {
        // Test-owned foreign keys establish that trainer actions leave other progress untouched.
        localStorage.setItem('focused-audit.foreign-local', 'unchanged');
        sessionStorage.setItem('focused-audit.foreign-session', 'unchanged');
        window.focusedStorageWrites = [];
        for (const method of ['setItem', 'removeItem', 'clear']) {
          const original = Storage.prototype[method];
          Storage.prototype[method] = function (...args) {
            window.focusedStorageWrites.push(method);
            return original.apply(this, args);
          };
        }
      });
      const page = await context.newPage();
      observe(page, label);
      await flows(page, label, touch);
      const tab = await context.newPage();
      observe(tab, `${label}-second-tab`);
      await tab.goto(trainerUrl, { waitUntil: 'load' });
      assert.equal((await snapshot(tab)).statuses.filter(Boolean).length, 0, 'Second tab has separate in-memory state');
      for (const current of [page, tab]) {
        const storage = await current.evaluate(() => ({
          local: Object.fromEntries(Object.entries(localStorage)),
          session: Object.fromEntries(Object.entries(sessionStorage)),
          writes: window.focusedStorageWrites
        }));
        assert.deepEqual(storage, {
          local: { 'focused-audit.foreign-local': 'unchanged' },
          session: { 'focused-audit.foreign-session': 'unchanged' }, writes: []
        }, 'No storage writes; foreign keys stay byte-identical');
      }
    } finally { await context.close(); }
  }

  const boardContext = await newContext({ viewport: { width: 1280, height: 900 } });
  try {
    const board = await boardContext.newPage();
    observe(board, 'board');
    await board.goto(`${baseUrl}/trainers/trainer-board.html?server=${encodeURIComponent(baseUrl)}`, { waitUntil: 'load' });
    await board.locator('#trainerUrl').fill('oge-task6-fractions.html');
    await board.locator('#openTrainer').click();
    const frame = await (await board.locator('#trainerFrame').elementHandle()).contentFrame();
    await frame.locator('#ans').waitFor();
    assert.equal(new URL(frame.url()).pathname, `/${trainerPath}`);
    await accessibility(frame, 'board iframe');
    await checkLinks(frame, 'http:');
    await frame.locator('#ans').fill('-0,62');
    await frame.locator('#ans').press('Enter');
    assert.equal((await snapshot(frame)).pos, 0, 'Iframe Enter must not advance twice');
    await board.keyboard.press('Enter');
    assert.equal((await snapshot(frame)).pos, 1);
    await allTaskLayouts(frame, 'board iframe');
    evidence.surfaces.push('board-manual-iframe');
  } finally { await boardContext.close(); }

  const offlineContext = await newContext({ viewport: { width: 360, height: 844 }, isMobile: true, hasTouch: true, offline: true });
  try {
    const offline = await offlineContext.newPage();
    observe(offline, 'file-offline');
    await offline.goto(pathToFileURL(path.join(root, trainerPath)).href, { waitUntil: 'load' });
    await accessibility(offline, 'file offline');
    await checkLinks(offline, 'file:');
    await answer(offline, '-0,62', true);
    await expectCounts(offline, 1, 0, 0, 0);
    await allTaskLayouts(offline, 'file offline');
    for (const relative of helpPaths) {
      const linkUrl = await offline.locator(`a[href="${relative}"]`).evaluate(element => element.href);
      const help = await offlineContext.newPage();
      observe(help, `offline-help-${path.basename(relative)}`);
      await help.goto(linkUrl, { waitUntil: 'load' });
      assert.ok((await help.locator('body').innerText()).length > 100);
      await help.close();
    }
    evidence.surfaces.push('file-offline-360');
  } finally { await offlineContext.close(); }
  assert.deepEqual(unexpectedRequests, [], 'No external browser requests');
  assert.deepEqual(errors, [], 'No console, page, or request errors');
  evidence.minimumContrast = Number(evidence.minimumContrast.toFixed(2));
} finally {
  if (browser) await browser.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
console.log(JSON.stringify(evidence));
console.log('OGE_TASK6_FRACTIONS_BROWSER_OK');
