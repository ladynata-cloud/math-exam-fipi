'use strict';

// Real classic-board / Socket.IO sessions with isolated synthetic participants.
// Only localhost is reachable; no pupil account or production room is used.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { createReadStream, mkdirSync, statSync } = require('node:fs');
const { createServer } = require('node:http');
const { createServer: createNetServer } = require('node:net');
const { extname, join, resolve, sep } = require('node:path');
const { chromium } = require('playwright');

const ROOT = resolve(__dirname, '..');
const SHOTS = process.env.PROFILE_LOG_TRIG_BOARD_SHOTS;
const START = {
  id: 'ege-profile-log-trig', api: '__profileLogTrigBoard', home: '#course',
  lessons: ['expr-logarithms', 'algebra-logarithmic', 'fn-explog', 'trig-angle', 'trig-coordinates', 'trig-special', 'trig-tangent', 'algebra-cosine', 'algebra-double-angle'],
  entry: '#practice/expr-logarithms/guided'
};
const CIRCLE = {
  id: 'ege-profile-circle', api: '__profileCircleBoard', home: '#home',
  lessons: ['before-circle', 'before-radians', 'm5-coordinates', 'm6-axis', 'm6-calculation', 'm6-identities', 'm6-equations'],
  tasks: ['prep-radius', 'prep-negative', 'm5-1-a', 'm6-1-a', 'm6-6-a', 'm6-10-a', 'm6-16-a'],
  entry: '#task/prep-radius/guided'
};
for (const config of [START, CIRCLE]) config.wrapper = config.id + '.html';
const PERSONAL_KEYS = ['mathexam.profileStart2027.v1', 'mathexam.profileCalmPreferences.v1', 'mathexam.profileCheckpoint.v1', 'mathexam.profileReadinessDiagnostic.v1', 'mathexam.mordkovichCircle.v1'];
const RETURN_KEY = 'mathexam.profileReturn', CONTROL_KEY = 'profile-log-trig-board-gate.unrelated';
const wait = ms => new Promise(done => setTimeout(done, ms));
const failures = [], sessions = [];
let phase = 'startup';
function stage(label) { phase = label; console.log('CHECK ' + label); }

async function freePort() {
  const server = createNetServer();
  await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
  const port = server.address().port; await new Promise(done => server.close(done)); return port;
}
function staticServer() {
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
  return createServer((request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://local').pathname);
      if (pathname === '/favicon.ico') { response.writeHead(204).end(); return; }
      let file = resolve(ROOT, '.' + pathname);
      if (file !== ROOT && !file.startsWith(ROOT + sep)) { response.writeHead(403).end(); return; }
      if (statSync(file).isDirectory()) file = join(file, 'index.html');
      response.setHeader('Content-Type', (mime[extname(file)] || 'application/octet-stream') + (/\.(html|js|css|json|svg)$/.test(file) ? '; charset=utf-8' : ''));
      response.setHeader('Cache-Control', 'no-store'); createReadStream(file).pipe(response);
    } catch (_) { response.writeHead(404).end(); }
  });
}
async function healthy(origin, child, diagnostics) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw Error('Local server exited: ' + diagnostics());
    try { if ((await fetch(origin + '/health', { signal: AbortSignal.timeout(1000) })).ok) return; } catch (_) {}
    await wait(100);
  }
  throw Error('Local server health timed out: ' + diagnostics());
}
async function newSession(browser, siteOrigin, boardOrigin, tag) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if ([siteOrigin, boardOrigin].includes(url.origin) || ['data:', 'blob:'].includes(url.protocol)) return route.continue();
    failures.push(tag + ': external request ' + url.origin + url.pathname); return route.abort();
  });
  const values = Object.fromEntries(PERSONAL_KEYS.map((key, index) => [key, JSON.stringify({ version: 1, sentinel: tag + ':' + index, records: {}, seen: {}, sessions: {}, enabled: true, examples: {}, micro: {} })]));
  values[PERSONAL_KEYS[0]] = JSON.stringify({ version: 1, sentinel: tag, records: { 'expr-logarithms': { guided: [], independent: [], attempts: 7 } }, seen: { 'expr-logarithms-1': 3 }, sessions: {
    'expr-logarithms:guided': { taskId: 'expr-logarithms-1', step: 0, wrong: false, assisted: true, familiar: true, done: false, draft: 'private-' + tag, answers: [], started: '2025-01-01T00:00:00.000Z', registered: false }
  } });
  values['mathexam.mordkovichCircle.v1'] = JSON.stringify({ version: 1, sentinel: tag, records: {}, seen: { 'prep-radius': 3 }, sessions: {
    'prep-radius:guided': { taskId: 'prep-radius', mode: 'guided', step: 0, draft: { parts: 'private-' + tag }, solved: false, done: false, assisted: true, wrong: false, familiar: true, angle: 1.25, started: '2025-01-01T00:00:00.000Z', registered: false, updatedAt: 1 }
  } });
  values[CONTROL_KEY] = 'unrelated:' + tag;
  const returned = '#practice/synthetic-' + tag + '/independent';
  await context.addInitScript(({ origin, values, controlKey, returnKey, returned }) => {
    if (location.origin !== origin) return;
    // Seed only once: reloads must not hide accidental writes to personal work.
    if (!localStorage.getItem(controlKey + '.seeded')) {
      for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
      localStorage.setItem(controlKey + '.seeded', '1');
    }
    if (!sessionStorage.getItem(controlKey + '.seeded')) {
      sessionStorage.setItem(returnKey, returned); sessionStorage.setItem(controlKey + '.seeded', '1');
    }
    if (window === top) {
      window.__logTrigMessages = 0;
      addEventListener('message', event => {
        if (event.source === document.querySelector('#trainerFrame')?.contentWindow && event.data?.type === 'mathexam:trainer-state') window.__logTrigMessages++;
      });
    }
  }, { origin: siteOrigin, values, controlKey: CONTROL_KEY, returnKey: RETURN_KEY, returned });
  const page = await context.newPage(); page.setDefaultTimeout(12000); page.setDefaultNavigationTimeout(20000);
  page.on('pageerror', error => failures.push(tag + ': ' + error.message));
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.hostname === '127.0.0.1' && response.status() >= 400) failures.push(tag + ': HTTP ' + response.status() + ' ' + url.pathname);
  });
  const session = { context, page, tag, values, returned }; sessions.push(session); return session;
}
async function personalStorage(session) {
  const actual = await session.page.evaluate(({ keys, returnKey }) => ({ local: Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), returned: sessionStorage.getItem(returnKey) }), { keys: Object.keys(session.values), returnKey: RETURN_KEY });
  assert.deepEqual(actual.local, session.values, session.tag + ': five personal stores and unrelated storage remain byte-identical');
  assert.equal(actual.returned, session.returned, session.tag + ': personal return target remains byte-identical');
}
async function connected(page) {
  await page.waitForFunction(() => shared.connected && roomStateReceived && document.querySelector('#mirrorStatus')?.dataset.mirrorStatus === 'connected', null, { polling: 25, timeout: 20000 });
}
async function courseFrame(page, config) {
  await page.waitForFunction(file => document.querySelector('#trainerFrame')?.src.includes(file), config.wrapper, { polling: 25 });
  let frame; const deadline = Date.now() + 12000;
  while (!frame && Date.now() < deadline) { frame = page.frames().find(item => item.url().includes('/trainers/' + config.wrapper)); if (!frame) await wait(25); }
  assert(frame, config.id + ': registered iframe exists');
  await frame.waitForFunction(key => ['getState', 'applyState', 'validateState'].every(method => typeof window[key]?.[method] === 'function'), config.api, { polling: 25 });
  await frame.evaluate(key => {
    window.__logTrigApi = window[key];
    if (window.__logTrigInstrumented) return;
    window.__logTrigInstrumented = true; window.__logTrigApplied = 0;
    addEventListener('message', event => {
      if (event.source === parent && ['mathexam:hydrate', 'mathexam:apply-trainer-state'].includes(event.data?.type)) window.__logTrigApplied++;
    });
  }, config.api);
  return frame;
}
const snapshot = frame => frame.evaluate(() => window.__logTrigApi.getState());
const messages = page => page.evaluate(() => window.__logTrigMessages);
async function settled(frame) {
  let previous = '', stable = 0;
  for (let i = 0; i < 100; i++) {
    const state = await snapshot(frame), bytes = JSON.stringify(state);
    stable = bytes === previous ? stable + 1 : 0; if (stable >= 2) return state;
    previous = bytes; await wait(25);
  }
  throw Error('Controller state did not settle');
}
async function waitSnapshot(frame, expected, label) {
  try {
    await frame.waitForFunction(value => {
      const stable = item => Array.isArray(item) ? item.map(stable) : item && typeof item === 'object' ? Object.fromEntries(Object.keys(item).sort().map(key => [key, stable(item[key])])) : item;
      return JSON.stringify(stable(window.__logTrigApi.getState())) === JSON.stringify(stable(value));
    }, expected, { polling: 25 });
  } catch (error) { assert.deepEqual(await snapshot(frame), expected, label + ': remote snapshot converges'); throw error; }
}
function view(frame) {
  return frame.evaluate(() => {
    const one = s => document.querySelector(s), text = s => one(s)?.textContent.trim() || '';
    const shown = s => { const element = one(s); return !!element && !element.hidden && !element.closest('[hidden]'); };
    function geometry(svg) {
      const clone = svg.cloneNode(true), ids = new Map();
      [...clone.querySelectorAll('[id]')].forEach((node, index) => ids.set(node.id, 'local-svg-' + index));
      for (const node of [clone, ...clone.querySelectorAll('*')]) for (const attr of [...node.attributes]) {
        let value = attr.value;
        if (attr.name === 'id') value = ids.get(value) || value;
        else if (['aria-labelledby', 'aria-describedby'].includes(attr.name)) value = value.split(/\s+/).map(id => ids.get(id) || id).join(' ');
        else value = value.replace(/url\(#([^)]+)\)/g, (whole, id) => ids.has(id) ? 'url(#' + ids.get(id) + ')' : whole);
        node.setAttribute(attr.name, value);
      }
      return clone.outerHTML;
    }
    return {
      route: location.hash, title: text('#main h1'), condition: text('.task-condition'), question: text('.current-question > .question,.task-panel > .question'), step: text('#current-step,.steps'),
      answers: [...document.querySelectorAll('#answer-form input')].map(input => ({ type: input.type, value: input.value, checked: input.checked, disabled: input.disabled })),
      captures: [...document.querySelectorAll('.point-saved,.order-selected')].map(element => element.textContent.trim()),
      feedback: text('#feedback'), feedbackClass: one('#feedback')?.className || '', hintShown: shown('#hint-box'), hint: text('#hint-box'),
      next: one('#next') ? { hidden: one('#next').hidden, disabled: one('#next').disabled, text: text('#next') } : null,
      history: text('#solution-history'), details: [...document.querySelectorAll('#main details')].map(element => element.open),
      models: [...document.querySelectorAll('#task-model,#lab,#example-model,#result-model')].map(model => ({
        geometry: [...model.querySelectorAll('svg')].map(geometry), text: model.textContent.trim(),
        controls: [...model.querySelectorAll('input,select,button')].map(element => ({ tag: element.tagName, type: element.type || '', value: element.value || '', checked: !!element.checked, text: element.tagName === 'BUTTON' ? element.textContent.trim() : '', pressed: element.getAttribute('aria-pressed'), hidden: element.hidden }))
      }))
    };
  });
}
async function synchronized(controller, observer, label) {
  const expected = await settled(controller);
  assert.equal(await controller.evaluate(state => window.__logTrigApi.validateState(state), expected), true, label + ': local export satisfies the wire contract');
  await waitSnapshot(observer, expected, label);
  assert.deepEqual(await view(observer), await view(controller), label + ': rendered task, controls and geometry match');
  assert.deepEqual(await snapshot(controller), expected, label + ': source remains stable during apply'); return expected;
}
async function quiet(pages, label) {
  let previous = await Promise.all(pages.map(messages)), unchanged = Date.now(); const deadline = Date.now() + 4000;
  while (Date.now() < deadline) {
    await wait(80); const current = await Promise.all(pages.map(messages));
    if (current.some((count, index) => count !== previous[index])) unchanged = Date.now();
    else if (Date.now() - unchanged >= 320) return current;
    previous = current;
  }
  throw Error(label + ': state publication does not become quiet');
}
async function closeShare(page) {
  await page.evaluate(() => {
    window.__logTrigShareClosed = false;
    document.querySelector('#sharePanel').addEventListener('close', () => { window.__logTrigShareClosed = true; }, { once: true });
  });
  await page.locator('#sharePanel [data-close-panel]').click();
  await page.waitForFunction(() => window.__logTrigShareClosed && !document.querySelector('#sharePanel').open, null, { polling: 25 });
}
async function handoff(room, studentControls) {
  const previous = studentControls ? room.teacher : room.student, next = studentControls ? room.student : room.teacher;
  const previousFrame = await courseFrame(previous.page, room.config), nextFrame = await courseFrame(next.page, room.config);
  const before = await settled(previousFrame), published = await messages(next.page), applied = await previousFrame.evaluate(() => window.__logTrigApplied);
  await room.teacher.page.locator('#openShare').click(); await room.teacher.page.locator('#controlToggle').click();
  await room.student.page.waitForFunction(value => document.body.classList.contains('control-owner') === value, studentControls, { polling: 25 });
  await room.teacher.page.waitForFunction(value => document.body.classList.contains('control-owner') !== value, studentControls, { polling: 25 });
  await next.page.waitForFunction(count => window.__logTrigMessages > count, published, { polling: 25 });
  await previousFrame.waitForFunction(count => window.__logTrigApplied > count, applied, { polling: 25 });
  assert.deepEqual(await snapshot(nextFrame), before, 'control transfer preserves selected task and current work');
  assert.equal(await previous.page.locator('#trainerFrame').evaluate(element => element.inert && getComputedStyle(element).pointerEvents === 'none'), true, 'observer frame blocks pointer and keyboard input');
  await synchronized(nextFrame, previousFrame, 'settled control transfer'); await closeShare(room.teacher.page);
}
async function route(frame, hash, config) {
  if (await frame.evaluate(() => location.hash) === hash) return;
  let link = frame.locator('a[href="' + hash + '"]').first();
  if (!await link.count()) {
    await frame.locator('.brand').click();
    await frame.waitForFunction(value => location.hash === value, config.home);
    link = frame.locator('a[href="' + hash + '"]').first();
  }
  await link.waitFor({ state: 'attached' });
  assert.equal(await link.count(), 1, 'authored navigation exposes ' + hash);
  await link.click(); await frame.waitForFunction(value => location.hash === value, hash); await frame.locator('#main h1').waitFor();
}
async function modelAction(controller, observer, action, label) {
  const before = (await settled(controller)).view.model; assert(before, label + ': model exists');
  await action(); const after = (await settled(controller)).view.model;
  assert.notDeepEqual(after, before, label + ': real input changes semantic model state');
  return synchronized(controller, observer, label);
}
async function changeLab(controller, observer, config, label, deep = false) {
  const host = controller.locator('#lab');
  if (config === CIRCLE) {
    const input = host.locator('[data-angle-input]');
    const angle = (await snapshot(controller)).view.model.angle;
    await modelAction(controller, observer, async () => { await input.fill(String(angle + Math.PI / 3)); await input.press('Tab'); }, label + ': angle input');
    if (deep) {
      await modelAction(controller, observer, () => input.fill('1/'), label + ': unfinished angle draft');
      await modelAction(controller, observer, async () => { await input.fill('pi/2'); await input.press('Tab'); }, label + ': exact angle');
      await modelAction(controller, observer, () => host.locator('[data-angle-snap]').selectOption('6'), label + ': snap division');
      await modelAction(controller, observer, () => host.locator('[data-circle-svg]').press('ArrowLeft'), label + ': keyboard construction');
    }
  } else {
    const input = host.locator('input[type="number"]').first();
    if (await input.count()) {
      const next = await input.evaluate(element => { const n = Number(element.value), d = Number(element.step) || 1; return String(n + d <= Number(element.max || Infinity) ? n + d : n - d); });
      await modelAction(controller, observer, async () => { await input.fill(next); await input.press('Tab'); }, label + ': numeric model control');
      if (deep) {
        await modelAction(controller, observer, () => input.fill(''), label + ': unfinished numeric draft');
        await modelAction(controller, observer, () => input.fill(next), label + ': continue numeric draft');
      }
    } else {
      const button = host.locator('button').first(); assert.equal(await button.count(), 1, label + ': authored model has a control');
      await modelAction(controller, observer, () => button.click(), label + ': model help');
      const disclosure = host.locator('details > summary').first();
      if (await disclosure.count()) {
        if (!await disclosure.locator('..').evaluate(element => element.open)) await modelAction(controller, observer, () => disclosure.click(), label + ': graph exploration');
        await modelAction(controller, observer, () => host.locator('input[type="range"]').press('ArrowRight'), label + ': graph cursor');
      }
    }
    if (deep && await host.locator('select').count()) {
      const select = host.locator('select').first(), other = await select.evaluate(element => [...element.options].find(option => option.value !== element.value).value);
      await modelAction(controller, observer, () => select.selectOption(other), label + ': model selection');
    }
  }
}
async function dragCircle(page, controller, observer) {
  const svg = controller.locator('#lab [data-circle-svg]'); await svg.scrollIntoViewIfNeeded();
  const box = await svg.boundingBox(); assert(box && box.width > 0);
  await modelAction(controller, observer, async () => {
    const x = box.x + 350 / 480 * box.width, y = box.y + 190 / 385 * box.height;
    await page.mouse.move(x, y); await page.mouse.down();
    await page.mouse.move(box.x + 230 / 480 * box.width, box.y + 65 / 385 * box.height, { steps: 5 }); await page.mouse.up();
  }, 'actual pointer construction on the circle');
}
async function answerStart(frame, correct = true) {
  const question = await frame.evaluate(() => {
    const state = window.__logTrigApi.getState(), [, id, mode] = state.route.split('/');
    const session = state.progress.sessions[id + ':' + mode], task = ProfileLessons.find(lesson => lesson.id === id).tasks.find(task => task.id === session.taskId);
    const question = mode === 'guided' ? task.steps[session.step] : task;
    return { answer: String(question.answer), choices: question.choices };
  });
  if (await frame.locator('#answer').count()) await frame.locator('#answer').fill(correct ? question.answer : '-987654321');
  else {
    const radios = frame.locator('#answer-form input[type="radio"]'), value = correct ? question.answer : question.choices.map(String).find(value => value !== question.answer);
    const index = await radios.evaluateAll((inputs, value) => inputs.findIndex(input => input.value === value), value);
    assert(index >= 0, 'authored answer choice exists'); await radios.nth(index).check();
  }
}
async function circleFields(frame) {
  return frame.evaluate(() => {
    const state = window.__logTrigApi.getState(), [, id, mode] = state.route.split('/'), session = state.progress.sessions[id + ':' + mode];
    const task = MordLessons.flatMap(lesson => lesson.tasks).find(task => task.id === id);
    return (mode === 'guided' && session.step < task.steps.length ? task.steps[session.step] : task).fields;
  });
}
async function answerCircle(frame, correct = true) {
  for (const [index, field] of (await circleFields(frame)).entries()) {
    const wrong = !correct && index === 0;
    const value = !wrong ? field.expected : field.kind === 'number' ? -987654321 : field.kind === 'point' ? field.expected + Math.PI : field.kind === 'choice' ? field.options.find(option => option.value !== field.expected).value : field.kind === 'order' ? field.expected.slice().reverse() : field.expected.length ? [] : [field.options[0].value];
    if (field.kind === 'number') await frame.locator('#answer-form input[data-field="' + field.id + '"]').fill(String(value));
    else if (field.kind === 'point') {
      await frame.locator('#lab [data-angle-input]').fill(String(value)); await frame.locator('#lab [data-angle-input]').press('Tab');
      await frame.locator('[data-capture="' + field.id + '"]').click();
    } else if (field.kind === 'choice') await frame.locator('#answer-form input[name="' + field.id + '"][value="' + value + '"]').check();
    else if (field.kind === 'multi') {
      const inputs = frame.locator('#answer-form input[name="' + field.id + '"]');
      for (let i = 0; i < await inputs.count(); i++) { const input = inputs.nth(i), option = await input.getAttribute('value'); await input.setChecked(value.length ? value.includes(option) : option === '__none'); }
    } else if (field.kind === 'order') for (const option of value) await frame.locator('[data-add="' + field.id + '"][data-value="' + option + '"]').click();
    else throw Error('Unknown authored field kind ' + field.kind);
  }
}
async function solveTask(controller, observer, config, label) {
  let count = 0;
  while (!await controller.locator('.result-panel').count()) {
    assert(++count <= 12, label + ': finite authored step sequence');
    await (config === START ? answerStart : answerCircle)(controller);
    await synchronized(controller, observer, label + ': answer draft ' + count);
    await controller.locator(config === START ? '#submit-answer' : '#check').click();
    await controller.locator('#feedback.good').waitFor();
    await synchronized(controller, observer, label + ': checked answer ' + count);
    assert.equal(await observer.locator('#answer-form button[type="submit"]').isDisabled(), true, label + ': accepted answer locks on both peers');
    await controller.locator('#next').click(); await synchronized(controller, observer, label + ': next step ' + count);
  }
  const result = await snapshot(controller), key = result.route.split('/').slice(1).join(':');
  assert.equal(result.progress.sessions[key].done, true, label + ': final result is shared');
}

async function createRoom(browser, siteOrigin, boardOrigin, config) {
  stage(config.id + ': selected task survives room creation');
  const teacher = await newSession(browser, siteOrigin, boardOrigin, config.id + '-teacher'), student = await newSession(browser, siteOrigin, boardOrigin, config.id + '-pupil');
  const url = new URL('/trainers/trainer-board.html', siteOrigin); url.searchParams.set('server', boardOrigin); url.searchParams.set('trainer', '/trainers/' + config.wrapper + config.entry);
  await teacher.page.goto(url.href, { waitUntil: 'domcontentloaded' }); let t = await courseFrame(teacher.page, config);
  await t.locator('#answer-form').waitFor();
  if (config === START) {
    const first = (await snapshot(t)).progress.sessions['expr-logarithms:guided'].taskId;
    for (let step = 0; !await t.locator('.result-panel').count(); step++) {
      assert(step < 8, 'pre-room task has a finite step sequence');
      await answerStart(t); await t.locator('#submit-answer').click(); await t.locator('#feedback.good').waitFor(); await t.locator('#next').click();
    }
    await t.locator('#another').click(); await t.locator('#answer-form').waitFor();
    assert.notEqual((await snapshot(t)).progress.sessions['expr-logarithms:guided'].taskId, first, 'a non-default task is selected before creating a room');
  }
  await (config === START ? answerStart : answerCircle)(t, false);
  const selected = await settled(t);
  assert.equal(selected.route, config.entry); assert.equal(Object.values(selected.progress.sessions)[0].familiar, false, 'shared session never imports personal task history');
  if (config === START) {
    // A teacher may prepare the task before inviting a pupil. Expire the
    // initial ten-second bridge handshake without changing the selected work.
    await wait(11000); assert.deepEqual(await snapshot(t), selected, 'prepared task remains intact while waiting to create a room');
  }
  await teacher.page.locator('#openShare').click(); await teacher.page.locator('#createRoom').click();
  await teacher.page.waitForFunction(() => document.querySelector('#studentLink')?.value.includes('role=student'), null, { polling: 25 });
  const invite = await teacher.page.locator('#studentLink').inputValue();
  assert.equal(new URL(invite).origin, siteOrigin); assert.equal(new URL(invite).searchParams.get('server'), boardOrigin);
  assert.equal(new URL(teacher.page.url()).searchParams.has('token'), false, 'teacher capability is absent from the address');
  await closeShare(teacher.page); await student.page.goto(invite, { waitUntil: 'domcontentloaded' });
  await Promise.all([connected(teacher.page), connected(student.page)]); t = await courseFrame(teacher.page, config); const s = await courseFrame(student.page, config);
  assert.equal((await synchronized(t, s, 'selected task after room creation')).route, selected.route);
  // Continue independent transport scenarios after an entry failure, but retain
  // it as a mandatory final-gate failure. This also reports both wrapper paths.
  try { assert.deepEqual((await snapshot(t)).progress.sessions, selected.progress.sessions, 'creating the room retains the selected attempt'); }
  catch (error) { failures.push(config.id + ': ' + error.message); console.error('FAIL ' + config.id + ': selected task/draft changed during room creation'); }
  return { teacher, student, invite, config, t, s };
}
async function malformedAndObserver(room, validReplay) {
  const { t, s, teacher, student } = room;
  stage(room.config.id + ': malformed snapshots and non-controller publication');
  const before = await settled(t), visible = await view(t);
  const rejected = await t.evaluate(() => {
    const original = window.__logTrigApi.getState();
    const bad = [
      { ...structuredClone(original), route: '#lesson/unrelated-topic' },
      { ...structuredClone(original), injected: true },
      { ...structuredClone(original), returnToTask: 'x'.repeat(70000) }
    ];
    return bad.map(value => {
      if (window.__logTrigApi.validateState(value)) return false;
      try { return window.__logTrigApi.applyState(value) === false; } catch (_) { return true; }
    });
  });
  assert.deepEqual(rejected, [true, true, true], 'unrelated, extra-key and oversized snapshots are rejected atomically');
  assert.deepEqual(await snapshot(t), before); assert.deepEqual(await view(t), visible);
  assert.notDeepEqual(validReplay, before, 'ownership probe has a different, valid earlier state');
  assert.equal(await s.evaluate(value => window.__logTrigApi.validateState(value), validReplay), true, 'forged observer replay is otherwise a valid course snapshot');
  await quiet([teacher.page, student.page], 'before forged observer state');
  const stored = await student.page.evaluate(value => new Promise(resolve => {
    // Same-socket FIFO makes the state reply an acknowledgement that the
    // forged publication was processed. Inspect server state too: a controller
    // deliberately ignores observer broadcasts in its own live iframe.
    shared.socket.once('room:state', payload => resolve(payload.state.latestTrainerState.state));
    const forged = structuredClone(latestTrainerState); forged.state = value;
    shared.socket.emit('board:trainer-state-change', roomPayload(forged));
    shared.socket.emit('room:state');
  }), validReplay);
  assert.deepEqual(stored, before, 'observer cannot overwrite the authoritative room snapshot');
  assert.deepEqual(await snapshot(t), before, 'observer cannot overwrite the controller through the real transport');
  assert.deepEqual(await snapshot(s), before); assert.equal(await student.page.locator('#trainerFrame').evaluate(element => element.inert), true);
}
async function reconnect(disconnected, active, controller, observer, action, label) {
  stage(label);
  await disconnected.page.evaluate(() => { window.__logTrigDisconnected = false; shared.socket.once('disconnect', () => { window.__logTrigDisconnected = true; }); });
  await disconnected.context.setOffline(true);
  await disconnected.page.evaluate(() => { if (shared.socket.connected) shared.socket.io.engine.close(); });
  await disconnected.page.waitForFunction(() => window.__logTrigDisconnected && !shared.connected);
  await action(); const updated = await settled(controller);
  await disconnected.context.setOffline(false); await connected(disconnected.page);
  await waitSnapshot(observer, updated, label); await synchronized(controller, observer, label);
  assert.equal(await active.page.evaluate(() => document.body.classList.contains('control-owner')), true, label + ': active writer retains control');
}
async function resilience(browser, siteOrigin, boardOrigin, room) {
  const { config, teacher, student } = room; let { t, s } = room;
  stage(config.id + ': shared laboratory, late join and both reload directions');
  const lesson = config === START ? 'fn-explog' : 'm5-coordinates';
  await route(t, '#lesson/' + lesson, config);
  if (config === START) await t.locator('#explore-lab > summary').click();
  await changeLab(t, s, config, 'teacher laboratory', true);
  if (config === CIRCLE) await dragCircle(teacher.page, t, s);
  const state = await settled(t), visible = await view(t), late = await newSession(browser, siteOrigin, boardOrigin, config.id + '-late');
  await late.page.goto(room.invite, { waitUntil: 'domcontentloaded' }); await connected(late.page); const lf = await courseFrame(late.page, config);
  await waitSnapshot(lf, state, 'late join'); assert.deepEqual(await view(lf), visible, 'late join restores actual model geometry and controls');
  await personalStorage(late); await late.context.close();
  await student.page.reload({ waitUntil: 'domcontentloaded' }); await connected(student.page); s = await courseFrame(student.page, config);
  await waitSnapshot(s, state, 'pupil reload'); assert.deepEqual(await view(s), visible, 'pupil reload preserves the selected model');
  room.s = s; await handoff(room, true); const teacherCount = (await quiet([teacher.page, student.page], 'grant'))[0];
  await changeLab(s, t, config, 'pupil continues hydrated laboratory'); if (config === CIRCLE) await dragCircle(student.page, s, t);
  await quiet([teacher.page, student.page], 'pupil model'); assert.equal(await messages(teacher.page), teacherCount, 'teacher observer does not echo pupil work');
  const pupilState = await settled(s); await teacher.page.reload({ waitUntil: 'domcontentloaded' }); await connected(teacher.page); t = await courseFrame(teacher.page, config);
  await waitSnapshot(t, pupilState, 'teacher reload'); room.t = t;
  const action = frame => config === CIRCLE ? frame.locator('#lab [data-delta]').first().click() : frame.locator('#lab button').first().click();
  await reconnect(teacher, student, s, t, () => action(s), config.id + ': teacher reconnect catches pupil edits');
  await handoff(room, false);
  await reconnect(student, teacher, t, s, () => action(t), config.id + ': pupil reconnect catches teacher edits');
  await malformedAndObserver(room, state);
  await teacher.page.setViewportSize({ width: 320, height: 900 });
  assert(await t.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'selected course fits a 320px board frame');
  if (SHOTS) await teacher.page.screenshot({ path: join(SHOTS, config.id + '-320.png'), mask: [teacher.page.locator('#studentLink')] });
  await teacher.page.setViewportSize({ width: 1440, height: 1000 });
  await synchronized(t, s, 'viewport change preserves semantic state');
  if (SHOTS) await teacher.page.screenshot({ path: join(SHOTS, config.id + '-desktop.png'), mask: [teacher.page.locator('#studentLink')] });
  return { t, s };
}
async function coverage(room) {
  const { config, teacher, student, t } = room; let s = room.s;
  for (const [index, lesson] of config.lessons.entries()) {
    stage(config.id + ': solve ' + lesson + ' through real controls');
    await route(t, '#lesson/' + lesson, config);
    if (config === START) await t.locator('#explore-lab > summary').click();
    await synchronized(t, s, lesson + ': lesson and model'); await changeLab(t, s, config, lesson, index === 0);
    if (config === START) await t.locator('#guided').click();
    else await t.locator('a[href="#task/' + config.tasks[index] + '/guided"]').first().click();
    await t.locator('#answer-form').waitFor(); const taskState = await synchronized(t, s, lesson + ': selected guided task');
    assert.match(taskState.route, /\/guided$/);
    const numeric = t.locator('#answer-form input[type="text"]').first();
    if (await numeric.count()) {
      if (config === CIRCLE) await answerCircle(t);
      await numeric.fill('1/'); await synchronized(t, s, lesson + ': unfinished fractional answer');
      await t.locator(config === START ? '#submit-answer' : '#check').click();
      assert.match(await t.locator('#feedback').innerText(), /Не удалось прочитать число/);
      await synchronized(t, s, lesson + ': unreadable answer feedback');
    }
    await (config === START ? answerStart : answerCircle)(t, false);
    await synchronized(t, s, lesson + ': wrong draft');
    await t.locator(config === START ? '#submit-answer' : '#check').click(); await t.locator('#feedback.bad').waitFor();
    await synchronized(t, s, lesson + ': wrong-answer feedback');
    if (config === CIRCLE) await modelAction(t, s, () => t.locator('#lab [data-reveal-readings]').click(), lesson + ': requested construction readings');
    if (lesson === 'fn-explog') {
      await modelAction(t, s, () => t.locator('#task-model [data-model-action="function-help"]').click(), lesson + ': task graph explanation');
      await modelAction(t, s, () => t.locator('#task-model details > summary').click(), lesson + ': task graph exploration');
      await modelAction(t, s, () => t.locator('#task-model input[type="range"]').press('ArrowRight'), lesson + ': task graph cursor');
    }
    await t.locator('#hint').click(); await t.locator('#hint-box').waitFor(); await synchronized(t, s, lesson + ': requested hint');
    if (index === 0) {
      const saved = await settled(t), visible = await view(t);
      await student.page.reload({ waitUntil: 'domcontentloaded' }); await connected(student.page); room.s = s = await courseFrame(student.page, config);
      await waitSnapshot(room.s, saved, 'task reload'); assert.deepEqual(await view(room.s), visible, 'reload restores selected task, answer and hint');
      await handoff(room, true);
      await reconnect(teacher, student, s, t, () => (config === START ? answerStart : answerCircle)(s), lesson + ': task draft survives teacher reconnect');
      await solveTask(room.s, t, config, lesson + ' pupil'); await handoff(room, false);
    } else await solveTask(t, room.s, config, lesson + ' teacher');
    await Promise.all([teacher, student].map(personalStorage));
  }
}
async function run(browser, siteOrigin, boardOrigin) {
  for (const config of [START, CIRCLE]) {
    const room = await createRoom(browser, siteOrigin, boardOrigin, config);
    await coverage(room); Object.assign(room, await resilience(browser, siteOrigin, boardOrigin, room));
    const counts = await quiet([room.teacher.page, room.student.page], 'final idle'); await wait(400);
    assert.deepEqual(await Promise.all([room.teacher.page, room.student.page].map(messages)), counts, 'idle peers do not repeatedly publish');
    await Promise.all([room.teacher, room.student].map(personalStorage));
    await room.student.context.close(); await room.teacher.context.close();
    console.log((failures.length ? 'CHECKED ' : 'PASS ') + config.id + ': ' + config.lessons.length + ' lessons solved; models, both writers, task reload, reconnect, late join, isolated progress');
  }
  assert.deepEqual(failures, [], 'no page errors, missing assets or non-local requests');
  console.log('PROFILE_LOG_TRIG_BOARD_BROWSER_OK: 9 START lessons + 6 Circle lessons + optional equations; real UI solutions/drafts/check/next/hints; graph and circle controls in both directions; selected task preserved; reload/late join/both reconnect directions; owner-only transport; malformed-state rejection; five personal stores unchanged');
}
async function diagnostics() {
  for (const session of sessions) {
    if (session.page.isClosed()) continue;
    const data = await session.page.evaluate(() => ({ connected: typeof shared === 'object' && shared.connected, hydrated: typeof roomStateReceived === 'boolean' && roomStateReceived, mirror: document.querySelector('#mirrorStatus')?.dataset.mirrorStatus, writer: document.body.classList.contains('control-owner'), messages: window.__logTrigMessages })).catch(() => null);
    const frame = session.page.frames().find(item => /\/trainers\/ege-profile-(log-trig|circle)\.html/.test(item.url()));
    const work = frame ? await frame.evaluate(() => ({ state: window.__logTrigApi?.getState(), route: location.hash, text: document.querySelector('#main')?.innerText.slice(0, 2000) })).catch(() => null) : null;
    console.error('DIAGNOSTIC ' + session.tag + ' ' + JSON.stringify({ ...data, work }));
    if (SHOTS) await session.page.screenshot({ path: join(SHOTS, 'failure-' + session.tag + '.png'), mask: [session.page.locator('#studentLink')], timeout: 3000 }).catch(() => {});
  }
}
(async () => {
  if (SHOTS) mkdirSync(SHOTS, { recursive: true });
  const server = staticServer(); let browser, child, watchdog, serverErrors = '';
  try {
    await Promise.race([
      (async () => {
        await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
        const siteOrigin = 'http://127.0.0.1:' + server.address().port, boardOrigin = 'http://127.0.0.1:' + await freePort();
        const env = { ...process.env, HOST: '127.0.0.1', PORT: new URL(boardOrigin).port, NODE_ENV: 'test', CORS_ALLOWED_ORIGINS: siteOrigin };
        for (const key of Object.keys(env)) if (/^(LEARNING_|PROGRESS_|GROUP_LESSON_|TRAINER_REGISTRY_PATH$)/.test(key)) delete env[key];
        child = spawn(process.execPath, ['index.js'], { cwd: join(ROOT, 'board-server'), env, stdio: ['ignore', 'ignore', 'pipe'] });
        child.stderr.on('data', chunk => { serverErrors = (serverErrors + String(chunk)).slice(-4000); });
        await healthy(boardOrigin, child, () => serverErrors);
        browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || process.env.BROWSER_EXECUTABLE_PATH, headless: true, args: ['--no-sandbox'], timeout: 15000 });
        await run(browser, siteOrigin, boardOrigin);
      })(),
      new Promise((_, reject) => { watchdog = setTimeout(() => reject(Error('Browser gate exceeded 360 seconds at ' + phase)), 360000); })
    ]);
  } catch (error) { await diagnostics(); throw error; }
  finally {
    clearTimeout(watchdog); await browser?.close(); if (child && child.exitCode === null) child.kill('SIGTERM');
    if (server.listening) await new Promise(done => server.close(done));
  }
})().catch(error => { console.error('PROFILE_LOG_TRIG_BOARD_BROWSER_FAILED at ' + phase + '\n' + (error.stack || error)); process.exitCode = 1; });
