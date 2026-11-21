/* Vilenkin et al., part 1 (2023), printed page 21, point 3. */
(function(root){
  'use strict';
  const descriptions=[
    ['1.77','Два участка одной поездки','Время на каждом участке умножай на скорость именно этого участка. Километры первой и второй части пути можно складывать.',
      ['Если ехать 2 ч со скоростью 60 км/ч, первый участок равен 120 км.','Ещё 1 ч при скорости 35 км/ч добавляет 35 км. Весь путь равен 155 км.'],'Можно сложить скорости и умножить сумму на всё время.','Как проверить вклад каждого часа пути?'],
    ['1.78','На сколько и во сколько раз','Прибавление или вычитание даёт неизвестную скорость по разности скоростей. Для сравнения в разах узнай, сколько раз меньшая скорость помещается в большей.',
      ['Быстрый катер проходит 72 км за час, второй — на 48 км меньше. Скорость второго 24 км/ч.','Сравниваем в разах: 72 : 24 = 3. Разность 48 измеряется в км/ч, а отношение 3 показывает число раз.'],'Слова «на» и «во сколько раз» требуют одного и того же вычисления.','Как умножением проверить отношение двух скоростей?'],
    ['1.79','Первое действие и значение выражения','Сначала работай в скобках. Если скобок нет, умножение выполняй раньше вычитания. Запиши промежуточное число и подставь его в оставшееся действие.',
      ['В записи 360 − 14 · 25 первым получим 350, а затем 10.','В записи (40 − 18) · 5 первым получим 22, а затем 110.'],'Вычисления во всех выражениях надо начинать с самого левого действия.','Как изменится порядок, если скобками объединить разность?']
  ];
  const links={'1.77':['natural-multiply','formula-distance'],'1.78':['division-measure','division-share'],'1.79':['order-brackets','order-equal']};
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
    const steps=rows.flatMap((row,i)=>[nat(step,(i+1)+') '+row.expr+'. Каков результат первого действия?',row.partial,row.hint,[err(row.wrong,row.hint)]),
      nat(step,(i+1)+') После первого действия осталось '+row.finish+'. Найди значение выражения.',row.end,'Подставь промежуточный результат в оставшееся действие.',[err(row.partial,'Первое действие уже выполнено. Осталось '+row.finish+'.')])]);
    return {prompt:'Найди значения четырёх выражений и введи их в порядке строк.',inputPrompt:'Четыре значения по порядку',answer:rows.map(v=>v.end),answerFormat:'v5-list',steps,
      data:{operations:rows},table:{caption:'Четыре исходные записи',headers:['Строка','Выражение'],rows:rows.map((v,i)=>[i+1,v.expr]),columnWidths:[22,78]},conditionKey:rows.map(v=>v.expr).join('/')};
  }
  const roadNames=['Шоссе','Грунтовая дорога'],flightNames=['Вертолёт и самолёт','Ласточка и стриж'];
  function roadStrip(kilometres,speed){
    const unit=240/(6*(speed[0]+speed[1])),w=kilometres.map(k=>unit*k);
    return '<svg role="img" aria-label="Общая длина поездки. Шоссе показано синим, грунтовая дорога оранжевым." viewBox="0 0 260 42"><line x1="10" y1="28" x2="250" y2="28" stroke="currentColor"/><rect x="10" y="8" width="'+w[0]+'" height="16" fill="#20648e"/><rect x="'+(10+w[0])+'" y="8" width="'+w[1]+'" height="16" fill="#a65716"/></svg>';
  }
  function flightStrips(fast,slow,pieces){
    const unit=236/Math.max(fast,6*slow),bars=Array.from({length:pieces},(_,i)=>'<rect x="'+(12+i*slow*unit)+'" y="33" width="'+Math.max(0,slow*unit-1)+'" height="14" fill="#246989"/>').join('');
    return '<svg role="img" aria-label="Верхняя полоса означает большую скорость; нижние равные части показывают набранные меньшие скорости в том же масштабе." viewBox="0 0 260 56"><rect x="12" y="8" width="'+fast*unit+'" height="14" fill="#a65716"/>'+bars+'</svg>';
  }
  function explore(lesson,state,task,table){
    const d=task.data;
    if(d.trip){
      const {speed,hours}=d.trip,selected=[state.hoursRoad,state.hoursDirt],kilometres=selected.map((n,i)=>speed[i]*n);
      return {title:'Собери поездку из часовых участков',controls:[{key:'hoursRoad',title:'Часы на шоссе',min:0,max:6,step:1},{key:'hoursDirt',title:'Часы на грунтовой дороге',min:0,max:6,step:1}],
        visual:roadStrip(kilometres,speed)+table('Километры за выбранные часы',['Участок','За час','Часы'],roadNames.map((v,i)=>[v,speed[i]+' км',String(selected[i])])),
        question:'Сколько всего километров пройдёт грузовик за выбранные часы?',answer:kilometres[0]+kilometres[1],why:kilometres[0]+' + '+kilometres[1]+' = '+(kilometres[0]+kilometres[1])+' км. В условии часы на двух дорогах — '+hours.join(' и ')+'.'};
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
  const generators={'1.77':trip,'1.78':flights,'1.79':order};
  const bounds={'1.77':{hoursRoad:[0,6,3],hoursDirt:[0,6,2]},'1.78':{pair:[0,1,0],pieces:[0,6,1]},'1.79':{row:[0,3,0],stage:[0,1,0]}};
  const api={lessons,generators,bounds,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5PrintedPageTwentyOne=api;
})(typeof window!=='undefined'?window:globalThis);
