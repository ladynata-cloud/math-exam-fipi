/* Printed exercises 1.107–1.110, part 1, page 24 (2023); independent schematics. */
(function(root){
  'use strict';
  const lessons=[
    {number:'1.107',key:'printed-1-107',title:'Складываем составные длины',explanation:'Вырази обе длины в одной единице, сложи их и при необходимости снова выдели более крупные единицы. Результат можно записать одной величиной или парой единиц.',worked:['1 м 80 см + 70 см = 180 см + 70 см = 250 см, то есть 2 м 50 см.'],misconception:'Сантиметры после сложения всегда остаются меньше ста.',reflect:'Каким способом можно проверить ответ с другими единицами?'},
    {number:'1.108',key:'printed-1-108',title:'Расстояние AD через B и C',explanation:'Если четыре точки отмечены на прямой последовательно, путь от первой до последней проходит три соседних отрезка. Сначала приведи длины к одной единице, затем сложи.',worked:['Кусочки 20, 13 и 24 мм составляют 57 мм. Это 5 см 7 мм.'],misconception:'Любые четыре отмеченные точки дают четыре соседних промежутка.',reflect:'Сколько промежутков придётся пройти от второй точки до четвёртой?'},
    {number:'1.109',key:'printed-1-109',title:'Выражаем девять длин в указанных единицах',explanation:'Определи, крупнее или мельче новая единица. Для записи того же расстояния мелких единиц потребуется больше. В составной длине сначала обработай обе части, затем сложи в одной единице.',worked:['70 мм = 7 см. А 2 км 70 м = 2000 м + 70 м = 2070 м.'],misconception:'При любом переводе от исходного числа достаточно убрать один нуль.',reflect:'Когда потребуется множитель 10, когда 100 и когда 1000?'},
    {number:'1.110',key:'printed-1-110',title:'Разрезаем шестиугольник отрезком KL',explanation:'Построй выпуклый шестиугольник и выбери дополнительные точки внутри сторон EF и AB. Отрезок между точками даёт двум новым фигурам общую сторону. Обойди границу каждой фигуры до возвращения к началу.',worked:['При обходе замкнутой фигуры можно начинать с любой её вершины и идти в любом направлении. Порядок соседних вершин при этом должен сохраниться.'],misconception:'Если общее ребро проведено один раз, оно является стороной лишь одной новой фигуры.',reflect:'Какие стороны исходного шестиугольника разделились на две части?'}
  ].map(l=>({...l,part:1,point:4,page:24,requires:['v5f-segment-length'],related:['v5f-printed-1-94']}));
  const factors={км:1000000,м:1000,дм:100,см:10,мм:1},err=(value,text)=>({value,text}),sel=(key,title,labels)=>({key,title,values:labels.map((v,i)=>[i,v])});
  function mm(input,M){
    let raw=String(input).trim().toLowerCase().replace(/(\d)[\u00a0\u202f ](?=\d{3}(?:\s*(?:км|дм|см|мм|м)|[\u00a0\u202f ]\d{3}))/g,'$1'),prev=Infinity,totalN=0n,totalD=1n;
    if(!raw||raw.length>90)return null;
    while(raw){
      const v=raw.match(/^(\d+(?:\s+\d+\/\d+|\/\d+|[.,]\d+)?)\s*(км|дм|см|мм|м)\.?\s*/u);if(!v)return null;
      const factor=factors[v[2]],amount=M.parse(v[1]);if(!amount||amount.n<0||factor>=prev)return null;prev=factor;
      totalN=totalN*BigInt(amount.d)+BigInt(amount.n)*BigInt(factor)*totalD;totalD*=BigInt(amount.d);raw=raw.slice(v[0].length);
    }
    if(totalN/totalD>BigInt(Number.MAX_SAFE_INTEGER))return null;
    if(totalN%totalD===0n)return Number(totalN/totalD);
    let a=totalN,b=totalD;while(b){const rem=a%b;a=b;b=rem;}return (totalN/a)+'/'+(totalD/a);
  }
  function polygonKey(input){
    const aliases={'А':'A','В':'B','С':'C','Д':'D','Е':'E','К':'K','Л':'L','Ф':'F'},text=String(input).trim().toUpperCase().replace(/[АВСДЕКЛФ]/g,c=>aliases[c]).replace(/[\s,\-–]+/g,''),raw=text.length>=4&&text[0]===text.at(-1)?text.slice(0,-1):text;
    if(!/^[A-Z]{3,8}$/.test(raw)||new Set(raw).size!==raw.length)return null;
    const variants=[];for(const s of [raw,Array.from(raw).reverse().join('')])for(let i=0;i<s.length;i++)variants.push(s.slice(i)+s.slice(0,i));return variants.sort()[0];
  }
  const term=(n,u)=>n+' '+u,formed=parts=>parts.map(([n,u])=>term(n,u)).join(' '),measure=parts=>parts.reduce((s,[n,u])=>s+n*factors[u],0);
  function lengthTarget(step,prompt,mmValue,unit,why){return {...step(prompt,term(mmValue/factors[unit],unit),why),answerFormat:'v5-equivalent-length',millimetres:mmValue};}
  function lengthSums(seed,r,step){
    const a=seed?r(1,6):2,b=seed?r(12,88):55,c=seed?r(1,5):1,d=seed?r(10,80):20,dm=seed?r(3,8):4,cm=seed?r(10,18):12,extra=seed?r(13,28):19,x=seed?r(3,9):7,y=seed?10*r(5,9):70,z=seed?r(2,7):4,w=seed?10*r(5,9):60,km=seed?r(2,6):3,m1=seed?50*r(2,8):250,m2=seed?50*r(14,18):850;
    const pairs=[[[[a,'м'],[b,'см']],[[c,'м'],[d,'см']]],[[[dm,'дм'],[cm,'см']],[[extra,'см']]],[[[x,'м'],[y,'см']],[[z,'м'],[w,'см']]],[[[km,'км'],[m1,'м']],[[m2,'м']]]];
    const steps=pairs.map(([p,q],i)=>lengthTarget(step,'абвг'[i]+'. Сложи '+formed(p)+' и '+formed(q)+'. Запиши число с единицами.',measure(p)+measure(q),i===3?'м':'см','Приведи обе длины к одной единице. Если мелких единиц накопилось достаточно, их можно заменить одной крупной.'));
    const total=measure(pairs[3][0])+measure(pairs[3][1]);return {prefix:'Четыре сложения величин. ',prompt:'Проверь последний подпункт обратным переводом: сколько метров в полученной сумме?',inputPrompt:'Сумма последнего подпункта, м',answer:total/1000,steps,errors:[err(Math.floor(total/1e6),'Это только целые километры. Ответ запиши в метрах.')],data:{lengthSums:pairs},table:{caption:'Слагаемые длины',headers:['№','Первая длина','Вторая длина'],rows:pairs.map(([p,q],i)=>['абвг'[i],formed(p),formed(q)])},conditionKey:pairs.map(([p,q])=>formed(p)+'/'+formed(q)).join(';')};
  }
  function chain(seed,r,step){
    const segments=seed?[10*r(2,8),10*r(1,4)+r(1,8),10*r(2,6)+r(1,8)]:[40,15,32],names=['AB','BC','CD'],coords=[0];for(const x of segments)coords.push(coords.at(-1)+x);
    const steps=segments.map((m,i)=>step(names[i]+': сколько миллиметров в '+Math.floor(m/10)+' см'+(m%10?' '+m%10+' мм':'')+'?',m,'Каждый сантиметр содержит десять миллиметров. Миллиметры добавь отдельно.'));
    steps.push(lengthTarget(step,'Запиши длину AD со своей единицей или с двумя единицами.',coords[3],'мм','Путь A–B–C–D включает все три соседних отрезка.'));
    return {prefix:'Четыре буквы на прямой стоят по порядку A, B, C, D. ',prompt:'Сколько миллиметров от первой до последней точки?',inputPrompt:'Расстояние в миллиметрах',answer:coords[3],steps,errors:[err(segments[0]+segments[2],'Пропущено расстояние между B и C. Включи средний отрезок BC.')],data:{segmentChain:{segments,coords}},table:{caption:'Три соседних отрезка',headers:['Отрезок','Длина'],rows:segments.map((x,i)=>[names[i],Math.floor(x/10)+' см'+(x%10?' '+x%10+' мм':'')])},conditionKey:segments.join('/')};
  }
  function convert(seed,r,step){
    const src=[[[seed?10*r(3,9):60,'мм']],[[seed?10*r(12,48):320,'мм']],[[seed?r(28,83):54,'м']],[[seed?100*r(3,9):600,'м']],[[seed?100*r(2,9):400,'см']],[[seed?10*r(12,38):200,'дм']],[[seed?r(2,8):3,'км']],[[seed?r(2,9):6,'км'],[seed?10*r(2,9):50,'м']],[[seed?1000*r(12,68):35000,'мм']]];
    const steps=src.map((p,i)=>{const unit=i<4?'см':'м',res=measure(p)/factors[unit];return step((i<4?'а':'б')+'. '+formed(p)+' — сколько '+(i<4?'сантиметров':'метров')+'?',res,'При переводе учитывай размер обеих единиц и приведённые части длины.',p.length===2?[err(p[0][0]*1000,'Переведены только километры. Добавь оставшиеся метры.')]:[]);});
    return {prefix:'В подпункте а ответы нужны в сантиметрах, в б — в метрах. ',prompt:'Для проверки собери пять ответов подпункта б в метрах через точку с запятой.',inputPrompt:'Пять результатов, м',answer:steps.slice(4).map(s=>s.answer),answerFormat:'v5-list',steps,errors:[],data:{conversions:src},table:{caption:'Куда переводим',headers:['№','Дано','Нужная единица'],rows:src.map((p,i)=>[i+1,formed(p),i<4?'см':'м'])},conditionKey:src.map(formed).join('/')};
  }
  function sliced(seed,r,step){
    const data={height:seed?r(0,15):6,slide:seed?r(0,12):3,k:seed?r(2,7):5,l:seed?r(2,7):5};
    const steps=[step('Сколько вершин у части, граница которой проходит через F и A?',4,'Начни в K, дойди по границе до F, затем до A и L. Отрезок KL ведёт обратно к началу.'),
      {...step('Запиши буквы первой фигуры по обходу. Начинать можно с любой вершины.', 'ALKF','Соседние в записи вершины должны быть соединены стороной. Порядок можно обратить.'),answerFormat:'v5-polygon-path'},
      step('Сколько вершин у части с B, C, D и E?',6,'Вместе с B, C, D, E в границу входят обе точки разреза.',[err(4,'Посчитаны только исходные B, C, D, E. У разреза есть ещё два конца.')]),
      {...step('Запиши по обходу буквы второй фигуры.', 'LBCDEK','Пройди от L вдоль B, C, D, E до K. Затем вернись по разрезу KL.'),answerFormat:'v5-polygon-path'}];
    return {prefix:'На авторской модели выпуклого ABCDEF можно выбрать положение K на EF и L на AB. ',prompt:'Сколько новых многоугольников получилось после единственного разреза KL?',inputPrompt:'Число фигур',answer:2,steps,errors:[err(3,'В исходном шестиугольнике появился один внутренний отрезок. Обойди области по разные стороны от него.')],data:{sliced:data},table:{caption:'Построение',headers:['Точка или отрезок','Положение'],rows:[['K','Внутри EF'],['L','Внутри AB'],['KL','Разделяет фигуру']]},conditionKey:Object.values(data).join('/')};
  }
  function strip(coords,one,two){
    const pos=i=>18+218*coords[i]/coords.at(-1),order='ABCD';return '<svg viewBox="0 0 258 90" role="img" aria-label="Последовательно A, B, C, D; соседние длины '+coords.slice(1).map((x,i)=>x-coords[i]).join(', ')+' мм"><path d="M8 42H249" stroke="#4a6670"/><path d="M'+pos(one)+' 42H'+pos(two)+'" stroke="#a54f20" stroke-width="4"/>'+coords.map((_,i)=>'<circle cx="'+pos(i)+'" cy="42" r="3" fill="#334e5a"/><text x="'+pos(i)+'" y="28" text-anchor="middle" style="font-size:14px">'+order[i]+'</text>').join('')+coords.slice(1).map((n,i)=>'<text x="'+((pos(i)+pos(i+1))/2)+'" y="64" text-anchor="middle" style="font-size:11px">'+(n-coords[i])+' мм</text>').join('')+'</svg>';
  }
  function hex(d,k,l,side){
    const pts={A:[30,65],B:[80,19],C:[168,12+d.height],D:[229,70],E:[183+d.slide,130],F:[72,136]};const lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t/10);
    pts.K=lerp(pts.E,pts.F,k);pts.L=lerp(pts.A,pts.B,l);const pieces=['ALKF','LBCDEK'];
    const body=pieces.map((walk,i)=>'<polygon points="'+Array.from(walk,n=>pts[n].join(',')).join(' ')+'" fill="'+(side===i?'#bfdfd5':'#f0e2c9')+'" stroke="#465e68" stroke-width="2"/>').join('')+'<path d="M'+pts.K.join(' ')+'L'+pts.L.join(' ')+'" stroke="#9e4c28" stroke-width="3"/>'+Object.entries(pts).map(([n,[x,y]])=>'<circle cx="'+x+'" cy="'+y+'" r="2.8" fill="#2c4752"/><text x="'+(x+(n==='A'?-7:3))+'" y="'+(y+(['F','E','K'].includes(n)?16:-5))+'" style="font-size:13px">'+n+'</text>').join('');
    return '<svg viewBox="0 0 260 160" role="img" aria-label="K на EF, L на AB; выделенная часть содержит '+(side?'B, C, D, E':'F и A')+'">'+body+'</svg>';
  }
  function diagram(t){const d=t.data;if(d.segmentChain)return strip(d.segmentChain.coords,0,3);if(d.sliced)return hex(d.sliced,d.sliced.k,d.sliced.l,0);return '';}
  function explore(l,s,t,table){
    const d=t.data;
    if(d.lengthSums){const [a,b]=d.lengthSums[s.item],unit=s.item===3?'м':'см',x=measure(a)/factors[unit],y=measure(b)/factors[unit];return {title:'Проверь одинаковые единицы',controls:[sel('item','Подпункт',Array.from('абвг')),sel('ask','Что перевести',['Первая длина','Вторая длина','Вся сумма'])],visual:table('Слагаемые',['Первая','Вторая'],[[formed(a),formed(b)]]),question:'Сколько '+(unit==='м'?'метров':'сантиметров')+' в выбранной величине?',answer:[x,y,x+y][s.ask],why:'После перевода можно сложить '+x+' и '+y+' одинаковых единиц.'};}
    if(d.segmentChain){const c=d.segmentChain.coords,order=Array.from('ABCD');return {title:'Измерь путь между двумя точками',controls:[sel('from','Первая точка',order),sel('to','Вторая точка',order)],visual:strip(c,s.from,s.to),question:'Каково расстояние между выбранными точками в миллиметрах?',answer:Math.abs(c[s.from]-c[s.to]),why:'Сложи длины только тех соседних отрезков, чьи края попадают между выбранными точками.'};}
    if(d.conversions){const p=d.conversions[s.item],unit=s.unit?'мм':s.item<4?'см':'м',n=measure(p)/factors[unit];return {title:'Измени единицу сравнения',controls:[sel('item','Исходная длина',d.conversions.map(formed)),sel('unit','Единица результата',['Как в подпункте','Миллиметры'])],visual:table('Длина',['Условие','Записываем в'],[[formed(p),unit]]),question:'Какое числовое значение получится?',answer:n,why:'Записи обозначают одно расстояние. При переходе к более мелкой единице количество таких единиц возрастает.'};}
    return {title:'Перемещай концы разреза',controls:[{key:'k',title:'Положение K на EF, в десятых пути от E',min:1,max:9,step:1},{key:'l',title:'Положение L на AB, в десятых пути от A',min:1,max:9,step:1},sel('side','Выделенная часть',['С A и F','С B, C, D, E'])],visual:hex(d.sliced,s.k,s.l,s.side),question:'Сколько сторон у выделенной части?',answer:s.side?6:4,why:'Отрезок KL даёт каждой новой фигуре одну сторону. Остальные стороны идут по исходной границе.'};
  }
  const api={lessons,generators:{'1.107':lengthSums,'1.108':chain,'1.109':convert,'1.110':sliced},bounds:{'1.107':{item:[0,3,0],ask:[0,2,0]},'1.108':{from:[0,3,0],to:[0,3,3]},'1.109':{item:[0,8,0],unit:[0,1,0]},'1.110':{k:[1,9,5],l:[1,9,5],side:[0,1,0]}},mm,polygonKey,diagram,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5LengthPolygon=api;
})(typeof window!=='undefined'?window:globalThis);
