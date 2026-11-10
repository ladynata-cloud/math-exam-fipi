'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'trainers/oge-task8-powers-roots.html'), 'utf8');
const progressKey = 'mathExamCourseProgress.v1';
const lessonKey = 'oge-t8-stepeni';

// A synchronous arithmetic regression can block the event loop. Each complete
// journey runs in a child process, so even the original infinite loop fails
// within a fixed deadline instead of hanging the test runner.
const childScenario = process.argv.find(arg => arg.startsWith('--oge8-scenario='));
if (!childScenario) {
  const test = require('node:test');
  for (const [name, scenario] of [
    ['exact arithmetic handles zero denominators and roots beyond Number range', 'format'],
    ['quiz rejects zero denominators without consuming an attempt, then finishes', 'quiz'],
    ['marathon correct answer survives reload and cannot be counted twice', 'persistence']
  ]) {
    test(name, () => {
      const result = spawnSync(process.execPath, [__filename, '--oge8-scenario=' + scenario], {
        encoding: 'utf8', timeout: 15000, killSignal: 'SIGKILL', maxBuffer: 1024 * 1024
      });
      assert.equal(result.error, undefined, result.error && result.error.message);
      assert.equal(result.status, 0, result.stderr || result.stdout || String(result.signal));
      assert.match(result.stdout, new RegExp('OGE8_QUIZ_INPUT_' + scenario.toUpperCase() + '_OK'));
    });
  }
  test('numeric safety inverse pins the previous page and rejects altered or repeated guards', () => {
    const { restoreNumericSafety, restoreNumericLayout } = require('./oge8-numeric-safety-preservation.cjs');
    const { restoreActiveLearningIncludes } = require('./oge-active-learning-preservation.cjs');
    const crypto = require('node:crypto');
    const nativeSource = restoreActiveLearningIncludes('trainers/oge-task8-powers-roots.html', source);
    const restored = restoreNumericSafety(restoreNumericLayout(nativeSource));
    assert.equal(crypto.createHash('sha256').update(restored).digest('hex'),
      'def5a8e5d2d979bef43bd54f09354c3cb6b372be7d98d64e37017378ceb486b1');
    assert.throws(() => restoreNumericSafety(source.replace('if(f.d===0n)return "не определено";',
      'if(f.d!==0n)return "не определено";')), /exact numeric safety fragment/);
    assert.throws(() => restoreNumericSafety(source.replace('      if(x.d===0n){fb.textContent=',
      '      if(x.d!==0n){fb.textContent=')), /exact numeric safety fragment/);
    assert.throws(() => restoreNumericSafety(source.replace('while(next<r)', 'while(next<=r)')),
      /exact numeric safety fragment/);
    assert.throws(() => restoreNumericSafety(source + source), /exact numeric safety fragment/);
    assert.throws(() => restoreNumericSafety(restored), /exact numeric safety fragment/);
    assert.throws(() => restoreNumericLayout(source.replace('#sqFb{overflow-wrap:anywhere}',
      '#sqFb{overflow-wrap:normal}')), /exact numeric feedback wrapping rule/);
    assert.throws(() => restoreNumericLayout(restoreNumericLayout(source)),
      /exact numeric feedback wrapping rule/);
    assert.throws(() => restoreNumericLayout(source + '#sqFb{overflow-wrap:anywhere}\n'),
      /exact numeric feedback wrapping rule/);
  });
} else {
  run(childScenario.split('=')[1]).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}

async function boot(saved = {}) {
  const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
  const errors = [];
  class Local extends ResourceLoader {
    fetch(url) {
      const file = path.join(root, new URL(url).pathname);
      return file.startsWith(root + path.sep) && fs.existsSync(file)
        ? Promise.resolve(fs.readFileSync(file)) : null;
    }
  }
  const vc = new VirtualConsole();
  vc.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(source, {
    url: 'https://mathexam.test/trainers/oge-task8-powers-roots.html',
    runScripts: 'dangerously', resources: new Local(), virtualConsole: vc,
    pretendToBeVisual: true,
    beforeParse(w) {
      w.scrollTo = () => {};
      w.HTMLElement.prototype.scrollIntoView = () => {};
      w.__TESTHOOK__ = true;
      for (const [key, value] of Object.entries(saved)) w.localStorage.setItem(key, value);
    }
  });
  await new Promise(resolve => dom.window.addEventListener('load', resolve, { once: true }));
  await new Promise(resolve => setTimeout(resolve, 40));
  assert.equal(dom.window.document.documentElement.dataset.ogeAlgebraExperience, 'ready');
  return { dom, w: dom.window, d: dom.window.document, errors };
}

function enter(w, input, value) {
  input.value = value;
  input.dispatchEvent(new w.Event('input', { bubbles: true }));
}

async function run(scenario) {
  if (scenario === 'format') {
    const vm = require('node:vm');
    const start = source.indexOf('function gcdB(');
    const end = source.indexOf('/* ================= отрисовка математики', start);
    assert(start >= 0 && end > start);
    const context = vm.createContext({});
    vm.runInContext(source.slice(start, end), context);
    for (const input of ['1/0', '0/0', '-1/0']) {
      assert.equal(vm.runInContext('fmtFr(parseAns(' + JSON.stringify(input) + '))', context), 'не определено');
    }
    for (const [input, output] of [['64', '64'], ['1/4', '0,25'], ['-3/2', '−1,5'], ['2/3', '2/3']]) {
      assert.equal(vm.runInContext('fmtFr(parseAns(' + JSON.stringify(input) + '))', context), output);
    }
    for (const [input, output] of [[-1n, null], [0n, 0n], [1n, 1n], [2n, null], [4n, 2n], [9801n, 99n]]) {
      assert.equal(vm.runInContext('isqrtB(' + input + 'n)', context), output);
    }
    const hugeRoot = 10n ** 155n;
    const hugeSquare = hugeRoot * hugeRoot;
    assert.equal(vm.runInContext('isqrtB(' + hugeSquare + 'n)', context), hugeRoot);
    for (const nonSquare of [hugeSquare - 1n, hugeSquare + 1n]) {
      assert.equal(vm.runInContext('isqrtB(' + nonSquare + 'n)', context), null);
    }
    // Number arithmetic is exact in this deliberately small oracle range.
    for (let n = 0; n <= 10000; n++) {
      const integer = Math.floor(Math.sqrt(n));
      assert.equal(context.isqrtB(BigInt(n)), integer * integer === n ? BigInt(integer) : null);
    }
  } else if (scenario === 'quiz') {
    const { dom, w, d, errors } = await boot();
    try {
      // Capture the generated tasks without replacing or changing any task,
      // parser, grading handler or saved result. This test exercises the UI
      // lifecycle; independent answer mathematics lives in the algebra gate.
      w.eval('const originalQuizBuilder = buildQuiz8; buildQuiz8 = function(){ const tasks = originalQuizBuilder(); window.quizInputCases = tasks; return tasks; };');
      d.querySelector('button[data-v="quiz"]').click();
      d.getElementById('quizStart').click();
      assert.equal(w.quizInputCases.length, 10);
      for (let index = 0; index < 10; index++) {
        const input = d.querySelector('#qBox input.ans');
        const submit = d.querySelector('#qBox .qok');
        const next = d.querySelector('#qBox .qnx');
        const before = w.localStorage.getItem(progressKey);
        const dots = d.getElementById('qProg').innerHTML;
        for (const invalid of ['1/0', '0/0', '-1/0']) {
          enter(w, input, invalid);
          submit.click();
          assert.match(d.querySelector('#qBox .fb').textContent, /На ноль делить нельзя/);
          assert.equal(input.disabled, false, 'invalid syntax keeps answer editable');
          assert.equal(submit.disabled, false, 'invalid syntax does not consume the attempt');
          assert.equal(next.hidden, true, 'cannot advance after an undefined answer');
          assert.equal(d.getElementById('qProg').innerHTML, dots, 'question stays current');
          assert.equal(w.localStorage.getItem(progressKey), before, 'invalid answer does not enter the mistake journal');
        }
        const expected = w.eval('fmtFr(quizAns(window.quizInputCases[' + index + ']))');
        const wrong = '999999999999999999999999999999999999999999999999';
        assert.notEqual(expected, wrong);
        enter(w, input, index < 5 ? expected : wrong);
        // Exercise both supported submission paths.
        if (index % 2) input.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        else submit.click();
        assert.equal(d.querySelector('#qBox .fb').textContent, index < 5 ? 'Верно.' : 'Неверно.');
        assert(input.disabled && submit.disabled, 'valid numeric answer consumes one attempt');
        assert.equal(next.hidden, false);
        const after = w.localStorage.getItem(progressKey);
        submit.click();
        assert.equal(w.localStorage.getItem(progressKey), after, 'duplicate click cannot create another record');
        next.click();
      }
      assert.equal(d.querySelector('#view-quiz .qscore').textContent, '5 / 10');
      assert.equal(d.querySelectorAll('#view-quiz .qrow').length, 10);
      const stored = JSON.parse(w.localStorage.getItem(progressKey));
      assert.equal(stored[lessonKey].runs, 1);
      assert.equal(stored[lessonKey].best, 5);
      assert.equal(stored[lessonKey].total, 10);
      assert.equal(Object.values(stored.mistakes).reduce((sum, entry) => sum + entry.w, 0), 5);
      assert.deepEqual(stored[lessonKey].solvedByType, {}, 'quiz does not award marathon credit');
      assert.equal(stored[lessonKey].passed, undefined, 'five correct answers do not pass the quiz');
      assert.doesNotMatch(d.querySelector('#view-quiz').textContent, /NaN|Infinity|undefined/);
      d.getElementById('quizAgain').click();
      assert(d.querySelector('#qBox input.ans'), 'retry remains usable after the results');
      assert.equal(d.querySelector('#qBox input.ans').disabled, false);
      assert.deepEqual(errors, []);
    } finally { dom.window.close(); }
  } else if (scenario === 'persistence') {
    let page = await boot();
    try {
      const { w, d } = page;
      const card = d.querySelector('#marGrid > .mtask:not([hidden])');
      const input = card.querySelector('input.ans');
      assert.equal(input.getAttribute('aria-label'), 'Ответ задачи № 1.1');
      enter(w, input, '64');
      card.querySelector('button.ck').click();
      assert.match(card.querySelector('.fb').textContent, /верно/);
      assert(input.readOnly && card.querySelector('button.ck').disabled);
      const read = () => JSON.parse(w.localStorage.getItem(progressKey))[lessonKey].solvedByType.rootdeg;
      assert.equal(read(), 1);
      card.querySelector('button.ck').click();
      assert.equal(read(), 1);
      const saved = Object.fromEntries(Array.from({ length: w.localStorage.length }, (_, index) => {
        const key = w.localStorage.key(index);
        return [key, w.localStorage.getItem(key)];
      }));
      assert.deepEqual(page.errors, []);
      page.dom.window.close();
      page = await boot(saved);
      assert.equal(page.w.localStorage.getItem(progressKey), saved[progressKey]);
      assert.equal(page.w.eval('CP.readAll()["oge-t8-stepeni"].solvedByType.rootdeg'), 1);
      assert.deepEqual(page.errors, []);
    } finally { page.dom.window.close(); }
  } else {
    throw new Error('Unknown scenario: ' + scenario);
  }
  console.log('OGE8_QUIZ_INPUT_' + scenario.toUpperCase() + '_OK');
}
