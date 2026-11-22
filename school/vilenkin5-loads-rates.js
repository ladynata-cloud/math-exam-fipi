/* Vilenkin grade 5 (2023), part 1, p. 31. Original explanations, diagrams and practice. */
(function (root) {
  'use strict';
  const entries = [
    ['1.151','Собери груз трёх машин','Сначала найди груз второй машины. Сложи груз первых двух и только затем раздели эту сумму на число равных частей. Последними посчитай все рейсы.', 'Если первые две машины везут 6 и 4 т, а третья — половину их общего груза, за один рейс вместе они везут 15 т.', 'Чтобы узнать груз третьей машины, достаточно разделить груз второй.'],
    ['1.152','Сравни две группы принтеров','Сколько деталей даёт один принтер за час? Умножь это число на количество таких принтеров, а затем на часы. После этого можно найти и общий выпуск, и разность.', 'Два принтера по 5 деталей в час за три часа дадут 2 × 5 × 3 = 30 деталей.', 'Для двух групп можно сложить только скорости одиночных принтеров.'],
    ['1.153','Сравни время поездов','Оба поезда проделывают одинаковый путь. Узнай, сколько часовых отрезков каждого поезда укладывается во всём пути. Сравни полученные длительности.', 'Поезд проходит 240 км со скоростью 60 км/ч за четыре часа, а со скоростью 80 км/ч — за три часа.', 'Разность скоростей сразу показывает разность времени.'],
    ['1.154','Выбери первое действие','Сначала посчитай выражение в скобках. Когда скобок нет, выполни умножение или деление до сложения или вычитания.', 'В выражении (146 + 34) : 6 сначала получается 180, затем 30.', 'В выражении без скобок всегда надо выполнить действия в любом порядке.']
  ];
  const lessons = entries.map(([number,title,explanation,example,misconception])=>({
    number,title,explanation,misconception,worked:[example],key:'printed-'+number.replace('.','-'),
    point:5,part:1,page:31,reflect:'Как проверить промежуточный результат обратным действием?',
    requires:[number==='1.153'?'v5f-printed-1-143':'v5f-printed-1-141'],related:['v5f-printed-1-145']
  }));
  const err = (value,text)=>({value,text});
  function loads(seed,r,step){
    const third=seed?r(3,13):3,first=seed?2*third-1:5,second=3*third-first,difference=first-second,trips=seed?r(2,9):6;
    const each=first+second+third;
    return {prompt:'Сколько тонн овощей перевезут все три машины, если каждая сделает по '+trips+' рейсов с полным грузом?',
      inputPrompt:'Тонн за все рейсы',answer:each*trips,conditionKey:[first,second,trips].join('/'),data:{loads:[first,second,third],trips},
      table:{caption:'Груз за один рейс',headers:['Машина','Груз'],rows:[['Первая',first+' т'],['Вторая','На '+difference+' т меньше первой'],['Третья','Одна треть общего груза первых двух']]},
      steps:[step('Сколько тонн везёт вторая машина за рейс?',second,'Вычти указанную разницу из груза первой машины.',[err(first+difference,'Вторая машина везёт меньше первой. Вычти разницу.')]),
        step('Сколько тонн везут первая и вторая вместе?',first+second,'Сложи два груза.'),
        step('Сколько тонн приходится на третью машину?',third,'Раздели сумму грузов первых двух на три.',[err(first+second-3,'«В три раза меньше» просит разделить на три.')]),
        step('Сколько тонн везут за один общий рейс все три машины?',each,'Прибавь к грузу первых двух груз третьей машины.')],
      errors:[err(each,'Пока учтён один общий рейс. Сколько раз машины повторят его?'),err((first+second)*trips,'Две машины учтены. Добавь груз третьей во всех рейсах.')]};
  }
  function printers(seed,r,step){
    const m=seed?r(3,6):3,n=m-1,a=seed?r(m,10):7,b=seed?a+r(1,Math.max(1,Math.floor((a-1)/(m-1)))):9;
    const hours=seed?r(2,8):6,x=m*a,y=n*b,one=x*hours,two=y*hours;
    return {prompt:'б. На сколько деталей больше изготовит первая группа за '+hours+' ч?',inputPrompt:'Разница за всё время',answer:one-two,
      conditionKey:[m,a,n,b,hours].join('/'),data:{machines:[m,n],rates:[a,b],hours},
      table:{caption:'Две группы работают одновременно '+hours+' ч',headers:['Группа','Принтеры и выпуск каждого'],rows:[['Первая',m+' шт. по '+a+' деталей за час'],['Вторая',n+' шт. по '+b+' деталей за час']]},
      steps:[step('Сколько деталей выдаёт первая группа за час?',x,'Умножь число принтеров на выпуск одного за час.',[err(a,'Это выпуск одного устройства. Учти все устройства первой группы.')]),step('Сколько деталей выдаёт вторая группа за час?',y,'Сколько устройств работают у второго техника?'),
        step('Сколько деталей сделала первая группа за всё время?',one,'Умножь часовой выпуск первой группы на '+hours+'.'),
        step('Сколько деталей сделала вторая группа за всё время?',two,'Умножь часовой выпуск второй группы на количество часов.'),
        step('а. Сколько деталей изготовили обе группы за всё время?',one+two,'Объедини результаты групп сложением.',[err(x+y,'Это общий выпуск за один час. Проверь количество часов.')])],
      errors:[err(x-y,'Ты сравнил выпуск за один час. Сравни группы за всё время.'),err(one+two,'Сумма отвечает на первый вопрос. Здесь нужна разность.')]};
  }
  function trains(seed,r,step){
    const fast=seed?r(3,7):5,slow=seed?fast+r(1,4):7,factor=seed?r(5,18):10;
    const length=fast*slow*factor,speeds=[fast*factor,slow*factor];
    return {prompt:'На сколько часов второй поезд раньше закончит такой же путь длиной '+length+' км?',inputPrompt:'Разность времени в часах',answer:slow-fast,
      conditionKey:[length,...speeds].join('/'),data:{road:length,speeds,times:[slow,fast]},
      table:{caption:'Одна и та же дорога длиной '+length+' км',headers:['Поезд','Скорость'],rows:[['Первый',speeds[0]+' км/ч'],['Второй',speeds[1]+' км/ч']]},
      steps:[step('Сколько часов занимает дорога у первого поезда?',slow,'Раздели весь путь на расстояние первого поезда за один час.',[err(length*speeds[0],'Получается большее число. Найди, сколько часовых отрезков помещается во всём пути.')]),
        step('Сколько часов нужно второму поезду для того же пути?',fast,'Скорость второго поезда больше, поэтому часов понадобится меньше.')],
      errors:[err(speeds[1]-speeds[0],'Это разность скоростей в километрах за час. Вычти меньшую длительность из большей.'),err(slow+fast,'Каждый поезд проходит свою дорогу. Сравни часы вычитанием.')]};
  }
  const source=[[2786,886,8],[3967,965,9],[2012,968,12],[2213,897,14],[38,43,134],[47,26,122]];
  const action=(row,i)=>i<2?row[0]+row[1]:i<4?row[0]-row[1]:row[0]*row[1];
  const value=(row,i)=>i<4?action(row,i)/row[2]:action(row,i)-row[2];
  const formula=(u,i)=>i<4?'('+u[0]+(i<2?' + ':' − ')+u[1]+') : '+u[2]:u[0]+' × '+u[1]+' − '+u[2];
  function expressions(seed,r,step){
    const rows=seed?source.map((v,i)=>{if(i>=4)return [r(24,55),r(16,43),r(100,190)];const d=r(6,15),answer=r(90,390),b=r(100,350);return [d*answer+(i<2?-b:b),b,d];}):source;
    const answers=rows.map(value),steps=rows.map((u,i)=>step((i+1)+'. '+formula(u,i)+'. Сколько получится?',answers[i],i<4?'Вычисли действие в скобках и затем раздели.':'Сначала умножь, затем вычти.',[err(action(u,i),'Это промежуточное значение. Осталось ещё одно действие.')]));
    return {prompt:'Запиши шесть результатов в порядке строк через точку с запятой.',inputPrompt:'Шесть чисел',answer:answers,answerFormat:'v5-list',steps,
      conditionKey:rows.map(u=>u.join(',')).join('/'),data:{expressions:rows},table:{caption:'Шесть выражений',headers:['№','Выражение'],rows:rows.map((u,i)=>[i+1,formula(u,i)])},errors:[]};
  }
  function bars(title,labels,amounts,max,splits=[]){
    const h=15+labels.length*36;let inner='';
    labels.forEach((label,i)=>{const y=7+i*36,w=201*amounts[i]/max,n=splits[i]||1;
      inner+='<text x="7" y="'+(y+10)+'" style="font:14px sans-serif;fill:#194536">'+label+'</text><rect x="7" y="'+(y+15)+'" width="'+w+'" height="9" rx="2" fill="'+['#237a68','#a66032','#5665a1'][i]+'"/>';
      for(let j=1;j<n;j++)inner+='<path d="M'+(7+w*j/n)+' '+(y+15)+'v9" stroke="white" stroke-width="1.5"/>';
    });
    return '<svg viewBox="0 0 216 '+h+'" role="img" aria-label="'+title+'">'+inner+'</svg>';
  }
  function explore(l,s,t,table){
    const d=t.data;
    if(d.loads){const selected=d.loads[s.vehicle],rounds=s.rounds+1;return {title:'Сложи груз одинаковых рейсов',controls:[{key:'vehicle',title:'Машина',values:[[0,'Первая'],[1,'Вторая'],[2,'Третья']]},{key:'rounds',title:'Число рейсов',values:[0,1,2,3,4,5].map(j=>[j,j+1])}],
      visual:bars('Груз выбранной машины и его повторение',['Один рейс',rounds+' одинаковых рейсов'],[selected,selected*rounds],selected*rounds,[1,rounds]),question:'Сколько тонн отвезёт выбранная машина за показанное число рейсов?',answer:selected*rounds,why:'Каждая одинаковая часть второй полосы — один груз выбранной машины.'};}
    if(d.rates){const group=s.group,count=d.machines[group],rate=d.rates[group],hrs=s.hours+1;return {title:'Собери часовой выпуск группы',controls:[{key:'group',title:'Группа',values:[[0,'Первая'],[1,'Вторая']]},{key:'hours',title:'Часов',values:[0,1,2,3,4,5].map(j=>[j,j+1])}],
      visual:bars('Выпуск одного и всех принтеров',['Один принтер за час','Все устройства за час'],[rate,count*rate],count*rate,[1,count]),question:'Сколько деталей сделает выбранная группа за '+hrs+' ч?',answer:count*rate*hrs,why:'Сначала сосчитай часовой выпуск всех принтеров по полосе. Затем умножь его на часы.'};}
    if(d.speeds){const i=s.train;return {title:'Отмерь дорогу часовыми отрезками',controls:[{key:'train',title:'Поезд',values:[[0,'Первый'],[1,'Второй']]}],
      visual:bars('Весь путь разделён на часовые участки',['За час — '+d.speeds[i]+' км','Весь путь — '+d.road+' км'],[d.speeds[i],d.road],d.road,[1,d.times[i]]),question:'Сколько часов занимает весь путь?',answer:d.times[i],why:'Одна часть нижней полосы равна пути за час.'};}
    const i=s.row,u=d.expressions[i];return {title:'Разложи выражение на два действия',controls:[{key:'row',title:'Строка',values:d.expressions.map((_,j)=>[j,j+1])}],visual:table('Порядок вычисления',['Сначала','Затем'],[[u[0]+(i<2?' + ':i<4?' − ':' × ')+u[1],i<4?'Разделить на '+u[2]:'Вычесть '+u[2]]]),question:'Что получится после первого действия?',answer:action(u,i),why:'Первое действие даёт новое число. Только его переносим на второе действие.'};
  }
  const generators={'1.151':loads,'1.152':printers,'1.153':trains,'1.154':expressions};
  const bounds={'1.151':{vehicle:[0,2,0],rounds:[0,5,0]},'1.152':{group:[0,1,0],hours:[0,5,0]},'1.153':{train:[0,1,0]},'1.154':{row:[0,5,0]}};
  const api={lessons,generators,bounds,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5LoadsRates=api;
})(typeof window!=='undefined'?window:globalThis);
