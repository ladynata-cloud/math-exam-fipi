/* Vilenkin et al., part 1 (2023), printed page 21, point 3. */
(function(root){
  'use strict';
  const descriptions=[
    ['1.77','Два участка одной поездки','Время на каждом участке умножай на скорость именно этого участка. Километры первой и второй части пути можно складывать.',
      ['Если ехать 2 ч со скоростью 60 км/ч, первый участок равен 120 км.','Ещё 1 ч при скорости 35 км/ч добавляет 35 км. Весь путь равен 155 км.'],'Можно сложить скорости и умножить сумму на всё время.','Как проверить вклад каждого часа пути?'],
    ['1.78','На сколько и во сколько раз','Прибавление или вычитание даёт неизвестную скорость по разности скоростей. Для сравнения в разах узнай, сколько раз меньшая скорость помещается в большей.',
      ['Быстрый катер проходит 72 км за час, второй — на 48 км меньше. Скорость второго 24 км/ч.','Сравниваем в разах: 72 : 24 = 3. Разность 48 измеряется в км/ч, а отношение 3 показывает число раз.'],'Слова «на» и «во сколько раз» требуют одного и того же вычисления.','Как умножением проверить отношение двух скоростей?'],
    ['1.81','Все отрезки между четырьмя точками','Сохрани порядок A–P–S–B или его зеркальное отражение. Отрезок определяется двумя концами, даже если между ними есть отмеченная точка. При сравнении найди короткий отрезок внутри длинного.',
      ['Между тремя точками E, F, G можно провести EF, FG и EG. Записи EF и FE обозначают один отрезок.','При порядке E–F–G отрезок EF занимает часть EG, поэтому EF короче EG.'],'Отрезки могут соединять только соседние отмеченные точки.','Почему зеркальное отражение не меняет ни одного результата сравнения?'],
    ['1.82','Метр, дециметр и сантиметр в километре','Разбери перевод по ступеням. Километр содержит тысячу метров; каждый метр — десять дециметров или сто сантиметров.',
      ['В 2 км помещаются 2 × 1000 = 2000 м.','Каждый из этих метров даёт по 10 дм, поэтому 2 км = 20 000 дм.'],'Если единица уменьшается, численное значение длины тоже уменьшается.','Почему при переходе к сантиметрам количество получается больше?'],
    ['1.83','Переводы простых и составных длин','Для одной единицы переводи в неё все составляющие и складывай. Для двух единиц отдели полное число крупных единиц и вырази остаток в более мелких.',
      ['В 3 км 27 м содержится 3000 + 27 = 3027 м.','В 64 мм есть шесть полных сантиметров и четыре оставшихся миллиметра: 6 см 4 мм.'],'Числа в исходных разных единицах можно складывать до перевода.','Как из результата снова получить исходную длину?'],
    ['1.85','Три стороны треугольника в одной мере','Сначала вырази длины и разность в миллиметрах. Если ML короче KM, вычти разность. Затем сложи все три стороны и выдели полные сантиметры из суммы.',
      ['Пусть сторона равна 52 мм, а другая на 7 мм короче. Тогда вторая равна 45 мм.','При третьей стороне 38 мм периметр равен 135 мм, или 13 см 5 мм.'],'Разность длин надо всегда прибавлять к известной стороне.','Как обратным сложением проверить длину короткой стороны?'],
    ['1.86','Две столешницы с одинаковым периметром','У прямоугольника две длины и две ширины. Ту же полную длину границы у квадрата делят на четыре равные части.',
      ['Если ширина 20 см, а длина в три раза больше, длина 60 см.','Периметр 160 см, поэтому у квадрата с таким периметром сторона 40 см.'],'При равном периметре квадрат обязательно имеет сторону, равную длине прямоугольника.','Как доказать равенство периметров обратным вычислением?'],
    ['1.87','Мука на несколько приготовлений','Вырази весь запас в граммах. Расход одного приготовления умножь на число приготовлений, затем вычти общий расход из запаса.',
      ['В пакете 2 кг, или 2000 г. На три приготовления по 250 г уйдёт 750 г.','Останется 1250 г. Проверка: 750 + 1250 = 2000 г.'],'Остаток муки равен расходу за все приготовления.','Какая сумма должна восстановить первоначальный запас?'],
    ['1.88','Высоты по цепочке сравнений','Каждый перепад отсчитывается от названной перед ним вершины. Если следующая вершина ниже, вычитай перепад; если выше — прибавляй. Для ответа «на сколько» сравни последнюю высоту с первой.',
      ['Например, из 2100 м спускаемся на 430 м и получаем 1670 м.','Если затем подняться на 710 м, новая высота 2380 м. Она выше исходной на 280 м.'],'Все три перепада надо отсчитывать от одной и той же первой вершины.','Как восстановить высоту третьей вершины из последней?'],
    ['1.89','Рысь и галоп на одном пути','Сначала восстанови длину пути по времени и скорости рыси. На том же расстоянии время галопа находят делением на скорость галопа.',
      ['Пусть за 6 минут при скорости 140 м/мин пройдено 840 м.','При скорости 210 м/мин на те же 840 м уйдёт 4 минуты.'],'Более высокая скорость требует больше времени на той же дистанции.','Как проверить время галопа умножением?'],
    ['1.90','Туристы в автобусе и на катере','У каждого вида транспорта свои скорость и время. Умножь величины из одной строки, затем сложи пройденные километры.',
      ['За 2 ч автобус со скоростью 48 км/ч проедет 96 км.','Ещё 1 ч на катере при 20 км/ч даёт 20 км. Вместе пройдено 116 км.'],'После смены транспорта нужно брать среднее арифметическое двух скоростей.','Почему длину второго участка надо прибавить к длине первого?'],
    ['1.91','Умножение, деление и скобки в четырёх выражениях','Определи, что составляет каждый множитель или делитель. Сначала вычисли действие в скобках; без скобок умножение и деление идут до сложения.',
      ['В записи 720 : (10 + 8) делят на всю сумму 18. Получается 40.','В записи 720 : 18 + 8 сначала получают 40, а затем 48.'],'В выражении с делением можно сложить любые соседние числа перед делением.','Как проверить найденное частное обратным произведением?'],
    ['1.79','Первое действие и значение выражения','Сначала работай в скобках. Если скобок нет, умножение выполняй раньше вычитания. Запиши промежуточное число и подставь его в оставшееся действие.',
      ['В записи 360 − 14 · 25 первым получим 350, а затем 10.','В записи (40 − 18) · 5 первым получим 22, а затем 110.'],'Вычисления во всех выражениях надо начинать с самого левого действия.','Как изменится порядок, если скобками объединить разность?']
  ];
  const links={'1.77':['natural-multiply','formula-distance'],'1.78':['division-measure','division-share'],'1.79':['order-brackets','order-equal'],'1.81':['segment-length','broken-length'],'1.82':['segment-length','natural-multiply'],'1.83':['segment-length','division-column'],'1.85':['segment-length','broken-length'],'1.86':['formula-perimeter','division-share'],'1.87':['natural-multiply','natural-subtract'],'1.88':['natural-subtract','natural-add'],'1.89':['formula-distance','division-measure'],'1.90':['formula-distance','natural-add'],'1.91':['order-brackets','division-column']};
  const lessons=descriptions.map(([number,title,explanation,worked,misconception,reflect])=>({number,title,explanation,worked,misconception,reflect,key:'printed-'+number.replace('.','-'),point:3,part:1,page:21,requires:['v5f-'+links[number][0]],related:['v5f-'+links[number][1]]}));
  const nat=(step,prompt,answer,hint,errors=[])=>({...step(prompt,answer,hint,errors),answerFormat:'v5-natural'});
  const err=(value,text)=>({value,text});
  function trip(seed,r,step){
    const hours=seed?[r(2,5),r(1,4)]:[3,2],speed=seed?[r(55,74),r(30,54)]:[75,50];
    const distance=speed.map((v,i)=>v*hours[i]),sum=distance[0]+distance[1];
    const steps=['шоссе','грунтовой дороге'].map((road,i)=>nat(step,'Сколько километров грузовик проехал по '+road+'?',distance[i],'За один час грузовик проходит '+speed[i]+' км. Сосчитай расстояние за '+hours[i]+' ч.',
      [err(speed[i]+hours[i],'Часы и километры в час не складывают. Возьми длину часового участка нужное число раз.')]));
    return {prompt:'Грузовик ехал сначала по шоссе, затем по грунтовой дороге. Найди общий путь в километрах.',inputPrompt:'Весь путь, км',answer:sum,answerFormat:'v5-natural',steps,
      errors:[err((speed[0]+speed[1])*(hours[0]+hours[1]),'Ты применил обе скорости ко всем часам. В каждый час грузовик ехал только по одной дороге.'),err(distance[0],'Получен путь по шоссе. Прибавь километры грунтовой дороги.')],
      data:{trip:{hours,speed,distance}},table:{caption:'Две части поездки: время и скорость',headers:['Участок','ч','км/ч'],rows:[['Шоссе',hours[0]+' ч',speed[0]+' км/ч'],['Грунтовая дорога',hours[1]+' ч',speed[1]+' км/ч']],columnWidths:[49,21,30]},conditionKey:[...hours,...speed].join('/')};
  }
  function flights(seed,r,step){
    const slow=seed?[r(150,250),r(38,54)]:[280,55],ratio=seed?[r(2,5),r(2,5)]:[3,3];
    const fast=slow.map((v,i)=>v*ratio[i]),difference=fast.map((v,i)=>v-slow[i]);
    const steps=[nat(step,'Самолёт летит со скоростью '+fast[0]+' км/ч, а вертолёт медленнее на '+difference[0]+' км/ч. Найди скорость вертолёта.',slow[0],'Скорость вертолёта должна быть меньше скорости самолёта.',[err(fast[0]+difference[0],'При сложении вертолёт стал быстрее. Перечитай, кто медленнее.')]),
      nat(step,'Во сколько раз скорость вертолёта меньше скорости самолёта?',ratio[0],'Раздели большую скорость на меньшую.',[err(difference[0],'Это разность в километрах за час. Отношение показывает, сколько одинаковых скоростей вертолёта составляют скорость самолёта.')]),
      nat(step,'Ласточка летит со скоростью '+slow[1]+' км/ч, стриж быстрее на '+difference[1]+' км/ч. Какова скорость стрижа?',fast[1],'К меньшей скорости прибавь разность скоростей.'),
      nat(step,'Во сколько раз стриж летит быстрее ласточки?',ratio[1],'Сосчитай, сколько раз скорость ласточки помещается в скорости стрижа.',[err(difference[1],'Ты указал разницу скоростей. Чтобы узнать число раз, раздели большую скорость на меньшую.')])];
    return {prompt:'Ответь на оба сравнения в разах: сначала про вертолёт и самолёт, затем про стрижа и ласточку.',inputPrompt:'Два числа по порядку',answer:ratio,answerFormat:'v5-list',steps,
      data:{flights:{slow,fast,ratio,difference}},table:{caption:'Два сравнения скорости',headers:['Пара','Данные, км/ч'],rows:[['Самолёт и вертолёт',fast[0]+' у самолёта. Вертолёт медленнее на '+difference[0]+'.'],['Ласточка и стриж',slow[1]+' у ласточки. Стриж быстрее на '+difference[1]+'.']],columnWidths:[38,62]},conditionKey:[...slow,...ratio].join('/')};
  }
  function order(seed,r,step){
    const x=seed?r(25,70):66,y=seed?r(18,60):83,residue=seed?r(11,30):10,base=x*y+residue;
    const a=seed?r(1400,2400):2823,b=seed?r(350,1200):2319,c=seed?r(11,29):23;
    const left=seed?r(25,57):45,large=seed?r(800,1700):1238,small=seed?r(90,220):148;
    const count=seed?r(12,30):21,unit=seed?r(75,130):106;
    const rows=[
      {expr:base+' − '+x+' · '+y,operation:x+' · '+y,partial:x*y,end:residue,finish:base+' − '+(x*y),hint:'Умножение выполняй перед вычитанием.',wrong:base-x},
      {expr:'('+a+' − '+b+') · '+c,operation:a+' − '+b,partial:a-b,end:(a-b)*c,finish:(a-b)+' · '+c,hint:'Сначала посчитай разность внутри скобок.',wrong:b*c},
      {expr:left+' · ('+large+' − '+small+')',operation:large+' − '+small,partial:large-small,end:left*(large-small),finish:left+' · '+(large-small),hint:'Скобки отделяют действие справа. Вычисли разность до умножения.',wrong:left*large},
      {expr:count+' · '+unit+' − '+unit,operation:count+' · '+unit,partial:count*unit,end:(count-1)*unit,finish:(count*unit)+' − '+unit,hint:'Сначала вычисли произведение. Затем убери ровно одну группу.',wrong:0}];
    return orderTask(rows,step,rows.map((_,i)=>String(i+1)));
  }
  function orderTask(rows,step,labels){
    const steps=rows.flatMap((row,i)=>[nat(step,labels[i]+') '+row.expr+'. Каков результат первого действия?',row.partial,row.hint,[err(row.wrong,row.hint)]),
      nat(step,labels[i]+') После первого действия осталось '+row.finish+'. Найди значение выражения.',row.end,'Подставь промежуточный результат в оставшееся действие.',[err(row.partial,'Первое действие уже выполнено. Осталось '+row.finish+'.')])]);
    return {prompt:'Найди значения четырёх выражений и введи их в порядке строк.',inputPrompt:'Четыре значения по порядку',answer:rows.map(v=>v.end),answerFormat:'v5-list',steps,
      data:{operations:rows},table:{caption:'Четыре исходные записи',headers:['Строка','Выражение'],rows:rows.map((v,i)=>[labels[i],v.expr]),columnWidths:[22,78]},conditionKey:rows.map(v=>v.expr).join('/')};
  }
  function summits(seed,r,step){
    const origin=seed?r(3900,4600):4750,drop1=seed?r(370,680):613,drop2=seed?r(1700,2570):2948,rise=seed?drop1+drop2+r(120,480):3911;
    const levels=[origin,origin-drop1,origin-drop1-drop2,origin-drop1-drop2+rise],gap=levels[3]-levels[0];
    const names=seed?['Первая вершина','Вторая вершина','Третья вершина','Четвёртая вершина']:['Ключевская Сопка','Маашей-Баши','Часначорр','Пик Пушкина'];
    const steps=[nat(step,names[1]+' ниже первой вершины на '+drop1+' м. Какова её высота над уровнем моря?',levels[1],'Вычти первый перепад из исходной высоты.',[err(origin+drop1,'При сложении вторая вершина оказалась выше первой. Нужное направление — вниз.')]),
      nat(step,names[2]+' ниже второй вершины на '+drop2+' м. Какова высота третьей вершины?',levels[2],'Отсчитай второй перепад от второй вершины.',[err(origin-drop2,'Здесь сравнивают со второй вершиной. Начни от уже найденной высоты второй.')]),
      nat(step,names[3]+' выше третьей на '+rise+' м. Какова высота четвёртой вершины?',levels[3],'Теперь поднимись от третьей вершины: прибавь последний перепад.',[err(rise,'Дан подъём от третьей вершины, а не от уровня моря. Прибавь начальную высоту этого подъёма.')]),
      nat(step,'На сколько метров первая вершина ниже четвёртой?',gap,'Вычти из большей высоты меньшую.',[err(levels[3],'Это полная высота. Ответ на «на сколько» — разность двух высот.')])];
    return {prefix:seed?'Новая авторская схема условных высот. ':'Вычисления по высотам из учебника. ',prompt:'Определи высоту последней вершины над уровнем моря и на сколько метров она выше первой. Запиши два числа в этом порядке.',inputPrompt:'Высота; разность, м',answer:[levels[3],gap],answerFormat:'v5-list',steps,
      data:{summits:{levels,names}},table:{caption:'Цепочка сравнений высот',headers:['Вершина','Дано, м'],rows:[[names[0],origin],[names[1],'ниже первой на '+drop1],[names[2],'ниже второй на '+drop2],[names[3],'выше третьей на '+rise]],columnWidths:[49,51]},conditionKey:[origin,drop1,drop2,rise].join('/')};
  }
  function horse(seed,r,step){
    const scale=seed?r(55,95):100,slow=2*scale,fast=3*scale,n=seed?r(3,6):2,minutes=3*n,distance=slow*minutes,time=2*n;
    const steps=[nat(step,'Лошадь бежала рысью '+minutes+' мин со скоростью '+slow+' м/мин. Сколько метров она прошла?',distance,'Возьми длину минутного участка столько раз, сколько минут она бежала.',[err(slow+minutes,'Метры в минуту не складывают с минутами. Умножь скорость на время.')]),
      nat(step,'Галопом за минуту лошадь проходит '+fast+' м. Сколько таких участков нужно для той же длины пути?',time,'Раздели найденное расстояние на длину минутного участка галопа.')];
    return {prompt:'Лошадь снова преодолевает тот же путь, теперь галопом. Сколько минут ей понадобится?',inputPrompt:'Время галопа, мин',answer:time,answerFormat:'v5-natural',steps,
      errors:[err(minutes,'Это время рыси. На той же длине пути большая скорость даёт меньшее время.')],data:{horse:{slow,fast,minutes,distance,time}},
      table:{caption:'Один и тот же путь: скорость и время',headers:['Аллюр','м/мин','мин'],rows:[['Рысь',slow+' м/мин',minutes+' мин'],['Галоп',fast+' м/мин','?']],columnWidths:[32,42,26]},conditionKey:[scale,n].join('/')};
  }
  function excursions(seed,r,step){
    const hours=seed?[r(2,5),r(1,4)]:[3,2],speed=seed?[r(42,64),r(12,25)]:[65,18],distance=hours.map((n,i)=>n*speed[i]),answer=distance[0]+distance[1];
    const labels=['Автобус','Катер'],hoursLabels=['Часы в автобусе','Часы на катере'];
    const steps=[nat(step,'Сколько километров туристы проехали в автобусе?',distance[0],'Время в автобусе умножь на скорость автобуса.',[err(hours[0]*speed[1],'Ты использовал скорость катера в расчёте автобусного пути. Найди в таблице строку первого участка.')]),
      nat(step,'Сколько километров туристы проплыли на катере?',distance[1],'Умножь время на воде на скорость катера.',[err(hours[1]*speed[0],'Это скорость автобуса. На воде за каждый час пройден другой путь.')])];
    return {prompt:'Туристы сменили автобус на катер. Какое расстояние прошли за всё путешествие?',inputPrompt:'Общий путь, км',answer,answerFormat:'v5-natural',steps,
      errors:[err(Math.abs(distance[0]-distance[1]),'Оба участка пройдены. Длины пути по суше и по воде надо сложить.'),err(distance[0],'Это путь по суше. Добавь водный участок.')],
      data:{trip:{hours,speed,distance,labels,hoursLabels}},table:{caption:'Путь по суше и воде',headers:['Участок','ч','км/ч'],rows:labels.map((title,i)=>[title,hours[i],speed[i]]),columnWidths:[49,21,30]},conditionKey:[...hours,...speed].join('/')};
  }
  function fourOperations(seed,r,step){
    const a=seed?r(24,42):43,b=seed?r(12,18):13,c=seed?r(160,330):316,h=seed?r(22,65):63,j=seed?r(35,78):59,k=seed?r(35,80):75;
    const divisor=seed?r(22,47):43,q=seed?r(175,312):285,added=seed?r(90,190):174,m=seed?r(13,25):18,n=seed?r(31,56):48,last=seed?r(680,855):804;
    const pretty=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
    const rows=[{expr:a+' · '+b+' + '+c,operation:a+' · '+b,partial:a*b,finish:a*b+' + '+c,end:a*b+c,hint:'Умножение выполняется раньше сложения.',wrong:b+c},
      {expr:'('+h+' + '+j+') · '+k,operation:h+' + '+j,partial:h+j,finish:(h+j)+' · '+k,end:(h+j)*k,hint:'Сначала сложи числа внутри скобок.',wrong:j*k},
      {expr:pretty(q*divisor)+' : '+divisor+' + '+added,operation:pretty(q*divisor)+' : '+divisor,partial:q,finish:q+' + '+added,end:q+added,hint:'Выполни деление перед сложением. Частное можно проверить умножением.',wrong:divisor+added},
      {expr:pretty((m+n)*last)+' : ('+m+' + '+n+')',operation:m+' + '+n,partial:m+n,finish:pretty((m+n)*last)+' : '+(m+n),end:last,hint:'Делитель — сумма в скобках. Сначала вычисли её целиком.',wrong:(m+n)*last}];
    return orderTask(rows,step,firstLetter);
  }
  function summitView(state,task,table){
    const d=task.data.summits,a=state.from,b=state.to,delta=Math.abs(d.levels[a]-d.levels[b]),top=Math.max(...d.levels);
    const picture='<svg viewBox="0 0 260 96" role="img" aria-label="Высоты четырёх вершин в одной шкале над уровнем моря"><path d="M8 85H250" stroke="#4d605b"/>'+d.levels.map((n,i)=>{const x=20+59*i,y=85-70*n/top;return '<rect x="'+x+'" y="'+y+'" height="'+(85-y)+'" width="28" fill="'+(i===a||i===b?'#9d501e':'#3d7b89')+'"/><text x="'+(x+14)+'" y="95" font-size="10" text-anchor="middle">'+(i+1)+'</text>';}).join('')+'</svg>';
    return {title:'Сравни высоты над одним уровнем',controls:[{key:'from',title:'Первая вершина',values:d.names.map((v,i)=>[i,v])},{key:'to',title:'Вторая вершина',values:d.names.map((v,i)=>[i,v])}],
      visual:picture+table('Подписи столбиков слева направо',['Номер','Вершина'],d.names.map((v,i)=>[i+1,v])),question:'Какой перепад высот между выбранными вершинами, в метрах?',answer:delta,why:'Высоты '+d.levels[a]+' и '+d.levels[b]+' м отличаются на '+delta+' м.'};
  }
  function horseView(state,task,table){
    const d=task.data.horse,speed=state.gait?d.fast:d.slow,way=speed*state.minutes,gap=Math.abs(way-d.distance);
    return {title:'Сравни два способа пройти одну дистанцию',controls:[{key:'gait',title:'Движение',values:[[0,'Рысь'],[1,'Галоп']]},{key:'minutes',title:'Сколько минут бежала лошадь',min:0,max:18,step:1},{key:'measure',title:'Что найти',values:[[0,'Пройденный путь'],[1,'Разницу с исходной дистанцией']]}],
      visual:table('Минутные участки',['По сколько метров','Сколько раз'],[[speed,state.minutes]]),question:'Какова выбранная длина в метрах?',answer:state.measure?gap:way,why:'За '+state.minutes+' мин пройдено '+speed+' × '+state.minutes+' = '+way+' м. Исходная дистанция — '+d.distance+' м.'};
  }

  function triangle(seed,r,step){
    const km=seed?r(48,79):68,diff=seed?r(6,17):13,lk=seed?r(31,58):40,ml=km-diff,total=km+ml+lk;
    const text=n=>Math.floor(n/10)+' см '+n%10+' мм';
    const steps=[nat(step,'Переведи сторону KM длиной '+text(km)+' в миллиметры.',km,'У каждого полного сантиметра десять миллиметров.'),
      nat(step,'Сторона ML короче KM на '+text(diff)+'. Сколько миллиметров в ML?',ml,'Вычти разницу из длины KM в тех же единицах.',[err(km+diff,'При сложении ML стала длиннее KM. В условии она короче.')]),
      nat(step,'Переведи третью сторону LK длиной '+text(lk)+' в миллиметры.',lk,'Собери все миллиметры из целых сантиметров и оставшихся делений.'),
      nat(step,'Каков периметр в миллиметрах?',total,'Сложи три стороны в миллиметрах.',[err(km+ml,'Ты учёл две стороны. Чтобы замкнуть границу, прибавь LK.')])];
    return {prompt:'По данным сторон треугольника KML найди его периметр. В конце вырази длину в полных сантиметрах и оставшихся миллиметрах.',inputPrompt:'Например, 12 см 5 мм',answer:text(total),answerFormat:'v5-length-pairs',steps,
      data:{triangle:{km,diff,ml,lk}},table:{caption:'Что известно о сторонах',headers:['Сторона','Дано'],rows:[['KM',text(km)],['ML','короче KM на '+text(diff)],['LK',lk%10?text(lk):lk/10+' см']]},conditionKey:[km,diff,lk].join('/')};
  }
  function tabletops(seed,r,step){
    const width=seed?r(30,54):55,ratio=seed?[3,5][r(0,1)]:3,length=width*ratio,perimeter=2*(width+length),side=perimeter/4;
    const steps=[nat(step,'Ширина стола '+width+' см, а длина в '+ratio+' раза больше. Сколько сантиметров составляет длина?',length,'Возьми ширину указанное число раз.',[err(width+ratio,'«В несколько раз» задаёт умножение. Прибавление числа раз не даёт длину.')]),
      nat(step,'Найди периметр прямоугольной столешницы в сантиметрах.',perimeter,'Обход включает две длины и две ширины.',[err(length+width,'Это только одна длина и одна ширина. Закончить обход можно по двум оставшимся сторонам.')]),
      nat(step,'Сколько равных сторон у квадратной столешницы?',4,'При обходе квадрата встречаются четыре равные стороны.')];
    return {prompt:'Квадратная столешница имеет такой же периметр, как прямоугольная. Какова сторона квадрата?',inputPrompt:'Сторона квадрата, см',answer:side,answerFormat:'v5-natural',steps,
      errors:[err(perimeter,'Это вся граница. Каждая из четырёх равных сторон получает четверть периметра.'),err(length,'Это длина прямоугольной столешницы. У второго стола четыре равные стороны.')],
      data:{tabletop:{width,length,ratio}},table:{caption:'Два стола с равными периметрами',headers:['Форма','Дано'],rows:[['Прямоугольник','Ширина '+width+' см, длина в '+ratio+' раза больше.'],['Квадрат','Периметр такой же.']]},conditionKey:width+'/'+ratio};
  }
  function flour(seed,r,step){
    const packs=seed?r(1,2):1,portions=seed?r(2,3):2,portion=seed?10*r(19,31):360,total=packs*1000,used=portions*portion,left=total-used;
    const steps=[nat(step,'В пакете '+packs+' кг муки. Сколько это граммов?',total,'В одном килограмме тысяча граммов.'),
      nat(step,'На одну порцию блинов идёт '+portion+' г муки. Сколько граммов уйдёт на '+portions+' приготовления?',used,'Умножь расход одной порции на количество приготовлений.',[err(portion+portions,'К граммам нельзя прибавлять число приготовлений. Возьми одинаковый расход для каждой порции.')])];
    return {prompt:'Сколько граммов муки останется после всех приготовлений?',inputPrompt:'Остаток, г',answer:left,answerFormat:'v5-natural',steps,
      errors:[err(total-portion,'Пока вычтен расход только на одно приготовление.'),err(used,'Это израсходованная мука. Вычти её из первоначального количества.')],data:{flour:{packs,portions,portion,total}},table:{caption:'Мука до и после приготовления',headers:['Величина','Дано'],rows:[['В пакете',packs+' кг'],['На один раз',portion+' г'],['Приготовлений',portions]]},conditionKey:[packs,portion,portions].join('/')};
  }
  function triangleView(state,task){
    const d=task.data.triangle,diff=state.gap||d.diff,ml=d.km-diff,side=state.side;
    const x=(d.km*d.km+d.lk*d.lk-ml*ml)/(2*d.km),y=Math.sqrt(Math.max(0,d.lk*d.lk-x*x)),scale=Math.min(215/d.km,90/y),height=107;
    const points=[[18,height],[18+d.km*scale,height],[18+x*scale,height-y*scale]],names=['K','M','L'],values=[d.km,ml,d.lk];
    const edges=points.map(([x0,y0],i)=>{const [x1,y1]=points[(i+1)%3];return '<line x1="'+x0+'" y1="'+y0+'" x2="'+x1+'" y2="'+y1+'" stroke="'+(side===3||side===i?'#a45114':'#39758a')+'" stroke-width="'+(side===i?4:2)+'"/><text x="'+x0+'" y="'+(i===2?y0-4:y0+15)+'" font-size="13">'+names[i]+'</text>';}).join('');
    return {title:'Сложи стороны одного треугольника',controls:[{key:'gap',title:'На сколько ML короче KM, мм (0 — как в задаче)',min:0,max:20,step:1},{key:'side',title:'Что измерить',values:[[0,'KM'],[1,'ML'],[2,'LK'],[3,'Вся граница']]}],
      visual:'<svg aria-label="Треугольник KML со сторонами в едином масштабе" role="img" viewBox="0 0 256 127">'+edges+'</svg>',question:'Сколько миллиметров составляет выбранная длина?',answer:side===3?d.km+ml+d.lk:values[side],why:'KM = '+d.km+' мм, ML = '+(d.km-diff)+' мм, LK = '+d.lk+' мм. Периметр включает все три.'};
  }
  function tableView(state,task){
    const d=task.data.tabletop,w=state.width||d.width,k=state.mult?[1,3,5][state.mult-1]:d.ratio,len=w*k,side=(w+len)/2,p=4*side,scale=Math.min(225/len,57/side,47/w),rect={w:len*scale,h:w*scale},size=side*scale;
    return {title:'Замени четыре стороны на четыре равные',controls:[{key:'width',title:'Ширина прямоугольника (0 — как в задаче)',min:0,max:70,step:1},{key:'mult',title:'Длина по сравнению с шириной',values:[[0,'Как в задаче'],[1,'Та же'],[2,'Втрое больше'],[3,'Впятеро больше']]},{key:'measure',title:'Что найти',values:[[0,'Длину прямоугольника'],[1,'Общий периметр'],[2,'Сторону квадрата']]}],
      visual:'<svg viewBox="0 0 256 139" role="img" aria-label="Исходный прямоугольник и равный ему по периметру квадрат нарисованы в одном масштабе"><rect x="12" y="9" width="'+rect.w+'" height="'+rect.h+'" fill="#e4eef2" stroke="#24617a" stroke-width="2"/><rect x="12" y="70" width="'+size+'" height="'+size+'" fill="#f6eadb" stroke="#97511c" stroke-width="2"/></svg>',
      question:'Сколько сантиметров составляет выбранная длина?',answer:[len,p,side][state.measure],why:'У прямоугольника граница '+len+' + '+w+' + '+len+' + '+w+' = '+p+' см. Сторона квадрата '+side+' см, и '+side+' × 4 = '+p+'.'};
  }
  function flourView(state,task,table){
    const d=task.data.flour,capacity=Math.min(3,Math.floor(d.total/d.portion)),count=Math.min(state.portions,capacity),used=count*d.portion,left=d.total-used,width=222,spent=width*used/d.total;
    return {title:'Отмерь муку из одного запаса',controls:[{key:'portions',title:'Сколько раз приготовили',min:0,max:capacity,step:1},{key:'rest',title:'Какая часть',values:[[0,'Израсходовано'],[1,'Осталось']]}],
      visual:'<svg viewBox="0 0 246 40" role="img" aria-label="На полосе всего запаса цветом отделены израсходованная и оставшаяся мука"><rect x="10" y="7" width="'+spent+'" height="24" fill="#af632d"/><rect x="'+(10+spent)+'" y="7" width="'+(width-spent)+'" height="24" fill="#4b8a80"/></svg>'+table('Расход по приготовлениям',['Приготовлений','Граммов за раз'],[[count,d.portion]]),
      question:'Сколько граммов '+(state.rest?'осталось':'использовано')+'?',answer:state.rest?left:used,why:'На приготовление пошло '+d.portion+' × '+count+' = '+used+' г. Остаток: '+d.total+' − '+used+' = '+left+' г.'};
  }

  function orderedLine(seed,r,step){
    const gaps=seed?[r(2,5),r(3,6),r(1,4)]:[2,4,3],pos={A:0,P:gaps[0],S:gaps[0]+gaps[1],B:gaps.reduce((a,b)=>a+b,0)};
    const pairs=['AP','AS','AB','PS','PB','SB'],length=e=>Math.abs(pos[e[0]]-pos[e[1]]);
    const comparisons=[['AP','AB'],['SB','PB'],['PS','AB']].map((pair,i)=>seed&&(seed+i)%2===1?pair.slice().reverse():pair);
    const signs=comparisons.map(([a,b])=>length(a)<length(b)?'<':'>');
    const steps=[Object.assign(step('Выпиши все различные отрезки с концами A, P, S и B.',pairs.join(' '),'Начни с точки A: у неё три других конца. У P останется два ещё не записанных отрезка, у S — один.'),
      {answerFormat:'v5-segments',nearSets:[{set:'AP PS SB',text:'Ты перечислил соседние промежутки. Можно также соединить две несоседние отмеченные точки.'}]})];
    comparisons.forEach(([a,b],i)=>steps.push(step(['а.','б.','в.'][i]+' Какой знак поставить между '+a+' и '+b+'?',signs[i],
      'Найди оба отрезка на одной прямой. Отрезок внутри другого, не совпадающий с ним, короче.',
      [{value:signs[i]==='<'?'>':'<',text:'Подсвети обе пары концов в модели. Посмотри, какой из отрезков занимает только часть другого.'}])));
    return {prefix:seed?'Новая авторская расстановка. ':'В источнике длины не заданы. ',prompt:'Отметь P и S внутри AB так, чтобы P оказалась между A и S. Можно зеркально развернуть весь рисунок. Перечисли отрезки и сравни указанные три пары. В конце введи знаки по порядку через точку с запятой.',
      inputPrompt:'Три знака, например <;>;=',answer:signs,steps,data:{lineOrder:{gaps,pos,comparisons}},
      table:{caption:'Сравнения по порядку',headers:['Часть','Слева','Справа'],rows:comparisons.map(([a,b],i)=>[['а','б','в'][i],a,b]),columnWidths:[30,35,35]},conditionKey:gaps.join('/')+'/'+comparisons.map(v=>v.join('')).join('-')};
  }
  const units={км:1000000,м:1000,дм:100,см:10,мм:1};
  function kilometres(seed,r,step){
    const how=seed?r(2,9):1,labels=['м','дм','см'],answers=labels.map(u=>how*units.км/units[u]);
    const tips=['Один километр состоит из тысячи метров.','В каждом метре десять дециметров.','В каждом метре сто сантиметров.'];
    const steps=labels.map((u,i)=>nat(step,'Сколько '+['метров','дециметров','сантиметров'][i]+' в '+how+' км?',answers[i],tips[i],
      [err(answers[i]/10,'Число в десять раз меньше нужного. Проследи переход по шкале единиц: км → м → дм → см.')]));
    return {prompt:'Вырази '+how+' км последовательно в метрах, дециметрах и сантиметрах.',inputPrompt:'Три количества через точку с запятой',answer:answers,answerFormat:'v5-list',steps,
      data:{kilometres:how},table:{caption:'Единицы в порядке ответа',headers:['Дано','Переведи в'],rows:labels.map(u=>[how+' км',u])},conditionKey:String(how)};
  }
  const firstLetter=['а','б','в','г'];
  function conversions(seed,r,step){
    const number=(value,min,max)=>seed?r(min,max):value;
    const source=[
      [[[number(22,3,21),'км']],[[number(1,2,7),'км'],[number(500,100,900),'м']],[[number(4,5,9),'км'],[number(90,1,99),'м']]],
      [[[number(2950,1200,4900),'м']],[[number(5021,5001,8900),'м']]],
      [[[number(8,3,9),'дм'],[number(3,1,8),'см']],[[number(1,2,7),'м'],[number(79,12,98),'см']],[[number(10,11,16),'м'],[number(5,1,8),'см']],[[10*number(6,2,12),'мм']],[[10*number(78,26,88),'мм']]],
      [[[number(48,21,79),'мм']],[[number(172,150,269),'мм']],[[number(508,301,699),'мм']]]];
    const targets=[['м'],['км','м'],['см'],['см','мм']];
    const rows=source.flatMap((group,g)=>group.map((parts,line)=>{
      const mm=parts.reduce((sum,[n,u])=>sum+n*units[u],0),[big,small]=targets[g],whole=Math.floor(mm/units[big]),left=small?(mm-whole*units[big])/units[small]:0,converted=small?whole+' '+big+' '+left+' '+small:String(whole);
      return {g,line,parts,mm,big,small,whole,left,converted,from:parts.map(([n,u])=>n+' '+u).join(' '),asked:small?big+' и '+small:big};
    }));
    const steps=rows.map(row=>{
      const text=firstLetter[row.g]+') '+row.from+'. Вырази в '+row.asked+'.';
      if(row.small)return {...step(text,row.converted,'Отдели полные '+row.big+', остаток запиши в '+row.small+'. Собери исходную длину для обратной проверки.'),answerFormat:'v5-length-pairs'};
      return nat(step,text,row.whole,'Переведи каждую часть в '+row.big+', затем сложи одинаковые единицы.',row.parts.length===2?[err(row.parts[0][0]+row.parts[1][0],'Ты сложил числа из разных единиц. Сначала вырази обе величины в '+row.big+'.')]:[]);
    });
    const answer=rows.filter(v=>v.g===3).map(v=>v.converted).join('; ');
    return {prompt:'Выполни все четыре группы преобразований длины. В конце запиши три ответа пункта г в сантиметрах и миллиметрах вместе с единицами, сохраняя порядок.',inputPrompt:'Три записи вида 3 см 7 мм через точку с запятой',answer,answerFormat:'v5-length-pairs',steps,
      data:{conversionRows:rows},table:{caption:'Исходные длины и требуемые единицы',headers:['Часть','Дано','Найти'],rows:rows.map(v=>[firstLetter[v.g]+(v.line+1),v.from,v.asked]),columnWidths:[23,43,34]},conditionKey:rows.map(row=>row.mm).join('/')};
  }
  function orderLineView(state,task){
    const d=task.data.lineOrder,[first,second]=d.comparisons[state.row],part=state.reverse?[second,first]:[first,second],f=x=>state.mirror?252-x:x;
    const gaps=['ap','ps','sb'].map((key,i)=>state[key]||d.gaps[i]),positions={A:0,P:gaps[0],S:gaps[0]+gaps[1],B:gaps[0]+gaps[1]+gaps[2]};
    const length=k=>Math.abs(positions[k[0]]-positions[k[1]]),pos=k=>f(15+220*positions[k]/positions.B);
    const line=[['AB',13,'#4f696c'],[part[0],31,'#9c4e13'],[part[1],48,'#1d7193']].map(([n,y,color])=>'<line x1="'+pos(n[0])+'" y1="'+y+'" x2="'+pos(n[1])+'" y2="'+y+'" stroke="'+color+'" stroke-width="3"/>').join('');
    const dots=Object.keys(d.pos).map(k=>'<circle cx="'+pos(k)+'" cy="13" r="3" fill="#173f50"/><text x="'+pos(k)+'" y="68" text-anchor="middle" font-size="13">'+k+'</text>').join('');
    return {title:'Сравни вложенные отрезки',controls:[{key:'row',title:'Какая пара',values:d.comparisons.map(([a,b],i)=>[i,a+' и '+b])},{key:'reverse',title:'Оранжевый отрезок',values:[[0,'Первый в паре'],[1,'Второй в паре']]},{key:'mirror',title:'Где точка A',values:[[0,'Слева'],[1,'Справа']]},...['ap','ps','sb'].map(key=>({key,title:'Длина '+key.toUpperCase()+' в клетках (0 — как в примере)',min:0,max:6,step:1}))],
      visual:'<svg role="img" aria-label="Два отрезка на общей прямой с порядком A, P, S, B или его зеркальным отражением" viewBox="0 0 256 77">'+line+dots+'</svg>',
      question:'Какой знак нужен между оранжевым '+part[0]+' и синим '+part[1]+'?',answer:length(part[0])<length(part[1])?'<':'>',why:'При перевороте прямой длины сохраняются. Сравни вложенные отрезки с теми же концами.'};
  }
  function scaleView(state,task,table){
    const chosen=state.how||task.data.kilometres,unit=['м','дм','см'][state.unit],ratio=units.км/units[unit];
    return {title:'Составь перевод из известных шагов',controls:[{key:'how',title:'Километры (0 — как в задаче)',min:0,max:9,step:1},{key:'unit',title:'Нужная единица',values:[[0,'Метры'],[1,'Дециметры'],[2,'Сантиметры']]}],
      visual:table('Почему количество единиц растёт',['Откуда','Куда','Сколько'],[['1 км','м',1000],['1 м','дм',10],['1 дм','см',10]]),
      question:'Сколько '+unit+' в '+chosen+' км?',answer:chosen*ratio,why:chosen+' × '+ratio+' = '+chosen*ratio+' '+unit+'. В одной крупной единице помещается много мелких.'};
  }
  function conversionView(state,task,table){
    const rows=task.data.conversionRows,item=rows[state.row],whole=state.stage===0;
    const title=whole?'Полные '+item.big:'Остаток в '+(item.small||'мм'),rest=item.mm-item.whole*units[item.big],unit=whole?item.big:item.small||'мм',amount=whole?item.whole:rest/units[unit];
    return {title:'Выдели полные единицы и остаток',controls:[{key:'row',title:'Исходная длина',values:rows.map((v,i)=>[i,firstLetter[v.g]+(v.line+1)+'. '+v.from])},{key:'stage',title:'Что найти',values:[[0,'Полные основные единицы'],[1,'Оставшаяся часть']]}],
      visual:table('Единый масштаб в миллиметрах',['Составляющая','Во что перевести'],[[item.from,item.asked],['1 '+item.big,units[item.big]+' мм']]),
      question:title+' для длины '+item.from+': сколько?',answer:amount,why:item.mm+' мм = '+item.whole+' × '+units[item.big]+' мм + '+rest+' мм. '+(rest?'Остаток меньше одной полной крупной единицы.':'Все исходные миллиметры вошли в полные единицы.')};
  }

  const roadNames=['Шоссе','Грунтовая дорога'],flightNames=['Вертолёт и самолёт','Ласточка и стриж'];
  function roadStrip(kilometres,speed,labels=roadNames){
    const unit=240/(6*(speed[0]+speed[1])),w=kilometres.map(k=>unit*k);
    return '<svg role="img" aria-label="Общая длина поездки. Первый участок ('+labels[0]+') показан синим, второй ('+labels[1]+') оранжевым." viewBox="0 0 260 42"><line x1="10" y1="28" x2="250" y2="28" stroke="currentColor"/><rect x="10" y="8" width="'+w[0]+'" height="16" fill="#20648e"/><rect x="'+(10+w[0])+'" y="8" width="'+w[1]+'" height="16" fill="#a65716"/></svg>';
  }
  function flightStrips(fast,slow,pieces){
    const unit=236/Math.max(fast,6*slow),bars=Array.from({length:pieces},(_,i)=>'<rect x="'+(12+i*slow*unit)+'" y="33" width="'+Math.max(0,slow*unit-1)+'" height="14" fill="#246989"/>').join('');
    return '<svg role="img" aria-label="Верхняя полоса означает большую скорость; нижние равные части показывают набранные меньшие скорости в том же масштабе." viewBox="0 0 260 56"><rect x="12" y="8" width="'+fast*unit+'" height="14" fill="#a65716"/>'+bars+'</svg>';
  }
  function explore(lesson,state,task,table){
    const d=task.data;
    if(d.summits)return summitView(state,task,table);
    if(d.horse)return horseView(state,task,table);
    if(d.triangle)return triangleView(state,task);
    if(d.tabletop)return tableView(state,task);
    if(d.flour)return flourView(state,task,table);
    if(d.lineOrder)return orderLineView(state,task);
    if(d.kilometres)return scaleView(state,task,table);
    if(d.conversionRows)return conversionView(state,task,table);
    if(d.trip){
      const {speed,hours,labels=roadNames,hoursLabels=['Часы на шоссе','Часы на грунтовой дороге']}=d.trip,selected=[state.hoursRoad,state.hoursDirt],kilometres=selected.map((n,i)=>speed[i]*n);
      return {title:'Собери поездку из часовых участков',controls:[{key:'hoursRoad',title:hoursLabels[0],min:0,max:6,step:1},{key:'hoursDirt',title:hoursLabels[1],min:0,max:6,step:1}],
        visual:roadStrip(kilometres,speed,labels)+table('Километры за выбранные часы',['Участок','За час','Часы'],labels.map((v,i)=>[v,speed[i]+' км',String(selected[i])])),
        question:'Сколько всего километров будет пройдено за выбранные часы?',answer:kilometres[0]+kilometres[1],why:kilometres[0]+' + '+kilometres[1]+' = '+(kilometres[0]+kilometres[1])+' км. В условии часы на двух участках — '+hours.join(' и ')+'.'};
    }
    if(d.flights){
      const i=state.pair,slow=d.flights.slow[i],fast=d.flights.fast[i],used=slow*state.pieces;
      return {title:'Уложи меньшую скорость в большую',controls:[{key:'pair',title:'Пара',values:flightNames.map((v,k)=>[k,v])},{key:'pieces',title:'Число равных частей',min:0,max:6,step:1}],
        visual:flightStrips(fast,slow,state.pieces)+table('Сравни скорости за один час',['Большая скорость','Собрано равных частей'],[[fast+' км/ч',state.pieces+' × '+slow+' км/ч']]),
        question:'На сколько км/ч собранная скорость отличается от большей?',answer:Math.abs(fast-used),why:'Собрано '+state.pieces+' × '+slow+' = '+used+' км/ч. Разница с '+fast+' равна '+Math.abs(fast-used)+' км/ч.'};
    }
    const row=d.operations[state.row],part=state.stage;
    return {title:'Сохрани смысл записи после первого действия',controls:[{key:'row',title:'Выражение',values:d.operations.map((v,i)=>[i,String(i+1)])},{key:'stage',title:'Этап',values:[[0,'Первое действие'],[1,'Оставшееся действие']]}],
      visual:table('Сейчас вычисляем',['Запись','Действие'],[[row.expr,part?row.finish:row.operation]]),
      question:'Каков результат выбранного действия?',answer:part?row.end:row.partial,why:(part?row.finish:row.operation)+' = '+(part?row.end:row.partial)+'. '+row.hint};
  }
  const generators={'1.77':trip,'1.78':flights,'1.79':order,'1.81':orderedLine,'1.82':kilometres,'1.83':conversions,'1.85':triangle,'1.86':tabletops,'1.87':flour,'1.88':summits,'1.89':horse,'1.90':excursions,'1.91':fourOperations};
  const bounds={'1.77':{hoursRoad:[0,6,3],hoursDirt:[0,6,2]},'1.78':{pair:[0,1,0],pieces:[0,6,1]},'1.79':{row:[0,3,0],stage:[0,1,0]},'1.81':{row:[0,2,0],reverse:[0,1,0],mirror:[0,1,0],ap:[0,6,0],ps:[0,6,0],sb:[0,6,0]},'1.82':{how:[0,9,0],unit:[0,2,0]},'1.83':{row:[0,12,0],stage:[0,1,0]},'1.85':{gap:[0,20,0],side:[0,3,0]},'1.86':{width:[0,70,0],mult:[0,3,0],measure:[0,2,0]},'1.87':{portions:[0,3,0],rest:[0,1,0]},'1.88':{from:[0,3,0],to:[0,3,3]},'1.89':{gait:[0,1,0],minutes:[0,18,6],measure:[0,1,0]},'1.90':{hoursRoad:[0,6,3],hoursDirt:[0,6,2]},'1.91':{row:[0,3,0],stage:[0,1,0]}};
  const api={lessons,generators,bounds,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5PrintedPageTwentyOne=api;
})(typeof window!=='undefined'?window:globalThis);
