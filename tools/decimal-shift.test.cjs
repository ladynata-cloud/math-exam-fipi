'use strict';
const assert = require('node:assert/strict');
const {model} = require('../trainers/oge-basics/multiplication-division/decimal-shift.js');

// Independent rational oracle: compare exact integers, never floating point.
function rational(text) {
  const [whole, fraction = ''] = String(text).replace('.', ',').split(',');
  return [BigInt(whole + fraction), 10n ** BigInt(fraction.length)];
}
function scalesBy(before, after, power) {
  const [a, ad] = rational(before), [b, bd] = rational(after);
  assert.equal(b * ad, a * bd * 10n ** BigInt(power));
}
const examples = [
  ['4,8', '1,2', 1, '48', '12'],
  ['0,84', '0,4', 1, '8,4', '4'],
  ['0,084', '0,4', 1, '0,84', '4'],
  ['1', '0,25', 2, '100', '25'],
  ['1', '0,025', 3, '1000', '25'],
  ['2,04', '0,02', 2, '204', '2'],
  ['12,096', '2,24', 2, '1209,6', '224'],
  ['4,5', '0,125', 3, '4500', '125'],
  ['0', '0,4', 1, '0', '4'],
  ['0001.20', '00.040', 3, '1200', '40'],
  ['999999999999,999999', '0,000001', 6, '999999999999999999', '1']
];
for (const [a, b, shift, newA, newB] of examples) {
  const m = model(a, b);
  assert.equal(m.target, shift);
  assert.deepEqual(m.at(shift), {dividend:newA, divisor:newB, factor:'1' + '0'.repeat(shift)});
}

let checks = 0;
for (let decimals = 0; decimals <= 6; decimals++) {
  for (let n = 1; n <= 80; n++) {
    const a = `${n % 5},${String(n * 97).padStart(6, '0')}`;
    const b = decimals ? `0,${String(n).padStart(decimals, '0').slice(-decimals).replace(/0$/, '1')}` : String(n);
    const m = model(a, b);
    for (let k = 0; k <= m.maxShift; k++) {
      const next = m.at(k);
      scalesBy(a, next.dividend, k);
      scalesBy(b, next.divisor, k);
      const [an, ad] = rational(a), [bn, bd] = rational(b);
      const [cn, cd] = rational(next.dividend), [dn, dd] = rational(next.divisor);
      assert.equal(an * bd * cd * dn, cn * dd * ad * bn, 'Quotient must not change');
      assert.equal(next.factor, (10n ** BigInt(k)).toString());
      checks++;
    }
    assert.ok(!m.at(m.target).divisor.includes(','), 'Divisor must become natural');
    for (const invalid of [-1, m.maxShift + 1, 0.5, NaN, Infinity, '1', null]) assert.throws(() => m.at(invalid));
  }
}
for (const zero of ['0', '0,000', '000.0']) assert.throws(() => model('1', zero));
for (const bad of ['', ' ', '1,', ',5', '-2', '1e3', '2/3', 'Infinity', '1,2,3', '1,1234567']) {
  assert.throws(() => model(bad, '2'));
  assert.throws(() => model('2', bad));
}
console.log(`DECIMAL_SHIFT_MATH_OK: ${examples.length} examples; ${checks} exact scaling and quotient properties`);
