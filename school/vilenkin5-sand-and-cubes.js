/* Виленкин и соавт., 2023, часть 2, §25, с. 9, №5.22 и 5.23. Ключ к №5.22 на с. 172. */
(function(root){
  'use strict';
  const createLesson=(number,title,requires,explanation,worked,misconception,reflect)=>({number,title,part:2,point:25,page:9,key:'printed-'+number.replace('.','-'),requires:['v5f-printed-'+requires],related:[],explanation,worked,misconception,reflect});
  const lessons=[
    createLesson('5.22','Сколько песка и сколько банок краски?','5-20','Для песка измеряй вместимость, для краски — площадь. У открытого ящика есть дно и четыре стенки. У крышки свои размеры. Каждую поверхность красят с двух сторон.',
      ['У другого ящика длина 4 дм, ширина 3 дм, высота 2 дм. Объём равен 24 дм³.','С одной стороны окрашиваются дно 12 дм² и стенки общей площадью 2·(4·2 + 3·2) = 28 дм². Крышку считаем отдельно.','Если требуется 2050 г краски, а в банке 1 кг, двух банок мало — нужны три.'],
      'Для подсчёта краски достаточно знать, сколько песка вмещает ящик.','Где в расчёте появляется увеличение площади, если у крышки есть выступ?'),
    createLesson('5.23','Как меняются объём и площадь двух кубов?','5-22','Сравни длины рёбер. На квадратной грани меняются два направления, а внутри куба — три. Проверь отношения вычислением объёмов и площадей.',
      ['При рёбрах 3 и 1 вдоль стороны укладываются 3 маленьких ребра. На грани — 3·3 квадрата.','В трёх слоях по 9 кубиков находится 27 кубиков. У каждого куба шесть граней, и отношение площадей их поверхностей равно 9.'],
      'При увеличении ребра вдвое объём и площадь поверхности увеличиваются одинаково.','Почему число граней исчезает из отношения площадей?')
  ];
  const fmt=n=>String(n).replace('.',',');
  function panel(w,h,title,fill,scale){
    return '<div style="min-width:0"><svg viewBox="0 0 100 58" aria-hidden="true" style="width:100%;max-width:9rem;display:block"><rect x="5" y="5" width="'+w*scale+'" height="'+h*scale+'" fill="'+fill+'" stroke="#30555e" stroke-width="1.5"/></svg><small>'+title+'<br>'+fmt(w)+' × '+fmt(h)+' дм</small></div>';
  }
  function net(x,selected){
    const scale=Math.min(88/Math.max(x.a,x.b,x.l),47/Math.max(x.b,x.h,x.w));
    const panes=[panel(x.a,x.b,'Дно','#c2dfdc',scale),panel(x.b,x.h,'Длинная стенка, 2 шт.','#eebd84',scale),panel(x.a,x.h,'Короткая стенка, 2 шт.','#d9d6b7',scale),panel(x.l,x.w,'Крышка','#a8c9dc',scale)];
    return '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.4rem;max-width:29rem">'+panes.map((p,i)=>'<div style="padding:.2rem;border:2px solid '+(selected===i?'#a24425':'transparent')+'">'+p+'</div>').join('')+'</div>';
  }
  const boxes=[[7,9,5,7.5,9.6,1600,7,2000],[4,8,5,4.5,9,1500,8,1000],[5,8,4,5.5,9,1400,9,1600],[6,10,5,6.5,11,1500,6,1000],[8,10,4,8.5,11,1250,8,2000],[6,8,5,6.5,9,1600,7,1500]];
  function box(seed,rand,step){
    const [a,b,h,l,w,grams,rate,tin]=boxes[seed?1+(seed-1)%(boxes.length-1):0],vol=a*b*h,kg=vol*grams/1000,body=a*b+2*(a+b)*h,lid=l*w,area=2*(body+lid),paint=area*rate,count=Math.ceil(paint/tin);
    const data={a,b,h,l,w,grams,rate,tin};
    const ask=(q,answer,hint,bad,feedback)=>({...step(q,Number.isInteger(answer)?answer:String(answer),hint,[{value:Number.isInteger(bad)?bad:String(bad),text:feedback}]),answerFormat:'v5-unit-fraction'});
    const steps=[
      ask('а. Ящик имеет размеры '+a*100+' × '+b*100+' × '+h*100+' мм. Найди его вместимость в дм³.',vol,'В одном дециметре 100 мм. Переведи все три длины, затем перемножь.',a*b,'Это площадь дна. Чтобы узнать вместимость, нужна ещё высота.'),
      ask('Масса песка в одном дм³ равна '+fmt(grams/1000)+' кг. Какова масса песка в заполненном ящике, в кг?',kg,'Перемножь вместимость и массу одного кубического дециметра.',vol*grams,'Получились граммы. Ответ нужен в килограммах.'),
      ask('б. Сколько дм² составляют дно и четыре стенки с одной стороны без крышки?',body,'Нарисуй дно и две пары стенок. У каждой пары одинаковая высота.',2*(a*b+a*h+b*h),'Ты посчитал второе дно. Верх у ящика открыт, его крышка имеет другие размеры.'),
      ask('Какова площадь одной стороны крышки '+l*100+' × '+w*100+' мм, в дм²?',lid,'Переведи обе длины в дм. Крышка выступает за край ящика.',a*b,'Это дно. Проверь собственные размеры крышки.'),
      ask('Какую площадь красят, если изнутри и снаружи окрашивают и ящик, и крышку? Ответ в дм².',area,'Сначала сложи детали, взятые с одной стороны. У каждой детали есть и обратная сторона.',body+lid,'Найдена площадь только одной стороны всех деталей.'),
      ask('На каждый дм² расходуется '+rate+' г. Сколько нужно краски, в граммах?',paint,'Умножь окрашиваемую площадь на расход для одного квадратного дециметра.',area,'Это площадь. Каждому квадратному дециметру соответствует указанная масса краски.')
    ];
    return {prompt:'В одной банке '+fmt(tin/1000)+' кг краски. Сколько полных банок надо купить?',inputPrompt:'Число банок при окраске обеих сторон крышки',answer:count,steps,data:{openBox:data},conditionKey:'open-box/'+[a,b,h,l,w,grams,rate,tin].join('/'),
      why:count+' банок дают '+count*tin+' г. В '+(count-1)+' было бы '+(count-1)*tin+' г, этого меньше нужных '+fmt(paint)+' г.'+(seed?'':' В ключе на с. 172 указаны две банки. Проверим, откуда берётся разница. Если красить крышку только сверху, площадь равна 2 · 223 + 72 = 518 дм². Тогда нужно 3626 г — хватит двух банок. Здесь мы покрасили крышку с обеих сторон, поэтому требуется 4130 г.'),
      errors:[{value:count-1,text:seed?'Столько банок не покроют весь расход. Проверь, сколько граммов в них помещается.':'В ключе на с. 172 стоит это число. Но в нашем расчёте окрашены обе стороны крышки. Две банки не покроют весь расход. Сравни их общую массу с найденным расходом.'}]};
  }
  function lattice(scale,stack){
    let lines='';const a=66;
    for(let i=0;i<=scale;i++){const k=i*a/scale;lines+='<path d="M'+(10+k)+' 12v66 M10 '+(12+k)+'h66" fill="none" stroke="#345860"/>';}
    const layer=Array.from({length:stack?scale:1},(_,i)=>'<path d="M112 '+(65-i*7)+'l23 -9 37 7 -23 10Z" fill="'+(i%2?'#c7dfd6':'#e7b879')+'" stroke="#345860"/>').join('');
    return '<svg viewBox="0 0 187 92" role="img" class="v5q-printed-geometry" aria-label="Квадратная грань поделена на маленькие грани. Справа показаны слои." style="width:100%;max-width:25rem;display:block"><rect x="10" y="12" width="66" height="66" fill="#dceade"/>'+lines+layer+'</svg>';
  }
  function scaleCubes(seed,rand,step){
    const small=seed?rand(2,7):4,choice=seed?rand(2,5):2,k=seed&&small===4&&choice===2?3:choice,large=k*small;
    const steps=[
      step('У первого куба ребро '+large+' дм, у второго '+small+' дм. Во сколько раз ребро второго меньше?',k,'Раздели большее ребро на меньшее.'),
      step('Во сколько раз объём второго куба меньше объёма первого?',k**3,'Сравни объёмы как произведения трёх рёбер.',[{value:k*k,text:'Ты сравнил одну грань. У объёма есть ещё число слоёв.'}])
    ];
    return {prompt:'Во сколько раз площадь поверхности второго куба меньше площади поверхности первого?',answer:k*k,inputPrompt:'Во сколько раз',steps,
      why:'Отношение 6·'+large+'² к 6·'+small+'² равно '+k+'² = '+k*k+'. Обе поверхности состоят из шести граней.',errors:[{value:k**3,text:'Это отношение объёмов. Для площади сравни две грани, по двум направлениям.'},{value:k,text:'Обе стороны квадратной грани уменьшились. Учти их обе.'}],
      data:{cubeScale:{small,k,large}},conditionKey:'cube-scale/'+[small,k].join('/')};
  }
  function taskDrawing(task,scene){
    if(task.data.openBox)return net(task.data.openBox,scene.mode==='learn'&&scene.step===3?3:-1);
    return lattice(task.data.cubeScale.k,scene.mode==='learn'&&scene.step===1);
  }
  function explore(task,s){
    if(task.data.cubeScale){const k=s.factor,what=s.view;return {title:'Одна грань или весь куб',controls:[{key:'factor',title:'Во сколько раз больше ребро',min:2,max:5,step:1},{key:'view',title:'Сравни',values:[[0,'Две грани'],[1,'Два объёма']]}],
      visual:lattice(k,what===1),question:what?'Во сколько раз вырос объём?':'Во сколько раз выросла площадь грани?',answer:what?k**3:k*k,why:what?k+' слоёв по '+k*k+' кубиков.':k+' рядов по '+k+' маленьких квадратов.'};}
    const x=task.data.openBox,area=[x.a*x.b,x.b*x.h,x.a*x.h,x.l*x.w][s.piece]*(s.sides+1);
    return {title:'Выбери деталь и окрашиваемые стороны',controls:[{key:'piece',title:'Одна деталь',values:[[0,'Дно'],[1,'Длинная стенка'],[2,'Короткая стенка'],[3,'Крышка']]},{key:'sides',title:'Красим',values:[[0,'С одной стороны'],[1,'С обеих сторон']]}],
      visual:net(x,s.piece),question:'Какую площадь в дм² надо покрасить только на выбранной детали?',answer:Number.isInteger(area)?area:String(area),why:'Произведение размеров одной детали умножаем на '+(s.sides+1)+'. Получаем '+fmt(area)+' дм².'};
  }
  const api={lessons,generators:{'5.22':box,'5.23':scaleCubes},bounds:{'5.22':{piece:[0,3,0],sides:[0,1,0]},'5.23':{factor:[2,5,2],view:[0,1,0]}},taskDrawing,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5SandAndCubes=api;
})(typeof window!=='undefined'?window:globalThis);
