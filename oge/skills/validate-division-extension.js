"use strict";

// Check the new short tasks against integer arithmetic. The existing full
// rounding and quotient-estimation trainers keep their own independent gates.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {checkTask} = require("./engine.js");
const {witness} = require("./task-input.js");
const root = path.resolve(__dirname, "../..");
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "expansion-division.json"), "utf8"));
const additions = data.topics[0];
const tasks = [...additions.quick, ...additions.creative];
const taskById = new Map(tasks.map(task => [task.id, task]));
const task = suffix => {
  const result = taskById.get("exp-base-division-" + suffix);
  assert(result, "Unknown test task: " + suffix);
  return result;
};
let checks = 0;
function equal(actual, expected, label) { assert.deepEqual(actual, expected, label); checks++; }
function verify(condition, label) { assert(condition, label); checks++; }
function accepts(item, input) {
  try { return checkTask(item, input).ok; } catch (_) { return false; }
}
function values(input) {
  return {values:Object.fromEntries(Object.entries(input).map(([key, value]) => [key, String(value)]))};
}
function roundedInteger(n, place) {
  // Quotient and remainder give exact boundaries, including the halfway case.
  const unit = 10n ** BigInt(place), original = BigInt(n);
  const lower = original / unit, remainder = original % unit;
  return Number((lower + (2n * remainder >= unit ? 1n : 0n)) * unit);
}

equal(data.version, 1, "version");
equal(data.topics.map(topic => topic.topicId), ["base"], "only foundations are extended");
equal(additions.skills.length, 6, "six precise skills");
equal(additions.quick.length, 8, "eight short tasks");
equal(additions.creative.length, 4, "four optional workshops");
equal(taskById.size, 12, "unique task identities");
equal(data.routes.length, 3, "three finite routes");

const sourceTopics = ["topics-arithmetic.json", "topics-functions.json", "topics-geometry.json"]
  .flatMap(name => JSON.parse(fs.readFileSync(path.join(__dirname, name), "utf8")));
const allSkills = [...sourceTopics.flatMap(topic => topic.skills), ...additions.skills];
const skillById = new Map(allSkills.map(skill => [skill.id, skill]));
equal(skillById.size, allSkills.length, "new skills do not shadow existing ones");
function visit(id, chain = new Set()) {
  verify(skillById.has(id), "resolved skill " + id);
  verify(!chain.has(id), "acyclic prerequisites " + id);
  const next = new Set(chain); next.add(id);
  for (const prerequisite of skillById.get(id).requires || []) visit(prerequisite, next);
}
additions.skills.forEach(skill => visit(skill.id));
for (const id of ["base-round-tens", "base-round-hundreds", "base-round-thousands"])
  equal(skillById.get(id).requires, ["base-place"], id + " can be practised separately");
equal(skillById.get("base-quotient-estimate").requires,
  ["base-round-tens", "base-quotient-check"], "estimation requires exact checking, not all rounding levels");
equal(data.skillUpdates.map(skill => skill.id), ["base-division"], "existing division gets navigation only");
equal(Object.keys(data.skillUpdates[0]).sort(), ["id", "supportLinks"], "no progress or prerequisites are overwritten");

for (const skill of [...additions.skills, ...data.skillUpdates]) {
  verify(skill.supportLinks.length > 0, skill.id + " has real practice");
  for (const link of skill.supportLinks) {
    verify(link.label.length > 0, skill.id + " has a link label");
    equal(link.newTab, true, skill.id + " leaves the current work open");
    verify(/^\/trainers\//.test(link.href), skill.id + " is a local trainer link");
    const url = new URL(link.href, "https://mathexam.space");
    equal(url.origin, "https://mathexam.space", "same-site practice");
    verify(fs.existsSync(path.join(root, url.pathname)), "practice exists: " + url.pathname);
  }
}
for (const [id, place] of [["base-round-tens", "1"], ["base-round-hundreds", "2"], ["base-round-thousands", "3"]]) {
  const url = new URL(skillById.get(id).supportLinks[0].href, "https://mathexam.space");
  equal(url.pathname, "/trainers/rounding-stepwise.html", id + " uses the full stepwise exercise");
  equal(url.searchParams.get("place"), place, id + " selects the intended place");
}

for (const item of tasks) {
  verify(skillById.has(item.skillId), item.id + " has a skill");
  verify(accepts(item, witness(item)), item.id + " accepts its example");
  for (const alternative of item.alternativeSolutions || [])
    verify(accepts(item, values(alternative)), item.id + " accepts another valid answer");
}
for (const route of data.routes) {
  equal(route.topicId, "base", route.id + " belongs to foundations");
  equal(route.steps.length, 3, route.id + " stays short");
  equal(route.steps.map(step => step.optional), [false, true, false], "only the workshop is optional");
  equal(route.steps.map(step => taskById.get(step.taskId)?.learningMode), ["quick", "creative", "quick"], route.id + " returns to ordinary practice");
}

// Ordinary rounding includes both a halfway value and carries into a new place.
for (const [suffix, original, place] of [
  ["round-entry", 147, 1], ["round-exit", 995, 1],
  ["hundreds", 1450, 2], ["thousands", 9500, 3]
]) {
  const item = task(suffix), expected = roundedInteger(original, place);
  equal(item.answer, expected, suffix + " matches exact rounding");
  verify(accepts(item, {answer:String(expected)}), suffix + " accepts the rounded value");
  for (const wrong of [original, expected - 10 ** place, expected + 10 ** place])
    verify(!accepts(item, {answer:String(wrong)}), suffix + " rejects " + wrong);
}

// Find all counterexamples to the claimed rule, including both boundary sides.
const counterexample = task("round-workshop");
for (let n = 230; n <= 260; n++) {
  const expected = n >= 241 && n <= 249 && roundedInteger(n, 1) !== 240;
  equal(accepts(counterexample, values({n})), expected, "rounding counterexample " + n);
}
verify(!accepts(counterexample, values({n:245.5})), "counterexample must be an integer");

// Every offered final digit is checked using the original dividend and divisor.
for (const [suffix, n, d] of [
  ["digit-entry", 47, 6], ["digit-exit", 83, 9],
  ["estimate-entry", 266, 33], ["estimate-exit", 244, 27]
]) {
  const item = task(suffix), wanted = Math.floor(n / d);
  item.options.forEach((option, index) => {
    const digit = Number(option.text), correct = digit === wanted;
    equal(option.correct, correct, suffix + " exact digit " + digit);
    equal(accepts(item, {selected:[index]}), correct, suffix + " submitted digit " + digit);
    if (correct) verify(d * digit <= n && n < d * (digit + 1), "both exact bounds hold");
  });
}

// The check cannot accept a plausible estimate with an unchecked product.
const digit = task("digit-workshop");
for (let q = 0; q <= 9; q++) {
  const attempt = {q, product:26*q, r:184-26*q, next:26*(q+1)};
  equal(accepts(digit, values(attempt)), q === Math.floor(184/26), "complete check for digit " + q);
}
const exact = {q:7, product:182, r:2, next:208};
for (const key of ["product", "r", "next"]) for (const offset of [-1, 1])
  verify(!accepts(digit, values({...exact, [key]:exact[key]+offset})), "incorrect " + key + " is rejected");
for (const q of [-1, 10, 7.000000001])
  verify(!accepts(digit, values({...exact, q})), "a digit is an integer from 0 to 9");

const estimates = task("estimate-workshop");
for (const [index, n, d] of [[0,266,33], [1,184,26], [2,296,31]]) {
  const result = estimates.pairs[index].right.match(/(?:Уменьшить до|Увеличить до|Записать) (\d):/);
  verify(!!result, "workshop states a single final digit");
  equal(Number(result[1]), Math.floor(n/d), "workshop checks original numbers");
  verify(n % d >= 0 && n % d < d, "workshop remainder is smaller than its divisor");
}
for (let a=0; a<3; a++) for (let b=0; b<3; b++) for (let c=0; c<3; c++) {
  const matches = {0:estimates.pairs[a].right, 1:estimates.pairs[b].right, 2:estimates.pairs[c].right};
  equal(accepts(estimates, {matches}), a===0 && b===1 && c===2, "three exact corrections cannot be swapped");
}

// All neighbouring integer pairs near the cutoffs are checked independently.
const neighbours = task("round-neighbors");
let alternatives = 0;
for (let a=2400; a<=3600; a++) {
  const b=a+1, expected=roundedInteger(a,2)===2500 && roundedInteger(b,3)===3000;
  equal(accepts(neighbours,values({a,b})), expected, "neighbouring rounded pair " + a);
  if (expected) alternatives++;
}
equal(alternatives,51,"all 51 valid neighbouring pairs are accepted");
for (const pair of [{a:2499,b:2501},{a:2500,b:2500},{a:2499.5,b:2500.5},{a:2498,b:2499},{a:2550,b:2551}])
  verify(!accepts(neighbours,values(pair)),"wrong neighbours or rounding boundary rejected");

console.log(JSON.stringify({status:"PASS",checks,newSkills:6,ordinaryCards:8,workshops:4,routes:3,
  scope:"Exact arithmetic, answer validation, optional routes and live trainer links; no browser layout or learning-efficacy claim."}, null, 2));
