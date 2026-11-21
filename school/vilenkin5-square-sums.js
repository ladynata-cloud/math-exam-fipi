/* Виленкин и соавт., 2023, часть 2, §25, с. 9, №5.21. */
(function(root){
  'use strict';
  const lesson={number:'5.21',key:'printed-5-21',part:2,point:25,page:9,title:'Как связаны сумма кубов и площадь квадрата?',requires:['v5f-printed-5-20'],related:[],
    explanation:'В каждой строке слева сложи кубы, а справа сначала сложи числа и затем возведи сумму в квадрат. Сверив несколько строк, сформулируй правило. Для проверки на семи числах вычисли обе стороны.',
    worked:['Рассмотри отдельно пятый слой. Квадрат со стороной 10 вырастает до квадрата со стороной 15.','Новый слой занимает 15² − 10² = 225 − 100 = 125 клеток. Это 5³.','Можно проверить без перебора клеток. Разница квадратов равна (15 − 10) · (15 + 10) = 5 · 25.'],
    misconception:'Если к стороне квадрата прибавили 5 клеток, то к его площади прибавилось только 25 клеток.',reflect:'Что изменяется при переходе от одного большого квадрата к следующему?'};
  const sum=n=>n*(n+1)/2;
  function cubes(n){return Array.from({length:n},(_,i)=>(i+1)+'³').join(' + ');}
  function layer(n,grid){
    const outer=sum(n),inner=sum(n-1),a=152,dx=inner*a/outer,x=20,y=12;
    let lines='';
    if(grid)for(let i=1;i<outer;i++){const offset=i*a/outer;lines+='<path d="M'+(x+offset)+' '+y+'v'+a+' M'+x+' '+(y+offset)+'h'+a+'" stroke="#45676a" stroke-width=".35"/>';}
    return '<figure style="margin:.3rem 0"><svg viewBox="0 0 193 176" class="v5q-printed-geometry" role="img" aria-label="Квадрат из предыдущего шага и новый Г-образный слой" style="width:100%;max-width:21rem;display:block"><rect x="'+x+'" y="'+y+'" width="'+a+'" height="'+a+'" fill="#f3ba7b" stroke="#4f5554"/><rect x="'+x+'" y="'+(y+a-dx)+'" width="'+dx+'" height="'+dx+'" fill="#b7dbd2" stroke="#2d6259"/>'+lines+'</svg><figcaption>Зелёный квадрат был раньше. Оранжевые клетки составляют слой №'+n+'.</figcaption></figure>';
  }
  function generate(seed,rand,step){
    const first=seed?rand(2,5):2,rows=[first,first+1,first+2],proposed=seed?rand(first+3,first+7):7,last=seed&&first===2&&proposed===7?8:proposed;
    const steps=rows.map((n,i)=>{
      const t=sum(n);
      return step('а, строка '+(i+1)+'. Проверь обе стороны для чисел от 1 до '+n+'. Введи общее значение суммы кубов и квадрата суммы.',t*t,'Посчитай '+cubes(n)+'. Теперь сложи числа без степеней и возведи сумму в квадрат.',
        [{value:t,text:'Ты нашёл сторону квадрата. Для сравнения двух сторон равенства вычисли ещё площадь.'},{value:n*n,text:'В квадрат возводят сумму всех чисел, а не только последнее число.'}]);
    });
    steps.push(step('б. Закончи правило «Сумма кубов от 1 до n равна …». Выбери номер: (1) удвоенной сумме чисел, (2) квадрату суммы всех этих чисел, (3) сумме их квадратов.',2,'Сначала запиши своё правило словами. Проверь каждый предложенный вариант на двух или трёх числах.',
      [{value:1,text:'Удвоение — это умножение на два. Справа сумма умножается сама на себя.'},{value:3,text:'Порядок действий другой. Здесь сначала складываем основания, потом возводим результат в квадрат.'}]));
    const side=sum(last),area=side*side;
    steps.push(step('в. Для '+last+' чисел найди сторону большого квадрата. Сколько будет 1 + 2 + … + '+last+'?',side,'Соедини первое и последнее числа, второе и предпоследнее. Проверь средний член, если число слагаемых нечётно.',
      [{value:area,text:'Это уже площадь. Сейчас нужна сумма натуральных чисел без квадрата.'}]));
    return {prompt:'Проверь равенство для первых '+last+' чисел. Сложи их кубы, затем перемножь найденную сторону саму на себя. Какое общее значение получилось?',answer:area,inputPrompt:'Общее значение',
      why:cubes(last)+' = '+area+'. Площадь большого квадрата составляет '+side+' × '+side+' = '+area+'.',
      errors:[{value:side,text:'Это сторона квадрата. Чтобы проверить равенство, найди его площадь.'},{value:last**3,text:'Это только последний куб. Учти предыдущие слои.'}],
      data:{squareSums:{rows,last}},steps,conditionKey:'square-sums/'+rows.join('-')+'/'+last};
  }
  function taskDrawing(task,scene){
    const {rows,last}=task.data.squareSums,i=scene.mode==='learn'?scene.step:5,n=i<3?rows[i]:i===3?rows[2]:last;
    return layer(n,true);
  }
  function explore(task,state){
    const n=state.rank,side=sum(n),old=sum(n-1),query=state.measure;
    return {title:'Собери квадрат слой за слоем',controls:[{key:'rank',title:'Номер слоя',min:2,max:9,step:1},{key:'measure',title:'Что определить',values:[[0,'Сторону большого квадрата'],[1,'Площадь нового слоя'],[2,'Площадь всего квадрата']]},{key:'lattice',title:'Клетки',values:[[0,'Только области'],[1,'Показать сетку']]}],
      visual:layer(n,state.lattice),question:['Сложи числа от 1 до '+n+'. Какой стала сторона?','Сколько клеток добавил оранжевый слой?','Сколько клеток во всём квадрате?'][query],
      answer:[side,n**3,side**2][query],why:[n+'('+n+' + 1) : 2 = '+side+'.',side+'² − '+old+'² = ('+side+' − '+old+')('+side+' + '+old+') = '+n+'³ = '+n**3+'.',side+' × '+side+' = '+side**2+'.'][query]};
  }
  const api={lesson,generate,taskDrawing,explore,bounds:{'5.21':{rank:[2,9,4],measure:[0,2,1],lattice:[0,1,1]}}};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5SquareSums=api;
})(typeof window!=='undefined'?window:globalThis);
