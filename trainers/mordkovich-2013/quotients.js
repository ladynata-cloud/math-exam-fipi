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
    ['7-6d','7.6г','Сокращение с сохранением ограничения','(sin⁴t − cos⁴t)/(sin²t − cos²t)','diagonals','one','Числитель равен произведению разности и суммы квадратов координат. При sin²t ≠ cos²t разность сокращается, остаётся 1. Все четыре точки диагоналей исключены.']
  ];
  const bad={cos:[2,6],sin:[0,4],sum:[3,7],diff:[1,5],top:[2],left:[4],all:[],diagonals:[1,3,5,7]};
  const rule={cos:'cos t ≠ 0',sin:'sin t ≠ 0',sum:'sin t ≠ −cos t',diff:'cos t ≠ sin t',top:'sin t ≠ 1',left:'cos t ≠ −1',all:'любой t',diagonals:'sin²t ≠ cos²t'};
  const ticks=['0','π/4','π/2','3π/4','π','5π/4','3π/2','7π/4'];
  const triples=[[3,4,5],[5,12,13],[8,15,17],[7,24,25],[20,21,29],[12,35,37],[9,40,41],[28,45,53],[11,60,61],[16,63,65],[33,56,65]];
  function sample(row,seed){
    const [,,,expression,domain,form,proof]=row,[y,x,r]=triples[seed-1];
    const s=seed%2?-y:y,c=seed%3?-x:x;
    const angles=[seed%8,(seed+2)%8,(seed+3)%8],blocked=angles.filter(k=>bad[domain].includes(k)),ok=3-blocked.length;
    const raw=form==='tan'?(s/c)**2:form==='negcot'?-((c/s)**2):form==='third'?1/3:1;
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
    return '<svg viewBox="0 0 280 142" role="img" aria-label="Разрешённые и исключённые положения угла на окружности"><g fill="none" stroke="#789197"><path d="M12 67H139M75 7V127"/><circle cx="75" cy="67" r="48"/></g>'+marks+'<g fill="#26414a" font-size="12"><text x="138" y="70">0</text><text x="80" y="14">π/2</text><text x="12" y="61">π</text><text x="79" y="127">3π/2</text><text x="152" y="28">Условие</text><text x="152" y="49">'+rule[data.domain]+'</text><text x="152" y="83">• допустимо</text><text x="152" y="106">× исключено</text><text x="12" y="140">Сверяй исходные знаменатели</text></g></svg>';
  }
  const previousFigure=course.figure, previousNext=course.nextId;
  course.figure=data=>data.chart==='domain'?diagram(data):previousFigure(data);
  course.nextId=lesson=>{
    const i=records.findIndex(row=>'21-'+row[0]===lesson.id);
    if(i>=0)return records[i+1] && '21-'+records[i+1][0];
    return previousNext(lesson) || (lesson.id==='21-7-2d'?'21-7-3a':undefined);
  };
  course.source=(_book,page)=>'https://pdf.my-uchebnik.ru/pdf/algebra/00000085.pdf#page='+(page+5);
  for(const row of records){
    const [key,printed,title,expression]=row;
    add(21,key,19,title,'Упрости выражение, проверь его численно и выясни, какие углы разрешены.',
      'Начни с исходной записи. При сокращении числителя и знаменателя сохраняй все ограничения, которые требовались до преобразования.',
      'core-trig-identity',seed=>sample(row,seed));
    Object.assign(lessons.get('21-'+key),{printedReference:'Упражнение №'+printed,
      printedPrompt:'Исследуй '+expression+'. Приведи выражение к простейшей форме и укажи допустимые углы.',printedGuide:row[6]});
  }
})();
