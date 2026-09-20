import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

// External browser tooling only: this test installs no packages or browsers.
// Set PLAYWRIGHT_CORE_PATH and optionally PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.
const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const trainerPath = '/trainers/oge-2027-analogue-1.html';
const storageKey = 'mathExamOge2027Analogue1.v2';
const oldStorageKey = 'mathExamOge2027Analogue1.v1';
const publicTitle = 'Авторский аналог демоверсии ОГЭ-2027 по математике. Вариант 1';
let chromium;
try { ({ chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || 'playwright-core')); }
catch { throw new Error('Set PLAYWRIGHT_CORE_PATH to an external playwright-core package; no dependencies are installed by this gate.'); }
const evidenceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oge2027-browser-'));
const { loadTrainerRegistry } = require(path.join(root, 'board-server/trainer-registry.js'));
const registry = loadTrainerRegistry({ baseDir: path.join(root, 'board-server'), env: {} });
assert.equal(registry.loaded, true);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.png': 'image/png' };
const server = http.createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/api/trainer-registry') {
      response.writeHead(200, { 'Content-Type': mime['.json'] }).end(JSON.stringify(registry.publicPayload)); return;
    }
    let file = path.resolve(root, pathname.replace(/^\/+/, '') || 'index.html');
    if (!file.startsWith(root + path.sep)) { response.writeHead(403).end('Forbidden'); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (error, bytes) => {
      if (error) { response.writeHead(404).end('Not found'); return; }
      response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }).end(bytes);
    });
  } catch { response.writeHead(400).end('Bad request'); }
});
const errors = [], externalRequests = [];
const evidence = { surfaces: [], targetsMeasured: 0, svgMeasurements: 0, printableTasks: 0,
  provenanceRows: 0, provenancePersistenceChecks: 0, rejectedSavedStates: 0, evidenceDir };
let browser, origin, failure;
function progress(stage) { console.log(JSON.stringify({ stage })); }
function failed(error, stage) { console.error(`${stage}: ${error.stack || error}`); throw error; }
async function closeWithin(value, label) {
  let timer;
  progress(label + ' close start');
  try {
    await Promise.race([value.close(), new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label}: cleanup exceeded 30 seconds`)), 30000);
    })]);
    progress(label + ' closed');
  } finally { clearTimeout(timer); }
}

function observe(page, label) {
  page.on('pageerror', error => errors.push(`${label}: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error') errors.push(`${label}: ${message.text()}`); });
  page.on('requestfailed', request => errors.push(`${label}: ${request.url()}: ${request.failure()?.errorText}`));
}

async function context(options, corruptStorage, denyStorage = false) {
  const value = await browser.newContext(options);
  value.setDefaultTimeout(12000);
  await value.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.protocol === 'file:' || url.origin === origin) return route.continue();
    externalRequests.push(url.origin + url.pathname); return route.abort('blockedbyclient');
  });
  await value.addInitScript(({ key, oldKey, corrupt, deny }) => {
    if (!location.pathname.endsWith('/oge-2027-analogue-1.html')) return;
    if (deny) {
      Object.defineProperty(window, 'localStorage', { configurable: true,
        get() { throw new DOMException('Storage disabled for this test', 'SecurityError'); } });
      return;
    }
    localStorage.setItem('browser-test.foreign-progress', 'keep-local');
    sessionStorage.setItem('browser-test.foreign-session', 'keep-session');
    localStorage.setItem(oldKey, JSON.stringify({ version: 1, mode: 'exam', entries: Array.from({ length: 25 }, (_, i) => ({
      input: i === 0 ? '205' : '', wrong: 0, checked: i === 0, correct: i === 0,
      hinted: false, revealed: false, manual: null
    })) }));
    if (corrupt !== undefined) localStorage.setItem(key, corrupt);
    window.browserTestStorageWrites = [];
    window.browserTestStorageReads = [];
    for (const method of ['getItem', 'setItem', 'removeItem', 'clear']) {
      const original = Storage.prototype[method];
      Storage.prototype[method] = function (...args) {
        const events = method === 'getItem' ? window.browserTestStorageReads : window.browserTestStorageWrites;
        events.push({ method, key: args[0], area: this === localStorage ? 'local' : 'session' });
        return original.apply(this, args);
      };
    }
  }, { key: storageKey, oldKey: oldStorageKey, corrupt: corruptStorage, deny: denyStorage });
  return value;
}

async function stored(target) { return target.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey); }
async function entry(target, number) { return (await stored(target))?.entries?.[number - 1]; }
async function score(target) {
  const result = {};
  for (const key of ['independent', 'assisted', 'part1', 'manual', 'total']) {
    const value = await target.locator(`#score-${key}`).innerText();
    assert.match(value, /\d/, `Visible ${key} score`); result[key] = Number(value.match(/\d+/)[0]);
  }
  return result;
}
async function press(target, selector, touch = false) {
  if (touch) await target.locator(selector).tap(); else await target.locator(selector).click();
}
async function check(target, number, answer, touch = false) {
  await target.locator(`#answer-${number}`).fill(answer);
  await press(target, `[data-action="check"][data-number="${number}"]`, touch);
}
async function assertForeignStorage(target) {
  const state = await target.evaluate(() => ({
    local: localStorage.getItem('browser-test.foreign-progress'),
    session: sessionStorage.getItem('browser-test.foreign-session'), writes: window.browserTestStorageWrites,
    reads: window.browserTestStorageReads
  }));
  assert.equal(state.local, 'keep-local'); assert.equal(state.session, 'keep-session');
  assert.ok(state.writes.every(write => write.area === 'local' && write.key === storageKey && write.method !== 'clear'),
    `Unexpected storage mutation: ${JSON.stringify(state.writes)}`);
  assert.ok(state.reads.every(read => read.key !== oldStorageKey), 'Incompatible v1 storage must never be read');
}

async function targets(target, label) {
  const sizes = await target.evaluate(() => [...document.querySelectorAll('button,input,textarea,select,a[href]')]
    .filter(element => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden')
    .map(element => {
      const hit = ['checkbox', 'radio'].includes(element.type) ? element.closest('label') || element : element;
      const r = hit.getBoundingClientRect(); return { name: element.id || element.textContent.trim(), width: r.width, height: r.height };
    }));
  for (const item of sizes) assert.ok(item.width >= 44 && item.height >= 44,
    `${label}: ${item.name} target ${item.width} x ${item.height} must be >=44 x 44`);
  evidence.targetsMeasured += sizes.length;
}

async function diagrams(target, label) {
  const metrics = await target.evaluate(() => {
    const svgs = [...document.querySelectorAll('svg')].filter(svg => svg.getClientRects().length);
    return {
      overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > innerWidth + 1,
      cards: [...document.querySelectorAll('article.task')].map(card => ({ number: Number(card.dataset.number),
        left: card.getBoundingClientRect().left, right: card.getBoundingClientRect().right, count: card.querySelectorAll('svg').length })),
      svgs: svgs.map(svg => {
        const r = svg.getBoundingClientRect(), box = svg.viewBox.baseVal, content = svg.getBBox();
        return { task: svg.closest('article.task')?.dataset.number || 'intro', title: svg.querySelector('title')?.textContent || svg.getAttribute('aria-label'),
          x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom,
          viewWidth: box.width, viewHeight: box.height, preserve: svg.getAttribute('preserveAspectRatio'),
          labels: [...svg.querySelectorAll('text')].map(text => {
            const label = text.getBoundingClientRect();
            return { text: text.textContent, left: label.left, right: label.right, top: label.top, bottom: label.bottom };
          }),
          contentInside: content.x >= box.x - 1 && content.y >= box.y - 1 &&
            content.x + content.width <= box.x + box.width + 1 && content.y + content.height <= box.y + box.height + 1,
          invalid: /NaN|undefined|Infinity/.test(svg.outerHTML) };
      }), width: innerWidth
    };
  });
  assert.equal(metrics.overflow, false, `${label}: horizontal overflow`);
  assert.equal(metrics.cards.length, 25);
  for (const card of metrics.cards) assert.ok(card.left >= -1 && card.right <= metrics.width + 1,
    `${label} task ${card.number}: outside viewport`);
  for (const number of [7, 11, 13, 15, 18, 24, 25]) {
    assert.ok(metrics.cards.find(card => card.number === number).count > 0, `Task ${number}: required SVG`);
  }
  assert.ok(metrics.svgs.length >= 12, 'Own wheel, graph, interval and geometry diagrams');
  for (const [index, svg] of metrics.svgs.entries()) {
    assert.ok(svg.title, `${label}: accessible SVG title for task ${svg.task}`);
    assert.equal(svg.invalid, false, `${label}: invalid SVG coordinates`);
    assert.equal(svg.contentInside, true, `${label}: task ${svg.task} drawing/labels clipped by SVG viewBox`);
    assert.ok(svg.width > 40 && svg.height > 30 && svg.viewWidth > 0 && svg.viewHeight > 0);
    assert.ok(svg.x >= -1 && svg.right <= metrics.width + 1, `${label}: SVG outside viewport`);
    const sx = svg.width / svg.viewWidth, sy = svg.height / svg.viewHeight;
    assert.ok(Math.abs(sx - sy) / Math.max(sx, sy) < 0.015,
      `${label}: task ${svg.task} SVG scale is distorted (${sx} vs ${sy})`);
    for (const [labelIndex, first] of svg.labels.entries()) {
      for (const second of svg.labels.slice(labelIndex + 1)) {
        const overlapX = Math.min(first.right, second.right) - Math.max(first.left, second.left);
        const overlapY = Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top);
        assert.ok(overlapX <= 1 || overlapY <= 1,
          `${label}: task ${svg.task} SVG text labels overlap: ${JSON.stringify(first.text)} / ${JSON.stringify(second.text)}`);
      }
    }
    for (const other of metrics.svgs.slice(index + 1)) {
      const overlapX = Math.min(svg.right, other.right) - Math.max(svg.x, other.x);
      const overlapY = Math.min(svg.bottom, other.bottom) - Math.max(svg.y, other.y);
      assert.ok(overlapX <= 1 || overlapY <= 1, `${label}: SVGs ${svg.task}/${other.task} overlap`);
    }
  }
  evidence.svgMeasurements += metrics.svgs.length;
}

async function focus(target, selector) {
  await target.locator(selector).focus(); await target.locator(selector).press('Shift');
  const result = await target.locator(selector).evaluate(element => {
    const style = getComputedStyle(element); return { active: document.activeElement === element,
      visible: element.matches(':focus-visible'), outline: style.outlineStyle, width: parseFloat(style.outlineWidth), shadow: style.boxShadow };
  });
  assert.equal(result.active, true); assert.equal(result.visible, true);
  assert.ok(result.outline !== 'none' && result.width >= 2 || result.shadow !== 'none', `${selector}: visible focus ring`);
}

async function mode(target, review, touch = false) {
  await press(target, review ? '#mode-review' : '#mode-exam', touch);
  assert.equal(await target.locator(review ? '#mode-review' : '#mode-exam').getAttribute('aria-pressed'), 'true');
  assert.equal(await target.locator('article.task').count(), 25);
}

async function basics(target, label) {
  assert.equal((await target.locator('h1').innerText()).trim(), publicTitle);
  assert.match(await target.locator('body').innerText(), /Не является официальным материалом ФИПИ/);
  assert.equal(await target.locator('article.task').count(), 25);
  assert.equal(await target.locator('input[id^="answer-"]').count(), 19);
  assert.equal(await target.locator('textarea[id^="work-"]').count(), 6);
  assert.equal(await target.locator('[id^="solution-"]:visible').count(), 0, 'Solutions initially hidden');
  assert.equal(await target.locator('[data-action="hint"]:visible').count(), 0, 'Exam mode has no help controls');
  assert.deepEqual(await score(target), { independent: 0, assisted: 0, part1: 0, manual: 0, total: 0 }, 'Old-key progress is ignored');
  assert.equal(await target.locator('#answer-1').inputValue(), '');
  for (let number = 1; number <= 19; number++) {
    const feedback = target.locator(`#feedback-${number}`);
    assert.ok(await feedback.getAttribute('role') === 'status' || await feedback.getAttribute('aria-live') === 'polite');
  }
  await diagrams(target, label); await targets(target, label);
}

async function reset(target, touch = false) {
  await press(target, '#reset', touch); await target.locator('#confirm-reset').waitFor();
  await targets(target, 'reset confirmation');
  await press(target, '#confirm-reset', touch);
  assert.deepEqual(await score(target), { independent: 0, assisted: 0, part1: 0, manual: 0, total: 0 });
  assert.equal(await target.locator('#answer-1').inputValue(), '');
}

async function fullVariant(target, touch = false) {
  const answers = ['205', '102,5', '596,1', '6', '3,2', '12,96', '2', '81', '-7', '0,38',
    '231', '50', '3', '40', '84', '169', '5,5', '10', '2'];
  for (const [index, answer] of answers.entries()) await target.locator(`#answer-${index + 1}`).fill(answer);
  await press(target, '#check-all', touch);
  assert.deepEqual(await score(target), { independent: 19, assisted: 0, part1: 19, manual: 0, total: 19 });
  await mode(target, true, touch);
  for (let number = 20; number <= 25; number++) await target.locator(`#manual-${number}`).selectOption('2');
  assert.deepEqual(await score(target), { independent: 19, assisted: 0, part1: 19, manual: 12, total: 31 });
  await press(target, '#check-all', touch);
  assert.equal((await score(target)).total, 31, 'Repeat full-variant checking cannot exceed 31');
}

async function provenance(page, ctx, label, touch) {
  progress(label + ' provenance start');
  const totals = (independent, assisted, manual = 0) => ({ independent, assisted,
    part1: independent + assisted, manual, total: independent + assisted + manual });
  const help = (action, number) => press(page, `[data-action="${action}"][data-number="${number}"]`, touch);
  const expectEntry = async (number, expected) => {
    const actual = await entry(page, number);
    for (const [key, value] of Object.entries(expected)) assert.equal(actual[key], value, `${label} task ${number}: ${key}`);
  };
  const rows = [
    { name: 'A independent correct', number: 6, act: () => check(page, 6, '12,96', touch),
      expected: { credit: 'independent', correct: true, hinted: false, revealed: false }, totals: totals(1, 0) },
    { name: 'B correct then hint', number: 6, act: async () => { await mode(page, true, touch); await help('hint', 6); },
      expected: { credit: 'independent', correct: true, hinted: true, revealed: false }, totals: totals(1, 0) },
    { name: 'C correct then reveal', number: 6, act: () => help('reveal', 6),
      expected: { credit: 'independent', correct: true, hinted: true, revealed: true }, totals: totals(1, 0) },
    { name: 'D hint before correct', number: 2, act: async () => { await help('hint', 2); await check(page, 2, '102.5', touch); },
      expected: { credit: 'assisted', correct: true, hinted: true, revealed: false }, totals: totals(1, 1) },
    { name: 'E reveal before correct', number: 3, act: async () => { await help('reveal', 3); await check(page, 3, '596,1', touch); },
      expected: { credit: 'revealed', correct: true, hinted: false, revealed: true }, totals: totals(1, 1) }
  ];
  for (const row of rows) {
    await row.act(); await expectEntry(row.number, row.expected);
    assert.deepEqual(await score(page), row.totals, `${label}: ${row.name}`);
    if (row.name.startsWith('C ')) assert.match(await page.locator('#feedback-6').innerText(), /Решение открыто после самостоятельного ответа/i);
    evidence.provenanceRows++;
  }
  const saved = await stored(page), savedScore = await score(page);
  assert.deepEqual([saved.entries[5].credit, saved.entries[1].credit, saved.entries[2].credit], ['independent', 'assisted', 'revealed']);
  await page.reload({ waitUntil: 'load' });
  assert.deepEqual(await stored(page), saved, 'F reload preserves exact credit and opened-help flags');
  assert.deepEqual(await score(page), savedScore);
  assert.match(await page.locator('#feedback-6').innerText(), /Решение открыто после самостоятельного ответа/i);
  evidence.provenancePersistenceChecks++;
  const tab = await ctx.newPage(); observe(tab, label + '-provenance-new-tab');
  try {
    await tab.goto(origin + trainerPath, { waitUntil: 'load' });
    assert.deepEqual(await stored(tab), saved, 'F new tab restores all three credit classes without reclassification');
    assert.deepEqual(await score(tab), savedScore); await assertForeignStorage(tab);
    evidence.provenancePersistenceChecks++;
  } finally { await tab.close(); }
  const followups = [
    { name: 'assisted then reveal', act: async () => {
      await help('reveal', 2); await expectEntry(2, { credit: 'assisted', hinted: true, revealed: true });
      assert.deepEqual(await score(page), totals(1, 1));
    } },
    { name: 'G edit after reveal', act: async () => {
      await page.locator('#answer-6').fill('12.960');
      await expectEntry(6, { checked: false, correct: false, credit: null, hinted: true, revealed: true });
      assert.deepEqual(await score(page), totals(0, 1));
      await help('check', 6); await expectEntry(6, { checked: true, correct: true, credit: 'revealed', hinted: true, revealed: true });
      assert.deepEqual(await score(page), totals(0, 1), 'Editing after reveal cannot regain independent credit');
    } },
    { name: 'edit after hint', act: async () => {
      await check(page, 8, '81', touch); await help('hint', 8);
      await expectEntry(8, { credit: 'independent', hinted: true, revealed: false });
      assert.deepEqual(await score(page), totals(1, 1));
      await page.locator('#answer-8').fill('81.0');
      await expectEntry(8, { checked: false, correct: false, credit: null, hinted: true, revealed: false });
      await help('check', 8); await expectEntry(8, { credit: 'assisted', correct: true });
      assert.deepEqual(await score(page), totals(0, 2));
    } },
    { name: 'wrong then independent then reveal', act: async () => {
      await check(page, 9, '0', touch); await check(page, 9, '-7', touch); await help('reveal', 9);
      await expectEntry(9, { credit: 'independent', correct: true, hinted: false, revealed: true, wrong: 1 });
      assert.deepEqual(await score(page), totals(1, 2));
    } },
    { name: 'repeat unchanged checks', act: async () => {
      const before = await stored(page), beforeScore = await score(page);
      for (const number of [2, 3, 6, 8, 9]) await help('check', number);
      await press(page, '#check-all', touch);
      for (const number of [2, 3, 6, 8, 9]) assert.deepEqual(await entry(page, number), before.entries[number - 1]);
      assert.deepEqual(await score(page), beforeScore, 'Repeated checks preserve credit and score');
    } },
    { name: 'Part 2 manual grade after reveal', act: async () => {
      await help('reveal', 20); await page.locator('#manual-20').selectOption('2');
      assert.match(await page.locator('#feedback-20').innerText(), /не подтверждает самостоятельность/i);
      await expectEntry(20, { credit: null, revealed: true, manual: 2 });
      assert.deepEqual(await score(page), totals(1, 2, 2));
    } }
  ];
  for (const row of followups) { await row.act(); evidence.provenanceRows++; }
  await assertForeignStorage(page);
  progress(label + ' provenance passed');
}

async function flows(page, target, label, touch) {
  progress(label + ' flows start');
  await basics(target, label);
  await press(target, '[data-action="check"][data-number="1"]', touch);
  assert.match(await target.locator('#feedback-1').innerText(), /ответ|отвеч|заполн|введите/i);
  assert.equal((await entry(target, 1))?.wrong || 0, 0, 'Blank answer is not a wrong attempt');
  await check(target, 1, '999', touch);
  assert.equal((await entry(target, 1)).wrong, 1);
  assert.equal((await entry(target, 1)).correct, false);
  await check(target, 1, '205', touch);
  assert.deepEqual(await score(target), { independent: 1, assisted: 0, part1: 1, manual: 0, total: 1 });
  await press(target, '[data-action="check"][data-number="1"]', touch);
  assert.equal((await score(target)).part1, 1, 'Repeated check must not add credit');
  await mode(target, true, touch);
  assert.equal((await entry(target, 1)).hinted, false, 'Entering review is not asking for help');
  assert.equal((await entry(target, 1)).revealed, false);
  await targets(target, label + ' review');
  for (const [number, answerLeak] of [[20, /[−-]\s*4/], [21, /\b15\b/], [22, /[−-]\s*1|\b7\b/], [23, /\b17\b/], [25, /\b480\b/]]) {
    assert.doesNotMatch(await target.locator(`#task-${number} .rubric`).innerText(), answerLeak,
      `Task ${number}: visible rubric must not disclose the answer before reveal`);
    assert.equal((await entry(target, number)).revealed, false);
    assert.equal(await target.locator(`#solution-${number}`).isVisible(), false);
  }
  await press(target, '[data-action="hint"][data-number="2"]', touch);
  assert.equal(await target.locator('#hint-2').isVisible(), true);
  assert.equal(await target.locator('#solution-2').isVisible(), false);
  assert.doesNotMatch(await target.locator('#hint-2').innerText(), /102[,.]5/);
  await check(target, 2, '102.5', touch);
  assert.deepEqual(await score(target), { independent: 1, assisted: 1, part1: 2, manual: 0, total: 2 });
  await press(target, '[data-action="reveal"][data-number="3"]', touch);
  assert.equal(await target.locator('#solution-3').isVisible(), true);
  await check(target, 3, '596,1', touch);
  assert.equal((await entry(target, 3)).revealed, true);
  assert.equal((await entry(target, 3)).credit, 'revealed');
  assert.equal((await score(target)).part1, 2, 'Solution opened before the correct answer must not earn Part 1 credit');
  await mode(target, false, touch); await mode(target, true, touch);
  assert.equal((await entry(target, 1)).wrong, 1, 'Mode changes preserve wrong attempts');
  assert.equal((await entry(target, 3)).revealed, true, 'Mode changes preserve reveal provenance');
  await target.locator('#work-20').fill('Моя модель: x не равен 0; исследую знаки.');
  await target.locator('#manual-20').selectOption('2'); await target.locator('#manual-21').selectOption('1');
  assert.deepEqual(await score(target), { independent: 1, assisted: 1, part1: 2, manual: 3, total: 5 });
  for (const [number, invalid, correct] of [[7, '2.0', '2'], [11, '2 3 1', '231'], [13, '3.0', '3']]) {
    for (const value of [invalid, ' ' + correct, correct + ' ']) {
      await check(target, number, value, touch);
      assert.equal((await entry(target, number)).correct, false, `Task ${number}: reject ${JSON.stringify(value)}`);
    }
    if (number === 11) {
      await check(target, number, '123', touch);
      assert.equal((await entry(target, number)).correct, false);
      assert.doesNotMatch(await target.locator('#feedback-11').innerText(), /позиций|порядок|парабол|гипербол/i,
        'Wrong-answer feedback must not silently provide mathematical help');
      assert.equal((await entry(target, number)).hinted, false);
      assert.equal(await target.locator('#hint-11').isVisible(), false);
      await press(target, '[data-action="hint"][data-number="11"]', touch);
      assert.match(await target.locator('#hint-11').innerText(), /Совпало позиций: 0 из 3/);
      assert.equal((await entry(target, number)).hinted, true, 'Position diagnostic requires explicit help provenance');
    }
    await check(target, number, correct, touch);
    assert.equal((await entry(target, number)).correct, true, `Task ${number}: expected valid answer`);
    if (number === 11) assert.match(await target.locator('#feedback-11').innerText(), /с подсказкой/);
  }
  await check(target, 4, '6 0', touch);
  assert.equal((await entry(target, 4)).correct, false, 'Do not concatenate internal whitespace');
  await check(target, 4, '6 0/1', touch);
  assert.equal((await entry(target, 4)).correct, false, 'Do not silently parse mixed notation');
  await check(target, 4, ' 6 ', touch);
  assert.equal((await entry(target, 4)).correct, true);
  const before = await score(target);
  await press(target, '#check-all', touch);
  assert.deepEqual(await score(target), before, 'Global recheck cannot inflate score');
  assert.equal(await target.locator('#feedback-5').getAttribute('data-status'), 'blank', 'Blank remains unanswered');
  assert.equal((await entry(target, 5)).wrong, 0, 'Blank recheck is not a wrong attempt');
  assert.equal((await entry(target, 5)).correct, false, 'Blank recheck earns no credit');
  await mode(target, false, touch);
  await check(target, 6, '0', touch);
  assert.doesNotMatch(await target.locator('#feedback-6').innerText(), /знаков|разряд|запят|перемнож|1296|12[,.]96/i,
    'Exam wrong-answer feedback contains no mathematical hint or answer');
  assert.equal((await entry(target, 6)).hinted, false);
  assert.equal(await target.locator('#hint-6').isVisible(), false);
  const independentBeforeKeyboard = (await score(target)).independent;
  await focus(target, '#answer-6'); await focus(target, '[data-action="check"][data-number="6"]');
  await target.locator('#answer-6').fill('12,96');
  await target.locator('[data-action="check"][data-number="6"]').focus();
  await page.keyboard.press('Enter');
  assert.equal((await entry(target, 6)).correct, true, 'Keyboard activates check');
  assert.equal((await entry(target, 6)).hinted, false);
  assert.equal((await score(target)).independent, independentBeforeKeyboard + 1,
    'Wrong then correct without asking for help earns independent credit');
  await mode(target, true, touch);
  const cancelBefore = await stored(target);
  await press(target, '#reset', touch); await press(target, '#cancel-reset', touch);
  assert.deepEqual(await stored(target), cancelBefore, 'Cancel reset preserves complete state');
  await press(target, '[data-action="reveal"][data-number="22"]', touch);
  assert.equal(await target.locator('#solution-22 svg').isVisible(), true, 'Construction graph is available only after explicit reveal');
  await diagrams(target, label + ' expanded solution graph');
  if (label === 'desktop' || label === 'mobile360') {
    for (const number of [11, 15]) await target.locator(`#task-${number}`).screenshot({
      path: path.join(evidenceDir, `${label}-task-${number}.png`)
    });
    await press(target, '[data-action="reveal"][data-number="25"]', touch);
    await target.locator('#task-25').screenshot({ path: path.join(evidenceDir, `${label}-task-25-solution.png`) });
  }
  await assertForeignStorage(target);
  evidence.surfaces.push(label);
  progress(label + ' flows passed');
}

async function printCheck(page, modeName = 'exam') {
  await page.evaluate(() => { window.browserTestPrinted = false; window.print = () => { window.browserTestPrinted = true; }; });
  await page.locator('#print').click();
  assert.equal(await page.evaluate(() => window.browserTestPrinted), true, 'Print button invokes browser printing');
  await page.emulateMedia({ media: 'print' });
  const result = await page.evaluate(() => ({
    controls: [...document.querySelectorAll('button,input,textarea,select')].filter(element => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden').length,
    tasks: [...document.querySelectorAll('article.task')].filter(element => element.getClientRects().length).length,
    solutions: [...document.querySelectorAll('[id^="solution-"],[id^="hint-"]')].filter(element => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden').length
  }));
  assert.equal(result.controls, 0, 'Print contains no interactive controls');
  assert.equal(result.tasks, 25, 'All tasks remain printable');
  assert.equal(result.solutions, 0, `${modeName} print does not expose hints or solutions`);
  evidence.printableTasks = result.tasks;
  await page.pdf({ path: path.join(evidenceDir, `variant-print-${modeName}.pdf`), format: 'A4', printBackground: true });
  await page.emulateMedia({ media: 'screen' });
}

try {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  origin = `http://127.0.0.1:${server.address().port}`;
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || process.env.BROWSER_EXECUTABLE_PATH;
  try { browser = await chromium.launch({ headless: true, timeout: 30000, ...(executablePath ? { executablePath } : { channel: 'msedge' }) }); }
  catch (error) { throw new Error(`System Edge/Chromium unavailable; set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH. ${error.message}`); }
  for (const [label, width, height, touch] of [['desktop', 1280, 900, false], ['mobile390', 390, 844, true], ['mobile360', 360, 844, true]]) {
    progress(label + ' context start');
    const ctx = await context({ viewport: { width, height }, isMobile: touch, hasTouch: touch });
    try {
      const page = await ctx.newPage(); observe(page, label);
      assert.equal((await page.goto(origin + trainerPath, { waitUntil: 'load' })).status(), 200);
      await flows(page, page, label, touch);
      const before = await stored(page), beforeScore = await score(page);
      await page.reload({ waitUntil: 'load' });
      assert.deepEqual(await stored(page), before, 'Reload retains validated state');
      assert.deepEqual(await score(page), beforeScore, 'Reload retains score/provenance');
      assert.equal(await page.locator('#work-20').inputValue(), 'Моя модель: x не равен 0; исследую знаки.');
      assert.equal((await entry(page, 1)).wrong, 1);
      const tab = await ctx.newPage(); observe(tab, label + '-new-tab');
      await tab.goto(origin + trainerPath, { waitUntil: 'load' });
      assert.deepEqual(await score(tab), beforeScore, 'New tab restores stored progress'); await tab.close();
      if (!touch) await printCheck(page, 'review');
      if (label === 'desktop' || label === 'mobile390') {
        await reset(page, touch); await provenance(page, ctx, label, touch);
      }
      await reset(page, touch); await fullVariant(page, touch); await reset(page, touch); await assertForeignStorage(page);
      await mode(page, false, touch);
      await page.screenshot({ path: path.join(evidenceDir, label + '.png'), fullPage: true });
      if (!touch) await printCheck(page);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const motion = await page.locator('#mode-review').evaluate(element => ({
        duration: getComputedStyle(element).transitionDuration, animation: getComputedStyle(element).animationDuration
      }));
      assert.ok([...motion.duration.split(','), ...motion.animation.split(',')].every(value => parseFloat(value) <= 0.001), 'Reduced motion');
    } catch (error) { failed(error, label); }
    finally { await closeWithin(ctx, label + ' context'); }
  }
  progress('board context start');
  const boardCtx = await context({ viewport: { width: 1280, height: 900 } });
  try {
    const board = await boardCtx.newPage(); observe(board, 'board');
    await board.goto(origin + '/trainers/trainer-board.html?server=' + encodeURIComponent(origin), { waitUntil: 'load' });
    await board.locator('#trainerUrl').fill(trainerPath); await board.locator('#openTrainer').click();
    const frame = await (await board.locator('#trainerFrame').elementHandle()).contentFrame();
    await frame.waitForURL(url => url.pathname === trainerPath, { waitUntil: 'load' });
    await frame.locator('#answer-1').waitFor();
    await flows(board, frame, 'actual-board-manual-iframe', false);
    await reset(frame); await fullVariant(frame); await reset(frame); await assertForeignStorage(frame);
  } catch (error) { failed(error, 'board'); }
  finally { await closeWithin(boardCtx, 'board context'); }
  progress('offline file context start');
  const fileCtx = await context({ viewport: { width: 360, height: 844 }, isMobile: true, hasTouch: true, offline: true });
  try {
    const page = await fileCtx.newPage(); observe(page, 'file-offline');
    await page.goto(pathToFileURL(path.join(root, trainerPath.slice(1))).href, { waitUntil: 'load' });
    await flows(page, page, 'file-offline360', true);
    await reset(page, true); await fullVariant(page, true); await assertForeignStorage(page);
  } catch (error) { failed(error, 'offline file'); }
  finally { await closeWithin(fileCtx, 'offline file context'); }
  progress('malformed storage context start');
  const badCtx = await context({ viewport: { width: 1280, height: 900 } }, '{malformed');
  try {
    const page = await badCtx.newPage(); observe(page, 'malformed-storage');
    await page.goto(origin + trainerPath, { waitUntil: 'load' });
    assert.deepEqual(await score(page), { independent: 0, assisted: 0, part1: 0, manual: 0, total: 0 });
    await check(page, 1, '205'); assert.equal((await score(page)).independent, 1); await assertForeignStorage(page);
    evidence.rejectedSavedStates++;
  } catch (error) { failed(error, 'malformed storage'); }
  finally { await closeWithin(badCtx, 'malformed storage context'); }
  const invalidStates = [
    ['old schema in current key', state => { state.version = 1; for (const item of state.entries) delete item.credit; }],
    ['forged independent wrong answer', state => Object.assign(state.entries[0], { input: '999', checked: true, correct: true, credit: 'independent' })],
    ['assisted without opened hint', state => Object.assign(state.entries[0], { input: '205', checked: true, correct: true, credit: 'assisted' })],
    ['revealed without opened solution', state => Object.assign(state.entries[0], { input: '205', checked: true, correct: true, credit: 'revealed' })],
    ['credit before checking', state => Object.assign(state.entries[0], { input: '205', credit: 'independent' })],
    ['Part 2 automatic credit', state => Object.assign(state.entries[19], { manual: 2, credit: 'independent' })]
  ];
  for (const [label, forge] of invalidStates) {
    progress(label + ' context start');
    const payload = { version: 2, mode: 'exam', entries: Array.from({ length: 25 }, () => ({
      input: '', wrong: 0, checked: false, correct: false, hinted: false, revealed: false, credit: null, manual: null
    })) };
    forge(payload);
    const forgedCtx = await context({ viewport: { width: 1280, height: 900 } }, JSON.stringify(payload));
    try {
      const page = await forgedCtx.newPage(); observe(page, label);
      await page.goto(origin + trainerPath, { waitUntil: 'load' });
      assert.deepEqual(await score(page), { independent: 0, assisted: 0, part1: 0, manual: 0, total: 0 }, `${label}: fail closed`);
      assert.equal(await page.locator('#answer-1').inputValue(), '', `${label}: blank input restored`);
      await check(page, 1, '205');
      assert.deepEqual(await score(page), { independent: 1, assisted: 0, part1: 1, manual: 0, total: 1 });
      assert.equal((await stored(page)).version, 2);
      assert.equal((await entry(page, 1)).credit, 'independent');
      await assertForeignStorage(page); evidence.rejectedSavedStates++;
    } catch (error) { failed(error, label); }
    finally { await closeWithin(forgedCtx, label + ' context'); }
  }
  progress('blocked storage context start');
  const blockedCtx = await context({ viewport: { width: 1280, height: 900 } }, undefined, true);
  try {
    const page = await blockedCtx.newPage(); observe(page, 'blocked-storage');
    await page.goto(origin + trainerPath, { waitUntil: 'load' });
    assert.match(await page.locator('#storage-notice').innerText(), /недоступно[\s\S]*перезагрузки/i);
    await check(page, 1, '205');
    assert.equal((await score(page)).independent, 1, 'Blocked storage does not prevent solving');
    await page.reload({ waitUntil: 'load' });
    assert.equal((await score(page)).independent, 0, 'Blocked storage correctly discloses in-memory progress');
    assert.match(await page.locator('#storage-notice').innerText(), /недоступно/i);
  } catch (error) { failed(error, 'blocked storage'); }
  finally { await closeWithin(blockedCtx, 'blocked storage context'); }
  assert.deepEqual(errors, [], 'No console/page/request errors');
  assert.deepEqual(externalRequests, [], 'No external requests');
} catch (error) { failure = error; }
finally {
  progress('browser/server cleanup start');
  try { if (browser) await closeWithin(browser, 'browser'); }
  catch (error) { failure = failure ? new AggregateError([failure, error], 'Gate and browser cleanup failed') : error; }
  finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); progress('server closed'); }
}
if (failure) throw failure;
fs.writeFileSync(path.join(evidenceDir, 'browser-results.json'), JSON.stringify(evidence, null, 2));
console.log(JSON.stringify(evidence));
console.log('OGE_2027_AUTHOR_ANALOGUE_1_BROWSER_OK');
