'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {execFileSync} = require('node:child_process');
const {pathToFileURL} = require('node:url');
const {DomCourse, answerFor, serveRepository} = require('./arzhenikov-courses.browser.cjs');

const root = path.resolve(__dirname, '..');
const folder = 'trainers/oge-basics/multiplication-division';
const key = 'mathexam.arzhenikov.courses.v1';
const tracks = ['arithmetic', 'written', 'fractions', 'decimals', 'algebra', 'geometry']
  .map(name => require(path.join(root, folder, 'arzhenikov-course-' + name + '.js')));
const lessons = tracks.flatMap(track => track.lessons);
const counting = lessons.find(lesson => lesson.id === 'a-count');
const fractions = lessons.find(lesson => lesson.id === 'f-add');
const artifacts = path.resolve(process.env.ARZHENIKOV_ASSISTANT_ARTIFACT_DIR || 'artifacts/arzhenikov-assistant');
const snapshot = value => JSON.parse(JSON.stringify(value));
const taskRecord = (state, lesson, index) => state.lessons[lesson.id].tasks[lesson.tasks[index].id];

async function openDom(flow) {
  const details = flow.node('.course-assistant');
  if (!details.open) { details.querySelector('summary').click(); await flow.tick(); }
  assert.equal(details.open, true);
}
async function askDom(flow, action) {
  await openDom(flow);
  flow.node('[data-assistant-action="' + action + '"]').click();
  await flow.tick();
  assert(flow.node('.course-assistant-reply').textContent.trim(), 'The pupil sees an actual reply');
}

async function domGate() {
  const flow = new DomCourse();
  try {
    await flow.load('#course-a-count');
    flow.window.localStorage.setItem('mathexam.assistant-qa.unrelated', 'preserved');
    await flow.action('start');
    assert.equal(flow.node('.course-assistant').open, false, 'Help starts collapsed');
    assert(flow.node('.course-assistant').classList.contains('ym-hide-content'), 'Conversation is excluded from session-replay content');
    assert.equal(flow.node('#course-assistant-message').maxLength, 400, 'The field and dialogue use the same message limit');
    const before = snapshot(taskRecord(flow.getState(), counting, 0));
    await openDom(flow);
    assert.deepEqual(taskRecord(flow.getState(), counting, 0), before, 'Opening help is not assistance or an attempt');

    // A real save event must precede the first visible mathematical reply.
    const order = [];
    const observe = () => order.push({help: taskRecord(flow.getState(), counting, 0).helpUsed,
      reply: flow.node('.course-assistant-reply').textContent});
    flow.window.addEventListener('courses-progress', observe);
    await askDom(flow, 'start');
    flow.window.removeEventListener('courses-progress', observe);
    assert(order.some(item => item.help && item.reply === ''), 'Help attribution is saved before the reply appears');
    const helped = taskRecord(flow.getState(), counting, 0);
    assert.deepEqual(helped, {...before, helpUsed: true}, 'The assistant changes only assistance attribution');
    assert(flow.node('.course-help-record').textContent.includes('использована помощь'), 'Attribution is visible immediately');
    assert.equal(flow.getProgress().completed.length, 0, 'A conversation never completes a lesson');

    await flow.model(counting.tasks[0]);
    await flow.fill('#course-answer', answerFor(counting.tasks[0]));
    await flow.action('check-answer');
    assert.equal(taskRecord(flow.getState(), counting, 0).firstHelpUsed, true);
    await flow.reload();
    const accepted = snapshot(taskRecord(flow.getState(), counting, 0));
    await askDom(flow, 'why');
    assert.deepEqual(taskRecord(flow.getState(), counting, 0), accepted, 'Discussing a checked answer cannot rewrite the attempt');
    await flow.action('next-task');
    assert.equal(flow.node('.course-assistant-reply').textContent, '', 'Conversation resets for another task');

    for (let index = 1; index < 4; index++) await flow.solve(counting, index);
    await askDom(flow, 'simpler');
    await flow.fill('#course-answer', answerFor(counting.tasks[4]));
    await flow.action('check-answer');
    assert.equal(taskRecord(flow.getState(), counting, 4).firstHelpUsed, true, 'Independent checks record assistance');
    await flow.action('next-task');
    await flow.fill('#course-answer', answerFor(counting.tasks[5]) + 1);
    await flow.action('check-answer');
    const firstError = snapshot(taskRecord(flow.getState(), counting, 5));
    assert.equal(firstError.firstCorrect, false);
    assert.equal(firstError.firstHelpUsed, false);
    await askDom(flow, 'why');
    assert.deepEqual(taskRecord(flow.getState(), counting, 5), {...firstError, helpUsed: true}, 'Help after an error preserves the original evidence');
    await flow.reload();
    assert.equal(taskRecord(flow.getState(), counting, 5).firstHelpUsed, false);
    assert.equal(taskRecord(flow.getState(), counting, 5).firstCorrect, false);
    assert.equal(flow.window.localStorage.getItem('mathexam.assistant-qa.unrelated'), 'preserved');

    await flow.goto('#course-f-add'); await flow.action('start');
    const captured = [];
    const dialogue = flow.window.ArzhenikovAssistantDialogue;
    const originalContext = dialogue.context;
    dialogue.context = input => { const result = originalContext(input); captured.push(snapshot(result)); return result; };
    const firstControl = fractions.tasks[0].model.controls[0];
    await flow.fill('[data-course-control="' + firstControl.id + '"]', firstControl.target, 'change');
    await askDom(flow, 'start');
    assert.equal(captured.at(-1).model.controls.find(control => control.id === firstControl.id).value, firstControl.target,
      'A model edit is read even when it did not rerender the helper');
    await flow.model(fractions.tasks[0]);
    await flow.fill('#course-step-answer', '2/8');
    const untouchedStep = snapshot(taskRecord(flow.getState(), fractions, 0));
    await askDom(flow, 'check');
    assert.equal(captured.at(-1).currentStep.input, '2/8', 'The current text field reaches the current-step helper');
    assert.deepEqual(taskRecord(flow.getState(), fractions, 0), untouchedStep, 'Checking a draft through the helper does not submit it');
    const firstFrame = flow.node('.course-assistant').dataset.assistantFrame;
    await flow.fill('#course-step-answer', '1/8');
    assert.equal(flow.node('.course-assistant-reply').textContent, '', 'An old verdict clears when its input changes');
    await flow.action('check-step');
    assert.equal(flow.node('.course-assistant-reply').textContent, '', 'A newly accepted step resets the dialogue');
    await askDom(flow, 'start');
    assert.notEqual(flow.node('.course-assistant').dataset.assistantFrame, firstFrame, 'Help follows the next intermediate step');
    assert(flow.node('.course-assistant-scope').textContent.includes(fractions.tasks[0].steps[1].label));
    await flow.fill('[data-course-control="parts"]', 9, 'change');
    assert.equal(flow.node('.course-assistant').dataset.assistantPhase, 'model', 'Model changes reopen the correct helper phase');
    assert.equal(flow.node('.course-assistant-reply').textContent, '', 'A previous step reply cannot remain after the model gate reopens');
    assert(flow.node('.course-assistant-scope').textContent.includes('модели'));
    dialogue.context = originalContext;

    await flow.fill('#course-assistant-message', '<img src=x onerror=alert(1)>');
    await askDom(flow, 'ask');
    assert.equal(flow.node('.course-assistant').querySelectorAll('img,script,iframe').length, 0, 'Typed text is never rendered as HTML');
    const serialized = JSON.stringify(flow.getState());
    assert(!serialized.includes('onerror') && !serialized.includes('Почему так?'), 'Dialogue is not persisted with course progress');

    // Every course lesson mounts the same help through its actual route.
    for (const lesson of lessons) {
      if ([counting.id, fractions.id].includes(lesson.id)) continue;
      await flow.goto('#course-' + lesson.id); await flow.action('start');
      assert.equal(flow.node('.course-assistant').dataset.assistantTask, lesson.tasks[0].id);
      assert.equal(flow.node('.course-assistant').open, false);
    }
    assert.deepEqual(flow.errors, []);
  } finally { flow.close(); }
  console.log('ARZHENIKOV_ASSISTANT_DOM_PASS: 76 lesson routes; no-help opening; save-before-reply; first-attempt preservation; current model/input/step; no automatic solving; text-only rendering; no saved conversation.');
}

const control = (page, action) => page.locator('#arz-courses [data-course-action="' + action + '"]');
const assistant = page => page.locator('#arz-courses .course-assistant');
async function state(page) { return page.evaluate(key => JSON.parse(localStorage.getItem(key)), key); }
async function openBrowser(page) {
  const summary = assistant(page).locator('summary');
  if (!await assistant(page).evaluate(node => node.open)) await summary.press('Enter');
  assert(await assistant(page).evaluate(node => node.open), 'Keyboard opens local help');
}
async function askBrowser(page, action) {
  await openBrowser(page);
  await page.locator('[data-assistant-action="' + action + '"]').press('Enter');
  assert((await page.locator('.course-assistant-reply').innerText()).trim());
}
async function modelBrowser(page, task) {
  for (const item of task.model.controls) {
    if (item.min === item.max) continue;
    const input = page.locator('[data-course-control="' + item.id + '"]');
    await input.fill(String(item.target)); await input.press('Tab');
  }
  await control(page, 'check-model').press('Enter');
}
async function geometry(page, name) {
  const layout = await assistant(page).evaluate(panel => {
    const width = innerWidth;
    return {overflow: document.documentElement.scrollWidth > width + 1,
      clipped: [...panel.querySelectorAll('summary,textarea,button,.course-assistant-reply')].filter(node => {
        const rect = node.getBoundingClientRect();
        return rect.width && (rect.left < -1 || rect.right > width + 1);
      }).map(node => node.tagName),
      smallControls: [...panel.querySelectorAll('summary,button')].filter(node => node.getBoundingClientRect().height < 44).length};
  });
  assert.deepEqual(layout, {overflow: false, clipped: [], smallControls: 0}, name + ': readable controls fit the viewport');
  await page.screenshot({path: path.join(artifacts, name + '.png'), fullPage: true});
}
async function browserScenario(browser, url, width, offline = false) {
  const context = await browser.newContext({viewport: {width, height: 900}, reducedMotion: 'reduce'});
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  const errors = [], failures = [], requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => { if (request.url().startsWith('file:')) failures.push(request.url()); });
  const origin = offline ? '' : new URL(url).origin;
  await context.route(/^https?:\/\//, route => {
    requests.push(route.request().url());
    return !offline && new URL(route.request().url()).origin === origin ? route.continue() : route.abort();
  });
  try {
    await page.goto(url + '#course-a-count'); await control(page, 'start').press('Enter');
    await page.evaluate(() => localStorage.setItem('mathexam.assistant-qa.unrelated', 'preserved'));
    const before = taskRecord(await state(page), counting, 0);
    await openBrowser(page);
    assert.deepEqual(taskRecord(await state(page), counting, 0), before, 'Opening does not count as help');
    const networkBefore = requests.length;
    await askBrowser(page, 'start');
    const after = taskRecord(await state(page), counting, 0);
    assert.deepEqual(after, {...before, helpUsed: true});
    assert.equal(requests.length, networkBefore, 'Asking the helper sends no network request');
    await geometry(page, (offline ? 'offline-' : 'online-') + width);
    await modelBrowser(page, counting.tasks[0]);
    await page.locator('#course-answer').fill(String(answerFor(counting.tasks[0])));
    await control(page, 'check-answer').press('Enter');
    await page.reload();
    assert.equal(taskRecord(await state(page), counting, 0).firstHelpUsed, true, 'Assisted first answer survives reload');
    await control(page, 'next-task').press('Enter'); await modelBrowser(page, counting.tasks[1]);
    await page.locator('#course-answer').fill(String(answerFor(counting.tasks[1]) + 1));
    await control(page, 'check-answer').press('Enter');
    const firstError = taskRecord(await state(page), counting, 1);
    await askBrowser(page, 'why');
    assert.deepEqual(taskRecord(await state(page), counting, 1), {...firstError, helpUsed: true});
    assert.equal(firstError.firstCorrect, false); assert.equal(firstError.firstHelpUsed, false);

    await page.goto(url + '#course-f-add'); await control(page, 'start').press('Enter');
    await modelBrowser(page, fractions.tasks[0]);
    await page.locator('#course-step-answer').fill('2/8');
    const draft = taskRecord(await state(page), fractions, 0);
    await askBrowser(page, 'check');
    assert.deepEqual(taskRecord(await state(page), fractions, 0), {...draft, helpUsed: true}, 'Helper feedback does not submit the written step');
    const frame = await assistant(page).getAttribute('data-assistant-frame');
    await page.locator('#course-step-answer').fill('1/8');
    assert.equal(await page.locator('.course-assistant-reply').innerText(), '', 'A stale verdict clears while the pupil edits');
    await control(page, 'check-step').press('Enter');
    await askBrowser(page, 'start');
    assert.notEqual(await assistant(page).getAttribute('data-assistant-frame'), frame);
    assert((await page.locator('.course-assistant-scope').innerText()).includes('Вторая величина'));
    await geometry(page, (offline ? 'offline-fraction-' : 'online-fraction-') + width);
    await page.locator('[data-course-control="parts"]').fill('9');
    await page.locator('[data-course-control="parts"]').press('Tab');
    assert.equal(await assistant(page).getAttribute('data-assistant-phase'), 'model');
    assert.equal(await page.locator('.course-assistant-reply').innerText(), '', 'Model gate clears stale mathematical help');
    assert.equal(await page.evaluate(() => localStorage.getItem('mathexam.assistant-qa.unrelated')), 'preserved');
    assert.equal(await page.evaluate(() => window.ArzhenikovCoursesProgress().completed.length), 0);
    assert.deepEqual(errors, []); assert.deepEqual(failures, []);
    if (offline) assert.deepEqual(requests, [], 'Offline help has no HTTP dependency');
  } catch (error) {
    await page.screenshot({path: path.join(artifacts, 'failure-' + (offline ? 'offline-' : '') + width + '.png'), fullPage: true}).catch(() => {});
    throw error;
  } finally { await context.close(); }
}

async function browserGate() {
  fs.mkdirSync(artifacts, {recursive: true});
  const hosted = await serveRepository();
  const {chromium} = require('playwright');
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'arzhenikov-assistant-offline-'));
  let browser;
  try {
    const launch = process.env.ARZHENIKOV_ASSISTANT_CHROMIUM ? {executablePath: process.env.ARZHENIKOV_ASSISTANT_CHROMIUM} : {};
    browser = await chromium.launch(launch);
    for (const width of [320, 390, 1280]) await browserScenario(browser, hosted.url, width);
    const archive = path.join(root, folder, 'arzhenikov-offline.zip');
    execFileSync('python3', ['-c', 'import pathlib,sys,zipfile\nwith zipfile.ZipFile(sys.argv[1]) as z:\n for n in z.namelist():\n  p=pathlib.PurePosixPath(n)\n  assert not p.is_absolute() and ".." not in p.parts\n z.extractall(sys.argv[2])\n', archive, temporary], {stdio: 'pipe'});
    for (const width of [320, 390, 1280]) await browserScenario(browser, pathToFileURL(path.join(temporary, 'index.html')).href, width, true);
    console.log('ARZHENIKOV_ASSISTANT_BROWSER_PASS: keyboard, fresh context, honest first attempts, online/offline at 320/390/1280px, no helper requests and preserved unrelated storage.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => hosted.server.close(resolve));
    fs.rmSync(temporary, {recursive: true, force: true});
  }
}

if (require.main === module) (process.argv.includes('--dom') ? domGate() : browserGate()).catch(error => {
  console.error(error); process.exitCode = 1;
});
module.exports = {domGate, browserGate};
