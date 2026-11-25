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
  const steps = [
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
    const statuses = step.fields.map((f, i) => fieldStatus(values[i], f));
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
      root.dataset.step = 'polynomials';
      root.append(button('← Итоги урока о скобках', onBack));
      if (first === -1 && p.current === 'summary') {
        const title = make('h2', 'Итоги: многочлены и общий множитель'); title.tabIndex = -1; root.append(title);
        const independent = steps.filter(s => p.records[s.id].first === 'correct' && !p.records[s.id].hints).length;
        const aided = steps.filter(s => p.records[s.id].hints > 0).length;
        root.append(make('p', `С первой попытки без подсказки: ${independent}. После исправления без подсказки: ${steps.length-independent-aided}. С подсказкой: ${aided}.`));
        for (const step of steps.filter(s => s.checkpoint)) root.append(make('p', step.title + ' — ' + (p.records[step.id].first === 'correct' ? 'с первой попытки' : 'после исправления')));
        const links = make('div', undefined, 'bridge-links');
        for (const [label, href] of [['§25 · Стандартный вид', '../school/makarychev7/#lesson/p25'], ['§27 · Умножение одночлена', '../school/makarychev7/#lesson/p27'], ['§28 · Общий множитель', '../school/makarychev7/#lesson/p28'], ['§30 · Группировка', '../school/makarychev7/#lesson/p30']]) {
          const a = make('a', label); a.href = href; links.append(a);
        }
        root.append(links, button('Посмотреть свои записи', () => go(steps[0].id)));
        if (moveFocus) title.focus(); return;
      }
      const index = first < 0 ? Math.max(0, wanted) : Math.min(first, Math.max(0, wanted < 0 ? first : wanted));
      const step = steps[index], state = p.records[step.id];
      root.dataset.step = 'polynomial-' + step.id;
      root.append(make('p', `Шаг ${index+1} из ${steps.length}${step.checkpoint ? ' · Самостоятельно' : ''}`, 'bridge-progress'));
      const title = make('h2', step.title); title.tabIndex = -1;
      root.append(title, make('p', step.expression, 'expr'), make('p', step.prompt, 'bridge-prompt'));
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
});
