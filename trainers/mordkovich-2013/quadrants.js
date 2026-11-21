(function () {
  'use strict';
  const {add,lessons,example,f}=window.MathExamTopicPractice, course=window.MathExamTopicEdition;
  const source=[
    ['7.7а','sin','4/5',2,'cos t = −3/5, tg t = −4/3, ctg t = −3/4.'],
    ['7.7б','sin','5/12',1,'cos²t = 1 − 25/144 = 119/144. Поэтому cos t = √119/12, tg t = 5/√119, ctg t = √119/5.'],
    ['7.7в','sin','−0,6',4,'cos t = 4/5, tg t = −3/4, ctg t = −4/3.'],
    ['7.7г','sin','−0,28',3,'cos t = −24/25, tg t = 7/24, ctg t = 24/7.'],
    ['7.8а','cos','0,8',1,'sin t = 3/5, tg t = 3/4, ctg t = 4/3.'],
    ['7.8б','cos','−5/13',2,'sin t = 12/13, tg t = −12/5, ctg t = −5/12.'],
    ['7.8в','cos','0,6',4,'sin t = −4/5, tg t = −4/3, ctg t = −3/4.'],
    ['7.8г','cos','−24/25',3,'sin t = −7/25, tg t = 7/24, ctg t = 24/7.'],
    ['7.9а','tg','3/4',1,'Можно взять направленные катеты x = 4, y = 3. Радиус 5. Тогда sin t = 3/5, cos t = 4/5, ctg t = 4/3.'],
    ['7.9б','tg','2,4',3,'Отношение 12/5 положительно, но оба катета отрицательны. Получишь sin t = −12/13, cos t = −5/13, ctg t = 5/12.'],
    ['7.9в','tg','−3/4',2,'Возьми x = −4 и y = 3. Тогда sin t = 3/5, cos t = −4/5, ctg t = −4/3.'],
    ['7.9г','tg','−5/12',4,'При x = 12 и y = −5 радиус равен 13. Отсюда sin t = −5/13, cos t = 12/13, ctg t = −12/5.'],
    ['7.10а','ctg','12/5',3,'Берём x = −12 и y = −5. Тогда sin t = −5/13, cos t = −12/13, tg t = 5/12.'],
    ['7.10б','ctg','7/24',1,'Берём x = 7, y = 24 и получаем радиус 25. Следовательно, sin t = 24/25, cos t = 7/25, tg t = 24/7.'],
    ['7.10в','ctg','−5/12',4,'Берём x = 5 и y = −12. Тогда sin t = −12/13, cos t = 5/13, tg t = −12/5.'],
    ['7.10г','ctg','−8/15',2,'Берём x = −8 и y = 15. По теореме Пифагора радиус равен 17. Поэтому sin t = 15/17, cos t = −8/17, tg t = −15/8.']
  ];
  const triples=[[3,4,5],[5,12,13],[8,15,17],[7,24,25],[20,21,29],[12,35,37],[9,40,41],[28,45,53],[11,60,61],[16,63,65],[33,56,65]];
  const range=['','0 < t < π/2','π/2 < t < π','π < t < 3π/2','3π/2 < t < 2π'];
  const signs=['','обе координаты положительны','x отрицателен, y положителен','обе координаты отрицательны','x положителен, y отрицателен'];
  const division={sin:'y/r',cos:'x/r',tg:'y/x',ctg:'x/y'};
  const key=i=>'7-'+(7+Math.floor(i/4))+'abcd'[i%4];
  function trial(row,seed){
    const [,, ,quadrant]=row, given=row[1], [a,b,r]=triples[seed-1];
    const x=(seed%2?a:b)*([2,3].includes(quadrant)?-1:1),y=(seed%2?b:a)*(quadrant>=3?-1:1);
    const values={sin:y/r,cos:x/r,tg:y/x,ctg:x/y},targets=Object.keys(values).filter(k=>k!==given);
    const model=example('При условии '+range[quadrant]+' дано '+given+' t = '+f(values[given])+'. Найди остальные три функции.',
      ['Дано','Значение'],[[given+' t',f(values[given])],['Четверть',['','I','II','III','IV'][quadrant]]],
      targets.map(name=>{
        const val=values[name], reciprocal=1/val, frac=division[name];
        return {prompt:'Найди '+name+' t. Можно ввести обыкновенную дробь.',answer:val,
          calculation:'Можно взять x = '+x+', y = '+y+', r = '+r+'. Тогда '+name+' t = '+frac+' = '+f(val)+'.',
          error:'Сначала установи знаки x и y, затем выбери отношение '+frac+'. Радиус всегда положительный.',
          mistakes:[[-val,'Модуль верен. В данной четверти '+signs[quadrant]+'. Определи знак отношения '+frac+'.'],
            [reciprocal,'Ты получил обратное число. Для '+name+' t порядок деления должен быть '+frac+'.']]};
      }),'quadrant');
    return Object.assign(model,{x,y,r,quadrant,given});
  }
  function figure(data){
    const {x,y,r,quadrant,given}=data,px=78+55*x/r,py=73-55*y/r;
    return '<svg viewBox="0 0 280 153" role="img" aria-label="Знаки проекций радиуса в выбранной четверти"><g stroke="#729097" fill="none"><circle cx="78" cy="73" r="55"/><path d="M11 73H146M78 9V138"/>'+
      '<path d="M78 73H'+px+'V'+py+'Z" fill="#cae7df" stroke="#23745e"/></g><circle cx="'+px+'" cy="'+py+'" r="3.8" fill="#283e50"/>'+
      '<g font-size="13" fill="#243f46"><text x="142" y="69">x</text><text x="84" y="13">y</text><text x="159" y="31">Четверть '+['','I','II','III','IV'][quadrant]+'</text>'+
      '<text x="159" y="55">x '+(x>0?'&gt;':'&lt;')+' 0, y '+(y>0?'&gt;':'&lt;')+' 0</text><text x="159" y="79">r &gt; 0</text><text x="159" y="105">'+given+' t = '+division[given]+'</text><text x="12" y="148">Координаты задают знаки отношений</text></g></svg>';
  }
  const priorFigure=course.figure,priorNext=course.nextId,priorSource=course.source;
  course.figure=data=>data.chart==='quadrant'?figure(data):priorFigure(data);
  course.nextId=lesson=>{
    const i=source.findIndex((row,index)=>'21-'+key(index)===lesson.id);
    if(i>=0)return source[i+1] && '21-'+key(i+1);
    return priorNext(lesson) || (lesson.id==='21-7-6d'?'21-7-7a':undefined);
  };
  course.source=(book,page)=>page===20?'https://pdf.my-uchebnik.ru/pdf/algebra/00000085.pdf#page=25':priorSource(book,page);
  source.forEach((row,i)=>{
    const [n,given,value,q,solution]=row, id=key(i),r=range[q];
    add(21,id,i<12?19:20,'Восстанови функции по '+given+' t • '+['','I','II','III','IV'][q]+' четверть',
      'Используй данную функцию и положение угла, чтобы определить три оставшихся значения.',
      given==='sin'||given==='cos'?'Найди квадрат второй координаты из sin²t + cos²t = 1. Из двух возможных корней оставь соответствующий четверти. Тангенс и котангенс — взаимно обратные отношения.':
        'Прими числитель и знаменатель данного отношения за направленные катеты с правильными знаками. Найди радиус по теореме Пифагора и раздели катеты на радиус.',
      'sec-circle',seed=>trial(row,seed));
    Object.assign(lessons.get('21-'+id),{printedReference:'Упражнение №'+n,
      printedPrompt:'Дано '+given+' t = '+value+' и '+r+'. Восстанови значения остальных трёх функций.',
      printedGuide:'В этой четверти '+signs[q]+'. '+solution});
  });
})();
