'use strict';

// NODE_PATH=<jsdom installation>/node_modules node --test tools/seo-arzhenikov.test.cjs
// Static source checks do not claim CSS visibility or actual browser navigation;
// those are exercised separately by seo-arzhenikov.browser.cjs.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM, VirtualConsole} = require('jsdom');
const root = path.resolve(__dirname, '..');
const origin = 'https://mathexam.space';
const entry = '/topics/metod-arzhenikova/';
const canonical = origin + entry;
const trainer = '/trainers/oge-basics/multiplication-division/arzhenikov-map.html';
const download = '/trainers/oge-basics/multiplication-division/arzhenikov-offline.zip';
const bank = require('../trainers/oge-basics/multiplication-division/arzhenikov-discoveries-bank.js');
const directions = ['workshop', 'harbor', 'discoveries', 'garden-count', 'count', 'journey-algebra', 'journey-geometry'];
const courseRoutes = ["courses","courses-arithmetic","courses-written","courses-fractions","courses-decimals","courses-connections","courses-algebra","courses-geometry","course-check-placement","course-check-review","course-check-final"];
const lines = ['meanings', 'change', 'adjust', 'boundary', 'reverse', 'sequence'];
const stories = lines.map(line => line + '-1');
const sources = [
  'index.html', 'trainers/index.html', 'topics/index.html', 'topics/delenie-ugolkom/index.html',
  'soviet-math/index.html', 'trainers/oge-basics/index.html',
  'trainers/oge-basics/multiplication-division/index.html'
];
const sourceHtml = fs.readFileSync(path.join(root, entry, 'index.html'), 'utf8');
const landing = new JSDOM(sourceHtml, {url: canonical});
const document = landing.window.document;
const clean = text => text.replace(/\s+/g, ' ').trim();
const href = a => new URL(a.getAttribute('href'), canonical).href;
const byId = id => {
  const node = document.getElementById(id);
  assert(node, 'A source HTML section must exist: #' + id);
  return node;
};
const section = id => {
  const node = byId(id);
  return /^H[1-6]$/.test(node.tagName) ? node.closest('section,article,aside') : node;
};
const directionsIn = doc => [...doc.querySelectorAll('#practice .topic-card')].map(card => ({
  title: clean(card.querySelector('h3').textContent),
  href: new URL(card.querySelector('a[href]').getAttribute('href'), canonical).href
}));
const schemas = [...document.querySelectorAll('script[type="application/ld+json"]')].map(script => JSON.parse(script.textContent));
const graph = schemas.flatMap(schema => schema['@graph'] || [schema]);
const ofType = (node, type) => [node['@type']].flat().includes(type);

function assertSourceContent(node, label) {
  assert(node && clean(node.textContent), label + ': meaningful source text');
  assert(!node.closest('[hidden],[aria-hidden="true"],template,noscript'), label + ': not a hidden or JavaScript-only fallback');
  for (let ancestor = node; ancestor; ancestor = ancestor.parentElement) {
    assert.notEqual(ancestor.style.display, 'none', label + ': not display:none');
    assert.notEqual(ancestor.style.visibility, 'hidden', label + ': not visibility:hidden');
  }
}

test('the method, examples, seven activities and six investigations are ordinary HTML', () => {
  assert.equal(document.documentElement.lang, 'ru');
  assert.equal(document.querySelectorAll('h1').length, 1, 'One descriptive H1');
  assert.match(document.querySelector('h1').textContent, /Аржеников/);
  const ids = [...document.querySelectorAll('[id]')].map(node => node.id);
  assert.equal(new Set(ids).size, ids.length, 'No duplicate HTML IDs');
  for (const id of ['method', 'practice', 'courses', 'discoveries', 'offline', 'sources']) {
    const node = section(id);
    assertSourceContent(node, '#' + id);
    assert(node.querySelector('h2,h3'), '#' + id + ': a readable section heading');
  }
  assert(section('method').querySelectorAll('p').length >= 2, 'Method and adaptation are explained in source paragraphs');
  const examples = [...document.querySelectorAll('.worked-example')];
  assert(examples.length >= 2, 'Both meanings of division have an available worked example');
  for (const [index, example] of examples.entries()) {
    assertSourceContent(example, 'Worked example ' + (index + 1));
    assert(example.querySelector('h3') && example.querySelector('p'), 'Worked example has a question and explanation');
  }
  const actualDirections = directionsIn(document);
  assert.deepEqual(actualDirections.map(card => card.href), directions.map(id => origin + trainer + '#' + id));
  for (const card of document.querySelectorAll('#practice .topic-card')) {
    assertSourceContent(card.querySelector('h3'), 'Activity title');
    assertSourceContent(card.querySelector('p'), 'Activity description');
    assertSourceContent(card.querySelector('a[href]'), 'Activity link');
  }
  const links = [...section('discoveries').querySelectorAll('a[href]')];
  assert.deepEqual(links.map(href), stories.map(id => origin + trainer + '#discoveries-' + id));
  for (const link of links) assertSourceContent(link, 'Investigation link');
  const offline = [...section('offline').querySelectorAll('a[download]')].filter(a => href(a) === origin + download);
  assert.equal(offline.length, 1, 'One ordinary download link to the published package');
  assertSourceContent(offline[0], 'Offline download');
  const cited = [...section('sources').querySelectorAll('a[href]')].map(a => new URL(href(a)).hostname);
  for (const host of ['letopis.msu.ru', 'repo.nspu.ru', 'www.mathedu.ru', 'search.rsl.ru']) {
    assert(cited.includes(host), 'The documented source is linked: ' + host);
  }
  const executable = [...document.scripts].filter(script => script.type !== 'application/ld+json');
  const allowed = new Set([
    '/assets/assistant/navigator-data.js?v=20261105-site1',
    '/assets/assistant/navigator-widget.js?v=20261105-site1',
    '/assets/lesson-funnel.js?v=20261026',
    // Only the existing launcher joins the header; all lesson content is source HTML.
    '/assets/arzhenikov-guide-navigation.js'
  ]);
  for (const script of executable) {
    assert(allowed.has(script.getAttribute('src')) && script.defer && !script.textContent.trim(),
      'The readable guide must not depend on executable lesson-rendering code');
  }
});

test('metadata, breadcrumbs and the activity schema describe the visible guide', () => {
  assert.equal(document.querySelectorAll('title').length, 1);
  assert.match(document.title, /Аржеников/);
  assert.match(document.title, /MathExam/);
  function meta(key) {
    const nodes = document.querySelectorAll('meta[name="' + key + '"],meta[property="' + key + '"]');
    assert.equal(nodes.length, 1, 'Exactly one metadata value: ' + key);
    assert(nodes[0].content.trim(), 'Nonempty metadata: ' + key);
    return nodes[0].content;
  }
  const description = meta('description');
  assert.deepEqual([...document.querySelectorAll('link[rel="canonical"]')].map(a => a.href), [canonical]);
  for (const [key, value] of Object.entries({
    'og:type': 'article', 'og:title': document.title, 'og:description': description, 'og:url': canonical,
    'og:site_name': 'MathExam', 'og:locale': 'ru_RU', 'twitter:card': 'summary',
    'twitter:title': document.title, 'twitter:description': description
  })) assert.equal(meta(key), value, 'Consistent ' + key);
  for (const node of document.querySelectorAll('meta[name="robots"],meta[name="googlebot"],meta[name="yandex"]')) {
    assert(!/\b(?:noindex|none)\b/i.test(node.content), 'The public guide remains indexable');
  }
  assert.equal(document.querySelectorAll('meta[http-equiv="refresh"]').length, 0, 'A content page, not a redirect');
  assert(schemas.length, 'JSON-LD is present');
  for (const schema of schemas) assert.equal(schema['@context'], 'https://schema.org');
  const pages = graph.filter(node => ofType(node, 'WebPage'));
  assert.equal(pages.length, 1);
  const page = pages[0];
  assert.equal(page.url, canonical);
  assert.equal(page.name, document.title);
  assert.equal(page.description, description);
  assert.equal(page.inLanguage, 'ru');
  assert.equal(page.isAccessibleForFree, true);
  const crumb = graph.find(node => ofType(node, 'BreadcrumbList'));
  assert(crumb, 'BreadcrumbList is present');
  assert.equal(page.breadcrumb['@id'], crumb['@id']);
  assert.deepEqual(crumb.itemListElement.map(item => item.position), [1, 2, 3]);
  assert.deepEqual(crumb.itemListElement.map(item => item.item), [origin + '/', origin + '/topics/', canonical]);
  const visibleCrumbs = [...document.querySelectorAll('.breadcrumbs li')].map(item => clean(item.textContent));
  assert.deepEqual(crumb.itemListElement.map(item => item.name), visibleCrumbs, 'Breadcrumb schema agrees with the visible path');
  const list = graph.find(node => ofType(node, 'ItemList'));
  assert(list, 'The seven visible directions have an ItemList');
  assert.equal(page.mainEntity['@id'], list['@id']);
  const visibleCards = directionsIn(document);
  assert.equal(list.numberOfItems, visibleCards.length);
  assert.deepEqual(list.itemListElement.map(item => item.position), directions.map((_, index) => index + 1));
  assert.deepEqual(list.itemListElement.map(item => ({title: item.name, href: item.url})), visibleCards,
    'No hidden, missing or imaginary activities in the schema');
});

test('six story URLs resolve to the first practice mission of their real bank line', () => {
  assert.deepEqual(lines, bank.lines.map(line => line.id));
  for (const [index, id] of stories.entries()) {
    const matches = bank.missions.filter(mission => mission.id === id);
    assert.equal(matches.length, 1, 'Exactly one mission: ' + id);
    assert.equal(matches[0].line, lines[index]);
    assert.equal(matches[0].mode, 'practice', 'The link opens a learning story, not an unseen check');
    assert(matches[0].title && matches[0].story && matches[0].prediction.options.length, id + ': renderable mission');
  }
});

test('local links exist and the guide and original trainer are single sitemap documents', () => {
  const allowedRuntimeHashes = new Set(['', '#journey', ...directions.map(id => '#' + id),
    ...stories.map(id => '#discoveries-' + id), ...courseRoutes.map(id => '#' + id)]);
  for (const link of document.querySelectorAll('a[href]')) {
    const url = new URL(link.getAttribute('href'), canonical);
    assert(['https:', 'http:'].includes(url.protocol), 'No script or placeholder link: ' + link.getAttribute('href'));
    if (url.origin !== origin) continue;
    const local = path.resolve(root, '.' + url.pathname + (url.pathname.endsWith('/') ? 'index.html' : ''));
    assert(local.startsWith(root + path.sep), 'Local destination stays inside the site');
    assert(fs.existsSync(local) && fs.statSync(local).isFile() && fs.statSync(local).size > 0,
      'Nonempty local destination: ' + url.pathname);
    if (url.pathname === trainer) {
      assert(allowedRuntimeHashes.has(url.hash), 'Reviewed trainer route: ' + url.hash);
    } else if (url.hash && path.extname(local) === '.html') {
      const target = url.pathname === entry ? landing : new JSDOM(fs.readFileSync(local, 'utf8'));
      assert(target.window.document.getElementById(decodeURIComponent(url.hash.slice(1))),
        'Real static fragment: ' + url.href);
      if (target !== landing) target.window.close();
    }
  }
  const xml = new JSDOM(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'), {contentType: 'text/xml'});
  const urls = [...xml.window.document.querySelectorAll('loc')].map(node => node.textContent);
  assert.equal(urls.filter(url => url === canonical).length, 1, 'One canonical guide sitemap entry');
  assert.equal(urls.filter(url => url === origin + trainer).length, 1, 'The existing trainer stays indexed');
  assert(!urls.includes(canonical + 'index.html'), 'No duplicate directory-index URL');
  assert(!urls.some(url => new URL(url).hash), 'Exercise states do not become fake sitemap pages');
  xml.window.close();
});

test('all seven public entrances expose an ordinary source HTML link to the guide', () => {
  for (const file of sources) {
    const dom = new JSDOM(fs.readFileSync(path.join(root, file), 'utf8'), {url: origin + '/' + file});
    const links = [...dom.window.document.querySelectorAll('a[href]')].filter(a =>
      new URL(a.href).pathname === entry && !new URL(a.href).search);
    assert(links.length, file + ': ordinary source link to the guide');
    for (const link of links) assertSourceContent(link, file + ': guide link');
    dom.window.close();
  }
});

// Authored snapshot from 8ae4127e79e184d8a24102cbcbfce61826f3a657:trainers/index.html.
// Keeping these 63 public titles and destinations requires no historical objects
// in a shallow CI checkout. Additional future cards are allowed; old cards must
// retain their titles/destinations and the source and rendered catalogs agree.
const existingCards = [
  ["Петерсон · математика, 5 класс","/school/peterson5/"],
  ["Виленкин · математика, 5 класс · часть 1","/courses/vilenkin-5-part-1/"],
  ["ВПР по математике: 5–8 и 10 классы","/vpr/"],
  ["ЕГЭ база","/ege-baza/"],
  ["Математическая мастерская 5–6","/school/"],
  ["Уравнения: от первых шагов до ОГЭ","/equations/"],
  ["Базовые действия","/trainers/oge-basics/"],
  ["Атанасян 7–9","/geometry-course/"],
  ["Атанасян 10–11","/stereo-course/"],
  ["Мерзляк 7–9","/geometry-merzlyak/"],
  ["Погорелов 7–9","/geometry-pogorelov/"],
  ["Тренажёр + цифровая доска","./trainer-board.html"],
  ["МЦКО: 4 варианта PDF","./mcko-linejka-4-variants.pdf"],
  ["Линейка тренажёров МЦКО","./trenazher-mcko-linejka-progress.html"],
  ["Театр формул — ежедневные задания","./teatr-formul-daily.html"],
  ["Контрольная работа · 7 класс","./algebra-7/control-work.html"],
  ["Формулы сокращённого умножения — линейка","./formuly-sokrashchennogo-umnozheniya.html"],
  ["Формулы сокращённого умножения — короткий тренажёр","./formuly-sokrashchennogo-umnozheniya-trainer.html"],
  ["Отрицательные числа: числовая прямая","./negative-numbers-line.html"],
  ["Округление чисел","./rounding-stepwise.html"],
  ["Касса разрядов: десятичные дроби","./decimal-cash-trainer.html"],
  ["Простые уравнения","./simple-equations-stepwise.html"],
  ["Системы линейных уравнений","./linear-systems-trainer.html"],
  ["НОК: наименьшее общее кратное","./grade6-nok.html"],
  ["НОД: наибольший общий делитель","./grade6-nod.html"],
  ["Деление столбиком (уголком)","./long-division-stepwise.html"],
  ["Умножение столбиком","./trainers/long-multiplication.html"],
  ["Таблица умножения вперемешку","./oge-basics/multiplication-division/multiplication-mixed.html"],
  ["Таблица Пифагора","./oge-basics/multiplication-division/multiplication-pythagoras-table.html"],
  ["Приёмы таблицы умножения","./oge-basics/multiplication-division/multiplication-tricks.html"],
  ["Курс подготовки к ОГЭ","./oge-course/"],
  ["Математическая база для ОГЭ: ликбез без пробелов","./oge-basics/"],
  ["Проценты и пропорции","./oge-basics/percentages/"],
  ["ОГЭ 1–5: практические задачи","./oge-1-5-trainers/"],
  ["ОГЭ-2027 1–5: входная диагностика","./oge-1-5-trainers/practice-1-5-entry-diagnostic-2026.html"],
  ["ОГЭ 1–5: как читать план и условие","./oge-1-5-trainers/practice-1-5-plan-reading.html"],
  ["ОГЭ-2027 1–5: проверочная по маршрутам","./oge-1-5-trainers/practice-1-5-routes-checkpoint-2026.html"],
  ["ОГЭ по информатике: задания 1-10","./oge-informatics-1-10-tutor.html"],
  ["ОГЭ №19","./task19-trainer.html"],
  ["ОГЭ №14: прогрессии","./oge-task14-progressions.html"],
  ["Логарифмы с нуля: колледж → ЕГЭ","./college-logarithms/"],
  ["Графики функций: курс для колледжа","./college-functions/"],
  ["Задачи 18–20: пошаговый тренажёр","./dvi/math-18-20.html"],
  ["Задачи 18–20: видеостудия","./dvi/math-18-20-video-studio.html"],
  ["Аттестация по математике, 1 курс","./attestaciya-1-kurs.html"],
  ["Числа, деньги и проценты: первый модуль курса","./ege-baza/course/"],
  ["Базовый ЕГЭ 2027: все 21 задание","./ege-baza/"],
  ["Курс профильного ЕГЭ","../ege-profil/"],
  ["Задание 1: планиметрия — генератор","./ege-t1-planimetry-generator.html"],
  ["Задание 2: векторы","./ege-profile-vectors-trainer.html"],
  ["Задание 2: векторы — домашняя работа PDF","./ege-profile-vectors-homework.pdf"],
  ["Задание 3: 3D-стереометрия","../ege-profil/trainers/stereo/"],
  ["Задание 1: графы","./ege-informatics-task1-graphs-trainer.html"],
  ["Задание 15: алгебра логики","./logic-trainer/"],
  ["Операции и законы логики","./ege-informatics-task15-logic-operations.html"],
  ["Машина Тьюринга: текущая версия","./turing-trainer-polish.html"],
  ["Питоша — тренажёр по Python","./pitosha-python-trainer.html"],
  ["Питоша Python — работа на уроке PDF","./pitosha-python-classwork.pdf"],
  ["Стереометрия для колледжа","./college-stereometry/"],
  ["Геометрия 7–9 классы","../geometry-course/"],
  ["Азбука построений","../azbuka-postroeniy-reviewed/"],
  ["Биссектриса угла","./bisector-trainer-v2.html"]
];

test('the catalog retains all 62 retained entries and one new guide card with JS/source parity', () => {
  const html = fs.readFileSync(path.join(root, 'trainers/index.html'), 'utf8');
  const url = origin + '/trainers/';
  const source = new JSDOM(html, {url});
  const scriptErrors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => scriptErrors.push(error.message));
  const rendered = new JSDOM(html, {url, runScripts: 'dangerously', virtualConsole});
  function cards(doc) {
    return [...doc.querySelectorAll('#catalog [data-card]')].map(card => [
      clean(card.querySelector('h3').textContent),
      ...[...card.querySelectorAll('.actions a')].map(a => a.getAttribute('href'))
    ]);
  }
  try {
    const beforeScripts = cards(source.window.document);
    assert.deepEqual(cards(rendered.window.document), beforeScripts, 'JavaScript replaces the source cards without drift or duplication');
    assert.deepEqual(scriptErrors, [], 'Catalog rendering has no script errors');
    assert(!rendered.window.document.body.innerHTML.includes('seo-catalog-fallback:'), 'Rendered catalog replaces the fallback');
    for (const previous of existingCards) {
      const matching = beforeScripts.filter(card => card[0] === previous[0]);
      assert.equal(matching.length, 1, 'Preserve one existing catalog title: ' + previous[0]);
      assert.deepEqual(matching[0], previous, 'Preserve existing catalog destinations: ' + previous[0]);
    }
    assert(!beforeScripts.some(card => card.includes('./trainers/long-division.html')), 'Retired notebook trainer stays out of the catalog');
    const newCards = beforeScripts.filter(card => card.slice(1).some(raw => new URL(raw, url).pathname === entry));
    assert.equal(newCards.length, 1, 'The new guide appears once, including after JavaScript');
    assert.match(newCards[0][0], /Аржеников/);
    for (const doc of [source.window.document, rendered.window.document]) {
      assert.equal(Number(doc.getElementById('countCards').textContent), beforeScripts.length, 'The card counter stays exact');
      assert.equal(Number(doc.getElementById('countSections').textContent), doc.querySelectorAll('#catalog [data-section]').length);
    }
  } finally {
    source.window.close();
    rendered.window.close();
  }
});

test.after(() => landing.window.close());


test('82 lessons and all eleven course/assessment entrances are readable source links', () => {
  const courses = section('courses');
  assert.match(courses.textContent, /82 последовательных урока/);
  assert.match(courses.textContent, /656 учебных условий/);
  assert.match(courses.textContent, /48 условий/);
  const links = [...courses.querySelectorAll('a[href]')].map(href);
  for (const route of courseRoutes) assert(links.includes(origin + trainer + '#' + route), route + ': ordinary course link');
  assert.equal(courses.querySelectorAll('.topic-card').length, 7);
  assert.match(document.title, /82 урока/);
});
