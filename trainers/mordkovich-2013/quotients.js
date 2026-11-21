(function () {
  'use strict';
  const {add,lessons,example,f}=window.MathExamTopicPractice,course=window.MathExamTopicEdition;
  const records=[
    ['7-3a','7.3а','Единица под общим знаменателем','1/cos²t − 1','cos','tan','Запиши единицу как cos²t/cos²t. Останется (1 − cos²t)/cos²t = sin²t/cos²t = tg²t. Нужен ненулевой косинус.'],
    ['7-3b','7.3б','Когда можно сократить cos²t','(1 − sin²t)/cos²t','cos','one','Числитель равен cos²t. После сокращения получается 1, но при cos t = 0 исходная дробь по-прежнему не имеет значения.'],
    ['7-3c','7.3в','Минус после приведения к дроби','1 − 1/sin²t','sin','negcot','Числитель при общем знаменателе равен sin²t − 1 = −cos²t. Итог −ctg²t при sin t ≠ 0.'],
    ['7-3d','7.3г','Частное двух остатков','(1 − cos²t)/(1 − sin²t)','cos','tan','Замени числитель на sin²t, знаменатель — на cos²t. Получается tg²t при cos t ≠ 0.'],
    ['7-4a','7.4а','Квадрат суммы и исключённые точки','(sin t + cos t)²/(1 + 2 sin t cos t)','sum','one','В квадрате суммы появляются sin²t + cos²t и удвоенное произведение. Это тот же знаменатель. Ответ 1 при sin t ≠ −cos t.'],
    ['7-4b','7.4б','Квадрат разности и исключённые точки','(1 − 2 sin t cos t)/(cos t − sin t)²','diff','one','В числителе замени 1 на sin²t + cos²t и сверни разность в квадрат. Значение 1 сохраняется только при cos t ≠ sin t.'],
    ['7-5a','7.5а','Разложить квадрат косинуса','cos²t/(1 − sin t) − sin t','top','one','Вместо cos²t запиши (1 − sin t)(1 + sin t). Сокращение даёт 1 + sin t, затем вычти sin t. Точка sin t = 1 исключена.'],
    ['7-5b','7.5б','Разложить квадрат синуса','sin²t/(1 + cos t) + cos t','left','one','Числитель равен (1 − cos t)(1 + cos t). После сокращения получишь 1 − cos t и добавишь cos t. Допустимы только cos t ≠ −1.'],
    ['7-6a','7.6а','Разность четвёртых степеней','sin⁴t − cos⁴t + 2cos²t','all','one','Разность четвёртых степеней равна (sin²t − cos²t)(sin²t + cos²t). Вторая скобка равна единице. После прибавления 2cos²t останется 1 при любом t.'],
    ['7-6b','7.6б','Постоянная дробь','(2 − sin²t − cos²t)/(3sin²t + 3cos²t)','all','third','В числителе из двух вычти целое и получи 1. Знаменатель равен 3 · 1. Значение всегда равно 1/3.'],
    ['7-6c','7.6в','Свернуть квадрат суммы квадратов','sin⁴t + cos⁴t + 2sin²t cos²t','all','one','Обозначь квадраты через a и b. Выражение a² + b² + 2ab равно (a + b)². Сумма a + b равна 1, поэтому результат 1 при любом t.'],
    ['7-6d','7.6г','Сокращение с сохранением ограничения','(sin⁴t − cos⁴t)/(sin²t − cos²t)','diagonals','one','Числитель равен произведению разности и суммы квадратов координат. При sin²t ≠ cos²t разность сокращается, остаётся 1. Все четыре точки диагоналей исключены.'],
    ['7-12a','7.12а','Привести к общему синусу','ctg t − (cos t − 1)/sin t','sin','csc','Подставь ctg t = cos t/sin t. При раскрытии скобок в числителе cos t − cos t + 1 = 1. Ответ 1/sin t при sin t ≠ 0.'],
    ['7-12b','7.12б','Нулевая разность с ограничением','ctg²t − (1/sin²t − 1)','sin','zero','При sin t ≠ 0 запиши ctg²t как cos²t/sin²t. Выражение в скобках тоже равно (1 − sin²t)/sin²t. Остаётся 0 только на исходной области.'],
    ['7-12c','7.12в','Единица и квадрат котангенса','cos²t − (ctg²t + 1)sin²t','sin','negsin2','При sin t ≠ 0 сумма 1 + ctg²t равна 1/sin²t. Умножение на sin²t даёт 1. Итог cos²t − 1 = −sin²t.'],
    ['7-12d','7.12г','Две отрицательные разности','(sin²t − 1)/(cos²t − 1) + tg t · ctg t','both','csc2','В первой дроби оба минуса исчезнут и получится ctg²t. Второе слагаемое равно 1. Ответ 1/sin²t, причём sin t и cos t должны быть ненулевыми.'],
    ['7-13a','7.13а','Сумма с сопряжёнными знаменателями','sin t/(1 + cos t) + sin t/(1 − cos t)','sin','twoCsc','Общий знаменатель 1 − cos²t равен sin²t. Числитель после сложения равен 2sin t. Получаем 2/sin t при sin t ≠ 0.'],
    ['7-13b','7.13б','Умножить квадрат котангенса на разность','ctg²t · (cos²t − 1) + 1','sin','sin2','Замени разность в скобках на −sin²t. При sin t ≠ 0 произведение равно −cos²t. Остаётся sin²t.'],
    ['7-13c','7.13в','Сумма дробей с косинусом','cos t/(1 + sin t) + cos t/(1 − sin t)','cos','twoSec','Знаменатели в произведении дают cos²t. В числителе после сложения 2cos t. Сократи до 2/cos t, сохранив cos t ≠ 0.'],
    ['7-13d','7.13г','Обратные отношения в дроби','(tg t + 1)/(1 + ctg t)','bothsum','tg','Положи u = tg t. Тогда ctg t = 1/u. Получается (u + 1)/((u + 1)/u) = u. Помимо ненулевых sin t и cos t требуется u ≠ −1. Ответ tg t.'],
    ['7-14a','7.14а','Котангенс в дроби из двух вычитаний','(1 − sin²t)/(1 − cos²t) + tg t · ctg t','both','csc2','Первая дробь равна cos²t/sin²t, второе слагаемое равно 1. Приведи к общему знаменателю: итог 1/sin²t. Сохрани оба исходных запрета sin t ≠ 0, cos t ≠ 0.'],
    ['7-14b','7.14б','Шестая степень отношения','(cos²t − ctg²t)/(sin²t − tg²t)','both','cot6','При ненулевых координатах числитель равен −cos⁴t/sin²t, знаменатель — −sin⁴t/cos²t. Переверни вторую дробь и умножь: остаётся ctg⁶t.'],
    ['7-15a','7.15а','Доказать равенство делением на котангенс','(cos t + ctg t)/ctg t','both','plusSin','Раздели каждое слагаемое на ctg t. Дробь cos t/ctg t равна sin t. Вторая часть даёт 1. Оба отношения определены при ненулевых sin t и cos t.','1 + sin t'],
    ['7-15b','7.15б','Доказать равенство двух дробей','(1 − sin t)/cos t','cos','halfRatio','Умножь числитель и знаменатель на 1 + sin t. Разность 1 − sin²t равна cos²t. После сокращения получишь cos t/(1 + sin t). Нужен cos t ≠ 0.','cos t/(1 + sin t)'],
    ['7-15c','7.15в','Доказать равенство делением на тангенс','(sin t + tg t)/tg t','both','plusCos','Раздели слагаемые на tg t. Для первого получится cos t, для второго 1. Запреты из исходной дроби сохраняются: sin t ≠ 0 и cos t ≠ 0.','1 + cos t'],
    ['7-15d','7.15г','Сопряжённый множитель для косинуса','sin t/(1 − cos t)','sin','halfCot','Домножь дробь на (1 + cos t)/(1 + cos t). В знаменателе возникнет sin²t. Сокращение на sin t даёт (1 + cos t)/sin t при sin t ≠ 0.','(1 + cos t)/sin t'],
    ['7-16a','7.16а','Два сложных выражения в одной дроби','((sin t + cos t)² − 1)/(ctg t − sin t cos t)','both','twoTanSq','Числитель после раскрытия скобок равен 2sin t cos t. Внизу вынеси cos t и приведи к общему знаменателю: получится cos³t/sin t. Ответ 2tg²t при ненулевых координатах.','2tg²t'],
    ['7-16b','7.16б','Сумма однородных кубов и произведений','sin³t(1 + ctg t) + cos³t(1 + tg t)','both','sumSC','Раскрой скобки. Сгруппируй sin³t + sin t cos²t и cos³t + cos t sin²t. Из первой пары вынеси синус, из второй — косинус. Останется sin t + cos t при ненулевых координатах.','sin t + cos t']
  ];
  const bad={cos:[2,6],sin:[0,4],sum:[3,7],diff:[1,5],top:[2],left:[4],all:[],diagonals:[1,3,5,7],both:[0,2,4,6],bothsum:[0,2,3,4,6,7]};
  const rule={cos:'cos t ≠ 0',sin:'sin t ≠ 0',sum:'sin t ≠ −cos t',diff:'cos t ≠ sin t',top:'sin t ≠ 1',left:'cos t ≠ −1',all:'любой t',diagonals:'sin²t ≠ cos²t',both:'sin t · cos t ≠ 0',bothsum:'sin t · cos t ≠ 0; tg t ≠ −1'};
  const ticks=['0','π/4','π/2','3π/4','π','5π/4','3π/2','7π/4'];
  const triples=[[3,4,5],[5,12,13],[8,15,17],[7,24,25],[20,21,29],[12,35,37],[9,40,41],[28,45,53],[11,60,61],[16,63,65],[33,56,65]];
  function sample(row,seed){
    const [,,,expression,domain,form,proof]=row,[y,x,r]=triples[seed-1];
    const s=seed%2?-y:y,c=seed%3?-x:x;
    const angles=[seed%8,(seed+2)%8,(seed+3)%8],blocked=angles.filter(k=>bad[domain].includes(k)),ok=3-blocked.length;
    const sin=s/r,cos=c/r;
    const value={tan:(s/c)**2,negcot:-((c/s)**2),third:1/3,one:1,csc:1/sin,zero:0,negsin2:-(sin*sin),csc2:1/(sin*sin),twoCsc:2/sin,sin2:sin*sin,twoSec:2/cos,tg:s/c,cot6:(c/s)**6,plusSin:1+sin,halfRatio:(1-sin)/cos,plusCos:1+cos,halfCot:sin/(1-cos),twoTanSq:2*(s/c)**2,sumSC:sin+cos};
    const raw=value[form];
    const scale=seed+2,offset=(seed%4)+2;
    const questions=[
      {prompt:'Рассмотри три угла '+angles.map(k=>ticks[k]).join(', ')+'. Для скольких исходное выражение определено?',
       answer:ok, calculation:'Условие допустимости: '+rule[domain]+'. '+(blocked.length?'Исключаем '+blocked.map(k=>ticks[k]).join(', ')+'.':'Все три угла допустимы.'),
       error:'Проверяй знаменатель исходной записи до сокращения. Каждая приведённая точка считается один раз.',
       mistakes:[[4,'В списке ровно три угла. Перечисли их и проверь каждый по отдельности.'],...(ok===3?[[0,'Наличие дроби само по себе не исключает все углы. Подставь координаты каждой из трёх точек.']]:[[3,'По крайней мере один из указанных углов обращает исходный знаменатель в ноль. Найди его до сокращения.']])]},
      {prompt:'Обозначь исходное выражение через E. Для данных координат найди '+scale+' · E.',
       answer:scale*raw,calculation:proof+' Для данной точки E = '+f(raw)+'. Умножение на '+scale+' даёт '+f(scale*raw)+'.',
       error:'Сначала упрости E и подставь обе координаты. Применяй множитель только в конце.',
       mistakes:[[raw,'Ты нашёл значение E. Теперь примени указанный внешний множитель.'],[-scale*raw,'Модуль верен. Перепроверь направление вычитания и знак дроби.']]},
      {prompt:'Для той же допустимой точки вычисли '+offset+' − E. Важно сохранить порядок вычитания.',
       answer:offset-raw,calculation:'Исходное E = '+f(raw)+'. Вычитаем его из '+offset+' и получаем '+f(offset-raw)+'.',
       error:'Если E отрицательно, его вычитание увеличивает исходное число.',
       mistakes:[[offset+raw,'Данные сложены. Нарисуй на числовой прямой действие «вычесть E».'],[raw-offset,'Это разность в обратном порядке. Слева должно стоять '+offset+'.']]}
    ];
    if(form==='zero'){
      questions[1].mistakes=[[1,'Одинаковые дроби вычитаются. Их разность равна нулю, а не единице.']];
      questions[2].mistakes=[[offset-1,'От сдвига нужно отнять значение E. Сначала вычисли разность одинаковых выражений.']];
    }
    if(form==='cot6'){
      const ratio=[2,3,.5,1/3,-2,-.5][(seed-1)%6];
      questions[1]={prompt:'Запиши E в виде степени котангенса. Каким будет показатель?',answer:6,
        calculation:proof,error:'Запиши tan и cot через координаты отдельно вверху и внизу сложной дроби.',
        mistakes:[[4,'При делении на вторую дробь добавится ещё квадрат отношения. Четырёх степеней недостаточно.']]};
      questions[2]={prompt:'Для другого допустимого угла известно ctg t = '+f(ratio)+'. Вычисли исходное E.',
        answer:ratio**6,calculation:'После преобразования E = ctg⁶t. Получается '+f(ratio**6)+'.',
        error:'Сначала возведи новое отношение в квадрат, затем куб этого квадрата.',
        mistakes:[[ratio**2,'Это лишь квадрат отношения. Ещё два таких множителя остались от дроби.']]};
    }
    const data=example('E = '+expression+'. Дана точка: cos t = '+c+'/'+r+', sin t = '+s+'/'+r+'.',
      ['Координата','Значение'],[['cos t',c+'/'+r],['sin t',s+'/'+r]],questions,'domain');
    return Object.assign(data,{domain,s,c,r,angles,expression,scale,offset});
  }
  function diagram(data){
    const disallowed=bad[data.domain];let marks='';
    for(let k=0;k<8;k++){
      const a=k*Math.PI/4,x=75+48*Math.cos(a),y=67-48*Math.sin(a);
      marks+=disallowed.includes(k)?'<path d="M'+(x-4)+' '+(y-4)+'l8 8m0 -8l-8 8" stroke="#9c3e37" stroke-width="2.5"/>':'<circle cx="'+x+'" cy="'+y+'" r="3" fill="#17695b"/>';
    }
    return '<svg viewBox="0 0 280 142" role="img" aria-label="Разрешённые и исключённые положения угла на окружности"><g fill="none" stroke="#789197"><path d="M12 67H139M75 7V127"/><circle cx="75" cy="67" r="48"/></g>'+marks+'<g fill="#26414a" font-size="12"><text x="138" y="70">0</text><text x="80" y="14">π/2</text><text x="12" y="61">π</text><text x="79" y="127">3π/2</text><text x="152" y="28">Условие</text><text x="152" y="49">'+(data.domain==='bothsum'?'sin t · cos t ≠ 0':rule[data.domain])+'</text>'+(data.domain==='bothsum'?'<text x="152" y="65">tg t ≠ −1</text>':'')+'<text x="152" y="83">• допустимо</text><text x="152" y="106">× исключено</text><text x="12" y="140">Сверяй исходные знаменатели</text></g></svg>';
  }
  const previousFigure=course.figure, previousNext=course.nextId;
  course.figure=data=>data.chart==='domain'?diagram(data):previousFigure(data);
  course.nextId=lesson=>{
    const i=records.findIndex(row=>'21-'+row[0]===lesson.id);
    if(i>=0)return records[i+1] && records[i][0]!=='7-6d' ? '21-'+records[i+1][0] : undefined;
    return previousNext(lesson) || (lesson.id==='21-7-2d'?'21-7-3a':undefined);
  };
  course.source=(_book,page)=>'https://pdf.my-uchebnik.ru/pdf/algebra/00000085.pdf#page='+(page+5);
  for(const row of records){
    const [key,printed,title,expression]=row;
    add(21,key,Number(key.split('-')[1].slice(0,-1))>=12?20:19,title,'Упрости выражение, проверь его численно и выясни, какие углы разрешены.',
      'Начни с исходной записи. При сокращении числителя и знаменателя сохраняй все ограничения, которые требовались до преобразования.',
      'core-trig-identity',seed=>sample(row,seed));
    Object.assign(lessons.get('21-'+key),{printedReference:'Упражнение №'+printed,
      printedPrompt:row[7]?'Докажи, что '+expression+' = '+row[7]+'. Укажи ограничения из обеих частей.':'Исследуй '+expression+'. Приведи выражение к простейшей форме и укажи допустимые углы.',printedGuide:row[6]});
  }
})();
