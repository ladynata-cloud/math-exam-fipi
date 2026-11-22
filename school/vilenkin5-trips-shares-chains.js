/* Page 30, Vilenkin 5, 2023, first volume. Independent original lessons. */
(function(root){
  'use strict';
  const letters='абвгде',err=(value,text)=>({value,text});
  const descriptions=[
    ['1.143','Сравни время двух поездок одинаковой длины','На одном маршруте время зависит от скорости. Чтобы узнать минуты, раздели метры на метры в минуту. Только после этого сравни две длительности.','На расстояние 600 м при 200 м/мин нужно 3 минуты. При 150 м/мин та же дорога занимает 4 минуты. Обратная дорога при меньшей скорости длиннее по времени на минуту.'],
    ['1.144','Отмерь долю километра','Переведи целый километр в метры и раздели 1000 на число равных частей. Чем больше частей в одном километре, тем меньше длина каждой части.','Разметим километр на восемь равных участков. Один занимает 125 м, ведь 8 × 125 = 1000.'],
    ['1.145','Пройди цепочки действий до последнего окошка','Каждая стрелка переводит число в следующее окошко. Начинай новое действие с числа, которое только что записал. Если получился ноль, сохрани его в цепочке.','Для начала 12 и стрелок «прибавь 8, раздели на 4» сначала получим 20, затем 5.']
  ];
  const lessons=descriptions.map(([number,title,explanation,example])=>({number,title,explanation,worked:[example],key:'printed-'+number.replace('.','-'),part:1,point:5,page:30,misconception:{'1.143':'Большая скорость на одном и том же пути даёт большее время.','1.144':'Чем больше равных частей у километра, тем длиннее одна часть.','1.145':'Каждую стрелку нужно применять к самому первому числу в цепочке.'}[number],reflect:'Как проверить свой ответ обратным действием?',requires:[number==='1.143'?'v5f-printed-1-141':'v5f-printed-1-142'],related:['v5f-printed-1-141']}));
  function route(seed,r,kind){
    if(!seed)return kind?{actor:'Заяц',destination:'поля с капустой',length:3120,first:260,back:240,ask:'меньше'}:{actor:'Пчела',destination:'поля с гречихой',length:2000,first:500,back:400,ask:'больше'};
    const short=r(3,9),long=short+r(1,4),a=(seed+kind)%2?short:long,b=a===short?long:short,unit=r(5,25);
    return {actor:kind?'Заяц':'Пчела',destination:kind?'лужайки':'цветника',length:a*b*unit,first:b*unit,back:a*unit,ask:kind?'меньше':'больше'};
  }
  function compare(seed,r,step){
    const trips=[route(seed,r,0),route(seed,r,1)],steps=[],result=[];
    for(const [i,t] of trips.entries()){
      const go=t.length/t.first,back=t.length/t.back,choice=(t.ask==='больше'?go>back:go<back)?1:2,gap=Math.abs(go-back),prefix=(i+1)+'. '+t.actor+' и две дороги по '+t.length+' м. ';
      steps.push({...step(prefix+'Скорости туда и обратно указаны в таблице. Запиши длительности туда и обратно через точку с запятой.',[go,back],'Длина каждого пути одинакова. Время в минутах равно длине, разделённой на соответствующую скорость.',[err([back,go],'Длительности вычислены, но сначала нужна дорога туда. Сверь заголовки столбцов.')]),answerFormat:'v5-pair'});
      steps.push({...step(prefix+'Какая дорога заняла '+t.ask+' времени и на сколько минут? Введи 1 для пути туда или 2 для обратного, затем разность минут.',[choice,gap],'Сравни время, затем из большего вычти меньшее.',[err([3-choice,gap],'Разница минут верна. Вопрос этого сюжета: какая дорога заняла '+t.ask+' времени?')]),answerFormat:'v5-pair'});result.push(choice,gap);
    }
    return {prefix:'Скорость в таблице дана в метрах за минуту. Коды дорог: 1 — туда, 2 — обратно. ',prompt:'Для пчелы укажи более долгую дорогу и разность минут. Для зайца укажи более быструю по времени дорогу и разность минут. Запиши четыре числа по порядку.',answer:result,answerFormat:'v5-list',inputPrompt:'Дорога пчелы; разность; дорога зайца; разность',steps,errors:[],conditionKey:trips.map(t=>[t.length,t.first,t.back].join('/')).join(':'),data:{timedTrips:trips},table:{caption:'Одинаковая длина пути туда и обратно',headers:['Путь','Скорость туда и обратно'],rows:trips.map(t=>[t.actor+' до '+t.destination+' · '+t.length+' м',t.first+' и '+t.back+' м/мин'])}};
  }
  function shares(seed,r,step){
    const base=[4,5,10,25,20,50],pool=[2,4,5,8,10,20,25,40,50,100],den=seed?Array.from({length:6},()=>pool.splice(r(0,pool.length-1),1)[0]):base;
    const answers=den.map(d=>1000/d),steps=den.map((d,i)=>step(letters[i]+'. Сколько метров в одной из '+d+' равных частей километра?',1000/d,'Один километр содержит тысячу метров. Найди длину одной равной части делением.',[err(d,'Это число участков. Нужна длина одного из них в метрах.'),err(1000*d,'После деления на равные части один участок короче всего километра. Раздели, а не умножай.')]));
    return {prefix:'Целое для каждого подпункта — один километр. ',prompt:'Для долей '+den.map(d=>'1/'+d).join(', ')+' выпиши по порядку длины одной части в метрах.',inputPrompt:'Шесть длин в метрах',answer:answers,answerFormat:'v5-list',steps,errors:[],conditionKey:den.join('/'),data:{kilometreShares:den},table:{caption:'Доли одной и той же длины',headers:['Пункт','Какая доля'],rows:den.map((d,i)=>[letters[i],'1/'+d])}};
  }
  const original=[[20,[['×',5],['−',60],['÷',8],['+',25],['×',3]]],[25,[['×',4],['÷',20],['×',9],['−',15],['÷',6]]],[70,[['+',30],['÷',5],['−',20],['×',5]]],[90,[['−',70],['×',5],['÷',25],['+',26]]]];
  function newChains(r){
    const first=r(5,10)*4,second=r(2,6)*5,third=r(8,19),fourth=r(3,9);
    return [[first,[['×',5],['−',first],['÷',4],['+',r(6,17)],['×',r(2,4)]]],
      [second,[['×',4],['÷',20],['×',12],['−',6],['÷',6]]],
      [third*4,[['+',third],['÷',5],['−',third],['×',r(3,8)]]],
      [fourth*12,[['−',fourth*7],['×',5],['÷',25],['+',r(11,29)]]]];
  }
  const calc=(a,op,b)=>op==='×'?a*b:op==='÷'?a/b:op==='+'?a+b:a-b;
  function values(row){let last=row[0];return row[1].map(([op,n])=>{const start=last;last=calc(start,op,n);return {start,op,n,answer:last};});}
  function chains(seed,r,step){
    const data=seed?newChains(r):original,steps=[],answers=[];
    for(const [i,chain] of data.entries()){
      const rows=values(chain);
      for(const [j,row] of rows.entries()){
        const errors=[];
        if(j&&row.start!==chain[0])errors.push(err(calc(chain[0],row.op,row.n),'Ты снова взял самое первое число. Начало этой стрелки — результат предыдущего окошка.'));
        if(row.op==='×'&&row.start===0)errors.push(err(row.n,'Любое число групп по нулю предметов даёт ноль.'));
        steps.push(step('Цепочка '+letters[i]+', стрелка '+(j+1)+'. Было '+row.start+'. Выполни '+row.op+' '+row.n+'. Какое число вписать следом?',row.answer,'Эта стрелка задаёт действие '+row.start+' '+row.op+' '+row.n+'. Переходи к следующей только с полученным числом.',errors.filter(e=>Number.isInteger(e.value)&&e.value!==row.answer)));
      }answers.push(rows.at(-1).answer);
    }
    return {prefix:'Каждая цепочка начинается со своего числа. ',prompt:'Запиши числа из четырёх последних окошек для цепочек а, б, в, г.',inputPrompt:'Четыре конечных результата',answer:answers,answerFormat:'v5-list',steps,errors:[],conditionKey:data.map(([a,v])=>a+':'+v.map(x=>x.join('')).join('/')).join('|'),data:{sequenceBoxes:data},table:{caption:'Начала и стрелки четырёх цепочек',headers:['Цепочка','Начало и последующие действия'],rows:data.map(([a,v],i)=>[letters[i],a+' → '+v.map(x=>x.join(' ')).join(' → ')])}};
  }
  function tripsModel(t,s){
    const x=t.data.timedTrips[s.route],speed=s.way?x.back:x.first;
    return {title:'Сравни время на одном пути',controls:[{key:'route',title:'Кто в пути',values:t.data.timedTrips.map((a,i)=>[i,a.actor])},{key:'way',title:'Направление',values:[[0,'Туда'],[1,'Обратно']]}],visual:'<svg role="img" viewBox="0 0 256 75" aria-label="Дорога '+x.length+' метров"><path d="M16 37h219" stroke="#486a5f" stroke-width="4"/><circle cx="17" cy="37" r="5" fill="#9e481b"/><circle cx="235" cy="37" r="5" fill="#9e481b"/><text x="126" y="23" text-anchor="middle" style="font:16px sans-serif">'+x.length+' м</text><text x="125" y="64" text-anchor="middle" style="font:15px sans-serif">'+speed+' м/мин '+(s.way?'←':'→')+'</text></svg>',question:'Сколько минут займёт выбранная дорога?',answer:x.length/speed,why:'Узнай, сколько участков по '+speed+' м помещается в '+x.length+' м. Один такой участок проходится за минуту.'};
  }
  function sharesModel(t,s){
    const parts=t.data.kilometreShares[s.row],width=214/parts;
    const ticks=Array.from({length:parts-1},(_,i)=>'<path d="M'+(14+(i+1)*width)+' 30v16" stroke="#637a70" stroke-width=".7"/>').join('');
    return {title:'Раздели километровую ленту',controls:[{key:'row',title:'Доля километра',values:t.data.kilometreShares.map((n,i)=>[i,'1/'+n])}],visual:'<svg viewBox="0 0 246 66" role="img" aria-label="Один участок из '+parts+' равных участков"><text x="14" y="17" style="font:15px sans-serif">Вся лента — 1000 м</text><rect x="14" y="30" width="214" height="16" fill="#e8efe9" stroke="#466658"/><rect x="14" y="30" width="'+width+'" height="16" fill="#28745c"/>'+ticks+'</svg>',question:'Какова длина выделенного участка в метрах?',answer:1000/parts,why:'Длина всех '+parts+' одинаковых участков вместе составляет 1000 м.'};
  }
  function explore(l,s,t,table){
    if(t.data.timedTrips)return tripsModel(t,s);if(t.data.kilometreShares)return sharesModel(t,s);
    const moves=t.data.sequenceBoxes.flatMap((chain,index)=>values(chain).map((item,j)=>({item,label:letters[index]+' · стрелка '+(j+1)}))),q=moves[s.move].item;
    return {title:'Выполни выделенный переход',controls:[{key:'move',title:'Цепочка и стрелка',values:moves.map((m,i)=>[i,m.label])}],visual:table('Начало выбранной стрелки',['Окошко','Действие'],[[q.start,q.op+' '+q.n]]),question:'Чем заполнить следующее окошко?',answer:q.answer,why:'Сочетай начало именно этой стрелки с действием на ней: '+q.start+' '+q.op+' '+q.n+'.'};
  }
  const generators={'1.143':compare,'1.144':shares,'1.145':chains},bounds={'1.143':{route:[0,1,0],way:[0,1,0]},'1.144':{row:[0,5,0]},'1.145':{move:[0,17,0]}};
  const api={lessons,generators,bounds,explore};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5TripsSharesChains=api;
})(typeof window!=='undefined'?window:globalThis);
