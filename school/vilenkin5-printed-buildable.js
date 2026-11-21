/* Draw and measure personal polylines; Vilenkin 5, part 1, point 3, page 19. */
(function(root){
  'use strict';
  const closedLayout=[[7,27],[20,9],[44,6],[67,14],[76,33],[50,47],[23,46]];
  const openLayout=[[5,27],[18,9],[33,24],[48,7],[64,25],[79,9],[96,25]];
  const offsets=[[0,0],[-2,0],[2,0],[0,-2],[0,2]];
  const options=['Центр своей клетки','Левее на 2 мм','Правее на 2 мм','Выше на 2 мм','Ниже на 2 мм'];
  const info=[
    ['1.56','Построй замкнутую и открытую ломаные','Для замкнутой ломаной последнее звено возвращается к первой вершине. У открытой ломаной такого звена нет. Измеряй отдельные звенья последовательно в одних единицах и сложи результаты.',['Открытая ломаная KLMN состоит из KL, LM и MN. Если измерения дали 15, 9 и 14 мм, её длина — 38 мм.','Если к ней добавить NK, получится замкнутая ломаная. Добавленное звено тоже нужно измерить.'],'У открытой ломаной столько же звеньев, сколько названных вершин.'],
    ['1.57','Измерь соседние участки и составь равенство','Когда K между A и L, весь путь AL состоит из двух соседних отрезков AK и KL. Их сумма равна AL независимо от того, какой участок длиннее.',['Если AK = 18 мм, KL = 27 мм, то AK короче KL, а AL = 45 мм.','Если выбрать оба участка по 20 мм, они равны и AL = 40 мм. Порядок точек остаётся A, K, L.'],'При K между A и L отрезок AK обязательно меньше KL.'],
    ['1.58','Назови вершины и стороны пятиугольника','Отмечай вершины по порядку обхода границы. Каждая сторона соединяет соседнюю пару. В конце обхода не забудь участок от последней вершины до первой.',['У границы треугольника U, V, W при обходе встречаются стороны UV, VW и WU.','Отрезок между двумя несоседними вершинами пятиугольника может быть диагональю, но не становится стороной.'],'При записи сторон многоугольника можно соединить любую пару его вершин.'],
    ['1.59','Собери замкнутую ломаную из семи звеньев','Пройди через все указанные вершины по очереди и вернись из последней в первую. Запиши результат для каждого звена. Только после этого складывай измерения.',['Четырёхзвенная замкнутая ломаная KLMN включает KL, LM, MN и NK.','Если длины равны 8, 14, 10 и 19 мм, общий результат — 51 мм. Пропуск NK дал бы только 32 мм.'],'Чтобы измерить всю замкнутую ломаную, достаточно дойти до последней буквы и остановиться.']
  ];
  const lessons=info.map(([number,title,explanation,worked,misconception])=>({number,key:'printed-'+number.replace('.','-'),title,part:1,point:3,page:19,explanation,worked,misconception,reflect:'Как другой ученик сможет проверить результат по твоему чертежу?',requires:['v5f-broken-length'],related:['v5f-segment-length']}));
  const stepN=(s,p,a,h,errors=[])=>Object.assign(s(p,a,h,errors),{answerFormat:'v5-natural'});
  const P=5**7;
  function readSeed(seed,r){
    if(seed===0)return Array(7).fill(0);
    if(seed>=100000&&seed<100000+P)return Array.from({length:7},(_,i)=>Math.floor((seed-100000)/5**i)%5);
    return Array.from({length:7},()=>r(0,4));
  }
  function makeShape(names,layout,codes,closed){
    const order=[...names],coords=order.map((p,i)=>layout[i].map((v,j)=>v+offsets[codes[i]][j]));
    const edges=Array.from({length:closed?order.length:order.length-1},(_,i)=>{
      const j=(i+1)%order.length,raw=Math.hypot(coords[i][0]-coords[j][0],coords[i][1]-coords[j][1]);
      return {name:order[i]+order[j],from:i,to:j,raw,length:Math.round(raw)};
    });
    return {names,coords,closed,edges,total:edges.reduce((sum,e)=>sum+e.length,0)};
  }
  function shaped(l,codes,phase=1){
    if(l==='1.56')return phase===0?makeShape('ABCDE',closedLayout,codes,true):makeShape('FSHRPMD',openLayout,codes,false);
    return makeShape('ABCDEFH',closedLayout,codes,true);
  }
  function sourcePreamble(seed){return seed>=100000&&seed<100000+P?'Твой выбранный чертёж. ':seed?'Новый авторский чертёж. ':'В этом номере форму и длины выбирает ученик. Дан возможный авторский чертёж. ';}
  function drawingTask(number,seed,r,step){
    const codes=readSeed(seed,r),isOpen=number==='1.56',fig=shaped(number,codes),steps=[];
    if(isOpen){
      steps.push(step('а. Замкни первую ломаную из пяти звеньев. Сколько различных вершин у такого пятиугольного контура?',5,'На примере A–B–C–D–E замыкающее звено EA возвращает в уже отмеченную вершину A.'));
      steps.push(Object.assign(step('б. Перечисли звенья незамкнутой ломаной FSHRPMD.',fig.edges.map(e=>e.name).join(' '),'Соединяй каждую букву со следующей. Прямой от D к F в этом построении нет.'),{answerFormat:'v5-segments'}));
    }else steps.push(Object.assign(step('Перечисли все звенья замкнутой ломаной ABCDEFH.',fig.edges.map(e=>e.name).join(' '),'Начни с AB, закончи возвращением из H в A.'),{answerFormat:'v5-segments'}));
    fig.edges.forEach(e=>steps.push(stepN(step,'Измерь '+e.name+' на виртуальной линейке. Запиши целое число миллиметров.',e.length,'В модели выбери это звено и прочитай конец на линейке. Мелкое деление равно 1 мм. Округляем одно звено до ближайшей отметки.')));
    const prompt=isOpen?'Найди длину открытой FSHRPMD по сумме измерений звеньев.':'Найди сумму измерений всех звеньев замкнутой ABCDEFH, включая HA.';
    return {prefix:sourcePreamble(seed),prompt:prompt+' У всех измерений точность 1 мм. Можно взять собственный чертёж из модели.',inputPrompt:'Длина ломаной по измерениям, мм',answer:fig.total,steps,errors:!isOpen?[{value:fig.total-fig.edges.at(-1).length,text:'Ты дошёл до H, но замкнутая ломаная продолжается от H до A. Прибавь это звено.'}]:[],data:{kind:'drawing',number,codes,fig},table:{caption:'Граница и порядок измерений',headers:['№','Звено'],rows:fig.edges.map((e,i)=>[i+1,e.name])},conditionKey:fig.edges.map(e=>e.name+e.length).join('/')+'/'+codes.join('')};
  }
  function splitLine(seed,r,step){
    const code=seed-310000,selectedA=Math.floor(code/100),selectedB=code%100,own=selectedA>=1&&selectedA<=80&&selectedB>=1&&selectedB<=80,first=own?selectedA:seed?r(9,36):24,second=own?selectedB:seed?r(9,36):17,total=first+second,compare=first<second?1:first===second?2:3;
    const steps=[stepN(step,'Какова длина AK в миллиметрах на выбранном чертеже?',first,'Расстояние от отметки A до K измеряют без части KL.'),stepN(step,'Какова длина KL в миллиметрах?',second,'Здесь начальная точка измерения K. От показания в L вычти показание в K.'),step('Сравни AK с KL. Введи 1, если AK короче; 2, если равен; 3, если длиннее.',compare,'Сравни полученные измерения в одинаковых единицах.')];
    return {prefix:own?'Твои измерения. ':seed?'Новый авторский чертёж. ':'В учебнике длины выбираешь сам. На авторском чертеже использованы следующие отметки. ',prompt:'K находится между A и L. Какова длина AL на выбранном чертеже?',inputPrompt:'AL в миллиметрах',answer:total,steps,errors:[{value:Math.abs(first-second),text:'Получилась разница между участками. От A до L проходят оба участка подряд.'}],data:{kind:'comparison',first,second,total,compare},table:{caption:'Отметки по линейке',headers:['Точка','Отметка, мм'],rows:[['A',0],['K',first],['L',total]]},conditionKey:first+'/'+second};
  }
  function polygon(seed,r,step){
    const names=seed?['PKLST','EHMKR','TNOSF','CBHEK'][r(0,3)]:'ABCDK',codes=readSeed(seed,r),layout=[[9,41],[9,11],[48,11],[64,29],[35,41]],fig=makeShape(names,layout,codes,true);
    const nodes=Object.assign(step('Перечисли все вершины фигуры.',names,'Пройдись по всем углам границы.'),{answerFormat:'v5-line-points'});
    const answer=fig.edges.map(e=>e.name).join(' ');
    return {prompt:'Запиши все стороны пятиугольника, показанного на авторском рисунке. Буквы концов и порядок перечисления можно менять.',inputPrompt:'Пять сторон через пробел',answer,answerFormat:'v5-segments',steps:[nodes,step('Сколько сторон должно получиться при обходе по границе?',5,'Пятиугольник имеет пять сторон, по одной от каждой вершины к следующей.')],errors:[],data:{kind:'polygon',fig,codes},table:{caption:'Набор подписей, порядок задаёт граница',headers:['Обозначения','Что найти'],rows:[[names.split('').sort().join(', '),'Вершины и стороны']]},conditionKey:names+codes.join('')};
  }
  function figureSvg(f,edge,active,showRule=false){
    // Coordinates use a common unit for both axes. Labels and the virtual ruler use that same drawing scale.
    const scale=2.85,px=x=>11+scale*x,py=y=>9+scale*y;
    let art='';
    for(const [i,e]of f.edges.entries()){
      const a=f.coords[e.from],b=f.coords[e.to];
      art+='<line x1="'+px(a[0])+'" y1="'+py(a[1])+'" x2="'+px(b[0])+'" y2="'+py(b[1])+'" stroke="'+(i===edge?'#ac582d':'#387256')+'" stroke-width="'+(i===edge?4:2)+'"/>';
    }
    f.coords.forEach(([x,y],i)=>{art+='<circle cx="'+px(x)+'" cy="'+py(y)+'" r="'+(active===i?4.2:3)+'" fill="#213c30"/><text x="'+px(x)+'" y="'+(py(y)-6)+'" text-anchor="middle" font-size="15">'+f.names[i]+'</text>';});
    if(showRule){
      const e=f.edges[edge],lineStart=19,rulerY=189,last=Math.ceil(e.raw/10)*10,unit=scale;
      art+='<text x="10" y="167" font-size="13">Звено '+e.name+' на виртуальной линейке</text><line x1="'+lineStart+'" y1="'+rulerY+'" x2="'+(lineStart+last*unit)+'" y2="'+rulerY+'" stroke="#57695c"/>';
      for(let i=0;i<=last;i++){
        const xx=lineStart+i*unit,tall=i%10===0?10:i%5===0?7:4;art+='<line x1="'+xx+'" y1="'+rulerY+'" x2="'+xx+'" y2="'+(rulerY+tall)+'" stroke="#577260"/>';
        if(i%10===0)art+='<text x="'+xx+'" y="212" data-ruler-label="" font-size="12" text-anchor="middle">'+i+'</text>';
      }
      art+='<path d="M'+lineStart+' 181H'+(lineStart+e.raw*unit)+'M'+lineStart+' 176V186M'+(lineStart+e.raw*unit)+' 176V186" fill="none" stroke="#a85129" stroke-width="2.5"/>';
    }
    return '<svg class="v5q-source-polyline" viewBox="0 0 308 '+(showRule?222:158)+'" role="img" aria-label="'+(f.closed?'Замкнутая':'Незамкнутая')+' ломаная '+f.names+'"><g fill="#233e30">'+art+'</g></svg>';
  }
  function lineSvg(a,b){
    const start=20,span=255,middle=start+span*a/(a+b),end=start+span;
    const dots=[[start,'A'],[middle,'K'],[end,'L']];
    return '<svg class="v5q-source-polyline" viewBox="0 0 300 64" role="img" aria-label="K между A и L"><line x1="'+start+'" y1="39" x2="'+middle+'" y2="39" stroke="#3b7b59" stroke-width="4"/><line x1="'+middle+'" y1="39" x2="'+end+'" y2="39" stroke="#b66535" stroke-width="4"/>'+dots.map(([x,name])=>'<circle cx="'+x+'" cy="39" r="3.2"/><text x="'+x+'" y="23" text-anchor="middle" font-size="16">'+name+'</text>').join('')+'</svg>';
  }
  const drawBounds={phase:[0,1,1],vertex:[0,6,0],edge:[0,6,0],...Object.fromEntries(Array.from({length:7},(_,i)=>['p'+i,[0,5,0]]))};
  const bounds={'1.56':drawBounds,'1.57':{firstLength:[0,80,0],secondLength:[0,80,0],view:[0,3,0]},'1.58':{edge:[0,4,0]},'1.59':drawBounds};
  function chosenCodes(d,s){return d.codes.map((c,i)=>s['p'+i]?s['p'+i]-1:c);}
  function selection(t,s){
    const d=t.data;
    if(d.kind==='drawing')return 100000+chosenCodes(d,s).reduce((sum,c,i)=>sum+c*5**i,0);
    if(d.kind==='comparison')return 310000+100*(s.firstLength||d.first)+(s.secondLength||d.second);
    return null;
  }
  function taskDrawing(d){
    if(d.kind==='comparison')return lineSvg(d.first,d.second);
    return figureSvg(d.fig,-1,-1);
  }
  const apply='<p><button type="button" class="button quiet" data-v5-apply-drawing>Начать решение по моему чертежу</button></p><p class="tiny">После выбора чертежа задача откроется с первого шага. Числа в условии будут соответствовать этому построению.</p>';
  function explore(l,s,t){
    const d=t.data;
    if(d.kind==='comparison'){
      const a=s.firstLength||d.first,b=s.secondLength||d.second,views=['AK','KL','AL','Сравнение AK и KL'];
      const controls=[{key:'firstLength',title:'AK, мм (0 — использовать условие)',min:0,max:80,step:1},{key:'secondLength',title:'KL, мм (0 — использовать условие)',min:0,max:80,step:1},{key:'view',title:'Что исследовать',values:views.map((v,i)=>[i,v])}];
      return {title:'Отмерь свои два участка',controls,visual:lineSvg(a,b)+'<p>AK = '+a+' мм, KL = '+b+' мм.</p>'+apply,question:s.view===3?'Сравни AK с KL: 1 — короче, 2 — равен, 3 — длиннее.':'Какова длина '+views[s.view]+' в миллиметрах?',answer:[a,b,a+b,a<b?1:a===b?2:3][s.view],why:'Три отметки идут A, K, L. Длина AL равна '+a+' + '+b+' = '+(a+b)+' мм.'};
    }
    if(d.kind==='polygon'){
      const f=d.fig,e=f.edges[s.edge];
      return {title:'Обойди по одной стороне',controls:[{key:'edge',title:'Какую сторону выделить',values:f.edges.map((v,i)=>[i,v.name])}],visual:figureSvg(f,s.edge,-1),question:'Какой по счёту в записи '+f.names+' стоит начальная вершина выделенного звена '+e.name+'?',answer:e.from+1,why:'Сторона начинается в '+f.names[e.from]+' и заканчивается в следующей вершине '+f.names[e.to]+'.'};
    }
    const phase=l.number==='1.56'?s.phase:1,codes=chosenCodes(d,s),f=shaped(l.number,codes,phase),v=Math.min(s.vertex,f.names.length-1),i=Math.min(s.edge,f.edges.length-1),e=f.edges[i];
    const controls=[];if(l.number==='1.56')controls.push({key:'phase',title:'Чертёж',values:[[0,'а. Замкнутый контур из пяти звеньев'],[1,'б. Открытая FSHRPMD']]});
    controls.push({key:'vertex',title:'Какую вершину двигать',values:[...f.names].map((p,i)=>[i,p])},{key:'p'+v,title:'Положение вершины '+f.names[v],values:[[0,'Как в условии'],...options.map((text,j)=>[j+1,text])]},{key:'edge',title:'Какое звено измерить',values:f.edges.map((e,j)=>[j,e.name])});
    return {title:'Построй и измерь свою ломаную',controls,visual:figureSvg(f,i,v,true)+apply,question:'Какую длину '+e.name+' показывает виртуальная линейка? Запиши миллиметры с точностью до 1 мм.',answer:e.length,why:'Считаем от нулевой засечки. Ближайшее целое деление у правого конца: '+e.length+' мм.'};
  }
  const generators={'1.56':(s,r,t)=>drawingTask('1.56',s,r,t),'1.57':splitLine,'1.58':polygon,'1.59':(s,r,t)=>drawingTask('1.59',s,r,t)};
  const api={lessons,generators,bounds,explore,selection,taskDrawing};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5PrintedBuildablePaths=api;
})(typeof window!=='undefined'?window:globalThis);
