/* Original small-number investigations. Quantities are represented by DOM objects. */
(function (root) {
  'use strict';
  const lines = [
    ['meanings', 'Один пример — два смысла', 'Различаю долю и число групп', '🧩'],
    ['change', 'Что изменилось?', 'Слежу за запасом и размером доли', '🔄'],
    ['adjust', 'Хватит на новый набор?', 'Различаю остаток и нехватку', '🧵'],
    ['boundary', 'На границе набора', 'Объясняю ноль и лишнюю ёмкость', '📦'],
    ['reverse', 'Восстанови историю', 'Нахожу целое и недостающие данные', '🔎'],
    ['sequence', 'Два небольших дела', 'Выбираю порядок действий', '🛠️']
  ].map(([id, name, skill, icon]) => ({id, name, skill, icon}));
  const option = (value, label) => ({value, label});
  const question = (text, answer, options, clue) => ({text, answer, options, clue});
  const field = (id, label, answer, clue) => ({id, label, answer, clue});
  const labels = (name, count) => Array.from({length: count}, (_, i) => name + ' ' + (i + 1));
  const choices = (...pairs) => pairs.map(([value, label]) => option(value, label));
  const missions = [];
  function add(line, number, data) {
    missions.push({id: line + '-' + number, line, mode: number < 3 ? 'practice' : 'check', ...data});
  }
  function finite(goal, total, groupLabels, extra = {}) {
    return {goal, total, source: 'stock', labels: groupLabels, initialPiles: groupLabels.map(() => 0),
      capacities: groupLabels.map(() => total), targetTotal: total, adjust: null, ...extra};
  }
  function packs(total, size, goal = 'full', extra = {}) {
    const count = Math.ceil((extra.maxTotal || total) / size) + 1;
    return finite(goal, total, labels('Место', count), {size, capacities: Array(count).fill(size), ...extra});
  }
  const meaningOptions = choices(['groups', 'Сколько получится групп'], ['each', 'Сколько предметов получит каждый'], ['total', 'Сколько предметов было всего']);
  [
    {n: 1, title: 'Карандаши для друзей', item: '✏️', noun: 'карандашей', total: 12, d: 3, kind: 'share',
      story: 'У Веры 12 карандашей. Она и двое друзей хотят получить поровну. Сколько карандашей достанется каждому?', group: 'Друг'},
    {n: 2, title: 'Карандаши для ярмарки', item: '✏️', noun: 'карандашей', total: 12, d: 3, kind: 'pack',
      story: 'Для школьной ярмарки приготовили 12 карандашей. В подарочный набор кладут по 3. Сколько наборов получится?', group: 'Набор'},
    {n: 3, title: 'Мелки двум командам', item: '🖍️', noun: 'мелков', total: 10, d: 2, kind: 'share',
      story: 'Две команды рисуют город на асфальте. У них 10 мелков. Команды должны получить поровну. Что достанется одной команде?', group: 'Команда'},
    {n: 4, title: 'Баночки с ягодами', item: '🍓', noun: 'ягод', total: 15, d: 5, kind: 'pack',
      story: 'В корзинке 15 ягод. Для гостинцев наполняют баночки: в каждую кладут по 5 ягод. Сколько баночек можно подарить?', group: 'Баночка'}
  ].forEach(s => {
    const share = s.kind === 'share', q = s.total / s.d;
    add('meanings', s.n, {title: s.title, item: s.item, noun: s.noun, story: s.story,
      prediction: question('Что сейчас неизвестно?', share ? 'each' : 'groups', meaningOptions,
        share ? 'Число получателей уже дано. Посмотри, какое количество должно быть одинаковым у каждого.' : 'Размер одного набора уже дан. Что получится считать после упаковки?'),
      activity: share ? finite('equal', s.total, labels(s.group, s.d)) : packs(s.total, s.d, 'full', {labels: labels(s.group, Math.ceil(s.total / s.d) + 1)}),
      actionText: share ? 'Раздай весь запас поровну. Предметы можно забирать и перекладывать.' : 'Собери полные наборы. Лишнее место можно оставить пустым.',
      actionHint: share ? 'Раздавай по одному каждому, затем начинай новый круг.' : 'Сначала наполни одно место до указанного размера. Потом переходи к следующему.',
      fields: [field('answer', share ? s.noun + ' у одного получателя' : 'Полных ' + (s.group === 'Баночка' ? 'баночек' : 'наборов'), q,
        share ? 'Посчитай предметы у одного получателя, а не число получателей.' : 'Посчитай заполненные группы, а не предметы в одной группе.')],
      reason: question('Что означает число ' + s.d + ' в условии?', share ? 'receivers' : 'size',
        choices(['size', 'Предметы в одной группе'], ['all', 'Весь запас'], ['receivers', 'Число получателей']),
        'Вернись к словам рядом с этим числом: кому раздают или по сколько кладут?'),
      equations: [s.total + ' : ' + s.d + ' = ' + q],
      conclusion: share ? 'Ответ называет размер доли. Получателей мы знали заранее.' : 'Ответ называет число полных групп. Размер каждой группы мы знали заранее.'});
  });
  [
    {n: 1, title: 'Пришла четвёртая команда', item: '🖍️', noun: 'мелков', old: 3, each: 4, next: 4, fixed: 'total',
      story: '12 мелков уже раздали трём командам: каждой по 4. Пришла четвёртая команда. Новых мелков нет. Теперь всем четырём командам нужно поровну.'},
    {n: 2, title: 'Набор для новых художников', item: '🖍️', noun: 'мелков', old: 3, each: 4, next: 4, fixed: 'each',
      story: 'Три команды получили по 4 мелка — всего 12. Пришла четвёртая команда. Ей тоже нужны 4 мелка. Старые команды сохраняют свои наборы. Можно принести мелки из шкафа.'},
    {n: 3, title: 'Ещё одна семья на пикнике', item: '🍎', noun: 'яблок', old: 2, each: 6, next: 3, fixed: 'total',
      story: 'Две семьи приготовили по 6 яблок. К ним присоединилась ещё одна семья. Других яблок нет. Разделите все 12 яблок между тремя семьями поровну.'},
    {n: 4, title: 'Четвёртый стол для игры', item: '🎲', noun: 'кубиков', old: 3, each: 3, next: 4, fixed: 'each',
      story: 'На трёх столах лежат по 3 игральных кубика — всего 9. Открыли четвёртый стол. На каждом столе нужны 3 кубика. С прежних столов убирать нельзя. Можно взять кубики из шкафа.'}
  ].forEach(s => {
    const total = s.old * s.each, target = s.fixed === 'total' ? total : s.next * s.each;
    const activity = finite('equal', total, labels(s.noun === 'яблок' ? 'Семья' : 'Место', s.next), {
      initialPiles: Array.from({length: s.next}, (_, i) => i < s.old ? s.each : 0),
      targetTotal: target, adjust: s.fixed === 'each' ? 'add' : null, maxTotal: target + s.each,
      requiredSize: s.fixed === 'each' ? s.each : null, lockedGroups: s.fixed === 'each' ? s.old : 0
    });
    add('change', s.n, {title: s.title, item: s.item, noun: s.noun, story: s.story,
      prediction: s.fixed === 'total'
        ? question('Как изменится доля одного получателя?', 'less', choices(['same', 'Останется прежней'], ['less', 'Станет меньше'], ['more', 'Станет больше']), 'Запас не вырос, а получателей стало больше. Попробуй представить ещё одну долю.')
        : question('Что придётся изменить?', 'stock', choices(['stock', 'Увеличить общий запас'], ['each', 'Уменьшить каждый набор'], ['nothing', 'Ничего: уже всем хватает']), 'Размер старых наборов сохраняется. Откуда появится набор для нового места?'),
      activity,
      actionText: s.fixed === 'total' ? 'Переложи предметы так, чтобы новый получатель тоже получил равную долю.' : 'Возьми недостающие предметы из шкафа и приготовь такой же набор для нового места.',
      actionHint: s.fixed === 'total' ? 'Забирай по предмету из прежних групп и передавай новому получателю. Проверь все доли.' : 'Кнопка «Взять ещё один» добавляет предмет в запас. Потом его можно положить в нужное место.',
      fields: s.fixed === 'total'
        ? [field('each', s.noun + ' у одного получателя теперь', target / s.next, 'Проверь одну новую долю.'), field('total', s.noun + ' всего', total, 'Ни один предмет не появился и не исчез.')]
        : [field('added', 'Сколько предметов принесли из шкафа', target - total, 'Сравни прежний запас с новым.'), field('total', s.noun + ' теперь всего', target, 'Сосчитай предметы во всех одинаковых наборах.')],
      reason: question('Что в этой истории осталось прежним?', s.fixed === 'total' ? 'stock' : 'each',
        choices(['receivers', 'Количество получателей'], ['each', 'Размер одного набора'], ['stock', 'Общий запас']), 'Проверь, что по условию запрещено менять.'),
      equations: s.fixed === 'total' ? [total + ' : ' + s.next + ' = ' + (target / s.next)] : [s.next + ' × ' + s.each + ' = ' + target, target + ' − ' + total + ' = ' + (target - total)],
      conclusion: s.fixed === 'total' ? 'Когда запас прежний, дополнительный получатель меняет размер каждой доли.' : 'Когда размер набора прежний, для нового получателя нужен дополнительный запас.'});
  });
  [
    {n: 1, title: 'Пуговицы для мастерской', item: '🔵', noun: 'пуговиц', total: 17, size: 5, adjust: 'add', story: 'В мастерской 17 пуговиц. В набор кладут по 5. Добавь как можно меньше пуговиц, чтобы весь запас разложился по полным наборам.'},
    {n: 2, title: 'Убрать лишние пуговицы', item: '🔵', noun: 'пуговиц', total: 17, size: 5, adjust: 'remove', story: 'Снова есть 17 пуговиц, в наборе по 5. Теперь добавлять нельзя. Убери как можно меньше пуговиц в ящик, чтобы остальные разложились по полным наборам.'},
    {n: 3, title: 'Ленты для закладок', item: '🎀', noun: 'лент', total: 13, size: 4, adjust: 'add', story: 'У ребят 13 лент. Для одного подарочного набора нужны 4. Добавь как можно меньше лент, чтобы все наборы стали полными.'},
    {n: 4, title: 'Ничего лишнего', item: '⭐', noun: 'наклеек', total: 12, size: 3, adjust: 'remove', story: 'Приготовили 12 наклеек. В призовой конверт кладут по 3. Лишние наклейки можно убрать, но только если без этого останется неполный набор. Нужно ли что-то убирать?'}
  ].forEach(s => {
    const r = s.total % s.size, delta = s.adjust === 'add' ? (s.size - r) % s.size : r;
    const target = s.total + (s.adjust === 'add' ? delta : -delta);
    add('adjust', s.n, {title: s.title, item: s.item, noun: s.noun, story: s.story,
      prediction: question(s.adjust === 'add' ? 'Что нужно узнать перед добавлением?' : 'Что нужно проверить перед уборкой?', 'rest',
        choices(['stock', 'Достаточно знать только весь запас'], ['rest', 'Что останется после полных наборов'], ['groups', 'Достаточно сосчитать пустые места']),
        'Сначала отдели полные наборы. Что можно сказать об оставшейся горстке?'),
      activity: packs(s.total, s.size, 'full', {adjust: s.adjust, maxTotal: s.total + (s.adjust === 'add' ? s.size : 0), targetTotal: target}),
      actionText: s.adjust === 'add' ? 'Собери наборы. Бери по одному недостающему предмету и заполняй неполную группу.' : 'Собери наборы. Если что-то осталось, убери только лишние предметы в ящик.',
      actionHint: s.adjust === 'add' ? 'Посмотри на пустые места в неполном наборе. Добавляй только то, чего ему не хватает.' : 'Убирать можно предметы из запаса. Если предмет уже лежит в группе, сначала забери его обратно.',
      fields: [field('changed', s.adjust === 'add' ? 'Сколько предметов добавили' : 'Сколько предметов убрали', delta,
        s.adjust === 'add' ? 'Не путай оставшиеся предметы с пустыми местами до полной группы.' : 'Сравни исходный запас с тем, что осталось в наборах.'),
        field('groups', 'Сколько полных наборов получилось', target / s.size, 'Учитывай только полностью заполненные группы.')],
      reason: r === 0 ? question('Почему не пришлось убирать предметы?', 'none',
        choices(['one', 'Одну наклейку всё равно нужно убрать'], ['none', 'Все группы уже были полными'], ['all', 'Нужно убрать целую группу']),
        'Проверь, оставались ли предметы за пределами полных групп.') : question('Почему этого изменения достаточно?', s.adjust === 'add' ? 'filled' : 'removed',
        choices(['removed', 'Убрали только остаток; все остальные группы полные'], ['filled', 'Заполнили пустые места последней группы'], ['same', 'Размер группы равен числу групп']),
        'Сопоставь свой последний ход с неполной группой или остатком.'),
      equations: [s.total + (s.adjust === 'add' ? ' + ' : ' − ') + delta + ' = ' + target, target + ' : ' + s.size + ' = ' + target / s.size],
      conclusion: s.adjust === 'add' ? 'Остаток — уже имеющиеся предметы. Нехватка — пустые места до полного набора.' : r ? 'Убрали остаток и сохранили все полные наборы.' : 'Запас уже делился нацело. Чтобы сохранить все полные наборы, не пришлось ничего убирать.'});
  });
  [
    {n: 1, title: 'Ещё одна игрушка', item: '🧸', noun: 'игрушек', before: 11, after: 12, size: 4,
      story: 'В коробку помещаются 4 игрушки. Уже упакованы 11 игрушек, и принесли ещё одну. Все игрушки нужно отправить. Изменится ли число полных коробок?', prediction: 'more-full'},
    {n: 2, title: 'Подарок для нового гостя', item: '💌', noun: 'открыток', before: 12, after: 13, size: 4,
      story: 'В конверт помещаются 4 открытки. Уже разложили 12 открыток, и добавили ещё одну. Отправить нужно все. Понадобится ли ещё один конверт?', prediction: 'more-boxes'},
    {n: 3, title: 'Маленькая посылка', item: '🧸', noun: 'игрушек', before: 2, after: 2, size: 6,
      story: 'Нужно отправить 2 игрушки. Коробка вмещает 6. Полную коробку собрать нельзя. Можно ли всё равно отправить игрушки?', prediction: 'partial'},
    {n: 4, title: 'Один фонарик остался дома', item: '🔦', noun: 'фонариков', before: 8, after: 7, size: 4,
      story: 'В ящик помещаются 4 фонарика. Упаковали 8 фонариков, но один нужно забрать домой. Остальные отправляются в поход. Уменьшится ли число нужных ящиков?', prediction: 'same-boxes'}
  ].forEach(s => {
    const q = Math.floor(s.after / s.size), r = s.after % s.size;
    const activity = packs(s.before, s.size, 'all', {maxTotal: Math.max(s.before, s.after) + s.size, targetTotal: s.after,
      adjust: s.after > s.before ? 'add' : s.after < s.before ? 'remove' : null});
    if (s.n !== 3) activity.initialPiles = activity.labels.map((_, i) => Math.max(0, Math.min(s.size, s.before - i * s.size)));
    const predictionOptions = s.n === 1
      ? choices(['more-boxes', 'Нужна дополнительная коробка, полных столько же'], ['more-full', 'Полных станет больше; коробок всего столько же'], ['same-full', 'Ничего не изменится'])
      : s.n === 2
        ? choices(['same-boxes', 'Хватит прежних конвертов'], ['more-boxes', 'Нужен ещё один конверт'], ['less-boxes', 'Конвертов понадобится меньше'])
        : s.n === 3
          ? choices(['zero', 'Нужны ноль коробок'], ['partial', 'Можно взять одну неполную коробку'], ['six', 'Понадобятся шесть коробок'])
          : choices(['fewer-boxes', 'Теперь хватит одного ящика'], ['same-boxes', 'Ящиков нужно столько же'], ['more-boxes', 'Ящиков понадобится больше']);
    add('boundary', s.n, {title: s.title, item: s.item, noun: s.noun, story: s.story,
      prediction: question('Предположи, что получится.', s.prediction, predictionOptions, 'Различай полностью заполненные ёмкости и все ёмкости с грузом.'),
      activity, actionText: s.after > s.before ? 'Добавь один предмет, найди ему место и отправь весь запас.' : s.after < s.before ? 'Забери один предмет в запас, убери его домой и проверь оставшийся груз.' : 'Найди место для всего груза. Пустые коробки брать не нужно.',
      actionHint: 'Заполняй группы целиком. Для последних предметов можно оставить одну неполную группу.',
      fields: [field('full', 'Полностью заполненных ёмкостей', q, 'Считай только те, где заняты все места.'), field('boxes', 'Ёмкостей для всего груза', Math.ceil(s.after / s.size), 'Неполная ёмкость с грузом тоже нужна.'), field('rest', 'Предметов в неполной ёмкости', r, 'Если все занятые ёмкости полные, здесь ноль.')],
      reason: question('Когда нужна дополнительная ёмкость?', 'left', choices(['always', 'После деления всегда прибавляем одну'], ['left', 'Когда после полных ёмкостей остаётся груз'], ['never', 'Если не хватает на полную, груз не отправляем']), 'Проверь, остался ли хотя бы один предмет без места.'),
      equations: [s.after + ' = ' + q + ' × ' + s.size + ' + ' + r],
      conclusion: r ? 'Полных ёмкостей ' + q + ', а для всего груза нужны ' + Math.ceil(s.after / s.size) + ': неполная ёмкость тоже отправляется.' : 'Остатка нет. Дополнительная пустая ёмкость не нужна.'});
  });
  [
    {n: 1, title: 'Следы упаковщика', item: '⭐', noun: 'наклеек', groups: 4, size: 3, rest: 2, missing: null,
      story: 'На столе приготовили 4 полных пакета по 3 наклейки, ещё 2 наклейки остались отдельно. Сколько наклеек было сначала?'},
    {n: 2, title: 'Промокшая записка', item: '🔵', noun: 'бусин', groups: 3, size: 4, rest: 1, missing: 'size',
      story: 'В записке написано: «Собраны 3 одинаковых полных мешочка, ещё 1 бусина осталась». Строчка о вместимости промокла. Какого сведения не хватает, чтобы узнать весь запас?'},
    {n: 3, title: 'Пакетики для праздника', item: '🎀', noun: 'лент', groups: 3, size: 5, rest: 2, missing: null,
      story: 'После подготовки праздника на столе 3 набора по 5 лент и ещё 2 отдельные ленты. Все ленты взяли из одной коробки. Сколько их было в коробке?'},
    {n: 4, title: 'Забытый остаток', item: '🍎', noun: 'яблок', groups: 4, size: 3, rest: 1, missing: 'rest',
      story: 'Для похода наполнили 4 пакета по 3 яблока. Несколько яблок оставили дома. Что ещё нужно узнать, чтобы восстановить первоначальный запас?'}
  ].forEach(s => {
    const target = s.groups * s.size + s.rest;
    const groupLabels = labels('Группа', s.groups).concat('Отдельно');
    const prediction = s.missing
      ? question('Какое сведение нужно восстановить?', s.missing, choices(['size', 'Сколько предметов входит в одну полную группу'], ['color', 'Какого цвета упаковка'], ['rest', 'Сколько предметов осталось отдельно']), 'Отметь в истории известные группы, их размер и остаток. Что из этого неизвестно?')
      : question('Как восстановить целое?', 'groups-rest', choices(['groups-rest', 'Собрать содержимое всех групп и остаток'], ['only-groups', 'Сосчитать только упаковки'], ['only-rest', 'Взять только отдельные предметы']), 'Весь запас включает и упакованные, и отдельные предметы.');
    add('reverse', s.n, {title: s.title, item: s.item, noun: s.noun, story: s.story, prediction,
      activity: {goal: 'build', source: 'unlimited', total: 0, labels: groupLabels, initialPiles: groupLabels.map(() => 0), capacities: groupLabels.map((_, i) => i < s.groups ? s.size : s.size), groups: s.groups, size: s.size, rest: s.rest, targetTotal: target, adjust: null},
      actionText: (s.missing === 'size' ? 'Нашлась сухая копия: в каждом мешочке по ' + s.size + ' бусины. ' : s.missing === 'rest' ? 'Узнали: дома осталось ' + s.rest + ' яблоко. ' : '') + 'Восстанови полные группы и отдельный остаток. Бери предметы из большого запаса.',
      actionHint: 'Каждая полная группа должна совпасть с описанием. Отдельные предметы положи в последнее место.',
      fields: [field('packed', 'Предметов во всех полных группах', s.groups * s.size, 'Не складывай число упаковок и размер группы: в каждой упаковке есть предметы.'), field('total', s.noun + ' было всего', target, 'К содержимому всех полных групп добавь отдельные предметы.')],
      reason: question('Что прибавляется к содержимому полных групп?', 'rest', choices(['size', 'Размер ещё одной полной группы'], ['rest', 'Только отдельный остаток'], ['groups', 'Количество упаковок']), 'Посмотри, какие предметы находятся за пределами полных групп.'),
      equations: [s.groups + ' × ' + s.size + ' = ' + s.groups * s.size, s.groups * s.size + ' + ' + s.rest + ' = ' + target],
      conclusion: 'Целое восстановили из содержимого полных групп и отдельного остатка. Для этого нужны все три сведения: число групп, их размер и остаток.'});
  });
  [
    {n: 1, kind: 'reserve', title: 'Карандаши для эстафеты', item: '✏️', noun: 'карандашей', total: 18, reserve: 6, groups: 3,
      story: 'Есть 18 карандашей. Сначала 6 оставляют для рисунка общей афиши. Остальные нужно разделить поровну между тремя командами.'},
    {n: 2, kind: 'takeaway', title: 'Кружки после чаепития', item: '☕', noun: 'кружек', groups: 4, size: 3, reserve: 2,
      story: 'На четырёх столах стоят по 3 кружки. Две кружки нужно отнести на кухню. Сколько кружек было на столах и сколько останется?'},
    {n: 3, kind: 'reserve', title: 'Билеты для трёх друзей', item: '🎟️', noun: 'билетов', total: 20, reserve: 5, groups: 3,
      story: 'Для школьного концерта принесли 20 билетов. Пять оставили в кассе. Остальные три помощника возьмут поровну, чтобы раздать гостям.'},
    {n: 4, kind: 'takeaway', title: 'Кубики для новой игры', item: '🎲', noun: 'кубиков', groups: 3, size: 4, reserve: 3,
      story: 'На трёх игровых столах лежат по 4 кубика. Для новой игры нужно забрать 3 кубика на отдельный стол. Сколько кубиков лежало на прежних столах и сколько там останется?'}
  ].forEach(s => {
    const reserve = s.kind === 'reserve', total = reserve ? s.total : s.groups * s.size;
    const groupLabels = reserve ? ['Отложить'].concat(labels('Получатель', s.groups)) : labels('Прежний стол', s.groups).concat('Забрали');
    const activity = finite(reserve ? 'reserve' : 'takeaway', total, groupLabels, {reserve: s.reserve, groups: s.groups, reserveIndex: reserve ? 0 : s.groups,
      initialPiles: reserve ? groupLabels.map(() => 0) : groupLabels.map((_, i) => i < s.groups ? s.size : 0),
      hideTotal: !reserve, capacities: groupLabels.map((_, i) => !reserve && i < s.groups ? s.size : total)});
    add('sequence', s.n, {title: s.title, item: s.item, noun: s.noun, story: s.story,
      prediction: question('С чего начнёшь?', reserve ? 'reserve' : 'whole',
        reserve ? choices(['divide', 'Сразу разделю весь запас между получателями'], ['reserve', 'Сначала отделю то, что нужно оставить'], ['add', 'Сначала добавлю столько же'])
          : choices(['subtract-groups', 'Вычту забранное из числа столов'], ['whole', 'Сначала узнаю, сколько предметов на всех столах'], ['divide', 'Разделю число столов на размер набора']),
        reserve ? 'Получателям достанется только то, что останется после первого дела.' : 'Количество столов и количество предметов — разные величины.'),
      activity, actionText: reserve ? 'Положи нужное количество в «Отложить». Остальное раздай получателям поровну.' : 'Забери нужные предметы с любых прежних столов и положи в последнее место. Оставшиеся можно не выравнивать.',
      actionHint: reserve ? 'Сначала выполни первое дело. Потом работай только с оставшимся запасом.' : 'Кнопка «Забрать» возвращает предмет в запас. Затем положи его в место «Забрали».',
      fields: reserve
        ? [field('left', 'Предметов после откладывания', total - s.reserve, 'Вычти только то, что оставили для первого дела.'), field('each', 'Предметов одному получателю', (total - s.reserve) / s.groups, 'Раздели оставшийся запас, не весь первоначальный.')]
        : [field('before', 'Предметов на прежних столах сначала', total, 'У каждого стола одинаковый набор.'), field('left', 'Предметов на прежних столах теперь', total - s.reserve, 'Забранные предметы больше не относятся к прежним столам.')],
      reason: question('Почему нужен такой порядок?', reserve ? 'part' : 'whole',
        choices(['part', 'Раздаём только оставшуюся часть запаса'], ['whole', 'Сначала считаем все предметы, затем убираем часть'], ['any', 'Порядок всегда можно менять']),
        'Сравни вопрос задачи с тем, что именно стало известно после первого действия.'),
      equations: reserve ? [total + ' − ' + s.reserve + ' = ' + (total - s.reserve), (total - s.reserve) + ' : ' + s.groups + ' = ' + (total - s.reserve) / s.groups]
        : [s.groups + ' × ' + s.size + ' = ' + total, total + ' − ' + s.reserve + ' = ' + (total - s.reserve)],
      conclusion: reserve ? 'Сначала отделили нужную часть, а затем разделили остаток поровну.' : 'Сначала нашли целое по равным группам, затем вычли забранную часть.'});
  });
  const api = {lines, missions};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ArzhenikovDiscoveries = api;
})(typeof window === 'undefined' ? globalThis : window);
