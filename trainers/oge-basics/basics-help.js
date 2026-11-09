/* Optional prerequisite practice. Keeps parent work intact; never writes progress. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.MathExamBasicsHelp = api;
    root.dispatchEvent(new root.Event('mathexam-basics-help-ready'));
  }
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const fraction = (n, d) => '<span class="bh-fraction"><span>' + esc(n) + '</span><span>' + esc(d) + '</span></span>';
  const curriculum = Object.freeze({
    'percent-meaning': {title:'Что означает процент?', question:'Закрашено 25 клеток из 100. Сколько это процентов?', answer:25, model:'percent', hint:'Одна клетка из ста — один процент.', why:'25 клеток из ста — это 25%.', children:['fraction-parts']},
    'percent-part': {title:'Найти часть от числа', question:'Найди 25% от 80. Это одна из четырёх равных частей.', answer:20, model:'quarter', hint:'Раздели 80 поровну на 4 части.', why:'80 : 4 = 20. Одна четверть — это 25%.', children:['divide']},
    'percent-change': {title:'Прибавить найденную часть', question:'Цена 50 рублей выросла на 20%. На сколько рублей выросла цена?', answer:10, model:'fifths', hint:'20% — одна из пяти равных частей. Сначала найди саму прибавку.', why:'50 : 5 = 10 рублей — прибавка. Новая цена была бы 60 рублей.', children:['percent-part']},
    proportion: {title:'От нескольких предметов к одному', question:'Три одинаковых билета стоят 240 рублей. Сколько стоит один?', answer:80, model:'tickets', hint:'Раздели общую стоимость поровну между тремя билетами.', why:'240 : 3 = 80 рублей.', children:['divide']},
    'fraction-parts': {title:'Равные части', question:'Какая часть полоски закрашена? Запиши дробь.', answer:[3,4], model:'fraction', hint:'Всего 4 равные части. Закрашены 3 из них.', why:'Закрашены три четверти.', children:['divide']},
    'fraction-equivalent': {title:'Сделать одинаковые части', question:'Половину полоски разделили на четверти. Сколько четвертей в половине?', answer:2, model:'equivalent', hint:'Сравни закрашенную длину двух одинаковых полосок.', why:'Одна половина занимает столько же места, сколько две четверти.', children:['fraction-parts']},
    'fraction-add': {title:'Сложить одинаковые части', question:'Сложи одну четверть и две четверти. Запиши полученную дробь.', answer:[3,4], model:'fraction-add', hint:'Размер частей одинаковый. Считай, сколько таких частей взяли.', why:'Одна четверть и две четверти — три четверти.', children:['fraction-equivalent']},
    decimal: {title:'Десять маленьких частей', question:'Вся полоска — 1. Закрашены 3 части из 10. Запиши десятичную дробь.', answer:0.3, model:'decimal', hint:'Одна такая часть — 0,1. Возьми её три раза.', why:'0,1 + 0,1 + 0,1 = 0,3.', children:['fraction-parts']},
    'decimal-add': {title:'Складывать одинаковые маленькие части', question:'Вычисли 0,3 + 0,2.', answer:0.5, model:'decimal-add', hint:'Три части и ещё две части. Всего сколько частей по 0,1?', why:'Получилось 5 частей по 0,1, то есть 0,5.', children:['decimal']},
    rounding: {title:'К какому целому ближе?', question:'Округли 2,7 до целого числа.', answer:3, model:'rounding', hint:'От 2,7 до 3 осталось 0,3. До 2 — 0,7.', why:'Точка 2,7 ближе к 3, чем к 2.', children:['decimal']},
    'decimal-shift': {title:'Убрать запятую в делителе', question:'Делим 4,8 на 0,6. Умножили оба числа на 10. Каким стал делитель?', answer:6, model:'shift', hint:'Число, на которое делим, было 0,6. Увеличь его в 10 раз.', why:'Делитель стал 6, делимое — 48. Теперь делим 48 на 6.', children:['decimal']},
    negative: {title:'Двигаться по числовой прямой', question:'Начни в точке −2 и сделай 3 шага вправо. Где окажешься?', answer:1, model:'number-line', hint:'Каждый шаг вправо увеличивает число на 1.', why:'−2 → −1 → 0 → 1.', children:['subtract']},
    units: {title:'Из метров в сантиметры', question:'В одном метре 100 сантиметров. Сколько сантиметров в 3 метрах?', answer:300, model:'units', hint:'Возьми 100 сантиметров три раза.', why:'100 + 100 + 100 = 300 сантиметров.', children:['multiply']},
    'area-units': {title:'Квадрат состоит из маленьких квадратов', question:'Квадрат разбили на 3 ряда по 3 клетки. Сколько всего клеток?', answer:9, model:'area', hint:'Посчитай три одинаковых ряда.', why:'3 · 3 = 9 клеток. При переводе площади меняются обе стороны.', children:['multiply']},
    order: {title:'Выбрать первое действие', question:'Вычисли 3 + 4 · 2.', answer:11, model:'order', hint:'Сначала умножь 4 на 2. Затем прибавь 3.', why:'4 · 2 = 8; 3 + 8 = 11.', children:['multiply']},
    'first-part': {title:'Сколько цифр взять сначала?', question:'Делим 42 на 6. Число 4 меньше 6. Сколько первых цифр нужно взять?', answer:2, model:'first-part', hint:'Одной цифры 4 не хватает. Возьми ещё следующую цифру.', why:'Берём две цифры: 42. Теперь можно делить на 6.', children:['compare']},
    compare: {title:'Сравнить две группы', question:'На сколько 6 больше 4?', answer:2, model:'compare', hint:'Соедини четыре пары. Посчитай оставшиеся точки в большей группе.', why:'У шести осталось две лишние точки: 6 − 4 = 2.', children:['subtract']},
    bring: {title:'Перенести следующую цифру', question:'После вычитания осталось 1. Переносим справа цифру 2. Какое число получилось?', answer:12, model:'bring', hint:'Оставшаяся 1 теперь даёт 10. Справа дописали ещё 2.', why:'10 + 2 = 12.', children:['add']},
    divide: {title:'Разделить поровну', question:'Разложи 12 фишек поровну в 3 коробки. Сколько будет в каждой?', answer:4, model:'divide', hint:'Каждый раз клади по одной фишке в каждую коробку.', why:'В каждой коробке по 4 фишки. Всего 3 · 4 = 12.', children:['quotient']},
    quotient: {title:'Подобрать одну цифру', question:'Сколько раз по 6 помещается в 29? Впиши одну цифру.', answer:4, model:'quotient', hint:'Пробуй цифру. Произведение должно быть не больше 29. Проверь и следующую цифру.', why:'4 · 6 = 24, а 5 · 6 = 30 — уже больше 29. Поэтому выбираем 4.', children:['multiply']},
    'write-digit': {title:'Какую цифру написать справа?', question:'Получилось 26. Какую цифру напишем крайней справа?', answer:6, model:'write-digit', hint:'Посмотри на последнюю цифру числа 26. Её сразу и пишем.', why:'6 уже написали справа. Оставшуюся 2 держим в уме.', children:['add']},
    'in-mind': {title:'Что оставить в уме?', question:'Получилось 26. Цифру 6 уже написали справа. Сколько оставим в уме?', answer:2, model:'in-mind', hint:'В числе 26 убери уже написанную цифру 6. Что осталось слева?', why:'6 пишем, 2 в уме. Эти 2 прибавим при следующем действии слева.', children:['write-digit']},
    multiply: {title:'Взять одинаковые группы', question:'В четырёх коробках по 3 фишки. Сколько фишек всего?', answer:12, model:'multiply', hint:'Возьми 3 четыре раза: 3 + 3 + 3 + 3.', why:'3 + 3 + 3 + 3 = 12, значит 4 · 3 = 12.', children:['add']},
    subtract: {title:'Убрать часть', question:'Было 12 фишек. Убрали 5. Сколько осталось?', answer:7, model:'subtract', hint:'Убирай по одной. Пять фишек должны стать пустыми.', why:'12 − 5 = 7. Можно проверить: 7 + 5 = 12.', children:['add']},
    add: {title:'Прибавлять по одной', question:'Вычисли 7 + 5.', answer:12, model:'add', hint:'Добавь к семи ещё пять фишек. После десяти продолжай считать.', why:'7 + 3 = 10; осталось прибавить 2. Получилось 12.', children:['count']},
    count: {title:'Посчитать предметы', question:'Сколько здесь точек? Каждую можно отметить один раз.', answer:8, model:'count', hint:'Отмечай точки по порядку, чтобы не пропустить и не посчитать дважды.', why:'Всего восемь точек.', children:[]}
  });

  function skillFor(contentId, context) {
    const id = String(contentId || '').split(/[?#]/)[0].split('/').filter(Boolean).pop()?.replace(/\.html$/, '').toLowerCase() || '';
    const kind = String(context?.kind || context?.question?.kind || '').toLowerCase();
    // The same saved kind "digit" is used both for choosing a quotient digit
    // and writing a column multiplication result. The concrete action wins.
    const multiplication = context?.question?.multiplication || context?.multiplication;
    if (multiplication) {
      if (multiplication.event === 'write') return 'write-digit';
      if (multiplication.event === 'carry') return 'in-mind';
      if (multiplication.event === 'add-carry' || /^(add|sum)$/.test(multiplication.phase)) return 'add';
      return 'multiply';
    }
    if (kind === 'digit' && /multipli|multiply|column/.test(id)) return 'write-digit';
    const stepSkill = {start:'first-part',bring:'bring',partial:'bring',subtract:'subtract',add:'add',sum:'add',digit:'quotient',product:'multiply',multiply:'multiply','remainder-check':'compare','final-remainder':'subtract',comma:'decimal'}[kind];
    if(stepSkill)return stepSkill;
    if (/^shift(?:-|$)|^decimal-shift$/.test(kind)) return 'decimal-shift';
    if (/percent-change/.test(id)) return 'percent-change';
    if (/proportion/.test(id)) return 'proportion';
    if (/percent-meaning/.test(id)) return 'percent-meaning';
    if (/percent/.test(id)) return 'percent-part';
    if (/fraction-common/.test(id)) return 'fraction-equivalent';
    if (/fraction-add/.test(id)) return 'fraction-add';
    if (/fraction/.test(id)) return 'fraction-parts';
    if (/area/.test(id)) return 'area-units';
    if (/units/.test(id)) return 'units';
    if (/round/.test(id)) return 'rounding';
    if (/negative/.test(id)) return 'negative';
    if (/order/.test(id)) return 'order';
    if (/decimal-add/.test(id)) return 'decimal-add';
    if (/decimal-divisor|decimal-shift/.test(id)) return 'decimal-shift';
    if (/first-part/.test(id) || kind === 'start') return 'first-part';
    if (/bring-digit/.test(id) || kind === 'bring') return 'bring';
    if (/subtract|remainder/.test(id) || kind === 'subtract') return 'subtract';
    if (/digit-choice|quotient|estimate/.test(id) || kind === 'digit') return 'quotient';
    if (/multipli|multiply|column/.test(id) || kind === 'product') return 'multiply';
    if (/division|divide|course-/.test(id)) return 'divide';
    if (/decimal/.test(id)) return 'decimal';
    if (/foundations/.test(id)) return 'add';
    return 'order';
  }

  // Compare exact rational values: a close decimal is not the same fraction.
  function rational(raw) {
    const text = String(raw ?? '').trim().replace(/\s+/g, '').replace(/−/g, '-').replace(',', '.');
    if (!text || text.length > 100) return null;
    const pair = text.match(/^([+-]?\d+)\/([+-]?\d+)$/);
    if (pair) { const d = BigInt(pair[2]); return d ? [BigInt(pair[1]), d] : null; }
    const number = text.match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
    if (!number) return null;
    return [BigInt((number[1] === '-' ? '-' : '') + number[2] + (number[3] || '')), 10n ** BigInt((number[3] || '').length)];
  }
  function acceptsAnswer(answer, raw) {
    const value = rational(raw), target = rational(Array.isArray(answer) ? answer.join('/') : answer);
    return !!(value && target && value[0] * target[1] === target[0] * value[1]);
  }
  function accepts(id, raw) { return !!curriculum[id] && acceptsAnswer(curriculum[id].answer, raw); }

  // Own transfer examples. The support example's revealed answer cannot finish
  // these; the same skill is used with genuinely different mathematical data.
  const transfers = Object.freeze({
    'percent-meaning': {question:'Из 100 равных клеток закрашено 40. Сколько это процентов?', answer:40, hint:'Процент означает одну сотую целого.', why:'40 клеток из 100 — это 40%.'},
    'percent-part': {question:'Теперь целое равно 120. Найди 25% от 120.', answer:30, hint:'Процент прежний: это всё ещё одна четверть. Раздели новое целое на 4.', why:'120 : 4 = 30. Было 25% от 80 — 20; процент тот же, но целое и часть увеличились в полтора раза.'},
    'percent-change': {question:'Цена 90 рублей выросла на 20%. На сколько рублей выросла цена?', answer:18, hint:'Сначала найди одну пятую от 90. Спрашивают прибавку, а не новую цену.', why:'90 : 5 = 18 рублей — прибавка. Новая цена равна 108 рублям, это другой вопрос.'},
    proportion: {question:'Четыре одинаковых билета стоят 280 рублей. Сколько стоит один?', answer:70, hint:'Все билеты стоят одинаково. Раздели 280 на число билетов.', why:'280 : 4 = 70 рублей. Проверка: 4 · 70 = 280.'},
    'fraction-parts': {question:'Полоску разделили на 8 равных частей и взяли 5. Какую часть целого взяли? Запиши дробь.', answer:[5,8], hint:'В знаменателе — все равные части; в числителе — взятые.', why:'Взяли 5 из 8 равных частей: 5/8. Равные записи, например 10/16, тоже подходят.'},
    'fraction-equivalent': {question:'Треть полоски разделили на двенадцатые доли того же целого. Сколько двенадцатых долей в одной трети?', answer:4, hint:'Размер целого не меняется. Каждую треть делят на четыре одинаковые части.', why:'1/3 = 4/12. Изменился размер доли, но закрашенная длина осталась прежней.'},
    'fraction-add': {question:'Сложи одну шестую и четыре шестых. Запиши полученную дробь.', answer:[5,6], hint:'Размер долей одинаковый. Сложи их количества, сохрани размер доли.', why:'1/6 + 4/6 = 5/6. Знаменатель не складывают.'},
    decimal: {question:'Целое разделили на 100 равных частей и взяли 7. Запиши долю десятичной дробью.', answer:0.07, hint:'Это семь сотых; десятых здесь нет.', why:'7/100 = 0,07. В числе 0,7 было бы семь десятых, то есть 70 сотых.'},
    'decimal-add': {question:'Вычисли 0,4 + 0,3.', answer:0.7, hint:'Сложи четыре и три одинаковые десятые доли.', why:'4 десятых + 3 десятых = 7 десятых = 0,7.'},
    rounding: {question:'Округли 4,2 до целого числа.', answer:4, hint:'Сравни расстояния от 4,2 до соседних целых 4 и 5.', why:'До 4 расстояние 0,2, до 5 — 0,8. Поэтому 4,2 ≈ 4, а не 4,2 = 4.'},
    'decimal-shift': {question:'Делим 7,2 на 0,8. Оба числа умножили на 10. Каким стал делитель?', answer:8, hint:'Делитель — число 0,8. Увеличь его в 10 раз.', why:'Делитель стал 8, делимое — 72. Обе величины умножены на 10, поэтому частное сохраняется.'},
    negative: {question:'Начни в точке −4 и сделай 2 шага вправо. Где окажешься?', answer:-2, hint:'Каждый шаг вправо увеличивает число на 1.', why:'−4 → −3 → −2. Движение вправо не обязательно сразу приводит к положительному числу.'},
    units: {question:'Сколько сантиметров в 5 метрах?', answer:500, hint:'В каждом метре 100 сантиметров. Нужно пять таких групп.', why:'5 · 100 = 500 сантиметров.'},
    'area-units': {question:'Квадрат разбили на 4 ряда по 4 клетки. Сколько всего клеток?', answer:16, hint:'В каждом из четырёх рядов по четыре клетки.', why:'4 · 4 = 16 клеток. Число клеток вдоль стороны и площадь — разные величины.'},
    order: {question:'Вычисли 5 + 3 · 4.', answer:17, hint:'Умножение выполняется раньше сложения.', why:'3 · 4 = 12; 5 + 12 = 17.'},
    'first-part': {question:'Делим 936 на 4. Сколько первых цифр нужно взять, чтобы начать деление?', answer:1, hint:'Сравни первую цифру 9 с делителем 4. Если её достаточно, следующую пока не бери.', why:'9 ≥ 4. Достаточно одной первой цифры — 9.'},
    compare: {question:'На сколько 9 больше 5?', answer:4, hint:'Убери пять пар и посчитай, сколько осталось в большей группе.', why:'9 − 5 = 4. Это разность, а не сумма групп.'},
    bring: {question:'После вычитания осталось 2. Переносим справа цифру 3. Какое число получилось?', answer:23, hint:'Цифра 2 теперь обозначает два десятка. Справа приписали 3 единицы.', why:'2 · 10 + 3 = 23. Приписать цифру — не то же самое, что прибавить её.'},
    divide: {question:'Разложи 20 фишек поровну в 4 коробки. Сколько будет в каждой?', answer:5, hint:'Найди число, которое при умножении на 4 даёт 20.', why:'20 : 4 = 5. Проверка: 4 · 5 = 20.'},
    quotient: {question:'Сколько раз по 7 помещается в 38? Впиши одну цифру.', answer:5, hint:'Нужно наибольшее произведение цифры на 7, которое не больше 38.', why:'5 · 7 = 35 ≤ 38, а 6 · 7 = 42 > 38. Подходит 5.'},
    'write-digit': {question:'Получилось 37. Какую цифру напишем крайней справа?', answer:7, hint:'Пишем цифру единиц получившегося числа.', why:'7 пишем справа, 3 держим в уме.'},
    'in-mind': {question:'Получилось 48. Цифру 8 уже написали справа. Сколько оставим в уме?', answer:4, hint:'Посмотри, сколько десятков в числе 48.', why:'8 написали, 4 десятка переносим в следующий разряд.'},
    multiply: {question:'В пяти коробках по 4 фишки. Сколько фишек всего?', answer:20, hint:'Возьми четыре пять раз.', why:'4 + 4 + 4 + 4 + 4 = 20, то есть 5 · 4 = 20.'},
    subtract: {question:'Было 15 фишек. Убрали 6. Сколько осталось?', answer:9, hint:'Убираем шесть из пятнадцати. Можно проверить ответ сложением.', why:'15 − 6 = 9. Проверка: 9 + 6 = 15.'},
    add: {question:'Вычисли 8 + 6.', answer:14, hint:'Сначала дополни 8 до 10; затем прибавь оставшуюся часть шестёрки.', why:'8 + 2 = 10, осталось ещё 4. Получилось 14.'},
    count: {question:'Сколько здесь точек?', answer:10, picture:'count', hint:'Считай по рядам: сначала верхний, затем нижний; не считай точку дважды.', why:'Два ряда по пять точек: всего 10.'}
  });
  function transferFor(id) { const q = transfers[id]; return q ? {...q, answer:Array.isArray(q.answer) ? q.answer.slice() : q.answer} : null; }
  function svg(body, label, width = 320, height = 120) {
    return '<svg class="bh-svg" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="' + esc(label) + '">' + body + '</svg>';
  }
  function bar(parts, on, y, label, color = '#26815d') {
    return '<text x="20" y="' + (y - 9) + '">' + esc(label) + '</text>' + Array.from({length:parts}, (_, i) => '<rect x="' + (20 + i * 280 / parts) + '" y="' + y + '" width="' + (280 / parts - 3) + '" height="32" rx="3" fill="' + (i < on ? color : '#edf2ee') + '" stroke="#829c8b"/>').join('');
  }
  function dots(count, cols = 6, fill = '#26815d') {
    return Array.from({length:count}, (_, i) => '<circle cx="' + (27 + (i % cols) * 38) + '" cy="' + (28 + Math.floor(i / cols) * 38) + '" r="10" fill="' + fill + '"/>').join('');
  }
  function buildModel(doc, id, state, enabled) {
    const node = curriculum[id], wrap = doc.createElement('div');
    wrap.className = 'bh-model';
    const picture = doc.createElement('div');
    wrap.append(picture);
    const addAction = (text, act, disabled) => {
      const button = doc.createElement('button');button.type = 'button';button.className = 'bh-model-action';button.textContent = text;
      button.onclick = () => { if (!enabled()) return;act();paint(); };
      wrap.append(button);return {button, disabled};
    };
    let actions = [], paint;
    const text = value => '<p class="bh-model-caption">' + esc(value) + '</p>';
    switch (node.model) {
      case 'percent':
        paint = () => {picture.innerHTML = svg(Array.from({length:100}, (_, i) => '<rect x="' + (10 + i % 10 * 19) + '" y="' + (10 + Math.floor(i / 10) * 19) + '" width="16" height="16" rx="2" fill="' + (i < 25 ? '#26815d' : '#edf2ee') + '" stroke="#91aa9a"/>').join(''), '25 из 100 одинаковых клеток закрашены', 210, 210);};break;
      case 'quarter': paint = () => {picture.innerHTML = svg(bar(4,1,40,'Вся полоска — 80'), 'Четыре равные части; одна закрашена') + text('25% = ')+ fraction(1,4);};break;
      case 'fifths': paint = () => {picture.innerHTML = svg(bar(5,1,40,'Вся полоска — 50 рублей'), 'Одна из пяти равных частей закрашена');};break;
      case 'tickets': paint = () => {picture.innerHTML = svg(bar(3,0,40,'Три билета вместе — 240 рублей'), 'Три одинаковых билета');};break;
      case 'fraction': paint = () => {picture.innerHTML = svg(bar(4,3,40,'Вся полоска — 1'), 'Три из четырёх равных частей закрашены');};break;
      case 'equivalent': paint = () => {picture.innerHTML = svg(bar(2,1,30,'Половина') + bar(4,2,105,'Та же длина в четвертях'), 'Одна половина равна двум четвертям',320,155);};break;
      case 'fraction-add': paint = () => {picture.innerHTML = svg(bar(4,1,30,'Одна четверть') + bar(4,2,105,'Ещё две четверти','#d09d35'), 'Одна четверть и ещё две четверти',320,155);};break;
      case 'decimal': paint = () => {picture.innerHTML = svg(bar(10,3,40,'Вся полоска — 1'), 'Три из десяти частей закрашены');};break;
      case 'decimal-add': paint = () => {picture.innerHTML = svg(bar(10,3,30,'0,3')+bar(10,2,105,'0,2','#d09d35'), 'Три десятых и ещё две десятых',320,155);};break;
      case 'rounding': paint = () => {picture.innerHTML = svg('<line x1="30" y1="60" x2="290" y2="60" stroke="#5d7064" stroke-width="2"/>'+Array.from({length:11}, (_,i)=>'<line x1="'+(30+i*26)+'" y1="55" x2="'+(30+i*26)+'" y2="65" stroke="#5d7064"/>').join('')+'<circle cx="212" cy="60" r="7" fill="#26815d"/><text x="25" y="90">2</text><text x="285" y="90">3</text><text x="196" y="38">2,7</text>', 'Точка 2,7 между 2 и 3, ближе к 3');};break;
      case 'shift': paint = () => {picture.innerHTML = '<div class="bh-shift"><span>4,8 → 48</span><span>0,6 → ?</span></div>'+text('Оба числа увеличиваем в 10 раз.');};break;
      case 'number-line':
        state.moves ??= 0;
        paint = () => {picture.innerHTML = svg('<line x1="30" y1="60" x2="290" y2="60" stroke="#5d7064" stroke-width="2"/>'+Array.from({length:7},(_,i)=>'<line x1="'+(40+i*40)+'" y1="54" x2="'+(40+i*40)+'" y2="66" stroke="#5d7064"/><text x="'+(i<3?31+i*40:36+i*40)+'" y="91">'+(i-3)+'</text>').join('')+'<circle cx="'+(80+state.moves*40)+'" cy="60" r="8" fill="#26815d"/>','Три шага вправо от минус двух');};
        actions.push(addAction('Шаг вправо',()=>state.moves++,()=>state.moves>=3));break;
      case 'units': paint = () => {picture.innerHTML = '<div class="bh-unit-parts">'+Array.from({length:3},()=>'<span>1 м<br>100 см</span>').join('')+'</div>';};break;
      case 'area': paint = () => {picture.innerHTML = svg(Array.from({length:9},(_,i)=>'<rect x="'+(70+i%3*55)+'" y="'+(10+Math.floor(i/3)*55)+'" width="51" height="51" fill="#e1efe6" stroke="#26815d"/>').join(''),'Три ряда по три клетки',320,185);};break;
      case 'order': paint = () => {picture.innerHTML = '<div class="bh-expression">3 + <mark>4 · 2</mark></div>'+text('Начни с выделенного действия.');};break;
      case 'first-part': paint = () => {picture.innerHTML = '<div class="bh-expression"><span class="bh-selected-digit">4</span><span>2</span> : 6</div>'+text('4 < 6. Одной первой цифры не хватает.');};break;
      case 'compare': paint = () => {picture.innerHTML = svg(dots(4)+ '<g transform="translate(0,55)">'+dots(6,6,'#c2922c')+'</g>','Четыре точки сверху и шесть снизу',320,135);};break;
      case 'bring': paint = () => {picture.innerHTML = '<div class="bh-expression">1<span class="bh-selected-digit">2</span></div>'+text('Справа к оставшейся 1 приписали цифру 2.');};break;
      case 'write-digit': paint = () => {picture.innerHTML = '<div class="bh-expression">26 → <span class="bh-selected-digit" data-bh-write-slot>·</span></div>'+text('Впиши цифру — она сразу появится на своём месте.');};break;
      case 'in-mind': paint = () => {picture.innerHTML = '<div class="bh-expression">26 → <span class="bh-selected-digit">6</span></div>'+text('6 уже написали. Слева осталась 2.');};break;
      case 'divide':
        state.rows ??= 0;
        paint = () => {picture.innerHTML = svg(Array.from({length:3},(_,i)=>'<rect x="'+(10+i*104)+'" y="18" width="93" height="116" rx="8" fill="#f4f7f4" stroke="#829c8b"/>'+Array.from({length:state.rows},(_,j)=>'<circle cx="'+(35+i*104+j%2*36)+'" cy="'+(50+Math.floor(j/2)*43)+'" r="11" fill="#26815d"/>').join('')).join(''),'Три коробки с одинаковым количеством фишек',320,145)+text('Осталось разложить: '+(12-state.rows*3));};
        actions.push(addAction('Положить по одной',()=>state.rows++,()=>state.rows>=4));break;
      case 'quotient':
        state.digit ??= 0;
        paint = () => {picture.innerHTML = '<div class="bh-trial"><strong>'+state.digit+' · 6 = '+state.digit*6+'</strong><span>Сравни с 29</span></div>'+svg('<rect x="12" y="20" width="290" height="25" rx="3" fill="#edf2ee" stroke="#829c8b"/><rect x="12" y="20" width="'+(state.digit*6*5)+'" height="25" rx="3" fill="#26815d"/><line x1="157" y1="12" x2="157" y2="55" stroke="#ae791b" stroke-width="3"/><text x="144" y="77">29</text>','Произведение выбранной цифры на 6; отметка 29',320,90);};
        actions.push(addAction('Цифра меньше',()=>state.digit--,()=>state.digit<=0));
        actions.push(addAction('Цифра больше',()=>state.digit++,()=>state.digit>=9));break;
      case 'multiply':
        state.groups ??= 1;
        paint = () => {picture.innerHTML = svg(Array.from({length:4},(_,i)=>'<rect x="'+(9+i%2*155)+'" y="'+(9+Math.floor(i/2)*66)+'" width="145" height="55" rx="6" fill="#f4f7f4" stroke="#829c8b"/>'+(i<state.groups?Array.from({length:3},(_,j)=>'<circle cx="'+(35+i%2*155+j*35)+'" cy="'+(36+Math.floor(i/2)*66)+'" r="9" fill="#26815d"/>').join(''):'')).join(''),'Четыре коробки по три фишки',320,145)+text('Заполнено коробок: '+state.groups+' из 4');};
        actions.push(addAction('Ещё одну коробку по 3',()=>state.groups++,()=>state.groups>=4));break;
      case 'subtract':
        state.removed ??= 0;
        paint = () => {picture.innerHTML = svg(Array.from({length:12},(_,i)=>'<circle cx="'+(27+i%6*48)+'" cy="'+(30+Math.floor(i/6)*50)+'" r="12" fill="'+(i>=12-state.removed?'#fff':'#26815d')+'" stroke="#829c8b"/>').join(''),'Двенадцать фишек, часть убрана',320,115)+text('Убрано: '+state.removed+' из 5');};
        actions.push(addAction('Убрать одну',()=>state.removed++,()=>state.removed>=5));break;
      case 'add':
        state.added ??= 0;
        paint = () => {picture.innerHTML = svg(Array.from({length:20},(_,i)=>'<rect x="'+(10+i%10*30)+'" y="'+(14+Math.floor(i/10)*44)+'" width="26" height="34" rx="3" fill="'+(i<7?'#26815d':i<7+state.added?'#c2922c':'#f4f7f4')+'" stroke="#91aa9a"/>').join(''),'Семь фишек, к ним добавляют пять',320,110)+text('Прибавлено: '+state.added+' из 5');};
        actions.push(addAction('Прибавить 1',()=>state.added++,()=>state.added>=5));break;
      case 'count': {
        state.marked ??= [];
        const cells=doc.createElement('div');cells.className='bh-count';
        const caption=doc.createElement('p');caption.className='bh-model-caption';
        for(let i=0;i<8;i++){
          const b=doc.createElement('button');b.type='button';b.className='bh-dot';b.setAttribute('aria-label','Отметить точку '+(i+1));
          b.onclick=()=>{if(!enabled())return;state.marked=state.marked.includes(i)?state.marked.filter(x=>x!==i):state.marked.concat(i);paint();};cells.append(b);
        }
        picture.append(cells,caption);
        paint=()=>{Array.from(cells.children).forEach((b,i)=>b.setAttribute('aria-pressed',String(state.marked.includes(i))));caption.textContent='Отмечено: '+state.marked.length;};break;
      }
      default: paint=()=>{};
    }
    const draw=paint;paint=()=>{draw();actions.forEach(({button,disabled})=>{button.disabled=disabled();});};
    paint();return wrap;
  }

  let instanceNumber = 0;
  function create() {
    let options = {}, identity, root, toggle, panel, body, navigation, back, returnRoot, level, rootFrame;
    let isOpen = false, destroyed = false, frames = new Map(), stack = ['root'], doc;
    const savedDisabled = new WeakMap();
    const instance = ++instanceNumber;
    function button(label, className, fn) {const b=doc.createElement('button');b.type='button';b.className=className;b.textContent=label;b.onclick=fn;return b;}
    function enabled() {return !destroyed && !options.disabled;}
    function safeFocus(node) {if(node?.isConnected && !node.disabled)node.focus({preventScroll:true});}
    function rootLinks(frame) {
      frame.querySelector('.bh-prerequisites')?.remove();
      const links=doc.createElement('div');links.className='bh-prerequisites';
      const id=skillFor(options.contentId,options.context);
      const lead=doc.createElement('p');lead.textContent='Нужно разобрать действие попроще?';links.append(lead);
      links.append(skillButton(id));frame.append(links);
    }
    function skillButton(id) {
      const b=button(curriculum[id].title,'bh-deeper',()=>enter(id));b.dataset.bhSkill=id;return b;
    }
    function makeTransfer(id) {
      const data=transferFor(id), section=doc.createElement('section');
      section.className='bh-transfer';section.hidden=true;section.dataset.bhTransfer=id;
      const record={first:null,attempts:0,help:false,done:false};
      const title=doc.createElement('h4');title.textContent='Проверь себя на другом примере';
      const note=doc.createElement('p');note.className='bh-small';note.textContent='Это короткая проверка после разбора. Она не начисляет результат курса; вернись затем к основной задаче. Ответ хранится, пока открыта эта задача.';
      const question=doc.createElement('p');question.className='bh-question';question.textContent=data.question;
      section.append(title,note,question);
      if(data.picture==='count'){
        const dots=doc.createElement('div');dots.className='bh-transfer-dots';
        for(let i=0;i<10;i++){const dot=doc.createElement('span');dot.setAttribute('role','img');dot.setAttribute('aria-label','Точка');dots.append(dot);}
        section.append(dots);
      }
      const input=doc.createElement('input');input.type='text';input.className='bh-transfer-answer';input.inputMode=Array.isArray(data.answer)?'text':'decimal';input.autocomplete='off';input.maxLength=30;input.setAttribute('aria-label','Ответ на новый пример');
      const feedback=doc.createElement('p');feedback.className='bh-transfer-feedback';feedback.setAttribute('role','status');
      const history=doc.createElement('p');history.className='bh-small bh-transfer-history';history.setAttribute('aria-live','polite');
      const hintText=doc.createElement('p');hintText.className='bh-transfer-hint-text';hintText.hidden=true;
      const hint=button('Нужен намёк','bh-transfer-hint',()=>{
        if(!enabled()||record.done||!section.isConnected||section.hidden)return;
        record.help=true;hintText.hidden=false;hintText.textContent=data.hint;updateHistory();
      });
      function updateHistory(){
        history.textContent=(record.first===null?'':('Первый ответ: '+record.first+'. Попыток: '+record.attempts+'. '))+(record.help?'Намёк открыт.':'Без намёка.');
      }
      const check=button('Проверить новый пример','bh-transfer-check',()=>{
        if(!enabled()||record.done||!section.isConnected||section.hidden)return;
        const raw=input.value.trim();
        if(!raw){feedback.textContent='Впиши ответ. Пустое поле не считается попыткой.';safeFocus(input);return;}
        if(!rational(raw)){feedback.textContent='Впиши число или дробь через /. Знаменатель не может быть нулём.';safeFocus(input);return;}
        if(record.first===null)record.first=raw;
        record.attempts++;
        const correct=acceptsAnswer(data.answer,raw);updateHistory();
        feedback.classList.toggle('bh-correct',correct);
        if(correct){
          record.done=true;section.dataset.bhTransferSolved='true';input.readOnly=true;check.disabled=true;hint.disabled=true;
          feedback.textContent=(record.help?'Получилось с намёком. ':record.attempts===1?'Верно с первой попытки без намёка. ':'Верно после исправления без намёка. ')+data.why;
        }else{
          feedback.textContent='Пока не совпало. Проверь, какое число требуется найти.'+(record.attempts>=2?' Можно открыть намёк — он появится только по нажатию.':'');
          // Do not reveal the direction or answer merely because two errors occurred.
          hint.classList.toggle('bh-help-offered',record.attempts>=2);
        }
      });
      input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();check.click();}};
      const row=doc.createElement('div');row.className='bh-answer-row';row.append(input,check);
      section.append(row,feedback,history,hint,hintText);
      return section;
    }
    function makeFrame(id) {
      const data=curriculum[id], frame=doc.createElement('section');frame.className='bh-frame';frame.dataset.bhNode=id;frame.tabIndex=-1;
      const label=doc.createElement('p');label.className='bh-small';label.textContent='На более простом примере';
      const heading=doc.createElement('h3');heading.textContent=data.title;
      const q=doc.createElement('p');q.className='bh-question';q.textContent=data.question;
      const model=buildModel(doc,id,{},enabled), transfer=makeTransfer(id);
      const startTransfer=button('Теперь сам: другой пример','bh-start-transfer',()=>{if(!enabled()||frame.dataset.bhSolved!=='true')return;transfer.hidden=false;startTransfer.hidden=true;safeFocus(transfer.querySelector('input'));});startTransfer.hidden=true;
      const answerRow=doc.createElement('div');answerRow.className='bh-answer-row';
      const input=doc.createElement('input');input.className='bh-answer';input.type='text';input.inputMode=Array.isArray(data.answer)?'text':'decimal';input.autocomplete='off';input.maxLength=30;input.setAttribute('aria-label','Ответ в маленьком задании');
      if(data.model==='write-digit')input.oninput=()=>{if(enabled())model.querySelector('[data-bh-write-slot]').textContent=/^\d$/.test(input.value)?input.value:'·';};
      const feedback=doc.createElement('p');feedback.className='bh-feedback';feedback.setAttribute('role','status');
      const check=button('Проверить','bh-check',()=>{
        if(!enabled())return;
        if(!input.value.trim()){feedback.textContent='Впиши ответ.';safeFocus(input);return;}
        const correct=accepts(id,input.value);feedback.classList.toggle('bh-correct',correct);
        feedback.textContent=correct?'Верно. '+data.why+' Теперь можно вернуться на шаг выше.':'Пока не совпало. '+data.hint;
        if(correct){input.readOnly=true;check.disabled=true;frame.dataset.bhSolved='true';startTransfer.hidden=false;const slot=model.querySelector('[data-bh-write-slot]');if(slot)slot.textContent=String(data.answer);}
      });
      input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();check.click();}};
      answerRow.append(input,check);
      frame.append(label,heading,q,model,answerRow,feedback,startTransfer,transfer);
      if(Array.isArray(data.answer)){
        const format=doc.createElement('p');format.className='bh-small';format.innerHTML='Дробь вводи через знак /. Например, для '+fraction(1,2)+' введи 1, затем /, затем 2.';frame.append(format);
      }
      if(data.children.length){const children=doc.createElement('div');children.className='bh-prerequisites';const lead=doc.createElement('p');lead.textContent='И это пока трудно?';children.append(lead);data.children.forEach(child=>children.append(skillButton(child)));frame.append(children);}
      frames.set(id,frame);return frame;
    }
    function showFrame(focus = false) {
      const id=stack[stack.length-1], frame=id==='root'?rootFrame:frames.get(id)||makeFrame(id);
      if(frame.parentElement!==body)body.append(frame);
      for(const node of body.children)node.hidden=node!==frame;
      navigation.hidden=id==='root';back.disabled=!!options.disabled;returnRoot.disabled=!!options.disabled;
      level.textContent=id==='root'?'Помощь к заданию':'Шаг помощи '+(stack.length-1);
      panel.dataset.bhDepth=String(stack.length-1);
      if(focus)safeFocus(frame);
    }
    function enter(id) {
      if(!enabled()||!isOpen||!curriculum[id]||stack.includes(id))return false;
      const current=stack[stack.length-1];
      if(current==='root'){if(id!==skillFor(options.contentId,options.context))return false;}
      else if(!curriculum[current].children.includes(id))return false;
      stack.push(id);showFrame(true);return true;
    }
    function close(focus = true) {
      if(!root)return;
      isOpen=false;panel.hidden=true;toggle.setAttribute('aria-expanded','false');
      if(focus)safeFocus(toggle);
    }
    function open() {
      if(!root||!enabled()||isOpen)return false;
      // Mark assistance before exposing any hints. Child checks never call this.
      options.onUse?.({identity,contentId:options.contentId});
      if(!enabled())return false;
      isOpen=true;panel.hidden=false;toggle.setAttribute('aria-expanded','true');showFrame();return true;
    }
    function update(next) {
      if(destroyed)throw Error('This help panel has been destroyed.');
      if(!next?.host?.ownerDocument)throw Error('A help host is required.');
      const newIdentity=String(next.identity??'');
      if(root&&doc!==next.host.ownerDocument)throw Error('A help panel cannot move between documents.');
      options={...next};doc=next.host.ownerDocument;
      if(!root){
        root=doc.createElement('div');root.className='bh-help';
        toggle=button('Нужна помощь?','bh-toggle',()=>{if(!enabled())return;if(isOpen)close();else open();});
        toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','bh-panel-'+instance);
        panel=doc.createElement('section');panel.className='bh-panel';panel.id='bh-panel-'+instance;panel.hidden=true;panel.setAttribute('aria-label','Помощь к заданию');
        const head=doc.createElement('div');head.className='bh-panel-head';level=doc.createElement('span');level.className='bh-small';
        head.append(level,button('Скрыть помощь','bh-close',()=>close()));
        navigation=doc.createElement('nav');navigation.className='bh-navigation';navigation.setAttribute('aria-label','Вернуться из подсказки');
        back=button('← Назад на шаг','bh-back',()=>{if(!enabled()||stack.length<2)return;stack.pop();showFrame(true);});
        returnRoot=button('К исходной задаче','bh-root',()=>{if(!enabled())return;stack=['root'];showFrame(true);});
        navigation.append(back,returnRoot);body=doc.createElement('div');body.className='bh-body';panel.append(head,navigation,body);root.append(toggle,panel);
      }
      if(identity!==newIdentity){
        identity=newIdentity;isOpen=false;stack=['root'];frames=new Map();body.replaceChildren();
        rootFrame=doc.createElement('div');rootFrame.className='bh-frame';rootFrame.dataset.bhNode='root';rootFrame.tabIndex=-1;
        const content=doc.createElement('div');content.className='bh-current-hint';rootFrame.append(content);body.append(rootFrame);
        toggle.setAttribute('aria-expanded','false');panel.hidden=true;
      }
      const content=rootFrame.querySelector('.bh-current-hint');
      if(next.rootContent&&next.rootContent.nodeType===1&&next.rootContent!==content){
        if(next.rootContent.contains(root))throw Error('Root hint content must not contain its own help panel.');
        content.replaceChildren(next.rootContent);
      }else if(!content.childNodes.length){content.textContent='Разберём нужное действие на маленьком примере, затем вернёмся к твоей задаче.';}
      rootLinks(rootFrame);next.host.append(root);
      toggle.disabled=!!options.disabled;
      if(options.disabled)close(false);
      for(const control of panel.querySelectorAll('button,input,select,textarea')){
        if(options.disabled){if(!savedDisabled.has(control))savedDisabled.set(control,control.disabled);control.disabled=true;}
        else if(savedDisabled.has(control)){control.disabled=savedDisabled.get(control);savedDisabled.delete(control);}
      }
      showFrame();return handle;
    }
    const handle={update,open,close,isOpen:()=>isOpen,getState:()=>({identity,isOpen,depth:stack.length-1,nodeId:stack[stack.length-1]}),destroy(){close(false);root?.remove();frames.clear();destroyed=true;}};
    return handle;
  }
  return Object.freeze({create,skillFor,accepts,acceptsAnswer,transferFor,curriculum});
});
