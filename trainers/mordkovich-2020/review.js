(function () {
  'use strict';
  const {add, lessons, example} = window.MathExamTopicPractice;
  const ids = [];
  const ref = n => '25-review-' + n;
  const register = (key, printed, title, prompt, guide, rule, related, make) => {
    add(25,'review-'+key,4,title,prompt,rule,related,make);
    const lesson=lessons.get(ref(key));
    Object.assign(lesson,{printedReference:'Повторение, №'+printed,printedPrompt:prompt,printedGuide:guide});
    ids.push(lesson.id);
  };
  const question=(prompt,answer,calculation,error,wrong,diagnosis)=>({prompt,answer,calculation,error,mistakes:[[wrong,diagnosis]]});
  function model(caption,labels,questions,kind,attributes) {
    return Object.assign(example(caption,['Признак','Данные'],labels,questions,kind),attributes);
  }
  const ascii='abcd',cyr='абвг';
  const names=['натуральных','рациональных','целых','иррациональных'];
  const symbol=['N','Q','Z','I'];
  const rules=[
    'Натуральные числа здесь начинаются с 1. Нуль и отрицательные числа исключаются.',
    'Целые, обыкновенные дроби и конечные или периодические десятичные записи рациональны.',
    'Положительные и отрицательные целые числа, а также нуль не имеют дробной части.',
    'Иррациональные числа нельзя представить отношением двух целых чисел. Неполный квадрат имеет иррациональный квадратный корень.'
  ];
  const answers=['1 и 4','−2⅔, −2, −0,2(3), 0, 0,23, 1 и 4','−2, 0, 1 и 4','−√3, √2/2 и π'];
  const admitted=(type,kind)=>[[0],[0,1,2],[0,1],[3]][type].includes(kind);
  function numberSet(type,seed) {
    const k=seed+2;
    const candidates=[[k,0],[0,1],[-k,1],['1/'+(k+1),2],['√'+(k*k+1),3],['−π',3]];
    if(seed%2)candidates.push([k+1,0]);
    if(seed%3)candidates.push(['−1/'+k,2]);
    const list=candidates.filter(c=>admitted(type,c[1])),sum=list.length;
    const extra=[['−'+(k+1),1],['√'+((k+2)*(k+2)),0],['π/'+k,3]][seed%3];
    const include=+admitted(type,extra[1]);
    const caption='В наборе '+candidates.map(c=>c[0]).join('; ')+' выбери элементы множества '+symbol[type]+'.';
    return model(caption,[['Целевое множество',symbol[type]],['Новый элемент',extra[0]]],[
      question('Сколько чисел исходного набора попало в пересечение?',sum,'Проверяем числа по отдельности: '+list.map(c=>c[0]).join('; ')+'. Всего '+sum+'.',rules[type],candidates.length,'Ты посчитал всё исходное множество. Оставь лишь числа нужного типа.'),
      question('Если добавить '+extra[0]+', войдёт ли он в пересечение? Введи 1 для «да», 0 для «нет».',include,extra[0]+(include?' удовлетворяет':' не удовлетворяет')+' признаку множества '+symbol[type]+'.',rules[type],1-include,'Реши, к какому наиболее узкому классу относится именно новое число. В частности, √(k²) = k при k > 0.'),
      question('Сколько элементов нового набора окажутся вне пересечения?',candidates.length+1-sum-include,'Из '+(candidates.length+1)+' элементов исключаем '+(sum+include)+' выбранных.', 'Вычти мощность пересечения из общего количества.',candidates.length+1,'Это полная мощность нового набора. Из неё вычти число элементов пересечения.')
    ],'sets',{type,list:candidates.map(c=>c[0]),classes:candidates.map(c=>c[1]),extra});
  }
  for(let i=0;i<4;i++)register('1'+ascii[i],'1'+cyr[i],'Пересечение с множеством '+names[i]+' чисел',
    'Пересмотри каждое число набора A на с. 4. Какие из них принадлежат '+symbol[i]+'?',
    rules[i]+' Из исходного A остаются '+answers[i]+'.',rules[i],'sets',s=>numberSet(i,s));

  register('2','2','Контрпример к включению множеств','Среди четырёх утверждений о вложенности числовых множеств найди ложное и приведи контрпример.',
    'Ложен вариант в. Например, −1 принадлежит Z, а натуральным не является. Верны N ⊂ Z ⊂ Q ⊂ R и равенство Q ∪ I = R.',
    'Чтобы опровергнуть включение, достаточно одного элемента первого множества, который отсутствует во втором.','sets',s=>{
    const a=s+1,items=[[a,0],[-a,1],['1/'+a,2],['√'+(a*a+1),3]], pair=s%2?['Z','N',1]:['Q','Z',2];
    const index=pair[2]+1;
    return model('Ученик утверждает, что '+pair[0]+' ⊂ '+pair[1]+'. Кандидаты на контрпример занумерованы от 1 до 4.',items.map((c,i)=>[i+1,c[0]]),[
      question('Каков номер кандидата, который принадлежит первому множеству, но отсутствует во втором?',index,'Подходит '+items[index-1][0]+'. Он принадлежит '+pair[0]+', но не '+pair[1]+'.','Проверь сразу обе части определения.',1,'Первое число натуральное и входит в оба множества.'),
      question('Сколько из четырёх кандидатов опровергают данное включение?',1,'Ровно один кандидат находится в первом множестве за пределами второго.','Элементы вне первого множества не могут опровергнуть это включение.',2,'Проверь, принадлежит ли второй выбранный кандидат вообще первому множеству.'),
      question('Каков номер кандидата, который не принадлежит Q?',4,'√'+(a*a+1)+' лежит строго между целыми '+a+' и '+(a+1)+' и является корнем натурального неполного квадрата.','Сравни подкоренное число с соседними квадратами.',3,'Обыкновенная дробь рациональна.')
    ],'sets',{type:pair[0]==='Z'?2:1,list:items.map(x=>x[0]),classes:items.map(x=>x[1]),extra:[null,0]});
  });
  const divisibility=['Последняя цифра должна быть чётной.','Сумма цифр должна делиться на 3.','Последняя цифра должна быть 0 или 5.','Последняя цифра должна быть 0.'];
  for(const [i,d] of [2,3,5,10].entries()){
    const actual=[124,345,570,288,441,729].filter(n=>n%d===0);
    register('3'+ascii[i],'3'+cyr[i],'Кратность '+d+' в наборе','Оставь из шести чисел книги те, которые кратны '+d+'.',
      divisibility[i]+' Проверка исходного набора оставляет '+actual.join(', ')+'.',divisibility[i],'divisibility',s=>{
      const base=(s+10)*30,values=[base+2,base+3,base+5,base+6,base+10,base+15,base+20,base+21].slice(0,5+s%4);
      const yes=values.filter(n=>n%d===0),last=values.at(-1),sum=yes.reduce((a,b)=>a+b,0);
      return model('Отметь в ряду числа, делящиеся на '+d+' без остатка.',[['Ряд',values.join(', ')],['Делитель',d]],[
        question('Сколько подходящих чисел в ряду?',yes.length,'Выдели '+yes.join(', ')+'. Таких чисел '+yes.length+'.',divisibility[i],values.length,'Ты посчитал все числа. Примени признак к каждому.'),
        question('Какова сумма найденных кратных?',sum,yes.join(' + ')+' = '+sum+'.','Сложи только выделенные числа.',yes.length,'Это количество подходящих чисел, а требуется сумма.'),
        question('Какой остаток даёт последнее число ряда при делении на '+d+'?',last%d,last+' = '+d+' · '+Math.floor(last/d)+' + '+last%d+'.','Остаток неотрицателен и меньше делителя.',d,'Остаток не может быть равен делителю.')
      ],'multiples',{d,values});
    });
  }
  const divisors=n=>Array.from({length:n},(_,i)=>i+1).filter(k=>n%k===0);
  for(const [i,n] of [24,54,75,90].entries()){
    register('4'+ascii[i],'4'+cyr[i],'Все делители числа '+n,'Перечисли положительные делители '+n+' в порядке возрастания.',
      'Составь пары множителей. Объединяя оба числа из каждой пары, получишь '+divisors(n).join(', ')+'.',
      'Проверяй возможный меньший множитель до √n. Если оба множителя пары равны, записывай его только один раз.','prime',s=>{
      const options=[[12,18,24,30,36,42,48,54,60,72,84],[18,27,36,45,54,63,72,81,90,99,108],[15,25,35,45,55,65,75,85,95,105,125],[30,42,54,60,66,70,78,84,90,102,110]],v=options[i][s-1];
      const ds=divisors(v),pairs=ds.filter(k=>k*k<=v).map(k=>[k,v/k]),q=pairs.at(-1);
      return model('Составь все пары натуральных множителей числа '+v+'.', [['Произведение',v],['Проверяем меньший множитель до',Math.floor(Math.sqrt(v))]],[
        question('Сколько положительных делителей имеет '+v+'?',ds.length,'Делители: '+ds.join(', ')+'.','Считай обе стороны пар. Равные стороны учитывай один раз.',pairs.length,'Ты посчитал пары. Подсчитай различные числа, которые в них входят.'),
        question('Чему равен больший множитель в паре с меньшим множителем '+q[0]+'?',q[1],v+' : '+q[0]+' = '+q[1]+'.','Частное при точном делении даёт парный множитель.',v-q[0],'При поиске множителя нужно делить, а не вычитать.'),
        question('Каков наибольший собственный делитель этого числа?',ds.at(-2),'Исключи само число. Остаётся '+v+' : '+ds[1]+' = '+ds.at(-2)+'.','Подели на наименьший делитель, больший 1.',v,'Само число не считают собственным делителем.')
      ],'pairs',{v,pairs});
    });
  }
  for(const [i,[base,mult]] of [[3,4],[7,2]].entries()){
    const letter=i?'m':'n',target=base*mult;
    register('5'+ascii[i],'5'+cyr[i],'Доказательство кратности '+target,
      'Вырази неизвестное кратное '+base+' через целый множитель. Объясни, почему '+mult+letter+' делится на '+target+'.',
      'Если '+letter+' = '+base+'k для некоторого целого k, то '+mult+letter+' = '+mult+' · '+base+'k = '+target+'k. Последняя запись и доказывает кратность.',
      'Если b делит n, то n = bk при целом k. Умножение обеих частей на a даёт один и тот же множитель k.','divisibility',s=>{
      const b=base+s%4,a=mult+(s+1)%3,k=s+2,n=b*k,product=a*n;
      return model('Дано n = '+b+'k. Исследуй произведение '+a+'n.',[['Исходное n',n],['Множитель',a]],[
        question('Каков целый множитель k для указанного n?',k,n+' : '+b+' = '+k+'.','Отдели известный множитель b делением.',n-b,'Вычитание убирает лишь одну группу. Найди количество групп.'),
        question('Какой множитель стоит перед k в записи '+a+'n = … · k?',a*b,a+' · ('+b+'k) = '+(a*b)+'k.','Перемножь оба постоянных множителя.',a+b,'При умножении постоянные множители перемножаются.'),
        question('Какое частное получится, если разделить '+product+' на '+(a*b)+'?',k,product+' : '+(a*b)+' = '+k+'. Оно целое, что и доказывает кратность.','После деления останется k.',a*k,'Ты разделил только на первый постоянный множитель.')
      ],'factor',{a,b,k,n,product});
    });
  }
  const powers=[
    ['23⁶ + 23⁷','23⁶(1 + 23) = 24 · 23⁶. Множитель 24 виден явно.'],
    ['10⁵ + 5⁷','10⁵ + 5⁷ = 5⁵(2⁵ + 5²) = 57 · 5⁵ = 19 · (3 · 5⁵).'],
    ['37⁸ − 37⁷','37⁷(37 − 1) = 36 · 37⁷ = 18 · (2 · 37⁷).'],
    ['72² + 6⁵','72 = 2 · 6². Сумма равна 6⁴(4 + 6) = 10 · 6⁴ = 30 · (2 · 6³).']
  ];
  for(let i=0;i<powers.length;i++){
    const target=[24,19,18,30][i];
    register('6'+ascii[i],'6'+cyr[i],'Выделить делитель '+target+' в степенях',
      'Покажи, откуда в выражении '+powers[i][0]+' появляется множитель '+target+'.',
      powers[i][1],'Сначала вынеси одинаковый степенной множитель. Проверь оставшееся число и сам общий множитель на делимость.','factorization',s=>{
      const a=3+s%5,e=2+s%3;
      let common,e1,e2,coef1,coef2,sign=1,caption;
      if(i===0){common=a**e;coef1=1;coef2=a;caption=a+'^'+e+' + '+a+'^'+(e+1);}
      else if(i===1){common=a**e;coef1=2**e;coef2=a*a;caption='('+2*a+')^'+e+' + '+a+'^'+(e+2);}
      else if(i===2){common=a**e;coef1=a;coef2=1;sign=-1;caption=a+'^'+(e+1)+' − '+a+'^'+e;}
      else{const b=2+s%3;common=a**4;coef1=b*b;coef2=a;caption=(b*a*a)+'² + '+a+'⁵';}
      e1=common*coef1;e2=common*coef2;
      const bracket=coef1+sign*coef2,total=e1+sign*e2;
      return model('Вынеси '+common+' за скобки в выражении '+caption+'.', [['Первый член',e1],['Второй член',e2],['Знак',sign===1?'+':'−']],[
        question('Какой коэффициент останется от первого члена после вынесения?',coef1,e1+' : '+common+' = '+coef1+'.','Раздели первый член на общий множитель.',e1,'Это исходный член до деления.'),
        question('Чему равны скобки после вынесения?',bracket,'Скобки равны '+coef1+(sign===1?' + ':' − ')+coef2+' = '+bracket+'.','Сохрани знак между исходными членами.',sign===1?coef1-coef2:coef1+coef2,'Проверь знак между двумя членами выражения.'),
        question('Чему равно частное всего исходного выражения при делении на '+bracket+'?',common,total+' = '+common+' · '+bracket+'. После сокращения остаётся '+common+'.','Искомое частное — множитель вне скобок.',total,'Это значение выражения до деления.')
      ],'powers',{common,coef1,coef2,sign,e1,e2});
    });
  }
  const tails=[[3456728496,4,2],[473928375,125,3],[26354981175,25,2],[1736907064,8,3]];
  for(const [i,[printed,d,width]] of tails.entries()){
    const decimal=10**width,last=printed%decimal;
    register('7'+ascii[i],'7'+cyr[i],'Проверить делимость по '+(width===2?'двум':'трём')+' последним цифрам',
      'Докажи делимость числа '+printed+' на '+d+', не деля многозначное число целиком.',
      'Число '+decimal+' кратно '+d+'. В исходном числе можно отбросить целые блоки по '+decimal+'. Хвост '+String(last).padStart(width,'0')+' равен '+d+' · '+last/d+', поэтому остаток равен нулю.',
      'Отбрасываемая часть должна делиться на делитель. Проверяй последние цифры как целое число, в том числе при ведущем нуле.','divisibility',s=>{
      const prefix=32+3*s,tail=(d*(1+s%Math.max(2,Math.floor((decimal-2)/d)))+(s%3===1?1:0))%decimal,
        n=prefix*decimal+tail,rem=n%d;
      return model('Определи остаток при делении '+n+' на '+d+' по последним '+width+' цифрам.',[['Число',n],['Делитель',d]],[
        question('Какое число образуют последние '+width+' цифры? Ведущие нули можно опустить.',tail,String(n).slice(-width)+' означает число '+tail+'.','Возьми только нужное число цифр справа.',prefix,'Это старшая часть числа, а нужна правая группа цифр.'),
        question('Каков остаток от деления хвоста на '+d+'?',rem,tail+' = '+d+' · '+Math.floor(tail/d)+' + '+rem+'.','Найди ближайшее кратное снизу и вычти.',d,'Остаток всегда строго меньше делителя.'),
        question('Если увеличить всё число на 1, каким станет остаток?',(rem+1)%d,'При добавлении единицы остаток увеличивается на 1. Если он доходит до делителя, получится 0.',
          'Старшая часть кратна делителю и не меняет остаток.',rem,'Остаток для исходного числа уже найден. Добавь к нему единицу.')
      ],'tail',{prefix,tail,width,d,n});
    });
  }
  function figure(data){
    const text=(x,y,s)=>'<text x="'+x+'" y="'+y+'">'+s+'</text>';
    const box=(x,y,w,c)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="25" rx="4" fill="'+c+'" stroke="#588178"/>';
    let body,title;
    if(data.chart==='sets'){
      title='Вложенность числовых множеств и иррациональная часть';
      body='<rect x="7" y="8" width="264" height="88" rx="6" fill="#f6f3e9" stroke="#6c705b"/><rect x="15" y="27" width="157" height="60" rx="5" fill="#dfebe5" stroke="#59847a"/><rect x="42" y="42" width="120" height="38" rx="4" fill="#c7e1dc" stroke="#44766a"/>'+box(77,49,74,'#f8f2d9')+text(15,23,'R')+text(22,48,'Q')+text(49,63,'Z')+text(86,67,'N')+text(183,56,'I = R ∖ Q');
    }else if(data.chart==='multiples'){
      title='Группы по '+data.d+' единиц и остаток';
      const n=data.values.at(-1),q=Math.floor(n/data.d),r=n%data.d;
      body=box(10,20,123,'#d6ebe3')+text(17,37,'групп по '+data.d+': '+q)+box(146,20,119,'#f6e6bf')+text(152,37,'остаток: '+r)+text(12,75,n+' = '+q+' · '+data.d+' + '+r);
    }else if(data.chart==='pairs'){
      title='Пары множителей одного числа';
      body=data.pairs.map(([a,b],j)=>{const x=10+(j%3)*89,y=8+Math.floor(j/3)*30;return box(x,y,80,'#dceee7')+text(x+6,y+17,a+' × '+b);}).join('');
    }else if(data.chart==='factor'){
      title='Два способа сгруппировать множители';
      body=box(12,12,83,'#dceee7')+text(25,30,'a = '+data.a)+box(105,12,80,'#dceee7')+text(115,30,'b = '+data.b)+box(194,12,74,'#f4e8c9')+text(205,30,'k = '+data.k)+text(12,68,'a · (b · k) = (a · b) · k');
    }else if(data.chart==='powers'){
      title='Общий множитель двух членов';
      body=box(10,10,256,'#dceee7')+text(19,28,data.e1+' = '+data.common+' × '+data.coef1)+box(10,43,256,'#f4e8c9')+text(19,61,data.e2+' = '+data.common+' × '+data.coef2)+text(12,90,'Множитель '+data.common+' повторяется.');
    }else{
      title='Старшие разряды и хвост числа';
      body=box(13,17,121,'#dceee7')+text(22,34,data.prefix+' × '+10**data.width)+box(144,17,119,'#f4e8c9')+text(155,34,'хвост '+String(data.tail).padStart(data.width,'0'))+text(12,71,'Делитель '+data.d+' делит '+10**data.width+' без остатка.');
    }
    return '<svg viewBox="0 0 280 105" role="img" aria-label="'+title+'"><g font-family="sans-serif" font-size="13" fill="#193e44">'+body+'</g></svg>';
  }
  window.MathExamTopicEdition={trainerId:'mordkovich-2020',authors:'Мордкович, Семёнов · часть 2 · 2020',
    grade:()=>'10 класс',unit:'упражнение',storePrefix:'math:mordkovich-2020:v1:',figure,
    source:()=> 'https://pdf.my-uchebnik.ru/pdf/algebra/00000025.pdf#page=3',nextId:lesson=>ids[ids.indexOf(lesson.id)+1]};
})();
