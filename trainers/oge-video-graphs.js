/* Original MathExam investigations adapted from selected GeoGebra graph-course observations.
 * Pure data/renderers: no network, storage, native trainer state or external applets. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.OgeVideoGraphLessons = factory();
})(typeof window === 'undefined' ? this : window, function () {
  'use strict';
  const GREEN = '#216342', ORANGE = '#b45309', GRAY = '#64748b';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // Preserve exact entered parameters, including non-step decimals near a critical value.
  const fmt = n => String(n === 0 ? 0 : n).replace('.', ',').replace('-', '−');
  const approx = n => fmt(Number(n.toPrecision(7)));
  const sign = n => n < 0 ? ' − ' + fmt(-n) : ' + ' + fmt(n);
  const param = (p, key, fallback) => p && Number.isFinite(Number(p[key])) ? Number(p[key]) : fallback;
  function unique(xs) { xs = xs.map(x => x === 0 ? 0 : x); return xs.filter((x, i) => Number.isFinite(x) && !xs.slice(0, i).includes(x)).sort((a,b) => a-b); }
  function frame(title, bounds) {
    const [xmin,xmax,ymin,ymax] = bounds;
    const scale = Math.min(396 / (xmax - xmin), 216 / (ymax - ymin));
    const X = x => 242 + (x - (xmin + xmax) / 2) * scale;
    const Y = y => 150 - (y - (ymin + ymax) / 2) * scale;
    const chunks = [];
    const line = (x1,y1,x2,y2,color=GREEN,dash=false) => chunks.push(`<path d="M${X(x1).toFixed(2)},${Y(y1).toFixed(2)}L${X(x2).toFixed(2)},${Y(y2).toFixed(2)}" fill="none" stroke="${color}" stroke-width="2.5"${dash?' stroke-dasharray="6 5"':''}/>`);
    const label = (x,y,s,color=GRAY) => chunks.push(`<text x="${X(x).toFixed(2)}" y="${Y(y).toFixed(2)}" fill="${color}" font-size="16" text-anchor="middle">${esc(s)}</text>`);
    const dot = (x,y,open=false,color=GREEN) => chunks.push(`<circle cx="${X(x).toFixed(2)}" cy="${Y(y).toFixed(2)}" r="5.5" fill="${open?'white':color}" stroke="${color}" stroke-width="2.5"/>`);
    const curve = (fn, left=xmin, right=xmax, color=GREEN, dash=false) => {
      let path='', pen=false;
      for(let i=0;i<=260;i++) {
        const x=left+(right-left)*i/260, y=fn(x);
        if(!Number.isFinite(y)||y<ymin||y>ymax){pen=false;continue;}
        path+=(pen?'L':'M')+X(x).toFixed(2)+','+Y(y).toFixed(2);pen=true;
      }
      chunks.push(`<path d="${path}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"${dash?' stroke-dasharray="5 5"':''}/>`);
    };
    const caption = text => chunks.push(`<text x="240" y="287" fill="${ORANGE}" font-size="16" text-anchor="middle">${esc(text)}</text>`);
    const outside = () => {
      const left = X(xmin) - 5, right = X(xmax) + 5;
      chunks.push(`<path d="M${left},142l-12,8 12,8M${right},142l12,8 -12,8" fill="none" stroke="${ORANGE}" stroke-width="3"/>`);
    };
    const unit = 10 ** Math.floor(Math.log10(24 / scale)), ratio = 24 / scale / unit;
    const tick = (ratio <= 1 ? 1 : ratio <= 2 ? 2 : ratio <= 5 ? 5 : 10) * unit;
    for(let i=Math.ceil(xmin/tick);i<=Math.floor(xmax/tick);i++){
      if(i)line(i*tick,ymin,i*tick,ymax,'#edf2f6');
    }
    for(let i=Math.ceil(ymin/tick);i<=Math.floor(ymax/tick);i++){
      if(i)line(xmin,i*tick,xmax,i*tick,'#edf2f6');
    }
    if(xmin<=0&&xmax>=0)line(0,ymin,0,ymax,'#cbd5e1');
    if(ymin<=0&&ymax>=0)line(xmin,0,xmax,0,'#cbd5e1');
    label(xmax+12/scale,0,'x'); label(0,ymax+6/scale,'y');
    for(let i=Math.ceil(xmin/tick);i<=Math.floor(xmax/tick);i++){
      label(i*tick,ymin-18/scale,fmt(i*tick));
    }
    for(let i=Math.ceil(ymin/tick);i<=Math.floor(ymax/tick);i++){
      label(xmin-20/scale,i*tick-4/scale,fmt(i*tick));
    }
    return {line,label,dot,curve,caption,outside,finish:()=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><rect width="480" height="300" rx="12" fill="#fff"/><text x="240" y="24" font-size="17" font-weight="600" text-anchor="middle" fill="${GREEN}">${esc(title)}</text>${chunks.join('')}</svg>`};
  }
  function hyperValue(k,a,b,x) { return x === -a ? null : k/(x+a)+b; }
  function absIntersections(c,b=1,d=-2) {
    if(c<0)return [];
    const xs=[];
    for(const v of unique([c,-c])) {
      const D=b*b-4*(d-v);
      if(D<0)continue;
      xs.push((-b-Math.sqrt(D))/2,(-b+Math.sqrt(D))/2);
    }
    return unique(xs);
  }
  function pieceValue(x,h=1,B=4) {return x < -h ? -x : B-x*x;}
  function pieceIntersections(c,h=1,B=4) {
    const xs=[];
    if(-c < -h)xs.push(-c);
    if(B-c>=0)for(const x of unique([-Math.sqrt(B-c),Math.sqrt(B-c)]))if(x>=-h)xs.push(x);
    return unique(xs);
  }
  function holeValue(x,h=2) {return x===0||x===h?null:1/x;}
  function holeIntersections(k,h=2) {
    if(k<=0)return [];
    const x=1/Math.sqrt(k);
    // Compare the parameter with the exact critical value, not a visual epsilon.
    return k===1/(h*h) ? (h>0?[-x]:[x]) : [-x,x];
  }
  const lessons = [
    {
      id:'line-parameters', title:'Прямая: наклон и сдвиг', tasks:[11],
      goal:'Раздели действие коэффициентов k и b: меняй один, сохраняя другой.',
      source:{label:'Графики в GeoGebra · урок 8: отдельное изменение параметров',url:'https://vkvideo.ru/video-222329240_456239019'},
      controls:[{key:'k',label:'k — наклон',min:-3,max:3,step:.5,value:1},{key:'b',label:'b — пересечение с осью y',min:-4,max:4,step:1,value:1}],
      predict:{question:'У прямой y = x + b увеличили только b. Что изменится?',choices:['Прямая поднимется; наклон сохранится','Прямая станет круче','Прямая повернётся вокруг начала координат'],answer:0,explain:'При каждом x значение y увеличится на одну и ту же величину. Коэффициент при x не менялся.'},
      reason:{question:'Почему при k = −2 за шаг вправо на 1 график опускается на 2?',choices:['Разность значений y равна k·1','Потому что b всегда отрицательно','Потому что все прямые идут вниз'],answer:0,explain:'y(x+1) − y(x) = k. Значение b сокращается; оно не определяет наклон.'},
      render(p){const k=param(p,'k',1),b=param(p,'b',1);const f=frame(`y = ${fmt(k)}x${sign(b)}`,[-5,5,-8,8]);f.curve(x=>k*x+b);f.dot(0,b);if(k+b>=-8&&k+b<=8)f.dot(1,k+b);return {svg:f.finish(),readout:`При x = 0: y = ${fmt(b)}. При x = 1: y = ${fmt(k+b)}. Изменение y за шаг вправо: ${fmt(k)}.${k===0?' При k = 0 получилась горизонтальная прямая.':''}`};},
      math:{value:(k,b,x)=>k*x+b},
      practices:[
        {prompt:'Прямая y = kx + 3 проходит через точку (2; 7). Найди k.',answer:2,hint:'Подставь координаты: 7 = 2k + 3.',solution:'2k = 4, поэтому k = 2.'},
        {prompt:'Прямая y = −2x + b проходит через точку (3; 1). Найди b.',answer:7,hint:'Подставь x = 3 и y = 1.',solution:'1 = −6 + b, поэтому b = 7.'},
        {prompt:'Для y = 1,5x − 4 аргумент увеличился с 0 до 2. На сколько увеличилось значение y?',answer:3,hint:'Вычисли y(2) − y(0).',solution:'y(2) = −1, y(0) = −4. Разность равна 3.'}
      ]
    },
    {
      id:'hyperbola-domain',title:'Гипербола: сдвиги и особый ноль',tasks:[11],
      goal:'Свяжи формулу с асимптотами и сохрани запрещённое значение при k = 0.',
      source:{label:'Графики в GeoGebra · урок 8: гипербола и асимптоты',url:'https://vkvideo.ru/video-222329240_456239019'},
      controls:[{key:'k',label:'k — знак и растяжение',min:-4,max:4,step:1,value:2},{key:'a',label:'a — сдвиг в знаменателе x + a',min:-3,max:3,step:.5,value:1},{key:'b',label:'b — вертикальный сдвиг',min:-3,max:3,step:1,value:1}],
      predict:{question:'В формуле y = 2/(x + a) + 1 увеличили a с 1 до 2. Куда сдвинется вертикальная асимптота?',choices:['Влево: с x = −1 к x = −2','Вправо: с x = 1 к x = 2','Не сдвинется'],answer:0,explain:'Знаменатель обращается в ноль при x = −a. Знак сдвига противоположен знаку a.'},
      reason:{question:'При k = 0 запись 0/(x + a) + b даёт горизонталь. Что происходит в x = −a?',choices:['Точка исключена: знаменатель равен нулю','Получается точка (−a; 0)','Остаётся вертикальная асимптота'],answer:0,explain:'0/0 не определено. Остаётся горизонталь y = b с выколотой точкой; бесконечного роста около неё нет, значит вертикальной асимптоты нет.'},
      render(p){const k=param(p,'k',2),a=param(p,'a',1),b=param(p,'b',1);const f=frame('y = k/(x + a) + b',[-7,7,-7,7]);if(k!==0){f.line(-a,-7,-a,7,GRAY,true);f.line(-7,b,7,b,GRAY,true);f.curve(x=>hyperValue(k,a,b,x),-7,-a-.002);f.curve(x=>hyperValue(k,a,b,x),-a+.002,7);}else{f.line(-7,b,7,b);f.dot(-a,b,true);}return {svg:f.finish(),readout:k===0?`k = 0; a = ${fmt(a)}; b = ${fmt(b)}. y = ${fmt(b)} при x ≠ ${fmt(-a)}. Выколотая точка (${fmt(-a)}; ${fmt(b)}). Вертикальной асимптоты нет.`:`y = ${fmt(k)}/(x${sign(a)})${sign(b)}. Асимптоты: x = ${fmt(-a)} и y = ${fmt(b)}. При x = ${fmt(-a)} функция не определена.`};},
      math:{value:hyperValue},
      practices:[
        {prompt:'У графика y = 3/(x + 2) − 1 вертикальная асимптота имеет вид x = c. Найди c.',answer:-2,hint:'Приравняй знаменатель к нулю.',solution:'x + 2 = 0, поэтому c = −2.'},
        {prompt:'Дана функция y = 0/(x − 3) + 5. Какое единственное значение x запрещено?',answer:3,hint:'Нулевой числитель не отменяет запрет на нулевой знаменатель.',solution:'x − 3 = 0 при x = 3. В точке (3; 5) остаётся отверстие.'},
        {prompt:'Вычисли значение функции y = 3/(x + 1) − 2 при x = 2.',answer:-1,hint:'Сначала вычисли знаменатель.',solution:'3/(2 + 1) − 2 = 1 − 2 = −1.'}
      ]
    },
    {
      id:'absolute-intersections',title:'Модуль: когда исчезают два корня',tasks:[22],
      goal:'Отрази отрицательную часть параболы и исследуй точный уровень 9/4.',
      source:{label:'Графики в GeoGebra · уроки 2–3: модуль и горизонталь'},
      controls:[{key:'c',label:'c — высота прямой y = c',min:-1,max:4,step:.25,value:1}],
      predict:{question:'Для y = |x² + x − 2| при c = 2 есть четыре пересечения с y = c. Сколько их при c = 9/4?',choices:['Три','Четыре','Два'],answer:0,explain:'Две внутренние точки встречаются в вершине отражённой дуги. Эта вершина считается одной точкой; две внешние остаются.'},
      reason:{question:'Почему на уровне c = 0 нельзя сложить корни x² + x − 2 = 0 и −(x² + x − 2) = 0?',choices:['Это одни и те же две точки','Нулевой уровень вообще запрещён','У модуля всегда четыре корня'],answer:0,explain:'Оба уравнения дают x = −2 и x = 1. Различные точки считают один раз.'},
      render(p){const c=param(p,'c',1),xs=absIntersections(c);const f=frame('y = |x² + x − 2|',[-4,3,-3,5]);f.curve(x=>x*x+x-2,-2,1,GRAY,true);f.curve(x=>Math.abs(x*x+x-2));f.dot(-.5,2.25);f.line(-4,c,3,c,ORANGE);for(const x of xs)f.dot(x,c,false,ORANGE);return {svg:f.finish(),readout:`c = ${fmt(c)}. Различных пересечений: ${xs.length}. Вершина отражённой дуги: (−1/2; 9/4). Серый пунктир — исходная отрицательная часть параболы.`};},
      math:{intersections:absIntersections},
      practices:[
        {prompt:'Сколько различных общих точек у y = |x² − 4| и y = 3?',answer:4,hint:'Рассмотри x² − 4 = 3 и x² − 4 = −3.',solution:'x² = 7 или x² = 1. Четыре разных корня: ±√7 и ±1.',proof:'Запиши оба уравнения после раскрытия модуля и проверь, что их корни различны.'},
        {prompt:'Сколько различных общих точек у y = |x² − 4| и y = 4?',answer:3,hint:'Одна из двух ветвей уравнения даёт x² = 0.',solution:'x² = 8 или x² = 0. Получаются −√8, 0, √8: три точки.',proof:'Объясни, почему x = 0 считается один раз.'},
        {prompt:'Сколько различных общих точек у y = |x² − 9| и y = 10?',answer:2,hint:'Проверь, может ли квадрат равняться −1.',solution:'x² = 19 или x² = −1. Второе уравнение не имеет действительных корней; остаются две точки.',proof:'Укажи, какая ветвь уравнения не даёт действительных корней и почему.'}
      ]
    },
    {
      id:'piecewise-boundary',title:'Кусочная функция: чья граничная точка',tasks:[22],
      goal:'Проверь условие каждой ветви перед подсчётом пересечений.',
      source:{label:'Графики в GeoGebra · уроки 4–5: ветви и открытые границы'},
      controls:[{key:'c',label:'c — высота прямой y = c',min:-1,max:5,step:.5,value:2}],
      predict:{question:'f(x) = −x при x < −1; f(x) = 4 − x² при x ≥ −1. Чему равно f(−1)?',choices:['3','1','Оба значения'],answer:0,explain:'При x = −1 работает вторая ветвь: 4 − (−1)² = 3. Первая ветвь требует строгого x < −1.'},
      reason:{question:'Почему между точками (−1; 1) и (−1; 3) нельзя дорисовать вертикальный отрезок?',choices:['Формула не задаёт промежуточные значения при x = −1','Отрезок нужно рисовать другим цветом','Потому что отрицательных x не бывает'],answer:0,explain:'При x = −1 определено только y = 3. Соединяющий отрезок добавил бы точки, которых у функции нет.'},
      render(p){const c=param(p,'c',2),xs=pieceIntersections(c);const f=frame('−x (x < −1); 4 − x² (x ≥ −1)',[-6,4,-5,6]);f.curve(x=>-x,-6,-1);f.curve(x=>4-x*x,-1,4);f.dot(-1,1,true);f.dot(-1,3);f.line(-6,c,4,c,ORANGE);for(const x of xs)f.dot(x,c,false,ORANGE);return {svg:f.finish(),readout:`c = ${fmt(c)}. Различных пересечений: ${xs.length}. В x = −1 включена точка с y = 3, точка с y = 1 исключена. Проверь уровни 1, 3 и 4.`};},
      math:{value:pieceValue,intersections:pieceIntersections},
      practices:[
        {prompt:'f(x) = −x при x < −1; f(x) = 5 − x² при x ≥ −1. Сколько общих точек у графика и прямой y = 4?',answer:3,hint:'Для каждой ветви найди корни и проверь условие на x.',solution:'Линейная ветвь даёт x = −4. Параболическая даёт x = −1 и x = 1; оба допустимы. Всего три точки.',proof:'Запиши условие допустимости рядом с каждым найденным корнем.'},
        {prompt:'f(x) = −x при x < −2; f(x) = 10 − x² при x ≥ −2. Сколько общих точек у графика и прямой y = 10?',answer:2,hint:'На уровне вершины парабола даёт одну точку.',solution:'Линейная ветвь: x = −10 < −2. Параболическая: x = 0 ≥ −2. Всего две точки.',proof:'Укажи, почему вершина не даёт двух различных корней.'},
        {prompt:'f(x) = −x при x < −2; f(x) = 10 − x² при x ≥ −2. Сколько общих точек у графика и прямой y = 2?',answer:1,hint:'Корень x = −2 не входит в линейную ветвь. Проверь оба корня параболы.',solution:'Линейный кандидат −2 исключён. Для параболы x = ±√8, но −√8 < −2. Остаётся √8: одна точка.',proof:'Объясни отдельно отклонение каждого недопустимого кандидата.'}
      ]
    },
    {
      id:'cancelled-hole',title:'Сократили дробь — сохранили отверстие',tasks:[22],
      goal:'Найди одно пересечение без касания: второй кандидат попадает в запрещённую точку.',
      source:{label:'Графики в GeoGebra · урок 6: сокращение и прямая y = kx'},
      controls:[{key:'k',label:'k — наклон прямой y = kx',min:-1,max:2,step:.25,value:.5}],
      predict:{question:'y = (x − 2)/(x² − 2x). При k = 1/4 сколько общих точек с y = kx?',choices:['Одна','Две','Ни одной'],answer:0,explain:'После сокращения 1/x = x/4 даёт x = −2 и x = 2. Но x = 2 запрещён исходным знаменателем.'},
      reason:{question:'Почему единственное пересечение здесь не означает касание?',choices:['Второй корень исключён областью определения','Любая прямая касается гиперболы','При сокращении можно удалить любой корень'],answer:0,explain:'Полная гипербола и прямая имеют две общие точки. Исходная дробь отличается от гиперболы отверстием (2; 1/2).'},
      render(p){
        const k=param(p,'k',.5),xs=holeIntersections(k),radius=xs.length?Math.max(...xs.map(Math.abs)):0;
        // Fit ordinary intersections; retain a readable local window for very distant roots.
        const extent=radius<=40?Math.max(5,Math.ceil(radius*1.2)):5;
        const visible=xs.filter(x=>Math.abs(x)<=extent),hidden=xs.length-visible.length;
        const f=frame('y = (x − 2)/(x² − 2x)',[-extent,extent,-3,3]);
        f.line(0,-3,0,3,GRAY,true);f.curve(x=>1/x,-extent,-.001);f.curve(x=>1/x,.001,extent);f.curve(x=>k*x,-extent,extent,ORANGE);
        for(const x of visible)f.dot(x,1/x,false,ORANGE);f.dot(2,.5,true);
        if(hidden){f.outside();f.caption(`${hidden} пересечения вне окна`);}
        const nearHole=k!==.25&&visible.some(x=>Math.abs(x-2)<.03);
        if(nearHole)f.caption('Пересечение рядом с отверстием');
        return {svg:f.finish(),readout:`k = ${fmt(k)}. Общих точек: ${xs.length}. После сокращения y = 1/x, но x ≠ 0 и x ≠ 2. Отверстие: (2; 1/2). Особый наклон: k = 1/4. Окно по x: от ${fmt(-extent)} до ${fmt(extent)}.`+
          (hidden?` Все ${hidden} пересечения за пределами окна: x = ±1/√k ≈ ±${approx(radius)}. Стрелки показывают их направление.`:'')+
          (nearHole?' Положительный корень очень близок к 2, но не равен 2. На рисунке отметки почти совпадают; пересечений по-прежнему два.':'')};
      },
      math:{value:holeValue,intersections:holeIntersections},
      practices:[
        {prompt:'y = (x − 3)/(x² − 3x). Сколько общих точек с прямой y = x/9?',answer:1,hint:'Сначала выпиши запрещённые x. Затем реши 1/x = x/9.',solution:'Запрещены x = 0 и x = 3. Уравнение даёт x = ±3; допустим только −3. Одна точка.',proof:'Сохрани ОДЗ исходной дроби и проверь каждый корень.'},
        {prompt:'y = (x − 4)/(x² − 4x). Сколько общих точек с прямой y = x/9?',answer:2,hint:'Отверстие теперь находится при x = 4. Где находятся корни?',solution:'Запрещены x = 0 и x = 4. Корни x = ±3 оба допустимы. Две точки.',proof:'Объясни, почему наличие отверстия само по себе не уменьшает число пересечений.'},
        {prompt:'y = (x − 5)/(x² − 5x). Сколько общих точек с прямой y = −x?',answer:0,hint:'Равенство 1/x = −x приведи к уравнению для x².',solution:'При x ≠ 0 получаем x² = −1. Действительных корней нет; общих точек 0.',proof:'Укажи ОДЗ и обоснуй отсутствие действительных решений.'}
      ]
    }
  ];
  return lessons;
});
