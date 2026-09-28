/*
  Общая часть гейта OGE_COURSE_03A (геометрия 16, 17, 18, 23, 24, 25).

  Голый Node, без зависимостей. Встроенный скрипт тренажёра выполняется в
  node:vm с заглушками DOM и хранилища, как в браузере без отрисовки:
  генераторы, проверка ответа, ловушки и запись прогресса доступны как
  глобальные имена скрипта. Math.random заменяется детерминированным
  mulberry32, чтобы любой провал воспроизводился по сиду.
*/
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const KEY = 'mathExamCourseProgress.v1';

export function readTrainer(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

/* встроенные скрипты: без src и без не-JS type */
export function inlineScripts(html) {
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(([, a]) => !/\bsrc\s*=/i.test(a) && !/\btype\s*=\s*["'](?!text\/javascript|module)[^"']*["']/i.test(a))
    .map(([, , body]) => body);
}

/* node --check каждого встроенного скрипта */
export function syntaxCheck(html) {
  const errs = [];
  for (const body of inlineScripts(html)) {
    const r = spawnSync(process.execPath, ['--check', '--input-type=commonjs'], { input: body, encoding: 'utf8', timeout: 20000 });
    if (r.status !== 0) errs.push((r.stderr || String(r.error || '')).split('\n').slice(0, 4).join(' '));
  }
  return errs;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* элемент-заглушка: любые свойства и вызовы, без бесконечных обходов DOM */
const NULLS = new Set(['firstChild', 'lastChild', 'nextSibling', 'previousSibling',
  'firstElementChild', 'lastElementChild', 'nextElementSibling', 'previousElementSibling', 'offsetParent']);
const SIZES = new Set(['offsetWidth', 'offsetHeight', 'clientWidth', 'clientHeight', 'scrollWidth', 'scrollHeight']);
export function stubEl(isRoot) {
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
export function makeStorage(map = new Map()) {
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
export function loadTrainer(rel, opts = {}) {
  const html = opts.html || readTrainer(rel);
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
    vm.runInContext(body, ctx, { timeout: 60000, filename: file + '#script' + i });
  }
  return {
    ctx, logs, storage,
    run: (code) => vm.runInContext(code, ctx, { timeout: 120000 }),
  };
}

/* значение ключа прогресса как объект (или null, если не JSON-объект) */
export function readKey(storage) {
  const raw = storage.map.get(KEY);
  if (raw == null) return null;
  try { const o = JSON.parse(raw); return o && typeof o === 'object' && !Array.isArray(o) ? o : null; } catch (e) { return null; }
}

export const JUNK_KEY = ['{', 'null', '"строка"', '[1,2,3]', '42', 'true', '{"mistakes":"x"}', '{"a":'];
export const JUNK_REC = ['"строка"', '[1]', 'null', '7', 'true',
  '{"solvedByType":"x","best":"9","total":"10","passed":"true","runs":[]}',
  '{"solvedByType":{"a":"5","b":-1,"c":1e400}}', '{"events":"x","razbor":5,"train":null}'];

export function near(a, b, eps = 1e-6) {
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= Math.max(eps, Math.abs(b) * eps);
}
