import assert from 'node:assert/strict';
import test from 'node:test';
import { respond } from '../dialogue.mjs';

const siteUrl = 'https://usel-toski-po-miru.art';
const before = { surface: 'reader', mode: 'before_reading' };
const titles = [
  {
    query: 'Чем кончается «Тоска» Чехова?',
    id: 'work-toska',
    ending: /лошад|лошадён|конюшн/iu,
    article: '/stati/chekhov-toska-temp-finala/',
    source: 'https://feb-web.ru/feb/chekhov/texts/sp0/sp4/sp4-326-.htm?cmd=p'
  },
  {
    query: 'Чем кончается «Куст сирени» Куприна?',
    id: 'work-kust-sireni',
    ending: /посадили|посадк|садовник|выкопал/iu,
    article: '/stati/kuprin-kust-sireni-dva-vzglyada/',
    source: 'https://www.ilibrary.ru/text/1848/p.1/index.html'
  }
];

function ask(message, context = before, state) {
  return respond({ site: 'uzel', message, context, state });
}

for (const { query, id, ending, article, source } of titles) {
  test(`preserves the first-reading boundary and selected sources for ${id}`, () => {
    const introduction = ask(query);
    const cardUrl = siteUrl + '/poisk-po-pamyati/#' + id;
    assert.deepEqual(introduction.links.map(link => link.url), [cardUrl]);
    assert.doesNotMatch(introduction.reply, ending);

    const selected = { surface: 'reader', mode: 'after_reading', workId: introduction.links[0].id };
    const discussion = ask('Это точная цитата автора? Где прочитать первоисточник?', selected, introduction.state);
    assert.equal(discussion.state.workId, id);
    assert.match(discussion.reply, /комментарий мастерской/iu);
    assert.deepEqual(discussion.links.map(link => link.url), [siteUrl + article, source]);

    const back = ask('Без спойлеров', selected, discussion.state);
    assert.equal(back.state.mode, 'before_reading');
    assert.deepEqual(back.links.map(link => link.url), [cardUrl]);
    assert.doesNotMatch(back.reply, ending);
  });
}

test('an unknown or contradictory title prompts for a detail', () => {
  for (const query of ['Каштанка Чехова', 'Куст сирени Чехова', '«Незнакомый студент» Чехова']) {
    const answer = ask(query);
    assert.deepEqual(answer.links, []);
    assert.match(answer.reply, /имя героя|уточн/iu);
  }
});

test('an author query keeps two works until the reader recalls a distinguishing detail', () => {
  const options = ask('рассказ Чехова');
  assert.deepEqual(new Set(options.state.candidates), new Set(['work-student', 'work-toska']));
  const answer = ask('Вспомнила. Извозчик Иона вёз пассажиров.', before, options.state);
  assert.deepEqual(answer.links.map(link => link.id), ['work-toska']);
});
