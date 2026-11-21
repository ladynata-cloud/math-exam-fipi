/* Printed part 1, point 3, p. 20 (Vilenkin, 2023). Four distinct source exercises. */
(function(root){
  'use strict';
  const descriptions=[
    ['1.73','Все двузначные записи из разрешённых цифр','Сначала выбирай десятки. Ноль слева не образует двузначное число. Для каждой разрешённой ненулевой первой цифры перебери все цифры единиц. Одинаковые цифры можно использовать повторно.',
      ['Из цифр 0, 2 и 7 начинаем с 2: получаются 20, 22, 27.','Если начать с 7, получатся 70, 72, 77. Запись 02 не двузначная.'],'Если ноль есть в наборе цифр, с него можно начать двузначную запись.','Как проверить, что ни один случай не потерялся?'],
    ['1.74','Три цифры без повторений','На место сотен можно поставить любую из трёх ненулевых цифр. В десятках остаются две возможности, а для единиц остаётся одна. Максимум строят, начиная с наибольшей доступной цифры, минимум — с наименьшей.',
      ['Для цифр 1, 5 и 8 с первой цифрой 5 выходят числа 518 и 581.','У трёх возможных начал по два продолжения. Получается 3 × 2 × 1 = 6 записей.'],'Разрешённую цифру можно использовать ещё раз, даже когда условие исключает повторения.','Почему при фиксированной первой цифре две другие могут занять ровно два порядка?'],
    ['1.75','Сравни расстояния до одного начала','Все расстояния даны от одной точки. Сначала найди более близкую точку по разности, затем восстанови третье расстояние. После сравнения переведи миллионы километров в километры.',
      ['Пусть до первой точки 900 млн км. Вторая ближе на 620 млн км, поэтому до неё 280 млн км.','Если третья дальше второй на 230 млн км, до неё 510 млн км. Разница первой и третьей — 390 млн км, или 390 000 000 км.'],'Разность, полученная из чисел в миллионах километров, сразу выражена в единичных километрах.','Что означает число 1 в столбце с заголовком «млн км»?'],
    ['1.76','Сколько времени займёт второй путь?','Равномерная скорость показывает, сколько километров проезжают за один час. Раздели известную длину на время, затем новую длину на полученную скорость.',
      ['За 3 часа велосипедист проехал 45 км. За один час он проезжает 45 : 3 = 15 км.','Чтобы при такой скорости пройти 30 км, нужно 30 : 15 = 2 часа.'],'Чтобы найти время движения, длину пути всегда умножают на скорость.','Как подставить найденное время и проверить второй путь?']
  ];
  const lessons=descriptions.map(([number,title,explanation,worked,misconception,reflect])=>({number,key:'printed-'+number.replace('.','-'),part:1,point:3,page:20,title,explanation,worked,misconception,reflect,requires:['v5f-place-value'],related:['v5f-natural-add']}));
  const labels=['а','б','в'],err=(value,text)=>({value,text});
  const nat=(step,prompt,answer,hint,errors=[])=>Object.assign(step(prompt,answer,hint,errors),{answerFormat:'v5-natural'});
  const unordered=(step,prompt,answer,hint,errors=[])=>Object.assign(step(prompt,answer,hint,errors),{answerFormat:'unordered'});
  const fmt=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
  const byValue=(a,b)=>a-b;
  function twos(seed,r,step){
    const first=seed?r(1,3):4,middle=seed?r(1,4):4,last=seed?r(6,9):5;
    const groups=seed?[[first,0],[last,middle,0],[r(2,5),r(6,9)]]:[[4,0],[5,4,0],[4,9]];
    const numbers=groups.map(digits=>digits.filter(n=>n!==0).flatMap(a=>digits.map(b=>10*a+b)).sort(byValue));
    const steps=groups.map((digits,i)=>{
      const onlyDistinct=numbers[i].filter(n=>Math.floor(n/10)!==n%10);
      return unordered(step,labels[i]+'. Цифры '+digits.join(', ')+'. Введи все разные двузначные числа через точку с запятой в удобном порядке.',numbers[i],
        'Составь отдельную строку для каждой ненулевой цифры десятков. В единицах используй все разрешённые цифры.',[err(onlyDistinct,'В этом номере повторять цифры можно. Для каждого начала проверь единицы, совпадающие с десятками.')]);
    });
    const chosen=seed?r(0,2):2;
    return {prompt:'Выпиши все двузначные числа из набора '+groups[chosen].join(', ')+'. Повторение цифр допускается. В разборе пройди все три набора.',inputPrompt:'Числа через точку с запятой',answer:numbers[chosen],answerFormat:'unordered',steps,errors:steps[chosen].errors,
      data:{groups,numbers},table:{caption:'К каждому набору свой список',headers:['Часть','Цифры'],rows:groups.map((g,i)=>[labels[i],g.join(', ')]),columnWidths:[30,70]},conditionKey:groups.map(g=>g.join('')).join('/')+'-'+chosen};
  }
  function threes(seed,r,step){
    const digits=seed?[r(1,3),r(4,6),r(7,9)]:[2,4,6];
    const numbers=digits.flatMap(a=>digits.filter(b=>b!==a).map(b=>100*a+10*b+digits.find(c=>c!==a&&c!==b))).sort(byValue);
    const low=numbers[0],high=numbers.at(-1);
    const steps=[nat(step,'Сколько цифр годится для сотен?',3,'Любая из трёх предложенных цифр ненулевая.'),
      nat(step,'После выбора сотен сколько разных цифр осталось для десятков?',2,'Убери уже использованную цифру.',[err(3,'Так ты снова разрешил уже использованную цифру сотен.')]),
      nat(step,'После заполнения первых двух мест сколько цифр осталось для единиц?',1,'Обе занятые цифры выбыли.'),
      nat(step,'а. Сколько всего трёхзначных записей без повторов?',6,'Для каждого из трёх начал есть две ветви продолжения.',[err(27,'Три варианта в каждом разряде дали бы повторы. После каждого выбора остаётся меньше цифр.')]),
      nat(step,'б. Какое число самое большое?',high,'Поставь наибольшую цифру в сотни, затем выбери наибольшую из двух оставшихся.'),
      nat(step,'б. Какое число самое маленькое?',low,'Первой возьми самую маленькую разрешённую цифру.')];
    return {prompt:'Для цифр '+digits.join(', ')+' укажи по порядку число разных трёхзначных записей без повторяющихся цифр, самую большую и самую маленькую записи.',inputPrompt:'Количество; максимум; минимум',answer:[6,high,low],answerFormat:'v5-list',steps,
      errors:[err([6,low,high],'Числа найдены, теперь запиши сначала наибольшее и только затем наименьшее.')],data:{digits,numbers},
      table:{caption:'Три цифры используются по одному разу',headers:['Можно выбрать'],rows:digits.map(d=>[d])},conditionKey:digits.join('-')};
  }
  function distances(seed,r,step){
    const near=seed?r(135,315):207,closer=seed?r(1800,2600):2528,further=seed?r(750,1430):1143,far=near+closer,third=near+further,gap=far-third,answer=gap*1000000;
    const names=seed?['точки А','точки Б','точки В']:['Урана','Марса','Сатурна'],prefix=seed?'Новая условная карта. ':'Данные расстояний из учебника; величины даны в миллионах километров. ';
    const steps=[nat(step,'До '+names[0]+' '+fmt(far)+' млн км. До '+names[1]+' на '+fmt(closer)+' млн км ближе. Сколько миллионов километров до '+names[1]+'?',near,'Из дальней длины вычти, на сколько другая точка ближе.',[err(far+closer,'Если точка ближе к общему началу, её расстояние меньше.')]),
      nat(step,'До '+names[2]+' на '+fmt(further)+' млн км дальше, чем до '+names[1]+'. Чему равно это расстояние в миллионах километров?',third,'Добавь указанную разность к расстоянию до более близкой точки.',[err(further,'Это прибавка. Сначала возьми найденное расстояние до более близкой точки.')]),
      nat(step,'На сколько миллионов километров расстояние до '+names[0]+' больше расстояния до '+names[2]+'?',gap,'Вычти из большего расстояния меньшее. Можно проверить разностью двух исходных сравнений.')];
    return {prefix,prompt:'Найди разницу расстояний до '+names[0]+' и до '+names[2]+' в километрах. Данные таблицы записаны в миллионах километров.',inputPrompt:'Разница в километрах',answer,answerFormat:'v5-natural',steps,
      errors:[err(gap,'Разность в миллионах найдена. В окончательном ответе запиши километры: в одном миллионе 1 000 000.'),err(third*1e6,'Это всё расстояние до третьей точки. Сравни его с расстоянием до первой.')],data:{distances:[near,third,far],names:[names[1],names[2],names[0]]},
      table:{caption:'Длины от одного начала',headers:['До чего','Дано, млн км'],rows:[[names[0],fmt(far)],[names[1],'на '+fmt(closer)+' ближе, чем до '+names[0]],[names[2],'на '+fmt(further)+' дальше, чем до '+names[1]]],columnWidths:[32,68]},conditionKey:[near,closer,further].join('/')};
  }
  function cycling(seed,r,step){
    const speed=seed?r(8,20):12,hours=seed?r(3,7):5;
    let next=seed?(hours===3?5:r(1,hours-1)):4;
    if(seed&&speed===12&&hours===5&&next===4)next=3;
    const way=hours*speed,second=next*speed;
    const steps=[nat(step,'За '+hours+' ч велосипедист проехал '+way+' км. Сколько километров приходится на один час?',speed,'Раздели длину первого маршрута на время.',[err(way*hours,'Умножение длины на часы не показывает путь за один час.')]),
      nat(step,'Для второго пути '+second+' км сколько таких часовых отрезков понадобится?',next,'Часовой участок имеет длину '+speed+' км. Раздели новую длину на него.',[err(speed,'Это скорость. Теперь найди по ней время второго пути.')])];
    return {prompt:'Найди время второго пути, если скорость та же, что на первом.',inputPrompt:'Время в часах',answer:next,answerFormat:'v5-natural',steps,
      errors:[err(hours,'Это время для первого пути. Сравни длины обоих маршрутов.'),err(second*speed,'Для нахождения времени сравни путь с длиной одного часового участка.')],data:{cycling:{speed,hours,next,way,second}},
      table:{caption:'Два пути с одной скоростью',headers:['Путь','Длина','Время'],rows:[['Первый',way+' км',hours+' ч'],['Второй',second+' км','?']],columnWidths:[34,33,33]},conditionKey:[speed,hours,next].join('/')};
  }
  function explore(l,s,t,table) {
    const d=t.data;
    if(d.groups){
      const digits=d.groups[s.group],allowed=s.tensDigit!==0&&digits.includes(s.tensDigit);
      const leaves=allowed?digits.map(v=>s.tensDigit*10+v):[];
      const why=s.tensDigit===0?'Ноль слева дал бы однозначную запись.':!allowed?'Такой цифры в выбранном наборе нет.':'Первые цифры совпадают, а окончания '+digits.join(', ')+' дают '+leaves.length+' разных продолжений.';
      return {title:'Выбери цифру десятков',controls:[{key:'group',title:'Набор',values:labels.map((v,i)=>[i,v])},{key:'tensDigit',title:'Цифра десятков',min:0,max:9,step:1}],
        visual:table('Разрешённые единицы',['Единицы','Запись'],digits.map(v=>[v,allowed?String(s.tensDigit)+String(v):'нет двузначной записи'])),
        question:'Сколько разных двузначных чисел получится с выбранными десятками?',answer:leaves.length,why};
    }
    if(d.digits){
      const h=d.digits[s.hundreds],tens=d.digits[s.tens],rest=h===tens?[]:d.digits.filter(n=>n!==h&&n!==tens);
      const select=key=>({key,title:key==='hundreds'?'Сотни':'Десятки',values:d.digits.map((v,i)=>[i,String(v)])});
      return {title:'Каждую цифру используй один раз',controls:[select('hundreds'),select('tens')],
        visual:table('Собери трёхзначную запись',['Сотни','Десятки','Единицы'],[[h,tens,rest.length?'?':'повтор']]),
        question:'Сколько допустимых способов закончить именно это начало?',answer:rest.length,why:rest.length?'Две разные цифры уже заняты. Единственная свободная цифра — '+rest[0]+'.':'Одна цифра уже дважды занята. Исправь один из двух разрядов.'};
    }
    if(d.distances){
      const maximum=Math.max(...d.distances),points=d.distances.map(n=>12+248*n/maximum);
      const fig='<svg role="img" aria-label="Три расстояния от общего начала в одной шкале" viewBox="0 0 275 90">'+points.map((x,i)=>{
        const y=16+28*i,color=i===s.from||i===s.to?'#9d4b17':'#357867';
        return '<line x1="12" y1="'+y+'" x2="'+x+'" y2="'+y+'" stroke="'+color+'" stroke-width="6"/><circle cx="'+x+'" cy="'+y+'" r="5" fill="'+color+'"/>';
      }).join('')+'</svg>';
      const pick=key=>({key,title:key==='from'?'Первое расстояние':'Второе расстояние',values:d.names.map((name,i)=>[i,'До '+name])});
      const gap=Math.abs(d.distances[s.to]-d.distances[s.from]),unit=s.unit?'км':'млн км';
      return {title:'Сравни длины от одного начала',controls:[pick('from'),pick('to'),{key:'unit',title:'Единица ответа',values:[[0,'Миллионы километров'],[1,'Километры']]}],
        visual:fig+table('Полосы сверху вниз',['До точки','Млн км'],d.distances.map((n,i)=>[d.names[i],fmt(n)])),question:'Какова разница выбранных расстояний в '+unit+'?',
        answer:gap*(s.unit?1000000:1),why:'В одной шкале разница равна '+fmt(gap)+' млн км.'+(s.unit?' Это '+fmt(gap*1000000)+' км.':'')};
    }
    const c=d.cycling,dist=s.hours*c.speed,gap=Math.abs(dist-c.second);
    const stops=Array.from({length:s.hours+1},(_,i)=>[i+' ч',i*c.speed+' км']);
    return {title:'Часовые участки пути',controls:[{key:'hours',title:'Сколько часов ехали',min:0,max:8,step:1},{key:'what',title:'Что сравнить',values:[[0,'Весь путь'],[1,'Разница со вторым путём']]}],
      visual:table('Одинаковая скорость на каждом часе',['Время','Путь'],stops),
      question:s.what?'На сколько километров построенная длина отличается от длины второго маршрута?':'Сколько километров получено за выбранное число часов?',answer:s.what?gap:dist,
      why:s.what?'Сравни '+dist+' км и '+c.second+' км: разница '+gap+' км.':s.hours+' × '+c.speed+' = '+dist+' км.'};
  }
  const generators={'1.73':twos,'1.74':threes,'1.75':distances,'1.76':cycling};
  const bounds={'1.73':{group:[0,2,0],tensDigit:[0,9,4]},'1.74':{hundreds:[0,2,0],tens:[0,2,1]},'1.75':{from:[0,2,2],to:[0,2,1],unit:[0,1,0]},'1.76':{hours:[0,8,2],what:[0,1,0]}};
  const api={lessons,generators,bounds,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5PrintedPageTwenty=api;
})(typeof window!=='undefined'?window:globalThis);
