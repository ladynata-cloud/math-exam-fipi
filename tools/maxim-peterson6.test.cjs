#!/usr/bin/env node
'use strict';

// Run from any working directory: node tools/maxim-peterson6.test.cjs
// --root is useful when checking a separately staged repository tree.
// This gate uses only Node built-ins and never writes progress or makes requests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const args = process.argv.slice(2);
assert.ok(args.length === 0 || (args.length === 2 && args[0] === '--root'),
  'Usage: node tools/maxim-peterson6.test.cjs [--root REPOSITORY]');
const root = args.length ? path.resolve(args[1]) : path.resolve(__dirname, '..');
const courseDir = path.join(root, 'trainers', 'maxim-peterson6');
const html = fs.readFileSync(path.join(courseDir, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
assert.equal(scripts.length, 1, 'Course must contain one self-contained script');
assert.ok(!/\bsrc\s*=/i.test(scripts[0][1]), 'Course script must be inline');
const source = scripts[0][2];
const context = {window: {}};
vm.runInNewContext(source, context, {filename: 'maxim-peterson6/index.html', timeout: 1500});
const C = context.window.TrainerCore;
assert.ok(C, 'The standalone test API must be available without a DOM');

const MODULE_IDS = [
  'schemes', 'time', 'meeting', 'chase', 'ratio', 'river',
  'percent-number', 'number-percent', 'percent-tasks',
  'river-units', 'river-percent', 'raft-percent', 'joint-work'
];
const PDF_FILES = [
  'Maxim_Peterson6_Novye_shpargalki.pdf',
  'Peterson6_Domashnyaya_rabota.pdf',
  'Peterson6_Procenty_340.pdf',
  'Peterson6_Shpargalki.pdf'
];
const clone = value => JSON.parse(JSON.stringify(value));
const close = (actual, expected, label) => assert.ok(
  Number.isFinite(actual) && Math.abs(actual - expected) <= 1e-10 * Math.max(1, Math.abs(expected)),
  `${label}: expected ${expected}, received ${actual}`
);
let clock = 0;
const now = () => new Date(Date.UTC(2026, 9, 27, 12) + 1000 * clock++).toISOString();
const fresh = () => C.freshProgress(now());
const start = (progress, module, exampleId, seed = 17) =>
  C.beginSession(progress, module, 'standard', {seed, exampleId}, now());
function solve(progress, module) {
  let result;
  const session = progress.sessions[module];
  const problem = C.problemFor(session);
  assert.ok(problem.steps.length > 0 && problem.steps.length <= 10);
  while (session.index < problem.steps.length) {
    const step = problem.steps[session.index];
    const answer = step.kind === 'choice' ? step.expected : C.formatNumber(step.expected);
    result = C.submitAnswer(progress, module, answer, session.index, now());
    assert.ok(['correct', 'complete'].includes(result.status),
      `${module}: expected answer rejected at step ${session.index}`);
  }
  assert.equal(result.status, 'complete');
  return result;
}
function expectedSteps(module, example, values) {
  const problem = C.textbookProblem(module, example);
  assert.equal(problem.steps.length, values.length, `${module}/${example}: step count`);
  values.forEach((value, index) => {
    const step = problem.steps[index];
    if (typeof value === 'string') assert.equal(step.expected, value);
    else close(step.expected, value, `${module}/${example} step ${index + 1}`);
  });
}
let passed = 0;
let failed = 0;
function test(name, body) {
  try {
    body();
    passed++;
    console.log(`PASS ${name}`);
  } catch (error) {
    failed++;
    console.error(`FAIL ${name}\n${error.stack}`);
  }
}

test('publication metadata and four downloadable local PDFs', () => {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)[1];
  assert.match(head, /<title>Линейка Максима[^<]*<\/title>/);
  assert.match(head, /<meta\s+name="description"\s+content="Линейка Максима:[^"]+"/);
  assert.match(head, /<link\s+rel="canonical"\s+href="https:\/\/mathexam\.space\/trainers\/maxim-peterson6\/"\s*\/?\s*>/);
  assert.ok(html.includes('<h1>Линейка Максима</h1>'));
  const links = [...html.matchAll(/<a\b([^>]*\bhref="([^"]+\.pdf)"[^>]*)>/gi)];
  assert.deepEqual(links.map(match => match[2]).sort(), PDF_FILES);
  for (const [, attributes, href] of links) {
    assert.equal(path.basename(href), href, 'PDF must resolve within the course directory');
    assert.match(attributes, /\bdownload\b/);
    const bytes = fs.readFileSync(path.join(courseDir, href));
    assert.equal(bytes.subarray(0, 5).toString('ascii'), '%PDF-');
    assert.ok(bytes.length > 1000, `${href}: empty or truncated PDF`);
  }
  assert.deepEqual(fs.readdirSync(courseDir).filter(name => name.endsWith('.pdf')).sort(), PDF_FILES);
  assert.equal((html.match(/<\/body>/g) || []).length, 1,
    'The report string must not contain a literal closing body tag');
});

test('separate local storage and no network or cabinet bridge dependencies', () => {
  assert.equal(C.storageKey, 'mathexam-maxim-peterson6-route-v1');
  assert.match(source, /localStorage\.getItem\(STORAGE_KEY\)/);
  assert.match(source, /localStorage\.setItem\(STORAGE_KEY,/);
  assert.doesNotMatch(html, /<script\b[^>]*\bsrc\s*=|<link\b[^>]*\brel=["']stylesheet["']/i);
  assert.doesNotMatch(source, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/);
  assert.doesNotMatch(source, /\.\s*(?:sendBeacon|postMessage)\s*\(|\bimport\s*\(/);
  assert.doesNotMatch(source, /serviceWorker\s*\.\s*register\s*\(/);
  assert.doesNotMatch(html, /learning-bridge|learning-contracts|course-core\.js|managed\.js|supabase/i);
});

test('13 topics and 27 selectable textbook entries have usable diagrams and sources', () => {
  assert.deepEqual(Array.from(C.modules, module => module.id), MODULE_IDS);
  const entries = Object.entries(C.samples).flatMap(([module, samples]) =>
    Array.from(samples, sample => [module, sample[0]]));
  assert.equal(entries.length, 27);
  assert.equal(new Set(entries.map(([module, sample]) => `${module}/${sample}`)).size, 27);
  for (const [module, sample] of entries) {
    const problem = C.textbookProblem(module, sample);
    assert.equal(problem.module, module);
    assert.equal(problem.exampleId, sample);
    assert.ok(problem.prompt.length > 10 && problem.source.includes('№'));
    assert.ok(C.diagram(problem.diagram).includes('<svg'));
  }
});

test('exact movement, river, joint work and added Peterson answers', () => {
  const cases = [
    ['meeting', '303', ['yes', 2.2, 175, 210]],
    ['ratio', '303', ['yes', 2.2, 175, 210]],
    ['chase', '304', [3.6, 2 / 3, 40]],
    ['ratio', '305', [4 / 3, 72, 4, 18, 54]],
    ['river-units', '223-1', [2.4, 17.2]],
    ['river-units', '223-2', [16.8, 19.5, 22.2]],
    ['river-percent', '226', [.25, 2.8, 14, 8.4, 1.2, 2, 3.2]],
    ['raft-percent', '245', [2.4, .12, 20, 22.4, 17.6, 5.5, 7, 12.5]],
    ['joint-work', '306', [3.6, 1 / 9, 5 / 18, 1 / 6, 6]],
    ['river', '300', [26.4, 18, 22, 4, 2, 20]],
    ['percent-tasks', '361-1', [400, 40000]],
    ['percent-tasks', '369-1', [.25, 25]],
    ['percent-tasks', '369-2', [70, .28, 28]],
    ['percent-tasks', '406-1', [.05, 1200, 22800]]
  ];
  for (const [module, example, values] of cases) expectedSteps(module, example, values);
});

test('all 13 small percent conversions including the mixed fraction retain exact answers', () => {
  const fromPercent = [.03, .18, .075, 2 / 17, 1.5, 5.28];
  fromPercent.forEach((value, index) => expectedSteps('percent-number', `340-1-${index}`,
    [index === 3 ? 200 / 17 : 100, value]));
  [5, 28, 90, 4.5, 12, 180, 400].forEach((value, index) =>
    expectedSteps('number-percent', `340-2-${index}`, [100, value]));
  const mixed = C.textbookProblem('percent-number', '340-1-3');
  assert.equal(mixed.steps[0].displayAnswer, '200/17');
  assert.equal(C.answerCorrect(mixed.steps[0], '200/17'), true);
  assert.equal(C.answerCorrect(mixed.steps[1], '2/17'), true);
  assert.equal(C.answerCorrect(mixed.steps[1], '200/17'), false);
});

test('26 bounded generated problems are deterministic and accept their displayed answers', () => {
  C.modules.forEach((module, index) => {
    for (const level of ['easy', 'standard']) {
      const seed = 2026 + index;
      const problem = C.generate(module.id, level, C.seededRandom(seed));
      const repeat = C.generate(module.id, level, C.seededRandom(seed));
      assert.equal(JSON.stringify(problem), JSON.stringify(repeat));
      assert.ok(problem.steps.length >= 2 && problem.steps.length <= 10);
      assert.ok(C.diagram(problem.diagram).includes('<svg'));
      for (const step of problem.steps) {
        if (step.kind === 'number') {
          assert.ok(Number.isFinite(step.expected));
          assert.equal(C.answerCorrect(step, C.formatNumber(step.expected)), true);
        } else {
          assert.equal(step.kind, 'choice');
          assert.ok(step.options.some(option => option[0] === step.expected));
        }
      }
    }
  });
});

test('decimal, ordinary and mixed fractions are parsed strictly', () => {
  for (const [raw, value] of [['0,75', .75], ['0.75', .75], ['3/4', .75],
    ['1 1/4', 1.25], ['-1 1/4', -1.25], ['2/17', 2 / 17]]) {
    close(C.parseNumber(raw), value, raw);
  }
  for (const raw of ['3/0', '2/3xyz', '1+2', '1e3', 'Infinity', 'NaN',
    '1 3/2', '12%abc', '2,5.1', '3/4/5']) assert.ok(!Number.isFinite(C.parseNumber(raw)), raw);
  assert.equal(C.parseNumber(''), null);
  assert.equal(C.parseNumber('25%', true), 25);
  assert.ok(!Number.isFinite(C.parseNumber('25%')));
});

test('a new route starts with no inherited progress', () => {
  const progress = fresh();
  const summary = C.overallStats(progress);
  assert.equal(summary.total, 13);
  assert.equal(summary.solved, 0);
  assert.equal(summary.independent, 0);
  assert.equal(summary.assisted, 0);
  assert.equal(summary.ready, 0);
  assert.equal(summary.next, 'schemes');
  assert.equal(progress.solutions.length, 0);
  assert.equal(progress.assistance.length, 0);
  for (const module of MODULE_IDS) assert.equal(C.moduleStats(progress, module).status, 'не начато');
  assert.equal(JSON.stringify(C.validateProgress(clone(progress))), JSON.stringify(progress));
});

test('stale submissions and replayed conditions never double-count a solution', () => {
  const progress = fresh();
  start(progress, 'ratio', '305');
  assert.equal(C.submitAnswer(progress, 'ratio', '4/3', 0, now()).status, 'correct');
  const before = JSON.stringify(progress);
  assert.equal(C.submitAnswer(progress, 'ratio', '999', 0, now()).status, 'ignored');
  assert.equal(JSON.stringify(progress), before);
  solve(progress, 'ratio');
  assert.equal(C.submitAnswer(progress, 'ratio', '54', 4, now()).status, 'ignored');
  start(progress, 'ratio', '305', 91);
  assert.equal(solve(progress, 'ratio').duplicate, true);
  assert.equal(C.moduleStats(progress, 'ratio').solved, 1);
  assert.equal(C.moduleStats(progress, 'ratio').independent, 1);
});

test('readiness requires both five distinct conditions and three independent solutions', () => {
  const progress = fresh();
  for (let index = 0; index < 5; index++) {
    start(progress, 'percent-number', `340-1-${index}`, index);
    if (index < 2) C.toggleSessionHint(progress, 'percent-number', now());
    solve(progress, 'percent-number');
    if (index < 4) assert.equal(C.moduleStats(progress, 'percent-number').ready, false);
  }
  const stats = C.moduleStats(progress, 'percent-number');
  assert.equal(stats.solved, 5);
  assert.equal(stats.independent, 3);
  assert.equal(stats.assisted, 2);
  assert.equal(stats.ready, true);
  assert.equal(C.overallStats(progress).ready, 1);
  const assisted = fresh();
  for (let index = 0; index < 5; index++) {
    start(assisted, 'percent-number', `340-1-${index}`, index);
    if (index < 3) C.toggleSessionHint(assisted, 'percent-number', now());
    solve(assisted, 'percent-number');
  }
  assert.equal(C.moduleStats(assisted, 'percent-number').solved, 5);
  assert.equal(C.moduleStats(assisted, 'percent-number').independent, 2);
  assert.equal(C.moduleStats(assisted, 'percent-number').ready, false);
});

test('invalid input does not count as an error and automatic hints count once per step', () => {
  const progress = fresh();
  start(progress, 'river-units', '223-1');
  assert.equal(C.submitAnswer(progress, 'river-units', '', 0, now()).status, 'empty');
  assert.equal(C.submitAnswer(progress, 'river-units', '3/0', 0, now()).status, 'invalid');
  assert.equal(progress.metrics['river-units'].errors, 0);
  for (let index = 0; index < 2; index++) {
    assert.equal(C.submitAnswer(progress, 'river-units', '0', 0, now()).status, 'wrong');
  }
  assert.equal(progress.metrics['river-units'].errors, 2);
  assert.equal(progress.metrics['river-units'].hints, 1);
  assert.equal(progress.sessions['river-units'].hintVisible[0], true);
  C.toggleSessionHint(progress, 'river-units', now());
  C.toggleSessionHint(progress, 'river-units', now());
  assert.equal(progress.metrics['river-units'].hints, 1);
  solve(progress, 'river-units');
  assert.equal(C.moduleStats(progress, 'river-units').independent, 0);
  assert.equal(C.moduleStats(progress, 'river-units').assisted, 1);
});

test('serialization restores the exact unfinished condition, draft, steps, error and hint', () => {
  const original = fresh();
  start(original, 'joint-work', '306');
  C.submitAnswer(original, 'joint-work', '3,6', 0, now());
  C.submitAnswer(original, 'joint-work', '2', 1, now());
  C.toggleSessionHint(original, 'joint-work', now());
  original.sessions['joint-work'].answers[1] = '1/9';
  const saved = JSON.stringify(original);
  const restored = C.validateProgress(JSON.parse(saved));
  assert.equal(JSON.stringify(restored), saved);
  assert.equal(C.conditionKey(C.problemFor(restored.sessions['joint-work'])),
    C.conditionKey(C.problemFor(original.sessions['joint-work'])));
  solve(restored, 'joint-work');
  assert.equal(C.moduleStats(restored, 'joint-work').solved, 1);
  assert.equal(C.moduleStats(restored, 'joint-work').assisted, 1);
  assert.equal(JSON.stringify(original), saved, 'Import must produce an independent copy');
});

test('abandoned help and errors survive switching conditions and importing a backup', () => {
  let progress = fresh();
  const first = start(progress, 'ratio', '303', 1);
  C.toggleSessionHint(progress, 'ratio', now());
  assert.equal(start(progress, 'ratio', '303', 2), first, 'Same unfinished condition must resume');
  start(progress, 'ratio', '305', 3);
  progress = C.validateProgress(clone(progress));
  start(progress, 'ratio', '303', 4);
  solve(progress, 'ratio');
  assert.equal(C.moduleStats(progress, 'ratio').independent, 0);
  assert.equal(progress.solutions[0].hints, 1);
  start(progress, 'river-units', '223-1', 5);
  C.submitAnswer(progress, 'river-units', '99', 0, now());
  start(progress, 'river-units', '223-2', 6);
  solve(progress, 'river-units');
  progress = C.validateProgress(clone(progress));
  start(progress, 'river-units', '223-1', 7);
  solve(progress, 'river-units');
  assert.equal(C.moduleStats(progress, 'river-units').independent, 1);
  assert.equal(C.moduleStats(progress, 'river-units').assisted, 1);
  start(progress, 'river-units', '223-2', 8);
  C.toggleSessionHint(progress, 'river-units', now());
  solve(progress, 'river-units');
  assert.equal(C.moduleStats(progress, 'river-units').independent, 1,
    'Help on a repeat cannot revoke a completed independent solution');
  assert.equal(C.moduleStats(progress, 'river-units').solved, 2);
  assert.doesNotThrow(() => C.validateProgress(clone(progress)));
});

test('corrupted backups are rejected without changing the active progress', () => {
  const progress = fresh();
  start(progress, 'chase', '304');
  C.toggleSessionHint(progress, 'chase', now());
  solve(progress, 'chase');
  const saved = JSON.stringify(progress);
  const corruptions = [
    ['version', data => { data.version = 99; }],
    ['negative counter', data => { data.metrics.chase.errors = -1; }],
    ['lost hint count', data => { data.metrics.chase.hints = 0; }],
    ['duplicate solution', data => { data.solutions.push(clone(data.solutions[0])); }],
    ['unknown source', data => { data.solutions[0].exampleId = 'unknown'; }],
    ['altered condition', data => { data.solutions[0].key = 'changed'; }],
    ['false completed step', data => { data.sessions.chase.answers[0] = '123'; }],
    ['invalid seed', data => { data.sessions.chase.seed = -1; }],
    ['missing assistance', data => { data.assistance = []; }],
    ['unknown field', data => { data.surprise = true; }]
  ];
  for (const [name, mutate] of corruptions) {
    const damaged = JSON.parse(saved);
    mutate(damaged);
    assert.throws(() => C.validateProgress(damaged), undefined, name);
    assert.equal(JSON.stringify(progress), saved);
  }
  assert.throws(() => C.validateProgress(JSON.parse('{"format":')));
  assert.equal(JSON.stringify(C.validateProgress(JSON.parse(saved))), saved);
});

function parseCSV(text) {
  assert.equal(text.charCodeAt(0), 0xFEFF, 'CSV must include a UTF-8 BOM for spreadsheet apps');
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let index = 1; index < text.length; index++) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') { cell += '"'; index++; }
      else quoted = !quoted;
    } else if (char === ';' && !quoted) { row.push(cell); cell = ''; }
    else if (char === '\r' && text[index + 1] === '\n' && !quoted) {
      row.push(cell); rows.push(row); row = []; cell = ''; index++;
    } else cell += char;
  }
  assert.equal(quoted, false, 'CSV quote pairs must be balanced');
  assert.equal(cell, '', 'CSV must end with CRLF');
  assert.equal(row.length, 0);
  return rows;
}

test('CSV report preserves Cyrillic, all topic totals and distinct solution history', () => {
  const progress = fresh();
  start(progress, 'percent-tasks', '406-1');
  solve(progress, 'percent-tasks');
  start(progress, 'river-units', '223-1');
  C.toggleSessionHint(progress, 'river-units', now());
  solve(progress, 'river-units');
  start(progress, 'joint-work', '306');
  C.submitAnswer(progress, 'joint-work', '0', 0, now());
  const csv = C.reportCSV(progress, now());
  assert.doesNotMatch(csv, /\uFFFD/);
  const rows = parseCSV(csv);
  assert.equal(rows.length, 29);
  assert.ok(rows[0][0].includes('Максим'));
  assert.equal(rows.find(row => row[0] === 'Разных заданий решено')[1], '2');
  assert.equal(rows.find(row => row[0] === 'Самостоятельно')[1], '1');
  assert.equal(rows.find(row => row[0] === 'С помощью')[1], '1');
  const header = rows.findIndex(row => row[0] === 'Тема');
  const topicRows = rows.slice(header + 1, header + 1 + MODULE_IDS.length);
  C.modules.forEach((module, index) => {
    const row = topicRows[index];
    const stats = C.moduleStats(progress, module.id);
    assert.equal(row.length, 9);
    assert.equal(row[0], `${index + 1}. ${module.title}`);
    assert.deepEqual(row.slice(2, 7),
      [stats.solved, stats.independent, stats.assisted, stats.errors, stats.hints].map(String));
  });
  const historyHeader = rows.findIndex(row => row[0] === 'Дата решения (UTC)');
  const history = rows.slice(historyHeader + 1);
  assert.equal(history.length, 2);
  assert.ok(history.every(row => row.length === 7 && row[0].includes('UTC')));
  assert.ok(history.some(row => row[3].includes('№ 406') && row[4] === 'Самостоятельно'));
  assert.ok(history.some(row => row[3].includes('№ 223') && row[4] === 'С помощью' && row[6] === '1'));
});

console.log(`\n${passed} passed; ${failed} failed; 27 textbook entries; 26 generated cases.`);
if (failed) process.exitCode = 1;
else console.log('MAXIM_PETERSON6_LINE_LOCAL_OK');
