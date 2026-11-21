import assert from 'node:assert/strict';
import http from 'node:http';
import { after, before, test } from 'node:test';
import { createHandler } from '../server.mjs';

let server, endpoint;
before(async () => {
  server = http.createServer(createHandler({ env: {} }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  endpoint = 'http://127.0.0.1:' + server.address().port;
});
after(() => new Promise(resolve => server.close(resolve)));
const math = 'https://mathexam.space', literary = 'https://usel-toski-po-miru.art';
async function post(input, origin) {
  return fetch(endpoint + '/api/v1/dialogue', { method:'POST',
    headers:{'Content-Type':'application/json', ...(origin ? {Origin:origin} : {})}, body:JSON.stringify(input) });
}
async function ok(site, message, context, state) {
  const res = await post({site, message, context, state}, site === 'uzel' ? literary : math);
  assert.equal(res.status, 200);
  return res.json();
}
test('reader narrows two works to one while preserving the first-reading boundary', async () => {
  const context = {surface:'reader', mode:'before_reading'};
  const first = await ok('uzel','незаметное добро',context);
  assert.deepEqual(new Set(first.links.map(s => s.id)),new Set(['work-yushka','work-matrenin-dvor']));
  const second = await ok('uzel','да, именно горница, а рассказ я ещё не дочитала',context,first.state);
  assert.deepEqual(second.links.map(s => s.id),['work-matrenin-dvor']);
  assert.match(second.links[0].url,/\/poisk-po-pamyati\/#work-matrenin-dvor$/);
  assert.doesNotMatch(second.reply,/поезд|погиб|гибель/iu);
});
test('limited after-reading source and an explicit return to spoiler-free mode', async () => {
  const context = {surface:'reader', mode:'after_reading', workId:'work-potaennyy-les'};
  const answer = await ok('uzel','Кто на самом деле оставил следы в лесу?',context);
  assert.match(answer.reply,/страниц[ауе] 9/u);
  assert.match(answer.reply,/нельзя|недостаточно/u);
  assert.equal(answer.links[0].id,context.workId);
  const back = await ok('uzel','Енисей у костра, без спойлеров',context,answer.state);
  assert.equal(back.state.mode, 'before_reading');
  assert.ok(back.links.every(link => link.url.includes('/poisk-po-pamyati/#')));
});
test('navigator keeps the choice, division answers one contextual step', async () => {
  const nav = {surface:'navigator'};
  const first = await ok('mathexam','Деление',nav);
  const second = await ok('mathexam','Да, именно на двузначное',nav,first.state);
  assert.ok(second.links.some(link => link.url.includes('long-division-stepwise.html')));
  const step = {surface:'division',step:'digit',divisor:7,partial:16};
  const question = await ok('mathexam','Какую цифру пробовать?',step);
  const simpler = await ok('mathexam','Объясни проще',step,question.state);
  assert.notEqual(simpler.reply,question.reply);
  assert.match(simpler.reply,/16/u);
  assert.doesNotMatch(simpler.reply,/(?:^|\D)2(?:$|\D)/u);
  assert.deepEqual(simpler.links,[]);
});
test('origin selection, strict request schema and response size limit', async () => {
  const input = {site:'mathexam',message:'деление',context:{surface:'navigator'}};
  assert.equal((await post(input,literary)).status,403);
  assert.equal((await post(input,'https://unrelated.example')).status,403);
  assert.equal((await post({...input,context:{surface:'navigator',sourceUrl:'https://example.net'}},math)).status,400);
  assert.equal((await post({...input,context:{surface:'division',step:'unknown',divisor:6}},math)).status,400);
  assert.equal((await post({...input,message:'a'.repeat(9000)},math)).status,413);
  assert.equal((await post({site:'uzel',message:'объясни',context:{surface:'reader',mode:'after_reading',workId:'missing'}},literary)).status,400);
  const options = await fetch(endpoint+'/api/v1/dialogue',{method:'OPTIONS',headers:{Origin:literary}});
  assert.equal(options.status,204);
  assert.equal(options.headers.get('access-control-allow-origin'),literary);
  assert.equal(options.headers.get('access-control-allow-credentials'),null);
});
test('health, browser client and local demonstration are available in the same service', async () => {
  assert.deepEqual(await (await fetch(endpoint+'/healthz')).json(),{ok:true, version:1,mode:'offline'});
  for (const path of ['/', '/demo.js','/client.js']) assert.equal((await fetch(endpoint+path)).status,200);
  const input = {site:'mathexam',message:'дроби',context:{surface:'navigator'}};
  assert.equal((await post(input,endpoint)).status,200);
});

test('the trainer responds to digit and remainder attempts without completing the calculation', async () => {
  const digit = {surface:'division',step:'digit',divisor:14,partial:78,attempt:8};
  const high = await ok('mathexam','Ввёл восемь. Стирать?',digit);
  assert.match(high.reply,/только 8 × 14/u);
  assert.doesNotMatch(high.reply,/112|больше|меньшую/u);
  assert.doesNotMatch(high.reply,/(?<!\d)5(?!\d)/u);
  const simple = await ok('mathexam','Я запуталась, помедленнее',digit,high.state);
  assert.match(simple.reply,/группа — это 14.*8 таких групп/u);
  const low = await ok('mathexam','А такая цифра влезает?',{...digit,attempt:2});
  assert.match(low.reply,/2 × 14/u);
  const place = await ok('mathexam','Можно сносить следующую?',{...digit,partial:3,attempt:undefined,quotientStarted:true,placeExponent:-2});
  assert.match(place.reply,/Запиши 0 в разряде сотых/u);
  const verify = await ok('mathexam','Получилось 11 с остатком 2. Проверяю?',{surface:'division',step:'verify',divisor:7,dividend:'79'});
  assert.match(verify.reply,/11 на 7/u);
  assert.doesNotMatch(verify.reply,/прибавь|сравни|77|79/u);
  const contrary = await ok('mathexam','Получилось 3 с остатком 12. Проверяю?',{surface:'division',step:'verify',divisor:7,dividend:'33'});
  assert.match(contrary.reply,/меньше делителя/u);
  const decimal = await ok('mathexam','Получилось 3 с остатком 1. Проверяю?',{surface:'division',step:'verify',divisor:25,originalDivisor:'2,5',dividend:'8,5'});
  assert.match(decimal.reply,/3 на 2,5/u);
  assert.doesNotMatch(decimal.reply,/на 25/u);
});

test('requesting spoiler-free reading does not restore a rejected title', async () => {
  const context = {surface:'reader',mode:'before_reading'};
  const previous = await ok('uzel','«Тоска» Чехова',context);
  const corrected = await ok('uzel','Без спойлеров, я перепутала, это «Каштанка» Чехова',context,previous.state);
  assert.deepEqual(corrected.links,[]);
  assert.deepEqual(corrected.state.candidates,[]);
});

test('decimal shift uses the original pair and leaves the transformed number to the learner', async () => {
  const step = {surface:'division',step:'shift-dividend',divisor:25,originalDivisor:'0.0250',dividend:'4.7'};
  const moved = await ok('mathexam','Что сделать дальше?',step);
  assert.match(moved.reply,/4,7.*три разряда.*два нуля/u);
  assert.doesNotMatch(moved.reply,/4700|188/u);
  const whole = await ok('mathexam','Что сделать дальше?',{...step,divisor:12,originalDivisor:'1,2',dividend:'15'});
  assert.match(whole.reply,/после последней цифры.*один разряд.*один ноль/u);
  const enough = await ok('mathexam','Подскажи',{...step,dividend:'3,1415'});
  assert.match(enough.reply,/три разряда/u);
  assert.doesNotMatch(enough.reply,/допиши|3141/u);
  const count = await ok('mathexam','С чего начать?',{...step,step:'shift-count'});
  assert.doesNotMatch(count.reply,/три разряда/);
});
test('personal and neutral assignment queries reach the cabinet; general practice stays public', async () => {
  const context = {surface:'navigator'};
  for (const q of ['Какие упражнения преподаватель назначил лично мне?', 'Где посмотреть назначения?', 'Что мне задали на завтра?', 'Что мне было задано на понедельник?']) {
    const result = await ok('mathexam',q,context);
    assert.equal(result.links[0].id,'cabinet');
    assert.match(result.reply,/не вижу личных заданий/u);
  }
  for (const q of ['Дай задания по дробям для 6 класса', 'Мне задали уравнение 2x+5=19, с чего начать?', 'Нам задали умножать дроби, найди похожий тренажёр']) {
    const general = await ok('mathexam',q,context);
    assert.notEqual(general.links[0]?.id,'cabinet');
  }
});

test('digit conversation keeps a named probe through numeric and why follow-ups', async () => {
  const c = {surface:'division',step:'digit',divisor:3,partial:12,attempt:8};
  let r = await ok('mathexam','Пробую 3',c);
  assert.match(r.reply,/3 × 3/);
  r = await ok('mathexam','Почему так?',c,r.state);
  assert.equal(r.state.attempt,3);
  r = await ok('mathexam','Что дальше?',c,r.state);
  assert.match(r.reply,/3 × 3/);
  r = await ok('mathexam','9',c,r.state);
  assert.match(r.reply,/Сравни полученное 9 с 12/);
  const wrong = await ok('mathexam','равно',c,r.state);
  assert.match(wrong.reply,/Перепроверь сравнение/);
  r = await ok('mathexam','А дальше?',c,r.state);
  assert.match(r.reply,/Прибавь.*9.*3/);
  r = await ok('mathexam','12',c,r.state);
  assert.match(r.reply,/Ещё одна целая группа помещается/);
  r = await ok('mathexam','Что дальше?',{...c,attempt:2},r.state);
  assert.match(r.reply,/2 × 3/);
  const changed = await ok('mathexam','Что дальше?',{...c,partial:15,attempt:undefined},r.state);
  assert.match(changed.reply,/выбери одну цифру/iu);
  assert.equal(changed.state.attempt,undefined);
});

test('division context rejects invalid place and impossible one-digit partial, unknown place stays neutral', async () => {
  const base = {site:'mathexam',message:'Подскажи',context:{surface:'division',step:'digit',divisor:7,partial:3}};
  for (const extra of [{placeExponent:'сотые'},{placeExponent:2.5},{quotientStarted:'yes'},{partial:70}]) {
    assert.equal((await post({...base,context:{...base.context,...extra}},math)).status,400);
  }
  const neutral = await ok('mathexam','Подскажи',{...base.context,quotientStarted:true,placeExponent:-12});
  assert.match(neutral.reply,/на этом месте частного/);
  assert.doesNotMatch(neutral.reply,/сотых|десятых/);
});
