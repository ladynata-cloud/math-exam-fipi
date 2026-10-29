#!/usr/bin/env node
'use strict';
// Run from any directory: node tools/arithmetic-url-contract.test.cjs
// Repository checks only: HTTP responses, rendered UI, board transport and
// search-engine indexing still need their own release checks.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const contract = require('./arithmetic-url-contract.json');
const A = require('../trainers/oge-basics/arithmetic-route.js');
const G = require('../trainers/oge-basics/multiplication-division/division-guided-core.js');
const guidedBase = '/trainers/oge-basics/multiplication-division/';

function fileAt(urlPath) {
  const filename = path.resolve(root, '.' + decodeURIComponent(urlPath));
  assert(filename === root || filename.startsWith(root + path.sep), 'path escapes repository: ' + urlPath);
  const target = urlPath.endsWith('/') ? path.join(filename, 'index.html') : filename;
  assert(fs.existsSync(target) && fs.statSync(target).isFile(), 'missing URL target: ' + urlPath);
  return target;
}
function read(urlPath) { return fs.readFileSync(fileAt(urlPath), 'utf8'); }
function decode(value) {
  return value.replace(/&(?:amp|quot|apos|lt|gt);|&#(?:x[\da-f]+|\d+);/gi, entity => {
    const names = {'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>'};
    if (names[entity.toLowerCase()]) return names[entity.toLowerCase()];
    const hex = entity[2].toLowerCase() === 'x';
    return String.fromCodePoint(parseInt(entity.slice(hex ? 3 : 2, -1), hex ? 16 : 10));
  });
}
function tags(html) {
  // Ignore markup inside JS/CSS strings and comments; retain external script
  // opening tags so their real src targets are checked as well.
  const markup = html.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(<(script|style|textarea)\b[^>]*>)[\s\S]*?<\/\2\s*>/gi, '$1');
  return [...markup.matchAll(/<([a-z][\w:-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi)].map(match => {
    const attrs = {};
    for (const attr of match[2].matchAll(/([^\s="'<>`]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
      attrs[attr[1].toLowerCase()] = decode(attr[2] ?? attr[3] ?? attr[4] ?? '');
    }
    return {tag:match[1].toLowerCase(), attrs};
  });
}
function inlineConfig(html, binding, label) {
  const match = new RegExp('\\bconst\\s+' + binding + '\\s*=\\s*').exec(html);
  assert(match, label + ': missing topic configuration ' + binding);
  const start = match.index + match[0].length;
  assert.equal(html[start], '{', label + ': configuration must be inspectable');
  let depth = 0, string = false, escaped = false;
  for (let i = start; i < html.length; i++) {
    const char = html[i];
    if (string) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') string = false;
    } else if (char === '"') string = true;
    else if (char === '{') depth++;
    else if (char === '}' && --depth === 0) return JSON.parse(html.slice(start, i + 1));
  }
  assert.fail(label + ': unfinished topic configuration');
}

assert.equal(contract.version, 1);
assert.equal(contract.entries.length, 20, 'approved matrix must retain all 20 addresses');
assert.equal(new Set(contract.entries.map(entry => entry.path)).size, 20, 'duplicate protected address');
let destinations = 0, configurations = 0;
const guidedPages = new Set(contract.entries.filter(entry => entry.engine === 'guided-division').map(entry => entry.path));
for (const entry of contract.entries) {
  const html = read(entry.path), nodes = tags(html);
  const base = new URL(entry.path, contract.origin);
  assert.equal(nodes.filter(node => node.tag === 'base').length, 0, entry.path + ': base URL changes link meaning');
  const canonicals = nodes.filter(node => node.tag === 'link' && node.attrs.rel?.split(/\s+/).includes('canonical'));
  assert.deepEqual(canonicals.map(node => node.attrs.href), [contract.origin + entry.canonicalPath],
    entry.path + ': canonical must preserve the approved topic or actual duplicate pair');
  fileAt(entry.canonicalPath);
  const primary = contract.entries.find(candidate => candidate.path === entry.canonicalPath);
  assert(primary && primary.canonicalPath === primary.path, entry.path + ': canonical chain or unregistered primary');
  for (const node of nodes.filter(node => node.tag === 'meta')) {
    assert.notEqual(node.attrs['http-equiv']?.toLowerCase(), 'refresh', entry.path + ': unexpected redirect');
    if (['robots','googlebot','yandex'].includes(node.attrs.name?.toLowerCase())) {
      assert(!/(?:^|[\s,;])(?:noindex|none)(?:$|[\s,;])/i.test(node.attrs.content || ''),
        entry.path + ': public topic became noindex');
    }
  }
  assert(/<title>\s*[^<]+<\/title>/i.test(html), entry.path + ': missing static title');
  for (const node of nodes) {
    const value = node.tag === 'script' ? node.attrs.src : ['a','link'].includes(node.tag) ? node.attrs.href : null;
    if (!value) continue;
    const url = new URL(value, base);
    if (url.origin !== contract.origin) continue;
    fileAt(url.pathname); destinations++;
  }
  if (entry.inlineConfig) {
    const config = inlineConfig(html, entry.inlineConfig.binding, entry.path);
    for (const [key, expected] of Object.entries(entry.inlineConfig)) {
      if (key !== 'binding') assert.deepEqual(config[key], expected, entry.path + ': changed ' + key);
    }
    configurations++;
    const scripts = nodes.filter(node => node.tag === 'script' && node.attrs.src)
      .map(node => new URL(node.attrs.src, base).pathname);
    assert(scripts.includes('/trainers/oge-basics/learning-loader.js'), entry.path + ': managed lesson entry removed');
  }
  if (entry.engine === 'guided-division') {
    const scripts = nodes.filter(node => node.tag === 'script' && node.attrs.src)
      .map(node => new URL(node.attrs.src, base).pathname);
    for (const file of ['division-lab-core.js','division-guided-core.js','division-guided.js']) {
      assert(scripts.includes(guidedBase + file), entry.path + ': shared division engine removed: ' + file);
    }
  }
  if (entry.bodyKind) {
    assert.equal(nodes.find(node => node.tag === 'body')?.attrs['data-kind'], entry.bodyKind,
      entry.path + ': NOD/NOK entry opens the wrong operation');
  }
}

// Follow the real route API, checking each URL against the consumer's existing
// options/topics. A link is not enough if its level or fragment is discarded.
const options = new Set(tags(read('/trainers/arifmetika.html'))
  .filter(node => node.tag === 'option').map(node => node.attrs.value));
const topicIds = new Set(G.topics.map(topic => topic.id));
for (const id of contract.guidedTopics) {
  assert(topicIds.has(id), 'existing topic anchor removed: #' + id);
  assert.equal(G.make(id).topicId, id, 'existing anchor now selects a different topic: #' + id);
}
for (const level of A.levels) {
  const url = new URL(A.practiceURL(level.id), contract.origin);
  assert.equal(url.pathname, '/trainers/arifmetika.html');
  assert.equal(url.searchParams.get('course'), 'preoge');
  assert.equal(url.searchParams.get('level'), level.id);
  assert(options.has(level.id), 'linked level unavailable in arithmetic: ' + level.id);
  const back = new URL(A.routeURL(level.id), contract.origin);
  assert.equal(back.pathname, '/trainers/oge-basics/arithmetic-route.html');
  assert.equal(back.searchParams.get('skill'), level.group);
}
for (const [level, topic] of Object.entries(contract.guidedLevelTopics)) {
  const url = new URL(A.guidedURL(level), contract.origin);
  assert(guidedPages.has(url.pathname), level + ': guided URL no longer reaches the shared trainer');
  assert.equal(url.searchParams.get('course'), 'preoge');
  assert.equal(url.hash, '#' + topic, level + ': existing link opens a different topic');
  assert(topicIds.has(url.hash.slice(1)));
}
assert.equal(A.guidedKey, contract.progress.guidedKey, 'guided progress key changed');
assert.equal(A.prefix, contract.progress.attemptPrefix, 'arithmetic attempt storage changed');

// Execute the actual loader up to DOMContentLoaded, where it has already
// selected the public/managed route. Do not fake the downstream lesson UI.
const loader = read('/trainers/oge-basics/learning-loader.js');
for (const [search, expected] of [['',false],['?learning=0',false],['?learning=1',true],['?course=preoge&learning=1',true]]) {
  const window = {}, document = {
    readyState:'loading', currentScript:{src:contract.origin + '/trainers/oge-basics/learning-loader.js'},
    addEventListener() {}, createElement() { return {}; }, head:{append() {}},
    documentElement:{classList:{add() {}}}
  };
  vm.runInNewContext(loader, {window, document, URL, URLSearchParams,
    location:{search, href:contract.origin + guidedBase + 'decimal-divisor-shift.html' + search}},
    {filename:'learning-loader.js', timeout:1000});
  assert.equal(window.MathExamRemediationManaged, expected, search + ': managed-mode selection changed');
}
console.log('ARITHMETIC_URL_CONTRACT_OK: ' + contract.entries.length + ' stable paths/canonicals; ' + destinations +
  ' local href/src targets; ' + configurations + ' topic/storage configurations; ' + A.levels.length +
  ' arithmetic level URLs; ' + contract.guidedTopics.length + ' guided anchors; learning/course/level parameters.');
