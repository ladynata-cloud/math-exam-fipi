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
module.exports = {resolvePublicScript, loadSchoolModels, sourceForProfileBoard};
