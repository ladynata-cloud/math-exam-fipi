#!/usr/bin/env node
// State-level probes. They do not replace a real browser, a live pupil or layout tests.
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root = path.resolve(process.argv[2] || '.');
const { loadTrainer, makeStorage, readKey, KEY } = await import(pathToFileURL(path.join(root, 'tools/oge-geometry-contract.lib.mjs')));
const FILE = 'trainers/oge-task15-triangles.html';
const TID = 'oge-t15-treugolniki';
let checks = 0, attempts = 0;
const eq = (a, b, message) => { checks++; assert.deepEqual(a, b, message); };
const main = loadTrainer(FILE);
const keys = JSON.parse(main.run('JSON.stringify(TYPE_IDS)'));
for (const k of keys) {
  for (const behavior of ['independent', 'corrected', 'hint', 'feedback', 'reveal']) {
    const storage = makeStorage();
    storage.map.set(KEY, JSON.stringify({
      foreign: { student: 'fictional', value: 17 },
      [TID]: { v: 1, solvedByType: {}, train: { legacyField: 'preserve' } },
    }));
    const t = loadTrainer(FILE, { storage });
    t.run(`tr={t:build(${JSON.stringify(k)},SUBS[${JSON.stringify(k)}].proto,{}),missed:false,shown:false,done:false,ladder:true};`);
    if (behavior === 'corrected') t.run('trMiss()');
    if (behavior === 'hint') t.run("trHelp('hint')");
    if (behavior === 'feedback') t.run("trMiss();trHelp('feedback')");
    if (behavior === 'reveal') t.run("trHelp('hint');tr.shown=true");
    t.run('trFinish()');
    attempts++;
    const all = readKey(storage), rec = all[TID];
    const supported = ['hint', 'feedback'].includes(behavior);
    const shown = behavior === 'reveal';
    eq(rec.train.independent, Number(!supported && !shown), `${k}/${behavior}: independent`);
    eq(rec.train.supported, Number(supported), `${k}/${behavior}: supported`);
    eq(rec.train.shown, Number(shown), `${k}/${behavior}: shown`);
    eq(rec.train.solved, Number(!shown), `${k}/${behavior}: educational count`);
    eq(rec.train.legacyField, 'preserve', 'unknown historical field');
    eq(all.foreign, { student: 'fictional', value: 17 }, 'foreign record unchanged');
    eq(rec.lastPracticeOutcome.kind, shown ? 'shown' : supported ? 'supported' : behavior, 'honest recorded outcome');
    const before = storage.map.get(KEY);
    t.run('for(let i=0;i<50;i++){trFinish();trHelp("hint");}');
    eq(storage.map.get(KEY), before, 'repeated completion is idempotent');
  }
}
// Substantive assistance cannot count as the three clean answers needed for review.
{
  const t = loadTrainer(FILE);
  t.run("let sample=buildVariant('bisIso:B',true);logTaskVerdict(sample,false);for(let i=0;i<3;i++){tr={t:sample,missed:false,shown:false,done:false,ladder:true};trHelp('hint');trFinish();}");
  const rec = JSON.parse(t.run('JSON.stringify(CP.readAll())'));
  eq(rec.mistakes[TID + '|bisIso'].r, 0, 'three assisted attempts do not clear mistake');
  eq(rec[TID].train.supported, 3, 'supported attempts retained');
  eq(rec[TID].train.independent, 0, 'no independent attempt fabricated');
}
// Two independent contexts read fresh shared storage before adding their work.
{
  const storage = makeStorage();
  const a = loadTrainer(FILE, { storage }), b = loadTrainer(FILE, { storage });
  for (const [t, k] of [[a, 'angSum'], [b, 'extAng']]) {
    t.run(`tr={t:build(${JSON.stringify(k)},SUBS[${JSON.stringify(k)}].proto,{}),shown:false,done:false};trFinish();`);
  }
  const rec = readKey(storage)[TID];
  eq(rec.solvedByType.angSum, 1, 'tab A');
  eq(rec.solvedByType.extAng, 1, 'tab B');
  eq(rec.train.independent, 2, 'combined counters');
}
console.log(JSON.stringify({status:'PASS',kinds:keys.length,synthetic_attempts:attempts,assertions:checks,browser:false}));
