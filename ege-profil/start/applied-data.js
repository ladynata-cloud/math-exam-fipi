(function (root) {
  'use strict';
  // Author-written examples for the 2027 draft: 10 — formulae, 11 — word
  // problems, 13 — financial models. The last three tasks are reserved for
  // independent practice. None is a real financial product or recommendation.
  const f = n => String(Number(n.toFixed(8))).replace('.', ',').replace('-', '−');
  const year = n => n === 1 ? 'год' : n >= 2 && n <= 4 ? 'года' : 'лет';
  const fraction = n => { for (let d = 1; d <= 1000; d++) { const a = Math.round(n * d); if (Math.abs(a / d - n) < 1e-10) return d === 1 ? String(a) : `${a}/${d}`; } return f(n); };
  const S = (prompt, answer, hint, why, focus = 'known') => ({ prompt, answer, hint, why, focus });
  const T = (id, prompt, steps, answer, meta, rows, target, help) => ({
    id: 'applied-' + id, prompt, steps, answer, meta,
    explanation: steps.map(s => s.why).join(' '),
    diagram: { rows, target, help }
  });
  const row = (name, value, unit = '') => ({ name, value: String(value), unit });
  const L = (id, position, title, summary, intro, why, tasks) => ({
    id: 'applied-' + id, group: position === 13 ? 'finance' : 'applied', position,
    title, summary, intro, why,
    prereq: { title: 'Вспомнить одно правило', text: '<p>' + why + '</p>', href: '/trainers/oge-basics/' },
    links: [], tasks
  });

  function heat(id, mass, capacity, rise) {
    const first = mass * capacity, answer = first * rise;
    return T(id, `Количество теплоты вычисляют по формуле Q = cmΔt. Здесь c — удельная теплоёмкость, m — масса, Δt — повышение температуры. Для ${f(mass)} кг воды c = ${f(capacity)} Дж/(кг·°C). Температуру повысили на ${f(rise)} °C. Найди Q в джоулях.`, [
      S(`Подставили данные: Q = ${f(capacity)} · ${f(mass)} · ${f(rise)}. Сначала вычисли ${f(capacity)} · ${f(mass)}.`, first, 'Два первых множителя — теплоёмкость и масса.', `c · m = ${f(first)}.`, 'known'),
      S(`Теперь умножь ${f(first)} на повышение температуры ${f(rise)}.`, answer, 'В формуле остался последний множитель.', `Q = ${f(first)} · ${f(rise)} = ${f(answer)} Дж.`, 'target')
    ], answer, { kind: 'heat', mass, capacity, rise }, [row('Масса m', f(mass), 'кг'), row('Теплоёмкость c', f(capacity), 'Дж/(кг·°C)'), row('Повышение Δt', f(rise), '°C')], 'Количество теплоты Q, Дж', 'Вместо каждой буквы ставим число из соответствующей строки. Измерения уже согласованы: килограммы, градусы и джоули.');
  }
  function power(id, voltage, resistance) {
    const square = voltage ** 2, answer = square / resistance;
    return T(id, `Мощность нагревателя вычисляют по формуле P = U²/R, где U — напряжение в вольтах, R — сопротивление в омах. U = ${voltage} В, R = ${resistance} Ом. Найди P в ваттах.`, [
      S(`Сначала найди квадрат напряжения: ${voltage}².`, square, `${voltage}² означает ${voltage} · ${voltage}.`, `U² = ${square}.`),
      S(`Раздели ${square} на сопротивление ${resistance}.`, answer, 'Деление выполняем после возведения в квадрат.', `P = ${square} : ${resistance} = ${f(answer)} Вт.`, 'target')
    ], answer, { kind: 'power', voltage, resistance }, [row('Напряжение U', voltage, 'В'), row('Сопротивление R', resistance, 'Ом')], 'Мощность P, Вт', 'Квадрат относится только к напряжению U. Сначала вычисляем U², затем делим на R.');
  }
  function pressure(id, surface, density, gravity, depth) {
    const water = density * gravity * depth, total = surface + water, answer = total / 1000;
    return T(id, `Давление на глубине h вычисляют по формуле p = p₀ + ρgh. Дано: p₀ = ${surface} Па, ρ = ${density} кг/м³, g = ${gravity} м/с², h = ${depth} м. Найди давление в килопаскалях. 1 кПа = 1000 Па.`, [
      S(`Найди добавку от воды: ${density} · ${gravity} · ${depth}.`, water, 'Это произведение ρgh.', `Вода добавляет ${water} Па.`),
      S(`Прибавь давление на поверхности: ${surface} + ${water}.`, total, 'Формула содержит сумму p₀ и ρgh.', `Общее давление равно ${total} Па.`),
      S(`Переведи ${total} Па в кПа: раздели на 1000.`, answer, 'В одном килопаскале тысяча паскалей.', `p = ${f(answer)} кПа.`, 'target')
    ], answer, { kind: 'pressure', surface, density, gravity, depth }, [row('На поверхности p₀', surface, 'Па'), row('Плотность ρ', density, 'кг/м³'), row('Ускорение g', gravity, 'м/с²'), row('Глубина h', depth, 'м')], 'Давление p, кПа', 'Сначала формула даёт давление в паскалях. Перевод в килопаскали — отдельное последнее действие.');
  }
  function braking(id, speed, acceleration, distance) {
    const coefficient = 2 * speed / acceleration, constant = 2 * distance / acceleration;
    const discr = coefficient ** 2 - 4 * constant, radical = Math.sqrt(discr), answer = (coefficient - radical) / 2, second = (coefficient + radical) / 2;
    return T(id, `Автомобиль начал тормозить со скорости ${speed} м/с с постоянным замедлением ${acceleration} м/с². До остановки путь за t секунд равен S = ${speed}t − ${f(acceleration / 2)}t². За какое время он проедет ${distance} м? Найди время в секундах; формула применяется только до остановки.`, [
      S(`Подставляем S = ${distance}: ${speed}t − ${f(acceleration / 2)}t² = ${distance}. Делим на ${f(acceleration / 2)} и переносим всё влево: t² − ${f(coefficient)}t + ${f(constant)} = 0. Вычисли дискриминант: ${f(coefficient)}² − 4 · ${f(constant)}.`, discr, 'Знак среднего коэффициента отрицательный, но его квадрат положительный.', `D = ${f(discr)}.`),
      S(`Найди квадратный корень из ${f(discr)}.`, radical, 'Нужен неотрицательный корень.', `√D = ${f(radical)}.`),
      S(`Вычисли меньший корень: (${f(coefficient)} − ${f(radical)}) : 2.`, answer, `Второй корень равен ${f(second)}. Автомобиль остановится через ${f(speed / acceleration)} с, поэтому второй корень не подходит.`, `t = ${f(answer)} с. Другой корень ${f(second)} с позже остановки (${f(speed / acceleration)} с), его не берём.`, 'target')
    ], answer, { kind: 'braking', speed, acceleration, distance }, [row('Начальная скорость', speed, 'м/с'), row('Замедление', acceleration, 'м/с²'), row('Пройденный путь', distance, 'м')], 'Время до остановки t, с', 'После остановки формула торможения больше не описывает движение. Из двух корней подходит только время от 0 до момента остановки.');
  }
  function decay(id, coefficient, initial, final) {
    const ratio = initial / final, log = Math.log2(ratio), answer = coefficient * log;
    return T(id, `Время снижения напряжения вычисляют по формуле t = ${coefficient} · log₂(U₀/U). Начальное напряжение U₀ = ${initial} В, конечное U = ${final} В. Найди время t в секундах.`, [
      S(`Найди отношение напряжений: ${initial} : ${final}.`, ratio, 'В числителе — начальное напряжение.', `U₀/U = ${f(ratio)}.`),
      S(`В какую степень нужно возвести 2, чтобы получить ${f(ratio)}?`, log, `log₂ ${f(ratio)} — это показатель степени числа 2.`, `log₂ ${f(ratio)} = ${f(log)}, потому что 2 в степени ${f(log)} равно ${f(ratio)}.`),
      S(`Умножь найденный логарифм на ${coefficient}.`, answer, 'Это последний множитель в данной формуле.', `t = ${coefficient} · ${f(log)} = ${f(answer)} с.`, 'target')
    ], answer, { kind: 'decay', coefficient, initial, final }, [row('Начальное U₀', initial, 'В'), row('Конечное U', final, 'В'), row('Коэффициент', coefficient, 'с')], 'Время t, с', 'Внутри логарифма сначала вычисляем отношение двух напряжений. Они даны в одних единицах.');
  }
  function voltageLimit(id, resistance, limit) {
    const square = resistance * limit, answer = Math.sqrt(square);
    return T(id, `Мощность нагревателя P = U²/R. Сопротивление R = ${resistance} Ом. По условию мощность не должна превышать ${limit} Вт. Найди наибольшее допустимое неотрицательное напряжение U в вольтах.`, [
      S(`Записали требование: U²/${resistance} ≤ ${limit}. Умножаем обе части на ${resistance}. Найди правую часть: ${limit} · ${resistance}.`, square, 'Положительное сопротивление не меняет знак неравенства.', `U² ≤ ${square}.`),
      S(`U ≥ 0. Какое наибольшее U удовлетворяет U² ≤ ${square}?`, answer, 'Извлеки квадратный корень из правой части.', `0 ≤ U ≤ ${f(answer)}. Наибольшее допустимое напряжение — ${f(answer)} В.`, 'target')
    ], answer, { kind: 'voltage-limit', resistance, limit }, [row('Сопротивление R', resistance, 'Ом'), row('Максимальная мощность', limit, 'Вт'), row('Напряжение U', 'неотрицательное')], 'Наибольшее U, В', '«Не превышает» означает ≤. Сначала записываем ограничение для мощности, потом находим ограничение для напряжения.');
  }
  function motion(id, distance, difference, gap, askFast) {
    const product = distance * difference / gap, discr = difference ** 2 + 4 * product, radical = Math.sqrt(discr), slow = (radical - difference) / 2, fast = slow + difference;
    const steps = [
      S(`<p>Пусть x — меньшая скорость. Тогда время в пути: ${distance}/x и ${distance}/(x + ${difference}). Их разность ${f(gap)} ч.</p><p>Из ${distance}/x − ${distance}/(x + ${difference}) = ${f(gap)} получаем x(x + ${difference}) = ${distance} · ${difference} : ${f(gap)}. Вычисли правую часть.</p>`, product, `1. Медленный: путь ${distance} км, скорость x, время ${distance}/x. Быстрый: тот же путь, скорость x + ${difference}, время ${distance}/(x + ${difference}). Медленный едет дольше: вычитаем время быстрого.<br>2. Общий знаменатель — x(x + ${difference}). Первую дробь домножаем на (x + ${difference})/(x + ${difference}), вторую — на x/x. Получаем [${distance}(x + ${difference}) − ${distance}x] / [x(x + ${difference})] = ${f(gap)}.<br>3. В числителе раскрываем скобки: ${distance}x + ${distance} · ${difference} − ${distance}x = ${distance} · ${difference}. Скорости положительны, поэтому знаменатель не ноль. Умножаем обе части на него: ${distance} · ${difference} = ${f(gap)} · x(x + ${difference}).<br>4. Делим обе части на разницу времени ${f(gap)}: x(x + ${difference}) = ${distance} · ${difference} : ${f(gap)}. Теперь вычисли правую часть.`, `x² + ${difference}x − ${f(product)} = 0.`),
      S(`Для x² + ${difference}x − ${f(product)} = 0 найди дискриминант: ${difference}² + 4 · ${f(product)}.`, discr, 'Последний коэффициент отрицательный, поэтому в дискриминанте получается плюс.', `D = ${f(discr)}.`),
      S(`Найди квадратный корень из ${f(discr)}.`, radical, 'Проверь число умножением на себя.', `√D = ${f(radical)}.`),
      S(`Вычисли положительный корень: (${f(radical)} − ${difference}) : 2. Это меньшая скорость.`, slow, 'Отрицательная скорость не подходит к условию.', `Меньшая скорость: ${f(slow)} км/ч.`, askFast ? 'known' : 'target')
    ];
    if (askFast) steps.push(S(`Нужна большая скорость. Прибавь ${difference} к ${f(slow)}.`, fast, 'Вопрос задачи относится к тому, кто приехал раньше.', `Большая скорость: ${f(fast)} км/ч.`, 'target'));
    return T(id, `Два велосипедиста одновременно выехали на маршрут длиной ${distance} км. Один ехал на ${difference} км/ч быстрее другого и закончил маршрут на ${f(gap)} ч раньше. Скорости постоянны, остановок не было. Найди скорость ${askFast ? 'более быстрого' : 'более медленного'} велосипедиста в км/ч.`, steps, askFast ? fast : slow, { kind: 'motion', distance, difference, gap, askFast }, [row('Путь каждого', distance, 'км'), row('Разница скоростей', difference, 'км/ч'), row('Разница времени', f(gap), 'ч')], `Скорость ${askFast ? 'быстрого' : 'медленного'}, км/ч`, `Если меньшая скорость x, большая x + ${difference}. Время равно пути, делённому на скорость. Вычитаем меньшее время из большего.`);
  }
  function jointWork(id, first, second) {
    const one = 1 / first, two = 1 / second, sum = one + two, answer = 1 / sum;
    return T(id, `Первый насос заполняет пустой бассейн за ${first} ч, второй — за ${second} ч. Оба работают с постоянной производительностью. За сколько часов они заполнят пустой бассейн вместе?`, [
      S(`Какую долю бассейна заполняет первый насос за час? Запиши 1/${first}.`, one, 'Весь бассейн принимаем за 1.', `Первый заполняет 1/${first} бассейна за час.`),
      S(`Какую долю бассейна заполняет второй насос за час? Запиши 1/${second}.`, two, 'Делим один бассейн на время работы второго насоса.', `Второй заполняет 1/${second} бассейна за час.`),
      S(`Сложи производительности: 1/${first} + 1/${second}.`, sum, 'За один час они работают одновременно.', `Совместная производительность равна ${fraction(sum)} бассейна в час.`),
      S(`Раздели весь бассейн (1) на совместную производительность.`, answer, 'Время = объём работы : производительность.', `Вместе насосы заполнят бассейн за ${f(answer)} ч.`, 'target')
    ], answer, { kind: 'joint-work', first, second }, [row('Первый насос один', first, 'ч'), row('Второй насос один', second, 'ч'), row('Вся работа', '1 бассейн')], 'Время совместной работы, ч', 'Времена складывать нельзя. Складываются доли бассейна, заполняемые за один час.');
  }
  function missingWorker(id, joint, first) {
    const totalRate = 1 / joint, secondRate = 1 / joint - 1 / first, answer = 1 / secondRate;
    return T(id, `Две трубы вместе наполняют пустой резервуар за ${joint} ч. Первая труба одна наполняет его за ${first} ч. Расход воды постоянен. За сколько часов вторая труба одна наполнит резервуар?`, [
      S(`Какую долю резервуара трубы наполняют вместе за час? Запиши 1/${joint}.`, totalRate, 'Весь резервуар — одна работа.', `Вместе за час выполняют 1/${joint} работы.`),
      S(`Первая труба даёт 1/${first} работы в час. Вычти её вклад: 1/${joint} − 1/${first}.`, secondRate, 'От общего вклада отнимаем известный.', `Вторая труба даёт ${fraction(secondRate)} работы в час.`),
      S('Раздели 1 на найденную производительность второй трубы.', answer, 'Время — обратная величина к доле работы за час.', `Вторая труба одна справится за ${f(answer)} ч.`, 'target')
    ], answer, { kind: 'missing-worker', joint, first }, [row('Вместе', joint, 'ч'), row('Первая отдельно', first, 'ч')], 'Вторая отдельно, ч', 'Сначала найдём производительность обеих труб за час. Затем вычтем производительность первой.');
  }
  function production(id, amount, difference, gap) {
    const product = amount * difference / gap, discr = difference ** 2 + 4 * product, radical = Math.sqrt(discr), answer = (radical - difference) / 2;
    return T(id, `Два мастера по отдельности выполняют заказ из ${amount} деталей. Первый делает на ${difference} детали в час больше и заканчивает на ${gap} ч раньше второго. Производительность постоянна. Сколько деталей в час делает второй мастер?`, [
      S(`Пусть второй делает x деталей в час, первый — x + ${difference}. Время: ${amount}/x и ${amount}/(x + ${difference}). Из разницы времени ${gap} ч получаем x(x + ${difference}) = ${amount} · ${difference} : ${gap}. Найди правую часть.`, product, `1. Второй мастер: ${amount} деталей, x деталей в час, время ${amount}/x. Первый: столько же деталей, x + ${difference} деталей в час, время ${amount}/(x + ${difference}). Второй работает дольше: ${amount}/x − ${amount}/(x + ${difference}) = ${gap}.<br>2. Общий знаменатель — x(x + ${difference}). Первую дробь домножаем на (x + ${difference})/(x + ${difference}), вторую — на x/x. Получаем [${amount}(x + ${difference}) − ${amount}x] / [x(x + ${difference})] = ${gap}.<br>3. Числитель: ${amount}x + ${amount} · ${difference} − ${amount}x = ${amount} · ${difference}. При x > 0 знаменатель не ноль. Умножаем обе части на него: ${amount} · ${difference} = ${gap} · x(x + ${difference}).<br>4. Делим обе части на ${gap}: x(x + ${difference}) = ${amount} · ${difference} : ${gap}. Осталось вычислить правую часть.`, `Получили x² + ${difference}x − ${f(product)} = 0.`),
      S(`Найди дискриминант: ${difference}² + 4 · ${f(product)}.`, discr, 'Свободный член отрицателен.', `D = ${f(discr)}.`),
      S(`Найди квадратный корень из ${f(discr)}.`, radical, 'Проверяем умножением на себя.', `√D = ${f(radical)}.`),
      S(`Найди положительный корень: (${f(radical)} − ${difference}) : 2.`, answer, 'Мы обозначили x именно производительность второго мастера.', `Второй делает ${f(answer)} деталей в час.`, 'target')
    ], answer, { kind: 'production', amount, difference, gap }, [row('Заказ каждому', amount, 'деталей'), row('Разница за час', difference, 'деталей'), row('Разница времени', gap, 'ч')], 'Второй мастер, деталей/ч', 'Делим весь заказ на число деталей в час и получаем время. Из большего времени вычитаем меньшее.');
  }
  function mixture(id, mass, low, high, target) {
    const highPure = mass * high / 100, needPure = mass * target / 100, excess = highPure - needPure, perKg = (high - low) / 100, answer = excess / perKg;
    return T(id, `Нужно получить ${mass} кг ${target}%-го раствора соли, смешав ${low}%-й и ${high}%-й растворы. Сколько килограммов ${low}%-го раствора нужно взять?`, [
      S(`Представим, что все ${mass} кг взяли из ${high}%-го раствора. Сколько соли получилось бы? Вычисли ${mass} · ${high} : 100.`, highPure, 'Процент показывает, сколько соли приходится на сто частей раствора.', `В такой смеси было бы ${f(highPure)} кг соли.`),
      S(`Сколько соли должно быть в нужной смеси? Вычисли ${mass} · ${target} : 100.`, needPure, 'Используем требуемую концентрацию.', `Нужно ${f(needPure)} кг соли.`),
      S(`На сколько нужно уменьшить массу соли? ${f(highPure)} − ${f(needPure)}.`, excess, 'Заменяем часть более крепкого раствора слабым.', `Соли нужно на ${f(excess)} кг меньше.`),
      S(`Замена 1 кг ${high}%-го раствора на 1 кг ${low}%-го уменьшает соль на (${high} − ${low}) : 100 кг. Найди это число.`, perKg, 'Масса всего раствора при замене не меняется.', `Каждый заменённый килограмм уменьшает массу соли на ${f(perKg)} кг.`),
      S(`Сколько килограммов надо заменить? ${f(excess)} : ${f(perKg)}.`, answer, 'Это и есть масса слабого раствора.', `Нужно ${f(answer)} кг ${low}%-го раствора.`, 'target')
    ], answer, { kind: 'mixture', mass, low, high, target }, [row('Масса смеси', mass, 'кг'), row('Слабый раствор', low, '%'), row('Крепкий раствор', high, '%'), row('Нужная смесь', target, '%')], `Масса ${low}%-го раствора, кг`, 'Соль при смешивании сохраняется. Масса соли = масса раствора × процент : 100.');
  }
  function dilution(id, mass, initial, target) {
    const pure = mass * initial / 100, finalMass = pure * 100 / target, answer = finalMass - mass;
    return T(id, `К ${mass} кг ${initial}%-го раствора соли добавляют чистую воду. Сколько килограммов воды нужно добавить, чтобы получить ${target}%-й раствор?`, [
      S(`Найди массу соли: ${mass} · ${initial} : 100.`, pure, 'Воду добавляем, соль остаётся прежней.', `Соли ${f(pure)} кг.`),
      S(`Эти ${f(pure)} кг соли должны составлять ${target}% новой смеси. Найди всю массу смеси: ${f(pure)} · 100 : ${target}.`, finalMass, 'Чтобы найти целое по проценту, делим на процент и умножаем на 100.', `Масса нового раствора ${f(finalMass)} кг.`),
      S(`Из новой массы вычти исходную: ${f(finalMass)} − ${mass}.`, answer, 'Требуется масса добавленной воды, а не всей смеси.', `Добавить ${f(answer)} кг воды.`, 'target')
    ], answer, { kind: 'dilution', mass, initial, target }, [row('Исходный раствор', mass, 'кг'), row('Было соли', initial, '%'), row('Нужно соли', target, '%'), row('Добавляем', 'чистую воду')], 'Масса добавленной воды, кг', 'У воды концентрация соли 0%. При добавлении воды соли больше не становится. Увеличивается масса всей смеси.');
  }
  function twoMixtures(id, low, high, addedMass, replacement, firstPercent, secondPercent) {
    const addedSalt = addedMass * replacement / 100, total = addedSalt * 100 / (secondPercent - firstPercent), original = total - addedMass, salt = total * firstPercent / 100, numerator = high * original - 100 * salt, answer = numerator / (high - low);
    return T(id, `Смешали ${low}%-й и ${high}%-й растворы соли. При добавлении ${addedMass} кг воды получился ${firstPercent}%-й раствор. Если вместо воды добавить ${addedMass} кг ${replacement}%-го раствора, получится ${secondPercent}%-й раствор. Сколько килограммов ${low}%-го раствора было в исходной смеси?`, [
      S(`Во втором случае вместо воды добавилась соль: ${addedMass} · ${replacement} : 100. Сколько это килограммов?`, addedSalt, 'Общая масса в обоих случаях одинакова, потому что добавляют одинаковую массу.', `Во втором случае соли больше на ${f(addedSalt)} кг.`),
      S(`Разница ${f(addedSalt)} кг составляет ${secondPercent} − ${firstPercent} = ${secondPercent - firstPercent}% готовой смеси. Найди её массу: ${f(addedSalt)} · 100 : ${secondPercent - firstPercent}.`, total, 'Сравниваем два раствора одной общей массы.', `Масса готовой смеси ${f(total)} кг.`),
      S(`До добавления было на ${addedMass} кг меньше. Вычисли ${f(total)} − ${addedMass}.`, original, 'Убираем именно добавленную массу.', `Исходная смесь весила ${f(original)} кг.`),
      S(`В первом случае вода не добавила соли. Найди соль исходной смеси: ${f(total)} · ${firstPercent} : 100.`, salt, 'Соли столько же, сколько в первом готовом растворе.', `В исходной смеси ${f(salt)} кг соли.`),
      S(`Пусть x кг — ${low}%-й раствор. Другого ${f(original)} − x кг. Записываем соль: ${low}x + ${high}(${f(original)} − x) = ${f(100 * salt)}. Раскрываем скобки: ${high - low}x = ${f(high * original)} − ${f(100 * salt)}. Вычисли правую часть.`, numerator, 'Уравнение массы соли умножено на 100, чтобы убрать дроби.', `${high - low}x = ${f(numerator)}.`),
      S(`Раздели ${f(numerator)} на ${high - low}.`, answer, 'x обозначает массу слабого раствора.', `Взяли ${f(answer)} кг ${low}%-го раствора.`, 'target')
    ], answer, { kind: 'two-mixtures', low, high, addedMass, replacement, firstPercent, secondPercent }, [row('Первый раствор', low, '%'), row('Второй раствор', high, '%'), row('Добавленная масса', addedMass, 'кг'), row('С водой', firstPercent, '%'), row(`С ${replacement}%-м раствором`, secondPercent, '%')], `Исходный ${low}%-й раствор, кг`, 'Оба готовых раствора весят одинаково. Различается только масса соли в добавке. Сначала это помогает найти общую массу.');
  }
  function deposit(id, amount, rate) {
    const interest1 = amount * rate / 100, after1 = amount + interest1, interest2 = after1 * rate / 100, answer = after1 + interest2;
    return T(id, `В учебной модели на вклад ${amount} руб. в конце каждого года начисляют ${rate}% от текущей суммы и оставляют проценты на вкладе. Пополнений, снятий и других платежей нет. Сколько рублей будет через два года?`, [
      S(`Найди проценты первого года: ${amount} · ${rate} : 100.`, interest1, 'В первый год процент берём от начальной суммы.', `Начислено ${f(interest1)} руб.`),
      S(`Прибавь их к вкладу: ${amount} + ${f(interest1)}.`, after1, 'Это сумма к началу второго года.', `Через год на вкладе ${f(after1)} руб.`),
      S(`Во второй год процент начисляют уже на ${f(after1)} руб. Вычисли ${f(after1)} · ${rate} : 100.`, interest2, 'Процентная ставка та же, но сумма стала больше.', `Во второй год начислено ${f(interest2)} руб.`),
      S(`Сложи ${f(after1)} и ${f(interest2)}.`, answer, 'Получаем всю сумму после двух начислений.', `Через два года будет ${f(answer)} руб.`, 'target')
    ], answer, { kind: 'deposit', amount, rate }, [row('Начальная сумма', amount, 'руб.'), row('За каждый год', rate, '%'), row('Срок', 2, 'года')], 'Сумма через два года, руб.', 'Каждый новый процент начисляют на текущую сумму. Проценты первого года тоже участвуют во втором начислении.');
  }
  function originalDeposit(id, final, rate) {
    const multiplier = 1 + rate / 100, answer = final / multiplier;
    return T(id, `За один год сумма вклада увеличилась на ${rate}% и стала ${final} руб. Пополнений и снятий не было. Какую сумму внесли первоначально?`, [
      S(`Первоначальная сумма — 100%. Вместе с доходом: ${100 + rate}%. Запиши это числом: ${100 + rate} : 100.`, multiplier, 'Процент переводим в десятичную дробь.', `После начисления первоначальная сумма умножилась на ${f(multiplier)}.`),
      S(`Чтобы вернуть первоначальную сумму, раздели ${final} на ${f(multiplier)}.`, answer, 'Вычитать процент от конечной суммы нельзя: процент начисляли на начальную.', `Первоначально внесли ${f(answer)} руб.`, 'target')
    ], answer, { kind: 'original-deposit', final, rate }, [row('После начисления', final, 'руб.'), row('Доход за год', rate, '%')], 'Первоначальная сумма, руб.', 'Увеличение на 20% означает умножение на 1,2. Обратное действие — деление на 1,2.');
  }
  function compareDeposits(id, amount, simpleRate, compoundRate) {
    const simpleInterest = amount * simpleRate / 100 * 2, simpleFinal = amount + simpleInterest, after1 = amount * (1 + compoundRate / 100), compoundFinal = after1 * (1 + compoundRate / 100), answer = compoundFinal - simpleFinal;
    return T(id, `Сравнивают две учебные схемы для ${amount} руб. на два года. Схема А: каждый год начисляют ${simpleRate}% только от первоначальной суммы, проценты на проценты не начисляют. Схема Б: каждый год начисляют ${compoundRate}% от текущей суммы. Других платежей нет. На сколько рублей итог по схеме Б больше итога по схеме А?`, [
      S(`По схеме А проценты за два года: ${amount} · ${simpleRate} : 100 · 2. Найди их.`, simpleInterest, 'Оба года берём процент от одной и той же начальной суммы.', `Доход по А — ${f(simpleInterest)} руб.`),
      S(`Найди итог А: ${amount} + ${f(simpleInterest)}.`, simpleFinal, 'Прибавляем исходный вклад.', `Итог А — ${f(simpleFinal)} руб.`),
      S(`По схеме Б найди сумму после первого года: ${amount} · ${f(1 + compoundRate / 100)}.`, after1, 'Сумму увеличиваем на указанный процент.', `После первого года по Б — ${f(after1)} руб.`),
      S(`Ещё раз увеличь эту сумму: ${f(after1)} · ${f(1 + compoundRate / 100)}.`, compoundFinal, 'Во второй год процент начисляют на новую сумму.', `Итог Б — ${f(compoundFinal)} руб.`),
      S(`Найди разницу: ${f(compoundFinal)} − ${f(simpleFinal)}.`, answer, 'Сравниваем именно конечные суммы.', `Схема Б даёт на ${f(answer)} руб. больше.`, 'target')
    ], answer, { kind: 'compare-deposits', amount, simpleRate, compoundRate }, [row('Первоначально', amount, 'руб.'), row('Срок', 2, 'года'), row('А: от начальной суммы', simpleRate, '% в год'), row('Б: от текущей суммы', compoundRate, '% в год')], 'Разница Б − А, руб.', 'Сначала найдём итог каждой схемы отдельно. Затем вычтем один итог из другого.');
  }
  function loanLinear(id, amount, years, rate, overpayment) {
    const reduction = amount / years, sumDebts = amount * (years + 1) / 2, interest = sumDebts * rate / 100, total = amount + interest;
    const debts = Array.from({length: years}, (_, i) => amount - i * reduction);
    const steps = [
      S(`Долг после каждого платежа уменьшается на одну и ту же сумму. За ${years} ${year(years)} нужно вернуть ${amount} руб. Найди ежегодное уменьшение: ${amount} : ${years}.`, reduction, 'Это возвращаемая часть первоначального долга, без процентов.', `Долг ежегодно уменьшается на ${f(reduction)} руб.`),
      S(`Перед начислениями долг равен: ${debts.map(f).join('; ')} руб. Сложи эти суммы.`, sumDebts, 'Первое начисление — на весь долг. Следующие — на остатки после платежей.', `Сумма долгов перед начислениями: ${f(sumDebts)} руб.`),
      S(`Найди все проценты: ${f(sumDebts)} · ${rate} : 100.`, interest, 'На каждый из этих остатков начисляют один и тот же процент.', `Переплата по процентам — ${f(interest)} руб.`, overpayment ? 'target' : 'known')
    ];
    if (!overpayment) steps.push(S(`Прибавь первоначальный долг: ${amount} + ${f(interest)}.`, total, 'Все платежи вместе — возвращённый долг плюс проценты.', `Общая сумма платежей — ${f(total)} руб.`, 'target'));
    return T(id, `Кредит ${amount} руб. возвращают за ${years} ${year(years)}. В начале каждого года банк начисляет ${rate}% на оставшийся долг, затем до конца года вносят один платёж. После каждого платежа долг уменьшается на одну и ту же сумму по сравнению с долгом в конце предыдущего года. После последнего платежа долг равен нулю. Найди ${overpayment ? 'переплату по процентам' : 'общую сумму платежей'} в рублях.`, steps, overpayment ? interest : total, { kind: 'loan-linear', amount, years, rate, overpayment }, [row('Кредит', amount, 'руб.'), row('Срок', years, 'года'), row('Проценты за год', rate, '%'), row('Уменьшение долга', 'одинаковое каждый год')], overpayment ? 'Переплата, руб.' : 'Все платежи, руб.', 'Одинаково уменьшается долг, а не весь платёж. В платёж входят часть долга и проценты на остаток.');
  }
  function loanPrincipal(id, total, years, rate) {
    const interestMultiplier = (years + 1) / 2 * rate / 100, multiplier = 1 + interestMultiplier, answer = total / multiplier;
    return T(id, `Кредит погасили за ${years} ${year(years)}. В начале каждого года на остаток начисляли ${rate}%, затем вносили платёж. Долг после каждого платежа уменьшался на одинаковую сумму и к концу срока стал нулевым. Всего выплатили ${total} руб. Найди первоначальную сумму кредита.`, [
      S(`Пусть кредит равен x. Остатки перед начислением в сумме равны ${f((years + 1) / 2)}x. Все проценты: ${f((years + 1) / 2)}x · ${rate} : 100. Какой множитель получится перед x?`, interestMultiplier, `Остатки равны x, затем ${(years - 1)}/${years} от x и так далее до 1/${years} от x. Складываем эти доли.`, `Все проценты равны ${f(interestMultiplier)}x.`),
      S(`Кредит и проценты вместе: x + ${f(interestMultiplier)}x. Найди общий множитель: 1 + ${f(interestMultiplier)}.`, multiplier, 'Именно эту долю первоначального кредита выплатили всего.', `Получаем ${f(multiplier)}x = ${total}.`),
      S(`Раздели ${total} на ${f(multiplier)}.`, answer, 'Находим x — сумму, взятую в кредит.', `Первоначальный кредит — ${f(answer)} руб.`, 'target')
    ], answer, { kind: 'loan-principal', total, years, rate }, [row('Все платежи', total, 'руб.'), row('Срок', years, 'года'), row('Процент', rate, '% в год'), row('Уменьшение долга', 'равными частями')], 'Сумма кредита, руб.', 'Пусть x — первоначальная сумма. Для трёх лет остатки перед начислением: x, 2x/3, x/3. Их сумма 2x.');
  }
  function loanEqual(id, amount, years, rate, overpayment = false) {
    const q = 1 + rate / 100, power = q ** years, sum = Array.from({ length: years }, (_, i) => q ** i).reduce((a, b) => a + b, 0), annual = amount * power / sum, total = annual * years, answer = overpayment ? total - amount : total;
    const firstConstant = amount * q, secondConstant = firstConstant * q, secondCoefficient = q + 1;
    const steps = [
      S(`Начисление ${rate}% увеличивает долг до ${100 + rate}%. Запиши множитель: ${100 + rate} : 100.`, q, 'До платежа долг умножается на этот множитель.', `Каждый год долг сначала умножают на ${f(q)}.`),
      S(`Первый год. Начисли проценты: ${amount} · ${f(q)}.`, firstConstant, 'Платёж пока не вычитаем.', `Перед первым платежом долг ${f(firstConstant)} руб. Пусть одинаковый платёж равен x. После него останется ${f(firstConstant)} − x.`),
      S(`Второй год. Умножаем весь остаток (${f(firstConstant)} − x) на ${f(q)}. Числовая часть: ${f(firstConstant)} · ${f(q)}. Найди её.`, secondConstant, `На ${f(q)} умножается и число, и −x.`, `После начисления: ${f(secondConstant)} − ${f(q)}x.`),
      S(`Вносим второй платёж x. Теперь долг: ${f(secondConstant)} − ${f(q)}x − x. Сложи множители перед x: ${f(q)} + 1.`, secondCoefficient, `−${f(q)}x − x = −(${f(q)} + 1)x.`, `После второго платежа долг: ${f(secondConstant)} − ${f(secondCoefficient)}x.`)
    ];
    if (years === 3) {
      steps.push(S(`Третий год. Остаток (${f(secondConstant)} − ${f(secondCoefficient)}x) умножаем на ${f(q)}. Найди числовую часть: ${f(secondConstant)} · ${f(q)}.`, amount * power, 'Опять умножаем каждый член в скобках.', `После начисления: ${f(amount * power)} − ${f(secondCoefficient * q)}x.`));
      steps.push(S(`Вносим третий платёж x. Перед x было ${f(secondCoefficient * q)}, вычитаем ещё один x. Найди сумму: ${f(secondCoefficient * q)} + 1.`, sum, 'Это общий множитель перед x после третьего платежа.', `После последнего платежа долг: ${f(amount * power)} − ${f(sum)}x. Он равен нулю.`));
    }
    steps.push(S(`После последнего платежа долг равен нулю: ${f(amount * power)} − ${f(sum)}x = 0. Значит, ${f(sum)}x = ${f(amount * power)}. Найди один платёж: ${f(amount * power)} : ${f(sum)}.`, annual, 'Перенесли вычитаемое вправо и разделили обе части на множитель при x.', `Один платёж равен ${f(annual)} руб.`));
    steps.push(S(`Всего ${years} одинаковых платежа. Вычисли ${f(annual)} · ${years}.`, total, 'Складываем все платежи, а не только проценты.', `Всего выплатят ${f(total)} руб.`, overpayment ? 'known' : 'target'));
    if (overpayment) steps.push(S(`Для переплаты вычти взятую сумму: ${f(total)} − ${amount}.`, answer, 'Переплата — деньги сверх первоначального долга.', `Переплата составит ${f(answer)} руб.`, 'target'));
    return T(id, `В учебной модели кредит ${amount} руб. берут на ${years} ${year(years)}. Каждый январь оставшийся долг увеличивается на ${rate}%. После начисления процентов до конца июня вносят один платёж. Все ${years} годовых платежа одинаковы; последний полностью погашает долг. Других платежей нет. Найди ${overpayment ? 'переплату' : 'общую сумму платежей'} в рублях.`, steps, answer, { kind: 'loan-equal', amount, years, rate, overpayment }, [row('Кредит', amount, 'руб.'), row('Срок', years, 'года'), row('Начисление', rate, '% в год'), row('Платежи', 'одинаковые')], overpayment ? 'Переплата, руб.' : 'Все платежи, руб.', 'В каждом году порядок один: сначала начислить проценты на остаток, затем вычесть платёж. После последнего платежа остаток должен быть нулевым.');
  }

  const lessons = [
    L('formula', 10, 'Формула: подставить числа и проверить единицы', 'Сначала данные. Затем одно действие за раз.',
      '<p>Формула уже дана в условии. Найди значение каждой буквы и подставь числа на её место.</p><p>Сначала выполняют действия в скобках и степени, затем умножение и деление. Проверь, в каких единицах нужен ответ.</p>',
      'Буква в формуле обозначает конкретную величину. Не вводим новые буквы, если хватает обозначений условия.', [heat('formula-heat', 2, 4200, 15), power('formula-power', 120, 24), pressure('formula-pressure', 100000, 1000, 10, 8), heat('formula-heat-new', 3, 4200, 20), power('formula-power-new', 180, 60), pressure('formula-pressure-new', 100000, 1000, 10, 12)]),
    L('formula-limit', 10, 'Формула: найти неизвестное и проверить ограничение', 'Время, допустимое напряжение и логарифм в условии.',
      '<p>Если неизвестно число внутри формулы, сначала подставь всё известное. Получится уравнение или неравенство.</p><p>«Не больше» означает ≤. Время и длина должны соответствовать смыслу задачи. Из двух корней иногда подходит только один.</p>',
      'Число должно подходить не только к уравнению, но и к условию: например, время торможения не может быть позже остановки.', [braking('limit-braking', 20, 2, 64), decay('limit-decay', 5, 96, 12), voltageLimit('limit-voltage', 40, 250), braking('limit-braking-new', 18, 2, 65), decay('limit-decay-new', 6, 160, 5), voltageLimit('limit-voltage-new', 25, 400)]),
    L('motion', 11, 'Движение: один путь, разное время', 'Скорость → время → уравнение.',
      '<p>Время = путь : скорость. Например, оба проезжают 72 км, быстрый едет на 6 км/ч быстрее и приезжает на 2 ч раньше. Обозначим меньшую скорость x. Она положительна: x > 0.</p><table><thead><tr><th>Участник</th><th>Путь, км</th><th>Скорость, км/ч</th><th>Время, ч</th></tr></thead><tbody><tr><td>Медленный</td><td>72</td><td>x</td><td>72/x</td></tr><tr><td>Быстрый</td><td>72</td><td>x + 6</td><td>72/(x + 6)</td></tr></tbody></table><p>Медленный тратит больше времени. Поэтому <b>72/x − 72/(x + 6) = 2</b>.</p><p>Общий знаменатель — x(x + 6). Домножаем первую дробь на (x + 6)/(x + 6), вторую — на x/x:<br>[72(x + 6) − 72x] / [x(x + 6)] = 2.<br>Раскрываем скобки в числителе: 72x + 72 · 6 − 72x = 72 · 6.</p><p>Умножаем обе части на ненулевой знаменатель: 72 · 6 = 2x(x + 6). Делим обе части на 2: <b>x(x + 6) = 72 · 6 : 2 = 216</b>. Теперь раскрываем скобки и переносим 216 влево: x² + 6x − 216 = 0. Дроби исчезли; осталось знакомое квадратное уравнение.</p>',
      'Путь измеряем в километрах, скорость — в километрах в час. Тогда время получается в часах.', [motion('motion-fast', 72, 6, 2, true), motion('motion-slow', 120, 4, 1, false), motion('motion-half', 90, 6, 0.5, true), motion('motion-fast-new', 96, 4, 2, true), motion('motion-slow-new', 144, 6, 2, false), motion('motion-half-new', 100, 5, 1, true)]),
    L('work', 11, 'Работа: сколько получается за один час', 'Трубы, насосы и изготовление деталей.',
      '<p>Если всю работу делают за 6 часов, за час выполняют 1/6 работы. При совместной работе складывают производительности.</p><p>Когда мастера выполняют одинаковые заказы по отдельности, время = число деталей : число деталей за час. Например, каждому нужно сделать 120 деталей. Первый делает на 4 детали в час больше и заканчивает на 1 ч раньше. Пусть второй делает x деталей в час, x > 0.</p><table><thead><tr><th>Мастер</th><th>Деталей всего</th><th>Деталей за час</th><th>Время, ч</th></tr></thead><tbody><tr><td>Второй, медленный</td><td>120</td><td>x</td><td>120/x</td></tr><tr><td>Первый, быстрый</td><td>120</td><td>x + 4</td><td>120/(x + 4)</td></tr></tbody></table><p>Второй работает дольше: <b>120/x − 120/(x + 4) = 1</b>. Общий знаменатель — x(x + 4). Домножаем первую дробь на (x + 4)/(x + 4), вторую — на x/x:<br>[120(x + 4) − 120x] / [x(x + 4)] = 1.</p><p>В числителе 120x + 120 · 4 − 120x = 120 · 4. Умножаем обе части на ненулевой знаменатель: 120 · 4 = 1 · x(x + 4). Делим на разницу времени 1: <b>x(x + 4) = 120 · 4 : 1 = 480</b>. После раскрытия скобок получаем x² + 4x − 480 = 0. Если разница времени другая, делим на неё.</p>',
      'Вместе складывают производительности, а не времена. Чем больше делают за час, тем быстрее заканчивают.', [jointWork('work-joint', 6, 3), production('work-production', 120, 4, 1), missingWorker('work-missing', 4, 12), jointWork('work-joint-new', 12, 4), production('work-production-new', 180, 3, 2), missingWorker('work-missing-new', 6, 15)]),
    L('mixture', 11, 'Смеси: отдельно раствор и отдельно соль', 'Масса раствора и масса вещества — не одно и то же.',
      '<p>В 10 кг 20%-го раствора 2 кг соли. Масса соли = масса раствора × процент : 100.</p><p>При смешивании складываются массы растворов и массы соли. Чистая вода добавляет массу, но не добавляет соль.</p>',
      'Процент относится к массе всего раствора. 20% = 20/100 = 0,2.', [mixture('mixture-mix', 40, 10, 30, 25), dilution('mixture-water', 24, 25, 15), twoMixtures('mixture-two', 10, 50, 10, 60, 30, 40), mixture('mixture-mix-new', 60, 20, 50, 35), dilution('mixture-water-new', 30, 24, 15), twoMixtures('mixture-two-new', 20, 80, 12, 50, 40, 50)]),
    L('percent', 13, 'Перед кредитами: проценты и изменение суммы', 'Разминка: от какой суммы считаем процент?',
      '<p>Это подготовка к финансовой задаче №13. Увеличить сумму на 10% — значит умножить её на 1,1.</p><p>При повторном начислении нужно уточнить, от какой суммы берут процент: от первоначальной или от текущей.</p>',
      'Один процент — одна сотая. 15% от суммы = сумма × 15 : 100.', [deposit('percent-deposit', 50000, 10), originalDeposit('percent-original', 67200, 12), compareDeposits('percent-compare', 100000, 10, 10), deposit('percent-deposit-new', 80000, 5), originalDeposit('percent-original-new', 102000, 20), compareDeposits('percent-compare-new', 200000, 12, 12)]),
    L('loan-linear', 13, 'Кредит: долг уменьшается равными частями', 'Долг → проценты → общая выплата.',
      '<p>Равные части долга и равные платежи — разные условия. Здесь после каждого платежа долг уменьшается одинаково.</p><p>Процент начисляют на остаток перед очередным платежом. Все выплаты = первоначальный кредит + все проценты.</p>',
      'Остаток долга — то, что ещё должны после платежа. На погашенную часть новый процент не начисляют.', [loanLinear('loan-linear-total', 100000, 2, 10, false), loanLinear('loan-linear-three', 240000, 3, 15, false), loanLinear('loan-linear-interest', 160000, 4, 10, true), loanLinear('loan-linear-total-new', 300000, 5, 12, false), loanLinear('loan-linear-interest-new', 360000, 3, 10, true), loanPrincipal('loan-linear-principal-new', 390000, 3, 15)]),
    L('loan-equal', 13, 'Кредит: одинаковые ежегодные платежи', 'Сначала проценты. Потом платёж. Повторяем по годам.',
      '<p>Здесь одинаков весь платёж, включая проценты. Обозначим его x.</p><p>За каждый год делаем два действия: умножаем остаток на процентный множитель и вычитаем x. После последнего года долг равен нулю. Так получаем уравнение.</p>',
      'При 20% годовых перед платежом долг умножается на 1,2. После этого из него вычитают платёж.', [loanEqual('loan-equal-two', 210000, 2, 10), loanEqual('loan-equal-three', 33100, 3, 10), loanEqual('loan-equal-interest', 36400, 3, 20, true), loanEqual('loan-equal-two-new', 110000, 2, 20), loanEqual('loan-equal-three-new', 66200, 3, 10), loanEqual('loan-equal-quarter-new', 48800, 3, 25)])
  ];
  root.ProfileLessons = (root.ProfileLessons || []).concat(lessons);
  if (typeof module !== 'undefined' && module.exports) module.exports = lessons;
})(globalThis);
