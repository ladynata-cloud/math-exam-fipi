/* Closing ordinary exercises in Vilenkin, first volume, point 4, p. 26. */
(function(root){
  'use strict';
  const lessons=[
    ['1.122','Две части Останкинской башни','В учебной задаче башня состоит из двух частей. Сначала найди высоту опоры, сравнивая её с известной металлической частью. Затем сложи обе части.','Если верх имеет длину 7 м, а основание длиннее на 5 м, высота основания 12 м, общая высота 19 м.','Разность высот частей и высота опоры — одна величина.'],
    ['1.123','Обратно по тому же пути','Путь туда и обратно одинаковый. По скорости и времени первого движения узнай длину пути. Раздели её на скорость обратного движения. Когда скорость вдвое меньше, времени для того же пути потребуется вдвое больше.','Если до клуба дошли за 8 минут по 60 м/мин, это 480 м. При обратной скорости 40 м/мин понадобится 12 минут.','При уменьшении скорости на том же пути время тоже уменьшается.'],
    ['1.124','Четыре выражения с разным порядком действий','Сначала вычисли выражения в скобках. Вне скобок умножение и деление имеют одинаковый приоритет и выполняются слева направо. Суммы и разности выполняй после их членов.','В 6 × (22 + 3) : 5 сначала найди 25, затем 150 и, наконец, 30.','Для всех четырёх выражений достаточно начинать с первого слева знака.'],
    ['1.125','Сажени и локти в метрах и сантиметрах','Для этой задачи возьми мерки из исторической справки учебника: маховая сажень около 176 см, косая около 248 см, локоть около 53 см. Найди общий результат в сантиметрах и выдели полные сотни.','Одна маховая сажень и два локтя дают 176 + 2 × 53 = 282 см, то есть примерно 2 м 82 см.','Одинаковое слово «сажень» делает маховую и косую сажени равными.']
  ].map(([number,title,explanation,worked,misconception])=>({number,title,key:'printed-'+number.replace('.','-'),explanation,worked:[worked],misconception,reflect:'Как проверить итоговый ответ другим действием?',part:1,point:4,page:26,requires:['v5f-printed-1-115'],related:['v5f-printed-1-109']}));
  const opt=(key,title,arr)=>({key,title,values:arr.map((s,i)=>[i,s])}),err=(value,text)=>({value,text});
  function tower(seed,r,step){
    const upper=seed?r(85,170):155,extra=seed?r(108,260):229,base=upper+extra;
    const steps=[step('Какова высота опоры в метрах, если она длиннее верхней части на '+extra+' м?',base,'К высоте известной части прибавь величину, на которую опора её превышает.',[err(extra,'Это только отличие двух высот. Для всей опоры прибавь высоту известной части.'),err(extra-upper,'Слово «длиннее» означает, что опора должна быть выше верхней части.')]),
      step('Высота всей конструкции в метрах?',base+upper,'Две части расположены одна над другой. Запиши сумму высоты опоры и высоты верха.',[err(base,'Найдена только опора. Над ней остаётся верхняя часть.')])];
    return {prefix:seed?'Новая авторская башня. ':'Рассчитывай по данным учебника о двух частях Останкинской башни. ',prompt:'Сколько метров составляет общая высота по этим данным?',inputPrompt:'Общая высота, м',answer:base+upper,steps,errors:[err(upper+extra,'Ты нашёл только опору. Верхняя часть тоже входит в полную высоту.')],data:{tower:{upper,extra,base}},table:{caption:'Длины по условию',headers:['Часть','Что известно'],rows:[['Верх',upper+' м'],['Опора','Длиннее верха на '+extra+' м']]},conditionKey:upper+'/'+extra};
  }
  function journey(seed,r,step){
    const back=seed?r(35,75):55,ratio=seed?r(2,4):2,v=ratio*back,t=seed?r(5,19):10,s=v*t;
    const steps=[step('До места встречи двигались '+t+' мин со скоростью '+v+' м/мин. Каков путь в метрах?',s,'Умножь скорость первого движения на время в минутах.'),
      step('Во сколько раз обратная скорость '+back+' м/мин меньше первой?',ratio,'Раздели большую скорость на меньшую.'),
      step('Сколько минут займёт обратная дорога?',s/back,'Одинаковое расстояние раздели на обратную скорость.',[err(t,'Это время первого движения. Обратно скорость меньше, требуется больше времени.')])];
    return {prefix:'До встречи и после неё пройден один и тот же путь. ',prompt:'Сколько минут потребовалось на обратную дорогу?',inputPrompt:'Минуты',answer:s/back,steps,errors:[err(t+'/'+ratio,'При уменьшении скорости для того же пути время увеличивается.'),err(s,'Это расстояние в метрах, а нужно время.')],data:{home:{v,t,back,ratio,s}},table:{caption:'Один маршрут в двух направлениях',headers:['Направление','Данные'],rows:[['Туда',v+' м/мин, '+t+' мин'],['Домой',back+' м/мин']]},conditionKey:v+'/'+t+'/'+back};
  }
  function operations(seed,r,step){
    let nums;
    if(seed){
      const a=[r(200,490),r(12,38),r(40,78),r(11,27)],d=r(18,41),q=r(6900,8600),m=r(45,76),n=r(51,82),div=r(8,28),inc=r(3,9)*div,lower=r(240,450),u=r(15,85),u2=r(11,78),m2=r(18,75),scale=r(2,7),sum=scale*r(60,120);
      nums=[a,[d*q,d,m,n],[lower+inc,lower,u,div],[m2,u2,sum-u2,m2*scale]];
    }else nums=[[434,31,65,17],[179800,29,72,78],[607,427,84,36],[68,256,144,340]];
    const [a,b,c,d]=nums,values=[[a[0]*a[1],a[2]*a[3],a[0]*a[1]+a[2]*a[3]],[b[0]/b[1],b[2]*b[3],b[0]/b[1]-b[2]*b[3]],[c[0]-c[1],(c[0]-c[1])*c[2],(c[0]-c[1])*c[2]/c[3]],[d[1]+d[2],d[0]*(d[1]+d[2]),d[0]*(d[1]+d[2])/d[3]]];
    const expressions=[a[0]+' × '+a[1]+' + '+a[2]+' × '+a[3],b[0]+' : '+b[1]+' − '+b[2]+' × '+b[3],'('+c[0]+' − '+c[1]+') × '+c[2]+' : '+c[3],d[0]+' × ('+d[1]+' + '+d[2]+') : '+d[3]];
    const names=[['Первое произведение','Второе произведение','Сумма произведений'],['Частное','Произведение','Разность'],['Разность в скобках','Умножение','Деление'],['Сумма в скобках','Умножение','Деление']];
    const steps=values.flatMap((row,i)=>row.map((n,j)=>step('абвг'[i]+'. '+expressions[i]+'. Найди: '+names[i][j].toLowerCase()+'.',n,'Расположи результаты в таком порядке: '+names[i].join(' → ')+'.',j===2&&row[1]!==n?[err(row[1],'Это ещё промежуточное число. Выполни последнее действие этого подпункта.')]:[])));
    return {prefix:'Проверь все четыре вычисления. ',prompt:'Запиши четыре итоговых результата от а до г через точку с запятой.',inputPrompt:'Четыре результата',answer:values.map(r=>r[2]),answerFormat:'v5-list',steps,errors:[],data:{ops:{nums,values,expressions,names}},table:{caption:'Четыре исходных выражения',headers:['№','Выражение'],rows:expressions.map((e,i)=>['абвг'[i],e])},conditionKey:nums.flat().join('/')};
  }
  const names=['Маховая сажень','Косая сажень','Локоть'],sizes=[176,248,53],namesOfThings=['Стог','Верёвка','Колокольня'];
  function oldMeasure(seed,r,step){
    const counts=seed?[[r(1,7),0,0],[r(1,5),0,r(1,5)],[0,r(15,39),r(1,6)]]:[[2,0,0],[2,0,3],[0,32,3]];
    const totals=counts.map(row=>row.reduce((s,n,i)=>s+n*sizes[i],0)),show=n=>Math.floor(n/100)+' м '+(n%100)+' см';
    const steps=counts.flatMap((row,i)=>[step('абв'[i]+'. '+namesOfThings[i]+'. Сколько получится сантиметров при мерках 176, 248 и 53 см?',totals[i],'Умножь число мер каждого вида на его длину, затем сложи использованные величины.',i===2?[err(row[1]*176+row[2]*53,'В этой строке взята косая сажень, длина которой 248 см. Маховая сажень короче.')]:[]),
      {...step('абв'[i]+'. Вырази длину в полных метрах и оставшихся сантиметрах, например 3 м 7 см.',show(totals[i]),'В ста сантиметрах один метр. Оставшихся сантиметров должно быть меньше ста.'),answerFormat:'v5-length-pairs'}]);
    const phrases=counts.map(row=>row.map((n,i)=>n?names[i]+': '+n:'').filter(Boolean).join('; '));
    return {prefix:'Используй именно приближённые мерки из справки учебника. ',prompt:'Запиши все три длины в метрах и сантиметрах, разделяя строки точкой с запятой.',inputPrompt:'Три длины с единицами',answer:totals.map(show).join('; '),answerFormat:'v5-length-pairs',steps,errors:[],data:{measures:{counts,totals}},table:{caption:'Сколько старинных мер в каждом предмете',headers:['Предмет','Количество мер'],rows:phrases.map((v,i)=>[namesOfThings[i],v])},conditionKey:counts.flat().join('/')};
  }
  function bar(upper,extra){
    const base=upper+extra,total=base+upper,scale=162/total,b=base*scale,u=upper*scale;
    return '<svg role="img" viewBox="0 0 250 188" aria-label="Верхняя часть '+upper+' метров, опора состоит из такой же длины и ещё '+extra+' метров."><path d="M60 175V'+(175-b)+'h34v'+b+'z" fill="#b4c9d2" stroke="#426377"/><path d="M67 '+(175-b)+'v-'+u+'h20v'+u+'z" fill="#e4be91" stroke="#8d5730"/><path d="M99 '+(175-b)+'h20M99 '+(175-b-u)+'h20M98 175h21" stroke="#4e5959"/><text x="124" y="'+(180-b-u/2)+'" style="font:12px sans-serif">Верх '+upper+' м</text><text x="124" y="'+(178-b/2)+'" style="font:12px sans-serif">Опора длиннее</text></svg>';
  }
  function diagram(t){return t.data.tower?bar(t.data.tower.upper,t.data.tower.extra):'';}
  function explore(l,s,t,table){
    const d=t.data;
    if(d.tower){const x=d.tower,added=x.extra+s.delta,b=x.upper+added;return {title:'Измени разницу высот',controls:[{key:'delta',title:'Ещё метров к разнице',min:0,max:50,step:1},opt('ask','Найти',['Высоту опоры','Высоту всей башни'])],visual:bar(x.upper,added),question:'Разница стала '+added+' м. Какова '+(s.ask?'общая высота':'высота опоры')+' в метрах?',answer:s.ask?b+x.upper:b,why:'Опора равна верху плюс разница; сверху на опоре стоит ещё одна часть.'};}
    if(d.home){const x=d.home,mins=s.minutes||x.t,dist=mins*x.v;return {title:'Измени время первого движения',controls:[{key:'minutes',title:'Минуты пути туда (0 — из условия)',min:0,max:24,step:1},opt('ask','Что найти',['Расстояние в метрах','Минуты обратно'])],visual:table('Маршрут',['Направление','Скорость'],[['Туда',x.v+' м/мин'],['Обратно',x.back+' м/мин']]),question:'При '+mins+' минутах туда чему равно '+(s.ask?'обратное время в минутах':'расстояние в метрах')+'?',answer:s.ask?dist/x.back:dist,why:'Для обратной дороги бери расстояние первого движения.'};}
    if(d.ops){const o=d.ops,i=s.item,j=s.action;return {title:'Проследи выбранное действие',controls:[opt('item','Подпункт',Array.from('абвг')),opt('action','Что искать',o.names[i])],visual:table('Рабочая строка',['Выражение','Ищем'],[[o.expressions[i],o.names[i][j]]]),question:'Какое число получится на выделенном действии?',answer:o.values[i][j],why:'Сначала учитывай скобки и приоритет умножения и деления.'};}
    const v=d.measures,i=s.item,j=s.which,amt=v.counts[i][j]+s.more,contribution=amt*sizes[j],total=v.totals[i]+s.more*sizes[j];return {title:'Сложи длины из исторических мер',controls:[opt('item','Предмет',namesOfThings),opt('which','Какую меру менять',names),{key:'more',title:'Дополнительное число выбранных мер',min:0,max:5,step:1},opt('ask','Что найти',['Выбранная часть длины','Весь предмет'])],visual:table('Вклад одной мерки',['Мерка','Число'],[[names[j]+' ('+sizes[j]+' см)',amt]]),question:'Сколько сантиметров составит '+(s.ask?'вся новая длина':'только выбранная часть')+'?',answer:s.ask?total:contribution,why:'Количество каждой мерки умножь на её длину; для итога сложи части.'};
  }
  const api={lessons,generators:{'1.122':tower,'1.123':journey,'1.124':operations,'1.125':oldMeasure},bounds:{'1.122':{delta:[0,50,0],ask:[0,1,0]},'1.123':{minutes:[0,24,0],ask:[0,1,0]},'1.124':{item:[0,3,0],action:[0,2,0]},'1.125':{item:[0,2,0],which:[0,2,0],more:[0,5,0],ask:[0,1,0]}},diagram,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5Page26Measures=api;
})(typeof window!=='undefined'?window:globalThis);
