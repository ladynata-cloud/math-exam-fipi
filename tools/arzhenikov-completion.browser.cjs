'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {execFileSync} = require('node:child_process');
const {pathToFileURL} = require('node:url');
const {DomCourse, serveRepository} = require('./arzhenikov-courses.browser.cjs');
const {exerciseLesson} = require('./arzhenikov-arithmetic.browser.cjs');
const root = path.resolve(__dirname, '..');
const folder = 'trainers/oge-basics/multiplication-division';
const source = path.join(root, folder);
const E = require(path.join(source, 'arzhenikov-completion-engine.js'));
const B = require(path.join(source, 'arzhenikov-completion-bank.js'));
const tracks = ['arithmetic', 'written', 'fractions', 'decimals', 'connections', 'algebra', 'geometry']
  .map(id => require(path.join(source, 'arzhenikov-course-' + id + '.js')));
const lessons = tracks.flatMap(track => track.lessons);
const bridges = tracks.find(track => track.id === 'connections').lessons;
const courseKey = 'mathexam.arzhenikov.courses.v1';
const artifacts = path.resolve(process.env.ARZHENIKOV_COMPLETION_ARTIFACT_DIR || 'artifacts/arzhenikov-completion');
const selector = action => '[data-completion-action="' + action + '"]';

// Both adapters exercise the actual forms. Only persistence-failure and
// older-save fixtures seed storage; no fixture awards a completed result.
class DomAdapter {
  constructor(file) { this.flow = new DomCourse(file); }
  async load(hash = '#courses') { await this.flow.load(hash); }
  async eval(fn, value) {
    const result = await this.flow.window.eval('(' + fn.toString() + ')(' + JSON.stringify(value) + ')');
    return result === undefined ? undefined : JSON.parse(JSON.stringify(result));
  }
  async goto(hash) { await this.flow.goto(hash); }
  async reload() { await this.flow.reload(); }
  async action(action, prefix = 'completion') {
    const node = this.flow.node('[data-' + prefix + '-action="' + action + '"]');
    assert(!node.disabled, action + ': usable control'); node.click(); await this.flow.tick();
  }
  async fill(query, value, event = 'input') { await this.flow.fill(query, value, event); }
  async choose(query) { const node = this.flow.node(query); assert(!node.disabled); node.click(); await this.flow.tick(); }
  async follow(query) { this.flow.node(query).click(); await this.flow.tick(); await this.flow.tick(); }
  async close() { this.flow.close(); }
}
class BrowserAdapter {
  constructor(page, url) { this.page = page; this.url = url; }
  async load(hash = '#courses') { await this.page.goto(this.url + hash); }
  async eval(fn, value) { return this.page.evaluate(fn, value); }
  async goto(hash) {
    await this.page.evaluate(hash => { location.hash = hash; }, hash);
    await this.page.evaluate(() => new Promise(resolve => setTimeout(resolve, 0)));
  }
  async reload() { await this.page.reload(); }
  async action(action, prefix = 'completion') {
    const node = this.page.locator('#arz-courses [data-' + prefix + '-action="' + action + '"]');
    await node.press('Enter');
  }
  async fill(query, value, event = 'input') {
    const node = this.page.locator('#arz-courses ' + query); await node.fill(String(value));
    if (event === 'change') await node.press('Tab');
  }
  async choose(query) { await this.page.locator('#arz-courses ' + query).check(); }
  async follow(query) {
    await this.page.locator('#arz-courses ' + query).click();
    await this.page.evaluate(() => new Promise(resolve => setTimeout(resolve, 0)));
  }
  async close() { await this.page.context().close(); }
}
const read = flow => flow.eval(key => JSON.parse(localStorage.getItem(key)), E.key);
const courses = flow => flow.eval(key => JSON.parse(localStorage.getItem(key)), courseKey);
const text = flow => flow.eval(() => document.getElementById('arz-courses').textContent);
const exists = (flow, query) => flow.eval(query => Boolean(document.querySelector('#arz-courses ' + query)), query);
const otherStorage = flow => flow.eval(key => Object.fromEntries(Object.keys(localStorage).filter(name => name !== key).sort()
  .map(name => [name, localStorage.getItem(name)])), E.key);
const itemFor = async flow => {
  const state = await read(flow), session = state.sessions[state.active], id = session.itemIds[session.cursor];
  return B.withLessons(lessons, await courses(flow) || {}).items.find(item => item.id === id);
};
async function report(flow, mode) {
  return E.summary(await read(flow), B.withLessons(lessons, await courses(flow) || {}), mode);
}
async function solveAssessment(flow, item = null) {
  item ||= await itemFor(flow);
  const state = await read(flow), entry = state.sessions[state.active].entries[item.id];
  if (!entry.solved) { await flow.fill('#completion-answer', item.answer); await flow.action('answer'); }
  if (item.reason && !entry.reason.solved) {
    await flow.choose('input[name="completion-reason"][value="' + item.reason.answer + '"]'); await flow.action('reason');
  }
  assert(await exists(flow, selector('next')), item.id + ': accepted through the public form');
  await flow.action('next');
}
async function finishAssessment(flow) {
  let count = 0;
  while (await exists(flow, '#completion-answer')) {
    assert(count++ < 32, 'assessment queue terminates'); await solveAssessment(flow);
  }
}
async function startCourse(flow, id) {
  await flow.goto('#course-' + id);
  await flow.action('start', 'course');
  assert.equal(await flow.eval(() => document.getElementById('arz-courses').dataset.coursePhase), 'task');
}

async function assessmentFlow(flow) {
  await flow.load();
  await flow.eval(() => localStorage.setItem('mathexam.completion-test.sentinel', 'old-state-retained'));
  const before = await otherStorage(flow);
  await flow.goto('#course-check-review');
  assert.match(await text(flow), /Сначала начни любой урок/);
  assert.equal(await exists(flow, selector('start')), false, 'no review of unvisited lessons');
  await flow.goto('#course-a-groups'); // Reading an introduction is not a lesson start.
  await flow.goto('#course-check-review');
  assert.equal(await exists(flow, selector('start')), false);

  await flow.goto('#course-check-placement'); await flow.action('start');
  let saved = await read(flow), session = saved.sessions.placement;
  assert.equal(session.itemIds.length, 8);
  const order = [...session.itemIds], first = await itemFor(flow);
  assert(await exists(flow, selector('hint'))); assert(await exists(flow, selector('solution')));
  assert.equal(await exists(flow, '#course-step-answer'), false, 'no prefilled algorithm in a new check');
  await flow.action('hint'); await flow.fill('#completion-answer', '2/'); await flow.action('answer');
  assert(!/\d/.test(await flow.eval(() => document.getElementById('completion-feedback').textContent)), 'format guidance is neutral and reveals no worked numerical answer');
  await flow.reload();
  saved = await read(flow);
  assert.deepEqual(saved.sessions.placement.itemIds, order);
  assert.equal(saved.sessions.placement.entries[first.id].input, '2/');
  assert.equal(saved.sessions.placement.entries[first.id].help.hint, true);
  assert.equal(saved.sessions.placement.entries[first.id].attempts, 0);
  await solveAssessment(flow, first);

  const second = await itemFor(flow); assert(second.reason, 'the second anchor tests the meaning of the given number');
  await flow.fill('#completion-answer', '999999'); await flow.action('answer');
  assert.equal((await read(flow)).sessions.placement.entries[second.id].firstCorrect, false);
  assert.equal(await exists(flow, '[data-completion-help]'), false, 'wrong feedback does not automatically reveal help');
  await flow.reload(); await flow.fill('#completion-answer', second.answer); await flow.action('answer');
  const wrongReason = second.reason.options.find(option => option.id !== second.reason.answer).id;
  await flow.choose('input[name="completion-reason"][value="' + wrongReason + '"]'); await flow.action('reason');
  await flow.reload();
  assert.equal((await read(flow)).sessions.placement.entries[second.id].reason.firstCorrect, false);
  assert.equal((await read(flow)).sessions.placement.entries[second.id].reason.choice, wrongReason);
  await solveAssessment(flow, second);

  const third = await itemFor(flow); await flow.action('skip'); await flow.action('next');
  const interrupted = await read(flow), resumeOrder = interrupted.sessions.placement.itemIds;
  await flow.fill('#completion-answer', '7/'); await flow.goto('#courses');
  assert.match(await text(flow), /Продолжить: С чего мне начать/);
  await flow.goto('#course-check-placement'); await flow.reload();
  assert.deepEqual((await read(flow)).sessions.placement.itemIds, resumeOrder);
  assert.equal(await flow.eval(() => document.querySelector('#completion-answer').value), '7/');
  await finishAssessment(flow);
  let result = await report(flow, 'placement');
  assert.equal(result.total, 8); assert.equal(result.correct, 7); assert.equal(result.independent, 5);
  assert.equal(result.skipped, 1); assert.equal(result.corrected, 1); assert.equal(result.helped, 1);
  for (const item of [first, second, third]) assert(await exists(flow, '.completion-recommendations a[href="#course-' + item.lessonId + '"]'));
  const firstHistory = (await read(flow)).history[second.id].first;
  assert.deepEqual(await otherStorage(flow), before, 'assessment actions do not alter course or legacy game saves');

  await flow.action('repeat');
  assert((await read(flow)).sessions.placement.itemIds.every(id => !order.includes(id)), 'the second eight-item entry form uses the remaining conditions');
  await finishAssessment(flow); result = await report(flow, 'placement');
  assert.equal(result.independent, 8); assert.equal(result.familiar, 0);
  assert.deepEqual((await read(flow)).history[second.id].first, firstHistory);

  await flow.goto('#course-check-final'); await flow.action('start');
  assert.equal((await read(flow)).sessions.final.itemIds.length, 16);
  assert.equal(await exists(flow, '.course-model'), false);
  assert.equal(await exists(flow, '#course-step-answer'), false);
  await finishAssessment(flow); result = await report(flow, 'final');
  assert.equal(result.correct, 16); assert.equal(result.independent, 16); assert.equal(result.skipped, 0);
  assert.equal(result.reasonCorrect, result.reasonTotal);
  const finalFirst = (await read(flow)).history[result.results[0].id].first;
  await flow.action('repeat'); assert(await exists(flow, '.completion-familiar'));
  await finishAssessment(flow); result = await report(flow, 'final');
  assert.equal(result.independent, 0); assert.equal(result.familiar, 16);
  assert.deepEqual((await read(flow)).history[result.results[0].id].first, finalFirst);
  assert.deepEqual(await otherStorage(flow), before, 'final transfer does not award old lessons or replace older saves');

  await flow.goto('#journey');
  assert.equal(await flow.eval(() => document.getElementById('arz-courses').hidden), true, 'return to the preserved map');
  await startCourse(flow, 'a-groups');
  const course = lessons.find(lesson => lesson.id === 'a-groups');
  const control = course.tasks[0].model.controls.find(control => control.min !== control.max);
  await flow.fill('[data-course-control="' + control.id + '"]', control.target, 'change');
  await flow.reload();
  assert.equal((await courses(flow)).lessons[course.id].tasks[course.tasks[0].id].model[control.id], control.target);
  await flow.goto('#course-check-review'); await flow.action('start');
  const one = (await read(flow)).sessions.review;
  assert.equal(one.itemIds.length, 1); assert.equal((await itemFor(flow)).lessonId, 'a-groups');
  const courseBeforeReview = await courses(flow); await finishAssessment(flow);
  assert.deepEqual(await courses(flow), courseBeforeReview);
  await startCourse(flow, 'a-share');
  await flow.goto('#course-check-review'); await flow.action('repeat');
  const two = (await read(flow)).sessions.review;
  assert.equal(two.itemIds.length, 2);
  const expanded = B.withLessons(lessons, await courses(flow));
  assert.deepEqual(two.itemIds.map(id => expanded.items.find(item => item.id === id).lessonId).sort(), ['a-groups', 'a-share']);
  await finishAssessment(flow);
  return {placement: 16, final: 16, review: 3};
}

async function lessonAndKnownReviewFlow(flow) {
  await flow.load();
  let steps = 0;
  for (const lesson of bridges) steps += (await flow.eval(exerciseLesson, lesson)).steps;
  const before = await courses(flow); await flow.reload(); const after = await courses(flow);
  for (const lesson of bridges) {
    assert(after.lessons[lesson.id].reviewedAt); assert.equal(after.lessons[lesson.id].reviewedAt, before.lessons[lesson.id].reviewedAt);
  }
  assert.equal(await flow.eval(() => window.ArzhenikovCoursesProgress().total), lessons.length);
  assert.equal(await flow.eval(() => window.ArzhenikovCoursesProgress().completed.length), bridges.length);
  await flow.goto('#journey-connections');
  assert.match(await flow.eval(() => document.getElementById('journey-map').textContent), /Связываем навыки/);
  await flow.goto('#courses');
  return {lessons: bridges.length, tasks: bridges.reduce((sum, lesson) => sum + lesson.tasks.length, 0), steps};
}
async function knownCourseReview(flow) {
  await flow.load();
  const lesson = lessons.find(lesson => lesson.id === 'a-count');
  await flow.eval(exerciseLesson, lesson);
  const original = await courses(flow);
  await flow.goto('#course-check-review'); await flow.action('start');
  assert.match(await text(flow), /Ты уже встречал это условие/);
  const item = await itemFor(flow); assert(item.sourceTaskId); assert.equal(item.lessonId, 'a-count');
  await solveAssessment(flow);
  const result = await report(flow, 'review');
  assert.equal(result.correct, 1); assert.equal(result.independent, 0); assert.equal(result.familiar, 1);
  assert.deepEqual(await courses(flow), original, 'reusing a course question never rewrites its original evidence');
}
async function corruptStorageFlow(flow) {
  await flow.load();
  const finalItem = B.items.find(item => item.pool === 'final');
  const saved = E.fresh(); E.start(saved,{mode:'final',itemIds:[finalItem.id],now:123},B);
  const damaged = [null, {}, {[finalItem.id]:{id:'lost'}}].map(entries =>
    JSON.stringify({...saved,sessions:{...saved.sessions,final:{...saved.sessions.final,entries}}}));
  for (const raw of ['{unreadable assessment save', JSON.stringify({version:1,sessions:'lost',history:{}}),
    JSON.stringify({version:1,sessions:{},history:42}), ...damaged]) {
    await flow.eval(({key,raw}) => localStorage.setItem(key,raw), {key:E.key,raw});
    await flow.reload(); await flow.goto('#course-check-placement');
    assert.match(await text(flow), /прежняя запись остаётся без изменений/);
    await flow.action('start'); await flow.action('hint');
    await flow.fill('#completion-answer', B.items.find(item => item.placementOrder === 0 && item.pool === 'placement').answer);
    await flow.action('answer'); await flow.action('next');
    assert.equal(await flow.eval(key => localStorage.getItem(key), E.key), raw);
    assert.match(await text(flow), /Задача 2 из 8/);
  }
}
async function olderSaveFlow(flow) {
  await flow.load('#course-check-placement'); await flow.action('start');
  const item = await itemFor(flow);
  await flow.fill('#completion-answer','2/');
  const saved = await read(flow);
  // Older v1 records need not contain the separately tracked help/reason timing.
  for (const session of Object.values(saved.sessions)) if (session) {
    for (const entry of Object.values(session.entries)) delete entry.helpAtReason;
  }
  for (const history of Object.values(saved.history)) {
    if (history.first) delete history.first.helpAtReason;
    if (history.latest) delete history.latest.helpAtReason;
  }
  const raw = JSON.stringify(saved);
  await flow.eval(({key,raw}) => localStorage.setItem(key,raw),{key:E.key,raw});
  await flow.reload();
  assert.doesNotMatch(await text(flow), /прежняя запись остаётся без изменений/);
  assert.equal(await flow.eval(() => document.getElementById('completion-answer').value),'2/');
  await flow.fill('#completion-answer',item.answer); await flow.action('answer');
  const restored = await read(flow);
  assert.equal(restored.sessions.placement.entries[item.id].solved,true);
  assert.equal(restored.sessions.placement.entries[item.id].firstHelpUsed,false);
  assert.notEqual(await flow.eval(key => localStorage.getItem(key),E.key),raw,'a valid older save remains writable');
}
async function lessonLinkHelpFlow(flow) {
  await flow.load('#course-check-placement'); await flow.action('start');
  const item = await itemFor(flow);
  assert.equal((await read(flow)).sessions.placement.entries[item.id].helpUsed, false);
  await flow.follow('a[href="#course-' + item.lessonId + '"]');
  assert.equal(await flow.eval(() => document.getElementById('arz-courses').dataset.coursePhase), 'intro');
  assert.equal((await read(flow)).sessions.placement.entries[item.id].helpUsed, true,
    'opening the lesson worked example during a check records help before navigation');
  await flow.goto('#course-check-placement'); await flow.reload();
  assert.equal((await read(flow)).sessions.placement.entries[item.id].helpUsed, true);
  await solveAssessment(flow, item);
  const entry = (await read(flow)).sessions.placement.entries[item.id];
  assert.equal(entry.firstCorrect, true); assert.equal(entry.firstHelpUsed, true);
  assert.equal((await report(flow, 'placement')).independent, 0);
}
async function indirectLessonHelpFlow(flow) {
  await flow.load('#course-check-placement'); await flow.action('start');
  const first = await itemFor(flow);
  async function viaOverview(lessonId) {
    await flow.follow('.course-actions a[href="#courses"]');
    const track = tracks.find(value => value.lessons.some(lesson => lesson.id === lessonId));
    await flow.follow('.course-track-card[href="#courses-' + track.id + '"]');
    await flow.follow('.course-lesson-card[href="#course-' + lessonId + '"]');
    assert(await exists(flow,'.course-example'),'the lesson worked example is actually displayed');
  }
  const unrelated = tracks.find(track => track.id === 'geometry').lessons[0].id;
  await viaOverview(unrelated);
  assert.equal((await read(flow)).sessions.placement.entries[first.id].helpUsed,false,'unrelated browsing is neutral');
  await flow.follow('a.course-return[href="#course-check-placement"]');
  await viaOverview(first.lessonId); await flow.reload();
  assert.equal((await read(flow)).sessions.placement.entries[first.id].helpUsed,true,'same-topic help survives the indirect route and reload');
  await flow.follow('a.course-return[href="#course-check-placement"]'); await solveAssessment(flow,first);
  let entry = (await read(flow)).sessions.placement.entries[first.id];
  assert.equal(entry.firstCorrect,true); assert.equal(entry.firstHelpUsed,true);
  assert.equal((await report(flow,'placement')).independent,0);

  const second = await itemFor(flow); assert(second.reason,'the next entry separates numerical and explanation evidence');
  await flow.fill('#completion-answer',second.answer); await flow.action('answer');
  entry = (await read(flow)).sessions.placement.entries[second.id];
  assert.equal(entry.firstHelpUsed,false);
  await viaOverview(second.lessonId); await flow.follow('a.course-return[href="#course-check-placement"]');
  await flow.reload(); await solveAssessment(flow,second);
  entry = (await read(flow)).sessions.placement.entries[second.id];
  assert.equal(entry.firstCorrect,true); assert.equal(entry.firstHelpUsed,false,'later study cannot rewrite the first numerical answer');
  assert.equal(entry.reason.firstCorrect,true); assert.equal(entry.reason.firstHelpUsed,true);
  assert.equal((await report(flow,'placement')).reasonIndependent,0);
}
function unpack() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'arz-completion-offline-'));
  execFileSync('python3', ['-c', 'import sys,zipfile;zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])', path.join(source, 'arzhenikov-offline.zip'), directory]);
  for (const name of ['arzhenikov-completion.js', 'arzhenikov-completion-engine.js', 'arzhenikov-completion-bank.js', 'arzhenikov-course-connections.js']) {
    assert.equal(fs.readFileSync(path.join(directory, name), 'utf8'), fs.readFileSync(path.join(source, name), 'utf8'), name + ': offline is the reviewed public code');
  }
  return directory;
}
async function offlineFlow(flow) {
  await flow.load('#course-check-final'); await flow.action('start');
  const item = await itemFor(flow); await flow.action('solution'); await flow.reload();
  assert(await exists(flow, '[data-completion-help="solution"]'));
  await solveAssessment(flow, item);
  await flow.goto('#course-check-placement'); await flow.action('start');
  assert.equal((await read(flow)).sessions.placement.itemIds.length, 8);
  await flow.goto('#course-' + bridges[0].id);
  assert(await exists(flow, '[data-course-action="start"]'));
  assert.equal(await flow.eval(() => window.ArzhenikovCoursesProgress().total), lessons.length);
}

async function domGate() {
  for (const work of [assessmentFlow, lessonAndKnownReviewFlow, knownCourseReview, corruptStorageFlow, olderSaveFlow, lessonLinkHelpFlow, indirectLessonHelpFlow]) {
    const flow = new DomAdapter();
    try { await work(flow); assert.deepEqual(flow.flow.errors, []); } finally { await flow.close(); }
  }
  const directory = unpack(), flow = new DomAdapter(path.join(directory, 'index.html'));
  try { await offlineFlow(flow); assert.deepEqual(flow.flow.errors, []); }
  finally { await flow.close(); fs.rmSync(directory, {recursive: true, force: true}); }
  console.log('ARZHENIKOV_COMPLETION_DOM_PASS: all six bridge lessons / 48 conditions / six explanations; two eight-item entry forms and 16 final conditions plus familiar replay; review 0/1/2 visited topics; early help and lesson-link help, sticky first errors/reasons, neutral format feedback, resume, skips, familiar conditions, unchanged old saves, corrupt-storage protection and exact offline package. Real layout, keyboard and HTTP-blocking checks were not run in DOM mode.');
}
async function geometry(page, label) {
  const result = await page.evaluate(() => {
    const host = document.getElementById('arz-courses'), bounds = host.getBoundingClientRect();
    return {width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
      overflow: [...host.querySelectorAll('input,button,fieldset,progress,.completion-fraction,.completion-prompt,.course-result')].flatMap(node => {
        const r = node.getBoundingClientRect();
        return r.width && r.height && (r.left < bounds.left - 1 || r.right > bounds.right + 1) ? [{tag: node.tagName, left: r.left, right: r.right}] : [];
      })};
  });
  assert(result.scrollWidth <= result.width + 1, label + ': no horizontal page overflow');
  assert.deepEqual(result.overflow, [], label + ': controls fit their course panel');
  await page.locator('#arz-courses').screenshot({path: path.join(artifacts, label + '.png')});
}
async function visualFlow(browser, url, width) {
  const context = await browser.newContext({viewport: {width, height: 950}, reducedMotion: 'reduce'});
  const page = await context.newPage(), flow = new BrowserAdapter(page, url), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await flow.load(); await geometry(page, 'overview-' + width);
    await flow.goto('#course-check-placement'); await geometry(page, 'placement-intro-' + width);
    await flow.action('start'); await flow.action('solution'); await geometry(page, 'help-before-answer-' + width);
    await solveAssessment(flow); const second = await itemFor(flow);
    await flow.fill('#completion-answer', second.answer); await flow.action('answer');
    assert(await exists(flow, '[name="completion-reason"]')); await geometry(page, 'meaning-check-' + width);
    await solveAssessment(flow, second); await solveAssessment(flow); await solveAssessment(flow);
    assert(await exists(flow, '.completion-fraction')); await geometry(page, 'fraction-check-' + width);
    await finishAssessment(flow); await geometry(page, 'placement-result-' + width);
    await flow.goto('#course-check-final'); await flow.action('start'); await geometry(page, 'final-' + width);
    await flow.goto('#course-' + bridges[0].id); await flow.action('start', 'course');
    await geometry(page, 'bridge-model-' + width);
    await page.goBack(); assert.match(await text(flow), /Применить всё вместе/);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
}
async function realBrowserGate() {
  fs.mkdirSync(artifacts, {recursive: true});
  const {chromium} = require('playwright'), hosted = await serveRepository();
  let browser;
  try {
    browser = await chromium.launch();
    for (const work of [assessmentFlow, lessonAndKnownReviewFlow, knownCourseReview, corruptStorageFlow, olderSaveFlow, lessonLinkHelpFlow, indirectLessonHelpFlow]) {
      const context = await browser.newContext({viewport: {width: 1280, height: 950}, reducedMotion: 'reduce'});
      const page = await context.newPage(), errors = []; page.on('pageerror', error => errors.push(error.message));
      const flow = new BrowserAdapter(page, hosted.url);
      try { await work(flow); assert.deepEqual(errors, []); }
      catch (error) { await page.screenshot({path: path.join(artifacts, 'failure-' + work.name + '.png'), fullPage: true}).catch(() => {}); throw error; }
      finally { await context.close(); }
    }
    for (const width of [320, 390, 1280]) await visualFlow(browser, hosted.url, width);
    const directory = unpack(), context = await browser.newContext({viewport: {width: 390, height: 950}, reducedMotion: 'reduce'});
    const requests = [], failures = [], errors = [];
    await context.route(/^https?:\/\//, route => { requests.push(route.request().url()); return route.abort(); });
    const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message)); page.on('requestfailed', request => failures.push(request.url()));
    try {
      await offlineFlow(new BrowserAdapter(page, pathToFileURL(path.join(directory, 'index.html')).href));
      assert.deepEqual(requests, [], 'offline makes no HTTP requests'); assert.deepEqual(failures, [], 'all offline resources exist'); assert.deepEqual(errors, []);
      await geometry(page, 'offline-390');
    } finally { await context.close(); fs.rmSync(directory, {recursive: true, force: true}); }
    console.log('ARZHENIKOV_COMPLETION_BROWSER_PASS: six complete bridge lessons; entry/final/review UI; real input and keyboard; help/errors/reasons, resume and old saves; 320/390/1280 screenshots and offline with HTTP blocked.');
  } catch (error) {
    fs.writeFileSync(path.join(artifacts, 'failure.txt'), String(error.stack || error)); throw error;
  } finally {
    if (browser) await browser.close(); await new Promise(resolve => hosted.server.close(resolve));
  }
}
if (require.main === module) (process.argv.includes('--dom') ? domGate() : realBrowserGate()).catch(error => { console.error(error); process.exitCode = 1; });
module.exports = {DomAdapter, assessmentFlow, lessonAndKnownReviewFlow, knownCourseReview, corruptStorageFlow, olderSaveFlow, lessonLinkHelpFlow, indirectLessonHelpFlow};
