/* End-to-end proof of permanent grade/textbook numbering and numbered exports.
 * Expectations come from the literal editorial order and original task banks,
 * not from the page's numbering functions. No real pupils or accounts are used.
 */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'pedagogam', 'raboty');
const BASE = process.env.TEACHER_NUMBERING_BASE || 'http://127.0.0.1:8765';
const CATALOG = BASE + '/pedagogam/raboty/';
const OUT = process.env.ARTIFACT_DIR || path.join(os.tmpdir(), 'teacher-work-numbering-qa');
const PYTHON = process.env.CODEX_PRIMARY_RUNTIME_PYTHON || 'python3';
fs.mkdirSync(OUT, { recursive: true });
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const sorted = values => [...values].sort();
const compact = text => String(text).replace(/\s+/gu, '');
const expandGrades = text => {
  const values = String(text).match(/\d+/gu).map(Number);
  return Array.from({ length: Math.max(...values) - Math.min(...values) + 1 },
    (_, i) => Math.min(...values) + i);
};

// This validator independently reads the delivered bytes, not exporter internals.
// Pixel identity below the heading protects every original question, answer,
// score, writing line and editable-geometry preview from accidental overlays.
const VALIDATE_PY = [
  'import io,json,re,sys,zipfile,xml.etree.ElementTree as E',
  'from pathlib import Path',
  'import fitz',
  'root=Path(sys.argv[1]); output=Path(sys.argv[2])',
  "manifest=json.loads((output/'numbered-downloads.json').read_text())",
  "NS={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main','m':'http://schemas.openxmlformats.org/officeDocument/2006/math','v':'urn:schemas-microsoft-com:vml'}",
  "norm=lambda value: re.sub(r'\\s+','',str(value))",
  'checks=0; pdfs=0; docxs=0; zip_count=0',
  'def require(condition,message):',
  ' global checks',
  ' checks+=1',
  ' assert condition,message',
  'def original(work,role):',
  " return (root/work['teacherUrl' if role=='teacher' else 'studentUrl'].lstrip('/')).read_bytes()",
  'def context_labels(text,contexts,label):',
  ' text=norm(text)',
  ' for ctx in contexts:',
  "  require(norm('№ '+str(ctx['number'])) in text,(label,'missing work number',ctx))",
  "  require(norm(str(ctx['grade'])+' класс') in text,(label,'missing class',ctx))",
  "  if ctx.get('bookTitle'): require(norm(ctx['bookTitle']) in text,(label,'missing textbook',ctx))",
  'def pdf(data,record,label):',
  ' global pdfs',
  " src=fitz.open(stream=original(record['work'],record['role']),filetype='pdf')",
  " dest=fitz.open(stream=data,filetype='pdf')",
  " require(len(src)==len(dest)==4,(label,'four variants / four pages'))",
  " context_labels((dest.metadata.get('title') or '')+' '+(dest.metadata.get('subject') or ''),record['contexts'],label+' metadata')",
  ' for i,(a,b) in enumerate(zip(src,dest),1):',
  "  require(a.rect==b.rect,(label,i,'page size'))",
  '  region=fitz.Rect(0,96,a.rect.width,a.rect.height)',
  '  source_pixels=a.get_pixmap(matrix=fitz.Matrix(1.5,1.5),clip=region,alpha=False)',
  '  final_pixels=b.get_pixmap(matrix=fitz.Matrix(1.5,1.5),clip=region,alpha=False)',
  "  require(source_pixels.samples==final_pixels.samples,(label,i,'body changed below heading'))",
  "  require(norm(a.get_text(clip=region))==norm(b.get_text(clip=region)),(label,i,'selectable body changed'))",
  "  header=b.get_text(clip=fitz.Rect(0,0,b.rect.width,96))",
  "  context_labels(header,record['contexts'],label+' page '+str(i))",
  "  require(norm('Вариант '+str(i)) in norm(header),(label,i,'variant identity'))",
  "  for block in b.get_text('dict',clip=fitz.Rect(0,0,b.rect.width,96))['blocks']:",
  "   for line in block.get('lines',[]):",
  "    for span in line['spans']:",
  "     x0,y0,x1,y1=span['bbox']",
  "     require(20<=x0<x1<=b.rect.width-20 and 8<=y0<y1<=96.1,(label,i,'header text outside safe area',span['text'],span['bbox']))",
  ' pdfs+=1',
  'def signature(node):',
  " if node.tag=='{'+NS['w']+'}p' and node.find('./w:pPr/w:pStyle[@w:val=\"Subtitle\"]',NS) is not None: return None",
  ' children=tuple(value for child in node if (value:=signature(child)) is not None)',
  " text=node.text or ''",
  " if node.tag not in ('{'+NS['w']+'}t','{'+NS['m']+'}t') and not text.strip(): text=''",
  ' return (node.tag,tuple(sorted(node.attrib.items())),text,children)',
  'def docx(data,record,label):',
  ' global docxs',
  " src=zipfile.ZipFile(io.BytesIO(original(record['work'],record['role'])))",
  ' dest=zipfile.ZipFile(io.BytesIO(data))',
  " require(dest.testzip() is None,(label,'DOCX CRC'))",
  " require(set(src.namelist())==set(dest.namelist()),(label,'DOCX package parts'))",
  " changed={'word/document.xml','word/footer1.xml','docProps/core.xml'}",
  ' for name in src.namelist():',
  "  if name not in changed: require(src.read(name)==dest.read(name),(label,'changed unrelated part',name))",
  " a=E.fromstring(src.read('word/document.xml')); b=E.fromstring(dest.read('word/document.xml'))",
  " require(signature(a)==signature(b),(label,'body, native equations, diagrams or page breaks changed'))",
  " require(len(b.findall('.//w:br[@w:type=\"page\"]',NS))==3,(label,'four explicit variants'))",
  " subtitles=[p for p in b.findall('.//w:p',NS) if p.find('./w:pPr/w:pStyle[@w:val=\"Subtitle\"]',NS) is not None]",
  " require(len(subtitles)==4,(label,'one work heading per variant'))",
  " footer=E.fromstring(dest.read('word/footer1.xml'))",
  " footer_text=' '.join(footer.itertext())",
  " context_labels(footer_text,record['contexts'],label+' footer')",
  " for p in subtitles: require('Самостоятельная работа' in ''.join(p.itertext()),(label,'numbered work heading'))",
  " if record['role']=='teacher':",
  "  require(all('Ответы' in ''.join(p.itertext()) or 'ответы' in ''.join(p.itertext()) for p in subtitles),(label,'teacher designation'))",
  ' docxs+=1',
  'for record in manifest:',
  " target=output/record['filename']; data=target.read_bytes()",
  " if record['type']=='pdf': pdf(data,record,record['filename'])",
  " elif record['type']=='docx': docx(data,record,record['filename'])",
  ' else:',
  '  z=zipfile.ZipFile(io.BytesIO(data))',
  "  require(z.testzip() is None,(record['filename'],'ZIP CRC'))",
  "  require('README.txt' in z.namelist(),(record['filename'],'numbered archive contents'))",
  "  readme=z.read('README.txt').decode('utf-8')",
  "  files=[name for name in z.namelist() if not name.endswith('/') and name!='README.txt']",
  "  require(len(files)==len(record['entries']),(record['filename'],'archive file count'))",
  "  remaining=list(record['entries'])",
  '  for name in files:',
  "   require(not name.startswith('/') and '..' not in Path(name).parts,(record['filename'],'unsafe archive path'))",
  '   content=z.read(name)',
  '   matches=[]',
  "   if name.endswith('.pdf'):",
  "    archive_pdf=fitz.open(stream=content,filetype='pdf')",
  '    body=norm(archive_pdf[0].get_text(clip=fitz.Rect(0,96,596,842)))',
  '    for entry in remaining:',
  "     if entry.get('unchanged') or entry['work']['format']!='pdf': continue",
  "     source=fitz.open(stream=original(entry['work'],entry['role']),filetype='pdf')",
  "     if norm(source[0].get_text(clip=fitz.Rect(0,96,596,842)))==body: matches.append(entry)",
  '   else:',
  "    require(name.endswith('.docx'),(record['filename'],name,'unexpected archive format'))",
  '    archive_word=zipfile.ZipFile(io.BytesIO(content))',
  "    body=signature(E.fromstring(archive_word.read('word/document.xml')))",
  '    for entry in remaining:',
  "     if entry.get('unchanged'):",
  "      if name==entry['filename'] and content==(root/entry['url'].lstrip('/')).read_bytes(): matches.append(entry)",
  "     elif entry['work']['format']=='docx':",
  "      source=zipfile.ZipFile(io.BytesIO(original(entry['work'],entry['role'])))",
  "      if signature(E.fromstring(source.read('word/document.xml')))==body: matches.append(entry)",
  "   require(len(matches)==1,(record['filename'],name,'unique source match'))",
  '   entry=matches[0]; remaining.remove(entry)',
  "   if not entry.get('unchanged'):",
  "    (pdf if entry['work']['format']=='pdf' else docx)(content,entry,record['filename']+'/'+name)",
  "    context_labels(readme,entry['contexts'],record['filename']+' README')",
  "  require(not remaining,(record['filename'],'every selected work and role in ZIP'))",
  '  zip_count+=1',
  "print(json.dumps({'result':'PASS','checks':checks,'pdfs':pdfs,'docxs':docxs,'archives':zip_count},ensure_ascii=False))"
].join('\n');

async function main() {
  const report = { result: 'RUNNING', scenarios: 0, collections: 0, screenshots: [], downloads: [],
    pageErrors: [], consoleErrors: [] };
  let browser;
  let intentionalFailure = false;
  try {
    const registry = read(path.join(DATA, 'numbering.json'));
    const editorial = read(path.join(ROOT, 'tools', 'teacher-work-order.json'));
    const bank = read(path.join(DATA, 'bank.json'));
    const wordBank = read(path.join(DATA, 'word-packs.json'));
    const byPack = new Map(bank.map(item => [item.id, item]));
    const byBook = new Map(editorial.books.map(item => [item.id, item]));
    const wordById = new Map(wordBank.packs.map(item => ['word:' + item.id, item]));
    const check = () => { report.scenarios++; };
    const collectionById = new Map(registry.collections.map(item => [item.id, item]));
    assert.equal(registry.schemaVersion, 1);
    assert.deepEqual(sorted(collectionById.keys()), sorted(editorial.collections.map(item => item.id)));
    assert.deepEqual(sorted(Object.keys(registry.works)), sorted([
      ...bank.flatMap(pack => [pack.id + ':sr', pack.id + ':kr']),
      ...wordBank.packs.map(pack => 'word:' + pack.id)
    ]), 'Every actual PDF and independent Word work has an identity');
    for (const collection of editorial.collections) {
      const actual = collectionById.get(collection.id);
      assert.equal(actual.grade, collection.grade);
      assert.equal(actual.bookId, collection.bookId);
      for (const kind of ['sr', 'kr']) {
        assert.deepEqual(actual[kind], collection[kind], 'Published literal order: ' + collection.id + '/' + kind);
        assert.equal(new Set(collection[kind]).size, collection[kind].length, 'No duplicated number identity');
        const expectedMembership = Object.values(registry.works).filter(work => {
          if (work.kind !== kind) return false;
          const pack = byPack.get(work.bankId);
          const word = wordById.get(work.id);
          const workGrades = word ? expandGrades(word.grade) : [...new Set(Object.values(pack.book_grades).flat())];
          if (!workGrades.includes(collection.grade)) return false;
          if (!collection.bookId) return true;
          const book = byBook.get(collection.bookId);
          return book.grades.includes(collection.grade)
            && (pack.book_grades[book.title] || []).includes(collection.grade);
        }).map(item => item.id);
        assert.deepEqual(sorted(collection[kind]), sorted(expectedMembership),
          'Membership independently derived from original sources: ' + collection.id + '/' + kind);
      }
      check();
    }
    const vilenkin5 = editorial.books.find(book => book.title === 'Виленкин и др. Математика. 5 класс. 2023');
    const vilenkin6 = editorial.books.find(book => book.title === 'Виленкин и др. Математика. 6 класс. 2024');
    assert(vilenkin5 && vilenkin6);
    assert.deepEqual(vilenkin5.grades, [5], 'A grade-five edition cannot create a grade-six collection');
    assert.deepEqual(vilenkin6.grades, [6], 'A grade-six edition cannot create a grade-five collection');
    assert(!registry.collections.some(item => item.bookId === vilenkin5.id && item.grade !== 5));
    assert(!registry.collections.some(item => item.bookId === vilenkin6.id && item.grade !== 6));
    const general = n => registry.collections.find(item => item.grade === n && !item.bookId);
    assert(general(7).sr.includes('word:minus-pered-skobkami'));
    assert(!general(7).sr.includes('arith-brackets-like-terms:sr'));
    assert(general(9).sr.includes('word:lineynye-grafiki-oge'));
    assert(!general(9).sr.includes('alg-line:sr'));
    check();
    execFileSync(PYTHON, ['-c', 'import sys; compile(sys.stdin.read(), "numbered_download_validation", "exec")'],
      { input: VALIDATE_PY, encoding: 'utf8' });
    if (process.argv.includes('--check-fixtures')) {
      Object.assign(report, { result: 'FIXTURES_ONLY', fixtureCollections: editorial.collections.length,
        workIdentities: Object.keys(registry.works).length, textbooks: registry.books.length,
        notRun: ['Browser interaction', 'Numbered downloads', 'Rendered document review'] });
      console.log('TEACHER_WORK_NUMBERING_FIXTURES_OK ' + JSON.stringify(report));
      return;
    }

    browser = await chromium.launch({ headless: true,
      executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
    const context = await browser.newContext({ acceptDownloads: true });
    await context.route('https://fonts.googleapis.com/**', route =>
      route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    const requested = [];
    context.on('request', request => requested.push(request.url()));
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => report.pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && !intentionalFailure) report.consoleErrors.push(message.text());
    });
    const ready = async () => page.waitForFunction(() =>
      document.documentElement.dataset.workNumberingReady === 'true');
    const open = async url => {
      // A saved-selection check must execute initialization in a new document.
      // Navigating to the current URL (or only its fragment) can otherwise
      // return no HTTP response and leave the previous in-memory filter state.
      await page.goto('about:blank');
      const response = await page.goto(url, { waitUntil: 'load' });
      assert(response, 'Expected a fresh HTTP navigation: ' + url);
      assert.equal(response.status(), 200);
      await ready();
      const actions = await page.locator('[data-numbered-role],[data-numbered-archive],[data-numbered-pack]')
        .evaluateAll(elements => elements.map(element => ({
          tag: element.tagName, disabled: element.disabled, href: element.getAttribute('href')
        })));
      assert(actions.length > 0 && actions.every(action => action.tag === 'BUTTON' && !action.disabled && action.href === null),
        'Ready numbered actions must be buttons without an unnumbered navigation fallback');
    };
    const select = async collection => {
      await page.locator('#search').fill('');
      await page.locator('#grade').selectOption(collection ? collection.grade + ' класс' : '');
      await page.locator('#book').selectOption(collection?.bookTitle || '');
    };
    const contextsFor = (workId, collections) => {
      const work = registry.works[workId];
      return collections.filter(item => item[work.kind].includes(workId)).map(item => ({
        collectionId: item.id, grade: item.grade, bookTitle: item.bookTitle || null,
        number: item[work.kind].indexOf(workId) + 1
      }));
    };
    const section = workId => page.locator('[data-work-id=' + JSON.stringify(workId) + ']');
    const scopeSnapshot = async () => page.locator('#catalog [data-work-id]:visible').evaluateAll(elements =>
      elements.map(element => ({ id: element.dataset.workId,
        heading: element.querySelector('.work-heading').textContent,
        label: element.querySelector('.work-number-label').textContent })));
    const noOverflow = async label => {
      const dimensions = await page.evaluate(() => ({
        width: window.innerWidth, document: document.documentElement.scrollWidth
      }));
      assert(dimensions.document <= dimensions.width + 1, 'Horizontal overflow: ' + label);
      check();
    };
    const scope = async (collections, label) => {
      const rows = await scopeSnapshot();
      const expected = [...new Set(collections.flatMap(item => [...item.sr, ...item.kr]))];
      assert.deepEqual(sorted(rows.map(item => item.id)), sorted(expected), 'Visible works: ' + label);
      for (const row of rows) {
        const contexts = contextsFor(row.id, collections);
        const numbers = [...row.label.matchAll(/(\d+)\s+класс\s*[—–-]\s*№\s*(\d+)/gu)]
          .map(match => ({ grade: Number(match[1]), number: Number(match[2]) }));
        assert.deepEqual(numbers, contexts.map(item => ({ grade: item.grade, number: item.number })),
          'Visible permanent numbers: ' + label + '/' + row.id);
        if (contexts.length === 1) {
          assert.match(row.heading, new RegExp('№\\s*' + contexts[0].number + '(?:\\s|[·.]|$)'),
            'Work heading number: ' + row.id);
        }
        const runtime = await page.evaluate(id => window.MathExamTeacherNumbering.getContexts(id), row.id);
        assert.deepEqual(runtime.map(item => ({
          collectionId: item.collectionId, grade: item.grade, bookTitle: item.bookTitle || null, number: item.number
        })), contexts, 'Export context agrees with visible permanent numbering');
      }
      if (collections.length === 1) {
        const target = collections[0];
        for (const kind of ['sr', 'kr']) {
          const actual = await page.locator('#numbering-contents .numbering-list[data-kind=' + kind + '] li')
            .evaluateAll(items => items.map(item => ({
              number: item.value, workId: item.querySelector('a').dataset.numberedContents
            })));
          assert.deepEqual(actual, target[kind].map((id, index) => ({ number: index + 1, workId: id })),
            'Independent 1..N contents: ' + label + '/' + kind);
        }
      }
      assert.equal(await page.locator('#empty').isVisible(), expected.length === 0);
      await noOverflow(label);
      check();
    };
    const screenshot = async name => {
      await page.locator('.filters').scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: false });
      report.screenshots.push(name + '.png');
    };

    await page.setViewportSize({ width: 1280, height: 900 });

    // Failure to load either runtime must leave the pre-rendered numbers safe:
    // no ordinary/middle click can download an unnumbered original. These use
    // isolated contexts so expected network errors do not mask real page errors.
    for (const missingScript of ['numbering-catalog.js', 'numbered-downloads.js']) {
      const failureContext = await browser.newContext({ acceptDownloads: true });
      await failureContext.route('https://fonts.googleapis.com/**', route =>
        route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
      await failureContext.route('**/pedagogam/raboty/' + missingScript, route => route.abort('failed'));
      const failurePage = await failureContext.newPage();
      for (const failureURL of [CATALOG, BASE + '/pedagogam/raboty/arith-gcd-lcm/']) {
        const sources = [];
        const downloads = [];
        const observeSource = request => {
          if (/\.(?:pdf|docx|zip)(?:\?|$)/u.test(request.url())) sources.push(request.url());
        };
        const observeDownload = download => downloads.push(download.suggestedFilename());
        failurePage.on('request', observeSource);
        failurePage.on('download', observeDownload);
        await failurePage.goto(failureURL, { waitUntil: 'load' });
        await failurePage.waitForFunction(() => document.getElementById('numbering-download-status').dataset.error === 'true');
        assert.match(await failurePage.locator('#numbering-download-status').innerText(), /недоступно/u);
        assert.equal(await failurePage.locator('#numbering-download-status').isVisible(), true);
        const guarded = await failurePage.locator('[data-numbered-role],[data-numbered-archive],[data-numbered-pack]')
          .evaluateAll(elements => {
            const state = elements.map(element => ({ tag: element.tagName, disabled: element.disabled, href: element.getAttribute('href') }));
            for (const element of elements) {
              element.click();
              element.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, button: 1 }));
            }
            return state;
          });
        assert(guarded.length > 0 && guarded.every(action => action.tag === 'BUTTON' && action.disabled && action.href === null),
          missingScript + ': exports must stay disabled without a raw-file target');
        await failurePage.waitForLoadState('networkidle');
        assert.deepEqual(sources, [], missingScript + ': no unnumbered source request');
        assert.deepEqual(downloads, [], missingScript + ': no unnumbered download');
        assert.equal(failurePage.url(), failureURL, missingScript + ': no alternate navigation');
        failurePage.off('request', observeSource);
        failurePage.off('download', observeDownload);
        check();
      }
      await failureContext.close();
    }

    await open(CATALOG);
    assert.equal(await page.locator('#catalog .pack').count(), bank.length);
    await scope(registry.collections.filter(item => !item.bookId), 'all classes');
    for (const collection of editorial.collections) {
      await select(collection);
      await scope([collectionById.get(collection.id)], collection.id);
      report.collections++;
    }
    assert(!requested.some(url => url.includes('/pedagogam/raboty/vendor/')),
      'Document export libraries must remain lazy until the first download');
    const v6 = registry.collections.find(item => item.grade === 6 && item.bookId === vilenkin6.id);
    assert(v6 && v6.sr.length > 3);
    await select(v6);
    const targetId = v6.sr.find((id, i) => i >= 2 && registry.works[id].format === 'pdf');
    const target = registry.works[targetId];
    const number = v6.sr.indexOf(targetId) + 1;
    const beforeSearch = await section(targetId).locator('.work-number-label').innerText();
    await page.locator('#search').fill(target.title);
    assert(await section(targetId).isVisible());
    assert.equal(await section(targetId).locator('.work-number-label').innerText(), beforeSearch);
    const originalContents = await page.locator('#numbering-contents .numbering-list[data-kind=sr] li')
      .evaluateAll(items => items.map(item => item.value));
    assert.deepEqual(originalContents, v6.sr.map((_, i) => i + 1), 'Search does not compact contents');
    await page.locator('#search').fill('СР ' + number);
    assert(await section(targetId).isVisible(), 'Exact SR number lookup');
    assert.equal(await section(targetId).locator('.work-number-label').innerText(), beforeSearch);
    await page.locator('#search').fill('КР 2');
    assert(await section(v6.kr[1]).isVisible(), 'Independent KR number lookup');
    await page.locator('#search').fill('неттакойтемы159873');
    assert.equal(await page.locator('#catalog .pack:visible').count(), 0);
    await page.locator('#numbering-contents').evaluate(element => { element.open = true; });
    await page.locator('[data-numbered-contents=' + JSON.stringify(targetId) + ']').click();
    assert.equal(await page.locator('#search').inputValue(), '');
    assert.equal(new URL(page.url()).hash, '#' + target.bankId);
    assert.equal(await section(targetId).locator('.work-number-label').innerText(), beforeSearch);
    check();

    let changedPair;
    const bookScopes = registry.collections.filter(item => item.bookId);
    for (const first of bookScopes) {
      if (changedPair) break;
      for (const second of bookScopes) {
        if (second.grade !== first.grade || second.bookId === first.bookId) continue;
        const workId = first.sr.find(id => second.sr.includes(id) && first.sr.indexOf(id) !== second.sr.indexOf(id));
        if (workId) { changedPair = { first, second, workId }; break; }
      }
    }
    assert(changedPair, 'A shared work with distinct textbook numbers is needed for regression');
    for (const collection of [changedPair.first, changedPair.second, changedPair.first]) {
      await select(collection);
      assert.equal(await section(changedPair.workId).locator('.work-number-label').innerText(),
        collection.grade + ' класс — № ' + (collection.sr.indexOf(changedPair.workId) + 1));
    }
    report.textbookSwitch = { workId: changedPair.workId,
      first: { id: changedPair.first.id, number: changedPair.first.sr.indexOf(changedPair.workId) + 1 },
      second: { id: changedPair.second.id, number: changedPair.second.sr.indexOf(changedPair.workId) + 1 } };
    check();

    for (const invalid of [{ grade: 6, bookTitle: vilenkin5.title }, { grade: 5, bookTitle: vilenkin6.title }]) {
      await select(invalid);
      await scope([], 'unsupported ' + invalid.grade + '/' + invalid.bookTitle);
    }
    await select(general(7));
    assert(await section('word:minus-pered-skobkami').isVisible());
    assert(!(await section('arith-brackets-like-terms:sr').isVisible()));
    assert(!(await page.locator('#arith-brackets-like-terms [data-numbered-pack]').isVisible()),
      'Word-only grade-seven card must not offer an empty PDF archive');
    await select(general(9));
    assert(await section('word:lineynye-grafiki-oge').isVisible());
    assert(!(await section('alg-line:sr').isVisible()));
    assert(!(await page.locator('#alg-line [data-numbered-pack]').isVisible()),
      'Word-only grade-nine card must not offer an empty PDF archive');
    check();

    await select(v6);
    await page.locator('#search').fill('СР ' + number);
    await page.evaluate(id => { location.hash = id; }, target.bankId);
    const savedURL = page.url();
    assert.equal(new URL(savedURL).searchParams.get('grade'), '6');
    assert.equal(new URL(savedURL).searchParams.get('book'), vilenkin6.id);
    await open(savedURL);
    assert.equal(await page.locator('#grade').inputValue(), '6 класс');
    assert.equal(await page.locator('#book').inputValue(), vilenkin6.title);
    assert.equal(await page.locator('#search').inputValue(), 'СР ' + number);
    assert.equal(await section(targetId).locator('.work-number-label').innerText(), beforeSearch);
    await page.getByRole('button', { name: 'Сбросить фильтры', exact: true }).click();
    assert.equal(await page.locator('#grade').inputValue(), '');
    assert.equal(await page.locator('#book').inputValue(), '');
    assert.equal(await page.locator('#search').inputValue(), '');
    await scope(registry.collections.filter(item => !item.bookId), 'reset');
    check();

    const longest = [...registry.collections.filter(item => item.bookId)]
      .sort((a, b) => b.bookTitle.length - a.bookTitle.length)[0];
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await select(v6);
      await scope([v6], width + ' Vilenkin6');
      await screenshot('numbering-vilenkin6-' + width);
      await select(longest);
      await scope([longest], width + ' longest textbook');
      await screenshot('numbering-longest-book-' + width);
      await page.locator('#search').fill('неттакойтемы159873');
      assert(await page.locator('#empty').isVisible());
      await noOverflow(width + ' empty');
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    await select(v6);
    await page.locator('#numbering-contents').evaluate(element => { element.open = true; });
    await screenshot('numbering-vilenkin6-1280');

    const saved = [];
    const saveDownload = async (locator, label, metadata) => {
      const [download] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), locator.click()]);
      assert.equal(await download.failure(), null, label + ' browser download');
      const filename = String(saved.length + 1).padStart(2, '0') + '-' + label + path.extname(download.suggestedFilename());
      await download.saveAs(path.join(OUT, filename));
      await page.waitForFunction(() =>
        document.getElementById('numbering-download-status').getAttribute('aria-busy') === 'false');
      assert.equal(await page.locator('#numbering-download-status').getAttribute('data-error'), 'false',
        label + ' reported export error');
      saved.push({ filename, ...metadata });
      report.downloads.push({ filename, suggestedFilename: download.suggestedFilename() });
      check();
    };
    const topicWorkId = 'arith-gcd-lcm:sr';
    assert(v6.sr.includes(topicWorkId), 'Known grade-six topic guide fixture');
    const topicWork = registry.works[topicWorkId];
    const topicLink = page.locator('#' + topicWork.bankId + ' a')
      .filter({ hasText: 'Описание работы' });
    const topicURL = new URL(await topicLink.getAttribute('href'), CATALOG);
    assert.equal(topicURL.searchParams.get('grade'), '6', 'Topic link preserves class');
    assert.equal(topicURL.searchParams.get('book'), vilenkin6.id, 'Topic link preserves textbook');
    const allGuideLinks = await page.locator('a').evaluateAll((links, bankId) => links
      .map(link => new URL(link.href)).filter(url => url.pathname === '/pedagogam/raboty/' + bankId + '/')
      .map(url => ({ grade: url.searchParams.get('grade'), book: url.searchParams.get('book') })), topicWork.bankId);
    assert(allGuideLinks.length >= 2, 'Both the top guide list and the topic card have links');
    assert(allGuideLinks.every(link => link.grade === '6' && link.book === vilenkin6.id),
      'Every applicable description link carries the selected collection');
    await Promise.all([page.waitForURL(url => url.pathname === '/pedagogam/raboty/' + topicWork.bankId + '/'),
      topicLink.click()]);
    await ready();
    const topicContexts = await page.evaluate(id => window.MathExamTeacherNumbering.getContexts(id), topicWorkId);
    assert.deepEqual(topicContexts.map(item => ({
      collectionId: item.collectionId, grade: item.grade, bookTitle: item.bookTitle || null, number: item.number
    })), contextsFor(topicWorkId, [v6]), 'Catalog and topic page keep the same collection number');
    assert.equal(await section(topicWorkId).locator('.work-number-label').innerText(),
      '6 класс — № ' + (v6.sr.indexOf(topicWorkId) + 1));
    await saveDownload(section(topicWorkId).locator('[data-numbered-role=student]'),
      'topic-context', { type: 'pdf', work: topicWork, role: 'student', contexts: contextsFor(topicWorkId, [v6]) });
    const returnLink = page.getByRole('link', { name: 'К этому комплекту в выбранной подборке', exact: true });
    const returnURL = new URL(await returnLink.getAttribute('href'), CATALOG);
    assert.equal(returnURL.searchParams.get('grade'), '6', 'Return link preserves class');
    assert.equal(returnURL.searchParams.get('book'), vilenkin6.id, 'Return link preserves textbook');
    await Promise.all([page.waitForURL(url => url.pathname === '/pedagogam/raboty/'), returnLink.click()]);
    await ready();
    assert.equal(await page.locator('#grade').inputValue(), '6 класс');
    assert.equal(await page.locator('#book').inputValue(), vilenkin6.title);
    assert.equal(await section(topicWorkId).locator('.work-number-label').innerText(),
      '6 класс — № ' + (v6.sr.indexOf(topicWorkId) + 1));
    await open(BASE + '/pedagogam/raboty/arith-fraction-add-subtract/?grade=5');
    assert.match(await page.locator('[data-numbered-grade-label]').innerText(), /^5 класс/u);
    assert(!/6 класс/u.test(await page.locator('[data-numbered-title]').innerText()),
      'The active topic title must not imply the wrong selected class');
    assert.match(await page.locator('#numbering-topic-note').innerText(), /5 класс/u);
    assert.equal(await section('arith-fraction-add-subtract:sr').locator('.work-number-label').innerText(),
      '5 класс — № ' + (general(5).sr.indexOf('arith-fraction-add-subtract:sr') + 1));
    await open(CATALOG);
    await select(v6);
    for (const workId of [targetId, target.bankId + ':kr']) {
      const work = registry.works[workId];
      for (const role of ['student', 'teacher']) {
        await saveDownload(section(workId).locator('[data-numbered-role=' + role + ']'),
          'book-' + work.kind + '-' + role, { type: 'pdf', work, role, contexts: contextsFor(workId, [v6]) });
      }
    }
    await page.evaluate(() => {
      const status = document.getElementById('numbering-download-status');
      window.__numberingProgressEvidence = [];
      window.__numberingProgressObserver = new MutationObserver(() => {
        window.__numberingProgressEvidence.push(status.textContent);
      });
      window.__numberingProgressObserver.observe(status, { childList: true, subtree: true, characterData: true });
    });
    await saveDownload(page.locator('#' + target.bankId + ' [data-numbered-pack]'),
      'book-topic-archive', { type: 'zip', entries: [targetId, target.bankId + ':kr']
        .flatMap(id => ['student', 'teacher'].map(role => ({
          work: registry.works[id], role, contexts: contextsFor(id, [v6])
        }))) });
    const archiveProgress = await page.evaluate(() => {
      window.__numberingProgressObserver.disconnect();
      return window.__numberingProgressEvidence;
    });
    assert(archiveProgress.some(message => /[1-4] из 4 файлов/u.test(message)),
      'Archive progress must advance beyond zero before completion');
    report.archiveProgress = archiveProgress.filter(message => message.includes('из 4'));
    await select(longest);
    const longestWorkId = longest.kr.find(id => registry.works[id].format === 'pdf');
    await saveDownload(section(longestWorkId).locator('[data-numbered-role=student]'),
      'longest-textbook', { type: 'pdf', work: registry.works[longestWorkId], role: 'student',
        contexts: contextsFor(longestWorkId, [longest]) });
    await select(null);
    const shared = Object.values(registry.works).find(work => work.format === 'pdf'
      && work.kind === 'sr' && contextsFor(work.id, registry.collections.filter(item => !item.bookId)).length > 1);
    assert(shared);
    await saveDownload(section(shared.id).locator('[data-numbered-role=student]'),
      'shared-grades', { type: 'pdf', work: shared, role: 'student',
        contexts: contextsFor(shared.id, registry.collections.filter(item => !item.bookId)) });

    for (const workId of wordById.keys()) {
      const work = registry.works[workId];
      const preferredGrade = workId === 'word:minus-pered-skobkami' ? 7
        : workId === 'word:lineynye-grafiki-oge' ? 9 : 7;
      const candidates = registry.collections.filter(item => item.grade === preferredGrade && item.sr.includes(workId));
      const chosen = workId === 'word:summa-uglov-treugolnika'
        ? [...candidates].sort((a, b) => (b.bookTitle || '').length - (a.bookTitle || '').length)[0]
        : general(preferredGrade);
      await select(chosen);
      for (const role of ['student', 'teacher']) {
        await saveDownload(section(workId).locator('[data-numbered-role=' + role + ']'),
          'word-' + workId.slice(5) + '-' + role, { type: 'docx', work, role,
            contexts: contextsFor(workId, [chosen]) });
      }
    }
    await select(general(9));
    const gradeNineWordId = 'word:lineynye-grafiki-oge';
    await saveDownload(page.locator('[data-numbered-archive=docx]'), 'grade-nine-word-archive', {
      type: 'zip', entries: [
        ...['student', 'teacher'].map(role => ({
          work: registry.works[gradeNineWordId], role,
          contexts: contextsFor(gradeNineWordId, [general(9)])
        })),
        { unchanged: true, url: '/pedagogam/raboty/rabota-nad-oshibkami.docx',
          filename: 'rabota-nad-oshibkami.docx' }
      ]
    });

    // Failed source requests must produce a visible error, never an original
    // unnumbered download; the next click must recover with the same number.
    await select(v6);
    const retryId = v6.sr.find(id => registry.works[id].format === 'pdf' && id !== targetId);
    const retryWork = registry.works[retryId];
    const retryURL = new URL(retryWork.studentUrl, CATALOG).href;
    let unexpectedDownloads = 0;
    const countUnexpected = () => { unexpectedDownloads++; };
    const failSource = route => route.fulfill({ status: 503, contentType: 'text/plain', body: 'Intentional test failure' });
    await page.route(retryURL, failSource);
    page.on('download', countUnexpected);
    intentionalFailure = true;
    await section(retryId).locator('[data-numbered-role=student]').click();
    await page.waitForFunction(() => {
      const status = document.getElementById('numbering-download-status');
      return status.dataset.error === 'true' && status.getAttribute('aria-busy') === 'false';
    });
    assert.match(await page.locator('#numbering-download-status').innerText(), /Не удалось/u);
    assert.equal(unexpectedDownloads, 0, 'No silent unnumbered fallback after export failure');
    page.off('download', countUnexpected);
    await page.unroute(retryURL, failSource);
    intentionalFailure = false;
    await saveDownload(section(retryId).locator('[data-numbered-role=student]'),
      'retry-after-error', { type: 'pdf', work: retryWork, role: 'student',
        contexts: contextsFor(retryId, [v6]) });
    check();

    fs.writeFileSync(path.join(OUT, 'numbered-downloads.json'), JSON.stringify(saved, null, 2) + '\n');
    const validation = execFileSync(PYTHON, ['-c', VALIDATE_PY, ROOT, OUT], { encoding: 'utf8', maxBuffer: 1024 * 1024 });
    report.deliveredByteValidation = JSON.parse(validation.trim());
    assert.equal(report.deliveredByteValidation.result, 'PASS');
    assert.deepEqual(report.pageErrors, [], 'Uncaught page errors');
    assert.deepEqual(report.consoleErrors, [], 'Unexpected browser console errors');
    report.result = 'PASS';
    report.workIdentities = Object.keys(registry.works).length;
    report.textbooks = registry.books.length;
    report.scopeCorrections = registry.corrections?.length || 0;
    report.widths = [320, 390, 1280];
    await context.close();
  } catch (error) {
    report.result = 'FAIL';
    report.error = String(error.stack || error).replaceAll(ROOT, '<repo>').replaceAll(OUT, '<artifacts>');
    throw error;
  } finally {
    fs.writeFileSync(path.join(OUT, 'teacher-work-numbering-browser.json'), JSON.stringify(report, null, 2) + '\n');
    if (browser) await browser.close();
  }
  console.log('TEACHER_WORK_NUMBERING_BROWSER_OK ' + JSON.stringify(report));
}

main().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
