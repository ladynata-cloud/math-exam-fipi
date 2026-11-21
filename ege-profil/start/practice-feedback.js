(function(root){
  'use strict';
  // Authored diagnostics for specific numeric misconceptions. No answer is
  // changed, accepted, stored or disclosed here; the caller owns first-attempt
  // and assistance accounting. Unknown task shapes keep the ordinary feedback.
  const finite=value=>typeof value==='number'&&Number.isFinite(value);
  const pair=value=>Array.isArray(value)&&value.length===2&&value.every(finite);
  const numbers=(object,keys)=>!!object&&keys.every(key=>finite(object[key]));
  const close=(a,b)=>finite(a)&&finite(b)&&Math.abs(a-b)<=Math.max(1e-9,8*Number.EPSILON*Math.max(Math.abs(a),Math.abs(b)));
  const positiveInteger=value=>Number.isSafeInteger(value)&&value>0;
  const M={
    direction:'Проверьте, не поменялись ли местами начало и конец вектора: из координаты конца вычитают координату начала.',
    length:'Проверьте, не остановились ли вы на квадрате длины. Для самой длины нужен неотрицательный квадратный корень.',
    scale:'Проверьте знак: отрицательный множитель меняет направление вектора, а длина умножается на его модуль.',
    denominator:'Проверьте знаменатель: в нём нужны все равновозможные исходы, включая подходящие, а не только неподходящие.',
    complement:'Проверьте, вероятность какого события вы нашли: в вопросе нужны неразобранные билеты. Сначала определите их количество.',
    withoutReplacement:'Проверьте, учтён ли вынутый жетон в знаменателе: общее количество жетонов тоже уменьшилось.',
    transfer:'Проверьте, не сохранился ли прежний знак свободного слагаемого: из обеих частей уравнения вычитают одно и то же число.',
    square:'Проверьте возведение обеих частей в квадрат: число справа от квадратного корня тоже нужно возвести в квадрат.',
    intercept:'Проверьте, не потерялось ли свободное слагаемое в формуле прямой. Одного произведения коэффициента наклона на x недостаточно.',
    slope:'Проверьте порядок отношения: изменение y делят на изменение x, в одном направлении от A к B.',
    principal:'Проверьте, не взяли ли вы снова первоначальный долг: проценты второго года начисляют на остаток после первого платежа.',
    lastInterest:'Проверьте последний период: между остатком после второго платежа и третьим платежом есть ещё одно начисление процентов.'
  };
  function number(input){
    if(typeof input!=='string'&&typeof input!=='number')return NaN;
    const source=String(input).trim();if(!source)return NaN;
    if(typeof root.ProfileCheck?.number==='function')return root.ProfileCheck.number(source);
    // Conservative fallback when this optional module is inspected alone.
    // Expressions not understood here simply receive no diagnostic.
    const text=source.replace(/−/g,'-').replace(/,/g,'.');
    if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:\s*\/\s*[+-]?(?:\d+(?:\.\d*)?|\.\d+))?$/.test(text))return NaN;
    const parts=text.split('/').map(Number);return parts.length===1?parts[0]:parts[0]/parts[1];
  }
  function describe(lesson,task){
    const m=task.meta;if(!m||typeof m!=='object'||Array.isArray(m))return null;
    const inLesson=(id,pattern)=>lesson.id===id&&pattern.test(task.id);
    const final=(answers,wrong,message)=>({answers,rules:[{step:answers.length-1,final:true,wrong,message}]});
    switch(m.kind){
      case 'displacement-coordinate':{
        if(!inLesson('vec-coordinates',/^vec-coordinates-(x|y|reverse)$/)||!pair(m.a)||!pair(m.b)||![0,1].includes(m.axis))return null;
        const value=m.b[m.axis]-m.a[m.axis];
        const first=task.id==='vec-coordinates-reverse'?-value:task.steps[0]?.answer;
        if(task.id!=='vec-coordinates-reverse'&&(!Array.isArray(task.steps[0]?.choices)||!task.steps[0].choices.includes(first)||typeof first!=='string'))return null;
        return final([first,value],-value,M.direction);
      }
      case 'vector-length':{
        if(!inLesson('vec-length',/^vec-length-(basic|negative|axis)$/)||!pair(m.v))return null;
        const square=m.v[0]**2+m.v[1]**2,value=Math.sqrt(square);
        return final(task.id==='vec-length-negative'?[m.v[0]**2,square,value]:[square,value],square,M.length);
      }
      case 'point-distance':
      case 'difference-length':{
        if(!(m.kind==='point-distance'?inLesson('vec-length',/^vec-length-points$/):inLesson('vec-operations',/^vec-operations-difference-length$/))||!pair(m.a)||!pair(m.b))return null;
        const sign=m.kind==='point-distance'?1:-1,dx=sign*(m.b[0]-m.a[0]),dy=sign*(m.b[1]-m.a[1]);
        return final([dx,dy,Math.hypot(dx,dy)],dx*dx+dy*dy,M.length);
      }
      case 'scaled-length':{
        if(!inLesson('vec-length',/^vec-length-scaled$/)||!numbers(m,['length','factor'])||m.length<=0||m.factor>=0)return null;
        return final([Math.abs(m.factor),m.length*Math.abs(m.factor)],m.length*m.factor,M.scale);
      }
      case 'classical':{
        if(!inLesson('prob-count',/^prob-count-[1-6]$/)||!positiveInteger(m.red)||!positiveInteger(m.blue))return null;
        const total=m.red+m.blue;
        return final([total,m.red,m.red/total],m.red/m.blue,M.denominator);
      }
      case 'complement-count':{
        if(!inLesson('prob-complement',/^prob-complement-count-(1|3|4|6)$/)||!positiveInteger(m.total)||!positiveInteger(m.studied)||m.studied>=m.total)return null;
        return final([m.total-m.studied,(m.total-m.studied)/m.total],m.studied/m.total,M.complement);
      }
      case 'afterdraw':{
        if(!inLesson('prob-conditional',/^prob-afterdraw-(1|4)$/)||!positiveInteger(m.total)||!positiveInteger(m.red)||m.red<2||m.red>=m.total)return null;
        return final([m.total-1,m.red-1,(m.red-1)/(m.total-1)],(m.red-1)/m.total,M.withoutReplacement);
      }
      case 'linear-equation':{
        if(!inLesson('eq-linear',/^eq-linear-[1-6]$/)||!numbers(m,['a','b','c','d'])||m.a===m.c)return null;
        const coefficient=m.a-m.c,right=m.d-m.b;
        return final([coefficient,right,right/coefficient],(m.d+m.b)/coefficient,M.transfer);
      }
      case 'root-equation':{
        if(!inLesson('eq-root',/^eq-root-[1-6]$/)||!numbers(m,['a','b','rhs'])||m.a===0||m.rhs<0)return null;
        const right=m.rhs*m.rhs-m.b;
        return final([-m.b/m.a,m.a>0?'≥':'≤',m.rhs*m.rhs,right,right/m.a],(m.rhs-m.b)/m.a,M.square);
      }
      case 'line-value':{
        if(!inLesson('fn-line',/^fn-line-[1-6]$/)||!pair(m.a)||!pair(m.b)||!finite(m.target)||m.a[0]===m.b[0])return null;
        const dx=m.b[0]-m.a[0],dy=m.b[1]-m.a[1],slope=dy/dx,intercept=m.a[1]-slope*m.a[0];
        return final([dx,dy,slope,intercept,slope*m.target+intercept],slope*m.target,M.intercept);
      }
      case 'tangent':{
        if(!inLesson('calc-tangent',/^calc-tangent-[1-6]$/)||!pair(m.a)||!pair(m.b)||!numbers(m,['x0','curve','value'])||m.a[0]===m.b[0]||m.a[1]===m.b[1])return null;
        const dx=m.b[0]-m.a[0],dy=m.b[1]-m.a[1];
        if(!close(m.value,m.a[1]+dy/dx*(m.x0-m.a[0])))return null;
        return final([dx,dy,dy/dx],dx/dy,M.slope);
      }
      case 'finance-authored':{
        if(!inLesson('finance-lesson-01-ledger',/^finance-630197-(guided|independent)$/)||m.family!=='last_payment_from_fixed_first_two'||m.sourceId!=='630197')return null;
        const p=m.parameters;
        if(!numbers(p,['principal_thousand','annual_rate_percent','first_two_payments_thousand'])||p.principal_thousand<=0||p.annual_rate_percent<=0||p.first_two_payments_thousand<=0)return null;
        const k=1+p.annual_rate_percent/100,g1=p.principal_thousand*k,b1=g1-p.first_two_payments_thousand,g2=b1*k,b2=g2-p.first_two_payments_thousand,last=b2*k;
        if(b1<=0||b2<=0)return null;
        return {answers:[g1,b1,g2,b2,last],rules:[{step:2,final:false,wrong:g1,message:M.principal},{step:4,final:true,wrong:b2,message:M.lastInterest}]};
      }
      default:return null;
    }
  }
  function forAnswer(options={}){
    if(!options||typeof options!=='object'||Array.isArray(options))return null;
    const {lesson,task,question,step,mode,input}=options;
    if(!lesson||!task||!question||!Array.isArray(lesson.tasks)||!lesson.tasks.includes(task)||typeof task.id!=='string'||!Array.isArray(task.steps)||!task.steps.length||!Number.isInteger(step)||!['guided','plan','independent'].includes(mode)||question.choices)return null;
    if(mode==='guided'){
      const authored=task.steps[step];
      if(!authored||question.prompt!==authored.prompt||question.answer!==authored.answer)return null;
    }else if(step!==0||question.answer!==task.answer)return null;
    try{
      const value=number(input);if(!finite(value)||!finite(question.answer))return null;
      if(typeof root.ProfileCheck?.check==='function'&&root.ProfileCheck.check(question.answer,input,question.choices,question))return null;
      if(close(value,question.answer))return null;
      const context=describe(lesson,task);if(!context||context.answers.length!==task.steps.length)return null;
      if(!context.answers.every((answer,index)=>typeof answer==='number'?close(answer,task.steps[index]?.answer):answer===task.steps[index]?.answer)||!close(context.answers.at(-1),task.answer))return null;
      const rule=context.rules.find(item=>(mode==='guided'?step===item.step:item.final)&&finite(item.wrong)&&!close(item.wrong,question.answer)&&close(value,item.wrong));
      return rule?.message||null;
    }catch(_){return null;}
  }
  const api={forAnswer};root.ProfilePracticeFeedback=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
