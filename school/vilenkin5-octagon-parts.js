/* Виленкин и соавторы, 5 класс, часть 2, §27, с. 23, №5.110. */
(function(root){
  'use strict';
  // Номер сектора — номер его первой вершины при обходе по часовой стрелке.
  const vertices=['A','M','N','C','D','E','K','P'];
  const source=[
    ['AOP','MNCDEKPA',[7],[0,1,2,3,4,5,6,7]],
    ['MNO','MNOA',[1],[0,1]],
    ['MNO','MNKPA',[1],[6,7,0,1]],
    ['NCDO','NCDEK',[2,3],[2,3,4,5]],
    ['MNCDE','MNCDEKPA',[1,2,3,4],[0,1,2,3,4,5,6,7]]
  ];
  const lesson={part:2,point:27,page:23,number:'5.110',key:'printed-5-110',title:'Какую часть одной фигуры занимает другая?',
    explanation:'Весь рисунок разделён на одинаковые треугольники. Найди на нём фигуру, которую в вопросе приняли за целое. Сосчитай её треугольники, затем треугольники внутри выделенной части.',
    worked:['Если целое состоит из шести равных треугольников, а часть занимает два из них, её доля равна 2/6, или 1/3.'],
    misconception:'В знаменателе всегда должно стоять восемь, ведь на странице нарисован восьмиугольник.',reflect:'Почему одна и та же фигура может занимать разные доли?',requires:['v5f-printed-5-98'],related:['v5f-printed-5-109']};
  const letter=i=>'абвгд'[i],range=(start,n)=>Array.from({length:n},(_,i)=>(start+i)%8);
  function fanName(sectors){
    if(sectors.length===8)return vertices.join('');
    const last=(sectors.at(-1)+1)%8;
    return sectors.map(i=>vertices[i]).join('')+vertices[last]+(sectors.length===4?'':'O');
  }
  function repeat(random){
    const r=(a,b)=>a+Math.floor(random(0,2147483647)/2147483648*(b-a+1));
    return source.map(()=>{
      const count=[2,3,4,8][r(0,3)],n=r(1,Math.min(4,count-1)),whole=range(r(0,7),count);
      const start=r(0,count-n),part=whole.slice(start,start+n);
      return [fanName(part),fanName(whole),part,whole];
    });
  }
  function generate(seed,r,step){
    const rows=seed?repeat(r):source;
    const questions=rows.map(([partName,wholeName,part,whole],i)=>{
      const mistakes=[{value:whole.length+'/'+part.length,text:'Дробь получилась больше единицы. Посчитай треугольники части для числителя, а целого — для знаменателя.'}];
      if(whole.length!==8)mistakes.push({value:part.length+'/8',text:'Ты сравнил часть со всем восьмиугольником. Здесь за целое взята только фигура '+wholeName+'. Сколько треугольников внутри её контура?'});
      return {...step(letter(i)+'. Какую долю площади '+wholeName+' занимает фигура '+partName+'?',part.length+'/'+whole.length,'Верхнее число относится к '+partName+', нижнее — к '+wholeName+'. Считай одинаковые треугольники.',mistakes),answerFormat:'v5-unit-fraction'};
    });
    const final=questions.pop();
    return {...final,steps:questions,inputPrompt:'Доля площади',data:{octagonRows:rows},conditionKey:'octagon/'+rows.map(r=>r[0]+'-'+r[1]).join('/')};
  }
  const center=[140,120],point=(i,r)=>{const angle=Math.PI+i*Math.PI/4;return [center[0]+r*Math.cos(angle),center[1]+r*Math.sin(angle)];};
  const xy=(p)=>p.map(v=>v.toFixed(2)).join(',');
  function outline(sectors){
    const corners=sectors.map(i=>point(i,83));
    if(sectors.length<8)corners.push(point((sectors.at(-1)+1)%8,83),center);
    return corners.map(xy).join(' ');
  }
  function figure(row,mode){
    const [partName,wholeName,part,whole]=row;
    const panels=vertices.map((v,i)=>{
      const selected=mode===2&&part.includes(i),inWhole=mode>0&&whole.includes(i);
      return '<polygon points="'+[center,point(i,83),point((i+1)%8,83)].map(xy).join(' ')+'" fill="'+(selected?'#f5bc66':inWhole?'#bfded2':'#f5f6f2')+'" stroke="#5a716a" stroke-width="1.2"/>';
    }).join('');
    const labels=vertices.map((v,i)=>{const [x,y]=point(i,102);return '<text x="'+x+'" y="'+(y+5)+'">'+v+'</text>';}).join('');
    let marks=mode>0?'<polygon points="'+outline(whole)+'" fill="none" stroke="#23624e" stroke-width="2.5"/>':'';
    if(mode===2)marks+='<polygon points="'+outline(part)+'" fill="none" stroke="#814816" stroke-dasharray="5 3" stroke-width="3"/>';
    return '<figure style="margin:.4em 0"><svg role="img" aria-label="Восьмиугольник с центром O. Часть '+partName+', целое '+wholeName+'" viewBox="0 0 280 237" style="display:block;width:100%;max-width:340px">'+panels+marks+'<g text-anchor="middle" style="font:bold 14px system-ui,sans-serif;fill:#1f4038">'+labels+'<text x="150" y="117" style="paint-order:stroke;stroke:white;stroke-width:3px">O</text></g></svg><figcaption>'+ (mode===2?'Сплошной контур — целое '+wholeName+'. Пунктир — часть '+partName+'.':mode===1?'Сплошной контур показывает целое '+wholeName+'. Найди внутри него '+partName+'.':'На рисунке восемь равных треугольников. Найди контуры по буквам.')+'</figcaption></figure>';
  }
  function draw(task,scene){const rows=task.data.octagonRows,index=scene?.mode==='learn'?scene.step:rows.length-1;return figure(rows[index],0);}
  function explore(task,state){
    const row=task.data.octagonRows[state.row];
    return {title:'Выбери, что считать за целое',controls:[{key:'row',title:'Подпункт',values:source.map((_,i)=>[i,letter(i)])},{key:'layer',title:'Рисунок',values:[[0,'Без выделения'],[1,'Контур целого'],[2,'Целое и его часть']]}],
      visual:figure(row,state.layer),question:'Сколько одинаковых треугольников составляет целое '+row[1]+'?',answer:row[3].length,why:'Пересчитай треугольники внутри контура целого.'};
  }
  const api={lessons:[lesson],generators:{'5.110':generate},bounds:{'5.110':{row:[0,4,0],layer:[0,2,0]}},draw,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5OctagonParts=api;
})(typeof window!=='undefined'?window:globalThis);
