// Continuation of the existing factory, not a new route or progress key migration.
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./like-terms-factory-math.js'));
  } else {
    root.LikeTermsPolynomials = factory(root.FactoryMath);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (MathChecker) {
  'use strict';
  const storageKey = 'likeTermsFactory.polynomials.v1';
  const field = (label, expected, form = 'simplified') => ({ label, expected, form });
  const factorFields = (factor, remainder, expanded) => [
    field('Наибольший общий одночленный множитель (с положительным коэффициентом)', factor),
    field('Что останется внутри скобок', remainder),
    field('Проверка: раскрытые скобки, в стандартном виде', expanded)
  ];
  const polynomialSteps = [
    {
      id: 'standard', title: 'Собери подобные члены', expression: '4x² − 3x + 2x² + 5x − 1',
      prompt: 'Приведи многочлен к стандартному виду. Не меняй степени при сложении.',
      fields: [field('Стандартный вид', '6x²+2x-1')],
      hints: ['Отдельно собери члены с x², с x и свободный член.', 'У каждой группы сложи коэффициенты вместе со знаками.'],
      explain: '4x² + 2x² = 6x²; −3x + 5x = 2x. Получаем 6x² + 2x − 1.'
    },
    {
      id: 'degree', title: 'Степень после упрощения', expression: '2a³ − 2a³ + 5ab − 3b',
      prompt: 'Запиши стандартный вид и только затем найди степень ненулевого многочлена.',
      fields: [field('Стандартный вид', '5ab-3b'), field('Степень многочлена', '2', 'degree')],
      hints: ['Какую сумму дают два члена с a³?', 'Степень одночлена ab — сумма показателей степеней двух букв.'],
      explain: 'Члены с a³ уничтожаются. У 5ab степень 2, у −3b степень 1. Степень многочлена 2.'
    },
    {
      id: 'distribute', title: 'Одночлен умножается на каждый член', expression: '−2x(3x − 4) + x²',
      prompt: 'В первой строке выполни умножение, но не приводи подобные. Во второй приведи.',
      fields: [field('Раскрытая сумма из трёх слагаемых', '-6x²+8x+x²', 'expanded'), field('Стандартный вид', '-5x²+8x')],
      hints: ['Умножь −2x на оба члена скобок. Последнее x² не входило в скобки.', 'Минус на минус даёт плюс, при умножении одинаковых букв показатели складываются.'],
      explain: '−2x · 3x = −6x²; −2x · (−4) = 8x. Добавляем x² и получаем −5x² + 8x.'
    },
    {
      id: 'factor', title: 'Обратное распределительное действие', expression: '6x² + 9x', factor: true,
      prompt: 'Вынеси наибольший общий одночленный множитель с положительным коэффициентом. Затем раздели каждый член на него и проверь раскрытием скобок.',
      fields: factorFields('3x', '2x+3', '6x²+9x'),
      hints: ['Найди НОД коэффициентов 6 и 9 и наименьшую степень x, общую для обоих членов.', 'Внутри скобок запиши частные каждого исходного члена и найденного множителя.'],
      explain: 'НОД(6, 9) = 3; общая буквенная часть x. 6x² + 9x = 3x(2x + 3). Обратное раскрытие возвращает исходный многочлен.'
    },
    {
      id: 'factor-two-letters', title: 'Общий множитель нескольких букв', expression: '12a³b − 8a²b²', factor: true,
      prompt: 'Вынеси наибольший общий одночленный множитель с положительным коэффициентом и проверь результат.',
      fields: factorFields('4a²b', '3a-2b', '12a³b-8a²b²'),
      hints: ['Сравни числовые коэффициенты и степени каждой буквы отдельно.', 'В общую часть войдут только степени, присутствующие в обоих членах. При делении показатели вычитаются.'],
      explain: 'НОД(12, 8) = 4, общие степени a² и b. Получаем 4a²b(3a − 2b); обратное раскрытие даёт 12a³b − 8a²b².'
    },
    {
      id: 'independent-factor', title: 'Самостоятельное разложение', expression: '−15y² + 10y', factor: true, checkpoint: true,
      prompt: 'Без подсказки вынеси наибольший общий одночленный множитель с положительным коэффициентом и выполни проверку.',
      fields: factorFields('5y', '-3y+2', '-15y²+10y'),
      explain: 'НОД(15, 10) = 5, общая буквенная часть y. −15y² + 10y = 5y(−3y + 2).'
    },
    {
      id: 'independent-area', title: 'Перенос: площадь прямоугольника', expression: 'S = 8x² + 12x,  ширина = 4x,  x > 0', checkpoint: true,
      prompt: 'Площадь прямоугольника дана в см², ширина — в см. Найди длину в см. Проверь ответ, умножив длину на ширину. Вводи только выражения.',
      fields: [field('Длина прямоугольника', '2x+3'), field('Произведение ширины и длины в стандартном виде', '8x²+12x')],
      explain: '8x² + 12x = 4x(2x + 3). Так как x > 0, ширина 4x положительна; длина 2x + 3 см. Умножение возвращает площадь.'
    }
  ];


  const groupingKey = 'likeTermsFactory.grouping.v1';
  const productFields = (expanded, result) => [
    field('Четыре произведения до приведения подобных', expanded, 'expanded'),
    field('Стандартный вид', result)
  ];
  // Both group order and factor order are independent mathematical choices.
  const independentGroups = [
    ['6x²+15x','4xy+10y'], ['4xy+10y','6x²+15x'],
    ['6x²+4xy','15x+10y'], ['15x+10y','6x²+4xy']
  ];
  const groupingSteps = [
    {
      id: 'multiply', title: 'Каждый член умножается на каждый', expression: '(x + 2)(x + 5)',
      prompt: 'Рассмотри четыре клетки. В первой строке вычисли все четыре произведения, не собирая подобные. Во второй строке приведи многочлен к стандартному виду.',
      grid: { rows: ['x','2'], cols: ['x','5'], caption: 'Модель площади при x > 0. Алгебраическое равенство верно при любом x.' },
      fields: productFields('x²+5x+2x+10','x²+7x+10'),
      hints: ['Каждый член первой скобки умножь на каждый член второй.', 'Сначала запиши четыре отдельных результата, затем сложи коэффициенты при x.'],
      explain: '(x+2)(x+5) = x²+5x+2x+10 = x²+7x+10.'
    },
    {
      id: 'common-binomial', title: 'От двух групп к одному произведению', expression: '3ax + 6a + 5x + 10',
      prompt: 'Объедини первые два и последние два слагаемых. В каждой группе вынеси наибольший общий одночленный множитель с положительным коэффициентом. Найди одинаковый двучлен, сложи внешние множители и проверь раскрытием.',
      fields: [field('Множитель первой группы','3a'),field('Множитель второй группы','5'),field('Одинаковый двучлен','x+2'),field('Сумма внешних множителей','3a+5'),field('Проверка: стандартный вид произведения','3ax+6a+5x+10')],
      hints: ['В 3ax и 6a есть общий числовой и буквенный множитель. Что общего у 5x и 10?', 'Раздели каждый член на множитель своей группы. Сравни две скобки, как если бы они были одной буквой.'],
      explain: '3a(x+2)+5(x+2)=(3a+5)(x+2). Повторно раскрывая скобки, возвращаем все четыре слагаемых.'
    },
    {
      id: 'opposite', title: 'Одинаковые скобки со сменой знака', expression: '2a(x − 3) + 5(3 − x)',
      prompt: 'Приведи вторые скобки к виду x − 3. Запиши новый внешний множитель второй группы. Затем вынеси одинаковые скобки и проверь произведение.',
      fields: [field('Новый множитель второй группы','-5'),field('Сумма внешних множителей','2a-5'),field('Одинаковый двучлен','x-3'),field('Проверка раскрытием','2ax-6a-5x+15')],
      hints: ['Сравни 3 − x и x − 3: одно выражение является противоположным другому.', 'Если меняешь знаки обоих членов внутри скобок, что происходит со знаком внешнего множителя?'],
      explain: '5(3−x)=−5(x−3). Поэтому 2a(x−3)−5(x−3)=(2a−5)(x−3). Проверка: 2ax−6a−5x+15.'
    },
    {
      id: 'independent-grouping', title: 'Самостоятельно выбери группы', expression: '6x² + 10y + 15x + 4xy', checkpoint: true,
      prompt: 'Раздели четыре слагаемых на две группы по два члена с общим множителем. Затем запиши два двучлена итогового произведения с положительными коэффициентами при буквах. Порядок групп и множителей произвольный.',
      fields: [field('Первая группа (сумма двух членов)','6x²+15x'),field('Вторая группа (сумма двух членов)','4xy+10y'),field('Первый двучлен','3x+2y'),field('Второй двучлен','2x+5')],
      variants: independentGroups.flatMap(pair => [pair.concat('3x+2y','2x+5'),pair.concat('2x+5','3x+2y')]),
      explain: 'Можно собрать 3x(2x+5)+2y(2x+5), а можно 2x(3x+2y)+5(3x+2y). Оба пути дают (3x+2y)(2x+5).'
    },
    {
      id: 'square-sum', title: 'Почему появляется удвоенное произведение', expression: '(x + 3)(x + 3)',
      prompt: 'Это квадрат суммы. Найди четыре отдельные части произведения по таблице, затем собери подобные.',
      grid: { rows: ['x','3'], cols: ['x','3'], caption: 'Квадрат со стороной x + 3 при x > 0. Две прямоугольные части равны; тождество верно при любом x.' },
      fields: productFields('x²+3x+3x+9','x²+6x+9'),
      hints: ['В таблице есть две разные клетки с одинаковым произведением.', 'Не заменяй квадрат суммы суммой квадратов: учитывай обе прямоугольные части.'],
      explain: '(x+3)²=x²+3x+3x+9=x²+6x+9. В общем виде (a+b)²=a²+2ab+b².'
    },
    {
      id: 'square-difference', title: 'Квадрат разности', expression: '(2x − 3)(2x − 3)',
      prompt: 'Запиши четыре отдельные произведения с их знаками, затем приведи подобные.',
      fields: productFields('4x²-6x-6x+9','4x²-12x+9'),
      hints: ['Умножь каждый член на каждый, учитывая оба минуса.', 'У квадрата отрицательного числа положительный знак. У двух смешанных произведений знак отрицательный.'],
      explain: '(2x−3)²=4x²−6x−6x+9=4x²−12x+9. В общем виде (a−b)²=a²−2ab+b².'
    },
    {
      id: 'conjugates', title: 'Почему сокращаются смешанные члены', expression: '(2x − 3)(2x + 3)',
      prompt: 'Раскрой обе скобки и сохрани четыре отдельных произведения, затем приведи подобные. Сравни с предыдущим квадратом разности.',
      fields: productFields('4x²+6x-6x-9','4x²-9'),
      hints: ['Сравни знаки двух смешанных произведений.', 'У этих двух членов одинаковая буквенная часть и противоположные коэффициенты.'],
      explain: '(2x−3)(2x+3)=4x²+6x−6x−9=4x²−9. В общем виде (a−b)(a+b)=a²−b².'
    },
    {
      id: 'independent-squares', title: 'Самостоятельно: разность квадратов', expression: '4x² − 25', checkpoint: true,
      prompt: 'Разложи на два двучлена с положительными коэффициентами при x (порядок произвольный). Проверь раскрытием: сначала четыре произведения, затем стандартный вид.',
      fields: [field('Первый двучлен','2x-5'),field('Второй двучлен','2x+5'),...productFields('4x²+10x-10x-25','4x²-25')],
      variants: [['2x-5','2x+5','4x²+10x-10x-25','4x²-25'],['2x+5','2x-5','4x²+10x-10x-25','4x²-25']],
      explain: '4x²−25=(2x−5)(2x+5). При раскрытии смешанные члены уничтожаются, возвращается исходная разность квадратов.'
    }
  ];

  // The existing exact checker deliberately accepts repeated factors such as xx.
  // For this particular lesson, also require every monomial to have one occurrence
  // of each variable (with a power if needed). Do not alter the legacy checker.
  function repeatedLetter(value) {
    const aliases = { а:'a', в:'b', с:'c', д:'d', е:'e', к:'k', м:'m', н:'n', о:'o', р:'p', т:'t', у:'y', х:'x' };
    return value.toLowerCase().replace(/[а-яё]/g, c => aliases[c] || c)
      .replace(/[−–—]/g, '-').split(/[+-]/).some(term => {
        const letters = term.match(/[a-z]/g) || [];
        return new Set(letters).size !== letters.length;
      });
  }
  function fieldStatus(value, f) {
    if (typeof value !== 'string' || !value.trim()) return 'empty';
    if (f.form === 'degree') return /^\d+$/.test(value.trim()) && BigInt(value.trim()) === BigInt(f.expected) ? 'correct' : 'degree';
    const status = MathChecker.check(value, f.expected, f.form).status;
    return status === 'correct' && repeatedLetter(value) ? 'powers' : status;
  }
  function grade(step, drafts) {
    const values = step.fields.map((_, i) => typeof drafts[i] === 'string' ? drafts[i].slice(0, 240) : '');
    let statuses = step.fields.map((f, i) => fieldStatus(values[i], f));
    // A correct alternative must match one complete approved decomposition.
    // Score partial variants only to select a useful field for feedback.
    if (step.variants) {
      const score = a => a.filter(v => v === 'correct').length;
      const prefix = a => a.every(v => v === 'correct') ? a.length : a.findIndex(v => v !== 'correct');
      for (const variant of step.variants) {
        const alt = step.fields.map((f,i) => fieldStatus(values[i], {...f, expected: variant[i]}));
        if (score(alt) > score(statuses) || (score(alt) === score(statuses) && prefix(alt) > prefix(statuses))) statuses = alt;
      }
    }
    if (step.factor && statuses[0] === 'wrong' && values[0].trim() && values[1].trim()) {
      const product = MathChecker.check('(' + values[0] + ')(' + values[1] + ')', step.fields[2].expected).status;
      if (product === 'expand') statuses[0] = 'maxfactor';
    }
    const index = statuses.findIndex(s => s !== 'correct');
    return { done: index < 0, index, status: index < 0 ? 'correct' : statuses[index], statuses };
  }
  const feedbackFor = {
    empty: 'Заполни эту строку.', syntax: 'Проверь знаки, буквы и формат записи.',
    expand: 'Значение верно, но скобки ещё не раскрыты.',
    collect: 'Значение верно. Вычисли оставшиеся произведения и приведи подобные члены.',
    multiply: 'Значение верно. Выполни умножение, не приводя пока подобные.',
    terms: 'Значение верно, но требуется промежуточная сумма с каждым отдельным слагаемым.',
    powers: 'Значение верно. Повторяющиеся буквы запиши одной буквой со степенью.',
    degree: 'Сравни степени членов уже приведённого многочлена. Для ab учитывай обе буквы.',
    maxfactor: 'Произведение равно исходному многочлену, но нужен наибольший общий одночленный множитель с положительным коэффициентом.',
    wrong: 'Проверь знак, коэффициент и буквенную часть в этой строке.'
  };
  function cleanRecord(raw, step) {
    const r = raw && typeof raw === 'object' ? raw : {};
    const drafts = step.fields.map((_, i) => typeof r.drafts?.[i] === 'string' ? r.drafts[i].slice(0, 240) : '');
    const attempts = Number.isSafeInteger(r.attempts) ? Math.max(0, r.attempts) : 0;
    const hints = step.checkpoint ? 0 : Math.max(0, Math.min(step.hints.length, Number.isSafeInteger(r.hints) ? r.hints : 0));
    const done = r.done === true && grade(step, drafts).done;
    return { drafts, attempts, hints, done, first: ['correct','wrong','assisted'].includes(r.first) ? r.first : null };
  }
  function createWorkshop(steps, storageKey, config) {
  function cleanProgress(raw) {
    const records = {};
    for (const step of steps) records[step.id] = cleanRecord(raw?.records?.[step.id], step);
    const current = raw?.current === 'summary' || steps.some(s => s.id === raw?.current) ? raw.current : steps[0].id;
    return { current, records };
  }
  function createStore(storage) {
    let state = cleanProgress(null), canSave = true;
    function read() {
      if (!canSave) return state;
      try { const raw = storage.getItem(storageKey); if (raw !== null) state = cleanProgress(JSON.parse(raw)); }
      catch { /* private mode or bad saved record; keep in-memory state */ }
      return state;
    }
    function update(change) {
      read(); change(state);
      if (canSave) try { storage.setItem(storageKey, JSON.stringify(state)); } catch { canSave = false; }
      return state;
    }
    return { read, update };
  }
  const sessionStores = new WeakMap();
  function open(root, onBack) {
    const doc = root.ownerDocument;
    let storage;
    try { storage = doc.defaultView.localStorage; } catch { storage = null; }
    let store = sessionStores.get(root);
    if (!store) { store = createStore(storage); sessionStores.set(root, store); }
    const make = (tag, text, cls) => { const e = doc.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; };
    const button = (text, action) => { const b = make('button', text); b.type = 'button'; b.addEventListener('click', action); return b; };
    function go(id) { store.update(p => { p.current = id; }); render(true); }
    function render(moveFocus) {
      const p = store.read(), first = steps.findIndex(s => !p.records[s.id].done);
      const wanted = steps.findIndex(s => s.id === p.current);
      root.replaceChildren();
      root.dataset.step = config.summaryId;
      root.append(button(config.backLabel, onBack));
      if (first === -1 && p.current === 'summary') {
        const title = make('h2', config.summaryTitle); title.tabIndex = -1; root.append(title);
        const independent = steps.filter(s => p.records[s.id].first === 'correct' && !p.records[s.id].hints).length;
        const aided = steps.filter(s => p.records[s.id].hints > 0).length;
        root.append(make('p', `С первой попытки без подсказки: ${independent}. После исправления без подсказки: ${steps.length-independent-aided}. С подсказкой: ${aided}.`));
        for (const step of steps.filter(s => s.checkpoint)) root.append(make('p', step.title + ' — ' + (p.records[step.id].first === 'correct' ? 'с первой попытки' : 'после исправления')));
        const links = make('div', undefined, 'bridge-links');
        for (const [label, href] of config.links) {
          const a = make('a', label); a.href = href; links.append(a);
        }
        if (config.next) {
          const nextLesson = button(config.nextLabel, () => config.next(root, () => render(true)));
          nextLesson.id = config.nextId; root.append(nextLesson);
        }
        root.append(links, button('Посмотреть свои записи', () => go(steps[0].id)));
        if (moveFocus) title.focus(); return;
      }
      const index = first < 0 ? Math.max(0, wanted) : Math.min(first, Math.max(0, wanted < 0 ? first : wanted));
      const step = steps[index], state = p.records[step.id];
      root.dataset.step = config.stepPrefix + step.id;
      root.append(make('p', `Шаг ${index+1} из ${steps.length}${step.checkpoint ? ' · Самостоятельно' : ''}`, 'bridge-progress'));
      const title = make('h2', step.title); title.tabIndex = -1;
      root.append(title, make('p', step.expression, 'expr'), make('p', step.prompt, 'bridge-prompt'));
      if (step.grid) {
        // Multiplication/area model exposes factors, never the calculated products.
        const table = make('table'); table.setAttribute('aria-label', 'Четыре произведения');
        table.style.cssText = 'border-collapse:collapse;width:100%;max-width:26rem;table-layout:fixed;margin:0.75rem 0';
        const caption = make('caption', step.grid.caption); caption.style.cssText = 'text-align:left;padding:.35rem;line-height:1.4'; table.append(caption);
        const head = make('thead'), heading = make('tr'); heading.append(make('th','×'));
        for (const col of step.grid.cols) { const cell = make('th',col); cell.scope='col'; heading.append(cell); }
        head.append(heading); table.append(head);
        const body = make('tbody');
        for (const row of step.grid.rows) {
          const tr = make('tr'), th = make('th',row); th.scope='row'; tr.append(th);
          for (const col of step.grid.cols) { const cell = make('td',row+' · '+col); cell.style.cssText='border:1px solid #a88a68;padding:.6rem .25rem;text-align:center;background:#fef3c7;color:#451a03;overflow-wrap:anywhere'; tr.append(cell); }
          body.append(tr);
        }
        table.append(body); root.append(table);
      }
      const form = make('form', undefined, 'bridge-form'), inputs = [];
      for (const [i, f] of step.fields.entries()) {
        const id = `poly-answer-${i}`, label = make('label', f.label), input = make('input', undefined, 'bridge-answer');
        label.htmlFor = id; input.id = id; input.type = 'text'; input.maxLength = 240;
        input.autocomplete = 'off'; input.spellcheck = false; input.value = state.drafts[i]; input.readOnly = state.done;
        if (f.form === 'degree') input.inputMode = 'numeric';
        input.addEventListener('input', () => store.update(p => { const r = p.records[step.id]; if (!r.done) r.drafts[i] = input.value.slice(0, 240); }));
        inputs.push(input); form.append(label, input);
      }
      const message = make('p'); message.id = 'poly-feedback'; message.setAttribute('role', 'status'); message.setAttribute('aria-live', 'polite');
      if (!state.done) {
        const submit = make('button', 'Проверить'); submit.type = 'submit'; form.append(submit);
        if (!step.checkpoint) {
          const hint = button('Подсказка', () => {
            const updated = store.update(p => { const r = p.records[step.id]; if (!r.done) r.hints = Math.min(step.hints.length, r.hints + 1); }).records[step.id];
            if (updated.done) { render(false); return; }
            message.textContent = step.hints[updated.hints - 1]; hint.disabled = updated.hints >= step.hints.length;
          });
          hint.disabled = state.hints >= step.hints.length; form.append(hint);
          if (state.hints) message.textContent = step.hints[state.hints - 1];
        }
        form.addEventListener('submit', event => {
          event.preventDefault(); const values = inputs.map(i => i.value); const verdict = grade(step, values);
          const updated = store.update(p => {
            const r = p.records[step.id]; if (r.done) return; r.drafts = values;
            if (verdict.status === 'empty') return;
            r.attempts++; if (!r.first) r.first = r.hints ? 'assisted' : verdict.done ? 'correct' : 'wrong'; r.done = verdict.done;
          }).records[step.id];
          if (updated.done) { render(false); root.querySelector('#poly-next')?.focus(); return; }
          message.textContent = step.fields[verdict.index].label + '. ' + (feedbackFor[verdict.status] || feedbackFor.wrong);
          inputs[verdict.index]?.focus();
        });
      } else message.textContent = 'Верно. ' + step.explain;
      root.append(form, message);
      if (index > 0) root.append(button('Предыдущий шаг', () => go(steps[index-1].id)));
      if (state.done) { const next = button(index === steps.length - 1 ? 'Итоги' : 'Следующий шаг', () => go(steps[index+1]?.id || 'summary')); next.id = 'poly-next'; root.append(next); }
      if (moveFocus) title.focus();
    }
    render(true);
  }
  return { steps, storageKey, grade, createStore, cleanProgress, open };
  }
  const grouping = createWorkshop(groupingSteps, groupingKey, {
    summaryId: 'grouping', stepPrefix: 'grouping-', backLabel: '← Итоги урока о многочленах',
    summaryTitle: 'Итоги: группировка и первые формулы',
    links: [['§29 · Умножение многочленов','../school/makarychev7/#lesson/p29'],['§30 · Группировка','../school/makarychev7/#lesson/p30'],['§32 · Квадраты и кубы двучленов','../school/makarychev7/#lesson/p32'],['§33 · Квадрат суммы и разности','../school/makarychev7/#lesson/p33'],['§34 · Сумма и разность','../school/makarychev7/#lesson/p34'],['§35 · Разность квадратов','../school/makarychev7/#lesson/p35'],['§36 · Сумма и разность кубов','../school/makarychev7/#lesson/p36'],['Лаборатория формул сокращённого умножения','formuly-sokrashchennogo-umnozheniya.html']]
  });
  const polynomials = createWorkshop(polynomialSteps, storageKey, {
    summaryId: 'polynomials', stepPrefix: 'polynomial-', backLabel: '← Итоги урока о скобках',
    summaryTitle: 'Итоги: многочлены и общий множитель',
    links: [['§25 · Стандартный вид', '../school/makarychev7/#lesson/p25'], ['§27 · Умножение одночлена', '../school/makarychev7/#lesson/p27'], ['§28 · Общий множитель', '../school/makarychev7/#lesson/p28'], ['§30 · Группировка', '../school/makarychev7/#lesson/p30']],
    nextId: 'polyToGrouping', nextLabel: 'Дальше: группировка и первые формулы', next: grouping.open
  });
  return {...polynomials, grouping};
});
