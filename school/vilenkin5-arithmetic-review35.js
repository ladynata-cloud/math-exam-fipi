/* Авторские рабочие места к печатным №1.177–1.180, часть 1, §6, с. 35. */
(function(root){
  'use strict';
  const numbers=['1.177','1.178','1.179','1.180'];
  const lessonText=[
    ['Двадцать вычислений по четырём действиям','Для каждой строки выбери действие по знаку. При умножении на ноль получишь ноль, а деление на единицу оставляет число прежним.','Например, 56 + 27 = 56 + 20 + 7 = 83. Частное 360 : 9 можно проверить умножением 40 · 9.','Деление на единицу даёт единицу.','Как быстро проверить вычисление обратным действием?'],
    ['Единичные отрезки на бесконечном луче','Отложи каждую следующую длину от конца предыдущей. Буква B задаёт направление луча AB, а точка A — его начало. Конца у луча нет.','Если три соседних промежутка имеют длину по 2 см, от начала до третьей отметки 3 · 2 = 6 см.','Откладывать отрезки можно только до края видимого рисунка.','Почему число отметок и число промежутков отличаются?'],
    ['Наименьшее и наибольшее число заданной длины','В старшем разряде натурального числа нельзя ставить ноль. Для наименьшего числа поставь единицу и допиши нули. Для наибольшего займи каждое место девяткой.','Трёхзначный ряд начинается со 100 и заканчивается числом 999. У следующего числа 1000 появляется четвёртый разряд.','Наименьшее четырёхзначное число — это 0001.','Что изменится, если к наибольшему числу добавить единицу?'],
    ['Заполни восемь столбцов деления','Делимое равно произведению делителя и частного. Если дано только одно из трёх чисел, проверь, какие значения остальных ты вправе выбрать самостоятельно. Делитель не может быть нулём.','При делителе 4 и частном 9 делимое равно 36. Если известен только делитель 4, подойдут и 36 : 4 = 9, и 20 : 4 = 5.','У каждого столбца с пустыми клетками всегда единственный ответ.','В каких столбцах твой ответ может отличаться от ответа другого ученика?']
  ];
  const lessons=lessonText.map(([title,explanation,example,misconception,reflect],i)=>({number:numbers[i],key:'printed-'+numbers[i].replace('.','-'),part:1,page:35,point:6,title,explanation,worked:[example],misconception,reflect,requires:[['v5f-printed-1-162','v5f-printed-1-155','v5f-printed-1-16','v5f-printed-1-161'][i]],related:['v5f-printed-1-174']}));
  const symbols=['+','−','·',':'],letters='абвг',op=(a,k,b)=>[a+b,a-b,a*b,a/b][k];
  const printed=[[[51,27],[44,36],[86,16],[74,29],[38,24]],[[31,13],[46,23],[33,18],[74,37],[43,24]],[[21,4],[49,0],[17,2],[15,8],[39,1]],[[560,8],[200,5],[490,7],[720,9],[700,1]]];
  function work(a,k,b){
    if(k===0||k===1){const sign=symbols[k],tens=Math.floor(b/10)*10,ones=b%10;return a+' '+sign+' '+tens+' '+sign+' '+ones;}
    if(k===2)return b===0?'Ноль групп не дают ни одного предмета.':b===1?'Одна группа сохраняет количество предметов.':b+' одинаковых групп по '+a;
    return 'Какое число при умножении на '+b+' даёт '+a+'?';
  }
  function generate177(seed,r,step){
    const rows=printed.map((group,k)=>group.map(([a,b],j)=>{
      if(!seed)return [a,b];
      if(k===0)return [r(18,95),r(11,58)];
      if(k===1){const b=r(10,40);return [b+r(4,46),b];}
      if(k===2)return [r(11,59),[r(2,7),0,r(2,7),r(2,9),1][j]];
      const d=j===4?1:r(3,9);return [r(8,89)*d,d];
    }));
    const steps=rows.flatMap((group,k)=>group.map(([a,b],j)=>{
      const answer=op(a,k,b),alternative=k===0?a-b:k===1?a+b:k===2?a+b:a*b;
      return step(letters[k]+', строка '+(j+1)+'. Вычисли '+a+' '+symbols[k]+' '+b+'.',answer,work(a,k,b)+'.',
        alternative>=0&&alternative!==answer?[{value:alternative,text:'Получилось значение другого действия. Проверь знак '+symbols[k]+' в этой строке.'}]:[]);
    }));
    return {steps,prompt:'В последней строке каждого столбца найди результат. Какой из этих четырёх результатов наибольший?',inputPrompt:'Наибольшее из четырёх значений',
      answer:Math.max(...rows.map((group,k)=>op(group[4][0],k,group[4][1]))),why:'Сравни именно четыре последних результата, по одному на каждый знак.',errors:[],conditionKey:'1.177/'+rows.flat(2).join(':'),data:{review35:{rows}},
      table:{caption:'Действия в исходном порядке',headers:['Группа','Примеры сверху вниз'],rows:rows.map((g,k)=>[letters[k],g.map(([a,b])=>a+' '+symbols[k]+' '+b).join('; ')]),columnWidths:[20,80]}};
  }
  function generate178(seed,r,step){
    const unit=seed?r(2,8):1,count=seed?r(70,190):100;
    const steps=[{...step('а. Можно ли на луче AB отложить подряд '+count+' таких отрезков?', 'да','Луч можно продолжать за границы рисунка.',[]),answerFormat:'v5-arithmetic-truth',trueStatement:true,evidence:'У луча есть начало и направление. Видимый конец рисунка не является концом луча.',inputPrompt:'Да или нет'},
      ...['AK','AD','AH'].map((name,i)=>step('б. Найди длину отрезка '+name+' в сантиметрах.',unit*(i+2),'Посчитай промежутки длиной '+unit+' см от A до названной точки.',[{value:unit*(i+3),text:'Ты посчитал и начальную отметку. Длину составляют промежутки между отметками.'}]))];
    return {steps,prompt:'От A на луче AB последовательно откладывают AM, MK, KD и DH по '+unit+' см. Продолжи ряд мысленно до '+count+' одинаковых промежутков. Как далеко будет последняя точка от A?',answer:count*unit,inputPrompt:'Длина в сантиметрах',why:'Умножь число промежутков на длину одного.',errors:[],data:{markedUnits:{unit,count}},conditionKey:'1.178/'+[unit,count].join(':'),
      table:{caption:'Соседние отрезки на одном луче',headers:['Порядок','Длина'],rows:['AM','MK','KD','DH'].map(n=>[n,unit+' см']),columnWidths:[46,54]}};
  }
  function generate179(seed,r,step){
    const widths=seed?[r(2,4),r(5,8)]:[2,6],steps=widths.flatMap((w,i)=>[0,1].map(which=>{
      const answer=which?10**w-1:10**(w-1),wrong=which?10**w:10**(w-1)-1;
      return step('аб'[i]+'. Запиши '+(which?'наибольшее':'наименьшее')+' натуральное число, в котором '+w+' цифр.',answer,
        which?'Самая большая цифра в каждом разряде — 9.':'Старшая цифра — 1, остальные можно сделать нулями.',[{value:wrong,text:'Посчитай цифры введённого числа. Их должно быть ровно '+w+'.'}]);}));
    return {steps,prompt:'Какое число следует сразу за наибольшим '+widths[1]+'-значным числом?',inputPrompt:'Следующее число',answer:10**widths[1],why:'При прибавлении единицы ко всем девяткам появляется новый старший разряд.',errors:[],data:{digitLimits:{widths}},conditionKey:'1.179/'+widths.join(':'),
      table:{caption:'Сколько цифр должно быть в числе',headers:['Пункт','Цифр'],rows:widths.map((v,i)=>['аб'[i],v]),columnWidths:[42,58]}};
  }
  const cellFormat='v5-division-column';
  function read(value){
    let s=String(value).trim();
    const m=s.match(/^(\d+)\s*[:÷/]\s*(\d+)\s*=\s*(\d+)$/);
    if(m)return m.slice(1).map(x=>BigInt(x));
    if(!/^\d+(?:\s*[;,]\s*\d+){2}$/.test(s))return null;
    return s.split(/[;,]/).map(x=>BigInt(x.trim()));
  }
  function inputIssue(value){return read(value)?'':'Запиши три числа через точку с запятой: делимое; делитель; частное. Можно записать равенство деления.';}
  function mistake(value,t){
    const v=read(value);if(!v)return inputIssue(value);
    for(let i=0;i<3;i++)if(t.knownCells[i]!==null&&BigInt(t.knownCells[i])!==v[i])return 'В исходном столбце уже дано '+['делимое','значение делителя','значение частного'][i]+' '+t.knownCells[i]+'. Сохрани заполненные клетки.';
    if(v[1]===0n)return 'Делитель равен нулю. На ноль делить нельзя.';
    return v[0]===v[1]*v[2]?'':'Умножь делитель на частное. Результат должен равняться делимому.';
  }
  function generate180(seed,r,step){
    const printedCells=[[72,9,null],[null,6,8],[64,null,32],[null,10,120],[33,null,3],[null,13,null],[null,null,8],[700,null,null]];
    const rows=printedCells.map(template=>{if(!seed)return template.slice();const divisor=r(2,17),quotient=r(2,90),values=[divisor*quotient,divisor,quotient];return template.map((v,i)=>v===null?null:values[i]);});
    const steps=rows.map((knownCells,i)=>{
      let [a,b,c]=knownCells;
      if(a===null){b??=2;c??=3;a=b*c;}else if(b===null){b=c===null?1:a/c;c??=a;}else c=a/b;
      return {...step('Столбец '+(i+1)+'. Заполни все три клетки и запиши в порядке: делимое; делитель; частное.'+(i>=5?' Подойдёт любое верное заполнение с данными этого столбца.':''),[a,b,c].join('; '),'Проверь исходные клетки и равенство «делитель × частное = делимое».',[]),answerFormat:cellFormat,knownCells,inputPrompt:'Делимое; делитель; частное'};
    });
    return {steps,prompt:'Сколько столбцов допускают несколько разных правильных заполнений?',answer:rows.filter(row=>row.filter(x=>x!==null).length===1).length,inputPrompt:'Число столбцов',why:'Если известна только одна величина, можно выбрать вторую и восстановить третью по правилу деления.',errors:[],data:{divisionRows:{rows}},conditionKey:'1.180/'+rows.map(row=>row.join(':')).join('/'),
      table:{caption:'Каждая строка здесь соответствует одному печатному столбцу',headers:['№','Делимое','Делитель','Частное'],rows:rows.map((row,i)=>[i+1,...row.map(v=>v===null?'…':v)]),columnWidths:[12,30,29,29]}};
  }
  function marks(unit,total){
    const labels=['A','M','K','D','H'],x=i=>14+37*i,len=Math.min(6,total);
    const lastLabel=i=>total>6&&i===6?total:i;
    const tags=Array.from({length:len+1},(_,i)=>'<path d="M'+x(i)+' 29v10" stroke="#3e5a52"/><circle cx="'+x(i)+'" cy="32" r="3" fill="#345c53"/><text x="'+x(i)+'" y="23" text-anchor="middle" style="font:bold 13px sans-serif">'+(labels[i]||'')+'</text><text x="'+x(i)+'" y="55" text-anchor="middle" style="font:12px sans-serif">'+lastLabel(i)*unit+'</text>').join('');
    const gap=total>6?'<path d="M211 32h19" stroke="white" stroke-width="7"/><path d="M215 36l5-8m1 8 5-8" stroke="#365b55" fill="none"/>':'';
    return '<figure style="margin:.45em 0"><svg viewBox="0 0 266 67" style="width:100%;max-width:465px;display:block" role="img" aria-label="От A отложено '+total+' равных промежутков по '+unit+' сантиметров."><path d="M14 32H257m-7-4 7 4-7 4" fill="none" stroke="#365b55" stroke-width="2"/>'+tags+gap+'</svg><figcaption>Подписаны координаты в сантиметрах. Стрелка продолжает луч.'+(total>6?' Двойная черта означает пропущенные деления.':'')+'</figcaption></figure>';
  }
  function places(digits){
    digits=String(digits);return '<figure style="margin:.45em 0"><div style="display:flex;flex-wrap:nowrap;max-width:420px">'+[...digits].map(d=>'<span style="flex:1;text-align:center;border:1px solid #71978c;padding:.15em">'+d+'</span>').join('')+'</div><figcaption>Одна ячейка — один разряд.</figcaption></figure>';
  }
  function operationFigure(a,k,b){return '<figure style="margin:.45em 0"><strong>'+a+' '+symbols[k]+' '+b+'</strong><figcaption>'+work(a,k,b)+'.</figcaption></figure>';}
  function divisionFigure(row){return '<figure style="margin:.45em 0"><strong>'+[row[0]??'□',' : ',row[1]??'□',' = ',row[2]??'□'].join('')+'</strong><figcaption>Пустой квадрат означает число, которое предстоит выбрать или восстановить.</figcaption></figure>';}
  function draw(task,scene){
    const d=task.data,i=scene?.mode==='learn'?scene.step:0;
    if(d.review35){const n=Math.min(i,19),k=Math.floor(n/5),[a,b]=d.review35.rows[k][n%5];return operationFigure(a,k,b);}
    if(d.markedUnits)return marks(d.markedUnits.unit,4);
    if(d.digitLimits){const w=d.digitLimits.widths[Math.min(1,Math.floor(i/2))];return '<figure style="margin:.45em 0"><div aria-label="'+w+' разрядов">'+Array(w).fill('□').join(' ')+'</div><figcaption>В числе должно быть столько цифр, сколько ячеек.</figcaption></figure>';}
    return divisionFigure(d.divisionRows.rows[Math.min(i,7)]);
  }
  const indexes=(len,first=1)=>Array.from({length:len},(_,i)=>[i,String(i+first)]);
  function explore(lesson,s,t){
    const d=t.data;
    if(d.review35){const [a,b]=d.review35.rows[s.group][s.row];return {title:'Разбери действие на выбранной строке',controls:[{key:'group',title:'Действие',values:symbols.map((op,i)=>[i,op])},{key:'row',title:'Строка',values:indexes(5)}],visual:operationFigure(a,s.group,b),question:'Чему равно выбранное выражение?',answer:op(a,s.group,b),why:work(a,s.group,b)+'.'};}
    if(d.markedUnits){const n=s.count===6?d.markedUnits.count:s.count+1,unit=d.markedUnits.unit;return {title:'Продолжи луч равными шагами',controls:[{key:'count',title:'Отложить промежутков',values:[...indexes(6),[6,String(d.markedUnits.count)]]}],visual:marks(unit,n),question:'На каком расстоянии от A находится последняя отмеченная точка?',answer:n*unit,why:'Длина одного промежутка умножается на число промежутков.'};}
    if(d.digitLimits){const w=d.digitLimits.widths[s.group],previous=Number(String(s.firstDigit)+String(s.otherDigit).repeat(w-1));return {title:'Составь своё число по разрядам',controls:[{key:'group',title:'Число цифр',values:d.digitLimits.widths.map((v,i)=>[i,String(v)])},{key:'firstDigit',title:'Старшая цифра',min:1,max:9,step:1},{key:'otherDigit',title:'Цифра в остальных разрядах',min:0,max:9,step:1}],visual:places(previous),question:'Какое число идёт сразу после показанного?',answer:previous+1,why:'Увеличь показанную запись на единицу.'};}
    const row=d.divisionRows.rows[s.row];
    return {title:'Проверь связь трёх чисел',controls:[{key:'row',title:'Печатный столбец',values:indexes(8)},{key:'divisor',title:'Свой делитель',min:1,max:30,step:1},{key:'quotient',title:'Своё частное',min:0,max:150,step:1}],
      visual:divisionFigure(row)+'<p>Твоё пробное равенство: □ : '+s.divisor+' = '+s.quotient+'. Проверь, согласуются ли выбранные числа с заполненными клетками.</p>',
      question:'Какое делимое подходит к твоим выбранным делителю и частному?',answer:s.divisor*s.quotient,why:'Умножь делитель на частное и сравни результат с заполненными клетками выбранного столбца.'};
  }
  const api={lessons,generators:Object.fromEntries(numbers.map((n,i)=>[n,[generate177,generate178,generate179,generate180][i]])),bounds:{'1.177':{group:[0,3,0],row:[0,4,0]},'1.178':{count:[0,6,3]},'1.179':{group:[0,1,0],firstDigit:[1,9,3],otherDigit:[0,9,2]},'1.180':{row:[0,7,0],divisor:[1,30,1],quotient:[0,150,1]}},custom:q=>q?.answerFormat===cellFormat,accepts:(value,q)=>mistake(value,q)==='',inputIssue,mistake,draw,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5ArithmeticReview35=api;
})(typeof window!=='undefined'?window:globalThis);
