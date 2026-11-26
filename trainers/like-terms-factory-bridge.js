// Subject-local lesson. The three factory modes keep their original progress store.
(function () {
  'use strict';

  const storageKey = 'likeTermsFactory.brackets.v1';
  const steps = [
    {
      id: 'boxes', title: 'Что повторяется в каждой коробке?',
      prompt: 'На ленте три одинаковые коробки. В запаянном пакете x шайб. Загляни хотя бы в одну коробку и предскажи, сколько отдельных шайб будет во всей партии. Пакеты остаются закрытыми.',
      expected: '6', label: 'Число отдельных шайб',
      hints: ['Какие шайбы можно сосчитать, даже если пакет запаян?', 'Сколько раз ты получишь пару отдельных шайб, если распакуешь все коробки?'],
      error: 'Посчитай только шайбы за пределами запаянных пакетов.',
      explain: 'Получилось три пакета и шесть отдельных шайб. Количество шайб в одном пакете по-прежнему обозначено буквой x.'
    },
    {
      id: 'from-boxes', title: 'Запиши, что вышло из коробок',
      expression: '3(x + 2)', prompt: 'Три одинаковых пакета с x шайбами и шесть отдельных шайб пересыпали на ленту. Сколько всего шайб на ленте? Запиши выражение без скобок.',
      expected: '3x+6', label: 'Выражение для всей партии',
      hints: ['Как обозначить шайбы в трёх запаянных пакетах?', 'Запиши отдельно число шайб в пакетах и число отдельных шайб. Как их объединить?'],
      error: 'Проверь обе части записи. В каждой коробке были и пакет, и две отдельные шайбы.',
      explain: '3(x + 2) = 3x + 3 · 2 = 3x + 6. Множитель перед скобками относится к каждому слагаемому внутри. Это распределительное свойство умножения.'
    },
    {
      id: 'distribute', title: 'Раскрой скобки в журнале фабрики',
      expression: '2(a + 3) − a', prompt: 'На ленту высыпали две коробки, затем сняли с неё один пакет. Запиши первую строку без скобок. Вычисли произведения и оставь три отдельных слагаемых, чтобы было видно, откуда взялось каждое.',
      expected: '2a+6-a', form: 'expanded', label: 'Строка после раскрытия',
      hints: ['Где заканчивается содержимое коробки?', 'Число перед скобками умножает оба слагаемых внутри. Последнее слагаемое уже стояло снаружи.'],
      error: 'Проверь, что изменилось при открытии коробок, и сохрани действие после скобки.',
      explain: '2(a + 3) − a = 2a + 6 − a. Два слагаемых пришли из коробок, а −a уже стояло снаружи.'
    },
    {
      id: 'collect', title: 'Сверни запись в одну строку',
      expression: '2a + 6 − a', prompt: 'На ленте три слагаемых. Какие из них можно собрать в одну группу? Введи полностью приведённую сумму.',
      expected: 'a+6', label: 'После приведения подобных',
      hints: ['Сравни буквенные части. Что здесь обозначает число без буквы?', 'У слагаемого −a тоже есть коэффициент.'],
      error: 'Проследи, сколько пакетов сняли, и что осталось от отдельных шайб.',
      explain: '2a − a = (2 − 1)a = a. Отдельные шесть шайб остаются. Получилось a + 6.'
    },
    {
      id: 'error-sign', title: 'Найди сбой в чужой записи',
      expression: '8b − (3b − 2) = 8b − 3b − 2',
      prompt: 'Ученик раскрыл скобки. Какое замечание объясняет его ошибку?',
      choices: [
        ['outer-term', 'Перед раскрытием нужно поменять знак у 8b.'],
        ['inner-minus', 'Вычитается вся разность. Проверь знак, который получила двойка.'],
        ['join-first', 'Сначала нужно сложить 3b и число 2.']
      ], valid: ['inner-minus'],
      hints: ['Что именно вычитают из 8b?', 'Прочти знак перед скобками как умножение всего выражения в скобках на −1.'],
      error: 'Подставь b = 1 и сравни обе стороны. Затем проследи путь каждого знака.',
      explain: 'При b = 1 слева 8 − (3 − 2) = 7, а справа 8 − 3 − 2 = 3. Одного такого значения достаточно, чтобы опровергнуть равенство.'
    },
    {
      id: 'correct-sign', title: 'Исправь запись самостоятельно',
      expression: '8b − (3b − 2)', prompt: 'Теперь раскрой скобки и приведи подобные. Введи итог.',
      expected: '5b+2', label: 'Исправленный результат',
      hints: ['Перепиши разность как сумму с противоположным выражением.', 'Какой знак даст произведение (−1) · (−2)?'],
      error: 'Проверь отдельно коэффициент при b и знак числа без буквы.',
      explain: '8b − (3b − 2) = 8b − 3b + 2 = 5b + 2.'
    },
    {
      id: 'product', title: 'Какая операция стоит между деталями?',
      expression: '2x + 3x = 5x²', prompt: 'В журнале появилась степень. Какая правка и какое объяснение подходят вместе?',
      choices: [
        ['square', 'Оставить x². Две одинаковые буквы в сумме всегда дают квадрат.'],
        ['multiply', 'Записать 6x². Для двух одночленов нужно перемножить коэффициенты.'],
        ['add-coefficients', 'Записать 5x. Складываются количества одинаковых деталей x.']
      ], valid: ['add-coefficients'],
      hints: ['Сравни действия 2x + 3x и 2x · 3x.', 'Возьми x = 2. Сколько дают два слагаемых в сумме?'],
      error: 'Посмотри на знак между одночленами. Выбранное объяснение должно описывать именно это действие.',
      explain: '2x + 3x = (2 + 3)x = 5x. При умножении тех же одночленов получаем 2x · 3x = 6x². При x = 2 неверная запись из журнала даёт 10 = 20.'
    },
    {
      id: 'negative-factor', title: 'Два действия в одной записи',
      expression: '3y − 2(y − 4)', prompt: 'От коробок осталась только запись. Раскрой скобки и приведи подобные слагаемые.',
      expected: 'y+8', label: 'Упрощённое выражение',
      hints: ['Какой множитель стоит перед скобками вместе со знаком?', 'Запиши на черновике два произведения с этим множителем.'],
      error: 'Проверь отдельно, что произошло с y и с отрицательной четвёркой.',
      explain: '3y − 2(y − 4) = 3y − 2y + 8 = y + 8.'
    },
    {
      id: 'method', title: 'Выбери свой первый ход',
      expression: '4(a + 2a) − a', prompt: 'Как начнёшь упрощение? Выбери допустимый ход. Следующую строку ты запишешь выбранным способом.',
      choices: [
        ['inside', 'Сначала собрать подобные внутри скобок.'],
        ['distribute', 'Сначала умножить каждое слагаемое в скобках на 4.'],
        ['outside', 'Сначала вычесть последнее a из суммы внутри скобок.']
      ], valid: ['inside', 'distribute'],
      hints: ['Отметь границу скобок. Какие слагаемые стоят внутри одной суммы?', 'Первый ход допустим, если значение выражения сохранится при любом a.'],
      error: 'Последнее a стоит вне произведения. Если перенести его внутрь, оно тоже попадёт под множитель 4.',
      explain: 'Здесь можно как привести подобные внутри скобок, так и применить распределительное свойство.'
    },
    { id: 'method-line', title: 'Выполни выбранный ход', expression: '4(a + 2a) − a' },
    {
      id: 'method-result', title: 'Доведи свой способ до ответа',
      expression: '4(a + 2a) − a', prompt: 'Запиши полностью упрощённое выражение.',
      expected: '11a', label: 'Результат',
      hints: ['Сколько слагаемых с буквой a осталось после первого хода?', 'Не потерялось ли слагаемое после скобок?'],
      error: 'Проверь, сколько раз взята сумма в скобках и что вычитается в самом конце.',
      explain: 'Оба способа сходятся. Через скобки: 4 · 3a − a = 11a. Через раскрытие: 4a + 8a − a = 11a.'
    },
    {
      id: 'perimeter', title: 'Перенос в геометрию', checkpoint: true,
      prompt: 'Стороны прямоугольной рамки равны t + 3 и t − 1 сантиметров, где t > 1. Запиши её периметр в сантиметрах в виде полностью приведённой суммы.',
      expected: '4t+4', label: 'Выражение для периметра',
      explain: 'P = 2(t + 3) + 2(t − 1) = 4t + 4. Можно также сначала сложить две соседние стороны, а затем удвоить сумму.'
    },
    {
      id: 'balance', title: 'Перенос в уравнение', checkpoint: true,
      prompt: 'Весы в равновесии. Слева три коробки по n + 2 детали, справа два пакета по n деталей и ещё 13 отдельных деталей. Все детали весят одинаково, тара ничего не весит. В первой строке запиши число деталей на левой чаше. Раскрой скобки, вычисли произведения и приведи подобные слагаемые. Во второй строке укажи, сколько деталей в одном пакете.',
      expected: '7', label: 'Число деталей в пакете',
      explain: '3(n + 2) = 2n + 13. После раскрытия 3n + 6 = 2n + 13, откуда n = 7. Проверка: по 27 деталей на каждой чаше.'
    }
  ];

  const methods = {
    inside: {
      prompt: 'Ты решил начать внутри скобок. Какой одночлен заменит только сумму a + 2a?',
      expected: '3a', label: 'Вместо суммы внутри скобок',
      hints: ['Что обозначает один экземпляр a?', 'Какие коэффициенты складываются внутри скобок?'],
      error: 'Запиши только то, что будет внутри скобок после этого хода.',
      explain: 'Внутри a + 2a = 3a. Полная строка сейчас имеет вид 4 · 3a − a.'
    },
    distribute: {
      prompt: 'Ты решил раскрыть скобки. Вычисли произведения и запиши три слагаемых до приведения подобных.',
      expected: '4a+8a-a', form: 'expanded', label: 'Раскрытая сумма',
      hints: ['Какие два слагаемых умножаются на 4?', 'Проверь, где стояло последнее вычитаемое.'],
      error: 'Проследи судьбу каждого слагаемого и его знака.',
      explain: 'После распределения получаем 4a + 8a − a.'
    }
  };

  function readProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved && saved.steps && typeof saved.steps === 'object' && !Array.isArray(saved.steps)) {
        return saved;
      }
    } catch { /* The lesson can run in memory when storage is unavailable. */ }
    return null;
  }

  let progress = readProgress() || { current: steps[0].id, steps: {} };
  let currentPage = progress.current;
  let canSave = true;
  // Each event updates its own field on the latest saved record. A second open
  // tab can keep its place without rolling back an answer or a later draft.
  function update(change) {
    if (canSave) progress = readProgress() || progress;
    change();
    if (canSave) {
      try { localStorage.setItem(storageKey, JSON.stringify(progress)); }
      catch { canSave = false; }
    }
  }
  function updateStep(id, change) {
    update(() => {
      const state = record(id);
      if (!state.done) change(state);
    });
    return record(id);
  }
  function record(id) {
    if (!progress.steps[id] || typeof progress.steps[id] !== 'object') {
      progress.steps[id] = { draft: '', attempts: 0, hints: 0, first: null, done: false };
    }
    return progress.steps[id];
  }
  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function button(label, id, action, secondary = false) {
    const node = element('button', label, secondary ? 'secondary' : '');
    node.type = 'button';
    if (id) node.id = id;
    node.addEventListener('click', action);
    return node;
  }
  const firstUnfinished = () => steps.findIndex(step => !record(step.id).done);
  function goTo(id) {
    currentPage = id;
    update(() => { progress.current = id; });
    render(true);
  }
  function stepFor(index) {
    const step = steps[index];
    if (step.id !== 'method-line') return step;
    const method = record('method').draft === 'distribute' ? methods.distribute : methods.inside;
    return { ...step, ...method };
  }
  function statusMessage(code, step) {
    if (code === 'empty') return step.choices ? 'Выбери свой вариант.' : 'Сначала введи ответ.';
    if (code === 'syntax') return 'Проверь запись. Используй целые числа, буквы, знаки действий и скобки. Введи только ответ, без знака равенства.';
    if (step.checkpoint) return 'Пока ответ не принят. Проверь своё решение и попробуй ещё раз.';
    if (code === 'expand') return 'Значение сохранилось. Раскрой скобки, как просит задание.';
    if (code === 'collect') return 'Значение сохранилось. Выполни оставшиеся действия и приведи подобные.';
    if (code === 'multiply') return 'Значение сохранилось. Вычисли произведение в каждом слагаемом и оставь слагаемые раздельно.';
    if (code === 'terms') return 'Значение сохранилось. Здесь нужна промежуточная строка: покажи отдельное слагаемое от каждого умножения и сохрани слагаемое снаружи.';
    return step.error;
  }
  function feedback(node, text, type) {
    node.className = 'fb ' + type;
    node.textContent = text;
  }
  function showCrates(parent, state) {
    const group = element('div', undefined, 'bridge-choices');
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Три одинаковые коробки');
    for (let i = 0; i < 3; i++) {
      const crate = button('', null, () => {
        state = updateStep('boxes', latest => { latest.opened = (latest.opened || 0) | (1 << i); });
        showContents();
      }, true);
      crate.dataset.box = i;
      function showContents() {
        const opened = state.done || Boolean((state.opened || 0) & (1 << i));
        crate.replaceChildren(element('span', 'Коробка ' + (i + 1)));
        if (opened) {
          for (const item of ['Пакет x', 'Шайба', 'Шайба']) crate.append(element('span', item, 'bridge-cargo'));
        } else crate.append(element('span', 'Открыть крышку'));
        crate.setAttribute('aria-expanded', String(opened));
      }
      crate.classList.add('bridge-parcel');
      showContents();
      group.append(crate);
    }
    parent.append(group);
  }
  function answerControl(form, step, state) {
    if (step.choices) {
      const group = element('fieldset', undefined, 'bridge-choices');
      group.append(element('legend', 'Твой выбор'));
      for (const [value, text] of step.choices) {
        const label = element('label');
        const radio = element('input');
        radio.type = 'radio';
        radio.name = 'bridge-choice';
        radio.value = value;
        radio.checked = state.draft === value;
        radio.disabled = state.done;
        radio.addEventListener('change', () => updateStep(step.id, latest => { latest.draft = value; }));
        label.append(radio, document.createTextNode(' ' + text));
        group.append(label);
      }
      form.append(group);
    } else {
      if (step.id === 'balance') {
        const leftLabel = element('label', 'Слева после раскрытия скобок');
        leftLabel.htmlFor = 'bridgeBalanceLeft';
        const left = element('input', undefined, 'bridge-answer');
        left.id = 'bridgeBalanceLeft';
        left.maxLength = 240;
        left.autocomplete = 'off';
        left.spellcheck = false;
        left.value = state.leftDraft || '';
        left.readOnly = state.done;
        left.addEventListener('input', () => updateStep(step.id, latest => { latest.leftDraft = left.value; }));
        form.append(leftLabel, left);
      }
      const label = element('label', step.label);
      label.htmlFor = 'bridgeAnswer';
      const input = element('input', undefined, 'bridge-answer');
      input.id = 'bridgeAnswer';
      input.type = 'text';
      input.maxLength = 240;
      input.autocomplete = 'off';
      input.spellcheck = false;
      if (['boxes', 'balance'].includes(step.id)) input.inputMode = 'numeric';
      input.value = state.draft || '';
      input.readOnly = state.done;
      input.addEventListener('input', () => updateStep(step.id, latest => { latest.draft = input.value; }));
      form.append(label, input);
    }
  }

  function navigation(parent, index, state) {
    const nav = element('div', undefined, 'controls');
    if (index > 0) nav.append(button('Назад', 'bridgePrev', () => goTo(steps[index - 1].id), true));
    if (state.done) {
      const last = index === steps.length - 1;
      nav.append(button(last ? 'Итоги работы' : 'Дальше →', 'bridgeNext',
        () => goTo(last ? 'summary' : steps[index + 1].id)));
    }
    parent.append(nav);
  }
  function renderStep(root, index, moveFocus) {
    const step = stepFor(index);
    let state = record(step.id);
    root.dataset.step = step.id;
    root.append(element('p', 'Шаг ' + (index + 1) + ' из ' + steps.length +
      (step.checkpoint ? ' · Самостоятельная проверка' : ''), 'bridge-progress'));
    const heading = element('h2', step.title);
    heading.tabIndex = -1;
    root.append(heading);
    if (step.expression) root.append(element('div', step.expression, 'expr'));
    root.append(element('p', step.prompt, 'bridge-prompt'));
    if (step.id === 'boxes') showCrates(root, state);
    const form = element('form', undefined, 'bridge-form');
    answerControl(form, step, state);
    const message = element('div');
    message.id = 'bridgeFeedback';
    message.setAttribute('role', 'status');
    const controls = element('div', undefined, 'controls');
    if (!state.done) {
      const check = element('button', 'Проверить');
      check.id = 'bridgeCheck';
      check.type = 'submit';
      controls.append(check);
      if (step.hints && state.hints < step.hints.length) {
        const hint = button(state.hints ? 'Ещё подсказка' : 'Подсказка', 'bridgeHint', () => {
          state = updateStep(step.id, latest => {
            latest.hints = Math.min(step.hints.length, latest.hints + 1);
          });
          if (state.done) { render(); return; }
          feedback(message, step.hints[state.hints - 1], 'warn');
          hint.textContent = 'Ещё подсказка';
          if (state.hints >= step.hints.length) hint.disabled = true;
        }, true);
        controls.append(hint);
      }
    }
    form.addEventListener('submit', event => {
      event.preventDefault();
      // Grade the visible form, including browser autofill or a paste on mobile.
      const draft = step.choices ? form.querySelector(':checked')?.value || '' : form.querySelector('#bridgeAnswer').value;
      const left = form.querySelector('#bridgeBalanceLeft');
      let status;
      let leftNeedsRevision = false;
      state = updateStep(step.id, latest => {
        if (step.id === 'boxes' && !latest.opened) { status = 'closed'; return; }
        latest.draft = draft;
        if (left) latest.leftDraft = left.value;
        if (!draft.trim() || (left && !left.value.trim())) { status = 'empty'; return; }
        status = step.choices ? (step.valid.includes(draft) ? 'correct' : 'wrong')
          : window.FactoryMath.check(draft, step.expected, step.form).status;
        if (left && status === 'correct') {
          status = window.FactoryMath.check(left.value, '3n+6').status;
          leftNeedsRevision = status !== 'correct';
        }
        latest.attempts++;
        if (!latest.first) latest.first = latest.hints ? 'assisted' : status === 'correct' ? 'correct' : 'wrong';
        latest.done = status === 'correct';
        latest.last = status;
      });
      if (state.done) {
        render();
        document.getElementById('bridgeNext').focus();
      } else if (leftNeedsRevision) {
        const text = status === 'collect' || status === 'multiply' || status === 'expand'
          ? 'В первой строке значение верно. Раскрой скобки, вычисли произведения и приведи подобные слагаемые.'
          : 'Проверь выражение для левой чаши в первой строке.';
        feedback(message, text, 'err');
      } else if (status === 'closed') {
        feedback(message, 'Открой крышку хотя бы одной коробки и посмотри, что в ней лежит.', 'warn');
      } else {
        const msg = status === 'empty' && left ? 'Заполни обе строки: выражение слева и число деталей в пакете.' : statusMessage(status, step);
        feedback(message, msg, status === 'empty' ? 'warn' : 'err');
      }
    });
    form.append(controls);
    root.append(form, message);
    if (state.done) feedback(message, 'Верно. ' + step.explain, 'ok');
    else if (state.hints && step.hints) feedback(message, step.hints[state.hints - 1], 'warn');
    else if (state.last) feedback(message, statusMessage(state.last, step), 'err');
    navigation(root, index, state);
    if (moveFocus) heading.focus();
  }

  function summary(root, moveFocus) {
    root.dataset.step = 'summary';
    const heading = element('h2', 'Итоги работы');
    heading.tabIndex = -1;
    root.append(heading);
    const independent = steps.filter(step => record(step.id).first === 'correct').length;
    const helped = steps.filter(step => record(step.id).hints > 0).length;
    const revised = steps.length - independent - helped;
    root.append(element('p', 'С первой попытки без подсказки: ' + independent + '. После исправления без подсказки: ' + revised + '. С подсказкой: ' + helped + '.'));
    root.append(element('h3', 'Как прошёл самостоятельный перенос'));
    for (const step of steps.filter(item => item.checkpoint)) {
      const result = record(step.id).attempts === 1 ? 'с первой попытки' : 'после исправления';
      root.append(element('p', step.title + ' — ' + result + '.'));
    }
    const links = element('div', undefined, 'bridge-links');
    links.append(element('h3', 'Куда перейти дальше'));
    for (const [label, url] of [
      ['Аржеников · от упаковок к буквенной записи', 'oge-basics/multiplication-division/arzhenikov-map.html#course-b-expressions'],
      ['Макарычев, 7 класс · распределительное свойство', '../school/makarychev7/#lesson/p05'],
      ['Макарычев, 7 класс · тождества и преобразования выражений', '../school/makarychev7/#lesson/p06'],
      ['Многочлен и его стандартный вид', '../school/makarychev7/#lesson/p25'],
      ['Вынесение общего множителя', '../school/makarychev7/#lesson/p28'],
      ['Разложение способом группировки', '../school/makarychev7/#lesson/p30'],
      ['Формулы сокращённого умножения', 'formuly-sokrashchennogo-umnozheniya.html'],
      ['Никольский · рациональные выражения и ОДЗ', '../school/nikolsky10/#lesson/p11'],
      ['Алимов · равносильные уравнения и неравенства', '../school/alimov10-11/#lesson/p08']
    ]) {
      const link = element('a', label);
      link.href = url;
      links.append(link);
    }
    root.append(button('Дальше: многочлены и общий множитель', 'bridgeToPolynomials', () => {
      window.LikeTermsPolynomials.open(root, () => render(true));
    }));
    root.append(links, button('Посмотреть свои записи', 'bridgePrev', () => goTo(steps[0].id), true));
    if (moveFocus) heading.focus();
  }
  function render(moveFocus = false) {
    const root = document.getElementById('bridgeContent');
    root.replaceChildren();
    const first = firstUnfinished();
    const selected = steps.findIndex(step => step.id === currentPage);
    if (currentPage === 'summary' && first === -1) {
      summary(root, moveFocus);
    } else {
      const index = selected < 0 ? Math.max(0, first) : first < 0 ? selected : Math.min(first, selected);
      renderStep(root, index, moveFocus);
    }
  }
  window.LikeTermsBridge = { open: () => render(true) };
})();
