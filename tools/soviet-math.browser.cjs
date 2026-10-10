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
const expectedTopicIds = require('../soviet-math/course.js').topics.map(topic => topic.id);

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
      const learning = state.lastMode === 'learn';
      const continuation = learning ? 'learn-next' : 'continue';
      if (session.accepted) { byId(continuation).click(); continue; }
      const step = plan.steps[session.step];
      must(byId('question').textContent === step.prompt, plan.topicId + ': question matches active step');
      if (learning) {
        must(byId('answer-form').hidden, 'worked explanation never requires guessing an answer');
        must(!byId('reveal').hidden && !byId('reveal').disabled, 'explanation is available');
        byId('reveal').click();
      } else {
        must(!byId('check').hidden && !byId('answer').disabled, 'unanswered step is editable');
        if (String(step.answer).includes('/')) must(byId('answer').inputMode === 'text', 'fractions permit a slash on mobile');
        byId('answer').value = String(step.answer);
        byId('answer').dispatchEvent(new Event('input', { bubbles: true }));
        byId('check').click();
      }
      const after = window.__soviet.state().sessions[state.lastTopic + ':' + state.lastMode];
      must(after.accepted, plan.topicId + ': correct answer accepted at ' + session.step);
      must(after.step === session.step, 'correct answer does not skip its written step');
      must(byId('solution-log').children.length === session.step + 1, 'all completed rows remain in the text solution');
      checked++;
      if (!after.done) {
        must(!byId(continuation).hidden, 'explicit continuation is offered');
        byId(continuation).click();
      }
    }
    throw Error('Example exceeded 220 steps');
  });
}

async function loadSession(page, id, index, records = []) {
  await page.evaluate(({ key, id, index, records }) => {
    const state = { version: 2, courseRevision: 2, lastTopic: id, lastMode: 'practice', motion: false, sessions: {}, previousSessions: {}, records };
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
    assert.deepEqual(topics.map(topic => topic.id), expectedTopicIds, 'every registered topic loads in the browser');
    assert.equal(await page.locator('.topic-card').count(), expectedTopicIds.length);
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
      assert.equal(record.revision, 2, 'new results record their lesson revision');
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

    // Batch-two answer forms are mathematical requirements: preserve the
    // requested denominator, and use a proper reduced tail in mixed numbers.
    const forms = await page.evaluate(() => {
      const equivalent = window.SovietMath.make('fraction-equivalent', 0).steps.at(-1);
      const mixed = window.SovietMath.make('fraction-to-mixed', 0).steps.at(-1);
      return {
        specified: ['8/12', '2/3', '16/24', '8/0'].map(value => window.SovietMath.check(value, equivalent)),
        mixed: ['2 3/4', '2 6/8', '1 7/4', '11/4', '2,75'].map(value => window.SovietMath.check(value, mixed))
      };
    });
    assert.deepEqual(forms, { specified: [true, false, false, false], mixed: [true, false, false, false, false] });

    // Index 13 is NOT a repetition of index 1 in generated division. Conversely
    // visually different fractions share a prompt and must remain distinguishable.
    for (const [id, priorIndex, index] of [['divide-two', 1, 13], ['fraction-meaning', 1, 2]]) {
      const prior = { revision: 2, topic: id, index: priorIndex, at: Date.now(), errors: 0, help: 0, repeated: false };
      await loadSession(page, id, index, [prior]);
      checkedSteps += await finish(page);
      assert.equal((await snapshot(page)).records.at(-1).repeated, false, id + ': distinguish actual exercise identity');
    }

    const historical = {revision: 1, topic: 'fraction-meaning', index: 1, at: 1760000000000, errors: 0, help: 0, repeated: false};
    await loadSession(page, 'fraction-meaning', 1, [historical]);
    checkedSteps += await finish(page);
    assert.deepEqual((await snapshot(page)).records[0], historical, 'legacy history is kept as originally recorded');
    assert.equal((await snapshot(page)).records.at(-1).repeated, false, 'legacy identity uses its original plan, not the revised plan at the same index');

    // Rewording an unchanged division exercise is not a new condition. Its
    // numeric operands and task type remain the same across course revisions.
    const oldDivision = {revision: 1, topic: 'divide-simple', index: 1, at: 1760000000001, errors: 0, help: 0, repeated: false};
    await loadSession(page, 'divide-simple', 1, [oldDivision]);
    const divisionIdentity = await page.evaluate(() => {
      const previous = window.SovietMath.legacyMake('divide-simple', 1);
      const current = window.SovietMath.make('divide-simple', 1);
      return {oldPrompt: previous.prompt, newPrompt: current.prompt,
        oldOperands: [previous.division.task.dividend, previous.division.task.divisor],
        newOperands: [current.division.task.dividend, current.division.task.divisor]};
    });
    assert.notEqual(divisionIdentity.oldPrompt, divisionIdentity.newPrompt, 'fixture covers a wording change');
    assert.deepEqual(divisionIdentity.oldOperands, ['69', '3']);
    assert.deepEqual(divisionIdentity.newOperands, ['69', '3']);
    assert.match(await page.locator('#work-status').innerText(), /повтор/i, 'unchanged legacy division is labelled as a repeat before solving');
    checkedSteps += await finish(page);
    assert.deepEqual((await snapshot(page)).records[0], oldDivision);
    assert.equal((await snapshot(page)).records.at(-1).repeated, true, 'unchanged division cannot earn a new independent result after revision');
    assert.equal((await snapshot(page)).records.at(-1).revision, 2);

    // A stale tab must preserve the newer saved attempt and display a notice.
    const other = await pageFor(context);
    await ready(other, '#' + (await snapshot(page)).lastTopic);
    await other.locator('#new-task').click();
    const durable = await other.evaluate(key => localStorage.getItem(key), KEY);
    await page.locator('#mode-learn').click();
    assert.match(await page.locator('#notice').innerText(), /другой вкладке/);
    assert.equal(await page.evaluate(key => localStorage.getItem(key), KEY), durable);
    await other.close();
    await ready(page, '#%E0%A4%A');
    assert.equal(await page.locator('#catalog').isVisible(), true, 'malformed hash falls back to the catalog');
    await context.close();

    // A published v1 attempt is validated against the legacy lesson, archived,
    // and restarted against the revised lesson. No old result may disappear or
    // be mistaken for a freshly completed revision-2 exercise.
    const migrationContext = await browser.newContext({ reducedMotion: 'reduce' });
    const migrationPage = await pageFor(migrationContext);
    await ready(migrationPage);
    const legacyFixture = await migrationPage.evaluate(key => {
      const old = window.SovietMath.legacyMake('divide-zero', 7);
      const value = {version: 1, lastTopic: 'divide-zero', lastMode: 'practice', motion: false, sessions: {}, records: [
        {topic: 'bonds', index: 2, at: 1760000000000, errors: 1, help: 2, repeated: false},
        {topic: 'fraction-meaning', index: 1, at: 1760000000001, errors: 0, help: 0, repeated: false}
      ]};
      value.sessions['divide-zero:practice'] = {topic: 'divide-zero', mode: 'practice', index: 7,
        step: old.steps.length - 2, accepted: false, done: false, draft: '17', errors: 2, help: 1, hint: true};
      localStorage.setItem(key, JSON.stringify(value));
      return value;
    }, KEY);
    await ready(migrationPage, '#divide-zero');
    await migrationPage.reload();
    let migrated = await snapshot(migrationPage);
    assert.equal(migrated.version, 2, 'rollback-safe schema marker is written');
    assert.equal(migrated.courseRevision, 2);
    assert.match(await migrationPage.locator('#notice').innerText(), /Прежние результаты сохранены/);
    assert.deepEqual(migrated.previousSessions, legacyFixture.sessions, 'all fields of the old attempt remain archived');
    assert.deepEqual(migrated.records, legacyFixture.records.map(record => ({...record, revision: 1})));
    assert.equal(migrated.sessions['divide-zero:practice'].step, 0, 'new explanation begins at its own first step');
    assert.equal(migrated.sessions['divide-zero:practice'].accepted, false);
    assert.equal(migrated.sessions['divide-zero:practice'].errors, 0);
    assert.equal(migrated.sessions['divide-zero:practice'].help, 0);
    assert.equal(await migrationPage.locator('#answer').inputValue(), '');
    checkedSteps += await finish(migrationPage);
    migrated = await snapshot(migrationPage);
    assert.equal(migrated.records.length, legacyFixture.records.length + 1);
    assert.equal(migrated.records.at(-1).revision, 2);
    assert.deepEqual(migrated.records.slice(0, -1), legacyFixture.records.map(record => ({...record, revision: 1})));
    assert.deepEqual(migrated.previousSessions, legacyFixture.sessions);
    await migrationPage.reload();
    assert.deepEqual(await snapshot(migrationPage), migrated, 'reload preserves migration and never duplicates its result');
    await migrationContext.close();

    for (const raw of ['{broken', JSON.stringify({ version: 99, sessions: {}, records: [], lastMode: 'learn', motion: false }),
      JSON.stringify({version: 2, courseRevision: 99, sessions: {}, records: [], lastMode: 'learn', motion: false}),
      JSON.stringify({version: 1, courseRevision: 2, sessions: {}, records: [], lastMode: 'learn', motion: false})]) {
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
      for (const id of ['column-subtract', 'divide-decimal', 'fraction-add', 'percent-whole',
        'fraction-to-mixed', 'mixed-subtract-borrow', 'decimal-subtract', 'measure-length']) {
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
    console.log('SOVIET_MATH_BROWSER_OK: ' + topics.length + ' topic flows, ' + checkedSteps + ' checked steps; revision-2 migration/archive, worked explanations, accumulation, resume, help/errors, repetition, fractions, video links, corrupt/future/stale storage, 320/390px and reduced motion.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
