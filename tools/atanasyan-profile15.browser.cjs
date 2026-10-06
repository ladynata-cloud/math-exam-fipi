'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const lessons = [...require('../ege-profil/atanasyan-10-11/lessons-a.js'), ...require('../ege-profil/atanasyan-10-11/lessons-b.js')];
const root = path.resolve(__dirname, '..');
const prefix = '/ege-profil/atanasyan-10-11/';
const server = http.createServer((request, response) => {
  try {
    let file = path.resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://local').pathname));
    if (!file.startsWith(root + path.sep)) return response.writeHead(403).end();
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    response.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json' })[path.extname(file)] || 'application/octet-stream');
    response.end(fs.readFileSync(file));
  } catch (_) { response.writeHead(404).end(); }
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage(), errors = [], failures = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(origin)) failures.push(response.status() + ' ' + response.url()); });
  const state = () => page.evaluate(() => window.__atanasyanLesson.getState());
  const ready = () => page.waitForFunction(() => window.__atanasyanLesson && document.querySelector('#model svg'));
  let journeys = 0, steps = 0, layouts = 0, rotations = 0, drafts = 0;

  async function layout(label) {
    for (const width of [360, 1280]) {
      await page.setViewportSize({ width, height: width === 360 ? 800 : 900 });
      const problems = await page.evaluate(() => {
        const issues = [];
        if (document.documentElement.scrollWidth > innerWidth + 1) issues.push('document overflow ' + document.documentElement.scrollWidth);
        for (const node of document.querySelectorAll('#problem,#model,.am-button,#fields,#check,#next,#previous,#restart,#notebook>li,.module,.example')) {
          const box = node.getBoundingClientRect();
          if (box.width && box.height && (box.left < -1 || box.right > innerWidth + 1)) issues.push(node.id || node.className || node.tagName);
        }
        const svg = document.querySelector('#model svg');
        if (svg) {
          const box = svg.querySelector('g').getBBox(), view = svg.viewBox.baseVal;
          if (box.x < 0 || box.y < 0 || box.x + box.width > view.width || box.y + box.height > view.height) issues.push('clipped SVG drawing');
          if (/NaN|Infinity|undefined/.test(svg.innerHTML)) issues.push('invalid projected coordinate');
        }
        return issues;
      });
      assert.deepEqual(problems, [], label + ' at ' + width);
      layouts++;
    }
  }

  async function highlighted(lesson, step) {
    const view = lesson.model.views[step.modelView];
    await page.waitForFunction(key => document.querySelector('#model svg').dataset.view === key, step.modelView);
    assert.equal(await page.locator('.am-focus').textContent(), view.label);
    assert.equal(await page.locator('[data-highlight="plane"]').count(), view.polygon.length ? 1 : 0);
    assert.deepEqual(await page.locator('[data-highlight="segment"]').evaluateAll(nodes => nodes.map(node => node.dataset.segment)), view.segments.map(segment => segment.join('-')));
    const visible = await page.locator('[data-point]').evaluateAll(nodes => nodes.map(node => node.dataset.point));
    for (const name of [...view.segments.flat(), ...view.polygon, ...(view.points || [])]) assert.ok(visible.includes(name), lesson.id + ': highlighted point ' + name);
  }

  async function fill(step) {
    for (const field of step.fields) {
      if (field.kind === 'number') await page.locator('[data-field="' + field.id + '"]').fill(field.correct.replace('.', ','));
      else if (field.kind === 'choice') await page.locator('[data-field="' + field.id + '"][value="' + field.correct + '"]').check();
      else assert.fail('Unsupported field ' + field.kind);
    }
  }

  try {
    await page.goto(origin + prefix + 'index.html');
    await page.waitForSelector('#modules .module');
    assert.equal(await page.locator('#modules .module').count(), 8);
    assert.equal(await page.locator('#examples a').count(), 12);
    assert.deepEqual(await page.locator('#examples a').evaluateAll(nodes => nodes.map(node => new URL(node.href).searchParams.get('lesson'))), lessons.map(lesson => lesson.id));
    await layout('catalog');
    if (process.env.ATANASYAN_PREVIEW_DIR) await page.screenshot({ path: path.join(process.env.ATANASYAN_PREVIEW_DIR, 'atanasyan-course-preview-catalog.png'), fullPage: true });

    for (const lesson of lessons) {
      await page.goto(origin + prefix + 'lesson.html?lesson=' + lesson.id + '&invite=private-query&token=private-token#private-fragment');
      await ready();
      assert.equal(await page.title(), lesson.title + ' · Атанасян 10–11 · MathExam');
      assert.equal((await state()).step, 0, lesson.id + ': isolated initial state');
      const originalModel = await page.evaluate(() => JSON.stringify(MathExamGuidedLesson.model));
      const svg = page.locator('#model svg');
      const initialCamera = await svg.getAttribute('data-yaw');
      const initialProjection = await svg.locator('[data-edge]').first().getAttribute('d');
      await svg.focus();
      await svg.press('ArrowRight');
      assert.notEqual(await svg.getAttribute('data-yaw'), initialCamera);
      assert.notEqual(await svg.locator('[data-edge]').first().getAttribute('d'), initialProjection);
      const pitch = await svg.getAttribute('data-pitch');
      await page.getByRole('button', { name: 'Наклонить вверх', exact: true }).click();
      assert.notEqual(await svg.getAttribute('data-pitch'), pitch);
      assert.equal(await page.evaluate(() => JSON.stringify(MathExamGuidedLesson.model)), originalModel, lesson.id + ': geometry survives rotation');
      rotations++;
      let camera = await svg.getAttribute('data-yaw');
      const draftStep = lesson.steps.findIndex(step => step.fields.some(field => field.kind === 'number'));

      for (let i = 0; i < lesson.steps.length; i++) {
        const step = lesson.steps[i];
        assert.equal(await page.locator('#step-title').textContent(), step.title);
        assert.equal(await page.locator('#phase').textContent(), step.phase);
        await highlighted(lesson, step);
        assert.equal(await svg.getAttribute('data-yaw'), camera, lesson.id + ': step highlighting preserves camera');
        if (i === 0) {
          await page.locator('#check').click();
          assert.equal((await state()).errors, 1, 'an empty answer cannot pass');
          assert.equal((await state()).solved.length, 0);
          await page.locator('#hint').click();
          assert.equal(await page.locator('#hint-text').textContent(), step.hint);
          assert.equal(await page.locator('#notebook>li').count(), 0, 'a hint does not solve the step');
        }
        await fill(step);
        if (i === draftStep) {
          const draft = await state();
          assert.ok(!draft.solved.includes(i));
          await page.reload();
          await ready();
          assert.deepEqual(await state(), draft, lesson.id + ': unsolved numeric draft survives reload');
          for (const field of step.fields) assert.equal(await page.locator('[data-field="' + field.id + '"]').inputValue(), field.correct.replace('.', ','));
          camera = await svg.getAttribute('data-yaw');
          drafts++;
          await highlighted(lesson, step);
        }
        await layout(lesson.id + '/' + i);
        if (process.env.ATANASYAN_PREVIEW_DIR && lesson.id === 'volume-1' && i === 6) {
          await page.locator('#model-panel').scrollIntoViewIfNeeded();
          await page.screenshot({ path: path.join(process.env.ATANASYAN_PREVIEW_DIR, 'atanasyan-course-preview-lesson.png'), fullPage: true });
          await page.setViewportSize({ width: 360, height: 800 });
          await page.screenshot({ path: path.join(process.env.ATANASYAN_PREVIEW_DIR, 'atanasyan-course-preview-mobile.png'), fullPage: true });
        }
        // Alternate the actual submissions between narrow and desktop layouts.
        await page.setViewportSize({ width: i % 2 ? 360 : 1280, height: 900 });
        await page.locator('#check').click();
        assert.equal((await state()).solved.length, i + 1, lesson.id + '/' + i + ': ' + await page.locator('#feedback').innerText());
        assert.equal(await page.locator('#notebook>li').count(), i + 1);
        assert.equal(await page.locator('[data-notebook-step="' + i + '"]>div').innerHTML(), step.record);
        assert.ok(await page.locator('#check').isHidden());
        assert.ok(await page.locator('#next').isVisible());
        if (i === 1) {
          const notebook = await page.locator('#notebook').innerHTML();
          await page.locator('#previous').click();
          assert.equal((await state()).step, 0);
          assert.equal(await page.locator('#notebook').innerHTML(), notebook, 'previous step retains the proof');
          assert.ok(await page.locator('#next').isVisible());
          assert.ok(await page.locator('#check').isHidden());
          await page.locator('#next').click();
          assert.equal((await state()).step, i);
        }
        await page.locator('#next').click();
        steps++;
      }
      assert.ok(await page.locator('#completion').isVisible());
      assert.equal((await state()).step, lesson.steps.length);
      assert.equal(await page.locator('#notebook>li').count(), lesson.steps.length);
      const report = await page.locator('#report').inputValue();
      assert.ok(report.includes(lesson.reportAnswer));
      assert.ok(report.includes('Подсказки на шагах: 1'));
      assert.ok(report.includes('Проверок с ошибкой: 1'));
      assert.equal(report.split('\n').at(-1), 'Страница: ' + origin + prefix + 'lesson.html?lesson=' + lesson.id);
      assert.doesNotMatch(report, /private-query|private-token|private-fragment/);
      await layout(lesson.id + ' completion');
      assert.equal(await page.evaluate(() => JSON.stringify(MathExamGuidedLesson.model)), originalModel);
      await page.reload();
      await ready();
      assert.ok(await page.locator('#completion').isVisible(), lesson.id + ': completion resumes');
      assert.equal(await page.locator('#report').inputValue(), report);
      journeys++;
    }

    await page.goto(origin + prefix + 'index.html');
    await page.waitForSelector('#modules .module');
    assert.equal(await page.locator('#examples a').filter({ hasText: 'разобран' }).count(), 12, 'catalog reflects real lesson completions');
    const summary = await page.locator('#summary').inputValue();
    for (const lesson of lessons) assert.ok(summary.includes(lesson.title + ': ' + lesson.steps.length + '/' + lesson.steps.length + ' шагов'));
    const completedStorage = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([key]) => key.startsWith('mathexam.atanasyan15.'))));

    // Workshop records are created by its own UI and must survive both old and new deep links.
    await page.goto(origin + '/stereo-course/index.html#sections');
    await page.waitForSelector('.lesson-flow');
    assert.match(await page.locator('#app h1').textContent(), /сечен/i);
    assert.equal(await page.getByRole('link', { name: '← Маршрут к №15', exact: true }).count(), 0, 'legacy entry preserves its navigation');
    await page.locator('.lesson-flow [data-stage="5"]').click();
    await page.locator('#written').fill('Сохранённое доказательство: точки лежат в одной плоскости.');
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('mathExamStereo.v1')).units.sections.written.includes('Сохранённое доказательство'));
    const workshopBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('mathExamStereo.v1')).units.sections);
    await page.goto(origin + '/stereo-course/index.html?route=ege15#sections');
    await page.waitForSelector('#written');
    assert.equal(await page.locator('#written').inputValue(), workshopBefore.written);
    const back = page.getByRole('link', { name: '← Маршрут к №15', exact: true });
    assert.equal(await back.getAttribute('href'), '../ege-profil/atanasyan-10-11/index.html#route');
    await back.click();
    await page.waitForSelector('#modules .module');
    assert.equal(page.url(), origin + prefix + 'index.html#route');
    const workshopAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('mathExamStereo.v1')).units.sections);
    for (const key of Object.keys(workshopBefore).filter(key => !['updated', 'events'].includes(key))) assert.deepEqual(workshopAfter[key], workshopBefore[key], 'workshop preserves ' + key);
    assert.deepEqual(await page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([key]) => key.startsWith('mathexam.atanasyan15.')))), completedStorage, 'workshop leaves detailed lessons intact');
    await page.locator('#modules .module').filter({ hasText: 'Строим сечение' }).locator('summary').click();
    const sectionLink = page.locator('#modules a[href$="#sections"]');
    assert.equal(await sectionLink.count(), 1);
    await sectionLink.click();
    await page.waitForSelector('#written');
    assert.equal(await page.locator('#written').inputValue(), workshopBefore.written, 'catalog reuses workshop progress');

    for (const route of ['/ege-profil/index.html', '/ege-profil/start/index.html#part-one', '/ege-profil/start/index.html#exam/15']) {
      await page.goto(origin + route);
      const entry = page.locator('a[href$="atanasyan-10-11/index.html"]');
      await entry.first().waitFor();
      assert.ok(await entry.count() >= 1, route + ': course entry');
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(failures, []);
    console.log('ATANASYAN_PROFILE15_BROWSER_OK', JSON.stringify({ journeys, steps, layouts, widths: [360, 1280], rotations, drafts, hints: true, previous: true, retainedNotebook: true, reports: true, catalog: true, workshopRegression: true, errors }));
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
