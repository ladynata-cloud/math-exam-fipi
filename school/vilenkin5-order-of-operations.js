/* Виленкин, часть 2, §26, с. 18, №5.81. */
(function(root){
  'use strict';
  const lesson={number:'5.81',key:'printed-5-81',part:2,point:26,page:18,title:'Два выражения со скобками',requires:['v5f-printed-5-67'],related:['v5f-printed-5-67'],explanation:'Сначала вычисли каждую скобку отдельно. Обведи обе скобки как два готовых числа. После этого выполни умножение и только затем последнее сложение или вычитание.',worked:['В записи 6 · (8 + 7) − (12 + 4) сначала получаем 15 и 16. Дальше 6 · 15 = 90. В конце 90 − 16 = 74.'],misconception:'После первых скобок можно сразу выполнить самое левое действие, не читая оставшиеся скобки.',reflect:'На какой результат влияет знак непосредственно перед вторыми скобками?'};
  function generate(seed,r,step){
    const left=seed?[r(54,95),r(3400,6500),r(1100,2500),r(10000,23000),r(25000,45000)]:[83,4637,1289,19204,43853];
    const base=seed?r(35000,70000):69007,other=seed?r(14000,30000):27443,delta=seed?r(250,900):694,gap=seed?r(3500,9000):8988;
    const right=seed?[base+delta,base,r(36,82),other+gap,other]:[69701,69007,75,36431,27443];
    const [m,a,b,c,d]=left,[e,f,k,g,h]=right;
    const formA=m+' · ('+a+' + '+b+') − ('+c+' + '+d+')',formB='('+e+' − '+f+') · '+k+' + ('+g+' − '+h+')';
    const answers=[[a+b,c+d,m*(a+b),m*(a+b)-c-d],[e-f,g-h,(e-f)*k,(e-f)*k+g-h]];
    const tasks=[];
    [formA,formB].forEach((expression,i)=>{
      const [first,second,product,result]=answers[i];
      tasks.push(step('Выражение '+(i+1)+'. '+expression+'. Вычисли первые скобки.',first,i===0?'Сложи два числа в первых скобках.':'Из первого числа в первых скобках вычти второе.',[]));
      tasks.push(step('Вычисли вторые скобки в этом же выражении.',second,i===0?'Во вторых скобках стоит сумма. Минус перед скобкой пригодится позже.':'Во вторых скобках стоит разность.',[]));
      tasks.push(step('Чему равно произведение, которое стоит перед последним действием?',product,'Умножь '+(i===0?m:k)+' на результат первых скобок.',[]));
      tasks.push(step('Вычисли выражение '+(i+1)+' целиком: '+expression+'.',result,(i===0?'Вычти':'Прибавь')+' результат вторых скобок.',[{value:product,text:'Умножение выполнено. Осталось учесть вторые скобки.'},{value:i===0?product+second:product-second,text:'Проверь знак непосредственно перед вторыми скобками.'}]));
    });
    return {...tasks.pop(),steps:tasks,inputPrompt:'Значение второго выражения',data:{groupedExpression:{left,right,forms:[formA,formB],answers}},conditionKey:'expressions/'+left.join('-')+'/'+right.join('-')};
  }
  function picture(p,i,stage){
    const v=p.answers[i],labels=['Первые скобки','Вторые скобки','Умножение','Последнее действие'];
    return '<figure style="margin:.4em 0"><figcaption style="overflow-wrap:anywhere">'+p.forms[i]+'</figcaption><ol style="padding-left:1.6em">'+labels.map((t,k)=>'<li style="padding:.2em">'+(k===stage?'<strong>'+t+'</strong>':t)+(k<stage?' = '+v[k]:'')+'</li>').join('')+'</ol></figure>';
  }
  function draw(t,s){const p=t.data.groupedExpression;return s?.mode==='learn'?picture(p,Math.floor(s.step/4),s.step%4):picture(p,1,0);}
  function explore(t,s){const p=t.data.groupedExpression;return {title:'Выбери действие в выражении',controls:[{key:'form',title:'Выражение',values:[[0,'Первое'],[1,'Второе']]},{key:'stage',title:'Какое действие проверить',values:[[0,'Первые скобки'],[1,'Вторые скобки'],[2,'Умножение'],[3,'Последний шаг']]}],visual:picture(p,s.form,s.stage),question:'Вычисли значение выделенного действия.',answer:p.answers[s.form][s.stage],why:'Сопоставь выделенную строку со знаком в исходном выражении.'};}
  const api={lessons:[lesson],generators:{'5.81':generate},bounds:{'5.81':{form:[0,1,0],stage:[0,3,0]}},draw,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5OrderOfOperations=api;
})(typeof window!=='undefined'?window:globalThis);
