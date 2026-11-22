/* Виленкин и соавторы, 5 класс, часть 1, §6, печатная страница 34. */
(function(root){
  'use strict';
  const configs = {
    '1.163': {labels:['M','N'],right:true,rows:[[1,6],[28,38],[1,0],[41,13],[423,432],[583,539]]},
    '1.164': {labels:['P','Q'],right:false,rows:[[3,2],[21,27],[75,57],[143,243],[203,230],[2990,2989]]}
  };
  const lessons=Object.entries(configs).map(([number,c])=>({
    number,part:1,page:34,point:6,key:'printed-'+number.replace('.','-'),title:c.right?'Какая точка правее?':'Какая точка левее?',
    requires:['v5f-printed-1-155'],related:[c.right?'v5f-printed-1-164':'v5f-printed-1-163'],
    explanation:'Стрелка показывает направление возрастания координат. Если идти по стрелке от меньшего числа, встретится большее. Даже если на рисунке видна только часть прямой, направление остаётся прежним.',
    worked:[c.right?'На прямой с отметками 18 и 21 вторая отметка правее первой. При счёте 21 встречается после 18.':'Если одна точка имеет координату 101, а другая 99, левее будет точка с координатой 99. Между ними ещё есть число 100.'],
    misconception:c.right?'Точка с первой буквой алфавита всегда правее.':'Точка, которую назвали первой, всегда левее.',
    reflect:'Как найти нужную точку, если начало луча осталось за краем рисунка?'
  }));
  function selected(pair,right) { return right ? Number(pair[1]>pair[0]) : Number(pair[1]<pair[0]); }
  const nameFor=right=>right?'правее':'левее';
  function read(value){
    return String(value).toUpperCase().replace(/ЭМ/g,'M').replace(/ЭН/g,'N').replace(/ПЭ/g,'P').replace(/КУ/g,'Q').replace(/М/g,'M').replace(/Р/g,'P').replace(/[\s,;]+/g,'');
  }
  function inputIssue(value,target){
    const expected=target.answer,allowed=/[MN]/.test(expected)?'MN':'PQ',typed=read(value);
    if(typed.length!==expected.length||[...typed].some(letter=>!allowed.includes(letter))){
      return expected.length===1?'Нужна буква одной из двух точек: '+allowed.split('').join(' или ')+'. Можно записать название буквы словами.':'Запиши шесть букв по порядку а–е. Буквы можно разделять пробелами. Пока это черновик.';
    }
    return '';
  }
  function mistake(value,target){
    if(target.answer.length===1)return target.errors?.[0]?.text||'Посмотри, в какую сторону растут числа.';
    const typed=read(value),i=[...target.answer].findIndex((letter,n)=>letter!==typed[n]);
    return i<0?'':'Вернись к паре '+ 'абвгде'[i]+'. Посмотри на направление сравнения в вопросе и на координаты именно этой пары.';
  }
  function generate(number,seed,r,step) {
    const c=configs[number],labels=c.labels.slice(),direction=nameFor(c.right);
    const rows=seed?c.rows.map((_,index)=>{
      const scales=[10,50,5,70,900,4000],a=r(0,scales[index]),b=a+r(1,Math.max(3,Math.floor(scales[index]/9)));
      return r(0,1)?[a,b]:[b,a];
    }):c.rows.map(row=>row.slice());
    const answers=rows.map(row=>labels[selected(row,c.right)]);
    const coordinateOrder={labels,rows,right:c.right},format='v5-coordinate-order';
    const steps=rows.map((row,i)=>{
      const x=labels[0]+'('+row[0]+')',y=labels[1]+'('+row[1]+')',wrong=labels[1-selected(row,c.right)];
      return {...step('абвгде'[i]+'. У точек '+x+' и '+y+' выбери ту, что '+direction+'. Введи её букву.',answers[i],
        'Числа растут вправо. Найди '+(c.right?'большую':'меньшую')+' из двух координат и прочитай букву рядом с ней.',
        [{value:wrong,text:'Это точка '+nameFor(!c.right)+'. Для ответа нужна '+(c.right?'большая':'меньшая')+' координата.'}]),
        answerFormat:format,inputPrompt:'Буква '+labels.join(' или '),coordinateChoices:labels.join('')};
    });
    return {steps,prompt:'Перечисли по порядку буквы точек, которые находятся '+direction+' в парах а–е.',
      answer:answers.join(''),answerFormat:format,inputPrompt:'Шесть букв по порядку',
      coordinateChoices:labels.join(''),why:'Проверяй каждую пару по стрелке. При переходе к новой строке начинай сравнение заново.',
      errors:[],conditionKey:number+'/'+rows.map(row=>row.join('-')).join('/'),data:{coordinateOrder},
      table:{caption:'Координаты каждой пары',headers:['Пара',labels[0],labels[1]],rows:rows.map((row,i)=>['абвгде'[i],...row])}};
  }
  function draw(row,labels){
    const u=Math.min(...row),v=Math.max(...row),x0=58,x1=209,pixels=x1-x0,delta=v-u;
    const start=u===0?x0:Math.max(12,x0-u*pixels/delta);
    let axes='<path d="M'+start+' 48H256m-8-5 8 5-8 5" fill="none" stroke="#344c54" stroke-width="2"/>';
    for(let i=0;i<2;i++){
      const x=row[i]===u?x0:x1;
      axes+='<path d="M'+x+' 42v14" stroke="#354c60" stroke-width="2"/><circle cx="'+x+'" cy="48" r="4" fill="'+(i?'#88481d':'#136957')+'"/>';
      axes+='<text x="'+x+'" y="33" text-anchor="middle" style="font:bold 16px sans-serif">'+labels[i]+'</text><text x="'+x+'" y="78" text-anchor="middle" style="font:15px sans-serif">'+row[i]+'</text>';
    }
    return '<figure style="margin:.4em 0"><svg viewBox="0 0 272 94" style="display:block;width:100%;max-width:440px" role="img" aria-label="Участок координатной прямой. '+labels.map((name,i)=>name+' имеет координату '+row[i]).join(', ')+'. Координаты растут вправо.">'+axes+'</svg><figcaption>Стрелка направлена к большим числам.</figcaption></figure>';
  }
  function taskView(task,scene){
    const d=task.data.coordinateOrder,i=scene?.mode==='learn'?Math.min(scene.step,5):0;
    return draw(d.rows[i],d.labels);
  }
  function explore(lesson,s,task){
    const d=task.data.coordinateOrder,row=d.rows[s.row],right=s.side===1;
    return {title:'Сравни две отметки',controls:[{key:'row',title:'Пара',values:d.rows.map((_,i)=>[i,'абвгде'[i]])},
      {key:'side',title:'Какую точку найти',values:[[0,'Левую'],[1,'Правую']]}],
      visual:draw(row,d.labels),question:'Какова координата точки, которая стоит '+nameFor(right)+'?',answer:row[selected(row,right)],
      why:'Найди букву на нужной стороне, а затем прочитай координату под точкой.'};
  }
  const api={lessons,generators:Object.fromEntries(Object.keys(configs).map(n=>[n,(seed,rand,step)=>generate(n,seed,rand,step)])),
    bounds:Object.fromEntries(Object.entries(configs).map(([n,c])=>[n,{row:[0,5,0],side:[0,1,c.right?1:0]}])),read,inputIssue,mistake,draw:taskView,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5CoordinateOrder=api;
})(typeof window!=='undefined'?window:globalThis);
