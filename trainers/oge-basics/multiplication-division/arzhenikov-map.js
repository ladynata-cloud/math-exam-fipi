'use strict';

(() => {
  const byId = id => document.getElementById(id);
  const links = [...document.querySelectorAll('#skills a')];
  const ids = links.map(link => link.hash.slice(1));
  const key = 'mathexam.arzhenikov.division.v1';
  const fresh = () => ({active: 'count', lessons: {}, lastCheck: null});
  let state;
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    state = saved && ids.includes(saved.active) && saved.lessons && typeof saved.lessons === 'object' ? saved : fresh();
  } catch { state = fresh(); }

  function save() {
    try { localStorage.setItem(key, JSON.stringify(state)); }
    catch { byId('storage').textContent = 'Сохранение в этом браузере недоступно. В этой вкладке можно продолжать занятие.'; }
  }

  function attempt(variant = 0, mode = 'boxes') {
    return {step: 0, moves: 0, values: [], help: false, usedHelp: false, errors: 0, done: false, variant, mode};
  }

  function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function button(text, action, primary = false) {
    const node = el('button', text, primary ? 'primary' : '');
    node.type = 'button';
    node.addEventListener('click', action);
    return node;
  }
  const field = (label, answer, feedback) => ({label, answer, feedback});
  const task = (prompt, equation, fields, hint, extras = {}) => ({prompt, equation, fields, hint, ...extras});
  const controlNumbers = [437, 453, 371, 491];
  function lessons(id, rec) {
    switch (id) {
      case 'count': return [
        task('В каждом лотке по две фишки. Посчитайте их парами. Сколько фишек в четырёх лотках?', '2 + 2 + 2 + 2', [field('Всего фишек', 8, 'Начните с двух и каждый раз прибавляйте ещё два.')], 'Касайтесь взглядом одного лотка за другим: два, четыре…', {rows: [4, 2]}),
        task('Добавили ещё один такой лоток. Сколько фишек стало? Посчитайте в уме.', '8 + 2', [field('Стало фишек', 10, 'Вспомните, сколько фишек в одном дополнительном лотке.')], 'Продолжите счёт от восьми одним шагом по два.')
      ];
      case 'share': return [
        task('Раздайте восемь фишек поровну по четырём лоткам. Сколько получит каждый?', '8 : 4', [field('В одном лотке', 2, 'Сосчитайте фишки в одном лотке после раздачи.')], 'За один круг каждый лоток получает одну фишку.', {model: {type: 'share', total: 8, size: 4}}),
        task('Теперь 12 фишек нужно раздать поровну по четырём лоткам. Решите без рисунка.', '12 : 4', [field('В одном лотке', 3, 'Попробуйте раздать по одной фишке в каждый лоток несколько раз.')], 'Четыре одинаковые доли вместе дают двенадцать.')
      ];
      case 'pack': return [
        task('Теперь в каждом лотке должно быть по четыре фишки. Наполните лотки из запаса в восемь фишек.', '8 : 4', [field('Полных лотков', 2, 'Нужно назвать число лотков, которые вы наполнили.')], 'Здесь четвёрка показывает, сколько кладут в один лоток.', {model: {type: 'pack', total: 8, size: 4}}),
        task('Для одного набора нужны три карандаша. Сколько полных наборов получится из двенадцати?', '12 : 3', [field('Полных наборов', 4, 'Считайте по три, пока не дойдёте до двенадцати.')], 'Посчитайте, сколько троек помещается в двенадцати.')
      ];
      case 'inverse': return [
        task('В одинаковых рядах по четыре фишки. Сколько рядов дают двадцать?', '4 × □ = 20', [field('Рядов', 5, 'Умножьте четыре на своё число. Должно получиться двадцать.')], 'Можно считать четвёрками, пока не дойдёте до двадцати.'),
        task('Вспомните подходящее произведение и решите деление.', '24 : 4', [field('Частное', 6, 'Проверьте своё число умножением на четыре.')], 'К четырём, взятым пять раз, прибавьте ещё четвёрку.')
      ];
      case 'bridge': {
        const digit = rec.mode === 'trial'
          ? task('Попробуйте цифру. Запишите, сколько предметов займут такие коробки и сколько понадобилось бы со следующей коробкой.', '52 : 8', [field('Пробная цифра', 6, 'Подберите цифру, при которой предметов хватит на все коробки, но не хватит ещё на одну.'), field('Предметов в коробках',48,'Умножьте свою цифру на восемь.'), field('С ещё одной коробкой',56,'Прибавьте восемь к своему произведению.')], 'Переберите соседние произведения восьмёрки. Число 52 должно оказаться между ними.')
          : task('В запасе 52 фишки. Наполняйте коробки по восемь, пока это возможно. Сколько коробок заполнено?', '52 : 8', [field('Полных коробок',6,'Посчитайте полные коробки, а оставшиеся фишки оставьте отдельно.')], 'Смотрите на свободные фишки. Хватает ли их ещё на восемь?', {model: {type:'pack',total:52,size:8}});
        return [digit,
          task('Рисунок убран. Восстановите запись по памяти.', '52 = 8 × □ + △', [field('Число коробок □',6,'Первое окно показывает число полных коробок.'),field('Оставшиеся фишки △',4,'Вычтите из 52 то, что поместилось в коробки.')], 'Проверьте и равенство, и то, что остаток меньше восьми.'),
          task('Делим 524 на 8 уголком. Начинаем с 52 десятков. Какую первую цифру запишете в частном?', '', [field('Первая цифра',6,'Сколько полных восьмёрок помещается в 52?')], 'Вспомните, сколько полных коробок вы получили при делении 52 на 8.', {angle:['524',8,'□□']}),
          task('После вычитания остались четыре десятка. Снесите четыре единицы и закончите деление.', '', [field('Вторая цифра',5,'Разделите 44 на 8 с остатком.'),field('Остаток',4,'Из 44 вычтите последнее произведение.')], 'Четыре десятка и четыре единицы вместе дают 44.', {angle:['524',8,'6□']})];
      }
      case 'zero': return [
        task('824 делим поровну на четыре. Каждый получил две сотни. Остались два десятка и четыре единицы. Сколько целых десятков сейчас получит каждый?', '', [field('Целых десятков',0,'Двух целых десятков на четверых не хватает. Как обозначить пустой разряд?')], 'Представьте две связки по десять. Можно ли выдать каждому хотя бы одну целую связку?', {angle:['824',4,'2□□']}),
        task('Разменяйте два десятка на единицы, добавьте четыре единицы и закончите запись.', '', [field('Частное целиком',206,'Оставьте место и для сотен, и для десятков, и для единиц.')], 'На четверых осталось 24 единицы. Сколько получит каждый?', {angle:['824',4,'20□']}),
        task('Другой пример. Запишите частное целиком, сохраняя место каждого разряда.', '615 : 3', [field('Частное',205,'После шести сотен остаётся один десяток. Можно ли раздать его троим целиком?')], 'После размена одного десятка получится пятнадцать единиц.')
      ];
      case 'remainder': return [
        task('Есть 23 карандаша. В коробке четыре места. Сколько коробок можно заполнить доверху и сколько карандашей останется?', '23 : 4', [field('Полных коробок',5,'Если взять ещё одну полную коробку, карандашей должно не хватить.'),field('Останется',3,'Вычтите из 23 число карандашей в заполненных коробках.')], 'Найдите последнее произведение четвёрки, которое не больше 23.'),
        task('Те же 23 карандаша нужно убрать все. Сколько понадобится коробок, включая неполную?', '23 карандаша · по 4 места', [field('Всего коробок',6,'Куда положить карандаши, оставшиеся после заполнения коробок?')], 'Остатку тоже понадобится место.')
      ];
      case 'transfer': {
        const n = controlNumbers[rec.variant % controlNumbers.length];
        const part = Math.floor(n / 10), first = Math.floor(part / 8);
        return [task('Решите уголком на бумаге. Укажите первую цифру, докажите свой выбор двумя произведениями и закончите деление.', '', [
          field('Первая цифра',first,'Проверьте первую цифру частного.'),
          field('8 × первая цифра',8 * first,'Проверьте произведение первой цифры и восьми.'),
          field('8 × (первая цифра + 1)',8 * (first + 1),'Проверьте произведение для цифры на единицу больше.'),
          field('Частное целиком',Math.floor(n / 8),'Проверьте обе цифры частного.'),
          field('Остаток',n % 8,'Проверьте обратным действием и сравните остаток с делителем.')
        ], '', {angle:[String(n),8,'□□']})];
      }
    }
  }

  function dots(n, className) {
    const node = el('span', undefined, className);
    for (let i = 0; i < n; i++) node.append(el('i', '', 'dot'));
    node.setAttribute('aria-hidden','true');
    return node;
  }
  function drawBoxes(parent, number, size) {
    const boxes = el('div', undefined, 'boxes');
    for (let i = 0; i < number; i++) boxes.append(dots(size, 'box'));
    parent.append(boxes);
  }
  function drawModel(parent, model, rec) {
    const visual = el('div');
    const stats = el('p', '', 'counter');
    stats.setAttribute('aria-live','polite');
    const buttons = el('div', undefined, 'actions');
    const share = model.type === 'share';
    const take = button(share ? 'Раздать по одной' : 'Наполнить коробку', () => change(1));
    const undo = button('Вернуть шаг', () => change(-1));
    function update() {
      const free = model.total - rec.moves * model.size;
      visual.replaceChildren();
      drawBoxes(visual, share ? model.size : rec.moves, share ? rec.moves : model.size);
      visual.append(dots(free, 'art loose'));
      stats.textContent = 'Свободно: ' + free + ' из ' + model.total + (share ? ' · Лотков: ' + model.size : ' · Коробок заполнено: ' + rec.moves);
      take.disabled = free < model.size;
      undo.disabled = rec.moves === 0;
    }
    function change(delta) {
      rec.moves = Math.min(Math.floor(model.total / model.size),Math.max(0,rec.moves + delta));
      byId('feedback').textContent = ''; update(); save();
      if (take.disabled) undo.focus();
    }
    buttons.append(take, undo); parent.append(visual,stats,buttons); update();
  }
  function angle(parent, values) {
    const block = el('div', undefined, 'angle');
    block.setAttribute('aria-label', values[0] + ' разделить на ' + values[1] + ', частное ' + values[2]);
    block.append(el('span',values[0]),el('span',values[1],'divisor'),el('span',values[2],'answer'));
    parent.append(block);
  }
  const resultLabel = rec => rec.usedHelp ? 'С подсказкой' : rec.errors ? 'После исправления' : 'Самостоятельно';
  const modeLabel = mode => mode === 'trial' ? 'Проба цифры' : 'Коробки';
  function progress() {
    let done = 0;
    links.forEach((link, i) => {
      const id = ids[i], rec = state.lessons[id];
      link.querySelector('small')?.remove();
      if (rec?.done) { link.append(el('small',resultLabel(rec))); done++; }
      if (id === state.active) link.setAttribute('aria-current','step');
      else link.removeAttribute('aria-current');
    });
    byId('total').textContent = 'Пройдено ' + done + ' из ' + ids.length;
    byId('bar').value = done;
    if (state.lastCheck) {
      const c = state.lastCheck;
      byId('record').textContent = 'Последняя проверка: ' + c.n + ' : 8. Первый ответ: ' + (c.accurate ? 'все поля верны' : 'потребовалась правка') + '. Предшествующий вход: ' + (c.mode ? modeLabel(c.mode) : 'проверка сразу') + '.';
    }
  }
  function navigate(id, focus = true) {
    if (!ids.includes(id)) return;
    state.active = id;
    if (!state.lessons[id]) state.lessons[id] = attempt();
    if (matchMedia('(max-width:720px)').matches) byId('route').open = false;
    render(); save();
    if (focus) byId('heading').focus();
  }
  function render() {
    const id = state.active, rec = state.lessons[id];
    const stages = lessons(id,rec), current = stages[rec.step], host = byId('activity');
    progress(); host.replaceChildren(); byId('feedback').textContent = '';
    byId('heading').textContent = links[ids.indexOf(id)].firstChild.textContent;
    byId('phase').textContent = id === 'transfer' ? 'Самостоятельная проверка' : 'Навык ' + (ids.indexOf(id) + 1) + ' из ' + ids.length;
    byId('stepNo').textContent = rec.done ? 'Завершено' : 'Шаг ' + (rec.step + 1) + ' из ' + stages.length;
    if (rec.done) {
      byId('prompt').textContent = 'Навык пройден. ' + resultLabel(rec) + '.';
      const actions = el('div',undefined,'actions'), next = ids[ids.indexOf(id)+1];
      if (next) actions.append(button('Следующий навык',() => { location.hash = next; },true));
      actions.append(button(id === 'transfer' ? 'Другой пример' : 'Пройти ещё раз',() => {
        state.lessons[id] = attempt((rec.variant + 1) % controlNumbers.length,rec.mode); navigate(id);
      }));
      host.append(actions); return;
    }
    byId('prompt').textContent = current.prompt;
    if (id === 'bridge' && rec.step === 0) {
      const modes = el('div',undefined,'modes');
      for (const m of ['boxes','trial']) {
        const choice = button(modeLabel(m),() => {
          if (m === rec.mode) return;
          state.lessons[id] = attempt(0,m); save(); render();
        });
        choice.setAttribute('aria-pressed',String(rec.mode === m)); modes.append(choice);
      }
      host.append(modes);
    }
    const surface = el('div',undefined,'surface');
    if (current.angle) angle(surface,current.angle);
    else surface.append(el('div',current.equation,'equation'));
    if (current.rows) drawBoxes(surface,...current.rows);
    if (current.model) drawModel(surface,current.model,rec);
    host.append(surface);
    const form = el('form'), fields = el('div',undefined,'fields'), inputs = [];
    form.noValidate = true;
    current.fields.forEach((f,i) => {
      const label = el('label',f.label), input = el('input');
      input.type = 'text'; input.inputMode = 'numeric'; input.autocomplete = 'off'; input.maxLength = 8;
      input.value = rec.values[i] || '';
      input.addEventListener('input',() => { rec.values[i] = input.value; input.removeAttribute('aria-invalid'); save(); });
      label.append(input); fields.append(label); inputs.push(input);
    });
    const actions = el('div',undefined,'actions'), submit = el('button','Проверить','primary');
    submit.type = 'submit'; actions.append(submit);
    if (current.hint) actions.append(button('Подсказка',() => {
      rec.help = true; rec.usedHelp = true; hint.hidden = false; save();
    }));
    const hint = el('p',current.hint,'help');
    hint.hidden = !rec.help || !current.hint;
    form.append(fields,actions,hint); host.append(form);
    form.addEventListener('submit', event => {
      event.preventDefault();
      const report = byId('feedback');
      if (current.model && (rec.moves + 1) * current.model.size <= current.model.total) {
        report.textContent = 'Сначала закончите работу с фишками: в запасе хватает ещё на один шаг.'; return;
      }
      const empty = inputs.find(input => !input.value.trim());
      if (empty) { report.textContent = 'Заполните пустое поле.'; empty.focus(); return; }
      const wrong = current.fields.findIndex((f,i) => !/^\d+$/.test(inputs[i].value.trim()) || Number(inputs[i].value) !== f.answer);
      if (id === 'transfer' && !rec.errors) {
        state.lastCheck = {n:controlNumbers[rec.variant],accurate:wrong < 0,mode:state.lessons.bridge?.done ? state.lessons.bridge.mode : null};
      }
      if (wrong >= 0) {
        rec.errors++; inputs[wrong].setAttribute('aria-invalid','true'); inputs[wrong].focus();
        report.textContent = current.fields[wrong].feedback; progress(); save(); return;
      }
      if (rec.step + 1 === stages.length) rec.done = true;
      else { rec.step++; rec.moves = 0; rec.values = []; rec.help = false; }
      save(); render(); byId('heading').focus(); byId('feedback').textContent = rec.done ? 'Верно. Навык отмечен в карте.' : 'Верно. Теперь следующий шаг.';
    });
  }
  links.forEach(link => link.addEventListener('click', event => {
    if (location.hash === link.hash) { event.preventDefault(); navigate(link.hash.slice(1)); }
  }));
  window.addEventListener('hashchange',() => navigate(location.hash.slice(1)));
  const fromLink = location.hash.slice(1);
  navigate(ids.includes(fromLink) ? fromLink : state.active,false);
})();
