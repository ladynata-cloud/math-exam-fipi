/* Optional arithmetic explanations for an existing managed task. No task or state writes. */
(function(root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./multiplication-division/division-lab-core.js'));
  else root.LearningScaffolds = factory(root.DivisionLab);
})(typeof globalThis === 'undefined' ? this : globalThis, function(D) {
  'use strict';
  const E = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const p = text => '<p>' + E(text) + '</p>';
  const steps = rows => '<ol class="lm-scaffold-steps">' + rows.map(row => '<li>' + E(row) + '</li>').join('') + '</ol>';
  const section = (kind, title, body) => body ? '<section class="lm-scaffold" data-scaffold="' + kind + '"><h3>' + E(title) + '</h3>' + body + '</section>' : '';
  const result = text => '<p class="lm-scaffold-result" data-scaffold-result>' + E(text) + '</p>';
  const natural = value => Number.isSafeInteger(value) && value >= 0 && value <= 100000000;
  function text(prompt) {
    if (typeof prompt !== 'string' || prompt.length > 700) return '';
    const value = prompt.replace(/<\/?(?:strong|b|em)>/g, '').replace(/\s+/g, ' ').trim();
    return /[<>]|\d{9,}/.test(value) ? '' : value;
  }
  function sameAnswer(q, answer) {
    if (!q || !['number','string'].includes(typeof q.answer)) return false;
    const raw = String(q.answer).trim().replace(',', '.');
    return /^\d+(?:\.\d+)?$/.test(raw) && Number.isFinite(answer) && Math.abs(Number(raw) - answer) < 1e-8;
  }
  function multiples(base, selected = null, last = 9) {
    if (!natural(base) || !base || base > 1000000) return '';
    const rows = Array.from({length:last + 1}, (_, n) => '<tr' + (selected === n ? ' class="lm-scaffold-selected"' : '') + '><th scope="row">' + n + '</th><td>' + E(n === 0 ? 'Ни одной группы' : (n - 1) * base + ' + ' + base) + '</td><td>' + n * base + '</td></tr>').join('');
    return p('Таблицу можно восстановить: начни с 0 и каждый раз прибавляй ' + base + '.') + '<div class="lm-scaffold-table" tabindex="0" role="region" aria-label="Таблица кратных; можно прокручивать"><table><caption>Кратные ' + base + '</caption><thead><tr><th scope="col">Группы</th><th scope="col">Прибавляем</th><th scope="col">Всего</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }
  function multiply(a, b, level) {
    if (!natural(a) || !natural(b) || a > 20 || b > 1000000) return '';
    if (!a || !b) return p('Если групп нет или в каждой группе 0 предметов, считать нечего.') + (level === 3 ? result(a + ' · ' + b + ' = 0') : '');
    const sum = Array(a).fill(b).join(' + ');
    let body = p(a + ' · ' + b + ' можно посчитать как ' + a + ' одинаковых групп по ' + b + '.') + p(sum + (level === 3 ? ' = ' + a * b : ' = ?'));
    if (level === 3) body += steps(Array.from({length:a}, (_, n) => n * b + ' + ' + b + ' = ' + (n + 1) * b)) + result(a + ' · ' + b + ' = ' + a * b);
    else body += p('Начни с ' + b + '. За каждую следующую группу прибавляй ещё ' + b + '. Считай группы, чтобы не пропустить ни одну.');
    return body;
  }
  function divide(total, base, level, exact = true) {
    if (!natural(total) || !natural(base) || !base || (exact ? total / base > 10 || total % base : total / base >= 10)) return '';
    const n = Math.floor(total / base);
    let body = p(exact ? 'Найди в правом столбце ' + total + '. Число групп в этой строке подскажет неизвестный множитель.' : 'Сравни ' + total + ' с кратными делителя ' + base + '. Нужно самое большое произведение, которое ещё не больше ' + total + '.') + multiples(base, level === 3 ? n : null, exact && n === 10 ? 10 : 9);
    if (level === 3) body += result(exact ? total + ' : ' + base + ' = ' + n + ', потому что ' + base + ' · ' + n + ' = ' + total + '.' : base + ' · ' + n + ' = ' + base * n + ' ≤ ' + total + ', а ' + base + ' · ' + (n + 1) + ' = ' + base * (n + 1) + ' > ' + total + '. Цифра частного: ' + n + '.');
    return body;
  }
  const wholePlaces = [['единицы','единицу','единиц'],['десятки','десяток','десятков'],['сотни','сотню','сотен'],['тысячи','тысячу','тысяч'],['десятки тысяч','десяток тысяч','десятков тысяч'],['сотни тысяч','сотню тысяч','сотен тысяч'],['миллионы','миллион','миллионов']];
  const fractionalPlaces = [['десятые','десятую','десятых'],['сотые','сотую','сотых'],['тысячные','тысячную','тысячных'],['десятитысячные','десятитысячную','десятитысячных']];
  const place = exponent => exponent >= 0 ? wholePlaces[exponent] : fractionalPlaces[-exponent - 1];
  function decimal(raw) {
    const match = String(raw).match(/^(\d{1,6})(?:[,.](\d{1,4}))?$/);
    return match ? {whole:match[1], fraction:match[2] || ''} : null;
  }
  function column(aRaw, bRaw, op, level) {
    const a = decimal(aRaw), b = decimal(bRaw);
    if (!a || !b || !['+','−'].includes(op)) return '';
    const precision = Math.max(a.fraction.length, b.fraction.length), scale = 10 ** precision;
    const aUnits = Number(a.whole + a.fraction.padEnd(precision, '0')), bUnits = Number(b.whole + b.fraction.padEnd(precision, '0'));
    if (op === '−' && aUnits < bUnits) return '';
    const answer = op === '+' ? aUnits + bUnits : aUnits - bUnits;
    const width = Math.max(a.whole.length, b.whole.length, String(Math.floor(answer / scale)).length) + precision;
    if (width - precision > wholePlaces.length) return '';
    const aDigits = String(aUnits).padStart(width, '0').split('').map(Number), bDigits = String(bUnits).padStart(width, '0').split('').map(Number);
    const indices = Array.from({length:width}, (_, i) => i), exponent = i => width - precision - i - 1;
    const cells = (values, tag, headings = false) => indices.map(i => (precision && i === width - precision ? '<' + tag + '> , </' + tag + '>' : '') + '<' + tag + (headings ? ' scope="col"' : '') + '>' + E(headings ? place(exponent(i))[0] : values[i]) + '</' + tag + '>').join('');
    let body = p(precision ? 'Запятая под запятой: одинаковые разряды стоят друг под другом. Нули справа после запятой не меняют число.' : 'Одинаковые разряды стоят друг под другом. Считай справа налево.') + '<div class="lm-scaffold-table" tabindex="0" role="region" aria-label="Разряды чисел; можно прокручивать"><table><caption>' + E(aRaw + ' ' + op + ' ' + bRaw) + '</caption><thead><tr><th scope="col">Действие</th>' + cells([], 'th', true) + '</tr></thead><tbody><tr><th scope="row">Первое число</th>' + cells(aDigits, 'td') + '</tr><tr><th scope="row">' + E(op) + '</th>' + cells(bDigits, 'td') + '</tr></tbody></table></div>';
    if (level === 2) return body + p('Начни справа, с разряда «' + place(-precision)[0] + '»: ' + aDigits[width - 1] + ' ' + op + ' ' + bDigits[width - 1] + '.') + p(op === '+' ? 'Если получилось 10 или больше, оставь единицы суммы в этом столбце, а 1 перенеси в столбец слева.' : 'Если верхней цифры не хватает, разменяй 1 из ближайшего ненулевого разряда слева. Один старший разряд даёт 10 следующих.');
    const rows = [], digits = aDigits.slice(); let carry = 0;
    for (let i = width - 1; i >= 0; i--) {
      const label = place(exponent(i))[0];
      if (op === '+') {
        const value = aDigits[i] + bDigits[i] + carry;
        rows.push(label + ': ' + aDigits[i] + ' + ' + bDigits[i] + (carry ? ' + 1 (перенос)' : '') + ' = ' + value + '. Пишем ' + value % 10 + (value >= 10 ? ', переносим 1 в разряд слева.' : '.'));
        carry = Math.floor(value / 10);
      } else {
        if (digits[i] < bDigits[i]) {
          let from = i - 1; while (from >= 0 && digits[from] === 0) from--;
          if (from < 0) return '';
          digits[from]--;
          for (let j = from; j < i; j++) {
            rows.push('Размениваем 1 ' + place(exponent(j))[1] + ' на 10 ' + place(exponent(j + 1))[2] + '.');
            if (j + 1 < i) { digits[j + 1] = 9; rows.push('В разряде «' + place(exponent(j + 1))[0] + '» остаётся 9; ещё 1 размениваем дальше.'); }
          }
          digits[i] += 10;
        }
        rows.push(label + ': ' + digits[i] + ' − ' + bDigits[i] + ' = ' + (digits[i] - bDigits[i]) + '.');
      }
    }
    const formatted = precision ? (answer / scale).toFixed(precision).replace('.', ',') : String(answer);
    return body + steps(rows) + result(aRaw + ' ' + op + ' ' + bRaw + ' = ' + formatted);
  }
  function decimalScaffold(spec, q, level) {
    if (spec.contentId !== 'decimal-add-subtract') return '';
    const m = text(q.prompt).match(/^Вычислите: (\d+(?:[,.]\d+)?)\s*([+−-])\s*(\d+(?:[,.]\d+)?)$/);
    if (!m) return '';
    const a = Number(m[1].replace(',', '.')), b = Number(m[3].replace(',', '.')), op = m[2] === '+' ? '+' : '−';
    if (!sameAnswer(q, op === '+' ? a + b : a - b)) return '';
    return section('decimal', 'Считаем по разрядам', column(m[1], m[3], op, level));
  }
  function multiplicationScaffold(spec, q, level) {
    if (!/^multiplication-division(?:\/(?:multiplication-(?:meaning|ladder|mixed|tricks|pythagoras-table)|tabular-division))?$/.test(spec.contentId)) return '';
    const value = text(q.prompt); let m, body = '', answer;
    if ((m = value.match(/^(?:Вычислите: )?(\d+) · (\d+)(?: = \?)?$/))) { answer = +m[1] * +m[2]; body = multiply(+m[1], +m[2], level); }
    else if ((m = value.match(/^(?:Вычислите: )?(\d+) : (\d+)(?: = \?)?$/))) { answer = +m[1] / +m[2]; body = divide(+m[1], +m[2], level); }
    else if ((m = value.match(/^(?:Найдите число: )?\? · (\d+) = (\d+)$/))) { answer = +m[2] / +m[1]; body = divide(+m[2], +m[1], level); }
    else if ((m = value.match(/^(\d+) · \? = (\d+)$/))) { answer = +m[2] / +m[1]; body = divide(+m[2], +m[1], level); }
    else if ((m = value.match(/^(\d+) : \? = (\d+)$/))) { answer = +m[1] / +m[2]; body = p('Неизвестный делитель умножаем на ' + m[2] + ': должно получиться ' + m[1] + '.') + divide(+m[1], +m[2], level); }
    else if ((m = value.match(/^Известно: (\d+) · (\d+) = (\d+)\. Найдите (\d+) · (\d+)\.$/))) {
      const [base, count, known, nextBase, next] = m.slice(1).map(Number);
      if (base !== nextBase || base * count !== known || Math.abs(next - count) !== 1) return '';
      answer = base * next; body = p('Было ' + count + ' групп по ' + base + ': ' + known + '. ' + (next > count ? 'Добавь' : 'Убери') + ' одну группу из ' + base + '.') + p(known + (next > count ? ' + ' : ' − ') + base + ' = ?') + (level === 3 ? result(known + (next > count ? ' + ' : ' − ') + base + ' = ' + answer) : '');
    } else if ((m = value.match(/^(\d+) одинаковы[а-я]+ групп[а-я]* по (\d+) предмет[а-я]*\. Сколько предметов всего\?$/)) || (m = value.match(/^В таблице (\d+) ряд[а-я]*, в каждом по (\d+) клет[а-я]*\. Сколько клеток всего\?$/))) { answer = +m[1] * +m[2]; body = multiply(+m[1], +m[2], level); }
    return body && sameAnswer(q, answer) ? section('multiplication', 'Можно посчитать без заученной таблицы', body) : '';
  }
  function orderScaffold(spec, q, level) {
    if (spec.contentId !== 'order-of-operations') return '';
    const value = text(q.prompt).replace(/^Вычислите: /, ''); let m, body = '', answer;
    if ((m = value.match(/^\((\d+) \+ (\d+)\) · (\d+)$/))) {
      const [a,b,c] = m.slice(1).map(Number); answer = (a + b) * c;
      body = p('Сначала скобки: ' + a + ' + ' + b + ' = ' + (a + b) + '.') + multiply(a + b, c, level);
    } else if ((m = value.match(/^(\d+) \+ (\d+) · (\d+)$/))) {
      const [a,b,c] = m.slice(1).map(Number); answer = a + b * c;
      body = p('Сначала считаем ' + b + ' · ' + c + ', затем прибавим ' + a + '.') + multiply(b, c, level);
    } else if ((m = value.match(/^(\d+) − (\d+) : (\d+)$/))) {
      const [a,b,c] = m.slice(1).map(Number); answer = a - b / c;
      body = p('Сначала найди ' + b + ' : ' + c + '. Только потом вычти полученное число из ' + a + '.') + divide(b, c, level);
    } else if ((m = value.match(/^(\d+) : (\d+) · (\d+)$/))) {
      const [a,b,c] = m.slice(1).map(Number); answer = a / b * c;
      body = p('Деление и умножение равноправны: идём слева направо, сначала ' + a + ' : ' + b + '.') + divide(a, b, level);
      if (level === 3) body += multiply(a / b, c, level); else body += p('После деления умножь полученное число на ' + c + '.');
    } else if ((m = value.match(/^(\d+) − \((\d+) \+ (\d+)\) · (\d+)$/))) {
      const [a,b,c,d] = m.slice(1).map(Number); answer = a - (b + c) * d;
      body = p('В скобках: ' + b + ' + ' + c + ' = ' + (b + c) + '. Затем умножение, и только после него вычитание из ' + a + '.') + multiply(b + c, d, level);
    }
    if (!body || !sameAnswer(q, answer) || !natural(answer)) return '';
    return section('multiplication', 'Разделим пример на действия', body + (level === 3 ? result(value + ' = ' + answer) : ''));
  }
  function divisionScaffold(spec, q, step, level) {
    if (!spec.contentId.startsWith('multiplication-division/')) return '';
    if (spec.contentId === 'multiplication-division/long-division-quotient-digit') {
      const m = text(q.prompt).match(/^Какая цифра частного подходит к (\d+) : (\d+)\?$/);
      return m && sameAnswer(q, Math.floor(+m[1] / +m[2])) ? section('division', 'Подберём цифру по кратным', divide(+m[1], +m[2], level, false)) : '';
    }
    if (!D || !spec.divisionTask || !Array.isArray(spec.steps) || !spec.steps[step]) return '';
    const segment = (spec.divisionTasks || []).find(t => step >= t.startIndex && step < t.endIndex);
    const plan = D.plan(segment ? segment.task : spec.divisionTask), index = step - (segment ? segment.startIndex : 0), action = plan.actions[index];
    if (!action || action.kind !== q.kind || action.prompt !== q.prompt || action.answer !== q.answer) return '';
    const base = plan.normalizedDivisor, cycle = plan.cycles[action.cycle]; let body = '';
    if (action.kind === 'start') {
      const prefix = plan.digits.slice(0, action.sourceIndex + 1), smaller = prefix.slice(0, -1).join('');
      body = p('Смотрим на цифры делимого слева направо. Делитель: ' + base + '.') + (smaller ? p(Number(smaller) + ' меньше ' + base + ': одной этой части не хватит. Присоедини следующую цифру справа: ' + prefix.at(-1) + '.') : p('Начни с первой цифры слева: ' + prefix[0] + '.')) + p('Бери самый короткий начальный блок не меньше делителя. Если вся целая часть меньше делителя, начинай с неё: первая цифра частного будет 0.');
      if (level === 3) body += result('Первое неполное делимое: ' + action.answer + '.');
    } else if (action.kind === 'digit' && cycle) body = divide(cycle.partial, base, level, false);
    else if (action.kind === 'product' && cycle) body = multiply(cycle.qd, base, level);
    else if (action.kind === 'subtract' && cycle) body = column(String(cycle.partial), String(cycle.product), '−', level);
    else if (action.kind === 'bring') body = p(action.appended ? 'Число не меняется, если дописать справа после запятой 0. Его и сносим к остатку.' : 'Посмотри на делимое: сносим ровно одну следующую цифру справа от уже обработанных. Если это 0, его нельзя пропускать.') + (level === 3 ? result('Сносим цифру ' + action.answer + '.') : '');
    else if (action.kind === 'partial') {
      const before = plan.cycles.find(c => c.sourceIndex === action.sourceIndex - 1);
      if (!before) return '';
      const digit = plan.digits[action.sourceIndex];
      body = p('Остаток ' + before.remainder + ' переносим в следующий разряд: это ' + before.remainder * 10 + '. Теперь добавляем снесённую цифру ' + digit + '.') + (level === 3 ? result(before.remainder * 10 + ' + ' + digit + ' = ' + action.answer) : '');
    } else if (action.kind === 'comma') body = p('В делимом закончились целые разряды. До перехода к десятым поставь запятую после уже найденной целой части частного. Если целая часть равна 0, его сохраняем.') + (level === 3 ? result('Запись сейчас: ' + action.answer) : '');
    else if (action.kind === 'answer') body = p('Цифры частного уже найдены по одной. Прочитай их слева направо над уголком. Нули внутри числа сохраняют разряд; запятая отделяет целую часть.') + (level === 3 ? result('Частное: ' + action.answer) : '');
    else if (action.kind === 'final-remainder') body = p('Остаток — последняя разность внизу уголка. Он должен быть меньше ' + base + '. Если получился 0, деление точное.') + (level === 3 ? result('Остаток: ' + action.answer) : '');
    else if (action.kind === 'verify') {
      body = p('Проверка возвращает исходное число: частное умножаем на делитель' + (plan.task.level === 'remainder' ? ', затем прибавляем остаток.' : '.')) + p('Можно умножать по частям: разложи частное на разрядные слагаемые, умножь каждое на делитель и сложи результаты.');
      if (level === 3) body += result(plan.task.divisor + ' × ' + plan.quotient + (plan.task.level === 'remainder' ? ' + ' + plan.remainder : '') + ' = ' + action.answer);
    }
    else if (action.kind.startsWith('shift-')) {
      const places = (plan.task.divisor.split(',')[1] || '').length;
      body = p('Делитель ' + plan.task.divisor + ' должен стать целым. Цифр после запятой: ' + places + '. Каждый разряд вправо — умножение на 10.') + p('Одно и то же действие выполняем с ОБОИМИ числами: иначе частное изменится. При нехватке цифр справа дописываем нули.');
      if (level === 3) body += result(action.prompt + ' ' + action.answer) + p(plan.task.dividend + ' : ' + plan.task.divisor + ' = ' + plan.normalizedDividend + ' : ' + base + '.');
    }
    return section('division', 'Разберём текущий шаг уголка', body);
  }
  function render(spec, q, options = {}) {
    const {scope = 'practice', step = 0, level = 2} = options;
    if (![2,3].includes(level) || !['practice','step','lesson'].includes(scope) || !Number.isSafeInteger(step) || step < 0 || !spec || typeof spec.contentId !== 'string' || !q || typeof q.prompt !== 'string') return '';
    try {
      if (scope === 'step') return divisionScaffold(spec, q, step, level);
      if (q.kind !== 'input') return '';
      return decimalScaffold(spec, q, level) || multiplicationScaffold(spec, q, level) || orderScaffold(spec, q, level);
    } catch (_) { return ''; }
  }
  return Object.freeze({render});
});
