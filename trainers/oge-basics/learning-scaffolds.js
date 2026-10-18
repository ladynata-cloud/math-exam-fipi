/* Optional arithmetic explanations for an existing managed task. No task or state writes. */
(function(root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./multiplication-division/division-lab-core.js'),require('./multiplication-division/division-course-core.js'));
  else root.LearningScaffolds = factory(root.DivisionLab,root.DivisionCourse);
})(typeof globalThis === 'undefined' ? this : globalThis, function(D,C) {
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
    const rows = Array.from({length:last + 1}, (_, n) => '<tr' + (selected === n ? ' class="lm-scaffold-selected"' : '') + '><th scope="row">' + n + '</th><td>' + E(n === 0 ? 'Пока 0' : (n - 1) * base + ' + ' + base) + '</td><td>' + n * base + '</td></tr>').join('');
    return p('Начни с 0 и каждый раз прибавляй ' + base + '.') + '<div class="lm-scaffold-table" tabindex="0" role="region" aria-label="Таблица прибавления; можно прокручивать"><table><caption>Прибавляем по ' + base + '</caption><thead><tr><th scope="col">Сколько раз</th><th scope="col">Прибавляем</th><th scope="col">Всего</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
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
    if (!exact) {
      const product = base * n;
      const rows = Array.from({length:10}, (_, digit) => {
        const chosen = digit === n, tooMuch = digit === n + 1;
        const note = chosen ? '✓ Берём ' + digit : tooMuch ? 'Уже больше ' + total : '';
        return '<tr' + (chosen ? ' class="lm-scaffold-selected"' : tooMuch ? ' class="lm-digit-too-much"' : '') + '><th scope="row">' + digit + '</th><td>' + digit + ' × ' + base + '</td><td>' + base * digit + (note ? '<span class="lm-digit-note">' + E(note) + '</span>' : '') + '</td></tr>';
      }).join('');
      const explanation = n + ' × ' + base + ' = ' + product + (product === total ? ' — ровно ' + total + '. Подходит.' : ' — меньше ' + total + '. Подходит.')
        + (n < 9 ? ' ' + (n + 1) + ' × ' + base + ' = ' + base * (n + 1) + ' — уже больше ' + total + '.' : ' 9 — самая большая цифра.')
        + ' Значит, берём ' + n + '.';
      return p('Умножаем цифру на ' + base + '. Ищем самый большой результат, который не больше ' + total + '.')
        + p(explanation)
        + '<div class="lm-scaffold-table lm-digit-table" tabindex="0" role="region" aria-label="Подбор одной цифры; подходящая строка выделена"><table><caption>Подбираем одну цифру</caption><thead><tr><th scope="col">Цифра</th><th scope="col">Умножаем на ' + base + '</th><th scope="col">Получилось</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
        + (level === 3 ? result('На этом шаге запиши: ' + n + '.') : '');
    }
    let body = p('Найди ' + total + ' в столбце «Всего». Посмотри слева, сколько раз взяли ' + base + '.') + multiples(base, level === 3 ? n : null, 10);
    if (level === 3) body += result(total + ' : ' + base + ' = ' + n + ', потому что ' + base + ' · ' + n + ' = ' + total + '.');
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
  // Presentation only: saved task text/answers stay byte-for-byte canonical.
  function divisionContext(spec, q, step) {
    if (!spec || !q || !Number.isSafeInteger(step) || step < 0 || !spec.contentId?.startsWith('multiplication-division/')) return null;
    if (spec.contentId === 'multiplication-division/long-division-quotient-digit') {
      const m = text(q.prompt).match(/^Какая цифра частного подходит к (\d+) : (\d+)\?$/);
      if (!m || step !== 0 || !sameAnswer(q, Math.floor(+m[1] / +m[2])) || +m[2] <= 0 || +m[1] / +m[2] >= 10) return null;
      return {action:q, base:+m[2], cycle:{partial:+m[1], qd:Math.floor(+m[1] / +m[2])}};
    }
    if(spec.contentId==='multiplication-division/course-digit-choice'&&q.kind==='digit'&&q===spec.steps?.[step]){
      const m=text(q.prompt).match(/для (\d+) : (\d+)/);
      if(m&&+m[2]>0&&+m[1]<10*+m[2]&&sameAnswer(q,Math.floor(+m[1]/+m[2])))return {action:q,base:+m[2],cycle:{partial:+m[1],qd:Math.floor(+m[1]/+m[2])}};
    }
    if (!D || !spec.divisionTask || !spec.steps?.[step]) return null;
    const segment = (spec.divisionTasks || []).find(t => step >= t.startIndex && step < t.endIndex);
    const plan = D.plan(segment ? segment.task : spec.divisionTask), index = step - (segment ? segment.startIndex : 0), action = plan.actions[index];
    if (!action || action.kind !== q.kind || (!C?.has(spec.contentId)&&action.prompt !== q.prompt) || action.answer !== q.answer) return null;
    return {plan, action, base:plan.normalizedDivisor, cycle:plan.cycles[action.cycle]};
  }
  function present(spec, q, options = {}) {
    if (options.scope !== 'step') return null;
    if((C?.has(spec?.contentId)||spec?.contentId==='multiplication-division/quotient-estimate')&&q&&q===spec.steps?.[options.step??0])return {prompt:q.prompt,hint:q.hint,error:q.error||'Проверь вычисление. Если трудно, открой подсказку.'};
    try {
      const c = divisionContext(spec, q, options.step ?? 0);
      if (!c) return null;
      if(C?.has(spec.contentId))return {prompt:q.prompt,hint:q.hint,error:q.error||'Проверь вычисление. Если трудно, открой подсказку.'};
      const {plan, action:a, base, cycle} = c;
      let prompt = '', hint = '', error = '';
      if (a.kind === 'digit') {
        prompt = 'Подбери одну цифру: □ × ' + base + '. Нужно самое большое число, которое не больше ' + cycle.partial + '.';
        hint = 'Умножай цифры от 0 до 9 на ' + base + '. Из результатов, которые не больше ' + cycle.partial + ', выбери самый большой. Впиши одну цифру.';
        const raw = String(options.answer ?? '').trim();
        if (/^\d$/.test(raw)) {
          const n = Number(raw), total = n * base;
          error = total > cycle.partial ? n + ' × ' + base + ' = ' + total + '. Это больше ' + cycle.partial + '. Попробуй цифру поменьше.'
            : n < cycle.qd ? n + ' × ' + base + ' = ' + total + '. Можно умножить на цифру побольше.' : '';
        } else if (raw) error = 'Впиши только одну цифру — от 0 до 9.';
      } else if (a.kind === 'start') {
        prompt = 'С какого числа слева начнём делить на ' + base + '?';
        hint = 'Начни с первой цифры слева. Если число меньше ' + base + ', возьми ещё одну цифру справа. Остановись, когда число станет ' + base + ' или больше. За запятую пока не переходи.';
        if (Number(a.answer) < base) hint = 'Возьми все цифры сверху до запятой. Запиши это число. Оно меньше ' + base + ', поэтому следующей цифрой ответа будет 0.';
      } else if (a.kind === 'product') {
        prompt = 'Умножь: ' + base + ' × ' + cycle.qd + ' = ?';
        hint = 'Возьми ' + base + ' по ' + cycle.qd + ' раз. Запиши, сколько получилось.';
      } else if (a.kind === 'subtract') {
        prompt = 'Сколько осталось: ' + cycle.partial + ' − ' + cycle.product + ' = ?';
        hint = 'Из ' + cycle.partial + ' вычти ' + cycle.product + '. Запиши, сколько осталось.';
      } else if (a.kind === 'bring') {
        prompt = a.appended ? 'Какую цифру допишем справа после запятой?' : 'Какую следующую цифру сверху перенесём вниз?';
        hint = a.appended ? 'После запятой справа можно дописать 0. Число от этого не изменится. Впиши 0.' : 'Посмотри на выделенную цифру в верхней строке. Впиши только её. Ноль тоже нужно переносить.';
      } else if (a.kind === 'partial') {
        const before = plan.cycles.find(x => x.sourceIndex === a.sourceIndex - 1);
        if (!before) return null;
        prompt = 'Какое число теперь будем делить на ' + base + '?';
        hint = 'Осталось ' + before.remainder + '. Справа припиши цифру ' + plan.digits[a.sourceIndex] + '. Прочитай полученное число.' + (before.remainder === 0 ? ' Ноль в начале не пиши.' : '');
      } else if (a.kind === 'comma') {
        prompt = 'Перепиши ' + a.answer.slice(0, -1) + ' и поставь справа запятую.';
        hint = 'Продолжим деление после запятой. Сначала поставь запятую в ответе. Впиши число вместе с запятой.';
      } else if (a.kind === 'answer') {
        prompt = 'Запиши весь ответ.';
        hint = 'Прочитай число справа под чертой. Перепиши все его цифры. Не пропускай нули и запятую.';
      } else if (a.kind === 'final-remainder') {
        prompt = 'Сколько осталось внизу после последнего вычитания?';
        hint = 'Перепиши самое нижнее число слева. Это и есть остаток — то, что осталось.';
      } else if (a.kind === 'verify') {
        prompt = a.prompt;
        hint = 'Посчитай выражение в вопросе. Должно получиться ' + plan.task.dividend + ' — число, с которого начали.';
      } else if (a.kind === 'shift-count') {
        prompt = 'Сколько цифр после запятой в числе ' + plan.task.divisor + '?';
        hint = 'Считай только цифры справа от запятой. Столько шагов вправо потом сделает запятая в каждом из двух чисел.';
      } else if (a.kind === 'shift-factor') {
        prompt = 'На сколько умножим оба числа?';
        hint = 'Запятая на один шаг вправо — умножаем на 10. На два шага — на 100. На три — на 1000. На четыре — на 10000.';
      } else if (a.kind === 'shift-divisor' || a.kind === 'shift-dividend') {
        const value = a.kind === 'shift-divisor' ? plan.task.divisor : plan.task.dividend;
        const count = plan.normalizationEnd ? plan.actions[0].answer : '0';
        prompt = 'Умножь: ' + value + ' × ' + (10 ** Number(count)) + ' = ?';
        hint = 'Перенеси запятую в числе ' + value + ' вправо на ' + count + ' шаг(а). Если цифр не хватает, допиши справа нули. Оба числа меняем одинаково.';
      }
      return prompt ? {prompt, hint, error:error || hint} : null;
    } catch (_) { return null; }
  }
  function divisionScaffold(spec, q, step, level) {
    const c = divisionContext(spec, q, step), simple = present(spec, q, {scope:'step', step});
    if (!c || !simple) return '';
    const {action, base, cycle} = c;
    let body;
    if (action.kind === 'digit') body = divide(cycle.partial, base, level, false);
    else if (action.kind === 'product') body = p(simple.hint) + multiply(cycle.qd, base, level);
    else {
      body = p(simple.hint);
      if (action.kind === 'start') {
        const prefix = c.plan.digits.slice(0, action.sourceIndex + 1), smaller = prefix.slice(0, -1).join('');
        if (smaller) body += p(Number(smaller) + ' меньше ' + base + '. Возьми следующую цифру справа: ' + prefix.at(-1) + '.');
        if (Number(action.answer) < base) body += p('До запятой цифры закончились. Начни с этого числа; первой цифрой ответа будет 0.');
      }
      if (level === 3) body += result('На этом шаге запиши: ' + action.answer + '.');
      if (level === 3 && action.kind.startsWith('shift-')) body += p(c.plan.task.dividend + ' : ' + c.plan.task.divisor + ' = ' + c.plan.normalizedDividend + ' : ' + base + '.');
    }
    return section('division', action.kind === 'digit' ? 'Подбираем одну цифру' : 'Что сделать сейчас', body);
  }
  function lesson(spec, index) {
    if (spec?.contentId !== 'multiplication-division/long-division-quotient-digit' || !spec.lessons?.[index]) return null;
    const rows = [
      ['Сколько раз взять число', 'Сколько раз', 'Возьмём число 6 несколько раз. Больше 47 получать нельзя.', ['6 × 7 = 42. Можно взять 7 раз.', '6 × 8 = 48. Это уже больше 47.'], 'Сколько раз можно взять 7, чтобы не получилось больше 38?', 'Прибавляй по 7. Остановись перед числом, которое больше 38.'],
      ['Прибавляем одно и то же число', 'Прибавляем', 'Начни с 0. Каждый раз прибавляй 6.', ['0 → 6 → 12 → 18 → 24 → 30 → 36 → 42 → 48', '48 больше 43. Вернись на одно число назад.'], 'Какое последнее число в этом ряду не больше 43?', 'Найди первое число, которое больше 43. Возьми число перед ним.'],
      ['Можно взять ещё', 'Можно ещё', 'Если взять 6 по 6 раз, получится 36.', ['Ещё 6: получится 42.', '42 всё ещё меньше 47. Значит, 6 раз — слишком мало.'], 'Для 47 : 6 взять 6 раз — это…', 'Посчитай 36 + 6. Получилось больше 47 или ещё можно?'],
      ['Получилось слишком много', 'Слишком много', 'Если взять 6 по 8 раз, получится 48.', ['48 больше 47.', 'Нужно взять меньше раз.'], 'Для 47 : 6 взять 8 раз — это…', 'Сравни 48 и 47. Получилось больше, чем можно.'],
      ['Проверь свой выбор', 'Проверь себя', 'Прибавляй число снова и снова.', ['Получилось больше, чем можно? Вернись на один шаг назад.', 'Посчитай, сколько раз ты взял число.'], 'Сколько раз можно взять 9, чтобы не получилось больше 83?', 'Прибавляй по 9. Если получилось больше 83, вернись на один шаг назад.']
    ];
    const row = rows[index]; if (!row) return null;
    const original = spec.lessons[index];
    return {...original, title:row[0], short:row[1], lead:row[2], html:steps(row[3]), question:{...original.question, prompt:row[4], hint:row[5], bad:row[5], good:'Верно. Можно перейти дальше.'}};
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
  return Object.freeze({render, present, lesson});
});
