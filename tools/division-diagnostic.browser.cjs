'use strict';
// CI-only scripted integration tests with fictional pupils, not real accounts.
// These journeys check software behaviour, not learning outcomes in human pupils.
// Answers use the actual UI; all absolute URLs serve checkout bytes without live traffic.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const C = require('../trainers/oge-basics/multiplication-division/division-diagnostic-core.js');
const root = path.resolve(__dirname, '..');
const route = '/trainers/oge-basics/multiplication-division/division-diagnostic.html';
const cabinetOrigin = 'https://mathexam-board-ladynata.msk1.amvera.tech';
const cabinetURL = cabinetOrigin + '/learning/#division-course';
const KEY = 'mathExam.divisionDiagnostic.tab.v1';
const output = process.env.DIVISION_DIAGNOSTIC_OUTPUT_DIR;
const errors = [];
function fileResponse(url) {
  const file = path.resolve(root, '.' + new URL(url).pathname);
  if (!file.startsWith(root + path.sep)) return {status:403, body:''};
  try {
    return {status:200, contentType:({'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8'})[path.extname(file)] || 'application/octet-stream', body:fs.readFileSync(file)};
  } catch (_) { return {status:404, body:''}; }
}
function cabinetFixture(id) {
  return '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic pupil cabinet</title><link rel="stylesheet" href="/learning/style.css"><link rel="stylesheet" href="/learning/division-course.css"></head><body><main id="robot-cabinet"></main><script src="/learning/division-course-map.js"></script><script src="/learning/division-course.js"></script><script>' +
    'window.__cabinetFixture={id:' + JSON.stringify(id) + ',reads:[],opens:[],progress:[' +
    '{trainerId:"oge-basics",contentId:"multiplication-division/multiplication-meaning",completed:true,latest:{id:"synthetic-multiply",outcome:"independent"}},' +
    '{trainerId:"oge-basics",contentId:"multiplication-division/course-first-part",completed:true,latest:{id:"synthetic-first-part",outcome:"hinted"}}]};' +
    'LearningDivisionCourse.mount(document.getElementById("robot-cabinet"),{' +
    'account:{id:' + JSON.stringify(id) + ',role:"student"},attempts:[],' +
    'api:async(url,options={})=>{const f=window.__cabinetFixture,method=options.method||"GET";f.reads.push({url,method});if(url!=="/progress"||method!=="GET")throw Error("Unexpected synthetic cabinet request");return {progress:JSON.parse(JSON.stringify(f.progress))};},' +
    'openContent:async(...args)=>window.__cabinetFixture.opens.push(args)});' +
    '</script></body></html>';
}
async function cabinetSnapshot(page) {
  await page.locator('.division-course-track-heading progress').first().waitFor({state:'visible'});
  return page.evaluate(() => ({
    progress: window.__cabinetFixture.progress,
    totals: [...document.querySelectorAll('.division-course-track-heading progress')].map(node => [node.value,node.max]),
    statuses: [...document.querySelectorAll('.division-course-step .division-course-status')].map(node => node.textContent),
    reads: window.__cabinetFixture.reads, opens: window.__cabinetFixture.opens
  }));
}
const readState = page => page.evaluate(key => JSON.parse(sessionStorage.getItem(key)), KEY);
async function screenshot(page, name) {
  if (!output || !name) return;
  fs.mkdirSync(output, {recursive:true});
  await page.screenshot({path:path.join(output, name + '.png'), fullPage:true});
}
async function layout(page, name) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), name + ': no horizontal document overflow');
  if (await page.locator('#answer').count()) {
    assert(await page.locator('#answer').evaluate(node => parseFloat(getComputedStyle(node).fontSize) >= 24), name + ': answer input remains readable');
  }
}
async function reloadExact(page) {
  const before = await readState(page);
  await page.reload();
  await page.locator('#diagnostic > section').first().waitFor({state:'visible'});
  assert.deepEqual(await readState(page), before, 'Reload preserves validated answers, pending continuation and drafts');
}
async function selectPrefix(page, length, keyboard = false) {
  for (let n = 0; n < 6; n++) {
    const selected = (await readState(page)).selection;
    if (selected === length) return;
    if (keyboard) await page.locator('#question-title').press(selected < length ? 'ArrowRight' : 'ArrowLeft');
    else await page.locator('[data-do="' + (selected < length ? 'more' : 'less') + '"]').click();
  }
  throw Error('Prefix arrows did not reach ' + length);
}
async function partialRows(page) {
  return page.locator('.workspace .work > .numrow').evaluateAll(nodes => nodes.map(node => node.textContent.replace(/\s/g, '')));
}
async function answer(page, question, value, options = {}) {
  assert.equal(await page.locator('#question-title').innerText(), question.prompt);
  const before = await readState(page);
  if (question.kind === 'selection') {
    await selectPrefix(page, Number(value), options.keyboard);
    assert.equal(await page.locator('.workspace .numrow .selected').count(), Number(value), 'Arrows highlight the learner-selected prefix');
    if (options.reload) {
      await reloadExact(page);
      assert.equal(await page.locator('.workspace .numrow .selected').count(), Number(value));
    }
    await screenshot(page, options.shot);
  } else {
    await page.locator('#answer').fill(value);
    await layout(page, question.id);
    if (options.reload) {
      await reloadExact(page);
      assert.equal(await page.locator('#answer').inputValue(), value, 'Unsubmitted numeric draft survives reload');
    }
  }
  if (question.kind === 'partial') {
    assert(!(await partialRows(page)).includes(question.answer), 'The combined partial dividend is not written in the notebook before answering');
    assert.equal(await page.locator('.workspace .arrow').count(), 1, 'The source digit is indicated without revealing the combined number');
    if (options.shot) await screenshot(page, options.shot);
  }
  await page.locator('#answer-form button[type="submit"]').click();
  const accepted = await readState(page), result = accepted.records.at(-1);
  assert.equal(accepted.records.length, before.records.length + 1, 'One submitted response adds one evidence record');
  assert(accepted.accepted, 'Each response waits for explicit continuation');
  assert.equal(result.id, question.id);
  assert.equal(result.value, value);
  assert.equal(result.correct, C.isCorrect(question, value));
  assert.equal(await page.locator('.feedback.correct').count(), result.correct ? 1 : 0);
  if (question.kind === 'partial') assert((await partialRows(page)).includes(question.answer), 'Canonical partial dividend appears after the response');
  if (options.reloadAccepted) await reloadExact(page);
  await layout(page, question.id + '-accepted');
  await page.locator('[data-do="next"]').click();
}
async function exerciseFirstStep(page, expectedURL) {
  assert.equal(new URL(page.url()).pathname + new URL(page.url()).hash, expectedURL);
  if (expectedURL.includes('arithmetic-foundations.html')) {
    await page.locator('#answer').waitFor();
    const value=await page.evaluate(()=>ArithmeticFoundations.make(location.hash.slice(1),1).steps[0].answer);
    await page.locator('#answer').fill(value);await page.locator('#check').click();
    assert.equal(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('mathExam.foundations.tab.v1.'+location.hash.slice(1))).answers.length),1);
  } else if (expectedURL.startsWith('/soviet-math/')) {
    await page.locator('#lesson').waitFor({state:'visible'});
    assert.equal(await page.locator('#lesson-title').innerText(), 'Сложение столбиком');
    await page.locator('#mode-practice').click();
    await page.locator('#answer').waitFor({state:'visible'});
    const value = await page.evaluate(() => String(window.__soviet.plan().steps[0].answer));
    await page.locator('#answer').fill(value);
    await page.locator('#check').click();
    assert(await page.evaluate(() => window.__soviet.state().sessions['column-add:practice'].accepted), 'Recommended addition exercise accepts an actual first answer');
  } else if (expectedURL.endsWith('/multiplication-ladder.html')) {
    await page.waitForFunction(() => window.__trainerDebug);
    await page.locator('[data-route="practice"]').first().click();
    const q = await page.evaluate(() => window.__trainerDebug.state().current);
    if (q.kind === 'choice') await page.locator('#practiceAnswer [data-id=' + JSON.stringify(String(q.answer)) + ']').click();
    else await page.locator('#practiceAnswer input').fill(String(q.answer));
    await page.locator('#checkTask').click();
    assert(await page.locator('#practiceFeedback.good').isVisible(), 'Recommended multiplication exercise checks an actual first answer');
  } else {
    await page.locator('#practice').click();
    await page.locator('#lm-check').waitFor({state:'visible'});
    const expectedId = expectedURL.replace('/trainers/oge-basics/', '').replace(/\.html$/, '');
    assert.equal(await page.locator('body').getAttribute('data-course-id'), expectedId);
    const q = await page.evaluate(() => {
      const id = document.body.dataset.courseId;
      const {taskSpec:s, state} = window.MathExamRemediation.create(id, 1);
      return state.view === 'learn' ? s.lessons[state.lessonIndex].question : s.steps[0] || s.items[0] || s.task;
    });
    if (q.kind === 'choice') await page.locator('[data-choice=' + JSON.stringify(String(q.answer)) + ']').click();
    else await page.locator('#lm-answer').fill(String(q.answer));
    await page.locator('#lm-check').click();
    const saved = await page.evaluate(id => JSON.parse(localStorage.getItem('mathExamBasics.divisionCourse.v1.' + id)), expectedId);
    assert.equal(saved.state.feedback.kind, 'correct', 'Recommended course trainer accepts a real first action');
    assert(saved.state.answers.length > 0 || saved.state.lessonChecked.some(Boolean));
  }
}
const profiles = [
  {id:'confident', width:320, gaps:[], first:null},
  {id:'facts', width:390, gaps:['facts'], first:'facts'},
  {id:'addition', width:1060, gaps:['addition'], first:'addition'},
  {id:'subtract', width:320, gaps:['subtract'], first:'subtract'},
  {id:'first', width:390, gaps:['first'], first:'first'},
  {id:'choice', width:1060, gaps:['choice'], first:'choice'},
  {id:'multiply-two', width:390, gaps:['multiplyTwo'], first:'multiplyTwo'},
  {id:'bring', width:320, gaps:['bring'], first:'bring'},
  {id:'zero', width:390, gaps:['zero'], first:'zero'},
  {id:'occasional-error', width:1060, gaps:[], occasional:'subtract', first:'subtract'},
  {id:'mixed', width:320, gaps:['facts','addition','subtract','zero'], first:'facts'}
];
const wrongValue = q => q.kind === 'selection' ? q.answer === '1' ? '2' : '1' : String(Number(q.answer) + 1);
(async () => {
  const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.CHROMIUM_EXECUTABLE_PATH} : {})});
  const evidence = [];
  try {
    for (const profile of profiles) {
      const context = await browser.newContext({viewport:{width:profile.width, height:900}, reducedMotion:'reduce', serviceWorkers:'block'});
      const writes = [], external = [];
      await context.route('**/*', async request => {
        const req = request.request(), url = new URL(req.url());
        if (!['GET','HEAD'].includes(req.method())) { writes.push({url:req.url(), method:req.method()}); return request.fulfill({status:405, body:'No writes in synthetic tests'}); }
        if (url.origin === cabinetOrigin && url.pathname === '/learning/') return request.fulfill({status:200, contentType:'text/html; charset=utf-8', body:cabinetFixture('synthetic-' + profile.id)});
        if (url.origin === cabinetOrigin || url.origin === 'https://mathexam.space') return request.fulfill(fileResponse(req.url()));
        external.push(req.url());
        return request.fulfill({status:403, body:'External traffic is disabled in this fixture'});
      });
      context.on('page', page => { page.setDefaultTimeout(12000); page.on('pageerror', error => errors.push(profile.id + ': ' + error.message)); });
      const cabinet = await context.newPage();
      let page = cabinet;
      try {
        await cabinet.goto(cabinetURL);
        const before = await cabinetSnapshot(cabinet);
        assert.deepEqual(before.totals, [[1,16],[1,15]], 'Synthetic pupil has nonempty existing progress in both routes');
        const [diagnostic] = await Promise.all([cabinet.waitForEvent('popup'), cabinet.locator('[data-division-diagnostic] a').click()]);
        page = diagnostic;
        await page.locator('[data-do="start"]').waitFor({state:'visible'});
        assert.equal(new URL(page.url()).pathname, route);
        assert.equal(new URL(page.url()).searchParams.get('from'), 'cabinet');
        assert.equal(cabinet.url(), cabinetURL, 'Cabinet remains open in its own tab');
        assert.equal(await page.locator('#course-return').getAttribute('href'), cabinetURL);
        await page.locator('[data-do="start"]').click();
        const model = C.build(0);
        assert.equal(model.questions.length, 18);
        assert.equal(await page.locator('.numrow .selected').count(), 0, 'Correct starting prefix is not preselected');
        await page.locator('#answer-form button[type="submit"]').click();
        assert.equal((await readState(page)).records.length, 0, 'Empty selection is not counted as arithmetic evidence');
        assert(await page.locator('#input-error').isVisible());
        await selectPrefix(page, 2, true);
        await selectPrefix(page, 1, true);
        assert.equal((await readState(page)).records.length, 0, 'Arrow exploration is not scored');
        let numericReloaded = false, partialShot = false, occasionalUsed = false, acceptedReloaded = false;
        for (let i = 0; i < model.questions.length; i++) {
          const q = model.questions[i], once = profile.occasional === q.skill && !occasionalUsed;
          if (once) occasionalUsed = true;
          const wrong = profile.gaps.includes(q.skill) || once;
          const reload = i === 0 || !numericReloaded && q.kind !== 'selection';
          if (q.kind !== 'selection') numericReloaded = true;
          const shot = i === 0 ? profile.id + '-prefix-' + profile.width : q.kind === 'partial' && !partialShot ? profile.id + '-partial-' + profile.width : null;
          if (q.kind === 'partial') partialShot = true;
          const reloadAccepted = wrong && !acceptedReloaded;
          if (reloadAccepted) acceptedReloaded = true;
          await answer(page, q, wrong ? wrongValue(q) : q.answer, {keyboard:i === 0, reload, reloadAccepted, shot});
        }
        const mainRecords = (await readState(page)).records;
        assert.equal(mainRecords.length, 18);
        const affected = new Set(mainRecords.filter(r => !r.correct).map(r => r.skill));
        for (const skill of C.SKILL_ORDER.filter(skill => affected.has(skill))) {
          const q = C.confirmation(skill, 0);
          await answer(page, q, profile.gaps.includes(skill) ? wrongValue(q) : q.answer);
        }
        const finished = await readState(page);
        assert.equal(finished.screen, 'report');
        assert.equal(finished.records.length, 18 + affected.size);
        assert.equal(finished.accepted, false);
        const shown = await page.locator('.result-list li').evaluateAll(nodes => nodes.map(node => ({title:node.querySelector('h3').textContent, status:[...node.querySelector('.status').classList].find(c => c !== 'status')})));
        assert.equal(shown.length, 8);
        const skillsWith = status => C.SKILL_ORDER.filter(skill => shown.find(row => row.title === C.skills[skill].title)?.status === status);
        assert.deepEqual(skillsWith('focus'), C.SKILL_ORDER.filter(skill => profile.gaps.includes(skill)), 'Only independently repeated difficulties receive focus status');
        assert.deepEqual(skillsWith('uncertain'), profile.occasional ? [profile.occasional] : [], 'One occasional error remains uncertain');
        assert.match(await page.locator('#diagnostic').innerText(), /Рекомендации относятся только к этим заданиям/);
        const expectedURL = profile.first ? C.skills[profile.first].recommendation.url : '/trainers/oge-basics/multiplication-division/course-simple-check.html';
        const expectedLink=new URL(expectedURL,"https://mathexam.space");if(expectedLink.pathname.endsWith('/arithmetic-foundations.html')){expectedLink.searchParams.set('diagnosticVariant',0);expectedLink.searchParams.set('from','cabinet');}
        assert.equal(await page.locator('.start-here a').getAttribute('href'), expectedLink.href, 'First recommendation matches the scripted prerequisite difficulty');
        await reloadExact(page);
        await layout(page, profile.id + '-report');
        await screenshot(page, profile.id + '-report-' + profile.width);
        const [practice] = await Promise.all([page.waitForEvent('popup'), page.locator('.start-here a').click()]);
        await practice.waitForLoadState('domcontentloaded');
        await exerciseFirstStep(practice, expectedURL);
        await practice.close();
        assert.deepEqual(await cabinetSnapshot(cabinet), before, 'Diagnostic and separate practice cannot change cabinet summaries or create attempts');
        await page.locator('#course-return').click();
        await page.locator('[data-division-diagnostic]').waitFor({state:'visible'});
        assert.equal(page.url(), cabinetURL, 'Return link reopens the same synthetic cabinet route');
        assert.deepEqual(await cabinetSnapshot(page), before, 'Returning restores the same read-only progress');
        assert.deepEqual(before.reads, [{url:'/progress', method:'GET'}]);
        assert.deepEqual(before.opens, []);
        assert.deepEqual(writes, [], 'No network write or attempt submission');
        assert.deepEqual(external, [], 'No external network dependency');
        evidence.push({profile:profile.id, width:profile.width, answers:finished.records.length, expectedFocus:profile.gaps, expectedUncertain:profile.occasional || null, recommendation:expectedURL, recommendationFirstStep:'passed', cabinetProgressUnchanged:true});
        console.log('PASS: synthetic ' + profile.id + ', ' + profile.width + 'px, ' + finished.records.length + ' responses, real recommendation exercise and cabinet return');
      } catch (error) {
        await screenshot(page, profile.id + '-failure-' + profile.width);
        throw error;
      } finally { await context.close(); }
    }
    assert.deepEqual(errors, [], 'No browser JavaScript exceptions');
    if (output) fs.writeFileSync(path.join(output, 'scripted-pupil-evidence.json'), JSON.stringify({scope:'Scripted integration checks; these do not measure human learning outcomes.',profiles:evidence}, null, 2));
    console.log('DIVISION_DIAGNOSTIC_ROBOTS_OK: 11 fictional pupils, every skill, occasional/mixed errors, real cabinet entry and recommendation exercise, unchanged progress, 320/390/1060px and no live traffic.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
