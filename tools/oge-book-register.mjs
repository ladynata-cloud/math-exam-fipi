// Author the user-facing audit workbook from the independently collected JSON.
// Run with the primary artifact runtime; no repository dependencies are changed.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {Workbook, SpreadsheetFile, FileBlob} from '@oai/artifact-tool';

const [inputPath, outputDir, previewDir, templatePath] = process.argv.slice(2);
if (!inputPath || !outputDir || !previewDir) throw new Error('Usage: node oge-book-register.mjs INPUT_JSON OUTPUT_DIR PREVIEW_DIR [EXISTING_XLSX]');
const data = JSON.parse(await fs.readFile(inputPath, 'utf8'));
const verification = data.verification ?? {};
const inventory = data.inventorySummary ?? {};
const continuation = data.continuation;
if (continuation) {
  assert.ok(['PASS','INCOMPLETE'].includes(continuation.technicalGate), 'Continuation must state the local technical gate');
  assert.equal(continuation.distributionGate, 'INCOMPLETE', 'Technical preparation does not close the distribution gate');
  assert.equal(typeof continuation.preparationStatus, 'string', 'Continuation preparation status is required');
  assert.equal(continuation.externalReview?.status, 'NOT_RUN_BY_OWNER_REQUEST', 'This continuation does not contain an external review');
  assert.equal(continuation.externalReview?.verdict, null, 'An unperformed external review has no verdict');
  assert.equal(continuation.adr?.status, 'Accepted', 'ADR acceptance must be recorded explicitly');
  assert.equal(continuation.editorial?.year, 2027, 'Diagnostic year must match the approved editorial correction');
  for (const key of ['task6','division']) assert.ok(['PASS','INCOMPLETE','FAIL'].includes(continuation.repairs?.[key]?.status), 'Missing repair status: '+key);
  assert.equal(continuation.production?.status, 'NOT_RUN', 'Preparation is not production verification');
  assert.equal(data.publication, 'UNPUBLISHED_CANDIDATE', 'This continuation does not authorize publication');
}
const wb = templatePath ? await SpreadsheetFile.importXlsx(await FileBlob.load(templatePath)) : Workbook.create();
if (process.env.BOOK_REGISTER_HELP === '1') {
  console.log(wb.help('workbook.render', {include:'index,examples,notes', maxChars:4500}).ndjson);
  process.exit(0);
}
const names = ['Реестр', 'Сценарии', 'Ссылки и QR', 'Исправления', 'Основания'];
const sheets = Object.fromEntries(names.map(n => [n, templatePath ? wb.worksheets.getItem(n) : wb.worksheets.add(n)]));
const initialSheets = templatePath ? Object.fromEntries(names.map(name => [name, {
  values:sheets[name].getUsedRange().values, formulas:sheets[name].getUsedRange().formulas,
  tables:sheets[name].tables.items.map(t=>t.name),
}])) : null;
const templateInputChecks=[];
const green = '#145C4D', pale = '#EAF4EF', ink = '#173B34', gray = '#64756E';
const status = v => ({PASS:'ПРОЙДЕНО',NA:'НЕ ПРИМЕНИМО',INCOMPLETE:'ДОПРОВЕРИТЬ',NOT_RUN:'НЕ ВЫПОЛНЕНО',FAIL:'ОШИБКА',PENDING:'ДОПРОВЕРИТЬ'}[v] || v);
const fullStatus = v => ({RECORDED_SCENARIO_COMPLETE:'ПОЛНЫЙ СЦЕНАРИЙ',NAVIGATION_CHECKED:'НАВИГАЦИЯ ПРОВЕРЕНА',REQUIRES_TESTING:'ТРЕБУЕТ ИСПЫТАНИЯ'}[v] || v);
const continuedEvidence = value => typeof value === 'string' ? value : value?.path ? value.path + (value.sha256 ? '; SHA-256 '+value.sha256 : '') : 'См. журнал продолжения задачи';
const repairResult = repair => repair.status === 'PASS' ? 'ИСПРАВЛЕНО' : status(repair.status);
const clean = value => typeof value === 'string' && value.startsWith('=') ? "'" + value : value;
const column = number => {let out='';for(let n=number;n>0;n=Math.floor((n-1)/26))out=String.fromCharCode(65+(n-1)%26)+out;return out;};
const write = (sheet, row, col, rows) => {
  if (!rows.length) return;
  sheet.getRangeByIndexes(row - 1, col - 1, rows.length, rows[0].length).values = rows.map(r => r.map(clean));
};
function merged(sheet, address, value, format={}) {
  const range = sheet.getRange(address);
  if (templatePath) {range.getCell(0,0).values=[[value]];return;}
  range.merge(); range.values = [[value]]; range.format = format;
}
function base(sheet, endCol, endRow) {
  if (templatePath) return;
  const range=sheet.getRangeByIndexes(0,0,endRow,endCol);
  range.format.font={name:'Arial',size:10,color:ink};
  range.format.verticalAlignment='center';
  range.format.wrapText=true;
  range.format.rowHeight=26;
  sheet.showGridLines=false;
  sheet.tabColor=green;
}
function title(sheet,address,text,subtitleRange,subtitle) {
  merged(sheet,address,text,{fill:green,font:{name:'Arial',size:19,bold:true,color:'#FFFFFF'},wrapText:true,verticalAlignment:'center'});
  merged(sheet,subtitleRange,subtitle,{font:{name:'Arial',size:10,color:gray},wrapText:true,verticalAlignment:'center'});
}
function widths(sheet, values) { if (!templatePath) values.forEach((v,i) => {sheet.getRangeByIndexes(0,i,1,1).format.columnWidth=v;}); }
function table(sheet, headerRow, headers, rows, name, rowHeight=48) {
  if (templatePath) {
    assert.deepEqual(sheet.tables.items.map(t=>t.name), [name], 'Preserve the existing table on '+sheet.name);
    const existing=sheet.getUsedRange().values;
    assert.equal(existing.length, headerRow+rows.length, 'A narrow register update must preserve every row on '+sheet.name);
    assert.equal(existing[headerRow-1].length, headers.length, 'Preserve columns on '+sheet.name);
    if (['Реестр','Сценарии','Ссылки и QR'].includes(sheet.name)) {
      const incoming=[headers,...rows].map(row=>row.map(clean));
      let serializedDates=0;
      incoming.forEach((row,r)=>row.forEach((value,c)=>{
        const previous=existing[headerRow-1+r][c];
        if(previous instanceof Date) {
          // Excel serial dates may lose one millisecond when first imported.
          // Validate the original timestamp but leave the existing date cell
          // wholly untouched, preserving its stored value and display format.
          assert.ok(Math.abs(previous.valueOf()-new Date(value).valueOf())<=1,
            'Source timestamp differs from the existing workbook: '+sheet.name+'!'+column(c+1)+(headerRow+r));
          serializedDates++;
        } else {
          assert.deepEqual(value,previous,'Source data differs from the existing workbook: '+sheet.name+'!'+column(c+1)+(headerRow+r));
        }
      }));
      templateInputChecks.push({sheet:sheet.name,rows:rows.length,unchangedDateCells:serializedDates});
      return sheet.getRangeByIndexes(headerRow-1,0,rows.length+1,headers.length);
    }
    write(sheet,headerRow,1,[headers]);write(sheet,headerRow+1,1,rows);
    return sheet.getRangeByIndexes(headerRow-1,0,rows.length+1,headers.length);
  }
  write(sheet,headerRow,1,[headers]);write(sheet,headerRow+1,1,rows);
  const range=sheet.getRangeByIndexes(headerRow-1,0,rows.length+1,headers.length);
  const t=sheet.tables.add(`A${headerRow}:${column(headers.length)}${headerRow+rows.length}`,true,name);t.style='TableStyleMedium4';
  range.format.rowHeight=rowHeight;
  range.format.borders={insideHorizontal:{style:'thin',color:'#DCE7E0'}};
  sheet.getRangeByIndexes(headerRow-1,0,1,headers.length).format={fill:green,font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},wrapText:true,rowHeight:38};
  for(let i=0;i<rows.length;i++) if(i%2===0) sheet.getRangeByIndexes(headerRow+i,0,1,headers.length).format.fill='#F3F8F5';
  sheet.freezePanes.freezeRows(headerRow);sheet.freezePanes.freezeColumns(2);
  return range;
}
function statusColors(sheet,range) {
  const r=sheet.getRange(range);
  // Reapply this workbook's existing five rules verbatim. The import/export
  // path otherwise omits patternType="solid" in differential fills. No rule,
  // range, color or font changes; the saved XML is checked against the source.
  if (templatePath) r.conditionalFormats.deleteAll();
  r.conditionalFormats.add('containsText',{text:'ПРОЙДЕНО',format:{fill:'#E4F2E9',font:{color:'#195A35'}}});
  r.conditionalFormats.add('containsText',{text:'ПОЛНЫЙ СЦЕНАРИЙ',format:{fill:'#D3EDDE',font:{bold:true,color:'#195A35'}}});
  r.conditionalFormats.add('containsText',{text:'ТРЕБУЕТ',format:{fill:'#FFF1CD',font:{bold:true,color:'#80580A'}}});
  r.conditionalFormats.add('containsText',{text:'ДОПРОВЕРИТЬ',format:{fill:'#FFF1CD',font:{color:'#80580A'}}});
  r.conditionalFormats.add('containsText',{text:'ОШИБКА',format:{fill:'#FCE2DF',font:{bold:true,color:'#A32520'}}});
}

const s=sheets['Реестр'],last=11+data.pages.length;
base(s,16,last);widths(s,[7,51,15,11,7,11,18,18,18,17,15,27,71,34,18,24]);
title(s,'A1:L2','MathExam · проверка книги ОГЭ','A3:L3',`Редакция 31 октября 2026 · ${data.pages.length} адрес · проверяется отдельный кандидат книжной версии v1`);
merged(s,'A5:B5','Полные ученические сценарии',{font:{name:'Arial',size:11,bold:true,color:green}});
s.getRange('C5').formulas=[[`=COUNTIF(L12:L${last},"ПОЛНЫЙ СЦЕНАРИЙ")`]];
merged(s,'E5:F5','Требуется испытание',{font:{name:'Arial',size:11,bold:true,color:green}});
s.getRange('G5').formulas=[[`=COUNTIF(L12:L${last},"ТРЕБУЕТ ИСПЫТАНИЯ")`]];
merged(s,'A6:B6','Проверенная навигация',{font:{name:'Arial',size:11,bold:true,color:green}});
s.getRange('C6').formulas=[[`=COUNTIF(L12:L${last},"НАВИГАЦИЯ ПРОВЕРЕНА")`]];
merged(s,'E6:F6','QR-кодов в книге',{font:{name:'Arial',size:11,bold:true,color:green}});
s.getRange('G6').formulas=[[`=SUM(E12:E${last})`]];
if (!templatePath) {s.getRange('C5:C6').format.font={name:'Arial',size:19,bold:true,color:green};s.getRange('G5:G6').format.font={name:'Arial',size:19,bold:true,color:green};}
merged(s,'A8:L9','«Полный сценарий» означает проверенные действия на конкретных заданиях при 320/390/1280 px, с конечным зачётом там, где он есть. Это не проверка всех случайных заданий и не испытание на физических телефонах. Книжные адреса ещё не опубликованы.',{fill:pale,font:{name:'Arial',size:10,color:ink},wrapText:true});
const mainRows=data.pages.map(p=>[p.id,p.title,p.kind==='navigation'?'Навигация':'Тренажёр',p.pdfPages.join(', '),p.qrCount,p.liveHttp??'',status(p.sourceStatus),status(p.frozenStatus),status(p.mathematics),status(p.actions.layout),status(p.actions.topic),fullStatus(p.fullStatus),p.pending.join('; ')||'В рамках записанного сценария открытых пунктов нет. Общие ограничения — на листе «Основания».',p.evidenceIds.join(', '),p.liveSourceMatch==='exact'?'Точные байты базы':p.liveSourceMatch||'Не проверено','Кандидат; не опубликован']);
table(s,11,['ID','Страница / тема','Тип','Стр. PDF','QR, шт.','HTTP сайта','Исходные страницы','Книжные копии','Математика примеров','Экран и элементы','Тема книги','Полная проверка','Что ещё проверить / граница вывода','Доказательства','Сайт → код базы','Публикация'],mainRows,'BookRegister',66);
statusColors(s,`G12:L${last}`);
if (!templatePath) {s.getRange(`E12:F${last}`).setNumberFormat('0');s.getRange(`A12:A${last}`).setNumberFormat('00');}

const sc=sheets['Сценарии'];base(sc,21,data.cases.length+6);widths(sc,[7,14,11,17,17,17,17,17,17,18,17,17,17,18,17,18,42,72,34,28,18]);
title(sc,'A1:J2','Действия ученика · первичные проверки','A3:P4','Каждая строка — отдельная страница, версия и размер экрана. PASS/NA перенесены из фактических журналов; указатель /reports/N позволяет найти исходную запись. Итоговый зачёт дополнительно проверяется на 1280 px.');
const scenarioRows=data.cases.map(c=>[c.id,c.version==='source'?'Исходная':'Книжная',c.width,...['start','wrong-answer','correct-answer','hints','next-example','finish','saved-result','layout','topic','runtime','dependencies','identity'].map(k=>status(c.actions[k])),c.status==='PASS'?'ПРОЙДЕНО':'ДОПРОВЕРИТЬ',c.finite.map(a=>`${a.action}: ${status(a.status)}${a.reason?' — '+a.reason:''}`).join('; ')||'См. завершение основного сценария',Array.from(new Set(c.notes.split('; '))).join('; ')||'Ограничения общего охвата — на листе «Основания».',`${c.evidenceId} ${c.pointer}`,c.checkedAt||'',c.seed??'']);
table(sc,6,['ID','Версия','Ширина, px','Начало','Неверный ответ','Верный ответ','Подсказки','Следующий пример','Завершение','Сохранение','Отображение','Тема','JS / HTTP','Зависимости','Точные байты','Итог сценария','Конечный зачёт','Причина NA / ограничения','Журнал и запись','Проверка / сборка, UTC','Seed'],scenarioRows,'LearnerCases',64);
statusColors(sc,`D7:P${data.cases.length+6}`);
if (!templatePath) {
  sc.getRange(`C7:C${data.cases.length+6}`).setNumberFormat('0');
  sc.getRange(`A7:A${data.cases.length+6}`).setNumberFormat('00');
  sc.getRange(`T7:T${data.cases.length+6}`).setNumberFormat('yyyy-mm-dd hh:mm:ss');
}

const links=sheets['Ссылки и QR'];base(links,11,77);widths(links,[7,76,56,100,14,8,13,13,15,42,24]);
title(links,'A1:F2','Адреса и QR · единая таблица соответствия','A3:F4','Старые публичные адреса сохраняются. Новые короткие адреса ведут в отдельную редакцию /book/oge/2026-10-31/v1/. Не распространять книгу с ними до публикации и проверки рабочего сайта.');
const linkRows=data.pages.map(p=>[p.id,p.sourceUrl,p.bookUrl,p.frozenUrl,p.pdfPages.join(', '),p.qrCount,p.pdfLinkCount,p.docxLinkCount,p.oldRegistryRows.join(', '),p.qrCount?`QR_book_v1/${p.id}.png`:'QR в книге не размещён',verification.documents?.status==='PASS'?'PDF / DOCX согласованы':status(verification.documents?.status??'NOT_RUN')]);
table(links,6,['ID','Публичный адрес из книги','Книжный короткий адрес','Зафиксированная страница','Стр. PDF','QR, шт.','Ссылок PDF','Ссылок DOCX','Строки старого XLSX','Файл QR','Проверка соответствия'],linkRows,'BookLinks',58);
if (!templatePath) {links.getRange('B7:D77').format.font={name:'Arial',size:10,color:'#175DA7'};links.getRange('A7:A77').setNumberFormat('00');}

const fixes=sheets['Исправления'];
const issueRows=[
 ['FIX-01','Сравнение отрицательных чисел','Два одинаковых числа могли предлагаться в вопросе «Какое число больше?».','При сравнении второй операнд теперь отличается от первого. Сгенерированный общий банк обновлён штатным сборщиком.','361 пара + seed 21 + 1000 распределённых seed; UI source/frozen','ИСПРАВЛЕНО','trainers/oge-basics/negative-number-line.html'],
 ['FIX-02','Подбор цифры частного','Мини-проверка просила вычислить частное, хотя ожидала одну целую цифру.','Формулировка прямо спрашивает, сколько целых раз делитель помещается в числе.','Ученический сценарий и мини-проверка; без изменения алгоритма','ИСПРАВЛЕНО','trainers/oge-basics/multiplication-division/long-division-quotient-digit.html'],
 ['FIX-03','Процентное уменьшение','В разборе уменьшения показывалось неверное вычитание вида 60 − 100 = 40%.','При уменьшении выводится 100 − 60 = 40%; общий банк воспроизводится из источника.','28 граничных вариантов объяснения, seed 688, UI','ИСПРАВЛЕНО','trainers/oge-basics/percentages/percent-change.html'],
 ['FIX-04','Базовые страницы на 320 px','Карточки процентов выходили за ширину узкого экрана.','Разрешено сжатие grid-колонки и её дочерних элементов.','320/390/1280 px, открытая помощь, элементы управления, итог','ИСПРАВЛЕНО','trainers/oge-basics/basics-standalone.css'],
 ['FIX-05','Входная диагностика на 320 px','Кнопка «Учитель» выходила за правый край.','Навигации разрешён перенос на следующую строку.','Диагностика на 320/390/1280 px','ИСПРАВЛЕНО','trainers/oge-1-5-trainers/practice-1-5-entry-diagnostic-2026.html'],
 ['FIX-06','ОГЭ №6 · дроби','Учёт решения, позиция и набор существовали только в памяти страницы; дополнительный review выявил потерю перехода «Предыдущее».','Сохранение набора, ответов и позиции проверяется при обоих направлениях перехода и после перезагрузки.','Сохранение результата; next → previous → reload; завершён выбранный раздел из 81 задания','ИСПРАВЛЕНО','trainers/oge-task6-fractions.html'],
 ['FIX-07','ОГЭ №20 · уравнения','Счётчик решённых примеров и серия терялись при перезагрузке; повреждённый JSON мешал восстановлению дальнейших сохранений.','Счётчики сохраняются по теме; некорректные данные проверяются, повреждённая запись восстанавливается при следующем сохранении.','Верный/неверный ответ, смена темы, перезагрузка; восстановление после повреждённого JSON','ИСПРАВЛЕНО','trainers/oge-task20-equations.html'],
 ['FIX-08','ОГЭ №22 · графики','Счётчики попыток и решений не сохранялись; повреждённый JSON мешал восстановлению дальнейших сохранений.','Счётчики сохраняются отдельно по модулю; следующая запись восстанавливает повреждённое хранилище.','Ученический сценарий и перезагрузка, отдельное книжное хранилище; восстановление после повреждённого JSON','ИСПРАВЛЕНО','trainers/oge-task22-functions-graphs.html'],
 ['FIX-09','ОГЭ №24 · доказательства','Три пояснения ошибок содержали неверные утверждения: о равенстве треугольников трапеции, радиусах к общей касательной и накрест лежащих углах.','Исправлены только пояснения к трём неверным карточкам; правильные цепочки доказательства сохранены.','Независимые контрпримеры и проверка правильных доказательств, targeted UI','ИСПРАВЛЕНО','trainers/oge-task24-proofs.html'],
 ['FIX-10','ОГЭ 1–5 · тарифы','Указана цена SMS сверх пакета, но не задан расход SMS. Полный счёт по одному графику минут и гигабайтов не определялся.','В условии явно указано, что расход SMS остаётся в пределах включённого пакета.','Независимый пересчёт всех пяти вопросов и повтор source/frozen','ИСПРАВЛЕНО','trainers/oge-1-5-trainers/practice-1-5-tariffs.html'],
 ['FIX-11','ОГЭ 1–5 · шины','При предварительном разборе HTML браузер мог запросить текстовые подстановки адресов рисунков и получить 404. Сами три иллюстрации затем отображались правильно.','Адреса рисунков задаются после создания элементов; прежние изображения и задания сохранены.','Первичный FAIL сохранён; отдельный эксперимент с порционной подачей HTML и задержкой JS, source/frozen ученический сценарий','ИСПРАВЛЕНО','trainers/oge-1-5-trainers/practice-1-5-tires.html'],
 ['BUILD-01','Книжный пакет · GitHub Pages','Действующая сборка Jekyll исключает папки с подчёркиванием в начале; служебная _edition не попала бы в публикацию.','Папка переименована в edition-assets. Проверка пакета отвергает все исключаемые компоненты пути, даже при пересчитанном манифесте.','10 проверок пакета, включая воспроизведение старого пути; 142 входа + 10 граничных проверок','ИСПРАВЛЕНО','scripts/build-oge-book-edition.py; tools/book-edition/verify.py'],
 ['EDIT-01','Название диагностики · сезон','В книге подпись «ОГЭ-2026», а действующая страница имеет заголовок «ОГЭ-2027».','Математические темы заданий 1–5 совпадают. Перед тиражом согласовать сезон в подписи; исходный авторский текст пока сохранён.','PDF стр. 13; ID 05, точный заголовок зафиксирован в журнале','РЕДАКТОРСКОЕ РЕШЕНИЕ','Книга и practice-1-5-entry-diagnostic-2026.html'],
 ['GATE-01','Исторический division-lab.test.cjs','Старый тест ожидает прежнюю лабораторию и падает также на неизменённой базе.','Сам тест и прежняя фикстура не изменены. Актуальные guided-гейты проверены отдельно.','artifacts/book-audit-basics/division-lab-preexisting.json','ПРЕЖНИЙ СБОЙ','tools/division-lab.test.cjs'],
 ['GATE-02','Исторический список разрешённых путей №6','Глобальный scope guard сравнивает весь проект с древним коммитом df63bacb… и отвергает уже опубликованные изменения main.','Сбой воспроизведён также на исходной базе. Ограничение не ослаблено; общий release gate остаётся неполным.','artifacts/book-audit-exam/source-regression-final.log; точные основания — в отчёте','ПРЕЖНИЙ СБОЙ','tools/oge-task6-fractions-focused.test.mjs'],
 ['RELEASE-01','Публикация книжных адресов','Кандидат подготовлен в отдельной ветке; короткие адреса ещё не опубликованы.','После отдельного решения владельца: merge/deploy, проверка 71 перехода и всех зафиксированных байтов.','Политика AGENTS.md; ADR 0012 Proposed','ТРЕБУЕТ РЕШЕНИЯ','docs/adr/0012-fixed-oge-book-editions.md'],
 ['RELEASE-02','Бумажный QR и реальные устройства','QR декодированы из файлов и рендера; физическая печать и камера не испытаны.','Проверить контрольный оттиск и камеру телефона; отдельно iOS/Safari и Android.','34 QR при 150/300 dpi уже проверены программно','ТРЕБУЕТ ИСПЫТАНИЯ','Не заменяется HTTP 200 или эмуляцией ширины'],
];
if (continuation) {
  const row = id => issueRows.find(r=>r[0]===id);
  const editorial=row('EDIT-01'),division=row('GATE-01'),task6=row('GATE-02'),release=row('RELEASE-01');
  editorial[3]='Подпись в PDF и DOCX согласована с действующей диагностикой: ОГЭ-'+continuation.editorial.year+'. Адрес диагностики и математическое содержание сохранены.';
  editorial[4]=`${continuation.editorial.pages} страниц, ${continuation.editorial.uniqueUrls} адрес, ${continuation.editorial.qr} QR; `+continuedEvidence(continuation.editorial.evidence);
  editorial[5]=continuation.editorial.status==='PASS'?'ИСПРАВЛЕНО':status(continuation.editorial.status??'NOT_RUN');
  division[3]='Контракт учитывает опубликованный переход: восемь прежних математических движков сохранены под управляемой обёрткой, два входа используют guided runtime. Проверяются точные разрешённые изменения и отрицательные примеры.';
  division[4]=`${continuation.repairs.division.tests} планов, ${continuation.repairs.division.guidedPlans} guided-планов, ${continuation.repairs.division.negativeControls} отрицательных проверок; `+continuedEvidence(continuation.repairs.division.evidence);
  division[5]=repairResult(continuation.repairs.division);
  task6[3]='Исторический scope проверяется на точном диапазоне опубликованного PR #287. Текущий PR #387 отдельно проверяется по закреплённой базе, начальному head и явному списку разрешённых файлов.';
  task6[4]=`${continuation.repairs.task6.tests} проверок; `+continuedEvidence(continuation.repairs.task6.evidence);
  task6[5]=repairResult(continuation.repairs.task6);
  release[3]='ADR 0012 принят. Внешнее ревью не выполняется по указанию владельца; вердикта нет. Следующий шаг: отдельное разрешение merge/deploy, затем проверка 71 перехода и всех опубликованных байтов.';
  release[4]='ADR: '+continuation.adr.status+'. External review: '+continuation.externalReview.status+'. '+continuedEvidence(continuation.adr.source);
}
base(fixes,7,issueRows.length+6);widths(fixes,[15,30,68,78,65,27,76]);
title(fixes,'A1:D2','Обнаруженные дефекты и оставшиеся действия','A3:F4','Исправления относятся к кандидату ветки. Выпуск на рабочий сайт — отдельный этап. Доказательства предыдущих неуспешных попыток сохранены; они не включены в число успешных проверок.');
table(fixes,6,['ID','Страница / область','Обнаружено','Решение / следующий шаг','Проверка и доказательство','Статус','Файл / граница'],issueRows,'Issues',88);
statusColors(fixes,`F7:F${issueRows.length+6}`);

const src=sheets['Основания'];
const evidenceText = value => value?.sha256 ? `${value.path}; SHA-256 ${value.sha256}` : 'Доказательство отсутствует';
const liveText = value => `${status(value?.status??'NOT_RUN')}: ${value?.http200??0}/${value?.count??0} HTTP 200; ${value?.exactBaseBytes??0}/${value?.count??0} точных совпадений с базой`;
const documentText = verification.documents?.status==='PASS'
  ? `${verification.documents.pages} страниц PDF; ${verification.documents.uniqueUrls} целей; ${verification.documents.docxQr} QR в DOCX / ${verification.documents.pdfQr} QR в PDF`
  : status(verification.documents?.status??'NOT_RUN');
const sourceRows=[
 ['Область проверки',`Только ${data.pages.length} адрес книги: ${data.counts.completeTrainers} полных сценариев, ${data.counts.navigationChecked} навигационных страниц, ${data.counts.requiresTesting} требуют испытания.`,`${data.counts.recordedCases} записанных проверок; ${data.counts.qr} размещённых QR. «Полный» относится к записанному сценарию.`],
 ['Сопоставление с 7 октября',`Добавлено URL: ${inventory.added_urls_vs_prior?.length??'не проверено'}; удалено: ${inventory.removed_urls_vs_prior?.length??'не проверено'}. В прежнем реестре полная проверка — «Не выполнена».`,`${(inventory.docx_qr_image_files_total??0)-(inventory.docx_qr_used_image_files??0)} неиспользуемых QR-файлов и ${inventory.docx_unused_external_targets?.length??'—'} неиспользуемых отношений DOCX не считаются ссылками книги.`],
 ['Действующий сайт · HTML',liveText(verification.livePages),evidenceText(verification.livePages)],
 ['Действующий сайт · зависимости',liveText(verification.liveDependencies),evidenceText(verification.liveDependencies)],
 ['Проверяемая база Git',data.base,'От этой базы создана отдельная ветка; найденные исправления ещё не опубликованы.'],
 ['Книжная редакция',data.edition,'Фиксируются HTML, JS, CSS, данные, изображения и короткие переходы.'],
 ['SHA-256 манифеста',data.manifestSha256,'Манифест связывает 71 адрес и весь пакет. Старую редакцию запрещено менять или дополнять обычным PR.'],
 ['Сохранение','Результаты сохраняются в браузере и переживают перезагрузку.','Книжные ключи localStorage/sessionStorage отделены от публичных. Между устройствами и учётными записями синхронизация не заявлена.'],
 ['Значение «полный сценарий»','Начало → неверный ответ → помощь → верный ответ → следующий пример → предусмотренный итог → восстановление результата.','Для навигации и одиночного разбора неприменимые действия обозначены NA с объяснением. Конечный зачёт пройден там, где он предусмотрен.'],
 ['Ограничение объёма','Проверены записанные примеры и последовательности; случайные генераторы целиком не перебраны.','Математическая проверка подтверждает конкретные условия и ответы. Чтение answer key не считается независимым подтверждением.'],
 ['Мобильная проверка','Chromium, ширины 320/390/1280 CSS px; проверка управления, помощи и итогового состояния.','Физические телефоны, Safari/Firefox, экранная клавиатура и печатный QR-код требуют отдельного испытания.'],
 ['QR / документы',documentText,evidenceText(verification.documents)],
 ['Документы · отрицательные проверки',`${status(verification.documentRegressions?.status??'NOT_RUN')}: отклонено ${verification.documentRegressions?.rejected??0} из ${verification.documentRegressions?.cases??0} нарушений`,evidenceText(verification.documentRegressions)],
 ['Вёрстка книги',`${status(verification.visualLayout?.status??'NOT_RUN')}; просмотрено страниц: ${verification.visualLayout?.pages??0}`,`Найдено проблем: ${verification.visualLayout?.problems?.length??'не проверено'}. Журналы: ${(verification.visualLayout?.evidence??[]).map(e=>e.path+' SHA-256 '+e.sha256).join('; ')}`],
 ['Кандидат DOCX · SHA-256',verification.documents?.docxSha256??'НЕ ПРОВЕРЕНО','Новый файл с согласованными книжными адресами. Авторский текст вне заменяемых адресов и QR сохранён.'],
 ['Кандидат PDF · SHA-256',verification.documents?.pdfSha256??'НЕ ПРОВЕРЕНО','Точные байты, к которым привязана проверка QR, текста и постраничного рендера.'],
 ['Общий release gate','НЕ ЗАКРЫТ','Ученические сценарии и общий допуск к выпуску различаются. Два исторических теста падают также на базе; внешнее review и публикация проверяются отдельно.'],
 ['Время проверки / сборки','Exam: время отдельного случая. Basics: время сборки агрегированного журнала.','При переносе неизменённых basics cases дата сборки не считается новым запуском. Исходные журналы и доказательства совпадения байтов сохранены в архиве.'],
 ['Публикация','НЕ ОПУБЛИКОВАНО. Файлы книги имеют суффикс candidate.','До выпуска нужны решение по ADR, требуемый review, отдельное разрешение merge/deploy и проверка рабочего сайта.'],
 ...data.sources.map(x=>['Исходный файл',x.name,`SHA-256 ${x.sha256}; ${x.bytes} байт`]),
 ...data.evidence.map(x=>['Доказательство '+(x.id||''),x.path, x.sha256?`SHA-256 ${x.sha256}; записей ${x.cases??x.records??'—'}`:'НЕ ВЫПОЛНЕНО']),
 ['Дата сборки реестра, UTC',data.generatedAt,'Сборка из машиночитаемых результатов без ручного повышения статусов.'],
];
if (continuation) {
  const row = label => sourceRows.find(r=>r[0]===label);
  row('Кандидат DOCX · SHA-256')[2]='Книжные адреса и QR сохранены. Единственная дополнительная редакционная правка авторского текста: подпись диагностики ОГЭ-2026 заменена на ОГЭ-'+continuation.editorial.year+'.';
  row('Общий release gate')[1]='НЕ ЗАКРЫТ. Локальный технический gate: '+status(continuation.technicalGate)+'.';
  row('Общий release gate')[2]=continuation.preparationStatus.replace(/[.\s]+$/,'')+'. Внешнее ревью: '+continuation.externalReview.status+'; вердикта нет. '+(continuation.evidence??[]).map(continuedEvidence).join('; ');
  row('Публикация')[2]='ADR 0012: '+continuation.adr.status+'. Внешнее ревью исключено из текущего поручения владельцем. Нужны отдельное разрешение merge/deploy и проверка рабочего сайта. '+(continuation.production.reason??'Новые адреса ещё не опубликованы.');
}
base(src,3,sourceRows.length+6);widths(src,[34,99,117]);
title(src,'A1:C2','Основания, версии и границы проверки','A3:C4','Этот лист объясняет происхождение данных и значение статусов. Полные журналы, условия задач, ответы, шаги и хеши приложены в архиве доказательств; краткая сводка находится в репозитории.');
table(src,6,['Основание','Значение','Пояснение / проверяемая привязка'],sourceRows,'Provenance',70);
if (!templatePath) src.getRange(`B${sourceRows.length+6}`).setNumberFormat('yyyy-mm-dd hh:mm:ss');

wb.recalculate();
await fs.mkdir(outputDir,{recursive:true});await fs.mkdir(previewDir,{recursive:true});
const summary=await wb.inspect({kind:'region',sheetId:'Реестр',range:'A5:G6',maxChars:2500});
console.log(summary.ndjson??summary);
const errors=[];
for(const name of names) {
  const values=sheets[name].getUsedRange().values;
  for(let row=0;row<values.length;row++)for(let col=0;col<values[row].length;col++) {
    if(typeof values[row][col]==='string'&&/^#(?:REF!|DIV\/0!|VALUE!|N\/A|NAME\?|NUM!|SPILL!)/.test(values[row][col]))errors.push({sheet:name,cell:column(col+1)+(row+1),value:values[row][col]});
  }
}
if(errors.length)throw new Error('Workbook formula errors: '+JSON.stringify(errors));
const preservation={template:!!templatePath,unchangedSheets:[],sheetDimensions:{},inputChecks:templateInputChecks,formulaErrors:errors};
if (templatePath) {
  for(const name of names) {
    const values=sheets[name].getUsedRange().values;
    assert.equal(values.length,initialSheets[name].values.length,'Preserve row count: '+name);
    assert.deepEqual(sheets[name].getUsedRange().formulas,initialSheets[name].formulas,'Preserve formulas: '+name);
    assert.deepEqual(sheets[name].tables.items.map(t=>t.name),initialSheets[name].tables,'Preserve native tables: '+name);
    preservation.sheetDimensions[name]=[values.length,values[0].length];
    if(['Реестр','Сценарии','Ссылки и QR'].includes(name)) {
      assert.deepEqual(values,initialSheets[name].values,'Retain all scenario, address and QR rows: '+name);
      preservation.unchangedSheets.push(name);
    }
  }
}
await fs.writeFile(path.join(previewDir,'inspection.json'),JSON.stringify({summary,errors,preservation,continuation},null,2));
const xlsx=await SpreadsheetFile.exportXlsx(wb);
await xlsx.save(path.join(outputDir,'Proverka_knigi_i_knizhnye_trenazhery_2026-10-31.xlsx'));
for(const name of templatePath ? [] : names) {
  const preview=await wb.render({sheetName:name,range:name==='Реестр'?'A1:L17':name==='Сценарии'?'A1:P12':name==='Ссылки и QR'?'A1:F12':name==='Исправления'?'A1:F12':'A1:C12',scale:1,format:'png'});
  await fs.writeFile(path.join(previewDir,`${names.indexOf(name)+1}.png`),new Uint8Array(await preview.arrayBuffer()));
}
const reviewRanges=templatePath ? [['Исправления','A19:G23','issues-continuation.png'],['Основания','A18:C25','provenance-continuation.png'],['Основания','A34:C34','register-date.png']] : [['Исправления',`A13:F${issueRows.length+6}`,'issues-tail.png'],['Основания',`A13:C${sourceRows.length+6}`,'provenance-tail.png'],['Сценарии','Q6:U12','scenario-provenance.png']];
for(const [name, range, filename] of reviewRanges) {
  const preview=await wb.render({sheetName:name,range,scale:1,format:'png'});
  await fs.writeFile(path.join(previewDir,filename),new Uint8Array(await preview.arrayBuffer()));
}
console.log(JSON.stringify({file:'Proverka_knigi_i_knizhnye_trenazhery_2026-10-31.xlsx',sheets:names,counts:data.counts}));
