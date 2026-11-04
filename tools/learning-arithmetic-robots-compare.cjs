'use strict';

// Rebuild the comparison from the complete, separately reproducible runs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const names = ['baseline', 'after', 'current'];
const paths = names.map(name => 'docs/reports/arithmetic-robots-' + name + '.json');
const reports = paths.map(file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')));
const [baseline, after, current] = reports;
const fixtures = require('./fixtures/arithmetic-robot-profiles.json');
const identity = scenario => [scenario.id, scenario.profile, scenario.contentId, scenario.seed];

for (const report of reports) {
  assert.equal(report.synthetic, true);
  assert.equal(report.humanLearningEvidence, false);
  assert.equal(report.summary.completed, report.summary.scenarios);
  assert.deepEqual(report.cases.map(identity), baseline.cases.map(identity), 'All runs use the same fixed profiles and seeds');
}
assert.equal(after.summary.issues, 0, 'Legacy replay has no unresolved findings');
assert.equal(current.summary.issues, 0, 'Current generated exercises have no unresolved findings');
for (let index = 0; index < baseline.cases.length; index++) {
  const before = baseline.cases[index], replay = after.cases[index];
  assert.equal(replay.condition, before.condition, 'Before/after replay uses the exact same arithmetic condition');
  assert.deepEqual(replay.oracle, before.oracle, 'Before/after replay covers the exact same arithmetic steps');
  assert.equal(replay.actions, before.actions);
  assert.equal(replay.generatorVersion, before.generatorVersion);
}
for (const report of [after, current]) {
  for (const [file, hash] of Object.entries(report.source)) {
    if (file !== 'commit') assert.equal(digest(fs.readFileSync(path.join(root, file))), hash, 'Report must describe current source: ' + file);
  }
}
const findings = report => report.cases.reduce((counts, scenario) => {
  for (const issue of scenario.issues) counts[issue] = (counts[issue] || 0) + 1;
  return counts;
}, {});
const comparison = {
  schema: 'mathexam-synthetic-arithmetic-comparison-v1',
  synthetic: true,
  humanLearningEvidence: false,
  claim: fixtures.claim,
  profiles: fixtures.profiles.length,
  scenarios: baseline.summary.scenarios,
  interpretation: {
    completion: 'Completion includes deliberately requested worked solutions. Completion alone is not evidence that the first hint or error feedback was useful.',
    findings: 'Findings are scripted presentation checks, not distinct pupils or diagnoses. A scenario can have both generic feedback and a first hint that gives the answer.',
    legacyComparison: 'The baseline and after runs use identical fixed seeds, arithmetic conditions, action counts, and generator version 1.',
    currentCoverage: 'The current run uses the same difficulty profiles and seeds with current generators; changed conditions are checked independently and are not treated as identical baseline exercises.',
    scope: 'Actual managed DOM and SQLite persistence are exercised. Chromium iframe, real layout and postMessage checks run separately in CI; this file does not claim a local browser run.'
  },
  reproducibility: {
    baselineCommit: baseline.source.commit,
    baselineSource: baseline.source,
    testFiles: Object.fromEntries(['tools/fixtures/arithmetic-robot-profiles.json', 'tools/learning-arithmetic-robots-policy.cjs', 'tools/learning-arithmetic-robots-oracle.cjs', 'tools/learning-arithmetic-robots.cjs', 'tools/learning-arithmetic-robots.browser.cjs'].map(file => [file, digest(fs.readFileSync(path.join(root, file)))])),
    dependencies: ['Node.js with node:sqlite', 'jsdom for local DOM runs', 'playwright and Chromium for CI browser run'],
    commands: [
      'node tools/learning-arithmetic-robots.cjs --root=<baseline-checkout> --mode=baseline --generator-version=1 --output=docs/reports/arithmetic-robots-baseline.json',
      'node tools/learning-arithmetic-robots.cjs --generator-version=1 --output=docs/reports/arithmetic-robots-after.json',
      'node tools/learning-arithmetic-robots.cjs --output=docs/reports/arithmetic-robots-current.json',
      'node tools/learning-arithmetic-robots-compare.cjs',
      'node tools/learning-arithmetic-robots.browser.cjs --output=<artifact-directory>/arithmetic-robots-chromium.json'
    ]
  },
  runs: Object.fromEntries(names.map((name, index) => [name, {report: paths[index], reportSha256: digest(fs.readFileSync(path.join(root, paths[index]))), summary: reports[index].summary, findings: findings(reports[index])}])),
  scenariosDetail: baseline.cases.map((scenario, index) => ({
    ...Object.fromEntries(['id', 'profile', 'difficulty', 'contentId', 'seed'].map(key => [key, scenario[key]])),
    runs: Object.fromEntries(names.map((name, reportIndex) => {
      const item = reports[reportIndex].cases[index];
      return [name, {condition: item.condition, generatorVersion: item.generatorVersion, completed: item.completed, verifiedArithmeticSteps: item.oracle.verifiedSteps, explicitSolutions: item.explicitSolutions, targetedFeedback: item.target.targetedFeedback, firstHintWithoutAnswer: !item.target.firstHintGivesAnswer, nextPractice: item.nextPractice, issues: item.issues}];
    }))
  }))
};
const output = path.join(root, 'docs/reports/arithmetic-robots-comparison.json');
fs.writeFileSync(output, JSON.stringify(comparison, null, 2) + '\n');
console.log(JSON.stringify({result: 'LEARNING_ARITHMETIC_ROBOTS_COMPARISON_PASS', profiles: comparison.profiles, scenarios: comparison.scenarios, runs: Object.fromEntries(names.map((name, index) => [name, reports[index].summary]))}));
