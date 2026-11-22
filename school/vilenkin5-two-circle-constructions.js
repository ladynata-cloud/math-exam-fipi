/* Виленкин и соавторы, 2023, часть 2, §26, с. 17. */
(function(root){
  'use strict';
  const deps=()=>typeof module!=='undefined'&&module.exports?require('./vilenkin5-circle-crossings.js'):root.Vilenkin5CircleCrossings;
  const less=(n,title,expl,ex,claim)=>({number:'5.'+n,key:'printed-5-'+n,part:2,point:26,page:17,title,requires:['v5f-printed-5-7'],related:['v5f-printed-5-31'],explanation:expl,worked:[ex],misconception:claim,reflect:'Перечерти конструкцию на бумаге. Как можно проверить оба расстояния циркулем?'});
  const lessons=[
    less(75,'Точки на одинаковом расстоянии от M и N','Проведи отрезок MN. Задай раствор циркуля и опиши окружность с центром M. Сохрани раствор и опиши вторую с центром N. Отметь все общие точки.','Если центры отстоят на 6 см и нужен радиус 6 см, по обе стороны от прямой центров получится по одному пересечению.','Построение закончено, когда найдена верхняя точка пересечения.'),
    less(76,'Какие точки окружности удалены от P на заданное расстояние?','Первая окружность уже задана. Точки на нужном расстоянии от P образуют другую окружность. Пересечение должно подходить под оба условия.','Для окружности радиуса 2 см и точки в 3 см от центра можно искать точки в 2 см от P. В этом примере две окружности пересекаются дважды.','Достаточно отложить нужное расстояние от P вдоль прямой OP.'),
    less(77,'Подбери одинаковые радиусы для трёх случаев','Сохраняй расстояние между центрами. Для внешнего касания два равных радиуса вместе заполняют весь отрезок центров. Уменьши их — возникнет промежуток. Увеличь — появятся две общие точки.','При расстоянии между центрами 10 см растворы по 5 см дают касание. По 3 см дают промежуток, а по 6 см — два пересечения.','Для двух общих точек существует только одно подходящее значение радиуса.')
  ];
  const labels=['M','N'],names=(n)=>n===76?['O','P']:labels,cm=mm=>String(mm/10).replace('.',',');
  function numberOf(a,b,d){return deps().geometry({a,b},d).length;}
  const getAnswer=(value,q)=>{if(!q||q.d<=0||q.n<=0)return false;const twiceMm=20n*BigInt(q.n),dist=BigInt(value.distance)*BigInt(q.d);return value.count===1?twiceMm===dist:value.count===0?twiceMm<dist:twiceMm>dist;};
  function generate(n,seed,r,step){
    if(n===77){
      const distance=seed?20*r(2,6):80,half=distance/20,order=seed?[1,2,0]:[1,0,2];
      const tasks=order.map((count,i)=>{
        const phrase=['без общих точек','одна общая точка','две общие точки'][count];
        const answer=count===1?half:count===0?half-1:half+1;
        return {...step('Центры M и N находятся в '+cm(distance)+' см друг от друга. Подбери окружности одинакового радиуса, чтобы получилось: '+phrase+'. Введи любой подходящий положительный радиус в сантиметрах.',answer,'Сравни сумму двух одинаковых радиусов с длиной MN.',[{value:0,text:'При нулевом радиусе окружность вырождается в точку. Нужен положительный раствор циркуля.'},...(count===1?[]:[{value:half,text:'Так окружности касаются. Для этого подпункта '+(count===0?'уменьши':'увеличь')+' одинаковые радиусы.'}])]),inputPrompt:'Один подходящий радиус, см',answerFormat:'v5-any-common-radius',locusTest:{count,distance}};
      });return {...tasks.pop(),steps:tasks,data:{circleLoci:{n,d:distance,order}},conditionKey:'common-radius/'+distance+'/'+order.join(',')};
    }
    let a,b,d;
    if(n===75){d=seed?20*r(2,5):70;const shift=seed?[0,-10,10,20][r(0,3)]:35;a=b=d/2+shift;}
    else if(!seed){a=15;b=25;d=30;}
    else {a=5*r(2,6);b=5*r(4,8);const cases=[a+b+5,a+b,Math.max(5,Math.abs(a-b)+5),a+b-5];d=cases[r(0,3)];}
    const x={n,a,b,d},count=numberOf(a,b,d),pair=names(n);
    const radiusAnswers=n===75?[a/10,b/10]:[a,b],u=n===75?'см':'мм';
    const intro=n===75?'Построй отрезок MN длиной '+cm(d)+' см. Найди точки на расстоянии '+cm(a)+' см от каждого из его концов.':!seed?'Дана окружность с центром O радиуса 1 см 5 мм. Отметь P в 3 см от O. Построй на окружности точки на расстоянии 25 мм от P.':'Построй окружность с центром O радиуса '+a+' мм. Расстояние OP равно '+d+' мм. Ищи на окружности точки в '+b+' мм от P.';
    const steps=[step(intro+' Какой раствор циркуля нужен в центре '+pair[0]+'? Ответ в '+u+'.',radiusAnswers[0],'Первый радиус определяет расстояние от '+pair[0]+' до искомой точки.',n===76?[{value:1.5,text:'Это сантиметры. В ответе нужны миллиметры.'}]:[]),step('Какой раствор в '+u+' нужен для второй окружности с центром '+pair[1]+'?',radiusAnswers[1],'Прочитай требуемое расстояние от второго центра.',a===b?[]:[{value:radiusAnswers[0],text:'Это первый радиус. От P до искомой точки дано другое расстояние.'}])];
    return {steps,prompt:intro+' Начерти обе окружности в тетради или выставь оба радиуса в модели. Сколько общих точек получилось?',answer:count,inputPrompt:'Число общих точек',why:'Каждое общее пересечение находится одновременно на заданных расстояниях от двух центров.',errors:count===2?[{value:1,text:'Посмотри по другую сторону прямой центров. Две точки, симметричные относительно неё, проходят обе проверки.'}]:[{value:2,text:'Посмотри, есть ли два отдельных пересечения. Проверь расстояние центров и сумму радиусов.'}],data:{circleLoci:x},conditionKey:'two-circles/'+n+'/'+a+'/'+b+'/'+d};
  }
  function drawing(p,a,b,which){
    const d=p.d,left=Math.min(0,-a,d-b),right=Math.max(d,a,d+b),top=Math.max(a,b,5),k=Math.min(225/(right-left),134/(2*top)),cx=145-(left+right)*k/2,cy=91;
    const point=(x,y,mark,dy,dx=0)=>'<circle cx="'+x+'" cy="'+y+'" r="3" fill="#173b4e"/><text x="'+(x+dx)+'" y="'+(y+dy)+'" text-anchor="middle" font-size="12" fill="#173b4e" paint-order="stroke" stroke="white" stroke-width="3">'+mark+'</text>';
    const ring=(x,rad,color,dash)=>rad?'<circle cx="'+x+'" cy="'+cy+'" r="'+(rad*k)+'" fill="none" stroke="'+color+'" stroke-width="2.2" '+(dash?'stroke-dasharray="5 3"':'')+'/>':'';
    const start=cx,end=cx+d*k,ns=names(p.n);
    let parts='<path d="M'+start+' '+cy+'H'+end+'" stroke="#72838a" stroke-width="1.5"/>'+ring(start,a,'#235779',false)+ring(end,b,'#af501f',true);
    const points=a>0&&b>0?deps().geometry({a,b},d):[];
    points.forEach(([x,y],i)=>{if(!which)return;parts+=point(cx+x*k,cy+y*k,points.length===1?'K':i?'Y':'X',y>0?14:-8);});
    parts+=point(start,cy,ns[0],16,-5)+point(end,cy,ns[1],16,5);
    return '<figure style="margin:.4em 0"><svg role="img" aria-label="Построение на отрезке центров" viewBox="0 0 290 184" style="width:100%;max-width:400px;display:block;margin:auto">'+parts+'</svg><figcaption>'+ns.join('')+' = '+cm(d)+' см. Первая окружность показана сплошной линией, вторая — штриховой.</figcaption></figure>';
  }
  function explore(task,s){
    const p=task.data.circleLoci,same=p.n===77,a=s.a,b=same?a:s.b;
    const controls=[{key:'a',title:same?'Общий раствор, мм':'Раствор в центре '+names(p.n)[0]+', мм',min:1,max:140,step:1}];
    if(!same)controls.push({key:'b',title:'Раствор в центре '+names(p.n)[1]+', мм',min:1,max:140,step:1});
    controls.push({key:'mark',title:'Пересечения',values:[[0,'Рассмотреть окружности'],[1,'Отметить общие точки'] ]});
    return {title:'Раскрой циркуль и построй окружности',controls,visual:drawing(p,a,b,s.mark),question:'Сколько общих точек у окружностей с выбранными радиусами?',answer:numberOf(a,b,p.d),why:'Общая точка должна лежать сразу на сплошной и штриховой окружностях.'};
  }
  function draw(task){const p=task.data.circleLoci;return drawing(p,p.n===76?p.a:0,0,0);}
  const bounds={};[75,76,77].forEach(n=>{bounds['5.'+n]={a:[1,140,10],...(n===77?{}:{b:[1,140,10]}),mark:[0,1,0]};});
  const api={lessons,generators:Object.fromEntries([75,76,77].map(n=>['5.'+n,(seed,r,f)=>generate(n,seed,r,f)])),bounds,draw,explore,getAnswer};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5TwoCircleConstructions=api;
})(typeof window!=='undefined'?window:globalThis);
