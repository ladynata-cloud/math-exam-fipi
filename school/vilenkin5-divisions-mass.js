/* Part one, p. 31. A student's labelled segment and three directions of weighing. */
(function(root){
  'use strict';
  const descriptions=[
    ['1.155','Разметь отрезок OK','Начерти отрезок в тетради по линейке. Поставь ноль у O, длину всего отрезка у K. Раздели длину на число равных частей. Отметки откладывай таким шагом, начиная в O.','На отрезке 9 см три равных промежутка имеют длину 3 см. У внутренних штрихов будут подписи 3 и 6.','Если промежутков шесть, то внутренних штрихов тоже шесть.'],
    ['1.156','Переведи килограммы и граммы в граммы','Большую гирю замени равной массой в граммах. Затем добавь граммы, уже записанные отдельно.','3 кг 40 г — это 3000 г и ещё 40 г, вместе 3040 г.','При переводе в граммы можно просто соединить цифры.'],
    ['1.157','Сгруппируй гири по одной тонне','Одна тонна — это 1000 килограммов или 10 центнеров. Выбери размер группы по единице исходного числа и узнай количество полных групп.','400 ц составляют 40 групп по 10 ц, то есть 40 т.','И килограммы, и центнеры надо делить на одно и то же число.'],
    ['1.158','Собери составную массу в килограммах','Узнай, сколько килограммов дают тонны и сколько — центнеры. Только теперь прибавляй килограммы, уже записанные в условии.','2 т 3 ц дают 2000 кг и 300 кг. Вместе это 2300 кг.','В записи из тонн и центнеров центнеры можно принять за килограммы.']
  ];
  const lessons=descriptions.map(([number,title,explanation,example,misconception])=>({number,title,explanation,worked:[example],misconception,
    key:'printed-'+number.replace('.','-'),part:1,point:5,page:31,requires:[number==='1.155'?'v5f-printed-1-135':'v5f-printed-1-130'],related:['v5f-printed-1-131'],
    reflect:number==='1.155'?'Сколько промежутков у твоих отметок от O до K?':'Можешь ли восстановить исходную массу по ответу?'}));
  const err=(value,text)=>({value,text});
  function divide(seed,r,step){
    const parts=seed?r(3,8):6,unit=seed?r(2,5):2,length=parts*unit,marks=Array.from({length:parts-1},(_,i)=>(i+1)*unit);
    return {prefix:'Начерти в тетради отрезок OK длиной '+length+' см. Под O отметь 0, под K — '+length+'. Раздели его на '+parts+' равных промежутков. ',
      prompt:'Перенеси подписи под внутренними штрихами слева направо, через точку с запятой. На экране появится твоя разметка.',
      inputPrompt:'Только подписи между O и K',answer:marks,answerFormat:'v5-list',conditionKey:parts+'/'+unit,data:{markSegment:{length,parts,unit}},
      table:{caption:'Какой отрезок разметить',headers:['На концах','Между концами'],rows:[['O(0), K('+length+')',parts+' равных частей']]},
      steps:[step('Какой длины в сантиметрах должен быть один промежуток?',unit,'Раздели весь отрезок на число равных промежутков.',[err(parts,'Это число промежутков. Здесь нужна длина одного из них.')]),
        step('Сколько внутренних штрихов нужно поставить между O и K?',parts-1,'Проверь на двух частях: их разделяет всего один внутренний штрих.',[err(parts,'Последняя часть заканчивается в K. Новый внутренний штрих там не нужен.')])],
      errors:[err([...marks.slice(0,-1),marks.at(-1)-1],'Сравни последний промежуток до K с самым первым от O. Между соседними подписями должна быть одна и та же разность.'),err([0,...marks,length],'O и K уже подписаны. Выпиши только внутренние метки по порядку.'),err(marks.map((_,i)=>i+1),'Это номера штрихов. Под каждым штрихом указывай расстояние от O в сантиметрах.')]};
  }
  const grams={г:1,кг:1000,ц:100000,т:1000000},letters='абв';
  const sources={
    '1.156':[[[8,'кг'],[600,'г']],[[1,'кг'],[15,'г']],[[14,'кг']]],
    '1.157':[[[71000,'кг']],[[8000,'ц']],[[803000,'кг']]],
    '1.158':[[[2,'ц'],[86,'кг']],[[3,'т'],[6,'ц']],[[51,'т'],[750,'кг']]]
  };
  function weighing(number,seed,r,step){
    const to={'1.156':'г','1.157':'т','1.158':'кг'}[number],input=sources[number];
    const rows=seed?input.map(row=>row.map(([n,u])=>[number==='1.157'?r(5,850)*(u==='ц'?10:1000):r(1,n+8),u])):input;
    const state=rows.map(row=>row.reduce((sum,[q,u])=>sum+q*grams[u]/grams[to],0)),names=rows.map(row=>row.map(([q,u])=>q+' '+u).join(' '));
    const parts=rows.map((row,i)=>{
      const prompt=letters[i]+'. '+names[i]+' — это сколько '+to+'?';
      const errors=[];
      if(number==='1.157'){
        const [q,u]=row[0];errors.push(err(q/(u==='ц'?1000:10),'Выбран коэффициент для другой единицы. Одна тонна содержит 1000 кг и только 10 ц.'));
      }else{
        const added=row.reduce((sum,[q])=>sum+q,0);if(added!==state[i])errors.push(err(added,'Ты сложил числа в разных единицах. Переведи каждую гирю в '+to+'.'));
        if(row.length===2)errors.push(err(row[0][0]*grams[row[0][1]]/grams[to],'Большая часть учтена. Прибавь массу второй гири.'));
      }
      return step(prompt,state[i],number==='1.157'?'Раздели исходную массу на число таких единиц в одной тонне.':'Переведи каждую часть массы в '+to+' и сложи результаты.',errors);
    });
    const last=parts.at(-1);
    return {prompt:last.prompt,answer:last.answer,inputPrompt:'Масса в '+to,steps:parts.slice(0,-1),errors:last.errors,
      table:{caption:'Три исходные массы',headers:['Пункт','На весах'],rows:names.map((n,i)=>[letters[i],n])},
      conditionKey:names.join('/'),data:{weighing:{to,rows}}};
  }
  function drawing(length,points,highlight){
    const left=18,right=251,x=n=>left+(right-left)*n/length,step=points.length>6?72:58;
    const safe=[...new Set(points.filter(n=>Number.isInteger(n)&&n>0&&n<length))];
    const marks=safe.map((n,i)=>'<path d="M'+x(n)+' 34v12" stroke="#176355" stroke-width="2"/><text x="'+x(n)+'" y="'+(i%2&&safe.length>6?69:56)+'" text-anchor="middle" style="font:14px sans-serif;fill:#16483d">'+n+'</text>').join('');
    const emphasis=highlight>0?'<path d="M'+left+' 33H'+x(highlight)+'" stroke="#ab492f" stroke-width="5"/>':'';
    return '<svg viewBox="0 0 270 '+(step+7)+'" role="img" aria-label="Отрезок OK от нуля до '+length+'; подписи внутри: '+(safe.join(', ')||'пока пусто')+'"><path d="M'+left+' 34H'+right+'" stroke="#225b61" stroke-width="3"/>'+emphasis+'<path d="M'+left+' 29v17m'+(right-left)+' -17v17" stroke="#225b61" stroke-width="2"/><g text-anchor="middle" style="font:15px sans-serif;fill:#213c3a"><text x="'+left+'" y="21">O</text><text x="'+right+'" y="21">K</text><text x="'+left+'" y="57">0</text><text x="'+right+'" y="57">'+length+'</text></g>'+marks+'</svg>';
  }
  function taskDrawing(t,scene){
    const {length}=t.data.markSegment,finalStep=scene.mode!=='learn'||scene.step>=t.steps.length;
    const entered=finalStep?String(scene.savedInput||'').trim():'';
    const vals=entered.split(/[;,\s]+/).filter(x=>/^\d+$/.test(x)).map(Number);
    return drawing(length,vals,0);
  }
  function explore(l,s,t,table){
    if(t.data.markSegment){
      const {length,parts,unit}=t.data.markSegment,k=Math.min(s.count,parts-1),marks=Array.from({length:k},(_,i)=>(i+1)*unit);
      return {title:'Откладывай равные промежутки от O',controls:[{key:'count',title:'Поставь внутренние штрихи',values:Array.from({length:parts},(_,i)=>[i,i])}],
        visual:drawing(length,marks,k*unit),question:'Сколько сантиметров от O до последнего поставленного штриха? Если штрихов нет, останься в O.',answer:k*unit,why:'Каждый новый штрих добавляет к расстоянию один и тот же отрезок.'};
    }
    const {rows,to}=t.data.weighing,row=rows[s.row],k=Math.min(s.item,row.length-1),[q,u]=row[k],f=grams[u]/grams[to],amount=q*grams[u]/grams[to],op=f<1?' : '+(1/f):' × '+f;
    return {title:to==='т'?'Уложи массу группами по тонне':'Замени выбранную гирю',controls:[{key:'row',title:'Пункт',values:rows.map((_,i)=>[i,letters[i]])},{key:'item',title:'Гиря',values:row.map(([v,m],i)=>[i,v+' '+m])}],
      visual:table('Переход между единицами',['На весах','Во что переводим'],[[q+' '+u,'в '+to],[f<1?'1 '+to+' = '+Math.round(1/f)+' '+u:'1 '+u+' = '+f+' '+to,'Выбранная гиря']]),
      question:'Сколько '+to+' у выбранной гири?',answer:amount,why:'Проверь действие: '+q+op+' = '+amount+'. Если гирь несколько, для общего ответа потребуется их сложить.'};
  }
  const generators={'1.155':divide},bounds={'1.155':{count:[0,7,0]}};
  for(const n of Object.keys(sources)){generators[n]=(seed,r,step)=>weighing(n,seed,r,step);bounds[n]={row:[0,2,0],item:[0,1,0]};}
  const api={lessons,generators,bounds,explore,taskDrawing};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5DivisionsMass=api;
})(typeof window!=='undefined'?window:globalThis);
