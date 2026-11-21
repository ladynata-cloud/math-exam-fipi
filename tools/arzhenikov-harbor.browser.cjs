'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');

const trainer = new URL(process.env.ARZHENIKOV_TRAINER_URL || pathToFileURL(path.resolve(__dirname,
  '../trainers/oge-basics/multiplication-division/arzhenikov-map.html')).href);
trainer.hash = '';
const artifacts = path.resolve(process.env.ARZHENIKOV_ARTIFACT_DIR || 'artifacts/arzhenikov-adventure');
fs.mkdirSync(artifacts, {recursive: true});
const key = 'mathexam.arzhenikov.harbor.v1';
const otherKeys = ['mathexam.arzhenikov.workshop.v1', 'mathexam.arzhenikov.garden.v1',
  'mathexam.arzhenikov.division.v1', 'mathexam.harbor-test.sentinel'];
const cases = [
  ['exact', 12, 4, 3, 0, 3], ['remainder', 14, 4, 3, 2, 4],
  ['floor', 14, 4, 3, 2, 4], ['ceil', 14, 4, 3, 2, 4],
  ['exact', 15, 5, 3, 0, 3], ['remainder', 17, 5, 3, 2, 4],
  ['floor', 17, 5, 3, 2, 4], ['ceil', 17, 5, 3, 2, 4],
  ['exact', 12, 3, 4, 0, 4], ['remainder', 10, 3, 3, 1, 4],
  ['floor', 12, 4, 3, 0, 3], ['ceil', 12, 4, 3, 0, 3]
].map(([kind, total, capacity, full, remainder, containers], index) =>
  ({id: String(index + 1), kind, total, capacity, full, remainder, containers}));
const url = hash => trainer.href + '#' + hash;
const board = page => page.locator('#harbor-play .hb-board');
const action = (page, name) => board(page).locator('[data-hb-action="' + name + '"]');
const place = (page, index) => action(page, 'place').and(page.locator('[data-bin="' + index + '"]'));
const take = (page, index) => action(page, 'return').and(page.locator('[data-bin="' + index + '"]'));
const stage = (page, name) => page.locator('#harbor-play[data-stage="' + name + '"]').waitFor({state: 'visible'});
const progress = page => page.evaluate(() => window.ArzhenikovHarborProgress());
const values = page => board(page).locator('.hb-answer input').evaluateAll(inputs => inputs.map(input => input.value));
const arrangement = page => board(page).locator('.hb-targets > .hb-target').evaluateAll(groups => groups.map(group => Number(group.dataset.amount)));
const otherState = page => page.evaluate(keys => Object.fromEntries(keys.map(name => [name, localStorage.getItem(name)])), otherKeys);
const compact = text => text.replace(/\s+/g, '');

async function fits(page, where) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), where + ': horizontal overflow');
}
async function screenshot(page, name, locator) {
  await page.waitForFunction(() => !window.ArzhenikovArt || document.documentElement.classList.contains('arz-art-ready'));
  await (locator || page).screenshot({path: path.join(artifacts, 'harbor-' + name + '.png')});
}
async function checkFirstScreen(page, width) {
  await stage(page, 'layout');
  await screenshot(page, 'start-' + width);
  const target = await place(page, 0).boundingBox();
  assert(target && target.y >= 0 && target.y + target.height <= 850,
    'First Harbor object control must be fully visible at ' + width + ': ' + JSON.stringify(target));
  assert(target.width >= 44 && target.height >= 44, 'Harbor object control needs a usable touch target');
  await fits(page, 'Harbor first screen ' + width);
}
async function putArrangement(page, wanted, keyboard = false) {
  let current = await arrangement(page);
  // Free excess objects first, so a valid repacking also works with an empty quay.
  for (let index = 0; index < current.length; index++) {
    for (let n = current[index]; n > (wanted[index] || 0); n--) await take(page, index).press('Enter');
  }
  current = await arrangement(page);
  for (let index = 0; index < current.length; index++) {
    for (let n = current[index]; n < (wanted[index] || 0); n++) {
      if (keyboard) await place(page, index).press('Enter');
      else await place(page, index).click();
    }
  }
  assert.deepEqual(await arrangement(page), current.map((_, index) => wanted[index] || 0));
}
function desired(mission) {
  return Array(mission.full).fill(mission.capacity).concat(mission.kind === 'ceil' && mission.remainder ? [mission.remainder] : []);
}
function answers(mission) {
  return mission.kind === 'remainder' ? [mission.full, mission.remainder]
    : [mission.kind === 'ceil' ? mission.containers : mission.full];
}

async function keyboardRestore(page, mission) {
  await place(page, 0).press('Enter');
  await page.reload();
  await stage(page, 'layout');
  assert.equal((await arrangement(page))[0], 1, 'A keyboard move survives reload');
  await action(page, 'undo').press('Enter');
  assert((await arrangement(page)).every(amount => amount === 0), 'Undo reverses the saved move');
  assert.equal(await board(page).locator('.hb-stock .hb-token').count(), mission.total);
}
async function wrongLayout(page, mission) {
  await place(page, 0).press('Enter');
  const before = await arrangement(page);
  await action(page, 'check-layout').press('Enter');
  await stage(page, 'layout');
  assert.deepEqual(await arrangement(page), before, 'A rejected layout stays editable');
  assert.match(await board(page).locator('.hb-feedback').innerText(), /неполная группа/iu);
  await page.reload();
  assert.deepEqual(await arrangement(page), before, 'The incorrect layout survives reload');
  assert.match(await board(page).locator('.hb-feedback').innerText(), /неполная группа/iu);
  await action(page, 'hint').press('Enter');
  assert(await board(page).locator('.hb-hint').isVisible());
  assert.equal(await board(page).locator('.hb-equation').count(), 0, 'No symbolic solution before the child answers');
  await putArrangement(page, []);
  assert.equal(await board(page).locator('.hb-stock .hb-token').count(), mission.total);
}
async function repackingFeedback(page, amounts, mission) {
  await putArrangement(page, amounts);
  const before = await arrangement(page);
  await action(page, 'check-layout').press('Enter');
  await stage(page, 'layout');
  assert.deepEqual(await arrangement(page), before, 'Repacking advice must not change the child\'s work');
  const feedback = await board(page).locator('.hb-feedback').innerText();
  assert.match(feedback, /груз поместился/iu);
  if (amounts.filter(Boolean).length === mission.containers) {
    assert.doesNotMatch(feedback, /меньше\s+(?:мест|короб|групп|ящик|контейнер)/iu,
      'A minimal packing with several partial boxes cannot use fewer containers');
  }
  assert.match(feedback, /по условию|сначала|переложи/iu);
}
async function wrongAnswers(page, mission) {
  const fields = board(page).locator('.hb-answer input');
  const expected = answers(mission);
  if (mission.kind === 'remainder') {
    await fields.nth(0).fill(String(mission.full));
    await fields.nth(1).fill(String(mission.capacity));
    await action(page, 'check-answer').press('Enter');
    await stage(page, 'answer');
    assert.deepEqual(await values(page), [String(mission.full), String(mission.capacity)]);
    assert.notEqual(await fields.nth(0).getAttribute('aria-invalid'), 'true', 'Correct quotient stays correct');
    assert.equal(await fields.nth(1).getAttribute('aria-invalid'), 'true', 'Only the wrong remainder needs correction');
    assert.match(await board(page).locator('.hb-feedback').innerText(), /Остаток/iu);
    await page.reload();
    await stage(page, 'answer');
    assert.deepEqual(await values(page), [String(mission.full), String(mission.capacity)], 'Wrong answer and correct field survive reload');
    assert.notEqual(await fields.nth(0).getAttribute('aria-invalid'), 'true');
    assert.equal(await fields.nth(1).getAttribute('aria-invalid'), 'true');
    assert.match(await board(page).locator('.hb-feedback').innerText(), /Остаток/iu);
    await fields.nth(1).fill(String(mission.remainder));
    assert.equal(await fields.nth(0).inputValue(), String(mission.full), 'Correct field is preserved while the other is repaired');
  } else {
    const wrong = mission.kind === 'ceil' && mission.remainder ? mission.full : expected[0] + 1;
    await fields.nth(0).fill(String(wrong));
    await action(page, 'check-answer').press('Enter');
    await stage(page, 'answer');
    assert.equal(await fields.nth(0).inputValue(), String(wrong));
    assert.equal(await fields.nth(0).getAttribute('aria-invalid'), 'true');
    if (mission.id === '12') assert.match(await board(page).locator('.hb-feedback').innerText(), /[Пп]устое|остался ли/);
  }
}
async function solve(page, mission, probes = {}) {
  await stage(page, 'layout');
  assert.equal((await progress(page)).mission.id, mission.id);
  assert.equal(await board(page).locator('.hb-answer input,.hb-equation').count(), 0);
  const previous = (await progress(page)).completed.length;
  if (probes.keyboard) await keyboardRestore(page, mission);
  if (probes.layout) await wrongLayout(page, mission);
  if (probes.repack) await repackingFeedback(page, probes.repack, mission);
  await putArrangement(page, desired(mission), Boolean(probes.keyboard));
  assert.equal(await board(page).locator('.hb-stock .hb-token').count(), mission.kind === 'ceil' ? 0 : mission.remainder);
  await action(page, 'check-layout').press('Enter');
  await stage(page, 'answer');
  if (probes.answers) {
    await wrongAnswers(page, mission);
    assert.equal((await progress(page)).completed.length, previous, 'An incorrect answer earns no mission');
  }
  const expected = answers(mission);
  for (let index = 0; index < expected.length; index++) await board(page).locator('.hb-answer input').nth(index).fill(String(expected[index]));
  await action(page, 'check-answer').press('Enter');
  await stage(page, 'complete');
  assert((await progress(page)).completed.includes(mission.id));
  assert.equal(compact(await board(page).locator('.hb-equation').innerText()),
    mission.total + '=' + mission.full + '×' + mission.capacity + '+' + mission.remainder);
  const quantities = await arrangement(page);
  assert.equal(quantities.length, mission.kind === 'ceil' ? mission.containers : mission.full);
  assert.equal(quantities.filter(amount => amount === mission.capacity).length, mission.full);
  assert.equal(quantities.filter(amount => amount < mission.capacity).length, Number(mission.kind === 'ceil' && mission.remainder > 0));
  assert.equal(await board(page).locator('.hb-stock .hb-token').count(), mission.kind === 'ceil' ? 0 : mission.remainder);
  if (mission.remainder === 0) assert.match(await board(page).locator('.hb-explanation').innerText(), /остатка нет/iu);
  await fits(page, 'Mission ' + mission.id);
}
async function checkedSolve(page, mission, probes, width) {
  try { await solve(page, mission, probes); }
  catch (error) {
    error.message = 'Harbor mission ' + mission.id + ' at ' + width + 'px: ' + error.message;
    await page.screenshot({path: path.join(artifacts, 'harbor-failure-' + width + '-' + mission.id + '.png'), timeout: 5000}).catch(() => {});
    throw error;
  }
}

async function explore(page, width) {
  const details = page.locator('#harbor-play .hb-sandbox');
  if (!await details.evaluate(node => node.open)) await details.locator(':scope > summary').press('Enter');
  const total = details.locator('input[type="number"][data-hb-sandbox="total"]');
  const capacity = details.locator('input[type="number"][data-hb-sandbox="capacity"]');
  const totalSlider = details.locator('input[type="range"][data-hb-slider="total"]');
  const capacitySlider = details.locator('input[type="range"][data-hb-slider="capacity"]');
  for (const [input, minimum, maximum] of [[total, 2, 20], [capacity, 2, 6]]) {
    assert.equal(await input.getAttribute('min'), String(minimum));
    assert.equal(await input.getAttribute('max'), String(maximum));
    assert.equal(await input.getAttribute('step'), '1');
  }
  const saved = await page.evaluate(key => localStorage.getItem(key), key);
  const completed = (await progress(page)).completed;
  await totalSlider.press('Home'); await capacitySlider.press('End');
  assert.deepEqual([await total.inputValue(), await capacity.inputValue()], ['2', '6'], 'Keyboard sliders update their numeric fields');
  assert.deepEqual([await totalSlider.getAttribute('aria-valuenow'), await capacitySlider.getAttribute('aria-valuenow')], ['2', '6']);
  for (const [n, d, full, rest, containers] of [[2, 6, 0, 2, 1], [17, 5, 3, 2, 4], [12, 4, 3, 0, 3]]) {
    await total.fill(String(n)); await capacity.fill(String(d));
    assert.deepEqual([await totalSlider.inputValue(), await capacitySlider.inputValue()], [String(n), String(d)], 'Numeric inputs update their sliders');
    const text = await details.locator('.hb-interpretations p').allTextContents();
    assert.equal(text.length, 4);
    if (rest) assert.match(text[0], /не делится/iu);
    else assert(compact(text[0]).includes(n + ':' + d + '=' + full));
    assert(compact(text[1]).includes(n + '=' + full + '×' + d + '+' + rest));
    assert.equal(Number(text[2].match(/:\s*(\d+)/)?.[1]), full);
    assert.equal(Number(text[3].match(/:\s*(\d+)/)?.[1]), containers);
    assert.equal(await details.locator('.hb-sandbox-model > .hb-target').count(), full);
    assert.equal(await details.locator('.hb-sandbox-remainder .hb-token').count(), rest);
    assert.deepEqual((await progress(page)).completed, completed, 'Sandbox exploration earns no mission');
    if (n === 17) await screenshot(page, 'sandbox-' + width, details);
  }
  assert.equal(await page.evaluate(key => localStorage.getItem(key), key), saved, 'Sandbox does not overwrite a mission');
  await total.fill('21');
  assert.match(await details.locator('.hb-feedback').innerText(), /от 2 до 20/);
  assert.equal(await total.getAttribute('aria-invalid'), 'true');
  await total.fill('12');
  await fits(page, 'Sandbox ' + width);
  await details.locator(':scope > summary').press('Enter');
}

async function routes(page, expectedCount) {
  for (const [hash, selector, mode] of [['workshop', '#workshop-play', 'city'], ['garden-count', '#garden-play', 'garden'], ['zero', '#sheet', 'skills'], ['harbor', '#harbor-play', 'harbor']]) {
    await page.goto(url(hash));
    await page.locator(selector).waitFor({state: 'visible'});
    assert.equal(await page.locator('body').getAttribute('data-adventure-mode'), mode);
    assert.equal(await page.locator('#division-harbor').isVisible(), mode === 'harbor');
    assert.equal(await page.locator('#workshop').isVisible(), mode === 'city');
    assert.equal(await page.locator('#garden-play').isVisible(), mode === 'garden');
    assert.equal(await page.locator('#sheet').isVisible(), mode === 'skills');
    assert.equal((await progress(page)).completed.length, expectedCount);
    await fits(page, 'Route ' + hash);
  }
}
async function contextFor(browser, width, priorWork = false) {
  const context = await browser.newContext({viewport: {width, height: 850}, reducedMotion: 'reduce'});
  if (priorWork) {
    const preparatory = await context.newPage();
    await preparatory.goto(url('workshop-picnic'));
    await preparatory.locator('#workshop-play [data-action="place"][data-index="0"]').press('Enter');
    await preparatory.goto(url('garden-count'));
    await preparatory.locator('#garden-play').waitFor({state: 'visible'});
    await preparatory.goto(url('count'));
    await preparatory.locator('#sheet').waitFor({state: 'visible'});
    await preparatory.evaluate(() => localStorage.setItem('mathexam.harbor-test.sentinel', 'keep-existing-work'));
    await preparatory.close();
  }
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  return {context, page, errors};
}

async function fullJourney(browser) {
  const {context, page, errors} = await contextFor(browser, 1280, true);
  try {
    await page.goto(url('harbor'));
    await checkFirstScreen(page, 1280);
    const bank = await page.evaluate(() => window.ArzhenikovHarborBank.missions);
    assert.deepEqual(bank.map(m => [m.id, m.kind, m.total, m.capacity]), cases.map(m => [m.id, m.kind, m.total, m.capacity]));
    const preserved = await otherState(page);
    assert(preserved[otherKeys[0]] && preserved[otherKeys[1]] && preserved[otherKeys[2]], 'Existing modes must have actual saved work');
    await explore(page, 1280);
    for (const mission of cases) {
      await checkedSolve(page, mission, {
        keyboard: mission.id === '1', layout: mission.id === '2',
        answers: ['2', '4', '12'].includes(mission.id),
        repack: mission.id === '4' ? [4, 4, 3, 3] : mission.id === '8' ? [5, 4, 4, 4] : mission.id === '12' ? [3, 3, 3, 3] : null
      }, 1280);
      assert.equal((await progress(page)).completed.length, Number(mission.id));
      if (['2', '4', '12'].includes(mission.id)) await screenshot(page, 'mission-' + mission.id + '-1280', board(page));
      if (mission.id === '1') {
        await action(page, 'replay').press('Enter');
        await checkedSolve(page, mission, {}, 1280);
        assert.equal((await progress(page)).completed.length, 1, 'Replay does not inflate completed missions');
      }
      if (mission.id !== '12') {
        await action(page, 'next').press('Enter');
        await stage(page, 'layout');
        assert.equal((await progress(page)).current, String(Number(mission.id) + 1));
      }
    }
    await page.reload(); await stage(page, 'complete');
    assert.deepEqual((await progress(page)).completed, cases.map(m => m.id));
    assert.deepEqual(await otherState(page), preserved, 'The Harbor save must not overwrite city, garden, division or unrelated state');
    await action(page, 'next').press('Enter');
    await page.locator('#workshop-play').waitFor({state: 'visible'});
    assert.equal(new URL(page.url()).hash, '#workshop');
    await routes(page, 12);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
}
async function mobileJourney(browser, width) {
  const {context, page, errors} = await contextFor(browser, width);
  try {
    await page.goto(url('harbor-2')); await checkFirstScreen(page, width);
    await checkedSolve(page, cases[1], {keyboard: true, layout: true, answers: true}, width);
    await screenshot(page, 'remainder-' + width, board(page));
    await page.goto(url('harbor-4'));
    await checkedSolve(page, cases[3], {repack: [4, 4, 3, 3], answers: true}, width);
    await screenshot(page, 'all-cargo-' + width, board(page));
    await page.goto(url('harbor-12'));
    await checkedSolve(page, cases[11], {answers: true}, width);
    assert.equal((await progress(page)).completed.length, 3);
    await explore(page, width);
    await page.reload(); await stage(page, 'complete');
    assert.deepEqual((await progress(page)).completed, ['2', '4', '12']);
    await routes(page, 3);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
}

(async () => {
  const browser = await chromium.launch();
  try {
    await fullJourney(browser);
    for (const width of [320, 375]) await mobileJourney(browser, width);
    console.log('ARZHENIKOV_HARBOR_OK: 12 missions, 320/375/1280, exact/remainder/full sets/all cargo, keyboard undo, wrong layouts and answers retained, minimal packing feedback, zero remainder, sandbox, independent save, replay and routes');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
