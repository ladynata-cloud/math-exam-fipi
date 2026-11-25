/* Vilenkin, grade 5, 2023. Part 2, §25, printed p. 8, exercises 5.11–5.12. */
(function(root){
  'use strict';
  const prer='v5f-printed-5-10',two='v5f-printed-5-11';
  const lessons=[
    {number:'5.11',key:'printed-5-11',title:'Прикинь длину одного оборота',requires:[prer],related:[prer],
      explanation:'Приложи три диаметра к расправленной нитке из опыта. Они занимают почти всю её длину. Для грубой оценки умножь диаметр на 3. Убедись, что на протяжении решения длины записаны в одной единице.',
      worked:['Диаметр круглой крышки 4 см 5 мм. Один сантиметр содержит 10 мм, поэтому диаметр равен 45 мм.','Три таких отрезка дадут 135 мм. Получили грубую оценку длины края.','Оберни крышку ниткой и измерь нитку. Она будет немного длиннее, чем три диаметра.'],misconception:'Чтобы прикинуть длину кругового края по диаметру, нужно разделить диаметр на три.',reflect:'Почему нитка, отмеренная ровно на три диаметра, обычно не смыкается вокруг крышки?'},
    {number:'5.12',key:'printed-5-12',title:'Восстанови диаметр по длине края',requires:[two],related:[prer],
      explanation:'Представь расправленную нитку. Один диаметр занимает примерно треть нитки. Сначала запиши её длину в одной удобной единице. Затем раздели на 3 для грубой оценки диаметра.',
      worked:['Длина края круглой клумбы примерно 18 м. Раздели её на три части по 6 м.','Получили оценку диаметра 6 м. Для проверки сложи 6 + 6 + 6 м и сравни с длиной края.','Для одной и той же длины края три диаметра дают приблизительное, а не точное соотношение.'],misconception:'Зная длину окружности, для оценки диаметра нужно умножить её на 3.',reflect:'Как по полученному диаметру проверить, что ты выбрал верное действие?'}
  ].map(l=>({...l,part:2,point:25,page:8}));
  function generate(inverse,seed,rand,step){
    if(inverse){
      const edge=seed?3*rand(7,24):42,km=seed?rand(2,8):7;
      const extraMetres=seed?100*((3-km%3)%3+3*rand(1,2)):500;
      const metres=1000*km+extraMetres;
      const tail=metres-1000*km,steps=[
        step('а. Разложи нитку длиной '+edge+' м примерно на три диаметра. Сколько метров приходится на один?',edge/3,'Целое известно. Раздели его длину на число равных отрезков.',[{value:edge*3,text:'Ты сделал известную длину больше. Один диаметр короче всего края.'}]),
        step('б. У другого круглого пути длина '+km+' км '+tail+' м. Сколько это метров?',metres,'В одном километре 1000 м. Сначала преврати целые километры в метры, затем добавь остальные.',[{value:km+tail,text:'Километры и метры имеют разные размеры. Перед сложением переведи километры в метры.'}])
      ];
      return {prefix:seed?'Новая оценка. ':'Оценка по опыту с ниткой. ',conditionKey:'inverse/'+edge+'/'+metres,steps,
        data:{estimate:{inverse:true,known:metres,written:km+' км '+tail+' м',first:edge,unit:'м'}},prompt:'б. Длина кругового пути '+km+' км '+tail+' м. Каков его приблизительный диаметр в метрах? В этом опыте принимаем длину края примерно за три диаметра.',
        answer:metres/3,inputPrompt:'Приблизительный диаметр, м',why:'Один диаметр составляет примерно треть края: '+metres+' : 3 = '+metres/3+' (м).',errors:[{value:metres*3,text:'Умножение на 3 даёт длину края по известному диаметру. Здесь известен край. Раздели его на три примерно равные части.'}]};
    }
    const big=seed?rand(2,10):3,cm=seed?rand(1,8):2,mm=seed?rand(1,9):5,d=cm*10+mm;
    const steps=[
      step('а. Для круга диаметром '+big+' дм оцени длину края в дециметрах. Возьми три диаметра.',3*big,'Сложи три одинаковых диаметра. Единица остаётся дециметром.',[{value:big,text:'Ты указал длину одного диаметра. Возьми три таких отрезка.'}]),
      step('б. Диаметр второго круга '+cm+' см '+mm+' мм. Запиши его в миллиметрах.',d,'В каждом сантиметре 10 мм. Добавь к ним оставшиеся миллиметры.',[{value:cm+mm,text:'Сначала переведи сантиметры в миллиметры, затем сложи две длины.'}])
    ];
    return {prefix:seed?'Новая оценка. ':'Оценка по опыту с ниткой. ',conditionKey:'forward/'+big+'/'+d,steps,data:{estimate:{inverse:false,known:d,written:cm+' см '+mm+' мм',first:big,unit:'мм'}},
      prompt:'б. Диаметр круга '+cm+' см '+mm+' мм. Прикинь длину его края в миллиметрах. Пользуйся грубой оценкой «примерно три диаметра».',
      answer:3*d,inputPrompt:'Приблизительная длина края, мм',why:'Диаметр равен '+d+' мм. Три таких диаметра дадут '+3*d+' мм. Настоящая нитка вокруг круга немного длиннее.',errors:[{value:d,text:'Это уже длина диаметра в миллиметрах. Чтобы оценить край, возьми три таких длины.'}]};
  }
  function strip(value,unit,inverse){
    const caption=(inverse?'Весь край: ':'Диаметр: ')+value+(unit?' '+unit:'');
    const colors=['#346789','#638b57','#346789'];
    let marks='';for(let i=0;i<3;i++){const x=14+i*61;marks+='<path d="M'+x+' 47 h61" stroke="'+colors[i]+'" stroke-width="5"/><path d="M'+x+' 40 v14" stroke="#183b51"/><text x="'+(x+30)+'" y="73" text-anchor="middle">d</text>';}
    return '<svg role="img" class="v5q-printed-geometry" aria-label="Три диаметра подряд для приближённого сравнения с краем" viewBox="0 0 220 100" style="display:block;width:100%;max-width:23rem;height:auto;margin:auto"><rect width="220" height="100" fill="white"/><g font-family="sans-serif" font-size="15" fill="#203e50"><text x="110" y="22" text-anchor="middle">'+caption+'</text>'+marks+'<path d="M197 40 v14" stroke="#183b51"/><path d="M197 47 h9" stroke="#a64722" stroke-width="3" stroke-dasharray="2 2"/></g></svg>';
  }
  function taskDrawing(task,scene){
    const x=task.data.estimate;
    if(scene.mode==='learn'&&scene.step===0)return strip(x.first,x.inverse?'м':'дм',x.inverse);
    return strip(x.written,'',x.inverse);
  }
  function explore(task,state){
    const x=task.data.estimate,reverse=state.direction===1,diameter=state.size,value=reverse?3*diameter:diameter;
    return {title:'От одного диаметра к краю и обратно',controls:[{key:'direction',title:'С чего начинаешь',values:[[0,'С диаметра'],[1,'С приблизительной длины края']]},{key:'size',title:'Размер модели',min:2,max:40,step:1}],
      visual:strip(value,x.unit,reverse)+'<p>Отметки показывают три одинаковых диаметра. Короткий пунктир напоминает о небольшой разнице с настоящей длиной окружности.</p>',
      question:reverse?'Приблизительная длина края '+value+' '+x.unit+'. Сколько '+x.unit+' приходится на один диаметр, если взять три равные части?':'Один диаметр '+value+' '+x.unit+'. Примерно сколько '+x.unit+' нужно, чтобы обойти край, если взять три диаметра?',
      answer:reverse?diameter:3*diameter,why:reverse?value+' : 3 = '+diameter+'. Длина одного отрезка меньше целого.':value+' · 3 = '+3*diameter+'. Для грубой оценки сложены три диаметра.'};
  }
  const bounds=Object.fromEntries(lessons.map(l=>[l.number,{direction:[0,1,l.number==='5.12'?1:0],size:[2,40,8]}]));
  const api={lessons,generators:{'5.11':(s,r,f)=>generate(false,s,r,f),'5.12':(s,r,f)=>generate(true,s,r,f)},bounds,taskDrawing,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5CircleEstimates=api;
})(typeof window!=='undefined'?window:globalThis);
