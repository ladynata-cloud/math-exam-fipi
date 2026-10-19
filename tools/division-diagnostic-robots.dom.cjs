'use strict';
// Scripted learner scenarios, not evidence about real pupils or learning gains.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM, VirtualConsole} = require('jsdom');
const root = path.resolve(__dirname, '..');
const directory = 'trainers/oge-basics/multiplication-division/';
const C = require('../' + directory + 'division-diagnostic-core.js');
const N = require('../learning/division-course-map.js');
const KEY = 'mathExam.divisionDiagnostic.tab.v1';
const cabinetOrigin = 'https://mathexam-board-ladynata.msk1.amvera.tech';
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));
// Expectations are deliberately independent of the diagnostic's report function.
const destinations = {
  facts: directory + 'multiplication-ladder.html',
  addition: directory + 'arithmetic-foundations.html#add-carry',
  subtract: directory + 'arithmetic-foundations.html#sub-borrow',
  first: directory + 'course-first-part.html',
  choice: directory + 'course-digit-choice.html',
  multiplyTwo: directory + 'course-multiply-two-digit.html',
  bring: directory + 'course-bring-digit.html',
  zero: directory + 'course-zeros.html',
  ready: directory + 'course-simple-check.html'
};
const titles = {
  first: 'С каких цифр начать', facts: 'Таблица умножения', choice: 'Подбор цифры частного',
  multiplyTwo: 'Умножение на двузначное число', subtract: 'Вычитание с переходом через разряд',
  bring: 'Число после сноса цифры', zero: 'Ноль внутри частного', addition: 'Сложение частей и перенос десятка'
};
const profiles = [
  {name: 'all-correct', label: 'Все проверенные действия получаются', errors: [], first: 'ready', focus: []},
  ...['facts', 'addition', 'subtract', 'first', 'choice', 'multiplyTwo', 'bring', 'zero'].map(skill =>
    ({name: 'difficulty-' + skill, label: 'Повторяющиеся ошибки: ' + titles[skill], errors: [skill], first: skill, focus: [skill]})),
  {name: 'occasional-slip', label: 'Одна ошибка в таблице, уточнение верно', errors: [], occasional: true, first: 'facts', focus: [], uncertain: ['facts']},
  {name: 'mixed-basics', label: 'Таблица, сложение, вычитание и снос требуют повторения', errors: ['facts', 'addition', 'subtract', 'bring'], first: 'facts', focus: ['facts', 'addition', 'subtract', 'bring'], next: ['addition', 'subtract']},
  {name: 'stops-early', label: 'Два ответа, затем промежуточный результат', errors: [], stopAfter: 2, focus: [], untested: 6}
];

function openLocalPage(file, url = 'https://mathexam.space/' + file) {
  const errors = [], virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(read(file.split(/[?#]/)[0]), {url, runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole});
  const w = dom.window;
  w.fetch = async () => {throw Error('Network requests are disabled in synthetic DOM scenarios');};
  w.XMLHttpRequest = class {constructor() {throw Error('Network requests are disabled in synthetic DOM scenarios');}};
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  return {dom, w, document: w.document, errors};
}
function evaluatePage(fixture) {
  for (const script of fixture.document.querySelectorAll('script')) {
    if (script.type && !['text/javascript', 'application/javascript'].includes(script.type)) continue;
    if (script.src) {
      const url = new URL(script.src);
      assert.equal(url.origin, 'https://mathexam.space', 'Every test dependency is read from this checkout');
      const file = decodeURIComponent(url.pathname).slice(1);
      assert(!file.split('/').includes('..'));
      fixture.w.eval(read(file));
    } else if (script.textContent.trim()) fixture.w.eval(script.textContent);
  }
}
function click(fixture, selector) {
  const element = fixture.document.querySelector(selector);
  assert(element, 'Missing action ' + selector); assert(!element.disabled, 'Disabled action ' + selector);
  element.click();
}
function input(fixture, selector, value) {
  const element = fixture.document.querySelector(selector); assert(element, selector);
  element.value = String(value);
  element.dispatchEvent(new fixture.w.Event('input', {bubbles: true}));
}
function submit(fixture, selector) {
  fixture.document.querySelector(selector).dispatchEvent(new fixture.w.Event('submit', {bubbles: true, cancelable: true}));
}
async function cabinetFixture() {
  const f = openLocalPage('learning/index.html', cabinetOrigin + '/learning/#division-course');
  const mutations = [], reads = [];
  const rows = [
    {trainerId: 'oge-basics', contentId: N.tracks[0].stages[0].id, completed: true, latest: {id: 'synthetic-saved-product', outcome: 'independent'}},
    {trainerId: 'oge-basics', contentId: N.tracks[1].stages[0].id, completed: false, latest: {id: 'synthetic-open-division', outcome: 'started'}}
  ];
  const originalRows = JSON.stringify(rows);
  for (const row of rows) {Object.freeze(row.latest); Object.freeze(row);} Object.freeze(rows);
  f.w.eval(read('learning/division-course-map.js'));
  f.w.eval(read('learning/division-course.js'));
  const host = f.document.createElement('main'); f.document.body.replaceChildren(host);
  const dispose = f.w.LearningDivisionCourse.mount(host, {
    account: {id: 'synthetic-diagnostic-pupil', role: 'student'},
    api: async url => {reads.push(url); assert.equal(url, '/progress'); return {progress: rows};},
    openContent: async (...args) => {mutations.push(args);}
  });
  await flush();
  const before = host.innerHTML;
  const link = host.querySelector('[data-division-diagnostic] a'); assert(link);
  assert.equal(link.href, 'https://mathexam.space/' + directory + 'division-diagnostic.html?from=cabinet');
  assert.equal(link.target, '_blank'); assert(link.rel.includes('noopener'));
  // Capture the real anchor click without asking jsdom to launch a browser.
  let navigation; link.addEventListener('click', event => {event.preventDefault(); navigation = link.href;}); link.click();
  return {...f, navigation, verify() {
    assert.equal(JSON.stringify(rows), originalRows, 'Diagnostic must not edit existing server progress');
    assert.deepEqual(reads, ['/progress']); assert.deepEqual(mutations, []);
    assert.equal(host.innerHTML, before, 'Synthetic saved cabinet work and its counters remain intact');
    assert.deepEqual([...host.querySelectorAll('.division-course-track-heading progress')].map(p => [p.value,p.max]), [[1,16],[0,15]]);
  }, close() {dispose(); f.dom.window.close();}};
}
function arithmeticRuntimeShims(fixture) {
  // jsdom has no canvas/media rendering. Only these platform APIs are stubbed;
  // the real topic, step checker, help and persistence handlers still execute.
  fixture.w.matchMedia = () => ({matches: true, addEventListener() {}, removeEventListener() {}});
  fixture.w.HTMLMediaElement.prototype.pause = () => {};
  fixture.w.HTMLMediaElement.prototype.load = () => {};
  let drawCalls = 0;
  fixture.w.HTMLCanvasElement.prototype.getContext = function() {
    return new Proxy({canvas: this, measureText: text => ({width: String(text).length * 15})}, {
      get(target, property) {return property in target ? target[property] : () => {drawCalls++;};}
    });
  };
  return () => drawCalls;
}
async function recommendationSmoke(relativeURL) {
  const f = openLocalPage(relativeURL), sentinel = 'synthetic unrelated course progress';
  f.w.localStorage.setItem('unrelated-saved-course', sentinel);
  const canvasCalls = relativeURL.startsWith('soviet-math/') ? arithmeticRuntimeShims(f) : null;
  f.w.Math.random = () => 0.25;
  evaluatePage(f); await flush();
  let kind, action;
  if (relativeURL.includes('arithmetic-foundations.html')) {
    kind='foundations-runtime';const id=new URL(f.w.location.href).hash.slice(1),task=f.w.ArithmeticFoundations.make(id,1);
    input(f,'#answer','999999');submit(f,'#answer-form');assert(f.document.querySelector('.feedback.error'));
    click(f,'#hint');input(f,'#answer',task.steps[0].answer);submit(f,'#answer-form');
    const saved=JSON.parse(f.w.sessionStorage.getItem('mathExam.foundations.tab.v1.'+id));
    assert.equal(saved.answers.length,1);assert.equal(saved.errors,1);assert.equal(saved.help,true);
    action='wrong answer → hint → correct step';
  } else if (f.document.body.dataset.courseId) {
    kind = 'existing-course-runtime';
    const id = f.document.body.dataset.courseId;
    const task = f.w.MathExamRemediation.create(id, 1).taskSpec;
    assert(task.steps.length); click(f, '#practice');
    assert.equal(f.document.querySelector('#view-practice').hidden, false);
    input(f, '#lm-answer', '99999999'); click(f, '#lm-check');
    assert(f.document.querySelector('.lm-feedback.incorrect'));
    click(f, '#lm-hint'); input(f, '#lm-answer', task.steps[0].answer); click(f, '#lm-check');
    const saved = JSON.parse(f.w.localStorage.getItem('mathExamBasics.divisionCourse.v1.' + id));
    assert.equal(saved.state.step, 1); assert.equal(saved.errors, 1); assert.equal(saved.assisted, true);
    action = 'start → wrong answer → help → correct first step';
  } else if (relativeURL.endsWith('multiplication-ladder.html')) {
    kind = 'existing-table-runtime'; click(f, '[data-route="practice"]');
    assert.equal(f.document.querySelector('#view-practice').hidden, false);
    const products = [...f.document.querySelector('#practicePrompt').textContent.matchAll(/(\d+)\s*[·×]\s*(\d+)/g)];
    assert(products.length); const expression = products.at(-1), answer = Number(expression[1]) * Number(expression[2]);
    input(f, '#practiceAnswer input', '999'); click(f, '#checkTask'); assert(f.document.querySelector('#practiceFeedback.bad'));
    click(f, '#hint1'); input(f, '#practiceAnswer input', answer); click(f, '#checkTask');
    assert(f.document.querySelector('#practiceFeedback.good')); assert.equal(f.document.querySelector('#nextTask').hidden, false);
    const saved = JSON.parse(f.w.localStorage.getItem('mathExamBasics.multiplication-ladder.v1'));
    assert.equal(saved.supported, 1); assert.equal(saved.independent, 0);
    action = 'practice → wrong answer → help → correct product';
  } else if (relativeURL === 'soviet-math/index.html#column-add') {
    kind = 'existing-addition-runtime';
    assert.equal(f.document.querySelector('#lesson-title').textContent, 'Сложение столбиком');
    click(f, '#mode-practice'); const task = f.w.__soviet.plan(); assert(task.steps.length);
    input(f, '#answer', '999'); submit(f, '#answer-form'); assert(f.document.querySelector('#feedback.error'));
    click(f, '#hint'); input(f, '#answer', task.steps[0].answer); submit(f, '#answer-form');
    const saved = f.w.__soviet.state().sessions['column-add:practice'];
    assert.equal(saved.accepted, true); assert.equal(saved.errors, 1); assert.equal(saved.help, 1); assert(canvasCalls() > 0);
    action = 'practice → wrong answer → help → correct addition step';
  } else assert.fail('No recommendation smoke implementation for ' + relativeURL);
  assert.equal(f.w.localStorage.getItem('unrelated-saved-course'), sentinel);
  assert.deepEqual(f.errors, [], 'Recommendation must execute without runtime errors');
  f.dom.window.close(); return {url: '/' + relativeURL, kind, action, canvasRenderingTested: false};
}

async function run(profile, variant) {
  const cabinet = await cabinetFixture();
  const f = openLocalPage(directory + 'division-diagnostic.html', cabinet.navigation);
  const legacy = '{"unchanged":"existing public work"}';
  f.w.localStorage.setItem('mathExamBasics.divisionCourse.v1.old-work', legacy);
  f.w.sessionStorage.setItem(KEY, JSON.stringify({version:1,variant,screen:'intro',records:[],accepted:false,draft:'',selection:0}));
  evaluatePage(f); click(f, '[data-do="start"]');
  const model = C.build(variant); const queue = [...model.questions];
  let wrong = 0, occasionalDone = false;
  for (let index = 0; index < queue.length; index++) {
    const q = queue[index];
    assert.equal(f.document.querySelector('#question-title').textContent, q.prompt);
    const mistake = profile.errors.includes(q.skill) || (profile.occasional && !occasionalDone && q.skill === 'facts' && q.phase === 'main');
    if (mistake && profile.occasional) occasionalDone = true;
    const value = mistake ? q.kind === 'selection' ? (q.answer === '3' ? '1' : '3') : '999' : q.answer;
    if (q.kind === 'selection') for (let n = 0; n < Number(value); n++) click(f, '[data-do="more"]');
    else input(f, '#answer', value);
    submit(f, '#answer-form');
    const state = JSON.parse(f.w.sessionStorage.getItem(KEY));
    assert.equal(state.records.length, index + 1); assert.equal(state.records.at(-1).correct, !mistake);
    if (mistake) wrong++;
    if (profile.stopAfter === index + 1) {click(f, '[data-do="finish"]'); break;}
    click(f, '[data-do="next"]');
    if (index === model.questions.length - 1) {
      const failedSkills = new Set(state.records.filter(record => !record.correct).map(record => record.skill));
      for (const skill of C.SKILL_ORDER) if (failedSkills.has(skill)) queue.push(C.confirmation(skill, variant));
    }
  }
  const reportState = JSON.parse(f.w.sessionStorage.getItem(KEY)); assert.equal(reportState.screen, 'report');
  const statusFor = skill => [...f.document.querySelectorAll('.result-list li')].find(li => li.querySelector('h3').textContent === titles[skill]).querySelector('.status').classList;
  for (const skill of Object.keys(titles)) {
    if (profile.focus.includes(skill)) assert(statusFor(skill).contains('focus'), profile.name + ': ' + skill + ' needs targeted practice');
    else if (profile.uncertain?.includes(skill)) assert(statusFor(skill).contains('uncertain'), profile.name + ': isolated error must remain uncertain');
    else if (!profile.stopAfter) assert(statusFor(skill).contains('observed'), profile.name + ': no invented deficit in ' + skill);
  }
  const expectedDestination = skill => {const u=new URL(destinations[skill],'https://mathexam.space/');if(u.pathname.endsWith('/arithmetic-foundations.html')){u.searchParams.set('diagnosticVariant',variant);u.searchParams.set('from','cabinet');}return u.href;};
  let recommendation = null;
  if (profile.stopAfter) {
    assert.equal(f.document.querySelectorAll('.status.untested').length, profile.untested);
    assert.equal(f.document.querySelector('.start-here a'), null, 'Insufficient evidence must not invent a first training topic');
    assert.match(f.document.querySelector('#diagnostic').textContent, /промежуточный результат/);
    click(f, '[data-do="resume"]'); assert.equal(f.document.querySelector('#question-title').textContent, model.questions[profile.stopAfter].prompt);
  } else {
    const link = f.document.querySelector('.start-here a'); assert(link);
    assert.equal(link.href, expectedDestination(profile.first));
    if (profile.next) assert.deepEqual([...f.document.querySelectorAll('.recommendation a')].map(a => a.href), profile.next.map(skill => expectedDestination(skill)));
    let opened; link.addEventListener('click', event => {event.preventDefault(); opened = link.href;}); link.click();
    recommendation = await recommendationSmoke(opened.replace('https://mathexam.space/', ''));
  }
  assert.equal(f.w.localStorage.getItem('mathExamBasics.divisionCourse.v1.old-work'), legacy);
  assert.equal(f.w.localStorage.length, 1, 'Diagnostic must not write any public course progress');
  assert.deepEqual(f.errors, []); cabinet.verify(); cabinet.close(); f.dom.window.close();
  return {profile: profile.name, label: profile.label, variant, answered: reportState.records.length, wrong,
    expectedFirst: profile.first || null, expectedFocus: profile.focus, expectedUncertain: profile.uncertain || [],
    partial: !!profile.stopAfter, recommendation, cabinetProgressPreserved: true, result: 'pass'};
}

(async () => {
  const results = [];
  for (const [index, profile] of profiles.entries()) results.push(await run(profile, index % 2));
  const report = {gate: 'DIVISION_DIAGNOSTIC_ROBOTS_DOM_OK', profiles: results.length, passed: results.length,
    scope: 'Synthetic DOM interactions using checkout scripts. No real pupil account, server writes, browser rendering or educational effectiveness measurement.',
    results};
  const output = process.argv.find(argument => argument.startsWith('--output='))?.slice(9)
    || (process.argv.includes('--output') ? process.argv[process.argv.indexOf('--output') + 1] : null);
  if (output) {fs.mkdirSync(path.dirname(path.resolve(output)), {recursive: true}); fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');}
  console.log(JSON.stringify(output ? {gate: report.gate, profiles: report.profiles, passed: report.passed, output} : report));
})().catch(error => {console.error(error); process.exitCode = 1;});
