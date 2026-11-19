'use strict';

const surface = document.querySelector('#surface');
const conversation = document.querySelector('#conversation');
const input = document.querySelector('#message');
const statusLine = document.querySelector('#status');
const sendButton = document.querySelector('#send');
const scenes = {
  reader: {site: 'uzel', cue: 'Вы вспоминаете книгу по одному эпизоду. Обсуждение прочитанного можно открыть после выбора произведения.', examples: ['Не помню рассказ про незаметное добро.', 'Да, там была горница, а рассказ я ещё не дочитала.']},
  navigator: {site: 'mathexam', cue: 'Вы ищете подходящий тренажёр на MathExam.', examples: ['Хочу научиться делить', 'Да, на двузначное число.']},
  division: {site: 'mathexam', cue: 'В делении уголком вы дошли до числа 37. Делитель — 6. Сейчас нужно подобрать цифру частного.', examples: ['Какую цифру пробовать?', 'Объясни этот же шаг проще.']}
};

let state;
let active;
let workId;
let turns = 0;

function reset() {
  active?.abort();
  active = null;
  state = undefined;
  workId = undefined;
  turns = 0;
  conversation.replaceChildren();
  input.value = '';
  document.querySelector('#situation').textContent = scenes[surface.value].cue;
  statusLine.textContent = '';
  sendButton.disabled = false;
}

function addTurn(author, body) {
  const block = document.createElement('section');
  const name = document.createElement('strong');
  name.textContent = author;
  const paragraph = document.createElement('p');
  paragraph.textContent = body;
  block.append(name, paragraph);
  conversation.appendChild(block);
  return block;
}

function addLinks(block, result) {
  if (!result.links.length) return;
  const list = document.createElement('ul');
  for (const link of result.links) {
    if (!link || typeof link.url !== 'string' || typeof link.label !== 'string') continue;
    let destination;
    try { destination = new URL(link.url); } catch { continue; }
    if (!['https:', 'http:'].includes(destination.protocol)) continue;
    const row = document.createElement('li');
    const anchor = document.createElement('a');
    anchor.textContent = link.label;
    anchor.href = destination.href;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    row.appendChild(anchor);
    if (surface.value === 'reader' && result.state?.mode === 'before_reading' &&
        result.state.candidates?.includes(link.id)) {
      const discuss = document.createElement('button');
      discuss.type = 'button';
      discuss.textContent = 'Я уже прочитал(а). Обсудить';
      discuss.setAttribute('aria-label', 'Обсудить после чтения: ' + link.label);
      discuss.addEventListener('click', () => {
        if (!active) query('Я уже прочитал(а) «' + link.label + '». Хочу обсудить произведение.', link.id);
      });
      row.appendChild(discuss);
    }
    list.appendChild(row);
  }
  block.appendChild(list);
}

async function query(message, chosenWork) {
  if (active || !message.trim()) return;
  const current = surface.value;
  const controller = new AbortController();
  active = controller;
  statusLine.textContent = 'Ожидаем ответ…';
  sendButton.disabled = true;
  const selected = chosenWork || workId;
  let context = {surface: current};
  if (current === 'reader') {
    context = selected ? {surface: current, mode: 'after_reading', workId: selected}
                       : {surface: current, mode: 'before_reading'};
  } else if (current === 'division') {
    Object.assign(context, {step: 'digit', partial: 37, divisor: 6});
  }
  const request = {site: scenes[current].site, message: message.trim(), context};
  if (state !== undefined) request.state = state;
  addTurn('Вы', message);
  const result = await window.SiteDialogueClient?.ask(request, {signal: controller.signal});
  if (controller.signal.aborted || active !== controller) return;
  active = null;
  sendButton.disabled = false;
  if (!result) {
    statusLine.textContent = 'Сервер не ответил. Вопрос можно отправить ещё раз.';
    input.value = message;
    return;
  }
  state = result.state;
  workId = state?.mode === 'after_reading' ? state.workId : undefined;
  turns += 1;
  statusLine.textContent = '';
  const response = addTurn(current === 'reader' ? 'Узел тоски по миру' : 'MathExam', result.reply);
  addLinks(response, result);
  input.value = '';
  input.focus();
}

document.querySelector('#ask').addEventListener('submit', event => {
  event.preventDefault();
  query(input.value);
});
document.querySelector('#example').addEventListener('click', () => {
  input.value = scenes[surface.value].examples[Math.min(turns, 1)];
  input.focus();
});
document.querySelector('#clear').addEventListener('click', reset);
surface.addEventListener('change', reset);
reset();
