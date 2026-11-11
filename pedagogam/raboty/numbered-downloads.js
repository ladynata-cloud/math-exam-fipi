/*
 * Numbered copies of the reviewed MathExam worksheets.
 * The original exercise files are read-only. Only the reserved PDF heading
 * areas and DOCX subtitle/footer/metadata are changed for a chosen collection.
 * Libraries and fonts are loaded from this site only when a download starts.
 */
(function (global) {
  'use strict';

  const ROOT = '/pedagogam/raboty/';
  const VENDOR = ROOT + 'vendor/';
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const DC = 'http://purl.org/dc/elements/1.1/';
  const MIME = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    zip: 'application/zip'
  };
  const scriptLoads = new Map();
  const fontLoads = new Map();
  const MAX_SOURCE_BYTES = 6 * 1024 * 1024;
  const ARCHIVE_STAMP = new Date('2026-11-07T00:00:00Z');

  function fail(message) {
    throw new Error(message);
  }

  function text(value, maximum, field) {
    if (typeof value !== 'string' || !value.trim() || value.length > maximum || /[\u0000-\u001f\u007f]/.test(value)) {
      fail('Некорректное поле для нумерации: ' + field + '.');
    }
    return value.trim().replace(/\s+/g, ' ');
  }

  function validate(work, rawContexts, format) {
    if (!work || !/^[a-z0-9:-]+$/.test(work.id || '') || !/^[a-z0-9-]+$/.test(work.bankId || '') ||
        !['sr', 'kr'].includes(work.kind) || !['pdf', 'docx'].includes(work.format) ||
        (format && work.format !== format) || (work.format === 'docx' && work.kind !== 'sr')) {
      fail('Работа не поддерживает выбранный формат скачивания.');
    }
    text(work.title, 300, 'тема');
    if (!Array.isArray(work.grades) || !work.grades.length ||
        !work.grades.every(grade => Number.isInteger(grade) && grade >= 5 && grade <= 11)) {
      fail('Для работы не указаны проверенные классы.');
    }
    if (!Array.isArray(rawContexts) || !rawContexts.length || rawContexts.length > 7) {
      fail('Выберите класс и учебник для нумерации работы.');
    }
    const seen = new Set();
    const contexts = rawContexts.map(context => {
      if (!context || !Number.isInteger(context.grade) || !work.grades.includes(context.grade) ||
          !Number.isInteger(context.number) || context.number < 1 || context.number > 9999 ||
          !/^[a-z0-9-]{1,100}$/.test(context.collectionId || '') || seen.has(context.grade)) {
        fail('Не удалось однозначно определить номер работы в выбранной подборке.');
      }
      seen.add(context.grade);
      return {
        grade: context.grade,
        number: context.number,
        collectionId: context.collectionId,
        bookTitle: context.bookTitle == null ? null : text(context.bookTitle, 400, 'учебник')
      };
    }).sort((left, right) => left.grade - right.grade);
    if (new Set(contexts.map(context => context.bookTitle)).size !== 1) {
      fail('Для одного файла выберите один учебник или общую подборку.');
    }
    return contexts;
  }

  function kindName(work) {
    return work.kind === 'sr' ? 'Самостоятельная работа' : 'Контрольная работа';
  }

  function contextText(contexts) {
    return contexts.map(context => `${context.grade} класс: № ${context.number}`).join('; ');
  }

  function bookText(contexts) {
    return contexts[0].bookTitle ? 'Учебник: ' + contexts[0].bookTitle : 'Общая подборка MathExam по классам';
  }

  function heading(work, contexts) {
    return kindName(work) + (contexts.length === 1 ? ' № ' + contexts[0].number : '');
  }

  function roleName(role) {
    if (role === 'student') return 'Задания';
    if (role === 'teacher') return 'Ответы и решения';
    fail('Неизвестный вид файла: нужны задания или ответы.');
  }

  function sourceUrl(work, role) {
    roleName(role);
    const raw = role === 'student' ? work.studentUrl : work.teacherUrl;
    if (typeof raw !== 'string') fail('Для работы отсутствует ссылка на файл.');
    const url = new URL(raw, global.location.href);
    const expectedBase = ROOT + work.bankId + '/';
    if (url.origin !== global.location.origin || url.username || url.password || url.search || url.hash ||
        !url.pathname.startsWith(expectedBase) ||
        !/^[a-z0-9-]+\.(pdf|docx)$/.test(url.pathname.slice(expectedBase.length)) ||
        !url.pathname.endsWith('.' + work.format)) {
      fail('Ссылка на работу не принадлежит каталогу MathExam.');
    }
    if (work.format === 'pdf') {
      const expectedName = (work.kind === 'sr' ? 'samostoyatelnaya' : 'kontrolnaya') +
        (role === 'teacher' ? '-otvety' : '') + '.pdf';
      if (url.pathname !== expectedBase + expectedName) fail('Вид PDF не соответствует работе.');
    }
    return url.href;
  }

  async function read(url, options) {
    const response = await global.fetch(url, {
      mode: 'same-origin', credentials: 'omit', redirect: 'error', signal: options && options.signal
    });
    if (!response.ok) fail('Не удалось загрузить файл работы. Попробуйте скачать его ещё раз.');
    const advertised = Number(response.headers.get('content-length'));
    if (advertised > MAX_SOURCE_BYTES) fail('Файл превышает допустимый размер для этой работы.');
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_SOURCE_BYTES) fail('Получен пустой или слишком большой файл работы.');
    return bytes;
  }

  function script(filename, globalName, predicate) {
    const src = VENDOR + filename;
    if (predicate(global[globalName])) return Promise.resolve(global[globalName]);
    if (!scriptLoads.has(src)) {
      const pending = new Promise((resolve, reject) => {
        const element = global.document.createElement('script');
        element.src = src;
        element.async = true;
        element.onload = () => {
          if (predicate(global[globalName])) resolve(global[globalName]);
          else reject(new Error('Не удалось подготовить скачивание файла. Обновите страницу и повторите попытку.'));
        };
        element.onerror = () => {
          element.remove();
          reject(new Error('Не удалось загрузить средства скачивания. Проверьте соединение и повторите попытку.'));
        };
        global.document.head.appendChild(element);
      }).catch(error => {
        scriptLoads.delete(src);
        throw error;
      });
      scriptLoads.set(src, pending);
    }
    return scriptLoads.get(src);
  }

  function fontBytes(name) {
    if (!fontLoads.has(name)) {
      fontLoads.set(name, read(VENDOR + name).catch(error => {
        fontLoads.delete(name);
        throw error;
      }));
    }
    return fontLoads.get(name);
  }

  async function pdfTools() {
    const [lib, kit, normal, bold] = await Promise.all([
      script('pdf-lib-1.17.1.min.js', 'PDFLib', value => !!(value && value.PDFDocument)),
      script('fontkit-1.1.1.min.js', 'fontkit', value => !!(value && value.create)),
      fontBytes('MathExamSans.ttf'),
      fontBytes('MathExamSans-Bold.ttf')
    ]);
    return { lib, kit, normal, bold };
  }

  function zipTools() {
    return script('jszip-3.10.1.min.js', 'JSZip', value => typeof value === 'function');
  }

  function fittedLine(value, font, preferred, minimum, width) {
    let size = preferred;
    while (font.widthOfTextAtSize(value, size) > width && size >= minimum + 0.1) size -= 0.1;
    if (font.widthOfTextAtSize(value, size) > width) fail('Подпись слишком длинная. Выберите один класс для скачивания.');
    return size;
  }

  function wrapped(value, font, preferred, minimum, width, maxLines) {
    for (let size = preferred; size >= minimum; size -= 0.25) {
      const lines = [];
      let line = '';
      let tooWide = false;
      for (const word of value.split(' ')) {
        if (font.widthOfTextAtSize(word, size) > width) { tooWide = true; break; }
        const candidate = line ? line + ' ' + word : word;
        if (font.widthOfTextAtSize(candidate, size) <= width) line = candidate;
        else { lines.push(line); line = word; }
      }
      if (line) lines.push(line);
      if (!tooWide && lines.length <= maxLines) return { lines, size };
    }
    fail('Название учебника не помещается в заголовок скачиваемой работы.');
  }

  function byteArray(bytes) {
    if (bytes instanceof Uint8Array) return bytes;
    if (bytes instanceof ArrayBuffer) return new Uint8Array(bytes);
    fail('Не удалось прочитать исходный файл работы.');
  }

  async function pdf(bytes, work, rawContexts) {
    const contexts = validate(work, rawContexts, 'pdf');
    const input = byteArray(bytes);
    if (new TextDecoder('ascii').decode(input.subarray(0, 5)) !== '%PDF-') fail('Вместо PDF получен другой файл.');
    const { lib, kit, normal, bold } = await pdfTools();
    const document = await lib.PDFDocument.load(input, { updateMetadata: false });
    if (document.getPageCount() !== 4) fail('Структура исходной работы изменилась. Нумерация требует проверки.');
    for (const page of document.getPages()) {
      const size = page.getSize();
      if (Math.abs(size.width - 595.276) > 0.2 || Math.abs(size.height - 841.89) > 0.2 ||
          page.getRotation().angle % 360 !== 0) {
        fail('Формат страниц исходной работы изменился. Нумерация требует проверки.');
      }
    }
    document.registerFontkit(kit);
    const regularFont = await document.embedFont(normal, { subset: true });
    const boldFont = await document.embedFont(bold, { subset: true });
    const brand = 'MathExam · ' + contextText(contexts);
    const book = bookText(contexts);
    const supported = new Set(regularFont.getCharacterSet());
    const visibleText = brand + book + heading(work, contexts) + ' · Вариант 1234';
    if ([...visibleText].some(character => !supported.has(character.codePointAt(0)))) {
      fail('В подписи учебника есть символ, который нельзя напечатать выбранным шрифтом.');
    }
    const brandSize = fittedLine(brand, regularFont, 8.25, 6.75, 509);
    const bookLines = wrapped(book, regularFont, 8, 6.5, 509, 2);
    const ink = lib.rgb(0.125, 0.208, 0.176);
    for (const [index, page] of document.getPages().entries()) {
      // These rectangles end before the topic title at top-origin y~96.
      // They never cover exercise text, answer text, graphs or writing space.
      page.drawRectangle({ x: 40, y: 751, width: 515, height: 34, color: lib.rgb(1, 1, 1) });
      page.drawRectangle({ x: 40, y: 789, width: 515, height: 39, color: lib.rgb(1, 1, 1) });
      page.drawText(brand, { x: 43, y: 817, size: brandSize, font: regularFont, color: ink });
      for (const [line, value] of bookLines.lines.entries()) {
        page.drawText(value, { x: 43, y: 804 - line * 10, size: bookLines.size, font: regularFont, color: ink });
      }
      const title = heading(work, contexts) + ' · Вариант ' + (index + 1);
      const titleSize = fittedLine(title, boldFont, 15.5, 12.5, 509);
      page.drawText(title, { x: 43, y: 761, size: titleSize, font: boldFont, color: ink });
    }
    document.setTitle(`${heading(work, contexts)}. ${work.title}. ${contextText(contexts)}`);
    document.setSubject(`${book}. ${contextText(contexts)}. Четыре варианта.`);
    return document.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 40 });
  }

  function xml(value, rootName, namespace) {
    if (/<!DOCTYPE/i.test(value)) fail('Исходный Word-файл содержит неподдерживаемую XML-структуру.');
    const document = new DOMParser().parseFromString(value, 'application/xml');
    if (document.getElementsByTagName('parsererror').length ||
        document.documentElement.localName !== rootName || document.documentElement.namespaceURI !== namespace) {
      fail('Не удалось прочитать структуру Word-файла.');
    }
    return document;
  }

  function serialize(document) {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      new XMLSerializer().serializeToString(document.documentElement);
  }

  function wElement(document, name, attributes) {
    const element = document.createElementNS(W, 'w:' + name);
    for (const [key, value] of Object.entries(attributes || {})) element.setAttributeNS(W, 'w:' + key, value);
    return element;
  }

  function replaceParagraph(paragraph, value, halfPoints, lines) {
    const document = paragraph.ownerDocument;
    for (const child of [...paragraph.childNodes]) {
      if (!(child.nodeType === 1 && child.namespaceURI === W && child.localName === 'pPr')) child.remove();
    }
    const run = wElement(document, 'r');
    const properties = wElement(document, 'rPr');
    properties.appendChild(wElement(document, 'rFonts', { ascii: 'DejaVu Sans', hAnsi: 'DejaVu Sans' }));
    properties.appendChild(wElement(document, 'sz', { val: String(halfPoints) }));
    properties.appendChild(wElement(document, 'szCs', { val: String(halfPoints) }));
    properties.appendChild(wElement(document, 'color', { val: '000000' }));
    // The source Subtitle style expands tracking by 0.75 pt per character.
    // Reset that tracking so the numbered teacher subtitle stays on one line
    // at the existing 11-point size and does not move the worksheet body.
    properties.appendChild(wElement(document, 'spacing', { val: '0' }));
    run.appendChild(properties);
    for (const [index, line] of (lines || [value]).entries()) {
      if (index) run.appendChild(wElement(document, 'br'));
      const content = wElement(document, 't');
      content.textContent = line;
      run.appendChild(content);
    }
    paragraph.appendChild(run);
  }

  function sourceMember(zip, name) {
    const entry = zip.file(name);
    if (!entry) fail('В Word-файле отсутствует обязательная часть: ' + name + '.');
    return entry.async('string');
  }

  function setMetadata(document, localName, value) {
    let element = document.getElementsByTagNameNS(DC, localName)[0];
    if (!element) {
      element = document.createElementNS(DC, 'dc:' + localName);
      document.documentElement.appendChild(element);
    }
    element.textContent = value;
  }

  async function docx(bytes, work, rawContexts) {
    const contexts = validate(work, rawContexts, 'docx');
    const input = byteArray(bytes);
    if (input[0] !== 80 || input[1] !== 75) fail('Вместо Word-файла получен другой файл.');
    const Zip = await zipTools();
    const archive = await Zip.loadAsync(input, { checkCRC32: true });
    const members = Object.values(archive.files);
    if (members.length > 150 || members.some(member => member.unsafeOriginalName && member.unsafeOriginalName !== member.name)) {
      fail('Исходный Word-файл содержит неподдерживаемый архив.');
    }
    const [bodySource, footerSource, coreSource] = await Promise.all([
      sourceMember(archive, 'word/document.xml'),
      sourceMember(archive, 'word/footer1.xml'),
      sourceMember(archive, 'docProps/core.xml')
    ]);
    const body = xml(bodySource, 'document', W);
    const paragraphs = [...body.getElementsByTagNameNS(W, 'p')];
    const subtitles = paragraphs.filter(paragraph => {
      const style = paragraph.getElementsByTagNameNS(W, 'pStyle')[0];
      return style && style.getAttributeNS(W, 'val') === 'Subtitle';
    });
    if (subtitles.length !== 4) fail('Структура вариантов Word-файла изменилась. Нумерация требует проверки.');
    const oldSubtitles = subtitles.map(paragraph => [...paragraph.getElementsByTagNameNS(W, 't')].map(node => node.textContent).join(''));
    if (new Set(oldSubtitles).size !== 1 ||
        !['Самостоятельная работа', 'Ответы и решения для учителя'].includes(oldSubtitles[0])) {
      fail('Исходный Word-файл не соответствует проверенному шаблону работы.');
    }
    const teacher = oldSubtitles[0] === 'Ответы и решения для учителя';
    const shortNumbers = contexts.map(context => `${context.grade} кл. № ${context.number}`).join('; ');
    const subtitle = heading(work, contexts) + (contexts.length > 1 ? ' · ' + shortNumbers : '') +
      (teacher ? ' · Ответы и решения' : '');
    if (subtitle.length > 110) fail('Для этой Word-работы выберите один класс перед скачиванием.');
    for (const paragraph of subtitles) replaceParagraph(paragraph, subtitle, subtitle.length > 95 ? 20 : 22);

    const footer = xml(footerSource, 'ftr', W);
    const footerParagraphs = [...footer.getElementsByTagNameNS(W, 'p')];
    if (footerParagraphs.length !== 1) fail('Нижний колонтитул Word-файла требует проверки.');
    const footerParagraph = footerParagraphs[0];
    let paragraphProperties = footerParagraph.getElementsByTagNameNS(W, 'pPr')[0];
    if (!paragraphProperties) {
      paragraphProperties = wElement(footer, 'pPr');
      footerParagraph.insertBefore(paragraphProperties, footerParagraph.firstChild);
    }
    let spacing = paragraphProperties.getElementsByTagNameNS(W, 'spacing')[0];
    if (!spacing) { spacing = wElement(footer, 'spacing'); paragraphProperties.appendChild(spacing); }
    for (const [key, value] of Object.entries({ before: '0', after: '0', line: '160', lineRule: 'exact' })) {
      spacing.setAttributeNS(W, 'w:' + key, value);
    }
    // Two short footer lines fit the existing 0.6-inch bottom margin.
    // The complete book title is retained; the current verified titles are
    // at most 130 characters and fit the second line at 6-point DejaVu Sans.
    const selectedBook = bookText(contexts);
    if (selectedBook.length > 155) fail('Название учебника не помещается в колонтитул Word-файла.');
    replaceParagraph(footerParagraph, '', 12, ['MathExam · ' + contextText(contexts), selectedBook]);

    const core = xml(coreSource, 'coreProperties', 'http://schemas.openxmlformats.org/package/2006/metadata/core-properties');
    setMetadata(core, 'title', `${heading(work, contexts)}. ${work.title}. ${contextText(contexts)}`);
    setMetadata(core, 'subject', `${selectedBook}. ${contextText(contexts)}. ${teacher ? 'Ответы и решения' : 'Задания'}.`);
    for (const [name, document] of [['word/document.xml', body], ['word/footer1.xml', footer], ['docProps/core.xml', core]]) {
      const original = archive.file(name);
      archive.file(name, serialize(document), { date: original.date, createFolders: false });
    }
    return archive.generateAsync({ type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  }

  function stableTag(value) {
    let hash = 2166136261;
    for (const character of value) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0;
    return hash.toString(16).padStart(8, '0');
  }

  function filename(work, role, rawContexts) {
    const contexts = validate(work, rawContexts);
    roleName(role);
    const collection = contexts.length === 1 ? contexts[0].collectionId :
      'klassy-' + contexts.map(context => context.grade).join('-') + '-' + stableTag(contexts.map(context => context.collectionId).join('|'));
    const numbers = contexts.length === 1 ? String(contexts[0].number).padStart(2, '0') :
      contexts.map(context => context.grade + '-' + context.number).join('_');
    return `${collection}_${work.kind}-${numbers}_${work.bankId}${work.format === 'docx' ? '_word' : ''}_${role === 'student' ? 'zadaniya' : 'otvety'}.${work.format}`;
  }

  async function create(work, role, rawContexts, options) {
    const contexts = validate(work, rawContexts);
    const bytes = await read(sourceUrl(work, role), options);
    if (options && options.signal && options.signal.aborted) throw new DOMException('Скачивание отменено.', 'AbortError');
    return work.format === 'pdf' ? pdf(bytes, work, contexts) : docx(bytes, work, contexts);
  }

  function save(bytes, name, mime) {
    if (typeof name !== 'string' || !/^[a-z0-9_.-]{1,240}$/i.test(name)) fail('Не удалось определить имя скачиваемого файла.');
    const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
    const anchor = global.document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    anchor.hidden = true;
    global.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    global.setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  async function download(work, role, rawContexts, options) {
    const contexts = validate(work, rawContexts);
    const bytes = await create(work, role, contexts, options);
    const name = filename(work, role, contexts);
    if (options && options.signal && options.signal.aborted) throw new DOMException('Скачивание отменено.', 'AbortError');
    save(bytes, name, MIME[work.format]);
    return { filename: name, bytes: bytes.length };
  }

  function progressNotify(callback, state) {
    if (callback != null && typeof callback !== 'function') fail('Некорректный обработчик скачивания архива.');
    if (callback) callback(state);
  }

  async function archiveBytes(rawEntries, progress, options) {
    if (!Array.isArray(rawEntries) || !rawEntries.length || rawEntries.length > 1000) fail('Выберите работы для архива.');
    const seen = new Set();
    const entries = rawEntries.map(entry => {
      if (!entry) fail('В подборке отсутствует описание работы.');
      let name;
      if (entry.unchanged === true) {
        if (entry.url !== ROOT + 'rabota-nad-oshibkami.docx' || entry.filename !== 'rabota-nad-oshibkami.docx') {
          fail('Этот дополнительный файл нельзя включить в подборку.');
        }
        name = entry.filename;
      } else {
        const contexts = validate(entry.work, entry.contexts);
        sourceUrl(entry.work, entry.role);
        name = filename(entry.work, entry.role, contexts);
        entry = { work: { ...entry.work }, role: entry.role, contexts };
      }
      if (seen.has(name)) fail('Одна и та же работа добавлена в архив дважды.');
      seen.add(name);
      return { ...entry, filename: name };
    });
    const Zip = await zipTools();
    const zip = new Zip();
    const description = ['MathExam. Самостоятельные и контрольные работы', '',
      'Номер относится к классу и выбранному учебнику. В общей подборке по классу действует отдельная нумерация.',
      'Номера вариантов 1–4 внутри каждой работы сохранены. Задания и ответы находятся в отдельных файлах.', '', 'Состав архива', ''];
    progressNotify(progress, { phase: 'numbering', completed: 0, total: entries.length, percent: 0 });
    for (const [index, entry] of entries.entries()) {
      if (options && options.signal && options.signal.aborted) throw new DOMException('Скачивание отменено.', 'AbortError');
      const bytes = entry.unchanged ? await read(entry.url, options) : await create(entry.work, entry.role, entry.contexts, options);
      zip.file(entry.filename, bytes, { date: ARCHIVE_STAMP, createFolders: false });
      description.push(entry.filename);
      if (entry.unchanged) description.push('  Пустой лист работы над ошибками.');
      else description.push(`  ${heading(entry.work, entry.contexts)}. ${entry.work.title}. ${roleName(entry.role)}.`,
        '  ' + contextText(entry.contexts), '  ' + bookText(entry.contexts));
      description.push('');
      progressNotify(progress, { phase: 'numbering', completed: index + 1, total: entries.length,
        percent: Math.round((index + 1) / entries.length * 90) });
      await new Promise(resolve => global.setTimeout(resolve, 0));
    }
    zip.file('README.txt', '\ufeff' + description.join('\r\n'), { date: ARCHIVE_STAMP, createFolders: false });
    const result = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 6 } }, state => {
      if (options && options.signal && options.signal.aborted) throw new DOMException('Скачивание отменено.', 'AbortError');
      progressNotify(progress, { phase: 'packing', completed: entries.length, total: entries.length,
        percent: 90 + Math.round(state.percent / 10) });
    });
    return result;
  }

  async function archive(entries, name, progress, options) {
    if (typeof name !== 'string' || !/^[a-z0-9_.-]{1,235}\.zip$/i.test(name)) fail('Не удалось определить имя архива.');
    const bytes = await archiveBytes(entries, progress, options);
    if (options && options.signal && options.signal.aborted) throw new DOMException('Скачивание отменено.', 'AbortError');
    save(bytes, name, MIME.zip);
    return { filename: name, bytes: bytes.length };
  }

  global.MathExamNumberedDownloads = Object.freeze({ pdf, docx, create, download, archiveBytes, archive, filename });
})(window);
