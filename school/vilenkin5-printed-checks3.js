/* Two printed self-checks after point 3, Vilenkin (2023), part 1, p. 22. */
(function(root){
  'use strict';
  const lessons=[
    {number:'check-3-1',key:'printed-check-3-1',title:'Проверочная работа №1 · длины и столбы забора',
      explanation:'Собери все части длины в выбранных единицах. Чтобы разделить расстояние на крупную и мелкую единицы, найди частное и остаток. На одной незамкнутой стороне забора между соседними столбами на один промежуток меньше, чем столбов.',
      worked:['3 дм 20 мм = 30 см + 2 см = 32 см.','Если на прямом участке пять столбов через 3 м, от первого до последнего четыре промежутка. Длина — 12 м.'],misconception:'Семь столбов на одной стороне образуют семь промежутков.',reflect:'Почему столб, выбранный началом измерения, не добавляет целого промежутка?',requires:['v5f-segment-length'],related:['v5f-natural-multiply']},
    {number:'check-3-2',key:'printed-check-3-2',title:'Проверочная работа №2 · ломаная ABCD и периметр',
      explanation:'Путь по записи ABCD начинается в A и заканчивается в D. Чтобы обойти всю границу изображённого четырёхугольника, добавь сторону DA и вернись к началу. Измерения на бумаге делай линейкой в своём экземпляре. Масштаб экрана меняется, поэтому на авторской схеме используй виртуальную линейку.',
      worked:['Три перехода J→K→L→M образуют открытую ломаную. Обход J→K→L→M→J включает ещё один переход и замыкается.','Если четыре измерения равны 21, 19, 12 и 16 мм, периметр равен 68 мм, или 6,8 см.'],misconception:'Название ломаной ABCD само по себе требует после D вернуться в A.',reflect:'Как проверить, что сумма в сантиметрах и сумма в миллиметрах описывают одну границу?',requires:['v5f-broken-length'],related:['v5f-formula-perimeter']}
  ].map(l=>({...l,part:1,point:3,page:22,sourceCheck:true}));
  const mm={км:1000000,м:1000,дм:100,см:10,мм:1};
  function readLength(input){
    const m=String(input).trim().toLowerCase().match(/^([0-9]+(?:[.,][0-9]{1,6})?)\s*(км|дм|см|мм|м)$/u);if(!m)return null;
    const [whole,frac='']=m[1].replace(',','.').split('.'),den=10**frac.length,n=Number(whole+frac)*mm[m[2]];return Number.isSafeInteger(n)&&n%den===0?n/den:null;
  }
  function word(input){return String(input).trim().toLowerCase().replace(/ё/g,'е').replace(/[.!]$/u,'');}
  function accepts(input,target){
    if(target.answerFormat==='v5-single-length'){const a=readLength(input);return a!==null&&a===readLength(target.answer);}
    const val=word(input);return (target.words||[target.answer]).some(alias=>word(alias)===val);
  }
  const err=(value,text)=>({value,text}),nat=(step,prompt,answer,hint,errors=[])=>({...step(prompt,answer,hint,errors),answerFormat:'v5-natural'});
  const compound=(step,prompt,metres)=>({...step(prompt,Math.floor(metres/1000)+' км '+metres%1000+' м','Тысячу метров замени одним километром. Остаток меньше 1000 м.'),answerFormat:'v5-length-pairs'});
  function first(seed,r,step){
    const d=seed?{m:r(2,4),dm:r(3,8),mm:10*r(1,8),big:r(3,7),dec:r(1,8),small:r(2,5),cm:10*r(1,9),route1:r(5,9)*1000+r(130,900),route2:r(12,39)*1000+100*r(1,9),combined1:r(12,38),extra1:10*r(1,8),combined2:r(7,18),extra2:100*r(2,9),posts:r(4,10),gap:r(2,5)}:
      {m:5,dm:7,mm:90,big:4,dec:2,small:1,cm:30,route1:8563,route2:30600,combined1:30,extra1:40,combined2:13,extra2:700,posts:7,gap:2};
    const convert=(prompt,v,text)=>({...step(prompt,v+' м',text),answerFormat:'v5-single-length'});
    const a=d.combined1+d.extra1/10,b=d.combined2+d.extra2/100,t=(d.posts-1)*d.gap;
    const steps=[nat(step,'1. Сколько сантиметров в '+d.m+' м?',d.m*100,'В каждом метре сто сантиметров.'),
      nat(step,'1. Сколько сантиметров в '+d.dm+' дм '+d.mm+' мм?',d.dm*10+d.mm/10,'Дециметры умножь на 10, миллиметры раздели на 10. Сложи сантиметры.'),
      nat(step,'2. Переведи '+d.big+' м '+d.dec+' дм в дециметры.',10*d.big+d.dec,'Метр даёт десять дециметров.'),
      nat(step,'2. Переведи '+d.small+' м '+d.cm+' см в дециметры.',10*d.small+d.cm/10,'В каждом дециметре десять сантиметров.'),
      compound(step,'3. Вырази '+d.route1+' м в километрах и метрах. Введи обе единицы.',d.route1),compound(step,'3. Вырази '+d.route2+' м в километрах и метрах. Введи обе единицы.',d.route2),
      convert('4. Запиши '+d.combined1+' м '+d.extra1+' дм одной длиной со своей единицей.',a,'Выбери одну единицу: например, в метре десять дециметров. Сложи обе части и подпиши результат.'),
      convert('4. Запиши '+d.combined2+' м '+d.extra2+' см в одной выбранной единице.',b,'Можно использовать метры, сантиметры или другую единицу. Число и подпись должны обозначать исходную длину.'),
      nat(step,'5. На одной стороне '+d.posts+' столбов. Сколько промежутков от первого до последнего?',d.posts-1,'При движении от первого столба новый промежуток появляется перед каждым следующим столбом.',[err(d.posts,'Первый столб задаёт начало. Промежуток появляется лишь при переходе к соседнему.')])];
    return {prefix:seed?'Новая авторская проверочная работа. ':'Данные пяти заданий из работы №1. ',prompt:'Между соседними столбами '+d.gap+' м. Какова длина прямой стороны от первого до последнего столба?',inputPrompt:'Длина стороны, м',answer:t,answerFormat:'v5-natural',steps,
      errors:[err(d.posts*d.gap,'Посчитаны столбы вместо промежутков. Между '+d.posts+' столбами переходов на один меньше.')],data:{unitFence:d},
      table:{caption:'Пять заданий печатной работы',headers:['№','Проверь'],rows:[[1,'Сантиметры'],[2,'Дециметры'],[3,'Километры и метры'],[4,'Одна единица'],[5,'Столбы через равное расстояние']]},conditionKey:[d.m,d.route1,d.route2,d.posts,d.gap].join('/')};
  }
  function inCentimetres(millimetres){
    const divisor=millimetres%10===0?10:millimetres%5===0?5:millimetres%2===0?2:1;
    return divisor===10?millimetres/10:{n:millimetres/divisor,d:10/divisor};
  }
  const edges=['AB','BC','CD','DA'];
  function second(seed,r,step){
    const scale=seed?r(2,4):1,coords=[[0,0],[24*scale,0],[12*scale,16*scale],[0,7*scale]];
    const sides=coords.map(([x,y],i)=>{const [u,w]=coords[(i+1)%4];return Math.round(Math.hypot(x-u,y-w));}),sum=sides.reduce((x,y)=>x+y,0);
    const opening={...step('1. Как называется путь по буквам A–B–C–D, без последующего перехода к A?', 'незамкнутая','Сравни первую вершину с последней. Для замкнутой ломаной они должны совпадать.'),answerFormat:'v5-check-word',words:['незамкнутая','незамкнутая ломаная','незамкнута','открытая','открытая ломаная'],errors:[err('замкнутая','ABCD заканчивается в D, а началась в A. При полном обходе границы записали бы ABCDA.')]};
    const name={...step('2. Назови всю фигуру с границей AB–BC–CD–DA одним словом.','четырёхугольник','Сосчитай стороны замкнутой границы.'),answerFormat:'v5-check-word',words:['четырёхугольник']};
    const vertices={...step('2. Перечисли вершины этой фигуры.','ABCD','Перечисляй отмеченные точки по одному разу.'),answerFormat:'v5-line-points'};
    const set={...step('2. Перечисли стороны всей замкнутой фигуры.','AB BC CD DA','Не забудь последний возврат из D в A.'),answerFormat:'v5-segments',nearSets:[{set:'AB BC CD',text:'Так записывается открытая ломаная. Чтобы обойти весь четырёхугольник, добавь DA.'}]};
    const steps=[opening,name,vertices,set,nat(step,'3. В нашем авторском примере измерь AB на виртуальной линейке. Сколько это миллиметров?',sides[0],'Выбери AB. Первое малое деление от нуля показывает 1 мм.'),
      {...step('3. Переведи это измерение AB в сантиметры.',inCentimetres(sides[0]),'Десять миллиметров образуют один сантиметр.')},
      nat(step,'4. Каков периметр авторского примера в миллиметрах? Измерь все четыре стороны по очереди.',sum,'Четыре стороны составляют один замкнутый обход.',[err(sum-sides[3],'Получились три стороны открытой ломаной. Прибавь DA, чтобы замкнуть фигуру.')])];
    return {prefix:'Для измерения рис. 1.13 возьми свою книгу. ',prompt:'В модели можно ввести измерения четырёх сторон из своего экземпляра и проверить перевод. Для числовой проверки ниже дан отдельный авторский пример с виртуальной линейкой. Вырази его периметр в сантиметрах.',inputPrompt:'Периметр авторской фигуры, см',answer:inCentimetres(sum),steps,
      errors:[err(sum,'Число пока в миллиметрах. В сантиметрах значение в десять раз меньше.')],data:{quadCheck:{coords,sides,sum}},table:{caption:'Что сравнить на двух чертежах',headers:['Часть','Вопрос'],rows:[[1,'Открытая ломаная ABCD'],[2,'Фигура и её граница'],[3,'AB в мм и см'],[4,'Периметр в мм и см']]},conditionKey:coords.flat().join('/')};
  }
  function fencePicture(count,gap){
    const start=15,end=245;return '<svg role="img" viewBox="0 0 260 66" aria-label="Открытая сторона забора, '+count+' столбов и промежутки между соседними"><path d="M15 31H245" stroke="#a45b2c" stroke-width="4"/>'+Array.from({length:count},(_,i)=>{const x=start+i*(end-start)/(count-1);return '<path d="M'+x+' 14V48" stroke="#38576b" stroke-width="3"/><text x="'+x+'" y="62" font-size="9" text-anchor="middle">'+(i+1)+'</text>';}).join('')+'</svg><p>Между соседними столбами '+gap+' м.</p>';
  }
  function ruler(quad,selected){
    const sides=quad.sides,height=Math.max(...quad.coords.map(x=>x[1])),width=Math.max(...quad.coords.map(x=>x[0])),f=Math.min(205/width,76/height),points=quad.coords.map(([x,y])=>[(252-width*f)/2+x*f,16+y*f]),ticks=Array.from({length:sides[selected]+1},(_,k)=>{const x=14+k*218/sides[selected];return '<line x1="'+x+'" y1="16" x2="'+x+'" y2="'+(k%10===0?28:k%5===0?24:20)+'" stroke="#3c5966"/>'+(k%10===0?'<text x="'+x+'" y="41" text-anchor="middle" font-size="11">'+k+'</text>':'');}).join('');
    const [ax,ay]=points[0],rightAngle='<path d="M'+(ax+7)+' '+ay+'v7h-7" fill="none" stroke="#30505e" aria-label="Прямой угол при A"/>';
    return '<svg role="img" viewBox="0 0 252 114" aria-label="Авторский четырёхугольник ABCD, выделена сторона '+edges[selected]+'">'+points.map(([x,y],i)=>{const [xx,yy]=points[(i+1)%4];return '<line x1="'+x+'" y1="'+y+'" x2="'+xx+'" y2="'+yy+'" stroke="'+(i===selected?'#9a4b15':'#3a7585')+'" stroke-width="'+(i===selected?4:2)+'"/><text x="'+(x+3)+'" y="'+(i<=1?y-3:y+16)+'" font-size="15">'+'ABCD'[i]+'</text>';}).join('')+rightAngle+'</svg><svg role="img" aria-label="Виртуальная линейка в миллиметрах для '+edges[selected]+'" viewBox="0 0 255 49"><path d="M14 16H232" stroke="#4a6571"/>'+ticks+'<path d="M14 8H232 M14 4V13 M232 4V13" stroke="#a75524" stroke-width="2"/><text x="236" y="41" font-size="10">мм</text></svg>';
  }
  function explore(l,s,t,table){
    if(t.data.unitFence){
      const d=t.data.unitFence,posts=s.posts||d.posts,gap=s.gap||d.gap;
      return {title:'Измерь промежутки между столбами',controls:[{key:'posts',title:'Столбы (0 — как в работе)',min:0,max:12,step:1},{key:'gap',title:'Между столбами, м (0 — как в работе)',min:0,max:6,step:1},{key:'what',title:'Что определить',values:[[0,'Число промежутков'],[1,'Длину стороны']]}],
        visual:posts===1?'<p>Один столб задаёт начало. Между разными столбами пока нет ни одного промежутка.</p>':fencePicture(posts,gap),question:s.what?'Какова длина стороны в метрах?':'Сколько промежутков показано?',answer:s.what?(posts-1)*gap:posts-1,why:'У '+posts+' столбов '+(posts-1)+' промежутков. Протяжённость '+(posts-1)+' × '+gap+' = '+(posts-1)*gap+' м.'};
    }
    const d=t.data.quadCheck,controls=[{key:'paper',title:'Какой чертёж измеряешь',values:[[0,'Авторская схема'],[1,'Рисунок 1.13 в моей книге']]},{key:'edge',title:'Сторона',values:edges.map((v,i)=>[i,v])},{key:'ask',title:'Что выразить',values:[[0,'Выбранную сторону, мм'],[1,'Выбранную сторону, см'],[2,'Периметр, мм'],[3,'Периметр, см']]}],measurements=edges.map((_,i)=>s['length'+i]);
    const needed=new Set(s.ask<2?[s.edge]:[0,1,2,3]),missing=[...needed].filter(i=>!measurements[i]).length;
    if(s.paper)controls.push({key:'length'+s.edge,title:'Моё измерение '+edges[s.edge]+' в миллиметрах (0 — ещё не введено)',min:0,max:250,step:1});
    const values=s.paper?measurements:d.sides,n=s.ask<2?values[s.edge]:values.reduce((a,b)=>a+b,0),result=s.ask%2?inCentimetres(n):n;
    const visual=s.paper?table('Твои измерения в книге',['Сторона','Длина'],edges.map((v,i)=>[v,measurements[i]?measurements[i]+' мм':'Ещё не введена'])):ruler(d,s.edge);
    return {title:'Измерь сторону и периметр',controls,visual,question:s.paper&&missing?'Сколько нужных измерений ещё предстоит ввести?':((s.ask<2?edges[s.edge]:'Периметр')+' в '+(s.ask%2?'сантиметрах':'миллиметрах')+': сколько?'),
      answer:s.paper&&missing?missing:result,why:s.paper&&missing?'Переключай стороны и вводи каждое измерение из своего экземпляра.':'Получено '+n+' мм, или '+String(n/10).replace('.',',')+' см. Периметр включает все четыре стороны.'};
  }
  const bounds={'check-3-1':{posts:[0,12,0],gap:[0,6,0],what:[0,1,0]},'check-3-2':{paper:[0,1,0],edge:[0,3,0],ask:[0,3,0],length0:[0,250,0],length1:[0,250,0],length2:[0,250,0],length3:[0,250,0]}};
  const api={lessons,generators:{'check-3-1':first,'check-3-2':second},bounds,explore,accepts};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5ChecksPointThree=api;
})(typeof window!=='undefined'?window:globalThis);
