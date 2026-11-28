'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');
const file = pathToFileURL(path.resolve(__dirname,'../trainers/oge-basics/multiplication-division/arzhenikov-map.html')).href;
const key='mathexam.arzhenikov.garden.v1';

async function play(browser, width) {
  const page = await browser.newPage({viewport:{width,height:840}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.setDefaultTimeout(5000);
  const panel=page.locator('#garden-play');
  const click=text=>panel.getByRole('button',{name:text,exact:true}).click();
  const answer=async values=>{
    const fields=panel.locator('form input, form select');assert.equal(await fields.count(),values.length);
    for(let i=0;i<values.length;i++){
      const f=fields.nth(i);
      if(await f.evaluate(el=>el.tagName==='SELECT')) await f.selectOption(String(values[i]));
      else await f.fill(String(values[i]));
    }
    await click('Проверить ответ');
  };
  const state=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
  await page.goto(file+'#garden-pack');
  await click('Попробовать на модели');await click('Собрать группу');await click('Отменить шаг');
  await answer([2,0]);assert.equal(await panel.locator('input[aria-invalid=true]').count(),1);
  await page.reload();assert.equal(await panel.locator('input').first().inputValue(),'2');
  await click('Посмотреть разбор');await answer([2,1]);await click('Следующая задача');
  await answer(['packs',3]);await click('Следующая задача');
  await answer([6,1]);await click('Вырастить растение');
  let saved=await state();assert.equal(saved.book.pack.missions,1);assert.equal(saved.book.pack.independent,1);
  assert.equal(saved.book.pack.journal[0].status,'После разбора');
  await panel.locator('.garden-collection summary').click();
  assert.match(await panel.locator('.garden-plot[aria-current]').innerText(),/Ромашка/);
  await panel.getByRole('button',{name:'Ещё три задачи здесь'}).click();
  assert.match(await panel.locator('.garden-question').innerText(),/8 семян/);
  await page.goto(file+'#garden-count');
  await panel.getByRole('heading',{name:'Грядки',exact:true}).waitFor();
  await answer([4]);await click('Следующая задача');await answer(['columns',9]);await click('Следующая задача');
  await click('Нужна подсказка');await answer([14,16]);await click('Вырастить растение');
  assert.equal((await state()).book.count.independent,0);
  await page.clock.install();await page.clock.fastForward(86400001);
  await page.goto(file+'#garden-review');
  await panel.getByText('Повтор после паузы',{exact:true}).waitFor();
  assert.match(await panel.locator('.garden-strip').innerText(),/после паузы/);
  const mixed=(await state()).review;
  assert.equal(mixed.queue.length,2,'two visited plots produce a two-task review');
  assert.deepEqual(new Set(mixed.queue.map(c=>c.id)),new Set(['pack','count']),'review contains only the two visited plots, including the one completed with help');
  for(let i=0;i<mixed.queue.length;i++){
    const {id,round}=mixed.queue[i];
    const values=await page.evaluate(({id,round})=>window.ArzhenikovGarden.card(id,round,2,true).fields.map(f=>f.answer),{id,round});
    await answer(values);await click(i===mixed.queue.length-1?'Завершить повторение':'Следующая задача');
  }
  saved=await state();assert(saved.review.done);
  assert(saved.review.queue.every(c=>saved.reviewCount[c.id]===1));
  await page.reload();assert.match(await panel.innerText(),/Смешанная грядка готова/);
  await click('Новая смешанная грядка');assert.equal((await state()).review.step,0);
  await page.goto(file+'#garden-zero');
  await panel.getByRole('heading',{name:'Зимний сад',exact:true}).waitFor();
  await panel.locator('.garden-collection summary').click();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const returnLink=panel.getByRole('link',{name:'К пошаговой карте'});
  assert.equal(await returnLink.getAttribute('href'),'#zero');
  await returnLink.click();
  await page.getByRole('heading',{name:'Сохраняю ноль в частном',exact:true}).waitFor();
  assert.equal(await page.locator('#heading').innerText(),'Сохраняю ноль в частном');
  assert.deepEqual(errors,[]);await page.close();
}
(async()=>{
  const browser=await chromium.launch();
  try { for(const width of [320,375,1280]) await play(browser,width); }
  finally { await browser.close(); }
  console.log('ARZHENIKOV_GARDEN_BROWSER_OK');
})().catch(e=>{console.error(e);process.exitCode=1;});
