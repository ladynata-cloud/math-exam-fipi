/* Vilenkin et al., grade 5 (2023), part 2, §25, printed p. 8. Original compass constructions. */
(function (root) {
  'use strict';
  const source={part:2,point:25,page:8,requires:['v5f-printed-5-5'],related:['v5f-printed-5-2']};
  const lessons=[
    {...source,number:'5.6',key:'printed-5-6',title:'Два центра и две точки пересечения',
      explanation:'В тетради отложи HP по линейке. Поставь иглу циркуля в H, проведи первую окружность. Переставь иглу в P и измени раствор для второй. Отметь оба пересечения. У каждой общей точки можно провести по радиусу к каждому центру.',
      worked:['Для двух окружностей выбраны радиусы 3 и 5 см. Назовём одно из общих мест X, второе Y.','При обходе первой окружности раскрытие циркуля постоянно. От её центра до X и до Y по 3 см.','Для второй окружности тот же опыт даст 5 см. Группировать равные отрезки удобно по центру.'],
      misconception:'Все четыре отрезка от двух центров к местам пересечения обязательно равны.',reflect:'Как узнать длину каждого отрезка, если на рисунке окружности другого размера?'},
    {...source,number:'5.7',key:'printed-5-7',title:'Где можно встать на двух заданных расстояниях?',
      explanation:'Места на одном расстоянии от A образуют окружность. Начерти её, затем вторую с центром в C. Ищи точки, которые проходят обе проверки сразу. Посмотри по обе стороны от прямой AC.',
      worked:['На плане первый маяк отмечен в 4 см от второго. Пусть до каждого маяка должно быть ровно 3 см.','Проведи от каждого маяка окружность радиуса 3 см. У них два общих места — с разных сторон линии маяков.','Когда маяки раздвинуты на 6 см, окружности только касаются и остаётся одно место.'],
      misconception:'Если две длины известны, подходящая точка всегда только одна.',reflect:'Что происходит с двумя подходящими точками, если постепенно отдалять центры?'}
  ];
  const colors=['#225978','#a74418'];
  function construction(number,seed,random){
    if(!seed)return number==='5.6'?{names:['H','P'],a:2,b:3,d:4}:{names:['A','C'],a:6,b:5,d:7};
    const a=random(2,7),other=[2,3,4,5,6,7].filter(radius=>radius!==a),b=other[random(0,other.length-1)];
    return {names:number==='5.6'?['H','P']:['A','C'],a,b,d:random(Math.abs(a-b)+1,a+b-1)};
  }
  function geometry(f,d){
    const min=Math.abs(f.a-f.b),max=f.a+f.b;
    if(d<min||d>max)return [];
    if(d===0)return [];
    const x=(d*d+f.a*f.a-f.b*f.b)/(2*d);
    if(d===min||d===max)return [[x,0]];
    const y=Math.sqrt(Math.max(0,f.a*f.a-x*x));
    return [[x,-y],[x,y]];
  }
  function distances(f){
    const choices=[{label:'Как в задании',d:f.d},{label:'Касание снаружи',d:f.a+f.b},{label:'Дальше суммы радиусов',d:f.a+f.b+2}];
    const excess=Math.abs(f.a-f.b);
    choices.push({label:'Касание изнутри',d:excess});
    choices.push({label:excess===1?'Совместить центры':'Одна окружность внутри',d:excess-1});
    return choices;
  }
  const tag=(n,x,y,dx,dy)=>'<circle cx="'+x+'" cy="'+y+'" r="3.2" fill="#17364a"/><text x="'+(x+dx)+'" y="'+(y+dy)+'" font-weight="bold" paint-order="stroke" stroke="white" stroke-width="3" stroke-linejoin="round">'+n+'</text>';
  function figure(f,d,stage,leg){
    const left=Math.min(-f.a,d-f.b),right=Math.max(f.a,d+f.b),top=Math.max(f.a,f.b);
    const unit=Math.min(204/(right-left),122/(2*top)),cx=135-(left+right)*unit/2,cy=88;
    const xp=x=>cx+x*unit,yp=y=>cy+y*unit;
    const edge=(x1,y1,x2,y2,style)=>'<path d="M '+xp(x1)+' '+yp(y1)+' L '+xp(x2)+' '+yp(y2)+'" '+style+'/>';
    let body=edge(0,0,d,0,'stroke="#597480" stroke-width="1.5" stroke-dasharray="4 3"');
    if(stage>=1)body+='<circle cx="'+xp(0)+'" cy="'+cy+'" r="'+f.a*unit+'" fill="none" stroke="'+colors[0]+'" stroke-width="2.4"/>';
    if(stage>=2)body+='<circle cx="'+xp(d)+'" cy="'+cy+'" r="'+f.b*unit+'" fill="none" stroke="'+colors[1]+'" stroke-width="2.4"/>';
    const points=geometry(f,d);
    if(stage===3&&points.length){
      const ix=Math.min(leg%2,points.length-1),center=leg<2?0:d;
      body+=edge(center,0,...points[ix],'stroke="#734174" stroke-width="3.4"');
    }
    body+=tag(f.names[0],xp(0),cy,-14,19)+tag(f.names[1],xp(d),cy,5,19);
    if(stage>=3)points.forEach(([x,y],i)=>{
      const leftEnd=x<0,rightEnd=x>d;
      if(y===0){body+=tag('M',xp(x),yp(y),leftEnd?-16:rightEnd?5:-5,-7);return;}
      body+=tag(i?'N':'M',xp(x),yp(y),5,i?18:-4);
    });
    const dimensions=f.names[0]+f.names[1]+' = '+d+' см';
    return '<svg class="v5q-printed-geometry" viewBox="0 0 270 188" role="img" aria-label="Построение двух окружностей с центрами '+f.names.join(' и ')+'" style="display:block;width:100%;height:auto;max-width:25rem;margin:auto"><desc>'+dimensions+'. Радиусы '+f.a+' и '+f.b+' см. '+(stage===3?'Общих точек на этой модели: '+points.length+'.':'Выполняется этап построения.')+'</desc><rect width="270" height="188" rx="8" fill="#fff"/><g font-family="sans-serif" font-size="15" fill="#17364a">'+body+'<text x="135" y="183" text-anchor="middle">'+dimensions+'</text></g></svg>';
  }
  const err=(value,text)=>({value,text});
  function make(number,seed,random,step){
    const f=construction(number,seed,random),[u,v]=f.names;
    const model={circleCrossings:f},conditionKey=number+'/'+[f.a,f.b,f.d].join('/');
    const intro='В тетради отложи '+u+v+' = '+f.d+' см. Из '+u+' проведи окружность радиуса '+f.a+' см, из '+v+' — радиуса '+f.b+' см. ';
    if(number==='5.6'){
      const legs=[['MH',f.a,f.b],['HN',f.a,f.b],['PM',f.b,f.a],['NP',f.b,f.a]];
      const steps=legs.map(([name,value,other])=>step('Сколько сантиметров в '+name+'?',value,'Найди в обозначении отрезка центр. Прочитай радиус окружности с этим центром.',value===other?[]:[err(other,'Ты выбрал радиус другой окружности. Проверь, какая буква обозначает центр именно этого отрезка.')]));
      steps.push(step('Сколько из четырёх записанных отрезков имеют ту же длину, что и MH? Считай и сам MH.',2,'Для каждого отрезка найди, к какому центру он проведён. Одинаковые радиусы принадлежат одной окружности.',[err(4,'Обе точки общие, а центры разные. Сравни раскрытия циркуля в H и в P.')]));
      return {prompt:intro+'Общие точки — M и N. Найди разность длин самого длинного и самого короткого из отрезков MH, HN, PM, NP. В шагах сравни все четыре.',inputPrompt:'Разница в см',answer:Math.abs(f.a-f.b),steps,errors:[err(f.a+f.b,'Ты сложил радиусы. Вопрос спрашивает, на сколько различаются длины.')],data:model,conditionKey};
    }
    return {prompt:intro+'Сколько точек расположены на обоих заданных расстояниях сразу?',inputPrompt:'Сколько точек',answer:2,data:model,conditionKey,
      steps:[step('Какой раствор циркуля (в см) нужен в центре A?',f.a,'Первое условие относится к расстоянию от A.',[err(f.d,'Это расстояние между центрами. Первый раствор циркуля соответствует расстоянию от A до искомой точки.')]),
        step('Какой раствор циркуля (в см) нужен в центре C?',f.b,'Второе условие задаёт расстояние от C до искомой точки.'),
        step('Для верхнего пересечения M назови расстояния AM и CM (в см) через точку с запятой.',[f.a,f.b],'M оказывается сразу на двух окружностях. Первым запиши радиус из A, вторым — из C.',f.a===f.b?[]:[err([f.b,f.a],'Радиусы выбраны правильно, но поменялись местами. Сначала AM, затем CM.')])],
      errors:[err(1,'Ты нашёл одну подходящую точку. Посмотри на другую сторону прямой AC и проверь там оба расстояния.'),err(0,'Проведи обе окружности целиком и найди общие места.') ]};
  }
  function explore(task,state){
    const f=task.data.circleCrossings,choices=distances(f),last=choices.length-1,mode=Math.min(state.distance,last);
    const current=choices[mode],points=geometry(f,current.d),labels=['Отметить центры','Провести первую окружность','Провести вторую окружность','Отметить общие точки'];
    const u=f.names[0],v=f.names[1],legs=[u+'M',u+'N',v+'M',v+'N'];
    const controls=[{key:'stage',title:'Что сделать',values:labels.map((x,i)=>[i,x])},{key:'distance',title:'Расстояние между центрами',values:choices.map((x,i)=>[i,x.label+' · '+x.d+' см'])}];
    if(state.stage===3&&points.length===2)controls.push({key:'leg',title:'Проверить отрезок',values:legs.map((x,i)=>[i,x])});
    const explain=points.length===2?'Две окружности встретились по разные стороны от линии центров.':points.length===1?'Окружности касаются в одной точке.':'Ни одна точка одной окружности не лежит на другой.';
    return {title:'Построй две окружности по шагам',controls,visual:figure(f,current.d,state.stage,state.leg),question:'Сколько общих точек будет у двух полных окружностей при таком расстоянии между центрами?',answer:points.length,why:explain};
  }
  const generators=Object.fromEntries(['5.6','5.7'].map(n=>[n,(seed,random,step)=>make(n,seed,random,step)]));
  const bounds=Object.fromEntries(['5.6','5.7'].map(n=>[n,{stage:[0,3,0],distance:[0,4,0],leg:[0,3,0]}]));
  const api={lessons,generators,bounds,explore,geometry,distances,taskDrawing:task=>{const f=task.data.circleCrossings;return figure(f,f.d,3,0);}};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5CircleCrossings=api;
})(typeof window!=='undefined'?window:globalThis);
