/* Individual guided tasks and an original prefix tree for Vilenkin 5, printed p. 14. */
(function(root){
  'use strict';
  const descriptors=[
    ['1.25','Выстраиваем все числа из двух цифр','В книге этот номер приведён с решением. На каждом месте выбери одну допустимую цифру. Объедини готовые числа по первой цифре: так легче убедиться, что нет ни пропусков, ни повторов.',['Возьмём цифры 2 и 7 для двух позиций. С началом 2 получаются 22 и 27.','С началом 7 получаются 72 и 77. Четыре числа делятся на две непересекающиеся пары.','Если добавить правую позицию с двумя возможными цифрами, из каждого прежнего конца выйдут два новых.'], 'Если для числа разрешены две цифры, каждая из них обязательно должна встретиться хотя бы один раз.', 'Почему число, состоящее из трёх одинаковых разрешённых цифр, тоже подходит?'],
    ['1.26','Первый ноль не делает число трёхзначным','Сначала проверь сотни: ноль не может начать трёхзначную запись. В десятках и единицах ноль разрешён. Выпиши все варианты, затем найди их сумму и выполни указанное деление.',['Из 0 и 4 получаются 400, 404, 440 и 444. Запись 044 обозначает число 44; трёх цифр в его обычной записи нет.','Сумма четырёх допустимых записей равна 1 688. Для проверки сложи пары крайних и средних чисел.','Сначала убедись, что список полон. Один пропущенный вариант изменит сумму и частное.'],'Запись 006 является трёхзначным натуральным числом.','Почему первый выбор отличается от двух следующих?'],
    ['1.27','Сколько десятков или сотен внутри круглого числа?','Десяток — группа из десяти единиц, сотня — из ста. Чтобы узнать количество полных групп, раздели всё число на размер группы. Такое количество может быть гораздо больше цифры в одном разряде.',['В 2 400 единицах помещается 240 десятков. Цифра десятков в записи числа — 0.','Те же 2 400 единиц содержат 24 сотни.','Проверяем: 240 × 10 = 2 400 и 24 × 100 = 2 400.'], 'Количество десятков во всём числе всегда совпадает с цифрой десятков.', 'Сколько десятков можно собрать, если объединить десять сотен?'],
    ['1.28','Позиции записи и разные цифры','Сначала посчитай все позиции записи. Затем отметь, какие разные цифры понадобились. Одна и та же цифра может занимать несколько разных позиций.',['В записи 50 055 пять позиций. Пробел между классами не обозначает цифру.','Для записи понадобились два вида цифр: 5 и 0. Пятёрок три, нулей два.','Число позиций проверяется суммой частот: 3 + 2 = 5.'], 'Число использованных разных цифр всегда равно числу мест в записи.', 'Чем различаются ответы на вопросы «сколько раз написали цифру» и «сколько разных цифр понадобилось»?'],
    ['1.29','Предыдущее, следующее и сдвиг на десять','У соседних натуральных чисел разность равна одному. Если требуется на десять больше или меньше, передвигайся на десять единичных шагов. При переходе через круглую границу могут измениться несколько цифр сразу.',['Число перед 3 000 равно 2 999. Проверка: 2 999 + 1 = 3 000.','Следующее за 1 999 число — 2 000. Увеличение на единицу затронуло четыре разряда.','На десять больше 2 999 — это 3 009. Граница 3 000 пройдена за первый шаг.'], 'Чтобы получить следующее число, всегда достаточно увеличить только последнюю написанную цифру.', 'Чем отличается один шаг от десяти при переходе через тысячу?']
  ];
  const lessons=descriptors.map(([number,title,explanation,worked,misconception,reflect])=>({number,key:'printed-'+number.replace('.','-'),part:1,point:2,page:14,title,explanation,worked,misconception,reflect,requires:['v5f-place-value'],related:['v5f-natural-between']}));
  const format=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
  const natural=(step,prompt,answer,hint,errors=[])=>Object.assign(step(prompt,answer,hint,errors),{answerFormat:'v5-natural'});
  function prefixTree(digits,width){
    let current=[''];const levels=[current];
    for(let i=0;i<width;i++){current=current.flatMap(prefix=>digits.filter(d=>prefix||d!==0).map(d=>prefix+d));levels.push(current);}
    return {levels,numbers:current.map(Number)};
  }
  function choices(number,seed,random,step){
    const noZero=number==='1.25';
    const digits=noZero?(seed?[random(1,4),random(5,9)]:[3,5]):[0,seed?random(1,9):6],width=noZero&&seed?random(2,4):3;
    const {levels,numbers}=prefixTree(digits,width),sum=numbers.reduce((a,b)=>a+b,0),divisor=seed&&!noZero?[422,211,2][random(0,2)]:422;
    const steps=[step('Сколько допустимых цифр можно поставить на первое место слева?',levels[1].length,noZero?'Обе разрешённые цифры ненулевые.':'Слева у многозначного числа нельзя ставить ноль: тогда его обычная запись окажется короче.',noZero?[]:[{value:2,text:'Ноль разрешён внутри числа, но не в первом разряде многозначной записи.'}])];
    for(const first of levels[1]){
      const subset=numbers.filter(n=>String(n).startsWith(first));
      const t=step('Выпиши через точку с запятой все подходящие числа, которые начинаются с '+first+'. Порядок не важен.',subset,'Под каждым началом оставляй все допустимые цифры для следующего места. Проверь концы всех ветвей.');t.answerFormat='unordered';steps.push(t);
    }
    steps.push(step('Сколько разных чисел получилось в полном списке?',numbers.length,'Каждая полная последовательность цифр описывает одно число. Сложи числа вариантов по первым цифрам.',noZero?[{value:digits.length,text:'Это количество разрешённых цифр в одном месте. Учти выбор на каждом месте.'}]:[]));
    if(!noZero){steps.push(natural(step,'Какова сумма всех выписанных трёхзначных чисел?',sum,'Сложи числа в списке. Для проверки составь пары: первое с последним, второе с предпоследним.'),natural(step,'Раздели найденную сумму на '+divisor+'.',sum/divisor,'Проверь частное: при умножении на делитель должна получиться найденная сумма.'));}
    const prompt=noZero?'Сколько разных '+({2:'двузначных',3:'трёхзначных',4:'четырёхзначных'}[width])+' чисел можно записать только цифрами '+digits.join(' и ')+'? Повторять цифры разрешается.':'Составь все трёхзначные числа, пользуясь только 0 и '+digits[1]+'. Раздели сумму полного списка на '+divisor+'.';
    return {prompt,inputPrompt:noZero?'Количество чисел':'Частное',answer:noZero?numbers.length:sum/divisor,steps,errors:[],data:{digits,width,levels,numbers,sum,divisor},table:{caption:'Правила для этого числа',headers:['Место','Допустимые цифры'],rows:Array.from({length:width},(_,i)=>[i===0?'Первое слева':'Место '+(i+1)+' слева',(i===0?digits.filter(d=>d!==0):digits).join(', ')])},conditionKey:[...digits,width,noZero?0:divisor].join('/')};
  }
  function packages(seed,random,step){
    const hundreds=seed?random(2,8)*100:100,thousands=seed?random(2,9)*1000:1000,millions=seed?random(2,9)*1e6:1e6;
    const values=[[hundreds,10],[thousands,10],[millions,10],[thousands,100],[millions,100]];
    const steps=values.map(([n,unit])=>natural(step,'Сколько полных '+(unit===10?'десятков':'сотен')+' в числе '+format(n)+'?',n/unit,'Раздели все единицы на '+unit+'. После проверки умножь число групп на их размер.',[{value:0,text:'В указанном разряде стоит ноль, но вопрос обо всех полных группах в числе. Подели целое на размер группы.'}]));
    const chosen=seed?random(0,4):4;
    return {prompt:'Возьми строку '+(chosen+1)+' и найди число полных групп. В разборе вычисли все пять отношений.',inputPrompt:'Количество групп',answer:values[chosen][0]/values[chosen][1],answerFormat:'v5-natural',steps,errors:steps[chosen].errors,data:{values},table:{caption:'Размер группы дан в единицах',headers:['№','Всего','В группе'],rows:values.map(([n,u],i)=>[i+1,format(n),u]),columnWidths:[16,53,31]},conditionKey:values.join('/')+'-'+chosen};
  }
  function distinct(seed,random,step){
    const a=seed?random(3,9):7,b=seed?random(1,2):2,n=seed?Number([a,b,0,b,0,a,0].slice(0,random(5,7)).join('')):720207;
    const values=String(n).split('').map(Number),alphabet=[...new Set(values)].sort((x,y)=>x-y);
    const steps=[step('Сколько мест занимают написанные цифры в '+format(n)+'?',values.length,'Считать надо каждую позицию, даже если одна цифра повторяется. Пробел между классами не является цифрой.')];
    const set=step('Какие разные цифры понадобились? Введи их коды — сами цифры — через точку с запятой в любом порядке.',alphabet,'Просмотри запись слева направо. Добавляй цифру в набор только при первом появлении.');set.answerFormat='unordered';steps.push(set);
    const count=step('Сколько разных цифр в этом наборе?',alphabet.length,'Посчитай элементы набора. Одинаковые знаки в разных местах не дают нового вида цифры.');count.clarifications=[{value:values.length,text:'Столько всего написанных знаков. Теперь назови количество различных цифр среди них.'}];steps.push(count);
    return {prompt:'Запиши два числа через точку с запятой: сколько всего позиций в записи '+format(n)+' и сколько разных цифр использовано.',inputPrompt:'Всего позиций; разных цифр',answer:[values.length,alphabet.length],answerFormat:'v5-pair',steps,errors:[],data:{n,values,alphabet},table:{caption:'Каждая строка — одно место в числе',headers:['Позиция слева','Цифра'],rows:values.map((v,i)=>[i+1,v])},conditionKey:String(n)};
  }
  function neighbors(seed,random,step){
    const a=seed?random(2,12)*1000:4000,b=seed?random(2,11)*1000-1:999,c=seed?random(2,12)*1000:8000,d=seed?random(2,11)*1000-1:4999;
    const moves=[[a,-1],[b,1],[c,-10],[d,10]],instructions=['предыдущее','следующее','на 10 меньше','на 10 больше'];
    const steps=moves.map(([n,shift],i)=>natural(step,['а','б','в','г'][i]+'. Найди число: '+instructions[i]+' относительно '+format(n)+'.',n+shift,'Определи направление и длину движения. После вычисления сделай обратный сдвиг и проверь, что вернулся к началу.',[{value:n-shift,text:'Длина сдвига верная, но направление противоположное. Где находятся меньшие числа?'},{value:n+Math.sign(shift)*(Math.abs(shift)===1?10:1),text:'Проверь длину сдвига. Соседнее число отличается на единицу, а в вопросах в и г дан сдвиг на десять.'}]));
    return {prompt:'Для четырёх строк найди искомые числа. Введи ответы а; б; в; г по порядку.',inputPrompt:'Четыре ответа',answer:moves.map(([n,shift])=>n+shift),answerFormat:'v5-list',steps,errors:[],data:{moves,instructions},table:{caption:'Сдвиг от начального числа',headers:['№','Начало','Что ищем'],rows:moves.map(([n],i)=>[['а','б','в','г'][i],format(n),instructions[i]]),columnWidths:[12,32,56]},conditionKey:moves.join('/')};
  }
  const generators={'1.25':(s,r,t)=>choices('1.25',s,r,t),'1.26':(s,r,t)=>choices('1.26',s,r,t),'1.27':packages,'1.28':distinct,'1.29':neighbors};
  const bounds={'1.25':{prefix:[0,30,0]},'1.26':{prefix:[0,7,0]},'1.27':{row:[0,4,0]},'1.28':{digit:[0,9,0]},'1.29':{row:[0,3,0],steps:[0,10,0]}};
  function explore(lesson,state,task,table){
    const d=task.data;
    if(d.levels){
      const prefixes=d.levels.flat(),index=Math.min(state.prefix,prefixes.length-1),prefix=prefixes[index],children=d.levels[prefix.length+1]?.filter(next=>next.startsWith(prefix))||[];
      const nodes=children.length?children.map((v,i)=>({x:children.length===1?135:i===0?69:201,label:v})):[];
      const cap=t=>'<text x="'+t.x+'" y="84" text-anchor="middle" font-size="16">'+t.label+'</text>';
      let paths=nodes.map(k=>'<line x1="135" y1="23" x2="'+k.x+'" y2="59" stroke="#34755c" stroke-width="2"/><rect x="'+(k.x-30)+'" y="59" width="60" height="34" rx="5" fill="#e4efda" stroke="#34755c"/>'+cap(k)).join('');
      const visual='<svg class="v5q-choice-tree" viewBox="0 0 270 '+(nodes.length?101:50)+'" role="img" aria-label="Начало '+(prefix||'пустое')+'; следующее продолжение '+(children.join(', ')||'не требуется')+'">'+paths+'<rect x="100" y="3" width="70" height="33" rx="5" fill="#e6f0f5" stroke="#426984"/><text x="135" y="25" text-anchor="middle" font-size="16">'+(prefix||'старт')+'</text></svg>';
      const count=d.numbers.filter(n=>String(n).startsWith(prefix)).length;
      return {title:'Исследуй одну развилку дерева',controls:[{key:'prefix',title:'Начало записи',values:prefixes.map((p,i)=>[i,p||'Начало дерева'])}],visual:visual+(!prefix&&d.digits[0]===0?'<p>Ветки с первым нулём нет: запись начиналась бы с пустого старшего разряда.</p>':'')+'<p>Нужно заполнить мест: '+d.width+'. Уже записано: '+prefix.length+'.</p>',question:'Сколько полных чисел может закончить эту ветвь?',answer:count,why:children.length?'От выбранного начала остаются допустимые продолжения. Всего в этой ветви '+count+' полных записей.':'Все места заполнены. Эта ветвь даёт ровно одно число.'};
    }
    if(d.alphabet){
      const marked=d.values.map(v=>v===state.digit?'<mark>'+v+'</mark>':v).join(' '),n=d.values.filter(v=>v===state.digit).length;
      return {title:'Ищи повторения цифры',controls:[{key:'digit',title:'Какую цифру ищем',values:Array.from({length:10},(_,v)=>[v,v])}],visual:'<p aria-label="Цифры записи">'+marked+'</p>',question:'Сколько позиций занимает выбранная цифра?',answer:n,why:'Вся запись имеет '+d.values.length+' мест. Цифра '+state.digit+' занимает в ней '+n+' мест.'};
    }
    if(d.moves){
      const [from,shift]=d.moves[state.row],distance=Math.min(Math.abs(shift),state.steps),now=from+distance*Math.sign(shift);
      return {title:'Пройди число шагов по направлению',controls:[{key:'row',title:'Строка',values:['а','б','в','г'].map((v,i)=>[i,v])},{key:'steps',title:'Сколько шагов пробуем. У цели останавливаемся',min:0,max:10,step:1}],visual:table('Путь от исходного числа',['Начало','Направление','Пройдено'],[[format(from),shift<0?'влево':'вправо',distance]]),question:'На каком числе сейчас стоим?',answer:now,why:format(from)+(shift<0?' − ':' + ')+distance+' = '+format(now)+'.'};
    }
    const [n,size]=d.values[state.row],groups=n/size;
    return {title:'Сгруппируй все единицы',controls:[{key:'row',title:'Строка задачи',values:d.values.map((_,i)=>[i,i+1])}],visual:table('Объединение в группы',['Всё количество','Размер группы'],[[format(n),size]]),question:'Сколько целых групп будет в таком разбиении?',answer:groups,why:format(groups)+' × '+size+' = '+format(n)+'.'};
  }
  const api={lessons,generators,bounds,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5PrintedDigitTree=api;
})(typeof window!=='undefined'?window:globalThis);
