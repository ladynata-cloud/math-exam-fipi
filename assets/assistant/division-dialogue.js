/* Step-scoped help for the public long-division trainer. The same replies run on the server. */
(function (root, factory) {
  'use strict';
  const dialogue = factory();
  if (typeof module === 'object' && module.exports) module.exports = dialogue;
  else dialogue.mount(root);
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';

  const moves = {
    start: ['Сравни первую цифру слева с делителем. Если её мало и в целой части ещё есть цифра, возьми соседнюю справа.',
      'Поставь палец на первую цифру делимого. Уже хватает на один делитель?',
      'Делим по разрядам слева направо. Начинаем с самой короткой части, из которой можно взять делитель. Если вся целая часть мала, сначала работаем с ней.'],
    count: ['Найди в уголке последнюю цифру числа, с которого начинаешь деление. Посчитай места от неё до конца целой части.',
      'Покажи пальцем, где появится первая цифра ответа. Сколько мест от неё до запятой или конца целого числа?',
      'На последнюю цифру первого неполного делимого приходится первое место частного. Каждый следующий разряд целой части даёт ещё одно место.'],
    digit: ['Попробуй одну цифру. Умножь на неё делитель и сравни результат с неполным делимым.',
      'Выбери маленькую цифру для пробы. Сколько получится, если взять делитель столько раз?',
      'Цифра показывает, сколько целых групп помещается. Произведение должно поместиться, а для ещё одной группы места уже не хватит.'],
    product: ['Найди только что записанную цифру частного. Умножь на неё делитель.',
      'Прочитай два числа в строке со знаком умножения. Возьми первое столько раз, сколько показывает второе.',
      'Так мы узнаём, сколько уже распределили. Потом это число можно будет вычесть.'],
    subtract: ['Посмотри на два числа у знака минус. Начни вычитание с единиц.',
      'Найди нижнее число. Сколько останется, если убрать столько из верхнего?',
      'Верхнее число показывает, сколько было. Нижнее — сколько уже распределили в группы.'],
    'remainder-check': ['Сравни остаток с делителем. Поместится ли в остатке ещё одна целая группа?',
      'Посмотри на два числа в вопросе. Которое из них меньше?',
      'Когда можно взять ещё целую группу, цифру частного можно увеличить. Поэтому проверяем, сколько осталось.'],
    bring: ['Посмотри, откуда в уголке идёт стрелка. Перепиши следующую цифру на нижнюю строку.',
      'Веди пальцем от следующей цифры сверху вниз. Какую цифру перенесёшь?',
      'Мы переходим к следующему разряду. Остаток вместе со снесённой цифрой образует новое число для деления.'],
    partial: ['Прочитай число в нижней строке после сноса цифры.',
      'Найди остаток. Какая цифра теперь стоит справа от него?',
      'Одна единица предыдущего разряда равна десяти единицам следующего. Поэтому новую цифру приписываем справа к остатку.'],
    comma: ['Посмотри на уже найденные цифры целой части и отметь её конец запятой.',
      'Найди в уголке целую часть результата. Где она заканчивается?',
      'Дальше делим десятые доли. Запятая отделяет найденную целую часть от дробной.'],
    answer: ['Прочитай свои цифры частного справа под чертой по порядку.',
      'Поставь палец на первую цифру под делителем. Прочитай запись слева направо.',
      'Каждая найденная цифра занимает своё место в частном. Теперь соединяем их в одно число.'],
    'final-remainder': ['Посмотри на последнюю строку вычитания. Какое число осталось?',
      'Найди нижнее число слева в уголке. Его нужно вписать в поле остатка.',
      'При делении с остатком записывают отдельно число полных групп и то, что осталось после них.'],
    verify: ['Начни проверку с умножения найденного частного на делитель. Если есть остаток, затем прибавь его.',
      'Посмотри на два числа около знака умножения. Начни с их произведения.',
      'Обратное действие собирает группы обратно. Если осталось что-то вне групп, это тоже нужно учесть.'],
    'shift-count': ['Посмотри на запятую в делителе. Сколько цифр стоит справа от неё?',
      'Найди число справа от знака деления. Покажи последнюю цифру после его запятой.',
      'Мы выбираем столько разрядов, чтобы делитель стал целым. Тогда можно делить уголком привычным способом.'],
    'shift-factor': ['Посмотри, на сколько мест переместилась запятая. За каждое место число увеличивается в десять раз.',
      'Начни с единицы. За каждый сдвиг вправо припиши к ней один ноль.',
      'При каждом сдвиге вправо цифры переходят на один разряд старше. Один и тот же сдвиг меняет оба числа во столько же раз.'],
    'shift-divisor': ['Сдвинь запятую в делителе на выбранное число мест вправо.',
      'Найди строку «Делитель». Прочитай число после сдвига.',
      'Так делитель становится целым. Одинаковый сдвиг в обоих числах сохраняет частное.'],
    'shift-dividend': ['Сдвинь запятую в делимом на столько же мест вправо, как в делителе.',
      'Найди число слева от знака деления. Проследи пальцем тот же сдвиг, что уже сделал в делителе.',
      'Если измерить обе длины в более мелких единицах, числа увеличатся одинаково. Количество раз, которое одна длина укладывается в другой, сохранится.']
  };

  function reply(message, context, previous) {
    const move = context && Object.hasOwn(moves, context.step) && moves[context.step];
    if (!move) return {text:'Открой текущий шаг в тренажёре деления.', intent:'clarify'};
    const query = String(message || '').trim().toLowerCase().replace(/ё/g, 'е');
    const simpler = /проще|понятнее|не понял|не поняла|еще раз|все равно|другими словами/.test(query);
    const why = /почему|зачем|смысл|обосну/.test(query);
    const next = /дальше|следующ|с чего|что (?:делать|сделать)|подска|какую цифру|подобрать|помоги|не понимаю|застрял|как (?:считать|реш|делить|найти|выбрать|начать)/.test(query);
    if (!simpler && !why && !next) {
      return {text:'Могу объяснить действие в этом шаге. Спросишь, с чего начать или почему оно работает?', intent:'clarify'};
    }
    if (context.step.startsWith('shift-') && (why || (simpler && previous === 'why'))) {
      if (simpler) return {text:'Представь ленту и короткий кусочек. Измерь оба в сантиметрах вместо метров. Изменится ли число таких кусочков в ленте?', intent:'simpler'};
      return {text:'Деление показывает, сколько раз делитель укладывается в делимом. Если обе величины измерить в одинаковых более мелких единицах, оба числа вырастут во столько же раз. Число групп сохранится.', intent:'why'};
    }
    if (why) return {text:move[2], intent:'why'};
    const intent = simpler ? 'simpler' : 'next';
    let text = simpler || previous === 'next' ? move[1] : move[0];
    const {step, divisor, partial, attempt} = context;
    if (step === 'digit' && Number.isSafeInteger(divisor) && divisor > 0 &&
        Number.isSafeInteger(partial) && partial >= 0) {
      if (Number.isInteger(attempt) && attempt >= 0 && attempt <= 9 && attempt * divisor > partial) {
        text = simpler
          ? 'Ты взял ' + attempt + ' групп по ' + divisor + '. Попробуй взять на одну группу меньше. Поместится в ' + partial + '?'
          : 'Ты пробуешь ' + attempt + '. Произведение больше ' + partial + '. Какую меньшую цифру проверишь?';
      } else if (Number.isInteger(attempt) && attempt >= 0 && attempt < 9 && (attempt + 1) * divisor <= partial) {
        text = simpler
          ? 'Ты уже взял ' + attempt + ' раз по ' + divisor + '. Добавь ещё одну такую группу. Получилось больше ' + partial + ' или пока хватает?'
          : 'После пробы с цифрой ' + attempt + ' осталось место ещё для целой группы по ' + divisor + '. Какую цифру попробуешь теперь?';
      } else if (simpler || previous === 'next') {
        text = 'Перед тобой ' + partial + '. Попробуй отсчитывать по ' + divisor + '. Сколько целых групп поместится?';
      } else {
        text = 'Подбери цифру для ' + partial + ' : ' + divisor + '. Умножь на неё ' + divisor + '. Получилось больше ' + partial + ' или ещё помещается?';
      }
    } else if (step === 'shift-count' && simpler && /^\d{1,8}[,.]\d{1,8}$/.test(context.originalDivisor || '')) {
      text = 'Найди делитель ' + context.originalDivisor + '. Отметь карандашом цифры справа от запятой. Сколько их?';
    }
    return {text, intent};
  }

  function mount(w) {
    const d = w.document;
    const get = id => d.getElementById(id);
    const help = get('help-content');
    if (!help || !w.DivisionGuided || get('division-dialogue')) return;

    // The native help toggle owns the hint counter. Keep the standard table,
    // optional full explanation and explicit answer reveal on the same step.
    const nativeHint = d.createElement('details');
    const summary = d.createElement('summary');
    summary.textContent = 'Подсказка и запись в уголке';
    nativeHint.append(summary);
    nativeHint.append(get('hint-text'), get('multiples'));
    help.prepend(nativeHint);

    const style = d.createElement('style');
    style.textContent = `
      #division-dialogue {display:grid;gap:.55rem;margin:.5rem 0 1rem;min-width:0}
      #division-dialogue label {margin:0}
      #division-dialogue [data-questions] {display:flex;flex-wrap:wrap;gap:.35rem}
      #division-dialogue button {justify-self:start}
      #division-question {box-sizing:border-box;width:100%;font-size:1rem}
      #division-use-service {width:auto;min-width:auto;padding:0}
      #division-conversation {overflow-wrap:anywhere}
      #division-conversation p {margin:.25rem 0 .75rem}
    `;
    d.head.append(style);
    const form = d.createElement('form');
    form.id = 'division-dialogue';
    form.innerHTML = '<label for="division-question">Спросить о текущем шаге</label>' +
      '<div data-questions><button type="button" class="quiet" data-question>С чего начать?</button> ' +
      '<button type="button" class="quiet" data-question>Объясни проще</button> ' +
      '<button type="button" class="quiet" data-question>Почему так?</button></div>' +
      '<label id="division-service-option" hidden><input id="division-use-service" type="checkbox"> Передавать вопрос и текущий шаг помощнику сайта</label>' +
      '<input id="division-question" type="text" maxlength="240" autocomplete="off" placeholder="Например, какую цифру попробовать?"> ' +
      '<button class="quiet" type="submit">Спросить</button>' +
      '<div id="division-conversation" role="log" aria-live="polite" aria-label="Разговор об этом шаге"></div>';
    help.prepend(form);
    const history = get('division-conversation'), input = get('division-question');
    const useService = get('division-use-service');
    const updateService = () => {get('division-service-option').hidden = !w.SiteDialogueClient?.enabled;};
    w.addEventListener('site-dialogue-ready', updateService);
    updateService();
    let previous, remoteState, pending, identity, plan, taskKey, stepIndex, attempt;
    useService.addEventListener('change', () => {pending?.abort(); remoteState = undefined;});
    function refresh() {
      const operands = get('problem').textContent.split(' : ');
      const key = get('topic-label').textContent + '|' + operands.join(':');
      const step = Number(get('step-counter').textContent.match(/\d+/)?.[0]) - 1;
      const newIdentity = key + '|' + step;
      if (identity === newIdentity) return;
      identity = newIdentity;
      pending?.abort();
      previous = remoteState = attempt = undefined;
      history.replaceChildren();
      input.value = '';
      nativeHint.open = false;
      stepIndex = step;
      if (key === taskKey) return;
      taskKey = key;
      const topic = w.DivisionGuided.topics.find(item => item.title === get('topic-label').textContent);
      plan = undefined;
      if (!topic || operands.length !== 2) return;
      const {level} = w.DivisionGuided.make(topic.id);
      plan = w.DivisionGuided.plan({topicId:topic.id, level, dividend:operands[0], divisor:operands[1]});
    }

    get('answer-form').addEventListener('submit', () => {
      const value = get('answer').value.trim();
      attempt = /^\d$/.test(value) ? Number(value) : undefined;
    }, true);
    d.addEventListener('mathexam:division-step', refresh);
    refresh();

    async function ask(message) {
      refresh();
      const action = plan?.actions[stepIndex];
      if (!action || !message || get('question').hidden) return;
      const context = {surface:'division', step:action.kind, divisor:plan.normalizedDivisor,
        dividend:plan.task.dividend, originalDivisor:plan.task.divisor};
      if (action.kind === 'digit') {
        context.partial = plan.cycles[action.cycle].partial;
        if (attempt !== undefined) context.attempt = attempt;
      }
      const local = reply(message, context, previous);
      previous = local.intent;
      const turn = d.createElement('p');
      const question = d.createElement('strong');
      question.textContent = message;
      const response = d.createElement('span');
      response.textContent = local.text;
      turn.append(question, d.createElement('br'), response);
      history.append(turn);
      if (history.children.length > 3) history.firstElementChild.remove();
      input.value = '';

      pending?.abort();
      if (!useService.checked || !w.SiteDialogueClient?.enabled) return;
      const request = new w.AbortController();
      pending = request;
      try {
        const requestData = {site:'mathexam', message, context};
        if (remoteState) requestData.state = remoteState;
        const result = await w.SiteDialogueClient.ask(requestData, {signal:request.signal});
        if (!request.signal.aborted && result?.site === 'mathexam' && typeof result.reply === 'string' && result.reply.trim()) {
          response.textContent = result.reply;
          remoteState = result.state;
        }
      } catch {
        // The local reply above is already visible when the service is unavailable.
      }
    }
    form.addEventListener('submit', event => {event.preventDefault(); ask(input.value.trim());});
    form.addEventListener('click', event => {
      const button = event.target.closest('button[data-question]');
      if (button) ask(button.textContent);
    });
  }

  return {reply, mount};
});
