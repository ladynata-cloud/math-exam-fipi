'use strict';

// Learner journeys for the first three profile EGE tasks. The mathematical bank
// is checked separately; this gate checks the visible route, earned work,
// models, input, keyboard/touch controls and unchanged neighbouring lessons.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('playwright');
const geometry = require('../ege-profil/start/geometry-data');
const algebra = require('../ege-profil/start/algebra-data');
const stereo = require('../ege-profil/start/stereo-data');
const lessons = [...geometry, ...algebra, ...stereo];
const firstThree = lessons.filter(l => [1, 2, 3].includes(l.position));
const root = path.resolve(__dirname, '..');
const KEY = 'mathexam.profileStart2027.v1';
const SHOTS = process.env.PROFILE_FIRST_THREE_SHOTS || '/tmp/profile-first-three-shots';
const mime = {'.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml'};
const server = http.createServer((req, res) => {
  try {
    let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://fixture').pathname));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    res.setHeader('Content-Type', mime[path.extname(file)] || 'text/html');
    res.end(fs.readFileSync(file));
  } catch (_) { res.writeHead(404).end(); }
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const base = origin + '/ege-profil/start/index.html';
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
    headless: true,
    args: ['--no-sandbox']
  });
  const errors = [];
  let mounted = 0, completed = 0;
  const contexts = [];
  try {
    fs.mkdirSync(SHOTS, {recursive:true});
    async function learner(options = {}) {
      const context = await browser.newContext({viewport:{width:1280, height:900}, ...options});
      contexts.push(context);
      const page = await context.newPage();
      page.setDefaultTimeout(12000);
      page.on('pageerror', error => errors.push(error.message));
      return page;
    }
    const page = await learner();
    async function go(hash, target = page) {
      await target.goto(base + hash);
      await target.locator('main h1').waitFor();
    }
    async function saved(target = page) {
      return target.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
    }
    async function session(id, mode, target = page) {
      return (await saved(target)).sessions[id + ':' + mode];
    }
    async function currentTask(id, mode, target = page) {
      const s = await session(id, mode, target);
      return lessons.find(l => l.id === id).tasks.find(t => t.id === s.taskId);
    }
    async function fillAnswer(q, value = String(q.answer), target = page) {
      if (q.choices) {
        const choices = target.locator('input[name="answer"]');
        const values = await choices.evaluateAll(es => es.map(e => e.value));
        const index = values.indexOf(value);
        assert(index >= 0, 'Missing answer choice: ' + value);
        await choices.nth(index).check();
      } else await target.locator('#answer').fill(value);
    }
    async function accept(q, value = String(q.answer), target = page) {
      await fillAnswer(q, value, target);
      await target.locator('#submit-answer').click();
      await target.locator('#feedback.good').waitFor();
      assert(await target.locator('#next').isEnabled(), 'Accepted answer permits the next step');
      assert(await target.locator('#submit-answer').isDisabled(), 'Accepted answer is registered once');
    }
    async function finish(id, mode = 'guided', target = page) {
      const task = await currentTask(id, mode, target);
      const s = await session(id, mode, target);
      for (const q of mode === 'guided' ? task.steps.slice(s.step) : [task]) {
        await accept(q, String(q.answer), target);
        await target.locator('#next').click();
      }
      await target.locator('.result-panel').waitFor();
      completed++;
      return task;
    }
    async function seedTask(target, lesson, task, mode = 'guided') {
      // Fixture only: visit every authored model, including later task variants,
      // without making the learner perform unrelated previous exercises.
      await target.evaluate(({key,id,taskId,mode}) => {
        localStorage.setItem(key, JSON.stringify({version:1, records:{}, seen:{[taskId]:1}, sessions:{
          [id + ':' + mode]: {taskId,step:0,wrong:false,assisted:mode==='guided',familiar:false,done:false,draft:'',answers:[],started:'2026-10-07T00:00:00.000Z',registered:false}
        }}));
      }, {key:KEY,id:lesson.id,taskId:task.id,mode});
      // Changing only the hash would retain the old in-memory session. The
      // fixture query makes each seeded task a fresh document load.
      await target.goto(base + '?task-fixture=' + encodeURIComponent(task.id + '-' + mode) + '#practice/' + lesson.id + '/' + mode);
      await target.locator('main h1').waitFor();
      await target.locator('#answer-form').waitFor();
    }
    async function noOverflow(target, label) {
      assert(await target.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Horizontal page overflow: ' + label);
    }

    // The three-number entry is short and every card reaches its own topics.
    await go('#first-three');
    assert.equal(await page.locator('.exam-card').count(), 3);
    for (const number of [1, 2, 3]) {
      await go('#first-three');
      await page.locator('.exam-card[href="#exam/' + number + '"]').click();
      await page.locator('.exam-topic').first().waitFor();
      assert.equal(await page.locator('.exam-topic').count(), firstThree.filter(l => l.position === number).length);
      assert.equal(new URL(page.url()).hash, '#exam/' + number);
      await page.locator('#exam-start').click();
      await page.locator('#answer-form').waitFor();
      await page.locator('#task-model svg').first().waitFor();
    }
    await page.evaluate(() => localStorage.setItem('mathExamCourseProgress.v1', 'legacy-preserved'));

    // A real guided solution: an error cannot advance, previous work remains
    // visible, and both a completed step and the current draft survive reload.
    await go('#practice/geo-right/guided');
    let task = await currentTask('geo-right', 'guided');
    assert.equal(task.id, 'geo-right-hypotenuse');
    await page.locator('#task-model svg').first().waitFor();
    assert.equal(await page.locator('#solution-history [data-step]').count(), 0);
    assert(await page.locator('#next').isDisabled());
    await fillAnswer(task.steps[0], '224');
    await page.locator('#submit-answer').click();
    await page.locator('#feedback.bad').waitFor();
    assert(await page.locator('#next').isDisabled());
    assert.equal((await session('geo-right', 'guided')).step, 0);
    await accept(task.steps[0], '225');
    await page.locator('#next').click();
    assert.equal(await page.locator('#solution-history [data-step]').count(), 1);
    assert.match(await page.locator('#solution-history').innerText(), /225/);
    assert.match(await page.locator('#current-step').innerText(), /2/);
    await page.locator('#answer').fill('14,5');
    await page.reload();
    assert.equal(await page.locator('#answer').inputValue(), '14,5');
    assert.equal(await page.locator('#solution-history [data-step]').count(), 1);
    assert.match(await page.locator('#solution-history').innerText(), /225/);
    await accept(task.steps[1], '15');
    await page.locator('#next').click();
    await page.locator('.result-panel').waitFor();
    assert.equal(await page.locator('#solution-history [data-step]').count(), task.steps.length);
    const completedRecord = (await saved()).records['geo-right'];
    await page.reload();
    assert.equal(await page.locator('#solution-history [data-step]').count(), task.steps.length);
    assert.deepEqual((await saved()).records['geo-right'], completedRecord, 'Reload does not duplicate a completion');
    completed++;

    // Both decimal comma and fraction notation work in the actual input flow.
    await go('#practice/geo-similarity/guided');
    task = await currentTask('geo-similarity', 'guided');
    assert.equal(task.steps[0].answer, 2.5);
    await accept(task.steps[0], '2,5');
    await page.locator('#next').click();
    await finish('geo-similarity');
    await go('#practice/vec-dot/independent');
    task = await currentTask('vec-dot', 'independent');
    await finish('vec-dot', 'independent');

    // Keep task controls tied to the actual givens. Unknown values are not
    // replaced by the answer merely by opening or interacting with the model.
    const fixture = await learner();
    await go('#first-three', fixture);
    const geoRight = geometry.find(l => l.id === 'geo-right');
    const cosine = geoRight.tasks.find(t => t.id === 'geo-right-cosine');
    await seedTask(fixture, geoRight, cosine, 'independent');
    await fixture.locator('#answer').fill('14');
    await go('#exam/1', fixture);
    assert.equal(await fixture.locator('#exam-start').getAttribute('href'), '#practice/geo-right/independent', 'An unfinished independent attempt resumes in its original mode');
    await fixture.locator('#exam-start').click();
    assert.equal(await fixture.locator('#answer').inputValue(), '14');
    const planText = await fixture.locator('#task-model').innerText();
    assert(!/(^|[^\d])15([^\d]|$)/.test(planText), 'Unknown hypotenuse 15 must not be printed before solving');
    assert.equal(await fixture.locator('#solution-history [data-step]').count(), 0);
    assert(await fixture.locator('#hint-box').isHidden());
    await fixture.locator('[data-trig-open]').click();
    assert.equal((await session('geo-right','independent',fixture)).assisted, true, 'The requested triangle explanation is recorded as help before answering');
    const vecDot = geometry.find(l => l.id === 'vec-dot');
    const vecCosine = vecDot.tasks.find(t => t.id === 'vec-dot-cosine');
    await seedTask(fixture, vecDot, vecCosine, 'independent');
    assert(!/[−-]0[,.]5|[−-]1\s*\/\s*2/.test(await fixture.locator('#task-model').innerText()), 'Unknown cosine must not be printed before solving');
    await accept(vecCosine, '-1/2', fixture);
    await fixture.locator('#hint').click();
    assert.equal((await session('vec-dot','independent',fixture)).assisted, false, 'Reading after an accepted independent answer cannot remove earned credit');
    await fixture.locator('.practice-head a[href="#lesson/vec-dot"]').click();
    await fixture.locator('#guided').waitFor();
    await go('#practice/vec-dot/independent', fixture);
    assert.equal((await session('vec-dot','independent',fixture)).assisted, false, 'Reviewing the rule after answering preserves earned credit');
    assert(await fixture.locator('#next').isEnabled());
    await fixture.locator('#next').click();
    await fixture.locator('.result-panel').waitFor();
    assert((await saved(fixture)).records['vec-dot'].independent.includes(vecCosine.id));
    completed++;

    // A useful construction is one explicit control, also usable by keyboard.
    const quadrilaterals = geometry.find(l => l.id === 'geo-quadrilaterals');
    const rectangle = quadrilaterals.tasks.find(t => t.id === 'geo-quad-rectangle');
    await seedTask(fixture, quadrilaterals, rectangle);
    const drawDiagonal = fixture.getByRole('button', {name:'Провести диагональ',exact:true});
    assert.equal(await drawDiagonal.getAttribute('aria-pressed'), 'false');
    await drawDiagonal.focus();
    await fixture.keyboard.press('Enter');
    assert.equal(await drawDiagonal.getAttribute('aria-pressed'), 'true');
    assert.equal(await fixture.locator('[data-model-layer="Провести диагональ"]').getAttribute('visibility'), 'visible');
    assert(!/(^|[^\d])25([^\d]|$)/.test(await fixture.locator('#task-model').innerText()), 'Drawing a diagonal must not reveal its unknown length');
    await fixture.keyboard.press('Space');
    assert.equal(await drawDiagonal.getAttribute('aria-pressed'), 'false');
    const coordinates = geometry.find(l => l.id === 'vec-coordinates');
    await seedTask(fixture, coordinates, coordinates.tasks[0]);
    const projections = fixture.locator('[data-model-action="projection"]');
    await projections.focus();
    await fixture.keyboard.press('Enter');
    assert.equal(await projections.getAttribute('aria-pressed'), 'true');
    assert(await fixture.locator('#task-model [data-projection]').count() >= 2);
    const unknownStart = coordinates.tasks.find(t => t.id === 'vec-coordinates-start');
    await seedTask(fixture, coordinates, unknownStart, 'independent');
    assert.equal(await fixture.locator('#task-model [data-point="A"]').count(), 0, 'Unknown A is not plotted at the answer coordinates');
    assert.equal(await fixture.locator('#task-model [data-point="B"]').count(), 1);

    // A vector lesson and a solid lesson can each be completed end to end.
    await go('#practice/vec-coordinates/guided');
    await finish('vec-coordinates');
    const solidLesson = stereo[0];
    await go('#practice/' + solidLesson.id + '/guided');
    await finish(solidLesson.id);

    // Every authored first-three task has its own mounted, finite SVG. This
    // catches a variant whose metadata is missing even when its answer works.
    for (const lesson of firstThree) {
      for (const [index, t] of lesson.tasks.entries()) {
        const mode = index >= lesson.tasks.length - 3 ? 'independent' : 'guided';
        await seedTask(fixture, lesson, t, mode);
        const svg = fixture.locator('#task-model svg').first();
        await svg.waitFor();
        const svgMarkup = await svg.evaluate(el => el.outerHTML);
        assert(!/(?:NaN|Infinity|undefined)/.test(svgMarkup), 'Invalid geometry in ' + t.id);
        assert.equal(await fixture.locator('#solution-history [data-step]').count(), 0, 'No unearned steps in ' + t.id);
        assert(await fixture.locator('#task-model').innerText(), 'A labelled model for ' + t.id);
        mounted++;
        if (lesson.position === 3) await finish(lesson.id, mode, fixture);
      }
    }

    // Rotation must work with a keyboard and with an actual touch gesture.
    await seedTask(fixture, solidLesson, solidLesson.tasks[0]);
    const solid = fixture.locator('#task-model svg[data-yaw]').first();
    await solid.waitFor();
    const beforeYaw = await solid.getAttribute('data-yaw');
    await solid.focus();
    await fixture.keyboard.press('ArrowRight');
    assert.notEqual(await solid.getAttribute('data-yaw'), beforeYaw, 'Solid responds to keyboard rotation');
    await fixture.keyboard.press('Home');
    assert.equal(await solid.getAttribute('data-yaw'), beforeYaw, 'Home restores the original solid view');
    const oldLabels = await fixture.locator('#task-model [data-known-label]').allTextContents();
    await fixture.getByRole('button', {name:'Повернуть вправо', exact:true}).click();
    assert.deepEqual(await fixture.locator('#task-model [data-known-label]').allTextContents(), oldLabels, 'Rotation preserves the givens');

    const mobile = await learner({viewport:{width:390,height:844}, isMobile:true, hasTouch:true});
    await go('#practice/' + solidLesson.id + '/guided', mobile);
    const mobileSolid = mobile.locator('#task-model svg[data-yaw]').first();
    await mobileSolid.scrollIntoViewIfNeeded();
    const box = await mobileSolid.boundingBox();
    const mobileBefore = await mobileSolid.getAttribute('data-yaw');
    const cdp = await mobile.context().newCDPSession(mobile);
    const start = {x:box.x + box.width * .4, y:box.y + box.height * .55};
    await cdp.send('Input.dispatchTouchEvent', {type:'touchStart', touchPoints:[start]});
    await cdp.send('Input.dispatchTouchEvent', {type:'touchMove', touchPoints:[{x:start.x + 65,y:start.y - 12}]});
    await cdp.send('Input.dispatchTouchEvent', {type:'touchEnd', touchPoints:[]});
    assert.notEqual(await mobileSolid.getAttribute('data-yaw'), mobileBefore, 'Solid responds to a mobile drag');
    await cdp.detach();

    // Responsive pages, including an active long prompt and the model controls.
    const views = ['#first-three', '#exam/1', '#exam/2', '#exam/3',
      '#practice/geo-right/guided', '#practice/vec-coordinates/guided',
      '#practice/' + solidLesson.id + '/guided'];
    for (const width of [360, 390, 1280]) {
      await fixture.setViewportSize({width,height:900});
      for (const hash of views) {
        await go(hash, fixture);
        await noOverflow(fixture, width + ' ' + hash);
      }
      await fixture.screenshot({path:path.join(SHOTS, 'solid-' + width + '.png'),fullPage:true});
    }
    await fixture.emulateMedia({reducedMotion:'reduce'});
    await fixture.setViewportSize({width:360,height:900});
    await go('#first-three', fixture);
    await fixture.evaluate(() => { document.body.style.zoom = '2'; });
    await noOverflow(fixture, '200% text/page zoom');
    await fixture.evaluate(() => { document.body.style.zoom = '1'; });
    await fixture.screenshot({path:path.join(SHOTS, 'route-360.png'),fullPage:true});

    // The existing algebra and trig routes remain available; their own lab
    // controls still work after mounting and leaving the new task models.
    for (const id of ['trig-angle', 'algebra-logarithmic']) {
      const lesson = algebra.find(l => l.id === id);
      assert(lesson, 'Existing neighbouring lesson');
      await go('#lesson/' + lesson.id);
      const details = page.locator('#explore-lab');
      if (await details.count()) await details.locator('summary').click();
      await page.locator('#lab svg').first().waitFor();
      const range = page.locator('#lab input[type="range"]').first();
      if (await range.count()) {
        const before = await range.inputValue();
        await range.focus();
        await page.keyboard.press('ArrowRight');
        assert.notEqual(await range.inputValue(), before, 'Old lab keyboard control: ' + lesson.id);
      }
      await page.locator('#guided').click();
      await page.locator('#answer-form').waitFor();
      await finish(lesson.id);
    }

    await go('#progress');
    const downloading = page.waitForEvent('download');
    await page.locator('#export').click();
    const downloaded = await downloading;
    const report = JSON.parse(fs.readFileSync(await downloaded.path(), 'utf8'));
    assert.equal(report.storage, 'local-browser');
    assert(report.records['geo-right'].guided.includes('geo-right-hypotenuse'));
    assert(report.records[solidLesson.id].guided.length > 0);
    assert.equal(await page.evaluate(() => localStorage.getItem('mathExamCourseProgress.v1')), 'legacy-preserved');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({gate:'PROFILE_FIRST_THREE_BROWSER_OK', mountedModels:mounted,
      completedJourneys:completed, firstThreeNavigation:true, earnedHistory:true,
      draftRestore:true, independentResume:true, noAnswerLeaks:true,
      helpCredit:true, decimalComma:true, fractions:true,
      keyboardRotation:true, mobileDrag:true, responsive:[360,390,1280],
      reducedMotion:true, zoom:true, report:true, oldAlgebraAndTrig:true, errors}));
  } finally {
    for (const context of contexts) await context.close();
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
