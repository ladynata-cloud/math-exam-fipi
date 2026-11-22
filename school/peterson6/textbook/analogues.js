(function(root){
  'use strict';
  const E=root.PetersonBook,G=root.PetersonPractice,U=root.PetersonUI;
  const numerical=(prompt,answer,step,hint)=>({kind:'numeric',prompt,answer:String(answer),steps:[{kind:'numeric',prompt:step,answer:String(answer),hint}]});
  const choice=(prompt,options,answer,hint)=>({kind:'choice',prompt,choices:options,answer,steps:[{kind:'choice',prompt:'Какой вывод согласуется с данными?',choices:options,answer,hint}]});
  const families={
    code(n){
      const alphabet='АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',word=['ДУГА','ГРАНЬ','ТОЧКА','ЛУЧ','УГОЛ'][n%5];
      const key=Array.from(word).map(c=>alphabet.indexOf(c)+1).join(' · ');
      return choice('Буквы русского алфавита с Ё пронумерованы от 1 до 33. Какое слово задаёт запись '+key+'?',['ДУГА','ГРАНЬ','ТОЧКА','ЛУЧ','УГОЛ'],word,'Найди каждую букву по порядковому номеру. Сохрани порядок букв.');
    },
    digits(n){
      const tens=4+n%5,ones=1+n%3;
      return numerical('В двузначном числе '+tens+' десятков и '+ones+' единиц. На сколько это число больше числа с обратным порядком цифр?',9*(tens-ones),'Вычти из 10a+b число 10b+a. Какая разность получится?','Разложи каждое число по разрядам.');
    },
    ranking(n){
      const position=1+n%4,others=[1,2,3,4].filter(x=>x!==position);
      return numerical('Четыре участника заняли разные места с первого по четвёртое. Места трёх участников — '+others.join(', ')+'. Какое место у четвёртого?',position,'Вычти сумму названных мест из суммы первых четырёх натуральных чисел.','Сумма мест всех участников равна 10.');
    },
    clock(n){
      const minutes=5*(1+n%11);
      return numerical('На сколько градусов повернётся минутная стрелка за '+minutes+' мин? Используй полный оборот в 360°.',minutes*6,'Сколько градусов составляют '+minutes+' шестиградусных делений?', 'За 60 минут стрелка совершает полный оборот.');
    },
    triangle(n){
      const base=6+2*(n%9),height=3+n%7;
      return numerical('Высота треугольника равна '+height+' см, а основание — '+base+' см. Какова площадь в квадратных сантиметрах?',base*height/2,'Умножь основание на высоту и раздели результат на два.','В прямоугольнике с такими же сторонами поместились бы два равновеликих треугольника.');
    },
    midpoint(n){
      const side=6+2*(n%18);
      return numerical('В треугольнике соединили середины двух сторон. Третья сторона равна '+side+' см. Найди длину проведённого отрезка в сантиметрах.',side/2,'Какая длина равна половине третьей стороны?','Средняя линия треугольника параллельна третьей стороне и вдвое короче неё.');
    },
    overlap(n){
      const common=2+n%6,a=common+3+n%4,b=common+6,total=a+b-common;
      return numerical('В кружке '+total+' ребят. Все выбрали хотя бы одно из занятий. Шахматы выбрали '+a+', головоломки — '+b+'. Сколько выбрали оба?',common,'Сложи размеры двух групп и вычти число разных участников.','Участников обеих групп при сложении посчитали дважды.');
    },
    pattern(n){
      const start=3+n%8,delta=2+n%4;
      return numerical('Последовательность начинается числами '+[0,1,2,3].map(i=>start+i*delta).join(', ')+'. Разность соседних членов постоянна. Запиши следующее число.',start+4*delta,'Прибавь очередную постоянную разность к четвёртому члену.','Сначала вычти первое число из второго.');
    }
  };
  const mappings={
    'fraction-to-decimal':[341,389], 'fraction-reduce':[343,396],code:[347,390,422,444,469],
    'compound-growth':[348,411,412,425,448,462,463,464,466,467,472,480,481],equation:[349,394,423,424,426,487],
    overlap:[350], 'percent-change':[387,408,413,447,449,458],triangle:[388,401,402,419,420], 'decimal-divide':[391],
    'variable-value':[392,393,395,397,399,409,415,416,417,443,446,456,471],
    'logic-quantifiers':[398,400,418,470],mean:[403,494],midpoint:[404,452],
    'simple-growth':[406,427,428,429,432,433,434,435,436,437,438,439,440,441,442,450,453,454,455,468,479],
    'percent-part':[410,414,451], 'percent-ratio':[431,457],pattern:[445],clock:[460],ranking:[461],digits:[486]
  };
  const byNumber=new Map(Object.entries(mappings).flatMap(([key,list])=>list.map(n=>[n,key])));
  function seed(value){
    let result=2166136261;
    for(const ch of value)result=Math.imul(result^ch.charCodeAt(0),16777619);
    return result>>>0;
  }
  function family(number,part){
    if(part.skill)return part.skill;
    if(number===465)return part.id.endsWith('a')?'simple-growth':'compound-growth';
    return byNumber.get(number);
  }
  const chapterPractice=[[25,'logic-negation'],[70,'logic-quantifiers'],[119,'variable-value'],[175,'logic-quantifiers'],
    [220,'order-operations'],[256,'river-roundtrip'],[296,'mean'],[307,'order-operations'],[350,'percent-ratio']];
  function repeatNumberWork(number,part,attempt){
    const n=seed(part.id)%11+attempt,shift=n%7;
    const numeric=(prompt,answer,hint)=>({...numerical(prompt,answer,'Проверь свой вывод по правилу этого примера.',hint),mistake:hint});
    const select=(prompt,options,hint)=>{
      const answer=options[0],k=n%options.length,choices=options.slice(k).concat(options.slice(0,k));
      return {...choice(prompt,choices,answer,hint),mistake:hint};
    };
    if(number===7){
      if(part.id==='007-a'){
        const start=3+shift,add=1+n%3,row=[start];for(let i=0;i<4;i++)row.push(row.at(-1)*2+add);
        return numeric('Каждый раз удваивай предыдущее число и прибавляй '+add+'. Начало ряда: '+row.slice(0,4).join('; ')+'. Запиши следующее число.',row[4],'Удвой именно последний записанный член, а затем прибавь указанное число.');
      }
      if(part.id==='007-b'){
        const top=1+n%3,base=4+shift,increment=3+n%5,row=Array.from({length:4},(_,i)=>top*2**i+'/'+(base+increment*i));
        return numeric('В каждой дроби числитель удваивается, знаменатель возрастает на '+increment+'. Дано: '+row.slice(0,3).join('; ')+'. Какова следующая дробь?',row[3],'Смотри на несокращённые записи ряда: отдельно измени числитель, затем знаменатель.');
      }
      if(part.id==='007-v'){
        const whole=2+shift,first=1+n%5,row=Array.from({length:4},(_,i)=>whole+','+'0'.repeat(i+1)+(first+i));
        return numeric('Целая часть остаётся прежней. После запятой каждый раз добавляется ноль перед последней цифрой, а сама последняя цифра увеличивается на 1. Запиши следующий член: '+row.slice(0,3).join('; ')+'; …',row[3],'Проверь и число нулей, и последнюю цифру. Запятая стоит после той же целой части.');
      }
      const first=1+n%5,rows=Array.from({length:4},(_,i)=>Array.from({length:i+1},(_,j)=>first+j).join('')+' '+(first+i+1)+'/'+(first+i+2));
      return numeric('К целой части справа приписывают следующую цифру, а в дробной части числитель и знаменатель увеличивают на 1. Продолжи: '+rows.slice(0,3).join('; ')+'; …',rows[3],'Сравни целые части двух соседних записей и отдельно их дробные части.');
    }
    if(number===8){
      const whole=14+shift,ordinary=(2+n%4)+'/'+(9+n%5),mixed=(2+shift)+' 1/'+(3+n%4),decimal='0,'+(2+shift)+'5';
      const group='На карточках: 0; '+ordinary+'; '+whole+'; '+decimal+'; '+mixed+'; 1. ';
      const lists={
        '008-1-a':['Выбери все натуральные числа.',[whole+'; 1','0; '+whole+'; 1',whole+'; '+decimal],'Счёт предметов начинается с 1. Ноль и нецелые числа не подходят.'],
        '008-1-b':['Выбери все нецелые числа.',[ordinary+'; '+decimal+'; '+mixed,ordinary+'; '+decimal,'0; '+ordinary+'; '+decimal+'; '+mixed],'Проверь и смешанную запись: в ней есть ненулевая дробная часть.'],
        '008-2-a':['Какое из чисел записано обыкновенной дробью без целой части?', [ordinary,mixed,decimal],'Нужна запись с числителем и знаменателем без отдельного целого числа.'],
        '008-2-b':['Какое число записано как смешанное?', [mixed,ordinary,decimal],'Ищи отдельно написанную целую и правильную дробную части.'],
        '008-2-v':['Где число записано десятичной дробью?', [decimal,ordinary,mixed],'В десятичной записи целую и дробную части разделяет запятая.']
      };
      const [prompt,options,hint]=lists[part.id];return select(group+prompt,options,hint);
    }
    if(number===9){
      const digit=2+shift,zeros=2+n%4,place=n%(zeros+1),exponent=place,total=BigInt(digit)*(10n**BigInt(zeros+1)+10n**BigInt(exponent));
      return numeric('Составь числа из двух цифр '+digit+' и '+zeros+' нулей, используя все цифры. Если записать результаты по возрастанию, какое число будет на месте '+(place+1)+'?',String(total),'Первая цифра обязана быть ненулевой. Для получения наименьшего числа поставь вторую такую цифру в единицы, затем передвигай её влево.');
    }
    if(number===10){
      const amounts=[['два миллиона','триста четыре тысячи','семь',2304007],['три миллиона','двести одна тысяча','пятнадцать',3201015],['четыре миллиона','сто восемь тысяч','шестьдесят',4108060],['пять миллионов','четыреста две тысячи','девятнадцать',5402019],['восемь миллионов','пять тысяч','шесть',8005006]];
      const mixed=[['три целых и две седьмых','3 2/7'],['четыре целых и три восьмых','4 3/8'],['восемь целых и пять шестых','8 5/6'],['две целых и семь десятых','2 7/10']];
      const decimal=[['две целых и семнадцать стотысячных','2,00017'],['восемь целых и шесть стотысячных','8,00006'],['четыре целых и двадцать три стотысячных','4,00023'],['одна целая и девять стотысячных','1,00009']];
      if(part.id==='010-a'){const [a,b,c,answer]=amounts[n%amounts.length];return numeric('Запиши цифрами: '+a+' '+b+' '+c+'.',answer,'Размести миллионы, тысячи и единицы в трёх классах; в каждом младшем классе три цифры.');}
      const [words,num]=(part.id==='010-b'?mixed:decimal)[n%4];return numeric('Запиши цифрами: '+words+'.',num,part.id==='010-b'?'Отдели целое число пробелом, затем введи числитель и знаменатель.':'Стотысячные стоят в пятой позиции после запятой. Нули слева от названных долей необходимы.');
    }
    return null;
  }

  function createLegacy(number,part,attempt=0){
    if(number<1||number>497||part.kind==='expression')return null;
    const specific=family(number,part);
    const key=specific||chapterPractice.find(([end])=>number<=end)?.[1];
    if(!key)throw Error('Нет проверенной тренировки для № '+number+' / '+part.id);
    const value=seed(part.id+'|'+attempt);
    let model;
    if(families[key]) model=families[key](value);
    else model=G.generate(key,1+(value%3),value);
    return {...model,id:'analog-'+part.id+'-'+attempt,family:key,match:specific?'skill':'chapter'};
  }
  function decimalPractice(number,part,attempt){
    const x=part.expression,tag=seed(part.id)%17+attempt,k=1+tag%11;
    const R=E.M.operation,show=v=>E.M.decimal(v),scale=(a,b)=>R('multiply',a,b),add=(a,b)=>R('add',a,b);
    const places=v=>String(v).split('.')[1]?.length||0;
    let calculation,hint;
    if(number===13){
      calculation=JSON.parse(JSON.stringify(x));
      if(part.id==='013-a'){
        calculation.left.right=show(R('divide',8+tag%5,10));
        calculation.right.left.left.left=show(R('divide',1+tag%4,10));
      }else{
        calculation.left.left.right.right=show(R('subtract',49,scale('0.96',5+tag%19)));
        calculation.right.left.left=show(scale('2.7',1+tag%9));
      }
      hint='Начни с действий в скобках. Цепочку умножений и делений на одном уровне выполняй слева направо.';
    }else{
      let left=x.left,right=x.right;
      const increment=v=>R('divide',k,10**Math.max(1,places(v)));
      if(x.op==='divide'){
        const quotient=E.exact(x),delta=R('divide',k,10**Math.max(1,places(show(quotient).replace(',','.'))));
        left=show(scale(add(quotient,delta),right));
        hint=E.M.parse(right).d===1?'Проверь частное умножением на делитель.':'Умножь и делимое, и делитель на одну степень десяти, чтобы делитель стал целым.';
      }else{
        if(x.op==='multiply'&&['100','0.1'].includes(String(left)))right=show(add(right,increment(right)));
        else left=show(add(left,increment(left)));
        hint=x.op==='multiply'?'Определи, во сколько раз каждый множитель меньше соответствующего целого числа. Учти оба масштаба.':'Выравнивай числа по запятой: единицы под единицами, десятые под десятыми, сотые под сотыми.';
      }
      calculation={op:x.op,left,right};
    }
    const prompt=number===11?'Вычисли устно на новых числах.':number===12?'Вычисли новое выражение с тем же действием.':'Найди значение нового выражения. Действия и вложенные скобки сохранили порядок исходной задачи.';
    return {kind:'expression',expression:calculation,prompt,answer:E.M.answer(E.exact(calculation)),mistake:hint,id:'analog-'+part.id+'-'+attempt,family:'decimal-'+part.id,match:'skill'};
  }

  function comparisonPractice(number,part,attempt){
    const v=seed(part.id)%47+attempt,t=2+v%7,numeric=(prompt,answer,hint)=>({...numerical(prompt,answer,'Проверь разряд или часть числа.',hint),mistake:hint});
    const sign=(a,b)=>{const M=E.M,r=M.operation('subtract',a,b);return r.n<0?'<':r.n>0?'>':'=';};
    let model;
    if(number===14){
      const i=part.id==='014-itog'?8:Number(part.id.slice(4))-1;
      if(i===0){const n=36101+13*(v%211);model=numeric('Назови натуральное число прямо перед '+n+'.',n-1,'Требуется уменьшить данное число ровно на единицу.');}
      if(i===1||i===2){const power=i===1?4:8,n=(i===1?12007033:2007346012)+t*10**power;model=numeric('Какая цифра стоит в разряде '+(i===1?'десятков тысяч':'сотен миллионов')+' числа '+n+'?',Math.floor(n/10**power)%10,'Разбей число на классы по три цифры справа, затем найди нужную позицию в классе.');}
      if(i===3){const digits='34782'+t+'19';model=numeric('Найди цифру миллионных у числа 0,'+digits+'.',t,'Отсчитай шесть позиций от запятой вправо.');}
      if(i===4){model=numeric('У смешанного числа '+(2+t)+' 1/'+(8+t)+' какой знаменатель дробной части?',8+t,'Знаменатель расположен под дробной чертой.');}
      if(i===5){const whole=t+1,den=t+4,answer=whole+' + 2/'+den,options=[whole+' × 2/'+den,answer,whole+' − 2/'+den];model=choice('Какая запись передаёт значение смешанного числа '+whole+' 2/'+den+'?',options,answer,'Целая и дробная части складываются.');}
      if(i===6||i===7){const base=i===6?10**6:10**5,a=1+(v+3)%8,b=2+v%6;const total=a*base+b*1000+40+2;
        model=numeric(i===6?'Собери число по разрядной сумме '+(a*base)+' + '+(b*1000)+' + 40 + 2.':'Запиши обычным числом сумму '+a+' · 10⁵ + '+b+' · 10³ + 4 · 10 + 2.',total,'Поставь цифры на названные позиции, остальные заполни нулями.');}
      if(i===8){const base=3000+t*10,items=['а) '+(base+1),'б) '+(base-1),'в) '+base],order=v%3,permuted=items.slice(order).concat(items.slice(0,order)).map((x,i)=>'абв'[i]+') '+x.slice(3));const right=permuted.find(x=>Number(x.slice(3))===base-1);
        model=choice('Число перед '+base+' записано одним из вариантов. Выбери букву вместе с верной записью.',permuted,right,'Сначала вычисли предыдущее число, затем прочитай букву именно его варианта.');}
    }else{
      const key=part.id.slice(4),fmt=(n,p)=>E.M.decimal(E.M.operation('divide',n,10**p));let a,b,clue;
      if(number===15){
        if(key==='a'){a=1000000+t*100001;b=100000+t*1010;}
        else if(key==='b'){a=2710000+t*100+5;b=2710000+t*10+8;}
        else if(key==='v'){a=fmt(1000*t+329,3);b=fmt(t*10+6,1);}
        else if(key==='g'){a=fmt(1000*t-17,3);b=t;}
        else if(key==='d'){a=fmt(t*111+2,1);b=fmt(t*10017+942,4);}
        else {a=fmt(t,4);b=fmt(t-1,3);}
        clue='Сравни целые части, затем десятые, сотые и следующие разряды.';
      }else{
        if(key==='a'){a=(t+1)+'/'+(t+5);b=t+'/'+(t+5);}
        else if(key==='b'){a=t+'/'+(t+6);b=t+'/'+(t+4);}
        else if(key==='v'){a=(t+8)+'/'+(t+3);b=(t+4)+'/'+(t+7);}
        else if(key==='g'){a=(t+1)+'/'+(2*t+3);b=t+'/'+(2*t+1);}
        else {a=(t+6)+'/'+(t+7);b=(t+7)+'/'+(t+8);}
        clue=key==='d'?'Обе дроби меньше единицы на одну долю. Сравни размеры недостающих долей.':'Общий знаменатель позволяет сравнить числители; можно также сравнить каждую дробь с единицей.';
      }
      if(v%2)[a,b]=[b,a];
      model=choice('Сравни '+a+' и '+b+'. Какой знак нужно поставить между ними?', ['<','=','>'],sign(a,b),clue);model.mistake=clue;
    }
    return {...model,id:'analog-'+part.id+'-'+attempt,family:'comparison-'+part.id,match:'skill'};
  }

  function campPractice(number,part,attempt){
    const n=seed(part.id)%29+attempt;
    let task;
    if(number===18){
      const list=['Меркурий','Венера','Земля','Марс','Юпитер','Сатурн','Уран','Нептун'],giants=list.slice(4),letters=['М','В','Н','С','З','Ю','У'],letter=letters[n%7],planet=list[n%8],inM=planet[0]===letter,inG=giants.includes(planet);
      const choices=['В обеих группах','Только в группе по букве','Только в группе гигантов','Вне обеих групп'],answer=choices[inM&&inG?0:inM?1:inG?2:3];
      task=choice('Восемь планет в нашей модели: '+list.join(', ')+'. Одна группа объединяет названия на '+letter+', вторая — гигантов ('+giants.join(', ')+'). Где окажется '+planet+'?',choices,answer,'Сначала проверь первую букву, затем сверь название со списком гигантов. Оба признака независимы.');
      task.mistake='Нужно проверить оба признака. Определи первую букву и найди выбранную планету в списке гигантов.';
    }else if(part.id==='017-a'){
      const a=20+5*(n%15),b=a*6/5,offset=4+2*(n%4)+a%2,c=b-offset,answer=(a+b+c)/2;
      task=numerical('В первом отряде '+a+' ребят, во втором их в 1,2 раза больше, а в третьем на '+offset+' меньше, чем во втором. Всех детей делят поровну на две команды. Сколько ребят в одной?',answer,'Найди общее число ребят, затем раздели на две команды.','При умножении на 1,2 прибавляется одна пятая от исходного числа.');
      task.mistake='Проверь, что учтены три отряда, а делишь ты на число команд.';
    }else{
      const first=6+n%8,last=8+n%9,rate=20+n%7,later=13+n%11,total=first*rate+last*later;
      task=numerical('Запас составляет '+total+' кг. В первые '+first+' дней брали по '+rate+' кг в день. Запаса хватило ровно на '+(first+last)+' дней, причём после первого периода расход был постоянным. Сколько килограммов в день брали в конце?',later,'Раздели оставшийся запас на число оставшихся дней.','Отдели расход и длительность первого периода от общего запаса и срока.');
      task.mistake='Вычти потраченные килограммы из всего запаса; из полной длительности вычти первые дни.';
    }
    return {...task,id:'analog-'+part.id+'-'+attempt,family:'camp-'+part.id,match:'skill'};
  }

  function logicPractice(number,part,attempt){
    const i=Number(part.id.split('-')[1])-1,k=seed(part.id)%23+attempt,t=2+k%13,shift=(options)=>options.slice(k%options.length).concat(options.slice(0,k%options.length));
    let prompt,options,answer,hint;
    if(number===19){
      let truth,denials;
      if(i===0){
        const people=['Ира','Нина','Олег','Яна'],person=people[k%4],mentor=people[(k+1)%4],other=people[(k+2)%4],subject=k%2?mentor:other;
        prompt='В списке кружка для карточки «'+person+'» указан только один наставник — '+mentor+'. Проверяем фразу: «На карточке «'+person+'» указан наставник '+subject+'».';
        denials=['На карточке «'+person+'» наставником указан не '+subject+'.','На карточке «'+subject+'» не указан наставник '+person+'.','У всех участников один наставник.'];truth=subject===mentor;hint='Сопоставь имя указанного наставника со списком, сохрани роли участника и наставника.';
      }else if(i===1){
        const h=t+8,high=k%2===0;prompt='Два измеренных дерева имеют высоту '+h+' м и '+(h+3)+' м. Проверяем фразу: «Из этих деревьев выше то, чья высота '+(high?h+3:h)+' м».';
        denials=['Дерево высотой '+(high?h+3:h)+' м не выше второго.','Оба дерева одной высоты.','Оба дерева ниже '+h+' м.'];truth=high;hint='У двух чисел высот сравни значения в одинаковых единицах.';
      }else if(i===2||i===3){
        const a=t+4,b=a+(k%3-1)*2;
        prompt=i===2?'В смеси '+a+' г песка и '+b+' г соли. Проверяем фразу: «Масса песка не меньше массы соли».':'Площади двух участков A и Б составляют '+a+' м² и '+b+' м². Проверяем фразу: «Площадь A больше площади Б».';
        denials=i===2?['Песка меньше, чем соли.','Песка не больше, чем соли.','Песка и соли поровну.']:['Площадь A не больше площади Б.','Площадь A меньше площади Б.','Участки имеют равную площадь.'];truth=i===2?a>=b:a>b;hint=i===2?'«Не меньше» включает равенство. Сравни две массы.':'Слово «больше» не включает равенство. Формальным отрицанием будет «не больше».';
      }else{
        const year=1710+t,a=year+(k%3-1),b=a+2;
        if(i===4){prompt='В календаре кружка отмечен единственный год постройки башни — '+year+'. Проверяем фразу: «Это произошло в '+a+' или '+b+' году».';denials=['Год постройки отличен и от '+a+', и от '+b+'.','Год постройки отличен от '+a+' или от '+b+'.','Год постройки — '+a+'.'];truth=year===a||year===b;}
        else{const bags=['синем','зелёном','белом','жёлтом'],x=k%4,y=(x+1)%4,z=(x+1+k%3)%4;prompt='В этом опыте бусина лежит в '+bags[z]+' мешочке. Проверяем фразу: «Бусина в '+bags[x]+' или '+bags[y]+' мешочке».';denials=['Бусины нет ни в '+bags[x]+', ни в '+bags[y]+' мешочке.','Бусины нет в '+bags[x]+' мешочке.','Бусина в обоих мешочках.'];truth=z===x||z===y;}
        hint='Проверь обе альтернативы. Для «или» достаточно одной верной, а для его отрицания обе должны быть ложны.';
      }
      options=['Исходная фраза истинна, её отрицание ложно','Исходная фраза ложна, её отрицание истинно'];answer=options[truth?0:1];if(attempt%2){options=denials;answer=options[0];prompt+=' Выбери точное отрицание проверяемой фразы.';}else prompt+=' Какая оценка верна?';
    }else if(number===20){
      const x=['u','v','t','s'][k%4],f=(t+1)+'/'+(t+3),d=t+',00'+(1+k%8);
      const data=[
        ['«'+x+' меньше '+f+'»',[x+' ≥ '+f,x+' > '+f,x+' ≤ '+f],'Проверь отдельно равенство дроби.'],
        ['«'+x+' не меньше '+d+'»',[x+' < '+d,x+' ≤ '+d,x+' > '+d],'Равенство уже включено в «не меньше».'],
        ['«Разность '+x+' и '+t+' равна '+(t+4)+'»',[x+' − '+t+' ≠ '+(t+4),t+' − '+x+' ≠ '+(t+4),x+' − '+t+' < '+(t+4)],'Сохрани порядок вычитания. Отрицание равенства допускает оба направления неравенства.'],
        ['«Квадрат '+x+' отличается от '+t*t+'»',[x+'² = '+t*t,x+' = '+t*t,x+'² < '+t*t],'Сохрани квадрат и измени только знак отношения.'],
        ['«Число '+x+' больше, чем его квадрат минус '+t+'»',[x+' ≤ '+x+'² − '+t,x+' < '+x+'² − '+t,x+' ≥ '+x+'² − '+t],'Сохрани обе части сравнения. В отрицании строгого «больше» учти равенство.'],
        ['«Число '+x+' на '+t+' меньше своего квадрата»',[x+' ≠ '+x+'² − '+t,x+' ≥ '+x+'²',x+' = '+x+'² + '+t],'Слова «на столько-то» задают точное равенство, которое можно нарушить по-разному.']
      ][i];prompt='Выбери точное отрицание фразы '+data[0]+'.';options=data[1];answer=options[0];hint=data[2];
    }else{
      const counts=[t+1,t-1,t+3],names=['А','Б','В'],j=k%3;const shown=counts.map((v,n)=>names[(n+j)%3]+' — '+v).join(', ');
      prompt='На трёх полках книги: '+shown+'. Какую полку достаточно указать, чтобы опровергнуть фразу «на каждой полке не меньше '+t+' книг»?';options=names.map(v=>'Полка '+v);answer=options[(1+j)%3];hint='Для слова «каждая» нужен один контрпример. Найди полку, где число меньше порога.';
    }
    const exercise=choice(prompt,shift(options),answer,hint);return {...exercise,id:'analog-'+part.id+'-'+attempt,family:'logic-page9-'+part.id,match:'skill',mistake:hint};
  }

  function codewordPractice(number,part,attempt){
    const k=seed(part.id)%17+attempt,R=E.M.operation,display=E.M.decimal;
    if(number===22&&part.id!=='022-slovo'){
      const calculation=decimalPractice(12,part,attempt),value=E.exact(calculation.expression),printed=k%2?value:R('multiply',value,10);
      const model={...calculation,prompt:'Вычисли левую часть. В карточке напечатан результат '+display(printed)+'. Запиши действительное значение и сравни его с напечатанным.'};
      model.steps=[{kind:'numeric',prompt:'Вычисли левую часть.',answer:E.M.answer(value),hint:calculation.mistake}];return model;
    }
    if(number===23){
      const x=JSON.parse(JSON.stringify(part.expression)),increment=1+k%9;
      if(part.id==='023-a'){
        x.left.left.left.right=display(R('add','7.32',R('multiply','0.18',increment)));
        const first=E.exact(x.left),intended=R('divide',1+k%7,100);
        x.right.left=display(R('multiply',R('subtract',first,intended),E.exact(x.right.right)));
      }else{
        x.left=String(164+increment);
        x.right.left.left.left=display(R('add','22.62',R('multiply','0.3',increment)));
        x.right.left.right.left=display(R('add','208.27',R('multiply','2.95',increment)));
      }
      const answer=E.M.answer(E.exact(x));return {kind:'expression',expression:x,prompt:'Вычисли по действиям. Отдельно выпиши промежуточные результаты каждой скобки.',answer,
        mistake:'Проверь вычисления внутри скобок и верни оба результата в исходное выражение. Не округляй перед последним вычитанием.',id:'analog-'+part.id+'-'+attempt,family:'page9-'+part.id,match:'skill'};
    }
    let task;
    if(number===24){
      const jars=6+k%8,each=R('divide',3*(20+k%9),10),total=R('multiply',each,jars);
      const pair=R('divide',R('multiply',total,2),3),gap=R('divide',2+2*(k%4),10),first=R('divide',R('add',pair,gap),2);
      task=numerical('Из первого улья получили '+display(first)+' кг, из второго на '+display(gap)+' кг меньше. Из третьего — половину суммы первых двух. Весь мёд поровну разлили в '+jars+' банок. Сколько килограммов пришлось на банку?',display(R('divide',total,jars)),'Сложи три сбора и раздели на число банок.','Массу третьего сбора вычисляй от суммы двух остальных.');task.mistake='Сначала проверь сумму двух первых сборов. Третий даёт половину этой суммы.';
    }else{
      const words=['ЛУЧ','ДОМ','КОТ','МИР','СОН'],word=words[k%words.length],invalid='Я',a=2+k%9;
      const rows=[word[2]+' · '+(a+4)+' − 1 = '+(a+3),invalid+' · '+a+' + 2 = '+(a+1),word[0]+' · '+a+' − 1 = '+(a-1),word[1]+' · '+a+' + 1 = '+(a+1)];
      const variants=[word,word[2]+word[1]+word[0],word[0]+invalid+word[2]],shift=k%3,options=variants.slice(shift).concat(variants.slice(0,shift));
      task=choice('Карточки: '+rows.join('; ')+'. Отбрось ложные равенства и прочитай буквы по возрастанию результатов.',options,word,'Проверь каждое равенство независимо, затем упорядочь только верные числовые результаты.');task.mistake='Даже если номер получился при исправлении ложного равенства, его буква не участвует в шифре.';
    }
    return {...task,id:'analog-'+part.id+'-'+attempt,family:'page9-'+part.id,match:'skill'};
  }

  function letterPractice(part,attempt){
    const variant=seed(part.id)%37+attempt;let prompt,answer,hint;
    if(part.id==='025-1'){
      const candidates=[];
      for(let n=21;n<98;n++){
        const digits=String(n),sum=String(n*2);if(sum.length!==3||new Set(digits).size!==2)continue;
        const distinct=new Set(digits+sum);if(distinct.size<4)continue;
        candidates.push([digits,sum]);
      }
      const [digits,sum]=candidates[variant%candidates.length],used=[...new Set(digits+sum)],alphabet='АБВГД',encode=value=>Array.from(value,d=>alphabet[used.indexOf(d)]).join(''),unknown=Array.from(sum).filter(d=>!digits.includes(d)).at(-1);
      prompt='В новом ребусе '+encode(digits)+' + '+encode(digits)+' = '+encode(sum)+'. Дано: А = '+digits[0]+', Б = '+digits[1]+'. Какую цифру нужно поставить вместо '+encode(unknown)+'?';answer=unknown;hint='Сложи единицы, перенеси десяток при необходимости, затем сложи десятки. Прочитай нужный разряд суммы.';
    }else{
      const candidates=[];
      for(const repunit of [111,1111])for(let repeated=1;repeated<10;repeated++)for(let factor=2;factor<=9;factor++){
        const product=repunit*repeated,n=product/factor,digits=String(n);
        if(!Number.isInteger(n)||digits.length<2||new Set(digits).size!==digits.length||digits.includes(String(repeated)))continue;
        candidates.push([digits,product,factor,repeated]);
      }
      const [digits,product,factor,repeated]=candidates[variant%candidates.length],alphabet='АБВГ'.slice(0,digits.length),position=variant%digits.length;
      prompt='В ребусе '+alphabet+' × '+factor+' = '+'Д'.repeat(String(product).length)+' буква Д означает '+repeated+'. Какая цифра соответствует букве '+alphabet[position]+'?';answer=digits[position];hint='Сначала запиши произведение из одинаковых цифр. Раздели его на множитель и найди нужный разряд частного.';
    }
    const task=numerical(prompt,answer,'Введи цифру выбранной буквы.',hint);
    return {...task,id:'analog-'+part.id+'-'+attempt,family:'letters-'+part.id,match:'skill',mistake:hint};
  }

  function create(number,part,attempt=0,savedWork){
    if((number===22||number===23)&&part.expression)return codewordPractice(number,part,attempt);
    if(number>=11&&number<=13)return decimalPractice(number,part,attempt);
    if(number<7||number>25)return createLegacy(number,part,attempt);
    if(savedWork?.signature){
      const legacy=createLegacy(number,part,attempt);
      if(savedWork.signature===E.signature(legacy))return legacy;
    }
    if(number===25)return letterPractice(part,attempt);
    if(number>=22)return codewordPractice(number,part,attempt);
    if(number>=19)return logicPractice(number,part,attempt);
    if(number>=17)return campPractice(number,part,attempt);
    if(number>=14)return comparisonPractice(number,part,attempt);
    const model=repeatNumberWork(number,part,attempt);
    return {...model,id:'analog-'+part.id+'-'+attempt,family:'page7-'+part.id,match:'skill'};
  }
  const states=new Map();
  function record(part){
    const key='mathexam.peterson6.analogue.v1.'+part.id;
    if(!states.has(key)){
      let raw=null,blocked=false;
      if(!document.body.dataset.petersonBoard)try{raw=JSON.parse(localStorage.getItem(key)||'null');}catch(_){blocked=true;}
      const attempt=Number.isSafeInteger(raw?.attempt)&&raw.attempt>=0&&raw.attempt<100000?raw.attempt:0;
      states.set(key,{attempt,raw:raw?.work,earlier:raw?.earlier,blocked});
    }
    return [key,states.get(key)];
  }
  function panel(item,part){
    const initial=create(item.number,part);
    if(!initial)return '';
    const [key,row]=record(part),model=create(item.number,part,row.attempt,row.work||row.raw);
    const work=row.work||E.sanitize(model,row.raw);row.work=work;if(document.body.dataset.petersonBoard)E.assist(work);
    function save(){
      if(document.body.dataset.petersonBoard||row.blocked)return;
      try{localStorage.setItem(key,JSON.stringify({attempt:row.attempt,work:row.work,...(row.earlier?{earlier:row.earlier}:{})}));}catch(_){row.blocked=true;}
    }
    const box=document.createElement('details');box.className='help-box equivalent-exercise';
    const option=v=>'<option value="'+U.esc(v)+'"'+(v===work.draft?' selected':'')+'>'+U.esc(v)+'</option>';
    const field=model.kind==='choice'?'<select aria-label="Ответ к авторскому примеру"><option value="">Выбери ответ</option>'+model.choices.map(option).join('')+'</select>':'<input aria-label="Ответ к авторскому примеру" value="'+U.esc(work.draft)+'" maxlength="120">';
    const steps=E.steps(model);
    box.innerHTML='<summary>'+ (model.match==='chapter'?'Разминка по теме без учебника':'Авторский пример без учебника')+'</summary><p>Новое условие для тренировки. Решение этого примера учитывается отдельно от номера учебника.</p><p class="problem">'+U.fmt(model.prompt)+'</p>'+(model.expression?'<div class="math-line">'+U.expression(model.expression)+'</div>':'')+U.diagram(model.diagram)+'<form class="analogue-form">'+field+' <button>Проверить пример</button></form><p role="status"></p><details><summary>Подсказка к примеру</summary><p>'+U.fmt(steps[0]?.hint||steps[0]?.prompt||'Сопоставь данные с величиной, которую нужно найти.')+'</p></details><button type="button" class="text-button">Другой пример</button>';
    if(!document.body.dataset.petersonBoard&&item.number>=7&&item.number<=25&&Number.isInteger(row.earlier?.attempt)&&row.earlier.attempt>=0&&row.earlier.attempt<=99999){
      const previous=createLegacy(item.number,part,row.earlier.attempt);
      if(row.earlier.work?.signature===E.signature(previous)){
        const old=E.sanitize(previous,row.earlier.work),saved=document.createElement('details');
        saved.className='earlier-practice';
        saved.innerHTML='<summary>Моя прежняя разминка по теме</summary><p>'+U.fmt(previous.prompt)+'</p><p>Ответ: '+U.esc(old.draft||'пока не записан')+'</p><p>'+U.esc(U.status(old))+'</p>'+(old.note?'<p>'+U.esc(old.note)+'</p>':'');
        box.append(saved);
      }
    }
    const form=box.querySelector('form'),input=form.querySelector('input,select'),status=box.querySelector('[role=status]');
    status.textContent=document.body.dataset.petersonBoard&&row.status?row.status:work.correct?U.status(work)+'.':'';
    input.addEventListener('input',()=>{work.draft=input.value;work.correct=false;work.independent=false;save();});
    form.addEventListener('submit',event=>{
      event.preventDefault();event.stopPropagation();
      if(!input.value.trim()||(model.kind!=='choice'&&!E.M.parse(input.value))){status.textContent='Введи число или выбери ответ.';return;}
      const result=E.submit(model,work,input.value);
      status.textContent=result.ok?U.status(work)+'.':model.mistake||'Попробуй ещё раз. Можно открыть подсказку к примеру.';
      save();
    });
    box.querySelector('details').addEventListener('toggle',event=>{if(event.target.open){E.assist(work);save();}});
    box.querySelector('button[type=button]').onclick=()=>{
      if(row.attempt>=99999)return;
      if(!document.body.dataset.petersonBoard&&item.number>=7&&item.number<=25&&model.match==='chapter')row.earlier={attempt:row.attempt,work:E.sanitize(model,work)};
      row.status='';row.hint=false;row.open=true;row.attempt++;row.work=E.blank(create(item.number,part,row.attempt));save();
      const next=panel(item,part);next.open=true;box.replaceWith(next);
    };
    if(document.body.dataset.petersonBoard){box.open=row.open===true;box.querySelector('details').open=row.hint===true;}
    return box;
  }
  function shared(item,part,raw) {
    const model=part&&create(item.number,part);
    if(!model)return null;
    if(raw===null&&part.expression&&((item.number>=11&&item.number<=13)||item.number===22||item.number===23))return null;
    const active=document.querySelector('.equivalent-exercise');
    const row=record(part)[1];
    if(!raw&&row.formerlyAbsent&&!active?.open)return null;
    if(!raw&&active?.open)row.formerlyAbsent=false;
    if(!raw) return {attempt:row.attempt,work:root.PetersonVolumeBoard.work(create(item.number,part,row.attempt,row.work||row.raw),row.work||row.raw),
      open:!!active?.open,hint:!!active?.querySelector('details')?.open,status:root.PetersonVolumeBoard.safeText(active?.querySelector('[role=status]')?.textContent,600)};
    if(!Number.isInteger(raw.attempt)||raw.attempt<0||raw.attempt>99999)throw TypeError('Некорректный вариант');
    return {attempt:raw.attempt,work:root.PetersonVolumeBoard.work(create(item.number,part,raw.attempt,raw.work),raw.work),open:raw.open===true,hint:raw.hint===true,status:root.PetersonVolumeBoard.safeText(raw.status,600)};
  }
  function restoreShared(part,scene) {
    if(!document.body.dataset.petersonBoard)return;
    if(!scene){if(part.expression&&/^(01[123]|02[23])-/.test(part.id))record(part)[1].formerlyAbsent=true;return;}
    const row=record(part)[1];Object.assign(row,{attempt:scene.attempt,work:scene.work,status:scene.status,open:scene.open,hint:scene.hint});
  }
  function resetShared(){if(document.body.dataset.petersonBoard)states.clear();}
  root.PetersonAnalogues={create,panel,shared,restoreShared,resetShared};
})(globalThis);
