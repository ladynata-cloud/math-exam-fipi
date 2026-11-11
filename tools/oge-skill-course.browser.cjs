'use strict';

// Real Chromium integration gate for CI. Only disposable synthetic browser data
// is used. Screenshots support layout review; they are not a learner pilot.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'artifacts/oge-skill-course');
const lesson = '/oge/skills/';
const course = '/trainers/oge-course/';
const cabinet = 'https://mathexam-board-ladynata.msk1.amvera.tech/learning/#route';
const oldKeys = ['mathExamCourseProgress.v1', 'mathExam.oge6.practice.v1', 'mathExam.oge20.practice.v1', 'mathExam.oge22.practice.v1', 'mathExam.task19.visualHints.v1', 'oge21_prog', 'mathexam.oge.course-navigation.v1', 'mathExamFoundations.visits.v1'];
const seeded = Object.fromEntries(oldKeys.map((key, i) => [key, JSON.stringify({synthetic: true, value: i + 1})]));
const report = {status: 'RUNNING', layouts: [], scenarios: []};
let server, browser, base = process.env.OGE_SKILL_BASE_URL;

fs.mkdirSync(out, {recursive: true});
function writeReport() {
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
}
function safeError(error) {
  return String(error.stack || error).replaceAll(root, '<repository>');
}

(async () => {
  try {
    if (!base) {
      const types = {'.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json'};
      server = http.createServer((req, res) => {
        try {
          const url = new URL(req.url, 'http://test.invalid');
          let file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
          assert(file.startsWith(root + path.sep));
          if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
          res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
          fs.createReadStream(file).pipe(res);
        } catch { res.writeHead(404).end(); }
      });
      await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
      base = 'http://127.0.0.1:' + server.address().port;
    }
    browser = await chromium.launch({headless: true});
    const origin = new URL(base).origin;

    async function context(options = {}) {
      const c = await browser.newContext({reducedMotion: 'reduce', ...options});
      await c.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      return c;
    }
    async function ready(page, query = '') {
      const response = await page.goto(base + lesson + query, {waitUntil: 'load'});
      assert(response.ok(), 'Skill section serves successfully');
      await page.locator('#mathexam-skill-lab .task').waitFor();
    }
    async function noOverflow(page, label) {
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No horizontal overflow: ' + label);
    }
    async function unchanged(page) {
      const values = await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), oldKeys);
      assert.deepEqual(values, seeded, 'New lessons preserve all old progress bytes');
    }
    async function navigation(page, expectedTrainer) {
      const nav = page.locator('nav[data-skill-navigation]');
      assert.equal(await nav.locator('[data-skill-link="course"]').getAttribute('href'), course);
      assert.equal(await nav.locator('[data-skill-link="trainer"]').getAttribute('href'), expectedTrainer);
      assert.equal(await nav.locator('[data-skill-link="cabinet"]').getAttribute('href'), cabinet);
      for (const key of ['course', 'trainer']) {
        assert(['', null, '_self'].includes(await nav.locator('[data-skill-link="' + key + '"]').getAttribute('target')));
      }
    }

    for (const width of [320, 390, 1280]) {
      const c = await context({viewport: {width, height: 900}});
      const page = await c.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      try {
        await page.goto(base + course, {waitUntil: 'load'});
        const entry = page.locator('#skill-course.oge-skill-course-entry');
        await entry.scrollIntoViewIfNeeded();
        assert.equal(await page.locator('[data-oge-topic]').count(), 25);
        assert.equal(await page.locator('[data-oge-practical]').count(), 8);
        assert.equal(await page.locator('#skill-course-topics').getAttribute('open'), null);
        await noOverflow(page, 'closed course entry at ' + width);
        await page.screenshot({path: path.join(out, 'course-entry-' + width + '.png')});
        await page.locator('#skill-course-topics > summary').focus();
        await page.keyboard.press('Enter');
        assert.notEqual(await page.locator('#skill-course-topics').getAttribute('open'), null);
        assert.equal(await page.locator('[data-oge-skill-topic]').count(), 26);
        for (const anchor of await page.locator('[data-oge-skill-topic]').all()) {
          const box = await anchor.boundingBox();
          assert(box && box.height >= 44, 'Topic link has a touch target at least 44px');
        }
        await noOverflow(page, 'expanded course entry at ' + width);
        await page.locator('[data-oge-skill-topic="n9"]').click();
        await page.locator('#mathexam-skill-lab .task').waitFor();
        assert.equal(await page.locator('#skill-topic').inputValue(), 'n9');
        assert.match(await page.locator('.stage-count').first().innerText(), /Задание 1 из 4/);
        assert.equal(await page.locator('[data-action="map"]').getAttribute('aria-expanded'), 'false');
        assert.equal(await page.locator('details.series-picker').getAttribute('open'), null);
        assert.equal(await page.locator('details.topic-about').getAttribute('open'), null);
        const taskBox = await page.locator('.task').boundingBox();
        assert(taskBox && taskBox.y >= 0 && taskBox.y < 900, 'A concrete task appears in the first viewport at ' + width);
        assert.equal(await page.evaluate(() => window.scrollY), 0, 'The initial lesson is checked before any scrolling');
        await page.screenshot({path: path.join(out, 'ordinary-task-' + width + '.png')});
        const firstScreen = {};
        for (const [name, selector] of [
          ['prompt', '.task-prompt'],
          ['answer', '#skill-answer'],
          ['check', '.task-actions [data-action="check"]']
        ]) {
          const control = page.locator(selector);
          assert(await control.isVisible(), name + ' is visible on the initial lesson');
          const box = await control.boundingBox();
          assert(box && box.width > 0 && box.height > 0, name + ' has a rendered area');
          assert(box.x >= 0 && box.x + box.width <= width, name + ' fits the viewport width ' + width);
          assert(box.y >= 0 && box.y + box.height <= 900, name + ' must fit the initial 900px viewport at width ' + width + '; actual top=' + box.y + ', bottom=' + (box.y + box.height));
          firstScreen[name] = {top: Math.round(box.y), bottom: Math.round(box.y + box.height)};
        }
        await navigation(page, '/trainers/oge-task9-equations.html');
        await noOverflow(page, 'ordinary task at ' + width);

        await page.locator('[data-action="map"]').focus();
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('[data-action="map"]').getAttribute('aria-expanded'), 'true');
        assert(await page.locator('.map').isVisible());
        await noOverflow(page, 'optional map at ' + width);
        await page.screenshot({path: path.join(out, 'optional-map-' + width + '.png'), fullPage: true});
        await page.locator('[data-action="map"]').click();
        await page.locator('[data-action="mode"][data-mode="creative"]').click();
        assert.equal(await page.locator('details.creative-picker').getAttribute('open'), null);
        await noOverflow(page, 'optional workshop at ' + width);
        await page.screenshot({path: path.join(out, 'workshop-' + width + '.png')});
        assert.deepEqual(errors, []);
        report.layouts.push({width, status: 'PASS', firstTaskTop: Math.round(taskBox.y), initialScrollY: 0, firstScreen});
      } finally { await c.close(); }
    }

    {
      const c = await context({viewport: {width: 320, height: 900}}), page = await c.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      try {
        await ready(page, '?topic=base&mode=creative');
        assert.match(await page.locator('.task-title').innerText(), /Битва модулей/);
        const cancelled = await page.locator('.token.cancelled').count();
        await page.locator('[data-action="cancel"]').click();
        assert((await page.locator('.token.cancelled').count()) > cancelled);
        await noOverflow(page, 'module battle on narrow screen');
        await page.screenshot({path: path.join(out, 'module-battle-320.png'), fullPage: true});

        await ready(page, '?topic=n11&mode=creative');
        await page.locator('.figure svg').waitFor();
        const slope = page.locator('[data-field="k"]');
        await slope.focus();
        const previousSlope = await slope.inputValue();
        await page.keyboard.press('ArrowRight');
        assert.notEqual(await slope.inputValue(), previousSlope, 'Graph parameter responds to the keyboard');
        await noOverflow(page, 'graph workshop on narrow screen');
        await page.screenshot({path: path.join(out, 'graph-workshop-320.png'), fullPage: true});

        await ready(page, '?topic=n17&mode=creative');
        const skew = page.locator('[data-field="skew"]');
        await skew.focus();
        const previousSkew = await skew.inputValue();
        await page.keyboard.press('ArrowRight');
        assert.notEqual(await skew.inputValue(), previousSkew, 'Geometry parameter responds to the keyboard');
        await page.locator('.figure svg').waitFor();
        await noOverflow(page, 'geometry workshop on narrow screen');
        await page.screenshot({path: path.join(out, 'geometry-workshop-320.png'), fullPage: true});
        assert.deepEqual(errors, []);
        report.scenarios.push('Module battle, graph and geometry workshops draw and respond on a 320px screen');
      } finally { await c.close(); }
    }

    {
      const c = await context({viewport: {width: 390, height: 900}}), page = await c.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await c.addInitScript(values => {
        for (const [key, value] of Object.entries(values)) if (localStorage.getItem(key) === null) localStorage.setItem(key, value);
      }, seeded);
      try {
        await ready(page, '?topic=n9');
        await page.locator('#skill-answer').fill('5');
        await page.locator('[data-action="hint"]').click();
        await page.locator('#skill-topic').selectOption('n11');
        await ready(page, '?topic=n9');
        assert.equal(await page.locator('#skill-answer').inputValue(), '5');
        assert(await page.evaluate(() => OGESkillLab.taskState(OGESkillLab.task()).helpUsed));
        await page.locator('#skill-answer').press('Enter');
        assert(await page.locator('.feedback.good').isVisible());
        assert.equal(await page.evaluate(() => OGESkillLab.progress['n9-q-linear'].independent || 0), 0);
        await page.reload({waitUntil: 'load'});
        assert.equal(await page.locator('#skill-answer').inputValue(), '5');
        assert(await page.evaluate(() => OGESkillLab.taskState(OGESkillLab.task()).helpUsed));
        await unchanged(page);

        await ready(page, '?topic=n9&route=route-arith-fractions');
        assert.equal(await page.locator('#skill-topic').inputValue(), 'n6');
        await page.locator('#skill-answer').fill('123/7');
        await page.locator('[data-action="hint"]').click();
        const before = await page.evaluate(() => ({id: OGESkillLab.task().id, refs: OGESkillLab.state.runs[OGESkillLab.state.activeRun].refs, seed: OGESkillLab.state.seedCounter}));
        await page.reload({waitUntil: 'load'});
        const after = await page.evaluate(() => ({id: OGESkillLab.task().id, refs: OGESkillLab.state.runs[OGESkillLab.state.activeRun].refs, seed: OGESkillLab.state.seedCounter}));
        assert.deepEqual(after, before);
        assert.equal(await page.locator('#skill-answer').inputValue(), '123/7');
        assert(await page.evaluate(() => OGESkillLab.taskState(OGESkillLab.task()).helpUsed));
        await unchanged(page);
        assert.deepEqual(errors, []);
        report.scenarios.push('Answers, help and generated route identity survive topic changes and reload; legacy progress remains unchanged');
      } finally { await c.close(); }
    }

    {
      const c = await context({viewport: {width: 390, height: 900}}), page = await c.newPage();
      try {
        await ready(page, '?route=route-exp-n6-errors');
        await page.locator('#skill-answer').fill('13/6');
        await page.locator('#skill-answer').press('Enter');
        assert(await page.locator('.feedback.good').isVisible());
        await page.locator('[data-action="next"]').click();
        await page.locator('[data-action="skip-workshop"]').click();
        await page.locator('#skill-answer').fill('2,9');
        await page.locator('[data-action="check"]').click();
        assert(await page.locator('.feedback.good').isVisible());
        await page.locator('[data-action="next"]').click();
        assert.match(await page.locator('.ordinary-result').innerText(), /решено 2 из 2/);
        assert.match(await page.locator('.ordinary-result').innerText(), /Без подсказки приложения — 2/);
        assert.match(await page.locator('.workshop-result').innerText(), /мастерских: 0/);
        await noOverflow(page, 'completed short route');
        await page.screenshot({path: path.join(out, 'completed-with-workshop-skipped-390.png')});
        await page.reload({waitUntil: 'load'});
        assert.match(await page.locator('.ordinary-result').innerText(), /решено 2 из 2/);
        report.scenarios.push('Optional workshop can be skipped; two ordinary tasks still complete the chosen route after reload');
      } finally { await c.close(); }
    }

    {
      const c = await context({viewport: {width: 390, height: 900}}), page = await c.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      try {
        await ready(page, '?topic=__proto__&route=constructor&learning=1&channel=test&parentOrigin=https://example.invalid&returnTo=https://example.invalid');
        const url = new URL(page.url());
        for (const key of url.searchParams.keys()) assert(['topic', 'route', 'mode', 'map'].includes(key));
        assert(await page.locator('.task').isVisible());
        await ready(page, '?topic=n6');
        await navigation(page, '/trainers/oge-task6-fractions.html');
        await page.locator('[data-skill-link="trainer"]').click();
        await page.waitForURL(url => url.pathname === '/trainers/oge-task6-fractions.html');
        await page.goBack({waitUntil: 'load'});
        await page.locator('#skill-topic').waitFor();
        assert.equal(await page.locator('#skill-topic').inputValue(), 'n6');
        await page.locator('[data-skill-link="course"]').click();
        await page.waitForURL(url => url.pathname === course);
        assert(await page.locator('#all-topics').isVisible());
        assert.deepEqual(errors, []);
        report.scenarios.push('Invalid query is safe; source-trainer and course returns work in the same tab');
      } finally { await c.close(); }
    }

    {
      const c = await context({javaScriptEnabled: false, viewport: {width: 390, height: 900}}), page = await c.newPage();
      try {
        await page.goto(base + course, {waitUntil: 'load'});
        await page.locator('#skill-course-topics > summary').click();
        await page.locator('[data-oge-skill-topic="n9"]').click();
        await page.waitForURL(url => url.pathname === lesson);
        assert(await page.locator('nav[data-skill-navigation]').isVisible());
        assert.match(await page.locator('noscript').innerText(), /JavaScript/);
        await noOverflow(page, 'no JavaScript fallback');
        await page.screenshot({path: path.join(out, 'no-javascript-390.png')});
        await page.locator('[data-skill-link="course"]').click();
        await page.waitForURL(url => url.pathname === course);
        assert.equal(await page.locator('[data-oge-topic]').count(), 25);
        report.scenarios.push('Course entry and return remain usable with JavaScript disabled');
      } finally { await c.close(); }
    }

    {
      const c = await context({viewport: {width: 390, height: 900}}), page = await c.newPage();
      async function focusOn(selector, label) {
        assert(await page.locator(selector).evaluate(element => document.activeElement === element), label + ': keyboard focus remains on the relevant control or task');
      }
      async function promptWithinViewport(label) {
        const prompt = page.locator('.task-prompt');
        assert(await prompt.isVisible(), label + ': the new task prompt is visible');
        const box = await prompt.boundingBox(), viewport = page.viewportSize();
        assert(box && box.width > 0 && box.height > 0, label + ': the prompt has a rendered area');
        assert(box.x >= 0 && box.x + box.width <= viewport.width, label + ': the prompt fits horizontally');
        assert(box.y >= 0 && box.y + box.height <= viewport.height, label + ': native focus brings the whole prompt into view; actual top=' + box.y + ', bottom=' + (box.y + box.height));
      }
      try {
        await ready(page, '?topic=n9');
        await page.locator('[data-action="hint"]').press('Enter');
        await focusOn('[data-action="hint"]', 'Open help');
        await page.locator('[data-action="map"]').press('Enter');
        await focusOn('[data-action="map"]', 'Open map');
        await page.locator('[data-action="map"]').press('Enter');
        await focusOn('[data-action="map"]', 'Close map');
        await page.locator('#skill-answer').fill('5');
        await page.locator('#skill-answer').press('Enter');
        assert(await page.locator('.feedback.good').isVisible());
        await focusOn('#skill-answer', 'Check from the answer field');
        const ordinaryRecord = await page.evaluate(() => OGESkillLab.progress['n9-q-linear']);
        assert.equal(ordinaryRecord.successful, 1);
        assert.equal(ordinaryRecord.independent, 0);
        await page.screenshot({path: path.join(out, 'keyboard-feedback-390.png')});
        await page.locator('details.teacher > summary').press('Enter');
        await page.locator('details.teacher[open]').waitFor();
        const sameTopic = '.teacher [data-action="topic"][data-topic="n9"]';
        await page.locator(sameTopic).press('Enter');
        assert.notEqual(await page.locator('details.teacher').getAttribute('open'), null);
        await focusOn(sameTopic, 'Reopen the same topic from the teacher overview');
        assert.deepEqual(await page.evaluate(() => OGESkillLab.progress['n9-q-linear']), ordinaryRecord);
        await page.reload({waitUntil: 'load'});
        assert(await page.locator('.task [data-action="next"]').isVisible(), 'The checked answer can continue after reload');
        assert(await page.evaluate(() => OGESkillLab.taskState(OGESkillLab.task()).helpUsed));
        assert.deepEqual(await page.evaluate(() => OGESkillLab.progress['n9-q-linear']), ordinaryRecord);
        await page.locator('#skill-answer').fill('6');
        assert.equal(await page.locator('.task [data-action="next"]').count(), 0, 'An edited answer needs a new check');
        await page.reload({waitUntil: 'load'});
        assert.equal(await page.locator('.task [data-action="next"]').count(), 0, 'Reload cannot revive the result of a different answer');
        assert.deepEqual(await page.evaluate(() => OGESkillLab.progress['n9-q-linear']), ordinaryRecord);

        await ready(page, '?route=route-exp-n6-errors');
        await page.locator('[data-action="hint"]').press('Enter');
        await page.locator('#skill-answer').fill('13/6');
        await page.locator('#skill-answer').press('Enter');
        const routeRecord = await page.evaluate(() => OGESkillLab.progress['exp-n6-errors-entry']);
        assert.equal(routeRecord.successful, 1);
        assert.equal(routeRecord.independent, 0);
        await page.reload({waitUntil: 'load'});
        assert(await page.locator('.task [data-action="next"]').isVisible());
        assert(await page.evaluate(() => OGESkillLab.taskState(OGESkillLab.task()).helpUsed));
        assert.deepEqual(await page.evaluate(() => OGESkillLab.progress['exp-n6-errors-entry']), routeRecord);
        await page.locator('[data-action="next"]').press('Enter');
        assert.equal(await page.evaluate(() => OGESkillLab.state.runs['route-exp-n6-errors'].cursor), 1);
        await focusOn('.task-prompt', 'Continue to the next route task');
        await promptWithinViewport('Continue to the next route task');
        assert.deepEqual(await page.evaluate(() => OGESkillLab.progress['exp-n6-errors-entry']), routeRecord);

        await ready(page, '?topic=n9');
        await page.locator('details.teacher > summary').press('Enter');
        await page.locator('details.teacher[open]').waitFor();
        const differentTopic = '.teacher [data-action="topic"][data-topic="n19"]';
        await page.locator(differentTopic).focus();
        await focusOn(differentTopic, 'Reach another topic in the long teacher overview');
        assert((await page.evaluate(() => window.scrollY)) > 900, 'The topic transition starts below the first viewport');
        await page.locator(differentTopic).press('Enter');
        assert.equal(await page.locator('#skill-topic').inputValue(), 'n19');
        await focusOn('.task-prompt', 'Open another topic from the teacher overview');
        await promptWithinViewport('Open another topic from the teacher overview');
        await page.screenshot({path: path.join(out, 'teacher-topic-transition-390.png')});
        report.scenarios.push('Keyboard focus survives rendering; checked ordinary and route answers resume with Next without duplicate results');
      } finally { await c.close(); }
    }

    for (const width of [320, 1280]) {
      const c = await context({viewport: {width, height: 900}}), page = await c.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      try {
        await ready(page, '?topic=n1');
        assert.equal(await page.locator('#skill-topic option').count(), 26);
        assert.equal(await page.locator('details.topic-sources').getAttribute('open'), null);
        assert.equal(await page.locator('.map').count(), 0);
        await noOverflow(page, 'practical table at ' + width);
        await page.screenshot({path: path.join(out, 'practical-table-' + width + '.png'), fullPage: true});
        await page.locator('details.topic-sources > summary').press('Enter');
        assert.equal(await page.locator('.topic-sources a').count(), 8);
        for (const a of await page.locator('.topic-sources a').all()) {
          const box = await a.boundingBox();
          assert(box && box.height >= 44, 'Practical plot links retain accessible touch targets');
        }
        await noOverflow(page, 'eight optional plot links at ' + width);

        await ready(page, '?route=task:n1-q-apartment-plan');
        await page.locator('.figure svg').waitFor();
        await page.locator('#skill-answer').fill('2');
        await page.locator('[data-action="check"]').click();
        assert(await page.locator('.feedback.good').isVisible());
        await noOverflow(page, 'apartment plan at ' + width);
        await page.screenshot({path: path.join(out, 'apartment-plan-' + width + '.png'), fullPage: true});

        await ready(page, '?route=task:n22-q-hole');
        await page.locator('.figure svg').waitFor();
        assert.match(await page.locator('.written-step-label').innerText(), /Полное решение/);
        assert(await page.locator('.figure svg circle[data-endpoint="open"]').count() >= 1, 'The excluded point is visibly open');
        assert.equal(await page.locator('.figure svg circle[data-endpoint="closed"]').count(), 0, 'An excluded point must not be painted as included');
        await page.locator('#skill-answer').fill('0');
        await page.locator('[data-action="check"]').click();
        assert(await page.locator('.feedback.good').isVisible());
        assert.equal(await page.locator('.exam-format').count(), 0);
        await noOverflow(page, 'graph with excluded point at ' + width);
        await page.screenshot({path: path.join(out, 'excluded-point-' + width + '.png'), fullPage: true});

        await ready(page, '?route=task:n22-c-parameter');
        await page.locator('.figure svg').waitFor();
        const firstGraph = await page.locator('.figure svg').innerHTML();
        await page.locator('[data-field="build"][data-name="m"]').fill('3');
        assert.notEqual(await page.locator('.figure svg').innerHTML(), firstGraph, 'The parameter moves the horizontal line');
        await page.locator('[data-field="build"][data-name="a"]').fill('1');
        await page.locator('[data-field="build"][data-name="b"]').fill('sqrt(7)');
        await page.locator('[data-action="check"]').click();
        assert(await page.locator('.feedback.good').isVisible());
        await noOverflow(page, 'four-intersection workshop at ' + width);
        await page.screenshot({path: path.join(out, 'four-intersections-' + width + '.png'), fullPage: true});

        await ready(page, '?route=task:n24-c-proof-order');
        const proof = await page.evaluate(() => OGESkillLab.task().answer);
        for (let target = 0; target < proof.length; target++) {
          let current = (await page.locator('.order-row .step').allTextContents()).indexOf(proof[target]);
          assert(current >= target, 'Each proof dependency has a unique step');
          while (current > target) {
            await page.locator('[data-action="up"][data-index="' + current + '"]').press('Enter');
            current--;
          }
        }
        await page.locator('[data-action="hint"]').click();
        const proofId = await page.evaluate(() => OGESkillLab.task().id);
        await page.reload({waitUntil: 'load'});
        assert.deepEqual(await page.locator('.order-row .step').allTextContents(), proof);
        assert(await page.evaluate(() => OGESkillLab.taskState(OGESkillLab.task()).helpUsed));
        await page.locator('[data-action="check"]').click();
        assert(await page.locator('.feedback.good').isVisible());
        assert.equal(await page.evaluate(id => OGESkillLab.progress[id].independent || 0, proofId), 0);
        assert.equal(await page.locator('.exam-format').count(), 0);
        await noOverflow(page, 'dependent proof steps at ' + width);
        await page.screenshot({path: path.join(out, 'proof-workshop-' + width + '.png'), fullPage: true});
        await page.locator('[data-action="next"]').click();
        assert.match(await page.locator('.completed .written-work-note').innerText(), /Полное письменное решение/);

        await ready(page, '?route=task:n25-c-vertex');
        await page.locator('.figure svg').waitFor();
        const firstTriangle = await page.locator('.figure svg').innerHTML();
        await page.locator('[data-field="build"][data-name="x"]').fill('5');
        await page.locator('[data-field="build"][data-name="h"]').fill('12');
        assert.notEqual(await page.locator('.figure svg').innerHTML(), firstTriangle, 'The vertex moves with the coordinates');
        await page.locator('[data-field="build"][data-name="S"]').fill('84');
        await page.locator('[data-action="check"]').click();
        assert(await page.locator('.feedback.good').isVisible());
        await noOverflow(page, 'constructed triangle at ' + width);
        await page.screenshot({path: path.join(out, 'triangle-construction-' + width + '.png'), fullPage: true});
        assert.deepEqual(errors, []);
        report.scenarios.push('Practical plots, excluded points, four intersections, dependent proof and dynamic triangle at ' + width + 'px');
      } finally { await c.close(); }
    }

    for (const width of [320, 1280]) {
      const G = require('../trainers/oge-basics/multiplication-division/division-guided-core.js');
      const task = G.make('twoDigit', 0), plan = G.plan(task);
      const session = {id: 1, task: plan.task, step: 1, answers: [String(plan.actions[0].answer)], accepted: false, done: false, draft: '7', errors: 0, hints: 1, reveals: 0, repeated: false};
      const saved = JSON.stringify({version: 1, active: 'twoDigit', serial: 1, next: {twoDigit: 1}, sessions: {twoDigit: session}, records: []});
      const key = 'mathExamBasics.guidedDivision.v1';
      const c = await context({viewport: {width, height: 900}}), page = await c.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await c.addInitScript(({key, saved}) => { if (localStorage.getItem(key) === null) localStorage.setItem(key, saved); }, {key, saved});
      try {
        const response = await page.goto(base + '/trainers/oge-basics/multiplication-division/division-path.html', {waitUntil: 'load'});
        assert(response.ok());
        assert.equal(await page.locator('#division-skill-map').getAttribute('open'), null);
        assert.equal(await page.locator('.path-step').count(), 8);
        assert.match(await page.locator('#continue-division').innerText(), /Продолжить/);
        assert.equal(await page.evaluate(key => localStorage.getItem(key), key), saved);
        await noOverflow(page, 'closed division map at ' + width);
        await page.screenshot({path: path.join(out, 'division-map-closed-' + width + '.png')});
        await page.locator('#division-skill-map > summary').press('Enter');
        assert.equal(await page.locator('[data-division-skill]').count(), 6);
        await noOverflow(page, 'expanded division map at ' + width);
        await page.screenshot({path: path.join(out, 'division-map-open-' + width + '.png'), fullPage: true});
        for (const place of [1, 2, 3]) {
          const link = page.locator('#division-skill-map a[href*="place=' + place + '"]');
          assert.equal(await link.getAttribute('target'), '_blank');
          assert.equal(await link.getAttribute('rel'), 'noopener');
          const popupPromise = page.waitForEvent('popup');
          await link.click();
          const popup = await popupPromise;
          await popup.waitForLoadState('load');
          assert.equal(new URL(popup.url()).pathname, '/trainers/rounding-stepwise.html');
          assert.equal(await popup.locator('#place').inputValue(), String(place));
          await noOverflow(popup, 'rounding place ' + place + ' at ' + width);
          if (place === 2) await popup.screenshot({path: path.join(out, 'rounding-hundreds-' + width + '.png')});
          await popup.close();
          assert.equal(await page.evaluate(key => localStorage.getItem(key), key), saved, 'Rounding practice does not replace the unfinished division');
        }
        const popupPromise = page.waitForEvent('popup');
        await page.locator('#skill-quotient-estimate a').click();
        const popup = await popupPromise;
        await popup.waitForLoadState('load');
        assert.equal(new URL(popup.url()).pathname, '/trainers/oge-basics/multiplication-division/quotient-estimate.html');
        await noOverflow(popup, 'quotient estimate at ' + width);
        await popup.screenshot({path: path.join(out, 'quotient-estimate-' + width + '.png')});
        await popup.close();
        assert.equal(await page.evaluate(key => localStorage.getItem(key), key), saved);
        await page.locator('#division-skill-map > summary').press('Enter');
        await page.locator('#continue-division').click();
        await page.waitForURL(url => url.pathname === '/trainers/long-division-stepwise.html' && url.hash === '#twoDigit');
        await page.waitForFunction(() => window.__divisionGuidedDebug);
        const resumed = await page.evaluate(() => window.__divisionGuidedDebug.state());
        assert.equal(resumed.active, 'twoDigit');
        assert.deepEqual(resumed.sessions.twoDigit, session, 'Returning to the exact division preserves its step, answers, draft and help');
        assert.equal(await page.locator('#answer').inputValue(), '7');
        assert.deepEqual(errors, []);
        report.scenarios.push('Optional division map, three rounding places, quotient estimate and resumed division at ' + width + 'px');
      } finally { await c.close(); }
    }

    {
      const c = await context({viewport: {width: 390, height: 900}}), page = await c.newPage();
      await c.addInitScript(() => Object.defineProperty(window, 'localStorage', {get() { throw new DOMException('Synthetic blocked storage', 'SecurityError'); }}));
      try {
        await ready(page, '?topic=n9');
        await page.locator('#skill-answer').fill('5');
        await page.locator('[data-action="check"]').click();
        assert(await page.locator('.feedback.good').isVisible());
        assert.match(await page.locator('.footer').innerText(), /Ответы и подсказки доступны в этой открытой вкладке/);
        report.scenarios.push('Ordinary practice still works with storage blocked');
      } finally { await c.close(); }
    }

    report.status = 'PASS';
    console.log('OGE_SKILL_COURSE_BROWSER_OK', JSON.stringify({layouts: report.layouts.length, scenarios: report.scenarios.length}));
  } catch (error) {
    report.status = 'FAIL';
    report.error = safeError(error);
    console.error(report.error);
    process.exitCode = 1;
  } finally {
    writeReport();
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
  }
})();
