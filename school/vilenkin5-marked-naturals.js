/* Авторские рабочие места для печатных №1.171 и №1.172. Часть 1, §6, с. 35. */
(function(root){
  'use strict';
  const interval=(l,h)=>Array.from({length:h-l-1},(_,i)=>l+i+1);
  const grid=(l,h)=>Array.from({length:h-l+1},(_,i)=>l+i);
  const lessons=[
    {number:'1.171',title:'Отметь все подходящие натуральные числа',requires:['v5f-printed-1-169'],
      explanation:'Начни с наименьшего натурального числа 1. Слово «меньше» оставляет саму границу незакрашенной. Если есть нижняя граница, оставь только числа справа от неё.',
      worked:['Если число больше 3 и меньше 6, отмечаем координаты 4 и 5. Левые и правые подписи — это координаты, а не номера делений.'],
      misconception:'Ноль надо отметить, когда верхняя граница больше нуля.',reflect:'Почему первая отметка на луче и первое натуральное число могут различаться?'},
    {number:'1.172',title:'Угадай число по границам и последней цифре',requires:['v5f-printed-1-169'],
      explanation:'Сначала прочитай обе границы. Соседние числа с одинаковой последней цифрой отличаются на десять. Строгая граница не входит в промежуток, даже если имеет нужную последнюю цифру.',
      worked:['Ищем число больше 81, меньше 96, с цифрой 7 на конце. Ближайшие кандидаты 77, 87, 97. Подходит только 87.'],
      misconception:'Достаточно найти нужную цифру в любом разряде.',reflect:'Как доказать, что другого числа с такой последней цифрой внутри нет?'}
  ].map(lesson=>({...lesson,part:1,page:35,point:6,key:'printed-'+lesson.number.replace('.','-'),related:['v5f-printed-1-169']}));
  function generate171(seed,r,step){
    const h=seed?r(4,8):7,l2=seed?r(6,18):9,h2=l2+(seed?r(3,7):6);
    const intervals=[[0,h],[l2,h2]];
    const steps=intervals.map(([l,h],i)=>{
      const inside=interval(l,h);
      const condition=i?'больше '+l+' и меньше '+h:'меньше '+h;
      return {...step((i?'б. ':'а. ')+'Отметь на прямой все натуральные числа, которые '+condition+'. Перенеси свои метки в ответ или перечисли координаты.',inside.join(', '),'Иди по единичным делениям. Исключи концы и помни, что натуральный ряд начинается с единицы.',[]),
        answerFormat:'v5-between-set',markLine:true,boundaries:[l,h],inside,inputPrompt:'Координаты отмеченных точек'};
    });
    return {steps,answer:steps[0].inside.length+steps[1].inside.length,prompt:'Сколько всего меток получилось на двух прямых вместе?',inputPrompt:'Число меток',
      why:'Подсчитай каждую отмеченную точку в своём подпункте.',errors:[],conditionKey:'1.171/'+intervals.flat().join(':'),data:{naturalLine:{intervals}},
      table:{caption:'Условия для двух прямых',headers:['Пункт','Какие числа отметить'],rows:[['а','Натуральные меньше '+h],['б','Натуральные больше '+l2+' и меньше '+h2]],columnWidths:[20,80]}};
  }
  function generate172(seed,r,step){
    const picked=seed?r(12,78)*10+r(0,9):365,digit=picked%10,l=picked-(seed?r(4,10):10),h=picked+(seed?r(3,9):5);
    const steps=[step('Какая цифра должна стоять в разряде единиц?',digit,'Последняя цифра — это цифра единиц. Прочитай подсказку об окончании числа.'),
      step('Назови наибольшее число с последней цифрой '+digit+', которое не больше нижней границы '+l+'.',picked-10,'Проверь последнюю цифру самой границы и ближайшие числа слева от неё.'),
      step('Назови наименьшее число с последней цифрой '+digit+', которое не меньше верхней границы '+h+'.',picked+10,'Проверь последнюю цифру верхней границы и ближайшие числа справа от неё.')];
    return {steps,answer:picked,prompt:'Задумано натуральное число строго больше '+l+' и строго меньше '+h+'. Его последняя цифра '+digit+'. Найди число.',inputPrompt:'Задуманное число',
      why:'Проверь обе границы и цифру единиц, затем исключи соседние числа с той же последней цифрой.',
      errors:[{value:l,text:'Нижняя граница исключена словом «больше». Проверь число справа от неё.'},{value:h,text:'Верхняя граница исключена словом «меньше». Ищи левее.'},...([picked-10,picked+10].filter(x=>x!==l&&x!==h).map(value=>({value,text:'Цифра единиц подходит, но это число лежит за границами промежутка.'})))],
      conditionKey:'1.172/'+[l,h,digit].join(':'),data:{naturalMystery:{l,h,digit}},table:{caption:'Три условия',headers:['Признак','Значение'],rows:[['Больше',l],['Меньше',h],['Цифра единиц',digit]],columnWidths:[63,37]}};
  }
  function marks(interval,mask){
    return grid(...interval).filter((_,i)=>Boolean(mask&(1<<i)));
  }
  function markedRay(interval,positions){
    const [l,h]=interval,span=h-l,x=n=>18+(n-l)*260/span;
    const ticks=grid(l,h).map(n=>'<path d="M'+x(n)+' 29v10" stroke="#44544d"/><text x="'+x(n)+'" y="54" text-anchor="middle" style="font:14px sans-serif">'+n+'</text>'+
      (positions.includes(n)?'<circle cx="'+x(n)+'" cy="30" r="5" fill="#146958" stroke="#133f37"/>':'')).join('');
    return '<figure style="margin:.5em 0"><svg viewBox="0 0 302 62" style="width:100%;max-width:510px;display:block" role="img" aria-label="Координаты от '+l+' до '+h+'. Отмечены: '+(positions.join(', ')||'пока ни одной')+'."><path d="M10 32h282m-7-5 7 5-7 5" fill="none" stroke="#3c5048" stroke-width="2"/>'+ticks+'</svg></figure>';
  }
  function draw(task,scene){
    if(task.data.naturalLine){const row=scene?.mode==='learn'?Math.min(scene.step,1):0;return markedRay(task.data.naturalLine.intervals[row],[]);}
    const {l,h}=task.data.naturalMystery;return '<figure style="margin:.4em 0"><div style="border-left:3px dashed #759184;border-right:3px dashed #759184;display:flex;justify-content:space-between;padding:.4em .6em"><span>'+l+'</span><span>?</span><span>'+h+'</span></div><figcaption>Обе границы открыты. Неизвестное число находится внутри.</figcaption></figure>';
  }
  function explore(lesson,s,task){
    if(task.data.naturalLine){
      const interval=task.data.naturalLine.intervals[s.row],mask=s.row?s.marksB:s.marksA,selected=marks(interval,mask);
      const buttons=grid(...interval).map((n,i)=>'<button type="button" data-v5-coordinate-bit="'+i+'" aria-pressed="'+selected.includes(n)+'" aria-label="Координата '+n+'" style="min-width:42px;min-height:42px;margin:.15em;padding:.3em">'+n+'</button>').join('');
      return {title:'Поставь и сними точки на прямой',controls:[{key:'row',title:'Прямая для подпункта',values:[[0,'а'],[1,'б']]}],visual:markedRay(interval,selected)+'<p>Выбери нужные координаты. Повторное нажатие снимает точку.</p><div>'+buttons+'</div><p aria-live="polite">Твои метки: '+(selected.join(', ')||'пока нет')+'.</p><button type="button" data-v5-fill-marks hidden>Перенести метки в поле ответа</button>',
        question:'Сколько точек ты сейчас отметил на выбранной прямой?',answer:selected.length,why:'Считай только выделенные точки. Выбор метки сам по себе не проверяет, выполняется ли условие.'};
    }
    const {l,h}=task.data.naturalMystery,from=Math.max(0,Math.floor(l/10)-1),to=Math.floor(h/10)+1;
    const values=grid(from,to).map(n=>[n-from,String(n*10)+'–'+(n*10+9)]),block=from+Math.min(s.block,values.length-1),candidate=block*10+s.digit;
    const table='<figure style="margin:.45em 0"><strong>'+candidate+'</strong><p>Десятков: '+block+'. Единиц: '+s.digit+'.</p><figcaption>Сравни собранное число с обеими границами.</figcaption></figure>';
    return {title:'Собери число по десяткам и единицам',controls:[{key:'block',title:'Десяток',values},{key:'digit',title:'Цифра единиц',values:grid(0,9).map(d=>[d,String(d)])}],visual:table,
      question:'На сколько собранное число отличается от нижней границы? Запиши расстояние между числами.',answer:Math.abs(candidate-l),why:'Вычти меньшее из большего. Затем проверь, с какой стороны от нижней границы находится выбранное число.'};
  }
  function bindMarks(host,options,s,replace){
    if(!options.task?.data.naturalLine)return;
    host.querySelectorAll('[data-v5-coordinate-bit]').forEach(button=>button.onclick=()=>{
      const i=Number(button.dataset.v5CoordinateBit),key=s.row?'marksB':'marksA';
      replace({...s,[key]:s[key]^(1<<i),prediction:'',first:'',notice:'',seen:false},'[data-v5-coordinate-bit="'+i+'"]');
    });
    const fill=host.querySelector('[data-v5-fill-marks]');
    if(fill&&options.markRow===s.row){fill.hidden=false;fill.onclick=()=>options.setMarkedCoordinates?.(marks(options.task.data.naturalLine.intervals[s.row],s.row?s.marksB:s.marksA).join(', '));}
  }
  const bounds={'1.171':{row:[0,1,0],marksA:[0,511,0],marksB:[0,255,0]},'1.172':{block:[0,5,0],digit:[0,9,0]}};
  const api={lessons,generators:{'1.171':generate171,'1.172':generate172},bounds,draw,explore,bindMarks,marks};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5MarkedNaturals=api;
})(typeof window!=='undefined'?window:globalThis);
