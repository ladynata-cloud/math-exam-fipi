(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.VilenkinStudySupport = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const MAX_PRIME = 1000;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const resources = Object.freeze([
    {id:'add-subtract', title:'Сложение и вычитание по шагам', path:'/trainers/oge-basics/multiplication-division/arithmetic-foundations.html'},
    {id:'times-table', title:'Таблица умножения: строка и столбец', path:'/trainers/oge-basics/multiplication-division/multiplication-pythagoras-table.html'},
    {id:'multiply', title:'Умножение столбиком на одну цифру', path:'/trainers/oge-basics/multiplication-division/column-multiplication-one-digit.html'},
    {id:'divide', title:'Деление уголком по шагам', path:'/trainers/long-division-stepwise.html'},
    {id:'order', title:'Порядок действий', path:'/trainers/oge-basics/order-of-operations.html'},
    {id:'fractions', title:'Что означает дробь', path:'/trainers/oge-basics/fraction-meaning.html'}
  ].map(Object.freeze));
  function isPrime(n) {
    if (!Number.isSafeInteger(n) || n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    for (let factor = 3; factor <= Math.sqrt(n); factor += 2) if (n % factor === 0) return false;
    return true;
  }
  function primesUpTo(limit) {
    if (!Number.isSafeInteger(limit) || limit < 0 || limit > MAX_PRIME) throw new RangeError('Prime table limit must be an integer from 0 to 1000');
    const list = [];
    for (let n = 2; n <= limit; n++) if (isPrime(n)) list.push(n);
    return list;
  }
  function recommendation(unitId) {
    const id = Number(unitId);
    if (id === 6) return 'Для разложения числа выбирай простые числа из таблицы. Каждый раз проверяй, делится ли на них текущее число без остатка.';
    if (id === 7) return 'Перед НОД полезно вспомнить разложение на простые множители. Сопоставляй одинаковые множители двух чисел попарно.';
    if (id === 8) return 'Для НОК сначала разложи числа на простые множители. Затем проверь, что полученное число делится на каждое из данных чисел.';
    if (id === 9) return 'Чтобы найти общий знаменатель, пригодятся разложение на простые множители и НОК. Умножай числитель и знаменатель дроби на одно и то же число.';
    if (id >= 10 && id <= 17) return 'Если трудно начать действия с дробями, сначала вспомни, что показывают числитель и знаменатель, и порядок действий.';
    if (id === 1 || id === 2 || (id >= 18 && id <= 23)) return 'Если вычисление мешает разобраться в задаче, можно ненадолго повторить нужное действие и вернуться к этому условию.';
    return 'Выбери только то действие, которое сейчас мешает решить задачу. Повторять всё подряд не нужно.';
  }
  function primeCells(limit) {
    return primesUpTo(limit).map(n => `<li>${n}</li>`).join('');
  }
  function mount(host, options = {}) {
    if (!host || !host.ownerDocument) throw new TypeError('Support host must be a DOM element');
    let alive = true;
    const current = () => alive && host.isConnected && (typeof options.isCurrent !== 'function' || options.isCurrent());
    const report = reason => { if (current() && typeof options.onUse === 'function') options.onUse(reason); };
    const primeContext = Number(options.unitId) >= 6 && Number(options.unitId) <= 9;
    host.classList.add('v6-study-support');
    host.innerHTML = `<p class="v6-support-intro">${esc(recommendation(options.unitId))}</p>
      <details data-v6-support="prime-table"${primeContext?' class="v6-support-recommended"':''}>
        <summary>${primeContext?'Таблица простых чисел и признаки делимости':'Открыть таблицу простых чисел'}</summary>
        <div class="v6-support-body">
          <p><strong>Простое число</strong> — натуральное число, которое делится без остатка ровно на два натуральных числа: на 1 и на себя. <strong>Число 1 не простое:</strong> у него только один такой делитель.</p>
          <p>Например, 7 делится без остатка на 1 и 7. А 9 ещё делится на 3, поэтому 9 — составное число.</p>
          <label class="v6-prime-range">Показать простые числа
            <select data-v6-prime-limit aria-label="Граница таблицы простых чисел"><option value="100">до 100</option><option value="1000">до 1000</option></select>
          </label>
          <p class="v6-support-note" data-v6-prime-count aria-live="polite">До 100 включительно — 25 простых чисел.</p>
          <ol class="v6-prime-grid" data-v6-primes aria-label="Простые числа до 100">${primeCells(100)}</ol>
          <p class="v6-support-note">Таблица помогает выбрать число для пробного деления. Она не подбирает множители за тебя. Если числа нет среди простых, но оно больше выбранной границы, по этой таблице нельзя сделать вывод о нём.</p>
          <details data-v6-support="divisibility">
            <summary>Как проверить, делится ли число без остатка?</summary>
            <ul class="v6-divisibility">
              <li><strong>На 2:</strong> последняя цифра — 0, 2, 4, 6 или 8.</li>
              <li><strong>На 3:</strong> сумма всех цифр делится на 3.</li>
              <li><strong>На 5:</strong> последняя цифра — 0 или 5.</li>
              <li><strong>На 9:</strong> сумма всех цифр делится на 9.</li>
              <li><strong>На 10:</strong> последняя цифра — 0.</li>
            </ul>
            <p>Эти признаки ускоряют проверку, но не заменяют все случаи. Для простых чисел 7, 11 и других можно выполнить деление и проверить умножением: делитель × частное должно дать исходное число без остатка.</p>
            <p>При разложении на простые множители начинай с 2, затем пробуй 3, 5, 7, 11 и дальше по таблице. После удачного деления снова проверь тот же простой делитель. Число 10 не подходит в качестве <em>простого</em> множителя: 10 = 2 × 5.</p>
          </details>
        </div>
      </details>
      <details data-v6-support="prerequisites">
        <summary>Вспомнить действия из 1–5 класса</summary>
        <div class="v6-support-body">
          <p>Это короткая памятка для повторения. Она не является отдельным заданием учебника и не меняет текущую задачу.</p>
          <dl class="v6-operation-reminders">
            <dt>Сложение и вычитание</dt><dd>Складывай и вычитай одинаковые разряды: единицы с единицами, десятки с десятками. В записи столбиком начинай справа. Например, 27 + 15: 7 + 5 = 12, пишем 2, один десяток держим в уме; 2 + 1 + 1 = 4 десятка. Получается 42.</dd>
            <dt>Умножение</dt><dd>3 × 4 можно проверить сложением четырёх одинаковых слагаемых: 3 + 3 + 3 + 3 = 12. Если табличный случай забылся, найди строку и столбец в таблице умножения.</dd>
            <dt>Деление</dt><dd>12 : 3 = 4, потому что 3 × 4 = 12. Деление без остатка проверяй умножением. При остатке проверка другая: делитель × частное + остаток = делимое; остаток меньше делителя.</dd>
            <dt>Порядок действий</dt><dd>Сначала вычисли в скобках. Затем — умножение и деление слева направо. После них — сложение и вычитание слева направо. Например, 18 − 6 : 3 = 18 − 2 = 16.</dd>
            <dt>Десятичная запись</dt><dd>В числе 2,35 — 2 целых, 3 десятых и 5 сотых. При сложении и вычитании десятичных дробей пиши запятую под запятой. Например, 2,35 + 0,4 = 2,35 + 0,40 = 2,75.</dd>
            <dt>Обыкновенная дробь</dt><dd><span class="v6-support-fraction" aria-label="три четверти"><span aria-hidden="true">3</span><span aria-hidden="true">4</span></span> означает: целое разделили на 4 равные части и взяли 3 такие части. Знаменатель показывает, на сколько равных частей разделили целое; числитель — сколько взяли.</dd>
          </dl>
          <h3>Потренировать нужное действие</h3>
          <ul class="v6-support-links">${resources.map(r=>`<li><a href="https://mathexam.space${r.path}" target="_blank" rel="noopener noreferrer" data-v6-practice="${r.id}">${esc(r.title)} <span class="v6-support-note">(в новой вкладке)</span></a></li>`).join('')}</ul>
          <p class="v6-support-note">Тренажёр откроется отдельно. Вернись в эту вкладку, чтобы продолжить прежнюю задачу; её условие и уже выполненные шаги останутся на месте.</p>
        </div>
      </details>`;
    const listeners = [];
    function on(element, event, callback) {
      element.addEventListener(event, callback);
      listeners.push(() => element.removeEventListener(event, callback));
    }
    // A prerequisite practice entry beside the current answer controls. The
    // separate, existing trainer keeps its own example; this never changes the
    // fractions, fills an answer, or claims completion of the current task.
    let contextualPractice = null;
    const actionsHost = options.actionsHost;
    if (options.answerType === 'fixed-denominator-pair' &&
        actionsHost?.ownerDocument === host.ownerDocument && actionsHost.isConnected) {
      contextualPractice = host.ownerDocument.createElement('aside');
      contextualPractice.className = 'v6-context-practice';
      contextualPractice.setAttribute('aria-label', 'Повторить поиск НОК');
      contextualPractice.innerHTML = '<a class="button-link secondary" data-v6-practice="lcm" href="https://mathexam.space/trainers/grade6-nok.html?task=nt-1-5" target="_blank" rel="noopener noreferrer">Потренировать поиск НОК по шагам ↗</a><p>На отдельном примере. Затем вернись к этим дробям.</p>';
      actionsHost.append(contextualPractice);
      on(contextualPractice.querySelector('a'), 'click', event => {
        if (!current()) { event.preventDefault(); return; }
        report('practice-link');
      });
    }
    host.querySelectorAll('[data-v6-support]').forEach(details => {
      on(details, 'toggle', () => { if (details.open) report(details.dataset.v6Support); });
    });
    on(host.querySelector('[data-v6-prime-limit]'), 'change', event => {
      if (!current()) return;
      const limit = Number(event.target.value);
      if (![100, 1000].includes(limit)) return;
      const list = host.querySelector('[data-v6-primes]');
      list.innerHTML = primeCells(limit);
      list.setAttribute('aria-label', `Простые числа до ${limit}`);
      host.querySelector('[data-v6-prime-count]').textContent = `До ${limit} включительно — ${primesUpTo(limit).length} простых чисел.`;
      report('prime-table');
    });
    host.querySelectorAll('[data-v6-practice]').forEach(link => {
      on(link, 'click', event => {
        if (!current()) { event.preventDefault(); return; }
        report('practice-link');
      });
    });
    return () => { alive = false; listeners.forEach(remove => remove()); contextualPractice?.remove(); };
  }
  return Object.freeze({mount, primesUpTo, isPrime, recommendation, resources});
});
