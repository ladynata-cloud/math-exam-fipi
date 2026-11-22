/* Виленкин и соавторы, 5 класс, часть 2, §27, №5.98, печатная с. 22. */
(function(root){
  'use strict';
  const lesson={number:'5.98',key:'printed-5-98',part:2,point:27,page:22,title:'Почему две дроби закрашивают одинаковую площадь?',
    requires:['v5f-printed-5-51'],related:['v5f-printed-check-26-1'],
    explanation:'Возьми два одинаковых целых. На втором рисунке проведи дополнительные границы, не изменяя закраску. Одна прежняя часть распадается на несколько мелких. Во сколько раз уменьшается одна доля, во столько же раз больше мелких долей приходится на окрашенную часть.',
    worked:['Половину шоколадки составляют 2 из 4 равных полосок. Если каждую полоску разделить пополам, получится 4 из 8 маленьких частей той же шоколадки.'],
    misconception:'Дробь становится больше всякий раз, когда увеличивается её числитель.',reflect:'Как провести новые границы на рисунке, чтобы изменилась запись дроби и сохранилась закрашенная площадь?'};
  const original=[[1,3,3],[5,6,2],[1,4,3],[2,5,4]];
  const reasons=['Меняем границы внутри частей. Закраска остаётся на том же месте, а число всех и число закрашенных частей умножаются на один множитель.',
    'Достаточно прибавить одно и то же число к числителю и знаменателю, чтобы любая дробь сохранила значение.',
    'Дроби равны всякий раз, когда на рисунках закрашено одинаковое число частей.'];
  function circle(n,d,k,refined){
    const cx=55,cy=55,rad=42,count=refined?d*k:d;
    const pt=i=>{const a=-Math.PI/2+2*Math.PI*i/d;return [cx+rad*Math.cos(a),cy+rad*Math.sin(a)];};
    const a=pt(0),b=pt(n),wedge='M'+cx+' '+cy+' L'+a.join(' ')+' A'+rad+' '+rad+' 0 '+(2*n>d?1:0)+' 1 '+b.join(' ')+' Z';
    const lines=Array.from({length:count},(_,i)=>{const end=pt(i*(refined?1/k:1));return '<path d="M'+cx+' '+cy+'L'+end.join(' ')+'" fill="none" stroke="'+(refined&&i%k?'#5c8178':'#244e51')+'" stroke-width="'+(refined&&i%k?.9:1.4)+'"/>';}).join('');
    return '<circle cx="'+cx+'" cy="'+cy+'" r="'+rad+'" fill="white"/><path d="'+wedge+'" fill="#9ccfba"/>'+lines+'<circle cx="'+cx+'" cy="'+cy+'" r="'+rad+'" fill="none" stroke="#244e51" stroke-width="1.5"/>';
  }
  function rectangle(n,d,k,refined,last){
    const left=11,top=18,w=88,h=74,col=w/d,sw=col*n;
    let lines='';
    for(let i=1;i<d;i++)lines+='<path d="M'+(left+col*i)+' '+top+'v'+h+'" stroke="#244e51" stroke-width="1.4"/>';
    if(refined)for(let j=1;j<k;j++)lines+='<path d="M'+left+' '+(top+h*j/k)+'h'+w+'" stroke="#5c8178" stroke-width="1"/>';
    return '<rect x="'+left+'" y="'+top+'" width="'+w+'" height="'+h+'" fill="white"/><rect x="'+(last?left+w-sw:left)+'" y="'+top+'" width="'+sw+'" height="'+h+'" fill="#9ccfba"/>'+lines+'<rect x="'+left+'" y="'+top+'" width="'+w+'" height="'+h+'" stroke="#244e51" stroke-width="1.5" fill="none"/>';
  }
  function figures(row,index,refined=true){
    const [n,d,k]=row,title=index<2?'круга':'прямоугольника';
    const shape=fine=>index<2?circle(n,d,k,fine):rectangle(n,d,k,fine,index===3);
    const image=(fine)=>'<svg role="img" aria-label="Одинаковые доли '+title+', закрашено '+(fine?n*k:n)+' из '+(fine?d*k:d)+'" viewBox="0 0 110 110" style="width:100%;height:auto;display:block">'+shape(fine)+'</svg>';
    return '<figure style="margin:.45em 0"><div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);max-width:370px;gap:.45rem">'+image(false)+image(refined)+'</div><figcaption>Два одинаковых целых. Слева видны исходные доли, справа '+(refined?'проведены дополнительные границы.':'пока те же границы.')+'</figcaption></figure>';
  }
  function generate(seed,r,step){
    const rows=seed?original.map((o,i)=>{const d=i<2?r(3,7):r(3,6);return [r(1,d-1),d,r(2,4)];}):original;
    const steps=rows.map(([n,d,k],i)=>step(['а','б','в','г'][i]+'. Закрашено '+n+' из '+d+' крупных частей. На правом рисунке запиши долю с новыми границами и укажи, на сколько мелких частей разделили каждую крупную. Например: дробь; число.',
      [(n*k)+'/'+(d*k),k],'Обрати внимание на одну исходную часть. Затем умножь на один и тот же множитель число всех частей и число закрашенных частей.',
      [{value:[n+'/'+d,1],text:'Площадь ты сохранил. Теперь посчитай, сколько новых частей получилось из одной крупной.'},{value:[n+'/'+(d*k),k],text:'Знаменатель пересчитан. Закрашенные части тоже разделили.'}]));
    steps.forEach((s,i)=>{s.answerFormat='v5-refined-area';s.refinement=rows[i];});
    const order=seed?r(0,2):1,options=[reasons[(3-order)%3],reasons[(4-order)%3],reasons[(5-order)%3]];
    return {...step('Как объяснить все четыре равенства школьнику, который только знакомится с дробями? Выбери подходящее объяснение под рисунком, введи его номер. Если хочешь, сохрани своё объяснение в «Моя запись».',order+1,
      'Каждый кусочек делят одинаково, а окрашенную область оставляют на прежнем месте. Поэтому числитель и знаменатель умножаются на один и тот же множитель.'),
      errors:options.flatMap((s,i)=>s===reasons[1]?[{value:i+1,text:'Попробуй прибавить по одному к обеим частям записи 1/2. Получится 2/3. Сравни их по рисунку.'}]:s===reasons[2]?[{value:i+1,text:'Одна из двух частей и одна из четырёх частей имеют разные площади, хотя закрашено в обоих случаях по одной.'}]:[]),
      steps,data:{equivalentArea:{rows,options}},conditionKey:'equalArea/'+[...rows.flat(),order].join('/')};
  }
  function parse(raw){
    const m=/^\s*(\d+)\s*\/\s*(\d+)\s*;\s*(\d+)\s*$/.exec(String(raw));if(!m)return null;
    const nums=m.slice(1).map(Number);return nums.every(Number.isSafeInteger)&&nums[1]>0?nums:null;
  }
  function accepts(raw,target){const v=parse(raw),[n,d,k]=target.refinement;return !!v&&v[0]===n*k&&v[1]===d*k&&v[2]===k;}
  function feedback(raw,target){
    const v=parse(raw),[n,d,k]=target.refinement;if(!v)return '';
    if(v[0]*d===v[1]*n&&(v[0]!==n*k||v[1]!==d*k))return 'Площадь совпадает. Запиши дробь именно по мелким частям справа: сколько из них закрашено и сколько всего?';
    if(v[2]!==k)return 'Сравни одну крупную часть с тем же участком справа. Пересчитай мелкие части внутри его границ.';
    return 'Множитель верен. Примени его и к закрашенным, и ко всем крупным частям.';
  }
  function draw(t,s){
    const p=t.data.equivalentArea,i=s?.mode==='learn'?s.step:4;
    if(i<4)return figures(p.rows[i],i);
    return figures(p.rows[0],0)+'<ol>'+p.options.map(v=>'<li style="margin:.5em 0">'+v+'</li>').join('')+'</ol>';
  }
  function explore(t,s){const i=s.example,[n,d]=t.data.equivalentArea.rows[i],k=s.pieces;
    return {title:'Раздели каждую долю ещё раз',controls:[{key:'example',title:'Исходный рисунок',values:['а','б','в','г'].map((a,i)=>[i,a])},{key:'pieces',title:'Новых частей из одной',min:1,max:4,step:1}],visual:figures([n,d,k],i,k>1),question:'Сколько мелких частей закрашено справа после твоего деления?',answer:n*k,why:'Каждая из '+n+' закрашенных долей разбита на '+k+' частей.'};}
  const api={lessons:[lesson],generators:{'5.98':generate},bounds:{'5.98':{example:[0,3,0],pieces:[1,4,2]}},draw,explore,parse,accepts,feedback};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5EquivalentArea=api;
})(typeof window!=='undefined'?window:globalThis);
