(function (root, factory) {
  'use strict';
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LearningReferences = api;
})(typeof globalThis === 'undefined' ? this : globalThis, function (root) {
  'use strict';
  const assetBase = '/learning/reference-assets/';
  const pages = Object.freeze([
    Object.freeze({ file: 'fipi-2027-algebra.png', title: 'Алгебра', description: 'Таблица квадратов от 0 до 99, свойства квадратного корня, корни квадратного уравнения, формулы сокращённого умножения. Печатная страница 4.' }),
    Object.freeze({ file: 'fipi-2027-powers-geometry.png', title: 'Степени, логарифмы и геометрия', description: 'Свойства степени и логарифма с условиями применения, средние линии, теорема Пифагора, окружность, круг и правильный треугольник. Печатная страница 5.' }),
    Object.freeze({ file: 'fipi-2027-areas-solids.png', title: 'Площади, поверхности и объёмы', description: 'Параллелограмм, треугольник, трапеция, ромб; параллелепипед, прямая призма, пирамида, конус, цилиндр и шар. Печатная страница 6.' }),
    Object.freeze({ file: 'fipi-2027-trig-functions.png', title: 'Тригонометрия и функции', description: 'Прямоугольный треугольник, тригонометрическая окружность, основное тождество, таблица значений синуса, косинуса и тангенса; линейная функция и геометрический смысл производной. Печатная страница 7.' })
  ]);
  const F = value => typeof value === 'number' ? String(Number(value.toFixed(8))).replace('.', ',') : String(value);
  const pair = (letter, value, meaning) => letter + ' = ' + F(value) + (meaning ? ' — ' + meaning : '');
  function resolveTask(spec) {
    if (!spec || typeof spec !== 'object') return null;
    const id = spec.contentId || spec.lessonId || (spec.id && String(spec.id).replace(/^path:/, ''));
    if (!id) return null;
    if (spec.task && spec.task.id === id && typeof spec.task.q === 'string') return spec.task;
    // Learning attempts must use the server-pinned task, never regenerate it.
    return null;
  }
  function buildHelp(task, meta) {
    if (!task || !task.id || typeof task.q !== 'string') return null;
    const p = task.params || {}, m = task.model || {}, id = task.id;
    let formula = '', why = meta && meta.idea || '', bindings = [], substitution = '';
    const set = (f, reason, b, expression) => { formula = f; why = reason; bindings = b || []; substitution = expression || ''; };
    switch (id) {
      case 'grid':
        set('S = (a · hₐ) / 2', 'Два катета перпендикулярны: один можно принять за основание, второй — за соответствующую высоту.', [pair('a', m.a, 'один катет'), pair('hₐ', m.b, 'другой катет')], `S = (${F(m.a)} · ${F(m.b)}) / 2`); break;
      case 'triangle':
        set('hₐ² = b² − (a / 2)²; S = (a · hₐ) / 2', 'Высота к основанию равнобедренного треугольника делит основание пополам. Сначала найди высоту по теореме Пифагора.', [pair('a', 2 * m.a, 'всё основание'), pair('b', m.b, 'боковая сторона')], `hₐ² = ${F(m.b)}² − ${F(m.a)}²; S = (${F(2 * m.a)} · hₐ) / 2`); break;
      case 'quadrilateral':
        set('S = ((a + b) / 2) · h', 'Даны два параллельных основания трапеции и расстояние между ними.', [pair('a', m.a, 'первое основание'), pair('b', m.b, 'второе основание'), pair('h', m.h, 'высота')], `S = ((${F(m.a)} + ${F(m.b)}) / 2) · ${F(m.h)}`); break;
      case 'circle':
        set('(c / 2)² = r² − d²', 'Перпендикуляр из центра к хорде делит хорду пополам. Здесь c обозначает всю хорду, d — расстояние от центра до неё.', [pair('r', m.r, 'радиус'), pair('d', m.d, 'расстояние от центра до хорды')], `c / 2 = √(${F(m.r)}² − ${F(m.d)}²)`); break;
      case 'box': {
        const surface = task.q.includes('поверхности');
        set(surface ? 'S = 2(ab + ac + bc)' : 'V = abc', surface ? 'У закрытой коробки три пары равных прямоугольных граней.' : 'Умножаем площадь прямоугольного основания на высоту.', [pair('a', m.a), pair('b', m.b), pair('c', m.h)], surface ? `S = 2 · (${F(m.a)} · ${F(m.b)} + ${F(m.a)} · ${F(m.h)} + ${F(m.b)} · ${F(m.h)})` : `V = ${F(m.a)} · ${F(m.b)} · ${F(m.h)}`); break;
      }
      case 'roundbody': {
        const sphere = m.body === 'sphere', cone = m.body === 'cone';
        set(sphere ? 'V = (4/3)πr³' : cone ? 'V = (1/3)πr²h' : 'V = πr²h', 'Выбирай формулу именно данного тела. В вопросе требуется V/π, поэтому общий множитель π сократится.', [pair('r', m.a, 'радиус'), ...(sphere ? [] : [pair('h', m.h, 'высота')])], sphere ? `V/π = (4/3) · ${F(m.a)}³` : `V/π = ${cone ? '(1/3) · ' : ''}${F(m.a)}² · ${F(m.h)}`); break;
      }
      case 'pyramid':
        set('V = (1/3)Sоснh', 'Пирамида занимает треть объёма призмы с тем же основанием и высотой. Сначала найди площадь квадратного основания.', [pair('a', m.a, 'сторона основания'), pair('h', m.h, 'высота пирамиды')], `Sосн = ${F(m.a)}²; V = (1/3) · ${F(m.a)}² · ${F(m.h)}`); break;
      case 'formulas':
        set('s = at² / 2', 'Эта формула дана в условии. Квадрат относится ко времени t.', [pair('a', m.k, 'ускорение в м/с²'), pair('t', 3, 'время в секундах')], `s = ${F(m.k)} · 3² / 2`); break;
      case 'practice-electric':
        set('P = U² / R', 'Формула дана в условии. Сначала возведи напряжение в квадрат, потом раздели на сопротивление.', [pair('U', p.u, 'напряжение'), pair('R', p.r, 'сопротивление')], `P = ${F(p.u)}² / ${F(p.r)}`); break;
      case 'practice-inverse-formula':
        set('S = ((a + b) / 2) · h; h = 2S / (a + b)', 'Чтобы найти высоту из формулы площади трапеции, раздели площадь на полусумму оснований.', [pair('a', p.a), pair('b', p.b), pair('S', p.S, 'площадь')], `h = 2 · ${F(p.S)} / (${F(p.a)} + ${F(p.b)})`); break;
      case 'practice-probability-draw':
        set('P = m / n', 'Все отдельные исходы равновозможны. m — число подходящих, n — число всех исходов.', [pair('m', p.good, 'подходящие исходы'), pair('n', p.n, 'все исходы')], `P = ${F(p.good)} / ${F(p.n)}`); break;
      case 'practice-probability-opposite':
        set('P(противоположного события) = 1 − P(события)', 'Исправная и бракованная деталь — противоположные исходы выбора.', [pair('n', p.n, 'все детали'), pair('m', p.bad, 'бракованные детали')], `P(исправной) = 1 − ${F(p.bad)} / ${F(p.n)}`); break;
      case 'practice-grid-parallelogram': case 'practice-parallelogram':
        set('S = a · hₐ', 'Для площади параллелограмма нужна высота, перпендикулярная выбранному основанию. Наклонная боковая сторона её не заменяет.', [pair('a', p.a, 'основание'), pair('hₐ', p.h, 'высота к этому основанию')], `S = ${F(p.a)} · ${F(p.h)}`); break;
      case 'practice-grid-cut':
        set('Sфигуры = Sпрямоугольника − Sвыреза', 'Вычитаем площадь удалённой прямоугольной части.', [pair('ширина', p.w), pair('высота', p.h), pair('сторона выреза', p.a), pair('другая сторона выреза', p.b)], `S = ${F(p.w)} · ${F(p.h)} − ${F(p.a)} · ${F(p.b)}`); break;
      case 'practice-right-ratio':
        set(p.ask ? 'sin A = BC / AB' : 'cos A = AC / AB', p.ask ? 'Синус — противолежащий катет, делённый на гипотенузу.' : 'Косинус — прилежащий катет, делённый на гипотенузу.', [pair('AC', p.a, 'прилежащий катет'), pair('BC', p.b, 'противолежащий катет'), pair('AB', p.c, 'гипотенуза')], `${p.ask ? 'sin' : 'cos'} A = ${F(p.ask ? p.b : p.a)} / ${F(p.c)}`); break;
      case 'practice-triangle-angle':
        set('α + β + γ = 180°', 'Речь идёт о трёх внутренних углах треугольника.', [pair('α', p.a + '°'), pair('β', p.b + '°')], `γ = 180° − ${F(p.a)}° − ${F(p.b)}°`); break;
      case 'practice-cone-area':
        set('Sбок = πrl', 'Для боковой поверхности конуса нужна образующая l. Высота h — другая величина. При сравнении площадей общий множитель π сократится.', [pair('r₁', p.r, 'радиус первого конуса'), pair('l₁', p.l, 'образующая первого конуса'), pair('r₂', p.r * p.ratio, 'радиус второго конуса'), pair('l₂', p.l * 2, 'образующая второго конуса')], `S₂/S₁ = (${F(p.r * p.ratio)} · ${F(p.l * 2)}) / (${F(p.r)} · ${F(p.l)})`); break;
      case 'practice-box-diagonal':
        set('h² = d² − a²; V = abh', 'Диагональ прямоугольной грани — гипотенуза. Сначала найди неизвестное ребро, затем объём.', [pair('a', p.a), pair('b', p.b), pair('d', p.d, 'диагональ грани')], `h² = ${F(p.d)}² − ${F(p.a)}²; V = ${F(p.a)} · ${F(p.b)} · h`); break;
      case 'practice-percent-part':
        set('часть = целое · p / 100', 'За 100% принято данное целое.', [pair('целое', p.whole), pair('p', p.p, 'число процентов')], `часть = ${F(p.whole)} · ${F(p.p)} / 100`); break;
      case 'practice-percent-whole':
        set('целое = часть / (p / 100)', 'Известна часть, соответствующая p%. Делим на долю, чтобы восстановить 100%.', [pair('часть', p.part), pair('p', p.p, 'процент этой части')], `целое = ${F(p.part)} / (${F(p.p)} / 100)`); break;
      case 'practice-percent-rate':
        set('p = часть / целое · 100', 'Знаменатель — величина, с которой сравнивают, то есть 100%.', [pair('часть', p.part), pair('целое', p.whole)], `p = ${F(p.part)} / ${F(p.whole)} · 100`); break;
      case 'practice-percent-change':
        set(p.up ? 'новая цена = старая цена · (1 + p/100)' : 'новая цена = старая цена · (1 − p/100)', p.up ? 'После роста к исходным 100% прибавляется p%.' : 'После скидки от исходных 100% остаётся 100 − p процентов.', [pair('старая цена', p.price), pair('p', p.p)], `новая цена = ${F(p.price)} · (1 ${p.up ? '+' : '−'} ${F(p.p)}/100)`); break;
      case 'practice-quadratic':
        set('D = b² − 4ac; x₁,₂ = (−b ∓ √D) / (2a)', 'В стандартной записи ax² + bx + c = 0 коэффициент b включает свой знак. После решения выбери корень, который просит условие.', [pair('a', 1), pair('b', -p.sum), pair('c', p.prod)], `D = (${F(-p.sum)})² − 4 · 1 · ${F(p.prod)}`); break;
      case 'practice-meeting':
        set('t = s / (v₁ + v₂)', 'При движении навстречу расстояние сокращается со скоростью, равной сумме скоростей.', [pair('s', p.dist), pair('v₁', p.a), pair('v₂', p.b)], `t = ${F(p.dist)} / (${F(p.a)} + ${F(p.b)})`); break;
      case 'practice-work':
        set('1/T = 1/t₁ + 1/t₂', 'Вся работа принята за единицу. За час складываются выполненные доли, а не времена.', [pair('t₁', p.a), pair('t₂', p.b)], `1/T = 1/${F(p.a)} + 1/${F(p.b)}`); break;
      case 'motion': case 'practice-average-speed':
        set('vср = (s₁ + s₂ + …) / (t₁ + t₂ + …); tᵢ = sᵢ/vᵢ', 'Средняя скорость — весь путь, делённый на всё время. Каждому участку соответствует своё время.', m.dist.map((distance, i) => `Участок ${i + 1}: s = ${F(distance)}, v = ${F(m.speed[i])}`).filter((_, i) => m.dist[i] > 0)); break;
      default:
        if (id.startsWith('equations-') && task.params) {
          set('(a − c)x = d − b', 'Для записи ax + b = cx + d вычитаем cx и b из обеих частей. Если есть скобки, сначала раскрой их.', [pair('a', p.a), pair('b', p.b), pair('c', p.c), pair('d', p.d)], `(${F(p.a)} − (${F(p.c)}))x = ${F(p.d)} − (${F(p.b)})`);
        }
    }
    const firstStep = Array.isArray(task.steps) && task.steps[0];
    // Every fallback uses this exact pinned task's first step; it never borrows
    // a worked example or numbers from a different generated variant.
    if (!why && firstStep) why = firstStep.why;
    return Object.freeze({
      contentId: task.id, seed: task.seed, question: task.q,
      formula, why: why || 'Начни с того, что дано в условии и что требуется найти.',
      bindings: Object.freeze(bindings), substitution,
      firstStep: firstStep ? firstStep.q : '', firstStepWhy: firstStep ? firstStep.why : ''
    });
  }
  function mount(host, options) {
    if (!host || !host.ownerDocument) throw new TypeError('Reference host is required');
    const config = options || {}, doc = host.ownerDocument;
    const task = resolveTask(config.taskSpec);
    const meta = task && root.PathData && root.PathData.meta.find(item => item.id === task.id);
    const plan = task && buildHelp(task, meta);
    const exam = ['exam', 'diagnostic', 'checkpoint'].includes(config.mode || config.taskSpec && config.taskSpec.mode);
    let disposed = false, busy = false;
    const node = (tag, text, className) => { const el = doc.createElement(tag); if (text !== undefined) el.textContent = text; if (className) el.className = className; return el; };
    const section = node('section', undefined, 'learning-references');
    section.setAttribute('aria-label', 'Справочник и помощь');
    section.append(node('h3', 'Справочник рядом'));
    const fullButton = node('button', 'Справочный лист ФИПИ', 'reference-button'); fullButton.type = 'button';
    section.append(fullButton, node('p', 'Просмотр полного листа сохраняет самостоятельность решения.', 'reference-note'));
    const dialog = node('dialog', undefined, 'reference-dialog');
    const bar = node('div', undefined, 'reference-dialog-bar');
    const heading = node('h2', 'Справочные материалы');
    heading.id = 'reference-heading-' + Math.random().toString(36).slice(2);
    dialog.setAttribute('aria-labelledby', heading.id);
    const close = node('button', 'Закрыть', 'reference-button'); close.type = 'button';
    bar.append(heading, close); dialog.append(bar);
    dialog.append(node('p', 'ФИПИ · проект демоверсии базового ЕГЭ 2027. Печатные страницы 4–7. Формулы и обозначения сохранены из оригинала.', 'reference-note'));
    const sources = node('p', undefined, 'reference-note');
    for (const [label, href] of [['Исходный PDF', 'https://mathexam.space/ege-baza/sources/demo-2027.pdf#page=2'], ['Страница ФИПИ', 'https://fipi.ru/ege/demoversii-specifikacii-kodifikatory']]) {
      const link = node('a', label); link.href = href; link.target = '_blank'; link.rel = 'noopener'; sources.append(link, doc.createTextNode(' '));
    }
    dialog.append(sources);
    for (const page of pages) {
      const figure = node('figure');
      const image = node('img'); image.src = assetBase + page.file; image.alt = page.description; image.width = 842; image.height = 1191; image.loading = 'lazy';
      const open = node('a'); open.href = image.src; open.target = '_blank'; open.rel = 'noopener'; open.setAttribute('aria-label', 'Увеличить: ' + page.title); open.append(image);
      figure.append(node('figcaption', page.title), open); dialog.append(figure);
    }
    dialog.append(node('p', '© 2027 Федеральная служба по надзору в сфере образования и науки. Учебные подсказки ниже подготовлены MathExam и не являются частью справочного листа.', 'reference-note'));
    section.append(dialog);
    fullButton.addEventListener('click', () => { if (!disposed) {
      if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
      // A neutral reference event must never be converted to a hint. Reading
      // the permitted sheet remains available if this telemetry cannot save.
      if (typeof config.onReference === 'function') { try { Promise.resolve(config.onReference('fipi-2027')).catch(() => {}); } catch (_) {} }
    } });
    close.addEventListener('click', () => { if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open'); fullButton.focus(); });
    const output = node('div', undefined, 'reference-help-output'); output.setAttribute('aria-live', 'polite');
    const buttons = [];
    if (exam) section.append(node('p', 'В проверочной работе доступен только полный справочный лист.', 'reference-note'));
    else if (plan && typeof config.onHelp === 'function') {
      const choice = node('button', plan.formula ? 'Помоги выбрать формулу' : 'Помоги выбрать способ', 'reference-button');
      const substitute = node('button', plan.formula ? 'Помоги подставить данные' : 'Помоги начать решение', 'reference-button');
      buttons.push(choice, substitute);
      buttons.forEach((button, i) => { button.type = 'button'; button.dataset.referenceLevel = String(i + 2); });
      section.append(...buttons, node('p', 'Эти две подсказки отмечаются в истории решения.', 'reference-note'), output);
      async function reveal(level) {
        if (busy || disposed) return;
        busy = true; buttons.forEach(button => { button.disabled = true; });
        try {
          const accepted = await config.onHelp(level, { kind: level === 2 ? 'formula-choice' : 'substitution', contentId: plan.contentId, seed: plan.seed });
          if (accepted === false) throw new Error('help_not_recorded');
          if (disposed) return;
          output.replaceChildren(node('h4', level === 2 ? 'Выбираем способ' : 'Связываем данные с решением'));
          if (plan.formula) output.append(node('p', plan.formula, 'reference-formula'));
          output.append(node('p', plan.why));
          if (level === 3) {
            output.append(node('p', plan.question, 'reference-task'));
            if (plan.bindings.length) { const list = node('ul'); plan.bindings.forEach(binding => list.append(node('li', binding))); output.append(list); }
            if (plan.substitution) output.append(node('p', plan.substitution, 'reference-formula'));
            else if (plan.firstStep) output.append(node('p', plan.firstStep), node('p', plan.firstStepWhy));
          }
        } catch (_) {
          if (!disposed) output.replaceChildren(node('p', 'Подсказка пока не сохранена. Проверь подключение и попробуй ещё раз.', 'reference-error'));
        } finally { busy = false; if (!disposed) buttons.forEach(button => { button.disabled = false; }); }
      }
      choice.addEventListener('click', () => reveal(2)); substitute.addEventListener('click', () => reveal(3));
    }
    host.append(section);
    return Object.freeze({ destroy() { disposed = true; if (dialog.open && typeof dialog.close === 'function') dialog.close(); section.remove(); }, task, plan });
  }
  return Object.freeze({ mount, buildHelp, resolveTask, pages });
});
