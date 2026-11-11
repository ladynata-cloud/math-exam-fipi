"use strict";

// Independent mathematical checks for the ten additions to topics 10–14.
// The experiment's UI/state transitions are checked by the integration gate.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const assert = require("assert/strict");
const {checkTask, evaluate} = require("./engine.js");
const {witness} = require("./task-input.js");
const filename = path.join(__dirname, "expansion-functions.json");
const raw = fs.readFileSync(filename);
const data = JSON.parse(raw);
const tasks = data.topics.flatMap(topic => [...topic.quick, ...topic.creative]);
const byId = new Map(tasks.map(task => [task.id, task]));
let checks = 0;
const verify = (condition, message) => { checks++; assert.ok(condition, message); };
const equal = (actual, expected, message) => { checks++; assert.deepEqual(actual, expected, message); };
const near = (actual, expected, message) => verify(Math.abs(actual - expected) < 1e-11, message);
const task = name => {
  const result = byId.get(name);
  assert.ok(result, "Missing task: " + name);
  return result;
};
function accepts(name, values) {
  return checkTask(task(name), {values: Object.fromEntries(Object.entries(values).map(([k, v]) => [k, String(v)]))}).ok;
}
function rejects(name, values) {
  try { return !accepts(name, values); } catch (_) { return true; }
}

equal(data.topics.map(t => t.topicId), ["n10", "n11", "n12", "n13", "n14"], "Five intended topics");
equal(tasks.length, 30, "Twenty ordinary tasks and ten workshops");
equal(data.topics.reduce((n, t) => n + t.quick.length, 0), 20, "Ordinary task count");
equal(data.topics.reduce((n, t) => n + t.creative.length, 0), 10, "Workshop count");
equal(new Set(tasks.map(t => t.id)).size, tasks.length, "Unique task IDs");
equal(data.routes.length, 10, "Ten finite routes");
const used = new Set();
for (const route of data.routes) {
  equal(route.steps.length, 3, route.id + " has three steps");
  equal(route.steps.map(step => step.optional), [false, true, false], route.id + " has one optional workshop");
  const ids = route.steps.map(step => step.taskId);
  verify(ids.every(id => byId.has(id)), route.id + " resolves all cards");
  verify(ids.every(id => id.startsWith("exp-" + route.topicId + "-")), route.id + " stays within its topic");
  verify(ids.every(id => !used.has(id)), route.id + " does not reuse another route's card");
  ids.forEach(id => used.add(id));
  verify(!task(ids[0]).originAtlasId && !!task(ids[1]).originAtlasId && !task(ids[2]).originAtlasId, route.id + " order matches ordinary/workshop/ordinary");
  equal(route.originAtlasId, task(ids[1]).originAtlasId, route.id + " links to the same atlas concept");
  equal(task(ids[0]).skillId, task(ids[1]).skillId, route.id + " entry has the target skill");
  equal(task(ids[1]).skillId, task(ids[2]).skillId, route.id + " exit has the target skill");
}
equal(used.size, 30, "Every new card belongs to one route");
equal(data.topics.flatMap(t => t.creative.map(c => c.originAtlasId)), ["10.1", "10.2", "11.1", "11.2", "12.1", "12.2", "13.1", "13.2", "14.1", "14.2"], "All ten atlas concepts mapped once");

for (const t of tasks) {
  for (const field of ["id", "title", "prompt", "skillId", "hint", "explanation"]) verify(typeof t[field] === "string" && t[field].length > 0, t.id + " requires " + field);
  if (t.type !== "experiment") verify(checkTask(t, witness(t)).ok, t.id + " control response is accepted by engine");
  if (t.type === "choice") equal(t.options.filter(o => o.correct).length, 1, t.id + " has exactly one correct choice");
  if (t.type === "match" && t.matchOptions) equal(new Set(t.matchOptions).size, t.matchOptions.length, t.id + " has no duplicated matching choices");
  if (t.type === "number") verify(!checkTask(t, {answer: String(t.answer + 1)}).ok, t.id + " rejects a nearby wrong result");
}

// Probabilities are calculated from ordered draws, independently of task.conditions.
const pairProbability = (red, total, replacement) => red / total * (replacement ? red / total : (red - 1) / (total - 1));
near(task("exp-n10-return-entry").answer, pairProbability(2, 5, true), "Replacement probability 4/25");
near(task("exp-n10-return-exit").answer, pairProbability(4, 5, false), "No-replacement probability 3/5");
near(pairProbability(3, 4, true), 9 / 16, "Main replacement example");
near(pairProbability(3, 4, false), 1 / 2, "Main no-replacement example");
verify(accepts("exp-n10-return-creative", {redBack: 3, redAway: 2, pBack: "9/16", pAway: "1/2"}), "Fractions accepted in probability fields");
verify(rejects("exp-n10-return-creative", {redBack: 3, redAway: 2, pBack: "3/4", pAway: "2/3"}), "Conditional second-draw probabilities are not full-event probabilities");
verify(rejects("exp-n10-return-creative", {redBack: 3, redAway: 3, pBack: "9/16", pAway: "3/4"}), "Unchanged red count rejected without replacement");
near(task("exp-n10-frequency-entry").answer, 24 / 40, "Observed relative frequency");
near(task("exp-n10-frequency-exit").answer, 1 / 2, "Independent next toss probability");
equal(task("exp-n10-frequency-creative").options.map(o => o.correct), [true, true, true, false, false, false], "Frequency and probability statements");
near(14 / 20, 0.7, "First supplied series frequency");
near(6 / 20, 0.3, "Second supplied series frequency");
verify(2 ** -200 > 0, "A 200-head sequence has nonzero probability, disproving an exactly-100 guarantee");

// A response must distinguish a finite list of explicitly supplied formulas.
const experiment = task("exp-n11-probe-creative");
equal(experiment.models.map(m => m.id), ["linear", "quadratic"], "Two declared formulas");
equal(experiment.probeValues, [0, 1, 2], "Three offered argument values");
equal(experiment.secretModelId, "quadratic", "The chosen formula agrees with the documented result");
equal(experiment.requireDistinguishingProbe, true, "Guessing the formula before a distinguishing substitution is insufficient");
equal(experiment.exampleSolution, {probes: [1], modelId: "quadratic"}, "Documented experiment response");
const f = x => 2 * x, g = x => x * x;
for (const p of experiment.known) { near(f(p.x), p.y, "Known point fits first formula"); near(g(p.x), p.y, "Known point fits second formula"); }
for (const x of experiment.probeValues) {
  near(evaluate(experiment.models[0].expression, {x}), f(x), "First expression agrees with independent function");
  near(evaluate(experiment.models[1].expression, {x}), g(x), "Second expression agrees with independent function");
}
equal(experiment.probeValues.filter(x => f(x) !== g(x)), [1], "Only x=1 distinguishes these formulas");
equal(task("exp-n11-probe-entry").options.map(o => o.correct), [true, false, false], "3*2=6 while 2^2=4");
equal(task("exp-n11-probe-exit").options.map(o => o.correct), [false, true, false], "(-1)^2=1 while 4*(-1)=-4");
verify(!/замер|прибор|сканер|модел/i.test([experiment.title, experiment.prompt, experiment.hint, experiment.explanation].join(" ")), "School terminology in the formula-selection task");

// Piecewise price: included distance does not incur a second charge.
const price = (x, included, base, rate) => x <= included ? base : base + rate * (x - included);
near(task("exp-n11-tariff-entry").answer, price(5, 3, 150, 25), "Entry piecewise price");
near(task("exp-n11-tariff-exit").answer, price(7.5, 4, 180, 20), "Exit supports a fractional distance without rounding");
const tariff = task("exp-n11-tariff-creative");
equal(tariff.visual.segments.map(s => [s.from, s.to, s.leftClosed, s.rightClosed]), [[0, 2, true, true], [2, 7, false, true]], "Piecewise domains have one owner for the common boundary");
for (const x of [0, 1, 2, 2.001, 3.5, 5, 7]) {
  const segments = tariff.visual.segments.filter(s => (x > s.from || s.leftClosed && x === s.from) && (x < s.to || s.rightClosed && x === s.to));
  equal(segments.length, 1, "Exactly one price segment at x=" + x);
  near(evaluate(segments[0].expression, {x, k: 30, b: 60}), price(x, 2, 120, 30), "Correct formula matches tariff at x=" + x);
}
verify(accepts(tariff.id, {k: 30, b: 60}), "Correct second formula accepted");
verify(rejects(tariff.id, {k: 30, b: 120}), "Double charging the included distance is rejected");
verify(rejects(tariff.id, {k: 0, b: 120}), "Continuity alone does not establish the slope");

// Unit conversion is checked both ways.
near(task("exp-n12-units-entry").answer, 48 * 15 / 60, "Entry kilometres");
near(task("exp-n12-units-exit").answer, 60 * 18 / 60, "Exit kilometres");
verify(accepts("exp-n12-units-creative", {hours: "1/2", mps: 20, km: 36, metres: 36000}), "Equivalent fraction for half an hour");
verify(rejects("exp-n12-units-creative", {hours: 30, mps: 72, km: 2160, metres: 129600}), "Mixed units rejected");
verify(rejects("exp-n12-units-creative", {hours: 0.5, mps: 20, km: 36, metres: 36}), "Metres are not numerically kilometres");
near(72 * 1000 / 3600, 20, "Speed conversion");
near(72 * 0.5 * 1000, 20 * 1800, "Two calculation routes describe equal distances");

const formula = (a, b) => 2 * a * b / (a + b);
near(task("exp-n12-secrets-entry").answer, formula(3, 5), "Entry realizable data");
near(task("exp-n12-secrets-exit").answer, formula(6, 9), "Exit realizable data");
equal(task("exp-n12-secrets-creative").options.map(o => o.correct), [true, false, true, false, false], "Sufficient data sets");
near(formula(3, 7), 4.2, "Both sufficient sets give 4.2");
for (const [a,b,c,d,relation] of [[5,1,6,2,"difference"], [1,9,5,5,"sum"], [3,1,6,2,"ratio"]]) {
  const relationValue = (u,v) => relation === "difference" ? u-v : relation === "sum" ? u+v : u/v;
  near(relationValue(a,b), relationValue(c,d), relation + " counterexamples share the stated data");
  verify(Math.abs(formula(a,b)-formula(c,d)) > 0.1, relation + " alone does not determine F");
}

// Interval claims checked directly at endpoints and both sides.
const strict = task("exp-n13-strict-creative");
equal(strict.pairs.map(p => p.right), ["Только точка 3", "Пустое множество", "Пустое множество", "Промежуток (3; 4]"], "Stated solution sets");
for (const x of [-100, 2.999, 3, 3.001, 3.5, 4, 4.001, 100]) {
  equal(x >= 3 && x <= 3, x === 3, "Non-strict meeting at " + x);
  verify(!(x > 3 && x <= 3), "First strict meeting has no solution at " + x);
  verify(!(x >= 3 && x < 3), "Second strict meeting has no solution at " + x);
  equal(x > 3 && x <= 4, new Set([3.001, 3.5, 4]).has(x), "Shifted upper boundary at " + x);
  equal(-2*x < -6 && x <= 3, false, "Exit empty system at " + x);
}
near(task("exp-n13-redundant-entry").answer, Math.min(...Array.from({length: 21},(_,i)=>i-10).filter(x=>x>=-1 && x>-3 && x<4)), "Entry smallest integer");
near(task("exp-n13-redundant-exit").answer, Math.max(...Array.from({length: 21},(_,i)=>i-10).filter(x=>2*x-4>=0 && -3*x>-18 && x>=0)), "Exit greatest integer");
const redundant = "exp-n13-redundant-creative";
for (const [a,b] of [[0,6], [1,7], [2,10], [0.5,5.1]]) verify(accepts(redundant, {omit: 2, withoutFirst: a, withoutThird: b}), "All valid counterexample pairs accepted: " + [a,b]);
for (const values of [
  {omit:1,withoutFirst:1,withoutThird:6}, {omit:3,withoutFirst:1,withoutThird:6},
  {omit:2,withoutFirst:-0.1,withoutThird:6}, {omit:2,withoutFirst:2.1,withoutThird:6},
  {omit:2,withoutFirst:1,withoutThird:5}, {omit:2,withoutFirst:1,withoutThird:4.9}
]) verify(rejects(redundant,values), "Wrong deletion or boundary counterexample rejected " + JSON.stringify(values));
for (let i = -40; i <= 40; i++) {
  const x = i/4;
  equal(2*x+1>5 && -x<=0 && x+3<=8, 2*x+1>5 && x+3<=8, "Deleting only the middle condition preserves the set at " + x);
}

// Indices and pairing are derived from actual sequences, not answer fields.
const progression = (first, difference, count) => Array.from({length:count},(_,i)=>first+difference*i);
near(task("exp-n14-diary-entry").answer, progression(-2,5,4).at(-1), "Fourth member uses three changes");
near(task("exp-n14-diary-exit").answer, progression(7,4,6).at(-1), "Sixth member uses five changes");
equal(task("exp-n14-diary-creative").pairs.map(p=>p.right), ["b₀ = 10","b₂ = 16","b₃ = 19","b₄ = 22"], "Offset indexing pairs");
const values = progression(1,3,7);
equal(values, [1,4,7,10,13,16,19], "Seven explicitly stated members");
const pairs = [values[0]+values[6], values[1]+values[5], values[2]+values[4]];
equal(pairs, [20,20,20], "Three disjoint pairs have equal sums");
near(values.reduce((sum,x)=>sum+x,0), 70, "Direct odd-length sum");
verify(accepts("exp-n14-pairs-creative", {pairs:3,pairSum:20,middle:10,total:70}), "Odd-length construction");
verify(rejects("exp-n14-pairs-creative", {pairs:3.5,pairSum:20,middle:0,total:70}), "Half a disjoint pair is rejected");
verify(rejects("exp-n14-pairs-creative", {pairs:3,pairSum:20,middle:10,total:60}), "Lost middle term rejected");
near(task("exp-n14-pairs-entry").answer, progression(2,4,6).reduce((sum,x)=>sum+x,0), "Entry even-length sum");
near(task("exp-n14-pairs-exit").answer, progression(3,2,8).reduce((sum,x)=>sum+x,0), "Exit even-length sum");

const report = {
  status: "passed", generatedAt: new Date().toISOString(), checks,
  cards: tasks.length, ordinary: 20, creative: 10, routes: data.routes.length,
  newSkills: data.topics.reduce((n,t)=>n+t.skills.length,0),
  sourceSha256: crypto.createHash("sha256").update(raw).digest("hex"),
  scope: "Independent mathematical and card-structure checks. No browser-layout verification.",
  experimentIntegration: "Function values and distinguishing argument checked independently here; interactive state and completion are root integration gate responsibilities."
};
fs.writeFileSync(path.join(__dirname,"QA_EXPANSION_FUNCTIONS.json"), JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report,null,2));
