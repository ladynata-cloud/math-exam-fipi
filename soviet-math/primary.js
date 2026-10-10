(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SovietPrimary = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var sourceNote = 'Авторские примеры по темам арифметики. Учебник, авторы и проверенные страницы разделов указаны для каждой темы в sources.js.';
  var definitions = [
    ['bonds', 'Состав числа', 'Находим две части одного числа.'],
    ['compare', 'Сравнение чисел', 'Сравниваем количество предметов и выбираем большее число.'],
    ['add-ten', 'Сложение в пределах 10', 'Прибавляем по частям и сохраняем все вычисления.'],
    ['subtract-ten', 'Вычитание в пределах 10', 'Вычитаем по частям и проверяем оставшееся количество.'],
    ['add-twenty', 'Сложение с переходом через 10', 'Сначала дополняем до десяти, затем прибавляем остаток.'],
    ['subtract-twenty', 'Вычитание с переходом через 10', 'Сначала доходим до десяти, затем вычитаем оставшуюся часть.'],
    ['place-value', 'Десятки, единицы, сотни', 'Собираем число из разрядных слагаемых.'],
    ['stories', 'Задачи по действиям', 'Сохраняем условие и последовательно отвечаем на промежуточные вопросы.'],
    ['groups', 'Одинаковые группы', 'Переходим от равных групп к умножению.'],
    ['sharing', 'Разделить поровну', 'Раздаём предметы полными кругами и находим долю каждого.'],
    ['times-table', 'Таблица умножения', 'Восстанавливаем произведение через две меньшие группы.'],
    ['column-add', 'Сложение столбиком', 'Складываем одинаковые разряды и переносим полный десяток.'],
    ['column-subtract', 'Вычитание столбиком', 'Размениваем соседний разряд, в том числе через ноль.'],
    ['column-multiply', 'Умножение столбиком', 'Умножаем по разрядам и учитываем перенос.'],
    ['order', 'Порядок действий', 'Сначала скобки, затем умножение, затем вычитание.']
  ];
  var topics = definitions.map(function (item, i) {
    return { id: item[0], title: item[1], stage: i < 8 ? 'start' : 'written', description: item[2], source: i >= 11 ? 'princev' : 'pchelko' };
  });

  function text(value) { return String(value).replace('.', ','); }
  function step(prompt, answer, hint, record, helper) {
    return { prompt: prompt, answer: text(answer), hint: hint, record: record, helper: helper };
  }
  function result(id, index, prompt, answer, steps, visual) {
    return { topicId: id, index: index, prompt: prompt, answer: text(answer), steps: steps, visual: visual, kind: 'standard' };
  }
  function pair(list, index) { return list[index]; }
  function digits(value) { return [value % 10, Math.floor(value / 10) % 10, Math.floor(value / 100)]; }
  function carryRecord(expression, value) {
    return expression + ' = ' + value + '; пишем ' + (value % 10) + ', перенос ' + Math.floor(value / 10);
  }

  function make(id, requestedIndex) {
    if (!topics.some(function (topic) { return topic.id === id; })) throw new Error('Неизвестная тема: ' + id);
    var index = Number.isFinite(Number(requestedIndex)) ? ((Math.trunc(Number(requestedIndex)) % 12) + 12) % 12 : 0;
    var a, b, c, total, rest, first, second, steps, visual, selected;

    if (id === 'bonds') {
      selected = pair([[5, 3], [4, 3], [6, 2], [3, 4], [2, 4], [6, 3], [4, 5], [5, 5], [3, 6], [2, 5], [7, 3], [4, 4]], index);
      a = selected[0]; b = selected[1]; total = a + b;
      steps = [
        step('Прибавь к ' + a + ' одну единицу. Какое число получится?', a + 1, 'Следующее число после ' + a + ' — ' + (a + 1) + '.', a + ' + 1 = ' + (a + 1), ['Двигайся по числам вперёд на один шаг.']),
        step('Сколько ещё единиц нужно от ' + (a + 1) + ' до ' + total + '?', b - 1, 'Вычти ' + (a + 1) + ' из ' + total + '.', (a + 1) + ' + ' + (b - 1) + ' = ' + total, ['Первую единицу уже добавили.', 'Посчитай оставшиеся шаги до целого.']),
        step('Сколько единиц всего нужно добавить к ' + a + ', чтобы получить ' + total + '?', b, 'Сложи первую единицу и остальные ' + (b - 1) + '.', total + ' = ' + a + ' + ' + b, ['Собери вместе обе добавленные части.'])
      ];
      return result(id, index, 'Число ' + total + ' состоит из ' + a + ' и ещё одной части. Найди эту часть.', b, steps, { kind: 'dots', a: a, b: b });
    }

    if (id === 'compare') {
      selected = pair([[5, 8], [9, 6], [3, 7], [8, 4], [6, 10], [7, 2], [4, 9], [10, 3], [2, 5], [6, 8], [9, 7], [5, 4]], index);
      a = selected[0]; b = selected[1]; total = Math.max(a, b);
      steps = [
        step('Сколько предметов в первой группе?', a, 'Сосчитай предметы первой группы по одному.', 'Первая группа = ' + a, ['Считай только первую группу. Каждый предмет учитывай один раз.']),
        step('Сколько предметов во второй группе?', b, 'Сосчитай предметы второй группы по одному.', 'Вторая группа = ' + b, ['Считай только вторую группу.']),
        step('Запиши большее из чисел ' + a + ' и ' + b + '.', total, 'Больше то число, которому соответствует больше предметов.', total + ' > ' + Math.min(a, b), ['Составь пары: по одному предмету из каждой группы.', 'Больше предметов там, где после составления пар что-то останется.'])
      ];
      return result(id, index, 'Какое число больше: ' + a + ' или ' + b + '?', total, steps, { kind: 'dots', a: a, b: b });
    }

    if (id === 'add-ten' || id === 'subtract-ten') {
      selected = pair([[3, 4], [2, 5], [4, 3], [5, 3], [2, 6], [6, 2], [3, 6], [4, 5], [7, 2], [5, 5], [6, 4], [2, 4]], index);
      a = selected[0]; b = selected[1];
      if (id === 'add-ten') {
        total = a + b;
        steps = [
          step('Сначала прибавь к ' + a + ' одну единицу.', a + 1, a + ' + 1 = ' + (a + 1) + '.', a + ' + 1 = ' + (a + 1), ['Слагаемое удобно прибавлять частями.', 'Сейчас прибавляем только одну единицу.']),
          step('Из ' + b + ' единиц одну уже прибавили. Сколько осталось прибавить?', b - 1, 'Вычти одну единицу из ' + b + '.', b + ' = 1 + ' + (b - 1), ['Второе слагаемое разделяем на одну единицу и остаток.']),
          step('Прибавь оставшуюся часть к ' + (a + 1) + '. Какова сумма?', total, 'Вычисли ' + (a + 1) + ' + ' + (b - 1) + '.', a + ' + ' + b + ' = ' + total, ['Первая единица уже учтена.', 'Теперь прибавь только оставшуюся часть.'])
        ];
        return result(id, index, 'Вычисли: ' + a + ' + ' + b + '.', total, steps, { kind: 'dots', a: a, b: b });
      }
      total = a + b;
      steps = [
        step('Сначала вычти из ' + total + ' одну единицу.', total - 1, 'Назови предыдущее число перед ' + total + '.', total + ' − 1 = ' + (total - 1), ['Пока убираем только один предмет.']),
        step('Из ' + b + ' единиц одну уже вычли. Сколько ещё нужно вычесть?', b - 1, 'Вычисли ' + b + ' − 1.', b + ' = 1 + ' + (b - 1), ['Не вычитай всё число ещё раз.', 'Найди только оставшуюся часть вычитаемого.']),
        step('Вычти оставшуюся часть из ' + (total - 1) + '. Сколько останется?', a, 'Вычисли ' + (total - 1) + ' − ' + (b - 1) + '.', total + ' − ' + b + ' = ' + a, ['Продолжай с результата первого вычитания.'])
      ];
      return result(id, index, 'Вычисли: ' + total + ' − ' + b + '.', a, steps, { kind: 'dots', a: total, b: b });
    }

    if (id === 'add-twenty' || id === 'subtract-twenty') {
      selected = pair([[8, 5], [7, 6], [9, 4], [6, 7], [8, 7], [9, 6], [7, 5], [6, 8], [9, 8], [5, 7], [8, 9], [7, 9]], index);
      a = selected[0]; b = selected[1]; total = a + b;
      if (id === 'add-twenty') {
        first = 10 - a; rest = b - first;
        steps = [
          step('Сколько нужно прибавить к ' + a + ', чтобы получить 10?', first, 'Найди 10 − ' + a + '.', a + ' + ' + first + ' = 10', ['Сначала получим полный десяток.']),
          step('Из ' + b + ' уже прибавили ' + first + '. Сколько осталось?', rest, 'Вычисли ' + b + ' − ' + first + '.', b + ' = ' + first + ' + ' + rest, ['Раздели второе слагаемое на использованную часть и остаток.']),
          step('Прибавь к десяти оставшуюся часть. Каков ответ?', total, 'Вычисли 10 + ' + rest + '.', a + ' + ' + b + ' = 10 + ' + rest + ' = ' + total, ['Полный десяток уже получен.', 'Добавь к нему оставшиеся единицы.'])
        ];
        return result(id, index, 'Вычисли: ' + a + ' + ' + b + '.', total, steps, { kind: 'dots', a: a, b: b });
      }
      first = total - 10; rest = b - first;
      steps = [
        step('Сколько единиц нужно вычесть из ' + total + ', чтобы осталось 10?', first, 'Найди ' + total + ' − 10.', total + ' − ' + first + ' = 10', ['Сначала убери единицы сверх полного десятка.']),
        step('Нужно вычесть ' + b + ', а уже вычли ' + first + '. Сколько осталось вычесть?', rest, 'Вычисли ' + b + ' − ' + first + '.', b + ' = ' + first + ' + ' + rest, ['Раздели вычитаемое на уже убранную часть и остаток.']),
        step('Вычти оставшуюся часть из десяти. Каков ответ?', a, 'Вычисли 10 − ' + rest + '.', total + ' − ' + b + ' = 10 − ' + rest + ' = ' + a, ['Продолжай с десяти, полученных на первом шаге.'])
      ];
      return result(id, index, 'Вычисли: ' + total + ' − ' + b + '.', a, steps, { kind: 'dots', a: total, b: b });
    }

    if (id === 'place-value') {
      total = [306, 248, 510, 672, 405, 830, 159, 704, 920, 381, 560, 807][index];
      var ds = digits(total); a = ds[2]; b = ds[1]; c = ds[0];
      steps = [
        step('Сотен: ' + a + '. Сколько это единиц?', a * 100, 'Одна сотня — это 100 единиц.', a + ' × 100 = ' + (a * 100), ['Умножь количество сотен на сто.']),
        step('Десятков: ' + b + '. Сколько это единиц?', b * 10, 'Один десяток — это 10 единиц.', b + ' × 10 = ' + (b * 10), ['Умножь количество десятков на десять.', 'Если десятков нет, этот разряд содержит ноль.']),
        step('Сложи сотни и десятки. Какое число получилось?', a * 100 + b * 10, 'Сложи результаты двух предыдущих шагов.', (a * 100) + ' + ' + (b * 10) + ' = ' + (a * 100 + b * 10), ['Единицы пока не добавляй.']),
        step('Добавь ' + c + ' единиц. Запиши всё число.', total, 'Сложи ' + (a * 100 + b * 10) + ' и ' + c + '.', (a * 100 + b * 10) + ' + ' + c + ' = ' + total, ['Число собрано из сотен, десятков и единиц.'])
      ];
      return result(id, index, 'Собери число: сотен ' + a + ', десятков ' + b + ', единиц ' + c + '.', total, steps, { kind: 'place', value: total });
    }

    if (id === 'stories') {
      selected = pair([[5, 3, 4], [6, 2, 5], [4, 5, 3], [7, 3, 6], [8, 2, 7], [5, 4, 6], [9, 3, 8], [6, 5, 4], [7, 4, 5], [8, 3, 6], [4, 6, 5], [9, 2, 7]], index);
      a = selected[0]; b = selected[1]; c = selected[2]; first = a + b; second = a + first; total = second - c;
      steps = [
        step('Сколько книг было на второй полке?', first, 'На ' + b + ' больше — значит к ' + a + ' прибавить ' + b + '.', a + ' + ' + b + ' = ' + first, ['Сначала узнаем количество на второй полке.', 'Слова «на несколько больше» указывают на сложение.']),
        step('Сколько книг было на двух полках вместе?', second, 'Сложи ' + a + ' и ' + first + '.', a + ' + ' + first + ' = ' + second, ['Теперь известны обе части общего количества.']),
        step('После этого взяли ' + c + ' книг. Сколько осталось?', total, 'Вычти ' + c + ' из ' + second + '.', second + ' − ' + c + ' = ' + total, ['Уменьши общее количество на число взятых книг.'])
      ];
      return result(id, index, 'На первой полке ' + a + ' книг, на второй на ' + b + ' больше. С полок взяли ' + c + ' книг. Сколько книг осталось всего?', total, steps, { kind: 'dots', a: a, b: first });
    }

    if (id === 'groups' || id === 'times-table') {
      selected = id === 'groups'
        ? pair([[4, 3], [3, 4], [5, 2], [3, 5], [4, 4], [5, 3], [6, 2], [4, 5], [6, 3], [5, 4], [3, 6], [6, 4]], index)
        : pair([[7, 6], [6, 7], [8, 4], [9, 3], [7, 8], [8, 6], [6, 9], [9, 4], [7, 7], [8, 8], [9, 6], [6, 6]], index);
      a = selected[0]; b = selected[1]; total = a * b;
      steps = [
        step('Сколько предметов в двух группах по ' + b + '?', 2 * b, 'Сложи ' + b + ' и ' + b + '.', b + ' + ' + b + ' = ' + (2 * b), ['Возьми сначала две одинаковые группы.']),
        step('Осталось ' + (a - 2) + ' групп по ' + b + '. Сколько в них предметов?', (a - 2) * b, 'Сложи число ' + b + ' столько раз, сколько осталось групп.', (a - 2) + ' × ' + b + ' = ' + ((a - 2) * b), ['Две первые группы уже учтены.', 'Посчитай предметы только в оставшихся группах.']),
        step('Сколько предметов во всех ' + a + ' группах?', total, 'Сложи ' + (2 * b) + ' и ' + ((a - 2) * b) + '.', a + ' × ' + b + ' = ' + total, ['Объедини результаты для первых двух и для остальных групп.'])
      ];
      return result(id, index, 'Есть ' + a + ' одинаковых групп по ' + b + ' предметов. Сколько всего предметов?', total, steps, { kind: 'groups', count: a, each: b });
    }

    if (id === 'sharing') {
      selected = pair([[4, 5], [3, 4], [5, 3], [2, 6], [4, 4], [3, 5], [5, 4], [2, 5], [4, 6], [3, 6], [5, 5], [6, 4]], index);
      a = selected[0]; b = selected[1]; total = a * b; rest = total - 2 * a;
      steps = [
        step('За два круга каждый получит по два предмета. Сколько предметов раздадим?', 2 * a, 'На один круг нужно ' + a + ' предметов. Возьми это количество два раза.', a + ' + ' + a + ' = ' + (2 * a), ['В каждом круге всем достаётся по одному предмету.']),
        step('Сколько предметов останется после двух кругов?', rest, 'Вычти ' + (2 * a) + ' из ' + total + '.', total + ' − ' + (2 * a) + ' = ' + rest, ['Из всего количества убери предметы двух полных кругов.']),
        step('На сколько полных кругов хватит оставшихся ' + rest + ' предметов?', b - 2, 'Узнай, сколько раз по ' + a + ' содержится в ' + rest + '.', rest + ' : ' + a + ' = ' + (b - 2), ['На каждый следующий круг требуется то же количество предметов.']),
        step('Сколько предметов получит каждый за все круги?', b, 'Сложи два первых круга и ' + (b - 2) + ' остальных.', total + ' : ' + a + ' = ' + b, ['Каждый круг добавляет каждому один предмет.', 'Число предметов у каждого равно числу полных кругов.'])
      ];
      return result(id, index, 'Раздели ' + total + ' предметов поровну между ' + a + ' участниками. Сколько получит каждый?', b, steps, { kind: 'groups', count: a, each: b });
    }

    if (id === 'column-add') {
      selected = pair([[268, 157], [346, 285], [478, 356], [509, 284], [637, 185], [756, 168], [384, 429], [595, 276], [687, 248], [708, 196], [869, 157], [457, 368]], index);
      a = selected[0]; b = selected[1]; total = a + b;
      var da = digits(a), db = digits(b), carry = 0;
      steps = [];
      ['единиц', 'десятков', 'сотен'].forEach(function (name, position) {
        var previousCarry = carry;
        var sum = da[position] + db[position] + previousCarry;
        var expression = da[position] + ' + ' + db[position] + (previousCarry ? ' + ' + previousCarry : '');
        steps.push(step('Сколько ' + name + ' получается в этом разряде с учётом переноса?', sum,
          'Вычисли ' + expression + '. Последняя цифра останется в этом разряде.',
          carryRecord(expression, sum),
          ['Разряд: ' + name + '.', 'Складываем ' + da[position] + ' и ' + db[position] + '.', previousCarry ? 'Из предыдущего разряда пришёл перенос ' + previousCarry + '. Добавь его один раз.' : 'Переноса из предыдущего разряда нет.', 'Полные десятки этого разряда перейдут в следующий.']));
        carry = Math.floor(sum / 10);
      });
      steps.push(step('Запиши сумму целиком, учитывая последний перенос.', total, 'Прочитай полученные разряды слева направо.', a + ' + ' + b + ' = ' + total, ['Если из сотен появился перенос, запиши его в разряд тысяч.', 'Остальные цифры сохраняют свои разряды.']));
      return result(id, index, 'Сложи столбиком: ' + a + ' + ' + b + '.', total, steps, { kind: 'column', a: a, b: b, op: '+' });
    }

    if (id === 'column-subtract') {
      selected = pair([[402, 178], [503, 286], [704, 359], [600, 247], [831, 465], [920, 584], [701, 426], [560, 283], [804, 597], [650, 378], [912, 658], [430, 167]], index);
      a = selected[0]; b = selected[1]; total = a - b;
      var current = digits(a), subtractor = digits(b);
      var singular = ['единицу', 'десяток', 'сотню'];
      var plural = ['единиц', 'десятков', 'сотен'];
      steps = [];
      plural.forEach(function (name, position) {
        var helpers = ['Разряд: ' + name + '.', 'Сейчас в этом разряде ' + current[position] + ', нужно вычесть ' + subtractor[position] + '.'];
        if (current[position] < subtractor[position]) {
          var lender = position + 1;
          while (current[lender] === 0) lender += 1;
          for (var place = lender; place > position; place -= 1) {
            current[place] -= 1;
            current[place - 1] += 10;
            helpers.push('Размени одну ' + singular[place] + ' на 10 ' + plural[place - 1] + '.');
            helpers.push('Теперь ' + plural[place] + ': ' + current[place] + ', ' + plural[place - 1] + ': ' + current[place - 1] + '.');
          }
        }
        var available = current[position];
        var difference = available - subtractor[position];
        helpers.push('Вычти из ' + available + ' число ' + subtractor[position] + '.');
        steps.push(step('Сколько ' + name + ' остаётся после вычитания?', difference,
          'Вычисли ' + available + ' − ' + subtractor[position] + '.',
          available + ' − ' + subtractor[position] + ' = ' + difference + ' (' + name + ')', helpers));
        current[position] = difference;
      });
      steps.push(step('Запиши разность целиком.', total, 'Прочитай сотни, десятки и единицы результата.', a + ' − ' + b + ' = ' + total, ['Разряды с нулём внутри числа нельзя пропускать.', 'Оставь каждую цифру на своём месте.']));
      return result(id, index, 'Вычти столбиком: ' + a + ' − ' + b + '.', total, steps, { kind: 'column', a: a, b: b, op: '-' });
    }

    if (id === 'column-multiply') {
      selected = pair([[138, 4], [204, 3], [127, 6], [236, 4], [305, 7], [418, 3], [162, 5], [247, 4], [508, 6], [329, 3], [176, 8], [263, 7]], index);
      a = selected[0]; b = selected[1]; total = a * b;
      var multiplicand = digits(a), transfer = 0;
      steps = [];
      ['единиц', 'десятков', 'сотен'].forEach(function (name, position) {
        var previousTransfer = transfer;
        var product = multiplicand[position] * b + previousTransfer;
        var expression = multiplicand[position] + ' × ' + b + (previousTransfer ? ' + ' + previousTransfer : '');
        steps.push(step('Сколько ' + name + ' получится после умножения и добавления переноса?', product,
          'Вычисли ' + expression + '. Перенос прибавляется после умножения.',
          carryRecord(expression, product),
          ['Разряд: ' + name + '.', 'Умножь ' + multiplicand[position] + ' на ' + b + '.', previousTransfer ? 'Затем прибавь перенос ' + previousTransfer + '. Сам перенос не умножай.' : 'Переноса из предыдущего разряда нет.', 'Последняя цифра остаётся в разряде; остальные единицы переходят в следующий.']));
        transfer = Math.floor(product / 10);
      });
      steps.push(step('Запиши всё произведение, включая последний перенос.', total, 'Прочитай результат по разрядам слева направо.', a + ' × ' + b + ' = ' + total, ['После сотен последний перенос относится к тысячам.', 'Сохрани нули внутри результата.']));
      return result(id, index, 'Умножь столбиком: ' + a + ' × ' + b + '.', total, steps, { kind: 'column', a: a, b: b, op: '×' });
    }

    selected = pair([[5, 3, 4, 7], [6, 2, 3, 5], [4, 5, 6, 8], [7, 3, 4, 9], [8, 2, 5, 6], [5, 4, 7, 8], [9, 3, 3, 7], [6, 5, 4, 9], [7, 4, 5, 6], [8, 3, 6, 7], [4, 6, 7, 9], [9, 2, 4, 8]], index);
    a = selected[0]; b = selected[1]; c = selected[2]; var d = selected[3];
    first = a + b; second = first * c; total = second - d;
    steps = [
      step('Чему равно выражение в скобках?', first, 'Сначала вычисли ' + a + ' + ' + b + '.', a + ' + ' + b + ' = ' + first, ['Скобки задают первое действие.', 'Остальную часть выражения пока сохраняем.']),
      step('Теперь умножь результат скобок на ' + c + '.', second, 'Вычисли ' + first + ' × ' + c + '.', first + ' × ' + c + ' = ' + second, ['После скобок выполняется умножение.', 'Вычитание будет последним действием.']),
      step('Вычти ' + d + '. Каков ответ всего выражения?', total, 'Вычисли ' + second + ' − ' + d + '.', second + ' − ' + d + ' = ' + total, ['Используй полученное произведение.'])
    ];
    return result(id, index, 'Вычисли: (' + a + ' + ' + b + ') × ' + c + ' − ' + d + '.', total, steps);
  }

  return { topics: topics, make: make, sourceNote: sourceNote, examplesPerTopic: 12 };
}));
