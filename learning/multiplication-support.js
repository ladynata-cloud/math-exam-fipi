(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.MultiplicationSupport=api;
})(typeof globalThis==='undefined'?this:globalThis,function(){
  'use strict';
  const prefix='multiplication-division/';
  const entries={
    table:['multiplication-mixed','Повторить таблицу умножения'],
    mental:['course-multiply-two-digit','Умножать по частям'],
    column:['course-column-one-digit','Две цифры умножить на одну столбиком'],
    three:['course-column-three-by-one','Три цифры умножить на одну столбиком']
  };
  function pair(text,operation){
    if(typeof text!=='string')return null;
    const match=text.match(new RegExp('(\\d+(?:[.,]\\d+)?)\\s*'+operation+'\\s*(\\d+(?:[.,]\\d+)?)'));
    return match?match.slice(1).map(value=>Number(value.replace(',','.'))):null;
  }
  function divisor(task){
    if(!task||typeof task.divisor!=='string'||!/^\d+(?:[.,]\d+)?$/.test(task.divisor))return null;
    // The corner removes the divisor's comma before digit/product actions.
    return Number(task.divisor.replace(/[.,]/,''));
  }
  function forStep(spec,state){
    if(!spec||spec.family!=='division'||!state||state.view!=='practice'||state.completed||
      !Array.isArray(spec.steps)||!Number.isInteger(state.step)||state.step<0||state.step>=spec.steps.length||
      !Array.isArray(state.answers)||state.answers.length!==state.step)return [];
    // This micro-lesson uses legacy digit/product kinds for borrowing in
    // subtraction. Those actions are not multiplication practice.
    if(spec.contentId===prefix+'course-subtract')return [];
    const step=spec.steps[state.step];
    if(!step||!['digit','product','estimate'].includes(step.kind))return [];
    const groups=Array.isArray(spec.divisionTasks)?spec.divisionTasks:[];
    const group=groups.find(value=>value&&state.step>=value.startIndex&&state.step<value.endIndex);
    const product=pair(step.prompt,'[×·*]');
    let number;
    if(product){
      if(product.some(value=>!Number.isInteger(value)||value<0)||Math.min(...product)>9)return [];
      number=Math.max(...product);
    }else{
      const division=pair(step.prompt,':')||pair(group?.prompt,':')||pair(spec.task?.prompt,':');
      number=divisor(group?.task||spec.divisionTask)??division?.[1];
    }
    if(!Number.isInteger(number)||number<0)return [];
    const keys=['table'];
    if(number>=10&&number<=99)keys.push('mental','column');
    else if(number>=100&&number<=999)keys.push('three');
    return keys.map(key=>entries[key]).filter(([slug])=>prefix+slug!==spec.contentId).map(([slug,title])=>({
      id:'oge-basics:'+prefix+slug,title,url:'/trainers/oge-basics/'+prefix+slug+'.html'
    }));
  }
  return Object.freeze({forStep});
});
