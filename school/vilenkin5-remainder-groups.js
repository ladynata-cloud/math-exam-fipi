/* Виленкин и соавторы, 5 класс, часть 2, §27, с. 23, №5.112. */
(function(root){
  'use strict';
  const original=[[7,3],[110,40],[39,7],[200,13]];
  const lesson={number:'5.112',key:'printed-5-112',part:2,point:27,page:23,title:'Полные группы и остаток',
    explanation:'Уложи столько полных групп, сколько помещается. После этого пересчитай оставшиеся предметы. Если из остатка можно собрать ещё одну полную группу, увеличь частное.',
    worked:['Для 29 предметов и групп по 6 подойдут четыре полные группы. Проверяем: 6 · 4 + 5 = 29; пяти предметов для следующей группы мало.'],
    misconception:'При делении с остатком достаточно восстановить делимое умножением и сложением.',reflect:'Почему проверки равенства недостаточно без сравнения остатка с делителем?',
    requires:['v5f-printed-5-107'],related:['v5f-printed-5-98']};
  function generate(seed,r,step){
    const data=original.map(([n,d])=>{if(!seed)return [n,d];const size=r(4,19),full=r(2,15);return [size*full+r(0,size-1),size];});
    const rows=data.map(([n,d],i)=>{
      const q=Math.floor(n/d),rem=n-d*q;
      return {...step('абвг'[i]+'. Раздели '+n+' на '+d+'. Запиши неполное частное и остаток через точку с запятой.',[q,rem],
        'Сравни соседние кратные '+d+'. После полных групп остаток должен быть от 0 до '+(d-1)+'.',[
          {value:[q-1,rem+d],text:'Сумма сходится, но из твоего остатка помещается ещё одна группа по '+d+'.'},
          {value:[rem,q],text:'Проверь порядок: сначала число полных групп, затем остаток.'},
          {value:[q,n],text:'Делимое — это весь запас. Вычти из него то, что вошло в полные группы.'}
        ]),divisor:d,answerFormat:'v5-pair'};
    });
    const final=rows.pop();return {...final,steps:rows,inputPrompt:'Частное; остаток',data:{divisionGroups:data},conditionKey:'remainder112/'+data.map(x=>x.join(':')).join('/')};
  }
  function strip(n,d,k){
    const end=d*k,max=Math.max(n,end+d),x=v=>17+252*v/max;
    const complete=Array.from({length:k},(_,i)=>'<rect x="'+x(d*i)+'" y="37" width="'+(252*d/max-.8)+'" height="18" fill="#b6d7c9" stroke="#39715d"/>').join('');
    const gap='<rect x="'+x(Math.min(n,end))+'" y="59" width="'+Math.abs(x(n)-x(end))+'" height="11" fill="'+(n<end?'#c89588':'#edbd70')+'"/>';
    return '<svg viewBox="0 0 286 93" role="img" aria-label="Полные группы по '+d+', выбранное количество '+k+', весь запас '+n+'" style="width:100%;max-width:415px;display:block"><path d="M17 49H270" stroke="#34584e"/>'+complete+gap+'<path d="M'+x(n)+' 23V76" stroke="#8a421e" stroke-width="2" stroke-dasharray="4 2"/><text x="'+x(n)+'" y="18" text-anchor="middle" style="font:14px system-ui,sans-serif">'+n+'</text><text x="17" y="88" style="font:13px system-ui,sans-serif">0</text></svg>';
  }
  function draw(t,s){const rows=t.data.divisionGroups,i=s?.mode==='learn'?s.step:3,[n,d]=rows[i];return '<figure style="margin:.4em 0">'+strip(n,d,1)+'<figcaption>Одна ячейка — '+d+'. Отметка показывает, где кончается запас.</figcaption></figure>';}
  function explore(t,s){
    const [n,d]=t.data.divisionGroups[s.row],q=Math.floor(n/d),count=Math.max(0,q+s.offset-1),delta=n-count*d;
    return {title:'Проверь соседние кратные',controls:[{key:'row',title:'Подпункт',values:original.map((_,i)=>[i,'абвг'[i]])},{key:'offset',title:'Сравни варианты группировки',values:[[0,'Меньше групп'],[1,'Средний вариант'],[2,'Больше групп']]}],
      visual:strip(n,d,count)+'<p>Выбрано полных групп: '+count+'. В каждой по '+d+'.</p>',
      question:delta<0?'Скольких предметов не хватает для выбранного числа групп?':'Сколько предметов останется после выбранных групп?',answer:Math.abs(delta),
      why:delta<0?'Умножь число групп на размер одной группы и вычти имеющийся запас.':delta>=d?'Остаток ещё позволяет составить полную группу.':'Остаток меньше делителя: ещё одна полная группа не поместится.'};
  }
  function feedback(raw,target){
    const parts=String(raw).trim().split(/\s*;\s*/);if(parts.length!==2||parts.some(x=>!/^\d+$/.test(x)))return '';
    const [guess,rem]=parts.map(Number),[q,left]=target.answer,divisor=target.divisor;
    if(rem>=divisor&&guess*divisor+rem===q*divisor+left)return 'Число восстановилось, но из остатка '+rem+' можно собрать ещё группу по '+divisor+'.';
    if(rem>=divisor)return 'Сравни остаток '+rem+' с размером группы '+divisor+'. Он должен быть меньше делителя.';
    return '';
  }
  const api={lessons:[lesson],generators:{'5.112':generate},bounds:{'5.112':{row:[0,3,0],offset:[0,2,0]}},draw,explore,feedback};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5RemainderGroups=api;
})(typeof window!=='undefined'?window:globalThis);
