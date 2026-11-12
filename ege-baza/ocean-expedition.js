(function () {
  'use strict';

  // The chart coordinates match the panoramic illustration (1440 × 687).
  const width = 1040;
  const height = 496;
  const detailZoom = 3.35;
  const atlas = 'ocean-atlas.webp?v=20261112-dive';
  const regions = [
    {
      name: 'Поверхность океана', color: '#ffe6a9', label: [209, 32], places: [
        {
          name: 'Плавучая база', x: 126, y: 85, view: [90, 18],
          scene: 'Утреннее солнце освещает причал. Загрузи припасы, пока лодка у поверхности.',
          answer: 9,
          prompt: 'На лодку нужно погрузить 65 порций. В одной герметичной упаковке 8 порций. Сколько целых упаковок нужно взять?',
          hint: 'Сравни 8 × 8 с числом нужных порций.',
          explanation: 'В восьми упаковках 64 порции. Чтобы порций хватило, нужна девятая упаковка.'
        },
        {
          name: 'Мерный буй', x: 219, y: 78,
          scene: 'От базы тянется цепочка буёв. На первом проверяют единицы измерения перед спуском.',
          answer: 2400,
          prompt: 'От базы до последнего буя 2,4 км. Сколько это метров?',
          hint: 'В одном километре 1000 метров.',
          explanation: '2,4 × 1000 = 2400 м.'
        },
        {
          name: 'Журнал погружений', x: 320, y: 57,
          scene: 'На борту открыт журнал пробного спуска. В нём отмечена глубина в разные минуты.',
          answer: 19,
          prompt: 'На сколько метров глубина в 10:20 была больше, чем в 10:10?',
          table: [['Время', 'Глубина, м'], ['10:00', 12], ['10:10', 24], ['10:20', 43]],
          hint: 'Найди глубины в нужных строках и вычти меньшую из большей.',
          explanation: 'По журналу в 10:20 глубина была 43 м, а в 10:10 — 24 м. Разность 43 − 24 = 19 м.'
        }
      ]
    },
    {
      name: 'Коралловый риф', color: '#ffc5aa', label: [112, 133], places: [
        {
          name: 'Черепаший грот', x: 257, y: 163,
          scene: 'Черепаха проплывает над розовым рифом. Камера спускается вслед за ней к входу в грот.',
          answer: 10,
          prompt: 'Глубину камеры в метрах вычисляют по формуле d = 0,4t + 2, где t — время в секундах. На какой глубине камера через 20 секунд?',
          hint: 'Подставь 20 вместо t. Сначала выполни умножение.',
          explanation: '0,4 × 20 + 2 = 8 + 2 = 10 м.'
        },
        {
          name: 'Коралловый сад', x: 167, y: 199,
          scene: 'Между кораллами расчищают места для камеры. Рыбы уже собираются у нескольких из них.',
          answer: 3,
          prompt: 'Для съёмки наугад выбирают одну из 20 точек. Все точки равновероятны. Сейчас 7 точек подходят для наблюдения. Сколько из оставшихся точек нужно сделать подходящими, чтобы вероятность выбрать подходящую точку стала равна 1/2?',
          hint: 'Чтобы вероятность была равна 1/2, подходить должна половина всех точек.',
          explanation: 'Половина от 20 — это 10. Из них 7 уже подходят, остаётся 10 − 7 = 3 точки.'
        },
        {
          name: 'Развилка рифа', x: 76, y: 217,
          scene: 'У края рифа расходятся три тропы. Для каждой известны время и цена экскурсии.',
          answer: 22,
          prompt: 'Экскурсия должна длиться не меньше 30 минут. Сколько жетонов стоит самый дешёвый подходящий маршрут?',
          table: [['Маршрут', 'Время, мин', 'Цена, жетоны'], ['Короткий', 25, 18], ['Дальний', 35, 24], ['По гребню', 30, 22]],
          hint: 'Сначала исключи маршруты короче 30 минут. Затем сравни цены оставшихся.',
          explanation: 'Подходят дальний маршрут за 24 жетона и маршрут по гребню за 22. Дешевле маршрут за 22 жетона.'
        }
      ]
    },
    {
      name: 'Водоворот', color: '#97edff', label: [493, 69], places: [
        {
          name: 'Граница течений', x: 402, y: 124,
          scene: 'Вода закручивается над лодкой. Глубиномер записывает, с какой скоростью идёт спуск.',
          answer: 8,
          prompt: 'На прямолинейном участке графика глубина за 4 минуты увеличилась с 36 до 68 м. На сколько метров в минуту увеличивалась глубина?',
          hint: 'Раздели изменение глубины на время.',
          explanation: 'Глубина увеличилась на 68 − 36 = 32 м за 4 минуты. За минуту она увеличивалась на 32 : 4 = 8 м.'
        },
        {
          name: 'Светящийся косяк', x: 495, y: 133,
          scene: 'У кромки водоворота мелькают прозрачные рыбы. В журнале есть одна надёжная примета.',
          answer: 2,
          prompt: 'Все прозрачные рыбы в этом косяке светятся. Какой вывод обязательно верен? Введи номер.',
          choices: ['Все светящиеся рыбы прозрачные.', 'Если рыба не светится, она непрозрачная.', 'Ни одна светящаяся рыба не бывает прозрачной.'],
          hint: 'Представь прозрачную рыбу. Может ли она не светиться?',
          explanation: 'Любая прозрачная рыба светится. Поэтому рыба, которая не светится, не может быть прозрачной. Верен вывод №2.'
        },
        {
          name: 'Песчаная терраса', x: 540, y: 200,
          scene: 'Под быстрым течением лежит ровная терраса. На плане её очертания нанесены на сетку.',
          answer: 20,
          prompt: 'Сторона клетки равна 1 м. Найди площадь закрашенного участка в квадратных метрах.',
          grid: ['111100', '111100', '111111', '111111'],
          gridLabel: 'Сетка 6 на 4 клетки. Закрашены все клетки, кроме квадрата 2 на 2 в правом верхнем углу.',
          hint: 'Посчитай площадь всего прямоугольника и вычти площадь вырезанного угла.',
          explanation: 'В прямоугольнике 6 × 4 = 24 клетки. В вырезе 2 × 2 = 4 клетки. Площадь участка 24 − 4 = 20 м².'
        }
      ]
    },
    {
      name: 'Затонувшие корабли', color: '#ffd696', label: [217, 275], places: [
        {
          name: 'Карта фрегата', x: 228, y: 238,
          scene: 'Из песка выступает накренившийся фрегат. В архиве экспедиции сохранился его план.',
          answer: 36,
          prompt: 'На плане масштаба 1:200 длина корпуса корабля 18 см. Какова длина корабля в метрах?',
          hint: 'Один сантиметр на плане соответствует 200 см в действительности.',
          explanation: 'Длина корабля 18 × 200 = 3600 см, то есть 36 м.'
        },
        {
          name: 'Грузовой трюм', x: 126, y: 322,
          scene: 'За иллюминатором виден старый прямоугольный ящик. Водолазы измерили его изнутри.',
          answer: 120,
          prompt: 'Внутренние размеры прямоугольного ящика 60 см, 40 см и 50 см. Какова его вместимость в литрах?',
          hint: 'Умножь три размера. В одном литре 1000 см³.',
          explanation: '60 × 40 × 50 = 120 000 см³, или 120 л.'
        },
        {
          name: 'Мачта фрегата', x: 282, y: 371,
          scene: 'Сохранившуюся вертикальную мачту хотят закрепить тросом от палубы.',
          answer: 13,
          prompt: 'Трос соединяет точку на горизонтальной палубе с точкой на вертикальной мачте в 12 м над палубой. На палубе от основания мачты до крепления троса 5 м. Какова длина троса в метрах?',
          hint: 'Трос — гипотенуза прямоугольного треугольника с катетами 5 м и 12 м.',
          explanation: 'По теореме Пифагора длина троса равна √(5² + 12²) = √169 = 13 м.'
        }
      ]
    },
    {
      name: 'Атлантида', color: '#a3f3cd', label: [683, 159], places: [
        {
          name: 'Купол Атлантиды', x: 594, y: 170,
          scene: 'Над колоннами поднимаются два купола. Их радиусы подсказывают, как сравнить объёмы.',
          answer: 8,
          prompt: 'Два купола имеют форму полушарий. Радиус большего в два раза больше радиуса меньшего. Во сколько раз больше объём большего купола?',
          hint: 'Объём подобных тел меняется в куб коэффициента подобия.',
          explanation: 'Радиус увеличили в 2 раза. Объём увеличился в 2³ = 8 раз.'
        },
        {
          name: 'Зал мерных чаш', x: 663, y: 247,
          scene: 'За каменной аркой стоят мерные чаши. В одной из них осталось немного воды.',
          answer: 0.55,
          prompt: 'В чаше было 3/4 л воды. Из неё вылили 1/5 л. Сколько литров осталось? Запиши ответ десятичной дробью.',
          hint: 'Приведи дроби 3/4 и 1/5 к знаменателю 20.',
          explanation: '3/4 − 1/5 = 15/20 − 4/20 = 11/20 = 0,55 л.'
        },
        {
          name: 'Мозаика Атлантиды', x: 749, y: 232,
          scene: 'Перед светящимися воротами из-под ила проступает узор. Видна только часть плиток.',
          answer: 70,
          prompt: 'После чистки видно 60% мозаики Атлантиды. Это 42 плитки. Сколько плиток во всей мозаике?',
          hint: 'Запиши 60% десятичной дробью. Раздели число видимых плиток на эту дробь.',
          explanation: 'Если 0,6 от числа плиток равно 42, то всего плиток 42 : 0,6 = 70.'
        }
      ]
    },
    {
      name: 'Логово чудовищ', color: '#e6cbff', label: [897, 83], places: [
        {
          name: 'След морского змея', x: 860, y: 137, view: [959, 96],
          scene: 'В дальней пещере мелькнул морской змей. На камне осталась светящаяся надпись.',
          answer: 16,
          prompt: 'На камне выбито выражение √64 + 2³. Найди его значение.',
          hint: 'Сначала найди квадратный корень из 64 и куб двойки.',
          explanation: '√64 = 8 и 2³ = 8. Значит, сумма равна 16.'
        },
        {
          name: 'Камера эха', x: 978, y: 166,
          scene: 'Среди фиолетовых медуз звук отражается от стен грота. По эху можно узнать время.',
          answer: 7,
          prompt: 'У логова чудовищ лодка поймала эхо. Компьютер записал уравнение 3x + 8 = 29, где x — время прихода эха в секундах. Через сколько секунд пришло эхо?',
          hint: 'Вычти 8 из обеих частей уравнения, затем раздели обе части на 3.',
          explanation: 'Из 3x + 8 = 29 получаем 3x = 21 и x = 7.'
        },
        {
          name: 'Подводный разлом', x: 940, y: 251,
          scene: 'Лодка подходит к выходу из пещеры. Метки на скале отсчитывают от уровня лодки.',
          answer: -2,
          prompt: 'Для прохода подходит метка x, удовлетворяющая условию −5 < x ≤ 1. Какая из четырёх меток подходит: −5, −2, 2 или 5?',
          hint: 'Подходящее число должно быть строго больше −5 и не больше 1.',
          explanation: '−5 исключаем из-за строгого неравенства. 2 и 5 больше 1. Подходит −2.'
        }
      ]
    },
    {
      name: 'Марианская впадина', color: '#baf4b4', label: [895, 291], places: [
        {
          name: 'Зонд у кромки', x: 800, y: 325,
          scene: 'На краю впадины экспедиция переходит в батискаф. Для запуска зонда нужен код.',
          answer: 3,
          prompt: 'Код зонда — трёхзначное число 4□2, которое делится на 9. Какую цифру нужно вписать вместо квадрата?',
          hint: 'Чтобы число делилось на 9, сумма его цифр должна делиться на 9.',
          explanation: 'У известных цифр сумма 4 + 2 = 6. Не хватает цифры 3, чтобы получить сумму 9.'
        },
        {
          name: 'Спуск батискафа', x: 690, y: 386, view: [942, 375],
          scene: 'В темноте мерцает сигнал зонда. Он поднимается навстречу спускающемуся батискафу.',
          answer: 12,
          prompt: 'Батискаф с глубины 6000 м спускается на 30 м/мин, а зонд с глубины 6600 м поднимается на 20 м/мин. Через сколько минут они окажутся на одной глубине?',
          hint: 'На сколько метров уменьшается разность глубин за одну минуту?',
          explanation: 'Между батискафом и зондом 600 м по вертикали. Разность глубин уменьшается на 30 + 20 = 50 м в минуту, поэтому они окажутся на одной глубине через 600 : 50 = 12 минут.'
        },
        {
          name: 'Сад чёрных курильщиков', x: 875, y: 445,
          scene: 'У дна поднимаются струи горячей воды. На каменной гряде прокладывают ряд фонарей.',
          answer: 15,
          prompt: 'В первом ряду 8 фонарей, между соседними фонарями 6 м. Во втором ряду такой же длины фонари будут через 3 м. Сколько фонарей во втором ряду, если они стоят на обоих концах?',
          hint: 'Между восемью фонарями семь промежутков. Найди длину ряда, затем посчитай новые промежутки.',
          explanation: 'Длина ряда 7 × 6 = 42 м. Во втором ряду 42 : 3 = 14 промежутков и на один фонарь больше — 15.'
        }
      ]
    }
  ];

  const waypoints = regions.flatMap((region, index) => region.places.map(place => ({
    ...place, region, deep: index === regions.length - 1
  }))).map((point, index) => ({ ...point, index }));
  const escape = value => String(value).replace(/[&<>"']/g, char => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]
  ));
  const coordinates = (x, y) => '--x:' + x / width * 100 + '%;--y:' + y / height * 100 + '%';
  const markerStyle = place => coordinates(place.x, place.y) + ';--ocean-accent:' + place.region.color;
  const detailCenter = place => place.view || [place.x, place.y];
  const detailStyle = place => coordinates(...detailCenter(place)) + ';--ocean-accent:' + place.region.color;

  let selected = 0;
  let motionChoice;

  function markup(tasks) {
    if (tasks.length !== waypoints.length || tasks.some((task, index) => task.pos !== index + 1)) return '';
    const place = waypoints[selected];
    return `<section class="ocean-expedition" aria-labelledby="ocean-expedition-title" style="--ocean-detail-size:${detailZoom * 100}%">
      <div class="ocean-expedition-header">
        <div><h2 id="ocean-expedition-title">Подводная экспедиция</h2><p>Выбери точку погружения и открой один из 21 номеров ЕГЭ.</p></div>
        <button class="ocean-expedition-motion" type="button" hidden>
          <span class="ocean-expedition-motion-label">Пауза анимации</span>
          <span class="ocean-expedition-motion-icon" aria-hidden="true"></span>
        </button>
      </div>
      <div class="ocean-expedition-chart">
        <img class="ocean-expedition-atlas" src="${atlas}" width="1440" height="687" alt="" decoding="async">
        <canvas aria-hidden="true"></canvas>
        <div class="ocean-expedition-regions" aria-hidden="true">
          ${regions.map(region => `<span style="${coordinates(...region.label)};--ocean-accent:${region.color}"
            data-current="${region === place.region}">${region.name}</span>`).join('')}
        </div>
        <div class="ocean-expedition-pins" role="group" aria-label="Точки погружения №1–21">
          ${waypoints.map((point, index) => `<button type="button" class="ocean-expedition-pin"
            style="${markerStyle(point)}" data-ocean-point="${index}" aria-pressed="${index === selected}"
            tabindex="${index === selected ? 0 : -1}" aria-label="№${index + 1} · ${point.name} · ${escape(tasks[index].title)}">
            <span aria-hidden="true">${index + 1}</span>
          </button>`).join('')}
        </div>
        <span class="ocean-expedition-mobile-pin" aria-hidden="true" style="${markerStyle(place)}">${selected + 1}</span>
      </div>
      <div class="ocean-expedition-controls">
        <label class="ocean-expedition-select">Точка погружения
          <select>
            ${regions.map(region => `<optgroup label="${region.name}">
              ${waypoints.filter(point => point.region === region).map(({ index, name }) => `<option value="${index}"
                ${index === selected ? 'selected' : ''}>№${index + 1} · ${name}</option>`).join('')}
            </optgroup>`).join('')}
          </select>
        </label>
        <div class="ocean-expedition-step" role="group" aria-label="По порядку">
          <button type="button" data-ocean-step="-1" aria-label="Предыдущая точка">←</button>
          <button type="button" data-ocean-step="1" aria-label="Следующая точка">→</button>
        </div>
      </div>
      <div class="ocean-expedition-info">
        <div class="ocean-expedition-scene" aria-hidden="true" style="${detailStyle(place)}"><canvas></canvas></div>
        <div class="ocean-expedition-info-copy">${waypointMarkup(tasks, selected)}</div>
      </div>
      <span class="ocean-expedition-announcement" role="status"></span>
    </section>`;
  }

  function missionVisual(place) {
    if (place.table) {
      const [head, ...rows] = place.table;
      return `<table class="ocean-expedition-table"><thead><tr>${head.map(cell => `<th scope="col">${cell}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(([label, ...cells]) => `<tr><th scope="row">${label}</th>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    }
    if (place.choices) {
      return `<ol class="ocean-expedition-choices">${place.choices.map(choice => `<li>${choice}</li>`).join('')}</ol>`;
    }
    if (place.grid) {
      return `<div class="ocean-expedition-grid" role="img" aria-label="${place.gridLabel}">
        ${[...place.grid.join('')].map(cell => `<span data-filled="${cell}" aria-hidden="true"></span>`).join('')}
      </div>`;
    }
    return '';
  }

  function waypointMarkup(tasks, index) {
    const place = waypoints[index];
    const task = tasks[index];
    const progress = Number.isInteger(task.independent)
      ? `<p class="ocean-expedition-progress">Самостоятельно решено тем: ${task.independent} из ${task.total}</p>`
      : '';
    return `<div class="ocean-expedition-station" style="--ocean-accent:${place.region.color}">
      <p class="ocean-expedition-region">${place.region.name} <span aria-hidden="true">·</span> <span class="ocean-expedition-craft">${place.deep ? 'Батискаф' : 'Подводная лодка'}</span></p>
      <h3>${place.name}</h3><p class="ocean-expedition-description">${place.scene}</p>
      <a class="ocean-expedition-task" href="${escape(task.href)}" aria-label="Открыть задание №${task.pos} · ${escape(task.title)}">
        <span class="ocean-expedition-task-number">№${task.pos}</span><span>${escape(task.title)}</span><span aria-hidden="true">↗</span>
      </a>
      ${progress}
    </div>
    <details class="ocean-expedition-mission">
      <summary>Задача экспедиции <span>№${task.pos}</span></summary>
      <p id="ocean-expedition-mission-prompt">${place.prompt}</p>
      ${missionVisual(place)}
      <form data-ocean-mission>
        <label>Ответ <input name="answer" inputmode="${place.answer < 0 ? 'text' : 'decimal'}" autocomplete="off" aria-describedby="ocean-expedition-mission-prompt"></label>
        <button type="submit">Проверить</button>
      </form>
      <p role="status" data-ocean-mission-feedback></p>
    </details>`;
  }

  function mount(main, tasks) {
    const section = main.querySelector('.ocean-expedition');
    if (!section) return () => {};
    const chart = section.querySelector('.ocean-expedition-chart');
    const canvas = chart.querySelector('canvas');
    const image = chart.querySelector('img');
    const context = craft && typeof CanvasRenderingContext2D === 'function' ? canvas.getContext('2d') : null;
    const pins = [...section.querySelectorAll('[data-ocean-point]')];
    const regionLabels = [...section.querySelectorAll('.ocean-expedition-regions span')];
    const mobilePin = section.querySelector('.ocean-expedition-mobile-pin');
    const info = section.querySelector('.ocean-expedition-info');
    const detail = info.querySelector('.ocean-expedition-scene');
    const detailCanvas = detail.querySelector('canvas');
    const copy = info.querySelector('.ocean-expedition-info-copy');
    const drawEnvironment = context && globalThis.EgeBazaOceanMotion?.create(image, width, height);
    const detailContext = drawEnvironment && detailCanvas.getContext('2d');
    const announcement = section.querySelector('.ocean-expedition-announcement');
    const motion = section.querySelector('.ocean-expedition-motion');
    const motionLabel = motion.querySelector('.ocean-expedition-motion-label');
    const selector = section.querySelector('select');
    const previous = section.querySelector('[data-ocean-step="-1"]');
    const next = section.querySelector('[data-ocean-step="1"]');
    const preference = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    const paused = () => motionChoice ?? preference?.matches ?? false;
    const listeners = new AbortController();
    const options = { signal: listeners.signal };
    let position = craftPosition(waypoints[selected]);
    let animation = 0;
    let lastTime = 0;
    let time = 0;
    let chartVisible = true;
    let detailVisible = Boolean(detailContext);

    function updateMotionControl(isPaused) {
      const state = String(isPaused);
      if (motion.dataset.paused === state) return;
      motion.dataset.paused = state;
      motionLabel.textContent = isPaused ? 'Включить анимацию' : 'Пауза анимации';
      motion.title = motionLabel.textContent;
    }

    function paint(now, refresh = false) {
      animation = 0;
      const showChart = context && canvas.width && canvas.height && (chartVisible || refresh);
      const showDetail = detailContext && detailCanvas.width && detailCanvas.height && (detailVisible || refresh);
      if (!showChart && !showDetail) return;
      const dt = lastTime ? Math.min(40, now - lastTime) : 0;
      lastTime = now;
      const playing = !paused();
      updateMotionControl(!playing);
      if (playing) time += dt / 1000;
      const point = waypoints[selected];
      const target = craftPosition(point);
      const speed = playing ? 1 - Math.exp(-dt / 190) : 1;
      position = position.map((value, index) => value + (target[index] - value) * speed);
      const environment = drawEnvironment?.(time);
      if (showChart) {
        context.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
        context.clearRect(0, 0, width, height);
        if (environment) context.drawImage(environment, 0, 0);
        drawRoute(context, time, position, point);
      }
      if (showDetail) paintDetail(detailContext, detailCanvas, environment, point);
      if (playing && (chartVisible || detailVisible) && !document.hidden) animation = requestAnimationFrame(paint);
    }

    function refreshMotion() {
      if (!context) return;
      cancelAnimationFrame(animation);
      lastTime = 0;
      paint(performance.now(), true);
    }

    function resize() {
      const scale = Math.min(devicePixelRatio || 1, 2);
      for (const surface of detailContext ? [canvas, detailCanvas] : [canvas]) {
        const w = Math.round(surface.clientWidth * scale);
        const h = Math.round(surface.clientHeight * scale);
        if (w !== surface.width || h !== surface.height) {
          surface.width = w;
          surface.height = h;
        }
      }
      refreshMotion();
    }

    function updateControls() {
      const place = waypoints[selected];
      for (const [index, pin] of pins.entries()) {
        pin.setAttribute('aria-pressed', String(index === selected));
        pin.tabIndex = index === selected ? 0 : -1;
      }
      for (const [index, label] of regionLabels.entries()) label.dataset.current = String(regions[index] === place.region);
      mobilePin.style.cssText = markerStyle(place);
      mobilePin.textContent = selected + 1;
      selector.value = selected;
      previous.setAttribute('aria-disabled', String(selected === 0));
      next.setAttribute('aria-disabled', String(selected === waypoints.length - 1));
    }

    function choose(index) {
      if (index === selected || !waypoints[index]) return;
      selected = index;
      updateControls();
      detail.style.cssText = detailStyle(waypoints[selected]);
      copy.innerHTML = waypointMarkup(tasks, selected);
      announcement.textContent = '№' + tasks[index].pos + ' · ' + waypoints[index].name + ' · ' + tasks[index].title;
      if (paused() || !animation) refreshMotion();
    }

    for (const pin of pins) pin.addEventListener('click', () => choose(Number(pin.dataset.oceanPoint)), options);
    const keys = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };
    section.querySelector('.ocean-expedition-pins').addEventListener('keydown', event => {
      let index;
      if (event.key === 'Home') index = 0;
      else if (event.key === 'End') index = waypoints.length - 1;
      else if (Object.hasOwn(keys, event.key)) index = selected + keys[event.key];
      else return;
      event.preventDefault();
      if (!waypoints[index]) return;
      choose(index);
      pins[index].focus();
    }, options);
    for (const step of [previous, next]) step.addEventListener('click', () => choose(selected + Number(step.dataset.oceanStep)), options);
    selector.addEventListener('change', () => choose(Number(selector.value)), options);
    info.addEventListener('submit', event => {
      if (!event.target.matches('[data-ocean-mission]')) return;
      event.preventDefault();
      const { answer, hint, explanation } = waypoints[selected];
      const raw = event.target.elements.answer.value.trim().replace(/^−/, '-').replace(',', '.');
      const feedback = info.querySelector('[data-ocean-mission-feedback]');
      const valid = /^[+-]?\d+(?:\.\d+)?$/.test(raw);
      const correct = valid && Number(raw) === answer;
      feedback.dataset.result = correct ? 'correct' : 'retry';
      feedback.textContent = correct ? 'Верно. ' + explanation : valid ? hint : 'Введи число в поле «Ответ».';
    }, options);
    motion.addEventListener('click', () => { motionChoice = !paused(); refreshMotion(); }, options);
    preference?.addEventListener?.('change', () => { motionChoice = undefined; refreshMotion(); }, options);
    document.addEventListener('visibilitychange', refreshMotion, options);
    updateControls();

    const sizeObserver = context && typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    const viewObserver = context && typeof IntersectionObserver === 'function'
      ? new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.target === chart) chartVisible = entry.isIntersecting;
          else detailVisible = entry.isIntersecting;
        }
        refreshMotion();
      })
      : null;
    if (context) {
      motion.hidden = false;
      for (const surface of detailContext ? [chart, detail] : [chart]) {
        sizeObserver?.observe(surface);
        viewObserver?.observe(surface);
      }
      if (!sizeObserver) window.addEventListener('resize', resize, options);
      image.addEventListener('load', refreshMotion, { ...options, once: true });
      resize();
    }
    return () => {
      listeners.abort();
      sizeObserver?.disconnect();
      viewObserver?.disconnect();
      if (animation) cancelAnimationFrame(animation);
    };
  }

  function paintDetail(ctx, surface, environment, point) {
    const [x, y] = detailCenter(point);
    const sourceWidth = width / detailZoom;
    const sourceHeight = sourceWidth * surface.height / surface.width;
    const left = (width - sourceWidth) * x / width;
    const top = (height - sourceHeight) * y / height;
    ctx.clearRect(0, 0, surface.width, surface.height);
    ctx.drawImage(environment, left, top, sourceWidth, sourceHeight, 0, 0, surface.width, surface.height);
  }

  function craftPosition(point) {
    return [Math.max(60, point.x - 52), point.y + (point.y > 395 ? -35 : 39), Number(point.deep)];
  }

  const path = shape => new Path2D(shape);
  const craft = typeof Path2D === 'function' ? {
    submarine: path('M-40 3 Q-32-13-8-16 L18-15 Q34-15 41-5 Q49 3 41 11 Q33 19 11 19 H-13 Q-35 17-40 7 Z'),
    face: path('M-4 4 Q0 1 4 4 L6 9 H-6 Z'),
    hair: path('M-4-2 Q-6-7 0-7 Q6-7 4-1 Q3-5 1-4 Q-2-2-4-2 Z'),
    subBeam: path('M39-5 L138-23 L145 43 L39 11 Z'),
    subTail: path('M-40-4 L-54-11 L-54 14 L-39 9 Z'),
    subShade: path('M-35 10 Q-21 13 7 12 Q30 10 39 4 Q37 17 11 19 H-13 Q-29 18-35 10 Z'),
    subBridge: path('M-16-15 V-22 Q-15-26-10-26 H7 Q12-26 12-22 V-15 Z'),
    bathBeam: path('M10-3 L89 0 L86 50 L10 6 Z')
  } : null;

  function fill(ctx, color, shape) {
    ctx.fillStyle = color;
    ctx.fill(shape);
  }

  function ellipse(ctx, x, y, rx, ry, color) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function line(ctx, color, lineWidth, points) {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (const point of points.slice(1)) ctx.lineTo(...point);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  function pilot(ctx, x, y, radius) {
    ellipse(ctx, x, y, radius + 2.7, radius + 2.7, '#85583c');
    ellipse(ctx, x, y, radius, radius, '#233d55');
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(radius / 10, radius / 10);
    fill(ctx, '#65b4c2', craft.face);
    ellipse(ctx, 0, -2, 4, 5, '#f1b888');
    fill(ctx, '#694d58', craft.hair);
    ellipse(ctx, -4.5, -6, 1.25, 1.25, '#9fdee5');
    ctx.restore();
  }

  function vessel(ctx, position, time) {
    const [x, baseY, deployment] = position;
    const y = baseY + Math.sin(time * 2.1) * 3;
    const subX = x - 36 * deployment;
    const subY = y - 62 * deployment;
    const bathX = x - 7 + 25 * deployment;
    const bathY = y + 25 - 11 * deployment;
    ctx.beginPath();
    ctx.moveTo(subX - 8, subY + 13);
    ctx.quadraticCurveTo(subX - 1, bathY + 4, bathX, bathY);
    ctx.strokeStyle = '#9ac5c7';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.save();
    ctx.translate(subX, subY);
    const beam = ctx.createLinearGradient(41, 0, 131, 11);
    beam.addColorStop(0, 'rgba(255,235,162,.46)');
    beam.addColorStop(1, 'rgba(255,235,162,0)');
    fill(ctx, beam, craft.subBeam);
    fill(ctx, '#ac7049', craft.subTail);
    fill(ctx, '#ffdc92', craft.submarine);
    fill(ctx, '#d09058', craft.subShade);
    fill(ctx, '#ffdc92', craft.subBridge);
    line(ctx, '#f4bb71', 3, [[-4, -26], [-4, -37], [4, -37]]);
    ellipse(ctx, -18, 0, 5, 5, '#3e5869');
    if (deployment < .55) pilot(ctx, 12, 0, 10);
    else ellipse(ctx, 12, 0, 10, 10, '#526979');
    ellipse(ctx, 40, 1, 3, 4, '#fff7cb');
    ctx.restore();

    ctx.save();
    ctx.translate(bathX, bathY);
    const bathBeam = ctx.createLinearGradient(10, 1, 85, 25);
    bathBeam.addColorStop(0, 'rgba(171,242,239,.43)');
    bathBeam.addColorStop(1, 'rgba(171,242,239,0)');
    fill(ctx, bathBeam, craft.bathBeam);
    ellipse(ctx, 0, 0, 15, 12, '#d7a66f');
    if (deployment >= .55) pilot(ctx, 2, 0, 8);
    else ellipse(ctx, 2, 0, 7, 6, '#476377');
    ellipse(ctx, 14, 1, 3, 3, '#e6ffed');
    line(ctx, '#edbf83', 2, [[-9, 11], [-11, 15], [11, 15]]);
    ctx.restore();
  }

  const route = waypoints.map(point => [point.x, point.y]);
  function drawRoute(ctx, time, position, point) {
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    line(ctx, '#061e36a8', 5, route);
    ctx.setLineDash([3, 9]);
    line(ctx, '#f1fafaab', 2.3, route);
    ctx.restore();
    for (const waypoint of waypoints) {
      ellipse(ctx, waypoint.x, waypoint.y, 4.5, 4.5, waypoint.region.color);
    }

    const glow = ctx.createRadialGradient(point.x, point.y, 14, point.x, point.y, 53);
    glow.addColorStop(0, point.region.color + '65');
    glow.addColorStop(1, point.region.color + '00');
    ellipse(ctx, point.x, point.y, 53, 53, glow);

    const [x, y, dive] = position;
    for (let index = 0; index < 7; index++) {
      const rise = (time * (20 + index % 3 * 5) + index * 11) % 70;
      const bubbleX = x - 21 + dive * 36 + 7 * Math.sin(index + rise / 13);
      const bubbleY = y - 13 + dive * 20 - rise;
      const size = 1.4 + index % 3;
      ellipse(ctx, bubbleX, bubbleY, size, size, '#c7fbf87a');
    }
    vessel(ctx, position, time);
  }

  globalThis.EgeBazaOceanExpedition = Object.freeze({ markup, mount });
})();
