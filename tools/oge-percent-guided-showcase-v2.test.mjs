import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const trainerPath = path.join(
  root,
  'trainers',
  'oge-1-5-trainers',
  'percent-table-trainer.html'
);
const html = fs.readFileSync(trainerPath, 'utf8');
const expectedHash =
  '9a79de2fc54eadfdac8db58ed617e8ba635a48d768bede6a885c791676ad2551';

function number(value) {
  return Number(
    String(value)
      .replace(/&nbsp;/g, '')
      .replace(/\s/g, '')
      .replace(',', '.')
      .replace(/[^0-9.-]/g, '')
  );
}

function close(actual, expected, message) {
  assert.ok(
    Number.isFinite(actual) &&
      Number.isFinite(expected) &&
      Math.abs(actual - expected) <= Math.max(1e-9, Math.abs(expected) * 1e-10),
    `${message}: expected ${expected}, received ${actual}`
  );
}

function localStorageStub() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}

function trainerApi() {
  const match = html.match(/<script>\s*(\(function\(\)\{[\s\S]*?)<\/script>/u);
  assert.ok(match, 'inline trainer script exists');
  const marker = '/* ---------------- События ---------------- */';
  const exposure = `
globalThis.__trainerTest = {
  standardTask,
  advancedTask,
  initialState,
  normalizeStats,
  load,
  save,
  topicSolved,
  getState: () => state,
  setState: value => { state = value; },
  SKILLS,
  MASTERY
};
return;
`;
  assert.ok(match[1].includes(marker), 'test exposure marker exists');
  const storage = localStorageStub();
  const context = {
    console,
    localStorage: storage,
    window: {},
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval
  };
  vm.runInNewContext(match[1].replace(marker, exposure + marker), context, {
    filename: trainerPath
  });
  return { api: context.__trainerTest, storage, script: match[1] };
}

function expectedStandard(task) {
  let match;
  if (task.skill === 'of') {
    match = task.question.match(
      /Найдите <b>([^<]+)%<\/b> от числа <b>([^<]+)<\/b>/
    );
    assert.ok(match);
    return (number(match[1]) * number(match[2])) / 100;
  }
  if (task.skill === 'table') {
    const total = task.question.match(/Всего потрачено <b>([^<]+) руб<\/b>/);
    const firstRow = task.question.match(
      /<tr><td>[^<]+<\/td><td>([^<]+) руб<\/td><\/tr>/
    );
    assert.ok(total && firstRow);
    return (number(firstRow[1]) / number(total[1])) * 100;
  }
  if (task.skill === 'change') {
    match = task.question.match(
      /изменилась с <b>([^<]+) руб<\/b> до <b>([^<]+) руб<\/b>/
    );
    assert.ok(match);
    return (Math.abs(number(match[2]) - number(match[1])) / number(match[1])) * 100;
  }
  if (task.skill === 'apply') {
    match = task.question.match(
      /стоил <b>([^<]+) руб<\/b> и (подорожал|подешевел) на <b>([^<]+)%<\/b>/
    );
    assert.ok(match);
    const factor = match[2] === 'подорожал' ? 1 : -1;
    return number(match[1]) * (1 + (factor * number(match[3])) / 100);
  }
  match = task.question.match(
    /После (повышения|снижения) на <b>([^<]+)%<\/b> цена стала <b>([^<]+) руб<\/b>/
  );
  assert.ok(match);
  const factor = match[1] === 'повышения' ? 1 : -1;
  return number(match[3]) / (1 + (factor * number(match[2])) / 100);
}

function expectedAdvanced(task) {
  let match;
  if (task.label === 'Дробные проценты' || task.label === 'Больше 100%') {
    match = task.question.match(
      /Найдите <b>([^<]+)%<\/b> от числа <b>([^<]+)<\/b>/
    );
    assert.ok(match);
    return (number(match[1]) * number(match[2])) / 100;
  }
  if (task.label === 'Дробная доля') {
    match = task.question.match(
      /Число <b>([^<]+)<\/b> составляет сколько процентов от числа <b>([^<]+)<\/b>/
    );
    assert.ok(match);
    return (number(match[1]) / number(match[2])) * 100;
  }
  if (task.label === 'Сравнение чисел') {
    match = task.question.match(
      /число <b>([^<]+)<\/b> (?:больше|меньше) числа <b>([^<]+)<\/b>/
    );
    assert.ok(match);
    return (Math.abs(number(match[1]) - number(match[2])) / number(match[2])) * 100;
  }
  match = task.question.match(
    /Цена была <b>([^<]+) руб<\/b>\. Сначала она (выросла|снизилась) на <b>([^<]+)%<\/b>, затем (выросла|снизилась) на <b>([^<]+)%<\/b>/
  );
  assert.ok(match);
  const first = match[2] === 'выросла' ? 1 : -1;
  const second = match[4] === 'выросла' ? 1 : -1;
  return (
    number(match[1]) *
    (1 + (first * number(match[3])) / 100) *
    (1 + (second * number(match[5])) / 100)
  );
}

test('owner file hash, canonical URL, and standalone dependencies are exact', () => {
  const digest = crypto.createHash('sha256').update(fs.readFileSync(trainerPath)).digest('hex');
  assert.equal(digest, expectedHash);
  assert.match(html, /<title>Проценты без паники · обучающий тренажёр ОГЭ<\/title>/);
  assert.match(html, /href="practice-1-5-map\.html"/);
  assert.match(html, /<script src="progress\.js"><\/script>/);
  assert.ok(
    fs.existsSync(path.join(path.dirname(trainerPath), 'progress.js')),
    'relative progress.js exists'
  );
  const externalOrigins = new Set(
    [...html.matchAll(/https?:\/\/[a-z0-9.-]+/giu)].map(match => new URL(match[0]).origin)
  );
  assert.deepEqual([...externalOrigins], ['https://stepik.org']);
  assert.doesNotMatch(html, /\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/);
  assert.doesNotMatch(html, /[A-Z]:\\|\/Users\/|\/home\//);
  assert.doesNotMatch(html, /(?:api[_-]?key|secret|password)\s*[:=]\s*["'][^"']+/i);
  assert.doesNotMatch(html, /(?:authorization\s*:\s*bearer|gh[pousr]_[a-z0-9]{20,}|eyJ[a-z0-9_-]{20,}\.)/i);
});

test('required learning, accessibility, and progress contracts are present', () => {
  for (const route of ['learn', 'practice', 'check']) {
    assert.match(html, new RegExp(`data-route="${route}"`));
  }
  assert.match(html, /const LEARN_COUNT=9;/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /:focus-visible/);
  assert.match(html, /prefers-reduced-motion:reduce/);
  assert.match(html, /percentTrainer\.v1/);
  assert.match(html, /mathExamCourseProgress\.v1/);
  assert.match(html, /percentTableTrainer/);
  assert.match(html, /state\.view==='review'&&view==='practice'/);
  assert.match(html, /if\(leavingReview\|\|options\.fresh\|\|!state\.current\)newPracticeTask\(\)/);
  assert.match(html, /ts\.wrongAttempts>=2&&ts\.hintLevel===0/);
  assert.match(html, /independent=ts\.wrongAttempts===0&&ts\.hintLevel===0/);
  assert.match(html, /type="text" inputmode="decimal"/);
});

test('inline JavaScript parses without executing browser flows', () => {
  const { script } = trainerApi();
  assert.doesNotThrow(() => new vm.Script(script));
});

test('500 generated tasks of each basic type are independently correct', () => {
  const { api } = trainerApi();
  for (const skill of api.SKILLS) {
    for (let index = 0; index < 500; index += 1) {
      const task = api.standardTask(skill);
      assert.equal(task.skill, skill);
      assert.ok(Number.isFinite(task.answer) && task.answer >= 0);
      assert.equal(task.hints.length, 3);
      assert.ok(task.steps.length >= 3);
      close(task.answer, expectedStandard(task), `${skill} task ${index}`);
    }
  }
});

test('1000 advanced tasks are independently correct and cover every family', () => {
  const { api } = trainerApi();
  const labels = new Set();
  for (let index = 0; index < 1000; index += 1) {
    const task = api.advancedTask();
    labels.add(task.label);
    assert.equal(task.skill, 'advanced');
    assert.ok(Number.isFinite(task.answer) && task.answer >= 0);
    assert.equal(task.hints.length, 3);
    assert.ok(task.steps.length >= 2);
    close(task.answer, expectedAdvanced(task), `advanced task ${index}`);
  }
  assert.deepEqual(
    [...labels].sort(),
    ['Больше 100%', 'Два изменения подряд', 'Дробная доля', 'Дробные проценты', 'Сравнение чисел'].sort()
  );
});

test('legacy numeric perType storage migrates and shared progress stays JSON-safe', () => {
  const { api, storage } = trainerApi();
  storage.setItem(
    'percentTrainer.v1',
    JSON.stringify({
      perType: { of: 2, table: 1, change: 0, apply: 3, reverse: 0 },
      lessonDone: true,
      lessonStep: 5,
      streak: 2
    })
  );
  api.setState(api.initialState());
  api.load();
  const migrated = api.getState();
  assert.equal(migrated.stats.of.independent, 2);
  assert.equal(migrated.stats.table.independent, 1);
  assert.equal(migrated.stats.apply.independent, 3);
  assert.equal(migrated.learnDone, true);
  assert.equal(migrated.learnStep, 5);
  assert.equal(migrated.independentStreak, 2);
  api.save();
  const own = JSON.parse(storage.getItem('percentTrainer.v1'));
  const shared = JSON.parse(storage.getItem('mathExamCourseProgress.v1'));
  assert.equal(own.version, 2);
  assert.deepEqual(own.perType, { of: 2, table: 1, change: 0, apply: 3, reverse: 0 });
  assert.equal(own.lessonDone, true);
  assert.equal(own.lessonStep, 5);
  assert.equal(own.streak, 2);
  assert.equal(shared.percentTableTrainer.solved, 1);
  assert.equal(shared.percentTableTrainer.total, 5);
  assert.doesNotThrow(() => JSON.stringify(own));
  assert.doesNotThrow(() => JSON.stringify(shared));
});

test('catalog-only manifest exposes quick-select without mirror capabilities', () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, 'trainers', 'board-compat.json'), 'utf8')
  );
  const entry = manifest.trainers.find(item => item.trainerId === 'percent-table-trainer');
  assert.ok(entry);
  assert.equal(entry.file, 'trainers/oge-1-5-trainers/percent-table-trainer.html');
  assert.equal(entry.boardCompatibility, 'opens-in-board');
  assert.equal(entry.supportsSeed, false);
  assert.equal(entry.supportsBoardMirror, false);
  assert.equal(entry.supportsSemanticEvents, false);
  assert.equal('stateSchemaVersion' in entry, false);
  assert.equal('bridgeProtocolVersion' in entry, false);

  const map = fs.readFileSync(
    path.join(root, 'trainers', 'oge-1-5-trainers', 'practice-1-5-map.html'),
    'utf8'
  );
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  assert.equal((map.match(/href="percent-table-trainer\.html"/g) || []).length, 1);
  assert.equal(
    (
      sitemap.match(
        /https:\/\/mathexam\.space\/trainers\/oge-1-5-trainers\/percent-table-trainer\.html/g
      ) || []
    ).length,
    1
  );
});
