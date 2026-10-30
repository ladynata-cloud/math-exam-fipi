'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {test} = require('node:test');
const {JSDOM, VirtualConsole} = require('jsdom');
const root = path.resolve(__dirname, '../../courses/vilenkin-6-part-1');
const html = fs.readFileSync(path.join(root, 'textbook.html'), 'utf8');
const scripts = ['textbook-source-labels.js','textbook-support.js','textbook-math.js','textbook-course.js'].map(name => fs.readFileSync(path.join(root,name),'utf8'));
const units = ['A','B','C','D'].flatMap(block => JSON.parse(fs.readFileSync(path.join(root,`textbook-data/units-${block}.json`),'utf8')));
const KEY = 'mathexam-vilenkin6-textbook-2024-v1';
const factors = units.find(unit => unit.id === 6);
const practice = factors.tasks.find(task => task.id === 'v6-book-2-14-а-270');
const check = factors.tasks.find(task => task.id === 'v6-book-2-14-в-1225');
const guided = factors.tasks.find(task => task.id === 'v6-book-2-14-а-108');
const route = task => `#unit/6/task/${encodeURIComponent(task.id)}`;
const tick = () => new Promise(resolve => setTimeout(resolve,0));
const answer = item => String(Array.isArray(item.answer) ? item.answer[0] : item.answer);

async function open(hash, saved) {
  const errors = [], vc = new VirtualConsole();
  vc.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(html, {url:`https://example.test/courses/vilenkin-6-part-1/textbook.html${hash}`, runScripts:'outside-only', virtualConsole:vc});
  const w = dom.window, d = w.document;
  w.scrollTo = () => {};
  w.fetch = async name => ({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'))});
  if (saved) w.localStorage.setItem(KEY,saved);
  scripts.forEach(source => w.eval(source));
  for(let i=0;i<30&&!w.VilenkinTextbook?.ready;i++)await tick();
  assert(w.VilenkinTextbook?.ready);
  assert.deepEqual(errors,[]);
  return {w,d,errors,close:()=>w.close()};
}
async function go(ctx, hash) {ctx.w.location.hash=hash;await tick();await tick();}
function record(ctx, task) {return JSON.parse(ctx.w.localStorage.getItem(KEY)).tasks[task.id];}
function type(ctx,value) {const input=ctx.d.querySelector('#answer');assert(input);input.value=value;input.dispatchEvent(new ctx.w.Event('input',{bubbles:true}));return input;}
function submit(ctx,value) {type(ctx,value);ctx.d.querySelector('#answer-form').dispatchEvent(new ctx.w.Event('submit',{bubbles:true,cancelable:true}));}
async function reveal(ctx,reason) {const disclosure=ctx.d.querySelector(`[data-v6-support="${reason}"]`);assert(disclosure);disclosure.open=true;await tick();return disclosure;}

test('actual task caption distinguishes exercise, point, paragraph, chapter and printed page', async () => {
  const ctx=await open(route(guided));
  const source=ctx.d.querySelector('.source');
  assert.equal(source.querySelector('strong').textContent,'Тренажёр к задаче № 2.14 · а, число 108');
  assert(source.textContent.includes('Пункт 6 · § 2 «Действия со смешанными числами» · глава I «Смешанные числа» · часть 1'));
  assert.equal(source.querySelector('a').textContent,'с. 45 учебника');
  assert.equal(source.querySelector('a').getAttribute('href'),'textbook.pdf#page=46');
  assert.equal(ctx.d.querySelectorAll('[data-study-support] details[open]').length,0);
  assert.equal(record(ctx,guided),undefined,'mounting support creates no task progress record');
  ctx.close();
});

test('opening table preserves unfinished input and condition and records assistance before completion', async () => {
  let ctx=await open(route(practice));
  const input=type(ctx,'2 · 3 · '), form=ctx.d.querySelector('#answer-form'), condition=ctx.d.querySelector('.prompt').textContent;
  const disclosure=await reveal(ctx,'prime-table');
  assert.equal(ctx.d.querySelector('#answer'),input,'support must not redraw the answer field');
  assert.equal(ctx.d.querySelector('#answer-form'),form);
  assert.equal(input.value,'2 · 3 · ');
  assert.equal(ctx.d.querySelector('.prompt').textContent,condition);
  assert.equal(record(ctx,practice).draft,input.value);
  assert.equal(record(ctx,practice).helped,true);
  assert.equal(record(ctx,practice).status,'');
  assert.equal(record(ctx,practice).attempts,0);
  assert(ctx.d.querySelector('[data-help-status]'));
  const select=ctx.d.querySelector('[data-v6-prime-limit]');select.value='1000';select.dispatchEvent(new ctx.w.Event('change'));
  assert.equal(ctx.d.querySelectorAll('[data-v6-primes] li').length,168);
  assert.equal(input.value,'2 · 3 · ');
  disclosure.open=false;await tick();
  const saved=ctx.w.localStorage.getItem(KEY);ctx.close();ctx=await open(route(practice),saved);
  assert.equal(ctx.d.querySelector('#answer').value,'2 · 3 · ');
  assert.equal(record(ctx,practice).helped,true,'closing table and reload cannot erase help');
  submit(ctx,answer(practice));
  assert.equal(record(ctx,practice).status,'assisted');
  assert.match(ctx.d.querySelector('.work h2').textContent,/с помощью/);
  assert.deepEqual(ctx.errors,[]);ctx.close();
});

test('primary-school reminder retains completed guided steps and the next draft', async () => {
  const ctx=await open(route(guided));
  submit(ctx,answer(guided.steps[0]));
  assert.equal(ctx.d.querySelectorAll('.step-history li').length,1);
  const history=ctx.d.querySelector('.step-history').textContent;
  const input=type(ctx,'не закончено');
  await reveal(ctx,'prerequisites');
  assert.equal(ctx.d.querySelector('#answer'),input);
  assert.equal(input.value,'не закончено');
  assert.equal(ctx.d.querySelector('.step-history').textContent,history);
  assert.equal(record(ctx,guided).step,1,'reference must never advance a step');
  assert.equal(record(ctx,guided).stepDrafts[1],'не закончено');
  assert.equal(record(ctx,guided).helped,true);
  assert.equal(ctx.d.querySelectorAll('[data-v6-practice]').length,6);
  assert.deepEqual(ctx.errors,[]);ctx.close();
});

test('old support cannot change another task, including before hashchange has rerendered', async () => {
  const ctx=await open(route(practice));
  type(ctx,'старый черновик');
  const stale=ctx.d.querySelector('[data-v6-support="prime-table"]');
  const staleRange=ctx.d.querySelector('[data-v6-prime-limit]');
  const staleLink=ctx.d.querySelector('[data-v6-practice]');
  ctx.w.location.hash=route(check);
  const before=ctx.w.localStorage.getItem(KEY);
  stale.open=true;stale.dispatchEvent(new ctx.w.Event('toggle'));
  assert.equal(ctx.w.localStorage.getItem(KEY),before,'hash invalidates help before render');
  await tick();await tick();
  type(ctx,'новый черновик');
  const current=ctx.w.localStorage.getItem(KEY);
  stale.dispatchEvent(new ctx.w.Event('toggle'));
  staleRange.value='1000';staleRange.dispatchEvent(new ctx.w.Event('change'));
  const click=new ctx.w.MouseEvent('click',{bubbles:true,cancelable:true});staleLink.dispatchEvent(click);
  assert.equal(click.defaultPrevented,true);
  assert.equal(ctx.w.localStorage.getItem(KEY),current);
  assert.equal(ctx.d.querySelector('#answer').value,'новый черновик');
  assert.equal(record(ctx,check).helped,false);
  assert.equal(record(ctx,practice).helped,false);
  assert.equal(ctx.d.querySelectorAll('[data-v6-primes] li').length,25);
  assert.deepEqual(ctx.errors,[]);ctx.close();
});

test('using support after a correct independent answer preserves earned status across reload', async () => {
  let ctx=await open(route(check));
  submit(ctx,answer(check));
  assert.equal(record(ctx,check).status,'independent');
  const before=ctx.w.localStorage.getItem(KEY);
  await reveal(ctx,'prime-table');await reveal(ctx,'prerequisites');
  const link=ctx.d.querySelector('[data-v6-practice]');link.addEventListener('click',event=>event.preventDefault());link.click();
  assert.equal(ctx.w.localStorage.getItem(KEY),before);
  assert.equal(record(ctx,check).helped,false);
  assert.equal(ctx.d.querySelector('[data-help-status]'),null);
  ctx.close();ctx=await open(route(check),before);
  assert.equal(record(ctx,check).status,'independent');
  assert.match(ctx.d.querySelector('.work h2').textContent,/самостоятельно/);
  assert.deepEqual(ctx.errors,[]);ctx.close();
});

test('reading the topic support before starting practice creates no attempt or help record', async () => {
  const ctx=await open('#unit/6');
  await reveal(ctx,'prime-table');await reveal(ctx,'divisibility');await reveal(ctx,'prerequisites');
  await go(ctx,route(practice));
  assert.equal(record(ctx,practice),undefined,'reading support before a task creates no saved attempt');
  type(ctx,'');
  assert.equal(record(ctx,practice).helped,false);
  assert.equal(record(ctx,practice).attempts,0);
  assert.equal(record(ctx,practice).status,'');
  assert.equal(ctx.d.querySelectorAll('[data-study-support] details[open]').length,0);
  assert.deepEqual(ctx.errors,[]);ctx.close();
});
