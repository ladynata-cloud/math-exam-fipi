/* Виленкин и соавторы, Математика 5, ч. 2, §27, печатные страницы 22–23. */
(function(root){
  'use strict';
  const meta=[
    [103,22,'Собери два ряда дробей по порядку','Сначала проверь знаменатели. Если все доли одинакового размера, по одной дроби в ряд выбираем по числу взятых долей. Для убывания начинай с самой большой.','У дробей 6/11, 2/11 и 7/11 по возрастанию первой идёт 2/11. После неё поставим 6/11, затем 7/11.','Ряд всегда надо начинать с наименьшего числителя, даже если требуется убывание.'],
    [104,22,'Поставь знаки между дробями','Знаменатели равны: сравнивай, сколько одинаковых долей взяли. Открытая сторона знака смотрит на большее число.','При одинаковом знаменателе 8/15 > 5/15: восемь одинаковых частей больше пяти.','Когда знаменатели равны, дроби равны независимо от числителей.'],
    [105,23,'Выбери меньшую дробь','Назови ту дробь, которой соответствует меньше одинаковых частей. Если числа велики, сначала сравни старшие разряды числителей.','У 35/1000 и 53/1000 знаменатель общий. Сравни десятки в 35 и 53: первая дробь меньше.','Если у двух дробей общий знаменатель 10 000, то меньшей будет дробь с большим числителем.'],
    [106,23,'Какая из двух точек правее?','Прочитай дроби у обеих точек. Знаменатель задаёт шаг, числитель — число таких шагов вправо от нуля. Ответь именем точки.','Если у A координата 3/10, а у B координата 7/10, то B правее A на четыре шага по 1/10.','На прямой правее всегда находится та точка, которая была названа первой.']
  ];
  const lessons=meta.map(([n,page,title,explanation,worked,misconception])=>({number:'5.'+n,key:'printed-5-'+n,part:2,point:27,page,title,explanation,worked:[worked],misconception,requires:['v5f-printed-5-101'],related:['v5f-printed-5-102'],reflect:'Что на рисунке задаёт размер одной доли?'}));
  const frac=(n,d)=>n+'/'+d,abc=['а','б','в','г'],sort=(a,up)=>a.slice().sort((x,y)=>up?x-y:y-x);
  function scramble(a,r){for(let i=a.length-1;i>0;i--){const j=r(0,i);[a[i],a[j]]=[a[j],a[i]];}return a;}
  function order(seed,r,step){
    const rows=seed?[[r(12,19),8],[r(13,20),7]].map(([d,k])=>[d,scramble(Array.from({length:d-1},(_,i)=>i+1),r).slice(0,k)]):[[13,[12,7,1,5,9,4,3,10]],[17,[4,1,13,6,5,16,9]]];
    const tasks=rows.map(([d,nums],i)=>({...step(abc[i]+'. Расставь дроби '+nums.map(n=>frac(n,d)).join(', ')+' по '+(i?'убыванию':'возрастанию')+'. Нажимай дроби в нужном порядке или введи их через точку с запятой.',sort(nums,!i).map(n=>frac(n,d)),'Проверь каждую соседнюю пару. Знаменатели одинаковы, поэтому направление задают числители.',
      [{value:sort(nums,!!i).map(n=>frac(n,d)),text:'Дроби отобраны правильно, но ряд идёт в другую сторону. Посмотри на слова «по '+(i?'убыванию':'возрастанию')+'».'}]),answerFormat:'v5-ordered-fractions',orderedDirection:i?'down':'up'}));
    return {...tasks[1],steps:[tasks[0]],data:{orderedFractions:rows},conditionKey:'order/'+rows.map(([d,nums])=>d+'_'+nums.join('_')).join('/')};
  }
  const rawPairs={104:[[4,9,10],[7,1,9],[8,13,17],[6,2,7]],105:[[6,2,7],[3,13,21],[23,21,100],[87,78,10000]],106:[[11,9,16],[3,8,18]]};
  const names=[['K','P'],['C','D']];
  function pairs(seed,r,step,kind){
    const rows=rawPairs[kind].map(([a,b,d])=>{
      if(!seed)return [a,b,d];
      const den=kind===105&&d>=100?d:r(10,30);
      const first=r(2,Math.min(92,den-2)),delta=r(1,Math.min(6,den-1-first)),second=first+delta;
      return r(0,1)?[first,second,den]:[second,first,den];
    });
    const tasks=rows.map(([a,b,d],i)=>{const one=frac(a,d),two=frac(b,d);
      if(kind===104)return {...step(abc[i]+'. Сравни '+one+' и '+two+'. Какой знак нужно поставить между ними?',a>b?'>':'<','Широкая сторона знака обращена к большему числителю.',
        [{value:a>b?'<':'>',text:'Открытая сторона знака должна смотреть на дробь, в которой больше одинаковых долей.'},{value:'=',text:'Доли равны по размеру, но посмотри, одинаково ли их количество.'}]),answerFormat:'v5-fraction-sign'};
      if(kind===105)return {...step(abc[i]+'. Какая дробь меньше: '+one+' или '+two+'?',frac(Math.min(a,b),d),'При общем знаменателе меньший числитель соответствует меньшей дроби.',
        [{value:frac(Math.max(a,b),d),text:'Ты выбрал большую дробь. Определи, где взяли меньше долей того же размера.'}]),answerFormat:'v5-unit-fraction'};
      const [l,h]=names[i];return {...step(abc[i]+'. '+l+' находится в '+one+', '+h+' — в '+two+'. Какая точка правее?',a>b?l:h,'Отсчитай от одного нуля одинаковые доли. Правее точка с большим числителем.',
        [{value:a>b?h:l,text:'Эта точка ближе к нулю. Посмотри, у какой точки больше шагов вправо от нуля.'}]),answerFormat:'v5-rightmost-label'};
    });
    const last=tasks.pop();return {...last,steps:tasks,data:{compareFractions:{kind,rows}},conditionKey:'compare/'+kind+'/'+rows.map(row=>row.join('_')).join('/')};
  }
  function symbol(raw){return String(raw).trim().replace(/^(меньше|менее)$/i,'<').replace(/^(больше|более)$/i,'>').replace(/^(равно|равны)$/i,'=');}
  function point(raw){return String(raw).trim().toUpperCase().replace(/^ТОЧКА\s+/,'').replace(/[КРСД]/g,c=>({'К':'K','Р':'P','С':'C','Д':'D'})[c]);}
  function numberLine(a,b,d,labels){
    const lo=Math.max(0,Math.min(a,b)-1),hi=Math.min(d,Math.max(a,b)+1),x=n=>20+(n-lo)/(hi-lo)*240;
    const ink=Number.isInteger(hi-lo)&&hi-lo<=32?Array.from({length:hi-lo+1},(_,i)=>'<path d="M'+x(lo+i)+' 46v8" stroke="#4f716d"/>').join(''):'';
    const mark=(n,i)=>'<path d="M'+x(n)+' 50V'+(i?67:33)+'" stroke="'+(i?'#a15f36':'#2b8175')+'" stroke-width="2.2"/><circle cx="'+x(n)+'" cy="50" r="3.8" fill="'+(i?'#a15f36':'#2b8175')+'"/><text x="'+x(n)+'" y="'+(i?82:27)+'" text-anchor="middle" style="font:13px system-ui,sans-serif">'+labels[i]+'</text>';
    return '<figure style="margin:.5em 0"><svg class="v5q-printed-geometry" role="img" aria-label="Участок прямой: '+labels[0]+' находится в '+frac(a,d)+', '+labels[1]+' в '+frac(b,d)+'" viewBox="0 0 280 91" style="display:block;width:100%;max-width:400px"><path d="M10 50H271m-6 -4 6 4-6 4" stroke="#36575b" fill="none"/>'+ink+mark(a,0)+mark(b,1)+'</svg><figcaption>Показан участок от '+frac(lo,d)+' до '+frac(hi,d)+'. Один шаг вправо — '+frac(1,d)+'.</figcaption></figure>';
  }
  function index(t,s){return s?.mode==='learn'?s.step:t.steps.length;}
  function draw(t,s){
    const i=index(t,s);if(t.data.orderedFractions){
      const [d,ns]=t.data.orderedFractions[i];return '<figure data-frac-order style="margin:.65em 0"><figcaption>Выбери следующую дробь по '+(i?'убыванию':'возрастанию')+'.</figcaption><div style="display:flex;flex-wrap:wrap;gap:.35em;margin:.5em 0">'+ns.map(n=>'<button type="button" class="quiet" style="min-width:52px" data-order-item="'+frac(n,d)+'">'+frac(n,d)+'</button>').join('')+'</div><p data-picked-fractions aria-live="polite"></p><button class="quiet" type="button" data-undo-fraction>Убрать последнюю</button></figure>';
    }
    const p=t.data.compareFractions,[a,b,d]=p.rows[i],labels=p.kind===106?names[i]:[frac(a,d),frac(b,d)];
    return numberLine(a,b,d,labels)+'<div style="display:flex;flex-wrap:wrap;gap:.5em;margin:.5em 0">'+(p.kind===104?['<','=','>']:p.kind===105?[frac(a,d),frac(b,d)]:labels).map(v=>'<button type="button" class="quiet" data-frac-choice="'+(v==='<'?'&lt;':v==='>'?'&gt;':v)+'">'+(v==='<'?'&lt;':v==='>'?'&gt;':v)+'</button>').join('')+'</div>';
  }
  function bind(panel,t,s,readonly,M,renderMath){
    const input=panel.querySelector('#answer'),parts=()=>input.value.split(';').map(x=>x.trim()).filter(Boolean);
    const set=v=>{if(s.correct||readonly())return;input.value=v;input.dispatchEvent(new Event('input',{bubbles:true}));};
    panel.querySelectorAll('[data-frac-choice]').forEach(el=>{el.disabled=!!s.correct;el.onclick=()=>set(el.dataset.fracChoice);});
    if(!t.data.orderedFractions)return;
    const update=()=>{const picked=parts(),summary=panel.querySelector('[data-picked-fractions]');summary.textContent=picked.length?'Твой ряд: '+picked.join(' → '):'Ряд пока пуст.';renderMath(summary);
      panel.querySelector('[data-undo-fraction]').disabled=s.correct||!picked.length;panel.querySelectorAll('[data-order-item]').forEach(el=>{const used=picked.some(v=>M.equal(v,el.dataset.orderItem));el.disabled=!!s.correct||used;el.setAttribute('aria-pressed',String(used));});};
    panel.querySelectorAll('[data-order-item]').forEach(el=>el.onclick=()=>set([...parts(),el.dataset.orderItem].join(';')));
    panel.querySelector('[data-undo-fraction]').onclick=()=>set(parts().slice(0,-1).join(';'));input.addEventListener('input',update);update();
  }
  function orderIssue(value,t,M){
    const parts=String(value).split(';').map(s=>s.trim());if(parts.length!==t.answer.length||parts.some(v=>!/^\d+\s*\/\s*\d+$/.test(v)||!M.parse(v)))return 'Ряд ещё можно дополнить. Нужны все '+t.answer.length+' дробей через точку с запятой.';return '';
  }
  function orderError(value,t,M){
    const vs=value.split(';').map(s=>s.trim()),pos=vs.findIndex(s=>!t.answer.some(v=>M.equal(s,v)));if(pos>=0)return 'Дроби '+vs[pos]+' не было в исходном наборе. Выбери её из предложенных.';
    for(let i=1;i<vs.length;i++){const a=M.parse(vs[i-1]),b=M.parse(vs[i]);if(!a||!b)continue;
      if(a.n*b.d===b.n*a.d)return 'Дробь '+vs[i]+' повторилась. Каждую карточку используй один раз.';
      if(t.orderedDirection==='down'?a.n*b.d<b.n*a.d:a.n*b.d>b.n*a.d)return 'Проверь соседние дроби '+vs[i-1]+' и '+vs[i]+'. В этом ряду следующая должна быть '+(t.orderedDirection==='down'?'меньше.':'больше.');}
    return '';
  }
  function explore(t,s){
    const rows=t.data.compareFractions?.rows||t.data.orderedFractions.map(([d,ns])=>[ns[0],ns[1],d]);const [a,b,d]=rows[Math.min(rows.length-1,s.pairIndex)];
    return {title:'Сравни точки на увеличенном участке',controls:[{key:'pairIndex',title:'Пара',values:rows.map((_,i)=>[i,abc[i]])}],visual:numberLine(a,b,d,['A','B']),question:'Сколько шагов по 1/'+d+' разделяет эти точки?',answer:Math.abs(a-b),why:'Вычти меньшее количество одинаковых долей из большего.'};
  }
  const generators={'5.103':order};for(const n of [104,105,106])generators['5.'+n]=(s,r,step)=>pairs(s,r,step,n);
  const api={lessons,generators,bounds:Object.fromEntries(lessons.map(l=>[l.number,{pairIndex:[0,rawPairs[Number(l.number.slice(2))]?.length-1||1,0]}])),draw,explore,bind,orderIssue,orderError,symbol,point};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5OrderAndCompare=api;
})(typeof window!=='undefined'?window:globalThis);
