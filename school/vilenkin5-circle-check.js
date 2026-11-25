/* Часть 2, §25, печатная с. 11. Три задания одной проверочной работы. */
(function(root){
  'use strict';
  const base={part:2,point:25,page:11,sourceCheck:true,related:[]},letters=['A','B','C'],dirs=['вправо','вправо вверх','вверх','влево вверх','влево','влево вниз','вниз','вправо вниз'];
  function check(n,title,requires,explanation,worked,misconception,reflect){
    return {...base,number:'check-25-'+n,key:'printed-check-25-'+n,title:'Проверочная работа §25 · задание '+n+' · '+title,requires,explanation,worked,misconception,reflect};
  }
  const lessons=[
    check(1,'радиус и диаметр',['v5f-printed-5-33'],'Перед тобой четыре столбца одной таблицы. В каждом заполняется своя клетка. От центра до края проходит один радиус, а от края до края через центр — два.',
      ['В одном столбце радиус равен 17 см. Для диаметра берём 17 + 17 = 34 см.','Если в другом столбце диаметр равен 106 см, радиус равен 106 : 2 = 53 см.'],'Связь между радиусом и диаметром меняется от столбца к столбцу.','Как проверить каждый столбец одним и тем же равенством?'),
    check(2,'на окружности, внутри и снаружи',['v5f-printed-5-29','v5f-printed-5-30'],'Начерти окружность с центром O. В части а отметь на ней три разные точки A, B и C. В части б отметь ещё две точки R и T вне линии окружности. Они могут быть внутри круга или снаружи. Модель позволяет выбрать свои метки и решать по своему построению.',
      ['При радиусе 6 см точка в 5 см от центра внутри круга.','Точка в 7 см снаружи, а в 6 см на самой окружности.','Если точка совпала с центром, расстояние до центра равно нулю.'], 'Обе точки вне окружности обязательно находятся снаружи всего круга.','Могут ли две точки по разные стороны линии окружности обе не лежать на самой линии?'),
    check(3,'две окружности по размерам в см и мм',['v5f-printed-5-31'],'Вначале отметь два центра на заданном расстоянии. Переведи оба радиуса в одну единицу. Нарисуй обе полные окружности. Проверь по рисунку и по длинам, достигает ли одна окружность другой и не лежит ли одна целиком внутри другой.',
      ['При расстоянии 40 мм и радиусах 31 мм и 19 мм сумма 50 мм, разность 12 мм.','Расстояние 40 мм строго больше 12 и меньше 50. Есть две общие точки, одна по каждую сторону от прямой центров.'], 'Если сумма радиусов больше расстояния между центрами, общих точек всегда две.','Что изменится, если расстояние между центрами уменьшится до разности радиусов?')
  ];
  function diameters(seed,r,step){
    const a=seed?r(4,47):13,b=seed?2*r(11,73):82,c=seed?2*r(76,139):196,d=seed?r(143,347):285;
    const cols=[a,b,c,d],result=[2*a,b/2,c/2,2*d];
    const steps=cols.map((n,i)=>step('Столбец '+(i+1)+'. '+([0,3].includes(i)?'Радиус '+n+' см. Каков диаметр?':'Диаметр '+n+' см. Каков радиус?'),result[i],[0,3].includes(i)?'Сложи два радиуса.':'В диаметре два одинаковых радиуса. Раздели его пополам.',[{value:n,text:'Это известная величина столбца. Заполни вторую клетку.'}]));
    return {steps,prompt:'Заполни пустые клетки таблицы по порядку столбцов слева направо.',inputPrompt:'Четыре числа через точку с запятой',answer:result,answerFormat:'v5-list',errors:[],why:'Каждый диаметр ровно вдвое длиннее радиуса той же окружности.',data:{checkDiameter:cols},conditionKey:'diameters/'+cols.join('/')};
  }
  function table(values){
    return '<table style="width:100%;max-width:26rem;border-collapse:collapse;text-align:center"><caption>Все длины в сантиметрах</caption><thead><tr><th>Столбец</th><th>Диаметр</th><th>Радиус</th></tr></thead><tbody>'+values.map((x,i)=>'<tr><th>'+(i+1)+'</th><td>'+([0,3].includes(i)?'□':x)+'</td><td>'+([1,2].includes(i)?'□':x)+'</td></tr>').join('')+'</tbody></table>';
  }
  function twoRadii(r){
    return '<svg role="img" aria-label="Диаметр разделён центром на два равных радиуса" viewBox="0 0 230 59" style="display:block;width:100%;max-width:19rem"><path d="M16 30H115" stroke="#27636e" stroke-width="6"/><path d="M115 30H214" stroke="#a75331" stroke-width="6"/><circle cx="115" cy="30" r="4" fill="#223a41"/><text x="115" y="54" text-anchor="middle">O</text><text x="62" y="19" text-anchor="middle">'+r+' см</text><text x="165" y="19" text-anchor="middle">'+r+' см</text></svg>';
  }
  function pickSeed(d){return 650000+((((((d.radius-2)*8+d.a)*8+d.b)*8+d.c)*9+d.r)*9+d.t);}
  function source(seed,rand){
    if(seed>=650000&&seed<940304){let z=seed-650000;const t=z%9;z=Math.floor(z/9);const r=z%9;z=Math.floor(z/9);const c=z%8;z=Math.floor(z/8);const b=z%8;z=Math.floor(z/8);const a=z%8,radius=2+Math.floor(z/8);if(new Set([a,b,c]).size===3&&r!==t)return {radius,a,b,c,r,t,own:true};}
    if(!seed)return {radius:4,a:0,b:2,c:4,r:2,t:7,own:false};
    const a=rand(0,7),b=(a+rand(1,3))%8,c=(a+rand(4,7))%8,r=rand(0,8),t=(r+rand(1,8))%9;return {radius:rand(2,8),a,b,c,r,t,own:false};
  }
  function off(slot,radius){return {dist:slot===0?0:slot<5?radius-1:slot<9?radius+1:radius,dir:slot===0?0:2*((slot-1)%4)+1};}
  const placeCode=(dist,r)=>dist<r?1:dist===r?2:3;
  function locationTask(seed,rand,step){
    const d=source(seed,rand),r=d.radius,codeR=placeCode(off(d.r,r).dist,r),codeT=placeCode(off(d.t,r).dist,r);
    const code='Введи 1 для точки внутри, 2 для точки на окружности и 3 для точки снаружи.';
    return {steps:[step('а. Построй окружность радиуса '+r+' см. Отметь три разные точки A, B и C на линии. Каково расстояние от O до каждой такой точки, в см?',r,'Ножки циркуля раскрыты на один радиус.',[{value:2*r,text:'Это диаметр. Здесь один конец отрезка находится прямо в центре.'}]),
      {...step('б. Нарисуй R и T вне линии окружности. Для ответа возьми их расположение на рисунке, либо сперва перенеси свой рисунок из модели. '+code+' Дай коды R; T.',[codeR,codeT],'Сравни расстояние до каждой точки с радиусом. Возможны и две внутренние, и две наружные точки.'),answerFormat:'v5-pair'},
      {...step('в. ON = '+(r+1)+' см, OK = '+(r-1)+' см. Радиус '+r+' см. '+code+' Запиши коды N; K.',[3,1],'Сравни сначала ON с радиусом, затем OK с тем же радиусом.',[{value:[1,3],text:'Сначала идёт N, которая дальше от центра, затем K, которая ближе.'}]),answerFormat:'v5-pair'}],
      prompt:'г. Точка не лежит на самой окружности. Может ли расстояние от O до неё быть (1) меньше радиуса, (2) больше радиуса, (3) равно радиусу? Для каждого случая введи 1 — да или 0 — нет.',
      constructionIntro:d.own?'Твой рисунок. ':'Один допустимый рисунок к проверочной. ',answer:[1,1,0],answerFormat:'v5-triple',inputPrompt:'Три ответа: 1 или 0',errors:[{value:[0,1,0],text:'Внутри круга тоже есть точки вне линии окружности. Попробуй поставить R ближе к O.'},{value:[1,1,1],text:'При равенстве расстояния радиусу точка окажется прямо на окружности.'}],
      why:'Внутри расстояние меньше радиуса, снаружи больше. Равенство — признак точки на окружности.',data:{checkPositions:d},conditionKey:'positions/'+[r,d.a,d.b,d.c,d.r,d.t].join('/')};
  }
  function drawingConfig(d,s={}){
    const read=k=>s[k]===undefined||s[k]<0?d[k]:s[k];
    return {radius:d.radius,a:read('a'),b:read('b'),c:read('c'),r:read('r'),t:read('t'),opening:s.opening>0?s.opening:d.radius};
  }
  function selection(t,s){const d=drawingConfig(t.data.checkPositions,s);return d.radius===d.opening&&new Set([d.a,d.b,d.c]).size===3&&d.r!==d.t&&d.r<9&&d.t<9?pickSeed(d):null;}
  function points(d,phase){
    const names=phase===0?['A','B','C']:phase===1?['R','T']:['N','K'];
    const positions=phase===0?[d.a,d.b,d.c].map(dir=>({dist:d.opening,dir})):phase===1?[d.r,d.t].map(slot=>off(slot,d.radius)):[{dist:d.radius+1,dir:0},{dist:d.radius-1,dir:4}];
    const cx=113,cy=103,k=73/Math.max(d.radius+1,d.opening),groups=new Map([['0',{names:['O'],dist:0,dir:0}]]);
    positions.forEach(({dist,dir},i)=>{const id=!dist?'0':dist+'/'+dir;if(!groups.has(id))groups.set(id,{names:[],dist,dir});groups.get(id).names.push(names[i]);});
    let marks='';for(const {names,dist,dir} of groups.values()){
      const angle=dir*Math.PI/4,x=cx+k*dist*Math.cos(angle),y=cy-k*dist*Math.sin(angle),left=Math.cos(angle)<-.1;
      marks+='<circle cx="'+x+'" cy="'+y+'" r="3.2" fill="#19424a"/><text x="'+(x+(left?-7:7))+'" y="'+(y+(Math.sin(angle)<-.2?14:-6))+'" text-anchor="'+(left?'end':'start')+'" font-size="13" paint-order="stroke" stroke="white" stroke-width="3" fill="#183541">'+names.join(',')+'</text>';
    }
    return '<figure style="margin:.4em 0"><svg role="img" aria-label="Окружность радиуса '+d.radius+' см, центр O, точки '+names.join(', ')+'" viewBox="0 0 226 205" style="display:block;width:100%;max-width:18rem"><circle cx="'+cx+'" cy="'+cy+'" r="'+k*d.radius+'" stroke="#286779" stroke-width="2.5" fill="#ebf5f3"/>'+marks+'</svg><figcaption>'+names.map((n,i)=>'O'+n+' = '+positions[i].dist+' см').join(', ')+'. Радиус '+d.radius+' см.</figcaption></figure>';
  }
  function circlePair(seed,r,step){
    const a=seed?r(14,40):32,b=seed?r(13,39):28,gap=Math.abs(a-b),sum=a+b,dist=seed?[r(gap+1,sum-1),sum,sum+r(1,8),gap||1][seed%4]:30,count=intersect(a,b,dist);
    const length=n=>Math.floor(n/10)+' см '+n%10+' мм',d={a,b,dist};
    return {steps:[step('Между центрами O и P '+length(dist)+'. Переведи это расстояние в миллиметры.',dist,'Один сантиметр равен десяти миллиметрам.',[]),
      {...step('Радиус окружности с центром O равен '+length(a)+', с центром P — '+length(b)+'. Запиши оба радиуса в мм по порядку O; P.',[a,b],'Сложи полные десятки миллиметров и оставшиеся миллиметры.'),answerFormat:'v5-pair'},
      {...step('На сколько миллиметров хватает радиусов вместе и на сколько один радиус больше другого? Запиши сумму; разность.',[a+b,Math.abs(a-b)],'Расстояние центров сравнивается с суммой и с разностью радиусов.'),answerFormat:'v5-pair'}],
      prompt:'Начерти обе окружности. Центры на расстоянии '+length(dist)+', радиусы '+length(a)+' и '+length(b)+'. Сколько у них общих точек?',answer:count,inputPrompt:'Число точек',errors:[0,1,2].filter(n=>n!==count).map(n=>({value:n,text:n===1?'Одна общая точка бывает при касании. Проверь равенство одной из границ.':n===0?'Сравни OP с суммой и разностью радиусов. Отметь места касания или пересечения.':'Две общие точки есть, когда OP строго между разностью и суммой радиусов. Проверь границы.'})),why:count===2?gap+' < '+dist+' < '+sum+'. Есть две общие точки.':count===1?'Расстояние OP равно '+(dist===sum?'сумме':'разности')+' радиусов. Получилось касание.':'Расстояние центров больше суммы радиусов. Между окружностями есть промежуток.',data:{checkCirclePair:d},conditionKey:'check-25-pair/'+a+'/'+b+'/'+dist};
  }
  function intersect(a,b,d){
    if(d===0)return a===b?Infinity:0;
    if(d>a+b||d<Math.abs(a-b))return 0;
    return d===a+b||d===Math.abs(a-b)?1:2;
  }
  function pairDrawing(data,separation){
    const {a,b}=data,d=separation,scale=Math.min(225/(Math.max(a,d+b)+a),147/(2*Math.max(a,b))),ox=15+a*scale,px=ox+d*scale,cy=91;
    const n=intersect(a,b,d);
    const circle=(x,r,color)=>'<circle cx="'+x+'" cy="'+cy+'" r="'+r*scale+'" fill="none" stroke="'+color+'" stroke-width="2.5"/>';
    let marks='';
    if(n===1||n===2){
      const x=(a*a-b*b+d*d)/(2*d),dy=Math.sqrt(Math.max(0,a*a-x*x));
      for(const v of n===1?[0]:[-dy,dy])marks+='<circle cx="'+(ox+x*scale)+'" cy="'+(cy+v*scale)+'" r="3.4" fill="#9b3f20"/>';
    }
    const point=(x,n,offset)=>'<circle cx="'+x+'" cy="'+cy+'" r="2.3" fill="#232c36"/><text x="'+(x+offset)+'" y="'+(cy+16)+'" text-anchor="middle" font-size="13" stroke="white" paint-order="stroke" stroke-width="3" fill="#163540">'+n+'</text>';
    return '<figure style="margin:.4em 0"><svg viewBox="0 0 255 184" role="img" aria-label="Две окружности с центрами O и P" style="width:100%;max-width:20rem;display:block">'+circle(ox,a,'#22677c')+circle(px,b,'#99603a')+point(ox,'O',-5)+point(px,'P',5)+marks+'</svg><figcaption>OP = '+d+' мм. Радиусы '+a+' и '+b+' мм.</figcaption></figure>';
  }
  function taskDrawing(t,s){
    if(t.data.checkDiameter)return table(t.data.checkDiameter);
    if(t.data.checkCirclePair)return pairDrawing(t.data.checkCirclePair,t.data.checkCirclePair.dist);
    const index=s?.mode==='learn'?s.step:3;return points(drawingConfig(t.data.checkPositions),Math.min(index,2));
  }
  function explore(t,s){
    if(t.data.checkDiameter){const r=s.radius;return {title:'Два плеча одного диаметра',controls:[{key:'radius',title:'Радиус, см',min:1,max:60,step:1}],visual:twoRadii(r),question:'Каков диаметр в сантиметрах?',answer:2*r,why:'От одного края до другого через центр два отрезка по '+r+' см.'};}
    if(t.data.checkCirclePair){
      const d=t.data.checkCirclePair,gap=Math.abs(d.a-d.b);
      const options=[d.dist,d.a+d.b,d.a+d.b+5,gap||1],dist=options[s.trial];
      return {title:'Сдвинь центр P',controls:[{key:'trial',title:'Расстояние OP',values:[[0,'Из задания'],[1,'Сумма радиусов'],[2,'Больше суммы'],[3,gap?'Разность радиусов':'Центры в 1 мм друг от друга']]}],visual:pairDrawing(d,dist),question:'Сколько общих точек у этих окружностей?',answer:intersect(d.a,d.b,dist),why:'Сравни OP с суммой '+(d.a+d.b)+' мм и разностью '+gap+' мм.'};
    }
    const c=drawingConfig(t.data.checkPositions,s),phase=s.phase,open=c.opening===c.radius,distinct=new Set([c.a,c.b,c.c]).size===3,good=selection(t,s)!==null;
    const offPositions=[[-1,'Из условия'],[0,'В центре']];for(const [j,type] of ['Внутри','Снаружи','На окружности'].entries())for(let i=0;i<4;i++)offPositions.push([j*4+i+1,type+', '+dirs[2*i+1]]);
    const controls=[{key:'phase',title:'Часть построения',values:[[0,'а · Три точки на линии'],[1,'б · Две точки вне линии'],[2,'в · Сравнить ON и OK']]}];
    if(phase===0){controls.push({key:'opening',title:'Раствор циркуля, см (0 — из условия)',min:0,max:8,step:1});for(const n of letters)controls.push({key:n.toLowerCase(),title:'Направление для '+n,values:[[-1,'Из условия'],...dirs.map((x,i)=>[i,x])]});}
    if(phase===1)for(const n of ['R','T'])controls.push({key:n.toLowerCase(),title:'Положение '+n,values:offPositions});
    const advice=!open?'Проверь раствор циркуля для трёх точек на линии.':!distinct?'Две метки попали в одно место. Выбери разные направления.':c.r===c.t?'R и T совпадают. Размести одну из точек в другом месте.':c.r>=9||c.t>=9?'Точка R или T попала на саму линию. Перемести её внутрь или наружу.':'Три точки на линии и две вне её расположены верно.';
    const apply=good?'<button type="button" class="button quiet" data-v5-apply-drawing>Решать по моему построению</button>':'';
    return {title:'Построй свою окружность и расставь точки',controls,visual:points(c,phase)+'<p>'+advice+'</p>'+apply,question:phase===0?'Сколько разных отмеченных точек A, B, C лежит на окружности?':phase===1?'Сколько разных отмеченных точек R и T лежит вне самой линии окружности?':'Какая из двух длин меньше радиуса? Введи 1 для ON или 2 для OK.',answer:phase===0?(open?new Set([c.a,c.b,c.c]).size:0):phase===1?new Set([c.r,c.t].filter(v=>v<9)).size:2,why:phase===2?'OK короче радиуса на 1 см.':advice};
  }
  const api={lessons,generators:{'check-25-1':diameters,'check-25-2':locationTask,'check-25-3':circlePair},bounds:{'check-25-1':{radius:[1,60,13]},'check-25-2':{phase:[0,2,0],opening:[0,8,0],a:[-1,7,-1],b:[-1,7,-1],c:[-1,7,-1],r:[-1,12,-1],t:[-1,12,-1]},'check-25-3':{trial:[0,3,0]}},selection,taskDrawing,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5CircleCheck=api;
})(typeof window!=='undefined'?window:globalThis);
