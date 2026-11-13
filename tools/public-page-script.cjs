'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Resolve the URL like a static page, but permit no host, OS absolute path,
// percent-encoded path or symlink that could escape this repository.
function resolvePublicScript(root, directory, src) {
  assert.equal(typeof src, 'string');
  assert.match(src, /^\/?(?!\/)[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*\.js(?:\?[A-Za-z0-9_.=&-]+)?$/,
    'Expected a fixed local JavaScript URL');
  const pathname = src.split('?')[0], boundary = fs.realpathSync(root);
  const local = pathname.startsWith('/') ? path.resolve(boundary, pathname.slice(1)) : path.resolve(directory, pathname);
  assert.ok(local.startsWith(boundary + path.sep), 'Script path leaves the repository');
  const real = fs.realpathSync(local);
  assert.ok(real.startsWith(boundary + path.sep) && fs.statSync(real).isFile(), 'Script target leaves the repository or is not a file');
  return real;
}

const shell = new Set(['/assets/oge-wayfinding.js', '/assets/assistant/navigator-data.js?v=20261105-site1',
  '/assets/assistant/navigator-widget.js?v=20261105-site1']);
function loadSchoolModels(root, html, world) {
  const directory = path.join(root, 'school');
  for (const match of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)) {
    const src = match[1], filename = src.split('?')[0];
    assert.ok(!filename.includes('..'), 'Only fixed local school scripts are loaded');
    const file = resolvePublicScript(root, directory, src);
    const compiled = new vm.Script(fs.readFileSync(file, 'utf8'), {filename: src});
    if (filename.startsWith('/')) {
      assert.ok(shell.has(src), 'Unreviewed site-wide school script: ' + src);
      assert.equal(match[0], '<script defer src="' + src + '">');
      continue; // These DOM shells are exercised by real browser gates.
    }
    if (filename !== 'app.js') compiled.runInContext(world);
  }
}
function sourceForProfileBoard(root, wrapper) {
  const name = 'ege-profil/start/index.html';
  const current = fs.readFileSync(path.join(root, name));
  const {restorePublicNavigator, snippet} = require('./public-navigator-preservation.cjs');
  const canonical = restorePublicNavigator(name, current).toString('utf8');
  assert.ok(current.includes(snippet) && !canonical.includes(snippet), 'Only the verified public pair is restored');
  assert.doesNotMatch(wrapper, /\/assets\/assistant\/navigator-/, 'The board wrapper must not install the public navigator');
  return canonical;
}

// The public page has scoped map, coaching and introductory vector modules. Board wrappers
// deliberately omit them, but must retain every shared learning script in order.
// Only the explicitly reviewed public cache-stamp changes differ from wrapper URLs;
// this is not a general query-string normalizer or script ignore list.
function canonicalProfileLearningScripts(canonical, wrapper) {
  const scripts = html => [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)]
    .map(match => ({tag: match[0], src: match[1]}));
  const page = scripts(canonical), board = scripts(wrapper);
  const publicModules = ['../skill-map-data.js?v=20261112-vectors', '../azbuka-metodov/catalog.js?v=20261113',
    '../skill-map.js?v=20261113-foundations',
    'journey.js?v=20261113-foundations', 'second-part.js?v=20261109', 'practice-feedback.js?v=20261109-active',
    'practice-coach.js?v=20261109-integrity', 'vector-basics-data.js?v=20261113-foundations',
    'vector-basics-models.js?v=20261112-vectors'];
  const pathname = src => new URL(src, 'https://mathexam.space/ege-profil/start/index.html').pathname;
  const publicPaths = new Set(publicModules.map(pathname));
  assert.deepEqual(page.filter(script => publicPaths.has(pathname(script.src))).map(script => script.src), publicModules,
    'The public page contains exactly the reviewed public modules, once and in order');
  assert.deepEqual(page.slice(0, publicModules.length).map(script => script.src), publicModules,
    'Public-only modules precede the canonical learning runtime');
  for (let index = 0; index < publicModules.length; index++)
    assert.equal(page[index].tag, '<script defer src="' + publicModules[index] + '"></script>', 'Exact deferred public-module include');
  assert.ok(board.every(script => !publicPaths.has(pathname(script.src))), 'Board wrappers must not load public-only modules');
  const cacheStamps = new Map([
    ['geometry-data.js?v=20261112-vectors', 'geometry-data.js'],
    ['calm-data.js?v=20261112-vectors', 'calm-data.js?v=20261101-finance'],
    ['calm-ui.js?v=20261113-foundations', 'calm-ui.js?v=20261101-trainer-repair'],
    ['app.js?v=20261113-foundations', 'app.js?v=20261101-trainer-repair'],
    ['state.js?v=20261109-integrity', 'state.js?v=20261101-trainer-repair']
  ]);
  for (const current of cacheStamps.keys())
    assert.deepEqual(page.filter(script => pathname(script.src) === pathname(current)).map(script => script.src), [current],
      'Only the reviewed public runtime cache stamp may differ: ' + current.split('?')[0]);
  return page.slice(publicModules.length).map(script => cacheStamps.get(script.src) || script.src);
}
module.exports = {resolvePublicScript, loadSchoolModels, sourceForProfileBoard, canonicalProfileLearningScripts};
