'use strict';

const assert = require('node:assert/strict');

// Rewrite two responses only on the local test server. The course identities and
// normal personal/room entry points are identical to a regular teaching session.
const ids = [92, 93].map(n => 'atanasyan-7-9-main-' + n + '-part-1');
function fixtureBytes(source) {
  const course = JSON.parse(source);
  for (const id of ids) {
    const lesson = course.lessons.find(item => item.id === id);
    lesson.answer = {mode: 'exact', prompt: 'Чему равно 3+4?', accepted: ['7'], feedback: 'Проверь сумму.'};
  }
  return JSON.stringify(course);
}

async function enter(surface, value) {
  await surface.locator('#final-answer').fill(value);
  await surface.locator('[data-final-form] button').click();
}

async function personal(page, origin) {
  for (const [index, id] of ids.entries()) {
    const useHelp = index === 1, key = 'mathExamTextbook.v1:atanasyan-2023-7-9:' + id + ':r1';
    await page.goto(origin + '/geometry-course/textbook/#' + id);
    await enter(page, '6');
    const state = () => page.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
    assert.equal((await state()).assisted, false);
    assert.equal((await state()).checked, false);
    if (useHelp) await page.locator('[data-main-help] > summary').click();
    await page.reload();
    assert.equal(await page.locator('#final-answer').inputValue(), '6');
    assert.equal((await state()).assisted, useHelp);
    await enter(page, '7');
    assert.match(await page.locator('[data-final-feedback]').innerText(), useHelp ? /после обращения к помощи/ : /самостоятельно/);
    await page.reload();
    assert.equal(await page.locator('#final-answer').inputValue(), '7');
    const result = await state();
    assert.equal(result.assisted, useHelp);
    assert.equal(result.checked, true);
  }
}

async function verify({origin, teacher, student, connected, frameFor, handoff, sync}) {
  const separate = await teacher.context().newPage();
  try { await personal(separate, origin); } finally { await separate.close(); }
  await teacher.locator('#chooseTrainer').click();
  if (!await teacher.locator('#manualTrainerEntry').evaluate(e => e.open)) await teacher.locator('#manualTrainerEntry summary').click();
  await teacher.locator('#trainerUrl').fill('/trainers/atanasyan-grade7.html');
  await teacher.locator('#openTrainer').click();
  if (await teacher.locator('#pickerClose').isVisible()) await teacher.locator('#pickerClose').click();
  await Promise.all([connected(teacher), connected(student)]);
  const instructor = await frameFor(teacher, 'atanasyan-grade7.html');
  let learner = await frameFor(student, 'atanasyan-grade7.html');
  for (const [index, id] of ids.entries()) {
    const useHelp = index === 1;
    if (index) await instructor.getByRole('button', {name: '← Все материалы курса', exact: true}).click();
    await instructor.locator('#catalog-search').fill(id.split('-')[4]);
    await instructor.locator('[data-lesson="' + id + '"]').click();
    await enter(instructor, '6');
    const wrong = await sync(instructor, learner, 'unassisted incorrect response');
    assert.equal(wrong.work.assisted, false);
    assert.equal(wrong.work.checked, false);
    assert.equal(wrong.view.feedback.final, 'wrong');
    if (useHelp) {
      await instructor.locator('[data-main-help] > summary').click();
      assert.equal((await sync(instructor, learner, 'requested help')).work.assisted, true);
    }
    await student.reload();
    await connected(student);
    learner = await frameFor(student, 'atanasyan-grade7.html');
    assert.equal((await sync(instructor, learner, 'draft after rejoining')).work.draft, '6');
    await handoff(teacher, student, true);
    await enter(learner, '7');
    const corrected = await sync(learner, instructor, 'correction from pupil');
    assert.equal(corrected.work.checked, true);
    assert.equal(corrected.work.assisted, useHelp);
    assert.equal(corrected.view.feedback.final, useHelp ? 'assisted' : 'independent');
    assert.match(await instructor.locator('[data-final-feedback]').innerText(), useHelp ? /после обращения к помощи/ : /самостоятельно/);
    await handoff(teacher, student, false);
  }
  console.log('EXACT_CORRECTION_PERSONAL_AND_ROOM_OK');
}

module.exports = {fixtureBytes, verify};
