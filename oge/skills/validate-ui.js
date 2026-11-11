"use strict";

// Reproducible integration checks against the built HTML, not a real browser.
// Run: npm run build && npm run test:dom
// Stop at the first failure. No application code or task data is patched here.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const {
  createHarness, DEFAULT_HTML, DEFAULT_TIME, STORAGE_PROGRESS, STORAGE_SESSION
} = require("./dom-harness.js");

const REPORT_PATH = path.join(__dirname, "QA_DOM_REPORT.json");
const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const html = fs.readFileSync(DEFAULT_HTML, "utf8");
const sourceNames = [
  "series-arithmetic.js", "series-equations.js", "series-functions.js",
  "series-exam-bridges.js", "series-foundation-bridges.js", "series-runtime.js", "exam-format.js", "engine.js"
];
const parts = sourceNames.filter(name=>name.startsWith("series-")&&name!=="series-runtime.js").map(name => require("./" + name));
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "course-data.json"), "utf8"));
const routes = parts.flatMap(part => part.routes).concat(data.routes||[]);
const sha = value => crypto.createHash("sha256").update(value).digest("hex");
const plain = value => JSON.parse(JSON.stringify(value));
let currentTrace = [];
const report = {
  status: "running",
  generatedAt: new Date().toISOString(),
  method: "JSDOM 31.0.0 from a local HTML string; actual DOM controls and application event handlers",
  sourceHtml: path.basename(DEFAULT_HTML),
  htmlSha256: sha(html),
  sourceSha256: Object.fromEntries(sourceNames.map(name => [
    name, sha(fs.readFileSync(path.join(__dirname, name)))
  ])),
  syntheticSvgWidths: [320, 736],
  network: "External resources are disabled; fetch, XHR, WebSocket and sendBeacon throw.",
  limitations: [
    "This is DOM emulation, not a real browser or a file-URL launch.",
    "getBoundingClientRect returns fabricated dimensions solely for finite SVG arithmetic.",
    "Widths 320/736 do not prove responsive CSS layout, label fit, clipping appearance or absence of visual overlap.",
    "ResizeObserver and animation frames are controlled stubs.",
    "No claim is made about touch targets, real pointer gestures, browser accessibility trees or rendered screenshots.",
    "The fake clock tests local application bookkeeping; no notification or background scheduling service is tested.",
    "New exam visuals are checked against their task data; this DOM gate is not a full independent mathematical audit of the ten bridge generators."
  ],
  passed: [],
  failed: null,
  cssParserWarnings: [],
  routeResults: [],
  staticTypes: [],
  generatedVisuals: [],
  liveGeometry: [],
  examVisuals: []
};

function fixture(options, callback) {
  const trace = [];
  currentTrace = trace;
  const context = {h: null, reload() { this.h = this.h.reload(); return this.h; }};
  try {
    context.h = createHarness(Object.assign({html, trace}, options));
    return callback(context);
  } finally {
    if (context.h) {
      for (const warning of context.h.cssWarnings) {
        if (!report.cssParserWarnings.includes(warning)) report.cssParserWarnings.push(warning);
      }
      context.h.close();
    }
  }
}
function noSuccessfulFeedback(h) {
  assert.equal(h.api.state.feedback, null, "Edited input retained success in application state.");
  for (const selector of [".task .feedback", ".task .after", ".task .after-options",
    '.task button[data-action="next"]']) {
    assert.equal(h.document.querySelector(selector), null,
      "Edited input retained stale success controls: " + selector);
  }
}
function assertSvg(h, expected) {
  const figures = Array.from(h.document.querySelectorAll("[data-figure]"));
  if (expected) assert(figures.length > 0, "Expected a figure container.");
  for (const figure of figures) {
    const svgs = Array.from(figure.querySelectorAll("svg"));
    assert(svgs.length > 0, "A figure container has no generated SVG.");
    for (const svg of svgs) {
      assert(!/NaN|Infinity/.test(svg.outerHTML), "SVG contains a non-finite numeric value.");
      const viewBox = svg.getAttribute("viewBox").trim().split(/\s+/).map(Number);
      assert.equal(viewBox.length, 4);
      assert(viewBox.every(Number.isFinite) && viewBox[2] > 0 && viewBox[3] > 0,
        "SVG viewBox is not finite and positive.");
      assert.equal(Number(svg.getAttribute("width")), h.syntheticWidth,
        "SVG did not use the declared synthetic width.");
      assert(svg.querySelector("title") && svg.querySelector("title").textContent.trim(),
        "SVG is missing its text title.");
    }
  }
  return figures.reduce((count, figure) => count + figure.querySelectorAll("svg").length, 0);
}
function assertInverseSegments(svg, visual) {
  const curve = svg.querySelector("g[clip-path] path");
  assert(curve, "Inverse-function SVG has no plotted path.");
  const commands = Array.from(curve.getAttribute("d").matchAll(/([ML])([-+.\deE]+),([-+.\deE]+)/g));
  assert(commands.length > 10, "Inverse-function path has too few samples.");
  const width = Number(svg.getAttribute("width"));
  const xMin = Number.isFinite(visual.xMin) ? visual.xMin : -5;
  const xMax = Number.isFinite(visual.xMax) ? visual.xMax : 5;
  const dataX = screenX => xMin + (screenX - 42) / (width - 60) * (xMax - xMin);
  let previous = null, moves = 0;
  for (const [, command, xText, yText] of commands) {
    const x = dataX(Number(xText));
    assert(Number.isFinite(x) && Number.isFinite(Number(yText)));
    if (command === "M") moves++;
    if (command === "L" && previous !== null) {
      assert(!(previous < -1e-7 && x > 1e-7) && !(previous > 1e-7 && x < -1e-7),
        "An inverse-function line segment crosses x=0.");
    }
    previous = x;
  }
  if (xMin < 0 && xMax > 0) assert(moves >= 2, "Two hyperbola branches must use separate subpaths.");
}
function near(actual, expected, message) {
  assert(Number.isFinite(actual) && Number.isFinite(expected) &&
    Math.abs(actual - expected) <= 1e-7 * Math.max(1, Math.abs(actual), Math.abs(expected)),
  message + ": expected " + expected + ", received " + actual);
}
function pointNear(actual, expected, message) {
  near(actual[0], expected[0], message + " x");
  near(actual[1], expected[1], message + " y");
}
function polygonSnapshot(h, task) {
  const svg = h.query('[data-figure="custom"] svg');
  const polygon = svg.querySelector("polygon");
  assert(polygon, "Live polygon has no SVG polygon.");
  const vertices = polygon.getAttribute("points").trim().split(/\s+/)
    .map(point => point.split(",").map(Number));
  const gridLines = Array.from(svg.querySelectorAll('line[stroke="var(--rule)"]'))
    .map(line => ["x1", "y1", "x2", "y2"].map(name => Number(line.getAttribute(name))));
  const vertical = gridLines.filter(line => line[0] === line[2]).map(line => line[0]).sort((a, b) => a - b);
  const horizontal = gridLines.filter(line => line[1] === line[3]).map(line => line[1]).sort((a, b) => b - a);
  const bounds = task.visual.bounds;
  assert(bounds && vertical.length > 1 && horizontal.length > 1, "Expected a fixed unit grid.");
  assert.equal(vertical.length, Math.floor(bounds.xMax) - Math.ceil(bounds.xMin) + 1);
  assert.equal(horizontal.length, Math.floor(bounds.yMax) - Math.ceil(bounds.yMin) + 1);
  const unitX = vertical[1] - vertical[0], unitY = horizontal[0] - horizontal[1];
  near(unitX, unitY, "The unit grid must have equal horizontal and vertical scale");
  for (let index = 1; index < vertical.length; index++) near(vertical[index] - vertical[index - 1], unitX, "Unequal grid spacing");
  for (let index = 1; index < horizontal.length; index++) near(horizontal[index - 1] - horizontal[index], unitY, "Unequal grid spacing");
  const originX = vertical[-Math.ceil(bounds.xMin)];
  const originY = horizontal[-Math.ceil(bounds.yMin)];
  assert(Number.isFinite(originX) && Number.isFinite(originY), "The declared grid must contain its origin.");
  const mathematical = vertices.map(([x, y]) => [(x - originX) / unitX, (originY - y) / unitY]);
  const markers = Array.from(svg.querySelectorAll('circle[r="3"]'))
    .map(node => [Number(node.getAttribute("cx")), Number(node.getAttribute("cy"))]);
  assert.equal(markers.length, vertices.length);
  markers.forEach((point, index) => pointNear(point, vertices[index], "Vertex marker differs from polygon"));
  const diagonals = Array.from(svg.querySelectorAll("line[stroke-dasharray]")).map(node => [
    [Number(node.getAttribute("x1")), Number(node.getAttribute("y1"))],
    [Number(node.getAttribute("x2")), Number(node.getAttribute("y2"))]
  ]);
  assertSvg(h, true);
  return {vertices, mathematical, unitX, unitY, vertical, horizontal, diagonals,
    viewBox: svg.getAttribute("viewBox")};
}
function sameGrid(before, after) {
  assert.deepEqual(after.vertical, before.vertical, "Horizontal geometry change moved or rescaled the fixed grid.");
  assert.deepEqual(after.horizontal, before.horizontal, "Vertical geometry change moved or rescaled the fixed grid.");
  assert.equal(after.viewBox, before.viewBox);
}
function assertMathVertices(snapshot, expected) {
  assert.equal(snapshot.mathematical.length, expected.length);
  snapshot.mathematical.forEach((point, index) => pointNear(point, expected[index], "Mathematical vertex " + index));
}
function squaredDistance(a, b) { return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2; }
function polygonArea(points) {
  return Math.abs(points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];
    return sum + point[0] * next[1] - point[1] * next[0];
  }, 0)) / 2;
}
function placeholderOnly(h) {
  const figure = h.query('[data-figure="custom"]');
  assert.equal(figure.querySelector("svg"), null, "Invalid input kept the old drawing.");
  const placeholder = figure.querySelector('.figure-placeholder[role="status"]');
  assert(placeholder && placeholder.textContent.includes("допустимых значений"),
    "Invalid input must give an explicit placeholder.");
}
function rectanglesSnapshot(h, a, b) {
  const svg = h.query('[data-figure="custom"] svg');
  const rectangles = Array.from(svg.querySelectorAll("rect")).map(node =>
    Object.fromEntries(["x", "y", "width", "height"].map(name => [name, Number(node.getAttribute(name))])));
  assert.equal(rectangles.length, 2);
  const [reference, current] = rectangles, scale = reference.width / 2;
  assert(scale > 0);
  near(reference.height / 8, scale, "Reference rectangle has different axis scales");
  near(current.width / a, scale, "Rectangles use different horizontal scales");
  near(current.height / b, scale, "Rectangles use different vertical scales");
  const text = Array.from(svg.querySelectorAll("text"), node => node.textContent.replace(/\s+/g, " ").trim());
  assert(text.includes("S = 16; P = 20"), "Reference area/perimeter annotation changed.");
  assert(text.includes("S = " + a * b + "; P = " + 2 * (a + b)),
    "Current rectangle area/perimeter annotation does not match the entered sides.");
  assertSvg(h, true);
  return {reference, current, scale};
}
function seedStorage(seed) {
  // Only the existing deterministic seed cursor is configured. Answers are
  // still entered through actual controls and normal application events.
  return new Map([[STORAGE_SESSION, JSON.stringify({seedCounter: (seed + 1000 - 71) % 1000})]]);
}
function intervalKinds(visual) {
  const kinds = new Set();
  for (const row of visual.rows) {
    if (!row.segments.length) kinds.add("empty");
    if (row.segments.length > 1) kinds.add("union");
    for (const segment of row.segments) {
      kinds.add(segment.from === null && segment.to === null ? "all-real" :
        segment.from === null || segment.to === null ? "ray" :
          segment.from === segment.to ? "singleton" : "bounded");
    }
  }
  return kinds;
}
function assertIntervals(h, visual) {
  const svg = h.query('[data-figure="custom"] svg');
  const axes = Array.from(svg.querySelectorAll('line[stroke="var(--soft)"][stroke-width="1.2"]'));
  assert.equal(axes.length, visual.rows.length);
  for (let index = 0; index < visual.rows.length; index++) {
    const row = visual.rows[index], axis = axes[index];
    const y = Number(axis.getAttribute("y1")), left = Number(axis.getAttribute("x1")),
      right = Number(axis.getAttribute("x2"));
    near(Number(axis.getAttribute("y2")), y, "Number line must be horizontal");
    const labels = Array.from(svg.querySelectorAll("text")).filter(node =>
      Number(node.getAttribute("x")) === 13 && Math.abs(Number(node.getAttribute("y")) - y - 4) < 1e-7);
    assert.equal(labels.length, 1);
    assert.equal(labels[0].textContent, row.label);
    const lines = Array.from(svg.querySelectorAll('line[stroke="var(--accent)"]'))
      .filter(node => Math.abs(Number(node.getAttribute("y1")) - y) < 1e-7);
    assert.equal(lines.length, row.segments.length);
    const expectedEndpoints = new Map(), expectedArrows = [];
    row.segments.forEach((segment, segmentIndex) => {
      const line = lines[segmentIndex];
      const actualLeft = Number(line.getAttribute("x1")), actualRight = Number(line.getAttribute("x2"));
      near(Number(line.getAttribute("y2")), y, "Solution segment must lie on its own number line");
      if (segment.from === null) { near(actualLeft, left, "Left ray must reach the scale boundary"); expectedArrows.push(left); }
      else {
        near((actualLeft - left) / (right - left), (segment.from - visual.min) / (visual.max - visual.min),
          "Left endpoint has the wrong coordinate");
        expectedEndpoints.set(String(segment.from), !!segment.fromClosed);
      }
      if (segment.to === null) { near(actualRight, right, "Right ray must reach the scale boundary"); expectedArrows.push(right); }
      else {
        near((actualRight - left) / (right - left), (segment.to - visual.min) / (visual.max - visual.min),
          "Right endpoint has the wrong coordinate");
        expectedEndpoints.set(String(segment.to), !!segment.toClosed);
      }
      assert(actualLeft <= actualRight + 1e-7, "Solution segment is reversed.");
    });
    const actualEndpoints = new Map();
    Array.from(svg.querySelectorAll("circle")).filter(node =>
      Math.abs(Number(node.getAttribute("cy")) - y) < 1e-7).forEach(node => {
      const x = Number(node.getAttribute("cx"));
      const value = visual.min + (x - left) / (right - left) * (visual.max - visual.min);
      const key = Array.from(expectedEndpoints.keys()).find(candidate => Math.abs(Number(candidate) - value) < 1e-7);
      assert.notEqual(key, undefined, "An endpoint marker has no corresponding finite boundary.");
      const fill = node.getAttribute("fill");
      assert(["var(--accent)", "var(--paper)"].includes(fill), "Unknown open/closed point fill.");
      const closed = fill === "var(--accent)";
      assert.equal(closed, expectedEndpoints.get(key), "Boundary inclusion is drawn incorrectly.");
      actualEndpoints.set(key, closed);
    });
    assert.equal(actualEndpoints.size, expectedEndpoints.size, "A finite endpoint marker is missing.");
    const arrows = Array.from(svg.querySelectorAll('path[stroke="var(--accent)"]')).map(node => {
      const numbers = node.getAttribute("d").match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi).map(Number);
      assert.equal(numbers.length, 6);
      return {tipX: numbers[2], tipY: numbers[3], wingX: numbers[0]};
    }).filter(arrow => Math.abs(arrow.tipY - y) < 1e-7);
    assert.equal(arrows.length, expectedArrows.length, "An infinite direction is missing or spuriously drawn.");
    const actualArrowXs = arrows.map(arrow => arrow.tipX).sort((a, b) => a - b);
    expectedArrows.sort((a, b) => a - b).forEach((x, i) => near(actualArrowXs[i], x, "Arrow tip"));
    arrows.forEach(arrow => assert(
      Math.abs(arrow.tipX - left) < 1e-7 ? arrow.wingX > arrow.tipX : arrow.wingX < arrow.tipX,
      "A solution ray arrow points inward."));
    if (!row.segments.length) {
      assert(Array.from(svg.querySelectorAll("text")).some(node =>
        node.textContent === "Нет решений" && Math.abs(Number(node.getAttribute("y")) - y + 10) < 1e-7),
      "Empty solution row lacks its explicit empty-set label.");
    }
  }
  assertSvg(h, true);
}
function reviewButton(h, familyId) {
  h.openDetails("details.review-queue");
  h.click('.review-queue button[data-action="review"][data-family="' + familyId + '"]');
}
function queueSolvedFamily(h, familyId) {
  h.openFamily(familyId);
  const anchor = h.solve();
  h.click('.after-options button[data-action="queue-review"]');
  const item = h.api.state.reviews[familyId];
  assert(item && item.pending);
  assert.equal(item.anchorTaskId, anchor.id);
  assert.equal(item.dueAt, h.clock.now + DAY);
  return {anchor, item};
}

const tests = [];
function test(name, body) { tests.push({name, body}); }

test("built-html-matches-current-sources", () => {
  for(const [name,expected] of Object.entries(data.sourceDataSha256||{})) {
    assert.equal(sha(fs.readFileSync(path.join(__dirname,name))),expected,"Rebuild after changing task data: "+name);
  }
  for (const name of sourceNames) {
    const source = fs.readFileSync(path.join(__dirname, name), "utf8").trim();
    assert(html.includes(source),
      "Built HTML is stale for " + name + ". Rebuild before running the DOM gate.");
  }
  assert.equal(routes.length, 64, "Preserve the original 39 routes and add 25 practical, second-part and division routes.");
  assert.equal(parts.reduce((sum, part) => sum + part.families.length, 0), 46);
  assert(!/<script\b[^>]*\bsrc\s*=/i.test(html), "The offline build unexpectedly loads an external script.");
});

test("default-quick-practice-and-collapsed-map", () => fixture({}, ({h}) => {
  assert.deepEqual(plain(h.api.data), data, "Built course data differs from course-data.json.");
  assert.equal(h.api.state.mode, "quick");
  assert.equal(h.api.state.activeRun, null);
  assert.equal(h.api.state.map, false);
  assert.equal(h.query('button[data-action="map"]').getAttribute("aria-expanded"), "false");
  assert.equal(h.document.querySelector("section.map"), null);
  assert.equal(h.document.querySelectorAll(".progress-dots span").length, 4);
  assert.equal(h.api.series.routes.length, 64);
  assert.equal(h.api.series.families.length, 46);
}));

for (const route of routes) {
  test("route-" + route.id, () => fixture({}, ({h}) => {
    h.openRoute(route.id);
    const active = h.api.state.runs[route.id];
    assert.equal(active.refs.length, route.steps.length);
    assert(route.steps.length >= 3 && route.steps.length <= 5);
    assert.equal(h.api.task().learningMode, "quick", "Route must start with ordinary practice.");
    const all = h.api.series.materialize(active);
    assert.equal(all[all.length - 1].learningMode, "quick", "Route must finish with ordinary practice.");
    const ordinaryTotal = all.filter(task => task.learningMode !== "creative").length;
    let solved = 0, skipped = 0;
    for (let index = 0; index < route.steps.length; index++) {
      const task = h.api.task();
      assert(task, "Route ended before its declared final step.");
      assert.equal(active.cursor, index);
      assert(h.query(".stage-count").textContent.includes("Шаг " + (index + 1) + " из " + route.steps.length));
      assert.equal(h.document.querySelectorAll(".progress-dots span").length, ordinaryTotal,
        "Optional workshops increased the ordinary-practice denominator.");
      if (task.learningMode === "creative") {
        h.click('button[data-action="skip-workshop"]');
        assert(active.skipped.includes(task.id), "Skipped workshop was not recorded as skipped.");
        assert(!h.api.progress[task.id] || !h.api.progress[task.id].successful,
          "Skipped workshop was counted as a successful answer.");
        skipped++;
      } else {
        assert.equal(h.document.querySelector('button[data-action="skip-workshop"]'), null);
        h.solve();
        h.click('.after button[data-action="next"]');
        solved++;
      }
    }
    assert.equal(h.api.task(), undefined);
    assert.equal(active.cursor, route.steps.length);
    assert.equal(h.query(".completed h2").textContent, "Выбранная работа завершена");
    const writtenSteps = data.topics.find(topic => topic.id === route.topicId).assessment === "written-steps";
    const resultVerb = writtenSteps ? "проверено " : "решено ";
    assert(h.query(".ordinary-result").textContent.includes(resultVerb + solved + " из " + ordinaryTotal));
    if (writtenSteps) assert(h.query(".completed .written-work-note").textContent.includes("Полное письменное решение"));
    assert(h.query(".workshop-result").textContent.includes("мастерских: 0"));
    if (skipped) assert(h.query(".workshop-result").textContent.includes("можно оставить на потом"));
    if (solved === 2 && skipped > 0) {
      assert(h.query(".ordinary-result").textContent.includes(resultVerb + "2 из 2"),
        "Skipping optional workshops must still finish ordinary practice as 2 of 2.");
      assert(!h.query(".ordinary-result").textContent.includes("из " + route.steps.length));
    }
    report.routeResults.push({id: route.id, steps: route.steps.length, ordinaryTotal, solved, skipped});
  }));
}

for (const [type, id] of [
  ["answer", "base-q-place"], ["graph", "n11-c1"],
  ["match", "func-graph-match"], ["build", "base-c-exchange"]
]) {
  test("edit-after-success-clears-controls-" + type, () => fixture({}, ({h}) => {
    if (type === "match") h.openFamily(id); else h.openStatic(id);
    const task = h.solve();
    h.query(".after-options");
    if (type === "answer") h.input('[data-field="answer"]', Number(task.answer) + 1);
    else if (type === "graph") h.input('[data-field="k"]', task.k + 0.25);
    else if (type === "match") {
      const alternative = task.pairs.find(pair => pair.right !== task.pairs[0].right).right;
      h.select('select[data-field="match"][data-index="0"]', alternative);
    } else {
      const field = task.fields[0].name;
      h.input('input[data-field="build"][data-name="' + field + '"]', Number(task.exampleSolution[field]) + 1);
    }
    noSuccessfulFeedback(h);
  }));
}

for (const helpAction of ["hint", "solution"]) {
  test("hidden-" + helpAction + "-survives-reload-as-help", () => fixture({}, context => {
    let h = context.h;
    h.openFamily("eq-linear-balance");
    const id = h.api.task().id;
    h.input('[data-field="answer"]', "17.5");
    h.click('button[data-action="' + helpAction + '"]');
    assert.equal(h.api.taskState(h.api.task()).helpUsed, true);
    h.click('button[data-action="' + helpAction + '"]');
    assert.equal(h.query('button[data-action="' + helpAction + '"]').getAttribute("aria-expanded"), "false");
    h = context.reload();
    assert.equal(h.api.task().id, id);
    assert.equal(h.query('[data-field="answer"]').value, "17.5");
    assert.equal(h.api.taskState(h.api.task()).helpUsed, true);
    assert.equal(h.query('button[data-action="' + helpAction + '"]').getAttribute("aria-expanded"), "false");
    h.solve();
    assert.equal(h.api.progress[id].independent, 0);
    assert.equal(h.api.progress[id].helped, 1);
    assert(h.query(".after").textContent.includes("с помощью"));
  }));
}

test("fresh-mathematical-variant-after-help-is-a-clean-attempt", () => fixture({}, ({h}) => {
  h.openFamily("eq-linear-balance");
  const old = h.api.task();
  h.click('button[data-action="solution"]');
  h.click('.task button[data-action="variant"]');
  const fresh = h.api.task();
  assert.notEqual(fresh.id, old.id);
  assert.notEqual(h.api.series.signature(fresh), h.api.series.signature(old));
  assert.equal(h.api.taskState(fresh).helpUsed, false);
  assert.equal(h.query('[data-field="answer"]').value, "");
  h.solve();
  assert.equal(h.api.progress[fresh.id].independent, 1);
  assert.equal(h.api.progress[fresh.id].helped, 0);
  assert(h.api.progress[old.id].guided && h.api.progress[old.id].solutions > 0);
}));

test("same-mathematics-under-another-seed-retains-id-and-help-history", () => fixture({}, context => {
  let h = context.h;
  h.openFamily("arith-root-counterexample");
  const original = h.api.task();
  const alias = Array.from({length: h.api.series.maxSeeds}, (_, seed) => seed)
    .find(seed => seed !== original.variantSeed &&
      h.api.series.task(original.familyId, seed).id === original.id);
  assert.notEqual(alias, undefined, "Expected an existing duplicate mathematical variant in this family.");
  const duplicate = h.api.series.task(original.familyId, alias);
  assert.equal(h.api.series.signature(duplicate), h.api.series.signature(original));
  h.click('button[data-action="hint"]');
  h.click('button[data-action="hint"]');
  h.fillCorrect();
  const savedAnswer = h.query('[data-field="answer"]').value;
  // Storage fixture: replay the same mathematical task using an existing alias
  // seed. This exercises runtime materialization and restoration, not an
  // undocumented UI control and not a mutation of the learner's answer.
  const session = JSON.parse(h.storage.get(STORAGE_SESSION));
  session.runs[session.activeRun].refs[0].seed = alias;
  h.storage.set(STORAGE_SESSION, JSON.stringify(session));
  h = context.reload();
  assert.equal(h.api.task().id, original.id);
  assert.equal(h.api.task().variantSeed, alias);
  assert.equal(h.query('[data-field="answer"]').value, savedAnswer);
  assert.equal(h.api.taskState(h.api.task()).helpUsed, true);
  h.solve();
  assert.equal(h.api.progress[original.id].independent, 0);
  assert.equal(h.api.progress[original.id].helped, 1);
}));

test("resume-route-position-input-skips-and-help", () => fixture({}, context => {
  let h = context.h;
  const routeId = "route-eq-linear-foundation";
  h.openRoute(routeId);
  h.solve();
  h.click('.after button[data-action="next"]');
  h.click('button[data-action="skip-workshop"]');
  const current = h.api.task();
  assert.equal(current.type, "build");
  const field = current.fields[0].name;
  h.input('input[data-field="build"][data-name="' + field + '"]', "2");
  h.click('button[data-action="hint"]');
  const skipped = plain(h.api.state.runs[routeId].skipped);
  h = context.reload();
  assert.equal(h.api.state.activeRun, routeId);
  assert.equal(h.api.state.runs[routeId].cursor, 2);
  assert.equal(h.api.task().id, current.id);
  assert.equal(h.query('input[data-field="build"][data-name="' + field + '"]').value, "2");
  assert.equal(h.api.taskState(h.api.task()).helpUsed, true);
  assert.equal(h.query('button[data-action="hint"]').getAttribute("aria-expanded"), "true");
  assert.deepEqual(plain(h.api.state.runs[routeId].skipped), skipped);
}));

test("external-map-prerequisite-and-return-preserve-answer", () => fixture({}, ({h}) => {
  h.openFamily("eq-linear-balance");
  const originalId = h.api.task().id;
  const originalRun = h.api.state.activeRun;
  h.input('[data-field="answer"]', "17.5");
  h.click('button[data-action="map"]');
  h.click('button[data-action="skill"][data-skill="n9-equality"]');
  h.click('button[data-action="prerequisite"][data-skill="base-sign"]');
  assert.equal(h.api.state.topic, "base");
  assert.notEqual(h.api.task().id, originalId);
  h.click(".return-link");
  assert.equal(h.api.state.activeRun, originalRun);
  assert.equal(h.api.task().id, originalId);
  assert.equal(h.query('[data-field="answer"]').value, "17.5");
}));

test("related-map-exercise-preserves-return-without-granting-unchecked-skill", () => fixture({}, ({h}) => {
  h.select("#skill-topic", "n14");
  const original = h.api.task();
  h.input('[data-field="answer"]', "17.5");
  h.click('button[data-action="map"]');
  h.click('button[data-action="skill"][data-skill="n14-time-steps"]');
  const initialState = h.query(".skill-state").textContent;
  assert(initialState.includes("ещё не проверяли"));
  assert(h.query(".skill-detail").textContent.includes("Отдельная проверка этого навыка пока не выделена"));
  h.click('.skill-detail button[data-action="variant"][data-family="exam-geometric-time"]');
  assert.equal(h.api.task().familyId, "exam-geometric-time");
  assert.equal(h.api.task().skillId, "n14-geometric-term");
  const solved = h.solve();
  assert.equal(h.api.progress[solved.id].independent, 1);
  assert(!Object.values(h.api.progress).some(record =>
    record.skillId === "n14-time-steps" && record.successful > 0),
  "A related exercise automatically granted success for a separately unchecked skill.");
  h.click(".return-link");
  assert.equal(h.api.state.topic, "n14");
  assert.equal(h.api.state.map, true);
  assert.equal(h.api.state.skill, "n14-time-steps");
  assert.equal(h.api.task().id, original.id);
  assert.equal(h.query('[data-field="answer"]').value, "17.5");
  assert.equal(h.query(".skill-state").textContent, initialState);
  h.click('button[data-action="skill"][data-skill="n14-geometric-term"]');
  assert(h.query(".skill-state").textContent.includes("обычных задач — 1"));
}));

const staticExamples = new Map();
for (const topic of data.topics) {
  for (const mode of ["quick", "creative"]) {
    for (const task of topic[mode]) if (!staticExamples.has(task.type)) staticExamples.set(task.type, task.id);
  }
}
assert.equal(staticExamples.size, 15, "Expected fifteen supported static interaction types including function-argument selection.");
for (const [type, id] of staticExamples) {
  test("static-interaction-" + type, () => fixture({}, ({h}) => {
    h.openStatic(id);
    assert.equal(h.api.task().type, type);
    if (type === "tiltArea") h.input('[data-field="skew"]', "0.7");
    const task = h.solve();
    assert.equal(h.api.progress[task.id].independent, 1);
    assertSvg(h, ["numberline", "graph", "tiltArea", "triangleGate"].includes(type) || !!task.visual);
    report.staticTypes.push(type);
  }));
}

for (const width of [320, 736]) {
  for (const familyId of [
    "func-table-rule", "func-parabola-formula",
    "func-inverse-coefficient", "func-graph-match"
  ]) {
    test("generated-dom-" + familyId + "-synthetic-" + width, () => fixture({width}, ({h}) => {
      h.openFamily(familyId);
      const task = h.api.task();
      if (task.table) {
        assert.equal(h.document.querySelectorAll(".task-table thead th").length, task.table.headers.length);
        assert.equal(h.document.querySelectorAll(".task-table tbody tr").length, task.table.rows.length);
        assert.deepEqual(Array.from(h.document.querySelectorAll(".task-table thead th"), node => node.textContent),
          Array.from(task.table.headers, String));
      }
      if (task.visual) {
        assertSvg(h, true);
        if (task.visual.kind === "function" && task.visual.family === "inverse") {
          assertInverseSegments(h.query('[data-figure="custom"] svg'), task.visual);
        }
        if (task.visual.kind === "graphs") {
          assert.equal(h.document.querySelectorAll(".graph-panel").length, task.visual.plots.length);
          assert.equal(h.document.querySelectorAll('select[data-field="match"]').length, task.pairs.length);
          task.visual.plots.forEach((plot, index) => {
            const panel = h.query('[data-plot-index="' + index + '"]');
            assert.equal(panel.closest(".graph-panel").querySelector("h3").textContent, plot.label);
            if (plot.family === "inverse") assertInverseSegments(panel.querySelector("svg"), plot);
          });
        }
      }
      h.solve();
      assertSvg(h, !!task.visual);
      report.generatedVisuals.push({familyId, syntheticWidth: width, type: task.type,
        visual: task.visual ? task.visual.kind : "table"});
    }));
  }
}

test("pause-queue-rejects-early-or-already-solved-and-credits-one-fresh-success", () =>
  fixture({clock: {now: DEFAULT_TIME}}, ({h}) => {
    const familyId = "eq-linear-balance";
    const {anchor} = queueSolvedFamily(h, familyId);
    h.setTime(DEFAULT_TIME + 23 * HOUR);
    reviewButton(h, familyId);
    const early = h.solve();
    assert.notEqual(early.id, anchor.id);
    assert.equal(h.api.state.reviews[familyId].completedCount, 0);
    assert.equal(h.api.state.reviews[familyId].pending, true);
    assert.equal(h.api.state.reviews[familyId].result, "practice_before_pause");
    h.setTime(DEFAULT_TIME + DAY + 1);
    h.click('button[data-action="check"]');
    assert.equal(h.api.state.reviews[familyId].completedCount, 0,
      "A task solved before 24 hours was credited merely by checking it again later.");
    assert.equal(h.api.state.reviews[familyId].pending, true);
    reviewButton(h, familyId);
    const fresh = h.api.task();
    assert.notEqual(fresh.id, early.id);
    assert.notEqual(fresh.id, anchor.id);
    assert.equal(h.api.taskState(fresh).helpUsed, false);
    h.solve();
    assert.equal(h.api.state.reviews[familyId].completedCount, 1);
    assert.equal(h.api.state.reviews[familyId].pending, false);
    assert.equal(h.api.state.reviews[familyId].result, "independent_after_pause");
    assert.equal(h.api.state.reviews[familyId].completedTaskId, fresh.id);
    h.click('button[data-action="check"]');
    assert.equal(h.api.state.reviews[familyId].completedCount, 1,
      "Repeated Check counted the same pause review twice.");
  }));

test("helped-review-restarts-pause-before-another-independent-attempt", () =>
  fixture({clock: {now: DEFAULT_TIME}}, ({h}) => {
    const familyId = "eq-linear-balance";
    queueSolvedFamily(h, familyId);
    h.setTime(DEFAULT_TIME + 25 * HOUR);
    reviewButton(h, familyId);
    const helpedId = h.api.task().id;
    h.click('button[data-action="hint"]');
    h.click('button[data-action="hint"]');
    h.solve();
    const item = h.api.state.reviews[familyId];
    assert.equal(item.completedCount, 0);
    assert.equal(item.pending, true);
    assert.equal(item.anchorTaskId, helpedId);
    assert.equal(item.dueAt, DEFAULT_TIME + 49 * HOUR);
    h.setTime(DEFAULT_TIME + 26 * HOUR);
    reviewButton(h, familyId);
    h.solve();
    assert.equal(item.completedCount, 0,
      "Original due time was reused after a review with help.");
    h.setTime(DEFAULT_TIME + 49 * HOUR + 1);
    reviewButton(h, familyId);
    h.solve();
    assert.equal(item.completedCount, 1);
    assert.equal(item.pending, false);
  }));

test("opening-review-help-reschedules-even-without-checking-the-answer", () =>
  fixture({clock: {now: DEFAULT_TIME}}, context => {
    let h = context.h;
    const familyId = "eq-linear-balance";
    queueSolvedFamily(h, familyId);
    h.setTime(DEFAULT_TIME + 25 * HOUR);
    reviewButton(h, familyId);
    h.click('button[data-action="solution"]');
    h.click('button[data-action="solution"]');
    // Help has already been shown. Do not require a successful Check before
    // preserving that fact in the pause schedule.
    assert(h.api.state.reviews[familyId].dueAt >= DEFAULT_TIME + 49 * HOUR,
      "Opening review help left the old due time; a new task can receive after-pause credit immediately after help.");
    h = context.reload();
    assert(h.api.state.reviews[familyId].dueAt >= DEFAULT_TIME + 49 * HOUR,
      "The rescheduled pause after help was not persisted.");
    reviewButton(h, familyId);
    h.solve();
    assert.equal(h.api.state.reviews[familyId].completedCount, 0,
      "A fresh task immediately after disclosed help was counted as an independent review after a pause.");
  }));

test("automatic-error-help-reschedules-another-family-of-the-same-skill", () =>
  fixture({clock: {now: DEFAULT_TIME}}, ({h}) => {
    const queuedFamily = "eq-brackets";
    queueSolvedFamily(h, queuedFamily);
    h.setTime(DEFAULT_TIME + 25 * HOUR);
    h.openFamily("eq-first-error");
    assert.equal(h.api.task().skillId, h.api.state.reviews[queuedFamily].skillId);
    const wrong = h.api.task().options.findIndex(option => !option.correct);
    h.click('button[data-action="option"][data-index="' + wrong + '"]');
    h.click('button[data-action="check"]');
    assert.equal(h.api.state.feedback.ok, false);
    assert.equal(h.api.state.reviews[queuedFamily].dueAt, DEFAULT_TIME + 49 * HOUR,
      "An automatic explanation in the same skill did not restart the pending pause.");
    reviewButton(h, queuedFamily);
    h.solve();
    assert.equal(h.api.state.reviews[queuedFamily].completedCount, 0);
    assert.equal(h.api.state.reviews[queuedFamily].pending, true);
  }));

for (const scenario of [
  {familyId: "arith-estimate-change", from: 0, to: 63},
  {familyId: "exam-geometry-one-true", from: 16, to: 19}
]) {
test("reordered-choice-presentation-keeps-help-but-not-old-indices-" + scenario.familyId, () =>
  fixture({storage: seedStorage(scenario.from)}, context => {
    let h = context.h;
    h.openFamily(scenario.familyId);
    const original = h.api.task();
    assert.equal(original.variantSeed, scenario.from);
    const nextPresentation = h.api.series.task(scenario.familyId, scenario.to);
    assert.equal(original.id, nextPresentation.id, "Known equivalent seeds must share their mathematical ID.");
    assert.notEqual(original.presentationId, nextPresentation.presentationId);
    assert.notDeepEqual(Array.from(original.options, option => option.text),
      Array.from(nextPresentation.options, option => option.text));
    const selected = original.options.findIndex(option => option.correct);
    h.click('button[data-action="option"][data-index="' + selected + '"]');
    h.click('button[data-action="hint"]');
    h.click('button[data-action="hint"]');
    assert.equal(h.document.querySelectorAll('.options button[aria-pressed="true"]').length, 1);
    const session = JSON.parse(h.storage.get(STORAGE_SESSION));
    session.runs[session.activeRun].refs[0].seed = scenario.to;
    h.storage.set(STORAGE_SESSION, JSON.stringify(session));
    h = context.reload();
    assert.equal(h.api.task().id, original.id);
    assert.equal(h.api.task().variantSeed, scenario.to);
    assert.equal(h.api.taskState(h.api.task()).helpUsed, true);
    assert.equal(h.document.querySelectorAll('.options button[aria-pressed="true"]').length, 0,
      "A different option order inherited positional selections from seed " + scenario.from + ".");
    assert.deepEqual(plain(h.api.taskState(h.api.task()).selected), []);
    h.solve();
    assert.equal(h.api.progress[original.id].independent, 0);
    assert.equal(h.api.progress[original.id].helped, 1);
  }));
}

test("map-counts-distinct-cards-and-separates-workshops", () => fixture({}, ({h}) => {
  h.openFamily("eq-root-meaning");
  h.solve();
  h.openFamily("eq-create-root");
  const task = h.solve();
  const values = Object.assign({}, task.constants, task.exampleSolution);
  const a = -values.a;
  let b = values.b, c = values.c;
  if (Object.prototype.hasOwnProperty.call(task.constants, "c")) b = c - a * values.r;
  else c = a * values.r + b;
  const other = {a, b, c};
  for (const field of task.fields) h.input('input[data-field="build"][data-name="' + field.name + '"]', other[field.name]);
  h.click('button[data-action="check"]');
  assert.equal(h.api.state.feedback.ok, true);
  assert.equal(h.api.progress[task.id].independent, 2, "Two different successful inputs are needed for this regression.");
  h.click('button[data-action="map"]');
  h.click('button[data-action="skill"][data-skill="n9-root"]');
  const text = h.query(".skill-state").textContent;
  assert(text.includes("обычных задач — 1"), "Map did not distinguish the ordinary card.");
  assert(text.includes("мастерских — 1"), "Map counted repeated inputs as extra workshop cards.");
  assert(text.includes("Считаются разные карточки."));
}));

for (const width of [320, 736]) {
  test("live-parallelogram-coordinates-diagonals-and-fixed-grid-" + width, () =>
    fixture({width}, ({h}) => {
      h.openStatic("n17-c-diagonals-counterexample");
      const task = h.api.task();
      const initial = polygonSnapshot(h, task);
      assertMathVertices(initial, [[0, 0], [4, 0], [4, 3], [0, 3]]);
      assert.equal(initial.diagonals.length, 2);
      h.input('[data-field="build"][data-name="s"]', 2);
      const shifted = polygonSnapshot(h, task);
      sameGrid(initial, shifted);
      assertMathVertices(shifted, [[0, 0], [4, 0], [6, 3], [2, 3]]);
      assert.notDeepEqual(shifted.vertices, initial.vertices);
      shifted.diagonals.forEach((diagonal, index) => {
        const pair = task.visual.diagonals[index];
        pointNear(diagonal[0], shifted.vertices[pair[0]], "Diagonal start");
        pointNear(diagonal[1], shifted.vertices[pair[1]], "Diagonal end");
      });
      near(squaredDistance(shifted.mathematical[0], shifted.mathematical[2]), 45, "AC squared");
      near(squaredDistance(shifted.mathematical[1], shifted.mathematical[3]), 13, "BD squared");
      h.input('[data-field="build"][data-name="a"]', 8);
      h.input('[data-field="build"][data-name="h"]', 8);
      h.input('[data-field="build"][data-name="s"]', -5);
      const edge = polygonSnapshot(h, task);
      sameGrid(initial, edge);
      assertMathVertices(edge, [[0, 0], [8, 0], [3, 8], [-5, 8]]);
      h.input('[data-field="build"][data-name="s"]', "");
      placeholderOnly(h);
      h.input('[data-field="build"][data-name="s"]', -5);
      sameGrid(initial, polygonSnapshot(h, task));
      h.input('[data-field="build"][data-name="a"]', 9);
      placeholderOnly(h);
      h.input('[data-field="build"][data-name="a"]', 8);
      const restored = polygonSnapshot(h, task);
      assert.deepEqual(restored.vertices, edge.vertices);
      h.solve();
      report.liveGeometry.push({taskId: task.id, syntheticWidth: width,
        checked: ["coordinates", "two diagonals", "fixed grid", "empty and out-of-range placeholders", "restoration"]});
    }));

  test("live-triangle-fixed-base-scale-area-and-restoration-" + width, () =>
    fixture({width}, ({h}) => {
      h.openStatic("n18-c-move-apex");
      const task = h.api.task(), initial = polygonSnapshot(h, task);
      assertMathVertices(initial, [[0, 0], [6, 0], [2, 4]]);
      h.input('[data-field="build"][data-name="x"]', 8);
      const moved = polygonSnapshot(h, task);
      sameGrid(initial, moved);
      assertMathVertices(moved, [[0, 0], [6, 0], [8, 4]]);
      pointNear(moved.vertices[0], initial.vertices[0], "Fixed point A");
      pointNear(moved.vertices[1], initial.vertices[1], "Fixed point B");
      near(polygonArea(moved.mathematical), 12, "Horizontal movement preserves area");
      h.input('[data-field="build"][data-name="y"]', 6);
      const higher = polygonSnapshot(h, task);
      sameGrid(initial, higher);
      assertMathVertices(higher, [[0, 0], [6, 0], [8, 6]]);
      near(polygonArea(higher.mathematical), 18, "Height change must change the displayed triangle's area");
      h.input('[data-field="build"][data-name="y"]', 4);
      h.solve();
      h.input('[data-field="build"][data-name="x"]', "");
      placeholderOnly(h);
      noSuccessfulFeedback(h);
      h.input('[data-field="build"][data-name="x"]', 8);
      sameGrid(initial, polygonSnapshot(h, task));
      h.input('[data-field="build"][data-name="x"]', 11);
      placeholderOnly(h);
      h.input('[data-field="build"][data-name="x"]', 8);
      const restored = polygonSnapshot(h, task);
      assert.deepEqual(restored.vertices, moved.vertices);
      report.liveGeometry.push({taskId: task.id, syntheticWidth: width,
        checked: ["fixed base", "unit scale", "coordinate movement", "areas 12 and 18", "placeholders and restoration"]});
    }));

  test("live-rectangles-common-scale-area-perimeter-and-restoration-" + width, () =>
    fixture({width}, ({h}) => {
      h.openStatic("n18-c-area-perimeter-counterexample");
      const task = h.api.task(), initial = rectanglesSnapshot(h, 2, 8);
      h.input('[data-field="build"][data-name="a"]', 4);
      h.input('[data-field="build"][data-name="b"]', 5);
      const changed = rectanglesSnapshot(h, 4, 5);
      assert.deepEqual(changed.reference, initial.reference);
      near(changed.scale, initial.scale, "Rectangle scale changed with the input");
      assert.notDeepEqual(changed.current, initial.current);
      h.input('[data-field="build"][data-name="a"]', 12);
      h.input('[data-field="build"][data-name="b"]', 1);
      const edge = rectanglesSnapshot(h, 12, 1);
      assert.deepEqual(edge.reference, initial.reference);
      near(edge.scale, initial.scale, "A long rectangle triggered automatic rescaling");
      h.input('[data-field="build"][data-name="b"]', "");
      placeholderOnly(h);
      h.input('[data-field="build"][data-name="b"]', 1);
      rectanglesSnapshot(h, 12, 1);
      h.input('[data-field="build"][data-name="a"]', 13);
      placeholderOnly(h);
      h.input('[data-field="build"][data-name="a"]', 12);
      assert.deepEqual(rectanglesSnapshot(h, 12, 1).current, edge.current);
      h.solve();
      report.liveGeometry.push({taskId: task.id, syntheticWidth: width,
        checked: ["common scale", "fixed reference", "S/P annotations", "empty and range placeholders", "restoration"]});
    }));
}

for (const width of [320, 736]) {
  for (const sample of [
    {family: "exam-inequality-picture", seed: 0, expected: ["ray"]},
    {family: "exam-inequality-system-picture", seed: 0, expected: ["bounded", "ray"]},
    {family: "exam-inequality-system-picture", seed: 3, expected: ["empty", "union", "ray"]},
    {family: "exam-inequality-system-picture", seed: 6, expected: ["singleton", "empty", "ray"]},
    {family: "exam-inequality-system-picture", seed: 7, expected: ["all-real", "empty", "ray"]}
  ]) {
    test("exam-intervals-" + sample.family + "-" + sample.seed + "-" + width, () =>
      fixture({width, storage: seedStorage(sample.seed)}, ({h}) => {
        h.openFamily(sample.family);
        const task = h.api.task();
        assert.equal(task.variantSeed, sample.seed);
        assert.equal(task.visual.kind, "intervals");
        assert.equal(task.visual.rows.length, 4);
        assert.equal(h.document.querySelectorAll(".options button").length, 4);
        const kinds = intervalKinds(task.visual);
        sample.expected.forEach(kind => assert(kinds.has(kind), "Targeted interval case is missing: " + kind));
        assertIntervals(h, task.visual);
        h.solve();
        report.examVisuals.push({familyId: sample.family, seed: sample.seed,
          syntheticWidth: width, visual: "intervals", kinds: Array.from(kinds).sort()});
      }));
  }
  for (const [seed, mode] of [[0, "outer"], [1, "inner"]]) {
    test("exam-circle-square-" + mode + "-" + width, () =>
      fixture({width, storage: seedStorage(seed)}, ({h}) => {
        h.openFamily("exam-circle-square-area");
        const task = h.api.task();
        assert.equal(task.variantSeed, seed);
        assert.equal(task.visual.mode, mode);
        const svg = h.query('[data-figure="custom"] svg');
        const circle = svg.querySelector("circle"), square = svg.querySelector("rect");
        assert(circle && square, "Both circle and square must be drawn.");
        const cx = Number(circle.getAttribute("cx")), cy = Number(circle.getAttribute("cy")),
          r = Number(circle.getAttribute("r"));
        const x = Number(square.getAttribute("x")), y = Number(square.getAttribute("y")),
          side = Number(square.getAttribute("width")), height = Number(square.getAttribute("height"));
        assert(r > 0 && side > 0);
        near(side, height, "Drawn square sides");
        near(x + side / 2, cx, "Square/circle horizontal centers");
        near(y + height / 2, cy, "Square/circle vertical centers");
        if (mode === "outer") {
          [cx - x, x + side - cx, cy - y, y + height - cy].forEach(distance =>
            near(distance, r, "A circumscribed square side must be tangent to the circle"));
        } else {
          [[x, y], [x + side, y], [x + side, y + height], [x, y + height]].forEach(corner =>
            near(squaredDistance(corner, [cx, cy]), r * r, "An inscribed square vertex must lie on the circle"));
        }
        const physicalSide = side / r * task.visual.radius;
        near(physicalSide * physicalSide, task.answer, "Drawn relation and radius must imply the stated area answer");
        assertSvg(h, true);
        h.solve();
        report.examVisuals.push({familyId: task.familyId, seed, syntheticWidth: width,
          visual: "circleSquare", mode, checked: "center, square sides, tangency or vertices on circle, area"});
      }));
  }
  test("exam-two-point-grid-segment-" + width, () =>
    fixture({width, storage: seedStorage(0)}, ({h}) => {
      h.openFamily("exam-grid-distance");
      const task = h.api.task(), svg = h.query('[data-figure="custom"] svg');
      assert.equal(task.variantSeed, 0);
      assert.equal(task.visual.points.length, 2);
      assert.equal(svg.querySelector("polygon"), null, "Two points must not create a closed polygon.");
      const line = svg.querySelector("polyline");
      assert(line, "Two-point geometry must render an open polyline.");
      const points = line.getAttribute("points").split(/\s+/).map(point => point.split(",").map(Number));
      assert.equal(points.length, 2);
      const circles = Array.from(svg.querySelectorAll('circle[r="3"]'));
      assert.equal(circles.length, 2);
      circles.forEach((node, index) => pointNear(
        [Number(node.getAttribute("cx")), Number(node.getAttribute("cy"))], points[index], "Endpoint marker"));
      const grid = Array.from(svg.querySelectorAll('line[stroke="var(--rule)"]')).map(node =>
        ["x1", "y1", "x2", "y2"].map(attribute => Number(node.getAttribute(attribute))));
      const xs = grid.filter(values => values[0] === values[2]).map(values => values[0]).sort((a, b) => a - b);
      const ys = grid.filter(values => values[1] === values[3]).map(values => values[1]).sort((a, b) => b - a);
      assert(xs.length > 1 && ys.length > 1);
      const unit = xs[1] - xs[0];
      near(unit, ys[0] - ys[1], "Square grid must use the same unit on both axes");
      const dx = (points[1][0] - points[0][0]) / unit, dy = (points[0][1] - points[1][1]) / unit;
      near(dx, task.visual.points[1][0] - task.visual.points[0][0], "Horizontal grid displacement");
      near(dy, task.visual.points[1][1] - task.visual.points[0][1], "Vertical grid displacement");
      const sizeText = task.prompt.match(/Сторона каждой клетки равна ([\d,]+) см/);
      assert(sizeText, "The grid scale must be explicitly given in the prompt.");
      const cellSize = Number(sizeText[1].replace(",", "."));
      near(Math.hypot(dx, dy) * cellSize, task.answer, "Segment length after applying the stated cell scale");
      assertSvg(h, true);
      h.solve();
      report.examVisuals.push({familyId: task.familyId, seed: 0, syntheticWidth: width,
        visual: "two-point-polyline", checked: "open segment, endpoint markers, grid unit, scaled distance"});
    }));
}

test("blocked-storage-keeps-a-working-session-and-honest-status", () =>
  fixture({storageBlocked: true}, context => {
    let h = context.h;
    assert(h.query(".footer").textContent.includes("Ответы и подсказки доступны в этой открытой вкладке."));
    h.openFamily("eq-linear-balance");
    const task = h.solve();
    assert.equal(h.api.progress[task.id].independent, 1);
    assert.equal(h.storage.size, 0);
    assert.equal(h.runtimeErrors.length, 0);
    h = context.reload();
    assert.equal(Object.keys(h.api.progress).length, 0);
    assert(h.query(".footer").textContent.includes("Ответы и подсказки доступны в этой открытой вкладке."));
  }));

const started = Date.now();
for (const item of tests) {
  currentTrace = [];
  try {
    item.body();
    report.passed.push(item.name);
    process.stdout.write("PASS " + item.name + "\n");
  } catch (error) {
    report.status = "failed";
    report.failed = {
      test: item.name,
      message: error.message,
      expected: error.expected,
      actual: error.actual,
      recentSteps: currentTrace.slice(-18),
      stack: String(error.stack || "").replaceAll(__dirname, ".")
    };
    process.stderr.write("FAIL " + item.name + ": " + error.message + "\n");
    break;
  }
}
if (!report.failed) report.status = "passed";
report.plannedCases = tests.length;
report.passedCases = report.passed.length;
report.notRun = tests.slice(report.passed.length + (report.failed ? 1 : 0)).map(item => item.name);
report.elapsedMs = Date.now() - started;
fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + "\n");
process.stdout.write(JSON.stringify({
  status: report.status, passed: report.passedCases, planned: report.plannedCases,
  failed: report.failed ? report.failed.test : null,
  report: path.basename(REPORT_PATH), scope: "DOM emulation; synthetic SVG dimensions only"
}) + "\n");
process.exitCode = report.failed ? 1 : 0;
