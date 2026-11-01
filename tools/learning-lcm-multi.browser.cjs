'use strict';

// A real two-origin cabinet/trainer session against an isolated SQLite store.
// Identities, passwords and saved work are synthetic; public requests are blocked.
// Run with NODE_PATH pointing at Playwright and, when needed,
// CHROMIUM_EXECUTABLE_PATH pointing at the installed Chromium executable.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const express = createRequire(path.resolve(__dirname, '../board-server/package.json'))('express');
const { chromium } = require('playwright');
const { LearningStore } = require('../board-server/learning-store');
const { createLearningApi } = require('../board-server/learning-api');
const { createTeachingRouter } = require('../board-server/learning-teaching');
const { hashPassword } = require('../board-server/learning-auth');
const contracts = require('../board-server/learning-contracts');
const manifest = require('../learning/vilenkin6-textbook-catalog');

const root = path.resolve(__dirname, '..');
const originalUnits = ['A', 'B', 'C', 'D'].flatMap(part =>
  require('../courses/vilenkin-6-part-1/textbook-data/units-' + part + '.json'));
const originalTasks = originalUnits.flatMap(unit => unit.tasks);
const supplement = require('../courses/vilenkin-6-part-1/textbook-data/supplement-lcm-multi.json');
const unit = supplement.find(item => item.id === 1008);
const password = 'Synthetic-LCM-Browser-2026';
const oldMarker = 'Индивидуальный маршрут: только НОК и НОД.';
const standaloneKey = 'mathexam-vilenkin6-textbook-2024-v1';
const artifactDir = path.resolve(process.env.LCM_ARTIFACT_DIR || '/tmp/mathexam-lcm-qa');
const sourcePaths = [
  'learning/app.js', 'learning/index.html', 'learning/style.css', 'learning/assistant.css',
  'learning/vilenkin6-textbook-course.js', 'learning/vilenkin6-textbook-course.css',
  'learning/vilenkin6-textbook-helper.js', 'learning/vilenkin6-textbook-catalog.js',
  'courses/vilenkin-6-part-1/textbook-course.js', 'courses/vilenkin-6-part-1/textbook-course.css',
  'courses/vilenkin-6-part-1/textbook-learning-contracts.js',
  'courses/vilenkin-6-part-1/textbook-data/supplement-lcm-multi.json',
  'tools/learning-lcm-multi.browser.cjs'
];
const sourceHashes = () => Object.fromEntries(sourcePaths.map(file => [file,
  crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')]));
const uuid = () => crypto.randomUUID();
const answerText = item => String(Array.isArray(item.answer) ? item.answer[0] : item.answer);
const otherMethod = task => unit.tasks.find(other => task.alternativeId
  ? other.id === task.alternativeId
  : other.stage === task.stage && other.groupId === task.groupId && other.method !== task.method);
const attemptId = page => new URLSearchParams(new URL(page.url()).hash.slice(1)).get('attempt');
const listen = app => new Promise((resolve, reject) => {
  const server = app.listen(0, '127.0.0.1', () => resolve(server));
  server.on('error', reject);
});
const close = server => server ? new Promise(resolve => {
  server.closeAllConnections();
  server.close(resolve);
}) : Promise.resolve();

async function until(predicate, label) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error('Timed out: ' + label);
}

// This oracle searches positive multiples; it does not reuse the trainer's
// checker or the data generator's gcd/factorization implementation.
function leastCommonMultiple(numbers) {
  const largest = Math.max(...numbers);
  for (let multiple = largest; multiple <= 1000000; multiple += largest) {
    if (numbers.every(number => multiple % number === 0)) return multiple;
  }
  throw new Error('LCM oracle limit exceeded: ' + numbers.join(', '));
}

function primeFactors(number) {
  const factors = [];
  for (let divisor = 2; divisor <= number; divisor++) {
    while (number % divisor === 0) {
      factors.push(divisor);
      number /= divisor;
    }
  }
  return factors;
}

function reviewData() {
  assert.equal(originalTasks.length, 194, 'The original textbook bank remains intact');
  assert.equal(supplement.length, 1);
  assert.equal(unit.kind, 'author-supplement');
  assert.equal(unit.relatedPoint, 8);
  assert.equal(unit.tasks.length, 44);
  assert.equal(unit.tasks.filter(task => task.role === 'learn').length, 38);
  assert.equal(unit.tasks.filter(task => task.role === 'check').length, 6);
  assert.equal(manifest.length, originalTasks.length + unit.tasks.length);
  assert.equal(new Set(unit.tasks.map(task => task.id)).size, unit.tasks.length);
  const knownConditions = new Set(unit.tasks.filter(task => task.role === 'learn')
    .map(task => task.numbers.slice().sort((a, b) => a - b).join(',')));
  const checkConditions = unit.tasks.filter(task => task.role === 'check')
    .map(task => task.numbers.slice().sort((a, b) => a - b).join(','));
  assert.equal(new Set(checkConditions).size, checkConditions.length, 'Every independent check is a distinct condition');
  for (const task of unit.tasks) {
    assert(task.numbers.length >= 3 && task.numbers.length <= 5);
    assert(task.numbers.every(number => Number.isInteger(number) && number > 0));
    assert.equal(task.source.kind, 'author');
    assert.equal(task.source.relatedPoint, 8);
    assert.equal(Number(answerText(task)), leastCommonMultiple(task.numbers), task.id);
    if (task.role === 'check') {
      assert.equal(task.stage, 'check');
      assert(!knownConditions.has(task.numbers.slice().sort((a, b) => a - b).join(',')),
        task.id + ' must be an unseen condition');
    } else {
      const alternative = otherMethod(task);
      assert(alternative, task.id + ' alternative must exist');
      assert.notEqual(alternative.method, task.method);
      assert.deepEqual(alternative.numbers, task.numbers);
      assert.equal(alternative.groupId, task.groupId);
      assert.equal(alternative.role, 'learn', 'The second method is supported practice');
      if (task.stage === 'practice') assert.equal(alternative.alternativeId, task.id,
        'Practice methods must have reciprocal alternative links');
    }
    if (task.method === 'chain') {
      assert.equal(task.steps.length, task.numbers.length - 1);
      let intermediate = task.numbers[0];
      task.steps.forEach((step, index) => {
        intermediate = leastCommonMultiple([intermediate, task.numbers[index + 1]]);
        assert.equal(Number(answerText(step)), intermediate, task.id + ' step ' + index);
      });
    } else {
      assert.equal(task.method, 'factors');
      const rows = task.numbers.map(primeFactors);
      const primes = [...new Set(rows.flat())].sort((a, b) => a - b);
      assert.equal(task.steps.length, task.numbers.length + primes.length + 1);
      rows.forEach((factors, index) => {
        const step = task.steps[index];
        if (!factors.length) {
          assert.equal(step.answerType, 'integer', 'One has zero prime factors');
          assert.equal(Number(answerText(step)), 0);
        } else {
          assert.equal(step.answerType, 'prime-factors');
          assert.deepEqual(answerText(step).split(/\s*[·*×]\s*/).map(Number)
            .sort((a, b) => a - b), factors, task.id + ' factor row ' + index);
        }
      });
      primes.forEach((prime, index) => {
        const counts = rows.map(row => row.filter(value => value === prime).length);
        assert.equal(Number(answerText(task.steps[rows.length + index])), Math.max(...counts),
          task.id + ' maximum multiplicity of ' + prime);
      });
      assert.equal(Number(answerText(task.steps.at(-1))), leastCommonMultiple(task.numbers));
    }
  }
}

(async () => {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-lcm-multi-browser-'));
  const checks = [], errors = [], screenshots = [], layout = [], layoutFailures = [], exercised = [];
  const requests = [], blockedExternal = [], initialHashes = sourceHashes();
  let store, server, trainerServer, browser, page, student, inspectedPage;
  try {
    reviewData();
    checks.push('All 44 answers and every intermediate step agree with independent arithmetic; six checks use fresh conditions');
    fs.mkdirSync(artifactDir, { recursive: true });
    store = new LearningStore({ filePath: path.join(scratch, 'learning.sqlite'), contracts });
    assert(store.available, 'SQLite must be available; this test does not substitute a mock');
    const teacher = store.activate(store.bootstrap({ login: 'lcm_browser_teacher', name: 'Преподаватель проверки' }).invitationToken,
      await hashPassword(password)).account;
    async function pupil(login) {
      return store.activate(store.createStudent(teacher, { login, name: 'Учебный профиль проверки' }).invitationToken,
        await hashPassword(password, 'student')).account;
    }
    student = await pupil('lcm_browser_pupil');
    const peer = await pupil('lcm_browser_peer');
    for (const person of [student, peer]) {
      store.saveStudentProfile(teacher, person.id, { opId: uuid(), expectedVersion: 0,
        course: 'vilenkin6', goal: null, focus: 'Сохрани прежнюю работу.\n' + oldMarker });
    }
    const peerBefore = JSON.stringify(store.studentProfile(teacher, peer.id));

    // Give every existing source exercise an actual saved draft. Comparing full
    // stored records after browser work catches accidental migration/reset of old work.
    const protectedRecords = new Map();
    for (const task of originalTasks) {
      let attempt = store.createAttempt(student, { opId: uuid(), trainerId: 'vilenkin6-textbook', contentId: task.id }).attempt;
      const state = structuredClone(attempt.state);
      if (state.task.mode === 'guided') state.task.stepDrafts[0] = 'Сохранённый черновик ' + task.id;
      else state.task.draft = 'Сохранённый черновик ' + task.id;
      attempt = store.action(student, attempt.id, { opId: uuid(), expectedVersion: attempt.version,
        type: 'state', payload: { state } }).attempt;
      protectedRecords.set(attempt.id, JSON.stringify(store.getAttempt(student, attempt.id)));
    }
    const legacy = store.createAttempt(student, { opId: uuid(), trainerId: 'vilenkin6-part1', contentId: 'lesson-1' }).attempt;
    protectedRecords.set(legacy.id, JSON.stringify(store.getAttempt(student, legacy.id)));

    const trainerApp = express();
    trainerApp.use(express.static(root));
    trainerServer = await listen(trainerApp);
    const trainerOrigin = 'http://127.0.0.1:' + trainerServer.address().port;
    const app = express();
    app.use(express.json({ limit: '200kb' }));
    server = await listen(app);
    const origin = 'http://127.0.0.1:' + server.address().port;
    app.get('/api/learning/status', (_request, response) => response.json({ ...store.status(), trainerOrigin }));
    const api = createLearningApi({ store, publicOrigin: origin, secureCookies: false });
    app.use('/api/learning', api.router, createTeachingRouter(api));
    app.use(express.static(root));
    browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking'] });

    async function login(person, { holdInitialData = false } = {}) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'ru-RU', serviceWorkers: 'block' });
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if ([origin, trainerOrigin].includes(url.origin) || ['data:', 'blob:', 'about:'].includes(url.protocol)) {
          return route.continue();
        }
        blockedExternal.push(url.origin + url.pathname);
        return route.abort();
      });
      await context.addInitScript(key => {
        if (localStorage.getItem(key) === null) localStorage.setItem(key, 'public-sentinel');
      }, standaloneKey);
      let dataHeld = false, holdExpired = false, releaseInitialData;
      const initialDataGate = new Promise(resolve => { releaseInitialData = resolve; });
      if (holdInitialData) {
        await context.route(origin + '/api/learning/attempts', async route => {
          dataHeld = true;
          const timeout = setTimeout(() => { holdExpired = true; releaseInitialData(); }, 15000);
          try { await initialDataGate; await route.continue(); }
          finally { clearTimeout(timeout); }
        }, { times: 1 });
      }
      const target = await context.newPage();
      inspectedPage = target;
      target.setDefaultTimeout(15000);
      target.on('pageerror', error => errors.push(error.message));
      target.on('request', request => requests.push({ url: request.url(), method: request.method() }));
      await target.goto(origin + '/learning/#home');
      await target.locator('#auth-form [name=login]').fill(person.login);
      await target.locator('#auth-form [name=password]').fill(password);
      await target.locator('#auth-form [type=submit]').click();
      await target.locator('#navigation').waitFor();
      // The shell appears before loadCabinet finishes its initial requests.
      // Navigate only after the existing login-completion marker is cleared;
      // otherwise the late initial home route can replace the requested work.
      const ready = target.locator('#main[aria-busy="false"]').waitFor();
      // The final await below still fails on rejection; attach a handler now
      // while the independent held-data assertion is being awaited.
      ready.catch(() => {});
      if (holdInitialData) {
        try {
          await until(() => dataHeld, 'held initial cabinet data');
          assert.equal(await target.locator('#main').getAttribute('aria-busy'), 'true');
          assert.equal(await Promise.race([ready.then(() => true),
            new Promise(resolve => setTimeout(() => resolve(false), 100))]), false,
          'Login must remain pending after the navigation shell appears while cabinet data is held');
          assert.equal(holdExpired, false, 'The explicit release, not a timeout, must unblock login');
        } finally { releaseInitialData(); }
      }
      await ready;
      assert.equal(await target.evaluate(() => LearningApp.account()?.id), person.id,
        'Login completed for the intended synthetic account');
      if (holdInitialData) checks.push('Delayed initial cabinet data keeps login pending until completion before second-device navigation');
      return target;
    }

    async function managedFrame(target, { readOnly = false, selector = '#answer' } = {}) {
      inspectedPage = target;
      const child = target.frameLocator('#trainer-host iframe');
      await child.locator('body[data-managed-readonly="' + readOnly + '"]').waitFor();
      await child.locator(selector).first().waitFor();
      const loaded = target.frames().find(frame => frame.url().startsWith(trainerOrigin));
      assert(loaded, 'Wait for the trainer document and managed hydration, not only the iframe element');
      return loaded;
    }

    async function course(target = page) {
      await target.evaluate(() => LearningApp.navigate('vilenkin-textbook'));
      await target.locator('[data-vilenkin-textbook-unit="1008"]').waitFor();
      await until(() => target.locator('[data-vilenkin-textbook-start]').isEnabled(),
        'author course progress hydration');
    }

    const mutations = since => requests.slice(since).filter(request =>
      new URL(request.url).pathname.startsWith('/api/learning/') &&
      !['GET', 'HEAD', 'OPTIONS'].includes(request.method));
    const acknowledged = (target = page) => until(async () =>
      await target.locator('#save-state').textContent() === 'Все изменения сохранены',
    'saved author work acknowledgement');

    async function visibleShellReturn(target, label) {
      const link = target.locator('#workspace-vilenkin-catalog');
      await link.waitFor();
      assert.equal(await link.getAttribute('href'), '#vilenkin-textbook', label + ': real catalog destination');
      assert(await link.evaluate(element => !element.closest('details:not([open])')),
        label + ': the catalog link is not hidden among secondary actions');
      await target.evaluate(() => scrollTo(0, 0));
      const box = await link.boundingBox(), viewport = target.viewportSize();
      assert(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width + 2 &&
        box.y + box.height <= viewport.height + 2, label + ': visible catalog return: ' + JSON.stringify(box));
      assert(await link.evaluate(element => {
        const box = element.getBoundingClientRect(), hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
        return hit === element || element.contains(hit);
      }), label + ': catalog return has an unobscured hit target');
      return link;
    }

    async function returnToCatalog(target, child, id, via, label) {
      const saved = JSON.stringify(store.getAttempt(student, id));
      const history = JSON.stringify(store.history(student, id));
      const count = store.listAttempts(student).length, requestStart = requests.length;
      if (via === 'shell') await (await visibleShellReturn(target, label)).click();
      else await child.locator('[data-managed-course-catalog]').click();
      await target.locator('[data-vilenkin-textbook-course]').waitFor();
      await until(() => target.locator('[data-vilenkin-textbook-start]').isEnabled(), label + ': catalog ready');
      assert.equal(new URL(target.url()).hash, '#vilenkin-textbook', label + ': opens real cabinet catalog');
      assert.deepEqual(mutations(requestStart), [], label + ': return performs no write');
      assert.equal(JSON.stringify(store.getAttempt(student, id)), saved, label + ': saved record retained exactly');
      assert.equal(JSON.stringify(store.history(student, id)), history, label + ': history unchanged');
      assert.equal(store.listAttempts(student).length, count, label + ': no additional attempt');
    }

    async function resumeNewest(id, label) {
      const saved = JSON.stringify(store.getAttempt(student, id)), count = store.listAttempts(student).length;
      const requestStart = requests.length;
      assert.match(await page.locator('[data-vilenkin-textbook-start]').innerText(), /Продолжить/);
      await page.locator('[data-vilenkin-textbook-start]').click();
      const resumed = await managedFrame(page);
      assert.equal(attemptId(page), id, label + ': Continue selects the most recently updated unfinished work');
      assert.equal(JSON.stringify(store.getAttempt(student, id)), saved, label + ': resume preserves all saved fields');
      assert.equal(store.listAttempts(student).length, count, label + ': resume creates no duplicate');
      assert.deepEqual(mutations(requestStart), [], label + ': resume sends no write');
      return resumed;
    }

    async function sourceHint(child, id, label) {
      await acknowledged();
      const before = structuredClone(store.getAttempt(student, id));
      await page.locator('[data-source-help-launcher]').click();
      await until(() => page.locator('[data-source-help="hint"]').isEnabled(), label + ': source helper ready');
      await page.locator('[data-source-help="hint"]').click();
      await page.locator('[data-source-help-answer]').waitFor();
      await until(() => store.getAttempt(student, id).state.task.helped, label + ': hint persisted');
      const after = store.getAttempt(student, id);
      assert.deepEqual(after.taskSpec, before.taskSpec, label + ': help keeps the same task and method');
      assert.deepEqual(after.state.task.stepDrafts, before.state.task.stepDrafts, label + ': help retains all drafts');
      assert.equal(after.state.task.step, before.state.task.step, label + ': help cannot complete a step');
      assert.equal(after.state.task.status, before.state.task.status, label + ': help cannot award a result');
      const task = unit.tasks.find(item => item.id === before.taskSpec.contentId);
      assert(task);
      assert((await page.locator('[data-source-help-condition]').innerText()).includes(task.prompt),
        label + ': source helper describes this exact method and set of numbers');
      for (const viewport of [{ width: 320, height: 900 }, { width: 390, height: 844 }, { width: 1280, height: 900 }]) {
        await page.setViewportSize(viewport);
        const panel = page.locator('#cabinet-assistant-host [role=dialog]');
        const box = await panel.boundingBox();
        assert(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width + 2 &&
          box.y + box.height <= viewport.height + 2, label + ': source helper fits ' + viewport.width + 'px');
        const filename = path.join(artifactDir, label + '-helper-' + viewport.width + '.png');
        await page.screenshot({ path: filename, fullPage: false });
        screenshots.push(filename);
      }
      await page.locator('[data-source-help-close]').click();
      await child.locator('body[data-managed-readonly="false"]').waitFor();
      await acknowledged();
    }

    async function pendingAndRejectedGuards(child, id) {
      await acknowledged();
      const actionURL = origin + '/api/learning/attempts/' + id + '/actions';
      const before = store.getAttempt(student, id), step = before.state.task.step;
      const oldDraft = before.state.task.stepDrafts[step];
      let held = false, release;
      const gate = new Promise(resolve => { release = resolve; });
      await page.route(actionURL, async route => { held = true; await gate; await route.continue(); }, { times: 1 });
      try {
        await child.locator('#answer').fill('21');
        await until(() => held, 'held author draft request');
        assert.equal(store.getAttempt(student, id).state.task.stepDrafts[step], oldDraft);
        await page.locator('[data-source-help-launcher]').click();
        await until(() => page.locator('[data-source-help="hint"]').isDisabled(), 'pending author work blocks helper');
        const beforeBlockedHint = requests.length;
        await page.locator('[data-source-help="hint"]').evaluate(button => button.click());
        assert.deepEqual(mutations(beforeBlockedHint), [], 'A pending draft cannot request source help');
        await page.locator('[data-source-help-close]').click();
        await child.locator('[data-managed-course-catalog]').click();
        assert.equal(attemptId(page), id, 'Iframe return waits for the author draft');
        await (await visibleShellReturn(page, 'pending author work')).click();
        assert.equal(attemptId(page), id, 'Shell return waits for the author draft');
        assert.match(await page.locator('#toast').innerText(), /дождитесь сохранения/);
      } finally { release(); }
      await until(() => store.getAttempt(student, id).state.task.stepDrafts[step] === '21', 'held author draft reaches SQLite');
      await acknowledged();
      await draft(child, id, oldDraft);
      await acknowledged();

      // Another synthetic browser sends a stale expected trainer version, so
      // the real local API rejects it. Its rejected queue is isolated from the
      // continuing learner journey and never requires clearing real work.
      const rejectedPage = await login(student);
      await rejectedPage.evaluate(value => LearningApp.navigate('attempt=' + value), id);
      const rejectedFrame = await managedFrame(rejectedPage);
      const beforeRejected = JSON.stringify(store.getAttempt(student, id));
      const beforeHistory = JSON.stringify(store.history(student, id));
      let rejectedRequest = false;
      await rejectedPage.route(actionURL, route => {
        const body = route.request().postDataJSON();
        assert.equal(body.type, 'state');
        body.expectedTrainerVersion = 0;
        rejectedRequest = true;
        return route.continue({ postData: JSON.stringify(body) });
      }, { times: 1 });
      await rejectedFrame.locator('#answer').fill('999');
      await until(async () => rejectedRequest && /неподтверждённые действия/.test(
        await rejectedPage.locator('#save-state').innerText()), 'real API rejection is retained locally');
      await rejectedPage.locator('[data-source-help-launcher]').click();
      await until(() => rejectedPage.locator('[data-source-help="hint"]').isDisabled(), 'rejected author work blocks helper');
      const beforeBlockedHint = requests.length;
      await rejectedPage.locator('[data-source-help="hint"]').evaluate(button => button.click());
      assert.deepEqual(mutations(beforeBlockedHint), [], 'A rejected draft cannot request source help');
      await rejectedPage.locator('[data-source-help-close]').click();
      await rejectedFrame.locator('[data-managed-course-catalog]').click();
      assert.equal(attemptId(rejectedPage), id, 'Iframe return preserves rejected author work');
      await (await visibleShellReturn(rejectedPage, 'rejected author work')).click();
      assert.equal(attemptId(rejectedPage), id, 'Shell return preserves rejected author work');
      assert.equal(JSON.stringify(store.getAttempt(student, id)), beforeRejected, 'Rejected draft never changes the stored work');
      assert.equal(JSON.stringify(store.history(student, id)), beforeHistory, 'Rejected draft adds no stored history');
      await rejectedPage.context().close();
      inspectedPage = page;
      checks.push('Both author catalog returns and source help respect pending and genuinely rejected draft saves; saved work is retained');
    }

    async function openTask(task, { completed = false } = {}) {
      await course();
      const button = page.locator('[data-vilenkin-textbook-open="vilenkin6-textbook:' + task.id + '"]');
      await button.click();
      const frame = await managedFrame(page, { selector: completed ? '.condition' : '#answer' });
      const id = attemptId(page);
      assert(id);
      assert.equal(store.getAttempt(student, id).taskSpec.contentId, task.id);
      const source = await frame.locator('.condition .source').innerText();
      assert.match(source, /[Аа]вторск/);
      assert.doesNotMatch(source, /undefined|NaN|№\s*\d/);
      assert.equal(await frame.locator('.condition .source a[href*=".pdf"]').count(), 0,
        'Author material must not invent a textbook page citation');
      return { frame, id };
    }

    async function draft(frame, id, value) {
      const before = store.getAttempt(student, id).state.task;
      await frame.locator('body[data-managed-readonly="false"]').waitFor();
      await frame.locator('#answer').fill(value);
      await until(() => {
        const state = store.getAttempt(student, id).state.task;
        return before.mode === 'guided' ? state.stepDrafts[before.step] === value : state.draft === value;
      }, 'saved draft for ' + id);
    }

    async function submit(frame, id, value, correct = true) {
      const before = structuredClone(store.getAttempt(student, id).state.task);
      await draft(frame, id, value);
      await frame.locator('body[data-managed-readonly="false"]').waitFor();
      await frame.locator('#answer-form [type=submit]').click();
      await until(() => {
        const state = store.getAttempt(student, id).state.task;
        if (state.attempts <= before.attempts) return false;
        if (!correct) return !!state.feedback[before.mode === 'guided' ? String(before.step) : 'final'];
        return before.mode === 'guided' ? state.step === before.step + 1 : !!state.status;
      }, 'server-verified ' + (correct ? 'answer' : 'rejection') + ' for ' + id);
    }

    async function finishGuided(task, frame, id, { mobileWidth } = {}) {
      if (mobileWidth) await page.setViewportSize({ width: mobileWidth, height: mobileWidth === 390 ? 844 : 900 });
      let current = store.getAttempt(student, id).state.task.step;
      async function startFactorAtTop() {
        await until(async () => (await frame.locator('.work > h2').first().innerText()).trim() ===
          'Шаг ' + (current + 1) + ' из ' + task.steps.length, 'current factor step is rendered before scroll setup');
        await page.evaluate(() => scrollTo(0, 0));
        await frame.evaluate(() => scrollTo(0, 0));
        assert.equal(await page.evaluate(() => scrollY), 0, 'Factor journey starts at the top of the cabinet');
        assert.equal(await frame.evaluate(() => scrollY), 0, 'Factor journey starts at the top of the task');
      }
      if (mobileWidth && task.method === 'factors') await startFactorAtTop();
      while (current < task.steps.length) {
        // Reproduce the long-question transition without relying on scrolling
        // inherited from catalog/history navigation. All setup occurs BEFORE
        // the last factorization is submitted; the test never scrolls the new
        // multiplicity question into view on the product's behalf.
        if (mobileWidth && task.method === 'factors' && current === task.numbers.length - 1) {
          await startFactorAtTop();
        }
        await submit(frame, id, answerText(task.steps[current]));
        current = store.getAttempt(student, id).state.task.step;
        const firstMultiplicity = task.method === 'factors' && current === task.numbers.length;
        if (mobileWidth && (current === 3 || firstMultiplicity) && current < task.steps.length) {
          await frame.locator('body[data-managed-readonly="false"]').waitFor();
          await until(async () => (await frame.locator('.work > h2').first().innerText()).trim() ===
            'Шаг ' + (current + 1) + ' из ' + task.steps.length, 'new current factor question is rendered');
          await recordLayout(frame, current === 3 ? 'factors-after-three-steps' : 'factors-first-multiplicity-step', page.viewportSize(),
            ['#answer-form .entry-label', '#answer', '#answer-form [type=submit]']);
        }
      }
      await until(() => store.getAttempt(student, id).outcome === 'hinted', 'supported completion ' + task.id);
      const saved = store.getAttempt(student, id);
      assert.equal(saved.state.task.status, 'learned');
      assert.equal(saved.state.task.step, task.steps.length);
      assert.deepEqual(saved.state.task.stepDrafts, task.steps.map(answerText));
      exercised.push({ id: task.id, method: task.method, numbers: task.numbers, steps: task.steps.length });
      if (mobileWidth) await page.setViewportSize({ width: 1280, height: 900 });
    }

    async function recordLayout(frame, label, viewport, selectors) {
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const filename = path.join(artifactDir, label + '-' + viewport.width + '.png');
      await page.screenshot({ path: filename, fullPage: false });
      screenshots.push(filename);
      if (!await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2)) {
        layoutFailures.push(label + ': cabinet must fit ' + viewport.width + 'px');
      }
      if (!await frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2)) {
        layoutFailures.push(label + ': trainer must fit ' + viewport.width + 'px');
      }
      const boxes = {};
      const helper = page.locator('[data-source-help-launcher]');
      await helper.waitFor();
      const helperBox = await helper.boundingBox();
      boxes.helper = helperBox;
      if (!helperBox || helperBox.x < 0 || helperBox.y < 0 ||
          helperBox.x + helperBox.width > viewport.width + 2 ||
          helperBox.y + helperBox.height > viewport.height + 2 ||
          helperBox.x + helperBox.width < viewport.width - 40 ||
          helperBox.y + helperBox.height < viewport.height - 40 || helperBox.height < 44) {
        layoutFailures.push(label + ': helper must have a visible bottom-right target at ' + viewport.width + 'px');
      }
      if (await helper.evaluate(element => getComputedStyle(element.closest('.cabinet-assistant-dock')).position) !== 'fixed') {
        layoutFailures.push(label + ': authored task helper must remain fixed at ' + viewport.width + 'px');
      }
      if (!await helper.evaluate(element => {
        const box = element.getBoundingClientRect();
        return [[box.x + box.width / 2, box.y + box.height / 2], [box.x + 8, box.y + 8],
          [box.right - 8, box.bottom - 8]].every(([x, y]) => {
          const hit = document.elementFromPoint(x, y);
          return hit === element || element.contains(hit);
        });
      })) layoutFailures.push(label + ': helper target is covered at ' + viewport.width + 'px');
      const shellReturn = page.locator('#workspace-vilenkin-catalog');
      boxes.catalog = await shellReturn.boundingBox();
      if (!boxes.catalog || !await shellReturn.isVisible() ||
          await shellReturn.evaluate(element => !!element.closest('details:not([open])'))) {
        layoutFailures.push(label + ': authored catalog return must stay outside collapsed secondary controls');
      }
      const frameBox = await page.locator('#trainer-host iframe').boundingBox();
      assert(frameBox, 'The managed trainer viewport must exist');
      for (const selector of selectors) {
        const box = await frame.locator(selector).boundingBox();
        boxes[selector] = box;
        if (box && helperBox) {
          const overlapWidth = Math.min(box.x + box.width, helperBox.x + helperBox.width) - Math.max(box.x, helperBox.x);
          const overlapHeight = Math.min(box.y + box.height, helperBox.y + helperBox.height) - Math.max(box.y, helperBox.y);
          if (overlapWidth > 0 && overlapHeight > 0) {
            layoutFailures.push(label + ': helper rectangle overlaps ' + selector + ' at ' + viewport.width +
              'px: ' + JSON.stringify({ overlapWidth, overlapHeight, box, helperBox }));
          }
        }
        if (!box || box.x < Math.max(0, frameBox.x) - 2 ||
            box.x + box.width > Math.min(viewport.width, frameBox.x + frameBox.width) + 2 ||
            box.y < Math.max(0, frameBox.y) - 2 ||
            box.y + box.height > Math.min(viewport.height, frameBox.y + frameBox.height) + 2) {
          layoutFailures.push(label + ': ' + selector + ' must fit the visible ' + viewport.width + 'x' +
            viewport.height + ' viewport: ' + JSON.stringify(box));
        } else if (selector === '#answer' || selector === '#answer-form [type=submit]') {
          const unobscured = await page.evaluate(({ x, y, width, height }) => {
            const iframe = document.querySelector('#trainer-host iframe');
            return [[x + width / 2, y + height / 2], [x + 8, y + 8],
              [x + width - 8, y + height - 8]].every(([left, top]) =>
              document.elementFromPoint(left, top) === iframe);
          }, box);
          if (!unobscured) layoutFailures.push(label + ': ' + selector +
            ' is covered by an outer cabinet control at ' + viewport.width + 'px');
        }
      }
      layout.push({ label, viewport, frameBox, boxes });
    }

    async function captureLayout(frame, label) {
      for (const viewport of [{ width: 320, height: 900 }, { width: 390, height: 844 }, { width: 1280, height: 900 }]) {
        await page.setViewportSize(viewport);
        await page.evaluate(() => scrollTo(0, 0));
        await frame.evaluate(() => scrollTo(0, 0));
        await recordLayout(frame, label, viewport,
          ['.condition .prompt', '#answer-form .entry-label', '#answer', '#answer-form [type=submit]']);
      }
      await page.setViewportSize({ width: 1280, height: 900 });
    }

    page = await login(student);
    const teacherPage = await login(teacher);
    await teacherPage.evaluate(id => LearningApp.navigate('student=' + id), student.id);
    await teacherPage.locator('#teaching-profile [name=routeMode]').selectOption('vilenkin-textbook');
    await teacherPage.locator('#teaching-profile [type=submit]').click();
    await until(() => store.studentProfile(teacher, student.id).focus.includes('Курс в кабинете: Виленкин'),
      'normal teacher profile form save');
    assert.equal(JSON.stringify(store.studentProfile(teacher, peer.id)), peerBefore);
    checks.push('Normal teacher profile form selects the textbook route only for the intended synthetic pupil');

    await page.reload();
    await page.locator('[data-attached-course-open]').click();
    await page.locator('[data-vilenkin-textbook-unit="1008"]').waitFor();
    assert.equal(await page.locator('[data-vilenkin-textbook-open]').count(), manifest.length);
    const section = page.locator('[data-vilenkin-textbook-unit="1008"]');
    assert.equal(await section.locator('[data-vilenkin-textbook-open]').count(), unit.tasks.length);
    assert.equal(await section.locator('[data-lcm-group]').count(), new Set(unit.tasks.map(task => task.groupId)).size);
    for (const [stage, conditions] of [['example', 3], ['practice', 16], ['check', 6]]) {
      assert.equal(await section.locator('[data-lcm-stage="' + stage + '"] [data-lcm-group]').count(), conditions);
    }
    const beforeReviewBrowsing = requests.length;
    const beforeReviewAttempts = store.listAttempts(student).length;
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2),
        'The course method groups must fit ' + width + 'px');
      const courseUrl = page.url();
      await page.locator('[data-vilenkin-textbook-choose-topic]').click();
      const topics = page.locator('[data-v6-topics-heading]');
      assert(await topics.evaluate(element => document.activeElement === element),
        'Choose topic focuses the heading shared by the authored and original topics');
      assert(await topics.evaluate(element => {
        const author = document.querySelector('[data-vilenkin-textbook-author]');
        const original = document.querySelector('details[data-vilenkin-textbook-unit="0"]');
        return !!author && !!original && !!(element.compareDocumentPosition(author) & Node.DOCUMENT_POSITION_FOLLOWING) &&
          !!(author.compareDocumentPosition(original) & Node.DOCUMENT_POSITION_FOLLOWING);
      }), 'The topic destination includes the authored NОК section before the original source topics');
      await page.locator('[data-course-help-launcher]').click();
      await page.locator('[data-course-help-action="topics"]').click();
      assert(await topics.evaluate(element => document.activeElement === element),
        'The course helper uses the same inclusive topic destination');
      const entryFilename = path.join(artifactDir, 'course-topic-entry-' + width + '.png');
      await page.screenshot({ path: entryFilename, fullPage: false });
      screenshots.push(entryFilename);
      for (const unitId of [6, 7, 8]) {
        await section.locator('[data-vilenkin-review-unit="' + unitId + '"]').click();
        const original = page.locator('details[data-vilenkin-textbook-unit="' + unitId + '"]');
        assert(await original.evaluate(element => element.open), 'Review shortcut opens the existing source unit');
        if (unitId === 8) {
          for (const part of ['д', 'е', 'ж', 'з']) {
            assert(await original.locator('[data-vilenkin-textbook-open="vilenkin6-textbook:v6-book-2-97-' + part + '"]').isVisible(),
              'Original exercise 2.97 ' + part + ' remains available for review');
          }
        }
        await original.locator('[data-vilenkin-return-lcm]').click();
        assert(await section.locator('[data-lcm-title]').evaluate(element => document.activeElement === element));
        assert.equal(page.url(), courseUrl, 'Review shortcuts preserve the cabinet route');
      }
      const reviewFilename = path.join(artifactDir, 'course-review-' + width + '.png');
      await section.locator('[data-lcm-review]').screenshot({ path: reviewFilename });
      screenshots.push(reviewFilename);
      const filename = path.join(artifactDir, 'course-examples-' + width + '.png');
      await section.locator('[data-lcm-stage="example"]').screenshot({ path: filename });
      screenshots.push(filename);
    }
    assert.deepEqual(mutations(beforeReviewBrowsing), [], 'Review shortcuts and returning to LCM do not write work');
    assert.equal(store.listAttempts(student).length, beforeReviewAttempts, 'Review shortcuts never start a new attempt');
    checks.push('Topic chooser and navigation helper include author LCM; review shortcuts open prime factors, GCD and original LCM exercises and return without changing route or starting work');
    checks.push('Cabinet keeps all 194 textbook tasks and adds separately labelled examples, paired practice methods and six checks');

    const chain = unit.tasks.find(task => task.stage === 'example' && task.groupId === 'example-01' && task.method === 'chain');
    const factors = otherMethod(chain);
    let opened = await openTask(chain);
    await captureLayout(opened.frame, 'chain-first-screen');
    await submit(opened.frame, opened.id, answerText(chain.steps[0]));
    await draft(opened.frame, opened.id, '20');
    const chainId = opened.id;
    await sourceHint(opened.frame, chainId, 'chain');
    await pendingAndRejectedGuards(opened.frame, chainId);
    await returnToCatalog(page, opened.frame, chainId, 'frame', 'chain iframe return');
    opened.frame = await resumeNewest(chainId, 'chain after 194 older unfinished source tasks');
    assert.equal(await opened.frame.locator('#answer').inputValue(), '20');
    const chainSaved = structuredClone(store.getAttempt(student, chainId).state.task);
    await page.reload();
    let frame = await managedFrame(page);
    assert.equal(await frame.locator('#answer').inputValue(), '20');
    assert.match(await frame.locator('.step-history').innerText(), /12/);
    const secondDevice = await login(student, { holdInitialData: true });
    await secondDevice.evaluate(id => LearningApp.navigate('attempt=' + id), chainId);
    const secondFrame = await managedFrame(secondDevice);
    assert.equal(await secondFrame.locator('#answer').inputValue(), '20');
    assert.match(await secondFrame.locator('.step-history').innerText(), /12/);
    await secondDevice.context().close();
    checks.push('A verified chain step and unfinished next answer survive reload and a separate browser context');

    opened = await openTask(factors);
    await captureLayout(opened.frame, 'factors-first-screen');
    await submit(opened.frame, opened.id, answerText(factors.steps[0]));
    await draft(opened.frame, opened.id, answerText(factors.steps[1]));
    const factorsId = opened.id;
    await sourceHint(opened.frame, factorsId, 'factors');
    await returnToCatalog(page, opened.frame, factorsId, 'shell', 'factor shell return');
    opened.frame = await resumeNewest(factorsId, 'factor after unfinished chain and original source tasks');
    assert.equal(await opened.frame.locator('#answer').inputValue(), answerText(factors.steps[1]));
    const factorsSaved = structuredClone(store.getAttempt(student, factorsId).state.task);
    const factorsBeforeHistory = JSON.stringify(store.getAttempt(student, factorsId));
    const factorHistoryBefore = JSON.stringify(store.history(student, factorsId));
    await page.setViewportSize({ width: 320, height: 900 });
    const secondary = page.locator('.lcm-workspace-tools');
    if (!await secondary.evaluate(element => element.open)) await secondary.locator('summary').click();
    await page.locator('#show-history').click();
    await page.locator('#history-bar').waitFor();
    await opened.frame.locator('body[data-managed-readonly="true"]').waitFor();
    assert(await opened.frame.locator('#main').evaluate(element => element.inert), 'Author history keeps the task inert');
    await visibleShellReturn(page, 'author history at 320px');
    const authorHistoryImage = path.join(artifactDir, 'author-history-catalog-return-320.png');
    await page.screenshot({ path: authorHistoryImage, fullPage: false });
    screenshots.push(authorHistoryImage);
    await returnToCatalog(page, opened.frame, factorsId, 'shell', 'author history return');
    opened.frame = await resumeNewest(factorsId, 'author history continuation');
    assert.deepEqual(store.getAttempt(student, factorsId).state.task, factorsSaved);
    assert.equal(JSON.stringify(store.getAttempt(student, factorsId)), factorsBeforeHistory);
    assert.equal(JSON.stringify(store.history(student, factorsId)), factorHistoryBefore);
    assert.equal(await opened.frame.locator('#answer').inputValue(), answerText(factors.steps[1]));
    await page.setViewportSize({ width: 1280, height: 900 });
    checks.push('Author methods retain hints, steps and drafts through iframe/shell/history catalog returns; Continue selects newer LCM work over 194 older source attempts');
    opened = await openTask(chain);
    assert.equal(opened.id, chainId);
    assert.deepEqual(store.getAttempt(student, chainId).state.task, chainSaved);
    assert.equal(await opened.frame.locator('#answer').inputValue(), '20');
    await finishGuided(chain, opened.frame, chainId);
    opened = await openTask(factors);
    assert.equal(opened.id, factorsId);
    assert.deepEqual(store.getAttempt(student, factorsId).state.task, factorsSaved);
    await finishGuided(factors, opened.frame, factorsId, { mobileWidth: 320 });
    checks.push('Switching both methods through course buttons resumes separate saved steps and drafts; both stay supported learning');

    const representative = [
      ['chain', [6, 8, 12, 18]],
      ['factors', [8, 9, 12, 15]],
      ['chain', [4, 6, 9, 10, 15]],
      ['factors', [2, 3, 4, 5, 6]],
      ['chain', [1, 6, 8]],
      ['factors', [1, 6, 8]],
      ['chain', [5, 5, 10]],
      ['factors', [5, 5, 10]],
    ];
    for (const [method, numbers] of representative) {
      const task = unit.tasks.find(item => item.stage === 'practice' && item.method === method &&
        JSON.stringify(item.numbers) === JSON.stringify(numbers));
      assert(task, method + ' representative ' + numbers.join(','));
      opened = await openTask(task);
      await finishGuided(task, opened.frame, opened.id,
        method === 'factors' && numbers.length === 4 ? { mobileWidth: 390 } : {});
    }
    checks.push('Real form submissions verify both methods with three, four and five numbers, one, repeated inputs and answers above 200');

    const freshChecks = unit.tasks.filter(task => task.role === 'check');
    let independentId, independentTask;
    for (const [index, task] of freshChecks.entries()) {
      opened = await openTask(task);
      assert.equal(store.getAttempt(student, opened.id).state.task.mode, 'independent');
      assert.equal(store.getAttempt(student, opened.id).state.task.repeated, false);
      if (index === 0) {
        const largerCommonMultiple = leastCommonMultiple(task.numbers) * 2;
        assert(task.numbers.every(number => largerCommonMultiple % number === 0));
        await submit(opened.frame, opened.id, String(largerCommonMultiple), false);
        await submit(opened.frame, opened.id, String(largerCommonMultiple * 2), false);
        const rejected = store.getAttempt(student, opened.id);
        assert.equal(rejected.outcome, 'started');
        assert.equal(rejected.state.task.status, '');
        assert.equal(rejected.state.task.helped, false);
        assert.equal(rejected.state.task.wrongCounts.final, 2);
        assert.equal(await opened.frame.locator('.hint').count(), 0);
        assert.match(await opened.frame.locator('.feedback').innerText(), /подсказк/i);
      }
      const helped = index === freshChecks.length - 1;
      if (helped) {
        await opened.frame.locator('[data-action="hint"]').click();
        await until(() => store.getAttempt(student, opened.id).state.task.helped, 'explicit independent hint save');
      }
      await submit(opened.frame, opened.id, String(leastCommonMultiple(task.numbers)));
      await until(() => store.getAttempt(student, opened.id).outcome === (helped ? 'hinted' : 'independent'),
        'honest independent/hinted result ' + task.id);
      if (!helped && !independentId) {
        independentId = opened.id;
        independentTask = task;
      }
    }
    checks.push('Larger common multiples are rejected without revealing help; six unseen checks distinguish independent from explicitly hinted results');

    opened = await openTask(independentTask, { completed: true });
    assert.equal(opened.id, independentId);
    const independentBefore = JSON.stringify(store.getAttempt(student, independentId));
    await opened.frame.locator('[data-action="repeat"]').click();
    await until(() => attemptId(page) !== independentId, 'fresh repeated attempt');
    const repeatedId = attemptId(page);
    frame = await managedFrame(page);
    assert.equal(await frame.locator('#answer').inputValue(), '');
    assert.equal(store.getAttempt(student, repeatedId).state.task.repeated, true);
    await submit(frame, repeatedId, String(leastCommonMultiple(independentTask.numbers)));
    await until(() => store.getAttempt(student, repeatedId).outcome === 'practiced', 'honest repeat result');
    assert.equal(JSON.stringify(store.getAttempt(student, independentId)), independentBefore);
    checks.push('Repeating a completed check creates a new practiced attempt and preserves its earlier independent result');

    const unfinished = unit.tasks.find(task => task.stage === 'practice' && task.method === 'chain' &&
      JSON.stringify(task.numbers) === JSON.stringify([7, 8, 9]));
    opened = await openTask(unfinished);
    await draft(opened.frame, opened.id, '56');
    const peerPage = await login(peer);
    const denied = await peerPage.evaluate(async id => (await fetch('/api/learning/attempts/' + id)).status, opened.id);
    assert([403, 404].includes(denied), 'Another pupil must not read this attempt');
    await acknowledged();
    await teacherPage.evaluate(id => LearningApp.navigate('attempt=' + id), opened.id);
    let teacherFrame = await managedFrame(teacherPage, { readOnly: true });
    assert(await teacherFrame.locator('#main').evaluate(element => element.inert), 'Teacher author preview remains read-only');
    await visibleShellReturn(teacherPage, 'teacher author preview');
    const teacherReturnImage = path.join(artifactDir, 'author-teacher-catalog-return-1280.png');
    await teacherPage.screenshot({ path: teacherReturnImage, fullPage: false });
    screenshots.push(teacherReturnImage);
    await returnToCatalog(teacherPage, teacherFrame, opened.id, 'shell', 'teacher read-only author return');
    const controlled = store.getAttempt(student, opened.id);
    store.action(teacher, opened.id, { opId: uuid(), expectedVersion: controlled.version,
      type: 'control', payload: { controller: 'teacher' } });
    await teacherPage.evaluate(id => LearningApp.navigate('attempt=' + id), opened.id);
    teacherFrame = await managedFrame(teacherPage);
    await returnToCatalog(teacherPage, teacherFrame, opened.id, 'frame', 'teacher controlled author return');
    await page.reload();
    frame = await managedFrame(page, { readOnly: true });
    const readOnlyBefore = JSON.stringify(store.getAttempt(student, opened.id));
    await frame.evaluate(() => {
      const input = document.querySelector('#answer');
      input.value = '999';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('#answer-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      document.querySelector('[data-action="hint"]')?.click();
    });
    await page.waitForTimeout(250);
    assert.equal(JSON.stringify(store.getAttempt(student, opened.id)), readOnlyBefore,
      'Read-only learner cannot save, grade or open assistance');
    checks.push('Teacher control makes unfinished work read-only; stale input/submit/hint events do not write, and a peer is denied');

    await page.setViewportSize({ width: 320, height: 900 });
    await visibleShellReturn(page, 'read-only author work at 320px');
    const readOnlyImage = path.join(artifactDir, 'author-readonly-catalog-return-320.png');
    await page.screenshot({ path: readOnlyImage, fullPage: false });
    screenshots.push(readOnlyImage);
    await returnToCatalog(page, frame, opened.id, 'shell', 'learner read-only author return');
    await page.evaluate(id => LearningApp.navigate('attempt=' + id), opened.id);
    frame = await managedFrame(page, { readOnly: true });
    assert.equal(attemptId(page), opened.id);
    assert.equal(JSON.stringify(store.getAttempt(student, opened.id)), readOnlyBefore,
      'Read-only author return and reopen retain the same saved task and controller');
    assert.equal(await frame.locator('#answer').inputValue(), '56');
    checks.push('Visible author shell returns work for teacher preview, pupil read-only mode and history; controlled teacher breadcrumb also preserves work, control and events');

    assert.equal(await frame.evaluate(key => localStorage.getItem(key), standaloneKey), 'public-sentinel');
    for (const [id, record] of protectedRecords) {
      assert.equal(JSON.stringify(store.getAttempt(student, id)), record,
        'Original saved work must remain byte-identical: ' + id);
    }
    assert.equal(JSON.stringify(store.studentProfile(teacher, peer.id)), peerBefore);
    assert.deepEqual(errors, []);
    assert.deepEqual(sourceHashes(), initialHashes, 'The composed UI and content stayed unchanged during the browser run');
    assert.equal(requests.filter(request => request.url.includes('/assistant/ask')).length, 0,
      'Source-bound course help never calls an external model');
    checks.push('All 194 source-task saved records, the legacy attempt, the other pupil profile and standalone storage remain unchanged');
    // Layout failures remain hard failures, but are reported after functional
    // checks so one run reveals both UI and state/persistence regressions.
    assert.deepEqual(layoutFailures, [], 'Condition and current action must remain usable in the visible viewport');
    const result = { result: 'LCM_MULTI_BROWSER_OK', originalSavedAttempts: originalTasks.length,
      authorTasks: unit.tasks.length, catalogueTasks: manifest.length, checks, exercised, layout,
      screenshots, errors, sourceSha256: initialHashes, viewportWidths: [320, 390, 1280],
      publicRequestsAllowed: 0, blockedExternalRequests: blockedExternal.length, providerCalls: 0 };
    fs.writeFileSync(path.join(artifactDir, 'result.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    console.error('COMPLETED_CHECKS', JSON.stringify(checks));
    console.error('LAYOUT_FAILURES', JSON.stringify(layoutFailures));
    if (layoutFailures.length) console.error('LAYOUT_MEASUREMENTS', JSON.stringify(layout));
    const failedPage = inspectedPage && !inspectedPage.isClosed() ? inspectedPage : page;
    if (failedPage && !failedPage.isClosed()) {
      fs.mkdirSync(artifactDir, { recursive: true });
      await failedPage.screenshot({ path: path.join(artifactDir, 'failure.png'), fullPage: false }).catch(() => {});
      console.error('CABINET', await failedPage.locator('body').innerText().catch(() => 'Unavailable'));
      const id = attemptId(failedPage);
      if (id && student && store) console.error('SYNTHETIC_ATTEMPT', JSON.stringify(store.getAttempt(student, id)));
      for (const frame of failedPage.frames().slice(1)) {
        console.error('TRAINER', await frame.locator('body').innerText().catch(() => 'Unavailable'));
      }
    }
    process.exitCode = 1;
  } finally {
    await browser?.close();
    await close(server);
    await close(trainerServer);
    store?.close();
    fs.rmSync(scratch, { recursive: true, force: true });
  }
})();
