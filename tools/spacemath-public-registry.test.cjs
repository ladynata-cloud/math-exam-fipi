'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { loadTrainerRegistry } = require('../board-server/trainer-registry');

const root = path.resolve(__dirname, '..');
const json = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const sandbox = {
  window: {},
  location: new URL('https://mathexam.space/trainers/trainer-board.html'),
  URL
};
vm.runInNewContext(fs.readFileSync(path.join(root, 'trainers/board-picker.js'), 'utf8'), sandbox);
const { normalize, canonical } = sandbox.window.BoardPicker;

test('SpaceMath has one public picker entry and exact semantic mirror authorization', () => {
  const entries = json('trainers/board-picker-data.json').entries.filter(entry =>
    canonical(entry.href) === canonical('/trainers/spacemath/index.html'));
  assert.equal(entries.length, 1);
  assert.deepEqual(entries[0], {
    title: 'SpaceMath',
    group: 'Геометрия / построения',
    href: '/trainers/spacemath/index.html'
  });
  const manifest = json('trainers/board-compat.json');
  const matches = manifest.trainers.filter(entry => entry.trainerId === 'spacemath');
  assert.equal(matches.length, 1);
  assert.equal(matches[0].supportsBoardMirror, true);
  assert.equal(matches[0].supportsSeed, false);
  assert.equal(matches[0].boardCompatibility, 'board-mirror');
  const registry = loadTrainerRegistry({ env: {} });
  assert.equal(registry.loaded, true);
  assert.deepEqual(registry.getByTrainerUrl(entries[0].href), {
    trainerId: 'spacemath',
    file: 'trainers/spacemath/index.html',
    version: '1.0.0',
    stateSchemaVersion: 1,
    bridgeProtocolVersion: 1,
    allowLegacyHtml: false
  });
  assert.equal(registry.progressEntries.some(entry => entry.trainerId === 'spacemath'), false,
    'free constructions do not opt into public academic progress');
});

test('the literal SpaceMath directory opens its authorized entry without widening path authorization', () => {
  const registry = loadTrainerRegistry({ env: {} });
  for (const link of [
    '/trainers/spacemath/',
    'trainers/spacemath/',
    'https://mathexam.space/trainers/spacemath/'
  ]) {
    const normalized = normalize(link + '?seed=room-demo#construction');
    assert.equal(normalized, '/trainers/spacemath/index.html?seed=room-demo#construction');
    assert.equal(registry.getByTrainerUrl(normalized)?.trainerId, 'spacemath');
  }
  for (const link of [
    '/trainers/%73pacemath/',
    '/trainers/spacemath/%69ndex.html',
    '/trainers/spacemath/../spacemath/',
    '/trainers/spacemath/extra.html',
    '/trainers/spacemath/model.js'
  ]) {
    assert.equal(registry.getByTrainerUrl(normalize(link)), null, link);
  }
  assert.equal(normalize('https://example.org/trainers/spacemath/'),
    'https://example.org/trainers/spacemath/', 'external pages are not rewritten as local SpaceMath');
});
