'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {execFileSync} = require('node:child_process');
const {pathToFileURL} = require('node:url');
const {DomCourse, serveRepository} = require('./arzhenikov-courses.browser.cjs');
const root = path.resolve(__dirname, '..');
const folder = 'trainers/oge-basics/multiplication-division';
const tracks = ['written','fractions','decimals'].map(id => require(path.join(root, folder, 'arzhenikov-course-' + id + '.js')));
const lessons = tracks.flatMap(track => track.lessons);
const key = 'mathexam.arzhenikov.courses.v1';
const artifacts = path.resolve(process.env.ARZHENIKOV_ARITHMETIC_ARTIFACT_DIR || 'artifacts/arzhenikov-arithmetic');

// Exercise actual forms and route handlers. The separate rational oracle gate
// validates every authored expected value; this gate validates their real UI path.
// The same program executes in JSDOM and in Chromium, without bypassing disabled
// fields, injecting completion records or calling the checker directly.
async function exerciseLesson(lesson) {
  const fail = message => { throw new Error(lesson.id + ': ' + message); };
  const ok = (value, message) => { if (!value) fail(message); };
  const tick = () => new Promise(resolve => setTimeout(resolve, 0));
  const query = selector => {
    const node = document.querySelector('#arz-courses ' + selector);
    ok(node, 'missing control ' + selector); return node;
  };
  const click = async action => {
    const node = query('[data-course-action="' + action + '"]');
    ok(!node.disabled, 'disabled action ' + action); node.click(); await tick();
  };
  const fill = async (selector, value, type = 'input') => {
    const node = query(selector); ok(!node.disabled && !node.readOnly, 'uneditable ' + selector);
    node.value = String(value); node.dispatchEvent(new Event(type, {bubbles:true})); await tick();
  };
  const phase = expected => ok(document.getElementById('arz-courses').dataset.coursePhase === expected, 'phase ' + expected);
  const record = () => JSON.parse(localStorage.getItem('mathexam.arzhenikov.courses.v1')).lessons[lesson.id];
  location.hash = '#course-' + lesson.id; await tick(); phase('intro');
  await click('start'); phase('task');
  for (const cycle of [0, 1]) {
    for (const index of cycle ? [6, 7] : [0, 1, 2, 3, 4, 5]) {
      const task = lesson.tasks[index]; phase('task');
      ok(query('[data-course-task]').dataset.courseTask === task.id, 'expected current task ' + task.id);
      if (index < 2) {
        ok(query('#course-answer').disabled, 'answer waits for concrete action');
        await click('check-model');
        ok(!record().tasks[task.id].modelReady, 'opening the model is not a completed action');
        for (const control of task.model.controls) {
          const selector = '[data-course-control="' + control.id + '"]';
          if (control.min === control.max) ok(query(selector).disabled, 'known quantities stay fixed');
          else await fill(selector, control.target, 'change');
        }
        await click('check-model');
        ok(record().tasks[task.id].modelReady, 'mathematical model accepted');
      } else {
        ok(!document.querySelector('#arz-courses [data-course-action="check-model"]'), 'independent work starts without model');
      }
      if (task.steps?.length) {
        ok(query('#course-answer').disabled, 'final answer cannot bypass intermediate steps');
        for (const step of task.steps) {
          ok(query('[data-course-step]').dataset.courseStep === step.id, 'one sequential step at a time');
          await fill('#course-step-answer', step.answer);
          await click('check-step');
          ok(record().tasks[task.id].steps[step.id].solved, 'step accepted: ' + step.id);
        }
        if (task.written) {
          const heading = query('.course-written-dividend');
          const digits = [...heading.querySelectorAll('[data-column]')].map(cell => cell.textContent).join('');
          ok(digits === task.written.normalizedDividend.replace('.', '') + '0'.repeat(task.written.addedZeroes), 'written dividend keeps accepted appended zeroes');
          ok(heading.getAttribute('role') === 'img' && heading.getAttribute('aria-label'), 'written number has an ordered accessible description');
          ok([...document.querySelectorAll('.course-written-row')].every(row => row.getAttribute('role') === 'img' && row.getAttribute('aria-label')), 'written rows have accessible calculation descriptions');
        }
      }
      await fill('#course-answer', task.answer); await click('check-answer');
      const saved = record().tasks[task.id];
      ok(saved.solved && saved.firstCorrect === true && saved.firstHelpUsed === false, 'independent correct record');
      await click('next-task');
    }
    if (!cycle) {
      phase('reason');
      query('input[name="course-reason"][value="' + lesson.reason.answer + '"]').click();
      await tick(); await click('check-reason'); phase('summary');
      ok(record().completedAt, 'completion includes explanation');
      await click('new-check');
    } else {
      phase('summary'); ok(record().reviewedAt, 'new independent conditions completed');
    }
  }
  return {lesson:lesson.id, tasks:lesson.tasks.length, steps:lesson.tasks.reduce((sum, task) => sum + (task.steps?.length || 0), 0)};
}

async function domGate() {
  const flow = new DomCourse();
  try {
    await flow.load();
    flow.window.localStorage.setItem('mathexam.arithmetic-qa.sentinel', 'retained');
    let steps = 0;
    for (const lesson of lessons) {
      const result = await flow.window.eval('(' + exerciseLesson.toString() + ')(' + JSON.stringify(lesson) + ')');
      steps += result.steps; assert.deepEqual(flow.errors, []);
    }
    const before = flow.getState(); await flow.reload();
    const after = flow.getState(), progress = flow.getProgress();
    assert.equal(progress.total, 82);
    assert.equal(progress.completed.length, 36);
    assert.equal(progress.independent.length, 144);
    for (const lesson of lessons) {
      assert.equal(after.lessons[lesson.id].reviewedAt, before.lessons[lesson.id].reviewedAt);
      assert.equal(after.lessons[lesson.id].completedAt, before.lessons[lesson.id].completedAt);
    }
    for (const track of tracks) {
      await flow.goto('#journey-' + track.id);
      assert.match(flow.doc.querySelector('.journey-progress').textContent, /12 из 12/);
      await flow.reload();
      assert.match(flow.doc.querySelector('.journey-progress').textContent, /12 из 12/, 'Saved map progress appears on initial page load');
    }
    assert.equal(flow.window.localStorage.getItem('mathexam.arithmetic-qa.sentinel'), 'retained');
    console.log('ARZHENIKOV_ARITHMETIC_DOM_PASS: 36 lessons, 288 conditions, ' + steps + ' pupil steps, 36 explanations, 144 independent first solutions, reload and preserved unrelated state.');
  } finally { flow.close(); }
}
async function model(page, task) {
  for (const control of task.model.controls) {
    const input = page.locator('#arz-courses [data-course-control="' + control.id + '"]');
    if (control.min === control.max) continue;
    await input.fill(String(control.target)); await input.press('Tab');
  }
  await page.locator('[data-course-action="check-model"]').press('Enter');
}
async function start(page, base, lesson) {
  await page.goto(base + '#course-' + lesson.id);
  await page.locator('#arz-courses[data-course-phase="intro"]').waitFor({state:'visible'});
  await page.locator('[data-course-action="start"]').press('Enter');
  await page.locator('#arz-courses[data-course-phase="task"]').waitFor({state:'visible'});
}
async function fit(page, name) {
  const result = await page.evaluate(() => {
    const bounds = document.getElementById('arz-courses').getBoundingClientRect();
    return {
      width:innerWidth, page:document.documentElement.scrollWidth,
      overflow:[...document.querySelectorAll('#arz-courses :is(input,button,svg,.course-written-paper,.course-model-picture,.course-answer-form)')].flatMap(node => {
        const r = node.getBoundingClientRect();
        if (r.width && r.height && (r.left < bounds.left - 1 || r.right > bounds.right + 1)) return [{tag:node.tagName, cls:node.className, left:r.left, right:r.right}];
        return [];
      })
    };
  });
  assert(result.page <= result.width, name + ': horizontal page overflow ' + JSON.stringify(result));
  assert.deepEqual(result.overflow, [], name + ': content fits');
}
async function nativeInputGate(browser, base) {
  const context = await browser.newContext({viewport:{width:390,height:950}, reducedMotion:'reduce'});
  const page = await context.newPage(), errors = [], completed = {fractions:0, decimals:0};
  page.on('pageerror', error => errors.push(error.message));
  try {
    // These complete lessons use Playwright's real actionability checks,
    // including comparison buttons, a mixed number and a decimal comma.
    for (const id of ['f-compare','d-compare','f-mixed','d-applications']) {
      const lesson = lessons.find(item => item.id === id);
      await start(page, base, lesson);
      for (const cycle of [0, 1]) {
        for (const index of cycle ? [6, 7] : [0, 1, 2, 3, 4, 5]) {
          const task = lesson.tasks[index];
          assert.equal(await page.locator('[data-course-task]').getAttribute('data-course-task'), task.id);
          if (index < 2) await model(page, task);
          for (const step of task.steps || []) {
            await page.locator('#course-step-answer').fill(String(step.answer).replace('.', ','));
            await page.locator('[data-course-action="check-step"]').press('Enter');
          }
          if (task.answerFormat === 'comparison') {
            const accessibleName = {'<':'Меньше','=':'Равно','>':'Больше'}[task.answer];
            await page.locator('.course-comparison-choices').getByRole('button', {name:accessibleName, exact:true}).click();
            assert.equal(await page.locator('#course-answer').inputValue(), String(task.answer));
          } else {
            await page.locator('#course-answer').fill(String(task.answer).replace('.', ','));
          }
          await page.locator('[data-course-action="check-answer"]').press('Enter');
          const record = await page.evaluate(({key,id,task}) => JSON.parse(localStorage.getItem(key)).lessons[id].tasks[task],
            {key,id:lesson.id,task:task.id});
          assert.equal(record.solved, true, task.id + ': visible form accepted');
          assert.equal(record.firstCorrect, true, task.id + ': first native answer');
          await page.locator('[data-course-action="next-task"]').press('Enter');
        }
        if (!cycle) {
          await page.locator('input[name="course-reason"][value="' + lesson.reason.answer + '"]').check();
          await page.locator('[data-course-action="check-reason"]').press('Enter');
          await page.locator('[data-course-action="new-check"]').press('Enter');
        } else {
          await page.locator('#arz-courses[data-course-phase="summary"]').waitFor({state:'visible'});
          await fit(page, 'native-' + id);
        }
      }
      const track = id.startsWith('f-') ? 'fractions' : 'decimals'; completed[track]++;
      await page.goto(base + '#journey-' + track); await page.reload();
      assert.match(await page.locator('.journey-progress').innerText(), new RegExp(completed[track] + ' из 12'));
    }
    assert.deepEqual(errors, []);
    await page.locator('#journey-map').screenshot({path:path.join(artifacts, 'saved-map-progress.png')});
  } catch (error) {
    await page.screenshot({path:path.join(artifacts, 'failure-native.png'), fullPage:true}).catch(() => {});
    throw error;
  } finally { await context.close(); }
}
async function visualAndPersistence(browser, base, width) {
  const context = await browser.newContext({viewport:{width,height:950}, reducedMotion:'reduce'});
  const page = await context.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(base + '#journey');
    await page.locator('#journey-map[data-view="overview"]').waitFor({state:'visible'});
    assert.equal(await page.evaluate(() => document.querySelector('body.arz-adventure > header nav')?.contains(document.getElementById('maxexam-public-assistant'))), true,
      'Map navigator belongs to the header and does not cover map text');
    await page.locator('#journey-map').screenshot({path:path.join(artifacts, 'map-overview-' + width + '.png')});
    await page.goto(base + '#workshop-picnic');
    assert.equal(await page.evaluate(() => document.querySelector('body.arz-adventure > header nav')?.contains(document.getElementById('maxexam-public-assistant'))), false,
      'Leaving the map restores the original game navigator placement');
    for (const track of tracks) {
      await page.goto(base + '#courses-' + track.id);
      await page.locator('#arz-courses[data-course-view="track"]').waitFor({state:'visible'});
      await fit(page, track.id + '-' + width);
      assert.equal(await page.locator('.course-lesson-card').count(), 12);
      await page.locator('.course-return').press('Enter');
      await page.locator('#journey-map[data-view="group"]').waitFor({state:'visible'});
      assert.equal(await page.locator('#journey-map').getAttribute('data-group'), track.id);
      assert.equal(await page.locator('.journey-stop:not([hidden])').count(), 12);
      await page.locator('#journey-map').screenshot({path:path.join(artifacts, 'map-' + track.id + '-' + width + '.png')});
    }
    const sampleIds = ['w-first-block','w-bring-down','w-one-digit',
      'f-meaning','f-common-denominator','f-add','f-mixed','f-multiply','f-divide',
      'd-add','d-subtract','d-multiply-integer','d-multiply','d-divide-integer','d-divide-decimal','d-place'];
    for (const id of sampleIds) {
      const lesson = lessons.find(item => item.id === id), task = lesson.tasks[0];
      await start(page, base, lesson);
      await model(page, task); await fit(page, id + '-' + width);
      await page.locator('#arz-courses').screenshot({path:path.join(artifacts, id + '-' + width + '.png')});
    }
    for (const id of ['w-decimal-dividend','w-add-zeroes','w-decimal-divisor']) {
      const lesson = lessons.find(item => item.id === id), task = lesson.tasks[0];
      await start(page, base, lesson); await model(page, task);
      for (const step of task.steps) {
        await page.locator('#course-step-answer').fill(String(step.answer));
        await page.locator('[data-course-action="check-step"]').press('Enter');
      }
      const columns = await page.evaluate(() => {
        const heading = document.querySelector('.course-written-dividend');
        const source = new Map([...heading.querySelectorAll('[data-column]')].map(cell =>
          [cell.dataset.column, cell.getBoundingClientRect().x]));
        return {
          digits:[...heading.querySelectorAll('[data-column]')].map(cell => cell.textContent).join(''),
          comma:Boolean(heading.querySelector('.course-written-comma')),
          errors:[...document.querySelectorAll('.course-written-row [data-column]')].flatMap(cell =>
            Math.abs(cell.getBoundingClientRect().x - source.get(cell.dataset.column)) > .5 ? [cell.dataset.column] : [])
        };
      });
      const original = task.written.normalizedDividend.replace('.', '');
      assert.equal(columns.digits, original + '0'.repeat(task.written.addedZeroes), id + ': appended zeroes stay in the dividend');
      assert.equal(columns.comma, task.written.normalizedDividend.includes('.') || task.written.addedZeroes > 0);
      assert.deepEqual(columns.errors, [], id + ': each written digit aligns with its dividend place');
      assert.equal((await page.locator('.course-written-quotient').innerText()).replace(',', '.'), task.written.quotient);
      await fit(page, id + '-angle-' + width);
      await page.locator('#arz-courses').screenshot({path:path.join(artifacts, id + '-angle-' + width + '.png')});
    }
    // Save a genuine unfinished model, restore it, then keep a wrong first
    // arithmetic step and a later hint across another reload.
    const lesson = lessons.find(item => item.id === 'w-zero'), task = lesson.tasks[0];
    await start(page, base, lesson);
    const control = task.model.controls.find(item => item.min !== item.max);
    await page.locator('[data-course-control="' + control.id + '"]').fill(String(control.target));
    await page.locator('[data-course-control="' + control.id + '"]').press('Tab');
    await page.reload();
    assert.equal(await page.locator('[data-course-control="' + control.id + '"]').inputValue(), String(control.target));
    await model(page, task);
    const step = task.steps[0];
    await page.locator('#course-step-answer').fill(String(Number(step.answer) + 1));
    await page.locator('[data-course-action="check-step"]').press('Enter');
    assert.equal(await page.locator('#course-step-answer').getAttribute('aria-invalid'), 'true');
    await page.reload();
    assert.equal(await page.locator('#course-step-answer').inputValue(), String(Number(step.answer) + 1));
    await page.locator('[data-course-action="step-hint"]').press('Enter');
    await page.reload();
    let record = await page.evaluate(({key,id,task}) => JSON.parse(localStorage.getItem(key)).lessons[id].tasks[task], {key,id:lesson.id,task:task.id});
    assert.equal(record.firstCorrect, false); assert.equal(record.helpUsed, true); assert.equal(record.steps[step.id].hint, true);
    for (const item of task.steps) {
      const canonicalDigit = item.role === 'digit' ? '+0' + item.answer : String(item.answer);
      await page.locator('#course-step-answer').fill(canonicalDigit);
      await page.locator('[data-course-action="check-step"]').press('Enter');
    }
    assert.equal((await page.locator('.course-written-quotient').innerText()).replace(',', '.'), task.written.quotient);
    await fit(page, 'completed-written-' + width);
    await page.locator('#arz-courses').screenshot({path:path.join(artifacts, 'written-completed-' + width + '.png')});
    await page.locator('#course-answer').fill(String(task.answer)); await page.locator('[data-course-action="check-answer"]').press('Enter');
    record = await page.evaluate(({key,id,task}) => JSON.parse(localStorage.getItem(key)).lessons[id].tasks[task], {key,id:lesson.id,task:task.id});
    assert.equal(record.solved, true); assert.equal(record.firstCorrect, false);
    assert.deepEqual(errors, []);
  } catch (error) {
    await page.screenshot({path:path.join(artifacts, 'failure-' + width + '.png'), fullPage:true}).catch(() => {});
    throw error;
  } finally { await context.close(); }
}
async function offlineGate(browser) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'arz-arithmetic-offline-'));
  execFileSync('python3', ['-c', 'import sys,zipfile;zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])',
    path.join(root, folder, 'arzhenikov-offline.zip'), directory]);
  const context = await browser.newContext({viewport:{width:390,height:950}, reducedMotion:'reduce'});
  const requests = [], failures = [], errors = [];
  await context.route(/^https?:\/\//, route => {requests.push(route.request().url()); return route.abort();});
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message)); page.on('requestfailed', r => failures.push(r.url()));
  try {
    const base = pathToFileURL(path.join(directory, 'index.html')).href;
    await page.goto(base + '#courses');
    for (const id of ['w-add-zeroes','f-divide','d-divide-decimal']) {
      await page.evaluate(exerciseLesson, lessons.find(item => item.id === id));
    }
    assert.equal(await page.evaluate(() => window.ArzhenikovCoursesProgress().completed.length), 3);
    await fit(page, 'offline'); await page.locator('#arz-courses').screenshot({path:path.join(artifacts, 'offline.png')});
    assert.deepEqual(requests, [], 'Offline lessons make no HTTP request');
    assert.deepEqual(failures, [], 'Every offline resource exists'); assert.deepEqual(errors, []);
  } catch (error) {
    await page.screenshot({path:path.join(artifacts, 'failure-offline.png'), fullPage:true}).catch(() => {});
    throw error;
  } finally { await context.close(); fs.rmSync(directory, {recursive:true,force:true}); }
}
async function main() {
  if (process.argv.includes('--dom')) return domGate();
  fs.mkdirSync(artifacts, {recursive:true});
  const {chromium} = require('playwright');
  const hosted = await serveRepository(); let browser, page;
  try {
    browser = await chromium.launch();
    const context = await browser.newContext({viewport:{width:1280,height:950}, reducedMotion:'reduce'});
    page = await context.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(hosted.url + '#courses');
    let steps = 0;
    for (const lesson of lessons) steps += (await page.evaluate(exerciseLesson, lesson)).steps;
    const before = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key); await page.reload();
    const progress = await page.evaluate(() => window.ArzhenikovCoursesProgress());
    assert.equal(progress.completed.length, 36); assert.equal(progress.total, 82); assert.equal(progress.independent.length, 144);
    const after = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
    for (const lesson of lessons) assert.equal(after.lessons[lesson.id].reviewedAt, before.lessons[lesson.id].reviewedAt);
    assert.deepEqual(errors, []); await context.close(); page = null;
    for (const width of [320,390,1280]) await visualAndPersistence(browser, hosted.url, width);
    await nativeInputGate(browser, hosted.url);
    await offlineGate(browser);
    console.log('ARZHENIKOV_ARITHMETIC_BROWSER_PASS: 36 lessons / 288 conditions / ' + steps +
      ' intermediate steps; exact saved drafts, new checks, canonical angle digits, first errors/help, all model views and Prezi routes at 320/390/1280; offline with HTTP blocked.');
  } catch (error) {
    if (page && !page.isClosed()) await page.screenshot({path:path.join(artifacts, 'failure.png'), fullPage:true}).catch(() => {});
    fs.writeFileSync(path.join(artifacts, 'failure.txt'), String(error.stack || error)); throw error;
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => hosted.server.close(resolve));
  }
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = {exerciseLesson};
