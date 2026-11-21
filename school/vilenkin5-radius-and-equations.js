/* Виленкин и соавт., 5 класс, часть 2, 2023, §25, с. 11, №5.33–5.34; корни сверены по с. 172. */
(function(root){
  'use strict';
  const lessons=[
    {number:'5.33',key:'printed-5-33',part:2,point:25,page:11,title:'Прикинь длину по радиусу, а радиус — по длине',requires:['v5f-printed-5-11','v5f-printed-5-12'],related:[],
      explanation:'Сначала соедини два радиуса в диаметр. По опыту с ниткой длина окружности немного больше трёх диаметров. В грубой прикидке этого урока берём три. Обратно нужно разделить сначала на три, затем пополам.',
      worked:['Радиус 8 см даёт диаметр 16 см. Прикидка длины края — около 48 см.','Длина края около 60 дм. При той же прикидке диаметр около 20 дм, радиус около 10 дм.','В обоих ответах слово «около» важно. Нитка вокруг круга немного длиннее трёх диаметров.'],
      misconception:'Длина окружности равна ровно трём радиусам.',reflect:'Если взять три диаметра, будет оценка длины чуть ниже или чуть выше самой длины? Почему?'}, 
    {number:'5.34',key:'printed-5-34',part:2,point:25,page:11,title:'Восстанови неизвестное внутри скобок',requires:['v5f-printed-5-27'],related:[],
      explanation:'Закрой скобки листком. По внешнему действию узнай число под листком. Открой скобки и выясни, чем в вычитании было неизвестное: первым числом или вторым. Верни найденное число в исходную запись.',
      worked:['В примере (x − 8) · 7 = 35 под скобками 5. Значит, x = 13.','В примере (20 − a) : 3 = 4 под скобками 12. Значит, a = 8.','В примере 30 : (b − 4) = 6 искомый делитель равен 5. Тогда b = 9, а проверка даёт 30 : 5 = 6.'],
      misconception:'Если неизвестное находится в вычитании, его всегда находят сложением.',reflect:'В каком из четырёх уравнений неизвестное вычитают, а в каком оно задаёт делитель?'}
  ];
  function strip(n,phase,unit){
    const colors=['#1a6579','#b55b32'],labels=['Два радиуса в диаметре','Три диаметра в грубой оценке длины'];
    const count=phase===0?2:6;let bars='';
    for(let i=0;i<count;i++)bars+='<rect x="'+(8+i*(230/count))+'" y="9" width="'+(230/count-1)+'" height="24" rx="2" fill="'+colors[Math.floor(i/2)%2]+'"/>';
    return '<figure style="margin:.4em 0"><svg viewBox="0 0 246 41" role="img" aria-label="'+labels[phase]+'" style="width:100%;max-width:24rem;display:block">'+bars+'</svg><figcaption>'+labels[phase]+'. Один маленький отрезок — радиус. Единица длины: '+unit+'.</figcaption></figure>';
  }
  function estimate(seed,r,step){
    const radius=seed?2+seed%19:12,inverse=seed?2+Math.floor(seed/5)%21:14,edge=6*inverse;
    const lengthPrompt='а. Радиус '+radius+' см. Каков диаметр в сантиметрах?',approx=3.14,round=v=>String(Math.round(v*100)/100),more='Для более точной оценки можно брать 3,14 диаметра. Здесь сравниваем с тремя диаметрами, как в опыте с ниткой.';
    return {steps:[
      step(lengthPrompt,2*radius,'Один диаметр проходит через центр и состоит из двух радиусов.',[{value:radius,text:'Это один радиус. Продолжи отрезок от центра до другого края.'}]),
      {...step('Прикинь длину края в сантиметрах по правилу «около трёх диаметров».',6*radius,'Умножь только что найденный диаметр на три.',[{value:3*radius,text:'Сейчас сложены три радиуса. Для этой прикидки нужны три диаметра.'}]),clarifications:[{value:round(2*radius*approx),text:more}]},
      step('б. Длина другой окружности '+edge+' дм. Приближённо она укладывается в три диаметра. Сколько дециметров приходится на один диаметр?',2*inverse,'Раздели длину всей окружности на три равных отрезка.',[{value:inverse,text:'Это следующий результат — радиус. Для диаметра понадобятся два таких отрезка.'}])],
      prompt:'Используй грубую оценку предыдущего шага. Каков приблизительный радиус второй окружности, в дм?',answer:inverse,inputPrompt:'Около скольких дм',errors:[{value:2*inverse,text:'Получился диаметр. Радиус составляет половину этой длины.'}],clarifications:[{value:round(edge/(2*approx)),text:more}],
      why:'Оценка диаметра '+edge+' : 3 = '+2*inverse+' дм. Радиус примерно '+2*inverse+' : 2 = '+inverse+' дм.',data:{radiusEstimate:{radius,edge,inverse}},conditionKey:'radius-est/'+radius+'/'+edge};
  }
  function originals(){return [[111,59,11918],[975,615,12675],[30901,605,51],[39765,893,1205]];}
  function sample(seed,r){
    if(!seed)return originals();
    const make=()=>[r(12,74),r(4,21),r(7,45)];const [[a,b,c],[d,e,f],[g,h,i],[j,k,l]]=[make(),make(),make(),make()];
    return [[a,b,c*b],[e,d,e*f],[h*i+g,h,i],[k*l,j,l]];
  }
  const vars=['x','y','a','b'];
  function derive(row,i){
    const [u,v,w]=row,inner=[w/v,w/u,v*w,u/w][i],answer=[inner+u,inner+v,u-inner,v+inner][i];
    const expression=['(x − '+u+') · '+v,u+' · (y − '+v+')','('+u+' − a) : '+v,u+' : (b − '+v+')'][i];
    return {inner,answer,text:expression+' = '+w};
  }
  function eq(seed,random,step){
    const rows=sample(seed,random),steps=[],letters=['а','б','в','г'];
    rows.forEach((row,i)=>{
      const v=derive(row,i);steps.push(step(letters[i]+'. '+v.text+'. Чему равно всё выражение в скобках?',v.inner,['Раздели правую часть на известный множитель.','Подели произведение на множитель перед скобками.','Умножь частное на делитель, чтобы восстановить делимое.','Найди делитель: раздели делимое на частное.'][i],[]));
      if(i<3)steps.push(step('Каково значение '+vars[i]+' в уравнении '+v.text+'?',v.answer,i===2?'Вычти найденную разность из уменьшаемого.':'К значению скобок прибавь вычитаемое.',[{value:v.inner,text:'Это значение скобок. Открой их и найди саму букву.'}]));
    });
    const v=derive(rows[3],3);
    return {steps,prompt:'г. Найди b в уравнении '+v.text+'.',answer:v.answer,inputPrompt:'Значение b',errors:[{value:v.inner,text:'Это делитель. Внутри записано b минус число, поэтому нужно ещё восстановить b.'}],why:'Проверка: '+v.answer+' − '+rows[3][1]+' = '+v.inner+'; '+rows[3][0]+' : '+v.inner+' = '+rows[3][2]+'.',data:{nestedEquations:rows},conditionKey:'four-eqs/'+rows.flat().join('/')};
  }
  function tiles(row,i,phase){
    const v=derive(row,i),[a,b,c]=row,masked=i===0?'□ · '+b+' = '+c:i===1?a+' · □ = '+c:i===2?'□ : '+b+' = '+c:a+' : □ = '+c;
    const unmasked=['x − '+a,'y − '+b,a+' − a','b − '+b][i]+' = '+v.inner;
    return '<figure style="margin:.4em 0;padding:.55em;background:#e8f3ef;color:#20443c"><figcaption>'+ (phase?'Открой скобки':'Закрой скобки одной карточкой')+'</figcaption><strong style="font-size:1.15em">'+(phase?unmasked:masked)+'</strong></figure>';
  }
  function taskDrawing(t,s){
    const i=s?.mode==='learn'?s.step:t.steps.length;
    if(t.data.radiusEstimate){const d=t.data.radiusEstimate;return strip(i<2?d.radius:d.inverse,i===1||i===2?1:0,i<2?'см':'дм');}
    const j=Math.min(3,Math.floor(i/2));return tiles(t.data.nestedEquations[j],j,i%2);
  }
  function explore(t,s){
    if(t.data.radiusEstimate){
      const r=s.radius,forward=s.direction===0;return {title:'Пройди от радиуса к длине и обратно',controls:[{key:'radius',title:'Радиус в модели, см',min:2,max:25,step:1},{key:'direction',title:'Куда идти',values:[[0,'К длине края'],[1,'К радиусу']]}],visual:strip(r,1,'см')+'<p>'+(forward?'От центра до края '+r+' см.':'Приблизительная длина края '+6*r+' см.')+'</p>',question:forward?'Какова грубая оценка длины окружности, см?':'Какой радиус даёт такую грубую оценку, см?',answer:forward?6*r:r,why:'Один диаметр состоит из двух радиусов. В трёх диаметрах шесть радиусов.'};
    }
    const i=s.row,p=s.phase,row=t.data.nestedEquations[i],v=derive(row,i);return {title:'Что спрятано под скобками?',controls:[{key:'row',title:'Уравнение',values:[[0,'а'],[1,'б'],[2,'в'],[3,'г']]},{key:'phase',title:'Искомое',values:[[0,'Все скобки'],[1,'Буква']]}],visual:tiles(row,i,p),question:p?'Чему равна буква?':'Какое число соответствует карточке?',answer:p?v.answer:v.inner,why:'Значение скобок '+v.inner+', а '+vars[i]+' = '+v.answer+'.'};
  }
  const api={lessons,generators:{'5.33':estimate,'5.34':eq},bounds:{'5.33':{radius:[2,25,12],direction:[0,1,0]},'5.34':{row:[0,3,0],phase:[0,1,0]}},taskDrawing,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5RadiusEquations=api;
})(typeof window!=='undefined'?window:globalThis);
