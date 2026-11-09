'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '../..');
const artifacts = path.join(root, 'artifacts/linear-pilot');
const pilot = '/equations/linear-pilot/';
const trainer = '/trainers/simple-equations-stepwise.html';
const action = (page, name) => page.locator(`[data-basics="${name}"]`);

async function serve() {
  const server = http.createServer(async (request, response) => {
    let file = path.resolve(root, `.${decodeURIComponent(new URL(request.url, 'http://localhost').pathname)}`);
    if (!file.startsWith(`${root}${path.sep}`)) {
      response.writeHead(403).end();
      return;
    }
    try {
      if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
      const body = await fs.readFile(file);
      const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' };
      response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return server;
}

async function assertFit(page, withinFirstScreen) {
  const viewport = await page.evaluate(() => ({ width: innerWidth, documentWidth: document.documentElement.scrollWidth, height: innerHeight }));
  assert.ok(viewport.documentWidth <= viewport.width, `horizontal overflow at ${viewport.width}px`);
  for (const selector of withinFirstScreen) {
    const box = await page.locator(selector).boundingBox();
    assert.ok(box && box.y >= 0 && box.y + box.height <= viewport.height, `${selector} is outside the first screen at ${viewport.width}px`);
  }
}

async function walkthrough(browser, base, width) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.setDefaultTimeout(8000);
  try {
    await page.goto(`${base}${pilot}`);
    const screen = page.locator('#basics-screen');
    const feedback = page.locator('#basics-feedback');
    const basicsRoute = page.locator('#basics-route');
    const advancedRoute = page.locator('#advanced-route');
    const advancedContent = page.locator('#advanced-content');
    const answer = page.locator('#basics-answer');
    const reviewForm = page.locator('[data-basics-review]');
    const submitReview = reviewForm.locator('button[type="submit"]');
    const { scenes, reviews } = await page.evaluate(() => window.LinearBasicsData);

    assert.equal(await basicsRoute.getAttribute('aria-pressed'), 'true');
    assert.equal(await advancedContent.isVisible(), false);
    assert.equal(await page.locator('#basics-count').innerText(), `0 из ${scenes.length} шагов`);
    assert.equal(await page.locator('#advanced-count').innerText(), '0 из 4 занятий');
    await assertFit(page, ['[data-basics="begin"]']);
    await page.screenshot({ path: path.join(artifacts, `basics-welcome-${width}.png`) });
    await action(page, 'begin').click();
    assert.equal(await screen.getAttribute('data-phase'), 'lesson');
    await page.evaluate(() => scrollTo(0, 0));
    await assertFit(page, ['[data-basics-balance]', '[data-basics-math]']);
    await page.screenshot({ path: path.join(artifacts, `basics-lesson-${width}.png`) });

    let errorAndHintChecked = false;
    let modelChecked = false;
    for (const [index, scene] of scenes.entries()) {
      assert.equal(await screen.getAttribute('data-scene'), String(index));
      await page.evaluate(() => scrollTo(0, 0));
      await assertFit(page, ['[data-basics-math]', '[data-basics-balance]']);
      if (scene.experiment) {
        const math = page.locator('[data-basics-math]');
        const original = await math.innerText();
        const balance = page.locator('[data-basics-balance]');
        const originalLoad = scene.balance ? await balance.getAttribute('aria-label') : null;
        await action(page, 'experiment').click();
        const changed = await math.innerText();
        assert.notEqual(changed, original);
        if (originalLoad && scene.experiment.balance) {
          assert.notEqual(await balance.getAttribute('aria-label'), originalLoad);
        }
        await assertFit(page, ['#basics-experiment']);
        await page.evaluate(() => scrollTo(0, 0));
        await assertFit(page, ['[data-basics-math]', '[data-basics-balance]']);
        if (!modelChecked) {
          await action(page, 'experiment').click();
          assert.equal(await math.innerText(), original);
          await action(page, 'experiment').click();
          modelChecked = true;
        }
      }
      if (scene.question) {
        const { correct, options, hint } = scene.question;
        const choice = index => page.locator(`[data-basics="choose"][data-option="${index}"]`);
        for (const [wrong, option] of options.entries()) {
          if (wrong === correct) continue;
          await choice(wrong).click();
          assert.ok((await feedback.innerText()).includes(option.feedback));
          assert.equal(await action(page, 'next').isEnabled(), false);
          await assertFit(page, ['#basics-feedback']);
        }
        await action(page, 'hint').click();
        assert.ok((await screen.innerText()).includes(hint));
        await assertFit(page, ['#basics-hint']);
        if (index === 2) {
          await page.screenshot({ path: path.join(artifacts, `basics-balance-hint-${width}.png`) });
          await action(page, 'experiment').click();
          assert.equal(await page.locator('[data-basics-balance]').getAttribute('data-tilt'), '0');
          assert.match(await screen.innerText(), /После того как слева сняли 2/);
          await action(page, 'experiment').click();
          assert.equal(await page.locator('[data-basics-balance]').getAttribute('data-tilt'), '1');
        }
        if (!errorAndHintChecked) {
          const wrong = options.findLastIndex((_, index) => index !== correct);
          assert.equal(await screen.getAttribute('data-scene'), String(index));
          assert.ok((await feedback.innerText()).includes(options[wrong].feedback));
          assert.equal(await action(page, 'next').isEnabled(), false);
          await page.reload();
          assert.equal(await screen.getAttribute('data-scene'), String(index));
          assert.ok((await screen.innerText()).includes(hint));
          assert.ok((await feedback.innerText()).includes(options[wrong].feedback));
          await advancedRoute.click();
          assert.equal(await advancedContent.isVisible(), true);
          await page.locator('#c0w0').fill('Черновик другого маршрута');
          await page.evaluate(() => localStorage.removeItem('mathexam.linearPilot.basics.v1.route'));
          await page.reload();
          assert.equal(await advancedContent.isVisible(), true);
          assert.equal(await page.locator('#c0w0').inputValue(), 'Черновик другого маршрута');
          await basicsRoute.click();
          assert.equal(await screen.getAttribute('data-scene'), String(index));
          errorAndHintChecked = true;
        }
        await choice(correct).click();
        if (index === 2) {
          assert.match(await feedback.innerText(), /Теперь снимем 2 справа/);
          await assertFit(page, ['#basics-feedback']);
          await page.screenshot({ path: path.join(artifacts, `basics-balance-correct-${width}.png`) });
        }
        assert.ok((await feedback.innerText()).includes(scene.question.success));
        await assertFit(page, ['#basics-feedback']);
      }
      await action(page, 'next').click();
      await assertFit(page, []);
    }
    assert.ok(errorAndHintChecked && modelChecked, 'expected both an experiment and a question');

    assert.equal(await screen.getAttribute('data-phase'), 'review');
    assert.equal(await page.locator('#basics-count').innerText(), `${scenes.length} из ${scenes.length} шагов`);
    assert.equal(await page.locator('#advanced-count').innerText(), '0 из 4 занятий');
    assert.equal(await screen.getAttribute('data-question'), '0');
    const firstEquation = await page.locator('[data-basics-math]').innerText();
    assert.equal(firstEquation, reviews[0][0].math);
    const stalePage = await context.newPage();
    stalePage.on('pageerror', error => errors.push(error.message));
    await stalePage.goto(`${base}${pilot}`);
    const staleAnswer = stalePage.locator('#basics-answer');
    await staleAnswer.focus();
    await submitReview.click();
    assert.equal(await screen.getAttribute('data-question'), '0');
    await answer.fill('999');
    assert.equal(await staleAnswer.inputValue(), '');
    await staleAnswer.press('Enter');
    assert.equal(await stalePage.locator('#basics-screen').getAttribute('data-question'), '0');
    assert.equal(await staleAnswer.inputValue(), '999');
    await staleAnswer.focus();
    await page.reload();
    assert.equal(await screen.getAttribute('data-phase'), 'review');
    assert.equal(await answer.inputValue(), '999');
    await submitReview.click();
    assert.equal(await screen.getAttribute('data-question'), '1');
    assert.equal((await feedback.innerText()).trim(), '');
    await action(page, 'back').click();
    assert.equal(await answer.inputValue(), '999');
    await submitReview.click();
    for (const item of reviews[0].slice(1)) {
      await answer.fill(String(item.answer));
      await submitReview.click();
    }
    assert.equal(await screen.getAttribute('data-phase'), 'summary');
    assert.equal(await page.locator('#basics-trainer').isVisible(), false);
    const lessonSteps = () => page.evaluate(() => JSON.parse(localStorage.getItem('mathexam.linearPilot.basics.v1')).steps);
    const completedSteps = await lessonSteps();
    await action(page, 'remediate').first().click();
    for (const [index, scene] of scenes.entries()) {
      if (scene.group !== reviews[0][0].group) continue;
      assert.equal(await screen.getAttribute('data-phase'), 'lesson');
      assert.equal(await screen.getAttribute('data-scene'), String(index));
      assert.equal(await action(page, 'next').isEnabled(), false);
      if (scene.experiment) {
        const math = page.locator('[data-basics-math]');
        assert.equal(await math.innerText(), scene.math);
        await action(page, 'experiment').click();
        await page.reload();
        assert.equal(await screen.getAttribute('data-scene'), String(index));
        assert.equal(await math.innerText(), scene.experiment.math);
      }
      if (scene.question) {
        const { correct, options } = scene.question;
        const wrong = options.findIndex((_, optionIndex) => optionIndex !== correct);
        const choice = optionIndex => page.locator(`[data-basics="choose"][data-option="${optionIndex}"]`);
        await choice(wrong).click();
        assert.equal(await feedback.innerText(), options[wrong].feedback);
        assert.equal(await action(page, 'next').isEnabled(), false);
        await choice(correct).click();
      }
      await action(page, 'next').click();
    }
    assert.equal(await screen.getAttribute('data-phase'), 'summary');
    assert.deepEqual(await lessonSteps(), completedSteps);
    await action(page, 'retry').click();
    assert.equal(await screen.getAttribute('data-phase'), 'review');
    assert.equal(await screen.getAttribute('data-question'), '0');
    assert.equal(await answer.inputValue(), '');
    const alternateEquation = await page.locator('[data-basics-math]').innerText();
    assert.equal(alternateEquation, reviews[1][0].math);
    assert.notEqual(firstEquation, alternateEquation);
    assert.equal(await stalePage.locator('[data-basics-math]').innerText(), firstEquation);
    await staleAnswer.fill('666');
    assert.equal(await stalePage.locator('[data-basics-math]').innerText(), alternateEquation);
    assert.equal(await staleAnswer.inputValue(), '');
    assert.equal(await answer.inputValue(), '');
    await stalePage.close();
    for (const item of reviews[1]) {
      await answer.fill(String(item.answer));
      await submitReview.click();
    }

    assert.equal(await screen.getAttribute('data-phase'), 'complete');
    await advancedRoute.click();
    assert.equal(await page.locator('#c0w0').inputValue(), 'Черновик другого маршрута');
    await basicsRoute.click();
    await page.reload();
    assert.equal(await screen.getAttribute('data-phase'), 'complete');
    await assertFit(page, []);
    await page.screenshot({ path: path.join(artifacts, `basics-complete-${width}.png`) });
    const trainerLink = page.locator('#basics-trainer');
    assert.equal(new URL(await trainerLink.getAttribute('href'), page.url()).pathname, trainer);
    const [response] = await Promise.all([
      page.waitForResponse(response => new URL(response.url()).pathname === trainer),
      trainerLink.click()
    ]);
    assert.ok(response.ok(), `trainer returned ${response.status()}`);
    await page.waitForURL(`**${trainer}`);
    assert.match(await page.title(), /Простые уравнения/);
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}

async function run() {
  await fs.mkdir(artifacts, { recursive: true });
  const server = await serve();
  const base = process.env.PILOT_BASE_URL || `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH });
    for (const width of [320, 1280]) await walkthrough(browser, base, width);
    console.log('LINEAR_PILOT_BASICS_BROWSER_OK: 320×900 and 1280×900, experiment, feedback, reload, remediation, alternate review, stale tab, advanced drafts, trainer');
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
