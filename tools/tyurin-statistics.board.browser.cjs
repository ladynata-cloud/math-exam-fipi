'use strict';

// Real local classic-board/Socket.IO journeys with synthetic participants.
// No production account, room, saved plan or pupil attempt is touched.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { createReadStream, statSync } = require('node:fs');
const { createServer } = require('node:http');
const { createServer: createNetServer } = require('node:net');
const { extname, join, resolve, sep } = require('node:path');
const { chromium } = require('playwright');

const ROOT = resolve(__dirname, '..');
const wait = ms => new Promise(done => setTimeout(done, ms));
let phase = 'startup';

async function freePort() {
  const server = createNetServer();
  await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
  const port = server.address().port;
  await new Promise(done => server.close(done));
  return port;
}

function staticServer() {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
  return createServer((request, response) => {
    try {
      const path = decodeURIComponent(new URL(request.url, 'http://local').pathname);
      if (path === '/favicon.ico') { response.writeHead(204).end(); return; }
      let file = resolve(ROOT, '.' + path);
      if (file !== ROOT && !file.startsWith(ROOT + sep)) { response.writeHead(403).end(); return; }
      if (statSync(file).isDirectory()) file = join(file, 'index.html');
      response.setHeader('Content-Type', (types[extname(file)] || 'application/octet-stream') + '; charset=utf-8');
      response.setHeader('Cache-Control', 'no-store');
      createReadStream(file).pipe(response);
    } catch (_) { response.writeHead(404).end(); }
  });
}

async function healthy(url, child, logs) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('Local server exited: ' + logs());
    try { if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) return; } catch (_) {}
    await wait(100);
  }
  throw new Error('Local server not ready: ' + logs());
}

const printedProperties=process.argv.includes('--printed-identity');
const volume2=process.argv.includes('--peterson7-part2'),volume3=process.argv.includes('--peterson7-part3');
const advanced8=process.argv.includes('--makarychev8-2018');
const catalogue=process.argv.includes('--dorofeev9')?{
  directory:'dorofeev-algebra-7-9',entries:[[53,51,18]],uniqueLessons:17,search:'dorofeev-algebra-7-9',match:'действительные числа',lesson:'53-2e',chart:'svg[aria-label*="Карта вложенных числовых множеств"]',storage:'math:dorofeev-algebra-7-9:v1:'
}:process.argv.includes('--dorofeev8')?{
  directory:'dorofeev-algebra-7-9',entries:[[72,60,28]],uniqueLessons:27,search:'dorofeev-algebra-7-9',match:'алгебраические дроби',lesson:'72-6c',chart:'svg[aria-label*="Числитель и знаменатель"]',storage:'math:dorofeev-algebra-7-9:v1:'
}:process.argv.includes('--dorofeev7')?{
  directory:'dorofeev-algebra-7-9',entries:[[96,73,58]],uniqueLessons:57,search:'dorofeev-algebra-7-9',match:'сравнение дробей',lesson:'96-12',chart:'svg[aria-label*="Сравнение долей годной продукции"]',storage:'math:dorofeev-algebra-7-9:v1:'
}:process.argv.includes('--merzlyak7-2015')?{
  directory:'merzlyak9-2014',entries:[[93,51,125]],uniqueLessons:124,search:'merzlyak9-2014',match:'введение',lesson:process.argv.includes('--boundary')?'93-20-2':'93-6-3',chart:process.argv.includes('--boundary')?'svg[aria-label*="Контур фигуры с размерами"]':'svg[aria-label*="Дерево выражения"]',storage:'math:merzlyak9-2014:v1:'
}:process.argv.includes('--makarychev9-2018')?{
  directory:'makarychev8-2018',entries:[[49,80,35]],uniqueLessons:34,search:'makarychev8-2018',match:'углублённый уровень',lesson:'49-4b',chart:'svg[aria-label*="График функции с отдельными ветвями"]',storage:'math:makarychev8-2018:v1:'
}:process.argv.includes('--makarychev7-2018')?{
  directory:'makarychev8-2018',entries:[[91,61,57]],uniqueLessons:56,search:'makarychev8-2018',match:'углублённый уровень',lesson:'91-18',chart:'svg[aria-label*="Изменение величины по этапам"]',storage:'math:makarychev8-2018:v1:'
}:process.argv.includes('--nikolsky9-linear')?{
  directory:'nikolsky-algebra-7-9',entries:[[57,78,135]],uniqueLessons:134,search:'nikolsky-algebra-7-9',match:'числа, делимость и неравенства',lesson:'57-3-l',chart:'svg[aria-label*="Открытые границы и области решения"]',storage:'math:nikolsky-algebra-7-9:v1:'
}:process.argv.includes('--nikolsky8-inequalities')?{
  directory:'nikolsky-algebra-7-9',entries:[[75,69,88]],uniqueLessons:87,search:'nikolsky-algebra-7-9',match:'числа, делимость и неравенства',lesson:process.argv.includes('--tallest')?'75-18':'75-5-f',chart:process.argv.includes('--tallest')?'svg[aria-label*="Пересечение выбранного ряда и шеренги"]':'svg[aria-label*="Числовая прямая с точками сравнения"]',storage:'math:nikolsky-algebra-7-9:v1:'
}:process.argv.includes('--nikolsky7-natural')?{
  directory:'nikolsky-algebra-7-9',entries:[[99,77,35]],uniqueLessons:34,search:'nikolsky-algebra-7-9',match:'числа, делимость и неравенства',lesson:'99-19-c',chart:'svg[aria-label*="Пятёрки из кратных"]',storage:'math:nikolsky-algebra-7-9:v1:'
}:process.argv.includes('--alimov9-division')?{
  directory:'alimov-algebra-7-9',entries:[[58,48,39]],uniqueLessons:38,search:'alimov-algebra-7-9',match:'выражения, знаки и многочлены',lesson:'58-7-3',chart:'svg[aria-label*="Коэффициенты остатка при пробном параметре"]',storage:'math:alimov-algebra-7-9:v1:'
}:process.argv.includes('--alimov8-signs')?{
  directory:'alimov-algebra-7-9',entries:[[81,55,51]],uniqueLessons:50,search:'alimov-algebra-7-9',match:'выражения, знаки и многочлены',lesson:process.argv.includes('--strict-sign')?'81-12-4':'81-5-3',chart:process.argv.includes('--strict-sign')?'svg[aria-label*="Две части доказательства"]':'svg[aria-label*="Знаки трёх степеней"]',storage:'math:alimov-algebra-7-9:v1:'
}:process.argv.includes('--alimov-school-2011')?{
  directory:'alimov-algebra-7-9',entries:[[104,53,44]],uniqueLessons:43,search:'alimov-algebra-7-9',match:'выражения, знаки и многочлены',lesson:process.argv.includes('--hike')?'104-10':'104-5-2',chart:process.argv.includes('--hike')?'svg[aria-label*="Временная шкала ходьбы"]':'svg[aria-label*="Уровни порядка"]',storage:'math:alimov-algebra-7-9:v1:'
}:process.argv.includes('--vilenkin11-antiderivatives')?{
  directory:'vilenkin-analysis-2014',entries:[[6,95,25]],uniqueLessons:24,search:'vilenkin-analysis-2014',match:'действительные числа и первообразная',lesson:process.argv.includes('--hole')?'6-4-4':'6-2-4',chart:process.argv.includes('--hole')?'svg[aria-label*="Два промежутка с независимыми"]':'svg[aria-label*="Шаги дифференцирования"]',storage:'math:vilenkin-analysis-2014:v1:'
}:process.argv.includes('--vilenkin-analysis-2014')?{
  directory:'vilenkin-analysis-2014',entries:[[30,123,31]],uniqueLessons:30,search:'vilenkin-analysis-2014',match:'действительные числа и первообразная',lesson:process.argv.includes('--digits')?'30-14':'30-7-6',chart:process.argv.includes('--digits')?'svg[aria-label*="Префикс и повторяющаяся"]':'svg[aria-label*="Две десятичные границы"]',storage:'math:vilenkin-analysis-2014:v1:'
}:process.argv.includes('--peterson9-roots')?{
  directory:'peterson9-2017',entries:[[52,40,14]],uniqueLessons:13,search:'peterson9-2017',match:'корни высших степеней',lesson:'52-5-2',chart:'svg[aria-label*="Пересечение возрастающей нечётной степени"]',storage:'math:peterson9-2017:v1:'
}:process.argv.includes('--peterson9-2017')?{
  directory:'peterson9-2017',entries:[[51,34,25]],uniqueLessons:24,search:'peterson9-2017',match:'множества и графики функций',lesson:process.argv.includes('--hotel')?'51-9-3':'51-2-4',chart:process.argv.includes('--hotel')?'svg[aria-label*="Сдвиг мест в счётной гостинице"]':'svg[aria-label*="График функции и три контрольные точки"]',storage:'math:peterson9-2017:v1:'
}:process.argv.includes('--vilenkin8-2010')?{
  directory:'vilenkin8-2010',entries:[[82,89,14]],uniqueLessons:13,search:'vilenkin8-2010',match:'дроби и порядок деления',lesson:'82-3',chart:'svg[aria-label*="Порядок деления с разными скобками"]',storage:'math:vilenkin8-2010:v1:'
}:process.argv.includes('--peterson8-part3')?{
  directory:'peterson8-2017',entries:[[73,21,27]],uniqueLessons:26,search:'peterson8-2017',match:'степенные функции и дроби',lesson:process.argv.includes('--domains')?'73-6b-4':'73-4f',chart:process.argv.includes('--domains')?'svg[aria-label*="Исходная и преобразованная области определения"]':'svg[aria-label*="Запрещённые значения исходной дроби"]',storage:'math:peterson8-2017:v1:'
}:process.argv.includes('--peterson8-part2')?{
  directory:'peterson8-2017',entries:[[71,24,42]],uniqueLessons:41,search:'peterson8-2017',match:'степенные функции',lesson:process.argv.includes('--interval')?'71-8c':'71-4-7',chart:process.argv.includes('--interval')?'svg[aria-label*="графика степени на замкнутом"]':'svg[aria-label*="График куба с парой"]',storage:'math:peterson8-2017:v1:'
}:process.argv.includes('--peterson8-2017')?{
  directory:'peterson8-2017',entries:[[70,21,31]],uniqueLessons:30,search:'peterson8-2017',match:'искусство задавать вопросы',lesson:process.argv.includes('--logic')?'70-9-3':'70-6',chart:process.argv.includes('--logic')?'svg[aria-label*="Строки истинности"]':'svg[aria-label*="Начальный капитал"]',storage:'math:peterson8-2017:v1:'
}:advanced8?{
  directory:'makarychev8-2018',onlySelected:process.argv.includes('--selected-room'),entries:[[69,62,93]],uniqueLessons:92,search:'makarychev8-2018',match:'углублённый уровень',lesson:process.argv.includes('--punctured-line')?'69-14b':process.argv.includes('--two-lines')?'69-13c':'69-17c',chart:process.argv.includes('--punctured-line')?'svg[aria-label*="со снятой точкой"]':process.argv.includes('--two-lines')?'svg[aria-label*="две диагонали"]':'svg[aria-label*="Делители числителя"]',storage:'math:makarychev8-2018:v1:'
}:volume2||volume3 ? {
  directory:'peterson7-2011',entries:volume2?[[102,17,52]]:[[103,21,34]],uniqueLessons:volume2?51:33,search:'peterson7-2011',match:'математические модели',lesson:volume2?'102-6m':process.argv.includes('--arrow-fork')?'103-2-1b':'103-7a',chart:volume2?'svg[aria-label*="Граница основания"]':process.argv.includes('--arrow-fork')?'svg[aria-label*="Стрелки между"]':'svg[aria-label*="Квадрат рационального"]',storage:'math:peterson7-2011:v1:'
} : process.argv.includes('--peterson7-2011') ? {
  directory:'peterson7-2011',entries:[[101,22,70]],uniqueLessons:69,search:'peterson7-2011',match:'математические модели',lesson:process.argv.includes('--literal-n')?'101-1-3d':'101-16',chart:process.argv.includes('--literal-n')?'svg[aria-label*="Две полоски"]':'svg[aria-label*="встречном и попутном"]',storage:'math:peterson7-2011:v1:'
} : process.argv.includes('--mordkovich-2020-theory') ? {
  directory:'mordkovich-2020',entries:[[24,49,13]],uniqueLessons:12,onlySelected:process.argv.includes('--selected-room'),search:'mordkovich-2020',match:'множества и делимость',lesson:'24-example-1',chart:'svg[aria-label*="Последовательные целые"]',storage:'math:mordkovich-2020:v1:'
} : process.argv.includes('--mordkovich-2020') ? {
  directory:'mordkovich-2020',entries:[[25,50,60]],uniqueLessons:59,search:'mordkovich-2020',match:'множества и делимость',lesson:'25-review-17d',chart:'svg[aria-label*="Разложения для сравнения"]',storage:'math:mordkovich-2020:v1:'
} : process.argv.includes('--mordkovich7-2013') ? {
  directory:'mordkovich-2013',entries:[[97,47,23]],uniqueLessons:22,search:'mordkovich-2013',match:'выражения',lesson:'97-q14',chart:'svg[aria-label*="Направление шага"]',storage:'math:mordkovich-2013:v1:'
} : process.argv.includes('--mordkovich7-theory-2019') ? {
  directory:'mordkovich-2019',entries:[[89,66,53]],uniqueLessons:47,search:'mordkovich-2019',match:'порядок действий',lesson:'89-3-ex2',chart:'svg[aria-label*="Температура по часам"]',storage:'math:mordkovich-2019:v1:'
} : process.argv.includes('--mordkovich8-workbook-2019') ? {
  directory:'mordkovich-2019',entries:[[67,54,38]],uniqueLessons:37,search:'mordkovich-2019',match:'область определения',lesson:'67-1-10',chart:'svg[aria-label*="Подстановка на числовой прямой"]',storage:'math:mordkovich-2019:v1:'
} : process.argv.includes('--mordkovich7-workbook-2019') ? {
  directory:'mordkovich-2019',entries:[[90,50,17]],uniqueLessons:16,search:'mordkovich-2019',match:'порядок действий',lesson:'90-1-4-d',chart:'svg[aria-label*="Дерево действий"]',storage:'math:mordkovich-2019:v1:'
} : process.argv.includes('--mordkovich8-2013') ? {
  directory:'mordkovich-2013',entries:[[76,45,21]],uniqueLessons:20,search:'mordkovich-2013',match:'дроби',lesson:'76-ex3',chart:'svg[aria-label*="Сокращаемый множитель"]',storage:'math:mordkovich-2013:v1:'
} : process.argv.includes('--mordkovich-2013-theory') ? {
  directory:'mordkovich-2013',entries:[[20,62,31]],uniqueLessons:29,search:'mordkovich-2013',match:'числовые функции первого тома',lesson:process.argv.includes('--bounds')?'20-prop-7b':'20-example1b',chart:process.argv.includes('--bounds')?'svg[aria-label*="Концы области и их отражения"]':'svg[aria-label*="Три ветви кусочной функции"]',storage:'math:mordkovich-2013:v1:'
} : process.argv.includes('--mordkovich-2013') ? {
  directory:'mordkovich-2013',entries:[[21,60,66]],uniqueLessons:65,search:'mordkovich-2013',match:'тождества и знаки',lesson:process.argv.includes('--circle-flat')?'21-7-20d':process.argv.includes('--circle-range')?'21-7-11b':process.argv.includes('--circle-quadrants')?'21-7-10d':process.argv.includes('--circle-domain')?'21-7-6d':'21-7-2b',chart:process.argv.includes('--circle-flat')?'svg[aria-label*="Горизонтальный график"]':process.argv.includes('--circle-range')?'svg[aria-label*="Границы множества"]':process.argv.includes('--circle-quadrants')?'svg[aria-label*="Знаки проекций радиуса"]':process.argv.includes('--circle-domain')?'svg[aria-label*="исключённые положения угла"]':'svg[aria-label*="Квадраты координат"]',storage:'math:mordkovich-2013:v1:'
}:process.argv.includes('--alimov-2012') ? {
  directory:'alimov-2012',entries:[[19,78,47]],uniqueLessons:45,search:'alimov-2012',match:'периодические дроби',lesson:process.argv.includes('--nested')?'19-12c':process.argv.includes('--root-bounds')?'19-7':process.argv.includes('--absolute')?'19-8b':process.argv.includes('--chain')?'19-5b':'19-3f',onlySelected:['--chain','--root-bounds','--absolute','--nested'].some(flag=>process.argv.includes(flag)),chart:process.argv.includes('--nested')?'svg[aria-label*="Раскрытие двух квадратов"]':process.argv.includes('--root-bounds')?'svg[aria-label*="двумя соседними десятыми"]':process.argv.includes('--absolute')?'svg[aria-label*="его модуль"]':process.argv.includes('--chain')?'svg[aria-label*="Дерево вычислений"]':'svg[aria-label*="одинаковым периодическим хвостом"]',storage:'math:alimov-2012:v1:'
}:process.argv.includes('--makarychev7-2014') ? {
  directory:'makarychev7-2014',entries:[[95,46,7]],search:'makarychev7-2014',match:'выражения и статистика',lesson:printedProperties?'95-5':'95-10',chart:printedProperties?'svg[aria-label*="Верхняя стрелка"]':'svg[aria-label*="Средние места"]',storage:'math:makarychev7-2014:v1:'
}: process.argv.includes('--makarychev9-2017-supplement')?{
  directory:'makarychev9-2017',entries:[[50,36,68]],search:'makarychev9-2017',match:'36 пунктов',lesson:process.argv.includes('--radical-sum')?'50-219':process.argv.includes('--parameter')?'50-216':process.argv.includes('--graph')?'50-213':'50-202',onlySelected:true,chart:process.argv.includes('--radical-sum')?'svg[aria-label*="Корни вспомогательного"]':process.argv.includes('--parameter')?'svg[aria-label*="Парабола при найденном"]':process.argv.includes('--graph')?'svg[aria-label*="Обе ветви"]':'svg[aria-label*="Сечение"]',storage:'math:makarychev9-2017:v1:'
}:process.argv.includes('--makarychev9-2017')?{
  directory:'makarychev9-2017',entries:[[50,36,68]],search:'makarychev9-2017',match:'36 пунктов',lesson:'50-4',chart:'svg[aria-label*="раскрытия скобок"]',storage:'math:makarychev9-2017:v1:'
}:process.argv.includes('--merzlyak9-2014')?{
  directory:'merzlyak9-2014',entries:[[55,26,26]],search:'merzlyak9-2014',match:'все параграфы',lesson:'55-13',chart:'svg[aria-label*="штриховая"]',storage:'math:merzlyak9-2014:v1:'
}:{
  directory:'tyurin-statistics',entries:[[113,67,23],[114,29,10]],search:'Тюрин',match:'вероятность и статистика',lesson:'114-28',chart:'svg[aria-label*="рассеивания"]',storage:'math:tyurin-stats:v1:'
};
async function run(browser, origin, serverOrigin) {
  const tc=await browser.newContext(),sc=await browser.newContext({viewport:{width:360,height:780}});
  try {
    const teacher=await tc.newPage(),student=await sc.newPage();
    for(const [book,count,direct] of catalogue.entries){
      await student.goto(origin+'/school/index.html#book/source-'+book,{waitUntil:'domcontentloaded',timeout:60000});
      await student.locator('#main .skill-row').first().waitFor({timeout:60000});
      assert.equal(await student.locator('#main .skill-row').count(),count);
      if(book===82){
        const missing=student.locator('#main .skill-row').filter({hasText:'VI.5 · с. 226'});
        assert.equal(await missing.count(),1);
        const continuation=missing.getByRole('link',{name:'Открыть продолжение со с. 228',exact:true});
        assert.equal(await continuation.getAttribute('href'),'https://pdf.my-uchebnik.ru/pdf/algebra/00000067.pdf#page=226');
        assert.equal(await missing.getByText('Сверить страницу в книге',{exact:true}).count(),0);
        assert.equal(await missing.getByText('Решать на общей доске',{exact:true}).count(),0);
      }
      const links=await student.locator('#main a[href*="'+catalogue.directory+'/index.html"]').evaluateAll(links=>links.map(el=>el.href));
      assert.equal(links.length,direct);
      // A topic and its first printed exercise can deliberately have the same target.
      const targets=[...new Set(links)];
      if(catalogue.uniqueLessons)assert.equal(targets.length,catalogue.uniqueLessons);
      const individual=catalogue.onlySelected?targets.filter(url=>new URL(url).hash==='#lesson/'+catalogue.lesson):targets;
      if(catalogue.onlySelected)assert.equal(individual.length,1);
      for(const url of individual){
        const page=volume2||volume3||advanced8?await sc.newPage():student;
        try {
          await page.goto(url,{waitUntil:'domcontentloaded'});await page.locator('#model').waitFor();
          assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),url);
          if(catalogue.directory==='alimov-2012' && !catalogue.onlySelected && url===individual[0])
            await require('./alimov-2012-display.cjs')(page);
          const id=new URL(url).hash.slice(8);
          assert.equal(await page.locator('#lesson').inputValue(),id);
          await page.locator('[data-action=practice]').click();await page.locator('#answer').fill('9999999');
          await page.locator('#work form button').click();await page.locator('#feedback').filter({hasText:'Проверь ещё раз'}).waitFor();
        } finally { if(page!==student)await page.close(); }
      }
    }
    phase='joint room';
    await teacher.goto(origin+'/trainers/trainer-board.html?server='+encodeURIComponent(serverOrigin),{waitUntil:'domcontentloaded'});
    await teacher.locator('#openShare').click();await teacher.locator('#createRoom').click();
    try {
      await teacher.waitForFunction(()=>document.querySelector('#studentLink')?.value.includes('role=student'));
    } catch (error) {
      const status=await teacher.locator('#shareStatus').innerText();
      throw new Error('Unable to open the test room: '+status,{cause:error});
    }
    const invite=await teacher.locator('#studentLink').inputValue();await teacher.locator('#sharePanel [data-close-panel]').click();await student.goto(invite,{waitUntil:'domcontentloaded'});
    await teacher.locator('#chooseTrainer').click();await teacher.locator('#pickerSearch').fill(catalogue.search);
    await teacher.locator('#pickerResults .picker-item').filter({hasText:catalogue.match}).first().click();
    const connected=p=>p.waitForFunction(()=>document.querySelector('#mirrorStatus')?.dataset.mirrorStatus==='connected');
    await Promise.all([connected(student),connected(teacher)]);
    const frame=p=>p.frameLocator('#trainerFrame'),t=frame(teacher),s=frame(student);
    const value=(page,id,v)=>page.waitForFunction(([k,a])=>document.querySelector('#trainerFrame')?.contentDocument?.getElementById(k)?.value===a,[id,v]);
    await t.locator('#lesson').selectOption(catalogue.lesson);await value(student,'lesson',catalogue.lesson);
    await t.locator('#model').focus();await t.locator('#model').press('ArrowRight');await value(student,'model','1');
    assert.equal(await s.locator(catalogue.chart).count(),1);
    if(catalogue.lesson==='89-3-ex2') {
      await t.locator('#lesson').selectOption('89-6-ex2');
      await value(student,'lesson','89-6-ex2');
      await t.locator('#model').focus();await t.locator('#model').press('ArrowRight');
      await value(student,'model','1');
      assert.equal(await s.locator('svg[aria-label*="Три дробные координаты"]').count(),1);
      await t.locator('#lesson').selectOption(catalogue.lesson);
      await value(student,'lesson',catalogue.lesson);
    }
    if(printedProperties){
      const shown='[data-action="printed-guide"][aria-expanded="true"]';
      const folded='[data-action="printed-guide"][aria-expanded="false"]';
      await s.locator(folded).waitFor();
      await t.locator(folded).click();
      await s.locator(shown).waitFor();
      await student.reload({waitUntil:'domcontentloaded'});
      await connected(student);
      await s.locator(shown).waitFor();
      await t.locator(shown).click();
      await s.locator(folded).waitFor();
    }
    await t.locator('[data-action=practice]').click();await t.locator('#answer').fill('1234');await value(student,'answer','1234');
    await t.locator('#work form button').click();await s.locator('#feedback').filter({hasText:'Проверь ещё раз'}).waitFor();
    await t.locator('[data-action=hint]').click();await s.locator('#work ol li').first().waitFor();
    await teacher.locator('#openShare').click();await teacher.locator('#controlToggle').click();
    await student.waitForFunction(()=>document.body.classList.contains('control-owner'));await teacher.locator('#sharePanel [data-close-panel]').click();
    await s.locator('[data-action=hint]').click();await t.locator('#work ol li').nth(1).waitFor();
    await teacher.reload({waitUntil:'domcontentloaded'});
    await connected(teacher);
    await value(teacher,'answer','1234');
    await t.locator('#work ol li').nth(1).waitFor();
    await s.locator('#answer').fill('4321');await value(teacher,'answer','4321');
    await student.reload({waitUntil:'domcontentloaded'});
    await connected(student);
    await value(student,'answer','4321');
    await s.locator('#work ol li').nth(1).waitFor();
    assert.equal(await student.evaluate(key=>JSON.parse(localStorage.getItem(key)).draft,catalogue.storage+catalogue.lesson),'9999999');
    // A pupil disconnect returns control to the teacher. Re-grant it to the
    // reconnected pupil before exercising changes in the other direction.
    if (await teacher.locator('body').evaluate(body=>body.classList.contains('control-owner'))) {
      await teacher.locator('#openShare').click();
      await teacher.locator('#controlToggle').click();
      await teacher.locator('#sharePanel [data-close-panel]').click();
    }
    await student.waitForFunction(()=>document.body.classList.contains('control-owner'));
    const alternate=await s.locator('#lesson').evaluate(select=>Array.from(select.options).find(option=>option.value!==select.value).value);
    await s.locator('#lesson').selectOption(alternate);
    await value(teacher,'lesson',alternate);
    await s.locator('#model').focus();
    await s.locator('#model').press('ArrowRight');
    await value(teacher,'model','1');
    await s.locator('[data-action=practice]').click();
    await t.locator('#answer').waitFor();
    await s.locator('#answer').fill('98765');
    await value(teacher,'answer','98765');
    await s.locator('#work form button').click();
    await t.locator('#feedback').filter({hasText:'Проверь ещё раз'}).waitFor();
    console.log(catalogue.directory+' mobile practice entries; real teacher/student model, draft, error, help, transfer and personal storage passed.');
  } finally {await tc.close();await sc.close();}
}
(async()=>{const server=staticServer();let browser,child,watchdog,logs='';try{
  await new Promise((done,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',done);});const origin='http://127.0.0.1:'+server.address().port;
  const port=await freePort(),serverOrigin='http://127.0.0.1:'+port,env={...process.env,HOST:'127.0.0.1',PORT:String(port),NODE_ENV:'test',CORS_ALLOWED_ORIGINS:origin};
  for(const key of Object.keys(env))if(/^(LEARNING_|PROGRESS_|GROUP_LESSON_)/.test(key))delete env[key];
  child=spawn(process.execPath,['index.js'],{cwd:join(ROOT,'board-server'),env,stdio:['ignore','ignore','pipe']});child.stderr.on('data',data=>{logs=(logs+String(data)).slice(-4000);});await healthy(serverOrigin+'/health',child,()=>logs);
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox'],timeout:20000});
  const scenario=process.argv.includes('--mordkovich-circle-suite')?require('./mordkovich-2013-circle.board.cjs'):process.argv.includes('--alimov10-11')?require('./alimov-workshop.board.cjs'):run;
  await Promise.race([scenario(browser,origin,serverOrigin),new Promise((_,reject)=>{watchdog=setTimeout(()=>reject(Error('Gate timeout '+phase)),240000);})]);
}finally{clearTimeout(watchdog);await browser?.close();if(child&&child.exitCode===null)child.kill('SIGTERM');await new Promise(done=>server.close(done));}})().catch(error=>{console.error('TYURIN_BOARD_FAILED at '+phase+'\n'+(error.stack||error));process.exitCode=1;});
