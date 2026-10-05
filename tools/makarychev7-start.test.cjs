'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');

const root = path.resolve(__dirname, '..');
const legacyIds = ['alg-rational', 'alg-order', 'alg-variable', 'alg-compare', 'alg-properties', 'alg-identity'];
const number = value => Array.isArray(value) ? value.map(number) : value && typeof value === 'object' ? value.n / value.d : value;
const answerText = value => Array.isArray(value) ? value.map(answerText).join(';') : value && typeof value === 'object' ? `${value.n}/${value.d}` : String(value);
function same(actual, expected, label) {
  if (typeof actual === 'number' && typeof expected === 'number') assert.ok(Math.abs(actual - expected) < 1e-9, `${label}: ${actual} != ${expected}`);
  else assert.deepEqual(actual, expected, label);
}

// Load the published script order, without app.js or a DOM. This catches a
// missing installer/script tag as well as checks on an isolated math module.
const world = { console, URL, URLSearchParams, structuredClone };
world.window = world;
vm.createContext(world);
const html = fs.readFileSync(path.join(root, 'school/index.html'), 'utf8');
for (const match of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)) {
  const filename = match[1].split('?')[0];
  if (filename === 'app.js') continue;
  assert.ok(!filename.includes('..') && !filename.includes('://'), 'Only fixed local school scripts are loaded');
  vm.runInContext(fs.readFileSync(path.join(root, 'school', filename), 'utf8'), world, { filename });
}
const C = world.WorkshopCurriculum, M = world.WorkshopMath, S = world.WorkshopState;
assert.ok(C && M && S);

function legacyOracle(id, task) {
  const p = task.audit, z = number(task.answer);
  const check = (actual, expected) => same(actual, expected, `${id}: ${task.prompt}`);
  if (id === 'alg-rational') {
    check(z, p.v === 0 ? p.n / 4 : p.v === 1 ? (p.n + p.m) / 4 : p.n / p.d);
  } else if (id === 'alg-order') {
    check(z, p.v === 0 ? (p.a * p.b + p.c) - p.a * (p.b - 1) : p.v === 1 ? p.a * p.b / p.b * p.c : (-p.a) ** 2 - -(p.a ** 2));
  } else if (id === 'alg-variable') {
    check(z, p.v === 0 ? p.a * p.x + p.b : p.v === 1 ? p.a * (p.x - p.b) + p.x : p.b + p.a * p.c);
  } else if (id === 'alg-compare') {
    const left = p.a * p.x + p.b, right = (p.a - 1) * p.x + p.c;
    check(z, left < right ? '<' : left > right ? '>' : '=');
  } else if (id === 'alg-properties') {
    for (const x of [-9, 0, 4]) check(z[0] * x + z[1], p.k * (x + p.d));
  } else if (id === 'alg-identity') {
    if (p.v === 1) { check(z, 'нет'); assert.notEqual(p.a * p.b, p.b); }
    else for (const x of [-9, 0, 4]) check(z[0] * x + z[1], p.v === 0 ? p.a * x + p.b - p.c * x : p.a * x - (p.b * x - p.c));
  } else assert.fail(`Missing independent legacy oracle: ${id}`);
}

const newKeys = ['decimals', 'signed-products', 'calculation-plan', 'expression-language', 'allowed-values',
  'compare-difference', 'convenient-calculation', 'common-factor', 'collect-like', 'identity-check',
  'equation-root', 'equation-balance', 'equation-transfer', 'equation-brackets', 'equation-fractions',
  'equation-cases', 'word-parts', 'word-motion'];
const fixedVideos = new Set(['linear-equation', 'adjacent-angles', 'negative-numbers', 'fractions', 'brackets', 'proportions', 'percentages',
  'numeric-expressions', 'variable-expressions', 'compare-expressions', 'arithmetic-properties', 'identities',
  'equation-roots', 'linear-cases', 'equation-word-problems']);
const P = C.pathById['makarychev7-start'];
assert.ok(P, 'The published page installs the grade 7 foundation course');
assert.equal(P.ids.length, 24);
assert.equal(P.stages.length, 9);
assert.equal(new Set(P.ids).size, 24);
assert.deepEqual(Array.from(P.ids).sort(), [...legacyIds, ...newKeys.map(key => `m7f-${key}`)].sort());
assert.equal(new Set(C.lessons.map(lesson => lesson.id)).size, C.lessons.length, 'Installers do not duplicate lessons');

function foundationOracle(task) {
  const p = task.audit, key = p.key, z = number(task.answer), got = task.steps.map(part => number(part.answer));
  const check = (actual, expected) => same(actual, expected, `${key}: ${task.prompt}`);
  let steps;
  switch (key) {
    case 'decimals':
      check(z * p.d, p.n);
      steps = p.v === 2 ? [1, 9] : [p.v === 0 ? 10 : 100, p.n * (p.v === 0 ? 10 : 100) / p.d]; break;
    case 'signed-products':
      check(z, p.v === 2 ? -p.left : p.left * p.right);
      steps = [p.right < 0 ? '+' : '−', p.v === 2 ? -p.left : Math.abs(p.left * p.right)]; break;
    case 'calculation-plan':
      if (p.v === 0) { check(z + p.a * (p.b - 1), p.n); steps = [p.b - 1, p.a * (p.b - 1)]; }
      else if (p.v === 1) { check(z, p.a * p.b / p.b * p.c); steps = [p.a * p.b / p.b, p.a * p.b / p.b * p.c]; }
      else { check(z + p.a * p.c, (p.a + p.b) * p.c); steps = [p.a + p.b, (p.a + p.b) * p.c]; } break;
    case 'expression-language':
      if (p.v === 0) { check(z - p.b, p.a * p.x); steps = [p.a * p.x, 1]; }
      else if (p.v === 1) { check(z + p.b, p.a * p.x); steps = [p.a * p.x, p.b]; }
      else { check(z, p.x + p.b + p.x + p.b); steps = [p.x + p.b, 2]; } break;
    case 'allowed-values':
      check(p.k * z + p.offset, 0); assert.notEqual(p.k, 0); steps = [0, -p.offset]; break;
    case 'compare-difference': {
      const a = p.a * p.x + p.c, b = (p.a - 1) * p.x + p.c + p.b;
      check(z, a < b ? '<' : a > b ? '>' : '='); steps = [a, b, a - b]; break;
    }
    case 'convenient-calculation':
      check(z, p.v === 0 ? (10 * p.a + 1) * p.b : p.v === 1 ? (10 * p.a - 1) * p.b : 10 * p.a + p.c + p.b - p.c);
      steps = [p.v === 2 ? 10 * p.a : 10 * p.a * p.b, p.b]; break;
    case 'common-factor':
      for (const x of [-9, 0, 4]) check(p.k * (z[0] * x + z[1]), p.k * x + p.k * p.d);
      steps = [1, p.d]; break;
    case 'collect-like':
      for (const x of [-9, 0, 4]) check(z[0] * x + z[1], p.v === 0 ? p.a * x + p.b * x + p.c : p.v === 1 ? p.a * x - (p.b * x - p.c) : p.a * x - (p.b * x + p.c));
      steps = [p.v === 0 ? p.a + p.b : p.a - p.b, p.v === 2 ? -p.c : p.c]; break;
    case 'identity-check': {
      const holds = [-9, 0, 4].every(x => p.a * (x + p.b) === p.a * x + p.d);
      check(z, holds ? 'да' : 'нет'); steps = [p.a * p.b, p.a * p.b - p.d]; break;
    }
    case 'equation-root':
      check(z, p.a * p.probe + p.b === p.n ? 'да' : 'нет'); steps = [p.a * p.probe + p.b, p.n]; break;
    case 'equation-balance':
      check(p.k * z + p.offset, p.n); assert.notEqual(p.k, 0); steps = [p.n - p.offset, (p.n - p.offset) / p.k]; break;
    case 'equation-transfer':
      check(p.k * z + p.left, p.c * z + p.n); assert.notEqual(p.k, p.c); steps = [p.k - p.c, p.n - p.left, (p.n - p.left) / (p.k - p.c)]; break;
    case 'equation-brackets':
      check(p.k * (z + p.d), p.c * z + p.r); assert.notEqual(p.k, p.c); steps = [p.k * p.d, p.k - p.c, p.r - p.k * p.d]; break;
    case 'equation-fractions':
      if (p.v === 0) { check((z + p.b) / p.a, p.c); steps = [p.a * p.c, p.a * p.c - p.b]; }
      else if (p.v === 1) { check(z / p.a + p.b, p.b + p.c); steps = [p.c, p.c * p.a]; }
      else { check(p.a / 10 * z, p.b / 10); steps = [p.a, p.b]; } break;
    case 'equation-cases':
      check(String(z), p.a !== p.k ? '1' : p.b === p.n ? 'все' : 'нет'); steps = [p.a - p.k, p.n - p.b]; break;
    case 'word-parts':
      assert.ok(z > 0 && Number.isInteger(z), 'The story has a positive whole-number quantity');
      if (p.v === 0) { check(z + (z + p.b), p.total); steps = [2, p.total - p.b]; }
      else if (p.v === 1) { check(z + p.a * z, p.total); steps = [p.a + 1, p.total / (p.a + 1)]; }
      else { check(z - p.move, z / p.a + p.move); assert.ok(z > p.move && Number.isInteger(z / p.a), 'The transfer leaves valid whole-number counts'); steps = [p.a - 1, 2 * p.move, 2 * p.move / (p.a - 1)]; } break;
    case 'word-motion':
      if (p.v === 0) { check(p.fast * z + p.slow * z, p.total); steps = [p.fast + p.slow, p.total / (p.fast + p.slow)]; }
      else if (p.v === 1) { check(p.fast * z - p.slow * z, p.gap); steps = [p.fast - p.slow, p.gap / (p.fast - p.slow)]; }
      else { check(z * p.hours, p.fast * p.hours); steps = [p.hours, p.fast]; } break;
    default: assert.fail(`Missing independent foundation oracle: ${key}`);
  }
  assert.equal(got.length, steps.length, `${key}: all intermediate steps are audited`);
  got.forEach((value, i) => check(value, steps[i]));
}

function formatted(part) {
  const result = answerText(part.answer);
  if (part.answerFormat !== 'decimal') return result;
  const value = number(part.answer);
  return Number.isInteger(value) ? `${value},0` : String(value).replace('.', ',');
}
let cases = 0, stepsChecked = 0;
for (const id of P.ids) {
  const lesson = C.byId[id];
  assert.ok(lesson && lesson.detail.length >= 3 && lesson.explanation.length > 40, `${id}: useful explanation`);
  assert.ok(fixedVideos.has(lesson.video), `${id}: a real fixed video ID, not a broken alias (${lesson.video})`);
  for (const prerequisite of lesson.requires) assert.ok(C.byId[prerequisite], `${id}: known prerequisite ${prerequisite}`);
  for (const seed of [...Array.from({ length: 90 }, (_, index) => index), 999999, 1000000]) {
    const task = JSON.parse(JSON.stringify(M.generate(id, seed)));
    if (legacyIds.includes(id)) legacyOracle(id, task); else foundationOracle(task);
    for (const part of [...task.steps, task]) {
      assert.ok(M.accepts(formatted(part), part), `${id}: rejects correct ${formatted(part)}`);
      assert.equal(M.accepts('не знаю', part), false, `${id}: rejects unrelated text`);
      assert.doesNotMatch(part.prompt + formatted(part), /undefined|NaN|Infinity/, `${id}: finite task data`);
      if (typeof number(part.answer) === 'number') assert.equal(M.accepts(String(number(part.answer) + 1), part), false, `${id}: rejects adjacent wrong number`);
      stepsChecked++;
    }
    cases++;
  }
}
// Preserve legacy results, and distinguish assisted work from independent work.
const progress = S.blank();
S.result(progress, { skill: 'alg-order', mode: 'check', correct: true, attempt: 1, assisted: false, exposed: false, time: 1, fingerprint: 'legacy-correct' });
S.result(progress, { skill: 'm7f-equation-transfer', mode: 'check', correct: true, attempt: 1, assisted: true, exposed: false, time: 2, fingerprint: 'assisted-correct' });
for (const fingerprint of ['independent-a', 'independent-a', 'independent-b']) S.result(progress, { skill: 'm7f-equation-transfer', mode: 'check', correct: true, attempt: 1, assisted: false, exposed: false, time: 3, fingerprint });
const restored = S.load({ getItem: () => JSON.stringify(progress) }, C.lessons.map(lesson => lesson.id));
assert.equal(!!restored.blocked, false);
assert.equal(restored.state.skills['alg-order'].checks.length, 1);
assert.equal(restored.state.skills['m7f-equation-transfer'].checks.length, 2, 'Duplicate or assisted submissions do not create extra independent successes');
console.log(`Mathematics: ${cases} independently checked tasks, ${stepsChecked} answer/step acceptance checks; existing progress preserved.`);

async function browserChecks() {
  const modules = process.env.NODE_PATH?.split(path.delimiter)[0] || process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || path.join(root, 'video-worker/node_modules');
  const { chromium } = createRequire(path.join(modules, 'package.json'))('playwright');
  const artifacts = process.env.M7_QA_ARTIFACT_DIR ? path.resolve(process.env.M7_QA_ARTIFACT_DIR) : await fsp.mkdtemp(path.join(os.tmpdir(), 'makarychev7-start-'));
  await fsp.mkdir(artifacts, { recursive: true });
  const errors = [], report = { cases, stepsChecked, lessons: [], layouts: [], progressRestored: false, externalRequests: [] };
  const server = http.createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
      if (pathname === '/favicon.ico') { response.writeHead(204); response.end(); return; }
      const file = path.resolve(root, `.${pathname}`);
      if (!file.startsWith(root + path.sep) || request.method !== 'GET') { response.writeHead(403); response.end(); return; }
      const body = await fsp.readFile(file);
      const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.mp4': 'video/mp4' };
      response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }); response.end(body);
    } catch { response.writeHead(404); response.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, headless: true, chromiumSandbox: false });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
    await context.route('**/*', route => {
      const url = route.request().url();
      if (url.startsWith('data:') || url.startsWith('blob:') || new URL(url).origin === origin) return route.continue();
      report.externalRequests.push(url); return route.abort();
    });
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    page.on('pageerror', error => errors.push(error.message));
    const go = async route => { await page.goto(`${origin}/school/index.html?course=makarychev7-start#${route}`); await page.locator('main h1').waitFor(); };
    const currentTask = () => page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem(WorkshopState.KEY));
      return WorkshopMath.generate(state.last.skill, state.last.seed);
    });
    const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem(WorkshopState.KEY)));
    const submit = async value => { await page.locator('#answer').fill(value); await page.locator('#answer-form button').click(); };
    await go('course/makarychev7-start');
    assert.match(await page.locator('main').innerText(), /24/);
    assert.equal(await page.locator('[data-cmd="learn"]').count(), 25, 'Course has every lesson plus the continue action');
    await page.screenshot({ path: path.join(artifacts, 'course-desktop.png'), fullPage: true });

    for (const id of P.ids) {
      await go(`lesson/${id}`);
      const task = await currentTask();
      if (legacyIds.includes(id)) legacyOracle(id, task); else foundationOracle(task);
      assert.equal(await page.locator('video[controls]').count(), 1, `${id}: visible lesson player`);
      assert.match(await page.locator('video').getAttribute('src'), new RegExp(`/media/${C.byId[id].video}\\.mp4\\?v=`));
      assert.equal(await page.locator('video').evaluate(video => video.muted && !video.autoplay), true);
      await submit('не знаю');
      assert.equal(await page.locator('.feedback.error').count(), 1, `${id}: incorrect input gets feedback`);
      await page.locator('[data-cmd="hint"]').click();
      assert.ok((await page.locator('#help').innerText()).length > 50, `${id}: meaningful hint is reachable`);
      if (id.startsWith('m7f-')) {
        const picture = page.locator('#model .m7-picture');
        const initial = await picture.innerHTML();
        const slider = page.locator('#model input[type="range"]');
        await slider.fill('3'); await slider.dispatchEvent('input');
        assert.notEqual(await picture.innerHTML(), initial, `${id}: the model responds to input`);
        await page.locator('#model .m7-next').click();
        assert.equal(await page.locator('#model .m7-prev').isDisabled(), false, `${id}: model steps can be revisited`);
      }
      const parts = [...task.steps, task];
      for (let index = 0; index < parts.length; index++) {
        await submit(formatted(parts[index]));
        assert.equal(await page.locator('.feedback.error').count(), 0, `${id}: guided step ${index + 1}`);
        if (index < parts.length - 1) {
          await page.locator('[data-cmd="next"]').click();
          assert.equal(await page.locator('.v6-history[open] li').count(), index + 1, `${id}: completed steps remain visible`);
        }
      }
      const state = await saved(), last = state.events.at(-1);
      assert.equal(last.skill, id); assert.equal(last.correct, true); assert.equal(last.assisted, true);
      assert.equal(last.independent, false, 'Guided or assisted work never becomes an independent success');
      report.lessons.push({ id, guidedSteps: parts.length, hint: true, model: id.startsWith('m7f-'), video: C.byId[id].video });
    }

    // Real UI independent checks must survive a page reload, alongside the old
    // lesson evidence. Merely viewing a clip must add no result to the journal.
    const id = 'm7f-equation-transfer';
    await go(`lesson/${id}`);
    await page.locator('[data-cmd="mode"][data-value="check"]').click();
    let task = await currentTask(); foundationOracle(task); await submit(formatted(task));
    let state = await saved(); assert.equal(state.events.at(-1).independent, true);
    await page.locator('[data-cmd="next"]').click();
    task = await currentTask(); foundationOracle(task); await submit(formatted(task));
    state = await saved(); assert.equal(state.skills[id].checks.length, 2);
    const journal = JSON.stringify(state.events), oldEvidence = JSON.stringify(state.skills['alg-rational']);
    await page.reload(); await page.locator('#answer').waitFor();
    state = await saved();
    assert.equal(JSON.stringify(state.events), journal, 'Reloading or reopening video creates no learning result');
    assert.equal(state.skills[id].checks.length, 2);
    assert.equal(JSON.stringify(state.skills['alg-rational']), oldEvidence, 'Legacy results remain unchanged');
    report.progressRestored = true;

    // A detour to an earlier topic preserves the selected step and draft answer.
    await go(`lesson/${id}`);
    task = await currentTask(); await submit(formatted(task.steps[0])); await page.locator('[data-cmd="next"]').click();
    await page.locator('#answer').fill('123,45');
    const condition = await page.locator('#task-panel .question').textContent();
    await page.locator('[data-cmd="prerequisite"]').first().click();
    await page.locator('[data-cmd="return"]').click();
    assert.equal(await page.locator('#answer').inputValue(), '123,45');
    assert.equal(await page.locator('.steps .current').textContent(), '2');
    assert.equal(await page.locator('#task-panel .question').textContent(), condition);
    report.prerequisiteReturn = true;

    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      for (const id of P.ids) {
        await go(`lesson/${id}`);
        const bounds = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth + 1,
          video: (() => { const r = document.querySelector('video').getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1 && r.width > 150; })() }));
        assert.equal(bounds.overflow, false, `${id}: ${width}px horizontal overflow`);
        assert.equal(bounds.video, true, `${id}: ${width}px video fits screen`);
      }
      await go('lesson/m7f-equation-transfer');
      await page.locator('video').scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(artifacts, `lesson-${width}.png`) });
      report.layouts.push({ width, lessons: P.ids.length, overflow: false });
    }
    assert.deepEqual(errors, []); assert.deepEqual(report.externalRequests, []);
    report.passed = true;
    console.log(`MAKARYCHEV7_START_OK: ${cases} math cases; 24 guided browser journeys; 48 layouts; hints, interactive models and persisted results.`);
  } catch (error) { report.passed = false; report.failure = error.message; throw error; }
  finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
    await fsp.writeFile(path.join(artifacts, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    if (!process.env.M7_QA_ARTIFACT_DIR) await fsp.rm(artifacts, { recursive: true, force: true });
  }
}
browserChecks().catch(error => { console.error(error); process.exitCode = 1; });
