'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../trainers/trainer-board.html'), 'utf8');
const start = source.indexOf('function selectedSameDocumentTarget(');
const end = source.indexOf('function reloadTrainerFrameForBridge(', start);
assert(start >= 0 && end > start, 'production frame selection functions are present');

function fixture(attribute, liveHash) {
  const root = 'https://mathexam.space';
  const target = '/trainers/sections-from-zero.html?seed=synthetic#starter-18';
  const live = new URL(root + '/trainers/sections-from-zero.html?seed=synthetic' + liveHash);
  let reloads = 0, invalidations = 0;
  live.reload = () => { reloads++; };
  const frame = { contentWindow: { location: live }, getAttribute: () => attribute, src: attribute };
  const context = vm.createContext({
    URL, location: new URL(root + '/trainers/trainer-board.html'), frame,
    normalizeTrainer: value => value, BoardPicker: {error(message) {throw Error(message);}},
    invalidateTrainerBridge() {invalidations++;}, updateMirrorStatusForCurrentTrainer() {},
    bridgeReloadNeeded: false, frameLoaded: true, frameGeneration: 0
  });
  vm.runInContext(source.slice(start, end), context);
  return {context, target, live, frame, reloads: () => reloads, invalidations: () => invalidations};
}

test('explicitly selecting the original src card reloads its new live hash', () => {
  const f = fixture('/trainers/sections-from-zero.html?seed=synthetic#starter-18', '#starter-01');
  f.context.setTrainerFrameSrc(f.target, {selection: true});
  assert.equal(f.live.hash, '#starter-18');
  assert.equal(f.reloads(), 1);
  assert.equal(f.invalidations(), 1);
  assert.equal(f.context.frameGeneration, 1);
});

test('normal restoration and retry retain the live card instead of replaying an old src', () => {
  const f = fixture('/trainers/sections-from-zero.html?seed=synthetic#starter-18', '#starter-01');
  f.context.setTrainerFrameSrc(f.target);
  assert.equal(f.reloads(), 0);
  assert.equal(f.live.hash, '#starter-01');
  f.context.setTrainerFrameSrc(f.target, {force: true});
  assert.equal(f.reloads(), 1);
  assert.equal(f.live.hash, '#starter-01');
});

test('selection reloads the requested card even if the iframe src contains a different hash', () => {
  const f = fixture('/trainers/sections-from-zero.html?seed=synthetic#starter-02', '#starter-01');
  f.context.setTrainerFrameSrc(f.target, {selection: true});
  assert.equal(f.live.hash, '#starter-18');
  assert.equal(f.reloads(), 1);
});

test('a different origin or resource is never accessed as a same-document selection', () => {
  const f = fixture('/trainers/sections-from-zero.html?seed=synthetic#starter-18', '#starter-01');
  const external = 'https://example.test/other.html#starter-18';
  f.context.setTrainerFrameSrc(external, {selection: true});
  assert.equal(f.frame.src, external);
  assert.equal(f.reloads(), 0);
});
