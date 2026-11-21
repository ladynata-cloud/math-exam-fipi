/* Виленкин и соавт., 5 класс, часть 2, 2023, §25, с. 10, №5.30. */
(function(root){
  'use strict';
  const lesson={number:'5.30',key:'printed-5-30',part:2,point:25,page:10,title:'Поставь три новые точки тем же раствором циркуля',requires:['v5f-printed-5-29'],related:[],
    explanation:'Отметь C и отложи CD по линейке. Поставь иглу в C, грифель в D. Сохраняя раствор, поверни циркуль и поставь три отдельные метки M, N, K. Можно строить циркулем в тетради или двигать метки в модели ниже.',
    worked:['Пусть от центра до первой метки 5 см. Поверни циркуль, сохранив раствор 5 см. Новая метка останется в 5 см от центра.','Если два раза отметить одно место, новых точек получится меньше.','Направления выбираешь ты. Расстояния между соседними метками могут различаться.'],
    misconception:'Если менять направление грифеля вокруг иглы, длина от центра до новой метки тоже меняется.',reflect:'Как проверить все три новые точки одним положением иглы циркуля?'};
  const names=['M','N','K'],positionNames=['справа','справа сверху','выше и правее','сверху','выше и левее','слева сверху','слева','слева снизу','ниже и левее','снизу','ниже и правее','справа снизу'];
  function params(seed,rand){
    if(seed>=600000&&seed<600000+9*1728){
      const n=seed-600000,places=[Math.floor(n/144)%12,Math.floor(n/12)%12,n%12],radius=1+Math.floor(n/1728);
      if(!places.includes(0)&&new Set(places).size===3)return {radius,places,own:true};
    }
    if(!seed)return {radius:4,places:[2,5,9],own:false};
    const first=1+seed%11;return {radius:2+Math.floor(seed/3)%7,places:[first,1+(first+2)%11,1+(first+6)%11],own:false};
  }
  function config(t,s){
    const d=t.data.threeCompass,places=names.map((n,i)=>s[n.toLowerCase()]<0?d.places[i]:s[n.toLowerCase()]),opening=s.opening||d.radius;
    const distinct=new Set(places.filter(n=>n!==0)).size,valid=opening===d.radius?distinct:0;
    return {radius:d.radius,opening,places,valid};
  }
  function selection(t,s){
    const c=config(t,s);return c.valid===3?600000+(c.radius-1)*1728+c.places[0]*144+c.places[1]*12+c.places[2]:null;
  }
  function figure(c){
    const unit=72/Math.max(c.radius,c.opening),cx=125,cy=103;
    const loc=(slot,r)=>[cx+unit*r*Math.cos(Math.PI*slot/6),cy-unit*r*Math.sin(Math.PI*slot/6)];
    const point=(x,y,text,slot)=>{const dx=Math.cos(Math.PI*slot/6)<-.15?-7:6,dy=Math.sin(Math.PI*slot/6)<-.2?13:-6;
      return '<circle cx="'+x+'" cy="'+y+'" r="3.4" fill="#173f4c"/><text x="'+(x+dx)+'" y="'+(y+dy)+'" text-anchor="'+(dx<0?'end':'start')+'" font-size="12" font-weight="bold" paint-order="stroke" stroke="white" stroke-width="3" fill="#183a45">'+text+'</text>';};
    const xD=cx+c.radius*unit;let marks='<path d="M'+cx+' '+cy+'H'+xD+'" stroke="#6b7166" stroke-dasharray="3 3"/>'+point(cx,cy,'C',6);
    const grouped=new Map();
    function add(slot,r,name){const key=slot+'/'+r;if(!grouped.has(key))grouped.set(key,{slot,r,labels:[]});grouped.get(key).labels.push(name);}
    add(0,c.radius,'D');c.places.forEach((s,i)=>add(s,c.opening,names[i]));
    for(const {slot,r,labels} of grouped.values()){const [x,y]=loc(slot,r);marks+=point(x,y,labels.join(','),slot);}
    return '<figure style="margin:.4em 0"><svg role="img" aria-label="Игла циркуля в C, точка D справа; метки M, N и K можно перемещать" viewBox="0 0 260 206" style="width:100%;max-width:25rem;display:block"><circle cx="'+cx+'" cy="'+cy+'" r="'+unit*c.opening+'" stroke="#27786f" stroke-width="2" fill="none"/>'+marks+'</svg><figcaption>CD = '+c.radius+' см. Раствор циркуля '+c.opening+' см.</figcaption></figure>';
  }
  function generate(seed,rand,step){
    const d=params(seed,rand),r=d.radius;
    return {steps:[step('Закрепи иглу в C. Отрезок CD равен '+r+' см. На сколько сантиметров раскрыть циркуль?',r,'Грифель должен коснуться D. Отмерь один радиус.',[{value:2*r,text:'Ты отмерил диаметр. Игла стоит в C, поэтому нужен только отрезок CD.'}]),
      step('Поворотом циркуля получена точка N. Какой стала длина CN в сантиметрах?',r,'Игла не сдвигалась, раствор сохранился. Сравни CN с CD.',[{value:0,text:'Неподвижна игла. Грифель остаётся на расстоянии одного радиуса от неё.'}]),
      step('Сколько разных новых точек в этом чертеже после построения M, N, K? Точку D уже дали.',3,'Посчитай различные места для M, N и K, пропуская исходную D.',[{value:4,text:'В это число попала D. Сейчас нужны только три новые метки.'}])],
      prompt:'Сколько всего разных подписанных точек расположено на расстоянии '+r+' см от C, если теперь учитывать и D?',inputPrompt:'Число точек',answer:4,errors:[{value:3,text:'Новые метки ты уже учёл. На том же расстоянии находится и D.'},{value:5,text:'Центр C не лежит на своей окружности. Расстояние от C до C равно нулю.'}],
      why:'Считать надо D и три выбранные точки M, N, K. Все они на одной окружности, и от каждой до C по '+r+' см.',data:{threeCompass:d},conditionKey:'compass/'+r+'/'+d.places.join('/'),prefix:d.own?'Твоё построение. ':seed?'Новый пример. ':'Построение к №5.30. '};
  }
  function explore(t,s){
    const c=config(t,s),positions=[[-1,'Как в моём задании'],...positionNames.map((p,i)=>[i,(i+1)+' · '+p])];
    const advice=c.opening!==c.radius?'Грифель при таком растворе не попадает в D. Сравни раствор с длиной CD.':c.places.includes(0)?'Одна из меток совпала с D. Выбери для неё другое направление.':new Set(c.places).size<3?'Две метки попали в одно место. Разведи их по разным направлениям.':'Три новые метки различны. Можно решать по своему чертежу.';
    const apply=c.valid===3?'<button class="button quiet" type="button" data-v5-apply-drawing>Решать по моему построению</button>':'';
    return {title:'Установи циркуль и выбери три точки',controls:[{key:'opening',title:'Раствор, см (0 — как в задании)',min:0,max:9,step:1},...names.map(n=>({key:n.toLowerCase(),title:'Направление для '+n,values:positions}))],
      visual:figure(c)+'<p>'+advice+'</p>'+apply,question:'Сколько разных новых точек уже удовлетворяют условию? Совпадения с D не считай.',answer:c.valid,why:advice};
  }
  const api={lesson,generate,selection,explore,bounds:{opening:[0,9,0],m:[-1,11,-1],n:[-1,11,-1],k:[-1,11,-1]},taskDrawing:t=>{const d=t.data.threeCompass;return figure({radius:d.radius,opening:d.radius,places:d.places});}};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5ThreeCompassPoints=api;
})(typeof window!=='undefined'?window:globalThis);
