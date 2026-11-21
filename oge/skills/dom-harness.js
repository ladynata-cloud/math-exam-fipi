"use strict";

// DOM emulation only. These dimensions are synthetic inputs to SVG arithmetic;
// they do not measure CSS layout, a viewport, touch targets, or a real browser.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {JSDOM, VirtualConsole} = require("jsdom");
const {witness} = require("./task-input.js");

const DEFAULT_HTML = path.join(__dirname, "index.html");
const STORAGE_PROGRESS = "mathexam.skillLab.v1";
const STORAGE_SESSION = "mathexam.skillLab.session.v2";
const DEFAULT_TIME = Date.UTC(2027, 0, 15, 10, 0, 0);

function storageAdapter(values) {
  return {
    get length() { return values.size; },
    key(index) { return Array.from(values.keys())[index] || null; },
    getItem(key) { return values.has(String(key)) ? values.get(String(key)) : null; },
    setItem(key, value) { values.set(String(key), String(value)); },
    removeItem(key) { values.delete(String(key)); },
    clear() { values.clear(); }
  };
}

function createHarness(options = {}) {
  const htmlPath = options.htmlPath || DEFAULT_HTML;
  const html = options.html === undefined ? fs.readFileSync(htmlPath, "utf8") : options.html;
  const syntheticWidth = options.width === undefined ? 736 : options.width;
  assert([320, 736].includes(syntheticWidth), "Only declared synthetic SVG widths 320/736 are supported.");
  const storage = options.storage || new Map();
  const clock = options.clock || {now: DEFAULT_TIME};
  const trace = options.trace || [];
  const runtimeErrors = [];
  const cssWarnings = [];
  const networkAttempts = [];
  const frames = new Map();
  let nextFrame = 0;
  let closed = false;
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", error => {
    if (error.type === "css-parsing") cssWarnings.push(error.message);
    else runtimeErrors.push({type: error.type, message: error.message});
  });
  virtualConsole.on("error", (...args) => runtimeErrors.push({
    type: "console.error", message: args.map(String).join(" ")
  }));

  const dom = new JSDOM(html, {
    // This supplies an inert origin for storage, not a URL to be fetched.
    url: options.url || "https://mathexam-skill-lab.invalid/oge/skills/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole,
    // resources is deliberately omitted: external subresources are not loaded.
    beforeParse(window) {
      const NativeDate = window.Date;
      window.Date = class ControlledDate extends NativeDate {
        constructor(...args) { super(...(args.length ? args : [clock.now])); }
        static now() { return clock.now; }
      };
      const adapter = storageAdapter(storage);
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        get() {
          if (options.storageBlocked) throw new window.DOMException("Storage blocked for this test.", "SecurityError");
          return adapter;
        }
      });
      function denyNetwork(kind, target) {
        networkAttempts.push({kind, target: String(target || "")});
        throw new Error("Network access is disabled in the DOM harness: " + kind);
      }
      window.fetch = target => denyNetwork("fetch", target);
      window.XMLHttpRequest = class BlockedXHR {
        constructor() { denyNetwork("XMLHttpRequest"); }
      };
      window.WebSocket = class BlockedWebSocket {
        constructor(target) { denyNetwork("WebSocket", target); }
      };
      window.navigator.sendBeacon = target => denyNetwork("sendBeacon", target);
      window.ResizeObserver = class SyntheticResizeObserver {
        constructor(callback) { this.callback = callback; }
        observe() {}
        unobserve() {}
        disconnect() {}
      };
      window.requestAnimationFrame = callback => {
        const id = ++nextFrame;
        frames.set(id, callback);
        return id;
      };
      window.cancelAnimationFrame = id => frames.delete(id);
      window.Element.prototype.getBoundingClientRect = function () {
        let width = syntheticWidth, height = 270, x = 0, y = 0;
        if (this.matches && this.matches(".map-drawing")) height = 480;
        if (this.hasAttribute && this.hasAttribute("data-map-node")) {
          const all = Array.from(this.ownerDocument.querySelectorAll("[data-map-node]"));
          width = 180; height = 44; x = 12; y = 12 + all.indexOf(this) * 58;
        }
        return new window.DOMRect(x, y, width, height);
      };
      window.addEventListener("error", event => runtimeErrors.push({
        type: "window.error", message: event.message
      }));
    }
  });

  function api() {
    assert(dom.window.OGESkillLab, "The built HTML did not initialize window.OGESkillLab.");
    return dom.window.OGESkillLab;
  }
  function flush() {
    let turns = 0;
    while (frames.size) {
      assert(++turns <= 20, "Unexpected unbounded animation-frame loop.");
      const queued = Array.from(frames.entries());
      frames.clear();
      for (const [, callback] of queued) callback(clock.now);
    }
    assert.equal(networkAttempts.length, 0, "The application attempted network access.");
    assert.equal(runtimeErrors.length, 0, "Runtime errors: " + JSON.stringify(runtimeErrors));
  }
  function log(action, detail) {
    const current = dom.window.OGESkillLab && dom.window.OGESkillLab.task();
    trace.push({action, detail, taskId: current ? current.id : null});
  }
  function query(selector) {
    const node = dom.window.document.querySelector(selector);
    assert(node, "Missing DOM control: " + selector);
    return node;
  }
  function click(selectorOrNode) {
    const node = typeof selectorOrNode === "string" ? query(selectorOrNode) : selectorOrNode;
    assert(node && node.isConnected, "Attempted to click a missing or detached control.");
    assert(!node.disabled, "Attempted to click a disabled control.");
    log("click", typeof selectorOrNode === "string" ? selectorOrNode : node.outerHTML.slice(0, 180));
    node.click();
    flush();
  }
  function input(selector, value) {
    const node = query(selector);
    log("input", {selector, value: String(value)});
    node.value = String(value);
    node.dispatchEvent(new dom.window.Event("input", {bubbles: true}));
    flush();
  }
  function select(selector, value) {
    const node = query(selector);
    assert(Array.from(node.options).some(option => option.value === String(value)),
      "Missing select option " + String(value) + " in " + selector);
    log("change", {selector, value: String(value)});
    node.value = String(value);
    node.dispatchEvent(new dom.window.Event("change", {bubbles: true}));
    flush();
  }
  function openDetails(selector) {
    const node = query(selector);
    if (!node.open) click(node.querySelector("summary"));
    assert(node.open, "Details did not open: " + selector);
  }
  function render() {
    api().render();
    flush();
  }
  function openRoute(routeId) {
    const route = api().series.routeIndex[routeId];
    assert(route, "Unknown route: " + routeId);
    select("#skill-topic", route.topicId);
    openDetails("details.series-picker");
    click('button[data-action="route"][data-route="' + routeId + '"]');
    assert.equal(api().state.activeRun, routeId);
  }
  function openFamily(familyId) {
    const family = api().series.familyIndex[familyId];
    assert(family, "Unknown family: " + familyId);
    select("#skill-topic", family.topicId);
    openDetails("details.series-picker");
    openDetails("details.family-picker");
    click('.family-list button[data-action="variant"][data-family="' + familyId + '"]');
    assert.equal(api().task().familyId, familyId);
  }
  function fillCorrect(task = api().task()) {
    assert(task, "No current task to fill.");
    assert.equal(api().task().id, task.id, "The task changed before input.");
    const correct = witness(task);
    if(task.type === "experiment") {
      for(const x of correct.probes) {
        const button=query('button[data-action="probe"][data-value="'+x+'"]');
        if(!button.disabled)click(button);
      }
      click('button[data-action="model"][data-value="'+correct.modelId+'"]');
    } else if (["number", "numberline", "counterexample", "tiltArea", "triangleGate"].includes(task.type)) {
      input('[data-field="answer"]', correct.answer);
    } else if (task.type === "battle") {
      click('button[data-action="sign"][data-value="' + correct.sign + '"]');
      const cancel = query('button[data-action="cancel"]');
      if (!cancel.disabled) click(cancel);
      input('[data-field="answer"]', correct.answer);
    } else if (task.type === "choice" || task.type === "multi") {
      const wanted = new Set(correct.selected);
      for (let i = 0; i < task.options.length; i++) {
        const selector = 'button[data-action="option"][data-index="' + i + '"]';
        const selected = query(selector).getAttribute("aria-pressed") === "true";
        if (task.type === "multi" ? selected !== wanted.has(i) : wanted.has(i) && !selected) click(selector);
      }
    } else if (task.type === "match") {
      for (const [index, value] of Object.entries(correct.matches)) {
        select('select[data-field="match"][data-index="' + index + '"]', value);
      }
    } else if (task.type === "order") {
      for (let target = 0; target < correct.order.length; target++) {
        let current = Array.from(dom.window.document.querySelectorAll(".order-row .step"))
          .findIndex(node => node.textContent === correct.order[target]);
        assert(current >= target, "Order item missing or duplicated.");
        while (current > target) {
          click('button[data-action="up"][data-index="' + current + '"]');
          current--;
        }
      }
    } else if (task.type === "build") {
      for (const [name, value] of Object.entries(correct.values)) {
        input('input[data-field="build"][data-name="' + name + '"]', value);
      }
    } else if (task.type === "graph") {
      input('[data-field="k"]', correct.k);
      input('[data-field="b"]', correct.b);
    } else if (task.type === "fraction") {
      // The witness uses the product denominator. The UI may offer a smaller
      // valid common measure, so choose an actually available common measure.
      const buttons = Array.from(dom.window.document.querySelectorAll('button[data-action="partition"]'));
      const button = buttons.find(node => Number(node.dataset.value) === correct.partition) ||
        buttons.find(node => Number(node.dataset.value) % task.denominatorA === 0 &&
          Number(node.dataset.value) % task.denominatorB === 0);
      assert(button, "No valid common measure is offered.");
      const partition = Number(button.dataset.value);
      click(button);
      const units = partition / task.denominatorA * task.numeratorA +
        partition / task.denominatorB * task.numeratorB;
      assert(Number.isInteger(units), "Selected common measure must produce whole units.");
      input('[data-field="answer"]', units);
    } else if (task.type === "probability") {
      const wanted = new Set(correct.red);
      for (let i = 0; i < task.total; i++) {
        const selector = 'button[data-action="ball"][data-index="' + i + '"]';
        if ((query(selector).getAttribute("aria-pressed") === "true") !== wanted.has(i)) click(selector);
      }
    } else {
      throw new Error("DOM filling is not implemented for task type: " + task.type);
    }
  }
  function solve() {
    const task = api().task();
    fillCorrect(task);
    click('button[data-action="check"]');
    assert.equal(api().state.feedback && api().state.feedback.ok, true,
      "The correctly filled DOM answer was rejected for " + task.id + ": " +
      JSON.stringify(api().state.feedback));
    query(".task .feedback.good");
    query('.task .after button[data-action="next"]');
    return task;
  }
  function openStatic(taskId) {
    let found;
    for (const topic of api().data.topics) {
      for (const mode of ["quick", "creative"]) {
        const index = topic[mode].findIndex(task => task.id === taskId);
        if (index >= 0) found = {topic, mode, index};
      }
    }
    assert(found, "Unknown static task: " + taskId);
    select("#skill-topic", found.topic.id);
    click('button[data-action="mode"][data-mode="' + found.mode + '"]');
    if (found.mode === "creative") {
      openDetails("details.creative-picker");
      click('.creative-menu button[data-action="creative"][data-index="' + found.index + '"]');
    } else if(found.topic.overviewTaskIds&&!found.topic.overviewTaskIds.includes(taskId)) {
      click('button[data-action="map"]');
      const task=found.topic.quick[found.index];
      click('button[data-action="skill"][data-skill="'+task.skillId+'"]');
      click('button[data-action="open-task"][data-task="'+taskId+'"]');
    } else {
      let guard = 0;
      while (api().task() && api().task().id !== taskId) {
        assert(++guard <= found.topic.quick.length, "Cannot reach requested static task from this session.");
        solve();
        click('button[data-action="next"]');
      }
    }
    assert.equal(api().task().id, taskId);
  }
  function setTime(now) {
    assert(Number.isFinite(now), "Fake time must be a finite timestamp.");
    clock.now = now;
    log("set-fake-time", new Date(now).toISOString());
    render();
  }
  function close() {
    if (!closed) {
      closed = true;
      frames.clear();
      dom.window.close();
    }
  }
  function reload() {
    log("reload-from-saved-storage", {keys: Array.from(storage.keys())});
    close();
    return createHarness(Object.assign({}, options, {
      htmlPath, html, width: syntheticWidth, storage, clock, trace
    }));
  }

  flush();
  api();
  return {
    dom, window: dom.window, document: dom.window.document, api: api(),
    storage, clock, trace, runtimeErrors, cssWarnings, networkAttempts,
    syntheticWidth, query, click, input, select, openDetails, render,
    openRoute, openFamily, openStatic, fillCorrect, solve, setTime,
    flush, reload, close
  };
}

module.exports = {
  createHarness, DEFAULT_HTML, DEFAULT_TIME, STORAGE_PROGRESS, STORAGE_SESSION
};
