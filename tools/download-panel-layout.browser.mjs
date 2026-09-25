import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Layout gate for the "download and adapt" panel that
// scripts/build-trainer-downloads.mjs appends before </body> of published trainers.
// The panel must always sit on its own full-width row and must never share a row with
// (and so squeeze) the trainer, including trainers whose <body> is a flex row.
//
// A/B invariant: in the same loaded page the current assets/download-panel.css and the
// one from BASE_REF (served through page.route) are swapped synchronously, and every
// element of <body> is compared. Pages whose body is not a flex container must not move
// by more than AB_TOLERANCE px; only FLEX_BODY_PAGES may change, and there the trainer
// must keep exactly the horizontal geometry it has with no panel and no panel CSS at all.
// A deliberate restyling of the panel needs a new BASE_REF and BASE_CSS_SHA256.
//
// External tooling only: this gate installs no packages or browsers.
// PLAYWRIGHT_CORE_PATH accepts a playwright-core package directory or entry module
// (NODE_PATH pointing at a node_modules with playwright-core also works).
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH (or BROWSER_EXECUTABLE_PATH) selects the browser;
// without it the system Edge channel is used.
// The base stylesheet is read with `git show BASE_REF:assets/download-panel.css`; outside a
// full clone set DOWNLOAD_PANEL_BASE_CSS to a file with that text (its sha256 is checked).
const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium;
try {
  ({ chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || 'playwright-core'));
} catch {
  throw new Error('Browser tooling unavailable: set PLAYWRIGHT_CORE_PATH (or NODE_PATH) to an external playwright-core module.');
}

// Pages that carried the panel at f1eb112. Every one must still be found, so coverage
// cannot shrink silently; pages that gain the panel later are checked automatically.
const KNOWN_PAGES = [
  'azbuka-postroeniy-reviewed/index.html',
  'geometry-course/index.html',
  'trainers/bisector-trainer-v2.html',
  'trainers/decimal-cash-trainer.html',
  'trainers/ege-profile-vectors-trainer.html',
  'trainers/ege-t1-planimetry-generator.html',
  'trainers/formuly-sokrashchennogo-umnozheniya.html',
  'trainers/linear-systems-trainer.html',
  'trainers/long-division-stepwise.html',
  'trainers/negative-numbers-line.html',
  'trainers/rounding-stepwise.html',
  'trainers/simple-equations-stepwise.html',
  'trainers/task14-progressions-trainer.html',
  'trainers/task19-trainer.html',
  'trainers/teatr-formul-daily.html',
  'trainers/trenazher-mcko-linejka-progress.html'
];
const FLEX_BODY_PAGE = 'trainers/ege-t1-planimetry-generator.html';
// The only page with the panel whose own <body> is a flex container (checked under the base
// stylesheet, so a panel CSS that turns other bodies into flex cannot exempt them).
const FLEX_BODY_PAGES = [FLEX_BODY_PAGE];
const BASE_REF = 'f1eb112';
const BASE_CSS_SHA256 = '4323218c8e3e91c932be4ec5633ae23e5b91ecb76917e1b1ec66f65fb38cc2fe';
const BASE_CSS_PATH = '/__download-panel-base.css';
const AB_TOLERANCE = 1;
// "window" views get the ">= 90% of the window or own max-width" check; "wide" is an
// extra desktop width where a flex-row body used to keep the panel beside the trainer.
const VIEWS = [
  { name: '360', kind: 'window', options: { viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } },
  { name: '768', kind: 'window', options: { viewport: { width: 768, height: 1024 } } },
  { name: '1280', kind: 'window', options: { viewport: { width: 1280, height: 800 } } },
  { name: '1920', kind: 'wide', options: { viewport: { width: 1920, height: 1080 } } }
];
const MIN_SHARE = 0.9;
const MIN_TARGET = 44;
const SKIP_DIRS = new Set(['node_modules', 'downloads']);
// assets/download-panel.css sets body{flex-wrap:wrap} without :has(): that is safe only
// while the stylesheet is linked exactly on the pages that carry the panel.
// HTML attribute values may be in double quotes, single quotes or unquoted, names in any
// case. The class and the file name are whole tokens: .oge-download-panel (its own panel in
// trainers/oge-course) or my-download-panel.css are other things. SCAN_SAMPLES pins this.
const PANEL_RE = /<section\b[^>]*?(?<![\w-])class\s*=\s*(?:"[^"]*?|'[^']*?|)(?<![\w-])download-panel(?![\w-])/i;
const PANEL_CSS_RE = /<link\b[^>]*?(?<![\w-])href\s*=\s*(?:"[^"]*?|'[^']*?|[^\s"'<>`=]*?)(?<![\w-])download-panel\.css(?![\w.-])/i;
const PANEL_CSS_IMPORT_RE = /@import\s+(?:url\(\s*)?["']?[^"')\s;]*?(?<![\w-])download-panel\.css(?![\w.-])/i;
const linksPanelCss = html => PANEL_CSS_RE.test(html) || PANEL_CSS_IMPORT_RE.test(html);
const SCAN_SAMPLES = [
  [PANEL_RE.test.bind(PANEL_RE), '<section class="download-panel" id="download">', true],
  [PANEL_RE.test.bind(PANEL_RE), "<section id='download' class='download-panel'>", true],
  [PANEL_RE.test.bind(PANEL_RE), '<SECTION CLASS=download-panel>', true],
  [PANEL_RE.test.bind(PANEL_RE), '<section class="wide download-panel dark">', true],
  [PANEL_RE.test.bind(PANEL_RE), '<section class="oge-download-panel">', false],
  [PANEL_RE.test.bind(PANEL_RE), '<section class="download-panel-note">', false],
  [PANEL_RE.test.bind(PANEL_RE), '<section data-class="download-panel">', false],
  [PANEL_RE.test.bind(PANEL_RE), '<div class="download-panel">', false],
  [linksPanelCss, '<link rel="stylesheet" href="/assets/download-panel.css">', true],
  [linksPanelCss, "<link rel='stylesheet' href='/assets/download-panel.css'>", true],
  [linksPanelCss, '<link rel=stylesheet href=/assets/download-panel.css>', true],
  [linksPanelCss, '<LINK HREF = "../assets/download-panel.css?v=2" REL="stylesheet">', true],
  [linksPanelCss, '<style>@import url("/assets/download-panel.css");</style>', true],
  [linksPanelCss, "<style>@import '/assets/download-panel.css';</style>", true],
  [linksPanelCss, '<link rel="stylesheet" href="/assets/site.css">', false],
  [linksPanelCss, '<link rel="stylesheet" href="/assets/my-download-panel.css">', false],
  [linksPanelCss, '<link rel="stylesheet" data-href="/assets/download-panel.css" href="/assets/site.css">', false]
];

function discoverPages(dir = root, found = { panel: [], css: [] }) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.') && !SKIP_DIRS.has(entry.name)) discoverPages(path.join(dir, entry.name), found);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      const file = path.join(dir, entry.name);
      const html = fs.readFileSync(file, 'utf8');
      const relative = path.relative(root, file).split(path.sep).join('/');
      if (PANEL_RE.test(html)) found.panel.push(relative);
      if (linksPanelCss(html)) found.css.push(relative);
    }
  }
  found.panel.sort();
  found.css.sort();
  return found;
}

function loadBaseCss() {
  let text;
  const file = process.env.DOWNLOAD_PANEL_BASE_CSS;
  if (file) {
    text = fs.readFileSync(file);
  } else {
    try {
      text = execFileSync('git', ['-c', `safe.directory=${root}`, '-C', root, 'show', `${BASE_REF}:assets/download-panel.css`],
        { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (error) {
      throw new Error(`Base stylesheet unavailable: git show ${BASE_REF}:assets/download-panel.css failed; `
        + `set DOWNLOAD_PANEL_BASE_CSS to a file with that text. ${String(error.message).split('\n')[0]}`);
    }
  }
  const hash = crypto.createHash('sha256').update(text).digest('hex');
  if (hash !== BASE_CSS_SHA256) throw new Error(`Base stylesheet sha256 ${hash}, expected ${BASE_CSS_SHA256} (${BASE_REF})`);
  return text;
}

const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2'
};
const server = http.createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let file = path.resolve(root, pathname.replace(/^\/+/, '') || 'index.html');
    if (file !== root && !file.startsWith(`${root}${path.sep}`)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (error, data) => {
      if (error) { response.writeHead(404).end('Not found'); return; }
      response.writeHead(200, { 'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream' });
      response.end(data);
    });
  } catch {
    response.writeHead(400).end('Bad request');
  }
});

// Runs in the page. Measures the trainer container, the panel and every tappable
// control of the trainer; returns plain data, the assertions live in Node.
function measure() {
  const round = value => Math.round(value * 10) / 10;
  const panel = document.querySelector('section.download-panel');
  if (!panel) return { missing: true };
  const parent = panel.parentElement;
  const doc = document.documentElement;
  const vw = doc.clientWidth;
  const vh = doc.clientHeight;
  const inFlow = element => {
    if (/^(SCRIPT|STYLE|LINK|TEMPLATE|NOSCRIPT|META)$/.test(element.tagName)) return false;
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (style.position === 'fixed' || style.position === 'absolute') return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };
  const describe = element => element.tagName.toLowerCase()
    + (element.id ? `#${element.id}` : '')
    + (typeof element.className === 'string' && element.className.trim() ? `.${element.className.trim().split(/\s+/).join('.')}` : '');
  const siblings = [...parent.children].filter(element => element !== panel && inFlow(element));
  if (!siblings.length) return { missing: false, noMain: true };
  const area = element => { const rect = element.getBoundingClientRect(); return rect.width * rect.height; };
  const main = siblings.reduce((best, element) => (area(element) > area(best) ? element : best), siblings[0]);
  const mainRect = main.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const maxWidth = getComputedStyle(main).maxWidth;
  const parentStyle = getComputedStyle(parent);
  const parentContent = parent.clientWidth - parseFloat(parentStyle.paddingLeft) - parseFloat(parentStyle.paddingRight);
  const bodyStyle = getComputedStyle(document.body);

  // Width of the trainer container and page overflow with neither the panel nor its
  // stylesheet (body rules included): the panel may neither narrow the trainer nor add
  // horizontal scroll of its own.
  const scroller = document.scrollingElement;
  const overflowWithPanel = scroller.scrollWidth - scroller.clientWidth;
  const panelSheets = [...document.querySelectorAll('link[rel~="stylesheet"]')]
    .filter(link => /\/assets\/download-panel\.css$/.test(new URL(link.href, location.href).pathname));
  const inlineDisplay = panel.style.display;
  panel.style.display = 'none';
  for (const link of panelSheets) if (link.sheet) link.sheet.disabled = true;
  const naturalWidth = main.getBoundingClientRect().width;
  const overflowWithoutPanel = scroller.scrollWidth - scroller.clientWidth;
  for (const link of panelSheets) if (link.sheet) link.sheet.disabled = false;
  panel.style.display = inlineDisplay;

  const sharedRow = siblings.filter(element => {
    const rect = element.getBoundingClientRect();
    return rect.top < panelRect.bottom - 1 && panelRect.top < rect.bottom - 1;
  }).map(describe);
  const buttons = [...panel.querySelectorAll('.download-actions a')].map(link => {
    const rect = link.getBoundingClientRect();
    return { height: round(rect.height), width: round(rect.width), right: round(rect.right) };
  });

  // Every visible control of the trainer is hit-tested at its centre: a tap there must
  // never land in the panel, and the centre must be inside the window. Only the window is
  // scrolled, and only vertically, as a finger would: Element.scrollIntoView would also
  // scroll an overflow:hidden container sideways and bring clipped controls back into view.
  const scrollX0 = window.scrollX;
  const scrollY0 = window.scrollY;
  const controls = [...main.querySelectorAll('button, a[href], input:not([type="hidden"]), select, textarea, [role="button"]')]
    .filter(element => {
      const rect = element.getBoundingClientRect();
      return rect.width >= 4 && rect.height >= 4
        && element.checkVisibility({ opacityProperty: true, visibilityProperty: true });
    });
  const intoPanel = [];
  const offWindow = [];
  const outsideMain = [];
  let tested = 0;
  for (const control of controls) {
    const before = control.getBoundingClientRect();
    window.scrollTo({ left: scrollX0, top: window.scrollY + before.top + before.height / 2 - vh / 2, behavior: 'instant' });
    const rect = control.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    tested += 1;
    if (x < 0 || x >= vw || y < 0 || y >= vh) {
      offWindow.push(`${describe(control)} @${round(x)},${round(y)}`);
      continue;
    }
    const box = main.getBoundingClientRect();
    if (x < box.left || x > box.right) outsideMain.push(`${describe(control)} @${round(x)} not in ${round(box.left)}..${round(box.right)}`);
    const hit = document.elementFromPoint(x, y);
    if (hit && panel.contains(hit)) intoPanel.push(`${describe(control)} -> ${describe(hit)}`);
  }
  window.scrollTo({ left: scrollX0, top: scrollY0, behavior: 'instant' });

  return {
    missing: false,
    vw,
    panelCount: document.querySelectorAll('section.download-panel').length,
    panelInBody: parent === document.body,
    panelSheets: panelSheets.filter(link => link.sheet).length,
    body: `${bodyStyle.display} ${bodyStyle.flexDirection} ${bodyStyle.flexWrap}`,
    parent: describe(parent),
    main: describe(main),
    mainWidth: round(mainRect.width),
    naturalWidth: round(naturalWidth),
    mainMaxWidth: maxWidth,
    parentContent: round(parentContent),
    panelWidth: round(panelRect.width),
    panelLeft: round(panelRect.left),
    panelRight: round(panelRect.right),
    panelBelowMain: panelRect.top >= mainRect.bottom - 1,
    panelAboveMain: panelRect.bottom <= mainRect.top + 1,
    sharedRow,
    overflowWithPanel,
    overflowWithoutPanel,
    buttons,
    controls: tested,
    intoPanel,
    offWindow,
    outsideMain
  };
}

// Runs in the page. A/B of the panel stylesheet in one loaded page: A is the current
// assets/download-panel.css, B is the BASE_REF text in the same cascade position (served by
// page.route), N has neither the panel nor its stylesheet. Once the base sheet has loaded,
// all snapshots are taken in one synchronous task, so page timers, rAF and observers cannot
// run in between: trainers with Math.random or animation are compared in the very same state.
// Two loads of the same page are not comparable for such trainers. Boxes are page
// coordinates taken at scroll 0.
async function compareCss({ basePath, tolerance }) {
  const round = value => Math.round(value * 100) / 100;
  const panel = document.querySelector('section.download-panel');
  const links = [...document.querySelectorAll('link[rel~="stylesheet"]')]
    .filter(link => /\/assets\/download-panel\.css$/.test(new URL(link.href, location.href).pathname));
  if (!panel || links.length !== 1 || !links[0].sheet) {
    return { error: `panel ${Boolean(panel)}, panel stylesheet links ${links.length}, loaded ${Boolean(links[0] && links[0].sheet)}` };
  }
  const link = links[0];
  const describe = element => element.tagName.toLowerCase()
    + (element.id ? `#${element.id}` : '')
    + (typeof element.className === 'string' && element.className.trim() ? `.${element.className.trim().split(/\s+/).join('.')}` : '');
  // Fixed before the extra <link> is inserted.
  const elements = [...document.body.querySelectorAll('*')]
    .filter(element => !/^(SCRIPT|STYLE|LINK|TEMPLATE|NOSCRIPT|META)$/.test(element.tagName));
  const inPanel = elements.map(element => panel.contains(element));
  const base = document.createElement('link');
  base.rel = 'stylesheet';
  base.media = 'not all';
  const loaded = new Promise((resolve, reject) => {
    base.addEventListener('load', resolve, { once: true });
    base.addEventListener('error', () => reject(new Error(`${basePath} did not load`)), { once: true });
  });
  base.href = basePath;
  link.after(base);
  try {
    await loaded;
    if (!base.sheet || !base.sheet.cssRules.length) return { error: 'base stylesheet is empty' };
    // ---- synchronous from here to the return ----
    const scrollX0 = window.scrollX;
    const scrollY0 = window.scrollY;
    window.scrollTo({ left: 0, top: 0, behavior: 'instant' });
    const snap = () => {
      const scroller = document.scrollingElement;
      const bodyStyle = getComputedStyle(document.body);
      return {
        boxes: elements.map(element => {
          const rect = element.getBoundingClientRect();
          return [rect.left + window.scrollX, rect.top + window.scrollY, rect.width, rect.height];
        }),
        scroll: [scroller.scrollWidth, scroller.scrollHeight],
        body: `${bodyStyle.display} ${bodyStyle.flexDirection}`
      };
    };
    const current = snap();
    link.sheet.disabled = true;
    base.media = 'all';
    const before = snap();
    const baseApplied = link.sheet.disabled && !base.sheet.disabled && matchMedia(base.media).matches;
    base.media = 'not all';
    const inlineDisplay = panel.style.display;
    panel.style.display = 'none';
    const none = snap();
    panel.style.display = inlineDisplay;
    link.sheet.disabled = false;
    const restored = snap();
    window.scrollTo({ left: scrollX0, top: scrollY0, behavior: 'instant' });

    // fields: 0 left, 1 top, 2 width, 3 height
    const diff = (x, y, fields, { skipPanel = false, limit = tolerance } = {}) => {
      const moved = [];
      let max = 0;
      elements.forEach((element, index) => {
        if (skipPanel && inPanel[index]) return;
        const delta = Math.max(...fields.map(field => Math.abs(x.boxes[index][field] - y.boxes[index][field])));
        if (delta > max) max = delta;
        if (delta > limit) moved.push(`${describe(element)} Δ${round(delta)}`);
      });
      return { count: moved.length, max: round(max), sample: moved.slice(0, 3) };
    };
    // For the evidence line only: the largest rendered child of body other than the panel.
    const children = [...document.body.children]
      .map(element => elements.indexOf(element))
      .filter(index => index >= 0 && !inPanel[index] && current.boxes[index][2] > 0 && current.boxes[index][3] > 0);
    const mainIndex = children.reduce((best, index) => (best < 0
      || current.boxes[index][2] * current.boxes[index][3] > current.boxes[best][2] * current.boxes[best][3] ? index : best), -1);
    return {
      elements: elements.length,
      baseApplied,
      bodyCurrent: current.body,
      bodyBase: before.body,
      main: mainIndex >= 0 ? describe(elements[mainIndex]) : '-',
      mainWidthCurrent: mainIndex >= 0 ? round(current.boxes[mainIndex][2]) : 0,
      mainWidthBase: mainIndex >= 0 ? round(before.boxes[mainIndex][2]) : 0,
      scrollCurrent: current.scroll,
      scrollBase: before.scroll,
      // Every element of body, the panel included, all four sides.
      vsBase: diff(current, before, [0, 1, 2, 3]),
      // The trainer only (panel subtree excluded), horizontal geometry: left and width.
      vsNone: diff(current, none, [0, 2], { skipPanel: true }),
      // The page must come back exactly: nothing ran or moved during the swap.
      restored: diff(current, restored, [0, 1, 2, 3], { limit: 0.01 })
    };
  } finally {
    base.remove();
  }
}

const failures = [];
const blockedRequests = new Set();
const table = [];
const evidence = { pages: 0, views: VIEWS.map(view => view.name), measurements: 0, controlsHitTested: 0, flexBodyTap: null,
  // A/B against the BASE_REF stylesheet: comparisons, elements compared, the largest shift
  // found on pages with a block body, and the trainer width before -> after on flex bodies.
  ab: { base: BASE_REF, comparisons: 0, elements: 0, blockBodyMaxShift: 0, flexBody: [] },
  // Horizontal scroll a trainer has without the panel is its own defect, reported here, not failed.
  overflowWithoutPanel: [] };
let browser;

function check(condition, message) {
  if (!condition) failures.push(message);
}

function verify(page, view, data, ab) {
  const where = `${page} @${view.name}`;
  if (data.missing) { failures.push(`${where}: panel not found in the rendered page`); return; }
  if (data.noMain) { failures.push(`${where}: no trainer container next to the panel`); return; }
  evidence.measurements += 1;
  evidence.controlsHitTested += data.controls;
  const flexBody = FLEX_BODY_PAGES.includes(page);
  const maxPx = /px$/.test(data.mainMaxWidth) ? parseFloat(data.mainMaxWidth) : Infinity;
  const ownLimit = data.mainMaxWidth === 'none' || Number.isFinite(maxPx) ? Math.min(data.vw, maxPx) : data.naturalWidth;
  const windowShare = data.mainWidth / ownLimit;
  const naturalShare = data.mainWidth / data.naturalWidth;
  const abCell = !ab || ab.error ? 'ERR' : `${ab.vsBase.count ? `Δ${ab.vsBase.count}` : '='}/${ab.vsNone.count ? `Δ${ab.vsNone.count}` : '='}`;
  table.push([view.name, page, data.body, data.main, data.mainWidth, data.naturalWidth,
    Math.round(windowShare * 1000) / 1000, data.panelWidth, data.panelBelowMain ? 'below' : (data.panelAboveMain ? 'above' : 'BESIDE'),
    data.sharedRow.join('+') || '-', data.overflowWithPanel, Math.min(...data.buttons.map(button => button.height)), abCell].join(' | '));
  if (data.overflowWithoutPanel > 0) evidence.overflowWithoutPanel.push(`${where}: ${data.overflowWithoutPanel}px`);

  // body{flex-wrap:wrap} in the panel stylesheet is unscoped: one panel, a direct child of
  // body, and one panel stylesheet on every page that loads it.
  check(data.panelCount === 1 && data.panelInBody, `${where}: expected one panel as a direct child of body, found ${data.panelCount} (in body: ${data.panelInBody})`);
  check(data.panelSheets === 1, `${where}: expected one loaded /assets/download-panel.css, found ${data.panelSheets}`);

  if (!ab || ab.error) {
    failures.push(`${where}: A/B against ${BASE_REF} not measured: ${ab ? ab.error : 'no data'}`);
  } else {
    evidence.ab.comparisons += 1;
    evidence.ab.elements += ab.elements;
    check(ab.baseApplied, `${where}: A/B: the ${BASE_REF} stylesheet was not applied`);
    check(ab.restored.count === 0, `${where}: A/B: page did not come back after the swap: ${ab.restored.sample.join('; ')}`);
    check(/^(inline-)?flex\b/.test(ab.bodyBase) === flexBody,
      `${where}: body is "${ab.bodyBase}" under the ${BASE_REF} stylesheet; FLEX_BODY_PAGES lists ${FLEX_BODY_PAGES.join(', ')}`);
    check(ab.bodyCurrent === ab.bodyBase, `${where}: panel stylesheet changes body from "${ab.bodyBase}" to "${ab.bodyCurrent}"`);
    check(ab.vsNone.count === 0,
      `${where}: ${ab.vsNone.count} trainer elements differ in left/width from the page without panel and its CSS by > ${AB_TOLERANCE}px: ${ab.vsNone.sample.join('; ')}`);
    if (flexBody) {
      evidence.ab.flexBody.push(`${view.name}: ${ab.main} ${ab.mainWidthBase} -> ${ab.mainWidthCurrent}px, ${ab.vsBase.count}/${ab.elements} elements moved`);
      // Positive control: on the page the fix targets the base stylesheet must really change the layout.
      check(ab.vsBase.count > 0, `${where}: A/B: layout identical to ${BASE_REF} on the flex-body page (fix missing, or the base stylesheet was not applied)`);
    } else {
      evidence.ab.blockBodyMaxShift = Math.max(evidence.ab.blockBodyMaxShift, ab.vsBase.max);
      check(ab.vsBase.count === 0,
        `${where}: ${ab.vsBase.count} of ${ab.elements} elements moved by > ${AB_TOLERANCE}px against ${BASE_REF}: ${ab.vsBase.sample.join('; ')}`);
      check(Math.abs(ab.scrollCurrent[0] - ab.scrollBase[0]) <= AB_TOLERANCE && Math.abs(ab.scrollCurrent[1] - ab.scrollBase[1]) <= AB_TOLERANCE,
        `${where}: page scroll size ${ab.scrollCurrent.join('x')} differs from ${BASE_REF} ${ab.scrollBase.join('x')}`);
    }
  }

  if (view.kind === 'window' || flexBody) {
    check(windowShare >= MIN_SHARE,
      `${where}: trainer ${data.main} is ${data.mainWidth}px, below ${MIN_SHARE * 100}% of min(window ${data.vw}px, max-width ${data.mainMaxWidth})`);
  }
  check(naturalShare >= MIN_SHARE,
    `${where}: panel squeezes ${data.main} to ${data.mainWidth}px of its ${data.naturalWidth}px without the panel`);
  check(data.panelBelowMain || data.panelAboveMain,
    `${where}: panel is neither below nor above ${data.main}`);
  check(data.sharedRow.length === 0, `${where}: panel shares a row with ${data.sharedRow.join(', ')}`);
  check(data.panelWidth >= MIN_SHARE * Math.min(1040, data.parentContent),
    `${where}: panel is ${data.panelWidth}px, not a full-width row of ${data.parentContent}px`);
  check(data.overflowWithPanel <= Math.max(0, data.overflowWithoutPanel),
    `${where}: panel adds horizontal scroll (${data.overflowWithPanel}px with it, ${data.overflowWithoutPanel}px without)`);
  check(data.panelLeft >= -0.5 && data.panelRight <= data.vw + 0.5,
    `${where}: panel spans ${data.panelLeft}..${data.panelRight}px, outside the ${data.vw}px window`);
  check(data.buttons.length === 3, `${where}: expected 3 panel buttons, found ${data.buttons.length}`);
  for (const button of data.buttons) {
    check(button.height >= MIN_TARGET - 0.5, `${where}: panel button is ${button.height}px high, below ${MIN_TARGET}px`);
    check(button.right <= data.vw + 0.5, `${where}: panel button ends at ${button.right}px, outside the ${data.vw}px window`);
  }
  check(data.intoPanel.length === 0, `${where}: taps on trainer controls land in the panel: ${data.intoPanel.slice(0, 3).join('; ')}`);
  check(data.offWindow.length === 0, `${where}: trainer controls centred outside the window: ${data.offWindow.slice(0, 3).join('; ')}`);
  check(data.outsideMain.length === 0,
    `${where}: ${data.outsideMain.length} trainer controls centred outside ${data.main} (clipped): ${data.outsideMain.slice(0, 3).join('; ')}`);
}

// The generator is the flex-row body that used to lose its width: on a phone the first
// "Training" button must open training by touch, and the answer row must stay usable.
async function flexBodyTap(context, url) {
  const page = await context.newPage();
  const downloads = [];
  page.on('download', download => downloads.push(download.suggestedFilename()));
  try {
    await page.goto(url, { waitUntil: 'load' });
    // Scroll the window vertically only (see measure): the finger taps where the button is drawn.
    const point = await page.evaluate(() => {
      const button = document.querySelector('#hub button[onclick^="openTrain("]');
      const before = button.getBoundingClientRect();
      window.scrollTo({ left: 0, top: window.scrollY + before.top + before.height / 2 - innerHeight / 2, behavior: 'instant' });
      const rect = button.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const hit = document.elementFromPoint(x, y);
      const own = hit === button || button.contains(hit);
      const target = !hit ? 'nothing' : `${own ? 'button' : hit.tagName.toLowerCase()}${hit.closest('.download-panel') ? ' in panel' : ''}`;
      return { x, y, target };
    });
    const target = point.target;
    await page.touchscreen.tap(point.x, point.y);
    await page.waitForTimeout(250);
    const state = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const hub = document.getElementById('hub');
      const mainArea = document.getElementById('mainArea');
      const app = document.querySelector('.app');
      const inside = id => {
        const element = document.getElementById(id);
        const before = element.getBoundingClientRect();
        window.scrollTo({ left: 0, top: window.scrollY + before.top + before.height / 2 - innerHeight / 2, behavior: 'instant' });
        const rect = element.getBoundingClientRect();
        const box = app.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        return rect.left >= Math.max(0, box.left) && rect.right <= Math.min(vw, box.right)
          && (hit === element || element.contains(hit));
      };
      const training = !hub.classList.contains('show') && getComputedStyle(mainArea).display !== 'none';
      return {
        training,
        badge: document.getElementById('modeBadge').textContent.trim(),
        answerReachable: training && inside('ansInput'),
        checkReachable: training && inside('checkBtn')
      };
    });
    evidence.flexBodyTap = { target, ...state, downloads: downloads.length };
    const where = `${FLEX_BODY_PAGE} @360 touch`;
    check(target === 'button', `${where}: "Training" centre hits ${target}`);
    check(state.training && state.badge === 'Тренировка', `${where}: tap on "Training" did not open training (badge "${state.badge}")`);
    check(downloads.length === 0, `${where}: tap started a download (${downloads.join(', ')})`);
    check(state.answerReachable && state.checkReachable, `${where}: answer field or check button is not reachable in training`);
    const training = await page.evaluate(measure);
    const trainingAb = await page.evaluate(compareCss, { basePath: BASE_CSS_PATH, tolerance: AB_TOLERANCE });
    verify(FLEX_BODY_PAGE, { name: '360 training', kind: 'window' }, training, trainingAb);
  } finally {
    await page.close();
  }
}

try {
  const baseCss = loadBaseCss();
  for (const [matches, sample, expected] of SCAN_SAMPLES) {
    check(matches(sample) === expected, `scan self-test: ${sample} should ${expected ? '' : 'not '}match`);
  }
  const found = discoverPages();
  const pages = found.panel;
  for (const known of KNOWN_PAGES) check(pages.includes(known), `${known}: panel no longer found; update KNOWN_PAGES if removed on purpose`);
  for (const page of found.css) check(pages.includes(page), `${page}: links download-panel.css without the panel (its body{flex-wrap:wrap} is unscoped)`);
  for (const page of pages) check(found.css.includes(page), `${page}: has the panel but does not link /assets/download-panel.css`);
  evidence.pages = pages.length;

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || process.env.BROWSER_EXECUTABLE_PATH;
  try {
    browser = await chromium.launch({ headless: true, timeout: 30000,
      ...(executablePath ? { executablePath } : { channel: 'msedge' }) });
  } catch (error) {
    throw new Error(`Browser unavailable: set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH to system Chrome/Edge/Chromium. ${error.message}`);
  }

  for (const view of VIEWS) {
    const context = await browser.newContext(view.options);
    context.setDefaultTimeout(15000);
    context.setDefaultNavigationTimeout(60000);
    // Nothing leaves the machine: only the local static server is reachable.
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin === baseUrl && url.pathname === BASE_CSS_PATH) {
        return route.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', body: baseCss });
      }
      if (url.origin === baseUrl) return route.continue();
      blockedRequests.add(`${url.protocol}//${url.host}`);
      return route.abort('blockedbyclient');
    });
    try {
      for (const pagePath of pages) {
        const page = await context.newPage();
        const pageErrors = [];
        page.on('pageerror', error => pageErrors.push(error.message));
        try {
          await page.goto(`${baseUrl}/${pagePath}`, { waitUntil: 'load' });
          await page.waitForTimeout(150);
          const data = await page.evaluate(measure);
          const ab = await page.evaluate(compareCss, { basePath: BASE_CSS_PATH, tolerance: AB_TOLERANCE });
          verify(pagePath, view, data, ab);
          check(pageErrors.length === 0, `${pagePath} @${view.name}: page errors: ${pageErrors.slice(0, 2).join(' | ')}`);
        } catch (error) {
          failures.push(`${pagePath} @${view.name}: ${error.message.split('\n')[0]}`);
        } finally {
          await page.close();
        }
      }
      if (view.name === '360' && pages.includes(FLEX_BODY_PAGE)) {
        try {
          await flexBodyTap(context, `${baseUrl}/${FLEX_BODY_PAGE}`);
        } catch (error) {
          failures.push(`${FLEX_BODY_PAGE} @360 touch: ${error.message.split('\n')[0]}`);
        }
      }
    } finally {
      await context.close();
    }
  }
} finally {
  if (browser) await browser.close();
  if (server.listening) await new Promise(resolve => server.close(resolve));
}

console.log(`view | page | body | trainer | width | without panel | share | panel | position | shares row | h-scroll | min button | A/B vs ${BASE_REF} / vs no panel`);
for (const row of table) console.log(row);
console.log(JSON.stringify({ ...evidence, blockedOrigins: [...blockedRequests].sort(), failures: failures.length }));
if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exitCode = 1;
} else {
  console.log('DOWNLOAD_PANEL_LAYOUT_OK');
}
