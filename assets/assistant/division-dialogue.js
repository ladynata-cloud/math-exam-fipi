/* Step-scoped help for the public long-division trainer. The same replies run on the server. */
(function (root, factory) {
  'use strict';
  const dialogue = factory();
  if (typeof module === 'object' && module.exports) module.exports = dialogue;
  else dialogue.mount(root);
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';

  const moves = {
    start: ['Сравни первую цифру слева с делителем: её уже хватает на один делитель?',
      'Поставь палец на первую цифру делимого. Уже хватает на один делитель?',
      'Делим по разрядам слева направо. Начинаем с самой короткой части, из которой можно взять делитель. Если вся целая часть мала, сначала работаем с ней.'],
    count: ['Найди в уголке последнюю цифру числа, с которого начинаешь деление. Посчитай места от неё до конца целой части.',
      'Покажи пальцем, где появится первая цифра ответа. Сколько мест от неё до запятой или конца целого числа?',
      'На последнюю цифру первого неполного делимого приходится первое место частного. Каждый следующий разряд целой части даёт ещё одно место.'],
    digit: ['Выбери одну цифру для пробы.',
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
    verify: ['Начни проверку с умножения найденного частного на делитель.',
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

  const simplerReasons = {
    start: 'Из слишком маленькой части нельзя взять даже одну целую группу. Поэтому сначала ищем часть, которой хватает.',
    count: 'Каждое место в частном отвечает своему разряду делимого: сотням, десяткам или единицам.',
    digit: 'Цифра — это число целых групп. Больше, чем есть, взять нельзя; если помещается ещё целая группа, проба пока мала.',
    product: 'Одна группа содержит делитель. Умножение считает, сколько всего в выбранных группах.',
    subtract: 'Из того, что было, убираем распределённую часть. Остальное и есть остаток.',
    'remainder-check': 'Если из остатка можно взять ещё целую группу, деление на этом разряде ещё не закончено.',
    bring: 'Остаток переводим в более мелкие единицы. Снесённая цифра занимает место справа, а не прибавляется как отдельное число.',
    partial: 'Например, одна десятка — это десять единиц. Цифра справа добавляет единицы к этому новому разряду.',
    comma: 'До запятой — целые части, после неё — доли единицы. Запятая отмечает эту границу.',
    answer: 'Цифры частного уже найдены. Их порядок и нули сохраняют значение числа.',
    'final-remainder': 'Остаток — это то, что не вошло в целые группы.',
    verify: 'Умножение собирает целые группы обратно. Остаток — та часть, которая была вне групп.'
  };
  const placeNames = {'0':'единиц','1':'десятков','2':'сотен','3':'тысяч','4':'десятков тысяч',
    '5':'сотен тысяч','6':'миллионов','7':'десятков миллионов',
    '-1':'десятых','-2':'сотых','-3':'тысячных','-4':'десятитысячных','-5':'стотысячных','-6':'миллионных'};
  const preferenceKey = 'mathexam.divisionHelp.preference.v1';
  const rememberedModes = new Set(['next','simpler','why','why-simple']);

  // Only an opt-in explanation preference is retained. The native trainer owns
  // task progress; questions, replies, operands and attempts are never stored here.
  function preferences(storage) {
    let enabled = false, intent = '', available = true;
    try {
      const saved = JSON.parse(storage.getItem(preferenceKey) || 'null');
      if (saved?.version === 1 && saved.enabled === true && rememberedModes.has(saved.intent)) {
        enabled = true; intent = saved.intent;
      }
    } catch { available = false; }
    function write() {
      try {
        if (enabled) storage.setItem(preferenceKey, JSON.stringify({version:1, enabled:true, intent:intent || 'next'}));
        else storage.removeItem(preferenceKey);
        available = true;
      } catch { available = false; enabled = false; }
    }
    return {
      read: () => ({enabled, intent, available}),
      enable(value) {enabled = value === true; if (!enabled) intent = ''; write(); return this.read();},
      remember(value) {if (enabled && rememberedModes.has(value)) {intent = value; write();} return this.read();},
      clear() {intent = ''; enabled = false; write(); return this.read();}
    };
  }

  function shiftedDividendHint(context) {
    const original = String(context.originalDivisor || '').replace('.', ',');
    const dividend = String(context.dividend || '').replace('.', ',');
    if (!/^\d+,\d{1,6}$/u.test(original) || !/^\d+(?:,\d+)?$/u.test(dividend)) return '';
    const [whole, decimalPart] = original.split(',');
    const fractionalDigits = decimalPart.replace(/0+$/u, '');
    if (!fractionalDigits || Number(whole + fractionalDigits) !== context.divisor) return '';
    const places = fractionalDigits.length;
    const remaining = (dividend.split(',')[1] || '').length;
    const zeros = places - remaining;
    const shifts = ['', 'один разряд', 'два разряда', 'три разряда', 'четыре разряда', 'пять разрядов', 'шесть разрядов'];
    const zeroCounts = ['', 'один ноль', 'два нуля', 'три нуля', 'четыре нуля', 'пять нулей', 'шесть нулей'];
    const first = remaining ? '' : 'У целого числа запятая стоит после последней цифры. ';
    return first + 'В числе ' + dividend + ' перенеси запятую вправо на ' + shifts[places] + ', как в делителе.' +
      (zeros > 0 ? ' Справа допиши ' + zeroCounts[zeros] + '.' : '');
  }

  function reply(message, context, previous) {
    const move = context && Object.hasOwn(moves, context.step) && moves[context.step];
    if (!move) return {text:'Открой текущий шаг в тренажёре деления.', intent:'clarify'};
    const query = String(message || '').trim().toLowerCase().replace(/ё/g, 'е');
    const priorIntent = typeof previous === 'string' ? previous : previous?.intent;
    const namedDigit = query.match(/(?:пробую|попробую|проверю|ввел[аи]?|беру|вз[яе]л[аи]?|цифр[ау])\s*([0-9])(?![\d.,])/u);
    const previousAttempt = typeof previous === 'object' ? previous?.attempt : undefined;
    const nativeAttempt = context.attempt ?? null;
    const nativeChanged = previous && typeof previous === 'object' && Object.hasOwn(previous,'nativeAttempt') && previous.nativeAttempt !== nativeAttempt;
    const attempt = namedDigit ? Number(namedDigit[1]) : nativeChanged ? context.attempt : previousAttempt ?? context.attempt;
    const reportedProduct = query.match(/^(?:получил(?:ось|а)?\s*|произведение\s*(?:равно|=)?\s*)?(\d{1,12})[.!]?$/u);
    const productFollowUp = context.step === 'digit' && reportedProduct &&
      ['digit-multiply','digit-compare','digit-extra'].includes(priorIntent) && Number.isInteger(attempt) && attempt >= 0 && attempt <= 9;
    const comparisonFollowUp = context.step === 'digit' && priorIntent === 'digit-compare' &&
      /больше|меньше|равно|помеща|влез|дальше/u.test(query);
    const simpler = /проще|понятнее|не понял|не поняла|еще раз|все равно|другими словами|запутал|маленький шаг|помедленнее/.test(query);
    const why = /почему|зачем|смысл|обосну/.test(query);
    const next = /дальше|следующ|с чего|что (?:делать|сделать)|подска|какую цифру|подобрать|помоги|не понимаю|застрял|как (?:считать|реш|делить|найти|выбрать|начать)/.test(query);
    const digitQuestion = context.step === 'digit' && /цифр|проб[ауеы]|(?:вв[её]л|стереть|стирать|входит|влез|помеща|сно[сш]|снес|разряд|групп)|умнож/u.test(query);
    const checkQuestion = context.step === 'verify' && /проверк|провер[ьия]|остат[оа]к|остатком|обратн[а-я]* действ/u.test(query);
    if (!simpler && !why && !next && !digitQuestion && !checkQuestion && !namedDigit && !productFollowUp && !comparisonFollowUp) {
      return {text:'Могу объяснить действие в этом шаге. Спросишь, с чего начать или почему оно работает?', intent:'clarify'};
    }
    const explaining = why || (simpler && ['why','why-simple'].includes(priorIntent));
    if (context.step.startsWith('shift-') && explaining) {
      if (simpler) return {text: priorIntent === 'why-simple'
        ? 'Лента и кусочек остались прежними. Изменилась только единица измерения, поэтому кусочков в ленте столько же.'
        : 'Представь ленту и короткий кусочек. Измерь оба в сантиметрах вместо метров. Числа вырастут одинаково, а число кусочков в ленте не изменится.', intent:'why-simple'};
      return {text:'Деление показывает, сколько раз делитель укладывается в делимом. Если обе величины измерить в одинаковых более мелких единицах, оба числа вырастут во столько же раз. Число групп сохранится.', intent:'why'};
    }
    if (explaining) return {text:simpler ? simplerReasons[context.step] || move[2] : move[2], intent:simpler ? 'why-simple' : 'why',
      ...(context.step === 'digit' && Number.isInteger(attempt) && attempt >= 0 && attempt <= 9 ? {attempt} : {})};
    const intent = simpler ? 'simpler' : 'next';
    let text = simpler || priorIntent === 'next' ? move[1] : move[0];
    const {step, divisor, partial} = context;
    if (step === 'digit' && Number.isSafeInteger(divisor) && divisor > 0 &&
        Number.isSafeInteger(partial) && partial >= 0) {
      if (partial < divisor && context.quotientStarted === true) {
        const place = Object.hasOwn(placeNames, context.placeExponent) ? 'в разряде ' + placeNames[context.placeExponent] : 'на этом месте частного';
        text = 'Здесь ' + partial + ' меньше ' + divisor + ': целой группы нет. Запиши 0 ' + place + '.';
      } else if (Number.isInteger(attempt) && attempt >= 0 && attempt <= 9) {
        if (productFollowUp && priorIntent === 'digit-extra') {
          if (Number(reportedProduct[1]) !== (attempt + 1) * divisor) {
            return {text:'Перепроверь сложение своего произведения ' + (attempt * divisor) + ' и ещё одной группы по ' + divisor + '.', intent:'digit-extra', attempt};
          }
          return {text:Number(reportedProduct[1]) > partial
            ? 'Ещё одна группа уже не помещается. Запиши в частном свою проверенную цифру.'
            : 'Ещё одна целая группа помещается. Выбери следующую цифру для пробы.', intent:'next', attempt};
        }
        if (productFollowUp && Number(reportedProduct[1]) === attempt * divisor) {
          return {text:'Сравни полученное ' + reportedProduct[1] + ' с ' + partial + ': произведение больше или ещё помещается?', intent:'digit-compare', attempt};
        }
        if (comparisonFollowUp) {
          const product = attempt * divisor;
          const claims = [];
          if (/не\s+(?:меньше|больше)\s+или\s+равно/u.test(query)) {
            return {text:'Уточни сравнение: ' + product + ' больше, меньше или равно ' + partial + '?', intent:'digit-compare', attempt};
          }
          // Treat an inclusive comparison as one claim, then check any remaining claims.
          const comparison = query
            .replace(/не\s*\(\s*(меньше|больше)\s+или\s+равно\s*\)/gu, (_, direction) => {
              claims.push(direction === 'меньше' ? product > partial : product < partial);
              return '';
            })
            .replace(/(меньше|больше)\s+или\s+равно/gu, (_, direction) => {
              claims.push(direction === 'меньше' ? product <= partial : product >= partial);
              return '';
            });
          if (/меньше/u.test(comparison)) claims.push(/не\s+меньше/u.test(comparison) ? product >= partial : product < partial);
          if (/больше/u.test(comparison)) claims.push(/не\s+больше/u.test(comparison) ? product <= partial : product > partial);
          if (/равно/u.test(comparison)) claims.push(/не\s+равно/u.test(comparison) ? product !== partial : product === partial);
          if (/помеща|влез/u.test(query)) claims.push(/не\s+помеща|не\s+влез/u.test(query) ? product > partial : product <= partial);
          if (claims.includes(false)) {
            return {text:'Перепроверь сравнение ' + product + ' и ' + partial + '. Какое число больше?', intent:'digit-compare', attempt};
          }
          if (product > partial) return {text:'Для этой пробы произведение слишком большое. Выбери цифру меньше своей пробы.', intent:'next', attempt};
          if (attempt === 9) return {text:'Эта цифра помещается, а больше одной цифры в этом месте быть не может. Запиши свою проверенную цифру.', intent:'next', attempt};
          return {text:'Проверим, хватит ли ещё на одну группу. Прибавь к своему произведению ' + product + ' ещё ' + divisor + '.', intent:'digit-extra', attempt};
        }
        text = productFollowUp
          ? 'Для этой пробы нужно произведение ' + attempt + ' × ' + divisor + '. Перепроверь только это умножение.'
          : simpler
            ? 'Одна группа — это ' + divisor + '. Для пробы ' + attempt + ' найди, сколько будет в ' + attempt + ' таких группах.'
            : 'Ты пробуешь ' + attempt + '. Вычисли только ' + attempt + ' × ' + divisor + '.';
        return {text, intent:'digit-multiply', attempt, preference:simpler ? 'simpler' : 'next'};
      } else if (partial < divisor) {
        text = 'Сколько целых групп по ' + divisor + ' можно взять из ' + partial + '?';
      } else if (simpler || priorIntent === 'next') {
        text = 'Перед тобой ' + partial + ', в одной группе ' + divisor + '. Назови одну цифру для пробы.';
      } else {
        text = 'Для ' + partial + ' : ' + divisor + ' выбери одну цифру для пробы. Можно написать «Пробую …».';
      }
    } else if (step === 'verify' && checkQuestion) {
      const quantities = query.match(/(?:^|[^\d.,+−/–-])(\d{1,12})\s*(?:[,(;]\s*)?(?:и\s+|с\s+)?(?:остат(?:ок|ком)|ост\.)\s*(?:[=:]\s*)?(\d{1,12})(?!\d|[.,/]\d)/u);
      if (quantities) {
        const original = String(context.originalDivisor || '').replace('.', ',');
        const verificationDivisor = /^\d+(?:,\d+)?$/u.test(original) && Number(original.replace(',','.')) > 0 ? original : String(divisor);
        text = Number(quantities[2]) >= Number(verificationDivisor.replace(',','.'))
          ? 'Сначала сравни указанный остаток ' + quantities[2] + ' с делителем ' + verificationDivisor + '. Остаток должен быть меньше делителя.'
          : 'Умножь своё частное ' + quantities[1] + ' на ' + verificationDivisor + '. Пока проверяем только это произведение.';
      }
    } else if (step === 'shift-dividend') {
      text = shiftedDividendHint(context) || text;
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
      #division-use-service, #division-remember-help {width:auto;min-width:auto;padding:0}
      #division-conversation {overflow-wrap:anywhere}
      #division-conversation p {margin:.25rem 0 .75rem}
    `;
    d.head.append(style);
    const form = d.createElement('form');
    form.id = 'division-dialogue';
    form.innerHTML = '<label for="division-question">Спросить о текущем шаге</label>' +
      '<p id="division-help-source">Подсказки к этому шагу подготовлены заранее и работают без ИИ.</p>' +
      '<div data-questions><button type="button" class="quiet" data-question>С чего начать?</button> ' +
      '<button type="button" class="quiet" data-question>Объясни проще</button> ' +
      '<button type="button" class="quiet" data-question>Почему так?</button></div>' +
      '<label id="division-service-option" hidden><input id="division-use-service" type="checkbox"> Передавать вопрос и текущий шаг помощнику сайта</label>' +
      '<input id="division-question" type="text" maxlength="240" autocomplete="off" placeholder="Например, какую цифру попробовать?"> ' +
      '<button class="quiet" type="submit">Спросить</button>' +
      '<div id="division-conversation" role="log" aria-live="polite" aria-label="Разговор об этом шаге"></div>' +
      '<label><input id="division-remember-help" type="checkbox"> Запомнить удобный способ объяснения</label>' +
      '<button id="division-forget-help" type="button" class="quiet" hidden>Сбросить выбор</button>' +
      '<small id="division-memory-status" role="status">Выбор можно сохранить только на этом устройстве. Текст разговора не сохраняется.</small>';
    help.prepend(form);
    const history = get('division-conversation'), input = get('division-question');
    const useService = get('division-use-service');
    let storage;
    try {storage = w.localStorage;} catch {storage = null;}
    const memory = preferences(storage);
    function showMemory() {
      const saved = memory.read();
      get('division-remember-help').checked = saved.enabled;
      get('division-forget-help').hidden = !saved.enabled;
      get('division-memory-status').textContent = !saved.available
        ? 'Не удалось сохранить или сбросить выбор. Подсказки всё равно работают.'
        : saved.enabled ? 'Способ объяснения сохранён на этом устройстве. Текст разговора не сохраняется.'
        : 'Выбор можно сохранить только на этом устройстве. Текст разговора не сохраняется.';
    }
    get('division-remember-help').addEventListener('change', event => {
      memory.enable(event.target.checked);
      memory.remember(previous?.preference || previous?.intent);
      showMemory();
    });
    get('division-forget-help').addEventListener('click', () => {memory.clear(); previous = remoteState = undefined; pending?.abort(); showMemory();});
    showMemory();
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
      previous = {intent:memory.read().intent}; remoteState = attempt = undefined;
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
      // A new native attempt starts a fresh digit check, even when the learner
      // submits the same digit again after trying another one in the dialogue.
      previous = {intent:rememberedModes.has(previous?.intent) ? previous.intent : undefined};
      remoteState = undefined;
      pending?.abort();
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
        const cycle = plan.cycles[action.cycle];
        context.partial = cycle.partial;
        context.quotientStarted = !plan.micropractice && action.cycle > 0;
        context.placeExponent = plan.intLen - cycle.sourceIndex - 1;
        if (attempt !== undefined) context.attempt = attempt;
      }
      const local = reply(message, context, previous);
      previous = {...local, attempt:local.attempt ?? previous?.attempt, nativeAttempt:context.attempt ?? null};
      memory.remember(local.preference || local.intent);
      showMemory();
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

  return {reply, mount, preferences};
});
