/* Виленкин и соавторы, Математика 5, часть 2, §26, печатная с. 19. */
(function(root){
  'use strict';
  const lessons=[
    {number:'5.96',key:'printed-5-96',title:'Сравниваем площади четырёх треугольников',
      requires:['v5f-printed-5-63'],related:['v5f-project-room'],
      explanation:'Выбери треугольник на рисунке. Найди его основание и высоту. Если основанием служит целая сторона прямоугольника, посмотри, где лежит третья вершина: на противоположной стороне или в центре.',
      worked:['У прямоугольника со сторонами 8 и 4 см площадь 32 см². Диагональ отсекает 16 см². Если передвинуть вершину треугольника с противоположной стороны в центр, высота уменьшится вдвое. С тем же основанием площадь станет 8 см².'],
      misconception:'У треугольников одинаковая площадь только тогда, когда они одинаково повёрнуты.',reflect:'Могут ли отличаться длины оснований у двух треугольников одинаковой площади?'},
    {number:'5.97',key:'printed-5-97',title:'Сколько груш осталось в магазине?',
      requires:['v5f-printed-5-94'],related:['v5f-table-read'],
      explanation:'Из начальной массы сначала вычти первую покупку. Затем учти, что ещё несколько покупателей берут поровну. Проверить возможное число покупателей можно так: хватит ли товара на последнюю покупку?',
      worked:['Было 32 кг яблок. Сначала купили 6 кг, затем несколько человек взяли по 4 кг. После шести таких покупок останется 2 кг, а на седьмую покупку товара уже не хватит.'],
      misconception:'Число покупателей может быть любым, потому что это буква.',reflect:'Что означает отрицательный остаток в модели магазина?'}
  ].map(row=>({...row,part:2,point:26,page:19}));
  const names=['MBN','MNC','MNO','NCO'];
  function triangleTask(seed,r,step){
    const w=seed?2*r(3,9):10,h=seed?2*r(2,6):6,total=w*h;
    const why=['Используй нижнюю сторону MB. Высота из N равна полной высоте прямоугольника.','Основание NC — верхняя сторона. Высота из M достигает нижней стороны.','Основание MN — левая сторона. Расстояние от центра O до неё равно половине ширины.','Основание NC — верхняя сторона. Расстояние от O до неё равно половине высоты.'];
    const rows=names.map((name,i)=>step('Найди площадь треугольника '+name+' в квадратных сантиметрах.',total/(i<2?2:4),why[i],[
      {value:total,text:'Это площадь прямоугольника целиком. Найди, какая его часть закрашена.'},
      {value:total/(i<2?4:2),text:i<2?'Третья вершина находится на противоположной стороне, а не в центре. Проверь высоту.':'Третья вершина — центр O. От него до выбранной стороны только половина соответствующего размера.'}]));
    return {...step('Составь две пары треугольников с равными площадями. Запиши, например, названия через =, а пары раздели точкой с запятой.',
      'MBN=MNC;MNO=NCO','Сравни четыре полученные площади. В каждой паре должны совпадать два числа.',[]),answerFormat:'v5-triangle-area-pairs',
      steps:rows,data:{diagonalAreas:{w,h}},conditionKey:'diagonalAreas/'+w+'/'+h};
  }
  function pairs(value){
    const text=String(value).toUpperCase().replace(/[МНСВО]/g,c=>({'М':'M','Н':'N','С':'C','В':'B','О':'O'})[c]).replace(/△|Δ/g,'').trim();
    const match=/^([MNBCO]{3})\s*=\s*([MNBCO]{3})\s*[;,]\s*([MNBCO]{3})\s*=\s*([MNBCO]{3})$/.exec(text);
    if(!match)return null;
    const signatures=match.slice(1).map(s=>s.split('').sort().join(''));
    const valid=names.map(s=>s.split('').sort().join(''));
    if(signatures.some(s=>!valid.includes(s))||new Set(signatures).size!==4)return null;
    return [[signatures[0],signatures[1]].sort().join('='),[signatures[2],signatures[3]].sort().join('=')].sort().join(';');
  }
  function stockExpression(value,linear){
    let s=String(value).trim().toLowerCase().replace(/^(?:r|остаток)\s*=/,'').replace(/н/g,'n');
    if(!s||/[xхv]/.test(s))return null;
    const co=linear.coefficients(s.replace(/n/g,'x'));return co&&co[2]===0?co.slice(0,2):null;
  }
  function stockTask(seed,r,step){
    const first=seed?r(3,9):7,each=seed?r(3,8):5,limit=seed?r(6,16):12,left=seed?r(0,each-1):3;
    const initial=first+each*limit+left,available=initial-first;
    const context='У продавца '+initial+' кг груш. Первый покупатель взял '+first+' кг. После него ещё n покупателей берут по '+each+' кг.';
    const formula={...step(context+' Запиши выражение для остатка в килограммах.',available+'-'+each+'n','Сначала вычти первую покупку. Затем вычти массу всех одинаковых покупок.',[
      {value:initial+'|'+(-each),text:'Ты вычел все покупки по '+each+' кг. Учти отдельно первого покупателя.'},
      {value:available+'|-1',text:'n считает людей. Умножь их число на массу покупки одного человека.'},
      {value:available+'|'+each,text:'После покупки запас уменьшается. Посмотри на знак перед слагаемым с n.'}]),answerFormat:'v5-stock-expression'};
    return {...step('Какое число n возможно? Запиши два края ряда через точку с запятой: от случая, когда после первого покупателя никто не пришёл, до последней полной покупки.',
      [0,limit],'Покупателей считаем целыми числами. Проверь, сколько целых покупок помещается в остатке после первого посетителя.',
      [{value:[1,limit],text:'Учти и случай, когда после первого человека больше никто не пришёл.'},{value:[0,limit+1],text:'Проверь последнюю покупку: хватит ли груш ещё одному человеку на полную порцию?'}]),
      steps:[formula,step('Если после первого покупателя пришли три человека, сколько килограммов осталось?',available-3*each,'Из запаса после первой покупки вычти три одинаковые покупки.',
      [{value:initial-3*each,text:'Из начального запаса нужно вычесть ещё покупку первого посетителя.'}])],
      data:{pearStock:{first,each,initial,limit}},conditionKey:'pearStock/'+[initial,first,each].join('/')};
  }
  const x0=28,y0=21;
  function diagram(data,index){
    const {w,h}=data,scale=Math.min(208/w,106/h),ww=w*scale,hh=h*scale;
    const p={M:[x0,y0+hh],B:[x0+ww,y0+hh],N:[x0,y0],C:[x0+ww,y0],O:[x0+ww/2,y0+hh/2]};
    const poly=s=>s.split('').map(k=>p[k].join(',')).join(' ');
    const line=(a,b,color,dash='')=>'<line x1="'+p[a][0]+'" y1="'+p[a][1]+'" x2="'+p[b][0]+'" y2="'+p[b][1]+'" stroke="'+color+'" stroke-width="1.6" '+dash+'/>';
    const label=(x,y,t)=>'<text x="'+x+'" y="'+y+'" fill="#253e49" font-size="13" text-anchor="middle">'+t+'</text>';
    const highlighted=names[index];
    const shape=highlighted?'<polygon points="'+poly(highlighted)+'" fill="#a8d9cb"/>':'';
    return '<figure style="margin:.5em 0"><svg role="img" aria-label="Прямоугольник с центром O и диагоналями" viewBox="0 0 '+(ww+62)+' '+(hh+72)+'" style="width:100%;max-height:220px;display:block"><polygon points="'+poly('MBCN')+'" fill="#f9fbf9"/>'+shape+['MB','BC','CN','NM','MC','NB'].map(s=>line(s[0],s[1],'#315c69')).join('')+'<circle cx="'+p.O[0]+'" cy="'+p.O[1]+'" r="2.6" fill="#273937"/>'+label(x0-8,y0-4,'N')+label(x0+ww+6,y0-4,'C')+label(x0-8,y0+hh+15,'M')+label(x0+ww+8,y0+hh+15,'B')+label(p.O[0]+3,p.O[1]+17,'O')+label(x0+ww/2,y0+hh+29,w+' см')+label(x0+ww+17,y0+hh/2+3,h+' см')+'</svg><figcaption>'+(highlighted?'Выделен треугольник '+highlighted+'. ':'')+'MB = '+w+' см, MN = '+h+' см. O — точка пересечения диагоналей.</figcaption></figure>';
  }
  function shop(p,n){
    return '<figure style="margin:.5em 0"><figcaption>Груши на прилавке</figcaption><p>Было '+p.initial+' кг. Первый покупатель взял '+p.first+' кг.</p><p>'+(n==null?'Затем n покупателей':('Затем покупателей: '+n))+' · по '+p.each+' кг каждому.</p></figure>';
  }
  function draw(t,s){
    if(t.data.diagonalAreas)return diagram(t.data.diagonalAreas,s?.mode==='learn'?s.step:4);
    return shop(t.data.pearStock,s?.mode==='learn'&&s.step===1?3:null);
  }
  function explore(t,state){
    if(t.data.diagonalAreas){const p=t.data.diagonalAreas,i=state.figure;return {title:'Выбери треугольник',controls:[{key:'figure',title:'Какую фигуру закрасить?',values:names.map((name,i)=>[i,name])}],visual:diagram(p,i),question:'Какую площадь занимает выделенная часть, в см²?',answer:p.w*p.h/(i<2?2:4),why:'Сравни основание и высоту треугольника с размерами прямоугольника.'};}
    const p=t.data.pearStock,n=state.buyers;return {title:'Проверь запас на прилавке',controls:[{key:'buyers',title:'Покупателей после первого',min:0,max:6}],visual:shop(p,n),question:'Сколько килограммов груш осталось?',answer:p.initial-p.first-n*p.each,why:'Количество одинаковых покупок умножь на массу каждой и учти первую покупку.'};
  }
  const api={lessons,generators:{'5.96':triangleTask,'5.97':stockTask},bounds:{'5.96':{figure:[0,3,0]},'5.97':{buyers:[0,6,3]}},draw,explore,pairs,stockExpression};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5TrianglesAndStock=api;
})(typeof window!=='undefined'?window:globalThis);
