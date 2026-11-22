/* Виленкин и соавторы, Математика 5, часть 2, §27, с. 22, №5.99 и 5.100. */
(function(root){
  'use strict';
  const lessons=[
    {number:'5.99',key:'printed-5-99',title:'Покажи две доли на отрезке в клетку',
      explanation:'Считай промежутки между делениями. Чтобы отметить долю, раздели длину единицы в клетках на знаменатель и отложи столько таких шагов, сколько указано в числителе.',
      worked:['Единицу длиной 18 клеток делим на 3 равные группы по 6 клеток. Две трети отмечаем после двух групп, в 12 клетках от нуля.'],
      misconception:'Для отметки дроби достаточно отсчитать от нуля столько клеток, сколько стоит в её числителе.',reflect:'Почему одна и та же точка имеет две дробные записи?'},
    {number:'5.100',key:'printed-5-100',title:'Отмечаем M и K на координатной прямой',
      explanation:'Отметь ноль и единицу. Сначала определи длину одной доли в клетках, затем отложи нужное число долей. Для второй точки снова считай от нуля. Если отметки совпали, оставь на месте оба имени.',
      worked:['Пусть единица равна 10 клеткам. Точка с координатой 2/5 находится после четырёх клеток. Точка с координатой 4/10 находится там же.'],
      misconception:'Точки с разными буквами всегда находятся на разных делениях прямой.',reflect:'Зачем при построении второй точки возвращаться к нулю?'}
  ].map(l=>({...l,part:2,point:27,page:22,requires:['v5f-printed-5-98'],related:['v5f-printed-5-98']}));
  const fmt=a=>a.join('/'),letters=['M','K'];
  function build(seed,r,step,coincident){
    const den=coincident?(seed?r(3,8):7):3,k=coincident?(seed?r(2,3):2):2;
    const length=coincident?den*k:(seed?6*r(2,5):24);
    const a=coincident?(seed?r(1,den-1):3):(seed?r(1,2):2);
    const b=coincident?a*k:seed?([1,3,5][r(0,2)]):5;
    const fractions=[[a,den],[b,den*k]],positions=fractions.map(([n,d])=>length/d*n),labels=coincident?letters:fractions.map(fmt);
    const data={length,fractions,positions,labels,coincident};
    const move=(i,prompt)=>({...step(prompt,positions[i],'Сначала узнай длину одной доли. Отложи столько таких долей, сколько стоит в числителе. Считай от нуля.',
      [{value:fractions[i][0],text:'Числитель считает доли. Проверь, сколько клеток содержит одна доля.'},{value:positions[i]+1,text:'Ноль — начало отрезка. Промежутки считаются после нуля.'}]),marker:i});
    const rows=[step('Единица на чертеже равна '+length+' клеткам. Сколько клеток в одной доле 1/'+den+'?',length/den,'Раздели весь единичный отрезок на число равных долей.'),
      move(0,'Поставь первую отметку '+(coincident?'M':'')+' с координатой '+fmt(fractions[0])+'. Передвинь метку или укажи число клеток от нуля.')];
    if(!coincident)rows.push(step('Теперь тот же единичный отрезок разделён на '+(den*k)+' равных долей. Сколько клеток в новой доле?',length/(den*k),'У целого по-прежнему '+length+' клеток.'));
    rows.push(move(1,'Отметь '+(coincident?'точку K':'вторую дробь')+' с координатой '+fmt(fractions[1])+'. Начни отсчёт клеток от нуля.'));
    const correct=seed?r(1,3):coincident?1:3;
    const options=coincident?['Каждую крупную долю разделили одинаково. Обе записи отсчитывают от нуля одно и то же расстояние.','Буквы различны, поэтому вторую точку всегда нужно сдвигать вправо.','Координату определяет один числитель, размер доли можно не учитывать.']:
      ['В клеточной записи снизу стоит число клеток всего единичного отрезка, а сверху — число клеток от нуля до отметки.','В знаменатель нужно поставить число штрихов на чертеже, включая ноль и единицу.','Для равной дроби достаточно поменять только знаменатель.'];
    data.options=Array.from({length:3},(_,i)=>options[(i+4-correct)%3]);data.firstRow=1;data.secondRow=rows.length-1;
    const context='Единичный отрезок — '+length+' клеток. Первая отметка '+(coincident?'M: ':'')+fmt(fractions[0])+', вторая '+(coincident?'K: ':'')+fmt(fractions[1])+'.';
    return {...step(context+' Поставь обе отметки и выбери объяснение. Можно также записать три числа: клетки до первой; клетки до второй; номер объяснения.',[...positions,correct],
      'Координата — расстояние от нуля в долях единицы. Весь отрезок от нуля до единицы соответствует знаменателю клеточной записи.',
      [{value:[...positions,(correct%3)+1],text:'Обе отметки стоят верно. Проверь объяснение: какую длину делят на равные части и откуда ведут отсчёт?'},{value:[...positions,((correct+1)%3)+1],text:'Отметки верны. Для равенства дробей должны совпасть сами расстояния от нуля.'}]),answerFormat:'v5-triple',
      steps:rows,data:{fractionLine:data},conditionKey:'cellLine/'+[length,...fractions.flat(),correct].join('/')};
  }
  function mark(v,limit){if(v===null||v===undefined||!/^\d+$/.test(String(v).trim()))return null;const n=Number(v);return Number.isSafeInteger(n)&&n<=limit?n:null;}
  function read(t,s){
    const p=t.data.fractionLine,i=s?.mode==='learn'?s.step:t.steps.length,entry=t.steps[i],answers=s?.answers||[],raw=String(s?.savedInput||'');
    let a=i>p.firstRow&&s?.mode==='learn'?mark(answers[p.firstRow],p.length):null,b=i>p.secondRow&&s?.mode==='learn'?mark(answers[p.secondRow],p.length):null,why=null;
    if(!entry&&raw){const [first,second,reason]=raw.split(';');a=mark(first,p.length);b=mark(second,p.length);why=mark(reason,3)||null;}
    else if(entry?.marker===0)a=mark(raw,p.length);else if(entry?.marker===1)b=mark(raw,p.length);
    return {a,b,why,entry};
  }
  function svg(p,a,b){
    const left=15,right=277,y=55,x=n=>left+(right-left)*n/p.length;
    const ticks=Array.from({length:p.length+1},(_,i)=>'<path d="M'+x(i)+' '+(y-4)+'v8" stroke="#315966"/>').join('');
    const axis='<path d="M7 '+y+'H292m-6 -4 6 4-6 4" fill="none" stroke="#315966" stroke-width="1.5"/>'+ticks;
    const dot=(n,i)=>{if(n===null)return '';const yy=i?y+28:y-21;return '<path d="M'+x(n)+' '+(i?y+4:y-4)+'V'+(i?yy-11:yy+3)+'" stroke="'+(i?'#855029':'#277269')+'"/><circle cx="'+x(n)+'" cy="'+y+'" r="'+(i?3.2:5)+'" fill="'+(i?'#9b573c':'#38897c')+'"/><text x="'+x(n)+'" y="'+yy+'" text-anchor="middle" style="font:13px system-ui,sans-serif" fill="#293e36">'+p.labels[i]+'</text>';};
    return '<svg class="v5q-printed-geometry" role="img" aria-label="Единица '+p.length+' клеток. Первая отметка '+(a===null?'пока не поставлена':a)+', вторая '+(b===null?'пока не поставлена':b)+'." viewBox="0 0 300 124" style="width:100%;max-width:440px;display:block">'+axis+dot(a,0)+dot(b,1)+'<text x="'+left+'" y="111" text-anchor="middle" style="font:12px system-ui,sans-serif">0</text><text x="'+right+'" y="111" text-anchor="middle" style="font:12px system-ui,sans-serif">1</text></svg>';
  }
  function draw(t,s){
    const p=t.data.fractionLine,{a,b,why,entry}=read(t,s),active=entry?.marker!==undefined?[entry.marker]:entry?[]:[0,1];
    const bars=active.map(i=>{const val=i?b:a;return '<label style="display:block;margin:.55em 0">'+(i?'Вторая':'Первая')+' отметка · '+p.labels[i]+' · <output data-line-out="'+i+'">'+(val===null?'выбери клетку':val+' кл.')+'</output><input type="range" style="display:block;width:100%;min-height:34px" data-line-mark="'+i+'" min="0" max="'+p.length+'" value="'+(val??0)+'" step="1" '+(s?.correct?'disabled':'')+'></label>';}).join('');
    const options=!entry?'<fieldset style="margin:.6em 0;padding:.5em"><legend>Почему?</legend>'+p.options.map((v,i)=>'<label style="display:block;margin:.45em 0"><input type="radio" name="v5-line-why" data-line-why="'+(i+1)+'" '+(why===i+1?'checked ':'')+(s?.correct?'disabled':'')+'> '+(i+1)+'. '+v+'</label>').join('')+'</fieldset>':'';
    return '<figure data-cell-answer style="margin:.55em 0"><div data-line-image>'+svg(p,a,b)+'</div><figcaption>Между 0 и 1 — '+p.length+' одинаковых промежутков.</figcaption>'+bars+options+'</figure>';
  }
  function bind(panel,t,s,readOnly){
    const p=t.data.fractionLine,figure=panel.querySelector('[data-cell-answer]'),input=panel.querySelector('#answer');if(!figure||!input)return;
    function redraw(){
      const {a,b,why}=read(t,{...s,savedInput:input.value});figure.querySelector('[data-line-image]').innerHTML=svg(p,a,b);
      figure.querySelectorAll('[data-line-mark]').forEach(el=>{const n=el.dataset.lineMark==='1'?b:a;el.value=String(n??0);figure.querySelector('[data-line-out="'+el.dataset.lineMark+'"]').textContent=n===null?'выбери клетку':n+' кл.';});
      figure.querySelectorAll('[data-line-why]').forEach(el=>{el.checked=why===Number(el.dataset.lineWhy);});
    }
    function change(key,val){
      if(readOnly()||s.correct)return;
      const scene=read(t,{...s,savedInput:input.value});
      if(scene.entry?.marker!==undefined)input.value=String(val);
      else {scene[key]=val;input.value=[scene.a,scene.b,scene.why].map(n=>n??'').join(';');}
      input.dispatchEvent(new Event('input',{bubbles:true}));
    }
    figure.querySelectorAll('[data-line-mark]').forEach(el=>{el.oninput=()=>change(el.dataset.lineMark==='1'?'b':'a',Number(el.value));});
    figure.querySelectorAll('[data-line-why]').forEach(el=>{el.onchange=()=>change('why',Number(el.dataset.lineWhy));});input.addEventListener('input',redraw);
  }
  function explore(t,s){
    const p=t.data.fractionLine,first=Math.min(p.length,s.leftTick),second=Math.min(p.length,s.rightTick);
    return {title:'Измерь расстояние между отметками',controls:[{key:'leftTick',title:'Первая отметка, клеток от нуля',values:Array.from({length:p.length+1},(_,i)=>[i,i])},{key:'rightTick',title:'Вторая отметка, клеток от нуля',values:Array.from({length:p.length+1},(_,i)=>[i,i])}],
      visual:svg({...p,labels:letters},first,second),question:'Сколько клеток разделяют эти две отметки?',answer:Math.abs(first-second),why:'Вычти меньшее число клеток из большего. У совпавших точек расстояние равно нулю.'};
  }
  const bounds={leftTick:[0,30,0],rightTick:[0,30,0]};
  const api={lessons,generators:{'5.99':(s,r,f)=>build(s,r,f,false),'5.100':(s,r,f)=>build(s,r,f,true)},bounds:{'5.99':bounds,'5.100':bounds},read,draw,bind,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5FractionCellLine=api;
})(typeof window!=='undefined'?window:globalThis);
