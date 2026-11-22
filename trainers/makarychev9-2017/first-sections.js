(function () {
  'use strict';
  const {add, example, task} = window.MathExamTopicPractice;
  function question(prompt, answer, working, reminder, mistakes) {
    return {...task(prompt, answer, working, reminder), mistakes};
  }
  function diagram(data) {
    if (data.chart==='rootSigns') {
      const [even,odd]=data.rows;
      return '<svg viewBox="0 0 286 130" role="img" aria-label="Знак чётной и нечётной степени. Слева две противоположные величины, справа знаки результатов"><g fill="none" stroke="#276a66" stroke-width="2"><path d="M45 33L215 34M45 97L215 34M45 97H215" stroke-dasharray="4 3"/></g><g fill="#233e49" font-size="13"><text x="8" y="32">+u</text><text x="8" y="100">−u</text><text x="225" y="37">+ число</text><text x="225" y="100">− число</text><text x="68" y="21">степень '+even[0]+'</text><text x="69" y="83">степень '+even[0]+'</text><text x="69" y="116">степень '+odd[0]+'</text></g></svg>';
    }
    if (data.chart==='powerPath') {
      const [[base,m,n]]=data.rows;
      return '<svg viewBox="0 0 286 105" role="img" aria-label="От основания сначала перейди к положительному корню указанной степени, затем возведи результат в целую степень"><g fill="none" stroke="#276a66" stroke-width="2"><path d="M53 54H116L110 49M116 54L110 59 M161 54H241L235 49M241 54L235 59"/></g><g fill="#233e49" text-anchor="middle" font-size="14"><text x="28" y="59">'+base+'</text><text x="142" y="59">u</text><text x="262" y="59">v</text><text x="85" y="36">корень '+n+'-й</text><text x="201" y="36">степень '+m+'</text><text x="142" y="85">u &gt; 0</text></g></svg>';
    }
    if (data.chart==='factors') {
      const [[a,u,v]]=data.rows;
      return '<svg viewBox="0 0 284 135" role="img" aria-label="Таблица раскрытия скобок: умножь множитель строки на множитель столбца, затем учти внешний коэффициент"><g fill="none" stroke="#286b69"><path d="M62 34H268V122H62Z M165 34V122 M62 78H268"/></g><g text-anchor="middle" fill="#20323c" font-size="14"><text x="112" y="24">x</text><text x="215" y="24">'+(-v)+'</text><text x="42" y="60">x</text><text x="42" y="107">'+(-u)+'</text><text x="112" y="62">x²</text><text x="215" y="62">('+(-v)+')x</text><text x="112" y="105">('+(-u)+')x</text><text x="215" y="105">'+(u*v)+'</text><text x="26" y="20">× '+a+'</text></g></svg>';
    }
    const curves = data.curves || (data.joined ? [data.coordinates] : []);
    const pts = curves.length ? curves.flat() : data.coordinates;
    const xs = pts.map(row => row[0]), ys = pts.map(row => row[1]);
    const xmin = Math.min(0, ...xs) - 1, xmax = Math.max(0, ...xs) + 1;
    const ymin = Math.min(0, ...ys) - 1, ymax = Math.max(0, ...ys) + 1;
    const X = n => 32 + (n-xmin)/(xmax-xmin)*224;
    const Y = n => 151 - (n-ymin)/(ymax-ymin)*127;
    const [horizontal,vertical]=data.axes || ['x','y'];
    const axis = '<path d="M24 '+Y(0)+'H264 M'+X(0)+' 15V158" stroke="#4b5865"/><text x="267" y="'+(Y(0)+4)+'">'+horizontal+'</text><text x="'+(X(0)+5)+'" y="14">'+vertical+'</text>';
    const line = curves.map((curve,index)=>'<polyline fill="none" stroke="'+(index && data.compare?'#935118':'#176a66')+'" '+(index && data.compare?'stroke-dasharray="6 3"':'')+' stroke-width="2.5" points="'+curve.map(([x,y])=>X(x)+','+Y(y)).join(' ')+'"/>').join('');
    const guides = data.asymptotes ? '<path d="M'+X(data.asymptotes[0])+' 15V158 M24 '+Y(data.asymptotes[1])+'H264" stroke="#935118" stroke-dasharray="4 3"/>' : '';
    const dots = (curves.length ? (data.marked || pts) : pts).map(([x,y]) => '<circle cx="'+X(x)+'" cy="'+Y(y)+'" r="3.5" fill="#12635d"/>').join('');
    const labels=(data.marked||[]).map(([x,y])=>'<text x="'+X(x)+'" y="'+(Y(y)+(y===0?14:-7))+'" text-anchor="middle"'+(data.labelCoordinates?' style="paint-order:stroke;stroke:#f4faf7;stroke-width:3px;stroke-linejoin:round"':'')+'>'+(data.labelCoordinates?'('+x+'; '+y+')':(y===0?x:y))+'</text>').join('');
    return '<svg viewBox="0 0 283 176" role="img" aria-label="'+data.alt+'"><g font-size="11" fill="#20323c">'+axis+guides+line+dots+labels+'</g></svg>';
  }
  function chart(data, coordinates, joined, alt, marked) {
    return Object.assign(data, {chart:'coordinates', coordinates, joined, alt, marked});
  }
  function point(n, page, title, aim, rule, skill, make) {
    add(50, n, page, title, aim, rule, skill, make);
  }
  window.Makarychev9Practice = {point, question, chart};
  window.MathExamTopicEdition = {
    trainerId:'makarychev9-2017', storePrefix:'math:makarychev9-2017:v1:',
    authors:'Макарычев, Миндюк, Нешков, Суворова · 2017', grade:()=>'9 класс', unit:'пункт',
    source:(_,page)=>'https://pdf.my-uchebnik.ru/pdf/algebra/00000036.pdf#page='+(page+1),
    nextId:l=>l.book+'-'+(l.point+1), figure:diagram
  };
  point(1,5,'Область определения и область значений','Прочитай функцию, заданную отдельными точками, и собери множество её значений.',
    'Каждая строка сопоставляет одному аргументу x одно значение y. Считай различные аргументы и различные значения отдельно. Одно значение может встретиться несколько раз.','m9f-domain',s=>{
    const h=1+s, k=2+s%4;
    const radius=2+s%2, target=s%3===0?k:k+radius*radius;
    const rows=Array.from({length:2*radius+1},(_,i)=>i-radius).map(d=>[h+d,d*d+k]);
    const qs=[
      question('Сколько чисел входит в область значений?',radius+1,'Во втором столбце встречаются '+[...new Set(rows.map(r=>r[1]))].sort((a,b)=>a-b).join(', ')+'.','Во втором столбце зачеркни повторения и сосчитай остальные значения.',[[rows.length,'Ты посчитал строки. Точки с одинаковой высотой дают одно и то же значение y.']]),
      question('Чему равно значение функции при x = '+h+'?',k,'Найди строку, где первый столбец равен '+h+'. Прочитай второй столбец.','Сначала ищи данное число среди аргументов. Затем двигайся по строке вправо.',[]),
      question('Сколько аргументов дают значение '+target+'?',target===k?1:2,'Проведи горизонталь на уровне '+target+'. Посчитай точки на ней.','Посчитай все совпадения в столбце y.',target===k?[[2,'У большинства высот есть пара точек. Проверь высоту самой нижней.']]:[[1,'Найдена одна точка. Проверь ту же высоту по другую сторону середины.']])
    ];
    return chart(example('Функция задана только парами из таблицы. Каждая точка соответствует строке.',['x','y'],rows,qs), rows,false,'Отдельные точки. Координаты даны в таблице.');
  });
  point(2,14,'Нули, рост и убывание','Прочитай нули и самую высокую точку графика на заданном промежутке.',
    'Двигайся по графику слева направо. Там, где линия поднимается, функция возрастает. В самой высокой точке отметь отдельно её абсциссу и ординату. В нуле функции ордината равна нулю.','m9f-read-graph',s=>{
    const start=1+s, width=2+s%3, height=width+5, top=start+width, end=top+width;
    const last=s%2, rows=[[start,0],[top,height],[end,last]];
    const qs=[
      question('При каком x функция достигает наибольшего значения?',top,'В средней строке самое большое y. Соответствующий аргумент x равен '+top+'.','У наивысшей точки спросят либо x, либо y. Здесь ищи x.',height===top?[]:[[height,'Это высота вершины. Найди абсциссу той же точки в первом столбце.']]),
      question('Сколько нулей у этой функции на показанном промежутке?',last===0?2:1,'Проверь строки, где y равно нулю. Между вершинами ломаная выше оси x.','Ищи все точки, у которых y = 0.',last===0?[[1,'Проверь оба конца промежутка: оба включены.']]:[[2,'У правой точки положительная высота. Проверь её ординату в таблице.']]),
      question('На сколько единиц увеличился аргумент за весь участок возрастания?',width,'Вычти абсциссу начала роста из абсциссы вершины: '+top+' − '+start+'.','Нужно горизонтальное расстояние от левого конца до вершины.',[[height,'Это изменение высоты. Измерь расстояние от начала роста до вершины по оси x.']])
    ];
    return chart(example('Соседние точки соединены отрезками. Функция определена от первого до последнего x включительно.',['x','y'],rows,qs),rows,true,'Ломаная с одной вершиной. Координаты всех трёх вершин даны в таблице.');
  });
  point(3,22,'Корни квадратного трёхчлена','Определи оба корня и проверь свободный член квадратного трёхчлена.',
    'Корнем называют значение x, при подстановке которого трёхчлен становится равным нулю. На графике это абсцисса пересечения с осью x. Для проверки подставь оба числа в выражение.','m9f-discriminant',s=>{
    const a=2+s%3, u=-(1+s%4), v=2+s%5, b=-a*(u+v), c=a*u*v;
    const fn=x=>a*x*x+b*x+c;
    const marked=[[u,0],[0,c],[v,0]];
    const coords=Array.from({length:81},(_,i)=>{const x=u-0.5+(v-u+1)*i/80;return [x,fn(x)];});
    const qs=[
      question('Вычисли меньший корень трёхчлена.',u,'Раздели на '+a+' и подбери два числа с произведением '+(c/a)+' и суммой '+(-b/a)+'. Меньшее из них '+u+'.','У корней разные знаки, так как их произведение отрицательно.',[[v,'Это правое пересечение с осью x. Для меньшего корня проверь левое.']]),
      question('Вычисли больший корень трёхчлена.',v,'Кандидат '+v+' даёт '+a+' · '+v+'² + ('+b+') · '+v+' + ('+c+') = 0.','Положительный корень лежит справа от оси y.',[[u,'Это меньший корень. Второй находится по другую сторону от нуля.']]),
      question('Найди произведение корней.',u*v,'После деления на старший коэффициент свободный член равен '+c+' / '+a+'.','Для ax²+bx+c произведение корней равно c/a.',[[c,'Это свободный член исходного трёхчлена. Раздели его на старший коэффициент.']])
    ];
    return chart(example('Коэффициенты трёхчлена ax²+bx+c. На графике отмечены два нуля и пересечение с осью y.',['a','b','c'],[[a,b,c]],qs),coords,true,'Парабола пересекает ось x в двух точках по разные стороны от нуля.',marked);
  });
  point(4,27,'Разложение трёхчлена на множители','Восстанови трёхчлен по двум корням и старшему коэффициенту.',
    'Запиши a(x−u)(x−v), где u и v — корни. Чтобы проверить разложение, раскрой скобки. Коэффициент при x равен −a(u+v), а свободный член равен auv.','m9f-grouping',s=>{
    const a=2+s%3,u=-(1+s%4),v=4+s%3;
    const b=a*(-u-v),c=a*u*v;
    return example('Строим трёхчлен в форме a(x−u)(x−v). Используй данные двух корней и старшего коэффициента.',['a','Корень u','Корень v'],[[a,u,v]],[
      question('В первой скобке запишем x + m, чтобы при x = u скобка обращалась в нуль. Чему равно m?',-u,'Подставь '+u+' в x+m и реши '+u+' + m = 0.','Проверка скобки: подставь её корень, должно получиться ноль.',[[u,'В скобку записан сам корень. Проверь сумму u + u. Какое число даст с u ноль?']]),
      question('Найди коэффициент при x после раскрытия скобок.',b,'Произведения с одним x дают −a(u+v)x. Здесь −'+a+' · ('+u+' + '+v+') = '+b+'.','Собери оба произведения, в которых есть ровно одна переменная x.',u+v===0?[]:[[-b,'Модуль совпал. При раскрытии обеих скобок используй знак перед каждым корнем.']]),
      question('Найди свободный член трёхчлена.',c,'Подставь x=0: '+a+' · ('+(-u)+') · ('+(-v)+') = '+c+'.','В свободном члене остаются постоянные из обеих скобок и множитель a.',[[u*v,'Это произведение корней. Вспомни внешний множитель перед скобками.']])
    ],'factors');
  });
})();
