'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const ROOT = path.resolve(__dirname, '..');
const start = require('../ege-profil/start/board-session.js').logTrig;
const circleIds = ['before-circle','before-radians','m5-coordinates','m6-axis','m6-calculation','m6-identities','m6-equations'];
const circlePath = '/trainers/ege-profile-circle.html';
function picker(origin = 'https://mathexam.space') {
  const sandbox = { window: {}, location: new URL(origin + '/trainers/trainer-board.html'), URL };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'trainers/board-picker.js'), 'utf8'), sandbox);
  return sandbox.window.BoardPicker;
}
function circleLessons() {
  const world = {};
  for (const file of ['preparation','chapter4','chapter5','chapter6a','chapter6b'])
    vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'ege-profil/circle', file + '.js'), 'utf8'), world);
  return world.MordLessons;
}
test('new START aliases fill the five missing topics while preserving existing expression/equation destinations', () => {
  const {normalize} = picker();
  for (const id of start.LESSON_IDS) {
    const wrapper = ['expr-logarithms','algebra-cosine','algebra-double-angle'].includes(id) ? '/trainers/ege-profile-expressions.html' : id === 'algebra-logarithmic' ? '/trainers/ege-profile-equations.html' : start.path;
    const routes = ['#lesson/' + id, '#example/' + id];
    for (const page of ['practice','repair','pause']) for (const mode of ['guided','plan','independent']) routes.push('#' + page + '/' + id + '/' + mode);
    for (const source of ['/ege-profil/start/', '/ege-profil/start/index.html']) for (const route of routes)
      assert.equal(normalize(source + '?seed=42&note=%2B+%26' + route), wrapper + '?seed=42&note=%2B+%26' + route);
    assert.equal(normalize(start.path + '#lesson/' + id), start.path + '#lesson/' + id, 'explicit combined course stays combined');
  }
});
test('Circle aliases preserve all selected lesson, task and mode routes exactly', () => {
  const {normalize} = picker(), lessons = circleLessons().filter(lesson => circleIds.includes(lesson.id));
  assert.equal(lessons.length, 7); assert.equal(lessons.reduce((n,l) => n + l.tasks.length, 0), 56);
  for (const lesson of lessons) {
    const routes = ['#lesson/' + lesson.id, ...lesson.tasks.flatMap(task => ['guided','independent'].map(mode => '#task/' + task.id + '/' + mode))];
    for (const source of ['/ege-profil/circle/','/ege-profil/circle/index.html']) for (const route of routes) {
      assert.equal(normalize(source + '?entry=lesson&seed=123' + route), circlePath + '?entry=lesson&seed=123' + route);
      assert.equal(normalize('https://mathexam.space' + source + route), circlePath + route);
    }
  }
  for (const lesson of circleLessons().filter(lesson => !circleIds.includes(lesson.id))) {
    const source = '/ege-profil/circle/index.html#lesson/' + lesson.id;
    assert.equal(normalize(source), source, 'unselected lesson stays standalone');
    for (const task of lesson.tasks) { const url = '/ege-profil/circle/index.html#task/' + task.id + '/guided'; assert.equal(normalize(url), url); }
  }
});
test('encoded, traversing, foreign and malformed routes receive no new board privilege', () => {
  const {normalize} = picker();
  for (const [base, hash] of [['/ege-profil/start/index.html','#lesson/trig-angle'],['/ege-profil/circle/index.html','#task/prep-negative/guided']]) {
    for (const url of ['https://example.org' + base,'http://mathexam.space' + base,'https://mathexam.space:444' + base,base.replace('index','%69ndex'),base.replace('/index','/../' + base.split('/')[2] + '/index'),base.replace('/index','\\index')]) assert.equal(normalize(url + hash), url + hash);
  }
  for (const hash of ['', '#home', '#lesson/before-circle/extra', '#task/prep-negative', '#task/prep-negative/plan', '#task/prep-negative/guided/extra', '#task/%70rep-negative/guided', '#task/PREP-negative/guided', '#task/foreign/guided']) {
    const url = '/ege-profil/circle/index.html' + hash; assert.equal(normalize(url), url);
  }
  for (const url of ['javascript:alert(1)','data:text/html,x','https://name:secret@mathexam.space/ege-profil/circle/','/trainers/trainer-board.html','/ege-profil/circle/\n#lesson/before-circle']) assert.throws(() => normalize(url));
});
test('picker and authoritative registry independently declare two exact wrappers and all sixteen lesson entries', () => {
  const registry = require('../board-server/trainer-registry').loadTrainerRegistry({env:{}});
  const entries = JSON.parse(fs.readFileSync(path.join(ROOT, 'trainers/board-picker-data.json'))).entries;
  for (const [id, file, route] of [[start.id,start.path,'#course'],['ege-profile-circle',circlePath,'#home']]) {
    assert.deepEqual(registry.getByTrainerUrl(file + route), {trainerId:id,file:file.slice(1),version:'1.0.0',stateSchemaVersion:1,bridgeProtocolVersion:1,allowLegacyHtml:false});
    assert.equal(entries.filter(entry => entry.href === file + route).length, 1);
  }
  assert.equal(registry.getByTrainerUrl('/ege-profil/start/index.html#lesson/trig-angle'), null);
  assert.equal(registry.getByTrainerUrl('/ege-profil/circle/index.html#task/prep-negative/guided'), null);
  for (const [file,ids] of [[start.path,start.LESSON_IDS],[circlePath,circleIds]]) for (const id of ids)
    assert.equal(entries.filter(entry => entry.href === file + '#lesson/' + id).length, 1);
});
test('combined START wrapper loads existing canonical lesson assets, bridge and scoped session without a second iframe', () => {
  const html = fs.readFileSync(path.join(ROOT, start.path), 'utf8');
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)].map(match => match[1]);
  const source = require('./public-page-script.cjs').sourceForProfileBoard(ROOT, html);
  // This wrapper already has the reviewed 2026-11-06 board-runtime stamps.
  // Keep those exact exceptions instead of discarding every query string.
  const boardStamps = new Map([
    ['functions-tasks.js?v=20261009-calm', 'functions-tasks.js?v=20261106-log-trig'],
    ['app.js?v=20261101-trainer-repair', 'app.js?v=20261106-log-trig']
  ]);
  const canonical = require('./public-page-script.cjs').canonicalProfileLearningScripts(source, html).filter(src => !src.startsWith('../learning/')).map(src => '/ege-profil/start/' + (boardStamps.get(src) || src));
  const home = '/assets/assistant/home-link.js?v=20261110';
  assert.deepEqual(scripts.filter(src => src !== '/trainers/board-bridge.js' && src !== '/ege-profil/start/board-session.js?v=20261106-log-trig'), [...canonical, home]);
  assert.equal(scripts.at(-1), home, 'Only the exact standalone home script follows the canonical assets');
  assert.match(html, /<script defer src="\/assets\/assistant\/home-link\.js\?v=20261110"><\/script>\s*<\/body>/);
  assert.match(html, /data-profile-board="log-trig"/); assert.match(html, /href="#course"/);
  assert.doesNotMatch(html, /<iframe\b|<base\b|navigator-widget|location\.(?:replace|assign)/);
  for (const src of scripts) assert.equal(fs.statSync(path.join(ROOT, new URL(src, 'https://mathexam.space').pathname)).isFile(), true);
});
