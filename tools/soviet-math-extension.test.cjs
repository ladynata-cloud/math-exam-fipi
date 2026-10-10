'use strict';

// Separate reference calculations for batch two. The public prompt is the
// source of the operands; no production arithmetic helper is used as oracle.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const C = require('../soviet-math/course.js');
const sources = require('../soviet-math/sources.js');
const root = path.resolve(__dirname, '..');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const jsonSha = value => sha(JSON.stringify(value));

// Pinned from base b0b2fe8e4d2cbf15426a9a314674bf7a2edce4f9, tree
// 619b9a1a189bc6669f9e91441913f8e3836b3266. Content includes the complete topic
// object and all 12 authored variants, or the original 1000 division samples.
// Historical evidence, not a prohibition on the owner's authorized revision.
// Current lessons and MP4s are deliberately replaced at their existing URLs.
const FIRST_BATCH = [
  {
    "id": "bonds",
    "content": "232d39d8fefc546e58d20fa000a69dbfbfe91401f3694933c18d1683067b4054",
    "mediaEntry": "2ab7f5a1b09fef4fc206ab148f9a3df2328bd741adb5ef2b5ba5544c7d27072d"
  },
  {
    "id": "compare",
    "content": "057261f86c600dfd6cceb06c63525be90afaf6693f2df3603633ec61e83736e6",
    "mediaEntry": "42adab4fdbe798b9957bf458e3562a95d771dfee3bfb9925f7574a343a4a74b0"
  },
  {
    "id": "add-ten",
    "content": "e38027cf7566acabfd83376273eb330bff17662ec06e4fcfc6c565cdfaf987a5",
    "mediaEntry": "e3b4a402680729fee926e5ccda76ab1e69e1c14495085374afa4bc1f420c068c"
  },
  {
    "id": "subtract-ten",
    "content": "b93ae6e5cb2aeac1edb635960cc4502dd2dfa54fe66d4d0a11456930ed161325",
    "mediaEntry": "cbc0cc93e04dd1eefb6d37e9a46eb9fe7f358787e1c027c6e7ab68bf7bf5b334"
  },
  {
    "id": "add-twenty",
    "content": "b34194c332b7f86b45609d5f634aebbb3ddcc402fa1793b3050c77cb52c1d9f3",
    "mediaEntry": "ad2852feeade85b3a88c53249b2eac9a58c71a12669ab42ce40f837c796c723d"
  },
  {
    "id": "subtract-twenty",
    "content": "79a9bcf62bc35259dca42f4001023f0d1168064ede932a29c8d0a1ab65751c9e",
    "mediaEntry": "73bca479f4d60b269dc76ebb59b523acb288bc3076e288abcdf9188047a056fe"
  },
  {
    "id": "place-value",
    "content": "646bc103728514e851f149d1c9360797af6c302eb4d97434d603889a5913934f",
    "mediaEntry": "364fc9bc962124a5e33a9abac553f0876796d55d75d41c9ad4c86d9b50898023"
  },
  {
    "id": "stories",
    "content": "3a4510de276ee98885c777d50189fb21b4937c4634f55eee1f9dfa2af04146fb",
    "mediaEntry": "1053fe5f5ffecbdc3d37fd7f33008096c42067fd0aae90d555cf61e4911c35c3"
  },
  {
    "id": "groups",
    "content": "7503d9a311352e2c00f4ab3ed696898183345da6e09a7753368e8c262539d2fd",
    "mediaEntry": "cb3e0455ce2e8ddaa62d01f5946d987e9fd22df0633215870010c1e19cafc757"
  },
  {
    "id": "sharing",
    "content": "4d2783c38511822a5dc3b445cb5e6241c91416a284d0bb7a511d5b14ddf66e8f",
    "mediaEntry": "92e7919928ed7168a089a9e7a9b23fff0afc5d0772da0192377ddbea49cf9131"
  },
  {
    "id": "times-table",
    "content": "0ac51c5680046a6202e3076dac46241e980b60520c8aa0f9fa31e014b7879dab",
    "mediaEntry": "df9b7141e84cf753a5d04016afa2e6659778791051a438e3b45dca2c9e3303f1"
  },
  {
    "id": "column-add",
    "content": "59088fd9dabd2c6a67077324a38ef2ec0ee78d1c5d57873288ef4f97c3f5e8be",
    "mediaEntry": "724d5d46dfc929160ce0ebd1f5034a0cabe73aebff2dcfc49113e85433911e7d"
  },
  {
    "id": "column-subtract",
    "content": "625ec03edda06876a2375c9b4bccc8ff5b44817cfce1117b6c14463eaaa1504d",
    "mediaEntry": "85e6c375b48f14e9e9ab378bf4be09152ed0c60ebca1459ed488ecd3155da28e"
  },
  {
    "id": "column-multiply",
    "content": "d01747e2fe8731f50496b97a7c8f782b36a3faaf2ef93b3bf963558e465b9823",
    "mediaEntry": "6c43184c8ad96e954d29196e1fc1dca594e3ef9a97c32852b85d4741c085fea3"
  },
  {
    "id": "order",
    "content": "6db39a1673fbd49894f8a49de004eec4e3ed6081dc71f00f837e784bc5410bf8",
    "mediaEntry": "64f78b84c5c6f02d294d9991d0eb242d7dcaf54e10598a628958d281ab4e9732"
  },
  {
    "id": "divide-simple",
    "content": "cdca1ed2fce5336919f3e2c7f56b66c32e336e31d26abb92acb1c11932b20d1c",
    "mediaEntry": "6136910d1c7e9f246ef97c0189f97ed7931ac534bb958f998537f4fc95918854"
  },
  {
    "id": "divide-zero",
    "content": "90f31fc171d8bde421025907688d88a20356d403d19bc17769a4b0d7c581d235",
    "mediaEntry": "ae205cc5c57bee80463d3ed57fa1ebb342b05131891fc041c69a7a00bf45b2d7"
  },
  {
    "id": "divide-remainder",
    "content": "c59d7046eeffdbd44e1873fbc6920c2cd44845ca3f4a6225629c6bd6694e89f8",
    "mediaEntry": "04bd347fe0f0e034915009e52e9fd012f419c84b12ec4246f4d62c5745e29d62"
  },
  {
    "id": "divide-two",
    "content": "7de903ff2e2c7bfb4f66f51307fb8a457b2e4c9139893be6d35b57631e5399f4",
    "mediaEntry": "0675c059bac3e46e270e6b459aa1c8efda4196bab8c4cca8bb38680186852110"
  },
  {
    "id": "divide-decimal-natural",
    "content": "b6aff90ec4ebb4975672deb19327dc3efe0309319709aeee017e276cb1a373f5",
    "mediaEntry": "36b550d1fe1451ce35150871224feddabc8ece18230cff462fa42b0e856c7423"
  },
  {
    "id": "fraction-meaning",
    "content": "69a0c5ed826689d09c36610303b20a83377f5b9b18ad4f10fd7e3b2ef75fdbf2",
    "mediaEntry": "d562bb8e62f451134fd00cd97e640e49a44d7c37ddc00dafe2a6cf98127b865c"
  },
  {
    "id": "fraction-reduce",
    "content": "9cc34fbb7e52222e9ea4db1e1ac1c29b4bfb84c266a2aba854289bc1e94d1283",
    "mediaEntry": "3449d0ad42c4f2e47371e02ac2fd3439f464a515ef819b671d910e17df79e77e"
  },
  {
    "id": "fraction-add",
    "content": "704f7d4f5f7ea7a8e4aa4dac264bbc587612bc13d8c3c372655353b0645f3ac2",
    "mediaEntry": "d300c41ebafde8716ed0f082d80436c86001f9638e95071a36f2c9ab54e4e878"
  },
  {
    "id": "fraction-multiply",
    "content": "c56ba59d9f0d1a326f2caf12d634164831cdc27f626de092e275bd4eecffac3d",
    "mediaEntry": "abdb5329c5a1cfd64500c443ebe446304d15a8c60e9829003b182d122b9a9c91"
  },
  {
    "id": "fraction-divide",
    "content": "b2cfe99dec613d8739f1ebf0c8df8010731b2860b479193934f11431f6ea3e06",
    "mediaEntry": "5e0c365961773d705b4a7f11c4760447eb53ba47ef147cdc146842f2bb0e267a"
  },
  {
    "id": "decimal-add",
    "content": "df727773b8e02272463cd1d7d28c72470cf1a084ae36cd2d5a0eba9b6a8b7b67",
    "mediaEntry": "718387af2e9f9b1776e5abfb23da3215d9f78c588875b3bcb477f562f5812e5e"
  },
  {
    "id": "divide-decimal",
    "content": "03f418904f2a8ef857f85ee40177959a9156735b7179deeb5eba03159f4ba4c9",
    "mediaEntry": "933cab68dc7b0413a58a368eeed8ff5be8c357c87e30ef1bd5eda4993b2e6b20"
  },
  {
    "id": "percent-part",
    "content": "ee15a61a23eb31f5f6497b35f31342bc7602fe0b4f15b0ecf8e1e47bbf3388fc",
    "mediaEntry": "1c5aed51d4ac4eb3416096e1e0a590b3c83119ebc85efc061b26a4ed1bb04da3"
  },
  {
    "id": "percent-whole",
    "content": "969a8262826c6ff7640a7a8f3c400ae43721087f561283ab18d21d756b11f471",
    "mediaEntry": "b88d83c14daf28ee0a4501ac13f49631d299a4478816fd3014fe7c6b34e3adb5"
  },
  {
    "id": "percent-ratio",
    "content": "9b4be65f34d3b228516512edab6a0380e4dd092cafb72e9df60b626ad3c139f0",
    "mediaEntry": "0433b62532bb6b6b09bb528066f26907ba1212943476218727e6684f49671e54"
  }
];
const oldIds = new Set(FIRST_BATCH.map(item => item.id));
const manifest = require('../soviet-math/media/manifest.json');
assert.deepEqual(C.topics.filter(topic => oldIds.has(topic.id)).map(topic => topic.id), FIRST_BATCH.map(item => item.id), 'original topic order and addresses survive');
assert.equal(C.revision, 2);
assert.equal(typeof C.legacyMake, 'function');
let matchingLegacySnapshots = 0;
for (const baseline of FIRST_BATCH) {
  const topic = C.topics.find(item => item.id === baseline.id);
  assert.ok(topic, 'lost original topic: ' + baseline.id);
  const legacyTopic = [...require('../soviet-math/primary.js').topics, ...require('../soviet-math/advanced.js').topics].find(item => item.id === baseline.id);
  assert.ok(legacyTopic, 'legacy task remains identifiable: ' + baseline.id);
  const plans = Array.from({length: baseline.id.startsWith('divide-') ? 1000 : 12}, (_, i) => C.legacyMake(baseline.id, i));
  if (jsonSha({topic: legacyTopic, plans}) === baseline.content) matchingLegacySnapshots++;
  const entry = manifest.lessons.find(item => item.id === baseline.id);
  assert.ok(entry, 'existing video address remains registered: ' + baseline.id);
  assert.equal(entry.file, baseline.id + '.mp4', 'existing download URL remains valid: ' + baseline.id);
  assert.equal(sha(fs.readFileSync(path.join(root, 'soviet-math/media', entry.file))), entry.sha256, 'current recording matches its manifest: ' + baseline.id);
}

// New-topic mathematical oracles follow below.
const NEW_IDS = [
  'number-neighbors', 'zero-actions', 'compare-three-digit', 'add-round-tens',
  'subtract-round-tens', 'add-two-digit-mental', 'subtract-two-digit-mental',
  'multiply-by-ten-hundred', 'divide-by-ten-hundred', 'unknown-addend',
  'fraction-compare-same-den', 'fraction-compare-same-num', 'fraction-equivalent',
  'fraction-to-mixed', 'mixed-to-fraction', 'fraction-subtract', 'mixed-add-same-den',
  'mixed-subtract-borrow', 'fraction-of-number', 'number-from-fraction',
  'decimal-place-value', 'decimal-compare', 'decimal-subtract', 'decimal-multiply',
  'decimal-multiply-ten', 'decimal-divide-ten', 'measure-length', 'measure-time',
  'motion-distance', 'motion-speed'
];
const newTopics = C.topics.filter(topic => !oldIds.has(topic.id));
assert.equal(newTopics.length, 30);
assert.deepEqual(new Set(newTopics.map(topic => topic.id)), new Set(NEW_IDS));
assert.equal(C.topics.length, FIRST_BATCH.length + NEW_IDS.length);

function gcdBig(a, b) { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; }
function rational(value) {
  if (Array.isArray(value)) return value;
  const s = String(value).trim().replace(/−/g, '-').replace(/,/g, '.');
  const mixed = s.match(/^(-?)(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    const [, sign, w, n, d] = mixed;
    assert.notEqual(BigInt(d), 0n);
    return [(sign ? -1n : 1n) * (BigInt(w) * BigInt(d) + BigInt(n)), BigInt(d)];
  }
  const parts = s.split('/');
  if (parts.length === 2) return div(rational(parts[0]), rational(parts[1]));
  const m = s.match(/^(-?)(\d+)(?:\.(\d+))?$/);
  assert.ok(m, 'Cannot parse reference number: ' + value);
  return [BigInt(m[1] + m[2] + (m[3] || '')), 10n ** BigInt((m[3] || '').length)];
}
const plus = (x, y) => { const a = rational(x), b = rational(y); return [a[0] * b[1] + b[0] * a[1], a[1] * b[1]]; };
const minus = (x, y) => { const a = rational(x), b = rational(y); return [a[0] * b[1] - b[0] * a[1], a[1] * b[1]]; };
const mul = (x, y) => { const a = rational(x), b = rational(y); return [a[0] * b[0], a[1] * b[1]]; };
const div = (x, y) => { const a = rational(x), b = rational(y); assert.notEqual(b[0], 0n); return [a[0] * b[1], a[1] * b[0]]; };
const cmp = (x, y) => { const a = rational(x), b = rational(y); const delta = a[0] * b[1] - b[0] * a[1]; return delta < 0n ? -1 : delta > 0n ? 1 : 0; };
const canonical = value => { let [n, d] = rational(value); const g = gcdBig(n, d); n /= g; d /= g; if (d < 0n) {n = -n; d = -d;} return d === 1n ? String(n) : n + '/' + d; };
const same = (actual, expected, message) => assert.equal(canonical(actual), canonical(expected), message);
const numericTokens = text => text.match(/\d+(?:,\d+)?/g) || [];
const integerTokens = text => numericTokens(text).map(Number);

function primaryOracle(plan) {
  const [a, b] = integerTokens(plan.prompt);
  switch (plan.topicId) {
    case 'number-neighbors': return { answer: a + 1, steps: [a - 1, a + 1] };
    case 'zero-actions': return { answer: a, steps: [a, 0, a] };
    case 'compare-three-digit': return { answer: Math.max(a, b), steps: [Math.max(a, b)] };
    case 'add-round-tens': return { answer: a + b, steps: [a + b] };
    case 'subtract-round-tens': return { answer: a - b, steps: [a - b] };
    case 'add-two-digit-mental': return { answer: a + b, steps: [a + b - b % 10, a + b] };
    case 'subtract-two-digit-mental': return { answer: a - b, steps: [a - b + b % 10, a - b] };
    case 'multiply-by-ten-hundred': return { answer: a * b, steps: [a * b] };
    case 'divide-by-ten-hundred': return { answer: a / b, steps: [a / b] };
    case 'unknown-addend': return { answer: b - a, steps: [b - a, b] };
    default: return null;
  }
}
function fractionOracle(plan) {
  const [a, b, c, d, e, f] = integerTokens(plan.prompt);
  const gcd = (x, y) => Number(gcdBig(BigInt(x), BigInt(y)));
  switch (plan.topicId) {
    case 'fraction-compare-same-den': {
      assert.equal(b, d, 'same-denominator task really has equal denominators');
      const result = cmp(a + '/' + b, c + '/' + d) > 0 ? a + '/' + b : c + '/' + d;
      return { answer: result, steps: [result] };
    }
    case 'fraction-compare-same-num': {
      assert.equal(a, c, 'same-numerator task really has equal numerators');
      const result = cmp(a + '/' + b, c + '/' + d) > 0 ? a + '/' + b : c + '/' + d;
      return { answer: result, steps: [result] };
    }
    case 'fraction-equivalent': return { answer: a + '/' + b, steps: [c / b, a + '/' + b] };
    case 'fraction-to-mixed': {
      return { answer: a + '/' + b, steps: [Math.floor(a / b), a + '/' + b] };
    }
    case 'mixed-to-fraction': return { answer: plus(a, b + '/' + c), steps: [a * c, plus(a, b + '/' + c)] };
    case 'fraction-subtract': {
      const common = b * d / gcd(b, d), left = a * common / b, right = c * common / d;
      const result = minus(a + '/' + b, c + '/' + d);
      return { answer: result, steps: [...(b !== common ? [left] : []), ...(d !== common ? [right] : []), result] };
    }
    case 'mixed-add-same-den': {
      assert.equal(c, f);
      const result = plus(plus(a, b + '/' + c), plus(d, e + '/' + f));
      return { answer: result, steps: [a + d, (b + e) + '/' + c, result] };
    }
    case 'mixed-subtract-borrow': {
      assert.equal(c, f);
      assert.ok(b < e, 'this exercise requires borrowing');
      const result = minus(plus(a, b + '/' + c), plus(d, e + '/' + f));
      return { answer: result, steps: [b + c, (b + c - e) + '/' + c, result] };
    }
    case 'fraction-of-number': return { answer: mul(a, b + '/' + c), steps: [div(a, c), mul(a, b + '/' + c)] };
    case 'number-from-fraction': return { answer: div(a, b + '/' + c), steps: [div(a, b), div(a, b + '/' + c)] };
    default: return null;
  }
}
function answerFormChecks(step, label) {
  assert.equal(C.check(step.answer, step), true, label + ': expected answer is accepted');
  assert.equal(C.check('', step), false, label + ': blank is not an answer');
  assert.equal(C.check(canonical(plus(step.answer, 1)), step), false, label + ': one-unit error is rejected');
  if (step.checkKind === 'reduced-fraction') {
    const [n, d] = rational(step.answer);
    assert.equal(C.check((n * 2n) + '/' + (d * 2n), step), false, label + ': reduction is required');
  }
  if (step.checkKind === 'fraction-denominator') {
    const match = step.answer.match(/^(\d+)\/(\d+)$/);
    assert.ok(match, label + ': explicit fraction');
    const [, n, d] = match;
    assert.equal(BigInt(d), BigInt(step.denominator));
    assert.equal(C.check((BigInt(n) * 2n) + '/' + (BigInt(d) * 2n), step), false, label + ': denominator cannot change');
    assert.equal(C.check(canonical(step.answer), step), canonical(step.answer) === step.answer, label + ': simplified notation is valid only when it preserves the requested denominator');
    assert.equal(C.check(n + '/0', step), false);
  }
  if (step.checkKind === 'mixed-number') {
    const match = step.answer.match(/^(\d+) (\d+)\/(\d+)$/);
    assert.ok(match, label + ': explicit mixed number');
    const [, w, n, d] = match;
    assert.ok(BigInt(w) > 0n && BigInt(n) > 0n && BigInt(n) < BigInt(d));
    assert.equal(gcdBig(BigInt(n), BigInt(d)), 1n);
    assert.equal(C.check(w + ' ' + (BigInt(n) * 2n) + '/' + (BigInt(d) * 2n), step), false, label + ': mixed tail must be reduced');
    assert.equal(C.check((BigInt(w) - 1n) + ' ' + (BigInt(n) + BigInt(d)) + '/' + d, step), false, label + ': improper tail is rejected');
    assert.equal(C.check(canonical(step.answer), step), false, label + ': improper fraction is not mixed notation');
  }
}

function applicationOracle(plan) {
  const [a, b] = numericTokens(plan.prompt);
  switch (plan.topicId) {
    case 'decimal-place-value': {
      const scaled = Number(canonical(mul(a, 1000)));
      return { answer: scaled, steps: [Math.floor(scaled / 100) % 10, Math.floor(scaled / 10) % 10, scaled] };
    }
    case 'decimal-compare': {
      const result = cmp(a, b) > 0 ? a : b;
      return { answer: result, steps: [result] };
    }
    case 'decimal-subtract': {
      const result = minus(a, b);
      return { answer: result, steps: [mul(result, 100), result] };
    }
    case 'decimal-multiply': {
      return { answer: mul(a, b), steps: [mul(a.replace(',', ''), b.replace(',', '')), mul(a, b)] };
    }
    case 'decimal-multiply-ten': return { answer: mul(a, b), steps: [mul(a, b)] };
    case 'decimal-divide-ten': return { answer: div(a, b), steps: [div(a, b)] };
    case 'measure-length': return { answer: plus(mul(a, 100), b), steps: [mul(a, 100), plus(mul(a, 100), b)] };
    case 'measure-time': return { answer: plus(mul(a, 60), b), steps: [mul(a, 60), plus(mul(a, 60), b)] };
    // The story gives elapsed time first, then speed or total distance.
    // The last step checks the solution, so it need not equal plan.answer.
    case 'motion-distance': return { answer: mul(a, b), steps: [mul(a, b), b] };
    case 'motion-speed': return { answer: div(b, a), steps: [div(b, a), b] };
    default: return null;
  }
}

function revisedPrimaryOracle(plan) {
  const [a, b, c = 0, d = 0] = integerTokens(plan.prompt);
  switch (plan.topicId) {
    case 'bonds': return {answer: a - b, steps: [a - b]};
    case 'compare': return {answer: Math.max(a, b), steps: [Math.max(a, b)]};
    case 'add-ten': return {answer: a + b, steps: [a + b]};
    case 'subtract-ten': return {answer: a - b, steps: [a - b]};
    case 'add-twenty': return {answer: a + b, steps: [10 - a, a + b - 10, a + b]};
    case 'subtract-twenty': return {answer: a - b, steps: [a - 10, b - a + 10, a - b]};
    case 'place-value': {
      const bundles = [...plan.prompt.matchAll(/(\d+) пуч(?:ок|ка|ков) по (100|10) палочек/g)]
        .reduce((sum, match) => sum + Number(match[1]) * Number(match[2]), 0);
      const loose = Number(plan.prompt.match(/(\d+) палоч(?:ка|ки|ек) отдельно/)?.[1] || 0);
      assert.ok(bundles > 0, 'bundle counts are stated in the problem');
      assert.equal(plan.visual.value, bundles + loose, 'picture represents the stated bundles and loose sticks');
      return {answer: bundles + loose, steps: loose ? [bundles, bundles + loose] : [bundles]};
    }
    case 'stories': return {answer: 2 * a + b - c, steps: [a + b, 2 * a + b, ...(c ? [2 * a + b - c] : [])]};
    case 'groups': case 'times-table': return {answer: a * b, steps: [a * b]};
    case 'sharing': return {answer: a / b, steps: [a / b]};
    case 'column-add': case 'column-subtract': case 'column-multiply': {
      const addition = plan.topicId === 'column-add', subtraction = plan.topicId === 'column-subtract';
      const answer = addition ? a + b : subtraction ? a - b : a * b;
      // Compute from low-order prefixes independently of the lesson's mutable
      // carry/borrowing implementation. Subtraction writes each result digit;
      // addition/multiplication ask for the full sum/product in that column.
      const steps = Array.from({length: String(a).length}, (_, position) => {
        const unit = 10 ** position, modulus = unit * 10;
        return subtraction ? Math.floor(answer / unit) % 10 : Math.floor((addition
          ? a % modulus + b % modulus : (a % modulus) * b) / unit);
      });
      return {answer, steps};
    }
    case 'order': {
      const brackets = plan.prompt.includes('('), first = brackets ? a + b : b * c;
      const next = brackets ? first * c : a + first;
      return {answer: next - d, steps: [first, next, ...(d ? [next - d] : [])]};
    }
    default: return null;
  }
}
function revisedAdvancedOracle(plan) {
  const [a, b, c, d] = numericTokens(plan.prompt);
  const gcd = (x, y) => Number(gcdBig(BigInt(x), BigInt(y)));
  switch (plan.topicId) {
    case 'fraction-meaning': {
      const {n, d} = plan.visual.a;
      assert.ok(Number.isInteger(n) && Number.isInteger(d) && n > 0 && n < d);
      return {answer: n + '/' + d, steps: [d, n, n + '/' + d]};
    }
    case 'fraction-reduce': return {answer: a + '/' + b, steps: [Number(b) / gcd(a, b), a + '/' + b]};
    case 'fraction-add': case 'fraction-divide': {
      const common = Number(b) * Number(d) / gcd(b, d), steps = [];
      if (Number(b) !== common) steps.push(Number(a) * common / Number(b));
      if (Number(d) !== common) steps.push(Number(c) * common / Number(d));
      const answer = (plan.topicId === 'fraction-add' ? plus : div)(a + '/' + b, c + '/' + d);
      return {answer, steps: [...steps, answer]};
    }
    case 'fraction-multiply': {
      const answer = mul(a + '/' + b, c + '/' + d);
      return {answer, steps: [Number(b) * Number(d), answer]};
    }
    case 'decimal-add': {
      const left = Number(canonical(mul(a, 100))), right = Number(canonical(mul(b, 100)));
      return {answer: plus(a, b), steps: [left % 100 + right % 100, plus(a, b)]};
    }
    case 'percent-part': return {answer: div(mul(a, b), 100), steps: [mul(a, b), div(mul(a, b), 100)]};
    case 'percent-whole': return {answer: div(mul(a, 100), b), steps: [mul(a, 100), div(mul(a, 100), b)]};
    case 'percent-ratio': return {answer: div(mul(b, 100), a), steps: [mul(b, 100), div(mul(b, 100), a)]};
    default: return null;
  }
}

// All thirty existing addresses intentionally route to reviewed revised
// modules. The old module remains independently tested for saved histories.
const revisedParts = ['revised-primary', 'revised-advanced', 'revised-division'].map(name => require('../soviet-math/' + name + '.js'));
const revisedTopics = revisedParts.flatMap(part => part.topics);
assert.equal(revisedTopics.length, FIRST_BATCH.length);
assert.deepEqual(new Set(revisedTopics.map(topic => topic.id)), oldIds);
let revisedExamples = 0, revisedSteps = 0, zeroDigits = 0;
for (const topic of revisedTopics) {
  const division = topic.id.startsWith('divide-'), identities = new Set();
  for (let index = 0; index < (division ? 1000 : 12); index++) {
    const plan = C.make(topic.id, index), label = 'revised/' + topic.id + '/' + index;
    const modulePlan = revisedParts.find(part => part.topics.some(item => item.id === topic.id)).make(topic.id, index);
    assert.deepEqual(plan, {...modulePlan, index, revision: 2}, label + ': revised plan is the active course plan');
    assert.equal(plan.revision, 2);
    assert.ok(plan.steps.length >= 1, label + ': at least one meaningful decision');
    if (!division) {
      const reference = revisedPrimaryOracle(plan) || revisedAdvancedOracle(plan);
      assert.ok(reference, label + ': independent oracle covers this topic');
      same(plan.answer, reference.answer, label + ': final answer');
      assert.equal(plan.steps.length, reference.steps.length, label + ': meaningful instructional steps');
      plan.steps.forEach((step, i) => {
        same(step.answer, reference.steps[i], label + ': intermediate ' + i);
        answerFormChecks(step, label + ': answer form ' + i);
      });
      identities.add(JSON.stringify({prompt: plan.prompt, visual: plan.visual}));
      assert.deepEqual({...C.make(topic.id, index + 12), index}, plan, label + ': twelve-example cycle');
    } else {
      const p = plan.division, legacy = C.legacyMake(topic.id, index).division;
      assert.deepEqual(p.baseActions, legacy.baseActions, label + ': complete written angle is retained');
      assert.deepEqual(p.cycles, legacy.cycles, label + ': every division cycle is retained');
      const [dividend, divisor] = numericTokens(plan.prompt), remainder = p.task.level === 'remainder' ? p.remainder : 0;
      same(plus(mul(divisor, p.quotient), remainder), dividend, label + ': inverse calculation');
      assert.ok(cmp(remainder, 0) >= 0 && cmp(remainder, divisor) < 0, label + ': valid remainder');
      assert.equal(plan.answer, p.task.level === 'remainder' ? p.quotient + ' (ост. ' + p.remainder + ')' : p.quotient);
      let previous = null, quotientWritten = '', priorEnd = 0;
      for (const cycle of p.cycles) {
        assert.equal(cycle.qd, Math.floor(cycle.partial / p.normalizedDivisor), label + ': quotient digit');
        assert.equal(cycle.product, cycle.qd * p.normalizedDivisor, label + ': trial product');
        assert.equal(cycle.remainder, cycle.partial - cycle.product, label + ': remaining part');
        assert.ok(cycle.qd >= 0 && cycle.qd <= 9 && cycle.remainder >= 0 && cycle.remainder < p.normalizedDivisor);
        if (previous) assert.equal(cycle.partial, previous.remainder * 10 + p.digits[cycle.sourceIndex], label + ': next partial dividend');
        previous = cycle;
      }
      const checkpoints = plan.divisionPresentation.checkpoints;
      assert.equal(checkpoints.length, plan.steps.length);
      plan.steps.forEach((step, i) => {
        const raw = step.raw, checkpoint = checkpoints[i], cycle = p.cycles[raw.cycle];
        assert.equal(C.check(step.answer, step), true, label + ': core accepts expected answer');
        assert.equal(C.check('', step), false);
        assert.ok(checkpoint.before >= priorEnd && checkpoint.after > checkpoint.before && checkpoint.after <= p.baseActions.length);
        assert.ok(raw.baseStep >= checkpoint.before && raw.baseStep < checkpoint.after, label + ': answer is not visible before the question');
        assert.deepEqual(checkpoint.automatic, p.baseActions.slice(priorEnd, checkpoint.before), label + ': omitted questions still receive visible explanations');
        assert.deepEqual(checkpoint.focus, raw);
        switch (raw.kind) {
          case 'digit': same(step.answer, cycle.qd); quotientWritten += step.answer; if (!cycle.qd) {zeroDigits++; assert.equal(checkpoint.after, cycle.subtractAction + 1);} break;
          case 'subtract': same(step.answer, cycle.remainder); assert.notEqual(cycle.qd, 0, label + ': no redundant zero-subtraction question'); break;
          case 'partial': {
            const [rest, digit] = integerTokens(step.prompt);
            assert.ok(rest > 0, label + ': zero-remainder bringing down is explained automatically');
            same(step.answer, rest * 10 + digit); break;
          }
          case 'comma': assert.equal(step.answer, quotientWritten + ','); quotientWritten += ','; break;
          case 'shift-factor': {
            let factor = 1;
            while (canonical(mul(divisor, factor)).includes('/')) factor *= 10;
            same(step.answer, factor);
            same(p.normalizedDividend, mul(dividend, factor));
            same(p.normalizedDivisor, mul(divisor, factor)); break;
          }
          case 'verify': same(step.answer, dividend); break;
          default: assert.fail(label + ': unsupported revised decision ' + raw.kind);
        }
        priorEnd = checkpoint.after;
      });
      assert.equal(priorEnd, p.baseActions.length, label + ': final verification retains the whole angle');
      same(quotientWritten, p.quotient, label + ': no zero quotient digit is dropped');
    }
    plan.steps.forEach((step, i) => {
      assert.ok(typeof step.prompt === 'string' && step.prompt.length && typeof step.record === 'string' && step.record.length, label + ': written step ' + i);
      assert.ok(Array.isArray(step.helper), label + ': explanation belongs to the current step');
      if (step.record.includes('=') && step.record.length > 8) assert.ok(!step.prompt.includes(step.record), label + ': question does not contain its completed working');
    });
    revisedExamples++;
    revisedSteps += plan.steps.length;
  }
  if (!division) assert.equal(identities.size, 12, topic.id + ': twelve distinct revised exercises');
}

let examples = 0, steps = 0;
const forms = new Set();
for (const topic of newTopics) {
  const identities = new Set();
  assert.ok(sources.forTopic(topic.id), topic.id + ': source metadata exists');
  for (let index = 0; index < 12; index++) {
    const plan = C.make(topic.id, index);
    const label = topic.id + '/' + index;
    assert.equal(plan.topicId, topic.id, label);
    assert.equal(plan.index, index, label);
    assert.equal(plan.kind, 'standard', label);
    assert.ok(plan.steps.length >= 1 && plan.steps.length <= 6, label + ': no forced microsteps and readable board capacity');
    const identity = JSON.stringify({prompt: plan.prompt, visual: plan.visual});
    assert.ok(!identities.has(identity), label + ': authored examples are distinct');
    identities.add(identity);
    const reference = primaryOracle(plan) || fractionOracle(plan) || applicationOracle(plan);
    assert.ok(reference, label + ': has independent arithmetic oracle');
    same(plan.answer, reference.answer, label + ': final answer');
    assert.equal(plan.steps.length, reference.steps.length, label + ': expected instructional steps');
    plan.steps.forEach((step, index) => {
      const stepLabel = label + '/step-' + index;
      same(step.answer, reference.steps[index], stepLabel + ': intermediate answer');
      for (const key of ['prompt', 'answer', 'hint', 'record']) assert.equal(typeof step[key], 'string', stepLabel + ': ' + key);
      assert.ok(step.record.length > 0 && step.record.length < 45, stepLabel + ': short cumulative record');
      assert.ok(Array.isArray(step.helper) && step.helper.length > 0, stepLabel + ': contextual helper');
      step.helper.forEach(line => assert.equal(typeof line, 'string', stepLabel + ': helper text'));
      answerFormChecks(step, stepLabel);
      if (step.checkKind) forms.add(step.checkKind);
      steps++;
    });
    const repeated = C.make(topic.id, index + 12);
    assert.deepEqual({...repeated, index}, plan, label + ': deterministic 12-example cycle');
    examples++;
  }
  assert.equal(identities.size, 12);
}
assert.deepEqual(forms, new Set(['fraction-denominator', 'mixed-number', 'reduced-fraction']));

// Shared numeric parsing must understand a mixed number before removing spaces.
for (const [input, expected] of [['2 1/3', 7 / 3], ['-2 1/3', -7 / 3], ['2 6/8', 2.75], ['2 3 / 4', 2.75], ['0 1/2', 0.5]]) {
  assert.ok(Math.abs(C.number(input) - expected) < 1e-12, 'mixed numeric parsing: ' + input);
}
for (const input of ['2 4/3', '2 1/0', '2 1/-3', '2 3/3', '2 1/3/4', '2 1,5/3', '2 1.5/3']) assert.ok(Number.isNaN(C.number(input)), 'invalid mixed input: ' + input);
const mixedExample = {answer: '2 3/4', checkKind: 'mixed-number'};
for (const input of ['2 3/4', ' 2  3 / 4 ']) assert.equal(C.check(input, mixedExample), true);
for (const input of ['2,75', '11/4', '2 6/8', '1 7/4', '0 11/4', '-2 3/4']) assert.equal(C.check(input, mixedExample), false);
const denominatorExample = {answer: '8/12', checkKind: 'fraction-denominator', denominator: 12};
for (const input of ['8/12', ' 8 / 12 ']) assert.equal(C.check(input, denominatorExample), true);
for (const input of ['2/3', '16/24', '0,6666666667', '8/0', '-8/-12', '7/12']) assert.equal(C.check(input, denominatorExample), false);

// The first published schema was version 1 and contained no course revision.
// Seed genuine legacy step positions, including a long division already well
// beyond the length of a newly condensed lesson. Migration must not validate
// those positions against a revised plan or resume at a different operation.
const progress = require('../soviet-math/progress.js');
const savedSession = (id, index, done = false, legacy = true) => {
  const plan = (legacy ? C.legacyMake : C.make)(id, index);
  return {topic: id, mode: 'practice', index, step: done ? plan.steps.length - 1 : Math.max(0, plan.steps.length - 2),
    accepted: done, done, draft: done ? String(plan.steps.at(-1).answer) : '17', errors: 2, help: 1, hint: false};
};
const oldRecords = FIRST_BATCH.map((topic, index) => ({topic: topic.id, index: 2, at: 1760000000000 + index,
  errors: index % 2, help: index % 3, repeated: index % 4 === 0}));
const oldState = {version: 1, lastTopic: 'divide-zero', lastMode: 'practice', motion: false,
  sessions: {'divide-zero:practice': savedSession('divide-zero', 7), 'fraction-reduce:practice': savedSession('fraction-reduce', 0, true)}, records: oldRecords};
const oldCopy = JSON.stringify(oldState);
const migrated = progress.readState(oldState);
assert.equal(JSON.stringify(oldState), oldCopy, 'migration does not mutate its source');
assert.equal(migrated.migrated, true);
assert.equal(migrated.state.version, 2, 'older app must reject a revised state before reading its steps');
assert.equal(migrated.state.courseRevision, 2);
assert.deepEqual(migrated.state.sessions, {}, 'revised lessons restart instead of resuming an unrelated step');
assert.deepEqual(migrated.state.previousSessions, oldState.sessions, 'every original session is retained intact');
assert.deepEqual(migrated.state.records, oldRecords.map(record => ({...record, revision: 1})), 'every old result retains its data and identity');
for (const field of ['lastTopic', 'lastMode', 'motion']) assert.deepEqual(migrated.state[field], oldState[field]);
const reread = progress.readState(migrated.state);
assert.equal(reread.migrated, false, 'migration is idempotent');
assert.deepEqual(reread.state, migrated.state);
const currentState = JSON.parse(JSON.stringify(migrated.state));
currentState.sessions['bonds:practice'] = savedSession('bonds', 1, false, false);
currentState.records.push({revision: 2, topic: 'bonds', index: 1, at: 1760000010000, errors: 0, help: 0, repeated: false});
assert.deepEqual(progress.readState(currentState), {state: currentState, migrated: false}, 'mixed old/new history and current attempts resume unchanged');
assert.deepEqual(progress.defaults(false), {version: 2, courseRevision: 2, lastTopic: '', lastMode: 'learn', sessions: {}, previousSessions: {}, records: [], motion: false});
const invalidStates = [
  {...oldState, version: 99}, {...oldState, courseRevision: 2}, {...currentState, courseRevision: 99},
  {...currentState, version: 1}, {...currentState, sessions: []},
  {...currentState, records: [{...currentState.records.at(-1), revision: 3}]},
  {...oldState, records: [{...oldRecords[0], revision: 2}]},
  {...currentState, records: [oldRecords[0]]},
  {...currentState, previousSessions: {'divide-zero:practice': {...oldState.sessions['divide-zero:practice'], step: 100000}}},
  {...oldState, sessions: {'divide-zero:practice': {...oldState.sessions['divide-zero:practice'], step: -1}}}
];
for (const [index, fixture] of invalidStates.entries()) {
  const before = JSON.stringify(fixture);
  assert.throws(() => progress.readState(fixture), 'invalid/future progress must be blocked: ' + index);
  assert.equal(JSON.stringify(fixture), before, 'rejected progress remains available for recovery: ' + index);
}
console.log('SOVIET_MATH_EXTENSION_OK', JSON.stringify({newTopics: newTopics.length, examples, steps,
  revisedExamples, revisedSteps, zeroDigits, stableOriginalUrls: FIRST_BATCH.length, matchingLegacySnapshots, migration: 'revision-2'}));
