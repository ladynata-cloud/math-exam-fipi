'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const {execFileSync} = require('node:child_process');
const {pathToFileURL} = require('node:url');

const root = path.resolve(__dirname, '..');
const folder = 'trainers/oge-basics/multiplication-division';
let trainer = process.env.ARZHENIKOV_TRAINER_URL || '';
const artifacts = path.resolve(process.env.ARZHENIKOV_COURSES_ARTIFACT_DIR || 'artifacts/arzhenikov-courses');
const key = 'mathexam.arzhenikov.courses.v1';
const oldKeys = ['mathexam.arzhenikov.workshop.v1', 'mathexam.arzhenikov.garden.v1',
  'mathexam.arzhenikov.division.v1', 'mathexam.arzhenikov.harbor.v1',
  'mathexam.arzhenikov.discoveries.v1', 'mathexam.courses-test.sentinel'];
const tracks = ['arithmetic', 'algebra', 'geometry'].map(id => require(path.join(root, folder, 'arzhenikov-course-' + id + '.js')));
const lessons = tracks.flatMap(track => track.lessons);

async function serveRepository() {
  const types = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.zip': 'application/zip'};
  const server = http.createServer((request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      let filename = path.resolve(root, '.' + pathname);
      if (filename !== root && !filename.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
      if (fs.statSync(filename).isDirectory()) filename = path.join(filename, 'index.html');
      response.setHeader('Content-Type', types[path.extname(filename)] || 'application/octet-stream');
      response.setHeader('Cache-Control', 'no-store');
      response.writeHead(200); response.end(fs.readFileSync(filename));
    } catch { response.writeHead(404).end('Not found'); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return {server, url: 'http://127.0.0.1:' + server.address().port + '/' + folder + '/arzhenikov-map.html'};
}

// Solve from mathematical quantities; never copy task.answer into the browser.
function answerFor(task) {
  const {op, args} = task.calculation, [a, b, c] = args;
  const operations = {
    sum: () => args.reduce((n, x) => n + x, 0), difference: () => a - b,
    product: () => args.reduce((n, x) => n * x, 1), quotient: () => a / b,
    'floor-quotient': () => Math.floor(a / b), remainder: () => a % b,
    'ceil-quotient': () => Math.ceil(a / b), linear: () => (c - b) / a,
    fraction: () => a * b / c, place: () => a * 100 + b * 10 + c,
    perimeter: () => 2 * (a + b), power: () => a ** b, expression: () => a * b + c
  };
  assert(operations[op], task.id + ': reviewed operation');
  return operations[op]();
}

function button(page, action) { return page.locator('#arz-courses [data-course-action="' + action + '"]'); }
async function phase(page, wanted) {
  await page.locator('#arz-courses[data-course-phase="' + wanted + '"]').waitFor({state: 'visible'});
}
async function state(page) { return page.evaluate(key => JSON.parse(localStorage.getItem(key)), key); }
async function progress(page) { return page.evaluate(() => window.ArzhenikovCoursesProgress()); }
async function previous(page) { return page.evaluate(keys => Object.fromEntries(keys.map(name => [name, localStorage.getItem(name)])), oldKeys); }
async function captureFailure(page, error, stage) {
  // Evidence contains only this test's active course draft. Earlier trainer
  // saves, credentials and machine-specific file URLs are deliberately omitted.
  const evidence = {stage, message: String(error?.message || error).slice(0, 3000)};
  if (page && !page.isClosed()) {
    try {
      evidence.page = await page.evaluate(key => {
        const host = document.querySelector('#arz-courses'), task = host?.querySelector('[data-course-task]');
        let record = null, storage = 'readable';
        try { record = JSON.parse(localStorage.getItem(key))?.lessons?.[host?.dataset.courseLesson] || null; }
        catch { storage = 'unavailable-or-malformed'; }
        const active = document.activeElement;
        return {
          route: (location.protocol === 'file:' ? 'offline/index.html' : location.pathname) + location.hash,
          viewport: {width: innerWidth, height: innerHeight},
          view: host?.dataset.courseView, lesson: host?.dataset.courseLesson, phase: host?.dataset.coursePhase,
          task: task?.dataset.courseTask, taskIndex: task?.dataset.courseTaskIndex,
          input: host?.querySelector('#course-answer')?.value,
          feedback: host?.querySelector('#course-feedback')?.textContent,
          focus: active ? {tag: active.tagName, id: active.id} : null,
          controls: [...host?.querySelectorAll('[data-course-control]') || []].map(node => ({id: node.dataset.courseControl, value: node.value, disabled: node.disabled})),
          actions: [...host?.querySelectorAll('[data-course-action]') || []].slice(0, 20).map(node => ({action: node.dataset.courseAction, disabled: node.disabled})),
          storage,
          record: record ? {phase: record.phase, cursor: record.cursor, cycle: record.cycle,
            completedAt: record.completedAt, reviewedAt: record.reviewedAt, reason: record.reason,
            currentTask: record.tasks?.[task?.dataset.courseTask] || null} : null
        };
      }, key);
    } catch (failure) { evidence.stateCaptureError = String(failure.message).slice(0, 300); }
    try { await page.screenshot({path: path.join(artifacts, 'failure-' + stage + '.png'), fullPage: true, timeout: 5000}); }
    catch (failure) { evidence.screenshotError = String(failure.message).slice(0, 300); }
  }
  try {
    fs.mkdirSync(artifacts, {recursive: true});
    fs.writeFileSync(path.join(artifacts, 'failure-' + stage + '.json'), JSON.stringify(evidence, null, 2) + '\n');
    error.courseEvidenceCaptured = true;
  } catch { /* Never replace the original assertion with an evidence-write error. */ }
}
async function navigate(page, hash) {
  await page.evaluate(hash => { location.hash = hash; }, hash);
  if (hash.startsWith('#course-')) {
    await page.locator('#arz-courses[data-course-lesson="' + hash.slice(8) + '"]').waitFor({state: 'visible'});
  } else if (hash.startsWith('#courses')) {
    await page.locator('#arz-courses[data-course-view="' + (hash === '#courses' ? 'overview' : 'track') + '"]').waitFor({state: 'visible'});
  }
}

async function assertTask(page, task, index) {
  await phase(page, 'task');
  await page.locator('#arz-courses [data-course-task="' + task.id + '"]').waitFor({state: 'visible'});
  assert.equal(await page.locator('#arz-courses [data-course-task]').getAttribute('data-course-task-index'), String(index));
  assert((await page.locator('#arz-courses').innerText()).includes(task.prompt), task.id + ': condition is visible');
}

async function configureModel(page, task, options = {}) {
  const controls = task.model.controls;
  if (options.incomplete) {
    await button(page, 'check-model').click();
    assert((await page.locator('#course-feedback').innerText()).trim(), task.id + ': unfinished action feedback');
    const record = (await state(page)).lessons[options.lessonId].tasks[task.id];
    assert.equal(record.modelReady, false, task.id + ': arbitrary action is not accepted');
  }
  if (options.reload) {
    const control = controls.find(item => item.initial !== item.target);
    const delta = control.target > control.initial ? 1 : -1;
    const moved = control.initial + delta * control.step;
    await page.locator('#arz-courses [data-course-control-id="' + control.id + '"][data-course-delta="' + delta + '"]').press('Enter');
    await page.reload(); await phase(page, 'task');
    assert.equal(await page.locator('#arz-courses [data-course-control="' + control.id + '"]').inputValue(), String(moved), task.id + ': one unfinished concrete action restored');
  }
  for (let index = 0; index < controls.length; index++) {
    const control = controls[index], input = page.locator('#arz-courses [data-course-control="' + control.id + '"]');
    if (control.min === control.max) {
      assert.equal(await input.inputValue(), String(control.target), task.id + ': fixed known quantity');
      assert(await input.isDisabled(), task.id + ': fixed quantity is not falsely editable');
      continue;
    }
    await input.fill(String(control.target));
    await input.press('Tab');
  }
  await button(page, 'check-model').press('Enter');
  if (options.lessonId) assert.equal((await state(page)).lessons[options.lessonId].tasks[task.id].modelReady, true, task.id + ': accepted mathematical model');
}

async function numericTask(page, lesson, index, probes = {}) {
  const task = lesson.tasks[index], expected = answerFor(task);
  await assertTask(page, task, index);
  if (index < 2) await configureModel(page, task, {lessonId: lesson.id, incomplete: probes.blank, reload: probes.reloadModel});
  else assert.equal(await button(page, 'check-model').isVisible(), false, task.id + ': independent work does not demand the training model');
  const input = page.locator('#course-answer');
  if (probes.blank) {
    await input.fill('');
    await button(page, 'check-answer').click();
    assert((await page.locator('#course-feedback').innerText()).trim(), task.id + ': empty answer feedback');
    assert.equal((await state(page)).lessons[lesson.id].tasks[task.id].firstCorrect, null, task.id + ': an empty field is not a mathematical first attempt');
    await input.fill('12x');
    await button(page, 'check-answer').click();
    assert.equal((await state(page)).lessons[lesson.id].tasks[task.id].solved, false, task.id + ': malformed integer cannot pass by parseInt');
  }
  if (probes.hint) {
    await button(page, 'hint').click();
    await page.reload(); await assertTask(page, task, index);
    assert.equal((await state(page)).lessons[lesson.id].tasks[task.id].helpUsed, true, task.id + ': help persists across reload');
  }
  if (probes.wrong) {
    await page.locator('#course-answer').fill(String(expected + 1));
    await button(page, 'check-answer').click();
    assert.equal(await page.locator('#course-answer').getAttribute('aria-invalid'), 'true', task.id + ': wrong answer identified');
    const before = (await state(page)).lessons[lesson.id].tasks[task.id];
    assert.equal(before.firstCorrect, false, task.id + ': first mathematical error recorded');
    assert.equal(before.solved, false);
    await page.reload(); await assertTask(page, task, index);
    assert.equal(await page.locator('#course-answer').inputValue(), String(expected + 1), task.id + ': typed wrong answer restored');
    assert.equal((await state(page)).lessons[lesson.id].tasks[task.id].firstCorrect, false, task.id + ': reload cannot erase first error');
  }
  await page.locator('#course-answer').fill(String(expected));
  if (probes.reloadInput) {
    await page.reload(); await assertTask(page, task, index);
    assert.equal(await page.locator('#course-answer').inputValue(), String(expected), task.id + ': unfinished typed work restored');
  }
  await button(page, 'check-answer').press('Enter');
  const record = (await state(page)).lessons[lesson.id].tasks[task.id];
  assert.equal(record.solved, true, task.id + ': numerically solved');
  assert.equal(record.firstCorrect, probes.wrong ? false : true, task.id + ': first answer preserved');
  if (probes.hint) assert.equal(record.helpUsed, true);
  assert((await page.locator('#course-feedback').innerText()).trim(), task.id + ': useful success explanation');
  await button(page, 'next-task').press('Enter');
}

async function reason(page, lesson, wrong = false) {
  await phase(page, 'reason');
  assert(!(await progress(page)).completed.includes(lesson.id), lesson.id + ': numeric completion alone is insufficient');
  await button(page, 'check-reason').click();
  assert((await page.locator('#course-feedback').innerText()).trim(), lesson.id + ': explanation required');
  if (wrong) {
    const alternative = lesson.reason.options.find(option => option.id !== lesson.reason.answer).id;
    await page.locator('input[name="course-reason"][value="' + alternative + '"]').check();
    await button(page, 'check-reason').click();
    await phase(page, 'reason');
    assert(!(await progress(page)).completed.includes(lesson.id), lesson.id + ': rejected explanation does not finish lesson');
    await page.reload(); await phase(page, 'reason');
    assert(await page.locator('input[name="course-reason"][value="' + alternative + '"]').isChecked(), lesson.id + ': explanation choice restored');
  }
  await page.locator('input[name="course-reason"][value="' + lesson.reason.answer + '"]').check();
  await button(page, 'check-reason').press('Enter');
  await phase(page, 'summary');
  assert((await progress(page)).completed.includes(lesson.id), lesson.id + ': completed only after explanation');
}

async function allCourses(page) {
  await page.goto(trainer + '#courses');
  await page.locator('#arz-courses[data-course-view="overview"]').waitFor({state: 'visible'});
  await page.evaluate(() => localStorage.setItem('mathexam.courses-test.sentinel', 'unrelated-progress-stays-intact'));
  const old = await previous(page);
  assert.equal((await progress(page)).completed.length, 0, 'Opening the catalogue awards no lesson');
  assert.equal((await progress(page)).independent.length, 0, 'Opening the catalogue awards no independent work');
  for (let ordinal = 0; ordinal < lessons.length; ordinal++) {
    const lesson = lessons[ordinal];
    await navigate(page, '#course-' + lesson.id);
    await phase(page, 'intro');
    assert(!(await progress(page)).completed.includes(lesson.id), lesson.id + ': reading is not completion');
    await button(page, 'start').press('Enter');
    for (let index = 0; index < 6; index++) {
      await numericTask(page, lesson, index, {
        blank: ordinal === 0 && index === 0,
        reloadModel: ordinal === 0 && index === 0,
        reloadInput: ordinal === 1 && index === 3,
        hint: ordinal === 0 && index === 4,
        wrong: ordinal === 0 && index === 5
      });
    }
    await reason(page, lesson, ordinal === 0);
    const initial = (await state(page)).lessons[lesson.id];
    const firstCompletion = initial.completedAt;
    await button(page, 'new-check').press('Enter');
    for (const index of [6, 7]) await numericTask(page, lesson, index);
    await phase(page, 'summary');
    const completed = (await state(page)).lessons[lesson.id];
    assert.equal(completed.completedAt, firstCompletion, lesson.id + ': repeat does not invent a new first completion');
    assert(completed.reviewedAt, lesson.id + ': fresh repeat evidence recorded');
  }
  const result = await progress(page);
  assert.equal(result.total, 82, 'The preserved 40 lessons coexist with 36 arithmetic extensions and 6 connecting lessons');
  assert.equal(new Set(result.completed).size, 40);
  assert.equal(result.independent.length, 158, '160 fresh check conditions minus the helped and corrected first attempts');
  assert(!result.independent.includes(lessons[0].tasks[4].id), 'Helped answer is not independent');
  assert(!result.independent.includes(lessons[0].tasks[5].id), 'Corrected first answer is not independent');
  const first = lessons[0];
  await navigate(page, '#course-' + first.id); await phase(page, 'summary');
  await button(page, 'repeat').click(); await phase(page, 'intro');
  await button(page, 'start').click();
  for (let index = 0; index < 6; index++) {
    const task = first.tasks[index];
    await assertTask(page, task, index);
    if (index < 2) await configureModel(page, task, {lessonId: first.id});
    await page.locator('#course-answer').fill(String(answerFor(task)));
    await button(page, 'check-answer').click();
    await button(page, 'next-task').click();
  }
  await phase(page, 'reason');
  await page.locator('input[name="course-reason"][value="' + first.reason.answer + '"]').check();
  await button(page, 'check-reason').click(); await phase(page, 'summary');
  const replayed = (await state(page)).lessons[first.id];
  assert.equal(replayed.tasks[first.tasks[4].id].helpUsed, true, 'Rehearsal retains original help');
  assert.equal(replayed.tasks[first.tasks[5].id].firstCorrect, false, 'Rehearsal retains original error');
  assert.equal((await progress(page)).independent.length, 158, 'Memorized repeat is not additional independent evidence');
  const alreadyIndependent = lessons[1];
  await navigate(page, '#course-' + alreadyIndependent.id); await phase(page, 'summary');
  await button(page, 'repeat').click(); await button(page, 'start').click();
  for (let index = 0; index < 6; index++) await numericTask(page, alreadyIndependent, index, {hint: index === 4});
  await page.locator('input[name="course-reason"][value="' + alreadyIndependent.reason.answer + '"]').check();
  await button(page, 'check-reason').click(); await phase(page, 'summary');
  const historical = (await state(page)).lessons[alreadyIndependent.id].tasks[alreadyIndependent.tasks[4].id];
  assert.equal(historical.helpUsed, true, 'Help in the later rehearsal is recorded');
  assert.equal(historical.firstHelpUsed, false, 'The earlier first independent answer is not rewritten');
  assert.equal((await progress(page)).independent.length, 158, 'Later help cannot erase a historical first independent solution');
  assert.deepEqual(await previous(page), old, 'All earlier trainer keys and unrelated state are unchanged');
}

async function geometry(page, width, name) {
  const result = await page.evaluate(() => {
    const visible = node => {const r = node.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(node).visibility !== 'hidden';};
    const host = document.querySelector('#arz-courses');
    const overflowing = [...host.querySelectorAll('*')].filter(visible).map(node => {
      const r = node.getBoundingClientRect();
      return {tag: node.tagName, text: node.textContent.slice(0, 90), left: r.left, right: r.right};
    }).filter(r => r.left < -1 || r.right > innerWidth + 1);
    const controls = [...host.querySelectorAll('button, input:not([type=radio])')].filter(visible).map(node => {
      const r = node.getBoundingClientRect(); return {text: node.textContent || node.getAttribute('aria-label') || node.id, width: r.width, height: r.height};
    });
    return {viewport: innerWidth, document: document.documentElement.scrollWidth, overflowing, controls};
  });
  assert.equal(result.viewport, width);
  assert(result.document <= width + 1, name + ': no document overflow at ' + width);
  assert.deepEqual(result.overflowing, [], name + ': lesson content fits at ' + width);
  assert(result.controls.every(control => control.width >= 43.5 && control.height >= 43.5), name + ': touch controls are at least 44 px');
  fs.writeFileSync(path.join(artifacts, name + '-' + width + '.json'), JSON.stringify(result, null, 2) + '\n');
  await page.screenshot({path: path.join(artifacts, name + '-' + width + '.png'), fullPage: true});
}

async function navigatorPlacement(page, original, inCourse) {
  const expectedPosition = inCourse ? 'static' : 'fixed';
  await page.waitForFunction(position => {
    const launcher = document.querySelector('#maxexam-public-assistant')?.shadowRoot?.querySelector('.launcher');
    return launcher && getComputedStyle(launcher).position === position;
  }, expectedPosition);
  const placement = await page.evaluate(original => {
    const current = document.querySelector('#maxexam-public-assistant');
    return {
      count: document.querySelectorAll('#maxexam-public-assistant').length,
      sameHost: current === original.host,
      sameLauncher: current?.shadowRoot?.querySelector('.launcher') === original.launcher,
      inHeader: Boolean(document.querySelector('body > header nav')?.contains(current)),
      sameParent: current?.parentNode === original.parent,
      sameNextSibling: current?.nextSibling === original.nextSibling
    };
  }, original);
  assert.equal(placement.count, 1, 'The course keeps one real navigator');
  assert(placement.sameHost && placement.sameLauncher, 'Course navigation preserves the original navigator and its launcher');
  assert.equal(placement.inHeader, inCourse, 'The navigator belongs to the course header only while a course is open');
  if (!inCourse) assert(placement.sameParent && placement.sameNextSibling, 'Leaving the course restores the original navigator DOM position');
}

async function launcherAccess(page) {
  const launcher = page.locator('#maxexam-public-assistant .launcher');
  await launcher.waitFor({state: 'visible'});
  const target = await launcher.evaluate(node => {
    const rect = node.getBoundingClientRect(), label = node.querySelector('.launcher-label');
    const labelRect = label.getBoundingClientRect(), style = getComputedStyle(label);
    return {width: rect.width, height: rect.height, label: label.textContent,
      labelWidth: labelRect.width, labelHeight: labelRect.height, clipPath: style.clipPath,
      labelVisibility: style.visibility, labelDisplay: style.display};
  });
  assert(target.width >= 43.5 && target.height >= 43.5, 'The header navigator has a target of at least 44 px');
  assert.match(target.label, /Навигатор/, 'The course navigator has a readable text label');
  assert(target.labelWidth >= 35 && target.labelHeight >= 12 && target.clipPath === 'none' &&
    target.labelVisibility !== 'hidden' && target.labelDisplay !== 'none', 'The navigator label remains visible on mobile');
  await launcher.press('Enter');
  const dialog = page.locator('#maxexam-public-assistant [role="dialog"]');
  await dialog.waitFor({state: 'visible'});
  const panel = await dialog.evaluate(node => {
    const rect = node.getBoundingClientRect();
    return {position: getComputedStyle(node).position, left: rect.left, right: rect.right,
      top: rect.top, bottom: rect.bottom, width: innerWidth, height: innerHeight};
  });
  assert.equal(panel.position, 'fixed', 'The moved navigator dialog remains fixed to the viewport');
  assert(panel.left >= -1 && panel.right <= panel.width + 1 && panel.top >= -1 && panel.bottom <= panel.height + 1,
    'The moved navigator dialog fits in the viewport: ' + JSON.stringify(panel));
  await page.keyboard.press('Escape');
  assert.equal(await dialog.isVisible(), false, 'The real navigator closes with Escape');
  assert(await launcher.evaluate(node => node.getRootNode().activeElement === node), 'Navigator Escape restores launcher focus');
  const original = await page.evaluate(() => scrollY);
  // A user can naturally scroll an action to the lower edge. Its centre must
  // remain clickable even with the real global navigator mounted over the page.
  const action = page.locator('#arz-courses [data-course-delta="1"]:not(:disabled)').last();
  if (await action.count()) {
    await action.evaluate(node => node.scrollIntoView({block: 'end', behavior: 'instant'}));
    const blocked = await action.evaluate(node => {
      const rect = node.getBoundingClientRect(), x = rect.x + rect.width / 2, y = rect.y + rect.height / 2;
      const hit = document.elementFromPoint(x, y);
      return hit !== node && !node.contains(hit) ? {action: node.getAttribute('aria-label'), hit: hit?.id || hit?.tagName, x, y} : null;
    });
    assert.equal(blocked, null, 'The navigator must not cover the centre of a model action: ' + JSON.stringify(blocked));
  }
  await page.evaluate(y => scrollTo({top: y, behavior: 'instant'}), original);
}

async function layoutAndRoutes(browser, width) {
  const context = await browser.newContext({viewport: {width, height: 900}, reducedMotion: 'reduce'});
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(trainer + '#workshop');
    await page.locator('#workshop').waitFor({state: 'visible'});
    await page.locator('#maxexam-public-assistant .launcher').waitFor({state: 'visible'});
    const originalNavigator = await page.evaluateHandle(() => {
      const host = document.querySelector('#maxexam-public-assistant');
      return {host, launcher: host.shadowRoot.querySelector('.launcher'), parent: host.parentNode, nextSibling: host.nextSibling};
    });
    await navigatorPlacement(page, originalNavigator, false);
    await navigate(page, '#courses');
    await page.locator('#arz-courses[data-course-view="overview"]').waitFor({state: 'visible'});
    await navigatorPlacement(page, originalNavigator, true);
    await geometry(page, width, 'courses-overview');
    const before = await progress(page);
    for (const track of tracks) {
      const entry = page.locator('#arz-courses a[href="#courses-' + track.id + '"]').first();
      await entry.press('Enter');
      await page.locator('#arz-courses[data-course-view="track"]').waitFor({state: 'visible'});
      const lesson = track.lessons[0];
      await page.locator('#arz-courses a[href="#course-' + lesson.id + '"]').first().press('Enter');
      await phase(page, 'intro');
      await page.goBack(); await page.locator('#arz-courses[data-course-view="track"]').waitFor({state: 'visible'});
      await page.goBack(); await page.locator('#arz-courses[data-course-view="overview"]').waitFor({state: 'visible'});
    }
    assert.equal((await progress(page)).completed.length, before.completed.length, 'Navigation gives no completion');
    const sampleKinds = ['groups', 'line', 'balance', 'rectangle', 'triangle'];
    for (const kind of sampleKinds) {
      const lesson = lessons.find(item => item.tasks[0].model.kind === kind);
      assert(lesson, 'A representative ' + kind + ' lesson exists');
      await navigate(page, '#course-' + lesson.id); await phase(page, 'intro');
      await button(page, 'start').press('Enter');
      const task = lesson.tasks[0];
      await configureModel(page, task, {lessonId: lesson.id});
      if (kind === 'rectangle') assert(await page.locator('#arz-courses [data-course-right-angle]').count() >= 1, 'A rectangle has justified right-angle marks');
      if (kind === 'groups') { await navigatorPlacement(page, originalNavigator, true); await launcherAccess(page); }
      await geometry(page, width, 'courses-' + kind);
    }
    const angleLesson = lessons.find(item => item.id === 'g-straight-angle');
    await navigate(page, '#course-' + angleLesson.id); await phase(page, 'intro');
    await button(page, 'start').click();
    const angle = page.locator('[data-course-control="angle"]');
    if (Number(await angle.getAttribute('min')) <= 90 && Number(await angle.getAttribute('max')) >= 90) {
      await angle.fill('90'); await angle.press('Tab');
      assert(await page.locator('#arz-courses [data-course-right-angle]').count() >= 1, 'A drawn 90-degree angle has a square');
      await angle.fill('60'); await angle.press('Tab');
      assert.equal(await page.locator('#arz-courses [data-course-right-angle]').count(), angleLesson.tasks[0].model.meta?.total === 90 ? 1 : 0,
        'Only the justified whole right angle retains its square when the selected part is not right');
    }
    await navigate(page, '#workshop');
    await page.locator('#workshop').waitFor({state: 'visible'});
    assert.equal(await page.locator('#arz-courses').isVisible(), false, 'Returning to an older game hides the course');
    await navigatorPlacement(page, originalNavigator, false);
    await navigate(page, '#journey-algebra');
    await page.locator('#journey-map').waitFor({state: 'visible'});
    const localCourse = page.locator('#journey-map a[href="#courses-algebra"]');
    if (await localCourse.count()) await localCourse.first().press('Enter');
    else {
      await page.locator('#journey-map [data-journey-topic="course"][data-group="algebra"]').press('Enter');
      const href = await page.locator('#journey-map [data-journey-action="open"]').getAttribute('href');
      assert(href === '#courses-algebra' || href.startsWith('https://'), 'Existing destinations are explicit');
    }
    assert.deepEqual(errors, []);
  } catch (error) {
    await captureFailure(page, error, 'layout-' + width); throw error;
  } finally { await context.close(); }
}

async function storageFailures(browser) {
  const damaged = '{"version":1,"lessons":';
  for (const mode of ['corrupt', 'blocked']) {
    const context = await browser.newContext({viewport: {width: 390, height: 900}});
    if (mode === 'corrupt') await context.addInitScript(({key, damaged}) => localStorage.setItem(key, damaged), {key, damaged});
    else await context.addInitScript(() => {
      for (const method of ['getItem', 'setItem']) {
        const original = Storage.prototype[method];
        Storage.prototype[method] = function(name, ...args) {
          if (name === 'mathexam.arzhenikov.courses.v1') throw new DOMException('Storage unavailable', 'SecurityError');
          return original.call(this, name, ...args);
        };
      }
    });
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    try {
      const lesson = lessons[0], task = lesson.tasks[0];
      await page.goto(trainer + '#course-' + lesson.id); await phase(page, 'intro');
      const text = await page.locator('#arz-courses').innerText();
      assert(/сохран|хранилищ|памят/i.test(text), mode + ': storage limitation is explained');
      await button(page, 'start').click();
      await configureModel(page, task);
      await page.locator('#course-answer').fill(String(answerFor(task)));
      await button(page, 'check-answer').click();
      assert(await button(page, 'next-task').isEnabled(), mode + ': learning remains usable');
      await button(page, 'next-task').click();
      await assertTask(page, lesson.tasks[1], 1);
      if (mode === 'corrupt') assert.equal(await page.evaluate(key => localStorage.getItem(key), key), damaged, 'Damaged saved work is not silently overwritten');
      assert.deepEqual(errors, []);
    } catch (error) {
      await captureFailure(page, error, 'storage-' + mode); throw error;
    } finally { await context.close(); }
  }
}

async function offlineBrowser(browser) {
  const archive = path.join(root, folder, 'arzhenikov-offline.zip');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'arzhenikov-courses-offline-'));
  execFileSync('python3', ['-c', 'import pathlib,sys,zipfile\nwith zipfile.ZipFile(sys.argv[1]) as z:\n for n in z.namelist():\n  p=pathlib.PurePosixPath(n)\n  assert not p.is_absolute() and ".." not in p.parts\n z.extractall(sys.argv[2])\n', archive, directory], {stdio: 'pipe'});
  const context = await browser.newContext({viewport: {width: 390, height: 900}, reducedMotion: 'reduce'});
  const network = [], failures = [], errors = [];
  let page;
  await context.route(/^https?:\/\//, route => { network.push(route.request().url()); return route.abort('internetdisconnected'); });
  await context.setOffline(true);
  try {
    page = await context.newPage(); page.setDefaultTimeout(15000);
    page.on('requestfailed', request => failures.push(request.url()));
    page.on('pageerror', error => errors.push(error.message));
    const url = pathToFileURL(path.join(directory, 'index.html')).href;
    await page.goto(url + '#courses');
    await page.locator('#arz-courses[data-course-view="overview"]').waitFor({state: 'visible'});
    assert.equal((await progress(page)).total, 82, 'The offline package includes the preserved and extended courses');
    assert(await page.locator('#offline-help').isVisible());
    for (const track of tracks) {
      const lesson = track.lessons[0];
      await navigate(page, '#course-' + lesson.id); await phase(page, 'intro');
      await button(page, 'start').click();
      await numericTask(page, lesson, 0, {reloadModel: true});
      assert((await page.locator('#arz-courses').innerText()).includes(lesson.tasks[1].prompt));
    }
    await geometry(page, 390, 'courses-offline');
    assert.deepEqual(network, [], 'All course resources work without HTTP requests');
    assert.deepEqual(failures, [], 'The ZIP contains every requested local file');
    assert.deepEqual(errors, []);
  } catch (error) {
    await captureFailure(page, error, 'offline'); throw error;
  } finally { await context.close(); fs.rmSync(directory, {recursive: true, force: true}); }
}

class DomCourse {
  constructor(file = path.join(root, folder, 'arzhenikov-map.html')) { this.file = file; this.saved = {}; }
  async load(hash = '#courses') {
    if (this.window) {
      this.saved = Object.fromEntries(Object.keys(this.window.localStorage).map(name => [name, this.window.localStorage.getItem(name)]));
      this.window.close();
    }
    const {JSDOM, VirtualConsole} = require('jsdom');
    const virtualConsole = new VirtualConsole(); this.errors = [];
    virtualConsole.on('jsdomError', error => this.errors.push(error.message));
    this.dom = new JSDOM(fs.readFileSync(this.file, 'utf8'), {
      url: 'https://mathexam.test/' + folder + '/arzhenikov-map.html' + hash,
      runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole
    });
    this.window = this.dom.window; this.doc = this.window.document;
    const w = this.window;
    w.matchMedia = query => ({matches: /prefers-reduced-motion/.test(query), addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}});
    w.HTMLCanvasElement.prototype.getContext = () => null;
    w.HTMLElement.prototype.scrollIntoView = () => {};
    for (const [name, value] of Object.entries(this.saved)) w.localStorage.setItem(name, value);
    for (const script of this.doc.querySelectorAll('script[src]')) {
      const src = script.getAttribute('src').split('?')[0];
      if (!src.startsWith('/')) w.eval(fs.readFileSync(path.join(path.dirname(this.file), src), 'utf8'));
    }
    await this.tick();
  }
  async tick() { await new Promise(resolve => setTimeout(resolve, 0)); assert.deepEqual(this.errors, []); }
  async goto(hash) { this.window.location.hash = hash; await this.tick(); }
  async reload() { await this.load(this.window.location.hash); }
  node(selector) { const item = this.doc.querySelector('#arz-courses ' + selector); assert(item, selector + ': DOM control exists'); return item; }
  phase(wanted) { assert.equal(this.doc.getElementById('arz-courses').dataset.coursePhase, wanted); }
  getState() { return JSON.parse(this.window.localStorage.getItem(key)); }
  getProgress() { return JSON.parse(JSON.stringify(this.window.ArzhenikovCoursesProgress())); }
  async action(action) {
    const node = this.node('[data-course-action="' + action + '"]');
    assert(!node.disabled, action + ': real usable control'); node.click(); await this.tick();
  }
  async fill(selector, value, type = 'input') {
    const node = this.node(selector); assert(!node.disabled && !node.readOnly, selector + ': editable');
    node.value = String(value); node.dispatchEvent(new this.window.Event(type, {bubbles: true})); await this.tick();
  }
  async model(task) {
    for (const control of task.model.controls) {
      if (control.min === control.max) {
        assert.equal(this.node('[data-course-control="' + control.id + '"]').value, String(control.target));
        continue;
      }
      await this.fill('[data-course-control="' + control.id + '"]', control.target, 'change');
    }
    await this.action('check-model');
  }
  async solve(lesson, index) {
    this.phase('task');
    const task = lesson.tasks[index];
    assert.equal(this.node('[data-course-task]').dataset.courseTask, task.id);
    assert(this.getState().lessons[lesson.id].tasks[task.id], task.id + ': initial draft is persisted before the first action');
    if (index < 2) await this.model(task);
    await this.fill('#course-answer', answerFor(task)); await this.action('check-answer');
    assert.equal(this.getState().lessons[lesson.id].tasks[task.id].solved, true);
    await this.action('next-task');
  }
  async explain(lesson) {
    this.phase('reason'); this.node('input[name="course-reason"][value="' + lesson.reason.answer + '"]').click(); await this.tick();
    await this.action('check-reason'); this.phase('summary');
  }
  close() { if (this.window) this.window.close(); }
}

async function domCourses() {
  const flow = new DomCourse();
  try {
    await flow.load();
    const old = Object.fromEntries(oldKeys.map(name => [name, flow.window.localStorage.getItem(name)]));
    assert.equal(flow.getProgress().completed.length, 0);
    for (let n = 0; n < lessons.length; n++) {
      const lesson = lessons[n];
      await flow.goto('#course-' + lesson.id); flow.phase('intro');
      await flow.action('start');
      if (n === 0) {
        const first = lesson.tasks[0], control = first.model.controls.find(c => c.initial !== c.target);
        assert.equal(flow.getState().lessons[lesson.id].tasks[first.id].modelReady, false, 'Starting a lesson saves the complete untouched draft');
        assert.equal(flow.getProgress().attempted, 0, 'Saving the initial screen is not a mathematical attempt');
        const delta = control.target > control.initial ? 1 : -1;
        flow.node('[data-course-control-id="' + control.id + '"][data-course-delta="' + delta + '"]').click(); await flow.tick();
        const changed = flow.node('[data-course-control="' + control.id + '"]').value;
        await flow.reload(); assert.equal(flow.node('[data-course-control="' + control.id + '"]').value, changed, 'DOM partial action survives reload');
        await flow.model(first); await flow.fill('#course-answer', ''); await flow.action('check-answer');
        assert.equal(flow.getState().lessons[lesson.id].tasks[first.id].firstCorrect, null);
      }
      for (let index = 0; index < 6; index++) {
        if (n === 0 && index === 4) { await flow.action('hint'); await flow.reload(); }
        if (n === 0 && index === 5) {
          await flow.fill('#course-answer', answerFor(lesson.tasks[index]) + 1); await flow.action('check-answer'); await flow.reload();
          assert.equal(flow.getState().lessons[lesson.id].tasks[lesson.tasks[index].id].firstCorrect, false);
        }
        await flow.solve(lesson, index);
      }
      assert(!flow.getProgress().completed.includes(lesson.id), 'DOM needs explanation before completion');
      await flow.explain(lesson); await flow.action('new-check');
      await flow.solve(lesson, 6); await flow.solve(lesson, 7); flow.phase('summary');
    }
    assert.equal(flow.getProgress().completed.length, 40);
    assert.equal(flow.getProgress().independent.length, 158);
    assert.deepEqual(Object.fromEntries(oldKeys.map(name => [name, flow.window.localStorage.getItem(name)])), old);
    const first = lessons[0]; await flow.goto('#course-' + first.id); await flow.action('repeat');
    await flow.reload(); flow.phase('intro'); assert(flow.getProgress().completed.includes(first.id), 'Repeat preserves earlier completion after reload');
    await flow.action('start');
    for (let index = 0; index < 6; index++) await flow.solve(first, index);
    await flow.explain(first);
    assert.equal(flow.getProgress().independent.length, 158, 'DOM repetition cannot rewrite independent evidence');
    const second = lessons[1];
    await flow.goto('#course-' + second.id); await flow.action('repeat'); await flow.action('start');
    for (let index = 0; index < 6; index++) {
      if (index === 4) { await flow.action('hint'); await flow.reload(); }
      await flow.solve(second, index);
    }
    await flow.explain(second);
    assert.equal(flow.getState().lessons[second.id].tasks[second.tasks[4].id].firstHelpUsed, false);
    assert.equal(flow.getProgress().independent.length, 158, 'DOM help on rehearsal preserves historical independence');
    await flow.goto('#workshop'); assert.equal(flow.doc.getElementById('arz-courses').hidden, true);
    await flow.goto('#courses'); assert.equal(flow.doc.getElementById('arz-courses').hidden, false);
  } finally { flow.close(); }
  const geometryFlow = new DomCourse();
  try {
    const lesson = lessons.find(item => item.id === 'g-triangle-angles');
    await geometryFlow.load('#course-' + lesson.id); await geometryFlow.action('start');
    for (let index = 0; index < 6; index++) await geometryFlow.solve(lesson, index);
    await geometryFlow.explain(lesson); await geometryFlow.action('new-check'); await geometryFlow.action('show-model');
    for (const control of lesson.tasks[6].model.controls) await geometryFlow.fill('[data-course-control="' + control.id + '"]', control.target, 'change');
    assert.equal(geometryFlow.doc.querySelectorAll('#arz-courses [data-course-right-angle]').length, 0,
      'The unknown third right angle is not revealed before the numerical justification');
    await geometryFlow.fill('#course-answer', '90'); await geometryFlow.action('check-answer');
    assert.equal(geometryFlow.doc.querySelectorAll('#arz-courses [data-course-right-angle]').length, 1,
      'The proved third right angle is marked after the accepted answer');
  } finally { geometryFlow.close(); }
  const corrupted = new DomCourse();
  const damaged = '{"version":1,"lessons":'; corrupted.saved[key] = damaged;
  try {
    await corrupted.load('#course-' + lessons[0].id); corrupted.phase('intro');
    assert.match(corrupted.doc.getElementById('arz-courses').textContent, /прежняя запись сохранена/);
    await corrupted.action('start'); await corrupted.model(lessons[0].tasks[0]);
    await corrupted.fill('#course-answer', answerFor(lessons[0].tasks[0])); await corrupted.action('check-answer');
    await corrupted.action('next-task');
    assert.equal(corrupted.window.localStorage.getItem(key), damaged, 'DOM corrupt raw save is preserved');
  } finally { corrupted.close(); }
  console.log('ARZHENIKOV_COURSES_DOM_OK: all 40 lessons / 320 questions / 40 explanations; new checks; partial action/input and first errors after reload; preserved older saves and prior completion on replay; derived right-angle timing; corrupt storage remains usable. Browser layout, real keyboard and network blocking were not run in DOM mode.');
}

async function main() {
  if (process.argv.includes('--dom')) return domCourses();
  fs.mkdirSync(artifacts, {recursive: true});
  const {chromium} = require('playwright');
  const hosted = trainer ? null : await serveRepository();
  if (hosted) trainer = hosted.url;
  let browser;
  try {
    browser = await chromium.launch();
    const context = await browser.newContext({viewport: {width: 1280, height: 900}, reducedMotion: 'reduce'});
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    try { await allCourses(page); assert.deepEqual(errors, []); }
    catch (error) { await captureFailure(page, error, 'course-flow'); throw error; }
    finally { await context.close(); }
    for (const width of [320, 390, 1280]) await layoutAndRoutes(browser, width);
    await storageFailures(browser);
    await offlineBrowser(browser);
    console.log('ARZHENIKOV_COURSES_BROWSER_OK: 40 complete lessons, 320 numerical conditions, 40 explanations, fresh repeats, sticky help/errors, partial work/reload, preserved old saves, keyboard/Back, 320/390/1280 geometry and offline ZIP with HTTP blocked.');
  } catch (error) {
    if (!error.courseEvidenceCaptured) await captureFailure(null, error, 'browser-start');
    throw error;
  } finally {
    if (browser) await browser.close();
    if (hosted) await new Promise(resolve => hosted.server.close(resolve));
  }
}

if (require.main === module) main().catch(error => {console.error(error); process.exitCode = 1;});
module.exports = {answerFor, DomCourse, serveRepository};
