(function (root) {
  'use strict';

  const D = typeof module !== 'undefined' && module.exports
    ? require('./division-lab-core.js') : root.DivisionLab;
  if (!D) throw Error('Сначала подключите division-lab-core.js.');

  const topics = [
    { id: 'start', title: 'Начать с простого', description: 'Делим двузначное число на 2 или 3. Сначала без остатка на каждом шаге.', example: ['48', '2'] },
    { id: 'oneDigit', title: 'Деление на одну цифру', description: 'Учимся вычитать и сносить следующую цифру.', example: ['72', '3'] },
    { id: 'zero', title: 'Ноль в ответе', description: 'Сохраняем место для нуля в частном.', example: ['1005', '5'] },
    { id: 'remainder', title: 'Деление с остатком', description: 'Останавливаемся, когда цифры закончились, и записываем остаток.', example: ['29', '6'] },
    { id: 'twoDigit', title: 'Деление на две цифры', description: 'Подбираем цифру ответа по таблице кратных.', example: ['864', '36'] },
    { id: 'decimalNatural', title: 'Дробь делим на целое число', description: 'Учимся ставить запятую в ответе.', example: ['12,6', '3'] },
    { id: 'appendZeros', title: 'Продолжаем после запятой', description: 'Дописываем нули и продолжаем делить.', example: ['1', '8'] },
    { id: 'decimalDivisor', title: 'Делим на десятичную дробь', description: 'Сначала одинаково меняем оба числа, затем делим уголком.', example: ['8', '2,5'] },
    { id: 'quotientDigit', title: 'Потренировать подбор цифры', description: 'Один короткий шаг: сколько раз делитель помещается в числе?', example: ['12', '3'], optional: true }
  ];
  const topicMap = Object.fromEntries(topics.map(topic => [topic.id, topic]));
  const presets = {
    start: [['48', '2'], ['69', '3'], ['84', '2'], ['96', '3'], ['66', '2'], ['63', '3'], ['46', '2'], ['99', '3'], ['82', '2'], ['36', '3']],
    oneDigit: [['72', '3'], ['84', '3'], ['735', '5'], ['126', '3'], ['152', '4'], ['328', '4']],
    zero: [['1005', '5'], ['612', '3'], ['804', '4'], ['909', '3']],
    remainder: [['29', '6'], ['47', '5'], ['73', '3'], ['95', '4']],
    twoDigit: [['864', '36'], ['288', '12'], ['690', '15']],
    decimalNatural: [['12,6', '3'], ['8,4', '2'], ['7,35', '5']],
    appendZeros: [['1', '8'], ['3', '4'], ['7', '2'], ['6', '5']],
    decimalDivisor: [['8', '2,5'], ['4,8', '1,2'], ['0,84', '0,4']],
    quotientDigit: [['12', '3'], ['14', '3'], ['19', '4'], ['4', '7'], ['0', '5']]
  };

  function topicFor(id) {
    if (typeof id !== 'string' || !Object.hasOwn(topicMap, id)) throw Error('Неизвестная тема.');
    return topicMap[id];
  }

  function make(topicId, sequence = 0) {
    topicFor(topicId);
    if (!Number.isSafeInteger(sequence) || sequence < 0 || sequence > 1000000) throw Error('Неверный номер примера.');
    const level = topicId === 'start' ? 'oneDigit' : topicId === 'quotientDigit' ? 'remainder' : topicId;
    const preset = presets[topicId][sequence];
    if (preset) return { topicId, level, dividend: preset[0], divisor: preset[1] };
    if (topicId === 'start') {
      // Every written digit is a multiple of the divisor: no carry, no zero in
      // the answer, and no more than two dividend digits in this first topic.
      const divisor = sequence % 2 === 0 ? 2 : 3;
      const limit = Math.floor(9 / divisor);
      const tens = 1 + Math.floor(sequence / 2) % limit;
      const units = 1 + Math.floor(sequence / (2 * limit)) % limit;
      return { topicId, level, dividend: String(divisor * (10 * tens + units)), divisor: String(divisor) };
    }
    if (topicId === 'quotientDigit') {
      const divisor = 2 + sequence % 8;
      const partial = (Math.imul(sequence, 17) >>> 0) % (10 * divisor);
      return { topicId, level, dividend: String(partial), divisor: String(divisor) };
    }
    return { ...D.make(level, sequence), topicId };
  }

  function wording(action, p) {
    const cycle = Number.isInteger(action.cycle) ? p.cycles[action.cycle] : null;
    const divisor = p.normalizedDivisor;
    switch (action.kind) {
      case 'start':
        return {
          prompt: 'Какой первый блок берём слева?',
          hint: Number(action.answer) < divisor
            ? 'Целая часть ' + p.normalizedDividend.split(',')[0] + ' меньше ' + divisor + '. Возьми её целиком. Первая цифра ответа будет 0.'
            : 'Начни с первой цифры слева. Если число меньше ' + divisor + ', возьми ещё одну цифру.'
        };
      case 'digit':
        return {
          prompt: 'Сколько раз ' + divisor + ' помещается в ' + cycle.partial + '?',
          hint: 'Посмотри на кратные ' + divisor + '. Выбери самое большое число, которое не больше ' + cycle.partial + '. Запиши одну цифру — сколько раз взяли делитель.'
        };
      case 'product':
        return {
          prompt: 'Умножь: ' + divisor + ' × ' + cycle.qd + ' = ?',
          hint: 'Умножь делитель на найденную цифру ответа. Это число запишем под блоком ' + cycle.partial + '.'
        };
      case 'subtract':
        return {
          prompt: 'Вычти: ' + cycle.partial + ' − ' + cycle.product + ' = ?',
          hint: 'Вычти нижнее число из верхнего. Узнаем, сколько осталось.'
        };
      case 'bring':
        return {
          prompt: action.appended ? 'Допиши и снеси ноль.' : 'Снеси следующую цифру.',
          hint: action.appended
            ? 'После запятой можно дописывать нули справа: число не изменится. Запиши одну цифру — 0.'
            : 'Возьми одну следующую цифру делимого. Запиши только эту цифру, даже если это ноль.'
        };
      case 'partial': {
        const nextCycle = p.cycles.findIndex(item => item.sourceIndex === action.sourceIndex);
        const previous = p.cycles[nextCycle - 1];
        return {
          prompt: 'Какой новый блок получился?',
          hint: 'К остатку ' + previous.remainder + ' справа приписали цифру ' + p.digits[action.sourceIndex] + '. Прочитай новый блок.'
        };
      }
      case 'comma':
        return {
          prompt: 'Запиши целую часть ответа и поставь запятую.',
          hint: 'Сейчас переходим к цифрам после запятой. Перепиши уже найденную целую часть ' + action.answer.slice(0, -1) + ' и добавь запятую.' + (action.answer === '0,' ? ' Ноль перед запятой нужен.' : '')
        };
      case 'answer':
        return {
          prompt: p.task.level === 'remainder' ? 'Запиши целое частное.' : 'Запиши ответ целиком.',
          hint: 'Прочитай все цифры ответа справа под чертой. Сохрани нули внутри числа и запятую, если она есть.'
        };
      case 'final-remainder':
        return { prompt: 'Какой остаток получился?', hint: 'Посмотри на самое нижнее число после вычитания.' };
      case 'verify':
        return {
          prompt: 'Проверь: ' + p.task.divisor + ' × ' + p.quotient + (p.task.level === 'remainder' ? ' + ' + p.remainder : '') + ' = ?',
          hint: 'Умножь ответ на делитель' + (p.task.level === 'remainder' ? ' и прибавь остаток' : '') + '. Должно получиться исходное делимое ' + p.task.dividend + '.'
        };
      case 'shift-count':
        return { prompt: 'Сколько цифр после запятой в делителе ' + p.task.divisor + '?', hint: 'Сначала сделаем делитель целым. На столько же разрядов перенесём запятую в обоих числах.' };
      case 'shift-factor':
        return { prompt: 'На какое число умножим оба числа?', hint: 'Один разряд — умножение на 10. Два разряда — на 100. Делимое и делитель меняем одинаково.' };
      case 'shift-divisor':
        return { prompt: 'Запиши делитель без запятой.', hint: 'Перенеси запятую вправо на найденное число разрядов. С делимым затем сделаем то же самое.' };
      case 'shift-dividend':
        return { prompt: 'Теперь так же измени делимое ' + p.task.dividend + '.', hint: 'Перенеси запятую вправо на столько же разрядов. Если цифр не хватает, допиши нули справа. Только после этого начнём уголок.' };
      default:
        return { prompt: action.prompt, hint: action.hint };
    }
  }

  function plan(raw) {
    if (!raw || typeof raw !== 'object') throw Error('Неизвестное задание.');
    const topicId = raw.topicId || raw.level;
    topicFor(topicId);
    const expectedLevel = topicId === 'start' ? 'oneDigit' : topicId === 'quotientDigit' ? 'remainder' : topicId;
    if (raw.level !== expectedLevel) throw Error('Тема и пример не совпадают.');
    const p = D.plan(raw);
    p.task = { ...p.task, topicId };
    const baseActions = p.actions;
    const actions = [];
    const startIndex = baseActions.findIndex(action => action.kind === 'start');
    const integerDigitCount = p.intLen - baseActions[startIndex].sourceIndex;
    const hasDecimalPart = p.normalizedDividend.includes(',') || p.quotient.includes(',');
    const smallWholePart = Number(baseActions[startIndex].answer) < p.normalizedDivisor;
    const add = action => actions.push({ ...action, guidedStep: actions.length });

    if (topicId === 'quotientDigit') {
      const a = D.number(p.task.dividend), b = D.number(p.task.divisor);
      if (a.places || b.places || b.units < 2 || b.units > 9 || a.units >= 10 * b.units || p.cycles.length !== 1) {
        throw Error('Для подбора цифры нужны делитель от 2 до 9 и ответ от 0 до 9.');
      }
      const baseStep = p.cycles[0].digitAction;
      const action = baseActions[baseStep];
      add({ ...action, ...wording(action, p), baseStep, visibleBaseStep: baseStep });
    } else {
      baseActions.forEach((action, baseStep) => {
        add({ ...action, ...wording(action, p), baseStep, visibleBaseStep: baseStep });
        if (action.kind === 'start') {
          add({
            kind: 'count', answer: String(integerDigitCount),
            prompt: hasDecimalPart ? 'Сколько цифр будет в целой части ответа?' : 'Сколько цифр будет в ответе?',
            hint: smallWholePart
              ? 'Целая часть делимого меньше делителя. ' + (hasDecimalPart ? 'Перед запятой будет' : 'В ответе будет') + ' одна цифра — 0.'
              : 'Первый блок даёт одну цифру ответа. Каждая оставшаяся цифра ' + (hasDecimalPart ? 'до запятой' : 'делимого') + ' даёт ещё одну.',
            baseStep, visibleBaseStep: baseStep + 1,
            sourceIndex: action.sourceIndex, integerDigitCount
          });
        }
        if (action.kind === 'subtract') {
          const cycle = p.cycles[action.cycle];
          add({
            kind: 'remainder-check', answer: 'да',
            prompt: 'Остаток ' + cycle.remainder + ' меньше делителя ' + p.normalizedDivisor + '?',
            hint: 'Остаток должен быть меньше делителя. Ноль тоже меньше любого положительного делителя.',
            options: [{ value: 'да', label: 'Да' }, { value: 'нет', label: 'Нет' }],
            baseStep, visibleBaseStep: baseStep + 1, cycle: action.cycle,
            remainder: cycle.remainder, divisor: p.normalizedDivisor
          });
        }
      });
    }
    return { ...p, actions, baseActions, topicId, integerDigitCount, micropractice: topicId === 'quotientDigit' };
  }

  function check(value, action) {
    if (!action || typeof action !== 'object' || !['string', 'number'].includes(typeof value)) return false;
    const text = String(value).trim();
    if (!text) return false;
    if (action.kind === 'remainder-check') return ['да', '<', 'меньше'].includes(text.toLocaleLowerCase('ru'));
    if (action.kind === 'count') return /^[1-9]\d*$/.test(text) && text === action.answer;
    return D.check(text, action);
  }

  const api = { topics, make, plan, check, number: D.number, decimal: D.decimal, equal: D.equal };
  root.DivisionGuided = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
