/* Vilenkin, part 1, point 3. Authored practice for the four review tasks on printed page 20. */
(function(root) {
  'use strict';
  const digits = typeof module !== 'undefined' && module.exports ? require('./vilenkin5-printed-digits.js') : root.Vilenkin5PrintedDigits;
  const labels = ['а', 'б', 'в', 'г', 'д', 'е', 'ж'];
  const info = [
    ['1.67','Прочитай шесть чисел вслух','Отдели группы по три цифры справа. Произноси название непустой группы вместе с названием класса. У итоговой группы единиц отдельное название класса вслух не добавляют.',
      ['Для записи 80 306 сначала произнеси «восемьдесят тысяч».','Справа стоит группа 306. Соедини обе части: «восемьдесят тысяч триста шесть».'], 'В числе 80 306 после тысяч надо произнести «ноль десятков».','Как услышать разницу между 80 306 и 83 006?'],
    ['1.68','Собери семь чисел из названий классов','Отметь места миллиардов, миллионов, тысяч и единиц. Разложи по ним сказанные слова. Внутри числа пустое место класса содержит три нуля.',
      ['«Девять миллиардов две тысячи пять» даёт группы 9 | 000 | 002 | 005.','Запиши всё число: 9 000 002 005. Разбей его заново и прочитай для проверки.'], 'В числе «девять миллиардов две тысячи пять» сразу за девяткой можно записать группу тысяч.','Что произойдёт, если убрать три нуля на месте всех миллионов?'],
    ['1.69','Двадцать коротких вычислений','Сначала прочитай знак. Для сложения и вычитания удобно перейти через десяток. Умножение показывает равные группы, а деление находит размер группы или число групп.',
      ['У 15 − 7 отними сначала 5 до числа 10, затем ещё 2. Останется 8.','Для 54 : 6 проверь обратное действие: 6 × 9 = 54.'], 'При делении натурального числа на несколько равных групп в ответ всегда записывают число всех предметов.','Каким обратным действием ты можешь проверить ответ каждой строки?'],
    ['1.70','Два способа сделать сумму удобной','Можно округлить оба слагаемых вверх, сложить их и снять обе прибавки. Другой путь — перенести из второго слагаемого в первое ровно столько единиц, сколько первому не хватает до круглого числа.',
      ['Для 197 + 68 первый путь даёт 200 + 70 − 3 − 2 = 265.','Если перенести тройку из 68 к 197, получается та же сумма: 200 + 65 = 265.'], 'Если перенести единицы из одного слагаемого в другое, сумма увеличится.','Почему нужно вычесть обе добавки, если оба числа округлили вверх?']
,
    ['1.71','Пройди по пяти стрелкам','Цепочку читают слева направо. Результат каждого действия становится началом следующего. После каждой стрелки впиши новое число.',
      ['От числа 20 стрелки «: 4», «+ 7», «× 3» ведут к 5, затем к 12 и 36.','Чтобы проверить последнюю стрелку, раздели 36 на 3. Ты возвращаешься в клетку 12.'], 'Каждая стрелка применяется к одному и тому же первоначальному числу.', 'Как проверить действие стрелки по двум соседним клеткам?']
,
    ['1.72','Какие знания пригодятся в магазине и на площадке?','Придумай для каждого места вопрос, на который помогает ответить математика. Запиши, что именно можно посчитать или измерить и как проверить результат.',
      ['В магазине можно сравнить общую цену двух небольших пачек с ценой одной большой. Для другого примера подойдут скидка, масса или сдача.','На спортивной площадке можно сравнивать длины прыжков, время кругов или суммарное расстояние. Объясни свой выбор.'], 'У открытого вопроса о применении математики существует единственный правильный пример.', 'Какие величины и действия понадобились именно в твоих примерах?']
  ];
  const lessons = info.map(([number,title,explanation,worked,misconception,reflect])=>({
    number,key:'printed-'+number.replace('.','-'),part:1,point:3,page:20,title,explanation,worked,misconception,reflect,
    requires:[number==='1.67'||number==='1.68'?'v5f-place-value':'v5f-natural-add'], related:['v5f-place-value']
  }));
  const printedRead = [241,802,50024,490220,700243,9999999];
  const printedWrite = [22003008,28015302,507080000,1010009000,423340600980,52000008012,777000608000];
  const format = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
  const error = (value,text) => ({value,text});
  const formatStep = (step,kind,prompt,answer,hint,errors=[]) => Object.assign(step(prompt,answer,hint,errors),{answerFormat:kind});
  function readOrWrite(writing,seed,random,step) {
    const source = writing ? printedWrite : printedRead;
    const values = source.map(n => seed ? Number(String(n).replace(/[1-9]/g,()=>random(1,9))) : n);
    const kind = writing ? 'v5-natural' : 'v5-reading';
    const steps = values.map((n,i) => {
      const chunks = format(n).split(' '), compressed = Number(chunks.map(v=>Number(v)).filter(Boolean).join(''));
      const name = writing ? labels[i]+'. ' : (i+1)+'. ';
      const errors = writing ? [error(compressed,'Проверь ширину каждой внутренней группы. Даже маленькое число единиц этого класса занимает три позиции.')].filter(e=>e.value!==n) :
        [error(digits.words(Number(chunks.at(-1))),'Ты прочитал только младшую группу. Начни слева и назови каждую группу вместе с её классом.')].filter(e=>e.value!==digits.words(n));
      return formatStep(step,kind,name+(writing?'Запиши цифрами: '+digits.words(n)+'.':'Прочитай '+format(n)+' и введи услышанное словами.'),
        writing?n:digits.words(n),writing?'Сначала подпиши все классы на черновике. Поставь нули в незанятые разряды.':'Раздели число справа на тройки. Читай с левой группы; группу 000 пропусти.',errors);
    });
    const chosen=seed?random(0,steps.length-1):steps.length-1;
    return {prompt:steps[chosen].prompt+(writing?' В разборе собери все семь чисел.':' В разборе прочитай все шесть чисел.'),
      inputPrompt:writing?'Число цифрами':'Число словами',answer:steps[chosen].answer,answerFormat:kind,steps,errors:steps[chosen].errors,
      data:{values},table:{caption:writing?'Числа для записи':'Числа для чтения',headers:['Строка',writing?'Название':'Запись'],
        rows:values.map((n,i)=>[writing?labels[i]:i+1,writing?digits.words(n):format(n)]),columnWidths:[17,83]},conditionKey:values.join('/')+'-'+chosen};
  }
  const signs=['+','−','×',':'];
  const sourceOps=[[[7,9],[14,8],[28,7],[16,5],[43,0]], [[14,6],[17,9],[13,7],[16,8],[32,0]],
    [[6,7],[9,4],[8,8],[5,9],[9,6]], [[72,9],[48,6],[56,7],[81,9],[40,8]]];
  function setOperations(seed,random,step) {
    const rows=sourceOps.flatMap((group,g)=>group.map(([first,second],i)=>{
      let a=first,b=second;
      if(seed){b=(g<2&&i===4)?0:random(3,9);a=g===3?b*random(3,9):g===2?random(3,9):random(12,34);}
      return {g,a,b,label:labels[g]+(i+1),answer:[a+b,a-b,a*b,a/b][g]};
    }));
    const descriptions=['Сколько предметов в обеих частях вместе?','Сколько останется, если убрать указанную вторую часть?','Сколько точек в нескольких равных рядах?','Сколько точек приходится на каждый из равных рядов?'];
    const hints=['Можно добавить сначала недостающее до десятка, затем остаток.','Раздели вычитаемое на удобные части. Если вычитаешь ноль, количество сохраняется.','Проверь как сумму равных групп.','Проверь найденное число умножением на делитель.'];
    const steps=rows.map(({g,a,b,label,answer})=>{
      const alternate=[a-b,a+b,a+b,a-b][g];
      return formatStep(step,'v5-natural',label+'. Вычисли '+a+' '+signs[g]+' '+b+'.',answer,hints[g],
        alternate!==answer?[error(alternate,'Проверь знак «'+signs[g]+'». '+descriptions[g])]:[]);
    });
    const chosen=seed?random(0,19):19;
    return {prompt:steps[chosen].prompt+' В разборе пройди по пять строк каждого подпункта а–г.',inputPrompt:'Результат',answer:steps[chosen].answer,answerFormat:'v5-natural',steps,errors:steps[chosen].errors,
      data:{operations:rows},table:{caption:'Четыре вида действий',headers:['Строка','Вычисли'],rows:rows.map(r=>[r.label,r.a+' '+signs[r.g]+' '+r.b]),columnWidths:[25,75]},conditionKey:rows.map(r=>r.a+','+r.b).join('/')+'-'+chosen};
  }
  function sums(seed,random,step) {
    const pairs=seed?Array.from({length:3},(_,i)=>[10*random(i?20:3,i?60:9)-random(1,4),10*random(3,i?45:9)-random(1,6)]):[[98,49],[497,445],[338,46]];
    const steps=pairs.map(([a,b],i)=>{
      const upA=Math.ceil(a/10)*10,upB=Math.ceil(b/10)*10;
      return formatStep(step,'v5-natural',labels[i]+'. Найди '+a+' + '+b+' удобным способом.',a+b,
        'Сколько не хватает первому слагаемому до десятка? Добавь столько к первому и вычти столько же из второго.',
        [error(upA+upB,'Это сумма двух округлённых чисел. Найди обе добавки и убери их.'),error(upA+b,'Первое слагаемое выросло. Если переносишь единицы, со второго их надо снять.')]);
    });
    const chosen=seed?random(0,2):2;
    return {prompt:steps[chosen].prompt+' В разборе посчитай все три суммы. В модели можно выбрать каждый из двух способов.',inputPrompt:'Сумма',answer:steps[chosen].answer,answerFormat:'v5-natural',steps,errors:steps[chosen].errors,
      data:{pairs},table:{caption:'Удобное сложение',headers:['Часть','Число 1','Число 2'],rows:pairs.map(([a,b],i)=>[labels[i],a,b]),columnWidths:[32,34,34]},conditionKey:pairs.map(p=>p.join(',')).join('/')+'-'+chosen};
  }
  function chainData(seed, random) {
    if (!seed) return [
      [63, [[':',9], ['+',23], [':',6], ['×',7], ['+',15]]],
      [72, [[':',9], ['+',12], ['×',5], [':',10], ['+',18]]],
      [42, [[':',7], ['×',9], ['+',6], [':',10], ['+',24]]],
      [54, [[':',9], ['×',8], ['+',2], [':',5], ['+',90]]]
    ];
    return labels.slice(0,4).map((_, i) => {
      const q=random(3,9), firstDiv=random(3,9), factor=random(3,9), last=random(8,75), start=q*firstDiv;
      if(i===0){const d=random(4,8), target=random(3,8);return [start,[[':',firstDiv],['+',d*target-q],[':',d],['×',factor],['+',last]]];}
      if(i===1){const even=2*random(7,15);return [start,[[':',firstDiv],['+',even-q],['×',5],[':',10],['+',last]]];}
      const d=i===2?10:5, increment=d-(q*factor)%d;
      return [start,[[':',firstDiv],['×',factor],['+',increment],[':',d],['+',last]]];
    });
  }
  const chainHints={'+':'Прибавь число у стрелки к значению слева.','×':'Умножь число в клетке на указанное число равных групп.',':':'Раздели число слева. Проверь результат умножением на число у стрелки.'};
  function chains(seed, random, step) {
    const entries=chainData(seed,random).map(([start,operations])=>{
      let current=start;
      const route=operations.map(([op,n])=>{
        const before=current;
        current=op==='+'?before+n:op==='×'?before*n:before/n;
        return {op,n,before,after:current};
      });
      return {start,route,result:current};
    });
    const steps=entries.flatMap((entry,row)=>entry.route.map((move,arrow)=>{
      const wrong=move.op===':'?move.before*move.n:move.op==='×'?move.before+move.n:move.before-move.n;
      const errors=[error(wrong,'Проверь знак «'+move.op+'». '+chainHints[move.op])];
      if(arrow&&entry.start!==move.before)errors.push(error(entry.start,'Это первоначальное число. К текущей стрелке ты дошёл с числом '+move.before+'.'));
      const prompt=labels[row]+', стрелка '+(arrow+1)+'. Сейчас '+move.before+'. Куда ведёт «'+move.op+' '+move.n+'»?';
      return formatStep(step,'v5-natural',prompt,move.after,chainHints[move.op],errors.filter(e=>e.value!==move.after));
    }));
    const rows=entries.map((e,i)=>[labels[i],e.start,e.route.map(m=>m.op+' '+m.n).join(' → ')]);
    return {prompt:'Найди конечную клетку в каждой цепочке. Запиши четыре числа через точку с запятой в порядке а, б, в, г.',inputPrompt:'Ответы четырёх цепочек',
      answer:entries.map(e=>e.result),answerFormat:'v5-list',steps,errors:[],data:{chains:entries},
      table:{caption:'От старта к последней клетке',headers:['Ряд','Старт','Стрелки по порядку'],rows,columnWidths:[15,20,65]},conditionKey:JSON.stringify(rows)};
  }
  function exploreChain(state, task, table) {
    const entry=task.data.chains[state.row], current=entry.route[state.arrow];
    const done=entry.route.slice(0,state.arrow).map((move,i)=>[i+1,move.before+' '+move.op+' '+move.n,String(move.after)]);
    const controls=[{key:'row',title:'Цепочка',values:labels.slice(0,4).map((label,i)=>[i,label])},
      {key:'arrow',title:'Стрелка',values:entry.route.map((_,i)=>[i,String(i+1)])}];
    const visual=(done.length?table('Как дошли до выбранной стрелки',['Шаг','Действие','Итог'],done):'<p>Стартовая клетка: <strong>'+entry.start+'</strong>.</p>')+
      '<p>Сейчас в клетке <strong>'+current.before+'</strong>. Следующая стрелка <strong>'+current.op+' '+current.n+'</strong>.</p>';
    return {title:'Перемещайся по цепочке',controls,visual,question:'Какое число окажется сразу за выбранной стрелкой?',answer:current.after,
      why:current.before+' '+current.op+' '+current.n+' = '+current.after+'. Это начало следующего шага, если в цепочке есть ещё одна стрелка.'};
  }

  function everyday(seed,random,step) {
    const price=seed?random(22,66):45,small=seed?random(14,43):35,items=seed?random(2,5):3;
    const cash=seed?Math.ceil((5*price+small)/50)*50+50:400;
    const lap=seed?10*random(7,20):120,laps=seed?random(2,5):4,goal=(seed?random(6,9):6)*lap;
    const cost=price*items+small,distance=lap*laps,change=cash-cost,left=goal-distance;
    const nat=(p,n,h,errs=[])=>formatStep(step,'v5-natural',p,n,h,errs);
    const steps=[
      nat('Для одной из возможных ситуаций в магазине найди стоимость одинаковых товаров. Их '+items+' шт. по '+price+' руб.',price*items,
        'Цена относится к одной штуке. Умножь её на количество.',[error(price+items,'Количество и цену нельзя просто сложить. Покажи столько одинаковых цен, сколько товаров.'),error(price,'Это цена одной штуки. Их в корзине несколько.')]),
      nat('К покупке добавили товар за '+small+' руб. Сколько рублей теперь в чеке?',cost,
        'К стоимости одинаковых товаров прибавь ещё одну указанную цену.',[error(items*price,'Ты учёл одинаковые товары. Добавь цену отдельной покупки.')]),
      nat('За покупку передали '+cash+' руб. Какую сумму должны вернуть?',change,
        'Проверь, какое число вместе со стоимостью даёт деньги, переданные на кассе.',[error(cost,'Это стоимость. Сдача — деньги, которые остаются после оплаты.')]),
      nat('Теперь проверь один пример для площадки. Длина круга '+lap+' м, пройдено кругов — '+laps+'. Сколько метров пройдено?',distance,
        'Каждый полный круг добавляет одинаковую длину. Умножь длину круга на число кругов.',[error(lap+laps,'Одинаковые круги складывают по длине. Счётчик кругов показывает число повторов.')]),
      nat('Запланировано '+goal+' м. Сколько метров осталось до этой цели?',left,'Из цели вычти пройденное расстояние.',[error(distance,'Это уже пройденная часть. Узнай, что осталось до конца.')])
    ];
    return {prefix:seed?'Новые данные для проверки твоих способов. ':'Открытый вопрос учебника с двумя местами для примеров. Числа в приложении авторские. ',
      prompt:'Сколько рублей сдачи будет в этой покупке и сколько метров останется спортсмену? Введи два ответа через точку с запятой.',
      inputPrompt:'Сдача в рублях; остаток в метрах',answer:[change,left],answerFormat:'v5-pair',steps,errors:[
        error([cost,distance],'Ты записал общую стоимость и пройденное расстояние. В обоих вопросах нужен остаток.')],
      data:{everyday:{price,small,items,cash,lap,laps,goal}},table:{caption:'Данные для проверки примеров',headers:['Где','Что известно'],columnWidths:[30,70],
        rows:[['Магазин',items+' шт. по '+price+' руб. и товар за '+small+' руб. Передано '+cash+' руб.'],['Площадка',laps+' полных кругов по '+lap+' м. Цель '+goal+' м.']]},conditionKey:[items,price,small,cash,laps,lap,goal].join('/')};
  }
  function exploreEveryday(state,task,table) {
    const d=task.data.everyday,shop=state.context===0,count=state.count,unit=shop?d.price:d.lap;
    const whole=shop?d.cash:d.goal,fixed=shop?d.small:0,total=unit*count+fixed,amount=state.question===0?total:whole-total;
    const noun=shop?'руб.':'м', labelsHere=shop?['Весь чек','Сдача']:['Пройдено','Осталось'];
    const controls=[{key:'context',title:'Где проверяем',values:[[0,'Магазин'],[1,'Спортивная площадка']]},{key:'count',title:shop?'Штук по одной цене':'Полных кругов',min:0,max:5,step:1},{key:'question',title:'Что ищем',values:labelsHere.map((v,i)=>[i,v])}];
    const list=Array.from({length:count},(_,i)=>[shop?'Покупка '+(i+1):'Круг '+(i+1),unit+' '+noun]);
    if(shop)list.push(['Ещё один товар',fixed+' руб.']);
    const picture=list.length?table(shop?'Разложи чек':'Подсчитай круги',['Часть','Величина'],list):'<p>Старт. Ещё ни одного полного круга.</p>';
    const visual=picture+'<p>'+(shop?'Дано на кассе: ':'Цель по дистанции: ')+whole+' '+noun+'.</p>';
    return {title:'Измени покупку или тренировку',controls,visual,question:shop?(state.question?'Сколько рублей сдачи получится?':'Сколько рублей стоит весь набор?'):(state.question?'Сколько метров останется?':'Сколько метров пройдено?'),answer:amount,
      why:state.question?whole+' − '+total+' = '+amount+' '+noun+'.':count+' × '+unit+(shop?' + '+fixed:'')+' = '+amount+' '+noun+'.'};
  }

  function dots(n,perRow,markFrom,markEnd){
    const rows=Math.ceil(n/perRow);
    const points=Array.from({length:n},(_,i)=>'<circle cx="'+(12+(i%perRow)*15)+'" cy="'+(12+Math.floor(i/perRow)*15)+'" r="4.8" fill="'+(i>=markFrom&&i<markEnd?'#ad440e':'#21685c')+'"/>').join('');
    return '<svg role="img" aria-label="Точки по группам" viewBox="0 0 '+(perRow*15+10)+' '+(rows*15+10)+'" style="width:min(100%,18rem);max-height:13rem">'+points+'</svg>';
  }
  function explore(lesson,state,task,table) {
    const d=task.data;
    if(d.everyday)return exploreEveryday(state,task,table);
    if(d.chains)return exploreChain(state,task,table);
    if(d.values)return digits.explore(lesson,state,task,table);
    if(d.operations){
      const c=d.operations[state.row],{a,b,g}=c;
      const counted=[a+b,a,a*b,a][g],perRow=g===2?b:g===3?a/b:10;
      const picture=dots(counted,perRow,g===0?a:g===1?a-b:0,g<2?counted:perRow);
      const notes=['К первой группе присоединили вторую, отмеченную оранжевым.','Всего было '+a+'. Оранжевые точки убирают.','В каждом горизонтальном ряду одинаковое число точек.','Все точки разложены по '+b+' равным рядам.'];
      return {title:'Собери действие с точками',controls:[{key:'row',title:'Выбери пример',values:d.operations.map((r,i)=>[i,r.label])}],visual:picture+'<p>'+notes[g]+'</p>',
        question:['Сколько точек в обеих частях вместе?','Сколько точек останется после удаления оранжевых?','Сколько точек на всех рядах?','Сколько точек в одном ряду?'][g],answer:c.answer,why:a+' '+signs[g]+' '+b+' = '+c.answer+'.'};
    }
    const [a,b]=d.pairs[state.row],upA=Math.ceil(a/10)*10,upB=Math.ceil(b/10)*10,addA=upA-a,addB=upB-b;
    const transfer=state.method===1;
    return {title:'Проверь компенсацию',controls:[{key:'row',title:'Подпункт',values:labels.slice(0,3).map((v,i)=>[i,v])},{key:'method',title:'Способ',values:[[0,'Округлить оба'],[1,'Перенести единицы']]}],
      visual:table('Как меняются слагаемые',['Слагаемое','Было','Что делаем'],[['Первое',a,'прибавляем '+addA],['Второе',b,(transfer?'вычитаем '+addA:'прибавляем '+addB)]]),
      question:transfer?'Сколько осталось во втором слагаемом после переноса?':'Сколько лишних единиц оказалось в общей сумме?',
      answer:transfer?b-addA:addA+addB,why:transfer?'Первое стало '+upA+', а второе стало '+(b-addA)+'. Их сумма равна прежней.':'Прибавили '+addA+' и '+addB+'. Из суммы округлённых чисел надо убрать '+(addA+addB)+'.'};
  }
  const generators={'1.67':(s,r,t)=>readOrWrite(false,s,r,t),'1.68':(s,r,t)=>readOrWrite(true,s,r,t),'1.69':setOperations,'1.70':sums,'1.71':chains,'1.72':everyday};
  const bounds={'1.67':{row:[0,5,0],place:[0,11,0]},'1.68':{row:[0,6,0],place:[0,11,0]},'1.69':{row:[0,19,0]},'1.70':{row:[0,2,0],method:[0,1,0]},'1.71':{row:[0,3,0],arrow:[0,4,0]},'1.72':{context:[0,1,0],count:[0,5,2],question:[0,1,0]}};
  const api={lessons,generators,bounds,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5PrintedReview=api;
})(typeof window!=='undefined'?window:globalThis);
