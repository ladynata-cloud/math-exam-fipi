'use strict';
/*
 * Independent OGE content gate, scoped to the 28 companion maps.
 *
 * Provenance: native IDs below are extracted from the existing trainer declarations,
 * generated selector HTML, or Task19Data, never from the companion inventory.
 * Exact answer witnesses are checked by oge-skills-oracle.cjs, independently of
 * the UI grader; changing only an answer must fail the witness.
 * Source preservation removes exactly the two documented additions and compares
 * the remaining bytes with the task's immutable foundation base.
 *
 * Limits: these checks do not grade pupils' prose or establish learning efficacy.
 * Semantic theorem/prompt review and real-browser interaction are separate gates.
 * Native inventory extractors deliberately fail on structural source changes so
 * that a changed native selector must be reviewed instead of silently ignored.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const {JSDOM} = require('jsdom');

const root = path.resolve(__dirname, '..');
const EXPECTED_BASE = '74e5d9ef921919c6bfb24712bc5284f9ffd5c5db';
const C = require('../foundations/route-core.js');
const V = require('../foundations/route-visuals.js');
const O = require('./oge-skills-oracle.cjs');
const foundationCatalog = require('../foundations/route-catalog.js');
const foundationLinks = require('../oge/skills/foundation-links.js');
const practical = require('../oge/skills/maps-practical.js');
const algebra = require('../oge/skills/maps-algebra.js');
const geometry = require('../oge/skills/maps-geometry.js');
const maps = [...practical, ...algebra, ...geometry];
const byId = Object.fromEntries(maps.map(map => [map.id, map]));
const questions = maps.flatMap(map => map.questions);
const lessons = [
  ...require('../trainers/oge-video-graphs.js'),
  ...require('../trainers/oge-video-geometry.js')
];
const task19 = require('../trainers/task19-visual-data.js');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'oge/skills/source-entrances.json'), 'utf8'));
const cache = new Map();
function read(relative) {
  if (!cache.has(relative)) cache.set(relative, fs.readFileSync(path.join(root, relative), 'utf8'));
  return cache.get(relative);
}
function sameSet(actual, expected, label) {
  const a = actual.map(String), b = expected.map(String);
  assert.equal(new Set(a).size, a.length, label + ': duplicate extracted IDs');
  assert.equal(new Set(b).size, b.length, label + ': duplicate declared IDs');
  assert.deepEqual(a.slice().sort(), b.slice().sort(), label);
}
function close(actual, expected, label) {
  assert(Number.isFinite(actual) && Number.isFinite(expected), label + ': finite value');
  assert(Math.abs(actual - expected) <= 1e-8 * Math.max(1, Math.abs(expected)), label + ': ' + actual + ' != ' + expected);
}
function allMatches(source, expression, group = 1) {
  return [...source.matchAll(expression)].map(match => match[group]);
}
/* Only isolated reviewed array/object initializers are evaluated, not native engines. */
function balanced(source, start) {
  const opening = source[start], pairs = {'[': ']', '{': '}', '(': ')'};
  assert(pairs[opening], 'expected literal opening at ' + start);
  const stack = [pairs[opening]];
  let quote = null, comment = null;
  for (let i = start + 1; i < source.length; i++) {
    const ch = source[i], next = source[i + 1];
    if (comment === 'line') { if (ch === '\n') comment = null; continue; }
    if (comment === 'block') { if (ch === '*' && next === '/') { comment = null; i++; } continue; }
    if (quote) {
      if (ch === '\\') { i++; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch.charCodeAt(0) === 96) { quote = ch; continue; }
    if (ch === '/' && next === '/') { comment = 'line'; i++; continue; }
    if (ch === '/' && next === '*') { comment = 'block'; i++; continue; }
    if (pairs[ch]) stack.push(pairs[ch]);
    else if (ch === ']' || ch === '}' || ch === ')') {
      assert.equal(ch, stack.pop(), 'balanced native literal');
      if (!stack.length) return source.slice(start, i + 1);
    }
  }
  throw Error('Unclosed native literal');
}
function initializer(source, name) {
  const match = new RegExp('\\b(?:const|let|var)\\s+' + name + '\\s*=\\s*([\\[{])').exec(source);
  assert(match, 'native declaration ' + name);
  return balanced(source, match.index + match[0].length - 1);
}
function literal(source, name) {
  return vm.runInNewContext('(' + initializer(source, name) + ')', {}, {timeout: 1000});
}
function attributes(html, selector, attribute) {
  return [...JSDOM.fragment(html).querySelectorAll(selector)].map(node => node.getAttribute(attribute));
}
function nativeIds(map) {
  const source = read(map.inventory.sourcePath);
  switch (map.id) {
    case 'practical-roads-grid':
      return attributes(source, '#task-stepper [data-task]', 'data-task');
    case 'practical-roads-schema': {
      const block = /function taskTabsHTML\(vi, task\)\s*\{[\s\S]*?\n\}/.exec(source);
      assert(block, 'roads-schema native tab renderer');
      const html = vm.runInNewContext(block[0] + ';taskTabsHTML(0,1)', {VARIANTS: [{group: 'main'}]}, {timeout: 1000});
      return attributes(html, '.tasktab[data-task]', 'data-task');
    }
    case 'practical-tires':
      return attributes(source, '#step-stepper [data-step]', 'data-step');
    case 'practical-stoves': {
      const groups = initializer(source, 'GROUPS');
      const matches = [...groups.matchAll(/\{\s*id:\s*'([^']+)'[\s\S]*?\btasks:\s*(\[)/g)];
      return matches.flatMap(match => {
        const start = match.index + match[0].length - 1;
        const tasks = balanced(groups, start);
        return allMatches(tasks, /\{\s*short:\s*'([^']+)'/g).map((_, i) => match[1] + ':' + i);
      });
    }
    case 'practical-land-plots':
    case 'practical-tariffs':
      return Array.from(literal(source, 'TYPES'));
    case 'practical-apartments': {
      const start = source.indexOf('const VIEWS='), end = source.indexOf('const CANON=', start);
      assert(start >= 0 && end > start, 'apartment view table boundaries');
      return allMatches(source.slice(start, end), /^\s*'([^']+)'\s*:\s*\{g:/gm);
    }
    case 'practical-paper':
      return allMatches(initializer(source, 'TYPES'), /\{\s*id:\s*'([^']+)'/g);
    case 'oge-6': {
      const categories = Array.from(literal(source, 'CATS'), row => row[0]).filter(id => id !== 'all');
      const tasks = literal(source, 'TASKS');
      assert.equal(tasks.length, 174, 'native №6 retained card count');
      sameSet([...new Set(tasks.map(task => task.cat))], categories, '№6 real card categories');
      return categories;
    }
    case 'oge-7': {
      const groups = literal(source, 'STEP_GROUPS');
      const ids = Object.entries(groups).flatMap(([group, value]) => value.subs.filter(sub => sub.id !== 'mix').map(sub => group + '/' + sub.id));
      sameSet(ids, Array.from(literal(source, 'TYPE_IDS')), '№7 selector/progress correspondence');
      return ids;
    }
    case 'oge-8':
    case 'oge-9':
    case 'oge-10':
    case 'oge-12':
    case 'oge-14':
      return Array.from(literal(source, 'TYPE_IDS'));
    case 'oge-11': {
      const matching = attributes(source, '#m4 [data-t]', 'data-t').filter(id => id !== 'rand');
      sameSet(matching, Array.from(literal(source, 'TYPE_IDS')), '№11 matching selector excludes only the mixed selector');
      return [...Object.keys(literal(source, 'SKILLS')), ...matching];
    }
    case 'oge-13':
      return Object.entries(literal(source, 'DATA')).flatMap(([group, entries]) => entries.map((_, i) => group + ':' + i));
    case 'oge-15':
    case 'oge-16':
      return allMatches(source, /^\s*([A-Za-z]\w*):\{topic:/gm);
    case 'oge-17':
      return allMatches(source, /def\('([^']+)'/g);
    case 'oge-18':
    case 'oge-23':
      return allMatches(source, /SUBS\.([A-Za-z]\w*)\s*=\s*\{/g);
    case 'oge-19':
      return task19.cards.map(card => card.id);
    case 'oge-20':
      return Array.from(literal(source, 'ORDER'));
    case 'oge-21':
      return allMatches(source, /MODULES\.push\(\{\s*key:\s*'([^']+)'/g);
    case 'oge-22':
      return [...source.matchAll(/MODULES\[\d+\]\.subs\s*=\s*(\[)/g)].flatMap(match => {
        const rows = vm.runInNewContext('(' + balanced(source, match.index + match[0].length - 1) + ')', {}, {timeout: 1000});
        return Array.from(rows).filter(row => row.k !== null).map(row => row.k);
      });
    case 'oge-24':
      return Array.from(literal(source, 'DATA').tasks, task => task.id);
    case 'oge-25':
      return allMatches(source, /TYPES\.push\(\{\s*id:\s*(\d+)/g);
    default:
      throw Error('Native inventory extractor missing for ' + map.id);
  }
}
function localUrl(href) {
  assert(C.validHref(href), 'safe local resource ' + href);
  const url = new URL(href, 'https://mathexam.space');
  assert.equal(url.origin, 'https://mathexam.space');
  let file = path.join(root, decodeURIComponent(url.pathname));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  assert(fs.existsSync(file) && fs.statSync(file).isFile(), 'real file ' + href);
  return url;
}
function conditionKey(q) {
  return JSON.stringify([q.prompt.trim(), q.visual || null, q.choices ? q.choices.slice().sort() : null]);
}

test('28 maps contain 168 finite nodes and 504 explicitly assigned questions', () => {
  assert.equal(practical.length, 8);
  assert.equal(algebra.length, 12);
  assert.equal(geometry.length, 8);
  const expected = ['roads-grid', 'roads-schema', 'tires', 'stoves', 'land-plots', 'apartments', 'tariffs', 'paper']
    .map(id => 'practical-' + id).concat(Array.from({length: 20}, (_, i) => 'oge-' + (i + 6)));
  sameSet(maps.map(map => map.id), expected, 'all existing native trainer maps');
  assert.equal(maps.reduce((sum, map) => sum + map.nodes.length, 0), 168);
  assert.equal(questions.length, 504);
  assert.equal(new Set(questions.map(q => q.id)).size, 504, 'global question identity');
  for (const map of maps) {
    assert(map.title && map.goal && map.transferGoal && map.source.title && map.source.trainerId, map.id);
    assert.equal(map.nodes.length, 6, map.id);
    assert.equal(map.questions.length, 18, map.id);
    sameSet(map.nodes.map(node => node.id), [...new Set(map.nodes.map(node => node.id))], map.id + ' node IDs');
    for (let i = 0; i < 18; i++) assert.equal(map.questions[i].nodeId, map.nodes[i % 6].id, map.questions[i].id);
    assert(map.taskNumbers.length && map.taskNumbers.every(n => Number.isInteger(n) && n >= 1 && n <= 25), map.id);
    if (map.id.startsWith('oge-')) assert.deepEqual(map.taskNumbers, [Number(map.id.slice(4))], map.id);
  }
});

test('604 native IDs are read from actual trainers and all are covered', () => {
  const totals = {practical: 0, algebra: 0, geometry: 0};
  for (const map of maps) {
    const ids = nativeIds(map);
    assert(ids.length, 'nonempty native inventory ' + map.id);
    sameSet(ids, map.inventory.types.map(type => type.id), map.id + ' native inventory');
    const covers = [...new Set(map.nodes.flatMap(node => node.covers.map(String)))];
    sameSet(covers, ids, map.id + ' whole native coverage');
    const kind = practical.includes(map) ? 'practical' : algebra.includes(map) ? 'algebra' : 'geometry';
    totals[kind] += ids.length;
  }
  assert.deepEqual(totals, {practical: 59, algebra: 143, geometry: 402});
  assert.equal(Object.values(totals).reduce((a, b) => a + b, 0), 604);
});

test('every route is an acyclic graph with bounded activities and concrete explanation criteria', () => {
  for (const map of maps) {
    const nodes = new Map(map.nodes.map(node => [node.id, node]));
    const types = new Set(map.inventory.types.map(type => String(type.id)));
    const done = new Set();
    function visit(id, active) {
      assert(nodes.has(id), map.id + ' unknown prerequisite ' + id);
      assert(!active.has(id), map.id + ' cycle through ' + id);
      if (done.has(id)) return;
      const next = new Set(active).add(id), node = nodes.get(id);
      assert(Array.isArray(node.dependsOn), map.id + '/' + id);
      for (const before of node.dependsOn) visit(before, next);
      done.add(id);
    }
    for (const node of map.nodes) {
      assert(/^[a-z][a-z0-9-]*$/.test(node.id) && node.title && node.goal && node.finish && node.misconception, map.id + '/' + node.id);
      assert(node.covers.length && node.covers.every(id => types.has(String(id))), map.id + '/' + node.id + ' covers');
      assert(node.resources.length, map.id + '/' + node.id);
      for (const resource of node.resources) assert(resource.title && resource.instruction.length > 15 && resource.finish.length > 8, map.id + '/' + node.id);
      assert(node.explain.prompt.length > 10 && node.explain.criteria.length >= 2, map.id + '/' + node.id);
      assert(node.explain.criteria.every(text => typeof text === 'string' && text.length > 8), map.id + '/' + node.id);
      visit(node.id, new Set());
    }
    assert.equal(done.size, 6, map.id);
  }
});

test('504 mathematical witnesses verify the answer and reject an answer-only mutation', () => {
  const kinds = new Set();
  for (const q of questions) {
    assert(q.prompt && q.hint && q.explanation && ['number', 'choice'].includes(q.input), q.id);
    O.verify(q);
    assert(C.correct(q, String(q.answer)), q.id + ' UI accepts the exact witness');
    assert(!C.correct(q, '') && !C.correct(q, 'Infinity') && !C.correct(q, '0/0'), q.id + ' invalid input');
    let wrong;
    if (q.input === 'choice') {
      assert(q.choices.length >= 2 && new Set(q.choices).size === q.choices.length, q.id + ' distinct choices');
      assert.equal(q.choices.filter(choice => choice === q.answer).length, 1, q.id + ' answer belongs to choices');
      wrong = q.choices.find(choice => choice !== q.answer);
    } else {
      const value = O.literal(String(q.answer));
      wrong = String(value[0] + value[1]) + '/' + String(value[1]);
    }
    assert.throws(() => O.verify({...q, answer: wrong}), undefined, q.id + ' independent witness rejects changed answer');
    kinds.add(q.oracle.kind);
  }
  assert(kinds.has('proof-dependency') && kinds.has('quadratic-root') && kinds.has('visual-coordinate'));
  console.log('OGE_SKILLS_EXACT_QUESTIONS_OK 504 questions / 28 maps');
});

test('practice, check A and check B use distinct conditions, including unordered choices', () => {
  for (const map of maps) {
    const seen = new Set();
    for (const q of map.questions) {
      const key = conditionKey(q);
      assert(!seen.has(key), map.id + ' repeats the same condition in ' + q.id);
      seen.add(key);
    }
    for (let node = 0; node < 6; node++) {
      const three = [map.questions[node], map.questions[node + 6], map.questions[node + 12]];
      assert.equal(new Set(three.map(conditionKey)).size, 3, map.id + '/' + map.nodes[node].id);
    }
  }
});

test('resource files, 135 foundation links, exact cards and all ten investigations are real', () => {
  assert.equal(foundationCatalog.routes.length, 135);
  sameSet(foundationLinks.map(route => route.id), foundationCatalog.routes.map(route => route.id), 'foundation mirror');
  const foundationById = new Map(foundationCatalog.routes.map(route => [route.id, route]));
  for (const link of foundationLinks) {
    const actual = foundationById.get(link.id);
    assert.equal(link.title, actual.title, link.id);
    assert.equal(link.group, actual.group, link.id);
    const url = localUrl(link.href);
    assert.equal(url.pathname, '/foundations/route.html');
    assert.equal(url.hash, '#' + link.id);
  }
  const seenInvestigations = new Set();
  for (const map of maps) {
    localUrl(map.source.href);
    assert(fs.existsSync(path.join(root, map.inventory.sourcePath)), map.inventory.sourcePath);
    for (const node of map.nodes) {
      for (const id of node.foundations) assert(foundationById.has(id), map.id + '/' + node.id + ': ' + id);
      for (const resource of node.resources) {
        const url = localUrl(resource.href);
        if (url.searchParams.has('card')) {
          assert.equal(url.pathname, '/trainers/task19-trainer.html');
          assert(task19.cards.some(card => card.id === url.searchParams.get('card')), resource.href);
        }
        if (resource.investigationId) {
          const lesson = lessons.find(item => item.id === resource.investigationId);
          assert(lesson, resource.investigationId);
          assert.equal(url.hash, '#oge-video-models', resource.href);
          const targetMap = maps.find(item => new URL(item.source.href, url.origin).pathname === url.pathname);
          assert(targetMap && targetMap.taskNumbers.some(n => lesson.tasks.includes(n)), resource.href + ' applicable investigation');
          seenInvestigations.add(lesson.id);
        } else assert(!url.hash, 'unverified fragment ' + resource.href);
      }
    }
  }
  sameSet([...seenInvestigations], lessons.map(lesson => lesson.id), 'all ten existing investigations reused');
});

test('rendered coordinate grids have equal pixel units and preserve every authored point and segment', () => {
  let count = 0;
  for (const q of questions) {
    const v = q.visual;
    if (!v) continue;
    const html = V.figure(v);
    assert(html && !/(?:NaN|Infinity|undefined)/.test(html), q.id + ' valid rendered model');
    if (v.type !== 'graph') continue;
    count++;
    assert(v.xmax > v.xmin && v.ymax > v.ymin && v.step > 0, q.id);
    const model = JSDOM.fragment(html), grid = [...model.querySelectorAll('line.graph-grid')];
    const attr = (element, name) => Number(element.getAttribute(name));
    const xs = grid.filter(line => attr(line, 'x1') === attr(line, 'x2')).map(line => attr(line, 'x1')).sort((a, b) => a - b);
    const ys = grid.filter(line => attr(line, 'y1') === attr(line, 'y2')).map(line => attr(line, 'y1')).sort((a, b) => b - a);
    assert(xs.length >= 2 && ys.length >= 2, q.id + ' enough independent grid anchors');
    const ux = (xs[1] - xs[0]) / v.step, uy = (ys[0] - ys[1]) / v.step;
    close(ux, uy, q.id + ' square coordinate units');
    for (let i = 1; i < xs.length; i++) close(xs[i] - xs[i - 1], ux * v.step, q.id + ' regular x grid');
    for (let i = 1; i < ys.length; i++) close(ys[i - 1] - ys[i], uy * v.step, q.id + ' regular y grid');
    const firstX = Math.ceil(v.xmin / v.step) * v.step, firstY = Math.ceil(v.ymin / v.step) * v.step;
    const px = value => xs[0] + (value - firstX) * ux, py = value => ys[0] - (value - firstY) * uy;
    const points = [...model.querySelectorAll('circle.model-point')];
    assert.equal(points.length, (v.points || []).length, q.id + ' no dropped points');
    for (const [i, point] of (v.points || []).entries()) {
      assert(Number.isFinite(point.x) && Number.isFinite(point.y) && point.x >= v.xmin && point.x <= v.xmax && point.y >= v.ymin && point.y <= v.ymax, q.id);
      close(attr(points[i], 'cx'), px(point.x), q.id + '/' + point.label + ' x');
      close(attr(points[i], 'cy'), py(point.y), q.id + '/' + point.label + ' y');
    }
    const segments = [...model.querySelectorAll('line.graph-segment')];
    assert.equal(segments.length, (v.segments || []).length, q.id + ' no dropped segments');
    for (const [i, segment] of (v.segments || []).entries()) {
      close(attr(segments[i], 'x1'), px(segment.x1), q.id + ' segment x1');
      close(attr(segments[i], 'y1'), py(segment.y1), q.id + ' segment y1');
      close(attr(segments[i], 'x2'), px(segment.x2), q.id + ' segment x2');
      close(attr(segments[i], 'y2'), py(segment.y2), q.id + ' segment y2');
    }
  }
  assert(count >= 18, 'all native-grid and graph-reading models exercised');
});

test('all eighteen №18 answers can be reconstructed directly from diagram data', () => {
  const map = byId['oge-18'];
  function distance(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }
  function area(points) {
    return Math.abs(points.reduce((sum, point, i) => {
      const next = points[(i + 1) % points.length];
      return sum + point.x * next.y - point.y * next.x;
    }, 0)) / 2;
  }
  for (const [i, q] of map.questions.entries()) {
    const visual = q.visual, p = label => visual.points.find(point => point.label === label);
    let expected;
    if ([0, 12].includes(i)) expected = distance(p('A'), p('B'));
    else if (i === 1) expected = (p('A').x + p('B').x) / 2;
    else if ([2, 3, 8, 9, 14, 15].includes(i)) expected = area(visual.points);
    else if ([4, 10].includes(i)) expected = distance(p('B'), p('C')) / distance(p('A'), p('B'));
    else if (i === 6) expected = p('B').y - p('A').y;
    else if ([7, 13].includes(i)) expected = distance(p('M'), p('N'));
    else if (i === 16) expected = distance(p('C'), p('D')) / distance(p('A'), p('B'));
    else expected = (Number(visual.rows[1][1]) / Number(visual.rows[0][1])) ** 2;
    if (q.input === 'number') {
      const value = O.literal(String(q.answer));
      close(Number(value[0]) / Number(value[1]), expected, q.id + ' geometry from coordinates');
    } else {
      const match = /^\((\d+)\/(\d+)\)²$/.exec(q.answer);
      assert(match, q.id + ' displayed squared ratio');
      assert.equal(Number(match[1]), Number(visual.rows[1][1]), q.id + ' numerator belongs to second circle');
      assert.equal(Number(match[2]), Number(visual.rows[0][1]), q.id + ' denominator belongs to first circle');
      close((Number(match[1]) / Number(match[2])) ** 2, expected, q.id);
    }
  }
});

test('entry data contains only the 28 actual map names and 168 actual node names', () => {
  const context = {};
  vm.runInNewContext(read('oge/skills/entry-data.js'), context, {timeout: 1000});
  const data = context.OgeSkillEntryData;
  assert(data && typeof data === 'object');
  sameSet(Object.keys(data), maps.map(map => map.id), 'entry maps');
  let total = 0;
  for (const map of maps) {
    const entry = data[map.id];
    sameSet(Object.keys(entry), ['title', 'nodes'], 'entry metadata only ' + map.id);
    assert.equal(entry.title, map.title, map.id);
    sameSet(Object.keys(entry.nodes), map.nodes.map(node => node.id), map.id + ' entry node IDs');
    for (const node of map.nodes) assert.equal(entry.nodes[node.id], node.title, map.id + '/' + node.id);
    total += Object.keys(entry.nodes).length;
  }
  assert.equal(total, 168);
});

test('33 additive native entrances exactly restore the immutable base bytes', () => {
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.baseSha, EXPECTED_BASE, 'source audit cannot drift to a convenient base');
  assert.equal(manifest.entries.length, 33);
  sameSet(manifest.entries.map(entry => entry.path), [...new Set(manifest.entries.map(entry => entry.path))], 'unique native source pages');
  sameSet(manifest.entries.filter(entry => entry.map).map(entry => entry.map), maps.map(map => map.id), 'one direct entrance per map');
  const extras = [
    'practice-1-5-entry-diagnostic-2026.html', 'practice-1-5-plan-reading.html',
    'practice-1-5-routes-checkpoint-2026.html', 'percent-table-trainer.html', 'practice-1-5-map.html'
  ].map(name => 'trainers/oge-1-5-trainers/' + name);
  sameSet(manifest.entries.filter(entry => !entry.map).map(entry => entry.path), extras, 'five shared practical entrances');
  for (const entry of manifest.entries) {
    assert(/^trainers\/[A-Za-z0-9/._-]+\.html$/.test(entry.path), entry.path);
    const expectedHref = entry.map ? '/oge/skills/#' + entry.map : '/oge/skills/';
    assert.equal(entry.href, expectedHref, entry.path);
    if (entry.map) assert.equal(new URL(byId[entry.map].source.href, 'https://mathexam.space').pathname, '/' + entry.path);
    assert(entry.headSnippet.includes('OGE_SKILL_MAP_INCLUDES:BEGIN') && entry.headSnippet.includes('OGE_SKILL_MAP_INCLUDES:END'));
    assert(entry.entranceSnippet.includes('OGE_SKILL_MAP_ENTRANCE:BEGIN') && entry.entranceSnippet.includes('OGE_SKILL_MAP_ENTRANCE:END'));
    const fragment = JSDOM.fragment(entry.entranceSnippet), link = fragment.querySelector('.oge-skill-entrance a');
    assert(link && link.getAttribute('href') === expectedHref, entry.path + ' actual entrance target');
    assert.equal(fragment.querySelectorAll('script,iframe,form,input').length, 0, entry.path + ' navigation only');
    let restored = fs.readFileSync(path.join(root, entry.path));
    for (const addition of [entry.headSnippet, entry.entranceSnippet]) {
      const bytes = Buffer.from(addition, 'utf8'), start = restored.indexOf(bytes);
      assert(bytes.length && start >= 0, entry.path + ' exact insertion present');
      assert.equal(restored.indexOf(bytes, start + bytes.length), -1, entry.path + ' insertion occurs once');
      restored = Buffer.concat([restored.subarray(0, start), restored.subarray(start + bytes.length)]);
    }
    const base = execFileSync('git', ['show', EXPECTED_BASE + ':' + entry.path], {cwd: root, maxBuffer: 4 * 1024 * 1024});
    assert(restored.equals(base), entry.path + ': native content changed beyond the two approved insertions');
  }
  console.log('OGE_SKILLS_NATIVE_PRESERVATION_OK 33 byte-identical native engines');
});

test('production catalog agrees with independently checked banks', () => {
  const catalog = require('../oge/skills/catalog.js');
  sameSet(catalog.maps.map(map => map.id), maps.map(map => map.id), 'runtime maps');
  assert.equal(catalog.groups.length, 3);
  for (const map of maps) assert.equal(catalog.byId[map.id], map);
  assert.equal(catalog.byId.constructor, undefined);
  assert.equal(catalog.byId.__proto__, undefined);
});
