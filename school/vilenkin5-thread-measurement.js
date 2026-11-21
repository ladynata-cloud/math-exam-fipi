/* Vilenkin, grade 5, 2023, part 2, §25, p. 8. Physical work and a separate practice table. */
(function(root){
  'use strict';
  const lesson={number:'5.10',key:'printed-5-10',title:'Сравни длину нитки и диаметр',part:2,point:25,page:8,requires:['v5f-printed-5-2'],related:['v5f-printed-5-9'],
    explanation:'Начерти три окружности разных радиусов. Проведи у каждой отрезок через центр от края до края и измерь его. Вырежи круги. Для каждого один раз обведи край ниткой, отметь место встречи концов и измерь расправленную нитку. Запиши шесть измерений в одной единице и сравни их попарно.',
    worked:['На одном картонном круге ученик получил 5 см для диаметра и 16 см для нитки.','Три диаметра дают 15 см. На нитке остаётся ещё около сантиметра.','У другого круга сами длины будут иными. Чтобы сравнить результаты двух опытов, раздели измеренную длину нитки на диаметр каждого круга.'],
    misconception:'Если радиус круга увеличить, длина нитки вокруг него всегда составит столько же сантиметров, сколько прежде.',reflect:'Почему результаты трёх измерений близки, хотя сами круги разные?'};
  const labels=['первого','второго','третьего'];
  const fmt=v=>String(v).replace('.',',');
  function quotient10(c,d){return Math.round(10*c/d);}
  function generate(seed,rand,step){
    const size=seed?rand(3,7):4,diameters=[5*size,10*size,15*size];
    const offsets=seed?diameters.map(()=>rand(-1,1)):[0,-1,1];
    const strings=diameters.map((d,i)=>Math.round(Math.PI*d)+offsets[i]);
    const rows=diameters.map((d,i)=>({d,c:strings[i]})),choose=seed?rand(0,2):1;
    const a=rows[choose];
    const diff=step('Для '+labels[choose]+' круга найди длину трёх диаметров в миллиметрах.',3*a.d,
      'В одной строке таблицы возьми диаметр и умножь его на три. Длина нитки записана в соседнем столбце.');
    diff.errors=[{value:a.c,text:'Ты выписал длину нитки. В этом шаге нужны три отрезка, каждый равен диаметру.'}];
    const rest=step('Сколько миллиметров этой нитки останется после трёх полных диаметров?',a.c-3*a.d,
      'Положи три диаметра вдоль расправленной нитки. Вычти их общую длину из всей длины нитки.');
    rest.errors=[{value:a.d,text:'Это один диаметр. Нужно найти короткий остаток нитки за тремя диаметрами.'}];
    const ratio=quotient10(a.c,a.d)/10;
    return {prefix:'Авторские измерения для проверки. ',conditionKey:'thread/'+diameters.join('-')+'/'+strings.join('-')+'/'+choose,
      data:{thread:{rows,choose}},steps:[diff,rest],prompt:'Во сколько раз длина нитки для '+labels[choose]+' круга больше диаметра? Раздели длину нитки на диаметр и округли частное до десятых.',
      answer:ratio.toFixed(1).replace('.',','),answerFormat:'decimal',inputPrompt:'Отношение длин до десятых',why:'Обе длины записаны в миллиметрах. '+a.c+' : '+a.d+' ≈ '+fmt(ratio)+'. Это результат измерения данного круга.',
      errors:[{value:3,text:'Три целых диаметра поместились, но часть нитки осталась. Учти её, когда округляешь до десятых.'},{value:a.c-3*a.d,text:'Ты указал остаток в миллиметрах. Слово «во сколько» спрашивает частное двух длин.'}]};
  }
  function drawing(d,c,stage){
    // The unrolled thread and the three reference diameters share the same scale.
    const end=Math.max(c,3*d),unit=174/end,stop=20+c*unit,x=k=>20+k*d*unit;
    let pic='';
    if(stage===0){
      pic='<circle cx="105" cy="62" r="43" fill="#edf6f2" stroke="#254d65" stroke-width="2"/><circle cx="105" cy="62" r="43" fill="none" stroke="#a84920" stroke-width="4"/><path d="M62 62 H148" stroke="#23557d" stroke-width="2.5"/><circle cx="105" cy="62" r="2.8" fill="#23557d"/><text x="105" y="50" text-anchor="middle">'+d+' мм</text>';
    }else{
      pic='<path d="M20 41 H'+stop+'" stroke="#a84920" stroke-width="5"/><text x="105" y="25" text-anchor="middle">Нитка '+c+' мм</text>';
      for(let k=0;k<3;k++)pic+='<path d="M'+x(k)+' 68 H'+x(k+1)+'" stroke="'+(k%2?'#629977':'#24567a')+'" stroke-width="5"/><path d="M'+x(k)+' 62 v12" stroke="#183c53"/>';
      pic+='<path d="M'+x(3)+' 62 v12" stroke="#183c53"/><text x="105" y="98" text-anchor="middle">Три диаметра по '+d+' мм</text>';
    }
    return '<svg class="v5q-printed-geometry" role="img" aria-label="'+(stage?'Распрямлённая нитка и три диаметра на одной шкале':'От края до края через центр и один оборот нитки')+'" viewBox="0 0 220 120" style="display:block;width:100%;max-width:23rem;height:auto;margin:auto"><rect width="220" height="120" fill="white"/><g font-size="14" fill="#193c4e" font-family="sans-serif">'+pic+'</g></svg>';
  }
  function taskDrawing(task,table){
    const rows=task.data.thread.rows;
    return table('Отдельный опыт для самопроверки',['Круг','Диаметр, мм','Нитка, мм'],rows.map(({d,c},i)=>[i+1,d,c]));
  }
  function explore(task,state,table){
    const r=state.row+1,d=state['d'+r],c=state['c'+r];
    return {title:'Сравни свои три измерения',controls:[
      {key:'row',title:'Какой круг измеряешь',values:[[0,'Первый'],[1,'Второй'],[2,'Третий']]},
      {key:'d'+r,title:'Измеренный диаметр, мм',min:5,max:160,step:1},{key:'c'+r,title:'Измеренная длина нитки, мм',min:10,max:520,step:1},
      {key:'stage',title:'Как положить нитку',values:[[0,'Обвести край'],[1,'Выпрямить и сравнить']]}],
      visual:drawing(d,c,state.stage)+table('Три опыта. Можно ввести свои измерения',['Круг','Диаметр, мм','Нитка, мм'],[1,2,3].map(i=>[i,state['d'+i],state['c'+i]]))+'<p>'+((c<2.7*d||c>3.6*d)?'Проверь свои измерения. Нитка должна один раз обойти край без натяжения, а диаметр — пройти через центр. Обе длины нужны в миллиметрах.':'Выбери следующий круг и введи его измерения. Записи для остальных кругов сохранятся.')+'</p>',
      question:'Сколько полных диаметров по '+d+' мм помещается вдоль нитки '+c+' мм?',
      answer:Math.floor(c/d),why:'Сравни длину нитки с целым числом диаметров. '+c+' = '+Math.floor(c/d)+' · '+d+' + '+c%d+' (мм). Для каждого круга повтори проверку со своими измерениями.'};
  }
  const api={lesson,generate,explore,taskDrawing,bounds:{'5.10':{row:[0,2,0],stage:[0,1,0],d1:[5,160,20],c1:[10,520,63],d2:[5,160,40],c2:[10,520,125],d3:[5,160,60],c3:[10,520,189]}}};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5ThreadMeasurement=api;
})(typeof window!=='undefined'?window:globalThis);
