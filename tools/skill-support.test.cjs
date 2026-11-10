'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {JSDOM} = require('jsdom');
const S = require('../trainers/oge-basics/skill-support');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const base = 'trainers/oge-basics/';
const sub = base + 'multiplication-division/';
const tick = () => new Promise(resolve => setImmediate(resolve));
const parse = value => JSON.parse(value);

function open(t, html, url, scripts = []) {
  const dom = new JSDOM(html, {url, runScripts:'outside-only', pretendToBeVisual:true});
  t.after(() => dom.window.close());
  const w = dom.window;
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.scrollTo = () => {};
  for (const file of scripts) w.eval(read(file));
  return {dom, w, d:w.document};
}
function click(f, link) {
  // Keep test navigation in this process, but run the real detour handler.
  link.addEventListener('click', event => event.preventDefault(), {once:true});
  link.dispatchEvent(new f.w.MouseEvent('click', {bubbles:true, cancelable:true}));
}

test('return destinations preserve a local exercise and reject external or malformed navigation', () => {
  const origin = 'https://mathexam.space';
  const source = '/trainers/long-division-stepwise.html?course=preoge&multiples=build#twoDigit';
  assert.equal(S.localPath(source, origin), source);
  for (const target of ['https://evil.test/trainers/x','//evil.test/trainers/x','javascript:alert(1)','/\\evil.test','/trainers/../../admin','/trainers/%2e%2e/%2e%2e/admin','/%2f%2fevil.test/trainers/x','/api/learning/status','/trainers/%00x','/trainers/%xx']) assert.equal(S.localPath(target, origin), null, target);
  const same = S.linksFor(origin + source, true);
  const support = new URL(same.urlFor(S.skills[0].url), origin);
  assert.equal(support.hash, '#sub-columns');
  assert.equal(support.searchParams.get('skillReturn'), source);
  const nested = S.linksFor(support.href, true);
  assert.equal(new URL(nested.urlFor(S.skills[1].url), origin).searchParams.get('skillReturn'), source, 'Another detour still returns to the original division');
  const legacy = new URL(S.linksFor(origin + source, false).urlFor(S.skills[0].url), origin);
  assert.equal(legacy.searchParams.get('skillReturnMode'), 'tab');
  assert.equal(legacy.searchParams.has('skillReturn'), false, 'Never offer a reload that loses a legacy live task');
  const offline = S.linksFor('file:///tmp/long-division-stepwise.html#twoDigit', true);
  assert.equal(offline.mode, 'tab'); assert.equal(offline.returnPath, null);
  const webHelp = new URL(offline.urlFor(S.skills[0].url));
  assert.equal(webHelp.origin, origin); assert.equal(webHelp.searchParams.get('skillReturnMode'), 'tab');
});

test('every prerequisite destination is an existing trainer, including three additional multiplication choices', () => {
  const destinations = [...S.skills, ...S.tablePractice];
  assert.equal(destinations.length, 6);
  for (const item of destinations) {
    const url = new URL(item.url, 'https://mathexam.space');
    assert(fs.existsSync(path.join(root, url.pathname)), item.url);
  }
});

test('saved subtraction returns to the exact stage, draft and assistance state', async t => {
  const href = 'https://mathexam.space/' + sub + 'arithmetic-foundations.html#sub-borrow';
  const f = open(t, read(sub + 'arithmetic-foundations.html'), href, [sub + 'arithmetic-foundations-core.js', sub + 'arithmetic-foundations.js', base + 'skill-support.js']);
  await tick();
  const input = f.d.getElementById('answer'); input.value = 'черновик'; input.dispatchEvent(new f.w.Event('input', {bubbles:true}));
  const key = 'mathExam.foundations.tab.v1.sub-borrow';
  const before = parse(f.w.sessionStorage.getItem(key));
  const link = f.d.querySelector('[data-skill="table"]'); click(f, link);
  const after = parse(f.w.sessionStorage.getItem(key));
  assert.equal(after.help, true); assert.equal(after.seed, before.seed); assert.deepEqual(after.answers, before.answers); assert.equal(after.draft, 'черновик');
  assert.equal(link.target, '');
  const returnPath = new URL(link.href).searchParams.get('skillReturn');
  assert.equal(returnPath, '/' + sub + 'arithmetic-foundations.html#sub-borrow');

  const restored = open(t, read(sub + 'arithmetic-foundations.html'), 'https://mathexam.space' + returnPath);
  restored.w.sessionStorage.setItem(key, JSON.stringify(after));
  for (const file of [sub + 'arithmetic-foundations-core.js', sub + 'arithmetic-foundations.js']) restored.w.eval(read(file));
  assert.equal(restored.d.getElementById('answer').value, 'черновик');
  assert.equal(restored.d.getElementById('question').textContent, f.d.getElementById('question').textContent);
  assert.equal(parse(restored.w.sessionStorage.getItem(key)).help, true);
});

test('unavailable source storage opens help in another tab without discarding the exercise', async t => {
  const f = open(t, '<main><h1>Мой пример</h1><section id="exercise">Черновик</section></main>', 'https://mathexam.space/' + sub + 'course-whole-simple.html');
  f.d.body.dataset.skillSupportSaved = 'true';
  f.d.addEventListener('mathexam:skill-support', event => event.preventDefault());
  f.w.eval(read(base + 'skill-support.js')); await tick();
  const link = f.d.querySelector('[data-skill="subtract"]'); click(f, link);
  assert.equal(link.target, '_blank'); assert.equal(link.rel, 'noopener');
  assert.equal(new URL(link.href).searchParams.get('skillReturnMode'), 'tab');
  assert.equal(new URL(link.href).searchParams.has('skillReturn'), false);
  assert.equal(f.d.getElementById('exercise').textContent, 'Черновик');
});

test('a public course keeps its seed, accepted steps and answer while marking prerequisite practice as assisted', async t => {
  const C = require('../trainers/oge-basics/multiplication-division/division-course-core');
  const A = require('../trainers/oge-basics/learning-contracts');
  const id = 'multiplication-division/course-whole-simple';
  const key = 'mathExamBasics.divisionCourse.v1.' + id;
  const initial = A.create(id, 23);
  initial.state.answer = 'Мой черновик';
  const f = open(t, '<body><button id="practice">Начать</button><section id="view-practice"><main id="course-local-root"></main></section></body>', 'https://mathexam.space/' + sub + 'course-whole-simple.html');
  f.d.body.dataset.courseId = id;
  f.w.DivisionCourse = C; f.w.MathExamRemediation = A;
  f.w.localStorage.setItem(key, JSON.stringify({version:1, seed:23, generatorVersion:initial.taskSpec.generatorVersion, state:initial.state, assisted:false, errors:0}));
  f.w.eval(read(sub + 'division-course-practice.js'));
  f.w.eval(read(base + 'skill-support.js')); await tick();
  const link = f.d.querySelector('[data-skill="subtract"]'); click(f, link);
  const saved = parse(f.w.localStorage.getItem(key));
  assert.equal(saved.seed, 23); assert.equal(saved.assisted, true); assert.equal(saved.errors, 0);
  assert.deepEqual(saved.state, initial.state, 'Detour does not change the solution or the active input');
  assert.equal(link.target, ''); assert.equal(new URL(link.href).searchParams.get('skillReturn'), '/' + sub + 'course-whole-simple.html');
});

test('a legacy trainer keeps its exact live problem and native accounting marks the detour as help', async t => {
  const f = open(t, read(sub + 'multiplication-mixed.html'), 'https://mathexam.space/' + sub + 'multiplication-mixed.html');
  for (const script of [...f.d.querySelectorAll('script:not([src])')]) if (script.textContent.trim()) f.w.eval(script.textContent);
  f.w.eval(read(base + 'basics-help.js'));
  f.w.eval(read(base + 'basics-standalone.js'));
  f.w.eval(read(base + 'skill-support.js'));
  await tick();
  const state = f.w.__trainerDebug.state(), task = state.current;
  const input = f.d.querySelector('#practiceAnswer input'); if (input) input.value = '17';
  const independent = state.independent;
  const link = f.d.querySelector('[data-skill="table"]'); click(f, link);
  assert.equal(f.w.__trainerDebug.state().current, task, 'No task regeneration');
  assert.equal(f.w.__trainerDebug.state().help > 0, true);
  assert.equal(f.w.__trainerDebug.state().independent, independent, 'Navigation itself never earns success');
  if (input) assert.equal(input.value, '17');
  assert.equal(link.target, '_blank');
  assert.match(f.d.querySelector('.skill-support-note').textContent, /новой вкладке/);
});

test('support destinations show a real local return link and never render an unsafe destination', async t => {
  const origin = 'https://mathexam.space';
  const original = '/trainers/long-division-stepwise.html?multiples=build#twoDigit';
  const f = open(t, '<main><h1>Таблица</h1></main>', origin + '/' + sub + 'multiplication-mixed.html?skillReturn=' + encodeURIComponent(original), [base + 'skill-support.js']);
  await tick();
  assert.equal(f.d.querySelector('[data-skill-return] a').getAttribute('href'), original);
  const unsafe = open(t, '<main></main>', origin + '/' + sub + 'multiplication-mixed.html?skillReturn=' + encodeURIComponent('//evil.test'), [base + 'skill-support.js']);
  await tick(); assert.equal(unsafe.d.querySelector('[data-skill-return]'), null);
});

test('the helper does not touch an authenticated managed trainer or its progress', async t => {
  const f = open(t, '<main id="learning-remediation-root">Managed</main>', 'https://mathexam.space/' + sub + 'course-whole-simple.html?learning=1', [base + 'skill-support.js']);
  await tick(); assert.equal(f.d.querySelector('[data-skill-support]'), null); assert.equal(f.w.localStorage.length, 0); assert.equal(f.w.sessionStorage.length, 0);
});
