'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
require('../school/shared/learning-route.js');
const render = globalThis.MathExamLearningRoute.render;
function lesson(id, overrides = {}) {
  return {id,title:'Тема '+id,order:Number(id.slice(1)),total:3,done:0,independent:0,
    studied:false,started:false,href:'#lesson/'+id+'/0',...overrides};
}
function course(lessons, overrides = {}) {
  return {title:'Курс',scope:'Только задания этого курса',chapters:[{id:1,title:'Первая глава',lessons}],...overrides};
}
function freeze(value) {
  if (value && typeof value === 'object') {Object.values(value).forEach(freeze);Object.freeze(value);}
  return value;
}

test('new learner sees zero progress and first topic without fabricated completion', () => {
  const html = render(course([lesson('p01'),lesson('p02')]));
  assert.match(html, /aria-valuemax="6" aria-valuenow="0"/);
  assert.match(html, /href="#lesson\/p01\/0">Начать /);
  assert.equal((html.match(/Ещё не начато/g)||[]).length, 2);
  assert.doesNotMatch(html, /lr-topic-confirmed/);
  assert.match(html, /Тем с самостоятельным решением всех задач: <strong>0 из 2/);
});

test('theory is visible but adds no task credit', () => {
  const html = render(course([lesson('p01',{studied:true})]));
  assert.match(html, /Теория изучена · твоя отметка/);
  assert.match(html, /Решено 0 из 3 задач · 0%/);
  assert.match(html, /lr-topic-studied/);
  assert.match(html, /href="#lesson\/p01\/0">Продолжить /);
});

test('assisted and independent evidence remain disjoint', () => {
  const html = render(course([lesson('p01',{done:3,independent:1})]));
  assert.match(html, /<strong>1<\/strong><span>самостоятельно/);
  assert.match(html, /<strong>2<\/strong><span>с помощью \/ после попыток/);
  assert.match(html, /Пройдено · закрепи на новых задачах/);
  assert.match(html, /Тем с самостоятельным решением всех задач: <strong>0 из 1/);
  assert.match(html, /aria-valuetext="3 из 3 задач; самостоятельно 1"/);
});

test('only all independent included tasks produce full-topic confirmation', () => {
  const html = render(course([lesson('p01',{done:3,independent:3})]));
  assert.match(html, /lr-topic-confirmed/);
  assert.match(html, /Все задачи самостоятельно/);
  assert.match(html, /Тем с самостоятельным решением всех задач: <strong>1 из 1/);
  assert.match(html, /href="#lesson\/p01\/0">Повторить /);
  assert.match(html, /не заменяет проверку знаний на новых задачах/);
});

test('continuation moves to first incomplete topic and opens its chapter', () => {
  const options = course([], {chapters:[
    {id:1,title:'Завершённая',lessons:[lesson('p01',{done:3,independent:3})]},
    {id:2,title:'Следующая',lessons:[lesson('p02')]}]});
  const html = render(options);
  assert.match(html, /href="#lesson\/p02\/0">Продолжить /);
  assert.match(html, /id="chapter-1" class="lr-chapter"><details>/);
  assert.match(html, /id="chapter-2" class="lr-chapter"><details open>/);
  assert.match(html, /href="#lesson\/p02\/0" aria-current="step"/);
});

test('explicit resume preserves exact task or detour rather than inferring a new cursor', () => {
  const html = render(course([lesson('p01'),lesson('p02')],{
    resume:{href:'#practice/fractions/2',label:'Вернуться к тренировке',lessonId:'p02'}}));
  assert.match(html, /href="#practice\/fractions\/2">Продолжить /);
  assert.match(html, /Вернуться к тренировке/);
  assert.match(html, /href="#lesson\/p02\/0" aria-current="step"/);
});

test('when all tasks are done but help was used, a topic still needing confirmation is recommended', () => {
  const html = render(course([lesson('p01',{done:3,independent:3}),lesson('p02',{done:3,independent:1})]));
  assert.match(html, /href="#lesson\/p02\/0">Продолжить /);
  assert.match(html, /Тем с самостоятельным решением всех задач: <strong>1 из 2/);
});

test('text is escaped and executable links are rejected', () => {
  const html = render(course([lesson('p01',{title:'<img src=x onerror=alert(1)>',href:'javascript:alert(1)'})],{
    title:'<script>alert(1)</script>',scope:'" & < >',resume:{href:'javascript:alert(2)',label:'Unsafe'}}));
  assert.doesNotMatch(html, /<script>|<img |javascript:|>Unsafe</);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&lt;img src=x/);
  assert.match(html, /href="#home"/);
});

test('rendering never modifies source evidence and counters cannot exceed total', () => {
  const options = freeze(course([lesson('p01',{done:99,independent:100})]));
  const before = JSON.stringify(options);
  const html = render(options);
  assert.equal(JSON.stringify(options),before);
  assert.match(html,/aria-valuemax="3" aria-valuenow="3"/);
  assert.match(html,/Решено 3 из 3 задач · 100%/);
  assert.doesNotMatch(html,/width:NaN|width:-/);
});

test('empty or malformed numeric evidence never yields NaN or false mastery', () => {
  const html = render(course([lesson('p01',{total:NaN,done:-1,independent:Infinity})]));
  assert.doesNotMatch(html,/NaN|Infinity|lr-topic-confirmed/);
  assert.match(html,/Решено 0 из 0 задач · 0%/);
  assert.match(render(course([])),/Темы пока не добавлены/);
});


test('fresh adapter resume preserves Begin and practice resume avoids a false chapter label', () => {
  const html = render(course([lesson('p01')],{resume:{href:'#lesson/p01/0',lessonId:'p01',isNew:true}}));
  assert.match(html,/href="#lesson\/p01\/0">Начать /);
  assert.match(html,/>Следующий шаг</);
  const practice = render(course([lesson('p01')],{resume:{href:'#practice/fractions/1',lessonId:null}}));
  assert.match(practice,/class="lr-next-chapter">Отдельная тренировка</);
});


test('small positive progress is never labelled zero percent', () => {
  const html=render(course([lesson('p01',{total:722,done:2,independent:1})]));
  assert.match(html,/Решено 2 из 722 задач · меньше 1%/);
  assert.doesNotMatch(html,/задач · 0%/);
});
