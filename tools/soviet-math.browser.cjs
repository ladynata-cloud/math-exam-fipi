'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = pathToFileURL(path.join(ROOT, 'soviet-math/index.html')).href;
const KEY = 'mathExam.sovietMath.v1';
const SHOTS = process.env.SOVIET_SCREENSHOTS;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const errors = [];

async function ready(page, hash = '') {
  await page.goto(URL + hash);
  await page.waitForFunction(() => window.__soviet && window.SovietMath);
}
async function snapshot(page) { return page.evaluate(() => window.__soviet.state()); }
async function picture(page, name) {
  if (!SHOTS) return;
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: true });
}
async function pageFor(context) {
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  return page;
}

// Exercise the actual form/continuation handlers. Each accepted step must stay
// put until the next button is activated; this also checks the cumulative log.
async function finish(page) {
  return page.evaluate(() => {
    const byId = id => document.getElementById(id);
    const must = (yes, message) => { if (!yes) throw Error(message); };
    let checked = 0;
    for (let guard = 0; guard < 220; guard++) {
      const state = window.__soviet.state();
      const plan = window.__soviet.plan();
      const session = state.sessions[state.lastTopic + ':' + state.lastMode];
      if (session.done) return checked;
      if (session.accepted) { byId('continue').click(); continue; }
      const step = plan.steps[session.step];
      must(byId('question').textContent === step.prompt, plan.topicId + ': question matches active step');
      must(!byId('check').hidden && !byId('answer').disabled, 'unanswered step is editable');
      if (String(step.answer).includes('/')) must(byId('answer').inputMode === 'text', 'fractions permit a slash on mobile');
      byId('answer').value = String(step.answer);
      byId('answer').dispatchEvent(new Event('input', { bubbles: true }));
      byId('check').click();
      const after = window.__soviet.state().sessions[state.lastTopic + ':' + state.lastMode];
      must(after.accepted, plan.topicId + ': correct answer accepted at ' + session.step);
      must(after.step === session.step, 'correct answer does not skip its written step');
      must(byId('solution-log').children.length === session.step + 1, 'all completed rows remain in the text solution');
      checked++;
      if (!after.done) {
        must(!byId('continue').hidden, 'explicit continuation is offered');
        byId('continue').click();
      }
    }
    throw Error('Example exceeded 220 steps');
  });
}

async function loadSession(page, id, index, records = []) {
  await page.evaluate(({ key, id, index, records }) => {
    const state = { version: 1, lastTopic: id, lastMode: 'practice', motion: false, sessions: {}, records };
    state.sessions[id + ':practice'] = { topic: id, mode: 'practice', index, step: 0, accepted: false, done: false, draft: '', errors: 0, help: 0, hint: false };
    localStorage.setItem(key, JSON.stringify(state));
  }, { key: KEY, id, index, records });
  await ready(page, '#' + id);
  // Changing only a fragment is a same-document navigation. Reload explicitly
  // so the deliberately seeded persisted fixture is read by the application.
  await page.reload();
  await page.waitForFunction(() => window.__soviet && window.SovietMath);
}

(async () => {
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  let checkedSteps = 0;
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const page = await pageFor(context);
    await ready(page);
    const topics = await page.evaluate(() => window.SovietMath.topics.map(t => ({ id: t.id, title: t.title })));
    assert.equal(topics.length, 30);
    assert.equal(await page.locator('.topic-card').count(), 30);
    await picture(page, 'catalog-desktop');

    for (const [position, topic] of topics.entries()) {
      await ready(page, '#' + topic.id);
      assert.equal(await page.locator('#lesson-title').innerText(), topic.title);
      await page.locator('#mode-practice').click();
      assert.equal(await page.locator('#motion').isChecked(), false, 'reduced-motion preference is respected');
      checkedSteps += await finish(page);
      const state = await snapshot(page), record = state.records.at(-1);
      assert.equal(state.records.length, position + 1, topic.id + ': one record per completed exercise');
      assert.equal(record.topic, topic.id);
      assert.equal(record.errors, 0);
      assert.equal(record.help, 0);
      assert.equal(record.repeated, false);
      assert.equal(await page.locator('#finish').isVisible(), true);
      if (['column-subtract', 'divide-decimal', 'fraction-add'].includes(topic.id)) await picture(page, topic.id + '-desktop');
      await page.reload();
      assert.equal((await snapshot(page)).records.length, position + 1, 'reload never duplicates a completed record');
      assert.equal(await page.locator('#finish').isVisible(), true, 'completed attempt resumes');
      await page.locator('#mode-video').click();
      assert.ok((await page.locator('#video').getAttribute('src')).endsWith('media/' + topic.id + '.mp4'));
      assert.ok((await page.locator('#download-video').getAttribute('href')).endsWith('media/' + topic.id + '.mp4'));
      assert.equal((await snapshot(page)).records.length, position + 1, 'opening video does not award a result');
    }

    // A wrong answer and a hint survive a reload, together with the draft.
    await ready(page, '#column-subtract');
    await page.locator('#mode-practice').click();
    await page.locator('#new-task').click();
    await page.locator('#check').click();
    assert.equal((await snapshot(page)).sessions['column-subtract:practice'].errors, 0, 'empty submission is not a mathematical error');
    await page.locator('#answer').fill('9999');
    await page.locator('#check').click();
    await page.locator('#hint').click();
    await page.reload();
    let session = (await snapshot(page)).sessions['column-subtract:practice'];
    assert.equal(session.errors, 1);
    assert.equal(session.help, 1);
    assert.equal(await page.locator('#answer').inputValue(), '9999');
    checkedSteps += await finish(page);
    assert.equal((await snapshot(page)).records.at(-1).help, 1);
    assert.equal((await snapshot(page)).records.at(-1).errors, 1);
    await page.locator('#repeat').click();
    checkedSteps += await finish(page);
    assert.equal((await snapshot(page)).records.at(-1).repeated, true);
    assert.match(await page.locator('#work-status').innerText(), /повтор/i, 'repeat is labelled separately from a new independent result');

    const beforeLearn = (await snapshot(page)).records.length;
    await page.locator('#mode-learn').click();
    await page.locator('#reveal').click();
    checkedSteps += await finish(page);
    assert.equal((await snapshot(page)).records.length, beforeLearn, 'learning and revealing cannot award practice results');

    // Equivalent but unreduced fractions do not satisfy an explicit instruction
    // to reduce. Other steps may still accept numerically equivalent forms.
    const reduction = await page.evaluate(() => {
      const step = window.SovietMath.make('fraction-reduce', 0).steps.at(-1);
      return { reduced: window.SovietMath.check('1/2', step), unchanged: window.SovietMath.check('2/4', step) };
    });
    assert.deepEqual(reduction, { reduced: true, unchanged: false });

    // Index 13 is NOT a repetition of index 1 in generated division. Conversely
    // visually different fractions share a prompt and must remain distinguishable.
    for (const [id, priorIndex, index] of [['divide-two', 1, 13], ['fraction-meaning', 1, 2]]) {
      const prior = { topic: id, index: priorIndex, at: Date.now(), errors: 0, help: 0, repeated: false };
      await loadSession(page, id, index, [prior]);
      checkedSteps += await finish(page);
      assert.equal((await snapshot(page)).records.at(-1).repeated, false, id + ': distinguish actual exercise identity');
    }

    // A stale tab must preserve the newer saved attempt and display a notice.
    const other = await pageFor(context);
    await ready(other, '#fraction-meaning');
    await other.locator('#new-task').click();
    const durable = await other.evaluate(key => localStorage.getItem(key), KEY);
    await page.locator('#mode-learn').click();
    assert.match(await page.locator('#notice').innerText(), /другой вкладке/);
    assert.equal(await page.evaluate(key => localStorage.getItem(key), KEY), durable);
    await other.close();
    await ready(page, '#%E0%A4%A');
    assert.equal(await page.locator('#catalog').isVisible(), true, 'malformed hash falls back to the catalog');
    await context.close();

    for (const raw of ['{broken', JSON.stringify({ version: 99, sessions: {}, records: [], lastMode: 'learn', motion: false })]) {
      const damaged = await browser.newContext({ reducedMotion: 'reduce' });
      const p = await pageFor(damaged);
      await p.addInitScript(({ key, raw }) => localStorage.setItem(key, raw), { key: KEY, raw });
      await ready(p, '#bonds');
      assert.match(await p.locator('#notice').innerText(), /оставлена без изменений/);
      checkedSteps += await finish(p);
      assert.equal(await p.evaluate(key => localStorage.getItem(key), KEY), raw, 'corrupt or future records are preserved');
      await damaged.close();
    }

    for (const width of [320, 390]) {
      const mobile = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
      const p = await pageFor(mobile);
      await ready(p);
      assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, width + ': catalog fits');
      for (const id of ['column-subtract', 'divide-decimal', 'fraction-add', 'percent-whole']) {
        await ready(p, '#' + id);
        await p.locator('#mode-practice').click();
        assert.equal(await p.locator('#mobile-main').isVisible(), true);
        assert.equal(await p.locator('#mobile-helper').isVisible(), true);
        assert.equal(await p.locator('#motion').isChecked(), false);
        await p.locator('#detail').click();
        assert.equal(await p.locator('#detail').getAttribute('aria-pressed'), 'true');
        checkedSteps += await finish(p);
        assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, width + ': ' + id + ' fits');
        if (id === 'divide-decimal' || id === 'fraction-add') await picture(p, id + '-mobile-' + width);
      }
      await mobile.close();
    }
    assert.deepEqual(errors, [], 'no browser JavaScript errors');
    console.log('SOVIET_MATH_BROWSER_OK: 30 topic flows, ' + checkedSteps + ' checked steps; accumulation, resume, help/errors, repetition, fractions, video links, corrupt/future/stale storage, 320/390px and reduced motion.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
