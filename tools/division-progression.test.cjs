'use strict';
const assert = require('node:assert/strict');
const G = require('../trainers/oge-basics/multiplication-division/division-guided-core.js');
function rational(text) {
  const [whole, fraction = ''] = String(text).replace(',', '.').split('.');
  return {n:BigInt(whole + fraction), d:10n ** BigInt(fraction.length)};
}
let plans = 0;
for (const topic of G.topics) for (let tier = 0; tier < 3; tier++) {
  const divisors = new Set();
  for (let sequence = 0; sequence < 350; sequence++) {
    const task = G.makeProgressive(topic.id, sequence, tier), p = G.plan(task);
    assert.deepEqual(task, G.makeProgressive(topic.id, sequence, tier));
    const a = rational(task.dividend), b = rational(task.divisor), q = rational(p.quotient);
    if (task.level === 'remainder') assert.equal(a.n, b.n * q.n + BigInt(p.remainder));
    else assert.equal(a.n * b.d * q.d, b.n * q.n * a.d, 'independent exact rational oracle');
    for (const cycle of p.cycles) {
      assert.equal(cycle.qd, Math.floor(cycle.partial / p.normalizedDivisor));
      assert.equal(cycle.remainder, cycle.partial % p.normalizedDivisor);
      assert(cycle.remainder >= 0 && cycle.remainder < p.normalizedDivisor);
    }
    if (sequence > 0) {
      if (topic.id === 'oneDigit') {
        assert.equal(p.quotient.length, tier + 2, 'one more written quotient digit per practice band');
        assert(!p.quotient.includes('0'), 'zeros have a dedicated lesson');
      }
      if (topic.id === 'zero') assert(p.quotient.includes('0'));
      if (topic.id === 'remainder') assert(Number(task.divisor) >= 2 && Number(task.divisor) <= 9, 'remainder practice does not introduce the later two-digit-divisor skill');
      divisors.add(task.divisor);
    }
    assert(p.actions.length < 180);
    plans++;
  }
  if (['oneDigit', 'zero', 'decimalNatural'].includes(topic.id)) assert.equal(divisors.size, 8, 'all one-digit divisors are practiced');
  if (topic.id === 'twoDigit') assert(divisors.size >= 38);
}
for (const tier of [-1, 3, '1', NaN]) assert.throws(() => G.makeProgressive('oneDigit', 1, tier));
function record(n, overrides = {}) {
  return {id:n, topic:'oneDigit', task:G.makeProgressive('oneDigit', n), repeated:false, errors:0, hints:0, reveals:0, ...overrides};
}
assert.deepEqual(G.progress([], 'oneDigit'), {completed:0, independent:0, supported:0, tier:0, target:3, ready:false});
const records = [record(0), record(1), record(2)];
assert.equal(G.progress(records, 'oneDigit').ready, true);
assert.equal(G.progress(records, 'oneDigit').tier, 1);
records.push(record(3, {hints:1}), record(4, {reveals:1}), record(5, {errors:1}), record(1));
assert.equal(G.progress(records, 'oneDigit').independent, 3, 'help, correction, reveal and duplicate are not extra independent practice');
const corrected = [record(0, {errors:1}), record(0)];
assert.equal(G.progress(corrected, 'oneDigit').independent, 0, 'a repeated failed example cannot become a new unseen success');
assert.equal(G.progress(Array.from({length:6}, (_, n) => record(n)), 'oneDigit').tier, 2);
console.log('DIVISION_PROGRESSION_OK: ' + plans + ' independently checked exact plans, divisor variety, difficulty bands and honest progress');
