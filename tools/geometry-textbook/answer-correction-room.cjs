'use strict';

const assert = require('node:assert/strict');

const examples = [
  {number: 981, wrong: '20', right: '10', reason: 'сумма оснований', useHelp: false},
  {number: 984, wrong: '2,5', right: '16', reason: 'разность', useHelp: true}
];

async function enter(surface, value) {
  await surface.locator('#final-answer').fill(value);
  await surface.locator('[data-final-form] button').click();
}

async function personal(browser, origin) {
  for (const example of examples) {
    const page = await browser.newPage();
    try { await personalExample(page, origin, example); } finally { await page.close(); }
  }
}

async function personalExample(page, origin, {number, wrong, right, reason, useHelp}) {
  const id = 'atanasyan-7-9-main-' + number + '-part-1';
  const key = 'mathExamTextbook.v1:atanasyan-2023-7-9:' + id + ':r1';
  await page.goto(origin + '/geometry-course/textbook/#' + id);
  await enter(page, wrong);
  assert((await page.locator('[data-final-feedback]').innerText()).includes(reason));
  const state = () => page.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
  assert.equal((await state()).assisted, false);
  assert.equal((await state()).checked, false);
  if (useHelp) await page.locator('[data-main-help] > summary').click();
  await page.reload();
  assert.equal(await page.locator('#final-answer').inputValue(), wrong);
  assert.equal((await state()).assisted, useHelp);
  await enter(page, right);
  assert.match(await page.locator('[data-final-feedback]').innerText(), useHelp ? /после обращения к помощи/ : /самостоятельно/);
  await page.reload();
  assert.equal(await page.locator('#final-answer').inputValue(), right);
  const result = await state();
  assert.equal(result.assisted, useHelp);
  assert.equal(result.checked, true);
  const help = page.locator('[data-main-help]');
  if (!await help.evaluate(el => el.open)) await help.locator(':scope > summary').click();
  await page.getByRole('button', {name:'Разобрать по шагам',exact:true}).click();
  await page.reload();
  assert.equal((await state()).assisted, useHelp, 'Later review preserves the original outcome');
}

async function verify({origin, teacher, student, connected, frameFor, handoff, sync}) {
  await teacher.locator('#chooseTrainer').click();
  if (!await teacher.locator('#manualTrainerEntry').evaluate(e => e.open)) await teacher.locator('#manualTrainerEntry summary').click();
  await teacher.locator('#trainerUrl').fill('/trainers/atanasyan-grade7.html?scope=book');
  await teacher.locator('#openTrainer').click();
  if (await teacher.locator('#pickerClose').isVisible()) await teacher.locator('#pickerClose').click();
  await Promise.all([connected(teacher), connected(student)]);
  const instructor = await frameFor(teacher, 'atanasyan-grade7.html');
  let learner = await frameFor(student, 'atanasyan-grade7.html');
  for (const [index, {number, wrong, right, reason, useHelp}] of examples.entries()) {
    const id = 'atanasyan-7-9-main-' + number + '-part-1';
    if (index) await instructor.getByRole('button', {name: '← Все материалы курса', exact: true}).click();
    await instructor.locator('#catalog-search').fill(String(number));
    await instructor.locator('[data-lesson="' + id + '"]').click();
    await enter(instructor, wrong);
    const incorrect = await sync(instructor, learner, 'unassisted incorrect response');
    assert.equal(incorrect.work.assisted, false);
    assert.equal(incorrect.work.checked, false);
    assert.equal(incorrect.view.feedback.final, 'wrong');
    assert((await learner.locator('[data-final-feedback]').innerText()).includes(reason));
    if (useHelp) {
      await instructor.locator('[data-main-help] > summary').click();
      assert.equal((await sync(instructor, learner, 'requested help')).work.assisted, true);
    }
    await student.reload();
    await connected(student);
    learner = await frameFor(student, 'atanasyan-grade7.html');
    assert.equal((await sync(instructor, learner, 'draft after rejoining')).work.draft, wrong);
    await handoff(teacher, student, true);
    await enter(learner, right);
    const corrected = await sync(learner, instructor, 'correction from pupil');
    assert.equal(corrected.work.checked, true);
    assert.equal(corrected.work.assisted, useHelp);
    assert.equal(corrected.view.feedback.final, useHelp ? 'assisted' : 'independent');
    assert.match(await instructor.locator('[data-final-feedback]').innerText(), useHelp ? /после обращения к помощи/ : /самостоятельно/);
    const help = learner.locator('[data-main-help]');
    if (!await help.evaluate(el => el.open)) await help.locator(':scope > summary').click();
    await learner.getByRole('button', {name:'Разобрать по шагам',exact:true}).click();
    await learner.getByRole('button', {name:'Следующий шаг',exact:true}).press('Enter');
    await learner.locator('[data-case="case-2"]').click();
    const review = await sync(learner, instructor, 'review step and selected drawing after grading');
    assert.equal(review.work.checked, true);
    assert.equal(review.work.assisted, useHelp);
    assert.equal(await instructor.locator('[data-main-model] svg').getAttribute('data-view'), 'case-2');
    await handoff(teacher, student, false);
  }
  console.log('EXACT_CORRECTION_PERSONAL_AND_ROOM_OK');
}

module.exports = {personal, verify};
