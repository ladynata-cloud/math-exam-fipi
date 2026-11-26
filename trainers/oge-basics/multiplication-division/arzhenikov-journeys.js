/* A zoomable view of real destinations. Navigation never writes learning progress. */
(() => {
  'use strict';
  const host = document.getElementById('journey-map');
  if (!host) return;
  const online = path => 'https://mathexam.space/' + path;
  const topic = (id, title, goal, href, symbol) => ({id, title, goal, href, symbol});
  const skillIds = ['count','share','pack','inverse','bridge','zero','remainder','transfer'];
  const skillNames = ['Равные шаги','Делю поровну','Равные группы','Неизвестный множитель','Цифра частного','Ноль в частном','Смысл остатка','Новый пример'];
  const skillGoals = [
    'Покажи одинаковые группы и свяжи их с умножением.',
    'Различи число получателей и число предметов у каждого.',
    'Собери наборы заданного размера и сосчитай их.',
    'Восстанови неизвестное число обратным действием.',
    'Проверь, почему следующая цифра уже слишком велика.',
    'Сохрани место разряда, даже когда в нём получается ноль.',
    'Объясни, что осталось и что с этим делать по условию.',
    'Проверь перенос на другое деление без готового образца.'
  ];
  const groups = [
    {id:'city', title:'Город маленьких дел', short:'Действуй', icon:'🏡', art:'picnic', color:'#367b65',
      goal:'Начни с предметов. Раздавай поровну, собирай наборы и подбирай запись к своим действиям.',
      topics:(window.ArzhenikovLife?.places || []).map(p => topic(p.id,p.name,p.skill,'#workshop-'+p.id,p.icon))},
    {id:'harbor', title:'Порт отправлений', short:'Разберись с остатком', icon:'⛴️', art:'harbor', color:'#397c9a',
      goal:'Одна раскладка может отвечать на разные вопросы: полные наборы, остаток или место для всего.',
      topics:[
        topic('exact','Без остатка','Разложи открытки в полные конверты.','#harbor-1','✉'),
        topic('remainder','Что осталось?','Отдели полные наборы от оставшихся предметов.','#harbor-2','★'),
        topic('full','Только полные','Выясни, сколько корабликов можно полностью украсить.','#harbor-3','⚑'),
        topic('all','Увезти всё','Учти коробку для оставшихся игрушек.','#harbor-4','▣'),
        topic('no-extra','Без лишней коробки','Проверь, нужна ли ещё одна ёмкость, когда остатка нет.','#harbor-12','✓'),
        topic('explore','Сравни вопросы','Пройди отправку, затем исследуй свои числа в порту.','#harbor','↔')
      ]},
    {id:'discoveries', title:'Бюро открытий', short:'Предскажи и объясни', icon:'🔎', art:'atelier', color:'#9a6441',
      goal:'Сделай предположение, проверь его действием и объясни результат. Затем попробуй новое условие.',
      topics:(window.ArzhenikovDiscoveries?.lines || []).map(p => topic(p.id,p.name,p.skill || p.goal || p.description || 'Четыре истории: исследование и новая проверка.','#discoveries-'+p.id+'-1',p.icon || '◇'))},
    {id:'garden', title:'Оранжерея равных групп', short:'Закрепи и повтори', icon:'🌱', art:'garden', color:'#577c43',
      goal:'Тренируй каждый навык на новых условиях. Подсказки помогают учиться, а самостоятельная проверка показывает перенос.',
      topics:(window.ArzhenikovGarden?.stations || []).map(p => topic(p.id,p.name,p.skill,'#garden-'+p.id,p.icon))},
    {id:'division', title:'Деление по шагам', short:'Свяжи действие с записью', icon:'÷', color:'#625790',
      goal:'От равных групп к выбору цифры частного, нулю в разряде и проверке письменного деления.',
      topics:skillIds.map((id,i) => topic(id,skillNames[i],skillGoals[i],'#'+id,String(i+1)))},
    {id:'algebra', title:'Дальше — алгебра', short:'От числа к букве', icon:'x', color:'#8b536e',
      goal:'Вход в алгебру: сначала неизвестное число, затем действия с ним. Исторический ориентир — советское издание Киселёва; практика ниже создана в MathExam.',
      source:{title:'Киселёв. Алгебра, часть I, 1946 · РГБ',href:'https://search.rsl.ru/ru/record/01005810663'},
      topics:[
        topic('unknown','Неизвестное число','Выбери обратное действие, чтобы найти неизвестное. Можно начать с лёгкого уровня.',online('trainers/simple-equations-stepwise.html'),'x'),
        topic('fractions','Подготовка: дроби','Уточни смысл доли и целого в существующем курсе советской арифметики.',online('soviet-math/#fraction-meaning'),'½'),
        topic('negative','Числа со знаком','Найди число и направление движения на числовой прямой.',online('trainers/oge-basics/negative-number-line.html'),'±'),
        topic('order','Порядок действий','Разберись, какое действие выполняется первым и почему.',online('trainers/oge-basics/order-of-operations.html'),'()'),
        topic('course','Продолжить алгебру','Действующий современный курс по Макарычеву: выражения, уравнения и дальнейшие темы.',online('school/makarychev7/'),'a+b')
      ]},
    {id:'geometry', title:'Дальше — геометрия', short:'От рисунка к объяснению', icon:'△', color:'#386f86',
      goal:'Начни с отрезков и углов, потом сравни фигуры. Исторический ориентир — планиметрия Киселёва; упражнения MathExam открываются отдельно.',
      source:{title:'Киселёв. Геометрия, планиметрия, 1955 · РГБ',href:'https://search.rsl.ru/ru/record/01005583374'},
      topics:[
        topic('segments','Точки и отрезки','Начни с рисунка: отмечай точки и исследуй отрезки.',online('geometry-course/atlas/segments.html'),'•—•'),
        topic('measure','Измеряем длину','Сопоставь длины и единицы измерения в курсе арифметики.',online('soviet-math/#measure-length'),'↔'),
        topic('angles','Измеряем угол','Меняй угол, сравнивай и проверяй измерение.',online('geometry-course/atlas/measure-angle.html'),'∠'),
        topic('triangles','Равенство треугольников','Исследуй, когда два треугольника совпадут при наложении.',online('geometry-course/atlas/triangle-sas.html'),'△'),
        topic('course','Продолжить геометрию','Действующий курс по Атанасяну: начальные сведения, построения и доказательства.',online('geometry-course/first-steps/'),'⌁')
      ]}
  ];
  const numberTracks = [
    {track:window.ArzhenikovCourseWritten, short:'Запиши каждый шаг', icon:'⌟', color:'#68558e'},
    {track:window.ArzhenikovCourseFractions, short:'Считай равные доли', icon:'¾', color:'#94622e'},
    {track:window.ArzhenikovCourseDecimals, short:'Измеряй и вычисляй', icon:'0,1', color:'#347e80'},
    {track:window.ArzhenikovCourseConnections, short:'Выбирай способ сам', icon:'½ = 50%', color:'#4f6598'}
  ].filter(item => item.track);
  // Add new destinations without renaming or redirecting any earlier stop.
  groups.splice(5, 0, ...numberTracks.map(({track, short, icon, color}) => ({
    id:track.id, title:track.title, short, icon, color, goal:track.description,
    source:{title:track.id === 'written' ? 'Аржеников. Часть III, 1924 · с. 24' : 'Аржеников. Часть IV, 1924 · дроби',
      href:track.id === 'written' ? 'https://djvu.online/file/Zmmk0C6Gqh83D' : 'https://djvu.online/file/AIsMeWPu7uz8w'},
    topics:track.lessons.map(lesson => topic(lesson.id, lesson.title, lesson.goal, '#course-' + lesson.id, icon))
  })));
  window.ArzhenikovJourneys = {groups};

  function el(tag, cls, text) {
    const item = document.createElement(tag);
    if (cls) item.className = cls;
    if (text !== undefined) item.textContent = text;
    return item;
  }
  function button(label, action, fn) {
    const item = el('button','',label); item.type = 'button';
    item.dataset.journeyAction = action; item.addEventListener('click',fn); return item;
  }
  const breadcrumbs = el('nav','journey-breadcrumb');
  breadcrumbs.setAttribute('aria-label','Где я на карте');
  const toolbar = el('div','journey-toolbar');
  const overview = button('Вся карта','overview',() => go());
  const back = button('← На шаг выше','back',() => up());
  const motion = button('Плавные переходы','motion',() => {
    animate = !animate; applyMotion(); drawCamera();
  });
  const media = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  let animate = !media?.matches;
  toolbar.append(overview,back,motion);
  const viewport = el('div','journey-viewport');
  viewport.tabIndex = 0;
  viewport.setAttribute('role','group');
  viewport.setAttribute('aria-label','Пространственная карта. Выбери раздел. Стрелки — по маршруту; Escape — на шаг выше.');
  viewport.setAttribute('aria-describedby','journey-caption');
  const world = el('div','journey-world');
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.classList.add('journey-paths'); svg.setAttribute('aria-hidden','true');
  world.append(svg); viewport.append(world);
  const compass = el('div','journey-compass','Сначала действие. Потом открытие.');
  compass.setAttribute('aria-hidden','true'); viewport.append(compass);
  const cameraControls = el('div','journey-camera-controls');
  cameraControls.append(
    button('+','zoom-in',() => zoomIn()),
    button('−','zoom-out',() => up())
  );
  cameraControls.children[0].setAttribute('aria-label','Приблизить следующий уровень');
  cameraControls.children[1].setAttribute('aria-label','Отдалить на один уровень');
  viewport.append(cameraControls);
  const caption = el('section','journey-caption');
  caption.setAttribute('aria-labelledby','journey-caption');
  const captionTitle = el('h2','','Выбери место на карте'); captionTitle.id = 'journey-caption';
  captionTitle.tabIndex = -1;
  const captionText = el('p');
  const captionProgress = el('p','journey-progress'); captionProgress.setAttribute('aria-live','polite');
  const openLink = el('a','journey-open','Открыть задание →'); openLink.dataset.journeyAction = 'open';
  const sourceLink = el('a','journey-source'); sourceLink.target = '_blank'; sourceLink.rel = 'noopener';
  const actions = el('div','journey-caption-actions'); actions.append(openLink,sourceLink);
  const courseLink = el('a','journey-course-link','Последовательные уроки →');
  courseLink.href = '#courses'; actions.append(courseLink);
  caption.append(captionTitle,captionText,captionProgress,actions);
  const stepper = el('div','journey-stepper');
  const previous = button('← Предыдущий шаг','previous',() => travel(-1));
  const next = button('Следующий шаг →','next',() => travel(1));
  const position = el('span','journey-position');
  stepper.append(previous,position,next);
  const linear = el('details','journey-linear');
  linear.append(el('summary','','Весь маршрут списком'));
  const list = el('div','journey-linear-groups');
  for (const group of groups) {
    const section = el('section');
    const heading = el('h3','',group.title);
    const links = el('ul');
    for (const destination of group.topics) {
      const li = el('li');
      const a = el('a','',destination.title); a.href = destination.href;
      if (!destination.href.startsWith('#')) a.dataset.onlineTrainer = 'true';
      li.append(a); links.append(li);
    }
    section.append(heading,links); list.append(section);
  }
  linear.append(list);
  const returnLink = el('a','journey-return','← Вернуться к своему занятию');
  returnLink.id = 'journey-return'; returnLink.href = '#workshop';
  host.append(breadcrumbs,toolbar,viewport,caption,stepper,linear,returnLink);

  const groupNodes = groups.map((group,index) => {
    const item = el('button','journey-region'); item.type = 'button';
    item.dataset.journeyGroup = group.id; item.style.setProperty('--region-color',group.color);
    const icon = el('span',group.art ? 'journey-region-art adv-scene' : 'journey-region-symbol',group.icon);
    if (group.art) icon.dataset.place = group.art;
    icon.setAttribute('aria-hidden','true');
    item.append(icon,el('small','journey-region-kicker',String(index+1)+' · '+group.short),el('strong','',group.title));
    item.addEventListener('click',() => go(group.id));
    world.append(item);
    return item;
  });
  const topicNodes = new Map();
  for (const group of groups) {
    topicNodes.set(group.id,group.topics.map((destination,index) => {
      const item = el('button','journey-stop'); item.type = 'button';
      item.dataset.journeyTopic = destination.id; item.dataset.group = group.id;
      item.style.setProperty('--region-color',group.color);
      const number = el('span','journey-stop-number',String(index+1)); number.setAttribute('aria-hidden','true');
      item.append(number,el('strong','',destination.title));
      item.addEventListener('click',() => go(group.id,destination.id));
      world.append(item); return item;
    }));
  }
  let view = {group:null,topic:null}, positions = [], localPositions = [], previousRoute = '';
  function route() {
    const hash = location.hash.slice(1);
    if (hash === 'journey') return {group:null,topic:null};
    if (!hash.startsWith('journey-')) return null;
    const rest = hash.slice(8);
    const group = groups.find(g => rest === g.id || rest.startsWith(g.id+'-'));
    if (!group) return {group:null,topic:null};
    const topicId = rest.slice(group.id.length+1);
    return {group,topic:group.topics.find(t => t.id === topicId) || null};
  }
  function go(group,topicId) {
    const hash = '#journey'+(group?'-'+group:'')+(topicId?'-'+topicId:'');
    if (location.hash === hash) render(true);
    else location.hash = hash;
  }
  function up() { view.topic ? go(view.group.id) : go(); }
  function zoomIn() {
    if (!view.group) go(groups[0].id);
    else if (!view.topic && view.group.topics.length) go(view.group.id,view.group.topics[0].id);
  }
  function travel(direction) {
    if (!view.group) { go(groups[direction<0?groups.length-1:0].id); return; }
    if (view.topic) {
      const index = view.group.topics.indexOf(view.topic);
      const destination = view.group.topics[index+direction];
      if (destination) go(view.group.id,destination.id);
      else {
        const group = groups[groups.indexOf(view.group)+direction];
        if (group) go(group.id);
      }
    } else {
      const group = groups[groups.indexOf(view.group)+direction];
      if (group) go(group.id);
    }
  }
  function applyMotion() {
    host.dataset.motion = animate && !media?.matches ? 'on' : 'off';
    motion.setAttribute('aria-pressed',String(host.dataset.motion === 'on'));
    motion.textContent = host.dataset.motion === 'on' ? 'Движение: плавно' : 'Движение: выключено';
  }
  media?.addEventListener?.('change',() => { applyMotion(); drawCamera(); });

  function drawPath(points,cls) {
    const path = document.createElementNS(svg.namespaceURI,'path');
    path.setAttribute('class',cls);
    path.setAttribute('d',points.map((p,i) => (i?'L':'M')+p.x+' '+p.y).join(' '));
    svg.append(path);
  }
  function drawCamera() {
    if (host.hidden) return;
    const width = viewport.clientWidth || 800;
    // Region cards keep a readable screen size while the world zooms out.
    // Below 760 px the wide trail would bring two full-height cards together.
    const mobile = width < 760;
    host.dataset.compact = String(mobile);
    const columns = mobile ? 2 : 3, rows = Math.ceil(groups.length / columns);
    const wantedHeight = view.group
      ? Math.max(mobile ? 480 : 500, Math.ceil(view.group.topics.length / columns) * (mobile ? 88 : 110) + 172)
      : Math.max(mobile ? 480 : 500, rows * (mobile ? 112 : 145) + 120);
    viewport.style.height = wantedHeight + 'px';
    const height = viewport.clientHeight || wantedHeight;
    const worldWidth = mobile ? 1400 : 2400, gap = mobile ? 520 : 550;
    const worldHeight = (rows - 1) * gap + 800;
    positions = groups.map((_, i) => {
      const row = Math.floor(i / columns), offset = i % columns;
      const col = row % 2 ? columns - 1 - offset : offset;
      return {x: (col + .5) * worldWidth / columns, y: 260 + row * gap};
    });
    svg.setAttribute('viewBox','0 0 '+worldWidth+' '+worldHeight);
    svg.setAttribute('width',String(worldWidth)); svg.setAttribute('height',String(worldHeight));
    svg.replaceChildren();
    // Both later subjects branch from the completed arithmetic route.
    const foundation = groups.filter(group => !['algebra','geometry'].includes(group.id));
    const stem = foundation.map(group => positions[groups.indexOf(group)]);
    drawPath(stem,'journey-trail');
    for (const id of ['algebra','geometry']) {
      drawPath([stem.at(-1), positions[groups.findIndex(group => group.id === id)]], 'journey-trail');
    }
    world.style.width = worldWidth+'px'; world.style.height = worldHeight+'px';
    let scale = Math.min(width/worldWidth,height/worldHeight);
    let cx = worldWidth/2, cy = worldHeight/2;
    if (view.group) {
      const point = positions[groups.indexOf(view.group)];
      const topics = view.group.topics;
      const columns = mobile?2:Math.min(3,topics.length);
      const rows = Math.ceil(topics.length/columns);
      const gapX = mobile?Math.min(150,(width-18)/2):Math.min(210,(width-90)/columns);
      const gapY = Math.min(mobile?92:115,(height-(mobile?172:120))/Math.max(rows-1,1));
      localPositions = topics.map((_,i) => ({
        x:point.x+(i%columns-(columns-1)/2)*gapX,
        y:point.y+(Math.floor(i/columns)-(rows-1)/2)*gapY
      }));
      drawPath(localPositions,'journey-local-trail');
      cx = point.x; cy = point.y+(mobile?32:0); scale = 1;
      if (view.topic) {
        const chosen = localPositions[topics.indexOf(view.topic)];
        cx = chosen.x; cy = chosen.y; scale = mobile?1.16:1.45;
      }
    }
    const transform = 'translate('+(width/2-cx*scale)+'px,'+(height/2-cy*scale)+'px) scale('+scale+')';
    world.style.transform = transform;
    world.style.setProperty('--camera-inverse',String(1/scale));
    for (let i=0;i<groupNodes.length;i++) {
      const item = groupNodes[i]; item.hidden = Boolean(view.group);
      item.style.left = positions[i].x+'px'; item.style.top = positions[i].y+'px';
    }
    for (const group of groups) {
      topicNodes.get(group.id).forEach((item,index) => {
        const shown = group === view.group && (!view.topic || group.topics[index] === view.topic);
        item.hidden = !shown;
        if (group === view.group) {
          item.style.left = localPositions[index].x+'px'; item.style.top = localPositions[index].y+'px';
          if (group.topics[index] === view.topic) item.setAttribute('aria-current','step');
          else item.removeAttribute('aria-current');
        }
      });
    }
  }
  function progressText() {
    if (!view.group) return 'Любой путь можно открыть сразу. Карта не ставит замков.';
    const numberTrack = numberTracks.find(item => item.track.id === view.group.id)?.track;
    if (numberTrack) {
      const done = new Set(window.ArzhenikovCoursesProgress?.().completed || []);
      return 'Уроков пройдено: ' + numberTrack.lessons.filter(lesson => done.has(lesson.id)).length +
        ' из ' + numberTrack.lessons.length + '. В каждом уроке есть самостоятельная проверка на новых числах.';
    }
    if (view.group.id === 'city') {
      const p = window.ArzhenikovWorkshopProgress?.();
      return p ? 'Решено историй: '+p.storyCount+' из '+p.storyTotal+'. Открытки отмечают завершение, а не самостоятельную проверку.' : '';
    }
    if (view.group.id === 'harbor') {
      const p = window.ArzhenikovHarborProgress?.();
      return p ? 'Завершено отправок: '+p.completed.length+' из '+p.total+'.' : '';
    }
    if (view.group.id === 'discoveries') {
      const p = window.ArzhenikovDiscoveriesProgress?.();
      return p ? 'Завершено историй: '+p.completed.length+' из '+p.total+'. Новые проверки без подсказки: '+p.independent.length+'.' : '';
    }
    if (view.group.id === 'algebra' || view.group.id === 'geometry') {
      return 'Восемь последовательных уроков доступны здесь и в автономном комплекте. Полный постраничный курс Киселёва пока не создан. Соседние тренажёры по внешним ссылкам требуют интернета.';
    }
    return 'Можно открыть любую тему и вернуться к незавершённому заданию.';
  }
  function crumb(label,hash) { const a = el('a','',label); a.href=hash; return a; }
  function render(focus=false) {
    const current = route();
    if (!current) return;
    view = current;
    host.dataset.view = view.topic?'topic':view.group?'group':'overview';
    host.dataset.group = view.group?.id || '';
    host.dataset.topic = view.topic?.id || '';
    breadcrumbs.replaceChildren(crumb('Вся карта','#journey'));
    if (view.group) breadcrumbs.append(el('span','','›'),crumb(view.group.title,'#journey-'+view.group.id));
    if (view.topic) breadcrumbs.append(el('span','','›'),el('strong','',view.topic.title));
    breadcrumbs.lastElementChild?.setAttribute('aria-current','location');
    captionTitle.textContent = view.topic?.title || view.group?.title || 'Выбери место на карте';
    captionText.textContent = view.topic?.goal || view.group?.goal ||
      'Приблизь раздел, выбери тему и открой задание. Кнопки со стрелками проведут по пути, а «Вся карта» покажет, где ты находишься.';
    captionProgress.textContent = progressText();
    const courseTracks = [window.ArzhenikovCourseArithmetic, ...numberTracks.map(item => item.track),
      window.ArzhenikovCourseAlgebra,window.ArzhenikovCourseGeometry].filter(Boolean);
    const courseTrack = view.group && courseTracks.some(track => track.id === view.group.id) ? view.group.id : 'arithmetic';
    courseLink.href = view.group ? '#courses-' + courseTrack : '#courses';
    const courseCount = courseTracks.find(track => track.id === courseTrack)?.lessons.length || 0;
    courseLink.textContent = (view.group ? courseCount : courseTracks.reduce((sum, track) => sum + track.lessons.length,0)) + ' последовательных уроков →';
    sourceLink.hidden = !view.group?.source;
    if (view.group?.source) { sourceLink.href=view.group.source.href; sourceLink.textContent=view.group.source.title; }
    openLink.hidden = !view.group;
    openLink.href = view.topic?.href || '#journey-'+view.group?.id+'-'+view.group?.topics[0]?.id;
    openLink.textContent = !view.topic ? 'Выбрать первую тему →'
      : view.topic.href.startsWith('#') ? 'Открыть задание →' : 'Открыть тренировку онлайн ↗';
    back.disabled = !view.group;
    cameraControls.children[0].disabled = Boolean(view.topic);
    cameraControls.children[1].disabled = !view.group;
    previous.disabled = !view.group || (view.group === groups[0] && (!view.topic || view.topic === view.group.topics[0]));
    next.disabled = view.group === groups[groups.length-1] && (!view.topic || view.topic === view.group.topics.at(-1));
    position.textContent = view.topic
      ? 'Тема '+(view.group.topics.indexOf(view.topic)+1)+' из '+view.group.topics.length
      : view.group ? 'Раздел '+(groups.indexOf(view.group)+1)+' из '+groups.length : groups.length+' направлений';
    applyMotion(); drawCamera();
    if (focus && previousRoute !== location.hash) {
      // Keep the moving canvas visible, but never focus a node that just became hidden.
      viewport.focus({preventScroll:true});
    }
    previousRoute = location.hash;
  }
  viewport.addEventListener('keydown',event => {
    if (event.target !== viewport || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); travel(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); travel(-1); }
    if (event.key === 'Escape') { event.preventDefault(); up(); }
    if (event.key === '+' || event.key === '=') { event.preventDefault(); zoomIn(); }
    if (event.key === '-') { event.preventDefault(); up(); }
  });
  document.addEventListener('click',event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.hash.startsWith('#journey') && !location.hash.startsWith('#journey')) {
      const hash = location.hash;
      returnLink.href = hash && hash !== '#next-course' ? hash : '#workshop';
    }
  });
  window.addEventListener('hashchange',() => render(true));
  for (const name of ['workshop-progress','harbor-progress','discoveries-progress','courses-progress']) {
    window.addEventListener(name,() => { if (route()) captionProgress.textContent=progressText(); });
  }
  if (typeof ResizeObserver === 'function') new ResizeObserver(drawCamera).observe(viewport);
  else window.addEventListener('resize',drawCamera);
  // A map entrance beside the old map preserves the existing first-action screen.
  const drawer = document.querySelector('#life-map .wm-drawer');
  if (drawer) {
    const launch = el('a','journey-city-launch','Исследовать большую карту с приближением →');
    launch.href = '#journey-city'; drawer.insertBefore(launch,drawer.children[1] || null);
  }
  render();
})();
