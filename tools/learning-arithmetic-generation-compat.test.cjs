'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const api = require('../trainers/oge-basics/learning-contracts');
const seeds = [0,1,2,7,36,37,38,12345,999999,1000000000,4294967295];
const ids = api.list().filter(x => /multiplication-division\/(course-(?!column)|quotient-estimate)/.test(x.contentId)).map(x => x.contentId);

test('all198 pinned published task/state envelopes replay byte-for-byte without a generation marker', () => {
  // Captured from production7183175 before changing the contracts, not derived
  // from the replacement generator or its expected answers.
  const hash = crypto.createHash('sha256');
  assert.equal(ids.length,18);
  for (const id of ids) for (const seed of seeds) {
    const saved = api.create(id,seed,{generatorVersion:1});
    assert.equal(Object.hasOwn(saved.taskSpec,'generatorVersion'),false);
    hash.update(JSON.stringify(saved)+'\n');
  }
  assert.equal(hash.digest('hex'),'386840c70563992329464db7bf665a93da04590d1dc4d20f4009a15b28fc3b44');
});

test('new arithmetic variants have an explicit replay identity and preserve the existing state contract', () => {
  for (const id of ids) for (const seed of seeds) {
    const generated = api.create(id,seed);
    assert.equal(generated.taskSpec.generatorVersion,2);
    assert.equal(generated.taskSpec.contentVersion,1);
    assert.deepEqual(generated,api.create(id,seed,{generatorVersion:2}));
    assert.deepEqual(api.normalize(generated.taskSpec,generated.state),generated.state);
    const question = generated.taskSpec.steps[0];
    const checked = api.evaluate(generated.taskSpec,{scope:'step',step:0,answers:[],answer:String(question.answer)});
    assert.equal(checked.correct,true);
    const state = {...generated.state,step:1,answers:[String(question.answer)],completed:generated.taskSpec.steps.length===1};
    assert.deepEqual(api.normalize(generated.taskSpec,state),state);
  }
});

test('unknown generator versions cannot silently reinterpret saved conditions', () => {
  for (const version of [0,3,'2',null,-1]) assert.throws(() => api.create(ids[0],1,{generatorVersion:version}),/версия/);
  assert.throws(() => api.create('multiplication-division/course-column-two-digit',1,{generatorVersion:2}),/версия/);
});
