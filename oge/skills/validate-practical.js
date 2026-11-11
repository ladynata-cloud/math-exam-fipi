"use strict";

// Mathematical oracles below are independent calculations from the authored
// conditions. The engine is then checked against those results, including
// exhaustive small integer domains and deliberately invalid responses.
const fs = require("fs");
const path = require("path");
const assert = require("assert/strict");
const {checkTask, evaluate} = require("./engine.js");
const {witness} = require("./task-input.js");
const read = name => JSON.parse(fs.readFileSync(path.join(__dirname, name), "utf8"));
const topics = read("topics-practical.json");
const expansion = read("expansion-practical.json");
const tasks = topics.flatMap(topic => [...topic.quick, ...topic.creative]);
const index = new Map(tasks.map(task => [task.id, task]));
const skills = topics.flatMap(topic => topic.skills);
const repo = path.resolve(__dirname, "../..");
let checks = 0;
const verify = (ok, message) => { checks++; assert.ok(ok, message); };
const equal = (actual, expected, message) => { checks++; assert.deepEqual(actual, expected, message); };
const near = (actual, expected, message) => verify(Math.abs(actual - expected) < 1e-10, message);
const task = id => { assert.ok(index.has(id), "Missing practical task " + id); return index.get(id); };
const accept = (id, input) => {
  try { return checkTask(task(id), input).ok; } catch (_) { return false; }
};
const buildAccept = (id, values) => accept(id, {values: Object.fromEntries(Object.entries(values).map(([key, value]) => [key, String(value)]))});
const close = (a, b) => Number.isFinite(a) && Math.abs(a-b) < 1e-10;
const bill = (used, base, included, rate) => base + Math.max(0, used-included)*rate;
const rectangleArea = (a, b) => a*b;
const polygonArea = points => Math.abs(points.reduce((sum, point, i) => {
  const next = points[(i+1)%points.length];
  return sum + point[0]*next[1] - next[0]*point[1];
}, 0))/2;
const distance = (a, b) => Math.hypot(a[0]-b[0], a[1]-b[1]);
const integerBetween = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

// The five number entries are mixed overviews, not universal per-number topics.
equal(topics.map(topic => topic.id), ["n1", "n2", "n3", "n4", "n5"], "Five practical number entries");
equal(skills.length, 30, "Thirty independently exercised skills");
equal(new Set(skills.map(skill => skill.id)).size, 30, "Unique skill IDs");
equal(tasks.length, 35, "Twenty ordinary tasks and fifteen workshops");
equal(new Set(tasks.map(card => card.id)).size, 35, "Unique task IDs");
equal(expansion.topics, [], "Routes do not duplicate overview cards");
equal(expansion.routes.length, 10, "Ten finite optional-workshop routes");
const contexts = ["roads-grid", "roads-schema", "tires", "stoves", "land-plots", "apartments", "tariffs", "paper-sheets"];
const hrefs = contexts.map(context => "/trainers/oge-1-5-trainers/practice-1-5-" + context + ".html");
equal([...new Set(tasks.map(card => card.contextId))].sort(), contexts.slice().sort(), "All eight existing contexts are visible in tasks");
equal([...new Set(topics.flatMap(topic => topic.quick.map(card => card.contextId)))].sort(), contexts.slice().sort(), "All eight contexts occur in ordinary overview cards");
const arithmetic = read("topics-arithmetic.json");
const allSkills = new Map([...arithmetic.flatMap(topic => topic.skills), ...skills].map(skill => [skill.id, skill]));
for (const topic of topics) {
  equal(topic.quick.length, 4, topic.id + " keeps a four-card overview");
  equal(topic.creative.length, 3, topic.id + " has three optional workshops");
  equal(topic.skills.length, 6, topic.id + " has six readable skill entries");
  equal(topic.title, "№" + topic.id.slice(1) + ". Практические задачи", topic.id + " has no falsely fixed mathematical theme");
  verify(topic.goal.includes("вопросы зависят от сюжета"), topic.id + " explains context-dependent questions");
  verify(topic.goal.includes("по желанию"), topic.id + " keeps depth optional");
  equal(topic.sourceLinks.map(link => link.href), hrefs, topic.id + " has direct links to all eight contexts");
  equal(topic.sourceLinksTitle, "Сюжеты №1–5", topic.id + " names the optional link group");
  for (const href of [topic.sourceHref, ...topic.sourceLinks.map(link => link.href)]) {
    verify(href.startsWith("/trainers/oge-1-5-trainers/"), "Local practical trainer link " + href);
    verify(fs.existsSync(path.join(repo, href.slice(1))), "Existing trainer destination " + href);
  }
  for (const skill of topic.skills) {
    verify(tasks.some(card => card.skillId === skill.id), skill.id + " has an independently checked task");
    verify(skill.evidence.length > 20, skill.id + " states observable evidence");
    for (const prerequisite of skill.requires) verify(allSkills.has(prerequisite), skill.id + " resolves prerequisite " + prerequisite);
  }
}
function visit(id, seen = new Set()) {
  verify(!seen.has(id), "No dependency cycle at " + id);
  const next = new Set(seen); next.add(id);
  for (const prerequisite of allSkills.get(id).requires || []) visit(prerequisite, next);
}
skills.forEach(skill => visit(skill.id));

const routeCards = new Set();
for (const route of expansion.routes) {
  equal(route.steps.map(step => step.optional), [false, true, false], route.id + " allows skipping the workshop");
  const topic = topics.find(candidate => candidate.id === route.topicId);
  verify(!!topic, route.id + " has a known topic");
  verify(topic.quick.some(card => card.id === route.steps[0].taskId), route.id + " starts with an ordinary card");
  verify(topic.creative.some(card => card.id === route.steps[1].taskId), route.id + " offers a workshop");
  verify(topic.quick.some(card => card.id === route.steps[2].taskId), route.id + " ends with an ordinary card");
  for (const step of route.steps) {
    verify(index.has(step.taskId), route.id + " resolves " + step.taskId);
    verify(!routeCards.has(step.taskId), step.taskId + " is not repeated across routes");
    routeCards.add(step.taskId);
  }
}
equal(topics.flatMap(topic => topic.quick).filter(card => routeCards.has(card.id)).length, 20, "Every ordinary card participates in a short route");

for (const card of tasks) {
  for (const key of ["title", "prompt", "hint", "explanation", "skillId", "contextId"]) verify(typeof card[key] === "string" && card[key].length > 0, card.id + " supplies " + key);
  verify(!/замер/iu.test([card.title, card.prompt, card.hint, card.explanation].join(" ")), card.id + " uses the agreed terminology");
  verify(skills.some(skill => skill.id === card.skillId), card.id + " references a local skill");
  verify(accept(card.id, witness(card)), card.id + " accepts its documented response");
  if (card.type === "choice" || card.type === "multi") {
    const correct = card.options.flatMap((option, i) => option.correct ? [i] : []);
    verify(correct.length > 0 && correct.length < card.options.length, card.id + " has both correct and incorrect choices");
    if (card.type === "choice") equal(correct.length, 1, card.id + " has one answer");
    verify(!accept(card.id, {selected: []}), card.id + " rejects no choice");
    const wrong = card.options.findIndex(option => !option.correct);
    verify(!accept(card.id, {selected: [...correct, wrong]}), card.id + " rejects an extra wrong choice");
    verify(!accept(card.id, {selected: correct.slice(1)}), card.id + " rejects an omitted correct choice");
  }
  if (card.type === "number") {
    verify(!accept(card.id, {answer: ""}), card.id + " rejects an empty answer");
    verify(!accept(card.id, {answer: String(card.answer+1)}), card.id + " rejects a nearby wrong value");
  }
  if (card.type === "match") {
    equal(new Set(card.pairs.map(pair => pair.right)).size, card.pairs.length, card.id + " has unambiguous matching choices");
    const response = witness(card);
    [response.matches[0], response.matches[1]] = [response.matches[1], response.matches[0]];
    verify(!accept(card.id, response), card.id + " rejects swapped matches");
  }
}

// Ordinary responses calculated independently from numbers and geometry.
const ordinaryAnswers = {
  "n1-q-tariff-table": 450,
  "n1-q-tire-width": 195,
  "n1-q-apartment-plan": 2,
  "n2-q-grid-scale": 6*150/1000,
  "n2-q-tire-inch": 16*25.4,
  "n2-q-apartment-area": 25000/(100*100),
  "n2-q-stove-volume": 24000000/(100*100*100),
  "n3-q-grid-diagonal": Math.hypot(3, 4),
  "n3-q-road-time": (6/30+8/40)*60,
  "n3-q-plot-grass": rectangleArea(20, 15)-rectangleArea(8, 6),
  "n3-q-stove-room": 3*2.5*2.4,
  "n4-q-tariff-bill": bill(348, 420, 300, 2.5),
  "n4-q-stove-total": 28000+1200+3500,
  "n4-q-tire-percent": (630-600)/600*100,
  "n4-q-paper-discount": 800*(1-15/100),
  "n5-q-plot-packs": Math.ceil(17.5/1.2),
  "n5-q-tariff-choice": Math.min(bill(340, 400, 250, 3), bill(340, 550, 400, 2), bill(340, 650, 500, 1)),
  "n5-q-paper-cutting": Math.ceil(70/(Math.floor(420/210)*Math.floor(594/297)))
};
equal(Object.keys(ordinaryAnswers).length, topics.flatMap(topic => topic.quick).filter(card => card.type === "number").length, "Every ordinary numeric result has an independent derivation");
for (const [id, value] of Object.entries(ordinaryAnswers)) {
  near(task(id).answer, value, id + " independent result");
  verify(accept(id, {answer: String(value).replace(".", ",")}), id + " accepts a comma decimal");
}
near(6/30,8/40,"The two road legs take equal time in this particular example");
near((6+8)/(6/30+8/40),(30+40)/2,"Equal leg times also make the arithmetic mean speed valid here");
verify(!task("n3-q-road-time").explanation.includes("не заменяет"),"Explanation does not deny the valid equal-time alternative");
verify(task("n2-c-scale-plan").fields[0].label.includes("3 см") && task("n2-c-scale-plan").fields[1].label.includes("2 см"),"Scale fields explicitly identify the source side");
const table = task("n1-q-tariff-table").table;
equal(table.headers, ["Тариф", "Минуты", "Плата, руб."], "Table reading keeps quantities separate");
equal(table.rows.find(row => row[0] === "Поездки"), ["Поездки", 450, 530], "Requested tariff row");
const marking = task("n1-q-tire-width").prompt.match(/(\d+)\/(\d+)\s*R(\d+)/);
verify(!!marking, "Tyre marking is visible");
near(task("n1-q-tire-width").answer, Number(marking[1]), "The width is the first marking component");
verify(!accept("n1-q-tire-width", {answer: marking[2]}), "Profile percentage is not width");
verify(!accept("n1-q-tire-width", {answer: marking[3]}), "Rim inches are not width");

// Exact coordinates support every diagram; no distorted shape supplies evidence.
const plan = task("n1-q-apartment-plan").visual;
equal(plan.points.length, 4, "Four room labels");
equal(plan.polygons.length, 4, "Four room boundaries");
const upperRight = plan.points.findIndex(point => point[0] === Math.max(...plan.points.map(p => p[0])) && point[1] === Math.max(...plan.points.map(p => p[1])));
equal(Number(plan.labels[upperRight]), ordinaryAnswers["n1-q-apartment-plan"], "Kitchen is the upper-right room");
for (let i = 0; i < plan.points.length; i++) {
  const room = plan.polygons[i].points, point = plan.points[i];
  verify(point[0] > Math.min(...room.map(p => p[0])) && point[0] < Math.max(...room.map(p => p[0])) && point[1] > Math.min(...room.map(p => p[1])) && point[1] < Math.max(...room.map(p => p[1])), "Room label is strictly inside room " + plan.labels[i]);
  near(polygonArea(room), 12, "Equal room geometry " + i);
}
const grid = task("n2-q-grid-scale").visual;
near(distance(...grid.points), 6, "Grid road is exactly six cells");
verify(grid.grid, "Grid context actually displays a grid");
const diagonal = task("n3-q-grid-diagonal").visual;
near(distance(diagonal.points[0], diagonal.points[1]), 3, "Horizontal leg is three cells");
near(distance(diagonal.points[1], diagonal.points[2]), 4, "Vertical leg is four cells");
near(distance(diagonal.points[0], diagonal.points[2]), 5, "Straight road has correct scale");
const plot = task("n3-q-plot-grass").visual;
near(polygonArea(plot.points), 300, "Plot scale is 20 by 15");
near(polygonArea(plot.polygons[0].points), 48, "House scale is 8 by 6");
for (const point of plot.polygons[0].points) verify(point[0] > 0 && point[0] < 20 && point[1] > 0 && point[1] < 15, "House is inside the plot");
for (const [id, lengths] of [["n1-q-road-signs", [3,4,5]], ["n3-c-road-comparison", [6,8,10]], ["n5-c-road-schedule", [3,4,5]]]) {
  const visual = task(id).visual;
  visual.segments.forEach((segment, i) => near(distance(segment.from, segment.to), lengths[i], id + " exact segment " + i));
  const [a, b, c] = visual.points;
  near((a[0]-b[0])*(c[0]-b[0])+(a[1]-b[1])*(c[1]-b[1]), 0, id + " right angle at B");
}
const roadSigns = task("n1-q-road-signs");
const pointNames = new Map(roadSigns.visual.points.map((point, i) => [JSON.stringify(point), roadSigns.visual.labels[i]]));
const highways = new Set(roadSigns.visual.segments.filter(segment => !segment.dashed).flatMap(segment => {
  const from = pointNames.get(JSON.stringify(segment.from)), to = pointNames.get(JSON.stringify(segment.to));
  return [from+to, to+from];
}));
equal(roadSigns.options.map(option => option.correct), roadSigns.options.map(option => {
  const route = option.text.split("–");
  return route[0] === "A" && route.at(-1) === "C" && route.slice(1).every((to, i) => highways.has(route[i]+to));
}), "Highway answer follows the legend, not route length");

// Matching and selected statements are backed by explicit dimensional facts.
equal(task("n1-c-units").pairs, [
  {left:"Ширина шины",right:"мм"}, {left:"Площадь кухни",right:"м²"},
  {left:"Объём парной",right:"м³"}, {left:"Время в пути",right:"мин"}
], "Quantity/unit matching");
equal(task("n1-c-needed-data").options.map(option => option.correct), [true,true,true,false,false], "Only dimensions and gate width determine the fence length");
near(2*(18+12)-3, 57, "Fence excludes the gate once");
task("n2-c-unit-power").pairs.forEach((pair, i) => {
  const displayed = Number(pair.right.match(/^[\d ]+/)[0].replaceAll(" ", ""));
  near(displayed, 0.6*Math.pow(100, i+1), "Dimensional conversion power " + (i+1));
});
const expressions = task("n3-c-choose-formula").pairs.map(pair => pair.right);
const geometryAnswers = [2*(18+12)-3, 18*12-4*3, 3*2*2.4];
expressions.forEach((expression, i) => near(evaluate(expression), geometryAnswers[i], "Geometry expression agrees with its quantity " + i));
const ordered = task("n4-c-bill-order");
equal([...ordered.items].sort(), [...ordered.answer].sort(), "Ordered solution uses each supplied step once");
equal(ordered.answer.map(step => step.split(":")[0]), ["Найти минуты сверх пакета", "Рассчитать доплату", "Прибавить абонентскую плату", "Проверить итог"], "Dependencies determine the requested solution order");
near(bill(260, 380, 200, 2), 500, "Ordered bill is 500 rubles");
verify(!accept(ordered.id, {order: ordered.answer.slice().reverse()}), "Reversed calculation is rejected");
const firstPrice = 1000*(1-0.2), finalPrice = firstPrice*(1+0.2);
equal(task("n4-c-successive-percent").options.map(option => option.correct), [close(firstPrice,800),close(finalPrice,960),close((1000-finalPrice)/1000*100,4),close(finalPrice,1000),close(finalPrice-firstPrice,200)], "Second percentage uses the reduced price");

// Capacity intervals explicitly include both endpoints. Two models fit 20 m³.
const stoves = task("n5-q-stove-range").table.rows.map(row => {
  const [min,max] = row[1].split("–").map(Number);
  return {name:row[0],min,max,price:row[2]};
});
const fits = (stove, volume) => volume >= stove.min && volume <= stove.max;
equal(stoves.filter(stove => fits(stove,20)).map(stove => stove.name), ["Б","В"], "Both endpoint models fit twenty cubic metres");
const best = stoves.filter(stove => fits(stove,20)).sort((a,b) => a.price-b.price)[0];
equal(task("n5-q-stove-range").options.map(option => option.correct), task("n5-q-stove-range").options.map(option => option.text === "Печь " + best.name), "Cheapest fitting stove selected");
for (const stove of stoves) {
  verify(fits(stove,stove.min) && fits(stove,stove.max), stove.name + " includes both interval endpoints");
  verify(!fits(stove,stove.min-0.001) && !fits(stove,stove.max+0.001), stove.name + " excludes values beyond the endpoints");
}
const priceA = minutes => bill(minutes,400,200,3), priceB = minutes => bill(minutes,520,300,2);
equal(task("n5-c-tariff-claims").options.map(option => option.correct), [priceA(180)<priceB(180),priceA(240)===priceB(240),priceB(300)<priceA(300),priceB(0)<priceA(0)], "Tariff assertions and a counterexample to the universal claim");
near(priceA(200),400,"No excess charge at the first package boundary");
near(priceA(201),403,"First excess minute charged once");
near(priceB(300),520,"No excess charge at the second package boundary");
near(priceB(301),522,"Second tariff first excess minute");
verify(14*1.2 < 17.5 && 15*1.2 >= 17.5, "Fifteen tile packs are sufficient and minimal");
verify(17*4 < 70 && 18*4 >= 70, "Eighteen paper sheets are sufficient and minimal");
near(420*594/(210*297),4,"Area bound proves at most four small sheets fit");

// Build tasks have independent predicates: no task.condition is used as oracle.
const paperArea = 210*297/1000000;
const oracles = {
  "n1-c-missing-row": v => integerBetween(v.extra,0,260) && integerBetween(v.included,0,260) && 300+3*v.extra===420 && v.extra+v.included===260,
  "n2-c-scale-plan": v => close(v.a,3*200/50) && close(v.b,2*200/50) && close(v.area,(3*200/100)*(2*200/100)),
  "n2-c-paper-rounding": v => close(v.exact,paperArea) && close(v.rounded,Math.round(paperArea*1000)/1000),
  "n3-c-road-comparison": v => close(v.direct,Math.hypot(6,8)) && close(v.via,6+8) && close(v.directTime,Math.hypot(6,8)/20*60) && close(v.viaTime,(6/30+8/40)*60),
  "n3-c-same-perimeter": v => integerBetween(v.a,1,9) && integerBetween(v.b,1,9) && 2*(v.a+v.b)===2*(6+4) && v.a*v.b<6*4,
  "n4-c-original-price": v => close(v.before,900/(1-0.1)) && close(v.saving,900/(1-0.1)-900),
  "n5-c-pack-budget": v => integerBetween(v.small,0,8) && integerBetween(v.large,0,4) && v.small+2.5*v.large>=6 && 700*v.small+1600*v.large<=4000,
  "n5-c-road-schedule": v => integerBetween(v.departure,0,20) && integerBetween(v.rest,10,20) && v.departure+v.rest+(3+4)/6*60<=90
};
equal(Object.keys(oracles).length, tasks.filter(card => card.type === "build").length, "Every construction has an independent mathematical oracle");
for (const [id, oracle] of Object.entries(oracles)) {
  verify(oracle(task(id).exampleSolution), id + " documented response independently satisfies the conditions");
  verify(!buildAccept(id,Object.fromEntries(task(id).fields.map(field => [field.name,field.initial]))),id+" starts with an unresolved construction");
  for (const field of task(id).fields) {
    const values = {...task(id).exampleSolution, [field.name]: task(id).exampleSolution[field.name]+1};
    equal(buildAccept(id,values),oracle(values),id+" shifted "+field.name+" matches independent mathematics");
    const below = {...task(id).exampleSolution, [field.name]: field.min-1};
    verify(!buildAccept(id,below),id+" rejects value below field domain");
    if (field.integer) {
      const fractional = {...task(id).exampleSolution,[field.name]:task(id).exampleSolution[field.name]+0.5};
      verify(!buildAccept(id,fractional),id+" rejects a fractional count or minute");
    }
  }
}
const rectangleSolutions = [];
for (let a=1;a<=9;a++) for (let b=1;b<=9;b++) {
  const values={a,b}, expected=oracles["n3-c-same-perimeter"](values);
  equal(buildAccept("n3-c-same-perimeter",values),expected,"Whole rectangle domain "+a+","+b);
  if (expected) rectangleSolutions.push([a,b]);
}
equal(rectangleSolutions,[[1,9],[2,8],[3,7],[7,3],[8,2],[9,1]],"All six permitted rectangle responses accepted");
const packSolutions=[];
for (let small=0;small<=8;small++) for (let large=0;large<=4;large++) {
  const values={small,large}, expected=oracles["n5-c-pack-budget"](values);
  equal(buildAccept("n5-c-pack-budget",values),expected,"Whole purchase domain "+small+","+large);
  if(expected)packSolutions.push(values);
}
equal(packSolutions,[{small:1,large:2}],"Exactly one integer purchase meets both area and budget");
let schedules=0;
for(let departure=0;departure<=20;departure++) for(let rest=10;rest<=20;rest++) {
  const values={departure,rest},expected=oracles["n5-c-road-schedule"](values);
  equal(buildAccept("n5-c-road-schedule",values),expected,"Whole schedule domain "+departure+","+rest);
  if(expected)schedules++;
}
equal(schedules,66,"All sixty-six valid schedules are accepted, including earlier arrivals");
verify(buildAccept("n5-c-road-schedule",{departure:0,rest:20}),"Arrival exactly at the deadline is valid");
verify(buildAccept("n5-c-road-schedule",{departure:0,rest:10}),"Arrival before the deadline is valid");
verify(!buildAccept("n5-c-road-schedule",{departure:1,rest:20}),"One minute late is invalid");
const mistakes = [
  ["n1-c-missing-row",{extra:120,included:140},"rubles mistaken for minutes"],
  ["n1-c-missing-row",{extra:40,included:260},"total minutes mistaken for included minutes"],
  ["n2-c-scale-plan",{a:0.75,b:0.5,area:24},"scale reversed"],
  ["n2-c-scale-plan",{a:12,b:8,area:96},"drawing square centimetres mistaken for real square metres"],
  ["n2-c-paper-rounding",{exact:0.6237,rounded:0.624},"wrong area conversion power"],
  ["n2-c-paper-rounding",{exact:0.06237,rounded:0.063},"rounding up although the next digit is three"],
  ["n3-c-road-comparison",{direct:14,via:14,directTime:42,viaTime:24},"straight distance mistaken for broken route"],
  ["n3-c-road-comparison",{direct:10,via:14,directTime:0.5,viaTime:0.4},"hours entered as minutes"],
  ["n3-c-same-perimeter",{a:4,b:6},"same area is not smaller"],
  ["n3-c-same-perimeter",{a:5,b:5},"same perimeter alone is insufficient"],
  ["n4-c-original-price",{before:990,saving:90},"ten percent incorrectly taken from final price"],
  ["n5-c-pack-budget",{small:6,large:0},"enough area but over budget"],
  ["n5-c-pack-budget",{small:0,large:2},"within budget but insufficient area"],
  ["n5-c-road-schedule",{departure:20,rest:10},"late arrival despite individually permitted fields"]
];
for(const [id,values,label] of mistakes) {
  verify(!oracles[id](values),id+" independent rejection: "+label);
  verify(!buildAccept(id,values),id+" engine rejection: "+label);
}
verify(buildAccept("n2-c-paper-rounding",{exact:"6237/100000",rounded:"62/1000"}),"Exact fractional equivalents accepted");
verify(buildAccept("n4-c-original-price",{before:"900/0.9",saving:"1000-900"}),"Equivalent recovery calculation accepted");

console.log(JSON.stringify({status:"PASS",checks,topics:topics.length,skills:skills.length,ordinary:20,creative:15,routes:expansion.routes.length,contexts:contexts.length,rectangleSolutions:rectangleSolutions.length,budgetSolutions:packSolutions.length,validSchedules:schedules,scope:"Independent practical mathematics, units, exact diagrams, routes, working trainer links and positive/negative engine responses. Browser layout is checked separately."},null,2));
