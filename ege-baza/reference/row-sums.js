(function (root) {
  'use strict';

  const examples = {
    main: { columns: [48, 60, 67], above: 13, below: 16 },
    small: { columns: [8, 24, 34], above: 6, below: 10 }
  };
  const controlKey = 'mathexam.ege-baza.row-sums.control.v1';
  let memoryState;

  function readControl(count) {
    let saved = memoryState;
    try {
      const raw = root.sessionStorage.getItem(controlKey);
      if (!saved && raw) saved = JSON.parse(raw);
    } catch { /* Continue with the current in-memory attempt. */ }
    if (saved && Number.isInteger(saved.index) && saved.index >= 0 && saved.index < count
        && typeof saved.draft === 'string' && saved.draft.length <= 16
        && typeof saved.submitted === 'boolean' && (!saved.submitted || parseAnswer(saved.draft) !== null)) {
      return { index: saved.index, draft: saved.draft, submitted: saved.submitted };
    }
    return { index: 0, draft: '', submitted: false };
  }

  function saveControl(state) {
    memoryState = { ...state };
    try { root.sessionStorage.setItem(controlKey, JSON.stringify(state)); }
    catch { /* Storage may be unavailable. The current attempt remains usable. */ }
  }

  function parseAnswer(raw) {
    const value = raw.trim().replace('−', '-');
    if (!/^[+-]?\d+$/.test(value)) return null;
    const number = Number(value);
    return Number.isSafeInteger(number) ? number : null;
  }

  function extraRowReason(t, a, n) {
    if (n * a.maxRow < a.total) {
      return 'Строк мало. Даже если каждая даёт ' + a.maxRow + ', общая сумма всего '
        + n + ' × ' + a.maxRow + ' = ' + n * a.maxRow + '. Нужно ' + a.total + '.';
    }
    if (n * a.minRow > a.total) {
      return 'Строк много. Даже при наименьшей сумме в каждой получилось бы '
        + n + ' × ' + a.minRow + ' = ' + n * a.minRow + '. Это больше ' + a.total + '.';
    }
    if (n > Math.min(...t.columns)) {
      return 'Строк много для самого малого столбца. Для ' + n
        + ' положительных целых чисел нужно хотя бы ' + n + ' единиц. Сумма этого столбца равна '
        + Math.min(...t.columns) + '.';
    }
    return '';
  }

  function makeTable(rows, caption, isWitness = false) {
    const cells = values => values.map(value => '<td>' + value + '</td>').join('');
    const sums = rows[0].map((_, column) => rows.reduce((sum, row) => sum + row[column], 0));
    const total = sums.reduce((sum, value) => sum + value, 0);
    const header = sums.map((_, i) => '<th scope="col">Столбец ' + (i + 1) + '</th>').join('');
    const body = rows.map(row => '<tr>' + cells(row) + '<td>' + row.reduce((sum, x) => sum + x, 0) + '</td></tr>').join('');
    return '<table' + (isWitness ? ' data-witness-table' : '') + '><caption>' + caption + '</caption><thead><tr>' + header
      + '<th scope="col">Сумма строки</th></tr></thead><tbody>' + body + '</tbody><tfoot><tr>'
      + cells(sums) + '<td>' + total + '</td></tr></tfoot></table>';
  }

  function mountModel(section, engine) {
    const selector = section.querySelector('[data-model-case]');
    const slider = section.querySelector('[data-row-count]');
    const count = section.querySelector('[data-row-value]');
    const details = section.querySelector('[data-model-feedback]');
    const facts = section.querySelector('[data-model-condition]');
    const show = section.querySelector('[data-witness]');
    const place = section.querySelector('[data-model-table]');
    function refresh() {
      const t = examples[selector.value];
      const a = engine.analyze(t);
      const n = Number(slider.value);
      const reason = extraRowReason(t, a, n);
      count.value = String(n);
      facts.textContent = 'Суммы столбцов: ' + t.columns.join(', ') + '. Сумма каждой строки больше '
        + t.above + ' и меньше ' + t.below + '. Все клетки содержат натуральные числа.';
      details.textContent = reason || ('Подходит. Сумма ' + a.total + ' лежит между '
        + n + ' × ' + a.minRow + ' = ' + n * a.minRow + ' и '
        + n + ' × ' + a.maxRow + ' = ' + n * a.maxRow
        + '. В каждом столбце хватит единиц для всех строк. Проверь на таблице.');
      show.disabled = Boolean(reason);
      place.replaceChildren();
    }
    selector.addEventListener('change', () => {
      const small = selector.value === 'small';
      slider.min = small ? '6' : '8';
      slider.max = small ? '11' : '16';
      slider.value = small ? '9' : '11';
      refresh();
    });
    slider.addEventListener('input', refresh);
    show.addEventListener('click', () => {
      const rows = engine.witness(examples[selector.value], Number(slider.value));
      if (rows) place.innerHTML = makeTable(rows, 'Один из возможных вариантов. Внизу — суммы столбцов и общий итог.', true);
    });
    refresh();
  }

  function helpFor(t, a, number) {
    if (number === t.columns.length) return 'Ты указал число столбцов. Столбцы уже заданы. Ищем, сколько в каждом из них клеток по вертикали.';
    if (number === a.total) return 'Это сумма чисел во всей таблице. Сколько раз в неё может поместиться сумма одной строки?';
    if (number >= a.minRows && number * a.minRow <= a.total && number > Math.min(...t.columns)) {
      return 'По общей сумме это число строк подходит. Но в самом малом столбце сумма ' + Math.min(...t.columns)
        + '. В каждой его клетке хотя бы единица. Хватит ли этой суммы на предложенное число строк?';
    }
    const minByLooseEdge = Math.ceil(a.total / t.below);
    const maxByLooseEdge = Math.floor(a.total / t.above);
    if (number === minByLooseEdge || number === maxByLooseEdge) {
      return 'Перечитай слова «больше» и «меньше». Крайние числа ' + t.above + ' и ' + t.below
        + ' недопустимы. Какие целые суммы остаются у одной строки?';
    }
    return number < a.minRows
      ? 'Попробуй взять максимальную допустимую сумму в каждой своей строке. Достигнешь ли общей суммы? Нижнюю границу числа строк округляют вверх.'
      : 'Возьми минимальную допустимую сумму на строку и проверь свой вариант. Верхнюю границу числа строк округляют вниз. Отдельно проверь самый малый столбец.';
  }

  function mountExercise(section, mode, engine) {
    const isCheck = mode === 'check';
    const state = isCheck ? readControl(engine.count) : { index: 0, draft: '', submitted: false };
    const title = section.querySelector('[data-variant]');
    const question = section.querySelector('[data-condition]');
    const form = section.querySelector('form');
    const input = form.elements.answer;
    const submit = form.querySelector('[type=submit]');
    const feedback = section.querySelector('[data-feedback]');
    const next = section.querySelector('[data-next]');
    const hint = section.querySelector('[data-hint]');
    let usedHelp = false;

    function correct() {
      const task = engine.task(mode, state.index);
      return parseAnswer(state.draft) === engine.analyze(task).answer;
    }
    function result() {
      if (!isCheck) return usedHelp ? 'Верно. Ты решил это условие с помощью.' : 'Верно. Число строк найдено.';
      return correct() ? 'Верно. Ты решил задачу самостоятельно.' : 'Ответ принят. В нём есть ошибка.';
    }
    function sync() {
      const t = engine.task(mode, state.index);
      const last = state.index === engine.count - 1;
      title.textContent = 'Задача ' + (state.index + 1) + ' из ' + engine.count;
      question.textContent = 'В каждую клетку записали натуральное число. Суммы столбцов по порядку равны '
        + t.columns.join(', ') + '. В каждой строке сумма больше ' + t.above + ' и меньше '
        + t.below + '. Сколько в таблице строк?';
      input.value = state.draft;
      input.disabled = submit.disabled = state.submitted;
      if (hint) hint.disabled = state.submitted;
      next.disabled = last || (isCheck && !state.submitted);
      feedback.textContent = state.submitted ? result() + (last ? ' Это последняя задача этого набора.' : '') : '';
    }
    input.addEventListener('input', () => {
      state.draft = input.value;
      if (isCheck) saveControl(state);
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (state.submitted) return;
      const value = parseAnswer(input.value);
      if (value === null) {
        feedback.textContent = 'Введи одно целое число цифрами.';
        input.focus();
        return;
      }
      state.draft = input.value;
      const t = engine.task(mode, state.index);
      const a = engine.analyze(t);
      if (!isCheck && value !== a.answer) {
        usedHelp = true;
        feedback.textContent = helpFor(t, a, value);
        return;
      }
      state.submitted = true;
      if (isCheck) saveControl(state);
      sync();
    });
    if (hint) hint.addEventListener('click', () => {
      usedHelp = true;
      const t = engine.task(mode, state.index);
      feedback.textContent = 'Сложи ' + t.columns.join(' + ') + '. Для одной строки выпиши целые числа строго между '
        + t.above + ' и ' + t.below + '. Раздели общий итог сначала на наибольшую, затем на наименьшую сумму строки. Проверь ещё и столбцы: в каждом должно хватить хотя бы по единице на каждую строку.';
    });
    next.addEventListener('click', () => {
      if (state.index + 1 >= engine.count || (isCheck && !state.submitted)) return;
      state.index++;
      state.draft = '';
      state.submitted = false;
      usedHelp = false;
      if (isCheck) saveControl(state);
      sync();
      title.focus();
    });
    sync();
  }

  function exerciseMarkup(mode) {
    const practice = mode === 'practice';
    return '<section data-row-' + mode + '><h3>' + (practice ? 'Тренировка' : 'Самостоятельная проверка')
      + '</h3><p>' + (practice ? 'Реши задачу. Если трудно, можно взять подсказку или разобрать ошибку.'
        : 'Реши новое условие без подсказок. На каждую задачу принимается один числовой ответ.')
      + '</p><p class="rs-variant" data-variant tabindex="-1"></p><p data-condition></p>'
      + '<form><label>Число строк <input name="answer" type="text" inputmode="numeric" maxlength="16" autocomplete="off"></label>'
      + '<button type="submit">Проверить</button></form>'
      + '<p data-feedback role="status" aria-live="polite"></p><div class="rs-actions">'
      + (practice ? '<button type="button" data-hint>Подсказка</button>' : '')
      + '<button type="button" data-next>Следующая задача</button></div></section>';
  }

  function mount(host) {
    const engine = root.EgeRowSums;
    host.innerHTML = '<article class="rs-lesson"><p class="ref-category">ЕГЭ база · Задание 21</p>'
      + '<h2>Сколько строк в таблице?</h2>'
      + '<p>Посмотри на таблицу. Сложи в нижней строке три суммы столбцов. Затем сложи в правом столбце суммы двух строк. Почему ответ будет одинаковым?</p>'
      + makeTable([[2, 4, 1], [1, 3, 5]], 'Два способа сложить одни и те же числа')
      + '<p>Снизу получаем 3 + 7 + 6 = 16, справа 7 + 9 = 16. В обоих случаях каждую клетку посчитали один раз. Этот приём помогает восстановить число строк даже тогда, когда сами клетки скрыты.</p>'
      + '<section><h3>Что можно узнать по суммам столбцов?</h3>'
      + '<p>Суммы трёх столбцов равны 48, 60 и 67. В клетках стоят натуральные числа. Сумма каждой строки больше 13 и меньше 16. Сколько строк?</p>'
      + '<ol><li>Сложи суммы столбцов. Сумма всех записей равна <strong>175</strong>.</li>'
      + '<li>Сумма натуральных чисел целая. Строго между 13 и 16 лежат только 14 и 15.</li>'
      + '<li>Пусть строк <var>n</var>. По строкам получится от 14<var>n</var> до 15<var>n</var> включительно. Значит, 14<var>n</var> ≤ 175 ≤ 15<var>n</var>.</li>'
      + '<li>Раздели 175 на 15. Одиннадцати строк не хватит: 11 × 15 = 165. Теперь раздели 175 на 14. Тринадцати строк уже много: 13 × 14 = 182. Остаётся <strong>12 строк</strong>.</li></ol>'
      + '<p>Можно ли получить ровно 175? Если все 12 строк дадут по 14, получится 168. Добавь по единице в семь строк. Теперь семь строк дают по 15, ещё пять — по 14. На модели проверь и суммы столбцов.</p></section>'
      + '<section data-row-model><h3>Проверь своё число строк</h3><label>Условие <select data-model-case>'
      + '<option value="main">Столбцы 48, 60, 67</option><option value="small">Столбцы 8, 24, 34</option>'
      + '</select></label><p data-model-condition></p><label for="rs-row-count">Предполагаемое число строк</label><output for="rs-row-count" data-row-value></output>'
      + '<input id="rs-row-count" type="range" min="8" max="16" value="11" step="1" data-row-count>'
      + '<p data-model-feedback role="status" aria-live="polite"></p>'
      + '<button type="button" data-witness>Построить таблицу для этого числа строк</button><div data-model-table></div></section>'
      + '<section><h3>Если общий итог делится точно</h3>'
      + '<p>Суммы столбцов равны 27, 36 и 45. В каждой строке сумма строго больше 10 и строго меньше 13. Значит, одна строка даёт 11 или 12, а вся таблица — 108.</p>'
      + '<p>Делим 108 на 12 и получаем ровно 9. Девяти строк хватит, если каждая даст по 12. Десять строк дали бы хотя бы 110. Ответ <strong>9 строк</strong>. Построить таблицу легко: запиши в каждой строке 3, 4 и 5. За девять строк столбцы наберут ровно 27, 36 и 45.</p></section>'
      + '<section><h3>Когда общей суммы недостаточно</h3>'
      + '<p>У трёх столбцов суммы 8, 24 и 34. Каждая строка даёт строго больше 6 и строго меньше 10, то есть от 7 до 9. Итог 66 сам по себе допускает и 8, и 9 строк.</p>'
      + '<p>Но в первом столбце сумма равна 8. Для девяти строк понадобилось бы хотя бы девять единиц, ведь в каждой клетке натуральное число. Остаются 8 строк, и в первом столбце каждая запись равна 1. Выбери на модели это условие и сравни 9 строк с 8.</p></section>'
      + exerciseMarkup('practice')
      + '<section><h3>Повторить основу</h3><p>Ссылки на правила открываются в новой вкладке.</p><ul>'
      + '<li><a href="#sheet=rounding" target="_blank" rel="noopener">Как округлить до целого с учётом условия</a></li>'
      + '<li><a href="#sheet=inequality-line" target="_blank" rel="noopener">Строгие и нестрогие границы на оси</a></li></ul></section>'
      + exerciseMarkup('check')
      + '<footer><a href="../path/index.html#lesson=practice-whole-count">Вернуться к задачам №21 о целых числах</a>'
      + '<a href="#sheet=reasoning">К справочному листу о рассуждениях</a></footer></article>';
    mountModel(host.querySelector('[data-row-model]'), engine);
    mountExercise(host.querySelector('[data-row-practice]'), 'practice', engine);
    mountExercise(host.querySelector('[data-row-check]'), 'check', engine);
  }

  root.EgeRowSumsLesson = { mount };
})(window);
