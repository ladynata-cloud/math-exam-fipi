/* Виленкин и соавторы, Математика 5, часть 2, §26, печатная с. 19. */
(function(root) {
  'use strict';
  const source={part:2,point:26,page:19};
  const lessons=[
    {...source,number:'5.94',key:'printed-5-94',title:'Собери путь до острова',
      requires:['v5f-printed-5-86'],related:['v5f-table-read'],
      explanation:'Раздели маршрут на три участка. Время умножь на скорость каждый раз отдельно. Пока величина неизвестна, оставь вместо неё букву. Сложи расстояния участков.',
      worked:['Два часа на поезде со скоростью 50 км/ч и ещё t часов пешком со скоростью 3 км/ч дают 100 + 3t километров. При t = 2 путь равен 106 км.'],
      misconception:'Складывать можно сами скорости, даже если время на участках разное.',reflect:'Почему в одном слагаемом переменная означает время, а в другом — скорость?'},
    {...source,number:'5.95',key:'printed-5-95',title:'Через сколько минут они встретятся?',
      requires:['v5f-printed-5-86'],related:['v5f-printed-5-94'],
      explanation:'Поставь двух участников на разные концы дороги. За одну минуту каждый проходит свой кусочек навстречу другому. На сколько метров в сумме сократится промежуток? Вырази весь путь в тех же единицах.',
      worked:['На дорожке длиной 240 м два человека за минуту приближаются на 35 и 45 м. За минуту исчезают 80 м промежутка. На встречу уйдёт 3 минуты.'],
      misconception:'Скорости встречного движения всегда надо вычитать.',reflect:'Как проверить время встречи с помощью двух пройденных расстояний?'}
  ];
  // Read an additive expression in x and v as its exact constant and its two integer coefficients.
  function coefficients(raw) {
    const src=String(raw).toLowerCase().replace(/^\s*[sс]\s*=/,'').replace(/[·×∙]/g,'*').replace(/−/g,'-').replace(/[х]/g,'x').replace(/\s+/g,'');
    if(!src||src.length>120||!/^[0-9xv()+*\-]+$/.test(src))return null;
    let pos=0;
    function atom(depth){
      if(depth>12)throw Error();
      const ch=src[pos];
      if(ch==='('){pos++;const value=sum(depth+1);if(src[pos++]!==')')throw Error();return value;}
      if(ch==='x'||ch==='v'){pos++;return ch==='x'?[0,1,0]:[0,0,1];}
      if(ch==='-'||ch==='+'){pos++;return atom(depth+1).map(n=>ch==='-'?-n:n);}
      const token=/^\d+/.exec(src.slice(pos));if(!token)throw Error();pos+=token[0].length;
      const n=Number(token[0]);if(!Number.isSafeInteger(n))throw Error();return [n,0,0];
    }
    function product(depth){
      let value=atom(depth);
      while(pos<src.length && (src[pos]==='*'||/[xv(]/.test(src[pos]))){
        if(src[pos]==='*')pos++;
        const right=atom(depth),leftVariable=value[1]!==0||value[2]!==0,rightVariable=right[1]!==0||right[2]!==0;
        if(leftVariable&&rightVariable)throw Error();
        value=leftVariable?value.map(n=>n*right[0]):right.map(n=>n*value[0]);
        if(!value.every(Number.isSafeInteger))throw Error();
      }
      return value;
    }
    function sum(depth){
      let value=product(depth);
      while(src[pos]==='+'||src[pos]==='-'){
        const sign=src[pos++]==='+'?1:-1,right=product(depth);
        value=value.map((n,i)=>n+sign*right[i]);if(!value.every(Number.isSafeInteger))throw Error();
      }
      return value;
    }
    try{const result=sum(0);return pos===src.length&&result.every(Number.isSafeInteger)?result:null;}catch(_){return null;}
  }
  const vectorKey=v=>v?v.join('|'):'';
  function island(seed,r,step) {
    const carHours=seed?r(2,4):2,carSpeed=seed?r(55,89):85,walk=seed?r(3,6):4,boatHours=seed?r(1,3):1;
    const a=seed?[r(2,4),r(4,7)]:[2,5], b=seed?[r(1,2),r(8,11)]:[1,8];
    const car=carHours*carSpeed, target=[car,walk,boatHours], expr=car+'+'+walk+'x+'+(boatHours===1?'':boatHours)+'v';
    const data={carHours,carSpeed,walk,boatHours,cases:[a,b]};
    const numeric=(x,v)=>car+walk*x+boatHours*v;
    const mistakes=[
      {value:vectorKey([carSpeed,walk,boatHours]),text:'В строке про машину пока стоит скорость за один час. Учти все часы поездки.'},
      {value:vectorKey([car,boatHours,walk]),text:'Посмотри на смысл букв: x измеряет время пешком, v — скорость лодки.'},
      {value:vectorKey([car,walk,0]),text:'Первые два участка уже записаны. Включи ещё путь на лодке.'}
    ];
    const formula={...step('а. На машине ехали '+carHours+' ч со скоростью '+carSpeed+' км/ч. Затем шли x ч по '+walk+' км/ч и плыли '+boatHours+' ч со скоростью v км/ч. Запиши выражение для всего пути в километрах.',expr,'На каждом участке умножь время на скорость. Сложи три расстояния.',mistakes),answerFormat:'v5-island-expression'};
    const subs=(pair,label)=>step(label+' По той же дороге: x = '+pair[0]+', v = '+pair[1]+'. Сколько километров до острова?',numeric(...pair),
      'Подставь количество часов вместо x и скорость лодки вместо v. Затем сложи три расстояния.',
      [{value:car+walk*pair[0],text:'Это расстояние до пристани. Прибавь путь на лодке.'},{value:car+pair[0]+boatHours*pair[1],text:'Число x задаёт часы. Переведи их в километры пути пешком.'}]);
    return {...subs(b,'б2.'),steps:[formula,subs(a,'б1.')],data:{islandRoute:data},conditionKey:'island/'+[carHours,carSpeed,walk,boatHours,...a,...b].join('/')};
  }
  function meeting(seed,r,step){
    const foot=seed?10*r(5,9):80,bike=seed?10*r(14,24):200,minutes=seed?r(12,27):20,total=(foot+bike)*minutes;
    const km=Math.floor(total/1000),m=total%1000,raw=km+' км'+(m?' '+m+' м':'');
    const setup='Между двумя посёлками '+raw+'. Пешеход и велосипедист стартовали одновременно навстречу друг другу. За минуту пешеход проходит '+foot+' м, велосипедист '+bike+' м.';
    return {steps:[
      step(setup+' Сколько метров между ними вначале?',total,'В одном километре тысяча метров.',[{value:km*1000,text:'К целым километрам прибавь оставшиеся метры.'}]),
      step('На сколько метров уменьшится промежуток за одну минуту?',foot+bike,'Оба движутся внутрь начального промежутка.',[{value:bike-foot,text:'Разность покажет сближение при движении в одну сторону. Здесь каждый сокращает промежуток со своей стороны.'}])],
      prompt:setup+' Через сколько минут они встретятся?',answer:minutes,why:'За найденное время суммы двух путей хватает точно от посёлка до посёлка.',
      errors:[{value:total+'/'+bike,text:'Ты посчитал время только велосипедиста. Навстречу ему тоже идут.'},{value:total+'/'+foot,text:'За это время пешеход прошёл бы один всю дорогу. Учитывай второго участника.'}],
      data:{closingGap:{foot,bike,minutes,total}},conditionKey:'meeting/'+[foot,bike,minutes].join('/')};
  }
  function tiles(rows,caption){return '<figure style="margin:.5em 0"><figcaption>'+caption+'</figcaption><ol style="margin:.45em 0;padding-left:1.5em">'+rows.map(s=>'<li style="margin:.25em 0">'+s+'</li>').join('')+'</ol></figure>';}
  function routeView(p,x,v){
    const symbolic=x===undefined&&v===undefined;
    return tiles(['Машина · '+p.carHours+' ч · '+p.carSpeed+' км/ч','Пешком · '+(symbolic?'x':x)+' ч · '+p.walk+' км/ч','Лодка · '+p.boatHours+' ч · '+(symbolic?'v':v)+' км/ч'],'Дом → дорога → пристань → остров');
  }
  function closingView(p,t){
    const traveled=p.foot*t,cycled=p.bike*t,gap=p.total-traveled-cycled;
    const left=12+250*traveled/p.total,right=262-250*cycled/p.total;
    return '<figure style="margin:.5em 0"><svg role="img" aria-label="Два пути на общей дороге" viewBox="0 0 274 42" style="display:block;width:100%"><path d="M12 25H262" stroke="#81918b" stroke-width="3"/><path d="M12 25H'+left+'" stroke="#815031" stroke-width="6"/><path d="M262 25H'+right+'" stroke="#326d77" stroke-width="6"/><circle cx="'+left+'" cy="22" r="5" fill="#815031"/><rect x="'+(right-4)+'" y="25" width="8" height="8" fill="#326d77"/></svg><figcaption>Через '+t+' мин. От левого посёлка пешеход прошёл '+traveled+' м, от правого велосипедист проехал '+cycled+' м. '+(gap===0?'Они встретились.':'Серый участок дороги остаётся между ними.')+'</figcaption></figure>';
  }
  function draw(t,s){
    if(t.data.islandRoute){const p=t.data.islandRoute,k=s?.mode==='learn'?s.step:2;return k?routeView(p,...p.cases[Math.min(1,k-1)]):routeView(p);}
    return closingView(t.data.closingGap,0);
  }
  function explore(t,s){
    if(t.data.islandRoute){const p=t.data.islandRoute,x=s.hours,v=s.speed;
      return {title:'Собери маршрут на новых данных',controls:[{key:'hours',title:'Часы пешком',min:1,max:6},{key:'speed',title:'Скорость лодки, км/ч',min:3,max:12}],
        visual:routeView(p,x,v),question:'Сколько километров получится на этом маршруте?',answer:p.carHours*p.carSpeed+p.walk*x+p.boatHours*v,
        why:'Сложи путь машины, число часов пешком, умноженное на скорость ходьбы, и путь лодки.'};}
    const p=t.data.closingGap,n=Math.round(p.minutes*s.phase/4);
    return {title:'Посмотри, как сокращается промежуток',controls:[{key:'phase',title:'Момент на дороге',values:Array.from({length:5},(_,i)=>[i,Math.round(p.minutes*i/4)+' мин'])}],
      visual:closingView(p,n),question:'Сколько метров сейчас между участниками?',answer:p.total-n*(p.foot+p.bike),
      why:'Вычти из начального расстояния и путь пешехода, и путь велосипедиста.'};
  }
  const api={lessons,generators:{'5.94':island,'5.95':meeting},bounds:{'5.94':{hours:[1,6,2],speed:[3,12,5]},'5.95':{phase:[0,4,0]}},draw,explore,coefficients,vectorKey};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5IslandAndMeeting=api;
})(typeof window!=='undefined'?window:globalThis);
