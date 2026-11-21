/* Browser-only catalog and download checks. Run against the built site on CI. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'pedagogam', 'raboty');
const BASE = 'http://127.0.0.1:8765';
const CATALOG = `${BASE}/pedagogam/raboty/`;
const OUT = process.env.ARTIFACT_DIR || path.join(os.tmpdir(), 'pedagogam-textbook-pdfs-qa');
fs.mkdirSync(OUT, { recursive: true });

const packs = JSON.parse(fs.readFileSync(path.join(DATA, 'bank.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(DATA, 'manifest.json'), 'utf8'));
const wordSource = JSON.parse(fs.readFileSync(path.join(DATA, 'word-packs.json'), 'utf8'));
const wordManifest = JSON.parse(fs.readFileSync(path.join(DATA, 'word-manifest.json'), 'utf8'));
const wordByBank = new Map(wordSource.packs.map(pack => [pack.bankId, pack]));
const numbering = JSON.parse(fs.readFileSync(path.join(DATA, 'numbering.json'), 'utf8'));
const normal = value => value.toLocaleLowerCase('ru').replaceAll('ё', 'е');
const gradesFor = pack => {
  const numbers = pack.grade.match(/\d+/g).map(Number);
  const source = pack.book_grades ? [...new Set(Object.values(pack.book_grades).flat())] : Array.from({ length: Math.max(...numbers) - Math.min(...numbers) + 1 },
    (_, index) => Math.min(...numbers) + index);
  const word = wordByBank.get(pack.id);
  if (!word) return source;
  const wordGrades = word.grade.match(/\d+/g).map(Number);
  return [...new Set([...source, ...Array.from({ length: Math.max(...wordGrades) - Math.min(...wordGrades) + 1 },
    (_, index) => Math.min(...wordGrades) + index)])];
};
const expectedIds = ({ grade = '', book = '', query = '' } = {}) => {
  const tokens = normal(query).split(/\s+/).filter(Boolean);
  const selectedBook = book ? numbering.books.find(item => item.title === book)?.id : null;
  const collections = numbering.collections.filter(item => (!grade || item.grade === Number.parseInt(grade, 10))
    && (item.bookId || null) === selectedBook);
  const eligible = new Set(collections.flatMap(item => [...item.sr, ...item.kr])
    .map(id => numbering.works[id].bankId));
  return packs.filter(pack =>
    eligible.has(pack.id) &&
    tokens.every(token => normal([pack.title, pack.grade, pack.subject, ...pack.books,
      ...(wordByBank.has(pack.id) ? [wordByBank.get(pack.id).title, 'Word DOCX'] : [])].join(' ')).includes(token))
  ).map(pack => pack.id).sort();
};

async function main() {
  assert(packs.length > 0, 'The built bank is empty');
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
  const pageErrors = [];
  const consoleErrors = [];
  let scenarios = 0;
  const screenshots = [];
  const books = [...new Set(packs.flatMap(pack => pack.books))].sort();
  const report = { result: 'RUNNING', widths: [320, 390, 1280], books: books.length };
  try {
    const context = await browser.newContext();
    // Font availability must not determine catalog or download test results.
    await context.route('https://fonts.googleapis.com/**', route => route.fulfill({
      status: 200, contentType: 'text/css', body: ''
    }));
    const page = await context.newPage();
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    async function checkState(filters, label) {
      const expected = expectedIds(filters);
      const visible = await page.locator('#catalog .pack:visible').evaluateAll(elements =>
        elements.map(element => element.id).sort());
      assert.deepEqual(visible, expected, `${label}: incorrect visible packs`);
      assert.equal(await page.locator('#empty').isVisible(), expected.length === 0,
        `${label}: incorrect empty-state visibility`);
      assert.match(await page.locator('#count').innerText(),
        new RegExp(`^Комплектов: ${expected.length}\\.`), `${label}: incorrect count`);
      const dimensions = await page.evaluate(() => ({
        content: document.documentElement.scrollWidth,
        viewport: window.innerWidth
      }));
      assert(dimensions.content <= dimensions.viewport + 1,
        `${label}: horizontal overflow ${dimensions.content}/${dimensions.viewport}`);
      scenarios += 1;
    }

    async function clearFilters() {
      await page.locator('#grade').selectOption('');
      await page.locator('#book').selectOption('');
      await page.locator('#search').fill('');
    }

    async function shot(state, width) {
      const filename = `textbook-pdfs-${state}-${width}.png`;
      await page.screenshot({ path: path.join(OUT, filename), fullPage: false });
      screenshots.push(filename);
    }

    const mixedGradePack = packs.find(pack => gradesFor(pack).includes(5) && gradesFor(pack).includes(6));
    assert(mixedGradePack, 'The bank needs a 5–6 class pack to test shared-grade filtering');
    const searchQuery = 'дроб';
    assert(expectedIds({ query: searchQuery }).length > 0, 'Fraction search fixture is missing');
    const combinedPack = packs.find(pack => gradesFor(pack).includes(5));
    assert(combinedPack, 'A grade-five pack is required');
    const combinedBook = combinedPack.books[0];
    const combinedQuery = combinedPack.title;

    for (const width of report.widths) {
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto(CATALOG, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200, `Catalog HTTP status at ${width}`);
      await page.getByRole('heading', { name: 'Самостоятельные и контрольные работы', exact: true }).waitFor();
      assert.equal(await page.locator('#catalog .pack').count(), packs.length);
      const optionBooks = await page.locator('#book option').evaluateAll(options =>
        options.map(option => option.value).filter(Boolean).sort());
      assert.deepEqual(optionBooks, books, 'Book selector and bank do not agree');
      await checkState({}, `initial ${width}`);
      await shot('catalog', width);

      await page.locator('#search').fill('Word');
      await checkState({ query: 'Word' }, `Word format search ${width}`);
      assert.deepEqual(await page.locator('#catalog .pack:visible').evaluateAll(cards => cards.map(card => card.id).sort()),
        ['alg-line', 'arith-brackets-like-terms', 'geo-ugly-treugolnika']);
      await shot('word', width);
      for (const word of wordSource.packs) {
        await page.locator('#search').fill(word.title);
        await checkState({ query: word.title }, `Word topic ${word.title} at ${width}`);
        const wordCard = page.locator(`#${word.bankId} .word-work`);
        assert(await wordCard.isVisible());
        assert.equal(await wordCard.locator('button[data-numbered-role="student"]').count(), 1);
        assert.equal(await wordCard.locator('button[data-numbered-role="teacher"]').count(), 1);
      }
      await page.locator('#grade').selectOption({ label: '9 класс' });
      await page.locator('#search').fill('Word');
      await checkState({ grade: '9 класс', query: 'Word' }, `OGE Word grade-nine search ${width}`);
      assert.deepEqual(await page.locator('#catalog .pack:visible').evaluateAll(cards => cards.map(card => card.id)), ['alg-line']);
      await clearFilters();

      await page.locator('#search').fill(searchQuery);
      await checkState({ query: searchQuery }, `topic search ${width}`);

      await clearFilters();
      await page.locator('#grade').selectOption({ label: '5 класс' });
      await checkState({ grade: '5 класс' }, `grade-five and shared grades ${width}`);
      assert(await page.locator(`#${mixedGradePack.id}`).isVisible(),
        `5–6 pack is missing from the grade-five filter at ${width}`);

      await clearFilters();
      for (const book of books) {
        await page.locator('#book').selectOption({ label: book });
        await checkState({ book }, `book ${book} at ${width}`);
        assert(await page.locator('#catalog .pack:visible').count() > 0,
          `Book has no packs: ${book}`);
        for (const g of [5,6,7,8,9,10,11]) {
          await page.locator('#grade').selectOption({label: `${g} класс`});
          await checkState({book, grade: `${g} класс`}, `book/grade ${book} / ${g} at ${width}`);
        }
        await page.locator('#grade').selectOption('');
      }

      await clearFilters();
      await page.locator('#grade').selectOption({ label: '5 класс' });
      await page.locator('#book').selectOption({ label: combinedBook });
      await page.locator('#search').fill(combinedQuery);
      await checkState({ grade: '5 класс', book: combinedBook, query: combinedQuery },
        `combined filters ${width}`);
      assert(await page.locator(`#${combinedPack.id}`).isVisible());
      await shot('filtered', width);

      await page.locator('#search').fill('несуществующаятема739215');
      await checkState({ grade: '5 класс', book: combinedBook, query: 'несуществующаятема739215' },
        `no results ${width}`);
      await shot('empty', width);

      const reset = page.getByRole('button', { name: /^(Сбросить|Сбросить фильтры)$/ });
      if (await reset.count()) await reset.click();
      else await clearFilters();
      assert.equal(await page.locator('#grade').inputValue(), '');
      assert.equal(await page.locator('#book').inputValue(), '');
      assert.equal(await page.locator('#search').inputValue(), '');
      await checkState({}, `reset ${width}`);
    }

    // Check one download of every delivered kind; Python checks the complete bank.
    const item = manifest[0];
    assert(item && item.files.length === 4, 'No representative four-file pack');
    const card = page.locator(`#${item.id}`);
    const downloads = [];
    for (const filename of ['samostoyatelnaya.pdf', 'samostoyatelnaya-otvety.pdf',
      'kontrolnaya.pdf', 'kontrolnaya-otvety.pdf']) {
      const record = item.files.find(file => path.posix.basename(file.path) === filename);
      assert(record, `Representative pack is missing ${filename}`);
      const action = card.locator(`button[data-numbered-source$="/${filename}"]`);
      const href = await action.getAttribute('data-numbered-source');
      assert(href, `Missing catalog PDF source ${filename}`);
      assert.equal(await action.getAttribute('href'), null, 'Numbered action cannot navigate to the unnumbered source');
      assert.equal(await action.isEnabled(), true, 'Numbered action enabled after initialization');
      downloads.push({ href, local: path.join(DATA, record.path), type: 'pdf' });
    }
    downloads.push({
      href: await card.getByRole('button', { name: 'Скачать комплект ZIP', exact: true }).getAttribute('data-numbered-source'),
      local: path.join(DATA, item.id, 'komplekt.zip'), type: 'zip'
    });
    downloads.push({
      href: await page.locator('button[data-numbered-archive="pdf"]').getAttribute('data-numbered-source'),
      local: path.join(DATA, 'mathexam-raboty-pdf.zip'), type: 'zip'
    });
    for (const word of wordSource.packs) {
      const wordCard = page.locator(`#${word.bankId} .word-work`);
      for (const [role, file] of [['student', word.studentFile], ['teacher', word.teacherFile]]) {
        const href = await wordCard.locator(`button[data-numbered-role="${role}"]`).getAttribute('data-numbered-source');
        assert.equal(href, '/pedagogam/raboty/' + file);
        downloads.push({ href, local: path.join(DATA, file), type: 'docx' });
      }
    }
    downloads.push({
      href: await page.getByRole('link', { name: 'Лист работы над ошибками Word', exact: true }).getAttribute('href'),
      local: path.join(DATA, wordSource.errorReviewFile), type: 'docx'
    });
    downloads.push({
      href: await page.getByRole('button', { name: 'Скачать Word подборки', exact: true }).getAttribute('data-numbered-source'),
      local: path.join(DATA, wordSource.archive), type: 'zip'
    });
    assert.equal(wordManifest.files.length, 7);
    for (const download of downloads) {
      assert(download.href, 'Download href is absent');
      const url = new URL(download.href, CATALOG);
      assert.equal(url.origin, BASE, 'Download must remain on the local test server');
      const response = await page.request.get(url.href);
      assert.equal(response.status(), 200, `Download HTTP status: ${url.pathname}`);
      const body = await response.body();
      assert(body.equals(fs.readFileSync(download.local)), `Download bytes differ: ${url.pathname}`);
      if (download.type === 'pdf') assert.equal(body.subarray(0, 5).toString(), '%PDF-');
      else assert.equal(body.subarray(0, 2).toString(), 'PK');
      if (download.type === 'docx') assert.match(response.headers()['content-type'], /wordprocessingml\.document/);
      scenarios += 1;
    }
    const [wordDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#arith-brackets-like-terms .word-work button[data-numbered-role="student"]').click()
    ]);
    assert.match(wordDownload.suggestedFilename(), /\.docx$/);
    const wordFile = await wordDownload.path();
    const sourceWord = wordSource.packs.find(item => item.bankId === 'arith-brackets-like-terms');
    const contexts = numbering.collections.filter(item => !item.bookId && item.sr.includes('word:' + sourceWord.id))
      .map(item => ({ grade: item.grade, number: item.sr.indexOf('word:' + sourceWord.id) + 1 }));
    const verified = spawnSync(process.env.PYTHON || 'python3', ['-c', `
import json,sys,zipfile,xml.etree.ElementTree as E
source,dest,contexts=sys.argv[1],sys.argv[2],json.loads(sys.argv[3])
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main','m':'http://schemas.openxmlformats.org/officeDocument/2006/math'}
with zipfile.ZipFile(source) as a,zipfile.ZipFile(dest) as b:
 old=E.fromstring(a.read('word/document.xml')); new=E.fromstring(b.read('word/document.xml'))
 assert [E.tostring(x) for x in old.findall('.//m:oMath',ns)]==[E.tostring(x) for x in new.findall('.//m:oMath',ns)], 'editable equations changed'
 text=' '.join(' '.join(E.fromstring(b.read(p)).itertext()) for p in b.namelist() if p.startswith('word/') and p.endswith('.xml'))
 assert all(('№ '+str(c['number'])) in text for c in contexts), 'number missing'
 assert all(('Вариант '+str(i)) in text for i in range(1,5)), 'variant missing'
 assert a.read('word/document.xml') != b.read('word/document.xml'), 'numbering did not change document'
`, path.join(DATA, sourceWord.studentFile), wordFile, JSON.stringify(contexts)], { encoding: 'utf8' });
    assert.equal(verified.status, 0, verified.stderr || verified.stdout);
    assert.deepEqual(pageErrors, [], 'Uncaught page errors');
    assert.deepEqual(consoleErrors, [], 'Browser console errors');
    Object.assign(report, { result: 'PASS', scenarios, screenshots, downloads: downloads.length,
      wordFiles: wordManifest.files.length, wordDownloadJourneys: 1, pageErrors, consoleErrors });
    await context.close();
  } catch (error) {
    Object.assign(report, { result: 'FAIL', scenarios, screenshots, pageErrors, consoleErrors,
      error: error.stack || String(error) });
    throw error;
  } finally {
    fs.writeFileSync(path.join(OUT, 'textbook-pdfs-browser-results.json'),
      JSON.stringify(report, null, 2) + '\n');
    await browser.close();
  }
  console.log(JSON.stringify(report));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
