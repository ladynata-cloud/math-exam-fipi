/* Original cut diagrams for Vilenkin grade 5 (2023), part 2, §25, printed p. 8. */
(function(root){
  'use strict';
  const lesson={number:'5.8',key:'printed-5-8',title:'Три прямых разреза на блине и на торте',part:2,point:25,page:8,
    requires:['v5f-circle-shapes'],related:['v5f-printed-5-7'],
    explanation:'Каждый раз веди нож прямо от края до края. Если новый разрез на плоском блине проходит через несколько прежних кусков, каждый из них разделится надвое. Торт можно также разрезать горизонтально, разделив несколько кусков на слои одним движением.',
    worked:['Один прямой разрез даёт два куска. Если второй пересечёт первый внутри блина, получится четыре.','Посмотри на новый след ножа. Точки пересечения делят этот след на отрезки. Каждый из них проходит через один прежний кусок и добавляет один новый.','У высокого торта посмотри и сверху, и сбоку. Если провести нож горизонтально, верхние куски можно снять и увидеть нижние.'],
    misconception:'Каждый новый прямой разрез плоского блина обязательно удваивает число кусков.',reflect:'Где должны встретиться первые два следа с третьим, чтобы на блине получилось как можно больше кусков?'};
  const colors=['#ecd594','#a9d6d2','#eab7a3','#bbd3a1','#bfd0ec','#ecd5db','#d0c0e4','#badbbe'];
  const disk=Array.from({length:96},(_,i)=>[Math.cos(2*Math.PI*i/96),Math.sin(2*Math.PI*i/96)]);
  function blades(angle,offset){
    return [[0,0],[Math.PI/2,0],[Math.PI/4,offset]].map(([turn,h])=>[Math.cos(turn+angle),Math.sin(turn+angle),h]);
  }
  function half(polygon,[a,b,h],side){
    const out=[],value=p=>side*(a*p[0]+b*p[1]-h);
    for(let i=0;i<polygon.length;i++){
      const p=polygon[i],q=polygon[(i+1)%polygon.length],u=value(p),v=value(q);
      if(u>=-1e-9)out.push(p);
      if(u*v<-1e-12){const t=u/(u-v);out.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);}
    }
    return out;
  }
  function centre(vertices){
    let area=0,x=0,y=0;
    for(let i=0;i<vertices.length;i++){
      const p=vertices[i],q=vertices[(i+1)%vertices.length],w=p[0]*q[1]-q[0]*p[1];
      area+=w;x+=(p[0]+q[0])*w;y+=(p[1]+q[1])*w;
    }
    return {area:area/2,x:x/(3*area),y:y/(3*area)};
  }
  function slices(angle,offset,count){
    let groups=[disk];
    for(const blade of blades(angle,offset).slice(0,count))groups=groups.flatMap(p=>[half(p,blade,1),half(p,blade,-1)]).filter(p=>p.length>=3&&centre(p).area>1e-7);
    return groups;
  }
  function layout(data,state){
    const cake=state.object===1,third=state.stage===3,layered=cake&&third&&state.style===0;
    const offset=!cake&&state.style===1?0:data.offset;
    const groups=slices(data.angle,offset,layered?2:state.stage);
    return {cake,layered,groups,number:groups.length*(layered?2:1)};
  }
  function diagram(data,state){
    const {cake,layered,groups,number}=layout(data,state);
    let drawing='';
    const panel=(cx,cy,rx,ry,start)=>{
      groups.forEach((vertices,i)=>{
        const xy=vertices.map(([x,y])=>(cx+rx*x).toFixed(2)+','+(cy+ry*y).toFixed(2)).join(' ');
        drawing+='<polygon points="'+xy+'" fill="'+colors[start+i]+'" stroke="#4b4c41" stroke-width="1.3" stroke-linejoin="round"/>';
        if(state.labels){const c=centre(vertices);drawing+='<text class="v5q-cut-label" x="'+(cx+rx*c.x)+'" y="'+(cy+ry*c.y+5)+'" text-anchor="middle" font-weight="bold">'+(start+i+1)+'</text>';}
      });
      drawing+='<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" fill="none" stroke="#46483f" stroke-width="2"/>';
    };
    if(layered){
      panel(147,52,76,35,0);panel(147,145,76,35,groups.length);
      drawing+='<text x="7" y="54">Верх</text><text x="7" y="149">Низ</text>';
    }else panel(133,91,76,76,0);
    const label=layered?'Два слоя торта, каждый показан отдельно':cake?'Торт, вид сверху':'Блин, вид сверху';
    return '<svg class="v5q-printed-geometry" viewBox="0 0 264 196" style="display:block;width:100%;height:auto;max-width:24rem;margin:auto" role="img" aria-label="'+label+'"><desc>'+label+'. Сделано разрезов '+state.stage+'. На рисунке '+number+' частей.</desc><rect width="264" height="196" rx="8" fill="white"/><g font-size="15" font-family="sans-serif" fill="#27392e">'+drawing+'</g></svg>';
  }
  function generate(seed,random,step){
    const data={angle:seed?random(0,35)*Math.PI/180:0,offset:seed?random(27,45)/100:.38,limit:seed&&random(0,2)===0?2:3};
    const n=data.limit,isThree=n===3,pancake=isThree?7:4,cake=isThree?8:4;
    const steps=[step('После первого прямого разреза сколько кусков у блина?',2,'След ножа проходит от одного края до другого и разделяет исходный блин на две части.'),
      step('Если второй разрез пересечёт первый внутри блина, сколько всего кусков получится?',4,'Второй след проходит через обе имеющиеся половины. Каждая разделяется ещё раз.')];
    if(isThree)steps.push(step('а. Третий след пересёк каждый из двух прежних следов внутри блина в своей точке. Через сколько прежних кусков прошёл нож?',3,'Две разные точки делят новый след на три участка. На каждом участке нож проходит через очередной кусок.',[{value:2,text:'Ты сосчитал две точки пересечения. Посчитай промежутки до первой точки, между ними и после второй.'}]));
    steps.push(step('а. Какое наибольшее число кусков у плоского блина после '+n+' разрезов?',pancake,isThree?'До третьего разреза было четыре куска. Каждый из трёх участков нового разреза прибавляет один.':'Первый разрез даёт два куска. Второй может рассечь оба.',isThree?[{value:6,text:'Шесть бывает при трёх следах через одну точку. Сдвинь третий след, чтобы он встретил первые два в разных местах.'},{value:8,text:'Для восьми третий разрез должен разделить все четыре куска. Две прежние прямые делят его максимум на три участка.'}]:[]));
    if(isThree)steps.push(step('б. У высокого торта первые два разреза вертикальные. Сколько кусков сразу рассечёт третий, если провести его горизонтально на половине высоты?',4,'Посмотри сверху на все четыре части. Горизонтальная плоскость проходит через каждую из них.'));
    return {prefix:seed?'Новый опыт с разрезами. ':'',prompt:'б. Сколько кусков можно получить из целого высокого торта ровно '+n+' прямыми разрезами? Куски остаются на своих местах. В шагах сравни с плоским блином.',answer:cake,inputPrompt:'Наибольшее число кусков',steps,
      errors:isThree?[{value:7,text:'Семь частей получаются тремя удачно расположенными вертикальными разрезами. Посмотри в модели, что произойдёт, если третий разрез пройдёт горизонтально через все четыре части.'}]:[],
      data:{foodCuts:data},conditionKey:'cuts/'+n+'/'+data.angle+'/'+data.offset};
  }
  function explore(task,state){
    const d=task.data.foodCuts,cake=state.object===1,labels=cake?['Горизонтально','Ещё раз вертикально']:['Через два разных пересечения','Через общую точку'];
    const choose=(key,title,values)=>({key,title,values:values.map((s,i)=>[i,s])});
    const controls=[choose('object','Что режем',['Плоский блин','Высокий торт']),choose('stage','Сколько разрезов сделано',['Ни одного','Один','Два','Три'])];
    if(state.stage===3)controls.push(choose('style','Как идёт третий разрез',labels));
    controls.push(choose('labels','Номера кусочков',['Скрыть','Подписать']));
    const model=layout(d,state);
    return {title:'Проведи нож и посчитай куски',controls,visual:diagram(d,state),question:'Сколько отдельных кусков получилось на этом рисунке?',answer:model.number,why:model.layered?'Верхний слой и нижний слой содержат по четыре части.':state.stage===3?'Проследи третий разрез и посчитай, через сколько прежних кусков он прошёл.':'Проследи границы каждого отдельного куска.'};
  }
  const bounds={'5.8':{object:[0,1,0],stage:[0,3,0],style:[0,1,0],labels:[0,1,0]}};
  const api={lesson,generate,explore,bounds,layout,centre,taskDrawing:task=>diagram(task.data.foodCuts,{object:0,stage:Math.min(2,task.data.foodCuts.limit),style:0,labels:0})};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5ThreeCuts=api;
})(typeof window!=='undefined'?window:globalThis);
