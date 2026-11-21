/* Vilenkin 5, point 2, original teaching for printed exercises 1.30–1.35. */
(function(root){
  'use strict';
  const D=typeof module!=='undefined'&&module.exports?require('./vilenkin5-printed-digits.js'):root.Vilenkin5PrintedDigits;
  const descriptions=[
    ['1.30','Порядок действий и независимые скобки','Вычисления в разных скобках можно начать в любом порядке. Внутри одного действия сначала должны быть готовы оба его числа. Умножение и деление без скобок имеют одинаковый приоритет: их выполняют слева направо.',['В выражении (48 − 8) · (9 − 9) можно сначала посчитать любую из двух разностей.','Правая скобка равна нулю. Уже ясно, что всё произведение равно нулю.','При записи 96 : 8 · 2 сначала выполни деление: 12 · 2 = 24.'], 'Если в выражении две отдельные пары скобок, первой разрешено считать только левую.', 'Как узнать, какие два действия можно поменять местами, сохранив результат?'],
    ['1.31','Складываем разрядные слагаемые','Каждое слагаемое занимает свои позиции. Если в каком-то промежуточном разряде нет слагаемого, этот разряд записывается нулём.', ['В сумме 70 000 + 900 + 6 нет отдельных тысяч и десятков.','По разрядам выходит 70 906. Нули держат места тысяч и десятков.','Проверяем: 7 десятков тысяч, 9 сотен, 6 единиц.'], 'Запись суммы разрядных слагаемых получается простым приписыванием всех их ненулевых цифр.', 'Как по итоговой записи обнаружить разряд, для которого не было слагаемого?'],
    ['1.32','На сколько один тоннель короче другого?','У двух длин одно начало и одна единица измерения. Размести короткую полосу под длинной. Незакрытая часть длинной полосы и есть разница в метрах.', ['Пусть два сооружения имеют длину 1 850 м и 1 320 м.','Чтобы от конца меньшей длины дойти до конца большей, надо добавить 1 850 − 1 320 = 530 м.','Обратная проверка: 1 320 + 530 = 1 850 м.'], 'На вопрос о разнице длин отвечает сумма длин обоих тоннелей.', 'Если к меньшей длине прибавить свой ответ, что должно получиться?'],
    ['1.33','Проверяем четыре вычисления разными обратными действиями','При вычитании прибавь результат к вычитаемому. При делении умножь частное на делитель. В составных выражениях проверяй каждое уже выполненное действие.', ['Для 812 − 375 результат 437 проверяется равенством 375 + 437 = 812.','В выражении 156 : 52 + 40 сначала получаем 3 и проверяем 3 · 52 = 156.','Затем получаем 43. Проверка: 43 − 40 = 3.'], 'Если промежуточное деление проверено, его частное всегда уже является окончательным ответом.', 'Как обнаружить пропущенное последнее действие?'],
    ['1.34','Соседи больших круглых чисел','Слова «следующее» и «на один больше» задают одинаковый сдвиг. Слова «предыдущее» и «на один меньше» — сдвиг в обратную сторону. При переходе через нули или девятки меняется несколько мест.', ['За числом 999 999 следует 1 000 000.','Перед 50 000 стоит 49 999. Из единицы тысяч пришлось перейти в сотни, десятки и единицы.','Обратное действие возвращает ровно к 50 000, поэтому сдвиг длился один шаг.'], 'Перед числом, которое заканчивается нулём, можно получить отрицательную цифру единиц.', 'Какие формулировки в этом упражнении требуют совершенно одинакового вычисления?'],
    ['1.35','От слов до восьми записей по классам','Найди в словесной записи названия классов. Поставь между ними границы, а в пропущенные внутренние классы впиши 000. Подпункты а–г начинаются на с. 14, д–з продолжаются на с. 15.', ['«Семь миллиардов восемь тысяч два» разбивается на 7 | 000 | 008 | 002.','В словах нет миллионов, поэтому после миллиардов пишем группу 000.','Получается 7 000 008 002. Проверь, что слова «восемь тысяч» соответствуют группе 008.'], 'Внутренние классы без ненулевых цифр можно удалять из записи цифрами.', 'Какие классы могут отсутствовать в звучащем названии, но должны быть сохранены в записи?']
  ];
  const lessons=descriptions.map(([number,title,explanation,worked,misconception,reflect])=>({number,key:'printed-'+number.replace('.','-'),part:1,point:2,page:14,...(number==='1.35'?{pageEnd:15}:{}),title,explanation,worked,misconception,reflect,requires:['v5f-place-value'],related:['v5f-place-build']}));
  const labels=['а','б','в','г','д','е','ж','з'];
  const format=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
  const natural=(step,prompt,answer,hint,errors=[])=>Object.assign(step(prompt,answer,hint,errors),{answerFormat:'v5-natural'});
  const node=(left,op,right,brackets=false)=>({left,op,right,brackets});
  const operations={'+':(a,b)=>a+b,'−':(a,b)=>a-b,'·':(a,b)=>a*b,':':(a,b)=>a/b};
  function readExpr(tree){
    const ordered=[];
    function visit(n){
      if(typeof n==='number')return {text:String(n),value:n,leaf:true};
      const left=visit(n.left),part={code:ordered.length+1,op:n.op};ordered.push(part);const right=visit(n.right);
      const text=left.text+' '+n.op+' '+right.text;
      Object.assign(part,{text:left.value+' '+n.op+' '+right.value,value:operations[n.op](left.value,right.value),first:left.leaf&&right.leaf});
      return {text:n.brackets?'('+text+')':text,value:part.value,leaf:false};
    }
    const {text,value}=visit(tree);
    return {text,value,ordered,first:ordered.filter(op=>op.first).map(op=>op.code)};
  }
  function arithmeticTasks(number,seed,random,step){
    const order=number==='1.30',r=(a,b,source)=>seed?random(a,b):source;
    let trees;
    if(order){
      const left=r(1700,3900,2390),div=r(2,6,2),q=r(30,120,90),p=r(720,1600,1003),v=r(4,17,9),a=r(250,790,506);
      const mid=r(460,930,700),minus=r(50,170,100),plus=r(80,250,200),ref=r(250,850,700);
      const base=r(10,50,30)*10,mult=r(2,14,10),last=seed?[2,5,10][random(0,2)]:2;
      trees=[node(left,'−',node(div*q,':',div)),node(node(p,'−',v,true),'·',node(a,'−',a,true)),node(node(node(mid,'−',minus),'+',plus,true),':',node(ref+1,'−',ref,true)),node(node(base,'·',mult),':',last)];
    }else{
      const a=r(730,980,936),b=r(285,629,579),p=r(207,486,344),m=r(3,9,7),div=r(24,73,47),q=r(2,8,3),add=r(16,75,38),den=r(12,26,18),quot=r(32,69,40),left=r(135,325,287);
      trees=[node(a,'−',b),node(p,'·',m),node(node(div*q,':',div),'+',add),node(node(left,'+',den*quot-left,true),':',den)];
    }
    const entries=trees.map(readExpr),steps=[];
    for(const [i,e]of entries.entries()){
      if(order){
        const first=step(labels[i]+'. В записи '+e.text+' пронумеруй знаки действий слева направо, начиная с 1. Введи номер любого действия, с которого можно начать.',e.first[0],'Сначала бери действия, у которых оба числа уже известны. Учитывай скобки и приоритет. В отдельных скобках можно начать с любой стороны.');
        first.alternatives=e.first.slice(1);steps.push(first);
      }
      const intermediate=e.ordered.filter(x=>x.first&&x.value!==e.value).map(x=>({value:x.value,text:'Это правильно выполненное первое действие. Вернись к записи и выполни оставшиеся действия с этим числом.'}));
      steps.push(natural(step,labels[i]+'. Чему равно выражение '+e.text+'?',e.value,'Последовательно заменяй готовые действия их значениями. Перед ответом убедись, что вычислено всё выражение.',intermediate));
    }
    return {prompt:'Вычисли все четыре выражения из таблицы. Ответы запиши в порядке а; б; в; г.',inputPrompt:'Четыре числовых значения',answer:entries.map(e=>e.value),answerFormat:'v5-list',steps,errors:[],data:{entries},table:{caption:'Номер знака действия отсчитывается слева. В отдельных скобках возможны два правильных начала.',headers:['№','Выражение'],rows:entries.map((e,i)=>[labels[i],e.text]),columnWidths:[14,86]},conditionKey:entries.map(e=>e.text).join('|')};
  }
  const sourceSums=[[40000,4000,900,50,7],[6000000,40000,2000,600,1],[700000,9000,300,20],[2000,900,5]];
  function expanded(seed,random,step){
    const rows=sourceSums.map(row=>row.map(value=>seed?random(1,9)*10**Math.floor(Math.log10(value)):value));
    const steps=rows.map((row,i)=>{
      const total=row.reduce((a,b)=>a+b),compact=Number(row.map(n=>String(n)[0]).join(''));
      const errors=compact===total?[]:[{value:compact,text:'Только ненулевые цифры уже выписаны. Проверь, есть ли между их разрядами пропущенные места.'}];
      return natural(step,labels[i]+'. Сложи '+row.map(format).join(' + ')+'.',total,'Сопоставь каждому слагаемому его разряд. Незаполненные внутренние места получат нули.',errors);
    });
    return {prompt:'Восстанови число из разрядных слагаемых в каждой строке и введи четыре ответа по порядку через точку с запятой.',inputPrompt:'Суммы а; б; в; г',answer:steps.map(s=>s.answer),answerFormat:'v5-list',steps,errors:[],data:{rows},table:{caption:'Из каких частей складывается число',headers:['№','Разрядные слагаемые'],rows:rows.map((row,i)=>[labels[i],row.map(format).join(' + ')]),columnWidths:[14,86]},conditionKey:rows.join('/')};
  }
  function tunnels(seed,random,step){
    const short=seed?random(2010,4870):3201,length=seed?short+random(390,1900):4615,diff=length-short;
    const steps=[step('Какую длину нужно дополнить до большей? Введи 1 для железнодорожного тоннеля, 2 для автомобильного.',2,'Меньшую длину будем дополнять до большей.'),natural(step,'Сколько метров не хватает короткому тоннелю до длины длинного?',diff,'Вычти меньшую длину из большей.',[{value:length+short,text:'Это была бы суммарная длина тоннелей. Для сравнения нужен только незакрытый участок.'}]),natural(step,'К длине автомобильного тоннеля прибавь найденную разницу. Сколько метров получилось?',length,'Так проверяют сравнение. Если результат равен длине железнодорожного тоннеля, разница найдена верно.')];
    return {prompt:'Железнодорожный тоннель имеет длину '+format(length)+' м, автомобильный — '+format(short)+' м. На сколько метров автомобильный тоннель короче?',inputPrompt:'Разница в метрах',answer:diff,answerFormat:'v5-natural',steps,errors:steps[1].errors,data:{short,length,diff},table:{caption:seed?'Авторский пример: длины двух сооружений':'Длины из условия о тоннелях к Олимпиаде в Сочи',headers:['Вид тоннеля','Длина, м'],rows:[['Железнодорожный',format(length)],['Автомобильный',format(short)]]},conditionKey:length+'/'+short};
  }
  function adjacent(seed,random,step){
    const high=(seed?random(2,8):1)*10000000,base=seed?[random(1,8)*100-1,high,high,random(2,8)*1e7-1,random(201,950)*100,random(2001,8197)*10+9]:[99,10000000,10000000,99999999,75700,76909];
    const shifts=[1,-1,-1,1,-1,1],requests=['Следующее за','Предыдущее перед','На единицу меньше, чем','На единицу больше, чем','На единицу меньше, чем','На единицу больше, чем'];
    const steps=base.map((n,i)=>natural(step,labels[i]+'. '+requests[i]+' '+format(n)+'.',n+shifts[i],'Сделай ровно один шаг по натуральному ряду, затем проверь обратным шагом.',[{value:n-shifts[i],text:'Получилось другое соседнее число. Проверь, в какую сторону надо перейти.'}]));
    return {prompt:'Выпиши по порядку шесть искомых чисел. Сохрани одинаковые ответы, если вопросы требуют одного и того же перехода.',inputPrompt:'Шесть чисел по порядку',answer:steps.map(s=>s.answer),answerFormat:'v5-list',steps,errors:[],data:{base,shifts,requests},table:{caption:'Один шаг по ряду натуральных чисел',headers:['№','Начало','Что сделать'],rows:base.map((n,i)=>[labels[i],format(n),requests[i]]),columnWidths:[12,40,48]},conditionKey:base.join('/')};
  }
  const sourceWords=[74,350,636300,2800005,200070301,98308600845,10100065008,9000007006];
  function wordsTask(seed,random,step){
    const values=sourceWords.map(n=>seed?Number(String(n).replace(/[1-9]/g,()=>String(random(1,9)))):n);
    const steps=values.map((n,i)=>natural(step,labels[i]+'. '+D.words(n)+'. Запиши это число цифрами.',n,'Назначь каждому классу своё место. Все классы правее первого имеют по три цифры.'));
    const chosen=seed?random(0,7):7;
    return {prompt:'Запиши цифрами «'+D.words(values[chosen])+'». В разборе проверь все восемь чисел со страниц 14 и 15.',inputPrompt:'Число цифрами',answer:values[chosen],answerFormat:'v5-natural',steps,errors:[],data:{values},table:{caption:'Разрядные классы в словах',headers:['№','Число словами'],rows:values.map((n,i)=>[labels[i],D.words(n)]),columnWidths:[12,88]},conditionKey:values.join('/')+'-'+chosen};
  }
  const generators={'1.30':(s,r,t)=>arithmeticTasks('1.30',s,r,t),'1.31':expanded,'1.32':tunnels,'1.33':(s,r,t)=>arithmeticTasks('1.33',s,r,t),'1.34':adjacent,'1.35':wordsTask};
  const bounds={'1.30':{row:[0,3,0],op:[0,3,0]},'1.31':{row:[0,3,0],take:[1,5,1]},'1.32':{portion:[0,2,0]},'1.33':{row:[0,3,0],op:[0,1,0]},'1.34':{row:[0,5,0]},'1.35':{row:[0,7,0],place:[0,11,0]}};
  function explore(lesson,state,task,table){
    const d=task.data;
    if(d.entries){
      const e=d.entries[state.row],op=e.ordered[state.op];
      const opts=Array.from({length:lesson.number==='1.30'?4:2},(_,i)=>[i,'Знак '+(i+1)+' слева']);
      if(!op)return {title:'Разбери выражение по действиям',controls:[{key:'row',title:'Выражение',values:eRows(d.entries)},{key:'op',title:'Позиция знака',values:opts}],visual:table('Такой позиции в этом выражении нет',['Выражение','Знаки слева'],[[e.text,e.ordered.map(a=>a.op).join(', ')]]),question:'Сколько знаков действий действительно записано в этой строке?',answer:e.ordered.length,why:'В записи '+e.text+' расположено знаков действий: '+e.ordered.length+'.'};
      return {title:'Разбери выражение по действиям',controls:[{key:'row',title:'Выражение',values:eRows(d.entries)},{key:'op',title:'Знак действия',values:opts}],visual:table('Запись и выбранное действие после вычисления его частей',['Запись','Действие'],[[e.text,op.text]]),question:'Какой результат у выбранного действия?',answer:op.value,why:op.text+' = '+op.value+'. '+(op.first?'Для этого действия оба числа даны сразу.':'Здесь используются результаты предыдущих действий.')};
    }
    if(d.rows){
      const row=d.rows[state.row].slice(0,state.take),total=row.reduce((a,b)=>a+b,0);
      return {title:'Собери частичную сумму',controls:[{key:'row',title:'Строка',values:eRows(d.rows)},{key:'take',title:'Возьми до этого количества слагаемых',min:1,max:5,step:1}],visual:table('Выбранные разрядные слагаемые',['Шаг','Добавляем'],row.map((n,i)=>[i+1,format(n)])),question:'Сколько дают выбранные слагаемые вместе?',answer:total,why:row.map(format).join(' + ')+' = '+format(total)+'.'};
    }
    if(d.diff){
      const end=20+235*d.short/d.length,pieces=['Вся железнодорожная длина','Автомобильная длина','Участок разницы'],answer=[d.length,d.short,d.diff][state.portion];
      const svg='<svg viewBox="0 0 275 82" role="img" aria-label="Две длины от общего начала. Пунктир показывает разницу."><line x1="20" y1="23" x2="255" y2="23" stroke="'+(state.portion===0?'#a75822':'#52736b')+'" stroke-width="9"/><line x1="20" y1="57" x2="'+end+'" y2="57" stroke="'+(state.portion===1?'#a75822':'#52736b')+'" stroke-width="9"/><line x1="'+end+'" y1="57" x2="255" y2="57" stroke="'+(state.portion===2?'#a75822':'#5d7488')+'" stroke-dasharray="6 3" stroke-width="5"/><path d="M20 10v57M255 10v57" stroke="#263c33"/></svg>';
      return {title:'Выровняй две длины по началу',controls:[{key:'portion',title:'Выделенный участок',values:pieces.map((n,i)=>[i,n])}],visual:svg+'<p>Сверху '+format(d.length)+' м, снизу сплошной участок '+format(d.short)+' м. Пунктиром показано, сколько ещё нужно добавить.</p>',question:'Сколько метров в выделенном участке?',answer,why:state.portion===2?format(d.length)+' − '+format(d.short)+' = '+format(d.diff)+' м.':'По условию этот участок имеет длину '+format(answer)+' м.'};
    }
    if(d.base){
      const n=d.base[state.row],shift=d.shifts[state.row];
      return {title:'Отметь один шаг',controls:[{key:'row',title:'Подпункт',values:eRows(d.base)}],visual:table('Переход к соседу',['Старт','Шаг'],[[format(n),shift<0?'На единицу влево':'На единицу вправо']]),question:'Какое число получится?',answer:n+shift,why:format(n)+(shift<0?' − 1 = ':' + 1 = ')+format(n+shift)+'.'};
    }
    return D.explore(lesson,state,task,table);
  }
  function eRows(values){return values.map((_,i)=>[i,labels[i]]);}
  const api={lessons,generators,bounds,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5PrintedCalculations=api;
})(typeof window!=='undefined'?window:globalThis);
