/* Виленкин и соавторы, часть 2 (2023), §26, печатная с. 19, №5.92–5.93. */
(function (root) {
  'use strict';
  const common = {part:2, point:26, page:19};
  const lessons = [
    {...common, number:'5.92', key:'printed-5-92', title:'Складываем и вычитаем по классам',
      requires:['v5f-printed-5-81'], related:['v5f-printed-1-13'],
      explanation:'Раздели число на группы по три цифры справа налево. Запиши единицы под единицами. Складывай или вычитай, начиная с правого класса. При вычитании тысячу можно разменять на тысячу единиц.',
      worked:['12 005 − 18. В пяти единицах восемнадцати нет. Разменяем тысячу: останется 11 тысяч, а справа будет 1005 − 18 = 987. Получилось 11 987.'],
      misconception:'Из меньшего класса можно просто вычесть больший в обратном порядке.', reflect:'Как проверить вычитание сложением?'},
    {...common, number:'5.93', key:'printed-5-93', title:'Узнаём гараж с другой стороны',
      requires:['v5f-printed-5-36'], related:['v5f-printed-5-90'],
      explanation:'Мысленно обойди гараж вдоль стены с окном. За углом дверь скроется, а окно останется на той же стене. Запомни, к какому торцу окно ближе. На новом рисунке проверь оба признака.',
      worked:['У постройки на боковой стене висит фонарь рядом со входом. Если пройти вдоль этой стены до её другого конца, фонарь окажется у дальнего края.'],
      misconception:'Когда меняется точка наблюдения, окно может перейти на противоположную стену.', reflect:'Как отличить поворот гаража от зеркального отражения?'}
  ];
  const printed = [[3407403889,14800900773],[44293732,98,7888999],[29481711,183459],[481592,79,92367]];
  const signs = [1,1,-1,-1];
  const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
  const labels = ['единицы','тысячи','миллионы','миллиарды'];
  function groups(n) {
    return labels.map((_,i) => Math.floor(n / (1000 ** i)) % 1000);
  }
  function calculation(terms, sign) {
    return terms.slice(1).reduce((sum,n) => sum+sign*n,terms[0]);
  }
  function column(terms, sign, k) {
    let transfer=0;
    for (let i=0;i<=k;i++) {
      const values=terms.map(n=>groups(n)[i]);
      const incoming=transfer, total=calculation(values,sign)+incoming;
      transfer=Math.floor(total/1000);
      if(i===k) return {values,incoming,total,digits:total-transfer*1000,transfer};
    }
  }
  function expressions(seed,r,step) {
    const rows=printed.map(terms=>terms.map(n=>seed ? n+r(1,Math.max(2,Math.floor(n/16))) : n));
    const items=rows.map((terms,i)=>{
      const op=signs[i],value=calculation(terms,op);
      const prompt='абвг'[i]+'. Вычисли '+terms.map(fmt).join(op===1?' + ':' − ')+'.';
      const missed=terms.length===3?calculation(terms.slice(0,-1),op):null;
      const errors=[{value:value+1000,text:'Пересчитай тысячи. Учти перенос при сложении или размен при вычитании только один раз.'},
        {value:value-1000,text:'Проверь класс тысяч. Используй перенос или размен только один раз.'}];
      if(missed!==null) errors.unshift({value:missed,text:'Так получается после первого действия. Учти последнее число в строке.'});
      return {...step(prompt,value,'Сверь три правые цифры. Затем переходи к тысячам и учитывай перенос или размен.',errors),answerFormat:'v5-natural'};
    });
    return {...items[3],steps:items.slice(0,3),data:{classRows:rows},conditionKey:'written-classes/'+rows.flat().join('/')};
  }
  function classesDiagram(terms,sign,k) {
    const slices=terms.map(groups);
    const cells=labels.map((label,i)=>'<div style="min-width:0;text-align:center;padding:.25em .05em;background:'+(i===k?'#fff0c5':'#e7f1ed')+'"><small style="display:block;font-size:.75em">'+['ед.','тыс.','млн','млрд'][i]+'</small>'+
      slices.map((v,n)=>'<div style="font:600 1em/1.5 monospace">'+(terms[n]<1000**i?'—':String(v[i]).padStart(terms[n]>=1000**(i+1)?3:1,'0'))+'</div>').join('')+'</div>').reverse();
    return '<figure style="margin:.5em 0"><figcaption>Каждая строка — очередное число. '+(sign===1?'Сложение.':'Вычитание из первой строки.')+'</figcaption><div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:2px">'+cells.join('')+'</div></figure>';
  }
  // For each candidate viewed from the rear, remember the visible wall (same/opposite) and the end near the window (front/rear).
  const options = [{same:true,near:true},{same:false,near:true},{same:true,near:false},{same:false,near:false}];
  const letters = ['б','в','г','д'];
  function asChoice(input){
    const s=String(input).trim().toLowerCase().replace(/[.)]$/,'');
    const i=letters.indexOf(s);
    return i<0&&/^[1-4]$/.test(s)?Number(s):i+1;
  }
  function garage(seed,r,step) {
    const near=seed?r(0,1)===1:true, right=seed?r(0,1)===1:true;
    const candidates=options.map(x=>({...x}));
    if(seed)for(let i=candidates.length-1;i>0;i--){const j=r(0,i);[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
    const answer=candidates.findIndex(x=>x.same&&x.near===near)+1;
    const place=near?'переднему торцу с дверью':'заднему торцу без двери';
    const first=step('Посмотри на исходный вид. К какому торцу ближе окно? Введи 1 для торца с дверью или 2 для заднего торца.',near?1:2,'Проследи расстояние от окна вдоль стены до каждого её края.',[{value:near?2:1,text:'Сравни короткий и длинный промежутки между окном и краями этой же стены.'}]);
    return {steps:[first],prompt:'Ты обошёл гараж вдоль стены с окном и видишь задний торец. Какой это вид? Введи букву или номер рисунка.',
      answer,answerFormat:'v5-garage-view',inputPrompt:'Буква б, в, г, д или номер 1–4',
      errors:candidates.flatMap((x,i)=>i+1===answer?[]:[{value:i+1,text:!x.same?'На этом рисунке окно оказалось на другой боковой стене. Обойди модель вдоль стены с окном.':'Стена выбрана верно. Проверь, по-прежнему ли окно у '+(near?'переднего':'заднего')+' торца.'}]),
      why:'Дверь находится на противоположном торце. Окно по-прежнему ближе к '+place+'.',
      data:{garageViews:{near,right,candidates}},conditionKey:'garage-turn/'+Number(near)+Number(right)+'/'+candidates.map(x=>Number(x.same)+""+Number(x.near)).join('/')};
  }
  function house(sideOnRight,door,windowAtVisibleEnd,caption) {
    const win=windowAtVisibleEnd?86:114;
    const flip=sideOnRight?'':'translate(150 0) scale(-1 1)';
    const svg='<svg viewBox="0 0 150 92" aria-hidden="true" style="display:block;width:100%;max-width:230px"><g transform="'+flip+'" stroke="#374d53" stroke-width="1.8" stroke-linejoin="round">'+
      '<path d="M9 42L43 13L77 41V82L9 76Z" fill="#e1c4a5"/><path d="M77 41L142 28V68L77 82Z" fill="#9ab9ae"/><path d="M43 13L108 4L142 28L77 41Z" fill="#577f79"/>'+
      (door?'<path d="M25 76V49L60 52V80Z" fill="#667a89"/><path d="M28 55l29 2m-29 6 29 2m-29 6 29 2" fill="none" stroke="#e2e9e4" stroke-width="1"/>':'')+
      '<path d="M'+win+' '+(59-(win-77)*.2)+'v-13l15-3v13Z" fill="#ffe3a6"/></g></svg>';
    return '<figure style="margin:.35em 0;min-width:0" aria-label="'+caption+'">'+svg+'<figcaption>'+caption+'</figcaption></figure>';
  }
  function draw(t,s) {
    if(t.data.classRows) {
      const i=s?.mode==='learn'?Math.min(s.step,3):3;
      return classesDiagram(t.data.classRows[i],signs[i],0);
    }
    const {near,right,candidates}=t.data.garageViews;
    const original=house(right,true,near,'Исходный вид со стороны двери');
    if(s?.mode==='learn'&&s.step===0)return original;
    return original+'<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.4em">'+
      candidates.map((c,i)=>house(c.same?!right:right,false,!c.near,letters[i]+' · '+(i+1))).join('')+'</div>';
  }
  function explore(t,s) {
    if(t.data.classRows) {
      const terms=t.data.classRows[s.row],sign=signs[s.row],c=column(terms,sign,s.group);
      const carry=c.incoming>0?' Из предыдущего класса перешло '+c.incoming+'.':c.incoming<0?' В этом классе уже разменяли '+(-c.incoming)+'.':' Входящего переноса нет.';
      return {title:'Вычисли один класс',controls:[{key:'row',title:'Какой пример',values:[...'абвг'].map((v,i)=>[i,v])},{key:'group',title:'Класс',values:labels.map((v,i)=>[i,v])}],
        visual:classesDiagram(terms,sign,s.group),question:'Какая группа цифр получится в классе «'+labels[s.group]+'»?'+carry+' Начальные нули можешь опустить.',answer:c.digits,
        why:'В подсвеченном классе получилось '+c.total+'. '+(c.transfer<0?'Размени тысячу из следующего класса.':c.transfer>0?'Полные тысячи переходят в следующий класс.':'Перенос не требуется.')};
    }
    const {near,right}=t.data.garageViews,front=s.end===0,nearViewer=front===near;
    return {title:'Обойди гараж по стороне с окном',controls:[{key:'end',title:'Откуда смотришь',values:[[0,'От двери'],[1,'От заднего торца']]}],
      visual:house(front?right:!right,front,nearViewer,front?'Вид спереди':'Вид сзади'),
      question:'Окно ближе к видимому торцу (1) или к дальнему (2)?',answer:nearViewer?1:2,
      why:'Положение окна на самой стене неизменно. При переходе к другому концу прежний ближний торец становится дальним.'};
  }
  const api={lessons,generators:{'5.92':expressions,'5.93':garage},bounds:{'5.92':{row:[0,3,0],group:[0,3,0]},'5.93':{end:[0,1,0]}},draw,explore,asChoice,column};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5ClassesAndViews=api;
})(typeof window!=='undefined'?window:globalThis);
