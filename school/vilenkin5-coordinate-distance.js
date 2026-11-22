/* Vilenkin, volume 1, page 30. Distances and directed moves are different operations. */
(function(root){
  'use strict';
  const entries=[
    ['1.138','Отметь точку на заданном расстоянии','Расстояние говорит, сколько шагов нужно пройти. Если направление не задано, проверь обе стороны от M. Ноль служит ориентиром и не обрывает прямую.','От точки 6 до точек 2 и 10 четыре единичных отрезка. При движении на восемь шагов влево окажешься на два деления левее нуля.'],
    ['1.139','Прочитай направление двух стрелок','Хвост стрелки задаёт старт, наконечник — конец. Направление вправо увеличивает координату. При движении влево координата уменьшается.','Стрелка вправо на 5 от 31 закончится на 36, а стрелка влево на 5 от 31 — на 26.'],
    ['1.140','Построй две пары точек вокруг K','Сначала расставь названные точки по координатам. Для каждого заданного расстояния от K отложи столько же единичных отрезков в обе стороны.','Если K находится у 10, точки на расстоянии четырёх шагов от K имеют координаты 6 и 14. Расстояние между самими точками равно восьми.']
  ];
  const lessons=entries.map(([number,title,explanation,example])=>({number,title,explanation,worked:[example],key:'printed-'+number.replace('.','-'),part:1,point:5,page:30,misconception:'При фиксированном расстоянии от точки можно двигаться только вправо.',reflect:'Как проверить расстояние между построенной точкой и исходной, не меняя направление оси?',requires:['v5f-printed-1-136'],related:['v5f-printed-1-137']}));
  const err=(value,text)=>({value,text});
  const list=(step,prompt,answer,why,errors=[])=>({...step(prompt,answer,why,errors),answerFormat:'v5-list'});
  function fromM(seed,random,step){
    const m=seed?random(4,9):4,far=seed?m+random(1,4):5,near=seed?random(1,m-1):3;
    const rows=[{label:'а',start:m,delta:far},{label:'б',start:m,delta:near}];
    const steps=[
      step('а. От M('+m+') отсчитай '+far+' единиц вправо. Какую координату получишь?',m+far,'При движении вправо координата возрастает на каждый шаг.',[err(far,'Это длина пути. Чтобы получить координату, прибавь путь к координате M.')]),
      step('а. Теперь отсчитай от M те же '+far+' единиц влево. На сколько делений новая точка оказывается левее нуля?',far-m,'Первые '+m+' шагов ведут от M до нуля. Остаток пути проходит слева от нуля.',[err(m+far,'Ты считал вправо. От исходной позиции до нуля требуется '+m+' шагов. Вопрос о шагах после нуля.')]),
      list(step,'б. От M('+m+') отмерь по '+near+' единицы в обе стороны. Запиши сначала левую, затем правую координату.',[m-near,m+near],'В левую сторону вычти расстояние, в правую прибавь.',[err([m+near,m-near],'Положения найдены. Начни с точки, которая левее M.')])
    ];
    return {prefix:'Отметь M('+m+') и протяни прямую в обе стороны. ',prompt:'Посмотри на построения б. Сколько единиц от левой построенной точки до правой, если каждая удалена от M на '+near+'?',answer:2*near,inputPrompt:'Расстояние в единичных отрезках',steps,errors:[err(near,'Это путь от M лишь до одной точки. Между двумя построенными точками лежат две такие части.')],conditionKey:[m,far,near].join('/'),data:{directedSteps:{rows}},table:{caption:'Расстояния от точки M',headers:['Построение','Сколько единиц'],rows:rows.map(q=>[q.label,String(q.delta)])}};
  }
  function arrows(seed,random,step){
    const rows=[{label:'а',start:seed?random(39,98):57,delta:seed?random(3,9):8},{label:'б',start:seed?random(221,934):873,delta:-(seed?random(2,11):6)}];
    const steps=rows.map(r=>step(r.label+'. Начало стрелки у '+r.start+'. Пройди '+Math.abs(r.delta)+' единиц '+(r.delta>0?'вправо':'влево')+'. Чему равна отметка под наконечником?',r.start+r.delta,'Знак изменения задаёт направление от хвоста к наконечнику.',[err(r.start-r.delta,'Получена отметка при движении в обратную сторону. Найди на рисунке наконечник стрелки.'),err(Math.abs(r.delta),'Это длина стрелки. Отсчитай столько шагов от стартового числа.')]));
    return {prefix:'На двух коротких окнах прямой показаны разные начала отсчёта пути. ',prompt:'Внеси координаты концов стрелок а и б в порядке рисунков.',answer:rows.map(r=>r.start+r.delta),answerFormat:'v5-list',inputPrompt:'Две координаты через точку с запятой',steps,errors:[err(rows.map(r=>r.start-r.delta),'Стрелки указывают направление хода, а не обратного отсчёта. Начни от уже известного числа.')],conditionKey:rows.map(r=>r.start+'/'+r.delta).join(':'),data:{directedSteps:{rows,arrows:true}},table:{caption:'Известные начала и перемещения',headers:['Рисунок','Начало и ход'],rows:rows.map(r=>[r.label,r.start+' · '+(r.delta>0?'+':'−')+Math.abs(r.delta)])}};
  }
  function fromK(seed,random,step){
    const k=seed?random(9,15):9,small=seed?random(2,4):3,big=seed?random(5,k-1):7;
    const labelled=[['M',seed?random(3,5):4],['O',0],['K',k],['E',1],['N',seed?k+random(1,4):11]],rows=[{label:'Ближе',start:k,delta:small},{label:'Дальше',start:k,delta:big}];
    const ordered=[...labelled].sort((a,b)=>a[1]-b[1]),steps=[
      list(step,'Нанеси на ось '+labelled.map(([n,v])=>n+'('+v+')').join(', ')+'. Впиши пять координат в порядке точек слева направо.',ordered.map(p=>p[1]),'На оси меньшая координата находится левее большей.',[err(labelled.map(p=>p[1]),'Это координаты в порядке записанных букв. Сравни положения на оси и начни от O.')]),
      ...rows.map(r=>list(step,'От K('+k+') отметь две точки на расстоянии '+r.delta+'. Каковы координаты слева и справа от K?',[k-r.delta,k+r.delta],'Отсчёт ведётся от K в двух направлениях.',[err([r.delta,k+r.delta],'Первая координата задаёт положение относительно нуля. Вычти расстояние из координаты K.'),err([k+r.delta,k-r.delta],'Начни с левой точки и закончи правой.')]))
    ];
    return {prefix:'Отметь точки на одной прямой. ',prompt:'Выпиши слева направо все четыре координаты точек, находящихся в '+small+' или '+big+' единицах от K('+k+').',answer:[k-big,k-small,k+small,k+big],answerFormat:'v5-list',inputPrompt:'Четыре координаты по возрастанию',steps,errors:[err([k-small,k+small,k-big,k+big],'Обе пары найдены. Расположи все четыре отметки в одном ряду, начиная с самой левой.')],conditionKey:[k,small,big,...labelled.map(p=>p[1])].join('/'),data:{directedSteps:{rows,labelled}},table:{caption:'Точки, с которых начинается построение',headers:['Точка','Координата'],rows:labelled.map(([n,v])=>[n,String(v)])}};
  }
  function select(task,state={}){
    const d=task.data.directedSteps,r=d.rows[state.row||0],sign=d.arrows?Math.sign(r.delta):state.side===0?-1:1,finish=r.start+sign*Math.abs(r.delta);
    const controls=[{key:'row',title:'Построение',values:d.rows.map((q,i)=>[i,q.label])}];
    if(!d.arrows)controls.push({key:'side',title:'Двигайся',values:[[0,'Влево'],[1,'Вправо']]});
    return {r,finish,controls};
  }
  function diagram(task,state){
    const {r,finish}=select(task,state),dist=Math.abs(r.delta),lo=Math.min(r.start,finish)-1,hi=Math.max(r.start,finish)+1;
    const x=v=>20+235*(v-lo)/(hi-lo),ticks=Array.from({length:hi-lo+1},(_,i)=>'<path d="M'+x(i+lo)+' 49v7" stroke="#416755"/>').join(''),a=x(r.start),b=x(finish),arrow=b>a?1:-1;
    return '<svg role="img" viewBox="0 0 278 92" aria-label="От '+r.start+' пройди '+dist+' единиц '+(arrow>0?'вправо':'влево')+'"><path d="M9 49h255m-6-4 6 4-6 4" fill="none" stroke="#214d56" stroke-width="2"/>'+ticks+'<path d="M'+a+' 44 Q'+((a+b)/2)+' 6 '+b+' 42 l'+(-arrow*8)+' -2 m'+(arrow*8)+' 2 l'+(-arrow*2)+' -8" fill="none" stroke="#b23c37" stroke-width="2.4"/><circle cx="'+a+'" cy="49" r="3" fill="#155739"/><text x="'+a+'" y="77" text-anchor="middle" style="font:16px sans-serif">'+r.start+'</text><text x="'+b+'" y="77" text-anchor="middle" style="font:16px sans-serif">?</text><text x="'+((a+b)/2)+'" y="18" text-anchor="middle" style="font:16px sans-serif">'+(arrow>0?'+':'−')+dist+'</text></svg>';
  }
  function taskDiagram(task){
    const data=task.data.directedSteps;
    if(data.arrows)return data.rows.map((r,row)=>'<figure><figcaption>Стрелка '+r.label+'</figcaption>'+diagram(task,{row})+'</figure>').join('');
    if(!data.labelled)return diagram(task,{row:0,side:1});
    const sorted=[...data.labelled].sort((a,b)=>a[1]-b[1]),max=sorted.at(-1)[1]+1;
    const x=v=>18+236*v/max;
    const ticks=Array.from({length:max+1},(_,i)=>'<path d="M'+x(i)+' 48v5" stroke="#416755"/>').join('');
    const points=sorted.map(([name,value],i)=>'<circle cx="'+x(value)+'" cy="48" r="3" fill="#8d3c34"/><text x="'+x(value)+'" y="'+(i%2?73:32)+'" text-anchor="middle" style="font:15px sans-serif">'+name+'</text>').join('');
    return '<svg viewBox="0 0 278 84" role="img" aria-label="Именованные точки на прямой слева направо: '+sorted.map(([n,v])=>n+' у '+v).join(', ')+'"><path d="M9 48h254m-6-4 6 4-6 4" fill="none" stroke="#214d56" stroke-width="2"/>'+ticks+points+'</svg>';
  }
  function explore(l,s,t){
    const {r,finish,controls}=select(t,s);
    return {title:'Проследи путь от начала стрелки',controls,visual:diagram(t,s),question:'На какой координате остановится стрелка? Слева от нуля перед числом ставь минус.',answer:finish,why:'Начни у '+r.start+'. Каждый шаг направо увеличивает координату на единицу, каждый шаг налево уменьшает на единицу.'};
  }
  const generators={'1.138':fromM,'1.139':arrows,'1.140':fromK},bounds={'1.138':{row:[0,1,0],side:[0,1,1]},'1.139':{row:[0,1,0]},'1.140':{row:[0,1,0],side:[0,1,1]}};
  const api={lessons,generators,bounds,diagram,taskDiagram,explore};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5CoordinateDistance=api;
})(typeof window!=='undefined'?window:globalThis);
