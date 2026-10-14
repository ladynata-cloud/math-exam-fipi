'use strict';
// Isolated fixture accounts/SQLite; exercises the published adapter and real API.
// Run with Node 24 and Playwright; no production account or origin is contacted.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { createRequire } = require('node:module');
const ROOT = path.resolve(__dirname, '..');
const express = createRequire(path.join(ROOT, 'board-server/package.json'))('express');
const { LearningStore } = require('../board-server/learning-store');
const { createLearningApi } = require('../board-server/learning-api');
const { createTeachingRouter } = require('../board-server/learning-teaching');
const contracts = require('../board-server/learning-contracts');
const { ids } = require('../trainers/motion-grade6/course-core');
let chromium;
try { ({ chromium } = require('playwright')); } catch (error) {
  if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw error;
  ({ chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright')));
}

const fixture = `<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/learning/style.css"><link rel="stylesheet" href="/learning/teaching.css">
<style>iframe{width:100%;height:1000px;border:0}#host{max-width:1160px;margin:auto}</style>
<body><main id="host"></main><script src="/learning/catalog.js"></script><script src="/learning/outcomes.js"></script><script src="/learning/teaching.js"></script><script>
window.messages=[];window.framesById={};window.attempts={};window.saved=[];window.saveErrors=[];window.pending=Promise.resolve();
addEventListener('message',event=>{
 if(event.origin!==location.origin)return;
 const id=Object.keys(framesById).find(id=>event.source===framesById[id].contentWindow);if(!id)return;
 messages.push({id,data:event.data});
 if(event.data.type!=='change')return;
 const change=event.data.payload;
 pending=pending.then(async()=>{
  const attempt=attempts[id];if(!attempt)throw Error('Read-only frame emitted a mutation');
  const type=change.kind==='check'?'check':change.kind==='hint'?'hint':'state';
  const payload={state:change.state};
  if(type==='check')payload.details=change.details;
  if(type==='hint'&&Number.isInteger(change.details.step))payload.step=change.details.step;
  const result=await api('/attempts/'+attempt.id+'/actions',{method:'POST',body:JSON.stringify({opId:crypto.randomUUID(),expectedVersion:attempt.version,type,payload})});
  attempts[id]=result.attempt;saved.push({id,kind:change.kind,result});
 }).catch(error=>saveErrors.push(String(error)));
});
window.add=id=>{const frame=document.createElement('iframe');frame.id=id;frame.src='/trainers/motion-grade6/index.html?learning=1&parentOrigin='+encodeURIComponent(location.origin)+'&channel=motion_fixture_channel_'+id;framesById[id]=frame;document.body.append(frame);};
window.hydrate=(id,payload)=>{const ready=messages.filter(m=>m.id===id&&m.data.type==='ready').at(-1).data;framesById[id].contentWindow.postMessage({protocol:ready.protocol,version:ready.version,channel:ready.channel,instance:ready.instance,type:'hydrate',payload},location.origin);};
</script></body></html>`;

async function initialize() {
  const session = await (await fetch('/api/learning/session')).json();
  window.fixtureSession = session; window.notices = [];
  window.api = async (route, options = {}) => {
    const response = await fetch('/api/learning' + route, { ...options, credentials: 'same-origin', headers: {
      ...(options.body ? { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrfToken } : {}), ...options.headers
    } });
    const result = await response.json();
    if (!response.ok) throw Error(route + ': ' + result.error);
    return result;
  };
}

async function main() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'motion-grade6-browser-'));
  const store = new LearningStore({ filePath: path.join(directory, 'learning.sqlite'), contracts });
  assert.equal(store.available, true, 'Node 24 SQLite is required');
  const hash = 'scrypt1:' + '01'.repeat(16) + ':' + '02'.repeat(32);
  const teacher = store.activate(store.bootstrap({ login: 'motion_fixture_teacher', name: 'Учитель' }).invitationToken, hash);
  const pupil = store.activate(store.createStudent(teacher.account, { login: 'motion_fixture_pupil', name: 'Ученик' }).invitationToken, hash);
  const app = express(); app.use(express.json({ limit: '1mb' }));
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const origin = 'http://127.0.0.1:' + server.address().port;
  const learning = createLearningApi({ store, publicOrigin: origin, secureCookies: false });
  app.use('/api/learning', learning.router); app.use('/api/learning', createTeachingRouter(learning));
  app.get('/fixture', (_request, response) => response.type('html').send(fixture));
  app.use(express.static(ROOT));
  let browser;
  const errors = [];
  try {
    const executablePath = process.env.CHROMIUM_EXECUTABLE || process.env.CHROMIUM_EXECUTABLE_PATH || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
    browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    async function open(session) {
      const context = await browser.newContext({ locale: 'ru-RU', reducedMotion: 'reduce', viewport: { width: 1280, height: 1000 } });
      await context.addCookies([{ name: 'mathexam_learning_local', value: session.sessionToken, url: origin, httpOnly: true, sameSite: 'Strict' }]);
      await context.addInitScript(() => localStorage.setItem('maxim-motion-v1', 'standalone-sentinel'));
      const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
      await page.goto(origin + '/fixture'); await page.evaluate(initialize);
      return page;
    }

    // A teacher can select and persist the original twelve lessons in order.
    const teacherPage = await open(teacher);
    await teacherPage.evaluate(async id => {
      const roster = await api('/teacher/students');
      LearningTeaching.mount(document.querySelector('#host'), { page: 'student', id,
        account: fixtureSession.account, api, catalog: LearningCatalog, students: roster.students || roster,
        notice: (text, error) => notices.push({ text, error }), navigate: () => {} });
    }, pupil.account.id);
    await teacherPage.locator('#teaching-plan').waitFor();
    for (const id of ids) {
      await teacherPage.locator('[data-add-plan]').click();
      const row = teacherPage.locator('[data-plan-row]').last();
      await row.locator('[name=catalogId]').selectOption('motion-grade6:' + id);
      await row.locator('[name=reason]').fill('Занятие по задачам на движение для 6 класса.');
    }
    await teacherPage.locator('#teaching-plan [type=submit]').click();
    await teacherPage.waitForFunction(() => notices.some(notice => notice.text === 'План сохранён.'));
    const savedPlan = await teacherPage.evaluate(id => api('/teacher/students/' + id + '/plan'), pupil.account.id);
    assert.deepEqual((savedPlan.plan || savedPlan).items.map(item => item.catalogId), ids.map(id => 'motion-grade6:' + id));
    assert.deepEqual(await teacherPage.evaluate(() => notices.filter(notice => notice.error)), []);

    const page = await open(pupil);
    const attempt = await page.evaluate(async () => {
      const result = await api('/attempts', { method: 'POST', body: JSON.stringify({ opId: crypto.randomUUID(), trainerId: 'motion-grade6', contentId: 'meeting', fresh: true }) });
      attempts.a = result.attempt; add('a'); return result.attempt;
    });
    const spec = attempt.taskSpec;
    const frame = id => page.frames().find(item => item.url().includes('channel=motion_fixture_channel_' + id));
    const count = (id, type) => page.evaluate(({ id, type }) => messages.filter(m => m.id === id && m.data.type === type).length, { id, type });
    async function hydrate(id, state, readOnly = false) {
      const before = await count(id, 'applied'), changes = await count(id, 'change');
      await page.evaluate(({ id, payload }) => hydrate(id, payload), { id, payload: { taskSpec: spec, state, readOnly } });
      await page.waitForFunction(({ id, before }) => messages.filter(m => m.id === id && m.data.type === 'applied').length > before, { id, before });
      assert.equal(await page.evaluate(id => messages.filter(m => m.id === id && m.data.type === 'applied').at(-1).data.payload.error, id), undefined);
      assert.equal(await count(id, 'change'), changes, 'Hydration is silent');
    }
    async function barrier(id) {
      const token = require('node:crypto').randomUUID();
      await frame(id).evaluate(token => parent.postMessage({ type: 'fixture-barrier', token }, location.origin), token);
      await page.waitForFunction(({ id, token }) => messages.some(m => m.id === id && m.data.token === token), { id, token });
      await page.evaluate(() => pending);
      assert.deepEqual(await page.evaluate(() => saveErrors), []);
    }
    async function change(action) {
      const before = await count('a', 'change'); await action(frame('a')); await barrier('a');
      assert(await count('a', 'change') > before, 'UI interaction emits a semantic change');
      return page.evaluate(() => saved.at(-1).result);
    }
    async function answer(raw) {
      await change(f => f.locator('#answer').fill(raw));
      return change(f => f.locator('#check').click());
    }
    await page.waitForFunction(() => messages.some(m => m.id === 'a' && m.data.type === 'ready'));
    assert.equal(await frame('a').locator('#answer').count(), 0, 'No task is generated before hydration');
    await hydrate('a', attempt.state);
    assert.match(await frame('a').locator('.managed-status').innerText(), /0 из 12/);
    assert.equal(await frame('a').locator('#guided').isChecked(), false);
    let result = await answer('99999');
    assert.equal(result.evaluation.correct, false); assert.equal(result.attempt.state.records[0].draft, '99999');
    for (let index = 0; index < 2; index++) {
      if (index) await change(f => f.locator('[data-task="' + index + '"]').click());
      result = await answer(String(spec.items[index].answer));
      assert.equal(result.evaluation.correct, true); assert.equal(result.evaluation.complete, false);
      assert.equal(result.attempt.outcome, 'started'); assert.equal(result.attempt.state.records[index].draft, '');
    }
    const historyRevision = result.attempt.version;
    await change(f => f.locator('[data-task="2"]').click());
    await change(f => f.locator('#hint').click());
    assert((await frame('a').locator('#hintContent').innerText()).length > 0);
    await change(f => f.locator('#guided').check());
    result = await answer(String(spec.items[2].steps[0].a));
    assert.deepEqual(result.attempt.state.records[2].answers, [String(spec.items[2].steps[0].a)]);
    await change(f => f.locator('#modelDetails summary').click());
    result = await change(f => f.locator('#scrub').evaluate(el => { el.value = '250'; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }));
    assert.equal(result.attempt.state.modelTime, spec.items[2].duration / 4);
    result = await change(f => f.locator('#answer').fill('3/'));
    const partial = result.attempt.state;

    // Recreate the iframe and resume from server state, including a raw draft.
    const readyBefore = await count('a', 'ready');
    await frame('a').goto(frame('a').url() + '&reload=1');
    await page.waitForFunction(before => messages.filter(m => m.id === 'a' && m.data.type === 'ready').length > before, readyBefore);
    const resumed = await page.evaluate(async () => {
      const result = await api('/attempts', { method: 'POST', body: JSON.stringify({ opId: crypto.randomUUID(), trainerId: 'motion-grade6', contentId: 'meeting' }) });
      attempts.a = result.attempt; return result.attempt;
    });
    assert.equal(resumed.id, attempt.id); assert.deepEqual(resumed.state, partial);
    await hydrate('a', resumed.state);
    assert.equal(await frame('a').locator('#answer').inputValue(), '3/');
    assert.equal(await frame('a').locator('#guided').isChecked(), true);
    assert.equal(await frame('a').locator('#modelDetails').evaluate(el => el.open), true);
    assert.equal(await frame('a').locator('#scrub').inputValue(), '250');
    assert.equal(await frame('a').locator('.step.done').count(), 1);
    assert.equal(await frame('a').locator('.taskdots .solved').count(), 2);
    for (let step = 1; step < spec.items[2].steps.length; step++) result = await answer(String(spec.items[2].steps[step].a));
    for (let index = 3; index < 12; index++) {
      await change(f => f.locator('[data-task="' + index + '"]').click());
      result = await answer(String(spec.items[index].answer));
      assert.equal(result.evaluation.complete, index === 11, 'Only twelve proven tasks complete the lesson');
    }
    assert.equal(result.attempt.outcome, 'hinted');
    assert.equal(await frame('a').locator('.taskdots .solved').count(), 12);
    assert.equal(store.getAttempt(pupil.account, attempt.id).outcome, 'hinted');
    assert.equal(store.progress(pupil.account).find(item => item.contentId === 'meeting').completed, true);

    // Historical state comes from persisted events, not the current renderer.
    const history = await teacherPage.evaluate(({ id, through }) => api('/attempts/' + id + '/history?through=' + through), { id: attempt.id, through: historyRevision });
    const historicalState = history.events.filter(event => event.payload.state).at(-1).payload.state;
    await page.evaluate(() => add('b'));
    await page.waitForFunction(() => messages.some(m => m.id === 'b' && m.data.type === 'ready'));
    await hydrate('b', historicalState, true);
    assert.equal(await frame('b').locator('.taskdots .solved').count(), 2);
    assert.equal(await frame('b').locator('#main').evaluate(el => el.inert), true);
    const before = await count('b', 'change');
    await frame('b').locator('[data-task="3"]').evaluate(el => { el.click(); el.onclick(); });
    await frame('b').locator('[data-view="learn"]').evaluate(el => el.onclick());
    await barrier('b');
    assert.equal(await count('b', 'change'), before, 'Historical read-only controls cannot mutate state');
    await hydrate('b', historicalState, true);
    for (const id of ['a', 'b']) assert.equal(await frame(id).evaluate(() => localStorage.getItem('maxim-motion-v1')), 'standalone-sentinel');
    // Presentation order changes while original local result identities stay intact.
    const publicContext = await browser.newContext({ locale: 'ru-RU', reducedMotion: 'reduce', viewport: { width: 1280, height: 1000 } });
    const legacyProgress = { '0-0': { mode: 'самостоятельно', date: '14.10.2026' }, '8-1': { mode: 'с помощью', date: '14.10.2026' } };
    await publicContext.addInitScript(value => localStorage.setItem('maxim-motion-v1', JSON.stringify(value)), legacyProgress);
    const publicPage = await publicContext.newPage(); publicPage.on('pageerror', error => errors.push(error.message));
    await publicPage.goto(origin + '/trainers/motion-grade6/index.html');
    assert.equal(await publicPage.locator('h1').innerText(), 'По течению');
    assert.deepEqual(await publicPage.locator('#menu [data-lesson]').evaluateAll(es => es.map(e => +e.dataset.lesson)), [8,9,10,11,0,1,2,3,4,5,6,7]);
    assert.match(await publicPage.locator('#menu [data-lesson="0"]').innerText(), /1 \/ 12/);
    assert.match(await publicPage.locator('#menu [data-lesson="8"]').innerText(), /1 \/ 12/);
    for (const [canonical, next] of [[11,0],[7,null]]) {
      await publicPage.locator('#menu [data-lesson="'+canonical+'"]').click();
      await publicPage.locator('[data-tab="train"]').click();
      await publicPage.locator('[data-task="11"]').click();
      await publicPage.locator('#next').click();
      const link=publicPage.locator('#work [data-lesson]');
      if(next===null) assert.equal(await link.count(),0);
      else assert.equal(await link.getAttribute('data-lesson'),String(next));
    }
    assert.deepEqual(await publicPage.evaluate(() => JSON.parse(localStorage.getItem('maxim-motion-v1'))),legacyProgress);
    await publicPage.goto(origin + '/trainers/motion-grade6/index.html#lesson=distance');
    await publicPage.reload();
    assert.equal(await publicPage.locator('h1').innerText(),'Находим путь');
    assert.match(await publicPage.locator('.eyebrow').innerText(),/05 \/ 12/);
    await publicPage.setViewportSize({width:390,height:844});
    await publicPage.goto(origin + '/trainers/motion-grade6/index.html');
    fs.mkdirSync(path.join(ROOT,'test-results'),{recursive:true});
    await publicPage.screenshot({path:path.join(ROOT,'test-results','motion-river-route-mobile.png'),fullPage:true});
    const routeOverflow=await publicPage.evaluate(() => ({width:innerWidth,scroll:document.documentElement.scrollWidth,elements:[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.right>innerWidth+1&&!el.closest('.nav-lessons');}).slice(0,10).map(el=>el.tagName+'.'+el.className)}));
    assert(routeOverflow.scroll <= routeOverflow.width+1,'Course has no horizontal viewport overflow: '+JSON.stringify(routeOverflow));
    await publicPage.goto(origin + '/trainers/motion-grade6/river-lab.html');
    assert.equal(await publicPage.locator('[data-step]:visible').count(),1);
    for(let step=2;step<=6;step++) {
      await publicPage.locator('#next-step').click();
      assert.equal(await publicPage.locator('[data-step]:visible').count(),step);
    }
    assert.match(await publicPage.locator('#speed-line').getAttribute('aria-label'), /От 9 до 12.*От 12 до 15.*равна 6/);
    await publicPage.locator('#own-speed').evaluate(el => { el.value='14'; el.dispatchEvent(new Event('input',{bubbles:true})); });
    assert.match(await publicPage.locator('#speed-line').getAttribute('aria-label'), /От 11 до 14.*От 14 до 17.*равна 6/);
    await publicPage.locator('#current-speed').evaluate(el => { el.value='2.5'; el.dispatchEvent(new Event('input',{bubbles:true})); });
    assert.match(await publicPage.locator('#speed-line').getAttribute('aria-label'), /прибавка 2,5.*равна 5/);
    await publicPage.locator('#reset-model').click();
    await publicPage.locator('#play-model').click();
    await publicPage.waitForFunction(()=>document.querySelector('#down-distance').textContent!=='0');
    await publicPage.locator('#play-model').click();
    assert.equal(await publicPage.locator('#play-model').innerText(),'Запустить');
    await publicPage.locator('#trip-time').evaluate(el => { el.value='60'; el.dispatchEvent(new Event('input',{bubbles:true})); });
    assert.equal(await publicPage.locator('#down-distance').innerText(),'15');
    assert.equal(await publicPage.locator('#up-distance').innerText(),'9');
    assert(await publicPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1),'Lab has no mobile horizontal overflow');
    await publicPage.locator('[data-step="4"]').screenshot({path:path.join(ROOT,'test-results','motion-river-number-line-mobile.png')});
    await publicPage.setViewportSize({width:1280,height:1000});
    await publicPage.locator('[data-step="4"]').scrollIntoViewIfNeeded();
    await publicPage.screenshot({path:path.join(ROOT,'test-results','motion-river-explanation-desktop.png')});
    await publicPage.locator('#gap-answer').fill('6');
    await publicPage.locator('button[value="gap"]').click();
    await publicPage.locator('#flow-answer').fill('6');
    await publicPage.locator('button[value="flow"]').click();
    assert.match(await publicPage.locator('#flow-feedback').innerText(),/две одинаковые части.*Раздели 6 на 2/);
    const taskPairs=[[15,9],[18,10],[14,10],[24,16],[13.5,8.5],[16,13],[8,5],[10.5,7.5],[19.5,14.5],[12,11]];
    for(let i=0;i<taskPairs.length;i++) {
      const [down,up]=taskPairs[i];
      if(i) await publicPage.locator('#task-nav button').nth(i).click();
      await publicPage.locator('#gap-answer').fill(String(down-up).replace('.',','));
      await publicPage.locator('button[value="gap"]').click();
      await publicPage.locator('#flow-answer').fill(i===9?'1/2':String((down-up)/2).replace('.',','));
      await publicPage.locator('button[value="flow"]').click();
    }
    await publicPage.locator('#next-task').click();
    assert.equal(await publicPage.locator('#practice-summary').isVisible(),true);
    assert.match(await publicPage.locator('#summary-text').innerText(),/Все 10 задач проверены/);
    await publicPage.reload();
    assert.equal(await publicPage.locator('[data-step]:visible').count(),6);
    assert.equal(await publicPage.locator('#task-nav .solved').count(),10);
    assert.equal(await publicPage.locator('#flow-answer').inputValue(),'1/2');
    assert.deepEqual(await publicPage.evaluate(() => JSON.parse(localStorage.getItem('maxim-motion-v1'))),legacyProgress);
    await publicContext.close();
    assert.deepEqual(errors, []);
    console.log('MOTION_GRADE6_BROWSER_OK: teacher plan12; real API + iframe hydrate/save; partial draft/prefix/model resume; all12 completion; read-only history; standalone isolation.');
  } finally {
    if (browser) await browser.close();
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); learning.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
