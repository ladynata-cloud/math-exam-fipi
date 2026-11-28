'use strict';

(() => {
  const host = document.getElementById('workshop-play');
  const places = window.ArzhenikovLife?.places;
  if (!host || !places?.length) return;

  const key = 'mathexam.arzhenikov.workshop.v1';
  const seriesLength = 3;
  const rewards = {
    picnic: {
      title: 'Пикник готов!', postcard: 'Дружный пикник', thanks: ['Яблоки поделены, бутерброды упакованы, кружки приготовлены.', 'Мандарины поделены, ягоды собраны в баночки, ложки на столиках.'],
      payoffs: ['У всех друзей есть яблоки для пикника.', 'Бутерброды упакованы — можно отправляться в дорогу.', 'Кружки готовы для общего чаепития.', 'У обеих компаний одинаковое угощение.', 'Баночки с ягодами готовы стать гостинцами.', 'На каждом столике есть ложки к чаю.']
    },
    yard: {
      title: 'Двор готов к игре!', postcard: 'Двор играет', thanks: ['Мелки поделены, ворота собраны, кольца ждут игроков.', 'Мячи у команд, призы в конвертах, вёдра в песочницах.'],
      payoffs: ['У команд поровну мелков для рисунков.', 'Ворота готовы к тренировке.', 'Кольца ждут игроков у каждой стойки.', 'Команды начнут эстафету с равными запасами.', 'Призовые конверты готовы для победителей.', 'В обеих песочницах можно строить крепости.']
    },
    classroom: {
      title: 'Класс готов к работе!', postcard: 'Класс друзей', thanks: ['Карандаши и книги на столах, рисунки упакованы для выставки.', 'Листы поделены, магниты собраны, загадки в конвертах.'],
      payoffs: ['За каждым столом поровну карандашей для художников.', 'Рисунки упакованы для выставки.', 'У всех читателей есть книги.', 'Обе команды могут начинать школьную газету.', 'Рисунки можно закрепить на доске.', 'Карточки с загадками готовы к викторине.']
    },
    atelier: {
      title: 'Мастерская ожила!', postcard: 'Мастерская чудес', thanks: ['Бусины поделены, колёса для машинок собраны, открытки украшены.', 'Ленты поделены, свечи упакованы, гирлянды готовы.'],
      payoffs: ['У обоих друзей поровну бусин для подвесок.', 'У собранных машинок есть все колёса.', 'Открытки украшены для именинников.', 'У каждого мастера поровну лент для закладок.', 'Подарочные коробки со свечами готовы.', 'Гирлянды украшают мастерскую.']
    },
    kitchen: {
      title: 'На кухне всё готово!', postcard: 'Уютная кухня', thanks: ['Сырники поделены, овощи подготовлены, печенье ждёт гостей.', 'Груши поделены, тосты собраны, пирожные украшены.'],
      payoffs: ['Завтрак поделен поровну — никому не досталось меньше.', 'Овощи для каждого котелка подготовлены.', 'На обоих столах есть печенье к чаю.', 'Для каждого кувшина приготовлено поровну груш.', 'Тосты собраны для полдника.', 'Все пирожные украшены ягодами.']
    },
    garden: {
      title: 'Сад стал ещё уютнее!', postcard: 'Цветущий сад', thanks: ['Подсолнухи и тюльпаны посажены, букетики для ярмарки собраны.', 'Персики поделены, морковь собрана, ростки на грядках.'],
      payoffs: ['По обе стороны крыльца поровну подсолнухов.', 'Букетики готовы к школьной ярмарке.', 'Тюльпаны посажены вдоль дорожки.', 'Оба соседа получат поровну персиков.', 'Морковь собрана в сетки для столовой.', 'На каждой грядке подрастают ростки.']
    },
    theatre: {
      title: 'Можно поднимать занавес!', postcard: 'Наш спектакль', thanks: ['Билеты поделены, пуговицы для жилетов собраны, стулья ждут зрителей.', 'Цветы поделены, куклам нашлись роли, вход украшен шарами.'],
      payoffs: ['Каждый класс получил поровну билетов.', 'Для готовых жилетов собраны все пуговицы.', 'Стулья ждут зрителей в зале.', 'У обоих артистов одинаковые букеты.', 'У каждой куклы теперь есть роль.', 'Воздушные шары украшают обе арки.']
    },
    trip: {
      title: 'Друзья готовы к походу!', postcard: 'Вместе в поход', thanks: ['Фонарики поделены, батарейки собраны, ложки на местах.', 'Открытки поделены, припасы упакованы, карты у команд.'],
      payoffs: ['У каждой дежурной смены поровну фонариков.', 'Для собранных раций хватает батареек.', 'В каждой палатке есть ложки для обеда.', 'У каждого друга поровну открыток на память.', 'Припасы уложены в полные рюкзаки.', 'У обеих команд есть карты для своего пути.']
    }
  };
  const stages = ['layout', 'answer', 'practice-done', 'notation', 'notation-done', 'complete'];
  const newRun = (round = 0) => ({
    round, step: 0, stage: 'layout', piles: [], moves: [], solved: [], answer: '', hint: false
  });
  const fresh = () => ({active: places[0].id, completed: [], runs: {}});
  const findPlace = id => places.find(place => place.id === id);
  let state = fresh();
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && findPlace(saved.active) && Array.isArray(saved.completed) && saved.runs && typeof saved.runs === 'object') state = saved;
  } catch { /* The workshop also works for the current tab. */ }

  const storyId = (place, index) => place.id + '/' + index;
  const storyKinds = new Map();
  for (const place of places) place.scenes.forEach((scene, index) => storyKinds.set(storyId(place, index), scene.kind));
  const answered = new Set();
  if (Array.isArray(state.answeredStories)) {
    for (const id of state.answeredStories) if (storyKinds.has(id)) answered.add(id);
  } else {
    for (const place of places) {
      const run = state.runs[place.id];
      const finished = state.completed.includes(place.id);
      // The old format marked a place only at the end of its first series.
      if (finished) {
        for (let i = 0; i < seriesLength; i++) answered.add(storyId(place, i));
      }
      if (!run || !Number.isInteger(run.round) || run.round < 0 || !Array.isArray(run.solved)) continue;
      const offset = run.round * seriesLength;
      if (offset + seriesLength > place.scenes.length) continue;
      // Returning to an unfinished first series implies a full cycle of replays.
      if (finished && run.round === 0 && run.stage !== 'complete' && stages.includes(run.stage)) {
        place.scenes.forEach((_, i) => answered.add(storyId(place, i)));
      }
      run.solved.slice(0, seriesLength).forEach((piles, i) => {
        const scene = place.scenes[offset + i];
        if (Array.isArray(piles) && piles.length === scene.targets.length &&
            piles.every(n => Number.isInteger(n) && n >= 0) && remaining(scene, piles) === 0 && !validateLayout(scene, piles)) {
          answered.add(storyId(place, offset + i));
        }
      });
    }
  }
  function solvedCount(place) {
    return place.scenes.filter((_, index) => answered.has(storyId(place, index))).length;
  }
  function hasUnfinishedRun(place) {
    const run = state.runs[place.id];
    return Boolean(run && stages.includes(run.stage) && run.stage !== 'complete');
  }
  function nextPlace() {
    const index = places.findIndex(place => place.id === state.active);
    const following = places.slice(index + 1).concat(places.slice(0, index + 1));
    return following.find(place => !state.completed.includes(place.id)) ||
      following.find(hasUnfinishedRun) ||
      following.find(place => solvedCount(place) < place.scenes.length);
  }
  window.ArzhenikovWorkshopProgress = () => {
    const skills = {share: 0, pack: 0, count: 0};
    for (const id of answered) skills[storyKinds.get(id)]++;
    const run = state.runs[state.active] || newRun();
    return {
      active: state.active, completed: [...state.completed], skills,
      storyCount: answered.size, storyTotal: storyKinds.size,
      placeCounts: Object.fromEntries(places.map(place => [place.id, {solved: solvedCount(place), total: place.scenes.length}])),
      postcards: Object.fromEntries(places.map(place => [place.id, rewards[place.id]?.postcard || place.name])),
      currentRun: {stage: run.stage, step: run.step, round: run.round},
      nextPlace: nextPlace()?.id || null
    };
  };
  function announceProgress() { window.dispatchEvent(new Event('workshop-progress')); }
  function finishRender() {
    window.dispatchEvent(new CustomEvent('workshop-render', {detail: window.ArzhenikovWorkshopProgress()}));
  }
  function save() {
    state.answeredStories = [...answered];
    try { localStorage.setItem(key, JSON.stringify(state)); }
    catch {
      const status = document.getElementById('storage');
      if (status) status.textContent = 'В этой вкладке можно продолжать занятие. Сохранение после закрытия недоступно.';
    }
  }
  function element(tag, className, text) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  }
  function action(text, name, fn, className) {
    const button = element('button', className, text);
    button.type = 'button';
    button.dataset.action = name;
    button.addEventListener('click', fn);
    return button;
  }
  function link(text, hash) {
    const a = element('a', 'ws-link', text);
    a.href = '#' + hash;
    return a;
  }
  function icons(symbol, count) {
    const wrap = element('span', 'ws-tokens');
    wrap.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < count; i++) {
      const token = element('span', 'ws-token', symbol);
      window.ArzhenikovArt?.decorate(token, symbol);
      wrap.append(token);
    }
    return wrap;
  }
  function currentPlace() {
    const hash = location.hash;
    if (hash === '' || hash === '#workshop') return findPlace(state.active);
    if (hash.startsWith('#workshop-')) return findPlace(hash.slice('#workshop-'.length));
  }
  function remaining(scene, piles) {
    return scene.total - piles.reduce((sum, n) => sum + n, 0);
  }
  // A pack is a group of fixed size, not a distribution across all offered places.
  function packGuidance(scene, piles) {
    const left = remaining(scene, piles);
    const name = i => '«' + scene.targets[i] + '»';
    const over = piles.findIndex(n => n > scene.size);
    const partial = piles.map((n,i) => ({n,i})).filter(p => p.n > 0 && p.n < scene.size);
    if (over >= 0) return 'На карточке ' + name(over) + ' предметов больше, чем нужно: ' + piles[over] + ' вместо ' + scene.size + '. Нажми там «Забрать», чтобы вернуть лишнее на стол.';
    if (left === 0 && partial.length > 1) {
      const receiver = partial.reduce((a,b) => b.n > a.n ? b : a);
      const donor = partial.find(p => p.i !== receiver.i);
      return 'На карточке ' + name(receiver.i) + ' сейчас ' + receiver.n + ' из ' + scene.size + '. Нажми «Забрать» на карточке ' + name(donor.i) + ', затем «+» на карточке ' + name(receiver.i) + '. Пустая карточка не ошибка.';
    }
    if (left === 0 && !partial.length) return 'Все предметы собраны в полные группы. Нажми «Проверить раскладку».';
    if (partial.length && left > 0) {
      const p = partial.reduce((a,b) => b.n > a.n ? b : a);
      return 'Дополни карточку ' + name(p.i) + ': сейчас ' + p.n + ' из ' + scene.size + '. Нажимай «+» на ней, пока группа не станет полной.';
    }
    if (left > 0) {
      const empty = piles.indexOf(0);
      if (empty >= 0) return 'Собери ' + (left === scene.total ? 'первую' : 'следующую') + ' группу: нажимай «+» на карточке ' + name(empty) + ', пока в ней не будет ' + scene.size + ' предметов.';
    }
    return 'Собери полные группы: на каждой занятой карточке должно быть ' + scene.size + ' предметов, а остальные могут быть пустыми.';
  }
  function validateLayout(scene, piles) {
    if (scene.kind === 'pack') {
      return remaining(scene, piles) === 0 && piles.every(n => n === 0 || n === scene.size)
        ? '' : packGuidance(scene, piles);
    }
    if (remaining(scene, piles) > 0) return 'На столе ещё есть предметы. Найди место для каждого.';
    if (scene.kind === 'share') {
      if (piles.some(n => n !== scene.size)) return 'Пока получилось не поровну. Сравни, где больше и где меньше. Кнопка «Забрать» вернёт один предмет на стол.';
    } else if (piles.some(n => n !== scene.size)) {
      return 'Сравни раскладку с условием. В каждом месте должно оказаться ровно ' + scene.size + '. Предмет можно забрать и переложить.';
    }
    return '';
  }
  function answerFor(scene) {
    if (scene.kind === 'share') return scene.size;
    if (scene.kind === 'pack') return scene.total / scene.size;
    return scene.total;
  }
  function expression(scene) {
    if (scene.kind === 'count') return scene.size + ' × ' + scene.targets.length + ' = ' + scene.total;
    const divisor = scene.kind === 'pack' ? scene.size : scene.targets.length;
    return scene.total + ' : ' + divisor + ' = ' + answerFor(scene);
  }
  function correctCount(scene) {
    if (scene.kind === 'share') return 'Посмотри, сколько предметов находится в одном месте.';
    if (scene.kind === 'pack') return 'Посчитай только полностью собранные группы.';
    return 'Посчитай все разложенные предметы. Можно идти от одной группы к следующей.';
  }
  function picture(parent, scene, piles) {
    const list = element('div', 'ws-summary');
    piles.forEach((amount, i) => {
      if (scene.kind === 'pack' && !amount) return;
      const group = element('div', 'ws-snapshot');
      group.append(element('span', 'ws-name', scene.targets[i]), icons(scene.item, amount));
      group.setAttribute('aria-label', scene.targets[i] + '. Предметов ' + amount + '.');
      group.setAttribute('role', 'img');
      list.append(group);
    });
    parent.append(list);
  }

  function routeProgress(run) {
    const complete = run.stage === 'complete';
    const notation = run.stage.startsWith('notation');
    const concreteDone = complete || notation ? seriesLength : run.step + Number(run.stage === 'practice-done');
    const notationDone = complete ? seriesLength : notation ? run.step + Number(run.stage === 'notation-done') : 0;
    const route = element('div', 'ws-route-progress');
    route.setAttribute('role', 'group');
    route.setAttribute('aria-label', 'Сначала три дела с предметами, затем три записи');
    for (const [label, done, active] of [['Дела', concreteDone, !notation && !complete], ['Записи', notationDone, notation && !complete]]) {
      const phase = element('div', 'ws-route-phase');
      phase.dataset.state = done === seriesLength ? 'done' : active ? 'current' : 'future';
      phase.setAttribute('role', 'group');
      phase.setAttribute('aria-label', label + ': завершено ' + done + ' из ' + seriesLength);
      const dots = element('span', 'ws-route-dots');
      dots.setAttribute('aria-hidden', 'true');
      for (let index = 0; index < seriesLength; index++) {
        const dot = element('span', 'ws-route-dot', index < done ? '✓' : String(index + 1));
        dot.dataset.state = index < done ? 'done' : active && index === done ? 'current' : 'future';
        dots.append(dot);
      }
      phase.append(element('span', 'ws-route-label', label), dots);
      route.append(phase);
    }
    return route;
  }

  function onwardLink(place, allHelped) {
    const label = allHelped ? (hasUnfinishedRun(place) ? 'Продолжить: ' : 'Новые истории: ') : 'Дальше: ';
    const onward = link(label + place.name, 'workshop-' + place.id);
    onward.classList.add('ws-next', 'primary');
    onward.dataset.action = 'next-place';
    onward.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const saved = state.runs[place.id];
      // A completed postcard may still have an unseen trio. Keep unfinished work intact.
      if (saved?.stage === 'complete') {
        const rounds = Math.floor(place.scenes.length / seriesLength);
        for (let round = 0; round < rounds; round++) {
          if (place.scenes.slice(round * seriesLength, (round + 1) * seriesLength)
            .some((_, index) => !answered.has(storyId(place, round * seriesLength + index)))) {
            state.runs[place.id] = newRun(round);
            save();
            break;
          }
        }
      }
      // The last unfinished place can be the current one, so its hash need not change.
      if (location.hash === onward.hash) render(true);
    });
    return onward;
  }

  function render(focus = false) {
    const place = currentPlace();
    if (!place) return;
    const changedPlace = state.active !== place.id;
    state.active = place.id;
    let run = state.runs[place.id];
    const rounds = Math.floor(place.scenes.length / seriesLength);
    if (!run || !stages.includes(run.stage) || !Number.isInteger(run.round) || run.round < 0 || run.round >= rounds ||
        !Number.isInteger(run.step) || run.step < 0 || run.step >= seriesLength ||
        !Array.isArray(run.solved) || !Array.isArray(run.moves) || !Array.isArray(run.piles)) {
      run = state.runs[place.id] = newRun();
    }
    const scenes = place.scenes.slice(run.round * seriesLength, (run.round + 1) * seriesLength);
    const scene = scenes[run.step];
    const reward = rewards[place.id];
    if (!run.piles.length) run.piles = scene.targets.map(() => 0);
    save();
    if (changedPlace) announceProgress();

    host.replaceChildren();
    host.dataset.stage = run.stage;
    host.dataset.place = place.id;
    host.dataset.kind = scene.kind;
    const notation = run.stage.startsWith('notation');
    const complete = run.stage === 'complete';
    const step = element('p', 'ws-step', complete ? place.name : place.name + ' · ' + (notation ? 'Запись ' : 'История ') + (run.step + 1) + ' из ' + seriesLength);
    const title = element('h3', 'ws-title', complete ? reward?.title || 'Три дела сделаны!' : scene.title);
    title.tabIndex = -1;
    host.append(step, title);
    document.getElementById('workshop-route-progress')?.replaceChildren(routeProgress(run));
    if (focus) title.focus();
    function advance(stage) { run.stage = stage; save(); render(true); }
    function nextButton(label, fn) {
      host.append(action(label, 'next', fn, 'ws-next primary'));
    }
    function feedback() {
      const p = element('p', 'ws-feedback');
      p.setAttribute('role', 'status');
      return p;
    }

    if (complete) {
      const postcard = element('div', 'ws-postcard');
      postcard.dataset.place = place.id;
      const emblem = element('span', 'ws-postcard-icon adv-scene', place.icon);
      emblem.dataset.place = place.id;
      emblem.setAttribute('aria-hidden', 'true');
      postcard.append(emblem, element('strong', 'ws-postcard-title', 'Открытка «' + (reward?.postcard || place.name) + '»'),
        element('p', 'ws-postcard-copy', (reward?.thanks[run.round] || 'Три дела сделаны.') + ' Три решения записаны числами.'));
      const solved = solvedCount(place);
      const placeProgress = solved < place.scenes.length
        ? 'Здесь решено историй: ' + solved + ' из ' + place.scenes.length + '. Можно помочь ещё в трёх историях.'
        : 'Здесь решены все ' + place.scenes.length + ' историй. Открытка остаётся в твоём альбоме.';
      postcard.append(element('p', 'ws-place-progress', placeProgress));
      host.append(postcard);
      const actions = element('div', 'ws-actions');
      const next = nextPlace();
      const allHelped = places.every(item => state.completed.includes(item.id));
      if (next) actions.append(onwardLink(next, allHelped));
      else {
        host.append(element('p', 'ws-place-progress', 'Все ' + storyKinds.size + ' историй с предметами решены. Можно попробовать новые задачи в оранжерее.'));
        const garden = link('Вырастить свою оранжерею', 'garden-count');
        garden.classList.add('ws-next', 'primary');
        actions.append(garden);
      }
      if (rounds > 1) actions.append(action('Ещё три истории здесь', 'replay', () => {
        state.runs[place.id] = newRun((run.round + 1) % rounds);
        save(); render(true);
      }));
      if (next) actions.append(link('В оранжерею равных групп', 'garden-count'));
      actions.append(link('К делению уголком по шагам', 'count'));
      host.append(actions);
      const summary = element('div', 'ws-results');
      for (const example of scenes) {
        const row = element('div', 'ws-result');
        row.append(element('strong', '', example.title), element('span', 'ws-equation', expression(example)), element('p', '', example.meaning));
        summary.append(row);
      }
      host.append(summary);
      const share = scenes.find(example => example.kind === 'share');
      const pack = scenes.find(example => example.kind === 'pack');
      if (share && pack) {
        const comparison = element('details', 'ws-comparison');
        comparison.append(element('summary', '', 'Почему в двух историях стоит знак деления?'),
          element('p', '', 'В истории «' + share.title + '» число ' + share.targets.length + ' после знака деления показывает, между сколькими местами ты распределял предметы поровну.'),
          element('p', '', 'В истории «' + pack.title + '» число ' + pack.size + ' на том же месте показывает, сколько предметов ты клал в одну группу.'));
        host.append(comparison);
      }
      finishRender();
      return;
    }
    if (notation) {
      host.append(element('p', 'ws-prompt', scene.question));
      picture(host, scene, run.solved[run.step]);
      if (run.stage === 'notation-done') {
        host.append(element('p', 'ws-equation', expression(scene)), element('p', 'ws-meaning', scene.meaning));
        nextButton(run.step === seriesLength - 1 ? 'Закончить маршрут' : 'К следующей записи', () => {
          if (run.step < seriesLength - 1) {
            run.step++; advance('notation');
          } else {
            if (!state.completed.includes(place.id)) state.completed.push(place.id);
            advance('complete'); announceProgress();
          }
        });
        finishRender();
        return;
      }
      host.append(element('p', 'ws-instruction', 'Выбери запись, которая отвечает на этот вопрос.'));
      const options = element('div', 'ws-options');
      const correct = expression(scene);
      const a = scene.kind === 'count' ? scene.size : scene.total;
      const b = scene.kind === 'pack' ? scene.size : scene.targets.length;
      const values = [a + ' + ' + b + ' = ' + (a + b), Math.max(a, b) + ' − ' + Math.min(a, b) + ' = ' + Math.abs(a - b)];
      values.splice((run.step + run.round + places.indexOf(place)) % 3, 0, correct);
      const report = feedback();
      values.forEach(value => options.append(action(value, 'choose-expression', () => {
        if (value === correct) advance('notation-done');
        else report.textContent = scene.kind === 'count' ? 'В каждой группе столько же предметов. Какая запись учитывает все одинаковые группы?' :
          scene.kind === 'pack' ? 'Ты собирал группы заданного размера. Какая запись показывает, сколько таких групп получилось?' :
            'Ты раздавал предметы поровну. Какая запись показывает, сколько получил каждый?';
      }, 'ws-option')));
      host.append(options, report);
      finishRender();
      return;
    }
    host.append(element('p', 'ws-prompt', scene.prompt));

    if (run.stage === 'practice-done') {
      picture(host, scene, run.piles);
      host.append(element('p', 'ws-meaning', 'Получилось! ' + answerFor(scene) + ' ' + scene.unit + '.'));
      const payoff = reward?.payoffs[run.round * seriesLength + run.step];
      if (payoff) {
        const message = element('p', 'ws-payoff');
        const guide = element('span', 'adv-companion', '🦊');
        guide.setAttribute('aria-hidden', 'true');
        window.ArzhenikovArt?.decorate(guide, 'fox');
        message.append(guide, element('span', '', payoff));
        host.append(message);
      }
      nextButton(run.step < seriesLength - 1 ? 'К следующей истории' : 'Записать три решения', () => {
        run.piles = []; run.moves = []; run.answer = ''; run.hint = false;
        if (run.step < seriesLength - 1) {
          run.step++; advance('layout');
        } else {
          run.step = 0; advance('notation');
        }
      });
      finishRender();
      return;
    }
    if (run.stage === 'answer') {
      picture(host, scene, run.piles);
      const form = element('form', 'ws-answer');
      const label = element('label', 'ws-question', scene.question);
      const input = element('input', 'ws-input');
      input.name = 'quantity'; input.inputMode = 'numeric'; input.autocomplete = 'off';
      input.maxLength = 4; input.value = run.answer;
      input.addEventListener('input', () => { run.answer = input.value; input.removeAttribute('aria-invalid'); save(); });
      label.append(input);
      const check = element('button', 'primary', 'Проверить ответ');
      check.type = 'submit'; check.dataset.action = 'check-answer';
      const report = feedback();
      form.addEventListener('submit', event => {
        event.preventDefault();
        const value = input.value.trim();
        if (!/^\d+$/.test(value) || Number(value) !== answerFor(scene)) {
          report.textContent = value ? correctCount(scene) : 'Введи число.';
          input.setAttribute('aria-invalid', 'true'); input.focus(); return;
        }
        run.solved[run.step] = [...run.piles];
        answered.add(storyId(place, run.round * seriesLength + run.step));
        advance('practice-done'); announceProgress();
      });
      form.append(label, check, action('Вернуться к предметам', 'edit', () => advance('layout')), report);
      host.append(form);
      finishRender();
      return;
    }

    const instruction = element('p', 'ws-instruction');
    const stock = element('div', 'ws-stock');
    const targets = element('div', 'ws-targets');
    const actions = element('div', 'ws-actions');
    const report = feedback();
    const hint = element('p', 'ws-hint', scene.hint);
    hint.id = 'ws-hint'; hint.hidden = !run.hint;
    const placesUI = [];
    const undo = action('Отменить ход', 'undo', () => {
      const move = run.moves.pop();
      if (move) applyMove(move.to, -move.delta, false);
    });
    const showHint = action('Подсказка', 'hint', () => {
      run.hint = !run.hint; hint.hidden = !run.hint;
      showHint.setAttribute('aria-expanded', String(run.hint)); save();
    });
    showHint.setAttribute('aria-expanded', String(run.hint));
    showHint.setAttribute('aria-controls', hint.id);
    const check = action('Проверить раскладку', 'check-layout', () => {
      const issue = validateLayout(scene, run.piles);
      if (issue) report.textContent = issue;
      else advance('answer');
    }, 'primary');
    scene.targets.forEach((name, i) => {
      const group = element('div', 'ws-target');
      const add = action('', 'place', () => applyMove(i, 1));
      add.className = 'ws-place'; add.dataset.index = i;
      const take = action('Забрать', 'return', () => applyMove(i, -1), 'ws-return');
      take.dataset.index = i;
      take.setAttribute('aria-label', 'Забрать один предмет. ' + name);
      group.append(add, take); targets.append(group); placesUI.push({group, add, take});
    });
    function redraw() {
      const left = remaining(scene, run.piles);
      const firstMove = left === scene.total;
      // Explain the next useful move, even when the stock is empty but the layout is wrong.
      const issue = validateLayout(scene, run.piles);
      if (scene.kind === 'pack') instruction.textContent = packGuidance(scene, run.piles);
      else if (firstMove) instruction.textContent = 'Нажми «+» на карточке «' + scene.targets[0] + '».';
      else if (left === 0) instruction.textContent = issue || 'Теперь нажми «Проверить раскладку».';
      else if (scene.kind === 'share') instruction.textContent = 'Продолжай раздавать поровну.';
      else instruction.textContent = 'Нажимай «+», чтобы класть по одному.';
      placesUI[0].add.classList.toggle('ws-first-move', firstMove && scene.kind !== 'pack');
      check.classList.toggle('primary', !issue);
      if (scene.kind === 'pack') hint.textContent = firstMove ? scene.hint : packGuidance(scene, run.piles);
      const caption = scene.kind === 'count' ? (left ? 'Предметы на столе' : 'Все предметы разложены') : 'На столе осталось ' + left;
      stock.replaceChildren(element('span', 'ws-caption', caption), icons(scene.item, left));
      placesUI.forEach(({group, add, take}, i) => {
        const amount = run.piles[i];
        add.replaceChildren(element('span', 'ws-name', scene.targets[i]), icons(scene.item, amount));
        let status = '';
        if (scene.kind === 'pack') {
          group.dataset.packState = amount === 0 ? 'empty' : amount === scene.size ? 'full' : amount > scene.size ? 'over' : 'partial';
          status = amount === 0 ? 'Свободно' : amount === scene.size ? 'Готово · ' + amount + ' из ' + scene.size : amount > scene.size ? 'Лишние · ' + amount + ' из ' + scene.size : 'Ещё не готово · ' + amount + ' из ' + scene.size;
          add.append(element('span', 'ws-pack-status', status));
        }
        add.setAttribute('aria-label', 'Положить ' + scene.itemName + '. ' + scene.targets[i] + '. Сейчас предметов ' + amount + '. ' + status);
        add.disabled = left === 0;
        take.disabled = amount === 0;
      });
      undo.disabled = !run.moves.length;
    }
    function applyMove(to, delta, remember = true) {
      if (delta > 0 && !remaining(scene, run.piles) || delta < 0 && run.piles[to] === 0) return;
      const previousFocus = document.activeElement;
      run.piles[to] += delta;
      if (remember) run.moves.push({to, delta});
      redraw(); save();
      if (delta > 0) placesUI[to].add.querySelector('.ws-token:last-child')?.classList.add('adv-token-arrive');
      const left = remaining(scene, run.piles);
      const update = scene.kind === 'count' ? (left ? 'На столе ещё есть предметы.' : 'Все предметы разложены.') : 'На столе осталось ' + left + '.';
      report.textContent = scene.targets[to] + ' — ' + run.piles[to] + '. ' + update;
      if (previousFocus?.disabled) (remaining(scene, run.piles) ? placesUI[to].add : check).focus();
    }
    actions.append(check, undo, showHint);
    host.append(instruction, stock, targets, actions, report, hint);
    redraw();
    finishRender();
  }

  window.addEventListener('hashchange', () => render(true));
  render();
  announceProgress();
})();
