'use strict';

const assert = require('node:assert/strict');
const {spawn} = require('node:child_process');
const {createRequire} = require('node:module');
const {createServer} = require('node:net');
const path = require('node:path');
const vm = require('node:vm');
const fs = require('node:fs');
const os = require('node:os');
const {randomUUID} = require('node:crypto');
const {chromium} = require('playwright');
const {setTimeout: delay} = require('node:timers/promises');
const root = path.resolve(__dirname, '..');
const express = createRequire(path.join(root, 'board-server/package.json'))('express');
const {LearningStore} = require('../board-server/learning-store');
const {hashPassword} = require('../board-server/learning-auth');
const contracts = require('../board-server/learning-contracts');
const program = require('../learning/course-program.js');
const course = require('../stereo-course/literacy/data/course.json');
const courseId = 'stereo-literacy-atanasyan';
const route = '/stereo-course/literacy/';
const trainer = '/trainers/stereo-literacy-atanasyan.html';
const section = 'theory-014-example-3a';
const angle = 'theory-022';
const first = 'atanasyan2024-theory-001';
const localKey = 'mathexam.stereoLiteracy.v1.' + section;
const listen = app => new Promise((resolve, reject) => {
  const server = app.listen(0, '127.0.0.1', () => resolve(server));
  server.once('error', reject);
});
const close = server => server && new Promise(resolve => { server.closeAllConnections?.(); server.close(resolve); });
const state = frame => frame.evaluate(() => window.stereoLiteracyApp.getState());

async function ready(host, id) {
  await host.waitForFunction(trainer => {
    const frame = document.querySelector('#trainerFrame');
    return new URL(frame?.src || location.href).pathname === trainer &&
      document.querySelector('#mirrorStatus')?.dataset.mirrorStatus === 'connected';
  }, trainer);
  const frame = await (await host.locator('#trainerFrame').elementHandle()).contentFrame();
  await frame.waitForFunction(expected => window.stereoLiteracyApp?.getState().lessonId === expected, id);
  return frame;
}

async function copyWork(controller, observer) {
  const expected = await state(controller);
  await observer.waitForFunction(value => JSON.stringify(window.stereoLiteracyApp.getState()) === JSON.stringify(value), expected);
  return expected.work;
}

async function verifyProgramAssignment() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'stereo-literacy-program-'));
  const store = new LearningStore({filePath:path.join(temp, 'learning.sqlite'), contracts});
  try {
    assert(store.available);
    const teacherToken = store.bootstrap({login:'fixture_literacy_teacher',name:'Преподаватель теста'}).invitationToken;
    const teacher = store.activate(teacherToken, await hashPassword('Synthetic-literacy-' + randomUUID())).account;
    const studentToken = store.createStudent(teacher, {login:'fixture_literacy_pupil',name:'Ученик теста'}).invitationToken;
    const student = store.activate(studentToken, await hashPassword('0372','student')).account;
    const save = (expectedVersion, courseIds) => store.saveStudentProfile(teacher,student.id,{
      opId:randomUUID(),expectedVersion,course:'school',goal:null,focus:'',
      program:{grade:10,courseIds}
    }).profile;
    const previous = save(0,['merzlyak-10-base']);
    const result = save(previous.version,[...previous.program.courseIds,courseId,'sections-from-zero']);
    assert.deepEqual(store.studentProfile(teacher,student.id).program,result.program);
    assert.deepEqual(result.program.courseIds,['merzlyak-10-base',courseId,'sections-from-zero']);
  } finally {
    store.db?.close();
    fs.rmSync(temp,{recursive:true,force:true});
  }
}

(async () => {
  assert.deepEqual(program.selected({program:{grade:10,courseIds:['merzlyak-10-base','sections-from-zero',courseId]}}).map(item => item.id),
    ['merzlyak-10-base','sections-from-zero',courseId]);
  assert.equal(program.get(courseId).publicPath, route);
  assert.equal(new URL(program.get(courseId).boardURL).searchParams.get('trainer'), trainer);
  const picker = {window:{}, location:new URL('https://mathexam.space/trainers/trainer-board.html'), URL};
  vm.runInNewContext(fs.readFileSync(path.join(root, 'trainers/board-picker.js'), 'utf8'), picker);
  assert.equal(picker.window.BoardPicker.normalize(route + '#' + angle), trainer + '#' + angle);
  assert.equal(picker.window.BoardPicker.normalize('https://example.test' + route), 'https://example.test' + route);
  await verifyProgramAssignment();

  let server, room, browser;
  try {
    const site = express();
    site.use(express.static(root));
    server = await listen(site);
    const origin = 'http://localhost:' + server.address().port;
    const reservation = await listen(createServer());
    const port = reservation.address().port;
    await close(reservation);
    const roomOrigin = 'http://127.0.0.1:' + port;
    room = spawn(process.execPath, ['index.js'], {cwd:path.join(root, 'board-server'),
      env:{PATH:process.env.PATH, HOST:'127.0.0.1', PORT:String(port), NODE_ENV:'test', CORS_ALLOWED_ORIGINS:origin}, stdio:'ignore'});
    const deadline = Date.now() + 15000;
    for (;;) {
      if (room.exitCode !== null || Date.now() > deadline) throw Error('Isolated board server failed to start');
      const response = await fetch(roomOrigin + '/health', {signal:AbortSignal.timeout(750)}).catch(() => null);
      if (response?.ok) break;
      await delay(80);
    }
    browser = await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH, headless:true, args:['--no-sandbox','--disable-dev-shm-usage']});
    const errors = [];
    async function page(width) {
      const context = await browser.newContext({viewport:{width,height:900}, serviceWorkers:'block'});
      await context.route('**/*', request => [origin,roomOrigin].includes(new URL(request.request().url()).origin) ? request.continue() : request.abort());
      await context.addInitScript(({site, key, roomServer}) => {
        if (location.origin === site) {
          localStorage.setItem('mathexam.trainerBoard.serverUrl', roomServer);
          if (!localStorage.getItem(key)) localStorage.setItem(key, 'isolated-personal-record');
        }
      }, {site:origin,key:localKey,roomServer:roomOrigin});
      const result = await context.newPage();
      result.setDefaultTimeout(20000);
      result.on('pageerror', error => errors.push(error.message));
      return result;
    }
    const personal = await page(320);
    await personal.goto(origin + route + '#' + first);
    await personal.waitForFunction(() => !!window.stereoLiteracyApp);
    for (const width of [320,1280]) {
      await personal.setViewportSize({width,height:900});
      const missed = await personal.evaluate(ids => ids.filter(id => {
        window.stereoLiteracyApp.open(id);
        const complete = selector => {
          const box = document.querySelector(selector)?.getBoundingClientRect();
          return !!box && box.top >= 0 && box.bottom <= innerHeight && box.width > 0;
        };
        return !complete('.literacy-prompt') || !complete('.literacy-model svg') ||
          !complete('.literacy-actions') || document.documentElement.scrollWidth > innerWidth + 1;
      }), course.lessons.map(lesson => lesson.id));
      assert.deepEqual(missed, [], 'First screen at width ' + width);
    }
    await personal.evaluate(id => window.stereoLiteracyApp.open(id), section);
    const link = new URL(await personal.locator('[data-literacy-board-open]').getAttribute('href'), origin);
    assert.equal(link.searchParams.get('trainer'), trainer + '#' + section);
    const teacher = await page(1280), pupil = await page(390);
    await teacher.goto(link.href);
    await teacher.locator('#openShare').click();
    await teacher.locator('#createRoom').click();
    await teacher.waitForFunction(() => document.querySelector('#studentLink')?.value.includes('role=student'));
    const invitation = await teacher.locator('#studentLink').inputValue();
    await teacher.locator('#sharePanel [data-close-panel]').click();
    await pupil.goto(invitation);
    let left = await ready(teacher, section), right = await ready(pupil, section);
    assert.equal((await state(left)).work.draft, '', 'Board never loads personal storage');
    await left.locator('[data-literacy-answer]').fill('A и B лежат в одной грани');
    await left.locator('[data-literacy-help-toggle]').click();
    await left.locator('[data-literacy-start-steps]').click();
    await left.locator('[data-literacy-explain="0"]').click();
    await left.getByRole('button', {name:'Повернуть вправо',exact:true}).click();
    const shared = await copyWork(left, right);
    assert.equal(shared.draft, 'A и B лежат в одной грани');
    assert.equal(shared.stepsShown, 1);
    await left.evaluate(id => window.stereoLiteracyApp.open(id), angle);
    await right.waitForFunction(id => window.stereoLiteracyApp.getState().lessonId === id, angle);
    await teacher.locator('#openShare').click();
    await teacher.locator('#controlToggle').click();
    await pupil.waitForFunction(() => document.body.classList.contains('control-owner'));
    await teacher.locator('#sharePanel [data-close-panel]').click();
    await right.locator('[data-literacy-answer]').fill('Оба луча выходят из одной точки ребра');
    assert.equal((await copyWork(right, left)).draft, 'Оба луча выходят из одной точки ребра');
    await pupil.reload();
    right = await ready(pupil, angle);
    assert.equal((await state(right)).work.draft, 'Оба луча выходят из одной точки ребра');
    for (const frame of [left,right]) assert.equal(await frame.evaluate(key => localStorage.getItem(key), localKey), 'isolated-personal-record');
    assert.deepEqual(errors, []);
    console.log('STEREO_LITERACY_BOARD_OK: route, 36 cards on two widths, two participants, hints, work, model, handover, reload, isolated records');
  } finally {
    await browser?.close();
    room?.kill();
    await close(server);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
