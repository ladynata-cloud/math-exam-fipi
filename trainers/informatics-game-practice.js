// Enhance the original reference collection. The complete source remains readable without JS.
(() => {
  const headings = Array.from(document.querySelectorAll('h2'));
  const cards = [];
  const groups = headings.map((heading, group) => {
    let node = heading.nextElementSibling;
    const tasks = [];
    while (node && node.tagName !== 'H2') {
      if (node.tagName === 'H3') {
        const source = node.nextElementSibling;
        const task = source?.nextElementSibling;
        const key = task?.nextElementSibling;
        if (task?.classList.contains('task') && key?.classList.contains('answer')) {
          let answer = key.textContent.replace(/^Ответ:\s*/, '').trim();
          const url=source.querySelector('a')?.href;
          const id=url?.split('/').pop();
          let title=node.textContent;
          let correction='';
          if (id==='4ED215') {
            // For the source game 9555BE (S<145, +1 or ×2), only position 72 forces
            // an immediate win for the next player after any reply. Reach it from 36 or 71.
            answer='36 71';
            correction='Проверка по правилам связки 35. Исторический ключ к этой карточке содержит значения вне разрешённого диапазона.';
          }
          if (id==='DD29FA') title='Задание 21 (DD29FA)';
          tasks.push({group,title,text:task.textContent,number:Number(title.match(/\d+/)?.[0]),answer,correction,source:url});
        }
      }
      node = node.nextElementSibling;
    }
    cards.push(...tasks);
    return tasks;
  });
  if (!cards.length) return;
  const bank = document.createElement('details');
  bank.innerHTML = '<summary>Полный сборник с исходными ответами и ссылками</summary>';
  headings[0].before(bank);
  let node = bank.nextElementSibling;
  while (node && node.tagName !== 'SCRIPT') {
    const next = node.nextElementSibling;
    bank.append(node);
    node = next;
  }
  const key = 'mathexam.games.v1.' + (document.title.includes('Яндекс') ? 'yandex' : 'fipi');
  let saved;
  try { saved = JSON.parse(localStorage.getItem(key)); } catch {}
  const viewed = new Set(Array.isArray(saved?.viewed) ? saved.viewed : []);
  const solved = new Set(Array.isArray(saved?.solved) ? saved.solved : []);
  function rulesFor(card) {
    const sources=groups[card.group].filter(item=>item.number===19);
    if (sources.length===1) return sources[0];
    // One imported group contains two games with interleaved labels.
    // Match the original cross-reference in the game statement to this task's ID.
    const id=card.source?.split('/').pop();
    return sources.find(item=>id && item.text.toLowerCase().includes('/task/'+id.toLowerCase()));
  }
  const available = cards.filter(c => /^[\d\s,]+$/.test(c.answer) &&
    (!/^Для игры, описанной/i.test(c.text.trim()) || rulesFor(c)));
  const warmup = document.createElement('details');
  warmup.className = 'game-practice warmup';
  warmup.innerHTML = `<summary>Разобрать два ответа соперника на маленькой куче</summary>
    <p class="rules"></p><div class="moves"></div><p role="status"></p>
    <button type="button" class="variant" hidden>Попробовать с другим порогом</button>`;
  bank.before(warmup);
  let target = 20;
  function resetWarmup() {
    const start = Math.ceil(target / 2) - 1;
    warmup.querySelector('.rules').textContent = `В куче ${start} камней. За ход можно прибавить 1 или удвоить кучу. Кто первым получит не меньше ${target} камней, тот выиграл. Петя ходит первым. Для каждого его хода выберите ответ Вани, который сразу завершит игру.`;
    const moves = warmup.querySelector('.moves'), note = warmup.querySelector('[role=status]');
    moves.replaceChildren(); note.textContent='';
    warmup.querySelector('.variant').hidden=true;
    let found=0;
    for(const [label,after] of [['прибавил 1',start+1],['удвоил кучу',2*start]]) {
      const row=document.createElement('p');
      row.textContent=`Петя ${label}. Теперь ${after}. Ход Вани: `;
      moves.append(row);
      for(const [move,result] of [['+1',after+1],['×2',2*after]]){
        const button=document.createElement('button');button.type='button';button.textContent=move;
        button.addEventListener('click',()=>{
          if(result<target) {note.textContent=`Получится ${result}, а для победы нужно не меньше ${target}. Попробуйте другой ход Вани.`;return;}
          row.querySelectorAll('button').forEach(b=>{b.disabled=true;});
          row.append(document.createTextNode(` Получилось ${result} — Ваня выиграл.`));
          found++;
          note.textContent=found===2?'Оба хода Пети проверены. Ваня выигрывает своим первым ходом при любом выборе Пети.':'Одна ветвь проверена. Проверьте второй ход Пети.';
          warmup.querySelector('.variant').hidden=found!==2;
        });
        row.append(button,document.createTextNode(' '));
      }
    }
  }
  warmup.querySelector('.variant').onclick=()=>{target=15+(target-15+3)%10;resetWarmup();};
  resetWarmup();
  const ui = document.createElement('section');
  ui.className = 'game-practice';
  ui.innerHTML = `
    <h2>Самостоятельная попытка</h2>
    <label>Задача <select></select></label><span class="progress"></span>
    <div class="context" hidden><h3>Правила из задания 19</h3><div class="task"></div></div>
    <h3 class="title"></h3><p class="correction" hidden></p><div class="task question"></div>
    <details class="hint"><summary>Подсказка к следующему шагу</summary><p></p></details>
    <form><label>Ваш ответ <input autocomplete="off" maxlength="70"></label><button>Проверить</button></form>
    <p role="status" aria-live="polite"></p>
    <details class="reveal"><summary>Свериться с ключом сборника</summary><p></p></details>
    <button type="button" class="next">Другая задача того же номера</button>`;
  bank.before(ui);
  const $ = selector => ui.querySelector(selector);
  const select = $('select');
  available.forEach(c => select.add(new Option('Связка ' + (c.group + 1) + ' · ' + c.title.replace(/\s*\(.+/, ''), c.title)));
  const normalize = value => {
    const raw = value.trim();
    if (!/^\d+(?:(?:\s*[,;]\s*|\s+)\d+)*$/.test(raw)) return '';
    return raw.split(/[\s,;]+/).map(v => v.replace(/^0+(?=\d)/, '')).join(' ');
  };
  function persist() {
    try { localStorage.setItem(key,JSON.stringify({current:select.value, solved:[...solved], viewed:[...viewed]})); } catch {}
  }
  function showProgress() {
    $('.progress').textContent = 'Решено: ' + available.filter(c=>solved.has(c.title)).length + ' из ' + available.length;
  }
  function render() {
    const c = available[select.selectedIndex];
    $('.title').textContent = 'Связка ' + (c.group + 1) + ' · ' + c.title.replace(/\s*\(.+/, '');
    const text = c.text.replace(/\n(?:Задание (?:19|20|21)(?: https?:\/\/\S+)?\s*)+$/g, '').replace(/\*\*/g,'').trim();
    $('.question').textContent = text;
    $('.correction').hidden = !c.correction;
    $('.correction').textContent = c.correction;
    const rules = rulesFor(c);
    const needsRules = /для игры, описанной|в (?:задании|задаче)\s*(?:№\s*)?19/i.test(text) && rules && c.number!==19 && !/первый ход делает|первым ходит/i.test(text);
    $('.context').hidden = !needsRules;
    $('.context .task').textContent = needsRules ? rules.text : '';
    const hint = /неудачн/i.test(text) ? 'Нарисуйте все разрешённые первые ходы. Найдите хотя бы один ход, после которого соперник сразу выигрывает.'
      : 'Начните с условия окончания игры. Для каждого разрешённого хода отметьте, кто будет ходить дальше. Для своей стратегии достаточно одного подходящего хода, для гарантии против соперника проверьте каждый его ответ.';
    $('.hint p').textContent = hint;
    $('.hint').open = $('.reveal').open = false;
    $('.reveal p').textContent = (c.correction?'Ответ по правилам игры: ':'Ключ сборника: ') + c.answer;
    $('input').value = '';
    $('input').placeholder = normalize(c.answer).includes(' ') ? 'Числа по порядку через пробел' : 'Запись ответа из условия';
    $('[role=status]').textContent = solved.has(c.title) ? 'Вы уже решили эту задачу.' : '';
    showProgress(); persist();
  }
  select.onchange = render;
  $('.next').onclick = () => {
    const start = select.selectedIndex;
    const number = available[start].number;
    for (let offset=1;offset<available.length;offset++) {
      const idx=(start+offset)%available.length;
      if (available[idx].number===number) {select.selectedIndex=idx; render(); select.focus(); return;}
    }
  };

  $('.reveal summary').addEventListener('click', () => {
    if (!$('.reveal').open) { viewed.add(select.value); persist(); }
  });
  $('form').onsubmit = event => {
    event.preventDefault();
    const c=available[select.selectedIndex], actual=normalize($('input').value), expected=normalize(c.answer);
    const status=$('[role=status]');
    if (!actual) { status.textContent='Введите целое число или несколько чисел в порядке из условия.'; return; }
    if (actual===expected) {
      if (viewed.has(c.title) || $('.reveal').open) { status.textContent='Ответ совпал с открытым ключом. Попробуйте следующую задачу самостоятельно.'; return; }
      solved.add(c.title); showProgress(); persist(); status.textContent='Верно. Попробуйте другую задачу этого номера.'; return;
    }
    status.textContent = actual.split(' ').length !== expected.split(' ').length
      ? 'Проверьте формат и количество значений в ответе.'
      : 'Проверьте условие выигрыша, момент остановки и ответы соперника на каждый ход.';
  };
  if (available.some(c=>c.title===saved?.current)) select.value=saved.current;
  render();
})();
