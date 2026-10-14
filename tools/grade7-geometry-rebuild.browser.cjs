'use strict';

// CI-only browser gate. All accounts, credentials, photographs and SQLite rows
// are synthetic. Two loopback origins exercise the real managed iframe/API.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const backendRequire = createRequire(path.join(ROOT, 'board-server/package.json'));
const express = backendRequire('express');
const sharp = backendRequire('sharp');
const { LearningStore } = require('../board-server/learning-store');
const { createLearningApi } = require('../board-server/learning-api');
const { createTeachingRouter } = require('../board-server/learning-teaching');
const { hashPassword } = require('../board-server/learning-auth');
const contracts = require('../board-server/learning-contracts');
const catalog = require('../learning/catalog');

const uuid = () => crypto.randomUUID();
const frame = page => page.frameLocator('#trainer-host iframe');
const api = (page, route, body) => page.evaluate(({ route, body }) =>
  LearningApp.api(route, body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }), { route, body });
const navigate = (page, route) => page.evaluate(route => LearningApp.navigate(route), route);
const listen = app => new Promise(resolve => {
  const server = app.listen(0, '127.0.0.1', () => resolve(server));
});
const close = server => server ? new Promise(resolve => {
  server.closeAllConnections(); server.close(resolve);
}) : Promise.resolve();
async function ready(page) {
  await page.locator('#trainer-host iframe').waitFor();
  await page.waitForFunction(() => document.querySelector('#trainer-host .frame-status')?.hidden);
}
async function saved(page) {
  await page.waitForFunction(() => document.querySelector('#save-state')?.textContent === 'Все изменения сохранены');
}
async function until(page, attemptId, accept, message) {
  const deadline = Date.now() + 15000;
  do {
    const attempt = await api(page, '/attempts/' + attemptId);
    if (accept(attempt)) return attempt;
    await new Promise(resolve => setTimeout(resolve, 80));
  } while (Date.now() < deadline);
  throw Error(message || 'Saved attempt did not reach the expected state: ' + attemptId);
}
async function waitWritable(page, writable) {
  const main = frame(page).locator('#main');
  const deadline = Date.now() + 15000;
  while ((await main.evaluate(node => !node.inert)) !== writable) {
    assert(Date.now() < deadline, 'Managed write permissions did not propagate');
    await new Promise(resolve => setTimeout(resolve, 80));
  }
}
async function fits(page, managed = false) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Outer page fits the viewport');
  if (managed) assert(await frame(page).locator('#main').evaluate(() =>
    document.documentElement.scrollWidth <= innerWidth + 1), 'Managed trainer fits the viewport');
}
async function diagramFits(locator, label) {
  const failures = await locator.evaluate(svg => {
    const bounds = svg.getBoundingClientRect(), problems = [];
    const labels = [...svg.querySelectorAll('text')].filter(node => node.textContent.trim()).map(node => ({
      text: node.textContent, rect: node.getBoundingClientRect()
    }));
    if (!labels.length) problems.push('No diagram labels');
    for (const { text, rect } of labels) {
      if (rect.left < bounds.left - 2 || rect.top < bounds.top - 2 || rect.right > bounds.right + 2 || rect.bottom > bounds.bottom + 2) {
        problems.push('Clipped label: ' + text);
      }
    }
    for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) {
      const a = labels[i].rect, b = labels[j].rect;
      if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 &&
          Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2) {
        problems.push('Overlapping labels: ' + labels[i].text + ' / ' + labels[j].text);
      }
    }
    return problems;
  });
  assert.deepEqual(failures, [], label);
}
async function answerStep(page, task, index) {
  const item = task.steps[index];
  const answer = await frame(page).locator('#main').evaluate((_node, step) => PathData.answerText(step), item);
  if (item.choices) await frame(page).locator('[data-answer-choice="' + answer + '"]').click();
  else await frame(page).locator('#answer').fill(answer);
  await frame(page).locator('#answerForm button.primary').click();
}

async function main() {
  const output = path.resolve(process.env.GEOMETRY_REBUILD_OUTPUT_DIR || '/tmp/geometry-rebuild-evidence');
  fs.mkdirSync(output, { recursive: true });
  // Only public content identifiers, viewport dimensions and gate results go
  // into uploaded evidence. The synthetic account/SQLite fixtures stay separate.
  const report = { status: 'running', hub: {}, samples: [], captures: [] };
  const writeReport = () => fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  writeReport();
  async function screenshot(target, filename, fullPage = false) {
    await target.screenshot({ path: path.join(output, filename), animations: 'disabled', ...(fullPage ? { fullPage: true } : {}) });
  }
  async function stableTrainer(page, filename) {
    const measured = await frame(page).locator('#main').evaluate(() => new Promise(resolve => {
      const samples = [];
      let previous, stableSince, finished = false;
      const finish = stable => {
        if (finished) return;
        finished = true; clearTimeout(timer);
        resolve({ stable, samples: stable ? samples.slice(-1) : samples.slice(-24) });
      };
      const timer = setTimeout(() => finish(false), 3000);
      const tick = now => {
        if (finished) return;
        // Re-query after managed updates: replacing a child is harmless, but
        // changing its rendered position or dimensions must still settle.
        const boxes = [...document.querySelectorAll('#main, [data-core-drawing], #answerForm, #feedback, .steps')]
          .flatMap(node => {
            const r = node.getBoundingClientRect();
            return [r.x + scrollX, r.y + scrollY, r.width, r.height];
          });
        const values = [innerWidth, innerHeight, document.documentElement.scrollWidth,
          document.documentElement.scrollHeight, scrollX, scrollY, ...boxes];
        samples.push(values);
        if (!previous || values.length !== previous.length || values.some((value, i) => Math.abs(value - previous[i]) > 0.25)) stableSince = now;
        previous = values;
        if (now - stableSince >= 300) return finish(true);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }));
    if (!measured.stable) {
      report.captures.push({ filename, status: 'unstable', dimensions: measured.samples }); writeReport();
    }
    assert(measured.stable, 'Trainer layout did not settle for ' + filename + ': ' + JSON.stringify(measured.samples));
    return measured.samples[0];
  }
  async function trainerEvidence(page, stem) {
    // #main is taller than the fixed-height iframe. A locator screenshot of
    // that whole element produces blank clipped rows and may never stabilize.
    // Scroll the real iframe viewport instead; retain every visible tile with
    // overlap, including the condition, controls, feedback and accumulated steps.
    await page.locator('#toast').waitFor({ state: 'hidden' });
    const iframe = page.locator('#trainer-host iframe');
    await iframe.evaluate(node => node.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }));
    await frame(page).locator('#main').evaluate(() => scrollTo({ top: 0, left: 0, behavior: 'instant' }));
    let previousTop = -1, previousBottom = 0;
    for (let tile = 0; ; tile++) {
      assert(tile < 20, 'Unexpectedly tall trainer while capturing ' + stem);
      const filename = stem + (tile ? '-part-' + (tile + 1) : '') + '.png';
      const before = await stableTrainer(page, filename);
      const [width, height, , totalHeight, , top] = before;
      assert(top > previousTop, 'Trainer did not scroll to the next screenshot tile: ' + filename);
      assert(top <= previousBottom, 'Screenshot tiles leave a vertical gap: ' + filename);
      await fits(page, true);
      const box = await iframe.boundingBox(), viewport = page.viewportSize();
      assert(box && box.x >= -1 && box.y >= -1 && box.x + box.width <= viewport.width + 1 &&
        box.y + box.height <= viewport.height + 1, 'The whole iframe viewport must be visible: ' + JSON.stringify(box));
      const capture = { filename, status: 'capturing', viewport: { width, height }, scrollTop: top, scrollHeight: totalHeight };
      report.captures.push(capture); writeReport();
      await page.screenshot({ path: path.join(output, filename), animations: 'disabled', clip: box });
      const after = await stableTrainer(page, filename), afterBox = await iframe.boundingBox();
      const unchanged = before.length === after.length && before.every((value, i) => Math.abs(value - after[i]) <= 0.25) &&
        afterBox && ['x', 'y', 'width', 'height'].every(key => Math.abs(box[key] - afterBox[key]) <= 0.25);
      Object.assign(capture, { status: unchanged ? 'passed' : 'changed-during-capture',
        ...(unchanged ? {} : { before, after, box, afterBox }) }); writeReport();
      assert(unchanged, 'Trainer moved during screenshot: ' + filename);
      previousTop = top;
      previousBottom = top + height;
      if (previousBottom >= totalHeight - 1) break;
      await frame(page).locator('#main').evaluate((_node, next) => scrollTo({ top: next, left: 0, behavior: 'instant' }), top + height - 80);
    }
    await frame(page).locator('#main').evaluate(() => scrollTo({ top: 0, left: 0, behavior: 'instant' }));
  }
  async function mobileEvidence(page, contentId, stage) {
    await page.setViewportSize({ width: 320, height: 844 });
    await trainerEvidence(page, contentId + '-' + stage + '-320');
    await fits(page, true);
    await page.setViewportSize({ width: 1360, height: 1000 });
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'geometry-rebuild-'));
  const filePath = path.join(dir, 'learning.sqlite');
  let store, browser, trainerServer, server;
  const errors = [], external = [];
  try {
    store = new LearningStore({ filePath, contracts });
    assert(store.available, 'The gate requires real SQLite');
    const password = 'Synthetic-geometry-rebuild-2026';
    const invite = store.bootstrap({ login: 'fixture_rebuild_teacher', name: 'Fixture teacher' });
    const teacher = store.activate(invite.invitationToken, await hashPassword(password)).account;
    const studentInvite = store.createStudent(teacher, { login: 'fixture_rebuild_student', name: 'Fixture learner' });
    const student = store.activate(studentInvite.invitationToken, await hashPassword(password, 'student')).account;

    const trainerApp = express(); trainerApp.use(express.static(ROOT));
    trainerServer = await listen(trainerApp);
    const trainerOrigin = 'http://127.0.0.1:' + trainerServer.address().port;
    const app = express(); app.use(express.json({ limit: '200kb' }));
    server = await listen(app);
    const origin = 'http://127.0.0.1:' + server.address().port;
    app.get('/api/learning/status', (_req, res) => res.json({ ...store.status(), trainerOrigin }));
    const learning = createLearningApi({ store, publicOrigin: origin, secureCookies: false });
    app.use('/api/learning', learning.router, createTeachingRouter(learning));
    app.use(express.static(ROOT));
    browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const allowed = new Set([origin, trainerOrigin]);
    async function newPage() {
      const context = await browser.newContext({ viewport: { width: 1360, height: 1000 }, locale: 'ru-RU' });
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (allowed.has(url.origin) || ['data:', 'blob:'].includes(url.protocol)) return route.continue();
        external.push(url.origin + url.pathname); return route.abort();
      });
      const page = await context.newPage(); page.setDefaultTimeout(15000);
      page.on('pageerror', error => errors.push(error.message));
      return page;
    }
    async function login(login) {
      const page = await newPage(); await page.goto(origin + '/learning/');
      await page.locator('#auth-form [name=login]').fill(login);
      await page.locator('#auth-form [name=password]').fill(password);
      await page.locator('#auth-form [type=submit]').click();
      await page.locator('#navigation').waitFor();
      if (await page.locator('[data-mw-close]').isVisible()) await page.locator('[data-mw-close]').click();
      return page;
    }

    const items = catalog.items.filter(item => item.geometryRebuild);
    assert(items.length >= 60, 'The complete micro-course must be in the managed catalog');
    const sections = [...new Set(items.map(item => item.section))].sort((a, b) => a - b);
    assert.deepEqual(sections, Array.from({ length: 17 }, (_, index) => index + 1));
    // One representative from each independently authored module. Every step
    // variant in these representatives must carry a useful wrong-choice reply.
    const samples = [[1, 7], [8, 11], [12, 17]].map(([from, to]) => {
      const item = items.find(item => item.section >= from && item.section <= to &&
        Array.from({ length: 72 }, (_, seed) => contracts.create('ege-path', item.contentId, seed).taskSpec.task)
          .every(task => task.steps.length >= 2 && task.steps[0].choices?.some(choice =>
            choice.value !== String(task.steps[0].a) && typeof task.steps[0].feedback?.[choice.value] === 'string')));
      assert(item, 'Need a choice-feedback integration sample for sections ' + from + '–' + to);
      return item;
    });
    const publicPage = await newPage();
    await publicPage.goto(trainerOrigin + '/grade7/geometry-rebuild/');
    await publicPage.locator('[data-geometry-section="17"]').waitFor();
    assert.deepEqual(await publicPage.locator('[data-geometry-section]').evaluateAll(nodes =>
      nodes.map(node => Number(node.dataset.geometrySection)).sort((a, b) => a - b)), sections);
    assert.deepEqual((await publicPage.locator('[data-geometry-lesson]').evaluateAll(nodes =>
      nodes.map(node => node.dataset.geometryLesson))).sort(), items.map(item => item.contentId).sort());
    for (const item of items) {
      const card = publicPage.locator('[data-geometry-lesson="' + item.contentId + '"]');
      const cabinet = new URL(await card.locator('[data-cabinet-practice]').getAttribute('href'));
      assert.equal(cabinet.origin, 'https://mathexam-board-ladynata.msk1.amvera.tech');
      assert.equal(cabinet.pathname, '/learning/');
      assert.equal(new URLSearchParams(cabinet.hash.slice(1)).get('practice'), item.id);
      const preview = new URL(await card.locator('[data-preview]').getAttribute('href'), trainerOrigin);
      assert.equal(preview.pathname, '/ege-baza/path/index.html');
      assert.equal(preview.searchParams.get('practice'), '1');
      assert.equal(new URLSearchParams(preview.hash.slice(1)).get('lesson'), item.contentId);
    }
    await screenshot(publicPage, 'hub-desktop-1360.png', true);
    await fits(publicPage);
    await publicPage.setViewportSize({ width: 320, height: 844 });
    await screenshot(publicPage, 'hub-mobile-320.png', true);
    await fits(publicPage);
    report.hub = { status: 'passed', sectionCount: sections.length, lessonCount: items.length,
      viewports: [{ width: 1360, height: 1000 }, { width: 320, height: 844 }] };
    writeReport();
    assert.equal(store.row('SELECT COUNT(*) AS n FROM attempts').n, 0, 'The public hub creates no cabinet progress');
    const previewURL = await publicPage.locator('[data-geometry-lesson="' + samples[0].contentId + '"] [data-preview]').getAttribute('href');
    await publicPage.goto(new URL(previewURL, trainerOrigin).href);
    await publicPage.getByRole('heading', { name: samples[0].title, exact: true }).waitFor();
    assert.equal(await publicPage.locator('#trainer-host iframe').count(), 0);
    await fits(publicPage);
    assert.equal(store.row('SELECT COUNT(*) AS n FROM attempts').n, 0, 'Public preview remains outside the cabinet');

    const pupil = await login(student.login), tutor = await login(teacher.login);
    // Verify the actual teacher selector, not just the Node catalog export.
    await navigate(tutor, 'assignments'); await tutor.locator('#create-assignment').click();
    const form = tutor.locator('#assignment-form'); await form.waitFor();
    await form.locator('[name=course]').selectOption('all');
    const options = await form.locator('[name=content] option').evaluateAll(nodes => nodes.map(node => node.value));
    for (const item of items) assert(options.includes(item.id), 'Teacher can assign ' + item.id);
    await tutor.keyboard.press('Escape');
    // Publication requires a supplementary sheet/photo in the existing
    // homework contract. This tiny generated fixture exercises that requirement
    // without importing an actual pupil image or weakening publication rules.
    const photo = (await sharp({ create: { width: 32, height: 32, channels: 3, background: '#ffffff' } }).png().toBuffer()).toString('base64');
    const completed = [];
    for (const item of samples) {
      const evidence = { contentId: item.contentId, section: item.section, status: 'running',
        mobileViewport: { width: 320, height: 844 } };
      report.samples.push(evidence); writeReport();
      await navigate(pupil, 'practice=' + encodeURIComponent(item.id));
      await pupil.locator('[data-practice-start]').waitFor();
      assert.equal((await api(pupil, '/attempts')).attempts.length, completed.length, 'Reading a card creates no attempt');
      const created = await api(tutor, '/assignments', { opId: uuid(), title: 'Synthetic geometry: ' + item.title,
        learnerIds: [student.id], trainerId: item.trainerId, contentId: item.contentId });
      const assignment = created.assignments[0], id = assignment.attemptId;
      assert.equal(assignment.attempt.taskSpec.contentId, item.contentId);
      await api(tutor, '/assignments/' + assignment.id + '/photos', { opId: uuid(), kind: 'task',
        filename: 'synthetic-geometry.png', mime: 'image/png', data: photo });
      await api(tutor, '/assignments/' + assignment.id + '/publish', { opId: uuid() });
      await pupil.evaluate(() => LearningApp.refresh());
      await navigate(pupil, 'assignment=' + assignment.id);
      await pupil.locator('a[href="#attempt=' + id + '"]').click(); await ready(pupil);
      assert.equal((await api(pupil, '/attempts/' + id)).contentId, item.contentId);
      await frame(pupil).locator('[data-stage="1"]').click(); await saved(pupil);
      const drawing = frame(pupil).locator('[data-core-drawing] svg'); await drawing.waitFor();
      await trainerEvidence(pupil, item.contentId + '-model-desktop-1360');
      await diagramFits(drawing, item.id + ' desktop labels');
      await pupil.setViewportSize({ width: 320, height: 844 });
      await trainerEvidence(pupil, item.contentId + '-model-320');
      await fits(pupil, true);
      await diagramFits(drawing, item.id + ' mobile labels');
      evidence.diagram = 'passed'; writeReport();
      await pupil.setViewportSize({ width: 1360, height: 1000 });
      const selected = await frame(pupil).locator('[data-core-select]').first().getAttribute('data-core-select');
      await frame(pupil).locator('[data-core-select]').first().press('Space');
      await frame(pupil).locator('[data-core-next]').click(); await saved(pupil);
      await frame(pupil).locator('[data-core-next]').click(); await saved(pupil);
      await until(pupil, id, attempt => attempt.state.work.model?.revealed === 2 && attempt.state.work.model.selected === selected);
      await pupil.reload(); await ready(pupil);
      assert.equal(await frame(pupil).locator('[data-core-steps] li').count(), 2);
      assert.equal(await frame(pupil).locator('[data-core-select][aria-pressed=true]').getAttribute('data-core-select'), selected);

      await navigate(tutor, 'attempt=' + id); await ready(tutor); await waitWritable(tutor, false);
      assert.equal(await frame(tutor).locator('[data-core-drawing]').innerHTML(), await frame(pupil).locator('[data-core-drawing]').innerHTML());
      await tutor.locator('#trainer-control').click(); await waitWritable(tutor, true); await waitWritable(pupil, false);
      assert(await frame(pupil).locator('[data-core-next]').isDisabled(), 'Student cannot change the shared model during teacher control');
      await frame(tutor).locator('[data-core-clear]').click(); await saved(tutor);
      await until(tutor, id, attempt => attempt.state.work.model?.selected === null);
      await tutor.locator('#trainer-control').click(); await waitWritable(pupil, true); await waitWritable(tutor, false);
      assert.equal(await frame(pupil).locator('[data-core-next]').isDisabled(), false, 'Model controls return to the pupil after teacher handoff');
      evidence.modelReloadAndControl = 'passed'; writeReport();

      await frame(pupil).locator('[data-stage="2"]').click(); await saved(pupil);
      await mobileEvidence(pupil, item.contentId, 'condition');
      const before = await api(pupil, '/attempts/' + id), task = before.taskSpec.task, step = task.steps[0];
      const wrong = step.choices.find(choice => choice.value !== String(step.a) && typeof step.feedback?.[choice.value] === 'string');
      assert(wrong, 'The assigned variant includes a diagnosed wrong choice');
      await frame(pupil).locator('[data-answer-choice="' + wrong.value + '"]').click();
      await frame(pupil).locator('#answerForm button.primary').click(); await saved(pupil);
      const rejected = await until(pupil, id, attempt => attempt.state.work.attempted && attempt.state.view.feedback === step.feedback[wrong.value]);
      assert.equal(rejected.state.work.step, 0); assert.deepEqual(rejected.state.work.answers, []);
      assert.equal(await frame(pupil).locator('#feedback').innerText(), step.feedback[wrong.value]);
      assert.notEqual(rejected.outcome, 'independent', 'A diagnosed mistake never grants independent success');
      await mobileEvidence(pupil, item.contentId, 'wrong-feedback');
      evidence.wrongFeedback = 'passed'; writeReport();
      for (let index = 0; index < 2; index++) {
        await answerStep(pupil, task, index); await saved(pupil);
        await until(pupil, id, attempt => attempt.state.work.step === index + 1);
      }
      const prefix = await frame(pupil).locator('.steps li').allTextContents(); assert.equal(prefix.length, 2);
      await pupil.reload(); await ready(pupil);
      assert.deepEqual(await frame(pupil).locator('.steps li').allTextContents(), prefix, 'Accumulated reasoning survives reload');
      await mobileEvidence(pupil, item.contentId, 'guided');
      evidence.guidedReload = 'passed'; evidence.accumulatedSteps = prefix.length; writeReport();
      const history = await api(tutor, '/attempts/' + id + '/history');
      assert.equal(history.events.filter(event => event.type === 'check').length, 3, 'Wrong plus two correct answers produce exactly three receipts');
      await api(pupil, '/assignments/' + assignment.id + '/photos', { opId: uuid(), kind: 'solution',
        filename: 'synthetic-solution.png', mime: 'image/png', data: photo });
      await pupil.locator('[data-submit-attempt]').click();
      await pupil.waitForFunction(() => document.querySelector('[data-submit-attempt]')?.textContent === 'Работа сдана');
      const submitted = await api(tutor, '/attempts/' + id);
      assert.equal(submitted.submission.status, 'submitted'); assert.equal(submitted.assistance.teacher, true);
      assert.notEqual(submitted.outcome, 'independent');
      evidence.submission = 'passed'; writeReport();
      completed.push({ id, prefix, contentId: item.contentId });
    }
    await browser.close(); browser = null;
    await close(server); server = null; await close(trainerServer); trainerServer = null;
    store.close(); store = new LearningStore({ filePath, contracts });
    // Reattach the same DTO augmentation used by the production route, so the
    // reopened store includes submission metadata as well as raw attempt state.
    createTeachingRouter(createLearningApi({ store, publicOrigin: origin, secureCookies: false }));
    for (const { id, contentId } of completed) {
      const reopened = store.getAttempt(teacher, id);
      assert.equal(reopened.contentId, contentId); assert.equal(reopened.state.work.step, 2);
      assert.equal(reopened.state.work.answers.length, 2); assert.equal(reopened.submission.status, 'submitted');
      const evidence = report.samples.find(sample => sample.contentId === contentId);
      evidence.durableReopen = 'passed'; evidence.status = 'passed'; writeReport();
    }
    assert.deepEqual(errors, []); assert.deepEqual(external, []);
    report.status = 'passed'; writeReport();
    console.log('GRADE7_GEOMETRY_REBUILD_BROWSER_OK: 17 public sections, cabinet links and teacher selector, three module assignments through real HTTP/SQLite, subject feedback, cumulative diagrams/steps, control, reload, mobile labels and submitted work after reopening SQLite.');
  } finally {
    if (report.status !== 'passed') report.status = 'failed';
    for (const sample of report.samples) if (sample.status === 'running') sample.status = 'failed';
    writeReport();
    if (browser) await browser.close();
    await close(server); await close(trainerServer);
    if (store) store.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
