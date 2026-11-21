/* Author's drawings for Vilenkin et al., grade 5 (2023), part 2, §25, printed p. 8. */
(function(root){
  'use strict';
  const source={part:2,point:25,page:8,requires:['v5f-printed-5-1'],related:['v5f-printed-5-2']};
  const lessons=[
    {...source,number:'5.4',key:'printed-5-4',title:'От центра до точки и от отрезка до границы',
      explanation:'В книге измерь OA, OE, OK и OF на рис. 5.7 и сравни каждую длину с радиусом. На экране свой чертёж с отдельной шкалой. Если расстояние меньше радиуса, точка внутри. При равенстве она на окружности, при большем расстоянии — снаружи. Для подпункта б проследи каждый отрезок до самого конца.',
      worked:['Радиус круглой клумбы 4 м. До первого колышка от центра 3 м, до второго — 6 м.','Первый колышек внутри клумбы, второй снаружи. Натянутая между ними нить встретит край.','Если колышек стоит точно на краю, сама точка крепления уже является общей точкой нити и окружности.'],
      misconception:'Конец отрезка на окружности нельзя считать общей точкой.',reflect:'Чем отрезок с двумя внутренними концами отличается от отрезка, который ведёт изнутри наружу?'},
    {...source,number:'5.5',key:'printed-5-5',title:'Четыре точки двух прямых на одной окружности',
      explanation:'Найди на рисунке каждое место, где прямая пересекает окружность. Соедини его с центром O. Расстояние идёт от O до этой точки.',
      worked:['Пусть расстояние от центра круглой площадки до её края 18 м.','Две дорожки пересекли край в четырёх разных местах. До каждого из этих мест от центра всё те же 18 м.','Длина пути вдоль дорожки между двумя воротами может быть другой.'],
      misconception:'Расстояние от центра до края зависит от того, по какой прямой нашли точку.',reflect:'Что общего у отрезков OA, OB, OM и OK, хотя прямые проведены по-разному?'}
  ];
  const names=['A','E','K','F'];
  const ends=[['A','E'],['A','B'],['F','A']];
  const ink='#17384c',accent='#9c3c17',line='#26627b';
  const err=(value,text)=>({value,text});
  function specimen(seed,random){
    const r=seed?random(16,26):20;
    return {r,lengths:seed?[random(Math.ceil(.55*r),r-3),random(Math.ceil(.40*r),r-5),r+random(4,10),r+random(5,10)]:[12,10,27,30]};
  }
  function diskPoints(f){
    const dirs=[[-.8,-.6],[-.6,.8],[-.6,-.8],[-.8,.6]];
    const p={O:[0,0],B:[0,-1]};
    names.forEach((n,i)=>{p[n]=dirs[i].map(a=>a*f.lengths[i]/f.r);});
    return p;
  }
  const secantPoints={O:[0,0],A:[-.8,-.6],B:[.8,-.6],M:[.6,-.8],K:[.6,.8]};
  function svg(title,inside,desc){
    return '<svg class="v5q-printed-geometry" viewBox="0 0 252 214" role="img" aria-label="'+title+'" style="display:block;width:100%;max-width:24rem;height:auto;margin:auto"><desc>'+desc+'</desc><rect width="252" height="214" rx="7" fill="white"/><g font-family="sans-serif" font-size="16" fill="'+ink+'">'+inside+'</g></svg>';
  }
  function drawing(f,kind,index,joined){
    const disk=kind==='disk',points=disk?diskPoints(f):secantPoints;
    const scale=57, cx=131,cy=105,xy=p=>[cx+p[0]*scale,cy+p[1]*scale];
    const segment=(a,b,color,weight,dash='')=>'<path d="M '+xy(a).join(' ')+' L '+xy(b).join(' ')+'" fill="none" stroke="'+color+'" stroke-width="'+weight+'" '+dash+'/>';
    let body='<circle cx="'+cx+'" cy="'+cy+'" r="'+scale+'" fill="#e5f1ed" stroke="'+line+'" stroke-width="2.3"/>';
    if(!disk){
      body+=segment([-1.68,-.6],[1.6,-.6],line,1.8)+segment([.6,-1.55],[.6,1.55],line,1.8);
    }
    let description=disk?'O — центр, B находится на верхнем краю. ':'O — центр. Прямые идут через пары A, B и M, K. ';
    if(index!==null){
      const [a,b]=joined?ends[index]:['O',(disk?names:['A','B','M','K'])[index]];
      body+=segment(points[a],points[b],accent,3.2);
      description+='Выделен отрезок '+a+b+'. ';
    }
    const offset=disk?{O:[7,13],B:[6,-7],A:[-12,-6],E:[5,15],K:[-12,-5],F:[-12,17]}:{O:[-18,12],A:[-17,-4],B:[8,2],M:[-14,-8],K:[8,15]};
    for(const [n,p] of Object.entries(points)){
      const [x,y]=xy(p),[dx,dy]=offset[n];
      body+='<circle cx="'+x+'" cy="'+y+'" r="3.3" fill="'+ink+'"/><text font-weight="bold" x="'+(x+dx)+'" y="'+(y+dy)+'">'+n+'</text>';
    }
    return svg(disk?'Круг, две внутренние и две наружные точки':'Две прямые и четыре общие точки с окружностью',body,description);
  }
  function ruler(r,value,letter){
    const max=Math.ceil(Math.max(r,value)/5)*5+5,unit=205/max,x=n=>20+n*unit;
    let ticks='';
    for(let n=0;n<=max;n++){
      ticks+='<path d="M '+x(n)+' 33 v '+(n%5?6:10)+'" stroke="#685332"/>';
      if(n%5===0)ticks+='<text x="'+x(n)+'" y="59" text-anchor="middle">'+n+'</text>';
    }
    let markers='';
    for(const [n,s] of [[0,'O'],[value,letter]]){
      markers+='<text x="'+x(n)+'" y="19" text-anchor="middle" fill="'+accent+'" font-weight="bold">'+s+'</text><path d="M '+x(n)+' 20 v 12 m -3 -5 l 3 5 3 -5" fill="none" stroke="'+accent+'" stroke-width="2"/>';
    }
    return '<figure style="max-width:24rem;margin:.4rem auto"><figcaption>Линейка под отрезком O'+letter+' · мм</figcaption><svg class="v5q-printed-geometry" viewBox="0 0 248 66" role="img" aria-label="Шкала в миллиметрах под отрезком O'+letter+'" style="width:100%;display:block"><desc>Центр на нуле. Точка '+letter+' над делением '+value+'.</desc><rect x="7" y="32" width="232" height="31" fill="#fff0ca"/><g font-family="sans-serif" font-size="14" fill="'+ink+'">'+ticks+markers+'</g></svg></figure>';
  }
  function disk(seed,random,step){
    const f=specimen(seed,random), steps=[];
    for(let i=0;i<names.length;i++){
      const n=names[i],d=f.lengths[i],relation=d<f.r?'меньше':'больше';
      steps.push(step('а. Выбери O'+n+' в модели «Приложить линейку». Какова длина отрезка на экранном чертеже в миллиметрах?',d,'Левая метка линейки — центр O. До '+n+' посчитай миллиметровые деления. Полученную длину сравни с радиусом '+f.r+' мм.',[err(f.r,'Это радиус. Прочитай собственное деление точки '+n+'.'),err(2*f.r,'Это диаметр всей окружности. Измерь только отрезок O'+n+'.')]));
      steps.push(step('Сравни O'+n+' с радиусом '+f.r+' мм. На сколько миллиметров длины различаются?',Math.abs(d-f.r),'Найди разность большей и меньшей длин. O'+n+' '+relation+' радиуса.',[err(d,'Это сама длина отрезка. Найди, сколько миллиметров отделяет её от радиуса.')]));
    }
    steps.push(step('б. Сколько общих точек у отрезка AE и окружности?',0,'Проведи пальцем от A до E. Оба конца внутри круга, и отрезок между ними целиком лежит внутри.',[err(2,'Две крайние точки отрезка лежат внутри. Вопрос о точках на самой границе.')]));
    steps.push(step('Сколько общих точек у отрезка AB и окружности?',1,'Дойди до B. Сам конец отрезка тоже ему принадлежит.',[err(0,'Отрезок закончился на B. Точка B принадлежит и отрезку, и окружности.')]));
    return {prefix:seed?'Новый чертёж. ':'Книга, с. 8, рис. 5.7 на с. 7. Измерь рисунок в своём учебнике. Здесь измеряем отдельный чертёж. ',
      prompt:'б. Отрезок FA идёт от наружной точки к внутренней. Сколько раз он встретит границу круга?',inputPrompt:'Число общих точек',answer:1,steps,
      errors:[err(2,'Если продолжить прямую за A, встретится и другой край. Остановись в точке A, как требует отрезок FA.'),err(0,'F находится снаружи, A внутри. Проследи переход через край.')],
      data:{diskDistances:f},conditionKey:'disk/'+f.r+'/'+f.lengths.join('/')};
  }
  function secants(seed,random,step){
    const r=seed?random(11,39):25,f={r},cm=Math.floor(r/10),mm=r%10;
    const feedback=[err(2*r,'Такова длина диаметра. От центра до точки окружности идёт один радиус.'),err(cm+mm,'Сантиметры и миллиметры сначала приведи к одной единице.')];
    const steps=[step('Радиус '+cm+' см '+mm+' мм. Сколько это миллиметров?',r,'В каждом сантиметре 10 мм. Сложи десятки миллиметров и оставшиеся единицы.',feedback)];
    for(const n of ['A','B','M'])steps.push(step('Найди O'+n+' в миллиметрах.',r,'Точка '+n+' лежит на окружности. Отрезок от O до неё является радиусом.',feedback));
    return {prompt:'Две прямые встретили окружность в точках A, B, M и K. Радиус '+cm+' см '+mm+' мм. Чему равно OK в миллиметрах? В шагах проверь и три остальные длины.',inputPrompt:'OK в мм',answer:r,steps,errors:feedback,data:{secantRadii:f},conditionKey:'secants/'+r};
  }
  const choice=(key,title,labels)=>({key,title,values:labels.map((s,i)=>[i,s])});
  function explore(task,state){
    const f=task.data.diskDistances;
    if(f){
      const joined=Boolean(state.mode),i=joined?state.segment:state.point;
      return {title:'Приложить линейку или обвести отрезок',controls:[choice('mode','Исследование',['Приложить линейку','Проверить отрезок']),joined?choice('segment','Отрезок',ends.map(p=>p.join(''))):choice('point','Измерить',names.map(n=>'O'+n))],
        visual:drawing(f,'disk',i,joined)+(joined?'':ruler(f.r,f.lengths[i],names[i])),question:joined?'Сколько общих точек у выделенного отрезка и окружности?':'Радиус '+f.r+' мм. На сколько миллиметров измеренная длина отличается от радиуса?',answer:joined?[0,1,1][i]:Math.abs(f.r-f.lengths[i]),
        why:joined?['Оба конца и весь отрезок между ними находятся внутри круга.','Конец B принадлежит границе. Других общих точек у этого отрезка и окружности нет.','По пути снаружи внутрь этот отрезок встречает край один раз.'][i]:'Сравни показание под концом отрезка с радиусом '+f.r+' мм.'};
    }
    const r=task.data.secantRadii.r,i=state.point,n=['A','B','M','K'][i];
    return {title:'Проведи радиус к каждой точке',controls:[choice('point','Соединить с O',['A','B','M','K'])],visual:drawing({r},'secants',i,false),question:'Радиус окружности '+r+' мм. Сколько миллиметров в O'+n+'?',answer:r,why:'Отрезок O'+n+' идёт от центра до края и имеет длину радиуса.'};
  }
  function taskDrawing(task){
    return task.data.diskDistances?drawing(task.data.diskDistances,'disk',null,false):drawing(task.data.secantRadii,'secants',null,false);
  }
  const api={lessons,generators:{'5.4':disk,'5.5':secants},bounds:{'5.4':{mode:[0,1,0],point:[0,3,0],segment:[0,2,0]},'5.5':{point:[0,3,0]}},taskDrawing,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5Chords=api;
})(typeof window!=='undefined'?window:globalThis);
