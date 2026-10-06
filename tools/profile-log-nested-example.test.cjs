'use strict';

// Independent checks of the original nested logarithm, its six domain
// conditions, rationalization, and the authored interval/endpoint answers.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const PHI = (1 + Math.sqrt(5)) / 2;
const INV = (Math.sqrt(5) - 1) / 2;
const near = (a, b) => Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(a), Math.abs(b));
const gt = (a, b) => a > b && !near(a, b);
const lt = (a, b) => a < b && !near(a, b);
const ne = (a, b) => !near(a, b);

function original(x) {
 const A = x * x - x, B = x * x + x;
 if (!(gt(A, 0) && ne(A, 1) && gt(B, 0) && ne(B, 1) && gt(x, 0))) return {defined:false};
 const inner = Math.log(x) / Math.log(B);
 if (!(inner > 0)) return {defined:false};
 return {defined:true, inner, value:Math.log(inner) / Math.log(A)};
}
const domain = x => gt(x, 1) && ne(x, PHI);
const answer = x => gt(x, 1) && lt(x, PHI);
const predicates = {
 'outer-base-axis': x => lt(x, 0) || gt(x, 1),
 'inner-base-axis': x => lt(x, -1) || gt(x, 0),
 'x-axis': x => gt(x, 0),
 'positive-inner-axis': x => gt(x, -PHI) && lt(x, INV) || gt(x, 1),
 'domain-axis': domain,
 'quadratic-axis': x => (gt(x, -INV) || near(x, -INV)) && (lt(x, PHI) || near(x, PHI)),
 'final-axis': answer
};
const domainConditions = [
 predicates['outer-base-axis'],
 x => ne(x, -INV) && ne(x, PHI),
 predicates['inner-base-axis'],
 x => ne(x, -PHI) && ne(x, INV),
 predicates['x-axis'],
 predicates['positive-inner-axis']
];
function samples(points, i) {
 const l = i ? points[i - 1] : -Infinity, r = i < points.length ? points[i] : Infinity;
 if (!Number.isFinite(l)) return [r - .01, r - 1, r - 1000];
 if (!Number.isFinite(r)) return [l + .01, l + 1, l + 1000];
 return [.01, .25, .5, .75, .99].map(f => l + (r - l) * f);
}
function expectedTokens(field, predicate = predicates[field.id]) {
 assert.equal(typeof predicate, 'function', 'No independent oracle for axis ' + field.id);
 const result = [];
 field.points.forEach((x, i) => {
  assert(Number.isFinite(x), field.id + ': finite numerical point');
  if (i) assert(x > field.points[i - 1], field.id + ': ordered distinct points');
 });
 for (let i = 0; i <= field.points.length; i++) {
  const values = samples(field.points, i).map(predicate);
  assert(values.every(v => v === values[0]), field.id + ': missing internal boundary in segment ' + i);
  if (values[0]) result.push('s' + i);
 }
 field.points.forEach((x, i) => { if (predicate(x)) result.push('p' + i); });
 return result.sort();
}
function loadConfig() {
 const scope = {window:{}};
 vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../trainers/ege-profile/log-inequalities/nested.js'), 'utf8'), scope, {filename:'nested.js'});
 assert(scope.window.MathExamGuidedLesson, 'Nested content publishes a pure guided-lesson configuration');
 return JSON.parse(JSON.stringify(scope.window.MathExamGuidedLesson));
}
function verifyContent(config) {
 assert.equal(config.trainerId, 'profile-log-nested-example');
 assert.equal(config.apiName, '__nestedLogExample');
 assert(Array.isArray(config.steps) && config.steps.length > 10);
 const axes = config.steps.flatMap(s => s.fields).filter(f => f.kind === 'axis');
 assert.deepEqual(axes.map(f => f.id).sort(), Object.keys(predicates).sort(), 'All authored axes receive independent mathematical checks');
 for (const field of axes) {
  assert.deepEqual([...field.correct].sort(), expectedTokens(field), field.id + ': exact intervals and isolated endpoints');
 }
 const d = axes.find(f => f.id === 'domain-axis');
 assert.equal(d.refs.length, 6, 'All six domain conditions remain visible');
 // Match rows by their mathematically defined sets rather than wording/order.
 const expectedRows = domainConditions.map(predicate => expectedTokens(d, predicate).join(','));
 const actualRows = d.refs.map(ref => [...ref.tokens].sort().join(','));
 assert.deepEqual([...actualRows].sort(), [...expectedRows].sort(), 'The six reference rows represent exactly the six domain conditions');
 const final = axes.find(f => f.id === 'final-axis');
 const finalPredicates = [x => gt(x, 1), x => ne(x, PHI), predicates['quadratic-axis']];
 assert.deepEqual(final.refs.map(ref => [...ref.tokens].sort().join(',')).sort(), finalPredicates.map(p => expectedTokens(final, p).join(',')).sort(), 'Final references retain the closed quadratic endpoints before intersecting with the domain');
 assert.equal(config.reportAnswer, '(1; (1+√5)/2)');
 return axes.length;
}
function run() {
 let probes = 0;
 const boundaries = [-PHI, -1, -INV, 0, INV, 1, PHI];
 const xs = Array.from({length:40001}, (_, i) => (i - 20000) / 641);
 for (const boundary of boundaries) xs.push(boundary, boundary - 1e-8, boundary + 1e-8, boundary - 1e-5, boundary + 1e-5);
 xs.push(1e3, 1e6);
 for (const x of xs) {
  const evaluated = original(x);
  assert.equal(evaluated.defined, domain(x), 'Original domain at x=' + x);
  assert.equal(domainConditions.every(p => p(x)), domain(x), 'Intersection of six domain conditions at x=' + x);
  if (evaluated.defined) {
   assert(evaluated.inner > 0 && evaluated.inner < 1, 'Inner logarithm strictly between 0 and 1 on the domain');
   assert.equal(evaluated.value >= 0, answer(x), 'Direct original answer at x=' + x);
   const rational = (x*x-x-1)*(x*x+x-1)*(-x*x);
   assert.equal(rational >= 0, answer(x), 'Rationalization only on the original domain at x=' + x);
   assert.equal(x*x-x-1 <= 0, answer(x), 'Removing strictly signed factors at x=' + x);
  }
  probes++;
 }
 assert(!original(1).defined && !original(PHI).defined, 'Neither final endpoint belongs to the original domain');
 const count = verifyContent(loadConfig());
 console.log(`PROFILE_LOG_NESTED_MATH_OK: ${probes} direct probes, six domain conditions, rationalization, ${count} independent axes, closed quadratic endpoints and open final endpoints.`);
}
module.exports = {loadConfig, verifyContent, expectedTokens, original, domain, answer, PHI, INV};
if (require.main === module) run();
