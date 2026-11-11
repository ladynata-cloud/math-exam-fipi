'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const course = require(path.resolve(process.env.LITERACY_BUNDLE || path.join(root, 'stereo-course/literacy/data/course.json')));
const runtime = fs.readFileSync(path.join(root, 'stereo-course/literacy/app.js'), 'utf8');
const tetrahedron = 'ex-main-0167';
const section = 'theory-014-example-3a';
const angle = 'theory-022';
const key = id => 'mathexam.stereoLiteracy.v1.' + id;

function open(bundle, { board = false, hash = '', stored = {} } = {}) {
  const pathname = board ? '/trainers/stereo-literacy-atanasyan.html' : '/stereo-course/literacy/';
  const dom = new JSDOM('<main id="test-host"></main>', {
    url: 'https://example.test' + pathname + hash,
    runScripts: 'outside-only', pretendToBeVisual: true
  });
  const win = dom.window, doc = win.document, viewers = [], snapshots = [];
  let bridge, cleanup;
  win.TextEncoder = TextEncoder;
  win.TaskSceneViewer = {
    mount(target, _model, options) {
      const drawing = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
      drawing.dataset.drawing = '';
      target.append(drawing);
      const viewer = {
        options, drawing,
        setView(view) { drawing.dataset.view = view; },
        destroy() { drawing.remove(); },
        rotate(camera) { options.onChange(win.JSON.parse(JSON.stringify(camera))); }
      };
      viewers.push(viewer);
      return viewer;
    }
  };
  win.MathExamBoard = {
    register(config) {
      bridge = config;
      cleanup = config.subscribe(() => snapshots.push(JSON.parse(JSON.stringify(config.getState()))));
      return { destroy: cleanup };
    }
  };
  for (const [name, value] of Object.entries(stored)) win.localStorage.setItem(name, value);
  win.eval(runtime);
  const app = win.StereoLiteracy.create(doc.getElementById('test-host'), win.JSON.parse(JSON.stringify(bundle)), { board });
  return {
    win, doc, app, viewers, snapshots, get bridge() { return bridge; },
    accept: win.StereoLiteracy.accept,
    clone(value) { return win.JSON.parse(JSON.stringify(value)); },
    destroy() { app.destroy(); win.close(); }
  };
}

function click(env, selector) {
  const element = env.doc.querySelector(selector);
  assert(element, selector);
  element.click();
}

function type(env, text) {
  const field = env.doc.querySelector('[data-literacy-answer]');
  field.value = text;
  field.dispatchEvent(new env.win.Event('input', { bubbles: true }));
}

function submit(env) {
  env.doc.querySelector('.literacy-form').dispatchEvent(new env.win.Event('submit', { bubbles: true, cancelable: true }));
}

(async function test() {
  const publicApp = open(course);
  assert.equal(publicApp.doc.querySelectorAll('[data-literacy-lesson]').length, course.lessons.length);
  assert.equal(publicApp.bridge, undefined);
  click(publicApp, '[data-literacy-lesson="' + tetrahedron + '"]');
  const target = publicApp.doc.querySelector('[data-literacy-board-open]').href;
  assert.equal(new URL(target).searchParams.get('trainer'), '/trainers/stereo-literacy-atanasyan.html#' + tetrahedron);
  assert(publicApp.doc.querySelector('.literacy-model svg'));
  assert(!publicApp.doc.querySelector('[data-literacy-step]'));
  type(publicApp, 'Моё доказательство');
  submit(publicApp);
  assert.match(publicApp.doc.querySelector('[data-literacy-feedback]').textContent, /преподавател/);
  assert.equal(publicApp.app.getState().work.outcome, 'manual');
  click(publicApp, '[data-literacy-start-steps]');
  click(publicApp, '[data-literacy-explain="0"]');
  click(publicApp, '[data-literacy-next-step]');
  assert.equal(publicApp.doc.querySelectorAll('[data-literacy-step]').length, 2);
  assert.equal(publicApp.doc.querySelector('[data-literacy-answer]').value, 'Моё доказательство');
  const publicWork = publicApp.win.localStorage.getItem(key(tetrahedron));
  const resume = open(course, { hash: '#' + tetrahedron, stored: { [key(tetrahedron)]: publicWork } });
  assert.equal(resume.doc.querySelector('[data-literacy-answer]').value, 'Моё доказательство');
  assert.equal(resume.app.getState().work.stepsShown, 2);
  assert.equal(resume.app.applyState(resume.clone({ version: 1, lessonId: null, work: null })), false);
  resume.destroy();

  const teacher = open(course, { board: true, hash: '#' + tetrahedron, stored: { [key(tetrahedron)]: publicWork } });
  const student = open(course, { board: true });
  assert.equal(teacher.bridge.id, 'stereo-literacy-atanasyan');
  assert.equal(teacher.bridge.version, '1.0.0');
  assert.equal(teacher.bridge.stateSchemaVersion, 1);
  assert.equal(teacher.bridge.parentOrigin, 'https://example.test');
  assert.equal(teacher.doc.querySelector('[data-literacy-answer]').value, '', 'Personal record must not leak into the shared room');
  assert.equal(teacher.doc.querySelector('[data-literacy-board-open]'), null);
  teacher.app.open(section);
  click(teacher, '[data-literacy-start-steps]');
  click(teacher, '[data-literacy-explain="0"]');
  click(teacher, '[data-literacy-help-toggle]');
  click(teacher, '[data-literacy-hint="0"]');
  teacher.viewers.at(-1).rotate({ yaw: .7, pitch: -.3 });
  type(teacher, 'M ∈ (ABC), a < b. <i>буквально</i>');
  await new Promise(resolve => setTimeout(resolve, 110));
  const shared = teacher.snapshots.at(-1);
  assert.equal(shared.lessonId, section);
  assert.equal(shared.work.stepsShown, 1);
  assert.deepEqual(shared.work.explanations, [0]);
  assert.deepEqual(shared.work.hints, [0]);
  assert.doesNotMatch(shared.work.draft, /<\/?i>/i, 'Bridge stores literal angle brackets through the canonical text envelope');
  student.bridge.applyState(student.clone(shared));
  assert.equal(student.win.location.hash, '#' + section);
  assert.equal(student.doc.querySelector('[data-literacy-answer]').value, 'M ∈ (ABC), a < b. <i>буквально</i>');
  assert.equal(student.doc.querySelectorAll('[data-literacy-step]').length, 1);
  assert(student.doc.querySelector('[data-literacy-hint-open="0"]'));
  assert.deepEqual(JSON.parse(JSON.stringify(student.viewers.at(-1).options.savedCamera)), { yaw: .7, pitch: -.3 });
  assert.equal(student.win.localStorage.length, 0);
  assert.equal(teacher.win.localStorage.getItem(key(tetrahedron)), publicWork);
  assert.equal(teacher.win.localStorage.getItem(key(section)), null);
  assert.equal(student.snapshots.length, 0, 'Remote state is not echoed');

  const field = student.doc.querySelector('[data-literacy-answer]');
  const sameCard = student.clone(shared);
  sameCard.work.draft = 'Другая запись';
  student.bridge.applyState(sameCard);
  assert.equal(student.doc.querySelector('[data-literacy-answer]'), field, 'Remote drafting retains the mounted form');
  assert.equal(field.value, 'Другая запись');
  for (const mutate of [
    bad => { bad.lessonId = 'other-course'; }, bad => { bad.work.stepsShown = 9000; },
    bad => { bad.work.hints = [0, 0]; }, bad => { bad.work.camera = { yaw: 99, pitch: 0 }; },
    bad => { bad.work.assisted = false; }, bad => { bad.work.draft = '<b>noncanonical</b>'; },
    bad => { bad.work.draft = 'a'.repeat(1201); }, bad => { bad.extra = 'other'; }
  ]) {
    const bad = student.clone(shared);
    mutate(bad);
    assert.equal(student.app.validateState(bad), false);
    assert.throws(() => student.bridge.applyState(bad), /проверку/);
    assert.equal(student.doc.querySelector('[data-literacy-answer]').value, 'Другая запись');
  }
  for (const stage of course.stages) {
    for (const id of stage.lessonIds) {
      assert(teacher.app.open(id));
      student.bridge.applyState(student.clone(teacher.bridge.getState()));
      assert.equal(student.app.getState().lessonId, id);
      assert(student.doc.querySelector('.literacy-model svg'));
    }
  }
  teacher.app.open(angle);
  student.bridge.applyState(student.clone(teacher.bridge.getState()));
  assert.match(student.doc.querySelector('h1').textContent, /линейный угол/);
  assert.equal(student.doc.querySelector('[data-literacy-step]'), null);
  teacher.destroy();
  student.destroy();
  publicApp.destroy();

  const checking = open(course, { hash: '#ex-main-0018-a' });
  type(checking, '7 см');
  submit(checking);
  assert.equal(checking.app.getState().work.feedback, 'other-question');
  assert.match(checking.doc.querySelector('[data-literacy-feedback]').textContent, /CC₁/);
  assert.doesNotMatch(checking.doc.querySelector('[data-literacy-feedback]').textContent, /3[,.]5/);
  type(checking, '14/4');
  submit(checking);
  assert.equal(checking.app.getState().work.outcome, 'corrected');
  assert.equal(checking.app.getState().work.firstAnswer, '7 см');
  assert(checking.accept('1/2 см', ['0,5 см']));
  assert(!checking.accept('1/0', ['0']));
  assert(!checking.accept('45 см', ['45°']));
  assert(!checking.accept('45,000000001', ['45']));
  checking.destroy();
  console.log('STEREO_LITERACY_RUNTIME_OK: exact feedback, public draft recovery, native board protocol, invalid state, all ' + course.lessons.length + ' card routes');
})().catch(error => { console.error(error); process.exitCode = 1; });
