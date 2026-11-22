/* Работа с кругом, Виленкин и соавторы, часть 2, §26, с. 18, №5.82. */
(function(root){
  'use strict';
  const lesson={number:'5.82',key:'printed-5-82',part:2,point:26,page:18,title:'Раздели круг и закрась доли',requires:['v5f-printed-5-46'],related:['v5f-printed-5-71'],explanation:'Проведи окружность с заданным радиусом. Два перпендикулярных диаметра делят круг на четыре равные части. Для восьмых раздели каждую четверть пополам. Закрась столько частей, сколько указано в числителе.',worked:['Чтобы закрасить 3/4 круга, раздели его на четыре равных сектора и выбери три любых. Они могут находиться в разных местах.'],misconception:'Для одной и той же доли нужно закрасить только заранее определённые секторы.',reflect:'Почему пять выбранных восьмых занимают одну и ту же площадь при любом их расположении?'};
  function generate(seed,r,step){
    const radius=seed?r(2,6):3,nums=seed?[r(1,3),r(2,7)]:[1,5];
    const plan=nums.map((num,i)=>({radius,num,den:i?8:4,i}));
    const rows=plan.map(x=>({...step('В модели выбери круг, разделённый на '+x.den+' равных секторов, и выставь радиус '+radius+' см. Нажми на секторы, чтобы закрасить '+x.num+'/'+x.den+' всего круга. Сколько равных секторов ты закрасил?',x.num,'Знаменатель показывает число секторов во всём круге, числитель — сколько из них надо закрасить.',[{value:x.den,text:'Это число частей во всём круге. В ответе должны быть только закрашенные части.'}]),sectorTarget:x,inputPrompt:'Закрашенных секторов'}));
    return {...rows[1],steps:[step('Проведи в тетради окружность радиуса '+radius+' см. На сколько сантиметров раскрыть циркуль?',radius,'Расстояние от иглы до грифеля равно радиусу.',[{value:2*radius,text:'Это диаметр. Циркуль раскрывают от центра до границы.'}]),rows[0]],data:{shadeDisks:{radius,nums}},conditionKey:'shade-disks/'+radius+'/'+nums.join('-')};
  }
  function sectorCount(bits,n){let c=0;for(let i=0;i<n;i++)c+=(bits>>i)&1;return c;}
  function drawing(n,bits,radius,interactive){
    const scale=44+4*radius,cx=95,cy=83;let segments='';
    for(let i=0;i<n;i++){
      const angle=k=>2*Math.PI*k/n-Math.PI/2,point=k=>[cx+scale*Math.cos(angle(k)),cy+scale*Math.sin(angle(k))];
      const [x,y]=point(i),[u,v]=point(i+1),selected=Boolean(bits&(1<<i));
      const attrs=interactive?' role="button" tabindex="0" data-v5-sector="'+i+'" aria-label="Сектор '+(i+1)+'" aria-pressed="'+selected+'" style="cursor:pointer"':'';
      segments+='<path'+attrs+' d="M'+cx+' '+cy+'L'+x+' '+y+'A'+scale+' '+scale+' 0 0 1 '+u+' '+v+'Z" stroke="#284c5a" stroke-width="1.35" fill="'+(selected?'#69ac8d':'#edf5f0')+'"/>';
    }
    return '<figure style="margin:.4em 0"><svg '+(interactive?'role="group"':'role="img"')+' aria-label="Круг из '+n+' равных секторов" viewBox="0 0 190 165" style="display:block;width:100%;max-width:320px;margin:auto">'+segments+'</svg><figcaption>Радиус '+radius+' см. '+(interactive?'Нажми на любой сектор, чтобы закрасить его или снять закраску. У модели свой масштаб. В тетради отмерь радиус линейкой.':'Все секторы равны по площади.')+'</figcaption></figure>';
  }
  function draw(t,scene){const p=t.data.shadeDisks,m=scene?.v5Detail?.model||{},i=scene?.mode==='learn'&&scene.step<2?0:1;return drawing(i?8:4,i?m.bitsB||0:m.bitsA||0,m.radius||p.radius,false);}
  function explore(t,m){const n=m.part?8:4,bits=m.part?m.bitsB:m.bitsA;
    return {title:'Закрась секторы своего круга',controls:[{key:'radius',title:'Радиус, см',values:[1,2,3,4,5,6].map(v=>[v,String(v)])},{key:'part',title:'На сколько разделить круг',values:[[0,'На четыре'],[1,'На восемь']]}],visual:drawing(n,bits,m.radius,true),question:'Какую долю круга ты сейчас закрасил? Введи дробь.',answer:typeof module!=='undefined'&&module.exports?require('./math.js').q(sectorCount(bits,n),n):root.WorkshopMath.q(sectorCount(bits,n),n),why:'Сравни число закрашенных равных секторов с числом всех секторов круга.'};
  }
  function issue(x,m){
    if(!m||m.radius!==x.radius)return 'Выставь в модели радиус '+x.radius+' см. Твою запись можно сохранить и продолжить.';
    if(m.part!==x.i)return 'Для этого подпункта выбери деление на '+x.den+' равных секторов.';
    const count=sectorCount(x.i?m.bitsB:m.bitsA,x.den);
    if(count!==x.num)return 'Сейчас закрашено '+count+' из '+x.den+'. По условию нужно '+x.num+'/'+x.den+'. Нажми на секторы, затем проверь снова.';
    return '';
  }
  const api={lessons:[lesson],generators:{'5.82':generate},bounds:{'5.82':{radius:[1,6,1],part:[0,1,0],bitsA:[0,15,0],bitsB:[0,255,0]}},draw,explore,issue,sectorCount};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5CircleShading=api;
})(typeof window!=='undefined'?window:globalThis);
