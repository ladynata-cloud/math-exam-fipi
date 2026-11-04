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
  const highlight = value => '<p>' + E(value).replace(/\d+(?:[,.]\d+)?/g, number => '<mark class="lm-help-number" data-help-number>' + number + '</mark>') + '</p>';
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
    if (!a || !b) return p('При умножении на 0 ничего не прибавляем.') + (level === 3 ? result(a + ' · ' + b + ' = 0') : '');
    const sum = Array(a).fill(b).join(' + ');
    let body = p('Число ' + b + ' нужно взять ' + a + ' раз.') + p(sum + (level === 3 ? ' = ' + a * b : ' = ?'));
    if (level === 3) body += steps(Array.from({length:a}, (_, n) => n * b + ' + ' + b + ' = ' + (n + 1) * b)) + result(a + ' · ' + b + ' = ' + a * b);
    else body += p('Начни с ' + b + '. Каждый раз прибавляй ещё ' + b + '. Всего нужно взять это число ' + a + ' раз.');
    return body;
  }
  function divide(total, base, level, exact = true) {
    if (!natural(total) || !natural(base) || !base || (exact ? total / base > 10 || total % base : total / base >= 10)) return '';
    const n = Math.floor(total / base);
    if (!exact) {
      if (level === 2) return highlight('Пробуй: □ × ' + base + ' = ?. Получилось больше ' + total + ' — возьми цифру поменьше. Иначе проверь следующую цифру. После 9 не увеличивай. Впиши одну цифру.');
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
    if(q.kind==='digit'&&q===spec.steps?.[step]&&(C?.has(spec.contentId)||spec.contentId==='multiplication-division/quotient-estimate')){
      const value=text(q.prompt), direct=value.match(/для (\d+) : (\d+)/), inverse=value.match(/Какую цифру умножили на (\d+), чтобы получить (\d+)/);
      const m=direct || (inverse ? [inverse[0],inverse[2],inverse[1]] : null);
      if(m&&+m[2]>0&&+m[1]<10*+m[2]&&sameAnswer(q,Math.floor(+m[1]/+m[2])))return {action:q,base:+m[2],cycle:{partial:+m[1],qd:Math.floor(+m[1]/+m[2])}};
    }
    if (D && C?.has(spec.contentId) && q===spec.steps?.[step] && q.visual && ['first','bring'].includes(q.visual.kind)) {
      const v=q.visual, plan=D.plan({level:Number(v.divisor)<10?'oneDigit':'twoDigit',dividend:String(v.digits),divisor:String(v.divisor)});
      const action=plan.actions.find(a=>a.kind===q.kind&&a.sourceIndex===v.sourceIndex);
      if(action&&sameAnswer(q,Number(action.answer)))return {plan,action,base:plan.normalizedDivisor,cycle:plan.cycles[action.cycle]};
    }
    if (!D || !spec.divisionTask || !spec.steps?.[step]) return null;
    const segment = (spec.divisionTasks || []).find(t => step >= t.startIndex && step < t.endIndex);
    const plan = D.plan(segment ? segment.task : spec.divisionTask), index = step - (segment ? segment.startIndex : 0), action = plan.actions[index];
    if (!action || action.kind !== q.kind || (!C?.has(spec.contentId)&&action.prompt !== q.prompt) || action.answer !== q.answer) return null;
    return {plan, action, base:plan.normalizedDivisor, cycle:plan.cycles[action.cycle]};
  }
  function numericError(answer, fallback, oneDigit = false) {
    const raw=String(answer??'').trim();
    if(raw && (oneDigit ? !/^\d$/.test(raw) : !/^\d+(?:[,.]\d+)?$/.test(raw))) return oneDigit?'Впиши только одну цифру — от 0 до 9.':'Впиши только число, без знака действия.';
    return fallback;
  }
  function multiplicationHint(a,b) {
    if(a===0||b===0)return 'Здесь умножаем на 0: не берём ни одного раза. Подумай, сколько тогда получится.';
    const count=Math.min(a,b),value=Math.max(a,b);
    if(count===1)return 'При умножении на 1 число не меняется. Посмотри на другое число в '+a+' × '+b+'.';
    if(count<=9)return 'Вместо '+a+' × '+b+' можно сложить: '+Array(count).fill(value).join(' + ')+' = ?.';
    return 'Умножь только эти числа: '+a+' × '+b+' = ?.';
  }
  function arithmeticPresentation(q, answer) {
    const value=text(q.prompt), m=value.match(/(\d+)\s*([×·+−-]|:)\s*(\d+)\s*=\s*\?/);
    if(!m)return null;
    const x=+m[1],y=+m[3],op=m[2],expected=op==='+'?x+y:op==='−'||op==='-'?x-y:op===':'?x/y:x*y;
    if(!sameAnswer(q,expected))return null;
    let hint,error;
    if(op==='×'||op==='·'){
      hint=multiplicationHint(x,y);
      error=Number(answer)===x+y && x+y!==expected?'Ты сложил '+x+' и '+y+'. Здесь знак ×: нужно умножить. '+hint:hint;
    }else if(op==='+'||op==='−'||op==='-'){
      hint=(op==='+'?'Сложи: ':'Вычти: ')+x+' '+op+' '+y+' = ?.';
      error=op==='+'?hint:'Вычитай из '+x+' число '+y+'. '+hint;
    }else{
      hint=x%10===0&&y%10===0?'Убери по одному нулю: '+x/10+' : '+y/10+' = ?.':'Подбери число: □ × '+y+' = '+x+'.';
      error=hint;
    }
    return {prompt:value,hint,error:numericError(answer,error,q.kind==='digit')};
  }
  // Presentation only: use the saved numbers and metadata, without altering a step.
  function columnPresentation(spec,q,step,answer) {
    const task=spec?.task?.multiplication,m=q?.multiplication;
    if(!spec?.contentId?.startsWith('multiplication-division/course-column-')||q!==spec.steps?.[step]||!task||!m)return null;
    const ad=String(task.a).split('').reverse().map(Number),bd=String(task.b).split('').reverse().map(Number);
    const x=ad[m.operandColumn],y=bd[m.multiplierColumn],raw=String(answer??'').trim(),n=Number(raw);
    const carryAt=spec.steps.slice(0,step).flatMap(s=>s.multiplication?.effects||[]).filter(e=>e.carry&&e.row===m.row&&e.col===m.col).at(-1)?.digit||0;
    let hint='',error='',prompt=text(q.prompt),match;
    if(m.phase==='multiply'&&m.event==='calculate'&&sameAnswer(q,x*y)){
      const shift=m.operandColumn===0&&m.multiplierColumn>0?(m.multiplierColumn===1?'Вторую строку начинаем на одну клетку левее. ':'Третью строку начинаем на две клетки левее первой. '):'';
      hint=shift+multiplicationHint(x,y);
      error=n===x+y&&x+y!==x*y?'Ты сложил цифры. Здесь нужно умножить: '+x+' × '+y+' = ?.':hint;
      if(raw&&x*y>0&&m.multiplierColumn>0&&(n===x*y*10||n===x*y*10**m.multiplierColumn))error='Строка уже сдвинута в клетках. Сейчас умножь только '+x+' × '+y+'. Нули к этому ответу не дописывай.';
    }else if(m.phase==='multiply'&&m.event==='add-carry'&&sameAnswer(q,x*y+carryAt)&&carryAt){
      hint='В уме '+carryAt+'. Прибавь его: '+x*y+' + '+carryAt+' = ?.';
      error=n===x*y?'Умножение ты посчитал. Но в уме осталось '+carryAt+'. Теперь прибавь: '+x*y+' + '+carryAt+' = ?.':hint;
    }else if(m.event==='write'&&(match=prompt.match(/^Получилось (\d+)\./))&&sameAnswer(q,+match[1]%10)){
      const total=+match[1];
      hint='Посмотри на число '+total+'. В выделенную клетку запиши только последнюю цифру справа.';
      error=raw.length>1?'Ты записал целое число. Здесь нужна только последняя цифра числа '+total+'.':n===Math.floor(total/10)&&total>9?'Левая часть числа остаётся в уме. В клетку нужна последняя цифра справа в числе '+total+'.':hint;
    }else if(m.event==='carry'){
      const previous=spec.steps.slice(0,step).reverse().find(s=>s.multiplication?.row===m.row&&s.multiplication?.event==='write'&&/^Получилось \d+\./.test(s.prompt));
      const value=previous?.prompt.match(/^Получилось (\d+)\./)?.[1];
      if(value===undefined||!sameAnswer(q,Math.floor(+value/10)))return null;
      hint='В числе '+value+' закрой последнюю цифру справа. То, что осталось слева, оставь в уме.';
      error=n===+value%10?'Последнюю цифру уже записали в клетку. Теперь закрой её в числе '+value+' и запиши то, что слева.':hint;
    }else if(m.event==='write'&&(match=prompt.match(/^Осталось (\d+)\./))&&sameAnswer(q,+match[1])){
      hint='Посмотри на число, которое осталось в уме. Запиши его в пустую клетку слева от уже записанных цифр.';error=hint;
    }else if(m.phase==='add'&&m.event==='calculate'){
      const sum=prompt.match(/Сложи: (\d+(?: \+ \d+)+) = \?/),values=sum?.[1].split(' + ').map(Number);
      if(!values||!sameAnswer(q,values.reduce((a,b)=>a+b,0)))return null;
      hint='Сложи числа в выделенных клетках: '+sum[1]+' = ?.'+(carryAt?' Последнее число '+carryAt+' — это то, что в уме.':'');
      error=carryAt&&n===Number(q.answer)-carryAt?'Ты сложил цифры строк, но забыл '+carryAt+' в уме. '+hint:hint;
    }else if(m.event==='answer'&&sameAnswer(q,task.a*task.b)){
      hint='Прочитай самую нижнюю строку слева направо. Перепиши все цифры, сохрани нули.';error=hint;
      const unshifted=bd.reduce((sum,digit)=>sum+task.a*digit,0);
      if(task.b>=10&&n===unshifted&&unshifted!==task.a*task.b)error='Вторая строка начинается левее первой'+(task.b>=100?'; третья — ещё левее': '')+'. Складывай цифры, которые стоят друг под другом. Затем прочитай нижнюю строку.';
    }
    if(!hint)return null;
    if(q.kind==='digit'&&!/^\d$/.test(raw)&&raw&&!(m.event==='write'&&/^\d{2,}$/.test(raw)))error='В эту клетку нужна одна цифра — от 0 до 9. '+hint;
    return {prompt,hint,error:error||hint};
  }
  function coursePresentation(spec,q,step,answer) {
    if(q!==spec.steps?.[step]||!(C?.has(spec.contentId)||spec.contentId==='multiplication-division/quotient-estimate'))return null;
    const value=text(q.prompt),arith=arithmeticPresentation(q,answer);if(arith)return arith;
    let hint='',m;
    if(q.kind==='round'&&(m=value.match(/округли (\d+)/i))&&sameAnswer(q,Math.floor((+m[1]+5)/10)*10))hint=+m[1]%10===0?'Число '+m[1]+' уже оканчивается на 0. Ничего не меняй.':'Посмотри на последнюю цифру числа '+m[1]+'. Если это 1–4, иди к круглому числу вниз. Если 5–9 — вверх.';
    else if(q.kind==='digit'&&/Уменьши проверенную цифру на 1|Увеличь проверенную цифру на 1/.test(value)){
      const previous=spec.steps[step-1],trial=text(previous?.prompt).match(/(\d+) × \d+ = \?/),direction=/Уменьши/.test(value)?-1:1;
      if(trial&&sameAnswer(q,+trial[1]+direction))hint=(direction<0?'Уменьши':'Увеличь')+' последнюю проверенную цифру на 1: '+trial[1]+(direction<0?' − ':' + ')+'1 = ?.';
    }else if(q.kind==='digit'&&/Какую цифру попробуем первой/.test(value))hint='Посмотри на результат предыдущей прикидки. Возьми эту цифру для проверки.';
    else if(q.kind==='digit'&&/самую большую цифру/.test(value))hint='Нужна одна цифра. Посмотри на ряд: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9. Возьми последнюю.';
    else if(q.kind==='digit'&&/Даже 1 ×/.test(value))hint='Даже один раз взять число справа — слишком много. Подумай, какая цифра означает «ни одного раза».';
    else if(q.kind==='answer'&&/Собери/.test(value)){
      const group=(spec.divisionTasks||[]).find(t=>step>=t.startIndex&&step<t.endIndex);
      const count=spec.steps.slice(group?.startIndex||0,step).filter(s=>s.kind==='digit'&&/Вычти:/.test(s.prompt)).length;
      hint='Вычитали справа налево. Собери '+(count===3?'три':'две')+' полученные цифры в обратном порядке: последнюю — слева. Начальные нули не пиши.';
    }
    else if(q.kind==='product'&&/Сколько в ней десятков/.test(value))hint='Считай по 10, пока не получится 100. Посчитай, сколько раз взяли 10.';
    else if(q.kind==='digit'&&/Сколько десятков останется из 10/.test(value))hint='Из 10 отдай 1: 10 − 1 = ?.';
    else if(q.kind==='answer'){
      const group=(spec.divisionTasks||[]).find(t=>step>=t.startIndex&&step<t.endIndex);
      if(group?.task)hint='Реши '+group.task.dividend+' : '+group.task.divisor+' уголком. Начни с цифр слева: возьми самое короткое число, которое не меньше '+group.task.divisor+'.';
    }
    return hint?{prompt:value,hint,error:numericError(answer,hint,q.kind==='digit')}:null;
  }
  function present(spec, q, options = {}) {
    if (options.scope !== 'step') return null;
    try {
      const step=options.step??0,column=columnPresentation(spec,q,step,options.answer);if(column)return column;
      const c = divisionContext(spec, q, step);
      if (!c) return coursePresentation(spec,q,step,options.answer);
      const {plan, action:a, base, cycle} = c;
      let prompt = '', hint = '', error = '';
      const raw = String(options.answer ?? '').trim(), n=Number(raw);
      if (a.kind === 'digit') {
        prompt = 'Подбери одну цифру: □ × ' + base + '. Нужно самое большое число, которое не больше ' + cycle.partial + '.';
        hint = 'Пробуй: □ × ' + base + ' = ?. Получилось больше ' + cycle.partial + ' — возьми цифру поменьше. Иначе проверь следующую цифру. После 9 не увеличивай. Впиши одну цифру.';
        if (/^\d$/.test(raw)) {
          const total = n * base;
          error = total > cycle.partial ? n + ' × ' + base + ' = ' + total + '. Это больше ' + cycle.partial + ': слишком много. Попробуй цифру поменьше.'
            : n < cycle.qd ? n + ' × ' + base + ' = ' + total + '. Это слишком мало: можно взять цифру побольше. Проверь следующую.' : '';
        } else if (raw) error = 'Впиши только одну цифру — от 0 до 9.';
      } else if (a.kind === 'start') {
        prompt = 'С какого числа слева начнём делить на ' + base + '?';
        hint = 'Сравни первую цифру слева, ' + plan.digits[0] + ', с ' + base + '. Если её мало, возьми ещё одну цифру справа. Остановись, как только числа хватит. За запятую пока не переходи.';
        if (Number(a.answer) < base) hint = 'Возьми все цифры сверху до запятой. Запиши это число: его пока не хватает, чтобы взять ' + base + ' хотя бы один раз.';
      } else if (a.kind === 'product') {
        prompt = 'Умножь: ' + base + ' × ' + cycle.qd + ' = ?';
        hint = multiplicationHint(cycle.qd,base);
        error=n===cycle.qd+base&&n!==cycle.product?'Ты сложил числа. Здесь нужно умножить: '+cycle.qd+' × '+base+' = ?.':hint;
      } else if (a.kind === 'subtract') {
        prompt = 'Сколько осталось: ' + cycle.partial + ' − ' + cycle.product + ' = ?';
        hint = 'Из ' + cycle.partial + ' вычти ' + cycle.product + ': ' + cycle.partial + ' − ' + cycle.product + ' = ?.';
        error=n===cycle.partial+cycle.product&&n!==Number(a.answer)?'Ты прибавил. Сейчас нужно вычесть: '+cycle.partial+' − '+cycle.product+' = ?.':hint;
      } else if (a.kind === 'bring') {
        prompt = a.appended ? 'Какую цифру допишем справа после запятой?' : 'Какую следующую цифру сверху перенесём вниз?';
        hint = a.appended ? 'Допиши справа после запятой цифру, которая не меняет число. Вспомни: 1,0 и 1 — одно число.' : 'Посмотри на выделенную цифру в верхней строке. Впиши только её. Ноль тоже нужно переносить.';
        error=raw&&/^\d{2,}$/.test(raw)?'Сейчас перенеси только одну следующую цифру сверху. Читать всё новое число будем после этого.':hint;
      } else if (a.kind === 'partial') {
        const before = plan.cycles.find(x => x.sourceIndex === a.sourceIndex - 1);
        if (!before) return null;
        prompt = 'Какое число теперь будем делить на ' + base + '?';
        hint = 'Осталось ' + before.remainder + '. Справа припиши цифру ' + plan.digits[a.sourceIndex] + '. Прочитай полученное число.' + (before.remainder === 0 ? ' Ноль в начале не пиши.' : '');
        error=before.remainder&&n===before.remainder+Number(plan.digits[a.sourceIndex])?'Не складывай эти числа. К '+before.remainder+' справа припиши цифру '+plan.digits[a.sourceIndex]+'.':hint;
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
        hint = 'Посчитай выражение в вопросе. Потом сравни с числом слева, с которого начали делить.';
      } else if (a.kind === 'shift-count') {
        prompt = 'Сколько цифр после запятой в числе ' + plan.task.divisor + '?';
        hint = 'Посмотри на число '+plan.task.divisor+'. Считай только цифры справа от запятой.';
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
    if (!simple) return '';
    if (!c) return section(q.multiplication?'column-multiplication':'arithmetic','Что сделать сейчас',highlight(simple.hint)+(level===3?result('На этом шаге запиши: '+q.answer+'.'):''));
    const {action, base, cycle} = c;
    let body;
    if (action.kind === 'digit') body = divide(cycle.partial, base, level, false);
    else if (action.kind === 'product') body = highlight(simple.hint) + (level===3?multiply(cycle.qd, base, level):'');
    else {
      body = highlight(simple.hint);
      if (level === 3 && action.kind === 'start') {
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
    // The displayed prompt asks how many times to take a number. Keep the saved
    // choice IDs and answer unchanged; only match the visible wording to it.
    const question = {...original.question, prompt:row[4], hint:row[5], bad:row[5], good:'Верно. Можно перейти дальше.'};
    if (question.kind === 'choice') question.options = question.options.map(option => ({...option, html:option.html === 'слишком мала' ? 'слишком мало' : option.html === 'слишком велика' ? 'слишком много' : option.html}));
    return {...original, title:row[0], short:row[1], lead:row[2], html:steps(row[3]), question};
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
