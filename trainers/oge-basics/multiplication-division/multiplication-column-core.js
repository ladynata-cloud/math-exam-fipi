/* Guided column multiplication: numeric actions use the existing saved-step contract.
 * The right-to-left digit/carry and shifted-row algorithm follows arifmetika.html.
 * Existing task IDs and their saved task specifications are not changed. */
(function(root,factory){
  'use strict';
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./division-lab-core.js'));
  else root.MultiplicationColumn=factory(root.DivisionLab);
})(typeof globalThis==='undefined'?this:globalThis,function(D){
  'use strict';
  const prefix='multiplication-division/course-column-';
  const stages=Object.freeze([
    {id:prefix+'one-digit',slug:'column-one-digit',title:'Умножаем столбиком на одну цифру',goal:'Записывать ответ справа налево и учитывать перенос.',action:'Умножь, запиши цифру, перенеси то, что осталось.',guidance:'practice',support:'Практика по шагам'},
    {id:prefix+'two-digit',slug:'column-two-digit',title:'Умножаем столбиком на число из двух цифр',goal:'Получить две строки и сложить их.',action:'Вторую строку начни на одну клетку левее.',guidance:'practice',support:'Практика по шагам'}
  ].map(Object.freeze));
  const has=id=>stages.some(s=>s.id===id);
  const digits=n=>String(n).split('').reverse().map(Number);
  const E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function plan(a,b){
    if(!Number.isSafeInteger(a)||a<10||a>999||!Number.isSafeInteger(b)||b<2||b>99)throw Error('Некорректные числа для столбика.');
    const actions=[],ad=digits(a),bd=digits(b),two=b>=10;
    const cue=meta=>meta.event==='calculate'?(meta.phase==='add'?'Сложи выделенные цифры':'Умножь выделенные цифры'):meta.event==='add-carry'?'Прибавь перенесённое число':meta.event==='write'?'Запиши цифру в выделенную клетку':meta.event==='carry'?'Запиши перенос':'Прочитай ответ';
    const add=(kind,prompt,answer,hint,meta,effects=[])=>actions.push({kind,prompt,answer:String(answer),hint,cue:cue(meta),record:prompt.replace(/\s*=\s*\?\.?$/, ' = '+answer+'.'),error:'Посмотри на выделенные цифры. Если трудно, нажми «Подсказка».',multiplication:{...meta,effects}});
    const placeResult=(value,row,col,phase,operandColumn,multiplierColumn,last)=>{
      const digit=value%10,carry=Math.floor(value/10),meta={phase,row,col,operandColumn,multiplierColumn};
      add('digit','Получилось '+value+'. Какую последнюю цифру запишем в выделенную клетку?',digit,'Последняя цифра числа '+value+' — '+digit+'. Запиши '+digit+'.',{...meta,event:'write'},[{row,col,digit}]);
      if(carry){
        if(last)add('digit','Осталось '+carry+'. Запиши эту цифру в клетку слева.',carry,'Запиши '+carry+' слева от уже записанных цифр.',{...meta,col:col+1,event:'write'},[{row,col:col+1,digit:carry}]);
        else add('digit','Последнюю цифру '+digit+' записали. Сколько перенесём в следующую клетку слева?',carry,'В числе '+value+' убери последнюю цифру '+digit+'. Осталось '+carry+'.',{...meta,col:col+1,event:'carry'},[{row,col:col+1,digit:carry,carry:true}]);
      }
      return carry;
    };
    for(let pass=0;pass<bd.length;pass++){
      let carry=0;
      const row=two?'P'+(pass+1):'RES';
      for(let col=0;col<ad.length;col++){
        const base=ad[col]*bd[pass],total=base+carry,meta={phase:'multiply',row,col:col+pass,operandColumn:col,multiplierColumn:pass,event:'calculate'};
        add('product',(pass===1&&col===0?'Вторую строку начинаем на одну клетку левее. ':'')+'Умножь: '+ad[col]+' × '+bd[pass]+' = ?',base,ad[col]+' × '+bd[pass]+' = '+base+'.',meta);
        if(carry)add('product','Прибавь '+carry+', которые перенесли: '+base+' + '+carry+' = ?',total,base+' + '+carry+' = '+total+'.',{...meta,event:'add-carry'});
        carry=placeResult(total,row,col+pass,'multiply',col,pass,col===ad.length-1);
      }
    }
    if(two){
      const p1=digits(a*bd[0]),p2=[0,...digits(a*bd[1])],width=Math.max(p1.length,p2.length);
      let carry=0;
      for(let col=0;col<width;col++){
        const x=p1[col]||0,y=p2[col]||0,value=x+y+carry,expression=x+' + '+y+(carry?' + '+carry:'');
        add('product',(col===0?'Сложим две строки. Начни справа. ':'')+'Сложи: '+expression+' = ?',value,expression+' = '+value+'.',{phase:'add',row:'RES',col,event:'calculate'});
        carry=placeResult(value,'RES',col,'add',null,null,col===width-1);
      }
    }
    add('answer','Прочитай ответ в нижней строке. Сколько будет '+a+' × '+b+'?',a*b,'В нижней строке получилось '+a*b+'.',{phase:'answer',row:'RES',event:'answer'});
    return actions;
  }
  function make(id,seed){
    if(!has(id)||!Number.isInteger(seed)||seed<0||seed>4294967295)throw Error('Неизвестное упражнение по умножению.');
    let random=seed>>>0;
    const next=()=>{random=(Math.imul(random,1664525)+1013904223)>>>0;return random;};
    const a=12+next()%88,b=id===prefix+'one-digit'?2+next()%8:11+next()%39,stage=stages.find(s=>s.id===id);
    const demo=id===prefix+'one-digit'
      ?{title:'Начни с цифры справа',short:'Один столбик',lead:'Каждая цифра ответа появляется на своём месте.',html:'<p>23 × 4. Сначала 3 × 4 = 12. Пишем 2, переносим 1. Затем 2 × 4 = 8. Прибавляем 1: получилось 9. Ответ: 92.</p>',question:{kind:'input',prompt:'Получилось 12. Какую последнюю цифру запишем?',answer:2,hint:'В числе 12 последняя цифра — 2.'}}
      :{title:'Две строки, затем сложение',short:'Две строки',lead:'Вторая строка начинается на одну клетку левее.',html:'<p>23 × 14. Сначала умножаем 23 на правую цифру 4: получаем 92. Затем умножаем 23 на левую цифру 1: получаем 23. Пишем эту строку на одну клетку левее — это 230. Складываем 92 + 230 = 322.</p>',question:{kind:'input',prompt:'На сколько клеток левее начинается вторая строка?',answer:1,hint:'На одну клетку левее.'}};
    return {family:'multiplication',title:stage.title,rule:stage.action,task:{kind:'input',prompt:a+' × '+b,multiplication:{a,b}},steps:plan(a,b),lessons:[demo]};
  }
  function layout(spec,state){
    const task=spec?.task?.multiplication;
    if(!has(spec?.contentId)||!task)return null;
    const canonical=plan(task.a,task.b),answers=Array.isArray(state?.answers)?state.answers:[];
    let accepted=0;
    while(accepted<Math.min(answers.length,canonical.length)){
      if(!D.check(answers[accepted],canonical[accepted]))break;
      accepted++;
    }
    const rows={RES:{},P1:{},P2:{}},carries={RES:{},P1:{},P2:{}};
    for(let index=0;index<accepted;index++){
      // Only the verified prefix is rendered; future result cells stay empty.
      for(const effect of canonical[index].multiplication.effects)(effect.carry?carries:rows)[effect.row][effect.col]=String(effect.digit);
    }
    const active=canonical[accepted]?.multiplication||null;
    const two=task.b>=10;
    return {a:task.a,b:task.b,width:String(task.a).length+String(task.b).length,rows,carries,active,two,
      visibleRows:two?['P1',...((accepted&&canonical.slice(0,accepted+1).some(q=>q.multiplication.row==='P2'))?['P2']:[]),...((active?.phase==='add'||active?.phase==='answer'||accepted===canonical.length)?['RES']:[])]:['RES']};
  }
  function board(spec,state){
    const view=layout(spec,state);if(!view)return '';
    const {width,active,two}=view;
    const cell=(digit,col,classes='')=>'<span class="lm-mul-cell '+classes+'" data-column="'+col+'" style="grid-column:'+(width-col+1)+'">'+E(digit)+'</span>';
    const line=(name,values,sign='',carry=false)=>'<div class="lm-mul-row'+(carry?' lm-mul-carry':'')+'" data-mul-row="'+name+'" style="display:grid;grid-template-columns:1.3em repeat('+width+',1.3em)"><span class="lm-mul-sign">'+sign+'</span>'+Array.from({length:width},(_,i)=>width-i-1).map(col=>{
      let selected=false;
      if(active?.phase==='multiply')selected=name==='A'?col===active.operandColumn:name==='B'?col===active.multiplierColumn:carry?name===active.row&&col===active.col&&active.event==='carry':name===active.row&&col===active.col&&active.event==='write';
      else if(active?.phase==='add')selected=carry?name==='RES'&&col===active.col&&active.event==='carry':name==='RES'?col===active.col&&active.event==='write':['P1','P2'].includes(name)&&col===active.col&&active.event==='calculate';
      const present=Object.prototype.hasOwnProperty.call(values,col),value=present?values[col]:selected&&active?.phase==='add'&&active.event==='calculate'&&['P1','P2'].includes(name)?'0':selected&&name!=='A'&&name!=='B'?'□':'\u00a0';
      return cell(value,col,(selected?'lm-mul-active ':'')+(present?'lm-mul-filled':''));
    }).join('')+'</div>';
    const object=n=>Object.fromEntries(digits(n).map((x,i)=>[i,String(x)]));
    let html='<div class="lm-multiplication-board" role="group" aria-label="Умножение столбиком: '+view.a+' на '+view.b+'"><div class="lm-mul-paper">';
    for(const row of ['P1','P2','RES'])if(Object.keys(view.carries[row]).length||(active?.event==='carry'&&active.row===row)){
      const label=two?(row==='P1'?'Перенос для первой строки':row==='P2'?'Перенос для второй строки':'Перенос при сложении'):'Перенос';
      html+='<div class="lm-mul-carry-label">'+label+'</div>'+line(row,view.carries[row],'',true);
    }
    html+=line('A',object(view.a))+line('B',object(view.b),'×')+'<div class="lm-mul-line"></div>';
    for(const row of view.visibleRows){
      if(row==='RES'&&two)html+='<div class="lm-mul-line"></div>';
      html+=line(row,view.rows[row],two&&row==='P2'?'+':'');
    }
    return html+'</div></div>';
  }
  return Object.freeze({stages,has,make,plan,layout,board});
});
