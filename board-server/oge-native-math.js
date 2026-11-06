'use strict';
// Execute only repository-owned native mathematics; never evaluate request code.
// DOM/storage stubs are the same bounded generation harness used by the geometry gate.
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm');
function inlineScripts(html) { return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(([,a])=>! /\bsrc\s*=/i.test(a)&&! /\btype\s*=\s*["'](?!text\/javascript|module)[^"']*["']/i.test(a)).map(([, ,body])=>body); }
function mulberry32(seed) { let n=seed>>>0; return ()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}; }
const NULLS = new Set(['firstChild', 'lastChild', 'nextSibling', 'previousSibling',
  'firstElementChild', 'lastElementChild', 'nextElementSibling', 'previousElementSibling', 'offsetParent']);
const SIZES = new Set(['offsetWidth', 'offsetHeight', 'clientWidth', 'clientHeight', 'scrollWidth', 'scrollHeight']);
function stubEl(isRoot) {
  const store = {};
  const handler = {
    get(t, p) {
      if (p === Symbol.toPrimitive) return () => '';
      if (p === Symbol.iterator) return function* () {};
      if (p === 'then') return undefined;
      if (p === 'toString' || p === 'valueOf') return () => '';
      if (NULLS.has(p)) return null;
      /* один уровень родителя: вставка рядом с элементом работает, подъём к корню конечен */
      if (p === 'parentNode' || p === 'parentElement') return isRoot ? null : (store.__parent || (store.__parent = stubEl(true)));
      if (p === 'length' || p === 'childElementCount' || p === 'scrollTop' || p === 'scrollLeft') return 0;
      if (SIZES.has(p)) return 360;
      if (p === 'children' || p === 'childNodes') return [];
      if (p === 'dataset' || p === 'style') { if (!(p in store)) store[p] = {}; return store[p]; }
      if (['value', 'textContent', 'innerHTML', 'innerText', 'outerHTML', 'className', 'id', 'src', 'href'].includes(p)) return p in store ? store[p] : '';
      if (['checked', 'disabled', 'hidden', 'open'].includes(p)) return p in store ? store[p] : false;
      if (p === 'getAttribute') return () => null;
      if (p === 'hasAttribute') return () => false;
      if (p === 'closest' || p === 'querySelector') return () => stubEl();
      if (p === 'querySelectorAll' || p === 'getElementsByTagName' || p === 'getElementsByClassName') return () => [];
      if (p === 'getBoundingClientRect') return () => ({ x: 0, y: 0, left: 0, top: 0, right: 360, bottom: 360, width: 360, height: 360 });
      if (p === 'classList') return { add() {}, remove() {}, toggle() {}, contains() { return false; }, replace() {} };
      if (p in store) return store[p];
      return (store[p] = stubEl());
    },
    set(t, p, v) { store[p] = v; return true; },
    apply() { return stubEl(); },
    construct() { return stubEl(); },
    has() { return true; },
  };
  return new Proxy(function () {}, handler);
}

/* хранилище: Map строк, общее для нескольких «вкладок» */
function makeStorage(map = new Map()) {
  return {
    map,
    api: {
      getItem: (k) => (map.has(k) ? map.get(k) : null),
      setItem: (k, v) => { map.set(k, String(v)); },
      removeItem: (k) => { map.delete(k); },
      clear: () => map.clear(),
      key: (i) => [...map.keys()][i] ?? null,
      get length() { return map.size; },
    },
  };
}

/*
  Загрузка тренажёра в vm.
  opts.search — строка адреса (например, '?mode=review');
  opts.storage — makeStorage() для общих «вкладок»;
  opts.seed — сид Math.random.
  Возвращает { ctx, run(code), logs, storage }.
*/
function loadTrainer(rel, opts = {}) {
  const html = fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
  const storage = opts.storage || makeStorage();
  const logs = [];
  const rnd = mulberry32(opts.seed == null ? 1 : opts.seed);
  const M = Object.create(Math);
  M.random = rnd;
  const search = opts.search || '';
  const file = path.basename(rel);
  const ctx = {
    console: {
      log: (...a) => logs.push(a.map(String).join(' ')), info: () => {}, warn: () => {},
      error: (...a) => logs.push('ERROR ' + a.map(String).join(' ')),
    },
    localStorage: storage.api, sessionStorage: makeStorage().api,
    location: { search, hash: '', pathname: '/trainers/' + file, href: 'http://localhost/trainers/' + file + search, protocol: 'http:', host: 'localhost', origin: 'http://localhost', reload() {} },
    navigator: { userAgent: 'node', clipboard: { writeText: async () => {} }, maxTouchPoints: 0 },
    setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
    requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {} }),
    getComputedStyle: () => stubEl(), alert: () => {}, confirm: () => false, prompt: () => null,
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => {}, scrollTo: () => {}, scrollBy: () => {}, open: () => null, print: () => {},
    innerWidth: 360, innerHeight: 740, devicePixelRatio: 2,
    performance: { now: () => Date.now() },
    Image: function () { return stubEl(); }, Blob: function () {}, FileReader: function () { return stubEl(); },
    CustomEvent: function () {}, Event: function () {}, KeyboardEvent: function () {},
    MutationObserver: function () { return { observe() {}, disconnect() {} }; },
    ResizeObserver: function () { return { observe() {}, disconnect() {} }; },
    IntersectionObserver: function () { return { observe() {}, disconnect() {} }; },
    URLSearchParams, URL, JSON, Date, Intl, Number, String, Boolean, Array, Object, Map, Set, WeakMap, WeakSet, Symbol, RegExp,
    Error, TypeError, RangeError, parseFloat, parseInt, isFinite, isNaN, Promise, Reflect, Proxy, BigInt,
    encodeURIComponent, decodeURIComponent, encodeURI, decodeURI, escape, unescape, btoa, atob,
    Math: M,
  };
  ctx.document = stubEl();
  ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx; ctx.top = ctx; ctx.parent = ctx;
  vm.createContext(ctx);
  let i = 0;
  for (const body of inlineScripts(html)) {
    i++;
    vm.runInContext(body, ctx, { timeout: 2000, filename: file + '#script' + i });
  }
  return {
    ctx, logs, storage,
    run: (code) => vm.runInContext(code, ctx, { timeout: 2000 }),
  };
}


module.exports={loadTrainer,mulberry32};
