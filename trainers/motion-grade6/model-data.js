/* Separate practice cases. No course or cabinet identifiers are allocated here. */
(function (root, build) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = build(require('./course-core.js'));
  else root.MotionModelData = build(root.MotionCourse);
})(typeof window === 'undefined' ? globalThis : window, function (course) {
  'use strict';

  const option = (value, label, feedback = '') => ({ value, label, feedback });
  const actor = (label, start, speed) => ({ label, start, speed });
  const common = {
    gap: 10, targetGap: 0, leadMinutes: 0, answerUnit: 'ч',
    originLabel: 'Момент одновременного старта.',
    axisLabel: 'Ноль — у моста. Вправо — от моста к мельнице.',
    unitPrompt: 'С какой скоростью едет Аня, если измерять путь в километрах, а время в часах?',
    unitAnswer: 12, unitLabel: 'км/ч',
    unitHint: 'Сколько метров она проедет за 60 минут? Сколько метров в километре?',
    unknown: 'time',
    unknownChoices: [
      option('path', 'Путь Ани до встречи', 'Путь можно отметить на схеме. В каких единицах нужно дать ответ на вопрос задачи?'),
      option('time', 'Время от старта до встречи'),
      option('speed', 'Скорость Бори', 'Прочитай, какое число в условии уже описывает скорость Бори.')
    ],
    sensePrompt: 'Подставь своё время. На каком километре от моста окажется каждый?',
    senseLabels: ['Место Ани от моста, км', 'Место Бори от моста, км']
  };

  const cases = [
    {
      ...common, id: 'meet', title: 'От моста и от мельницы',
      story: 'По прямой дороге от моста до мельницы 10 км. Аня выехала от моста к мельнице со скоростью 200 м/мин. Тогда же Боря поехал от мельницы к мосту со скоростью 8 км/ч. Каждый едет с постоянной скоростью.',
      question: 'Через сколько часов они встретятся?',
      actors: [actor('Аня', 0, 12), actor('Боря', 10, -8)], answer: 0.5,
      reason: 'both', reasonChoices: [
        option('opposite', 'Надо вычесть скорости, потому что стрелки направлены в разные стороны.', 'Представь две фишки в 10 клетках друг от друга. Сдвинь каждую на одну клетку навстречу другой: останется 8 клеток. Так действует движение каждого.'),
        option('both', 'Каждый едет по промежутку между ними и сокращает его своим путём.'),
        option('one', 'Промежуток сокращает только Аня, потому что она едет быстрее.', 'Если Аня остановится, изменится ли расстояние до Бори?')
      ],
      senseAnswers: [6, 6],
      checkText: 'Через полчаса Аня в 6 км от моста. Боря проехал 4 км от мельницы и оказался на том же шестом километре. Два пути вместе составили исходные 10 км.',
      hints: {
        model: 'Отметь мост и мельницу. Нарисуй, куда каждый проедет за одинаковое короткое время.',
        equation: 'Обозначь время в часах через x. Как связаны два пути до встречи и весь отрезок дороги?',
        check: 'Путь Бори измеряется от мельницы. Чтобы получить его отметку от моста, посмотри, куда он едет.'
      }
    },
    {
      ...common, id: 'chase', title: 'Та же дорога',
      story: 'Аня снова выехала от моста к мельнице со скоростью 200 м/мин. В тот же момент Боря выехал от мельницы со скоростью 8 км/ч и продолжил путь в том же направлении, что и Аня. По прямой дороге между мостом и мельницей 10 км. Скорости постоянны.',
      question: 'Через сколько часов Аня догонит Борю?',
      actors: [actor('Аня', 0, 12), actor('Боря', 10, 8)], answer: 2.5,
      reason: 'gain', reasonChoices: [
        option('gain', 'Путь Ани сокращает отрыв, а путь Бори за то же время увеличивает его.'),
        option('both', 'Оба едут, поэтому каждый из двух путей сокращает отрыв.', 'Для сравнения представь две фишки в 10 клетках друг от друга. Обе сдвинулись вправо на одну клетку. Между ними по-прежнему 10 клеток, хотя обе прошли путь.'),
        option('same', 'Промежуток постоянен, потому что стрелки направлены одинаково.', 'Если заднюю фишку сдвинуть вправо на 2 клетки, а переднюю на 1, отрыв уменьшится. Сравни пути за одинаковое время.')
      ],
      senseAnswers: [30, 30],
      checkText: 'За 2,5 ч Аня проехала 30 км, Боря — 20 км. Боря начинал на десятом километре, поэтому оба оказались на отметке 30 км. Пути различны, место встречи одно.',
      hints: {
        model: 'Отметь, кто уже впереди. Сдвинь каждого вправо на его путь за одинаковое время.',
        equation: 'Кто проедет больше от старта до встречи? Какой отрезок составляет лишний путь?',
        check: 'Боря начинал у мельницы. Прибавь к его начальной отметке пройденный путь.'
      }
    },
    {
      id: 'delay', title: 'Две поездки от станции',
      story: 'Лена выехала от станции по прямой дороге со скоростью 8 км/ч. Через 45 минут Маша выехала от той же станции вслед за ней со скоростью 12 км/ч. Обе едут без остановок с постоянными скоростями.',
      question: 'Через сколько часов после своего выезда Маша догонит Лену?',
      actors: [actor('Маша', 0, 12), actor('Лена', 6, 8)], gap: 6, targetGap: 0,
      leadMinutes: 45, answer: 1.5, answerUnit: 'ч',
      originLabel: 'Время x отсчитывается с выезда Маши.',
      axisLabel: 'Ноль — у станции. Вправо — от станции по ходу поездки.',
      unknown: 'late', unknownChoices: [
        option('early', 'Время от выезда Лены до встречи', 'Лена выехала первой. От чьего выезда просят отсчитать время?'),
        option('gap', 'Отрыв Лены в момент выезда Маши', 'Отрыв поможет решить задачу. Но ответ на вопрос задачи измеряется в часах.'),
        option('late', 'Время от выезда Маши до встречи')
      ],
      unitPrompt: 'Сколько часов Лена ехала одна?', unitAnswer: 0.75, unitLabel: 'ч',
      unitHint: 'Отметь 45 минут на часовом циферблате. Какую часть оборота прошла минутная стрелка?',
      reason: 'headstart', reasonChoices: [
        option('equalTime', 'Раз обе выехали от станции, к встрече они ехали одинаковое время.', 'В момент старта Маши часы Маши показывают 0 часов пути, а часы Лены — уже 45 минут. Выбери один момент и сравни оба времени.'),
        option('headstart', 'У Лены есть начальный отрыв. Дальше за каждый общий час он сокращается на разность их путей.'),
        option('add', 'С выезда Маши оба пути надо сложить, ведь велосипедисток две.', 'Пока Маша стоит, путь Лены увеличивает отрыв. Меняется ли направление Лены, когда выезжает Маша?')
      ],
      sensePrompt: 'Подставь время от выезда Маши и проверь, где обе окажутся относительно станции.',
      senseLabels: ['Место Маши от станции, км', 'Место Лены от станции, км'], senseAnswers: [18, 18],
      checkText: 'За 1,5 ч Маша проехала 18 км. Лена ехала 0,75 + 1,5 = 2,25 ч и тоже проехала 18 км. Это одно место в один и тот же момент.',
      hints: {
        model: 'Останови воображаемые часы в момент выезда Маши. Где находится каждая велосипедистка?',
        equation: 'Запиши для каждой путь от станции к моменту встречи. Чья поездка длилась дольше, чем x часов?',
        check: 'Для Лены учти и время до выезда Маши, и время совместного движения.'
      }
    },
    {
      id: 'signal', title: 'Связь на маршруте',
      story: 'Две группы одновременно вышли навстречу друг другу по прямой тропе от двух приютов в 20 км друг от друга. Группа из западного приюта идёт со скоростью 6 км/ч, из восточного — 4 км/ч. Скорости постоянны. Рации работают, когда между группами не более 5000 м.',
      question: 'Через сколько часов связь впервые станет возможна?',
      actors: [actor('Западная группа', 0, 6), actor('Восточная группа', 20, -4)],
      gap: 20, targetGap: 5, leadMinutes: 0, answer: 1.5, answerUnit: 'ч',
      originLabel: 'Момент выхода из приютов.', axisLabel: 'Ноль — у западного приюта. Вправо — на восток.',
      unknown: 'contact', unknownChoices: [
        option('contact', 'Время от выхода до первого радиоконтакта'),
        option('meet', 'Время от выхода до встречи групп', 'Связь возможна ещё до встречи. Когда рации впервые окажутся на предельном расстоянии?'),
        option('path', 'Путь западной группы до встречи', 'Перечитай вопрос. В нём говорится о связи и спрашивается время.')
      ],
      unitPrompt: 'При каком наибольшем расстоянии в километрах работают рации?',
      unitAnswer: 5, unitLabel: 'км', unitHint: 'Запиши, сколько метров составляет один километр.',
      reason: 'threshold', reasonChoices: [
        option('zero', 'Надо пройти все 20 км вдвоём и встретиться.', 'На расстоянии одного километра рации уже работают, хотя группы ещё не встретились. Найди границу, на которой связь впервые возможна.'),
        option('difference', 'Отрезок между группами сокращает только разность их путей.', 'Посмотри, приближается ли каждая группа к другой.'),
        option('threshold', 'Пути обеих групп уменьшают промежуток. При первом контакте между группами ещё остаётся дальность действия раций.')
      ],
      sensePrompt: 'Поставь обе группы на тропу в момент первого контакта. Укажи километровые отметки от западного приюта.',
      senseLabels: ['Отметка западной группы, км', 'Отметка восточной группы, км'], senseAnswers: [9, 14],
      checkText: 'Через 1,5 ч группы на отметках 9 км и 14 км: между ними ровно 5 км. До этого промежуток непрерывно сокращался от 20 км до 5 км, поэтому связь появилась впервые.',
      hints: {
        model: 'Отметь на тропе два возможных места, в которых рации только начинают работать.',
        equation: 'На какие три отрезка группы делят тропу в момент первого контакта?',
        check: 'Вычисли расстояние между отметками. Должны ли отметки совпадать?'
      }
    }
  ];

  // The legacy geometry function measures both positions at the same instant.
  function position(c, t) {
    const [a, b] = c.actors;
    return course.geometry({
      kind: b.speed < 0 ? 'meet' : 'catch', gap: c.gap,
      v1: a.speed, v2: Math.abs(b.speed), duration: c.answer
    }, t);
  }

  const near = (a, b) => Number.isFinite(a) && Number.isFinite(b) &&
    Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
  function checkNumber(input, expected) {
    return typeof input === 'string' && near(course.numeric(input), expected);
  }

  /* An affine expression is a*x+b. Track subexpressions to distinguish a physical
     model from simply typing the answer. The parser never executes learner input. */
  function parseSide(source, model, distanceScale) {
    const text = source.toLowerCase().replace(/[х]/g, 'x').replace(/,/g, '.')
      .replace(/[−–]/g, '-').replace(/[·⋅×]/g, '*').replace(/[:÷]/g, '/');
    const token = /\s+|\d+(?:\.\d*)?|\.\d+|[x+*/()-]/gy;
    const tokens = [];
    let index = 0;
    while (index < text.length) {
      const match = token.exec(text);
      if (!match) throw Error('Разрешены числа, x, скобки и четыре арифметических действия.');
      if (!/^\s+$/.test(match[0])) tokens.push(match[0]);
      index = token.lastIndex;
    }
    let cursor = 0;
    const peek = () => tokens[cursor];
    const take = () => tokens[cursor++];
    const fail = () => { throw Error('Проверь скобки и знаки действий. Для умножения можно написать 12x или 12*x.'); };
    const speeds = model.speeds.map(speed => speed * distanceScale);
    const isSpeed = value => speeds.some(speed => near(Math.abs(value), speed));
    // Signed contributions cancel along with the corresponding terms. Keep
    // distance data (including a head start) separate from a computed time.
    function term(a, b, path = 0, explicit = 0, distance = 0, time = 0) {
      if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a) > 1e10 || Math.abs(b) > 1e10) fail();
      return { a, b, path, explicit, distance, time };
    }
    function scale(expr, factor) {
      const a = expr.a * factor;
      const velocity = a !== 0 && factor !== 1 && isSpeed(a);
      return term(a, expr.b * factor, velocity ? a : expr.path * factor,
        velocity ? a : expr.explicit * factor, expr.distance * factor, expr.time * factor);
    }
    function givesTime(distance, speed) {
      return model.scales.some(scale => near(Math.abs(distance.b), model.gap * scale) &&
        near(Math.abs(speed), model.closing * scale)) && matches(distance.distance, distance.b);
    }
    function atom() {
      const part = take();
      if (part === 'x') return term(1, 0, isSpeed(1) ? 1 : 0);
      if (part === '+') return atom();
      if (part === '-') { const n = atom(); return term(-n.a, -n.b, -n.path, -n.explicit, -n.distance, -n.time); }
      if (part === '(') {
        const n = sum();
        if (take() !== ')') fail();
        return n;
      }
      if (part && /^(?:\d|\.)/.test(part)) {
        const value = Number(part);
        const given = model.lengths.some(length => near(value, length));
        return term(0, value, 0, 0, given ? value : 0);
      }
      fail();
    }
    function product() {
      let n = atom();
      while (peek() === '*' || peek() === '/' || peek() === '(' || peek() === 'x') {
        const op = peek() === '*' || peek() === '/' ? take() : '*';
        const r = atom();
        if (op === '/') {
          if (r.a !== 0) throw Error('Здесь можно записать уравнение без x в знаменателе. Вырази путь через скорость и время.');
          if (r.b === 0) throw Error('Делить на ноль нельзя. Проверь знаменатель.');
          const isTime = !n.a && givesTime(n, r.b);
          n = scale(n, 1 / r.b);
          if (isTime) n.time = n.b;
        } else {
          if (n.a !== 0 && r.a !== 0) throw Error('Произведение двух выражений с x здесь не нужно. Умножь скорость на время.');
          if (n.a || r.a) {
            n = n.a ? scale(n, r.b) : scale(r, n.b);
          } else {
            const isTime = givesTime(n, 1 / r.b) || givesTime(r, 1 / n.b);
            const value = n.b * r.b;
            const distance = n.distance ? n.distance * r.b : r.distance * n.b;
            const time = isTime ? value : n.time ? n.time * r.b : r.time * n.b;
            n = term(0, value, 0, 0, distance, time);
          }
        }
      }
      return n;
    }
    function sum() {
      let n = product();
      while (peek() === '+' || peek() === '-') {
        const sign = take() === '+' ? 1 : -1;
        const r = product();
        n = term(n.a + sign * r.a, n.b + sign * r.b, n.path + sign * r.path,
          n.explicit + sign * r.explicit, n.distance + sign * r.distance, n.time + sign * r.time);
      }
      return n;
    }
    const linear = sum();
    if (cursor !== tokens.length) fail();
    return linear;
  }

  // The unknown is positive elapsed time, so D/x = v and D = v*x
  // are equivalent. Only move the denominator when it divides the whole
  // side: e.g. 2+8/x is a sum and cannot be rewritten as (2+8)/x.
  function distanceOverTime(source) {
    let side = source.trim().toLowerCase().replace(/х/g, 'x');
    while (side.startsWith('(') && side.endsWith(')')) {
      let depth = 0;
      const close = [...side].findIndex(ch => {
        if (ch === '(') depth++;
        if (ch === ')') depth--;
        return depth === 0;
      });
      if (close !== side.length - 1) break;
      side = side.slice(1, -1).trim();
    }
    const match = /^(.+)[/:÷]\s*(?:x|\(\s*x\s*\))$/u.exec(side);
    if (!match || match[1].includes('x')) return null;
    const numerator = match[1].trim();
    let depth = 0;
    for (let i = 0; i < numerator.length; i++) {
      const ch = numerator[i];
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (depth < 0 || (i && depth === 0 && /[+−–-]/.test(ch))) return null;
    }
    return depth === 0 && numerator ? numerator : null;
  }

  function matches(supported, actual) {
    return supported !== 0 && actual !== 0 &&
      Math.abs(supported - actual) <= 1e-9 * Math.max(Math.abs(supported), Math.abs(actual));
  }

  function checkEquation(c, raw) {
    const reject = message => ({ ok: false, message });
    if (typeof raw !== 'string' || !raw.trim() || raw.length > 180) return reject('Запиши выражение для времени или короткое уравнение с x.');
    const isEquation = raw.includes('=');
    if (!isEquation && /[хx]/i.test(raw)) return reject('В выражении для времени должны быть только известные величины. Если используешь x, допиши вторую часть уравнения.');
    let sides = isEquation ? raw.split('=') : ['x', raw];
    if (sides.length !== 2 || sides.some(s => !s.trim())) return reject('Запиши обе части уравнения и поставь между ними один знак равенства.');
    if (isEquation) {
      const reciprocal = sides.findIndex(s => distanceOverTime(s) !== null);
      if (reciprocal !== -1 && !/[xх]/i.test(sides[1 - reciprocal])) {
        sides = [distanceOverTime(sides[reciprocal]), '(' + sides[1 - reciprocal] + ')*x'];
      }
    }
    try {
      const closing = c.actors[0].speed - c.actors[1].speed;
      const speeds = c.actors.map(actor => Math.abs(actor.speed));
      const gap = c.gap - c.targetGap;
      // Metres, kilometres, or both sides divided by one participant's speed.
      const scales = [1, 1000, ...speeds.map(v => 1 / v)];
      const lengths = scales.flatMap(scale => [c.gap * scale, c.targetGap * scale, gap * scale]);
      if (c.leadMinutes) lengths.push(c.leadMinutes, c.leadMinutes / 60);
      const model = { closing, gap, speeds: [closing, ...speeds], scales, lengths };
      const read = scale => sides.map(side => parseSide(side, model, scale));
      const [left, right] = read(1);
      const slope = left.a - right.a;
      const initial = left.b - right.b;
      if (slope === 0) return reject(near(left.b, right.b)
        ? 'Это равенство выполняется при любом времени. Как выделить именно тот момент, о котором спрашивают?'
        : 'Здесь x исчезает или отсутствует. Свяжи время с путями участников.');
      const candidate = -initial / slope;
      if (!Number.isFinite(candidate) || candidate <= 0) return reject('Момент события должен наступить после начала отсчёта. Проверь направления и знак начального промежутка.');
      if (!near(candidate, c.answer)) {
        if (c.targetGap > 0) {
          const remaining = c.gap - (c.actors[0].speed - c.actors[1].speed) * candidate;
          if (near(remaining, -c.targetGap)) return reject('При таком времени группы уже прошли мимо друг друга. Между ними снова нужное расстояние. Для первого контакта западная группа ещё левее восточной.');
          if (near(remaining, 0)) return reject('Это время встречи. За один шаг до встречи рации уже работают. Какой промежуток останется, когда связь только появится?');
        }
        if (c.id === 'delay' && near(candidate, c.answer + c.leadMinutes / 60)) return reject('Так получается время в пути Лены. Проверь, сколько ехала каждая, если x отсчитывать от выезда Маши.');
        const wrongDirection = c.actors[1].speed < 0 ? 'Проверь, как меняется промежуток от движения каждого участника.' : 'Проверь, чей путь уменьшает промежуток, а чей увеличивает.';
        return reject(c.targetGap > 0 ? 'Проверь промежуток в конце. Какое расстояние должно остаться при первом радиоконтакте?' : c.id === 'delay' ? 'Проверь, где находилась Лена в момент выезда Маши, и как менялся отрыв дальше.' : wrongDirection);
      }
      // A pupil may also scale an already constructed path equation, e.g.
      // (12x+8x)/2 = 5. The velocity terms must still be supported independently.
      lengths.push(Math.abs(slope / closing) * gap);
      function showsModel([l, r]) {
        if (matches(l.time - r.time, initial)) return true;
        return matches(l.path - r.path, slope) && !near(l.explicit - r.explicit, 0) &&
          matches(l.distance - r.distance, initial);
      }
      if (!scales.some(scale => showsModel(read(scale)))) return reject(isEquation
        ? 'У этого уравнения верное решение. Чтобы показать модель, запиши, откуда взялись числа: используй пути участников или деление нужного расстояния на скорость сближения.'
        : 'Значение верное. Покажи в выражении, из какого расстояния и какой скорости оно получилось.');
      return { ok: true, message: isEquation ? 'Уравнение задаёт нужный момент. Теперь найди время.' : 'Выражение связывает расстояние и скорость. Теперь вычисли время.' };
    } catch (error) {
      return reject(error.message);
    }
  }
  return { cases, checkEquation, checkNumber, position };
});
