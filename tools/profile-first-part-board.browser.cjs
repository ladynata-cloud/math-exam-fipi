'use strict';

const assert = require('node:assert/strict');
const examMap = require('../ege-profil/exam-map.js');
const {
  withLocalBoard, contextFor, connected, profileFrame, snapshot, synchronized,
  changedModel, handoff, personalStorage
} = require('./profile-added-board.browser.cjs');

const sections = [
  [5, 'compound-probability', '__profileCompoundProbabilityBoard'],
  [8, 'derivative', '__profileDerivativeBoard'],
  [9, 'formulas', '__profileFormulasBoard'],
  [10, 'word-problems', '__profileWordProblemsBoard'],
  [11, 'functions', '__profileFunctionsBoard'],
  [12, 'extrema', '__profileExtremaBoard']
];
const course = '/ege-profil/start/index.html';

async function openFromCourseLink(teacher, path) {
  await teacher.locator('#chooseTrainer').click();
  const manual = teacher.locator('#manualTrainerEntry');
  if (!await manual.evaluate(element => element.open)) await manual.locator('summary').click();
  await manual.locator('#trainerUrl').fill(path);
  await manual.locator('#openTrainer').click();
  if (await teacher.locator('#trainerPicker').isVisible()) await teacher.locator('#pickerClose').click();
}

async function verifyCatalog(page, boardOrigin) {
  const { trainers } = await (await fetch(boardOrigin + '/api/trainer-registry')).json();
  const registered = new Set(trainers.map(item => '/' + item.file));
  const paths = examMap.entries.filter(item => item.number <= 12).flatMap(entry => [
    examMap.hash(entry), ...entry.lessonIds.map(id => '#lesson/' + id)
  ]);
  const mapped = await page.evaluate(({ course, paths }) => paths.map(hash => {
    const url = new URL(BoardPicker.normalize(course + hash), location.href);
    return { hash, path: url.pathname, route: url.hash };
  }), { course, paths });
  for (const item of mapped) assert(registered.has(item.path), item.hash + ': registered board trainer');
  assert.equal(mapped.find(item => item.hash === '#lesson/fn-explog').path,
    '/trainers/ege-profile-log-trig.html', 'existing direct log/exp graph entrance keeps its adapter');
  for (const [number, name] of sections) {
    const hash = examMap.hash(examMap.get(number));
    const selected = mapped.find(item => item.hash === hash);
    assert.equal(selected.path, '/trainers/ege-profile-' + name + '.html', hash);
    assert.equal(selected.route, hash, hash + ': current exam number is preserved');
  }
}

async function exerciseModel(teacher, student, lesson, selector = '#task-model') {
  const host = teacher.locator(selector);
  const buttons = host.locator('button');
  assert(await buttons.count() > 0, lesson + ': authored model has an interactive control');
  for (const button of await buttons.all()) {
    await changedModel(teacher, student, () => button.click(), lesson + ': toggle diagram layer');
  }
  const cursor = host.locator('input[type="range"]');
  if (await cursor.count()) {
    await host.locator('details > summary').click();
    // The native <details> toggle event updates the model after the click.
    await teacher.waitForFunction(() => window.__profileGateApi.getState().view.model.explore === true);
    await synchronized(teacher, student, lesson + ': open graph exploration');
    const arrow = await cursor.evaluate(el => Number(el.value) < Number(el.max) ? 'ArrowRight' : 'ArrowLeft');
    await changedModel(teacher, student, () => cursor.press(arrow), lesson + ': move graph cursor');
  }
}

async function exerciseLesson(t, s, entry, id) {
  await t.locator('#main a[href="#practice/' + id + '/independent"]').first().click();
  await t.locator('#answer-form').waitFor();
  const initial = await synchronized(t, s, id + ': same condition and task');
  const session = initial.progress.sessions[id + ':independent'];
  assert.equal(initial.route, '#practice/' + id + '/independent');
  assert(session.taskId, id + ': exact task identity');
  assert((await t.locator('.task-condition').innerText()).trim(), id + ': nonempty problem');
  await t.locator('#answer').fill('2/');
  const edited = await synchronized(t, s, id + ': unfinished answer');
  assert.equal(edited.progress.sessions[id + ':independent'].draft, '2/');
  await t.locator('#hint').click();
  assert.equal(await t.locator('#hint').getAttribute('aria-expanded'), 'true');
  await synchronized(t, s, id + ': hint');
  await exerciseModel(t, s, id);
  await t.locator('.practice-head a[href="#lesson/' + id + '"]').click();
  await t.locator('#independent').waitFor();
  const lab = t.locator('#explore-lab');
  if (await lab.count()) {
    await lab.locator('summary').first().click();
    const study = await synchronized(t, s, id + ': lesson laboratory');
    assert.equal(study.view.details.lab, true);
    await exerciseModel(t, s, id, '#lab');
  }
  await t.locator('#independent').click(); await t.locator('#answer-form').waitFor();
  const resumed = await synchronized(t, s, id + ': return from the lesson');
  assert.equal(resumed.progress.sessions[id + ':independent'].draft, '2/');
  const tasks = await t.evaluate(id => ProfileLessons.find(lesson => lesson.id === id).tasks.map(task => task.id), id);
  assert(tasks.includes(session.taskId));
  assert.equal(tasks.length, 6, id + ': complete authored task bank');
  console.log('PASS №' + entry.number + ' ' + id + ': task, draft, hint and diagram');
}

async function guidedMotionMicroSteps(t, teacher, student, config) {
  await t.locator('.topbar .brand').click();
  await t.locator('#main a[href="#practice/applied-motion/independent"]').first().click();
  await t.locator('.practice-head a[href="#lesson/applied-motion"]').click();
  await t.locator('#guided').click();
  if (await t.locator('#calm-toggle').getAttribute('aria-pressed') === 'false') await t.locator('#calm-toggle').click();
  let s = await profileFrame(student, config);
  const data = await t.evaluate(() => {
    const session = window.__profileGateApi.getState().progress.sessions['applied-motion:guided'];
    const task = ProfileLessons.find(lesson => lesson.id === 'applied-motion').tasks.find(item => item.id === session.taskId);
    return ProfileCalmMicro.steps(task, session.step);
  });
  assert.equal(data.length, 4);
  await t.locator('#micro-start').click();
  await s.locator('#micro-form').waitFor();
  assert.equal(await s.locator('#answer-form').isVisible(), false, 'peer sees micro assistance before any input');
  const wrong = data[0].choices.find(option => option !== data[0].answer);
  await t.locator('#micro-answer').selectOption(wrong);
  await synchronized(t, s, 'micro: selected draft');
  assert.equal(await s.locator('#micro-answer').inputValue(), wrong);
  await t.locator('#micro-form button').click();
  await s.waitForFunction(() => Boolean(document.querySelector('#micro-feedback')?.textContent.trim()));
  assert.equal(await s.locator('#micro-feedback').innerText(), await t.locator('#micro-feedback').innerText());
  for (const [index, item] of data.entries()) {
    assert.equal(await s.locator('#micro-question').innerText(), await t.locator('#micro-question').innerText());
    const field = t.locator('#micro-answer');
    if (item.choices) {
      await field.selectOption(String(item.answer));
    } else {
      await field.fill('4/');
      await synchronized(t, s, 'micro: unfinished numeric draft');
      await student.reload(); await connected(student);
      s = await profileFrame(student, config);
      await s.locator('#micro-answer').waitFor();
      await synchronized(t, s, 'micro: observer reload');
      assert.equal(await s.locator('#micro-answer').inputValue(), '4/');
      assert.equal(await s.locator('.micro-support li').count(), index);
      await field.fill(String(item.answer));
    }
    await t.locator('#micro-form button').click();
    await s.waitForFunction(count => document.querySelectorAll('.micro-support li').length === count, index + 1);
    const shared = await synchronized(t, s, 'micro: accepted preparation step ' + (index + 1));
    assert.equal(shared.progress.sessions['applied-motion:guided'].answers.length, 0, 'preparation does not answer the main step');
  }
  assert(await s.locator('#answer-form').isVisible(), 'both can continue at the original question');
  await handoff(teacher, student, config, true);
  await s.locator('#answer').fill('7/9');
  await synchronized(s, t, 'micro: pupil can enter the main answer after help');
  await handoff(teacher, student, config, false);
  console.log('PASS №10 guided motion: micro open, choice, feedback, four answers, restored numeric draft, main question and handoff');
}

async function run(browser, origin, boardOrigin) {
  const teacher = await contextFor(browser, origin, boardOrigin, 'profile-first-teacher');
  const student = await contextFor(browser, origin, boardOrigin, 'profile-first-student');
  await teacher.page.goto(origin + '/trainers/trainer-board.html?server=' + encodeURIComponent(boardOrigin));
  await teacher.page.locator('#openShare').click();
  await teacher.page.locator('#createRoom').click();
  await teacher.page.waitForFunction(() => document.querySelector('#studentLink')?.value.includes('role=student'));
  const invite = await teacher.page.locator('#studentLink').inputValue();
  await teacher.page.locator('#sharePanel [data-close-panel]').click();
  await student.page.goto(invite);
  await verifyCatalog(teacher.page, boardOrigin);

  for (const [number, name, api] of sections) {
    const entry = examMap.get(number), hash = examMap.hash(entry);
    const id = 'ege-profile-' + name, config = { id, wrapper: id + '.html', api };
    await openFromCourseLink(teacher.page, course + hash);
    let t = await profileFrame(teacher.page, config), s = await profileFrame(student.page, config);
    await Promise.all([connected(teacher.page), connected(student.page)]);
    for (const lesson of entry.lessonIds) {
      if (await t.evaluate(() => location.hash) !== hash) await t.locator('.topbar .brand').click();
      await t.waitForFunction(hash => location.hash === hash, hash);
      await exerciseLesson(t, s, entry, lesson);
    }

    // Confirm the current problem and its open diagram survive late arrival,
    // observer reload, reconnecting the teacher and student-to-teacher input.
    const late = await contextFor(browser, origin, boardOrigin, 'profile-first-late-' + number);
    await late.page.goto(invite);
    await connected(late.page);
    await synchronized(t, await profileFrame(late.page, config), id + ': late join');
    await personalStorage(late);
    await late.context.close();

    await student.page.reload(); await connected(student.page);
    s = await profileFrame(student.page, config);
    await synchronized(t, s, id + ': observer reload');
    await handoff(teacher.page, student.page, config, true);
    await s.locator('#answer').fill('17/6');
    await synchronized(s, t, id + ': student is the writer');
    const before = await snapshot(s);
    await teacher.page.reload(); await connected(teacher.page);
    t = await profileFrame(teacher.page, config);
    assert.deepEqual(await synchronized(s, t, id + ': teacher reconnect'), before);
    await handoff(teacher.page, student.page, config, false);
    await t.locator('#answer').fill('19/7');
    await synchronized(t, s, id + ': teacher resumes after revocation');
    const lesson = entry.lessonIds.at(-1), key = lesson + ':independent';
    const oldTask = (await snapshot(t)).progress.sessions[key].taskId;
    const correct = await t.evaluate(({ lesson, oldTask }) =>
      String(ProfileLessons.find(item => item.id === lesson).tasks.find(task => task.id === oldTask).answer),
      { lesson, oldTask });
    await t.locator('#answer').fill(correct); await t.locator('#submit-answer').click();
    await t.locator('#next').waitFor();
    await synchronized(t, s, id + ': accepted answer');
    await t.locator('#next').click(); await t.locator('#another').waitFor();
    await synchronized(t, s, id + ': finished work');
    await t.locator('#another').click(); await t.locator('#answer-form').waitFor();
    const next = await synchronized(t, s, id + ': next task in the same lesson');
    assert.notEqual(next.progress.sessions[key].taskId, oldTask, 'both users moved to a different condition');
    if (number === 10) await guidedMotionMicroSteps(t, teacher.page, student.page, config);
  }
  const derivative = { id: 'ege-profile-derivative', wrapper: 'ege-profile-derivative.html', api: '__profileDerivativeBoard' };
  for (const lesson of examMap.get(8).preparationIds) {
    await openFromCourseLink(teacher.page, course + '#lesson/' + lesson);
    const t = await profileFrame(teacher.page, derivative), s = await profileFrame(student.page, derivative);
    await t.waitForFunction(id => location.hash === '#lesson/' + id, lesson);
    await t.locator('#independent').click(); await t.locator('#answer-form').waitFor();
    const result = await synchronized(t, s, lesson + ': derivative preparation lesson');
    assert.equal(result.route, '#practice/' + lesson + '/independent');
  }
  await Promise.all([teacher, student].map(personalStorage));
  console.log('PROFILE_FIRST_PART_BOARD_OK: all 12 official routes and 50 topic links registered; six added sections exercised with two writers and late joiners');
}

withLocalBoard(run).catch(error => { console.error(error); process.exitCode = 1; });
