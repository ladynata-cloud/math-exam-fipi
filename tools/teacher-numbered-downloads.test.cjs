/* Focused browser tests for numbered copies; no publisher files or live writes. */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'pedagogam/raboty');
const ARTIFACTS = process.env.ARTIFACT_DIR || path.join(os.tmpdir(), 'teacher-numbered-downloads-qa');
const Zip = require(path.join(DATA, 'vendor/jszip-3.10.1.min.js'));
const bank = JSON.parse(fs.readFileSync(path.join(DATA, 'bank.json'), 'utf8'));
const wordBank = JSON.parse(fs.readFileSync(path.join(DATA, 'word-packs.json'), 'utf8'));
const longestBook = bank.flatMap(pack => pack.books).sort((left, right) => right.length - left.length)[0];
const rootUrl = '/pedagogam/raboty/';
fs.mkdirSync(ARTIFACTS, { recursive: true });

function workFor(pack, kind = 'sr') {
  return {
    id: pack.id + ':' + kind, bankId: pack.id, kind, format: 'pdf', title: pack.title,
    grades: [...new Set(Object.values(pack.book_grades).flat())],
    studentUrl: rootUrl + pack.id + '/' + (kind === 'sr' ? 'samostoyatelnaya' : 'kontrolnaya') + '.pdf',
    teacherUrl: rootUrl + pack.id + '/' + (kind === 'sr' ? 'samostoyatelnaya' : 'kontrolnaya') + '-otvety.pdf'
  };
}

function wordWork(pack) {
  const digits = pack.grade.match(/\d+/g).map(Number);
  return {
    id: 'word:' + pack.id, bankId: pack.bankId, kind: 'sr', format: 'docx', title: pack.title,
    grades: Array.from({ length: Math.max(...digits) - Math.min(...digits) + 1 }, (_, i) => Math.min(...digits) + i),
    studentUrl: rootUrl + pack.studentFile, teacherUrl: rootUrl + pack.teacherFile
  };
}

const pdfWork = workFor(bank.find(pack => pack.id === 'arith-fraction-add-subtract'));
const context = { grade: 6, number: 7, bookTitle: longestBook, collectionId: 'book-layout-fixture-6' };
const multiContexts = [{ grade: 5, number: 12, bookTitle: null, collectionId: 'grade-5' },
  { grade: 6, number: 7, bookTitle: null, collectionId: 'grade-6' }];

function server() {
  return http.createServer((request, response) => {
    const route = new URL(request.url, 'http://127.0.0.1').pathname;
    if (route === '/__numbered_downloads_test') {
      response.setHeader('content-type', 'text/html; charset=utf-8');
      response.end('<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Numbered downloads test</title><script src="/pedagogam/raboty/numbered-downloads.js"></script></head><body>MathExam download checks</body></html>');
      return;
    }
    if (route === '/favicon.ico') { response.statusCode = 204; response.end(); return; }
    const requested = path.resolve(ROOT, '.' + route);
    if (!requested.startsWith(ROOT + path.sep) || !fs.existsSync(requested) || !fs.statSync(requested).isFile()) {
      response.statusCode = 404; response.end('Not found'); return;
    }
    const type = { '.js': 'text/javascript', '.json': 'application/json', '.pdf': 'application/pdf',
      '.ttf': 'font/ttf', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }[path.extname(requested)] || 'application/octet-stream';
    response.setHeader('content-type', type);
    response.setHeader('content-length', fs.statSync(requested).size);
    fs.createReadStream(requested).pipe(response);
  });
}

async function saveResult(page, args, name) {
  const result = await page.evaluate(async ({ work, role, contexts }) => {
    const bytes = await window.MathExamNumberedDownloads.create(work, role, contexts);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return btoa(binary);
  }, args);
  const bytes = Buffer.from(result, 'base64');
  fs.writeFileSync(path.join(ARTIFACTS, name), bytes);
  return bytes;
}

async function equivalentDocx(page, sourcePath, numbered) {
  return page.evaluate(async ({ original, changed }) => {
    const decode = value => Uint8Array.from(atob(value), character => character.charCodeAt(0));
    const before = await window.JSZip.loadAsync(decode(original));
    const after = await window.JSZip.loadAsync(decode(changed));
    const names = Object.keys(before.files).sort();
    if (JSON.stringify(names) !== JSON.stringify(Object.keys(after.files).sort())) return { error: 'member set changed' };
    const allowed = ['word/document.xml', 'word/footer1.xml', 'docProps/core.xml'];
    for (const name of names) {
      if (allowed.includes(name)) continue;
      if (await before.file(name).async('base64') !== await after.file(name).async('base64')) return { error: 'unrelated member changed: ' + name };
    }
    const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    const normalize = value => {
      const xml = new DOMParser().parseFromString(value, 'application/xml');
      if (xml.getElementsByTagName('parsererror').length) throw new Error('Invalid document XML');
      for (const p of [...xml.getElementsByTagNameNS(W, 'p')]) {
        const style = p.getElementsByTagNameNS(W, 'pStyle')[0];
        if (style && style.getAttributeNS(W, 'val') === 'Subtitle') p.replaceWith(xml.createComment('numbered subtitle'));
      }
      return new XMLSerializer().serializeToString(xml.documentElement);
    };
    const source = await before.file('word/document.xml').async('string');
    const target = await after.file('word/document.xml').async('string');
    if (normalize(source) !== normalize(target)) return { error: 'body changed outside subtitle' };
    const sourceParsed = new DOMParser().parseFromString(source, 'application/xml');
    const parsed = new DOMParser().parseFromString(target, 'application/xml');
    const subtitleTexts = [...parsed.getElementsByTagNameNS(W, 'p')].filter(p => {
      const style = p.getElementsByTagNameNS(W, 'pStyle')[0];
      return style && style.getAttributeNS(W, 'val') === 'Subtitle';
    }).map(p => p.textContent);
    const footer = new DOMParser().parseFromString(await after.file('word/footer1.xml').async('string'), 'application/xml');
    return { subtitleTexts, footer: footer.documentElement.textContent,
      sourceEquations: sourceParsed.getElementsByTagNameNS('http://schemas.openxmlformats.org/officeDocument/2006/math', 'oMath').length,
      sourceDiagrams: sourceParsed.getElementsByTagNameNS('urn:schemas-microsoft-com:vml', 'group').length,
      equations: parsed.getElementsByTagNameNS('http://schemas.openxmlformats.org/officeDocument/2006/math', 'oMath').length,
      diagrams: parsed.getElementsByTagNameNS('urn:schemas-microsoft-com:vml', 'group').length };
  }, { original: fs.readFileSync(sourcePath).toString('base64'), changed: numbered.toString('base64') });
}

async function main() {
  let checks = 0;
  const vendorManifest = JSON.parse(fs.readFileSync(path.join(DATA, 'vendor/manifest.json'), 'utf8'));
  for (const file of vendorManifest.files) {
    const bytes = fs.readFileSync(path.join(DATA, 'vendor', file.path));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), file.sha256, 'vendored source hash: ' + file.path);
    checks++;
  }
  const local = server();
  await new Promise(resolve => local.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + local.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ['--no-sandbox'] });
  try {
    const browserContext = await browser.newContext({ acceptDownloads: true });
    const page = await browserContext.newPage();
    const vendorRequests = [];
    const pageErrors = [];
    page.on('request', request => { if (request.url().includes('/vendor/')) vendorRequests.push(request.url()); });
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base + '/__numbered_downloads_test');
    assert.equal(vendorRequests.length, 0, 'vendor libraries must be lazy'); checks++;

    const rejected = await page.evaluate(async ({ work, context }) => {
      const api = window.MathExamNumberedDownloads;
      const probes = [
        () => api.create(work, 'student', []),
        () => api.create(work, 'student', [{ ...context, number: 0 }]),
        () => api.create(work, 'student', [{ ...context, number: 1.5 }]),
        () => api.create(work, 'student', [{ ...context, grade: 11 }]),
        () => api.create(work, 'student', [context, context]),
        () => api.create(work, 'student', [context, { ...context, grade: 5, bookTitle: 'Другой учебник' }]),
        () => api.create(work, 'answers', [context]),
        () => api.create({ ...work, studentUrl: 'https://example.invalid/samostoyatelnaya.pdf' }, 'student', [context]),
        () => api.create({ ...work, studentUrl: '/pedagogam/raboty/../bank.json' }, 'student', [context]),
        () => api.create({ ...work, studentUrl: work.studentUrl + '?secret=fixture' }, 'student', [context]),
        () => api.create({ ...work, studentUrl: work.teacherUrl }, 'student', [context]),
        () => api.archiveBytes([{ unchanged: true, url: '/pedagogam/raboty/bank.json', filename: 'bank.json' }]),
        () => api.archiveBytes([{ work, role: 'student', contexts: [context] }, { work, role: 'student', contexts: [context] }]),
        () => api.archive([{ work, role: 'student', contexts: [context] }], '../works.zip')
      ];
      const messages = [];
      for (const probe of probes) {
        try { await probe(); messages.push(null); } catch (error) { messages.push(error.message); }
      }
      return messages;
    }, { work: pdfWork, context });
    assert(rejected.every(Boolean), 'invalid scopes/paths must reject before downloading'); checks += rejected.length;
    assert.equal(vendorRequests.length, 0, 'invalid inputs must not load expensive libraries'); checks++;

    for (const role of ['student', 'teacher']) {
      const bytes = await saveResult(page, { work: pdfWork, role, contexts: [context] }, `single-${role}.pdf`);
      const info = await page.evaluate(async b64 => {
        const document = await PDFLib.PDFDocument.load(Uint8Array.from(atob(b64), character => character.charCodeAt(0)));
        return { pages: document.getPageCount(), title: document.getTitle(), subject: document.getSubject() };
      }, bytes.toString('base64'));
      assert.equal(info.pages, 4);
      assert(info.title.includes('№ 7') && info.title.includes('6 класс'));
      assert(info.subject.includes(longestBook));
      checks += 3;
    }
    await saveResult(page, { work: pdfWork, role: 'student', contexts: multiContexts }, 'multi-student.pdf'); checks++;

    const snapshot = await page.evaluate(async ({ work, context }) => {
      const contexts = [{ ...context }];
      const creating = MathExamNumberedDownloads.create(work, 'student', contexts);
      contexts[0].number = 999;
      const document = await PDFLib.PDFDocument.load(await creating);
      return document.getTitle();
    }, { work: pdfWork, context });
    assert(snapshot.includes('№ 7') && !snapshot.includes('999'), 'in-flight filter changes must not renumber a copy'); checks++;

    const downloadable = page.waitForEvent('download');
    const downloadInfo = await page.evaluate(args => MathExamNumberedDownloads.download(args.work, 'student', [args.context]),
      { work: pdfWork, context });
    const downloaded = await downloadable;
    assert.equal(downloaded.suggestedFilename(), downloadInfo.filename);
    assert(downloadInfo.filename.includes('book-layout-fixture-6_sr-07'));
    assert.equal(await downloaded.failure(), null);
    checks += 3;

    for (const pack of wordBank.packs) {
      const work = wordWork(pack);
      const contexts = work.grades.map((grade, index) => ({ grade, number: 20 + index, collectionId: 'grade-' + grade, bookTitle: null }));
      for (const role of ['student', 'teacher']) {
        const bytes = await saveResult(page, { work, role, contexts }, `${pack.id}-${role}.docx`);
        const source = path.join(ROOT, (role === 'student' ? work.studentUrl : work.teacherUrl).slice(1));
        const equal = await equivalentDocx(page, source, bytes);
        assert(!equal.error, `${pack.id}/${role}: ${equal.error}`);
        assert.equal(equal.subtitleTexts.length, 4);
        assert(equal.subtitleTexts.every(value => value.includes('№ 20')));
        assert(equal.footer.includes(contexts[0].grade + ' класс: № 20'));
        if (role === 'teacher') { assert(equal.subtitleTexts.every(value => value.includes('Ответы и решения'))); checks++; }
        if (pack.id === 'lineynye-grafiki-oge') { assert.equal(equal.diagrams, 4); checks++; }
        // The original triangle student sheet uses ordinary text, with no
        // native equation objects. Every export must preserve its source's
        // exact object counts, including zero, as well as the full body above.
        assert.equal(equal.equations, equal.sourceEquations, `${pack.id}/${role}: native equation count changed`);
        assert.equal(equal.diagrams, equal.sourceDiagrams, `${pack.id}/${role}: editable diagram count changed`);
        checks += 6;
      }
    }

    const longWord = wordWork(wordBank.packs[0]);
    const longWordContexts = [{ grade: 6, number: 20, collectionId: 'book-layout-fixture-6', bookTitle: longestBook }];
    await saveResult(page, { work: longWord, role: 'student', contexts: longWordContexts }, 'long-textbook-student.docx'); checks++;

    const archive = await page.evaluate(async ({ work, word, context }) => {
      const progress = [];
      const entries = ['student', 'teacher'].map(role => ({ work, role, contexts: [context] }));
      entries.push({ work: word, role: 'student', contexts: [{ grade: 6, number: 20, bookTitle: null, collectionId: 'grade-6' }] });
      entries.push({ unchanged: true, url: '/pedagogam/raboty/rabota-nad-oshibkami.docx', filename: 'rabota-nad-oshibkami.docx' });
      const bytes = await MathExamNumberedDownloads.archiveBytes(entries, state => progress.push(state));
      let binary = '';
      for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      return { b64: btoa(binary), progress };
    }, { work: pdfWork, word: longWord, context });
    const archiveBuffer = Buffer.from(archive.b64, 'base64');
    fs.writeFileSync(path.join(ARTIFACTS, 'numbered-sample.zip'), archiveBuffer);
    const zipped = await Zip.loadAsync(archiveBuffer, { checkCRC32: true });
    assert.equal(Object.keys(zipped.files).length, 5);
    const readme = await zipped.file('README.txt').async('string');
    assert(readme.includes('6 класс: № 7') && readme.includes(longestBook));
    assert.deepEqual(await zipped.file('rabota-nad-oshibkami.docx').async('nodebuffer'), fs.readFileSync(path.join(DATA, 'rabota-nad-oshibkami.docx')));
    assert.equal(archive.progress[0].percent, 0);
    assert.equal(archive.progress.at(-1).percent, 100);
    assert(archive.progress.every((state, index) => index === 0 || state.percent >= archive.progress[index - 1].percent));
    checks += 6;

    const aborted = await page.evaluate(async ({ work, context }) => {
      const controller = new AbortController(); controller.abort();
      try {
        await MathExamNumberedDownloads.archiveBytes([{ work, role: 'student', contexts: [context] }], null, { signal: controller.signal });
        return null;
      } catch (error) { return error.name; }
    }, { work: pdfWork, context });
    assert.equal(aborted, 'AbortError'); checks++;

    await page.route('**/arith-fraction-add-subtract/samostoyatelnaya.pdf', route => route.fulfill({ status: 503, body: 'Unavailable' }));
    const missing = await page.evaluate(async ({ work, context }) => {
      try { await MathExamNumberedDownloads.create(work, 'student', [context]); return null; }
      catch (error) { return error.message; }
    }, { work: pdfWork, context });
    assert.match(missing, /Не удалось загрузить файл/); checks++;

    const missingDependencyContext = await browser.newContext();
    const blockedPage = await missingDependencyContext.newPage();
    await blockedPage.route('**/fontkit-1.1.1.min.js', route => route.abort('failed'));
    await blockedPage.goto(base + '/__numbered_downloads_test');
    const unavailable = await blockedPage.evaluate(async ({ work, context }) => {
      try { await MathExamNumberedDownloads.create(work, 'student', [context]); return null; }
      catch (error) { return error.message; }
    }, { work: pdfWork, context });
    assert.match(unavailable, /Не удалось загрузить средства скачивания/); checks++;
    await missingDependencyContext.close();
    assert.deepEqual(pageErrors, []); checks++;

    fs.writeFileSync(path.join(ARTIFACTS, 'numbered-downloads-report.json'), JSON.stringify({ result: 'PASS', checks,
      vendorBytes: vendorManifest.files.reduce((total, file) => total + fs.statSync(path.join(DATA, 'vendor', file.path)).size, 0),
      sourcePdf: pdfWork.studentUrl, sourceTeacherPdf: pdfWork.teacherUrl, testTextbook: longestBook,
      outputs: fs.readdirSync(ARTIFACTS).filter(name => /\.(pdf|docx|zip)$/.test(name)) }, null, 2) + '\n');
    console.log(`TEACHER_NUMBERED_DOWNLOADS_OK ${checks} checks; evidence ${ARTIFACTS}`);
  } finally {
    await browser.close();
    await new Promise(resolve => local.close(resolve));
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
