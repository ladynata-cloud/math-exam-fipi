/* Часть 2, §27, печатная с. 22. №5.101–5.102. */
(function(root){
  'use strict';
  const lessons=[
    {number:'5.101',key:'printed-5-101',title:'Ставим на прямой точки с заданными дробями',
      explanation:'Сначала поставь ноль и единицу. Оставь между ними столько делений, чтобы каждая нужная доля заняла целое число клеток. Для каждой точки считай клетки от одного и того же нуля.',
      worked:['На шкале с десятью клетками одна пятая занимает две клетки, а три пятых — шесть клеток от нуля. Дробь с тем же знаменателем не требует новой шкалы.'],
      misconception:'Для очередной дроби надо отсчитывать доли от предыдущей точки.',reflect:'Как удобная разметка единичного отрезка помогает сразу с двумя знаменателями?'},
    {number:'5.102',key:'printed-5-102',title:'Находим крайнюю правую и крайнюю левую точки',
      explanation:'Изобрази все дроби на одном единичном отрезке. Проверь, сколько клеток занимает одна доля для каждого знаменателя. Самая правая точка дальше всего от нуля, самая левая — ближе всех.',
      worked:['На шкале в восемь клеток 1/4 занимает две клетки, а 3/8 — три. Поэтому 3/8 находится правее 1/4.'],
      misconception:'Дробь с наибольшим знаменателем всегда находится правее всех.',reflect:'Как узнать наименьшую из отмеченных дробей по одному рисунку?'}
  ].map(l=>({...l,part:2,point:27,page:22,requires:['v5f-printed-5-100'],related:['v5f-printed-5-99']}));
  const label=([n,d])=>n+'/'+d;
  function plotting(group,length,step,title){
    const positions=group.map(([n,d])=>length*n/d),text=group.map(label).join(', ');
    return {...step(title+' Поставь отметки '+text+' на шкале от 0 до 1 ('+length+' клеток). Можно двигать метки или записать расстояния от нуля через точку с запятой.',positions,
      'Для каждой дроби раздели длину единицы на знаменатель и умножь на числитель. Проверь порядок отметок.',
      [{value:positions.map(x=>x+1),text:'Первая клетка заканчивается после нуля. Считай промежутки, а не штрихи вместе с нулевым.'}]),answerFormat:'v5-list'};
  }
  function build101(seed,r,step){
    const d=seed?r(6,9):6,length=d*2,a=Array.from({length:5},(_,i)=>[i+1,d]),b=Array.from({length:6},(_,i)=>[2*i+1,length]);
    if(seed&&r(0,1)){a.reverse();b.reverse();}
    const rows=[plotting(a,length,step,'а.'),plotting(b,length,step,'б.')];return {...rows[1],steps:[rows[0]],data:{pointSets:{length,groups:[a,b],extremes:false}},conditionKey:'set101/'+[length,label(a[0])].join('/')};
  }
  function build102(seed,r,step){
    const length=seed?12*r(1,3):12;
    const group=seed?[[1,4],[1,2],[1,6],[5,6],[2,3],[1,3]]:[[1,2],[1,3],[1,6],[1,12],[2,3],[3,4]];
    if(seed)for(let i=group.length-1;i>0;i--){const j=r(0,i);[group[i],group[j]]=[group[j],group[i]];}
    const plot=plotting(group,length,step,'Сначала отметь дроби.'),xs=plot.answer,hi=xs.indexOf(Math.max(...xs))+1,lo=xs.indexOf(Math.min(...xs))+1;
    return {...step(plot.prompt+' Затем выбери сначала крайнюю правую, потом крайнюю левую точку. Все клетки и оба выбора видны в строке ответа.',
      [...xs,hi,lo],'На одной и той же шкале сравни расстояния от нуля. Сперва назови самую дальнюю, затем ближайшую точку.',[{value:[...xs,lo,hi],text:'Обе крайние точки найдены, но перепутан порядок. Сначала укажи правую, затем левую.'}]),answerFormat:'v5-list',
      steps:[plot],data:{pointSets:{length,groups:[group,group],extremes:true}},conditionKey:'set102/'+[length,...group.map(label)].join('/')};
  }
  const colors=['#2d776b','#905133','#394e8b','#804569','#476c33','#66448c'];
  function dataFor(t,s){
    const p=t.data.pointSets,stage=s?.mode==='learn'&&s.step===0?0:1,group=p.groups[stage],end=stage===1&&p.extremes,raw=String(s?.savedInput||'');
    const text=raw||(end&&s?.mode==='learn'?s?.answers?.[0]||'':'');
    const entries=text.split(';').map(v=>/^\d+$/.test(v.trim())?Number(v):null);
    return {p,group,end,entries:Array.from({length:group.length+(end?2:0)},(_,i)=>{const n=entries[i],max=i<group.length?p.length:group.length;return n!=null&&n>=0&&n<=max?n:null;})};
  }
  const tag=i=>String.fromCharCode(65+i);
  function line(length,values){
    const left=20,width=260,x=n=>left+width*n/length,axis=84;
    const tick=Array.from({length:length+1},(_,i)=>'<path d="M'+x(i)+' 80v8" stroke="#406567" stroke-width="1"/>').join('');
    const ranks=new Map(),labels=values.map((v,i)=>({v,i})).filter(e=>e.v!==null).sort((a,b)=>a.v-b.v||a.i-b.i);
    const ends=[-100,-100,-100,-100,-100,-100];
    for(const e of labels){const n=x(e.v);let slot=ends.findIndex(stop=>stop<n-13);if(slot<0)slot=5;ends[slot]=n;ranks.set(e.i,slot);}
    const marks=values.map((v,i)=>{if(v===null)return '';const px=x(v),l=axis-12-11*ranks.get(i);
      return '<path d="M'+px+' 83V'+(l+2)+'" stroke="'+colors[i]+'" fill="none"/><circle cx="'+px+'" cy="84" r="2.8" fill="'+colors[i]+'"/><text x="'+px+'" y="'+l+'" style="font:10px system-ui,sans-serif" text-anchor="middle">'+tag(i)+'</text>';}).join('');
    return '<svg class="v5q-printed-geometry" role="img" aria-label="Отметки в клетках от нуля: '+values.map((v,i)=>tag(i)+' '+(v===null?'ещё не поставлена':v)).join(', ')+'" viewBox="0 0 300 107" style="display:block;width:100%;max-width:440px"><path d="M7 84H294m-5 -4 5 4-5 4" fill="none" stroke="#31545c" stroke-width="1.5"/>'+tick+marks+'<text x="20" y="102" text-anchor="middle" style="font:12px system-ui,sans-serif">0</text><text x="280" y="102" text-anchor="middle" style="font:12px system-ui,sans-serif">1</text></svg>';
  }
  function draw(t,s){
    const {p,group,end,entries}=dataFor(t,s),disabled=s?.correct?'disabled':'';
    const form=group.map((f,i)=>'<label style="display:block;margin:.38em 0">'+tag(i)+' · '+label(f)+' · <output data-set-pos="'+i+'">'+(entries[i]===null?'выбери клетку':entries[i]+' кл.')+'</output><input style="width:100%;display:block;min-height:30px" type="range" data-set-mark="'+i+'" min="0" max="'+p.length+'" value="'+(entries[i]??0)+'" '+disabled+'></label>').join('');
    const selectors=end?['Крайняя правая','Крайняя левая'].map((title,j)=>'<label style="display:block;margin:.45em 0">'+title+' <select data-set-end="'+(group.length+j)+'" '+disabled+'><option value="">Выбери точку</option>'+group.map((f,i)=>'<option value="'+(i+1)+'" '+(entries[group.length+j]===i+1?'selected':'')+'>'+tag(i)+' · '+label(f)+'</option>').join('')+'</select></label>').join(''):'';
    return '<figure data-set-chart style="margin:.5em 0"><div data-set-image>'+line(p.length,entries.slice(0,group.length))+'</div><figcaption>От нуля до единицы '+p.length+' клеток. Каждая буква относится к дроби в своей строке.</figcaption>'+form+selectors+'</figure>';
  }
  function bind(panel,t,s,readOnly){
    const fig=panel.querySelector('[data-set-chart]'),input=panel.querySelector('#answer');if(!fig||!input)return;
    const read=()=>dataFor(t,{...s,savedInput:input.value});
    const redraw=()=>{const {p,group,entries}=read();fig.querySelector('[data-set-image]').innerHTML=line(p.length,entries.slice(0,group.length));
      fig.querySelectorAll('[data-set-mark]').forEach(el=>{const i=Number(el.dataset.setMark),v=entries[i];el.value=String(v??0);fig.querySelector('[data-set-pos="'+i+'"]').textContent=v===null?'выбери клетку':v+' кл.';});
      fig.querySelectorAll('[data-set-end]').forEach(el=>el.value=String(entries[Number(el.dataset.setEnd)]??''));};
    const apply=(i,v)=>{if(s.correct||readOnly())return;const {entries}=read();entries[i]=v;input.value=entries.map(n=>n??'').join(';');input.dispatchEvent(new Event('input',{bubbles:true}));};
    fig.querySelectorAll('[data-set-mark]').forEach(el=>el.oninput=()=>apply(Number(el.dataset.setMark),Number(el.value)));
    fig.querySelectorAll('[data-set-end]').forEach(el=>el.onchange=()=>apply(Number(el.dataset.setEnd),el.value?Number(el.value):null));input.addEventListener('input',redraw);
  }
  function feedback(t,s,raw){
    const {p,group,end,entries}=dataFor(t,{...s,savedInput:raw});
    if(entries.some(v=>v===null))return '';
    for(const [i,[n,d]] of group.entries()){
      if(entries[i]===p.length*n/d)continue;
      return 'Проверь '+tag(i)+' ('+n+'/'+d+'). В одной такой доле '+p.length+' : '+d+' клеток. Отметь '+n+' таких долей от нуля.';
    }
    return end?'Метки на местах. Сравни, какая из них дальше всех от нуля, а какая ближе. Сначала выбирай правую точку.':'';
  }
  function explore(t,s){
    const p=t.data.pointSets,g=p.groups[s.sheet],i=Math.min(s.which,g.length-1),f=g[i],n=p.length*f[0]/f[1],marks=g.map((_,j)=>j===i?n:null);
    return {title:'Прочитай отметку на общей шкале',controls:[{key:'sheet',title:'Ряд точек',values:[[0,'Первый'],[1,'Второй']]},{key:'which',title:'Исследуем точку',values:g.map((f,j)=>[j,tag(j)+' · '+label(f)])}],visual:line(p.length,marks),question:'Сколько клеток от нуля до выделенной точки?',answer:n,why:'Единица состоит из '+p.length+' клеток. Раздели это число на '+f[1]+' и умножь на '+f[0]+'.'};
  }
  const bounds={sheet:[0,1,0],which:[0,5,0]};
  const api={lessons,generators:{'5.101':build101,'5.102':build102},bounds:{'5.101':bounds,'5.102':bounds},draw,explore,bind,dataFor,line,feedback};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5PlotFractionSets=api;
})(typeof window!=='undefined'?window:globalThis);
