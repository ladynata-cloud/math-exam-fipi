(function () {
  'use strict';
  const course=window.MathExamTopicEdition,{register,q}=course,{example,f}=window.MathExamTopicPractice,prior=course.figure;
  const keys='abcdef',letters='абвгде',show=x=>f(x).replace('-','−');
  const tx=(x,y,v,anchor='start')=>'<text x="'+x+'" y="'+y+'" text-anchor="'+anchor+'">'+v+'</text>';
  course.figure=d=>{
    if(d.chart==='removable-line'){
      const z=d.k,px=140,py=67;
      return '<svg viewBox="0 0 272 125" role="img" aria-label="Прямая со снятой точкой исходной дробной функции"><g font-family="sans-serif" font-size="12" fill="#264549"><path d="M24 39H236 M80 10V98" stroke="#8fa89e"/><path d="M30 16L207 98" stroke="#3b8170" stroke-width="2" fill="none"/><circle cx="'+px+'" cy="'+py+'" r="5" fill="white" stroke="#a44f35" stroke-width="2"/>'+tx(153,63,'('+z+'; −'+z+')')+tx(8,117,'Пустая точка не принадлежит графику.')+'</g></svg>';
    }
    if(d.chart==='domain-line'){
      const all=[...d.roots,d.probe,d.at,0],lo=Math.min(...all)-2,hi=Math.max(...all)+2,pos=x=>17+238*(x-lo)/(hi-lo);
      const points=d.roots.map(v=>'<circle cx="'+pos(v)+'" cy="58" r="5" fill="white" stroke="#b25839" stroke-width="2"/>'+tx(pos(v),82,show(v),'middle')).join('');
      return '<svg viewBox="0 0 273 119" role="img" aria-label="Запрещённые аргументы на числовой прямой"><g font-family="sans-serif" font-size="12" fill="#20464b">'+tx(9,18,'Пустые точки исключены из области')+'<path d="M15 58H257m-6 -3 6 3-6 3" fill="none" stroke="#337b6a" stroke-width="2"/>'+points+tx(10,109,'Подстановка для проверки: x = '+show(d.probe))+'</g></svg>';
    }
    if(d.chart==='domain-plane'){
      const title=d.axes?'Запрещены координатные оси':'Запрещены две диагонали';
      const X=x=>110+57*x/d.scale,Y=y=>58-43*y/d.scale;
      const axes='<path d="M39 58H181 M110 9V104" fill="none" stroke="'+(d.axes?'#a34936':'#9cb0aa')+'" stroke-width="'+(d.axes?2:1)+'"/>';
      const diag=d.axes?'':'<path d="M53 101L167 15 M53 15L167 101" fill="none" stroke="#a34936" stroke-width="2"/>';
      const pins=d.pairs.map(([x,y],i)=>'<circle cx="'+X(x)+'" cy="'+Y(y)+'" r="4" fill="'+(d.allowed[i]?'#348477':'white')+'" stroke="'+(d.allowed[i]?'#226c60':'#a34936')+'"/>').join('');
      return '<svg viewBox="0 0 272 122" role="img" aria-label="'+title+'"><g font-family="sans-serif" font-size="11" fill="#264549">'+axes+diag+pins+tx(185,62,'x')+tx(115,14,'y')+tx(7,116,title)+
        '</g></svg>';
    }
    return prior(d);
  };
  function polynomial(spec,s){
    const k=2+s,b=k+2;let expression,roots,den;
    switch(spec){
      case 'square-difference':expression='x² − '+k*k;roots=[-k,k];den=x=>x*x-k*k;break;
      case 'two-positive':expression='(x − '+k+')(x − '+b+')';roots=[k,b];den=x=>(x-k)*(x-b);break;
      case 'positive-square':expression='x² + '+k;roots=[];den=x=>x*x+k;break;
      case 'nested':expression='x − '+k*k+'/x';roots=[-k,0,k];den=x=>x-k*k/x;break;
      case 'absolute':expression='|x| − '+k;roots=[-k,k];den=x=>Math.abs(x)-k;break;
      case 'absolute-pair':expression='x² − '+k+'|x|';roots=[-k,0,k];den=x=>x*x-k*Math.abs(x);break;
      case 'constant':expression=String(k);roots=[];den=()=>k;break;
      case 'opposite-roots':expression='(x + '+k+')(x − 2)';roots=[-k,2];den=x=>(x+k)*(x-2);break;
      case 'cube':expression='x³ − '+k*k+'x';roots=[-k,0,k];den=x=>x*(x*x-k*k);break;
      case 'cube-linear':expression='(2x + 1)³ − '+k*k+'(2x + 1)';roots=[(-k-1)/2,-.5,(k-1)/2];den=x=>(2*x+1)*((2*x+1)**2-k*k);break;
      case 'twice':expression='4x² − '+k*k;roots=[-k/2,k/2];den=x=>4*x*x-k*k;break;
      case 'zero-and-root':expression='x² − '+k+'x';roots=[0,k];den=x=>x*(x-k);break;
      case 'removable':expression=k+' − x';roots=[k];den=x=>k-x;break;
      case 'linear-pair':expression='(2x + '+k+')(x − 1)';roots=[-k/2,1];den=x=>(2*x+k)*(x-1);break;
      case 'one':expression='x − '+k;roots=[k];den=x=>x-k;break;
      default:throw Error('Unknown domain model '+spec);
    }
    return {expression,roots,den,k};
  }
  function line(spec,s,construction=false){
    const {expression,roots,den,k}=polynomial(spec,s),at=k+3,probe=roots.length&&s%2?roots[s%roots.length]:at,ok=Number(!roots.includes(probe)),value=den(at);
    const clauses=roots.length?'Запрещённые значения: '+roots.map(show).join(', ')+'.':'Ни одно действительное значение не исключается.';
    const q0=construction?'Сколько различных чисел надо исключить при таком построении знаменателя?':'Сколько различных аргументов надо исключить из области?';
    const other=roots.length===0?1:roots.length-1;
    return Object.assign(example(construction?'Проверь построенную дробь 1/('+expression+').':spec==='removable'?'Исследуй g(x) = (x² − '+k+'x)/('+expression+'). На допустимых аргументах g(x) = −x.':'Исследуй знаменатель '+expression+'.',[ 'Сведения','Значение'],[['Знаменатель',expression],['Пробный аргумент',show(probe)],['Контрольный аргумент',show(at)]],[
      q(q0,roots.length,clauses,spec==='nested'?'Учитывай внутреннее и внешнее деления.':'Найди все разные корни знаменателя.',other,spec==='nested'?'Внутренняя дробь запрещает ещё x = 0.':roots.length?'Сохрани оба знака у квадратов и каждый отдельный множитель.':'Этот знаменатель нигде не обращается в ноль.'),
      q('Можно ли подставить x = '+show(probe)+'? Введи 1 для «да» или 0 для «нет».',ok,clauses+' Проверяем принадлежность '+show(probe)+' этому списку.','Ограничения действуют ещё до возможного сокращения.',1-ok,ok?'Этот аргумент оставляет все деления определёнными.':'Исходная дробь теряет смысл. Сокращение или нулевой числитель этого не исправят.'),
      q('Вычисли числовой знаменатель при допустимом x = '+at+'.',value,'Подставь '+at+' в '+expression+'. Получаем '+show(value)+'.','Вычисли знаменатель целиком, включая внутреннее деление.',0,'Это контрольный допустимый аргумент. Его знаменатель обязан быть ненулевым.')
    ],spec==='removable'?'removable-line':'domain-line'),{family:'domain-line',spec,k,roots,probe,at});
  }
  function plane(axes,s){
    const a=s+2,b=a+2,pairs=[[a,a],[a,-a],[a,0],[0,0],[a,b]],D=(x,y)=>axes?2*x*y:x*x-y*y,allowed=pairs.map(([x,y])=>D(x,y)!==0);
    const probe=s%pairs.length,[px,py]=pairs[probe],ok=Number(allowed[probe]);
    return Object.assign(example('Исследуй дробь '+(axes?'(x² − y²)/(2xy).':'2xy/(x² − y²).')+' Допустимость зависит от пары.', ['x','y'],pairs,[
      q('Сколько допустимых пар в таблице?',allowed.filter(Boolean).length,axes?'Обходи обе координатные оси: каждая координата должна быть ненулевой.':'Исключаются обе диагонали: x = y и x = −y.','Проверь знаменатель у каждой пары.',5,'Среди данных пар есть такие, у которых знаменатель нулевой.'),
      q('Можно ли взять пару ('+px+'; '+py+')? Введи 1 для «да» или 0 для «нет».',ok,'Знаменатель после подстановки равен '+D(px,py)+'.','Смотри на знаменатель исходной дроби.',1-ok,axes?'Для нулевого произведения достаточно хотя бы одной нулевой координаты.':'Равные по модулю координаты дают одинаковые квадраты.'),
      q('Каков знаменатель в последней строке?',D(a,b),axes?'2 · '+a+' · '+b+' = '+D(a,b)+'.':a+'² − '+b+'² = '+D(a,b)+'.','Вычисли указанную нижнюю строку для последней пары.',-D(a,b),'Это противоположное число. Проверь порядок квадратов или знак произведения.')
    ],'domain-plane'),{family:'domain-plane',axes,pairs,allowed,scale:b,probe});
  }
  const cases=[
    [11,[
      ['Разность квадратов в знаменателе','12/(x² − 81)','x² − 81 = (x − 9)(x + 9). Разрешены все действительные x, кроме −9 и 9.','square-difference'],
      ['Два положительных запрещённых корня','(x² + 1)/(x² − 9x + 14)','Знаменатель равен (x − 2)(x − 7). Запрещены 2 и 7, остальные действительные числа допустимы.','two-positive'],
      ['Положительная сумма квадрата и числа','(x² − 25)/(x² + 25)','Знаменатель x² + 25 ≥ 25. Подходит каждое действительное x, в том числе −5 и 5, когда нулю равен числитель.','positive-square'],
      ['Ограничения вложенной дроби','1/(x − 4/x)','Внутреннее деление требует x ≠ 0. Внешний знаменатель обнуляется при x² = 4. Итог: исключаются −2, 0 и 2.','nested']]],
    [12,[
      ['Модуль в знаменателе','3y/(|y| − 1)','Из |y| = 1 получаем −1 и 1. Все остальные значения допустимы.','absolute'],
      ['Квадрат и модуль','2/(y² − 5|y|)','Положи t = |y|. Тогда y² − 5|y| = t(t − 5). Запрещены −5, 0 и 5.','absolute-pair'],
      ['Постоянный знаменатель','(5y − 10)/3','Знаменатель 3 никогда не равен нулю. Допустимо любое действительное y.','constant'],
      ['Квадратный трёхчлен','y/(y² + 2y − 3)','Знаменатель (y + 3)(y − 1) задаёт исключения −3 и 1.','opposite-roots'],
      ['Три корня кубического знаменателя','18/(y³ − 64y)','Из y(y − 8)(y + 8) = 0 следуют три исключения: −8, 0 и 8.','cube'],
      ['Сначала ограничения, затем сокращение','(2y − 1)/((2y + 1)³ − (8y + 4))','Знаменатель раскладывается в (2y + 1)(2y − 1)(2y + 3). Запрещены −3/2, −1/2 и 1/2. Даже после сокращения множителя 2y − 1 значение 1/2 остаётся исключённым.','cube-linear']]],
    [13,[
      ['Квадратная числовая запись сверху','(4x² − 1)/4','Знаменатель постоянен и равен 4. Все действительные значения x допустимы.','constant'],
      ['Две половины как границы','4/(4x² − 1)','В знаменателе (2x − 1)(2x + 1). Исключаются −1/2 и 1/2.','twice'],
      ['Две исключённые диагонали','2xy/(x² − y²)','Знаменатель (x − y)(x + y) ненулевой, когда x ≠ y и x ≠ −y. Например, (0; 1) разрешена, (1; −1) запрещена.','diagonals'],
      ['Две исключённые оси','(x² − y²)/(2xy)','Обе координаты должны быть ненулевыми: x ≠ 0 и y ≠ 0. Равные ненулевые x и y дают допустимый нулевой числитель.','axes']]],
    [14,[
      ['Функция с двумя исключениями','f(x) = −1/(x² − x)','x(x − 1) = 0 при 0 или 1. Все остальные числа входят в область определения.','zero-and-root'],
      ['Прямая с выколотой точкой','g(x) = (x² − x)/(1 − x)','Можно сократить выражение до −x только при x ≠ 1. Исходная функция не определена в точке x = 1.','removable'],
      ['Кубическое выражение и число','α(x) = (x − x³)/3','Многочлен сверху допустим при любом x. Деление на постоянное 3 не ограничивает аргумент.','constant'],
      ['Функция с линейными множителями','β(x) = (2x − 1)/(2x² − x − 1)','Нижняя строка равна (2x + 1)(x − 1). Исключаются −1/2 и 1.','linear-pair']]],
    [15,[
      ['Сконструировать одно исключение','исключить 5','Подходит, например, 1/(x − 5). Знаменатель обнуляется ровно при 5.','one'],
      ['Сконструировать пару исключений','исключить −4 и 4','Подходит 1/(x² − 16), так как x² − 16 = (x − 4)(x + 4).','square-difference'],
      ['Сконструировать три исключения','исключить −1, 0 и 1','Подходит 1/[x(x − 1)(x + 1)]. Других корней знаменатель не имеет.','cube'],
      ['Сконструировать область без исключений','разрешить каждое действительное число','Подходит 1/(x² + 1). Квадрат неотрицателен, знаменатель не меньше единицы.','positive-square']]]
  ];
  cases.forEach(([n,rows])=>rows.forEach(([title,expr,guide,spec],i)=>register(n+keys[i],n+letters[i],9,title,
    n===15?'Составь пример дробного выражения со следующим требованием: '+expr+'.':'Определи допустимые аргументы для '+expr+'.',guide,
    'Начни с исходных знаменателей. Каждый из них должен быть определён и отличен от нуля. Числитель отдельно на ненулевость не проверяется.',
    s=>spec==='diagonals'||spec==='axes'?plane(spec==='axes',s):line(spec,s,n===15))));
})();
