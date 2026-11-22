/* Часть 2, §26. Обе проверочные работы на печатной с. 20, 2023. */
(function(root){
  'use strict';
  const lessons=[
    {number:'check-26-1',key:'printed-check-26-1',title:'Проверочная №1 · читаем дроби и находим части',
      explanation:'В дроби число под чертой говорит, на сколько равных частей разбито целое. Число сверху показывает, сколько частей мы берём. В вопросе о белой части фигуры считай именно белые клетки.',
      worked:['Пять минут составляют 5/60 часа. Если четверть шнура длиной 9 см, то во всём шнуре четыре такие части: 36 см.'],
      misconception:'Если часть фигуры закрашена, можно использовать число закрашенных клеток в ответе на любой вопрос о доле.',reflect:'Когда удобно вычесть число отмеченных клеток из общего?'},
    {number:'check-26-2',key:'printed-check-26-2',title:'Проверочная №2 · доли задач и столбчатая диаграмма',
      explanation:'Сначала определи целое для каждой доли. «Треть оставшихся» относится только к заданиям, которые ещё не распределены. Для диаграммы выбери один масштаб для всех столбцов.',
      worked:['Из 18 яблок треть составляют 6 яблок. Если затем взять треть оставшихся 12, это ещё 4 яблока. Для 6 яблок при масштабе «2 на клетку» понадобится столбец высотой 3 клетки.'],
      misconception:'Треть от всех и треть от оставшихся всегда равны.',reflect:'Почему количество задач и высота столбца могут отличаться?'}
  ].map(l=>({...l,part:2,point:26,page:20,sourceCheck:true,requires:['v5f-printed-5-51'],related:['v5f-printed-5-96']}));
  const dictated=[['девять одиннадцатых',9,11],['тридцать две шестьдесят первых',32,61],['сто двухсотых',100,200],['три четверти',3,4]];
  const alternatives=[['пять девятых',5,9],['семь пятнадцатых',7,15],['четыре восьмых',4,8],['две трети',2,3],['три двенадцатых',3,12],['двенадцать двадцатых',12,20],['пять шестых',5,6]];
  const sourceGrids=[['1','0','0','0','0','1'],['01','00'],['101','010'],['000','111','111','111'],['110011','011110','011110','011110','001100']];
  function gridInfo(rows,white=false){
    const cells=rows.join(''),count=Array.from(cells).filter(c=>c===(white?'0':'1')).length;
    return [count,cells.length];
  }
  function generateGrid(rows,r){
    const h=rows.length,w=rows[0].length,total=h*w,colored=r(1,total-1),cells=Array.from({length:total},(_,i)=>i<colored?'1':'0');
    for(let i=total-1;i>0;i--){const j=r(0,i);[cells[i],cells[j]]=[cells[j],cells[i]];}
    return Array.from({length:h},(_,i)=>cells.slice(i*w,(i+1)*w).join(''));
  }
  function gridsFigure(grid,white){
    const cols=grid[0].length,rows=grid.length,cell=24;
    const squares=grid.flatMap((row,y)=>Array.from(row,(v,x)=>'<rect x="'+(x*cell+1)+'" y="'+(y*cell+1)+'" width="'+cell+'" height="'+cell+'" fill="'+(v==='1'?'#71b7a9':'white')+'" stroke="#315c69"/>')).join('');
    return '<figure style="margin:.5em 0"><svg role="img" aria-label="Сетка, '+rows+' строк и '+cols+' столбцов. Отмеченные клетки по строкам: '+grid.map(row=>Array.from(row,(v,i)=>v==='1'?i+1:null).filter(x=>x!==null).join(', ')||'нет').join('; ')+'" viewBox="0 0 '+(cols*cell+2)+' '+(rows*cell+2)+'" style="width:'+Math.min(180,cols*37)+'px;max-width:100%;display:block">'+squares+'</svg><figcaption>'+(white?'Найди долю белых клеток.':'Найди долю отмеченных клеток.')+'</figcaption></figure>';
  }
  function checkOne(seed,r,step){
    const pool=alternatives.slice(),words=seed?Array.from({length:4},()=>pool.splice(r(0,pool.length-1),1)[0]):dictated;
    const time=seed?r(4,18):7,part=seed?r(15,59):60,pieces=seed?r(3,8):6,metres=seed?r(2,7):3,cuts=seed?[4,5,8,10][r(0,3)]:5;
    const grids=seed?sourceGrids.map(g=>generateGrid(g,r)):sourceGrids;
    const wordSteps=words.map(([spoken,n,d],i)=>({...step('1'+['а','б','в','г'][i]+'. Запиши цифрами: «'+spoken+'».',n+'/'+d,'Числитель показывает число взятых долей, а знаменатель даёт долям название.',
      [{value:d+'/'+n,text:'Числа поменялись местами. Число взятых долей запиши над чертой.'}]),answerFormat:'v5-dictated-fraction',languageRow:[n,d]}));
    const tasks=[...wordSteps,step('2. Какую долю часа составляют '+time+' мин?',time+'/60','Сравни это число минут с числом минут в целом часе.',[{value:'60/'+time,text:'Целый час поставь в знаменатель. В числителе запиши часть часа.'}]),
      step('3. Для банта взяли '+part+' см ленты. Это одна из '+pieces+' равных частей всей ленты. Сколько сантиметров было вначале?',part*pieces,'Собери целую ленту из равных отрезков.',
      [{value:part+'/'+pieces,text:'Длина одной доли уже дана. Собери из таких долей всё целое.'}]),
      step('4. Бревно длиной '+metres+' м распилено на '+cuts+' одинаковых частей. Укажи длину одной части сначала в метрах, затем в сантиметрах. Ответы раздели точкой с запятой.',[metres+'/'+cuts,(100*metres)+'/'+cuts],'Сначала раздели длину в метрах на число частей. Один метр равен ста сантиметрам.',
      [{value:[metres+'/'+cuts,metres+'/'+cuts],text:'Первое число может быть верным. Длину в сантиметрах нужно пересчитать в меньших единицах.'}])];
    grids.forEach((grid,i)=>{
      const white=i>=3,[n,d]=gridInfo(grid,white);
      tasks.push(step((white?'6':'5')+['а','б','в','а','б'][i]+'. Какая доля прямоугольника '+(white?'оставлена белой':'отмечена цветом')+'? Введи дробь.',n+'/'+d,'Все клетки одинаковы. Знаменатель учитывает каждую клетку, числитель — клетки нужного вида.',
        [{value:(d-n)+'/'+d,text:white?'Такую долю занимают цветные клетки. Посчитай оставшиеся белые клетки.':'Получилась доля белой части. Посчитай отмеченные клетки.'}]));
    });
    tasks.slice(4).forEach(row=>{if(typeof row.answer==='string'&&row.answer.includes('/'))row.answerFormat='v5-unit-fraction';});
    const final=tasks.pop();return {...final,steps:tasks,data:{fractionSelf:{grids,time,part,pieces,metres,cuts}},conditionKey:'fractionSelf/'+[words.map(x=>x[0]).join(','),time,part,pieces,metres,cuts,...grids.map(g=>g.join('.'))].join('/')};
  }
  function checkTwo(seed,r,step){
    const unit=seed?r(1,4):1,k=seed?r(1,6):2,scale=2,total=k*18,easy=6*k,mid=4*k,hard=8*k,target=[easy/scale,mid/scale,hard/scale];
    const context='Ученик решил '+total+' задач. Треть всех задач показалась лёгкой. Из оставшихся задач треть оказалась средней трудности, остальные — сложными.';
    const rows=[step('1а. Какую часть сантиметра составляет '+unit+' мм?',unit+'/10','Вырази целый сантиметр в миллиметрах.'),
      step('1б. Какую часть квадратного сантиметра составляют '+unit+' мм²?',unit+'/100','В квадрате со стороной 1 см поместятся десять рядов по десять квадратных миллиметров.',[{value:unit+'/10',text:'У площади два измерения. Сосчитай и столбцы, и строки.'}]),
      step('2а. '+context+' Сколько лёгких задач?',easy,'Раздели исходное количество на три.'),
      step('2б. '+context+' Сколько сложных задач?',hard,'Из всех задач вычти лёгкие, затем из оставшихся вычти средние.',[{value:easy,text:'Вторая треть относится к остатку после лёгких задач. Пересчитай этот остаток.'},{value:mid,text:'Это количество задач средней трудности. Сколько осталось для сложных?'}]),
      {...step('2в. Задач какой трудности решено больше всего? Укажи словами.', 'сложные','Сравни количества в трёх группах.'),answerFormat:'v5-difficulty'},
      step('2г. На сколько больше сложных задач, чем средних?',hard-mid,'Из большего количества вычти меньшее.',[{value:hard+mid,text:'Сумма считает обе группы вместе. Нужна разница.'}]),
      step('2д. Какую часть всех решённых задач составляют средние?',mid+'/'+total,'Знаменатель относится ко всем решённым задачам.',[{value:'1/3',text:'Треть получилась от оставшихся задач. Здесь сравни с исходным числом задач.'}]),
      step('2е. Какую долю всех задач составляют сложные?',hard+'/'+total,'Сравни число сложных с общим числом задач.')];
    rows.forEach(row=>{if(typeof row.answer==='string'&&row.answer.includes('/'))row.answerFormat='v5-unit-fraction';});
    return {...step('2ж. '+context+' Построй диаграмму в модели: одна клетка означает две задачи. Установи высоты трёх столбцов. Затем укажи число клеток в самом высоком столбце.',hard/scale,
      'Каждые две задачи занимают одну клетку по вертикали.',[{value:hard,text:'Это число задач. Переведи его в клетки по заданному масштабу.'}]),
      graphHeights:target,steps:rows,data:{taskChart:{total,easy,mid,hard,scale}},conditionKey:'taskChart/'+unit+'/'+total};
  }
  const difficult=s=>{const v=String(s).trim().toLowerCase().replace(/ё/g,'е').replace(/[.!,]+$/,'');return /^(сложн(ые|ых|ая|ой|о)|трудн(ые|ых|ая|ой))( задач[аи]?)?$/.test(v)||/^(задачи )?(повышенной|высокой) (трудности|сложности)$/.test(v)||/^(задачи )?(сложного|высокого) уровня$/.test(v);};
  const chartNames=['Лёгкие','Средние','Сложные'],keys=['easyHeight','midHeight','hardHeight'];
  function chartIssue(expected,state){const i=keys.findIndex((key,i)=>state?.[key]!==expected[i]);return i<0?'':'Проверь столбец «'+chartNames[i]+'». Раздели число задач этой группы на 2 и отложи столько клеток от нуля.';}
  function chart(state){
    const values=keys.map(key=>state[key]||0),max=Math.max(4,...values),plotH=Math.min(160,10*max),row=plotH/max,top=12,foot=top+plotH;
    const grid=Array.from({length:max+1},(_,i)=>'<line x1="17" x2="226" y1="'+(foot-row*i)+'" y2="'+(foot-row*i)+'" stroke="#c1d3ce"/>').join('');
    const bars=values.map((v,i)=>'<rect x="'+(29+i*67)+'" y="'+(foot-row*v)+'" width="32" height="'+(v*row)+'" fill="none" stroke="#276456"/>'+Array.from({length:v},(_,n)=>'<rect x="'+(30+i*67)+'" y="'+(foot-row*(n+1)+.6)+'" width="30" height="'+Math.max(.5,row-1.2)+'" fill="#62a99b"/>').join('')+'<text x="'+(45+i*67)+'" y="'+(foot+16)+'" style="font:12px system-ui,sans-serif" text-anchor="middle">'+chartNames[i]+'</text>').join('');
    return '<figure style="margin:.5em 0"><svg class="v5q-printed-geometry" role="img" aria-label="Высоты столбцов в клетках: '+values.join(', ')+'" viewBox="0 0 228 '+(foot+23)+'" style="display:block;width:100%;max-width:330px">'+grid+bars+'</svg><figcaption>Одна клетка вверх — две задачи.</figcaption></figure>';
  }
  function draw(t,s){
    if(t.data.taskChart)return '<figure style="margin:.5em 0"><figcaption>Условия подсчёта</figcaption><p>Всего '+t.data.taskChart.total+' задач. Лёгкие — треть всех, средние — треть остатка.</p></figure>';
    const p=t.data.fractionSelf,i=s?.mode==='learn'?s.step:11;
    if(i>=7)return gridsFigure(p.grids[i-7],i>=10);
    return '<figure style="margin:.5em 0"><figcaption>'+(['Назови верхнее и нижнее числа.','Назови верхнее и нижнее числа.','Назови верхнее и нижнее числа.','Назови верхнее и нижнее числа.','Один полный оборот минутной стрелки — один час.','У ленты '+p.pieces+' одинаковых частей.','Весь ствол длиной '+p.metres+' м разбит на '+p.cuts+' равных отрезков.'][i])+'</figcaption></figure>';
  }
  function explore(t,state){
    if(t.data.fractionSelf){const index=state.gridIndex,white=state.white===1,g=t.data.fractionSelf.grids[index],a=gridInfo(g,white);
      return {title:'Исследуй клетки',controls:[{key:'gridIndex',title:'Фигура',values:['5а','5б','5в','6а','6б'].map((v,i)=>[i,v])},{key:'white',title:'Считать клетки',values:[[0,'Цветные'],[1,'Белые']]}],visual:gridsFigure(g,white),question:'Какую долю занимают выбранные клетки?',answer:a.join('/'),why:'Раздели число выбранных клеток на число всех клеток.'};}
    const high=Math.max(...keys.map(k=>state[k]));return {title:'Построй свою столбчатую диаграмму',controls:keys.map((key,i)=>({key,title:chartNames[i]+' · высота в клетках',min:0,max:24,step:1})),visual:chart(state),question:'Сколько задач изображает самый высокий из твоих столбцов?',answer:2*high,why:'Каждая клетка столбца изображает две задачи.'};
  }
  const api={lessons,generators:{'check-26-1':checkOne,'check-26-2':checkTwo},bounds:{'check-26-1':{gridIndex:[0,4,0],white:[0,1,0]},'check-26-2':Object.fromEntries(keys.map(k=>[k,[0,24,0]]))},draw,explore,gridInfo,difficult,chartIssue};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5CheckFractionParts=api;
})(typeof window!=='undefined'?window:globalThis);
